"""Katalog nachtragen (läuft nach dem Tagesabruf): Amazons Produktbilder, Farbe/Größe und fehlende Titel.

Der Sales-&-Traffic-Report enthält weder Titel noch Bilder. Braucht die SP-API-Rolle „Product Listing" —
fehlt sie (403), bleibt es beim Rückfall auf Titel und Vorschaubilder aus Printomations ASIN-Profilen.
Neu geholt werden ASINs ohne Eintrag und solche, deren Eintrag älter als 7 Tage ist (Bilder ändern sich).
"""
import logging
import sys
from datetime import datetime, timedelta, timezone

import config
import db
import spapi

log = logging.getLogger("katalog")


def main() -> int:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s",
                        handlers=[logging.FileHandler(config.DATA_DIR / "fetch.log")])
    conn = db.connect()
    grenze = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat(timespec="seconds")
    # Kind- und Eltern-ASINs (das Bild der Eltern-ASIN ist das Bild des ganzen Produkts)
    offen = [r[0] for r in conn.execute(
        """SELECT a FROM (SELECT child_asin a FROM products UNION SELECT parent_asin FROM products WHERE parent_asin <> '')
           WHERE a NOT IN (SELECT asin FROM katalog WHERE abgerufen > ?) ORDER BY a""", (grenze,))]
    if not offen:
        return 0
    try:
        items = spapi.get_catalog_items(offen)
    except spapi.RoleError:
        log.info("Katalog: Rolle „Product Listing“ fehlt — %s ASINs ohne Amazon-Bild (Rückfall: ASIN-Profile)", len(offen))
        return 0
    except Exception as exc:
        log.warning("Katalog-Abruf fehlgeschlagen: %s", exc)
        return 1
    db.store_catalog(conn, items)
    titel = db.update_titles(conn, {a: i["titel"] for a, i in items.items() if i.get("titel")})
    log.info("Katalog: %s von %s ASINs geholt (%s mit Bild), %s Titel ergänzt",
             len(items), len(offen), sum(1 for i in items.values() if i.get("bild")), titel)
    return 0


if __name__ == "__main__":
    sys.exit(main())
