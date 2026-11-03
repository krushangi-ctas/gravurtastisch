const cron = require('node-cron');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { autoRemoveFolders } = require('./file-remove.controller');
const { nachtSicherung } = require('./sicherung.controller');
const { computeTimeRange, berlinDayOf, berlinUhrzeit } = require('./time-range');
const { writeJsonAtomic, readJsonSafe } = require('./utils/json-file');
const { createLogger } = require('./utils/logger');
const { meldeAktivitaet } = require('./utils/activity');
const logger = createLogger('index.log', __filename);

const puppeteer = require('puppeteer');

const SCHEDULE_FILE = path.join(config.datenDir, 'schedule.json');

// ── Puppeteer Auto-Export ─────────────────────────────────────────────────────
// [EN] ── Puppeteer Auto-Export ─────────────────────────────────────────────────
const PUPPETEER_TIMEOUT_MS = 10 * 60 * 1000; // 10 Minuten max (vorher: 15 Min, hat zu langem Hängen geführt)
// [EN] 10 minutes max (previously: 15 min, caused overly long hangs)

// opts wird als Query an die Editor-Seite gehängt und steuert dort den Umfang des
// Auto-Exports (fillFrom/fillTo = Kauftage statt Session). Leer = Verhalten wie immer.
// [EN] opts is appended as query parameter to editor page and controls scope of
// [EN] auto-export (fillFrom/fillTo = purchase dates instead of session). Empty = behavior as usual.
async function runPuppeteerExport(retryCount = 0, opts = {}) {
  const MAX_RETRIES = 2; // bis zu 3 Versuche gesamt
  // [EN] up to 3 attempts total
  logger.log(`Puppeteer: starte headless Browser für Auto-Export… (Versuch ${retryCount + 1}/${MAX_RETRIES + 1})`);
  let browser;
  const startedAt = Date.now();

  try {
    browser = await puppeteer.launch({
      headless: true,   // seit Puppeteer 22 = der neue Headless-Modus ('new' ist veraltet)
      // [EN] since Puppeteer 22 = the new headless mode ('new' is deprecated)
      executablePath: process.env.CHROMIUM_PATH || '/snap/bin/chromium',
      // Puppeteer begrenzt JEDEN Protokoll-Aufruf auf 180 s — auch das Warten von waitForFunction
      // unten, egal welches `timeout` dort steht. Tagesläufe dauerten bis 11.10.2026 schon 120–154 s;
      // ein größerer Lauf brach sonst mit „Waiting failed" mitten im Export ab.
      // [EN] Puppeteer limits EVERY protocol call to 180s — including waitForFunction wait
      // [EN] below, regardless of which `timeout` is specified there. Daily runs already took 120–154s;
      // [EN] a larger run otherwise aborted with "Waiting failed" in the middle of export.
      protocolTimeout: PUPPETEER_TIMEOUT_MS + 2 * 60 * 1000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ]
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(PUPPETEER_TIMEOUT_MS);

    // Browser-Konsole ins Server-Log (Präfix „Browser:"), Fehler als Fehler — daraus liest man den
    // Ablauf eines Exports nach. Die nichtssagende Chromium-Meldung „Failed to load resource: … 404"
    // wird ausgelassen — die Zeile mit der URL kommt aus dem response-Handler direkt darunter (sonst
    // stand jeder Fund doppelt da, und die Schriftsuche meldete Fehler für Erfolge).
    // [EN] Pipe browser console to server log (prefix "Browser:"), errors as errors — used to trace
    // [EN] export progression. The vague Chromium message "Failed to load resource: … 404"
    // [EN] is skipped — line with URL comes from response handler right below (otherwise
    // [EN] each occurrence was logged twice, and font search reported errors for successful loads).
    page.on('console', msg => {
      const t = msg.text();
      if (msg.type() !== 'error') { logger.log('Browser:', t); return; }
      if (/Failed to load resource/i.test(t)) return; // s.o. — der 404-Handler meldet es mit URL
      // [EN] see above — 404 handler reports it with URL
      logger.error('Browser Fehler:', t);
    });
    page.on('pageerror', err => logger.error('Browser JS-Fehler:', err.message));

    // 404-URLs loggen damit wir sehen welche Ressource fehlt.
    // Als warn, nicht error: die Font-Suche probiert bewusst mehrere Dateinamen durch
    // (loadOTFont), ein 404 ist dort der Normalfall und kein Fehler. Bleibt WIRKLICH
    // keine Schrift übrig, meldet loadOTFont das selbst als eigene Zeile.
    // Ganz ohne Zeile: das ASIN-Profil (/asin-check/<ASIN>). Der Editor fragt es beim Füllen für jede
    // Layout-ASIN ab, und für eine ASIN ohne bisherige Bestellung gibt es keins — bis 27.10.2026 rund
    // 550 Zeilen je Lauf, zwischen denen die echten Funde (fehlende Schrift) untergingen.
    // [EN] Log 404 URLs so we see which resource is missing.
    // [EN] As warn, not error: font search intentionally tries several file names
    // [EN] (loadOTFont), a 404 is normal there and not an error. If TRULY no font
    // [EN] remains, loadOTFont logs this itself as a separate line.
    // [EN] Completely without line: ASIN profile (/asin-check/<ASIN>). The editor requests it when filling
    // [EN] each layout ASIN, and there isn't one for an ASIN without previous orders — generating ~550
    // [EN] lines per run where genuine findings (missing font) were lost.
    page.on('response', response => {
      if (response.status() === 404 && !/\/asin-check\/[A-Z0-9]{10}(\?|$)/.test(response.url())) {
        logger.warn('Browser 404:', response.url());
      }
    });

    // Seiten-Navigation während Export erkennen (frame detached Ursache)
    // [EN] Detect page navigation during export (frame detached cause)
    page.on('framedetached', frame => {
      logger.error('Browser: Frame detached!', frame.url());
    });

    const zusatz = Object.entries(opts)
      .filter(([, v]) => v != null && v !== '')
      .map(([k, v]) => `&${k}=${encodeURIComponent(v)}`).join('');
    const url = `http://localhost:${config.port}/layout-editor.html?autoexport=1&nocache=${Date.now()}${zusatz}`;
    logger.log('Puppeteer: öffne', url);

    // domcontentloaded statt networkidle0 — networkidle0 wartet auf ALLE requests
    // und kann ewig hängen wenn ein poll-Interval läuft (z.B. /progress alle 2s)
    // [EN] domcontentloaded instead of networkidle0 — networkidle0 waits for ALL requests
    // [EN] and can hang indefinitely if a polling interval is running (e.g. /progress every 2s)
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

    logger.log('Puppeteer: warte auf Auto-Export (max 10 Min)…');

    // Warte auf _autoExportDone ODER einen Fehler-Flag
    // Fehlerbehandlung für "frame got detached" — Seite wurde während waitForFunction neu geladen
    // [EN] Wait for _autoExportDone OR an error flag
    // [EN] Error handling for "frame got detached" — page was reloaded during waitForFunction
    await page.waitForFunction(
      () => window._autoExportDone === true || window._autoExportError != null,
      // 500 ms statt 3 s: erst danach ist der Export frei — ein Reklamations-Knopf direkt nach dem
      // vorigen musste sonst den Rest abwarten bzw. lief in die 30-s-Warteschleife unten.
      // [EN] 500 ms instead of 3 s: only after this is the export free — a complaint button directly
      // [EN] after previous one would otherwise have to wait out the remainder or enter 30s queue loop below.
      { timeout: PUPPETEER_TIMEOUT_MS, polling: 500 }
    ).catch(async (err) => {
      // Prüfen ob die Seite trotzdem fertig ist (race condition)
      // [EN] Check if page finished anyway (race condition)
      const done = await page.evaluate(() => window._autoExportDone).catch(() => false);
      if (!done) throw err;
    });

    // Prüfen ob Fehler oder Erfolg
    // [EN] Check whether error or success
    const exportError = await page.evaluate(() => window._autoExportError).catch(() => null);
    if (exportError) {
      throw new Error('Auto-Export Fehler im Browser: ' + exportError);
    }

    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    logger.log(`Puppeteer: Auto-Export abgeschlossen ✅ (${durationSec}s)`);

  } catch(e) {
    const durationSec = Math.round((Date.now() - startedAt) / 1000);
    logger.error(`Puppeteer Fehler nach ${durationSec}s:`, e.message);

    // Automatischer Retry bei "frame got detached" oder ähnlichen transienten Fehlern
    // [EN] Automatic retry on "frame got detached" or similar transient errors
    const isRetryable = e.message.includes('detached') || e.message.includes('closed') || e.message.includes('crashed');
    if (isRetryable && retryCount < MAX_RETRIES) {
      const waitSec = 30 * (retryCount + 1);
      logger.log(`Puppeteer: Retry in ${waitSec}s (Versuch ${retryCount + 2}/${MAX_RETRIES + 1})…`);
      // Den kaputten Browser VOR der Wartezeit schließen, nicht danach — sonst hält er
      // 30–60 s lang seinen Speicher, während schon der nächste startet.
      // [EN] Close broken browser BEFORE wait time, not after — otherwise it holds its
      // [EN] memory for 30–60s while the next one starts.
      if (browser) {
        await browser.close().catch(() => {});
        browser = null;
      }
      await new Promise(r => setTimeout(r, waitSec * 1000));
      // opts MUSS mitgereicht werden: ohne sie fiele ein Wiederholungsversuch still auf
      // den normalen Session-Export zurück — aus einer Reklamation oder einem Lauf über
      // den ganzen Zeitraum würde unbemerkt etwas anderes.
      // [EN] opts MUST be passed along: without it a retry would silently fall back to
      // [EN] normal session export — turning a complaint or full period run into something else unnoticed.
      return runPuppeteerExport(retryCount + 1, opts);
    }

    throw e; // Weitergeben damit der Aufrufer es ins Activity-Log schreibt
    // [EN] Propagate so caller writes it into activity log
  } finally {
    if (browser) {
      await browser.close().catch(e => logger.error('Browser schließen Fehler:', e.message));
      logger.log('Puppeteer: Browser geschlossen.');
    }
  }
}

// ── Persistente Auto-Export-Aufträge ─────────────────────────────────────────
// ALLE ausstehenden Aufträge stehen in einer Datei und werden nach einem Neustart nachgeholt
// (recoverPendingExport). Eine Liste, weil auch Wartende einen Neustart überleben müssen.
// [EN] ── Persistent auto-export jobs ─────────────────────────────────────────
// [EN] ALL pending jobs reside in a file and are caught up after restart
// [EN] (recoverPendingExport). A list, because waiting jobs must also survive restart.
const PENDING_EXPORT_FILE = path.join(config.datenDir, 'pending-export.json');
const _auftraege = new Map();   // id → { scheduledAt, reason, opts }
// [EN] id → { scheduledAt, reason, opts }
let _auftragNr = 0;
const _auftraegeSichern = () => {
  try {
    if (_auftraege.size) writeJsonAtomic(PENDING_EXPORT_FILE, [..._auftraege.values()]);
    else fs.rmSync(PENDING_EXPORT_FILE, { force: true });
  } catch (_) {}
};

let _progressRef = null; // von applySchedule gesetzt — Running-Check vor Export-Start
// [EN] set by applySchedule — running check before export start

// Reentranz-Riegel: nie zwei headless Chromium parallel (Speicher, gleichnamige Dateien).
// Gehalten wird der Umfang (opts als JSON) des laufenden Exports, null = keiner. Derselbe
// Auftrag ein zweites Mal wird verworfen, ein ANDERER wartet.
// [EN] Reentrancy lock: never two headless Chromiums in parallel (memory, colliding file names).
// [EN] Stores scope (opts as JSON) of running export, null = none. Identical job
// [EN] a second time is discarded, a DIFFERENT one waits.
let _exportRunning = null;
const exportLaeuft = () => _exportRunning !== null;

function schedulePuppeteerExport(delayMs, reason, attempt = 0, opts = {}, id = ++_auftragNr) {
  // opts mitschreiben: nach einem Neustart muss die Recovery denselben Umfang exportieren.
  // [EN] write opts: after restart recovery must export same scope.
  if (!_auftraege.has(id)) { _auftraege.set(id, { scheduledAt: new Date().toISOString(), reason, opts }); _auftraegeSichern(); }
  const erledigt = () => { _auftraege.delete(id); _auftraegeSichern(); };
  setTimeout(async () => {
    // Läuft gerade ein Download (z.B. Queue-Recovery nach Neustart)? Export verschieben
    // statt eine halbfertige Session zu exportieren — max. 5× à 2 Minuten.
    // [EN] Is a download currently running (e.g. queue recovery after restart)? Defer export
    // [EN] instead of exporting a half-finished session — max 5x at 2 minutes each.
    if (_progressRef?.running) {
      if (attempt < 5) {
        logger.log(`Auto-Export verschoben — Download läuft noch (Versuch ${attempt + 1}/5).`);
        return schedulePuppeteerExport(2 * 60 * 1000, reason, attempt + 1, opts, id);
      }
      // Limit erreicht: NICHT trotzdem exportieren — mitten im Download wäre die Session
      // unvollständig und die Dateien sähen trotzdem "fertig" aus. Laut abbrechen.
      // [EN] Limit reached: do NOT export anyway — in mid-download session would be
      // [EN] incomplete and files would still look "done". Abort loudly.
      logger.error('Auto-Export abgebrochen — Download läuft nach 5 Verschiebungen (10 Min) immer noch.');
      meldeAktivitaet('error', '❌ Auto-Export abgebrochen — Download lief nach 10 Min Wartezeit immer noch. Bitte manuell exportieren (Füllen + Export).', { status: 'error' });
      return erledigt();
    }
    const umfang = JSON.stringify(opts || {});
    if (_exportRunning !== null) {
      if (_exportRunning === umfang) {
        logger.warn(`Auto-Export mit demselben Umfang läuft bereits — dieser Auftrag (${reason}) wird verworfen.`);
        meldeAktivitaet('info', 'ℹ️ Auto-Export übersprungen — derselbe läuft bereits', { status: 'skipped' });
        return erledigt();
      }
      logger.log(`Auto-Export (${reason}) wartet — es läuft noch ein anderer.`);
      // Reklamation: der Bediener wartet davor (ein Export dort dauert Sekunden), sonst 30 s
      // [EN] Complaint: operator is waiting (export takes seconds there), otherwise 30s
      return schedulePuppeteerExport(opts?.onlyOrder ? 3000 : 30 * 1000, reason, attempt, opts, id);
    }
    _exportRunning = umfang;
    // Die Vorschau der Reklamation (jeder Knopf dort) ist kein Export — sonst ein Eintrag je Klick
    // [EN] Preview of complaint (each button there) is not an export — otherwise an entry per click
    if (!opts?.vorschau) meldeAktivitaet('export', '🖨 Puppeteer Auto-Export gestartet', { status: 'running' });
    try {
      await runPuppeteerExport(0, opts);
    } catch(e) {
      logger.error('Puppeteer Fehler:', e.message);
      meldeAktivitaet('error', `❌ Puppeteer Fehler: ${e.message}`, { status: 'error' });
    } finally {
      _exportRunning = null;
      erledigt(); // Erfolg ODER endgültiger Fehler wurde gemeldet
      // [EN] Success OR final error was reported
    }
  }, delayMs);
}

// Beim Serverstart: gab es vor dem Neustart noch nicht gelaufene Exporte?
// [EN] On server startup: were there unexecuted exports before restart?
function recoverPendingExport() {
  try {
    if (!fs.existsSync(PENDING_EXPORT_FILE)) return;
    const roh = readJsonSafe(PENDING_EXPORT_FILE, null);
    fs.rmSync(PENDING_EXPORT_FILE, { force: true }); // schedulePuppeteerExport schreibt sie neu
    // [EN] schedulePuppeteerExport rewrites it
    if (!Array.isArray(roh)) { logger.warn('pending-export.json unlesbar — verworfen.'); return; }
    for (const info of roh) {
      const ageH = (Date.now() - new Date(info && info.scheduledAt).getTime()) / 3600000;
      if (!(ageH < 12)) {
        // Uralt (oder unlesbares Datum) → verwerfen, der nächste reguläre Lauf exportiert ohnehin
        // [EN] Very old (or unreadable date) → discard, next regular run will export anyway
        logger.log(`Recovery: ausstehender Auto-Export ist ${Math.round(ageH)}h alt — verworfen.`);
        continue;
      }
      logger.log(`Recovery: ausstehender Auto-Export gefunden (${info.reason || 'unbekannt'}) — starte in 90s.`);
      meldeAktivitaet('info', '🔄 Recovery: Auto-Export wird nachgeholt', { status: 'pending' });
      schedulePuppeteerExport(90 * 1000, 'recovery: ' + (info.reason || ''), 0, info.opts || {});
    }
  } catch(e) {
    logger.error('recoverPendingExport Fehler:', e.message);
  }
}

// ── Auto-Cleanup (alte Download- und Export-Ordner) ──────────────────────────
// Eigener Job, NICHT an den Zeitplan gehängt: er ist das Sicherheitsnetz und muss auch
// laufen, wenn alle Zeitplan-Einträge pausiert sind. 03:00 liegt weit weg vom
// Download-Fenster (11–13 Uhr) und dem Auto-Export danach.
// [EN] ── Auto-cleanup (old download and export folders) ──────────────────────
// [EN] Separate job, NOT attached to schedule: it is the safety net and must also
// [EN] run when all schedule entries are paused. 03:00 is well away from
// [EN] download window (11-13h) and auto-export afterwards.
const CLEANUP_CRON = '0 3 * * *';
let _cleanupTask = null;

function startCleanupCron(progress) {
  // Auch hier setzen, nicht nur in applySchedule: ohne gespeicherten Zeitplan blieb
  // _progressRef sonst null, und ein Reklamations-Export prüfte nie, ob gerade ein
  // manueller Download läuft.
  // [EN] Set here too, not only in applySchedule: without saved schedule
  // [EN] _progressRef remained null, and complaint export never checked if a
  // [EN] manual download is running.
  _progressRef = _progressRef || progress;
  if (_cleanupTask) return _cleanupTask; // idempotent
  _cleanupTask = cron.schedule(CLEANUP_CRON, async () => {
    // Download UND Export lesen beide Ordner unter public/ — währenddessen nicht löschen. Die
    // Nacht-Sicherung darunter läuft trotzdem (bis 26.10.2026 entfiel sie mit dem Aufräumen).
    // [EN] Download AND export both read folders under public/ — do not delete while running.
    // [EN] Night backup below runs anyway (previously omitted if cleanup skipped).
    if (progress?.running || exportLaeuft()) {
      logger.log('Auto-Cleanup übersprungen — Download oder Export läuft gerade.');
    } else try {
      const r = await autoRemoveFolders();
      logger.log(`Auto-Cleanup: ${r.downloads} Download-, ${r.exports} Export-Ordner, ${r.failed} Dead-Letter-Eintrag/Einträge, ${r.profile} Browser-Profil(e), ${r.rekla} Rekla-Zwischenstand/-stände gelöscht.`);
      // Nur melden, wenn wirklich gelöscht wurde (sonst schweigen statt Log-Rauschen).
      // [EN] Only report if actually deleted (otherwise silence instead of log noise).
      const gesamt = r.downloads + r.exports + r.failed;
      if (gesamt > 0) {
        meldeAktivitaet('info', `🧹 Aufgeräumt: ${r.downloads} Download-, ${r.exports} Export-Ordner`
          + (r.failed ? `, ${r.failed} aussortierte Bestellung(en)` : ''), { count: gesamt, status: 'done' });
      }
    } catch (err) {
      logger.error('Auto-Cleanup Fehler:', err.message);
      meldeAktivitaet('error', `❌ Auto-Cleanup fehlgeschlagen: ${err.message}`, { status: 'error' });
    }
    // Nacht-Sicherung der Betriebsdaten (sicherung.controller.js) — eigener try: ein Fehler
    // hier darf das Aufräumen nicht kippen und umgekehrt.
    // [EN] Night backup of operational data (sicherung.controller.js) — separate try: an error
    // [EN] here must not knock out cleanup and vice versa.
    try {
      nachtSicherung();
    } catch (err) {
      logger.error('Nacht-Sicherung Fehler:', err.message);
      meldeAktivitaet('error', `❌ Nacht-Sicherung fehlgeschlagen: ${err.message}`, { status: 'error' });
    }
  }, { timezone: 'Europe/Berlin' });
  logger.log(`Auto-Cleanup registriert: ${CLEANUP_CRON} (Europe/Berlin)`);
  return _cleanupTask;
}

// Aktive cron Jobs (id → cron task)
// [EN] Active cron jobs (id → cron task)
const activeTasks = new Map();

// Zeitplan laden
// [EN] Load schedule
function loadSchedule() {
  const entries = readJsonSafe(SCHEDULE_FILE, [],
    e => logger.error('Zeitplan unlesbar, starte ohne:', e.message));
  return Array.isArray(entries) ? entries : [];
}

// Zeitplan speichern (atomar — halb geschriebene schedule.json würde beim nächsten
// Start alle Zeitpläne verlieren). Rückgabe: true = gespeichert.
// [EN] Save schedule (atomically — half-written schedule.json would lose all schedules
// [EN] on next startup). Return: true = saved.
function saveSchedule(entries) {
  try {
    writeJsonAtomic(SCHEDULE_FILE, entries);
    return true;
  } catch(e) {
    logger.error('Fehler beim Speichern des Zeitplans:', e.message);
    return false;
  }
}

// Cron-Ausdruck für einen Zeitplan-Eintrag
// [EN] Cron expression for a schedule entry
function buildCronExpression(day, time) {
  // day: 0=So, 1=Mo, 2=Di, 3=Mi, 4=Do, 5=Fr, 6=Sa
  // [EN] day: 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  const [hh, mm] = time.split(':');
  return `${parseInt(mm)} ${parseInt(hh)} * * ${day}`;
}

// Fenster-Start um 90 min nach hinten verschieben: Amazon indexiert frische Bestellungen
// verzögert (bis ~1 h) — ohne Overlap gingen Nachzügler am Fenster-Ende dauerhaft verloren.
// Doppel-Gravur ist ausgeschlossen: alles dedupliziert nach orderId (public-Ordner, Queue, Session).
// [EN] Shift window start back by 90 min: Amazon indexes fresh orders with a delay
// [EN] (up to ~1h) — without overlap, stragglers at window end were permanently lost.
// [EN] Double engraving is excluded: everything deduplicated by orderId (public folder, queue, session).
const OVERLAP_MINUTES = 90;

// Amazon verlangt, dass "Before"-Zeiten mindestens ~2 Minuten in der Vergangenheit liegen.
// [EN] Amazon requires "Before" timestamps to be at least ~2 minutes in the past.
const AMAZON_MIN_BUFFER_MIN = 2;
// Wartezeit bis zum Nachschlag (s. runEntry). Muss über AMAZON_MIN_BUFFER_MIN liegen,
// sonst holt der Nachschlag nur ein Fenster, das Amazon selbst noch abschneidet.
// 5 Minuten: der Auto-Export wartete ohnehin 2, es kostet also kaum Zeit.
// [EN] Delay before catch-up pass (see runEntry). Must exceed AMAZON_MIN_BUFFER_MIN,
// [EN] otherwise catch-up only queries a window Amazon itself clips.
// [EN] 5 minutes: auto-export was waiting 2 anyway, so costs little time.
const NACHSCHLAG_DELAY_MIN = 5;

// ── Watermark: "bis hierhin ist alles gesehen" ───────────────────────────────
// Die Preset-Zeiten (fromTime & Co.) berechnen den Fenster-START aus dem KALENDER, nicht aus dem
// letzten Lauf. Startet ein Eintrag später als der vorige, klafft dazwischen eine Lücke, und was dort
// sein LastUpdateDate bekam (z. B. eine Sammel-Versandbestätigung), war verloren. Deshalb merkt sich
// jeder erfolgreiche Lauf seine Obergrenze; der nächste zieht seinen Start notfalls darauf zurück.
// [EN] ── Watermark: "everything up to here has been seen" ────────────────────
// [EN] Preset times (fromTime, etc.) calculate window START from CALENDAR, not from
// [EN] last run. If an entry starts later than previous one, a gap opens, and whatever
// [EN] got its LastUpdateDate there was lost. Therefore each successful run records
// [EN] its upper limit; next run pulls its start back to it if needed.
const WATERMARK_FILE = path.join(config.datenDir, 'fetch-watermark.json');
const MAX_LOOKBACK_DAYS = 7; // Deckel nach einem längeren Ausfall (Ledger dedupliziert ohnehin)
// [EN] Cap after an extended outage (ledger deduplicates anyway)

function loadWatermark() {
  // erster Lauf / defekte Datei → null, dann greift nur die Preset-Logik
  // [EN] first run / corrupt file → null, then only preset logic applies
  const wm = readJsonSafe(WATERMARK_FILE, null)?.coveredUntil;
  return wm && !isNaN(Date.parse(wm)) ? wm : null;
}

// Nur ein Lauf über ALLE Status hat das Fenster wirklich vollständig gesehen. Stünde
// ein Eintrag auf "Nicht versendet", würde er die inzwischen versandten Bestellungen
// gar nicht geliefert bekommen — der Watermark würde ihr Zeitfenster trotzdem als
// erledigt abhaken und sie damit endgültig begraben. Solche Läufe schieben ihn nicht.
// [EN] Only a run over ALL statuses has genuinely seen window completely. If
// [EN] an entry were set to "Unshipped", it wouldn't receive orders shipped
// [EN] in the meantime — watermark would still mark their time window as
// [EN] done and bury them permanently. Such runs do not advance it.
function coversAllStatuses(status) {
  // Über die EINZELNEN Einträge, nicht per includes() über den ganzen String:
  // 'PartiallyShipped'.includes('Shipped') ist true — "Unshipped,PartiallyShipped" hätte sich als
  // vollständig ausgegeben und den Watermark vorgeschoben.
  // [EN] Via INDIVIDUAL entries, not via includes() across the entire string:
  // [EN] 'PartiallyShipped'.includes('Shipped') is true — "Unshipped,PartiallyShipped" would have
  // [EN] claimed to be complete and advanced the watermark.
  const set = new Set(String(status || '').split(',').map(v => v.trim()));
  return ['Unshipped', 'PartiallyShipped', 'Shipped'].every(v => set.has(v));
}

function saveWatermark(iso) {
  try {
    writeJsonAtomic(WATERMARK_FILE, { coveredUntil: iso, savedAt: new Date().toISOString() });
    logger.log(`Watermark gesetzt: abgedeckt bis ${iso}`);
  } catch (e) {
    logger.error('Watermark konnte nicht gespeichert werden:', e.message);
  }
}

// Zeitraum { lastUpdatedAfter, createdBefore } — geteilte Berlin→UTC-Logik (time-range.js),
// damit aufeinanderfolgende Auto-Läufe nahtlos aneinander anschließen.
// [EN] Time period { lastUpdatedAfter, createdBefore } — shared Berlin→UTC logic (time-range.js)
// [EN] so successive auto runs connect seamlessly.
function calcTimeRange(entry) {
  let { lastUpdatedAfter, createdBefore } = computeTimeRange({
    preset: entry.fromPreset,
    fromTime: entry.fromTime,
    overlapMinutes: OVERLAP_MINUTES,
    bufferMinutes: AMAZON_MIN_BUFFER_MIN,
  });

  // Start = min(Preset-Start, Watermark − Overlap). Der Overlap-Abzug holt zusätzlich
  // die Bestellungen nach, die Amazon beim letzten Lauf wegen seiner Indexierungs-
  // Latenz noch gar nicht auslieferte, obwohl sie im Fenster lagen. Doppelte Downloads
  // verhindert das Ledger (processed-orders.json) — der Preis ist nur ein paar
  // API-Seiten mehr pro Lauf.
  // [EN] Start = min(Preset-Start, Watermark − Overlap). Overlap deduction additionally catches
  // [EN] up on orders that Amazon did not yet return on previous run due to indexing
  // [EN] latency even though they were in window. Double downloads are prevented
  // [EN] by ledger (processed-orders.json) — the only cost is a few more API pages per run.
  const wm = loadWatermark();
  if (wm && lastUpdatedAfter) {
    const floor = Date.now() - MAX_LOOKBACK_DAYS * 86400000;
    const wmStart = Math.max(Date.parse(wm) - OVERLAP_MINUTES * 60000, floor);
    if (wmStart < Date.parse(lastUpdatedAfter)) {
      logger.log(`Watermark zieht Fenster-Start vor: ${lastUpdatedAfter} → ${new Date(wmStart).toISOString()} (zuletzt abgedeckt bis ${wm})`);
      lastUpdatedAfter = new Date(wmStart).toISOString();
    }
  }

  const overlapNote = OVERLAP_MINUTES > 0 ? ` (inkl. ${OVERLAP_MINUTES} min Overlap)` : '';
  logger.log(`Zeitraum (Berlin): ${new Date(lastUpdatedAfter).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })} → ${new Date(createdBefore).toLocaleString('de-DE', { timeZone: 'Europe/Berlin' })}${overlapNote}`);
  logger.log(`Zeitraum (UTC):    ${lastUpdatedAfter} → ${createdBefore}`);
  return { lastUpdatedAfter, createdBefore };
}

// Alle Jobs stoppen
// [EN] Stop all jobs
function stopAllTasks() {
  activeTasks.forEach(task => task.stop());
  activeTasks.clear();
}

// ── Gemeinsamer Download-Lauf: manuell (/start-cron) UND Zeitplan ─────────────
// Setzt die progress-Phasen (fetch → download → done/error), ruft Fetch + Queue und schreibt die
// Standard-Activity-Meldungen — eine Sequenz für beide Wege, damit sie nicht auseinanderlaufen.
// opts: { minutes, status, lastUpdatedAfter, createdBefore, startMessage, doneMessage }
// Rückgabe: true = Lauf erfolgreich, false = Fehler (progress.error ist gesetzt).
// [EN] ── Shared download run: manual (/start-cron) AND schedule ───────────────
// [EN] Sets progress phases (fetch → download → done/error), calls Fetch + Queue and writes
// [EN] standard activity messages — one sequence for both paths so they do not drift apart.
// [EN] opts: { minutes, status, lastUpdatedAfter, createdBefore, startMessage, doneMessage }
// [EN] Return: true = run successful, false = error (progress.error is set).
async function runDownload(opts, progress, amazon) {
  // Frischer Lauf: Reste des vorherigen Laufs löschen (sonst zeigt die UI kurz
  // einen alten done/error-Zustand)
  // [EN] Fresh run: clear remnants of previous run (otherwise UI briefly shows
  // [EN] an old done/error state)
  progress.running = true;
  progress.done = false;
  progress.error = null;
  progress.total = 0;
  progress.current = 0;
  progress.phase = 'fetch';
  progress.message = opts.startMessage || 'Suche Bestellungen…';
  try {
    // opts.force kommt NUR vom manuellen Download (s. /start-cron) — der Zeitplan setzt
    // ihn nie, sonst käme jede Nacht das komplette Fenster erneut herein und der
    // Auto-Export gravierte alles ein zweites Mal.
    // [EN] opts.force comes ONLY from manual download (see /start-cron) — schedule never
    // [EN] sets it, otherwise every night entire window would re-enter and
    // [EN] auto-export would engrave everything a second time.
    await amazon.manageFetchOrders(opts.minutes, opts.status, opts.lastUpdatedAfter, opts.createdBefore, progress, { force: opts.force, keepSession: opts.keepSession });
    progress.phase = 'download';
    progress.message = 'Lade Bilder herunter…';
    await amazon.manageProcessQueue(progress);
    progress.running = false;
    progress.done = true;
    progress.phase = 'done';
    // total = tatsächlich verarbeitete Bestellungen (die Queue kann Recovery-Reste
    // enthalten haben, dann ist current aussagekräftiger als der Fetch-Zähler)
    // [EN] total = actually processed orders (queue could contain recovery leftovers,
    // [EN] then current is more meaningful than fetch counter)
    progress.total = progress.current || progress.total;
    // Abgebrochen („Download abbrechen"): nicht „Fertig! Alle …" melden — Ungeprüftes und
    // Wartendes holt der nächste Lauf (die Queue bleibt liegen).
    // [EN] Aborted ("Cancel download"): do not report "Done! All..." — unchecked and
    // [EN] waiting orders are picked up by next run (queue remains intact).
    const abgebrochen = !!(amazon.isCancelRequested && amazon.isCancelRequested());
    progress.message = abgebrochen
      ? `Abgebrochen — ${progress.total || 0} Bestellungen geladen, der Rest kommt mit dem nächsten Lauf.`
      : (opts.doneMessage || 'Fertig! Alle Bestellungen verarbeitet.');
    logger.log(progress.message);
    meldeAktivitaet('download', abgebrochen
      ? `⏹ ${opts.doneActivityText || 'Download'} abgebrochen — ${progress.total || 0} Bestellungen geladen`
      : `✅ ${opts.doneActivityText || 'Download fertig'} — ${progress.total || 0} Bestellungen`,
      { count: progress.total || 0, status: abgebrochen ? 'cancelled' : 'done' });
    return true;
  } catch (err) {
    progress.running = false;
    progress.phase = 'error';
    progress.error = err.message;
    progress.message = 'Fehler: ' + err.message;
    logger.error('Download-Lauf Fehler:', err.message);
    meldeAktivitaet('error', `❌ Download Fehler: ${err.message}`, { status: 'error' });
    return false;
  }
}

const DAYS = ['So','Mo','Di','Mi','Do','Fr','Sa'];

// EIN Ablauf für den Zeitplan UND für das ↻ am Eintrag: Fenster → Download → Watermark
// → lastRun → Auto-Export.
//
// opts.repeat = Nachlese eines schon gelaufenen Eintrags:
//   • Der Fenster-START bleibt der des geplanten Laufs (inkl. 90 min Overlap).
//   • Das ENDE wird auf „jetzt" gezogen — sonst fielen genau die Bestellungen weg, deren
//     Zeitstempel nach der alten Obergrenze neu geschrieben wurde (Versandbestätigung).
//   • Watermark und lastRun bleiben unberührt (eine Nachlese ist kein regulärer Lauf).
//   • Der Auto-Export läuft mit; seine Dateien landen in „<Tag> Lauf N" (s. /export-run in index.js).
// [EN] ONE flow for schedule AND for ↻ on entry: Window → Download → Watermark
// [EN] → lastRun → Auto-Export.
// [EN]
// [EN] opts.repeat = catch-up pass of an already executed entry:
// [EN]   • Window START remains that of planned run (incl. 90 min overlap).
// [EN]   • END is pulled to "now" — otherwise orders whose timestamp was updated
// [EN]     after old upper limit (shipping confirmation) would be omitted.
// [EN]   • Watermark and lastRun remain untouched (catch-up pass is not a regular run).
// [EN]   • Auto-export runs along; its files land in "<Day> Run N" (see /export-run in index.js).
async function runEntry(entry, progressRef, amazon, opts = {}) {
  const repeat = !!opts.repeat;
  // 'window' = die Layouts mit ALLEN Bestellungen der abgedeckten Kauftage füllen, nicht
  // nur mit den Nachzüglern des Laufs. Nur bei einer Wiederholung wählbar.
  // [EN] 'window' = fill layouts with ALL orders of covered purchase days, not
  // [EN] only with stragglers of run. Selectable only on a rerun.
  const fillWindow = repeat && opts.fillScope === 'window';
  const tag = `${DAYS[entry.day]} ${entry.time}`;
  logger.log(repeat ? `↻ Wiederholung von ${tag} gestartet` : `⏰ Zeitplan startet: ${tag}`);

  if (progressRef.running) {
    logger.log(repeat ? 'Wiederholung: es läuft bereits ein Abruf, übersprungen.'
                      : 'Zeitplan: bereits läuft, übersprungen.');
    return false;
  }

  let { lastUpdatedAfter, createdBefore } = calcTimeRange(entry);
  if (repeat) {
    // Der Pfeil bedeutet immer „mach die Arbeit dieses Eintrags jetzt". Was das heißt,
    // hängt davon ab, ob der Termin heute schon durch ist:
    //
    //   1. Heute fällig und schon gelaufen  → genau diesen Lauf wiederholen.
    //   2. Heute fällig, aber noch nicht    → VORZIEHEN, also das Fenster nehmen, das der
    //                                         Lauf ohnehin gleich nehmen würde (Preset).
    //   3. Ein anderer Wochentag            → dessen letzten tatsächlichen Lauf.
    //
    // Fall 2 ist der Grund, warum hier nicht stumpf lastWindowFrom gilt: Wer mittwochs um
    // 12 den 14-Uhr-Eintrag antippt, will ihn vorziehen — nicht den Mittwoch der Vorwoche.
    // [EN] The arrow always means "do the work of this entry now". What this entails
    // [EN] depends on whether the scheduled time is already past today:
    // [EN]
    // [EN]   1. Due today and already ran    → repeat exactly this run.
    // [EN]   2. Due today, but not yet ran   → BRING FORWARD, take window that the run
    // [EN]                                     would take shortly anyway (Preset).
    // [EN]   3. Another day of the week      → its last actual run.
    // [EN]
    // [EN] Case 2 is why lastWindowFrom isn't blindly used: clicking a 14:00 entry at 12:00
    // [EN] on Wednesday means bringing it forward — not rerunning Wednesday of prior week.
    const heuteBerlin = berlinDayOf(new Date());
    const wochentagHeute = new Date(`${heuteBerlin}T12:00:00Z`).getUTCDay();
    const heuteFaellig = entry.day === wochentagHeute;
    const schonHeuteGelaufen = entry.lastRunAt && berlinDayOf(entry.lastRunAt) === heuteBerlin;
    const habeFenster = entry.lastWindowFrom && !isNaN(Date.parse(entry.lastWindowFrom));

    if (heuteFaellig && !schonHeuteGelaufen) {
      logger.log(`Wiederholung: ${tag} steht heute noch aus — Lauf wird vorgezogen (Fenster wie geplant).`);
    } else if (habeFenster) {
      lastUpdatedAfter = entry.lastWindowFrom;
      const alterTage = Math.round((Date.now() - Date.parse(entry.lastRunAt || entry.lastWindowFrom)) / 86400000);
      logger.log(`Wiederholung: Fenster des Laufs vom ${entry.lastRunAt || '?'} (${alterTage} Tage her) → Start ${lastUpdatedAfter}`);
      // Amazon löscht die Personalisierungsdaten nach ~4 Wochen (gemessen: 27 Tage gehen,
      // 30 nicht mehr) — ein sehr alter Lauf liefert dann Bestellungen ohne Gravurvorlage.
      // [EN] Amazon deletes customization data after ~4 weeks (measured: 27 days work,
      // [EN] 30 no longer do) — a very old run then returns orders without engraving template.
      if (alterTage > 25) logger.warn(`Wiederholung: der Lauf ist ${alterTage} Tage her — Amazon hat die Personalisierungsdaten vermutlich schon gelöscht.`);
    } else {
      logger.log('Wiederholung: dieser Eintrag ist noch nie gelaufen — Fenster kommt aus der Einstellung.');
    }
    createdBefore = new Date(Date.now() - AMAZON_MIN_BUFFER_MIN * 60000).toISOString();
    logger.log(`Wiederholung: Obergrenze auf jetzt gezogen → ${createdBefore}`);
  }

  meldeAktivitaet('download', `${repeat ? '↻ Wiederholung' : '⬇️ Automatischer Download'}: ${tag}`, { status: 'running' });

  // Gemeinsame Sequenz mit dem manuellen Download (runDownload) — Fehlerfall
  // ist dort komplett behandelt (progress + Activity-Log), hier nur abbrechen.
  // [EN] Shared sequence with manual download (runDownload) — error case
  // [EN] is completely handled there (progress + activity log), here only abort.
  const ok = await runDownload({
    minutes: 1440, status: entry.status, lastUpdatedAfter, createdBefore,
    startMessage: repeat ? `↻ Wiederhole ${tag}` : `Automatischer Start: ${tag}`,
    doneMessage: `✅ ${repeat ? 'Wiederholung' : 'Automatischer Lauf'} ${tag} abgeschlossen.`,
  }, progressRef, amazon);
  if (!ok) return false;
  // Mit „Download abbrechen" beendet: weder Auto-Export (er exportierte ein halbes Ergebnis)
  // noch Watermark/lastRun — sonst rückte der Watermark über Bestellungen, die der Lauf nie
  // geprüft hat, und der nächste Lauf suchte sie nicht mehr. So holt er das Fenster nach.
  // [EN] Ended with "Cancel download": neither auto-export (it would export half a result)
  // [EN] nor watermark/lastRun — otherwise watermark advances past orders the run never
  // [EN] checked, and next run wouldn't seek them. This way it catches up the window.
  if (amazon.isCancelRequested && amazon.isCancelRequested()) {
    logger.warn(`${repeat ? 'Wiederholung' : 'Zeitplan-Lauf'} ${tag} abgebrochen — kein Auto-Export, Watermark bleibt stehen.`);
    meldeAktivitaet('info', `⏹ ${tag} abgebrochen — kein Auto-Export; der nächste Lauf holt das Zeitfenster nach.`, { status: 'cancelled' });
    return false;
  }

  // Auto-Export via Puppeteer — persistent, überlebt Neustarts. Der Auftrag wird JETZT geschrieben,
  // obwohl der Nachschlag noch läuft: ein PM2-Neustart in der Wartezeit fiele sonst ersatzlos aus.
  // Start eine Minute NACH dem Nachschlag; läuft der noch, verschiebt sich der Export selbst
  // (Running-Check, 5× à 2 Min). Bei einer Wiederholung gibt es keinen Nachschlag, deshalb kurz.
  // [EN] Auto-export via Puppeteer — persistent, survives restarts. Job is written NOW,
  // [EN] even though catch-up pass is still running: a PM2 restart during wait time would otherwise drop it.
  // [EN] Starts 1 min AFTER catch-up; if still running, export defers itself
  // [EN] (running check, 5x at 2 min). On a repeat there is no catch-up, hence short delay.
  const delay = repeat ? 15 * 1000 : (NACHSCHLAG_DELAY_MIN * 60 + 60) * 1000;
  const wann = repeat ? '15 Sekunden' : `${NACHSCHLAG_DELAY_MIN + 1} Minuten`;
  // Kauftage des Fensters. Das Fenster selbst läuft über das ÄNDERUNGSdatum, gefüllt wird
  // aber nach Kaufdatum — für "ganzer Zeitraum" sind die abgedeckten Kalendertage gemeint.
  // [EN] Purchase dates of window. Window itself runs on MODIFICATION date, but filling
  // [EN] is by purchase date — "full period" refers to covered calendar days.
  const exportOpts = fillWindow
    ? { fillFrom: berlinDayOf(lastUpdatedAfter), fillTo: berlinDayOf(createdBefore) }
    : {};
  if (fillWindow) logger.log(`Wiederholung füllt die Layouts mit ALLEN Bestellungen vom ${exportOpts.fillFrom} bis ${exportOpts.fillTo}.`);
  logger.log(`Auto-Export startet in ${wann}…`);
  meldeAktivitaet('info', `⏳ Auto-Export startet in ${wann}…`, { status: 'pending' });
  schedulePuppeteerExport(delay, `${repeat ? 'Wiederholung' : 'Zeitplan'} ${tag}`, 0, exportOpts);

  // ── Nachschlag: das Reststück, für das der Hauptlauf strukturell blind war ──────
  // Amazons getOrders liefert nichts, dessen LastUpdateDate jünger als ~2 Minuten ist. Wer seine
  // Versandbestätigung gesammelt kurz vor dem Lauf abschickt, fiele systematisch in dieses Loch und
  // käme erst mit dem Overlap des NÄCHSTEN Laufs — bei einem Lauf pro Tag 24 Stunden zu spät.
  // Der Nachschlag holt dieses Reststück vor dem Export. Pflicht dabei:
  //   • keepSession — sonst löscht der zweite Abruf die Session des Hauptlaufs.
  //   • Watermark erst NACH dem Nachschlag setzen (schlägt er fehl, holt der nächste Lauf das Stück).
  //   • progress.running prüfen — ein manueller Download in der Wartezeit würde unseren Aufruf still
  //     verwerfen, und der Watermark rückte über ein nie abgefragtes Fenster.
  // [EN] ── Catch-up pass: remaining slice to which main run was structurally blind ──
  // [EN] Amazon's getOrders returns nothing whose LastUpdateDate is newer than ~2 minutes. Orders
  // [EN] confirmed shortly before the run fell systematically into this gap and
  // [EN] were only picked up by overlap of NEXT run — for daily runs, 24 hours too late.
  // [EN] The catch-up pass retrieves this piece before export. Mandatory:
  // [EN]   • keepSession — otherwise second fetch wipes session of main run.
  // [EN]   • set watermark only AFTER catch-up (if it fails, next run retrieves the piece).
  // [EN]   • check progress.running — a manual download during wait time would silently
  // [EN]     discard our call, advancing watermark over an unqueried window.
  if (!repeat) {
    const nachFrom = createdBefore;
    const ersteAnzahl = progressRef.total || 0;
    logger.log(`Nachschlag in ${NACHSCHLAG_DELAY_MIN} Min: Reststück ab ${nachFrom}…`);
    await new Promise(r => setTimeout(r, NACHSCHLAG_DELAY_MIN * 60000));

    if (amazon.isCancelRequested && amazon.isCancelRequested()) {
      logger.log('Nachschlag übersprungen: Lauf wurde abgebrochen.');
    } else if (progressRef.running) {
      logger.log('Nachschlag übersprungen: es läuft bereits ein anderer Abruf.');
    } else {
      const nachBefore = new Date(Date.now() - AMAZON_MIN_BUFFER_MIN * 60000).toISOString();
      logger.log(`Nachschlag: Fenster ${nachFrom} → ${nachBefore}`);
      const nachOk = await runDownload({
        minutes: 1440, status: entry.status,
        lastUpdatedAfter: nachFrom, createdBefore: nachBefore, keepSession: true,
        startMessage: `Nachschlag zu ${tag}`,
        doneMessage: `✅ Nachschlag zu ${tag} abgeschlossen.`,
        doneActivityText: 'Nachschlag',
      }, progressRef, amazon);
      if (nachOk) {
        createdBefore = nachBefore;                          // Watermark auf das spätere Ende
        // [EN] watermark to later end
        progressRef.total = ersteAnzahl + (progressRef.total || 0);
      } else {
        logger.warn('Nachschlag fehlgeschlagen — Watermark bleibt beim Fensterende des Hauptlaufs.');
      }
    }
  }

  if (!repeat) {
    // Erst NACH dem erfolgreichen Lauf: bis hierhin ist alles abgedeckt. Bei einem
    // Fehler bleibt der alte Stand stehen — der nächste Lauf holt beide Fenster.
    // [EN] Only AFTER successful run: up to here everything is covered. On
    // [EN] error old state remains — next run retrieves both windows.
    if (coversAllStatuses(entry.status)) saveWatermark(createdBefore);
    else logger.log(`Watermark NICHT gesetzt: Eintrag läuft nur mit Status "${entry.status}" — Fenster gilt als unvollständig.`);

    // ── lastRun direkt auf dem Server schreiben (nicht vom Browser abhängig) ──
    // [EN] ── Write lastRun directly on server (not dependent on browser) ──────
    const nowBerlin = berlinUhrzeit();
    const currentEntries = loadSchedule();
    const idx = currentEntries.findIndex(e => e.id === entry.id);
    if (idx !== -1) {
      currentEntries[idx].lastRun = DAYS[entry.day] + ' ' + nowBerlin;
      currentEntries[idx].lastCount = progressRef.total || 0;
      // Vollen Zeitstempel und Fenster mitschreiben: „Mo 12:00" allein sagt nicht, WELCHER
      // Montag gemeint war. Das ↻ braucht beides, um genau diesen Lauf zu wiederholen.
      // [EN] Record full timestamp and window: "Mon 12:00" alone does not indicate WHICH
      // [EN] Monday was meant. The ↻ requires both to repeat this exact run.
      currentEntries[idx].lastRunAt = new Date().toISOString();
      currentEntries[idx].lastWindowFrom = lastUpdatedAfter;
      currentEntries[idx].lastWindowTo = createdBefore;
      saveSchedule(currentEntries);
      logger.log(`lastRun gespeichert: ${currentEntries[idx].lastRun} (${currentEntries[idx].lastCount} Bestellungen)`);
    }
  }

  return true;
}

// Einstieg für POST /repeat-run: Eintrag aus schedule.json holen und nachlesen lassen.
// BEWUSST ohne await auf runEntry — die HTTP-Antwort geht sofort raus, der Lauf läuft
// im Hintergrund weiter (genau wie beim manuellen Download).
// [EN] Entry point for POST /repeat-run: fetch entry from schedule.json and rerun.
// [EN] INTENTIONALLY without await on runEntry — HTTP response is sent immediately, run
// [EN] continues in background (just like manual download).
function repeatEntry(id, progressRef, amazon, opts = {}) {
  const entry = loadSchedule().find(e => String(e.id) === String(id));
  if (!entry) return { error: 'Zeitplan-Eintrag nicht gefunden' };
  runEntry(entry, progressRef, amazon, { repeat: true, fillScope: opts.fillScope })
    .catch(e => logger.error('Wiederholung fehlgeschlagen:', e?.message || e));
  return { started: true, label: `${DAYS[entry.day]} ${entry.time}` };
}

// Zeitplan neu laden und Jobs starten
// [EN] Reload schedule and start jobs
function applySchedule(entries, progressRef, amazon) {
  _progressRef = progressRef; // für den Running-Check vor dem Auto-Export
  // [EN] for running check before auto-export
  stopAllTasks();

  const active = entries.filter(e => e.active);
  logger.log(`Zeitplan: ${active.length} aktive Einträge geladen.`);

  active.forEach(entry => {
    try {
      // buildCronExpression INNERHALB des try: ein korrupter Eintrag (z.B. fehlende time) darf das
      // forEach nicht abbrechen — sonst würde keiner der folgenden Einträge mehr registriert.
      // [EN] buildCronExpression INSIDE try: a corrupt entry (e.g. missing time) must
      // [EN] not break forEach — otherwise none of following entries would register.
      const expr = buildCronExpression(entry.day, entry.time);
      logger.log(`Cron registriert: ${expr} (${entry.status}, ${entry.fromPreset})`);

      const task = cron.schedule(expr, () => runEntry(entry, progressRef, amazon)
        .catch(e => logger.error(`Zeitplan ${entry.id} fehlgeschlagen:`, e?.message || e)),
        { timezone: 'Europe/Berlin' });

      activeTasks.set(entry.id, task);
    } catch(e) {
      logger.error(`Ungültiger Zeitplan-Eintrag ${entry.id} übersprungen:`, e.message);
    }
  });
}

// runEntry steht bewusst NICHT hier: es wird nur intern gerufen (applySchedule per Cron
// und repeatEntry fürs ↻). Ein Export ohne Aufrufer sieht wie eine öffentliche
// Schnittstelle aus, die niemand pflegt.
// [EN] runEntry is intentionally NOT exported here: called only internally (applySchedule via cron
// [EN] and repeatEntry for ↻). An export without callers looks like an unmaintained public API.
module.exports = {
  repeatEntry, schedulePuppeteerExport, loadSchedule, saveSchedule, applySchedule,
  recoverPendingExport, runDownload, startCleanupCron, exportLaeuft,
};
