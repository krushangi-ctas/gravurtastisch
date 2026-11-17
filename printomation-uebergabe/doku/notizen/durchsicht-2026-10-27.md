---
name: durchsicht-2026-10-27
description: "Durchsicht 27.10.2026 (alle Dateien gelesen, Editor kommentarfrei) — 6 kleine Korrekturen + README, LIVE seit 27.10. 09:19 Berlin mit Nutzer-OK; Rückfall sicherungen/2026-10-27-vor-aufraeumen.tar.gz; Top-10-Featureliste"
metadata:
  type: project
---

Auftrag 27.10. vormittags: „Code aufräumen, jede Zeile/Funktion“ + „10 fehlende Features“. Gelesen: alle Server-Module, Pipeline, Editor (ohne Kommentare, alle 779 Funktionen), HTML-IDs automatisch abgeglichen. Lint (Fehlerregeln) 0 echte Befunde.

Korrekturen (Arbeitskopie im Session-Scratchpad `neu/`, Original `alt/`):
- motive.controller: AI/PS-Operatoren nach Spezifikation (S offen; s/f/F/b/B geschlossen; n/N = Schnittmaske → verworfen), PDF ebenso. Alle 27 Motive: Geometrie gleich, nur zu-Flag bei V3_J (DXF schreibt Motive ohnehin geschlossen). Wirkt erst bei neuem Upload (JSON-Cache).
- index.js manuellOrdnerBelegt: Name gilt unabhängig vom Anlagetag als belegt (Export geht immer in den heutigen Ordner).
- scheduler: Aufräum-Log nennt Rekla-Zwischenstände.
- Editor: removeFont meldet ehrlich, wenn nichts auf dem Server lag; _rtDateien-Regex kennt _Blatt und _2; lsErweitertInfo zeigt „eigener Dateiname“ nur mit Muster.
- README: layout-editor.js, Rekla-/Vorlage-Routen, sicherung.controller ergänzt.
Geprüft: node --check, Lint gleich, Bedien-Test alt=neu (ZIP-Inhalt gleich), Trockenlauf 229 Dateien alt=neu bis auf Zeitstempel.
LIVE 27.10. 08:19 UTC (Nutzer: „spiel die aufräum sachen ab“): atomar kopiert, pm2 restart, Routen 200, Zeitplan registriert. Rückfall: `tar xzf sicherungen/2026-10-27-vor-aufraeumen.tar.gz -C /var/www/printomation/printomation && pm2 restart printomation` (Pfade relativ zum Projektordner).

Beobachtung: scheduler.js wurde am 27.10. 07:47:48 UTC von einer ANDEREN Sitzung geändert (404-Filter /asin-check) und pm2 07:47:49 neu gestartet — nicht von dieser Durchsicht.

Feature-Vorschläge an den Nutzer: Storno-Check vor dem Gravieren ([[stornierte-bestellungen-im-export]]), Warnung „Bestellung ohne Layout“, Push bei Problemen, Versandfrist/Prime, Produktions-Status mit Scan, Versand (Billbee/Amazon), Foto-Prüfung + Kundenrückfrage, Rekla-Auswertung, Rohling-Bestand, Layout-Versionen. Siehe [[durchsicht-2026-10-26-komplett]], [[skript-nie-zum-testen-starten]].
