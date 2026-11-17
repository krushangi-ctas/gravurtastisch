const fs = require('fs');

// ── Gemeinsame JSON-Datei-Helfer für alle persistenten Stores ────────────────
// (layouts.json, folders.json, activity.json, schedule.json, session.json, …)
// [EN] ── Shared JSON file helpers for all persistent stores ──────────────────
// [EN] (layouts.json, folders.json, activity.json, schedule.json, session.json, …)

// Atomar schreiben: erst in .tmp, dann rename. rename ist auf demselben Dateisystem atomar — ein
// Crash mitten im Write kann die Zieldatei so nie halb geschrieben (= korrupt) hinterlassen.
// KOMPAKT statt pretty-printed: layouts.json wird bei jedem GET/POST komplett gelesen/geschrieben
// (eingerückt ~40 % größer). Zum Ansehen reicht `python3 -m json.tool <datei>`.
// indent: nur für Dateien, die WIRKLICH von Hand gelesen werden (session.json). Der .tmp-Name enthält
// die PID, damit zwei Schreiber sich nicht gegenseitig die Zwischendatei wegziehen.
// Rückgabe: der geschriebene String — der Aufrufer (mountJsonStore) bildet daraus seinen ETag.
// [EN] Write atomically: first to .tmp, then rename. rename is atomic on same file system — a
// [EN] crash mid-write can thus never leave target file half-written (= corrupt).
// [EN] COMPACT instead of pretty-printed: layouts.json is read/written completely on every GET/POST
// [EN] (indented is ~40% larger). To view, `python3 -m json.tool <file>` suffices.
// [EN] indent: only for files that are TRULY inspected manually (session.json). The .tmp name contains
// [EN] the PID so two writers don't step on each other's temporary file.
// [EN] Return: written string — caller (mountJsonStore) derives its ETag from it.
function writeJsonAtomic(filePath, data, indent) {
  const tmp = `${filePath}.${process.pid}.tmp`;
  const text = JSON.stringify(data, null, indent || undefined);
  try {
    fs.writeFileSync(tmp, text);
    fs.renameSync(tmp, filePath);
  } catch (e) {
    // Halbe Zwischendatei nicht liegen lassen (Platte voll, Rechte) — bis 08.10.2026 blieb sie.
    // [EN] Do not leave half-written temp file behind (disk full, permissions)
    try { fs.rmSync(tmp, { force: true }); } catch (_) {}
    throw e;
  }
  return text;
}

// Lesen mit wichtiger Unterscheidung:
//   Datei fehlt          → fallback (normaler Erststart, kein Fehler)
//   Datei korrupt/unlesbar → Fehler WIRFT (Aufrufer muss z.B. 500 liefern)
// Ein Fallback bei korrupter Datei wäre gefährlich: der Client hielte "leer" für
// den echten Zustand und würde beim nächsten Speichern alle Daten überschreiben.
// [EN] Read with important distinction:
// [EN]   File missing          → fallback (normal initial start, not an error)
// [EN]   File corrupt/unreadable → THROWS error (caller must return e.g. 500)
// [EN] A fallback on a corrupt file would be dangerous: client would assume "empty" is
// [EN] actual state and overwrite all data on next save.
function readJsonFile(filePath, fallback) {
  if (!fs.existsSync(filePath)) return fallback;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Wie readJsonFile, aber auch eine KORRUPTE Datei ergibt nur den Fallback statt eines
// Wurfs. Für Stores, bei denen "leer" ungefährlich ist und ein Wurf schlimmer wäre als
// ein Datenverlust: Zeitplan, Watermark, Aktivitäts-Log, Session, Einstellungen.
// onError bekommt die Ausnahme, damit der Aufrufer sie protokollieren kann.
// [EN] Like readJsonFile, but even a CORRUPT file yields only the fallback instead of
// [EN] throwing. For stores where "empty" is safe and throwing is worse than
// [EN] data loss: schedule, watermark, activity log, session, settings.
// [EN] onError receives the exception so caller can log it.
function readJsonSafe(filePath, fallback, onError) {
  try {
    return readJsonFile(filePath, fallback);
  } catch (e) {
    if (onError) { try { onError(e); } catch (_) {} }
    return fallback;
  }
}

// Rohinhalt einer Datei (String) oder null. Für den ETag der JSON-Stores: der Hash über
// die Datei-BYTES spart das Parsen-und-neu-Serialisieren bei jedem GET/POST — bei
// layouts.json (≈1 MB) ist das pro Aufruf ein kompletter Durchlauf weniger.
// [EN] Raw content of a file (String) or null. For ETag of JSON stores: hashing
// [EN] file BYTES avoids parsing and re-serializing on every GET/POST — for
// [EN] layouts.json (≈1 MB) this is one entire cycle saved per call.
function readRaw(filePath) {
  try {
    return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
  } catch (e) { return null; }
}

// Einträge eines { Schlüssel: Wert }-Stores entfernen, deren Zeit (zeitVon(Wert)) älter als
// `tage` Tage ist oder fehlt. Rückgabe = Anzahl. EIN Ablauf für das Download-Ledger
// (processed-orders.json) und den ASIN-Index.
// [EN] Remove entries of a { key: value } store whose timestamp (zeitVon(value)) is older than
// [EN] `days` days or missing. Return = count. ONE logic for download ledger
// [EN] (processed-orders.json) and ASIN index.
function entferneAeltere(obj, tage, zeitVon) {
  const grenze = Date.now() - tage * 86400000;
  let n = 0;
  for (const k of Object.keys(obj)) {
    if (!(new Date(zeitVon(obj[k])).getTime() >= grenze)) { delete obj[k]; n++; }
  }
  return n;
}

module.exports = { writeJsonAtomic, readJsonSafe, readRaw, entferneAeltere };
