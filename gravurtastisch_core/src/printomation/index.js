const express = require('express');
const app = express();
const config = require('./config');
const amazon = require('./amazon.controller');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto'); // ETag der JSON-Stores (s. mountJsonStore)
// [EN] ETag of JSON stores (see mountJsonStore)
const multer = require('multer');
const { loadSettings, SETTINGS_FILE } = require('./file-remove.controller');
const readOrders = require('./read-orders.controller');
const { computeTimeRange, berlinDayBefore, berlinUhrzeit } = require('./time-range');
const { createLogger } = require('./utils/logger');
const logger = createLogger('index.log', __filename);
const scheduler = require('./scheduler');
const { writeJsonAtomic, readJsonSafe, readRaw } = require('./utils/json-file');
const { loadActivity, activityEntry, addActivities, addActivity } = require('./utils/activity');
const { execFile } = require('child_process'); // pdftoppm (Vorschaubild einer Rekla-PDF)
// [EN] pdftoppm (preview image of a complaint PDF)
const motiveCtl = require('./motive.controller.js');
const vorlageCtl = require('./vorlage.controller.js');
const asinCheck = require('./asin-check.controller');

// JWT Auth from Core
const passport = require('passport');
const { jwtStrategy } = require('../config/passport');
const auth = require('../middlewares/auth');

// Kein CORS: Editor, Puppeteer-Export und Amazon-Bereich laufen alle auf derselben Herkunft.
// Bis 23.10.2026 stand hier cors({ origin: true, credentials: true }) — damit hätte JEDE fremde
// Webseite im Browser eines angemeldeten Mitarbeiters /orders, /session usw. mitlesen können
// (der Browser schickt die Basic-Auth-Anmeldung mit).
// Dafür gibt es etwas anderes: dieselbe Anmeldung schickt der Browser auch mit, wenn eine fremde Seite ein
// FORMULAR hierher abschickt (multipart braucht keinen Preflight — Schrift überschreiben, Motiv hochladen …)
// oder ein <img> auf /start-cron zeigt (startet einen Abruf). Ändernde Anfragen und der Abruf-Start
// deshalb nur von hier selbst. Moderne Browser sagen die Herkunft in Sec-Fetch-Site („same-site" wäre
// z. B. printomation.de — auch fremd), sonst entscheidet Origin. Ohne beides (curl, Server-intern)
// geht es durch; Puppeteer-Export und Editor sind same-origin, nginx reicht den Host durch.
// [EN] No CORS: Editor, Puppeteer export, and Amazon area all run on the same origin.
// [EN] Until Oct 23, 2026, cors({ origin: true, credentials: true }) stood here — allowing ANY external
// [EN] website in a logged-in employee's browser to read /orders, /session, etc.
// [EN] (the browser sends the Basic Auth credentials along).
// [EN] Conversely: the browser also sends the same credentials if an external site submits a
// [EN] FORM here (multipart requires no preflight — overwrite font, upload motive ...)
// [EN] or an <img> points to /start-cron (triggers a fetch). State-changing requests and fetch starts
// [EN] are therefore allowed only from this origin itself. Modern browsers report origin in Sec-Fetch-Site ("same-site" would be
// [EN] e.g. printomation.de — also external), otherwise Origin header decides. Without both (curl, internal server calls)
// [EN] it passes through; Puppeteer export and Editor are same-origin, nginx forwards the Host.
const _AENDERND = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
app.use((req, res, next) => {
  if (!_AENDERND.has(req.method) && !req.path.startsWith('/start-cron/')) return next();
  const site = req.get('Sec-Fetch-Site'), origin = req.get('Origin');
  let fremd = site === 'cross-site' || site === 'same-site';
  if (!site && origin) {
    try { fremd = new URL(origin).host !== req.get('Host'); } catch (_) { fremd = true; }
  }
  if (process.env.NODE_ENV !== 'production' || origin?.includes('localhost')) {
    fremd = false;
  }
  if (!fremd) return next();
  logger.warn(`Anfrage von fremder Seite abgelehnt: ${req.method} ${req.path} (Sec-Fetch-Site ${site || '-'}, Origin ${origin || '-'})`);
  res.status(403).json({ error: 'Anfrage von fremder Seite abgelehnt.' });
});
fs.mkdirSync(config.datenDir, { recursive: true });
app.use(express.json({ limit: '50mb' }));
// Sicherheitsnetz: .log-Dateien nie über den Web-Root ausliefern
// [EN] Safety net: never serve .log files via web root
app.use((req, res, next) => {
  if (/\.log$/i.test(req.path)) return res.status(404).send('Not found');
  next();
});
app.use(express.static(`${__dirname}/public/`));

// JWT authentication (from Core)
app.use(passport.initialize());
passport.use('jwt', jwtStrategy);

// ── Progress State ────────────────────────────────────────────────────────────
// [EN] ── Progress State ────────────────────────────────────────────────────────
let progress = {
  running: false,
  phase: '',
  total: 0,
  current: 0,
  message: '',
  done: false,
  error: null,
};

// WICHTIG: progress behält immer seine Objekt-Identität (nie neu zuweisen) —
// scheduler.js hält eine Referenz darauf. Das Zurücksetzen vor jedem Lauf
// übernimmt scheduler.runDownload (gemeinsame Sequenz für manuell + Zeitplan).
// [EN] IMPORTANT: progress always retains its object identity (never reassign) —
// [EN] scheduler.js holds a reference to it. Resetting before each run
// [EN] is handled by scheduler.runDownload (shared sequence for manual + scheduled).

// ── Erlaubte Werte für Abruf-Status und Zeitraum-Preset ──────────────────────
// [EN] ── Allowed values for fetch status and time range preset ──────────────────
// EINE Quelle für BEIDE Eingänge: den gespeicherten Zeitplan (POST /schedule) und den manuellen
// Sofort-Abruf (/start-cron) — kein beliebiger `status` an die Amazon-API, kein unbekanntes `preset`
// im stillen 24h-Default von computeTimeRange.
// [EN] ONE source for BOTH inputs: the saved schedule (POST /schedule) and the manual
// [EN] instant fetch (/start-cron) — no arbitrary `status` to Amazon API, no unknown `preset`
// [EN] silently falling back to the 24h default in computeTimeRange.
const OK_STATUS = new Set(['Unshipped', 'PartiallyShipped', 'Shipped']);
const OK_PRESET = new Set(['today', 'yesterday', '7days', 'custom', 'fromTime', 'last24h', 'last48h']);
const statusIsValid = (s) => typeof s === 'string' && s.trim() !== ''
  && s.split(',').every(v => OK_STATUS.has(v.trim()));
// Uhrzeit für preset 'fromTime'. Ohne Bereichsprüfung wäre '99:99' gültig geformt und
// berlinTimeToUTC hätte daraus stillschweigend einen Zeitpunkt am Folgetag gerechnet.
// [EN] Time string for preset 'fromTime'. Without range check, '99:99' would be validly formatted and
// [EN] berlinTimeToUTC would have silently computed a time on the following day.
const isValidTimeStr = (s) => {
  if (typeof s !== 'string' || !/^\d{1,2}:\d{2}$/.test(s)) return false;
  const [h, m] = s.split(':').map(Number);
  return h >= 0 && h <= 23 && m >= 0 && m <= 59;
};
// Datum eines Export-/Bestellordners: ausschließlich YYYY-MM-DD. Bestellnummer im
// Amazon-Format.
// [EN] Date of an export/order folder: strictly YYYY-MM-DD. Order number in
// [EN] Amazon format.
const isValidDateStr = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
const ORDER_ID_RE = /^\d{3}-\d{7}-\d{7}$/;
// Schalter im Anfragekörper: aus dem Formular (Upload) kommt '1'/'true', aus JSON (Status) true.
// [EN] Flag in request body: from form (upload) comes '1'/'true', from JSON (status) true.
const _jaFlag = v => v === true || v === '1' || v === 'true';
// Bestellnummer einer Reklamation, nur wenn sie dem Muster entspricht — sonst ''.
// [EN] Order number of a complaint, only if matching the pattern — otherwise ''.
const _reklaNr = body => (ORDER_ID_RE.test(String(body.orderId || '').trim()) ? String(body.orderId).trim() : '');

// ── Gemeinsame Helfer: Ordnernamen, Export-Läufe, Bestellordner, Rekla-Zwischenspeicher ──
// [EN] ── Shared Helpers: Folder names, export runs, order folders, complaint cache ──
// Gruppen-/Ordnernamen säubern: genau EIN sicherer Ordnername (kein Pfad-Traversal).
// Slashes/Backslashes/".." raus, nur Buchstaben (inkl. Umlaute), Ziffern, Space, _ und -.
// [EN] Sanitize group/folder names: exactly ONE safe folder name (no path traversal).
// [EN] Remove slashes/backslashes/"..", only letters (incl. umlauts), digits, space, _ and -.
const sanitizeFolder = (s) => {
  if (!s || typeof s !== 'string') return '';
  return s
    .replace(/[\/\\]/g, ' ')      // Pfadtrenner entfernen
    // [EN] Remove path separators
    .replace(/\.\.+/g, '.')       // ".." neutralisieren
    // [EN] Neutralize ".."
    .replace(/[^\p{L}\p{N} _.\-]/gu, '') // nur erlaubte Zeichen
    // [EN] Allowed characters only
    .trim()
    .slice(0, 60);
};

// Ordnername eines Export-Laufs, direkt unter public/exports/. Der erste Lauf des Tages
// behält den reinen Tagesordner; jeder weitere bekommt ihn mit Suffix — auf DERSELBEN
// Ebene wie die Tagesordner, damit ein Wiederhol-Lauf im Dateimanager neben dem Tag steht
// statt in ihm. Der Name wird IMMER hier gebaut und nie vom Browser übernommen: `date` ist
// gegen YYYY-MM-DD geprüft, `run` ist eine Zahl → Pfad-Traversal ist strukturell ausgeschlossen.
// [EN] Folder name of an export run, directly under public/exports/. The first run of the day
// [EN] retains the plain day folder; each subsequent run gets it with a suffix — on the SAME
// [EN] level as day folders, so repeat runs sit beside the day in file manager instead of inside it.
// [EN] The name is ALWAYS built here and never taken from browser: `date` is checked
// [EN] against YYYY-MM-DD, `run` is a number -> path traversal is structurally prevented.
const exportRunFolder = (date, run, rekla, test) => {
  // Testblätter (Menüpunkt „Testblatt" im Editor) bekommen einen eigenen Tagesordner:
  // sie enthalten Blindtext statt Kundendaten und dürfen NIE mit der Tagesproduktion
  // im selben Ordner liegen — sonst landet versehentlich ein Testblech im Laser.
  // [EN] Test sheets ("Test Sheet" menu item in Editor) receive their own day folder:
  // [EN] they contain placeholder text instead of customer data and must NEVER sit in the same
  // [EN] folder as daily production — otherwise a test plate could accidentally land in the laser.
  if (test) return `${date} Testblatt`;
  // Reklamationen bekommen einen eigenen Tagesordner statt einer Lauf-Nummer: sie sind
  // Einzelfälle und sollen sich im Dateimanager auf den ersten Blick von der
  // Tagesproduktion unterscheiden.
  // [EN] Complaints get their own day folder instead of a run number: they are individual cases
  // [EN] and should stand out at first glance from daily production in the file manager.
  if (rekla) return `${date} Reklamation`;
  const n = Number(run);
  return Number.isInteger(n) && n > 1 ? `${date} Lauf ${n}` : date;
};

// Reklamation OHNE Bestellung (26.10.2026): Aufträge, die nicht (mehr) bei Amazon liegen — Layout
// wählen, Text/Bild selbst eingeben. Sie bekommen eine Nummer im Bestellformat mit der Vorwahl 000
// (vergibt Amazon nie), damit alle Prüfungen und Wege der Reklamation unverändert gelten. Abgelegt
// NICHT unter public/<Tag>/: dort sähen sie das Füllen im Editor, „Lauf wiederholen" über den ganzen
// Zeitraum und der ASIN-Check. Stattdessen tmp/rekla-manuell/<Nr>/item-1/ — Bestell-JSON wie von
// Amazon, die Fotos und meta.json (dort unter `manuell` Name, Ordner, Layout, Tag). Ausgeliefert wie
// eine echte Bestellung unter /<Tag>/<Nr>/item-1/… (Route bei den Reklamations-Routen).
// [EN] Complaint WITHOUT order (Oct 26, 2026): orders no longer on Amazon — select layout,
// [EN] enter text/image manually. They get a number in order format with prefix 000
// [EN] (never assigned by Amazon), so all validation and complaint routes apply unchanged. Stored
// [EN] NOT under public/<Day>/: otherwise Editor population, "Repeat run" across the entire period,
// [EN] and ASIN check would see them. Instead tmp/rekla-manuell/<Nr>/item-1/ — order JSON as from
// [EN] Amazon, photos, and meta.json (there under `manuell` name, folder, layout, day). Served like
// [EN] a real order under /<Day>/<Nr>/item-1/... (route among complaint routes).
const MANUELL_RE = /^000-\d{7}-\d{7}$/;
const REKLA_MANUELL = path.join(__dirname, 'tmp', 'rekla-manuell');
const manuellMeta = (orderId) => MANUELL_RE.test(String(orderId || ''))
  ? readJsonSafe(path.join(REKLA_MANUELL, orderId, 'item-1', 'meta.json'), null) : null;
// Ordner der Reklamation unter „<Tag> Reklamation/": die Bestellnummer — ohne Bestellung der Name,
// den der Mitarbeiter eingegeben hat (beim Anlegen gesäubert und eindeutig gemacht).
// [EN] Complaint folder under "<Day> Reklamation/": the order number — without order, the name
// [EN] entered by the employee (sanitized and made unique upon creation).
const reklaOrdnerName = (orderId) => manuellMeta(orderId)?.manuell?.ordner || orderId;
// Für Aktivitätslog und Meldungen: ohne Bestellung zählt der Name, nicht die 000-Nummer.
// [EN] For activity log and messages: without order, the name counts, not the 000-number.
const reklaAnzeige = (orderId) => (MANUELL_RE.test(String(orderId || '')) ? `„${reklaOrdnerName(orderId)}" (ohne Bestellung)` : orderId);

// Bestellordner unter public/<Kauftag>/<Nummer>/ suchen. Der Kauftag ist an dieser Stelle
// nicht bekannt (der Export kennt nur die Nummer), deshalb über die Tagesordner gehen.
// [EN] Search order folder under public/<PurchaseDay>/<Number>/. The purchase date is not
// [EN] known at this point (export only knows the number), hence iterate through day folders.
const findOrderDir = (orderId) => {
  if (MANUELL_RE.test(String(orderId || ''))) {
    const p = path.join(REKLA_MANUELL, orderId);
    return fs.existsSync(p) ? p : null;
  }
  const base = path.join(__dirname, 'public');
  let tage = [];
  try { tage = fs.readdirSync(base); } catch(_) { return null; }
  for (const t of tage) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(t)) continue;
    const p = path.join(base, t, orderId);
    if (fs.existsSync(p)) return p;
  }
  return null;
};

// Zwischenspeicher für „Alles ausprobieren" — NICHT unter public/, nicht auf dem Netzlaufwerk.
// [EN] Cache for "Try everything" — NOT under public/, not on network drive.
const REKLA_VARIANTEN = path.join(__dirname, 'tmp', 'rekla-varianten');
// Vorschau-Exporte der Reklamation (09.10.: Nutzer will den Ordner auf dem Netzlaufwerk erst nach
// „Reklamation erstellen") — hier, nicht unter public/, je Bestellnummer.
// [EN] Preview exports of the complaint (Oct 9: user wants folder on network share only after
// [EN] "Create complaint") — here, not under public/, per order number.
const REKLA_VORSCHAU = path.join(__dirname, 'tmp', 'rekla-vorschau');
// Den Stand EINER Bestellung in diesen Zwischenspeichern verwerfen — beim Neuladen (Vorschau), vor
// jedem Probelauf (Varianten). Ältere Stände räumt das nächtliche Aufräumen weg (2 Tage).
// [EN] Discard the state of ONE order in these caches — upon reload (preview), before
// [EN] every trial run (variants). Nightly cleanup clears older states (2 days).
const reklaZwischenspeicherLeeren = (orderId, ...speicher) => {
  for (const d of speicher) {
    try { fs.rmSync(path.join(d, orderId), { recursive: true, force: true }); } catch (_) {}
  }
};

// ── Routen: Grundlegendes und Bestellungen ────────────────────────────────────
// [EN] ── Routes: Basics and Orders ───────────────────────────────────────────
// Leichter Health-Check für Frontend (checkServer) und Monitoring —
// vorher wurde dafür /orders gepingt (kompletter Verzeichnis-Scan).
// [EN] Lightweight health check for frontend (checkServer) and monitoring —
// [EN] previously /orders was pinged for this (full directory scan).
app.get('/v2/health', (req, res) => {
  res.json({ ok: true, uptime: Math.round(process.uptime()) });
});

// Wer ist angemeldet? (Einstellungen → Anmeldung). nginx prüft die Basic Auth und reicht den
// Authorization-Kopf durch; ohne Kopf kommt der Aufruf direkt auf dem Server (3002 nur lokal).
// [EN] Who is logged in? (Settings -> Login). nginx checks Basic Auth and passes the
// [EN] Authorization header through; without header the call arrives directly on the server (3002 local only).
app.get('/v2/wer-bin-ich', auth(), (req, res) => {
  const m = String(req.headers.authorization || '').match(/^Basic\s+(.+)$/i);
  const benutzer = m ? Buffer.from(m[1], 'base64').toString('utf8').split(':')[0] : null;
  res.set('Cache-Control', 'no-store').json({ benutzer });
});

// try/catch ist hier PFLICHT: Express 4 fängt Fehler aus async-Handlern nicht ab, und eine
// Fehler-Middleware greift dafür auch nicht. Ohne den Block ginge bei einem Scan-Fehler
// GAR KEINE Antwort raus — der Editor bliebe bei „Lade Bestellungen…" stehen, bis der
// Browser aufgibt. Realistischer Auslöser: der 03:00-Cleanup löscht einen Tagesordner,
// während readOrders() gerade durch ihn läuft (readdirSync auf einen verschwundenen Pfad).
// [EN] try/catch is MANDATORY here: Express 4 does not catch errors from async handlers, and
// [EN] error middleware also does not catch them. Without the block, on a scan error
// [EN] NO response at all would be sent — editor would hang at "Loading orders..." until
// [EN] browser gives up. Realistic trigger: 03:00 cleanup deletes a day folder
// [EN] while readOrders() is traversing it (readdirSync on a disappeared path).
app.get('/v2/orders', auth(), async (req, res) => {
  try {
    const data = await readOrders();
    return res.status(200).send(data);
  } catch (e) {
    logger.error('Bestellungen konnten nicht gelesen werden:', e.message);
    return res.status(500).json({ error: 'Bestellungen konnten nicht gelesen werden: ' + e.message });
  }
});

app.get('/v2/progress', auth(), (req, res) => {
  res.json(progress);
});

app.get('/v2/session', auth(), (req, res) => {
  res.json(readJsonSafe(path.join(config.datenDir, 'session.json'), { orders: [] }));
});

// ── Fonts Ordner erstellen ────────────────────────────────────────────────────
// [EN] ── Create fonts folder ────────────────────────────────────────────────────
const fontsDir = path.join(__dirname, 'fonts');
if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir, { recursive: true });

// Multer für Font-Uploads
// [EN] Multer for font uploads
const fontStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, fontsDir),
  // path.basename ist Pflicht: verhindert Path-Traversal via originalname ("../../x.ttf")
  // [EN] path.basename is required: prevents path traversal via originalname ("../../x.ttf")
  filename: (req, file, cb) => cb(null, path.basename(file.originalname)),
});
const fontUpload = multer({
  storage: fontStorage,
  fileFilter: (req, file, cb) => {
    const ok = /\.(ttf|otf|woff|woff2)$/i.test(file.originalname);
    cb(null, ok);
  },
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
});

// ── Font Routes ───────────────────────────────────────────────────────────────
// [EN] ── Font Routes ───────────────────────────────────────────────────────────────
// Alle gespeicherten Fonts auflisten
// [EN] List all stored fonts
app.get('/v2/fonts', auth(), (req, res) => {
  try {
    const files = fs.readdirSync(fontsDir).filter(f => /\.(ttf|otf|woff2?)$/i.test(f));
    res.json(files);
  } catch(e) {
    res.json([]);
  }
});

// Font-Datei hochladen (ein oder mehrere)
// [EN] Upload font file (one or more)
app.post('/v2/fonts/upload', auth(), fontUpload.array('fonts', 20), (req, res) => {
  const uploaded = req.files?.map(f => f.originalname) || [];
  // Der Filter verwirft falsche Endungen still — dann nicht „gespeichert" melden.
  // [EN] The filter silently discards invalid extensions — in that case do not report "saved".
  if (!uploaded.length) return res.status(400).json({ error: 'Keine Schriftdatei (ttf, otf, woff, woff2)' });
  logger.log('Fonts uploaded:', uploaded);
  res.json({ success: true, uploaded });
});

// Font-Datei löschen
// [EN] Delete font file
app.delete('/v2/fonts/:name', auth(), (req, res) => {
  const name = path.basename(req.params.name); // Sicherheit: nur Dateiname
  // [EN] Security: filename only
  const filePath = path.join(fontsDir, name);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  try { fs.unlinkSync(filePath); }
  catch (e) { return res.status(500).json({ error: e.message }); }
  logger.log('Font deleted:', name);
  res.json({ success: true });
});

// Font-Datei ausliefern
// [EN] Serve font file
app.get('/v2/fonts/:name', auth(), (req, res) => {
  const name = path.basename(req.params.name);
  const filePath = path.join(fontsDir, name);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.sendFile(filePath);
});

// ── Testfoto fürs Testblatt (Einstellungen → Testblatt → „Testfoto in die Bildfelder") ──
// [EN] ── Test photo for test sheet (Settings -> Test Sheet -> "Test photo into image fields") ──
// Das feste Standardbild der F02-Testbleche samt Amazon-Ausschnitt. Liegt bewusst nicht unter
// public/ (s. testfoto/LIESMICH.txt) — ausgeliefert werden nur genau diese zwei Dateien.
// [EN] The fixed standard image of F02 test plates with Amazon crop. Stored outside
// [EN] public/ intentionally (see testfoto/LIESMICH.txt) — only these two files are served.
const TESTFOTO_DATEIEN = new Set(['standardbild.jpg', 'standardbild-placement.json']);
app.get('/v2/testfoto/:name', (req, res) => {
  const name = path.basename(req.params.name);
  if (!TESTFOTO_DATEIEN.has(name)) return res.status(404).send('Not found');
  res.sendFile(path.join(__dirname, 'testfoto', name));
});

// ── Motive: Vektorgrafiken für die Gravur ────────────────────────────────────
// [EN] ── Motives: Vector graphics for engraving ─────────────────────────────
// Ablage getrennt von public/ — den Ordner liefert express.static an jeden Angemeldeten aus (auch
// Zuschauer), Motive sind Betriebsmittel. Ausgeliefert wird ausschließlich über die Routen hier.
// [EN] Storage separated from public/ — express.static serves that folder to any authenticated user
// [EN] (including viewers), motives are operational assets. Served exclusively via routes here.
const motiveDir = path.join(__dirname, 'motive');
if (!fs.existsSync(motiveDir)) fs.mkdirSync(motiveDir, { recursive: true });
const MOTIV_EXT = /\.(ai|eps|ps|svg|dxf|pdf)$/i;
// Hochgeladenes kommt erst hierher und wird gelesen, bevor es ein vorhandenes Motiv ersetzt (s. Route).
// Der Name behält die Endung — an ihr erkennt motive.controller das Format.
// [EN] Uploads arrive here first and are read before replacing an existing motive (see route).
// [EN] The name keeps the extension — motive.controller recognizes the format by it.
const MOTIV_UPLOAD_TMP = path.join(__dirname, 'tmp', 'motiv-upload');
fs.mkdirSync(MOTIV_UPLOAD_TMP, { recursive: true });
const motivUpload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, MOTIV_UPLOAD_TMP),
    filename: (req, file, cb) => cb(null, `${Date.now()}-${Math.round(Math.random() * 1e6)}-${path.basename(file.originalname)}`),
  }),
  fileFilter: (req, file, cb) => cb(null, MOTIV_EXT.test(file.originalname)),
  limits: { fileSize: 40 * 1024 * 1024 },
});
// Umgerechnete Pfade liegen als <Datei>.json daneben. Einmal beim Hochladen rechnen
// statt bei jedem Export: das Ornament aus CorelDRAW braucht dafür gut eine Sekunde.
// [EN] Converted paths reside alongside as <file>.json. Calculated once on upload
// [EN] instead of on every export: the CorelDRAW ornament takes a full second for this.
const motivJson = (name) => path.join(motiveDir, name + '.json');
// Neu gerechnet wird mit den Einstellungen des alten Stands (Toleranz, Ausrichtung),
// sofern der Aufrufer nichts anderes vorgibt — sonst verlöre ein Monogramm beim
// Ändern der Punktdichte still seine Spalt-Ausrichtung.
// [EN] Recalculated with previous settings (tolerance, alignment),
// [EN] unless caller specifies otherwise — otherwise a monogram would silently lose
// [EN] its gap alignment when changing point density.
const motivLesen = (name, toleranz, ausrichtung) => {
  const j = motivJson(name);
  const alt = readJsonSafe(j, null);
  if (toleranz == null && ausrichtung == null && alt) return alt;
  const m = motiveCtl.einlesen(path.join(motiveDir, name),
    toleranz ?? alt?.toleranz, ausrichtung ?? alt?.ausrichtung);
  writeJsonAtomic(j, m);
  return m;
};
// Ein umbenanntes Motiv muss in den Layouts mitwandern — sonst zeigen die Motiv-Felder
// ins Leere und der Export lässt die Grafik still weg.
// [EN] A renamed motive must migrate across layouts — otherwise motive fields
// [EN] point into void and export silently omits the graphic.
const motivInLayoutsUmbenennen = (alt, neu) => {
  const datei = path.join(config.datenDir, 'layouts.json');
  const layouts = readJsonSafe(datei, null);
  if (!Array.isArray(layouts)) return 0;
  let n = 0;
  for (const l of layouts)
    for (const pg of (l.pages || []))
      for (const f of pg) {
        if (!f || f.type !== 'motiv') continue;
        if (f.motivDatei === alt) { f.motivDatei = neu; n++; }
        // „Je Antwort“: die Zuordnung Antwort → Datei muss mit, sonst meldet der Lauf
        // „Motiv fehlt“ und der Platz bleibt leer.
        // [EN] "Per answer": mapping answer -> file must follow, otherwise run reports
        // [EN] "motive missing" and spot stays empty.
        for (const k of Object.keys(f.ddTabelle || {}))
          if (f.ddTabelle[k] === alt) { f.ddTabelle[k] = neu; n++; }
      }
  if (n) {
    fs.copyFileSync(datei, datei + '.bak');
    writeJsonAtomic(datei, layouts);
  }
  return n;
};

app.get('/v2/motive', auth(), (req, res) => {
  try {
    const out = fs.readdirSync(motiveDir).filter(f => MOTIV_EXT.test(f)).map(name => {
      const st = fs.statSync(path.join(motiveDir, name));
      let m = null, fehler = null;
      try { m = motivLesen(name); } catch (e) { fehler = e.message; }
      return { name, bytes: st.size, datum: st.mtime.toISOString(),
               breite: m?.breite ?? null, hoehe: m?.hoehe ?? null,
               pfade: m?.pfade.length ?? 0,
               punkte: m ? m.pfade.reduce((s, p) => s + p.pts.length, 0) : 0,
               toleranz: m?.toleranz ?? 0.02, rohPunkte: m?.rohPunkte ?? null,
               ausrichtung: m?.ausrichtung || 'umriss', anker: m?.anker || null, fehler };
    });
    res.json(out);
  } catch (e) { logger.error('Motive-Liste:', e.message); res.json([]); }
});

app.post('/v2/motive/upload', auth(), motivUpload.array('motive', 20), (req, res) => {
  const out = [];
  for (const f of (req.files || [])) {
    const name = path.basename(f.originalname);
    try {
      // ERST die hochgeladene Datei lesen, DANN an ihren Platz: bis 26.10.2026 überschrieb eine unlesbare
      // neue Fassung das vorhandene Motiv gleichen Namens, der catch löschte sie — Motiv weg, die Layouts
      // zeigten ins Leere. Gleicher Name = neue Fassung: die Pfade werden neu gerechnet (sonst lieferte
      // motivLesen weiter die der alten Datei); die Ausrichtung (Spalt) gehört zum Motiv und bleibt.
      // [EN] Read uploaded file FIRST, THEN move into place: until Oct 26, 2026, an unreadable
      // [EN] new version overwrote existing motive of same name, catch deleted it — motive gone, layouts
      // [EN] pointed to void. Same name = new version: paths are recomputed (otherwise
      // [EN] motivLesen kept serving old file's paths); alignment (gap) belongs to motive and remains.
      const vorher = readJsonSafe(motivJson(name), null);
      let m;
      try { m = motiveCtl.einlesen(f.path, vorher?.toleranz, vorher?.ausrichtung); }
      catch (e) {
        // Neue Fassung ohne erkennbaren Spalt: auf Umriss zurückfallen und es melden, statt abzulehnen.
        // [EN] New version without recognizable gap: fallback to outline and report it, instead of rejecting.
        if (!vorher?.ausrichtung) throw e;
        logger.warn('Motiv', name, '— Spalt-Ausrichtung nicht mehr möglich, zurück auf Umriss:', e.message);
        m = motiveCtl.einlesen(f.path, vorher?.toleranz, 'umriss');
      }
      fs.renameSync(f.path, path.join(motiveDir, name));
      writeJsonAtomic(motivJson(name), m);
      out.push({ name, breite: m.breite, hoehe: m.hoehe, pfade: m.pfade.length });
      logger.log('Motiv hochgeladen:', name, `${m.breite}×${m.hoehe} mm, ${m.pfade.length} Pfade`);
    } catch (e) {
      // Unbrauchbare Datei nicht liegen lassen; ein vorhandenes Motiv gleichen Namens bleibt unberührt.
      // [EN] Do not leave unusable files behind; an existing motive with the same name remains untouched.
      try { fs.unlinkSync(f.path); } catch (_) {}
      out.push({ name, fehler: e.message });
      logger.warn('Motiv unlesbar:', name, e.message);
    }
  }
  if (!out.length) return res.status(400).json({ error: 'Keine passende Datei (ai, eps, ps, svg, dxf, pdf)' });
  res.json({ success: out.some(o => !o.fehler), motive: out });
});

// Gemeinsamer Anfang der Routen /motive/:name…: nur der Dateiname zählt, und die Datei muss da sein.
// req.motiv = Dateiname. Die SVG-Vorschau antwortet als Text, alle anderen als JSON.
// [EN] Common preamble for routes /motive/:name...: only filename counts, and file must exist.
// [EN] req.motiv = filename. SVG preview responds as text, all others as JSON.
const motivDa = (req, res, next) => {
  req.motiv = path.basename(req.params.name);
  if (fs.existsSync(path.join(motiveDir, req.motiv))) return next();
  res.status(404);
  if (req.path.endsWith('/vorschau.svg')) res.send('Not found'); else res.json({ error: 'Not found' });
};

// Pfaddaten eines Motivs (der Editor zeichnet daraus Vorschau und DXF)
// [EN] Path data of a motive (editor draws preview and DXF from it)
app.get('/v2/motive/:name/pfade', auth(), motivDa, (req, res) => {
  try { res.json(motivLesen(req.motiv)); }
  catch (e) { res.status(422).json({ error: e.message }); }
});

app.get('/v2/motive/:name/vorschau.svg', auth(), motivDa, (req, res) => {
  try {
    res.type('image/svg+xml').send(motiveCtl.vorschauSVG(motivLesen(req.motiv)));
  } catch (e) { res.status(422).send('<svg xmlns="http://www.w3.org/2000/svg"/>'); }
});

// Punktdichte neu rechnen (Toleranz in mm, bezogen auf 30 mm Gravurbreite)
// [EN] Recalculate point density (tolerance in mm, relative to 30 mm engraving width)
app.post('/v2/motive/:name/toleranz', auth(), motivDa, (req, res) => {
  const name = req.motiv;
  const tol = parseFloat(req.body?.toleranz);
  if (!(tol > 0 && tol <= 1)) return res.status(400).json({ error: 'Toleranz muss zwischen 0 und 1 mm liegen' });
  try {
    const m = motivLesen(name, tol);
    const punkte = m.pfade.reduce((s, p) => s + p.pts.length, 0);
    logger.log('Motiv neu gerechnet:', name, `Toleranz ${tol} mm → ${punkte} Punkte`);
    res.json({ success: true, toleranz: tol, punkte, rohPunkte: m.rohPunkte, pfade: m.pfade.length });
  } catch (e) { res.status(422).json({ error: e.message }); }
});

// Ausrichtung im Feld: 'umriss' (Umriss einpassen, Standard) oder 'spalt' (Split-
// Monogramm: Balken = Feldbreite, Spaltmitte = Feldmitte; s. motive.controller.js)
// [EN] Alignment in field: 'umriss' (fit outline, default) or 'spalt' (split-
// [EN] monogram: bar = field width, gap center = field center; see motive.controller.js)
app.post('/v2/motive/:name/ausrichtung', auth(), motivDa, (req, res) => {
  const name = req.motiv;
  const a = req.body?.ausrichtung;
  if (a !== 'spalt' && a !== 'umriss') return res.status(400).json({ error: 'ausrichtung: spalt oder umriss' });
  try {
    const m = motivLesen(name, undefined, a);
    logger.log('Motiv-Ausrichtung:', name, a, m.anker ? JSON.stringify(m.anker) : '');
    res.json({ success: true, ausrichtung: m.ausrichtung || 'umriss', anker: m.anker || null,
               breite: m.breite, hoehe: m.hoehe });
  } catch (e) { res.status(422).json({ error: e.message }); }
});

app.post('/v2/motive/:name/umbenennen', auth(), (req, res) => {
  const alt = path.basename(req.params.name);
  const roh = String(req.body?.neu || '').trim();
  // Nur Dateiname, keine Pfade; Endung muss erhalten bleiben, sonst greift der Parser daneben
  // [EN] Filename only, no paths; extension must be retained, otherwise parser fails
  const neu = path.basename(roh).replace(/[/\\]/g, '');
  if (!neu || !MOTIV_EXT.test(neu)) return res.status(400).json({ error: 'Name braucht die Endung ai, eps, ps, svg, dxf oder pdf' });
  if (neu === alt) return res.json({ success: true, name: alt, layouts: 0 });
  const von = path.join(motiveDir, alt), nach = path.join(motiveDir, neu);
  if (!fs.existsSync(von)) return res.status(404).json({ error: 'Not found' });
  if (fs.existsSync(nach)) return res.status(409).json({ error: 'Es gibt schon ein Motiv mit diesem Namen' });
  try { fs.renameSync(von, nach); }
  catch (e) { return res.status(500).json({ error: e.message }); }
  try { fs.renameSync(motivJson(alt), motivJson(neu)); } catch (_) {}
  const n = motivInLayoutsUmbenennen(alt, neu);
  logger.log('Motiv umbenannt:', alt, '→', neu, `(${n} Feld(er) in Layouts angepasst)`);
  res.json({ success: true, name: neu, layouts: n });
});

app.delete('/v2/motive/:name', auth(), motivDa, (req, res) => {
  const name = req.motiv;
  try { fs.unlinkSync(path.join(motiveDir, name)); }
  catch (e) { return res.status(500).json({ error: e.message }); }
  try { fs.unlinkSync(motivJson(name)); } catch (_) {}
  logger.log('Motiv gelöscht:', name);
  res.json({ success: true });
});

// ── Download und Zeitplan ─────────────────────────────────────────────────────
// [EN] ── Download and Schedule ────────────────────────────────────────────────
app.get('/v2/schedule', auth(), (req, res) => {
  res.json(scheduler.loadSchedule());
});

app.post('/v2/schedule', auth(), (req, res) => {
  const entries = req.body;
  if (!Array.isArray(entries)) return res.status(400).json({ error: 'Invalid' });
  // Minimal-Validierung: day 0-6, time "HH:MM" mit Bereich, status und fromPreset aus den Whitelists —
  // dieselben Prüfungen wie /start-cron. Kaputte Einträge klar ablehnen statt speichern (node-cron löste
  // z. B. „25:99" still nie aus).
  // [EN] Minimal validation: day 0-6, time "HH:MM" with range, status and fromPreset from whitelists —
  // [EN] same checks as /start-cron. Explicitly reject broken entries instead of saving (node-cron
  // [EN] e.g. silently never triggered "25:99").
  const bad = entries.find(e => !e || !Number.isInteger(e.day) || e.day < 0 || e.day > 6
    || !isValidTimeStr(e.time) || !statusIsValid(e.status)
    || (e.fromPreset != null && !OK_PRESET.has(e.fromPreset)));
  if (bad) {
    logger.warn('Zeitplan abgelehnt — ungültiger Eintrag:', JSON.stringify(bad));
    return res.status(400).json({ error: 'Ungültiger Zeitplan-Eintrag (day 0-6, time HH:MM, gültiger Status/Preset erwartet)' });
  }
  // Lauf-Historie NIE aus dem Browser übernehmen, sondern aus der gespeicherten Datei
  // übertragen. Der Browser schickt beim Speichern seine eigene Liste; ist die auch nur
  // ein paar Sekunden alt (oder kommt aus dem localStorage-Fallback), überschriebe sie
  // sonst still, was der letzte Lauf serverseitig eingetragen hat — und mit
  // lastWindowFrom verlöre das ↻ genau die Angabe, die es wiederholen soll.
  // [EN] NEVER accept run history from browser; transfer from saved file instead.
  // [EN] Browser sends its own list on save; if even a few seconds old
  // [EN] (or coming from localStorage fallback), it would silently overwrite
  // [EN] what the last run recorded server-side — and with lastWindowFrom,
  // [EN] the repeat run ↻ would lose the exact parameters it is supposed to repeat.
  const vorher = new Map(scheduler.loadSchedule().map(e => [String(e.id), e]));
  const zusammengefuehrt = entries.map(e => {
    const alt = vorher.get(String(e.id));
    if (!alt) return e;
    const { lastRun, lastCount, lastRunAt, lastWindowFrom, lastWindowTo } = alt;
    return { ...e, lastRun, lastCount, lastRunAt, lastWindowFrom, lastWindowTo };
  });
  if (!scheduler.saveSchedule(zusammengefuehrt)) return res.status(500).json({ error: 'Zeitplan konnte nicht gespeichert werden (Details im Log)' });
  scheduler.applySchedule(zusammengefuehrt, progress, amazon);
  logger.log('Zeitplan gespeichert:', entries.length, 'Einträge');
  res.json({ success: true, count: entries.length });
});

// ── Manual trigger ────────────────────────────────────────────────────────────
// [EN] ── Manual trigger ────────────────────────────────────────────────────────
app.get('/v2/start-cron/:hours', auth(), async (req, res) => {
  if (progress.running) {
    return res.status(200).send({ message: 'already_running', progress });
  }

  // Eingaben prüfen wie im Zeitplan (gemeinsame Whitelists oben). Ungültiges wird
  // abgelehnt statt stillschweigend zurechtgebogen: ein unbekannter Status ging vorher
  // ungefiltert an die Amazon-API, ein unbekanntes Preset landete still im 24h-Default,
  // und `hours` war nach oben offen (?hours=100000 = Abruf über Jahre).
  // [EN] Validate inputs like in schedule (shared whitelists above). Invalid input is
  // [EN] rejected instead of silently coerced: an unknown status previously went
  // [EN] unfiltered to Amazon API, an unknown preset silently fell back to 24h default,
  // [EN] and `hours` was unbounded (?hours=100000 = fetch across years).
  const orderStatus = req.query.status || 'Unshipped';
  if (!statusIsValid(orderStatus)) {
    return res.status(400).json({ error: `Ungültiger Status "${orderStatus}" (erlaubt: ${[...OK_STATUS].join(', ')})` });
  }
  if (req.query.preset != null && !OK_PRESET.has(req.query.preset)) {
    return res.status(400).json({ error: `Ungültiges Preset "${req.query.preset}" (erlaubt: ${[...OK_PRESET].join(', ')})` });
  }
  for (const [k, v] of [['from', req.query.from], ['to', req.query.to]]) {
    if (v != null && v !== '' && !isValidDateStr(v)) {
      return res.status(400).json({ error: `Ungültiges Datum in "${k}" (erwartet YYYY-MM-DD)` });
    }
  }
  for (const k of ['fromTime', 'fromClock', 'toClock']) {
    const v = req.query[k];
    if (v != null && v !== '' && !isValidTimeStr(v)) {
      return res.status(400).json({ error: `Ungültige Uhrzeit in "${k}" (erwartet HH:MM)` });
    }
  }
  // Obergrenze wie der Rückblick-Deckel des Auto-Laufs (MAX_LOOKBACK_DAYS = 7 Tage).
  // [EN] Upper limit matching auto-run lookback cap (MAX_LOOKBACK_DAYS = 7 days).
  const MAX_MANUAL_HOURS = 7 * 24;
  const hoursRaw = parseFloat(req.params.hours) || 2;
  const hours = Math.min(Math.max(hoursRaw, 0.1), MAX_MANUAL_HOURS);
  if (hours !== hoursRaw) logger.warn(`start-cron: hours=${hoursRaw} auf ${hours} begrenzt.`);
  const minutes = Math.round(hours * 60);

  // Zeitfenster server-seitig aus dem Preset berechnen (gleiche, Berlin-korrekte Logik wie
  // der Auto-Lauf — time-range.js). Manuell: kein Overlap, kein Puffer (der Nutzer will
  // bewusst „bis jetzt"). Ohne Preset zählt der :hours-Pfadparameter (resolveWindowStart
  // im amazon.controller).
  // [EN] Calculate time window server-side from preset (same Berlin-correct logic as
  // [EN] auto-run — time-range.js). Manual: no overlap, no buffer (user deliberately
  // [EN] wants "up to now"). Without preset, :hours path parameter applies (resolveWindowStart
  // [EN] in amazon.controller).
  let lastUpdatedAfter = null;
  let createdBefore = null;
  if (req.query.preset) {
    const range = computeTimeRange({
      preset: req.query.preset,
      // fromTime mitgeben — sonst startete preset 'fromTime' am Vortag um Mitternacht.
      // [EN] Pass fromTime — otherwise preset 'fromTime' started at midnight the previous day.
      fromTime: req.query.fromTime || null,
      fromDate: req.query.from || null,
      toDate: req.query.to || null,
      // Uhrzeit zum Eigenen Zeitraum (optional) — ohne sie bleibt es beim ganzen Tag.
      // [EN] Time for custom time range (optional) — without it, defaults to full day.
      fromClock: req.query.fromClock || null,
      toClock: req.query.toClock || null,
      overlapMinutes: 0,
      bufferMinutes: 0,
    });
    lastUpdatedAfter = range.lastUpdatedAfter;
    createdBefore = range.createdBefore;
  }
  // force=1 → Dedup-Vorfilter überspringen: Bestellungen, die schon einmal geladen
  // wurden, kommen erneut herein. Der Fall dahinter: Ordner unter public/<Tag>/ von Hand
  // gelöscht und neu laden wollen — ohne das blockiert das Ledger (processed-orders.json)
  // die Bestellung dauerhaft, und im Editor ist nichts mehr zu füllen. Bewusst NUR hier
  // im manuellen Pfad; applySchedule ruft runDownload ohne force auf.
  // [EN] force=1 -> Skip dedup pre-filter: orders previously loaded
  // [EN] are re-imported. Use case: folder under public/<Day>/ manually deleted
  // [EN] and needs re-downloading — without this, the ledger (processed-orders.json)
  // [EN] permanently blocks the order, leaving nothing to populate in Editor. Deliberately ONLY here
  // [EN] in manual path; applySchedule calls runDownload without force.
  const force = _jaFlag(req.query.force);
  logger.log('start-cron received:', { hours, orderStatus, preset: req.query.preset, lastUpdatedAfter, createdBefore, force });

  // try/catch aus demselben Grund wie bei /orders: in einem async-Handler wird ein Wurf
  // zur unbehandelten Rejection, und der Aufrufer bekäme NIE eine Antwort. Werfen kann
  // hier z.B. addActivity (schreibt auf Platte).
  // [EN] try/catch for same reason as /orders: inside an async handler, a thrown error
  // [EN] becomes an unhandled rejection, and caller would NEVER get a response. Could be thrown
  // [EN] e.g. by addActivity (disk write).
  try {
    const dateInfo = lastUpdatedAfter ? `ab ${lastUpdatedAfter}` : `letzte ${hours} Stunden`;
    addActivity('download', `⬇️ Manueller Download gestartet (${dateInfo}${force ? ', erneut erzwungen' : ''})`, { status: 'running' });

    // Gemeinsame Sequenz mit dem Zeitplan (scheduler.runDownload). BEWUSST ohne await: die Antwort geht
    // sofort raus, der Lauf läuft im Hintergrund. runDownload setzt progress.running synchron vor dem
    // ersten await (ein direkt folgender /progress-Poll sieht den Lauf); Fehler behandelt es intern.
    // [EN] Shared sequence with schedule (scheduler.runDownload). DELIBERATELY without await: response goes
    // [EN] out immediately, run executes in background. runDownload sets progress.running synchronously before
    // [EN] first await (subsequent /progress poll sees the run); errors handled internally.
    scheduler.runDownload({
      minutes, status: orderStatus, lastUpdatedAfter, createdBefore, force,
      startMessage: `Suche Bestellungen (${dateInfo})…`,
    }, progress, amazon);

    res.status(200).send({ message: 'started' });
  } catch (e) {
    logger.error('start-cron konnte nicht gestartet werden:', e.message);
    res.status(500).json({ error: 'Download konnte nicht gestartet werden: ' + e.message });
  }
});

// Download abbrechen — setzt das Cancel-Flag, der laufende Prozess prüft das und beendet sich kontrolliert
// [EN] Cancel download — sets cancel flag, running process checks it and terminates gracefully
app.post('/v2/cancel-download', auth(), (req, res) => {
  if (!progress.running) {
    return res.json({ message: 'no_download_running' });
  }
  amazon.requestCancel?.();
  logger.log('Cancel-Download angefordert.');
  addActivity('info', '⏹ Download-Abbruch angefordert', { status: 'cancelled' });
  res.json({ message: 'cancelling' });
});

// Zeitplan-Eintrag nachlesen ("↻" in der Zeitplan-Zeile): derselbe Ablauf wie der
// geplante Lauf inklusive Auto-Export — s. scheduler.runEntry für die Unterschiede.
// [EN] Repeat schedule entry ("↻" in schedule row): same sequence as
// [EN] scheduled run including auto-export — see scheduler.runEntry for differences.
app.post('/v2/repeat-run', auth(), (req, res) => {
  if (progress.running) return res.status(200).json({ message: 'already_running', progress });
  const id = req.body?.id;
  if (id == null || id === '') return res.status(400).json({ error: 'id fehlt' });
  // 'window' = Layouts mit ALLEN Bestellungen des Zeitraums füllen, sonst nur mit den
  // Nachzüglern des Laufs. Alles Unbekannte fällt auf die harmlosere Variante zurück.
  // [EN] 'window' = populate layouts with ALL orders from the window, otherwise only
  // [EN] with latecomers of the run. Unknown values fall back to the safer variant.
  const fillScope = req.body?.fillScope === 'window' ? 'window' : 'session';
  try {
    const r = scheduler.repeatEntry(id, progress, amazon, { fillScope });
    if (r.error) return res.status(404).json({ error: r.error });
    addActivity('download', `↻ Lauf ${r.label} wird wiederholt${fillScope === 'window' ? ' (ganzer Zeitraum)' : ''}`, { status: 'running' });
    res.json({ message: 'started', label: r.label });
  } catch(e) {
    logger.error('repeat-run konnte nicht gestartet werden:', e.message);
    res.status(500).json({ error: 'Wiederholung fehlgeschlagen: ' + e.message });
  }
});

// ── JSON-Array-Stores (layouts.json, folders.json, laser-presets.json) ────────
// [EN] ── JSON Array Stores (layouts.json, folders.json, laser-presets.json) ────
// EIN GET/POST-Routenpaar-Bauplan für alle Stores. GET: korrupte Datei → 500 statt [] — ein leeres
// Array würde das Frontend als „keine Daten" werten und beim nächsten Speichern ALLES überschreiben.
// POST: optional vorherigen Stand als .bak aufheben (eine Generation), atomar schreiben.
// VERLORENE ÄNDERUNGEN: jede Mutation im Frontend schreibt das GESAMTE Array zurück — zwei offene Tabs
// (oder ein Tab neben dem Auto-Export) überschrieben sich gegenseitig. Dagegen ein ETag über den
// Dateiinhalt: stimmt das beim Laden erhaltene ETag nicht mehr, wird mit 409 abgelehnt. If-Match ist
// optional (curl, ältere Clients wie bisher). Der Hash geht über die Datei-Bytes, nicht über das neu
// serialisierte Objekt — das spart je Aufruf zwei komplette Serialisierungen.
// [EN] ONE GET/POST route pair blueprint for all stores. GET: corrupt file -> 500 instead of [] — an empty
// [EN] array would be treated by frontend as "no data" and overwrite EVERYTHING on next save.
// [EN] POST: optionally keep previous version as .bak (one generation), atomic write.
// [EN] LOST UPDATES: every mutation in frontend writes back the ENTIRE array — two open tabs
// [EN] (or a tab alongside auto-export) would overwrite each other. Mitigated via ETag over
// [EN] file content: if ETag received at load time no longer matches, rejected with 409. If-Match is
// [EN] optional (curl, legacy clients as before). Hash computes over raw file bytes, not newly
// [EN] serialized object — saving two full serializations per request.
const etagOfRaw = (text) =>
  '"' + crypto.createHash('sha1').update(text).digest('hex').slice(0, 16) + '"';
const EMPTY_STORE = '[]';

function mountJsonStore(route, file, { backup = false, label }) {
  app.get('/v2' + route, auth(), (req, res) => {
    try {
      const raw = readRaw(file) ?? EMPTY_STORE;
      JSON.parse(raw); // nur Gültigkeits-Prüfung: korrupt → 500 statt [] (s.o.)
      // [EN] Validity check only: corrupt -> 500 instead of [] (see above)
      res.set('ETag', etagOfRaw(raw));
      // Rohtext senden statt res.json(parsed): identischer Inhalt, ohne ein weiteres Mal
      // zu serialisieren.
      // [EN] Send raw text instead of res.json(parsed): identical content without re-serializing.
      res.type('application/json').send(raw);
    } catch(e) {
      logger.error(`${label} unlesbar:`, e.message);
      res.status(500).json({ error: `${label} unlesbar: ` + e.message });
    }
  });
  app.post('/v2' + route, auth(), (req, res) => {
    try {
      const data = req.body;
      if (!Array.isArray(data)) return res.status(400).json({ error: 'Invalid' });
      // nginx komprimiert die GET-Antwort (gzip) und macht das ETag dabei schwach
      // (W/"…") — der Editor schickt es so zurück. Ohne das Abschneiden schlüge
      // JEDES Speichern mit 409 fehl.
      // [EN] nginx compresses GET response (gzip) making ETag weak (W/"...") — Editor sends it back this way.
      // [EN] Without stripping prefix, EVERY save would fail with 409.
      const ifMatch = (req.get('If-Match') || '').replace(/^W\//, '');
      if (ifMatch) {
        const now = etagOfRaw(readRaw(file) ?? EMPTY_STORE);
        if (now !== ifMatch) {
          logger.warn(`${label}: Speichern abgelehnt (409) — Datei wurde zwischenzeitlich geändert.`);
          return res.status(409).json({
            error: `${label} wurde zwischenzeitlich von anderer Stelle geändert — bitte neu laden.`,
            expected: ifMatch, current: now,
          });
        }
      }
      // Letztes Sicherheitsnetz: ein LEERES Array überschreibt einen gefüllten Store nur mit gültigem
      // If-Match (= der Editor hat bewusst den letzten Eintrag gelöscht). Ein Editor, der seinen Stand
      // nicht vom Server bekam (Netzfehler → leeres lokales Backup), löschte sonst alle Layouts.
      // [EN] Last safety net: an EMPTY array only overwrites a filled store with valid
      // [EN] If-Match (= Editor deliberately deleted last entry). An Editor failing to fetch its state
      // [EN] from server (network error -> empty local backup) would otherwise delete all layouts.
      if (data.length === 0 && !ifMatch) {
        try {
          const jetzt = JSON.parse(readRaw(file) ?? EMPTY_STORE);
          if (Array.isArray(jetzt) && jetzt.length > 0) {
            logger.warn(`${label}: leeres Array ohne If-Match abgelehnt (${jetzt.length} Einträge bleiben).`);
            return res.status(409).json({ error: `${label}: leerer Stand ohne Bezug auf den Server abgelehnt — bitte neu laden.` });
          }
        } catch (_) { /* korrupte Datei: wie bisher überschreiben lassen */ }
        // [EN] corrupt file: let it overwrite as before
      }
      if (backup && fs.existsSync(file)) fs.copyFileSync(file, file + '.bak');
      const written = writeJsonAtomic(file, data); // gibt den geschriebenen String zurück
      logger.log(`${label} gespeichert:`, data.length);
      // Neues ETag zurückgeben, damit derselbe Tab ohne zwischenzeitliches Neuladen
      // weiterspeichern kann.
      // [EN] Return new ETag so the same tab can keep saving without intermediate reload.
      res.set('ETag', etagOfRaw(written));
      res.json({ success: true });
    } catch(e) { res.status(500).json({ error: e.message }); }
  });
}
// Layouts: mit .bak-Sicherheitsnetz gegen versehentliches Massen-Löschen
// [EN] Layouts: with .bak safety net against accidental mass deletion
mountJsonStore('/layouts', path.join(config.datenDir, 'layouts.json'), { backup: true,  label: 'layouts.json' });
// Projekt-Ordner (Name, Farbe, Reihenfolge) — für die Layout-Gruppierung
// [EN] Project folders (name, color, order) — for layout grouping
mountJsonStore('/folders', path.join(config.datenDir, 'folders.json'), { backup: false, label: 'folders.json' });
// Eigene Laser-Presets (am Material erprobte Dither-Werte). Mit .bak: die Werte stecken
// in Gravurtests auf echtem Material — verloren heißt nachmessen.
// [EN] Custom laser presets (dither values tested on actual material). With .bak: values stem
// [EN] from real engraving tests — losing them means re-testing.
mountJsonStore('/laser-presets', path.join(config.datenDir, 'laser-presets.json'), { backup: true, label: 'laser-presets.json' });

// ── Einstellungen ─────────────────────────────────────────────────────────────
// [EN] ── Settings ─────────────────────────────────────────────────────────────

app.get('/v2/settings', auth(), (req, res) => {
  res.json(loadSettings());
});

app.post('/v2/settings', auth(), (req, res) => {
  try {
    // Auf den gespeicherten Stand mergen und nur die bekannten Felder übernehmen: vorher
    // wurde der Body ungeprüft gespeichert — ein Body nur mit `downloads` setzte die
    // Export-Frist still auf den Standard zurück, Fremdfelder landeten mit in der Datei.
    // [EN] Merge onto saved state and only adopt known fields: previously
    // [EN] body was saved unvalidated — a body with only `downloads` silently reset
    // [EN] export retention to default, unknown fields landed in file.
    const body = req.body;
    if (!body || typeof body !== 'object' || Array.isArray(body)) return res.status(400).json({ error: 'Objekt erwartet' });
    const settings = loadSettings();
    for (const key of ['downloads', 'exports']) {
      const v = body[key];
      if (v === undefined) continue;
      if (!v || typeof v.autoDelete !== 'boolean') return res.status(400).json({ error: `${key}.autoDelete muss boolean sein` });
      if (!Number.isInteger(v.afterDays) || v.afterDays < 1 || v.afterDays > 365) return res.status(400).json({ error: `${key}.afterDays muss zwischen 1 und 365 liegen` });
      settings[key] = { autoDelete: v.autoDelete, afterDays: v.afterDays };
    }
    if (body.emoji !== undefined) {
      if (!body.emoji || typeof body.emoji.gravieren !== 'boolean') return res.status(400).json({ error: 'emoji.gravieren muss boolean sein' });
      settings.emoji = { gravieren: body.emoji.gravieren };
    }
    writeJsonAtomic(SETTINGS_FILE, settings);
    logger.log('Einstellungen gespeichert:', JSON.stringify(settings));
    addActivity('info', '⚙️ Einstellungen gespeichert', { status: 'info' });
    res.json({ success: true });
  } catch(e) {
    logger.error('Settings speichern Fehler:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Aktivitäts-Log (utils/activity.js) ───────────────────────────────────────
// [EN] ── Activity Log (utils/activity.js) ───────────────────────────────────────
app.get('/v2/activity', auth(), (req, res) => {
  res.json(loadActivity());
});

// ── Export: Dateien aus dem Browser entgegennehmen, Lauf-Nummer, status.txt ──────
// [EN] ── Export: Receive files from browser, run number, status.txt ─────────────
// Multer-Hinweis: req.body Felder die NACH der Datei kommen, sind hier
// noch nicht parsed. Daher Datum/Dateiname in /tmp speichern und im
// Handler verschieben — dann ist req.body garantiert vollständig.
// [EN] Multer note: req.body fields coming AFTER the file are not parsed yet here.
// [EN] Therefore store date/filename in /tmp and move in handler — then req.body is guaranteed complete.
const exportUpload = multer({
  dest: path.join(__dirname, 'tmp'),
  limits: { fileSize: 50 * 1024 * 1024 }
});

// Export-Datei hochladen (vom Browser nach Download)
// [EN] Upload export file (from browser after download)
app.post('/v2/export-upload', auth(), exportUpload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  // Jeder Abbruch räumt die hochgeladene Datei weg, bevor er antwortet.
  // [EN] Any abort clears the uploaded file before responding.
  const verwerfen = (status, body) => { try { fs.unlinkSync(req.file.path); } catch (_) {} return res.status(status).json(body); };
  try {
    // Fallback-Datum in BERLIN-Zeit (vorher Server-Lokalzeit — nach Mitternacht Berlin,
    // aber vor Mitternacht UTC wäre der Export sonst im Vortages-Ordner gelandet)
    // [EN] Fallback date in BERLIN time (previously server local time — after Berlin midnight,
    // [EN] but before UTC midnight, export would otherwise have landed in previous day folder)
    const rawDate = req.body.date || berlinDayBefore(0);
    const date = rawDate.replace(/[^0-9\-]/g, '');
    if (!isValidDateStr(date)) return verwerfen(400, { error: 'Ungültiges Datumsformat' });
    const filename = path.basename(req.body.filename || req.file.originalname);
    // Optionaler Unterordner pro Layout-Gruppe (gesäubert → kein Pfad-Traversal)
    // [EN] Optional subfolder per layout group (sanitized -> no path traversal)
    const group = sanitizeFolder(req.body.group || '');
    // Reklamation: eigener Tagesordner, darin ein Unterordner je Bestellnummer — dort
    // liegen die Kundendaten, die Gravurdateien eine Ebene tiefer im Unterordner des
    // Layouts (s. `unter` unten). Die Layout-Gruppe entfällt dabei, bei einer einzelnen
    // Bestellung wäre sie nur eine leere Zwischenebene.
    // [EN] Complaint: separate day folder, containing a subfolder per order number — there
    // [EN] reside customer data, engraving files one level deeper in layout subfolder
    // [EN] (see `unter` below). Layout group is omitted here; for a single order it would be an empty level.
    const rekla = _jaFlag(req.body.rekla);
    const reklaOrder = rekla ? _reklaNr(req.body) : '';
    // Testblatt: eigener Tagesordner, Layout-Gruppe bleibt als Unterebene erhalten.
    // [EN] Test sheet: separate day folder, layout group remains as sublevel.
    const test = _jaFlag(req.body.test);
    // Sonst: Nummer des Export-Laufs (s. /export-run) — 1 = Tagesordner, ab 2 der Nachbarordner
    // „<Tag> Lauf N". Über `rekla` (das Flag) trennen, NICHT über `reklaOrder` (die geprüfte Nummer):
    // ist die Nummer unbrauchbar, fiele die Gravurdatei sonst in den Tagesordner der PRODUKTION.
    // Vorlagen-Modus: fester Pfad exports/_Vorlage/<Ordner>/, KEIN Tagesordner und keine Lauf-Nummer —
    // die Ezcad-Vorlage liest diese Dateien beim Markieren neu ein („Dynamic file"), der Pfad muss über
    // Tage stabil bleiben.
    // [EN] Otherwise: export run number (see /export-run) — 1 = day folder, from 2 neighbor folder
    // [EN] "<Date> Lauf N". Separate via `rekla` flag, NOT via `reklaOrder` (validated number):
    // [EN] if number is unusable, engraving file would otherwise drop into PRODUCTION day folder.
    // [EN] Template mode: fixed path exports/_Vorlage/<folder>/, NO day folder and no run number —
    // [EN] Ezcad template re-reads these files during marking ("Dynamic file"), path must remain stable across days.
    const vorlage = sanitizeFolder(req.body.vorlage || '');
    const laufOrdner = vorlage ? '_Vorlage' : exportRunFolder(date, req.body.run, rekla, test);
    const dateDir = path.join(__dirname, 'public', 'exports', laufOrdner);
    // Eine zusätzliche Ebene unter der Gruppe, z.B. F02/Einzeln — getrennt von `group`, damit `group`
    // ein einzelner Ordnername bleibt. Mehrstufig erlaubt: JEDES Segment einzeln säubern und dann
    // zusammensetzen (sanitizeFolder würfe Pfadtrenner raus und verschmölze den Pfad zu einem Ordner).
    // Der startsWith-Check unten bleibt als zweite Absicherung.
    // [EN] An additional level under the group, e.g. F02/Einzeln — separated from `group` so `group`
    // [EN] remains a single folder name. Multi-level allowed: sanitize EACH segment individually and
    // [EN] assemble (sanitizeFolder would strip path separators and merge into one folder).
    // [EN] startsWith check below remains as secondary safeguard.
    const unter = String(req.body.unterordner || '')
      .split(/[\/\\]/).map(sanitizeFolder).filter(Boolean).join('/');
    // Reklamation „Alles ausprobieren": je Variante nur die Bitmaps, und nicht auf dem Netzlaufwerk
    // (soll nur ANZEIGEN) — sie gehen in den Zwischenspeicher src/tmp/rekla-varianten/. Sonst läge in
    // jedem Variantenordner eine lade-diesen-tag.bat mit einem Ziel, das es nicht gibt.
    // [EN] Complaint "Try everything": only bitmaps per variant, and not on network share
    // [EN] (only intended for DISPLAY) — they go into cache src/tmp/rekla-varianten/. Otherwise every
    // [EN] variant folder would contain a lade-diesen-tag.bat with non-existent target.
    if (rekla && /(^|\/)Varianten\/| Variante /.test(unter)) {
      if (!/^platz\d+\.bmp$/i.test(filename) || !reklaOrder) return verwerfen(200, { success: true, filename, uebersprungen: true });
      const vdir = path.join(REKLA_VARIANTEN, reklaOrder, sanitizeFolder(unter.replace(/^Varianten\//, '')));
      if (!vdir.startsWith(REKLA_VARIANTEN + path.sep)) return verwerfen(400, { error: 'Ungültiger Variantenordner' });
      fs.mkdirSync(vdir, { recursive: true });
      fs.renameSync(req.file.path, path.join(vdir, filename));
      return res.json({ success: true, filename, zwischenspeicher: true });
    }
    // Reklamations-Vorschau: alles in tmp/rekla-vorschau/<Nr>/[<Unterordner>/] statt aufs Netzlaufwerk.
    // [EN] Complaint preview: everything in tmp/rekla-vorschau/<Nr>/[<subfolder>/] instead of network share.
    if (rekla && reklaOrder && req.body.vorschau === '1') {
      const vdir = path.join(REKLA_VORSCHAU, reklaOrder, ...unter.split('/').filter(Boolean));
      if (!vdir.startsWith(path.join(REKLA_VORSCHAU, reklaOrder))) return verwerfen(400, { error: 'Ungültiger Vorschauordner' });
      fs.mkdirSync(vdir, { recursive: true });
      fs.renameSync(req.file.path, path.join(vdir, filename));
      return res.json({ success: true, filename, vorschau: true });
    }
    let dir = vorlage     ? path.join(dateDir, vorlage)
            : reklaOrder ? path.join(dateDir, reklaOrdnerName(reklaOrder))
            : group      ? path.join(dateDir, group)
            :              dateDir;
    // Auch in der Reklamation: <Tag> Reklamation/<Nr>/<Unterordner>/. Ohne diese Ebene
    // schrieben zwei Layouts derselben Bestellung (Mehr-Artikel, z.B. F02 V5 + V6) in
    // denselben Ordner und das zweite überschrieb platz1.bmp, .bat und vorschau.png des ersten.
    // [EN] Also in complaint: <Date> Reklamation/<Nr>/<subfolder>/. Without this level,
    // [EN] two layouts of same order (multi-item, e.g. F02 V5 + V6) would write to
    // [EN] same folder and second would overwrite platz1.bmp, .bat, and vorschau.png of first.
    if (unter && !vorlage) dir = path.join(dir, unter);
    // Defense-in-depth: Zielpfad muss innerhalb von exports/<date> bleiben
    // [EN] Defense-in-depth: destination path must remain inside exports/<date>
    if (!path.resolve(dir).startsWith(path.resolve(dateDir))) return verwerfen(400, { error: 'Ungültiger Gruppenname' });
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    // `neu=1` (manueller Export mit Namensmuster): vorhandene Datei NICHT überschreiben,
    // sondern _2, _3 … anhängen. „Bild1" aus dem Tageslauf gehört einer anderen Bestellung.
    // Nie für die Vorlage — dort MUSS überschrieben werden (feste Namen für Ezcad).
    // [EN] `neu=1` (manual export with naming pattern): DO NOT overwrite existing file,
    // [EN] but append _2, _3 ... "Bild1" from daily run belongs to different order.
    // [EN] Never for template — there it MUST overwrite (fixed names for Ezcad).
    let name = filename;
    if (req.body.neu === '1' && !vorlage && fs.existsSync(path.join(dir, name))) {
      const ext = path.extname(filename), base = filename.slice(0, filename.length - ext.length);
      let k = 2;
      while (fs.existsSync(path.join(dir, `${base}_${k}${ext}`))) k++;
      name = `${base}_${k}${ext}`;
    }
    const target = path.join(dir, name);
    fs.renameSync(req.file.path, target);
    // Arbeitsordner der Ezcad-Vorlage: festhalten, welcher Tag dort jetzt liegt (Ezcad-Reiter).
    // [EN] Working directory of Ezcad template: record which date resides there now (Ezcad tab).
    if (vorlage && /^platz1\.bmp$/i.test(name)) {
      try { vorlageCtl.merkeStand(vorlage, { tag: date, quelle: 'lauf' }); } catch (_) {}
    }
    logger.log('Export gespeichert:', name, '→', laufOrdner
      + (reklaOrder ? '/' + reklaOrdnerName(reklaOrder) : group ? '/' + group : '') + (unter && !vorlage ? '/' + unter : ''));
    res.json({ success: true, filename: name, group: group || undefined });
  } catch(e) {
    logger.error('Export Upload Fehler:', e.message);
    verwerfen(500, { error: e.message });
  }
});

// Export-Lauf eröffnen: liefert die Nummer, unter der DIESER Durchlauf ablegt.
// 1 = Tagesordner wie gewohnt, ab 2 der Nachbarordner "<Tag> Lauf N". Ohne das mischt
// eine Wiederholung ihre Dateien unter die des ersten Laufs und am Laser ist nicht mehr
// zu sehen, was neu ist — Reste des ersten Laufs würden ein zweites Mal graviert.
// [EN] Open export run: returns the number under which THIS run stores files.
// [EN] 1 = day folder as usual, from 2 neighbor folder "<Date> Lauf N". Without this,
// [EN] repeat runs mix files with first run, making it impossible to distinguish new files
// [EN] at the laser — leftovers of first run would be engraved a second time.
app.post('/v2/export-run', auth(), (req, res) => {
  try {
    const date = String(req.body?.date || '').replace(/[^0-9\-]/g, '');
    if (!isValidDateStr(date)) return res.status(400).json({ error: 'Ungültiges Datumsformat' });
    const exportsRoot = path.join(__dirname, 'public', 'exports');
    let dayFiles = [];
    // Den Tagesordner gibt es am ersten Lauf noch gar nicht → readdir wirft, das ist der Normalfall.
    // [EN] Day folder does not exist yet on first run -> readdir throws, which is normal.
    try { dayFiles = fs.readdirSync(path.join(exportsRoot, date)); } catch(_) {}
    if (dayFiles.length === 0) return res.json({ run: 1, folder: date });

    // Höchsten bereits vergebenen Lauf dieses Tages suchen. Der belegte Tagesordner
    // selbst zählt als Lauf 1, deshalb ist 1 der Startwert.
    // [EN] Find highest already assigned run for this day. Occupied day folder
    // [EN] itself counts as run 1, hence start value is 1.
    let root = [];
    try { root = fs.readdirSync(exportsRoot); } catch(_) {}
    const prefix = `${date} Lauf `;
    const maxRun = root.reduce((mx, name) => {
      if (!name.startsWith(prefix)) return mx;
      const n = Number(name.slice(prefix.length));
      return Number.isInteger(n) ? Math.max(mx, n) : mx;
    }, 1);

    const run = maxRun + 1;
    const folder = exportRunFolder(date, run);
    fs.mkdirSync(path.join(exportsRoot, folder), { recursive: true });
    logger.log(`Export-Lauf eröffnet: ${folder}`);
    res.json({ run, folder });
  } catch(e) {
    logger.error('export-run Fehler:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Status-Datei schreiben
// [EN] Write status file
app.post('/v2/export-status', auth(), (req, res) => {
  try {
    const { date, results } = req.body;
    if (!isValidDateStr(date)) return res.status(400).json({ error: 'Ungültiges Datumsformat' });
    if (!Array.isArray(results)) return res.status(400).json({ error: 'results muss ein Array sein' });
    // status.txt gehört in denselben Ordner wie die Dateien, die sie beschreibt — sonst
    // überschriebe der zweite Lauf die Bilanz des ersten. Bei einer Reklamation heißt das:
    // in den Ordner dieser einen Bestellung.
    // [EN] status.txt belongs in same folder as files it describes — otherwise
    // [EN] second run overwrites tally of first. For complaints: into folder of this single order.
    const rekla = _jaFlag(req.body.rekla);
    const reklaOrder = rekla ? _reklaNr(req.body) : '';
    // `test` MUSS mit wie beim Upload: sonst landete die Bilanz eines Testblatt-Laufs im Tagesordner
    // der Produktion und überschrieb dort die status.txt des echten Laufs.
    // [EN] `test` MUST accompany like upload: otherwise tally of test sheet run lands in production day folder
    // [EN] and overwrites real run's status.txt.
    const test = _jaFlag(req.body.test);
    const vorschauRekla = rekla && reklaOrder && (req.body.vorschau === '1' || req.body.vorschau === true);
    const dir = vorschauRekla ? path.join(REKLA_VORSCHAU, reklaOrder)
      : path.join(__dirname, 'public', 'exports', exportRunFolder(date, req.body.run, rekla, test), reklaOrdnerName(reklaOrder));
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    // `hinweis`-Einträge (Dropdowns: „Rückseite bezahlt, aber leer" …) sind weder Datei noch
    // Fehler — eigene Zeile in status.txt und ⚠ in der Übersicht (Typ info).
    // [EN] `hinweis` entries (dropdowns: "back paid, but empty" ...) are neither file nor
    // [EN] error — separate line in status.txt and ⚠ in overview (type info).
    const ok = results.filter(r => r.ok && !r.hinweis).length;
    const fail = results.filter(r => !r.ok).length;
    const hinweise = results.filter(r => r.hinweis).length;
    const now = berlinUhrzeit();
    const lines = [
      `Auto-Export vom ${date} um ${now} Uhr`,
      `Erfolgreich: ${ok} Dateien`,
      fail > 0 ? `Fehler: ${fail} Dateien` : null,
      hinweise > 0 ? `Hinweise: ${hinweise}` : null,
      '',
      ...results.map(r => r.hinweis ? `⚠ ${r.hinweis}`
        : r.ok ? `✅ ${r.file}`
        : `❌ ${r.layout}: ${r.error}`
      )
    ].filter(l => l !== null).join('\n');

    fs.writeFileSync(path.join(dir, 'status.txt'), lines, 'utf8');
    logger.log('Export-Status gespeichert:', date, ok + ' Dateien');
    const fehler = r => activityEntry('error', `❌ Export Fehler: ${r.layout}`, { status: 'error', layout: r.layout });
    // Reklamation: EIN Eintrag statt einem je Datei, die Vorschau (Laden, Nachbessern) nur Fehler — eine
    // V5-Reklamation sind 27 Dateien, Vorschau und Erstellen zusammen drängten die Downloads aus dem Log.
    // [EN] Complaint: ONE entry instead of one per file; preview (loading, adjusting) errors only — a
    // [EN] V5 complaint has 27 files; preview and creation combined would crowd downloads out of log.
    addActivities(rekla
      ? [...results.filter(r => !r.ok).map(fehler),
         ...(vorschauRekla ? [] : [...results.filter(r => r.hinweis).map(r => activityEntry('info', `⚠ ${r.hinweis}`, { status: 'info', layout: r.layout })),
                                   ...(ok ? [activityEntry('export', `🖨 Reklamation ${reklaAnzeige(reklaOrder)}: ${ok} Dateien erzeugt`, { status: 'done' })] : [])])]
      : results.map(r => r.hinweis
        ? activityEntry('info', `⚠ ${r.hinweis}`, { status: 'info', layout: r.layout })
        : r.ok ? activityEntry('export', `🖨 ${r.file} exportiert`, { status: 'done', layout: r.layout }) : fehler(r)));
    res.json({ success: true });
  } catch(e) {
    logger.error('Export-Status Fehler:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Reklamation: eine Bestellung neu laden, Layouts dafür exportieren, nachbessern ──
// [EN] ── Complaint: Reload an order, export layouts for it, adjust ──────────
// Amazon-JSON eines Artikelordners: Dateiname und Inhalt, sonst null (Regel: readOrders.artikelJsonName).
// [EN] Amazon JSON of an item folder: filename and content, otherwise null (rule: readOrders.artikelJsonName).
const artikelJson = (dir) => {
  let datei = null;
  try { datei = readOrders.artikelJsonName(fs.readdirSync(dir)); } catch (_) {}
  return datei ? { datei, daten: readJsonSafe(path.join(dir, datei), {}) } : null;
};

// Dateien einer Bestellung mit Web-URL und grober Einordnung. public/ hängt unter "/",
// die Pfade sind also direkt im Browser abrufbar. meta.json bleibt draußen — rein intern.
// [EN] Files of an order with web URL and rough classification. public/ mounted under "/",
// [EN] paths are directly accessible in browser. meta.json stays excluded — purely internal.
const listOrderFiles = (orderId) => {
  const dir = findOrderDir(orderId);
  if (!dir) return [];
  const out = [];
  const walk = (d, unter) => {
    // ASIN des Artikels (Amazon-JSON im selben Ordner): die Reklamation ordnet damit bei
    // Mehr-Artikel-Bestellungen jedem Foto-Layout sein Kundenfoto zu.
    // [EN] Item ASIN (Amazon JSON in same folder): complaint maps customer photo to
    // [EN] each photo layout in multi-item orders with this.
    const asin = String(artikelJson(d)?.daten.asin || '');
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      if (e.isDirectory()) { walk(path.join(d, e.name), `${unter}/${e.name}`); continue; }
      if (e.name === 'meta.json') continue;
      const art = /^bild-\d+\./i.test(e.name)          ? 'vorschau'
                : /\.json$/i.test(e.name)              ? 'daten'
                : /\.svg$/i.test(e.name)               ? 'vektor'
                : /\.(jpe?g|png|webp|bmp|gif)$/i.test(e.name) ? 'foto'
                :                                        'sonstige';
      out.push({ name: e.name, art, size: fs.statSync(path.join(d, e.name)).size,
                 url: encodeURI(`${unter}/${e.name}`), asin });
    }
  };
  // Ohne Bestellung: dieselbe URL-Form wie eine echte Bestellung (/<Tag>/<Nr>/…), s. REKLA_MANUELL
  // [EN] Without order: same URL format as real order (/<Date>/<Nr>/...), see REKLA_MANUELL
  const manuell = manuellMeta(orderId)?.manuell;
  walk(dir, manuell ? `/${manuell.tag}/${orderId}`
                    : '/' + path.relative(path.join(__dirname, 'public'), dir).split(path.sep).join('/'));
  // NUR Bilder ausliefern. SVG-Konturen und die Amazon-JSON sagen als Kachel nichts aus —
  // sie stehen weiterhin vollständig im Reklamations-Ordner, dort holt man sie bei Bedarf.
  // Kundenfoto zuerst und das größte zuoberst; danach wird am häufigsten gesucht.
  // [EN] ONLY serve images. SVG outlines and Amazon JSON convey nothing as thumbnail —
  // [EN] they still reside fully in complaint folder, retrieved there when needed.
  // [EN] Customer photo first and largest on top; searched most frequently.
  const rang = { foto: 0, vorschau: 1 };
  return out
    .filter(f => rang[f.art] !== undefined)
    .sort((a, b) => (rang[a.art] - rang[b.art]) || (b.size - a.size));
};

// Artikel der Bestellung in Klartext (Titel, ASIN, Menge) — die Reklamation zeigt damit,
// welcher Artikel zu welchem Layout gehört und welcher keins hat.
// [EN] Items of order in plaintext (title, ASIN, quantity) — complaint shows
// [EN] which item belongs to which layout and which has none.
const orderArtikel = (orderId) => {
  const dir = findOrderDir(orderId);
  if (!dir) return [];
  const aus = [];
  let ordner = [];
  try { ordner = fs.readdirSync(dir).filter(f => /^item-\d+$/.test(f)).sort((a, b) => a.localeCompare(b, 'de', { numeric: true })); } catch (_) {}
  for (const o of ordner) {
    try {
      const d = artikelJson(path.join(dir, o))?.daten;
      if (!d) continue;
      // Was der Kunde eingegeben hat (Textzeilen in Reihenfolge) und welche Schrift er wählte —
      // die Reklamation stellt das neben die gezeichnete Gravurdatei.
      // [EN] What customer entered (text lines in sequence) and chosen font —
      // [EN] complaint displays this beside the rendered engraving file.
      const texte = [], schriften = new Set();
      const geh = n => {
        if (!n || typeof n !== 'object') return;
        if (n.type === 'TextCustomization') texte.push({ feld: String(n.label || n.name || ''), wert: String(n.inputValue ?? '') });
        if (n.type === 'FontCustomization' && n.fontSelection?.family) schriften.add(String(n.fontSelection.family));
        (n.children || []).forEach(geh);
      };
      geh(d.customizationData);
      aus.push({ asin: String(d.asin || ''), titel: String(d.title || ''), menge: Number(d.quantity) || 1,
                 texte, schriften: [...schriften] });
    } catch (_) {}
  }
  return aus;
};

// Bestellordner in den Reklamations-Tagesordner spiegeln. Kopie, kein Verschieben: das
// Original unter public/<Kauftag>/ bleibt, wo jeder Filter es erwartet.
// [EN] Mirror order folder into complaint day folder. Copy, no move: original
// [EN] under public/<PurchaseDate>/ remains where every filter expects it.
const copyToReklaFolder = (orderId) => {
  const quelle = findOrderDir(orderId);
  if (!quelle) return null;
  const ziel = path.join(__dirname, 'public', 'exports',
    // dritter Parameter ist das rekla-FLAG, nicht die Nummer — beide Aufrufer haben
    // orderId vorher gegen ORDER_ID_RE geprüft, hier ist es also immer eine Reklamation.
    // [EN] 3rd param is rekla FLAG, not number — both callers validated
    // [EN] orderId against ORDER_ID_RE before, so it is always a complaint here.
    exportRunFolder(berlinDayBefore(0), null, true), reklaOrdnerName(orderId));
  fs.mkdirSync(ziel, { recursive: true });
  fs.cpSync(quelle, ziel, { recursive: true });
  return ziel;
};

// ── Reklamation: EINE Bestellung erneut laden ────────────────────────────────
// [EN] ── Complaint: Reload ONE order ─────────────────────────────────────────
// Bewusst synchron: eine einzelne Bestellung ist in Sekunden geladen, und der Bediener
// wartet ohnehin vor dem Bildschirm. Ein Hintergrundlauf plus Fortschritts-Polling wäre
// hier nur zusätzliche Mechanik ohne Nutzen.
// [EN] Deliberately synchronous: a single order loads in seconds, and operator waits
// [EN] in front of screen anyway. Background run plus progress polling would be unnecessary overhead.
app.post('/v2/reload-order', auth(), async (req, res) => {
  if (progress.running) return res.status(200).json({ message: 'already_running' });
  const orderId = String(req.body?.orderId || '').trim();
  if (!ORDER_ID_RE.test(orderId)) {
    return res.status(400).json({ error: 'Bestellnummer im Format 123-1234567-1234567 erwartet.' });
  }
  // 000-… ist eine Reklamation ohne Bestellung — Amazon kennt sie nicht (und der Download legte sonst
  // einen leeren Ordner unter public/<Tag>/ an).
  // [EN] 000-... is complaint without order — Amazon does not know it (and download would otherwise create
  // [EN] empty folder under public/<Date>/).
  if (MANUELL_RE.test(orderId)) return res.status(400).json({ error: 'Das ist eine Reklamation ohne Bestellung — bitte unter „Ohne Bestellung" bearbeiten.' });
  // progress.running setzen, damit ein gleichzeitig feuernder Zeitplan-Eintrag sich
  // sauber zurückzieht statt mitten in die Queue zu greifen.
  // [EN] Set progress.running so concurrent schedule entry gracefully yields
  // [EN] instead of interfering with the queue.
  progress.running = true;
  progress.phase = 'fetch';
  try {
    const r = await amazon.reloadSingleOrder(orderId);
    if (r.error) {
      addActivity('error', `❌ Reklamation ${orderId}: ${r.error}`, { status: 'error' });
      return res.status(400).json({ error: r.error });
    }
    // ohne progressRef: kein UI-Fortschritt nötig. Ergebnis PRÜFEN — steigt die
    // Verarbeitung aus (anderer Lauf aktiv, Abbruch), liegt die Bestellung noch
    // unangetastet in der Queue und darf nicht als geladen gemeldet werden.
    // [EN] without progressRef: no UI progress needed. VERIFY result — if processing
    // [EN] aborts (other run active, cancelled), order remains untouched in queue
    // [EN] and must not be reported as loaded.
    const q = await amazon.manageProcessQueue(null);
    if (!q?.ran || q.cancelled) {
      const grund = q?.cancelled ? 'der Lauf wurde abgebrochen' : 'es läuft bereits eine Verarbeitung';
      addActivity('error', `❌ Reklamation ${orderId} nicht geladen — ${grund}`, { status: 'error' });
      return res.status(409).json({ error: `Bestellung ${orderId} liegt in der Warteschlange, wurde aber nicht verarbeitet (${grund}). Bitte gleich noch einmal versuchen.` });
    }
    // Download gescheitert? Dann liegt die Queue-Datei noch da (Versuch gezählt). NICHT für den nächsten
    // Lauf liegen lassen: der holte die Bestellung in SEINE Session, und der Tageslauf gravierte die
    // Reklamation mit. Ohne alten Bestellordner wäre „geladen" außerdem gelogen — ab ~4 Wochen hat Amazon
    // die Gravurdaten gelöscht (der Link kommt noch, der Download antwortet 404), dann hilft nur
    // „Ohne Bestellung".
    // [EN] Download failed? Then queue file remains (attempt counted). DO NOT leave for next
    // [EN] run: it would pull order into ITS session, and daily run would engrave complaint.
    // [EN] Without old order folder, "loaded" would also be false — after ~4 weeks Amazon deletes
    // [EN] customization data (link still exists, download returns 404); only "Without order" helps.
    const queueRest = path.join(__dirname, 'queue', `${orderId}.json`);
    let hinweis = '';
    if (fs.existsSync(queueRest)) {
      try { fs.rmSync(queueRest, { force: true }); } catch (_) {}
      if (!findOrderDir(orderId)) {
        const tage = Math.floor((Date.now() - Date.parse(r.purchaseDate)) / 86400000);
        const grund = tage >= 28 ? `Amazon hat die Gravurdaten nicht mehr (Kauf vor ${tage} Tagen) — bitte unter „Ohne Bestellung" anlegen.`
                                 : 'Download fehlgeschlagen — bitte gleich noch einmal versuchen.';
        addActivity('error', `❌ Reklamation ${orderId}: ${grund}`, { status: 'error' });
        return res.status(422).json({ error: `Bestellung ${orderId}: ${grund}` });
      }
      hinweis = 'Neu laden fehlgeschlagen — gezeigt wird der zuletzt geladene Stand.';
    }
    // NICHT mehr sofort in den Reklamations-Ordner spiegeln (bis 09.10.2026): der Ordner auf
    // dem Netzlaufwerk entsteht erst mit „Reklamation erstellen" (/export-single ohne vorschau).
    // Die Vorschau dieser Bestellung frisch beginnen.
    // [EN] NO LONGER mirror immediately into complaint folder (until Oct 9, 2026): folder on
    // [EN] network share created only upon "Create complaint" (/export-single without preview).
    // [EN] Start this order's preview cleanly.
    reklaZwischenspeicherLeeren(orderId, REKLA_VORSCHAU);
    addActivity('download', `↻ Reklamation ${orderId} neu geladen (${r.itemCount} Artikel)${hinweis ? ' — ' + hinweis : ''}`, { status: 'done' });
    res.json({ ok: true, orderId, purchaseDate: r.purchaseDate, itemCount: r.itemCount, hinweis,
               asins: r.asins, artikel: orderArtikel(orderId), files: listOrderFiles(orderId) });
  } catch (e) {
    logger.error('reload-order fehlgeschlagen:', e.message);
    res.status(500).json({ error: e.message });
  } finally {
    progress.running = false;
    progress.phase = 'done';
  }
});

// Reklamation: ein oder MEHRERE Layouts für EINE Bestellung exportieren (S01 braucht
// PDF-Foto + DXF-Rückseite, F02 V5 Foto + _Text). Läuft über dieselbe Puppeteer-Strecke
// wie der Auto-Export — dadurch gelten Gruppen-Ordner, Lauf-Nummer, status.txt und
// Upload unverändert, statt eine zweite Export-Strecke zu pflegen.
// [EN] Complaint: export one or MULTIPLE layouts for ONE order (S01 needs
// [EN] PDF photo + DXF back, F02 V5 photo + _Text). Uses same Puppeteer pipeline
// [EN] as auto-export — preserving group folders, run numbers, status.txt and
// [EN] uploads unchanged without maintaining a second export pipeline.
app.post('/v2/export-single', auth(), (req, res) => {
  const orderId = String(req.body?.orderId || '').trim();
  // Zeilenumbruch trennt die Namen in der Export-URL und darf deshalb in keinem Namen stehen.
  // [EN] Newline separates names in export URL and must therefore not occur in any name.
  const roheNamen = Array.isArray(req.body?.layouts) ? req.body.layouts : [];
  const layouts = [...new Set(roheNamen.map(n => String(n || '').trim()).filter(n => n && !/[\r\n]/.test(n)))];
  if (!ORDER_ID_RE.test(orderId)) return res.status(400).json({ error: 'Ungültige Bestellnummer.' });
  if (!layouts.length) return res.status(400).json({ error: 'Kein Layout gewählt.' });
  try {
    // Kundendaten mit in den Reklamations-Ordner kopieren, damit dort alles zur Bestellung beieinander
    // liegt (Amazon-JSON, Kundenfoto, Vorschaubilder, dann die Gravurdatei). Kopie, kein Verschieben;
    // idempotent, weil /export-single auch ohne vorheriges Laden kommen kann.
    // Vorschau (Laden, Knöpfe, „Alles ausprobieren"): nichts auf dem Netzlaufwerk — erst „Reklamation
    // erstellen" (vorschau=false) legt den Ordner samt Kundendaten an.
    // [EN] Copy customer data into complaint folder so everything for the order sits together
    // [EN] (Amazon JSON, customer photo, previews, then engraving file). Copy, not move;
    // [EN] idempotent, because /export-single can also be called without prior load.
    // [EN] Preview (loading, buttons, "Try everything"): nothing on network share — only "Create
    // [EN] complaint" (vorschau=false) creates folder including customer data.
    const vorschau = req.body?.vorschau === true || (Array.isArray(req.body?.varianten) && req.body.varianten.length > 0);
    if (!vorschau) {
      const ziel = copyToReklaFolder(orderId);
      if (ziel) logger.log(`Reklamation ${orderId}: Kundendaten kopiert → ${path.relative(path.join(__dirname, 'public', 'exports'), ziel)}`);
      else logger.warn(`Reklamation ${orderId}: Bestellordner nicht gefunden — nur die Gravurdatei wird abgelegt.`);
    }
    // Laser-Werte je Layout aus der Reklamation (Nachbessern, Varianten). Streng gefiltert: nur
    // einfache Werte unter harmlosen Namen, damit nichts Beliebiges in die Export-URL wandert.
    // Fehlen sie, exportiert der Lauf den gespeicherten Layout-Stand.
    // [EN] Laser values per layout from complaint (adjusting, variants). Strictly filtered: only
    // [EN] simple values under safe names to prevent arbitrary injection into export URL.
    // [EN] If omitted, export run uses stored layout state.
    const reinLaser = roh => {
      if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return null;
      const rein = {};
      for (const [k, v] of Object.entries(roh)) {
        if (!/^[a-zA-Z][a-zA-Z0-9]{0,30}$/.test(k)) continue;
        if (typeof v === 'number' && Number.isFinite(v)) rein[k] = v;
        else if (typeof v === 'boolean') rein[k] = v;
        else if (typeof v === 'string' && v.length <= 60) rein[k] = v;
      }
      return Object.keys(rein).length ? rein : null;
    };
    // Foto-Nachbesserung je Layout (Stufe „zu hell/zu dunkel"), nur für gewählte Layouts.
    // [EN] Photo adjustment per layout ("too bright/too dark" level), only for selected layouts.
    const je = {};
    if (req.body?.laserJe && typeof req.body.laserJe === 'object') {
      for (const n of layouts) { const r = reinLaser(req.body.laserJe[n]); if (r) je[n] = r; }
    }
    // Gesichter heller/dunkler: { Bilddatei: { g: [[x, y, b, h], …], gesicht, rest } } — Kästen als
    // Anteil 0…1 im Kundenfoto (aus der Gesichtserkennung), Faktoren für Gesicht und Rest.
    // [EN] Faces brighter/darker: { imageFile: { g: [[x, y, b, h], ...], gesicht, rest } } — boxes as
    // [EN] ratio 0...1 in customer photo (from face detection), factors for face and remainder.
    const reinFokus = roh => {
      const aus = {};
      if (!roh || typeof roh !== 'object' || Array.isArray(roh)) return aus;
      for (const [datei, f] of Object.entries(roh)) {
        if (!/^[\w.-]{1,80}\.(jpe?g|png|webp)$/i.test(datei) || !f || !Array.isArray(f.g)) continue;
        const g = f.g.slice(0, 12).filter(k => Array.isArray(k) && k.length === 4
          && k.every(v => typeof v === 'number' && v >= -0.2 && v <= 1.2)).map(k => k.map(v => Math.round(v * 1e4) / 1e4));
        const faktor = (v, lo, hi) => typeof v === 'number' && v >= lo && v <= hi ? v : 1;
        if (g.length) aus[datei] = { g, gesicht: faktor(f.gesicht, 0.3, 2), rest: faktor(f.rest, 0.1, 1.5) };
      }
      return aus;
    };
    const fokus = reinFokus(req.body?.fokus);
    // „Alles ausprobieren": mehrere Fassungen in EINEM Lauf, je Variante ein eigener Unterordner.
    // [EN] "Try everything": multiple versions in ONE run, each variant gets its own subfolder.
    const varianten = Array.isArray(req.body?.varianten) ? req.body.varianten.slice(0, 16)
      .filter(v => v && /^[a-z0-9-]{1,24}$/.test(String(v.k || '')))
      .map(v => ({ k: v.k, werte: reinLaser(v.werte) || {}, fokus: reinFokus(v.fokus) })) : [];
    const zeit = Date.now();
    if (varianten.length) reklaZwischenspeicherLeeren(orderId, REKLA_VARIANTEN);
    // Kurze Verzögerung: der Bediener wartet vor dem Bildschirm (vorher 3 s fest je Knopfdruck).
    // [EN] Short delay: operator waits before screen (previously 3s fixed per click).
    scheduler.schedulePuppeteerExport(500, `Reklamation ${orderId}`, 0, {
      onlyOrder: orderId, onlyLayout: layouts.join('\n'),
      laserJe: Object.keys(je).length ? JSON.stringify(je) : undefined,
      fokus: Object.keys(fokus).length ? JSON.stringify(fokus) : undefined,
      varianten: varianten.length ? JSON.stringify(varianten) : undefined,
      vorschau: vorschau ? '1' : undefined,
    });
    if (!vorschau) addActivity('export', `🖨 Reklamation ${reklaAnzeige(orderId)}: ${layouts.length > 1 ? 'Layouts' : 'Layout'} ${layouts.join(' + ')} ${layouts.length > 1 ? 'werden' : 'wird'} erzeugt`, { status: 'running' });
    // `zeit` (Serveruhr): die Foto-Karten warten, bis status.txt jünger ist als das hier.
    // [EN] `zeit` (server clock): photo cards wait until status.txt is newer than this.
    res.json({ message: 'started', zeit });
  } catch (e) {
    logger.error('export-single fehlgeschlagen:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Reklamation: Foto-Gravur nachbessern (08.10.2026) ────────────────────────
// [EN] ── Complaint: Adjust photo engraving (Oct 8, 2026) ────────────────────
// Was die Reklamation dieser Bestellung heute an Bitmaps erzeugt hat, je Unterordner
// (= Vorlage-Ordner des Layouts), dazu der Zeitpunkt der letzten status.txt — daran
// erkennen die Foto-Karten, dass ein angestoßener Export fertig ist.
// [EN] Bitmaps generated by complaint for this order today per subfolder
// [EN] (= template folder of layout), plus timestamp of latest status.txt — photo cards
// [EN] use this to recognize when a triggered export has finished.
app.get('/v2/rekla/bilder', auth(), (req, res) => {
  const orderId = String(req.query.orderId || '').trim();
  if (!ORDER_ID_RE.test(orderId)) return res.status(400).json({ error: 'Ungültige Bestellnummer.' });
  const rel = `${exportRunFolder(berlinDayBefore(0), null, true)}/${reklaOrdnerName(orderId)}`;
  // quelle=vorschau: der Zwischenspeicher der Vorschau (Karten in ③); sonst der echte Ordner.
  // [EN] quelle=vorschau: preview cache (cards in step ③); otherwise actual folder.
  const vorschau = req.query.quelle === 'vorschau';
  const dir = vorschau ? path.join(REKLA_VORSCHAU, orderId) : path.join(__dirname, 'public', 'exports', rel);
  const urlVon = r => vorschau ? `/rekla/vorschaudatei/${orderId}/${r.split('/').map(encodeURIComponent).join('/')}`
                               : encodeURI(`/exports/${rel}/${r}`);
  let status = 0;
  try { status = fs.statSync(path.join(dir, 'status.txt')).mtimeMs; } catch (_) {}
  const ordner = [];
  // Layout-Ordner direkt unter der Bestellung, dazu „Varianten/<…>" aus „Alles ausprobieren".
  // [EN] Layout folders directly under order, plus "Varianten/<...>" from "Try everything".
  const liste = d => { try { return fs.readdirSync(d, { withFileTypes: true }); } catch (_) { return []; } };
  const kandidaten = [];
  for (const e of liste(dir)) {
    if (!e.isDirectory() || /^item-\d+$/.test(e.name)) continue;
    if (e.name !== 'Varianten') kandidaten.push(e.name);
  }
  for (const name of kandidaten) {
    const d = path.join(dir, name);
    const dateien = fs.readdirSync(d).filter(f => fs.statSync(path.join(d, f)).isFile()).map(f => {
      const st = fs.statSync(path.join(d, f));
      return { name: f, url: urlVon(`${name}/${f}`), groesse: st.size, zeit: st.mtimeMs };
    });
    const plaetze = dateien.filter(f => /^platz\d+\.bmp$/i.test(f.name) && f.groesse > 1024)
      .map(f => ({ nr: Number(f.name.match(/\d+/)[0]), url: f.url, groesse: f.groesse, zeit: f.zeit }))
      .sort((a, b) => a.nr - b.nr);
    if (plaetze.length) ordner.push({ ordner: name, pfad: vorschau ? null : `${rel}/${name}`, plaetze, dateien,
                                      vorlage: dateien.some(f => f.name === 'lade-diesen-tag.bat') });
  }
  // Probeversionen aus „Alles ausprobieren" (Zwischenspeicher, nicht auf dem Netzlaufwerk)
  // [EN] Trial versions from "Try everything" (cache, not on network share)
  for (const v of vorschau ? liste(path.join(REKLA_VARIANTEN, orderId)) : []) {
    if (!v.isDirectory()) continue;
    const d = path.join(REKLA_VARIANTEN, orderId, v.name);
    const plaetze = liste(d).filter(f => f.isFile() && /^platz\d+\.bmp$/i.test(f.name)).map(f => {
      const st = fs.statSync(path.join(d, f.name));
      return { nr: Number(f.name.match(/\d+/)[0]), groesse: st.size, zeit: st.mtimeMs,
               url: `/rekla/variante/${orderId}/${encodeURIComponent(v.name)}/${f.name}` };
    }).filter(p => p.groesse > 1024).sort((a, b) => a.nr - b.nr);
    if (plaetze.length) ordner.push({ ordner: `Varianten/${v.name}`, plaetze, dateien: [], vorlage: false });
  }
  // Alle Dateien dieser Reklamation zum Herunterladen — ohne Kundendaten (item-*), ohne die
  // Probefassungen (Varianten/), ohne status.txt und .bat.
  // [EN] All files of this complaint for download — excluding customer data (item-*), excluding
  // [EN] trial versions (Varianten/), excluding status.txt and .bat.
  const alle = [];
  for (const e of liste(dir)) {
    if (/^item-\d+$/.test(e.name) || e.name === 'Varianten') continue;
    const sub = e.isDirectory() ? liste(path.join(dir, e.name)).filter(f => f.isFile()).map(f => `${e.name}/${f.name}`) : [e.name];
    for (const r of sub) {
      if (/(^|\/)status\.txt$|\.bat$/i.test(r)) continue;
      let groesse = 0;
      try { groesse = fs.statSync(path.join(dir, r)).size; } catch (_) {}
      alle.push({ name: r, url: urlVon(r), groesse });
    }
  }
  // Hinweise des letzten Laufs (Ersatzschrift, gestauchter Text …) aus status.txt: Zeilen „⚠ …".
  // [EN] Notes from last run (substitute font, condensed text ...) from status.txt: lines "⚠ ...".
  let hinweise = [];
  try { hinweise = fs.readFileSync(path.join(dir, 'status.txt'), 'utf8').split('\n').filter(z => z.startsWith('⚠ ')).map(z => z.slice(2).trim()); } catch (_) {}
  res.json({ status, ordner, alle, hinweise });
});

// Dateien der Reklamations-Vorschau ausliefern (nur lesen, Pfad bleibt im Ordner der Bestellung).
// [EN] Serve complaint preview files (read-only, path stays within order folder).
app.get('/v2/rekla/vorschaudatei/:orderId/*', auth(), (req, res) => {
  const { orderId } = req.params;
  if (!ORDER_ID_RE.test(orderId)) return res.status(400).end();
  const basis = path.join(REKLA_VORSCHAU, orderId);
  const f = path.join(basis, ...String(req.params[0] || '').split('/').filter(t => t && t !== '..'));
  if (!f.startsWith(basis + path.sep) || !fs.existsSync(f) || !fs.statSync(f).isFile()) return res.status(404).end();
  res.set('Cache-Control', 'no-store');
  res.sendFile(f);
});

// PDF der Reklamation als Vorschaubild (Seite 1, pdftoppm) — zwischengespeichert nach Pfad+Zeit.
// [EN] PDF of complaint as preview image (page 1, pdftoppm) — cached by path + time.
const REKLA_PDFBILD = path.join(__dirname, 'tmp', 'rekla-pdfbild');
app.get('/v2/rekla/pdfbild', auth(), (req, res) => {
  const orderId = String(req.query.orderId || '').trim(), datei = String(req.query.datei || '');
  if (!ORDER_ID_RE.test(orderId) || !/\.pdf$/i.test(datei) || datei.includes('..')) return res.status(400).end();
  const basis = req.query.quelle === 'vorschau' ? path.join(REKLA_VORSCHAU, orderId)
    : path.join(__dirname, 'public', 'exports', exportRunFolder(berlinDayBefore(0), null, true), reklaOrdnerName(orderId));
  const quelle = path.join(basis, datei);
  if (!quelle.startsWith(basis + path.sep) || !fs.existsSync(quelle)) return res.status(404).end();
  const st = fs.statSync(quelle);
  const name = crypto.createHash('sha1').update(quelle + '|' + st.mtimeMs + '|110').digest('hex').slice(0, 16);
  const ziel = path.join(REKLA_PDFBILD, name);
  if (fs.existsSync(ziel + '.png')) { res.set('Cache-Control', 'no-store'); return res.sendFile(ziel + '.png'); }
  fs.mkdirSync(REKLA_PDFBILD, { recursive: true });
  execFile('pdftoppm', ['-png', '-r', '110', '-f', '1', '-l', '1', '-singlefile', quelle, ziel],
    { timeout: 30000 }, err => {
      if (err || !fs.existsSync(ziel + '.png')) return res.status(500).json({ error: 'PDF nicht lesbar' });
      res.set('Cache-Control', 'no-store');
      res.sendFile(ziel + '.png');
    });
});

// Probeversionen ausliefern (nur lesen, Namen streng geprüft).
// [EN] Serve trial versions (read-only, strictly verified names).
app.get('/v2/rekla/variante/:orderId/:ordner/:datei', auth(), (req, res) => {
  const { orderId, ordner, datei } = req.params;
  if (!ORDER_ID_RE.test(orderId) || !/^platz\d+\.bmp$/i.test(datei)) return res.status(400).end();
  const f = path.join(REKLA_VARIANTEN, orderId, sanitizeFolder(ordner), datei);
  if (!f.startsWith(REKLA_VARIANTEN + path.sep) || !fs.existsSync(f)) return res.status(404).end();
  res.set('Cache-Control', 'no-store');
  res.sendFile(f);
});

// Urteil des Mitarbeiters je Nachbesserung — daraus soll später die Automatik lernen.
// [EN] Employee feedback per adjustment — intended for future automatic learning.
const REKLA_URTEILE = path.join(config.datenDir, 'rekla-urteile.json');
app.post('/v2/rekla/urteil', auth(), (req, res) => {
  const b = req.body || {};
  const orderId = String(b.orderId || '').trim();
  if (!ORDER_ID_RE.test(orderId)) return res.status(400).json({ error: 'Ungültige Bestellnummer.' });
  if (!['gut', 'schlecht'].includes(b.urteil)) return res.status(400).json({ error: 'Urteil fehlt.' });
  try {
    const liste = readJsonSafe(REKLA_URTEILE, []);
    liste.push({ zeit: new Date().toISOString(), orderId, layout: String(b.layout || '').slice(0, 80),
                 stufe: Number(b.stufe) || 0, kanten: Number(b.kanten) || 0, sprenkel: b.sprenkel === true, gesicht: Number(b.gesicht) || 0,
                 // „Als Foto/Grafik rechnen" und was die Pipeline erkannt hatte
                 // [EN] "Calculate as photo/graphic" and what pipeline detected
                 als: ['foto', 'grafik'].includes(b.als) ? b.als : '', erkannt: ['foto', 'grafik', 'logo'].includes(b.erkannt) ? b.erkannt : '',
                 urteil: b.urteil });
    writeJsonAtomic(REKLA_URTEILE, liste);
    res.json({ ok: true, anzahl: liste.length });
  } catch (e) {
    logger.error('rekla/urteil fehlgeschlagen:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// ── Reklamation ohne Bestellung: Auftrag anlegen, für den Export liefern, Fotos ausliefern ──
// [EN] ── Complaint without order: Create job, supply for export, serve photos ───────
// Der Editor schickt Layout, Texte (Index = Gravur-Nummer − 1), Schrift, Dropdown-Antworten und je
// Foto die Platzierung, die er selbst ausgerechnet hat (flächenfüllend, mittig, s. _rmPlatz). Daraus
// entsteht eine Bestell-JSON in Amazons Form: die Textzeilen in EINEM eigenen Container („Texteingabe
// N" = Gravur N — den Namen kennt keine Slot-Tabelle, also zählt _textGruppen ab 1), je Foto eine
// PlacementContainerCustomization mit buyerPlacement, Dropdowns als OptionCustomization.
// [EN] Editor sends layout, texts (index = engraving number - 1), font, dropdown answers, and per
// [EN] photo the placement calculated by Editor (fill area, centered, see _rmPlatz). From this,
// [EN] an order JSON in Amazon's format is created: text lines in ONE separate container ("Texteingabe
// [EN] N" = engraving N — no slot table knows this name, so _textGruppen counts from 1), per photo a
// [EN] PlacementContainerCustomization with buyerPlacement, dropdowns as OptionCustomization.
const manuellUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024, files: 6, fieldSize: 256 * 1024 } });
const bildArt = (b) => (b && b.length > 8 && b[0] === 0xff && b[1] === 0xd8 ? 'jpg'
  : b && b.length > 8 && b.readUInt32BE(0) === 0x89504e47 ? 'png' : null);
const neueManuellNr = () => {
  for (;;) {
    const t = String(Date.now()) + Math.floor(Math.random() * 10);   // 14 Ziffern
    // [EN] 14 digits
    const nr = `000-${t.slice(0, 7)}-${t.slice(7, 14)}`;
    if (!fs.existsSync(path.join(REKLA_MANUELL, nr))) return nr;
  }
};
// Ordnername schon heute vergeben — als Reklamations-Ordner oder von einem anderen Auftrag ohne Bestellung?
// Andere Aufträge zählen unabhängig vom Anlagetag: exportiert wird immer in den Ordner von HEUTE, ein
// gestern angelegter „Müller“ landete sonst heute im selben Ordner wie ein neuer (bleiben 7 Tage liegen).
// [EN] Folder name already taken today — as complaint folder or by another job without order?
// [EN] Other jobs count regardless of creation day: export always targets TODAY's folder; a "Müller"
// [EN] created yesterday would otherwise land today in same folder as new one (retained for 7 days).
const manuellOrdnerBelegt = (ordner, tag, eigeneNr) => {
  if (fs.existsSync(path.join(__dirname, 'public', 'exports', exportRunFolder(tag, null, true), ordner))) return true;
  let nrn = [];
  try { nrn = fs.readdirSync(REKLA_MANUELL).filter(n => MANUELL_RE.test(n) && n !== eigeneNr); } catch (_) {}
  return nrn.some(n => manuellMeta(n)?.manuell?.ordner === ordner);
};
const manuellKundendaten = ({ texte, schrift, fragen, bilder }) => {
  const kinder = fragen.map(q => ({ type: 'OptionCustomization', name: q.frage, label: q.frage,
                                    optionSelection: { name: q.wert, label: q.wert } }));
  if (texte.length) kinder.push({ type: 'ContainerCustomization', name: 'Ohne Bestellung', label: 'Ohne Bestellung', children: [
    { type: 'FontCustomization', name: 'Schriftart', label: 'Schriftart', fontSelection: { family: schrift } },
    ...texte.map((t, i) => ({ type: 'PlacementContainerCustomization', name: `Texteingabe ${i + 1}`, label: `Texteingabe ${i + 1}`,
      children: [{ type: 'TextCustomization', name: `Texteingabe ${i + 1}`, label: `Gravur ${i + 1}`, inputValue: t }] })),
  ] });
  for (const b of bilder) {
    const p = b.platz;
    kinder.push({ type: 'PlacementContainerCustomization', name: `Bild ${b.nr}`, label: `Bild ${b.nr}`,
      position: { x: 0, y: 0 }, dimension: { width: p.w, height: p.h },
      buyerPlacement: { position: { x: p.x, y: p.y }, dimension: { width: p.bw, height: p.bh },
                        scale: { scaleX: p.s, scaleY: p.s }, angleOfRotation: p.winkel },
      children: [{ type: 'ImageCustomization', name: `Bild ${b.nr}`, label: `Bild ${b.nr}`, image: { imageName: b.datei } }] });
  }
  return { type: 'PageContainerCustomization', name: '', label: '', children: kinder };
};

app.post('/v2/rekla/manuell', auth(), (req, res, weiter) => manuellUpload.any()(req, res, err => (err
  ? res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Bild zu groß (höchstens 25 MB).' : err.message })
  : weiter())), (req, res) => {
  let a;
  try { a = JSON.parse(String(req.body?.auftrag || '')); } catch (_) { a = null; }
  if (!a || typeof a !== 'object' || Array.isArray(a)) return res.status(400).json({ error: 'Auftrag unlesbar.' });
  const layout = String(a.layout || '').trim().slice(0, 120);
  if (!layout) return res.status(400).json({ error: 'Kein Layout gewählt.' });
  const asin = String(a.asin || '').trim().toUpperCase();
  if (asin && !asinCheck.ASIN_RE.test(asin)) return res.status(400).json({ error: 'Ungültige ASIN.' });
  const texte = (Array.isArray(a.texte) ? a.texte : []).slice(0, 20).map(t => String(t ?? '').replace(/\r/g, '').slice(0, 300));
  while (texte.length && !texte[texte.length - 1].trim()) texte.pop();
  const schrift = String(a.schrift || '').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, 60) || 'Arial';
  const fragen = (Array.isArray(a.fragen) ? a.fragen : []).slice(0, 12)
    .map(q => ({ frage: String(q?.frage || '').trim().slice(0, 200), wert: String(q?.wert || '').trim().slice(0, 200) }))
    .filter(q => q.frage && q.wert);
  const zahl = (v, lo, hi) => typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi;
  const bilder = [];
  for (const b of (Array.isArray(a.bilder) ? a.bilder : []).slice(0, 6)) {
    const nr = Number(b?.nr), p = b?.platz || {};
    if (!Number.isInteger(nr) || nr < 1 || nr > 6 || bilder.some(x => x.nr === nr)) continue;
    const datei = (req.files || []).find(f => f.fieldname === `bild${nr}`);
    if (!datei) continue;
    const art = bildArt(datei.buffer);
    if (!art) return res.status(400).json({ error: `Bild ${nr}: bitte ein JPG- oder PNG-Foto.` });
    if (!(zahl(p.w, 1, 1e5) && zahl(p.h, 1, 1e5) && zahl(p.x, -1e6, 1e6) && zahl(p.y, -1e6, 1e6)
          && zahl(p.bw, 1, 1e5) && zahl(p.bh, 1, 1e5) && zahl(p.s, 1e-6, 1e4) && [0, 90, 180, 270].includes(p.winkel))) {
      return res.status(400).json({ error: `Bild ${nr}: Platzierung unvollständig.` });
    }
    bilder.push({ nr, art, buffer: datei.buffer, datei: `foto-${nr}.${art}`, platz: p });
  }
  bilder.sort((x, y) => x.nr - y.nr);
  if (!texte.some(t => t.trim()) && !bilder.length) return res.status(400).json({ error: 'Bitte Text eintragen oder ein Bild wählen.' });

  try {
    // Bestehenden Auftrag ändern (gleiche Nummer, gleicher Ordner) — sonst neu. Steht im Namen eine
    // Amazon-Nummer (alte Bestellung), trägt die 000-Nummer deren Ziffern: Nummernfelder auf dem Blatt
    // zeigen dann dieselben letzten 7 Ziffern wie die echte Bestellung.
    // [EN] Modify existing job (same number, same folder) — otherwise new. If name contains an
    // [EN] Amazon number (old order), the 000-number takes its digits: number fields on sheet
    // [EN] then show the same last 7 digits as real order.
    let orderId = String(a.orderId || '').trim();
    if (!(MANUELL_RE.test(orderId) && manuellMeta(orderId))) orderId = '';
    const name = String(a.name || '').trim().slice(0, 60);
    if (!orderId) {
      const amz = name.match(/\d{3}-(\d{7})-(\d{7})/);
      orderId = amz ? `000-${amz[1]}-${amz[2]}` : neueManuellNr();
    }
    const vorher = manuellMeta(orderId);
    const tag = vorher?.manuell?.tag || berlinDayBefore(0);
    let ordner = vorher?.manuell && vorher.manuell.name === name ? vorher.manuell.ordner : '';
    if (!ordner) {
      // Kein Punkt am Anfang (versteckt, „." = der Tagesordner selbst) und keiner am Ende (Windows schneidet ihn ab)
      // [EN] No dot at beginning (hidden, "." = day folder itself) and none at end (Windows strips it)
      const basis = sanitizeFolder(name).replace(/^[.\s]+|[.\s]+$/g, '') || orderId;
      ordner = basis;
      for (let k = 2; manuellOrdnerBelegt(ordner, berlinDayBefore(0), orderId) && k < 100; k++) ordner = `${basis} ${k}`;
    }
    // Erst vollständig daneben schreiben, dann tauschen — ein Export liest nie einen halben Auftrag.
    // [EN] Write completely alongside first, then swap — export never reads a partial job.
    const ziel = path.join(REKLA_MANUELL, orderId), neu = ziel + '.neu';
    fs.rmSync(neu, { recursive: true, force: true });
    const item = path.join(neu, 'item-1');
    fs.mkdirSync(item, { recursive: true });
    for (const b of bilder) fs.writeFileSync(path.join(item, b.datei), b.buffer);
    const jetzt = new Date().toISOString();
    writeJsonAtomic(path.join(item, `${orderId.slice(-7)}.json`), {
      asin, title: `Ohne Bestellung: ${layout}`, quantity: 1, customizationData: manuellKundendaten({ texte, schrift, fragen, bilder }),
    });
    writeJsonAtomic(path.join(item, 'meta.json'), {
      purchaseDate: vorher?.purchaseDate || jetzt, asin: asin || null,
      manuell: { name, ordner, layout, tag, erstellt: vorher?.manuell?.erstellt || jetzt, geaendert: jetzt },
    });
    fs.rmSync(ziel, { recursive: true, force: true });
    fs.renameSync(neu, ziel);
    // Wie beim Neuladen einer Bestellung: Vorschau und Probeversionen frisch beginnen.
    // [EN] Same as reloading an order: start preview and trial versions afresh.
    reklaZwischenspeicherLeeren(orderId, REKLA_VORSCHAU, REKLA_VARIANTEN);
    addActivity('download', `✎ Reklamation ${reklaAnzeige(orderId)} ${vorher ? 'geändert' : 'angelegt'} (${layout})`, { status: 'done' });
    res.json({ ok: true, orderId, purchaseDate: vorher?.purchaseDate || jetzt, itemCount: 1, asins: asin ? [asin] : [],
               artikel: orderArtikel(orderId), files: listOrderFiles(orderId), name, ordner, manuell: true });
  } catch (e) {
    logger.error('rekla/manuell fehlgeschlagen:', e.message);
    res.status(500).json({ error: e.message });
  }
});

// Für den Export (fetchOrdersForFill): der Auftrag in der Form von /orders.
// [EN] For export (fetchOrdersForFill): the job in the format of /orders.
app.get('/v2/rekla/manuell/:orderId', auth(), (req, res) => {
  const { orderId } = req.params;
  const meta = manuellMeta(orderId);
  if (!meta?.manuell) return res.status(404).json({ error: 'Reklamation ohne Bestellung nicht gefunden.' });
  const itemDir = path.join(REKLA_MANUELL, orderId, 'item-1');
  const j = artikelJson(itemDir);
  const foto = readOrders.findImageName(j?.daten.customizationData);
  res.set('Cache-Control', 'no-store').json({ ...meta.manuell, eintraege: [{
    date: meta.manuell.tag, id: orderId, itemFolder: 'item-1', quantity: 1, purchaseDate: meta.purchaseDate || null, asin: meta.asin || null,
    files: [...(foto && fs.existsSync(path.join(itemDir, foto)) ? [{ file: `item-1/${foto}` }] : []),
            ...(j ? [{ file: `item-1/${j.datei}` }] : [])],
  }] });
});

// Bestell-JSON und Fotos unter derselben URL wie bei einer echten Bestellung. Erreicht nur, was
// express.static nicht findet (public/<Tag>/000-… gibt es nie).
// [EN] Order JSON and photos under same URL as real order. Only handles what
// [EN] express.static does not find (public/<Date>/000-... never exists).
app.get(/^\/v2\/\d{4}-\d{2}-\d{2}\/(000-\d{7}-\d{7})\/(item-\d+)\/([\w-][\w.-]*)$/, auth(), (req, res) => {
  const [orderId, item, datei] = [req.params[0], req.params[1], req.params[2]];
  const f = path.join(REKLA_MANUELL, orderId, item, datei);
  if (datei === 'meta.json' || !fs.existsSync(f) || !fs.statSync(f).isFile()) return res.status(404).end();
  res.set('Cache-Control', 'no-store');
  res.sendFile(f);
});

// ── Ezcad-Vorlagen (Editor: Reiter „Maschinen" → Ezcad), s. vorlage.controller.js ──
// [EN] ── Ezcad templates (Editor: "Machines" tab -> Ezcad), see vorlage.controller.js ──
app.get('/v2/vorlage/uebersicht', auth(), (req, res) => {
  try { res.json(vorlageCtl.uebersicht()); }
  catch (e) { logger.error('vorlage/uebersicht:', e.message); res.status(500).json({ error: e.message }); }
});
app.post('/v2/vorlage/laden', auth(), (req, res) => {
  // Nicht während eines Laufs: der schreibt gerade selbst in die Arbeitsordner.
  // Der Export (Puppeteer) läuft NACH dem Download mit progress.running=false — ohne
  // exportLaeuft() schrieben Laden und Export gleichzeitig in denselben Ordner.
  // [EN] Not during a run: it is writing to working directories itself.
  // [EN] Export (Puppeteer) runs AFTER download with progress.running=false — without
  // [EN] exportLaeuft(), loading and exporting would write to same folder concurrently.
  if (progress.running || scheduler.exportLaeuft()) return res.status(409).json({ error: 'Es läuft gerade ein Download/Export — bitte danach laden.' });
  try {
    const r = vorlageCtl.laden(req.body?.pfad);
    logger.log(`Vorlage geladen: ${r.ordner} ← ${req.body?.pfad} (${r.kopiert} Dateien${r.geleert.length ? ', geleert: ' + r.geleert.join(', ') : ''})`);
    addActivity('export', `⬡ ${r.ordner}: Stand vom ${r.tag}${r.satz > 1 ? ' Satz ' + r.satz : ''} in den Arbeitsordner geladen`, { status: 'ok' });
    res.json({ success: true, ...r });
  } catch (e) {
    logger.warn('vorlage/laden:', e.message);
    res.status(400).json({ error: e.message });
  }
});
app.get('/v2/vorlage/ezd', auth(), async (req, res) => {
  try { res.json(await vorlageCtl.ezdLesen(req.query.ordner, req.query.datei)); }
  catch (e) { res.status(400).json({ error: e.message }); }
});
// Eine Sicherung der .ezd zurückholen (der jetzige Stand wird vorher selbst gesichert)
// [EN] Restore a backup of .ezd (current state is backed up first)
app.post('/v2/vorlage/zurueck', auth(), (req, res) => {
  const { ordner, datei, name } = req.body || {};
  try {
    const r = vorlageCtl.zurueckholen(ordner, datei, name);
    logger.log(`ezd zurückgeholt: ${r.ordner}/${r.datei} ← ${r.zurueck} (Sicherung ${r.sicherung})`);
    addActivity('export', `⬡ ${r.datei}: Stand ${r.zurueck} zurückgeholt`, { status: 'ok' });
    res.json({ success: true, ...r });
  } catch (e) {
    logger.warn('vorlage/zurueck:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// Objekte einer .ezd ändern (Lage, Stift je Platz) — schreibt nur den Entwurf daneben
// [EN] Modify objects of .ezd (position, pen per slot) — only writes draft alongside
app.post('/v2/vorlage/objekte', auth(), async (req, res) => {
  const { ordner, datei, auftrag } = req.body || {};
  try {
    const r = await vorlageCtl.objekteAendern(ordner, datei, auftrag);
    logger.log(`ezd-Entwurf: ${r.ordner}/${r.entwurf}: ${(r.aenderungen || []).length} Änderungen (${(r.aenderungen || []).slice(0, 3).join('; ')}…)`);
    res.json({ success: true, ...r });
  } catch (e) {
    logger.warn('vorlage/objekte:', e.message);
    res.status(400).json({ error: e.message });
  }
});
app.post('/v2/vorlage/entwurf', auth(), (req, res) => {
  const { ordner, datei, uebernehmen } = req.body || {};
  try {
    const r = vorlageCtl.entwurfAbschliessen(ordner, datei, !!uebernehmen);
    logger.log(`ezd-Entwurf ${r.uebernommen ? 'übernommen' : 'verworfen'}: ${r.ordner}/${r.datei}${r.sicherung ? ' (Sicherung ' + r.sicherung + ')' : ''}`);
    if (r.uebernommen) addActivity('export', `⬡ ${r.datei}: Entwurf übernommen (Lage/Stifte)`, { status: 'ok' });
    res.json({ success: true, ...r });
  } catch (e) {
    logger.warn('vorlage/entwurf:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// ── ASIN-Check (Editor: Reiter „ASIN"), s. asin-check.controller.js ──────────
// [EN] ── ASIN check (Editor: "ASIN" tab), see asin-check.controller.js ───────
// /scan vor /:asin — sonst hielte Express „scan" für eine ASIN.
// [EN] /scan before /:asin — otherwise Express would interpret "scan" as an ASIN.
app.get('/v2/asin-check', auth(), (req, res) => {
  try { res.json(asinCheck.liste()); }
  catch (e) { logger.error('asin-check Liste:', e.message); res.status(500).json({ error: e.message }); }
});
app.get('/v2/asin-check/scan', auth(), (req, res) => res.json(amazon.asinScanStatus()));
// Vorab-Schätzung für die Rückfrage im Editor (fragt Amazon NICHT)
// [EN] Preliminary estimation for query in Editor (does NOT query Amazon)
app.get('/v2/asin-check/scan/kandidaten', auth(), (req, res) => {
  const asin = String(req.query.asin || '').trim().toUpperCase();
  if (!asinCheck.ASIN_RE.test(asin)) return res.status(400).json({ error: 'Ungültige ASIN.' });
  res.json(amazon.asinScanKandidaten(asin, Number(req.query.tage) === 7 ? 7 : 14));
});
app.post('/v2/asin-check/scan', auth(), (req, res) => {
  const asin = String(req.body?.asin || '').trim().toUpperCase();
  if (!asinCheck.ASIN_RE.test(asin)) return res.status(400).json({ error: 'ASIN im Format B0XXXXXXXX erwartet.' });
  const tage = Number(req.body?.tage) === 7 ? 7 : 14;
  const r = amazon.asinScanStarten({ asin, tage }, progress);
  if (r.error) return res.status(409).json({ error: r.error });
  res.json({ message: 'started' });
});
app.post('/v2/asin-check/scan/abbrechen', auth(), (req, res) => res.json({ abgebrochen: amazon.asinScanAbbrechen() }));
app.get('/v2/asin-check/:asin', auth(), (req, res) => {
  const asin = String(req.params.asin || '').trim().toUpperCase();
  if (!asinCheck.ASIN_RE.test(asin)) return res.status(400).json({ error: 'Ungültige ASIN.' });
  const p = asinCheck.profil(asin);
  if (!p) return res.status(404).json({ error: 'Zu dieser ASIN liegt noch keine Bestellung vor.' });
  res.json(p);
});

// ── Bereich „Amazon" (Verkäufe, Experimente; nur entwickler) — eigener Ordner neben Printomation,
// s. /var/www/printomation/amazon-bereich/LIESMICH.md. Fehlt oder klemmt er, läuft Printomation weiter.
// [EN] ── "Amazon" section (Sales, experiments; developer only) — separate folder beside Printomation,
// [EN] see /var/www/printomation/amazon-bereich/LIESMICH.md. If missing or broken, Printomation continues running.
try {
  const amazonBereichPath = fs.existsSync(path.join(__dirname, 'amazon-bereich/server'))
    ? path.join(__dirname, 'amazon-bereich/server')
    : '/var/www/printomation/amazon-bereich/server';
  require(amazonBereichPath)(app, { express,
    asinTitel: () => new Map(asinCheck.liste().map(p => [p.asin, p.titel])) });
} catch (e) { logger.warn('Amazon-Bereich nicht geladen:', e.message); }

// ── Start ─────────────────────────────────────────────────────────────────────
// [EN] ── Start ─────────────────────────────────────────────────────────────────
addActivity('info', '🚀 Server gestartet', { status: 'info' });

function startPrintomationServices() {
  const savedSchedule = scheduler.loadSchedule();
  if (savedSchedule.length > 0) {
    scheduler.applySchedule(savedSchedule, progress, amazon);
    logger.log('Zeitplan geladen: ' + savedSchedule.filter(e=>e.active).length + ' aktive Einträge.');
  } else {
    logger.log('Kein Zeitplan gespeichert.');
  }
  // Auto-Cleanup: UNABHÄNGIG vom Zeitplan starten (auch wenn oben keiner geladen wurde) —
  // er ist das Sicherheitsnetz gegen volllaufende Ordner und darf nicht davon abhängen,
  // dass der Download funktioniert.
  // [EN] Auto-cleanup: start INDEPENDENTLY of schedule (even if none was loaded above) —
  // [EN] it is the safety net against full disks and must not depend on
  // [EN] download working properly.
  scheduler.startCleanupCron(progress);
  // Ausstehenden Auto-Export nachholen (Server-Neustart im 2-Min-Fenster nach Download)
  // [EN] Catch up on pending auto-export (server restart within 2-min window after download)
  scheduler.recoverPendingExport();

  // ASIN-Profile um die Bestellordner unter public/ ergänzen (idempotent, ~50 ms)
  // [EN] Complement ASIN profiles with order folders under public/ (idempotent, ~50 ms)
  setTimeout(() => {
    try { asinCheck.lokalNachtragen(); } catch (e) { logger.warn('ASIN-Check nachtragen:', e.message); }
  }, 15000);

  // Recovery: falls beim letzten Crash Bestellungen in der Queue waren,
  // diese nach 10s automatisch abarbeiten — verhindert hängende Downloads
  // [EN] Recovery: if orders remained in queue during last crash,
  // [EN] process them automatically after 10s — prevents hung downloads
  setTimeout(async () => {
    try {
      const queueDir = path.join(__dirname, 'queue');
      if (fs.existsSync(queueDir)) {
        const pending = fs.readdirSync(queueDir).filter(f => f.endsWith('.json'));
        if (pending.length > 0 && !progress.running) {
          logger.log(`Recovery: ${pending.length} ausstehende Bestellung(en) in Queue gefunden, starte Verarbeitung…`);
          addActivity('info', `🔄 Recovery: ${pending.length} Bestellung(en) aus Queue`, { status: 'running' });
          Object.assign(progress, { running: true, done: false, error: null, total: 0, current: 0, phase: 'download',
                                    message: `Recovery: ${pending.length} Bestellung(en) werden verarbeitet…` });
          try {
            await amazon.manageProcessQueue(progress);
            progress.running = false;
            progress.done = true;
            progress.phase = 'done';
            progress.message = 'Recovery abgeschlossen.';
            addActivity('info', '✅ Recovery abgeschlossen', { status: 'done' });
          } catch(err) {
            progress.running = false;
            progress.phase = 'error';
            progress.error = err.message;
            logger.error('Recovery Fehler:', err.message);
          }
        }
      }
    } catch(e) {
      logger.error('Recovery Check Fehler:', e.message);
    }
  }, 10000);
}

// Nur Loopback: von außen geht es ausschließlich über nginx (443, Basic Auth mit Rollen).
// Vorher lauschte Node auf allen Schnittstellen — http://<IP>:3002 umging den Login samt
// Nur-Lesen-Sperre des Zuschauers komplett.
// [EN] Loopback only: external access solely via nginx (443, Basic Auth with roles).
// [EN] Previously Node listened on all interfaces — http://<IP>:3002 bypassed login and
// [EN] viewer read-only restriction completely.
if (require.main === module) {
  app.listen(config.port, '127.0.0.1', () => {
    logger.log(`Server running on port ${config.port} 🚀`);
    startPrintomationServices();
  });
}

module.exports = app;
module.exports.startPrintomationServices = startPrintomationServices;

// Niemals den Prozess killen — sonst brechen laufende Downloads ab und
// PM2 startet neu mit leerer Queue. Stattdessen ausführlich loggen.
// [EN] Never kill process — otherwise active downloads abort and
// [EN] PM2 restarts with empty queue. Log extensively instead.
process.on('uncaughtException', (error) => {
  logger.error('uncaughtException:', error?.stack || error);
  // try/catch bleibt: der Crash-Handler darf selbst niemals werfen (addActivity schreibt auf Disk)
  // [EN] try/catch remains: crash handler must never throw itself (addActivity writes to disk)
  try { addActivity('error', `⚠️ Uncaught: ${error.message || error}`, { status: 'error' }); } catch(e) {}
});
process.on('unhandledRejection', (reason) => {
  logger.error('unhandledRejection:', reason?.stack || reason);
  try { addActivity('error', `⚠️ Unhandled Rejection: ${reason?.message || reason}`, { status: 'error' }); } catch(e) {}
});
// Kein eigener SIGTERM-Handler: der frühere (nur server.close()) hielt den Prozess am Leben —
// Cron-Jobs und Timer laufen weiter —, bis ein SIGKILL kam. Standardverhalten = sofort beenden,
// genau wie bei SIGINT, mit dem PM2 stoppt. Queue, Ledger und Session sind je Batch gesichert.
// [EN] No custom SIGTERM handler: previous one (only server.close()) kept process alive —
// [EN] cron jobs and timers kept running — until SIGKILL arrived. Default behavior = terminate immediately,
// [EN] exactly like SIGINT used by PM2 to stop. Queue, ledger, and session are saved per batch.
