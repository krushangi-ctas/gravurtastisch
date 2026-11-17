---
name: rekla-303-2788363-glitzer-grafik
description: "Rekla 20.10.2026 (V7, rosa Glitzer-Schrift-PNG auf transparentem Grund): Grafik-Weiche trennte bei 128 → 0,8 % Gravur; Lösung laserJe threshold 30; Rekla-Knöpfe wirken bei Grafiken nicht"
metadata:
  type: project
---

303-2788363-7990721, F02_Schw_V7, 6 Stück, Kundenbild „GONE TOO SOON Glitter Memorial Typography.png" (RGBA, 81 % transparent).
Tageslauf 19.10. (Satz1 Platz 12, Satz2 Platz 1–5): nur 0,8 % Gravur, Buchstaben zerfressen.

Ursache: Grafik-Weiche (`_alleGrafik` → `_grafikEinstellung`, Schwelle `threshold` 128). Glitzer-Buchstaben haben
Luma-Median 114 → nur 43 % der Buchstabenfläche über 128. Rekla-Knöpfe (Dichte/inkMax) ändern bei erkannter Grafik
NICHTS (Dateien bitgleich) — `_grafikEinstellung` schaltet Dichte & Co. ab, lässt aber `threshold` durch.

Lösung: Variantenlauf s30/s50/s70/alsLogo verglichen → `laserJe {F02_Schw_V7: {threshold: 30}}` (2,9 % Gravur,
Buchstaben voll, Kleinzeile lesbar). Nutzer GO → echter Export F02_Schw_V7 + _PNG nach
`2026-10-20 Reklamation/303-2788363-7990721/F02_Schw_V7/` (Platz 1–6, bitgleich zur Vorschau). Werkstück-Urteil offen.
Siehe [[grafik-weiche]], [[rekla-foto-nachbessern]].
