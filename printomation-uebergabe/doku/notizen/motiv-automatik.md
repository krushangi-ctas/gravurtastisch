---
name: motiv-automatik
description: "autoMotiv: Dichte-Regelung misst im Motiv statt im ganzen Feld — Hautkaskade, Boden-Regel; am Werkstück bestätigt 24.09.2026, Deckel 30 % war zu eng"
metadata: 
  node_type: memory
  type: project
  originSessionId: 57dd819a-65b2-432c-818b-dba434f66052
  modified: 2026-09-24T11:10:11.535Z
---

`autoMotiv` in `public/laser-pipeline.js` (23.09.2026 gebaut, **Standard aus**, am Werkstück
noch NICHT beurteilt). Die Dichte-Regelung misst damit nicht mehr über das ganze Feld,
sondern im Motiv. Drei Teile, jeder aus einer Messung entstanden:

1. **Motiv finden** (`_motivZonen`): Haut auf dem FARBBILD (Kovac-Regel, muss vor `_toGray`
   laufen) → sonst Detailzonen in den mittleren 60 % → sonst ganzes Feld.
2. **Boden, keine Vorgabe:** Die Motivmessung darf nur MEHR Gravur verlangen als die
   Feldmessung, nie weniger.
3. **Deckel `densityMax` 0.30** auf die Gesamtfläche.

**Why:** Die Regelung traf ihr Ziel über das Feld auf 1,2 Punkte genau, aber im Gesicht
streute es um Faktor 6 ([[testblech-5-dichtetreppe]]). Teil 2 kam aus einem Beinahe-Unfall:
Ohne ihn wäre 304-2889176 — ein Foto, das der Nutzer GUT fand — von 23,2 % auf 7,4 %
gefallen, also fast schwarz. Teil 3, weil ohne Deckel 30–47 % Gesamtfläche herauskamen und
über 30 % am Werkstück durchgehend „flau" geurteilt wurde.

**AM WERKSTÜCK BESTÄTIGT (Testblech 24.09.2026):** 302-2165501 alt „echt schlecht, zu
dunkel" gegen neu „sieht gut aus" — dasselbe Foto, dasselbe Blech, nur die Regelung
anders. Das ist der erste Vergleich, der die Material-/Maschinenstreuung ausschließt.
**Der Deckel 30 % war zu eng:** 304-8655030 wurde ohne Deckel (37,6 % Fläche) deutlich
besser beurteilt als mit (30,2 %). Die Regel „über 30 % wird es flau" gilt NICHT für
ausgehungerte Motive — dort landet die Fläche im Motiv, nicht in einer hellen Wand.

**SEIT 24.09.2026 SCHARF** in `F02_Schw_V6` und `F02_Schw_V7` (`autoMotiv: true`,
`densityMax: 0.40`). V5 bleibt aus. **Nachtrag 25.09.: layouts.json zeigt auch F02_Schw_V5 mit autoMotiv true / densityMax 0.4.** Schalter dafür: Laser-Reiter → Dichte-Regelung →
„Motiv-Automatik". Gegenprobe über 54 Kundenfotos: 24 unverändert, 30 angehoben, **0
gesenkt**, kein Bild mit schlechterer Kennzahl (Mittel 15,4 → 11,7 %). **Offenes Risiko:
10 der 54 landen bei rund 40 % Gesamtfläche** — davon ist nur einer am Werkstück bestätigt.
`belegung.txt` hat dafür seit heute eine Spalte „Flaeche".

**How to apply:** Mit `autoMotiv` aus ist die Pipeline bitgleich zur Fassung davor (0 von
690.950 Punkten, 5 Bilder) — dieser Nachweis gehört vor jede Änderung an der Datei.

**Grenzen, die sie nicht löst:** Gesichter unter ~100 px im Feld, strukturlose Flächen
(Rauch), und ein dunkles Gesicht neben einem hellen Nachbarn (306-2574539) — das braucht
eine Schattenaufhellung, keinen Dichte-Griff. Siehe [[verlorene-zeichnung]] und die vier
Griffe in `src/testfoto/URTEILE.md`.

**Achtung:** Zwei Renderläufe derselben Einstellung unterscheiden sich um ~10 % der
Bildpunkte (gemessen 23.09., deckt sich mit der bekannten Streuung bei gedrehten
Platzierungen). Vergleiche deshalb Fläche und Eindruck, nie Punktmuster.

**Landschaft (25.09.):** Ohne Haut misst sie die Detailzonen (Bäume), hebt per Gamma — der helle Himmel läuft mit, Deckel greift, 72 % verloren. Gelöst durch [[bereichsausgleich]], nicht hier.
