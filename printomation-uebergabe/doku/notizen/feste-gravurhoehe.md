---
name: feste-gravurhoehe
description: "Auto-Fit = feste Gravurhöhe: eingestellte Feldhöhe IST exakt die DXF-Höhe (Vorrichtung/Array)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 9c8ce7ed-15b7-42a6-82f6-835f4a18543f
---

**Anforderung (06.07.2026, Altan):** Die eingestellte Feld-**Höhe muss exakt die
Gravurhöhe sein** — er hat eine physische Vorrichtung und arrayt 10× hoch; schwankt die
Höhe, passt das Array nicht mehr. Vorher streuten 4-mm-Felder real ~3,1–4,2 mm (Wörter
ohne Unterlänge zu klein, mit Unterlänge/Umlaut zu groß). Nach hinten (Breite) darf Text
länger werden, nie kleiner.

**Fix (global, alle Auto-Fit-Textfelder):** `autoFitFontSizePt` skaliert jetzt den
TATSÄCHLICHEN Tinten-Block des konkreten Strings (gemessen am Wort, nicht an "H"/"g") auf
`AUTOFIT_FILL_H * f.h` — **kein Breitenlimit, kein Font-Boost mehr**. Der DXF-Export
(`_buildDXFEntities`, Zweig `exactFit`) skaliert zusätzlich exakt über die opentype-
Bounding-Box → Geometriehöhe == `f.h` millimetergenau (verifiziert live: h=4→4.0000,
h=81.9384834→81.9385, mehrzeilig/Umlaut/Caps alle exakt). Vorschau-Anker in `_drawText`
setzt bei Auto-Fit die echte Tinten-Oberkante bündig an die Feldoberkante (statt "H").
Gilt für text/number mit `autoFit!==false` ohne `circleDia`. Manuell/Statik/Kreis-Text
unverändert (feste `fontSize`).

**Why:** Laser-Vorrichtung + Array brauchen konstante Zeilenhöhe; Typo-Metrik (Cap+g) ≠
tatsächliche Glyph-Höhe realer Wörter.

**How to apply:** Höhe ist immer die volle Tinten-Bounding-Box (inkl. Unter-/Oberlängen).
→ Nebenwirkung 1: unterschiedliche Cap-Größen je Wort (MAX-Buchstaben größer als Maggy).
→ Nebenwirkung 2: Schreibschrift-Körper wirken klein (Flourishes zählen mit), siehe
[[schreibschrift-dalih-font]]. Beides ist gewollt. Wenn wieder "konstante Cap-Höhe statt
konstanter Gesamthöhe" gewünscht wird, ist das die Gegen-Option. Export läuft über
Puppeteer auf `layout-editor.html?autoexport=1` (`scheduler.js`) — dieselben JS-Funktionen,
kein zweiter Renderer. Test-Muster: [[layout-editor-testen]].

**AUSNAHME Breitenlimit per Feld-Option (15.07.2026, Altan-Wunsch FL01/Vorrichtung):**
`f.overflowMode` (Props-Panel „Text breiter als Feld"): undefined/'ok' = Überstand erlaubt
(Standard, altes Verhalten); 'stauch' = nur X-Achse stauchen bis Text ins Feld passt,
Höhe bleibt mm-exakt (wie „X-Achse verkleinern" an der Maschine); 'hybrid' = stauchen
bis max. 20 % (HYBRID_MIN_SX 0.8), Rest über proportionale Verkleinerung (Block wird
niedriger und sitzt dann MITTIG im Feld statt oben bündig — Altan-Wunsch 15.07.,
yShiftMM/​_dy = f.h·(1−k)/2 in DXF-Zweig und _drawText). Zentrale Mathematik `_overflowFactors`, angewandt in `_drawText`
(Vorschau/PDF/PNG) und im DXF-exactFit-Zweig (otPathToDXF mit scaleX=scale*sxW).
setOverflowMode() propagiert auf die ganze Array-Gruppe. FL01_Schw_M25: alle 20 Felder
auf 'stauch' gesetzt (Backup layouts.json.bak-breitenlimit-2026-07-15). Maschinell
verifiziert: stauch → Breite ≤ f.w·0.99 bei exakt 5.0000 mm Höhe; hybrid → h = f.h·k;
passende Namen in allen Modi byte-identisch. Raster-Exporte clippen Text ohnehin am
Feldrand (renderFieldToCtx ctx.clip) — Überstand war nur in DXF/Vorschau sichtbar.

**Rückfrage „langgezogene Schriften" (16.07.2026, geklärt):** Altan meldete, seit dem
Stauchen wirkten manche K01-Namen „verzogen in die Länge". Forensik: (1) Stauchen fasst
Wörter, die ins Feld passen, NICHT an — 'ok' vs 'stauch' byte-identisch (verifiziert). (2)
Keine echte x-Verzerrung — Seitenverhältnis mit fester Höhe == mit fixer Schrift. (3)
Ursache = diese feste Gesamthöhe selbst (seit 06.07., älter als Stauchen): Wörter OHNE
Unterlänge / ALL-CAPS (z.B. „Zwettler" 19,5 mm, „NFR-PROFI" 7,1:1) füllen mit reiner
Cap-Höhe die 4 mm → wirken groß/breit; Wörter mit g/j/p/q/y bleiben klein („yogurt" 12,1
mm). Alte Exporte 11.–14.07. zeigen dasselbe. **Altan hat am 16.07. entschieden: SO
LASSEN** (konstante Gesamthöhe, nicht auf konstante Cap-Höhe umstellen). Gegen-Option
(konstante Cap-Höhe) bleibt dokumentiert, falls doch mal gewünscht.

**AUSNAHME Nummern-Felder (07.07.2026):** `autoFitFontSizePt(...,fitWidth)` — für
`type==='number'` gilt DOCH ein Breitenlimit (`wMM*0.96`), sonst liefen 8-stellige
Bestellnummern über den Feldrand und wurden abgeschnitten (S01/Schlüsselanhänger zeigte
in der PDF nur die mittleren 4 Ziffern; Bild↔Nr-Zuordnung war aber immer korrekt). Nur
Nummern-Felder, nicht Gravur-Text. Aufrufstellen: `_vecTextProps` (Export) + `_drawText`
(Vorschau) je mit `f.type==='number'`.

**DXF Text-als-Block (07.07.2026, Altan-Wunsch "jeder Text = 1 Objekt wie der Kasten"):**
per-Layout-Opt-in `layout.dxfTextAsBlock` (Checkbox „Jeden Text als 1 Objekt (Block)" in
den DXF-Optionen, Standard AUS). Bei AN wird jede Textzeile als DXF-BLOCK definiert + per
INSERT@0,0 eingefügt → in Ezcad EIN wählbares Objekt statt loser Buchstaben-Linien.
`_buildDXFEntities` liefert jetzt `{entities, blocks}`; `buildDXFContent(...,asBlock)` /
`buildDXFContentMultiPage(...,asBlock)` emittieren eine BLOCKS-Sektion (R12: nach TABLES,
vor ENTITIES; eindeutige Namen T1..Tn über blockCtr). Geometrie byte-identisch zum
Nicht-Block-Export (verifiziert: gleiche 10/20-Koordinaten) → falls Ezcad Blöcke beim
Import zerlegt, kein Schaden. **MASCHINELL VERIFIZIERT + AUSGEROLLT (08.07.2026):** Nutzer
hat Testdatei `public/BLOCKTEST_K25_Schw.dxf` in Ezcad geprüft → jeder Name einzeln wählbar
(Ezcad zerlegt die Blöcke NICHT). Ausgerollt auf ALLE 24 Array-Layouts (K25_*_M25, K50_*_M50,
K10_Gemi_M10) + K01_Schw = 26 Layouts. **Zweck = Gravur-Geschwindigkeit bei Arrays:** vorher
gravierte die Maschine den ganzen Array-Satz als eine Einheit von oben nach unten (Laser quer
über alle Namen, langsam). Lösung = Block-Modus (jeder Name = 1 Objekt) PLUS in Ezcad
**„All Calc" AUS** (填充/Schraffur pro Objekt statt Gesamtberechnung; Pro-Datei-Einstellung,
kann beim Import zurückspringen). Beide zusammen → Laser graviert Name für Name = schnell.
layouts.json-Backups: `.bak-block-2026-07-07`, `.bak-arraytest-2026-07-07`, `.bak-blockrollout-2026-07-08`.
Editor-Backups vor dem Umbau:
`layout-editor.html.bak-2026-07-07b`.
