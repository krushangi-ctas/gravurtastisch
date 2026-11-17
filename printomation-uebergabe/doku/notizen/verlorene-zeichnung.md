---
name: verlorene-zeichnung
description: "Die Kennzahl, die gut von schlecht trennt (21.09.2026) — Bildbereiche mit Detail im Original, die in der Gravur flach sind; als Warnung eingebaut, absichtlich ohne Automatik"
metadata: 
  node_type: memory
  type: project
  originSessionId: b4292132-afe5-4c11-962a-772d4bfa449f
  modified: 2026-09-21T12:34:37.782Z
---

## Was NICHT funktioniert

Sechs naheliegende Bildkennzahlen gegen 17 Urteile am Werkstück geprüft — **keine trennt**,
alle Bereiche überlappen: mittlere Helligkeit, Anteil heller Punkte, tote Fläche,
zugelaufene Fläche, Streuung der Zonendichte, Perzentile.

Am deutlichsten widerlegt ist die Helligkeit: **306-2920423 lag bei 170 und war „tip top",
303-9154766 bei 168 und war unbrauchbar.** Eine Helligkeitsschwelle hätte gute Bilder
mit erfasst.

## Was funktioniert

Keine Eigenschaft des Bildes, sondern ein **Vergleich von Vorlage und Ergebnis**: Eine
ungravierte Fläche ist nicht per se schlecht — dunkle Haare sollen schwarz bleiben.
Schlecht ist eine Stelle, die im QUELLBILD Zeichnung hat und in der GRAVUR flach ist.

Zonenweise (40 px ≈ 2 mm bei 500 DPI): Zonen mit Grauwert-Streuung > 18 im rohen Graubild
gelten als „mit Zeichnung"; liegt ihre Dichte im fertigen Raster unter 5 % (tot) oder über
55 % (zugelaufen), ist die Zeichnung verloren.

| | verlorene Zeichnung |
|---|---|
| 13 gute Feuerzeuge | 4,4 – 33,7 % |
| 4 schlechte | 29,7 – 63,3 % |

Überlappung **4 Prozentpunkte**; Grenze **31 %** → 15 von 17 richtig (3 von 4 Ausfällen
erkannt, 1 Fehlalarm). Nicht erkannt: ein Nachtfoto mit Rauchfackel (29,7 %) — der Rauch
ist strukturLOS, hat also keine Zeichnung, die verloren gehen könnte. Eigener Fehlertyp.

## Umsetzung

`_zonenDetail` (nach `_toGray`, vor allen Tonwertstufen) und `_zeichnungVerloren`
(**nach** `_invertBits`) in `public/laser-pipeline.js`; Rückgabe von `applyLaserPipeline`
um `verloren` erweitert. `_VERLOREN_GRENZE = 0.31` in layout-editor.html, Anzeige in
`belegung.txt` (Spalte „Zeichng" + Warnliste), `vorschau.png` (rot in der Kopfzeile) und
als `console.warn` im Nachtlauf.

**Fallstrick, der einen Lauf gekostet hat:** erst VOR `_invertBits` gemessen — bei
invertiertem Material zählt das die andere Hälfte, alle Plätze lagen bei 90–99 % statt
4–33 %. Die Flächenmessung in `_restPipeline` macht es richtig: erst tauschen, dann zählen.

**Regression:** 9 Kombinationen bitgleich zur Vorfassung, ganzer Tageslauf ebenfalls —
die Messung ändert kein Pixel.

## Warum absichtlich KEINE Automatik

Die am Werkstück bestätigte Korrektur (`inkMax: 0.45`, `densityTarget: 0.26`) senkt die
Kennzahl bei **allen 17** Bildern auf nahe null, auch bei den guten (12,5 % → 0,2 %).
Das ist kein Freifahrtschein: Die Kennzahl belohnt gleichmäßig verteilte Gravur — genau
das hat der Nutzer auf Blech 6 als „silbrig" verworfen. Und die Korrektur hebt die Dichte
von 19 auf 26 %, während 19 % an drei Blechen erarbeitet wurde und 22 % dort schon
„verpunktelt" war.

Eine Automatik würde also die Kennzahl optimieren und das Blech-Ergebnis überschreiben.
Der Nutzer hat ausdrücklich verlangt, dass gute Bilder unberührt bleiben. Also messen
und melden; die zwei Ausfälle von Hand nacharbeiten kostete 10 Minuten und brachte
„sieht super aus".

## Vier Griffe für Einzelfälle, alle am Werkstück bestätigt (21.09.2026)

Sie gelten JE PLATZ, zusätzlich zur Grundeinstellung aus [[f02-schwarz-einstellung]] —
niemals als neue Grundeinstellung. Das Fehlerbild entscheidet, nicht die Kennzahl.

| Fehlerbild (Worte des Nutzers) | Griff |
|---|---|
| Motiv zu dunkel, helle Flächen nehmen das Budget | `inkMax 0.45` + `densityTarget 0.26` |
| „nur schwarz und weiß", große gleichmäßige Flächen | `inkMax 0.30` + `densityTarget 0.30` |
| „zu hell, man erkennt kein Gesicht" (Motiv läuft zu) | `inkMax 0.40` + `localContrast 0.80` + `densityTarget 0.22` |
| „die dunklen Bereiche sind zu flau" | `inkDropout 0.20` (bei 0.26 kippt es) |

**ACHTUNG bei den ersten drei:** Sie deckeln die Lichter. Das ist nur richtig, wenn die
Gravur am falschen ORT landet (Himmel statt Gesicht). Als allgemeine Regel angewandt macht
es die Bilder flau und tot — s. den Abschnitt „37-Prozent-Grenze" unten.

**Der dritte Typ ist die Grenze dieser Kennzahl.** Bei V7 Platz 2 (Nachtschnappschuss)
war die Gesamtfläche mit 25 % völlig unauffällig, die Gesichtszone aber bei **57 %** —
über 37 % verschmelzen die Punkte zur Fläche, das Gesicht wurde eine weiße Platte. Die
Warnung misst über das ganze Feld und sieht das nicht. Wer „zu hell, man erkennt kein
Gesicht" hört, muss die MOTIVZONE messen, nicht das Feld.

**Und eine Lehre über die Kennzahl selbst:** Bei demselben Platz fiel sie durch Rezept
45/26 von 42 % auf 0 %, während die Fläche von 18,8 auf 11,4 % sank — das Bild wurde
dunkler, obwohl „komplett schwarz" gemeldet war. Der Kennzahl blind zu folgen hat einen
Durchgang gekostet. Sie ist ein Hinweis, wo man hinsehen soll; die Richtung gibt das
Urteil am Werkstück.

Siehe [[testblech-5-dichtetreppe]], [[sprenkel-wegschneiden]], [[grafik-weiche]].


## Die 37-Prozent-Grenze gilt NICHT für Fotos

Aus [[f02-schwarz-einstellung]]: „500 DPI läuft ab 37 % zu" stammt aus einer TONWERTTREPPE
(zwei benachbarte Stufen darüber sind nicht mehr trennbar). Am 21.09.2026 habe ich daraus
eine Auswahlregel für Fotos gemacht — „die hellste 2-mm-Zone muss unter 37 % bleiben" —
und damit 15 Reklamationsbleche gerechnet. Urteil: **nicht zufrieden, verwaschen.**

**Gegenprobe an Feuerzeugen, die der Nutzer gut fand: hellste Zone 74 bis 100 %.**

Bei einem Foto sind die Flächen über 37 % die Lichter, und dass die sauber hell zulaufen,
ist der Kontrast, von dem die Gravur lebt. Mit `inkMax 0.30` wird der ganze Bildumfang auf
0…30 % Tinte gestaucht: keine kräftige Stelle mehr, alles Mittelton. Derselbe Fehler war
am 18.09. schon einmal gemacht worden.

**Was bei „verwaschen, nicht eindeutig" wirklich hilft:** mehr Spreizung, nicht weniger
Gravur. Neun Hebel gemessen — `edgeBoost` hoch ist der stärkste, `densityTarget` runter
macht es schlechter. Daraus wurde die heutige Grundeinstellung 65/23/12.

## Offen für später: Ausnahmen je Motivtyp

Der Nutzer am 21.09.: „wir müssen nur später paar Ausnahmen aufnehmen, wie wenn Meer oder
so." Beobachtet wurden bisher: Strand/Meer mit Gegenlicht, Ganzkörperaufnahmen mit kleinem
Motiv, Rauch und Nebel, Nachtaufnahmen. Bei diesen scheitert die Grundeinstellung
regelmäßig — die vier Griffe oben helfen teils, teils ist die Vorlage nicht zu retten
(25 Punkte je Gesicht im Feld enthalten keine Zeichnung). Eine Erkennung je Motivtyp
gibt es NICHT; die Kennzahl „verlorene Zeichnung" trennt nur grob (15 von 17).
