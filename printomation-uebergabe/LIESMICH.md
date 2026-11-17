# Printomation – Übergabe (Stand 29.10.2026)

```
printomation/      Haupt-App: Bestellabruf (Amazon SP-API), Layout-Editor, Laser-Export (DXF/BMP)
amazon-bereich/    Modul „Amazon“ (Verkäufe, Experimente), wird von printomation eingebunden
doku/BETRIEB.md    Server, pm2, nginx, Samba, Laser-PC, Deploy
doku/notizen/      Entscheidungen, Fallstricke, Hintergründe aus der bisherigen Entwicklung (INHALT.md)
doku/server/       nginx-Site, Samba-Freigabe, Crontab (so wie sie live laufen)
```

## Lokal starten

```
cd printomation
npm install
cp .env.example .env      # Amazon-Zugangsdaten bekommst du getrennt
npm start                 # http://localhost:3002/layout-editor.html
```

Voraussetzungen: Node 24, `pdftoppm` (poppler-utils), Chromium für den Auto-Export
(`CHROMIUM_PATH`, Standard `/snap/bin/chromium`). Ohne `.env` startet die App, der Abruf bei Amazon geht dann nicht.

`src/daten/schedule.json` ist absichtlich leer, damit lokal kein automatischer Abruf läuft.
Live stehen dort die täglichen Abrufzeiten (Mo–Fr 12:00, Sa/So 11:00).

## Beispieldaten (echt – vertraulich behandeln, nicht weitergeben, nicht in ein öffentliches Repo)

- `printomation/src/public/2026-10-29/`: alle Bestellungen dieses Tages mit Kundenfotos und Bestell-JSON,
  dazu `src/daten/session.json` passend gefiltert. Damit lässt sich Füllen und Export im Editor durchspielen.
- `printomation/src/testfoto/`: Standardfoto der F02-Testbleche.
- `printomation/src/ezd-sicherung/`: aktuelle Ezcad-Vorlagen F02_Schw_V5–V7.
- `amazon-bereich/abruf/data/business.db`: Verkaufszahlen (SQLite) für den Amazon-Bereich.

Nicht enthalten: Zugangsdaten (`.env` beider Teile), Logs, ältere Bestelltage und Exporte.

## Git

Das Paket ist ein Git-Repo mit einem Anfangs-Commit. Kundendaten, Laufzeitdaten und `.env` stehen in
`.gitignore` und sind nicht eingecheckt. Änderungen bitte als Commits/Branch zurückgeben.

## Hinweise

- `printomation/src/index.js` bindet den Amazon-Bereich über den absoluten Pfad
  `/var/www/printomation/amazon-bereich/server` ein (in try/catch). Lokal fehlt er dann einfach,
  oder du legst die Ordner unter denselben Pfad.
- `src/tools/*.js` laden puppeteer über einen absoluten Serverpfad.
- Die Notizen sind über Monate entstanden. Pfade darin können veraltet sein: bis 22.10.2026 hieß der
  App-Ordner `/var/www/printomation/gravurtastisch-orders`, heute `/var/www/printomation/printomation`.
