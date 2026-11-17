---
name: testblech-logos-2026-10-06
description: "06.10.2026 Logo-Testbleche: Löwenwasch direkt in _Vorlage/F02_Schw_V5 (überschreibt Tagesstand), CTW-Germany als K01-DXF im eigenen Ordner; Werkstück-Urteil offen"
metadata:
  node_type: memory
  type: project
  originSessionId: 30ae856f-b6b1-4d3b-a422-e4f977c0176c
  modified: 2026-10-06T15:06:24.786Z
---

Auf Nutzerwunsch am 06.10.2026 gebaut (Skripte nur im Scratchpad, nicht im Projekt):

- **F02_Schw_V5:** Löwenwasch-Logo (`public/test/löwenwasch2.ai`, über `motive.controller.einlesen`) als 1-Bit-BMP 649×629 @500 dpi, 30×14 mm mittig, schwarzes Bit = Laser, in allen 12 `platzN.bmp`. Deckel „Löwenwasch“ in Monotype per Editor-Engine (`_gravurSlotDxf`), 27,7×6 mm. Die Rückseite ist leer. **Direkt in den Arbeitsordner** `_Vorlage/F02_Schw_V5` geschrieben (der Nutzer will nur die .ezd öffnen, nichts selbst laden). Der Stand davor ist in `src/backups/2026-10-06_vorlage-vor-loewenwasch-test/` gesichert, eine Kopie liegt unter `exports/2026-10-06 Test/Loewenwasch/`. Der nächste Lauf überschreibt das Testblech.
- **K01 Kugelschreiber:** Das CTW-Germany-Logo (`public/test/Logo_Schrift_manochrom.jpg`) ist mit selbst geschriebenem Marching Squares vektorisiert, 22,4×4,5 mm, auf 15 Plätzen im K01-Raster. Es liegt als eine DXF in `exports/2026-10-06 Test/Kugelschreiber CTW-Germany/`. Für K01 gibt es keine .ezd-Vorlage, der Nutzer importiert die DXF von Hand.

Offen: ob die 0,7 mm hohe Schrift im Löwenwasch-Logo („FAHRZEUGAUFBEREITUNG“, „since 2023“) gravierbar ist. Siehe [[f02-vorlagen-betrieb]], [[k01-raster-mengenstufen]].
