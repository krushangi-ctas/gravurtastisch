---
name: export-nimmt-gespeicherte-werte
description: Jeder Export (Nachtlauf wie Reklamation) nimmt die GESPEICHERTEN Layout-Werte vom Server — ungespeicherte Änderungen im Laser-Reiter wirken nur im manuellen BMP-Knopf
metadata: 
  node_type: memory
  type: project
  originSessionId: 57dd819a-65b2-432c-818b-dba434f66052
  modified: 2026-09-24T09:13:00.180Z
---

`runAutoExport` lädt die Layouts über `getServerLayouts()` und benutzt deren
`ditherSettings`. Im Auto-Export (`?autoexport=1`) läuft `_applyLayoutState(layout, false)`
— die Oberfläche wird bewusst nicht angefasst. **Was im Laser-Reiter eingestellt, aber
nicht gespeichert ist, erreicht den Export nie.** Der manuelle BMP-Knopf im Editor nimmt
dagegen die laufenden `ditherSettings`. Beide Wege können deshalb auseinanderlaufen.

Gilt für den Nachtlauf genauso wie für die Reklamation über `/export-single`.

**Why:** Der Nutzer berichtete am 24.09.2026, bei einer Reklamation hätten „die
Einstellungen gar nicht getroffen". Ursache ist genau das — kein Fehler im
Reklamationsweg, sondern die fehlende Rückmeldung, dass gespeichert werden muss.

**How to apply:** Vor jeder Reklamation oder jedem Nachlauf mit geänderten Werten zuerst
das Layout speichern. Und: Es gibt **keine Einstellung je Platz** — ein Rendergang hat
genau eine Einstellung (`_buildLaserCanvas(s, {only})`). Eine Korrektur für einen
einzelnen Platz heißt: Layout-Wert ändern, speichern, exportieren, zurückändern. Das
Zurückändern zu vergessen bedeutet, dass der nächste Tageslauf mit dem Rezept des
Einzelfalls rechnet — siehe [[motiv-automatik]] und die vier Griffe in URTEILE.md.

**BEHOBEN für die Reklamation am 24.09.2026:** „Gravurdatei erzeugen" schickt die
Laser-Einstellungen des Editors mit (`laser` im POST an `/export-single`, gefiltert im
Server, als URL-Parameter bis in den Puppeteer-Browser). Mitgeschickt wird nur, wenn im
Editor GENAU dieses Layout geladen ist — sonst bekäme die Reklamation fremde Werte; die
Statusmeldung sagt, welcher Fall zutraf. Nachgewiesen: Vorgabe 35 % → 35,2 % gravierte
Fläche gegen 23,4 % aus dem gespeicherten Layout.

**Wichtige Fundstelle dabei:** Der BMP-Weg liest `layout.ditherSettings` direkt
(`_bmpVorlageDateien(layout.ditherSettings)`), NICHT die globale `ditherSettings`. Ein
Eingriff muss deshalb am Layout-Objekt ansetzen, nicht an der globalen Variablen — der
erste Versuch lief genau deshalb ins Leere.

Für den NACHTLAUF gilt der alte Satz unverändert: er nimmt den gespeicherten Stand.
