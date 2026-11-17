---
name: grafik-weiche
description: "Seit 21.09.2026 erkennt die Pipeline Logos/Schrift/Zeichnungen selbst (`grafikAuto`, Default an) und überspringt für sie die ganze Fotoaufbereitung"
metadata: 
  node_type: memory
  type: project
  originSessionId: b4292132-afe5-4c11-962a-772d4bfa449f
  modified: 2026-09-21T11:06:01.764Z
---

**Anlass:** Kunden laden nicht nur Fotos hoch. Am 21.09.2026 lagen an einem Tag vier
Grafiken in der Produktion (Böhse-Onkelz-Logo, UNITYTRAS-Firmenlogo dreifach, zwei
kleine Logo-PNG). Der Nutzer fragte: „bei logos oder zeichnung erkennt das system sofort
von selbst?" — bis dahin: nein, sie liefen durch dieselbe Fotopipeline.

## Die Kennzahl (an 32 echten Uploads gemessen)

Am **rohen** Graubild der Fotofläche, vor jeder Tonwertstufe: **Zahl der Graustufen, die
mindestens 0,1 % der Bildpunkte tragen.**

| | Stufen |
|---|---|
| vier Grafiken | 6 · 6 · 7 · 36 |
| 28 Fotos | 127 … 252 |

Dazwischen liegt nichts. Zweites Merkmal als Sicherung: Anteil der zwei häufigsten Stufen
≥ 50 % (Grafiken 66–96 %, Fotos höchstens 44 %). Beide Bedingungen müssen zutreffen.

**NACHGESCHÄRFT am 21.09.2026, 15:15 Uhr, nachdem ein Feuerzeug verdorben war:** Die erste
Fassung (Grenze 64, zwei Merkmale) ließ **028-0488233** durch — ein sehr dunkles, flaues
Foto zweier schlafender Personen, 62 Stufen. Es wurde nur an der Schwelle getrennt und kam
mit **0,2 % Gravur** heraus, also praktisch schwarz. Bei einem so dunklen Bild erreichen
nur wenige Graustufen die 0,1-%-Marke — es sieht statistisch aus wie ein Logo. Seitdem:
`_GRAFIK_MAX_STUFEN = 40` (gemessene Grafiken bis 36, also nur noch 4 Stufen Luft) und
ein drittes Merkmal `_GRAFIK_RAND = 8`: **beide häufigsten Stufen müssen in den äußersten
8 Graustufen liegen** — echte Grafiken sind Schwarz-auf-Weiß, ein flaues Foto nicht.

**Der Anteil sehr heller/dunkler Punkte taugt NICHT** — die Bereiche überlappen: ein
Nachtclub-Foto kam auf 61 %, ein Logo auf 80 %. Erst über die Stufenzahl trennt es sauber.

## Was bei erkannter Grafik passiert

`_grafikEinstellung` schaltet ab, was auf Halbtöne zielt: `algorithm: 'threshold'` statt
Fehlerdiffusion, dazu autoContrast, autoGamma, sharpen, dotGain, inkMin/Max, inkDropout,
edgeBoost, localContrast und densityTarget alle aus. Ergebnis: geschlossene Flächen mit
scharfen Kanten statt Rasterpunkten.

Warum jedes Einzelne schadet:
- **Dichte-Regelung:** sucht per Bisektion ein Gamma für eine Zielfläche, die ein Logo nicht
  erreichen kann — beim UNITYTRAS-Logo (2,9 % Deckung) lief sie zwölf Schritte in die
  Obergrenze 4,0 und bewirkte nichts.
- **Kantenverstärkung:** dunkelt Konturen ab, die werden dann NICHT graviert — bei einem
  Schriftzug frisst das die Buchstabenränder.
- **Schärfen** setzt Säume an harte Kanten, **Dithering** rastert eine schon zweifarbige
  Fläche durch.

Die Weiche sitzt in `applyLaserPipeline` direkt nach `_toGray` und **vor** allem anderen:
die Erkennung muss das rohe Bild sehen, sonst zieht der Auto-Kontrast ein Logo mit
Grauschleier auf den vollen Umfang und es sieht wie ein Foto aus. Rückgabe hat jetzt
`grafik: true/false`.

**Nur wenn ALLE Messflächen Grafik sind** wird umgeschaltet (`_alleGrafik`) — Rasterung und
Tonwertstufen laufen über das ganze Bild und würden ein Foto auf der Nachbarfläche
ruinieren. Im Vorlagen-Export ist ohnehin je Platz ein eigener Aufruf (`{only: feld}`),
dort greift es also auch auf einem Blech, das Logos und Fotos mischt — am Tageslauf
belegt: von 24 Plätzen änderten sich **genau die vier Logo-Plätze**, alle Fotos blieben
bitgleich.

Schalter „Logos erkennen" im Laser-Tab über Auto-Gamma. Default **an** (in LASER_DEFAULTS).

## Fallstrick beim Prüfen: gedrehte Platzierungen jittern

Fünf Fotos schienen erst nicht bitgleich. Gegentest mit **zweimal identischer**
Einstellung: dieselben fünf weichen um **13 bis 19 % der Bildpunkte** ab, alle ungedrehten
sind bitgleich. Es sind genau die mit `angleOfRotation ≠ 0`. Die gravierte Fläche bleibt
dabei gleich (19,6 gegen 19,6 %), nur die Punktverteilung wandert. Bekannt aus
[[laser-regression-18-09]], hier erneut belegt — **Byte-Vergleiche gelten nur für
ungedrehte Felder.**

Siehe [[sprenkel-wegschneiden]], [[kanten-und-dichteregelung]], [[testblech-5-dichtetreppe]].

**Zweiter Erkennungsweg seit 25.09.2026:** hochskalierte kleine Logos rissen die 40-Stufen-Grenze (Waage 55, Rolling Thunder 45). Jetzt zusätzlich Grafik, wenn die zwei Spitzen am Rand liegen UND unter 5 % der Fläche ruhige Zwischentöne sind — Details in [[schwarz-weiss-bilder]].
