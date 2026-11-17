const fs = require('fs');
const path = require('path');

// Sicher serialisieren: JSON.stringify wirft bei zirkulären Strukturen (z.B. axios-Fehler) —
// ein Log-Aufruf darf niemals selbst werfen. Error → stack, sonst Fallback auf String().
// [EN] Safely serialize: JSON.stringify throws on circular structures (e.g. axios errors) —
// [EN] a logging call must never throw itself. Error → stack, otherwise fallback to String().
const safeStringify = (a) => {
  if (a instanceof Error) return a.stack || a.message || String(a);
  try {
    return JSON.stringify(a);
  } catch (_) {
    try {
      return String(a);
    } catch (_) {
      return '[unserializable]';
    }
  }
};

// ── Log-Rotation ─────────────────────────────────────────────────────────────
// Ab MAX_LOG_SIZE wird die Datei nach <name>.1 rotiert (eine Generation, alte .1 wird ersetzt).
// Die Größe wird modul-global pro Datei mitgezählt, weil MEHRERE Logger-Instanzen in dieselbe
// index.log schreiben — einzeln gezählt verzögerte sich die Rotation um diesen Faktor.
// [EN] ── Log rotation ────────────────────────────────────────────────────────
// [EN] From MAX_LOG_SIZE file is rotated to <name>.1 (one generation, old .1 is replaced).
// [EN] Size is tracked module-globally per file because MULTIPLE logger instances write
// [EN] to same index.log — tracking individually would delay rotation by that factor.
const MAX_LOG_SIZE = 5 * 1024 * 1024; // 5 MB
const _logSizes = {}; // logFilePath → aktuelle Größe in Bytes
// [EN] logFilePath → current size in bytes

function _trackedAppend(logFilePath, text) {
  if (_logSizes[logFilePath] === undefined) {
    try { _logSizes[logFilePath] = fs.statSync(logFilePath).size; } catch (_) { _logSizes[logFilePath] = 0; }
  }
  const bytes = Buffer.byteLength(text);   // Bytes, nicht Zeichen — Umlaute und Emojis zählen mehrfach
  // [EN] Bytes, not characters — umlauts and emojis count multiple bytes
  if (_logSizes[logFilePath] + bytes > MAX_LOG_SIZE) {
    try {
      fs.renameSync(logFilePath, logFilePath + '.1'); // ersetzt eine evtl. vorhandene .1
      // [EN] replaces a possibly existing .1
      _logSizes[logFilePath] = 0;
    } catch (_) { /* Rotation darf das Logging nie verhindern */ /* [EN] Rotation must never prevent logging */ }
  }
  fs.appendFileSync(logFilePath, text);
  _logSizes[logFilePath] += bytes;
}

function createLogger(fileName = 'app.log', label = 'LOG') {
  // Bequemlichkeit: __filename direkt übergeben → Label "[basename.js]" wird abgeleitet.
  // (Ersetzt die vorher in jeder Datei kopierte split('/').reverse()[0]-Beschwörung.)
  // [EN] Convenience: pass __filename directly → label "[basename.js]" is derived.
  // [EN] (Replaces previously copied split('/').reverse()[0] snippet in every file.)
  if (label.includes('/')) label = `[${label.split('/').pop()}]`;
  // Logs NICHT mehr unter public/ — das liefert express.static an jeden Angemeldeten aus
  // (index.log enthält Bestell-IDs etc.). Eigener logs/-Ordner außerhalb des Web-Roots.
  // [EN] Logs NO LONGER under public/ — express.static serves that to any logged-in user
  // [EN] (index.log contains order IDs etc.). Dedicated logs/ folder outside web root.
  const logFilePath = path.join(__dirname, '..', 'logs', fileName);

  // Ensure log dir exists
  fs.mkdirSync(path.dirname(logFilePath), { recursive: true });

  const formatTime = () => {
    const now = new Date();
    return now.toISOString().replace('T', ' ').replace(/\..+/, '');
  };

  const appendToFile = (...args) => {
    const timeStr = formatTime();
    const prefix = `${label} - [${timeStr}]`;
    const message = args
      .map((a) => (typeof a === 'object' ? safeStringify(a) : a))
      .join(' ');
    const fullLog = `${prefix} ${message}\n`;
    try {
      _trackedAppend(logFilePath, fullLog);
    } catch (_) {
      // Logging darf den Aufrufer niemals zum Absturz bringen
      // [EN] Logging must never crash the caller
    }
  };

  // Proxy to intercept log calls
  const handler =
    (type) =>
    (...args) => {
      const orig = console[type];
      orig(...args); // Keep native console behavior
      appendToFile(...args);
    };

  // Replace only desired console methods
  return new Proxy(console, {
    get(target, prop) {
      if (['log', 'warn', 'error', 'info', 'debug'].includes(prop)) {
        return handler(prop);
      }
      return Reflect.get(target, prop);
    },
  });
}

module.exports = { createLogger };
