---
name: lokaler-kontrast
description: Lokaler Kontrast je Bildbereich in der Laser-Pipeline — Regler localContrast, adaptive Dämpfung, Messwerte
metadata:
  type: project
---

Seit 17.09.2026 in `public/laser-pipeline.js`: `localContrast` (0…1,2), Regler
„Lokaler Kontrast" im Editor zwischen Auto-Kontrast und Auto-Gamma. Default 0 —
bestehende Layouts bleiben bitgleich (in Node geprüft).

Rechnet Kontrast je Bildbereich statt fürs ganze Foto: örtlicher Mittelwert und
Streuung auf einem groben Gitter (8 Stützstellen je Radius, bilinear dazwischen),
Radius = 1/16 der kürzeren Bereichsseite. **Die Verstärkung dämpft sich selbst**:
oberhalb `_LK_ZIEL_SIGMA` (45) wird anteilig heruntergefahren, darunter wirkt der
Regler voll. Ohne diese Dämpfung landeten im Median 19,5 % aller Punkte auf reinem
Schwarz/Weiß; mit Dämpfung 10 % bei Regler 0,5.

An 43 Kundenfotos vom 15./16.09. gemessen (Regler 0,5): Tonwertumfang bei 36 besser,
bei 7 schlechter, Median +1,7 pp, schlimmster Fall −1,2 pp. **Es hilft also nicht bei
allen Fotos** — die Verlierer sind die, die schon viel Kontrast haben.
Laufzeit: 74 ms je F02-Slot, ~2 s für ein volles 40-Mpx-Blatt; bei Regler 0 sofortiger
Ausstieg.

Der richtige Wert hängt am Material und ist am Bildschirm nicht bestimmbar — Startwert
50 %, dann Testblech. Siehe [[auto-gamma]], [[feste-gravurhoehe]].
