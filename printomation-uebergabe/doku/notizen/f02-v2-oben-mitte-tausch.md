---
name: f02-v2-oben-mitte-tausch
description: "F02_Silb_V2 (B0HGN51WTG): Amazon nummeriert Deckel=2 / Mitte=1 — palNum im Layout getauscht; Schw_V2 ist korrekt und darf NICHT getauscht werden"
metadata:
  node_type: memory
  type: project
---

Die beiden V2-Listings sind in Amazon **unterschiedlich verdrahtet**, obwohl sie dasselbe
Produkt in zwei Farben sind:

| Layout | ASIN | Deckel/oben | Mitte/Körper |
|---|---|---|---|
| `F02_Schw_V2`, `F02_Schw_V2_Einzeln` | B0DBZSBX6M | „Texteingabe 1" → **1** | „Texteingabe 2" → **2** |
| `F02_Silb_V2`, `F02_Silb_V2_Einzeln` | B0HGN51WTG | „**Texteingabe 2**" → **2** | „**Text input 1**" → **1** |

Beim Silber-Listing sind Etiketten- UND Sprachwahl im selben Container gemischt und die
Nummern gegenläufig zur Anordnung. Der Parser sortiert korrekt nach Nummer — dadurch
landete die Deckel-Gravur auf dem Körper und umgekehrt. Belegt an `306-9094023-2394758`
(„Es werde Licht" sollte auf den Deckel, „Aaron" auf den Körper) und `305-6958400-7273110`
(„German" gehört mit dem Motiv in die Mitte).

**Behoben am 12.09.2026 im LAYOUT, nicht im Parser:** in `F02_Silb_V2` und
`F02_Silb_V2_Einzeln` auf Seite 1 `palNum` 1↔2 getauscht (obere Felder y 16,8/78,5/140,2
jetzt palNum 2, mittlere y 45,8/107,5/169,2 jetzt palNum 1). Seite 2 (Rückseite, palNum 3
und Kombi 4/5) bleibt unberührt. **Die Schwarz-Variante NICHT anfassen** — die ist richtig.
Ändert Amazon das Silber-Template irgendwann auf dieselbe Nummerierung wie Schwarz, muss
der Tausch zurück.

Nachweis geht zeichengenau über die DXF-Layer: `Gravur_N` je Textfeld herausfiltern und die
Konturen gegen die Font-Glyphen matchen (Rezept in [[export-forensik]]). Vorher
Gravur_1 = „Aaron", nachher Gravur_1 = „Es werde Licht".

**Achtung `Gravur_N`:** die Nummer läuft über die **gefüllten** Textfelder (Sortierung y,
dann x) — der Kommentar in `_buildDXFEntities` behauptet, leere Zeilen zählten mit, aber
`exportDXFBatch` filtert sie vorher weg (`pg.filter(_hasVecText…)`). Bei einer Bestellung
ohne Deckel-Gravur heißt der Mitte-Text also `Gravur_1`, nicht `Gravur_2`.

Siehe [[amazon-textcontainer-nummerierung]] (dort die Rest-Lücke beim Zeilen-Versatz),
[[f02-feuerzeug-layouts]], [[alten-lauf-nachexportieren]].
