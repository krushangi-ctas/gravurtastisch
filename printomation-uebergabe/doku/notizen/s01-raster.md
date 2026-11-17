---
name: s01-raster
description: "S01-Raster (Herz/Rund/Viereck), neu ausgemessen am 14.08.2026 — Gravurflächen, Spalten- und Reihenwerte"
metadata:
  node_type: memory
  type: project
  originSessionId: b009d207-ad97-434d-afbc-85a3f302544e
  modified: 2026-08-14T10:42:56.652Z
---

Drei Schlüsselanhänger-Bleche, alle 200×200, alle Kombi-Feld mit **3 Zeilen**
(`comboPals [1,2,3]`, 1 mm Lücke), alle `emptyMode: ueberspringen` (Bestellungen ohne
Gravurtext belegen keinen Slot) und `fillDatePreset: session`.

Stand nach der kompletten Neuvermessung durch den Nutzer am 14.08.2026:

| Layout | Anhänger | Gravur | Spalten (Abstand) | Reihen (Abstand) |
|---|---|---|---|---|
| S01_Herz | 39 × 36 | 21 × 17 | 9 / 50,7 / 92,4 / 134,1 (**41,7**) | 6 / 86,5 / 167 (80,5) |
| S01_Rund | 39 × 39 | 21 × 17 | 9 / 50,667 / 92,333 / 134 (41,667) | 11 / 86 / 161 (75) |
| S01_Recht | 25 × 42 | 20 × 17 | 2,5 / 34,5 / 66,5 / 98,5 / 130,5 (32) | 12,5 / 92 / 171,5 (79,5) |

Herz/Rund: 12 Positionen (4×3), Viereck: 15 (5×3). Beim Viereck steht der Blattrand auf
2 mm, weil die erste Gravur bei 2,5 liegt.

**Gravur sitzt mittig auf dem Teil:** Herz/Rund 9 mm links und rechts, Rund zusätzlich
11 mm oben/unten; Viereck 2,5 mm links/rechts und 12,5 mm oben/unten. Der oberste bzw.
linkeste Anhänger liegt jeweils bündig auf der Blechkante (x=0 bzw. y=0) — bei diesen
Vorrichtungen normal, siehe auch [[fl04-raster-mengenstufen]].

**Vorher war durchgehend das Raster zu groß** (Herz 81 statt 80,5 · Rund 75,5 statt 75 ·
Viereck 80 statt 79,5) und die ganze Anordnung zu weit rechts/unten (Viereck 12,5 mm!).
Dasselbe Drift-Muster wie bei [[fl01-array-mengenstufen]].

**Offen:** Herz läuft auf 41,7, Rund auf 41,667, obwohl beide Anhänger 39 mm breit sind und
an derselben Stelle beginnen — vermutlich dieselbe Vorrichtung, dann sollte es einheitlich
sein. Der Nutzer meldete am 14.08. zusätzlich, die Gravuren seien früher „stückweise nach
links gewandert" (= Spaltenabstand zu klein); die Neumessung hat den Abstand aber gar nicht
vergrößert. Falls es wieder auftritt: **linke Kante des ersten und des letzten Anhängers**
messen (nicht die Gravur) und den Abstand daraus rechnen.

Testbleche mit allen belegten Slots erzeugt man über die Skripte im Scratchpad-Muster:
Layout headless laden, `upd(id,'_text',…)` je Feld, `generateExportBlob('dxf')` —
Details in [[layout-editor-testen]].

## Stand 21.08.2026 — Raster nach Maschinentests neu justiert

Der Nutzer hat am Blech nachgemessen und die Werte iterativ bestätigt (jeweils per
voll ausgefülltem Test-DXF geprüft, dann gespeichert):

| Layout | Spalten x | x-Abstand | Reihen y | y-Abstand |
|---|---|---|---|---|
| **S01_Rund** | 30 / 71,667 / 113,334 / 155,001 | 41,667 | 11 / 86 / 161 | 75 |
| **S01_Herz** | 30 / 72,2 / 114,4 / 156,6 | 42,2 | 6 / 87,5 / 169 | 81,5 |
| S01_Recht | 2,5 / 34,5 / 66,5 / 98,5 / 130,5 | 32,0 | 12,5 / 92 / 171,5 | 79,5 |

Beide Änderungen betrafen den **linken Rand**, nicht den oberen: die erste Spalte
wanderte von x=9 auf **x=30** (Rund und Herz). Bei Herz wurde danach zusätzlich das
Raster aufgezogen — **x +0,5 mm, y +1 mm** (41,7→42,2 und 80,5→81,5). Ein x-Zuwachs
von +1 mm war laut Nutzer bereits zu viel, y +1 mm dagegen genau richtig.

S01_Recht wurde bislang NICHT angepasst und steht noch auf dem alten Stand (x ab 2,5).

**Arbeitsweise, die sich hier bewährt hat:** Variante als eigenes Layout `_TEST`/`_LINKS`/
`_ARRAY` anlegen, voll ausgefülltes DXF in den heutigen Export-Ordner hochladen
(`POST /export-upload`, group=S01), der Nutzer probiert es an der Maschine, dann die
gute Variante ins Haupt-Layout übernehmen und die Testlayouts + Test-DXFs löschen.
Für den Volltest eignen sich gemischte Textlängen (kurz „Lu/Mo" bis
„Charlotte-Marie/Maximilian-Josef") — so sieht man sofort, wo `overflowMode: stauch` greift.
