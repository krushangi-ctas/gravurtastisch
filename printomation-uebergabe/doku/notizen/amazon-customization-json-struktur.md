---
name: amazon-customization-json-struktur
description: Amazon Gravur-JSON hat zwei Text-Strukturen; Parser-Fallstrick beim Zeilen-Extrahieren
metadata: 
  node_type: memory
  type: project
  originSessionId: ac3bb262-46ad-429e-ab4c-9d0fd7ee811b
---

Die Amazon-Personalisierungs-JSON (`customizationData`) liefert Gravurzeilen in **zwei** Strukturen:
1. Wrapper-Container heißt **"Text eingeben"** (matcht NICHT `/^Text (\d+)$/`) → Zeilen werden über den Fallback in Dokumentreihenfolge gesammelt.
2. Wrapper-Container heißt **"Text 1"** und enthält MEHRERE Zeilen darin → die einzelnen Zeilen heißen **"Texteingabe 1/2/3"** bzw. **"1/2/3 Zeile"**.

Die echte Zeilen-Nummer steht also an **"Texteingabe N" / "N Zeile"**, NICHT am "Text N"-Wrapper. `getAllTexts` in [public/layout-editor.html](public/layout-editor.html) darf bei einem "Text N"-Match daher nicht nur die erste Zeile nehmen (alter Bug: Zeile 2/3 gingen verloren → ~47 Bestellungen falsch graviert), sondern muss alle Zeilen im Container nach ihrer Zeilen-Nummer einsortieren.

DXF-Export (Ezcad2, dxfTextMode 'vector'), Regeln damit Export = Vorschau:
- Horizontal: über `getAdvanceWidth` an `textAlign` ausrichten (Standard zentriert).
- Vertikal OBEN-bündig: Cap-Oberkante "H" an Feldoberkante, `yBase = (p.h - f.y + yOffset) - capMM`; "g" hängt bis Feldunterkante.
- Größe: `autoFitFontSizePt` skaliert auf VOLLE Feldhöhe (Cap "H" + Unterlänge "g" = Feldhöhe, `_fontMetrics`), Höhe hat Vorrang, nur zu breite Zeilen schrumpfen über die Breite.
- `_drawText` (Vorschau) nutzt dieselbe oben-bündige Verankerung (`ly = y + capAsc`).
- `loadLayoutSilent` (Auto-Export-Pfad) MUSS `setEmptyMode(layout.emptyMode)` aufrufen — sonst nutzt der nächtliche Export immer 'strich' und setzt "—" statt leer.
- Optionaler Vollblatt-Rahmen (`layout.dxfFrame`, Layer "Rahmen", in Ezcad nicht gravieren) gegen Ezcads Auto-Zentrierung beim Import — sonst landen wenige Gravuren mittig statt oben.

Layouts: K01 = Schlüsselanhänger (2-Seiten Synchron, 15 Felder/Seite), S01 = 16 Positionen × 3 Zeilen, je Farb-/Form-Variante eine eigene ASIN. Siehe [[deployment-setup]].
