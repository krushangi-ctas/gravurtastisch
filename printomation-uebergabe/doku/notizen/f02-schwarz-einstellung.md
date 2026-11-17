---
name: f02-schwarz-einstellung
description: Gravureinstellung F02 Schwarz V5–V7 — Stand 21.09.2026 abends: Kanten 65 %, Dichte 23 %, Sprenkel-Schnitt 12 %
metadata:
  type: project
---

## AKTUELLER STAND (21.09.2026, 14:45 Uhr — in layouts.json und im Preset)

```
algorithm floyd-steinberg · dpi 500 · autoContrast an · autoGamma an (Ziel 45 %)
sharpen 0.8 · invert an · threshold 128 · Logo-Erkennung an
dotGain 0.20 · edgeBoost 0.65 · densityTarget 0.23 · inkDropout 0.12
inkMin 0 · inkMax 1 · localContrast 0
```

Maschine: **Speed 1200 · Power 20 · 50 kHz · Puls 100 ns** (fährt der Nutzer immer).

**Wie diese Werte zustande kamen — an 15 Reklamationsbildern, nicht am Standardbild.**
Der Weg an einem Tag:
1. Testbleche 5/6 mit dem Standardbild: Dichte **19 %** gewann (22 % war „verpunktelt"),
   Kanten 45 %, Kantenstärke erwies sich als unkritisch. S. [[testblech-5-dichtetreppe]].
2. Produktion damit: 11 von 13 Feuerzeugen gut.
3. 15 alte Reklamationen damit gerechnet: **„verwaschen, nicht eindeutig, etwas zu hell —
   aber alle."** Neun Kontrasthebel gemessen; Kanten **65 %** + Schnitt 20 % gab die größte
   Spreizung (54 statt 50 %). Urteil: **„viel viel besser als davor, nur 3–4 % zu dunkel"**
   und bei zweien „bisschen zu schwarz-weiß".
4. Zwei getrennte Korrekturen: Dichte auf **23 %** (bringt genau die fehlenden 4 Punkte
   Gravurfläche) und Schnitt zurück auf **12 %** (Mitteltöne bei einem Platz von 24 auf
   34 % der Zonen). Urteil: **„sieht viel besser aus!!"**

**Der Widerspruch zu Schritt 1 ist echt und ungeklärt:** Am Standardbild war 19 % Sieger
und 22 % schon zu hell — jetzt laufen 23 % mit Kanten 65 % und gefallen besser. Die
Kombination ist anders (Kanten 45→65, Schnitt 8→12), das kann es erklären. **Geprüft ist
es nur an den Reklamationen, nicht am Standardbild.** Ein Blech mit dem Standardbild bei
65/23/12 fehlt.

## Vorgeschichte: woher die alten Werte kamen

**Der Stand bis 21.09.2026 war Ausgleich 20 %, Kanten 45 %, Dichte 22 %.** Die Kopfzeile von
`exports/_Testblech4-2026-09-17/F02_Schw_V5/UEBERSICHT.png` nennt sie wörtlich:
„alle zwölf mit derselben Einstellung: Floyd, 500 DPI, Ausgleich 20 %, Kanten 45 % ·
Gravurfläche je Bild auf 22 % nachgeregelt". Dieses Blech wurde gebrannt und
freigegeben. **Die UEBERSICHT.png der Testbleche ist damit die einzige erhaltene
Quelle der Einstellungen — vor jeder Änderung dort nachsehen.**

## Der Haken, der zwei schlechte Läufe gekostet hat

Die Testbleche wurden von einem Wegwerf-Skript gebaut, NICHT von der Produktions-Pipeline.
Als dieselben Zahlen danach in `laser-pipeline.js` implementiert wurden (17.09. nachmittags),
war die Kantenverstärkung anders gebaut: fester Abzug `v − Stärke·255·k` statt anteilig.
Die Zahl 45 % stimmte, die Wirkung nicht — 12–35 % aller Bildpunkte klemmten auf reinem
Schwarz/Weiß. Seit 18.09. anteilig (`v · (1 − Stärke·k)`), s. [[laser-regression-18-09]].
An der einzigen noch vorhandenen Testblech-4-Vorlage (302-7835818, Platz 4) nachgemessen:
28,6 % geklemmt alt gegen 18,4 % neu, bei identischer Gravurfläche.

## inkMax 0.37 war FALSCH — nicht wieder einbauen

Aus „500 DPI läuft ab 37 % zu" (Tonwerttreppe Testblech 2) wurde am 18.09. der Schluss
gezogen, den Bildumfang per `inkMax` auf 0…37 % zu kappen. **Am Werkstück blass und tot.**
Grund: Die 37 % gelten für die TREPPE — zwei benachbarte Stufen darüber sind nicht mehr
trennbar. In einem FOTO sind die Flächen darüber die Lichter, und dass die sauber hell
zulaufen, ist genau der Kontrast, von dem die Gravur lebt. Die freigegebene Testblech-4-
Kachel hat selbst 25 % ihrer Fläche über 37 %. `inkMax` bleibt auf 1.

`inkMin` MUSS 0 bleiben, siehe [[testblech-1-ergebnis]].

**27.09.2026:** Nutzer: Läufe 26./27.09. „gezeichnet, Augen schwarz, Gesichter zu dunkel“. Ursache Kanten 65 % (edgeBoost zieht helle Details schwarz nach) + Budget bei hellem Hintergrund. Kandidat `konturen 1.5` statt Kanten + `regionImmer`, Testblech offen — s. [[gesichter-konturen-2026-09-27]].

**STAND 11.10.2026: Kanten 45 % statt Konturen, Dichte 21,3 % — s. [[einstellungs-pruefung-2026-10-11]].** **STAND 29.09.2026:** Konturen 150 % (edgeBoost ruht) · Ausgleich 35 % immer/50 % bei Warnung · Schnitt 6 % + Dunkelgrau ab 14 % · Dichte **22 %** (Nutzer: Gesichter 3–5 % zu hell, 22 statt vorgeschlagener 20) · Grafiken mit Verläufen erkennen AN. Details [[gesichter-konturen-2026-09-27]].
