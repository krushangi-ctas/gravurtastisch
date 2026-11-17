---
name: durchsicht-2026-10-26-komplett
description: "Komplett-Durchsicht 26.10.2026 (doppelte Funktionen, Code, Sicherheit) — LIVE seit ~10:28 Berlin, VERSEHENTLICH ohne Freigabe eingespielt; Rückfall-Tarball sicherungen/2026-10-26-vor-komplett-durchsicht.tar.gz"
metadata:
  type: project
---

Auftrag 26.10. abends (Nutzer ging nach Hause): „ein letztes Mal alles durchgehen — doppelte Funktionen, Code, alles“.

**Ergebnis der Prüfung:** keine unbenutzten Top-Level-Funktionen (eigenes acorn-Skript, Aufrufe auch aus HTML/Template-Strings gezählt), keine doppelten Funktionsnamen oder Routen. Kopierte Blöcke ab 6 Zeilen gibt es nur zwischen tools/trockenlauf.js und tools/bedien-test.js (eigenständige Skripte, gelassen). eslint mit Fehlerregeln: 0. Kein totes CSS (scheinbar ungenutzte Klassen werden dynamisch gebaut). Kundentexte werden überall escaped.

**Geändert (LIVE):** Herkunftsprüfung gegen CSRF in index.js (ändernde Anfragen und GET /start-cron nur same-origin per Sec-Fetch-Site/Origin; curl ohne Header geht durch). /motive/upload schreibt erst nach tmp/motiv-upload und prüft dort — ein kaputter Upload überschrieb vorher das Motiv gleichen Namens. /fonts/upload lehnt mit 400 ab, wenn nichts angenommen wurde. /reload-order: scheitert der Download, wird die Queue-Datei entfernt (sonst gravierte der nächste Tageslauf die Reklamation mit). Ohne Ordner kommt 422, ab 28 Tagen mit „Amazon hat die Gravurdaten nicht mehr — Ohne Bestellung“ und einem Knopf im Editor, der den Namen vorbelegt. Mit altem Ordner gibt es den Hinweis „zuletzt geladener Stand“. Die 03:00-Nacht-Sicherung läuft auch dann, wenn das Aufräumen übersprungen wird. Gemeinsame Helfer: `artikelJsonName` (read-orders, auch asin-check und index.js), `reklaZwischenspeicherLeeren`, `_ddAsinsImEditor` über `_layoutAsinSet`. Das ✕ im Reiter Schriften fragt jetzt vor dem Löschen. Waltograph.ttf ist zurück: sie fehlte seit dem Einspielen am 23.10. 15:56 UTC (Zeitstempel von fonts/), die Bestellungen vom 24./25.10. luden die Schrift von Amazon.

**Geprüft:** Prüfstand-Kopie auf 3012 mit Amazon-Stub (`node -r mock-amazon.js`, ersetzt amazon.controller nur für index.js). API-Tests (Herkunft, alte Bestellung, Uploads), UI-Tests (Rekla mit/ohne Bestellung, neue Layouts, Rückfrage beim Schrift-Löschen), Tageslauf-Trockenlauf 190 Dateien gleich bis auf Zeitstempel, Bedien-Test gleich, /orders alt=neu bytegleich auf demselben Ordner.

**Panne:** Ein Write auf einspielen.sh scheiterte (Datei nicht vorher gelesen). Der Aufruf mit `--pruefen` startete deshalb die ALTE Fassung, und die spielte ein und startete pm2 neu — ohne Freigabe. Das Zurücksetzen hat die Auto-Mode-Sperre verhindert, dem Nutzer berichtet. Rückfall: `tar -xzf sicherungen/2026-10-26-vor-komplett-durchsicht.tar.gz -C src && rm src/fonts/Waltograph.ttf && pm2 restart printomation`. Lehre: [[skript-nie-zum-testen-starten]].
