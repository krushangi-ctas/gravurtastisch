---
name: fl02-raster-mengenstufen
description: "FL02 (Flaschenöffner): 20 Slots = 2 Spalten x 10 Zeilen, Raster 14,222 mm; alle 24 Layouts (4 Farben) in EINEM Ordner FL02"
metadata: 
  node_type: memory
  type: project
  originSessionId: 4d8b577b-3e7c-44e5-9db2-9dfdaa577f22
  modified: 2026-09-24T11:44:44.832Z
---

**FL02 = Flaschenöffner/Bieröffner mit Wunschtext**, angelegt 10.08.2026. Seit 24.09.2026
**28 ASINs = 4 Farben (Blau / Rot / Schw / Gemi) × 7 Mengenstufen** (M1 / M10 / M25 / M50 /
M100 / M250 / **M500**).

**⚠ ASINs ändern sich, wenn ein Angebot neu angelegt wird — die SKU bleibt gleich.**
Am 24.09.2026 waren 7 der 28 hinterlegten ASINs tot: Amazon hatte denselben SKUs
(`FL02_blau_M50`, `_blau_M100`, `_rot_M100`, `_schw_M100`, `_blau_M250`, `_rot_M250`,
`FL02_gemischt_M250`) neue ASINs gegeben. Bestellungen dafür wären in KEIN Layout
gelaufen. **Prüfrezept:** Lagerbestandsliste nach SKU sortieren und ASIN je SKU gegen
`layouts.json` abgleichen — die SKU ist der stabile Schlüssel, nicht die ASIN.
Bei FL01, FL03, FL04, FL05 und K01 stimmte am selben Tag alles.
Gemischt kam am 05.09.2026 dazu, die Layouts `FL02_Gemi_*` am 08.09. als Klone der
Blau-Reihe. **Beim Klonen zwingend neu:** die `arrayGroup`/`arrayOf`-Kennung — sie ist je
Layout eindeutig (jede Farbe hat ihre eigene `ag21_…`), sonst hängen zwei Layouts an
derselben Array-Gruppe. Kürzel ist `Gemi` wie bei FL01/K01, die Amazon-SKU heißt
`FL02_Gemischt_*`.

**Abweichung von der Konvention:** alle 24 Layouts liegen in EINEM Ordner `FL02` — nicht
in sechs Ordnern pro Mengenstufe wie `FL01_xxx_M*` / `K01_xxx_M*`. Bewusste Entscheidung
des Nutzers; alle FL02-Exporte landen dadurch zusammen in `exports/<Datum>/FL02/`.

**Raster (Stand 04.09.2026, geprüft an layouts.json + Export-DXF):** Blech 200×200,
Rand 3 mm, 20 Slots. 2 Spalten x = **29,75 und 132,25** (w = 38, Spaltenabstand **102,5 mm**), 10 Zeilen h = 5 mm bei
y = **15,25** / 29,47 / 43,69 / 57,92 / 72,14 / 86,36 / 100,58 / 114,81 / 129,03 / **143,25**. **15.09.2026: alle 90 FL01–FL05-Layouts um 0,5 mm tiefer** (Nutzerwunsch, jedes Feld y+0,5, per Testblatt-A/B an allen 90 DXF nachgemessen; Sicherung `backups/2026-09-15_vor-fl-verschiebung/layouts.json`).
Raster **14,222 mm** wie ursprünglich („erste Gravur 3–8, letzte 131–136" → (131−3)/9),
Lücke also krumme 9,22 mm (8 und 10 waren getestet und verworfen). Feld-Reihenfolge
row-major wie bei FL01: pro Zeile links, dann rechts. Genutzt werden nur 133 mm der
200 mm Blechhöhe.

**Drei Korrekturen am Maschinentest 04.09.2026** (alle 18 Layouts der Farben Blau/Rot/Schw gleichzeitig,
Zeilenraster 14,222 mm unverändert):
1. **y + 4,75 mm** — Gravur saß zu hoch (4,5 / 5 / 6 / 7 / 8 / 9 mm als Test-DXF
   gegengeprüft, 4,75 gewann).
2. **x + 26 mm** — saß zu weit links; Rand war 10 links / 62 rechts, danach 36/36.
3. **Spaltenabstand 90 → 102,5 mm** (jede Spalte 6,25 mm nach außen, +5 bis +12,5 mm
   durchgetestet). Endstand x = 29,75 / 132,25, Rand links = rechts = 29,75 mm.
   Eine zusätzliche Höhenkorrektur (0,5 / 0,75 mm höher) wurde getestet und **verworfen** —
   die 4,75 mm von Schritt 1 bleiben.

Der Block liegt damit waagerecht mittig auf dem Blech, senkrecht bewusst NICHT (14,75 mm
oben / 52,25 mm unten). Vorherige Werte x = 10/100, y ab 10 sind überholt, ebenso die
7-mm-Verschiebung vom 10.08. **Merke:** M10 (nur linke Spalte) muss jede x-Korrektur
mitmachen, sonst liegt es nicht mehr auf der linken Spalte der großen Bleche.

**Mengenstufen:** M1 = 20 unabhängige Slots (jede Bestellung einzeln), M25–M250 =
1 Master + 19 Array-Kopien (ein Blatt = 1 Bestellung × 20 Stück); **M10 = 10 Slots,
komplette linke Spalte** (seit 11.08., s. [[m10-volle-spalte-regel]]). Wie bei
[[fl01-array-mengenstufen]] läuft die Menge über die Anzahl Bleche; M25 geht mit
20 Slots nicht glatt auf (1,25 Bleche).

**Personalisierung:** nur EIN Textfeld ("Text 1" → "Texteingabe 1", Label „Gravur")
→ palNum 1, eine Seite. Kunden wählen als Schriftart **Schreibschrift** — dort fehlen
Umlaute, ß und der Bindestrich, siehe [[schreibschrift-dalih-font]].

Siehe [[amazon-customization-json-struktur]], [[feste-gravurhoehe]].
