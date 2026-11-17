---
name: ezcad-vorlage-dynamic-file
description: EzCad-Lite-Vorlage mit Dynamic File funktioniert (13.09.2026 an der Maschine bewiesen) — aber die Vorschau zeigt IMMER den Stand von gestern
metadata: 
  node_type: memory
  type: project
  originSessionId: f473cd7e-d35c-48e8-9196-bcf763710bee
  modified: 2026-09-16T10:30:27.346Z
---

Am 13.09.2026 an der echten Maschine (EzCad_Lite 2.14.16) aufgebaut und bewiesen:
**eine `.ezd` mit zwölf Bitmap-Objekten, je „Dynamic File", liest die BMP beim Markieren
neu ein und graviert das AKTUELLE Bild.** Der Tagesablauf ist damit: BMP tauschen,
`.ezd` öffnen, Mark. Kein Bild mehr laden, keine Position mehr eintippen.

**Der Fallstrick, der fast zur Fehldiagnose geführt hätte:** Ezcad speichert beim
`Save as` eine KOPIE der Bilder mit in die `.ezd` (562 KB statt weniger KB bei reinen
Pfaden). Die **Bildschirm-Vorschau zeigt diese Kopie**, nicht den Dateiinhalt — nach dem
Tausch der BMP sieht man am Bildschirm weiter die Bilder von gestern. Erst NACH dem
Markieren aktualisiert Ezcad die Anzeige, und zwar nur für die Objekte, die dran waren.
Der Nutzer hielt das zuerst für „funktioniert wie gewünscht"; der Beweis lief über die
Zeitstempel auf dem Server (BMP 11:21 neu, `.ezd` 11:17 gespeichert, Anzeige trotzdem alt).
**Folge für den Alltag: am Bildschirm ist NICHT kontrollierbar, was gleich graviert wird.**
Kontrolle läuft über `vorschau.png` im Arbeitsordner (Stand 14.09.: belegung.txt liegt nur noch im Tagesarchiv) und den Reiter [[ezcad-reiter]].

**KORREKTUR 16.09.2026 (Nutzerfund, deutlich sichtbar): „Fixed DPI" muss AUS sein.**
Mit eingeschaltetem Fixed DPI rechnet Ezcad das Bitmap auf das eingestellte Raster um. Unsere BMP
sind aber fertig gerastertes 1-Bit — jedes Umrechnen verschiebt oder verschmilzt die Punkte, das
Ergebnis wird matschig und dunkel (dieselbe Regel wie in der Pipeline: nie ein gerastertes Bild
skalieren). Ohne Fixed DPI markiert Ezcad Punkt für Punkt aus der Datei, und die Größe kommt aus dem
DPI-Wert im BMP-Kopf (500 dpi = 19685 ppm, bei den Testkacheln 300 dpi = 11811 ppm). Das erklärt
rückwirkend die „zugelaufenen Gesichter" an Maschine 2 — nicht nur Linse und Energie.
**Zu prüfen, wenn Fixed DPI aus ist:** Objektgröße muss weiter 33,02 × 54,00 mm sein und die 8×8-px-
Blindblätter für leere Plätze weiter winzig (0,4 mm) bleiben.

Aufbau in EzCad-Lite, die Einstellungen je Bitmap:
- `[x] Dynamic File`, `[ ] Fixed DPI` (aus, s. Korrektur oben — der frühere Rat „Fixed DPI 500" war falsch)
- `Fixed Size X/Y` bewusst **AUS** — bei Fixed DPI folgt die Größe aus der Pixelzahl
  (630 px / 500 dpi = 32,004 mm). Ohne feste Größe schrumpfen winzige Blindblätter für
  leere Plätze um denselben Mittelpunkt, statt aufgezogen zu werden.
- **`Fixed position` = MITTE.** Das 3×3-Raster erscheint erst, wenn Fixed DPI an ist, und
  steht per Standard auf UNTEN LINKS — dann sitzt das Bild oben rechts daneben. Auf Mitte
  bezieht sich Position X/Y auf den Bildmittelpunkt, und genau Mittelpunkte liefert
  `belegung.txt`.
- `Invert` / `Gray` / `Dither` **AUS** — das BMP ist fertig 1-bit gerastert und bei
  Schwarz bereits invertiert.

**`Array` rechnet mit der LÜCKE, nicht mit dem Mittenabstand** (gemessen 13.09.2026):
wer den Mittenabstand einträgt, bekommt jedes Mal eine Bildbreite zu viel. Für F02_Schw_V5
also `8.863` statt 40,867 und `-29.696` statt −61,700. Prüfen: das Bitmap unten rechts muss
X 61,300 / Y −72,200 zeigen.

**Zweite Maschine, 15.09.2026: `F02_Schw_V5R.ezd`** liegt neben `F02_Schw_V5.ezd` (Maschine 1)
im Arbeitsordner. Vergleich mit `tools/ezd` (meerk40t-Parser):
- **KORREKTUR 16.09.: `EZImage.status_bits` 0x1000 ist NICHT Dynamic File, sondern höchstwahrscheinlich
  FIXED DPI.** Beleg: am 15.09. stand es auf 4096 — genau als der Nutzer Fixed DPI noch an hatte;
  seit er es ausgeschaltet hat (16.09.), steht es in allen drei R-Dateien auf 0, obwohl Dynamic File
  bei jedem Bild angehakt ist (vom Nutzer bestätigt). Auch die Maschine-1-Dateien vom 14.09. hatten 0.
  **Für Bilder ist das Dynamic-File-Häkchen aus der .ezd nicht zuverlässig auslesbar — nicht wieder
  daraus Alarm schlagen.** Nur bei `EZVectorFile` (args[1]) bedeutet 0x1000 belegbar Dynamic File.
  Was sich stattdessen prüfen lässt: die eingebetteten Bildkopien mit den verknüpften BMP
  byteweise vergleichen (Ezcad legt beim Speichern eine Kopie ab). Am 16.09. waren in allen drei
  R-Dateien 12/12 Kopien bytegleich mit dem aktuellen Stand der verknüpften Datei — bei V5R mit
  Bildern, die erst Minuten vor dem Speichern dorthin kamen, also wird nachgeladen.
- Stifte je Maschine verschieden: Bild-Stift 0 M1 1100 mm/s 80 % 25 kHz, M2 1250 mm/s 40 % 35 kHz;
  Text-Stifte 4–15 M1 1500 mm/s 70 % 30 kHz, M2 2500 mm/s 60 % 35 kHz; auch TC/Jump-Werte anders.
- V5R: Platz 1 hat 33,00 × 32,00 mm (die Kopien 33,02 × 32,004), das Array rechnet mit Platz 1
  → rechte Spalte 61,25. Reihe 2 wurde rechts→links angelegt, Pfade stimmen trotzdem.
  Belegt: Schritt = Größe von Platz 1 + Abstand (33,00 + 7,85 = 40,85; 32,00 + 29,70 = 61,70).
  Danach trug der Nutzer X 8,00 / Y −29,7 ein. Das ergibt rechnerisch X 61,70, also 0,4 mm zu
  weit rechts; ich habe 7,87 empfohlen. Stand 14:35 UTC noch nicht gespeichert, also ungeprüft.

**ENTSCHIEDEN 16.09.2026: Raster X = 41,22 mm (Array-Lücke 8,20).** Der Nutzer hat die neuen
Vorrichtungen mit Lücke 8,20 gebaut, Reihenabstand 61,70. Die Layouts in Printomation sind darauf
umgestellt (s. [[f02-nummernbilder]]); Platz 1 auf X −61,83, Spalten −61,83 / −20,61 / 20,61 / 61,83.

**Array-Abstand geht in Ezcad nur mit 2 Nachkommastellen** (Nutzer, 15.09.2026, zweite
Maschine). V5 mit Abstand X 7,85 / Y −29,70 ergab Platz 12 bei X 61,25 / Y −72,2 (Soll
61,30 / −72,20). Passt nur, wenn Ezcad mit 33,00 × 32,00 mm rechnet statt 33,02 × 32,004
(Pixel/DPI). Ungeprüft, ob wirklich 7,85 eingetragen war. Empfehlung: X 7,87 → 61,31.
Faustregel: jede 0,01 mehr Abstand X schiebt Platz 12 um 0,03 nach rechts.

**KORREKTUR 14.09.2026: „Dynamic File" gibt es auch für VEKTORDATEIEN.** Ein per
`File > Import` geladenes DXF wird in EzCad-Lite zum Objekttyp **VectorFile**, und dessen
Eigenschaften haben neben „Optimizing the marking order" und „Auto connect curve" ebenfalls
ein **Dynamic File**. Damit lädt sich auch die `gravur.dxf` bei jedem Markieren neu — der
tägliche Import entfällt. Ich hatte vorher behauptet, das ginge nur bei Bitmaps; das war
falsch (der Nutzer hat es im eigenen Screenshot entdeckt).

**Importierte DXF-Layer landen auf VERSCHIEDENEN STIFTEN.** Ezcad ordnet nach Layerfarbe
zu: bei F02_Schw_V5 lag `Gravur_1` auf Pen 4 (magenta), `Gravur_2` auf Pen 5 (gelb), der
Rest auf Pen 0. Unser Export gibt jeder Gravurzeile einen eigenen Layer (`_collectRowLayers`),
und die Layer-Tabelle im DXF-Kopf enthält nur die Layer der an dem Tag BELEGTEN Plätze.
Folge: Leistung/Geschwindigkeit müssen für jeden benutzten Stift stimmen, sonst graviert ein
Teil der Plätze anders — oder gar nicht, wenn so ein Stift auf Off steht. Entweder alle Layer
nach dem Import auf einen Stift legen oder die Parameter gleichsetzen.

Netzlaufwerk geht: die Pfade zeigen auf `Z:\exports\_Vorlage\F02_Schw_V5\platzN.bmp`, das
Nachlesen klappt darüber. Die `.ezd` liegt (Nutzerentscheid) IM Arbeitsordner — der Export
überschreibt nur platzN.bmp/gravur.dxf/rueckseite.dxf/vorschau.png, nie eine .ezd.

**Stifte (14.09.2026):** Ezcad legt beim DXF-Import jede Ebene auf einen eigenen Stift. Die
V5-.ezd (neu gespeichert 16:35) hat dadurch Stifte 4–15, weil die Prüf-DXF 12 Ebenen hatte.
Empfehlung an den Nutzer offen: Vorlagen-DXF auf EINE Ebene zusammenlegen oder alle Stifte
gleich einstellen. Stand der Layouts und Ordner: [[f02-vorlagen-betrieb]], [[bmp-je-platz]].
