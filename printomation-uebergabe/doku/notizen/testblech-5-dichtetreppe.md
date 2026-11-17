---
name: testblech-5-dichtetreppe
description: "Testblech 5 (21.09.2026) — Dichte-Treppe 22…52 % gegen die zwei bekannten Stände; Messung belegt, dass seit 18.09. nur die halbe Fläche graviert wird"
metadata: 
  node_type: memory
  type: project
  originSessionId: b4292132-afe5-4c11-962a-772d4bfa449f
  modified: 2026-09-21T09:10:04.942Z
---

**Die Messung, die den Fall erklärt** (Schwarzanteil der echten platzN.bmp aller F02-Schwarz-Läufe):

| Lauf | gravierte Fläche |
|---|---|
| 17.09. (Donnerstag, gut) | 42,9 – 49,5 % |
| 18.09. | 20,0 – 26,2 % |
| 19.09. | 18,5 – 23,0 % |
| 20.09. | 21,5 – 22,7 % |

Seit dem Einbau der Dichte-Regelung auf 22 % liefert die Anlage die **halbe Tintenmenge**
des guten Laufs, und zwar bei jedem Foto gleich — deshalb kam die Beschwerde „zu hell".
Die Regelung trifft ihr Ziel exakt; das Ziel war zu niedrig gewählt.

**Aufbau des Blechs** (`exports/_Testblech5-2026-09-21/F02_Schw_V5`, ein Foto, zwölf Plätze,
eine Maschineneinstellung). Basis = Preset „Feuerzeug schwarz" mit `edgeBoost 0`,
`densityTarget 0`:

| Platz | Variante | gemessen |
|---|---|---|
| 1–6 | reine Dichte-Treppe 22 / 28 / 34 / 40 / 46 / 52 % | 22,0 / 28,0 / 33,9 / 39,9 / 45,9 / 51,8 % |
| 7 | **Donnerstag-Stand**, Regelung AUS (nur Auto-Gamma 45 %) | 33,3 % |
| 8 | **Heute-Stand**, Dichte 22 % + Kanten 45 % | 22,3 % |
| 9–12 | wie Platz 3 (34 %) + je EIN Regler: Kanten 45 % / lok. Kontrast 60 % / Ausgleich 0 % / Ausgleich 35 % | je ~34 % |

Reihe 3 hält die Tintenmenge fest — dort wird ausschließlich die **Verteilung** verglichen.
Das ist die Lehre aus [[testblech-1-ergebnis]]: je Platz nur einen Faktor ändern.

**Nebenbefund, wichtig für die Auswertung:** Platz 7 (Auto-Gamma-Ziel 45 %) landet bei
diesem Foto auf **33,3 %**, nicht auf 45 %. Das Auto-Gamma-Ziel ist keine Aussage über die
gravierte Fläche — es misst vor Schärfen, Ausgleich und Rasterung (s.
[[kanten-und-dichteregelung]]). Der gute Donnerstags-Lauf lag bei 43–49 %, weil die
anderen Fotos zufällig dort landeten. „Zurück auf Donnerstag" heißt also **nicht**
automatisch „zurück auf 45 %".

**Betrieb:** Am 21.09.2026 in den Arbeitsordner `_Vorlage/F02_Schw_V5` geladen (über
`POST /vorlage/laden`, damit `vorlage-stand.json` mitgeht — `tag` bleibt dabei leer, weil
der Ordnername nicht mit einem Datum beginnt). **Auf Nutzerwunsch OHNE Deckelgravur:**
`gravur.dxf` und `rueckseite.dxf` sind leere 387-Byte-DXF, sonst stünden die Kundennamen
des 20.09.-Laufs auf den Testfeuerzeugen. Ob Ezcad bei einer DXF ohne Geometrie die in der
`.ezd` eingebettete Kopie graviert, ist weiter ungeprüft (s. [[f02-deckeltext-je-platz]]).

## ERGEBNIS AM WERKSTÜCK — die Richtung ist umgekehrt

**Auf schwarz lackiertem Material ist graviert = HELL.** Mehr Gravurfläche heißt hellere,
flauere Gravur. Der Schluss „seit 18.09. nur halbe Fläche, deshalb zu hell" war falsch
herum — die halbe Fläche ist das Gewollte. Die 22 % waren richtig gewählt.

**Blech 5** (Maschine 1200 / Power 20 / 50 kHz / 100 ns — der Nutzer fährt immer 20 %):
Sieger war Platz 8 = **22 % + Kanten 45 %**, also der damalige Produktionsstand. Ab etwa
30 % Fläche verliert das Gesicht seine Zeichnung; 34 % „kaum zu erkennen", 40 % „nicht zu
erkennen", 52 % „zu hell". Der Donnerstags-Stand (33 %) war „im Gesicht zu hell". Die
43–49 % des 17.09. sind damit als Ziel erledigt.

**Blech 6** (Fläche runter, Kantenstärke): Sieger **19 %**. Bei 16 % verschwindet der
Hintergrund, bei 13 % ist er weg. Drei weitere Befunde:
- **Die Kantenstärke ist unkritisch** — 30/45/60/75 % sind am Werkstück nicht
  unterscheidbar (nur die Augenbrauen ziehen ab 60 % leicht an). Der Gewinn liegt zwischen
  „aus" und „an". 45 % bleibt.
- **Alle vier Feinjustagen machen es schlechter:** Ausgleich 35 %, Atkinson, lokaler
  Kontrast 60 %, Schärfen aus — jedes ergibt „Haut silbrig glänzend", also eine zu
  gleichmäßig abgefahrene Hautfläche ohne Zeichnung. Ausgleich 20 %, Floyd und
  Schärfen 80 % bleiben.
- 22 % ist bereits „verpunktelt" (einzelne weiße Punkte).

**Stand der Einstellung:** Dichte **19 %** · Kanten **45 %** · Ausgleich 20 % · Floyd ·
500 DPI · Schärfen 80 % · lokaler Kontrast 0 · Auto-Gamma 45 % · invert · Auto-Kontrast.
**Noch NICHT in layouts.json übernommen** — erst muss Blech 7 zeigen, ob eine Einstellung
für verschiedene Fotos reicht.

## Warum eine feste Einstellung vermutlich nicht reicht

Sieger-Einstellung über **alle 19 vorhandenen F02-Kundenfotos** gerechnet:

| gemessen wo | Spanne |
|---|---|
| gesamtes Feld | 21,5 – 22,7 % |
| obere Bildhälfte (Gesicht) | **6,0 – 34,4 %** |
| Bildmitte | **7,0 – 41,7 %** |

Die Dichte-Regelung trifft ihr Ziel auf 1,2 pp genau, aber **wo** die Tinte landet, streut
um den **Faktor 6**. Sie regelt die falsche Größe: gemessen wird über das ganze Feld,
entschieden wird im Gesicht. Bei hellem Hintergrund frisst der Hintergrund das Budget.
Das ist der eigentliche Grund für „mal gut, mal schlecht" — nicht die Zahl 22 oder 19.

**Blech 7 (Bildtest)** prüft genau das: zwölf verschiedene Fotos, eine Einstellung,
sortiert nach Gesichtsanteil (9,3 % bis 41,8 % bei überall 19 % gesamt). Urteile stehen
in `src/testfoto/URTEILE.md`. Ergebnis noch offen.

Vorsicht bei der Kennzahl „obere Bildhälfte": Sie taugt nur für Porträts. Autos,
Silhouetten und Logos hat der Nutzer auch schon hochgeladen — dort bedeutet sie nichts.

Siehe [[standardbild-testbleche]], [[laser-regression-18-09]], [[kanten-und-dichteregelung]].
