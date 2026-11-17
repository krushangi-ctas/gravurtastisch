---
name: ueberstand-wird-graviert
description: composePlacement füllte den Bildüberstand weiß — auf schwarzem Material wurde er dadurch voll graviert
metadata:
  type: project
---

**Symptom:** Einzelne Feuerzeuge kommen fast komplett schwarz heraus, das Motiv fehlt ganz.
Am 17.09.2026 bei 028-0556676-1934757 und 028-9350420-0592310 aufgetreten.

**Ursache:** Zieht der Kunde sein Bild kleiner als die Amazon-Platzierungsfläche, bleibt
Überstand. `composePlacement` in layout-editor.html füllte den fest mit `#fff`. Auf
schwarz lackiertem Material (`invert`) heißt Weiß aber **voll gravieren** — gemessen
waren die Randstreifen zu 100 % abgefahren.

**Warum es jetzt erst auffiel:** Der Altbug kostete früher nur den Rand. Seit der
Dichte-Regelung ([[kanten-und-dichteregelung]]) rechnet sie die viele Randgravur in die
Zieldichte ein und drückt dafür das Motiv auf **0 %** — aus einem Randfehler wurde ein
schwarzes Werkstück. Gemessen am selben Bild: Bildmitte vorher 18–25 %, danach 0 %.

**Behoben** am 17.09.2026: `composePlacement(src, placement, outW, outH, fuellung)` —
der Laser-Pfad (`opts.useOriginal`) übergibt bei `invert` jetzt `#000`, die
Bildschirm-/PDF-Vorschau weiter `#fff`. Beide Fälle nachgerechnet: Rand 100 % → 0 %,
Bildmitte 0 % → 27 % bzw. 4 %. Bilder ohne Überstand bleiben bitgleich.

**Prüfrezept:** Randstreifen (6 % oben/unten) gegen die Bildmitte messen. Rand nahe 100 %
bei gleichzeitig niedriger Mitte = dieser Fehler.
