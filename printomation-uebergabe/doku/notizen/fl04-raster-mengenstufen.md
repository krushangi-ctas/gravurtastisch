---
name: fl04-raster-mengenstufen
description: "FL04 (Flaschenöffner Silber): 14 Slots = 2 Spalten x 7 Zeilen, Raster 29,3167 mm (seit 04.09., am Blech erprobt), Gravurhöhe 8 mm; Stauch-Engpass ist die Breite 25 mm"
metadata:
  node_type: memory
  type: project
  originSessionId: 4d8b577b-3e7c-44e5-9db2-9dfdaa577f22
  modified: 2026-09-04T14:10:00.000Z
---

**FL04 = Flaschenöffner Edelstahl/Silber**, angelegt 10.08.2026. Nur EINE Farbe (Silb),
6 ASINs = 6 Mengenstufen (M1 / M10 / M25 / M50 / M100 / M250), alle 6 Layouts in einem
Ordner `FL04` — gleiche Wahl wie bei [[fl02-raster-mengenstufen]].

**Stand 11.08.2026 (geprüft an layouts.json + Export-DXF):** Blech 200×200, Rand 3 mm.
- Spalten x = **43,5** und **131,5** (Feldbreite 25, Spaltenabstand 88) — waagerecht
  mittig, Rand links = rechts = 43,5 mm.
- 7 Zeilen y = **10,05 / 39,367 / 68,683 / 98 / 127,317 / 156,633 / 185,95** (Gravurmitten
  14,05 / 43,367 / 72,683 / 102 / 131,317 / 160,633 / 189,95), Raster **29,3167 mm**. **15.09.2026: alle 90 FL01–FL05-Layouts um 0,5 mm tiefer** (Nutzerwunsch, jedes Feld y+0,5, per Testblatt-A/B an allen 90 DXF nachgemessen; Sicherung `backups/2026-09-15_vor-fl-verschiebung/layouts.json`).

  **Drei Korrekturrunden.** 28.08.2026: Raster 28,5 (y ab 13) → 28,8333, gerechnet aus der
  Annahme „Anhänger 27 mm, 7 Stück über die vollen 200 mm". 04.09.2026 vom Nutzer
  nachgemessen (Anhänger 26,5 mm, Slot 1 = 0–26,5, Slot 7 = 173,5–200) → 28,9167 — **saß
  immer noch nicht.** Danach am Blech durchprobiert: Raster **+0,4 mm → 29,3167** und das
  ganze Blatt **1,5 mm tiefer** (erst 1 mm, dann nochmal 0,5), dazu die Zentrierung
  **x +33,5 mm** (vorher 10 links / 77 rechts). Alle 6 Layouts gleichzeitig gesetzt.

  **Lehre:** die gemessenen Slot-Grenzen ergaben nicht das richtige Raster — bei FL04 hilft
  nur die Testreihe am Blech. Bewährtes Vorgehen: Zeile 4 als Drehpunkt festhalten und das
  Raster in 0,1-mm-Schritten aufweiten, dann das Ganze in mm-Schritten versetzen.

  **Rechenweg für die Zukunft:** `y = Gravurmitte − Feldhöhe/2`. Der Vektorblock ist bei
  fester Gravurhöhe exakt h hoch und hängt oben bündig an y, seine Mitte ist also y + h/2
  — nicht y. Im DXF gegenprüfen: Blechposition von oben = 100 − DXF-y (bei centerOrigin).
- **Gravurhöhe 8 mm** (seit 11.08., vorher 9). Beim Ändern der Höhe muss y mitwandern:
  `y` ist die Feld-OBERKANTE und der Block hängt oben bündig — 9→8 mm heißt y +0,5,
  sonst rutscht die Gravur 0,5 mm nach oben.

**Mengenstufen:** M1 = 14 unabhängige Slots, M25–M250 = 1 Master + 13 Array-Kopien,
**M10 = 10 Slots** (linke Spalte alle 7 + rechte Spalte oben 3) — siehe
[[m10-volle-spalte-regel]].

**Stauch-Engpass ist die BREITE, nicht die Höhe.** Gemessen mit der Export-Logik in Arial
bei 25 mm Feldbreite: „Tobias" 9 mm → 67 %, 8 mm → 75 %, 6 mm → 100 %; „Christina"
52 / 58 / 77 %; „Franz-Josef" 39 / 43 / 58 %. Ab ~5 Zeichen wird auch bei 8 mm gestaucht.
Pro 5 mm mehr Feldbreite ~20 Prozentpunkte. Siehe [[feste-gravurhoehe]].

**Listing:** hatte bis 10.08. zwei Texteingaben (Kunden füllten Zeile 2 auch aus), die
Bestellung vom 11.08. hat nur noch eine → offenbar umgestellt. Layout hat bewusst kein
Kombi-Feld (wie FL01/FL02, anders als [[fl03-fl05-kombi-layouts]]). Für M10–M250 war die
Umstellung am 11.08. noch nicht durch eine Bestellung belegt.

**Nachzügler ohne Export:** `303-8980602-9096316` (M50) und `306-9227831-7657907` (M100),
gekauft/heruntergeladen 09.08., also vor Anlage der Layouts — wegen
`fillDatePreset: session` + Ledger-Eintrag tauchen sie in keinem Lauf mehr auf, es gibt
kein DXF dazu. Beide haben eine 2. Zeile. Weg zurück: [[ledger-zuruecksetzen]].
