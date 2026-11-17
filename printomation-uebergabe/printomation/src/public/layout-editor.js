// ═══════════════════════════════════════════════════════════════════════════
//  PRINTOMATION — Layout-Editor: gesamte Bedienlogik.
//  Markup in layout-editor.html, Stile in layout-editor.css, Bildmathematik in laser-pipeline.js.
//
//  KLASSISCHES Skript, kein Modul: layout-editor.html lädt es per <script src> NACH
//  laser-pipeline.js und vor amazon.js, ohne `defer`/`async`. Alle teilen sich den globalen
//  lexikalischen Bereich — Top-Level-let/const sind gegenseitig sichtbar, aber NICHT als window.x.
//
//  [EN] PRINTOMATION — Layout Editor: entire UI/interaction logic.
//  Markup in layout-editor.html, styles in layout-editor.css, image mathematics in laser-pipeline.js.
//
//  CLASSICAL script, not a module: layout-editor.html loads it via <script src> AFTER
//  laser-pipeline.js and before amazon.js, without `defer`/`async`. All share global
//  lexical scope — top-level let/const are visible to each other, but NOT as window.x.
// ═══════════════════════════════════════════════════════════════════════════
// Early Auth Guard: sofort zu /login.html weiterleiten wenn kein JWT-Token vorliegt
(function _earlyAuthGuard() {
  try {
    const q = new URLSearchParams(window.location.search);
    if (q.get('autoexport') === '1') return;
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    if (!token) {
      window.location.replace('/login.html');
    }
  } catch (_) { }
})();

// ── Grundlagen: Escape, Server-Aufruf, Konstanten, kleine Helfer ───────────────
// HTML-Escape für user-/serverseitige Strings, die per innerHTML interpoliert werden
// (Feld-/Layout-Namen, statischer Text). Verhindert kaputtes Markup bei < " > & und
// HTML/JS-Injection — gleicher Schutz wie textContent in Activity-Log/Fonts-Liste.
// [EN] HTML escape for user/server-side strings interpolated via innerHTML
// (field/layout names, static text). Prevents broken markup on < " > & and
// HTML/JS injection — same protection as textContent in Activity Log/Fonts list.
function _esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
// Server-Aufruf mit JSON: wirft bei HTTP-Fehler mit der Meldung des Servers (`error`).
// Eine Fehlerbehandlung für alle Knöpfe, die etwas auf dem Server ändern.
// [EN] Server call with JSON: throws on HTTP error with the server message (`error`).
// Unified error handling for all buttons that make changes on the server.
async function _apiJson(pfad, methode = 'GET', body) {
  const headers = { 'Content-Type': 'application/json' };
  // Add JWT token from localStorage if available
  const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const cleanPfad = (pfad.startsWith('/') ? pfad : '/' + pfad).replace(/^\/v2\/v2\//, '/v2/');
  const fullUrl = `${BASE_URL}${cleanPfad}`.replace(/([^:]\/)\/+/g, '$1').replace(/\/v2\/v2\//g, '/v2/');
  const res = await fetch(fullUrl, body === undefined ? { method: methode, headers, credentials: 'include' }
    : { method: methode, headers, credentials: 'include', body: JSON.stringify(body) });
  if (res.status === 401 && !IS_AUTOEXPORT) {
    localStorage.removeItem('jwt_access_token');
    localStorage.removeItem('token');
    window.location.replace('/login.html');
    return;
  }
  const d = await res.json().catch(() => ({}));
  if (!res.ok || d.error || d.success === false) throw new Error(d.error || 'HTTP ' + res.status);
  return d;
}
const MM = 3.7795275591;
// Basis-URL aller fetch()-Aufrufe — ausschließlich aus Environment (SITE_URL) via window.CONFIG.SITE_URL.
// Entfernt eventuelle /v2, /v1 oder nachgestellte Schrägstriche, um doppelte Pfade wie /v2/v2/ strikt zu verhindern.
const _rawBase = (typeof window !== 'undefined' && window.CONFIG && window.CONFIG.SITE_URL)
  ? window.CONFIG.SITE_URL
  : '';
const BASE_URL = _rawBase.replace(/\/+$/, '').replace(/\/v[12]\/?$/, '');

// ── Aufruf-Parameter der Seite ────────────────────────────────────────────────
// EINMAL geparst — die Query steht zur Laufzeit fest (Puppeteer navigiert nie).
// [EN] Page query parameters — parsed ONCE (query is fixed at runtime, Puppeteer never navigates).
const URL_Q = new URLSearchParams(window.location.search);
// Läuft diese Seite im headless Auto-Export (Puppeteer) statt vor einem Menschen?
// Entscheidet überall dort, wo Arbeit NUR für die sichtbare Oberfläche anfällt.
// [EN] Is this page running in headless auto-export (Puppeteer) instead of in front of a human?
// Decides everywhere whether work is needed ONLY for visible UI rendering.
const IS_AUTOEXPORT = URL_Q.get('autoexport') === '1';

// ── Atempause zwischen zwei Export-Schritten ─────────────────────────────────
// Kurz an den Browser abgeben, damit der Sammler einziehen kann, was der vorige Schritt
// freigegeben hat. Der Auto-Export rendert bis zu 40 Mpx große Canvas in headless
// Chromium und ist dort OOM-empfindlich (s. loadImg, _capLaserDpi).
// setTimeout, NICHT rAF: eine unsichtbare Seite bekommt keine verlässlichen Frames.
// Bewusst großzügig — lieber ein paar Sekunden mehr als ein OOM-Abbruch ohne Datei.
// WER SIE SENKT, prüft danach den SPEICHER eines vollen Tageslaufs, nicht die Laufzeit.
// [EN] ── Breathing pause between two export steps ────────────────────────────
// Briefly yield control back to the browser so garbage collection can reclaim memory
// released by the previous step. Auto-export renders canvases up to 40 Mpx in headless
// Chromium and is susceptible to OOM (Out Of Memory) crashes (see loadImg, _capLaserDpi).
// setTimeout, NOT rAF (requestAnimationFrame): an invisible page gets no reliable frames.
// Deliberately generous — better a few extra seconds than an OOM crash without a file.
// WHOEVER LOWERS THIS must verify MEMORY usage of a full day's run, not execution time.
const EXPORT_ATEMPAUSE_MS = 100;
const _atempause = (ms = EXPORT_ATEMPAUSE_MS) => new Promise(r => setTimeout(r, ms));

// ── Gemeinsame kleine Helfer ───────────────────────────────────────────────────
// Berliner Kalendertag (YYYY-MM-DD) eines Zeitpunkts (ms, ISO-Text oder Date) — EINE Quelle für alle
// Datums-Filter der App.
// [EN] Berlin calendar day (YYYY-MM-DD) for a timestamp (ms, ISO string, or Date) — SINGLE source for all date filters in the app.
const _berlinTag = (t) => new Date(t).toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
const _dayBerlin = (offsetDays = 0) => _berlinTag(Date.now() - offsetDays * 86400000);
// Berliner Uhrzeit „HH:MM" — Anzeigen und Packliste, unabhängig von der Zeitzone des Rechners.
// [EN] Berlin time "HH:MM" — displays and packing list, independent of client computer's local time zone.
const _berlinUhrzeit = (t = Date.now()) => new Date(t).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
// Eindeutige ASINs aus den geladenen Bestellungen.
// [EN] Unique ASINs from loaded orders.
const _orderAsins = () => [...new Set(orders.map(o => o.asin).filter(Boolean))];
// Wert eines <input type="number">: LEERES Feld → NaN, damit die NaN-Sperre in upd()
// greift. NICHT `+this.value` — `+'' === 0` ist gültig, und w=0/h=0/fontSize=0 heißt
// Feld weg vom Blatt bzw. scale 0 im DXF.
// [EN] Value of <input type="number">: EMPTY field -> NaN so NaN guard in upd() takes effect.
// NOT `+this.value` — `+'' === 0` is valid, and w=0/h=0/fontSize=0 means field disappears from sheet or scale 0 in DXF.
const _numIn = v => (v == null || String(v).trim() === '') ? NaN : +v;
// „An"-Zustand eines Schalter-Kastens. Die FARBEN stehen ausschließlich im Stylesheet
// (.an bzw. .an.an-gruen) — hier wird nur die Klasse geschaltet, nie ein Inline-Stil.
// [EN] "Active" state of a toggle button. COLORS reside strictly in stylesheet (.an / .an.an-gruen) —
// here only class is toggled, never inline style.
const _setAn = (id, on) => { const el = typeof id === 'string' ? document.getElementById(id) : id; if (el) el.classList.toggle('an', !!on); };
// Berliner Wanduhrzeit → Zeitstempel, UNABHÄNGIG von der Zeitzone des Browsers. Die
// naive Variante (new Date('…T09:00:00')) rechnet lokal — auf einem Rechner mit anderer
// Systemzeit läge das Fenster still um Stunden daneben. In der Umstellungsstunde einmal
// im Jahr kann das Ergebnis um 1 h abweichen; für einen Anzeige-Filter unerheblich.
// [EN] Berlin wall-clock time -> timestamp, INDEPENDENT of browser timezone.
// The naive approach (new Date('...T09:00:00')) computes locally — on a computer with a different
// system timezone, the window would quietly be off by hours. During daylight saving transitions once
// a year the result might differ by 1h; negligible for a display filter.
const _berlinToTs = (dateStr, hhmm) => {
  const [hh = '0', mm = '0'] = String(hhmm || '0:0').split(':');
  const naiv = Date.parse(`${dateStr}T${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}:00Z`);
  if (!Number.isFinite(naiv)) return NaN;
  const versatz = new Date(new Date(naiv).toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
    - new Date(new Date(naiv).toLocaleString('en-US', { timeZone: 'UTC' }));
  return naiv - versatz;
};

// Reihenfolge „oben links zuerst" (erst y, dann x) — DIE Regel, nach der Plätze, Gravur-
// Zeilen und Layer nummeriert werden. Stand bis 08.10.2026 sechzehnmal ausgeschrieben da.
// [EN] "Top-left first" order (first y, then x) — THE rule by which spots, engraving lines, and layers are numbered.
const _nachPosition = (a, b) => (a.y - b.y) || (a.x - b.x);
// Bildfelder in Platz-Reihenfolge: Platz N = N-tes Bildfeld oben links zuerst. Dieselbe
// Zählung für platzN.bmp, Vorschau, Belegungsliste und den Abgleich im Ezcad-Reiter.
// [EN] Image fields in slot order: Slot N = N-th image field top-left first. Identical indexing for platzN.bmp, preview, allocation list, and Ezcad tab sync.
const _bildPlaetze = (felder) => (felder || []).filter(f => f.type === 'image').sort(_nachPosition);
// Schreibt das Layout in den festen Ezcad-Arbeitsordner (_Vorlage/…)?
// [EN] Does layout write to fixed Ezcad working folder (_Vorlage/...)?
const _istVorlageLayout = (l) => !!l && (l.bmpModus === 'vorlage' || l.bmpModus === 'beides');
// Export-Formate eines Layouts als Liste („bmp+dxf" → ['bmp', 'dxf']), Standard PDF.
// [EN] Export formats of a layout as list ("bmp+dxf" -> ['bmp', 'dxf']), default PDF.
const _formate = (l) => String((l && l.exportFormat) || 'pdf').split('+');
// Hat ein (gespeichertes) Layout auf irgendeiner Seite ein Feld, das `test` erfüllt?
// [EN] Does a (saved) layout have a field on any page that satisfies `test`?
const _layoutHat = (l, test) => (l.pages || []).some(pg => (pg || []).some(f => f && test(f)));
// Alle Felder im Editor: aktuelle Seite + alle gespeicherten Seiten (die aktuelle kann dabei
// doppelt vorkommen — für Suchen und Mengen egal).
// [EN] All fields in editor: current page + all saved pages (current can occur twice — harmless for searches/counts).
const _editorFelder = () => [...fields, ...(_pages || []).flat()].filter(Boolean);
// Ezcad-Koordinaten der Mitte eines Rechtecks: Nullpunkt = Blattmitte, x nach rechts, y nach OBEN.
// [EN] Ezcad coordinates of rectangle center: origin = sheet center, x to right, y UPWARDS.
const _ezcadMitte = (bb, pg) => [bb.x + bb.w / 2 - pg.w / 2, pg.h / 2 - (bb.y + bb.h / 2)];
// Schrift, mit der ein Feld gezeichnet wird: aus der Bestellung geladen, sonst die des Felds.
// [EN] Font used to render field: loaded from order, otherwise field's font.
const _feldSchrift = (f) => f._fontFamily || f.fontFamily || 'Arial';
// CSS-Schriftangabe für Canvas — Vorschau, Export und Messung bauen sie gleich.
// [EN] CSS font string for Canvas — preview, export, and measurements construct it identically.
const _canvasFont = (px, fam, bold) => (bold ? 'bold ' : '') + px + 'px "' + (fam || 'Arial') + '"';
// Versalhöhe („H") der aktuellen ctx-Schrift in px — Verankerung von Gravur-, statischem und
// Emoji-Text, dieselbe Größe wie die Oberkante „H" im DXF. px = Schriftgröße für den Rückfall.
// [EN] Cap height ("H") of current ctx font in px — baseline for engraving, static, and emoji text, identical to top edge "H" in DXF. px = fallback font size.
function _capPx(ctx, px) {
  const a = ctx.measureText('H').actualBoundingBoxAscent;
  return Number.isFinite(a) && a > 0 ? a : (px ?? parseFloat(ctx.font.replace(/^bold /, ''))) * 0.7;
}

// Trifft eine Bestellung den Zeitraum? `date` = Berliner KAUFtag, `purchaseDate` = voller
// Zeitstempel; sobald eine Uhrzeit im Spiel ist, muss über purchaseDate gerechnet werden.
//
// WICHTIG: der DOWNLOAD filtert über das
// ÄNDERUNGSdatum (LastUpdatedAfter), diese ANZEIGE über das KAUFdatum. Hier stehen
// deshalb regelmäßig weniger Bestellungen, als der Download gemeldet hat — kein Verlust,
// die anderen liegen in den Ordnern ihres Kauftages.
// [EN] Does an order match the timeframe? `date` = Berlin PURCHASE day, `purchaseDate` = full timestamp; when a clock time is involved, purchaseDate must be used.
// IMPORTANT: DOWNLOAD filters by MODIFIED date (LastUpdatedAfter), whereas this DISPLAY filters by PURCHASE date. Fewer orders regularly show here than reported by download — not lost, others reside in their purchase date folder.
const _matchesDatePreset = (o, preset, fromVal, toVal, fromClock, toClock) => {
  const d = (typeof o === 'string' ? o : o && o.date) || '';
  const ts = typeof o === 'string' ? NaN : Date.parse((o && o.purchaseDate) || '');
  // Ohne Zeitstempel (Altbestand) auf Tagesebene zurückfallen statt die Bestellung zu schlucken
  // [EN] Without timestamp (legacy), fall back to day level instead of swallowing order
  const seitStunden = (h) => Number.isFinite(ts) ? ts >= Date.now() - h * 3600000
    : d >= _dayBerlin(Math.ceil(h / 24));
  if (preset === 'today') return d === _dayBerlin();
  if (preset === 'yesterday') return d === _dayBerlin(1);
  if (preset === '7days') return d >= _dayBerlin(7);
  if (preset === 'last24h') return seitStunden(24);
  if (preset === 'last48h') return seitStunden(48);
  if (preset === 'custom') {
    // Ohne Uhrzeit bleibt es beim Kalendertag-Vergleich (Bis-Tag inklusiv) wie bisher.
    // [EN] Without clock time, keeps calendar day comparison (inclusive end-day) as before.
    if (!fromClock && !toClock) return d >= (fromVal || '') && d <= (toVal || _dayBerlin());
    if (!Number.isFinite(ts)) return false;
    const von = _berlinToTs(fromVal || d, fromClock || '00:00');
    const bis = toClock ? _berlinToTs(toVal || fromVal || d, toClock)
      : _berlinToTs(toVal || _dayBerlin(), '00:00') + 86400000;
    return Number.isFinite(von) && Number.isFinite(bis) && ts >= von && ts < bis;
  }
  return true;
};

// ── State ─────────────────────────────────────────────────────────────────────
let zoom = 1;
let fields = [];
let sel = null;
let orders = [];
let sessionOrders = []; // Orders from last download session
let idc = 0;
let drag = null;   // laufendes Verschieben/Größe ändern (s. _zugStarten) / [EN] active drag/resize operation (see _zugStarten)
let multiSel = new Set(); // IDs of multi-selected fields
let multiMode = false; // when true, clicks add to selection

// Letzter Download Info / [EN] Last download info
let lastDownloadCount = 0;
let lastDownloadTime = null;

// Globale Dithering-Einstellungen (alle Bild-Felder). Kommen aus LASER_DEFAULTS —
// keine zweite Literal-Liste hier. "Aus" heißt überall 'kein', nie 'none'.
// [EN] Global dithering settings (all image fields). Inherited from LASER_DEFAULTS — no second literal list here. "Off" is always 'kein', never 'none'.
let ditherSettings = _laserSettings();
// Zwei-Stack-Undo: undoStack = Zustände vor Änderungen, redoStack = rückgängig gemachte
// [EN] Two-stack undo: undoStack = states before edits, redoStack = undone actions
let undoStack = [];
let redoStack = [];

// ── Globales Error Handling ──────────────────────────────────────────────────
// [EN] ── Global Error Handling ──────────────────────────────────────────────
window.addEventListener('unhandledrejection', e => {
  const msg = e.reason?.message || String(e.reason) || 'Unbekannter Fehler';
  if (msg.includes('fetch') || msg.includes('NetworkError')) {
    showToast('⚠️ Server nicht erreichbar — läuft der Server?', 4000);
  } else if (msg.includes('404')) {
    showToast('⚠️ Datei nicht gefunden (404)', 3000);
  } else if (msg.includes('QuotaExceeded')) {
    showToast('⚠️ Amazon API Rate Limit erreicht', 3000);
  } else {
    showToast('⚠️ Fehler: ' + msg.substring(0, 60), 4000);
  }
  console.error('Unhandled rejection:', e.reason);
});

window.addEventListener('error', e => {
  if (e.filename && e.filename.includes('opentype')) return; // Meldungen aus opentype.js ignorieren / [EN] ignore messages from opentype.js
  showToast('⚠️ JS Fehler: ' + (e.message || '').substring(0, 60), 4000);
  console.error('JS Error:', e);
});

// Server-Verbindung prüfen — /health ist leichtgewichtig (/orders scannt den public-Baum)
// [EN] Check server connection — /health is lightweight (/orders scans public/ tree)
async function checkServer() {
  try {
    const resp = await fetch(BASE_URL + '/v2/health', { signal: AbortSignal.timeout(5000) });
    if (!resp.ok) showToast('⚠️ Server antwortet mit Fehler ' + resp.status, 4000);
  } catch (e) {
    showToast('⚠️ Server nicht erreichbar — läuft der Server?', 5000);
  }
}

// DER zentrale Init — einziger DOMContentLoaded-Handler der App. Reihenfolge ist damit
// explizit statt Registrierungs-Zufall; jeder Start-Schritt gehört hier hinein.
// [EN] THE central init — sole DOMContentLoaded handler in app. Execution order is explicit; every startup step belongs here.
document.addEventListener('DOMContentLoaded', () => {
  if (!IS_AUTOEXPORT) {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login.html';
      return;
    }
  }
  const pageTab = document.getElementById('tab-page');
  if (pageTab) pageTab.style.display = 'block';
  const loadTab = document.getElementById('tab-load');
  if (loadTab) loadTab.style.display = 'none';
  loadScheduleFromServer();
  renderSchedule();
  renderPal();
  updateCanvas();
  loadOrders();
  renderSaved();
  setupMouseZoom();
  _setupCanvasDrop();   // Drag & Drop der Palette auf den Canvas / [EN] Drag & drop palette to canvas
  _syncFillUI();        // Befüllen-Controls an _fillCfg angleichen / [EN] Sync populate controls with _fillCfg
  loadFontsFromServer();
  _emojiLaden();        // Emoji-Ersatzschriften + Schalter „Emojis übernehmen" / [EN] Emoji fallback fonts + toggle "Emojis übernehmen"
  loadCustomPresets();  // eigene Laser-Presets in den Material-Bereich / [EN] Custom laser presets into material section
  // Laser-Regler auf LASER_DEFAULTS stellen. Ohne das gelten die value=/checked=Attribute
  // aus dem HTML — und weil updateDitherSettings die Regler ZURÜCKLIEST, hätte die erste
  // Reglerbewegung das Dithering still abgeschaltet.
  // [EN] Set laser sliders to LASER_DEFAULTS. Otherwise value=/checked= attributes from HTML apply — and because updateDitherSettings READS BACK sliders, first adjustment would silently disable dithering.
  _syncLaserUI(ditherSettings);
  updateDitherSettings();
  checkServer(); // Server-Verbindung prüfen / [EN] verify server connection
  // Letzten Lauf gleich anzeigen (17.10.2026): vorher stand bis zum ersten Füllen „Noch nichts geladen",
  // obwohl der Lauf von 11/12 Uhr längst da war. Im Auto-Export nicht — der lädt die Session selbst.
  // [EN] Display last run immediately: previously showed "Nothing loaded yet" until first populate, even though 11/12 AM run was ready. Not in auto-export — it loads session itself.
  if (!IS_AUTOEXPORT) loadSession();
  setTimeout(initPages, 500); // Seiten-Array initialisieren nachdem Canvas bereit ist / [EN] initialize pages array once canvas is ready
  // Klappbereiche (data-merken) so öffnen, wie man sie verlassen hat
  document.querySelectorAll('details[data-merken]').forEach(d => { try { d.open = localStorage.getItem('klapp-' + d.id) === '1'; } catch (_) { } });
});
// Auf/Zu eines Klappbereichs merken (nur Bedienkomfort, kein Zustand des Layouts)
function _klappMerken(d) { try { localStorage.setItem('klapp-' + d.id, d.open ? '1' : '0'); } catch (_) { } }

// ── Mouse wheel zoom ──────────────────────────────────────────────────────────
function setupMouseZoom() {
  let _zoomTimer = null;
  document.getElementById('canvas-area').addEventListener('wheel', e => {
    e.preventDefault();
    // Throttle: max 1x pro 50ms damit es nicht zu schnell geht
    if (_zoomTimer) return;
    _zoomTimer = setTimeout(() => { _zoomTimer = null; }, 50);
    // Kleinerer Schritt: 0.05 statt 0.1 (halb so schnell)
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom(zoom + delta);
  }, { passive: false });
}

// Zoom Buttons auch sanfter
function zoomIn() { setZoom(zoom + 0.1); }
function zoomOut() { setZoom(zoom - 0.1); }

// ── Undo History ─────────────────────────────────────────────────────────────
// Momentaufnahme (Felder + alle Seiten + aktuelle Seite). _img wird wegen des Speichers
// NICHT mitgenommen (_imgSrc/_placement schon). _text MUSS mit — sonst sind gefüllte
// Textfelder nach einem Undo leer, während orderId weiter „✅ Gefüllt" behauptet.
function _snapshot() {
  saveCurrentPageSnapshot(); // aktuelle Seite in _pages sichern
  return {
    fields: fields.map(f => ({ ...f, _img: null, _imgSrc: f._imgSrc, _placement: f._placement })),
    pages: _pages.map(pg => pg.map(f => ({ ...f, _img: null, _imgSrc: f._imgSrc, _placement: f._placement }))),
    currentPage: _currentPage,
  };
}
// Vor jeder Änderung aufrufen: aktuellen Zustand auf den Undo-Stack legen.
function saveUndo() {
  redoStack = [];                 // neue Änderung verwirft die Redo-Kette
  undoStack.push(_snapshot());
  if (undoStack.length > 50) undoStack.shift();
  updateUndoButtons();
  markLayoutDirty(true); // es gibt jetzt ungespeicherte Änderungen
}

// ── Ungespeichert-Schutz ───────────────────────────────────────────────────────
let _layoutDirty = false;
function markLayoutDirty(dirty) {
  _layoutDirty = dirty;
  const btn = document.getElementById('btn-save');
  if (!btn) return;
  btn.classList.toggle('ungespeichert', !!dirty);   // Punkt + Rahmen in Amber: Stilvorlage
  btn.title = dirty ? 'Ungespeicherte Änderungen — Speichern (Ctrl+S)' : 'Speichern (Ctrl+S)';
}
// Warnung beim Verlassen/Reload mit ungespeicherten Änderungen
window.addEventListener('beforeunload', (e) => {
  if (_layoutDirty) { e.preventDefault(); e.returnValue = ''; }
});

function applyUndo(snapshot) {
  _pages = snapshot.pages.map(pg => pg.map(f => ({ ...f })));
  _currentPage = snapshot.currentPage;
  fields = snapshot.fields.map(f => ({ ...f }));
  _refreshAfterPageChange();
}

// Ein Schritt im Verlauf. `from` = Stapel, aus dem geholt wird, `to` = wohin der aktuelle
// Zustand für die Gegenrichtung wandert. Vor und zurück sind derselbe Ablauf.
function _historyStep(from, to, leerMsg, okMsg) {
  if (!from.length) { showToast(leerMsg); return; }
  to.push(_snapshot());
  applyUndo(from.pop());
  showToast(okMsg);
  updateUndoButtons();
}
function doUndo() { _historyStep(undoStack, redoStack, 'Kein weiterer Schritt', '↩ Rückgängig'); }
function doRedo() { _historyStep(redoStack, undoStack, 'Nichts zum Wiederholen', '↪ Wiederholen'); }
// Header-Buttons aktiv/inaktiv je nach Verlauf
function updateUndoButtons() {
  const u = document.getElementById('btn-undo'), r = document.getElementById('btn-redo');
  if (u) u.disabled = undoStack.length === 0;
  if (r) r.disabled = redoStack.length === 0;
}

// Modifier-Tasten beschriften: Werkstatt-PC (Windows/Linux) → "Strg/Alt/Shift", Mac
// behält ⌘/⌥/⇧. Die Handler hören auf metaKey || ctrlKey, nur das Overlay ändert sich.
(function relabelModifierKeys() {
  const isMac = /Mac|iPhone|iPad/i.test(navigator.platform || navigator.userAgent || '');
  if (isMac) return;
  const map = { '⌘': 'Strg', '⌥': 'Alt', '⇧': 'Shift' };
  document.querySelectorAll('#shortcuts-overlay .kbd').forEach(el => {
    const t = el.textContent.trim();
    if (map[t]) el.textContent = map[t];
  });
})();

// ── Tastenkürzel ─────────────────────────────────────────────────────────────
document.addEventListener('keydown', e => {
  // Don't trigger when typing in input fields
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;

  // Liegt ein Dialog darüber, gehören die Tasten IHM. Ohne diese Sperre wirkten sie auf
  // den Editor DAHINTER: Entf löschte das Feld, Strg+S riss den gemeinsamen
  // Modal-Container an sich und der wartende Dialog wurde nie aufgelöst.
  if (_modalIsOpen()) return;

  // ? → Shortcuts Übersicht
  if (e.key === '?') { e.preventDefault(); toggleShortcuts(); return; }

  // Escape → Auswahl aufheben
  if (e.key === 'Escape') { sel = null; multiSel.clear(); _syncSelectionClasses(); renderFieldList(); renderProps(); return; }

  // Delete / Backspace → delete selected field
  if ((e.key === 'Delete' || e.key === 'Backspace') && sel) {
    e.preventDefault();
    delF(sel); // saveUndo passiert jetzt in delF (auch für den 🗑-Button)
  }

  // Cmd+C / Ctrl+C → copy selected field
  if ((e.metaKey || e.ctrlKey) && e.key === 'c' && sel) {
    e.preventDefault();
    const f = fields.find(x => x.id === sel);
    if (f) window._clipboard = JSON.parse(JSON.stringify(f));
  }

  // Cmd+V / Ctrl+V → paste
  if ((e.metaKey || e.ctrlKey) && e.key === 'v' && window._clipboard) {
    e.preventDefault();
    saveUndo();
    const c = window._clipboard;   // _rasterKopie: ohne Bestellung, ohne Array-Bindung
    sel = _rasterKopie(c, String(c.name || '').replace(/\s*\(\d+\)$/, '').trim() + ' (Kopie)', c.x + 5, c.y + 5).id;
    scheduleRender(); renderFieldList(); renderProps();
  }

  // Cmd+Z / Ctrl+Z → Undo
  if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
    e.preventDefault(); doUndo(); return;
  }

  // Cmd+Shift+Z / Ctrl+Y → Redo
  if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') ||
    ((e.ctrlKey) && e.key === 'y')) {
    e.preventDefault(); doRedo(); return;
  }

  // Cmd+S / Ctrl+S → Speichern
  if ((e.metaKey || e.ctrlKey) && e.key === 's') {
    e.preventDefault();
    saveLayout();
    return;
  }

  // Arrow keys → move selected field
  if (sel && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
    e.preventDefault();
    const f = fields.find(x => x.id === sel);
    if (!f) return;
    const step = e.shiftKey ? 5 : (e.altKey ? 0.1 : 1);
    saveUndo();
    if (e.key === 'ArrowLeft') f.x = Math.max(0, f.x - step);
    if (e.key === 'ArrowRight') f.x += step;
    if (e.key === 'ArrowUp') f.y = Math.max(0, f.y - step);
    if (e.key === 'ArrowDown') f.y += step;
    scheduleRender(); renderFieldList(); renderProps();
  }
});

// ── Tab switching ─────────────────────────────────────────────────────────────
// Alle Reiter EINMAL aufgelistet — ein neuer Reiter kommt nur hier dazu.
const TABS = ['load', 'fill', 'rekla', 'maschinen', 'fields', 'page', 'fonts', 'motive', 'asin', 'laser', 'overview', 'settings'];
// Flex-Spalte = fester Kopf + scrollender Rumpf (Klasse .tab-col). Alles andere ist ein
// einfacher Block, der als Ganzes scrollt.
const TABS_FLEX = new Set(['load', 'fill', 'rekla', 'maschinen', 'fonts', 'motive', 'asin', 'laser', 'overview', 'settings']);

function switchTab(tab, btn) {
  for (const t of TABS) {
    const el = document.getElementById('tab-' + t);
    if (el) el.style.display = 'none';
  }
  const target = document.getElementById('tab-' + tab);
  if (target) target.style.display = TABS_FLEX.has(tab) ? 'flex' : 'block';
  // Im Reiter „Maschinen" gehört die große Fläche der Maschinen-Bühne statt dem Blatt
  document.querySelector('.workspace')?.classList.toggle('maschinen-an', tab === 'maschinen');
  // Zustandsanzeigen beim Öffnen frisch setzen, nicht erst bei der nächsten Änderung
  if (tab === 'laser') { try { _paintLaserAktiv(); } catch (_) { } }
  if (tab === 'rekla' && _rekWeg === 'ohne') _rmLayoutsFuellen();   // neu angelegte Layouts gleich in der Auswahl
  if (tab === 'settings') { setTimeout(() => { try { _updateEinstStand(); } catch (_) { } }, 60); }
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');
  // Keine Sonderfarben je Reiter mehr (vorher Laden Akzent, Layout Grün, Schriften Amber):
  // der aktive Reiter trägt überall denselben Akzent aus .nav-btn.active.
}

// ── Page ──────────────────────────────────────────────────────────────────────
function setPg(w, h) {
  document.getElementById('pw').value = w;
  document.getElementById('ph').value = h;
  updateCanvas();
}

function getPg() {
  return {
    w: parseFloat(document.getElementById('pw').value) || 210,
    h: parseFloat(document.getElementById('ph').value) || 297,
    m: parseFloat(document.getElementById('pm').value) || 10,
  };
}

function updateCanvas() {
  _updateKopfKontext();
  const p = getPg();
  const w = Math.round(p.w * MM * zoom);
  const h = Math.round(p.h * MM * zoom);
  const c = document.getElementById('layout-canvas');
  c.width = w; c.height = h;
  c.style.width = w + 'px'; c.style.height = h + 'px';
  const ov = document.getElementById('ov');
  ov.style.width = w + 'px'; ov.style.height = h + 'px';
  // Inner container mindestens so groß wie Canvas + Padding — damit Canvas immer zentriert bleibt
  const inner = document.getElementById('canvas-area-inner');
  const area = document.getElementById('canvas-area');
  if (inner && area) {
    inner.style.minWidth = Math.max(w + 80, area.clientWidth) + 'px';
    inner.style.minHeight = Math.max(h + 80, area.clientHeight) + 'px';
  }
  drawCanvas();
  renderEls();
}

// Kopfleiste: Name und Maße des geladenen Layouts
function _updateKopfKontext() {
  const wrap = document.getElementById('kopf-kontext');
  if (!wrap) return;
  const name = _loadedLayout ? _loadedLayout.name : null;
  if (!name) { wrap.hidden = true; return; }
  wrap.hidden = false;
  document.getElementById('kopf-layout').textContent = name;
  const p = getPg();
  const seiten = _pages.length > 1 ? ` · Seite ${_currentPage + 1}/${_pages.length}` : '';
  document.getElementById('kopf-blatt').textContent = `${p.w} × ${p.h} mm · ${fields.length} Felder${seiten}`;
}

let _bgCache = { key: '', canvas: null };
function drawCanvas() {
  const p = getPg();
  const w = Math.round(p.w * MM * zoom);
  const h = Math.round(p.h * MM * zoom);
  const m = p.m * MM * zoom;
  const c = document.getElementById('layout-canvas');
  const ctx = c.getContext('2d');
  // Hintergrund hängt nur an Seitengröße/Zoom/Rand, NICHT an den Feldern → einmal in ein
  // Offscreen-Canvas rendern und pro Frame nur einblenden.
  const bgKey = `${w}_${h}_${m.toFixed(2)}`;
  if (_bgCache.key !== bgKey || !_bgCache.canvas) {
    const bg = document.createElement('canvas');
    bg.width = w; bg.height = h;
    const bx = bg.getContext('2d');
    bx.fillStyle = '#fff'; bx.fillRect(0, 0, w, h);
    bx.strokeStyle = 'rgba(124,106,255,0.2)'; bx.setLineDash([3, 4]); bx.lineWidth = 0.8;
    bx.strokeRect(m, m, w - m * 2, h - m * 2); bx.setLineDash([]);
    _bgCache = { key: bgKey, canvas: bg };
  }
  ctx.drawImage(_bgCache.canvas, 0, 0);
  // Felder zeichnen — Text über denselben Helfer wie der Export (_drawText) → die
  // Vorschau zeigt exakt das Export-Ergebnis (gleiche Formeln, gleicher Clip).
  const pxPerMm = MM * zoom;
  fields.forEach(f => {
    const x = f.x * MM * zoom, y = f.y * MM * zoom, fw = f.w * MM * zoom, fh = f.h * MM * zoom;
    ctx.save();
    // Drehung um die Feldmitte — gleiche Optik wie Overlay (CSS) und Export (DXF/PDF)
    if (f.rotation) {
      ctx.translate(x + fw / 2, y + fh / 2); ctx.rotate(f.rotation * Math.PI / 180); ctx.translate(-(x + fw / 2), -(y + fh / 2));
    }
    if (f.type === 'image' && f._img) {
      ctx.drawImage(f._img, x, y, fw, fh);
    } else if (_istMotiv(f)) {
      _drawMotiv(ctx, f, pxPerMm);
    } else {
      // Vom Export ausgeschlossene statische Felder in der Vorschau ausgrauen (sichtbar, aber als „nicht exportiert" erkennbar)
      if (f.type === 'static' && f.exportEnabled === false) ctx.globalAlpha = 0.3;
      // Kreis-Text und „Übersteht" ragen bewusst über die Feldbox → NICHT clippen, sonst
      // sieht die Vorschau abgeschnitten aus, was der Laser voll graviert.
      if (!_textRagtUeber(f)) { ctx.beginPath(); ctx.rect(x, y, fw, fh); ctx.clip(); }
      if (f.ddText && !f._text && !f.orderId) {
        // Noch nicht gefüllt: eine typische Antwort blass in Schrift und Größe des Felds — so
        // sieht man beim Einrichten, wie groß sie wird und wo sie sitzt.
        f._text = _ddTextMuster(f); ctx.globalAlpha = 0.35;
        try { _drawText(ctx, f, x, y, fw, fh, pxPerMm); } finally { f._text = null; }
      } else _drawText(ctx, f, x, y, fw, fh, pxPerMm);
    }
    ctx.restore();
  });
}

// ── Palette ───────────────────────────────────────────────────────────────────
// Standard für NEU angelegte statische Felder: true = wird gedruckt (Export), false = nur
// im Editor sichtbar. Per-Feld später im Eigenschaften-Panel überschreibbar (exportEnabled).
let _staticExportDefault = true;

// Strich-Symbole statt Emoji: Emoji rendert je System bunt und in anderer Größe, die
// Symbole hier nehmen die Typfarbe (currentColor) und sitzen überall gleich.
const _SYM = {
  text: '<path d="M3.5 3.5h9M8 3.5v9.5"/>',
  combo: '<rect x="2.5" y="2.5" width="11" height="4.5" rx="1"/><rect x="2.5" y="9" width="11" height="4.5" rx="1"/>',
  image: '<rect x="2" y="2.5" width="12" height="11" rx="1.5"/><circle cx="6" cy="6.3" r="1.2"/><path d="M2.5 12.5l3.5-3.5 2.5 2.5 2-2 3 3"/>',
  number: '<path d="M6.3 2.5 4.8 13.5M11.3 2.5 9.8 13.5M3 6h10.5M2.5 10h10.5"/>',
  motiv: '<path d="M8 2 14 8 8 14 2 8z"/>',
  ddtext: '<path d="M3 13.5 8 2.5l5 11M5.2 9.5h5.6"/>',
  static: '<rect x="3.5" y="7" width="9" height="6.5" rx="1.2"/><path d="M5.5 7V5.2a2.5 2.5 0 0 1 5 0V7"/>',
  druck: '<path d="M4.5 6V2.5h7V6"/><rect x="2" y="6" width="12" height="5.5" rx="1"/><path d="M4.5 9.5h7v4h-7z"/>',
  ausr_left: '<path d="M2.5 4h11M2.5 8h7M2.5 12h9"/>',
  ausr_center: '<path d="M2.5 4h11M4.5 8h7M3.5 12h9"/>',
  ausr_right: '<path d="M2.5 4h11M6.5 8h7M4.5 12h9"/>',
  pfeil: '<path d="M6 3.5 10.5 8 6 12.5"/>',
  muell: '<path d="M3 4.5h10M6.5 4.5V3h3v1.5M4.5 4.5l.6 8.5h5.8l.6-8.5"/>',
  mehrere: '<rect x="2" y="2" width="8" height="8" rx="1.2"/><path d="M6 13.5h6.5a1 1 0 0 0 1-1V6"/>',
  griff: '<circle cx="6" cy="4" r=".9"/><circle cx="10" cy="4" r=".9"/><circle cx="6" cy="8" r=".9"/><circle cx="10" cy="8" r=".9"/><circle cx="6" cy="12" r=".9"/><circle cx="10" cy="12" r=".9"/>',
  nurEditor: '<path d="M4.5 6V2.5h7V6"/><rect x="2" y="6" width="12" height="5.5" rx="1"/><path d="M2 14 14 2"/>',
};
function _sym(k) {
  return `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">${_SYM[k]}</svg>`;
}
// Typfarbe wie auf dem Blatt (.cel): Gravur Akzent, Bild grün, Statisch/Nr. amber.
// Drei Stufen je Typ: Voll (Symbol, Hover), Grund (belegt/gewählt), Rand.
const _TYPFARBE = {
  text: ['var(--accent)', 'var(--accent-glow)', 'var(--accent-rand)'],
  combo: ['var(--combo)', 'var(--combo-dim)', 'var(--combo-rand)'],
  image: ['var(--green)', 'var(--green-dim)', 'var(--green-rand)'],
  number: ['var(--amber)', 'var(--amber-dim)', 'var(--amber-rand)'],
  static: ['var(--amber)', 'var(--amber-dim)', 'var(--amber-rand)'],
};
_TYPFARBE.motiv = _TYPFARBE.ddtext = _TYPFARBE.text;
function _typVars(t) { const [c, d, r] = _TYPFARBE[t] || _TYPFARBE.text; return `--c:${c};--c-dim:${d};--c-rand:${r};`; }
function _feldTyp(f) { return _isCombo(f) ? 'combo' : _istMotiv(f) ? 'motiv' : (f.type === 'text' && f.ddText) ? 'ddtext' : f.type; }

// Oben die Bausteine MIT Nummern (palNum): Text N = Gravur-Zeile N der Bestellung, Bild N = das N-te
// Foto, das der Kunde hochgeladen hat. Bei Statisch ist die Zahl nur der Name.
// Unter dem Trenner die drei ohne Nummer — eine Zahl brächte dort nichts anderes aufs Blatt: die
// Bestellnummer hängt sich selbst an die Gravur am selben Platz, Motiv-Datei bzw. Frage und
// Kombi-Zeilen wählt man rechts. Diese Zeilen sind als Ganzes der Baustein; `zieh`/`anlegen` nur, wo
// Ziehen bzw. Doppelklick nicht über addToCanvas laufen.
const _BAUSTEINE = [
  { typ: 'text', name: 'Text', zahl: true, tip: 'Gravur-Zeile aus der Bestellung' },
  { typ: 'image', name: 'Bild', zahl: true, tip: 'Foto des Kunden — Bild 2 = sein zweites Foto' },
  { typ: 'static', name: 'Statisch', zahl: true, tip: 'Fester Text — wird beim Füllen nie überschrieben' },
  null,
  { typ: 'number', name: 'Bestellnummer', tip: 'Bestellnummer — gehört zur Gravur bzw. zum Bild am selben Platz' },
  { typ: 'motiv', name: 'Motiv', zieh: 'motivfeld', anlegen: 'motivFeldAnlegen()', tip: 'Vektorgrafik: fest für alle Plätze oder je Kundenantwort (z. B. Buchstabe → Monogramm)' },
  { typ: 'ddtext', name: 'Dropdown-Text', zieh: 'ddtextfeld', anlegen: 'ddTextFeldAnlegen()', tip: 'Antwort aus einem Dropdown (z. B. Buchstabe, Sternzeichen) in fester Schrift — der Kasten ist die Höhe eines Großbuchstabens' },
  { typ: 'combo', name: 'Kombi', tip: 'Stapelt Gravur-Zeilen exakt gleich hoch. Zeilen rechts wählen.' },
];
// Anzahl Kacheln je nummeriertem Baustein; per −/+ ab 1, beim Laden mindestens 3.
const _PAL_START = 3;
const _palN = Object.fromEntries(_BAUSTEINE.filter(b => b && b.zahl).map(b => [b.typ, _PAL_START]));

function renderPal() {
  const box = document.getElementById('bausteine');
  if (!box) return;
  // Belegte Nummern hervorheben: so sieht man ohne Suchen, welche Zeile/welches Foto
  // schon liegt. Text-Nummern in einem Kombi-Feld zählen mit.
  const belegt = new Set();
  for (const f of fields) {
    const t = _feldTyp(f);
    belegt.add(t);
    if (_palN[t]) belegt.add(t + ':' + (f.palNum || 1));
    if (_isCombo(f)) f.comboPals.forEach(n => belegt.add('text:' + n));
  }
  box.innerHTML = _BAUSTEINE.map(b => {
    if (!b) return '<div class="bs-trenner"></div>';
    if (!b.zahl) return `<div class="bs-zeile bs-einzel" style="${_typVars(b.typ)}" draggable="true" title="${b.tip} — ziehen oder Doppelklick"
      ondragstart="palDrag(event,'${b.zieh || b.typ}',1)" ondblclick="${b.anlegen || `addToCanvas('${b.typ}',1)`}">
      <span class="bs-ic">${_sym(b.typ)}</span><span class="bs-name">${b.name}</span>
      <span class="bs-chip bs-zieh${belegt.has(b.typ) ? ' belegt' : ''}">${_sym('griff')}</span>
    </div>`;
    const n = _palN[b.typ];
    const kacheln = Array.from({ length: n }, (_, i) => `<span class="bs-chip${belegt.has(b.typ + ':' + (i + 1)) ? ' belegt' : ''}" draggable="true"
      title="${b.name} ${i + 1} — ziehen oder Doppelklick" ondragstart="palDrag(event,'${b.typ}',${i + 1})" ondblclick="addToCanvas('${b.typ}',${i + 1})">${i + 1}</span>`).join('');
    const schalter = b.typ !== 'static' ? '' : `<button class="bs-schalter${_staticExportDefault ? ' an' : ''}"
      title="${_staticExportDefault ? 'Neue statische Felder werden gedruckt' : 'Neue statische Felder nur im Editor, nicht im Export'} — klicken zum Umschalten"
      onclick="setStaticExportDefault(${!_staticExportDefault})">${_sym(_staticExportDefault ? 'druck' : 'nurEditor')}</button>`;
    return `<div class="bs-zeile" style="${_typVars(b.typ)}" title="${b.tip}">
      <span class="bs-ic">${_sym(b.typ)}</span><span class="bs-name">${b.name}</span>${schalter}
      <span class="bs-chips">${kacheln}</span>
      <span class="bs-stufe"><button class="bs-chip neu" title="Eine weniger"${n <= 1 ? ' disabled' : ''} onclick="addPal('${b.typ}',-1)">−</button><button class="bs-chip neu" title="Eine mehr" onclick="addPal('${b.typ}',1)">+</button></span>
    </div>`;
  }).join('');
}

function setStaticExportDefault(v) { _staticExportDefault = !!v; renderPal(); }

function addPal(type, d) {
  _palN[type] = Math.max(1, _palN[type] + d);
  renderPal();
}

let _dt = null, _dn = 0;
function palDrag(e, type, num) { _dt = type; _dn = num; e.dataTransfer.setData('text/plain', type + ':' + num); }

// Motiv aus der Bibliothek aufs Blatt ziehen. Eigener Merker statt _dn, weil ein Motiv
// über den DATEINAMEN identifiziert wird, nicht über eine Palettennummer.
let _dMotiv = null;
function motivDrag(e, name) { _dt = 'motiv'; _dMotiv = name; e.dataTransfer.setData('text/plain', 'motiv:' + name); }

// Drag & Drop auf den Canvas — Registrierung über den zentralen Init am Dateianfang.
function _setupCanvasDrop() {
  const area = document.getElementById('canvas-area');
  area.addEventListener('dragover', e => e.preventDefault());
  area.addEventListener('drop', e => {
    e.preventDefault();
    const wrap = document.getElementById('canvas-wrap');
    const rect = wrap.getBoundingClientRect();
    const x = (e.clientX - rect.left) / MM / zoom;
    const y = (e.clientY - rect.top) / MM / zoom;
    if (_dt) {
      // Text-/Gravur-Feld auf ein Kombi-Feld gezogen → als Zeile aufnehmen (kein neues Feld).
      if (_dt === 'text') {
        const combo = fields.find(f => _isCombo(f) && x >= f.x && x <= f.x + f.w && y >= f.y && y <= f.y + f.h);
        if (combo) { addComboLine(combo.id, _dn); _dt = null; return; }
      }
      if (_dt === 'motiv') { motivAufsBlatt(_dMotiv, x, y); _dt = null; _dMotiv = null; return; }
      if (_dt === 'motivfeld') { motivFeldAnlegen(x, y); _dt = null; return; }
      if (_dt === 'ddtextfeld') { ddTextFeldAnlegen(x, y); _dt = null; return; }
      addToCanvas(_dt, _dn, x, y);
      _dt = null;
    }
  });
}

function addToCanvas(type, num, x, y) {
  saveUndo();
  const p = getPg();
  const id = ++idc;
  // Kombi-Feld = Textfeld mit comboPals-Array (anfangs leer → Zeilen per Drag reinziehen).
  const isCombo = type === 'combo';
  const baseType = isCombo ? 'text' : type;
  const typeName = baseType === 'image' ? 'Bild ' : baseType === 'number' ? 'Bestellnummer ' : baseType === 'static' ? 'Statisch ' : 'Gravur ';
  const field = {
    id, type: baseType, palNum: isCombo ? 1 : num,
    name: isCombo ? 'Kombi' : baseType === 'number' ? 'Bestellnummer' : typeName + num,
    x: x != null ? Math.max(0, x) : p.m + (fields.length % 4) * 25,
    y: y != null ? Math.max(0, y) : p.m + Math.floor(fields.length / 4) * 25,
    w: isCombo ? 60 : baseType === 'image' ? 23 : baseType === 'number' ? 40 : 60,
    h: isCombo ? 16 : baseType === 'image' ? 39 : 6,
    fontSize: baseType === 'number' ? 4 : 10, fontFamily: 'Arial',
    textAlign: 'center', // Ausrichtung standardmäßig mittig
    // Nur Nummern-Felder: wie viele Zeichen der Bestellnummer, von hinten oder vorne
    numChars: baseType === 'number' ? 7 : undefined,
    numFrom: baseType === 'number' ? 'end' : undefined,
    orderId: null,
    _img: null, _text: null,
    // Statische Felder: Text wird separat gespeichert und nie vom Füllen überschrieben
    staticText: baseType === 'static' ? '' : undefined,
    // Statische Felder: Export-Standard kommt aus dem Toggle im Felder-Tab (pro Feld abschaltbar)
    exportEnabled: baseType === 'static' ? _staticExportDefault : undefined,
    // Gravur-Text: Standard = Stauchen (Altan 15.07.) — zu lange Namen werden schmaler
    // gedrückt statt über das Feld zu ragen; per Props-Panel pro Feld umstellbar.
    overflowMode: baseType === 'text' ? 'stauch' : undefined,
    // Kombi-Feld: Liste der Gravur-Nummern (Zeilen). Leer = per Drag befüllen.
    comboPals: isCombo ? [] : undefined,
  };
  _feldAufsBlatt(field);
}
// Neues Feld anlegen, auswählen, alles neu zeichnen — alle Bausteine der Palette.
function _feldAufsBlatt(field) {
  fields.push(field);
  sel = field.id;
  scheduleRender(); renderFieldList(); renderProps();
}

// Motiv-Feld anlegen. Startbreite 30 mm, Höhe aus dem Seitenverhältnis der Datei —
// so liegt es sofort unverzerrt auf dem Blatt und muss nur noch positioniert werden.
async function motivAufsBlatt(name, x, y) {
  if (!name) return;
  const m = await motivPfade(name);
  if (!m) { showToast('❌ Motiv nicht lesbar: ' + name, 4000); return; }
  saveUndo();
  const p = getPg();
  const w = Math.min(30, p.w - 2 * p.m);
  const field = {
    id: ++idc, type: 'motiv', palNum: 1, name: '◆ ' + name,
    motivDatei: name,
    x: x != null ? Math.max(0, x - w / 2) : p.m,
    y: y != null ? Math.max(0, y - motivFeldHoehe(m, w) / 2) : p.m,
    w, h: motivFeldHoehe(m, w),
    orderId: null, _img: null, _text: null,
  };
  _feldAufsBlatt(field);
  showToast('◆ Motiv eingefügt — Breite und Position rechts einstellen');
}

// Zeilen eines Kombi-Felds ändern: aendern(Kopie der Liste) → neue Liste oder null (nichts tun).
// Gilt für das ganze Array — Kopien gravieren dieselben Zeilen wie ihr Master (wie Kreis-Text,
// Drehung, Stauchen). Bis 08.10.2026 änderte sich nur das angeklickte Feld.
function _comboAendern(fieldId, aendern) {
  const f = fields.find(x => x.id === fieldId);
  if (!f || !_isCombo(f)) return false;
  const pals = aendern(f.comboPals.slice());
  if (!pals) return false;
  saveUndo();
  // Gruppen-Schlüssel = erste Zeile
  _applyToArrayGroup(f, x => { x.comboPals = pals.slice(); x.palNum = pals[0] || 1; });
  sel = fieldId;
  scheduleRender(); renderFieldList(); renderProps();
  return true;
}
// Eine Gravur-Zeile (palNum) in ein Kombi-Feld aufnehmen (per Drag aus der Palette).
function addComboLine(fieldId, palNum) {
  if (_comboAendern(fieldId, p => (p.includes(palNum) ? p : [...p, palNum])))
    showToast(`Zeile „Gravur ${palNum}" ins Kombi-Feld übernommen`);
}
function moveComboLine(fieldId, idx, dir) {
  _comboAendern(fieldId, p => {
    const j = idx + dir;
    if (j < 0 || j >= p.length) return null;
    [p[idx], p[j]] = [p[j], p[idx]];
    return p;
  });
}
function removeComboLine(fieldId, idx) {
  _comboAendern(fieldId, p => { p.splice(idx, 1); return p; });
}
// Zeilenabstand (mm) live setzen — Wert- und Schrifthöhen-Anzeige ohne Panel-Neuaufbau
// aktualisieren (sonst würde der Slider beim Ziehen den Fokus verlieren).
function setComboGap(id, mm) {
  const f = fields.find(x => x.id === id);
  if (!f || !_isCombo(f)) return;
  upd(id, 'comboGapMM', mm);
  const gv = document.getElementById('cgap-val-' + id); if (gv) gv.textContent = mm.toFixed(1);
  const lv = document.getElementById('cgap-line-' + id); if (lv) lv.textContent = comboLineHeightsMM(f).ink.toFixed(1);
}

// „Einzelne Zeile mittig" umschalten (siehe comboCenterShiftMM). Wirkt auf ALLE Felder der
// Array-Gruppe — Kopien müssen dasselbe Verhalten haben wie ihr Master, sonst sitzen die
// Gravuren auf einem Blech unterschiedlich hoch.
function setComboCenterSingle(id, an) {
  const f = fields.find(x => x.id === id);
  if (!f || !_isCombo(f)) return;
  upd(id, 'comboCenterSingle', !!an); // trägt Undo-Schritt + Neuzeichnen
  _applyToArrayGroup(f, x => { x.comboCenterSingle = !!an; });
  scheduleRender(); renderProps();
}

// ── Render overlay ────────────────────────────────────────────────────────────
function renderEls() {
  const ov = document.getElementById('ov');
  // orderId → Position EINMAL als Map aufbauen, statt pro Feld findIndex über alle
  // Bestellungen → von O(Felder × Bestellungen) auf O(Felder + Bestellungen).
  const orderIdxMap = window._currentFilteredForFill
    ? new Map(window._currentFilteredForFill.map((o, i) => [o.id, i]))
    : null;
  ov.innerHTML = fields.map(f => {
    const x = f.x * MM * zoom, y = f.y * MM * zoom, w = f.w * MM * zoom, h = f.h * MM * zoom;
    const isS = f.id === sel || multiSel.has(f.id);
    const isI = f.type === 'image';
    const isSta = f.type === 'static';
    // Bestellungsnummer ermitteln — Array-Kopien zeigen IMMER das Label ihres Masters
    // (gleiche Gravur = gleiche Nummer), plus ⿻-Marker
    const lblF = f.arrayOf ? (fields.find(ff => ff.arrayGroup === f.arrayOf) || f) : f;
    let orderIdx;
    if (lblF.orderId && orderIdxMap) {
      const idx = orderIdxMap.get(lblF.orderId);
      orderIdx = idx != null ? idx + 1 : '?';
    } else {
      const sameTypeFields = fields.filter(ff => ff.type === lblF.type && ff.palNum === lblF.palNum && !ff.arrayOf);
      orderIdx = sameTypeFields.indexOf(lblF) + 1;
    }
    // EINE Kette, kein zweiter if-Block: sonst kann ein neuer Zweig den Bild-Zweig still
    // überschreiben.
    let inner = '';
    if (_istMotiv(f)) inner = ''; // Grafik wird auf dem Canvas gezeichnet
    else if (isI) inner = f._img ? `<img src="${f._img.src}" alt="" />` : `<div class="cel-placeholder">🖼</div>`;
    else if (isSta) inner = ''; // Text wird auf Canvas gezeichnet
    else if (f.type === 'number' && !f._text) inner = `<div class="cel-placeholder" style="color:rgba(245,166,35,0.8);font-size:var(--fs-titel);">#</div>`;
    else if (_isCombo(f) && !f._text) inner = `<div class="cel-placeholder" style="font-size:var(--fs-mikro);line-height:1.4;color:var(--combo);text-align:center;">${f.comboPals.length ? f.comboPals.map(pp => 'Gravur ' + pp).join('<br>') : '▤ Text-Feld<br>hierher ziehen'}</div>`;
    else if (!f._text && !f.ddText) inner = `<div class="cel-placeholder">✏️</div>`;
    return `<div class="cel ${isI ? 'img-t' : ''} ${isSta ? 'sta-t' : ''} ${isS ? 'sel' : ''}" id="cel-${f.id}"
      style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;${f.rotation ? `transform:rotate(${f.rotation}deg);` : ''}"
      onmousedown="elDown(event,${f.id})"
>
      <span class="cel-lbl">${_istMotiv(f) ? '◆ ' + _esc(f.ddFrage ? (f._motivDatei || 'aus „' + f.ddFrage + '“') : (f.motivDatei || '—')) :
        f.type === 'number' ? 'Nr. · Best. ' + orderIdx :
          f.type === 'image' ? 'Bild ' + f.palNum + ' · Best. ' + orderIdx :
            f.type === 'static' ? '📝 Statisch' :
              _isCombo(f) ? '▤ Kombi ' + (f.comboPals.length ? f.comboPals.join('/') : '—') + ' · Best. ' + orderIdx :
                f.ddText ? '▾ ' + _esc(f.ddFrage || 'Dropdown') + ' · Best. ' + orderIdx :
                  'Gravur ' + f.palNum + ' · Best. ' + orderIdx
      }${f.arrayOf ? ' ⿻' : ''}</span>
      ${inner}
      <div class="rh" onmousedown="rszDown(event,${f.id})"></div>
    </div>`;
  }).join('');
}

// Liste „Auf dem Blatt": Kopien (Raster „Gravur 1 (2)", Array-Kopien mit gleichem Namen,
// „(Kopie)") stehen als EINE Zeile mit ×n — bei 12–61 Feldern je Blatt war die Liste sonst
// endlos. Pfeil links klappt die einzelnen Kopien auf (Nummer + Position in mm).
const _flOffen = new Set();   // aufgeklappte Gruppen (Schlüssel Typ|Grundname)
let _flSchluessel = [];       // Index → Schlüssel für die onclick-Aufrufe der letzten Liste
function _flGrundname(f) { return String(f.name).replace(/^◆\s*/, '').replace(/\s*\((\d+|Kopie)\)$/, '').trim(); }
function toggleFlGruppe(i) {
  const k = _flSchluessel[i];
  if (_flOffen.has(k)) _flOffen.delete(k); else _flOffen.add(k);
  renderFieldList();
}

function renderFieldList() {
  const el = document.getElementById('field-list');
  document.getElementById('fc').textContent = fields.length;
  renderPal(); // belegte Nummern in den Bausteinen nachziehen
  if (!fields.length) { el.innerHTML = '<div class="uempty">Noch leer</div>'; return; }
  const gruppen = new Map();
  for (const f of fields) {
    const k = _feldTyp(f) + '|' + _flGrundname(f);
    if (!gruppen.has(k)) gruppen.set(k, []);
    gruppen.get(k).push(f);
  }
  _flSchluessel = [...gruppen.keys()];
  const mm = v => (+v).toFixed(1).replace('.', ',').replace(',0', '');
  const pfeil = `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3.5 10.5 8 6 12.5"/></svg>`;
  el.innerHTML = _flSchluessel.map((k, gi) => {
    const fs = gruppen.get(k), f0 = fs[0], t = _feldTyp(f0);
    const offen = fs.length > 1 && _flOffen.has(k);
    const gleich = fs.every(f => f.w === f0.w && f.h === f0.h);
    const auf = fs.length > 1
      ? `<span class="fl-auf${offen ? ' offen' : ''}" title="${offen ? 'Zuklappen' : 'Kopien einzeln zeigen'}" onclick="event.stopPropagation();toggleFlGruppe(${gi})">${pfeil}</span>`
      : '<span class="fl-auf"></span>';
    const kopf = `
    <div class="fl-zeile${!offen && fs.some(f => f.id === sel) ? ' sel' : ''}" style="${_typVars(t)}" onclick="selectF(${f0.id})">
      ${auf}${_sym(_SYM[t] ? t : 'text')}
      <span class="fl-name">${_esc(fs.length > 1 ? _flGrundname(f0) : String(f0.name).replace(/^◆\s*/, ''))}</span>
      ${fs.length > 1 ? `<span class="fl-anzahl">×${fs.length}</span>` : ''}
      <span class="fl-mass">${gleich ? f0.w.toFixed(0) + '×' + f0.h.toFixed(0) : ''}</span>
    </div>`;
    if (!offen) return kopf;
    return kopf + fs.map((f, i) => `
    <div class="fl-zeile fl-kind${f.id === sel ? ' sel' : ''}" style="${_typVars(t)}" onclick="selectF(${f.id})">
      <span class="fl-name">${i + 1}</span>
      <span class="fl-mass">${mm(f.x)} / ${mm(f.y)}</span>
    </div>`).join('');
  }).join('');
}

// ── Select & Props ────────────────────────────────────────────────────────────
function toggleMultiMode() {
  multiMode = !multiMode;
  const btn = document.getElementById('multisel-btn');
  _setAn(btn, multiMode);
  btn.textContent = multiMode ? 'Auswahl aktiv' : 'Mehrfach-Auswahl';
  if (!multiMode) {
    multiSel.clear();
    _syncSelectionClasses(); renderProps(); // nur Markierungen — kein Overlay-Rebuild
  }
}

// Geometrie EINES Feldes direkt am Overlay setzen. Pflicht fürs Ziehen/Resizen:
// renderEls() erzeugte sonst pro Frame alle <img src="dataURL"> neu → Ruckeln.
function _syncCelGeometry(id) {
  const f = fields.find(x => x.id === id);
  const el = document.getElementById('cel-' + id);
  if (!f || !el) return;
  el.style.left = (f.x * MM * zoom) + 'px';
  el.style.top = (f.y * MM * zoom) + 'px';
  el.style.width = (f.w * MM * zoom) + 'px';
  el.style.height = (f.h * MM * zoom) + 'px';
}
// Leichter Render-Pfad fürs Live-Ziehen/Resizen: nur aktives Feld bewegen + Canvas neu.
let _liveTimer = null;
function liveRender(id) {
  if (_liveTimer) cancelAnimationFrame(_liveTimer);
  _liveTimer = requestAnimationFrame(() => {
    _liveTimer = null;
    _syncCelGeometry(id);
    drawCanvas();
  });
}

// Debounce für renderEls/drawCanvas
let _renderTimer = null;
function scheduleRender() {
  if (_renderTimer) cancelAnimationFrame(_renderTimer); // letztes Frame immer ausführen
  _renderTimer = requestAnimationFrame(() => {
    _renderTimer = null;
    renderEls(); drawCanvas();
  });
}

// NUR die Auswahl-Markierung. Über renderEls würde das komplette Overlay per innerHTML
// neu entstehen und der Browser alle dataURL-<img> neu dekodieren (S01/Schlüsselanhänger:
// 48–61 Felder). Auswahl ändert weder Geometrie noch Inhalt → nur .sel-Klassen togglen.
function _syncSelectionClasses() {
  for (const f of fields) {
    const el = document.getElementById('cel-' + f.id);
    if (el) el.classList.toggle('sel', f.id === sel || multiSel.has(f.id));
  }
}

function selectF(id, multi) {
  if (multi || multiMode) {
    if (multiSel.has(id)) multiSel.delete(id);
    else multiSel.add(id);
    if (multiSel.size > 0) sel = id;
  } else {
    multiSel.clear();
    sel = id;
  }
  // Sofort Props updaten (kein Canvas nötig)
  renderProps();
  renderFieldList();

  // Schnellpfad: nur Markierungen umschalten — kein Overlay-Rebuild, kein Canvas-Redraw
  _syncSelectionClasses();
}

// Die 4 Raster-Eingaben — identisch in Einzel- UND Mehrfachauswahl-Panel.
function _gridInputsHTML() {
  return `
          <div class="row2" style="margin-bottom:6px;">
            <div class="ig"><span class="il">Spalten</span><input type="number" id="rep-cols" value="${_gridSettings.cols}" min="1" max="20" oninput="_readGridSettings()"/></div>
            <div class="ig"><span class="il">Zeilen</span><input type="number" id="rep-rows" value="${_gridSettings.rows}" min="1" max="50" oninput="_readGridSettings()"/></div>
          </div>
          <div class="row2" style="margin-bottom:6px;">
            <div class="ig"><span class="il">Abstand X (mm)</span><input type="number" id="rep-gap-x" value="${_gridSettings.gapX}" min="0" step="0.5" oninput="_readGridSettings()"/></div>
            <div class="ig"><span class="il">Abstand Y (mm)</span><input type="number" id="rep-gap-y" value="${_gridSettings.gapY}" min="0" step="0.5" oninput="_readGridSettings()"/></div>
          </div>`;
}

// Segment-Button (Automatisch/Manuell, Links/Mitte/Rechts, Vorschau-Modi) — EIN
// Stil-Bauplan. `extra` hängt zusätzliche CSS-Deklarationen an.
// Aussehen steht in .wahl-knopf (Stilvorlage); fontSize bleibt nur der Aufrufer wegen stehen.
function _segBtn(active, onclick, label, title, extra = '') {
  return `<button class="wahl-knopf${active ? ' an' : ''}" onclick="${onclick}" title="${title}"${extra ? ` style="${extra}"` : ''}>${label}</button>`;
}

// Inhalt des rechten Panels, wenn kein Feld gewählt ist — kompakter Schnellstart
function _propsEmptyHTML() {
  return `
    <div style="padding:6px 2px 2px;">
      <div class="umut" style="text-align:center;margin-bottom:14px;">Kein Feld gewählt</div>
      <div class="ulabel" style="margin-bottom:8px;">Schnellstart</div>
      <div style="display:flex;flex-direction:column;gap:9px;font-size:var(--fs-klein);color:var(--text-dim);line-height:1.4;">
        <div><span style="color:var(--accent);">▦</span> <b style="color:var(--text);">Felder</b> — Feld auf das Blatt ziehen</div>
        <div><span style="color:var(--accent);">⬇</span> <b style="color:var(--text);">Laden</b> — Bestellungen von Amazon holen</div>
        <div><span style="color:var(--green);">▶</span> <b style="color:var(--text);">Layout</b> — Layout laden, mit Bestellungen füllen, exportieren</div>
        <div><span style="color:var(--accent);">↓</span> <b style="color:var(--text);">Export</b> — als PDF / DXF / PNG sichern</div>
      </div>
      <div class="umut10" style="margin-top:16px;text-align:center;line-height:1.6;border-top:1px solid var(--border);padding-top:12px;">
        Klicke ein Feld an, um es zu bearbeiten.<br/>Shift+Klick für Mehrfach-Auswahl · <span style="color:var(--text-dim);">⌨ Tastenkürzel</span>
      </div>
    </div>`;
}

// Bestellnummer-Feld: was aus einer Nummer wird (Zeichen/Von) — gefüllt aus der echten,
// sonst an einem Muster. Gleiche Regel wie _applyNumberToField.
const _NR_BEISPIEL = '304-1234567-7654321';
function _nrMuster(f) {
  const id = f.orderId || _NR_BEISPIEL, n = f.numChars || 7;
  return (f.numFrom || 'end') === 'end' ? id.slice(-n) : id.slice(0, n);
}
function _nrMusterZeigen(id) {
  const f = fields.find(x => x.id === id), el = document.getElementById('nr-muster-' + id);
  if (f && el) el.textContent = _nrMuster(f);
}

// ── Eigenschaften (rechte Leiste) ─────────────────────────────────────────────
// Ein Aufbau für alle Feldtypen, von oben nach unten nach Gebrauch:
//   Kopf (Symbol + Name, darunter Typ, Array, Bestellung) → Position & Größe →
//   die Karte des Feldtyps → Füllen (ASIN) → einklappbar Dropdown und Raster → Löschen.
// Erklärungen stehen im title-Tooltip, nicht als Fließtext. Dropdown und Raster sind zu, solange sie
// nichts tun; ihr Auf/Zu merkt sich der Browser.
const _ppOffen = (() => { try { return JSON.parse(localStorage.getItem('pp-offen')) || {}; } catch (_) { return {}; } })();
function ppKlapp(k) {
  _ppOffen[k] = !_ppOffen[k];
  try { localStorage.setItem('pp-offen', JSON.stringify(_ppOffen)); } catch (_) { }
  renderProps();
}
const _PP_TYP = { text: 'Text', combo: 'Kombi', image: 'Bild', number: 'Bestellnummer', static: 'Statischer Text', motiv: 'Motiv', ddtext: 'Dropdown-Text' };

// Segment-Schalter: items = [[aktiv, onclick, beschriftung, tooltip], …]
function _seg(items) {
  return `<div class="seg">${items.map(([an, klick, lbl, tip]) =>
    `<button class="seg-b${an ? ' an' : ''}" onclick="${klick}" title="${tip || ''}">${lbl}</button>`).join('')}</div>`;
}
function _ppFeld(label, inhalt, tip) {
  return `<div class="pp-feld"${tip ? ` title="${tip}"` : ''}><span class="il">${label}</span>${inhalt}</div>`;
}
function _ppKarte(titel, inhalt, farbe, extra = '') {
  return `<div class="pgrp"${farbe ? ` style="--c:${farbe};"` : ''}${extra}><div class="pgrp-titel"${farbe ? ' style="color:var(--c);"' : ''}>${titel}</div>${inhalt}</div>`;
}
function _ppKlappKarte(k, titel, info, inhalt) {
  const offen = !!_ppOffen[k];
  return `<div class="pgrp pp-klapp${offen ? ' offen' : ''}">
    <button class="pgrp-titel pp-klapp-kopf" onclick="ppKlapp('${k}')">${titel}<span class="pp-klapp-info">${info || ''}</span>${_sym('pfeil')}</button>
    ${offen ? inhalt : ''}</div>`;
}
function _ppAusrichtung(f) {
  const a = f.textAlign || 'center';
  return _seg([['left', 'Links'], ['center', 'Mittig'], ['right', 'Rechts']].map(([v, tip]) =>
    [a === v, `upd(${f.id},'textAlign','${v}');renderProps();drawCanvas()`, _sym('ausr_' + v), tip]));
}
function _ppPt(f, std) {
  return `<input type="number" value="${f.fontSize || std}" min="1" max="200" oninput="upd(${f.id},'fontSize',_numIn(this.value));drawCanvas()"/>`;
}
function _ppKreis(f) {
  if (!(f.circleDia > 0)) return '';
  const fill = circleFillFactor(f), over = fill > 1;
  return `<div class="pp-kreis${over ? ' zuviel' : ''}" title="Anteil des Kreisumfangs, den der befüllte Text belegt. Braucht im DXF „Vektor-Pfade“.">
      <span>◠ Kreis Ø ${f.circleDia} mm · ${f.circleSide === 'bottom' ? 'unten' : 'oben'}</span><b>${fill ? Math.round(fill * 100) + ' %' : '—'}</b></div>
    ${over ? '<div class="pp-warn">Text läuft über den Kreis hinaus — Ø größer oder Schrift kleiner.</div>' : ''}`;
}
// Welche Gravur-Zeile (Text) bzw. welches Kundenfoto (Bild) ein Feld zeigt, nachträglich umstellen.
// Der Standardname („Gravur 1“, „Bild 1 (3)“) zieht mit, eigene Namen bleiben; Array-Kopien gehen mit
// ihrem Master.
function setPalNr(id, n) {
  const f = fields.find(x => x.id === id);
  const wort = f && f.type === 'text' && !_isCombo(f) ? 'Gravur' : f && f.type === 'image' ? 'Bild' : null;
  if (!wort || (f.palNum || 1) === n) return;
  saveUndo();
  _applyToArrayGroup(f, x => {
    x.name = String(x.name).replace(new RegExp('^' + wort + ' ' + (x.palNum || 1) + '(?=$| \\()'), wort + ' ' + n);
    x.palNum = n;
  });
  if (_palN[f.type] < n) _palN[f.type] = n;
  scheduleRender(); renderFieldList(); renderProps();
}

function renderProps() {
  _updateModifyBar(); // Array-/Dreh-Buttons in der Kopfleiste je nach Auswahl schalten
  const el = document.getElementById('props');
  // Inspektor-Spalte nur ausfahren, wenn wirklich etwas ausgewählt ist.
  const ws = document.querySelector('.workspace');
  if (ws) ws.classList.toggle('hat-auswahl', !!sel || multiSel.size > 0);
  if (!sel && multiSel.size === 0) { el.innerHTML = _propsEmptyHTML(); return; }

  // Mehrfachauswahl: nur was gemeinsam geht — wiederholen und löschen.
  if (multiSel.size > 1) {
    el.innerHTML = `
    <div class="pp">
      <div class="pp-kopf" style="${_typVars('text')}"><span class="bs-ic">${_sym('mehrere')}</span><span class="pp-titel">${multiSel.size} Felder</span></div>
      ${_ppKarte('Gemeinsam wiederholen', `
        ${_gridInputsHTML()}
        <button class="btn btn-umriss btn-full" onclick="repeatMulti('grid')">⊞ Raster erstellen</button>
        <div class="row2" style="margin-top:6px;">
          <button class="btn btn-muted btn-full" onclick="repeatMulti('right')">→ Rechts</button>
          <button class="btn btn-muted btn-full" onclick="repeatMulti('down')">↓ Unten</button>
        </div>`)}
      <button class="btn btn-red btn-full" onclick="deleteMulti()">${_sym('muell')} Alle löschen</button>
    </div>`;
    return;
  }
  const f = fields.find(x => x.id === sel);
  if (!f) return;
  const t = _feldTyp(f);
  const id = f.id;
  const teile = [];

  // ── Kopf: Symbol + Name, darunter Typ · Array · Bestellung ──
  // Typ nur nennen, wenn der Name ihn nicht schon sagt (Feld „Bild 1" vom Typ Bild).
  const name = String(f.name).replace(/^◆\s*/, '');
  const typ = _PP_TYP[t] || 'Feld';
  const marken = name.toLowerCase().startsWith(typ.toLowerCase().slice(0, 6)) ? [] : [`<span class="pp-marke">${typ}</span>`];
  if (f.arrayGroup) marken.push(`<span class="pp-marke" title="Array: die Kopien zeigen dieselbe Bestellung">Array ×${1 + fields.filter(x => x.arrayOf === f.arrayGroup).length}</span>`);
  if (f.arrayOf) marken.push('<span class="pp-marke" title="Kopie eines Arrays — Inhalt kommt vom Master">Array-Kopie</span>');
  if (f.orderId) marken.push(`<button class="pp-marke pp-auftrag" onclick="_copyText('${_jsStr(f.orderId)}')" title="Bestellnummer kopieren">${_esc(f.orderId)}</button>`);
  else if (t !== 'static' && t !== 'motiv') marken.push('<span class="pp-marke pp-leer" title="Wird beim Füllen belegt">leer</span>');
  teile.push(`
    <div class="pp-kopf" style="${_typVars(t)}">
      <span class="bs-ic">${_sym(_SYM[t] ? t : 'text')}</span>
      <input class="pp-name" value="${_esc(name)}" oninput="upd(${id},'name',this.value)" title="Name des Felds"/>
    </div>
    ${marken.length ? `<div class="pp-meta">${marken.join('')}</div>` : ''}`);

  // ── Position & Größe ──
  teile.push(_ppKarte('Position & Größe <span class="umut10">mm</span>', `
    <div class="row2">
      <div class="ig"><span class="il">X</span><input type="number" value="${f.x.toFixed(1)}" step="0.5" oninput="upd(${id},'x',_numIn(this.value))"/></div>
      <div class="ig"><span class="il">Y</span><input type="number" value="${f.y.toFixed(1)}" step="0.5" oninput="upd(${id},'y',_numIn(this.value))"/></div>
      <div class="ig"><span class="il">Breite</span><input type="number" value="${f.w.toFixed(1)}" step="0.5" min="1" oninput="upd(${id},'w',_numIn(this.value))"/></div>
      <div class="ig"><span class="il">Höhe</span><input type="number" value="${f.h.toFixed(1)}" step="0.5" min="1" oninput="upd(${id},'h',_numIn(this.value))"/></div>
    </div>`));

  // ── Erst „wenn", dann „was" (Nutzer 26.09.): welche Bestellungen (ASIN) und ob graviert
  //    wird (Bedingung) stehen VOR der Karte des Feldtyps — die Bedingung entscheidet, ob das
  //    Motiv/der Text überhaupt kommt. Zugeklappt kostet sie oben nur eine Zeile.
  // Füllen: ASIN je Feld (nur wenn das Layout nicht eine ASIN für alle hat)
  if ((f.type === 'image' || f.type === 'text') && !getSingleAsinMode()) {
    teile.push(_ppKarte('Füllen', _ppFeld('Nur ASIN', `<input class="pp-mono" value="${_esc(f.filterAsin || '')}" placeholder="alle"
      oninput="upd(${id},'filterAsin',this.value.trim().toUpperCase())"/>`, 'Nur Bestellungen dieser ASIN in dieses Feld füllen')));
  }

  // ── Dropdown: offen, sobald es etwas tut. Am Motivfeld nur die Bedingung — „Je Antwort"
  //    steht dort schon in der Karte Motiv. ──
  if ((f.type === 'text' || f.type === 'image' || _istMotiv(f)) && !f.arrayOf && !f.ddText) {
    // Motiv- und Bildfelder haben hier NUR die Bedingung → so heißt der Bereich auch. „Dropdown"
    // ließ am Motivfeld glauben, hier ordne man Motive zu (26.09.).
    const motiv = _istMotiv(f), titel = motiv || f.type === 'image' ? 'Bedingung' : 'Dropdown';
    const inhalt = `<div class="dd-grp">${_ddFeldHTML(f, motiv ? 'bedingung' : undefined)}</div>`;
    if (f.ddWenn || (!motiv && f.ddFrage)) teile.push(_ppKarte(titel, inhalt, 'var(--accent)'));
    else teile.push(_ppKlappKarte('dd', titel, '', inhalt));
  }

  // ── Karte des Feldtyps ──
  const kreis = f.circleDia > 0;
  if (t === 'text') {
    const nMax = Math.max(_palN.text, f.palNum || 1, 4);
    const gravur = _ppNrChips(f, nMax, n => `Gravur ${n} der Bestellung`);
    const auto = f.autoFit !== false;
    teile.push(_ppKarte('Text', `
      ${_ppFeld('Gravur', `<div class="pp-chips" style="${_typVars('text')}">${gravur}</div>`, 'Welche Gravur-Zeile der Bestellung hier steht')}
      <div class="row2">
        ${_ppFeld('Ausrichtung', _ppAusrichtung(f))}
        ${kreis ? _ppFeld('Größe (pt)', _ppPt(f, 10), 'Kreis-Text hat immer eine feste Größe')
        : _ppFeld('Höhe', _seg([
          [auto, `upd(${id},'autoFit',true);renderProps();drawCanvas()`, 'Auto', 'Schrift füllt die Feldhöhe exakt'],
          [!auto, `upd(${id},'autoFit',false);renderProps();drawCanvas()`, 'Fest', 'Feste Schriftgröße in pt']]))}
      </div>
      ${!kreis && !auto ? _ppFeld('Größe (pt)', _ppPt(f, 10)) : ''}
      ${_ppFeld('Schrift', _ppSchrift(f), 'Gilt für alle Felder mit dieser Gravur-Nummer. Bringt die Bestellung eine eigene Schrift mit, gilt deren Schrift – außer bei „Text aus Dropdown“.')}
      ${!kreis && auto ? _ppFeld('Zu breit', _seg([
            [f.overflowMode === 'stauch', `setOverflowMode(${id},'stauch')`, 'Stauchen', 'Höhe bleibt exakt — zu lange Namen werden nur schmaler gedrückt, bis sie ins Feld passen (wie X-Achse verkleinern an der Maschine)'],
            [!f.overflowMode, `setOverflowMode(${id},'ok')`, 'Übersteht', 'Zu langer Text ragt links/rechts über das Feld hinaus und wird NICHT abgeschnitten — Höhe bleibt exakt'],
            [f.overflowMode === 'hybrid', `setOverflowMode(${id},'hybrid')`, 'Hybrid', 'Erst bis 20 % stauchen; reicht das nicht, wird die Schrift zusätzlich kleiner (Gravur dann niedriger als die Feldhöhe)']])) : ''}
      ${_ppKreis(f)}`, 'var(--accent)'));
  }
  else if (t === 'ddtext') {
    // Baustein „Dropdown-Text“: nur, was ein Mitarbeiter einstellt — Frage, Text, Schrift, Höhe, Bedingung.
    const asins = _ddAsinsImEditor();
    const fragen = asins.length ? (_ddFragen(asins, _ddPropsNeu) || []) : [];
    const akt = f.ddFrage || '';
    // Noch keine Frage, aber die Bestellungen kennen eine Buchstaben-Frage → gleich nehmen.
    const e = akt ? fragen.find(q => _ddNorm(q.frage) === _ddNorm(akt)) : null;
    const opt = ['<option value="">— Frage wählen —</option>', ...fragen.map(q =>
      `<option value="${_esc(q.frage)}"${_ddNorm(q.frage) === _ddNorm(akt) ? ' selected' : ''}>${_esc(q.frage)}</option>`)];
    if (akt && !e) opt.push(`<option value="${_esc(akt)}" selected>${_esc(akt)}</option>`);
    const tabelle = f.ddModus === 'tabelle';
    const werte = !e ? [] : e.thema === 'buchstabe' ? _ddKachelWerte({}, e) : _ddWerteSortiert(e);
    teile.push(_ppKarte('Dropdown-Text', `
      ${_ppFeld('Frage', `<select onchange="if(this.value==='__eintippen'){this.value='${_jsStr(akt)}';ddFrageEingeben(${id});}else ddSetzen(${id},{ddFrage:this.value||null,ddModus:null})">${opt.join('')}<option value="__eintippen">Andere Frage eintippen …</option></select>`, 'Aus welchem Dropdown die Antwort kommt — fehlt sie in der Liste, eintippen (genau wie bei Amazon)')}
      ${!fragen.length && asins.length ? `<div class="umut10 dd-hinweis">Aus den bisherigen Bestellungen dieser ASIN ist noch kein Dropdown bekannt — <a href="#" onclick="ddFrageEingeben(${id});return false;">Frage eintippen</a></div>` : ''}
      ${akt ? _ppFeld('Graviert wird', _ddModusWahl(f), 'Eigener Text: je Antwort festlegen, was graviert wird — leer = nichts') : ''}
      ${akt && tabelle ? _ddTextTabelle(f, werte) : ''}
      ${_ppFeld('Schrift', _ppSchrift(f), 'Schriften kommen aus dem Reiter „Schriften“')}
      ${_ppFeld('Höhe (mm)', `<input type="number" value="${f.h.toFixed(1)}" step="0.5" min="1" oninput="upd(${id},'h',_numIn(this.value))"/>`, 'Höhe eines Großbuchstabens — gilt für alle Plätze')}
      <div class="umut10" style="line-height:1.5;margin-top:4px;">Der Kasten ist die Höhe eines Großbuchstabens — für alle Plätze gleich. Unterlängen (J, P, Y …) ragen unten heraus, zu lange Antworten werden auf die Kastenbreite gestaucht.</div>
      <div class="dd-grp" style="margin-top:8px;">${_ddFeldHTML(f, 'bedingung')}</div>`, 'var(--accent)'));
  }
  else if (t === 'combo') {
    // Zeilen per Klick wählen (gefüllt = drin); Reinziehen aufs Blatt geht weiter.
    const nMax = Math.max(_palN.text, 4, ...f.comboPals);
    const wahl = Array.from({ length: nMax }, (_, i) => {
      const n = i + 1, k = f.comboPals.indexOf(n); return `<button class="bs-chip${k >= 0 ? ' belegt' : ''}" title="Gravur ${n} ${k >= 0 ? 'herausnehmen' : 'aufnehmen'}"
      onclick="${k >= 0 ? `removeComboLine(${id},${k})` : `addComboLine(${id},${n})`}">${n}</button>`;
    }).join('');
    const mehr = f.comboPals.length > 1;
    teile.push(_ppKarte('Kombi', `
      ${_ppFeld('Zeilen', `<div class="pp-chips">${wahl}</div>`, 'Alle Zeilen exakt gleich hoch — feste Größe, unabhängig von h/g/Umlaut')}
      ${mehr ? `<div class="kb-liste">${f.comboPals.map((pp, i) => `
        <div class="kb-zeile">
          <span class="kb-nr">${i + 1}</span><span class="kb-name">Gravur ${pp}</span>
          <button class="kb-pfeil" title="nach oben" onclick="moveComboLine(${id},${i},-1)" ${i === 0 ? 'disabled' : ''}>↑</button>
          <button class="kb-pfeil" title="nach unten" onclick="moveComboLine(${id},${i},1)" ${i === f.comboPals.length - 1 ? 'disabled' : ''}>↓</button>
        </div>`).join('')}</div>
      <div class="pp-feld" title="Echte Lücke zwischen den Zeilen in mm. Die Schrift passt sich an, damit die Zeilen den Slot füllen.">
        <span class="il hsb"><span>Zeilenabstand</span><span class="pp-wert"><span id="cgap-val-${id}">${(f.comboGapMM ?? 1).toFixed(1)}</span> mm</span></span>
        <input type="range" min="0" max="5" step="0.1" value="${f.comboGapMM ?? 1}" style="width:100%;" oninput="setComboGap(${id}, +this.value)"/>
        <span class="il hsb"><span>Höhe je Zeile</span><span class="pp-wert"><b id="cgap-line-${id}">${comboLineHeightsMM(f).ink.toFixed(1)}</b> mm</span></span>
      </div>
      ${_ppFeld('Leere Zeilen', _seg([
      [f.comboCenterSingle === false, `setComboCenterSingle(${id},false)`, 'Oben bündig', 'Der Block bleibt an der Feldoberkante. Wirkt nur bei teilweise befüllten Bestellungen.'],
      [f.comboCenterSingle !== false, `setComboCenterSingle(${id},true)`, 'Mittig', 'Weniger befüllte Zeilen → der Block rutscht mittig in den Slot (eine Zeile: ' + comboCenterShiftMM(f, 1, comboFontSizePt(f) * PT_MM).toFixed(1) + ' mm). Zeilenhöhe bleibt gleich.']]))}` : ''}
      ${_ppFeld('Ausrichtung', _ppAusrichtung(f))}
      ${!kreis ? _ppFeld('Zu breit', _seg([
        [f.overflowMode === 'stauch', `setOverflowMode(${id},'stauch')`, 'Stauchen', 'Höhe bleibt exakt — zu lange Namen werden nur schmaler gedrückt'],
        [!f.overflowMode, `setOverflowMode(${id},'ok')`, 'Übersteht', 'Zu langer Text ragt links/rechts über das Feld hinaus — Höhe bleibt exakt']])) : ''}
      ${_ppKreis(f)}`, 'var(--combo)'));
  }
  else if (t === 'number') {
    const von = f.numFrom || 'end';
    teile.push(_ppKarte('Bestellnummer', `
      <div class="row2">
        ${_ppFeld('Zeichen', `<input type="number" value="${f.numChars || 7}" min="1" max="30" oninput="upd(${id},'numChars',_numIn(this.value));_nrMusterZeigen(${id})"/>`)}
        ${_ppFeld('Von', _seg([
      [von === 'end', `upd(${id},'numFrom','end');renderProps()`, 'Hinten', 'Die letzten Zeichen'],
      [von === 'start', `upd(${id},'numFrom','start');renderProps()`, 'Vorne', 'Die ersten Zeichen']]))}
      </div>
      ${_ppFeld('Ergebnis', `<div class="nr-muster" id="nr-muster-${id}">${_esc(_nrMuster(f))}</div>`, 'Aus ' + _esc(f.orderId || _NR_BEISPIEL))}
      ${kreis ? _ppFeld('Größe (pt)', _ppPt(f, 4), 'Kreis-Text hat immer eine feste Größe') : ''}
      ${_ppKreis(f)}`, 'var(--amber)'));
  }
  else if (t === 'static') {
    const an = f.exportEnabled !== false;
    teile.push(_ppKarte('Statischer Text', `
      <textarea class="pp-text" style="font-family:'${_esc(_feldSchrift(f).replace(/'/g, "\\'"))}';" placeholder="Text eingeben…"
        oninput="updStatic(${id}, this.value)" title="Wird beim Füllen nie überschrieben">${_esc(f.staticText)}</textarea>
      <div class="row2">
        ${_ppFeld('Größe (pt)', _ppPt(f, 10))}
        ${_ppFeld('Ausrichtung', _ppAusrichtung(f))}
      </div>
      ${_ppFeld('Im Export', _seg([
      [an, `setStaticExport(${id},true)`, 'Gedruckt', 'Erscheint in PDF/PNG/DXF'],
      [!an, `setStaticExport(${id},false)`, 'Nur Editor', 'Nur im Editor sichtbar (ausgegraut), in keinem Export']]))}
      ${_ppKreis(f)}`, 'var(--amber)'));
  }
  else if (t === 'image') {
    const nMax = Math.max(_palN.image, f.palNum || 1);
    const foto = _ppNrChips(f, nMax, n => `${n}. Foto des Kunden`);
    teile.push(_ppKarte('Bild', `
      ${_ppFeld('Foto', `<div class="pp-chips" style="${_typVars('image')}">${foto}</div>`, 'Welches Foto des Kunden — die meisten laden nur eins hoch')}
      ${f._img ? `<img class="pp-bild pp-bild-abstand" src="${f._img.src}" alt=""/>` : '<div class="pp-bild pp-bild-leer pp-bild-abstand">Kein Bild</div>'}
      <input type="file" id="img-swap-${id}" accept="image/*" style="display:none" onchange="swapImage(${id},this)"/>
      <button class="btn btn-muted btn-full" onclick="document.getElementById('img-swap-${id}').click()" title="Eigenes Bild in dieses Feld laden">Bild austauschen</button>`, 'var(--green)'));
  }
  else if (t === 'motiv') {
    // Fest = eine Datei für alle Plätze (motivDatei). Je Antwort = Motiv zur Kundenantwort
    // (ddFrage + ddTabelle); gespeichert zählt allein ddFrage, _motivJeAntwort hält nur die
    // Anzeige, solange noch keine Frage gewählt ist.
    const jeAntwort = !!f.ddFrage || _motivJeAntwort.has(id);
    const m = _motivCache[f.motivDatei];
    if (f.motivDatei && !m) motivPfade(f.motivDatei).then(() => { if (sel === id) renderProps(); });
    const passt = m ? Math.abs(f.h - motivFeldHoehe(m, f.w)) < 0.01 * f.h : true;
    const fest = f.motivDatei ? `
      <button class="pp-motiv" onclick="motivFestWaehlen(${id})" title="Anderes Motiv wählen · geht als Kontur auf Layer „Motiv“ in die DXF">
        <span class="pp-motiv-bild"><img src="${_ddVorschauUrl(f.motivDatei)}" alt=""/></span>
        <span style="flex:1;min-width:0;">
          <span class="u11 pp-motiv-name">${_esc(f.motivDatei)}</span>
          <span class="umut10" style="display:block;margin-top:3px;">${m ? +m.breite.toFixed(1) + ' × ' + +m.hoehe.toFixed(1) + ' mm · ' + m.pfade.length + ' Pfade' : 'lädt…'}</span>
        </span>
      </button>
      ${passt ? '' : `<div class="pp-warn">Seitenverhältnis weicht von der Datei ab — das Motiv wird eingepasst, nicht verzerrt.</div>
      <button class="btn btn-umriss btn-full" onclick="motivHoeheAngleichen(${id})">⇔ Höhe angleichen</button>`}`
      : `<button class="btn btn-umriss btn-full" onclick="motivFestWaehlen(${id})">◆ Motiv wählen</button>`;
    teile.push(_ppKarte('Motiv', `
      ${_seg([
      [!jeAntwort, `motivModus(${id},false)`, 'Fest', 'Eine Datei für alle Plätze'],
      [jeAntwort, `motivModus(${id},true)`, 'Je Antwort', 'Motiv zur Antwort des Kunden, z. B. Buchstabe → Monogramm']])}
      <div class="pp-motiv-inhalt">${!jeAntwort ? fest
        : f.arrayOf ? '<div class="umut10">Wird am ersten Feld des Arrays eingestellt.</div>'
          : `<div class="dd-grp">${_ddFeldHTML(f, 'motiv')}</div>`}</div>`, 'var(--accent)'));
  }

  // ── Raster ──
  teile.push(_ppKlappKarte('raster', 'Raster', `${_gridSettings.cols} × ${_gridSettings.rows}`, `
    ${_gridInputsHTML()}
    <button class="btn btn-umriss btn-full" onclick="repeatField(${id})" title="Feld als Raster vervielfältigen — je Platz eine eigene Bestellung">⊞ Raster erstellen</button>`));

  teile.push(`<button class="btn btn-red btn-full" onclick="delF(${id})">${_sym('muell')} Löschen</button>`);
  el.innerHTML = `<div class="pp">${teile.join('')}</div>`;
}

// Nummern-Knöpfe 1…nMax (welche Gravur-Zeile bzw. welches Foto) — Text- und Bildkarte.
function _ppNrChips(f, nMax, titel) {
  return Array.from({ length: nMax }, (_, i) => `<button class="bs-chip${(f.palNum || 1) === i + 1 ? ' belegt' : ''}"
      onclick="setPalNr(${f.id},${i + 1})" title="${titel(i + 1)}">${i + 1}</button>`).join('');
}

// Statisches Feld: im Export zeigen oder nur im Editor.
function setStaticExport(id, an) {
  const f = fields.find(x => x.id === id); if (!f) return;
  saveUndo();
  f.exportEnabled = !!an;
  drawCanvas(); renderProps();
}

// Dateiname aus einem files-Eintrag ({ file: 'item-1/…' }, s. read-orders.controller.js).
function _fileName(fi) { return fi && fi.file; }
// Erste echte Bestell-JSON (nicht meta.json) einer Bestellung finden.
function _findOrderJson(order) {
  // fn ist „item-1/<Datei>" — meta.json am Ende des Pfads erkennen (der Server liefert sie
  // ohnehin nicht mit, die Prüfung war bis 08.10.2026 wirkungslos).
  return order.files?.find(fi => { const fn = _fileName(fi); return fn && fn.endsWith('.json') && !/(^|\/)meta\.json$/.test(fn); });
}

// Eindeutiger Schlüssel PRO ITEM (id+date+JSON-Datei) — Mehr-Artikel-Bestellungen teilen
// sich id+date; ohne den Dateinamen bekämen alle Items die Gravur des ersten.
function _orderKey(order) {
  const jf = _findOrderJson(order);
  const fn = jf ? _fileName(jf) : '';
  return order.id + '|' + order.date + '|' + fn;
}

// Bestell-JSON pro Datei cachen (loadImg + getAllTexts lesen dieselbe Datei;
// Bestell-JSONs sind unveränderlich → Cache gefahrlos)
const _orderJsonCache = {};
// Hinweise eines Export-Laufs für status.txt („⚠"), Text → { layout, nurRekla }. EINE Sammelstelle:
// Bestellungen, deren JSON nicht lesbar war (ohne JSON kein Gravurtext; vorher geschah das still),
// dazu Ersatzschrift und stark gestauchter Text (nur bei Reklamation — dort neben der Vorschau).
const _exportHinweise = new Map();
let _exportLayoutJetzt = '';
async function _fetchOrderJson(order) {
  const jf = _findOrderJson(order);
  if (!jf) return null;
  const fn = _fileName(jf);
  const key = `${order.date}/${order.id}/${fn}`;
  if (_orderJsonCache[key]) return _orderJsonCache[key];
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/${key}`, { headers, credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    _orderJsonCache[key] = data;
    return data;
  } catch (e) {
    // Fehlschlag NICHT merken: ein späterer Aufruf darf es wieder versuchen.
    console.error('Bestell-JSON nicht lesbar:', key, e.message);
    _exportHinweise.set(`${order.id}: Bestelldaten nicht lesbar (${e.message}) — Gravurtext fehlt, Platz prüfen`, { layout: 'Bestelldaten' });
    return null;
  }
}

// Nur das EINE frisch geladene Bild ins Overlay bringen. NICHT renderEls() aufrufen:
// das baut das ganze Overlay neu und dekodiert alle dataURL-<img> mit — bei 40
// Bildfeldern 40 Voll-Rebuilds, also O(n²). Fehlt das Overlay-Element (Seiten-Instanzen
// beim Mehrseiten-/Auto-Export-Füllen), malt drawCanvas das Bild trotzdem.
function _paintLoadedImg(f) {
  const el = document.getElementById('cel-' + f.id);
  if (el && f._img) {
    el.querySelector('.cel-placeholder')?.remove();
    let im = el.querySelector('img');
    if (!im) {
      im = document.createElement('img');
      el.insertBefore(im, el.querySelector('.rh')); // vor dem Resize-Griff, wie in renderEls
    }
    im.src = f._img.src;
  }
  // Headless sieht niemand das Canvas, und der Export rendert seine eigenen aus `fields`.
  // Ein drawCanvas() je geladenem Bild wären dort 40 Neuzeichnungen ins Leere. Vor dem
  // Bildschirm bleibt es, wie es war — sonst erschiene das Bild erst am Ende.
  if (!IS_AUTOEXPORT) drawCanvas();
}

// Bild 2, 3 … = das zweite, dritte … Foto, das der Kunde hochgeladen hat (JSON-Reihenfolge,
// wie Amazon die Flächen führt) samt der Platzierung, in der es steckt. Bild 1 läuft
// unverändert über order.files (der Server prüft dort, dass die Datei wirklich da ist).
function _kundenFotos(data) {
  const out = [];
  const walk = (node, platz) => {
    if (!node || typeof node !== 'object') return;
    if (node.type === 'PlacementContainerCustomization' && node.buyerPlacement) platz = node;
    if (node.type === 'ImageCustomization' && node.image?.imageName) out.push({ name: node.image.imageName, placement: platz || null });
    if (Array.isArray(node.children)) for (const c of node.children) walk(c, platz);
  };
  walk(data && data.customizationData, null);
  return out;
}

async function loadImg(f, order) {
  const nr = f.palNum || 1;
  if (nr > 1) return _loadImgNr(f, order, nr);
  const imgFile = order.files?.find(fi => { const fn = _fileName(fi); return fn && /\.(jpg|jpeg|png)$/i.test(fn); });
  if (!imgFile) return;
  const fn = _fileName(imgFile);
  const imgUrl = `${BASE_URL}/${order.date}/${order.id}/${fn}`;

  // Platzierung = die des ersten Kundenfotos (dieselbe Suche wie für Bild 2+). An allen 39
  // Bestellungen mit Foto am 09.10.2026 gleich der früheren „erste Platzierung im Baum".
  const data = await _fetchOrderJson(order);
  const placement = (data && _kundenFotos(data)[0]?.placement) || null;

  return _imgMitPlatzierung(f, imgUrl, placement);
}

// Bild laden, in die Amazon-Platzierung einpassen und ins Feld setzen — gemeinsamer Teil
// von loadImg (Bild 1) und _loadImgNr (Bild 2+).
function _imgMitPlatzierung(f, imgUrl, placement) {
  // BEWUSST sequenziell (wartet bis f._img gesetzt ist): parallele Bild-Verarbeitung
  // vervielfacht den Speicherbedarf → Chromium-OOM beim Auto-Export.
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      // try/catch ist Pflicht: ein Fehler darf das Promise NIE unresolved lassen,
      // sonst hängt der gesamte Füllvorgang an diesem await.
      try {
        // Kein EXIF-Ausrichten nötig — Amazon liefert die Bilder bereits richtig herum.
        if (!placement || !placement.buyerPlacement) {
          f._img = img; _paintLoadedImg(f); resolve(); return;
        }

        // EINE Mathematik-Quelle: composePlacement — dieselbe nutzt der Export-Pfad. Zwei
        // Fassungen könnten bei einer Amazon-Format-Änderung auseinanderlaufen.
        const area = _placementArea(placement);
        const RENDER_SCALE = 12; // px pro 400x400-Einheit ≈ 300-DPI-Vorschau
        const canvas = composePlacement(img, placement, area.w * RENDER_SCALE, area.h * RENDER_SCALE);

        // Auto-Export: unverändert der alte Ablauf (Daten-URL direkt hier). Schon eine andere Reihenfolge
        // verschiebt, wie Chrome die Fotos später für den Laser skaliert (±1 Helligkeitsstufe, gemessen
        // 25.10.2026) — die Gravurdateien sollen bitgleich bleiben.
        if (IS_AUTOEXPORT) {
          const result = new Image();
          result.onload = () => { f._img = result; _paintLoadedImg(f); resolve(); };
          result.onerror = () => resolve();
          result.src = canvas.toDataURL('image/png');
        } else _canvasZuBild(canvas).then(result => { if (result) { f._img = result; _paintLoadedImg(f); } resolve(); });

        // Placement fürs Export-Rendering merken — spart die doppelte Komprimierung
        f._imgSrc = imgUrl;           // Original-Bild URL
        f._placement = placement;     // Placement-Daten (position, scale, rotation)
      } catch (e) {
        console.error('loadImg: Fehler bei Placement-Verarbeitung', e);
        // Fallback: wenigstens das Rohbild zeigen, statt das Feld leer zu lassen.
        try { f._img = img; _paintLoadedImg(f); } catch (_) { }
        resolve();
      }
    };
    img.onerror = () => { showToast('⚠️ Bild konnte nicht geladen werden'); resolve(); };
    img.src = imgUrl;
  });
}

// Canvas → Bild fürs Feld. Im Editor als Blob-URL: toBlob kodiert außerhalb des Haupt-Threads, und
// renderEls/Eigenschaften schreiben nur eine kurze URL ins Markup statt mehrerer MB Base64 (F02 füllen
// 7,2 → 3,9 s, 25.10.2026). Die URL wird frei, sobald niemand das Bild mehr hält. Der Auto-Export bleibt
// bei der Daten-URL: Blob-Speicher sieht die Speicherbereinigung nicht, dort zählt der Speicher (OOM),
// nicht die Zeit — und seine Gravurdateien bleiben so bitgleich (s. _imgMitPlatzierung).
// ACHTUNG Speicher: die Handler am Bild dürfen das Canvas NICHT über ihre Closure erreichen — sonst lebt
// jedes Zwischen-Canvas so lange wie sein Bild (erster Entwurf: im Nachtlauf andere F02-Bitmaps, weil
// Chrome bei vollem Canvas-Speicher spätere Canvas anders rechnet). Deshalb kodiert _canvasZuBild nur,
// und _bildLaden (ohne Canvas im Bereich) baut das Bild.
const _bildUrlFrei = typeof FinalizationRegistry === 'function' ? new FinalizationRegistry(u => URL.revokeObjectURL(u)) : null;
function _canvasZuBild(c) {
  if (IS_AUTOEXPORT || !_bildUrlFrei) return _bildLaden(c.toDataURL('image/png'), false);
  return new Promise(resolve => c.toBlob(resolve, 'image/png'))
    .then(blob => (blob ? _bildLaden(URL.createObjectURL(blob), true) : null));
}
function _bildLaden(url, istBlob) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => { img.onload = img.onerror = null; if (istBlob) _bildUrlFrei.register(img, url); resolve(img); };
    img.onerror = () => { img.onload = img.onerror = null; if (istBlob) URL.revokeObjectURL(url); resolve(null); };
    img.src = url;
  });
}

async function _loadImgNr(f, order, nr) {
  const data = await _fetchOrderJson(order);
  const foto = _kundenFotos(data)[nr - 1];
  if (!foto) return;   // Kunde hat kein N-tes Foto hochgeladen → Feld bleibt leer
  // PDF-Upload: der Downloader legt eine gerasterte .png gleichen Namens daneben (s. read-orders)
  const name = /\.pdf$/i.test(foto.name) ? foto.name.replace(/\.pdf$/i, '.png') : foto.name;
  const jf = _findOrderJson(order);
  const ordner = order.itemFolder || (jf ? String(_fileName(jf)).split('/')[0] : '');
  const imgUrl = `${BASE_URL}/${order.date}/${order.id}/${ordner ? ordner + '/' : ''}${name}`;
  return _imgMitPlatzierung(f, imgUrl, foto.placement);
}

// ── Font Manager ─────────────────────────────────────────────────────────────
// Gespeicherte Schriften: name → { fontName, preview }
const _uploadedFonts = {}; // z.B. { 'Monotype': 'amz-Monotype', 'Arial': 'Arial' }

// Font Cache (URLs von Amazon)
const _fontCache = {}; // fontUrl → fontFamily Name
// Kollisionsarmer String-Hash (djb2). KEIN `.hashCode?.()` — das gibt es als
// String-Methode nicht und fällt auf .length zurück: gleiche Länge = falsche Schrift.
function _hashStr(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  return h;
}

// FontFace laden + registrieren — gemeinsamer Kern aller drei Font-Lade-Pfade
// (Amazon-URL, manueller Upload, Server-Liste beim Start).
async function _registerFontFace(name, url) {
  if (url && (url.startsWith(BASE_URL) || url.startsWith('/v2/'))) {
    try {
      const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const resp = await fetch(url, { headers, credentials: 'include' });
      if (resp.ok) {
        const buf = await resp.arrayBuffer();
        const face = new FontFace(name, buf);
        await face.load();
        document.fonts.add(face);
        return name;
      }
    } catch (_) { }
  }
  const face = new FontFace(name, `url(${url})`);
  await face.load();
  document.fonts.add(face);
  return name;
}
// Schrift unter ihrem Dateinamen registrieren + in _uploadedFonts eintragen — DIE Map,
// die loadFontFromUrl/_applyTextToField zuerst prüfen.
async function _registerUploadedFont(fontName, url) {
  await _registerFontFace(fontName, url);
  _uploadedFonts[fontName] = fontName;
}

async function loadFontFromUrl(fontUrl, family) {
  // Zuerst: wurde diese Schrift manuell hochgeladen?
  if (family && _uploadedFonts[family]) return _uploadedFonts[family];
  if (!fontUrl) return family; // kein URL → Standard nehmen
  if (_fontCache[fontUrl]) return _fontCache[fontUrl]; // bereits geladen
  try {
    // Eindeutigen Namen generieren damit Fonts nicht kollidieren
    const fontName = await _registerFontFace('amz-' + family + '-' + _hashStr(fontUrl), fontUrl);
    _fontCache[fontUrl] = fontName;
    return fontName;
  } catch (e) {
    console.warn('Font konnte nicht geladen werden:', fontUrl, e);
    _fontCache[fontUrl] = family; // Fallback auf family name
    return family;
  }
}

// ── Auto-Schriftgröße: Text füllt die Feldhöhe ───────────────────────────────
// EINE pt-Größe für alle Pfade (Vorschau, PNG/PDF, DXF) → Bildschirm = Maschine.
// Typografischer Punkt in mm (1 pt = 1/72 Zoll) — EINE Konstante für Auto-Fit, Kombi-Feld,
// Dropdown-Text und DXF.
const PT_MM = 25.4 / 72;
const _fitCv = document.createElement('canvas');
const _fitCx = _fitCv.getContext('2d');
// Höhe: "echte" Texthöhe = Oberkante "H" + Unterlänge "g" füllt die Feldhöhe.
// 1.0 = exakt Feldhöhe (z.B. 5 mm Feld → 5 mm hoher Text, H ganz oben, g ganz unten).
const AUTOFIT_FILL_H = 1.0;
// (AUTOFIT_FILL_W + AUTOFIT_FONT_BOOST wurden mit der festen Gravurhöhe entfernt —
// es gibt kein Breiten-Limit und keinen Font-Boost mehr, s. autoFitFontSizePt.)
const _FIT_REF = 200;         // Referenz-Pixelgröße zum Messen
const _fontMetricsCache = {}; // fontKey → { capPx, descPx } bei _FIT_REF

// Versalhöhe ("H") + Unterlänge ("g") einer Schrift bei _FIT_REF, gecacht. FESTE
// Font-Metrik (nicht wortabhängig) → alle Zeilen werden gleich hoch skaliert.
function _fontMetrics(fam, bold) {
  const key = (fam || 'Arial') + (bold ? '|b' : '');
  let m = _fontMetricsCache[key];
  if (!m) {
    _fitCx.font = _canvasFont(_FIT_REF, fam, bold);
    // Gleiche ||-Falle wie in autoFitFontSizePt: eine gemessene 0 ist gültig. Bei "H"/"g"
    // liefern normale Schriften zwar nie 0 — eine Symbol-/Schreibschrift, deren "g" keine
    // Unterlänge hat, bekäme sonst aber still 42 px Phantom-Unterlänge, und die Zeilen
    // eines Kombi-Felds wären damit alle zu klein.
    const _d = _fitCx.measureText('g').actualBoundingBoxDescent;
    m = {
      capPx: _capPx(_fitCx, _FIT_REF),   // Schrift ohne "H" (0/NaN) → Rückfall 0,7 em
      descPx: Number.isFinite(_d) ? _d : (_FIT_REF * 0.21)
    };
    _fontMetricsCache[key] = m;
  }
  return m;
}

// Zeilen eines Gravur-Texts (Amazon-Mehrzeilen-Eingaben enthalten "\n" im Wert)
const LINE_SPACING = 1.2; // Zeilenvorschub in em — überall gleich (Canvas, DXF)
function _textLines(text) { return String(text == null ? '' : text).split(/\r?\n/); }

// ── Zeilenumbruch für STATISCHEN Text ─────────────────────────────────────────
// Nur statische Felder brechen um; Gravur-Text nie (feste Gravurhöhe, s. autoFitFontSizePt).
// Innenabstand in mm, NICHT in Pixeln: "w - 2" px sind in der Vorschau ~0,5 mm, beim
// 450-DPI-Export aber ~0,11 mm — Vorschau und PDF brächen an verschiedenen Stellen um.
const STATIC_WRAP_INSET_MM = 0.5;
// Zeilen am Feldrand umbrechen. measure(str) misst in derselben Einheit wie maxW →
// Canvas (px) und DXF (mm) brechen gleich um. Ein zu breites Wort bleibt stehen.
function _wrapTextLines(lines, maxW, measure) {
  if (!(maxW > 0)) return lines;
  const out = [];
  for (const raw of lines) {
    let line = '';
    for (const word of raw.split(' ')) {
      const test = line ? line + ' ' + word : word;
      if (line && measure(test) > maxW) { out.push(line); line = word; }
      else line = test;
    }
    out.push(line);
  }
  return out;
}
// Textbreite in mm für eine Schrift/Größe — misst über denselben Canvas-Kontext wie
// die Vorschau, damit der DXF-Umbruch exakt dort sitzt, wo der Editor ihn anzeigt.
function _measureTextMM(str, fam, bold, fsMM) {
  _fitCx.font = _canvasFont(_FIT_REF, fam, bold);
  return _fitCx.measureText(str).width / _FIT_REF * fsMM;
}

// ── Memo-Cache für Auto-Fit ───────────────────────────────────────────────────
// drawCanvas ruft autoFitFontSizePt je Textfeld bei JEDEM Redraw — beim Ziehen sind das
// bei 48 Feldern hunderte measureText/Sekunde für unveränderte Texte. wMM zählt nur im
// fitWidth-Modus (Nr.-Felder) zum Schlüssel.
// Invalidierung bei `loadingdone`: sonst bleibt eine mit Fallback-Font gemessene Größe
// dauerhaft im Cache hängen. Fit- UND Metrik-Cache müssen dabei zusammen geleert werden.
const _fitPtCache = new Map();
if (document.fonts?.addEventListener) {
  document.fonts.addEventListener('loadingdone', () => {
    _fitPtCache.clear();
    for (const k in _fontMetricsCache) delete _fontMetricsCache[k];
    scheduleRender(); // mit den echten Metriken neu zeichnen
  });
}

// emoji = { font } für Gravurtext mit Bildzeichen (s. _emojiTeile): Emojis zählen mit ihrer echten
// Höhe — wie die Bounding-Box im DXF. null = bisherige Messung am reinen String.
function autoFitFontSizePt(text, fontFamily, wMM, hMM, bold, fitWidth = false, emoji = null) {
  if (!text || !hMM) return 10;
  const _cacheKey = `${text}|${fontFamily || 'Arial'}|${bold ? 1 : 0}|${hMM}|${fitWidth ? wMM : ''}`
    + (emoji ? `|e${emoji.font ? 1 : 0}${_emojiSchriften ? 1 : 0}${_emojiAn ? 1 : 0}` : '');
  const _hit = _fitPtCache.get(_cacheKey);
  if (_hit !== undefined) return _hit;
  const fam = fontFamily || 'Arial';
  _fitCx.font = _canvasFont(_FIT_REF, fam, bold);
  const lines = _textLines(text);
  // ── FESTE GRAVUR-HÖHE ─────────────────────────────────────────────────────
  // Der TATSÄCHLICHE Tinten-Block (inkl. Ober-/Unterlängen und Umlaut-Punkten der
  // konkreten Wörter) füllt EXAKT die Feldhöhe: 4 mm bleiben 4 mm, egal ob "MAX",
  // "Jürgen" oder "gggg". Zu langer Text wird nur LÄNGER, nie kleiner.
  // Gemessen am konkreten String, nicht an "H"/"g" — sonst streut die Höhe je nach Wort
  // (gemessen 3,1–4,2 mm bei 4-mm-Feldern). Der DXF-Export skaliert zusätzlich über die
  // Vektor-Bounding-Box (_buildDXFEntities), damit die Laser-Geometrie mm-genau stimmt.
  const first = lines.find(l => l.trim()) || lines[0] || '';
  let last = first; for (let i = lines.length - 1; i >= 0; i--) if (lines[i].trim()) { last = lines[i]; break; }
  // NULL IST EINE GÜLTIGE MESSUNG — kein `|| fallback` hier. Ein Text ohne Unterlänge
  // ("Tim", "Willi", "Phil") misst exakt 0; mit `||` bekam er 42 px Phantom-Unterlänge
  // und wurde zu klein gerechnet: 3,10 statt 4,00 mm (−22 %), während der DXF-Export
  // weiter 4,00 mm lieferte. Vorschau ≠ Gravur, abhängig vom Kundennamen (7 von 308
  // echten Texten). Nur eine FEHLENDE Messung (undefined/NaN) darf zurückfallen.
  const _fm = _fontMetrics(fam, bold);
  _fitCx.font = _canvasFont(_FIT_REF, fam, bold); // _fontMetrics kann den Font gesetzt haben
  const _a = emoji ? _teileTinte(_fitCx, _emojiTeile(first, emoji.font)).asc : _fitCx.measureText(first).actualBoundingBoxAscent;
  const _d = emoji ? _teileTinte(_fitCx, _emojiTeile(last, emoji.font)).desc : _fitCx.measureText(last).actualBoundingBoxDescent;
  let asc = Number.isFinite(_a) ? _a : _fm.capPx;
  let desc = Number.isFinite(_d) ? _d : _fm.descPx;
  // Reiner Leerraum ("   ") misst 0/0 → ohne Rückfall wäre blockPx 0 und die Schrift
  // würde ins Absurde skalieren.
  if (!(asc + desc > 0)) { asc = _fm.capPx; desc = _fm.descPx; }
  const blockPx = asc + (lines.length - 1) * _FIT_REF * LINE_SPACING + desc;
  let sMm = hMM * AUTOFIT_FILL_H * _FIT_REF / Math.max(1, blockPx); // em-Höhe in mm
  // AUSNAHME Nr.-Felder (fitWidth): Bestellnummern müssen VOLLSTÄNDIG lesbar sein — ohne
  // Breiten-Limit clippte das PDF sie auf die mittleren 4 Ziffern. Für Gravur-Text gilt
  // das Limit bewusst NICHT (feste Gravurhöhe).
  if (fitWidth && wMM) {
    const wPx = Math.max(1, ...lines.map(li => _fitCx.measureText(li).width));
    sMm = Math.min(sMm, wMM * 0.96 * _FIT_REF / wPx);
  }
  const _pt = sMm / PT_MM; // mm → pt
  // Deckel gegen unbegrenztes Wachstum (Texte wechseln mit jeder Füllung)
  if (_fitPtCache.size > 2000) _fitPtCache.clear();
  _fitPtCache.set(_cacheKey, _pt);
  return _pt;
}

// ── Kombinationsfeld ──────────────────────────────────────────────────────────
// Stapelt mehrere Gravur-Zeilen (f.comboPals = [1,2,3]) als EINEN Textblock.
// Diskriminator: comboPals ist ein Array (auch leer) → Kombi-Feld.
function _isCombo(f) { return Array.isArray(f && f.comboPals); }
// Zeilenabstand eines Kombi-Felds als ECHTE mm-Lücke zwischen den Zeilen (nicht Faktor).
// Standard 1 mm. Konkret & inhaltsunabhängig — der Gravierer denkt in mm.
function _comboGapMM(f) { return (_isCombo(f) && f.comboGapMM >= 0) ? f.comboGapMM : 1.0; }
// Gemeinsame, INHALTSUNABHÄNGIGE Schriftgröße (pt): N (= comboPals.length) Zeilen (je
// Cap+Unterlänge) PLUS (N-1) mm-Lücken füllen exakt die Feldhöhe. Alle Zeilen exakt gleich
// hoch — egal ob h, g oder Umlaut. Vorschau UND DXF rufen DIESELBE Funktion → Bildschirm =
// Laser. Größere Lücke → Schrift wird kleiner (Slot bleibt gefüllt), NIE negativ.
function comboFontSizePt(f) {
  const fam = _feldSchrift(f);
  const n = Math.max(1, (f.comboPals && f.comboPals.length) || 1);
  const m = _fontMetrics(fam, f.bold);
  const inkEm = (m.capPx + m.descPx) / _FIT_REF;             // Höhe EINER Zeile (Cap+Unterlänge) in em
  let sMm = ((f.h || 5) - (n - 1) * _comboGapMM(f)) / (n * inkEm); // em-Größe in mm
  if (!(sMm > 0.3)) sMm = 0.3;                               // Schutz: zu große Lücke → Mini-Schrift statt negativ
  return sMm / PT_MM;                                        // mm → pt
}
// Grundlinien-Abstand (mm) einer Kombi-Zeile: Zeilenhöhe (Cap+Unterlänge) + eingestellte mm-Lücke.
function _comboLineAdvMM(f, fsMM) {
  const m = _fontMetrics(_feldSchrift(f), f.bold);
  return (m.capPx + m.descPx) / _FIT_REF * fsMM + _comboGapMM(f);
}
// Leere Zeilen mittig (f.comboCenterSingle): Ein Kombi-Feld ist auf N Zeilen (comboPals)
// dimensioniert. Füllt eine Bestellung nur k < N Zeilen, rutscht der Block um die Hälfte der
// ungenutzten Höhe ((N-k)·Zeilenvorschub) nach unten → senkrecht mittig. Standard für alle Kombis
// (Nutzerwunsch); oben bündig nur bei ausdrücklich gesetztem false („Oben bündig" im Props-Panel).
// Rückgabe: mm, um die der Block nach UNTEN rutschen muss.
function comboCenterShiftMM(f, zeilenAnzahl, fsMM) {
  if (!_isCombo(f) || f.comboCenterSingle === false) return 0;
  const n = Math.max(1, (f.comboPals && f.comboPals.length) || 1);
  const k = Math.max(0, zeilenAnzahl);
  if (k <= 0 || k >= n) return 0;
  return (n - k) * _comboLineAdvMM(f, fsMM) / 2;
}
// SICHTBARE Höhen einer Kombi-Zeile in mm (für die Anzeige, nicht der em-Schriftgrad):
// cap = Versalhöhe (Großbuchstabe, was man am Stück misst), ink = inkl. Unterlänge ("g").
function comboLineHeightsMM(f) {
  const m = _fontMetrics(_feldSchrift(f), f.bold);
  const emMM = comboFontSizePt(f) * PT_MM;
  return { cap: (m.capPx / _FIT_REF) * emMM, ink: ((m.capPx + m.descPx) / _FIT_REF) * emMM };
}

// ── Breitenlimit für Auto-Fit-Gravurtext (f.overflowMode) ─────────────────────
//   undefined/'ok' → Text ragt über das Feld hinaus (Höhe fest, Breite unbegrenzt)
//   'stauch'       → nur X-Achse stauchen, Höhe bleibt exakt (wie an der Maschine)
//   'hybrid'       → stauchen bis HYBRID_MIN_SX, den Rest proportional (k < 1 → niedriger)
// Rückgabe { sx, k }. Einheit von naturalW/maxW egal (px ODER mm), nur das Verhältnis
// zählt — dadurch nutzen Vorschau/PDF (px) und DXF (mm) exakt dieselbe Logik.
const HYBRID_MIN_SX = 0.8;
function _overflowFactors(mode, naturalW, maxW) {
  if (!naturalW || !maxW || naturalW <= maxW) return { sx: 1, k: 1 };
  if (mode === 'stauch') return { sx: maxW / naturalW, k: 1 };
  const sx = Math.max(HYBRID_MIN_SX, maxW / naturalW);
  return { sx, k: Math.min(1, maxW / (naturalW * sx)) };
}

// Cap-Höhe (mm) bei gegebener em-Größe — für oben-bündige Verankerung (H an Feldoberkante).
function _capHeightMM(fam, bold, fsMM) {
  const m = _fontMetrics(fam, bold);
  return (m.capPx / _FIT_REF) * fsMM;
}
// ── Einheitliche Text-Eigenschaften für den Vektor-Export (DXF) ──
// Dynamischer Text: Auto-Fit wie in der Vorschau. Statischer Text: feste fontSize aus
// f.staticText — sonst verschwinden statische Felder still aus den Exporten.
function _vecTextProps(f) {
  const isStatic = f.type === 'static';
  const txt = isStatic ? (f.staticText || '') : (f._text || '');
  const usedFont = f.type === 'number' ? 'monospace' : (_feldSchrift(f));
  const fontName = _feldSchrift(f); // echte Datei für opentype (Nummern → Arial-Kontur)
  let pt;
  // Kreis-Text: immer feste Größe (Auto-Fit ist am Bogen nicht definiert) — wie Vorschau
  if (_isCombo(f)) pt = comboFontSizePt(f); // Kombi-Feld: feste Zeilen-Metrik (s. comboFontSizePt)
  else if (f.ddText) pt = _ddTextPt(f, usedFont);
  else if (isStatic || f.autoFit === false || f.circleDia > 0) pt = (f.fontSize || 10);
  else pt = autoFitFontSizePt(txt, usedFont, f.w, f.h, f.bold, f.type === 'number');
  const fsMM = pt * PT_MM;
  // capMM = Cap-Höhe in mm → Export verankert die Cap-Oberkante an der Feldoberkante.
  return { txt, fsMM, usedFont, fontName, capMM: _capHeightMM(usedFont, f.bold, fsMM) };
}
// true, wenn ein Feld im Export Text liefert (dynamisch ODER statisch)
function _hasVecText(f) {
  if (f.type === 'static') return !!f.staticText && f.exportEnabled !== false;
  return (f.type === 'text' || f.type === 'number') && !!f._text;
}

// ── Motiv-Felder ─────────────────────────────────────────────────────────────
// Ein Motiv-Feld (type 'motiv') trägt nur den DATEINAMEN; die Pfade kommen vom Server
// (/motive/<name>/pfade, in mm, Ursprung oben links) und liegen hier im Cache. Sie
// werden NICHT ins Layout gespeichert — sonst bläht jede Kopie die layouts.json auf und
// eine geänderte Motivdatei würde in alten Layouts nie ankommen.
const _motivCache = {};      // Dateiname → { pfade, breite, hoehe }
const _motivLaden = {};      // Dateiname → Promise (verhindert Doppel-Abrufe)

function _istMotiv(f) { return f && f.type === 'motiv'; }

// Gehört ein Motiv in den Export? Ein Blech ist selten voll — ohne diese Prüfung
// brennte der Laser das Ornament auch auf Positionen, an denen gar kein Feuerzeug liegt.
// Regel: überlappt das Motiv Gravur-Felder, muss mindestens eines davon Text tragen.
// Überlappt es keines (freistehende Verzierung), wird es immer graviert.
function _motivAktiv(f, alle) {
  if (f._ddAus) return false;   // „Nur gravieren, wenn …" nicht erfüllt oder Platz leer
  // Dropdown-Motiv: graviert wird genau dann, wenn zur Antwort ein Motiv gefunden wurde.
  if (f.ddFrage) return !!f._motivDatei;
  const ueber = (alle || fields).filter(x =>
    (x.type === 'text' || x.type === 'number') &&
    x.x < f.x + f.w && x.x + x.w > f.x && x.y < f.y + f.h && x.y + x.h > f.y);
  if (!ueber.length) return true;
  return ueber.some(x => String(x._text || '').replace(/[\s—–-]/g, '').length > 0);
}

async function motivPfade(name) {
  if (!name) return null;
  if (name in _motivCache) return _motivCache[name];
  if (!(name in _motivLaden)) {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    _motivLaden[name] = fetch(`${BASE_URL}/v2/motive/${encodeURIComponent(name)}/pfade`, { headers, credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(m => { _motivCache[name] = m; delete _motivLaden[name]; return m; })
      .catch(() => { _motivCache[name] = null; delete _motivLaden[name]; return null; });
  }
  return _motivLaden[name];
}

// Pfade eines Motivs in Feld-Koordinaten (mm, Blatt-Ursprung oben links).
// Seitenverhältnis bleibt erhalten: das Motiv wird in die Feldbox EINGEPASST und darin
// zentriert — so verzerrt ein versehentlich schief gezogenes Feld die Grafik nicht.
function motivGeometrie(f, m) {
  if (!m || !m.breite || !m.hoehe) return null;
  // Split-Monogramm (Ausrichtung „Spalt", s. motive.controller.js): Balken = Feldbreite,
  // Spaltmitte = Feldmitte — so liegt der Spalt bei jedem Buchstaben an derselben Stelle,
  // auch bei Unterlänge (J, Q) oder überbreitem Buchstaben (W).
  const a = m.anker;
  if (a && a.x1 > a.x0) {
    const s = f.w / (a.x1 - a.x0);
    const ox = f.x + f.w / 2 - (a.x0 + a.x1) / 2 * s, oy = f.y + f.h / 2 - (a.y0 + a.y1) / 2 * s;
    return { s, ox, oy, bw: m.breite * s, bh: m.hoehe * s };
  }
  const s = Math.min(f.w / m.breite, f.h / m.hoehe);
  const bw = m.breite * s, bh = m.hoehe * s;
  const ox = f.x + (f.w - bw) / 2, oy = f.y + (f.h - bh) / 2;
  return { s, ox, oy, bw, bh };
}
// Feldhöhe, in die das Motiv bei Breite w genau passt. Beim Monogramm symmetrisch um den
// Spalt (Feldmitte = Spaltmitte), damit der Rahmen den Buchstaben umschließt.
function motivFeldHoehe(m, w) {
  const a = m && m.anker;
  if (a && a.x1 > a.x0) {
    const s = w / (a.x1 - a.x0), cy = (a.y0 + a.y1) / 2;
    return +(2 * Math.max(cy, m.hoehe - cy) * s).toFixed(3);
  }
  return +(w * m.hoehe / m.breite).toFixed(3);
}

// Höhe passend zur Breite setzen (Seitenverhältnis der Datei) — beim Ablegen und
// beim Ändern der Breite im Eigenschaften-Panel.
async function motivHoeheAngleichen(id) {
  const f = fields.find(x => x.id === id); if (!f || !_istMotiv(f)) return;
  const m = await motivPfade(f.motivDatei); if (!m) return;
  f.h = motivFeldHoehe(m, f.w);
  scheduleRender(); renderFieldList(); renderProps();
}

function _drawMotiv(ctx, f, pxPerMm) {
  // Dropdown-Motiv nach dem Füllen ohne Antwort/Motiv: nichts zeichnen, wie im Export.
  // Vor dem Füllen zeigt es die Datei, mit der das Feld angelegt wurde (zum Einrichten).
  if ((f.ddFrage && f._ddLeer) || f._ddAus) return;
  const name = (f.ddFrage && f._motivDatei) || f.motivDatei;
  if (!name) {   // Motivfeld ohne Datei (noch leer / je Antwort vor dem Füllen): gestrichelter Rahmen
    const x = f.x * pxPerMm, y = f.y * pxPerMm, w = f.w * pxPerMm, h = f.h * pxPerMm;
    ctx.save();
    ctx.setLineDash([4, 3]); ctx.strokeStyle = '#7c6cf0'; ctx.lineWidth = 1; ctx.strokeRect(x, y, w, h);
    ctx.setLineDash([]); ctx.fillStyle = '#7c6cf0';
    ctx.font = `${Math.max(9, Math.min(14, h / 5))}px sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('◆ ' + (f.ddFrage || 'Motiv'), x + w / 2, y + h / 2, w - 4);
    ctx.restore();
    return;
  }
  const m = _motivCache[name];
  if (!m) {                              // noch nicht geladen → Platzhalter
    motivPfade(name).then(() => scheduleRender());
    return;
  }
  const g = motivGeometrie(f, m); if (!g) return;
  ctx.strokeStyle = '#000';
  ctx.lineWidth = Math.max(0.6, 0.12 * pxPerMm);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  for (const p of m.pfade) {
    ctx.beginPath();
    p.pts.forEach(([px, py], i) => {
      const X = (g.ox + px * g.s) * pxPerMm, Y = (g.oy + py * g.s) * pxPerMm;
      i ? ctx.lineTo(X, Y) : ctx.moveTo(X, Y);
    });
    if (p.zu) ctx.closePath();
    ctx.stroke();
  }
}

// ── Motive (Vektorgrafiken) ──────────────────────────────────────────────────
// Der Server rechnet AI/EPS/SVG/DXF/PDF beim Hochladen in Polylinien in Millimetern
// um (motive.controller.js) und liefert sie über /motive/<name>/pfade. Hier die
// Verwaltung im Reiter ◆ Motive: hochladen, ansehen, einstellen, umbenennen, löschen.
// Motive als Raster: zwei Spalten mit Vorschau, Suchfeld darüber. ⚙ klappt die Einstellungen
// über die ganze Breite auf (grid-auto-flow: dense hält die übrigen Kacheln lückenlos).
let _motivSuche = '';
function motivSuchen(q) {
  _motivSuche = String(q || '').trim().toLowerCase();
  document.querySelectorAll('#motiv-liste [data-motiv]').forEach(el => {
    const treffer = !_motivSuche || el.dataset.motiv.toLowerCase().includes(_motivSuche);
    el.classList.toggle('mv-weg', !treffer);
  });
}
async function renderMotive() {
  const el = document.getElementById('motiv-liste');
  if (!el) return;
  el.innerHTML = '<div class="umut" style="text-align:center;padding:10px;grid-column:1/-1;">Lade…</div>';
  let liste = [];
  try { liste = await _apiJson('/v2/motive'); if (!Array.isArray(liste)) throw new Error('keine Liste'); }
  catch (e) { el.innerHTML = '<div class="uempty" style="grid-column:1/-1;">Motive nicht erreichbar</div>'; return; }
  const zaehl = document.getElementById('motiv-zahl');
  if (zaehl) zaehl.textContent = liste.length ? liste.length + ' Motive' : '';
  if (!liste.length) { el.innerHTML = '<div class="uempty" style="grid-column:1/-1;">Noch keine Motive</div>'; return; }
  el.innerHTML = liste.map(m => {
    const kb = m.bytes > 1048576 ? (m.bytes / 1048576).toFixed(1) + ' MB' : Math.round(m.bytes / 1024) + ' KB';
    // Dateinamen kommen aus Uploads: im Markup escapen, im onclick als JS-String (_jsStr).
    const j = _jsStr(m.name), n = _esc(m.name);
    if (m.fehler) return `<div class="mv-kachel mv-fehler" data-motiv="${n}">
        <div class="mv-name" title="${n}">${n}</div>
        <div class="umut10" style="color:var(--red);">${_esc(m.fehler)}</div>
        <button class="btn btn-red btn-xs" onclick="motivLoeschen('${j}')">Löschen</button>
      </div>`;
    const roh = m.rohPunkte ? ` von ${m.rohPunkte}` : '';
    return `<div class="mv-kachel" data-motiv="${n}" draggable="true" ondragstart="motivDrag(event,'${j}')" title="${n} — auf das Blatt ziehen">
        <div class="mv-bild"><img src="${BASE_URL}/v2/motive/${encodeURIComponent(m.name)}/vorschau.svg?v=${Date.now()}" alt=""/></div>
        <div class="mv-name">${n}${m.ausrichtung === 'spalt' ? ' <b class="mv-spalt">Spalt</b>' : ''}</div>
        <div class="mv-werkzeug">
          <button class="zp-ikon" title="Einstellungen" onclick="event.stopPropagation();motivEinstellungen('${j}')">⚙</button>
          <button class="zp-ikon" title="Löschen" onclick="event.stopPropagation();motivLoeschen('${j}')">✕</button>
        </div>
      </div>
      <div id="mset-${_mid(m.name)}" class="mv-einst" data-motiv="${n}" style="display:none;">
        <div class="mv-einst-kopf">${n}</div>
        <div class="umut10" style="margin-bottom:10px;">${m.breite} × ${m.hoehe} mm · ${m.pfade} Pfade · <span id="mp-${_mid(m.name)}">${m.punkte}</span>${roh} Punkte · ${kb}</div>
        <div class="umut10" style="margin-bottom:5px;">Punktdichte — Abweichung bei 30 mm Gravurbreite</div>
        <div class="hsb" style="margin-bottom:4px;">
          <input type="range" min="0.005" max="0.1" step="0.005" value="${m.toleranz}" style="flex:1;"
                 oninput="document.getElementById('mtol-${_mid(m.name)}').textContent=(+this.value).toFixed(3)+' mm'"
                 onchange="motivToleranz('${j}', this.value)"/>
          <span id="mtol-${_mid(m.name)}" style="min-width:62px;text-align:right;font-family:var(--mono);color:var(--accent);font-size:var(--fs-klein);">${(+m.toleranz).toFixed(3)} mm</span>
        </div>
        <div class="umut10" style="margin-bottom:10px;line-height:1.5;">Kleiner = feinere Kurven, größere Datei. Größer = weniger Punkte. Unter 0,02 mm sieht der Laser keinen Unterschied mehr.</div>
        <div class="umut10" style="margin-bottom:5px;">Ausrichtung im Feld</div>
        ${_seg([
      [m.ausrichtung !== 'spalt', `motivAusrichtung('${j}','umriss')`, 'Umriss', 'Ganze Grafik ins Feld einpassen und mittig setzen'],
      [m.ausrichtung === 'spalt', `motivAusrichtung('${j}','spalt')`, 'Spalt (Monogramm)', 'Geteiltes Monogramm: Balken = Feldbreite, Spaltmitte = Feldmitte'],
    ])}
        <div class="umut10" style="margin:5px 0 10px;line-height:1.5;">Spalt: bei geteilten Monogrammen liegt der Spalt für den Namen bei jedem Buchstaben an derselben Stelle — auch bei J, Q oder W.${m.anker && m.anker.drehung ? ` Balken um ${String(m.anker.drehung).replace('.', ',')}° gerade gerichtet.` : ''}</div>
        <div class="ig">
          <span class="il">Name</span>
          <input value="${n}" id="mname-${_mid(m.name)}"
                 onkeydown="if(event.key==='Enter') motivUmbenennen('${j}', this.value)"/>
        </div>
        <button class="btn btn-umriss btn-full" style="margin-top:6px;"
                onclick="motivUmbenennen('${j}', document.getElementById('mname-${_mid(m.name)}').value)">Umbenennen</button>
        <div class="umut10" style="margin-top:5px;line-height:1.5;">Endung muss bleiben. Layouts, die das Motiv benutzen, werden mit umgestellt.</div>
      </div>`;
  }).join('');
  if (_motivSuche) motivSuchen(_motivSuche);
}

// Dateiname → gültige, eindeutige DOM-Id: jedes andere Zeichen wird als _<Hex>_ geschrieben (nur „_“
// machte „a b.svg“ und „a_b.svg“ gleich).
function _mid(name) { return String(name).replace(/[^A-Za-z0-9]/g, c => '_' + c.charCodeAt(0).toString(16) + '_'); }

function motivEinstellungen(name) {
  const el = document.getElementById('mset-' + _mid(name));
  if (el) el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

async function motivToleranz(name, wert) {
  try {
    const d = await _apiJson(`/v2/motive/${encodeURIComponent(name)}/toleranz`, 'POST', { toleranz: parseFloat(wert) });
    const sp = document.getElementById('mp-' + _mid(name));
    if (sp) sp.textContent = d.punkte;
    delete _motivCache[name];          // Editor muss die neuen Pfade holen
    scheduleRender();
    showToast(`◆ ${d.punkte} Punkte bei ${(+d.toleranz).toFixed(3)} mm`, 3000);
  } catch (e) { showToast('❌ ' + e.message, 4000); }
}

async function motivAusrichtung(name, ausrichtung) {
  try {
    await _apiJson(`/v2/motive/${encodeURIComponent(name)}/ausrichtung`, 'POST', { ausrichtung });
    delete _motivCache[name];          // Editor muss Pfade + Anker neu holen
    scheduleRender();
    showToast(ausrichtung === 'spalt' ? '◆ Ausrichtung am Spalt' : '◆ Ausrichtung am Umriss', 3000);
  } catch (e) { showToast('❌ ' + e.message, 4000); }
  await renderMotive();
  motivEinstellungen(name);            // Einstellungen offen lassen
}

async function motivUmbenennen(alt, neu) {
  neu = String(neu || '').trim();
  if (!neu || neu === alt) return;
  try {
    const d = await _apiJson(`/v2/motive/${encodeURIComponent(alt)}/umbenennen`, 'POST', { neu });
    // Felder im GELADENEN Layout mitziehen — der Server hat nur layouts.json angefasst
    for (const f of _editorFelder()) {
      if (f.type !== 'motiv') continue;
      if (f.motivDatei === alt) f.motivDatei = d.name;
      for (const k of Object.keys(f.ddTabelle || {})) if (f.ddTabelle[k] === alt) f.ddTabelle[k] = d.name;
    }
    _ddMotivListe = null;              // Liste für „Je Antwort“ neu laden
    if (_motivCache[alt]) { _motivCache[d.name] = _motivCache[alt]; delete _motivCache[alt]; }
    scheduleRender(); renderFieldList(); renderProps();
    showToast(`✓ Umbenannt${d.layouts ? ` — ${d.layouts} Feld(er) in Layouts angepasst` : ''}`, 5000);
  } catch (e) { showToast('❌ ' + e.message, 4000); }
  renderMotive();
}

async function motivHochladen(files) {
  if (!files || !files.length) return;
  const info = document.getElementById('motiv-status');
  const zeig = (txt) => { if (info) { info.style.display = 'block'; info.textContent = txt; } };
  zeig('⏳ ' + files.length + ' Datei(en) werden umgerechnet…');
  const fd = new FormData();
  for (const f of files) fd.append('motive', f);
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(BASE_URL + '/v2/motive/upload', { method: 'POST', headers, credentials: 'include', body: fd });
    const d = await res.json().catch(() => ({}));
    if (!res.ok) { zeig('❌ ' + (d.error || 'HTTP ' + res.status)); return; }
    const gut = (d.motive || []).filter(m => !m.fehler);
    for (const m of gut) delete _motivCache[m.name];   // gleicher Name = neue Fassung
    const schlecht = (d.motive || []).filter(m => m.fehler);
    zeig((gut.length ? `✅ ${gut.length} übernommen` : '')
      + (schlecht.length ? `  ⚠️ ${schlecht.map(m => m.name + ': ' + m.fehler).join(', ')}` : ''));
    showToast(gut.length ? `✓ ${gut.length} Motiv(e) hinzugefügt` : '⚠️ Nichts übernommen', 5000);
  } catch (e) {
    zeig('❌ ' + e.message);
  }
  document.getElementById('motiv-datei').value = '';
  renderMotive();
}

async function motivLoeschen(name) {
  // Noch benutzt? Dann bliebe dort der Platz still ohne Motiv — vor dem Löschen sagen.
  let nutzer = [];
  try {
    nutzer = (await getServerLayouts()).filter(l => _layoutHat(l, f =>
      f.type === 'motiv' && (f.motivDatei === name || Object.values(f.ddTabelle || {}).includes(name)))).map(l => l.name);
  } catch (_) { }
  const hinweis = nutzer.length ? ` Es steckt noch in ${nutzer.length} Layout${nutzer.length === 1 ? '' : 's'} (${nutzer.slice(0, 5).join(', ')}${nutzer.length > 5 ? ' …' : ''}) — dort bliebe der Platz ohne Motiv.` : '';
  if (!await confirmModal('Motiv löschen?', `„${name}" wird vom Server entfernt.${hinweis}`, 'Löschen')) return;
  try {
    await _apiJson('/v2/motive/' + encodeURIComponent(name), 'DELETE');
    delete _motivCache[name]; _ddMotivListe = null;
    showToast('🗑 Motiv gelöscht');
  } catch (e) { showToast('❌ Nicht gelöscht: ' + e.message, 4000); }
  renderMotive();
}

// ── Schriften hochladen (manuell) ────────────────────────────────────────────
async function handleFontFiles(files) {
  if (!files.length) return;
  // An Server schicken (persistent)
  const formData = new FormData();
  for (const file of files) formData.append('fonts', file);
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/v2/fonts/upload`, { method: 'POST', headers, credentials: 'include', body: formData });
    const data = await res.json();
    if (data.success) {
      // Lokal laden damit sofort verfügbar
      for (const file of files) await loadUploadedFont(file);
    } else showToast('❌ Schrift nicht hochgeladen: ' + (data.error || 'HTTP ' + res.status), 5000);
  } catch (e) {
    // Fallback: nur lokal laden
    for (const file of files) await loadUploadedFont(file);
  }
}

function handleFontDrop(e) {
  e.preventDefault();
  document.getElementById('font-drop-zone').style.borderColor = '';
  handleFontFiles(e.dataTransfer.files);
}

async function loadUploadedFont(file) {
  const fontName = _schriftStamm(file.name); // z.B. "Monotype"
  const url = URL.createObjectURL(file);
  try {
    await _registerUploadedFont(fontName, url);
    renderFontsList();
    showToast('✓ Schrift geladen: ' + fontName);
  } catch (e) {
    showToast('❌ Fehler beim Laden: ' + file.name);
    console.error('Font load error:', e);
  } finally {
    // FontFace.load() hat die Datei bereits in den Speicher dekodiert — die Object-URL
    // wird danach nicht mehr gebraucht und freigegeben (sonst Leak pro Font-Upload).
    URL.revokeObjectURL(url);
  }
}

// ── Fonts vom Server laden (beim Start) ──────────────────────────────────────
async function loadFontsFromServer() {
  try {
    // Über getServerFontList, nicht über einen eigenen fetch: sonst holt der DXF-Font-
    // Loader dieselbe Liste ein zweites Mal, mit eigenem Cache — und removeFont
    // invalidiert nur einen der beiden.
    const files = await getServerFontList();
    if (!files.length) return;
    let loaded = 0;
    for (const filename of files) {
      const fontName = _schriftStamm(filename);
      if (_uploadedFonts[fontName]) continue; // bereits geladen
      try {
        await _registerUploadedFont(fontName, `${BASE_URL}/v2/fonts/${encodeURIComponent(filename)}`);
        loaded++;
      } catch (e) {
        console.warn('Font konnte nicht geladen werden:', filename, e);
      }
    }
    if (loaded > 0) renderFontsList();
  } catch (e) {
    console.warn('Fonts vom Server nicht abrufbar:', e);
  }
}

function renderFontsList() {
  const el = document.getElementById('fonts-list');
  if (!el) return;
  const names = Object.keys(_uploadedFonts);
  if (!names.length) {
    el.innerHTML = '<div class="uempty">Noch keine Schriften geladen</div>';
    return;
  }
  el.innerHTML = '';
  // DOM-Aufbau statt innerHTML-Template: Schriftname kommt aus dem Upload-Dateinamen
  // (nicht vertrauenswürdig) — textContent/addEventListener verhindern HTML/JS-Injection.
  for (const name of names) {
    const row = document.createElement('div');
    row.style.cssText = 'display:flex;align-items:center;gap:10px;padding:10px 12px;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-m);margin-bottom:6px;';

    const info = document.createElement('div');
    info.style.flex = '1';
    const title = document.createElement('div');
    title.style.cssText = 'font-size:var(--fs-gross);color:var(--text);';
    title.style.fontFamily = `'${name}', Arial`;
    title.textContent = name;
    const preview = document.createElement('div');
    preview.style.cssText = 'font-size:var(--fs-klein);color:var(--text-muted);margin-top:3px;';
    preview.style.fontFamily = `'${name}', Arial`;
    preview.textContent = 'Gravur Vorschau 123 ABC';
    info.appendChild(title);
    info.appendChild(preview);

    // Kein Häkchen: es stand bedingungslos da, auch wenn die Datei defekt war und der
    // Browser auf Arial auswich. Die Musterzeile darunter zeigt es ehrlich.
    const actions = document.createElement('div');
    actions.style.cssText = 'display:flex;align-items:center;gap:4px;';
    const btn = document.createElement('button');
    btn.className = 'zp-ikon';
    btn.title = 'Entfernen';
    btn.textContent = '✕';
    btn.addEventListener('click', () => removeFont(name));
    actions.appendChild(btn);

    row.appendChild(info);
    row.appendChild(actions);
    el.appendChild(row);
  }
}

async function removeFont(name) {
  // Rückfrage wie beim Motiv: die Datei verschwindet vom SERVER, und jede Bestellung mit dieser Schrift
  // hinge danach an Amazons Schrift-Link (nur mit Internet) bzw. bekäme eine Ersatzschrift.
  if (!await confirmModal('Schrift löschen?', `„${name}" wird vom Server entfernt. Bestellungen mit dieser Schrift werden danach nicht mehr mit der hinterlegten Datei graviert.`, 'Löschen')) return;
  // Exakten Server-Dateinamen case-insensitiv auflösen (Linux: "Monotype.TTF" vs "Monotype.ttf").
  // Nutzt dieselbe Liste/Logik wie der DXF-Font-Loader.
  _serverFontListCache = null; // frische Liste erzwingen
  let deleted = false;
  const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
  const delHeaders = token ? { Authorization: `Bearer ${token}` } : {};
  try {
    const list = await getServerFontList();
    const exact = matchServerFontFile(list, name);
    if (exact) {
      const res = await fetch(`${BASE_URL}/v2/fonts/${encodeURIComponent(exact)}`, { method: 'DELETE', headers: delHeaders, credentials: 'include' });
      // Abgelehnt (Rechte, Datei gesperrt): nicht „entfernt" melden und nicht aus der Liste nehmen
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        showToast('❌ Schrift nicht entfernt: ' + (d.error || 'HTTP ' + res.status), 4000);
        return;
      }
      deleted = true;
    }
  } catch (e) { }
  if (!deleted) {
    // Fallback: gängige Endungen (Groß-/Kleinschreibung) durchprobieren
    for (const e of ['ttf', 'otf', 'woff2', 'woff', 'TTF', 'OTF']) {
      try { if ((await fetch(`${BASE_URL}/v2/fonts/${encodeURIComponent(name + '.' + e)}`, { method: 'DELETE', headers: delHeaders, credentials: 'include' })).ok) deleted = true; } catch (_) { }
    }
  }
  _serverFontListCache = null; // Cache nach Löschung invalidieren
  delete _uploadedFonts[name];
  renderFontsList();
  // Ohne Datei auf dem Server war die Schrift nur in diesem Browser geladen — nicht „entfernt" behaupten
  showToast(deleted ? 'Schrift entfernt: ' + name : `„${name}" lag nicht auf dem Server — nur aus dieser Liste genommen`, deleted ? 1800 : 4000);
}

// ── Font + Text aus der Bestell-JSON lesen ───────────────────────────────────
// Amazon liefert die Gravurzeilen in einem oder mehreren CONTAINERN (Vorderseite, Rückseite, Deckel …)
// und nummeriert sie **in jedem Container neu ab 1** („Texteingabe 1/2/3“ vorne wie hinten).
//
// Regel (vom Nutzer festgelegt): **fortlaufend über die Container durchzählen.** Container 1 belegt
// Gravur 1…n, Container 2 macht bei n+1 weiter. INNERHALB eines Containers gilt die Zeilen-Nummer aus
// Etikett oder Platzhalter, nicht die Reihenfolge im JSON (bei F02_Schw_V2 steht „Texteingabe 2“ =
// Mitte VOR „Texteingabe 1“ = Oben).
//
// WIE VIELE Slots ein Container hat, darf NICHT aus der einzelnen Bestellung kommen: Amazon lässt weg,
// was der Kunde nicht gefüllt hat (eine Platzierung oder einen ganzen Container) — ein laufender
// Zähler rutschte dann nach vorne und gravierte Rückseitentext auf die Vorderseite. Die Slot-Zahl ist
// eine Eigenschaft des LISTINGS → `slotTabelle` lernt sie je ASIN aus allen vorliegenden Bestellungen.

// Text-Container einer Bestell-JSON in Dokumentreihenfolge, Zeilen je Container nach ihrer
// Nummer einsortiert. `ckey` ist die STABILE Kennung des Containers: Name der Produktseite
// (PreviewContainerCustomization) + Etikett des benannten ContainerCustomization, z. B.
// "Front Side|Text 1" oder "Oberfläche 1|Text 2". Nur über diese Kennung lässt sich
// überhaupt sagen, WELCHER Container in einer Bestellung fehlt — der Index im JSON
// verschiebt sich ja genau dann.
//
// `ereignisse` (optional): bekommt Dropdowns, Textzeilen und Bildfelder in Dokumentreihenfolge,
// je mit ihrer Produktseite — daraus liest _ddAuswerten, welche Gravur eine Frage steuert.
// Textzeilen tragen dort eine Referenz auf ihre Zeile; deren endgültige Nummer (`z.n`) und
// die endgültige Container-Kennung (`gruppe._ckey`) stehen erst nach dem Einsortieren fest.
function _textGruppen(wurzel, ereignisse) {
  // Zeilen-Nummer aus Etikett/Name („Texteingabe 2", „2. Zeile", „Text input 3").
  const lineOrd = (s) => {
    if (!s) return null;
    let mm = /(?:texteingabe|zeile|line|text\s*input)\s*#?\s*(\d+)/i.exec(s);
    if (mm) return parseInt(mm[1]);
    mm = /^\s*(\d+)\s*(?:zeile|line|[.)]|$)/i.exec(s);
    return mm ? parseInt(mm[1]) : null;
  };

  // Container einsammeln: jede Gruppe, die mindestens EINE Textzeile enthält.
  // Als Gruppe zählt der nächstgelegene ContainerCustomization; fehlt der (manche
  // Produkte hängen die Zeilen direkt unter die Seite), tritt der
  // PreviewContainerCustomization an seine Stelle.
  const gruppen = [];
  const walk = (node, gruppe, font, hint, seite, cont) => {
    if (!node || typeof node !== 'object') return;
    const nm = node.name || '', lbl = node.label || '';
    if (node.type === 'FontCustomization' && node.fontSelection?.family) {
      font = { family: node.fontSelection.family, url: node.fontSelection.fontUrl || null };
    }
    // Amazon hängt die FontCustomization als GESCHWISTER der Textzeilen unter den Container
    // ("Text 1" → [FontCustomization, ColorCustomization, Container→…→Text]), nicht als deren Vorfahr.
    // `font` wird by value weitergegeben und erreicht Geschwister nie — die Kundenschrift fiele auf Arial
    // zurück. Darum die direkten Kinder vorab durchsehen, BEVOR die Gruppe entsteht.
    const kindFont = (node.children || []).find(c =>
      c && c.type === 'FontCustomization' && c.fontSelection?.family);
    if (kindFont) {
      font = { family: kindFont.fontSelection.family, url: kindFont.fontSelection.fontUrl || null };
    }
    if (node.type === 'PreviewContainerCustomization') seite = nm;
    // Nur BENANNTE Container tragen die Kennung weiter — der namenlose Wrapper, unter dem
    // die Platzierungen hängen, darf sie nicht überschreiben.
    if (node.type === 'ContainerCustomization' && (lbl || nm)) cont = lbl || nm;
    if (node.type === 'PreviewContainerCustomization' || node.type === 'ContainerCustomization') {
      gruppe = { zeilen: [], font, ckey: seite + '|' + cont };   // erst bei Bedarf angehängt
    }
    const nr = lineOrd(nm) ?? lineOrd(lbl);
    if (nr != null) hint = nr;
    if (node.type === 'TextCustomization') {
      const wert = (node.inputValue || node.value || '').trim();
      let zeile = null;
      if (gruppe) {
        if (!gruppen.includes(gruppe)) gruppen.push(gruppe);
        gruppe.font = gruppe.font || font;
        zeile = { nr: hint, text: wert, font: font || gruppe.font };
        gruppe.zeilen.push(zeile);
      }
      if (ereignisse) ereignisse.push({ art: 'text', seite, zeile, gruppe: zeile ? gruppe : null, text: wert });
    } else if (ereignisse && node.type === 'OptionCustomization') {
      const o = node.optionSelection || {};
      ereignisse.push({
        art: 'frage', seite, name: nm, label: lbl,
        wert: String(o.label || o.name || node.displayValue || '').trim(),
        kosten: Number(o.additionalCost && o.additionalCost.amount) || 0
      });
    } else if (ereignisse && node.type === 'ImageCustomization') {
      ereignisse.push({ art: 'bild', seite, hoch: !!(node.image && node.image.imageName) });
    }
    for (const c of (node.children || [])) walk(c, gruppe, font, hint, seite, cont);
  };
  walk(wurzel, null, null, null, '', '');

  const out = [];
  const gesehen = new Set();
  for (const g of gruppen) {
    if (!g.zeilen.length) continue;
    // Innerhalb der Gruppe nach Zeilen-Nummer einsortieren; Zeilen ohne Nummer
    // hängen sich in der Reihenfolge an, in der sie im JSON stehen.
    const nach = {};
    let frei = 0;
    for (const z of g.zeilen) {
      let n = (z.nr != null) ? z.nr : (++frei);
      if (nach[n] != null) n = ++frei;
      nach[n] = z;
      z.n = n;   // endgültige Zeile im Container (für _ddAuswerten)
    }
    // Zwei Container mit gleicher Kennung in EINER Bestellung sind bisher nie vorgekommen
    // (geprüft an 281 Positionen). Falls doch, bekommt der zweite eine eigene Kennung,
    // damit er dem ersten nicht den Slot wegnimmt.
    let ckey = g.ckey;
    while (gesehen.has(ckey)) ckey += '#';
    gesehen.add(ckey);
    g._ckey = ckey;
    out.push({ ckey, nach, hoechste: Math.max(...Object.keys(nach).map(Number)), font: g.font });
  }
  return out;
}

// ── Slot-Tabelle je ASIN ─────────────────────────────────────────────────────
// Wie viele Gravur-Slots ein Container hat, steht NIRGENDS in der Bestell-JSON — die Zahl gehört aber
// zum Listing und ist über alle Bestellungen derselben ASIN gleich. Also aus allen lernen:
//   reihe  = Container-Reihenfolge der VOLLSTÄNDIGSTEN Bestellung (bei Gleichstand alphabetisch,
//            damit dieselben Daten immer dieselbe Tabelle ergeben)
//   kap    = höchste je gesehene Zeilen-Nummer je Container
//   offset = Summe der Kapazitäten aller Container davor
// Bewusst KEINE Sortierung nach der Container-Nummer („Text 1“/„Text 2“): die Layouts sind gegen die
// Dokumentreihenfolge gebaut. Kennt die Tabelle einen Container nicht (neues Listing), zählt er
// hinten weiter — nie schlechter als vorher.
const _slotTab = {};       // asin → { tabellen, zuordnung, seiten } | null (s. _slotTabellenBauen)
const _slotTabLaden = {};  // asin → Promise
// Die Tabelle muss unabhängig vom eingestellten Zeitraum sein: die globale `orders`-Liste
// ist im Editor nach Datums-Preset gefiltert, und eine Tabelle, die je nach Filter anders
// ausfällt, wäre genau die Unzuverlässigkeit, die hier beseitigt werden soll. Im
// Auto-Export ist `orders` ohnehin die volle Liste (fetchOrdersForFill).
let _alleOrdersCache = null;
// null = Liste nicht ladbar. Dann wird NICHTS gemerkt und nicht auf die nach Zeitraum gefilterte
// `orders` ausgewichen — genau diese Abhängigkeit vom Filter soll die Tabelle nicht haben. Der nächste
// Aufruf versucht es neu.
async function _alleOrders() {
  if (_alleOrdersCache) return _alleOrdersCache;
  try {
    const liste = await _apiJson('/v2/orders');
    if (!Array.isArray(liste)) throw new Error('keine Liste');
    return (_alleOrdersCache = liste);
  } catch (e) {
    console.error('Bestellliste für die Slot-Tabelle nicht ladbar:', e.message);
    return null;
  }
}
// ── Fassungen eines Listings ─────────────────────────────────────────────────
// Baut der Händler ein Listing um, heißen die Produktseiten anders. Eine Tabelle über BEIDE Fassungen
// stellte die alten Container vor die neuen (Deckeltext Gravur 5 statt 1, Felder 1–4 leer) — solange
// alte Bestellungen lokal liegen oder „Reklam.“ eine nachlädt. Deshalb zählt jede Fassung für sich.
// Fassung = Menge der Seitennamen (PreviewContainerCustomization.name, wie in der ckey). Alte Seiten
// nur herauszufiltern reicht nicht (eine Fassung kann eine alte Seite behalten). Fehlt einer
// Bestellung eine Seite, gehört sie zu der Fassung, die alle ihre Seiten enthält.
function _seitenSig(cd) {
  return [...new Set(_seitenNamen(cd))].sort();
}
// Seitennamen (PreviewContainerCustomization) einer Bestellung in Amazon-Reihenfolge —
// Seite N ist bild-N.jpg.
function _seitenNamen(cd) {
  const seiten = [];
  const walk = n => {
    if (!n || typeof n !== 'object') return;
    if (n.type === 'PreviewContainerCustomization') seiten.push(n.name || '');
    for (const c of (n.children || [])) walk(c);
  };
  walk(cd);
  return seiten;
}
const _sigKey = (seiten) => seiten.join('\u0001');

// sigs: Map sigKey → { seiten: Set, n } → { sigKey: Fassungs-Schlüssel }
function _fassungZuordnung(sigs) {
  const liste = [...sigs.entries()];
  const zu = {};
  for (const [k, v] of liste) {
    let best = null;
    for (const [k2, v2] of liste) {
      if (k2 === k || v2.seiten.size <= v.seiten.size) continue;
      if (![...v.seiten].every(s => v2.seiten.has(s))) continue;
      if (!best || v2.n > best[1].n || (v2.n === best[1].n && v2.seiten.size > best[1].seiten.size)) best = [k2, v2];
    }
    zu[k] = best ? best[0] : k;
  }
  for (const k of Object.keys(zu)) {          // a ⊂ b ⊂ c → a gehört zu c
    let z = zu[k], i = 0;
    while (zu[z] !== z && i++ < 20) z = zu[z];
    zu[k] = z;
  }
  return zu;
}

// Slot-Tabelle aus den Container-Folgen EINER Fassung (Regeln s. oben bei slotTabelle)
function _slotAusFolgen(seqs, kap) {
  if (!seqs.length) return null;
  seqs.sort((a, b) => (b.length - a.length) || (a.join(' ') < b.join(' ') ? -1 : 1));
  const reihe = seqs[0].slice();
  for (const s of seqs) for (const ck of s) if (!reihe.includes(ck)) reihe.push(ck);
  const offset = {};
  let off = 0;
  for (const ck of reihe) { offset[ck] = off; off += (kap[ck] || 1); }
  return { reihe, offset, kap };
}

// Container-Folgen je Fassung → { tabellen, zuordnung, seiten }. Eingabe: Liste von
// { seiten: [..], cs: _textGruppen(...), n } — Bestellungen beim Füllen, Formen im ASIN-Check.
function _slotTabellenBauen(eintraege) {
  const sigs = new Map();
  for (const e of eintraege) {
    const k = _sigKey(e.seiten);
    const s = sigs.get(k) || { seiten: new Set(e.seiten), n: 0 };
    s.n += e.n || 1;
    sigs.set(k, s);
  }
  const zuordnung = _fassungZuordnung(sigs);
  const proFassung = {};
  for (const e of eintraege) {
    if (!e.cs.length) continue;
    const f = zuordnung[_sigKey(e.seiten)];
    const p = proFassung[f] || (proFassung[f] = { seqs: [], kap: {} });
    p.seqs.push(e.cs.map(c => c.ckey));
    for (const c of e.cs) p.kap[c.ckey] = Math.max(p.kap[c.ckey] || 0, c.hoechste);
  }
  const tabellen = {};
  for (const [f, p] of Object.entries(proFassung)) tabellen[f] = _slotAusFolgen(p.seqs, p.kap);
  const seiten = {};
  for (const [k, v] of sigs) seiten[k] = v;
  return { tabellen, zuordnung, seiten };
}

// Tabelle für eine Bestellung mit diesen Seiten. Unbekannte Seiten-Kombination (Bestellung
// kam nach dem Aufbau der Tabelle): die Fassung, die alle ihre Seiten enthält.
function _slotFuer(tabs, seiten) {
  if (!tabs) return null;
  const k = _sigKey(seiten);
  let f = tabs.zuordnung[k];
  if (f == null) {
    let best = null;
    for (const [k2, v2] of Object.entries(tabs.seiten)) {
      if (!seiten.every(s => v2.seiten.has(s))) continue;
      const ziel = tabs.zuordnung[k2];
      if (!best || v2.n > best.n) best = { f: ziel, n: v2.n };
    }
    f = best ? best.f : null;
  }
  return (f != null && tabs.tabellen[f]) || null;
}

async function slotTabelle(asin) {
  if (!asin) return null;
  if (asin in _slotTab) return _slotTab[asin];
  if (!(asin in _slotTabLaden)) {
    _slotTabLaden[asin] = (async () => {
      const alle = await _alleOrders();
      if (!alle) return undefined;   // nicht ladbar: nichts merken (s. unten)
      const gleiche = alle.filter(o => o.asin === asin);
      const eintraege = [];
      for (let i = 0; i < gleiche.length; i += 8) {
        const teil = await Promise.all(gleiche.slice(i, i + 8)
          .map(o => _fetchOrderJson(o).catch(() => null)));
        for (const d of teil) {
          if (!d || !d.customizationData) continue;
          eintraege.push({ seiten: _seitenSig(d.customizationData), cs: _textGruppen(d.customizationData), n: 1 });
        }
      }
      if (!eintraege.some(e => e.cs.length)) return null;
      return _slotTabellenBauen(eintraege);
    })().then(t => {
      // undefined = Bestellliste fehlte → ohne Tabelle weiter (Zählung wie früher), nächster
      // Aufruf baut sie neu. null = wirklich keine Textzeilen bekannt, das gilt.
      if (t === undefined) { delete _slotTabLaden[asin]; return null; }
      _slotTab[asin] = t; return t;
    });
  }
  return _slotTabLaden[asin];
}

async function getAllTexts(order) {
  const empty = { texts: [], fonts: [], ..._ddLeer() };
  const data = await _fetchOrderJson(order);
  if (!data) return empty;
  try {
    // Dropdown-Antworten (s. _ddAuswerten) hängen an JEDEM Rückgabeweg, auch am Fallback.
    let dd = null;
    if (data.customizationData) {
      const ereignisse = [];
      const gruppen = _textGruppen(data.customizationData, ereignisse);
      const offsets = {};   // ckey → Offset, genau wie unten vergeben
      let texts = [], fonts = [];
      if (gruppen.length) {
        const tab = _slotFuer(await slotTabelle(order && order.asin), _seitenSig(data.customizationData));
        let frei = 0;   // Auffangposition für Container, die die Tabelle nicht kennt
        for (const g of gruppen) {
          const off = (tab && tab.offset[g.ckey] != null) ? tab.offset[g.ckey] : frei;
          offsets[g.ckey] = off;
          const hoechste = Math.max(g.hoechste, (tab && tab.kap[g.ckey]) || 0);
          for (let i = 1; i <= hoechste; i++) {
            const z = g.nach[i], at = off + i - 1;
            // Nie einen schon belegten Slot überschreiben — genau daran ging früher die
            // Vorderseite verloren.
            if (texts[at]) continue;
            texts[at] = (z && z.text) || '';
            fonts[at] = (z && z.font) || g.font || { family: 'Arial', url: null };
          }
          frei = Math.max(frei, off + hoechste);
        }
        for (let i = 0; i < texts.length; i++) {
          if (texts[i] == null) texts[i] = '';
          if (fonts[i] == null) fonts[i] = { family: 'Arial', url: null };
        }
        // Hintere Leerzeilen abschneiden — sie sagen nichts aus und blähen nur die Liste.
        while (texts.length && !texts[texts.length - 1]) { texts.pop(); fonts.pop(); }
      }
      dd = _ddAuswerten(ereignisse, ev => (ev.zeile && ev.gruppe && offsets[ev.gruppe._ckey] != null)
        ? offsets[ev.gruppe._ckey] + ev.zeile.n : null);
      dd.titel = data.title || '';
      if (texts.length) return { texts, fonts, ...dd };
    }

    // ── FALLBACK 2: customizationInfo version3.0 ──
    {
      const texts = [], fonts = [];
      if (data.customizationInfo?.['version3.0']?.surfaces) {
        for (const s of data.customizationInfo['version3.0'].surfaces)
          for (const a of (s.areas || [])) if (a.text?.trim()) {
            texts.push(a.text.trim());
            fonts.push({ family: a.fontFamily || 'Arial', url: a.fontUrl || null });
          }
      }
      return { texts, fonts, ...(dd || { ..._ddLeer(), titel: data.title || '' }) };
    }
  } catch (e) { console.error('getAllTexts error:', e); return empty; }
}

// ── Dropdowns (Amazon OptionCustomization) ───────────────────────────────────
// Tragende Regeln, an einer Woche Bestellungen geprüft:
//  • Eine Ja/Nein-Frage steuert die Text- und Bildfelder, die auf DERSELBEN Produktseite hinter ihr
//    stehen, bis zur nächsten Ja/Nein-Frage (die Beschriftung taugt dafür nicht).
//  • Jeder Nein-Wert beginnt mit „Ohne“, „Keine“ oder „Nein“.
//  • Amazon verknüpft Frage und Feld NICHT: wer die Rückseite bezahlt, kann das Feld leer lassen —
//    daraus werden Hinweise, keine Sperren.
// Die Antworten liest getAllTexts mit. Darauf bauen: „nichts zu gravieren“ → kein Platz, die
// Packliste im Auto-Export, „Inhalt aus Dropdown“ am Feld und „Nur Bestellungen mit …“ am Layout.
const _ddNorm = s => String(s || '').toLowerCase().replace(/[?!.:,;()"'„“”+]/g, ' ').replace(/\s+/g, ' ').trim();
const _ddIstNein = w => /^(ohne|keine?|nein|no)\b/.test(_ddNorm(w));
function _ddThemaVon(t) {
  t = _ddNorm(t);
  if (!t) return null;
  if (/buchstabe|initiale/.test(t)) return 'buchstabe';
  if (/geschenk|samtbeutel|verpackung/.test(t)) return 'geschenk';
  if (/rückseite|rueckseite|hinten|back/.test(t)) return 'rueckseite';
  if (/vorderseite|vorne|front/.test(t)) return 'vorderseite';
  if (/farbe|größe|groesse|variante|material|länge|laenge/.test(t)) return 'variante';
  if (/symbol|motiv|design|sternzeichen|icon/.test(t)) return 'motiv';
  if (/personalisier|gravur/.test(t)) return 'personalisierung';
  return null;
}
// Die Frage, die der Kunde sieht (label), sagt mehr als der interne Name („Dropdown-Option 1").
function _ddThema(name, label) { return _ddThemaVon(label) || _ddThemaVon(name) || 'sonstiges'; }
const _DD_STEUERND = new Set(['personalisierung', 'vorderseite', 'rueckseite']);
const _DD_TITEL = {
  personalisierung: 'Personalisierung', vorderseite: 'Vorderseite', rueckseite: 'Rückseite',
  geschenk: 'Verpackung', variante: 'Ausführung', buchstabe: 'Buchstabe', motiv: 'Motiv', sonstiges: 'Auswahl'
};
// Fragen, deren Antwort eine GRAFIK auswählt — dafür legt der Layout-Entwurf ein Motivfeld an.
const _DD_GRAFIK = new Set(['buchstabe', 'motiv']);
// Nein gewählt, aber trotzdem Text eingegeben: wird graviert (Kulanz) und steht als Hinweis
// auf der Packliste (Entscheidung 25.09.2026; der Schalter „leer lassen" ist am 06.10. entfallen).
const _ddEuro = n => Number(n || 0).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';

function _ddLeer() { return { auswahl: [], hatBild: false, hatText: false, hatGrafik: false, titel: '' }; }

// Ereignisse aus _textGruppen → Antworten. nrVon(ereignis) liefert die Gravur-Nummer einer
// Textzeile (oder null, wenn sie nicht nummeriert wird).
function _ddAuswerten(ereignisse, nrVon) {
  const auswahl = [];
  let hatBild = false, hatText = false, hatGrafik = false, seite = null, steuer = null;
  for (const ev of ereignisse || []) {
    if (ev.seite !== seite) { seite = ev.seite; steuer = null; }   // neue Produktseite
    if (ev.art === 'frage') {
      const a = {
        frage: ev.label || ev.name || '', name: ev.name || '', wert: ev.wert || '',
        kosten: ev.kosten || 0, thema: _ddThema(ev.name, ev.label), nein: _ddIstNein(ev.wert),
        steuernd: false, steuert: [], bilder: 0, gefuellt: false, gesperrt: false, seite: ev.seite || ''
      };
      if (_DD_STEUERND.has(a.thema)) { a.steuernd = true; steuer = a; }
      // Hinter „Ohne Gravur" gilt auch eine Auswahl wie „Buchstabe" nicht mehr.
      else if (steuer && steuer.nein) a.gesperrt = true;
      // Eine gewählte Grafik (Buchstabe, Motiv) IST Gravur-Inhalt — das Monogramm von F02 V3/V4 braucht
      // keinen Text (sonst stünde „nur Buchstabe D“ als „ohne Gravur versenden“ auf der Packliste).
      if (_DD_GRAFIK.has(a.thema) && !a.gesperrt && a.wert && !a.nein) {
        hatGrafik = true;
        if (steuer && !steuer.nein) steuer.gefuellt = true;
      }
      auswahl.push(a);
    } else if (ev.art === 'text') {
      const voll = !!(ev.zeile && ev.zeile.text);
      if (voll) hatText = true;
      if (steuer) {
        const nr = nrVon(ev);
        if (nr != null && !steuer.steuert.includes(nr)) steuer.steuert.push(nr);
        if (voll) steuer.gefuellt = true;
      }
    } else if (ev.art === 'bild') {
      if (ev.hoch) hatBild = true;
      if (steuer) { steuer.bilder++; if (ev.hoch) steuer.gefuellt = true; }
    }
  }
  for (const a of auswahl) a.steuert.sort((x, y) => x - y);
  return { auswahl, hatBild, hatText, hatGrafik };
}

// Je Bestellposition (_orderKey): Antworten, Hinweise und „nichts zu gravieren".
// Bestell-JSONs sind unveränderlich, geleert wird trotzdem mit _orderJsonCache.
const _ddCache = new Map();
function _ddEintrag(t) {
  const auswahl = t.auswahl || [];
  const hinweise = [];
  for (const a of auswahl) {
    if (!a.steuernd) continue;
    const was = _DD_TITEL[a.thema];
    if (!a.nein && a.kosten > 0 && !a.gefuellt) {
      hinweise.push(`${was} bezahlt (+${_ddEuro(a.kosten)}), aber nichts eingegeben`);
    } else if (a.nein && a.gefuellt) {
      hinweise.push(`${was}: „${a.wert}" gewählt, aber Text eingegeben — wird graviert`);
    }
  }
  // Nur mit ausdrücklichem Nein: eine Bestellung, die einfach leer ist, läuft wie bisher.
  const ohneGravur = !t.hatText && !t.hatBild && !t.hatGrafik && auswahl.some(a => a.steuernd && a.nein);
  return {
    auswahl, hinweise, ohneGravur, hatText: !!t.hatText, hatBild: !!t.hatBild, hatGrafik: !!t.hatGrafik,
    titel: t.titel || ''
  };
}

async function _ddVorbereiten(liste) {
  const offen = new Map();
  for (const o of liste || []) {
    const k = _orderKey(o);
    if (!_ddCache.has(k) && !offen.has(k)) offen.set(k, o);
  }
  const eintraege = [...offen.entries()];
  for (let i = 0; i < eintraege.length; i += 8) {
    await Promise.all(eintraege.slice(i, i + 8).map(async ([k, o]) => {
      try { _ddCache.set(k, _ddEintrag(await getAllTexts(o))); }
      catch (e) { console.warn('Dropdown-Auswertung fehlgeschlagen:', o.id, e); }
    }));
  }
}

function _ddAntwort(eintrag, frage) {
  if (!eintrag || !frage) return null;
  const f = _ddNorm(frage);
  return eintrag.auswahl.find(a => _ddNorm(a.frage) === f)
    || eintrag.auswahl.find(a => _ddNorm(a.name) === f) || null;
}

// Stufe 3: passt eine Bestellung zu „Nur Bestellungen mit …" ({ frage, werte: [...] })?
// Unbekannte Bestellung oder Frage fehlt → passt nicht (das Layout nimmt nur, was sicher passt).
function _ddPasst(o, bed) {
  return _ddTrifft(_ddCache.get(_orderKey(o)), bed);
}

// ── Stufe 2: „Inhalt aus Dropdown" am Feld ──────────────────────────────────
// Feld-Schlüssel (gespeichert): ddFrage (Frage, wie der Kunde sie sieht), ddModus
// ('wert' | 'tabelle' beim Text), ddTabelle ({ Wert: Text bzw. Motivdatei }).
// Flüchtig: _ddKey (Bestellposition), _motivDatei (aufgelöstes Motiv), _ddLeer.
// Antwort-Kacheln zum Anhaken — „Nur gravieren, wenn …" am Feld und die Layout-Weiche.
// aufruf(wert) = onchange-Code; zaehl = { Antwort: Anzahl Bestellungen } (optional).
function _ddHaken(werte, gewaehlt, aufruf, klasse = '', zaehl = null) {
  return `<div class="dd-werte${klasse}">${werte.map(v => {
    const an = (gewaehlt || []).some(x => _ddNorm(x) === _ddNorm(v));
    const n = zaehl && zaehl[v];
    return `<label class="dd-wahl${an ? ' an' : ''}"><input type="checkbox" ${an ? 'checked' : ''} onchange="${aufruf(v)}"/>${_esc(v)}${n ? ` <span class="umut10">(${n})</span>` : ''}</label>`;
  }).join('')}</div>`;
}
// „Graviert wird: die Antwort selbst / eigener Text je Antwort" und die Text-Tabelle dazu —
// Karte „Dropdown-Text" und Dropdown-Teil eines Textfelds.
function _ddModusWahl(f) {
  const tabelle = f.ddModus === 'tabelle';
  return `<select onchange="ddSetzen(${f.id},{ddModus:this.value==='tabelle'?'tabelle':null})">
          <option value="wert"${tabelle ? '' : ' selected'}>die Antwort selbst</option>
          <option value="tabelle"${tabelle ? ' selected' : ''}>eigener Text je Antwort</option></select>`;
}
function _ddTextTabelle(f, werte) {
  return werte.length ? werte.map(v => `<div class="dd-zeile"><span class="dd-wert" title="${_esc(v)}">${_esc(v)}</span>
          <input value="${_esc((f.ddTabelle || {})[v] || '')}" placeholder="Text" onchange="ddTabelleSetzen(${f.id},'${_jsStr(v)}',this.value)"/></div>`).join('')
    : '<div class="umut10 dd-hinweis">Noch keine Antworten bekannt.</div>';
}
function _ddTabellenWert(tab, wert) {
  const k = Object.keys(tab || {}).find(x => _ddNorm(x) === _ddNorm(wert));
  return k != null ? tab[k] : null;
}
function _ddFeldText(f, eintrag) {
  const a = _ddAntwort(eintrag, f.ddFrage);
  if (!a || a.gesperrt || !a.wert) return '';
  if (f.ddModus === 'tabelle') return String(_ddTabellenWert(f.ddTabelle, a.wert) ?? '');
  return a.wert;
}

// Motivbibliothek (Dateinamen) — einmal je Füllen geladen, damit ein Eintrag der
// Zuordnung ohne Endung („Monogramm_M") die echte Datei „Monogramm_M.svg" findet.
let _ddMotivListe = null;
async function _ddMotivListeLaden(neu) {
  if (_ddMotivListe && !neu) return _ddMotivListe;
  try {
    const l = await _apiJson('/v2/motive');
    _ddMotivListe = (Array.isArray(l) ? l : []).filter(m => m && m.name && !m.fehler).map(m => m.name);
  } catch (_) { _ddMotivListe = _ddMotivListe || []; }
  return _ddMotivListe;
}
// Name (mit oder ohne Endung, Groß/klein egal) → vorhandene Motivdatei oder null
function _ddMotivDatei(name) {
  if (!name) return null;
  const liste = _ddMotivListe || [];
  const n = String(name).trim().toLowerCase();
  return liste.find(m => m.toLowerCase() === n)
    || liste.find(m => m.toLowerCase().replace(/\.[a-z0-9]+$/, '') === n) || null;
}
// { a, name, gesetzt }: gesetzt = für diese Antwort ist etwas eingetragen — auch „kein Motiv"
// (leerer Eintrag, z. B. bei „Kein Symbol"). Nicht gesetzt → Warnung im Lauf.
function _ddMotivName(f, eintrag) {
  const a = _ddAntwort(eintrag, f.ddFrage);
  if (!a || a.gesperrt || !a.wert) return { a, name: null, gesetzt: true };
  const k = Object.keys(f.ddTabelle || {}).find(x => _ddNorm(x) === _ddNorm(a.wert));
  if (k != null) return { a, name: f.ddTabelle[k] || null, gesetzt: true };
  return { a, name: null, gesetzt: false };
}

// „Nur gravieren, wenn …" (ddWenn = { frage, werte }). Unvollständig (keine Frage oder nichts
// angehakt) gilt nicht — so filtert eine halb eingerichtete Bedingung nicht still alles weg.
function _ddBedingungOk(f, eintrag) {
  return _ddTrifft(eintrag, f && f.ddWenn);
}
// EINE Regel für beide Bedingungen ({ frage, werte }): Layout-Weiche und „Nur gravieren, wenn“.
// Eine Antwort hinter „Ohne Gravur“ (gesperrt) trifft nie.
function _ddTrifft(eintrag, bed) {
  if (!bed || !bed.frage || !(bed.werte || []).length) return true;
  const a = _ddAntwort(eintrag, bed.frage);
  return !!a && !a.gesperrt && bed.werte.some(x => _ddNorm(x) === _ddNorm(a.wert));
}

// Warnungen eines Füll-/Exportlaufs (fehlendes Motiv …) — der Auto-Export meldet sie.
const _ddWarnungen = new Set();

// Welche Bestellung gehört zu einem Dropdown-Motiv? Die der Felder, die es überdeckt (beim
// Monogramm das Textfeld im Spalt). Überdeckt es keins mit Bestellung, ist sein Platz leer —
// bewusst KEIN „nächstgelegenes Feld": bei halbvollem Blech wäre das der Nachbarplatz.
function _ddTraeger(f, alle) {
  let best = null, bestF = 0;
  for (const x of alle) {
    if (x === f || !x._ddKey || !(x.type === 'text' || x.type === 'image' || x.type === 'number')) continue;
    const w = Math.min(f.x + f.w, x.x + x.w) - Math.max(f.x, x.x);
    const h = Math.min(f.y + f.h, x.y + x.h) - Math.max(f.y, x.y);
    if (w > 0 && h > 0 && w * h > bestF) { bestF = w * h; best = x; }
  }
  return best;
}
// Motivfelder mit Dropdown („Motiv je Antwort") oder Bedingung („Nur gravieren, wenn …").
// _ddAus = Bedingung nicht erfüllt bzw. leerer Platz → kein Motiv, auch kein festes.
// Regel-Motive (Motiv je Antwort / Bedingung) gehören zu ihrem PLATZ wie Text- und Bildfelder:
// nach Position sortiert (oben links zuerst), Motiv k bekommt die Bestellung von Platz k. So
// muss ein Motiv kein Textfeld überdecken, und ein Layout nur aus Motiven geht auch.
function _ddRegelMotive(pageFields) {
  return pageFields.filter(f => _istMotiv(f) && !f.arrayOf && (f.ddFrage || f.ddWenn))
    .sort(_nachPosition);
}
function _ddMotiveSetzen(pageFields) {
  for (const f of pageFields) {
    if (!_istMotiv(f) || f.arrayOf || !(f.ddFrage || f.ddWenn)) continue;
    f._motivDatei = null; f._ddLeer = !!f.ddFrage; f._ddAus = false;
    // Vom Füllen an den Platz gebunden (s. _ddRegelMotive) — sonst über ein überdecktes Feld.
    if (!f._ddKey) {
      const t = _ddTraeger(f, pageFields);
      if (t) { f._ddKey = t._ddKey; f.orderId = t.orderId; }
    }
    if (!f._ddKey) { f.orderId = null; if (f.ddWenn) f._ddAus = true; continue; }
    const e = _ddCache.get(f._ddKey);
    if (!_ddBedingungOk(f, e)) { f._ddAus = true; f._ddLeer = true; continue; }
    if (!f.ddFrage) continue;   // nur Bedingung: das feste Motiv des Feldes bleibt
    const { a, name, gesetzt } = _ddMotivName(f, e);
    if (!name) {
      if (!gesetzt) _ddWarnungen.add(`${f.orderId}: Für ${f.ddFrage} = „${a.wert}" ist kein Motiv zugeordnet — Platz bleibt ohne Motiv`);
      continue;
    }
    const datei = _ddMotivDatei(name);
    if (datei) { f._motivDatei = datei; f._ddLeer = false; }
    else _ddWarnungen.add(`${f.orderId}: Motiv „${name}" für ${f.ddFrage} = „${a.wert}" fehlt — Platz bleibt ohne Motiv`);
  }
}

// ── Packliste (Auto-Export) ──────────────────────────────────────────────────
// Für den Packer: was außer der Gravur zu beachten ist. Je Lauf eine packliste.txt im
// Tagesordner. Aufgeführt wird nur, wer etwas mitbringt: Verpackung, Ausführung (Farbe und
// Größe aus dem Dropdown — die ASIN allein sagt das bei den Armbändern nicht), „ohne Gravur
// versenden" und Hinweise. Auch Artikel ohne Layout (Armbänder …) stehen drin: die
// Verpackung braucht der Packer für JEDE Bestellung.
const _ddKurz = (t, n) => { t = String(t || '').replace(/\s+/g, ' ').trim(); return t.length > n ? t.slice(0, n - 1) + '…' : t; };
function _ddVerpackungArt(wert) {
  const w = _ddNorm(wert);
  if (/2\s*x/.test(w) && /box/.test(w)) return { art: 'Geschenkbox', stueck: 2 };
  if (/beutel/.test(w)) return { art: 'Samtbeutel', stueck: 1 };
  if (/box/.test(w)) return { art: 'Geschenkbox', stueck: 1 };
  return { art: wert, stueck: 1 };
}
// belegtIn: orderId → [Layoutnamen]. Liefert { text, hinweise: [..] }.
function _packliste(sessionData, belegtIn, datum, lauf) {
  const verp = [], ausf = [], ohne = [], hinw = [], summe = {};
  const wo = (o, e) => (belegtIn[o.id] && belegtIn[o.id].length) ? belegtIn[o.id].join(', ')
    : (_ddKurz(e.titel, 44) || o.asin || '');
  const gesehen = new Set();
  let artikel = 0;
  for (const o of [...sessionData].sort((a, b) => String(a.id).localeCompare(String(b.id)))) {
    const k = _orderKey(o);
    if (gesehen.has(k)) continue;
    gesehen.add(k);
    artikel++;
    const e = _ddCache.get(k);
    if (!e) continue;
    const menge = Math.max(1, Number(o.quantity) || 1);
    const mz = menge > 1 ? ` (Menge ${menge})` : '';
    for (const a of e.auswahl) {
      if (a.gesperrt || !a.wert) continue;
      if (a.thema === 'geschenk' && !a.nein) {
        const v = _ddVerpackungArt(a.wert);
        summe[v.art] = (summe[v.art] || 0) + v.stueck * menge;
        verp.push([o.id, a.wert + mz, wo(o, e)]);
      } else if (a.thema === 'variante') {
        ausf.push([o.id, a.wert + mz, wo(o, e)]);
      }
    }
    if (e.ohneGravur) ohne.push([o.id, (_ddKurz(e.titel, 44) || o.asin || '') + mz, '']);
    for (const h of e.hinweise) hinw.push([o.id, h, wo(o, e)]);
  }
  // Spalten, solange der mittlere Text passt; längere (Hinweise) mit „ · " statt Spalte.
  const zeile = r => {
    const mitte = String(r[1]);
    return '  ' + r[0].padEnd(21) + ' ' + (mitte.length <= 38 ? mitte.padEnd(38) + ' ' + (r[2] || '') : mitte + (r[2] ? ' · ' + r[2] : ''));
  };
  const uhr = _berlinUhrzeit();
  const teile = [`PACKLISTE ${datum.split('-').reverse().join('.')} · Lauf ${lauf} · erstellt ${uhr} Uhr`,
  `${artikel} Artikel in diesem Lauf`, ''];
  const abschnitt = (titel, rows) => { if (rows.length) teile.push(titel, ...rows.map(zeile), ''); };
  const summeTxt = Object.entries(summe).sort((a, b) => b[1] - a[1]).map(([k, n]) => `${n} × ${k}`).join(' · ');
  abschnitt(`VERPACKUNG${summeTxt ? '  (' + summeTxt + ')' : ''}`, verp);
  abschnitt('AUSFÜHRUNG  (Farbe/Größe aus dem Dropdown)', ausf);
  abschnitt('OHNE GRAVUR VERSENDEN  (kein Platz auf dem Blech)', ohne);
  abschnitt('HINWEISE', hinw);
  if (!verp.length && !ausf.length && !ohne.length && !hinw.length) teile.push('Nichts Besonderes: keine Verpackung, keine Ausführung, keine Hinweise.', '');
  return { text: '﻿' + teile.join('\r\n'), hinweise: hinw.map(r => `${r[0]}: ${r[1]}`) };
}

// ── Fragen und Werte für die Auswahllisten ──────────────────────────────────
// Kommen aus den ASIN-Check-Profilen der ASINs, die das Layout füllt (Füll-ASIN bzw. die
// ASIN je Feld). Die Profile lernen bei jedem Download mit — den ASIN-Check muss niemand
// öffnen. Fehlt ein Profil (neue ASIN ohne Bestellung), lässt sich die Frage eintippen.
const _ddProfile = new Map();   // asin → Promise<Profil|null>
// ASINs des Layouts im Editor — dieselbe Regel wie für gespeicherte Layouts (_layoutAsinSet).
function _ddAsinsImEditor() {
  return [..._layoutAsinSet({ singleAsinMode: getSingleAsinMode(), globalAsin: getGlobalAsin(), pages: [_editorFelder()] })];
}
function _ddFragenAusProfil(p, ziel) {
  for (const [k, w] of Object.entries((p && p.werte) || {})) {
    const sig = k.split('/').pop().replace(/#\d+$/, '').split('|');
    if (sig[0] !== 'OptionCustomization') continue;
    const frage = sig[2] || sig[1];
    if (!frage) continue;
    const key = _ddNorm(frage);
    const e = ziel.get(key) || { frage, thema: _ddThema(sig[1], sig[2]), werte: {}, anzahl: 0 };
    for (const [wert, n] of Object.entries(w.werte || {})) { if (wert && wert !== '(leer)') e.werte[wert] = (e.werte[wert] || 0) + n; }
    e.anzahl += w.gesehen || 0;
    ziel.set(key, e);
  }
}
// Liefert die Fragen synchron, sobald geladen; sonst null und lädt im Hintergrund (danach ruft es
// `fertig` auf, z. B. renderProps). JEDER Aufrufer, der während des Ladens fragt, wird danach neu
// gezeichnet — nicht nur der erste.
let _ddFragenStand = { schluessel: null, fragen: null, warten: new Set() };
function _ddFragen(asins, fertig) {
  const schluessel = asins.slice().sort().join(',');
  if (_ddFragenStand.schluessel === schluessel && _ddFragenStand.fragen) return _ddFragenStand.fragen;
  if (_ddFragenStand.schluessel !== schluessel) {
    const stand = _ddFragenStand = { schluessel, fragen: null, warten: new Set() };
    Promise.all(asins.map(a => {
      if (!_ddProfile.has(a)) _ddProfile.set(a, _asinProfil(a));
      return _ddProfile.get(a);
    })).then(profile => {
      if (_ddFragenStand !== stand) return;
      const m = new Map();
      for (const p of profile) { try { _ddFragenAusProfil(p, m); } catch (e) { console.warn('Dropdown-Fragen aus Profil:', e); } }
      stand.fragen = [...m.values()].sort((a, b) => b.anzahl - a.anzahl);
      for (const cb of stand.warten) { try { cb(); } catch (e) { console.warn(e); } }
      stand.warten.clear();
    });
  }
  if (fertig) _ddFragenStand.warten.add(fertig);
  return null;
}
const _ddWerteSortiert = e => Object.entries((e && e.werte) || {}).sort((a, b) => a[0].localeCompare(b[0], 'de', { numeric: true })).map(x => x[0]);

// Gleichartige Felder: dieselbe Gravur-Nr (Text) bzw. dieselbe Motivdatei (Motiv) — auf
// allen Seiten. Eine Dropdown-Einstellung gilt für alle zugleich (je Platz ein Feld, alle
// mit derselben Rolle), sonst müsste man sie zwölfmal setzen.
function _ddGeschwister(f) {
  const passt = x => x && (f.type === 'text'
    ? (f.ddGruppe ? (x.type === 'text' && x.ddGruppe === f.ddGruppe)   // Baustein „Dropdown-Text“
      : (x.type === 'text' && !x.ddGruppe && _isCombo(x) === _isCombo(f) && (x.palNum || 1) === (f.palNum || 1)))
    : f.type === 'image' ? (x.type === 'image' && (x.palNum || 1) === (f.palNum || 1))
      : f.ddGruppe ? (_istMotiv(x) && x.ddGruppe === f.ddGruppe)
        : (_istMotiv(x) && !x.ddGruppe && x.motivDatei === f.motivDatei));
  const out = fields.filter(passt);
  (_pages || []).forEach((pg, i) => { if (i !== _currentPage) out.push(...pg.filter(passt)); });
  return out;
}
function ddSetzen(id, werte) {
  const f = fields.find(x => x.id === id); if (!f) return;
  saveUndo();
  for (const x of _ddGeschwister(f)) {
    for (const [k, v] of Object.entries(werte)) { if (v == null || v === '') delete x[k]; else x[k] = v; }
    if (!x.ddFrage) { delete x.ddModus; delete x.ddTabelle; }
    if (_istMotiv(x) && x.ddGruppe && 'ddFrage' in werte) x.name = '◆ ' + (x.ddFrage || x.motivDatei || 'Motiv');
    if (x.ddText && 'ddFrage' in werte) x.name = x.ddFrage || 'Dropdown-Text';
    if (x.ddWenn === null) delete x.ddWenn;
  }
  saveCurrentPageSnapshot();
  scheduleRender(); renderFieldList(); renderProps();
}
function ddTabelleSetzen(id, wert, inhalt) {
  const f = fields.find(x => x.id === id); if (!f) return;
  const tab = { ...(f.ddTabelle || {}) };
  if (inhalt == null || inhalt === '') delete tab[wert]; else tab[wert] = inhalt;
  ddSetzen(id, { ddTabelle: Object.keys(tab).length ? tab : null });
}
function ddFrageEingeben(id, ziel) {
  promptModal('Frage eintragen', 'Die Frage genau so, wie der Kunde sie bei Amazon sieht (z. B. „Buchstabe"):', '')
    .then(v => {
      if (!v || !v.trim()) return;
      ddSetzen(id, ziel === 'wenn' ? { ddWenn: { frage: v.trim(), werte: [] } } : { ddFrage: v.trim(), ddModus: null });
    });
}

// ── Bedingung „Nur gravieren, wenn …" ──
function ddWennAn(id, an) { ddSetzen(id, { ddWenn: an ? { frage: '', werte: [] } : null }); }
function ddWennFrage(id, frage) { ddSetzen(id, { ddWenn: { frage: frage || '', werte: [] } }); }
function ddWennWert(id, wert, an) {
  const f = fields.find(x => x.id === id); if (!f || !f.ddWenn) return;
  const werte = new Set(f.ddWenn.werte || []);
  if (an) werte.add(wert); else werte.delete(wert);
  ddSetzen(id, { ddWenn: { frage: f.ddWenn.frage, werte: [...werte] } });
}

// Antworten, die „Motiv je Antwort" anbietet: alle bekannten; bei Buchstaben immer A–Z.
function _ddKachelWerte(f, e) {
  const werte = _ddWerteSortiert(e);
  const tab = Object.keys(f.ddTabelle || {});
  const alle = (e && e.thema === 'buchstabe') ? [...'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''), ...werte, ...tab] : [...werte, ...tab];
  const out = [];
  for (const w of alle) if (!out.some(x => _ddNorm(x) === _ddNorm(w))) out.push(w);
  return out;
}
const _ddVorschauUrl = name => `${BASE_URL}/v2/motive/${encodeURIComponent(name)}/vorschau.svg`;

// Automatisch zuordnen: Datei heißt wie die Antwort oder endet auf _Antwort / -Antwort / " Antwort"
// (Monogramm_A.svg → A, Herz.svg → Herz). Mehrdeutiges bleibt offen — das wählt man per Klick.
async function ddAutoZuordnen(id) {
  const f = fields.find(x => x.id === id); if (!f || !f.ddFrage) return;
  const motive = await _ddMotivListeLaden(true);
  const e = (_ddFragenStand.fragen || []).find(x => _ddNorm(x.frage) === _ddNorm(f.ddFrage));
  const tab = { ...(f.ddTabelle || {}) };
  let neu = 0, offen = 0;
  for (const w of _ddKachelWerte(f, e)) {
    if (Object.keys(tab).some(k => _ddNorm(k) === _ddNorm(w))) continue;
    const ww = w.toLowerCase();
    const treffer = motive.filter(m => {
      const b = m.replace(/\.[a-z0-9]+$/i, '').toLowerCase();
      return b === ww || b.endsWith('_' + ww) || b.endsWith('-' + ww) || b.endsWith(' ' + ww);
    });
    if (treffer.length === 1) { tab[w] = treffer[0]; neu++; } else offen++;
  }
  ddSetzen(id, { ddTabelle: Object.keys(tab).length ? tab : null });
  showToast(neu ? `✅ ${neu} Motiv${neu === 1 ? '' : 'e'} zugeordnet${offen ? ` · ${offen} ohne eindeutige Datei` : ''}`
    : `Keine passenden Dateinamen gefunden${offen ? ` (${offen} Antworten offen)` : ''}`, 4000);
}

// Motiv-Auswahl per Klick: Raster mit Vorschaubildern aus ◆ Motive
async function ddMotivWaehlen(id, wert) {
  const f = fields.find(x => x.id === id); if (!f) return;
  const jetzt = _ddTabellenWert(f.ddTabelle, wert);
  await _motivWahlDialog(`Motiv für „${_esc(wert)}“`, jetzt,
    m => `ddTabelleSetzen(${id},'${_jsStr(wert)}','${_jsStr(m)}')`,
    `<button class="dd-mw-kachel${jetzt === '' ? ' an' : ''}" data-name="" onclick="ddTabelleSetzen(${id},'${_jsStr(wert)}','');ddMotivWahlZu()">
        <span class="dd-mw-leer">kein Motiv</span><span class="dd-mw-name">bei dieser Antwort nichts gravieren</span></button>`);
}
// Raster mit Vorschaubildern aus ◆ Motive. klick(name) liefert den onclick-Code der Kachel,
// vorab = zusätzliche Kachel vor der Liste (z. B. „kein Motiv").
async function _motivWahlDialog(titel, jetzt, klick, vorab = '') {
  const motive = await _ddMotivListeLaden(true);
  ddMotivWahlZu();
  const box = document.createElement('div');
  box.id = 'dd-motiv-wahl';
  box.innerHTML = `<div class="dd-mw-box" role="dialog" aria-label="Motiv wählen">
    <div class="dd-mw-kopf"><b>${titel}</b>
      <input id="dd-mw-suche" placeholder="Suchen…" oninput="_ddMwFiltern(this.value)"/>
      <button class="btn btn-muted btn-xs" onclick="ddMotivWahlZu()">✕</button></div>
    <div class="dd-mw-raster">
      ${vorab}
      ${motive.map(m => `<button class="dd-mw-kachel${jetzt === m ? ' an' : ''}" data-name="${_esc(m.toLowerCase())}"
          onclick="${klick(m)};ddMotivWahlZu()">
          <img src="${_ddVorschauUrl(m)}" alt=""/><span class="dd-mw-name">${_esc(m)}</span></button>`).join('')}
    </div>
    ${motive.length ? '' : '<div class="umut10" style="padding:10px;">Noch keine Motive — erst im Reiter ◆ Motive hochladen.</div>'}
  </div>`;
  box.addEventListener('click', ev => { if (ev.target === box) ddMotivWahlZu(); });
  document.body.appendChild(box);
  setTimeout(() => document.getElementById('dd-mw-suche')?.focus(), 30);
}
function ddMotivWahlZu() { document.getElementById('dd-motiv-wahl')?.remove(); }
function _ddMwFiltern(q) {
  q = String(q || '').toLowerCase();
  document.querySelectorAll('#dd-motiv-wahl .dd-mw-kachel').forEach(k => { k.hidden = !!q && !!k.dataset.name && !k.dataset.name.includes(q); });
}
document.addEventListener('keydown', ev => { if (ev.key === 'Escape' && document.getElementById('dd-motiv-wahl')) ddMotivWahlZu(); });

// ── Baustein „Dropdown-Text“ ──────────────────────────────────────────────────
// Damit Mitarbeiter Felder wie F02 V4 (Buchstabe aus dem Dropdown in Old London) selbst
// anlegen können — und jede andere Dropdown-Antwort als Text (Sternzeichen, Zahl …):
// aufs Blatt ziehen, Schrift wählen, Kasten auf die Höhe ziehen. Technisch ein Textfeld mit
// „Text aus Dropdown“ in fester Größe; den Rest setzt der Baustein selbst:
//   • eigene Gravur-Nummer ab 99 abwärts — keine Zeile der Bestellung landet dort, und der
//     Platz-Abgleich beim Füllen bleibt getrennt von Deckel-/Rückseiten-Zeilen;
//   • ddGruppe — Frage, Text, Schrift, Höhe und Bedingung gelten für alle Plätze zugleich;
//   • Größe aus der Kastenhöhe (_ddTextPt): Kasten = Großbuchstabe „H“, alle Antworten auf
//     einer Grundlinie (so setzt Amazon die F02-V4-Vorschau); zu breit → auf Kastenbreite
//     gestaucht (nur X, wie „Stauchen“ bei normalen Gravurfeldern);
//   • Frage (Buchstabe, falls vorhanden) + „Nur gravieren, wenn …“ aus dem ASIN-Profil.
function _ddTextPt(f, fam) {
  const m = _fontMetrics(fam, f.bold);
  return f.h / ((m.capPx / _FIT_REF) * PT_MM);
}
function _ddTextHoeheVerteilen(id) {
  const f = fields.find(x => x.id === id);
  if (!f || !f.ddText) return;
  for (const x of _ddGeschwister(f)) x.h = f.h;
  saveCurrentPageSnapshot();
}
// Platzhalter vor dem Füllen: eine typische Antwort (Buchstabe → „A“).
function _ddTextMuster(f) {
  const asins = _ddAsinsImEditor();
  const fragen = asins.length ? _ddFragen(asins) : null;
  const e = fragen && f.ddFrage ? fragen.find(q => _ddNorm(q.frage) === _ddNorm(f.ddFrage)) : null;
  if (!e || e.thema === 'buchstabe') return 'A';
  const w = _ddWerteSortiert(e).find(v => !_ddIstNein(v));
  if (!w) return 'A';
  return f.ddModus === 'tabelle' ? (String(_ddTabellenWert(f.ddTabelle, w) ?? '') || w) : w;
}
function ddTextFeldAnlegen(x, y) {
  saveUndo();
  const p = getPg();
  const belegt = new Set(_editorFelder().filter(f => f.type === 'text').flatMap(_feldGravuren));
  let nr = 99; while (belegt.has(nr) && nr > 10) nr--;
  const w = 24, h = 15;
  const field = {
    id: ++idc, type: 'text', ddText: true, palNum: nr, ddGruppe: 'dt' + Date.now(), name: 'Dropdown-Text',
    x: x != null ? Math.max(0, x - w / 2) : p.m, y: y != null ? Math.max(0, y - h / 2) : p.m, w, h,
    fontFamily: 'Arial', fontSize: 10, autoFit: false, textAlign: 'center', overflowMode: 'stauch',
    orderId: null, _img: null, _text: null
  };
  _feldAufsBlatt(field);        // renderFieldList zeichnet die Palette mit (Nummer 99↓ belegt)
  _ddTextVorbelegen(field);     // erst danach: prüft, ob das Feld auf dem Blatt liegt
}
// Frage („Buchstabe“, falls es eine gibt) und Bedingung („PERSONALISIERUNG …“ = die
// Ja-Antworten) aus den Bestellungen der Layout-ASIN. Ohne Profil bleibt beides rechts wählbar.
function _ddTextVorbelegen(f) {
  const asins = _ddAsinsImEditor();
  if (!asins.length) return;
  const setzen = fragen => {
    if (!fragen || !fields.includes(f)) return;
    const b = fragen.find(q => q.thema === 'buchstabe');
    if (b && !f.ddFrage) { f.ddFrage = b.frage; f.name = b.frage; }
    const pz = fragen.find(q => q.thema === 'personalisierung');
    const ja = pz ? Object.keys(pz.werte || {}).filter(w => !_ddIstNein(w)) : [];
    if (pz && ja.length && !f.ddWenn) f.ddWenn = { frage: pz.frage, werte: ja };
    if (sel === f.id) renderProps();
    scheduleRender(); renderFieldList();
  };
  const sofort = _ddFragen(asins, () => setzen(_ddFragen(asins)));
  if (sofort) setzen(sofort);
}

// Baustein „Motiv" (Reiter Felder, ziehen oder Doppelklick; bis 26.09. „Dropdown"): ein leeres
// Motivfeld. Rechts wählt man „Fest" (eine Datei für alle Plätze) oder „Je Antwort" (Motiv
// zur Kundenantwort, z. B. Buchstabe → Monogramm). ddGruppe hält es mit seinen Kopien
// (Array/Raster) zusammen, damit Datei, Frage und Motive für alle Plätze auf einmal gelten —
// ohne ddGruppe gälten alle noch leeren Motivfelder (motivDatei '') als gleichartig.
function motivFeldAnlegen(x, y) {
  saveUndo();
  const p = getPg();
  const w = Math.min(30, p.w - 2 * p.m);
  const field = {
    id: ++idc, type: 'motiv', palNum: 1, name: '◆ Motiv', motivDatei: '', ddGruppe: 'mo' + Date.now(),
    x: x != null ? Math.max(0, x) : p.m, y: y != null ? Math.max(0, y) : p.m, w, h: w, orderId: null, _img: null, _text: null
  };
  _feldAufsBlatt(field);
}

// Karte Motiv: „Je Antwort" gewählt, aber noch keine Frage gesetzt — nur Anzeige, nichts
// Gespeichertes (gespeichert zählt allein ddFrage).
const _motivJeAntwort = new Set();
async function motivModus(id, jeAntwort) {
  const f = fields.find(x => x.id === id); if (!f) return;
  if (jeAntwort) { _motivJeAntwort.add(id); renderProps(); return; }
  _motivJeAntwort.delete(id);
  if (!f.ddFrage) { renderProps(); return; }
  // Zurück auf „Fest" löscht Frage und Zuordnung (ddSetzen) — nur nach Rückfrage, wenn schon
  // Motive zugeordnet sind.
  const n = Object.keys(f.ddTabelle || {}).length;
  if (n && !(await confirmModal('Zuordnung verwerfen?', `${n} Antwort${n === 1 ? ' hat' : 'en haben'} schon ein Motiv. Bei „Fest“ gilt wieder eine Datei für alle Plätze.`, 'Verwerfen'))) { renderProps(); return; }
  ddSetzen(id, { ddFrage: null });
}
// Aus „Nur gravieren, wenn <Buchstabe>" wird „Je Antwort" mit derselben Frage (s. _ddFeldHTML).
function motivAusBedingung(id) {
  const f = fields.find(x => x.id === id); if (!f || !f.ddWenn || !f.ddWenn.frage) return;
  _motivJeAntwort.add(id);
  ddSetzen(id, { ddWenn: null, ddFrage: f.ddWenn.frage });
}
// „Fest": Datei für dieses Feld und alle gleichartigen (Kopien). War das Feld noch leer,
// bekommt es die Höhe aus dem Seitenverhältnis — wie beim Ziehen aus ◆ Motive.
async function motivFestWaehlen(id) {
  const f = fields.find(x => x.id === id); if (!f) return;
  await _motivWahlDialog('Motiv wählen', f.motivDatei, m => `motivFestSetzen(${id},'${_jsStr(m)}')`);
}
async function motivFestSetzen(id, name) {
  const f = fields.find(x => x.id === id); if (!f || !name) return;
  const warLeer = !f.motivDatei;
  // Standardnamen („◆ Motiv", „◆ <Datei>", auch mit Raster-Zusatz „ (2)") ziehen mit, eigene bleiben.
  const teile = x => String(x.name).match(/^(.*?)(\s*\(\d+\))?$/);
  const standard = x => { const b = teile(x)[1].trim(); return /^◆ ?(Motiv|Dropdown)?$/.test(b) || b === '◆ ' + x.motivDatei; };
  const umbenennen = _ddGeschwister(f).filter(standard);
  ddSetzen(id, { motivDatei: name });
  for (const x of umbenennen) x.name = '◆ ' + name + (teile(x)[2] || '');
  const m = await motivPfade(name);
  if (warLeer && m) for (const x of _ddGeschwister(f)) x.h = motivFeldHoehe(m, x.w);
  saveCurrentPageSnapshot();
  scheduleRender(); renderFieldList(); renderProps();
}

// Vom Textfeld aus: je gleichartigem Textfeld (je Platz) ein Motivfeld darüber anlegen. Hatte das
// Textfeld „Text aus Dropdown", wandert die Frage ins Motiv — gemeint war dann das Motiv.
async function ddMotiveAnlegen(id) {
  const f = fields.find(x => x.id === id); if (!f) return;
  const motive = await _ddMotivListeLaden(true);
  saveUndo();
  saveCurrentPageSnapshot();
  const frage = f.ddFrage || null;
  const passt = x => x && x.type === 'text' && !_isCombo(x) && (x.palNum || 1) === (f.palNum || 1);
  const gruppe = 'dd' + Date.now();
  const neuFeld = t => ({
    id: ++idc, type: 'motiv', palNum: 1, name: '◆ ' + (frage || 'Motiv'), motivDatei: '', ddGruppe: gruppe,
    x: t.x, y: t.y, w: t.w, h: t.h, ...(frage ? { ddFrage: frage } : {}),
    orderId: null, _img: null, _text: null
  });
  const neuHier = fields.filter(passt).map(neuFeld);
  fields.push(...neuHier);
  (_pages || []).forEach((pg, i) => { if (i !== _currentPage) pg.push(...pg.filter(passt).map(neuFeld)); });
  if (frage) for (const x of _editorFelder()) if (passt(x)) { delete x.ddFrage; delete x.ddModus; delete x.ddTabelle; }
  saveCurrentPageSnapshot();
  sel = neuHier[0] ? neuHier[0].id : sel;
  scheduleRender(); renderFieldList(); renderProps();
  showToast(`◆ ${neuHier.length} Motivfeld${neuHier.length === 1 ? '' : 'er'} angelegt${frage ? ` mit „${frage}“ — das Textfeld graviert wieder seinen normalen Text` : ''}. `
    + (motive.length ? 'Rechts unter „Motiv je Antwort“ die Motive wählen.' : 'Noch keine Motive — erst im Reiter ◆ Motive hochladen.'), 7000);
}

// ASIN-Liste für die Suche (Produkte, die der ASIN-Check kennt)
let _ddAsinListe = null;
async function _ddAsinListeLaden() {
  try {
    const l = await _apiJson('/v2/asin-check');
    _ddAsinListe = (Array.isArray(l) ? l : []).filter(x => x && x.asin)
      .map(x => ({ asin: x.asin, titel: _ddKurz(x.titel || '', 70) }));
  } catch (_) { _ddAsinListe = []; }
  return _ddAsinListe;
}
function ddAsinWaehlen(id, wert) {
  const m = String(wert || '').toUpperCase().match(/\b[A-Z0-9]{10}\b/);
  if (!m) { showToast('Keine ASIN erkannt', 3000); return; }
  if (getSingleAsinMode()) { _fillSet('globalAsin', m[0]); try { _syncFillUI(); } catch (_) { } renderProps(); }
  else ddSetzen(id, { filterAsin: m[0] });
  showToast(`Füll-ASIN ${m[0]} — die Fragen dieses Produkts stehen jetzt zur Auswahl`, 4000);
  // Dropdown-Text ohne Frage: die Buchstaben-Frage des Produkts übernehmen — als Folge DIESER
  // Auswahl. Bis 08.10.2026 setzte renderProps sie beim bloßen Anzeigen, samt Undo-Schritt und
  // „ungespeichert", nur weil das Feld angeklickt wurde.
  const f = fields.find(x => x.id === id);
  if (f && f.ddText && !f.ddFrage) {
    const asins = _ddAsinsImEditor();
    const setzen = fr => { const b = (fr || []).find(q => q.thema === 'buchstabe'); if (b && !f.ddFrage) ddSetzen(id, { ddFrage: b.frage, ddModus: null }); };
    const sofort = _ddFragen(asins, () => setzen(_ddFragen(asins)));
    if (sofort) setzen(sofort);
  }
}

function _ddPropsNeu() {
  const f = sel != null ? fields.find(x => x.id === sel) : null;
  if (f && (f.type === 'text' || f.type === 'image' || _istMotiv(f))) renderProps();
}
// teil: undefined = alles (Text-/Bildfelder), 'bedingung' = nur „Nur gravieren, wenn …"
// (Bereich Dropdown am Motivfeld), 'motiv' = nur „Motiv je Antwort" (Karte Motiv → Je Antwort).
function _ddFeldHTML(f, teil) {
  const istText = f.type === 'text', istMotiv = _istMotiv(f);
  const mitBedingung = teil !== 'motiv', mitInhalt = teil !== 'bedingung';
  const asins = _ddAsinsImEditor();
  const fragen = asins.length ? _ddFragen(asins, _ddPropsNeu) : [];
  const liste = fragen || [];
  const finde = q => q ? liste.find(x => _ddNorm(x.frage) === _ddNorm(q)) : null;
  const optionen = (aktuell, leer) => {
    const o = [`<option value="">${leer}</option>`];
    for (const q of liste) o.push(`<option value="${_esc(q.frage)}"${aktuell && _ddNorm(q.frage) === _ddNorm(aktuell) ? ' selected' : ''}>${_esc(q.frage)}</option>`);
    if (aktuell && !finde(aktuell)) o.push(`<option value="${_esc(aktuell)}" selected>${_esc(aktuell)}${fragen ? ' (nicht in den Daten)' : ''}</option>`);
    return o.join('');
  };
  const t = [];
  if (!asins.length) {
    if (!_ddAsinListe) _ddAsinListeLaden().then(() => { if (sel === f.id) renderProps(); });
    t.push(`<div class="ig"><span class="il">ASIN suchen</span>
      <input list="dd-asin-liste" placeholder="ASIN oder Produktname" title="Wählt die Füll-ASIN des Layouts — danach stehen hier ihre Fragen"
        onchange="ddAsinWaehlen(${f.id},this.value)"
        oninput="if(/^B0[A-Z0-9]{8}$/i.test(this.value.trim()))ddAsinWaehlen(${f.id},this.value)"/></div>
      <datalist id="dd-asin-liste">${(_ddAsinListe || []).map(x => `<option value="${_esc(x.asin)}">${_esc(x.titel)}</option>`).join('')}</datalist>`);
  }
  else if (!fragen) t.push('<div class="umut10 dd-hinweis">Fragen werden geladen…</div>');
  else if (!liste.length) t.push(`<div class="umut10 dd-hinweis">Für ${_esc(asins.join(', '))} sind noch keine Dropdowns bekannt.</div>`);

  // 1) Bedingung
  const w = mitBedingung ? (f.ddWenn || null) : null;
  if (mitBedingung) t.push(`<label class="dd-schalter"><input type="checkbox" ${w ? 'checked' : ''} onchange="ddWennAn(${f.id},this.checked)"/> Nur gravieren, wenn …</label>`);
  if (w) {
    t.push(`<div class="ig"><span class="il">Frage</span><select onchange="ddWennFrage(${f.id},this.value)">${optionen(w.frage, '— Frage wählen —')}</select></div>`);
    if (!liste.length) t.push(`<div class="umut10 dd-hinweis"><a href="#" onclick="ddFrageEingeben(${f.id},'wenn');return false;">Frage eintippen</a></div>`);
    if (w.frage) {
      const e = finde(w.frage);
      const buchstabe = (e ? e.thema : _ddThema('', w.frage)) === 'buchstabe';
      // Am Motivfeld heißt eine Grafik-Frage (Buchstabe, Symbol) fast immer „je Antwort ein
      // anderes Motiv", nicht „nur gravieren, wenn". Am 26.09. genau so verwechselt → Umweg anbieten.
      if (istMotiv && _DD_GRAFIK.has(e ? e.thema : _ddThema('', w.frage))) t.push(`<div class="dd-umleitung">
        <span>Je ${_esc(w.frage)} ein eigenes Motiv?</span>
        <button class="btn btn-umriss btn-xs" onclick="motivAusBedingung(${f.id})" title="Bedingung entfernen, oben „Je Antwort“ mit dieser Frage einstellen">Umstellen</button></div>`);
      // Bei Buchstaben immer A–Z anbieten, nicht nur die bisher bestellten.
      const werte = buchstabe ? _ddKachelWerte({}, e || { thema: 'buchstabe' }) : [..._ddWerteSortiert(e)];
      for (const x of (w.werte || [])) if (!werte.some(y => _ddNorm(y) === _ddNorm(x))) werte.push(x);
      t.push(werte.length ? _ddHaken(werte, w.werte, v => `ddWennWert(${f.id},'${_jsStr(v)}',this.checked)`, buchstabe ? ' dd-werte-raster' : '')
        : '<div class="umut10 dd-hinweis">Noch keine Antworten bekannt.</div>');
      if (!(w.werte || []).length) t.push('<div class="umut10 dd-hinweis"><b class="dd-warn">Noch nichts angehakt — solange gilt die Bedingung nicht.</b></div>');
    }
  }

  // 2) Inhalt aus dem Dropdown
  if (!mitInhalt) { /* nur die Bedingung */ }
  else if (istMotiv) {
    t.push(`${teil === 'motiv' ? '' : '<div class="dd-block">Motiv je Antwort</div>'}
      <div class="ig"><span class="il">Frage</span><select onchange="ddSetzen(${f.id},{ddFrage:this.value||null})">${optionen(f.ddFrage, '— Frage wählen —')}</select></div>`);
    if (!liste.length && !f.ddFrage) t.push(`<div class="umut10 dd-hinweis"><a href="#" onclick="ddFrageEingeben(${f.id},'inhalt');return false;">Frage eintippen</a></div>`);
    if (f.ddFrage) {
      if (!_ddMotivListe) _ddMotivListeLaden().then(() => { if (sel === f.id) renderProps(); });
      const e = finde(f.ddFrage);
      const werte = _ddKachelWerte(f, e);
      let mit = 0;
      const kacheln = werte.map(v => {
        const name = _ddTabellenWert(f.ddTabelle, v);
        const da = name ? _ddMotivDatei(name) : null;
        if (name === '' || da) mit++;
        const innen = name === '' ? '<span class="dd-k-leer">kein Motiv</span>'
          : da ? `<img src="${_ddVorschauUrl(da)}" alt=""/>`
            : name ? '<span class="dd-k-fehlt">Datei fehlt</span>' : '<span class="dd-k-offen">wählen</span>';
        return `<button class="dd-kachel${name == null ? ' offen' : ''}${name && !da ? ' fehlt' : ''}" title="${_esc(name ? name : name === '' ? 'kein Motiv' : 'Motiv wählen')}"
          onclick="ddMotivWaehlen(${f.id},'${_jsStr(v)}')"><span class="dd-k-wert">${_esc(v)}</span>${innen}</button>`;
      });
      t.push(werte.length ? `<div class="dd-kacheln">${kacheln.join('')}</div>` : '<div class="umut10 dd-hinweis">Noch keine Antworten bekannt.</div>');
      t.push(`<div class="dd-zeile2"><span class="umut10">${mit} von ${werte.length} Antworten haben ein Motiv</span>
        <button class="btn btn-umriss btn-xs" onclick="ddAutoZuordnen(${f.id})" title="Dateien, die wie die Antwort heißen (z. B. Monogramm_A → A), automatisch zuordnen">Automatisch zuordnen</button></div>`);
    }
  } else if (istText && !_isCombo(f)) {
    t.push(`<div class="dd-block">Text aus Dropdown</div>
      <div class="ig"><span class="il">Frage</span><select onchange="ddSetzen(${f.id},{ddFrage:this.value||null,ddModus:null})">${optionen(f.ddFrage, '— aus: normale Gravurzeile —')}</select></div>`);
    if (f.ddFrage) {
      const e = finde(f.ddFrage);
      const werte = _ddWerteSortiert(e);
      const modus = f.ddModus === 'tabelle' ? 'tabelle' : 'wert';
      t.push(`<div class="ig"><span class="il">Graviert wird</span>${_ddModusWahl(f)}</div>`);
      if (modus === 'tabelle') {
        t.push(_ddTextTabelle(f, werte));
      } else {
        t.push(`<div class="umut10 dd-hinweis">Schrift: ${_esc(f.fontFamily || 'Arial')}, nicht die des Kunden</div>`);
      }
    }
  }
  if (mitInhalt && istText && !_isCombo(f)) {
    const _n = _ddGeschwister(f).length;
    t.push(`<div class="dd-block">Motiv je Antwort</div>
      <button class="btn btn-umriss btn-full" onclick="ddMotiveAnlegen(${f.id})"
        title="Motive wählt man an einem Motivfeld. Legt je Platz eins an — genau über ${_n > 1 ? 'diesen ' + _n + ' Feldern' : 'diesem Feld'}.">◆ Motivfelder anlegen</button>`);
  }
  const geschw = _ddGeschwister(f).length;
  if (geschw > 1 && (w || (mitInhalt && f.ddFrage))) t.push(`<div class="umut10 dd-hinweis">Gilt für alle ${geschw} ${istMotiv ? 'gleichen Motivfelder' : 'Felder ' + (f.type === 'image' ? 'Bild ' : 'Gravur ') + (f.palNum || 1)}</div>`);
  return t.join('');
}

// ── Stufe 3: „Nur Bestellungen mit …" am Layout ─────────────────────────────
// _fillCfg.ddNur = { frage, werte: [...] } oder null. Wirkt in getFillDateFilteredOrders:
// das Layout nimmt nur Bestellungen, deren Antwort angehakt ist — z. B. je Armband-Farbe
// ein Layout mit eigenen Laserwerten. Ohne Eintrag bleibt alles wie vorher.
function _ddNurNorm(v) {
  if (!v || !v.frage || !String(v.frage).trim()) return null;
  const werte = [...new Set((v.werte || []).map(w => String(w).trim()).filter(Boolean))].sort();
  return werte.length ? { frage: String(v.frage).trim(), werte } : null;
}
function ddNurFrage(frage) {
  _fillCfg.ddNur = frage ? { frage, werte: [] } : null;
  _updateFillDirty(); _paintDdNur();
}
function ddNurWert(wert, an) {
  const d = _fillCfg.ddNur; if (!d) return;
  const werte = new Set(d.werte || []);
  if (an) werte.add(wert); else werte.delete(wert);
  _fillCfg.ddNur = { frage: d.frage, werte: [...werte] };
  _updateFillDirty(); _paintDdNur();
}
function _paintDdNur() {
  const el = document.getElementById('dd-nur-inhalt');
  if (!el) return;
  const d = _fillCfg.ddNur || null;
  const asins = _ddAsinsImEditor();
  const fragen = asins.length ? _ddFragen(asins, _paintDdNur) : [];
  const liste = fragen || [];
  const e = d ? liste.find(x => _ddNorm(x.frage) === _ddNorm(d.frage)) : null;
  const opt = ['<option value="">— alle Bestellungen (keine Weiche) —</option>'];
  for (const q of liste) opt.push(`<option value="${_esc(q.frage)}"${d && _ddNorm(q.frage) === _ddNorm(d.frage) ? ' selected' : ''}>${_esc(q.frage)}</option>`);
  if (d && !e) opt.push(`<option value="${_esc(d.frage)}" selected>${_esc(d.frage)}</option>`);
  const teile = [`<div class="ig" style="margin-bottom:6px;"><span class="il">Frage</span>
    <select id="dd-nur-frage" onchange="ddNurFrage(this.value)" ${!asins.length && !d ? 'disabled' : ''}>${opt.join('')}</select></div>`];
  if (!asins.length && !d) teile.push('<div class="umut10">Erst eine ASIN eintragen — dann stehen hier ihre Dropdowns.</div>');
  else if (!fragen && asins.length) teile.push('<div class="umut10">Fragen werden geladen…</div>');
  if (d) {
    const werte = [...new Set([..._ddWerteSortiert(e), ...(d.werte || [])])];
    teile.push(werte.length ? _ddHaken(werte, d.werte, w => `ddNurWert('${_jsStr(w)}',this.checked)`, '', e && e.werte)
      : '<div class="umut10">Noch keine Werte bekannt.</div>');
    teile.push(`<div class="umut10" style="margin-top:4px;line-height:1.5;">${(d.werte || []).length
      ? 'Nur Bestellungen mit einer angehakten Antwort kommen in dieses Layout.'
      : '<b style="color:var(--amber);">Noch nichts angehakt — solange gilt die Weiche nicht.</b>'}</div>`);
  }
  el.innerHTML = teile.join('');
}

// Undo-Snapshot pro Tipp-„Burst" (gleiches Feld+Key < 1 s = ein Schritt) — sonst wäre
// der 50er-Verlauf nach dem Eintippen von „12.5" schon halb voll.
let _lastUpdKey = null, _lastUpdTime = 0;
// Ein Undo-Schritt je Tipp-Burst: neuer Schritt nur bei anderem Feld/Schlüssel oder nach 1 s Pause.
function _undoBurst(k) {
  const now = Date.now();
  if (k !== _lastUpdKey || now - _lastUpdTime > 1000) saveUndo();
  _lastUpdKey = k; _lastUpdTime = now;
}
// Schrift eines Textfelds. Liste = Arial + alle Schriften aus dem Reiter „Schriften“. Gilt wie die
// Dropdown-Regel für alle Felder derselben Gravur-Nummer; die Kundenschrift aus der Bestellung geht
// weiterhin vor (außer „Text aus Dropdown“).
function _ppSchrift(f) {
  const akt = f.fontFamily || 'Arial';
  const namen = [...new Set(['Arial', ...Object.keys(_uploadedFonts).sort((a, b) => a.localeCompare(b, 'de')), akt])];
  return `<select onchange="schriftSetzen(${f.id}, this.value)">${namen.map(n =>
    `<option value="${_esc(n)}"${n === akt ? ' selected' : ''}>${_esc(n)}</option>`).join('')}</select>`;
}
function schriftSetzen(id, name) {
  const f = fields.find(x => x.id === id); if (!f || !name) return;
  saveUndo();
  for (const x of _ddGeschwister(f)) x.fontFamily = name;
  saveCurrentPageSnapshot();
  scheduleRender(); renderFieldList(); renderProps();
}

function upd(id, key, val) {
  const f = fields.find(x => x.id === id); if (!f) return;
  // Zahlen-Inputs: unvollständige Eingaben ("-", "1e") ergeben NaN → ignorieren,
  // sonst bekommt das Feld NaN-Koordinaten und verschwindet vom Canvas.
  if (typeof val === 'number' && !Number.isFinite(val)) return;
  // Untergrenzen durchsetzen: min="…" am <input> gilt NICHT für oninput. Ein getipptes
  // "-5" ergab negative Breite (Feld weg vom Blatt, im DXF scale negativ).
  const MIN_WERTE = { w: 1, h: 1, fontSize: 1, numChars: 1 };
  if (MIN_WERTE[key] !== undefined && val < MIN_WERTE[key]) val = MIN_WERTE[key];
  _undoBurst(id + ':' + key);
  f[key] = val;
  if (key === 'h') _ddTextHoeheVerteilen(id);
  scheduleRender(); renderFieldList();
}

// EIN Undo-Snapshot pro Tipp-Burst (Burst-Logik wie upd), nicht pro Zeichen — sonst ist
// der 50er-Undo-Stack nach wenigen Wörtern voll.
function updStatic(id, value) {
  const f = fields.find(x => x.id === id); if (!f) return;
  _undoBurst(id + ':staticText');
  f.staticText = value;
  drawCanvas();
}

// Mit einem Array-Master gehen seine Kopien mit — allein blieben sie für immer leer.
function _ohneFelder(ids) {
  const weg = new Set(fields.filter(f => ids.has(f.id) && f.arrayGroup).map(f => f.arrayGroup));
  fields = fields.filter(f => !ids.has(f.id) && !weg.has(f.arrayOf));
}
function delF(id) {
  saveUndo();
  _ohneFelder(new Set([id]));
  if (sel === id) sel = null;
  scheduleRender(); renderFieldList(); renderProps();
}

function deleteMulti() {
  saveUndo();
  _ohneFelder(multiSel);
  multiSel.clear(); sel = null;
  scheduleRender(); renderFieldList(); renderProps();
}

// ── Raster (Feld vervielfältigen, je Platz eine eigene Bestellung) ─────────────
// Zuletzt eingegebene Raster-Werte merken, damit sie nach dem Ausführen
// (renderProps baut die Felder neu auf) erhalten bleiben statt auf Default zu springen.
let _gridSettings = { cols: 3, rows: 7, gapX: 2, gapY: 2 };
function _readGridSettings() {
  const cols = parseInt(document.getElementById('rep-cols')?.value);
  const rows = parseInt(document.getElementById('rep-rows')?.value);
  const gapX = parseFloat(document.getElementById('rep-gap-x')?.value);
  const gapY = parseFloat(document.getElementById('rep-gap-y')?.value);
  if (!isNaN(cols)) _gridSettings.cols = cols;
  if (!isNaN(rows)) _gridSettings.rows = rows;
  if (!isNaN(gapX)) _gridSettings.gapX = gapX;
  if (!isNaN(gapY)) _gridSettings.gapY = gapY;
  return _gridSettings;
}

// Rasterkopie eines Feldes anlegen und an `fields` hängen (für repeatMulti + repeatField):
//   • Tiefe Kopie über JSON, damit verschachtelte Werte (comboPals) nicht geteilt werden.
//   • Session-Inhalt (_img/_text/orderId) bleibt leer, bis „Füllen" läuft.
//   • Array-Mitgliedschaft (arrayGroup/arrayOf) MUSS raus: sonst behaupten nach dem
//     Rastern eines Array-Masters 21 Felder, Master derselben Gruppe zu sein —
//     _syncArrayClones füllt dann alle mit dem Inhalt des ERSTEN.
function _rasterKopie(f, name, x, y) {
  const kopie = {
    ...JSON.parse(JSON.stringify({ ...f, _img: null })),
    id: ++idc, name, x, y,
    _img: null, _text: null, orderId: null,
  };
  delete kopie.arrayGroup; delete kopie.arrayOf;
  fields.push(kopie);
  return kopie;
}

function repeatMulti(dir) {
  saveUndo();
  // Werte aus _readGridSettings (validiert + gemerkt), kein zweites Parsen der Inputs.
  const { cols, rows, gapX: gx, gapY: gy } = _readGridSettings();

  // Get selected fields as a group (sorted by position)
  const group = fields.filter(f => multiSel.has(f.id)).sort((a, b) => a.y - b.y || a.x - b.x);
  if (!group.length) return;

  // Calculate bounding box of the group
  const minX = Math.min(...group.map(f => f.x));
  const minY = Math.min(...group.map(f => f.y));
  const maxX = Math.max(...group.map(f => f.x + f.w));
  const maxY = Math.max(...group.map(f => f.y + f.h));
  const groupW = maxX - minX;
  const groupH = maxY - minY;

  // Reset all fields in group to placeholder
  group.forEach(f => { f._img = null; f._text = null; f.orderId = null; });

  const cloneGroup = (offsetX, offsetY) =>
    group.forEach(f => _rasterKopie(f, f.name, f.x + offsetX, f.y + offsetY));

  if (dir === 'right') {
    for (let i = 1; i < cols; i++) cloneGroup(i * (groupW + gx), 0);
  } else if (dir === 'down') {
    for (let i = 1; i < rows; i++) cloneGroup(0, i * (groupH + gy));
  } else if (dir === 'grid') {
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        if (row === 0 && col === 0) continue;
        cloneGroup(col * (groupW + gx), row * (groupH + gy));
      }
    }
  }

  multiSel.clear();
  scheduleRender(); renderFieldList(); renderProps();
}

// Feld als Raster (cols × rows) vervielfältigen — Werte aus der Raster-Box im Props-Panel.
function repeatField(id) {
  const f = fields.find(x => x.id === id);
  if (!f) return;
  saveUndo();
  // Werte aus _readGridSettings — kein Doppel-Parsing (siehe repeatMulti)
  const { cols, rows, gapX: gx, gapY: gy } = _readGridSettings();

  const baseName = f.name.replace(/\s*\(\d+\)$/, '').trim();

  // Grid: cols × rows, links→rechts, oben→unten; Original wird Platzhalter
  _clearFieldData(f);
  let idx = 0;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      if (row === 0 && col === 0) continue; // Original-Position überspringen
      _rasterKopie(f, baseName + ' (' + (idx + 2) + ')', f.x + col * (f.w + gx), f.y + row * (f.h + gy));
      idx++;
    }
  }

  renderEls(); renderFieldList(); drawCanvas();
}

// ══ Modify-Leiste: Array (gleiche Gravur) + Drehung ═══════════════════════════
// Array = wie an der Lasermaschine: das gewählte Feld wird nx × ny vervielfältigt,
// ALLE Kopien zeigen dieselbe Bestellung/Gravur wie der Master (Verknüpfung über
// arrayGroup/arrayOf). Kopien verbrauchen beim Füllen KEINE eigene Bestellung —
// die Fill-Logik überspringt sie und _syncArrayClones kopiert den Inhalt danach.

// Eine Eigenschaft auf das Feld UND alle Mitglieder seiner Array-Gruppe anwenden.
// Kopien MÜSSEN sich wie ihr Master verhalten — Kreis-Text, Drehung, Stauch-Modus und
// Kombi-Zentrierung sitzen sonst auf einem Blech unterschiedlich.
// apply läuft auch auf f selbst — gewollt und bei allen Aufrufern idempotent.
function _applyToArrayGroup(f, apply) {
  apply(f);
  const g = f.arrayGroup || f.arrayOf;
  if (!g) return;
  for (const x of fields) if (x.arrayOf === g || x.arrayGroup === g) apply(x);
}

// Geladenes Bild samt Amazon-Ausschnitt auf ein anderes Feld übertragen — Raster-Kopien, Testfoto.
function _bildZustandKopieren(ziel, quelle) {
  ziel._img = quelle._img; ziel._imgSrc = quelle._imgSrc; ziel._placement = quelle._placement;
}

// Kopien nach dem Füllen mit dem Inhalt ihres Masters befüllen (gleiche Seite)
function _syncArrayClones(fieldArr) {
  for (const c of fieldArr) {
    if (!c.arrayOf) continue;
    const m = fieldArr.find(x => x.arrayGroup === c.arrayOf);
    if (!m) continue;
    c.orderId = m.orderId; c._text = m._text;
    _bildZustandKopieren(c, m);
    c._fontFamily = m._fontFamily; c._fontUrl = m._fontUrl; c._fontRawFamily = m._fontRawFamily;
    c._ddKey = m._ddKey; c._motivDatei = m._motivDatei; c._ddLeer = m._ddLeer; c._ddAus = m._ddAus;
    if (m.type === 'static') { c.staticText = m.staticText; c.exportEnabled = m.exportEnabled; }
  }
}

// Buttons/Eingaben der Modify-Leiste je nach Auswahl aktivieren (aus renderProps gerufen)
function _updateModifyBar() {
  const f = sel != null ? fields.find(x => x.id === sel) : null;
  // Werkzeug-Insel nur zeigen, wenn sie etwas zu tun hat. Bei Mehrfach-Auswahl
  // ebenfalls aus: Array/Kreis/Drehung arbeiten auf genau EINEM Feld.
  const insel = document.getElementById('modify-insel');
  if (insel) insel.classList.toggle('sichtbar', !!f);
  const ab = document.getElementById('btn-array');
  const rot = document.getElementById('rot-input');
  if (ab) ab.disabled = !f;
  if (rot) { rot.disabled = !f; rot.value = f ? (f.rotation || 0) : 0; }
  const pop = document.getElementById('array-popover');
  if (!f && pop) pop.style.display = 'none';
  const dis = document.getElementById('btn-array-dissolve');
  if (dis) dis.style.display = (f && (f.arrayGroup || f.arrayOf)) ? 'block' : 'none';
  // Kreis-Text: nur für Text-artige Felder (Gravur/Nummer/Statisch), nicht für Bilder
  const cb = document.getElementById('btn-circle');
  if (cb) cb.disabled = !f || f.type === 'image';
  const cpop = document.getElementById('circle-popover');
  if (!f && cpop) cpop.style.display = 'none';
  const coff = document.getElementById('btn-circle-off');
  if (coff) coff.style.display = (f && f.circleDia > 0) ? 'block' : 'none';
}

// ── Popover/Menü per Klick schließen — EIN Helfer für alle 5 Stellen ──────────
// insideStaysOpen: Klicks IM Element schließen nicht (Popover mit Eingabefeldern); ohne
// das schließt jeder Klick (Menüs — der Menüpunkt-onclick feuert zuerst).
// onClose überschreibt das Standard-Ausblenden.
function _dismissOnClick(el, opts = {}) {
  // Wird ein Menü über SEINEN EIGENEN Knopf geschlossen, feuert der document-Zuhörer nie
  // (stopPropagation) und bleibt hängen — gemessen 5 Zuhörer nach 5× Öffnen. Deshalb beim
  // erneuten Registrieren den vorherigen abräumen.
  if (el.__dismissTimer) { clearTimeout(el.__dismissTimer); el.__dismissTimer = null; }
  if (el.__dismiss) { document.removeEventListener('click', el.__dismiss); el.__dismiss = null; }
  const cl = (ev) => {
    if (opts.insideStaysOpen && el.contains(ev.target)) return;
    (opts.onClose || (() => { el.style.display = 'none'; }))();
    document.removeEventListener('click', cl);
    el.__dismiss = null;
  };
  el.__dismiss = cl;
  el.__dismissTimer = setTimeout(() => {
    el.__dismissTimer = null;
    document.addEventListener('click', cl);
  }, 10);
}

// ── Kreis-Text (wie „Kreistext" an der Maschine) ──────────────────────────────
// f.circleDia = Ø (mm) des Grundlinien-Kreises, Kreismitte = Feldmitte.
// f.circleSide = 'top' (Bogen oben ⌒) | 'bottom' (unten, lesbar gedreht).
// f.circleSpread = Zeichenabstand-Faktor; die °-Drehung verschiebt den Startwinkel.
//
// Rückgabe: Anteil des Kreisumfangs, den der Text belegt (1.0 = voller Kreis). Am Bogen
// ist Auto-Fit aus (feste pt-Größe) — ein langer Name auf kleinem Ø läuft über 360°
// hinaus und überschreibt sich selbst. Die Vorschau zeichnet den Überstand korrekt, es
// fällt also erst am Werkstück auf; deshalb hier messen und anzeigen.
// Größe kommt aus _vecTextProps, nicht aus f.fontSize: Kombi-Felder rechnen ihre Größe
// aus Feldhöhe und Zeilenzahl, der Prozentwert läge sonst daneben.
function circleFillFactor(f) {
  if (!f || !(f.circleDia > 0)) return 0;
  const { txt, fsMM, usedFont } = _vecTextProps(f);
  if (!txt.trim()) return 0;
  const chars = String(txt).replace(/\s*\n\s*/g, ' ');
  const wMM = _measureTextMM(chars, usedFont, f.bold, fsMM) * (f.circleSpread || 1);
  return wMM / (Math.PI * f.circleDia);
}

// Popover der Modify-Leiste auf-/zuklappen — für Array und Kreis identisch bis auf die
// Vorbelegung beim Öffnen. Sicht-Prüfung über den BERECHNETEN Stil (s. _popIsOpen).
function _togglePopover(id, prefill) {
  const pop = document.getElementById(id);
  const show = !_popIsOpen(pop);
  pop.style.display = show ? 'block' : 'none';
  if (!show) return;
  prefill(fields.find(x => x.id === sel));
  _dismissOnClick(pop, { insideStaysOpen: true });
}

function toggleCirclePopover(e) {
  e.stopPropagation();
  _togglePopover('circle-popover', f => {
    if (!f || !(f.circleDia > 0)) return;
    document.getElementById('circ-d').value = f.circleDia;
    document.getElementById('circ-side').value = f.circleSide || 'top';
    document.getElementById('circ-spread').value = f.circleSpread || 1;
  });
}

function applyCircle() {
  const f = fields.find(x => x.id === sel);
  if (!f || f.type === 'image') return;
  saveUndo();
  const dia = Math.max(4, parseFloat(document.getElementById('circ-d').value) || 40);
  const side = document.getElementById('circ-side').value === 'bottom' ? 'bottom' : 'top';
  const spread = Math.min(3, Math.max(0.5, parseFloat(document.getElementById('circ-spread').value) || 1));
  // Array-Mitglieder übernehmen den Kreis mit (gleiche Optik auf allen Kopien)
  _applyToArrayGroup(f, x => { x.circleDia = dia; x.circleSide = side; x.circleSpread = spread; });
  document.getElementById('circle-popover').style.display = 'none';
  scheduleRender(); renderProps();
  const fill = circleFillFactor(f);
  showToast(fill > 1
    ? `⚠️ Text belegt ${Math.round(fill * 100)} % des Kreises — er läuft um und überschreibt sich. Ø größer oder Schriftgröße kleiner.`
    : `◠ Kreis-Text aktiv — Ø ${dia} mm, ${side === 'top' ? 'oben' : 'unten'}`, fill > 1 ? 6000 : 3000);
}

function removeCircle() {
  const f = fields.find(x => x.id === sel);
  if (!f) return;
  saveUndo();
  _applyToArrayGroup(f, x => { delete x.circleDia; delete x.circleSide; delete x.circleSpread; });
  document.getElementById('circle-popover').style.display = 'none';
  scheduleRender(); renderProps();
  showToast('Kreis-Text entfernt');
}

function toggleArrayPopover(e) {
  e.stopPropagation();
  _togglePopover('array-popover', f => {
    if (!f || f.arrayOf || f.arrayGroup) return;
    // Vorbelegung: 2 mm Lücke zwischen den Kopien (Abstand = Lücke, nicht Versatz)
    document.getElementById('arr-dx').value = 2;
    document.getElementById('arr-dy').value = 2;
  });
}

function createArray() {
  let f = fields.find(x => x.id === sel);
  if (!f) return;
  // Auf einer Kopie geklickt → deren Master als Basis nehmen
  if (f.arrayOf) f = fields.find(x => x.arrayGroup === f.arrayOf) || f;
  const nx = Math.max(1, parseInt(document.getElementById('arr-nx').value) || 1);
  const ny = Math.max(1, parseInt(document.getElementById('arr-ny').value) || 1);
  const dx = parseFloat(document.getElementById('arr-dx').value) || 0;
  const dy = parseFloat(document.getElementById('arr-dy').value) || 0;
  if (nx * ny <= 1) { showToast('Anzahl X oder Y muss größer 1 sein'); return; }
  saveUndo();
  // Array neu aufziehen = bestehende Kopien dieses Masters ersetzen
  if (f.arrayGroup) fields = fields.filter(x => x.arrayOf !== f.arrayGroup);
  const g = f.arrayGroup || ('ag' + (++idc) + '_' + Date.now());
  f.arrayGroup = g;
  for (let r = 0; r < ny; r++) {
    for (let c = 0; c < nx; c++) {
      if (r === 0 && c === 0) continue; // Master-Position
      // Abstand = LÜCKE zwischen den Feldern → Schrittweite = Feldgröße + Lücke
      // (Feld 10 mm + Abstand 10 mm bei 2 Stück = 30 mm gesamt)
      fields.push({
        ...f, id: ++idc, arrayGroup: undefined, arrayOf: g,
        x: f.x + c * (f.w + dx), y: f.y + r * (f.h + dy)
      });
    }
  }
  _syncArrayClones(fields);
  document.getElementById('array-popover').style.display = 'none';
  scheduleRender(); renderFieldList(); renderProps();
  showToast(`⿻ Array erstellt: ${nx} × ${ny} — alle Kopien mit gleicher Gravur`);
}

function dissolveArray() {
  const f = fields.find(x => x.id === sel);
  if (!f) return;
  const g = f.arrayGroup || f.arrayOf;
  if (!g) return;
  saveUndo();
  fields = fields.filter(x => x.arrayOf !== g);
  const m = fields.find(x => x.arrayGroup === g);
  if (m) { delete m.arrayGroup; sel = m.id; }
  document.getElementById('array-popover').style.display = 'none';
  scheduleRender(); renderFieldList(); renderProps();
  showToast('Array aufgelöst');
}

// Verhalten bei zu breitem Text (f.overflowMode) — wirkt in Vorschau, PDF/PNG und DXF.
// Array-Mitglieder übernehmen den Modus gemeinsam, sonst staucht nur der Master.
function setOverflowMode(id, mode) {
  const f = fields.find(x => x.id === id);
  if (!f) return;
  saveUndo();
  const v = mode === 'ok' ? undefined : mode;
  _applyToArrayGroup(f, x => { x.overflowMode = v; });
  renderProps();
  scheduleRender();
}

// Drehung in Grad (im Uhrzeigersinn) — wirkt in Vorschau, PDF/PNG und DXF.
// Array-Mitglieder drehen gemeinsam (jede Kopie um die eigene Feldmitte).
function applyRotation(deg) {
  const f = fields.find(x => x.id === sel);
  if (!f || !Number.isFinite(deg)) return;
  saveUndo();
  const r = Math.max(-180, Math.min(180, deg)) || 0;
  _applyToArrayGroup(f, x => { x.rotation = r; });
  scheduleRender();
}

// ── Drag & Resize ─────────────────────────────────────────────────────────────
// EIN Ablauf für Verschieben und Größe ändern: erst ab 3 px Bewegung zählt es — dann genau ein
// Undo-Schritt. Bis 08.10.2026 legte „Größe ändern" schon beim bloßen Klick auf den Anfasser
// einen leeren Undo-Schritt an.
function _zugStarten(e, id, bewegen, fertig) {
  const f = fields.find(x => x.id === id);
  if (!f) return;
  drag = { id, sx: e.clientX, sy: e.clientY, o: { x: f.x, y: f.y, w: f.w, h: f.h }, moved: false, bewegen, fertig };
  document.addEventListener('mousemove', _zug);
  document.addEventListener('mouseup', _zugEnde);
}
function _zug(e) {
  if (!drag) return;
  const dx = e.clientX - drag.sx, dy = e.clientY - drag.sy;
  if (!drag.moved && Math.abs(dx) + Math.abs(dy) > 3) {
    drag.moved = true;
    saveUndo();
  }
  if (!drag.moved) return;
  const f = fields.find(x => x.id === drag.id);
  if (!f) return;
  drag.bewegen(f, drag.o, dx / MM / zoom, dy / MM / zoom);
  liveRender(drag.id);
}
function _zugEnde() {
  const z = drag;
  drag = null;
  document.removeEventListener('mousemove', _zug);
  document.removeEventListener('mouseup', _zugEnde);
  // Einmaliger voller Re-Render am Ende: Overlay + Feldliste + Eigenschaften (X/Y, B/H)
  if (z && z.moved) { if (z.fertig) z.fertig(z.id); scheduleRender(); renderFieldList(); renderProps(); }
}
function elDown(e, id) {
  if (e.target.classList.contains('rh')) return;
  e.preventDefault();
  // Auswahl komplett im mousedown, KEIN zusätzliches onclick: selectF → scheduleRender
  // ersetzt das Element per rAF noch vor dem mouseup, der click stirbt dabei
  // (Shift+Klick war wirkungslos) — und im Mehrfach-Modus wäre es ein Doppel-Toggle.
  selectF(id, e.shiftKey);
  // Beim Ziehen rastet die Position auf ganze Millimeter ein
  _zugStarten(e, id, (f, o, dx, dy) => { f.x = Math.max(0, Math.round(o.x + dx)); f.y = Math.max(0, Math.round(o.y + dy)); });
}
function rszDown(e, id) {
  e.preventDefault(); e.stopPropagation();
  _zugStarten(e, id, (f, o, dx, dy) => { f.w = Math.max(3, o.w + dx); f.h = Math.max(3, o.h + dy); }, _ddTextHoeheVerteilen);
}

// ── Bestellungen von Amazon laden ────────────────────────────────────────────
function dlPresetChange() {
  const val = document.getElementById('dl-preset').value;
  document.getElementById('dl-custom').style.display = val === 'custom' ? 'block' : 'none';
}

// „Erneut laden erzwingen" sichtbar machen: der Schalter hebt den Dublettenschutz auf,
// und ein Auto-Export danach graviert alles ein zweites Mal.
function dlForceChange() {
  const on = document.getElementById('dl-force')?.checked;
  const lbl = document.getElementById('dl-force-lbl');
  const hint = document.getElementById('dl-force-hint');
  // Schieber färbt sich über .tgl-cb:checked, der Kasten über .an — wie jeder Schalter.
  // Die Warnung steckt im TEXT darunter, nicht im Rahmen.
  _setAn(lbl, on);
  if (hint) hint.innerHTML = on
    ? '<b style="color:var(--amber);">Achtung:</b> bereits gravierte Bestellungen kommen erneut herein. Vor einem Auto-Export die alten Export-Dateien des Tages wegräumen.'
    : 'Auch schon geladene Bestellungen — für gelöschte Ordner.';
}

let dlInterval = null;   // Fortschritts-Poll des Downloads (s. _startDlRun)

// ── SCHEDULER ──────────────────────────────────────────────────────────────────
const DAYS_DE = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
// Zeitplan: der Server (schedule.json) ist die Quelle der Wahrheit; localStorage ist nur
// Anzeige-Fallback bis die Server-Antwort da ist. try/catch ist Pflicht — ein korrupter
// localStorage-Wert würde sonst hier auf Top-Level werfen und das GESAMTE App-Script killen.
let scheduleEntries = [];
try {
  scheduleEntries = JSON.parse(localStorage.getItem('pm_schedule') || '[]');
  if (!Array.isArray(scheduleEntries)) scheduleEntries = [];
} catch (e) { console.warn('pm_schedule unlesbar — starte leer:', e); }

// Erst speichern, wenn der Server-Stand da ist: bis dahin (oder wenn /schedule nicht antwortet)
// steht hier der localStorage-Stand — als ganze Liste gespeichert, überschriebe er Einträge, die
// ein anderes Gerät inzwischen geändert oder gelöscht hat.
let _zeitplanVomServer = false;
function saveSchedule() {
  if (!_zeitplanVomServer) {
    showToast('⚠️ Zeitplan vom Server noch nicht geladen — Änderung NICHT gespeichert. Bitte gleich noch einmal.', 6000);
    loadScheduleFromServer();
    return;
  }
  try { localStorage.setItem('pm_schedule', JSON.stringify(scheduleEntries)); } catch (e) { }
  // Server-Antwort PRÜFEN: er lehnt ungültige Einträge mit 400 ab. Still verschluckt
  // zeigt die UI Erfolg, während der laufende Zeitplan die Änderung nie bekommen hat.
  _apiJson('/v2/schedule', 'POST', scheduleEntries)
    .catch(e => showToast('⚠️ Zeitplan NICHT gespeichert: ' + e.message, 6000));
}

async function loadScheduleFromServer() {
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/v2/schedule`, { headers, credentials: 'include' });
    const data = res.ok ? await res.json() : null;
    // Server-Stand IMMER übernehmen, AUCH ein leeres Array: sonst zeigt ein zweites Gerät
    // gelöschte Einträge aus seinem localStorage weiter an und speichert sie zurück.
    if (Array.isArray(data)) {
      scheduleEntries = data;
      _zeitplanVomServer = true;
      try { localStorage.setItem('pm_schedule', JSON.stringify(data)); } catch (e) { }
      renderSchedule();
    }
  } catch (e) { }
}

function _uniqueId() { return Date.now() * 1000 + Math.floor(Math.random() * 1000); }

function addScheduleEntry() {
  const now = new Date();
  const id = _uniqueId();
  scheduleEntries.push({ id, day: now.getDay(), time: '13:00', status: 'Unshipped,PartiallyShipped,Shipped', fromPreset: 'last24h', fromTime: '', active: true, lastRun: null, lastCount: null });
  _zpOffen.add(id);   // neuer Eintrag steht gleich zum Bearbeiten offen
  saveSchedule(); renderSchedule();
}

async function removeScheduleEntry(id) {
  const entry = scheduleEntries.find(e => e.id === id);
  if (!entry) return;
  const dayName = DAYS_DE[entry.day] || '';
  const ok = await confirmModal('Zeitplan-Eintrag löschen?', dayName + ' ' + entry.time, 'Löschen');
  if (!ok) return;
  scheduleEntries = scheduleEntries.filter(e => e.id !== id);
  saveSchedule(); renderSchedule();
  showToast('🗑 Zeitplan-Eintrag gelöscht');
}

function updateEntry(id, key, value) {
  const e = scheduleEntries.find(x => x.id === id);
  if (e) { e[key] = value; saveSchedule(); renderSchedule(); }
}

// Zeitplan kompakt (17.10.2026): je Tag EINE Zeile — Schalter, Tag + Uhrzeit, darunter Fenster und letzter
// Lauf. Bearbeiten über ✎ klappt die Eingaben auf (Zustand in _zpOffen, übersteht das Neuzeichnen).
const _zpOffen = new Set();
function _zpUmschalten(id) { _zpOffen.has(id) ? _zpOffen.delete(id) : _zpOffen.add(id); renderSchedule(); }
function _zpFenster(e) {
  const f = { last24h: 'letzte 24 h', last48h: 'letzte 48 h', today: 'seit 0 Uhr', fromTime: 'ab Vortag ' + (e.fromTime || '13:00') }[e.fromPreset] || 'letzte 24 h';
  const s = { Unshipped: ' · nur nicht versendet', Shipped: ' · nur versendet' }[e.status] || '';
  return f + s;
}
function renderSchedule() {
  const list = document.getElementById('schedule-list');
  const empty = document.getElementById('schedule-empty');
  if (!list) return;
  if (scheduleEntries.length === 0) { list.innerHTML = ''; if (empty) empty.style.display = 'block'; return; }
  if (empty) empty.style.display = 'none';
  list.innerHTML = scheduleEntries.map(e => {
    const on = e.active, offen = _zpOffen.has(e.id);
    const letzter = e.lastRun ? `<span class="zp-ok" title="Letzter Lauf">✓ ${e.lastRun} · ${e.lastCount ?? 0} Best.</span>` : '';
    const fromTimeRow = e.fromPreset === 'fromTime' ? `<div class="zp-zeile" style="align-items:center;margin-top:6px;"><span class="umut10" style="white-space:nowrap;flex:none;">Seit gestern ab</span><input type="time" aria-label="Ab Uhrzeit (Vortag)" value="${e.fromTime || '13:00'}" onchange="updateEntry(${e.id},'fromTime',this.value)"/></div>` : '';
    const bearbeiten = offen ? `
      <div class="zp-bearbeiten">
        <div class="zp-zeile">
          <select aria-label="Wochentag" onchange="updateEntry(${e.id},'day',+this.value)">${DAYS_DE.map((d, i) => `<option value="${i}" ${e.day === i ? 'selected' : ''}>${d}</option>`).join('')}</select>
          <input type="time" aria-label="Uhrzeit" value="${e.time}" onchange="updateEntry(${e.id},'time',this.value)"/>
        </div>
        <div class="zp-zeile" style="margin-top:6px;">
          <select aria-label="Bestellstatus" onchange="updateEntry(${e.id},'status',this.value)">
            <option value="Unshipped,PartiallyShipped,Shipped" ${e.status === 'Unshipped,PartiallyShipped,Shipped' ? 'selected' : ''}>Alle Status</option>
            <option value="Unshipped" ${e.status === 'Unshipped' ? 'selected' : ''}>Nicht versendet</option>
            <option value="Shipped" ${e.status === 'Shipped' ? 'selected' : ''}>Versendet</option>
          </select>
          <select aria-label="Zeitfenster" onchange="updateEntry(${e.id},'fromPreset',this.value);renderSchedule()">
            <option value="last24h" ${e.fromPreset === 'last24h' ? 'selected' : ''}>Letzte 24h</option>
            <option value="last48h" ${e.fromPreset === 'last48h' ? 'selected' : ''}>Letzte 48h</option>
            <option value="today" ${e.fromPreset === 'today' ? 'selected' : ''}>Seit heute 0 Uhr</option>
            <option value="fromTime" ${e.fromPreset === 'fromTime' ? 'selected' : ''}>Ab Uhrzeit…</option>
          </select>
        </div>
        ${fromTimeRow}
      </div>` : '';
    return `<div class="zp-karte ${on ? 'an' : 'aus'}${offen ? ' offen' : ''}">
      <div class="zp-kopf">
        <div class="aswitch${on ? ' on' : ''}" onclick="updateEntry(${e.id},'active',!scheduleEntries.find(x=>x.id===${e.id}).active)" title="${on ? 'Aktiv' : 'Pausiert'}"></div>
        <div class="zp-was" onclick="_zpUmschalten(${e.id})" title="Bearbeiten"><b>${DAYS_DE[e.day] || '?'}</b> <span class="zp-uhr">${_esc(e.time || '')}</span></div>
        <button class="zp-ikon${offen ? ' an' : ''}" onclick="_zpUmschalten(${e.id})" title="${offen ? 'Fertig' : 'Bearbeiten'}">${offen ? '✓' : '✎'}</button>
        <button class="zp-ikon" onclick="repeatScheduleRun(${e.id})" title="Zeitfenster dieses Eintrags jetzt erneut laden">↻</button>
        <button class="zp-ikon" onclick="removeScheduleEntry(${e.id})" title="Eintrag löschen">✕</button>
      </div>
      <div class="zp-unter"><span>${_esc(_zpFenster(e))}</span>${letzter}</div>${bearbeiten}
    </div>`;
  }).join('');
}

// Abruf starten und die Fortschrittsanzeige daranhängen — EINE Quelle für den manuellen
// Knopf UND das ↻ am Zeitplan-Eintrag.
async function _startDlRun(url, msg, init) {
  const btn = document.getElementById('dl-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Läuft…'; }
  document.getElementById('dl-progress').style.display = 'block';
  document.getElementById('dl-bar').style.width = '5%';
  document.getElementById('dl-bar').style.background = 'var(--accent)';
  document.getElementById('dl-msg').textContent = msg || '① Verbinde mit Amazon…';

  const res = await fetch(url, init);
  const data = await res.json().catch(() => ({}));
  // Der Server lässt nur EINEN Lauf zu. Ohne diesen Zweig pollt die Oberfläche auf den
  // bereits laufenden fremden Lauf und meldet dessen Ergebnis als das des eigenen.
  if (data && data.message === 'already_running') {
    _stopDlPoll('Es läuft bereits ein Abruf — bitte abwarten.', 'var(--amber)');
    return false;
  }
  // Abgelehnt (ungültige Eingabe, Eintrag nicht gefunden): sonst pollte die Anzeige den Stand des
  // VORIGEN Laufs und meldete dessen „Fertig".
  if (!res.ok) {
    _stopDlPoll('❌ ' + (data.error || 'HTTP ' + res.status));
    return false;
  }
  dlInterval = setInterval(pollDlProgress, 1500);
  return true;
}

// ↻ pro Zeitplan-Eintrag: führt GENAU diesen Lauf noch einmal aus (gleicher Fenster-Start,
// gleicher Status, danach derselbe Auto-Export). Die Arbeit macht der Server
// (scheduler.runEntry), hier hängt nur die Fortschrittsanzeige dran. Dateien landen im
// Nachbarordner „<Tag> Lauf 2". Ohne force — das Ledger lässt nur die Nachzügler durch.
async function repeatScheduleRun(id) {
  const e = scheduleEntries.find(x => x.id === id);
  if (!e) return;
  const preset = e.fromPreset || 'last24h';
  // Der TATSÄCHLICH gelaufene Termin zählt: „Do 12:00" sagt nicht, welcher Donnerstag.
  // Wer mittwochs den Donnerstags-Pfeil drückt, meint sechs Tage zurück, nicht gestern.
  const gelaufenMs = Date.parse(e.lastRunAt || '');
  const heuteBerlin = _dayBerlin();
  const wochentagHeute = new Date(`${heuteBerlin}T12:00:00Z`).getUTCDay();
  const schonHeuteGelaufen = Number.isFinite(gelaufenMs)
    && _berlinTag(gelaufenMs) === heuteBerlin;
  let fenster, hinweis = '';
  if (e.day === wochentagHeute && !schonHeuteGelaufen) {
    // Der Termin steht heute noch aus → der Pfeil zieht ihn vor, statt die Vorwoche zu holen.
    fenster = `heutiger ${DAYS_DE[e.day]}-Lauf, vorgezogen`;
    hinweis = ` Der ${e.time}-Lauf ist heute noch nicht gelaufen — du startest ihn also früher. Der Zeitplan-Termin selbst bleibt bestehen.`;
  } else if (Number.isFinite(gelaufenMs)) {
    const wann = new Date(gelaufenMs).toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin', weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
    });
    const tageHer = Math.round((Date.now() - gelaufenMs) / 86400000);
    fenster = `Lauf vom ${wann} Uhr` + (tageHer > 0 ? `, ${tageHer} Tag${tageHer === 1 ? '' : 'e'} her` : '');
    // Amazon löscht die Personalisierungsdaten nach rund vier Wochen (gemessen: 27 Tage
    // gehen noch, 30 nicht mehr) — dann kommen zwar Bestellungen, aber keine Vorlagen.
    if (tageHer > 25) hinweis = ' ⚠️ Achtung: der Lauf ist über 25 Tage her — Amazon hat die Gravurdaten dieser Bestellungen vermutlich schon gelöscht.';
  } else {
    fenster = preset === 'fromTime' ? `ab ${e.fromTime || '13:00'} Uhr des Vortags`
      : preset === 'last48h' ? 'letzte 48 Stunden'
        : preset === 'today' ? 'seit heute 0 Uhr'
          : 'letzte 24 Stunden';
    hinweis = ' (dieser Eintrag ist noch nie gelaufen — gerechnet wird aus der Einstellung)';
  }
  // Zwei Wege mit verschiedenen Folgen: nur Nachzügler = halbleere Bögen; ganzer Zeitraum
  // = volle Bögen, dafür sind die Dateien aus Lauf 1 hinfällig und dürfen NICHT mehr an
  // die Maschine.
  const wahl = await choiceModal(
    `Lauf ${DAYS_DE[e.day]} ${e.time} wiederholen?`,
    `Wiederholt genau diesen Termin: ${fenster}.${hinweis} Das Fenster läuft diesmal bis JETZT statt bis zur damaligen Obergrenze — sonst fehlen genau die Nachzügler. Der Auto-Export läuft mit, seine Dateien kommen in einen eigenen Tagesordner mit dem Zusatz „Lauf 2". Womit sollen die Layouts gefüllt werden?`,
    'Nur die Nachzügler', 'Ganzer Zeitraum');
  if (!wahl) return;
  const fillScope = wahl === 'all' ? 'window' : 'session';

  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    await _startDlRun(`${BASE_URL}/v2/repeat-run`,
      `↻ Wiederhole ${DAYS_DE[e.day]} ${e.time} (${fenster}${fillScope === 'window' ? ', ganzer Zeitraum' : ''})…`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      credentials: 'include',
      body: JSON.stringify({ id, fillScope })
    });
  } catch (err) {
    _stopDlPoll('❌ ' + err.message);
  }
}

// ── Reklamation: eine einzelne Bestellung ────────────────────────────────────
// Zustand des zuletzt geladenen Vorgangs (ASINs steuern die Layout-Vorauswahl).
let _reklaOrder = null;

function _reklaStatus(text, farbe) {
  const el = document.getElementById('rekla-status');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML = text;
  el.style.color = farbe;
  el.style.background = 'var(--bg2)';
  el.style.border = '1px solid ' + farbe;
}

// Dateien der geladenen Bestellung auflisten. public/ hängt unter „/", die Pfade sind
// direkt anklickbar; das Vorschaubild zeigt auf einen Blick, welches das Kundenfoto ist.
function _reklaZeigeDateien(files) {
  const el = document.getElementById('rekla-files');
  if (!el) return;
  if (!files || !files.length) { el.style.display = 'none'; el.innerHTML = ''; return; }
  const groesse = n => n >= 1048576 ? (n / 1048576).toFixed(1) + ' MB' : Math.max(1, Math.round(n / 1024)) + ' KB';
  // Nur Bilder — SVG/JSON haben als Kachel keinen Mehrwert.
  const titel = { foto: '📷 Kundenfoto', vorschau: '🖼 Vorschau von Amazon' };
  el.style.display = 'block';
  el.innerHTML = `<details class="rk-bilder"><summary class="il">📷 Bilder vom Kunden ansehen (${files.length})</summary>`
    + files.map(f => `
        <a href="${_esc(f.url)}" target="_blank" rel="noopener" title="${_esc(f.name)}"
           style="display:flex;align-items:center;gap:10px;padding:8px;margin-bottom:6px;border-radius:var(--r-m);background:var(--bg2);border:1px solid var(--border);text-decoration:none;color:var(--text);">
          <img src="${_esc(f.url)}" alt="" loading="lazy" style="width:56px;height:56px;object-fit:cover;border-radius:var(--r-s);flex-shrink:0;background:var(--bg3);"/>
          <span style="min-width:0;">
            <span class="u11" style="display:block;">${_esc(titel[f.art] || f.art)}</span>
            <span class="umut10" style="display:block;">${groesse(f.size)}</span>
          </span>
        </a>`).join('')
    + '<div class="umut10" style="margin-top:2px;line-height:1.5;">Nach „Reklamation erstellen“ liegt alles zur Bestellung auch im Reklamations-Ordner auf dem Netzlaufwerk.</div></details>';
}

// Bestellnummer aus beliebigem Text ziehen („Bestellnummer: 302-…" aus Amazon, mit Leerzeichen …);
// beim Einfügen gleich laden.
function _reklaEingabe(el, eingefuegt) {
  const m = String(el.value || '').match(/\d{3}-\d{7}-\d{7}/);
  if (!m) return;
  if (el.value !== m[0]) el.value = m[0];
  if (eingefuegt) reklaLoad();
}

// Vor jedem neuen Auftrag (Bestellung laden, ohne Bestellung anlegen, Weg wechseln): alles vom vorigen weg.
function _reklaZuruecksetzen() {
  document.getElementById('rekla-export').style.display = 'none';
  _reklaZeigeDateien(null); // Dateien der vorherigen Bestellung wegräumen
  document.getElementById('rekla-layouts').innerHTML = ''; // sonst erbt die neue Bestellung die Häkchen
  const st = document.getElementById('rekla-status');
  if (st) st.style.display = 'none';
  _reklaOrder = null;
  _reklaFoto = {}; _rfDaten = { status: 0, ordner: [] };
  _reklaErzeugt = new Set(); _reklaGraviert = false; _reklaAbschlussText = '';
  _reklaOrdner = { status: 0, ordner: [], alle: [] }; _reklaErstelltStand = null; _reklaErstellenText = '';
  reklaFotoZeichnen();
}
// Ordnername der Reklamation (Pfad, Dateinamen, Rückfragen): ohne Bestellung der eingegebene Name.
const _reklaName = () => (_reklaOrder && (_reklaOrder.ordner || _reklaOrder.orderId)) || '';

async function reklaLoad() {
  const eingabe = (document.getElementById('rekla-order')?.value || '').trim();
  const btn = document.getElementById('rekla-load-btn');
  _reklaZuruecksetzen();

  // Format schon hier prüfen: spart einen Server-Aufruf und sagt klarer, was fehlt.
  if (!/^\d{3}-\d{7}-\d{7}$/.test(eingabe)) {
    _reklaStatus('❌ Bestellnummer im Format <b>123-1234567-1234567</b> erwartet.', 'var(--red)');
    return;
  }

  btn.disabled = true;
  btn.textContent = '⏳ Lädt…';
  _reklaStatus('⏳ Bestellung wird von Amazon geholt …', 'var(--text-dim)');
  try {
    const data = await _apiJson('/v2/reload-order', 'POST', { orderId: eingabe });   // wirft mit der Server-Meldung
    if (data.message === 'already_running') {
      _reklaStatus('⚠️ Es läuft gerade ein Abruf — bitte abwarten und erneut versuchen.', 'var(--amber)');
      return;
    }
    _reklaOrder = data;
    // Bestellliste im Editor auffrischen, sonst fehlt die Bestellung beim Füllen
    await loadOrders();
    await loadSession();
    await _reklaGeladen(data);
  } catch (e) {
    // Zu alt (Amazon hat die Gravurdaten gelöscht): gleich den Weg ohne Bestellung anbieten.
    const zuAlt = /Gravurdaten nicht mehr/.test(e.message);
    _reklaStatus('❌ ' + _esc(e.message) + (zuAlt ? `<div style="margin-top:6px;"><button class="btn btn-xs btn-accent" onclick="_reklaOhneBestellung('${_jsStr(eingabe)}')">Ohne Bestellung anlegen</button></div>` : ''), 'var(--red)');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Bestellung laden';
  }
}
// Mit der Amazon-Nummer als Namen: der Ordner heißt wie die Bestellung, die Nummernfelder tragen ihre Ziffern.
let _rmVorname = '';
function _reklaOhneBestellung(nr) {
  _rmVorname = nr;
  reklaWeg('ohne');
}

// Auftrag ist da (Bestellung neu von Amazon geholt oder ohne Bestellung angelegt): Layouts anhaken,
// Status, Kundenbilder — und gleich alle angehakten Layouts erzeugen. Ab hier gibt es keinen
// Unterschied mehr zwischen den beiden Wegen.
async function _reklaGeladen(data) {
  if (data && Array.isArray(data.files)) {
    for (const f of data.files) {
      if (f.url && !f.url.startsWith('http') && !f.url.startsWith('blob:') && !f.url.startsWith('data:')) {
        f.url = `${BASE_URL}${f.url.startsWith('/') ? '' : '/'}${f.url}`;
      }
    }
  }
  _reklaOrder = data;
  await reklaFillLayouts();
  if (data.manuell) {
    _reklaStatus(`✅ <b>Ohne Bestellung</b> · Ordner „${_esc(data.ordner)}"`, 'var(--green)');
  } else {
    const tag = new Date(data.purchaseDate).toLocaleString('de-DE', {
      timeZone: 'Europe/Berlin', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
    // Artikel in Klartext: welcher Artikel zu welchem Layout gehört, welcher keins hat
    // (Mehr-Artikel-Bestellung Armband + Feuerzeug: das Armband fiel bisher still heraus).
    const autoL = _reklaLayoutsAlle.filter(l => l.autoExport);
    // Titel bis zum ersten „ - " / „ | " / „ (" — der Rest ist Werbetext
    const kurz = t => _ddKurz(String(t).split(/\s[-|–]\s|\s\(/)[0], 46);
    const artikel = (data.artikel || []).map(a => {
      const ls = _asinLayouts(_asinNorm(a.asin), autoL);
      return `<div class="rk-artikel">${ls.length ? '✓' : '<span style="color:var(--amber);">⚠</span>'} ${_esc(kurz(a.titel) || a.asin)}${a.menge > 1 ? ` <b>×${a.menge}</b>` : ''}`
        + `<div class="umut10">${ls.length ? '→ ' + ls.map(l => _esc(l.name)).join(' + ') : 'kein Layout — wird hier nicht erzeugt'}</div></div>`;
    }).join('');
    _reklaStatus(`✅ <b>${data.orderId}</b> geladen · Kauf ${tag} Uhr`
      + (data.hinweis ? `<div style="color:var(--amber);">⚠ ${_esc(data.hinweis)}</div>` : '')
      + (artikel ? '<div style="margin-top:6px;">' + artikel + '</div>' : ''), 'var(--green)');
  }
  _reklaZeigeDateien(data.files);
  document.getElementById('rekla-export').style.display = 'block';
  await _rfDatenLaden();
  reklaAllesStart();
}

// Layouts zur ASIN der Bestellung — mit _asinLayouts, also DERSELBEN Regel wie das Füllen
// im Tageslauf (Einzel-ASIN-Modus → Layout-ASIN, sonst ASIN je Feld). Mehrere Treffer
// sind keine Alternativen, sondern gehören zusammen: S01 = PDF-Foto („Schlüsselanhänger
// neu") + DXF-Rückseite (S01_Recht …), F02 V5 = Foto + _Text (Deckel). Deshalb sind alle
// Treffer angehakt; weitere lassen sich dazuklicken.
async function reklaFillLayouts() {
  const box = document.getElementById('rekla-layouts');
  const info = document.getElementById('rekla-layout-info');
  if (!box) return;
  const asins = (_reklaOrder?.asins || []).map(_asinNorm).filter(Boolean);
  let layouts = [];
  try { layouts = await getServerLayouts(); } catch (e) { layouts = []; }
  _reklaLayoutsAlle = layouts;
  const vorher = box.childElementCount ? new Set(_reklaGewaehlt()) : null;

  // Ohne Bestellung: genau das gewählte Layout und seine Partner (s. _rmSet) — über die ASIN kämen
  // auch Layouts ohne ASIN dazu, die jede Bestellung annehmen.
  const fest = Array.isArray(_reklaOrder?.layouts) ? new Set(_reklaOrder.layouts) : null;
  // Reihenfolge wie gespeichert — so läuft auch der Tageslauf (Foto-Layout vor _Text).
  const treffer = fest ? layouts.filter(l => fest.has(l.name)) : layouts.filter(l => asins.some(a => _asinLayouts(a, [l]).length));
  // Was der Tageslauf machen würde: nur Layouts mit Auto-Export-Haken. Hat keins den
  // Haken, gelten die übrigen Treffer — eine Reklamation braucht ihn nicht.
  let passend = fest ? treffer : treffer.filter(l => l.autoExport);
  if (!passend.length) passend = treffer;
  // Kein Treffer: alle zeigen, keins angehakt — sonst stünde der Bediener vor einer toten Maske.
  const andere = passend.length ? []
    : layouts.filter(l => !passend.includes(l)).sort((a, b) => (a.name || '').localeCompare(b.name || ''));

  info.innerHTML = !passend.length
    ? `<span style="color:var(--amber);">⚠ Kein Layout zur ASIN ${_esc(asins.join(', ') || '—')} — bitte selbst anhaken.</span>`
    : fest ? (passend.length > 1 ? `Gewähltes Layout und ${passend.length - 1} dazugehörige — alle angehakt.` : 'Gewähltes Layout.')
      : passend.length > 1 ? `${passend.length} Layouts zu dieser Bestellung erkannt — alle angehakt.` : 'Layout zu dieser Bestellung erkannt.';

  const zeile = (l, an) => `
    <label class="hstack" style="gap:10px;padding:8px 10px;margin-bottom:5px;border-radius:var(--r-s);cursor:pointer;background:var(--bg2);border:1px solid ${passend.includes(l) ? 'var(--green-rand)' : 'var(--line-input)'};">
      <input type="checkbox" value="${_esc(l.name)}"${an ? ' checked' : ''} onchange="_reklaHaken()"/>
      <span class="u11" style="flex:1;min-width:0;">${_esc(l.name)}</span>
    </label>`;
  box.innerHTML = passend.map(l => zeile(l, vorher ? vorher.has(l.name) : true)).join('')
    + (andere.length && passend.length ? '<div class="umut10" style="margin:6px 0 3px;">Andere Layouts</div>' : '')
    + andere.map(l => zeile(l, !!vorher?.has(l.name))).join('');
  _reklaKnopf();
}

// Angehakte Layout-Namen, in der Reihenfolge der Liste.
function _reklaGewaehlt() {
  return [...document.querySelectorAll('#rekla-layouts input[type=checkbox]:checked')].map(c => c.value);
}

function _reklaKnopf() {
  reklaFotoZeichnen();   // Foto-Karten und Abschluss folgen den Häkchen
}
// Häkchen geändert: ein neu angehaktes Layout sofort erzeugen. Einen eigenen Knopf dafür gab
// es bis 08.10. abends („Fehlende Dateien erzeugen") — den verstand niemand.
function _reklaHaken() {
  _reklaKnopf();
  const fehlt = _reklaGewaehlt().filter(n => !_reklaErzeugt.has(n));
  if (_reklaOrder && fehlt.length && !_rfLaeuft) _rfRechnen(fehlt);
}

// ── Reklamation ohne Bestellung (26.10.2026) ─────────────────────────────────
// Aufträge, die nicht (mehr) bei Amazon liegen (andere Shops, alte Bestellungen): Layout wählen, Text
// oder Bild selbst eintragen. Der Server macht daraus eine Bestellung in Amazons Form (Nummer 000-…,
// s. REKLA_MANUELL in index.js) — ab „② Layouts" läuft alles wie mit Bestellnummer. Abgefragt wird, was
// das Layout samt seinen Partnern zur selben ASIN füllt (F02 V5 = Foto + V5_Text = Deckeltext): Bild N
// und Gravur N (palNum, Kombi-Zeilen) und die Dropdown-Fragen, aus denen ein Feld seinen Inhalt nimmt.
let _rekWeg = 'nr';
let _rm = null;   // { layout, asins, asin, felder, werte, bilder: { nr: { datei, url, img, w, h, winkel } }, orderId }

function reklaWeg(weg) {
  if (weg === _rekWeg) return;
  _rekWeg = weg;
  document.getElementById('rk-weg-nr').classList.toggle('an', weg === 'nr');
  document.getElementById('rk-weg-ohne').classList.toggle('an', weg === 'ohne');
  document.getElementById('rk-nr').hidden = weg !== 'nr';
  document.getElementById('rk-ohne').hidden = weg !== 'ohne';
  // Der Auftrag des anderen Wegs gehört nicht hierher. Die Eingaben ohne Bestellung bleiben stehen —
  // „Gravurdateien erzeugen" ändert danach denselben Auftrag.
  _reklaZuruecksetzen();
  if (weg === 'ohne') _rmLayoutsFuellen();
}

// Layout-Liste frisch vom Server — auch bei jedem Öffnen des Reiters (s. switchTab), damit ein gerade
// angelegtes oder geändertes Layout sofort da ist. Ist schon eins gewählt, zeigt die Maske seine neue
// Fassung; Getipptes und Fotos bleiben.
async function _rmLayoutsFuellen() {
  const sel = document.getElementById('rm-layout');
  let layouts = [];
  try { layouts = await getServerLayouts(); } catch (_) { }
  _reklaLayoutsAlle = layouts;
  const vorher = sel.value;
  // Nach Ordner gruppiert, darin alphabetisch (V5 vor V10)
  const gruppen = new Map();
  for (const l of [...layouts].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'de', { numeric: true }))) {
    const g = l.group || 'Ohne Ordner';
    if (!gruppen.has(g)) gruppen.set(g, []);
    gruppen.get(g).push(l);
  }
  sel.innerHTML = '<option value="">Layout wählen …</option>'
    + [...gruppen.keys()].sort((a, b) => a.localeCompare(b, 'de', { numeric: true })).map(g => `<optgroup label="${_esc(g)}">`
      + gruppen.get(g).map(l => `<option value="${_esc(l.name)}">${_esc(l.name)}</option>`).join('') + '</optgroup>').join('');
  if (vorher && layouts.some(l => l.name === vorher)) sel.value = vorher;
  if (!_rm) return;
  const neu = layouts.find(l => l.name === _rm.layout.name);
  if (!neu) { sel.value = ''; _rmLayoutGewaehlt(); return; }   // inzwischen gelöscht oder umbenannt
  _rm.layout = neu;
  _rm.asins = [..._layoutAsinSet(neu)];
  if (!_rm.asins.includes(_rm.asin)) _rm.asin = _rm.asins[0] || '';
  _rmMerken();
  _rmZeichnen();
}

function _rmLayoutGewaehlt() {
  const name = document.getElementById('rm-layout').value;
  const l = _reklaLayoutsAlle.find(x => x.name === name) || null;
  _reklaZuruecksetzen();
  for (const b of Object.values(_rm?.bilder || {})) URL.revokeObjectURL(b.url);
  _rm = l ? { layout: l, asins: [..._layoutAsinSet(l)], asin: '', felder: null, werte: _rmVorname ? { name: _rmVorname } : {}, bilder: {}, orderId: '' } : null;
  if (_rm) _rmVorname = '';
  if (_rm) _rm.asin = _rm.asins[0] || '';
  _rmZeichnen();
}
function _rmAsinGewaehlt(asin) {
  if (!_rm) return;
  _rmMerken();
  _rm.asin = asin;
  _rmZeichnen();
}

// Auto-Export-Layouts, die diese ASIN ausdrücklich nennen (ohne das gewählte) — die Partner.
// Layouts ohne ASIN nähmen jede Bestellung an, sie sind keine Partner.
const _rmPartner = (asin) => (asin ? _reklaLayoutsAlle.filter(x => x.name !== _rm.layout.name && x.autoExport && _layoutAsinSet(x).has(asin)) : []);
// Gewähltes Layout und seine Partner, in gespeicherter Reihenfolge (wie der Tageslauf: Foto-Layout vor _Text).
function _rmSet() {
  if (!_rm) return [];
  const partner = new Set(_rmPartner(_rm.asin));
  return _reklaLayoutsAlle.filter(x => x.name === _rm.layout.name || partner.has(x));
}
// Was die Layouts aus einer Bestellung dieser ASIN lesen (_asinFelder — dieselbe Regel wie das Füllen):
// Bild N (mit Feldgröße für die Platzierung), Gravur N, Dropdown-Fragen mit Inhalt (ddFrage) und
// Bedingungen („Nur gravieren, wenn …"), die ohne Bestellung als erfüllt gelten — sonst bliebe genau
// das leer, was der Mitarbeiter eingetragen hat.
function _rmFelder(set, asin) {
  const bilder = new Map(), gravuren = new Map(), fragen = new Map(), auto = new Map();
  // „Gravur 3+4 (Körper hinten)" → „Körper hinten", „Bild 1" → ''
  const wo = s => String(s || '').replace(/^\s*(gravur|bild)\s*[\d+\s]*/i, '').replace(/^\((.*)\)$/, '$1').trim();
  const dazu = (map, nr, f, extra) => {
    const e = map.get(nr) || { nr, wo: new Set(), ...extra };
    map.set(nr, e);
    if (wo(f.name)) e.wo.add(wo(f.name));
  };
  const bedingung = b => { if (b?.frage && b.werte?.length) auto.set(_ddNorm(b.frage), { frage: b.frage, wert: b.werte[0] }); };
  for (const l of set) {
    bedingung(l.ddNur);
    for (const f of _asinFelder(asin, l)) {
      bedingung(f.ddWenn);
      if (f.ddFrage) {
        const q = fragen.get(_ddNorm(f.ddFrage)) || { frage: f.ddFrage, werte: new Set() };
        Object.keys(f.ddTabelle || {}).forEach(w => q.werte.add(w));
        fragen.set(_ddNorm(f.ddFrage), q);
      } else if (f.type === 'image') dazu(bilder, f.palNum || 1, f, { w: f.w, h: f.h });
      else if (f.type === 'text') for (const nr of _feldGravuren(f)) dazu(gravuren, nr, f, {});
    }
  }
  for (const k of fragen.keys()) auto.delete(k);
  const nachNr = m => [...m.values()].sort((a, b) => a.nr - b.nr).map(e => ({ ...e, wo: [...e.wo].join(' · ') }));
  return {
    bilder: nachNr(bilder), gravuren: nachNr(gravuren), auto: [...auto.values()],
    fragen: [...fragen.values()].map(q => ({ frage: q.frage, werte: [...q.werte].sort((a, b) => a.localeCompare(b, 'de', { numeric: true })) }))
  };
}

// Eingaben der Maske im Auftrag merken — ein Neuzeichnen (anderes Produkt, neue Fassung des Layouts)
// verliert so nichts, auch nicht, was in einem Feld steht, das das andere Produkt gar nicht hat.
function _rmMerken() {
  document.querySelectorAll('#rm-felder [data-rm]').forEach(el => { _rm.werte[el.dataset.rm] = el.value; });
}

// Schrift vorschlagen: die häufigste Kundenschrift dieser ASIN (ASIN-Check), sonst die des Textfelds —
// immer eine, die als Datei auf dem Server liegt (die Gravur braucht die Konturen).
const _rmProfile = new Map();
async function _rmSchriftVorschlag(asin, dateien, set) {
  const zaehl = {};
  if (asin) {
    if (!_rmProfile.has(asin)) _rmProfile.set(asin, _asinProfil(asin));
    const p = await _rmProfile.get(asin);
    for (const w of Object.values(p?.werte || {})) for (const [fam, n] of Object.entries(w.schriften || {})) zaehl[fam] = (zaehl[fam] || 0) + n;
  }
  const kandidaten = [...Object.entries(zaehl).sort((a, b) => b[1] - a[1]).map(e => e[0]),
  ...set.flatMap(l => (l.pages || []).flat()).filter(f => f && f.type === 'text').map(f => f.fontFamily)];
  for (const k of kandidaten) { const d = matchServerFontFile(dateien, k); if (d) return _schriftStamm(d); }
  return 'Arial';
}

async function _rmZeichnen() {
  const box = document.getElementById('rm-felder');
  if (!box) return;
  if (!_rm) { box.innerHTML = ''; return; }
  const rm = _rm, werte = rm.werte, set = _rmSet(), f = _rmFelder(set, rm.asin);
  rm.felder = f;
  const dateien = await getServerFontList();
  const schrift = werte.schrift || await _rmSchriftVorschlag(rm.asin, dateien, set);
  if (_rm !== rm) return;   // inzwischen anderes Layout gewählt
  const wert = k => _esc(werte[k] || '');
  const wo = s => (s ? ` <span class="rm-wo">· ${_esc(s)}</span>` : '');
  let html = '';
  // Gilt das Layout für mehrere Produkte (z. B. eine Form je ASIN), entscheidet das Produkt den Platz.
  // Erkennbar am Partner-Layout (S01_Herz, S01_Rund …) — die Amazon-Titel unterscheiden sich kaum.
  if (rm.asins.length > 1) {
    const name = a => { const p = _rmPartner(a).map(x => x.name); return p.length ? `${p.join(' + ')} · ${a}` : a; };
    html += `<div class="ig rm-feld"><label class="il" for="rm-asin">Produkt</label><select id="rm-asin" onchange="_rmAsinGewaehlt(this.value)">`
      + rm.asins.map(a => `<option value="${_esc(a)}"${a === rm.asin ? ' selected' : ''}>${_esc(name(a))}</option>`).join('')
      + '</select></div>';
  }
  html += `<div class="ig rm-feld"><label class="il" for="rm-name">Name oder Nummer${wo('wird der Ordnername')}</label>
    <input type="text" id="rm-name" data-rm="name" maxlength="60" autocomplete="off" spellcheck="false" placeholder="z. B. Müller oder 302-1234567-1234567" value="${wert('name')}"/></div>`;
  for (const b of f.bilder) {
    const cw = 144, ch = Math.max(40, Math.min(220, Math.round(cw * b.h / b.w)));
    html += `<div class="ig rm-feld"><span class="il">Bild ${b.nr}${wo(b.wo)}</span>
      <div class="rm-bild"><canvas id="rm-b-${b.nr}" width="${cw}" height="${ch}"></canvas>
        <div class="rm-bild-knoepfe">
          <label class="btn btn-full">📷 Foto wählen<input type="file" accept="image/jpeg,image/png" hidden onchange="_rmBildGewaehlt(${b.nr}, this)"/></label>
          <button type="button" class="btn btn-full" id="rm-dreh-${b.nr}" onclick="_rmDrehen(${b.nr})" disabled>↻ Drehen</button>
        </div></div></div>`;
  }
  for (const g of f.gravuren) {
    html += `<div class="ig rm-feld"><label class="il" for="rm-g-${g.nr}">Gravur ${g.nr}${wo(g.wo)}</label>
      <input type="text" id="rm-g-${g.nr}" data-rm="g${g.nr}" maxlength="300" autocomplete="off" spellcheck="false" value="${wert('g' + g.nr)}"/></div>`;
  }
  f.fragen.forEach((q, i) => {
    const k = 'q' + i;
    html += `<div class="ig rm-feld"><label class="il" for="rm-q-${i}">${_esc(q.frage)}</label>` + (q.werte.length
      ? `<select id="rm-q-${i}" data-rm="${k}"><option value="">— keine Auswahl —</option>${q.werte.map(v => `<option value="${_esc(v)}"${werte[k] === v ? ' selected' : ''}>${_esc(v)}</option>`).join('')}</select>`
      : `<input type="text" id="rm-q-${i}" data-rm="${k}" maxlength="200" autocomplete="off" value="${wert(k)}"/>`) + '</div>';
  });
  if (f.gravuren.length) {
    const namen = [...new Set([...dateien.map(_schriftStamm), schrift])].sort((a, b) => a.localeCompare(b, 'de'));
    html += `<div class="ig rm-feld"><label class="il" for="rm-schrift">Schrift</label><select id="rm-schrift" data-rm="schrift">`
      + namen.map(n => `<option value="${_esc(n)}"${n === schrift ? ' selected' : ''}>${_esc(n)}</option>`).join('') + '</select></div>';
  }
  if (!f.bilder.length && !f.gravuren.length && !f.fragen.length) {
    html += '<div class="rm-hinweis">⚠ Dieses Layout hat keine Felder, die aus einer Bestellung gefüllt werden.</div>';
  } else {
    html += `<button type="button" class="btn btn-accent btn-full" id="rm-los" onclick="_rmErzeugen()">${rm.orderId ? 'Änderungen übernehmen' : 'Gravurdateien erzeugen'}</button>
      <div id="rm-meldung" class="rm-hinweis" hidden></div>`;
  }
  box.innerHTML = html;
  for (const b of f.bilder) _rmBildZeichnen(b.nr);
}

// Amazon-Platzierung, die das Foto flächenfüllend und mittig ins Bildfeld legt: Druckfläche = Feld in
// 1/10 mm (Seitenverhältnis des Felds — composePlacement streckt sonst), Ursprung so, dass die Bildmitte
// nach der Drehung auf der Feldmitte liegt. Dieselben Zahlen gehen an den Server (s. manuellKundendaten).
function _rmPlatz(b, feld) {
  const W = Math.round(feld.w * 10), H = Math.round(feld.h * 10);
  const quer = b.winkel % 180 !== 0;
  const s = Math.max(W / (quer ? b.h : b.w), H / (quer ? b.w : b.h));
  const r = b.winkel * Math.PI / 180, mx = b.w * s / 2, my = b.h * s / 2;
  const x = W / 2 - (mx * Math.cos(r) - my * Math.sin(r)), y = H / 2 - (mx * Math.sin(r) + my * Math.cos(r));
  return { w: W, h: H, x: Math.round(x * 1000) / 1000, y: Math.round(y * 1000) / 1000, bw: b.w, bh: b.h, s, winkel: b.winkel };
}
const _rmPlacement = p => ({
  position: { x: 0, y: 0 }, dimension: { width: p.w, height: p.h },
  buyerPlacement: { position: { x: p.x, y: p.y }, dimension: { width: p.bw, height: p.bh }, scale: { scaleX: p.s, scaleY: p.s }, angleOfRotation: p.winkel }
});

async function _rmBildGewaehlt(nr, input) {
  const rm = _rm, datei = input.files && input.files[0];
  input.value = '';   // dasselbe Foto noch einmal wählen geht sonst nicht
  if (!rm || !datei) return;
  if (!/^image\/(jpeg|png)$/.test(datei.type)) return _rmMeldung('❌ Bitte ein JPG- oder PNG-Foto wählen.');
  const url = URL.createObjectURL(datei), img = new Image();
  img.src = url;
  try { await img.decode(); } catch (_) { URL.revokeObjectURL(url); return _rmMeldung('❌ Das Foto lässt sich nicht öffnen.'); }
  if (_rm !== rm) { URL.revokeObjectURL(url); return; }
  if (rm.bilder[nr]) URL.revokeObjectURL(rm.bilder[nr].url);
  rm.bilder[nr] = { datei, url, img, w: img.naturalWidth, h: img.naturalHeight, winkel: 0 };
  _rmMeldung('');
  _rmBildZeichnen(nr);
}
function _rmDrehen(nr) {
  const b = _rm?.bilder[nr];
  if (!b) return;
  b.winkel = (b.winkel + 90) % 360;
  _rmBildZeichnen(nr);
}
// Vorschau in der Maske: genau der Ausschnitt, der ins Bildfeld kommt (dieselbe Rechnung wie der Export).
function _rmBildZeichnen(nr) {
  const c = document.getElementById('rm-b-' + nr), b = _rm?.bilder[nr], feld = _rm?.felder?.bilder.find(x => x.nr === nr);
  if (!c || !feld) return;
  const x = c.getContext('2d');
  x.clearRect(0, 0, c.width, c.height);
  const dreh = document.getElementById('rm-dreh-' + nr);
  if (dreh) dreh.disabled = !b;
  if (b) x.drawImage(composePlacement(b.img, _rmPlacement(_rmPlatz(b, feld)), c.width, c.height), 0, 0);
}
function _rmMeldung(text) {
  const el = document.getElementById('rm-meldung');
  if (!el) { if (text) showToast(text, 4000); return; }
  el.hidden = !text;
  el.textContent = text;
}

async function _rmErzeugen() {
  const rm = _rm, btn = document.getElementById('rm-los');
  if (!rm || !rm.felder || !btn) return;
  // Während einer Vorschau nicht: der Server tauscht die Dateien aus, die der Export gerade liest.
  if (_rfLaeuft) return _rmMeldung('⏳ Die Vorschau läuft noch — bitte kurz warten.');
  const f = rm.felder, wert = id => (document.getElementById(id)?.value || '').trim();
  const texte = [];
  for (const g of f.gravuren) texte[g.nr - 1] = wert('rm-g-' + g.nr);
  for (let i = 0; i < texte.length; i++) if (texte[i] == null) texte[i] = '';
  const bilder = f.bilder.filter(b => rm.bilder[b.nr]).map(b => ({ nr: b.nr, platz: _rmPlatz(rm.bilder[b.nr], b) }));
  if (!texte.some(Boolean) && !bilder.length) return _rmMeldung('❌ Bitte Text eintragen oder ein Foto wählen.');
  const fragen = [...f.auto, ...f.fragen.map((q, i) => ({ frage: q.frage, wert: wert('rm-q-' + i) }))].filter(q => q.wert);
  const fd = new FormData();
  fd.append('auftrag', JSON.stringify({
    orderId: rm.orderId, name: wert('rm-name'), layout: rm.layout.name, asin: rm.asin,
    texte, schrift: wert('rm-schrift'), fragen, bilder
  }));
  for (const b of bilder) fd.append('bild' + b.nr, rm.bilder[b.nr].datei, rm.bilder[b.nr].datei.name);
  const namen = _rmSet().map(l => l.name);
  btn.disabled = true;
  btn.textContent = '⏳ Wird angelegt …';
  _rmMeldung('');
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(BASE_URL + '/v2/rekla/manuell', { method: 'POST', headers, credentials: 'include', body: fd });
    const d = await res.json().catch(() => ({}));
    if (!res.ok || d.error) throw new Error(d.error || 'HTTP ' + res.status);
    if (_rm !== rm) return;   // inzwischen anderes Layout gewählt
    rm.orderId = d.orderId;
    _reklaZuruecksetzen();
    await _reklaGeladen({ ...d, layouts: namen });
  } catch (e) {
    _rmMeldung('❌ ' + e.message);
  } finally {
    btn.disabled = false;
    btn.textContent = rm.orderId ? 'Änderungen übernehmen' : 'Gravurdateien erzeugen';
  }
}

// ── Reklamation: Foto-Gravur nachbessern ─────────────────────────────────────
// Ob ein Foto gut wird, sieht man erst am gravierten Feuerzeug — der Weg danach führt in
// die Reklamation. Hier zeigt sie je Foto-Layout (BMP mit Bildfeld) das Kundenfoto und
// daneben die Werkstück-Vorschau. „Alles ausprobieren" rechnet alle Fassungen in EINEM
// Export-Lauf und zeigt sie nebeneinander; „Diese nehmen" übernimmt eine. Darunter die
// Einzelgriffe. Jede Fassung ist ein echter Reklamations-Export über dieselbe Strecke —
// was die Vorschau zeigt, IST die Datei. Bei Text-Layouts erscheint der Bereich gar nicht.

// Stufen in GRAVURMENGE, minus = weniger gravieren. Auf dunklem Lack (invert) heißt das
// „dunkler", auf hellem Material „heller" — die Beschriftung dreht sich danach.
// Herkunft: −3 an F02_Schw_V6 am Werkstück beurteilt; −2/−1 = Rezept „Motiv läuft zu" (Lichter 40 % +
// lok. Kontrast 80 %) mit weniger Fläche; +1 = 4 Punkte mehr Dichte; +2 = Rezept „Gesicht zu dunkel"
// (Lichter 45 % + Dichte 26 %). Für Silber (ohne Invertieren) ist keine Stufe am Werkstück erprobt.
const _RF_STUFEN = {
  '-3': { inkMax: 0.35, localContrast: 0.8, densityTarget: 0.13 },
  '-2': { inkMax: 0.40, localContrast: 0.8, densityTarget: 0.16 },
  '-1': { inkMax: 0.45, localContrast: 0.8, densityTarget: 0.19 },
  '1': { densityTarget: 0.26 },
  '2': { inkMax: 0.45, densityTarget: 0.26 },
};
const _RF_MIN = -3, _RF_MAX = 2;
// „Zu kantig / wie gezeichnet" (Augen schwarz ohne Pupillen, Münder gezeichnet — Befund
// 27.09.2026): Kantenbetonung und Schärfen zurücknehmen — die Betonung, die das Layout gerade
// benutzt (Kanten ODER Konturen, s. _rfKantenWerte). Faktor aus den ersten Werten 1,5 → 0,8 / 0,3.
// Am Werkstück noch NICHT erprobt — die Urteile (rekla-urteile.json) zeigen, ob es trägt.
const _RF_KANTEN = {
  '-1': { faktor: 0.53, sharpen: 0.5 },
  '-2': { faktor: 0.2, sharpen: 0.3 },
};
function _rfKantenWerte(stufe, l) {
  const k = _RF_KANTEN[stufe];
  if (!k) return {};
  const s = _laserSettings(l?.ditherSettings), r = v => Math.round(v * k.faktor * 100) / 100;
  if (s.konturen > 0) return { konturen: r(s.konturen), sharpen: k.sharpen };
  if (s.edgeBoost > 0) return { edgeBoost: r(s.edgeBoost), sharpen: k.sharpen };
  return { sharpen: k.sharpen };
}
// „Weiße Punkte im Schwarz / dunkle Bereiche flau" (Blech 6/7 und Reklamation „Timmy",
// 21.09.2026): Sprenkel-Schnitt 20 % — am Werkstück bestätigt, bei 26 % kippt es. Live 6–12 %.
const _RF_SPRENKEL = { inkDropout: 0.20 };
// Gesichter heller/dunkler (Gesichtserkennung, s. _fokusAnwenden): Faktor fürs Gesicht und für
// den Rest des Fotos. „Heller" dunkelt zugleich den Rest ab — der Fall vom 08.10. war ein
// Hintergrund, der heller war als die Gesichter (von Hand: Rest auf 25 % → „Personen erkennt
// man"). Ab Stufe +1 ohne Bereichsausgleich: der hob den abgedunkelten Rest wieder an.
const _RF_GESICHT = {
  '-2': { gesicht: 0.6, rest: 1 },
  '-1': { gesicht: 0.78, rest: 1 },
  // Erste Galerie (08.10.): Gesicht ×1,2 machte die Gesichter schon zur weißen Platte — der
  // Gewinn kommt aus dem dunkleren Rest, die Dichte-Regelung schiebt die Punkte dann ins Gesicht.
  '1': { gesicht: 1.0, rest: 0.45 },
  '2': { gesicht: 1.1, rest: 0.28 },
};
// Werkstück-Simulation: örtliche Dichte (Kastenfilter ≈ Gauß σ 2 px) → Helligkeit, ab
// dieser Dichte reinweiß. Geeicht am 08.10.2026: mit 25 % zeigt sie den alten V6-Stand
// genau so, wie er am Feuerzeug aussah („alles weiß, kein Gesicht"); mit 35 % sah er
// noch gut aus.
const _RF_SAETTIGUNG = 0.25;
// Was „Alles ausprobieren" rechnet. `z` = Zustand, den „Diese nehmen" übernimmt.
const _RF_VARIANTEN = [
  { k: 'standard', z: {} },
  { k: 'g1', z: { stufe: -1 } }, { k: 'g2', z: { stufe: -2 } }, { k: 'g3', z: { stufe: -3 } },
  { k: 'm1', z: { stufe: 1 } }, { k: 'm2', z: { stufe: 2 } },
  { k: 'gesicht1', z: { gesicht: 1 }, gesichter: true },
  { k: 'gesicht2', z: { gesicht: 2 }, gesichter: true },
  { k: 'gesicht1-g1', z: { gesicht: 1, stufe: -1 }, gesichter: true },
  { k: 'gesichtd', z: { gesicht: -1 }, gesichter: true },
  { k: 'kanten', z: { kanten: -1 } },
  { k: 'punkte', z: { sprenkel: true } },
];
let _reklaLayoutsAlle = [];
let _reklaFoto = {};                         // Layoutname → Zustand (s. _rfZustand)
function _rfNormalize(d) {
  if (!d) return d;
  for (const o of (d.ordner || [])) {
    for (const p of (o.plaetze || [])) {
      if (p.url && !p.url.startsWith('http') && !p.url.startsWith('blob:') && !p.url.startsWith('data:')) {
        p.url = `${BASE_URL}${p.url.startsWith('/') ? '' : '/'}${p.url}`;
      }
    }
    for (const f of (o.dateien || [])) {
      if (f.url && !f.url.startsWith('http') && !f.url.startsWith('blob:') && !f.url.startsWith('data:')) {
        f.url = `${BASE_URL}${f.url.startsWith('/') ? '' : '/'}${f.url}`;
      }
    }
  }
  for (const a of (d.alle || [])) {
    if (a.url && !a.url.startsWith('http') && !a.url.startsWith('blob:') && !a.url.startsWith('data:')) {
      a.url = `${BASE_URL}${a.url.startsWith('/') ? '' : '/'}${a.url}`;
    }
  }
  return d;
}
let _rfDaten = { status: 0, ordner: [] };    // letzte Antwort von /rekla/bilder
let _rfLaeuft = false;                       // ein Export zur Zeit — sonst verwechselt das Warten die Ergebnisse

function _rfIstFoto(l) {
  return !!(l && /bmp/.test(l.exportFormat || '') && l.ditherSettings && l.ditherSettings.active
    && _layoutHat(l, f => f.type === 'image'));
}
function _rfLayouts() {
  const an = new Set(_reklaGewaehlt());
  return _reklaLayoutsAlle.filter(l => an.has(l.name) && _rfIstFoto(l));
}
const _RF_LEER = { stufe: 0, kanten: 0, sprenkel: false, gesicht: 0, als: '' };
// Zustand einer Version aus „Alles ausprobieren" — die gewählte Art (`als`) gilt für alle Versionen.
const _rfVz = (v, z) => ({ ..._RF_LEER, als: z?.als || '', ...v.z });
// Wie die Pipeline das Bild behandelt hat. `z.erkannt` = { art, teils } aus dem letzten Lauf OHNE
// „Als … rechnen", gelesen aus der belegung.txt (s. _bmpBelegungsListe). `z.als` rechnet in der anderen
// Art: 'foto' = Grafik-/Logo-Erkennung aus, 'grafik' = wie eine erkannte Grafik (Schwelle).
const _RF_ART = { foto: 'Foto', grafik: 'Grafik', logo: 'Logo' };
async function _rfArtLesen(l) {
  const o = _rfDaten.ordner.find(x => x.ordner === _vorlageName(l));
  const d = o && (o.dateien || []).find(f => f.name === 'belegung.txt');
  if (!d) return null;
  // Fehlerantwort NICHT als leere Liste lesen — sonst verschwände die Zeile still (Aufrufer behält den alten Stand).
  const u = d.url.startsWith('http') ? d.url : `${BASE_URL}${d.url.startsWith('/') ? '' : '/'}${d.url}`;
  const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await fetch(u + '?t=' + Math.round(d.zeit), { headers, credentials: 'include', cache: 'no-store' });
  if (!r.ok) throw new Error('belegung.txt: HTTP ' + r.status);
  const text = await r.text();
  const { plaetze } = _ezBelegungLesen(text);
  const arten = new Set([...plaetze.values()].filter(p => !p.leer)
    .map(p => 'logo' in p.notizen ? 'logo' : 'grafik' in p.notizen ? 'grafik' : 'foto'));
  if (!arten.size) return null;
  const art = [...arten].find(a => a !== 'foto') || 'foto';
  // Schwelle nur, wenn kein Platz als „Grafik mit Verläufen" lief (beide Abschnitte beginnen mit „ALS GRAFIK").
  return { art, teils: arten.size > 1, schwelle: art === 'grafik' && !text.includes('ALS GRAFIK GRAVIERT (Verlaeufe') };
}
// Rechnet das Layout gerade als Grafik mit Schwelle? Dann wirken die Foto-Knöpfe nicht (gemessen 20.10.: Dateien
// bitgleich). NICHT bei Logo und „Grafik mit Verläufen" — dort wirken einzelne Knöpfe — und nicht bei gemischten Plätzen.
const _rfNurSchwelle = z => z.als === 'grafik'
  || (!z.als && z.erkannt?.art === 'grafik' && !!z.erkannt.schwelle && !z.erkannt.teils);
// Eine Zeile „Als … erkannt" und EIN Knopf: in der anderen Art rechnen bzw. wieder wie erkannt.
// Steht in der Karte direkt unter dem Titel (bei 6 Stück ist der Bildstreifen lang) und oben in der großen Ansicht.
function _rfArtZeile(z) {
  const e = z.erkannt, aus = _rfLaeuft ? ' disabled' : '';
  if (!e || !_RF_ART[e.art]) return '';
  const ziel = z.als ? e.art : (e.art === 'foto' ? 'grafik' : 'foto');
  // Nach dem Umschalten steht da, was JETZT gerechnet ist — „erkannt" bliebe sonst stehen (Nutzer 20.10.).
  const text = z.als ? `Als ${_RF_ART[z.als]} gerechnet` : `${e.teils ? 'Teils als' : 'Als'} ${_RF_ART[e.art]} erkannt`;
  const tip = z.als ? `Wieder so rechnen, wie das Bild erkannt wurde (${_RF_ART[e.art]})`
    : ziel === 'foto' ? 'Wenn Schrift oder Bild lückenhaft oder zerfressen herauskommt: mit Fotoaufbereitung rechnen'
      : 'Wenn Schrift oder Logo gepunktet statt satt herauskommt: ohne Raster rechnen, harte Kanten';
  return `
      <div class="rf-art"><b>${text}</b>
        <button class="btn${z.als ? ' btn-accent' : ''}"${aus} onclick="_rfArt(this)" title="${tip}">Als ${_RF_ART[ziel]} rechnen</button></div>`;
}
function _rfArt(el) {
  const n = _rfName(el), z = _rfZustand(n);
  if (!z.erkannt || _rfLaeuft) return;
  // Art wechseln = neu anfangen: Foto-Einstellungen wirken bei Grafik nicht (Knöpfe grau) und kämen sonst
  // still mit („Als Grafik · Bild heller", nur über „zurück auf Standard" wieder weg).
  Object.assign(z, _RF_LEER, { als: z.als ? '' : (z.erkannt.art === 'foto' ? 'grafik' : 'foto'), urteil: '', vorlageOk: false });
  _rfRechnen([n]);
}
function _rfZustand(name) {
  return _reklaFoto[name] || (_reklaFoto[name] = { ..._RF_LEER, gesichter: null, fehler: '', urteil: '', fertig: false });
}
// Kundenfoto zum Layout: bei Mehr-Artikel-Bestellungen über die ASIN des Artikels.
function _rfFoto(l) {
  const fotos = (_reklaOrder?.files || []).filter(f => f.art === 'foto');
  return fotos.find(f => f.asin && _asinLayouts(_asinNorm(f.asin), [l]).length) || fotos[0] || null;
}
const _rfDunkelLack = l => l?.ditherSettings?.invert !== false;
// Text einer Fassung in Worten des Bedieners — auf dunklem Lack ist weniger Gravur „dunkler".
function _rfText(z, l) {
  const dl = _rfDunkelLack(l), t = [];
  const n = v => Math.abs(v) > 1 ? ' ' + Math.abs(v) : '';
  if (z.als) t.push('Als ' + _RF_ART[z.als]);
  if (z.stufe) t.push(`Bild ${(z.stufe < 0) === dl ? 'dunkler' : 'heller'}${n(z.stufe)}`);
  if (z.gesicht) t.push(`Gesichter ${z.gesicht > 0 ? 'heller' : 'dunkler'}${n(z.gesicht)}`);
  if (z.kanten) t.push(`Kanten weicher${n(z.kanten)}`);
  if (z.sprenkel) t.push('Punkte im Schwarz weg');
  return t.join(' · ') || 'Standard';
}
// Steht im Layout die Gesichts-Automatik, stellt sie jedes Gesicht auf `gesichtZiel` — ohne Nachziehen
// täten „zu hell/zu dunkel" und „Gesicht heller/dunkler" im Gesicht nichts mehr. Faktoren je Stufe.
const _RF_GESICHT_ZIEL = {
  stufe: { '-3': 0.6, '-2': 0.7, '-1': 0.85, '1': 1.2, '2': 1.4 },
  gesicht: { '-2': 0.7, '-1': 0.85, '1': 1.2, '2': 1.4 }
};
// Die Stufen sind bei Dichte 21,3 % (500 DPI) erprobt. Ein Layout mit anderer Basis (F02 schwarz seit 13.10.2026:
// 32 % bei 275 DPI) bekommt sie im selben Verhältnis — sonst machte „heller" (Dichte 26 %) das Bild dunkler.
const _RF_BASIS_DICHTE = 0.213;
const _basisFaktor = s => s.densityTarget > 0 ? s.densityTarget / _RF_BASIS_DICHTE : 1;
// EINE Umrechnung für Reklamations-Stufen und Dithering-Rezepte (laserRezept)
function _aufBasisDichte(werte, k) {
  const o = { ...werte };
  if (o.densityTarget != null) o.densityTarget = Math.round(Math.min(0.6, o.densityTarget * k) * 1000) / 1000;
  if (o.inkMax != null) o.inkMax = Math.round(Math.min(1, o.inkMax * k) * 100) / 100;
  return o;
}
function _rfStufeSkaliert(stufe, l) {
  const st = _RF_STUFEN[stufe];
  if (!st) return {};
  const k = _basisFaktor(_laserSettings(l?.ditherSettings));
  return Math.abs(k - 1) < 0.001 ? { ...st } : _aufBasisDichte(st, k);
}
function _rfWerteAus(z, l) {
  const o = { ..._rfStufeSkaliert(z.stufe, l), ..._rfKantenWerte(z.kanten, l), ...(z.sprenkel ? _RF_SPRENKEL : {}) };
  if (z.als === 'foto') o.grafikAuto = false;
  else if (z.als === 'grafik') o.grafikErzwingen = true;
  // Heller/dunkler ist ein ausdrücklicher Wunsch — die Dichte-Bremse darf ihn nicht abfangen, aber auch nicht
  // umdrehen. Ganz ohne Bremse regelte „heller" ein gebremstes Foto DUNKLER als die normale Gravur (Prüfung
  // 14.10.2026: 51 % Laser → 44 %). Darum nur die Grenze in Wunschrichtung lösen: „heller" behält die untere
  // (nie dunkler als normal), „dunkler" die obere (nie heller als normal). Heller = höherer Gamma-Faktor,
  // auf jedem Material (s. _dichteRegeln).
  if (z.stufe) {
    const sb = _laserSettings(l?.ditherSettings), m = sb.densityFaktorMin;
    if (m > 0 && m < 1) {
      const heller = (z.stufe > 0) === _rfDunkelLack(l);
      Object.assign(o, heller ? { densityFaktorMin: m, densityFaktorMax: 100 }
        : { densityFaktorMin: 0, densityFaktorMax: sb.densityFaktorMax > 1 ? sb.densityFaktorMax : 1 / m });
    }
  }
  // Abgedunkelten Rest NICHT vom Bereichsausgleich wieder aufhellen lassen — genau das machte
  // am 08.10. die Handbearbeitung erst wirkungslos.
  if (z.gesicht > 0) Object.assign(o, { regionImmer: 0, regionAusgleich: 0 });
  const s = _laserSettings(l?.ditherSettings);
  if (s.gesichtAuto) {
    const f = (_RF_GESICHT_ZIEL.stufe[z.stufe] || 1) * (_RF_GESICHT_ZIEL.gesicht[z.gesicht] || 1);
    if (f !== 1) o.gesichtZiel = Math.round(Math.min(0.4, Math.max(0.06, s.gesichtZiel * f)) * 1000) / 1000;
  }
  return o;
}
function _rfFokusAus(z, l) {
  const f = _rfFoto(l), g = _reklaFoto[l.name]?.gesichter;
  if (!z.gesicht || !f || !g || !g.length) return {};
  return { [f.name]: { g, ..._RF_GESICHT[z.gesicht] } };
}
function _rfExportExtras(namen) {
  const laserJe = {}, fokus = {};
  for (const n of namen) {
    const z = _reklaFoto[n], l = _reklaLayoutsAlle.find(x => x.name === n);
    if (!z || !l) continue;
    const w = _rfWerteAus(z, l);
    if (Object.keys(w).length) laserJe[n] = w;
    Object.assign(fokus, _rfFokusAus(z, l));
  }
  return { laserJe, fokus };
}

// ── Gesichtserkennung (YuNet — dieselbe wie die Gesichts-Automatik, s. _ynLaden) ──
// Bis 11.10.2026 MediaPipe: fand an 82 Kunden-Gesichtern 49 %, YuNet 83 %. Erkannt wird auf dem
// Kundenfoto; die Kästen gehen als Anteil 0…1 an den Export (s. _fokusAnwenden). Profile, verdeckte
// und sehr kleine Gesichter fehlen weiterhin oft.
async function _rfGesichterErkennen(l) {
  const z = _rfZustand(l.name), foto = _rfFoto(l);
  if (z.gesichter) return z.gesichter;
  if (!foto) return (z.gesichter = []);
  const im = new Image();
  im.crossOrigin = 'anonymous';
  im.src = foto.url;
  await im.decode();
  // Verkleinert einlesen: YuNet sieht ohnehin nur 640 px, ein 12-Megapixel-Foto kostete sonst Zeit.
  const w = im.naturalWidth, h = im.naturalHeight, f = Math.min(1, 1600 / Math.max(w, h));
  const cw = Math.max(1, Math.round(w * f)), ch = Math.max(1, Math.round(h * f));
  const c = document.createElement('canvas');
  c.width = cw; c.height = ch;
  const x = c.getContext('2d');
  x.drawImage(im, 0, 0, cw, ch);
  z.gesichter = (await _yunetFinden(x.getImageData(0, 0, cw, ch).data, cw, ch)).map(b =>
    [b.x0 / cw, b.y0 / ch, (b.x1 - b.x0) / cw, (b.y1 - b.y0) / ch]
      .map(v => Math.round(Math.min(1.2, Math.max(-0.2, v)) * 1e4) / 1e4));
  return z.gesichter;
}

// Beim Laden gleich ALLE angehakten Layouts erzeugen (Foto wie Text) — der Mitarbeiter muss
// danach nur noch prüfen und in die Vorlage legen.
let _reklaErzeugt = new Set();    // Layouts, deren Dateien in dieser Sitzung erzeugt wurden
let _reklaGraviert = false;       // in die Vorlage gelegt bzw. heruntergeladen → Urteil abfragen
function reklaAllesStart() {
  const namen = _reklaGewaehlt();
  reklaFotoZeichnen();
  if (namen.length) _rfRechnen(namen);
}

function reklaFotoZeichnen() {
  _reklaAbschlussZeichnen();
  const box = document.getElementById('rekla-foto');
  if (!box) return;
  const ls = _reklaOrder ? _rfLayouts() : [];
  const ts = _reklaOrder ? _rtLayouts() : [];   // Text/PDF: Vorschau ohne Knöpfe
  if (!ls.length && !ts.length) { box.hidden = true; box.innerHTML = ''; if (_rfV) _rfVSchliessen(); return; }
  box.hidden = false;
  box.innerHTML = `<div class="rk-schritt">③ ${ls.length ? 'Prüfen &amp; nachbessern' : 'Prüfen'}</div>`
    + ls.map(_rfKarte).join('') + ts.map(_rtKarte).join('');
  ls.forEach((l, i) => _rfVorschauFuellen(l, i));
  ts.forEach((l, i) => _rtVorschauFuellen(l, i));
  if (_rfV) _rfVZeichnen();   // große Ansicht offen: Knöpfe und „jetzt" mitziehen
}

function _rfKarte(l, i) {
  const z = _rfZustand(l.name), foto = _rfFoto(l);
  return `
    <div class="rf-karte" data-layout="${_esc(l.name)}">
      <div class="rf-titel"><b class="u11">${_esc(l.name)}</b><span class="rf-stand">${_esc(_rfText(z, l))}</span></div>${_rfArtZeile(z)}
      <div class="rf-bilder">
        <div class="rf-bild">
          <div class="rf-bild-rahmen rf-zoombar" onclick="_rfVOeffnen('bearbeiten', _rfName(this))" title="Antippen: groß ansehen und nachbessern">
            ${foto ? `<img src="${_esc(foto.url)}" alt="Kundenfoto" draggable="false"/>` : '<div class="rf-leer">kein Foto</div>'}
          </div>
          <div class="umut10">Kundenfoto</div>
        </div>
        <div class="rf-bild">
          <div class="rf-bild-rahmen rf-zoombar" id="rf-vorschau-${i}" onclick="_rfVOeffnen('bearbeiten', _rfName(this))" title="Antippen: groß ansehen und nachbessern"><div class="rf-leer">${_rfLaeuft && z.laeuft ? '⏳' : 'noch keine Datei'}</div></div>
          <div class="umut10">am Feuerzeug</div>
        </div>
      </div>
      ${_rfSteuerung(l)}
    </div>`;
}

// Knöpfe — dieselben in der Karte und rechts in der großen Ansicht.
function _rfSteuerung(l) {
  const z = _rfZustand(l.name);
  const aus = _rfLaeuft ? ' disabled' : '';
  const nurSchwelle = _rfNurSchwelle(z), ausF = nurSchwelle ? ' disabled' : aus;
  const hell = _rfDunkelLack(l) ? -1 : 1;       // „zu hell" = weniger Gravur auf dunklem Lack
  const raus = v => v < _RF_MIN || v > _RF_MAX;
  let status = '';
  if (_rfLaeuft && z.laeuft) status = `⏳ ${_esc(z.laeuftText || 'wird neu erzeugt')} …`;
  else if (z.fehler) status = `<span style="color:var(--red);">❌ ${_esc(z.fehler)}</span>`;
  else if (z.gesichter && !z.gesichter.length && z.gesichtVersuch) status = 'Keine Gesichter erkannt — dann „Bild heller" oder „Bild dunkler" nehmen.';
  return `${nurSchwelle ? '<div class="rf-unter">Bei Grafik wirken diese Knöpfe nicht — erst „Als Foto rechnen“.</div>' : ''}
      <button class="btn btn-accent btn-full"${ausF} onclick="_rfAllesProbieren(this)">✨ Alles ausprobieren</button>
      <div class="rf-unter">Einzeln nachbessern</div>
      <div class="rf-knoepfe">
        <button class="btn"${ausF || (raus(z.stufe - hell) ? ' disabled' : '')} onclick="_rfSetze(this, 'stufe', ${-hell})" title="Wenn das ganze Bild zu dunkel ist">☀ Bild heller</button>
        <button class="btn"${ausF || (raus(z.stufe + hell) ? ' disabled' : '')} onclick="_rfSetze(this, 'stufe', ${hell})" title="Wenn das ganze Bild zu hell ist">☾ Bild dunkler</button>
        <button class="btn"${ausF || (z.gesicht >= 2 ? ' disabled' : '')} onclick="_rfGesicht(this, 1)" title="Wenn Gesichter untergehen: Gesichter erkennen, Hintergrund dunkler — die Gesichter treten hervor">☺ Gesichter heller</button>
        <button class="btn"${ausF || (z.gesicht <= -2 ? ' disabled' : '')} onclick="_rfGesicht(this, -1)" title="Wenn Gesichter zu hell sind: Gesichter erkennen und dunkler machen">☻ Gesichter dunkler</button>
        <button class="btn"${ausF || (z.kanten <= -2 ? ' disabled' : '')} onclick="_rfSetze(this, 'kanten', -1)" title="Wenn Gesichter gezeichnet wirken: schwarze Linien, Augen ohne Pupillen">✎ Kanten weicher</button>
        <button class="btn${z.sprenkel ? ' btn-accent' : ''}"${ausF} onclick="_rfSetze(this, 'sprenkel')" title="Wenn einzelne weiße Punkte in dunklen Flächen stören">⁘ Punkte im Schwarz weg</button>
      </div>
      <button class="btn btn-full"${aus || (_rfText(z, l) === 'Standard' ? ' disabled' : '')} onclick="_rfStandard(this)">↺ zurück auf Standard</button>
      <div class="rf-status umut10">${status}</div>`;
}

const _rfName = el => el.closest('.rf-karte')?.dataset.layout || el.closest('[data-layout]')?.dataset.layout || '';
const _rfLayout = n => _reklaLayoutsAlle.find(x => x.name === n);

function _rfSetze(el, was, d) {
  if (_rfLaeuft) return;   // während eines Laufs nichts ändern — sonst passen Anzeige und Datei nicht zusammen
  const n = _rfName(el), z = _rfZustand(n);
  if (was === 'sprenkel') z.sprenkel = !z.sprenkel;
  else if (was === 'stufe') z.stufe = Math.max(_RF_MIN, Math.min(_RF_MAX, z.stufe + d));
  else if (was === 'kanten') z.kanten = Math.max(-2, z.kanten + d);
  z.urteil = ''; z.vorlageOk = false;
  _rfRechnen([n]);
}
async function _rfGesicht(el, d) {
  const n = _rfName(el), z = _rfZustand(n);
  try {
    z.laeuft = true; z.laeuftText = 'Gesichter werden erkannt'; _rfLaeuft = true; reklaFotoZeichnen();
    await _rfGesichterErkennen(_rfLayout(n));
  } catch (e) {
    z.fehler = 'Gesichtserkennung fehlgeschlagen: ' + e.message;
  } finally { _rfLaeuft = false; z.laeuft = false; }
  z.gesichtVersuch = true;
  if (!z.gesichter || !z.gesichter.length) { reklaFotoZeichnen(); return; }
  z.gesicht = Math.max(-2, Math.min(2, z.gesicht + d));
  z.urteil = ''; z.vorlageOk = false;
  _rfRechnen([n]);
}
function _rfStandard(el) {
  if (_rfLaeuft) return;   // während eines Laufs nichts ändern — sonst passen Anzeige und Datei nicht zusammen
  const n = _rfName(el), z = _rfZustand(n);
  Object.assign(z, _RF_LEER, { urteil: '', vorlageOk: false });
  _rfRechnen([n]);
}

// Während eines Laufs neu geladene Bestellung: ihr „Laden erzeugt alles" kam nicht an _rfLaeuft vorbei — nachholen.
function _rfNeueBestellung() {
  if (!_reklaOrder || _rfLaeuft) return;
  reklaFotoZeichnen();
  const fehlt = _reklaGewaehlt().filter(n => !_reklaErzeugt.has(n));
  if (fehlt.length) setTimeout(() => _rfRechnen(fehlt), 0);
}
// Einen Export anstoßen und warten, bis die status.txt dieser Bestellung jünger ist als der
// Auftrag (Serveruhr). `extra` = zusätzliche Felder für /export-single (Varianten).
// `echt` = „Reklamation erstellen": in den Ordner auf dem Netzlaufwerk. Sonst Vorschau — der
// Server legt dann alles in seinen Zwischenspeicher (09.10.: Ordner erst nach Bestätigung).
async function _rfExportUndWarten(namen, extra, echt = false) {
  const auftrag = _reklaOrder, id = auftrag.orderId;
  const data = await _apiJson('/v2/export-single', 'POST', { orderId: id, layouts: namen, ...extra, vorschau: !echt });
  const bis = Date.now() + 6 * 60000;
  while (Date.now() < bis) {
    await new Promise(r => setTimeout(r, 1000));
    if (_reklaOrder !== auftrag) throw new Error('andere Bestellung geladen');   // auch dieselbe Nummer neu geladen
    const d = await _apiJson(`/v2/rekla/bilder?orderId=${encodeURIComponent(id)}${echt ? '' : '&quelle=vorschau'}`).catch(() => null);
    if (d && d.status > data.zeit) { if (echt) _reklaOrdner = _rfNormalize(d); else _rfDaten = _rfNormalize(d); return; }
  }
  throw new Error('dauert ungewöhnlich lange — läuft gerade ein anderer Export? Gleich noch einmal versuchen.');
}

async function _rfRechnen(namen) {
  if (_rfLaeuft || !_reklaOrder) return;
  const auftrag = _reklaOrder;
  // Zustände und Erzeugt-Liste JETZT greifen: lädt der Bediener währenddessen eine andere Bestellung, gehören
  // Ergebnis und Fehler zur alten — _rfZustand(n) gäbe dann schon die der neuen zurück.
  const zs = new Map(namen.map(n => [n, _rfZustand(n)])), erzeugt = _reklaErzeugt;
  _rfLaeuft = true;
  for (const z of zs.values()) Object.assign(z, { laeuft: true, laeuftText: 'wird neu erzeugt (10–30 s)', fehler: '' });
  reklaFotoZeichnen();
  try {
    await _rfExportUndWarten(namen, _rfExportExtras(namen));
    for (const n of namen) {
      const z = zs.get(n), l = _rfLayout(n);
      z.fertig = true;
      erzeugt.add(n);
      // Wie erkannt? Nur aus einem Lauf ohne „Als … rechnen" — sonst stünde dort die erzwungene Art.
      if (!z.als && _rfIstFoto(l)) z.erkannt = await _rfArtLesen(l).catch(() => z.erkannt);
      // Den Standard einmal festhalten — die große Ansicht zeigt ihn links dauerhaft.
      if (_rfText(z, l) === 'Standard') z.standard = await _rfBmpAktuell(l, _vorlageName(l)).catch(() => z.standard);
    }
  } catch (e) {
    for (const z of zs.values()) z.fehler = e.message;
  } finally {
    _rfLaeuft = false;
    for (const z of zs.values()) z.laeuft = false;
    if (_reklaOrder !== auftrag) _rfNeueBestellung();
    else {
      reklaFotoZeichnen();
      // Während des Laufs angehakt? Dann gleich hinterher — aber nie nach einem Fehler (Schleife).
      const fehlt = _reklaGewaehlt().filter(n => !_reklaErzeugt.has(n));
      if (fehlt.length && [...zs.values()].every(z => !z.fehler)) setTimeout(() => _rfRechnen(fehlt), 0);
    }
  }
}

// ── Alles ausprobieren ───────────────────────────────────────────────────────
async function _rfAllesProbieren(el) {
  const n = _rfName(el), l = _rfLayout(n), z = _rfZustand(n), auftrag = _reklaOrder;
  if (_rfLaeuft || !l) return;
  _rfLaeuft = true;
  Object.assign(z, { laeuft: true, laeuftText: 'Gesichter werden erkannt', fehler: '' });
  reklaFotoZeichnen();
  try {
    let gs = [];
    try { gs = await _rfGesichterErkennen(l); } catch (e) { console.warn('Gesichtserkennung:', e); }
    const liste = _RF_VARIANTEN.filter(v => !v.gesichter || gs.length);
    z.laeuftText = `${liste.length} Versionen werden gerechnet (etwa ${Math.round(10 + liste.length * 3)} s)`;
    reklaFotoZeichnen();
    const varianten = liste.map(v => {
      const vz = _rfVz(v, z);
      return { k: v.k, werte: _rfWerteAus(vz, l), fokus: _rfFokusAus(vz, l) };
    });
    await _rfExportUndWarten([n], { varianten });
    z.probe = liste.map(v => v.k);
    if (!z.standard && !z.als) z.standard = await _rfBmpAktuell(l, 'Varianten/' + _vorlageName(l) + ' standard').catch(() => null);
    if (_reklaOrder === auftrag) _rfVOeffnen('galerie', n);
  } catch (e) {
    z.fehler = e.message;
  } finally {
    _rfLaeuft = false;
    z.laeuft = false;
    reklaFotoZeichnen();
    if (_reklaOrder !== auftrag) _rfNeueBestellung();
  }
}

async function _rfVorschauFuellen(l, i) {
  const ziel = document.getElementById('rf-vorschau-' + i);
  const o = _rfDaten.ordner.find(x => x.ordner === _vorlageName(l));
  if (!ziel || !o || !o.plaetze.length || _rfZustand(l.name).laeuft) return;
  try {
    const bilder = await Promise.all(o.plaetze.map(async p => _rfSimCanvas(await _rfBmpLesen(p.url + '?t=' + Math.round(p.zeit)), _rfDunkelLack(l))));
    ziel.innerHTML = '';
    for (const c of bilder) ziel.appendChild(c);
  } catch (e) {
    ziel.innerHTML = `<div class="rf-leer">Vorschau nicht lesbar</div>`;
  }
}

// 1-Bit-BMP lesen (schwarz = graviert, wie Ezcad es markiert) — je URL einmal; die URL
// trägt die Dateizeit, eine neu erzeugte Datei hat also eine neue.
const _rfBmpCache = new Map();
async function _rfBmpLesen(url) {
  if (_rfBmpCache.has(url)) return _rfBmpCache.get(url);
  if (_rfBmpCache.size > 40) _rfBmpCache.clear();
  const buf = await (await fetch(url, { cache: 'no-store' })).arrayBuffer();
  const dv = new DataView(buf), b = new Uint8Array(buf);
  const off = dv.getUint32(10, true), w = dv.getInt32(18, true), hRoh = dv.getInt32(22, true), h = Math.abs(hRoh);
  if (dv.getUint16(28, true) !== 1) throw new Error('kein 1-Bit-BMP');
  const index0Schwarz = b[54] + b[55] + b[56] < 384;   // Palette, Eintrag 0
  const stride = ((w + 31) >> 5) << 2;
  const ink = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const o = off + (hRoh > 0 ? h - 1 - y : y) * stride;
    for (let x = 0; x < w; x++) {
      const bit = (b[o + (x >> 3)] >> (7 - (x & 7))) & 1;
      ink[y * w + x] = (bit === 0) === index0Schwarz ? 1 : 0;
    }
  }
  const dpi = Math.round(dv.getInt32(38, true) * 0.0254) || 500;   // aus dem BMP-Kopf
  // Datei-DPI-Raster (s. _laserDateiCanvas): alle Punkte auf geraden Pixeln = gerechnet mit halber DPI.
  let raster = 1, an = 0, ungerade = false;
  for (let y = 0; y < h && !ungerade; y++) for (let x = 0; x < w; x++) if (ink[y * w + x]) { an++; if ((x & 1) || (y & 1)) { ungerade = true; break; } }
  if (an > 50 && !ungerade) raster = 2;
  const erg = { ink, w, h, dpi, raster };
  _rfBmpCache.set(url, erg);
  return erg;
}
// Werkstück-Vorschau: örtliche Dichte → Helligkeit am Lack.
// Weiß ab welcher Dichte, je Auflösung: 500 DPI 0,25 (geeicht 08.10.2026), 250 DPI ~0,45 (Graukeil 13.10.2026).
function _rfSaettigung(dpi) {
  return Math.max(_RF_SAETTIGUNG, Math.min(0.5, _RF_SAETTIGUNG + (500 - (dpi || 500)) * 0.2 / 250));
}
function _rfSimCanvas({ ink, w, h, dpi, raster }, dunkelLack) {
  const r = Math.max(1, Math.round(3 * (dpi || 500) / 500));
  // Punktraster in 500er-Datei: ein Punkt je 2×2 Pixel — Dichte je Pixel ist ein Viertel der Zellendichte.
  const satt = raster === 2 ? _rfSaettigung((dpi || 500) / 2) / 4 : _rfSaettigung(dpi);
  const dichte = _rfKasten(_rfKasten(ink, w, h, r), w, h, r);
  return _rfGrauCanvas(w, h, i => {
    const t = Math.min(1, dichte[i] / satt);
    return dunkelLack ? 14 + t * 241 : 236 - t * 206;
  });
}
// Die gravierten Punkte selbst, 1:1 (graviert = hell auf dunklem Lack, dunkel auf hellem).
function _rfPixelCanvas({ ink, w, h }, dunkelLack) {
  const an = dunkelLack ? 255 : 20, aus = dunkelLack ? 0 : 235;
  return _rfGrauCanvas(w, h, i => ink[i] ? an : aus);
}
// Graubild w×h, `wert(i)` = Helligkeit des Pixels i
function _rfGrauCanvas(w, h, wert) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d'), bild = x.createImageData(w, h);
  for (let i = 0; i < w * h; i++) {
    bild.data[i * 4] = bild.data[i * 4 + 1] = bild.data[i * 4 + 2] = wert(i);
    bild.data[i * 4 + 3] = 255;
  }
  x.putImageData(bild, 0, 0);
  return c;
}
// Kastenfilter, Radius r, Ränder fortgesetzt — zweimal hintereinander ≈ Gauß.
function _rfKasten(src, w, h, r) {
  const tmp = new Float32Array(w * h), out = new Float32Array(w * h), n = 2 * r + 1;
  const kx = v => v < 0 ? 0 : v >= w ? w - 1 : v, ky = v => v < 0 ? 0 : v >= h ? h - 1 : v;
  for (let y = 0; y < h; y++) {
    const o = y * w;
    let s = 0;
    for (let x = -r; x <= r; x++) s += src[o + kx(x)];
    for (let x = 0; x < w; x++) { tmp[o + x] = s / n; s += src[o + kx(x + r + 1)] - src[o + kx(x - r)]; }
  }
  for (let x = 0; x < w; x++) {
    let s = 0;
    for (let y = -r; y <= r; y++) s += tmp[ky(y) * w + x];
    for (let y = 0; y < h; y++) { out[y * w + x] = s / n; s += tmp[ky(y + r + 1) * w + x] - tmp[ky(y - r) * w + x]; }
  }
  return out;
}

// ── Große Ansicht: Vergleich mit gemeinsamem Zoom ────────────────────────────
// Zwei Arten, dieselbe Mechanik: „bearbeiten" (vorher | jetzt, rechts die Knöpfe) und
// „galerie" (alle Fassungen aus „Alles ausprobieren"). Alle Felder zeigen denselben
// Ausschnitt: Scrollen in einem scrollt alle, ein Klick zoomt alle an genau diese Stelle.
const _RF_FAKTOREN = [0, 1, 2, 3, 4, 6, 8];   // 0 = ganz sichtbar
let _rfV = null;   // { art, layout, ansicht: 'pixel'|'feuerzeug', faktor, u, v }
let _rfVSync = false;

function _rfVOeffnen(art, n) {
  if (!n) return;
  const alt = _rfV && _rfV.layout === n ? _rfV : null;
  _rfV = {
    art, layout: n,
    ansicht: alt ? alt.ansicht : (art === 'galerie' ? 'feuerzeug' : 'pixel'),
    faktor: alt ? alt.faktor : (art === 'galerie' ? 0 : 1),
    u: alt ? alt.u : 0.5, v: alt ? alt.v : 0.4
  };
  _rfVZeichnen();
}
function _rfVSchliessen() {
  _rfV = null;
  document.getElementById('rf-zoom')?.remove();
}
document.addEventListener('keydown', e => { if (e.key === 'Escape' && _rfV) _rfVSchliessen(); });

// Welche Felder zeigt die Ansicht? { titel, ordner | bmp, k (Variante), laeuft }
function _rfVFelder() {
  const l = _rfLayout(_rfV.layout), z = _rfZustand(_rfV.layout);
  const basis = _vorlageName(l);
  if (_rfV.art === 'galerie') {
    return (z.probe || []).map(k => {
      const v = _RF_VARIANTEN.find(x => x.k === k);
      return v && {
        titel: _rfText(_rfVz(v, z), l), ordner: 'Varianten/' + basis + ' ' + k, k,
        gewaehlt: _rfText(_rfVz(v, z), l) === _rfText(z, l)
      };
    }).filter(Boolean);
  }
  // Links bleibt IMMER der Standard stehen (Wunsch 08.10.) — auch nach dunkler → zurück auf Standard.
  const jetzt = { titel: 'Jetzt: ' + _rfText(z, l), ordner: basis, laeuft: _rfLaeuft && z.laeuft };
  return z.standard ? [{ titel: 'Standard', bmp: z.standard }, jetzt] : [jetzt];
}

function _rfVZeichnen() {
  if (!_rfV) return;
  const l = _rfLayout(_rfV.layout);
  if (!l) return _rfVSchliessen();
  let box = document.getElementById('rf-zoom');
  if (!box) {
    box = document.createElement('div');
    box.id = 'rf-zoom';
    box.className = 'rf-zoom';
    document.body.appendChild(box);
  }
  box.dataset.layout = l.name;
  const z = _rfZustand(l.name), foto = _rfFoto(l), felder = _rfVFelder();
  const galerie = _rfV.art === 'galerie';
  const f = _rfV.faktor;
  const kopf = `<div class="rf-zoom-kopf">
      ${foto ? `<img class="rf-kopf-foto" src="${_esc(foto.url)}" alt="" title="Kundenfoto"/>` : ''}
      <div style="margin-right:auto;min-width:0;">
        <b class="u11">${galerie ? 'Alle Versionen' : 'Ansehen & nachbessern'} · ${_esc(l.name)}</b>
        <div class="umut10">${galerie ? 'Ins Bild klicken = näher ran (alle gleichzeitig). Passende Version: „Diese nehmen".'
      : 'Ins Bild klicken = näher ran. Links der Standard, rechts jetzt — derselbe Ausschnitt.'}</div>
      </div>
      <div class="rf-segment">
        <button class="${_rfV.ansicht === 'pixel' ? 'an' : ''}" onclick="_rfV.ansicht='pixel';_rfVZeichnen()">Pixel</button>
        <button class="${_rfV.ansicht === 'feuerzeug' ? 'an' : ''}" onclick="_rfV.ansicht='feuerzeug';_rfVZeichnen()">am Feuerzeug</button>
      </div>
      <div class="rf-segment">
        <button onclick="_rfVZoom(-1)" title="weiter weg">−</button>
        <span id="rf-v-faktor">${f ? f + '×' : 'ganz'}</span>
        <button onclick="_rfVZoom(1)" title="näher ran">+</button>
      </div>
      ${galerie ? `<button class="btn" onclick="_rfAlleVariantenLaden()" title="Alle Versionen als ZIP herunterladen">⬇ Alle herunterladen</button>
      <button class="btn" data-layout="${_esc(l.name)}" onclick="_rfVOeffnen('bearbeiten', this.dataset.layout)">← zurück</button>` : ''}
      <button class="btn" onclick="_rfVSchliessen()" title="Schließen (Esc)">✕</button>
    </div>`;
  const feld = (x, i) => `
      <div class="rf-feld${x.gewaehlt ? ' rf-feld-an' : ''}">
        <div class="rf-feld-titel">${_esc(x.titel)}</div>
        <div class="rf-feld-bild" id="rf-feld-${i}" data-i="${i}"><div class="umut10" style="padding:12px;">${x.laeuft ? '⏳ wird neu erzeugt …' : 'Lädt …'}</div></div>
        ${galerie ? `<div class="rf-feld-knoepfe">
          <button class="btn btn-accent"${_rfLaeuft ? ' disabled' : ''} onclick="_rfWaehlen('${_esc(x.k)}')">✓ Diese nehmen</button>
          <button class="btn" onclick="_rfVarianteLaden('${_esc(x.k)}')" title="Nur diese Version herunterladen">⬇</button>
        </div>` : ''}
      </div>`;
  const hinweis = !galerie && !z.standard
    ? '<div class="rf-feld rf-feld-hinweis"><div class="umut10">Hier steht links der Standard neben „jetzt", sobald er einmal erzeugt ist.</div></div>' : '';
  box.innerHTML = kopf + `<div class="rf-zoom-rumpf">
      <div class="rf-felder ${galerie ? 'rf-felder-galerie' : ''}">${felder.map(feld).join('')}${hinweis}</div>
      ${galerie ? '' : `<div class="rf-seite" data-layout="${_esc(l.name)}">${_rfArtZeile(z)}${_rfSteuerung(l)}</div>`}
    </div>`;
  felder.forEach((x, i) => _rfVFeldFuellen(x, i, l));
}

async function _rfVFeldFuellen(x, i, l) {
  const ziel = document.getElementById('rf-feld-' + i);
  if (!ziel || x.laeuft) return;
  try {
    let b = x.bmp;
    if (!b) {
      const o = _rfDaten.ordner.find(y => y.ordner === x.ordner);
      if (!o || !o.plaetze.length) throw new Error('noch keine Datei');
      b = await _rfBmpLesen(o.plaetze[0].url + '?t=' + Math.round(o.plaetze[0].zeit));
    }
    const c = _rfV.ansicht === 'pixel' ? _rfPixelCanvas(b, _rfDunkelLack(l)) : _rfSimCanvas(b, _rfDunkelLack(l));
    c.dataset.w = b.w; c.dataset.h = b.h;
    c.addEventListener('click', ev => _rfVKlick(ev, c));
    ziel.innerHTML = '';
    ziel.appendChild(c);
    ziel.onscroll = () => _rfVScroll(ziel);
    _rfVGroesse(ziel);
  } catch (e) {
    ziel.innerHTML = `<div class="umut10" style="padding:12px;">${_esc(e.message)}</div>`;
  }
}
// Größe eines Felds nach Faktor setzen und auf den gemeinsamen Ausschnitt (u, v) scrollen.
function _rfVGroesse(ziel) {
  const c = ziel.querySelector('canvas');
  if (!c || !_rfV) return;
  const w = +c.dataset.w, h = +c.dataset.h;
  const f = _rfV.faktor || Math.min(ziel.clientWidth / w, ziel.clientHeight / h);
  c.style.width = Math.max(1, Math.round(w * f)) + 'px';
  c.style.height = Math.max(1, Math.round(h * f)) + 'px';
  _rfVSync = true;
  ziel.scrollLeft = _rfV.u * c.offsetWidth - ziel.clientWidth / 2;
  ziel.scrollTop = _rfV.v * c.offsetHeight - ziel.clientHeight / 2;
  requestAnimationFrame(() => { _rfVSync = false; });
}
function _rfVAlleGroessen() {
  document.querySelectorAll('#rf-zoom .rf-feld-bild').forEach(_rfVGroesse);
  const s = document.getElementById('rf-v-faktor');
  if (s) s.textContent = _rfV.faktor ? _rfV.faktor + '×' : 'ganz';
}
function _rfVScroll(ziel) {
  if (_rfVSync || !_rfV) return;
  const c = ziel.querySelector('canvas');
  if (!c || !c.offsetWidth) return;
  _rfV.u = (ziel.scrollLeft + ziel.clientWidth / 2) / c.offsetWidth;
  _rfV.v = (ziel.scrollTop + ziel.clientHeight / 2) / c.offsetHeight;
  _rfVSync = true;
  document.querySelectorAll('#rf-zoom .rf-feld-bild').forEach(a => {
    if (a === ziel) return;
    a.scrollLeft = ziel.scrollLeft; a.scrollTop = ziel.scrollTop;
  });
  requestAnimationFrame(() => { _rfVSync = false; });
}
function _rfVKlick(ev, c) {
  const r = c.getBoundingClientRect();
  _rfV.u = (ev.clientX - r.left) / r.width;
  _rfV.v = (ev.clientY - r.top) / r.height;
  _rfVZoom(1);
}
function _rfVZoom(d) {
  const i = _RF_FAKTOREN.indexOf(_rfV.faktor);
  _rfV.faktor = _RF_FAKTOREN[Math.max(0, Math.min(_RF_FAKTOREN.length - 1, (i < 0 ? 0 : i) + d))];
  _rfVAlleGroessen();
}
// Aktuelles BMP (Platz 1) eines Ordners dekodiert holen.
async function _rfBmpAktuell(l, ordner) {
  const o = _rfDaten.ordner.find(x => x.ordner === ordner);
  if (!o || !o.plaetze.length) return null;
  return _rfBmpLesen(o.plaetze[0].url + '?t=' + Math.round(o.plaetze[0].zeit));
}
// ── Herunterladen auf diesen Rechner ─────────────────────────────────────────
const _rfDateiname = t => String(t).replace(/[^\wäöüÄÖÜß.-]+/g, '_').replace(/^_+|_+$/g, '');
function _rfSpeichern(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
async function _rfZip(eintraege, name) {   // eintraege: [{ url, name }]
  await _ensureJSZip();
  const zip = new JSZip();
  for (const e of eintraege) {
    const u = e.url.startsWith('http') ? e.url : `${BASE_URL}${e.url.startsWith('/') ? '' : '/'}${e.url}`;
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const r = await fetch(u, { headers, credentials: 'include', cache: 'no-store' });
    // Fehlerantwort nicht ins ZIP — sonst läge eine HTML-Seite als .bmp darin, ohne Meldung.
    if (!r.ok) throw new Error(`${e.name}: HTTP ${r.status}`);
    zip.file(e.name, await r.blob());
  }
  _rfSpeichern(await zip.generateAsync({ type: 'blob' }), name);
}
// ── ③ Text- und PDF-Gravur prüfen ─────────────────────────────────────────────
// Bei Text (DXF) und PDF waren die Fehler der letzten Wochen Programmfehler für alle
// Bestellungen (falsche Schrift, leere Umlaute, Zeile vertauscht, Deckeltext verrutscht) —
// dagegen hilft kein Knopf je Bestellung, aber eine Vorschau: links, was der Kunde bei Amazon
// eingegeben hat, rechts die gezeichnete Gravurdatei. Dazu die Hinweise des Laufs (status.txt:
// Ersatzschrift, stark gestauchter Text — s. _exportHinweise).
function _rtIstText(l) { return !!l && /dxf|pdf/.test(l.exportFormat || ''); }
// Was der Kunde zu den Artikeln dieses Layouts geschrieben hat
const _rtArtikel = l => (_reklaOrder?.artikel || []).filter(a => _asinLayouts(_asinNorm(a.asin), [l]).length);
function _rtLayouts() {
  const an = new Set(_reklaGewaehlt());
  // Foto-Layout mit DXF (V7: Rückseite im selben Layout): die Text-Karte nur, wenn der Kunde Text
  // geschrieben hat oder eine Gravurdatei da ist — sonst stand eine zweite, leere Karte unter dem Foto.
  return _reklaLayoutsAlle.filter(l => an.has(l.name) && _rtIstText(l)
    && (!_rfIstFoto(l) || _rtArtikel(l).some(a => (a.texte || []).length) || _rtDateien(l).length));
}
// Die Gravurdateien eines Layouts in diesem Reklamations-Ordner (ohne gravurN.dxf je Platz —
// bei einer einzelnen Bestellung steht in gravur.dxf dasselbe).
function _rtDateien(l) {
  const alle = (_rfDaten.alle || []).filter(f => (f.groesse || 0) > 600 && /\.(dxf|pdf)$/i.test(f.name));
  if (_istVorlageLayout(l)) {
    const vor = _vorlageName(l) + '/';
    return alle.filter(f => f.name.startsWith(vor) && !/\/gravur\d+\.dxf$/i.test(f.name));
  }
  const name = l.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Namen wie _fileGroup: <Layout>[_<Nr7>|_Satz<n>][_Blatt<n>|_Seite<n>][_2 …].dxf
  const re = new RegExp('^' + name + '(_\\d+|_Satz\\d+)?(_Blatt\\d+|_Seite\\d+)?(_\\d+)?\\.(dxf|pdf)$', 'i');
  return alle.filter(f => re.test(f.name));
}
function _rtKarte(l, i) {
  const artikel = _rtArtikel(l);
  const texte = artikel.flatMap(a => a.texte || []);
  const schriften = [...new Set(artikel.flatMap(a => a.schriften || []))];
  const dateien = _rtDateien(l);
  const hinweise = (_rfDaten.hinweise || []).filter(h => h.startsWith(l.name + ': ')).map(h => h.slice(l.name.length + 2));
  const laeuft = _rfLaeuft && !_reklaErzeugt.has(l.name);
  // Foto-Druck (PDF mit Bildfeld, z. B. „Schlüsselanhänger neu"): links das Kundenfoto statt
  // des Textes — im PDF steht nur das Foto.
  const fotoDruck = /pdf/.test(l.exportFormat) && !/dxf/.test(l.exportFormat) && _layoutHat(l, f => f.type === 'image');
  const foto = fotoDruck ? _rfFoto(l) : null;
  return `
    <div class="rf-karte" data-layout="${_esc(l.name)}">
      <div class="rf-titel"><b class="u11">${_esc(l.name)}</b><span class="rf-stand">${_esc(/pdf/.test(l.exportFormat) && !/dxf/.test(l.exportFormat) ? 'PDF' : 'Text')}</span></div>
      ${fotoDruck ? `<div class="rf-unter">Kundenfoto</div>
      <div class="rt-bild rt-foto">${foto ? `<img src="${_esc(foto.url)}" alt="Kundenfoto"/>` : '<span class="umut10">kein Foto</span>'}</div>` : `<div class="rf-unter">Kunde hat geschrieben</div>
      <div class="rt-kunde">${texte.length ? texte.map(t => `<div><span class="umut10">${_esc(t.feld || 'Text')}:</span> ${t.wert.trim() ? `<b>${_esc(t.wert)}</b>` : '<span class="umut10">(leer)</span>'}</div>`).join('')
      : '<span class="umut10">kein Text — nur Foto/Auswahl</span>'}
        ${schriften.length ? `<div class="umut10" style="margin-top:3px;">Schrift: ${schriften.map(_esc).join(', ')}</div>` : ''}
      </div>`}
      <div class="rf-unter">Wird graviert</div>
      <div class="rt-vorschau">${laeuft ? '<div class="rf-leer rt-leer">⏳ wird erzeugt …</div>'
      : dateien.length ? dateien.map((f, j) => `<div class="rt-datei" onclick="this.classList.toggle('rt-gross')" title="Antippen: größer / kleiner">
              <div class="rt-bild" id="rt-${i}-${j}"></div><div class="umut10">${_esc(f.name.split('/').pop())}</div></div>`).join('')
        : '<div class="rf-leer rt-leer">keine Gravurdatei — für diese Bestellung kein Text</div>'}</div>
      ${hinweise.map(h => `<div class="rt-hinweis">⚠ ${_esc(h)}</div>`).join('')}
    </div>`;
}
function _rtVorschauFuellen(l, i) {
  if (_rfLaeuft && !_reklaErzeugt.has(l.name)) return;
  _rtDateien(l).forEach(async (f, j) => {
    const ziel = document.getElementById(`rt-${i}-${j}`);
    if (!ziel) return;
    try {
      if (/\.pdf$/i.test(f.name)) {
        const im = new Image();
        im.src = `${BASE_URL}/v2/rekla/pdfbild?orderId=${encodeURIComponent(_reklaOrder.orderId)}&quelle=vorschau&datei=${encodeURIComponent(f.name)}&t=${f.groesse}`;
        await im.decode();
        ziel.appendChild(_rtPdfAusschnitt(im));
      } else {
        ziel.appendChild(_rtDxfCanvas(await _rtDxfLesen(f.url, f.groesse)));
      }
    } catch (e) { ziel.innerHTML = `<div class="umut10">${_esc(e.message)}</div>`; }
  });
}
// Das PDF ist das ganze Druckblatt (Beschriftungen „Viereck/Herz/Rund", Bestellnummer) — das
// Foto darauf wäre winzig. Ausschnitt = die dicht bedruckten Kacheln: Fotos ja, dünne
// Schrift nein (Kachel ≈ 5 mm, > 60 % bedruckt). Ohne solche Kacheln das ganze Blatt.
function _rtPdfAusschnitt(im) {
  const w = im.naturalWidth, h = im.naturalHeight;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0);
  // Kachel ≈ 5 mm: eine Schriftzeile füllt sie nie zur Hälfte, ein Foto immer ganz.
  const d = x.getImageData(0, 0, w, h).data, K = Math.max(8, Math.round(w / 40));
  let x0 = Infinity, y0 = Infinity, x1 = -1, y1 = -1;
  for (let ky = 0; ky + K <= h; ky += K) for (let kx = 0; kx + K <= w; kx += K) {
    let n = 0;
    for (let y = ky; y < ky + K; y++) for (let xx = kx; xx < kx + K; xx++) {
      const i = (y * w + xx) * 4;
      if (d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114 < 235) n++;
    }
    if (n > K * K * 0.6) { x0 = Math.min(x0, kx); y0 = Math.min(y0, ky); x1 = Math.max(x1, kx + K); y1 = Math.max(y1, ky + K); }
  }
  if (x1 < 0) return c;
  const r = Math.round(Math.max(x1 - x0, y1 - y0) * 0.08);
  x0 = Math.max(0, x0 - r); y0 = Math.max(0, y0 - r); x1 = Math.min(w, x1 + r); y1 = Math.min(h, y1 + r);
  const a = document.createElement('canvas');
  a.width = x1 - x0; a.height = y1 - y0;
  a.getContext('2d').drawImage(c, x0, y0, a.width, a.height, 0, 0, a.width, a.height);
  return a;
}
// DXF R12 lesen, wie wir sie schreiben: POLYLINE/VERTEX/SEQEND (Buchstaben-Konturen), in
// ENTITIES oder in einem BLOCK, der bei 0,0 eingefügt wird (s. TextAsBlock). Ebene „Bild" =
// Rahmen, wird nicht graviert.
const _rtDxfCache = new Map();
async function _rtDxfLesen(url, groesse) {
  const schluessel = url + '|' + groesse;
  if (_rtDxfCache.has(schluessel)) return _rtDxfCache.get(schluessel);
  const z = (await (await fetch(url, { cache: 'no-store' })).text()).split(/\r?\n/);
  const pfade = [];
  let akt = null, vertex = false, vx = null, vy = null;
  const vertexEnde = () => { if (vertex && akt && vx !== null && vy !== null) akt.pts.push([vx, vy]); vertex = false; vx = vy = null; };
  for (let i = 0; i + 1 < z.length; i += 2) {
    const c = z[i].trim(), w = z[i + 1].trim();
    if (c === '0') {
      vertexEnde();
      if (w === 'POLYLINE') { akt = { ebene: '', pts: [] }; pfade.push(akt); }
      else if (w === 'VERTEX') vertex = !!akt;
      else if (w === 'SEQEND') akt = null;
      continue;
    }
    if (vertex) { if (c === '10') vx = parseFloat(w); else if (c === '20') vy = parseFloat(w); }
    else if (akt && c === '8') akt.ebene = w;
  }
  vertexEnde();
  const erg = pfade.filter(p => p.pts.length > 1);
  if (_rtDxfCache.size > 30) _rtDxfCache.clear();
  _rtDxfCache.set(schluessel, erg);
  return erg;
}
function _rtDxfCanvas(pfade) {
  const gravur = pfade.filter(p => !/^bild$/i.test(p.ebene));
  const basis = gravur.length ? gravur : pfade;
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of basis) for (const [x, y] of p.pts) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  const c = document.createElement('canvas');
  if (!isFinite(x0)) { c.width = 10; c.height = 10; return c; }
  const bw = Math.max(1, x1 - x0), bh = Math.max(1, y1 - y0), rand = Math.max(bw, bh) * 0.06;
  const W = 900, s = (W - 2 * 4) / (bw + 2 * rand), H = Math.min(1400, Math.max(60, Math.round((bh + 2 * rand) * s)));
  c.width = W; c.height = H;
  const x = c.getContext('2d');
  x.fillStyle = '#f4f1ea'; x.fillRect(0, 0, W, H);
  const P = (px, py) => [4 + (px - x0 + rand) * s, H / 2 - (py - (y0 + y1) / 2) * s];
  // Rahmen (Ebene Bild) gestrichelt — zeigt die Gravurfläche, wird nicht graviert
  x.setLineDash([6, 5]); x.strokeStyle = '#9a958c'; x.lineWidth = 1.5;
  for (const p of pfade.filter(q => /^bild$/i.test(q.ebene))) {
    x.beginPath(); p.pts.forEach(([px, py], k) => { const [a, b] = P(px, py); k ? x.lineTo(a, b) : x.moveTo(a, b); }); x.closePath(); x.stroke();
  }
  x.setLineDash([]);
  // Buchstaben: alle Konturen EIN Pfad, gerade/ungerade gefüllt — Innenräume (o, a, e) bleiben frei
  x.beginPath();
  for (const p of gravur) p.pts.forEach(([px, py], k) => { const [a, b] = P(px, py); k ? x.lineTo(a, b) : x.moveTo(a, b); });
  x.fillStyle = '#16140f';
  x.fill('evenodd');
  return c;
}

// ── Abschluss: fertige Dateien herunterladen / in die Vorlage legen ──────────
let _reklaAbschlussText = '';
function _reklaAbschlussZeichnen() {
  const box = document.getElementById('rekla-abschluss');
  if (!box) return;
  if (!_reklaOrder) { box.innerHTML = ''; _reklaAbschlussText = ''; return; }
  const an = new Set(_reklaGewaehlt()), aus = _rfLaeuft ? ' disabled' : '';
  const nr = (_rfLayouts().length || _rtLayouts().length) ? '④' : '③';
  // Ein Knopf je Vorlage-ORDNER: V5 und V5_Text schreiben in denselben (Foto + Deckeltext).
  const gesehen = new Set();
  const vorlagen = _reklaLayoutsAlle.filter(l => an.has(l.name) && _istVorlageLayout(l))
    .filter(l => _reklaOrdner.ordner.some(o => o.ordner === _vorlageName(l) && o.vorlage))
    .filter(l => !gesehen.has(_vorlageName(l)) && gesehen.add(_vorlageName(l)));
  const n = (_reklaOrdner.alle || []).length;               // Dateien im ECHTEN Ordner
  const aktuell = n && _reklaErstelltStand === _reklaStand();
  let html = `<div class="rk-schritt">${nr} Speichern &amp; herunterladen</div>`;
  // Erst bestätigen: der Ordner auf dem Netzlaufwerk entsteht nur mit diesem Knopf (09.10.).
  if (!n || !aktuell) {
    const vorschauFertig = !_rfLaeuft && _reklaGewaehlt().every(x => _reklaErzeugt.has(x));
    // Läuft „Erstellen" oder ist es gescheitert, steht DAS hier — sonst sagte die Zeile während des
    // Erstellens „Vorschau wird noch erzeugt", und ein Fehler beim ersten Erstellen blieb unsichtbar.
    const hinweis = _reklaErstellenText || (n ? '⚠ Im Ordner liegt noch der vorige Stand — erst übernehmen, dann gravieren.'
      : vorschauFertig ? 'Legt den Ordner für diese Reklamation auf dem Netzlaufwerk an.' : 'Vorschau wird noch erzeugt — Erstellen geht trotzdem schon.');
    html += `<button class="btn btn-full btn-accent rf-abschluss-knopf rk-erstellen"${_rfLaeuft || !_reklaGewaehlt().length ? ' disabled' : ''} onclick="_reklaErstellen()">✅ ${n ? 'Änderungen übernehmen' : 'Reklamation erstellen'}</button>`
      + `<div class="umut10" style="margin:-2px 0 8px;line-height:1.5;">${hinweis}</div>`;
  }
  // WO die Dateien liegen — ohne diese Zeile wusste niemand, dass der Reklamations-Ordner beim
  // Laden schon angelegt ist (09.10.: „gibt es nicht die Option, den Ordner zu erstellen?").
  if (n) {
    const ordner = `Z:\\exports\\${_dayBerlin()} Reklamation\\${_reklaName()}`;
    const namen = [...new Set((_reklaOrdner.alle || []).map(f => f.name.split('/')[0]))];
    html += `<div class="rk-ordner">✅ Liegt im Reklamations-Ordner:<div class="rk-pfad">${_esc(ordner)}</div>`
      + `<div class="umut10">${namen.map(_esc).join(' · ')}</div>`
      + `<button class="btn btn-xs" onclick="_reklaPfadKopieren(this, '${_jsStr(ordner)}')">📋 Pfad kopieren</button></div>`;
  }
  if (aktuell) html += vorlagen.map(l => `<button class="btn btn-full btn-accent rf-abschluss-knopf"${aus} data-layout="${_esc(l.name)}" onclick="_rfVorlage(this)">📥 In Vorlage ${_esc(_vorlageName(l))} legen</button>`).join('')
    + (n ? `<button class="btn btn-full rf-abschluss-knopf"${aus} onclick="_reklaDateienLaden()" title="Alle erzeugten Dateien dieser Reklamation als ZIP auf diesen Rechner">⬇ Dateien herunterladen</button>` : '')
    + (_reklaAbschlussText ? `<div class="umut10" style="margin-bottom:8px;line-height:1.5;">${_reklaAbschlussText}</div>` : '');
  // ⑤ Ergebnis erst, wenn wirklich graviert werden kann — vorher verleitet es zu frühen Klicks.
  const fotos = _rfLayouts();
  if (_reklaGraviert && fotos.length) {
    html += `<div class="rk-schritt">${nr === '④' ? '⑤' : '④'} Ergebnis — wie ist es geworden?</div>`
      + fotos.map(l => {
        const z = _rfZustand(l.name);
        return `<div class="rf-zeile" data-layout="${_esc(l.name)}" style="margin-bottom:6px;">
          <span class="umut10" style="flex:1;">${fotos.length > 1 ? _esc(l.name) : 'Nach dem Gravieren:'}</span>
          ${z.urteil ? `<span class="umut10" style="color:var(--green);">✓ ${z.urteil === 'gut' ? 'gut' : 'schlecht'} notiert</span>`
            : `<button class="btn"${aus} onclick="_rfUrteil(this, true)">👍 gut</button>
                        <button class="btn"${aus} onclick="_rfUrteil(this, false)">👎 schlecht</button>`}
        </div>`;
      }).join('');
  }
  box.innerHTML = html;
}
async function _reklaPfadKopieren(el, pfad) {
  try { await navigator.clipboard.writeText(pfad); el.textContent = '✓ kopiert'; }
  catch (_) { el.textContent = 'Kopieren nicht erlaubt — Pfad bitte markieren'; }
  setTimeout(() => { el.textContent = '📋 Pfad kopieren'; }, 2500);
}
async function _reklaDateienLaden() {
  try {
    await _rfZip(_reklaOrdner.alle || [], _rfDateiname(`Reklamation_${_reklaName()}`) + '.zip');
    _reklaGraviert = true; _reklaAbschlussZeichnen();
  } catch (e) { _reklaAbschlussText = `<span style="color:var(--red);">❌ Herunterladen fehlgeschlagen: ${_esc(e.message)}</span>`; _reklaAbschlussZeichnen(); }
}
async function _rfDatenLaden() {
  if (!_reklaOrder) return;
  const id = encodeURIComponent(_reklaOrder.orderId);
  _rfDaten = _rfNormalize(await _apiJson(`/v2/rekla/bilder?orderId=${id}&quelle=vorschau`).catch(() => _rfDaten));
  _reklaOrdner = _rfNormalize(await _apiJson(`/v2/rekla/bilder?orderId=${id}`).catch(() => _reklaOrdner));
  _reklaAbschlussZeichnen();
}
// „✅ Reklamation erstellen": die angehakten Layouts mit den jetzigen Einstellungen in den
// Reklamations-Ordner — erst jetzt entsteht er (samt Kundendaten) auf dem Netzlaufwerk.
let _reklaOrdner = { status: 0, ordner: [], alle: [] };   // der echte Ordner (nach Bestätigung)
let _reklaErstelltStand = null;                           // Einstellungen beim letzten Erstellen
let _reklaErstellenText = '';                             // ⏳ während des Erstellens, ❌ wenn es scheiterte
const _reklaStand = () => { const n = _reklaGewaehlt(); return JSON.stringify({ n, x: _rfExportExtras(n) }); };
async function _reklaErstellen() {
  const namen = _reklaGewaehlt();
  if (!_reklaOrder || !namen.length || _rfLaeuft) return;
  const auftrag = _reklaOrder;
  _rfLaeuft = true;
  _reklaErstellenText = '⏳ Reklamation wird erstellt …';
  reklaFotoZeichnen();
  try {
    await _rfExportUndWarten(namen, _rfExportExtras(namen), true);
    _reklaErstelltStand = _reklaStand();
    _reklaErstellenText = _reklaAbschlussText = '';
  } catch (e) {
    // Inzwischen andere Bestellung geladen: die Meldung gehört nicht zu ihr.
    if (_reklaOrder === auftrag) _reklaErstellenText = `<span style="color:var(--red);">❌ Nicht erstellt: ${_esc(e.message)}</span>`;
  } finally {
    _rfLaeuft = false;
    reklaFotoZeichnen();
    if (_reklaOrder !== auftrag) _rfNeueBestellung();
  }
}
// Galerie: nur diese Fassung (das Bitmap selbst) bzw. alle als ZIP.
async function _rfVarianteLaden(k) {
  const l = _rfLayout(_rfV?.layout), v = _RF_VARIANTEN.find(x => x.k === k);
  const o = l && v && _rfDaten.ordner.find(x => x.ordner === 'Varianten/' + _vorlageName(l) + ' ' + k);
  if (!o) return;
  const u = o.plaetze[0].url.startsWith('http') ? o.plaetze[0].url : `${BASE_URL}${o.plaetze[0].url.startsWith('/') ? '' : '/'}${o.plaetze[0].url}`;
  const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const r = await fetch(u, { headers, credentials: 'include', cache: 'no-store' });
  if (!r.ok) return showToast('❌ Herunterladen fehlgeschlagen: HTTP ' + r.status, 4000);
  const blob = await r.blob();
  _rfSpeichern(blob, _rfDateiname(`${_reklaName()}_${l.name}_${_rfText(_rfVz(v, _rfZustand(l.name)), l)}`) + '.bmp');
}
async function _rfAlleVariantenLaden() {
  const l = _rfLayout(_rfV?.layout), z = l && _rfZustand(l.name);
  if (!l) return;
  const eintraege = (z.probe || []).map(k => {
    const v = _RF_VARIANTEN.find(x => x.k === k), o = _rfDaten.ordner.find(x => x.ordner === 'Varianten/' + _vorlageName(l) + ' ' + k);
    return v && o && { url: o.plaetze[0].url, name: _rfDateiname(_rfText(_rfVz(v, z), l)) + '.bmp' };
  }).filter(Boolean);
  try { await _rfZip(eintraege, _rfDateiname(`${_reklaName()}_${l.name}_alle_Versionen`) + '.zip'); }
  catch (e) { showToast('❌ Herunterladen fehlgeschlagen: ' + e.message, 4000); }
}

function _rfWaehlen(k) {
  if (_rfLaeuft) return;   // während eines Laufs nichts ändern — sonst passen Anzeige und Datei nicht zusammen
  const n = _rfV?.layout, v = _RF_VARIANTEN.find(x => x.k === k), z = n && _rfZustand(n);
  if (!v || !z) return;
  Object.assign(z, _rfVz(v, z), { urteil: '', vorlageOk: false });
  _rfVOeffnen('bearbeiten', n);   // gleich weiter: vorher | jetzt, gleicher Ausschnitt
  _rfRechnen([n]);                 // die gewählte Fassung als echte Datei (mit .bat für „In Vorlage legen")
}

async function _rfUrteil(el, gut) {
  const n = _rfName(el), z = _rfZustand(n);
  try {
    await _apiJson('/v2/rekla/urteil', 'POST', {
      orderId: _reklaOrder.orderId, layout: n, stufe: z.stufe, kanten: z.kanten,
      sprenkel: z.sprenkel, gesicht: z.gesicht, als: z.als || '', erkannt: z.erkannt?.art || '',
      urteil: gut ? 'gut' : 'schlecht'
    });
    z.urteil = gut ? 'gut' : 'schlecht'; z.fehler = '';
  } catch (e) { z.fehler = 'Urteil nicht gespeichert: ' + e.message; }
  reklaFotoZeichnen();
}

async function _rfVorlage(el) {
  const n = _rfName(el), l = _rfLayout(n);
  const o = l && _reklaOrdner.ordner.find(x => x.ordner === _vorlageName(l));
  if (!o) return;
  // Was liegt dort gerade? Ein noch nicht gravierter Tageslauf wäre sonst still ersetzt.
  let jetzt = '', warnung = '';
  try {
    const u = await _apiJson('/v2/vorlage/uebersicht');
    const v = (u.ordner || []).find(x => x.ordner === _vorlageName(l));
    if (v) {
      const st = v.stand || {};
      const heute = _dayBerlin();
      const was = /Reklamation/.test(st.pfad || '') ? `eine Reklamation (${String(st.pfad).split('/')[1] || ''})`
        : st.quelle === 'lauf' ? `der Tageslauf vom ${st.tag === heute ? 'HEUTE' : st.tag || '?'}`
          : st.tag ? `der Stand vom ${st.tag}` : 'ein älterer Stand';
      jetzt = `Dort liegt gerade ${was} — ${v.belegt} von ${v.plaetze} Plätzen belegt.`;
      if (st.quelle === 'lauf' && st.tag === heute && v.belegt > 0) warnung = '\n\n⚠ Ist der Tageslauf schon graviert? Sonst ERST den Tageslauf gravieren!';
    }
  } catch (_) { }
  const ok = await confirmModal('In die Vorlage legen?',
    `Der Vorlage-Ordner „${_vorlageName(l)}" bekommt diese Reklamation (${_reklaName()}). `
    + (jetzt ? jetzt + ' ' : '') + 'Das wird ersetzt — über „Tag laden" lässt es sich zurückholen.' + warnung,
    'In Vorlage legen');
  if (!ok) return;
  try {
    await _apiJson('/v2/vorlage/laden', 'POST', { pfad: o.pfad });
    _reklaAbschlussText = `<span style="color:var(--green);">✅ Liegt in der Vorlage ${_esc(_vorlageName(l))} — in Ezcad die .ezd neu öffnen und gravieren.</span>`;
    _reklaGraviert = true;
  } catch (e) { _reklaAbschlussText = `<span style="color:var(--red);">❌ Nicht in die Vorlage gelegt: ${_esc(e.message)}</span>`; }
  _reklaAbschlussZeichnen();
}

async function downloadAndLoad() {
  const btn = document.getElementById('dl-btn');
  try {
    const status = document.getElementById('dl-status')?.value || 'Unshipped';
    const preset = document.getElementById('dl-preset').value;

    // Zeitfenster NICHT im Browser rechnen (lokales Datum + 'Z' ließ „Heute" real um
    // 02:00 Berlin beginnen). Nur das Preset senden — der Server rechnet Berlin-korrekt.
    let url = `${BASE_URL}/v2/start-cron/24?status=${encodeURIComponent(status)}&preset=${encodeURIComponent(preset)}`;
    if (preset === 'custom') {
      const from = document.getElementById('dl-from').value;
      const to = document.getElementById('dl-to').value;
      // Uhrzeiten optional: leer lässt der Server den ganzen Tag stehen (s. time-range.js)
      const fromClock = document.getElementById('dl-from-time')?.value || '';
      const toClock = document.getElementById('dl-to-time')?.value || '';
      if (from) url += '&from=' + encodeURIComponent(from);
      if (to) url += '&to=' + encodeURIComponent(to);
      if (fromClock) url += '&fromClock=' + encodeURIComponent(fromClock);
      if (toClock) url += '&toClock=' + encodeURIComponent(toClock);
    }
    // „Erneut laden erzwingen": Dedup-Vorfilter aus. Ohne das kommt eine einmal geladene
    // Bestellung NIE wieder — auch nicht nach dem Löschen ihres Ordners (die ID bleibt
    // im Ledger processed-orders.json stehen).
    if (document.getElementById('dl-force')?.checked) url += '&force=1';

    await _startDlRun(url);
  } catch (e) {
    // If Amazon not reachable, just load locally
    document.getElementById('dl-msg').textContent = 'Lade lokal gespeicherte Bestellungen…';
    await loadOrders();
    await loadSession();
    // Session-Info-Box aktualisieren
    _paintDatePreset();
    btn.disabled = false;
    btn.textContent = 'Bestellungen laden'; // wie im HTML (s. _stopDlPoll)
  }
}

async function cancelDownload() {
  // OK-Label ≠ "Abbrechen": so heißt schon der Abbrechen-Knopf des Dialogs.
  const ok = await confirmModal('Download abbrechen?', 'Bereits geladene Bestellungen bleiben gespeichert.', 'Ja, stoppen');
  if (!ok) return;
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    await fetch(BASE_URL + '/v2/cancel-download', { method: 'POST', headers, credentials: 'include' });
    showToast('⏹ Download wird gestoppt…');
  } catch (e) { showToast('❌ ' + e.message, 3000); }
}

// Poll-Abbruch-Helfer: Interval stoppen + Button wieder freigeben
function _stopDlPoll(message, color) {
  clearInterval(dlInterval);
  _dlPollErrors = 0;
  const bar = document.getElementById('dl-bar');
  const msg = document.getElementById('dl-msg');
  if (bar) { bar.style.width = '100%'; bar.style.background = color || 'var(--red)'; }
  if (msg) msg.textContent = message;
  const btn = document.getElementById('dl-btn');
  // Gleiche Beschriftung wie im HTML, damit der Knopf nicht dauerhaft umspringt.
  if (btn) { btn.disabled = false; btn.textContent = 'Bestellungen laden'; }
}

let _dlPollErrors = 0;
async function pollDlProgress() {
  let data;
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/v2/progress`, { headers, credentials: 'include' });
    data = await res.json();
    _dlPollErrors = 0;
  } catch (e) {
    // Server nicht erreichbar (z.B. Neustart): nach ~30 s aufgeben, sonst bleibt der
    // Knopf dauerhaft auf "Läuft…" gesperrt.
    if (++_dlPollErrors >= 20) {
      _stopDlPoll('❌ Verbindung zum Server verloren — Status unbekannt. Seite neu laden.');
    }
    return;
  }
  try {
    // Server wurde mitten im Download neu gestartet: das Progress-Objekt ist dann frisch
    // (running=false, phase='') und keiner der Phasen-Zweige unten würde je greifen.
    if (!data.running && !data.phase) {
      _stopDlPoll('⚠️ Server wurde neu gestartet — Download-Status unbekannt. Queue-Recovery läuft automatisch.', 'var(--amber)');
      return;
    }
    const bar = document.getElementById('dl-bar');
    const msg = document.getElementById('dl-msg');

    // "📦 X / Y" live mitführen — current zählt serverseitig während der Verarbeitung hoch.
    const curEl = document.getElementById('dl-current');
    const totEl = document.getElementById('dl-total');
    if (curEl) curEl.textContent = data.current || 0;
    if (totEl) totEl.textContent = data.total || '?';

    if (data.phase === 'fetch') {
      bar.style.width = '30%';
      msg.textContent = data.message || 'Bestellungen werden gesucht…';
    } else if (data.phase === 'download') {
      const pct = data.total > 0 ? 30 + Math.round((data.current / data.total) * 60) : 50;
      bar.style.width = pct + '%';
      msg.textContent = (data.message || 'Informationen werden geladen…') + (data.total > 0 ? ' (' + data.current + '/' + data.total + ')' : '');
    } else if (data.phase === 'done') {
      // Poll-Ende zentral über _stopDlPoll (Interval, Balken, Knopf).
      _stopDlPoll('✅ Fertig! Bestellungen werden geladen…', 'var(--green)');
      // Session zurücksetzen damit nur neue Downloads gezählt werden
      sessionOrders = [];
      // Reload orders + neue session laden
      await loadOrders();
      await loadSession();
      _paintDatePreset();
      lastDownloadCount = data.total || orders.length;
      lastDownloadTime = _berlinUhrzeit();
      if (msg) msg.textContent = '✅ Fertig! ' + (data.total || orders.length) + ' Bestellungen heruntergeladen.';
    } else if (data.phase === 'error') {
      _stopDlPoll('❌ ' + (data.error || 'Fehler'));
    }
  } catch (e) { }
}

// Rückgabe: true = Stand vom Server übernommen. Der Auto-Export braucht das — eine stille
// leere Session sähe dort aus wie „heute keine Bestellungen".
async function loadSession() {
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/v2/session`, { headers, credentials: 'include' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    sessionOrders = data.orders || [];
    const el = document.getElementById('session-info');
    if (el) {
      if (sessionOrders.length > 0) {
        const startedAt = data.startedAt ? _berlinUhrzeit(data.startedAt) : '';
        el.textContent = `${sessionOrders.length} Bestellungen im Lauf von ${startedAt} Uhr`;
        el.style.color = 'var(--green)';
      } else {
        el.textContent = 'Noch keine Session – erst Bestellungen laden';
        el.style.color = 'var(--text-muted)';
      }
    }
    // Layout-Liste zeigt die Bestellungen des Laufs je Layout — nach neuem Lauf neu zeichnen
    if (!IS_AUTOEXPORT && _savedDataCache) renderSaved(true);
    return true;
  } catch (e) { return false; }
}

async function loadOrders() {
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const res = await fetch(`${BASE_URL}/v2/orders`, { headers, credentials: 'include' });
    if (!res.ok) { showToast('⚠️ Bestellungen konnten nicht geladen werden (' + res.status + ')', 4000); return; }
    const allOrders = await res.json();
    // Neue Bestellungen → Slot-Tabellen je ASIN neu lernen (sonst galt der erste Stand).
    _alleOrdersCache = allOrders;
    for (const k in _slotTab) delete _slotTab[k];
    for (const k in _slotTabLaden) delete _slotTabLaden[k];

    // Nach gewähltem Zeitraum filtern (gemeinsamer Berlin-Tagesgrenzen-Helfer)
    const preset = document.getElementById('dl-preset').value;
    const today = _dayBerlin();
    orders = allOrders.filter(o => _matchesDatePreset(o, preset,
      document.getElementById('dl-from').value, document.getElementById('dl-to').value,
      document.getElementById('dl-from-time')?.value || '',
      document.getElementById('dl-to-time')?.value || ''));

    // Zeige letzten Download statt Gesamtsumme
    if (lastDownloadCount > 0) {
      const t = lastDownloadTime ? ' · ' + lastDownloadTime : '';
      document.getElementById('orders-status').textContent = lastDownloadCount + ' Bestellungen heruntergeladen' + t;
    } else {
      document.getElementById('orders-status').textContent = orders.length + ' Bestellungen im Ordner';
    }
    const asinCount = _orderAsins().length;
    const yesterday = _dayBerlin(1);
    const dateLabel = preset === 'today' ? 'Heute (' + today + ')' :
      preset === 'yesterday' ? 'Gestern (' + yesterday + ')' :
        preset === '7days' ? 'Letzte 7 Tage' :
          preset === 'last24h' ? 'Letzte 24 Stunden' :
            preset === 'last48h' ? 'Letzte 48 Stunden' : 'Eigener Zeitraum';
    document.getElementById('dl-info').innerHTML =
      '<div style="color:var(--text);font-weight:600;margin-bottom:2px;">' + orders.length + ' Bestellungen im Ordner</div>' +
      '<div><span style="color:var(--green);">' + dateLabel + '</span> · ' + asinCount + ' ASINs</div>';
    // Kein ASIN-Filter beim DOWNLOAD: der lädt immer alle personalisierten Bestellungen.
    // Gefiltert wird beim Füllen (_fillCfg.globalAsin bzw. filterAsin pro Feld).
    renderProps();
  } catch (e) {
    document.getElementById('orders-status').textContent = 'Offline';
  }
}

// ── Zentrale Füll-Konfiguration ───────────────────────────────────────────────
// EINZIGE Wahrheit fürs Füll-Verhalten (manuell UND Auto-Export). Geschrieben beim
// Layout-Laden (_applyLayoutState) und von den Controls im Reiter „Layout" (id tab-fill); persistiert
// im Layout über _FILL_FIELDS. Die Fill-Logik liest NUR über die Getter darunter.
// Abweichungen vom gespeicherten Layout zeigt _updateFillDirty (⚠).
const _fillCfg = {
  datePreset: 'session', dateFrom: '', dateTo: '',
  singleAsinMode: true, globalAsin: '',
  useQty: true, emptyMode: 'strich', multiPage: true,
};

// Befüllen-Controls an _fillCfg angleichen — NUR Richtung Cfg → UI (die Gegenrichtung
// sind ausschließlich die onchange/onclick-Handler).
function _syncFillUI() {
  const sel = document.getElementById('fill-date-preset');
  if (sel) sel.value = _fillCfg.datePreset;
  const from = document.getElementById('fill-date-from');
  const to = document.getElementById('fill-date-to');
  if (from) from.value = _fillCfg.dateFrom || '';
  if (to) to.value = _fillCfg.dateTo || '';
  const asin = document.getElementById('global-asin');
  if (asin) asin.value = _fillCfg.globalAsin || '';
  _paintDatePreset(); _paintSingleAsin(); _paintQty(); _paintEmptyMode(); _paintMultiPage(); _paintDdNur();
  _updateFillDirty();
}

// Control-Handler-Helfer: Wert in _fillCfg schreiben + ⚠-Abweichung prüfen
function _fillSet(key, val) {
  _fillCfg[key] = val;
  _updateFillDirty();
  if (key === 'globalAsin') _paintDdNur();   // andere ASIN → andere Fragen
}

// ── EINE Feld-Tabelle für die Füll-Konfiguration ──────────────────────────────
// Lesen (_fillCfgFromLayout), Schreiben (_fillCfgToLayout) und der ⚠-Vergleich
// (_fillCfgDiffersFromLayout) laufen ALLE hierüber. Neues Füll-Feld = EINE Zeile hier.
//   cfg:  Key in _fillCfg          key:  Key im gespeicherten Layout
//   from: Layout → Cfg-Wert (inkl. Default)
//   norm: normalisiert einen Cfg-Wert — fürs Schreiben UND den Vergleich
const _FILL_FIELDS = [
  { cfg: 'datePreset', key: 'fillDatePreset', from: l => l.fillDatePreset || 'session', norm: v => v || 'session' },
  { cfg: 'dateFrom', key: 'fillDateFrom', from: l => l.fillDateFrom || '', norm: v => v || '' },
  { cfg: 'dateTo', key: 'fillDateTo', from: l => l.fillDateTo || '', norm: v => v || '' },
  { cfg: 'singleAsinMode', key: 'singleAsinMode', from: l => l.singleAsinMode ?? true, norm: v => !!v },
  { cfg: 'globalAsin', key: 'globalAsin', from: l => (l.globalAsin || '').trim().toUpperCase(), norm: v => (v || '').trim().toUpperCase() },
  { cfg: 'useQty', key: 'useQty', from: l => l.useQty !== false, norm: v => v !== false },
  { cfg: 'emptyMode', key: 'emptyMode', from: l => l.emptyMode || 'strich', norm: v => v || 'strich' },
  { cfg: 'multiPage', key: 'multiPage', from: l => l.multiPage !== false, norm: v => v !== false },
  { cfg: 'ddNur', key: 'ddNur', from: l => _ddNurNorm(l.ddNur), norm: _ddNurNorm },
];

// Layout → _fillCfg (beim Laden). Setzt ALLE Felder, auch fehlende (dann ihr Default) —
// sonst bleiben sie auf dem Wert des ZUVOR geladenen Layouts stehen und eine fremde
// globale ASIN wandert unsichtbar in ein altes Layout hinein.
function _fillCfgFromLayout(layout) {
  for (const f of _FILL_FIELDS) _fillCfg[f.cfg] = f.from(layout);
}

// _fillCfg → Layout-Objekt (saveLayout + „ins Layout übernehmen")
function _fillCfgToLayout(l) {
  for (const f of _FILL_FIELDS) {
    const v = f.norm(_fillCfg[f.cfg]);
    if (v === null) delete l[f.key]; else l[f.key] = v;   // null = nicht gesetzt (ddNur)
  }
}

function _fillCfgDiffersFromLayout() {
  const l = _loadedLayout;
  if (!l) return false; // kein gespeichertes Layout geladen → nichts zu vergleichen
  // Beide Seiten durch DIESELBE Normalisierung schicken → Vergleich immer symmetrisch
  // JSON statt !==: ddNur ist ein Objekt, die übrigen Werte vergleichen sich so wie vorher.
  return _FILL_FIELDS.some(f => JSON.stringify(f.norm(_fillCfg[f.cfg])) !== JSON.stringify(f.norm(f.from(l))));
}

function _updateFillDirty() {
  const el = document.getElementById('fill-dirty-hint');
  if (el) el.style.display = _fillCfgDiffersFromLayout() ? 'flex' : 'none';
}

// Das GELADENE Layout serverseitig ändern: laden, finden, mutieren, speichern, melden.
// Gemeinsam für „Befüllung übernehmen" und „Laser-Einstellungen übernehmen".
// Rückgabe: true = gespeichert.
async function _updateLoadedLayout(mutate, okMsg) {
  if (!_loadedLayout) { showToast('Zuerst ein Layout laden'); return false; }
  const saved = await getServerLayouts();
  const l = saved.find(x => x.id === _loadedLayout.id);
  if (!l) { showToast('❌ Layout nicht gefunden'); return false; }
  mutate(l);
  if (!(await saveServerLayouts(saved))) return false;
  _loadedLayout = l;
  showToast(okMsg(l));
  return true;
}

async function applyFillCfgToLayout() {
  if (await _updateLoadedLayout(_fillCfgToLayout,
    l => '✅ Befüllung im Layout "' + l.name + '" gespeichert')) {
    _updateFillDirty();
  }
}

// Den Initialzustand der Befüllen-Controls setzt der zentrale Init (_syncFillUI).

// Ein Schalter der Füll-Konfiguration: umdrehen, neu zeichnen, ⚠-Abweichung prüfen.
function _toggleFillFlag(key, paint) {
  _fillCfg[key] = !_fillCfg[key];
  paint();
  _updateFillDirty();
}
function toggleSingleAsinMode() { _toggleFillFlag('singleAsinMode', _paintSingleAsin); }

function _paintSingleAsin() {
  const on = _fillCfg.singleAsinMode;
  // Hint für Pro-Feld-Modus anzeigen/verstecken
  const hint = document.getElementById('fill-asin-hint');
  if (hint) hint.style.display = on ? 'none' : 'block';
  const txt = document.getElementById('single-asin-lbl-txt');
  const tog = document.getElementById('single-asin-toggle');
  if (!txt || !tog) return;
  tog.classList.toggle('on', on);
  txt.textContent = on ? 'Gleiche ASIN' : 'Pro Feld';
  txt.style.color = on ? 'var(--accent)' : 'var(--text-muted)';
  // ASIN-Eingabe ein/ausblenden
  document.getElementById('single-asin-input').style.display = on ? 'block' : 'none';
  // Props neu rendern damit ASIN-Filter in Feldern ein/ausgeblendet wird
  renderProps();
  _paintDdNur();
}

function getSingleAsinMode() {
  return _fillCfg.singleAsinMode;
}

function getGlobalAsin() {
  return (_fillCfg.globalAsin || '').trim().toUpperCase();
}

// Sortier-Reihenfolge der Bestellungen. Standard: neueste zuerst. Im Auto-Export setzt
// runAutoExport pro Layout window._autoExportSortOrder (= layout.exportOrder).
function _orderSort(a, b) {
  const ord = window._autoExportSortOrder;
  if (ord === 'date-asc') return (a.purchaseDate || a.date || '').localeCompare(b.purchaseDate || b.date || '');
  if (ord === 'ordernr') return (a.id || '').localeCompare(b.id || '');
  return (b.purchaseDate || b.date || '').localeCompare(a.purchaseDate || a.date || ''); // date-desc (Standard)
}

function toggleQtyMode() { _toggleFillFlag('useQty', _paintQty); }

// Karten-Toggle (Pille + Kasten + Beschreibung) für „Menge × Felder" UND „Automatisch
// mehrseitig". Die FARBE steht am Markup (Klasse an-gruen bzw. keine = Akzent), nicht
// hier. idBase erwartet <idBase>-lbl/-desc/-pill.
function _paintCardToggle(idBase, on, textOn, textOff) {
  const lbl = document.getElementById(idBase + '-lbl');
  const desc = document.getElementById(idBase + '-desc');
  const pill = document.getElementById(idBase + '-pill');
  if (!lbl || !desc || !pill) return;
  pill.classList.toggle('on', on);
  _setAn(lbl, on);
  desc.textContent = on ? textOn : textOff;
}

function _paintQty() {
  _paintCardToggle('qty-toggle', _fillCfg.useQty,
    'Bestellung mit Menge 2 → belegt 2 Felder', 'Jede Bestellung belegt immer genau 1 Feld');
}

function toggleMultiPage() { _toggleFillFlag('multiPage', _paintMultiPage); }

function _paintMultiPage() {
  _paintCardToggle('multipage-toggle', _fillCfg.multiPage,
    'Volle Seite → neue Seite wird automatisch erstellt', 'Nur aktuelle Seite füllen — keine weiteren Seiten');
}
// Bestell-Pool nach Menge expandieren (Menge 2 = 2 Slots). Mehrfach-Vorrichtungen macht
// das ⿻ Array-Feature, dessen Kopien keine eigene Bestellung verbrauchen.
function _expandByQty(orders, useQty) {
  const out = [];
  orders.forEach(o => {
    const n = useQty ? (o.quantity || 1) : 1;
    for (let i = 0; i < n; i++) out.push(o);
  });
  return out;
}
// Hat diese Bestellung eine Bild-Datei (jpg/png)?
function _orderHasImage(o) {
  if (!o?.files) return false;
  return o.files.some(fi => {
    const fn = _fileName(fi);
    return fn && /\.(jpg|jpeg|png)$/i.test(fn);
  });
}

// Nächste passende Bestellung aus einem Pool ziehen — gemeinsamer Kern der Bild- UND
// Text-Vergabe. pointers[filterAsin] ist der persistente Zeiger (überlebt Seitenwechsel).
// isValid=null → ohne Prüfung nehmen; sonst werden ungeeignete übersprungen (Modus
// „Überspringen") und der Zeiger wandert über sie hinweg — sie kommen nie mehr dran.
function _nextFromPool(pointers, filterAsin, pool, isValid) {
  const candidates = filterAsin ? pool.filter(o => o.asin === filterAsin) : pool;
  let ptr = pointers[filterAsin] ?? 0;
  let order = null;
  while (ptr < candidates.length) {
    const o = candidates[ptr++];
    if (!isValid || isValid(o)) { order = o; break; }
  }
  pointers[filterAsin] = ptr;
  return order;
}

// Gravur-Texte aller Bestellungen in den textCache laden — parallel in 8er-Gruppen
// (sequenziell dauerte das bei 100+ Bestellungen mehrere Sekunden je Füllvorgang).
async function _loadTextCache(ordersList, textCache, msgEl) {
  const uniq = [...new Map(ordersList.map(o => [_orderKey(o), o])).values()];
  const B = 8;
  for (let i = 0; i < uniq.length; i += B) {
    if (msgEl) msgEl.textContent = `Lade Texte… (${Math.min(i + B, uniq.length)}/${uniq.length})`;
    await Promise.all(uniq.slice(i, i + B).map(async o => {
      textCache[_orderKey(o)] = await getAllTexts(o);
    }));
  }
}

// Text + Font auf ein Feld anwenden — EINE Quelle für Stapel- UND Synchron-Modus
// (setzt orderId, _text mit Strich-Fallback, _fontFamily/_fontUrl/_fontRawFamily).
// Kombi-Zeile ohne echten Inhalt: leer oder nur Satzzeichen. Manche Kunden füllen ein
// Pflichtfeld mit „." oder „-" — 09.10.2026 wurde so ein einzelner Punkt über „Charlie 67"
// graviert (FL05). „!" und „?" zählen bewusst als Inhalt.
const _comboLeer = t => !t || /^[\s.,;:\-_–—·•*'"´`]*$/.test(String(t));
async function _applyTextToField(field, order, texts, fonts, textIdx, showDash) {
  field.orderId = order.id;
  field._ddKey = _orderKey(order);   // Bestellposition — Dropdown-Motive finden darüber ihre Antwort
  // „Nur gravieren, wenn …" nicht erfüllt: bewusst leer — auch im Strich-Modus kein „—".
  if (field.ddWenn && !_ddBedingungOk(field, _ddCache.get(field._ddKey))) { field._text = ''; return; }
  // Dropdown-Feld („Inhalt aus Dropdown"): zeigt die Antwort des Kunden bzw. den Text, der
  // für sie hinterlegt ist — keine Gravurzeile. Die Schrift ist die des FELDES (z. B. Fraktur
  // für den Buchstaben bei F02 V3/V4), nicht die, die der Kunde für seine Texte gewählt hat.
  if (field.ddFrage) {
    const t = _ddFeldText(field, _ddCache.get(field._ddKey));
    field._text = t || (showDash ? '—' : '');
    field._fontFamily = null; field._fontUrl = null; field._fontRawFamily = null;
    return;
  }
  let fontIdx = textIdx;
  if (_isCombo(field)) {
    // Kombi-Feld: NUR die gefüllten Gravur-Zeilen (comboPals) bilden den Block — leere Zeilen
    // und Zeilen aus reinen Satzzeichen fallen weg, egal an welcher Stelle. Bis 09.10.2026 blieb
    // eine leere ERSTE Zeile im Block: „Mittig" griff nicht, der Text klebte unten (F02 V1 mit
    // nur „3 Zeile"). comboCenterShiftMM setzt den Block mittig; die Größe bleibt konstant
    // (comboFontSizePt rechnet mit der festen Zeilenzahl, nicht mit den befüllten).
    const parts = field.comboPals.map(p => texts[p - 1]).filter(t => !_comboLeer(t));
    field._text = parts.length ? parts.join('\n') : (showDash ? '—' : '');
    // Nur Satzzeichen eingegeben (306-8755969: „. ") → nichts graviert; in status.txt vermerken,
    // damit das Teil nicht als vergessen gilt.
    const nurZeichen = field.comboPals.map(p => texts[p - 1]).filter(t => t && t.trim());
    if (!parts.length && nurZeichen.length) _exportHinweise.set(`${order.id}: nur „${nurZeichen.map(t => t.trim()).join(' ')}" eingegeben — nichts graviert`, { layout: 'Hinweis' });
    // Schrift der ersten befüllten Zeile — alle Zeilen teilen sich EINE Schrift.
    const firstFilled = field.comboPals.findIndex(p => !_comboLeer(texts[p - 1]));
    fontIdx = (firstFilled >= 0 ? field.comboPals[firstFilled] : (field.comboPals[0] || 1)) - 1;
  } else {
    const hasText = texts[textIdx] && texts[textIdx].trim();
    field._text = hasText ? texts[textIdx] : (showDash ? '—' : '');
  }

  await _feldSchriftSetzen(field, fonts[fontIdx] || fonts[0]);
}

// Kundenschrift auf ein Feld setzen (manueller Upload > URL > Family-Name) — EINE Stelle für
// Bestellungen (_applyTextToField) und Testblatt-Vorauswahl. fontInfo = { family, url }.
async function _feldSchriftSetzen(field, fontInfo) {
  if (!fontInfo?.family) return;
  if (_uploadedFonts[fontInfo.family]) {
    field._fontFamily = _uploadedFonts[fontInfo.family];
  } else if (fontInfo.url) {
    field._fontFamily = await loadFontFromUrl(fontInfo.url, fontInfo.family);
  } else {
    field._fontFamily = fontInfo.family;
  }
  // Für Vektor-Export (DXF): echte Quelle merken, nicht den amz-Render-Namen
  field._fontUrl = fontInfo.url || null;
  field._fontRawFamily = fontInfo.family || null;
}

// Nummer-Feld füllen: Teil der Bestellnummer per slice (chars + from-end/start)
function _applyNumberToField(nf, orderId) {
  nf.orderId = orderId;
  const chars = nf.numChars || 7;
  const from = nf.numFrom || 'end';
  nf._text = from === 'end' ? orderId.slice(-chars) : orderId.slice(0, chars);
}

async function fillWithData(isNextPage = false) {
  // isNextPage=false → normaler Start → Pointer zurücksetzen (_allTxtOrders baut der
  // einzige Aufrufer _fillStackPages selbst auf).
  if (!isNextPage) {
    _sessionPointer = 0;
    _txtSlotPointers = {};
    _imgSlotPointers = {};
  }
  // Einmal am Start einfrieren — ein Toggle-Klick mitten im Füll-Lauf darf die
  // laufende Expansion nicht mehr ändern (gleiches Muster in allen drei Füll-Pfaden).
  const useQty = _fillCfg.useQty;
  // NUR die Fortschritts-Box. Die Button-Sperre gehört fillAllPagesAuto: fillWithData
  // läuft pro SEITE und gäbe den Knopf mitten im Mehrseiten-Lauf frei — ein zweiter
  // Klick setzt dann die globalen Füll-Pointer zurück.
  const fillProg = document.getElementById('fill-progress');
  const fillBar = document.getElementById('fill-bar');
  const fillMsgEl = document.getElementById('fill-msg');
  if (fillProg) fillProg.classList.add('visible');

  // Zeitraum-Filter (inkl. Session; geladen hat sie fillLayoutPages)
  const dateFiltered = getFillDateFilteredOrders();

  // Sortieren: neueste zuerst
  const allFiltered = dateFiltered
    .sort(_orderSort);

  // Multi-Page läuft über persistente Pointer pro ASIN, nicht über _sessionPointer.
  const totalSession = allFiltered.length;
  window._currentSessionTotal = totalSession;
  window._currentFilteredForFill = allFiltered;

  // Bild-Pool: nur Bestellungen MIT Bild, qty-expandiert — WICHTIG: aus der vollständigen
  // Liste; die Seitenfortsetzung läuft über die persistenten _imgSlotPointers pro ASIN.
  const expandedImgOrders = _expandByQty(allFiltered.filter(_orderHasImage), useQty);

  // Text-Bestellungen: aus _allTxtOrders (einmalig vom Caller gebaut) oder frisch
  const expandedTxtOrders = _allTxtOrders.length > 0
    ? [..._allTxtOrders]
    : _expandByQty(allFiltered, useQty);

  // Reset all fields — statische Felder überspringen (staticText darf nie gelöscht werden)
  _clearFieldData(fields);

  // Nach POSITION sortieren (oben-links zuerst), nicht nach Erstell-Reihenfolge: das
  // geometrisch erste Feld bekommt die erste Bestellung.
  // Array-Kopien (!f.arrayOf) verbrauchen keine eigene Bestellung — ihren Inhalt setzt
  // _syncArrayClones danach vom Master.
  const imgFields = fields.filter(f => f.type === 'image' && !f.arrayOf).sort(_nachPosition);
  const txtFields = fields.filter(f => f.type === 'text' && !f.arrayOf).sort(_nachPosition);
  const numFields = fields.filter(f => f.type === 'number' && !f.arrayOf).sort(_nachPosition);

  // Fill image fields
  const totalFill = imgFields.length + txtFields.length + numFields.length;
  let doneFill = 0;
  const skipEmptyImg = getSkipEmpty();
  // Welches ITEM hat Bild-Slot i bekommen? Die Text-Schleife unten braucht das. Bewusst
  // das OBJEKT, nicht die Nummer: Mehr-Artikel-Bestellungen teilen sich die Nummer.
  const imgOrderBySlot = [];

  // Bild N = N-tes Kundenfoto DERSELBEN Bestellung (26.09.): Felder nach palNum gruppieren,
  // Platz i jeder Gruppe teilt sich eine Bestellung — wie Gravur 1/2 bei den Texten. Nur
  // Bild 1 (alle Layouts, Stand 26.09.) ergibt exakt den alten Ablauf: ein Feld = ein Platz
  // = eine Bestellung, gleiche Reihenfolge, gleiche Pool-Aufrufe.
  const imgByPal = {};
  imgFields.forEach(f => { const p = f.palNum || 1; (imgByPal[p] = imgByPal[p] || []).push(f); });
  const imgPals = Object.keys(imgByPal).map(Number).sort((a, b) => a - b);
  const imgSlots = Math.max(0, ...imgPals.map(p => imgByPal[p].length));
  let imgNr = 0;
  for (let i = 0; i < imgSlots; i++) {
    const amPlatz = imgPals.map(p => imgByPal[p][i]).filter(Boolean);
    // Modus A: globale ASIN, Modus B: ASIN pro Feld ('' = alle) — vom ersten Feld des Platzes
    const filterAsin = getSingleAsinMode() ? getGlobalAsin() : (amPlatz[0].filterAsin || '');
    // Nächste Bestellung über den gemeinsamen Pool-Helfer (Zeiger pro filterAsin)
    const order = _nextFromPool(_imgSlotPointers, filterAsin, expandedImgOrders,
      skipEmptyImg ? _orderHasImage : null);
    if (!order) continue;

    imgOrderBySlot[i] = order;
    for (const field of amPlatz) {
      field.orderId = order.id;
      field._ddKey = _orderKey(order);
      // „Nur gravieren, wenn …" nicht erfüllt: Platz gehört der Bestellung, das Foto bleibt weg.
      if (field.ddWenn && !_ddBedingungOk(field, _ddCache.get(field._ddKey))) continue;
      if (fillMsgEl) fillMsgEl.textContent = `Bild ${++imgNr} von ${imgFields.length}…`;
      if (fillBar) fillBar.style.width = Math.round((++doneFill / totalFill) * 100) + '%';
      await loadImg(field, order);
    }
  }

  // Globale Kopie der ASIN-Pointer für hasMore-Check im Auto-Export
  window._lastImgOrderPointers = {};
  window._lastImgCandidateCounts = {};
  for (const asin in _imgSlotPointers) {
    window._lastImgOrderPointers[asin] = _imgSlotPointers[asin];
    const candidates = asin
      ? expandedImgOrders.filter(o => o.asin === asin)
      : expandedImgOrders;
    window._lastImgCandidateCounts[asin] = candidates.length;
  }

  // Textfelder sind nach palNum gruppiert: palNum N → immer Text N der Bestellung
  // (1 = Name/Gravur, 2 = Datum/Rückseite, …). Der Text-Pool enthält ALLE Bestellungen
  // (mit UND ohne Bild), qty-expandiert — Bild-Bestellungen haben oft auch Text.
  const allOrdersForText = expandedTxtOrders;
  // Misch-Layout (Bild + Text): Text-Slot i übernimmt den Artikel des positionsgleichen
  // Bild-Felds. Gekoppelt über imgOrderBySlot (das vergebene OBJEKT), NICHT über eine
  // id→Bestellung-Map: Mehr-Artikel-Bestellungen teilen sich die id, eine Map behielte
  // nur den letzten — Artikel 1 bekäme sein Foto mit der Gravur von Artikel 2.
  const _isMixedLayout = imgFields.length > 0 && txtFields.length > 0;
  // Nach palNum gruppieren
  const txtByPal = {};
  txtFields.forEach(f => {
    if (!txtByPal[f.palNum]) txtByPal[f.palNum] = [];
    txtByPal[f.palNum].push(f);
  });
  // Cache: Texte pro Bestellung vorladen
  const textCache = {}; // key → { texts, fonts }
  // Nur laden, wenn es überhaupt Textfelder gibt — reine Bild/Nummer-Layouts brauchen den
  // textCache nicht (spart bei jeder Füllung alle getAllTexts-JSON-Abrufe).
  if (txtFields.length > 0) {
    // Pro ITEM eindeutig (_orderKey) — sonst teilen sich mehrere Items einer Bestellung
    // denselben Cache-Eintrag und bekämen alle die Gravur des ersten Items.
    await _loadTextCache(allOrdersForText, textCache, fillMsgEl);
  }
  // SLOT-basiert: alle palNums eines Slots bekommen DIESELBE Bestellung, damit Gravur
  // 1/2/3/4 an Position i zusammengehören.
  const skipEmptyTxt = getSkipEmpty();
  const showDash = getShowDash();

  // Anzahl Slots = maximale Feldanzahl pro palNum-Gruppe
  const palNums = Object.keys(txtByPal).sort((a, b) => a - b);
  const slotCount = Math.max(...palNums.map(p => txtByPal[p].length), 0);

  const slotOrders = [];   // Bestellung je Platz — Regel-Motive binden sich daran (s. unten)
  for (let slot = 0; slot < slotCount; slot++) {
    // Misch-Layout (Bild + Text): Text-Slot i übernimmt den Artikel des positions-
    // gleichen Bild-Felds i — sonst laufen Foto und Gravurtext auseinander, sobald der
    // Pool bildlose Bestellungen enthält. Reine Text-Layouts überspringen das.
    if (_isMixedLayout) {
      // Exakt das Objekt, das die Bild-Schleife diesem Slot zugeteilt hat (s.o.) —
      // damit stimmt bei Mehr-Artikel-Bestellungen auch der ARTIKEL, nicht nur die Nummer.
      const paired = imgOrderBySlot[slot] || null;
      if (paired) slotOrders[slot] = paired;
      if (paired) {
        const cached = textCache[_orderKey(paired)] || { texts: [], fonts: [] };
        for (const palNum of palNums) {
          const field = txtByPal[palNum][slot];
          if (!field) continue;
          await _applyTextToField(field, paired, cached.texts, cached.fonts, parseInt(palNum) - 1, showDash);
          if (fillBar) fillBar.style.width = Math.round((++doneFill / totalFill) * 100) + '%';
        }
      }
      continue; // bild-gesteuert — Text-Pointer ungenutzt (Überlauf läuft über die Bild-Pointer)
    }
    // ASIN-Filter: vom ersten palNum-Feld an diesem Slot nehmen (alle sollten gleich sein)
    const firstField = palNums.map(p => txtByPal[p][slot]).find(f => f);
    const filterAsin = getSingleAsinMode()
      ? getGlobalAsin()
      : (firstField?.filterAsin || '');

    // Nächste Bestellung über den gemeinsamen Pool-Helfer (gleicher Kern wie die
    // Bild-Vergabe oben). Bei „Überspringen": Bestellung muss mind. EINEN Text in
    // den auf der Seite vorhandenen Gravur-Slots (palNums) haben.
    const order = _nextFromPool(_txtSlotPointers, filterAsin, allOrdersForText,
      skipEmptyTxt ? (o => {
        const cached = textCache[_orderKey(o)] || { texts: [] };
        return palNums.some(p => {
          // Kombi-Feld an diesem Slot: JEDE seiner Zeilen (comboPals) zählt als Treffer.
          const fld = txtByPal[p][slot];
          const pals = (fld && _isCombo(fld) && fld.comboPals.length) ? fld.comboPals : [parseInt(p)];
          return pals.some(pp => { const t = cached.texts[pp - 1]; return t && t.trim(); });
        });
      }) : null);
    if (!order) continue; // Keine Bestellungen mehr
    slotOrders[slot] = order;
    const { texts, fonts } = textCache[_orderKey(order)] || { texts: [], fonts: [] };

    // Jetzt ALLE palNums an diesem Slot mit der gleichen Bestellung füllen
    for (const palNum of palNums) {
      const field = txtByPal[palNum][slot];
      if (!field) continue;
      const textIdx = parseInt(palNum) - 1;
      await _applyTextToField(field, order, texts, fonts, textIdx, showDash);
      if (fillBar) fillBar.style.width = Math.round((++doneFill / totalFill) * 100) + '%';
    }
  }
  // Regel-Motive an ihre Plätze binden: Motiv k ↔ Platz k (Text-Plätze, sonst Bild-Plätze).
  // Ein Layout nur aus Motiven zieht seine Bestellungen selbst aus dem Pool.
  {
    const quelle = txtFields.length ? slotOrders : imgOrderBySlot;
    const nurMotive = !txtFields.length && !imgFields.length;
    _ddRegelMotive(fields).forEach((m, k) => {
      let o = quelle[k];
      if (!o && nurMotive) o = _nextFromPool(_txtSlotPointers, getSingleAsinMode() ? getGlobalAsin() : '', allOrdersForText, null);
      if (o) { m.orderId = o.id; m._ddKey = _orderKey(o); }
    });
  }
  renderEls(); drawCanvas();

  // Nummer-Felder: Bestellnummer vom zugehörigen Bild- oder Text-Feld (gleicher palNum).
  // Gibt es auf dem Blatt keine Gravur/kein Bild mit dieser Nummer (z. B. Rückseite nur
  // mit Gravur 2), hängt sie sich an die kleinste vorhandene — die Palette legt seit
  // 26.09. nur noch „Bestellnummer" ohne Zahl an (palNum 1).
  const _palDa = new Set([...imgFields, ...txtFields].map(f => f.palNum || 1));
  const _nrPal = (f, i) => { const p = f.palNum || (i + 1); return _palDa.has(p) || !_palDa.size ? p : Math.min(..._palDa); };
  for (let i = 0; i < numFields.length; i++) {
    const nf = numFields[i];
    const palNum = _nrPal(nf, i);

    // Suche zuerst Bild-Feld, dann Text-Feld mit gleichem palNum
    const matchImgFields = imgFields.filter(f => (f.palNum || 1) === palNum);
    const matchTxtFields = Object.values(txtByPal).flat().filter(f => (f.palNum || 1) === palNum);

    // Kombiniert: Bild-Felder bevorzugen, dann Text-Felder
    const matchFields = matchImgFields.length > 0 ? matchImgFields : matchTxtFields;
    const groupIdx = numFields.slice(0, i).filter((f, j) => _nrPal(f, j) === palNum).length;
    const matchField = matchFields[groupIdx];

    if (!matchField || !matchField.orderId) continue;
    _applyNumberToField(nf, matchField.orderId);
  }

  _ddMotiveSetzen(fields);  // Dropdown-Motive: je Platz das Motiv zur Antwort
  _syncArrayClones(fields); // Array-Kopien = Inhalt ihres Masters
  renderEls(); drawCanvas();
  const filled = [...imgFields, ...txtFields, ...numFields].filter(f => f.orderId).length;
  const total = fields.length;
  if (fillProg) { fillBar.style.width = '100%'; fillMsgEl.textContent = `✅ ${filled} von ${total} Feldern gefüllt`; }
  setTimeout(() => { if (fillProg) fillProg.classList.remove('visible'); if (fillBar) fillBar.style.width = '0%'; }, 3000);
  showToast('✅ ' + filled + ' von ' + total + ' Feldern gefüllt', 3000);

  // Session-Pointer aktualisieren (für ALLE Modi, nicht nur Session)
  if (window._currentFilteredForFill) {
    const usedOrderIds = new Set(fields.filter(f => f.orderId).map(f => f.orderId));
    if (usedOrderIds.size > 0) {
      const allFiltered = window._currentFilteredForFill;
      // Nur innerhalb der Session-Bestellungen suchen (ab aktuellem Pointer)
      let lastUsedIndex = _sessionPointer - 1;
      for (let i = _sessionPointer; i < allFiltered.length; i++) {
        if (usedOrderIds.has(allFiltered[i].id)) lastUsedIndex = i;
      }
      if (lastUsedIndex >= _sessionPointer) {
        _sessionPointer = lastUsedIndex + 1; // direkt hinter die letzte genutzte Bestellung
      }
    }
    saveCurrentPageSnapshot();
  }
}

// ── Seiten-Navigator ──────────────────────────────────────────────────────────
let _pages = []; // Array von Seiten {fields, snapshot}
let _currentPage = 0; // Aktuelle Seite (0-basiert)

// Neue Seite mit `felder` einfügen (hinter der aktuellen oder am Ende) und dorthin wechseln.
function _seiteEinfuegen(felder, hinterAktueller) {
  saveUndo();
  if (_pages.length === 0) _pages = [fields.map(f => ({ ...f }))];
  saveCurrentPageSnapshot();
  _currentPage = hinterAktueller ? _currentPage + 1 : _pages.length;
  _pages.splice(_currentPage, 0, felder);
  fields = felder.map(f => ({ ...f }));
  _refreshAfterPageChange(); // sel zurücksetzen + Canvas/Liste/Panel/Navigator (eine Stelle)
  switchTab('page', document.getElementById('nav-page'));
}

// Aktuelle Seite 1:1 duplizieren (inkl. Inhalte) und zur Kopie springen
function duplicateCurrentPage() {
  // Tiefe Kopie mit frischen IDs. _img MUSS an JSON.stringify vorbei: ein
  // HTMLImageElement serialisiert zu {} — TRUTHY, also lief drawCanvas danach in
  // ctx.drawImage({}, …) und warf. Also ohne _img serialisieren und die Referenz danach
  // anhängen; Referenz statt Klon ist korrekt, _img wird nie in-place verändert.
  const copy = fields.map(f => ({
    ...JSON.parse(JSON.stringify({ ...f, _img: null })),
    _img: f._img || null,
    id: ++idc,
  }));
  _seiteEinfuegen(copy, true);   // direkt hinter der aktuellen Seite
  showToast(`⧉ Seite dupliziert → jetzt Seite ${_currentPage + 1} von ${_pages.length}`);
}

// Globalen ID-Counter über alle Seiten berechnen
function recalcIdc() {
  const allFields = _pages.reduce((acc, pg) => acc.concat(pg), [...fields]);
  idc = allFields.reduce((m, f) => Math.max(m, f.id || 0), 0);
}

// ── Zentrale UI-/Daten-Helpers ─────────────────────────────────────────────

// UI nach Seitenwechsel / Undo / Layout-Wechsel komplett refreshen
function _refreshAfterPageChange() {
  recalcIdc();
  sel = null;
  scheduleRender();
  renderFieldList();
  renderProps();
  updatePageNavigator();
}

// Feld-Inhalte zurücksetzen (für Re-Fill, Page-Switch, manuelles Leeren).
// keepStatic=true (Default) → statische Felder werden NICHT angefasst (ihr Text bleibt).
// Akzeptiert ein einzelnes Feld oder ein Array.
function _clearFieldData(fieldOrArray, opts = {}) {
  const keepStatic = opts.keepStatic !== false;
  const list = Array.isArray(fieldOrArray) ? fieldOrArray : [fieldOrArray];
  for (const f of list) {
    if (keepStatic && f.type === 'static') continue;
    f._img = null;
    f._text = null;
    f.orderId = null;
    // Session-spezifische Bild-Referenzen ebenfalls leeren — sonst rendert ein nicht
    // neu gefülltes Bildfeld das alte Foto (auch cross-origin aus gespeicherten Layouts).
    f._imgSrc = null;
    f._placement = null;
    f._ddKey = null; f._motivDatei = null; f._ddLeer = false; f._ddAus = false;
    // Auch das vor dem Dithern gesicherte Original: der Laser-Export liest
    // `_originalImgs[f.id] || f._img`. Bliebe es stehen, gravierte der nächste Lauf das
    // Foto der VORIGEN Befüllung — sichtbar wäre der Tausch nirgends.
    delete _originalImgs[f.id];
  }
}

// Canvas im mm→px-Maßstab erzeugen (für PDF/PNG/BMP-Exporte)
function _makeCanvas(pageObj, scale) {
  const c = document.createElement('canvas');
  c.width = Math.round(pageObj.w * scale);
  c.height = Math.round(pageObj.h * scale);
  const ctx = c.getContext('2d');
  // Hochwertige Interpolation für JEDEN Export — Browser-Default 'low' ergibt sichtbar
  // weichere Kanten bei herunterskalierten Produktbildern, und kostet nichts.
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  return { c, ctx };
}

// Sublimations-Canvas (300 DPI, sRGB, weißer Grund) — für manuellen UND Auto-Export.
async function _buildSublimationCanvas() {
  const p = getPg();
  const PX_PER_MM = SUBLIMATION_DPI / 25.4; // fest 300 DPI — muss zum "300dpi" im Dateinamen passen
  const c = document.createElement('canvas');
  c.width = Math.round(p.w * PX_PER_MM);
  c.height = Math.round(p.h * PX_PER_MM);
  const ctx = c.getContext('2d', { colorSpace: 'srgb' });
  // Reiner weißer Hintergrund — kritisch für Sublimation (Farben sind transparent)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  for (const f of fields) await renderFieldToCtx(ctx, f, PX_PER_MM);
  return c;
}

// Blob herunterladen — verhindert die ObjectURL-Leaks der Handschrift-Variante.
function _downloadBlob(blob, filename) {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Fremdbibliothek aus vendor/ nachladen (lokal gebündelt — kein Internet nötig).
function _skriptLaden(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src;
    s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}

// Lädt JSZip bei Bedarf nach (idempotent).
async function _ensureJSZip() {
  if (typeof JSZip === 'undefined') await _skriptLaden('vendor/jszip.min.js');
}

function _canvasToBlob(c, type, quality) {
  return new Promise(resolve => c.toBlob(resolve, type, quality));
}

// Mehrere Seiten-Outputs herunterladen: eine Seite als Einzeldatei, mehrere als ZIP.
// Rückgabe: true = etwas heruntergeladen, false = leere Liste.
async function _downloadPerPageOutputs(outputs, singleName, zipName) {
  // Leere Liste eigenständig behandeln: `<= 1` griffe auch bei 0 und liefe in
  // outputs[0].blob → TypeError (erreichbar, sobald jede Seite null liefert).
  if (outputs.length === 0) return false;
  if (outputs.length === 1) {
    _downloadBlob(outputs[0].blob, singleName);
    return true;
  }
  await _ensureJSZip();
  const zip = new JSZip();
  outputs.forEach(o => zip.file(o.name, o.blob));
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  _downloadBlob(zipBlob, zipName);
  return true;
}

// Seite speichern
function saveCurrentPageSnapshot() {
  _pages[_currentPage] = fields.map(f => ({ ...f }));
}

// Navigator anzeigen/aktualisieren
function updatePageNavigator() {
  const nav = document.getElementById('page-navigator');
  const lbl = document.getElementById('page-nav-label');
  if (!nav || !lbl) return;
  if (_pages.length > 1) {
    nav.style.display = 'flex';
    lbl.textContent = `Seite ${_currentPage + 1} von ${_pages.length}`;
    const btns = nav.querySelectorAll('button');
    if (btns[0]) btns[0].style.opacity = _currentPage > 0 ? '1' : '0.3';
    if (btns[1]) btns[1].style.opacity = _currentPage < _pages.length - 1 ? '1' : '0.3';
  } else {
    nav.style.display = 'none';
  }
  // Mini-Übersicht im linken Panel aktualisieren
  const ov = document.getElementById('pages-overview');
  if (!ov) return;
  ov.innerHTML = '';
  _pages.forEach((pg, i) => {
    // Die Zeile IST ein Schalter-Kasten und benutzt die vorhandenen Klassen
    // (.schaltkarte + .an + .opt-title) statt eigener Inline-Stile.
    const row = document.createElement('div');
    const aktiv = i === _currentPage;
    row.className = 'schaltkarte hstack' + (aktiv ? ' an' : '');
    row.style.cssText = 'gap:8px;';
    row.innerHTML = `<span class="opt-title" style="font-weight:500;">Seite ${i + 1}</span><span style="flex:1"></span>${_pages.length > 1 && !aktiv ? `<button class="zp-ikon" onclick="event.stopPropagation();deletePage(${i})" title="Seite löschen">✕</button>` : ''}`;
    row.onclick = () => jumpToPage(i);
    ov.appendChild(row);
  });
}

// Seite i anzeigen: Zeiger setzen, `fields` als KOPIE der Seite aufbauen, Oberfläche
// nachziehen. Dass `fields` eine KOPIE ist und nicht die Seite selbst, ist die zentrale
// Regel dieses Zustands (s. saveCurrentPageSnapshot).
function _zeigeSeite(i) {
  _currentPage = i;
  fields = _pages[_currentPage].map(f => ({ ...f }));
  _refreshAfterPageChange();
}

// Direkt zu einer bestimmten Seite springen
function jumpToPage(i) {
  if (i === _currentPage) return;
  saveCurrentPageSnapshot();
  _zeigeSeite(i);
}

// Seite löschen
function deletePage(i) {
  if (_pages.length <= 1) { showToast('Mindestens eine Seite muss vorhanden sein'); return; }
  saveUndo();
  _pages.splice(i, 1);
  // Seite VOR der aktuellen gelöscht → der Rest rutscht um eins nach vorn, der gleiche
  // Zeiger zeigt sonst auf die Folgeseite (auf S3 stehen, S1 löschen → man sah S4).
  // Löschbar sind ohnehin nur Seiten, auf denen man NICHT steht.
  const ziel = i < _currentPage ? _currentPage - 1 : _currentPage;
  _zeigeSeite(Math.min(Math.max(0, ziel), _pages.length - 1));
  showToast(`Seite ${i + 1} gelöscht`);
}

// Zu Seite navigieren
function goToPage(dir) {
  saveCurrentPageSnapshot();
  const newPage = _currentPage + dir;
  if (newPage < 0 || newPage >= _pages.length) return;
  _zeigeSeite(newPage);
}

// Leere Seite hinzufügen (komplett blank — keine Felder)
function addBlankPage() {
  _seiteEinfuegen([], false);
  showToast(`✓ Leere Seite ${_currentPage + 1} von ${_pages.length} hinzugefügt`);
}

// Aktuelle Seite exportieren
async function exportCurrentPage() {
  const blob = await generateExportBlob('pdf');
  if (!blob) { showToast('Fehler beim Export'); return; }
  const today = _dayBerlin(); // Berliner Tag — s. _dayBerlin
  const suffix = _pages.length > 1 ? `_Seite${_currentPage + 1}` : '';
  const filename = `${today}_Export${suffix}.pdf`;
  _downloadBlob(blob, filename);
  showToast('✅ ' + filename + ' exportiert');
}

// Beim ersten Layout-Laden Seiten-Array initialisieren
function initPages() {
  _pages = [fields.map(f => ({ ...f }))];
  _currentPage = 0;
  updatePageNavigator();
}

// ── Füll-Zeiger (überleben den Seitenwechsel) ────────────────────────────────
let _sessionPointer = 0;
let _fillLockTimeout = null; // Timeout für Auto-Unlock nach 10 Min
let _txtSlotPointers = {}; // Persistiert über Seiten — Schlüssel = filterAsin
let _imgSlotPointers = {}; // Persistiert über Seiten — Schlüssel = filterAsin (analog _txtSlotPointers)
let _allTxtOrders = []; // Einmal gebaut, persistiert über alle Seiten

// Füll-Pointer + Pool für einen frischen Lauf zurücksetzen (fillLayoutPages, runAutoExport).
function _resetFillPointers() {
  _sessionPointer = 0;
  _txtSlotPointers = {};
  _imgSlotPointers = {};
  _allTxtOrders = [];
}

// ════════════════════════════════════════════════════════════════════════════
// SYNCHRON-MODUS — Mehrseiten-Layout = EIN Satz, gleiche Bestellungen je Slot.
// Greift, wenn ein Layout MEHRERE Seiten hat (z.B. Seite 1 = Text-1-Felder / vorne,
// Seite 2 = Text-2-Felder / hinten). Slot p ist auf JEDER Seite dieselbe Bestellung;
// jedes Feld zeigt den Text seiner Gravur-Nummer (palNum → texts[palNum-1]).
// Bei Überlauf wird der ganze Satz geklont (Charge B = größte Seite).
// ════════════════════════════════════════════════════════════════════════════

// Slot-Anzahl = max. Felder pro palNum, je Typ UND Gravur-Nr. getrennt (Nummernfelder zählen nicht zu
// den Texten). Array-Kopien zählen nicht als eigene Plätze.
function syncSlotCount(pageFields) {
  const n = {};
  for (const f of pageFields) {
    if (!f.arrayOf && ['text', 'number', 'image'].includes(f.type)) n[f.type + f.palNum] = (n[f.type + f.palNum] || 0) + 1;
  }
  return Math.max(0, ...Object.values(n));
}

// Unterscheidet "echtes Synchron-Layout" (z.B. Vorderseite=palNum 1, Rückseite=palNum 2)
// von einem reinen Seitenstapel (mehrere identische Seiten zur Massenproduktion).
// Heuristik: Synchron NUR, wenn sich die palNum-Verteilung zwischen den Seiten unterscheidet.
// Bei identischer Verteilung ist es ein Stapel → normaler Multi-Page-Pfad ist richtig.
function isSyncedLayout(pages) {
  if (!pages || pages.length < 2) return false;
  const sig = pg => {
    const counts = {};
    pg.forEach(f => {
      if (f.type === 'static' || f.arrayOf) return; // Kopien ändern die Struktur nicht
      const k = `${f.type}:${f.palNum || 1}`;
      counts[k] = (counts[k] || 0) + 1;
    });
    return Object.keys(counts).sort().map(k => `${k}=${counts[k]}`).join(',');
  };
  const sigs = pages.map(sig);
  return !sigs.every(s => s === sigs[0]);
}

// Nach palNum gruppieren, je Gruppe stabil nach Position (y, dann x)
function syncGroupByPal(pageFields, type) {
  const m = {};
  pageFields.filter(f => f.type === type && !f.arrayOf).forEach(f => { (m[f.palNum] = m[f.palNum] || []).push(f); });
  Object.values(m).forEach(g => g.sort(_nachPosition));
  return m;
}

// Slot-Schleife über eine Feldgruppe: je palNum-Block bekommt Slot p den Auftrag
// orders[base+p], das Feld zeigt texts[palNum-1]. Gemeinsam für Text, Bild und Nummer.
// onEmpty greift, wenn für den Slot kein Auftrag da ist.
async function _forEachSyncSlot(pageFields, type, orders, base, apply, onEmpty) {
  const byPal = syncGroupByPal(pageFields, type);
  let filled = 0;
  for (const palNum of Object.keys(byPal)) {
    const g = byPal[palNum];
    for (let p = 0; p < g.length; p++) {
      const order = orders[base + p];
      if (!order) { if (onEmpty) onEmpty(g[p]); continue; } // kein Auftrag → Slot bleibt leer
      await apply(g[p], order, palNum);
      filled++;
    }
  }
  return filled;
}

async function fillSyncedPage(pageFields, orders, base, textCache) {
  _clearFieldData(pageFields);
  const showDash = getShowDash();
  let filled = 0;
  filled += await _forEachSyncSlot(pageFields, 'text', orders, base, async (field, order, palNum) => {
    const cached = textCache[_orderKey(order)] || { texts: [], fonts: [] };
    await _applyTextToField(field, order, cached.texts, cached.fonts, parseInt(palNum) - 1, showDash);
  });
  filled += await _forEachSyncSlot(pageFields, 'image', orders, base, async (field, order) => {
    field.orderId = order.id;
    field._ddKey = _orderKey(order);
    if (field.ddWenn && !_ddBedingungOk(field, _ddCache.get(field._ddKey))) return;
    await loadImg(field, order);
  });
  // Nummer-Felder zeigen einen Teil der Bestellnummer und werden ohne Auftrag
  // ausdrücklich geleert (die anderen Typen hat _clearFieldData oben schon erledigt).
  filled += await _forEachSyncSlot(pageFields, 'number', orders, base,
    (nf, order) => _applyNumberToField(nf, order.id),
    nf => { nf._text = ''; nf.orderId = null; });
  // Regel-Motive an ihre Plätze binden (Motiv k ↔ Auftrag base+k, wie jede andere Feldgruppe)
  _ddRegelMotive(pageFields).forEach((m, k) => {
    const o = orders[base + k];
    if (o) { m.orderId = o.id; m._ddKey = _orderKey(o); filled++; }
  });
  _ddMotiveSetzen(pageFields);  // Dropdown-Motive: je Platz das Motiv zur Antwort
  _syncArrayClones(pageFields); // Array-Kopien = Inhalt ihres Masters
  return filled;
}

// Bestell-Pool für den Synchron-Modus: sortiert, qty-expandiert, ASIN-gefiltert,
// optional Skip-Empty. Liefert { orders, textCache, batchSize }.
// Es gilt EIN ASIN-Filter fürs ganze Layout (alle Seiten zeigen dieselbe Bestellung) —
// bei widersprüchlichen Feld-ASINs wird gewarnt statt still ignoriert.
async function buildSyncedPool(templatePages) {
  const useQty = _fillCfg.useQty;
  const allFields = templatePages.flat();
  const distinctAsins = [...new Set(allFields.map(f => f.filterAsin).filter(Boolean))];
  const layoutAsin = getSingleAsinMode() ? getGlobalAsin() : (distinctAsins[0] || '');
  if (!getSingleAsinMode() && distinctAsins.length > 1) {
    showToast(`⚠️ Synchron-Layout: unterschiedliche ASIN-Filter gefunden (${distinctAsins.join(', ')}) — da alle Seiten dieselbe Bestellung zeigen, wird nur "${layoutAsin}" verwendet.`, 6000);
  }

  let pool = getFillDateFilteredOrders()
    .sort(_orderSort);
  const afterDate = pool.length;
  if (layoutAsin) pool = pool.filter(o => o.asin === layoutAsin);
  const afterAsin = pool.length;

  const orders = _expandByQty(pool, useQty);

  const textCache = {};
  await _loadTextCache(orders, textCache, null);

  // Skip-Empty gilt kombiniert für alle im Layout vorkommenden Feldtypen — ein
  // Slot teilt sich Text-, Bild- und Zahlenfelder, daher muss die Bestellung für
  // JEDEN vorhandenen Typ "nicht leer" sein, sonst würde z.B. ein Bildfeld trotz
  // aktivem "Überspringen" mit einer bildlosen Bestellung belegt.
  const hasTextFields = allFields.some(f => f.type === 'text' || f.type === 'number');
  const hasImageFields = allFields.some(f => f.type === 'image');
  const skipTxt = getSkipEmpty() && hasTextFields;
  const skipImg = getSkipEmpty() && hasImageFields;

  let finalOrders = orders;
  if (skipTxt || skipImg) {
    finalOrders = orders.filter(o => {
      const c = textCache[_orderKey(o)];
      const textOk = !skipTxt || (c && c.texts.some(t => t && t.trim()));
      const imgOk = !skipImg || _orderHasImage(o);
      return textOk && imgOk;
    });
  }

  const batchSize = Math.max(...templatePages.map(syncSlotCount), 1);
  console.log('[Synchron-Pool] nach Datums-Filter:', afterDate,
    '| nach ASIN-Filter (' + (layoutAsin || '—') + '):', afterAsin,
    '| qty-expandiert:', orders.length,
    '| nach Skip-Empty (Text:', skipTxt, 'Bild:', skipImg, '):', finalOrders.length,
    '| batchSize:', batchSize);
  return { orders: finalOrders, textCache, batchSize };
}

// ── Zentrale Füll-Logik (manueller Knopf UND Auto-Export) ────────────────────
// Reine Logik ohne UI: DOM-Filter + sessionOrders setzt der Aufrufer vorher.
// Rückgabe: { pages, filledOrderIds, mode: 'synchron'|'stapel'|'empty', diagnose }
async function fillLayoutPages(templates) {
  if (!templates || !templates.length) {
    return { pages: [], filledOrderIds: [], mode: 'empty', diagnose: {} };
  }
  // Session EINMAL hier laden (für Synchron UND Stapel) — der Filter nimmt sie wörtlich.
  if ((_fillCfg.datePreset || 'session') === 'session' && !sessionOrders.length) await loadSession();
  // Dropdown-Antworten aller Bestellungen des Zeitraums vorab lesen: davon hängen ab, wer
  // überhaupt in den Pool kommt (getFillDateFilteredOrders) und was Dropdown-Felder zeigen.
  await _ddVorbereiten(_fillDateFilteredOrders());
  if (templates.some(pg => pg.some(f => _istMotiv(f) && f.ddFrage))) await _ddMotivListeLaden(true);

  // Saubere Vorlagen-Kopien (keine alten _img/_text/orderId-Reste)
  const tpls = templates.map(pg => pg.map(f => ({ ...f, _img: null, _text: null, orderId: null })));

  // Synchron: mehrere Seiten mit UNTERSCHIEDLICHEN palNum-Verteilungen (Vorderseite
  // palNum 1, Rückseite palNum 2 — derselbe Auftrag, andere Texte)
  if (tpls.length > 1 && isSyncedLayout(tpls)) {
    const { orders, textCache, batchSize } = await buildSyncedPool(tpls);

    if (!orders.length) {
      return { pages: tpls, filledOrderIds: [], mode: 'synchron', diagnose: { reason: 'no-orders' } };
    }

    const K = tpls.length;
    const out = [];
    const filledIds = new Set();
    for (let base = 0; base < orders.length; base += batchSize) {
      let unitFilled = 0;
      const unitStart = out.length;
      for (let k = 0; k < K; k++) {
        const inst = tpls[k].map(f => ({ ...f, id: ++idc, _img: null, _text: null, orderId: null }));
        unitFilled += await fillSyncedPage(inst, orders, base, textCache);
        out.push(inst);
        inst.forEach(f => { if (f.orderId) filledIds.add(f.orderId); });
      }
      if (unitFilled === 0) { out.splice(unitStart, K); break; } // leere Charge verwerfen
    }

    if (!out.length) {
      return { pages: tpls, filledOrderIds: [], mode: 'synchron', diagnose: { reason: 'fill-failed' } };
    }

    return {
      pages: out, filledOrderIds: [...filledIds], mode: 'synchron',
      diagnose: { sets: Math.ceil(out.length / K), batchSize, ordersInPool: orders.length }
    };
  }

  // Stapel: eine Seite ODER identische Seiten (Massenproduktion) → fillWithData.
  return await _fillStackPages(tpls[0]);
}

// Stapel/Multi-Page: dieselbe Seitenvorlage wird mehrfach gefüllt bis Pool leer
// oder MAX_PAGES erreicht. _fillCfg.multiPage=false → genau eine Seite.
async function _fillStackPages(template) {
  const MAX_PAGES = 50;
  const out = [];
  const filledIds = new Set();

  // Pointer + Pool sauber initialisieren (zentral in _resetFillPointers)
  _resetFillPointers();

  const useQty = _fillCfg.useQty;
  const allSorted = getFillDateFilteredOrders().sort(_orderSort);
  _allTxtOrders = _expandByQty(allSorted, useQty);
  window._currentSessionTotal = allSorted.length;

  // fillWithData soll _allTxtOrders NICHT leeren (es ist bereits gebaut)

  // Globale 'fields' auf Template setzen — fillWithData arbeitet auf 'fields'
  fields = template.map(f => ({ ...f, _img: null, _text: null, orderId: null }));

  let pageNum = 1;
  let uebrig = false;   // „Automatisch mehrseitig" aus, aber Bestellungen übrig (s. runAutoExport)
  while (pageNum <= MAX_PAGES) {
    _clearFieldData(fields);

    const pointerBefore = _sessionPointer;
    const txtPointersBefore = JSON.stringify(_txtSlotPointers);
    const imgPointersBefore = JSON.stringify(_imgSlotPointers);

    await fillWithData(pageNum > 1);

    const pageSnapshot = fields.map(f => ({ ...f }));
    const filledCount = pageSnapshot.filter(f => f.orderId).length;
    // ALLE drei Pointer prüfen — bei reinen Bild-Layouts bewegt sich nur _imgSlotPointers
    const pointerAdvanced = _sessionPointer > pointerBefore
      || JSON.stringify(_txtSlotPointers) !== txtPointersBefore
      || JSON.stringify(_imgSlotPointers) !== imgPointersBefore;

    if (filledCount === 0 || !pointerAdvanced) break;

    pageSnapshot.forEach(f => { if (f.orderId) filledIds.add(f.orderId); });
    out.push(pageSnapshot);

    if (!_fillCfg.multiPage) { uebrig = _stackHasMore(); break; }
    if (!_stackHasMore()) break;

    pageNum++;

    // Neue Seite anlegen: Template mit frischen IDs
    fields = template.map(f => ({ ...f, id: ++idc, _img: null, _text: null, orderId: null }));
  }
  // Grenze erreicht, obwohl noch Bestellungen da sind → laut melden (status.txt), nicht still.
  const abgeschnitten = pageNum > MAX_PAGES;
  if (abgeschnitten) console.error(`Füllen: mehr als ${MAX_PAGES} Seiten — weitere Bestellungen NICHT gefüllt`);

  return {
    pages: out,
    filledOrderIds: [...filledIds],
    mode: 'stapel',
    diagnose: { pages: out.length, poolSize: _allTxtOrders.length, abgeschnitten, uebrig }
  };
}

// Gibt es noch unverbrauchte Bestellungen für das aktuelle Layout?
function _stackHasMore() {
  const layoutHasImg = fields.some(f => f.type === 'image');
  // Nummernfelder zählen NICHT als Text — sie leiten ihre Bestellung nur ab und
  // rücken keinen eigenen Pointer vor (sonst Dauerschleife bei Bild+Nummer-Layouts)
  // Misch-Layout (Bild + Text, z. B. F02_xxx_V5_PNG): die Texte hängen am Foto desselben Platzes,
  // der Text-Pointer bleibt ungenutzt (s. fillWithData) — übrig ist dann nur, was die Bild-Pointer
  // übrig lassen. Sonst meldete jedes solche Layout mit „mehrseitig aus“ fälschlich „Blatt voll“.
  const layoutHasTxt = !layoutHasImg && fields.some(f => f.type === 'text');
  let imgHasMore = false;
  if (layoutHasImg) {
    const ptrs = window._lastImgOrderPointers || {};
    const counts = window._lastImgCandidateCounts || {};
    for (const asin in counts) {
      if ((ptrs[asin] || 0) < counts[asin]) { imgHasMore = true; break; }
    }
  }
  let txtHasMore = false;
  if (layoutHasTxt) {
    const txtFields = fields.filter(f => f.type === 'text' && !f.arrayOf);
    const usedAsins = new Set(txtFields.map(f => getSingleAsinMode() ? getGlobalAsin() : (f.filterAsin || '')));
    for (const asin of usedAsins) {
      const available = asin ? _allTxtOrders.filter(o => o.asin === asin).length : _allTxtOrders.length;
      const used = _txtSlotPointers[asin] || 0;
      if (used < available) { txtHasMore = true; break; }
    }
  }
  return imgHasMore || txtHasMore;
}

// ── Automatisch alle Seiten füllen ───────────────────────────────────────────
async function fillAllPagesAuto() {
  window._lastFillResult = null; // wird nur bei Erfolg gesetzt (Füllen+Export prüft das)
  const fillBtn = document.getElementById('fill-btn');
  const prevPageBtn = document.getElementById('prev-page-btn');
  const nextPageBtn = document.getElementById('next-page-btn');
  // Sperren/Freigeben von Knopf + Seiten-Navigation an EINER Stelle (Start,
  // Sicherheits-Timeout und _unlock müssen exakt gegenläufig bleiben).
  const _setFillLock = (locked) => {
    if (fillBtn) { fillBtn.disabled = locked; fillBtn.textContent = locked ? '⏳ Füllt…' : 'Füllen'; }
    if (prevPageBtn) prevPageBtn.disabled = locked;
    if (nextPageBtn) nextPageBtn.disabled = locked;
  };
  _setFillLock(true);
  // Sicherheits-Timeout: nach 10 Minuten automatisch entsperren
  _fillLockTimeout = setTimeout(() => {
    _setFillLock(false);
    showToast('⚠️ Füllen Timeout — bitte erneut starten', 4000);
  }, 10 * 60 * 1000);

  // Gefüllt wird aus _pages, editiert wird in `fields` — ohne diesen Abgleich ignoriert
  // das Füllen ungespeicherte Änderungen (ein frisch erstelltes Array z.B. füllte nur
  // den Master, weil saveUndo den Stand VOR den Kopien gesichert hat).
  if (_pages.length === 0) _pages = [fields.map(f => ({ ...f }))];
  else saveCurrentPageSnapshot();

  // Original merken (Schutz: bei 0 Treffern wird die User-Struktur erhalten)
  const _origPages = _pages.map(pg => pg.map(f => ({ ...f, _img: null, _text: null, orderId: null })));

  // Helper: UI nach Abschluss freigeben
  const _unlock = () => { clearTimeout(_fillLockTimeout); _setFillLock(false); };

  let result;
  try {
    result = await fillLayoutPages(_origPages);
  } catch (e) {
    console.error('Füllen Fehler:', e);
    _unlock();
    showToast('⚠️ Füllen Fehler: ' + e.message, 4000);
    return;
  }

  // Bei 0 Treffern: Original-Layout erhalten, Meldung anzeigen, sonst nichts ändern
  if (!result.filledOrderIds.length) {
    _unlock();
    const why = result.diagnose?.reason === 'fill-failed'
      ? '⚠️ Bestellungen vorhanden, aber keine konnte gefüllt werden (Texte/Bilder fehlen?) — Layout unverändert'
      : '⚠️ Keine passenden Bestellungen im gewählten Zeitraum/ASIN-Filter — Layout unverändert';
    showToast(why, 5000);
    return;
  }

  // Ergebnis in den UI-State übernehmen
  _pages = result.pages;
  _currentPage = 0;
  fields = _pages[0].map(f => ({ ...f }));
  recalcIdc();
  updatePageNavigator();
  scheduleRender();
  _unlock();
  window._lastFillResult = result; // für „Füllen + Export" (gemeinsamer Füll-Pfad)

  // Toast je nach Modus
  if (result.mode === 'synchron') {
    const { sets, batchSize, ordersInPool } = result.diagnose;
    showToast(`✅ Synchron gefüllt: ${result.pages.length} Seite(n) · ${sets} Satz/Sätze · ${Math.min(ordersInPool, sets * batchSize)} Bestellungen`, 4000);
  } else {
    const remaining = (window._currentSessionTotal || 0) - _sessionPointer;
    if (_fillCfg.multiPage) {
      showToast(`✅ ${result.pages.length} Seite(n) gefüllt${remaining > 0 ? ` · ${remaining} Bestellungen übrig` : ' · Alle erledigt'}`);
    } else {
      showToast(`✅ Seite gefüllt${remaining > 0 ? ` · ${remaining} weitere Bestellungen` : ''}`);
    }
  }
}

// ── Fit Page ──────────────────────────────────────────────────────────────────
function fitPage() {
  const area = document.getElementById('canvas-area');
  const p = getPg();
  const pw = p.w * MM;
  const ph = p.h * MM;
  const aw = area.clientWidth - 80;
  const ah = area.clientHeight - 80;
  const z = Math.min(aw / pw, ah / ph);
  setZoom(z);
  showToast('⊡ Seite eingepasst');
}

// ── Zoom ──────────────────────────────────────────────────────────────────────
function setZoom(z) {
  zoom = Math.max(0.1, Math.min(5, parseFloat(z)));
  document.getElementById('zl').textContent = Math.round(zoom * 100) + '%';
  updateCanvas();
}

// ── Übersicht / Statistik ─────────────────────────────────────────────────────
// Kennzahlen-Karten, 7-Tage-Balken, „Heute"/„Gestern" und die letzten Aktivitäten.
const _OV_COLORS = { download: 'var(--accent)', export: 'var(--green)', error: 'var(--red)', info: 'var(--text-muted)' };

async function loadOverview() {
  const el = document.getElementById('overview-content');
  if (!el) return;

  let activities = [], layouts = [];
  try { activities = await _apiJson('/v2/activity'); } catch (e) { }
  try { layouts = await getServerLayouts(); } catch (e) { }
  if (!Array.isArray(activities)) activities = [];
  if (!Array.isArray(layouts)) layouts = [];

  const today = _dayBerlin();
  const sumCount = arr => arr.reduce((s, a) => s + (a.count || 0), 0);
  const amTag = (typ, tag) => activities.filter(a => a.type === typ && a.date === tag);
  // Kennzahlen eines Berlin-Tags für die Zeilen „Heute"/„Gestern": Geladen, Exporte, Fehler
  const tagesZahlen = tag => [sumCount(amTag('download', tag)), amTag('export', tag).length, amTag('error', tag).length];
  const autoLayouts = layouts.filter(l => l.autoExport).length;

  // Letzte 7 Tage: Download-Bestellungen pro Tag (für Balken)
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(_dayBerlin(i));
  const dlByDay = days.map(d => sumCount(amTag('download', d)));
  const maxDl = Math.max(1, ...dlByDay);

  el.innerHTML = '';

  // ── Kennzahlen-Karten ──
  // FARBREGEL DIESES REITERS — bitte so halten:
  //   Akzent (Kobalt) = LADEN · Grün = EXPORT · Grau = Struktur, weder noch
  // Dieselbe Zuordnung nutzen „Heute"/„Gestern" und die Aktivitätenliste (_OV_COLORS).
  const cards = [
    { num: sessionOrders.length, lbl: 'Im Lauf', col: 'var(--accent)' },
    { num: orders.length, lbl: 'Im Ordner', col: 'var(--accent)' },
    { num: layouts.length, lbl: 'Layouts', col: 'var(--accent)' },
    { num: autoLayouts, lbl: 'Auto-Export', col: 'var(--green)' },
  ];
  const grid = document.createElement('div');
  grid.className = 'ov-grid';
  // Eine Kachel (Zahl, Beschriftung); klein = Tages-Zeile. Text immer per textContent.
  const _ovKarte = (c, klein) => {
    const card = document.createElement('div');
    card.className = 'ov-card';
    if (klein) card.style.padding = '10px';
    card.innerHTML = `<div class="ov-num"${klein ? ' style="font-size:18px;"' : ''}></div><div class="ov-lbl"></div>`;
    const numEl = card.querySelector('.ov-num');
    numEl.style.color = c.col;
    numEl.textContent = c.num;
    card.querySelector('.ov-lbl').textContent = c.lbl;
    return card;
  };
  // ── Tages-Zeile "Heute"/"Gestern" (Geladen / Exporte / Fehler) — unter „Zu prüfen heute" ──
  const _ovTitle = (text) => {
    const t = document.createElement('div');
    t.className = 'ov-sec-title';
    t.textContent = text;
    el.appendChild(t);
  };
  const _ovDayRow = (title, dl, exp, err) => {
    _ovTitle(title);
    const row = document.createElement('div');
    row.className = 'ov-grid';
    row.style.gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
    [
      { num: dl, lbl: 'Geladen', col: 'var(--accent)' },
      { num: exp, lbl: 'Exporte', col: 'var(--green)' },
      { num: err, lbl: 'Fehler', col: err ? 'var(--red)' : 'var(--text-muted)' },
    ].forEach(c => row.appendChild(_ovKarte(c, true)));
    el.appendChild(row);
  };
  // ── Zu prüfen heute (17.10.2026): Fehler und ⚠-Hinweise aus Abruf und Export — gingen vorher im
  //    Strom aus „exportiert" unter (z. B. „Rückseite bezahlt, aber nichts eingegeben"). Klick kopiert die Nr.
  const pruef = activities.filter(a => a.date === today && (a.type === 'error' || (a.type === 'info' && /^⚠/.test(a.message || ''))));
  _ovTitle(pruef.length ? `Zu prüfen heute · ${pruef.length}` : 'Zu prüfen heute');
  const pk = document.createElement('div');
  pk.className = 'ov-pruef';
  if (!pruef.length) pk.innerHTML = '<div class="ov-pruef-leer">✓ Nichts zu prüfen</div>';
  for (const a of pruef) {
    const z = document.createElement('div');
    z.className = 'ov-pruef-zeile' + (a.type === 'error' ? ' fehler' : '');
    const zeit = document.createElement('span'); zeit.className = 'ov-pruef-zeit'; zeit.textContent = a.time || '';
    const txt = document.createElement('span'); txt.textContent = String(a.message || '').replace(/^⚠\s*/, '');
    z.append(zeit, txt);
    const nr = String(a.message || '').match(/\d{3}-\d{7}-\d{7}/);
    if (nr) { z.classList.add('kopierbar'); z.title = 'Klick kopiert ' + nr[0]; z.onclick = () => _copyText(nr[0]); }
    pk.appendChild(z);
  }
  el.appendChild(pk);

  _ovDayRow('Heute', ...tagesZahlen(today));
  _ovDayRow('Gestern', ...tagesZahlen(_dayBerlin(1)));

  // ── 7-Tage-Balken (Downloads) ──
  _ovTitle('Geladen — letzte 7 Tage');
  const barWrap = document.createElement('div');
  barWrap.className = 'ov-bar-row';
  days.forEach((d, i) => {
    const col = document.createElement('div');
    col.style.cssText = 'flex:1;display:flex;flex-direction:column;align-items:center;gap:3px;';
    const bar = document.createElement('div');
    bar.className = 'ov-bar';
    bar.style.height = Math.round((dlByDay[i] / maxDl) * 50) + 'px';
    if (d === today) bar.style.background = 'var(--green)';
    bar.title = `${d}: ${dlByDay[i]} Bestellungen`;
    const lbl = document.createElement('div');
    lbl.style.cssText = 'font-size:var(--fs-mikro);color:var(--text-muted);';
    lbl.textContent = DAYS_DE[new Date(d + 'T12:00:00').getDay()];
    const val = document.createElement('div');
    val.style.cssText = 'font-size:var(--fs-mikro);color:var(--text-dim);';
    val.textContent = dlByDay[i] || '';
    col.appendChild(val); col.appendChild(bar); col.appendChild(lbl);
    barWrap.appendChild(col);
  });
  el.appendChild(barWrap);

  // ── Bestand (Bestellungen, Layouts, Auto-Export) — unter den Tageszahlen ──
  _ovTitle('Bestand');
  cards.forEach(c => grid.appendChild(_ovKarte(c)));
  el.appendChild(grid);

  // ── Letzte Aktivitäten (kompakt, XSS-sicher via textContent) ──
  _ovTitle('Letzte Aktivitäten');
  if (!activities.length) {
    const empty = document.createElement('div');
    empty.style.cssText = 'color:var(--text-muted);font-size:var(--fs-klein);text-align:center;padding:14px;';
    empty.textContent = 'Noch keine Aktivitäten';
    el.appendChild(empty);
  } else {
    activities.slice(0, 12).forEach(a => {
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;gap:8px;align-items:flex-start;padding:4px 0;border-bottom:1px solid var(--border);';
      const t = document.createElement('span');
      // flex-shrink:0 ist Pflicht: min-width allein erlaubt dem Flex-Kind, unter seinen
      // Inhalt zu schrumpfen, und der Zeitstempel lief quer über den Meldungstext.
      // Kurzdatum „26.08." hält die Spalte schmal; heutige Einträge zeigen nur die Uhrzeit.
      t.style.cssText = 'font-size:var(--fs-mikro);color:var(--text-muted);white-space:nowrap;min-width:74px;flex-shrink:0;';
      const kurzDatum = (d) => {
        const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(d || '');
        return m ? `${m[3]}.${m[2]}.` : (d || '');
      };
      t.textContent = `${a.date === today ? '' : kurzDatum(a.date) + ' '}${a.time || ''}`.trim();
      const m = document.createElement('span');
      const safeType = Object.prototype.hasOwnProperty.call(_OV_COLORS, a.type) ? a.type : 'info';
      // overflow-wrap: Dateinamen wie „FL01_Gemi_M10_3588323_Seite1" sind EIN Wort ohne
      // Trennstelle und würden sonst am Panelrand abgeschnitten.
      m.style.cssText = `font-size:var(--fs-klein);color:${_OV_COLORS[safeType]};min-width:0;overflow-wrap:anywhere;`;
      m.textContent = a.message;
      row.appendChild(t); row.appendChild(m);
      el.appendChild(row);
    });
  }
}

// Auto-refresh wenn Übersicht-Tab aktiv
setInterval(() => {
  // Berechneter Stil (s. _popIsOpen): der Reiter ist per CSS versteckt, sein Inline-Stil leer —
  // vorher lud die Übersicht deshalb dauernd, auch im Puppeteer-Export.
  if (!IS_AUTOEXPORT && _popIsOpen(document.getElementById('tab-overview'))) loadOverview();
}, 30 * 1000);

// ── Server-JSON-Stores (Layouts + Ordner + Laser-Presets) ────────────────────
// EINE Fabrik für alle Array-Stores.
// load: HTTP-Fehler/korrupt NICHT als "leer" werten (der nächste Save überschriebe sonst
//   alles), sondern aufs lokale Backup ausweichen.
// save: Backup best-effort — ein localStorage-QuotaExceeded darf den POST nie verhindern;
//   fetch wirft bei HTTP-Fehlern NICHT, also selbst prüfen.
// ETag/If-Match gegen verlorene Änderungen: jede Mutation schreibt das GANZE Array zurück,
//   zwei offene Tabs überschrieben sich sonst. Bei 409 wird der Nutzer informiert und die
//   Ansicht neu geladen — nicht stillschweigend scheitern.
function _makeServerStore(route, lsKey, fallbackToast, label) {
  let _etag = null;
  // Zuletzt aus dem lokalen Backup statt vom Server geladen? Dann darf NICHTS zurück auf den
  // Server: jeder Aufrufer lädt, ändert und speichert das GANZE Array — ohne ETag ginge die alte
  // (in einem frischen Browser LEERE) Kopie ungeprüft über die echten Daten.
  let _ausBackup = false;
  return {
    get ausBackup() { return _ausBackup; },
    async load() {
      try {
        const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
        const loadHeaders = token ? { Authorization: `Bearer ${token}` } : {};
        const targetUrl = `${BASE_URL}${route.startsWith('/') ? route : '/' + route}`.replace(/([^:]\/)\/+/g, '$1').replace(/\/v2\/v2\//g, '/v2/');
        const res = await fetch(targetUrl, { headers: loadHeaders, credentials: 'include' });
        if (res.status === 401 && !IS_AUTOEXPORT) {
          localStorage.removeItem('jwt_access_token');
          localStorage.removeItem('token');
          window.location.replace('/login.html');
          return [];
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const data = await res.json();
        if (!Array.isArray(data)) throw new Error('Unerwartete Antwort');
        _etag = res.headers.get('ETag'); // null = Server ohne ETag → Verhalten wie bisher
        _ausBackup = false;
        return data;
      } catch (e) {
        _etag = null; // aus dem Backup geladen → kein gültiger Stand zum Vergleichen
        _ausBackup = true;
        if (fallbackToast) showToast(fallbackToast, 5000);
        try { const b = JSON.parse(localStorage.getItem(lsKey) || '[]'); return Array.isArray(b) ? b : []; }
        catch (_) { return []; }
      }
    },
    async save(data) {
      if (_ausBackup) {
        showToast(`⚠️ ${label || 'Daten'}: der Stand vom Server ist nicht geladen — Speichern gesperrt, damit nichts überschrieben wird. Bitte die Seite neu laden.`, 9000);
        return false;
      }
      try { localStorage.setItem(lsKey, JSON.stringify(data)); }
      catch (e) { console.warn(`Lokales ${lsKey}-Backup fehlgeschlagen:`, e); }
      try {
        const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
        const postHeaders = Object.assign(
          { 'Content-Type': 'application/json' },
          _etag ? { 'If-Match': _etag } : {},
          token ? { Authorization: `Bearer ${token}` } : {}
        );
        const targetUrl = `${BASE_URL}${route.startsWith('/') ? route : '/' + route}`.replace(/([^:]\/)\/+/g, '$1').replace(/\/v2\/v2\//g, '/v2/');
        const res = await fetch(targetUrl, {
          method: 'POST',
          headers: postHeaders,
          credentials: 'include',
          body: JSON.stringify(data),
        });
        if (res.status === 401 && !IS_AUTOEXPORT) {
          localStorage.removeItem('jwt_access_token');
          localStorage.removeItem('token');
          window.location.replace('/login.html');
          return false;
        }
        if (res.status === 409) {
          _etag = null; // erzwingt beim nächsten load() einen frischen Stand
          showToast(`⚠️ ${label || 'Daten'} wurden in einem anderen Tab geändert — deine Änderung wurde NICHT gespeichert. Ansicht wird neu geladen, bitte erneut ausführen.`, 9000);
          _savedDataCache = null;
          try { await renderSaved(); } catch (_) { }
          return false;
        }
        if (!res.ok) throw new Error('HTTP ' + res.status);
        _etag = res.headers.get('ETag'); // frisches ETag → gleicher Tab kann weiterspeichern
        return true;
      } catch (e) {
        // Der Store meldet selbst; Aufrufer prüfen nur noch das Ergebnis.
        console.error(`${lsKey} speichern fehlgeschlagen:`, e);
        showToast(`⚠️ ${label || 'Daten'} konnten nicht gespeichert werden (${e.message}) — Änderung ist NICHT übernommen.`, 7000);
        return false;
      }
    },
  };
}
const _layoutStore = _makeServerStore('/v2/layouts', 'layouts', '⚠️ Layouts vom Server nicht lesbar — lokales Backup geladen', 'Layouts');
const _folderStore = _makeServerStore('/v2/folders', 'folders', null, 'Ordner');
const _laserPresetStore = _makeServerStore('/v2/laser-presets', 'laser-presets', null, 'Laser-Presets');
// Dünne Wrapper — alle bestehenden Aufrufer bleiben unverändert
const getServerLayouts = () => _layoutStore.load();
const saveServerLayouts = (layouts) => _layoutStore.save(layouts);
const getServerFolders = () => _folderStore.load();
const saveServerFolders = (folders) => _folderStore.save(folders);

// Feld für die Ablage in layouts.json entschlacken. Der Session-Zustand gehört NICHT in eine Vorlage:
// jeder Loader setzt _img/_text/_imgSrc/_placement/orderId beim Laden ohnehin zurück
// (_applyLayoutState → clean), und layouts.json wird bei jeder Änderung komplett neu geschrieben.
// orderId fliegt immer raus (Bestellnummern haben in einer Vorlage nichts verloren);
// numChars/numFrom liest ausschließlich der Nummern-Pfad.
function _stripFieldForSave(f) {
  const o = { ...f };
  delete o._img; delete o._text; delete o._imgSrc; delete o._placement; delete o.orderId;
  delete o._ddKey; delete o._motivDatei; delete o._ddLeer; delete o._ddAus;
  // Motiv-Pfade sind Cache, nicht Layout — gespeichert wird nur der Dateiname.
  delete o._pfade;
  if (o.type !== 'number') { delete o.numChars; delete o.numFrom; }
  return o;
}

// Blattgröße so, wie sie im Layout gespeichert wird (Werte der Eingabefelder).
const _blattFuerLayout = () => ({
  w: document.getElementById('pw').value, h: document.getElementById('ph').value,
  m: document.getElementById('pm').value
});

// 💾 Speichern. Ist ein Layout geladen, fragt der Knopf: dieses Layout überschreiben oder ein
// neues anlegen. Bis 08.10.2026 legte er IMMER ein neues an — ohne Ordner, Format, Auto-Export
// und Vorlagen-Ordner —, und der Editor arbeitete danach weiter auf dem alten: „Ins Layout
// übernehmen" und „Füllen + Export" trafen das Original, nicht das Gespeicherte.
async function saveLayout() {
  // Aktuelle Seite zuerst in _pages sichern
  saveCurrentPageSnapshot();
  if (_loadedLayout) {
    const wahl = await choiceModal('Layout speichern',
      `Die Felder in „${_loadedLayout.name}" überschreiben oder als neues Layout speichern?`,
      'Überschreiben', 'Als neues Layout');
    if (!wahl) return;
    if (wahl === 'this') return _layoutUeberschreiben();
  }
  let name = await promptModal('Layout speichern', 'Name für das Layout:', 'Layout ' + new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' }));
  if (!name || !name.trim()) return;
  // Führende/abschließende Leerzeichen entfernen — " FL01_…" erzeugte sonst
  // unsichtbare Duplikate neben "FL01_…" (Doppel-Produktion bei Auto-Export)
  name = name.trim();
  const saved = await getServerLayouts();
  // Namen sind Schlüssel: die Reklamation wählt Layouts über den Namen und nähme bei zwei
  // gleichnamigen beide.
  if (saved.some(l => l.name === name)) {
    showToast(`⚠️ „${name}" gibt es schon — anderen Namen wählen oder das Layout laden und überschreiben`, 6000);
    return;
  }
  const layout = {
    id: Date.now(),
    name,
    date: new Date().toISOString(),
    dlPreset: document.getElementById('dl-preset')?.value || 'today',
    dlStatus: document.getElementById('dl-status')?.value || 'Unshipped',
    page: _blattFuerLayout(),
    // Alle Seiten speichern. `fields` (aktuelle Seite) wird NICHT separat gespeichert — es wäre ein
    // 1:1-Duplikat von pages[currentPage]. _imgSrc/_placement sind session-spezifisch (absolute Bild-URL)
    // — niemals mitspeichern, sonst rendern alte Layouts veraltete/cross-origin Bilder.
    pages: _pages.map(pg => pg.map(_stripFieldForSave)),
    currentPage: _currentPage,
    // Laser-Einstellungen mitspeichern — sonst startet das neue Layout beim Auto-Export
    // wieder bei den Defaults statt bei dem, was im Laser-Tab eingestellt ist.
    ditherSettings: _laserSettings(ditherSettings),
  };
  // Füll-Verhalten 1:1 aus der zentralen _fillCfg — über die EINE Feld-Tabelle
  // (_FILL_FIELDS), dieselbe Schreiblogik wie „ins Layout übernehmen".
  _fillCfgToLayout(layout);
  saved.push(layout);
  const ok = await saveServerLayouts(saved);
  renderSaved();
  if (ok) {
    _loadedLayout = layout;   // ab jetzt ist DAS das Layout im Editor
    _updateKopfKontext(); _updateFillDirty();
    markLayoutDirty(false); // gespeichert → keine offenen Änderungen mehr
    showToast('✅ Layout gespeichert: ' + name);
  }
}

// Felder (alle Seiten) und Blattgröße ins GELADENE Layout schreiben; alle Einstellungen bleiben.
// Laser- und Füllwerte NICHT: dafür gibt es „Ins Layout übernehmen" im Laser-Reiter bzw. beim
// Befüllen — sonst wanderte eine nur für eine Reklamation verstellte Lasereinstellung still in
// den Tageslauf. Weichen sie ab, sagt es die Meldung.
async function _layoutUeberschreiben() {
  const ok = await _updateLoadedLayout(l => {
    l.page = _blattFuerLayout();
    l.pages = _pages.map(pg => pg.map(_stripFieldForSave));
    l.currentPage = _currentPage;
  }, l => '✅ Layout „' + l.name + '" überschrieben');
  if (!ok) return;
  markLayoutDirty(false);
  renderSaved();
  const a = _laserSettings(_loadedLayout.ditherSettings), b = _laserSettings(ditherSettings);
  const offen = [];
  if (Object.keys({ ...a, ...b }).some(k => JSON.stringify(a[k]) !== JSON.stringify(b[k]))) offen.push('Laser');
  if (_fillCfgDiffersFromLayout()) offen.push('Befüllung');
  if (offen.length) showToast(`✅ Felder gespeichert · ${offen.join(' und ')} weicht vom Layout ab — dort „Ins Layout übernehmen"`, 7000);
}

// ── Projekte / Ordner ─────────────────────────────────────────────────────────
// ACHTUNG: echte Hex-Werte, KEINE var(--…)-Tokens. Diese Farben werden in folders.json
// gespeichert (sind also Daten, nicht Gestaltung), als `${c}22` um einen Alpha-Anteil
// ergänzt und als SVG-fill gesetzt — in beiden Fällen ist var() ungültig.
const FOLDER_COLORS = ['#7c6aff', '#39d98a', '#f5a623', '#ff4d6a', '#38bdf8', '#f472b6', '#a3e635', '#fb923c'];
// Anzeige-Töne zu den gespeicherten Ordnerfarben (folders.json bleibt unverändert): die Leuchtfarben
// des dunklen Stils wirkten auf Weiß grell — gezeigt wird je Farbe ein gedeckter Ton derselben Familie.
const _ORDNER_TON = {
  '#7c6aff': '#5B6BD6', '#39d98a': '#3E9B6B', '#f5a623': '#C88A1E', '#ff4d6a': '#D0565F',
  '#38bdf8': '#3F93C2', '#f472b6': '#C9638F', '#a3e635': '#7FA33A', '#fb923c': '#D27A3E'
};
const _ordnerTon = c => _ORDNER_TON[String(c || '').toLowerCase()] || c;
let _expandedGroups = new Set();   // ausgeklappte Ordner (Standard: alles eingeklappt; Name, '' = Ohne Ordner)
let _dragLayoutId = null;           // aktuell gezogenes Layout
let _newFolderColor = FOLDER_COLORS[0];

// JS-String-Literal für inline-onclick sicher escapen (Ordnernamen sind frei eingebbar)
const _jsStr = s => _esc(String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'"));

function toggleGroupCollapse(name) {
  if (_expandedGroups.has(name)) _expandedGroups.delete(name);
  else _expandedGroups.add(name);
  renderSaved(true); // reiner UI-Zustand → aus Cache, kein Server-Abruf
}

// Suche entprellen — sonst je Tastendruck 2 Server-Abrufe + kompletter Neuaufbau.
let _searchTimer = null;
function scheduleLayoutSearch() {
  clearTimeout(_searchTimer);
  _searchTimer = setTimeout(() => renderSaved(true), 200); // Filter aus Cache
}

// ASINs, deren Bestellungen ein Layout füllt — dieselbe Regel wie das Füllen: im Einzel-ASIN-Modus die
// Layout-ASIN, sonst die Feld-ASINs der Text- und Bildfelder. Leer = nimmt jede Bestellung. Genutzt von der
// Bestellzahl im Lauf (17.10.2026; Dropdown-Weichen/ddNur zählen dort nicht, die Zahl heißt „passende
// Bestellungen im Lauf", nicht „wird gefüllt"), lsAsinZeigen und den Partnern der Reklamation ohne Bestellung.
function _layoutAsinSet(l) {
  if (l.singleAsinMode ?? true) { const g = _asinNorm(l.globalAsin); return new Set(g ? [g] : []); }
  return new Set((l.pages || []).flat().filter(f => f && !f.arrayOf && (f.type === 'text' || f.type === 'image'))
    .map(f => _asinNorm(f.filterAsin)).filter(Boolean));
}
function _laufBestellungen(layouts) {
  if (!sessionOrders.length || !layouts.length) return 0;
  const asins = new Set();
  for (const l of layouts) for (const a of _layoutAsinSet(l)) asins.add(a);
  if (!asins.size) return 0;
  return new Set(sessionOrders.filter(o => asins.has(String(o.asin || '').toUpperCase())).map(o => o.id)).size;
}
const _laufTitel = n => `${n} Bestellung${n === 1 ? '' : 'en'} im aktuellen Lauf mit passender ASIN`;

// Mini-Vorschau eines Layouts (Feld-Skelett als SVG): grün=Bild, amber=Nummer/Statisch, kobalt=Text
function _layoutThumb(l) {
  const pg = (l.pages && l.pages[0]) || [];
  const W = parseFloat(l.page?.w) || 210, H = parseFloat(l.page?.h) || 297;
  const tw = 36, th = Math.max(20, Math.min(46, Math.round(tw * H / W)));
  const sx = tw / W, sy = th / H;
  // Hex, nicht var(): fill ist ein SVG-Präsentationsattribut und kennt keine CSS-Variablen.
  const col = t => t === 'image' ? '#2E8B57' : (t === 'static' || t === 'number') ? '#B7740A' : '#3B5BDB';
  const rects = (pg || []).slice(0, 150).map(f => {
    const x = Math.max(0, (f.x || 0) * sx), y = Math.max(0, (f.y || 0) * sy);
    const w = Math.max(0.6, (f.w || 0) * sx), h = Math.max(0.6, (f.h || 0) * sy);
    return `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w.toFixed(1)}" height="${h.toFixed(1)}" fill="${col(f.type)}" opacity="0.85"/>`;
  }).join('');
  return `<svg width="${tw}" height="${th}" viewBox="0 0 ${tw} ${th}" style="border:1px solid var(--border);border-radius:var(--r-xs);background:#fff;flex-shrink:0;" aria-hidden="true">${rects}</svg>`;
}

// mitThumb=false → SVG-Vorschau weglassen: in eingeklappten Ordnern sieht sie niemand, und sie war
// der größte Einzelposten im DOM. Beim Aufklappen rendert renderSaved neu.
// Eine Layout-Karte, bewusst EINZEILIG (bei vielen Layouts zählt Ruhe mehr als Vollständigkeit): Name
// oben, darunter die Kennwerte als kleine Marken; Werkzeuge und Griff erscheinen erst beim Überfahren.
// Klick auf den Körper lädt das Layout — die häufigste Handlung.
function _savedCard(l, mitThumb = true) {
  const felder = ((l.pages && (l.pages[l.currentPage || 0] || l.pages[0])) || []).length;
  const seiten = (l.pages || []).length;
  const fmt = (l.exportFormat || 'PDF').toUpperCase();
  const aktiv = !!_loadedLayout && _loadedLayout.id === l.id;
  const lauf = _laufBestellungen([l]);
  return `
    <div class="lay-karte${aktiv ? ' aktiv' : ''}" draggable="true"
         ondragstart="onLayoutDragStart(event,${l.id})" ondragend="onLayoutDragEnd(event)">
      ${mitThumb ? `<span class="lay-bild">${_layoutThumb(l)}</span>` : ''}
      <div class="lay-koerper" onclick="loadLayout(${l.id})" title="Klicken zum Laden">
        <div class="lay-name">${_esc(l.name)}</div>
        <div class="lay-meta umut10">${fmt} · ${felder} Felder${seiten > 1 ? ' · ' + seiten + ' S.' : ''}${lauf ? ` · <b class="lay-lauf" title="${_laufTitel(lauf)}">${lauf} Best.</b>` : ''}</div>
      </div>
      <span class="lay-punkt${l.autoExport ? ' an' : ''}" onclick="event.stopPropagation();toggleAutoExportDirect(${l.id})"
            title="Auto-Export ${l.autoExport ? 'an — läuft beim Bestell-Abruf mit' : 'aus — wird beim Bestell-Abruf übersprungen'}"></span>
      <div class="lay-werkzeug">
        <button class="btn btn-muted btn-xs" onclick="event.stopPropagation();openLayoutSettings(${l.id})" title="Einstellungen">⚙</button>
        <button class="btn btn-red btn-xs" onclick="event.stopPropagation();deleteSaved(${l.id})" title="Löschen">✕</button>
      </div>
    </div>`;
}

// Eine Ordner-Sektion (farbig, einklappbar, Drop-Ziel). ohneOrdner=true → Sonderform
// „Ohne Ordner": gestrichelt, kein Farbpunkt, keine Werkzeuge — sonst identisch.
function _folderSection(name, color, items, collapsed, ohneOrdner = false) {
  const c = color || '#7c6aff'; // s. FOLDER_COLORS: wird zu `${c}22` verkettet
  const ton = _ordnerTon(c), lauf = _laufBestellungen(items);
  // Die Layout-Zahl bewusst OHNE Ordnerfarbe: die Zuordnung macht der Farbpunkt — 29 in Grün neben
  // 18 in Amber las man als zwei verschiedene Dinge statt als zwei Zahlen.
  return `
    <div class="ord"${ohneOrdner ? ' style="border-style:dashed;background:none;"' : ''}
         ondragover="onFolderDragOver(event,'${c}')" ondragleave="onFolderDragLeave(event)"
         ondrop="onFolderDrop(event,'${_jsStr(name)}')">
      <div class="ord-kopf"${ohneOrdner ? ' style="background:none;"' : ''} onclick="toggleGroupCollapse('${_jsStr(name)}')">
        <span class="ord-pfeil" style="transform:rotate(${collapsed ? '-90deg' : '0deg'});">▾</span>
        ${ohneOrdner ? '' : `<span style="width:8px;height:8px;border-radius:50%;background:${ton};flex-shrink:0;box-shadow:0 0 0 3px ${ton}22;"></span>`}
        <span class="ord-name"${ohneOrdner ? ' style="font-weight:400;color:var(--text-muted);"' : ''}>${_esc(name || 'Ohne Ordner')}</span>
        ${lauf ? `<span class="ord-lauf" title="${_laufTitel(lauf)}">${lauf}</span>` : ''}
        <span class="ord-zahl" title="Layouts in diesem Ordner">${items.length}</span>
        ${ohneOrdner ? '' : `<span class="lay-werkzeug">
          <button class="zp-ikon" onclick="event.stopPropagation();moveFolderStep('${_jsStr(name)}',-1)" title="Ordner nach oben">▲</button>
          <button class="zp-ikon" onclick="event.stopPropagation();moveFolderStep('${_jsStr(name)}',1)" title="Ordner nach unten">▼</button>
          <button class="zp-ikon" onclick="event.stopPropagation();openFolderMenu(event,'${_jsStr(name)}')" title="Ordner-Optionen">⋯</button>
        </span>`}
      </div>
      <div class="ord-inhalt" style="display:${collapsed ? 'none' : 'flex'};">
        ${items.length ? items.map(l => _savedCard(l, !collapsed)).join('')
      : `<div class="ord-leer">${ohneOrdner ? 'Alles einsortiert ✓' : 'Leer — Layout hierher ziehen'}</div>`}
      </div>
    </div>`;
}

// Ordner eines Layouts ('' = Ohne Ordner) und Layouts je Ordner — Layout-Liste und Testblatt.
const _layoutOrdner = l => (l.group || '').trim();
function _layoutsNachOrdner(layouts) {
  const byGroup = {};
  for (const l of layouts) { const g = _layoutOrdner(l); (byGroup[g] = byGroup[g] || []).push(l); }
  return byGroup;
}

// Ordner in ANZEIGEREIHENFOLGE: die registrierten aus folders.json plus die ad-hoc
// entstandenen (ein Layout trägt eine Gruppe, die dort nie angelegt wurde — z.B. „F01").
// EINE Quelle für die Anzeige (renderSaved) UND die ▲▼-Knöpfe (moveFolderStep): zwei
// Fassungen füllten ein fehlendes `order` verschieden auf, und der Pfeil verschob dann
// gegen eine Reihenfolge, die gar nicht auf dem Bildschirm stand.
function _ordnerInReihenfolge(folders, layouts) {
  const reg = new Map(folders.map(f => [f.name, f]));
  const adhoc = [...new Set((layouts || []).map(_layoutOrdner))]
    .filter(g => g && !reg.has(g))
    .map((name, i) => ({ name, color: FOLDER_COLORS[(folders.length + i) % FOLDER_COLORS.length], order: 9000 + i }));
  return [...folders.map((f, i) => ({ ...f, order: f.order ?? i })), ...adhoc]
    .sort((a, b) => (a.order - b.order) || a.name.localeCompare(b.name, 'de'));
}

// useCache=true → aus dem letzten Stand rendern (Auf-/Zuklappen, Suche). Nach echten
// Änderungen renderSaved() OHNE Cache aufrufen.
let _savedDataCache = null;
// Sortierung der Layout-Liste. „ordner" ist die Reihenfolge, in der sie in layouts.json
// stehen — die hat der Nutzer per Drag selbst gelegt und ist deshalb Standard. Die
// anderen sortieren INNERHALB der Ordner, die Ordnergliederung bleibt immer erhalten.
let _layoutSort = 'ordner';
// Filter „nur ohne Auto-Export": macht sichtbar, welche Layouts der Nachtlauf überspringt.
// Ohne den fällt es erst auf, wenn morgens Dateien fehlen.
let _nurOhneAuto = false;

function setLayoutSort(v) { _layoutSort = v || 'ordner'; renderSaved(true); }
function toggleNurOhneAuto() { _nurOhneAuto = !_nurOhneAuto; renderSaved(true); }

function _sortLayouts(items) {
  const a = items.slice();
  if (_layoutSort === 'name') a.sort((x, y) => x.name.localeCompare(y.name, 'de', { numeric: true }));
  else if (_layoutSort === 'neu') a.sort((x, y) => String(y.date || '').localeCompare(String(x.date || '')));
  else if (_layoutSort === 'alt') a.sort((x, y) => String(x.date || '').localeCompare(String(y.date || '')));
  return a;
}

// Zählzeile unter der Suche: Gesamtzahl und wie viele der Nachtlauf überspringt.
function _renderLayoutZaehler(alle) {
  const el = document.getElementById('layout-zaehler');
  if (!el) return;
  const ohne = alle.filter(l => !l.autoExport).length;
  el.innerHTML = `${alle.length} Layouts`
    + (sessionOrders.length ? ` · <span class="ord-lauf" style="margin:0 2px 0 0;">${sessionOrders.length}</span> Bestellungen im Lauf` : '')
    + (ohne ? ` · <span onclick="toggleNurOhneAuto()" style="cursor:pointer;color:var(--amber);text-decoration:underline;"
         title="Diese Layouts überspringt der automatische Export">${ohne} ohne Auto-Export</span>` : '')
    + (_nurOhneAuto ? ` · <span onclick="toggleNurOhneAuto()" style="cursor:pointer;color:var(--accent);">Filter aufheben</span>` : '');
}

async function renderSaved(useCache) {
  const el = document.getElementById('saved-list');
  if (!el) return;
  const [saved, folders] = (useCache && _savedDataCache)
    ? _savedDataCache
    : (_savedDataCache = await Promise.all([getServerLayouts(), getServerFolders()]));
  if (!saved.length) { el.innerHTML = '<div class="uempty">Noch keine gespeicherten Layouts</div>'; return; }

  const q = (document.getElementById('layout-search')?.value || '').trim().toLowerCase();
  const matches = l => (!q || l.name.toLowerCase().includes(q)) && (!_nurOhneAuto || !l.autoExport);
  _renderLayoutZaehler(saved);
  const sortSel = document.getElementById('layout-sort');
  if (sortSel && sortSel.value !== _layoutSort) sortSel.value = _layoutSort;

  // Layouts nach Ordner-Namen bündeln ('' = Ohne Ordner)
  const byGroup = _layoutsNachOrdner(saved);

  // Registrierte Ordner + ad-hoc, in Anzeigereihenfolge (s. _ordnerInReihenfolge)
  const allFolders = _ordnerInReihenfolge(folders, saved);

  // Noch keine Ordner angelegt → flache Liste (wie früher), bis "+ Ordner" genutzt wird
  if (allFolders.length === 0) {
    const items = _sortLayouts(saved.filter(matches));
    el.innerHTML = items.length ? `<div class="saved-list">${items.map(_savedCard).join('')}</div>`
      : '<div class="uempty">Keine Treffer</div>';
    return;
  }

  let html = '';
  for (const f of allFolders) {
    const items = _sortLayouts((byGroup[f.name] || []).filter(matches));
    if (q && items.length === 0) continue; // bei Suche leere Ordner ausblenden
    html += _folderSection(f.name, f.color, items, !_expandedGroups.has(f.name) && !q);
  }
  // "Ohne Ordner" (Drop-Ziel zum Entfernen) — gleiche Bauform wie jeder andere Ordner,
  // nur in der Sonderausführung (s. _folderSection, ohneOrdner=true).
  const noneItems = _sortLayouts((byGroup[''] || []).filter(matches));
  if (noneItems.length || !q) {
    html += _folderSection('', '#8C877F', noneItems, !_expandedGroups.has('') && !q, true);
  }
  el.innerHTML = html || '<div class="uempty">Keine Treffer</div>';
}

// ── Drag & Drop ────────────────────────────────────────────────────────────────
// Nur für LAYOUTS (Karte in einen Ordner ziehen). Die Ordner-Reihenfolge läuft über die
// ▲▼-Knöpfe (moveFolderStep), nicht über Drag.
function onLayoutDragStart(e, id) {
  _dragLayoutId = id;
  e.dataTransfer.effectAllowed = 'move';
  try { e.dataTransfer.setData('text/plain', String(id)); } catch (_) { }
  e.currentTarget.style.opacity = '0.45';
}
function onLayoutDragEnd(e) { e.currentTarget.style.opacity = ''; _dragLayoutId = null; }
function onFolderDragOver(e, color) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; e.currentTarget.style.boxShadow = 'inset 0 0 0 2px ' + color; }
function onFolderDragLeave(e) { e.currentTarget.style.boxShadow = ''; }
async function onFolderDrop(e, name) {
  e.preventDefault();
  e.currentTarget.style.boxShadow = '';
  if (_dragLayoutId == null) return;
  await assignLayoutToGroup(_dragLayoutId, name);
  _dragLayoutId = null;
}

// Ordner einen Platz nach oben (-1) / unten (+1) verschieben (▲▼ im Ordnerkopf).
// AD-HOC-Ordner zählen mit — sonst ließe sich an ihnen nicht vorbei verschieben.
async function moveFolderStep(name, dir) {
  const [saved, folders] = await Promise.all([getServerLayouts(), getServerFolders()]);
  // GENAU die Reihenfolge, die renderSaved anzeigt — sonst schiebt der Pfeil gegen eine
  // andere Liste als die sichtbare (s. _ordnerInReihenfolge).
  const sorted = _ordnerInReihenfolge(folders, saved).map(f => ({ id: f.id ?? Date.now(), ...f }));
  const idx = sorted.findIndex(f => f.name === name);
  const j = idx + dir;
  if (idx < 0 || j < 0 || j >= sorted.length) return; // schon ganz oben/unten
  [sorted[idx], sorted[j]] = [sorted[j], sorted[idx]];
  sorted.forEach((f, i) => { f.order = i; });
  if (!await saveServerFolders(sorted)) return;
  renderSaved();
}
// Layout einem Ordner zuordnen (name = '' → Ohne Ordner)
async function assignLayoutToGroup(layoutId, name) {
  const saved = await getServerLayouts();
  const l = saved.find(x => x.id === layoutId);
  if (!l) return;
  if ((l.group || '') === (name || '')) return; // schon dort
  l.group = name || '';
  if (name) _expandedGroups.add(name); // Zielordner aufklappen, damit man das Layout sieht
  if (!await saveServerLayouts(saved)) return;
  renderSaved();
  showToast(name ? ('→ „' + name + '"') : 'aus Ordner entfernt');
}

// ── Ordner anlegen / umbenennen / Farbe / löschen ──────────────────────────────
function createFolderPrompt() {
  document.getElementById('create-folder-modal')?.remove();
  _newFolderColor = FOLDER_COLORS[0];
  const m = document.createElement('div');
  m.id = 'create-folder-modal';
  m.style.cssText = 'position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center;';   // Abdunkelung: Stilvorlage
  const sw = FOLDER_COLORS.map((c, i) => `<span onclick="_pickFolderColor(this,'${c}')" style="width:26px;height:26px;border-radius:var(--r-s);background:${_ordnerTon(c)};cursor:pointer;display:inline-block;border:2px solid ${i === 0 ? 'var(--text)' : 'transparent'};box-shadow:inset 0 0 0 2px var(--bg2);box-sizing:border-box;"></span>`).join('');
  m.innerHTML = `<div class="dlg-kasten" style="min-width:320px;max-width:400px;">
    <div class="dlg-titel" style="margin-bottom:16px;">Neuer Ordner</div>
    <div class="il" style="margin-bottom:5px;">Name</div>
    <input id="new-folder-name" placeholder="z. B. Ketten, Schilder" style="margin-bottom:16px;" onkeydown="if(event.key==='Enter')_confirmCreateFolder();if(event.key==='Escape')document.getElementById('create-folder-modal').remove();"/>
    <div class="il" style="margin-bottom:6px;">Farbe</div>
    <div id="new-folder-colors" style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:20px;">${sw}</div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button class="btn btn-muted btn-dialog" onclick="document.getElementById('create-folder-modal').remove()">Abbrechen</button>
      <button class="btn btn-accent btn-dialog" onclick="_confirmCreateFolder()">Erstellen</button>
    </div></div>`;
  document.body.appendChild(m);
  setTimeout(() => document.getElementById('new-folder-name')?.focus(), 50);
}
function _pickFolderColor(elem, c) {
  _newFolderColor = c;
  document.querySelectorAll('#new-folder-colors span').forEach(s => s.style.border = '2px solid transparent');
  elem.style.border = '2px solid var(--text)';
}
async function _confirmCreateFolder() {
  const name = (document.getElementById('new-folder-name')?.value || '').trim();
  if (!name) { showToast('Bitte einen Namen eingeben'); return; }
  const folders = await getServerFolders();
  if (folders.some(f => f.name.toLowerCase() === name.toLowerCase())) { showToast('⚠️ Ordner existiert bereits'); return; }
  folders.push({ id: Date.now(), name, color: _newFolderColor, order: folders.length });
  if (!await saveServerFolders(folders)) return;
  document.getElementById('create-folder-modal')?.remove();
  renderSaved();
  showToast('✓ Ordner „' + name + '" erstellt');
}

// Ordner-Optionen-Popup (Farbe / Umbenennen / Löschen)
function openFolderMenu(e, name) {
  document.querySelectorAll('.folder-menu-pop').forEach(m => m.remove());
  const pop = document.createElement('div');
  pop.className = 'folder-menu-pop';
  const r = e.currentTarget.getBoundingClientRect();
  pop.style.cssText = `position:fixed;top:${r.bottom + 4}px;left:${Math.max(8, Math.min(r.left - 140, window.innerWidth - 188))}px;z-index:10001;background:var(--bg2);border:1px solid var(--border);border-radius:var(--r-m);padding:10px;min-width:186px;box-shadow:var(--shadow-l);`;
  const sw = FOLDER_COLORS.map(c => `<span onclick="recolorFolder('${_jsStr(name)}','${c}');this.closest('.folder-menu-pop').remove()" style="width:20px;height:20px;border-radius:var(--r-xs);background:${_ordnerTon(c)};cursor:pointer;display:inline-block;"></span>`).join('');
  pop.innerHTML = `<div class="ulabel" style="margin-bottom:6px;">Farbe</div>
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px;">${sw}</div>
    <button class="export-item" onclick="renameFolder('${_jsStr(name)}');this.closest('.folder-menu-pop').remove()">Umbenennen</button>
    <button class="export-item" style="color:var(--red);" onclick="deleteFolder('${_jsStr(name)}');this.closest('.folder-menu-pop').remove()">Ordner löschen</button>`;
  document.body.appendChild(pop);
  _dismissOnClick(pop, { insideStaysOpen: true, onClose: () => pop.remove() });
}

// Ordner einfärben (legt ihn an, falls er nur ad-hoc existierte)
async function recolorFolder(name, color) {
  const folders = await getServerFolders();
  let f = folders.find(x => x.name === name);
  if (f) f.color = color;
  else folders.push({ id: Date.now(), name, color, order: folders.length });
  await saveServerFolders(folders);
  renderSaved();
}

async function renameFolder(name) {
  const nn = await promptModal('Ordner umbenennen', 'Neuer Name für „' + name + '":', name);
  if (nn == null) return;
  const next = nn.trim();
  if (!next || next === name) return;
  const folders = await getServerFolders();
  if (folders.some(f => f.name.toLowerCase() === next.toLowerCase())) { showToast('⚠️ Name schon vergeben'); return; }
  let f = folders.find(x => x.name === name);
  if (f) f.name = next;
  else folders.push({ id: Date.now(), name: next, color: FOLDER_COLORS[0], order: folders.length });
  // ERST die Layouts umhängen, dann den Ordner: scheitert der zweite Schritt, stehen die Layouts unter
  // dem neuen Namen als eigener Ordner da (umgekehrt lägen sie unter einem Namen, den es nicht mehr gibt).
  if (!await _layoutsUmhaengen(name, next)) return;
  if (!await saveServerFolders(folders)) return;
  // Einklapp-Zustand mitnehmen
  if (_expandedGroups.has(name)) { _expandedGroups.delete(name); _expandedGroups.add(next); }
  renderSaved();
  showToast('✓ umbenannt in „' + next + '"');
}

// Alle Layouts eines Ordners in einen anderen hängen ('' = „Ohne Ordner"). false = nicht gespeichert.
async function _layoutsUmhaengen(von, nach) {
  const saved = await getServerLayouts();
  let changed = false;
  saved.forEach(l => { if ((l.group || '') === von) { l.group = nach; changed = true; } });
  return !changed || await saveServerLayouts(saved);
}

async function deleteFolder(name) {
  const ok = await confirmModal('Ordner löschen?', '„' + name + '" wird entfernt. Die Layouts bleiben erhalten und landen in „Ohne Ordner".', 'Löschen');
  if (!ok) return;
  // Erst die Layouts lösen, dann den Ordner löschen (Grund s. renameFolder).
  if (!await _layoutsUmhaengen(name, '')) return;
  const folders = await getServerFolders();
  if (!await saveServerFolders(folders.filter(f => f.name !== name))) return;
  renderSaved();
  showToast('🗑 Ordner „' + name + '" gelöscht');
}

// Zuletzt geladenes Layout (für manuellen Export, z.B. dessen DXF-Rahmen-Einstellung)
let _loadedLayout = null;
// ── Gemeinsamer Kern von loadLayout (manuell) und loadLayoutSilent (Auto-Export) ──
// Übernimmt Seitengröße, Felder/Seiten und Filter-/Modus-Einstellungen eines Layouts.
// interactive=false (Puppeteer): dlPresetChange wird NICHT aufgerufen — dessen
// Nebenwirkungen können den headless Export destabilisieren.
function _applyLayoutState(layout, interactive) {
  document.getElementById('pw').value = layout.page.w;
  document.getElementById('ph').value = layout.page.h;
  document.getElementById('pm').value = layout.page.m;

  // Füll-Reste IMMER strippen: _img/_text/orderId sind Session-Zustand,
  // _imgSrc/_placement sind domain-spezifisch (sonst cross-origin/veraltete Bilder).
  const clean = f => ({ ...f, _img: null, _text: null, orderId: null, _imgSrc: null, _placement: null });
  // Jedes Layout hat `pages` (das Alt-Format mit nur `fields` gibt es seit Juli 2026 nicht mehr)
  _pages = (layout.pages && layout.pages.length ? layout.pages : [[]]).map(pg => pg.map(clean));
  _currentPage = Math.min(layout.currentPage || 0, _pages.length - 1);
  fields = _pages[_currentPage].map(f => ({ ...f }));
  recalcIdc();
  // Bild-Caches gehören zum ALTEN Layout — sonst greift der Export auf dessen Bilder
  // zurück (Feld-IDs wiederholen sich pro Layout, s. _clearOriginalImgs).
  _clearOriginalImgs();

  // Filter-Presets wiederherstellen
  if (layout.dlPreset) {
    document.getElementById('dl-preset').value = layout.dlPreset;
    if (interactive) dlPresetChange();
  }
  if (layout.dlStatus) document.getElementById('dl-status').value = layout.dlStatus;

  // Laser-Einstellungen aus dem Layout übernehmen — sonst zeigt der Tab die zuletzt
  // manuell eingestellten Werte und manueller BMP-Export läuft gegen den Auto-Export.
  ditherSettings = _laserSettings(layout.ditherSettings);
  if (interactive) {
    _syncLaserUI(ditherSettings); // setzt inkl. Master-Schalter (dither-active)
    _markMaterialBtn();
    updateDitherSettings(); // Master-Toggle-Optik nachziehen
  }

  // Füll-Konfiguration in _fillCfg übernehmen — EINZIGE Schreibstelle beim Laden, für
  // manuell UND Auto-Export. Läuft über _FILL_FIELDS.
  _fillCfgFromLayout(layout);
  _syncFillUI();

  sel = null;
}

async function loadLayout(id) {
  const saved = await getServerLayouts();
  const layout = saved.find(l => l.id === id);
  if (!layout) return;
  if (fields && fields.length > 0) {
    const ok = await confirmModal('Layout laden?', 'Aktuelles Layout wird ersetzt durch "' + layout.name + '".', 'Laden');
    if (!ok) return;
  }
  // ERST nach der Bestätigung setzen: nach einem Abbruch zeigte _loadedLayout sonst auf
  // ein Layout, das gar nicht im Editor ist — und daraus liest „Füllen + Export" sein
  // Format und Ziel, „ins Layout übernehmen" sein Ziel, der ⚠-Hinweis seine Basis.
  _loadedLayout = layout;
  // Alte Felder asins/asinMode/asinManual werden ignoriert; Füll-ASINs und useQty & Co.
  // kommen über _applyLayoutState → _fillCfg.

  _applyLayoutState(layout, true);

  // Kachel-Anzahlen: mindestens 3, sonst so viele, wie das Layout nutzt
  for (const t in _palN) _palN[t] = _PAL_START;
  for (const f of fields) {
    const t = _feldTyp(f);
    if (_palN[t]) _palN[t] = Math.max(_palN[t], f.palNum || 1);
    if (_isCombo(f)) _palN.text = Math.max(_palN.text, ...f.comboPals);
  }
  renderPal();
  updateCanvas();
  renderFieldList();
  renderProps();
  updatePageNavigator();
  markLayoutDirty(false); // frisch geladen → sauberer Stand
  showToast('✅ Layout geladen: ' + layout.name);
}

async function deleteSaved(id) {
  const saved = await getServerLayouts();
  const layout = saved.find(l => l.id === id);
  if (!layout) return;
  const ok = await confirmModal('Layout löschen?', '"' + layout.name + '" wird unwiderruflich gelöscht.', 'Löschen');
  if (!ok) return;
  if (!await saveServerLayouts(saved.filter(l => l.id !== id))) return;
  renderSaved();
  showToast('🗑 Layout gelöscht');
}

// „Nur diese Seite oder alle?" — bei einer einzigen Seite gar nicht erst fragen.
// Rückgabe: 'this' | 'all' | null (abgebrochen). Für Leeren UND Löschen.
async function _askPageScope(title, message) {
  if (_pages.length <= 1) return 'this';
  return await choiceModal(title, message, 'Diese Seite', 'Alle Seiten');
}

async function clearImages() {
  const scope = await _askPageScope('Inhalt leeren',
    'Soll nur der Inhalt dieser Seite oder aller Seiten geleert werden?');
  if (scope === null) return; // Abgebrochen
  saveUndo();
  if (scope === 'this') {
    _clearFieldData(fields);
  } else {
    _pages.forEach(pg => _clearFieldData(pg));
    _clearFieldData(fields);
  }
  renderEls(); drawCanvas();
}

// ── Dithering Engine ─────────────────────────────────────────────────────────
// Speichert originale _img bevor Dithering angewendet wird
const _originalImgs = {}; // fieldId → original Image object

// Der Schlüssel ist die FELD-ID — und die ist nur INNERHALB eines Layouts eindeutig
// (recalcIdc setzt den Zähler beim Laden neu). Bleibt der Cache über einen Layout-Wechsel
// stehen, liefert renderFieldToCtx beim Export ein FREMDES Kundenfoto auf das Werkstück,
// ohne jede Warnung (reproduziert 19.08.2026). Deshalb bei jedem Wechsel leeren.
function _clearOriginalImgs() {
  for (const k of Object.keys(_originalImgs)) delete _originalImgs[k];
}

// Einen Regler ganz ausblenden, wenn er gerade nichts bewirkt (statt ausgegraut mit Erklärzeile) —
// was gerade nicht gilt, ist gar nicht erst da, wie bei den Automatik-Schaltern:
//   Kontrast      — verschwindet, solange Auto-Kontrast läuft
//   Schwellenwert — verschwindet bei Fehlerdiffusion (dort regelt Gamma)
function _zeigeRegler(boxId, sichtbar) {
  const b = document.getElementById(boxId);
  if (b) b.hidden = !sichtbar;
}

function updateDitherSettings() {
  setTimeout(_paintLaserAktiv, 0);
  // Ungültig (leeres Auswahlfeld, z. B. eine DPI ohne passende Option) → Standardwert statt NaN.
  const _num = (id, fb) => { const v = parseFloat(document.getElementById(id)?.value); return Number.isFinite(v) ? v : fb; };
  ditherSettings.active = document.getElementById('dither-active')?.checked || false;
  ditherSettings.algorithm = document.getElementById('dither-algo')?.value || 'floyd-steinberg';
  ditherSettings.threshold = _num('dither-thresh', 128);
  ditherSettings.contrast = _num('dither-contrast', 0);
  ditherSettings.gamma = _num('dither-gamma', 1.0);
  ditherSettings.sharpen = _num('dither-sharpen', 0) / 100; // UI in %, intern 0…2 (über 1 nur mit Radius sinnvoll)
  const _sr = _num('dither-schaerfradius', 1);
  ditherSettings.schaerfRadius = _sr > 1 ? _sr : 0;
  ditherSettings.clahe = document.getElementById('dither-clahe')?.checked ? _num('dither-clahe-st', 2) : 0;
  ditherSettings.claheKacheln = ditherSettings.claheKacheln || 8;
  _setAn('dither-clahe-lbl', ditherSettings.clahe > 0);
  _zeigeRegler('dither-clahe-box', ditherSettings.clahe > 0);
  ditherSettings.densityFaktorMin = _num('dither-density-bremse', 0) / 100;
  ditherSettings.localContrast = _num('dither-localcontrast', 0) / 100; // UI in %, intern 0…1.2
  ditherSettings.shadows = _num('dither-shadows', 0) / 100;      // UI in %, intern 0…1
  ditherSettings.highlights = _num('dither-highlights', 0) / 100;
  ditherSettings.regionAusgleich = _num('dither-region', 0) / 100; // UI in %, intern 0…1
  ditherSettings.regionImmer = document.getElementById('dither-region-immer')?.checked
    ? _num('dither-region-immer-st', 35) / 100 : 0;
  _zeigeRegler('dither-region-immer-box', ditherSettings.regionImmer > 0);
  // Kanten ODER Konturen — das jeweils andere wird 0, damit im Layout nie beide stehen.
  const kantenArt = document.getElementById('dither-kantenart')?.value || 'aus';
  ditherSettings.konturen = kantenArt === 'konturen' ? _num('dither-kontur', 150) / 100 : 0;
  ditherSettings.autoMotiv = document.getElementById('dither-motiv')?.checked || false;
  // Zehntel-Prozent: F02 Schwarz steht seit 11.10. auf 21,3 / 38,8 % — ganze Prozent hätten das
  // beim nächsten „Ins Layout übernehmen“ still auf 21 / 39 gerundet.
  ditherSettings.densityMax = Math.round(_num('dither-motiv-max', 40) * 10) / 1000;
  // Hautkurve immer in der lokalen Fassung (je Kachel) — die globale ließ bei zwei
  // unterschiedlich hellen Gesichtern das dunklere zulaufen (Prüfstand 05./06.10.2026).
  ditherSettings.hautKurve = _num('dither-hautkurve', 0) / 100;
  ditherSettings.hautKurveLokal = ditherSettings.hautKurve > 0;
  ditherSettings.gesichtAuto = document.getElementById('dither-gesicht')?.checked || false;
  ditherSettings.gesichtZiel = _num('dither-gesicht-ziel', 15) / 100;
  ditherSettings.gesichtSchaerfen = _num('dither-gesicht-scharf', 0) / 100;
  _setAn('dither-gesicht-lbl', ditherSettings.gesichtAuto);
  _zeigeRegler('dither-gesicht-box', ditherSettings.gesichtAuto);
  ditherSettings.edgeBoost = kantenArt === 'kanten' ? _num('dither-edgeboost', 45) / 100 : 0;
  ditherSettings.densityTarget = document.getElementById('dither-density')?.checked
    ? Math.round(_num('dither-density-ziel', 22) * 10) / 1000 : 0;
  ditherSettings.dotGain = _num('dither-dotgain', 0) / 100; // UI in %, intern 0…0.5
  // Kein `?? true`: ein bewusst abgeschalteter Haken muss als false durchkommen.
  // Den Standard „an" setzt LASER_DEFAULTS, und _syncLaserUI schreibt ihn in den Haken.
  ditherSettings.grafikAuto = document.getElementById('dither-grafik')?.checked || false;
  // Läuft nur mit „Logos erkennen" mit (s. _istWeicheGrafik in laser-pipeline.js).
  ditherSettings.grafikWeich = document.getElementById('dither-grafikweich')?.checked || false;
  _setAn('dither-grafikweich-lbl', ditherSettings.grafikWeich && ditherSettings.grafikAuto);
  // Tot-Bereich gegen Einzelpunkte. Hebt sich mit inkMin auf (das eine hebt an, das
  // andere schneidet weg) — bei gesetztem Lichterwert deshalb zwangsweise aus, damit
  // nicht zwei Regler gegeneinander arbeiten. Der Regler wird dann auch ausgeblendet
  // (_zeigeRegler('dither-dropout-box') weiter unten in derselben Funktion).
  ditherSettings.inkDropout = _num('dither-inkmin', 0) > 0 ? 0 : _num('dither-dropout', 0) / 100;
  // Schattenstufe hängt am Schnitt (s. _dropoutLUT): ohne Schnitt gibt es nichts anzuheben.
  ditherSettings.schattenAuf = ditherSettings.inkDropout > 0 ? _num('dither-schatten', 0) / 100 : 0;
  ditherSettings.inkMin = _num('dither-inkmin', 0) / 100;   // UI in %, intern 0…1 Tinte
  ditherSettings.inkMax = _num('dither-inkmax', 100) / 100;
  // Verdrehte Grenzen sind eine Fehlbedienung, kein Bildeffekt: _applyInkLimits würde sie
  // ignorieren, die Regler behaupteten aber weiter etwas anderes. Lieber hier einfangen.
  if (ditherSettings.inkMax <= ditherSettings.inkMin) ditherSettings.inkMax = Math.min(1, ditherSettings.inkMin + 0.05);
  ditherSettings.dpi = _num('dither-dpi', 500);
  ditherSettings.dateiDpi = document.getElementById('dither-datei500')?.checked ? 500 : 0;
  ditherSettings.autoContrast = document.getElementById('dither-autocontrast')?.checked || false;
  ditherSettings.autoGamma = document.getElementById('dither-autogamma')?.checked || false;
  ditherSettings.autoGammaTarget = _num('dither-autogamma-ziel', 45) / 100;
  ditherSettings.invert = document.getElementById('dither-invert')?.checked || false;

  // Schalter-Kästen markieren — auf dem dunklen Grund ist ein Häkchen sonst nicht zu
  // erkennen. Farbe kommt aus dem Stylesheet (.an), nicht aus Inline-Zuweisungen.
  _setAn('dither-master-lbl', ditherSettings.active);
  _setAn('dither-invert-lbl', ditherSettings.invert);
  _setAn('dither-autocontrast-lbl', ditherSettings.autoContrast);
  _setAn('dither-autogamma-lbl', ditherSettings.autoGamma);
  _zeigeRegler('dither-edgeboost-box', ditherSettings.edgeBoost > 0);
  _zeigeRegler('dither-kontur-box', ditherSettings.konturen > 0);
  _setAn('dither-density-lbl', ditherSettings.densityTarget > 0);
  _setAn('dither-grafik-lbl', ditherSettings.grafikAuto);
  _setAn('dither-motiv-lbl', ditherSettings.autoMotiv);
  _zeigeRegler('dither-density-box', ditherSettings.densityTarget > 0);
  _zeigeRegler('dither-motiv-box', ditherSettings.autoMotiv);
  _zeigeRegler('dither-autogamma-box', ditherSettings.autoGamma);

  // Kontrast-Regler ausblenden, solange Auto-Kontrast an ist — er könnte danach nur noch
  // Zeichnung abschneiden. Die Pipeline entscheidet selbst zwischen 0 und dem Fallback.
  _zeigeRegler('dither-contrast-box', !ditherSettings.autoContrast);

  // „Sprenkel wegschneiden" nur zeigen, wenn der Lichterwert 0 ist: beide rechnen an der
  // untersten Tonwertstufe, und der Schnitt läuft nach inkMin — er nähme dessen Anhebung
  // wieder weg. Sichtbar/unsichtbar statt nur gesperrt, weil ein sichtbarer Regler ohne
  // Wirkung schon einmal zwei schlechte Läufe gekostet hat.
  _zeigeRegler('dither-dropout-box', !(ditherSettings.inkMin > 0));

  // Schwellenwert bei Fehlerdiffusion ausblenden: er tut dort NICHTS — der Fehler wandert
  // zum Nachbarpixel, die Gesamttinte bleibt gleich (gemessen: Schwelle 90/128/170 →
  // 50,0/50,0/50,0 %; bei Bayer dagegen 36/50/65 %). Wirksam ist hier Gamma.
  const errDiff = ditherSettings.active && _ERR_DIFFUSION.includes(ditherSettings.algorithm);
  _zeigeRegler('dither-thresh-box', !errDiff);   // dither-thresh-def steckt in dieser Box
  const tdef = document.getElementById('dither-thresh-def');
  if (tdef) {
    // Bei Invertieren graviert der Laser die andere Hälfte (s. _inkOf) — die
    // Regler-Beschriftungen drehen sich mit, sonst zieht man sie verkehrt herum.
    tdef.textContent = ditherSettings.invert
      ? 'höher = mehr gilt als dunkel = WENIGER Gravur (invertiert)'
      : 'höher = mehr gilt als dunkel = mehr Gravur';
  }
  const gdef = document.getElementById('dither-gamma-def');
  if (gdef) gdef.textContent = ditherSettings.autoGamma
    ? 'Auto-Gamma an: wirkt als Faktor auf den Wert je Foto (1,00 = unverändert)'
    : (ditherSettings.invert
      ? 'invertiert: höher = heller im Bild = MEHR Gravur'
      : 'höher = heller = weniger Gravur');

  _laserCalibBadge();
  _refreshLaserPreview();
}

// ── Material-Kalibrierung ein-/ausklappen ────────────────────────────────────
// Zugeklappt, weil einmal pro Material bestimmt. Der Zustand steht trotzdem im Kopf der
// Sektion: eine eingestellte Kalibrierung verschiebt JEDEN Tonwert und darf nicht
// unsichtbar wirken.
function toggleLaserCalib(force) {
  const body = document.getElementById('laser-calib-body');
  const chev = document.getElementById('laser-calib-chev');
  if (!body) return;
  const open = force === undefined ? body.style.display === 'none' : !!force;
  body.style.display = open ? 'block' : 'none';
  if (chev) chev.style.transform = open ? 'rotate(0deg)' : 'rotate(-90deg)';
}

// Auf-/Zuklappen der Testbrände — gleiche Mechanik wie die Feinjustage.
function toggleLaserTests() {
  const k = document.getElementById('laser-tests');
  const b = document.getElementById('laser-tests-knopf');
  if (!k || !b) return;
  const auf = k.hasAttribute('hidden');
  if (auf) k.removeAttribute('hidden'); else k.setAttribute('hidden', '');
  b.setAttribute('aria-expanded', auf ? 'true' : 'false');
  b.querySelector('.klapp-pfeil').textContent = auf ? '▾' : '▸';
}

// Alles unter dem Hauptschalter abblenden, solange Dithering aus ist —
// die Regler wirken dann ohnehin nicht.
function _paintLaserAktiv() {
  const an = document.getElementById('dither-active')?.checked;
  const tab = document.getElementById('tab-laser');
  if (tab) tab.classList.toggle('laser-aus', !an);
}

// Liefert true, wenn eine Kalibrierung eingestellt ist. `raw` weglassen = aktueller Zustand
// (updateDitherSettings); _syncLaserUI reicht die Werte durch, die es gerade schreibt.
function _laserCalibBadge(raw) {
  const b = document.getElementById('laser-calib-badge');
  if (!b) return false;
  const s = _laserSettings(raw || ditherSettings);
  const parts = [];
  if (s.dotGain > 0) parts.push('Ausgleich ' + Math.round(s.dotGain * 100) + ' %');
  if (s.inkMin > 0 || s.inkMax < 1) parts.push('Tonwert ' + Math.round(s.inkMin * 100) + '–' + Math.round(s.inkMax * 100) + ' %');
  if (s.inkDropout > 0) parts.push('Sprenkel-Schnitt ' + Math.round(s.inkDropout * 100) + ' %');
  b.textContent = parts.join(' · ');
  b.style.display = parts.length ? 'inline-block' : 'none';
  return parts.length > 0;
}

// Offene Gravur-Vorschau nach einer Regler-Änderung neu rendern (die Arbeitsfläche zeigt
// immer das Original). Entprellt — ein Render bei 500 DPI braucht einige hundert ms.
let _previewTimer = null;
function _refreshLaserPreview() {
  const ov = document.getElementById('laser-preview-overlay');
  if (!ov || ov.style.display !== 'flex') return; // Vorschau zu → nichts zu tun
  clearTimeout(_previewTimer);
  const busy = document.getElementById('laser-preview-busy');
  if (busy) busy.style.display = 'inline';
  _previewTimer = setTimeout(() => { showLaserPreview({ silent: true }); }, 250);
}

// Startwerte je Material — nur ein Ausgangspunkt; der Feinschliff kommt aus dem Testgitter auf dem
// echten Material. invert:true = Gravur erscheint HELL auf dunklem Untergrund (poliertes Metall), das
// Foto geht als Negativ auf die Maschine.
//
// Fehlende Schlüssel füllt setMaterial aus LASER_DEFAULTS (sonst behielte ein Wechsel den Wert des
// VORHERIGEN Materials); die Tabelle nennt sie trotzdem, damit man ablesen kann, was ein Material
// bedeutet. 'kein' ist der einzige Eintrag mit active:false.
//
// KEIN Atkinson für Materialien, auf denen Porträts landen: es wirft 2/8 des Quantisierungsfehlers weg
// — dunkle Haare werden zum Klumpen, helle Haut zum Fleck. Für Logos und Strichgrafik weiter richtig.
//
// dotGain/inkMin/inkMax sind branchenübliche ANHALTSWERTE, keine Messungen — sie hängen an Maschine,
// Linse, Speed und Power. Ersetzen: Keil brennen, ablesen, als eigenes Preset sichern.
const MATERIAL_PRESETS = {
  // Material-unabhängige Foto-Grundeinstellung = LASER_DEFAULTS. Ohne Kalibrierung,
  // weil ohne Material nichts zu kalibrieren ist.
  'foto': { ...LASER_DEFAULTS },
  'kein': { active: false, threshold: 128, contrast: 0, algorithm: 'floyd-steinberg', gamma: 1.00, sharpen: 0, autoContrast: false, invert: false, dpi: 500, dotGain: 0, inkMin: 0, inkMax: 1, autoGamma: false, autoGammaTarget: 0.45, localContrast: 0, edgeBoost: 0, densityTarget: 0, inkDropout: 0 },
  'holz': { active: true, threshold: 140, contrast: 10, algorithm: 'floyd-steinberg', gamma: 1.10, sharpen: 0.6, autoContrast: true, invert: false, dpi: 500, dotGain: 0.25, inkMin: 0.03, inkMax: 0.92, autoGamma: false, autoGammaTarget: 0.45, localContrast: 0, edgeBoost: 0, densityTarget: 0, inkDropout: 0 },
  'metall': { active: true, threshold: 120, contrast: 15, algorithm: 'stucki', gamma: 0.95, sharpen: 0.8, autoContrast: true, invert: false, dpi: 500, dotGain: 0.15, inkMin: 0.02, inkMax: 0.95, autoGamma: false, autoGammaTarget: 0.45, localContrast: 0, edgeBoost: 0, densityTarget: 0, inkDropout: 0 },
  'metall-poliert': { active: true, threshold: 128, contrast: 10, algorithm: 'stucki', gamma: 1.05, sharpen: 0.8, autoContrast: true, invert: true, dpi: 500, dotGain: 0.15, inkMin: 0.02, inkMax: 0.95, autoGamma: false, autoGammaTarget: 0.45, localContrast: 0, edgeBoost: 0, densityTarget: 0, inkDropout: 0 },
  'acryl': { active: true, threshold: 128, contrast: 0, algorithm: 'bayer', gamma: 1.00, sharpen: 0, autoContrast: false, invert: false, dpi: 500, dotGain: 0.10, inkMin: 0.02, inkMax: 0.95, autoGamma: false, autoGammaTarget: 0.45, localContrast: 0, edgeBoost: 0, densityTarget: 0, inkDropout: 0 },
  'schiefer': { active: true, threshold: 110, contrast: 20, algorithm: 'floyd-steinberg', gamma: 1.15, sharpen: 0.5, autoContrast: true, invert: false, dpi: 500, dotGain: 0.20, inkMin: 0.05, inkMax: 0.90, autoGamma: false, autoGammaTarget: 0.45, localContrast: 0, edgeBoost: 0, densityTarget: 0, inkDropout: 0 },
  'leder': { active: true, threshold: 135, contrast: 5, algorithm: 'floyd-steinberg', gamma: 1.05, sharpen: 0.4, autoContrast: true, invert: false, dpi: 500, dotGain: 0.30, inkMin: 0.05, inkMax: 0.88, autoGamma: false, autoGammaTarget: 0.45, localContrast: 0, edgeBoost: 0, densityTarget: 0, inkDropout: 0 },
};

// ── Rezepte ──────────────────────────────────────────────────────────────────
// Die vier am Werkstück bestätigten Griffe (s. testfoto/URTEILE.md) plus „zu hell“. Gegen die
// Grundeinstellung (Dichte 23 %) nachgerechnet: „Motiv zu dunkel“ und „Motiv läuft zu“ heben die
// Bildmitte deutlich an, „nur schwarz/weiß“ senkt die Gesamtfläche auf 16–18 %. „dunkle Stellen flau“
// bleibt bei 20 % (der am Werkstück bestimmte Grenzwert) — die Kennzahl taugt dort NICHT zum
// Nachjustieren, sie bestraft genau das, was der Regler tun soll.
// „zu hell“ und „flau“ wirken RELATIV zum aktuellen Stand, die drei Rezepte absolut.
const _LASER_REZEPTE = {
  hell: { rel: { densityTarget: -0.04 } },
  dunkel: { abs: { ..._RF_STUFEN['2'] } },   // eine Quelle: Reklamation Stufe +2
  sw: { abs: { inkMax: 0.30, densityTarget: 0.30 } },
  zu: { abs: { inkMax: 0.40, localContrast: 0.80, densityTarget: 0.22 } },
  flau: { abs: { ..._RF_SPRENKEL } },     // eine Quelle: „Punkte im Schwarz"
};
// Namen wie an den Reglern („Tiefen (max. Gravur)" usw.) — für die Meldung nach dem Setzen
const _REZEPT_NAMEN = { inkMax: 'max. Gravur', densityTarget: 'Dichte', localContrast: 'lokaler Kontrast', inkDropout: 'Sprenkel-Schnitt' };
function laserRezept(name) {
  const r = _LASER_REZEPTE[name];
  if (!r) return;
  // Rezepte sind bei Dichte 21,3 % (500 DPI) erprobt — bei anderer Basis im selben Verhältnis (s. _rfStufeSkaliert).
  // Basis = das GESPEICHERTE Layout, nicht der Reiter: sonst rechnete das zweite Rezept auf dem ersten weiter
  // (F02 schwarz: „Motiv zu dunkel", dann „nur schwarz/weiß" → Dichte 60 statt 49 %).
  const fk = _basisFaktor(_laserSettings(_loadedLayout?.ditherSettings || ditherSettings));
  const neu = { ...ditherSettings, ..._aufBasisDichte(r.abs || {}, fk) };
  for (const [k, v] of Object.entries(r.rel || {})) neu[k] = Math.max(0, (neu[k] || 0) + (k === 'densityTarget' ? v * fk : v));
  ditherSettings = _laserSettings(neu);
  _syncLaserUI(ditherSettings);
  updateDitherSettings();
  // Die Werte, die JETZT an den Reglern stehen — umgerechnet auf die Basis-Dichte (F02 schwarz ×1,6),
  // nicht die Rezeptwerte. Export und Reklamation lesen das gespeicherte Layout, nicht den Reiter.
  const text = Object.keys({ ...r.abs, ...r.rel })
    .map(k => `${_REZEPT_NAMEN[k] || k} ${String(Math.round(ditherSettings[k] * 1000) / 10).replace('.', ',')} %`).join(' · ');
  showToast('Rezept gesetzt: ' + text + ' — für Export und Reklamation „Ins Layout übernehmen“.', 6000);
}

// Beschriftung neben einem Laser-Regler — EINE Formatierung für Ziehen (oninput im Markup) und Laden
// (_syncLaserUI). Tabelle IN der Funktion: _syncLaserUI läuft schon beim Start (TDZ-Gefahr).
function _reglerZeigen(id, v) {
  const el = document.getElementById(id);
  if (!el) return;
  const ausBeiNull = x => x > 0 ? x + ' %' : 'aus';
  const format = {
    'dither-thresh-val': String, 'dither-contrast-val': String,
    'dither-gamma-val': x => Number(x).toFixed(2).replace('.', ','),
    'dither-hautkurve-val': ausBeiNull, 'dither-dropout-val': ausBeiNull, 'dither-schatten-val': ausBeiNull,
    'dither-gesicht-scharf-val': ausBeiNull,
    'dither-clahe-val': x => Number(x).toFixed(1).replace('.', ','),
    'dither-schaerfradius-val': x => (+x <= 1 ? '1 Pkt (fein)' : x + ' Pkt'),
    'dither-density-bremse-val': x => (+x > 0 ? 'Faktor ' + (x / 100).toFixed(2).replace('.', ',') : 'aus'),
  }[id] || (x => String(x).replace('.', ',') + ' %');
  el.textContent = format(v);
}

// Regler/Schalter des Laser-Tabs aus einem Settings-Objekt füllen — eine Quelle für setMaterial und
// das Laden eines Layouts. WICHTIG: `active` gehört MIT hierher, sonst schaltet updateDitherSettings
// das Dithering still ab (Checkbox aus, Export mit hartem Schwellenwert).
function _syncLaserUI(s) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const chk = (id, val) => { const el = document.getElementById(id); if (el) el.checked = !!val; };
  // Regler + Anzeige daneben (<id>-val, sofern nicht anders benannt)
  const regler = (id, val, anzeige = id + '-val') => { set(id, val); _reglerZeigen(anzeige, val); };
  chk('dither-active', s.active);
  regler('dither-thresh', s.threshold);
  regler('dither-contrast', s.contrast);
  regler('dither-gamma', s.gamma);
  regler('dither-sharpen', Math.round(s.sharpen * 100));
  regler('dither-schaerfradius', s.schaerfRadius > 1 ? s.schaerfRadius : 1);
  chk('dither-clahe', (s.clahe || 0) > 0);
  regler('dither-clahe-st', s.clahe > 0 ? s.clahe : 2, 'dither-clahe-val');
  _zeigeRegler('dither-clahe-box', s.clahe > 0);
  regler('dither-density-bremse', Math.round((s.densityFaktorMin || 0) * 100));
  // „Weitere Automatiken" offen, sobald das Layout einen der älteren Wege benutzt — sonst wirkte er unsichtbar.
  const _wt = document.getElementById('dither-weitere');
  if (_wt) _wt.open = !!((s.localContrast || 0) > 0 || (s.shadows || 0) > 0 || (s.highlights || 0) > 0
    || (s.regionAusgleich || 0) > 0 || (Number(s.regionImmer) || s.regionImmer === true) || s.autoGamma
    || Math.abs((s.gamma ?? 1) - 1) > 0.001 || (s.hautKurve || 0) > 0 || s.gesichtAuto);
  regler('dither-localcontrast', Math.round((s.localContrast ?? 0) * 100));
  const ebw = s.edgeBoost ?? 0, kow = s.konturen ?? 0;
  // Stehen in einem alten Layout beide, gilt wie in der Pipeline die Kontur (s. applyLaserPipeline).
  set('dither-kantenart', kow > 0 ? 'konturen' : ebw > 0 ? 'kanten' : 'aus');
  regler('dither-edgeboost', Math.round((ebw > 0 ? ebw : 0.45) * 100));
  _zeigeRegler('dither-edgeboost-box', ebw > 0 && !(kow > 0));
  const dt = s.densityTarget ?? 0;
  chk('dither-density', dt > 0);
  regler('dither-density-ziel', Math.round((dt > 0 ? dt : 0.22) * 1000) / 10);
  _zeigeRegler('dither-density-box', dt > 0);
  regler('dither-shadows', Math.round((s.shadows ?? 0) * 100));
  regler('dither-highlights', Math.round((s.highlights ?? 0) * 100));
  regler('dither-region', Math.round((s.regionAusgleich ?? 0) * 100));
  // regionImmer: Zahl = Grundstärke; `true` (Stand 27.09. nachmittags) = Stärke wie regionAusgleich.
  const riw = s.regionImmer === true ? (s.regionAusgleich ?? 0) : (Number(s.regionImmer) || 0);
  chk('dither-region-immer', riw > 0);
  regler('dither-region-immer-st', Math.round((riw > 0 ? riw : 0.35) * 100), 'dither-region-immer-val');
  _zeigeRegler('dither-region-immer-box', riw > 0);
  regler('dither-kontur', Math.round((kow > 0 ? kow : 1.5) * 100));
  _zeigeRegler('dither-kontur-box', kow > 0);
  chk('dither-motiv', s.autoMotiv);
  regler('dither-motiv-max', Math.round((s.densityMax ?? 0.40) * 1000) / 10);
  _zeigeRegler('dither-motiv-box', s.autoMotiv);
  regler('dither-dotgain', Math.round(s.dotGain * 100));
  regler('dither-inkmin', Math.round(s.inkMin * 100));
  chk('dither-grafik', s.grafikAuto !== false);
  chk('dither-grafikweich', !!s.grafikWeich);
  regler('dither-hautkurve', Math.round((s.hautKurve || 0) * 100));
  chk('dither-gesicht', !!s.gesichtAuto);
  regler('dither-gesicht-ziel', Math.round((s.gesichtZiel ?? 0.15) * 100));
  regler('dither-gesicht-scharf', Math.round((s.gesichtSchaerfen || 0) * 100));
  _zeigeRegler('dither-gesicht-box', s.gesichtAuto);
  regler('dither-dropout', Math.round((s.inkDropout || 0) * 100));
  regler('dither-schatten', Math.round((s.schattenAuf || 0) * 100));
  regler('dither-inkmax', Math.round(s.inkMax * 100));
  set('dither-algo', s.algorithm);
  set('dither-dpi', s.dpi);
  chk('dither-datei500', (s.dateiDpi || 0) === 500);
  chk('dither-autocontrast', s.autoContrast);
  chk('dither-autogamma', s.autoGamma);
  regler('dither-autogamma-ziel', Math.round((s.autoGammaTarget ?? 0.45) * 100));
  _zeigeRegler('dither-autogamma-box', s.autoGamma);
  chk('dither-invert', s.invert);
  // Sektion folgt dem Preset: mit Kalibrierung auf, ohne zu (nur aufklappen hieße, dass
  // sie nach einem kalibrierten Material dauerhaft offen bleibt). Die Kopf-Anzeige muss
  // mit — _syncLaserUI läuft auch ohne anschließendes updateDitherSettings.
  toggleLaserCalib(_laserCalibBadge(s));
}

// ── Eigene Presets ───────────────────────────────────────────────────────────
// Am echten Material erprobte Werte, Form { id, name, settings: {…LASER_DEFAULTS} }.
// MATERIAL_PRESETS sind nur Startwerte.
let _customPresets = [];

async function loadCustomPresets() {
  try {
    _customPresets = await _laserPresetStore.load();
    if (!Array.isArray(_customPresets)) _customPresets = [];
  } catch (_) { _customPresets = []; }
  renderCustomPresets();
}

// Eigenes Preset per Name finden (Name = Schlüssel in ditherSettings.material)
const _customByName = (name) => _customPresets.find(p => p.name === name);

// Beschriftung der eingebauten Materialien — früher standen sie als Knopftext im HTML.
const MATERIAL_LABELS = {
  'foto': 'Foto (Standard)', 'kein': 'Kein', 'holz': 'Holz', 'metall': 'Metall',
  'metall-poliert': 'Metall poliert', 'acryl': 'Acryl', 'schiefer': 'Schiefer', 'leder': 'Leder',
};

// Das Auswahlfeld neu aufbauen: eigene Presets zuerst, darunter die eingebauten Startwerte.
// Heißt weiter renderCustomPresets, weil Laden/Speichern/Löschen es unter diesem Namen rufen.
function renderCustomPresets() {
  const sel = document.getElementById('laser-preset');
  if (!sel) return;
  const opt = (wert, text) => `<option value="${_esc(wert)}">${_esc(text)}</option>`;
  const eigene = _customPresets.map(p => opt(p.name, '★ ' + p.name)).join('');
  const standard = Object.keys(MATERIAL_PRESETS).map(k => opt(k, MATERIAL_LABELS[k] || k)).join('');
  sel.innerHTML = (eigene ? `<optgroup label="Eigene Presets">${eigene}</optgroup>` : '')
    + `<optgroup label="Standard-Materialien">${standard}</optgroup>`;
  _markMaterialBtn(); // aktuelle Voreinstellung im Feld zeigen
}

async function saveCustomPreset() {
  updateDitherSettings();
  const name = await promptModal('Eigenes Preset speichern',
    'Name (z. B. „Schwarze Platte 25mm"):', ditherSettings.material || '');
  if (!name || !name.trim()) return;
  const clean = name.trim();
  // Eingebaute Namen nicht überschreiben — sonst wäre unklar, welches Preset gilt
  if (MATERIAL_PRESETS[clean]) { showToast('⚠️ Name ist schon ein eingebautes Material — bitte anders nennen', 4000); return; }
  const list = await _laserPresetStore.load();
  // Immer mit active:true sichern: ein eigenes Preset IST eine Dither-Einstellung, und
  // ein zufällig ausgeschalteter Master ergäbe später harten Schwellenwert statt Raster.
  const settings = _laserSettings({ ...ditherSettings, active: true, material: clean });
  const idx = list.findIndex(p => p.name === clean);
  if (idx >= 0) {
    const ok = await confirmModal('Preset überschreiben?', `„${clean}" gibt es schon. Mit den aktuellen Werten überschreiben?`);
    if (!ok) return;
    list[idx].settings = settings;
  } else {
    list.push({ id: Date.now(), name: clean, settings });
  }
  if (await _laserPresetStore.save(list)) {
    _customPresets = list;
    ditherSettings.material = clean;
    renderCustomPresets();
    showToast('✅ Preset „' + clean + '" gespeichert');
  }
}

async function deleteCustomPreset(name) {
  const ok = await confirmModal('Preset löschen?', `„${name}" wirklich löschen?`);
  if (!ok) return;
  const list = (await _laserPresetStore.load()).filter(p => p.name !== name);
  if (await _laserPresetStore.save(list)) {
    _customPresets = list;
    if (ditherSettings.material === name) ditherSettings.material = 'kein';
    renderCustomPresets();
    showToast('🗑 Preset gelöscht');
  }
}

function setMaterial(mat) {
  // Eigene Presets haben Vorrang: sie sind am echten Material gemessen.
  const custom = _customByName(mat);
  const preset = custom ? custom.settings : MATERIAL_PRESETS[mat];
  if (preset) {
    // Auf LASER_DEFAULTS aufbauen, NICHT auf dem aktuellen Zustand: ein Schlüssel, den
    // das Preset nicht nennt, fällt damit auf den Standardwert und schleppt nicht den
    // Wert des vorigen Materials mit (s. den Kommentar über MATERIAL_PRESETS).
    ditherSettings = _laserSettings({ ...LASER_DEFAULTS, ...preset, material: mat });
    _syncLaserUI(ditherSettings);
    // Rundlauf UI→Zustand: zieht Toggle-Optik und Regler-Sperren nach. Verlustfrei,
    // _syncLaserUI hat die Werte gerade geschrieben; `material` bleibt unangetastet.
    updateDitherSettings();
  } else {
    ditherSettings.material = mat;
    _refreshLaserPreview();
  }
  _markMaterialBtn(mat);
}

// Zeigt im Auswahlfeld, welche Voreinstellung gerade gilt. Ein Name, den weder die eigenen
// Presets noch die eingebauten kennen (z. B. aus einem älteren Layout), bekommt einen eigenen
// Eintrag — sonst stünde das Feld auf dem ersten Preset und behauptete etwas Falsches.
function _markMaterialBtn(mat) {
  const sel = document.getElementById('laser-preset');
  if (!sel) return;
  const name = mat != null ? mat : ditherSettings.material;
  if (name && ![...sel.options].some(o => o.value === name)) {
    const g = document.createElement('optgroup');
    g.label = 'Aus dem Layout';
    g.innerHTML = `<option value="${_esc(name)}">${_esc(name)}</option>`;
    sel.prepend(g);
  }
  sel.value = name || '';
  const del = document.getElementById('laser-preset-loeschen');
  if (del) del.disabled = !_customByName(sel.value);   // eingebaute lassen sich nicht löschen
}

// Die Bildmathematik steht in public/laser-pipeline.js — per <script src> VOR diesem
// Skript geladen, ihre Funktionen sind hier normal sichtbar.

// Dithering auf ein Bild anwenden → neues Image. NUR für die Bildschirm-Vorschau; der
// Export geht über _buildLaserCanvas, damit in Zielauflösung gedithert wird.
async function applyDitheringToImage(img, settings) {
  const c = document.createElement('canvas');
  c.width = img.naturalWidth || img.width;
  c.height = img.naturalHeight || img.height;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, c.width, c.height);
  applyLaserPipeline(imageData.data, c.width, c.height, settings);
  ctx.putImageData(imageData, 0, 0);
  return _canvasZuBild(c);
}

// Dithering auf alle Bild-Felder anwenden
async function applyDitheringToAll() {
  if (!ditherSettings.active) {
    showToast('⚠️ Dithering ist nicht aktiv');
    return;
  }
  const imgFields = fields.filter(f => f.type === 'image' && f._img);
  if (!imgFields.length) { showToast('Keine Bilder gefunden'); return; }

  showToast('⏳ Dithering wird angewendet…');
  let count = 0;
  for (const f of imgFields) {
    // Original speichern falls noch nicht gespeichert
    if (!_originalImgs[f.id]) _originalImgs[f.id] = f._img;
    f._img = await applyDitheringToImage(_originalImgs[f.id], ditherSettings);
    count++;
  }
  renderEls(); drawCanvas();
  showToast('✓ Dithering auf ' + count + ' Bilder angewendet');
}

// „Ins Layout übernehmen": ohne diesen Schritt wirkt die Feinjustage NUR auf den
// manuellen Export — der Auto-Export liest layout.ditherSettings.
async function applyLaserCfgToLayout() {
  updateDitherSettings(); // Regler zurücklesen, BEVOR sie ins Layout wandern
  await _updateLoadedLayout(
    l => { l.ditherSettings = _laserSettings(ditherSettings); },
    l => '✅ Laser-Einstellungen in "' + l.name + '" gespeichert — gilt jetzt auch für den Auto-Export');
}

// ── Gravur-Vorschau ──────────────────────────────────────────────────────────
// Zeigt exakt das Bild, das als BMP an Ezcad2 geht (identischer Canvas). Der
// Schwarz-Anteil ist die wichtigste Kennzahl: er sagt die Gravurdauer voraus und warnt,
// bevor die Fläche zuläuft. Vier Modi, weil ein volles Blatt bei 500 DPI je
// Regleränderung ~1 s kostet und die Punktstruktur auf 29 Briefmarken unsichtbar ist:
//   detail · vergleich (Wischregler) · verfahren (5 Algorithmen) · blatt (Endkontrolle)
const _LP_MODES = ['detail', 'vergleich', 'verfahren', 'blatt'];
const _LP_MODE_LBL = { detail: 'Detail', vergleich: 'Vorher/Nachher', verfahren: 'Verfahren', blatt: 'Ganzes Blatt' };
let _lpMode = 'detail';
let _lpSlot = 0;      // Index in _laserSlots()
let _lpBlobUrls = []; // Object-URLs der aktuellen Ansicht — beim Wechsel freigeben

// Blob-URL statt Base64-DataURL: ein Blatt bei 500 DPI ergibt ein ~2,2-MB-PNG, als
// DataURL läge das als 3-MB-String im Heap UND noch einmal im DOM-Attribut.
async function _lpCanvasToUrl(c) {
  const blob = await _canvasToBlob(c, 'image/png');
  const url = URL.createObjectURL(blob);
  _lpBlobUrls.push(url);
  return url;
}
function _lpReleaseUrls() {
  for (const u of _lpBlobUrls) { try { URL.revokeObjectURL(u); } catch (_) { } }
  _lpBlobUrls = [];
}

// _lpBlackPct und _lpVerdict stehen NICHT hier, sondern in public/laser-pipeline.js.

function _lpSetMode(m) { _lpMode = m; showLaserPreview({ silent: true }); }
function _lpSlotStep(d) {
  const n = _laserSlots().length;
  if (n) _lpSlot = ((_lpSlot + d) % n + n) % n;
  showLaserPreview({ silent: true });
}

// Kopfleiste: Modus-Umschalter, Slot-Blätterer, Testgitter-Knopf.
function _lpRenderHead(slotCount) {
  // Gleicher Segment-Knopf wie im Eigenschaften-Panel (_segBtn).
  const modes = _LP_MODES.map(m =>
    _segBtn(_lpMode === m, `_lpSetMode('${m}')`, _LP_MODE_LBL[m], _LP_MODE_LBL[m], 'white-space:nowrap;')
  ).join('');
  const perSlot = _lpMode !== 'blatt' && slotCount > 1;
  document.getElementById('laser-preview-modes').innerHTML =
    `<div style="display:flex;gap:6px;flex:1;">${modes}</div>` +
    (perSlot
      ? `<div class="hstack" style="gap:4px;margin-left:8px;flex-shrink:0;">
           <button class="btn btn-muted btn-xs" onclick="_lpSlotStep(-1)">◀</button>
           <span style="font-size:var(--fs-klein);color:var(--text-dim);font-family:var(--mono);min-width:56px;text-align:center;">Foto ${_lpSlot + 1}/${slotCount}</span>
           <button class="btn btn-muted btn-xs" onclick="_lpSlotStep(1)">▶</button>
         </div>`
      : '');
}

// opts.silent = Neu-Rendern einer bereits offenen Vorschau (keine Toasts) — s. _refreshLaserPreview.
async function showLaserPreview(opts) {
  const silent = !!(opts && opts.silent);
  if (!silent) updateDitherSettings(); // sonst Endlosschleife: update → refresh → update
  // „· aktualisiert…" schaltet _refreshLaserPreview ein — JEDER Ausgang hier muss sie
  // wieder ausschalten, auch die frühen returns (kein Slot, kein Bild).
  const _hideBusy = () => {
    const b = document.getElementById('laser-preview-busy');
    if (b) b.style.display = 'none';
  };
  const slots = _laserSlots();
  if (!slots.length) { if (!silent) showToast('Keine Bilder auf dieser Seite'); _hideBusy(); return; }
  if (_lpSlot >= slots.length) _lpSlot = 0;

  if (!silent) showToast('⏳ Vorschau wird gerendert…');
  document.getElementById('laser-preview-overlay').style.display = 'flex';
  _lpRenderHead(slots.length);
  const body = document.getElementById('laser-preview-body');
  const stats = document.getElementById('laser-preview-stats');
  const s = _laserSettings(ditherSettings);
  const only = _lpMode === 'blatt' ? null : slots[_lpSlot];
  _lpReleaseUrls(); // Bilder der vorherigen Ansicht freigeben

  const imgStyle = 'max-width:100%;max-height:100%;image-rendering:pixelated;background:#fff;display:block;';

  if (_lpMode === 'verfahren') {
    // Alle fünf Verfahren desselben Slots — einmal rendern statt fünfmal umschalten.
    const algos = [
      ['floyd-steinberg', 'Floyd-Steinberg'], ['atkinson', 'Atkinson'],
      ['stucki', 'Stucki'], ['bayer', 'Bayer'], ['threshold', 'Schwellenwert'],
    ];
    const tiles = [];
    for (const [id, label] of algos) {
      const r = await _buildLaserCanvas({ ...s, active: id !== 'threshold', algorithm: id }, { only });
      if (!r) continue;
      const pct = _lpBlackPct(r);
      tiles.push({ url: await _lpCanvasToUrl(r.c), label, pct, active: id === s.algorithm });
      r.c.width = r.c.height = 0;
    }
    body.innerHTML = `<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;width:100%;align-content:start;">` +
      tiles.map(t => `
        <div style="border:2px solid ${t.active ? 'var(--accent)' : 'transparent'};border-radius:var(--r-s);padding:4px;background:var(--bg3);">
          <img src="${t.url}" style="width:100%;image-rendering:pixelated;background:#fff;border-radius:var(--r-xs);"/>
          <div style="font-size:var(--fs-klein);color:${t.active ? 'var(--accent)' : 'var(--text-dim)'};text-align:center;margin-top:4px;">${t.label}${t.active ? ' ·  aktiv' : ''}</div>
          <div style="font-size:var(--fs-mikro);color:var(--text-muted);text-align:center;">${t.pct.toFixed(1)} % graviert</div>
        </div>`).join('') + `</div>`;
    stats.innerHTML = `Derselbe Slot in allen fünf Verfahren · Gamma ${Number(s.gamma).toFixed(2)} · Schwelle ${s.threshold}`
      + `<br><span style="color:var(--text-muted);">Der umrandete ist gerade eingestellt. „Schwellenwert" ist bewusst ohne Rasterung — für Logos richtig, für Fotos meist nicht.</span>`;

  } else if (_lpMode === 'vergleich') {
    // Original und Gravur deckungsgleich übereinander, Wischregler dazwischen.
    const rRaw = await _buildLaserCanvas(s, { only, raw: true });
    const rOut = await _buildLaserCanvas(s, { only });
    if (!rRaw || !rOut) { stats.textContent = 'Kein Bild in diesem Slot.'; _hideBusy(); return; }
    const pct = _lpBlackPct(rOut);
    const uRaw = await _lpCanvasToUrl(rRaw.c), uOut = await _lpCanvasToUrl(rOut.c);
    const ar = rOut.c.width / rOut.c.height;
    rRaw.c.width = rRaw.c.height = 0; rOut.c.width = rOut.c.height = 0;
    body.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;max-height:100%;">
        <div style="position:relative;max-height:calc(92vh - 260px);aspect-ratio:${ar};max-width:100%;">
          <img src="${uRaw}" style="${imgStyle}position:absolute;inset:0;width:100%;height:100%;"/>
          <img id="lp-wipe-top" src="${uOut}" style="${imgStyle}position:absolute;inset:0;width:100%;height:100%;clip-path:inset(0 0 0 50%);"/>
          <div id="lp-wipe-line" style="position:absolute;top:0;bottom:0;left:50%;width:2px;background:var(--accent);pointer-events:none;"></div>
          <div style="position:absolute;top:6px;left:8px;font-size:var(--fs-mikro);color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:var(--r-xs);font-family:var(--mono);">Original</div>
          <div style="position:absolute;top:6px;right:8px;font-size:var(--fs-mikro);color:#fff;background:rgba(0,0,0,.6);padding:2px 6px;border-radius:var(--r-xs);font-family:var(--mono);">Gravur</div>
        </div>
        <input type="range" id="lp-wipe" min="0" max="100" value="50" style="width:min(420px,90%);"
               oninput="document.getElementById('lp-wipe-top').style.clipPath='inset(0 0 0 '+this.value+'%)';document.getElementById('lp-wipe-line').style.left=this.value+'%';"/>
      </div>`;
    stats.innerHTML = `Gravierte Fläche: <b>${pct.toFixed(1)} %</b> — ${_lpVerdict(pct, s.invert)}`
      + `<br><span style="color:var(--text-muted);">Regler ziehen: links Original, rechts das, was der Laser brennt. Achte auf Augen, Haare und weiche Verläufe.</span>`;

  } else {
    // detail (ein Slot) und blatt (alles) — identischer Aufbau, nur anderer Zuschnitt.
    const r = await _buildLaserCanvas(s, { only });
    if (!r) { stats.textContent = 'Kein Bild in diesem Slot.'; _hideBusy(); return; }
    const pct = _lpBlackPct(r);
    const url = await _lpCanvasToUrl(r.c);
    const dims = `<b>${r.c.width} × ${r.c.height} px</b> · ${r.bb.w.toFixed(1)} × ${r.bb.h.toFixed(1)} mm · ${r.dpi} DPI`
      + (r.dpi !== s.dpi ? ' <span style="color:var(--amber);">(wegen Größe reduziert)</span>' : '');
    r.c.width = r.c.height = 0;
    body.innerHTML = `<img src="${url}" style="${imgStyle}cursor:zoom-in;margin:auto;" data-zoom="0" onclick="toggleLaserPreviewZoom(this)"/>`;
    stats.innerHTML = dims
      + `<br>Gravierte Fläche: <b>${pct.toFixed(1)} %</b> — ${_lpVerdict(pct, s.invert)}`
      + `<br><span style="color:var(--text-muted);">${s.algorithm} · Gamma ${Number(s.gamma).toFixed(2)} · Schwelle ${s.threshold} · Kontrast ${s.contrast}`
      + `${s.autoContrast ? ' · Auto-Kontrast' : ''}${s.localContrast ? ' · lokaler Kontrast ' + Math.round(s.localContrast * 100) + '%' : ''}${s.konturen ? ' · Konturen ' + Math.round(s.konturen * 100) + '%' : (s.edgeBoost ? ' · Kanten ' + Math.round(s.edgeBoost * 100) + '%' : '')}${s.regionImmer ? ' · Bereiche immer ' + Math.round((s.regionImmer === true ? s.regionAusgleich : s.regionImmer) * 100) + '%' : ''}${s.densityTarget ? ' · Dichte-Regelung ' + Math.round(s.densityTarget * 100) + '%' : ''}${s.gesichtAuto ? ' · Gesichter ' + Math.round((s.gesichtZiel ?? 0.15) * 100) + '%' : ''}${s.sharpen ? ' · Schärfen ' + Math.round(s.sharpen * 100) + '%' : ''}`
      + `${s.dotGain ? ' · Ausgleich ' + Math.round(s.dotGain * 100) + '%' : ''}${s.inkDropout ? ' · Schnitt ' + Math.round(s.inkDropout * 100) + '%' : ''}${s.schattenAuf && s.inkDropout ? ' · Dunkelgrau ≥ ' + Math.round(s.schattenAuf * 100) + '%' : ''}`
      + `${(s.inkMin > 0 || s.inkMax < 1) ? ' · Tonwert ' + Math.round(s.inkMin * 100) + '–' + Math.round(s.inkMax * 100) + '%' : ''}`
      + `${s.invert ? ' · <b style="color:var(--amber);">invertiert</b>' : ''}</span>`;
  }

  _hideBusy();
}

function closeLaserPreview() {
  document.getElementById('laser-preview-overlay').style.display = 'none';
  document.getElementById('laser-preview-body').innerHTML = '';
  _lpReleaseUrls(); // sonst hält der Browser die PNG-Blobs bis zum Neuladen fest
}

// ── Kalibrier-Keil (Tonwert-Ausgleich bestimmen) ─────────────────────────────
// Elf Felder mit exakt bekanntem Tinten-Anteil (0…100 %). Aufs echte Material brennen und ablesen, ab
// welchem Feld keine weiße Struktur mehr zu sehen ist: läuft schon das 70-%-Feld zu, ist der
// Punktzuwachs ~30 % → Ausgleich auf ~30 %.
// Synthetisches Grau statt Foto — nur so ist der Eingangswert exakt bekannt. Gamma, Kontrast,
// Auto-Kontrast und Schärfen bleiben außen vor; Invertieren kommt mit (bestimmt die Optik).
// ZWINGEND außen vor: Tonwert-Ausgleich und -Begrenzung SELBST — sie sind das, was gemessen wird;
// liefen sie mit, schaukelte sich der abgelesene Wert mit jeder Runde auf.

// Weißes Ziel-Canvas für Kalibrier-Keil UND Testgitter. mm() rundet auf GANZE Pixel:
// Kacheln werden 1:1 kopiert, jede krumme Position würde das Punktmuster verrechnen.
function _makeSheet(bb, dpi) {
  const scale = dpi / 25.4;
  const { c, ctx } = _makeCanvas(bb, scale);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.fillStyle = '#000';
  ctx.textBaseline = 'middle';
  return { c, ctx, scale, mm: (v) => Math.round(v * scale) };
}

// Schriftgröße verkleinern, bis der Text in maxW passt. Mindestens 6 px — eine
// abgeschnittene Kopfzeile macht das gebrannte Blatt hinterher unzuordenbar.
function _fitFontTo(ctx, text, maxW, startPx) {
  let px = startPx;
  ctx.font = `${px}px sans-serif`;
  const need = ctx.measureText(text).width;
  if (need > maxW) { px = Math.max(6, Math.floor(px * maxW / need)); ctx.font = `${px}px sans-serif`; }
  return px;
}

const WEDGE_PATCH_MM = 14;
const WEDGE_LABEL_MM = 5;
const WEDGE_HEAD_MM = 12; // drei Kopfzeilen: Einstellungen + zwei Ableseregeln

// Gamma-Angabe für die Kopfzeilen der Testbrände: bei Auto-Gamma ist der Regler nur ein
// Faktor auf den Wert, den jedes Foto selbst bekommt — „G 1,00" wäre dort schlicht falsch.
function _gammaText(s) {
  return s.autoGamma
    ? `G auto (Ziel ${Math.round((s.autoGammaTarget ?? 0.45) * 100)} %${Number(s.gamma) !== 1 ? ', Faktor ' + Number(s.gamma).toFixed(2) : ''})`
    : `G ${Number(s.gamma).toFixed(2)}`;
}

// ── Regler, die in JEDEM Testbrand aus müssen ────────────────────────────────
// Auto-Gamma und Dichte-Regelung sind REGELUNGEN: sie ziehen jede Kachel auf denselben Zielwert —
// genau das macht jede Testreihe wertlos (ihr Sinn ist der Unterschied zwischen den Kacheln). Am
// teuersten beim Keil: er wird gebrannt, abgelesen und eingetragen.
// Deshalb steht es EINMAL hier, und jede Testausgabe streut es ein. Wer eine weitere Regelung auf das
// fertige Raster baut, trägt sie in _REGELUNG_AUS ein. Reine EFFEKTE (Kanten, lokaler Kontrast,
// Schärfen, Ausgleich) bleiben an — sie gehören zum Aussehen, das beurteilt werden soll.
// Zwei Stufen:
//   _REGELUNG_AUS  nur die Regelung aufs fertige Raster — Tiefen- und DPI-Reihe (Auto-Gamma ist dort
//                  harmlos: dasselbe Foto ergibt dieselbe Kurve).
//   _MESS_AUS      zusätzlich die Gamma-Automatik — Keil und Testgitter (Gamma ist dort die Achse).
// regionAusgleich greift je Kachel nach dem fertigen Raster — also ebenfalls eine Regelung.
const _REGELUNG_AUS = { densityTarget: 0, inkDropout: 0, regionAusgleich: 0 };
const _MESS_AUS = { ..._REGELUNG_AUS, autoGamma: false };

async function exportCalibrationWedge() {
  const s = _laserSettings(ditherSettings);
  // Ohne Rasterung ist der Keil wertlos: jedes Feld kippt komplett auf Schwarz oder Weiß
  // (gemessen 0/0/0/0/0/0/100/100/100/100/100 %) — lieber ein Hinweis als ein umsonst
  // gebranntes Werkstück.
  if (!s.active) { showToast('⚠️ Dithering ist aus — ein Kalibrier-Keil ohne Rasterung hat nur Schwarz und Weiß', 5000); return; }
  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const cols = 6, rows = Math.ceil(steps.length / cols);
  const gridBB = {
    w: cols * WEDGE_PATCH_MM,
    h: WEDGE_HEAD_MM + rows * (WEDGE_PATCH_MM + WEDGE_LABEL_MM),
  };
  const dpi = _capLaserDpi(s.dpi, gridBB);
  const { c, ctx, mm } = _makeSheet(gridBB, dpi);
  const patchPx = mm(WEDGE_PATCH_MM);

  for (let i = 0; i < steps.length; i++) {
    const ink = steps[i] / 100;
    const col = i % cols, row = Math.floor(i / cols);
    const x = col * patchPx;
    const y = mm(WEDGE_HEAD_MM) + row * (patchPx + mm(WEDGE_LABEL_MM));

    // Feld mit konstantem Grauwert füllen und NUR rastern (+ ggf. invertieren) —
    // exakt der Weg, den auch ein Foto-Pixel dieses Werts nimmt.
    const tile = document.createElement('canvas');
    tile.width = patchPx; tile.height = patchPx;
    const tctx = tile.getContext('2d');
    const img = tctx.createImageData(patchPx, patchPx);
    // Tinte → Grauwert. Bei INVERTIERTER Ausgabe graviert der Laser die HELLEN Bildpartien (s. _inkOf),
    // der Wert muss dort also mitdrehen — sonst trüge jedes Feld die falsche Beschriftung („10 %“
    // gravierte 90 %) und verdrehte jeden abgelesenen Ausgleich.
    const v = Math.round(255 * (s.invert ? ink : 1 - ink));
    for (let k = 0; k < img.data.length; k += 4) {
      img.data[k] = img.data[k + 1] = img.data[k + 2] = v; img.data[k + 3] = 255;
    }
    // _MESS_AUS ist hier zwingend (s. dort): die Felder sind je ein konstanter Grauwert,
    // und jede Regelung zieht genau so ein Feld auf ihren Zielwert — alle elf Felder kämen
    // gleich heraus und der Keil wäre wertlos. Kanten und lokaler Kontrast kommen hier
    // zusätzlich raus: auf einer einfarbigen Fläche haben sie nichts zu fassen, aber der
    // Keil soll NUR die Rasterung zeigen, ohne stille Zutaten.
    // CLAHE ebenso: es spreizt auch ein einfarbiges Feld (gemessen F02 schwarz: 0 % → 0,9 %, 10 % → 11,2 %).
    applyLaserPipeline(img.data, patchPx, patchPx,
      {
        ...s, ..._MESS_AUS, gamma: 1.0, contrast: 0, autoContrast: false, clahe: 0, sharpen: 0,
        edgeBoost: 0, localContrast: 0, dotGain: 0, inkMin: 0, inkMax: 1
      }, null);
    tctx.putImageData(img, 0, 0);
    ctx.drawImage(tile, x, y); // 1:1 — keine Skalierung, Punktmuster bleibt exakt
    tile.width = tile.height = 0;

    ctx.fillStyle = '#fff';
    ctx.fillRect(x, y + patchPx, patchPx, mm(WEDGE_LABEL_MM));
    ctx.fillStyle = '#000';
    ctx.textBaseline = 'middle';
    ctx.font = `${mm(3.2)}px sans-serif`;
    ctx.fillText(`${steps[i]} %`, x + mm(1), y + patchPx + mm(WEDGE_LABEL_MM / 2));
  }

  // „ohne Ausgleich" ist eine Zusage, keine Momentaufnahme: der Keil wird IMMER
  // unkompensiert gerastert, sonst passt die Beschriftung nicht zum Tinten-Anteil.
  const head1 = `Kalibrier-Keil · ${s.algorithm} · ${dpi} DPI${s.invert ? ' · invertiert' : ''}`
    + ` · ohne Ausgleich, ohne Automatik (Messblatt)`
    + ` · ${new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}`;
  // Die Ableseregel steht auf dem BLATT, für jeden der drei Regler getrennt: wer den Keil
  // in zwei Wochen wiederfindet, soll ihn ohne diese Datei auswerten können.
  const head2 = 'Ablesen 1: erstes Feld ohne weisse Struktur = alles zugelaufen. 100 minus dieser Wert = Tonwert-Ausgleich.';
  const head3 = 'Ablesen 2: erstes Feld mit sichtbaren Punkten = Lichter-Grenze. Letztes mit Struktur = Tiefen-Grenze.';
  _testKopf({ c, ctx, mm }, [[head1, 3.2, 2.6], [head2, 2.6, 6.0], [head3, 2.6, 9.0]]);
  _testSpeichern({ c }, dpi, `kalibrier-keil-${dpi}dpi.bmp`, '✓ Kalibrier-Keil gespeichert — brennen, ablesen, Tonwert-Ausgleich einstellen');
}

// ── Testgitter ───────────────────────────────────────────────────────────────
// 3×3 Varianten DESSELBEN Fotos: Gamma über die Zeilen, Schwellenwert (bzw. Schärfen)
// über die Spalten. Einmal brennen, beste Kachel ablesen, Werte eintragen.
// Entscheidend: alle Kacheln mit DERSELBEN, einmal gedeckelten DPI rastern und 1:1 an
// ganzzahligen Pixel-Positionen kopieren — jede Skalierung verrechnet das Punktmuster.
const TESTGRID_GAP_MM = 3;    // Abstand zwischen den Kacheln
const TESTGRID_LABEL_MM = 5;  // Beschriftungsstreifen unter jeder Kachel
const TESTGRID_HEAD_MM = 11;  // Kopfbereich: zwei Zeilen (feste Einstellungen + Achsen-Legende)

// ── Gemeinsame Bausteine der Testblätter (Testgitter, Tiefen-Reihe, DPI-Reihe, Keil) ──
// Foto des gewählten Platzes + Einstellungen; null (mit Meldung), wenn kein Foto da ist oder
// die Rasterung aus ist — ohne Rasterung sagt kein Testblatt etwas aus.
function _testVorbereiten(was) {
  const slots = _laserSlots();
  if (!slots.length) { showToast(`Keine Bilder auf dieser Seite — ${was} braucht ein Foto`); return null; }
  const s = _laserSettings(ditherSettings);
  if (!s.active) { showToast(`⚠️ Dithering ist aus — ohne Rasterung sagt ${was} nichts aus`, 5000); return null; }
  return { field: slots[Math.min(_lpSlot, slots.length - 1)], s };
}
// Kacheln gleicher Größe (bb) in cols × rows unter dem Kopfbereich: Blattmaße + Pixel-Lage.
function _testRaster(bb, cols, rows) {
  const cellH = bb.h + TESTGRID_LABEL_MM;
  return {
    w: cols * bb.w + (cols - 1) * TESTGRID_GAP_MM, h: TESTGRID_HEAD_MM + rows * cellH + (rows - 1) * TESTGRID_GAP_MM,
    lage: (mm, col, row) => [mm(col * (bb.w + TESTGRID_GAP_MM)), mm(TESTGRID_HEAD_MM + row * (cellH + TESTGRID_GAP_MM))]
  };
}
// Kopfzeilen [Text, Schrift-mm, y-mm] — auf Blattbreite eingepasst.
function _testKopf({ c, ctx, mm }, zeilen) {
  ctx.fillStyle = '#000';
  for (const [text, gr, y] of zeilen) { _fitFontTo(ctx, text, c.width - mm(2), mm(gr)); ctx.fillText(text, mm(1), mm(y)); }
}
// Kachel 1:1 aufs Blatt (keine Skalierung → Punktmuster bleibt exakt), darunter die
// Beschriftung auf weißem Streifen: lesbar, egal ob invertiert graviert wird.
function _testKachel({ ctx, mm }, r, x, y, bb, lbl, schriftMm) {
  ctx.drawImage(r.c, x, y);
  r.c.width = r.c.height = 0;
  const ly = y + mm(bb.h);
  ctx.fillStyle = '#fff'; ctx.fillRect(x, ly, mm(bb.w), mm(TESTGRID_LABEL_MM));
  ctx.fillStyle = '#000';
  _fitFontTo(ctx, lbl, mm(bb.w) - mm(1), mm(schriftMm));
  ctx.fillText(lbl, x + mm(0.5), ly + mm(TESTGRID_LABEL_MM / 2));
}
// Blatt als 1-Bit-BMP herunterladen.
function _testSpeichern({ c }, dpi, datei, meldung) {
  const blob = _bmpBlob(c, dpi);
  c.width = c.height = 0;
  _downloadBlob(blob, datei);
  showToast(meldung, 7000);
}

// (_ERR_DIFFUSION steht in laser-pipeline.js bei den Kerneln — updateDitherSettings braucht die Liste
//  schon beim ersten Zeichnen des Laser-Tabs.)

async function exportTestGrid() {
  const t = _testVorbereiten('das Testgitter');
  if (!t) return;
  const { field, s } = t;

  const gammas = _spread3(Number(s.gamma), 0.2, 0.5, 2.0);
  // Zweite Achse je nach Verfahren (s. Kommentar oben)
  const byThreshold = !_ERR_DIFFUSION.includes(s.algorithm);
  const cols = byThreshold
    ? _spread3(Math.round(s.threshold), 25, 1, 254).map(Math.round)
    : _spread3(Math.round(s.sharpen * 100), 30, 0, 200).map(Math.round);   // bis 200 wie der Regler (F02 schwarz: 150)
  const colOv = (v) => byThreshold ? { threshold: v } : { sharpen: v / 100 };
  const colLbl = (v) => byThreshold ? `S ${v}` : `Sch ${v}%`;
  const colAxis = byThreshold ? 'Schwellenwert' : 'Schärfen';

  showToast('⏳ Testgitter wird gerendert (9 Varianten)…', 4000);

  // Maße aus EINER Kachel ableiten, dann DPI einmal über das ganze Gitter deckeln.
  const tileBB = _imageFieldsBBox([field], getPg()); // Blattgröße durchreichen (s. laser-pipeline.js)
  const gridBB = _testRaster(tileBB, 3, 3);
  const dpi = _capLaserDpi(s.dpi, gridBB);
  const blatt = _makeSheet(gridBB, dpi);

  // Kopfbereich, zwei Zeilen: was FEST ist, und was die Achsen bedeuten — sonst ist das
  // gebrannte Blatt in zwei Wochen nicht mehr zuzuordnen.
  const head1 = `${s.algorithm} · Kontrast ${s.contrast}${s.clahe > 0 ? ' (CLAHE ' + String(s.clahe).replace('.', ',') + ')' : s.autoContrast ? ' (auto)' : ''}`
    + `${s.autoGamma ? ' · Auto-Gamma für den Test aus' : ''}`
    + `${s.densityTarget ? ' · Dichte-Regelung für den Test aus' : ''}`
    + `${byThreshold && s.sharpen ? ' · Schärfen ' + Math.round(s.sharpen * 100) + '%' : ''}`
    + `${!byThreshold ? ' · Schwelle ' + s.threshold : ''}`
    + `${s.invert ? ' · invertiert' : ''} · ${dpi} DPI · ${new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}`;
  const head2 = `Zeilen: Gamma (G)   ·   Spalten: ${colAxis}   ·   % = gravierte Fläche`;
  _testKopf(blatt, [[head1, 3.2, 3], [head2, 2.6, 7.5]]);

  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const g = gammas[row], cv = cols[col];
      // _MESS_AUS (s. dort): die Zeilen vergleichen feste Gamma-Werte. Bliebe Auto-Gamma
      // an, wäre der Wert nur ein Faktor darauf und die Beschriftung „G 0,50" stimmte
      // nicht mehr; bliebe die Dichte-Regelung an, kämen ALLE neun Kacheln auf denselben
      // Prozentwert und die Gamma-Achse wäre tot.
      const r = await _buildLaserCanvas({ ...s, ..._MESS_AUS, gamma: g, ...colOv(cv) }, { only: field, forceDpi: dpi });
      if (!r) continue;
      const pct = _lpBlackPct(r); // dieselbe Kennzahl wie in der Vorschau → vergleichbar
      const [x, y] = gridBB.lage(blatt.mm, col, row);
      _testKachel(blatt, r, x, y, tileBB, `G ${g.toFixed(2)}  ${colLbl(cv)}  ${pct.toFixed(0)}%`, 3);
    }
  }

  _testSpeichern(blatt, dpi, `testgitter-${dpi}dpi.bmp`,
    `✓ Testgitter gespeichert — Gamma ${gammas.map(v => v.toFixed(2)).join('/')} × ${colAxis} ${cols.join('/')}`);
}

// ── Tiefen-Reihe ─────────────────────────────────────────────────────────────
// DASSELBE Gesicht mit sechs Tiefen-Grenzen auf einem Blatt. Der Keil zeigt, WAS die Maschine kann;
// dieser Test zeigt, wie ein GESICHT darin aussieht. Maschinen kippen bei voller Deckung ins Dunkle
// oder laufen ab halber Deckung zu — beides verschwindet, sobald das Bild die oberste Zone gar nicht
// erst benutzt; genau das stellt die Tiefen-Grenze ein.
// Alle Kacheln in DERSELBEN DPI (1:1-Kopieren, s. Testgitter).
const TIEFEN_STUFEN = [1.0, 0.9, 0.85, 0.8, 0.7, 0.6];

async function exportTiefenReihe() {
  const t = _testVorbereiten('die Tiefen-Reihe');
  if (!t) return;
  const { field, s } = t;

  const cols = 3, rows = Math.ceil(TIEFEN_STUFEN.length / cols);
  const tileBB = _imageFieldsBBox([field], getPg());
  const gridBB = _testRaster(tileBB, cols, rows);
  const dpi = _capLaserDpi(s.dpi, gridBB);
  const blatt = _makeSheet(gridBB, dpi);

  showToast(`⏳ Tiefen-Reihe wird gerendert (${TIEFEN_STUFEN.length} Varianten)…`, 4000);

  const head1 = `Tiefen-Reihe · ${s.algorithm} · ${dpi} DPI · ${_gammaText(s)}`
    + `${s.densityTarget ? ' · Dichte-Regelung für den Test aus' : ''}`
    + `${s.invert ? ' · invertiert' : ''} · ${new Date().toLocaleDateString('de-DE', { timeZone: 'Europe/Berlin' })}`;
  const head2 = 'Beste Kachel = Wangen hell UND noch Zeichnung darin. Deren Wert als Tiefen-Grenze eintragen.';
  _testKopf(blatt, [[head1, 3.2, 3.5], [head2, 2.6, 8]]);

  for (let i = 0; i < TIEFEN_STUFEN.length; i++) {
    const max = TIEFEN_STUFEN[i];
    // Dichte-Regelung aus (_REGELUNG_AUS): sie gleicht eine niedrigere Tiefen-Grenze
    // exakt wieder aus — gemessen kamen sonst alle sechs Kacheln auf 22 % und die Reihe
    // zeigte nichts. Auto-Gamma bleibt an: dasselbe Foto ergibt in allen Kacheln dieselbe
    // Kurve, die Kacheln sehen damit aus wie im Lauf, und die Kopfzeile stimmt weiter.
    const r = await _buildLaserCanvas({ ...s, ..._REGELUNG_AUS, inkMax: max }, { only: field, forceDpi: dpi });
    if (!r) continue;
    const [x, y] = gridBB.lage(blatt.mm, i % cols, Math.floor(i / cols));
    _testKachel(blatt, r, x, y, tileBB, `Tiefe ${Math.round(max * 100)} %`, 3.2);
  }

  _testSpeichern(blatt, dpi, `tiefen-reihe-${dpi}dpi.bmp`, '✓ Tiefen-Reihe gespeichert — auf JEDER Maschine brennen, beste Kachel ablesen');
}

// ── DPI-Reihe ────────────────────────────────────────────────────────────────
// Dasselbe Foto in mehreren Auflösungen, je eine EIGENE Datei. Nicht als Gitter:
// Kacheln unterschiedlicher DPI müssten auf ein gemeinsames Blatt skaliert werden, und
// jede Skalierung verrechnet genau das Punktmuster, das hier beurteilt werden soll.
// Wozu: die richtige DPI hängt am Laserpunkt (Brennweite, Fokus, Leistung), nicht am
// Bild. Ist die DPI höher als die Maschine auflöst, laufen die Punkte ineinander und
// das Foto wird flau und zu dunkel — bei zwei Maschinen mit verschiedenen Objektiven
// braucht jede ihren eigenen Wert.
const DPI_REIHE = [250, 300, 400, 500, 600];

async function exportDpiReihe() {
  const t = _testVorbereiten('die DPI-Reihe');
  if (!t) return;
  const { field, s } = t;

  showToast(`⏳ DPI-Reihe wird gerendert (${DPI_REIHE.length} Dateien)…`, 4000);
  const bb = _imageFieldsBBox([field], getPg());
  const LABEL_MM = 5;
  const outputs = [];
  for (const dpi of DPI_REIHE) {
    // Ohne Dichte-Regelung (_REGELUNG_AUS): der aufgedruckte Prozentwert soll der ECHTE
    // Tonwert dieser Auflösung sein, nicht der, auf den eine Regelung ihn gezogen hat —
    // genau der Unterschied zwischen den Auflösungen ist ja die Frage.
    const r = await _buildLaserCanvas({ ...s, ..._REGELUNG_AUS }, { only: field, forceDpi: dpi });
    if (!r) continue;
    // Blatt = Kachel + Beschriftungsstreifen, in DERSELBEN DPI wie die Kachel, damit
    // nichts skaliert werden muss.
    const blatt = _makeSheet({ w: bb.w, h: bb.h + LABEL_MM }, dpi);
    blatt.ctx.drawImage(r.c, 0, 0);
    const pct = _lpBlackPct(r);
    const lbl = `${dpi} DPI · ${_gammaText(s)}${s.densityTarget ? ' · o. Regelung' : ''} · ${pct.toFixed(0)}%`;
    _fitFontTo(blatt.ctx, lbl, blatt.mm(bb.w) - blatt.mm(1), blatt.mm(3));
    blatt.ctx.fillStyle = '#000';
    blatt.ctx.fillText(lbl, blatt.mm(0.5), blatt.mm(bb.h + LABEL_MM / 2));
    outputs.push({ name: `dpi-${dpi}.bmp`, blob: _bmpBlob(blatt.c, dpi) });
    r.c.width = r.c.height = 0;
    blatt.c.width = blatt.c.height = 0;
  }
  const ok = await _downloadPerPageOutputs(outputs, 'dpi-reihe.bmp', 'dpi-reihe.zip');
  showToast(ok ? `✓ DPI-Reihe gespeichert — ${DPI_REIHE.join(' / ')} DPI. Auf JEDER Maschine brennen und die beste ablesen.`
    : '⚠️ Keine Datei erzeugt', 7000);
}

function toggleLaserPreviewZoom(img) {
  const full = img.dataset.zoom === '1';
  img.dataset.zoom = full ? '0' : '1';
  img.style.maxWidth = full ? '100%' : 'none';
  img.style.maxHeight = full ? '100%' : 'none';
  img.style.cursor = full ? 'zoom-in' : 'zoom-out';
}

// Original wiederherstellen
function resetDithering() {
  let count = 0;
  for (const f of fields) {
    if (f.type === 'image' && _originalImgs[f.id]) {
      f._img = _originalImgs[f.id];
      delete _originalImgs[f.id];
      count++;
    }
  }
  renderEls(); drawCanvas();
  showToast(count > 0 ? '↺ Original für ' + count + ' Bilder wiederhergestellt' : 'Keine gespeicherten Originale');
}

// (Der 1-Bit-BMP-Schreiber steht in public/laser-pipeline.js — er gehört zur
//  Rasterung und kommt ohne DOM aus.)

// (Zuschnitt und Messflächen — _fieldAABB, _imageFieldsBBox, _fieldRectsPx — stehen
//  in public/laser-pipeline.js.)

// ── Gesichter finden (YuNet über onnxruntime-web, s. laser-pipeline.js) ──────
// Erst beim ersten Bedarf geladen (≈ 11 MB WASM + 230 KB Modell), ein Faden: ohne Cross-Origin-
// Isolation gibt es keine Worker-Fäden, und für ein Bild je Platz reicht einer.
let _ynSitzung = null;
function _ynLaden() {
  if (!_ynSitzung) {
    _ynSitzung = (async () => {
      const basis = new URL('vendor/', location.href).href;
      const ort = await import(basis + 'onnxruntime/ort.wasm.min.mjs');
      ort.env.wasm.numThreads = 1;
      ort.env.wasm.wasmPaths = basis + 'onnxruntime/';
      const sitzung = await ort.InferenceSession.create(basis + 'yunet/face_detection_yunet_2023mar.onnx',
        { executionProviders: ['wasm'] });
      return { ort, sitzung };
    })();
    _ynSitzung.catch(() => { _ynSitzung = null; });
  }
  return _ynSitzung;
}
// RGBA-Bild → Gesichtskästen in dessen Pixeln. EIN Weg für Export (_gesichterImFeld) und Reklamation.
async function _yunetFinden(rgba, w, h) {
  const ein = _yunetEingang(rgba, w, h);
  const { ort, sitzung } = await _ynLaden();
  const erg = await sitzung.run({ input: new ort.Tensor('float32', ein.tensor, [1, 3, _YN_IN, _YN_IN]) });
  const out = {};
  for (const n of sitzung.outputNames) out[n] = erg[n].data;
  return _yunetAuswerten(out, ein.f);
}
// Gesichter in EINEM Bildfeld des Laser-Canvas. Das Feld ist um f.rotation gedreht gezeichnet, das
// Kundenfoto darin um den Amazon-Winkel — erst zurückdrehen (YuNet findet fast nur aufrechte
// Gesichter), dann die Kästen in Canvas-Pixel zurückrechnen.
// Kästen je Feldinhalt merken: die Einzelplatz-Vorschau rechnet dasselbe Feld bei jeder Reglerbewegung
// neu. Schlüssel ist das KUNDENFOTO (URL) samt Platzierung, nie die Feld-ID — die wiederholt sich je
// Layout (s. _clearOriginalImgs). Ohne Foto-URL (Bild von Hand eingefügt) wird nicht gemerkt.
const _ynCache = new Map();
async function _gesichterImFeld(c, r, f) {
  const x0 = Math.max(0, Math.floor(r.x)), y0 = Math.max(0, Math.floor(r.y));
  const x1 = Math.min(c.width, Math.ceil(r.x + r.w)), y1 = Math.min(c.height, Math.ceil(r.y + r.h));
  const w = x1 - x0, h = y1 - y0;
  if (w < 32 || h < 32) return [];
  const schluessel = f._imgSrc ? [f._imgSrc, JSON.stringify(f._placement?.buyerPlacement || null), f.rotation || 0, x0, y0, w, h].join('|') : null;
  if (schluessel && _ynCache.has(schluessel)) return _ynCache.get(schluessel);
  const roh = c.getContext('2d').getImageData(x0, y0, w, h).data;
  const winkel = -(f.rotation || 0) - (f._placement?.buyerPlacement?.angleOfRotation || 0);
  const grad = ((Math.round(winkel / 90) * 90) % 360 + 360) % 360;
  const gedreht = _drehenRGBA(roh, w, h, grad);
  const kaesten = (await _yunetFinden(gedreht.d, gedreht.w, gedreht.h)).map(b => _kastenZurueck(b, w, h, grad))
    .map(b => ({ x0: b.x0 + x0, y0: b.y0 + y0, x1: b.x1 + x0, y1: b.y1 + y0, p: b.p }));
  if (schluessel) { if (_ynCache.size > 200) _ynCache.clear(); _ynCache.set(schluessel, kaesten); }
  return kaesten;
}

// ── Gemeinsamer Laser-Canvas ─────────────────────────────────────────────────
// DER Kern für BMP. Die REIHENFOLGE ist entscheidend: erst die Original-Fotos in ZIELAUFLÖSUNG auf
// den Canvas rendern, DANN einmal die Laser-Pipeline darüber. Umgekehrt (dithern, dann skalieren)
// verrechnet das Resampling die Punkte zu Grau, und die Punktstruktur geht verloren.
// renderFieldToCtx({useOriginal:true}) rendert aus dem Original statt aus dem Vorschaubild — es kann
// also nicht doppelt gedithert werden.
// STABILER ZUSCHNITT: der Ausschnitt kommt aus ALLEN Bildfeldern des Layouts, gezeichnet werden nur
// die GEFÜLLTEN — sonst ändern sich Größe und Ursprung des BMP mit der Zahl der Fotos (für BMP/PNG
// dasselbe wie `dxfFrame` für die DXF).
// Rückgabe: { c, bb, dpi, rects } oder null (keine gefüllten Bildfelder auf der Seite).
// opts.only     = EIN Bildfeld statt der ganzen Seite (Detail-/Vergleichs-/Verfahrens-Ansicht,
//                 Testgitter); Rasterung weiter in ECHTER Ziel-DPI.
// opts.raw      = Pipeline überspringen (das „Vorher“ im Vergleich).
// opts.forceDpi = DPI vorgeben statt selbst deckeln (Testgitter: alle Kacheln gleich).
async function _buildLaserCanvas(settings, opts = {}) {
  const s = _laserSettings(settings);
  const allImgFields = opts.only ? [opts.only] : fields.filter(f => f.type === 'image');
  const drawFields = allImgFields.filter(f => f._img || f._imgSrc);
  if (!drawFields.length) return null;

  // (Der Schalter „Gravurtext mit ins BMP" ist am 06.10.2026 entfallen: kein Layout und
  // keine Einstellung hat ihn je gesetzt. Text geht als DXF an die Maschine.)
  const bb = _imageFieldsBBox(allImgFields, getPg()); // Blattgröße durchreichen (s. laser-pipeline.js)
  const dpi = opts.forceDpi || _capLaserDpi(s.dpi, bb);
  const scale = dpi / 25.4;

  // Leinwand auf GANZE Pixel abrunden, nicht runden: ein 33-mm-Feld ist bei 500 DPI 649,6 px breit;
  // gerundet war die letzte Spalte nur zu 60 % Foto — nach Schärfen und Invertieren eine voll gravierte
  // Linie am rechten Rand („weißer Streifen rechts“). Abgerundet fehlen höchstens 0,05 mm Foto.
  const { c, ctx } = _makeCanvas({
    w: Math.max(1, Math.floor(bb.w * scale + 1e-6)) / scale,
    h: Math.max(1, Math.floor(bb.h * scale + 1e-6)) / scale
  }, scale);
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, c.width, c.height);
  ctx.translate(-bb.x * scale, -bb.y * scale);
  for (const f of drawFields) await renderFieldToCtx(ctx, f, scale, { useOriginal: true, invert: s.invert });

  // Messflächen = nur die BELEGTEN Slots: ein leerer ist weiß und verfälscht
  // Auto-Kontrast und Schwarz-Anteil.
  const rects = _fieldRectsPx(drawFields, bb, scale);

  if (!opts.raw) {
    // Gesichts-Automatik: Kästen VOR der Pipeline suchen (sie braucht das Farbbild). Schlägt die
    // Erkennung fehl, läuft der Export ohne sie weiter — nie wegen der Automatik abbrechen.
    let gesichter = null;
    if (s.active && s.gesichtAuto) {
      try {
        gesichter = [];
        for (let i = 0; i < drawFields.length && i < rects.length; i++)
          gesichter.push(...await _gesichterImFeld(c, rects[i], drawFields[i]));
      } catch (e) {
        console.warn('Gesichtserkennung fehlgeschlagen — Platz ohne Gesichts-Automatik:', e?.message || e);
        gesichter = null;
      }
    }
    let imageData = ctx.getImageData(0, 0, c.width, c.height);
    const _lpInfo = applyLaserPipeline(imageData.data, c.width, c.height, s, rects, gesichter ? { gesichter } : undefined);
    _letzteGesichter = gesichter && !_lpInfo?.grafik && !_lpInfo?.logo && !_lpInfo?.weich ? (_lpInfo?.gesichter || []) : null;
    if (_letzteGesichter) console.log('Gesichts-Automatik: ' + (_letzteGesichter.length
      ? _letzteGesichter.map(g => Math.round(g.vorher * 100) + ' → ' + Math.round((g.nachher ?? g.vorher) * 100) + ' %').join(', ')
      : 'kein Gesicht gefunden'));
    // Auto-Gamma ins Log: welches Foto welchen Wert bekommen hat, ist sonst nirgends zu
    // sehen — im Nachtlauf steht es damit in logs/index.log (Präfix „Browser:").
    if (s.autoGamma && _lpInfo?.gammas?.length) {
      console.log('Auto-Gamma (Ziel ' + Math.round((s.autoGammaTarget ?? 0.45) * 100) + ' %):',
        _lpInfo.gammas.map(g => (g == null ? '–' : g.toFixed(2))).join(' / '));
    }
    // Der Faktor der Dichte-Regelung ist der STÄRKSTE Hebel im ganzen Bild (gemessen
    // zwischen 0,15 und 1,73) — er wurde bisher berechnet, zurückgegeben und
    // weggeworfen. Nach einem schlechten Lauf war damit nirgends nachzulesen, wie weit
    // die Regelung gezogen hat. Jetzt steht er neben dem Auto-Gamma im Nachtlauf-Log.
    if (_lpInfo?.geregelt != null) {
      console.log('Dichte-Regelung (Ziel ' + Math.round(s.densityTarget * 100) + ' %): Gamma-Faktor '
        + _lpInfo.geregelt.toFixed(3));
    }
    // Bereiche einzeln belichtet (s. _regionAusgleichRegion in laser-pipeline.js): nur bei
    // Plätzen, die sonst Zeichnung verlieren. Steht im Log und in der Belegungsliste —
    // sonst sähe man dort nur die gute neue Kennzahl und nicht, dass nachgearbeitet wurde.
    _letzteRegion = _lpInfo?.region || null;
    // Buntes Logo auf dunklem Grund (s. _istLogoAufDunkel in laser-pipeline.js): eigene
    // Einstellung ohne Kanten und mit Atkinson — im Log und in der Belegungsliste sichtbar.
    // Grafik (s. _grafikEinstellung): Schwelle statt Raster — die Reklamation zeigt es an (s. _rfArtLesen).
    _letzteGrafik = !!_lpInfo?.grafik;
    _letzteLogo = !!_lpInfo?.logo;
    if (_letzteLogo) console.log('Buntes Logo erkannt: Atkinson-Raster, Tonwerte der Vorlage, ohne Kantenverstärkung');
    _letzteWeich = !!_lpInfo?.weich;
    if (_letzteWeich) console.log('Grafik mit Verläufen: Tonwerte der Vorlage, ohne Dichte-Regelung und Ausgleich');
    if (_letzteRegion) {
      console.log('Bereiche einzeln belichtet: Zeichnung verloren ' + Math.round(_letzteRegion.vorher * 100)
        + ' % → ' + (_letzteRegion.nachher == null ? '–' : Math.round(_letzteRegion.nachher * 100) + ' %')
        + (_letzteRegion.uebernommen ? ' — übernommen' : ' — verworfen, kein Gewinn'));
    }
    // Verlorene Zeichnung (s. laser-pipeline.js): reine Diagnose, greift nicht ins Bild ein.
    // Sie steht in der Vorschau über jeder Kachel und im Nachtlauf-Log — damit VOR dem
    // Gravieren sichtbar ist, welcher Platz wahrscheinlich Ärger macht.
    if (_lpInfo?.verloren) {
      _letzteDiagnose = _lpInfo.verloren;
      if (_lpInfo.verloren.vonDetail >= _VERLOREN_GRENZE)
        console.warn('Verlorene Zeichnung ' + Math.round(_lpInfo.verloren.vonDetail * 100)
          + ' % — Platz prüfen (Grenze ' + Math.round(_VERLOREN_GRENZE * 100) + ' %)');
    } else {
      _letzteDiagnose = null;
    }
    // Hat die Dichte-Regelung ihr Ziel überhaupt erreicht? Sie läuft sonst still an ihren
    // Anschlag (s. laser-pipeline.js) — die Belegungsliste soll es melden.
    _letzteDichte = _lpInfo?.dichte || null;
    if (_letzteDichte?.verfehlt)
      console.warn('Dichte-Regelung verfehlt: Ziel ' + Math.round(_letzteDichte.ziel * 100)
        + ' %, erreicht ' + (_letzteDichte.ist * 100).toFixed(1) + ' %');
    ctx.putImageData(imageData, 0, 0);
    imageData = null; // ~4 Byte/Pixel sofort freigeben (Auto-Export ist OOM-empfindlich)

    // Alles AUSSERHALB der belegten Bildfelder auf Weiß = wird nicht graviert. Ohne das wäre bei
    // invertierter Ausgabe (Schwarz) der ganze Blechgrund schwarz und die Maschine über jeden freien
    // Platz gefahren. Läuft VOR dem Text, damit Gravurtext außerhalb der Bildfelder erhalten bleibt.
    // Bei nicht-invertierter Ausgabe ist der Grund ohnehin weiß — dann ändert es nichts.
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.beginPath();
    ctx.rect(0, 0, c.width, c.height);
    for (const r of rects) ctx.rect(r.x, r.y, r.w, r.h);
    ctx.fillStyle = '#ffffff';
    ctx.fill('evenodd'); // äußeres Rechteck minus die Bildfelder
    ctx.restore();
  }

  return { c, bb, dpi, rects };
}

// Grenze für die Warnung „verlorene Zeichnung": an 17 Urteilen am Werkstück bestimmt
// (13 gute Feuerzeuge bis 33,7 %, 4 schlechte ab 29,7 %). Bei 31 % liegen 15 von 17
// richtig. Die Zahl ist eine WARNUNG, kein Eingriff — s. laser-pipeline.js.
const _VERLOREN_GRENZE = 0.31;
// Ergebnis des letzten _buildLaserCanvas-Aufrufs. Kein Rückgabewert, weil die Kette
// darüber (_bmpVorlageDateien → Vorschau) sonst an vier Stellen erweitert werden müsste.
let _letzteDiagnose = null;
let _letzteDichte = null;   // { ziel, ist, verfehlt } des letzten Rendergangs
let _letzteRegion = null;   // { vorher, nachher, uebernommen } — nur wenn der Bereichsausgleich geprüft hat
let _letzteGrafik = false;  // letzter Rendergang lief als Grafik (Schwelle)
let _letzteLogo = false;    // letzter Rendergang lief als buntes Logo
let _letzteWeich = false;   // letzter Rendergang lief als Grafik mit Verläufen
let _letzteGesichter = null; // Gesichts-Automatik: [{ vorher, nachher, … }], [] = keins gefunden, null = aus

// Belegte Bildfelder der aktuellen Seite, stabil sortiert (oben-links zuerst) — die
// Auswahl, durch die Detail-/Vergleichs-Ansicht und Testgitter blättern.
function _laserSlots() {
  return fields
    .filter(f => f.type === 'image' && (f._img || f._imgSrc))
    .sort(_nachPosition);
}

// (Der DPI-Deckel _capLaserDpi steht in public/laser-pipeline.js — er entscheidet mit,
//  wie fein gerastert wird.)

// Datei-DPI (13.10.2026): Rendern z. B. mit 250 DPI, die Datei aber mit 500 DPI schreiben — jeder Punkt sitzt
// auf jedem zweiten Pixel. EzCad bleibt auf „Fixed DPI 500“, Größe und Lage stimmen; am Werkstück so geprüft
// (Bleche A–C, 13.10.). Nur bei ganzzahligem Vielfachen, sonst bleibt alles wie gerechnet.
function _dateiDpi(s, renderDpi) {
  const z = Number(s && s.dateiDpi) || 0;
  return z > renderDpi && z % renderDpi === 0 ? z : renderDpi;
}
function _laserDateiCanvas(r, s) {
  const ziel = _dateiDpi(s, r.dpi);
  if (ziel === r.dpi) return { c: r.c, dpi: r.dpi };
  const f = ziel / r.dpi;
  const W = Math.max(1, Math.floor(r.bb.w * ziel / 25.4 + 1e-6)), H = Math.max(1, Math.floor(r.bb.h * ziel / 25.4 + 1e-6));
  const src = r.c.getContext('2d').getImageData(0, 0, r.c.width, r.c.height).data;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'), bild = x.createImageData(W, H), d = bild.data;
  d.fill(255);                                  // weiß = nicht lasern
  for (let y = 0; y < r.c.height; y++) for (let xx = 0; xx < r.c.width; xx++) {
    const i = (y * r.c.width + xx) * 4;
    if (src[i] >= 128) continue;                // nur gelaserte Punkte übertragen
    const X = xx * f, Y = y * f;
    if (X >= W || Y >= H) continue;
    const o = (Y * W + X) * 4; d[o] = d[o + 1] = d[o + 2] = 0;
  }
  x.putImageData(bild, 0, 0);
  return { c, dpi: ziel };
}
// Die DPI MUSS an imgTo1BitBMP durchgereicht werden, sonst behauptet der Header 300 DPI und
// Ezcad2 importiert in der falschen physischen Größe.
const _bmpBlob = (c, dpi) => new Blob([imgTo1BitBMP(c, dpi)], { type: 'image/bmp' });
// Ein _buildLaserCanvas-Ergebnis als BMP-Datei, in Datei-DPI (s. _dateiDpi)
const _laserBmp = (r, s) => { const fd = _laserDateiCanvas(r, s); return _bmpBlob(fd.c, fd.dpi); };

// 1-bit-BMP der Bildfelder der AKTUELLEN Seite — gemeinsam für exportBMP und den Auto-Export.
async function _buildBmpBlob(ditherOpts) {
  const r = await _buildLaserCanvas(ditherOpts);
  return r ? _laserBmp(r, _laserSettings(ditherOpts)) : null;
}

// Ein BMP JE Bildfeld statt eines über das ganze Blech (Layout: bmpModus 'platz').
// Zwei Gründe: in Ezcad ist jedes Foto ein eigenes, einzeln anwählbares Objekt — und die
// leeren Plätze bleiben draußen (bei invertierter Ausgabe ist der Grund schwarz, ein blechgroßes
// BMP hätte die freien Flächen mitgraviert).
// Die Platznummer zählt über ALLE Bildfelder der Seite, nicht nur die belegten —
// sonst wandert die Nummer, sobald ein Platz leer bleibt.
async function _buildBmpBlobsProSlot(ditherOpts) {
  const sortiert = _bildPlaetze(fields);
  const out = [];
  for (let i = 0; i < sortiert.length; i++) {
    const f = sortiert[i];
    if (!(f._img || f._imgSrc)) continue;
    const r = await _buildLaserCanvas(ditherOpts, { only: f });
    if (!r) continue;
    out.push({ platz: i + 1, bb: r.bb, dpi: r.dpi, blob: _laserBmp(r, _laserSettings(ditherOpts)) });
  }
  return out;
}

// Foto als Vektor-Halbton: je Bildzeile eine Wellenlinie, deren Ausschlag mit der
// Dunkelheit wächst; unter der Schwelle entsteht keine Linie. Damit steckt das Foto in
// DERSELBEN DXF wie die Textgravur — eine Datei, jedes Foto ein eigener Layer, und die
// Maschine fährt ausschließlich echte Linien statt eine Bitmap-Fläche abzutasten.
// Preis: Linienoptik statt Punktraster, und die Datei wird deutlich größer.
async function _fotoHalbton(f, s, opt = {}) {
  const zeile = opt.pitch || 0.35;   // mm Zeilenabstand
  const schritt = opt.step || 0.18;   // mm Abtastschritt entlang der Zeile
  const lambda = opt.lambda || 0.9;    // mm Wellenlänge
  const min = opt.min || 0.10;   // darunter: keine Linie
  const px = 10;                        // Abtastauflösung px/mm
  const c = document.createElement('canvas');
  c.width = Math.max(1, Math.round(f.w * px));
  c.height = Math.max(1, Math.round(f.h * px));
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, c.width, c.height);
  ctx.translate(-f.x * px, -f.y * px);
  await renderFieldToCtx(ctx, f, px, { useOriginal: true, invert: !!(s && s.invert) });
  const dat = ctx.getImageData(0, 0, c.width, c.height).data;
  const dunkel = (mx, my) => {
    const ix = Math.min(c.width - 1, Math.max(0, Math.round((mx - f.x) * px)));
    const iy = Math.min(c.height - 1, Math.max(0, Math.round((my - f.y) * px)));
    const o = (iy * c.width + ix) * 4;
    const l = (0.299 * dat[o] + 0.587 * dat[o + 1] + 0.114 * dat[o + 2]) / 255;
    return s && s.invert ? l : 1 - l; // auf Schwarz wird das Negativ graviert
  };
  const linien = [];
  for (let y = f.y + zeile / 2; y < f.y + f.h; y += zeile) {
    let akt = null;
    for (let x = f.x; x <= f.x + f.w; x += schritt) {
      const dk = dunkel(x, y);
      if (dk < min) { if (akt && akt.length > 1) linien.push(akt); akt = null; continue; }
      if (!akt) akt = [];
      const a = (zeile / 2) * Math.min(1, dk);
      akt.push({ x, y: y + a * Math.sin(2 * Math.PI * (x - f.x) / lambda) });
    }
    if (akt && akt.length > 1) linien.push(akt);
  }
  return linien;
}

// Vorlagen-Modus: JEDER Platz bekommt eine Datei mit FESTEM Namen (platz1.bmp …), auch
// der leere — ein leerer Platz bekommt ein weißes Blatt. Das ist der entscheidende Punkt:
// die Ezcad-Vorlage liest über „Dynamic file" jeden Tag dieselben Dateinamen neu ein;
// fehlte die Datei für einen heute leeren Platz, würde Ezcad das Foto von gestern
// markieren. Weiß = nichts gravieren.
async function _bmpVorlageDateien(ditherOpts) {
  const s = _laserSettings(ditherOpts);
  const sortiert = _bildPlaetze(fields);
  const out = [];
  for (let i = 0; i < sortiert.length; i++) {
    const f = sortiert[i];
    // dpi auch in der Ausgabe: die Belegungsliste nennt den Ezcad-Wert „Fixed DPI“ (seit 13.10.2026 nicht
    // mehr überall 500), und das Blindblatt bekommt dieselbe DPI wie die Fotos.
    const bb = _imageFieldsBBox([f], getPg()), dpi = _dateiDpi(s, _capLaserDpi(s.dpi, bb));
    let blob, belegt = !!(f._img || f._imgSrc), diagnose = null, dichte = null, region = null, logo = false, weich = false, grafik = false, gesichter = null;
    if (belegt) {
      const r = await _buildLaserCanvas(ditherOpts, { only: f });
      if (r) {
        blob = _laserBmp(r, s);
        diagnose = _letzteDiagnose; dichte = _letzteDichte; region = _letzteRegion; logo = _letzteLogo;
        weich = _letzteWeich; grafik = _letzteGrafik; gesichter = _letzteGesichter;
      }
      else belegt = false;
    }
    if (!blob) {
      // Leerer Platz bekommt ein WINZIGES weißes Blindblatt (8x8 px), nicht eines in Feldgröße:
      //  - Die Datei MUSS da sein, sonst fällt Ezcads „Dynamic File“ auf die in der .ezd eingebettete Kopie
      //    zurück — das Bild vom Vortag, auf einem fremden Feuerzeug.
      //  - Ein volles weißes Blatt wird nicht graviert, der Kopf fährt die Fläche aber ab.
      // Voraussetzung in Ezcad: „Fixed position“ = MITTE und „Fixed Size X/Y“ AUS — dann schrumpft das
      // Blindblatt um den Mittelpunkt des Platzes, und ein späteres Foto sitzt exakt wie vorher.
      const c = document.createElement('canvas');
      c.width = 8; c.height = 8;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, c.width, c.height);
      blob = _bmpBlob(c, dpi);
    }
    out.push({ platz: i + 1, belegt, blob, diagnose, dichte, region, logo, weich, grafik, gesichter, bb, dpi });
  }
  return out;
}

// Die Deckel-Textfelder der aktuellen Seite in Platz-Reihenfolge (oben-links zuerst) — für
// gravurN.dxf. Bis 06.10.2026 gab es dazu gravurN.bmp (_bmpVorlageTexte); die entstand nie,
// weil kein Vorlagen-Layout Text auf der Fotoseite hat, und wurde entfernt.
function _deckelTextFelder() {
  return fields.filter(f => (f.type === 'text' || f.type === 'number' || f.type === 'static') && !f.arrayOf)
    .sort(_nachPosition);
}

// Deckeltexte auf die zwölf Plätze verteilen — DIE eine Quelle für gravurN.dxf UND für die Vorschau
// (beide MÜSSEN dieselbe Nummer meinen).
//
// ── WARUM NICHT ÜBER DIE FELDPOSITION ────────────────────────────────────────
// Ein Abgleich über x/y verschob die Namen am Werkstück um EINEN Platz: die Live-Felder nach dem
// Füllen stimmen in den Koordinaten nicht sicher mit dem gespeicherten Layout überein. Deshalb die
// gefüllten Felder der Reihe nach (oben-links zuerst) auf die Plätze 1…n, der Rest bleibt leer.
// Voraussetzung: der Export füllt die Plätze VON VORNE, ohne Lücke, und die Fotoseite zählt genauso
// (_bmpVorlageDateien) — Platz N meint beim Foto und beim Deckel dasselbe Feuerzeug. Fotolose
// Bestellungen hält der Auto-Export aus dem Text-Layout heraus (_istTextPartner/_nurMitFoto).
function _deckelProPlatz(layoutFelder, vorlageSeiten, satz = 0) {
  const gefuellt = (vorlageSeiten.get(satz + '|0') || []).slice()
    .sort(_nachPosition);
  const alle = (layoutFelder || []).slice()
    .sort(_nachPosition);
  return alle.map((f, i) => gefuellt[i] || { ...f, _text: '', orderId: null });
}

// Deckeltext EINES Platzes als eigene DXF (gravurN.dxf). Nullpunkt = Feldmitte, der Text liegt mittig
// darauf: alle zwölf Dateien sind gleich aufgebaut und werden in Ezcad wie die Fotos gesetzt.
// OHNE Rahmen — die Umrisskiste ändert sich mit jedem Text; in Ezcad muss beim Objekt deshalb
// „Fixed position“ auf MITTE stehen. Leerer Platz = DXF ohne Geometrie (ob Ezcad dann die
// gespeicherte Kopie graviert, ist ungeprüft).
async function _gravurSlotDxf(f, layout) {
  const p = getPg();
  const text = { ...f, x: p.w / 2 - f.w / 2, y: p.h / 2 - f.h / 2 };
  const o = _dxfOpts(layout);
  const felder = _hasVecText(text) ? [text] : [];
  return new Blob([await buildDXFContent(felder, o.isFilled, o.isVector, false, o.asBlock, true, true, o.zusammen)],
    { type: 'application/dxf' });
}

// Belegungsliste zur Vorlage: welcher Platz trägt heute welche Bestellung, dazu die Ezcad-Position JE
// PLATZ (zum Bauen der .ezd und als Kontrolle). Die Zahlen sind stabil: jeder platzN.bmp hat immer
// dieselbe Größe und Lage, auch wenn der Platz leer ist (s. _bmpVorlageDateien).
function _bmpBelegungsListe(teile, layoutName, bestellungenProPlatz) {
  const p = getPg();
  const z = [`Belegung ${layoutName} — ${new Date().toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}`,
  `Blatt ${p.w} x ${p.h} mm, Nullpunkt = Blattmitte (Ezcad)`,
  `Ezcad-Vorlage je Bitmap: "Dynamic File" AN, "Fixed DPI" ${(teile.find(t => t && t.dpi) || {}).dpi || 500}, "Fixed Size X/Y" AUS,`,
    `"Fixed position" auf MITTE (sonst sitzt das Bild oben rechts daneben).`,
    `Position X/Y aus dieser Liste. Die Werte ändern sich nur, wenn das Layout`,
    `selbst verschoben wird. Array rechnet mit der LÜCKE, nicht mit dem Mittenabstand.`, ''];
  z.push('Platz  Datei          X (mm)     Y (mm)   Breite   Hoehe  Flaeche  Zeichng  Bestellung');
  const warnliste = [];
  for (const t of teile) {
    const [mx, my] = _ezcadMitte(t.bb, p);
    const wer = t.belegt ? (bestellungenProPlatz[t.platz] || 'belegt')
      : '— leer (weiß, wird nicht graviert)';
    // Spalte „Zeichng" = Anteil verlorener Zeichnung (s. laser-pipeline.js). Nur eine
    // Meldung; an der Gravurdatei ändert sie nichts.
    let dg = '     —';
    if (t.diagnose) {
      const q = Math.round(t.diagnose.vonDetail * 100);
      const warn = t.diagnose.vonDetail >= _VERLOREN_GRENZE;
      dg = (warn ? '!' : ' ') + String(q).padStart(4) + '%';
      if (warn) warnliste.push({ platz: t.platz, q, wer });
    }
    // Spalte „Flaeche" = wie viel Prozent des Feldes der Laser abfährt. Über 30 % wurde
    // es am Werkstück bisher als flau beurteilt — mit der Motiv-Automatik kommen solche
    // Werte vor, und dann soll man sie vor dem Brennen sehen.
    const fl = t.dichte ? (t.dichte.ist * 100).toFixed(1).padStart(6) + '%' : '      —';
    z.push(`${String(t.platz).padStart(4)}   ${('platz' + t.platz + '.bmp').padEnd(13)}`
      + `${mx.toFixed(2).padStart(8)}  ${my.toFixed(2).padStart(9)}`
      + `${t.bb.w.toFixed(1).padStart(8)}  ${t.bb.h.toFixed(1).padStart(6)}  ${fl}  ${dg}  ${wer}`);
  }
  // Abschnitte unter der Tabelle: Überschrift, je Platz eine Zeile, danach die Erklärung.
  const abschnitt = (liste, titel, zeile, ...erklaerung) => {
    if (!liste.length) return;
    z.push('', titel, '');
    for (const t of liste) z.push(zeile(t));
    if (erklaerung.length) z.push('', ...erklaerung);
  };
  const platz = t => `   Platz ${String(t.platz).padStart(2)}`, best = t => bestellungenProPlatz[t.platz] || '';
  // Plätze, an denen die Dichte-Regelung ihr Ziel nicht erreichen konnte. Das ist kein
  // Geschmacksurteil wie die Zeichnungs-Warnung, sondern eine harte Tatsache: das Bild
  // gibt die geforderte Fläche nicht her, die Regelung stand am Anschlag.
  abschnitt(teile.filter(t => t.dichte?.verfehlt), 'DICHTE-REGELUNG HAT IHR ZIEL NICHT ERREICHT:',
    t => `${platz(t)}: Ziel ${Math.round(t.dichte.ziel * 100)} %, erreicht ${(t.dichte.ist * 100).toFixed(1)} %   ${best(t)}`,
    'Das Bild gibt die geforderte Gravurflaeche nicht her — die Regelung stand',
    'am Anschlag. Typisch bei Logos und bei sehr dunklen oder sehr hellen Vorlagen.',
    'Die Datei ist brauchbar, sie sieht nur anders aus als die uebrigen Plaetze.');
  abschnitt(teile.filter(t => t.belegt && t.gesichter), 'GESICHTS-AUTOMATIK (Gravur im Gesichtskern vorher -> nachher):',
    t => `${platz(t)}: ` + (t.gesichter.length
      ? t.gesichter.map(g => `${Math.round(g.vorher * 100)} -> ${Math.round((g.nachher ?? g.vorher) * 100)} %`).join(', ')
      : 'kein Gesicht gefunden') + `   ${best(t)}`);
  abschnitt(teile.filter(t => t.region?.uebernommen), 'BEREICHE EINZELN BELICHTET (Himmel, helle Flaechen, Schatten):',
    t => `${platz(t)}: Zeichnung verloren ${Math.round(t.region.vorher * 100)} % -> ${Math.round(t.region.nachher * 100)} %   ${best(t)}`,
    'Ohne den Ausgleich haette eine grosse helle Flaeche die Gravur weggenommen.',
    'Jeder Bereich hat seine eigene Helligkeit bekommen, die Zeichnung darin bleibt.',
    'Seit 25.09.2026, am Werkstueck noch nicht beurteilt — bitte ansehen.');
  // Grafik (Schwelle) — vorerst nur in der Reklamation: dort liest die Foto-Karte daraus, wie erkannt
  // wurde (s. _rfArtLesen). Im Tageslauf bleibt die Liste, wie sie war.
  abschnitt(_reklaOrderId ? teile.filter(t => t.grafik) : [], 'ALS GRAFIK GRAVIERT (Schrift, Zeichnung, zweifarbig):',
    t => `${platz(t)}   ${best(t)}`,
    'Schwellenwert statt Raster, ohne Fotoaufbereitung. Ist es doch ein Foto:',
    'in der Reklamation „Als Foto rechnen".');
  abschnitt(teile.filter(t => t.logo), 'ALS LOGO GRAVIERT (bunt, dunkler Grund):',
    t => `${platz(t)}   ${best(t)}`,
    'Atkinson-Raster, Tonwerte der Vorlage, ohne Kantenverstaerkung — Schrift bleibt',
    'satt, der schwarze Grund sauber. Seit 25.09.2026, am Werkstueck noch nicht beurteilt.');
  abschnitt(teile.filter(t => t.weich), 'ALS GRAFIK GRAVIERT (Verlaeufe, Rauch, weiche Schrift):',
    t => `${platz(t)}   ${best(t)}`,
    'Tonwerte der Vorlage mit Konturen, ohne Dichte-Regelung und Ausgleich — Rauch bleibt',
    'dunkler als das Motiv, Schrift klarer. Erkannt an viel reinem Schwarz, glatten Flaechen',
    'und Farbe. Seit 28.09.2026. Ist es doch ein Foto: im Blech (Maschinen) ansehen und per',
    'Reklamation mit ausgeschaltetem Schalter „Grafiken mit Verlaeufen" neu erzeugen.');
  abschnitt(warnliste, 'ACHTUNG — diese Plaetze vor dem Gravieren ansehen:',
    w => `${platz(w)}: ${w.q} % der Zeichnung geht verloren   ${w.wer}`,
    'Die Spalte "Zeichng" sagt, wie viel Bildbereiche mit Detail in der Gravur flach',
    'werden — tot oder zugelaufen. Ueber ' + Math.round(_VERLOREN_GRENZE * 100) + ' % wurde es am Werkstueck',
    'meist als zu dunkel beurteilt (an 17 Feuerzeugen bestimmt: 13 gute bis 34 %,',
    '4 schlechte ab 30 %). Es ist eine WARNUNG, keine Aussage - ein gutes Bild kann',
    'auch darueber liegen. Die Gravurdatei ist davon unberuehrt.',
    'Hilft bei solchen Plaetzen: Lichter auf 45 % deckeln und Dichte auf 26 % heben',
    '(am 21.09.2026 an zwei Feuerzeugen bestaetigt).');
  return new Blob([z.join('\n') + '\n'], { type: 'text/plain' });
}

// Kleines Windows-Skript, das im Tages-Archiv neben den Bildern liegt. Es kopiert den
// Satz aus SEINEM eigenen Ordner (%~dp0) in den festen Arbeitsordner der Ezcad-Vorlage.
// Bewusst ohne Datum im Skript: es weiß immer, wo es selbst liegt, und funktioniert
// deshalb in jedem Tagesordner unverändert. Reines ASCII — cmd.exe liegt bei Umlauten
// je nach Codepage quer.
function _ladeTagBat(layoutName) {
  const z = [
    '@echo off',
    'REM Laedt die Bilder DIESES Tages in den Arbeitsordner der Ezcad-Vorlage.',
    'REM Danach in Ezcad nur noch ' + layoutName + '.ezd oeffnen und markieren.',
    'REM Zeigt die Vorlage auf ein anderes Laufwerk, hier LAUFWERK anpassen.',
    'set LAUFWERK=Z:',
    'set ZIEL=%LAUFWERK%\\exports\\_Vorlage\\' + layoutName,
    'echo.',
    'echo Quelle: %~dp0',
    'echo Ziel  : %ZIEL%',
    'echo.',
    'if not exist "%ZIEL%\\" (',
    '  echo FEHLER: Zielordner nicht gefunden.',
    '  echo Pruefe, ob das Laufwerk verbunden ist.',
    '  if "%~1"=="" pause',
    '  exit /b 1',
    ')',
    'copy /Y "%~dp0platz*.bmp" "%ZIEL%\\" >nul',
    'if errorlevel 1 (',
    '  echo FEHLER beim Kopieren.',
    '  if "%~1"=="" pause',
    '  exit /b 1',
    ')',
    // gravur*.dxf erfasst gravur.dxf UND gravur1…12.dxf (gravurN.bmp gibt es seit 06.10.2026 nicht mehr)
    'copy /Y "%~dp0gravur*.dxf" "%ZIEL%\\" >nul 2>&1',
    // Ansicht = PNG-Layout F02_*_PNG mit „Speichern in: Ezcad-Vorlage" (seit 13.10.2026): erst jede PNG im
    // Arbeitsordner weg (auch eine alte vorschau.png), dann die dieses Tages — hat der Tag keine, stünde
    // sonst die Ansicht eines anderen Tages neben diesen Gravurdateien.
    'del /Q "%ZIEL%\\*.png" >nul 2>&1',
    'copy /Y "%~dp0*.png" "%ZIEL%\\" >nul 2>&1',
    'copy /Y "%~dp0rueckseite.dxf" "%ZIEL%\\" >nul 2>&1',
    'echo Fertig. Jetzt ' + layoutName + '.ezd oeffnen und markieren.',
    'echo.',
    // Mit Argument (Aufruf aus "Tag laden.bat") nicht anhalten, sonst muss man bei
    // sechs Layouts sechsmal Enter drücken.
    'if "%~1"=="" pause',
    // Muss sein: die optionalen copy oben setzen errorlevel 1, wenn es die Datei an
    // dem Tag nicht gab. Ohne exit /b 0 zählt "Tag laden.bat" das als Fehler.
    'exit /b 0',
  ];
  return new Blob([z.join('\r\n') + '\r\n'], { type: 'text/plain' });
}

// Ordnername der Vorlage: was in den Layout-Einstellungen steht, sonst der Layoutname.
// EINE Ableitungsstelle — der Name taucht an drei Stellen auf (platzN.bmp, belegung.txt,
// gravur.dxf) und im Tagesarchiv nochmal; liefen die auseinander, zeigte die
// .ezd ins Leere. Der Pfad steckt fest in der .ezd und lässt sich dort nur mühsam
// ändern, deshalb muss er hier einstellbar sein.
function _vorlageName(layout) {
  return (layout && layout.vorlageOrdner ? layout.vorlageOrdner : (layout && layout.name)) || '';
}
// Feste DXF-Namen im Vorlagen-Ordner: Seite 1 = gravur.dxf, Seite 2 = rueckseite.dxf.
function _vorlageDxfName(role) {
  return role === 0 ? 'gravur.dxf' : role === 1 ? 'rueckseite.dxf' : `seite${role + 1}.dxf`;
}
// Trägt Layout-Seite `role` Gravur (Text/Motiv)? Nach LAYOUT, nicht nach Tagesinhalt —
// sonst bliebe an einem Tag ohne Text die Datei von gestern stehen.
function _seiteHatGravur(layout, role) {
  return (layout?.pages?.[role] || []).some(f => f.type !== 'image');
}

// Vorlagen-Layout OHNE Bestellung beim ERSTEN Lauf des Tages: Arbeitsordner auf „leer“ setzen
// (Blindblätter, leere DXF) — sonst bliebe dort der Vortag stehen. Nur Lauf 1:
// ein späterer Nachzügler-Lauf ohne Bestellungen wischte sonst die noch nicht gravierten Dateien weg.
async function _vorlageLeerSchreiben(layout, formats, today, mode) {
  const vorher = fields;
  const ordner = _vorlageName(layout);
  const leereSeite1 = () => (layout.pages?.[0] || []).map(f => ({ ...f, _img: null, _imgSrc: null, _text: null, orderId: null }));
  // Ansicht (PNG-Layout, s. _exportFilledPages): leeres Blatt unter ihrem festen Namen, sonst stünde an
  // einem Tag ohne Bestellung die Ansicht von gestern neben leeren platzN.bmp. Der Name gehört nur diesem
  // Layout und kollidiert mit keinem Gravur-Layout im selben Ordner — deshalb vor der Sperre unten, und
  // ein reines PNG-Layout belegt den Ordner nicht (sonst bliebe das Gravur-Layout danach ungeleert).
  if (formats.includes('png')) {
    try {
      fields = leereSeite1();
      const blob = await generateExportBlob('png', _dxfOpts(layout), layout.ditherSettings);
      if (blob) await uploadExportToServer(blob, `${layout.name}.png`, today, layout.group, ordner);
    } finally {
      fields = vorher;
    }
    if (formats.every(f => f === 'png')) {
      console.log('Auto-Export:', layout.name, '— keine Bestellungen, Ansicht in', ordner, 'auf leer gesetzt');
      return;
    }
  }
  // Hat ein anderes Layout den Ordner in DIESEM Lauf schon beschrieben, nicht leeren.
  // (Eintrag ist { name, formate } — s. die Vorlagen-Sperre im Export.)
  const belegt = _laufNamen.vorlagen[ordner];
  if (belegt && belegt.name !== layout.name) {
    console.warn('Auto-Export:', layout.name, '— Vorlagen-Ordner', ordner, 'gehört in diesem Lauf', belegt.name, '— nicht geleert');
    return;
  }
  if (!belegt) _laufNamen.vorlagen[ordner] = { name: layout.name, formate: formats.slice() };
  try {
    if (formats.includes('bmp')) {
      fields = leereSeite1();
      const slots = await _bmpVorlageDateien(layout.ditherSettings);
      for (const t of slots) await uploadExportToServer(t.blob, `platz${t.platz}.bmp`, today, layout.group, ordner);
      // Deckeltexte ebenfalls leeren — sonst gravierte Ezcad die Namen vom Vortag. Ein leerer
      // Platz ist eine DXF ohne Geometrie (s. _gravurSlotDxf, seit 15.09. ohne Rahmen).
      if (slots.length) {
        let n = 0;
        for (const f of _deckelTextFelder())
          await uploadExportToServer(await _gravurSlotDxf(f, layout), `gravur${++n}.dxf`, today, layout.group, ordner);
      }
    }
    if (formats.includes('dxf')) {
      const o = _dxfOpts(layout);
      const leer = new Blob([await buildDXFContent([], o.isFilled, o.isVector, o.frame, o.asBlock, o.centerOrigin, o.bildRahmen, o.zusammen)],
        { type: 'application/dxf' });
      const seiten = mode === 'synchron' ? (layout.pages?.length || 1) : 1;   // wie basePages im Export
      for (let r = 0; r < seiten; r++) {
        if (_seiteHatGravur(layout, r)) await uploadExportToServer(leer, _vorlageDxfName(r), today, layout.group, ordner);
      }
    }
    console.log('Auto-Export:', layout.name, '— keine Bestellungen, Vorlagen-Ordner', ordner, 'auf leer gesetzt');
  } finally {
    fields = vorher;
  }
}

// ── Reiter „ASIN" (ASIN-Check) ───────────────────────────────────────────────
// Zeigt, welche Personalisierung ein Produkt bei Amazon hat: Produktseiten mit Amazons
// Produktbild und den Feldern darauf, Gravurzeilen mit ihrer Gravur-Nummer, Bildflächen,
// Auswahlfelder, Schriften — und prüft das gegen die Layouts, die die ASIN füllen. Die
// Profile lernt der Server aus echten Bestellungen (asin-check.controller.js), weil Amazon
// die Vorlage eines Listings über die SP-API nicht herausgibt.
// Die Gravur-Nummern kommen aus DENSELBEN Funktionen wie beim Füllen (_textGruppen,
// _slotTabellenBauen): jeder Textknoten bekommt seinen Schlüssel als Text untergeschoben,
// danach steht fest, welcher Knoten welche Nummer trägt. Eine zweite Zählung gibt es hier
// bewusst nicht — zeigt der Check etwas anderes, als gefüllt wird, liegt der Fehler dort.
let _asinAktuell = null;     // { asin, profil, analyse } des offenen Dialogs
let _asinPollTimer = null;
const _ASIN_RE = /^[A-Z0-9]{10}$/;

const _asinDatum = (iso) => iso
  ? new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', timeZone: 'Europe/Berlin' }) : '—';

async function _asinProfil(asin) {
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const r = await fetch(`${BASE_URL}/v2/asin-check/${encodeURIComponent(asin)}`, { headers, credentials: 'include' });
    return r.ok ? await r.json() : null;
  } catch (_) { return null; }
}

// Layouts, die diese ASIN füllen — dieselbe Regel wie das Füllen: im Einzel-ASIN-Modus zählt die
// Layout-ASIN, sonst die ASIN je Feld. LEER heißt dort „alle ASINs“ — ein solches Layout füllt also
// auch dieses Produkt.
const _asinNorm = v => String(v || '').trim().toUpperCase();
function _asinFeldPasst(asin, f) {
  return f && (f.type === 'text' || f.type === 'image') && !f.arrayOf
    && (!_asinNorm(f.filterAsin) || _asinNorm(f.filterAsin) === asin);
}
function _asinLayouts(asin, layouts) {
  return (layouts || []).filter(l => {
    if (!l) return false;
    if (l.singleAsinMode ?? true) { const g = _asinNorm(l.globalAsin); return !g || g === asin; }
    return _layoutHat(l, f => _asinFeldPasst(asin, f));
  });
}
// Felder eines Layouts, die eine Bestellung dieser ASIN füllt (Array-Kopien nie): im Einzel-ASIN-Modus
// alle, sonst die Text- und Bildfelder mit dieser oder keiner Feld-ASIN, dazu alles ohne Feld-ASIN
// (Motive, Nummern). ASIN-Check (_asinBelegung) und Reklamation ohne Bestellung (_rmFelder).
function _asinFelder(asin, layout) {
  const alle = (layout.pages || []).flat().filter(f => f && !f.arrayOf);
  return (layout.singleAsinMode ?? true) ? alle
    : alle.filter(f => !(f.type === 'text' || f.type === 'image') || _asinFeldPasst(asin, f));
}
// Gravur-Nummern eines Textfelds: die Zeilen eines Kombi-Felds, sonst seine eigene.
function _feldGravuren(f) { return _isCombo(f) ? f.comboPals : [f.palNum || 1]; }

// Liste und Filter: Daten einmal holen, Zeichnen bei jedem Filter-/Suchwechsel ohne Server.
let _asinDaten = { liste: [], layouts: [], layoutsOk: false };
let _asinFilter = (() => { try { return localStorage.getItem('asinFilter') || 'alle'; } catch (_) { return 'alle'; } })();

async function asinZeigen() {
  await _asinListe();
  _asinEingabeGeaendert();
  // Läuft noch ein Nachladen (Reiter gewechselt, Seite neu geladen)? Fortschritt weiter zeigen.
  try {
    const s = await _apiJson('/v2/asin-check/scan');
    if (s && s.running) _asinPoll(s.asin, false); else _asinStatus(null);
  } catch (_) { }
}

// Prüfen erst mit vollständiger ASIN — ein leeres oder halbes Feld kann nichts auslösen.
function _asinEingabeGeaendert() {
  const inp = document.getElementById('asin-eingabe');
  const btn = document.getElementById('asin-pruef-btn');
  if (!inp || !btn) return;
  const v = String(inp.value || '').trim().toUpperCase();
  btn.disabled = !_ASIN_RE.test(v) || btn.dataset.scan === '1';
}

async function _asinListe() {
  const box = document.getElementById('asin-liste');
  if (!box) return;
  let liste;
  try { liste = await _apiJson('/v2/asin-check'); }
  catch (_) { box.innerHTML = '<div class="umut10">Server nicht erreichbar.</div>'; return; }
  let layouts = [], layoutsOk = true;
  try { layouts = await getServerLayouts(); } catch (_) { layoutsOk = false; }
  _asinDaten = { liste: Array.isArray(liste) ? liste : [], layouts: layouts || [], layoutsOk };
  _asinListeZeichnen();
}

function asinFilterSetzen(f) {
  _asinFilter = f;
  try { localStorage.setItem('asinFilter', f); } catch (_) { }
  _asinListeZeichnen();
}

function _asinListeZeichnen() {
  const box = document.getElementById('asin-liste');
  const fbox = document.getElementById('asin-filter');
  if (!box) return;
  const { liste, layouts, layoutsOk } = _asinDaten;
  const mitLay = new Map(liste.map(e => [e.asin, _asinLayouts(e.asin, layouts)]));
  const n = { alle: liste.length, mit: 0, ohne: 0 };
  for (const e of liste) n[mitLay.get(e.asin).length ? 'mit' : 'ohne']++;
  if (fbox) {
    fbox.innerHTML = layoutsOk
      ? _segBtn(_asinFilter === 'alle', "asinFilterSetzen('alle')", `Alle (${n.alle})`, 'Alle bekannten Produkte')
      + _segBtn(_asinFilter === 'mit', "asinFilterSetzen('mit')", `Mit Layout (${n.mit})`, 'Produkte, die ein Layout füllt')
      + _segBtn(_asinFilter === 'ohne', "asinFilterSetzen('ohne')", `Ohne (${n.ohne})`, 'Produkte ohne Layout — ihre Bestellungen werden nicht exportiert')
      : '<div class="umut10">Layouts nicht lesbar — Filter aus.</div>';
  }
  if (!liste.length) {
    box.innerHTML = '<div class="umut10">Noch keine Profile — sie entstehen mit jedem Download.</div>';
    return;
  }
  const suche = String(document.getElementById('asin-suche')?.value || '').trim().toLowerCase();
  const sichtbar = liste.filter(e => {
    const hat = mitLay.get(e.asin).length > 0;
    if (layoutsOk && _asinFilter === 'mit' && !hat) return false;
    if (layoutsOk && _asinFilter === 'ohne' && hat) return false;
    return !suche || e.asin.toLowerCase().includes(suche) || String(e.titel || '').toLowerCase().includes(suche);
  });
  if (!sichtbar.length) { box.innerHTML = '<div class="umut10">Keine Treffer.</div>'; return; }
  box.innerHTML = sichtbar.map(e => {
    const lays = mitLay.get(e.asin);
    const lay = !layoutsOk ? ''
      : lays.length
        ? `<span class="marke" title="${_esc(lays.map(l => l.name).join(', '))}">${_esc(lays.length === 1 ? lays[0].name : lays.length + ' Layouts')}</span>`
        : '<span class="marke asin-warn" title="Kein Layout füllt diese ASIN — ihre Bestellungen werden nicht exportiert">kein Layout</span>';
    const teile = [`${e.bestellungen} Best.`, `${e.gravuren} Gravur${e.gravuren === 1 ? '' : 'en'}`];
    if (e.bilder) teile.push(e.bilder === 1 ? 'Bild' : e.bilder + ' Bilder');
    if (e.auswahl) teile.push(`${e.auswahl} Auswahl`);
    const umgebaut = e.fassungen > 1
      ? ' <span class="marke asin-warn" title="Das Listing wurde umgebaut — im Dialog stehen beide Fassungen">umgebaut</span>' : '';
    return `<div class="lay-karte asin-zeile" onclick="asinAusListe('${e.asin}')" title="${_esc(e.titel || '')}">
      <div style="min-width:0;flex:1;">
        <div class="hsb" style="gap:6px;"><b class="asin-code">${e.asin}</b><span>${lay}${umgebaut}</span></div>
        <div class="umut10 asin-titel">${_esc(e.titel || '—')}</div>
        <div class="umut10">${teile.join(' · ')} · zuletzt ${_asinDatum(e.letzte)}</div>
      </div>
    </div>`;
  }).join('');
}

// Klick in der Liste: nur die gespeicherte Auswertung öffnen — kein Aufruf bei Amazon.
function asinAusListe(asin) {
  const inp = document.getElementById('asin-eingabe');
  if (inp) { inp.value = asin; _asinEingabeGeaendert(); }
  asinOeffnen(asin);
}

function _asinStatus(s) {
  const laeuft = !!(s && s.running);
  const btn = document.getElementById('asin-pruef-btn');
  if (btn) btn.dataset.scan = laeuft ? '1' : '';
  _asinEingabeGeaendert();
  const nach = document.getElementById('asin-dlg-nachladen');
  if (nach) nach.disabled = laeuft;
  const html = !s ? '' : `<div class="hsb" style="gap:6px;"><b class="asin-code">${_esc(s.asin || '')}</b>`
    + (laeuft ? '<button class="btn btn-muted btn-xs" onclick="asinScanAbbrechen()">Abbrechen</button>' : '')
    + `</div><div class="umut10" style="margin:4px 0;">${_esc(s.meldung || '')}</div>`
    + (s.gesamt ? `<div class="asin-balken"><i style="width:${Math.round(100 * s.geprueft / s.gesamt)}%"></i></div>`
      + `<div class="umut10">${s.geprueft}/${s.gesamt} geprüft · ${s.treffer} mit dieser ASIN · ${s.neu} neu`
      + `${s.apiFehler ? ' · ' + s.apiFehler + ' API-Fehler' : ''}</div>` : '');
  // Dieselbe Anzeige im Reiter UND im offenen Dialog — wer „Bei Amazon nachladen" im Dialog
  // drückt, sieht den Reiter dahinter nicht.
  for (const id of ['asin-status', 'asin-dlg-status']) {
    const el = document.getElementById(id);
    if (!el) continue;
    const zeigen = !!s && (id === 'asin-status' || laeuft || (_asinAktuell && s.asin === _asinAktuell.asin && s.fertig && Date.now() - Date.parse(s.fertig) < 60000));
    el.hidden = !zeigen;
    if (zeigen) { el.innerHTML = html; el.classList.toggle('asin-status-fehler', !!s.fehler); }
  }
}

async function asinPruefen() {
  const inp = document.getElementById('asin-eingabe');
  const asin = String(inp.value || '').trim().toUpperCase();
  if (!_ASIN_RE.test(asin)) { showToast('❌ ASIN im Format B0XXXXXXXX eingeben', 3500); return; }
  inp.value = asin;
  // Vorhandenes Profil immer zuerst zeigen; Amazon nur auf ausdrücklichen Wunsch.
  const p = await _asinProfil(asin);
  if (p) { asinOeffnen(asin, p); return; }
  await asinNachladen(asin);
}

// Nachladen bei Amazon — immer mit Rückfrage und ehrlicher Dauer. Ein Klick darf nicht
// unbemerkt eine Dreiviertelstunde Amazon-Abfragen auslösen (24.09. im Test: 14 Tage =
// 1.343 Bestellungen, bis zu 54 Minuten).
async function asinNachladen(asin) {
  if (!asin) return;
  const tage = Number(document.getElementById('asin-tage')?.value) === 14 ? 14 : 7;
  let k;
  try {
    k = await _apiJson(`/v2/asin-check/scan/kandidaten?asin=${encodeURIComponent(asin)}&tage=${tage}`);
  } catch (e) { showToast('❌ ' + (e.message || 'Server nicht erreichbar'), 4000); return; }
  if (!k.gesamt) {
    showToast(`Alle Bestellungen der letzten ${tage} Tage sind schon ausgewertet — nichts nachzuladen.`, 5000);
    if (!(_asinAktuell && _asinAktuell.asin === asin)) {
      const p = await _asinProfil(asin);
      if (p) asinOeffnen(asin, p); else showToast(`Keine Bestellung mit ${asin} in den letzten ${tage} Tagen.`, 5000);
    }
    return;
  }
  const ok = await confirmModal(`${asin} bei Amazon nachladen?`,
    `Bis zu ${k.gesamt} Bestellungen der letzten ${tage} Tage werden einzeln abgefragt — höchstens `
    + `etwa ${k.minutenMax} Minuten, Schluss schon bei ${k.ziel} Treffern. Läuft im Hintergrund, `
    + 'jederzeit abbrechbar, und macht Platz, sobald ein Download beginnt.', 'Nachladen');
  if (!ok) return;
  try { await _apiJson('/v2/asin-check/scan', 'POST', { asin, tage }); }
  catch (e) { showToast('❌ ' + e.message, 5000); return; }
  _asinPoll(asin, true);
}

async function asinScanAbbrechen() {
  try { await _apiJson('/v2/asin-check/scan/abbrechen', 'POST'); } catch (_) { }
}

function _asinPoll(asin, oeffnen) {
  clearTimeout(_asinPollTimer);
  const tick = async () => {
    let s = null;
    try { s = await _apiJson('/v2/asin-check/scan'); } catch (_) { }
    _asinStatus(s);
    if (s && s.running) { _asinPollTimer = setTimeout(tick, 2000); return; }
    _asinListe();
    if (!oeffnen || !s || s.asin !== asin) return;
    const p = await _asinProfil(asin);
    if (p) asinOeffnen(asin, p);
    else showToast(s.fehler ? '❌ ' + s.fehler : 'Keine Bestellung mit dieser ASIN im Zeitraum gefunden.', 5000);
  };
  tick();
}

// Kopie einer Form, in der jeder Textknoten seinen Schlüssel als Text trägt (s. oben)
function _asinMitSchluesseln(baum) {
  const kopie = JSON.parse(JSON.stringify(baum));
  const setze = n => { if (n.type === 'TextCustomization') n.inputValue = n.k; (n.children || []).forEach(setze); };
  setze(kopie);
  return kopie;
}

// Formen EINER Fassung zu einem Baum vereinigen: Basis ist die vollständigste Form, was
// anderen Bestellungen zusätzlich hatten, hängt sich an seinen Elternknoten an.
function _asinVereinigen(formen) {
  const zahl = n => 1 + (n.children || []).reduce((s, c) => s + zahl(c), 0);
  const sortiert = [...formen].sort((a, b) => zahl(b.baum) - zahl(a.baum) || b.anzahl - a.anzahl);
  const basis = JSON.parse(JSON.stringify(sortiert[0].baum));
  const idx = new Map();
  const reg = n => { idx.set(n.k, n); (n.children || []).forEach(reg); };
  reg(basis);
  const add = (n, elternK) => {
    if (!idx.has(n.k)) {
      const e = idx.get(elternK);
      if (!e) return;
      const kopie = { ...n, children: [] };
      (e.children || (e.children = [])).push(kopie);
      idx.set(n.k, kopie);
    }
    for (const c of (n.children || [])) add(c, n.k);
  };
  for (const f of sortiert.slice(1)) for (const c of (f.baum.children || [])) add(c, f.baum.k);
  return basis;
}

const _asinZaehlen = (ziel, quelle) => { for (const [k, n] of Object.entries(quelle || {})) if (k) ziel[k] = (ziel[k] || 0) + n; };

// Vereinigten Baum einer Fassung in Seiten mit ihren Elementen zerlegen
function _asinSeiten(baum, werte, nummer) {
  const seiten = [];
  const neueSeite = (n) => {
    const bilder = Object.entries((werte[n.k] || {}).bilder || {}).sort((a, b) => b[1].n - a[1].n);
    const s = {
      k: n.k, name: n.name || '', label: n.label || n.name || 'Personalisierung',
      raster: n.raster || null, bild: bilder.length ? { url: bilder[0][0], ...bilder[0][1] } : null,
      texte: [], bilder: [], auswahl: [], schriften: {}, farben: {}, folge: []
    };
    seiten.push(s);
    return s;
  };
  let standard = null;       // Produkte ohne Produktseite: alles auf eine Ersatzseite
  const seiteFuer = (ctx) => ctx.seite || standard || (standard = neueSeite({ k: '', label: 'Personalisierung' }));
  const walk = (n, ctx) => {
    let c = ctx;
    if (n.type === 'PreviewContainerCustomization') c = { ...c, seite: neueSeite(n) };
    else if (n.type === 'ContainerCustomization' && (n.label || n.name)) c = { ...c, container: n.label || n.name };
    else if (n.type === 'PlacementContainerCustomization') c = { ...c, platz: n };
    const w = werte[n.k] || {};
    const platz = c.platz && c.platz.dimension && c.platz.position
      ? { x: c.platz.position.x, y: c.platz.position.y, w: c.platz.dimension.width, h: c.platz.dimension.height } : null;
    if (n.type === 'TextCustomization') {
      const t = {
        k: n.k, label: n.label || '', platzLabel: (c.platz && (c.platz.label || c.platz.name)) || '',
        container: c.container || '', platz, nr: nummer[n.k] ?? null, stat: w
      };
      seiteFuer(c).texte.push(t);
      seiteFuer(c).folge.push({ art: 'text', t });
    } else if (n.type === 'ImageCustomization') {
      seiteFuer(c).bilder.push({ k: n.k, label: n.label || '', platz, stat: w });
      seiteFuer(c).folge.push({ art: 'bild' });
    } else if (n.type === 'OptionCustomization') {
      const a = {
        k: n.k, label: n.label || n.name || '', name: n.name || '', stat: w,
        thema: _ddThema(n.name, n.label), nrs: [], bilder: 0
      };
      seiteFuer(c).auswahl.push(a);
      seiteFuer(c).folge.push({ art: 'frage', a });
    } else if (n.type === 'FontCustomization') {
      _asinZaehlen(seiteFuer(c).schriften, w.schriften);
    } else if (n.type === 'ColorCustomization') {
      _asinZaehlen(seiteFuer(c).farben, w.farben);
    }
    for (const k of (n.children || [])) walk(k, c);
  };
  walk(baum, {});
  // Dieselbe Regel wie beim Füllen (_ddAuswerten): eine Ja/Nein-Frage steuert, was auf ihrer
  // Seite bis zur nächsten Ja/Nein-Frage folgt.
  for (const s of seiten) {
    let steuer = null;
    for (const e of s.folge) {
      if (e.art === 'frage') { if (_DD_STEUERND.has(e.a.thema)) steuer = e.a; }
      else if (steuer && e.art === 'text' && e.t.nr != null && !steuer.nrs.includes(e.t.nr)) steuer.nrs.push(e.t.nr);
      else if (steuer && e.art === 'bild') steuer.bilder++;
    }
    for (const a of s.auswahl) a.nrs.sort((x, y) => x - y);
  }
  for (const s of seiten) s.texte.sort((a, b) => (a.nr ?? 999) - (b.nr ?? 999));
  return seiten;
}

// Profil → Fassungen (neueste zuerst), je Fassung Seiten, Gravur-Nummern, Bilder
function _asinAnalyse(p) {
  const formen = (p.formen || []).map(f => ({
    ...f, seiten: _seitenSig(f.baum), cs: _textGruppen(_asinMitSchluesseln(f.baum)),
  }));
  const tabs = _slotTabellenBauen(formen.map(f => ({ seiten: f.seiten, cs: f.cs, n: f.anzahl })));
  const gruppen = {};
  for (const f of formen) {
    const g = tabs.zuordnung[_sigKey(f.seiten)];
    (gruppen[g] || (gruppen[g] = [])).push(f);
  }
  const fassungen = Object.entries(gruppen).map(([g, fs]) => {
    const tab = tabs.tabellen[g] || null;
    const nummer = {};
    for (const f of fs) for (const c of f.cs) {
      if (!tab || tab.offset[c.ckey] == null) continue;
      for (const [nr, z] of Object.entries(c.nach)) if (z && z.text) nummer[z.text] = tab.offset[c.ckey] + Number(nr);
    }
    const seiten = _asinSeiten(_asinVereinigen(fs), p.werte || {}, nummer);
    const texte = seiten.flatMap(s => s.texte.map(t => ({ ...t, seite: s.label })));
    return {
      seiten, texte,
      bilder: seiten.flatMap(s => s.bilder),
      // Formen zählen ARTIKEL (je Bestellposition eine), nicht Bestellungen
      artikel: fs.reduce((n, f) => n + f.anzahl, 0),
      erste: fs.reduce((m, f) => (f.erste && (!m || f.erste < m) ? f.erste : m), null),
      letzte: fs.reduce((m, f) => (f.letzte && (!m || f.letzte > m) ? f.letzte : m), null),
      gravurZahl: tab ? tab.reihe.reduce((n, ck) => n + (tab.kap[ck] || 1), 0) : 0,
    };
  });
  fassungen.sort((a, b) => (b.letzte || '').localeCompare(a.letzte || ''));
  return { fassungen };
}

// [1,2,3,5] → "1–3, 5"
function _asinBereiche(nrs) {
  const s = [...new Set(nrs)].sort((a, b) => a - b), out = [];
  for (let i = 0; i < s.length; i++) {
    let j = i;
    while (j + 1 < s.length && s[j + 1] === s[j] + 1) j++;
    out.push(j > i ? `${s[i]}–${s[j]}` : `${s[i]}`);
    i = j;
  }
  return out.join(', ');
}

// Was ein Layout für diese ASIN belegt: Gravur-Nummern (auch Kombi-Zeilen) und Bildfelder.
function _asinBelegung(asin, layout) {
  const felder = _asinFelder(asin, layout);
  const gravuren = new Set();
  for (const f of felder) if (f.type === 'text') _feldGravuren(f).forEach(n => gravuren.add(Number(n)));
  return { name: layout.name, gravuren, bild: felder.some(f => f.type === 'image') };
}

// Layouts ↔ aktuelle Fassung. Mehrere Layouts bedienen oft GEMEINSAM eine ASIN (F02: das
// Foto-Layout die Bilder, das _Text-Layout die Deckeltexte) — gewarnt wird deshalb nur, was
// KEIN Layout abdeckt. Je Layout steht darunter, was es übernimmt.
function _asinAbgleich(asin, layouts, fassung) {
  const bel = layouts.map(l => _asinBelegung(asin, l));
  const amazon = fassung.texte.filter(t => t.nr != null);
  const nrs = new Set(amazon.map(t => t.nr));
  const hinweise = [];
  for (const t of amazon) if (!bel.some(b => b.gravuren.has(t.nr))) {
    hinweise.push({ warn: true, text: `Gravur ${t.nr} („${t.label || t.platzLabel}", ${t.seite}) steht in keinem Layout — wird nicht graviert` });
  }
  for (const b of bel) {
    const zuviel = [...b.gravuren].filter(n => !nrs.has(n));
    if (zuviel.length) hinweise.push({ warn: true, text: `${b.name}: Feld für Gravur ${_asinBereiche(zuviel)} — die liefert Amazon nicht, das Feld bleibt leer` });
  }
  if (fassung.bilder.length && !bel.some(b => b.bild)) hinweise.push({ warn: true, text: 'Kein Layout hat ein Bildfeld — das Kundenfoto wird nicht verwendet' });
  if (!fassung.bilder.length) for (const b of bel) if (b.bild) {
    hinweise.push({ warn: true, text: `${b.name}: Bildfeld vorhanden, das Produkt hat aber keinen Foto-Upload` });
  }
  if (!hinweise.length) {
    hinweise.push({
      warn: false, text: 'Alles abgedeckt'
        + (nrs.size ? ` — Gravur ${_asinBereiche([...nrs])}` : '') + (fassung.bilder.length ? ' und Kundenfoto' : '')
    });
  }
  const zeilen = bel.map(b => {
    const teile = [];
    if (b.gravuren.size) teile.push('Gravur ' + _asinBereiche([...b.gravuren]));
    if (b.bild) teile.push('Bild');
    return { name: b.name, text: teile.join(' · ') || 'keine Gravur- oder Bildfelder' };
  });
  return { hinweise, zeilen };
}

function _asinWerteListe(obj, max = 8) {
  const e = Object.entries(obj || {}).sort((a, b) => b[1] - a[1]);
  const txt = e.slice(0, max).map(([k, n]) => `${_esc(k)} <span class="umut10">(${n})</span>`).join(', ');
  return e.length > max ? txt + ` <span class="umut10">+${e.length - max} weitere</span>` : txt;
}

// Vorschau einer Seite: Amazons Produktbild, darüber die Felder an ihrer Position. Liegt eine
// echte Bestellung vor, kennt das Bild auch deren Amazon-Vorschau (data-beispiel) — beide
// stehen im selben 400er-Raster, die Rahmen passen also auf beide.
function _asinVorschau(s, beispielUrl) {
  const r = s.raster || { w: 400, h: 400 };
  const rects = [
    ...s.texte.filter(t => t.platz).map(t => ({ ...t.platz, cls: 'asin-r-text', lbl: t.nr != null ? 'G' + t.nr : '?' })),
    ...s.bilder.filter(b => b.platz).map((b, i) => ({ ...b.platz, cls: 'asin-r-bild', lbl: 'Bild' + (s.bilder.length > 1 ? ' ' + (i + 1) : '') })),
  ];
  const produkt = s.bild ? s.bild.url : '';
  if (!produkt && !beispielUrl && !rects.length) return '';
  const fs = Math.max(9, Math.round(r.w / 30));
  const quelle = _asinBeispielAn && beispielUrl ? beispielUrl : (produkt || beispielUrl || '');
  return `<div class="asin-vorschau" style="aspect-ratio:${r.w} / ${r.h};">
    ${quelle ? `<img class="asin-vorschau-bild" src="${_esc(quelle)}" data-produkt="${_esc(produkt)}" data-beispiel="${_esc(beispielUrl || '')}"
         alt="" loading="lazy" referrerpolicy="no-referrer" onload="this.style.visibility=''"
         onerror="if(this.dataset.produkt&&this.getAttribute('src')!==this.dataset.produkt){this.src=this.dataset.produkt}else{this.style.visibility='hidden'}">` : ''}
    <svg viewBox="0 0 ${r.w} ${r.h}" preserveAspectRatio="none">
      ${rects.map(q => `<rect class="${q.cls}" x="${q.x}" y="${q.y}" width="${q.w}" height="${q.h}"/>`
    + `<text x="${q.x + 3}" y="${q.y + fs}" font-size="${fs}" class="${q.cls}-t">${_esc(q.lbl)}</text>`).join('')}
    </svg>
  </div>`;
}

// Was Printomation mit einer Dropdown-Frage macht (Etikett im ASIN-Check). nutzung: s. _asinNutzung
function _asinDdTag(a, nutzung) {
  const f = _ddNorm(a.label);
  const namen = m => [...new Set((m && m.get(f)) || [])].join(', ');
  if (_DD_STEUERND.has(a.thema)) {
    const was = [a.bilder ? 'Foto' : null, a.nrs.length ? 'Gravur ' + _asinBereiche(a.nrs) : null].filter(Boolean).join(' + ');
    return `<span class="asin-dd-tag auto" title="„Nein" lässt diese Felder leer, „bezahlt, aber leer" wird gemeldet">${was ? 'steuert ' + _esc(was) : 'steuert nichts auf dieser Seite'} · automatisch</span>`;
  }
  if (nutzung && namen(nutzung.felder)) return `<span class="asin-dd-tag feld">Inhalt von Feldern in ${_esc(namen(nutzung.felder))}</span>`;
  if (nutzung && namen(nutzung.weiche)) return `<span class="asin-dd-tag feld">Layout-Weiche: ${_esc(namen(nutzung.weiche))}</span>`;
  if (a.thema === 'geschenk') return '<span class="asin-dd-tag">Packliste</span>';
  if (a.thema === 'variante') return '<span class="asin-dd-tag">Packliste (Ausführung)</span>';
  return '<span class="asin-dd-tag warn" title="Kein Feld holt seinen Inhalt aus dieser Frage">⚠ wird noch nicht verwendet</span>';
}
// Welche Layouts dieser ASIN nutzen welche Frage — als Feld-Inhalt bzw. als Weiche
function _asinNutzung(asin, layouts) {
  const felder = new Map(), weiche = new Map();
  const add = (m, k, n) => { const key = _ddNorm(k); (m.get(key) || m.set(key, []).get(key)).push(n); };
  for (const l of _asinLayouts(asin, layouts || [])) {
    for (const pg of (l.pages || [])) for (const f of (pg || [])) if (f && f.ddFrage) add(felder, f.ddFrage, l.name);
    if (l.ddNur && l.ddNur.frage) add(weiche, l.ddNur.frage, l.name);
  }
  return { felder, weiche };
}
async function _asinSeiteHtml(s, fontListe, beispiel, nutzung) {
  const zeilen = [];
  for (const t of s.texte) {
    const st = t.stat || {};
    const info = [`in ${st.gefuellt || 0}/${st.gesehen || 0} ausgefüllt`];
    if (st.maxLaenge) info.push(`max. ${st.maxLaenge} Zeichen`);
    if (st.mehrzeilig) info.push('mehrzeilig');
    const wo = [t.platzLabel, t.container].filter(Boolean).join(' · ');
    zeilen.push(`<div class="asin-el">
      <span class="asin-nr${t.nr == null ? ' asin-nr-warn' : ''}">${t.nr != null ? 'Gravur ' + t.nr : 'ohne Nr.'}</span>
      <div style="min-width:0;"><b>${_esc(t.label || t.platzLabel || 'Text')}</b> <span class="umut10">${_esc(wo)}</span>
        <div class="umut10">${info.join(' · ')}${t.nr == null ? ' · wird beim Füllen nicht verwendet' : ''}</div></div>
    </div>`);
  }
  s.bilder.forEach((b, i) => {
    const st = b.stat || {};
    const fmt = b.platz ? `${b.platz.w} × ${b.platz.h} (${(b.platz.w / b.platz.h).toFixed(2).replace('.', ',')} : 1)` : 'ohne Fläche';
    zeilen.push(`<div class="asin-el">
      <span class="asin-nr asin-nr-bild">Bild${s.bilder.length > 1 ? ' ' + (i + 1) : ''}</span>
      <div style="min-width:0;"><b>${_esc(b.label || 'Foto-Upload')}</b>
        <div class="umut10">Fläche ${fmt} · in ${st.hochgeladen || 0}/${st.gesehen || 0} hochgeladen${st.endungen ? ' · ' + _asinWerteListe(st.endungen) : ''}</div></div>
    </div>`);
  });
  for (const a of s.auswahl) {
    const st = a.stat || {};
    zeilen.push(`<div class="asin-el">
      <span class="asin-nr asin-nr-auswahl">Auswahl</span>
      <div style="min-width:0;"><b>${_esc(a.label)}</b>${_asinDdTag(a, nutzung)}
        <div class="umut10">${_asinWerteListe(st.werte)}</div></div>
    </div>`);
  }
  const schriften = Object.entries(s.schriften).sort((a, b) => b[1] - a[1]).map(([name, n]) => {
    const da = !!matchServerFontFile(fontListe, name);
    return `<span class="marke${da ? '' : ' asin-warn'}" title="${da ? 'Schriftdatei vorhanden' : 'Keine passende Schriftdatei unter Schriften — Export fällt auf Amazons Datei bzw. Arial zurück'}">${da ? '' : '⚠ '}${_esc(name)} (${n})</span>`;
  }).join(' ');
  if (schriften) zeilen.push(`<div class="asin-el"><span class="asin-nr asin-nr-auswahl">Schrift</span><div class="hstack" style="gap:4px;flex-wrap:wrap;">${schriften}</div></div>`);
  if (!zeilen.length) zeilen.push('<div class="umut10">Keine Personalisierung auf dieser Seite.</div>');
  return `<div class="asin-seite">
    ${_asinVorschau(s, beispiel && beispiel.bilder[s.name])}
    <div style="min-width:0;flex:1;">
      <div class="asin-seite-titel">${_esc(s.label)}${s.name && s.name !== s.label ? ` <span class="umut10">(${_esc(s.name)})</span>` : ''}</div>
      ${zeilen.join('')}
    </div>
  </div>`;
}

async function _asinFassungHtml(f, fontListe, beispiel, nutzung) {
  const teile = [];
  for (const s of f.seiten) teile.push(await _asinSeiteHtml(s, fontListe, beispiel, nutzung));
  return teile.join('');
}

// Eine echte Bestellung der aktuellen Fassung, die noch unter public/ liegt (die Tagesordner
// halten nur wenige Tage). Ihre Amazon-Vorschauen heißen bild-1, bild-2, … — nummeriert in der
// Reihenfolge der Produktseiten in IHRER JSON (s. downloadAndSaveZip). Deshalb die JSON lesen
// und Seite für Seite zuordnen statt die Nummer aus der Anzeige zu nehmen.
async function _asinBeispiel(asin, fassung) {
  if (!fassung) return null;
  const namen = new Set(fassung.seiten.map(s => s.name));
  // Frisch vom Server, nicht aus _alleOrders: dessen Stand hält die ganze Sitzung, und
  // Ordner, die der nächtliche Cleanup inzwischen gelöscht hat, gäbe es als Bild nicht mehr.
  let orders = [];
  try { orders = await _apiJson('/v2/orders'); } catch (_) { return null; }
  if (!Array.isArray(orders)) return null;
  const kandidaten = orders.filter(o => o.asin === asin)
    .sort((a, b) => String(b.purchaseDate || '').localeCompare(String(a.purchaseDate || '')));
  for (const o of kandidaten.slice(0, 6)) {
    let d = null;
    try { d = await _fetchOrderJson(o); } catch (_) { }
    if (!d || !d.customizationData) continue;
    const seiten = _seitenNamen(d.customizationData);
    if (!seiten.length || !seiten.every(nm => namen.has(nm))) continue;
    const basis = `${BASE_URL}/${encodeURIComponent(o.date)}/${encodeURIComponent(o.id)}/${encodeURIComponent(o.itemFolder)}`;
    const bilder = {};
    seiten.forEach((nm, i) => { bilder[nm] = `${basis}/bild-${i + 1}.jpg`; });
    return { orderId: o.id, datum: o.purchaseDate, bilder };
  }
  return null;
}

let _asinBeispielAn = false;
function asinBeispielUmschalten() {
  _asinBeispielAn = !_asinBeispielAn;
  for (const img of document.querySelectorAll('#asin-dlg-body .asin-vorschau-bild')) {
    const ziel = _asinBeispielAn ? (img.dataset.beispiel || img.dataset.produkt) : (img.dataset.produkt || img.dataset.beispiel);
    if (ziel && img.getAttribute('src') !== ziel) img.src = ziel;
  }
  _asinBeispielKnopf();
}
function _asinBeispielKnopf() {
  const b = document.getElementById('asin-dlg-beispiel');
  const bsp = _asinAktuell && _asinAktuell.beispiel;
  if (!b) return;
  b.hidden = !bsp;
  if (!bsp) return;
  b.textContent = _asinBeispielAn ? '🖼 Leeres Produkt' : '🖼 Echte Bestellung';
  b.title = _asinBeispielAn ? 'Wieder Amazons Produktbild ohne Kundendaten zeigen'
    : `Amazons Vorschau der Bestellung ${bsp.orderId} (${_asinDatum(bsp.datum)}) zeigen — liegt noch auf dem Server`;
}

function asinLayoutLaden(id) {
  asinSchliessen();
  loadLayout(id);
}

async function _asinRender(asin, p, analyse, layouts, beispiel) {
  document.getElementById('asin-dlg-titel').textContent = `${asin} — ${p.titel || 'ohne Titel'}`;
  const akt = analyse.fassungen[0];
  document.getElementById('asin-dlg-sub').textContent =
    `${p.bestellungen} Bestellung${p.bestellungen === 1 ? '' : 'en'} ausgewertet · ${_asinDatum(p.erste)}–${_asinDatum(p.letzte)}`
    + (akt ? ` · ${akt.texte.filter(t => t.nr != null).length} Gravurzeilen · ${akt.bilder.length ? akt.bilder.length + ' Foto-Upload' : 'kein Foto'}` : '');
  const body = document.getElementById('asin-dlg-body');
  if (!akt) { body.innerHTML = '<div class="umut10">Keine Struktur gefunden.</div>'; return; }
  const fontListe = await getServerFontList();
  const html = [];

  // Layouts
  let lz;
  if (layouts.length) {
    const ab = _asinAbgleich(asin, layouts, akt);
    const ids = new Map(layouts.map(l => [l.name, l.id]));
    lz = ab.hinweise.map(x => `<div class="${x.warn ? 'asin-warn-txt' : 'asin-ok-txt'}">${x.warn ? '⚠' : '✓'} ${_esc(x.text)}</div>`).join('')
      + ab.zeilen.map(z => `<div class="asin-lay hsb" style="gap:8px;"><span><b>${_esc(z.name)}</b> <span class="umut10">— ${_esc(z.text)}</span></span>`
        + (ids.get(z.name) != null ? `<button class="btn btn-muted btn-xs" onclick="asinLayoutLaden(${Number(ids.get(z.name))})" title="Layout in den Editor laden">↩ laden</button>` : '')
        + '</div>').join('');
  } else {
    lz = '<div class="asin-warn-txt">⚠ Kein Layout füllt diese ASIN — ihre Bestellungen werden nicht exportiert. „Layout-Entwurf anlegen" legt die Felder an.</div>';
  }
  html.push(`<div class="asin-block"><div class="pgrp-titel">Layouts mit dieser ASIN</div>${lz}</div>`);

  if (analyse.fassungen.length > 1) {
    const alt = analyse.fassungen.slice(1);
    html.push(`<div class="asin-block asin-hinweis">Das Listing wurde umgebaut. Unten die aktuelle Fassung
      (${akt.artikel} Artikel, ${_asinDatum(akt.erste)}–${_asinDatum(akt.letzte)}).
      Frühere Fassung${alt.length > 1 ? 'en' : ''}: ${alt.map(a => `bis ${_asinDatum(a.letzte)} (${a.artikel} Artikel)`).join(', ')} — ganz unten.
      Beim Füllen zählt jede Fassung für sich.</div>`);
  }

  const nutzung = _asinNutzung(asin, layouts);
  html.push(`<div class="asin-block"><div class="pgrp-titel">Personalisierung${analyse.fassungen.length > 1 ? ' — aktuelle Fassung' : ''}</div>${await _asinFassungHtml(akt, fontListe, beispiel, nutzung)}</div>`);
  for (const a of analyse.fassungen.slice(1)) {
    html.push(`<details class="asin-block"><summary class="pgrp-titel">Frühere Fassung bis ${_asinDatum(a.letzte)} (${a.artikel} Artikel)</summary>${await _asinFassungHtml(a, fontListe, null, nutzung)}</details>`);
  }
  body.innerHTML = html.join('');
  document.getElementById('asin-dlg-hinweis').textContent = p.bestellungen < 5
    ? `Erst ${p.bestellungen} Bestellung${p.bestellungen === 1 ? '' : 'en'} — Amazon lässt leere Felder weg, „Bei Amazon nachladen" vervollständigt das Bild.`
    : 'Positionen im 400er-Raster der Amazon-Vorschau. Die Lage auf dem Blech kennt Amazon nicht.';
}

// Zähler gegen überholte Antworten: wer schnell zwei Produkte anklickt, soll das zweite sehen,
// auch wenn das erste langsamer lädt.
let _asinOeffnenNr = 0;
async function asinOeffnen(asin, p) {
  const nr = ++_asinOeffnenNr;
  p = p || await _asinProfil(asin);
  if (nr !== _asinOeffnenNr) return;
  if (!p) { showToast('Zu dieser ASIN liegt noch keine Bestellung vor — „Prüfen" lädt nach Rückfrage bei Amazon nach', 5000); return; }
  let layouts = [];
  try { layouts = await getServerLayouts(); } catch (_) { }
  const analyse = _asinAnalyse(p);
  const beispiel = await _asinBeispiel(asin, analyse.fassungen[0]).catch(() => null);
  if (nr !== _asinOeffnenNr) return;
  _asinAktuell = { asin, profil: p, analyse, beispiel };
  _asinBeispielAn = false;
  await _asinRender(asin, p, analyse, _asinLayouts(asin, layouts), beispiel);
  if (nr !== _asinOeffnenNr) return;
  _asinBeispielKnopf();
  document.getElementById('asin-overlay').style.display = 'flex';
  // Läuft gerade ein Nachladen für diese ASIN, gehört sein Fortschritt in den Dialog.
  try { _asinStatus(await _apiJson('/v2/asin-check/scan')); } catch (_) { }
}

function asinSchliessen() {
  document.getElementById('asin-overlay').style.display = 'none';
}

// Escape schließt den Dialog — außer ein Bestätigungsdialog liegt darüber, der gehört zuerst zu.
document.addEventListener('keydown', e => {
  if (e.key !== 'Escape') return;
  const ov = document.getElementById('asin-overlay');
  const modal = document.getElementById('app-modal');
  if (!ov || ov.style.display === 'none') return;
  if (modal && getComputedStyle(modal).display !== 'none') return;
  asinSchliessen();
});

// Layout-Entwurf: je Gravurzeile ein Textfeld mit ihrer Gravur-Nummer, je Foto-Upload ein
// Bildfeld im Seitenverhältnis der Amazon-Fläche — auf der aktuellen Seite, eine Spalte je
// Produktseite. Größe und Lage auf dem Blech kennt Amazon nicht: die Felder sind maßstäblich
// zueinander, aber nicht in Millimetern, und müssen danach auf das Blech gesetzt werden.
async function asinEntwurf() {
  const a = _asinAktuell;
  const f = a && a.analyse.fassungen[0];
  if (!f) return;
  const grafikFragen = s => s.auswahl.filter(x => _DD_GRAFIK.has(x.thema));
  const seiten = f.seiten.filter(s => s.texte.some(t => t.platz && t.nr != null) || s.bilder.some(b => b.platz) || grafikFragen(s).length);
  if (!seiten.length) { showToast('Diese Fassung hat keine Gravur- oder Bildflächen mit Position', 4000); return; }
  if (fields.length && !(await confirmModal('Arbeitsfläche ersetzen?',
    `Die ${fields.length} Felder dieser Seite werden durch den Entwurf ersetzt (Strg+Z macht es rückgängig).`, 'Ersetzen'))) return;
  await _ddMotivListeLaden(true);
  saveUndo();
  fields = []; sel = null; multiSel.clear();
  const p = getPg();
  const breit = Math.max(20, (p.w - 2 * p.m - 10 * (seiten.length - 1)) / seiten.length);
  let x0 = p.m, textN = 0, bildN = 0, motivN = 0;
  for (const s of seiten) {
    const els = [...s.texte.filter(t => t.platz && t.nr != null), ...s.bilder.filter(b => b.platz)];
    // Grafik-Frage (Buchstabe, Symbol …): Amazon nennt dafür keine Fläche. Das Motivfeld sitzt
    // deshalb mittig über dem mittleren Textfeld (beim Monogramm steht der Name im Spalt),
    // ohne Textfeld mittig in der Spalte — Lage und Größe stellt man danach ein.
    const motivFeld = (frage, box) => {
      motivN++;
      fields.push({
        id: ++idc, type: 'motiv', palNum: 1, name: '◆ ' + frage, motivDatei: '', ddGruppe: 'dd' + Date.now() + '_' + motivN, ...box,
        ddFrage: frage, orderId: null, _img: null, _text: null
      });
    };
    if (!els.length) {
      const w = +(breit * 0.6).toFixed(2);
      for (const q of grafikFragen(s)) motivFeld(q.label, { x: +(x0 + (breit - w) / 2).toFixed(2), y: p.m, w, h: w });
      x0 += breit + 10;
      continue;
    }
    const minX = Math.min(...els.map(e => e.platz.x)), minY = Math.min(...els.map(e => e.platz.y));
    const maxX = Math.max(...els.map(e => e.platz.x + e.platz.w)), maxY = Math.max(...els.map(e => e.platz.y + e.platz.h));
    const mass = Math.min(breit / Math.max(1, maxX - minX), (p.h - 2 * p.m) / Math.max(1, maxY - minY));
    const lage = e => ({
      x: +(x0 + (e.platz.x - minX) * mass).toFixed(2), y: +(p.m + (e.platz.y - minY) * mass).toFixed(2),
      w: +Math.max(1, e.platz.w * mass).toFixed(2), h: +Math.max(1, e.platz.h * mass).toFixed(2)
    });
    for (const t of s.texte.filter(t => t.platz && t.nr != null)) {
      textN++;
      fields.push({
        id: ++idc, type: 'text', palNum: t.nr, name: 'Gravur ' + t.nr, ...lage(t),
        fontSize: 10, fontFamily: 'Arial', textAlign: 'center', orderId: null, _img: null, _text: null,
        overflowMode: 'stauch'
      });
    }
    for (const b of s.bilder.filter(b => b.platz)) {
      bildN++;
      fields.push({
        id: ++idc, type: 'image', palNum: bildN, name: 'Bild ' + bildN, ...lage(b),
        fontSize: 10, fontFamily: 'Arial', textAlign: 'center', orderId: null, _img: null, _text: null
      });
    }
    const texte = s.texte.filter(t => t.platz && t.nr != null);
    for (const q of grafikFragen(s)) {
      const mitte = texte.find(t => /mitte/i.test(t.label + ' ' + t.platzLabel)) || texte[Math.floor(texte.length / 2)];
      if (mitte) {
        // etwas breiter als das Textfeld, aber nie größer als Spalte bzw. Blatt
        const l = lage(mitte), w = +Math.min(l.w * 1.15, breit, p.h - 2 * p.m).toFixed(2);
        const x = Math.min(Math.max(l.x + l.w / 2 - w / 2, x0), x0 + breit - w);
        const y = Math.min(Math.max(l.y + l.h / 2 - w / 2, p.m), p.h - p.m - w);
        motivFeld(q.label, { x: +x.toFixed(2), y: +y.toFixed(2), w, h: w });
      } else {
        const w = +(breit * 0.6).toFixed(2);
        motivFeld(q.label, { x: +(x0 + (breit - w) / 2).toFixed(2), y: p.m, w, h: w });
      }
    }
    x0 += breit + 10;
  }
  saveCurrentPageSnapshot();
  // Der Entwurf ist KEIN geladenes Layout mehr. Blieb _loadedLayout stehen, hätte „ins Layout
  // übernehmen" die neue Füll-ASIN in das zuvor geladene, fremde Layout geschrieben (dessen
  // Produkt würde nicht mehr exportiert), und „Füllen + Export" liefe unter dessen Namen.
  _loadedLayout = null;
  // Füll-ASIN gleich mitsetzen: beim Speichern landet sie im Layout (_fillCfgToLayout).
  _fillCfg.singleAsinMode = true;
  _fillCfg.globalAsin = a.asin;
  try { _syncFillUI(); _updateFillDirty(); renderSaved(true); } catch (_) { }
  scheduleRender(); renderFieldList(); renderProps();
  asinSchliessen();
  showToast(`▦ Entwurf für ${a.asin}: ${textN} Gravurfeld${textN === 1 ? '' : 'er'}${bildN ? `, ${bildN} Bildfeld${bildN === 1 ? '' : 'er'}` : ''}${motivN ? `, ${motivN} Motivfeld${motivN === 1 ? '' : 'er'} (Motiv je Antwort)` : ''}. `
    + `Füll-ASIN steht auf ${a.asin}. Größe und Lage auf das Blech setzen, dann als Layout speichern.`, 8000);
}

// ── Reiter „Maschinen" ───────────────────────────────────────────────────────
// Oben die Auswahl; je Eintrag ein Bereich id="maschine-<id>". Eingerichtet = hat `laden`;
// LightBurn zeigt seit 20.10.2026 nur das Konzept (`zeigen`), ohne etwas zu schreiben.
const _MASCHINEN = [
  { id: 'ezcad', name: 'EzCad2 Lite', laden: () => ezcadLaden() },
  { id: 'lightburn', name: 'LightBurn', zeigen: () => lightburnKonzept() },
];
let _maschineWahl = 'ezcad';
function maschineWaehlen(id) {
  _maschineWahl = id;
  maschinenZeigen();
}
function maschinenZeigen() {
  const m = _MASCHINEN.find(x => x.id === _maschineWahl) || _MASCHINEN[0];
  const wahl = document.getElementById('maschinen-wahl');
  if (wahl) {
    wahl.innerHTML = _MASCHINEN.map(x => `<option value="${x.id}"${x.id === m.id ? ' selected' : ''}>`
      + `${_esc(x.name)}${x.laden ? '' : ' (Konzept)'}</option>`).join('');
    wahl.hidden = _MASCHINEN.length < 2;
  }
  document.querySelectorAll('#tab-maschinen .maschine-block').forEach(el => { el.hidden = true; });
  const block = document.getElementById('maschine-' + m.id);
  if (block) block.hidden = false;
  return (m.laden || m.zeigen)();
}

// ── Maschinen → LightBurn (Konzept) ──────────────────────────────────────────
// Nichts davon arbeitet: es zeigt, wie die Anbindung aussähe. Je Vorlagen-Ordner eine LightBurn-
// Projektdatei (.lbrn2 ist XML, also schreibbar) mit Bildern und Gravurtexten an fester Stelle —
// damit entfielen „Tag laden" und der Dynamic-File-Umweg von EzCad. Die Ordnerliste kommt aus
// derselben Übersicht wie bei EzCad (nur lesen).
async function lightburnKonzept() {
  _lbKonzeptZeichnen();
  const box = document.getElementById('lb-dateien');
  if (!box) return;
  let ordner = [..._ezDaten.values()].map(x => x.o);
  if (!ordner.length) {
    try { ordner = (await _apiJson('/v2/vorlage/uebersicht')).ordner || []; }
    catch (e) { box.innerHTML = `<div class="umut10">${_esc(e.message)}</div>`; return; }
  }
  if (_maschineWahl !== 'lightburn') return;
  box.innerHTML = ordner.length ? ordner.map(o => `<div class="lb-datei" title="Würde beim Export neben die Bilder in ${_esc(o.ordner)} geschrieben">`
    + `<span class="lb-datei-name">${_esc(o.ordner)}.lbrn2</span><span class="marke">geplant</span></div>`).join('')
    : '<div class="umut10">Keine Vorlagen-Ordner</div>';
}
function _lbKonzeptZeichnen() {
  const box = document.getElementById('maschinen-buehne');
  if (!box) return;
  const schritte = [
    ['Export', 'Printomation rastert Fotos und setzt Texte — wie heute.'],
    ['Projektdatei', 'Je Ordner eine .lbrn2: Bilder, Texte und Ebenen schon an ihrer Stelle.'],
    ['LightBurn', 'Am Laser-PC per Klick öffnen. Kein „Tag laden", kein Dynamic File.'],
    ['Laser', 'Rahmen, Start — Satz 2 ist einfach die nächste Datei.'],
  ];
  // Ebenen in LightBurn-Farben (C00 schwarz, C01 blau, T1 Werkzeug-Ebene = wird nie gelasert)
  const ebenen = [
    ['#1F1E1C', 'C00', 'Fotos', 'Bild · fertig gerastert'],
    ['#3B5BDB', 'C01', 'Gravurtexte', 'Füllung'],
    ['#B7740A', 'T1', 'Umriss der Plätze', 'nur Rahmen, nie lasern'],
  ];
  box.innerHTML = `
    <div class="mb-kopf">
      <div class="mb-titel"><b>LightBurn</b><span class="marke ez-warn">Konzept</span></div>
      <div class="mb-unter">So würde Printomation mit LightBurn arbeiten — noch ohne Funktion.</div>
    </div>
    <div class="lb-konzept">
      <div class="lb-fluss">${schritte.map(([t, s], i) => `
        <div class="lb-schritt"><span class="lb-nr">${i + 1}</span><b>${t}</b><span>${s}</span></div>`).join('')}
      </div>
      <div class="lb-reihe">
        <div class="card">
          <div class="card-titel">Ebenen statt Stifte</div>
          ${ebenen.map(([farbe, nr, was, art]) => `<div class="lb-ebene"><i style="background:${farbe}"></i><code>${nr}</code><span>${was}</span><small>${art}</small></div>`).join('')}
          <div class="umut10 lb-fuss">Werte (Speed, Power, Frequenz) je Layout, wie heute die Stifte.</div>
        </div>
        <div class="card">
          <div class="card-titel">Was dafür nötig ist</div>
          <ul class="lb-liste">
            <li>LightBurn mit Galvo-Lizenz am Laser-PC</li>
            <li>Export schreibt zusätzlich die .lbrn2</li>
            <li>kleines Hilfsprogramm, das die Datei in LightBurn öffnet</li>
            <li>einmal Test-Blech gegen EzCad vergleichen</li>
          </ul>
        </div>
      </div>
    </div>`;
}

// ── Maschinen → Ezcad ────────────────────────────────────────────────────────
// Liest /vorlage/uebersicht (Arbeitsordner + Archiv) und je .ezd /vorlage/ezd. Die Prüfung
// vergleicht die .ezd mit dem, was Printomation schreibt: jedes platzN.bmp aus DIESEM
// Ordner, Mittelpunkt wie im Layout, DXF-Pfade auf die Dateien des Ordners.
// Je Ordner EINE aufklappbare Karte (klappt nie von selbst auf — Fehler zeigt die Marke in
// der Kopfzeile). Über jeder Datei steht ihr Pfad am Laser-PC als Pfadleiste (Klick kopiert)
// — die Dateien einer .ezd müssen nicht im selben Ordner liegen wie sie selbst.
const _EZCAD_TOL_MM = 0.3;   // darunter ist eine Abweichung nicht zu sehen (Laserpunkt ~0,05)
const _EZCAD_WURZEL = ['Z:', 'exports', '_Vorlage'];   // public/ ist am Laser-PC Laufwerk Z:
const _ezcadDatum = t => t ? t.split('-').reverse().slice(0, 2).join('.') + '.' : '';
const _ezcadZeit = z => z ? new Date(z).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' }) : '';
const _ezcadId = ordner => 'ez-' + ordner.replace(/[^A-Za-z0-9_-]/g, '_');
const _ezBlockId = (ordner, datei) => _ezcadId(ordner) + '-' + datei.replace(/[^A-Za-z0-9_-]/g, '_');
// Lauf-Ordner eines Archiv-Pfads („2026-10-18 Test/…" → „2026-10-18 Test") und seine Herkunft ohne Datum
// („Test", „Reklamation", „Lauf 2"; leer = normaler Tageslauf)
const _ezLauf = pfad => String(pfad || '').split('/')[0];
const _ezHerkunft = pfad => _ezLauf(pfad).replace(/^\d{4}-\d{2}-\d{2}\s*/, '');
// „Tag 18.10. · Satz 2 · geladen 19.10., 12:10" — der erkannte Tag im Arbeitsordner (o.erkannt) samt
// Uhrzeit, wenn o.stand zum selben Tag gehört; leer bei Prüfgravur oder ohne Tag.
const _ezTagText = (e, st) => e && !e.pruef ? `Tag ${_ezcadDatum(e.tag)}${(e.satz || 1) > 1 ? ' · Satz ' + e.satz : ''}`
  + (st && st.tag === e.tag ? ` · ${st.quelle === 'archiv' ? 'geladen' : 'Lauf'} ${_ezcadZeit(st.zeit)}` : '') : '';
// Kein Foto, keine Gravur — Ezcad hätte nichts zu tun
const _ezcadLeer = o => o.belegt === 0 && o.dxf.every(x => x.leer);

// Pfadleiste: oben der Ordner (wie im Explorer), darunter die Datei; Klick kopiert den
// vollen Pfad. `fehl` = zeigt nicht in den Ordner, in den es gehört. `info` steht rechts
// daneben (bei der .ezd die Zeit der letzten Speicherung).
function _ezPfad(teile, datei, fehl, info, infoTitel) {
  const dir = teile.join('\\') + '\\', voll = dir + datei;
  const symbol = /\.ezd$/i.test(datei) ? '⬡' : /\.dxf$/i.test(datei) ? '✎' : /\.png$/i.test(datei) ? '◉' : '▦';
  return `<div class="ez-pfad${fehl ? ' ez-pfad-fehl' : ''}" data-pfad="${_esc(voll)}" onclick="_copyText(this.dataset.pfad)" title="Pfad kopieren">`
    + `<div class="ez-pfad-dir">${_esc(dir)}</div><div class="ez-pfad-datei"><i>${symbol}</i>${_esc(datei)}`
    + `${info ? `<span class="ez-zeit" title="${_esc(infoTitel || '')}">${_esc(info)}</span>` : ''}</div></div>`;
}

// Dateien gleichen Ordners zusammenfassen: platz1…platz12.bmp → „platz1–12.bmp"
function _ezDateiGruppen(pfade) {
  const ordner = new Map();
  for (const p of pfade) {
    const t = String(p).split('\\'), datei = t.pop(), dir = t.join('\\');
    const m = datei.match(/^(.*?)(\d+)(\.\w+)$/);
    const k = dir + '|' + (m ? m[1] + '#' + m[3] : datei);
    if (!ordner.has(k)) ordner.set(k, { teile: t, datei, m, nr: [] });
    if (m) ordner.get(k).nr.push(Number(m[2]));
  }
  return [...ordner.values()].map(g => {
    if (!g.m || g.nr.length < 2) return g;
    const nr = [...new Set(g.nr)].sort((a, b) => a - b);
    const lueckenlos = nr[nr.length - 1] - nr[0] === nr.length - 1;
    return { ...g, datei: g.m[1] + (lueckenlos ? `${nr[0]}–${nr[nr.length - 1]}` : nr.join(',')) + g.m[3] };
  });
}

const _ezZahl = v => typeof v === 'number' ? v.toLocaleString('de-DE', { maximumFractionDigits: 3 }) : '–';

async function ezdZurueckholen(ordner, datei, selId) {
  const sel = document.getElementById(selId);
  if (!sel || !sel.value) return;
  if (!await confirmModal('Sicherung zurückholen?', `${datei}: Stand vom ${sel.options[sel.selectedIndex].textContent}\n\n`
    + 'Der jetzige Stand wird vorher selbst gesichert. In Ezcad die Datei danach neu öffnen.', 'Zurückholen')) return;
  try {
    await _apiJson('/v2/vorlage/zurueck', 'POST', { ordner, datei, name: sel.value });
    showToast(`✅ ${datei}: Sicherung zurückgeholt — in Ezcad neu öffnen`, 7000);
  } catch (e) {
    showToast('❌ ' + e.message, 8000);
    return;
  }
  ezcadLaden();
}

// Liegt die Datei eines Objekts NICHT in diesem Vorlagen-Ordner? (Pfad ohne Laufwerk verglichen)
const _ezFremd = o => {
  const hier = (_EZCAD_WURZEL.slice(1).join('\\') + '\\' + o.ordner).toLowerCase();
  return x => !!x.pfad && !String(x.pfad).split('\\').slice(0, -1).join('\\').toLowerCase().endsWith(hier);
};
const _EZ_SYMBOL = { ok: '✓', info: '·', warn: '⚠', fehler: '✕' };
const _ezZeile = z => `<div class="ez-zeile ez-${z.stufe}"><i>${_EZ_SYMBOL[z.stufe]}</i><span>${z.html}</span></div>`;

// ── Startklar ────────────────────────────────────────────────────────────────
// Alles, was vor dem Markieren stimmen muss, als Zeilen mit Stufe (ok/info/warn/fehler). Die Bühne
// zeigt die Liste, die Kopfzeile der Karte zählt sie: ✓ nur, wenn es nichts zu tun gibt. Gezählt
// wird nur die echte .ezd — ein Entwurf oder eine Testkopie wird nicht graviert.
function _ezStartklar(dat) {
  const { o, archiv } = dat, e = o.erkannt, zeilen = [];
  const z = (stufe, html) => zeilen.push({ stufe, html });
  const herkunft = e && !e.pruef ? _ezHerkunft(e.pfad) : '';
  if (e?.pruef) z('fehler', 'Prüfgravur geladen — vor dem Gravieren einen echten Tag laden');
  else if (!e) {
    if (_ezcadLeer(o)) z('info', 'Ordner ist leer — nichts zu gravieren');
    else z('warn', 'Passt zu keinem Archiv-Tag — vor dem Gravieren einen Tag laden');
  } else {
    const heute = e.tag === _dayBerlin();
    if (!heute) z('warn', `Stand vom ${_ezcadDatum(e.tag)}, nicht von heute`);
    if (herkunft) z('warn', `Stand aus „${_esc(herkunft)}“ — kein normaler Tageslauf`);
    if (heute && !herkunft) z('ok', `Stand von heute · ${o.belegt} von ${o.plaetze} Plätzen belegt`);
    // Mehr Bestellungen als Plätze → weitere Sätze desselben Laufs liegen nur im Archiv. Kein
    // Hindernis fürs Gravieren, daher „info" — mit Knopf für den nächsten Satz.
    const { satz, saetze, naechster } = _ezSaetze(o, archiv);
    if (saetze > 1) z(naechster ? 'info' : 'ok', `Satz ${satz} von ${saetze}` + (naechster
      ? ` — nach dem Gravieren ${_ezSatzKnopf(o.ordner, naechster, saetze, 'ez-knopf')}`
      : satz === saetze ? ' — der letzte' : ''));
  }
  // Aus der belegung.txt des Laufs: „verlorene Zeichnung" ab der Warngrenze ist ein Grund,
  // vor dem Gravieren hinzusehen (warn); verfehlte Dichte und Sonderbehandlungen sind nur Hinweise
  const bel = _ezBelegungHolen(dat);
  if (bel) {
    const pl = [...bel.plaetze.values()];
    for (const p of pl.filter(p => p.zeichnungWarn))
      z('warn', `Platz ${p.n}: ${p.zeichnung} % der Zeichnung gehen verloren — vor dem Gravieren ansehen`);
    // `in`, nicht der Wert: in den Abschnitten LOGO/GRAFIK steht hinter der Platznummer nichts (Notiz '')
    const liste = (k, text) => { const n = pl.filter(p => k in p.notizen).map(p => p.n); if (n.length) z('info', text(n.length > 1 ? 'Plätze ' : 'Platz ', n.join(', '))); };
    liste('dichte', (w, n) => `Dichte-Ziel nicht erreicht: ${w}${n} — sieht anders aus als die übrigen`);
    liste('logo', (w, n) => `Als Logo graviert: ${w}${n}`);
    liste('grafik', (w, n) => `Als Grafik graviert: ${w}${n} — ist es doch ein Foto, per Reklamation neu erzeugen`);
    liste('bereich', (w, n) => `Bereiche einzeln belichtet: ${w}${n}`);
  }
  if (o.fremd.length) z('warn', `Fremde Dateien im Ordner: ${o.fremd.map(_esc).join(', ')}`);
  const haupt = dat.ezd.find(x => x.datei === dat.haupt);
  if (!o.ezd.length) z('warn', 'Keine .ezd in diesem Ordner');
  else if (!dat.fertig) z('info', `${_esc(dat.haupt)} wird geprüft …`);
  else if (haupt) {
    // platz1…12.bmp MÜSSEN da sein: fehlt eine, graviert Ezcad die beim Speichern eingebettete Kopie
    const nBilder = (haupt.d?.objekte || []).filter(x => x.typ === 'image').length;
    if (nBilder > o.plaetze) z('fehler', `Nur ${o.plaetze} von ${nBilder} Bilddateien im Ordner — bei den fehlenden graviert Ezcad die gespeicherte Kopie`);
    if (haupt.probleme.length) haupt.probleme.forEach(p => z(p.stufe, p.html));
    else z('ok', `${_esc(haupt.datei)} passt: Pfade, Lage und Dynamic File`);
  }
  if (dat.ezd.some(x => / ENTWURF\.ezd$/i.test(x.datei))) z('info', 'Ein Entwurf liegt bereit, ist aber noch nicht übernommen');
  return zeilen;
}

// Welcher Satz liegt im Arbeitsordner, wie viele hat dieser Lauf, und wo liegt der nächste?
function _ezSaetze(o, archiv) {
  const e = o.erkannt;
  if (!e || e.pruef) return { satz: 1, saetze: 1, naechster: null };
  const gleich = archiv.filter(a => a.tag === e.tag && _ezLauf(a.pfad) === _ezLauf(e.pfad));
  const satz = e.satz || 1;
  return {
    satz, saetze: Math.max(satz, ...gleich.map(a => a.satz || 1)),
    naechster: gleich.find(a => (a.satz || 1) === satz + 1) || null
  };
}
const _ezSatzKnopf = (ordner, a, saetze, klasse) =>
  `<button class="${klasse}" onclick="ezcadSatzLaden('${_jsStr(ordner)}','${_jsStr(a.pfad)}',${a.satz},${saetze})">Satz ${a.satz} laden</button>`;

const _ezZaehlen = zeilen => ({ f: zeilen.filter(x => x.stufe === 'fehler').length, w: zeilen.filter(x => x.stufe === 'warn').length });
function _ezKopfMarke(dat) {
  const st = document.getElementById(_ezcadId(dat.o.ordner) + '-status');
  if (!st) return;
  const zeilen = _ezStartklar(dat), { f, w } = _ezZaehlen(zeilen);
  st.className = 'marke ' + (f ? 'ez-fehler' : w ? 'ez-warn' : 'ez-ok');
  st.textContent = f ? `✕ ${f}` : w ? `⚠ ${w}` : '✓';
  st.title = zeilen.filter(x => x.stufe === 'fehler' || x.stufe === 'warn').map(x => x.html.replace(/<details[\s\S]*<\/details>/g, '').replace(/<[^>]+>/g, '')).join('\n') || 'startklar';
}

// ── belegung.txt des Archiv-Tags ─────────────────────────────────────────────
// Der Lauf schreibt sie ins Tagesarchiv (nicht in den Arbeitsordner, dort nur, was Ezcad liest).
// Der Arbeitsordner ist per Fingerabdruck einem Archiv-Ordner zugeordnet (o.erkannt) — dessen
// belegung.txt gehört also genau zu den Bildern, die jetzt graviert werden.
// Je Platz: Bestellung, Fläche, verlorene Zeichnung („!" ab _VERLOREN_GRENZE) und die Notizen
// der Sonder-Abschnitte (Dichte verfehlt, Gesichter, Logo …).
const _EZ_BEST_RE = /\d{3}-\d{7}-\d{7}/;
function _ezBelegungLesen(text) {
  const plaetze = new Map();
  const abschnitte = [['DICHTE-REGELUNG', 'dichte'], ['GESICHTS-AUTOMATIK', 'gesicht'], ['BEREICHE EINZELN', 'bereich'],
  ['ALS LOGO', 'logo'], ['ALS GRAFIK', 'grafik'], ['ACHTUNG', 'achtung']];
  let abschnitt = null;
  for (const zeile of String(text).split(/\r?\n/)) {
    const t = zeile.match(/^\s*(\d+)\s+platz\d+\.bmp\s/i);
    if (t) {
      const n = Number(t[1]);
      const zg = zeile.match(/\s(!?)\s*(\d+)%\s+(?:\d{3}-|—|belegt)/);
      const fl = zeile.match(/\s(\d+(?:\.\d+)?)%\s/);
      plaetze.set(n, {
        n, bestellung: (zeile.match(_EZ_BEST_RE) || [])[0] || null, leer: /— leer/.test(zeile),
        flaeche: fl ? Number(fl[1]) : null, zeichnung: zg ? Number(zg[2]) : null, zeichnungWarn: !!zg?.[1], notizen: {}
      });
      continue;
    }
    const kopf = abschnitte.find(([k]) => zeile.startsWith(k));
    if (kopf) { abschnitt = kopf[1]; continue; }
    const p = abschnitt && zeile.match(/^\s+Platz\s+(\d+):?\s*(.*?)\s*(?:\d{3}-\d{7}-\d{7}.*)?$/);
    if (p && plaetze.has(Number(p[1]))) plaetze.get(Number(p[1])).notizen[abschnitt] = p[2].replace(/\s{2,}/g, ' ').trim();
  }
  return { plaetze };
}
const _ezBelegungCache = new Map();   // Archiv-Pfad|Zeit → Auswertung (null = keine Datei oder noch unterwegs)
function _ezBelegungHolen(dat) {
  const e = dat.o.erkannt;
  if (!e || e.pruef || !e.pfad) return null;
  const a = dat.archiv.find(x => x.pfad === e.pfad);
  const key = e.pfad + '|' + (a?.geaendert || '');
  if (_ezBelegungCache.has(key)) return _ezBelegungCache.get(key);
  _ezBelegungCache.set(key, null);   // unterwegs — nicht doppelt holen
  const ordner = dat.o.ordner;
  fetch(`${BASE_URL}/exports/${e.pfad.split('/').map(encodeURIComponent).join('/')}/belegung.txt?t=${Date.parse(a?.geaendert) || 0}`)
    .then(r => r.ok ? r.text() : null)
    .then(t => {
      if (!t) return;
      _ezBelegungCache.set(key, _ezBelegungLesen(t));
      const jetzt = _ezDaten.get(ordner);
      if (jetzt?.fertig) _ezKopfMarke(jetzt);   // Warnungen zählen für „startklar" mit
      if (ordner === _ezAuswahl) _ezBuehneZeichnen();
    })
    .catch(() => { });
  return null;
}

// ── Bühne: der gewählte Ordner groß ──────────────────────────────────────────
// Ezcads eigener Bildschirm zeigt bei „Dynamic File" den Stand des letzten Markierens. Die Bühne
// zeigt, was beim NÄCHSTEN Markieren graviert wird: jedes platzN.bmp an der Lage aus der .ezd,
// gestrichelt die Felder des Layouts, daneben die Startklar-Liste. Umschaltbar auf den Entwurf,
// falls es einen gibt. (Ansichten zum Anschauen sind eigene Layouts, z. B. F02_*_PNG — nicht hier.)
const _ezDaten = new Map();   // Ordner → { o, archiv, layout, haupt, ezd: [{ datei, d, probleme }], fertig }
const _ezMerk = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (_) { } return null; };
let _ezAuswahl = _ezMerk('ezcad.auswahl') || '';
let _ezAnsicht = _ezMerk('ezcad.ansicht') || 'blech';
const _ezBildZustand = new Map();   // Bild-URL → 'leer' | 'fehlt' | 'ok'

function ezBuehneWaehlen(ordner) {
  _ezAuswahl = ordner;
  _ezMerk('ezcad.auswahl', ordner);
  document.querySelectorAll('#ezcad-liste .ez-karte').forEach(k => k.classList.toggle('ez-gewaehlt', k.id === _ezcadId(ordner)));
  _ezBuehneZeichnen();
}
function ezBuehneAnsicht(a) {
  _ezAnsicht = a;
  _ezMerk('ezcad.ansicht', a);
  _ezBuehneZeichnen();
}

function _ezBuehneZeichnen(meldung) {
  const box = document.getElementById('maschinen-buehne');
  // Ein noch laufendes Einlesen darf die Bühne einer anderen Maschine (LightBurn-Konzept) nicht übermalen
  if (!box || _maschineWahl !== 'ezcad') return;
  const dat = _ezDaten.get(_ezAuswahl);
  if (meldung || !dat) { box.innerHTML = `<div class="mb-leer">${_esc(meldung || 'Lädt …')}</div>`; return; }
  const { o } = dat, e = o.erkannt, st = o.stand;
  const start = _ezStartklar(dat);
  const { f: nF, w: nW } = _ezZaehlen(start);
  const ampel = nF ? ['ez-fehler', `✕ nicht startklar`] : nW ? ['ez-warn', `⚠ ${nW} prüfen`]
    : dat.fertig ? ['ez-ok', '✓ startklar'] : ['', 'wird geprüft …'];
  const haupt = dat.ezd.find(x => x.datei === dat.haupt && x.d);
  const entwurf = dat.ezd.find(x => / ENTWURF\.ezd$/i.test(x.datei) && x.d);
  const ansichten = [['blech', 'Blech'], entwurf && ['entwurf', 'Entwurf']].filter(Boolean);
  const ansicht = ansichten.some(a => a[0] === _ezAnsicht) ? _ezAnsicht : 'blech';
  const ezdInfo = o.ezd.find(x => x.datei === dat.haupt);
  const bel = _ezBelegungHolen(dat);
  const bestellungen = bel ? new Set([...bel.plaetze.values()].map(p => p.bestellung).filter(Boolean)).size : 0;
  const unter = [
    _ezTagText(e, st),
    `${o.belegt} von ${o.plaetze} Plätzen belegt` + (bestellungen ? ` · ${bestellungen} Bestellung${bestellungen > 1 ? 'en' : ''}` : ''),
    ezdInfo ? `${_esc(ezdInfo.datei)} gespeichert ${_ezcadZeit(ezdInfo.geaendert)}` : '',
  ].filter(Boolean).join(' · ');
  const quelle = ansicht === 'entwurf' ? entwurf : haupt;
  const flaeche = quelle ? _ezBlechSvg(dat, quelle.d, bel)
    : `<div class="mb-leer">${!o.ezd.length ? 'Keine .ezd in diesem Ordner' : dat.fertig ? '.ezd nicht lesbar' : '.ezd wird gelesen …'}</div>`;
  box.innerHTML = `
    <div class="mb-kopf">
      <div class="mb-titel"><b>${_esc(o.ordner)}</b><span class="marke ${ampel[0]}">${ampel[1]}</span></div>
      ${ansichten.length > 1 ? `<div class="seg mb-ansicht">${ansichten.map(([k, t]) =>
    `<button class="seg-b${k === ansicht ? ' an' : ''}" onclick="ezBuehneAnsicht('${k}')">${t}</button>`).join('')}</div>` : ''}
      <div class="mb-unter">${unter}</div>
    </div>
    <div class="mb-rumpf">
      <div class="mb-flaeche">${flaeche}</div>
      <aside class="mb-start">
        <div class="il-block">Startklar</div>
        ${start.map(_ezZeile).join('')}
        ${ansicht === 'entwurf' ? '<div class="umut10 mb-fuss">Zeigt den Entwurf — graviert wird weiter die echte Datei, bis du ihn übernimmst.</div>' : ''}
        <div class="umut10 mb-fuss" title="Bilder: die Dateien, die Ezcad beim nächsten Markieren liest, an der Lage aus der .ezd. Gelb gestrichelt: wo das Layout einen Platz erwartet, falls die .ezd ihn woanders hat.">Klick auf Platz = Bild öffnen · Klick auf Nummer = kopieren · gleiche Farbe = gleiche Bestellung</div>
      </aside>
    </div>`;
  _ezBilderPruefen(box);
}

// Das Blech in Ezcad-Koordinaten (Mitte 0/0, y nach oben — im SVG gespiegelt): Bilder mit ihrer
// Datei an der Lage aus der .ezd, Text/DXF als Punkt mit Namen, das Layout gestrichelt.
// Farben für Bestellungen mit mehreren Stücken (Einzelstücke bleiben neutral) — nie Rot,
// das steht für Fehler
const _EZ_GRUPPEN_FARBEN = 5;
const _EZ_NOTIZ = { dichte: 'Dichte', gesicht: 'Gesichter', bereich: 'Bereiche', logo: 'Logo', grafik: 'Grafik' };   // Tooltip je Platz
function _ezBlechSvg(dat, d, bel) {
  const { o, layout } = dat;
  const pg = layout ? { w: parseFloat(layout.page?.w) || 200, h: parseFloat(layout.page?.h) || 200 } : null;
  const obj = (d.objekte || []).filter(x => typeof x.x === 'number' && typeof x.y === 'number');
  const fremd = _ezFremd(o);
  const f2 = v => v.toFixed(2);
  const nr = p => (String(p || '').match(/(\d+)\.\w+$/) || [])[1] || '';
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  const nimm = (x, y) => { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); };
  for (const b of obj) { const w = (b.breite || 0) / 2, h = (b.hoehe || 0) / 2; nimm(b.x - w, b.y - h); nimm(b.x + w, b.y + h); }
  if (pg) { nimm(-pg.w / 2, -pg.h / 2); nimm(pg.w / 2, pg.h / 2); }
  if (!Number.isFinite(x0)) return '<div class="mb-leer">Keine Objekte mit Lage in der .ezd</div>';
  const R = 6, vb = [x0 - R, -(y1 + R), x1 - x0 + 2 * R, y1 - y0 + 2 * R].map(f2).join(' ');
  // Soll-Mitten der Layout-Felder, nach Platz (Reihenfolge wie beim Export, _bildPlaetze)
  const soll = new Map();
  if (layout && pg) _bildPlaetze(layout.pages?.[0]).forEach((f, i) => {
    const quer = Math.abs(Math.round((f.rotation || 0) / 90)) % 2 === 1;
    const [cx, cy] = _ezcadMitte(f, pg);
    soll.set(i + 1, { cx, cy, w: quer ? f.h : f.w, h: quer ? f.w : f.h });
  });
  const t = Date.parse(o.bilderZeit) || 0;
  const url = datei => `${BASE_URL}/exports/_Vorlage/${encodeURIComponent(o.ordner)}/${encodeURIComponent(datei)}?t=${t}`;
  let unten = pg ? `<rect class="mb-blech" x="${f2(-pg.w / 2)}" y="${f2(-pg.h / 2)}" width="${pg.w}" height="${pg.h}"/>` : '';
  let oben = '';
  const gezeigt = new Set();   // Plätze mit Bild an der richtigen Stelle — dort kein Layout-Rahmen nötig
  // Bestellungen auf mehreren Plätzen bekommen eine gemeinsame Farbe
  const zahl = {};
  for (const p of bel?.plaetze.values() || []) if (p.bestellung) zahl[p.bestellung] = (zahl[p.bestellung] || 0) + 1;
  const gruppe = {};
  Object.keys(zahl).filter(b => zahl[b] > 1).forEach((b, i) => { gruppe[b] = i % _EZ_GRUPPEN_FARBEN; });
  for (const b of obj.filter(x => x.typ === 'image')) {
    const datei = String(b.pfad || '').split('\\').pop(), n = Number(nr(datei)) || 0;
    const lx = b.x - b.breite / 2, ly = -(b.y + b.hoehe / 2);
    const s = soll.get(n);
    const abw = s && (Math.abs(b.x - s.cx) > _EZCAD_TOL_MM || Math.abs(b.y - s.cy) > _EZCAD_TOL_MM);
    const falsch = fremd(b);
    if (s && !abw) gezeigt.add(n);
    const pb = bel?.plaetze.get(n);
    const titel = (pb?.bestellung ? `Bestellung ${pb.bestellung}${zahl[pb.bestellung] > 1 ? ` (${zahl[pb.bestellung]} Stück)` : ''}\n` : '')
      + (pb?.flaeche != null ? `Fläche ${_ezZahl(pb.flaeche)} % · Zeichnung verloren ${pb.zeichnung ?? '–'} %${pb.zeichnungWarn ? ' — ANSEHEN' : ''}\n` : '')
      + Object.entries(pb?.notizen || {}).filter(([k]) => _EZ_NOTIZ[k]).map(([k, v]) => `${_EZ_NOTIZ[k]}${v ? ': ' + v : ''}\n`).join('')
      + `${datei} · X ${_ezZahl(Math.round(b.x * 100) / 100)} · Y ${_ezZahl(Math.round(b.y * 100) / 100)}`
      + (abw ? ` — Layout: X ${_ezZahl(Math.round(s.cx * 100) / 100)} · Y ${_ezZahl(Math.round(s.cy * 100) / 100)}` : '')
      + (falsch ? ` — liest ${b.pfad}` : '');
    // Fremder Pfad: dieses Bild kommt nicht aus dem Ordner → nicht unsere Datei zeigen
    const bild = falsch ? '' : url(datei);
    const groesse = `x="${f2(lx)}" y="${f2(ly)}" width="${f2(b.breite)}" height="${f2(b.hoehe)}"`;
    unten += `<a ${bild ? `href="${bild}" target="_blank"` : ''}><g class="mb-platz${abw || falsch ? ' mb-abw' : ''}"${bild ? ` data-bild="${bild}"` : ''}>
        <title>${_esc(titel)}</title>
        <rect class="mb-grund" ${groesse}/>
        ${bild ? `<image href="${bild}" ${groesse} preserveAspectRatio="none"/>` : ''}
        <rect class="mb-rand" ${groesse}/>
        <text class="mb-hinweis" x="${f2(b.x)}" y="${f2(-b.y)}">${falsch ? 'fremd' : ''}</text>
        <text class="mb-nr" x="${f2(lx + 1.2)}" y="${f2(ly + 1.2)}">${n || '?'}</text>
      </g></a>`;
    // Marken oben rechts: verlorene Zeichnung ab Warngrenze (gelb), verfehlte Dichte und
    // Sonderbehandlung als Hinweis — Einzelheiten im Tooltip
    const marken = pb ? [
      pb.zeichnungWarn && ['warn', `⚠ ${pb.zeichnung} %`, `${pb.zeichnung} % der Zeichnung gehen verloren — vor dem Gravieren ansehen`],
      'dichte' in pb.notizen && ['info', 'Dichte', 'Dichte-Ziel nicht erreicht: ' + pb.notizen.dichte],
      'logo' in pb.notizen && ['info', 'Logo', 'Als Logo graviert (Atkinson-Raster)'],
      'grafik' in pb.notizen && ['info', 'Grafik', 'Als Grafik graviert — ist es doch ein Foto, per Reklamation neu erzeugen'],
      'bereich' in pb.notizen && ['info', 'Ausgleich', 'Bereiche einzeln belichtet: ' + pb.notizen.bereich],
    ].filter(Boolean) : [];
    let my = ly + 1.2;
    for (const [art, text, tip] of marken) {
      const mw = text.length * 1.5 + 2.2, mx = lx + b.breite - 1.2 - mw;
      unten += `<g class="mb-marke mb-marke-${art}"><title>${_esc(tip)}</title><rect x="${f2(mx)}" y="${f2(my)}" width="${f2(mw)}" height="4" rx="0.8"/>`
        + `<text x="${f2(mx + mw / 2)}" y="${f2(my + 2)}">${_esc(text)}</text></g>`;
      my += 4.8;
    }
    // Bestellnummer als Streifen unten im Platz — außerhalb des Links, Klick kopiert sie
    if (pb?.bestellung) {
      const sh = Math.min(4.4, b.hoehe / 5), sy = ly + b.hoehe - sh;
      const g = pb.bestellung in gruppe ? ` mb-gruppe-${gruppe[pb.bestellung]}` : '';
      unten += `<g class="mb-best${g}" onclick="_copyText('${pb.bestellung}')"><title>Bestellung ${pb.bestellung}`
        + `${zahl[pb.bestellung] > 1 ? ` — ${zahl[pb.bestellung]} Stück auf diesem Blech` : ''} · Klick kopiert</title>`
        + `<rect x="${f2(lx)}" y="${f2(sy)}" width="${f2(b.breite)}" height="${f2(sh)}"/>`
        + `<text x="${f2(b.x)}" y="${f2(sy + sh / 2)}" textLength="${f2(Math.min(b.breite - 2, 29))}" lengthAdjust="spacingAndGlyphs">${pb.bestellung}</text></g>`;
    }
  }
  // Wo das Layout den Platz erwartet — nur, wo die .ezd ihn woanders (oder gar nicht) hat; obenauf,
  // damit der Rahmen auch über einem Bild zu sehen ist
  for (const [n, s] of soll) if (!gezeigt.has(n)) oben += `<rect class="mb-soll" x="${f2(s.cx - s.w / 2)}" y="${f2(-(s.cy + s.h / 2))}" width="${f2(s.w)}" height="${f2(s.h)}"/>`;
  // Text/DXF: Füllung und die DXF darin liegen auf demselben Punkt — einmal zeichnen
  const punkte = new Map();
  for (const b of obj.filter(x => x.typ !== 'image')) {
    const k = b.x.toFixed(1) + '|' + b.y.toFixed(1);
    if (!punkte.has(k) || b.pfad) punkte.set(k, b);
  }
  for (const b of punkte.values()) {
    const name = b.pfad ? String(b.pfad).split('\\').pop().replace(/\.\w+$/, '') : b.typ === 'text' ? '„' + (b.text || '') + '"' : (b.label || b.typ);
    oben += `<g class="mb-text${fremd(b) ? ' mb-abw' : ''}"><title>${_esc(b.pfad || name)}</title>`
      + `<circle cx="${f2(b.x)}" cy="${f2(-b.y)}" r="1.3"/><text x="${f2(b.x + 2.2)}" y="${f2(-b.y)}">${_esc(name)}</text></g>`;
  }
  return `<svg class="mb-svg" viewBox="${vb}" preserveAspectRatio="xMidYMid meet" role="img" aria-label="Blech ${_esc(o.ordner)}">${unten}${oben}</svg>`;
}

// Blindblätter (8×8 px) und fehlende Dateien erkennt erst das geladene Bild — dann bekommt der
// Platz „leer" bzw. „fehlt" (Zustand je URL gemerkt, die URL trägt die Zeit der Bilder).
function _ezBilderPruefen(box) {
  for (const g of box.querySelectorAll('.mb-platz[data-bild]')) {
    const url = g.dataset.bild;
    const setze = z => {
      g.classList.toggle('mb-ist-leer', z === 'leer');
      g.classList.toggle('mb-ist-fehlt', z === 'fehlt');
      const h = g.querySelector('.mb-hinweis');
      if (h) h.textContent = z === 'leer' ? 'leer' : z === 'fehlt' ? 'fehlt' : '';
    };
    if (_ezBildZustand.has(url)) { setze(_ezBildZustand.get(url)); continue; }
    const img = new Image();
    img.onload = () => { const z = img.naturalWidth <= 16 ? 'leer' : 'ok'; _ezBildZustand.set(url, z); setze(z); };
    img.onerror = () => { _ezBildZustand.set(url, 'fehlt'); setze('fehlt'); };
    img.src = url;
  }
}

// Alle Objekte der .ezd als Liste in Ezcad-Reihenfolge (= Markier-Reihenfolge) mit Stift, Lage und
// Pfad. Die Lage als Bild steht groß auf der Bühne (_ezBlechSvg).
function _ezObjekte(d, o, ctx) {
  const obj = d.objekte || [];
  if (!obj.length) return '';
  const fremd = _ezFremd(o);
  const typ = {
    image: ['▦', 'Bild'], vectorfile: ['✎', 'DXF'], hatch: ['▧', 'Füllung'], text: ['T', 'Text'],
    group: ['◫', 'Gruppe'], combine: ['◫', 'Kombi']
  };
  let nrOben = 0;
  const zeilen = obj.map(x => {
    const [sym, art] = typ[x.typ] || ['·', x.typ];
    const name = x.pfad ? String(x.pfad).split('\\').pop().replace(/\.(bmp|dxf|png|jpe?g|plt|ai|svg)$/i, '')
      : x.typ === 'hatch' ? (x.saetze || []).map(z => _ezZahl(z.abstand) + ' mm').join(' + ') || art
        : x.typ === 'text' ? '„' + (x.text || '') + '"' : (x.label || art);
    const titel = [art + (x.label ? ' „' + x.label + '"' : ''), x.pfad || '',
    typeof x.x === 'number' ? `X ${_ezZahl(Math.round(x.x * 1000) / 1000)} · Y ${_ezZahl(Math.round(x.y * 1000) / 1000)}` : '',
    x.breite ? `${_ezZahl(Math.round(x.breite * 100) / 100)} × ${_ezZahl(Math.round(x.hoehe * 100) / 100)} mm` : '',
    typeof x.flags === 'number' ? (x.flags & 0x1000 ? 'Dynamic File an' : 'Dynamic File aus') : ''].filter(Boolean).join('\n');
    const xy = v => typeof v === 'number' ? _ezZahl(Math.round(v * 10) / 10) : '';   // genau: Tooltip/Prüfung
    // Bilder und DXF-Gravuren tragen ihre Lage für „✎ Lage ändern" mit (Dateiname + genaue Mitte).
    // Eine Gravur verschiebt der Server samt ihrer Füllung.
    const lage = (x.typ === 'image' || x.typ === 'vectorfile') && x.pfad && typeof x.x === 'number'
      ? ` data-datei="${_esc(String(x.pfad).split('\\').pop())}" data-art="${x.typ}" data-x="${x.x}" data-y="${x.y}"` : '';
    return `<div class="ez-obj${x.in ? ' ez-obj-in' : ''}${fremd(x) ? ' ez-obj-fehl' : ''}${x.versteckt ? ' ez-obj-aus' : ''}"`
      + `${x.pfad ? ` data-pfad="${_esc(x.pfad)}" onclick="_copyText(this.dataset.pfad)"` : ''}${lage} title="${_esc(titel)}">`
      + `<span>${x.in ? '' : ++nrOben}</span><i>${sym}</i><span>${_esc(name)}</span><span>${x.pen ?? ''}</span><span>${xy(x.x)}</span><span>${xy(x.y)}</span></div>`;
  });
  const knopf = ctx && obj.some(x => x.typ === 'image' || x.typ === 'vectorfile')
    ? `<div class="hsb ez-lage-kopf"><span class="umut10">Lage in mm · Mitte des Blechs = 0/0</span>`
    + `<button class="ez-knopf" data-ordner="${_esc(ctx.ordner)}" data-datei="${_esc(ctx.datei)}" onclick="ezdLageBearbeiten(this)" title="Lage der Bilder und Gravuren ändern (als Entwurf)">✎ Lage ändern</button></div>` : '';
  return `<details class="ez-aufklapp ez-objekte"><summary>Objekte (${obj.filter(x => !x.in).length})</summary>
      ${knopf}
      <div class="ez-objliste"><div class="ez-obj ez-obj-kopf"><span>#</span><i></i><span>Objekt</span><span>Stift</span><span>X</span><span>Y</span></div>${zeilen.join('')}</div>
    </details>`;
}

// ── Objekte ändern (Lage) — immer als ENTWURF ────────────────────────────────
// Lage und Stift-Zuordnung stehen im gepackten Teil der .ezd. Der Server schreibt sie NIE in die
// echte Datei, sondern in „<Name> ENTWURF.ezd" daneben; weitere Änderungen bauen darauf auf. Den
// Entwurf kann man in Ezcad öffnen und ansehen, erst „Übernehmen" ersetzt die echte Datei.
const _ezAuftraege = {};   // vorbereitete Aufträge der Knöpfe („wie Layout setzen")
async function _ezdObjekteSenden(ordner, datei, auftrag, frage, text) {
  if (!await confirmModal(frage, text + '\n\nGespeichert wird ein ENTWURF neben der echten Datei. Den kannst du in Ezcad '
    + 'öffnen und ansehen — erst „Übernehmen" ersetzt die echte Datei (mit Sicherung).', 'Entwurf speichern')) return;
  showToast('⏳ Entwurf wird geschrieben …', 20000);
  try {
    const r = await _apiJson('/v2/vorlage/objekte', 'POST', { ordner, datei, auftrag });
    showToast(`✅ ${r.entwurf} gespeichert — in Ezcad ansehen, dann übernehmen`, 8000);
  } catch (e) {
    showToast('❌ ' + e.message, 9000);
    return;
  }
  ezcadLaden();
}
function ezdAuftrag(key) {
  const a = _ezAuftraege[key];
  if (a) _ezdObjekteSenden(a.ordner, a.datei, a.auftrag, a.frage, a.text);
}
async function ezdEntwurf(ordner, datei, uebernehmen) {
  const ok = await confirmModal(uebernehmen ? 'Entwurf übernehmen?' : 'Entwurf verwerfen?',
    uebernehmen ? `${datei} wird durch den Entwurf ersetzt. Die bisherige Datei wird gesichert (↶ holt sie zurück). `
      + 'In Ezcad die Datei danach neu öffnen.'
      : `Der Entwurf zu ${datei} wird gelöscht. Die echte Datei bleibt, wie sie ist.`,
    uebernehmen ? 'Übernehmen' : 'Verwerfen');
  if (!ok) return;
  try {
    await _apiJson('/v2/vorlage/entwurf', 'POST', { ordner, datei, uebernehmen });
    showToast(uebernehmen ? `✅ ${datei}: Entwurf übernommen — in Ezcad neu öffnen` : '✅ Entwurf verworfen', 7000);
  } catch (e) {
    showToast('❌ ' + e.message, 8000);
    return;
  }
  ezcadLaden();
}
function ezdLageBearbeiten(btn) {
  const box = btn.closest('.ez-objekte');
  btn.hidden = true;
  box.querySelector('.ez-objliste').classList.add('ez-bearbeiten');   // breitere X/Y-Spalten
  for (const z of box.querySelectorAll('.ez-obj[data-datei]')) {
    z.removeAttribute('onclick');   // im Bearbeiten kein Kopieren beim Klick
    const [, , , , sx, sy] = z.children;
    sx.innerHTML = `<input type="number" step="0.01" class="ez-lage" data-k="x" value="${(+z.dataset.x).toFixed(3)}">`;
    sy.innerHTML = `<input type="number" step="0.01" class="ez-lage" data-k="y" value="${(+z.dataset.y).toFixed(3)}">`;
  }
  box.querySelector('.ez-objliste').insertAdjacentHTML('afterend', `<div class="hstack" style="gap:6px;margin-top:6px;">
      <button class="btn btn-accent btn-xs" onclick="ezdLageSpeichern(this)" data-ordner="${_esc(btn.dataset.ordner)}" data-datei="${_esc(btn.dataset.datei)}">Als Entwurf speichern</button>
      <button class="btn btn-umriss btn-xs" onclick="ezcadLaden()">Abbrechen</button></div>`);
  box.querySelector('.ez-lage')?.focus();
}
function ezdLageSpeichern(btn) {
  const box = btn.closest('.ez-objekte'), bilder = [], gravuren = [], zeilen = [];
  for (const z of box.querySelectorAll('.ez-obj[data-datei]')) {
    const [ix, iy] = z.querySelectorAll('.ez-lage');
    const x = Number(String(ix.value).replace(',', '.')), y = Number(String(iy.value).replace(',', '.'));
    if (!Number.isFinite(x) || !Number.isFinite(y) || Math.abs(x) > 1000 || Math.abs(y) > 1000) {
      showToast(`❌ ${z.dataset.datei}: ungültige Lage`, 5000); (Number.isFinite(x) ? iy : ix).focus(); return;
    }
    if (Math.abs(x - z.dataset.x) < 0.0005 && Math.abs(y - z.dataset.y) < 0.0005) continue;
    if (z.dataset.art === 'vectorfile') gravuren.push({ dxf: z.dataset.datei, x, y });
    else bilder.push({ datei: z.dataset.datei, x, y });
    zeilen.push(`${z.dataset.datei}: ${_ezZahl(+(+z.dataset.x).toFixed(3))} / ${_ezZahl(+(+z.dataset.y).toFixed(3))} → ${_ezZahl(x)} / ${_ezZahl(y)}`);
  }
  if (!bilder.length && !gravuren.length) return ezcadLaden();
  _ezdObjekteSenden(btn.dataset.ordner, btn.dataset.datei, { bilder, gravuren }, 'Lage ändern?',
    zeilen.slice(0, 12).join('\n') + (zeilen.length > 12 ? `\n… und ${zeilen.length - 12} weitere` : ''));
}

// Entwurf („… ENTWURF.ezd") oder Testkopie („… TEST….ezd") neben der echten Vorlage?
const _ezNebendatei = d => / (ENTWURF|TEST)[^\\/]*\.ezd$/i.test(d);
let _ezcadLauf = 0;   // Nummer des jüngsten Einlesens — ältere Antworten werden verworfen
let _ezStandSig = '';  // Übersicht des letzten Einlesens — die Selbst-Aktualisierung vergleicht damit
// `still` (Selbst-Aktualisierung): kein „Lädt …", und was der Nutzer aufgeklappt, ausgewählt
// oder gescrollt hat, bleibt so. `vorab` = schon abgefragte Übersicht.
async function ezcadLaden(still, vorab) {
  const box = document.getElementById('ezcad-liste');
  if (!box) return;
  const lauf = ++_ezcadLauf;
  const warOffen = [...box.querySelectorAll('.ez-karte[open]')].map(k => k.id);
  const zustand = still ? _ezZustandMerken(box) : null;
  if (!still) box.innerHTML = '<div class="umut10">Lädt …</div>';
  let daten, layouts;
  try {
    [daten, layouts] = await Promise.all([
      vorab || _apiJson('/v2/vorlage/uebersicht'),
      getServerLayouts(),
    ]);
  } catch (e) {
    box.innerHTML = `<div style="color:var(--red)">Übersicht nicht ladbar: ${_esc(e.message)}</div>`;
    _ezDaten.clear();
    _ezBuehneZeichnen('Übersicht nicht ladbar: ' + e.message);
    return;
  }
  // Ein zweites Einlesen (↻ doppelt, Speichern + ↻) hat dieses überholt: seine Antworten
  // schrieben sonst in die Karten des neuen (doppelte „ungenutzt"-Zeile, alter Status).
  if (lauf !== _ezcadLauf) return;
  _ezStandSig = JSON.stringify(daten);
  _ezDaten.clear();
  if (!daten.ordner.length) {
    box.innerHTML = '<div class="umut10">Keine Vorlagen-Ordner vorhanden.</div>';
    _ezBuehneZeichnen('Keine Vorlagen-Ordner vorhanden.');
    return;
  }
  // Reihenfolge je Ordner: echte .ezd, dann ihr Entwurf, dann Testkopien
  const rang = d => / ENTWURF\.ezd$/i.test(d) ? 1 : _ezNebendatei(d) ? 2 : 0;
  for (const o of daten.ordner) o.ezd.sort((a, b) => rang(a.datei) - rang(b.datei) || a.datei.localeCompare(b.datei));
  for (const o of daten.ordner) _ezDaten.set(o.ordner, {
    o, archiv: daten.archiv.filter(a => a.ordner === o.ordner),
    // Das Foto-Layout (bmp) zuerst — seit 13.10. schreibt auch die PNG-Ansicht in den Ordner
    layout: layouts.find(l => _vorlageName(l) === o.ordner && _istVorlageLayout(l) && _formate(l).includes('bmp'))
      || layouts.find(l => _vorlageName(l) === o.ordner && _istVorlageLayout(l)) || null,
    // Die echte .ezd zählt für „startklar" und vergleicht sich mit den Geschwistern — nicht ein
    // Entwurf oder eine Testkopie
    haupt: (o.ezd.find(e => !_ezNebendatei(e.datei)) || o.ezd[0])?.datei || null,
    ezd: [], fertig: false,
  });
  // Bühne: der zuletzt gewählte Ordner, sonst der erste mit Bildern
  if (!_ezDaten.has(_ezAuswahl)) _ezAuswahl = (daten.ordner.find(o => o.belegt) || daten.ordner[0]).ordner;
  box.innerHTML = [..._ezDaten.values()].map(x => _ezcadKarte(x.o, x.archiv)).join('');
  for (const id of warOffen) document.getElementById(id)?.setAttribute('open', '');
  if (zustand) _ezZustandHerstellen(box, zustand);
  else _ezBuehneZeichnen();   // still: die Bühne bleibt stehen, bis ihr Ordner neu geprüft ist
  // .ezd-Prüfungen nachladen (je ~1 s beim ersten Mal, danach aus dem Server-Cache)
  await Promise.all([..._ezDaten.values()].map(async dat => {
    const { o, layout } = dat, id = _ezcadId(o.ordner);
    const erg = await Promise.all(o.ezd.map(e => _ezcadPruefen(o, e, layout, lauf)));
    if (lauf !== _ezcadLauf) return;
    dat.ezd = o.ezd.map((e, i) => ({ datei: e.datei, geaendert: e.geaendert, ...erg[i] }));
    dat.fertig = true;
    // Gravur-Dateien, die keine .ezd DIESES Ordners liest — z. B. die Rückseite, die über eine
    // eigene .ezd am Laser-PC läuft. Nur Hinweis, kein Fehler.
    const gelesen = erg.flatMap(r => r.gelesen);
    const offen = o.dxf.filter(x => !x.leer && !gelesen.includes(x.datei.toLowerCase()));
    const dateien = [...document.querySelectorAll(`#${id}-ezd .ez-dateien`)].pop();
    if (dateien && offen.length) dateien.insertAdjacentHTML('beforeend',
      `<div class="umut10" title="Printomation schreibt diese Dateien in den Ordner, aber keine .ezd hier liest sie — mit diesen Vorlagen werden sie nicht gelasert.">`
      + `im Ordner, aber ungenutzt: ${offen.map(x => _esc(x.datei)).join(' · ')}</div>`);
    _ezKopfMarke(dat);
    if (zustand) _ezZustandHerstellen(box, zustand);
    if (o.ordner === _ezAuswahl) _ezBuehneZeichnen();
  }));
}

// ── Selbst-Aktualisierung ────────────────────────────────────────────────────
// Ein Lauf kann den Arbeitsordner füllen, während der Reiter offen ist — die Bühne zeigte dann den
// alten Stand und womöglich ein falsches „startklar". Deshalb fragt der offene Reiter jede Minute
// die Übersicht ab und liest neu ein, wenn sie sich geändert hat (Lauf, Tag geladen, .ezd
// gespeichert). Nie mitten im Bearbeiten, bei offenem Dialog oder verstecktem Fenster.
const _EZ_AKTUALISIEREN_MS = 60000;
const _ezBearbeitetGerade = () => _appModalBusy
  || !!document.querySelector('#ezcad-liste .ez-lage')
  || !!document.activeElement?.closest?.('#ezcad-liste select, #ezcad-liste input');
setInterval(async () => {
  if (document.hidden || _maschineWahl !== 'ezcad' || !document.querySelector('.workspace.maschinen-an')) return;
  if (!_ezStandSig || _ezBearbeitetGerade()) return;
  let daten;
  try { daten = await _apiJson('/v2/vorlage/uebersicht'); } catch (_) { return; }
  if (JSON.stringify(daten) === _ezStandSig || _ezBearbeitetGerade()) return;
  ezcadLaden(true, daten);
}, _EZ_AKTUALISIEREN_MS);

// Was beim stillen Neu-Einlesen erhalten bleibt: Auswahl in den Listen (Tag, Sicherung), offene
// Aufklapper je Karte (nach Reihenfolge — die .ezd-Teile entstehen erst nach ihrer Prüfung, daher
// wird nach jeder Karte erneut hergestellt) und die Scroll-Lage der Liste.
function _ezZustandMerken(box) {
  const auswahl = {}, offen = {};
  for (const sel of box.querySelectorAll('select[id]')) auswahl[sel.id] = sel.value;
  for (const karte of box.querySelectorAll('.ez-karte')) {
    offen[karte.id] = [...karte.querySelectorAll('details.ez-aufklapp')].map((d, i) => d.open ? i : -1).filter(i => i >= 0);
  }
  return { auswahl, offen, scroll: box.closest('.panel-sec')?.scrollTop || 0 };
}
function _ezZustandHerstellen(box, z) {
  for (const [id, wert] of Object.entries(z.auswahl)) {
    const sel = document.getElementById(id);
    if (sel && [...sel.options].some(o => o.value === wert)) sel.value = wert;
  }
  for (const [id, liste] of Object.entries(z.offen)) {
    const aufklapper = document.getElementById(id)?.querySelectorAll('details.ez-aufklapp') || [];
    for (const i of liste) if (aufklapper[i]) aufklapper[i].open = true;
  }
  const sec = box.closest('.panel-sec');
  if (sec) sec.scrollTop = z.scroll;
}

function _ezcadKarte(o, archiv) {
  const id = _ezcadId(o.ordner);
  // Der Tag kommt aus dem Dateiinhalt (o.erkannt) — so stimmt er auch nach „Tag laden.bat"
  // oder einer lade-diesen-tag.bat. o.stand liefert nur die Uhrzeit, wenn er zum selben Tag gehört.
  const e = o.erkannt, st = o.stand;
  const tagTitel = _ezTagText(e, st);
  // Der heutige Tag ist der Normalfall und steht nur im Tooltip; ein ÄLTERER Tag fällt als
  // gelbe Marke auf — sonst wurde bei 12/12 belegt der Ordnername abgeschnitten.
  const heute = _dayBerlin();   // Berliner Tag wie die Ordnernamen (vorher: Zeitzone des Browsers)
  // Herkunft: kommt der Stand nicht aus dem normalen Tageslauf („<Tag>/…"), sondern aus
  // „<Tag> Test", „<Tag> Reklamation" oder „<Tag> Lauf 2", steht das als gelbe Marke da —
  // vor dem Markieren soll man sehen, dass gerade kein normaler Lauf im Ordner liegt.
  const herkunft = e && !e.pruef ? _ezHerkunft(e.pfad).replace(/^Reklamation$/, 'Rekla.') : '';
  // Mehr Bestellungen als Plätze → weitere Sätze desselben Laufs liegen nur im Archiv
  const s = _ezSaetze(o, archiv), mehr = s.saetze - s.satz;
  const tag = e && e.pruef ? '<span class="marke ez-fehler">Prüfgravur</span>'
    : e ? (e.tag === heute && e.satz <= 1 ? '' : `<span class="marke ez-warn" title="${_esc(tagTitel)}">${_ezcadDatum(e.tag)}${e.satz > 1 ? ' S' + e.satz : ''}</span>`)
      : _ezcadLeer(o) ? '' : '<span class="marke ez-warn">kein Tag</span>';   // leer: „0/12" sagt es schon
  // Vorauswahl: der jüngste NORMALE Tageslauf („<Tag>/…") — nicht ein Testblech, eine Reklamation
  // oder ein „Lauf 2", die zufällig neuer sind. Deren Herkunft steht in der Auswahl dabei.
  const vorwahl = (archiv.find(a => !a.pruef && !_ezHerkunft(a.pfad)) || {}).pfad;
  const optionen = archiv.map(a => {
    if (a.pruef) return `<option value="${_esc(a.pfad)}">Prüfgravur „Gravur 1–12" (leere Plätze, zum Bauen/Prüfen der .ezd)</option>`;
    const h = _ezHerkunft(a.pfad);
    return `<option value="${_esc(a.pfad)}"${a.pfad === vorwahl ? ' selected' : ''}>${_ezcadDatum(a.tag)}${a.satz > 1 ? ' Satz ' + a.satz : ''} — ${a.belegt}/${a.plaetze} belegt${h ? ' (' + _esc(h) + ')' : ''}</option>`;
  }).join('');
  return `
    <details class="ord ez-karte${_ezcadLeer(o) ? ' ez-leer' : ''}${o.ordner === _ezAuswahl ? ' ez-gewaehlt' : ''}" id="${id}">
      <summary class="ord-kopf" onclick="ezBuehneWaehlen('${_jsStr(o.ordner)}')" title="Auf der großen Fläche zeigen und aufklappen">
        <span class="ord-pfeil">▸</span>
        <span class="ord-name">${_esc(o.ordner)}</span>
        ${herkunft ? `<span class="marke ez-warn" title="${_esc(e.pfad)}">${_esc(herkunft)}</span>` : ''}
        ${mehr ? `<span class="marke ez-warn" title="Noch ${mehr} weitere${mehr > 1 ? '' : 'r'} Satz dieses Laufs im Archiv — nach diesem Blech „Satz ${s.satz + 1} laden“">+${mehr} Satz</span>` : ''}
        ${tag}
        <span class="marke${o.belegt ? ' ez-ok' : ''}" title="${_esc(['belegte Plätze', tagTitel].filter(Boolean).join(' · '))}">${o.belegt}/${o.plaetze}</span>
        <span id="${id}-status" class="marke">…</span>
      </summary>
      <div class="ez-inhalt">
        ${_ezTagLadenBlock(s, o.ordner, archiv, id, optionen)}
        <div id="${id}-ezd">
          ${o.ezd.length ? o.ezd.map(e => `<div id="${_ezBlockId(o.ordner, e.datei)}" class="ez-block">
              ${_ezPfad([..._EZCAD_WURZEL, o.ordner], e.datei, false, _ezcadZeit(e.geaendert), 'zuletzt gespeichert')}<div class="umut10">wird gelesen …</div></div>`).join('')
      : '<div class="ez-meldung ez-warn">Keine .ezd in diesem Ordner</div>'}
        </div>
      </div>
    </details>`;
}
// „Tag laden" (und „Satz N laden") — steht seit 17.10.2026 OBEN in der Karte: die tägliche Handlung
// zuerst, Pfade und Dateien der .ezd darunter.
function _ezTagLadenBlock(s, ordner, archiv, id, optionen) {
  if (!archiv.length) return '';
  return `
          <div class="ez-block ez-tag-laden">
            <div class="il-block">Tag laden</div>
            ${s.naechster ? `<div class="ez-satz">${_ezSatzKnopf(ordner, s.naechster, s.saetze, 'btn btn-accent btn-xs')}<span class="umut10">Satz ${s.satz} von ${s.saetze} liegt im Ordner</span></div>` : ''}
            <div class="hstack" style="gap:6px;">
              <select id="${id}-tag" style="flex:1;min-width:0;" aria-label="Tag">${optionen}</select>
              <button class="btn btn-accent" onclick="ezcadTagLaden('${_jsStr(ordner)}','${id}')">Laden</button>
            </div>
          </div>`;
}

async function ezcadTagLaden(ordner, id) {
  const sel = document.getElementById(id + '-tag');
  if (!sel || !sel.value) return;
  const text = sel.options[sel.selectedIndex].textContent;
  if (!await confirmModal('Tag in den Arbeitsordner laden?',
    `${ordner}: ${text}\n\nDie Bilder und Gravuren im Arbeitsordner werden ersetzt. Der nächste Tageslauf überschreibt sie wieder.`,
    'Laden')) return;
  _ezcadPfadLaden(ordner, sel.value);
}
async function ezcadSatzLaden(ordner, pfad, satz, saetze) {
  if (!await confirmModal(`Satz ${satz} laden?`,
    `${ordner}: Satz ${satz} von ${saetze} in den Arbeitsordner laden.\n\nErst, wenn Satz ${satz - 1} graviert ist — die Bilder und Gravuren im Arbeitsordner werden ersetzt.`,
    'Laden')) return;
  _ezcadPfadLaden(ordner, pfad);
}
async function _ezcadPfadLaden(ordner, pfad) {
  try {
    const d = await _apiJson('/v2/vorlage/laden', 'POST', { pfad });
    showToast(`✅ ${ordner}: ${d.tag ? _ezcadDatum(d.tag) : 'Prüfgravur'}${d.satz > 1 ? ' Satz ' + d.satz : ''} geladen${d.geleert.length ? ' (' + d.geleert.join(', ') + ' geleert)' : ''} — Blech prüfen`, 6000);
    ezcadLaden();
  } catch (e) {
    showToast('❌ Laden fehlgeschlagen: ' + e.message, 7000);
  }
}

// Rückgabe: welche DXF dieses Ordners die Datei liest, die gelesene .ezd (d) und ihre Probleme
// ({ stufe, html }) — die Karte zeigt sie unter „Prüfung", die Bühne in der Startklar-Liste.
async function _ezcadPruefen(o, e, layout, lauf) {
  const id = _ezBlockId(o.ordner, e.datei);
  const el = document.getElementById(id);
  if (!el) return { gelesen: [], probleme: [] };
  const kopf = _ezPfad([..._EZCAD_WURZEL, o.ordner], e.datei, false, _ezcadZeit(e.geaendert), 'zuletzt gespeichert');
  let d;
  try {
    d = await _apiJson(`/v2/vorlage/ezd?ordner=${encodeURIComponent(o.ordner)}&datei=${encodeURIComponent(e.datei)}`);
    if (lauf !== _ezcadLauf) return { gelesen: [], probleme: [] };   // inzwischen neu eingelesen
  } catch (err) {
    el.innerHTML = kopf + `<div class="ez-meldung ez-fehler">${_esc(err.message)}</div>`;
    return { gelesen: [], probleme: [{ stufe: 'fehler', html: 'nicht lesbar: ' + _esc(err.message) }] };
  }
  // Ein Entwurf wird über die ECHTE Datei angesprochen (der Server leitet den Entwurf daraus ab)
  const entwurf = / ENTWURF\.ezd$/i.test(e.datei);
  const echt = entwurf ? e.datei.replace(/ ENTWURF\.ezd$/i, '.ezd') : e.datei;
  const aendern = !/ TEST[^\\/]*\.ezd$/i.test(e.datei);   // Testkopien bleiben, wie sie sind
  // Nur Probleme werden Zeilen (Nutzerwunsch 06.10.2026) — „alles gut" zeigt der Haken oben
  const probleme = [];
  const warn = html => probleme.push({ stufe: 'warn', html });
  const fehler = html => probleme.push({ stufe: 'fehler', html });
  // Pfad relativ zu …\exports\_Vorlage\ — der Laufwerksbuchstabe ist PC-Sache
  const rel = p => { const m = String(p || '').match(/\\exports\\_Vorlage\\(.+)$/i); return m ? m[1].replace(/\\/g, '/') : null; };

  const bilder = d.objekte.filter(x => x.typ === 'image');
  const vektoren = d.objekte.filter(x => x.typ === 'vectorfile');
  // ── Bilder ──
  if (bilder.length) {
    const falsch = bilder.filter(b => { const r = rel(b.pfad); return !r || !new RegExp('^' + o.ordner.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '/platz\\d+\\.bmp$', 'i').test(r); });
    const nummern = bilder.map(b => Number((String(b.pfad).match(/platz(\d+)\.bmp$/i) || [])[1])).filter(Boolean);
    const fehlend = [...Array(o.plaetze).keys()].map(i => i + 1).filter(n => !nummern.includes(n));
    const doppelt = nummern.filter((n, i) => nummern.indexOf(n) !== i);
    if (falsch.length) falsch.forEach(b => fehler(`Bild zeigt auf <code>${_esc(b.pfad)}</code>`));
    if (fehlend.length) fehler(`Kein Bild-Objekt für Platz ${fehlend.join(', ')}`);
    if (doppelt.length) fehler(`Platz ${[...new Set(doppelt)].join(', ')} doppelt verknüpft`);
    // Positionen gegen das Layout
    if (layout) {
      const pg = { w: parseFloat(layout.page?.w) || 200, h: parseFloat(layout.page?.h) || 200 };
      const felder = _bildPlaetze(layout.pages?.[0]);
      const abw = [], ziele = [];
      let maxMm = 0;
      for (const b of bilder) {
        const n = Number((String(b.pfad).match(/platz(\d+)\.bmp$/i) || [])[1]);
        const f = felder[n - 1];
        if (!f) continue;
        const [sx, sy] = _ezcadMitte(f, pg);
        const dx = b.x - sx, dy = b.y - sy;
        if (Math.abs(dx) > _EZCAD_TOL_MM || Math.abs(dy) > _EZCAD_TOL_MM) {
          maxMm = Math.max(maxMm, Math.abs(dx), Math.abs(dy));
          abw.push(`Platz ${n}: X ${b.x.toFixed(2)} statt ${sx.toFixed(2)}, Y ${b.y.toFixed(2)} statt ${sy.toFixed(2)}`);
          ziele.push({ datei: String(b.pfad).split('\\').pop(), x: sx, y: sy });
        }
        // Um ±90° gedrehte Felder (V7: 54 × 33 quer im Layout) exportieren ein hochkantes
        // BMP — Breite und Höhe tauschen, der Mittelpunkt bleibt derselbe.
        const quer = Math.abs(Math.round((f.rotation || 0) / 90)) % 2 === 1;
        const fw = quer ? f.h : f.w, fh = quer ? f.w : f.h;
        if (Math.abs(b.breite - fw) > 0.6 || Math.abs(b.hoehe - fh) > 0.6) {
          abw.push(`Platz ${n}: Größe ${b.breite.toFixed(2)} × ${b.hoehe.toFixed(2)} statt ${fw} × ${fh}`);
        }
      }
      // Lage lässt sich aus dem Layout übernehmen; die Größe nicht (die gibt das BMP vor)
      const knopf = ziele.length && aendern ? (() => {
        const key = id + '-lage';
        _ezAuftraege[key] = {
          ordner: o.ordner, datei: echt, auftrag: { bilder: ziele },
          frage: 'Lage wie im Layout?', text: `${ziele.length === 1 ? '1 Platz' : ziele.length + ' Plätze'} in ${echt} auf die Mitte aus dem Layout ${layout.name} setzen`
            + ` (Abweichung bis ${_ezZahl(Math.round(maxMm * 100) / 100)} mm).`
        };
        return ` <button class="ez-knopf" onclick="ezdAuftrag('${key}')" title="Als Entwurf speichern">wie Layout setzen</button>`;
      })() : '';
      if (abw.length && abw.length <= 3) { abw.forEach(a => fehler(a)); probleme[probleme.length - 1].html += knopf; }
      else if (abw.length) fehler(`${abw.length} Plätze anders als Layout ${_esc(layout.name)}${maxMm ? ` (bis ${_ezZahl(Math.round(maxMm * 100) / 100)} mm)` : ''}${knopf}`
        + `<details class="ez-aufklapp"><summary>Plätze zeigen</summary>${abw.join('<br>')}</details>`);
    } else {
      warn('Kein Layout mit diesem Vorlagen-Ordner gefunden — Positionen nicht geprüft');
    }
    // Teils gemeinsam, teils eigene Stifte ist ein Versehen; jedes Bild mit eigenem Stift ist
    // gewollt („Stift je Platz")
    const stifte = [...new Set(bilder.map(b => b.pen))];
    if (stifte.length > 1 && stifte.length < bilder.length) warn(`Bilder liegen auf verschiedenen Stiften (${stifte.join(', ')})`);
  }
  // „Dynamic File“ = Bit 0x1000 im Schalterfeld des Objekts. Fehlt es, graviert Ezcad die beim Speichern
  // eingebettete Kopie (Nummernbilder oder Kunden vom Vortag) — nach einem Neuaufbau fehlte der Haken
  // bei 11 von 12 Bildern.
  const ohneDynamic = bilder.filter(b => typeof b.flags === 'number' && !(b.flags & 0x1000));
  if (ohneDynamic.length) fehler(`„Dynamic File" aus bei ${ohneDynamic.length} von ${bilder.length} Bildern `
    + `(${ohneDynamic.map(b => _esc(String(b.pfad).split('\\').pop())).join(', ')}) — Ezcad graviert dort die gespeicherte Kopie`);
  // ── Vektordateien (gravurN.dxf in je einer Füllung, gravur.dxf, rueckseite.dxf) ──
  for (const v of vektoren) {
    const r = rel(v.pfad);
    const datei = r && r.split('/').length === 2 && r.split('/')[0].toLowerCase() === o.ordner.toLowerCase() ? r.split('/')[1] : null;
    if (!datei) fehler(`DXF zeigt auf <code>${_esc(v.pfad)}</code> — richtig wäre <code>…\\_Vorlage\\${_esc(o.ordner)}\\gravur.dxf</code> bzw. <code>rueckseite.dxf</code>`);
    else if (!o.dxf.some(x => x.datei.toLowerCase() === datei.toLowerCase())) fehler(`DXF <code>${_esc(datei)}</code> gibt es in diesem Ordner nicht`);
    // Dasselbe Bit wie bei den Bildern; gesetzt bei allen zwölf gravurN.dxf der F02_Schw_V5R.ezd
    if (typeof v.flags === 'number' && !(v.flags & 0x1000)) fehler(`„Dynamic File" aus bei <code>${_esc(String(v.pfad).split('\\').pop())}</code> — Ezcad graviert die gespeicherte Kopie`);
  }
  // Ebenen einer DXF auf Stiften mit VERSCHIEDENEN Werten → Teile des Textes anders graviert
  const dxfStifte = (d.stifte || []).filter(s => s.fuer.includes('DXF'));
  // (Stift-Werte zeigt die Karte seit 20.10.2026 nicht mehr — Nutzerwunsch; die Server-Route bleibt.)
  const kennung = s => ['leistung', 'geschw', 'freq', 'puls', 'durchgaenge'].map(k => s[k]).join('|');
  if (new Set(dxfStifte.map(kennung)).size > 1)
    warn(`DXF-Ebenen auf Stiften ${dxfStifte.map(s => s.nr).join(', ')} mit verschiedenen Werten`);
  if (!bilder.length && !vektoren.length) warn('Keine Bild- oder DXF-Objekte gefunden');

  // Was die .ezd liest, mit Pfad — Ordner ungleich diesem = rot umrandet
  const hier = (_EZCAD_WURZEL.slice(1).join('\\') + '\\' + o.ordner).toLowerCase();
  const liest = _ezDateiGruppen([...bilder, ...vektoren].map(x => x.pfad))
    .map(g => _ezPfad(g.teile, g.datei, !g.teile.join('\\').toLowerCase().endsWith(hier))).join('');

  const entwurfKasten = entwurf
    ? `<div class="ez-meldung ez-entwurf"><b>Entwurf</b> — noch nicht aktiv. In Ezcad öffnen und ansehen, dann:
         <span class="hstack" style="gap:6px;margin-top:6px;">
           <button class="btn btn-accent btn-xs" onclick="ezdEntwurf('${_jsStr(o.ordner)}','${_jsStr(echt)}',true)">Übernehmen</button>
           <button class="btn btn-umriss btn-xs" onclick="ezdEntwurf('${_jsStr(o.ordner)}','${_jsStr(echt)}',false)">Verwerfen</button></span></div>` : '';
  el.innerHTML = `
    ${kopf}
    ${entwurfKasten}
    ${(e.sicherungen || []).length ? `<div class="ez-sicherung"><span class="umut10">Sicherung</span>
        <select id="${id}-sich" aria-label="Sicherung">${e.sicherungen.map(z => `<option value="${_esc(z.name)}">${_ezcadZeit(z.zeit)}</option>`).join('')}</select>
        <button class="btn btn-umriss btn-xs" onclick="ezdZurueckholen('${_jsStr(o.ordner)}','${_jsStr(e.datei)}','${id}-sich')" title="Diesen Stand zurückholen">↶</button></div>` : ''}
    <div class="il-block">Dateien</div>
    <div class="ez-dateien">${liest}</div>
    ${_ezObjekte(d, o, aendern ? { ordner: o.ordner, datei: echt } : null)}
    ${probleme.length ? `<div class="il-block">Prüfung</div><div class="ez-pruef">${probleme.map(_ezZeile).join('')}</div>` : ''}`;
  const gelesen = vektoren.map(v => (rel(v.pfad) || '').split('/')).filter(t => t.length === 2 && t[0].toLowerCase() === o.ordner.toLowerCase()).map(t => t[1].toLowerCase());
  return { gelesen, d, probleme };
}

// Platzierungsliste zu den Einzel-BMP: Ezcad rechnet vom Mittelpunkt des Arbeitsfeldes,
// die Zahlen hier sind also genau das, was in Ezcad unter Position X/Y eingetragen wird.
// Ohne die Liste müsste jemand sechs Bitmaps von Hand ausrichten.
function _bmpPlatzierungsListe(teile, layoutName, seiteTag, dateiVon) {
  const p = getPg();
  const z = [`Platzierung der Einzel-BMP — ${layoutName}${seiteTag}`,
  `Blatt ${p.w} x ${p.h} mm, Nullpunkt = Blattmitte (Ezcad)`,
    `In Ezcad je Bitmap laden und unter Position X / Y eintragen.`, ''];
  z.push('Platz  Datei                                   X (mm)     Y (mm)    Breite  Hoehe');
  for (const t of teile) {
    const [mx, my] = _ezcadMitte(t.bb, p);
    // dateiVon: Name nach Muster (layout.dateiname), sonst der bisherige Name.
    const datei = dateiVon ? dateiVon(t) : `${layoutName}${seiteTag}_Platz${t.platz}.bmp`;
    z.push(`${String(t.platz).padStart(4)}   ${datei.padEnd(38)} ${mx.toFixed(2).padStart(8)}  ${my.toFixed(2).padStart(9)}  ${t.bb.w.toFixed(1).padStart(6)}  ${t.bb.h.toFixed(1).padStart(5)}`);
  }
  return new Blob([z.join('\n') + '\n'], { type: 'text/plain' });
}

// Gemeinsamer Ablauf der Laser-Raster-Exporte: Vorprüfung, Seiten-Loop, Einzeldatei-
// bzw. ZIP-Auslieferung. makeBlob() darf null liefern (Seite ohne Bildfeld → übersprungen).
async function _exportLaserPages(ext, makeBlob, singleName, okToast, startToast) {
  const anyImages = _pages.some(pg => pg.some(f => f.type === 'image' && (f._img || f._imgSrc)));
  if (!anyImages) { showToast('Keine Bilder gefunden'); return; }
  if (startToast) showToast(startToast, 4000);
  const outputs = [];
  await _forEachExportPage(async (i) => {
    // _buildLaserCanvas startet stets beim Original — ein „Anwenden" im Editor kann
    // nicht doppelt wirken.
    const blob = await makeBlob();
    if (blob) outputs.push({ name: `seite-${i + 1}.${ext}`, blob });
  });
  const base = singleName.replace(/\.\w+$/, '');
  const ok = await _downloadPerPageOutputs(outputs, singleName, `${base}-${outputs.length}seiten.zip`);
  showToast(ok ? okToast
    : '⚠️ Keine Datei erzeugt — kein Bildfeld dieser Seiten hat ein geladenes Bild', 5000);
}

async function exportBMP() {
  // Kein harter Abbruch wenn Dithering aus ist: dann entsteht ein sauberer
  // Schwellenwert-BMP, der für Logos genau richtig ist — bei Fotos aber meist ein Versehen.
  return _exportLaserPages('bmp', () => _buildBmpBlob(ditherSettings),
    'laser-gravur.bmp', '✓ BMP exportiert — bereit für Ezcad2!',
    ditherSettings.active ? '⏳ BMP wird erstellt…'
      : 'ℹ️ Dithering ist aus — Fotos werden hart geschnitten statt gerastert');
}

function swapImage(id, input) {
  const file = input.files[0];
  if (!file) return;
  const f = fields.find(x => x.id === id);
  if (!f) return;
  saveUndo();
  const reader = new FileReader();
  reader.onload = e => {
    const img = new Image();
    img.onload = () => {
      f._img = img;
      // Sonst gravierte der Export weiter das alte Kundenfoto (_imgSrc/_placement gehen vor).
      f._imgSrc = null; f._placement = null; delete _originalImgs[f.id];
      f.orderId = f.orderId || 'manuell';
      renderEls(); drawCanvas(); renderProps();
      showToast('✓ Bild ausgetauscht');
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

async function clearAll() {
  const scope = await _askPageScope('Felder löschen',
    'Soll nur diese Seite oder alle Seiten gelöscht werden?');
  if (scope === null) return; // Abgebrochen
  const _ok = await confirmModal(
    scope === 'all' ? 'Alle Seiten löschen?' : 'Diese Seite löschen?',
    'Strg+Z zum Rückgängigmachen.', 'Löschen'
  );
  if (!_ok) return;
  saveUndo();
  if (scope === 'this') {
    fields = []; sel = null;
    _pages[_currentPage] = [];
  } else {
    // Alle Seiten auf leer setzen
    _pages.forEach((_, i) => { _pages[i] = []; });
    fields = []; sel = null;
    _currentPage = 0;
  }
  multiSel.clear();
  updatePageNavigator();
  scheduleRender(); renderFieldList(); renderProps();
}

// ── Füllen: Zeitraum-Filter ──────────────────────────────────────────────────
// Zeitraum-Select → _fillCfg, dann Optik (custom-Felder + Session-Info)
function fillDatePresetChange() {
  const sel = document.getElementById('fill-date-preset');
  if (sel) _fillCfg.datePreset = sel.value || 'session';
  _paintDatePreset();
  _updateFillDirty();
  // Session nachladen wenn gewählt
  if (_fillCfg.datePreset === 'session' && sessionOrders.length === 0) loadSession();
}

function _paintDatePreset() {
  const custom = document.getElementById('fill-date-custom');
  const sessionInfo = document.getElementById('session-info');
  if (custom) custom.style.display = _fillCfg.datePreset === 'custom' ? 'block' : 'none';
  if (sessionInfo) sessionInfo.style.display = _fillCfg.datePreset === 'session' ? 'block' : 'none';
}

async function debugFindOrder() {
  const input = document.getElementById('debug-order-input')?.value?.trim();
  const resultEl = document.getElementById('debug-order-result');
  if (!resultEl) return;
  if (!input) { resultEl.style.display = 'none'; return; }

  resultEl.style.display = 'block';
  const lines = [];
  const ok = s => `<span style="color:var(--green)">✅ ${s}</span>`;
  const err = s => `<span style="color:var(--red)">❌ ${s}</span>`;
  const warn = s => `<span style="color:var(--amber)">⚠️ ${s}</span>`;
  const info = s => `<span style="color:var(--text-muted)">${s}</span>`;

  // 1. Ist die Bestellung überhaupt in orders[]?
  const order = orders.find(o => o.id === input);
  if (!order) {
    resultEl.innerHTML = err('Nicht in orders[] gefunden — wurde nie heruntergeladen oder falsches Datum-Format');
    return;
  }
  lines.push(ok('In orders[] vorhanden'));
  lines.push(info(`→ ASIN: ${order.asin || '?'} | Datum: ${order.date || order.purchaseDate || '?'} | Menge: ${order.quantity || 1}`));

  // Typ ermitteln — Gravurtext aus der Bestell-JSON lesen (getAllTexts, gecacht); die
  // orders[]-Objekte selbst enthalten keinen Text.
  const hasImg = _orderHasImage(order);
  const alleT = await getAllTexts(order);
  const { texts } = alleT;
  const hasText = texts.some(t => t && t.trim());
  lines.push(info(`→ Typ: ${hasImg ? '🖼 Bild' : ''}${hasText ? ' ✏️ Text' : ''}${!hasImg && !hasText ? '❓ Kein Inhalt erkannt' : ''}`));
  const ddE = _ddEintrag(alleT);
  if (ddE.auswahl.length) lines.push(info(`→ Dropdowns: ${ddE.auswahl.map(a => `${_esc(a.frage)} = <b>${_esc(a.wert)}</b>${a.steuert.length ? ' (steuert Gravur ' + a.steuert.join(', ') + ')' : ''}`).join(' · ')}`));
  for (const h of ddE.hinweise) lines.push(warn(_esc(h)));
  if (ddE.ohneGravur) {
    lines.push(err('Nichts zu gravieren („Ohne Gravur“ ohne Text und Foto) — bekommt keinen Platz, steht auf der Packliste'));
    resultEl.innerHTML = lines.join('<br>');
    return;
  }
  if (_fillCfg.ddNur && _ddCache.has(_orderKey(order)) && !_ddPasst(order, _fillCfg.ddNur)) {
    lines.push(err(`„Nur Bestellungen mit ${_esc(_fillCfg.ddNur.frage)}“ im Layout — diese Antwort ist nicht angehakt`));
    resultEl.innerHTML = lines.join('<br>');
    return;
  }

  // 2. Datum-Filter
  const preset = _fillCfg.datePreset || 'session';
  lines.push(info(`→ Aktiver Filter: <b>${preset}</b>`));

  const dateFiltered = getFillDateFilteredOrders();
  const inDateFilter = dateFiltered.some(o => o.id === input);
  if (!inDateFilter) {
    const orderDate = order.date || order.purchaseDate?.split('T')[0] || '?';
    const today = _dayBerlin();
    const yesterday = _dayBerlin(1);
    lines.push(err(`Vom Datum-Filter ausgeschlossen`));
    lines.push(warn(`Bestelldatum: ${orderDate} | Heute: ${today} | Gestern: ${yesterday}`));
    if (preset === 'session') {
      const inSession = sessionOrders.some(o => o.id === input);
      lines.push(inSession ? warn('Ist in Session aber nicht im Filter — Datum stimmt nicht?') : err('Nicht in Session — vor dem letzten Download?'));
    }
    resultEl.innerHTML = lines.join('<br>');
    return;
  }
  lines.push(ok('Datum-Filter: bestanden'));

  // 3. Session-Pointer
  const allFiltered = dateFiltered.sort(_orderSort);
  const idxInAll = allFiltered.findIndex(o => o.id === input);
  lines.push(info(`→ Position in gefilterter Liste: ${idxInAll + 1} von ${allFiltered.length}`));
  lines.push(info(`→ Aktueller Pointer: ${_sessionPointer}`));

  if (idxInAll < _sessionPointer) {
    lines.push(err(`Vom Pointer übersprungen — bereits auf einer früheren Seite gefüllt (Position ${idxInAll + 1} < Pointer ${_sessionPointer})`));
    lines.push(warn('Tipp: neu füllen — „Füllen" beginnt wieder bei der ersten Bestellung'));
    resultEl.innerHTML = lines.join('<br>');
    return;
  }
  lines.push(ok('Pointer: noch nicht verbraucht'));

  // 4. ASIN-Filter — exakt wie fillWithData: globale Füll-ASIN bzw. pro-Feld filterAsin.
  if (getSingleAsinMode()) {
    const g = getGlobalAsin();
    if (g && order.asin && order.asin !== g) {
      lines.push(err(`ASIN ${order.asin} ≠ globale Füll-ASIN ${g}`));
      resultEl.innerHTML = lines.join('<br>');
      return;
    }
  } else {
    const fieldAsins = new Set(fields.filter(f => f.filterAsin).map(f => f.filterAsin));
    // Felder ohne filterAsin nehmen alle ASINs → nur blocken, wenn es KEIN offenes Feld gibt
    // und die ASIN zu keinem der gesetzten Feld-Filter passt.
    const anyOpen = fields.some(f => (f.type === 'image' || f.type === 'text') && !f.filterAsin);
    if (!anyOpen && fieldAsins.size > 0 && order.asin && !fieldAsins.has(order.asin)) {
      lines.push(err(`ASIN ${order.asin} passt zu keinem Feld-Filter (${[...fieldAsins].join(', ')})`));
      resultEl.innerHTML = lines.join('<br>');
      return;
    }
  }
  lines.push(ok('ASIN-Filter: bestanden'));

  // 5. Kein passendes Feld?
  const imgFields = fields.filter(f => f.type === 'image');
  const txtFields = fields.filter(f => f.type === 'text');
  if (hasImg && imgFields.length === 0) lines.push(err('Kein Bild-Feld im Layout vorhanden'));
  if (!hasImg && txtFields.length === 0) lines.push(err('Kein Text-Feld im Layout vorhanden'));
  if ((hasImg && imgFields.length > 0) || (!hasImg && txtFields.length > 0)) {
    lines.push(ok('Passendes Feld im Layout vorhanden'));
    lines.push(warn('Bestellung sollte eigentlich gefüllt werden — evtl. schon gefüllt oder auf einer anderen Seite?'));
  }

  resultEl.innerHTML = lines.join('<br>');
}

function getFillDateFilteredOrders() {
  let liste = _fillDateFilteredOrders();
  if (_nurMitFoto) liste = liste.filter(_orderHasImage);
  // Dropdowns: „nichts zu gravieren" (z. B. „Ohne Gravur" ohne Rückseite) belegt keinen
  // Platz — sie steht auf der Packliste. Kennt _ddCache die Bestellung (noch) nicht, bleibt
  // sie drin wie vor dem Einbau; fillLayoutPages füllt den Cache vorher.
  liste = liste.filter(o => !(_ddCache.get(_orderKey(o)) || {}).ohneGravur);
  if (_fillCfg.ddNur) liste = liste.filter(o => _ddPasst(o, _fillCfg.ddNur));
  return liste;
}

function _fillDateFilteredOrders() {
  const preset = _fillCfg.datePreset || 'session';
  // Immer eine KOPIE liefern, nie die globale orders-Referenz: die Aufrufer sortieren
  // in-place, und die globale Liste darf dabei nicht mit umsortiert werden.
  if (preset === 'all') return [...orders];
  // Session: nach Session-IDs filtern. Leere Session = leere Liste (sonst exportierte ein Lauf ohne
  // Neues die letzten Tage erneut). Geladen wird sie in fillLayoutPages.
  if (preset === 'session') {
    const sessionIds = new Set(sessionOrders.map(o => o.id));
    return orders.filter(o => sessionIds.has(o.id));
  }
  return orders.filter(o => _matchesDatePreset(o, preset, _fillCfg.dateFrom, _fillCfg.dateTo));
}

// Text-Partner eines Foto-Layouts (F02_xxx_V5_Text zu F02_xxx_V5): beide schreiben in EINEN
// Vorlagen-Ordner und werden nur über die Platznummer gepaart (platzN.bmp ↔ gravurN.dxf). Das
// Foto-Layout nimmt nur Bestellungen MIT Foto, also muss das Text-Layout genau dieselben nehmen —
// sonst sitzt ab der ersten fotolosen Bestellung jeder Deckeltext einen Platz neben seinem Foto.
// Gesetzt nur vom Auto-Export und nur für die Dauer EINES Layouts (runAutoExport).
let _nurMitFoto = false;
function _istTextPartner(layout, alle) {
  const mitBild = l => _layoutHat(l, f => f.type === 'image');
  if (!_istVorlageLayout(layout) || mitBild(layout)) return false;
  const ordner = _vorlageName(layout);
  return (alle || []).some(l => l.id !== layout.id && _istVorlageLayout(l) && mitBild(l) && _vorlageName(l) === ordner);
}

// ── Leere Einträge Modus ─────────────────────────────────────────────────────
function setEmptyMode(mode) {
  _fillCfg.emptyMode = mode;
  _paintEmptyMode();
  _updateFillDirty();
}

function _paintEmptyMode() {
  // Nur die Klasse umschalten — Rahmen, Grund, Punkt und Titelfarbe der aktiven Zeile
  // stehen im Stylesheet (.an / .an .rdot / .an .opt-title), keine Farbtabelle hier.
  for (const m of ['leer', 'strich', 'ueberspringen']) {
    _setAn('empty-opt-' + m, m === _fillCfg.emptyMode);
  }
}

// Getter für die Fill-Logik: „Überspringen" gilt für Text- UND Bildfelder gleich.
function getSkipEmpty() { return _fillCfg.emptyMode === 'ueberspringen'; }
function getShowDash() { return _fillCfg.emptyMode === 'strich'; }

// ── Modals ───────────────────────────────────────────────────────────────────
// Blockierende Dialoge. shortcuts-overlay steht bewusst NICHT in der Liste: es ist
// reine Hilfe-Anzeige und wird selbst per "?" wieder geschlossen.
const _BLOCKING_OVERLAYS = ['app-modal', 'create-folder-modal', 'dxf-modal',
  'laser-preview-overlay', 'layout-settings-overlay', 'asin-overlay'];
// Liegt ein Dialog über der Oberfläche? Die Tastenkürzel fragen das ab, sonst wirken sie
// auf den Editor DAHINTER: Entf löschte das ausgewählte Feld, Strg+S überschrieb den
// laufenden Dialog im gemeinsamen Container und dessen Promise blieb für immer offen.
// getComputedStyle statt style.display — create-folder-modal wird per DOM-Einfügen
// gezeigt, die anderen per Inline-Stil.
function _modalIsOpen() {
  return _BLOCKING_OVERLAYS.some(id => {
    const el = document.getElementById(id);
    return el && getComputedStyle(el).display !== 'none';
  });
}
// Reentranz-Schutz: confirm/prompt/choice teilen sich EINEN Container. Ein zweiter
// Dialog über einem wartenden würde dessen Promise verwaisen lassen (s.o.). Über die
// Tastatur ist das durch _modalIsOpen abgedeckt; dieser Riegel fängt programmatische
// Doppelaufrufe (z.B. zwei parallele async-Ketten) zusätzlich ab.
let _appModalBusy = false;

function _ensureModalContainer() {
  let m = document.getElementById('app-modal');
  if (m) return m;
  m = document.createElement('div'); m.id = 'app-modal';
  m.style.cssText = 'position:fixed;inset:0;z-index:9999;display:none;align-items:center;justify-content:center;';   // Abdunkelung: Stilvorlage
  m.innerHTML = `<div class="dlg-kasten" style="min-width:340px;max-width:460px;">
    <div id="app-modal-title" class="dlg-titel" style="margin-bottom:8px;"></div>
    <div id="app-modal-msg" style="font-size:var(--fs-basis);color:var(--text-dim);margin-bottom:18px;line-height:1.55;"></div>
    <div id="app-modal-input-wrap" style="display:none;margin-bottom:18px;"><input id="app-modal-input" type="text" style="font-size:var(--fs-basis);padding:9px 11px;"/></div>
    <div style="display:flex;gap:8px;justify-content:flex-end;">
      <button id="app-modal-cancel" class="btn btn-muted btn-dialog">Abbrechen</button>
      <button id="app-modal-alt" class="btn btn-muted btn-dialog" style="display:none;"></button>
      <button id="app-modal-ok" class="btn btn-dialog"></button>
    </div></div>`;
  document.body.appendChild(m); return m;
}
// EIN Bauplan für alle drei Dialoge (confirm/prompt/choice).
//  onOk        Funktion → Rückgabewert bei OK / Enter
//  onCancel    Wert bei Abbrechen / Escape (auch die Antwort, wenn schon ein Dialog offen ist)
//  altLabel    gesetzt → dritter Button (choiceModal), liefert onAlt
//  enterOk     Enter bestätigt (bei choiceModal bewusst nicht: es gibt keine Vorauswahl)
function _appModal(o) {
  return new Promise(resolve => {
    if (_appModalBusy) { console.warn('Dialog bereits offen, abgelehnt:', o.title); return resolve(o.onCancel); }
    _appModalBusy = true;
    const m = _ensureModalContainer();
    document.getElementById('app-modal-title').textContent = o.title;
    document.getElementById('app-modal-msg').textContent = o.message || '';
    document.getElementById('app-modal-input-wrap').style.display = o.input ? 'block' : 'none';
    const inp = document.getElementById('app-modal-input');
    if (o.input) inp.value = o.defaultValue || '';
    const ok = document.getElementById('app-modal-ok');
    const ca = document.getElementById('app-modal-cancel');
    const alt = document.getElementById('app-modal-alt');
    ok.textContent = o.okLabel;
    // Maße und Farbe über die gemeinsamen Knopf-Klassen statt über einen eigenen
    // Inline-Stil — sonst hätte der Dialog-Knopf als Einziger seine eigene Größe.
    ok.className = 'btn btn-dialog ' + (o.danger ? 'btn-red-voll' : 'btn-accent');
    alt.style.display = o.altLabel ? '' : 'none';
    if (o.altLabel) alt.textContent = o.altLabel;
    m.style.display = 'flex';
    const done = v => {
      _appModalBusy = false;
      m.style.display = 'none';
      alt.style.display = 'none';
      ok.onclick = ca.onclick = alt.onclick = null;
      document.removeEventListener('keydown', kh);
      resolve(v);
    };
    // Antwort NIE ungeschützt aus o.onOk holen: wirft sie, bleibt das Promise offen UND
    // _appModalBusy gesetzt — danach beantwortet sich JEDER Dialog selbst mit "abbrechen".
    const antwort = () => {
      try { return o.onOk ? o.onOk() : true; }
      catch (e) { console.error('Dialog-Antwort fehlgeschlagen:', e); return o.onCancel; }
    };
    ok.onclick = () => done(antwort());
    ca.onclick = () => done(o.onCancel);
    alt.onclick = () => done(o.onAlt);
    const kh = e => {
      if (o.enterOk && e.key === 'Enter') { e.preventDefault(); done(antwort()); }
      if (e.key === 'Escape') { e.preventDefault(); done(o.onCancel); }
      // Fokus im Dialog halten: ohne das sprang schon der erste Tab hinter den Dialog auf
      // die Kopfleiste — blind bedienbare Knöpfe bei offenem „wirklich löschen?".
      if (e.key === 'Tab') {
        const ziele = [...m.querySelectorAll('button, input')].filter(el => el.offsetParent !== null);
        if (!ziele.length) return;
        const erster = ziele[0], letzter = ziele[ziele.length - 1];
        if (!m.contains(document.activeElement)) { e.preventDefault(); erster.focus(); }
        else if (e.shiftKey && document.activeElement === erster) { e.preventDefault(); letzter.focus(); }
        else if (!e.shiftKey && document.activeElement === letzter) { e.preventDefault(); erster.focus(); }
      }
    };
    document.addEventListener('keydown', kh);
    setTimeout(() => { if (o.input) { inp.focus(); inp.select(); } else ok.focus(); }, 50);
  });
}

// Bei laufendem Dialog wird NICHT übernommen, sondern "nein" geantwortet: ein
// confirmModal schützt immer eine eingreifende Aktion (löschen, überschreiben, abbrechen).
function confirmModal(title, message, okLabel) {
  return _appModal({
    title, message,
    okLabel: okLabel || 'OK',
    danger: /lösch|delete|entfern|abbrech|stopp/i.test(okLabel || ''),
    enterOk: true,
    onOk: () => true,
    onCancel: false,
  });
}

function promptModal(title, message, defaultValue) {
  return _appModal({
    title, message,
    okLabel: 'Speichern',
    input: true, defaultValue,
    enterOk: true,
    onOk: () => document.getElementById('app-modal-input').value,
    onCancel: null,
  });
}

// Dialog mit zwei Auswahlmöglichkeiten + Abbrechen. Gibt 'this', 'all' oder null zurück.
function choiceModal(title, message, labelA, labelB) {
  return _appModal({
    title, message,
    okLabel: labelA, altLabel: labelB,
    onOk: () => 'this',
    onAlt: 'all',
    onCancel: null,
  });
}

// Text (z.B. Bestellnummer) in die Zwischenablage kopieren + kurze Rückmeldung.
// Moderne API zuerst; bei Ablehnung (älterer/eingeschränkter Kontext) Fallback auf execCommand.
async function _copyText(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('📋 Kopiert: ' + text);
      return;
    }
  } catch (e) { /* fällt unten auf execCommand zurück */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = text; ta.style.position = 'fixed'; ta.style.top = '-1000px'; ta.style.opacity = '0';
    document.body.appendChild(ta); ta.focus(); ta.select();
    const ok = document.execCommand('copy'); ta.remove();
    showToast(ok ? ('📋 Kopiert: ' + text) : '⚠️ Kopieren fehlgeschlagen');
  } catch (e) { showToast('⚠️ Kopieren fehlgeschlagen'); }
}

// ── Toast ────────────────────────────────────────────────────────────────────
let _toastTimer = null;
function showToast(msg, duration = 1800) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove('show'), duration);
}

// ── Shortcuts Overlay ────────────────────────────────────────────────────────
function toggleShortcuts() {
  const o = document.getElementById('shortcuts-overlay');
  o.classList.toggle('open');
}

// ── Export Menu ───────────────────────────────────────────────────────────────
// Beide Menüs schließen bei JEDEM Klick (auch innen — der Menüpunkt-onclick feuert zuerst), über
// _dismissOnClick.
// IST DAS POPOVER OFFEN? Über den BERECHNETEN Stil, nicht el.style.display: versteckt werden die
// Popovers von der CSS-Klasse `.popover`, ihr Inline-Stil ist beim Seitenaufbau leer — sonst öffnete
// erst der zweite Klick.
function _popIsOpen(el) {
  return !!el && getComputedStyle(el).display !== 'none';
}

// Kopf-Menüs „⚙ Aktionen" und „↓ Export": es ist immer nur eins offen. Bis 08.10.2026 schloss
// nur „Aktionen" das andere — „Export" ließ ein offenes Aktionen-Menü daneben stehen.
const _KOPF_MENUES = ['actions-menu', 'export-menu'];
function _toggleMenu(e, id) {
  e.stopPropagation();
  for (const andere of _KOPF_MENUES) if (andere !== id) { const x = document.getElementById(andere); if (x) x.style.display = 'none'; }
  const m = document.getElementById(id);
  const open = _popIsOpen(m);
  m.style.display = open ? 'none' : 'block';
  if (!open) _dismissOnClick(m);
}

// ── Text-Render-Logik für Vorschau (drawCanvas) UND Export (renderFieldToCtx) ──
// EINE Quelle → die Vorschau zeigt exakt das Export-Ergebnis. pxPerMm = Pixel pro mm bei
// der jeweiligen Auflösung (Vorschau MM·zoom, Export scale); geclippt wird beim Aufrufer.

// Text entlang eines Kreisbogens (Kreismitte = Feldmitte, Baseline auf dem Radius).
// 'top' = Bogen oben, Zeichen aufrecht; 'bottom' = unten, von außen lesbar gedreht.
// Die Feld-Drehung (°) wirkt als Startwinkel — der Aufrufer rotiert schon um die Mitte.
function _drawCircleText(ctx, f, cx, cy, pxPerMm, txt, fontPx, usedFont) {
  const r = (f.circleDia / 2) * pxPerMm;
  if (!(r > 0)) return;
  const spread = f.circleSpread || 1;
  // Mehrzeilig ergibt am Bogen keinen Sinn → Zeilen verbunden (s. _bogenEinheiten, wie im DXF)
  const _bz = _bzFeld(f, txt);
  const { chars } = _bogenEinheiten(f, txt, _bz ? _otFeldSchrift(f, txt) : null);
  ctx.font = _canvasFont(fontPx, usedFont, f.bold);
  ctx.textAlign = 'center';
  const C = _bz ? _capPx(ctx) : 0;
  const widths = chars.map(c => (typeof c === 'string' ? ctx.measureText(c).width : _ersatzMass(c).adv * C) * spread);
  const totalAngle = widths.reduce((s, wch) => s + wch, 0) / r;
  const bottom = f.circleSide === 'bottom';
  // top: zentriert um 12 Uhr (−90°), Leserichtung im Uhrzeigersinn (θ steigend, y-down)
  // bottom: zentriert um 6 Uhr (+90°), Leserichtung gegen den Uhrzeigersinn (θ fallend)
  let arc = 0;
  for (let i = 0; i < chars.length; i++) {
    const half = widths[i] / 2;
    const theta = bottom
      ? Math.PI / 2 + totalAngle / 2 - (arc + half) / r
      : -Math.PI / 2 - totalAngle / 2 + (arc + half) / r;
    if (typeof chars[i] !== 'string' || chars[i].trim()) {
      ctx.save();
      ctx.translate(cx + r * Math.cos(theta), cy + r * Math.sin(theta));
      ctx.rotate(theta + (bottom ? -Math.PI / 2 : Math.PI / 2)); // Tangente, aufrecht
      if (typeof chars[i] === 'string') ctx.fillText(chars[i], 0, 0);
      else _teileZeichnen(ctx, [chars[i]], 0, 0);   // textAlign 'center' → mittig wie fillText
      ctx.restore();
    }
    arc += widths[i];
  }
  ctx.textAlign = 'left';
}

// Ausrichtung setzen und den X-Anker liefern — für Gravur- UND statischen Text.
function _alignAnchorX(ctx, f, x, w) {
  const align = f.textAlign || 'center';
  ctx.textAlign = align;
  return align === 'left' ? x + 1 : align === 'center' ? x + w / 2 : x + w - 1;
}

// Ragt der Text bewusst über die Feldbox hinaus (Kreis-Text, „Übersteht“, Dropdown-Text mit
// Unterlängen)? Dann wird NICHT geclippt. EINE Regel für Vorschau und Export.
function _textRagtUeber(f) {
  return f.circleDia > 0 || (f.type === 'text' && (!f.overflowMode || !!f.ddText));
}

function _drawText(ctx, f, x, y, w, h, pxPerMm) {
  const ptToPx = pt => pt * pxPerMm * 25.4 / 72; // pt → px bei dieser Auflösung (= pt · PT_MM · pxPerMm)
  if ((f.type === 'text' || f.type === 'number') && f._text) {
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = f.color || '#000';
    // _fontFamily = aus JSON geladene Schrift, fontFamily = manuell gesetzt
    const usedFont = f.type === 'number' ? 'monospace' : (_feldSchrift(f));
    // Bildzeichen (Emoji): Entscheidung gegen dieselbe Schrift wie im DXF (s. _emojiTeile)
    const _bz = _bzFeld(f, f._text);
    const _ot = _bz ? _otFeldSchrift(f, f._text) : null;
    // Auto-Fit: Text füllt die Feldhöhe, schrumpft nur für die Breite.
    // Kreis-Text: immer feste Größe (Auto-Fit ist am Bogen nicht definiert).
    const pt = _isCombo(f) ? comboFontSizePt(f)
      : f.ddText ? _ddTextPt(f, usedFont)
        : (f.autoFit === false || f.circleDia > 0) ? (f.fontSize || 10)
          : autoFitFontSizePt(f._text, usedFont, f.w, f.h, f.bold, f.type === 'number', _bz ? { font: _ot } : null);
    let fontSize = ptToPx(pt);
    ctx.font = _canvasFont(fontSize, usedFont, f.bold);
    if (f.circleDia > 0) {
      _drawCircleText(ctx, f, x + w / 2, y + h / 2, pxPerMm, f._text, fontSize, usedFont);
      return;
    }
    const tx = _alignAnchorX(ctx, f, x, w);
    // Oben-bündig. Auto-Fit (feste Höhe): die tatsächliche Tinten-Oberkante der ersten
    // Zeile sitzt an der Feldoberkante (y), der Block füllt exakt f.h — identisch zum
    // DXF-Export. Manuell: Cap-Oberkante ("H") an der Feldoberkante (wie im DXF-Fallback).
    // Mehrzeilige Gravuren ("\n") Zeile für Zeile — fillText rendert "\n" nicht selbst.
    const _lines = _textLines(f._text);
    const _teile = _bz ? _lines.map(l => _emojiTeile(l, _ot)) : null;
    // Kombi-Feld verankert wie „feste Größe": Cap-Oberkante ("H") oben, feste Zeilenhöhe.
    const _isAuto = f.autoFit !== false && !_isCombo(f);
    // Breitenlimit (f.overflowMode): identische Logik wie der DXF-Export
    // (_overflowFactors). Nur Gravur-Text — Nummern-Felder haben ihr eigenes
    // uniformes Limit (fitWidth in autoFitFontSizePt).
    let _sx = 1, _dy = 0;
    if ((_isAuto || _isCombo(f) || f.ddText) && f.type === 'text' && (f.overflowMode === 'stauch' || f.overflowMode === 'hybrid')) {
      const widest = Math.max(1, ..._lines.map((l, i) => _teile ? _teileBreite(ctx, _teile[i]) : ctx.measureText(l).width));
      // Kombi: Hybrid wie Stauchen (siehe DXF-Export) — gleiche Größe für alle Bestellungen
      const fac = _overflowFactors(_isCombo(f) ? 'stauch' : f.overflowMode, widest, w * 0.99);
      _sx = fac.sx;
      if (fac.k < 1) {
        fontSize *= fac.k;
        ctx.font = _canvasFont(fontSize, usedFont, f.bold);
        // Hybrid verkleinert den Block (Höhe = k·Feldhöhe) → mittig im Feld
        // zentrieren statt oben kleben (sonst Lücke nur unten). Wie im DXF-Export.
        _dy = h * (1 - fac.k) / 2;
      }
    }
    // Kombi mit „einzelne Zeile mittig": Teil-Block nach unten schieben (gleiche Rechnung
    // wie im DXF-Export → Bildschirm = Laser).
    if (_isCombo(f)) _dy += comboCenterShiftMM(f, _lines.length, fontSize / pxPerMm) * pxPerMm;
    const _erste = Math.max(0, _lines.findIndex(l => l.trim()));
    const capAsc = _isAuto
      ? ((_teile ? _teileTinte(ctx, _teile[_erste] || [{ s: '' }]).asc
        : ctx.measureText(_lines.find(l => l.trim()) || _lines[0] || '').actualBoundingBoxAscent) || (fontSize * 0.7))
      : _capPx(ctx, fontSize);
    let ly = y + _dy + capAsc;
    // Stauchung horizontal um den Ausrichtungs-Anker (tx) — mittig gestauchter Text
    // bleibt mittig, links-/rechtsbündiger an seiner Kante.
    if (_sx < 1) { ctx.save(); ctx.translate(tx, 0); ctx.scale(_sx, 1); ctx.translate(-tx, 0); }
    _lines.forEach((line, i) => {
      if (_teile) _teileZeichnen(ctx, _teile[i], tx, ly); else ctx.fillText(line, tx, ly);
      ly += _isCombo(f) ? _comboLineAdvMM(f, fontSize / pxPerMm) * pxPerMm : fontSize * LINE_SPACING;
    });
    if (_sx < 1) ctx.restore();
    ctx.textAlign = 'left';
  } else if (f.type === 'static' && f.staticText) {
    // Statischer Text — immer sichtbar (Vorschau + Export), nie von Bestellungen überschrieben
    const fontSize = ptToPx(f.fontSize || 10);
    ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = f.color || '#111';
    const usedFont = _feldSchrift(f);
    ctx.font = _canvasFont(fontSize, usedFont, f.bold);
    if (f.circleDia > 0) {
      _drawCircleText(ctx, f, x + w / 2, y + h / 2, pxPerMm, f.staticText, fontSize, usedFont);
      return;
    }
    const tx = _alignAnchorX(ctx, f, x, w);
    // Zeilenumbruch — ZWEI Stufen, in dieser Reihenfolge:
    //  1. explizite Umbrüche des Nutzers (die Eingabe ist eine mehrzeilige Textarea)
    //  2. zusätzlicher Umbruch am Feldrand
    // Beide über _wrapTextLines — dieselbe Funktion nutzt der DXF-Export (_buildDXFEntities), damit
    // Gravur und Vorschau gleich umbrechen (fillText selbst zeichnet keine Zeilenumbrüche).
    const _wrapped = _wrapTextLines(_textLines(f.staticText),
      w - STATIC_WRAP_INSET_MM * pxPerMm, s => ctx.measureText(s).width);
    // Grundlinie = Feldoberkante + Versalhöhe, DIESELBE Verankerung wie der DXF-Export
    // (_buildDXFEntities: yBase = fieldTop − capMM) — eine Pauschale wie `fontSize * 0.85` setzte
    // statischen Text in Vorschau/PDF/PNG tiefer als im DXF.
    let ly = y + _capPx(ctx, fontSize);
    for (const line of _wrapped) {
      if (line.trim()) ctx.fillText(line, tx, ly);
      ly += fontSize * LINE_SPACING; // Leerzeilen behalten ihren Platz
    }
    ctx.textAlign = 'left'; // Reset
  }
}

// Feld auf Export-Canvas zeichnen — mit Clip damit Felder nicht überlappen
// Original-Bilder (volle Amazon-Auflösung) einmal je URL laden — nur im Export-Pfad.
const _exportImgCache = {};
function _loadImageCached(url) {
  if (_exportImgCache[url]) return Promise.resolve(_exportImgCache[url]);
  return new Promise((resolve, reject) => {
    const im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = () => {
      // Gesichter heller/dunkler aus der Reklamation: nur dieses eine Kundenfoto, nur in diesem Export.
      const datei = _fokusJetzt && Object.keys(_fokusJetzt).find(n => decodeURIComponent(url).endsWith('/' + n));
      let erg = im;
      if (datei) {
        try { erg = _fokusAnwenden(im, _fokusJetzt[datei]); console.log('Reklamation: Gesichter', datei, JSON.stringify(_fokusJetzt[datei])); }
        catch (e) { console.error('Gesichter nicht anwendbar, nehme das Original:', e.message); }
      }
      _exportImgCache[url] = erg; resolve(erg);
    };
    im.onerror = reject;
    im.src = url;
  });
}

// ── Gesichter heller/dunkler (Reklamation) ───────────────────────────────────
// `fokus` in der Export-URL = { Bilddatei: { g: [[x, y, b, h], …], gesicht, rest } }: Kästen der
// Gesichtserkennung als Anteil (0…1) im Kundenfoto, dazu ein Helligkeitsfaktor für die
// Gesichter und einer für den Rest. Gebraucht, wenn die Dichte-Regelung einer hellen Fläche die
// Punkte gibt und die Gesichter im Lack untergehen. Die Hautmaske taugte dafür nicht (fand dunkle
// Gesichter nicht, hielt weiße Kleidung für Haut). Geändert wird das FOTO vor der Platzierung —
// Auto-Kontrast und Dichte-Regelung danach verteilen die Punkte dann von selbst ins Gesicht.
const _FOKUS_URL = (() => { try { return JSON.parse(URL_Q.get('fokus') || 'null') || null; } catch (_) { return null; } })();
let _fokusJetzt = _FOKUS_URL;   // je Variante umgestellt (s. runAutoExport)
function _fokusAnwenden(im, f) {
  const w = im.naturalWidth || im.width, h = im.naturalHeight || im.height;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(im, 0, 0);
  const d = x.getImageData(0, 0, w, h), px = d.data;
  const gesicht = f.gesicht ?? 1, rest = f.rest ?? 1;
  // Ellipse etwas größer als der Kasten (Haare, Kinn), weich auslaufend bis zum 1,8-Fachen.
  const E = (f.g || []).map(([gx, gy, gb, gh]) => ({
    cx: (gx + gb / 2) * w, cy: (gy + gh / 2) * h,
    rx: Math.max(1, gb * w * 0.68), ry: Math.max(1, gh * h * 0.8)
  }));
  for (let y = 0; y < h; y++) {
    for (let xx = 0; xx < w; xx++) {
      let t = 0;
      for (const e of E) {
        const dx = (xx - e.cx) / e.rx, dy = (y - e.cy) / e.ry, dd = Math.sqrt(dx * dx + dy * dy);
        const v = dd <= 1 ? 1 : dd >= 1.8 ? 0 : 1 - (dd - 1) / 0.8;
        if (v > t) t = v;
      }
      t = t * t * (3 - 2 * t);
      const fak = rest + (gesicht - rest) * t;
      if (fak === 1) continue;
      const i = (y * w + xx) * 4;
      px[i] = Math.min(255, px[i] * fak); px[i + 1] = Math.min(255, px[i + 1] * fak); px[i + 2] = Math.min(255, px[i + 2] * fak);
    }
  }
  x.putImageData(d, 0, 0);
  return c;
}

// Druckbereich einer Amazon-Platzierung samt Rückfallwerten — EINE Stelle für composePlacement
// und loadImg (Vorschau-Größe).
function _placementArea(pl) {
  return {
    x: pl.position?.x || 0, y: pl.position?.y || 0,
    w: pl.dimension?.width || 129, h: pl.dimension?.height || 229,
  };
}

// Amazon-Platzierung (Skalierung/Rotation/Clip auf Druckbereich) in eine Canvas
// beliebiger Pixelgröße rendern — die EINZIGE Stelle mit dieser Mathematik:
// Vorschau (loadImg, 12 px/Einheit) UND Export (renderFieldToCtx, volle Export-DPI)
// rufen beide hierher. Amazon-Koordinatensystem (aus der Bestell-JSON):
//   snapshot                     = 400x400-Canvas (Hintergrund)
//   placement.position/dimension = Druckbereich (oben-links + Größe) im 400x400
//   bp.position                  = Ursprung der Bild-Transformation im 400x400
//   bp.dimension / bp.scale      = Originalgröße des Bilds / Skalierungsfaktor
//   bp.angleOfRotation           = Rotation in Grad
// Ablauf: skalieren → drehen → bei bp.position platzieren → auf Druckbereich clippen.
// Korrekte Reihenfolge: translate(bpX,bpY) → rotate → drawImage(0,0).

// `fuellung` = Farbe für den ÜBERSTAND (die Fläche der Amazon-Platzierung, die das Kundenfoto nicht
// bedeckt). Sie muss UNGRAVIERT bedeuten — auf hellem Grund Weiß, auf schwarz lackiertem
// (invertiertem) Material Schwarz. Fest '#fff' gravierte den Überstand auf Feuerzeugen voll, und die
// Dichte-Regelung drückte dafür das Motiv auf 0 %.
function composePlacement(src, placement, outW, outH, fuellung) {
  const bp = placement.buyerPlacement;
  const { x: areaX, y: areaY, w: areaW, h: areaH } = _placementArea(placement);
  const scaleX = bp.scale?.scaleX || 1;
  const scaleY = bp.scale?.scaleY || 1;
  const angleRad = (bp.angleOfRotation || 0) * Math.PI / 180;
  const scaledW = (bp.dimension?.width || areaW) * scaleX;
  const scaledH = (bp.dimension?.height || areaH) * scaleY;
  const bpX = bp.position?.x || 0;
  const bpY = bp.position?.y || 0;

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(outW));
  canvas.height = Math.max(1, Math.round(outH));
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.fillStyle = fuellung || '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, canvas.width, canvas.height);
  ctx.clip();
  ctx.scale(canvas.width / areaW, canvas.height / areaH);
  ctx.translate(-areaX, -areaY);
  ctx.translate(bpX, bpY);
  ctx.rotate(angleRad);
  ctx.drawImage(src, 0, 0, scaledW, scaledH);
  ctx.restore();
  return canvas;
}

// opts.useOriginal = für den Laser-Export: immer aus dem Originalbild rendern und ein
// evtl. per „Dithering anwenden" in f._img eingebranntes Vorschau-Ergebnis ignorieren.
// Ohne das würde die Laser-Pipeline ein bereits gedithertes Bild erneut dithern.
async function renderFieldToCtx(ctx, f, scale, opts) {
  // Statisches Feld, das vom Export ausgeschlossen wurde → im Export nicht zeichnen
  if (f.type === 'static' && f.exportEnabled === false) return;
  const x = f.x * scale, y = f.y * scale, w = f.w * scale, h = f.h * scale;
  ctx.save();
  // Drehung um die Feldmitte (identisch zu Vorschau/DXF)
  if (f.rotation) {
    ctx.translate(x + w / 2, y + h / 2); ctx.rotate(f.rotation * Math.PI / 180); ctx.translate(-(x + w / 2), -(y + h / 2));
  }
  // Kreis-Text UND „Übersteht"-Modus (overflowMode leer) ragen bewusst über die Feldbox
  // hinaus → nicht clippen (Export identisch zu Vorschau/DXF, kein abgeschnittener Überstand).
  if (!_textRagtUeber(f)) { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); }
  if (f.type === 'image') {
    // Platzierung direkt aus dem Original bei Export-Auflösung rendern statt das
    // ~305-DPI-Vorschaubild hochzuskalieren. Bei angewandtem Dithering gilt f._img.
    const useOriginal = !!(opts && opts.useOriginal);
    const dithered = !useOriginal && !!_originalImgs[f.id];
    // Beim Laser-Export ist das ungeditherte Original die Quelle — sonst das, was das
    // Feld gerade zeigt (inkl. eingebrannter Dither-Vorschau).
    const preview = useOriginal ? (_originalImgs[f.id] || f._img) : f._img;
    if (f._imgSrc && f._placement && !dithered) {
      try {
        const src = await _loadImageCached(f._imgSrc);
        // Nur im Laser-Pfad (useOriginal) zählt die Material-Polarität; die
        // Bildschirm-/PDF-Vorschau zeigt den Überstand weiter weiß.
        // opts.invert = Polarität der Einstellungen, mit denen gerastert wird (nicht die des Editors).
        const randFarbe = (opts && opts.useOriginal
          && (opts.invert ?? ditherSettings.invert)) ? '#000' : '#fff';
        const composed = composePlacement(src, f._placement, w, h, randFarbe);
        ctx.drawImage(composed, x, y, w, h);
      } catch (e) {
        // Der Rückfall zeichnet das Bild OHNE Amazons Platzierung (Zuschnitt/Skalierung/
        // Drehung) — der Ausschnitt weicht dann von dem ab, was der Kunde bestellt hat.
        // Das ist eine falsche Gravur, kein bloßer Darstellungsfehler, und darf deshalb
        // nicht stumm passieren: der Auto-Export läuft unbeaufsichtigt in headless
        // Chromium, und scheduler.js hebt console.error von dort ins Server-Log.
        console.error(`Platzierung für Feld ${f.id} (Bestellung ${f.orderId || '?'}) nicht anwendbar — `
          + `Bild wird OHNE Amazon-Zuschnitt gezeichnet: ${e && e.message ? e.message : e}`);
        showToast(`⚠️ Bildausschnitt für ${f.orderId || 'Feld ' + f.id} konnte nicht angewandt werden — bitte prüfen!`, 6000);
        if (preview) ctx.drawImage(preview, x, y, w, h);
      }
    } else if (preview) {
      ctx.drawImage(preview, x, y, w, h);
    }
  } else {
    // Export: Emoji-Schriften und die Feldschrift MÜSSEN da sein — sonst entschiede _drawText ohne sie
    if (_bzFeld(f, f._text)) {
      await _emojiLaden();
      const ot = await _otFeldSchriftLaden(f, f._text);
      _emojiHinweise(f, _textLines(f._text).flatMap(l => _emojiTeile(l, ot)));
    }
    _drawText(ctx, f, x, y, w, h, scale); // scale = Pixel pro mm im Export
  }
  ctx.restore();
}

// Auflösung der Raster-Exporte (Druck-PDF, PNG, Sublimation). 300 = physisch scharf,
// wirkt beim Reinzoomen aber pixelig, weil jedes Bild auf physische-Größe×DPI begrenzt
// ist. 450 DPI = 50% mehr Pixel pro Bild → deutlich schärfer beim Zoomen, moderat mehr
// Speicher/Dateigröße. Zum Tunen nur diesen Wert ändern (Laser/BMP/DXF unberührt).
const EXPORT_DPI = 450;
// Sublimation ist fest auf 300 DPI genormt — Dateiname/Toast sagen „300dpi“, der Canvas MUSS dazu
// passen (ein RIP, der nach der behaupteten DPI skaliert, druckte sonst zu groß). Gilt für manuellen
// UND Auto-Export (_buildSublimationCanvas).
const SUBLIMATION_DPI = 300;

async function buildExportCanvas(dpi) {
  // Warten bis alle Fonts geladen sind
  await document.fonts.ready;
  const p = getPg();
  const scale = dpi / 25.4;
  const { c, ctx } = _makeCanvas(p, scale);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, c.width, c.height);
  for (const f of fields) await renderFieldToCtx(ctx, f, scale);
  return c;
}

// Druck-PDF-Einstellungen an EINER Stelle — Auto-Export und manueller Export identisch:
// hohe Auflösung + Farb-Boost + JPEG 0.95 (visuell verlustfrei, aber klein).
const _PDF_PRINT = { dpi: EXPORT_DPI, boost: true, q: 0.95 };

// Rendert die aktuelle Seite (fields) als JPEG-DataURL fürs PDF und gibt das Canvas
// sofort frei. Gemeinsame Quelle für ALLE PDF-Pfade (Auto-Export, generateExportBlob, _exportPDF).
async function _pdfPageJpeg(dpi, boost, q) {
  let c = await buildExportCanvas(dpi);
  if (boost) { const bst = _boostPrintColors(c); if (bst !== c) { c.width = c.height = 0; c = bst; } }
  const url = c.toDataURL('image/jpeg', q);
  c.width = c.height = 0; // Speicher sofort freigeben
  return url;
}

// ── Farb-Boost für Druck-PDFs ──────────────────────────────────────────────────
// Sublimation wirkt vor dem Pressen oft etwas flau/grau. Dieser Filter hebt
// Sättigung und Kontrast leicht an, damit der Druck kräftiger/farbiger wird.
// Weiß bleibt rein weiß (Sättigung wirkt nicht auf Grautöne, Kontrast lässt 255=255)
// — kritisch für Sublimation. Zum Tunen nur diese Werte ändern:
//   saturate>1 = sattere Farben · contrast>1 = mehr Tiefe · 'none' = aus.
const PRINT_COLOR_BOOST = 'saturate(1.3) contrast(1.08)';

// Gibt einen NEUEN Canvas mit angewandtem Farb-Boost zurück (Original unberührt).
function _boostPrintColors(src) {
  if (PRINT_COLOR_BOOST === 'none') return src;
  const out = document.createElement('canvas');
  out.width = src.width;
  out.height = src.height;
  const ctx = out.getContext('2d');
  ctx.filter = PRINT_COLOR_BOOST;
  ctx.drawImage(src, 0, 0);
  return out;
}

// Vollblatt-Rahmen für Raster-Exporte (PNG/JPG): dünne schwarze Linie genau am Blattrand.
// Anders als bei DXF ist das hier SICHTBAR (Bild ohne Ebenen) — dient als Schnitt-/Ausricht-Hilfe.
function _drawSheetFrameOnCanvas(c) {
  const ctx = c.getContext('2d');
  const lw = Math.max(1, Math.round(c.width / 800)); // dünn, auflösungsabhängig (~0.3mm bei 300 DPI)
  ctx.save();
  ctx.strokeStyle = '#000';
  ctx.lineWidth = lw;
  // halbe Linienbreite nach innen, damit die Linie vollständig im Bild liegt (nicht abgeschnitten)
  ctx.strokeRect(lw / 2, lw / 2, c.width - lw, c.height - lw);
  ctx.restore();
}

async function loadJsPDF() {
  if (!window.jspdf) await _skriptLaden('vendor/jspdf.umd.min.js');
  return window.jspdf.jsPDF;
}

// Hoch-/Querformat + neues jsPDF-Dokument — EIN Bauplan für alle drei PDF-Pfade
// (Auto-Export-Gruppen, generateExportBlob, _exportPDF).
const _pageOrient = p => p.w > p.h ? 'landscape' : 'portrait';
async function _newPdfDoc(p) {
  const jsPDF = await loadJsPDF();
  return new jsPDF({ orientation: _pageOrient(p), unit: 'mm', format: [p.w, p.h] });
}

// ── Auto-Export (nach dem Cron-Download) ─────────────────────────────────────
// Befüllt alle Layouts mit autoExport=true und exportiert sie seitenweise.

// Hat eine Seite tatsächlich Gravur-Inhalt? Reine Platzhalter (leerer Text oder nur
// Striche „—/–/-") und statische Felder zählen NICHT als Inhalt. Verhindert leere
// Export-Dateien (z.B. Synchron-Rückseiten ohne Text 2).
function _pageHasRealContent(pageFields) {
  return pageFields.some(f => {
    if (f.type === 'static') return false;
    if (f.type === 'image') return !!(f._img || f._imgSrc || f.orderId);
    // text / number
    const t = (f._text == null) ? '' : String(f._text).replace(/[\s—–-]/g, '');
    return t.length > 0;
  });
}

// ── ▶ Füllen + Export: manueller Lauf mit der Export-Maschinerie des Nachtlaufs ──
// Unterschiede zum Nachtlauf: nutzt den EINGESTELLTEN Zeitraum aus _fillCfg (kein
// Session-Pin), exportiert nur das geladene Layout und schreibt KEINE status.txt (die
// gehört dem Nachtlauf).
async function fillAndExportManual() {
  if (!_loadedLayout) { showToast('Zuerst ein Layout laden (Liste oben, ↩) — Formate/Aufteilung kommen aus dem Layout'); return; }
  const layout = _loadedLayout;
  const btn = document.getElementById('fill-export-btn');
  if (btn) { btn.disabled = true; btn.textContent = '⏳ Füllen + Export…'; }
  try {
    // 1) FÜLLEN — exakt derselbe Pfad wie „▶ Füllen" (fillAllPagesAuto), damit sich
    //    beide Knöpfe identisch verhalten.
    window._autoExportSortOrder = layout.exportOrder || 'date-desc';
    await fillAllPagesAuto();
    window._autoExportSortOrder = null;
    const result = window._lastFillResult;
    if (!result || !result.filledOrderIds.length) {
      // fillAllPagesAuto hat bei 0 Treffern bereits einen Hinweis-Toast gezeigt
      return;
    }

    // 2) EXPORTIEREN — dieselbe Maschinerie wie der Nachtlauf (_exportFilledPages).
    //    freeImages=false → Editor-Vorschau bleibt nach dem Export heil.
    const formats = _formate(layout);
    // BERLINER Tag (s. _dayBerlin). Mit dem Tag des BROWSERS landet die Gravurdatei in
    // einem anderen Ordner als die Kundendaten, die der Server unter berlinDayBefore ablegt.
    const today = _dayBerlin();
    _laufNamen = { namen: new Set(), nr: {}, vorlagen: {} };
    _nichtUeberschreiben = !!String(layout.dateiname || '').trim();
    let results;
    try {
      results = await _exportFilledPages(layout, result, formats, today, 'Manuell-Export:', false);
    } finally {
      _nichtUeberschreiben = false;
    }

    const ok = results.filter(r => r.ok);
    const bad = results.filter(r => !r.ok);
    const ziel = `exports/${today}${layout.group ? '/' + layout.group : ''}`;
    if (bad.length) {
      // Fehler NICHT verschlucken: nur Erfolge zu zählen lässt einen fehlgeschlagenen
      // Upload wie einen kleineren Lauf aussehen.
      showToast(`⚠️ ${ok.length} Datei(en) → ${ziel}, aber ${bad.length} fehlgeschlagen: ${bad[0].error}`, 9000);
    } else {
      showToast(ok.length
        ? `✅ ${ok.length} Datei(en) exportiert → ${ziel}`
        : '⚠️ Keine Dateien erzeugt — enthalten die Seiten Gravur-Inhalt?', 6000);
    }
  } catch (e) {
    console.error('Manuell-Export Fehler:', e);
    showToast('❌ Füllen + Export fehlgeschlagen: ' + e.message, 6000);
  } finally {
    window._autoExportSortOrder = null;
    if (btn) { btn.disabled = false; btn.textContent = 'Füllen + Export'; }
    // Original-Bilder in voller Amazon-Auflösung freigeben — die mit Abstand größten
    // Objekte im Speicher. Der JSON-Cache bleibt (wenige KB, spart Neuabrufe).
    for (const k in _exportImgCache) delete _exportImgCache[k];
    renderEls(); drawCanvas(); renderFieldList();
  }
}

// ── Gemeinsamer Export-Kern: gefüllte Seiten → Dateien im Export-Ordner ─────────
// Von runAutoExport (Nachtlauf) UND fillAndExportManual genutzt. Formate/Aufteilung
// kommen aus dem Layout. Dateinamen: <Layout>_<Bestellnr7>_Seite<1/2> — kein Datum, das
// steht im Tages-Ordner. Rückgabe: [{ layout, file, ok, count }]
async function _exportFilledPages(layout, result, formats, today, logPrefix = 'Auto-Export:', freeImages = true) {
  const results = [];
  // Die Schleife setzt das globale `fields` pro Seite um. WIEDERHERSTELLEN ist Pflicht:
  // sonst bleibt `fields` auf der zuletzt exportierten Seite stehen, während _currentPage
  // unverändert ist — der nächste saveCurrentPageSnapshot() schriebe Seite N in
  // _pages[_currentPage]. Gleiches Muster wie _forEachExportPage.
  const _fieldsBeforeExport = fields;
  const muster = String(layout.dateiname || '').trim();
  const _ordnerKey = (layout.group || '') + '/';
  const _nrStart = _laufNamen.nr[_ordnerKey + muster] || 0;   // fortlaufend je Ordner
  let _nrMax = _nrStart;
  try {
    // splitSatz = Datei pro Überlauf-Durchgang, splitSeite = Layout-Seiten getrennt.
    // Nicht gesetzt = jede Seite eine eigene Datei. (Das Alt-Feld exportPages zählte nur
    // bei reinen PDF-Layouts ohne diese Schalter — davon gibt es keins mehr.)
    const basePages = (result.mode === 'synchron') ? (layout.pages?.length || 1) : 1;
    const splitSatz = layout.splitSatz ?? true;
    const splitSeite = layout.splitSeite ?? true;
    // ── Ezcad-Vorlage ('vorlage'/'beides') ──
    // In den Arbeitsordner _Vorlage/<Ordner>/ kommt NUR Satz 1: die .ezd kennt genau diesen
    // einen Pfad. Weitere Sätze (mehr Bestellungen als Plätze) liegen nur im Tagesarchiv
    // und werden per lade-diesen-tag.bat hineingeladen (einen „… Satz2"-Ordner unter _Vorlage/
    // läse keine .ezd).
    // Reklamation: gar nichts in den Arbeitsordner, der gehört der Tagesproduktion; ein
    // einzelner Nachdruck hätte die noch nicht gravierten zwölf Plätze überschrieben. Der
    // Satz landet samt .bat im Reklamations-Ordner.
    const vorlageModus = _istVorlageLayout(layout);
    const saetze = Math.ceil(result.pages.length / basePages);
    const vorlageOrdner = _vorlageName(layout);
    // Zwei Layouts mit demselben Vorlagen-Ordner überschrieben sich gegenseitig — das zweite schreibt
    // dann nichts in den Arbeitsordner, meldet einen Fehler und archiviert unter seinem EIGENEN Namen.
    // AUSNAHME: schreiben sie in verschiedenen FORMATEN, kollidieren die Dateien nicht (platzN.bmp gegen
    // gravurN.dxf) — genau dafür gibt es F02_xxx_V5 (Fotos) und F02_xxx_V5_Text (Deckeltexte).
    // belegung.txt schreiben beide — es gewinnt das zuletzt gelaufene; deshalb steht das Foto-Layout im
    // Export voran.
    let vorlageKonflikt = false;
    if (vorlageModus && !_reklaOrderId) {
      const belegt = _laufNamen.vorlagen[vorlageOrdner];
      const meineFormate = _formate(layout);
      const ueberschneidung = belegt && belegt.name !== layout.name
        && meineFormate.some(f => belegt.formate.includes(f));
      if (ueberschneidung) {
        vorlageKonflikt = true;
        results.push({
          layout: layout.name, ok: false,
          error: `Vorlagen-Ordner „${vorlageOrdner}" wird schon von ${belegt.name} im selben Format beschrieben — Ordnername im Layout ändern`
        });
      } else if (belegt && belegt.name !== layout.name) {
        belegt.formate = belegt.formate.concat(meineFormate);   // Ordner geteilt, Formate getrennt
      } else {
        _laufNamen.vorlagen[vorlageOrdner] = { name: layout.name, formate: meineFormate };
      }
    }
    const arbeitsordner = satzIdx => (satzIdx === 0 && !_reklaOrderId && !vorlageKonflikt) ? vorlageOrdner : null;
    // Tagesarchiv direkt im Gruppenordner: <Tag>/<Gruppe>/<Ordner>/ (bis 14.09.2026 mit
    // Zwischenebene „Vorlage/" — auf Wunsch weg, sie wurde mit dem Arbeitsordner verwechselt).
    const archivOrdner = satzIdx => (vorlageKonflikt ? layout.name : vorlageOrdner)
      + (satzIdx > 0 ? ` Satz${satzIdx + 1}` : '');
    // Eine Vorlagen-Datei ins Tagesarchiv UND (falls der Satz einen hat) in den Arbeitsordner.
    // Erledigt ist sie, wenn der Arbeitsordner sie hat — ohne Arbeitsordner ist das Archiv
    // die einzige Kopie und zählt selbst. Gemeinsam für gravurN.dxf, gravur.dxf/rueckseite.dxf.
    const _vorlageHoch = async (blob, datei, arbeit, archiv, count) => {
      const okArchiv = await uploadExportToServer(blob, datei, today, layout.group, null, archiv);
      const okArbeit = arbeit ? await uploadExportToServer(blob, datei, today, layout.group, arbeit) : true;
      const wo = arbeit ? `_Vorlage/${arbeit}/${datei}` : `${archiv}/${datei}`;
      results.push((okArbeit && (arbeit || okArchiv))
        ? { layout: layout.name, file: wo, ok: true, count }
        : { layout: layout.name, file: datei, ok: false, error: `Upload von ${wo} fehlgeschlagen` });
    };
    const vorlageSeiten = new Map();   // "satz|role" → DXF-Felder dieser einen Seite
    // Dateinamen nach BESTELLUNG, nicht nach fortlaufendem Zähler. `orderTag` = letzte 7 Ziffern der
    // Bestellnr (bei genau 1 Bestellung auf der Seite) bzw. „Satz<n>“ bei Mehrfach-Slot-Seiten.
    // `role` = 0→Seite1 (Vorne), 1→Seite2 — so gehören _1189127_Seite1 und _1189127_Seite2 zusammen.
    // `einzelBestellung` trennt echte Bestellnummer von „Satz<n>“: auf einem Array-Blech (M10–M250) liegt
    // EINE Bestellung und gehört in den Namen, auf einem M1-Blech liegen 20.
    // Einseitiges Layout + eine Bestellung je Blatt (B01–B04, FL M10 ff.): KEIN „_Seite1“ — die Bestellnr
    // macht den Namen eindeutig; mehrere Blätter derselben Bestellung bekommen von _uniq _2, _3 ….
    // „_Seite“ heißt nur Vorder-/Rückseite (role); zählt die Nummer Bleche, steht „_Blatt“ (S01, FL M1 —
    // Blatt2 ≠ Rückseite).
    const einseitig = (layout.pages?.length || 1) === 1;
    const _fileGroup = (i, orderTag, einzelBestellung) => {
      const satz = Math.floor(i / basePages), role = i % basePages;
      const sS = splitSatz, sR = splitSeite && basePages > 1;
      // satz/role/sR reisen mit: das Namensmuster und die Vorlage-DXF brauchen sie.
      const g = { satz, role, sR };
      if (sS && sR) return { ...g, key: 'p' + i, suffix: '_' + orderTag + '_Seite' + (role + 1) };
      if (sS) return {
        ...g, key: 'satz' + satz,
        suffix: einzelBestellung
          ? '_' + orderTag + (einseitig ? '' : '_Blatt' + (satz + 1))
          : '_Blatt' + (satz + 1)
      };
      if (sR) return { ...g, key: 'role' + role, suffix: '_Seite' + (role + 1) };
      return { ...g, key: 'all', suffix: '' };
    };
    // Dateiname nach Muster aus den Layout-Einstellungen (`layout.dateiname`), z. B.
    // „{bestellnr}_Bild{nr}". Leer = bisheriger Name <Layout><suffix>. Was zur
    // Unterscheidung fehlt, wird angehängt: _Seite2 bei getrennten Seiten, _Platz3 bei
    // Einzelbildern — sonst entstünden gleichnamige Dateien und _uniq hängte _2 an.
    const _stamm = (grp, orderIds, legacySfx, platz) => {
      if (!muster) return layout.name + legacySfx + (platz ? '_Platz' + platz : '');
      const eine = orderIds.length === 1;
      const nr = _nrStart + grp.satz + 1;
      _nrMax = Math.max(_nrMax, nr);
      const w = {
        layout: layout.name, datum: today, nr, seite: grp.role + 1,
        bestellnr: eine ? String(orderIds[0]) : 'Satz' + (grp.satz + 1),
        kurznr: eine ? String(orderIds[0]).slice(-7) : 'Satz' + (grp.satz + 1),
        platz: platz || nr
      };   // Blatt-Datei ohne Platz: {platz} = {nr}
      let s = muster.replace(/\{(\w+)\}/g, (m, k) => (k in w ? String(w[k]) : m));
      if (grp.sR && !/\{seite\}/.test(muster)) s += '_Seite' + w.seite;
      if (platz && !/\{platz\}/.test(muster)) s += '_Platz' + platz;
      // Windows-verbotene Zeichen raus — die Dateien werden über die Samba-Freigabe gelesen.
      return s.replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_').trim() || layout.name;
    };
    // Kollisions-Schutz: dieselbe Bestellnr+Seite kann mehrfach auftreten (Menge > 1 =
    // mehrere Sätze). Doppelte Dateinamen bekommen _2, _3 … vor der Endung.
    // Gilt für den ganzen Lauf (_laufNamen), nicht nur dieses Layout — s. dort.
    const _belegt = n => _laufNamen.namen.has(_ordnerKey + n);
    const _uniq = (fn) => {
      if (!_belegt(fn)) { _laufNamen.namen.add(_ordnerKey + fn); return fn; }
      const dot = fn.lastIndexOf('.'); const base = dot >= 0 ? fn.slice(0, dot) : fn, ext = dot >= 0 ? fn.slice(dot) : '';
      let k = 2, n; do { n = base + '_' + (k++) + ext; } while (_belegt(n));
      _laufNamen.namen.add(_ordnerKey + n); return n;
    };
    // Pro Gruppe wird EINE Datei gebaut. PDF/DXF können mehrere Seiten bündeln, Raster nicht.
    const pdfGroups = {}; // "fmt|key" → { doc, count, suffix, orders:Set }
    const dxfGroups = {}; // key → { pages:[fieldsArrays], suffix, orders:Set }

    // Pro gefüllter Seite: rendern + exportieren
    for (let i = 0; i < result.pages.length; i++) {
      const page = i + 1;
      const pageFields = result.pages[i];

      // Komplett leere Seiten überspringen — sonst entsteht ein leeres DXF, das als
      // Erfolg gemeldet wird (z.B. Synchron-Rückseite ohne 2. Gravurtext).
      if (!_pageHasRealContent(pageFields)) {
        console.warn(logPrefix, layout.name, `— Seite ${page} ohne Gravur-Inhalt, übersprungen`);
        continue;
      }

      // Felder global setzen, damit buildExportCanvas + generateExportBlob die Seite sehen
      fields = pageFields.map(f => ({ ...f }));
      // Die Editor-Vorschau ist NUR für den Menschen davor: headless baut renderEls()
      // das Overlay per innerHTML neu und dekodiert alle dataURL mit — Rechenzeit und
      // Speicher für ein Bild, das niemand sieht. Der Export liest nur `fields`.
      if (!IS_AUTOEXPORT) scheduleRender();
      // Pause statt Warten auf scheduleRender: dessen rAF feuert in einer unsichtbaren
      // headless-Seite nicht zuverlässig. Die vorige Seite hat gerade ihre Bilder
      // freigegeben (f._img = null unten) — der Sammler braucht einen Makrotask-Wechsel.
      await _atempause();

      const orderIdsOnPage = [...new Set(pageFields.filter(f => f.orderId).map(f => f.orderId))];
      // Namens-Tag: genau 1 Bestellung → letzte 7 Ziffern; sonst Satz-Index.
      // String() defensiv — ein Nicht-String würde bei .slice den Export crashen.
      const orderTag = orderIdsOnPage.length === 1
        ? String(orderIdsOnPage[0]).slice(-7)
        : ('Satz' + (Math.floor(i / basePages) + 1));
      const grp = _fileGroup(i, orderTag, orderIdsOnPage.length === 1);

      // Vektor-Halbton VOR der Format-Schleife: im DXF-Zweig ist f._img nur noch ein
      // Marker (das Bild wird zur Speicherentlastung freigegeben), die Pixel gibt es
      // also nur hier.
      if (layout.fotoVektor && formats.includes('dxf')) {
        const bilder = pageFields.filter(f => f.type === 'image' && f._img)
          .sort(_nachPosition);
        const alle = _bildPlaetze(pageFields);
        for (const f of bilder) {
          f._platz = alle.indexOf(f) + 1;
          f._halbton = await _fotoHalbton(f, _laserSettings(layout.ditherSettings));
        }
      }

      for (const fmt of formats) {
        if (fmt === 'pdf' || fmt === 'pdf-std') {
          // PDF: Seite ins passende Gruppen-Dokument schreiben (inkrementell, speicherschonend)
          const std = fmt === 'pdf-std';
          const url = await _pdfPageJpeg(std ? 96 : _PDF_PRINT.dpi, !std && _PDF_PRINT.boost, std ? 0.92 : _PDF_PRINT.q);
          const p = getPg();
          const gk = fmt + '|' + grp.key;
          let g = pdfGroups[gk];
          if (!g) g = pdfGroups[gk] = {
            doc: await _newPdfDoc(p), count: 0, suffix: grp.suffix, orders: new Set(),
            grp, ids: orderIdsOnPage
          };
          else g.doc.addPage([p.w, p.h], _pageOrient(p));
          g.doc.addImage(url, 'JPEG', 0, 0, p.w, p.h);
          g.count++; orderIdsOnPage.forEach(o => g.orders.add(o));
        } else if (fmt === 'dxf') {
          // DXF: Felder der Seite sammeln (Bild wird gleich freigegeben → truthy Marker fürs Kästchen)
          const dxfFelder = pageFields.filter(f => _hasVecText(f) || f._img || (_istMotiv(f) && _motivAktiv(f, pageFields))).map(f => ({ ...f, _img: f._img ? true : null }));
          // Vorlage: jede Seite EINZELN merken (gravur.dxf / rueckseite.dxf je Satz),
          // unabhängig davon, wie die Tagesordner-Dateien gebündelt werden.
          if (vorlageModus) vorlageSeiten.set(grp.satz + '|' + grp.role, dxfFelder);
          if (layout.bmpModus !== 'vorlage') {   // 'vorlage' = keine DXF im Tagesordner
            let g = dxfGroups[grp.key];
            if (!g) g = dxfGroups[grp.key] = { pages: [], suffix: grp.suffix, orders: new Set(), grp, ids: orderIdsOnPage };
            g.pages.push(dxfFelder);
            orderIdsOnPage.forEach(o => g.orders.add(o));
          }
        } else {
          // Raster (png/bmp/sublimation): pro Seite eine Datei (nicht kombinierbar)
          const ext = fmt === 'sublimation' ? 'png' : fmt;
          const variantTag = (fmt === 'sublimation') ? '_sublimation' : '';
          const sfx = grp.suffix || (result.pages.length > 1 ? ('_Blatt' + page) : '');
          try {
            // 'blech' = eine Datei fürs ganze Blech (Standard), 'platz' = eine Datei je
            // Foto plus Platzierungsliste, 'vorlage' = feste Dateinamen unter
            // exports/_Vorlage/ für eine Ezcad-Vorlage mit „Dynamic file", 'beides'.
            const bmpModus = fmt === 'bmp' ? (layout.bmpModus || 'blech') : 'blech';
            const pngVorlage = fmt === 'png' && vorlageModus;
            let teile;
            if (bmpModus === 'vorlage' || bmpModus === 'beides') {
              const slots = await _bmpVorlageDateien(layout.ditherSettings);
              // Nur Satz 1 geht in den Arbeitsordner (s. arbeitsordner oben), jeder Satz ins Archiv.
              const satzIdx = Math.floor(i / basePages);
              const ordner = arbeitsordner(satzIdx);            // null = nur Archiv
              const proPlatz = {};
              _bildPlaetze(fields)
                .forEach((f, k) => { if (f.orderId) proPlatz[k + 1] = f.orderId; });
              for (const t of (ordner ? slots : [])) {
                const name = `platz${t.platz}.bmp`;
                if (await uploadExportToServer(t.blob, name, today, layout.group, ordner)) {
                  results.push({
                    layout: layout.name, file: `_Vorlage/${ordner}/${name}`, ok: true,
                    count: orderIdsOnPage.length
                  });
                } else {
                  results.push({
                    layout: layout.name, file: name, ok: false,
                    error: `Upload von _Vorlage/${ordner}/${name} fehlgeschlagen`
                  });
                }
              }
              // belegung.txt NICHT in den Arbeitsordner (dort nur, was Ezcad liest); sie liegt im Tagesarchiv.
              // ── Tages-Archiv, direkt wieder ladbar ──────────────────────
              // Dieselben Dateien noch einmal in den TAGESORDNER unter <Gruppe>/<Ordner>/. Die .ezd kann dorthin
              // nicht zeigen (absolute Pfade, der Tagesordner heißt jeden Tag anders) — deshalb wandern die Bilder:
              // lade-diesen-tag.bat kopiert den Satz aus SEINEM eigenen Ordner (%~dp0) in den festen Arbeitsordner.
              // Jeder vergangene Tag lässt sich so per Doppelklick wieder fahren.
              // Je SATZ ein eigener Archivordner; die .bat zielt trotzdem auf den Hauptordner (die .ezd kennt nur
              // den einen Pfad).
              const tagesUnter = archivOrdner(satzIdx);
              for (const t of slots) {
                const ok = await uploadExportToServer(t.blob, `platz${t.platz}.bmp`, today,
                  layout.group, null, tagesUnter);
                // Ohne Arbeitsordner (Satz 2+, Reklamation) ist das Archiv die EINZIGE Kopie —
                // dann gehört ein Fehlschlag in die Bilanz.
                if (!ordner) results.push(ok
                  ? { layout: layout.name, file: `${tagesUnter}/platz${t.platz}.bmp`, ok: true, count: orderIdsOnPage.length }
                  : {
                    layout: layout.name, file: `platz${t.platz}.bmp`, ok: false,
                    error: `Upload von ${tagesUnter}/platz${t.platz}.bmp fehlgeschlagen`
                  });
              }
              // Deckeltexte nur auf der Seite mit den Fotos. Die Rückseite hat keine Bildfelder
              // (slots leer) — sonst überschrieben ihre Texte die gravurN-Dateien. Je Platz als
              // DXF (gravurN.dxf, Nutzerwunsch Vektor). Bei F02_*_V5 stehen die Deckel in einem
              // eigenen …_Text-Layout; dessen gravurN.dxf entstehen weiter unten.
              const deckelTeile = [];
              if (slots.length) {
                let n = 0;
                for (const f of _deckelTextFelder()) deckelTeile.push({ name: `gravur${++n}.dxf`, blob: await _gravurSlotDxf(f, layout) });
              }
              for (const t of deckelTeile) await _vorlageHoch(t.blob, t.name, ordner, tagesUnter, orderIdsOnPage.length);
              if (slots.length) {
                await uploadExportToServer(
                  _bmpBelegungsListe(slots, layout.name, proPlatz), 'belegung.txt',
                  today, layout.group, null, tagesUnter);
                await uploadExportToServer(_ladeTagBat(vorlageOrdner), 'lade-diesen-tag.bat',
                  today, layout.group, null, tagesUnter);
              }
              teile = [];
              // 'beides': zusätzlich die Tagesproduktion in zwei Unterordner —
              // Einzeln/ (ein BMP je Feuerzeug) und Gesamt/ (ein BMP fürs Blech).
              // Solange in Ezcad noch Platz für Platz gearbeitet wird, braucht es beides.
              if (bmpModus === 'beides') {
                const belegt = slots.filter(t => t.belegt);
                for (const t of belegt) {
                  const nm = _uniq(_stamm(grp, orderIdsOnPage, sfx, t.platz) + '.bmp');
                  t.datei = nm;
                  if (!await uploadExportToServer(t.blob, nm, today, layout.group, null, 'Einzeln'))
                    results.push({ layout: layout.name, file: nm, ok: false, error: `Upload von Einzeln/${nm} fehlgeschlagen` });
                  else results.push({ layout: layout.name, file: `Einzeln/${nm}`, ok: true, count: orderIdsOnPage.length });
                }
                if (belegt.length) await uploadExportToServer(
                  _bmpPlatzierungsListe(belegt, layout.name, sfx, t => t.datei),
                  _uniq(_stamm(grp, orderIdsOnPage, sfx) + '_Platzierung.txt'), today, layout.group, null, 'Einzeln');
                const blech = await generateExportBlob('bmp', _dxfOpts(layout), layout.ditherSettings);
                if (blech) {
                  const nm = _uniq(_stamm(grp, orderIdsOnPage, sfx) + '.bmp');
                  if (!await uploadExportToServer(blech, nm, today, layout.group, null, 'Gesamt'))
                    results.push({ layout: layout.name, file: nm, ok: false, error: `Upload von Gesamt/${nm} fehlgeschlagen` });
                  else results.push({ layout: layout.name, file: `Gesamt/${nm}`, ok: true, count: orderIdsOnPage.length });
                }
              }
            } else if (bmpModus === 'platz') {
              const slots = await _buildBmpBlobsProSlot(layout.ditherSettings);
              teile = slots.map(t => ({ blob: t.blob, stamm: _stamm(grp, orderIdsOnPage, sfx, t.platz) }));
              // Platzierungsliste als .txt daneben — sonst weiß niemand, wohin die
              // Einzelbilder in Ezcad gehören.
              if (slots.length) teile.push({
                blob: _bmpPlatzierungsListe(slots, layout.name, sfx,
                  t => _stamm(grp, orderIdsOnPage, sfx, t.platz) + '.bmp'),
                stamm: _stamm(grp, orderIdsOnPage, sfx) + '_Platzierung', ext: 'txt'
              });
            } else if (pngVorlage) {
              // Ansicht als PNG (F02_*_PNG, „Speichern in: Ezcad-Vorlage", seit 13.10.2026): fester Name
              // <Layout>.png in den Ordner des Satzes im Tagesarchiv — neben platzN.bmp und
              // lade-diesen-tag.bat, die sie mitnimmt — und für Satz 1 direkt in den Arbeitsordner.
              // Ezcad liest sie nicht. „beides": zusätzlich wie bisher in den Gruppenordner.
              const blob = await generateExportBlob(fmt, _dxfOpts(layout), layout.ditherSettings);
              const satzIdx = Math.floor(i / basePages);
              if (blob) await _vorlageHoch(blob, `${layout.name}.png`, arbeitsordner(satzIdx), archivOrdner(satzIdx),
                orderIdsOnPage.length);
              teile = layout.bmpModus === 'beides' ? [{ blob, stamm: _stamm(grp, orderIdsOnPage, sfx) }] : [];
            } else {
              teile = [{
                blob: await generateExportBlob(fmt, _dxfOpts(layout), layout.ditherSettings),
                stamm: _stamm(grp, orderIdsOnPage, sfx)
              }];
            }
            const echte = teile.filter(t => t.blob);
            if (!echte.length && bmpModus !== 'vorlage' && !pngVorlage) {
              // null = nichts zu exportieren (Seite ohne Bildfelder bei bmp), kein Fehler.
              // KEIN Name über _uniq reservieren, sonst bekäme eine spätere Seite mit
              // demselben Namen grundlos ein „_2".
              console.warn(logPrefix, layout.name, '— kein Inhalt für', fmt, '(Seite', page + ')');
            } else {
              for (const t of echte) {
                const filename = _uniq(`${t.stamm}${variantTag}.${t.ext || ext}`);
                if (await uploadExportToServer(t.blob, filename, today, layout.group)) {
                  results.push({ layout: layout.name, file: filename, ok: true, count: orderIdsOnPage.length });
                  console.log('Exportiert:', filename);
                } else {
                  results.push({
                    layout: layout.name, file: filename, ok: false,
                    error: `Upload von ${filename} fehlgeschlagen`
                  });
                }
              }
            }
          } catch (e) {
            console.error(logPrefix, layout.name, '—', fmt, 'Seite', page, 'fehlgeschlagen:', e);
            results.push({
              layout: layout.name, ok: false,
              error: `${fmt.toUpperCase()} Seite ${page}: ${e.message}`
            });
          }
        }
      }

      // Bilder sind ins Canvas/PDF gerendert — Referenzen freigeben, sonst liegen alle
      // Seiten-Bilder gleichzeitig im Speicher. Beim manuellen Export (freeImages=false)
      // NICHT freigeben, sonst ist die Editor-Vorschau hinterher leer.
      if (freeImages) pageFields.forEach(f => { f._img = null; });
    }

    // Eine gebündelte Datei bauen, hochladen, Ergebnis protokollieren — gemeinsam für
    // PDF- und DXF-Gruppen, inklusive aller drei Meldungswege.
    const ladeGruppe = async (art, filename, baueBlob, seiten, bestellungen, unterordner) => {
      try {
        const blob = await baueBlob();
        // `unterordner` darf eine LISTE sein: dieselbe Datei landet dann in mehreren
        // Unterordnern (Einzeln/ und Gesamt/), ohne sie zweimal zu bauen.
        const ziele = Array.isArray(unterordner) ? unterordner : [unterordner || null];
        for (const u of ziele) {
          const wo = u ? `${u}/${filename}` : filename;
          if (await uploadExportToServer(blob, filename, today, layout.group, null, u)) {
            results.push({ layout: layout.name, file: wo, ok: true, count: bestellungen });
            console.log(`Exportiert (${art}):`, wo, `— ${seiten} Seite(n)`);
          } else {
            results.push({
              layout: layout.name, file: wo, ok: false,
              error: `Upload von ${wo} fehlgeschlagen (${seiten} Seite(n) verloren)`
            });
          }
        }
      } catch (e) {
        console.error(logPrefix, layout.name, `— ${art}`, filename, 'fehlgeschlagen:', e);
        results.push({ layout: layout.name, file: filename, ok: false, error: `${art} ${filename}: ${e.message}` });
      }
    };

    for (const gk in pdfGroups) {
      const fmt = gk.split('|')[0]; const g = pdfGroups[gk];
      if (!g.count) continue;
      const variantTag = (fmt === 'pdf-std' && formats.includes('pdf')) ? '_std' : '';
      await ladeGruppe('PDF', _uniq(`${_stamm(g.grp, g.ids, g.suffix)}${variantTag}.pdf`),
        () => g.doc.output('blob'), g.count, g.orders.size);
    }
    // DXF: mehrere Seiten überlappungsfrei gestapelt in EINER Datei
    for (const gk in dxfGroups) {
      const g = dxfGroups[gk];
      const nonEmpty = g.pages.filter(pg => pg.length > 0);
      if (!nonEmpty.length) continue;
      // Bei 'beides' liegt die Gravur-DXF in BEIDEN Unterordnern: jeder Ordner soll für
      // sich arbeitsfähig sein, egal ob Platz für Platz oder ganzes Blech gefahren wird.
      const dxfUnter = (layout.bmpModus === 'beides') ? ['Einzeln', 'Gesamt'] : [null];
      const bauen = async () => {
        const o = _dxfOpts(layout); // eine Ableitungsstelle für alle DXF-Optionen
        const content = nonEmpty.length > 1
          ? await buildDXFContentMultiPage(nonEmpty, o.isFilled, o.isVector, o.frame, o.asBlock, o.centerOrigin, o.bildRahmen, o.zusammen)
          : await buildDXFContent(nonEmpty[0], o.isFilled, o.isVector, o.frame, o.asBlock, o.centerOrigin, o.bildRahmen, o.zusammen);
        return new Blob([content], { type: 'application/dxf' });
      };
      await ladeGruppe('DXF', _uniq(`${_stamm(g.grp, g.ids, g.suffix)}.dxf`), bauen,
        nonEmpty.length, g.orders.size, dxfUnter);
    }
    // Vorlage: je Satz und Layout-Seite eine DXF an festem Namen — Seite 1 `gravur.dxf`, Seite 2
    // (Rückseite) `rueckseite.dxf`. Immer EINE Seite je Datei (gestapelt lägen sie neben dem Blech).
    // Welche Seite eine Datei bekommt, entscheidet das LAYOUT, nicht der Tagesinhalt: hat eine Seite
    // heute keine Gravur, wird eine LEERE DXF geschrieben — sonst gravierte Ezcad per „Dynamic File“
    // den Text von gestern, und lade-diesen-tag.bat ließe die alte Datei stehen.
    if (vorlageModus && formats.includes('dxf')) {
      const o = _dxfOpts(layout);
      const baue = felder => buildDXFContent(felder, o.isFilled, o.isVector, o.frame, o.asBlock, o.centerOrigin, o.bildRahmen, o.zusammen)
        .then(c => new Blob([c], { type: 'application/dxf' }));
      let leer = null;
      for (let satzIdx = 0; satzIdx < saetze; satzIdx++) {
        for (let role = 0; role < basePages; role++) {
          if (!_seiteHatGravur(layout, role)) continue;
          const datei = _vorlageDxfName(role);
          try {
            const felder = vorlageSeiten.get(satzIdx + '|' + role);
            const blob = (felder && felder.length) ? await baue(felder) : (leer || (leer = await baue([])));
            await _vorlageHoch(blob, datei, arbeitsordner(satzIdx), archivOrdner(satzIdx), 0);
          } catch (e) {
            console.error(logPrefix, layout.name, '— Vorlage', datei, 'fehlgeschlagen:', e);
            results.push({ layout: layout.name, file: datei, ok: false, error: `Vorlage ${datei}: ${e.message}` });
          }
        }
      }
      // gravurN.dxf je Deckelplatz — eine Datei pro Feuerzeug, Nullpunkt in der
      // Feldmitte. Nur für Seite 1 (die Deckel) und nur, wenn diese Seite AUSSCHLIESSLICH
      // Textfelder hat: dann ist dieses Layout der Text-Partner eines Foto-Layouts
      // (F02_Schw_V5_Text zu F02_Schw_V5). Die gemeinsame gravur.dxf bleibt daneben liegen —
      // welche die .ezd liest, entscheidet die Vorlage. JE SATZ, wie platzN.bmp und gravur.dxf
      // (sonst fehlten im Archiv „… Satz2" die Deckeltexte, und „Tag laden" leerte sie).
      const s0 = layout.pages?.[0] || [];
      const nurText = s0.length && !s0.some(f => f.type === 'image');
      if (nurText && _seiteHatGravur(layout, 0)) {
        for (let satzIdx = 0; satzIdx < saetze; satzIdx++) {
          const felderS = _deckelProPlatz(s0, vorlageSeiten, satzIdx);
          const arbeit = arbeitsordner(satzIdx), archiv = archivOrdner(satzIdx);
          for (let i = 0; i < felderS.length; i++) {
            const datei = `gravur${i + 1}.dxf`;
            try {
              await _vorlageHoch(await _gravurSlotDxf(felderS[i], layout), datei, arbeit, archiv, 0);
            } catch (e) {
              console.error(logPrefix, layout.name, '—', datei, 'fehlgeschlagen:', e);
              results.push({ layout: layout.name, file: datei, ok: false, error: `${datei}: ${e.message}` });
            }
          }
        }
      }
    }
  } finally {
    // finally, nicht nur vor dem return: ein PDF-/DXF-Renderfehler wirft aus dieser
    // Funktion heraus, und `fields` darf nie auf einer Zwischenseite zurückbleiben.
    fields = _fieldsBeforeExport;
    if (muster) _laufNamen.nr[_ordnerKey + muster] = _nrMax;
  }
  return results;
}

async function runAutoExport() {
  const saved = await getServerLayouts();
  // Puppeteer startet mit leerem Profil: der Rückfall aufs lokale Backup ergäbe [] und der Lauf
  // meldete „keine Layouts mit Auto-Flag" als Erfolg.
  if (_layoutStore.ausBackup) {
    window._autoExportError = 'Layouts vom Server nicht ladbar — nichts exportiert';
    return;
  }
  // Reklamations-Export: die benannten Layouts (Zeilenumbruch trennt), bewusst ohne
  // Rücksicht auf den Auto-Export-Haken — auch eins, das im Tageslauf nicht mitläuft.
  // Reihenfolge wie gespeichert, wie im Tageslauf (Foto-Layout vor seinem _Text-Partner).
  const nurLayout = URL_Q.get('onlyLayout') || '';
  const nurNamen = nurLayout ? nurLayout.split('\n') : [];
  const autoLayouts = nurLayout ? saved.filter(l => nurNamen.includes(l.name))
    : saved.filter(l => l.autoExport);
  // Foto-Nachbesserung aus der Reklamation (Stufe „zu hell/zu dunkel" usw.): `laserJe` =
  // { Layoutname: Werte }, gilt nur für dieses Layout. Gesetzt wird am LAYOUT-Objekt, nicht an der
  // globalen `ditherSettings` — der BMP-Weg liest `layout.ditherSettings` (s. _bmpVorlageDateien).
  // Betroffen ist nur dieser eine Seitenaufruf im Puppeteer-Browser; gespeichert wird nichts.
  try {
    const je = JSON.parse(URL_Q.get('laserJe') || 'null');
    if (je) for (const l of autoLayouts) {
      if (!je[l.name]) continue;
      l.ditherSettings = _laserSettings({ ...l.ditherSettings, ...je[l.name] });
      console.log('Reklamation:', l.name, 'nachgebessert:', JSON.stringify(je[l.name]));
    }
  } catch (e) {
    console.error('laserJe aus der URL unlesbar, nehme den Layout-Stand:', e.message);
  }
  // „Alles ausprobieren" (Reklamation): jedes gewählte Layout einmal je Variante, alle gesammelt
  // in „Varianten/<Vorlage-Ordner> <k>" (der Server nimmt dort nur platzN.bmp an).
  let _variantenModus = false;
  try {
    const vs = JSON.parse(URL_Q.get('varianten') || 'null');
    if (Array.isArray(vs) && vs.length && nurLayout) {
      const basis = autoLayouts.splice(0);
      for (const l of basis) for (const v of vs) {
        autoLayouts.push({
          ...l, vorlageOrdner: 'Varianten/' + _vorlageName(l) + ' ' + v.k,
          ditherSettings: _laserSettings({ ...l.ditherSettings, ...(v.werte || {}) }),
          _fokus: v.fokus && Object.keys(v.fokus).length ? v.fokus : null
        });
      }
      _variantenModus = true;
      console.log('Reklamation: alles ausprobieren —', vs.length, 'Varianten');
    }
  } catch (e) {
    console.error('Varianten aus der URL unlesbar:', e.message);
  }

  if (!autoLayouts.length) {
    console.log(nurLayout ? `Auto-Export: Layout „${nurLayout}" nicht gefunden`
      : 'Auto-Export: keine Layouts mit Auto-Flag');
    // "Nichts zu tun" ist ein Erfolg — ohne dieses Flag wartete Puppeteer die vollen
    // 10 Minuten auf _autoExportDone und meldete dann einen falschen Timeout-Fehler.
    window._autoExportDone = true;
    return;
  }

  // BERLINER Kalendertag, nicht der des Servers: dessen Uhr steht auf UTC, und zwischen
  // 22:00 UTC und Mitternacht ist in Berlin schon der nächste Tag — Gravurdatei und
  // Kundendaten landeten sonst in ZWEI verschiedenen Ordnern.
  const today = _dayBerlin(); // Berliner Kalendertag — eine Quelle für alle Datums-Ordner
  const results = [];

  // VOR der Session-Prüfung: auch ein Lauf ohne Bestellungen schreibt eine status.txt,
  // und die darf die Bilanz des ersten Laufs nicht überschreiben.
  // Eine Reklamation bekommt ihren eigenen Tagesordner und verbraucht deshalb keine
  // Lauf-Nummer — sonst würde sie die Zählung der Tagesproduktion verschieben.
  _reklaOrderId = URL_Q.get('onlyOrder') || '';
  _exportRun = _reklaOrderId ? 1 : await openExportRun(today);
  _laufNamen = { namen: new Set(), nr: {}, vorlagen: {} };
  _ddWarnungen.clear(); _exportHinweise.clear();
  // Emoji-Schriften laden und den Schalter frisch lesen (er kann seit dem Seitenaufruf geändert sein)
  await _emojiLaden(); await _emojiEinstellungLaden(); _fitPtCache.clear();
  const belegtIn = {};   // orderId → Layouts dieses Laufs (für die Packliste)

  // Session vom Server laden (letzte Downloads)
  const sessionData = await fetchOrdersForFill();
  if (sessionData === null) {
    window._autoExportError = 'Bestellungen/Session vom Server nicht ladbar — nichts exportiert, Arbeitsordner unverändert';
    return;
  }
  if (!sessionData.length) {
    console.log('Auto-Export: keine Session-Bestellungen vorhanden');
    // Auch ohne eine einzige Bestellung die Ezcad-Arbeitsordner beim ersten Lauf leeren —
    // sonst bliebe dort der Vortag (oder eine Prüfgravur) stehen und würde graviert.
    if (_exportRun === 1 && !_reklaOrderId && !nurLayout) {
      for (const layout of autoLayouts.filter(_istVorlageLayout)) {
        try {
          await loadLayoutSilent(layout);
          await document.fonts.ready;
          await _vorlageLeerSchreiben(layout, _formate(layout), today,
            (layout.pages?.length || 1) > 1 ? 'synchron' : 'stapel');
        } catch (e) {
          console.error('Auto-Export: Vorlagen-Ordner von', layout.name, 'nicht geleert:', e);
        }
      }
    }
    await sendExportStatus(today, [{ layout: 'Alle', error: 'Keine Bestellungen in Session', ok: false }]);
    // Sauber beenden (Status wurde gemeldet) — sonst 10-Min-Puppeteer-Timeout, s.o.
    window._autoExportDone = true;
    return;
  }
  console.log('Auto-Export: Session hat', sessionData.length, 'Bestellungen');

  for (const layout of autoLayouts) {
    console.log('Auto-Export: starte Layout', layout.name);
    _exportLayoutJetzt = layout.name;
    // Varianten: Fotos frisch laden, damit jede ihre eigene Gesichter-Bearbeitung bekommt.
    if (_variantenModus) {
      for (const k in _exportImgCache) delete _exportImgCache[k];
      _fokusJetzt = layout._fokus;
    }
    _nurMitFoto = _istTextPartner(layout, saved);
    if (_nurMitFoto) console.log('Auto-Export:', layout.name, '— Text-Partner von', _vorlageName(layout), ': nimmt nur Bestellungen mit Foto');
    // Pointer für jedes Layout komplett zurücksetzen
    _resetFillPointers();
    // Bild-hasMore-Tracker für sauberen Start zurücksetzen
    window._lastImgOrderPointers = {};
    window._lastImgCandidateCounts = {};
    // exportOrder-Einstellung dieses Layouts aktivieren (wirkt über _orderSort)
    window._autoExportSortOrder = layout.exportOrder || 'date-desc';

    try {
      const formats = _formate(layout);

      // Layout einmalig laden — setzt _pages, fields, DOM-Filter
      await loadLayoutSilent(layout);
      // KEINE feste Wartezeit: _applyLayoutState ist durchgehend synchron — eine Pause fiele für JEDES
      // Layout an, auch die übersprungenen. Gewartet wird nur auf das, was offen sein KANN: die Schriften.
      await document.fonts.ready;
      // Einmal abgeben: _clearOriginalImgs() hat gerade die Bildverweise des vorigen
      // Layouts fallen lassen, der Sammler braucht dafür einen Makrotask-Wechsel.
      await _atempause();

      // Keine minOrders-Prüfung: ohne passende Bestellungen wird das Layout unten
      // ohnehin übersprungen (filledOrderIds bleibt leer).

      // Session temporär auf die Auto-Export-Daten setzen; fillLayoutPages erkennt
      // Synchron- vs. Stapel-Layout selbst.
      const origSession = [...sessionOrders];
      sessionOrders.length = 0;
      sessionData.forEach(o => sessionOrders.push(o));
      // Zeitraum hart auf 'session' pinnen — Auto-Export exportiert IMMER nur die
      // Session des Laufs, egal was das Layout für manuelles Füllen eingestellt hat.
      const origPreset = _fillCfg.datePreset;
      _fillCfg.datePreset = 'session';

      let result;
      try {
        result = await fillLayoutPages(_pages);
      } finally {
        // Session und Preset wiederherstellen
        sessionOrders.length = 0;
        origSession.forEach(o => sessionOrders.push(o));
        _fillCfg.datePreset = origPreset;
      }

      if (!result.filledOrderIds.length) {
        console.warn('Auto-Export: Layout', layout.name, '— keine passenden Bestellungen, übersprungen (0 Dateien)');
        if (_istVorlageLayout(layout) && _exportRun === 1 && !_reklaOrderId && !nurLayout) {
          await _vorlageLeerSchreiben(layout, formats, today, result.mode);
        }
        continue;
      }

      console.log('Auto-Export:', layout.name, `— ${result.pages.length} Seite(n) gefüllt (Modus: ${result.mode}, ${result.filledOrderIds.length} Bestellungen)`);

      const layoutResults = await _exportFilledPages(layout, result, formats, today);
      results.push(...layoutResults);
      if (result.diagnose?.abgeschnitten) results.push({
        layout: layout.name, ok: false,
        error: 'Mehr als 50 Seiten — weitere Bestellungen NICHT exportiert, bitte manuell nachholen'
      });
      // „Automatisch mehrseitig" aus: was nicht aufs eine Blatt passte, fehlt im Lauf — laut melden
      // statt still weglassen (F02_xxx_V5 stand bis 11.10.2026 so, ab der 13. Bestellung fehlte das Foto).
      if (result.diagnose?.uebrig) results.push({
        layout: layout.name, ok: false,
        error: 'Blatt voll und „Automatisch mehrseitig" ist aus — weitere Bestellungen NICHT exportiert, bitte manuell nachholen'
      });
      for (const id of result.filledOrderIds) {
        const l = belegtIn[id] || (belegtIn[id] = []);
        if (!l.includes(layout.name)) l.push(layout.name);
      }
    } catch (e) {
      console.error('Auto-Export Fehler bei', layout.name, e);
      results.push({ layout: layout.name, error: e.message, ok: false });
    }
  }

  // Auto-Export-Sortierung zurücksetzen (sonst bliebe die letzte Layout-Reihenfolge aktiv)
  window._autoExportSortOrder = null;
  _nurMitFoto = false;

  // Packliste und Dropdown-Hinweise — nur im normalen Tageslauf (nicht bei Reklamation oder
  // einem einzelnen Layout). Die Hinweise gehen als eigene Einträge an /export-status: dort
  // landen sie in status.txt und als ⚠ in der Übersicht, ohne als Fehler zu zählen.
  const extra = [];
  if (!_reklaOrderId && !nurLayout) {
    try {
      await _ddVorbereiten(sessionData);
      const pl = _packliste(sessionData, belegtIn, today, _exportRun);
      const ok = await uploadExportToServer(new Blob([pl.text], { type: 'text/plain;charset=utf-8' }),
        'packliste.txt', today, null, null, null);
      extra.push(ok ? { layout: 'Packliste', file: 'packliste.txt', ok: true }
        : { layout: 'Packliste', error: 'packliste.txt nicht gespeichert', ok: false });
      for (const h of [...pl.hinweise, ..._ddWarnungen]) extra.push({ layout: 'Dropdown', hinweis: h, ok: true });
      console.log('Auto-Export: Packliste geschrieben,', pl.hinweise.length, 'Hinweis(e),', _ddWarnungen.size, 'Warnung(en)');
    } catch (e) {
      console.error('Auto-Export: Packliste fehlgeschlagen', e);
      extra.push({ layout: 'Packliste', error: e.message, ok: false });
    }
  }
  // Auch bei Reklamation: ein Platz ohne lesbare Bestelldaten hat keinen Gravurtext.
  for (const [h, v] of _exportHinweise) if (!v.nurRekla || _reklaOrderId) extra.push({ layout: v.layout, hinweis: h, ok: true });

  // Bild- und JSON-Caches nach dem Lauf leeren: beide sind neu ladbar und wüchsen über
  // wiederholte Cron-Läufe sonst unbegrenzt (der Puppeteer-Kontext bleibt offen).
  for (const k in _exportImgCache) delete _exportImgCache[k];
  for (const k in _orderJsonCache) delete _orderJsonCache[k];
  _ddCache.clear();

  // Status an Server schicken
  _exportLayoutJetzt = '';
  await sendExportStatus(today, [...results, ...extra]);
  console.log('Auto-Export abgeschlossen:', results);

  // Prüfen ob alle Layouts fehlgeschlagen sind
  const allFailed = results.length > 0 && results.every(r => !r.ok);
  if (allFailed) {
    const firstError = results.find(r => r.error)?.error || 'Unbekannter Fehler';
    window._autoExportError = firstError; // Signal für Puppeteer: Fehler
    console.error('Auto-Export: alle Layouts fehlgeschlagen —', firstError);
    return;
  }

  // Puppeteer Signal: fertig ✅
  window._autoExportDone = true;
}

// Layout laden ohne Bestätigungs-Dialog/Toast — für den Auto-Export. Im Puppeteer-
// Kontext ohne interaktive change-Handler: deren Nebenwirkungen destabilisieren
// den headless Export.
async function loadLayoutSilent(layout) {
  _applyLayoutState(layout, !IS_AUTOEXPORT);
  updateCanvas();
  renderFieldList();
  renderProps();
  updatePageNavigator();
  await new Promise(r => setTimeout(r, 300));
}

// Session vom Server laden für Auto-Export
async function fetchOrdersForFill() {
  try {
    // Schritt 1: orders global befüllen (hat files + date) — genau wie beim manuellen Laden
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    const ordersRes = await fetch(BASE_URL + '/v2/orders', { headers, credentials: 'include' });
    if (!ordersRes.ok) throw new Error('orders nicht erreichbar');
    orders = await ordersRes.json(); // globale orders Variable setzen

    // Schritt 2: Session laden (welche IDs wurden heute heruntergeladen)
    if (!(await loadSession())) throw new Error('Session nicht erreichbar'); // setzt sessionOrders global

    // Schritt 3: Umfang bestimmen. Normalfall ist die Session des Laufs. Kommt der Export
    // von einer Wiederholung mit „Ganzer Zeitraum", stehen fillFrom/fillTo in der URL —
    // dann zählen ALLE Bestellungen dieser KAUFtage, auch die längst geladenen.
    // Reklamation: genau eine Bestellung, alles andere bleibt draußen.
    const nurOrder = URL_Q.get('onlyOrder') || '';
    // Reklamation ohne Bestellung (000-…): steht nicht unter /orders (s. REKLA_MANUELL in index.js),
    // der Server liefert sie einzeln — in die globale Liste, über die der Session-Filter läuft.
    if (/^000-\d{7}-\d{7}$/.test(nurOrder)) {
      const eintraege = (await _apiJson('/v2/rekla/manuell/' + encodeURIComponent(nurOrder))).eintraege || [];
      orders = orders.concat(eintraege);
      console.log('fetchOrdersForFill: Reklamation ohne Bestellung', nurOrder, '→', eintraege.length, 'Artikel');
      return eintraege;
    }
    if (nurOrder) {
      const treffer = orders.filter(o => o.id === nurOrder);
      console.log('fetchOrdersForFill: Reklamation', nurOrder, '→', treffer.length, 'Treffer von', orders.length);
      return treffer;
    }
    const von = URL_Q.get('fillFrom') || '', bis = URL_Q.get('fillTo') || '';
    if (von && bis) {
      const imZeitraum = orders.filter(o => _matchesDatePreset(o, 'custom', von, bis));
      console.log('fetchOrdersForFill: Zeitraum', von, '–', bis, '→', imZeitraum.length, 'von', orders.length, 'Bestellungen');
      return imZeitraum;
    }
    // Schritt 3b: denselben Filter wie manuelles Füllen nutzen
    _fillCfg.datePreset = 'session'; // wie Auto-Export: immer nur Session des Laufs

    const filtered = getFillDateFilteredOrders();
    console.log('fetchOrdersForFill: orders geladen:', orders.length, '| Session:', sessionOrders.length, '| gefiltert:', filtered.length);
    return filtered;
  } catch (e) {
    // null, NICHT []: leer hieße „heute keine Bestellungen" — der Lauf meldete Erfolg, leerte
    // beim ersten Lauf die Ezcad-Arbeitsordner, und die Bestellungen des Tages fehlten still.
    console.error('fetchOrdersForFill Fehler:', e);
    return null;
  }
}

// DXF-/Rahmen-Optionen eines Layouts als EIN Objekt — EINE Ableitungsstelle für alle
// vier Aufrufer. Verträgt null/undefined (Defaults: Outline, Vektor, kein Rahmen).
function _dxfOpts(l) {
  return {
    isFilled: l?.dxfStyle === 'filled',
    zusammen: l?.dxfStyle !== 'einzeln', // Standard: Buchstaben je Zeile vereinigt (s. _konturenVereinigen)
    isVector: l?.dxfTextMode !== 'text', // Standard = Vektor
    frame: !!l?.dxfFrame,
    asBlock: !!l?.dxfTextAsBlock,
    centerOrigin: !!l?.dxfCenterOrigin, // Nullpunkt in die Blattmitte (Ezcad), s. _dxfOriginToCenter
    // Rechteck um jedes Bildfeld (Layer „Bild“) nur, wenn das Layout KEIN BMP erzeugt — eine
    // Positionierhilfe für eine DXF, die allein dasteht. Mit BMP ist die Lage definiert, und zwölf Rahmen
    // würden nur mitgraviert. dxfBildRahmen im Layout schlägt die Automatik — nötig für F02_xxx_V5_Text
    // (kein BMP, die Bildflächen kommen vom Schwester-Layout).
    bildRahmen: (l && l.dxfBildRahmen !== undefined) ? !!l.dxfBildRahmen
      : !_formate(l).includes('bmp'),
  };
}

// Export-Blob generieren je nach Format. dxfOpts = _dxfOpts(layout)-Form.
async function generateExportBlob(format, dxfOpts, ditherOpts) {
  try {
    if (format === 'pdf' || format === 'pdf-std') {
      const p = getPg();
      const doc = await _newPdfDoc(p);
      // pdf = Druck (450 DPI + Boost + JPEG 0.95), pdf-std = 96 DPI JPEG 0.92 (Versandvariante).
      // Gleiche Quelle wie manueller Export & Auto-Export → _pdfPageJpeg / _PDF_PRINT.
      const std = format === 'pdf-std';
      const url = await _pdfPageJpeg(std ? 96 : _PDF_PRINT.dpi, !std && _PDF_PRINT.boost, std ? 0.92 : _PDF_PRINT.q);
      doc.addImage(url, 'JPEG', 0, 0, p.w, p.h);
      return doc.output('blob');
    } else if (format === 'png') {
      const c = await buildExportCanvas(EXPORT_DPI);
      if (dxfOpts && dxfOpts.frame) _drawSheetFrameOnCanvas(c); // Vollblatt-Rahmen (pro Layout)
      return await new Promise(resolve => c.toBlob(resolve, 'image/png'));
    } else if (format === 'sublimation') {
      // Sublimation: 300 DPI, sRGB, reiner weißer Hintergrund, verlustfreies PNG.
      // Gleicher Canvas wie der manuelle Sublimations-Export → identische Qualität.
      await document.fonts.ready;
      const c = await _buildSublimationCanvas();
      return await new Promise(resolve => c.toBlob(resolve, 'image/png'));
    } else if (format === 'dxf') {
      // Laser-Vektor — gefüllte Felder dieser Seite als eine DXF (Batch).
      // Stil + Textmodus kommen aus den Layout-Einstellungen (Standard: Outline + Vektor)
      const filledFields = fields.filter(f => _hasVecText(f) || f._img || (_istMotiv(f) && _motivAktiv(f, fields)));
      if (!filledFields.length) return null;
      // dxfOpts kommt bereits in der _dxfOpts-Form (kein eigenes Umrechnen mehr hier)
      const o = dxfOpts || _dxfOpts(null);
      const content = await buildDXFContent(filledFields, o.isFilled, o.isVector, o.frame, o.asBlock, o.centerOrigin, o.bildRahmen, o.zusammen);
      return new Blob([content], { type: 'application/dxf' });
    } else if (format === 'bmp') {
      // 1-bit BMP der Bildfelder dieser Seite — gemeinsamer Kern mit exportBMP
      // (inkl. per-Layout-Dithering; verändert f._img nicht)
      return await _buildBmpBlob(ditherOpts);
    }
    console.warn('generateExportBlob: unbekanntes Format', format);
    return null;
  } catch (e) {
    // Weiterwerfen statt null: null heißt „nichts zu exportieren" und wird still
    // übersprungen — ein echter Renderfehler würde so zur lautlos fehlenden Datei.
    console.error('generateExportBlob Fehler bei Format', format, ':', e);
    throw new Error(`${format}-Export fehlgeschlagen: ${e.message}`);
  }
}

// ── Testblatt ────────────────────────────────────────────────────────────────
// Probeblech: JEDER Gravur-Slot bekommt Blindtext, das Ergebnis geht nach
// „exports/<Tag> Testblatt/<Gruppe>/" — GETRENNT von der Tagesproduktion (s.
// _testSheetRun), ein Blech mit „01 Mustermann" darf nie in den Laser wandern.
// Eigener Weg statt fillAllPagesAuto: der hängt komplett an einem Füll-Ergebnis.
// Auswahl: '' | 'l:<Layout-ID>' | 'g:<Ordner>' | 'alle'. Vorausgewählt ist das geladene Layout;
// _tsWahlAuto hält sie daran fest, bis jemand selbst etwas wählt.
let _tsWahl = '', _tsWahlAuto = true;
// Inhalt: Platznummer + Mustertext. Schrift-Vorauswahlen = die häufigsten Kundenschriften
// (Bestellungen 15.–17.10.2026: Monotype 152×, Alex Brush 58×); „Standard" = Schrift des Layouts
// (Arial, bei F02 V4 Old London). Seit 20.10.2026 richtet sich die Wahl nach dem Layout: die Schrift
// nur bei Textfeldern, der Schalter „Testfoto" (Standardbild in alle Bildfelder) nur bei Bildfeldern —
// bei F02 V6/V7 beides zusammen. Vorher war Testfoto eine fünfte Schrift-Option, auch wo es nichts gab.
const TS_ZEILE1 = '{n} Mustermann', TS_ZEILE2 = '{n} 01.01.2025';
const TS_SCHRIFTEN = [
  { id: 'standard', label: 'Standard', titel: 'Schrift des Layouts' },
  { id: 'monotype', label: 'Monotype', titel: 'Häufigste Kundenschrift', schrift: 'Monotype' },
  { id: 'alexbrush', label: 'Alex Brush', titel: 'Schreibschrift', schrift: 'AlexBrush' },
];
let _tsVorauswahl = 'standard';

// Was die Layouts enthalten (gespeicherte Seiten): { text, bild }. Gilt für einen ganzen Ordner,
// sobald EIN Layout darin Text bzw. Bilder hat — die übrigen ignorieren die Wahl.
function _tsInhalt(layouts) {
  const felder = layouts.flatMap(l => (l.pages || []).flat());
  return { text: felder.some(f => f.type === 'text'), bild: felder.some(f => f.type === 'image') };
}

// Slot-Reihenfolge = DXF-Zeilenreihenfolge (oben→unten, bei gleicher Höhe links→rechts),
// damit die Nummer im Blindtext zum Layer „Gravur_N" in Ezcad passt.
function _tsSlotOrder(pageFields) {
  return pageFields.filter(f => f.type === 'text' || f.type === 'number')
    .slice().sort(_nachPosition);
}

// Blindtext für einen Slot. {n} = Slot-Nummer (zweistellig), {nr} = ohne führende Null.
function _tsText(vorlage, i) {
  return String(vorlage)
    .replace(/\{n\}/g, String(i + 1).padStart(2, '0'))
    .replace(/\{nr\}/g, String(i + 1));
}

// Testfoto in alle Bildfelder der Seite — dasselbe Einpassen wie bei Kundenfotos (_kundenFotos +
// _imgMitPlatzierung). Einmal einpassen, dann übertragen: zwölf gleiche Bilder kosteten nur Speicher.
let _tsFotoPlatz;   // Amazon-Ausschnitt des Standardbilds (undefined = noch nicht geladen)
async function _tsFotoSetzen(pageFields) {
  const bild = pageFields.filter(f => f.type === 'image');
  if (!bild.length) return;
  if (_tsFotoPlatz === undefined) {
    const res = await fetch(`${BASE_URL}/v2/testfoto/standardbild-placement.json`);
    _tsFotoPlatz = (res.ok && _kundenFotos(await res.json())[0]?.placement) || null;
  }
  await _imgMitPlatzierung(bild[0], `${BASE_URL}/v2/testfoto/standardbild.jpg`, _tsFotoPlatz);
  for (const f of bild.slice(1)) _bildZustandKopieren(f, bild[0]);
}

// Ein Layout füllen und exportieren. Gibt { dateien, leer } zurück.
async function _tsOneLayout(layout, z1, z2, today, wahl = {}) {
  await loadLayoutSilent(layout);
  const formats = _formate(layout);
  const seiten = (_pages && _pages.length) ? _pages.length : 1;
  let dateien = 0, leer = 0;
  for (let p = 0; p < seiten; p++) {
    // Felder der Seite global setzen — generateExportBlob liest `fields` und getPg()
    fields = (_pages[p] || []).map(f => ({ ...f }));
    const slots = _tsSlotOrder(fields);
    for (const [i, f] of slots.entries()) {
      if (f.type === 'number') { f._text = String(i + 1); continue; }
      const a = _tsText(z1, i), b = z2 ? _tsText(z2, i) : '';
      // Die palNum entscheidet, welche Blindtext-Zeile ein Feld bekommt — wie in der
      // Produktion. Wichtig bei zweiseitigen Layouts (K01, F01): Seite 1 liegt auf
      // palNum 1, Seite 2 auf palNum 2, oft bei identischer Geometrie — ohne die
      // Unterscheidung kämen zwei byte-gleiche Bleche heraus.
      // Kombi-Feld stapelt beide Zeilen über "\n".
      if (_isCombo(f)) f._text = b ? (a + '\n' + b) : a;
      else f._text = ((f.palNum || 1) >= 2 && b) ? b : a;
      if (wahl.schrift) await _feldSchriftSetzen(f, { family: wahl.schrift, url: null });
    }
    if (wahl.foto) await _tsFotoSetzen(fields);
    scheduleRender();
    await _atempause(); // s. EXPORT_ATEMPAUSE_MS — vorher feste 300 ms je Seite
    for (const fmt of formats) {
      const ext = fmt === 'sublimation' ? 'png' : (fmt === 'pdf-std' ? 'pdf' : fmt);
      let blob;
      try {
        blob = await generateExportBlob(fmt, _dxfOpts(layout), layout.ditherSettings);
      } catch (e) {
        console.error('Testblatt:', layout.name, fmt, e.message);
        leer++; continue;
      }
      // null = nichts zu exportieren. Trifft z.B. BMP-Layouts (F02): die leben von
      // Bildfeldern, und ein Testblatt hat keine Kundenfotos.
      if (!blob) { leer++; continue; }
      const name = `${layout.name}_TEST${seiten > 1 ? '_Seite' + (p + 1) : ''}.${ext}`;
      if (await uploadExportToServer(blob, name, today, layout.group)) dateien++;
    }
  }
  return { dateien, leer };
}

// Layouts zur Auswahl im Klappmenü.
async function _tsLayouts() {
  const alle = await getServerLayouts();
  if (_tsWahl === 'alle') return alle;
  if (_tsWahl.startsWith('g:')) return alle.filter(l => _layoutOrdner(l) === _tsWahl.slice(2));
  if (_tsWahl.startsWith('l:')) return alle.filter(l => String(l.id) === _tsWahl.slice(2));
  return [];
}

function tsVorauswahl(id) { _tsVorauswahl = id; _tsInhaltZeigen(); }

// Schrift-Knöpfe und Testfoto-Schalter je nach gewähltem Layout ein- oder ausblenden.
let _tsInhaltLauf = 0;
async function _tsInhaltZeigen() {
  const lauf = ++_tsInhaltLauf;
  const inhalt = _tsWahl ? _tsInhalt(await _tsLayouts()) : { text: false, bild: false };
  if (lauf !== _tsInhaltLauf) return;   // inzwischen anders gewählt
  const zeige = (id, an) => { const el = document.getElementById(id); if (el) el.style.display = an ? '' : 'none'; };
  zeige('ts-schrift-zeile', inhalt.text);
  zeige('ts-foto-zeile', inhalt.bild);
  zeige('ts-inhalt-leer', _tsWahl && !inhalt.text && !inhalt.bild);
  const leer = document.getElementById('ts-inhalt-leer');
  if (leer) leer.textContent = 'Keine Text- oder Bildfelder — nur Platznummern.';
  const va = document.getElementById('ts-vorauswahl');
  // Breite nach Textlänge: drei gleich breite Knöpfe schnitten „Standard" und „Alex Brush" ab
  if (va) va.innerHTML = TS_SCHRIFTEN.map(v => _segBtn(_tsVorauswahl === v.id, `tsVorauswahl('${v.id}')`, v.label, v.titel,
    'flex:1 1 auto;padding:7px 4px;')).join('');
}

// Klappmenü füllen: oben das geladene Layout, dann je Ordner „Ganzer Ordner" + seine Layouts —
// Ordner in derselben Reihenfolge wie im Reiter „Layout" —, unten „Alle".
async function renderTestSheetUI() {
  const sel = document.getElementById('ts-wahl');
  if (!sel) return;
  const [alle, folders] = await Promise.all([getServerLayouts(), getServerFolders()]);
  if (_tsWahlAuto) _tsWahl = _loadedLayout ? 'l:' + _loadedLayout.id : '';
  const byGroup = _layoutsNachOrdner(alle);
  let html = _tsWahl ? '' : '<option value="">— Layout wählen —</option>';
  if (_loadedLayout) html += `<option value="l:${_loadedLayout.id}">Geladen: ${_esc(_loadedLayout.name)}</option>`;
  for (const g of [..._ordnerInReihenfolge(folders, alle).map(o => o.name), '']) {
    const ls = byGroup[g];
    if (!ls || !ls.length) continue;
    html += `<optgroup label="${_esc(g || 'Ohne Ordner')}">`;
    if (g && ls.length > 1) html += `<option value="g:${_esc(g)}">Ganzer Ordner ${_esc(g)} (${ls.length})</option>`;
    for (const l of ls) html += `<option value="l:${l.id}">${_esc(l.name)}</option>`;
    html += '</optgroup>';
  }
  html += `<option value="alle">Alle Layouts (${alle.length})</option>`;
  sel.innerHTML = html;
  sel.value = _tsWahl;
  if (sel.value !== _tsWahl) { _tsWahl = ''; _tsWahlAuto = true; sel.value = ''; }   // Layout gelöscht
  sel.onchange = () => { _tsWahl = sel.value; _tsWahlAuto = false; _tsInhaltZeigen(); };
  _tsInhaltZeigen();
}

async function runTestSheets() {
  const btn = document.getElementById('ts-btn');
  const info = document.getElementById('ts-status');
  const layouts = await _tsLayouts();
  if (!layouts.length) { showToast('Bitte oben ein Layout wählen'); return; }
  // Nur, was das Layout auch hat: ohne Textfelder keine Schrift, ohne Bildfelder kein Testfoto
  const inhalt = _tsInhalt(layouts);
  const wahl = {
    schrift: inhalt.text ? (TS_SCHRIFTEN.find(v => v.id === _tsVorauswahl) || TS_SCHRIFTEN[0]).schrift : undefined,
    foto: inhalt.bild && document.getElementById('ts-foto')?.checked !== false,
  };
  if (layouts.length > 10 && !await confirmModal('Testblatt erzeugen?',
    `${layouts.length} Layouts — das dauert einige Minuten.`, 'Starten')) return;
  // Der Lauf schiebt Layout für Layout durch den Editor und stellt den Stand danach
  // wieder her — gefüllte Bilder überstehen das aber nicht.
  if (_layoutDirty && !await confirmModal('Testblatt erzeugen?',
    'Das aktuelle Layout hat ungespeicherte Änderungen. Der Editor wird danach '
    + 'wiederhergestellt, geladene Bilder gehen dabei aber verloren.', 'Weiter')) return;

  // Kompletter Stand VOR dem Lauf — `_loadedLayout` allein reicht nicht: war kein Layout
  // geladen, bliebe das zuletzt durchgelaufene samt Blindtext im Canvas stehen.
  // saveCurrentPageSnapshot() zuerst, `_pages` hinkt sonst eine Bearbeitung hinterher.
  saveCurrentPageSnapshot();
  const vorher = {
    layout: _loadedLayout,
    pages: _pages.map(pg => pg.map(f => ({ ...f }))),
    seite: _currentPage,
    blatt: getPg(),
    dirty: _layoutDirty,
    // loadLayoutSilent überschreibt beides — sonst gälten die Werte des letzten Test-Layouts.
    laser: ditherSettings,
    fill: { ..._fillCfg },
  };
  const today = _dayBerlin(); // Berliner Tag wie im Auto-Export, nicht der des Browsers
  _testSheetRun = true;
  if (btn) { btn.disabled = true; }
  let dateien = 0, leer = 0, fehler = 0;
  try {
    for (let i = 0; i < layouts.length; i++) {
      if (btn) btn.textContent = `⏳ ${i + 1} / ${layouts.length} — ${layouts[i].name}`;
      try {
        const r = await _tsOneLayout(layouts[i], TS_ZEILE1, TS_ZEILE2, today, wahl);
        dateien += r.dateien; leer += r.leer;
      } catch (e) {
        console.error('Testblatt fehlgeschlagen:', layouts[i].name, e);
        fehler++;
      }
    }
  } finally {
    _testSheetRun = false;
    if (btn) { btn.disabled = false; btn.textContent = 'Testblatt erzeugen'; }
    // Editor zurücksetzen — auch dann, wenn gar kein Layout geladen war.
    _pages = vorher.pages.length ? vorher.pages : [[]];
    _currentPage = Math.min(vorher.seite, _pages.length - 1);
    fields = (_pages[_currentPage] || []).map(f => ({ ...f }));
    document.getElementById('pw').value = vorher.blatt.w;
    document.getElementById('ph').value = vorher.blatt.h;
    document.getElementById('pm').value = vorher.blatt.m;
    _loadedLayout = vorher.layout;
    ditherSettings = vorher.laser;
    Object.assign(_fillCfg, vorher.fill);
    _syncLaserUI(ditherSettings); _markMaterialBtn(); updateDitherSettings(); _syncFillUI();
    sel = null;
    for (const k in _exportImgCache) delete _exportImgCache[k];
    updateCanvas(); renderEls(); drawCanvas(); renderFieldList(); renderProps();
    updatePageNavigator();
    markLayoutDirty(vorher.dirty); // war vorher etwas offen, bleibt es offen
  }
  const ziel = `exports/${today} Testblatt`;
  const rest = (leer ? ` · ${leer} ohne Gravur-Inhalt übersprungen` : '')
    + (fehler ? ` · ${fehler} fehlgeschlagen` : '');
  if (info) { info.style.display = 'block'; info.textContent = `${dateien} Datei(en) → ${ziel}${rest}`; }
  showToast(dateien ? `✅ ${dateien} Testblatt-Datei(en) → ${ziel}${rest}`
    : `⚠️ Keine Datei erzeugt${rest}`, 7000);
}

// Nummer des Export-Durchlaufs: 1 = Tagesordner, ab 2 legt der SERVER den Nachbarordner
// „<Tag> Lauf N" an — den Namen baut ausschließlich er, hier läuft nur die Nummer mit.
let _exportRun = 1;
// Dateinamen und fortlaufende {nr} über ALLE Layouts eines Laufs. Mehrere Layouts schreiben
// in denselben Gruppenordner (V1 und V2 → „F02 zusammen", elf Farben → K01_xxx_M1); mit
// „Bild{nr}" finge sonst jedes Layout wieder bei Bild1 an und überschriebe das vorige —
// dasselbe bei einer Mehr-Artikel-Bestellung und „{bestellnr}". Schlüssel: Gruppe + Name.
let _laufNamen = { namen: new Set(), nr: {}, vorlagen: {} };
// Manueller Export mit Namensmuster: der Tagesordner ist schon vom Lauf belegt, „Bild1"
// gibt es dort bereits. Der Server hängt dann _2 an, statt die Datei zu überschreiben.
let _nichtUeberschreiben = false;
// Gesetzt, wenn dieser Export eine Reklamation ist: dann schreibt der Server nicht in
// „<Tag> Lauf N", sondern in „<Tag> Reklamation/<Bestellnummer>".
let _reklaOrderId = '';
// Gesetzt, solange ein Testblatt-Lauf läuft (s. runTestSheets): der Server schreibt dann
// in „<Tag> Testblatt/<Gruppe>". Blindtext-Bleche dürfen nie im Produktionsordner landen.
let _testSheetRun = false;

// Beim Server einen Export-Lauf eröffnen. Schlägt das fehl, wird in den Tagesordner
// geschrieben — lieber am gewohnten Ort als gar nicht.
async function openExportRun(date) {
  try {
    const data = await _apiJson('/v2/export-run', 'POST', { date });
    if (Number.isInteger(data.run)) {
      console.log('Export-Lauf:', data.folder || date);
      return data.run;
    }
  } catch (e) {
    console.warn('Export-Lauf nicht eröffnet:', e.message, '— schreibe in den Tagesordner.');
  }
  return 1;
}

// Export-Datei hochladen. Der Rückgabewert MUSS geprüft werden, sonst meldet status.txt
// ✅ für Dateien, die nie angekommen sind. Drei Versuche, weil die gerenderte Seite nur
// im Browser-Speicher existiert — ein Upload-Fehler verliert sie endgültig.
async function uploadExportToServer(blob, filename, date, group, vorlageOrdner, unterordner) {
  const ATTEMPTS = 3;
  let lastErr = '';
  for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
    // FormData pro Versuch neu bauen — ein bereits gesendeter Body ist verbraucht.
    const formData = new FormData();
    formData.append('file', blob, filename);
    formData.append('date', date);
    formData.append('filename', filename);
    if (group) formData.append('group', group); // Unterordner pro Layout-Gruppe
    formData.append('run', String(_exportRun)); // Nummer des Export-Laufs
    if (_reklaOrderId) { // Reklamation: eigener Ordner je Bestellnummer statt Lauf-Nummer
      formData.append('rekla', '1');
      formData.append('orderId', _reklaOrderId);
      // Vorschau: der Server legt alles in den Zwischenspeicher statt aufs Netzlaufwerk
      if (URL_Q.get('vorschau') === '1') formData.append('vorschau', '1');
    }
    if (_testSheetRun) formData.append('test', '1'); // Testblatt: eigener Tagesordner
    // Vorlagen-Modus: NICHT in den Tagesordner, sondern unter einen festen Pfad
    // exports/_Vorlage/<Ordner>/ mit festem Dateinamen. Nur so kann eine Ezcad-Vorlage
    // mit „Dynamic file" jeden Tag dieselbe Datei nachladen (s. _bmpVorlageDateien).
    if (vorlageOrdner) formData.append('vorlage', vorlageOrdner);
    if (unterordner) formData.append('unterordner', unterordner); // z.B. Einzeln / Gesamt
    if (_nichtUeberschreiben && !vorlageOrdner) formData.append('neu', '1');
    try {
      const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
      const uploadHeaders = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await fetch(BASE_URL + '/v2/export-upload', { method: 'POST', headers: uploadHeaders, credentials: 'include', body: formData });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.success) {
        console.log('Upload:', filename, '✅' + (attempt > 1 ? ` (Versuch ${attempt})` : ''));
        return true;
      }
      lastErr = data.error || `HTTP ${res.status}`;
    } catch (e) {
      lastErr = e.message || String(e);
    }
    console.warn(`Upload fehlgeschlagen (${attempt}/${ATTEMPTS}):`, filename, '—', lastErr);
    if (attempt < ATTEMPTS) await new Promise(r => setTimeout(r, 1000 * attempt));
  }
  console.error('Upload endgültig fehlgeschlagen:', filename, '—', lastErr);
  return false;
}

// Status-Datei auf Server schreiben
async function sendExportStatus(date, results) {
  try {
    // test MUSS mit — sonst schreibt der Server die Bilanz eines Testblatt-Laufs in den
    // Tagesordner der Produktion (s. /export-status). Gleiche Flags wie beim Upload.
    // _apiJson prüft die Antwort — bis 08.10.2026 ging ein abgelehnter Status still verloren.
    await _apiJson('/v2/export-status', 'POST', {
      date, results, run: _exportRun,
      rekla: _reklaOrderId ? '1' : '', orderId: _reklaOrderId,
      vorschau: _reklaOrderId && URL_Q.get('vorschau') === '1' ? '1' : '',
      test: _testSheetRun ? '1' : ''
    });
  } catch (e) {
    console.error('Status Fehler:', e);
  }
}

// Auto-Export nur via Puppeteer (?autoexport=1) oder manuell
if (IS_AUTOEXPORT) {
  window.addEventListener('load', () => {
    // Kein initPages hier: der zentrale DOMContentLoaded-Init ruft es bereits, und
    // DOMContentLoaded liegt immer VOR `load`.
    setTimeout(() => {
      runAutoExport().catch(e => {
        console.error('runAutoExport uncaught:', e.message);
        window._autoExportError = e.message || 'Unbekannter Fehler'; // Puppeteer-Signal
      });
    }, 2000);
  });
}

// ── Gemeinsamer Seiten-Loop für alle Export-Funktionen ──────────────────────────
// Schließt das Export-Menü, sichert die aktuelle Seite, lädt jede Seite temporär
// zum Rendern (mit kurzer Wartezeit für Bild-/Font-Layout) und ruft perPageFn(i)
// auf. Am Ende wird die ursprünglich angezeigte Seite 1:1 wiederhergestellt.
async function _forEachExportPage(perPageFn) {
  document.getElementById('export-menu').style.display = 'none';
  saveCurrentPageSnapshot();
  const savedPage = _currentPage;
  for (let i = 0; i < _pages.length; i++) {
    fields = _pages[i].map(f => ({ ...f }));
    await new Promise(r => setTimeout(r, 50));
    await perPageFn(i);
  }
  // Ursprüngliche Seite wiederherstellen
  _currentPage = savedPage;
  fields = _pages[_currentPage].map(f => ({ ...f }));
  scheduleRender();
}

// PDF: alle Seiten in ein Dokument (dpi/boost/quality steuern Print vs. Standard).
// Nutzt dieselbe Seitenrender-Quelle (_pdfPageJpeg) wie Auto-Export & generateExportBlob.
async function _exportPDF(dpi, boost, quality, filename) {
  const p = getPg();
  const doc = await _newPdfDoc(p);
  await _forEachExportPage(async (i) => {
    if (i > 0) doc.addPage([p.w, p.h], _pageOrient(p));
    doc.addImage(await _pdfPageJpeg(dpi, boost, quality), 'JPEG', 0, 0, p.w, p.h);
  });
  doc.save(filename);
  showToast(`✓ PDF mit ${_pages.length} Seite(n) exportiert`);
}

async function exportPDFPrint() { return _exportPDF(_PDF_PRINT.dpi, _PDF_PRINT.boost, _PDF_PRINT.q, 'layout-print-hq.pdf'); }
async function exportPDFStandard() { return _exportPDF(150, false, 0.92, 'layout-standard.pdf'); }

// Raster-Bild (PNG/JPG) in EXPORT_DPI: eine Datei pro Seite, ggf. als ZIP.
async function _exportRaster(ext, mime, quality) {
  const multi = _pages.length > 1;
  const single = `layout-hq.${ext}`;
  const frame = _dxfOpts(_loadedLayout).frame; // Einstellung des geladenen Layouts
  const outputs = [];
  await _forEachExportPage(async (i) => {
    const c = await buildExportCanvas(EXPORT_DPI);
    if (frame) _drawSheetFrameOnCanvas(c); // Vollblatt-Rahmen (sichtbare Linie am Blattrand)
    outputs.push({ name: multi ? `seite-${i + 1}.${ext}` : single, blob: await _canvasToBlob(c, mime, quality) });
  });
  await _downloadPerPageOutputs(outputs, single, `layout-${EXPORT_DPI}dpi-${_pages.length}seiten.zip`);
}

async function exportPNG() { return _exportRaster('png', 'image/png'); }
async function exportJPG() { return _exportRaster('jpg', 'image/jpeg', 0.95); }

// ── PNG Sublimation Export ────────────────────────────────────────────────────
// Für Epson Sublimationsdrucker: 300 DPI, reiner weißer Grund (Sublimation druckt nur
// auf weiß), sRGB (nie CMYK), PNG verlustfrei (JPEG-Artefakte verfälschen Farben).
async function exportSublimation() {
  const p = getPg();
  const DPI = SUBLIMATION_DPI; // EINE Quelle — Canvas (_buildSublimationCanvas), Name und Toast identisch
  // Einmal vor der Seiten-Schleife berechnet — gilt für alle Seiten gemeinsam.
  const timestamp = _dayBerlin(); // Berliner Tag wie alle Datumsangaben (bis 08.10. UTC)
  const baseName = 'sublimation-' + p.w + 'x' + p.h + 'mm-' + DPI + 'dpi-' + timestamp;

  const multi = _pages.length > 1;
  const outputs = [];
  await _forEachExportPage(async (i) => {
    // PNG mit maximaler Qualität (keine Komprimierung = keine Artefakte)
    const c = await _buildSublimationCanvas();
    outputs.push({ name: multi ? `seite-${i + 1}.png` : `${baseName}.png`, blob: await _canvasToBlob(c, 'image/png') });
  });

  await _downloadPerPageOutputs(outputs, `${baseName}.png`, `${baseName}-${_pages.length}seiten.zip`);
  showToast(`✓ Sublimations-PNG exportiert (${DPI} DPI, ${p.w}×${p.h}mm)`);
}

// ── DXF Modal ─────────────────────────────────────────────────────────────────
function openDxfModal() {
  document.getElementById('export-menu').style.display = 'none';
  const modal = document.getElementById('dxf-modal');
  modal.style.display = 'flex';
  updateDxfMode();
}

// Painter für das Radio-Paar des DXF-Dialogs: markiert die aktive Zeile.
function _paintDxfRadio(checkedId, aLbl, bLbl) {
  const on = document.getElementById(checkedId).checked;
  document.getElementById(aLbl).style.borderColor = on ? 'var(--accent)' : 'var(--border)';
  document.getElementById(bLbl).style.borderColor = on ? 'var(--border)' : 'var(--accent)';
}
function updateDxfMode() { _paintDxfRadio('dxf-single', 'dxf-single-lbl', 'dxf-batch-lbl'); }

async function doExportDXF() {
  document.getElementById('dxf-modal').style.display = 'none';
  const frame = _dxfOpts(_loadedLayout).frame; // Einstellung des geladenen Layouts
  const modeEl = document.querySelector('input[name="dxf-mode"]:checked');
  const isBatch = modeEl && modeEl.value === 'batch';
  if (isBatch) {
    await exportDXFBatch(false, true, frame);
  } else {
    await exportDXFSingle(false, true, frame);
  }
}

// ── Font Cache für opentype.js ────────────────────────────────────────────────
const _otFontCache = {}; // cacheKey → opentype.Font | null

// Server-Font-Liste (einmal holen, cachen) — um Dateinamen case-insensitiv aufzulösen
// Gemerkt wird das Versprechen: gleichzeitige Aufrufe beim Start fragten sonst jeder für sich an.
let _serverFontListCache = null;
function getServerFontList() {
  if (!_serverFontListCache) _serverFontListCache = _apiJson('/v2/fonts').then(l => (Array.isArray(l) ? l : []), e => {
    // Fehlschlag NICHT merken: sonst zeichnete der ganze Lauf mit Ersatzschrift.
    console.error('Schriftliste nicht ladbar:', e.message);
    _serverFontListCache = null;
    return [];
  });
  return _serverFontListCache;
}
// Amazon-Family-Name → lokaler Dateiname. Dieselbe Schriftdatei kommt unter mehreren Namen aus den
// Listings („Monotype“, „Monotype Corsiva“, der Tippfehler „Monotyp“ — byte-identisch). Ohne diese
// Zuordnung fiele loadOTFont auf die Amazon-URL zurück; ist Amazon nicht erreichbar, gäbe es keine
// Kontur und die Maschine gravierte ihre Standardschrift. Schlüssel kleingeschrieben, Leerzeichen egal.
const FONT_ALIAS = {
  'monotypecorsiva': 'Monotype',
  'monotyp': 'Monotype',
  // Ersatz für Dalih (Schreibschrift.ttf, Umlaute leer) seit 07.10.2026; Amazon-Name "Alex Brush"
  'alexbrush': 'AlexBrush',
};
// Schriftdatei → Name ohne Endung ("Monotype.TTF" → "Monotype") — unter diesem Namen ist sie registriert.
function _schriftStamm(datei) { return String(datei).replace(/\.(ttf|otf|woff2?)$/i, ''); }
// stem (Name ohne Endung) → exakter Server-Dateiname, Groß-/Kleinschreibung egal.
// Behebt das Linux-Problem: "Monotype.TTF" liegt da, angefragt wird "Monotype.ttf".
function matchServerFontFile(list, name) {
  if (!name) return null;
  let stem = _schriftStamm(name.split('/').pop().split('?')[0]).toLowerCase();
  const treffer = (s) => list.find(fn => _schriftStamm(fn).toLowerCase() === s);
  return treffer(stem) || treffer((FONT_ALIAS[stem.replace(/\s+/g, '')] || '').toLowerCase()) || null;
}

async function loadOTFont(fontName, opts = {}) {
  const cacheKey = (fontName || '') + '|' + (opts.url || '') + '|' + (opts.rawFamily || '');
  if (cacheKey in _otFontCache) return _otFontCache[cacheKey];

  const list = await getServerFontList();

  // Kandidaten-Quellen in Reihenfolge der Zuverlässigkeit.
  // Die ersten sind lokal (kein CORS-Problem); die Amazon-URL ist der letzte Versuch.
  const candidates = [];
  // 1) Exakte Server-Datei case-insensitiv auflösen (vermeidet .TTF/.ttf-404)
  for (const n of [opts.rawFamily, opts.url, fontName]) {
    const file = matchServerFontFile(list, n);
    if (file) {
      const u = `${BASE_URL}/v2/fonts/${encodeURIComponent(file)}`;
      if (!candidates.includes(u)) candidates.push(u);
    }
  }
  // 2) Fallback: geratene Endungen (falls Liste leer/nicht erreichbar)
  if (opts.rawFamily) candidates.push(`${BASE_URL}/v2/fonts/${encodeURIComponent(opts.rawFamily + '.ttf')}`);
  if (opts.url) {
    // Server legt die Bestell-Schrift evtl. unter dem Original-Dateinamen ab (z.B. <uuid>.ttf)
    const base = opts.url.split('/').pop().split('?')[0];
    if (base) candidates.push(`${BASE_URL}/v2/fonts/${encodeURIComponent(base)}`);
  }
  if (fontName) candidates.push(`${BASE_URL}/v2/fonts/${encodeURIComponent(fontName + '.ttf')}`);
  if (opts.url) candidates.push(opts.url); // letzter Versuch: direkt von Amazon (kann an CORS scheitern)

  for (const url of candidates) {
    try {
      let font;
      if (url.startsWith(BASE_URL) || url.startsWith('/v2/')) {
        const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const resp = await fetch(url, { headers, credentials: 'include' });
        if (!resp.ok) continue;
        const buf = await resp.arrayBuffer();
        font = opentype.parse(buf);
      } else {
        font = await opentype.load(url);
      }
      _gsubExtensionAuspacken(font);
      _otFontCache[cacheKey] = font;
      return font;
    } catch (e) { /* nächsten Kandidaten versuchen */ }
  }
  console.warn('opentype: Schrift nicht ladbar → Fallback auf TEXT-Entity. name:', fontName, '| family:', opts.rawFamily || '-', '| url:', opts.url || '-');
  // Fehlschläge bewusst NICHT cachen: Wird die Schrift später hochgeladen,
  // soll der nächste Export sie sofort finden (ohne Seiten-Neuladen).
  return null;
}

// opentype.js 1.3.4 kennt im GSUB keine Extension-Lookups (Typ 7) — und Arial.TTF packt ALLE Lookups
// so ein. Lateinischer Text läuft daran vorbei, arabischer warf in getPath und riss die GANZE DXF des
// Layouts mit. Typ 7 ist nur eine Hülle um einen gewöhnlichen Lookup: Hülle entfernen, dann formt
// opentype.js Arabisch verbunden (init/medi/fina/rlig). Alles Nicht-Arabische bleibt bitgleich.
function _gsubExtensionAuspacken(font) {
  try {
    for (const lk of font?.tables?.gsub?.lookups || []) {
      if (lk.lookupType !== 7 || !lk.subtables?.length) continue;
      const typ = lk.subtables[0].lookupType;
      // Spec: alle Subtabellen eines Extension-Lookups tragen denselben inneren Typ
      if (!lk.subtables.every(st => st && st.extension && st.lookupType === typ)) continue;
      lk.lookupType = typ;
      lk.subtables = lk.subtables.map(st => st.extension);
    }
  } catch (e) {
    console.warn('opentype: GSUB-Extension nicht ausgepackt:', e.message);
  }
}

// ── Emojis & Bildzeichen im Gravurtext ────────────────────────────────────────
// Kunden tippen Emojis mit („Sara ❤️", „♾️ F+K ♾️"). Keine Kundenschrift hat sie — opentype.js setzte
// die .notdef, die Maschine gravierte einen Kasten (bei „❤️" zwei: ❤ + unsichtbares U+FE0F), und der
// Kasten machte über die feste Gravurhöhe die ganze Zeile kleiner. Jetzt zerlegt _emojiTeile die Zeile:
// Bildzeichen, die die Feldschrift nicht hat, kommen einfarbig aus Noto Emoji (OFL), Symbole wie ♡ ⋆ ✮
// aus DejaVu Sans. Ein Emoji steht auf der Grundlinie und ist so hoch wie ein „H" → die Buchstaben
// bleiben gleich groß. DXF, Vorschau, PNG und PDF nutzen dieselbe Zerlegung und dieselben Glyphen.
const EMOJI_HOEHE = 1.0;               // Emoji-Höhe relativ zur Versalhöhe der Feldschrift
const _VS = /[︎️]/g, _VS1 = /[︎️]/;   // Varianten-Selektoren (unsichtbar)
// Kandidaten: Piktogramme, Flaggenbuchstaben, Keycaps, Symbole — nie Buchstaben, Ziffern, Satzzeichen.
const _BILDZEICHEN = /\p{Extended_Pictographic}|\p{Regional_Indicator}|⃣|\p{So}|\p{Sm}/u;
// Immer Emoji, auch wenn die Schrift das Grundzeichen hat — so zeigt es das Handy des Kunden.
const _EMOJI_PFLICHT = /\p{Emoji_Presentation}|\p{Regional_Indicator}|\p{Emoji_Modifier}|[⃣‍️]/u;
// Noto zeichnet Farbe als Muster (❤ gestreift, 💙 kariert) — auf Metall sinnlos: volles Herz.
const _EMOJI_GLYPHE = { '❤': '♥', '🧡': '♥', '💛': '♥', '💚': '♥', '💙': '♥', '💜': '♥', '🤎': '♥', '🖤': '♥', '🩷': '♥', '🩵': '♥', '🩶': '♥' };
// Noto setzt ♾ weiß in einen schwarzen Kasten — gemeint ist das Unendlich-Zeichen, als Text.
const _EMOJI_TEXT = { '♾': '∞' };
const _graphemeTeiler = (typeof Intl !== 'undefined' && Intl.Segmenter) ? new Intl.Segmenter('de', { granularity: 'grapheme' }) : null;
// Text → sichtbare Zeichen (👨‍👩‍👧, 🇩🇪, ❤️ je EIN Eintrag). Ohne Segmenter: Codepunkte.
const _grapheme = str => _graphemeTeiler ? Array.from(_graphemeTeiler.segment(String(str ?? '')), x => x.segment) : Array.from(String(str ?? ''));
let _emojiSchriften = null;   // { noto, dejavu, lig, box, dvCap } — nach _emojiLaden()
let _arialOT = null;          // Arial als opentype-Schrift (s. _fremdZeichen) — nach _emojiLaden()
let _emojiLadenP = null;
let _emojiAn = true;          // Einstellung „Emojis übernehmen" (settings.json → emoji.gravieren)
const _emojiSchalterAn = s => s?.emoji?.gravieren !== false;   // fehlt der Wert: an

// Schriften + Einstellung EINMAL laden; Export-Wege warten darauf, die Vorschau zeichnet danach neu.
function _emojiLaden() {
  if (!_emojiLadenP) _emojiLadenP = (async () => {
    if (typeof opentype === 'undefined') return;
    const lade = async (datei) => {
      try { return await opentype.load(`${BASE_URL}/vendor/fonts/${datei}`); }
      catch (e) { console.warn('Emoji-Schrift nicht ladbar:', datei, e.message); return null; }
    };
    const [noto, dejavu, arial] = await Promise.all([lade('NotoEmoji.ttf'), lade('DejaVuSans.ttf'),
    loadOTFont('Arial', { rawFamily: 'Arial' }).catch(() => null)]);
    _arialOT = arial || null;
    await _emojiEinstellungLaden();
    if (noto || dejavu) _emojiSchriften = {
      noto, dejavu,
      lig: noto ? _emojiLigaturen(noto) : new Map(),
      box: noto ? noto.charToGlyph('😀').getBoundingBox() : null,   // Emoji-Box = Höhe der Gesichter
      dvCap: dejavu ? dejavu.charToGlyph('H').getBoundingBox().y2 : 0,
    };
    _fitPtCache.clear();
    if (!IS_AUTOEXPORT) scheduleRender();
  })();
  return _emojiLadenP;
}
async function _emojiEinstellungLaden() {
  try { _emojiAn = _emojiSchalterAn(await _apiJson('/v2/settings')); }
  catch (_) { /* Server nicht erreichbar → Standard: an */ }
}

// Emoji-Folgen (Familie, Hautton, Flagge, Keycap) sind in Noto ccmp-Ligaturen; opentype.js 1.3.4
// wendet ccmp nicht an → Tabelle „Glyph-IDs der Folge" → Ligatur-Glyphe selbst aufbauen.
function _emojiLigaturen(font) {
  const map = new Map();
  try {
    const gsub = font.tables.gsub;
    const cov = c => c.format === 1 ? c.glyphs
      : c.ranges.flatMap(r => Array.from({ length: r.end - r.start + 1 }, (_, i) => r.start + i));
    for (const ft of gsub.features) if (ft.tag === 'ccmp') for (const li of ft.feature.lookupListIndexes) {
      const lk = gsub.lookups[li];
      if (lk.lookupType !== 4) continue;
      for (const st of lk.subtables) {
        const erste = cov(st.coverage);
        st.ligatureSets.forEach((set, i) => set.forEach(l => map.set([erste[i], ...l.components].join(','), l.ligGlyph)));
      }
    }
  } catch (e) { console.warn('Emoji-Ligaturen nicht lesbar:', e.message); }
  return map;
}

// Glyphe für ein Bildzeichen (ohne Varianten-Selektoren) → { glyph, quelle, vereinfacht } oder null.
// quelle 'emoji' = Noto (Emoji-Box auf Versalhöhe), 'symbol' = DejaVu (wie ein Buchstabe skaliert).
function _ersatzGlyphe(z) {
  const es = _emojiSchriften;
  if (!es) return null;
  const cps = [...(_EMOJI_GLYPHE[z] || z)];
  const dejavu = () => {
    const gi = (es.dejavu && cps.length === 1) ? es.dejavu.charToGlyphIndex(cps[0]) : 0;
    return gi > 0 ? { glyph: es.dejavu.glyphs.get(gi), quelle: 'symbol' } : null;
  };
  // Symbole ohne Emoji-Eigenschaft (∞ ⋆ ✮ ♡ ★) sind Schriftzeichen → zuerst DejaVu.
  const textArtig = cps.length === 1 && !/\p{Emoji}/u.test(cps[0]);
  if (textArtig && dejavu()) return dejavu();
  if (es.noto) {
    const ids = cps.map(c => es.noto.charToGlyphIndex(c));
    const lig = ids.length > 1 ? es.lig.get(ids.join(',')) : undefined;
    if (lig !== undefined) return { glyph: es.noto.glyphs.get(lig), quelle: 'emoji' };
    if (ids.length === 1 && ids[0] > 0) return { glyph: es.noto.glyphs.get(ids[0]), quelle: 'emoji' };
    // Unbekannte Folge (neueres Emoji): Grundform. Nicht bei Flaggen — deren erstes Zeichen ist
    // ein Buchstabe im Kasten.
    if (ids[0] > 0 && !/\p{Regional_Indicator}/u.test(cps[0]))
      return { glyph: es.noto.glyphs.get(ids[0]), quelle: 'emoji', vereinfacht: true };
  }
  return dejavu();
}

const _hatBildzeichen = s => _BILDZEICHEN.test(s) || _VS1.test(s);
// Zeichen ohne Glyphe in der Schrift (ツ in Monotype Corsiva) wären ein .notdef-Kasten → _emojiTeile
// lässt sie weg. _fremdZeichen = sichtbares Zeichen, das auch Arial nicht hat: nur dann kann es der
// Feldschrift fehlen (was Arial hat, graviert loadOTFontFuerText in Arial). Synchron für die Vorschau.
const _fehltIn = (font, s) => Array.from(s).some(c => c !== '\n' && c !== '\r' && font.charToGlyphIndex(c) === 0);
const _fremdZeichen = s => !!_arialOT && Array.from(s).some(c => !_OT_UNSICHTBAR.test(c) && !_BILDZEICHEN.test(c) && _arialOT.charToGlyphIndex(c) === 0);
// Nur Gravurtext (type 'text') — Nummern- und statische Felder bleiben, wie sie sind.
const _bzFeld = (f, txt) => f.type === 'text' && (_hatBildzeichen(String(txt || '')) || _fremdZeichen(String(txt || '')));

// Zeile → Abschnitte. { s } = Text in der Feldschrift; { z, g, quelle } = Bildzeichen aus der
// Ersatzschrift (z = was der Kunde schrieb); { z, fehlt } / { z, aus } = wird weggelassen.
// font = opentype-Schrift, in der das Feld graviert wird; null = noch unbekannt → nur Pflicht-Emojis
// werden ersetzt, alles andere bleibt Text. Varianten-Selektoren fallen immer weg.
function _emojiTeile(line, font) {
  const str = String(line ?? '');
  if (!_hatBildzeichen(str) && !(font && _fehltIn(font, str))) return [{ s: str }];
  const teile = [];
  let text = '';
  // Weggelassenes hinterlässt keine Rand- oder Doppel-Leerzeichen: „Sara ❤️" → „Sara" (sonst sitzt
  // der Name um ein halbes Leerzeichen neben der Mitte), „A ♾️ B" → „A B". Der Leerraum um eine
  // Lücke wird zurückgehalten und nur als EIN Leerzeichen gesetzt, wenn davor und danach etwas steht.
  let nachWeg = false, luecke = false;
  const weg = t => {
    if (/\s$/.test(text)) { luecke = true; text = text.replace(/\s+$/, ''); }
    if (text) { teile.push({ s: text }); text = ''; }
    teile.push(t);
    nachWeg = true;
  };
  for (const g of _grapheme(str)) {
    let z = g.replace(_VS, '');
    if (!z) continue;
    if (nachWeg) {
      if (/^\s+$/.test(z)) { luecke = true; continue; }
      if (luecke && (text || teile.some(t => (t.s != null && t.s.trim()) || t.g))) text += ' ';
      nachWeg = luecke = false;
    }
    if (!_BILDZEICHEN.test(z)) {
      if (font && _fehltIn(font, z)) {
        // Fehlt der Schrift: Sonder-Leerzeichen → normales, Unsichtbares fällt still weg, Rest weglassen
        const leer = font.charToGlyphIndex(' ') > 0 ? ' ' : '';
        z = [...z].map(c => font.charToGlyphIndex(c) > 0 ? c : /\s/.test(c) ? leer : /\p{Cf}/u.test(c) ? '' : c).join('');
        if (_fehltIn(font, z)) { weg({ z: g, fehlt: true }); continue; }
      }
      text += z;
      continue;
    }
    const alsText = _emojiAn ? _EMOJI_TEXT[z] : undefined;   // aus = auch ♾ → ∞ entfällt
    const pflicht = !alsText && _EMOJI_PFLICHT.test(g);
    if (alsText) z = alsText;
    const hat = !!font && [...z].every(c => font.charToGlyphIndex(c) > 0);
    if (!pflicht && (hat || !font)) { text += z; continue; }
    const e = _emojiAn ? _ersatzGlyphe(z) : null;
    if (!e) { weg(_emojiAn ? { z: g, fehlt: true } : { z: g, aus: true }); continue; }
    if (text) { teile.push({ s: text }); text = ''; }
    teile.push({ z: g, g: e.glyph, quelle: e.quelle, vereinfacht: !!e.vereinfacht });
  }
  if (text || !teile.length) teile.push({ s: text });
  return teile;
}

// Einheiten auf dem Kreisbogen — EINE Regel für Vorschau und DXF: Zeilen mit Leerzeichen verbunden,
// Buchstaben einzeln, ein Bildzeichen (auch 👨‍👩‍👧) als eine Einheit, Weggelassenes fällt raus.
// font wird nur bei Bildzeichen/fehlenden Zeichen gebraucht (s. _emojiTeile). teile = Abschnitte (sonst null).
function _bogenEinheiten(f, txt, font) {
  const flach = String(txt).replace(/\s*\n\s*/g, ' ');
  if (!_bzFeld(f, txt) && !(f.type === 'text' && font && _fehltIn(font, flach)))
    return { chars: Array.from(flach), teile: null };
  const teile = _emojiTeile(flach, font);
  return { chars: teile.flatMap(t => t.s != null ? Array.from(t.s) : (t.g ? [t] : [])), teile };
}

// Maße eines Bildzeichens in Vielfachen der Versalhöhe C: k = Skalierung je Glyph-Einheit, dy =
// Anhebung über die Grundlinie, adv = Vorschub, oben/unten = Tinte über/unter der Grundlinie (y-up).
function _ersatzMass(t) {
  const es = _emojiSchriften;
  let k, dy = 0;
  if (t.quelle === 'emoji') { const b = es.box; k = EMOJI_HOEHE / ((b.y2 - b.y1) || 1); dy = -b.y1 * k; }
  else k = 1 / (es.dvCap || 1493);
  const bb = t.g.getBoundingBox();
  const upm = (t.quelle === 'emoji' ? es.noto : es.dejavu).unitsPerEm;
  return { k, dy, upm, adv: (t.g.advanceWidth || 0) * k, oben: bb.y2 * k + dy, unten: bb.y1 * k + dy };
}
// Versalhöhe in Schrift-Einheiten (Oberkante „H") — Canvas misst dasselbe per measureText('H').
function _capEinheiten(font) {
  if (font._capE == null) font._capE = font.charToGlyphIndex('H') > 0
    ? font.charToGlyph('H').getBoundingBox().y2 : font.unitsPerEm * 0.7;
  return font._capE;
}

// Zeile als EIN opentype-Pfad + Vorschub (Einheiten wie font.getPath(line, 0, 0, fs)). Ohne
// Bildzeichen exakt font.getPath(line) → Texte ohne Emoji bleiben bitgleich.
function _zeilePfad(font, line, fs) {
  const teile = _emojiTeile(line, font);
  if (teile.length === 1 && teile[0].s != null) {
    const s = teile[0].s;
    return { path: font.getPath(s, 0, 0, fs), adv: font.getAdvanceWidth(s, fs), teile };
  }
  const C = _capEinheiten(font) * fs / font.unitsPerEm;
  const path = new opentype.Path();
  let x = 0;
  for (const t of teile) {
    if (t.s != null) {
      if (t.s) { path.extend(font.getPath(t.s, x, 0, fs)); x += font.getAdvanceWidth(t.s, fs); }
    } else if (t.g) {
      const m = _ersatzMass(t);
      path.extend(t.g.getPath(x, -m.dy * C, m.k * C * m.upm));
      x += m.adv * C;
    }
  }
  return { path, adv: x, teile };
}

// ── Canvas-Gegenstück (Vorschau, PNG, PDF) — dieselben Abschnitte und Glyphen ──
function _teileBreite(ctx, teile, C = _capPx(ctx)) {
  let w = 0;
  for (const t of teile) {
    if (t.s != null) { if (t.s) w += ctx.measureText(t.s).width; }
    else if (t.g) w += _ersatzMass(t).adv * C;
  }
  return w;
}
// Tinte über/unter der Grundlinie wie measureText().actualBoundingBox… (NaN = nichts Sichtbares).
function _teileTinte(ctx, teile) {
  const C = _capPx(ctx);
  let asc = -Infinity, desc = -Infinity;
  for (const t of teile) {
    if (t.s != null) {
      if (!t.s.trim()) continue;
      const m = ctx.measureText(t.s);
      asc = Math.max(asc, m.actualBoundingBoxAscent); desc = Math.max(desc, m.actualBoundingBoxDescent);
    } else if (t.g) {
      const m = _ersatzMass(t);
      asc = Math.max(asc, m.oben * C); desc = Math.max(desc, -m.unten * C);
    }
  }
  return { asc: Number.isFinite(asc) ? asc : NaN, desc: Number.isFinite(desc) ? desc : NaN };
}
// Zeichnet die Abschnitte an (x, y) = Anker + Grundlinie; beachtet ctx.textAlign wie fillText.
function _teileZeichnen(ctx, teile, x, y) {
  const al = ctx.textAlign, C = _capPx(ctx);
  const W = _teileBreite(ctx, teile, C);
  let cx = al === 'center' ? x - W / 2 : (al === 'right' || al === 'end') ? x - W : x;
  ctx.textAlign = 'left';
  for (const t of teile) {
    if (t.s != null) {
      if (t.s) { ctx.fillText(t.s, cx, y); cx += ctx.measureText(t.s).width; }
    } else if (t.g) {
      const m = _ersatzMass(t);
      const p = t.g.getPath(cx, y - m.dy * C, m.k * C * m.upm);
      p.fill = ctx.fillStyle;
      p.draw(ctx);
      cx += m.adv * C;
    }
  }
  ctx.textAlign = al;
}

// Feldschrift für die Bildzeichen-Entscheidung im Canvas: dasselbe Ergebnis wie im DXF
// (loadOTFontFuerText, inkl. Arial-Ersatz). Synchron aus dem Speicher; fehlt sie, wird geladen und
// neu gezeichnet — bis dahin gelten nur Pflicht-Emojis. Export-Wege warten per _otFeldSchriftLaden.
const _otFeldMemo = new Map();
const _otFeldKey = (f, txt) => `${_feldSchrift(f)}|${f._fontUrl || ''}|${f._fontRawFamily || ''}|${txt}`;
async function _otFeldSchriftLaden(f, txt) {
  const key = _otFeldKey(f, txt);
  if (_otFeldMemo.has(key) && _otFeldMemo.get(key) !== undefined) return _otFeldMemo.get(key);
  _otFeldMemo.set(key, undefined);
  let font = null;
  try { font = await loadOTFontFuerText(_feldSchrift(f), { url: f._fontUrl, rawFamily: f._fontRawFamily, bild: true }, txt); } catch (_) { }
  if (_otFeldMemo.size > 3000) _otFeldMemo.clear();
  _otFeldMemo.set(key, font || null);
  return font || null;
}
function _otFeldSchrift(f, txt) {
  const key = _otFeldKey(f, txt);
  if (_otFeldMemo.has(key)) return _otFeldMemo.get(key) || null;
  if (typeof opentype !== 'undefined')
    _otFeldSchriftLaden(f, txt).then(font => { _fitPtCache.clear(); if (font && !IS_AUTOEXPORT) scheduleRender(); });
  return null;
}

// Anfang und Ende eines Hinweises zu einem Feld: „<Bestellnr>: …" und „ (<Layout>)"
const _hinweisFeld = f => [`${f.orderId || 'Feld ' + f.id}: `, _exportLayoutJetzt ? ` (${_exportLayoutJetzt})` : ''];
// Was mit den Bildzeichen eines Felds passiert ist → status.txt („⚠") und Übersicht, auch im
// normalen Lauf: vor dem Lasern draufschauen. Schlüssel = Text → DXF und PNG/PDF melden einmal.
function _emojiHinweise(f, teile) {
  const art = { ok: [], einfach: [], weg: [], aus: [] };
  for (const t of teile) {
    if (t.s != null) continue;
    (t.aus ? art.aus : t.fehlt ? art.weg : t.vereinfacht ? art.einfach : art.ok).push(t.z);
  }
  const [wer, wo] = _hinweisFeld(f), z = a => [...new Set(a)].join(' ');
  if (art.ok.length) _exportHinweise.set(`${wer}Emoji „${z(art.ok)}" übernommen${wo} — vor dem Lasern ansehen`, { layout: 'Emoji' });
  if (art.einfach.length) _exportHinweise.set(`${wer}Emoji „${z(art.einfach)}" in Grundform übernommen${wo}`, { layout: 'Emoji' });
  if (art.weg.length) _exportHinweise.set(`${wer}Zeichen „${z(art.weg)}" nicht gravierbar — weggelassen${wo}, Platz prüfen`, { layout: 'Emoji' });
  if (art.aus.length) _exportHinweise.set(`${wer}Emoji „${z(art.aus)}" weggelassen — Emojis sind ausgeschaltet${wo}`, { layout: 'Emoji' });
}

// Zeichen, das der gravierten Schrift auch nach Arial-Ersatz (loadOTFontFuerText) und Emoji-Ersatz
// fehlt (Katakana „ツ"): opentype.js setzt die .notdef, die Maschine graviert einen Kasten. Gravurtext
// lässt _emojiTeile weg (Hinweis „weggelassen"); übrig bleiben statische/Nummernfelder → Hinweis in
// status.txt, der Pfad bleibt. strs = genau die Texte, die in der Feldschrift gesetzt werden.
function _tofuHinweis(f, font, strs, schrift) {
  const fehlt = [...new Set(strs.flatMap(s => Array.from(String(s ?? ''))))].filter(c => font.charToGlyphIndex(c) === 0);
  if (!fehlt.length) return;
  const zeig = c => /[\s\p{Cf}\p{Mn}]/u.test(c) ? 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0') : c;
  const name = font.names?.fontFamily?.en || schrift;
  const kasten = font.glyphs.get(0)?.getPath(0, 0, font.unitsPerEm).commands.length > 0;
  const [wer, wo] = _hinweisFeld(f);
  _exportHinweise.set(`${wer}Zeichen „${fehlt.map(zeig).join(' ')}" fehlt in Schrift ${name}${wo} — ${kasten ? 'Kasten' : 'Lücke'}, vor dem Lasern ansehen`, { layout: 'Hinweis' });
}

// Fehlt der Kundenschrift ein Zeichen, setzt opentype.js die .notdef-Glyphe — ein Rechteck, das die
// Maschine mitgraviert (Amazons Vorschau fiel still auf eine Systemschrift zurück, der Kunde sah
// seinen Text lesbar). Darum: hat Arial ALLE fehlenden Zeichen, wird das ganze FELD in Arial graviert
// (eine Schrift je Feld). Unsichtbares (Leerraum, Steuerzeichen, Varianten-Selektor) zählt nicht,
// bei Gravurtext (opts.bild) auch keine Bildzeichen (❤ ♡ 🤍 ⋆) — die setzt _emojiTeile ein.
const _OT_UNSICHTBAR = /[\s\p{Cf}︀-️]/u;
async function loadOTFontFuerText(fontName, opts, txt) {
  const font = await loadOTFont(fontName, opts);
  if (!font) return font;
  const fehlt = Array.from(String(txt || ''))
    .filter(ch => !_OT_UNSICHTBAR.test(ch) && !(opts.bild && _BILDZEICHEN.test(ch)) && font.charToGlyphIndex(ch) === 0);
  if (!fehlt.length) return font;
  const arial = await loadOTFont('Arial', { rawFamily: 'Arial' });
  if (!arial || fehlt.some(ch => arial.charToGlyphIndex(ch) === 0)) return font;
  console.warn(`DXF: Schrift „${opts.rawFamily || fontName}" hat keine Zeichen für „${[...new Set(fehlt)].join('')}" — Feld wird in Arial graviert:`, String(txt));
  _exportHinweise.set(`${_exportLayoutJetzt ? _exportLayoutJetzt + ': ' : ''}„${String(txt).trim()}" in Arial statt ${opts.rawFamily || fontName} — die Schrift hat kein „${[...new Set(fehlt)].join('')}"`, { layout: 'Hinweis', nurRekla: true });
  return arial;
}

// Einen Punkt um ein Zentrum drehen — DIE Drehformel des DXF-Exports, gemeinsam für
// Buchstaben-Konturen, TEXT-Entity-Fallback und Bild-Rechteck. Alle drei MÜSSEN dieselbe
// Achse und dasselbe Vorzeichen benutzen, sonst sitzen Text und Bild derselben Seite
// verdreht zueinander. rot = { a (rad, y-up), cx, cy }; cos/sin optional durchgereicht.
function _rotPt(px, py, rot, cosA, sinA) {
  if (!rot || !rot.a) return [px, py];
  const c = cosA !== undefined ? cosA : Math.cos(rot.a);
  const s = sinA !== undefined ? sinA : Math.sin(rot.a);
  const dx = px - rot.cx, dy = py - rot.cy;
  return [rot.cx + dx * c - dy * s, rot.cy + dx * s + dy * c];
}

// Schreibschriften (Alex Brush, Dalih) überlappen an den Buchstaben-Übergängen. Ezcad füllt
// gerade-ungerade → jede Überlappung blieb ungraviert (weiße Schlitze, am dünnen i deutlich).
// Seit 29.10.2026 Standard für alle Layouts (auch Autoexport): jede Zeile wird vorab zu EINER
// Fläche vereinigt (nonzero = wie die Vorschau, auch Emoji-Überlappungen). Nur die
// Layout-Einstellung „Umriss – Buchstaben einzeln“ (dxfStyle 'einzeln') lässt die Konturen getrennt.
// Heraus kommt ein Pfad nur aus M/L/Z, Kurven mit derselben Unterteilung wie in otPathToDXF.
// Ohne vendor/clipper.js oder bei einem Fehler bleibt der Pfad unverändert.
function _konturenVereinigen(otPath) {
  if (typeof ClipperLib === 'undefined' || !otPath || !otPath.commands.length) return otPath;
  const K = 100; // Clipper rechnet ganzzahlig → 1/100 Font-Einheit
  const polys = [];
  let pts = null, pv = [0, 0];
  const pt = (x, y) => { pts.push({ X: Math.round(x * K), Y: Math.round(y * K) }); pv = [x, y]; };
  for (const cmd of otPath.commands) {
    if (cmd.type === 'M') { pts = []; polys.push(pts); pt(cmd.x, cmd.y); }
    else if (!pts) continue;
    else if (cmd.type === 'L') pt(cmd.x, cmd.y);
    else if (cmd.type === 'C') {
      const [x0, y0] = pv;
      for (let s = 1; s <= 12; s++) {
        const t = s / 12, mt = 1 - t;
        pt(mt * mt * mt * x0 + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x,
          mt * mt * mt * y0 + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y);
      }
    } else if (cmd.type === 'Q') {
      const [x0, y0] = pv;
      for (let s = 1; s <= 8; s++) {
        const t = s / 8, mt = 1 - t;
        pt(mt * mt * x0 + 2 * mt * t * cmd.x1 + t * t * cmd.x, mt * mt * y0 + 2 * mt * t * cmd.y1 + t * t * cmd.y);
      }
    }
  }
  try {
    const c = new ClipperLib.Clipper(), aus = [];
    c.AddPaths(polys.filter(p => p.length >= 3), ClipperLib.PolyType.ptSubject, true);
    const nz = ClipperLib.PolyFillType.pftNonZero;
    if (!c.Execute(ClipperLib.ClipType.ctUnion, aus, nz, nz) || !aus.length) return otPath;
    const commands = [];
    for (const p of aus) {
      if (p.length < 3) continue;
      commands.push({ type: 'M', x: p[0].X / K, y: p[0].Y / K });
      for (let i = 1; i < p.length; i++) commands.push({ type: 'L', x: p[i].X / K, y: p[i].Y / K });
      commands.push({ type: 'Z' });
    }
    return { commands };
  } catch (e) {
    console.warn('Konturen vereinigen fehlgeschlagen — Zeile unverändert:', e && e.message);
    return otPath;
  }
}

// Konvertiert opentype Path zu DXF R12 POLYLINE/VERTEX/SEQEND Entities
// LWPOLYLINE existiert erst ab R2000 — EZCad2-Lite braucht R12 = POLYLINE
function otPathToDXF(otPath, offsetX, offsetY, scaleX, scaleY, layer, rot) {
  layer = layer || 'Gravur';
  // cos/sin EINMAL vorab: tp läuft pro Vertex, bei einer Batch-DXF sind das Zehntausende.
  const cosA = rot && rot.a ? Math.cos(rot.a) : 1;
  const sinA = rot && rot.a ? Math.sin(rot.a) : 0;
  const tp = (px, py) => _rotPt(px, py, rot, cosA, sinA);
  const lines = [];
  let pts = [];
  const flush = () => {
    if (pts.length < 2) { pts = []; return; }
    // R12: POLYLINE → n×VERTEX → SEQEND
    const seg = ['0', 'POLYLINE', '8', layer, '66', '1', '70', '0'];
    pts.forEach(function (p) {
      const [X, Y] = tp(offsetX + p[0] * scaleX, offsetY - p[1] * scaleY);
      seg.push('0', 'VERTEX', '8', layer);
      seg.push('10', X.toFixed(4));
      seg.push('20', Y.toFixed(4));
      seg.push('30', '0.0');
    });
    seg.push('0', 'SEQEND');
    lines.push(seg.join('\n'));
    pts = [];
  };
  otPath.commands.forEach(function (cmd) {
    if (cmd.type === 'M') { flush(); pts.push([cmd.x, cmd.y]); }
    else if (cmd.type === 'L') { pts.push([cmd.x, cmd.y]); }
    else if (cmd.type === 'C') {
      const pv = pts.length ? pts[pts.length - 1] : [0, 0];
      for (let s = 1; s <= 12; s++) {
        const t = s / 12, mt = 1 - t;
        pts.push([mt * mt * mt * pv[0] + 3 * mt * mt * t * cmd.x1 + 3 * mt * t * t * cmd.x2 + t * t * t * cmd.x,
        mt * mt * mt * pv[1] + 3 * mt * mt * t * cmd.y1 + 3 * mt * t * t * cmd.y2 + t * t * t * cmd.y]);
      }
    } else if (cmd.type === 'Q') {
      const pv = pts.length ? pts[pts.length - 1] : [0, 0];
      for (let s = 1; s <= 8; s++) {
        const t = s / 8, mt = 1 - t;
        pts.push([mt * mt * pv[0] + 2 * mt * t * cmd.x1 + t * t * cmd.x,
        mt * mt * pv[1] + 2 * mt * t * cmd.y1 + t * t * cmd.y]);
      }
    } else if (cmd.type === 'Z') {
      if (pts.length) pts.push([pts[0][0], pts[0][1]]);
      flush();
    }
  });
  flush();
  return lines.join('\n');
}

// Baut nur die ENTITIES-Zeilen (kein Header/Footer). yOffset verschiebt eine ganze Seite
// vertikal, damit mehrere überlappungsfrei in EINER DXF gestapelt werden können.
async function _buildDXFEntities(fieldsSubset, isFilled, isVector, yOffset = 0, asBlock = false, blockCtr = { n: 0 }, bildRahmen = true, zusammen = false) {
  const p = getPg();
  const flipY = (y, h = 0) => p.h - y - h + yOffset;
  let d = [];
  const blocks = []; // BLOCK-Definitionen (nur wenn asBlock) — jede = 1 Text = 1 Objekt in Ezcad

  // Zeilen-Layer: jedes Textfeld liegt auf einem eigenen Layer "Gravur_N" — N ist die
  // Zeilen-Position auf der Seite (oben → unten, bei gleicher Höhe links → rechts).
  // LEERE Zeilen zählen mit: fehlt Zeile 1, beginnt die Liste in Ezcad mit "Gravur_2" —
  // so sieht man links sofort, welche Position welcher Text ist und wo Lücken sind.
  // (Kein Leerzeichen im Namen — R12-Layernamen erlauben nur A-Z, 0-9, $, -, _.)
  const _rowLayer = new Map(
    fieldsSubset.filter(f => f.type === 'text')
      .slice().sort(_nachPosition)
      .map((f, i) => [f, 'Gravur_' + (i + 1)])
  );

  for (const f of fieldsSubset) {
    // Motiv: die Pfade liegen in mm mit Ursprung oben links → nur skalieren, in die
    // Feldbox einpassen (motivGeometrie) und y spiegeln. Eigener Layer, damit sich das
    // Ornament in Ezcad getrennt vom Text parametrieren lässt.
    if (_istMotiv(f)) {
      const name = f.ddFrage ? f._motivDatei : f.motivDatei;   // Dropdown-Motiv: das zur Antwort
      const m = _motivCache[name] || await motivPfade(name);
      const g = m && motivGeometrie(f, m);
      if (!g) { console.warn('DXF: Motiv fehlt oder unlesbar —', name); continue; }
      const rotM = f.rotation ? {
        a: -f.rotation * Math.PI / 180,
        cx: f.x + f.w / 2, cy: flipY(f.y, f.h) + f.h / 2
      } : null;
      for (const pf of m.pfade) {
        const pts = pf.pts.map(([px, py]) => {
          let X = g.ox + px * g.s, Y = flipY(g.oy + py * g.s);
          if (rotM) { const r = _rotPt(X, Y, rotM); X = r[0]; Y = r[1]; }
          return [X, Y];
        });
        if (pf.zu && (pts[0][0] !== pts[pts.length - 1][0] || pts[0][1] !== pts[pts.length - 1][1])) pts.push(pts[0]);
        d.push('0', 'POLYLINE', '8', 'Motiv', '66', '1', '70', '1');
        for (const [X, Y] of pts) d.push('0', 'VERTEX', '8', 'Motiv', '10', X.toFixed(4), '20', Y.toFixed(4), '30', '0.0');
        d.push('0', 'SEQEND', '8', 'Motiv');
      }
      continue;
    }
    if (_hasVecText(f)) {
      // txt/fsMM/fontName aus zentralem Helfer: Auto-Fit (dynamisch) bzw. fester
      // fontSize + staticText (statisch). usedFont nur für die Auto-Fit-Messung.
      const { txt, fsMM, fontName, capMM } = _vecTextProps(f);
      // Zeilen-Layer des Feldes (Nummern-/Statik-Felder bleiben auf "Gravur")
      const gravLayer = _rowLayer.get(f) || 'Gravur';
      // Ausrichtung wie in der Vorschau (_drawText): Standard = zentriert.
      const align = f.textAlign || 'center';
      // Oben-bündig: Cap-Oberkante ("H") an der Feldoberkante, "g" hängt bis zur Unterkante.
      // Glyphen wachsen nach OBEN von der Baseline → Baseline = Feldoberkante minus Cap.
      const fieldTop = p.h - f.y + yOffset; // Feldoberkante in DXF-Koordinaten (y-up)
      const yBase = fieldTop - capMM;

      // Mehrzeilige Gravuren Zeile für Zeile mit Vorschub — opentype/TEXT-Entities kennen
      // keinen Umbruch. DXF ist y-up → Folgezeile = kleineres y.
      // STATISCHER Text bricht zusätzlich am Feldrand um, genau wie in _drawText (sonst
      // 4 Zeilen in der Vorschau, 1 im DXF). Gravur-Text bleibt ungebrochen: dort gilt die
      // feste Gravurhöhe, zu langer Text wird länger.
      const txtLines = f.type === 'static'
        ? _wrapTextLines(_textLines(txt), f.w - STATIC_WRAP_INSET_MM,
          s => _measureTextMM(s, _feldSchrift(f), f.bold, fsMM))
        : _textLines(txt);
      const lineAdvMM = _isCombo(f) ? _comboLineAdvMM(f, fsMM) : fsMM * LINE_SPACING;
      // Kombi mit „einzelne Zeile mittig": Verschiebung nach unten (DXF y-up → minus).
      // Gilt für BEIDE DXF-Textmodi (Vektor unten und TEXT-Fallback), damit sie nicht driften.
      const comboShiftMM = comboCenterShiftMM(f, txtLines.length, fsMM);
      // Drehung (Grad, im Uhrzeigersinn wie Vorschau) um die Feldmitte.
      // DXF ist y-up → Winkel negieren, damit die Optik der Vorschau entspricht.
      const rot = f.rotation ? {
        a: -f.rotation * Math.PI / 180,
        cx: f.x + f.w / 2, cy: flipY(f.y, f.h) + f.h / 2
      } : null;

      // Vektor-Schrift EINMAL für Kreis- und geraden Zweig; mit Bildzeichen (Emoji) erst die Ersatzschriften.
      const _vektor = isVector && typeof opentype !== 'undefined';
      const _bz = _vektor && _bzFeld(f, txt);
      if (_bz) await _emojiLaden();
      const otFont = _vektor ? await loadOTFontFuerText(fontName, { url: f._fontUrl, rawFamily: f._fontRawFamily, bild: _bz }, txt) : null;

      // ── Kreis-Text: Zeichen für Zeichen auf dem Bogen platzieren (nur Vektor-Modus) ──
      // Gleiche Geometrie wie _drawCircleText, nur in DXF-Koordinaten (y-up → Winkel
      // gespiegelt). Die °-Drehung verschiebt den Startwinkel um die Kreismitte.
      if (f.circleDia > 0 && _vektor) {
        if (otFont) {
          const scale = fsMM / otFont.unitsPerEm;
          const r = f.circleDia / 2;
          const spread = f.circleSpread || 1;
          const ccx = f.x + f.w / 2, ccy = flipY(f.y, f.h) + f.h / 2; // Kreismitte (DXF)
          // Einheiten auf dem Bogen (s. _bogenEinheiten, wie in der Vorschau)
          const { chars, teile: teileK } = _bogenEinheiten(f, txt, otFont);
          if (teileK) _emojiHinweise(f, teileK);
          _tofuHinweis(f, otFont, chars.filter(c => typeof c === 'string'), f._fontRawFamily || fontName);
          const capE = _capEinheiten(otFont);
          const advOf = c => typeof c === 'string' ? otFont.getAdvanceWidth(c, fsMM) : _ersatzMass(c).adv * capE * scale;
          const pfadOf = c => {
            if (typeof c === 'string') return otFont.getPath(c, 0, 0, otFont.unitsPerEm);
            const m = _ersatzMass(c);
            return c.g.getPath(0, -m.dy * capE, m.k * capE * m.upm);
          };
          const widths = chars.map(c => advOf(c) * spread);
          const totalAngle = widths.reduce((s, wc) => s + wc, 0) / r;
          const bottom = f.circleSide === 'bottom';
          const shift = -(f.rotation || 0) * Math.PI / 180; // ° = Startwinkel (y-up → negiert)
          // Kontur auf den Zeilen-Layer, die Füll-Kopie separat auf "Gravur-Hatch":
          // beide auf demselben Layer wären Doppel-Entities = doppelt graviert.
          const outlineLayer = gravLayer;
          let arc = 0;
          for (let ci = 0; ci < chars.length; ci++) {
            const half = widths[ci] / 2;
            if (typeof chars[ci] !== 'string' || chars[ci].trim()) {
              // y-up: oben = +90°, Leserichtung oben = φ fallend; unten = −90°, φ steigend
              const phi = (bottom
                ? -Math.PI / 2 - totalAngle / 2 + (arc + half) / r
                : Math.PI / 2 + totalAngle / 2 - (arc + half) / r) + shift;
              const ax2 = ccx + r * Math.cos(phi), ay2 = ccy + r * Math.sin(phi);
              const a = phi + (bottom ? Math.PI / 2 : -Math.PI / 2); // Tangenten-Drehung
              const advMM = advOf(chars[ci]);
              const path = pfadOf(chars[ci]);
              const crot = { a, cx: ax2, cy: ay2 };
              const ents = otPathToDXF(path, ax2 - advMM / 2, ay2, scale, scale, outlineLayer, crot);
              if (ents.trim()) d.push(ents.trim());
              if (isFilled) {
                const fe = otPathToDXF(path, ax2 - advMM / 2, ay2, scale, scale, 'Gravur-Hatch', crot);
                if (fe.trim()) d.push(fe.trim());
              }
            }
            arc += widths[ci];
          }
          continue;
        }
        // Ohne geladene Kontur fällt das Feld unten auf ein gerades TEXT-Entity zurück —
        // der Kreis wäre weg. Im Auto-Export sieht das sonst niemand.
        console.warn('DXF: Kreis-Text ohne Vektor-Font ("' + fontName + '") — Feld wird GERADE graviert.');
      }

      if (_vektor) {
        if (otFont) {
          const upm = otFont.unitsPerEm;
          // Mit Bildzeichen oder fehlenden Zeichen: jede Zeile als zusammengesetzter Pfad (Text + Emoji,
          // ohne Kästen), sonst wie bisher.
          const zp = (_bz || (f.type === 'text' && _fehltIn(otFont, txt))) ? txtLines.map(l => _zeilePfad(otFont, l, upm)) : null;
          if (zp) _emojiHinweise(f, zp.flatMap(z => z.teile));
          _tofuHinweis(f, otFont, zp ? zp.flatMap(z => z.teile.filter(t => t.s != null).map(t => t.s)) : txtLines, f._fontRawFamily || fontName);
          const pfad = li => zp ? zp[li].path : otFont.getPath(txtLines[li], 0, 0, upm);
          const vorschub = li => zp ? zp[li].adv : otFont.getAdvanceWidth(txtLines[li], upm);
          const fieldTop = p.h - f.y + yOffset; // Feldoberkante in DXF-Koordinaten (y-up)
          // ── FESTE GRAVUR-HÖHE ──────────────────────────────────────────────
          // Auto-Fit: der Vektor-Block (Bounding-Box der konkreten Zeichen über alle
          // Zeilen) wird auf EXAKT f.h skaliert — mm-genau, unabhängig von Ober-/Unterlängen
          // und Schriftart; zu langer Text wächst nur in die Breite.
          // Manuell/Statik: feste fsMM, Cap-Oberkante an der Feldoberkante.
          // Kombi-Feld: NICHT exactFit (feste comboFontSizePt) → alle Zeilen gleich hoch.
          const exactFit = f.type !== 'static' && f.autoFit !== false && !(f.circleDia > 0)
            && !_isCombo(f) && txtLines.some(l => l.trim());
          const lineAdvEm = upm * LINE_SPACING;
          let scale = fsMM / upm, blockTopEm = null;
          if (exactFit) {
            let top = Infinity, bot = -Infinity;
            txtLines.forEach((line, li) => {
              if (!line.trim()) return;
              // Nur weggelassene Bildzeichen in der Zeile → leerer Pfad ohne Box
              if (zp && !zp[li].path.commands.length) return;
              const bb = pfad(li).getBoundingBox(); // em-Einheiten, y-down
              top = Math.min(top, li * lineAdvEm + bb.y1);
              bot = Math.max(bot, li * lineAdvEm + bb.y2);
            });
            if (Number.isFinite(top)) {
              const blockHem = (bot - top) || 1;
              scale = f.h / blockHem;   // mm pro em-Einheit → Blockhöhe == f.h exakt
              blockTopEm = top;
            }
          }
          // Breitenlimit (f.overflowMode) — dieselbe Logik wie die Vorschau
          // (_overflowFactors): 'stauch' nur X-Achse, 'hybrid' zusätzlich proportional.
          let sxW = 1, yShiftMM = 0;
          if ((exactFit || _isCombo(f) || f.ddText) && f.type === 'text' && (f.overflowMode === 'stauch' || f.overflowMode === 'hybrid')) {
            const widest = Math.max(...txtLines.map((l, li) => l.trim() ? vorschub(li) * scale : -Infinity));
            // Kombi: Hybrid wie Stauchen behandeln — k<1 würde die Schrift pro Feld
            // verkleinern (Bestellungen wieder unterschiedlich groß) und der feste
            // yBase-Zweig unten kennt yShiftMM/k nicht (Vorschau-Drift).
            const _ovMode = _isCombo(f) ? 'stauch' : f.overflowMode;
            const fac = _overflowFactors(_ovMode, widest, f.w * 0.99);
            sxW = fac.sx;
            if (fac.sx < 0.9 || fac.k < 0.95) _exportHinweise.set(`${_exportLayoutJetzt ? _exportLayoutJetzt + ': ' : ''}„${txtLines.join(' / ').trim()}" zu lang — auf ${Math.round(fac.sx * 100)} % Breite gestaucht${fac.k < 0.95 ? `, Schrift ${Math.round(fac.k * 100)} % hoch` : ''}`, { layout: 'Hinweis', nurRekla: true });
            scale *= fac.k;
            // Hybrid: verkleinerter Block (Höhe = k·f.h) mittig im Feld statt
            // oben bündig (sonst Lücke nur unten). DXF ist y-up → nach unten = minus.
            yShiftMM = f.h * (1 - fac.k) / 2;
          }
          // asBlock: alle Buchstaben-Konturen DIESES Textfelds sammeln → 1 BLOCK = 1 Objekt
          const fieldGlyphs = [];
          txtLines.forEach((line, li) => {
            if (!line.trim()) return; // Leerzeile: nur Vorschub, keine Entities
            // Horizontal je Zeile ausrichten (echte Zeilenbreite, wie ctx.textAlign in der Vorschau)
            const advMM = vorschub(li) * scale * sxW;
            const x = align === 'center' ? f.x + (f.w - advMM) / 2
              : align === 'right' ? f.x + f.w - advMM
                : f.x;
            // Auto-Fit: Block-Oberkante bündig an Feldoberkante (Block-Höhe == f.h).
            // Sonst: Cap-Oberkante an Feldoberkante mit fester Zeilenhöhe.
            const yLine = blockTopEm !== null
              ? fieldTop - yShiftMM - (li * lineAdvEm - blockTopEm) * scale
              : yBase - comboShiftMM - li * lineAdvMM;
            const path = zusammen ? _konturenVereinigen(pfad(li)) : pfad(li);
            // Kontur auf den Zeilen-Layer, Füll-Kopie separat (Begründung s. Kreis-Zweig oben)
            const outlineLayer = gravLayer;
            const pathEntities = otPathToDXF(path, x, yLine, scale * sxW, scale, outlineLayer, rot);
            if (pathEntities.trim()) (asBlock ? fieldGlyphs : d).push(pathEntities.trim());
            if (isFilled) {
              // Zweite Kopie auf Gravur-Hatch Layer für EZCad Fill (bleibt lose, auch bei asBlock)
              const fillEntities = otPathToDXF(path, x, yLine, scale * sxW, scale, 'Gravur-Hatch', rot);
              if (fillEntities.trim()) d.push(fillEntities.trim());
            }
          });
          // asBlock: Konturen als BLOCK + einmal INSERT — Ezcad zeigt jeden Text dann als
          // EIN Objekt. Zerlegt eine Ezcad-Version Blöcke beim Import, bleibt die Geometrie
          // identisch (INSERT@0,0, Maßstab 1 → absolute Koordinaten).
          if (asBlock && fieldGlyphs.length) {
            const bn = 'T' + (++blockCtr.n);
            blocks.push(['0', 'BLOCK', '8', gravLayer, '2', bn, '70', '0', '10', '0.0', '20', '0.0', '30', '0.0', '3', bn].join('\n')
              + '\n' + fieldGlyphs.join('\n') + '\n'
              + ['0', 'ENDBLK', '8', gravLayer].join('\n'));
            d.push('0', 'INSERT', '8', gravLayer, '2', bn, '10', '0.0', '20', '0.0', '30', '0.0');
          }
          continue;
        }
      }
      // Fallback: TEXT Entities (R12, einzeilig) — eine pro Zeile mit y-Vorschub
      const just = align === 'center' ? 1 : align === 'right' ? 2 : 0; // 72: 0=links,1=mitte,2=rechts
      const ax = align === 'center' ? f.x + f.w / 2 : align === 'right' ? f.x + f.w : f.x;
      // Ein DXF-TEXT dreht per Gruppencode 50 um SEINEN EIGENEN Einfügepunkt, die Vorschau
      // dagegen um die Feldmitte — nur die 50 zu setzen ergab 3,9 mm Versatz bei einem
      // 60×20-Feld mit 90°. Deshalb den Einfügepunkt SELBST um die Feldmitte drehen
      // (über _rotPt, gleiche Achse wie im Vektor-Modus).
      txtLines.forEach((line, li) => {
        if (!line.trim()) return;
        const yLine = yBase - comboShiftMM - li * lineAdvMM;
        const [px0, py0] = _rotPt(f.x, yLine, rot);   // Einfügepunkt (72=0 bzw. Pflichtfeld)
        const [pax, pay] = _rotPt(ax, yLine, rot);    // Ausrichtepunkt bei zentriert/rechts
        d.push('0', 'TEXT', '8', gravLayer);
        d.push('10', px0.toFixed(4), '20', py0.toFixed(4), '30', '0.0');
        d.push('40', fsMM.toFixed(4), '1', line, '7', 'Standard', '72', String(just));
        // Drehung: Gruppencode 50 (Grad, CCW)
        if (f.rotation) d.push('50', String(-f.rotation));
        // Bei zentriert/rechts: Ausrichtepunkt (11/21) setzen — sonst ignoriert DXF die Justierung
        if (just !== 0) d.push('11', pax.toFixed(4), '21', pay.toFixed(4), '31', '0.0');
      });

    } else if (f.type === 'image' && f._halbton && f._halbton.length) {
      // Foto als Vektor-Halbton (Layout-Schalter `fotoVektor`): je Zeile eine Wellenlinie,
      // deren Ausschlag mit der Dunkelheit wächst. Weiße Stellen erzeugen GAR keine Linie —
      // die Maschine fährt also nur, wo wirklich Bild ist. Eigener Layer je Platz, damit in
      // Ezcad jedes Foto einzeln anwählbar bleibt.
      const lay = `Foto_${f._platz || 1}`;
      for (const linie of f._halbton) {
        if (!linie || linie.length < 2) continue;
        d.push('0', 'POLYLINE', '8', lay, '66', '1', '70', '0');
        for (const pt of linie) {
          d.push('0', 'VERTEX', '8', lay, '10', pt.x.toFixed(4), '20', flipY(pt.y).toFixed(4), '30', '0.0');
        }
        d.push('0', 'SEQEND');
      }

    } else if (f.type === 'image' && f._img && bildRahmen) {
      const x1 = f.x, y1 = flipY(f.y, f.h);
      const x2 = f.x + f.w, y2 = flipY(f.y);
      // Drehung: Eck-Punkte um die Feldmitte rotieren (gleiche Optik wie Vorschau) —
      // über _rotPt, dieselbe Formel wie für Text und Konturen.
      const imgRot = f.rotation
        ? { a: -f.rotation * Math.PI / 180, cx: f.x + f.w / 2, cy: y1 + f.h / 2 }
        : null;
      // R12: POLYLINE statt LWPOLYLINE
      d.push('0', 'POLYLINE', '8', 'Bild', '66', '1', '70', '1');
      const corners = [[x1, y1], [x2, y1], [x2, y2], [x1, y2]].map(([px, py]) => _rotPt(px, py, imgRot));
      for (const [cx, cy] of corners) {
        d.push('0', 'VERTEX', '8', 'Bild', '10', cx.toFixed(4), '20', cy.toFixed(4), '30', '0.0');
      }
      d.push('0', 'SEQEND');
    }
  }
  return { entities: d, blocks };
}

function _dxfHeaderTables(p, extMinY, extMaxY, extraLayers = []) {
  let d = [];
  d.push('0', 'SECTION', '2', 'HEADER');
  d.push('9', '$ACADVER', '1', 'AC1009'); // R12 — maximale Kompatibilität mit Ezcad2
  d.push('9', '$INSUNITS', '70', '4');    // mm
  d.push('9', '$EXTMIN', '10', '0.0', '20', extMinY.toString(), '30', '0.0');
  d.push('9', '$EXTMAX', '10', p.w.toString(), '20', extMaxY.toString(), '30', '0.0');
  d.push('0', 'ENDSEC');
  d.push('0', 'SECTION', '2', 'TABLES');
  d.push('0', 'TABLE', '2', 'LAYER', '70', String(4 + extraLayers.length));
  d.push('0', 'LAYER', '2', 'Gravur', '70', '0', '62', '7', '6', 'Continuous');
  d.push('0', 'LAYER', '2', 'Gravur-Hatch', '70', '0', '62', '7', '6', 'Continuous');
  d.push('0', 'LAYER', '2', 'Bild', '70', '0', '62', '5', '6', 'Continuous');
  d.push('0', 'LAYER', '2', 'Rahmen', '70', '0', '62', '1', '6', 'Continuous'); // Positions-Anker (rot), nicht gravieren
  // Zeilen-Layer "Gravur_N" sowie — nur wenn benutzt — "Motiv" und "Foto_N"
  for (const ln of extraLayers) d.push('0', 'LAYER', '2', ln, '70', '0', '62', '7', '6', 'Continuous');
  d.push('0', 'ENDTAB', '0', 'ENDSEC');
  return d;
}

// Benutzte Zusatz-Layer (Gravur_N, Foto_N, Motiv) für die LAYER-Tabelle — über den
// zusammengefügten TEXT, weil Entities teils Token-Paare, teils Mehrzeilen-Strings sind.
function _collectRowLayers(entities) {
  const s = new Set();
  const re = /(?:^|\n)8\n(Gravur_\d+|Foto_\d+|Motiv)(?:\n|$)/g;
  const txt = entities.join('\n');
  let m; while ((m = re.exec(txt))) s.add(m[1]);
  return [...s].sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
}

// Vollblatt-Rahmen als geschlossene POLYLINE auf eigenem Layer "Rahmen" (in Ezcad auf
// „nicht gravieren" stellen). Hält die Position beim Import — Ezcad zentriert nicht.
function _dxfFrameEntities(p, yOffset = 0) {
  const x1 = 0, x2 = p.w, y1 = yOffset, y2 = p.h + yOffset;
  const d = ['0', 'POLYLINE', '8', 'Rahmen', '66', '1', '70', '1']; // 70=1 → geschlossen
  for (const [cx, cy] of [[x1, y1], [x2, y1], [x2, y2], [x1, y2]]) {
    d.push('0', 'VERTEX', '8', 'Rahmen', '10', cx.toFixed(4), '20', cy.toFixed(4), '30', '0.0');
  }
  d.push('0', 'SEQEND');
  return d;
}

// ── Nullpunkt in die Blattmitte legen (Ezcad) ────────────────────────────────
// Ezcad rechnet vom MITTELPUNKT des Arbeitsfeldes (200er Feld = −100…+100), unsere DXF von 0/0 bis
// w/h. Ohne „zentrieren“ landet alles im oberen rechten Viertel; MIT rückt Ezcad den INHALT mittig
// (ein Blech mit nur einer Reihe säße falsch). Also die Koordinaten gleich um die Blattmitte schreiben.
// Gerechnet auf dem fertigen TEXT (otPathToDXF liefert mehrzeilige Strings); X = Gruppencodes 10–13,
// Y = 20–23; $EXTMIN/$EXTMAX wandern mit.
// Array an Array hängen, ohne Spread: `ziel.push(...quelle)` wirft ab ~100.000 Elementen („Maximum
// call stack size exceeded“) — mit Motiven sind es schnell Hunderttausende.
function _anhaengen(ziel, quelle) {
  for (let i = 0; i < quelle.length; i++) ziel.push(quelle[i]);
  return ziel;
}

function _dxfOriginToCenter(text, p) {
  const z = text.split('\n');
  const dx = p.w / 2, dy = p.h / 2;
  // BLOCK-Basispunkt und INSERT-Einfügepunkt sind AUSGENOMMEN: der asBlock-Zweig legt die
  // Glyphen mit ABSOLUTEN Koordinaten in den Block und setzt beide Punkte auf 0,0. Würden
  // sie mitwandern, verschöbe sich die Geometrie zweimal (um eine halbe Blattgröße nach unten
  // links; nur bei „Text als Block" + „Nullpunkt mittig" gemeinsam).
  // In ZWEIERSCHRITTEN laufen: eine DXF ist streng Code/Wert-paarig — zeilenweise würde
  // der WERT "0" (etwa von Code 70) mit dem Entity-Start-CODE 0 verwechselt.
  let imEinfuegepunkt = false;
  for (let i = 0; i + 1 < z.length; i += 2) {
    const c = z[i].trim();
    const v = z[i + 1].trim();
    if (c === '0') { imEinfuegepunkt = (v === 'BLOCK' || v === 'INSERT'); continue; }
    if (!/^-?[\d.]+$/.test(v)) continue;
    if (imEinfuegepunkt) continue; // Basis-/Einfügepunkt bleibt bei 0,0
    if (/^1[0-3]$/.test(c)) z[i + 1] = (parseFloat(v) - dx).toString();
    else if (/^2[0-3]$/.test(c)) z[i + 1] = (parseFloat(v) - dy).toString();
  }
  return z.join('\n');
}

// EINE Seite = MultiPage mit einer Seite. Nachgerechnet über alle 32 Kombinationen der
// fünf Schalter (gefüllt/Vektor/Rahmen/Block/Nullpunkt): Zeichen für Zeichen identisch —
// bei einer Seite ist yOffset 0 und extMinY −(p.h − p.h) = 0. Eigener Name, weil die
// Unterscheidung „eine Seite / mehrere" an den Aufrufstellen die Aussage ist.
const buildDXFContent = (fieldsSubset, isFilled, isVector, frame = false, asBlock = false, centerOrigin = false, bildRahmen = true, zusammen = false) =>
  buildDXFContentMultiPage([fieldsSubset], isFilled, isVector, frame, asBlock, centerOrigin, bildRahmen, zusammen);

// Mehrere Seiten überlappungsfrei in EINER DXF gestapelt (für DXF-Batch bei Mehrseiten-Layouts).
async function buildDXFContentMultiPage(pagesFieldsList, isFilled, isVector, frame = false, asBlock = false, centerOrigin = false, bildRahmen = true, zusammen = false) {
  const p = getPg();
  const GAP_MM = 10;
  let allEntities = [];
  let allBlocks = [];
  const blockCtr = { n: 0 }; // eindeutige Block-Namen ÜBER alle Seiten hinweg
  for (let i = 0; i < pagesFieldsList.length; i++) {
    const yOffset = -i * (p.h + GAP_MM);
    if (frame) _anhaengen(allEntities, _dxfFrameEntities(p, yOffset)); // Rahmen pro Blatt
    const { entities, blocks } = await _buildDXFEntities(pagesFieldsList[i], isFilled, isVector, yOffset, asBlock, blockCtr, bildRahmen, zusammen);
    _anhaengen(allEntities, entities);
    _anhaengen(allBlocks, blocks);
  }
  const totalH = pagesFieldsList.length * p.h + (pagesFieldsList.length - 1) * GAP_MM;
  let d = _dxfHeaderTables(p, -(totalH - p.h), p.h, _collectRowLayers([...allEntities, ...allBlocks]));
  if (allBlocks.length) { d.push('0', 'SECTION', '2', 'BLOCKS'); _anhaengen(d, allBlocks); d.push('0', 'ENDSEC'); }
  d.push('0', 'SECTION', '2', 'ENTITIES');
  _anhaengen(d, allEntities);
  d.push('0', 'ENDSEC', '0', 'EOF');
  const txt = d.join('\n') + '\n';
  // Mehrseitig: die erste Seite landet mittig, die weiteren wie gehabt darunter.
  return centerOrigin ? _dxfOriginToCenter(txt, p) : txt;
}

// ── DXF Batch: alle Bestellungen in einer Datei ───────────────────────────────
async function exportDXFBatch(isFilled = false, isVector = true, frame = false) {
  showToast('⏳ DXF Batch wird erstellt…');
  saveCurrentPageSnapshot();
  // Pro Seite filtern, leere Seiten raus — bei Mehrseiten-Layouts werden alle
  // Seiten überlappungsfrei gestapelt in EINER DXF kombiniert (kein ZIP).
  const pagesFieldsList = _pages
    .map(pg => pg.filter(f => _hasVecText(f) || f._img || (_istMotiv(f) && _motivAktiv(f, pg))))
    .filter(pg => pg.length > 0);
  if (!pagesFieldsList.length) { showToast('⚠ Keine gefüllten Felder!'); return; }
  // Layout-Settings (Block, Nullpunkt, Bild-Rahmen) — wie im Auto-Export. Den Bild-Rahmen
  // ließ der manuelle Export bis 06.10.2026 immer an, auch wo das Layout ihn abschaltet.
  const { asBlock, centerOrigin, bildRahmen, zusammen } = _dxfOpts(_loadedLayout);
  const suffix = isVector ? (isFilled ? '-filled' : '-outline') : '-text';
  const content = pagesFieldsList.length > 1
    ? await buildDXFContentMultiPage(pagesFieldsList, isFilled, isVector, frame, asBlock, centerOrigin, bildRahmen, zusammen)
    : await buildDXFContent(pagesFieldsList[0], isFilled, isVector, frame, asBlock, centerOrigin, bildRahmen, zusammen);
  const blob = new Blob([content], { type: 'application/dxf' });
  _downloadBlob(blob, `laser-batch${suffix}.dxf`);
  showToast('✓ DXF Batch exportiert!');
}

// ── DXF Einzeln: eine DXF pro Bestellung als ZIP ────────────────────────────
async function exportDXFSingle(isFilled = false, isVector = true, frame = false) {
  showToast('⏳ Einzelne DXFs werden erstellt…');
  saveCurrentPageSnapshot();

  // Felder über ALLE Seiten nach orderId gruppieren (nicht nur aktuelle Seite —
  // sonst fehlen Bestellungen, die auf anderen Seiten eines Mehrseiten-Layouts liegen).
  // Seitenindex je Feld merken: im Synchron-Modus liegen Vorder-/Rückseite DERSELBEN
  // Bestellung auf zwei verschiedenen Seiten mit identischen Koordinaten — ohne
  // Stapel-Offset würden beide in der kombinierten Einzel-DXF übereinander liegen.
  const orderMap = new Map(); // orderId → [{f, pageIdx}]
  _pages.forEach((pg, pageIdx) => {
    pg.forEach(f => {
      if (!_hasVecText(f) && !f._img && !(_istMotiv(f) && _motivAktiv(f, pg))) return;
      const key = f.orderId || ('__unassigned_' + f.id);
      if (!orderMap.has(key)) orderMap.set(key, []);
      orderMap.get(key).push({ f, pageIdx });
    });
  });

  if (orderMap.size === 0) { showToast('⚠ Keine gefüllten Felder!'); return; }

  const suffix = isVector ? (isFilled ? '-filled' : '-outline') : '-text';

  // Felder von nur einer Seite → eine DXF; von mehreren → überlappungsfrei gestapelt
  // wie beim Batch-Export. Layout-Einstellungen EINMAL ableiten.
  const { asBlock, centerOrigin, bildRahmen, zusammen } = _dxfOpts(_loadedLayout);
  const buildOrderDXF = (entries) => {
    const pageIdxs = [...new Set(entries.map(e => e.pageIdx))].sort((a, b) => a - b);
    if (pageIdxs.length <= 1) return buildDXFContent(entries.map(e => e.f), isFilled, isVector, frame, asBlock, centerOrigin, bildRahmen, zusammen);
    const grouped = pageIdxs.map(pi => entries.filter(e => e.pageIdx === pi).map(e => e.f));
    return buildDXFContentMultiPage(grouped, isFilled, isVector, frame, asBlock, centerOrigin, bildRahmen, zusammen);
  };

  // Wenn nur eine Bestellung: direkt herunterladen, kein ZIP nötig
  if (orderMap.size === 1) {
    const [orderId, entries] = [...orderMap.entries()][0];
    const content = await buildOrderDXF(entries);
    const safeName = orderId.replace(/[^a-zA-Z0-9\-_\.]/g, '_');
    const blob = new Blob([content], { type: 'application/dxf' });
    _downloadBlob(blob, `${safeName}${suffix}.dxf`);
    showToast('✓ DXF exportiert!');
    return;
  }

  // Mehrere Bestellungen: JSZip verwenden
  await _ensureJSZip();

  const zip = new JSZip();
  let count = 0;
  for (const [orderId, entries] of orderMap.entries()) {
    const content = await buildOrderDXF(entries);
    const safeName = orderId.replace(/[^a-zA-Z0-9\-_\.]/g, '_');
    zip.file(`${safeName}${suffix}.dxf`, content);
    count++;
    showToast(`⏳ ${count}/${orderMap.size} DXFs…`);
  }

  const zipBlob = await zip.generateAsync({ type: 'blob' });
  _downloadBlob(zipBlob, `laser-einzeln-${count}x${suffix}.zip`);
  showToast(`✓ ${count} DXFs als ZIP exportiert!`);
}

// ── Einstellungen ─────────────────────────────────────────────────────────────
// Die Standardwerte leben NUR auf dem Server (file-remove.controller.js,
// DEFAULT_SETTINGS) — /settings liefert immer vollständige Werte. KEINE zweite
// Default-Liste hier: ohne Server-Antwort bleibt das Panel gesperrt
// (_currentSettings = null → alle Änderungs-Handler blocken), sonst überschriebe ein
// Speichern die echten Einstellungen mit lokal geratenen.
let _currentSettings = null;
let _settingsDirty = false;

// ── Abmelden (Einstellungen) ──────────────────────────────────────────────────────────────
// Basic Auth kennt kein echtes Abmelden — der Browser (v. a. Safari) merkt sich Benutzer und Passwort
// und schickt sie nach einem 401 sofort noch einmal. Deshalb: Cookie pm_abgemeldet=<benutzer> (5 min)
// und neu laden. nginx antwortet mit 401 + abgemeldet.html, solange Cookie und Benutzer gleich sind;
// der erste ANDERE Benutzer löscht das Cookie (sites-available/printomation, map $pm_abmelden).
async function abmelden() {
  let benutzer = null;
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    ({ benutzer } = await (await fetch(BASE_URL + '/v2/wer-bin-ich', { headers, credentials: 'include', cache: 'no-store' })).json());
  } catch { }
  const ok = await confirmModal('Abmelden?',
    benutzer ? `Du bist als „${benutzer}“ angemeldet. Möchtest du dich wirklich abmelden?` : 'Möchtest du dich abmelden?',
    'Abmelden');
  if (!ok) return;
  localStorage.removeItem('jwt_access_token');
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  document.cookie = 'jwt_access_token=; Path=/; Max-Age=0; SameSite=Lax';
  try { await fetch(BASE_URL + '/v1/auth/logout', { method: 'POST', credentials: 'include' }); } catch (_) { }
  location.href = 'login.html';
}

async function loadSettings() {
  try {
    _currentSettings = await _apiJson('/v2/settings'); // Server merged bereits über die Defaults
    applySettingsToUI(_currentSettings);
  } catch (e) {
    _currentSettings = null;
    setSettingsDirty(false);
    showToast('⚠️ Einstellungen nicht ladbar — Panel gesperrt. Server prüfen, Tab erneut öffnen.', 5000);
  }
}

// Downloads und Exports unterscheiden sich nur in Element-IDs und Settings-Schlüssel.
// Eine dritte Gruppe wäre hier eine Zeile.
const SETTINGS_GROUPS = [
  { key: 'downloads', check: 'dl-auto-delete', row: 'dl-days-row' },
  { key: 'exports', check: 'exp-auto-delete', row: 'exp-days-row' },
];

// Zeigt/versteckt die Tage-Auswahl passend zum Schalter. Rückgabe: Zustand des Schalters.
function _settingsGroupRow(g) {
  const check = document.getElementById(g.check);
  const row = document.getElementById(g.row);
  const on = !!check?.checked;
  if (row) row.style.display = on ? 'block' : 'none';
  return on;
}

function applySettingsToUI(s) {
  for (const g of SETTINGS_GROUPS) {
    const check = document.getElementById(g.check);
    if (check) check.checked = !!s[g.key]?.autoDelete;
    _settingsGroupRow(g);
    highlightDayBtn(g.key, s[g.key]?.afterDays);
  }
  const ec = document.getElementById('emoji-gravieren');
  if (ec) ec.checked = _emojiSchalterAn(s);
  _emojiHinweisZeigen();
  setSettingsDirty(false);
  _updateEinstStand();
}

// Was die gewählte Aufräum-Einstellung praktisch bedeutet — in einem Satz statt in
// Zahlen. Quelle ist _currentSettings, NICHT das Aussehen der Tages-Knöpfe.
function _updateEinstStand() {
  const c = _currentSettings;
  const satz = (g) => {
    if (!c || !c[g]) return '';
    if (!c[g].autoDelete) return 'Wird nicht automatisch gelöscht — der Ordner wächst weiter.';
    const t = c[g].afterDays;
    return `Älter als ${t} Tag${t === 1 ? '' : 'e'} → nachts um 3 Uhr gelöscht.`;
  };
  const d1 = document.getElementById('dl-stand'), d2 = document.getElementById('exp-stand');
  if (d1) d1.textContent = satz('downloads');
  if (d2) d2.textContent = satz('exports');
}

// Tages-Buttons (Einstellungen): beide 6er-Grids sind identisch — werden generiert statt doppelt im Markup zu stehen
document.querySelectorAll('.day-grid').forEach(g => {
  g.innerHTML = [1, 2, 3, 7, 14, 30].map(d =>
    `<button class="settings-day-btn" data-group="${g.dataset.group}" data-val="${d}" onclick="selectDays('${g.dataset.group}',${d})">${d === 1 ? '1 Tag' : d + ' Tage'}</button>`
  ).join('');
});

// Klasse statt Inline-Werten: `an` ist im ganzen Programm der aktive Zustand. Ein Inline-Stil
// schlägt jede Regel — die Farbe aus .settings-day-btn käme sonst nie zum Zug.
function highlightDayBtn(group, days) {
  document.querySelectorAll(`.settings-day-btn[data-group="${group}"]`).forEach(btn => {
    _setAn(btn, parseInt(btn.dataset.val) === days);
  });
}

// Handler blocken, solange die Server-Werte fehlen — sonst würden lokale (falsche)
// Defaults editiert und beim Speichern die echten Einstellungen überschreiben.
function _settingsReady() {
  if (_currentSettings) return true;
  showToast('⚠️ Einstellungen noch nicht geladen — bitte Tab erneut öffnen');
  return false;
}

function selectDays(group, days) {
  if (!_settingsReady()) return;
  _currentSettings[group].afterDays = days;
  highlightDayBtn(group, days);
  setSettingsDirty(true);
  _updateEinstStand();
}

function settingsChanged() {
  setTimeout(_updateEinstStand, 0);
  if (!_settingsReady()) return;
  for (const g of SETTINGS_GROUPS) _currentSettings[g.key].autoDelete = _settingsGroupRow(g);
  _currentSettings.emoji = { gravieren: !!document.getElementById('emoji-gravieren')?.checked };
  _emojiHinweisZeigen();
  setSettingsDirty(true);
}

// Seit 17.10.2026 speichern sich die Einstellungen SELBST, kurz nach der letzten Änderung (vorher
// Knopf „Einstellungen speichern" unter dem Testblatt — leicht vergessen). Bestätigt wird wie bisher
// per Meldung „✅ Gespeichert".
let _einstSpeichernTimer = null;
function setSettingsDirty(dirty) {
  _settingsDirty = dirty;
  clearTimeout(_einstSpeichernTimer);
  if (dirty) _einstSpeichernTimer = setTimeout(saveSettings, 700);
}

async function saveSettings() {
  if (!_currentSettings || !_settingsDirty) return;
  try {
    await _apiJson('/v2/settings', 'POST', _currentSettings);
    setSettingsDirty(false);
    // Emoji-Schalter wirkt sofort auf Vorschau und manuellen Export (Auto-Export liest ihn je Lauf)
    _emojiAn = _emojiSchalterAn(_currentSettings);
    _fitPtCache.clear(); scheduleRender();
    showToast('✅ Einstellungen gespeichert');
  } catch (e) {
    showToast('⚠️ Fehler beim Speichern: ' + e.message);
  }
}

// Zeile unter dem Schalter „Emojis übernehmen" — sagt, was der gerade gestellte Zustand bewirkt.
function _emojiHinweisZeigen() {
  const el = document.getElementById('emoji-hinweis');
  if (el) el.textContent = document.getElementById('emoji-gravieren')?.checked
    ? 'An: Emojis werden mitgraviert (DXF, PDF, Vorschau).'
    : 'Aus: Emojis werden komplett weggelassen.';
}

// ── Layout-Einstellungen (Dialog ⚙ an der Layout-Karte) ──────────────────────────
// Export-Formate des Layout-Dialogs (Wert = Checkbox-ID-Suffix "ls-fmt-<wert>") — EINE
// Liste für Füllen und Auslesen. Reihenfolge = die im gespeicherten exportFormat-String.
const LS_FORMATS = ['pdf', 'pdf-std', 'png', 'sublimation', 'bmp', 'dxf'];
const _lsFmtBox = (f) => document.getElementById('ls-fmt-' + f);

let _lsCurrentId = null;
// Seitenzahl + „mehrere Bestellungen je Blatt möglich" des BEARBEITETEN Layouts — für das
// Dateinamen-Beispiel. Nicht `_pages`: das ist das im Editor geladene, oft ein anderes.
let _lsBeispiel = { seiten: 1, mehrere: false };

async function toggleAutoExportDirect(id) {
  const saved = await getServerLayouts();
  const l = saved.find(x => x.id === id);
  if (!l) return;
  l.autoExport = !l.autoExport;
  await saveServerLayouts(saved);
  renderSaved();
}

async function openLayoutSettings(id) {
  _lsCurrentId = id;
  const saved = await getServerLayouts();
  const l = saved.find(x => x.id === id);
  if (!l) return;
  // Mehrere unabhängige Plätze mit derselben Gravur-Nr (Array-Kopien zählen nicht) →
  // je nach Tag eine oder mehrere Bestellungen auf dem Blatt.
  const _proNr = {};
  for (const f of (l.pages?.[0] || []))
    if (!f.arrayOf && (f.type === 'text' || f.type === 'image')) _proNr[f.palNum || 1] = (_proNr[f.palNum || 1] || 0) + 1;
  const _s0 = l.pages?.[0] || [];
  _lsBeispiel = {
    seiten: l.pages?.length || 1, mehrere: Object.values(_proNr).some(n => n > 1),
    // für die festen Vorlagen-Namen (s. Vorlage-Zweig in _exportFilledPages)
    gravurSeiten: (l.pages || []).map((p, r) => _seiteHatGravur(l, r)),
    nurText: _s0.length > 0 && !_s0.some(f => f.type === 'image'),
    gruppe: l.group || ''
  };
  document.getElementById('ls-modal-name').textContent = l.name;
  // Name (editierbar → Umbenennen)
  document.getElementById('ls-name').value = l.name || '';
  const fmt = _formate(l);
  for (const f of LS_FORMATS) { const box = _lsFmtBox(f); if (box) box.checked = fmt.includes(f); }
  document.getElementById('ls-dxf-style').value = l.dxfStyle === 'einzeln' ? 'einzeln' : 'outline';
  document.getElementById('ls-dxf-frame').checked = !!l.dxfFrame;
  document.getElementById('ls-dxf-center').checked = !!l.dxfCenterOrigin;
  document.getElementById('ls-dxf-textblock').checked = !!l.dxfTextAsBlock;
  // bmpModus trägt zwei Dinge: blech/platz (BMP-Aufteilung) und vorlage/beides (Ablage)
  document.getElementById('ls-ablage').value = _istVorlageLayout(l) ? l.bmpModus : 'tag';
  document.getElementById('ls-bmp-modus').value = l.bmpModus === 'platz' ? 'platz' : 'blech';
  document.getElementById('ls-vorlage-ordner').value = l.vorlageOrdner || '';
  // Muster, das einem Listeneintrag entspricht, wählt diesen — alles andere ist „eigen".
  const _dnArt = document.getElementById('ls-dateiname-art');
  const _dn = l.dateiname || '';
  const _dnVorlage = [..._dnArt.options].some(o => o.value === _dn && o.value !== 'eigen');
  _dnArt.value = _dnVorlage ? _dn : 'eigen';
  document.getElementById('ls-dateiname').value = _dnVorlage ? '' : _dn;
  document.getElementById('ls-foto-vektor').checked = !!l.fotoVektor;
  lsToggleDxfOptions();
  lsToggleBmpOptions();
  lsAufteilungFuellen(l);
  document.getElementById('ls-auto-export').checked = !!l.autoExport;
  document.getElementById('ls-order').value = l.exportOrder || 'date-desc'; // Default = wie runAutoExport (neueste zuerst)
  lsAsinZeigen(l);
  lsAbrufZeitenZeigen();   // async — füllt den Satz unter dem Auto-Haken nach
  document.getElementById('ls-erweitert').open = false;
  lsZustand();
  // Dithering/Material steht NICHT in diesem Dialog, sondern im Laser-Tab.
  document.getElementById('layout-settings-overlay').style.display = 'flex';
}

function closeLayoutSettings() {
  document.getElementById('layout-settings-overlay').style.display = 'none';
  _lsCurrentId = null;
}

function lsToggleDxfOptions() {
  const on = document.getElementById('ls-fmt-dxf').checked;
  document.getElementById('ls-dxf-options').style.display = on ? 'block' : 'none';
  lsPaintChips();
}

// BMP-Karte nur mit BMP UND Tagesordner — in der Ezcad-Vorlage heißen die Bilder fest
// platzN.bmp, dort gibt es nichts zu wählen.
function lsToggleBmpOptions() {
  const on = document.getElementById('ls-fmt-bmp').checked
    && document.getElementById('ls-ablage').value === 'tag';
  document.getElementById('ls-bmp-options').style.display = on ? 'block' : 'none';
  lsPaintChips();
}

// Aktiv-Zustand der Format-Kacheln + Kurzfassung im Kopf. Bewusst über eine Klasse
// statt über CSS :has() — das gibt es erst in neueren Browsern, und der Dialog soll
// auch in einer älteren Safari-Version richtig aussehen.
function lsPaintChips() {
  const ov = document.getElementById('layout-settings-overlay');
  if (!ov) return;
  const aktiv = [];
  ov.querySelectorAll('.ls-chip').forEach(l => {
    const cb = l.querySelector('input[type="checkbox"]');
    const an = !!(cb && cb.checked);
    l.classList.toggle('on', an);
    if (an) aktiv.push(l.querySelector('.ls-chip-txt b').textContent.replace(/^\W+\s*/, ''));
  });
  const sub = document.getElementById('ls-modal-sub');
  if (sub) {
    const auto = document.getElementById('ls-auto-export')?.checked;
    sub.textContent = (aktiv.length ? aktiv.join(' · ') : 'kein Export-Format gewählt')
      + (auto ? '  ·  Auto-Export an' : '  ·  Auto-Export aus');
  }
}

// Alles, was im Dialog von anderen Eingaben abhängt, auf einmal nachziehen — läuft bei
// jeder Änderung (Zuhörer am Ende) und beim Öffnen.
function lsZustand() {
  lsPaintChips();
  const auto = document.getElementById('ls-auto-export');
  auto.closest('.ls-auto')?.classList.toggle('on', auto.checked);
  document.getElementById('ls-fmt-warn').hidden = LS_FORMATS.some(f => _lsFmtBox(f)?.checked);
  const ablage = document.getElementById('ls-ablage').value;
  document.getElementById('ls-vorlage-wrap').hidden = ablage === 'tag';
  // Reine Vorlage: eine Seite je Datei mit festem Namen, Tages-DXF entfällt — die
  // Aufteilung wirkt dort nicht (s. Vorlage-Zweig in _exportFilledPages)
  document.getElementById('ls-aufteilung-wrap').hidden = ablage === 'vorlage';
  lsToggleBmpOptions();
  lsDateinameVorschau();
  lsErweitertInfo();
}

// Für welche Bestellungen das Layout zuständig ist — nur Anzeige, geändert wird das im
// Reiter „Layout" (Gleiche ASIN) bzw. am einzelnen Feld.
function lsAsinZeigen(l) {
  const el = document.getElementById('ls-asin');
  const asins = [..._layoutAsinSet(l)];
  el.textContent = asins.length ? 'Für Bestellungen von: ' + asins.join(', ') : 'Keine ASIN festgelegt.';
  el.title = 'Ändern im Reiter „Layout“ unter „Gleiche ASIN“ bzw. am einzelnen Feld.';
}

// Zeitplan des Bestell-Abrufs als kurzer Text, z. B. „Mo–Fr 12:00 · Sa, So 11:00".
// `day` im Zeitplan zählt ab Sonntag = 0, angezeigt wird ab Montag.
function _lsZeitplanText(plan) {
  const TAG = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const proZeit = new Map();
  for (const e of plan || []) {
    if (!e || e.active === false || !e.time || !Number.isInteger(e.day)) continue;
    if (!proZeit.has(e.time)) proZeit.set(e.time, new Set());
    proZeit.get(e.time).add((e.day + 6) % 7);
  }
  return [...proZeit].map(([zeit, tage]) => {
    const t = [...tage].sort((a, b) => a - b);
    const laeufe = [];
    for (const d of t) {
      const l = laeufe[laeufe.length - 1];
      if (l && d === l[1] + 1) l[1] = d; else laeufe.push([d, d]);
    }
    const txt = laeufe.map(([a, b]) => a === b ? TAG[a] : b - a === 1 ? `${TAG[a]}, ${TAG[b]}` : `${TAG[a]}–${TAG[b]}`).join(', ');
    return { erst: t[0], txt: `${txt} ${zeit}` };
  }).sort((a, b) => a.erst - b.erst).map(x => x.txt).join(' · ');
}

async function lsAbrufZeitenZeigen() {
  const el = document.getElementById('ls-auto-wann');
  const rest = 'werden die neuen Bestellungen dieses Layouts sofort als Datei gespeichert.';
  let zeiten = '';
  try {
    const token = localStorage.getItem('jwt_access_token') || localStorage.getItem('token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    zeiten = _lsZeitplanText(await (await fetch(BASE_URL + '/v2/schedule', { headers, credentials: 'include' })).json());
  } catch (_) { }
  el.textContent = zeiten ? `Nach jedem Bestell-Abruf (${zeiten}) ${rest}` : `Nach jedem automatischen Bestell-Abruf ${rest}`;
}

// Aufteilung der Dateien: EINE Auswahl statt zweier Häkchen.
// Werte ↔ gespeicherte Schalter: blatt-seite = splitSatz + splitSeite · blatt = nur splitSatz ·
// seite = nur splitSeite · eine = keiner. Einseitige Layouts kennen nur „je Blatt“ und „alles in
// einer“ — bei ihnen bleibt splitSeite unverändert.
function lsAufteilungFuellen(l) {
  const sel = document.getElementById('ls-aufteilung');
  const zwei = (l.pages?.length || 1) > 1;
  const opts = zwei
    ? [['blatt-seite', 'Jedes Blatt einzeln, Vorder- und Rückseite getrennt (Standard)'],
    ['blatt', 'Jedes Blatt einzeln, Vorder- und Rückseite in einer Datei'],
    ['seite', 'Alle Vorderseiten in eine Datei, alle Rückseiten in eine'],
    ['eine', 'Alles in eine einzige Datei']]
    : [['blatt-seite', 'Jedes Blatt eine eigene Datei (Standard)'],
    ['eine', 'Alle Blätter in eine einzige Datei']];
  sel.innerHTML = opts.map(([v, txt]) => `<option value="${v}">${txt}</option>`).join('');
  const s = l.splitSatz ?? true, r = l.splitSeite ?? true;
  sel.value = !zwei ? (s ? 'blatt-seite' : 'eine')
    : (s && r) ? 'blatt-seite' : s ? 'blatt' : r ? 'seite' : 'eine';
}

// Beispiel-Dateinamen — dieselben Regeln wie _fileGroup/_stamm im Export: „_Seite" nur
// bei Vorder-/Rückseite, „_Blatt"/„Satz" zählt Bleche, die Bestellnummer nur, wenn genau
// eine Bestellung auf dem Blatt liegt.
function lsDateinameVorschau() {
  const el = document.getElementById('ls-dateiname-vorschau');
  if (!el) return;
  const art = document.getElementById('ls-dateiname-art').value;
  document.getElementById('ls-dateiname-eigen').hidden = art !== 'eigen';
  const m = (art === 'eigen' ? document.getElementById('ls-dateiname').value : art).trim();
  const name = document.getElementById('ls-name').value.trim() || 'Layout';
  const auf = document.getElementById('ls-aufteilung').value || 'blatt-seite';
  const zwei = _lsBeispiel.seiten > 1;
  const nachSeite = zwei && (auf === 'blatt-seite' || auf === 'seite');
  // Endung: DXF zuerst, das ist der Normalfall; sonst das erste gewählte Format
  const fmt = ['dxf', 'bmp', 'pdf', 'pdf-std', 'png', 'sublimation'].find(f => _lsFmtBox(f)?.checked);
  const ext = !fmt ? 'dxf' : fmt === 'pdf-std' ? 'pdf' : fmt === 'sublimation' ? 'png' : fmt;
  const ablage = document.getElementById('ls-ablage').value;
  document.getElementById('ls-beispiel-titel').textContent = ablage === 'tag'
    ? 'So heißen die Dateien im Tagesordner:' : 'Feste Dateinamen der Ezcad-Vorlage:';
  const zeilen = [];
  if (ablage !== 'tag') {
    // Dieselben festen Namen wie der Vorlage-Zweig in _exportFilledPages
    const ordner = document.getElementById('ls-vorlage-ordner').value.trim() || name;
    const g = _lsBeispiel.gravurSeiten || [], dat = [];
    if (_lsFmtBox('bmp')?.checked) dat.push('platz1.bmp, platz2.bmp …');
    if (_lsFmtBox('dxf')?.checked) {
      if (g[0]) dat.push('gravur.dxf');
      if (g[1]) dat.push('rueckseite.dxf');
      if (g[0] && _lsBeispiel.nurText) dat.push('gravur1.dxf, gravur2.dxf … (je Platz)');
    }
    if (_lsFmtBox('png')?.checked) dat.push(`${name}.png (Ansicht)`);
    zeilen.push(`_Vorlage/${ordner}/  →  ${dat.join(' · ') || '—'}`,
      `Kopie für jeden Tag: <Tag>/${_lsBeispiel.gruppe ? _lsBeispiel.gruppe + '/' : ''}${ordner}/`);
    if (ablage === 'beides') zeilen.push('plus die normalen Dateien im Tagesordner');
  } else if (m) {
    const bsp = (nr, bestellnr) => {
      const w = {
        layout: name, datum: _dayBerlin(), nr, seite: 1, bestellnr,
        kurznr: bestellnr.slice(-7), platz: 1
      };
      return m.replace(/\{(\w+)\}/g, (x, k) => (k in w ? String(w[k]) : x))
        .replace(/[<>:"\/\\|?*]/g, '_')
        + (nachSeite && !/\{seite\}/.test(m) ? '_Seite1' : '');
    };
    zeilen.push(`${bsp(1, '305-1234567-1234567')}.${ext}`, `${bsp(2, '302-7654321-7654321')}.${ext}`);
  } else if (auf === 'eine') {
    zeilen.push(`${name}.${ext}`);
  } else if (auf === 'seite') {
    zeilen.push(`${name}_Seite1.${ext}  (Vorderseiten)`, `${name}_Seite2.${ext}  (Rückseiten)`);
  } else {
    const sfx = auf === 'blatt' ? '_Blatt1' : (zwei ? '_Seite1' : '');
    zeilen.push(`${name}_1234567${sfx}.${ext}` + (nachSeite ? `  +  …_Seite2.${ext}` : '')
      + '  (1234567 = Ende der Bestellnummer)');
    if (_lsBeispiel.mehrere)
      zeilen.push(`${name}_${nachSeite ? 'Satz1_Seite1' : 'Blatt1'}.${ext}  (mehrere Bestellungen auf einem Blatt)`);
  }
  el.textContent = zeilen.join('\n');
}

// Zusammenfassung am zugeklappten „Erweitert": was davon vom Standard abweicht
function lsErweitertInfo() {
  const an = [];
  if (document.getElementById('ls-order').value !== 'date-desc') an.push('Reihenfolge');
  if (document.getElementById('ls-dxf-textblock').checked) an.push('Name als 1 Objekt');
  if (document.getElementById('ls-dxf-frame').checked) an.push('Rahmen');
  if (document.getElementById('ls-foto-vektor').checked) an.push('Fotos als Linien');
  // „Eigener“ ohne eingetragenes Muster speichert keinen Namen (saveLayoutSettings) — dann ist nichts an
  const _dnArt = document.getElementById('ls-dateiname-art').value;
  if (_dnArt && (_dnArt !== 'eigen' || document.getElementById('ls-dateiname').value.trim())) an.push('eigener Dateiname');
  const el = document.getElementById('ls-erweitert-info');
  el.textContent = an.length ? 'eingeschaltet: ' + an.join(', ') : 'selten gebraucht — alles auf Standard';
  el.classList.toggle('ls-erweitert-an', an.length > 0);
}

async function saveLayoutSettings() {
  if (!_lsCurrentId) return;
  const saved = await getServerLayouts();
  const l = saved.find(x => x.id === _lsCurrentId);
  if (!l) return;
  // Umbenennen (leerer Name → alter Name bleibt). Gruppe/Ordner wird NICHT mehr hier
  // gesetzt — das läuft jetzt über die Projekte-Ansicht (Drag & Drop).
  const altName = l.name;
  const newName = document.getElementById('ls-name').value.trim();
  // Namen sind Schlüssel (Reklamation, Auto-Export-Protokoll) — keine zwei gleichen.
  if (newName && newName !== altName && saved.some(x => x.id !== l.id && x.name === newName)) {
    showToast(`⚠️ „${newName}" gibt es schon — bitte anders nennen`, 5000);
    return;
  }
  const fmts = LS_FORMATS.filter(f => _lsFmtBox(f)?.checked);
  // Ohne Format fiel der Export bis 08.10.2026 still auf PDF zurück
  if (!fmts.length) { showToast('⚠️ Bitte mindestens ein Dateiformat wählen', 5000); return; }
  if (newName) l.name = newName;
  l.dxfStyle = document.getElementById('ls-dxf-style').value;
  l.dxfFrame = document.getElementById('ls-dxf-frame').checked;
  l.dxfCenterOrigin = document.getElementById('ls-dxf-center').checked;
  // bmpModus trägt zwei Dinge: vorlage/beides (Ablage) ODER blech/platz (BMP-Aufteilung)
  const _ablage = document.getElementById('ls-ablage').value;
  l.bmpModus = _ablage === 'tag' ? document.getElementById('ls-bmp-modus').value : _ablage;
  // Ordnername der Vorlage: leer = wie das Layout. Dieselbe Säuberung wie am Server
  // (sanitizeFolder), damit hier kein Pfad entstehen kann.
  l.vorlageOrdner = (document.getElementById('ls-vorlage-ordner').value || '')
    .replace(/[\/\\]/g, ' ').replace(/\.\.+/g, '.').trim().slice(0, 60);
  // Ohne eigenen Ordnernamen heißt der Ezcad-Arbeitsordner wie das Layout — umbenannt läse
  // die .ezd weiter den alten Ordner mit alten Bildern. Also den bisherigen Namen festhalten.
  if (!l.vorlageOrdner && l.name !== altName && _istVorlageLayout(l)) l.vorlageOrdner = altName;
  if (!l.vorlageOrdner) delete l.vorlageOrdner;
  // Dateiname-Muster: Pfadtrenner raus (das Muster ergibt einen NAMEN, keinen Ordner).
  const _dnWahl = document.getElementById('ls-dateiname-art').value;
  l.dateiname = (_dnWahl === 'eigen' ? (document.getElementById('ls-dateiname').value || '') : _dnWahl)
    .replace(/[\/\\]/g, '_').trim().slice(0, 80);
  if (!l.dateiname) delete l.dateiname;
  l.fotoVektor = document.getElementById('ls-foto-vektor').checked;
  l.dxfTextAsBlock = document.getElementById('ls-dxf-textblock').checked;
  l.exportFormat = fmts.length ? fmts.join('+') : 'pdf';
  // Aufteilung → die zwei gespeicherten Schalter (s. lsAufteilungFuellen). Einseitig wirkt
  // splitSeite nicht (s. _fileGroup) und bleibt, wie es war.
  const _auf = document.getElementById('ls-aufteilung').value;
  l.splitSatz = _auf === 'blatt-seite' || _auf === 'blatt';   // neue Datei pro Blatt
  l.splitSeite = (l.pages?.length || 1) > 1 ? (_auf === 'blatt-seite' || _auf === 'seite')
    : (l.splitSeite ?? true);
  l.autoExport = document.getElementById('ls-auto-export').checked;
  l.exportOrder = document.getElementById('ls-order').value;
  delete l.exportPages; // Alt-Feld, abgelöst durch splitSatz/splitSeite
  // Füll-Verhalten und ditherSettings gehören NICHT hierher: sie laufen über den
  // Befüllen-Bereich bzw. den Laser-Tab („ins Layout übernehmen").
  if (!await saveServerLayouts(saved)) return;   // Meldung kommt vom Store
  renderSaved();
  closeLayoutSettings();
  showToast('✅ Einstellungen gespeichert');
}

document.getElementById('layout-settings-overlay').addEventListener('click', function (e) {
  if (e.target === this) closeLayoutSettings();
});
// Ein Zuhörer für den ganzen Dialog statt eines onchange je Häkchen; `input` für die
// Textfelder (Name, eigenes Dateinamen-Muster), damit das Beispiel beim Tippen mitläuft.
document.getElementById('layout-settings-overlay').addEventListener('change', lsZustand);
document.getElementById('layout-settings-overlay').addEventListener('input', lsZustand);
