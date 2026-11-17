---
name: bild-n-kundenfoto
description: "Bild 1/2/… = erstes/zweites Foto des Kunden (seit 26.09.); vorher war palNum bei Bildern bedeutungslos; Stand: kein Produkt hat 2 Fotos"
metadata:
  type: project
---

Bis 26.09.2026 wählte die Zahl bei „Bild 1/2/3" NICHT das Foto: jedes Bildfeld nahm die
nächste Bestellung und davon das erste Foto (palNum zählte nur in zweiseitigen Layouts).
Seit 26.09. auf Nutzerwunsch („falls das irgendwann der Fall sein sollte"): **Bild N = N-tes
Foto, das der Kunde hochgeladen hat**, Platz-weise wie Gravur 1/2 (Bild 1 und Bild 2 am selben
Platz teilen sich eine Bestellung). Bild 1 läuft unverändert über `order.files`; Bild 2+ über
`_kundenFotos(json)` → `_loadImgNr` (Name + umschließende PlacementContainer, .pdf → .png).

**Stand 26.09.:** in 71 ASIN-Profilen hat kein Produkt mehr als ein Kundenfoto (6 mit Foto) —
Bild 2 bleibt also leer. Alle Layouts nutzen nur Bild 1. Geprüft: Füllen und DXF alt/neu
identisch (u. a. F02_Schw_V6, K01_Blau, 48-Felder-Stresstest), Bild 2 mit simulierter
Zweitfoto-Bestellung lädt das zweite Foto samt Platzierung.
