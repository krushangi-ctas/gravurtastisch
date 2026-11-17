---
name: f02-nummernbilder
description: 15.09.2026 Nummernbilder 1–12 in alle sechs F02-V5–V7-Arbeitsordner gelegt (weitere Maschine einrichten); _Pruefgravur war vorher weg
metadata: 
  node_type: memory
  type: project
  originSessionId: 7f08fa25-b6d2-4437-b01b-78ef67ec0bd7
  modified: 2026-09-16T10:30:33.920Z
---

Auf Nutzerwunsch („weitere Maschine einstellen") liegen seit 15.09.2026 ~16:15 in
`exports/_Vorlage/F02_{Schw,Silb}_V{5,6,7}/` statt der Tagesbilder **Nummernbilder**:
`platz1.bmp … platz12.bmp` = große Zahl N, 0,4-mm-Rahmen an der Bildkante, Dreieck = oben.
Kopf bytegleich zu den echten Platz-BMPs (1-bit, 500 dpi, Palette 0 = schwarz = graviert;
V5 650×630 px, V6/V7 650×1063 px — V7 hat die −90°-Drehung schon im Bild, also hochkant).
Dazu je eine rote `vorschau.png` „NUMMERNBILDER". Zusätzlich (Nutzerwunsch, gleicher Tag) in
`F02_Schw_V5` und `F02_Silb_V5` eine `gravur.dxf` mit „Gravur 1–12" auf den Deckeln (echte Engine via
`_tsOneLayout`, 12 Ebenen Gravur_1…12). rueckseite.dxf NICHT angefasst.

**Empfehlung an den Nutzer (15.09.):** Deckel „gemeinsam" als eine gravur.dxf (Positionen stecken
in der Datei, Import ohne Verschieben), nicht 12 Text-Bitmaps. **Offen/ungetestet:** (1) nimmt Ezcad
bei LEERER DXF (387 B) die in der .ezd gespeicherte Kopie → dann würde der Platzhalter graviert;
Test = Tag ohne V5-Bestellung laden, Rotlicht. (2) Stift-Zuordnung beim täglichen Neuladen: die
Ebenen-Tabelle enthält nur die belegten Plätze (heute 7, Platzhalter 12) → Ezcad verteilt auf
wechselnde Stifte. Vorschlag „alle Vorlagen-DXF auf EINE Ebene" (betrifft auch Maschine 1) wartet
auf OK.

Der Maschinen-Reiter zeigt für diesen Test-Stand „passt zu keinem Archiv-Tag".

**14:37 UTC:** `F02_Schw_V5` auf Nutzerwunsch per `/vorlage/laden` wieder auf den echten 15.09.
zurückgesetzt (7 Fotos, gravur.dxf mit 7 Deckeltexten). Zweck: Test an Maschine 2 mit
`F02_Schw_V5R.ezd`. Die anderen fünf Ordner tragen weiter Nummernbilder. Beim Test sichtbar
wird: bleibt die DXF mit 7 statt 12 Texten an ihrer Stelle, und landen alle auf dem richtigen Stift?

**15:10 UTC:** auf Nutzerwunsch („sieht schöner aus beim Laden") auch `F02_Schw_V5` wieder auf
Nummernbilder und `gravur.dxf` „Gravur 1–12" gestellt. Damit tragen alle sechs Ordner wieder den
Nummern-Stand.

Zurück zur Produktion: Tag laden (Reiter oder `Tag laden.bat`); spätestens der nächste Lauf
überschreibt alle platzN.bmp. Alter Stand gesichert unter
`src/tmp/alt-exports/2026-09-15_nummernbilder/`. Generator lief nur im Scratchpad
(Puppeteer-Canvas → `imgTo1BitBMP(c, 500)` aus `public/laser-pipeline.js`).

`exports/_Pruefgravur/` (ladbarer Prüf-„Tag" mit „Gravur 1–12"-DXF) war am 15.09. um
14:03 UTC verschwunden — kein Server-Log dazu, also von außen gelöscht (Netzlaufwerk).
Nicht ungefragt neu anlegen.

Siehe [[f02-vorlagen-betrieb]], [[ezcad-vorlage-dynamic-file]], [[bmp-je-platz]].

**16.09.2026:** Für den Neuaufbau der Vorrichtungen liegen in ALLEN sechs Ordnern wieder die
Nummernbilder 1–12 (V5 650×630 px = 33,02 × 32,00 mm, V6/V7 650×1063 = 33,02 × 54,00 mm, alle
500 dpi im Kopf) plus die roten Vorschauen; in beiden V5-Ordnern zusätzlich die Deckel-Platzhalter
`gravur1–12.dxf` („Gravur 1“ … „Gravur 12“, ohne Rahmen, Platzhalter 26,03 × 6,00 mm). Vorheriger
Stand gesichert in `tmp/alt-exports/2026-09-16_vor-nummern/`.

**Ezcad-Werte (Layout-Raster, Nullpunkt Blattmitte) — Stand 16.09. NACH der Rasteränderung:**
Der Nutzer hat die neuen Vorrichtungen mit **Array-Lücke X 8,20** gebaut (statt 7,85), Reihenabstand
(Mitte–Mitte) bleibt 61,70. Daraufhin **alle sechs Layouts in layouts.json auf Spaltenschritt 41,22
umgestellt** (33,02 + 8,20). **Maßgeblich ist sein Ist-Raster, gemessen in F02_Schw_V5R/V6R/V7R.ezd
(16.09.):** Platz 1 blieb auf −61,30, also **Ezcad-X −61,30 / −20,08 / +21,14 / +62,36** =
Feldmitten 38,70 / 79,92 / 121,14 / 162,36. Das Raster steht damit 0,53 mm rechts der Feldmitte —
für die Vorrichtung egal, die Software folgt der Hardware. Eine zuerst gesetzte symmetrische
Variante (±61,83 / ±20,61) war falsch und wurde ersetzt. Betroffen: beide Seiten
aller sechs Layouts, 240 Felder — nötig wegen `rueckseite.dxf`/`gravur.dxf`, die ALLE Plätze in
EINER Datei tragen; `platzN.bmp` und `gravurN.dxf` sind positionsunabhängig.
Y unverändert: V5 Bilder 51,20 / −10,50 / −72,20, V5 Deckeltext 80,20 / 18,50 / −43,20,
V6/V7 Bilder 61,70 / 0 / −61,70. Array 4 × 3, Abstand (Lücke!) X **8,20** bei Bildern,
**15,19** beim V5-Deckeltext (41,22 − 26,03); Y −29,70 (V5-Bilder), −7,70 (V6/V7), −55,70
(V5-Deckeltext). **Fixed DPI bleibt AUS** (s. [[ezcad-vorlage-dynamic-file]]), Dynamic File an,
Fixed Size aus, Fixed position Mitte.

**Befund 16.09. ~10:30 in den drei R-Dateien (Maschine 2):** Raster und Größen stimmen
(33,02 × 32,00 bzw. × 54,00, Y wie oben), die zwölf Deckel-DXF in V5R sind einzeln auf
`gravur1–12.dxf` verknüpft, Dynamic File an, alle auf **Stift 4** (das alte Stift-4-bis-15-Problem
ist damit weg). Bei den Bildern steht `status_bits` auf 0 — das ist aber **kein** fehlendes Dynamic
File, sondern Fixed DPI aus (s. Korrektur in [[ezcad-vorlage-dynamic-file]]); mein Alarm deswegen
war falsch, der Nutzer hatte den Haken überall gesetzt. Gegenprobe: alle 36 eingebetteten
Bildkopien sind bytegleich mit dem aktuellen Stand der verknüpften BMP. In den drei Schw-Ordnern liegen seit
16.09. nur noch die R-Dateien, die Maschine-1-Dateien ohne R sind dort verschwunden; die drei
Silb-Ordner haben weiterhin nur die alten .ezd vom 14.09. ohne R.

**Achtung Auto-Export:** der geplante Lauf (täglich ~10:10 UTC) überschreibt alle sechs
Vorlage-Ordner mit dem Tagesstand — am 16.09. waren die Nummernbilder dadurch weg und mussten neu
eingespielt werden (Vorrat im Scratchpad unter `nummern/<Layout>/`, Platzhalter in `ph-V5`,
`ph-Silb-V5`). Der Lauf vom 16.09. 10:10 lief noch im ALTEN Raster; für Rückseiten auf der neuen
Vorrichtung den Tag per ↻ wiederholen. Produktionsstand gesichert in
`tmp/alt-exports/2026-09-16_lauf-1010/` (134 Dateien).