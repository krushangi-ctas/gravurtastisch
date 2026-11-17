---
name: export-forensik
description: "Wie man Export-Probleme untersucht — UTC-Logs, DXF-Analyse, typische Ursachen (autoExport-Flag, dxfTextMode)"
metadata: 
  node_type: memory
  type: project
  originSessionId: fc9f9bf2-6eed-44c0-89c9-0bdce80a0cc0
  modified: 2026-07-26T20:29:13.768Z
---

Erkenntnisse aus der Export-Forensik vom 03.07.2026:

- **Log-Zeitstempel in `logs/index.log` sind UTC** (Berlin = UTC+2 im Sommer). „Zeitplan startet: Di 14:00" erscheint im Log um 12:00. Bei Log-Analysen immer umrechnen.
- **Auto-Export exportiert NUR die Session des jeweiligen Laufs** (`clearSession()` bei jedem manageFetchOrders). Eine Bestellung erscheint genau im Export des Laufs, der sie heruntergeladen hat — nie in späteren. „Bestellung fehlt im Export" → zuerst per meta.json `downloadedAt` den Lauf identifizieren und DESSEN Export prüfen.
- **Typische Export-Fehlerursachen** in layouts.json: (1) `autoExport: false`/fehlend → Layout wird komplett ignoriert; (2) `dxfTextMode: 'text'` → DXF enthält TEXT-Entities, Ezcad rendert Maschinen-Standardschrift statt Kundenschrift ('vector' = echte Konturen via Server-Fonts in src/fonts/); (3) `dxfFrame: false` → keine Positions-Referenz beim Ezcad-Import.
- **DXF prüfen ohne Ezcad**: TEXT/POLYLINE-Entities zählen (`grep -c "^TEXT$"`); POLYLINE/VERTEX-Koordinaten (Gruppencodes 10/20) zu SVG parsen, SVG nach `src/public/` legen und via `http://localhost:3002/…` mit Puppeteer screenshotten (snap-chromium kann NICHT auf /tmp zugreifen — file://-URLs scheitern am Confinement). PDF-Exporte: `pdftoppm -png -r 40`.
- Browser-Konsole des Puppeteer-Auto-Exports wird komplett ins Server-Log gespiegelt (`Browser:`-Präfix) — beste Quelle für „warum wurde Layout X übersprungen".
- **Seit 10.07.2026: Laser-Exporte (1-bit BMP + Laser-PNG „Schwarz/Weiß") sind auf die Bounding-Box der Bildfelder zugeschnitten** (`_imageFieldsBBox` in layout-editor.html), nicht mehr ganze A4-Seite — Ezcad2 sah sonst das ganze Blatt als Objekt. Abstände zwischen Fotos bleiben erhalten; BMP weiter mm-genau via DPI-Header. Der generische „PNG (verlustfrei)"-Export, PDF und Sublimation bleiben bewusst Vollseite. BMP-Datei kleiner als A4 ist also KEIN Fehler.
- **Seit 26.07.2026: der Zuschnitt kommt aus ALLEN Bildfeldern des Layouts, gezeichnet werden nur die gefüllten.** Vorher bestimmten die gefüllten Felder auch den Ausschnitt — bei einem Layout mit vielen Slots und nur wenigen Fotos pro Tag änderten sich Größe UND Ursprung des BMP bei jedem Lauf. Ein leerer Slot ist jetzt weiße Fläche an seiner Position; der Ausschnitt ist pro Layout konstant (Regressionstest in `tests/laser-bmp.js`, Abschnitt „Zuschnitt bleibt bei jedem Füllstand gleich").
- **Auto-Kontrast und der Schwarz-Anteil in der Gravur-Vorschau messen nur die belegten Fotoflächen** (`_maskRegions`/`rects`), nicht den weißen Blattgrund. Über die ganze Fläche gerechnet blieb der Weißpunkt immer bei 255 (Lichter wurden nie gestreckt) und der Schwarz-Anteil fiel mit jedem leeren Slot.
- **Ein fehlgeschlagener Upload wird als ❌ in status.txt gemeldet** (seit 26.07.2026, mit 2 Wiederholungen). Vorher wurde der Rückgabewert von `uploadExportToServer` an allen drei Stellen verworfen und `ok: true` protokolliert — status.txt konnte ✅ für nie geschriebene Dateien zeigen. Bei „Datei fehlt trotz ✅" also nicht mehr nur den Ordner prüfen, sondern auch `logs/index.log` nach `Upload endgültig fehlgeschlagen`.

Siehe [[betriebs-konventionen]], [[layout-editor-testen]], [[foto-gravur-workflow-ezcad]].

- **Welche Schrift steckt wirklich im DXF?** Der Vektor-Export schreibt Konturen, kein Font-Name — also geometrisch identifizieren: POLYLINE-Konturen paarweise (Code/Wert!) parsen, jede Kontur auf ihre Einheits-Bbox normieren, auf 64 Punkte gleichmäßig resamplen und gegen die Glyph-Konturen der Kandidaten-Fonts (`opentype.loadSync` + `getPath`) vergleichen; beste zirkulare Verschiebung, beide Umlaufrichtungen **und die y-gespiegelte Variante** testen. **Die Spiegelung ist der Fallstrick:** der Export dreht y (`offsetY - p[1]*scaleY`) — ohne Spiegel-Vergleich matchen nur senkrecht symmetrische Glyphen (o O I D B), und ALLES sieht nach Arial aus. Mit Spiegelung ist der Treffer exakt (Distanz 0.000). Selbsttest vorher: aus jedem Kandidaten-Font ein Mini-DXF erzeugen und prüfen, dass der Matcher 100 % richtig zuordnet. So am 12.09.2026 nachgewiesen, dass alle 41 DXF des Tages in Arial statt Monotype/Schreibschrift/Waltograph standen (s. [[amazon-schriftart-je-bestellung]]).
