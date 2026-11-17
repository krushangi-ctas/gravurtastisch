---
name: laser-regression-18-09
description: Warum der Lauf vom 18.09.2026 unbrauchbar war — harte Kantenverstärkung klemmt Tonwerte, Dichteziel 22 % ist halb so hoch wie der gute Stand
metadata:
  type: project
---

Erster voller Lauf mit den drei Reglern vom 17.09. nachmittags. Ergebnis am Werkstück:
„verpixelt, nur Linien", „zu weiß und unnatürlich", „Punkte zu sehen", „zu hell und blass".

**Gemessen an den echten BMP:**
| Lauf | gravierte Fläche |
|---|---|
| 17.09. 10:11 (gut) | 42,9 – 49,5 % |
| 17.09. 12:30–12:38 Reklamation | 22,5 – 23,2 % |
| 18.09. 10:10 (schlecht) | 20,0 – 26,2 % |

Die Tintenmenge allein erklärt es nicht — 12:38 lag auch bei 22 % und war gut. Entscheidend
ist die VERTEILUNG. (Und 22 % ist kein Geschmackswert: 500 DPI trägt material-bedingt nur
37 %, s. [[f02-schwarz-einstellung]]. Ein Rückfall auf die 43–49 % des 10:11-Laufs wurde am
18.09. probiert und kam als „zu weiß, gar kein dunkler Bereich" zurück.) Kennzahl dafür: Anteil der Bildpunkte, die vor der Rasterung auf 0 oder
255 geklemmt sind (= Zeichnung unwiederbringlich weg):

| Bestellung | ohne Kanten | Kanten 45 % fest (alt) | Kanten 45 % gedämpft (neu) |
|---|---|---|---|
| 028-5533851 | 1,9 % | **34,7 %** | 1,2 % |
| 302-0056498 | 1,6 % | 18,7 % | 1,6 % |
| 303-3036521 | 1,7 % | 12,5 % | 1,0 % |

Der alte `edgeBoost` rechnete `v − Stärke·255·k`, also bis zu −115 Tonwerte auf einmal.
Zusammen mit der Dichte-Regelung, die das fehlende Schwarz global wieder aufhellt, bleiben
nur die Konturen übrig. Seit 18.09. anteilig: `v · (1 − Stärke·k)`, kann nicht klemmen.

**Prüfaufbau** (im Scratchpad, Rezept in [[export-trockenlauf]]): Puppeteer-Seite, die nur
`laser-pipeline.js` + `composePlacement` lädt und EINEN Platz rendert. Zwei Fallstricke:
- **Feld-Drehung nachbilden.** F02_Schw_V6/V7 haben 54×33-Felder mit `rotation: -90`.
  Ohne die Drehung stimmt der Ausschnitt nicht (erst am Gegenvergleich mit platz3.bmp aufgefallen).
- **Gedrehte Platzierungen rendern nicht deterministisch.** Zweimal derselbe Lauf ergab bei
  `angleOfRotation 0,71°` unterschiedliche BMP-Bytes. Byte-für-Byte-Vergleiche (so wie es im
  Dateikopf steht) gelten nur für ungedrehte Felder; sonst über Kennzahlen vergleichen.

Siehe [[f02-schwarz-einstellung]], [[kanten-und-dichteregelung]], [[code-audit-2026-09]].
