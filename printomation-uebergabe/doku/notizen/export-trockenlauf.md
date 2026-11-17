---
name: export-trockenlauf
description: Auto-Export komplett im Trockenlauf fahren (nichts wird auf den Server geschrieben) — für A/B-Vergleich alter/neuer layout-editor.html oder um einen Lauf zu reproduzieren
metadata: 
  node_type: memory
  type: reference
  originSessionId: 7f08fa25-b6d2-4437-b01b-78ef67ec0bd7
  modified: 2026-09-15T13:26:38.310Z
---

Seit 06.10.2026 als `src/tools/trockenlauf.js` abgelegt (vorher nur im Scratchpad); dazu `src/tools/pipeline-vergleich.js` für die Laser-Pipeline bitgenau. Am 15.09.2026 gebaut, um eine Editor-Änderung gegen den ganzen
Tageslauf zu prüfen. Rezept mit Puppeteer (`/snap/bin/chromium`, Flags wie scheduler.js), URL
`http://localhost:3002/layout-editor.html?autoexport=1&nocache=<ts>[&onlyLayout=<Name>]`:

- `page.setRequestInterception(true)`: Anfrage auf `/layout-editor.html` mit einer HTML-Datei von der
  Platte beantworten (so läuft die ALTE Fassung aus `backups/` ohne sie unter public/ abzulegen);
  alle Nicht-GET abbrechen (Sicherheitsnetz).
- `page.evaluateOnNewDocument` ersetzt `window.fetch` für Nicht-GET: `/export-run` → `{run:1}`,
  `/export-upload` → FormData auslesen, Datei als base64 über `page.exposeFunction` lokal speichern,
  `/export-status` → JSON speichern. Ordner wie der Server bauen: `_Vorlage/<vorlage>` bzw.
  `<date>/<group>[/<unterordner>]`; bei `neu=1` und belegtem Namen `_2`, `_3` anhängen.
- Ende: `window._autoExportDone || window._autoExportError`, ~130 s für den Tag.

Danach Bäume per md5 vergleichen. **Zeitstempel-Rauschen:** belegung.txt Zeile 1, vorschau.png nur
Titelzeile (y 16–35 px), PDF nur CreationDate/ModDate/ID. Gegen den echten Lauf weicht zusätzlich ab,
was seitdem in die Session kam (eine Reklamation hängt ihre Bestellung an session.json an).

Siehe [[export-forensik]], [[alten-lauf-nachexportieren]], [[arabischer-text-dxf-absturz]].

**27.09.2026 erweitert:** Zusätzlich GET `/layouts` (gefiltert, Einstellungen überschreibbar), `/session`, `/orders` (Schnappschuss) und die Fotos `/<Tag>/...` aus einer Sicherung beantworten — dann läuft ein alter Lauf auch nach dem 03:00-Cleanup. Freitags-Editor + -Pipeline + -Layouts so gegen heute gerechnet (bitgleich). Für schnelle Varianten den Pipeline-Eingang je Platz mitschneiden und in Node rechnen, s. [[gesichter-konturen-2026-09-27]].

**11.10.2026 — 180-s-Grenze:** Puppeteer v24 bricht jeden Protokoll-Aufruf nach 180 s ab, auch
`waitForFunction` (Meldung nur „Waiting failed"). Trockenläufe über 3 Minuten (z. B. `&fillFrom=…&fillTo=…`
über mehrere Tage) brauchen `protocolTimeout` im `puppeteer.launch` — dieselbe Grenze trifft den echten
Auto-Export, s. [[code-durchsicht-2026-10-11-nacht]].
