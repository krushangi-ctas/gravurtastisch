---
name: f02-deckeltext-je-platz
description: Seit 15.09.2026 Deckeltext der F02-V5-Vorlage je Platz als gravurN.bmp UND gravurN.dxf (Text mittig auf Nullpunkt, OHNE Rahmen, Ezcad Fixed position Mitte), weil Ezcad die gemeinsame gravur.dxf beim Neuladen verschob
metadata:
  type: project
---

**Anlass (15.09.2026, Maschine 2):** Die gemeinsame `gravur.dxf` lag an der Maschine **eine Reihe zu tief**,
vom Nutzer bestätigt. Ursache: Ezcad legt eine per Dynamic File neu geladene DXF an die Umrisskiste an,
die die Datei beim Einrichten hatte. Der Platzhalter hatte 3 Textreihen, der echte Tag nur 2. Das
Verhalten passt zu einem Anker unten links (Verschiebung genau 61,7 mm). **Jede Vektordatei mit
wechselndem Inhalt wandert so.**

**Umgesetzt (layout-editor.html, vorlage.controller.js, Tag laden.bat):**
- Der Export schreibt für die Seite mit den Fotos je Deckel-Textfeld `gravurN.bmp` (551×118 px, 500 dpi,
  gefüllte Schrift) und `gravurN.dxf`. Beide gehen in den Arbeitsordner und ins Tagesarchiv, gravur.dxf
  gibt es weiter. Die leeren Blätter schreibt `_vorlageLeerSchreiben` mit.
- `gravurN.dxf` (`_gravurSlotDxf`): Nullpunkt = Feldmitte, Text als Kontur, dazu ein **Rahmen 30×8 mm**
  (Feld +1 mm, wegen der Kursiv-Überhänge) auf **Layer „Bild"**. Die Kiste ist bei allen 12 Dateien
  immer −15…15 × −4…4. Leerer Platz = nur Rahmen, die Datei ist also nie leer. **Der Stift von Layer
  „Bild" muss in Ezcad aus sein.**
- Loader (Reiter und Tag laden.bat): `gravurN.(bmp|dxf)` gehören zu den Arbeitsdateien. Lädt man einen Tag
  ohne diese Dateien, wird gravurN.bmp zum weißen 8×8-Blatt und gravurN.dxf auf den Rahmen
  zurückgeschnitten (`nurRahmen`). Den JS-Loader habe ich getestet; die PowerShell-Fassung ist
  ungetestet, auf dem Server gibt es kein pwsh.
- Der .ezd-Check prüft gravurN.bmp gegen die Textfelder und meldet jetzt fehlendes Dynamic File bei
  Bildern (Flag 0x1000; `tools/ezd/lesen.py` gibt dafür `flags` aus).

**Ezcad-Werte für Maschine 2** (Spalten wie die Fotos mit Array X 8): gravur1 bei X −61,30 / Y 80,20,
Objektgröße DXF 30×8, Array 4×3 mit Abstand X 11,00 / Y −53,70, Kontrolle gravur12 bei 61,70 / −43,20.

Siehe [[ezcad-vorlage-dynamic-file]], [[f02-vorlagen-betrieb]], [[maschine2-mopa-fotogravur]].

**Nachtrag gleicher Abend: Rahmen wieder entfernt** (Nutzerentscheid: in Ezcad „Fixed position" bei den
DXF-Objekten). `_gravurSlotDxf` schreibt nur den Text, mittig auf dem Nullpunkt. Die Kiste ist
textabhängig; die Mitte der Tinte liegt bei Kursiv bis 0,5 mm neben der Feldmitte. Leerer Platz =
DXF ohne Geometrie. **Offen:** ob Ezcad dort die gespeicherte Kopie graviert → Test mit Rotlicht.
Arbeitsordner F02_Schw_V5 bekam Platzhalter „Gravur 1–12" (Arial, 26–27 × 6 mm), das Archiv 15.09.
die echten Texte ohne Rahmen. Array-Werte an Maschine 2: gravur1 bei −61,30/80,20, Größe „Gravur 1"
26,03 × 6,00 → Abstand X 14,97 / Y −55,70, Kontrolle gravur12 bei 61,70/−43,20. Die Rahmen-Werte
(30×8, X 11,00 / Y −53,70) sind damit überholt.

**V5R.ezd Stand 16:01 UTC (12 Bilder + 12 gravurN.dxf):** Positionen passen (Spalten −61,3/−20,3/20,7/61,7).
DXF alle mit Flag 0x1000, alle Texte auf Stift 4. **Alle 12 Bilder status 0**, also Dynamic File aus, gemeldet.
VectorFile-args neu gesehen: `[flags, 8, 100.0, 100.0, F, X, Y]`. Bei gravur1 ist F=1, bei den Array-Kopien
F=0, und alle tragen X/Y = −61,3/80,2. Deutung, unbelegt: F = Fixed position an, X/Y = Bezugspunkt, 8 = Anker.
Text-Stift 4 noch 2500/60 %/35 kHz, ungetestet. Danach auf Nutzerwunsch den Tag 15.09. geladen
(39 Dateien: 7 Fotos und 7 Texte, 8–12 leer).
