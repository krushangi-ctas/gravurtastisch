const path = require('path');
const { writeJsonAtomic, readJsonSafe } = require('./json-file');
const { berlinDayBefore, berlinUhrzeit } = require('../time-range');
const { datenDir } = require('../config');

// ── Aktivitäts-Log (activity.json, Reiter „Übersicht") ───────────────────────
// Eigenes Modul statt `global.addActivity`: scheduler.js und amazon.controller.js holen es sich per require.
// [EN] ── Activity Log (activity.json, tab "Overview") ─────────────────────────
// [EN] Separate module instead of `global.addActivity`: scheduler.js and amazon.controller.js load it via require.
const ACTIVITY_FILE = path.join(datenDir, 'activity.json');

// 2000 statt 200: /export-status meldet einen Eintrag PRO DATEI, ein Blech-Export sind schon rund
// 15 Einträge — bei 200 drückten drei Exportläufe die Download-Historie aus dem Puffer (7-Tage-Balken
// leer). Die Downloads sind die Einträge, die lange gebraucht werden.
// [EN] 2000 instead of 200: /export-status reports an entry PER FILE, a sheet metal export is already ~15
// [EN] entries — at 200, three export runs pushed download history out of the buffer (7-day bar
// [EN] empty). Downloads are the entries needed long term.
const ACTIVITY_MAX = 2000;

function loadActivity() {
  const a = readJsonSafe(ACTIVITY_FILE, []);
  return Array.isArray(a) ? a : [];
}

// Streng aufsteigende ID. Date.now() allein reicht nicht: ein Export-Lauf legt Dutzende Einträge in
// derselben Millisekunde an. Gelesen wird das Feld heute nirgends, aber es behauptet Eindeutigkeit —
// wer es je als Schlüssel nimmt, fiele sonst still darauf herein.
// [EN] Strictly ascending ID. Date.now() alone is not enough: an export run creates dozens of entries in
// [EN] the same millisecond. Field is not currently read anywhere, but it claims uniqueness —
// [EN] anyone using it as a key would otherwise silently trip over duplicates.
let _lastActivityId = 0;
const _nextActivityId = () => (_lastActivityId = Math.max(Date.now(), _lastActivityId + 1));

function activityEntry(type, message, details = {}) {
  return {
    id: _nextActivityId(),
    time: berlinUhrzeit(),
    date: berlinDayBefore(0), // gemeinsame Berlin-Tagesgrenze (time-range.js)
    // [EN] shared Berlin day boundary (time-range.js)
    type, // 'download', 'export', 'error', 'info'
    message,
    ...details
  };
}

// MEHRERE Einträge mit EINEM Lese-/Schreibvorgang. /export-status meldet einen Eintrag
// pro exportierter Datei — als Einzelaufrufe war das pro Datei ein vollständiges
// Lesen + atomares Schreiben der kompletten activity.json (bei 30 Dateien also 30×).
// [EN] MULTIPLE entries in ONE read/write operation. /export-status reports an entry
// [EN] per exported file — as individual calls this was a full read + atomic write
// [EN] of complete activity.json per file (30 times for 30 files).
function addActivities(entries) {
  if (!entries.length) return entries;
  const activity = loadActivity();
  // unshift in Aufruf-Reihenfolge, damit der zuletzt übergebene Eintrag oben steht
  // [EN] unshift in call order so most recently passed entry sits on top
  for (const e of entries) activity.unshift(e);
  if (activity.length > ACTIVITY_MAX) activity.splice(ACTIVITY_MAX);
  writeJsonAtomic(ACTIVITY_FILE, activity);
  return entries;
}

function addActivity(type, message, details = {}) {
  return addActivities([activityEntry(type, message, details)])[0];
}

// Für Hintergrund-Abläufe (Download, Queue, Cron): ein Eintrag im Aktivitäts-Log darf
// einen Lauf nie abbrechen — Schreibfehler werden geschluckt.
// [EN] For background workflows (download, queue, cron): an entry in activity log
// [EN] must never abort a run — write errors are swallowed.
function meldeAktivitaet(type, message, details) {
  try { addActivity(type, message, details); } catch (_) {}
}

module.exports = { loadActivity, activityEntry, addActivities, addActivity, meldeAktivitaet };
