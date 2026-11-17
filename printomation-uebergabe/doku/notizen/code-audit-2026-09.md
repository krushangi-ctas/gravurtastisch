---
name: code-audit-2026-09
description: Durchsicht des Laser-Codes am 17./18.09.2026 — was behoben ist und was offen bleibt
metadata:
  type: project
---

**Behoben am 18.09.2026:**
- `_kantenRegion` dämpft jetzt anteilig statt fest (s. [[laser-regression-18-09]]);
  nebenbei Uint16 statt Float32 (27 statt 54 MB bei 14 Mpx) und Zeilenzeiger statt
  Closure je Bildpunkt (308 statt 414 ms).
- `_dichteRegeln` bekam `rects` übergeben und hat es **ignoriert** — gemessen wurde über
  den ganzen Canvas. Bei invertierter Ausgabe zählte der Blattgrund als graviert: auf
  einem Blech mit zwei Fotos 3,1 % statt 22 % in den Fotoflächen. Betraf „▦ Ganzes Blatt"
  (die Endkontrolle) und den manuellen BMP-Export; der Nachtlauf schreibt je Platz und war heil.
- `_MESS_AUS` / `_REGELUNG_AUS` in layout-editor.html: Auto-Gamma und Dichte-Regelung sind
  in allen vier Testbränden aus. Vorher zog die Regelung jede Kachel auf denselben Wert —
  Kalibrier-Keil `0/22/22/…/100` statt `0/10/20/…/100`, Testgitter-Gamma-Achse dreimal 22,0 %,
  Tiefen-Reihe dreimal 22 %. Der Keil wird aufs Material gebrannt und abgelesen; ein falscher
  Keil verdreht die ganze Kalibrierung.
- `MATERIAL_PRESETS`: `edgeBoost`/`densityTarget`/`localContrast` fehlten in allen acht.
  `setMaterial` baut jetzt auf `LASER_DEFAULTS` statt auf dem Ist-Zustand auf — ein
  vergessener Schlüssel fällt damit auf den Standard und nicht mehr aufs vorige Material.
- Der Faktor der Dichte-Regelung (`geregelt`) wurde berechnet und weggeworfen; steht jetzt
  neben dem Auto-Gamma im Nachtlauf-Log.

**Belegt bit-neutral:** mit `edgeBoost 0` und `densityTarget 0` liefert die neue Pipeline
über alle geprüften Einstellungskombinationen Punkt für Punkt dasselbe Bild wie vorher.

**Offen:**
- **Überstand in der Messfläche.** `rects` ist die FELD-Box; die Fläche, die das Kundenfoto
  innerhalb der Amazon-Platzierung nicht bedeckt, zählt mit. Auto-Kontrast, Auto-Gamma und
  Dichte-Regelung messen damit über tote Fläche. Betrifft ~6 % der Bestellungen (5 von 83
  im September), bei 70 % Fotodeckung landet die Regelung bei 31,7 % statt 22 %. Fix:
  `composePlacement` müsste die AABB des gezeichneten Bildes zurückgeben, `_fieldRectsPx`
  sie hineinschneiden. Siehe [[platzierungsflaeche-bildfelder]].
- `_lokalerKontrastRegion` hat dieselbe Closure-im-Innenloop wie der Sobel vorher (513 ms/14 Mpx).
- In den Presets steht `contrast: 10` neben `autoContrast: true` — wirkungslos, springt aber
  an, sobald jemand Auto-Kontrast abschaltet.
- Aus dem Juli offen: tote ASIN-Auswahl, Monolith. Auth bewusst nicht, s. [[auth-entscheidung]].
