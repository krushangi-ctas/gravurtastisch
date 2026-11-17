---
name: bereichsausgleich
description: "regionAusgleich (25.09.2026): jeder Bildbereich eigene Grundhelligkeit (Himmel runter, Schatten hoch, Zeichnung bleibt) — greift NUR bei Plätzen mit ≥40 % verlorener Zeichnung; an in F02_Schw_V5/V6/V7 mit 0,5"
metadata:
  node_type: memory
  type: project
  originSessionId: 427e0116-b750-489b-bc00-aa77595e4bc9
  modified: 2026-09-25T13:27:05.920Z
---

Anlass: Landschaft 305-3612873-3852364 (V5). Bedeckter Himmel nahm das Budget, Landschaft schwarz,
72 % Zeichnung verloren. Motiv-Automatik erkennt Landschaft zwar (keine Haut → Detailzonen),
hat aber nur das globale Gamma → Himmel wird mit hell, Deckel 40 % greift. `inkMax 0.45` rettete
die Landschaft, Nutzer: „Landschaft gut, Himmel nicht" (Wolken weg, flach grau).

**Umsetzung** (`public/laser-pipeline.js`, `_regionAusgleichRegion`): Grundhelligkeit per
selbstgeführtem Filter (fast guided filter, Gitter ~160, Radius 1/8, eps 40²), nur sie wird um
Faktor `regionAusgleich` zur Mitte gestaucht, Zeichnung bleibt. Nur das UNGRAVIERTE Ende läuft
aus (Überstand #000 bei invert) — beidseitig gab helle Flecken auf Stirn/Wange.

**Sicherungen („es darf nichts kaputt machen", Nutzer):** Default 0. Greift nur bei EINEM Rect
(Einzelplatz; „Ganzes Blatt" zeigt es nicht), ≥64 Graustufen (Grafiken raus), und nur wenn der
Platz ohne ihn ≥40 % Zeichnung verliert UND es ≥5 Punkte besser wird — sonst bitgleich.
Belegt: Tageslauf 25.09. aus = 182 Dateien bitgleich (nur Zeitstempel), an = nur der Problemplatz;
15 schwere Fälle: 13 bitgleich, geändert Landschaft 72→0 % und Porträt 306-5916372 49→16 %.

**Stand:** an (0,5) in F02_Schw_V5/V6/V7 seit 25.09. ~13:25 UTC, Silber aus. Regler Laser-Reiter
„Bereiche einzeln belichten". belegung.txt meldet „BEREICHE EINZELN BELICHTET". **Am Werkstück
noch NICHT beurteilt.** Sicherung: `/var/www/printomation/gravurtastisch-orders/sicherungen/2026-09-25-27-vor-aenderungen.tar.gz (darin vor-bereichsausgleich/)`.
Seit 25.09. abends: S/W-Fotos schon ab 31 % (mild 0,7×), Farbfotos weiter 40 % — s. [[schwarz-weiss-bilder]]. Logos (Logo-Weiche) bekommen keinen Ausgleich.

26.09. Review-Fix: Ausgleich wirkt jetzt auch auf den 1–2-px-Feldrand (vorher helle Linie an der Oberkante, oberste Reihe 85 % graviert); Preset „Feuerzeug schwarz“ trägt regionAusgleich 0,5 (sonst setzte Preset-Klick ihn still auf 0). Sicherung davor: `vor-review-fix-26-09/`.

Siehe [[schwarz-weiss-bilder]], [[verlorene-zeichnung]], [[motiv-automatik]], [[export-trockenlauf]].

27.09.: Option `regionImmer` (Haken „bei jedem Foto“) wendet ihn bei JEDEM Foto an (S/W ×0,7) — gegen dunkle Gesichter vor hellem Grund, die die 40-%-Schwelle nie erreichen. Standard aus; Kandidat für F02 Schwarz, s. [[gesichter-konturen-2026-09-27]].
