---
name: testblech-1-ergebnis
description: Testblech 17.09.2026 — weniger Gravurfläche schlägt alles; inkMin macht auf schwarzem Lack grau
metadata:
  type: project
---

Zwölf Bildaufbereitungen desselben Fotos auf einem F02_Schw_V5-Blech, eine
Maschineneinstellung. Urteil des Nutzers gegen die gravierte Fläche:

| Urteil | Platz | graviert | Einstellung |
|---|---|---|---|
| am besten | 9 | 24 % | nur Punktzuwachs-Ausgleich 25 % |
| gut, aber grau | 11 | 25 % | Ausgleich + lok. Kontrast 60 % + Tonwert 3–88 % |
| gut | 12 | 29 % | Atkinson + lok. Kontrast 120 % + Dichte 30 % |
| gut | 7 | 27 % | Kantenverstärkung (Sobel) 45 % |
| etwas besser | 10 | 36 % | nur lok. Kontrast 90 % |
| Referenz | 1 | 37 % | Stand der Produktion |

**Hauptbefund:** Die Rangfolge folgt der gravierten Fläche. Die Zieldichte 45 % ist
für lackiertes Zink zu hoch — die Rasterpunkte verschmelzen, bevor sie eine Form
ergeben. Der Punktzuwachs-Ausgleich (`dotGain`) ist der stärkste Einzelhebel.

**`inkMin` gehört auf schwarzem Lack auf 0.** Bei invertiertem Material ist
„nicht gravieren" das tiefe Schwarz; inkMin 3 % graviert dort 3,1 % der Fläche und
erzeugt genau den Grauschleier, den der Nutzer an Platz 11 gesehen hat. `inkMax`
(88 %) ist dagegen sinnvoll — hält helle Flächen vom Zulaufen ab.

**Nicht beantwortet, weil zu viele Regler gleichzeitig verstellt waren:** ob der
lokale Kontrast zusätzlich zum Ausgleich etwas bringt (Platz 11 war durch inkMin
verunreinigt), und ob Atkinson gegenüber Floyd gewinnt. Blech 2 muss je Platz nur
EINEN Faktor ändern. Siehe [[lokaler-kontrast]], [[auto-gamma]].
