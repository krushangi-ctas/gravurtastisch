---
name: kanten-und-dichteregelung
description: Zwei neue Pipeline-Stufen seit 17.09.2026 — edgeBoost (Sobel-Kanten) und densityTarget (regelt am fertigen Raster)
metadata:
  type: project
---

In `public/laser-pipeline.js` ergänzt, beide Default 0/aus (alte Layouts bleiben
bitgleich, in Node geprüft). Regler im Editor unter „Kanten verstärken" und der
Schaltkarte „Dichte-Regelung".

**`edgeBoost`** (0…1): Sobel-Kanten werden abgedunkelt, also NICHT graviert — es bleibt
eine durchgehende schwarze Linie statt Rasterpunkten, die verschmelzen. Normiert aufs
95.-Perzentil (per Histogramm, nicht per Sortieren — spart bei 40 Mpx Sekunden).
Läuft nach dem lokalen Kontrast. Senkt die Gravurfläche deutlich (37 % → 27 % bei 45 %).

**`densityTarget`** (0…1): Behebt einen Konstruktionsfehler von Auto-Gamma — das setzt
die Dichte VOR Schärfen, Kanten, Ausgleich und Rasterung. An 78 Kundenfotos gemessen
streute die tatsächlich gravierte Fläche deshalb von 5,8 % bis 82 %. **Das ist der Grund,
warum bei identischen Einstellungen mal ein gutes und mal ein schlechtes Feuerzeug
herauskam.** Die Regelung sucht per Bisektion den Gamma-Faktor, bei dem das FERTIGE
Raster den Zielwert trifft: 75 von 78 Fotos landen exakt darauf.

Gerechnet wird auf einer verkleinerten Kopie (≤160k Punkte) — die Dichte ist eine
Flächengröße und hängt nicht an der Auflösung; sonst liefe das Dithering zwölfmal über
40 Mpx. Rückgabe `geregelt` = gewählter Faktor.

**Bekannte Grenze:** Überbelichtete Fotos mit großen reinweißen Flächen (3 von 78)
erreicht die Regelung nicht — Gamma lässt Weiß unangetastet. Dort hilft nur `inkMax`;
getestet, wirkt, aber noch nicht in die Regelung eingebaut.
