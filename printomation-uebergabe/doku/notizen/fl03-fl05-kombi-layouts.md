---
name: fl03-fl05-kombi-layouts
description: "FL03 (12 Slots, 4 Farben) und FL05 (10 Slots, Silber) sind die einzigen FL-Gruppen mit Kombi-Feld comboPals [1,2]"
metadata:
  node_type: memory
  type: project
  originSessionId: b009d207-ad97-434d-afbc-85a3f302544e
  modified: 2026-09-08T00:00:00.000Z
---

Beide angelegt 10.08.2026, alle Layouts je Gruppe in EINEM Ordner (wie
[[fl02-raster-mengenstufen]]), Blech 200×200, Rand 3 mm, Arial, `overflowMode: stauch`.

**FL03** — **24 ASINs = 4 Farben (Blau/Schw/Grün/Gemi) × 6 Mengenstufen**; Grün kam am
01.09.2026 dazu, Gemischt am 02.09., die Layouts am 08.09. als Klone der Blau-Reihe
(SKU heißt `FL03_Grün_*` / `FL03_Gemischt_*`, Layout-Kürzel `Gemi`). 12 Slots = 2 Spalten
x = **31 / 144** (Breite 25, Spaltenabstand 113), 6 Zeilen y = **15,5** / 47,7 / 79,9 /
112,1 / 144,3 / **176,5** (Schritt 32,2), Höhe 10 mm. **15.09.2026: alle 90 FL01–FL05-Layouts um 0,5 mm tiefer** (Nutzerwunsch, jedes Feld y+0,5, per Testblatt-A/B an allen 90 DXF nachgemessen; Sicherung `backups/2026-09-15_vor-fl-verschiebung/layouts.json`).

Zwei Korrekturrunden: Das Ur-Raster (x 10/120 b30, y 13,5…171 h8) saß am Blech falsch,
am 14.08.2026 auf x = 0/113, y ab 10 korrigiert. Am **04.09.2026** dann per Maschinentest
nochmal **x + 31 mm** (die linke Spalte klebte bündig an der Blattkante x=0, rechts
blieben 62 mm frei → jetzt waagerecht mittig, Rand 31/31) und **y + 5 mm** (5–10 mm als
Test-DXF durchprobiert, 5 gewann; unten bleiben 14 mm Luft). Alle 12 Layouts gleichzeitig,
M10 eingeschlossen — dessen 6 linke + 4 rechte Slots liegen auf denselben Spalten.

**Array verschiebt nichts:** `createArray` rechnet die Kopie-Positionen EINMAL beim
Anlegen aus und schreibt sie ins Feld-JSON; `_syncArrayClones` kopiert danach nur noch
Inhalt (Text/Bild/Font), keine Geometrie. M50 (Array) und M1 (ohne) liefern DXFs mit
identischen Koordinaten — gemessen 14.08.2026. Bei Abweichungen am Blech also erst die
DXF nachmessen, dann Ezcad/Maschine verdächtigen, nicht Array oder Kombi-Feld.

**FL05** — 6 ASINs = nur Silber. 10 Slots = 2 Spalten x = **34 / 136** (Breite 30,
Spaltenabstand 102), 5 Zeilen y = **17,5 / 57,75 / 98 / 138,25 / 178,5** (Raster 40,25, Stand 15.09.),
Höhe 10 mm. Alle 6 Layouts identisch, M10 eingeschlossen.

Am **04.09.2026** per Maschinentest korrigiert (vorher x = 10/112, y ab 10, Raster 40,75):
**x + 24 mm** (Rand war 10 links / 58 rechts → jetzt 34/34), **Raster −0,5 mm** (0,1 bis
0,5 durchgetestet, mittlere Zeile als Drehpunkt) und **6 mm tiefer** (erst 1–5 getestet,
5 gewann, dann nochmal +1). Unten bleiben 12 mm Luft.

**Kombi-Feld:** `comboPals: [1,2]`, `comboGapMM: 1`, `comboCenterSingle: true` — zwei
Gravurzeilen gleich hoch gestapelt, bei nur einer gefüllten Zeile wird sie mittig
gesetzt. Passt zum Listing: Bestellungen bringen zwei „Texteingabe"-Einträge
(z. B. „AlWoSch_83" / „Sagt Prost"). FL01/FL02/FL04 haben bewusst KEIN Kombi-Feld.
Mechanik siehe [[kombifeld-feature]].

Zeilenhöhe daraus: FL03 Versalhöhe 3,52 mm (seit h=10), FL05 3,48 mm — deutlich kleiner
als die Feldhöhe, deshalb staucht hier fast nichts (erst ab ~20 Zeichen).
M10 = 10 Slots nach [[m10-volle-spalte-regel]].

**„Mittig" bei EINER Zeile zentriert die Zeilenbox (Versal + Unterlänge), nicht die
Tinte** — gemessen 14.08.2026 im 10-mm-Feld: „Sagt Prost gg" 12,71–17,26 (Mitte 15,0 ✓),
„Max Mustermann" 12,77–16,29 (Mitte 14,53, also 0,47 mm hoch). Gewollt: so steht die
Grundlinie auf allen Blechen gleich, unabhängig vom Text.

**Neue Farbe anlegen = Blau-Layout klonen** (FL02 08.09., FL03 08.09.): id, name,
globalAsin, date neu — und **zwingend eine frische `arrayGroup`/`arrayOf`-Kennung**, die
ist je Layout eindeutig. Danach mit dem Testblatt-Knopf gegenprüfen, ob Slot-Zahl und
Spaltenmitten zur Vorlage passen.
