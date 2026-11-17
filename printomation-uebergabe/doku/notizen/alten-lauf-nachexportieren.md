---
name: alten-lauf-nachexportieren
description: "Export eines vergangenen Laufs 1:1 wiederholen, ohne Amazon anzufassen — Session aus meta.json downloadedAt rekonstruieren"
metadata:
  node_type: memory
  type: project
---

Wenn ein Export inhaltlich falsch war (z. B. der Arial-Fehler, s.
[[amazon-schriftart-je-bestellung]]) und nur die DATEIEN neu müssen — kein neuer
Amazon-Abruf, keine neuen Bestellungen. `POST /repeat-run` ist dafür das FALSCHE
Werkzeug: es lädt herunter und ändert den Umfang. Stattdessen direkt den Export-Pfad
aufrufen, den `scheduler.js` nutzt:

```
http://localhost:3002/layout-editor.html?autoexport=1&nocache=<ts>
```
mit Puppeteer (`/snap/bin/chromium`, Flags wie scheduler.js), dann auf
`window._autoExportDone` warten. Greift nur auf lokale Daten zu (`/orders`, `/session`).

**Den Umfang bestimmt allein `session.json`** — der Filter matcht NUR über `o.id`
(`getFillDateFilteredOrders`, preset 'session'). Die Session eines vergangenen Laufs ist
exakt aus den Bestellungen rekonstruierbar: **`meta.json` → `downloadedAt`**, nach
Kalendertag gruppieren. Am 12.09.2026 geprüft: 126 Positionen für den 11.09. und 113 für
den 12.09. — genau die Zahlen, die „Auto-Export: Session hat N Bestellungen" im Log nennt.
`session.json` vorher sichern und danach zurückschreiben.

**Ordnername = Tag des Export-LAUFS, nicht der Bestellungen** (`_dayBerlin()` in
`runAutoExport`). Ein heute nachgeholter 11.09.-Export landet also in
`public/exports/2026-09-12` — Zielordner vorher leeren (sonst vergibt `/export-run`
„… Lauf 2") und das Ergebnis danach umbenennen. Beide Läufe erzeugten dabei eine
Datei-für-Datei identische Liste wie das Original; die Kopfzeile in `status.txt` nennt
den Zeitpunkt der Wiederholung.

Alte Exporte vor dem Löschen nach `tmp/alt-exports/<Tag>_<grund>` sichern — das ist dort
die etablierte Ablage und liegt außerhalb von `public/` (s. [[betriebs-konventionen]]).

Siehe [[lauf-wiederholen-knopf]], [[export-forensik]].
