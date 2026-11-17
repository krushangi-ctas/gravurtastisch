---
name: gesichter-konturen-2026-09-27
description: "27.09.2026: „gezeichnet"/dunkle Gesichter F02 Schwarz — KEIN Rückschritt seit Freitag (bitgleich); Streifen rechts behoben; LIVE (Stand 29.09.): konturen 1.5 statt edgeBoost, regionImmer 0.35 (Warnung 0.5), Schattenstufe (inkDropout 0.06, schattenAuf 0.14), densityTarget 0.22, grafikWeich AN — F02_Schw_V5–V7 + Preset; Freeze stand-2026-09-29-freigegeben/"
metadata:
  type: project
---

**Befund:** Freitags-Stand (vor-bereichsausgleich/) gegen heute im Trockenlauf: Sa 12/13, So 11/13
Plätze bitgleich (Abweichung nur Vereinslogo + 2 Sonnenuntergänge mit Bereichsausgleich).
„Schlechter als Freitag" kam von den Fotos, nicht vom Code. regionAusgleich 0 ist damit KEIN Hebel.

**Streifen rechts — behoben, live seit 27.09. ~15:25 UTC:** Laser-Leinwand war GERUNDET (650 px),
Feld 649,6 px → letzte Spalte 40 % Blattweiß → nach Schärfen/Invertieren 99–100 % graviert.
Fix: `_buildLaserCanvas` rundet ab (649×1062 bzw. 649×629). Dazu Sobel in `_kantenRegion` bis an
den Rand (vorher Randreihe nie abgedunkelt → 1-px-Rahmen 40–60 %). Fläche ±0,5 Punkte.

**„Gezeichnet"/schwarze Augen:** `edgeBoost` dunkelt beide Seiten jeder Kante ab (95.-Perzentil
normiert) → dünne HELLE Details (Lichtreflex, Augenweiß) werden schwarze Striche.
**Dunkle Gesichter:** heller Hintergrund nimmt das 23-%-Budget; Warnkennzahl (≥40 %) erfasst es nicht.

**Neu gebaut und LIVE (27.09. ~20:40 UTC, Nutzer: „mach 35 %"):** F02_Schw_V5/V6/V7 + Preset
„Feuerzeug schwarz" = `konturen 1.5, konturRadius 2, regionImmer 0.35, regionAusgleich 0.5` (edgeBoost
0.65 bleibt als Rückfall stehen, ruht bei konturen > 0 — im Editor abgeblendet).
- `konturen` (Regler „Konturen vertiefen"): einseitige Unschärfemaske, nur dunkle Seite.
- `regionImmer` = GRUNDSTÄRKE (Zahl; `true` = wie regionAusgleich) für jedes Foto, S/W ×0,7. Die
  Warn-Prüfung läuft weiter am unausgeglichenen Bild; bei Warnung (≥40 %, S/W ≥31 %) wird
  `regionAusgleich` (0,5) probiert und übernommen, wenn ≥5 Punkte besser — sonst Grundstärke.
  Grund: mit 35 % allein fielen die 6 bisherigen Warn-Fälle zurück (S/W-Silhouette 6 → 18 %).
**Schattenstufe (live ~21:15 UTC, Nutzer: „hell-dunkel und richtig dunkel unterscheidbar"):** `schattenAuf`
(Regler „Dunkelgrau anheben" unter „Sprenkel wegschneiden"): Tinte < inkDropout → schwarz, inkDropout…25 % →
linear auf schattenAuf…25 %. Ursache vorher: Schnitt 12 % machte jede gleichmäßige Fläche darunter schwarz
(dotGain drückt vorher zusätzlich). 58 Fotos: Abstand dunkelgrau − schwarz 7,6 → 12,2 Punkte, verirrte Punkte in
fast schwarzen Blöcken 401 → 252/Foto, Gesichter Median 26,2 → 24,9 %. Globale Regler (Schatten aufhellen,
dotGain) wirken im Dunkeln NICHT — die Dichte-Regelung gleicht sie aus.
Testblech `exports/_Testblech-Gesichter-2026-09-27/F02_Schw_V7`: Spalte 4 = bitgleich Produktion.
Durchsicht 80 verschiedene Kundenbilder (Vorwoche-Rohbilder aus Sitzung 427e0116 + Wochenende + Testfotos):
kein Ausfall; Augen mit Iris statt schwarzer Ovale; Visitenkarten-Schrift sauberer. Grenzen: Gegenlicht-
Gesichter, sehr dunkles Gesicht im S/W-Hochzeitsfoto (auch 70 % Ausgleich nur 14 → 17 %).
Gesichtsfinder pico.js (nur Messhilfe, nicht eingebaut) fand Gesichter in 48/92 — gerade die
Problemfälle nicht. Nutzer 27.09.: nicht weiter verfolgen.

**Nachteil gemessen (36 Fotos, Median):** Spreizung der 2-mm-Zonen jetzt 57 % → Ausgleich 35 %: 52 %,
50 %: 45 % (>10 Punkte Verlust bei 10 bzw. 21 von 36 Fotos) = Risiko „verwaschen" wie 21.09.; helle Zonen
27,6 → 24,8 / 22,4 %, Schwarz 14,4 → 13,7 / 11,1 %; Sprenkel −20 %. Empfehlung 35 %.

**Labor (wiederverwendbar):** Pipeline-Eingang je Platz im Trockenlauf mitschneiden (Hook um
applyLaserPipeline + `window.__slot` vor `_buildLaserCanvas(ditherOpts, { only: f })`), dann in
Node mit laser-pipeline.js rechnen — bitgleich zum Browser (37/37 geprüft). Varianten in Sekunden.
Sicherungen: `sicherungen/2026-09-25-27-vor-aenderungen.tar.gz (darin vor-gesichter-27-09/)`, Bestelldaten 25.–27.09. in sicherung-bestellungen-2026-09-25-27 (am 03.10. GELÖSCHT, Kundendaten).

Siehe [[uebergabe-fotoqualitaet-2026-09-27]], [[bereichsausgleich]], [[f02-schwarz-einstellung]], [[export-trockenlauf]].

**28.09. (Urteil Lauf 28.09.):** „Gravuren gut; Gesichter 3–5 % zu hell; Logos: Rauch verschmilzt,
Schrift undeutlich." Befund Camel (306-0374009, 374×600-JPEG hochgerechnet): Logo-Erkennung verlangt
harte Kanten → lief als FOTO; Dichte-Regelung (38 % reines Schwarz ausgleichen), Ausgleich und
Schattenstufe hoben den violetten Rauch ins Motiv-Grau. Schrift-Unschärfe = Bild.
GEBAUT (Standard aus, 111/111 bitgleich): `grafikWeich` (Schalter „Grafiken mit Verläufen erkennen",
nur mit grafikAuto): Inneres ≥15 % reines Schwarz + Median|Laplace| ≤4 + Farbe ≥10 → Tonwerte der
Vorlage (Konturen, Floyd, Schnitt; ohne Regelung/Motiv/Ausgleich/Schattenstufe/dotGain). Trifft von 88
Kundenfeldern genau Camel + Mazda, von 1.600 Stockfotos 20 (Nacht/Low-Key). Belegung „ALS GRAFIK
GRAVIERT", vorschau „als Grafik graviert". `alsGrafik` = Haken in der Reklamation (Techno-Tierchen,
Visitenkarte werden nicht erkannt). Dichte-Vorschlag 23 → 20 % (Gesichter −2,5…3 Pkt; Gesichter
12–18 % steigen von 4 auf 14 von 70 → Risiko „zu dunkel"). 29.09. ~20:40 UTC LIVE auf Nutzerwunsch mit Dichte **22 %** (nicht 20) + grafikWeich AN; neuer Freeze
`sicherungen/2026-09-27+29-freigegebene-staende.tar.gz (darin stand-2026-09-29-freigegeben/)` (Referenz-BMPs so/sa/mo/di, LIESMICH.txt). Alter Freeze (23 %) bleibt. vorschau.png bei V5 wirkt körnig (Verkleinerung), die BMP ist ok.
