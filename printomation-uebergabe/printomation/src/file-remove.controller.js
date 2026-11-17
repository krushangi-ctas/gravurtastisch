const fs = require('fs');
const os = require('os');
const path = require('path');
const { createLogger } = require('./utils/logger');
const logger = createLogger('index.log', __filename);
// Berlin-Tagesgrenze aus time-range.js — die Ordnernamen sind Berlin-Tage, ein
// Vergleich gegen UTC-Mitternacht würde die Löschgrenze um 1-2 Stunden verschieben.
// [EN] Berlin day boundary from time-range.js — folder names represent Berlin calendar days;
// comparing against UTC midnight would shift the deletion cutoff by 1-2 hours.
const { berlinDayBefore } = require('./time-range');
const { readJsonSafe } = require('./utils/json-file');
const { datenDir } = require('./config');

const basePath = path.join(__dirname, 'public');
const SETTINGS_FILE = path.join(datenDir, 'settings.json');
// Dead-Letter-Ordner: hier liegen Bestellungen, die auch nach fünf Versuchen nicht
// heruntergeladen werden konnten (fast immer: Amazon hat die Gravurdaten nach ~4 Wochen
// gelöscht, der Download antwortet dauerhaft mit 404).
// [EN] Dead-letter folder: contains orders that could not be downloaded even after five attempts
// (almost always: Amazon deleted engraving data after ~4 weeks, and download permanently returns 404).
const FAILED_QUEUE_DIR = path.join(__dirname, 'queue', 'failed');
// Aufbewahrung der Dead-Letter-Einträge. Sie sind reines Diagnosematerial — nach einer
// Woche hat sie niemand mehr angesehen, und ein volllaufender Ordner verdeckt neue Fälle.
// [EN] Retention of dead-letter entries. They are purely diagnostic material — after one
// week nobody looks at them anymore, and a filling folder obscures new cases.
const FAILED_QUEUE_TAGE = 7;

// ── Die EINZIGE Stelle mit Settings-Standardwerten ────────────────────────────
// loadSettings merged die Datei über die Defaults und liefert damit IMMER vollständige Werte;
// das Frontend übernimmt die Server-Antwort unverändert (keine eigenen Defaults dort).
// [EN] ── The SINGLE source of truth for Settings default values ─────────────────
// loadSettings merges file content over defaults, ALWAYS providing complete values;
// frontend adopts server response as-is (no separate defaults there).
const DEFAULT_SETTINGS = {
  downloads: { autoDelete: true, afterDays: 2 },
  exports:   { autoDelete: false, afterDays: 7 },
  emoji:     { gravieren: true },   // Emojis im Gravurtext mitgravieren (Editor, _emojiTeile) / [EN] Engrave emojis in engraving text (Editor, _emojiTeile)
};

const loadSettings = () => {
  const saved = readJsonSafe(SETTINGS_FILE, {},
    e => logger.warn('settings.json konnte nicht gelesen werden, nutze Standardwerte:', e.message)) || {};
  // Je Abschnitt die gespeicherten Werte über die Defaults — ein neuer Abschnitt braucht nur
  // einen Eintrag in DEFAULT_SETTINGS.
  // [EN] For each section, stored values merge over defaults — a new section only needs
  // an entry in DEFAULT_SETTINGS.
  return Object.fromEntries(Object.entries(DEFAULT_SETTINGS)
    .map(([k, def]) => [k, { ...def, ...(saved[k] || {}) }]));
};

// Einträge in `dir`, die `passt(name)` erfüllen und deren Änderungszeit älter als `alterMs`
// ist, löschen (Datei oder Ordner). Fehlt der Ordner, gibt es nichts zu tun. Rückgabe = Anzahl.
// EIN Ablauf für Dead-Letter, Browser-Profile und die Rekla-Zwischenspeicher.
// [EN] Delete entries in `dir` matching `passt(name)` whose modification time is older than `alterMs`
// (file or directory). If folder is missing, nothing to do. Return value = count.
// ONE unified routine for dead-letter, browser profiles, and complaint temporary caches.
const loescheAelterAls = (dir, passt, alterMs, was) => {
  let namen;
  try { namen = fs.readdirSync(dir); } catch (_) { return 0; }
  const grenze = Date.now() - alterMs;
  let n = 0;
  for (const name of namen) {
    if (!passt(name)) continue;
    const p = path.join(dir, name);
    // try/catch pro Eintrag: ein Fehlschlag darf die restlichen nicht mit abbrechen.
    // [EN] try/catch per entry: a failure must not abort remaining deletions.
    try {
      if (fs.statSync(p).mtimeMs > grenze) continue;
      fs.rmSync(p, { recursive: true, force: true });
      n++;
    } catch (e) {
      logger.error(`${was} ${name} konnte nicht gelöscht werden:`, e.message);
    }
  }
  return n;
};

// Dead-Letter-Einträge löschen, die älter als FAILED_QUEUE_TAGE sind. Nicht über
// removeDateFolders: das sind EINZELDATEIEN ohne Datum im Namen, die Frist läuft über die
// Änderungszeit der Datei (= Zeitpunkt des Aussortierens).
// [EN] Delete dead-letter entries older than FAILED_QUEUE_TAGE. Not via
// removeDateFolders: these are SINGLE FILES without date in their name; deadline runs based on
// file modification time (= time when sorted out).
const removeOldFailedQueue = () => {
  const n = loescheAelterAls(FAILED_QUEUE_DIR, name => name.endsWith('.json'), FAILED_QUEUE_TAGE * 86400000, 'Dead-Letter-Eintrag');
  if (n) logger.log(`Dead-Letter aufgeräumt: ${n} Eintrag/Einträge älter als ${FAILED_QUEUE_TAGE} Tage gelöscht.`);
  return n;
};

// Browser-Profile der Puppeteer-Läufe. Puppeteer legt je Start ein Profil an und löscht es beim
// Schließen — das Snap-Chromium schreibt es aber in sein eigenes, abgeschottetes /tmp
// (/tmp/snap-private-tmp/snap.chromium/tmp/), und dort blieb es bei JEDEM Lauf liegen (6–20 MB).
// Älter als eine Stunde = sicher kein laufender Browser mehr (ein Export dauert Minuten).
// [EN] Browser profiles from Puppeteer runs. Puppeteer creates a profile per launch and deletes it on
// close — but Snap Chromium writes it to its isolated /tmp (/tmp/snap-private-tmp/snap.chromium/tmp/),
// where it remained on EVERY run (6–20 MB).
// Older than 1 hour = definitely no running browser anymore (an export takes minutes).
const PROFIL_ORDNER = ['/tmp/snap-private-tmp/snap.chromium/tmp', os.tmpdir()];
const PROFIL_MUSTER = /^(puppeteer_dev_chrome_profile-|org\.chromium\.Chromium\.)/;
const PROFIL_MIN_ALTER_MS = 60 * 60000;
const removeOldBrowserProfiles = () => {
  const n = PROFIL_ORDNER.reduce((s, dir) =>
    s + loescheAelterAls(dir, name => PROFIL_MUSTER.test(name), PROFIL_MIN_ALTER_MS, 'Browser-Profil'), 0);
  if (n) logger.log(`Browser-Profile aufgeräumt: ${n} Ordner (Puppeteer/Snap-Chromium) gelöscht.`);
  return n;
};

// Automatisches Löschen alter Bestellordner, Export-Ordner, Dead-Letter-Einträge und
// Browser-Profile. Rückgabe { downloads, exports, failed, profile, rekla } = Anzahl gelöschter
// Ordner bzw. Dateien (der Aufrufer meldet damit ein Ergebnis statt nur „gestartet").
// [EN] Automatic deletion of old order folders, export folders, dead-letter entries, and
// browser profiles. Return { downloads, exports, failed, profile, rekla } = count of deleted
// folders/files (allows caller to report a concrete result rather than just "started").
const autoRemoveFolders = async () => {
  const removed = { downloads: 0, exports: 0, failed: 0, profile: 0, rekla: 0 };
  // Läuft unabhängig von den public/-Einstellungen und noch VOR dem existsSync unten:
  // der Dead-Letter-Ordner liegt außerhalb von public/ und soll auch dann aufgeräumt
  // werden, wenn dort gerade nichts zu löschen ist.
  // [EN] Runs independently of public/ settings and BEFORE the existsSync below:
  // the dead-letter folder lies outside public/ and should be cleaned up even
  // when there is nothing to delete in public/.
  removed.failed = removeOldFailedQueue();
  removed.profile = removeOldBrowserProfiles();
  // Zwischenspeicher der Reklamation (Vorschau, „Alles ausprobieren", PDF-Vorschaubilder) —
  // nie auf dem Netzlaufwerk, jederzeit neu erzeugbar; nach 2 Tagen weg.
  // [EN] Temporary cache for complaints (preview, "try all", PDF preview images) —
  // never on the network drive, recreateable at any time; removed after 2 days.
  const tmpRekla = n => path.join(__dirname, 'tmp', n);
  removed.rekla = ['rekla-vorschau', 'rekla-varianten', 'rekla-pdfbild']
    .reduce((summe, n) => summe + loescheAelterAls(tmpRekla(n), () => true, 2 * 86400000, 'Rekla-Zwischenspeicher'), 0);
  // Reklamationen ohne Bestellung (eingegebener Text, Fotos): nach „Reklamation erstellen" liegt alles im
  // Reklamations-Ordner — der Auftrag selbst darf eine Woche bleiben, falls noch einmal nachgebessert wird.
  // [EN] Complaints without an order (entered text, photos): after "create complaint", everything lies in the
  // complaints folder — the job itself may stay for 1 week in case further adjustments are needed.
  removed.rekla += loescheAelterAls(tmpRekla('rekla-manuell'), () => true, 7 * 86400000, 'Rekla ohne Bestellung');
  const settings = loadSettings();
  // Früher stand dieser Check IM Downloads-Block und beendete die ganze Funktion —
  // der Export-Cleanup danach wurde dadurch übersprungen.
  // [EN] Previously this check was INSIDE the downloads block and terminated the whole function —
  // causing subsequent export cleanup to be skipped.
  if (!fs.existsSync(basePath)) return removed;

  // Ordner am/vor dem cutoff-Tag löschen; Rückgabe = Anzahl.
  // Muster: YYYY-MM-DD am Anfang, danach ein BELIEBIGER Zusatz (" Lauf 2", " Reklamation",
  // " Testblatt", " Maschinentest", …) — der Zusatz erbt die Frist seines Tages. Bewusst keine Liste
  // bekannter Zusätze: jedes neue Namensschema wüchse sonst still zu. Der Zusatz wird mitgeloggt.
  // [EN] Delete folders on/before cutoff day; return value = count.
  // Pattern: YYYY-MM-DD at start, followed by ANY suffix (" Run 2", " Complaint",
  // " Test sheet", " Machine test", etc.) — suffix inherits retention period of its day. Deliberately no
  // hardcoded list of suffixes: otherwise new naming patterns would accumulate silently. Suffix is logged.
  const removeDateFolders = (dir, cutoff, label) => {
    let n = 0;
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      if (!entry.isDirectory()) return;
      const m = /^(\d{4}-\d{2}-\d{2})( .+)?$/.exec(entry.name);
      if (!m) return;
      const day = m[1]; // Zusatz-Ordner erben die Frist ihres Tages / [EN] Suffix folders inherit retention of their day
      // String-Vergleich reicht: YYYY-MM-DD sortiert lexikografisch = chronologisch
      // [EN] String comparison is sufficient: YYYY-MM-DD sorted lexicographically = chronologically
      if (day > cutoff) return;
      // try/catch pro Ordner: ein Fehlschlag (offene Datei, Rechte) darf die restlichen
      // nicht mit abbrechen — vorher blieb der Rest ungelöscht, ohne Grund im Log.
      // [EN] try/catch per folder: failure (open file, permissions) must not abort remaining
      // deletions — previously the rest stayed undeleted without a reason in the log.
      try {
        fs.rmSync(path.join(dir, entry.name), { recursive: true, force: true });
        const daysPassed = Math.round((Date.parse(berlinDayBefore(0)) - Date.parse(day)) / 86400000);
        logger.log(`${label} gelöscht: ${entry.name} (${daysPassed} Tage alt)`);
        n++;
      } catch (e) {
        logger.error(`${label} ${entry.name} konnte nicht gelöscht werden:`, e.message);
      }
    });
    return n;
  };

  // ── Downloads löschen ──────────────────────────────────────────────────────
  // [EN] ── Delete downloads ──────────────────────────────────────────────────
  if (settings.downloads?.autoDelete) {
    const downloadDays = settings.downloads.afterDays ?? 2;
    removed.downloads = removeDateFolders(basePath, berlinDayBefore(downloadDays), 'Download-Ordner');
  } else {
    logger.log('Auto-Delete für Downloads deaktiviert — übersprungen.');
  }

  // ── Exports löschen ────────────────────────────────────────────────────────
  // [EN] ── Delete exports ────────────────────────────────────────────────────
  if (settings.exports?.autoDelete) {
    const exportDays = settings.exports.afterDays ?? 7;
    const exportsPath = path.join(basePath, 'exports');
    if (fs.existsSync(exportsPath)) {
      removed.exports = removeDateFolders(exportsPath, berlinDayBefore(exportDays), 'Export-Ordner');
    }
  } else {
    logger.log('Auto-Delete für Exports deaktiviert — übersprungen.');
  }
  return removed;
};

module.exports = { autoRemoveFolders, loadSettings, SETTINGS_FILE };
