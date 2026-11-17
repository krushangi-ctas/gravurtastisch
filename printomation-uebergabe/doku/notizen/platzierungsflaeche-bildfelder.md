---
name: platzierungsflaeche-bildfelder
description: "Bildfelder werden gegen Amazons Platzierungsfläche (PlacementContainerCustomization) dimensioniert, NICHT gegen das Kundenfoto"
metadata:
  node_type: memory
  type: project
  originSessionId: b009d207-ad97-434d-afbc-85a3f302544e
  modified: 2026-08-14T08:26:55.130Z
---

**Ob ein Kundenbild unverzerrt sitzt, entscheidet allein:**
`Feld-Breite ÷ Feld-Höhe == Flächen-Breite ÷ Flächen-Höhe`.

Die **Platzierungsfläche** steht in der Bestell-JSON in einem
`PlacementContainerCustomization` (Felder `dimension` + `position`) — **irgendwo im Baum,
NICHT am `ImageCustomization`-Knoten**. Dort steht nur `image.imageName`; wer nur da
nachsieht, hält die Fläche fälschlich für nicht vorhanden (mir am 13.08.2026 passiert).
Der Editor sucht sie rekursiv (`findPlacement` in layout-editor.html) und rendert über
`composePlacement` → `_placementArea`.

**Das Rohformat des Kundenfotos ist egal.** Der Kunde zoomt/schiebt/dreht sein Bild
INNERHALB der Fläche (`buyerPlacement`, `scaleX == scaleY`, also proportional). Verzerrt
wird nur beim Abbilden der Fläche auf die Feldbox — dort skaliert `composePlacement` X und
Y unabhängig.

**Die Fläche ist eine Listing-Eigenschaft, pro ASIN konstant** (nachgezählt über alle
vorliegenden Bestellungen): Viereck `129×229` = 0,5633 · Herz `273×257` = 1,0623 ·
Rund `256×251` = 1,0199.

Stand der Felder im Übersichtsblatt „Schlüsselanhänger neu": Viereck 22,5×40 = 0,5625
→ **−0,1 %, perfekt** (seit 13.08., vorher 22,5×39 = 2,5 % daneben). Herz und Rund stehen
auf 37×37 → −5,9 % bzw. −2,0 %.

**Nutzer-Entscheidung 13.08.2026: Felder NICHT anpassen.** „Es muss von der Eingabe schon
quadratisch sein" — die Herz-/Rund-Anpassungsvorlage im Amazon-Listing soll quadratisch
werden, statt das Layout an eine schiefe Vorgabe anzupassen. Nicht erneut vorschlagen,
37×34,8 bzw. 37×36,3 zu setzen.

**Prüfwerkzeug:** `node public/tests/bildformat-check.js` (aus `src/`) vergleicht jedes
Bildfeld jedes Layouts mit der Fläche und nennt die Abweichung in Prozent.
Bildfelder gibt es aktuell NUR im Übersichtsblatt → die Verzerrung ist rein kosmetisch,
graviert wird kein Foto (siehe [[foto-gravur-workflow-ezcad]]).
Ohne Placement-Daten fällt der Editor auf „Bild auf Feldgröße ziehen" zurück (reines
Strecken, kein Zuschnitt) — siehe [[download-ohne-zip]] für die Vorschaubilder, die
Amazon zusätzlich mitliefert.
