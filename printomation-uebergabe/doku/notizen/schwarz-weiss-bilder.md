---
name: schwarz-weiss-bilder
description: "S/W & Logos (25.09.2026, alles live): S/W-Grafiken per 2. Erkennungsweg; bunte Logos auf dunklem Grund per Logo-Weiche (Atkinson, Tonwerte lassen); S/W-Fotos Bereichsausgleich ab 31 % mild"
metadata:
  type: project
---

Nutzer: „S/W-Bilder schwer — sollten wir nicht weniger anfassen?" Geprüft an 112 echten
F02-Feldern (7 Tage lesend per SP-API nachgeholt, s. unten) — Ergebnis je Typ:

**S/W-Grafiken — These stimmt, jetzt live (25.09. ~20:10 UTC).** Kleine Vorlagen bekommen beim
Hochrechnen weiche Kanten → mehr als 40 Stufen → Fotopipeline → angefressene Schrift/Kranz.
Zweiter Weg in `_alleGrafik`: zwei Spitzen ≥50 % am Rand (`_spitzenAmRand`) UND unter 5 %
„ruhige Zwischentöne" (`_flacheZwischentoene`: Wert 33…222, Nachbarn < 16 verschieden).
Grafiken 0,1/2,9 %, Fotos ab 11,8 %. Von 112 Feldern ändern sich genau Waage 302-6175970 und
Rolling Thunder 306-6027394; Tageslauf bitgleich. Sicherungen `vor-grafikerkennung/`, `vor-logo-sw/`.

**S/W-Fotos — These stimmt NICHT.** 10 S/W-Fotos, 5 Verfahren: „kaum anfassen" lässt die
Fläche 11–53 % springen, 5/10 schlechter. Ohne Auto-Kontrast: Kennzahl 6/10 besser, am Bild
kaum sichtbar → nicht eingebaut. Die Ausfälle sind helle Flächen (Himmel, weiße Shirts) →
[[bereichsausgleich]]. **Live:** S/W-Fotos (Farbspreizung < 3) bekommen ihn schon ab 31 % und
im Band 31–40 % mit 0,7 × Stärke (0,35) — bei 0,5 wirkte es flach. Trifft 2 von 10 S/W-Fotos
(35→18 %, 37→11 %), kein Farbfoto; S/W-Fotos liegen 4× so oft im Band wie Farbfotos.

**Bunte Logos — gelöst für „Logo auf dunklem Grund" (live ~20:45 UTC).** Nutzer: „Texte feiner".
Flache Zwischentöne, Farbpalette, EXIF/Format trennen NICHT von Fotos. Was trennt: harte Kanten
(Sobel/4 > 100) ≥ 2,5 % UND Luma < 24 ≥ 35 % (`_istLogoAufDunkel`) — Onkelz 3,6–7,6 % bei
45–73 %, dunkle Fotos ≤ 1,2 %, Laubfotos bis 5,3 % aber ≤ 19 % dunkel; 0 von 94 Fotos.
Behandlung `_logoEinstellung`: Atkinson, kein Auto-Gamma/Dichte/Motiv/Region, keine
Kanten/Schärfen/Schnitt — gegen 6 Verfahren verglichen, Schrift satt, Grund sauber, farbige
Teile bleiben (Schwelle verlor sie). Belegung: „ALS LOGO GRAVIERT". NICHT erfasst: bunte
Grafiken auf hellem Grund (TOXIC, Marlboro, MB-Karte, Comic) — offen.

Nachladen ohne Seiteneffekte: eigenes Skript mit config.js + axios/unzipper per
`require.resolve(..., {paths:[src]})` (Pfad-require lädt die ESM-Fassung), RDT-Token,
getOrderItems 2,1 s Abstand, ZIP im Speicher entpacken. 61 Bestellungen in ~3 Min.

Siehe [[grafik-weiche]], [[verlorene-zeichnung]].
