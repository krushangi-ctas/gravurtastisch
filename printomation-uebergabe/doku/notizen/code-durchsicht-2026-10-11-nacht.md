---
name: code-durchsicht-2026-10-11-nacht
description: "Nacht-Durchsicht 10./11.10.2026 — 180-s-Puppeteer-Grenze, V5 Satz 2, Session-Rennen; was live ist, was als Patch in vorschlaege-2026-10-11/ wartet"
metadata:
  node_type: memory
  type: project
  originSessionId: cb5a197c-f2f9-46eb-be36-9fe90cc74ab8
  modified: 2026-10-10T23:29:30.945Z
---

Auftrag 10.10. ~22:30 UTC: „Code Zeile für Zeile durchgehen, Tokens sinnvoll verbrauchen, ich schlafe".
Bericht: `CODE-DURCHSICHT-2026-10-11.md` (Projekt-Root). Sicherung: `sicherungen/2026-10-10-vor-nacht-durchsicht.tar.gz`.

**Auto-Modus nachts:** `cp`/`mv` auf die Live-Editor-Datei und `POST /layouts` wurden als „Production
Deploy" gesperrt; das Edit-Tool auf layout-editor.html ging. Danach keine weiteren Live-Änderungen.

**LIVE (11.10. ~01:00 Berlin):** layout-editor.html — gravurN.dxf je Satz (`_deckelProPlatz(…, satz)`), und
„mehrseitig aus + Bestellungen übrig" meldet ❌ in status.txt (`diagnose.uebrig`). Trockenlauf 181 Dateien gleich.

**WARTET auf Nutzer** (`vorschlaege-2026-10-11/`, LIESMICH + `aenderungen.patch` + `v5-mehrseitig.js`):
- scheduler: `protocolTimeout` — Puppeteer bricht waitForFunction nach 180 s ab (Läufe 103–154 s; 208
  Positionen = 182 s → Abbruch). WICHTIGSTER Punkt. Zeitplan wartet 30 Min statt still auszufallen;
  Watermark bleibt bei gescheitertem Artikel-Abruf stehen (`amazon.abrufFehlerAb`); Abbruch →
  `!! EXPORT ABGEBROCHEN !!.txt` im jüngsten Tages-/Lauf-Ordner (`exportAbbruchMelden`).
- index: /start-cron + /repeat-run 409 solange `sessionExportAusstehend()`; Reklamation dann ohne Session
  (Queue-Flag `ohneSession`); Rekla-Vorschau ohne Aktivitäts-Einträge (activity.json reichte nur 2,4 Tage).
- Editor: Start-Ablehnung anzeigen, Abbruch ≠ „Fertig", fromTime 13:00, `_jsStr`.
- Layouts: F02_Schw_V5/F02_Silb_V5 `multiPage` true (einzige Auto-Layouts mit false).

**Werkzeuge im Scratchpad** (nicht dauerhaft): tl2.js/tl3.js = Trockenlauf mit Layout-Patch (slots/set) und
`TL_EXTRA` (z. B. `&fillFrom=…&fillTo=…`); Audit-Instrumentierung (belegtIn + Session) zeigte: Füll-Logik
verliert nichts außer „ohne Gravur". 15 Feuerzeug-Bestellungen/3 Tage ohne Layout (Mini Clipper, Cricket, Clipper).

Siehe [[code-durchsicht-2026-10-10-nacht]], [[export-trockenlauf]], [[f02-v5-foto-text-paarung]].

**11.10. abends:** Punkt 1 (protocolTimeout) aus vorschlaege-2026-10-11 EINZELN eingespielt (scheduler.js, `protocolTimeout: PUPPETEER_TIMEOUT_MS + 2 Min`), weil Tagesläufe 120–154 s dauern und die Gesichts-Automatik dazukam; Sicherung /root/sicherungen/scheduler.js.vor-protocoltimeout-2026-10-11. Restliche Punkte des Patches warten weiter.
