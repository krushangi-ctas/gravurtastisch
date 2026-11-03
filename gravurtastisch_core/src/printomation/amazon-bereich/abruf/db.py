"""SQLite-Schema und Upserts für die Sales&Traffic-Tageswerte."""
import json
import logging
import sqlite3
from datetime import datetime, timezone
from pathlib import Path

import config

log = logging.getLogger("db")

SCHEMA = """
CREATE TABLE IF NOT EXISTS asin_daily (
    date TEXT NOT NULL,
    parent_asin TEXT,
    child_asin TEXT NOT NULL,
    sku TEXT NOT NULL DEFAULT '',
    sessions INTEGER,
    sessions_b2b INTEGER,
    page_views INTEGER,
    page_views_b2b INTEGER,
    buy_box_pct REAL,
    units_ordered INTEGER,
    units_ordered_b2b INTEGER,
    unit_session_pct REAL,
    unit_session_pct_b2b REAL,
    sales_eur REAL,
    sales_b2b_eur REAL,
    order_items INTEGER,
    order_items_b2b INTEGER,
    PRIMARY KEY (date, child_asin, sku)
);
CREATE TABLE IF NOT EXISTS account_daily (
    date TEXT PRIMARY KEY,
    sessions INTEGER,
    page_views INTEGER,
    units_ordered INTEGER,
    order_items INTEGER,
    sales_eur REAL,
    buy_box_pct REAL,
    unit_session_pct REAL
);
CREATE TABLE IF NOT EXISTS products (
    child_asin TEXT PRIMARY KEY,
    parent_asin TEXT,
    sku TEXT,
    title TEXT
);
CREATE TABLE IF NOT EXISTS fetch_log (
    date TEXT PRIMARY KEY,
    status TEXT NOT NULL,          -- ok | empty | error
    fetched_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS meta (
    key TEXT PRIMARY KEY,
    value TEXT
);
CREATE TABLE IF NOT EXISTS experiments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    child_asin TEXT NOT NULL,
    change_type TEXT NOT NULL,     -- Preis | Titel | Hauptbild | A+ Inhalt | PPC-Kampagne | …
    start_date TEXT NOT NULL,
    end_date TEXT,                 -- NULL = Test läuft noch
    old_value TEXT,
    new_value TEXT,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'laufend',   -- laufend | abgeschlossen
    created_at TEXT NOT NULL
);
-- Katalog (katalog.py, braucht die SP-API-Rolle „Product Listing"): Hauptbild, alle Bilder (JSON), Farbe/Größe
CREATE TABLE IF NOT EXISTS katalog (
    asin TEXT PRIMARY KEY,
    titel TEXT,
    bild TEXT,
    bilder TEXT,
    farbe TEXT,
    groesse TEXT,
    abgerufen TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_asin_daily_asin ON asin_daily (child_asin, date);
"""


def connect(db_path: Path | None = None) -> sqlite3.Connection:
    # timeout: zwei Abruf-Spuren (Reports-API + Data Kiosk) schreiben parallel
    conn = sqlite3.connect(db_path or config.DB_PATH, timeout=30)
    conn.executescript(SCHEMA)
    return conn


def _money(value) -> float | None:
    if isinstance(value, dict):
        return value.get("amount")
    return value


def store_report(conn: sqlite3.Connection, day: str, report: dict | None) -> int:
    """Schreibt einen Tages-Report (oder None = leer) idempotent in die DB.

    Gibt die Zahl der Produktzeilen zurück.
    """
    try:
        return _store_report(conn, day, report)
    except Exception:
        # Nichts Halbes stehen lassen: das folgende mark_error() würde sonst den schon gelöschten Tag
        # festschreiben — und weil der Tag „ok“ bleibt, holte ihn kein Lauf mehr nach
        conn.rollback()
        raise


def _store_report(conn: sqlite3.Connection, day: str, report: dict | None) -> int:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    if report is None:
        conn.execute(
            "INSERT OR REPLACE INTO fetch_log (date, status, fetched_at) VALUES (?, 'empty', ?)",
            (day, now),
        )
        conn.commit()
        return 0

    # Alte Zeilen des Tages entfernen: ein erneuter Abruf ersetzt den Tag vollständig
    conn.execute("DELETE FROM asin_daily WHERE date = ?", (day,))

    rows = 0
    for entry in report.get("salesAndTrafficByAsin", []):
        sales = entry.get("salesByAsin", {})
        traffic = entry.get("trafficByAsin", {})
        conn.execute(
            """INSERT OR REPLACE INTO asin_daily
               (date, parent_asin, child_asin, sku, sessions, sessions_b2b,
                page_views, page_views_b2b, buy_box_pct,
                units_ordered, units_ordered_b2b, unit_session_pct, unit_session_pct_b2b,
                sales_eur, sales_b2b_eur, order_items, order_items_b2b)
               VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                day,
                entry.get("parentAsin"),
                entry.get("childAsin"),
                entry.get("sku") or "",
                traffic.get("sessions"),
                traffic.get("sessionsB2B"),
                traffic.get("pageViews"),
                traffic.get("pageViewsB2B"),
                traffic.get("buyBoxPercentage"),
                sales.get("unitsOrdered"),
                sales.get("unitsOrderedB2B"),
                traffic.get("unitSessionPercentage"),
                traffic.get("unitSessionPercentageB2B"),
                _money(sales.get("orderedProductSales")),
                _money(sales.get("orderedProductSalesB2B")),
                sales.get("totalOrderItems"),
                sales.get("totalOrderItemsB2B"),
            ),
        )
        rows += 1
        # Produktverzeichnis aktuell halten — Eltern-ASIN und SKU nur vom neuesten Tag der ASIN (die Tage
        # kommen neu→alt bzw. im Backfill alt→neu; sonst gewänne der zuletzt geholte, nicht der jüngste).
        # Titel und SKUs nie mit leeren Werten überschreiben.
        conn.execute(
            """INSERT INTO products (child_asin, parent_asin, sku, title)
               VALUES (?, ?, ?, NULL)
               ON CONFLICT(child_asin) DO UPDATE SET
                 parent_asin = COALESCE(excluded.parent_asin, products.parent_asin),
                 sku = COALESCE(NULLIF(excluded.sku, ''), products.sku)
               WHERE ? >= (SELECT MAX(date) FROM asin_daily WHERE child_asin = excluded.child_asin)""",
            (entry.get("childAsin"), entry.get("parentAsin"), entry.get("sku") or "", day),
        )

    for entry in report.get("salesAndTrafficByDate", []):
        sales = entry.get("salesByDate", {})
        traffic = entry.get("trafficByDate", {})
        conn.execute(
            """INSERT OR REPLACE INTO account_daily
               (date, sessions, page_views, units_ordered, order_items,
                sales_eur, buy_box_pct, unit_session_pct)
               VALUES (?,?,?,?,?,?,?,?)""",
            (
                entry.get("date", day),
                traffic.get("sessions"),
                traffic.get("pageViews"),
                sales.get("unitsOrdered"),
                sales.get("totalOrderItems"),
                _money(sales.get("orderedProductSales")),
                traffic.get("buyBoxPercentage"),
                traffic.get("unitSessionPercentage"),
            ),
        )

    conn.execute(
        "INSERT OR REPLACE INTO fetch_log (date, status, fetched_at) VALUES (?, 'ok', ?)",
        (day, now),
    )
    conn.commit()
    return rows


def mark_error(conn: sqlite3.Connection, day: str) -> None:
    # Ein Tag mit Daten bleibt 'ok'/'empty', wenn nur das Nachladen scheitert (die alten
    # Zeilen sind ja noch da) — sonst stünde er fälschlich als Fehler da. Die jüngsten
    # Tage lädt fetch.py ohnehin bei jedem Lauf erneut.
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    conn.execute(
        """INSERT INTO fetch_log (date, status, fetched_at) VALUES (?, 'error', ?)
           ON CONFLICT(date) DO UPDATE SET status = 'error', fetched_at = excluded.fetched_at
           WHERE fetch_log.status NOT IN ('ok', 'empty')""",
        (day, now),
    )
    conn.commit()


def get_meta(conn: sqlite3.Connection, key: str) -> str | None:
    row = conn.execute("SELECT value FROM meta WHERE key = ?", (key,)).fetchone()
    return row[0] if row else None


def set_meta(conn: sqlite3.Connection, key: str, value: str) -> None:
    conn.execute("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)", (key, value))
    conn.commit()


def update_titles(conn: sqlite3.Connection, titles: dict[str, str]) -> int:
    """Fehlende Produkttitel (z.B. aus der Catalog-API) nachtragen — nie überschreiben."""
    updated = 0
    for asin, title in titles.items():
        cur = conn.execute(
            "UPDATE products SET title = ? WHERE child_asin = ? AND (title IS NULL OR title = '')",
            (title, asin),
        )
        updated += cur.rowcount
    conn.commit()
    return updated


def store_catalog(conn: sqlite3.Connection, items: dict[str, dict]) -> None:
    """Katalog-Einträge (Bilder, Farbe/Größe) speichern bzw. erneuern."""
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    conn.executemany(
        "INSERT OR REPLACE INTO katalog (asin, titel, bild, bilder, farbe, groesse, abgerufen) VALUES (?,?,?,?,?,?,?)",
        [(a, i.get("titel"), i.get("bild"), json.dumps(i.get("bilder") or []), i.get("farbe"), i.get("groesse"), now)
         for a, i in items.items()],
    )
    conn.commit()
