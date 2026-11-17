---
name: dxf-block-zentrierung-bug
description: "dxfCenterOrigin + dxfTextAsBlock zusammen verschoben die Gravur um eine halbe Blattgröße nach unten links; behoben 21.08.2026"
metadata:
  type: project
---

**Bug, gefunden und behoben am 21.08.2026.** Wurden im selben Layout **„Nullpunkt mittig"
(`dxfCenterOrigin`) UND „Text als Block" (`dxfTextAsBlock`)** aktiviert, landete die Gravur
in Ezcad um eine halbe Blattbreite/-höhe versetzt — bei 200 mm Blatt also 100 mm nach unten
links. Aufgefallen an K01; S01 war nie betroffen, weil dort keine Blocks verwendet werden.

**Ursache:** Der asBlock-Zweig in `_buildDXFEntities` legt die Glyphen mit **absoluten**
Koordinaten in den BLOCK und setzt Basispunkt wie INSERT-Einfügepunkt auf `0,0`.
`_dxfOriginToCenter` verschob aber stumpf jede Koordinate im Dateitext — also auch diese
beiden Nullpunkte. Die Geometrie wanderte damit einmal über ihre eigenen Koordinaten und
ein zweites Mal über den INSERT.

**Fix (zwei Teile, beide nötig):**
1. BLOCK-Basispunkt und INSERT-Einfügepunkt von der Verschiebung ausnehmen.
2. Die Funktion muss in **Zweierschritten** über die Zeilen laufen. DXF ist streng
   Code/Wert-paarig; zeilenweise verwechselt man den *Wert* `0` (z. B. von Code `70`)
   mit dem Entity-Start-*Code* `0`. Nach nur Teil 1 blieb der Basispunkt deshalb weiter
   falsch — der Zwischenstand sah korrigiert aus, war es aber nicht.

**Prüfrezept:** Im erzeugten DXF müssen **alle** BLOCK-Basispunkte und INSERT-Punkte auf
`(0.0, 0.0)` stehen. Stehen sie auf `(-Blattbreite/2, -Blatthöhe/2)`, greift der Bug wieder.
Gegenprobe: ein Layout ohne Blocks (S01) muss danach **byte-identisch** exportieren.

**Zustand der Einstellungen (21.08.2026):** `dxfTextAsBlock` haben nur sehr wenige Layouts
an; `dxfCenterOrigin` ist bei allen vier S01 an und bei allen 72 K01 **aus** — deshalb
kommen die echten K01-Exporte weiterhin mit Nullpunkt unten links heraus, unabhängig von
diesem Bug. Siehe [[k01-raster-mengenstufen]].
