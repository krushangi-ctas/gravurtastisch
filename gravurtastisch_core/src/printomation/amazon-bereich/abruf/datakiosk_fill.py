"""Zweite Abruf-Spur über Amazons Data Kiosk API (GraphQL).

Data Kiosk hat ein EIGENES Rate-Limit-Kontingent (~1 Query/min), unabhängig
von der Reports-API. Diese Spur läuft parallel zu fetch.py: sie arbeitet vom
ältesten Tag AUFWÄRTS, fetch.py vom neuesten ABWÄRTS — koordiniert über
fetch_log treffen sich beide in der Mitte. Zusammen: ~2 Tage/min statt 1.

Die Daten sind identisch mit dem Sales&Traffic-Report (verifiziert am
14.07.2026 gegen CSV-geprüfte Tage: 0 Abweichungen).

Phase 2 füllt account_daily (Konto-Tageswerte) über gebündelte
salesAndTrafficByDate-Queries, da eine Data-Kiosk-Query nur ein Feld
enthalten darf.

Aufruf: python3 datakiosk_fill.py (startet abruf.sh beim Erststart)
"""
import fcntl
import gzip
import json
import logging
import sys
import time
from datetime import date, timedelta

import config
import db
import fetch
import spapi

log = logging.getLogger("datakiosk")

DK = f"{config.SP_API_ENDPOINT}/dataKiosk/2023-11-15"

ASIN_QUERY = '''query {
  analytics_salesAndTraffic_2024_04_24 {
    salesAndTrafficByAsin(startDate: "%(day)s", endDate: "%(day)s", aggregateBy: CHILD,
                          marketplaceIds: ["%(mp)s"]) {
      parentAsin childAsin
      sales { unitsOrdered unitsOrderedB2B totalOrderItems totalOrderItemsB2B
              orderedProductSales { amount } orderedProductSalesB2B { amount } }
      traffic { sessions sessionsB2B pageViews pageViewsB2B buyBoxPercentage
                unitSessionPercentage unitSessionPercentageB2B }
    }
  }
}'''

DATE_QUERY = '''query {
  analytics_salesAndTraffic_2024_04_24 {
    salesAndTrafficByDate(startDate: "%(start)s", endDate: "%(end)s", aggregateBy: DAY,
                          marketplaceIds: ["%(mp)s"]) {
      startDate
      sales { orderedProductSales { amount } unitsOrdered totalOrderItems }
      traffic { sessions pageViews buyBoxPercentage unitSessionPercentage }
    }
  }
}'''


def create_query(gql: str) -> str:
    resp = spapi._request("POST", f"{DK}/queries", json_body={"query": gql})
    return resp.json()["queryId"]


def wait_query(query_id: str, poll_seconds: int = 10, timeout_minutes: int = 20) -> dict:
    deadline = time.time() + timeout_minutes * 60
    while time.time() < deadline:
        info = spapi._request("GET", f"{DK}/queries/{query_id}").json()
        status = info.get("processingStatus")
        if status == "DONE":
            return info
        if status in ("FATAL", "CANCELLED"):
            raise spapi.ReportFailed(f"Data-Kiosk-Query {query_id} endete mit {status}")
        time.sleep(poll_seconds)
    raise spapi.SpApiError(f"Data-Kiosk-Query {query_id} nach {timeout_minutes} min nicht fertig")


def download_lines(document_id: str) -> list[dict]:
    doc = spapi._request("GET", f"{DK}/documents/{document_id}").json()
    raw = spapi.download_file(doc["documentUrl"])
    try:
        text = gzip.decompress(raw).decode("utf-8")
    except OSError:
        text = raw.decode("utf-8")
    return [json.loads(line) for line in text.splitlines() if line.strip()]


def to_report(records: list[dict]) -> dict:
    """Data-Kiosk-Zeilen in das Format des Sales&Traffic-Reports übersetzen,
    damit db.store_report unverändert benutzt werden kann."""
    return {
        "salesAndTrafficByAsin": [
            {
                "parentAsin": r.get("parentAsin"),
                "childAsin": r.get("childAsin"),
                "sku": "",
                "salesByAsin": r.get("sales", {}),
                "trafficByAsin": r.get("traffic", {}),
            }
            for r in records
        ],
        "salesAndTrafficByDate": [],
    }


def day_done(conn, day: str) -> bool:
    return conn.execute(
        "SELECT 1 FROM fetch_log WHERE date=? AND status IN ('ok','empty')", (day,)
    ).fetchone() is not None


def pending_days_ascending(conn) -> list[str]:
    start_str = db.get_meta(conn, "start_date")
    end = fetch.today_market() - timedelta(days=config.DATA_LAG_DAYS)
    start = date.fromisoformat(start_str) if start_str else end
    days = []
    cursor = start
    while cursor <= end:
        day = cursor.isoformat()
        if not day_done(conn, day):
            days.append(day)
        cursor += timedelta(days=1)
    return days


def fill_products(conn) -> int:
    """Phase 1: Produkt-Tageswerte, ältester Tag zuerst (Pipeline wie fetch.py)."""
    days = pending_days_ascending(conn)
    if not days:
        log.info("DK: keine offenen Tage.")
        return 0
    log.info("DK: %s Tag(e) abzurufen (%s … %s)", len(days), days[0], days[-1])

    processed = 0
    consecutive_errors = 0

    def process(day: str, query_id: str) -> bool:
        nonlocal processed, consecutive_errors
        try:
            try:
                info = wait_query(query_id)
                doc_id = info.get("dataDocumentId")
                records = download_lines(doc_id) if doc_id else []
            except spapi.ReportFailed as exc:
                log.info("DK %s: %s — als 'leer' verbucht", day, exc)
                records = []
            rows = db.store_report(conn, day, to_report(records) if records else None)
            log.info("DK %s: gespeichert (%s Produktzeilen)", day, rows)
            processed += 1
            consecutive_errors = 0
            return True
        except Exception as exc:
            log.error("DK %s: %s", day, exc)
            db.mark_error(conn, day)
            consecutive_errors += 1
            if consecutive_errors >= 5:
                log.error("DK: 5 Fehler in Folge — Lauf abgebrochen.")
                return False
            return True

    in_flight: tuple[str, str] | None = None
    for day in days:
        if day_done(conn, day):  # von der Reports-Spur inzwischen erledigt
            if in_flight and not process(*in_flight):
                return processed
            in_flight = None
            continue
        try:
            qid = create_query(ASIN_QUERY % {"day": day, "mp": config.MARKETPLACE_ID})
            log.info("DK %s: Query %s angefordert", day, qid)
        except (spapi.AuthError, spapi.RoleError):
            raise
        except Exception as exc:
            log.error("DK %s: Anforderung fehlgeschlagen: %s", day, exc)
            db.mark_error(conn, day)
            qid = None
            consecutive_errors += 1
            if consecutive_errors >= 5:
                log.error("DK: 5 Fehler in Folge — Lauf abgebrochen.")
                if in_flight:
                    process(*in_flight)
                return processed
        if in_flight and not process(*in_flight):
            return processed
        in_flight = (day, qid) if qid else None
    if in_flight:
        process(*in_flight)
    return processed


def fill_account(conn) -> int:
    """Phase 2: fehlende Konto-Tageswerte in 60-Tage-Blöcken nachladen."""
    start_str = db.get_meta(conn, "start_date")
    if not start_str:
        return 0
    end = fetch.today_market() - timedelta(days=config.DATA_LAG_DAYS)
    have = {r[0] for r in conn.execute("SELECT date FROM account_daily")}
    missing = []
    cursor = date.fromisoformat(start_str)
    while cursor <= end:
        if cursor.isoformat() not in have:
            missing.append(cursor)
        cursor += timedelta(days=1)
    if not missing:
        log.info("DK: Konto-Tageswerte vollständig.")
        return 0

    # zusammenhängende Blöcke bilden, max. 60 Tage
    blocks: list[tuple[date, date]] = []
    block_start = prev = missing[0]
    for d in missing[1:]:
        if (d - prev).days > 1 or (prev - block_start).days >= 59:
            blocks.append((block_start, prev))
            block_start = d
        prev = d
    blocks.append((block_start, prev))
    log.info("DK: %s fehlende Konto-Tage in %s Block/Blöcken", len(missing), len(blocks))

    written = 0
    for b_start, b_end in blocks:
        qid = create_query(DATE_QUERY % {"start": b_start, "end": b_end, "mp": config.MARKETPLACE_ID})
        try:
            info = wait_query(qid)
        except spapi.ReportFailed as exc:
            log.error("DK Konto-Block %s–%s: %s", b_start, b_end, exc)
            continue
        doc_id = info.get("dataDocumentId")
        for rec in (download_lines(doc_id) if doc_id else []):
            sales, traffic = rec.get("sales", {}), rec.get("traffic", {})
            conn.execute(
                """INSERT OR REPLACE INTO account_daily
                   (date, sessions, page_views, units_ordered, order_items,
                    sales_eur, buy_box_pct, unit_session_pct)
                   VALUES (?,?,?,?,?,?,?,?)""",
                (
                    rec.get("startDate"),
                    traffic.get("sessions"),
                    traffic.get("pageViews"),
                    sales.get("unitsOrdered"),
                    sales.get("totalOrderItems"),
                    (sales.get("orderedProductSales") or {}).get("amount"),
                    traffic.get("buyBoxPercentage"),
                    traffic.get("unitSessionPercentage"),
                ),
            )
            written += 1
        conn.commit()
        log.info("DK Konto-Block %s–%s gespeichert", b_start, b_end)
    return written


def main() -> int:
    fetch.setup_logging()
    lock = open(config.DATA_DIR / "datakiosk.lock", "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log.info("DK: läuft bereits — übersprungen.")
        return 0
    conn = db.connect()
    try:
        fill_products(conn)
        fill_account(conn)
    except (spapi.AuthError, spapi.RoleError) as exc:
        log.error("DK Abbruch: %s", exc)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
