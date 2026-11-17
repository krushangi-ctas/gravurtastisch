---
name: code-durchsicht-2026-10-10-nacht
description: "Nacht-Durchsicht 09./10.10.2026 (Nutzer schlief, „sehr gründlich, Tokens verbrauchen\") — gefundene Fehler, Fixes, Prüfungen, offene Punkte"
metadata:
  node_type: memory
  type: project
  originSessionId: a48179f5-6f19-4252-80b4-cb84fa4171ba
  modified: 2026-10-09T22:26:34.178Z
---

Auftrag 09.10. ~22:10 UTC: „geh den Code sehr gründlich durch, geh auf Code-Fehler ein". Vorher-Stände:
`sicherungen/2026-10-09-vor-entwurf-maschinen.tar.gz`, Scratchpad `review-vorher/` (scheduler, amazon, sicherung).

**Behoben (live, Server neu gestartet 22:22 UTC):**
- vorlage.controller `sichern()`: gleiche Sekunde überschrieb Sicherung → Zurückholen holte falschen Stand
  (am ZZ-Test nachgewiesen); jetzt Suffix -N, Liste nach Zeit, exaktes Namensmuster.
- scheduler: „Download abbrechen" während eines Zeitplan-Laufs schob trotzdem Watermark + lastRun vor und
  startete den Auto-Export mit halbem Ergebnis → ungeprüfte Bestellungen des Fensters nie wieder gesucht.
  Jetzt: Abbruch = kein Export, Watermark/lastRun bleiben; Meldung „Abgebrochen …" statt „Fertig!".
- sicherung.controller: Nachtsicherung enthält jetzt die 6 Ezcad-.ezd + „Tag laden.bat" (vorher NICHT
  gesichert, weil public/ ausgeschlossen ist); keine platzN.bmp, keine ENTWURF/TEST.
- JSON-Stores (Layouts/Ordner/…): Editor lud bei Server-Fehler still den localStorage-Stand und
  speicherte den beim nächsten Klick OHNE If-Match über den Server-Stand. Jetzt: `_ausBackup` sperrt
  save() mit Toast, bis ein Laden klappt (Puppeteer-geprüft); Server lehnt `[]` ohne If-Match ab,
  wenn der Store nicht leer ist (409).
- Auto-Export: schlug GET /orders, /session oder /layouts fehl, meldete der Lauf „keine Bestellungen"
  als ERFOLG (leerte beim 1. Lauf sogar die Ezcad-Arbeitsordner). Jetzt `_autoExportError` → Aktivität
  „❌ Puppeteer Fehler", nichts geschrieben. Trockenlauf 191 Dateien gleich bis Zeitstempel.
- Zeitplan im Editor: Speichern gesperrt, bis /schedule vom Server geladen ist (sonst überschrieb der
  localStorage-Stand den Server). Ledger: korrupte processed-orders.json → Kopie .kaputt + Fehler-Aktivität.
- motive.controller SVG: S nach L spiegelte alten Kontrollpunkt, Zahl nach Z = Endlosschleife (Server
  hängt), Startpunkt nach Z fehlte, Q/T/A waren Geraden, circle/ellipse fehlten, <defs>/clipPath wurden
  mitgraviert, width= traf stroke-width, x= traf rx=, rotate(a,cx,cy) ohne Mitte. Alle 27 Motive (AI)
  bytegleich; 10 SVG-Testfälle stimmen. PM2-Neustart 10.10. 08:28 UTC.

**Notiert, nicht geändert:** time-range `berlinTimeToUTC` nimmt den Offset von Mitternacht (am DST-Tag
1 h daneben; durch Watermark-min + 90 min Overlap abgefangen); motive ausPDF nimmt auch Binär-Ströme
(alle 27 Motive sind PostScript-AI → derzeit egal); Motiv-Upload gleichen Namens überschreibt sofort
(multer) — ist die neue Datei unlesbar, wird sie gelöscht → Motiv weg.
Siehe [[ezcad-reiter]], [[code-durchsicht-2026-10-06]].
