"""Abruf-CLI: holt fehlende Tages-Reports und schreibt sie in die SQLite-DB.

Aufrufe:
    python fetch.py                      # Catch-up: alle fehlenden Tage bis heute-2
    python fetch.py --backfill 2025-01-01   # Startdatum setzen und rückwirkend füllen
    python fetch.py --max-days 5         # höchstens 5 Tage in diesem Lauf (Kurzabruf „Jetzt von Amazon holen“)
    python fetch.py --status             # nur Stand anzeigen, nichts abrufen

Fehlende Tage werden vom neuesten zum ältesten geholt (aktuelle Daten zuerst,
Backfill läuft dann in die Vergangenheit weiter). Jeder Tag ist ein eigener
Report (Rate-Limit ~1/min ⇒ Backfill ab Jan 2025 dauert ~9 Stunden, ist aber
jederzeit abbrech- und fortsetzbar).
"""
import argparse
import fcntl
import logging
import sys
from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

import config
import db
import spapi

log = logging.getLogger("fetch")


def setup_logging() -> None:
    fmt = logging.Formatter("%(asctime)s %(levelname)s %(message)s", "%Y-%m-%d %H:%M:%S")
    root = logging.getLogger()
    root.setLevel(logging.INFO)
    for handler in (logging.StreamHandler(), logging.FileHandler(config.DATA_DIR / "fetch.log")):
        handler.setFormatter(fmt)
        root.addHandler(handler)


def today_market() -> date:
    return datetime.now(ZoneInfo(config.MARKETPLACE_TZ)).date()


def pending_days(conn) -> list[str]:
    """Abzurufende Tage, neueste zuerst: fehlende/fehlerhafte Tage plus die
    jüngsten REFRESH_DAYS Tage (Traffic-Daten reifen 2-3 Tage nach)."""
    start_str = db.get_meta(conn, "start_date")
    end = today_market() - timedelta(days=config.DATA_LAG_DAYS)
    start = (
        date.fromisoformat(start_str)
        if start_str
        else end - timedelta(days=config.DEFAULT_START_OFFSET_DAYS)
    )
    if start > end:
        return []

    done = {
        row[0]
        for row in conn.execute("SELECT date FROM fetch_log WHERE status IN ('ok', 'empty')")
    }
    refresh = {(end - timedelta(days=i)).isoformat() for i in range(config.REFRESH_DAYS)}

    days = []
    cursor = end
    while cursor >= start:
        day = cursor.isoformat()
        if day not in done or day in refresh:
            days.append(day)
        cursor -= timedelta(days=1)
    return days


# Report-Nummern, die beim letzten Lauf nach 20 min noch nicht fertig waren. Statt sie
# wegzuwerfen und neu anzufordern (Rate-Limit, Stau), fragt der nächste Lauf dieselbe
# Nummer weiter ab. Älter als OPEN_REPORT_MAX_HOURS → doch neu anfordern.
OPEN_REPORT_MAX_HOURS = 72


def open_report(conn, day: str) -> str | None:
    raw = db.get_meta(conn, f"offen:{day}")
    if not raw:
        return None
    report_id, _, saved_at = raw.partition("|")
    try:
        age = datetime.now() - datetime.fromisoformat(saved_at)
    except ValueError:
        return None
    return report_id if age < timedelta(hours=OPEN_REPORT_MAX_HOURS) else None


def forget_open_report(conn, day: str) -> None:
    conn.execute("DELETE FROM meta WHERE key = ?", (f"offen:{day}",))
    conn.commit()


def run(max_days: int | None = None) -> int:
    """Holt ausstehende Tage. Rückgabe: Anzahl erfolgreich verarbeiteter Tage."""
    # Sperre gegen parallele Läufe (Cron + Kurzabruf + Backfill teilen sich
    # sonst das Rate-Limit und holen dieselben Tage doppelt)
    lock = open(config.DATA_DIR / "fetch.lock", "w")
    try:
        fcntl.flock(lock, fcntl.LOCK_EX | fcntl.LOCK_NB)
    except BlockingIOError:
        log.info("Ein anderer Abruf läuft bereits — dieser Lauf wird übersprungen.")
        return 0

    conn = db.connect()

    days = pending_days(conn)
    if max_days is not None:
        days = days[:max_days]
    if not days:
        log.info("Alles aktuell — nichts abzurufen.")
        return 0

    log.info("%s Tag(e) abzurufen (%s … %s)", len(days), days[0], days[-1])
    processed = 0
    consecutive_errors = 0

    def process(day: str, report_id: str) -> bool:
        """Wartet auf einen bereits angeforderten Report, lädt und speichert ihn.
        False = zu viele Fehler in Folge, Lauf abbrechen."""
        nonlocal processed, consecutive_errors
        try:
            try:
                document_id = spapi.wait_for_report(report_id)
                report = spapi.download_report(document_id)
            except spapi.ReportFailed as exc:
                log.info("%s: %s — als 'leer' verbucht", day, exc)
                report = None
            rows = db.store_report(conn, day, report)
            forget_open_report(conn, day)
            log.info("%s: gespeichert (%s Produktzeilen)", day, rows)
            processed += 1
            consecutive_errors = 0
            return True
        except Exception as exc:  # einzelner Tag darf den Lauf nicht stoppen
            log.error("%s: %s", day, exc)
            db.mark_error(conn, day)
            if isinstance(exc, spapi.ReportTimeout):
                db.set_meta(conn, f"offen:{day}", f"{report_id}|{datetime.now().isoformat(timespec='seconds')}")
                log.info("%s: Report %s wird beim nächsten Lauf weiter abgefragt", day, report_id)
            consecutive_errors += 1
            if consecutive_errors >= 5:
                log.error("5 Fehler in Folge — Lauf abgebrochen, Rest beim nächsten Mal.")
                return False
            return True

    # Pipeline: erst den Report für Tag N+1 anfordern (das Warten aufs
    # Rate-Limit-Token dominiert, ~60s), dann Tag N verarbeiten — dessen
    # Report ist bei Amazon inzwischen fertig geworden. So kostet jeder Tag
    # nur das Rate-Limit statt Rate-Limit + Generierungszeit.
    refresh_set = set(days[: config.REFRESH_DAYS])
    in_flight: tuple[str, str] | None = None
    for day in days:
        # Zweite Abruf-Spur (datakiosk_fill.py) könnte den Tag inzwischen
        # geholt haben — dann Token nicht verschwenden
        if day not in refresh_set and conn.execute(
            "SELECT 1 FROM fetch_log WHERE date=? AND status IN ('ok','empty')", (day,)
        ).fetchone():
            if in_flight and not process(*in_flight):
                return processed
            in_flight = None
            continue
        try:
            report_id = open_report(conn, day)
            if report_id:
                log.info("%s: Report %s vom letzten Lauf wird weiter abgefragt", day, report_id)
            else:
                report_id = spapi.create_report(day)
                log.info("%s: Report %s angefordert", day, report_id)
        except (spapi.AuthError, spapi.RoleError) as exc:
            log.error("Abbruch: %s", exc)
            raise
        except Exception as exc:
            log.error("%s: Anforderung fehlgeschlagen: %s", day, exc)
            db.mark_error(conn, day)
            report_id = None
            consecutive_errors += 1
            if consecutive_errors >= 5:
                log.error("5 Fehler in Folge — Lauf abgebrochen, Rest beim nächsten Mal.")
                if in_flight:
                    process(*in_flight)
                return processed

        if in_flight and not process(*in_flight):
            return processed
        in_flight = (day, report_id) if report_id else None

    if in_flight:
        process(*in_flight)
    return processed


def print_status() -> None:
    conn = db.connect()
    total, ok, empty, err = conn.execute(
        """SELECT COUNT(*),
                  SUM(status = 'ok'), SUM(status = 'empty'), SUM(status = 'error')
           FROM fetch_log"""
    ).fetchone()
    span = conn.execute("SELECT MIN(date), MAX(date) FROM asin_daily").fetchone()
    rows = conn.execute("SELECT COUNT(*) FROM asin_daily").fetchone()[0]
    start = db.get_meta(conn, "start_date") or "(nicht gesetzt)"
    print(f"Backfill-Start:   {start}")
    print(f"Geholte Tage:     {total or 0} (ok: {ok or 0}, leer: {empty or 0}, Fehler: {err or 0})")
    print(f"Datenzeitraum:    {span[0]} … {span[1]}" if span[0] else "Datenzeitraum:    (noch keine Daten)")
    print(f"Produktzeilen:    {rows}")
    print(f"Noch ausstehend:  {len(pending_days(conn))} Tag(e)")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--backfill", metavar="YYYY-MM-DD", help="Startdatum setzen und rückwirkend füllen")
    parser.add_argument("--max-days", type=int, default=None, help="max. Tage in diesem Lauf")
    parser.add_argument("--status", action="store_true", help="nur Stand anzeigen")
    args = parser.parse_args()

    setup_logging()

    if args.status:
        print_status()
        return 0

    if args.backfill:
        date.fromisoformat(args.backfill)  # validieren
        conn = db.connect()
        db.set_meta(conn, "start_date", args.backfill)
        conn.close()
        log.info("Backfill-Startdatum gesetzt: %s", args.backfill)

    try:
        run(max_days=args.max_days)
    except (spapi.AuthError, spapi.RoleError):
        return 2
    print_status()
    return 0


if __name__ == "__main__":
    sys.exit(main())
