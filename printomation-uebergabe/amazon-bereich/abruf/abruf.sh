#!/bin/bash
# Amazon-Verkaufsdaten für Printomation (Bereich „Amazon") holen. Cron (crontab -l):
#   15 3 * * *    abruf.sh               täglich 03:15 UTC = 04:15 Berlin (Sommerzeit 05:15), weit vor dem Bestellabruf 11/12 Uhr:
#                                         fehlende Tage + die letzten 3 Tage neu, Katalog (Bilder,
#                                         Titel), Sicherung
#   */15 * * * *  abruf.sh --erststart   nur solange es noch keine Datenbank gibt (Backfill)
# „Jetzt von Amazon holen" im Reiter startet: abruf.sh --kurz (höchstens 10 Tage, ohne Sicherung).
# Ohne ../.env (eigene Zugangsdaten mit Berichts-Recht) passiert nichts.
cd "$(dirname "$0")" || exit 1
[ -f ../.env ] || exit 0

if [ ! -f data/business.db ]; then
  # Erster Lauf: rückwirkend ab 2025 füllen, zwei Spuren parallel (fetch.py von neu nach alt,
  # datakiosk_fill.py von alt nach neu, eigenes Rate-Limit) — zusammen ~2 Tage pro Minute
  echo "$(date -Is) Erststart: Backfill ab 2025-01-01"
  python3 fetch.py --backfill 2025-01-01 &
  sleep 90
  python3 datakiosk_fill.py
  wait
  exit 0
fi
[ "$1" = "--erststart" ] && exit 0

if [ "$1" = "--kurz" ]; then
  python3 fetch.py --max-days 10
  status=$?
  python3 katalog.py
  exit $status
fi

python3 fetch.py
python3 katalog.py
# Tägliche Sicherung der Datenbank (Experimente und Produktgruppen gibt es nur hier), 14 Tage
python3 -c "import sqlite3,sys; s=sqlite3.connect('data/business.db'); d=sqlite3.connect(sys.argv[1]); s.backup(d); d.close()" \
  "data/sicherungen/business-$(date +%F).db" && find data/sicherungen -name 'business-*.db' -mtime +14 -delete
