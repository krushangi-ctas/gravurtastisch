---
name: motive-vektorgrafiken
description: "Motiv-Verwaltung im Editor (Reiter ◆ Motive): AI/EPS/SVG/DXF/PDF werden serverseitig in mm-Polylinien umgerechnet; seit 26.09. Baustein „Motiv\" im Reiter Felder (Fest / Je Antwort)"
metadata:
  node_type: memory
  type: project
---

Gebaut am 10.09.2026 für das F02-V2-Ornament. Vorher gab es **keinerlei** Motiv-Ablage:
`motive/` war ein leerer Ordner, und der Editor kennt bis heute nur Text-, Bild-,
Nummern- und Statikfelder — für Vektorgrafik gibt es **keinen Feldtyp**.

**Was steht:** [motive.controller.js](motive.controller.js) liest AI/EPS/PS, SVG, DXF und
PDF und normalisiert alles auf **Polylinien in Millimetern, Ursprung oben links, y nach
unten** — dieselbe Rechnung wie die Felder im Editor. Routen in index.js: `GET /motive`
(Liste), `POST /motive/upload`, `GET /motive/:name/pfade`, `.../vorschau.svg`, `DELETE`.
Die umgerechneten Pfade liegen als `<Datei>.json` daneben, einmal beim Hochladen gerechnet.
Im Editor der Reiter **◆ Motive** neben „Schriften": Upload-Fläche, Liste mit Vorschau,
Löschen.

**Feldtyp `motiv`** (10.09.2026 nachgezogen): Karte aus der Bibliothek aufs Blatt ziehen
(`motivDrag` → `motivAufsBlatt`). Das Feld trägt nur `motivDatei`, die Pfade kommen zur
Laufzeit über `/motive/<name>/pfade` in `_motivCache` — **nie ins Layout speichern**, sonst
bläht jede Kopie die layouts.json und eine geänderte Motivdatei käme in alten Layouts nie
an. `motivGeometrie` passt die Grafik seitenverhältnistreu in die Feldbox ein und zentriert
sie darin; verzerrt wird also nie. Export als POLYLINE auf Layer **`Motiv`**, damit sich das
Ornament in Ezcad getrennt vom Text parametrieren lässt. Vervielfältigen über den normalen
Raster-Knopf (`repeatField`), der kopiert typunabhängig.

**`_motivAktiv` ist kein Detail:** ein Motiv wird nur exportiert, wenn ein Gravur-Feld, das
es überlappt, auch Text trägt. Ohne das brennt der Laser das Ornament auf jede der zwölf
Positionen, auch wo gar kein Feuerzeug liegt. Überlappt ein Motiv gar kein Textfeld
(freistehende Verzierung), wird es immer graviert. Gegengeprüft: volles Blech 12 Ornamente,
halb befülltes 6.

**Stolperstein beim Bauen:** `d.push(...entities)` in `buildDXFContentMultiPage` warf
„Maximum call stack size exceeded", sobald Motive dazukamen — zwölf Ornamente à 153 Pfaden
sind rund 900.000 Array-Einträge, und Spread legt jedes als Argument auf den Stack. Ersetzt
durch `_anhaengen()`.

**Warum eigene Parser:** Ghostscript steigt an CorelDRAWs Prolog aus („/undefined in
Adobe_packedarray"), Inkscape ist nicht installiert. Eine `.ai` bis Illustrator 8 ist
PostScript (Klartext, Operatoren m/l/L/c/C/v/V/y/Y + S/s/f/b), ab Version 9 ist sie PDF —
am Dateikopf `%PDF` unterscheidbar. Alle Koordinaten sind absolut; Groß-/Kleinschreibung
markiert nur Eck- gegen Glättungspunkt.

**Douglas-Peucker ist Pflicht, nicht Kosmetik.** Das getracte F02-Ornament hatte 27.159
Punkte; zwölfmal auf dem Blech ergab das eine **16-MB-DXF**, zu viel für Ezcad2. Mit 0,02 mm
Toleranz bleiben 1.763 Punkte, das volle V2-Blech wiegt 1,9 MB statt 4,8.

**Die Toleranz-Formel richtig herum:** `eps = 0.02 * (breite / 30) / einheit`. Die Vorlage
ist meist viel größer als die Gravur, der Fehler schrumpft beim Verkleinern also mit — bei
einer 114-mm-Vorlage darf in der Datei 0,076 mm abweichen, damit bei 30 mm Gravurbreite
0,02 mm ankommen. Am 10.09.2026 stand dort erst eine Division statt der Multiplikation:
große Vorlagen wurden viel zu fein behalten (5.903 statt 1.763 Punkte) und kleine wären zu
grob geworden. Bei 600 dpi in Gravurgröße gegengerendert, kein sichtbarer Unterschied zur
Rohfassung. **Die Originaldatei bleibt unangetastet**, ausgedünnt wird nur die `.json`;
eine andere Toleranz lässt sich also jederzeit neu ableiten (`.json` löschen genügt).

Beim Export aus Illustrator/Corel: **Schrift in Konturen umwandeln**, sonst kommen keine
Buchstaben mit — die Parser lesen nur Pfade, keine Textobjekte.

**Pro Motiv einstellbar** (10.09.2026): Zahnrad auf der Karte klappt Punktdichte und Namen
auf. `POST /motive/:name/toleranz` rechnet die `.json` mit anderer Toleranz neu (0,005–0,1 mm;
am F02-Ornament: 0,05 → 1.202 Punkte, 0,02 → 1.763, 0,01 → 2.329). `POST /motive/:name/
umbenennen` benennt Datei und `.json` um **und zieht `motivDatei` in allen Layouts mit** —
ohne das zeigten die Motiv-Felder ins Leere und der Export ließe die Grafik still weg.
layouts.json wird dabei wie üblich vorher nach `.bak` gesichert.


**Baustein „Motiv" im Reiter Felder (26.09.2026, ersetzt den Baustein „Dropdown"):** legt ein
leeres Motivfeld mit eigener `ddGruppe` an (`motivFeldAnlegen`). Rechts Karte „Motiv" mit
Schalter **Fest** (eine Datei für alle Plätze → `motivFestSetzen`, gilt für alle gleichartigen
Felder, leeres Feld bekommt die Höhe aus dem Seitenverhältnis) oder **Je Antwort** (Frage +
Motiv-Kacheln, z. B. Buchstabe → Monogramm). Gespeichert zählt nur `ddFrage`; „Je Antwort" ohne
Frage ist reine Anzeige (`_motivJeAntwort`). Zurück auf Fest löscht Frage + Zuordnung (mit
Rückfrage). Der Bereich „Dropdown" am Motivfeld zeigt nur noch „Nur gravieren, wenn …".
Ziehen aus dem Reiter ◆ Motive geht weiter (Fest, ohne ddGruppe). Geprüft: F02_Schw_V2
Füllen + DXF alt/neu zeichengleich.

**02.10.2026:** Ausrichtung je Motiv „Umriss“ (Standard) oder „Spalt“ (Split-Monogramm: Balken = Feldbreite, Spaltmitte = Feldmitte, `anker` in der .json). Details in [[f02-v3-monogramm]].
