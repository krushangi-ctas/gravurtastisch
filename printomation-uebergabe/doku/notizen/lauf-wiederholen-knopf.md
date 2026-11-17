---
name: lauf-wiederholen-knopf
description: ↻ am Zeitplan-Eintrag = POST /repeat-run — wiederholt den kompletten Lauf inkl. Auto-Export; Export-Dateien landen in exports/<Tag>/Lauf-N/
metadata:
  type: project
---

Gebaut 24.08.2026 im Zuge von [[versandbestaetigung-2min-blindfenster]]. Zwei Ausbaustufen am selben Tag: erst nur Download-Wiederholung, dann auf Nutzerwunsch der volle Lauf.

**↻ in der Zeitplan-Zeile** → `POST /repeat-run {id}` → `scheduler.repeatEntry` → `runEntry(entry, …, {repeat:true})`. `runEntry` ist der ausgelagerte Cron-Callback — Zeitplan und Wiederholung teilen EINE Sequenz (Fenster → runDownload → Auto-Export). Unterschiede bei `repeat`:
- Fenster-**Start** exakt wie der geplante Lauf (Preset + 90 min Overlap + ggf. Watermark), **Ende auf jetzt** gezogen. Ein 1:1-Nachbau der alten Obergrenze würde genau die Bestellungen wieder verwerfen, deren Zeitstempel die Versandbestätigung NACH die Grenze geschrieben hat (24.08.: 59 von 73) — der Filter sitzt clientseitig auf LastUpdateDate, auch wenn Amazon die Orders längst indexiert hat. „Die sind doch abgeschlossen" reicht also nicht.
- **Watermark und lastRun werden NICHT geschrieben** — Nachlese ist kein regulärer Lauf.
- Auto-Export nach 15 s statt 2 min (runDownload hat die Queue bereits abgearbeitet).

**Lauf-Ordner:** `POST /export-run {date}` vergibt eine **Nummer**. 1 = Tagesordner wie immer, ab 2 der **Nachbarordner auf gleicher Ebene**: `public/exports/2026-08-24 Lauf 2` (Nutzerwunsch 24.08. — erst lag er als Unterordner im Tag, das wollte er ausdrücklich anders). Nummer = höchster bestehender `<Tag> Lauf N` + 1, belegter Tagesordner zählt als Lauf 1. Den Ordnernamen baut **nur** der Server (`exportRunFolder`), der Browser schickt bloß `run` als Zahl → Traversal strukturell ausgeschlossen. Editor: `openExportRun()` am Anfang von `runAutoExport`, Nummer läuft durch `/export-upload` und `/export-status`; status.txt liegt im selben Lauf-Ordner. Gilt für JEDEN Auto-Export, auch den geplanten.

**Mitgezogen:** `file-remove.controller.js` matchte Ordner gegen `/^\d{4}-\d{2}-\d{2}$/` — `2026-08-24 Lauf 2` wäre nie gelöscht worden und für immer liegengeblieben. Muster jetzt `/^(\d{4}-\d{2}-\d{2})( Lauf \d+)?$/`, Frist über den Datums-Teil. Bei künftigen Ordnernamen unter `public/` oder `public/exports/` immer prüfen, ob das Cleanup sie noch erkennt.

**Downloads bleiben rein ergänzend** (Ledger/Ordner/Queue-Vorfilter; force nur am manuellen Knopf). Die **Session wird bei jedem Lauf ersetzt** (`clearSession`) — der Auto-Export einer Wiederholung exportiert deshalb genau die Nachzügler, nichts doppelt.

**Fallen:**
- ↻ NACH einem manuellen Nachhol-Download ist zwecklos: alles schon im Ledger → leere Session → Export exportiert nichts. Erst ↻, nicht erst manuell laden. (24.08. gelöst über `pending-export.json` schreiben + pm2 restart → `recoverPendingExport` exportiert die noch liegende Session.)
- Läuft der ↻-Abruf noch, wenn der Zeitplan feuert, überspringt der Zeitplan den Eintrag samt Export.
- `/start-cron` reichte `fromTime` nie an `computeTimeRange` durch (fiel still auf Vortag 00:00 zurück) — am 24.08. mitgefixt.
