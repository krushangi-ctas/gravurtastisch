# Printomation — Gravurtastisch Bestell- und Layout-System

Holt personalisierte Amazon-Bestellungen (Amazon Custom) per SP-API, legt Kundenfotos und
Gravurtexte strukturiert ab und erzeugt daraus im Browser die Maschinendateien für den
Laser (DXF für Vektorgravur, 1-bit-BMP für Fotogravur).

```
Entry Point : src/index.js       (PM2-Prozess "printomation", Port 3002)
Start       : npm start
Neustart    : pm2 restart printomation
```

| | Version |
|---|---|
| node | v24.21 |
| npm | 11 (Lockfile: package-lock.json) |
| Port | 3002 |

## Ablauf

1. **Abruf** (`scheduler.js`, node-cron): holt zu den in `schedule.json` hinterlegten Zeiten
   die Bestellungen des Zeitfensters. Bereits verarbeitete Bestellungen hält
   `processed-orders.json` dauerhaft fest (Dedup, 90 Tage TTL).
2. **Download** (`amazon.controller.js`): entpackt je Artikel das Amazon-ZIP nach
   `public/<Berlin-Tag>/<Bestellnummer>/item-N/` — Kundenfoto, Bestell-JSON, Amazons
   Flächenvorschauen als `bild-1`, `bild-2`, … PDF-Uploads werden dabei nach PNG gerastert.
   Fehlversuche wandern nach 5 Anläufen in `queue/failed/`.
3. **Füllen & Export** (`public/layout-editor.html` + `layout-editor.js` + `layout-editor.css`
   + `laser-pipeline.js`): ordnet die Bestellungen den Feldern
   eines Layouts zu und erzeugt die Exportdateien. Der Auto-Export fährt dafür 2 Minuten
   nach dem Download einen headless Chromium (Puppeteer).
   **Dropdowns** (Amazons Auswahlfelder, seit 25.09.2026): Beim Füllen werden die Antworten
   mitgelesen. Eine Ja/Nein-Frage steuert die Felder, die auf ihrer Produktseite hinter ihr
   stehen. Eine Bestellung mit ausdrücklichem Nein und ohne jeden Inhalt („Ohne Gravur“)
   bekommt keinen Platz. Widersprüche („Rückseite bezahlt, aber leer“) gehen als Hinweis in
   `status.txt` und die Übersicht, und jeder Tageslauf schreibt eine `packliste.txt`
   (Verpackung, Ausführung, ohne Gravur, Hinweise). Palette „Felder“ → **Dropdown-Feld**: ein
   Motivfeld ohne festes Motiv (`ddGruppe`), ASIN-Suche, Frage wählen, je Antwort ein Motiv per
   Klick mit Vorschaubild oder „Automatisch zuordnen“ über den Dateinamen (`ddFrage` +
   `ddTabelle`, leerer Eintrag = bewusst kein Motiv). Solche Motive gehören zu ihrem Platz
   (oben links = Platz 1) wie Text- und Bildfelder. Der Layout-Entwurf im ASIN-Check legt für
   Grafik-Fragen (Buchstabe, Symbol, Motiv …) ein Dropdown-Feld mit an. An jedem Feld zusätzlich
   „Nur gravieren, wenn …“ (`ddWenn`), an Textfeldern „Text aus Dropdown“. Am Layout: „Nur
   Bestellungen mit …“ (`ddNur`).
4. **Aufräumen**: täglich 03:00 (Berlin) werden alte Download- und Export-Ordner nach den
   in `settings.json` eingestellten Fristen gelöscht; danach sichert `sicherung.controller.js`
   die Betriebsdaten nach `sicherungen/automatisch/` (14 Tage).

## API

| Route | Zweck |
|---|---|
| `GET /health` | Health-Check (leichtgewichtig) |
| `GET /wer-bin-ich` | angemeldeter Basic-Auth-Benutzer (Einstellungen → Anmeldung) |
| `GET /orders` | alle heruntergeladenen Bestellungen mit Dateien |
| `GET /session` | Bestellungen des letzten Download-Laufs |
| `GET /progress` | Fortschritt des laufenden Downloads |
| `GET /activity` | Aktivitätsprotokoll (max. 2000 Einträge) |
| `GET /start-cron/:hours` | Download manuell anstoßen (`?preset=`, `?status=`, `?force=1`) |
| `POST /cancel-download` | laufenden Download abbrechen |
| `GET`/`POST` `/schedule` | Zeitplan lesen/schreiben |
| `GET`/`POST` `/settings` | Aufräum-Einstellungen |
| `GET`/`POST` `/layouts` | Layouts (mit ETag-Konfliktschutz und `.bak`) |
| `GET`/`POST` `/folders` | Layout-Ordner |
| `GET`/`POST` `/laser-presets` | eigene Laser-Presets |
| `GET`/`POST`/`DELETE` `/fonts…` | Schriften auflisten, hochladen, löschen |
| `POST /export-upload` | Exportdatei aus dem Browser entgegennehmen |
| `POST /export-status` | Ergebnisbericht eines Export-Laufs |
| `POST /export-run` | Lauf-Nummer vergeben (Wiederholung → Ordner „‹Tag› Lauf N“) |
| `POST /repeat-run` | Zeitplan-Eintrag wiederholen (↻) |
| `POST /reload-order`, `POST /export-single` | Reklamation: eine Bestellung neu laden, ein Layout dafür exportieren |
| `POST /rekla/manuell`, `GET /rekla/manuell/:orderId` | Reklamation ohne Bestellung anlegen (000-Nummer, `tmp/rekla-manuell/`) bzw. für den Export liefern |
| `GET /rekla/bilder`, `/rekla/vorschaudatei/…`, `/rekla/variante/…`, `/rekla/pdfbild` | Reklamation: erzeugte Bitmaps, Vorschau-Dateien, Probeversionen, PDF als Bild |
| `POST /rekla/urteil` | Urteil „gut/schlecht" je Nachbesserung (`daten/rekla-urteile.json`) |
| `GET /testfoto/:name` | Standard-Testfoto fürs Testblatt |
| `GET`/`POST`/`DELETE` `/motive…` | Vektor-Motive (AI/EPS/SVG/DXF/PDF) |
| `GET /vorlage/uebersicht`, `POST /vorlage/laden`, `GET /vorlage/ezd` | Ezcad-Arbeitsordner, alten Tag laden, .ezd lesen |
| `POST /vorlage/objekte`, `POST /vorlage/entwurf`, `POST /vorlage/zurueck` | .ezd-Lage als Entwurf ändern, Entwurf übernehmen/verwerfen, Sicherung zurückholen |
| `GET /asin-check`, `GET /asin-check/:asin` | ASIN-Check: Profile aller Produkte bzw. eines Produkts |
| `GET`/`POST` `/asin-check/scan`, `POST /asin-check/scan/abbrechen` | ASIN-Check: ältere Bestellungen einer ASIN bei Amazon nachladen |
| `GET /asin-check/scan/kandidaten` | ASIN-Check: wie viele Abfragen ein Nachladen bräuchte (fragt Amazon nicht) |

Die Stores `/layouts`, `/folders` und `/laser-presets` senden beim Lesen ein ETag; wird es
beim Speichern per `If-Match` mitgeschickt und stimmt nicht mehr, antwortet der Server mit
409, statt die Änderung eines anderen Tabs zu überschreiben.

## Dateien

| Pfad | Inhalt |
|---|---|
| `src/index.js` | Express-Server und Routen |
| `src/amazon.controller.js` | SP-API, Download, Entpacken, Queue |
| `src/scheduler.js` | Cron-Jobs, Auto-Export, Aufräumen |
| `src/read-orders.controller.js` | liest den `public/`-Baum für `/orders` |
| `src/file-remove.controller.js` | Aufräum-Einstellungen und nächtliches Löschen alter Ordner |
| `src/sicherung.controller.js` | Nacht-Sicherung der Betriebsdaten (14 Archive, `sicherungen/automatisch/`) |
| `src/motive.controller.js` | liest Motive (AI/EPS/SVG/DXF/PDF) in mm-Polylinien ein |
| `src/vorlage.controller.js` + `src/tools/ezd/` | Ezcad-Arbeitsordner, Tagesarchiv, .ezd-Leser (Python) |
| `src/asin-check.controller.js` | ASIN-Check: Personalisierungs-Struktur je Produkt, gelernt aus den Bestellungen |
| `src/daten/` | Betriebsdaten als JSON (Layouts, Ordner, Laser-Presets, Einstellungen, Zeitplan, Ledger, Sitzung, Aktivität …); Pfad aus `config.datenDir` |
| `src/asin-profile/` | die Profile dazu (ohne Kundendaten) und der Index Bestellung → ASINs |
| `src/time-range.js` | Zeitfenster in Berliner Zeit (eine Quelle für alle Läufe) |
| `src/utils/` | Logger (mit Rotation), atomare JSON-Schreibhilfen, Aktivitäts-Log (`activity.js`) |
| `src/tools/` | Werkzeuge ohne Serverbezug: `trockenlauf.js` (Auto-Export ohne Schreibzugriff, für Alt/Neu-Vergleiche), `bedien-test.js` (Klick-Abläufe des Editors ohne Schreibzugriff), `pipeline-vergleich.js` (Laser-Pipeline alt gegen neu, bitgenau), `pruef-bestellung.js` (Bestellung per SP-API nachschlagen), `ezd/` (.ezd lesen und als Entwurf ändern, Python) |
| `src/public/layout-editor.html` | Markup des Editors (Reiter, Dialoge) |
| `src/public/layout-editor.js` | Bedienlogik des Editors (Felder, Füllen, Export, DXF) |
| `src/public/layout-editor.css` | sämtliche Stile des Editors |
| `src/public/laser-pipeline.js` | Bildmathematik der Gravur (Rasterung, Tonwerte, 1-bit-BMP), ohne DOM |
| `src/public/vendor/` | opentype.js, JSZip, jsPDF, onnxruntime + YuNet (Gesichter), Schriften (lokal, kein Internet nötig) |

Zugangsdaten stehen in `.env` (Amazon-Client, Refresh-Token, Marketplace) und werden beim
Start per Joi geprüft — fehlt eine, startet der Server gar nicht erst.
