---
name: sprenkel-wegschneiden
description: "Regler `inkDropout` („Sprenkel wegschneiden\", 21.09.2026) gegen isolierte Gravurpunkte in dunklen Flächen — Gegenstück zu inkMin, schneidet weg statt anzuheben"
metadata: 
  node_type: memory
  type: project
  originSessionId: b4292132-afe5-4c11-962a-772d4bfa449f
  modified: 2026-09-21T10:38:54.630Z
---

**Anlass:** Der Nutzer meldete an allen Feuerzeugen von Testblech 7 „bisschen verpixelt,
weiße Punkte im schwarzen Bereich". Gemessen an den echten BMP: isolierte Einzelpunkte
machen **9 bis 34 % der GESAMTEN Gravur** aus, und in den fast schwarzen Zonen (< 8 %
Tinte je 16×16-Block) sitzen je Feuerzeug **2.000 bis 7.700** davon.

Ursache ist die Bauart der Fehlerdiffusion: der Restfehler sammelt sich, bis er die
Schwelle reißt, und setzt dann einen Punkt — auch mitten in einer Fläche, die unberührt
bleiben soll. Bei 500 DPI ist der Punkt 50 µm und auf schwarzem Lack deutlich sichtbarer
als das Tonwertdetail, das er darstellen soll.

**Gebaut** in `public/laser-pipeline.js`: `inkDropout` (0…0.2, Default 0). `_dropoutLUT` +
`_applyInkDropout` setzen Tinte UNTER der Schwelle auf 0 statt sie zu rastern; der Rest
der Kurve bleibt unangetastet. Läuft als letzte Tonwertstufe direkt vor `_rastern` — und
**auch in `_restPipeline`**, sonst regelte die Dichte-Regelung auf eine Fläche, die so nie
herauskäme. Regler im Laser-Tab unter „Kalibrierung" heißt „Sprenkel wegschneiden".

**NICHT verwechseln mit `inkMin`:** das HEBT die Lichter an (auf schwarzem Lack ein
Grauschleier, s. [[testblech-1-ergebnis]]), das hier schneidet weg. Beide gleichzeitig
heben sich auf, und inkMin läuft danach — deshalb zwingt `updateDitherSettings` bei
inkMin > 0 den Dropout auf 0 und `_zeigeRegler` blendet ihn aus.

**Gemessen am Standardfoto** (Dichte 19 %, Kanten 45 %) — die Gesamtfläche bleibt konstant,
weil die Dichte-Regelung die Tinte dorthin schiebt, wo sie Zeichnung macht:

| Schwelle | Sprenkel in dunklen Zonen | Gravurfläche |
|---|---|---|
| aus | 4114 | 19,1 % |
| 4 % | 2829 (−31 %) | 19,2 % |
| 8 % | 1897 (−54 %) | 19,1 % |
| 12 % | 1385 (−66 %) | 19,1 % |

Am synthetischen Bild mit echten Schwarzflächen gehen sie schon bei 2 % auf **null** — beim
Kundenfoto bleibt ein Rest, weil der Auto-Kontrast kein reines Schwarz übrig lässt.
8 % sah am Bildschirm am besten aus. **Am 21.09.2026, 13:12 Uhr auf 0,08 gesetzt** — in
allen vier `F02_Schw*`-Layouts (V5, V6, V7, V5_Text) und im Preset „Feuerzeug schwarz",
zusammen mit Dichte 0,19. Am Werkstück danach graviert und vom Nutzer als gut beurteilt.
Der Code-Default in `LASER_DEFAULTS` bleibt 0, damit andere Layouts bitgleich bleiben.

**Regression:** 20 Kombinationen (4 Testbilder × 5 Einstellungssätze, auch bayer/atkinson,
mit und ohne invert) sind mit `inkDropout` weggelassen bitgleich zur Vorfassung. Der ganze
Tageslauf danach: alle `platz*.bmp` unverändert. Alte Fassung liegt im Scratchpad als
`laser-pipeline.ALT.js`.

Siehe [[testblech-5-dichtetreppe]], [[kanten-und-dichteregelung]], [[vorschau-mit-farbbild]].
