---
name: f02-feuerzeug-layouts
description: "F02 Feuerzeug-Layouts: Schwarz + Silber je V5/V6/V7; exportFormat pro Variante unterschiedlich; invert: Schwarz true, Silber false (A/B-Test 01.09. entschieden)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 43634125-fd92-4d23-a087-a6a72447669b
  modified: 2026-09-01T00:00:00.000Z
---

Neue Produktgruppe **F02** (Feuerzeug, schwarz, Zippo-artig). Maße vom Nutzer: Breite 38mm, Höhe 58mm, Deckel 23mm, Körper 35mm (23+35=58 ✓). Arbeitsfläche wie bei allen Layouts im System: **200×200mm Blatt, 3mm Sicherheitsabstand** — die 38×58-Feuerzeugfläche sitzt als Bereich oben links (Offset +3/+3). Drei SKUs, alle am 18.08.2026 angelegt (Ordner F02, Farbe `#a3e635`):

- **F02_Schw_V5** (ASIN `B0HFKYQM8B`) — Gravur + Bild: Textfeld im Deckel (x=7,y=9,w=30,h=10), Bildfeld im Körper (x=6,y=28,w=32,h=31)
- **F02_Schw_V6** (ASIN `B0HFKV4QC7`) — nur Bild, volle Fläche (x=5,y=5,w=34,h=54)
- **F02_Schw_V7** (ASIN `B0HFKWMFBY`) — nur Bild, um **-90°** gedreht (gegen den Uhrzeigersinn; vom Nutzer am 18.08. so bestätigt, die anfängliche +90 war falschherum): Feld mit vertauschten Roh-Maßen (x=-5,y=15,w=54,h=34) + `rotation:-90`, um denselben Mittelpunkt (22,32) wie V6 gebaut → nach der Drehung exakt dieselbe 34×54-Fläche wie V6, nur gedreht. Negatives x ist Absicht und korrekt: es ist die *unrotierte* Box, die nach der Drehung im Blatt liegt.

**Why:** Zum Erstellzeitpunkt gab es noch KEINE echte Bestellung mit diesen ASINs (grep über alle public/-Ordner: keine Treffer) — die Angebote waren gerade erst live. Feldpositionen sind aus den vom Nutzer geschickten Produktfotos (Mockups) geschätzt, nicht aus einer echten `PlacementContainerCustomization` (s. [[platzierungsflaeche-bildfelder]]). Geometrie nur per Puppeteer-Screenshot verifiziert (Bounding-Boxen liegen korrekt in der 38×58-Fläche, keine Überstände) — nicht mit einem echten Kundenfoto.

**exportFormat richtet sich nach dem INHALT — nicht alle drei gleich** (Stand 27.08.2026):
`V5 = bmp+dxf` (hat Gravurtext, braucht die Vektordatei), `V6 = bmp`, `V7 = bmp`.
V7 stand bis 27.08. faelschlich auf `dxf` und lieferte dadurch **nur den leeren
Positionsrahmen, kein Foto** (gemessen: 602 Zeichen, eine POLYLINE, vier VERTEX) — vom
Nutzer korrigiert. Merke: ein Layout OHNE Textfeld braucht kein DXF. Das BMP traegt seine
mm selbst im Kopf (`XPelsPerMeter`), und der Positionsrahmen lohnt nur, wenn es einen
zweiten Durchgang gibt, mit dem er fluchten muss. **Der Layer `Bild` darf in Ezcad2 NICHT
mitgraviert werden** — sonst brennt ein Kasten ums Foto; er ist dort blau (Farbe 5), der
Text weiss (Farbe 7).

**Silber-Gegenstuecke, angelegt 27.08.2026** (gleiche Geometrie, nur andere ASIN/Name;
Hauskonvention `Silb`, Amazon-SKU schreibt dagegen `Silv`): `F02_Silb_V5` B0HGMPYHJD,
`F02_Silb_V6` B0HGMY7DVB, `F02_Silb_V7` B0HGNCV55Z. Die ASIN steckt bei F02 **pro Feld in
`filterAsin`**, `globalAsin` ist leer.

**A/B-Test invert bei Silber ist ENTSCHIEDEN (01.09.2026): ohne Invertieren gewinnt.**
Die drei invertierten Silber-Layouts (ids …195/196/197) wurden geloescht, die
`_OhneInv`-Fassungen auf die Namen `F02_Silb_V5/V6/V7` umbenannt (ids …205/206/207
behalten). Silber traegt also `invert: false` mit Preset-Name „Silber ohne Invertieren",
Schwarz bleibt bei `invert: true`. Damit auch keine doppelten Exporte pro Bestellung mehr.
Historie in activity.json behaelt die alten `_OhneInv`-Namen — das ist Protokoll, nicht Konfiguration.

**LÜCKE: die Rückseite ist in KEINEM F02-Layout abgebildet (geprüft 01.09.2026).**
Die Amazon-Produkte haben zwei Seiten: „Front Side" (Deckel-Text bei V5 / Bild) und
„Back side" mit drei Zeilen („1. Zeile" auf dem DECKEL, 2.+3. auf dem Körper — sichtbar
auf `bild-2.jpg`). Alle sechs Layouts haben nur EINE Seite und kein Feld dafür → der
Rückseiten-Text landet in keiner DXF/BMP. Gemessen: **13 von 29 echten F02-Bestellungen
(45 %) hatten Rückseiten-Gravur**, alle bei V6.

**V5-Textzuordnung kollidiert mit der Rückseite** (mit dem echten `getAllTexts` aus
layout-editor.html gegen konstruierte Daten nachgestellt): der Vorderseiten-Wrapper heisst
`name: "Lid text front"` (Label „Text 1") und wird von `/^Text (\d+)$/` NICHT getroffen,
der Rückseiten-Wrapper heisst `name: "Text 1"` und wird getroffen. Folge — sobald ein
V5-Kunde Deckel UND Rückseite fuellt: Deckeltext faellt weg, Slot 1 bekommt die
Rueckseiten-Zeile 1; fuellt er nur Zeile 2/3, bleibt „Gravur 1" LEER. Nur weil bei der
bisher einzigen V5-Bestellung die Rueckseite leer war, greift dort der Fallback und der
Deckeltext kommt korrekt an.

**Feldproportionen gegen die echte Amazon-Flaeche** (`PlacementContainerCustomization`,
Pixel im 400er-Preview): V5-Bild 206×205 ≈ unser 32×31 ✓; V6-Bild 206×339 (0,608) vs.
unser 34×54 (0,630) — knapp 4 % daneben, tolerabel; **V5-Deckeltext 188×41 (4,59) vs.
unser 30×10 (3,0)** — bei fester Gravurhoehe (s. [[feste-gravurhoehe]]) wird der Deckeltext
rund 50 % hoeher graviert als in der Kundenvorschau.

**Geschenkverpackung „Schwarzer Samtbeutel"** taucht NUR im item-JSON auf
(`OptionCustomization.displayValue`), in keiner Exportdatei — 3 von 29 Bestellungen.

**Export-Konfiguration** (fuer alle sechs — 3× Schwarz, 3× Silber): `autoExport: true`, `dxfStyle: outline`, `dxfTextMode: vector`. Dither = das gespeicherte Preset **„Schwarz weiß beste einstellung"** (floyd-steinberg, Kontrast 10, Gamma 0.8, Schärfen 0.8, autoContrast an, **invert true**, 500 DPI) — invert ist bei schwarz beschichteten Oberflächen Pflicht, sonst wird das Negativ graviert. Bei **Silber** gilt seit 01.09. das Preset „Silber ohne Invertieren" (identisch, aber `invert: false`).

**Dithering trifft NIE die Gravur — das ist strukturell so, nicht Einstellungssache:** `_buildLaserCanvas` filtert `fields.filter(f => f.type === 'image')`, Text kommt dort gar nicht an. Die Trennung ist die Datei: die `.dxf` enthält den Gravurtext als Vektor (Layer `Gravur_1`, `Gravur_2`, … pro Zeile) plus einen reinen POLYLINE-**Positionsrahmen** für jedes Bildfeld (Layer `Bild`, kein Bildinhalt); das gerasterte Foto steckt allein in der `.bmp` (1-bit, DPI im Header). Verifiziert per Headless-Export: DXF-Layer `Gravur_1, Bild`, BMP `bpp=1, 500 DPI`.

**How to apply:** Sobald die erste echte Bestellung für eine dieser drei ASINs reinkommt, die tatsächliche `customizationData`-Struktur ansehen (insbesondere `PlacementContainerCustomization` für die Bild-Flächen) und die Feldmaße/-position bei Bedarf nachjustieren.

**Bildrahmen in der DXF (10.09.2026).** `_buildDXFEntities` zeichnete um jedes Bildfeld ein
Rechteck auf Layer `Bild` — als Positionierhilfe gedacht, mit der Hausregel „nie
mitgravieren". Auf dem 12er-Blech sind das zwölf Rahmen, die jemand versehentlich
mitbrennt. Jetzt hängt es an `_dxfOpts().bildRahmen`: das Rechteck entsteht nur noch, wenn
das Layout **kein BMP** erzeugt — dann steht die DXF allein und braucht die Hilfe. Betrifft
genau F02_Schw_V5 und F02_Silb_V5, die einzigen Layouts mit Bildfeld UND `bmp+dxf`
(geprüft über alle 177 Layouts). Damit trennt sich sauber: **BMP nur Foto, DXF nur Gravur**
— ohne je Farbe zwei Layouts pflegen zu müssen, was der Nutzer zuerst erwogen hatte.

