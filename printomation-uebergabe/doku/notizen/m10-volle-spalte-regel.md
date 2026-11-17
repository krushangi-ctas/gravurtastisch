---
name: m10-volle-spalte-regel
description: "M10-Layouts haben genau 10 Slots — linke Spalte zuerst komplett füllen, erst dann in die rechte; die Maschine braucht die volle Spalte zur Positionierung"
metadata:
  node_type: memory
  type: project
  originSessionId: b009d207-ad97-434d-afbc-85a3f302544e
  modified: 2026-08-11T18:39:50.168Z
---

Die Mengenstufe **M10 bekommt genau 10 Slots** — nicht die volle Blech-Bestückung.
Sonst graviert ein Blech mehr Teile, als die Bestellung umfasst (FL02 hatte 20 für
10 Stück).

**Aufteilung:** erst die **linke Spalte komplett**, der Rest oben in die rechte Spalte.
Begründung des Nutzers (11.08.2026): *eine Spalte muss voll sein, damit die Maschine die
richtige Positionierung bei der Gravur hat.* Nicht auf „gleichmäßig verteilt" umbauen.

Stand 11.08.2026: FL01_M10 10 (linke Spalte, 10 Zeilen) · FL02_M10 10 (linke Spalte) ·
FL03_M10 6 links + 4 rechts · FL04_M10 7 links + 3 rechts · FL05_M10 10 (= alle Slots).

Gilt nur für M10. M25–M250 behalten die volle Slot-Zahl, die Menge läuft dort über die
**Anzahl Bleche** — siehe [[fl01-array-mengenstufen]].
