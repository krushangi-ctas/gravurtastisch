---
name: f02-12er-raster
description: "F02 Feuerzeuge: bestätigtes 4×3-Raster mit 12 Positionen pro Blech (Gravurfläche 33×54 mm), löst das bisherige 1-Feuerzeug-Blech ab"
metadata:
  node_type: memory
  type: project
---

**Am 09.09.2026 vom Nutzer am Blech bestätigt.** Bis dahin lag bei F02 *ein* Feuerzeug
pro Blech (Bildfeld 34×54 bei V6). Neu: **4 Spalten × 3 Zeilen = 12 Feuerzeuge**.

Vom Nutzer gemessen (Feuerzeug-Außenmaß, Nullpunkt = linke obere Ecke des Blocks):
- x: 4 Stück à 38 mm, erstes 0–38, viertes 122–160 → **Raster 40,667 mm**, Lücke 2,667
- y: 3 Stück à 59 mm, 0–59 / 61–120 / 122–181 → **Raster 61 mm**, Lücke 2
- Block also 160 × 181 mm

**Gravurfläche = Außenmaß minus 5 mm, also 33 × 54 mm** (2,5 mm Luft je Seite) — wegen der
abgerundeten Ecken. Von 1 bis 5 mm in Stufen als Prüf-DXF durchprobiert, 5 gewann.

**Endstand nach dem Feintuning am 09.09.** (Raster einzeln nachgezogen, jeweils in
Stufen am Blech geprüft): x-Raster **40,867 mm** (+0,2 gegenüber der Messung, Lücke 2,867),
y-Raster **61,6 mm** (Lücke 2,6; erst 61,3, am 09.09. nochmal +0,3). Block mittig auf dem 200×200-Blech.
- Zellmitten x = **38,7 / 79,567 / 120,433 / 161,3**, y = **38,4 / 100 / 161,6**
- Feldkoordinaten: x = **22,2 / 63,067 / 103,933 / 144,8**, y = **11,7 / 73 / 134,3**
  (x = Mitte − 16,5, y = Mitte − 27; Rand ringsum 22,2 waagerecht und 11,7 senkrecht)
- mittlere Zeile und die Blechmitte fallen zusammen (y = 100)

Prüfraster-DXFs (12 Rechtecke, je eigener Layer `Slot_NN`, Ecke oben links als
Orientierung) liegen unter `exports/2026-09-09 Testblatt/F02/`, erzeugt per Skript —
nicht über den Editor, weil der nur Text- und Bildfelder exportiert, keine Rahmen.

Feuerzeug-Oberkanten damit y = **8,9 / 70,5 / 132,1**, linke Kanten x = **19,7 / 60,567 /
101,433 / 142,3**. Gravurfelder werden von der **Feuerzeug-Oberkante** aus bemaßt, nicht
von der Gravurfläche.

**F02_Schw_V1** (B0CD4QVJKR) als erstes darauf gebaut, 09.09.2026: zwei Seiten à 24 Felder.
Je Feuerzeug ein Deckelfeld (28×6, Mitte 11 mm unter der Oberkante) und ein Kombi-Feld am
Körper (28×12, Mitte 40 mm). Gravurbreite generell **max. 28 mm**. Seite 1 = Vorderseite
mit palNum 1 und comboPals [2,3], Seite 2 = Rückseite geometrisch 1:1 mit palNum 4 und
comboPals [5,6]. `autoExport` steht auf **false** — siehe Warnung unten.

**Blocker vor dem Produktivgang:** V1 liefert Vorder- UND Rückseite als je „Texteingabe
1/2/3". Weil die Zeilennummern kollidieren, überschreibt in `getAllTexts` die Rückseite die
Vorderseite (belegt an Bestellung 303-6888507-4752318 vom 07.09.: vorne „FÜR OLAF/von
Chrissi", zurückgeliefert wird „Ich Deins/Du Meins/Wir Eins"). Solange das so ist, graviert
Seite 1 den Rückseitentext und Seite 2 bleibt leer — palNum 4/5/6 existieren in der
Rückgabe gar nicht. Gleiche Wurzel wie die V5-Deckeltext-Falle in [[f02-feuerzeug-layouts]].

Offen: V2–V7. Der Nutzer will sie **einzeln durchgehen**.

**Stand 11.10.2026 (aus layouts.json + .ezd gelesen) — die Werte oben sind ÜBERHOLT:** Raster
x **41,22**, y **61,7**. Feld-x (33er Bildfelder) 22,2 / 63,42 / 104,64 / 145,86; V6-Bild-y 11,3 / 73 / 134,7.
In den .ezd (Ursprung Blechmitte, y nach oben) Bildmitten x −61,3 / −20,08 / 21,14 / 62,36.
V5R.ezd: Deckel-DXF Spalte 3/4 bei 20,82 / 61,82 (0,3/0,5 mm links der Fotomitte), gravur1 −61,76; nur
gravur1 hat Fixed position (Anker −61,3/80,2). Keine der drei Schw-.ezd enthält rueckseite.dxf.
