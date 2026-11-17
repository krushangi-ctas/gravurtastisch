---
name: bmp-je-platz
description: "Layout-Schalter bmpProSlot: ein BMP je Bildfeld statt eines über das ganze Blech — sonst graviert die Maschine bei Invertierung die leeren Plätze mit"
metadata:
  node_type: memory
  type: project
  originSessionId: 142e79e1-b071-4eab-83c0-b3dc4ab4f934
  modified: 2026-09-24T19:04:58.247Z
---

Ein blechgroßes 1-bit-BMP ist bei invertierter Ausgabe zu ~86 % schwarz, wenn nur ein
Teil der Plätze belegt ist (gemessen 10.09.2026 an `F02_Schw_V5`: 6 von 12 Plätzen,
3043×3059 px, Palette-Index 0 = schwarz = graviert). Die Maschine hätte damit alle
freien Flächen mitgraviert. Außerdem ist so ein BMP in Ezcad **ein** Objekt — einzelne
Fotos lassen sich nicht anwählen.

**Why:** `_buildLaserCanvas` spannt die Bounding-Box über ALLE Bildfelder der Seite;
bei einem 4×3-Raster ist das das ganze Blech, und der Grund zwischen den Fotos gehört
mit ins Bild.

**How to apply:** Layout-Schalter **„Jedes Bild als eigene Datei"** (`bmpProSlot`,
Layout-Einstellungen → Export-Format → BMP-Optionen). Dann läuft
`_buildBmpBlobsProSlot` je belegtem Bildfeld über `_buildLaserCanvas(s, {only: f})` und
liefert `<Layout>_<Satz>_Seite1_PlatzN.bmp` in exakter Feldgröße (V5 32×32 mm, V6
33×54 mm @ 500 dpi). Die Platznummer zählt über ALLE Bildfelder (oben→unten,
links→rechts), nicht nur die belegten — sonst wandert sie, sobald ein Platz leer bleibt.
V7 hat nur EIN Bildfeld und braucht es nicht.
Siehe [[f02-12er-raster]] und [[f02-feuerzeug-layouts]].

**KORREKTUR 13.09.2026 — es war NICHT aktiv.** `bmpProSlot` wurde durch den Vier-Wege-
Schalter `bmpModus` ersetzt (`blech` / `platz` / `vorlage` / `beides`), und beim Speichern
löscht `saveLayoutSettings` das alte Feld (`delete l.bmpProSlot`). Danach standen **alle 12
BMP-Layouts auf `bmpModus: 'blech'`** — also wieder ein blechgroßes Bitmap. Genau deshalb
kam das Problem an der Maschine zurück. Beim Prüfen also nie dem Gedächtnis glauben,
sondern `bmpModus` in layouts.json nachsehen:
`[l['name'], l.get('bmpModus')] for l in layouts if 'bmp' in l['exportFormat']`.

**Gemessen an der Maschine (Nutzer, 13.09.2026) — die offene Testfrage aus dem
3-Wege-Test ist beantwortet:** bei einem blechgroßen BMP **fährt der Kopf die leeren
Plätze ab**, gravieren tut er dort nichts (Grund ist weiß). Es kostet also nur Zeit — ABER:
„manchmal funktioniert auch der Bereich nicht, der graviert werden muss". Ein einzelnes
1-bit-BMP von 3043×3059 px (9,3 MPixel, 1,1 MB) ist für Ezcad2-Lite offenbar zu groß.
`blech` ist damit für Mehrfachbelegung erledigt.

**Der fertige Weg ist `vorlage`** (Weg 1 aus `public/exports/_3-Wege-Test/`, dort auch
`LIESMICH.txt` mit den Koordinaten und `hole-vorlage.ps1` für den Laser-PC):
`_bmpVorlageDateien` schreibt IMMER alle N Plätze unter festen Namen
`_Vorlage/<Layout>/platz1.bmp…platzN.bmp`, leere als weißes Blindblatt in **identischer**
Größe — nachgemessen: alle zwölf 630×630 px bei 500 dpi = 32,00 × 32,00 mm, leere 0,0 %
schwarz. Damit bleiben Position und Größe in der .ezd für immer gültig. Seit 13.09.2026
stehen die Ezcad-Koordinaten je Platz auch in `belegung.txt` (vorher nur in der
Platzierungsliste des `platz`-Modus).

**Die .ezd selbst muss EINMAL per Hand in Ezcad gebaut werden** (N Bitmap-Objekte,
je „Dynamic file" + „Fixed DPI" + „Fixed Size X/Y", Position aus belegung.txt). Einen
.ezd-Generator gibt es nicht und er ist nicht empfohlen: das Format („EZCADUNI"; Muster sind
die echten .ezd in `exports/_Vorlage/*/` — das frühere `motive/test.ezd` ist am 24.09.2026
gelöscht) ist undokumentiertes Binär, und ohne Ezcad hier ist nichts davon prüfbar. Der Handaufbau ist einmalig, danach nur noch BMP tauschen.

**Nachtrag 10.09.2026 — zwei Ebenen, nicht eine.** Unabhängig vom Schalter setzt
`_buildLaserCanvas` nach dem Rastern alles AUSSERHALB der belegten Bildfelder wieder auf
Weiß (86 % → 12 % Schwarzanteil bei V5). Das ist die Absicherung für den Fall, dass doch
ein blechgroßes BMP gefahren wird. Trotzdem tastet Ezcad die volle Bitmap-Fläche ab —
„nur die Bilder gravieren" geht deshalb nur über Einzel-BMP. Dazu schreibt der Export
`<Layout>_<Satz>_Seite1_Platzierung.txt` mit den Ezcad-Koordinaten (Nullpunkt Blattmitte,
X rechts positiv, Y oben positiv) je Platz — einmal in Ezcad zusammensetzen, als .ezd
speichern, danach nur noch die BMP tauschen. EIN BMP mit mehreren einzeln anwählbaren
Bitmaps gibt es nicht; ein BMP ist in Ezcad immer genau ein Objekt.
