---
name: layout-editor-testen
description: "Wie man public/layout-editor.html headless im Browser testet (Puppeteer/Chromium-Setup, Fallstricke)"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 64ac4245-65d4-4107-b263-e9cbb4a9b220
  modified: 2026-08-26T07:30:00.000Z
---

`public/layout-editor.html` ist eine Browser-App. Seit 24.10.2026 in VIER Dateien: die HTML
(nur Markup), `public/layout-editor.js` (gesamte Bedienlogik, klassisches Skript, vorher inline
in der HTML), `public/layout-editor.css` (alle Stile) und `public/laser-pipeline.js` (die
DOM-freie Bildmathematik, per <script src> VOR layout-editor.js geladen — klassische Skripte
teilen sich den globalen lexikalischen Bereich, deshalb sind ihre `const`/`function` dort sichtbar).
Trockenlauf/Bedien-Test liefern layout-editor.js und .css aus dem Ordner der übergebenen HTML aus.
**Die Pipeline ist in Node direkt ladbar:** `require('./public/laser-pipeline.js')` — sie hat
einen `module.exports`-Zweig, der im Browser übersprungen wird. Der Regex-Umweg unten ist
für sie nicht mehr nötig, nur noch für Funktionen aus layout-editor.js. Intensiv testbar mit Puppeteer (`../node_modules/puppeteer`, v24) gegen die **laufende** Instanz `http://localhost:3002/layout-editor.html` (PM2 `printomation`, siehe [[deployment-setup]]).

**Chromium:** Puppeteers gebündeltes Chrome fehlt System-Libs (`libatk-1.0.so.0`). Stattdessen `executablePath: '/snap/bin/chromium'` + args `--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu` (genau wie `scheduler.js`).

**Wichtigster Fallstrick:** Top-Level `let`/`const` (`fields`, `_pages`, `orders`, `sel`, `MM`, `zoom`) sind **nicht** über `window` aus `page.evaluate` lesbar (lexikalische Bindung). Nur `function`-Deklarationen landen auf `window` und sind aufrufbar (`window.addToCanvas`, `window._clearFieldData`, `window.generateExportBlob`, `window.fillAllPagesAuto`, `window.loadLayout`, `window._boostPrintColors`, `window._capHeightMM` …) — aber **nicht stubbar** (interne Aufrufe nutzen die lexikalische Referenz, nicht `window.x`).

**Daher Feld-Inhalte über das DOM auslesen:** `#ov .cel[id=cel-N]` (Klasse `img-t`=Bild, `sta-t`=statisch; `style.left/top` ÷ MM = x/y in mm). orderId via `selectF(id)` → `#props`-Text auf `📦 <orderId>` regexen.

**Modal-Falle:** `loadLayout(id)` awaited bei nicht-leerem Editor ein `confirmModal`
(„Layout laden?") — headless klickt niemand → `page.evaluate` hängt bis ProtocolError-
Timeout (~180 s). Daher: Layout IMMER als Erstes laden (leerer Editor fragt nicht),
Testfelder erst danach anlegen. Gleiches Risiko bei allen promptModal/confirmModal-Pfaden
(saveLayout, deleteLayout …).

**Felder werden per `requestAnimationFrame` gerendert** (`scheduleRender`) → nach `addToCanvas` erst Doppel-RAF awaiten, dann Overlay zählen.

**Export-Blob abfangen:** `URL.createObjectURL` überschreiben (echte URL zurückgeben, sonst console.error „Not allowed to load local resource"). Mehrseiten-Export → ZIP statt Einzeldatei.

CDNs (jsPDF, opentype) sind aus dem Sandbox erreichbar → PDF/Vektor-Export funktioniert im Test.

**Reine Bildmathematik ohne Browser testen:** Funktionen wie `_errorDiffuse`, `bayer`,
`applyContrast`, `imgTo1BitBMP` hängen an keinem DOM. Per Regex aus der HTML ziehen
(`/\nfunction NAME\s*\([\s\S]*?\n}\n/`) und in Node `eval`-en — dann ALT- gegen
NEU-Implementierung auf synthetischen Bildern vergleichen (Schwarz-Anteil, Byte-Gleichheit).
Fängt Regressionen in Sekunden statt über den Puppeteer-Umweg. Achtung: Top-Level-`const`
wie `BAYER4` müssen separat nach `global` gehoben werden, sonst sieht die ALT-Kopie sie nicht.

**Refactoring-Regression über die GANZE Datei (stärkstes Werkzeug):** Alt- und Neufassung
im selben Browser gegeneinander laufen lassen und die Ausgabe byte-für-byte vergleichen —
ohne etwas nach `public/` zu legen. Trick: `page.setRequestInterception(true)`, das
Navigations-Dokument abfangen und per `req.respond({ body: <alte HTML> })` ersetzen; alle
relativen Ressourcen (`vendor/*.js`) kommen weiter von der laufenden Instanz auf 3002.
Damit z. B. `buildDXFContent` / `buildDXFContentMultiPage` mit identischen Testfeldern
(Drehung, Kreis-Text, Kombi-Feld, Bild) über alle Schalterkombinationen vergleichen —
Outline/Filled/TEXT-Entity/Block+Nullpunkt/mehrseitig. Am 26.08.2026 so abgesichert, dass
die Zusammenlegung der drei Rotations-Kopien (`_rotPt`) die Laser-Geometrie nicht ändert:
5 Varianten, jeweils zeichengleich.
