const axios = require('axios');
// SP-API-Aufrufe mit Zeitlimit. Ohne eins wartete ein Aufruf auf eine stehende Verbindung
// beliebig lange — der Lauf hing, progress.running blieb gesetzt und sperrte jeden weiteren
// Download bis zum Neustart. Ein Zeitüberlauf endet wie jeder andere API-Fehler (Lauf
// meldet ❌, Watermark bleibt stehen). Die ZIP-Downloads haben eigene Limits (downloadFile).
// [EN] SP-API calls with a timeout. Without one, a call waited on a hanging connection
// [EN] indefinitely — the run hung, progress.running remained set, blocking any further
// [EN] download until restart. A timeout ends like any other API error (run
// [EN] reports ❌, watermark remains in place). ZIP downloads have their own limits (downloadFile).
const spApi = axios.create({ timeout: 60000 });
const config = require('./config');
const fs = require('fs');
const { mkdirSync, existsSync, readdirSync, readFileSync, copyFileSync, rmSync } = fs;
const { join, extname } = require('path');
const { execFileSync } = require('child_process'); // pdftoppm (PDF-Uploads, s. downloadAndSaveZip)
// [EN] pdftoppm (PDF uploads, see downloadAndSaveZip)
const { createLogger } = require('./utils/logger');
const { meldeAktivitaet } = require('./utils/activity');
const { writeJsonAtomic, readJsonSafe, entferneAeltere } = require('./utils/json-file');
const logger = createLogger('index.log', __filename);
const unzipper = require('unzipper');
const { findImageName, findSnapshotNames, findCustomerImageNames } = require('./read-orders.controller');
const { berlinDayOf } = require('./time-range');
const asinCheck = require('./asin-check.controller');
let is_running = false;
// Reentrancy-Lock für manageProcessQueue (hieß früher irreführend "is_paused" —
// es pausiert nichts, es verhindert nur parallele Queue-Durchläufe).
// [EN] Reentrancy lock for manageProcessQueue (was previously misleadingly named "is_paused" —
// [EN] it does not pause anything, it only prevents concurrent queue runs).
let is_queue_running = false;
let _cancelRequested = false;

// Externe Cancel-Anfrage (vom Server-Route)
// [EN] External cancel request (from server route)
const requestCancel = () => {
  _cancelRequested = true;
  logger.log('Cancel-Flag gesetzt.');
};

// Lesbar für den Zeitplan: nach einem Abbruch darf der Nachschlag (s. scheduler.js)
// nicht doch noch einen zweiten Abruf starten. Das Flag wird beim nächsten regulären
// manageFetchOrders zurückgesetzt.
// [EN] Readable for the scheduler: after an abort, the catch-up pass (see scheduler.js)
// [EN] must not start a second fetch. The flag is reset on the next regular
// [EN] manageFetchOrders run.
const isCancelRequested = () => _cancelRequested;

/***************************UTILS**************************************/

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Fenster-Start (LastUpdatedAfter) für den Order-Abruf als ISO-String.
// Ein fester Start (lastUpdatedAfter) hat Vorrang; sonst "jetzt minus `minuten`".
// [EN] Window start (LastUpdatedAfter) for order fetch as ISO string.
// [EN] A fixed start (lastUpdatedAfter) takes precedence; otherwise "now minus `minutes`".
const resolveWindowStart = ({ lastUpdatedAfter, minuten }) => {
  if (lastUpdatedAfter) {
    logger.log('Using exact date:', lastUpdatedAfter);
    return lastUpdatedAfter;
  }
  const windowStart = new Date(Date.now() - minuten * 60000).toISOString();
  logger.log('Fenster-Start (letzte', minuten, 'Min):', windowStart);
  return windowStart;
};

// Eine Liste in Batches parallel abarbeiten (Bestell-Abruf und Queue-Verarbeitung). Drei Dinge, die
// man einzeln leicht falsch macht: der Abbruch-Check gehört VOR den Batch (sonst laufen angefangene
// Downloads ins Leere), die Nacharbeit nach JEDEM Batch (sonst gehen Ledger- und Session-Einträge des
// letzten Batches verloren), die Drosselpause ZWISCHEN die Batches.
//   worker(item, index, ctx) — ctx ist pro Batch frisch und wird an afterBatch gereicht
//   pauseAfterLast — auch nach dem letzten Batch warten (Queue-Verhalten)
// Rückgabe: true = komplett durchgelaufen, false = durch Cancel abgebrochen.
// [EN] Process a list in batches in parallel (order retrieval and queue processing). Three things that
// [EN] are easy to do wrong: the cancel check belongs BEFORE the batch (otherwise initiated downloads
// [EN] run into void), post-processing after EACH batch (otherwise ledger and session entries of the
// [EN] last batch are lost), throttle pause BETWEEN batches.
// [EN]   worker(item, index, ctx) — ctx is fresh per batch and passed to afterBatch
// [EN]   pauseAfterLast — also wait after the last batch (queue behavior)
// [EN] Return: true = fully completed, false = aborted via cancel.
const runInBatches = async (items, size, worker, opts = {}) => {
  // Schrittweite absichern: size <= 0 wäre eine Endlosschleife, die nicht einmal Timer
  // durchlässt (Promise.all([]) löst im Microtask auf, der Zähler bewegt sich nie).
  // [EN] Safeguard step size: size <= 0 would be an infinite loop that doesn't even let timers
  // [EN] through (Promise.all([]) resolves in microtask, the counter never advances).
  const step = Math.max(1, Math.floor(size) || 1);
  for (let i = 0; i < items.length; i += step) {
    if (_cancelRequested) {
      logger.log(`${opts.label || 'Verarbeitung'} durch Cancel-Anfrage abgebrochen.`);
      meldeAktivitaet('info', `⏹ ${opts.cancelMessage || 'Abgebrochen'}`, { status: 'cancelled' });
      return false;
    }
    const batch = items.slice(i, i + step);
    const ctx = {};
    await Promise.all(batch.map((item, bi) => worker(item, i + bi, ctx)));
    if (opts.afterBatch) await opts.afterBatch(ctx);
    if (opts.pauseMs && (opts.pauseAfterLast || i + step < items.length)) await sleep(opts.pauseMs);
  }
  return true;
};

/**
 * Check if the response indicates an unauthorized error
 * @param {Object} response
 * @returns {boolean}
 */
const checkIfUnauthorized = (response) =>
  response?.status === 403 &&
  response?.data?.errors?.[0]?.code === 'Unauthorized';

/***************************AMZ**************************************/
/**
 * Fetch a new access token using refresh_token flow
 * @returns {Promise<string | null>}
 */
// Das Token wird NICHT global gemerkt: jeder Lauf holt sich eins und reicht es weiter. Läuft es
// mitten in der Pagination ab, liefert fetchOrders das erneuerte mit zurück.
// [EN] The token is NOT stored globally: each run fetches one and passes it forward. If it expires
// [EN] in the middle of pagination, fetchOrders returns the renewed one.
const accessToken = async () => {
  if (!config.amz.clientId || !config.amz.clientSecret || !config.amz.refreshToken) {
    logger.warn('Amazon SP-API credentials not configured in environment variables');
    return null;
  }
  try {
    const response = await spApi.post(
      config.amz.amz_auth_url,
      {
        grant_type: 'refresh_token',
        refresh_token: config.amz.refreshToken,
        client_id: config.amz.clientId,
        client_secret: config.amz.clientSecret,
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return response.data?.access_token ?? null;
  } catch (err) {
    logger.error(
      'Error fetching Amazon token:',
      err?.response?.data || err.message
    );
    return null;
  }
};

// Get ONE bulk RDT token valid for ALL orders (generic path)
const getBulkRDTToken = async (accessToken) => {
  try {
    const response = await spApi.post(
      `${config.amz.amz_sp_api_base_url}/tokens/2021-03-01/restrictedDataToken`,
      {
        restrictedResources: [{
          method: 'GET',
          path: '/orders/v0/orders/{orderId}/orderItems',
          dataElements: ['buyerInfo'],
        }],
      },
      { headers: { 'x-amz-access-token': accessToken } }
    );
    const token = response?.data?.restrictedDataToken || null;
    logger.log('Bulk RDT token obtained:', !!token);
    return token;
  } catch (err) {
    logger.error('Failed to get bulk RDT token:', err?.response?.data || err.message);
    return null;
  }
};

/**
 * Fetch orders from Amazon SP-API
 * @param {string} token - access token
 * @param {{ minuten: number, status: string, lastUpdatedAfter: ?string, createdBefore: ?string }} fenster
 * @returns {Promise<{ orders: any[], token: string } | null>} null = API-/Netzwerkfehler
 */
const fetchOrders = async (token, fenster) => {
  try {
    let allOrders = [];
    let nextToken = null;
    // EINMAL vor der Schleife. Stand der Aufruf im Schleifenkörper, wanderte das
    // Fenster bei Aufrufen ohne festen Start von Seite zu Seite mit ("jetzt minus
    // Minuten" wird bei jedem Durchlauf neu berechnet) — und die Log-Zeile dazu
    // erschien einmal pro Seite.
    // [EN] ONCE before the loop. If the call was inside the loop body, the window would
    // [EN] shift from page to page on calls without a fixed start ("now minus minutes"
    // [EN] gets recalculated on each iteration) — and the log line appeared once per page.
    const windowStart = resolveWindowStart(fenster);

    do {
      const params = {
        MarketplaceIds: config.amz.marketplaceId,
        // Fenster über LastUpdatedAfter statt CreatedAfter (Kaufdatum): fängt auch
        // Bestellungen, die erst NACH ihrem Kauf-Zeitfenster von Pending auf
        // Unshipped/Shipped springen — genau die fielen vorher durchs Raster.
        // Neue Orders gehen nicht verloren (LastUpdateDate ≈ Kaufdatum bei Neuanlage).
        // [EN] Window via LastUpdatedAfter instead of CreatedAfter (purchase date): also catches
        // [EN] orders that switch from Pending to Unshipped/Shipped AFTER their purchase window —
        // [EN] exactly those that slipped through the cracks before.
        // [EN] New orders are not lost (LastUpdateDate ≈ purchase date on new creation).
        LastUpdatedAfter: windowStart,
        OrderStatuses: fenster.status,
      };
      // Obergrenze NICHT an Amazon senden — sie wird unten clientseitig gegen
      // LastUpdateDate gezogen (hält die Latenz-Reserve am Fenster-Ende intakt).
      // [EN] Do NOT send upper limit to Amazon — it is clipped client-side below against
      // [EN] LastUpdateDate (keeps the latency reserve at the window end intact).
      if (nextToken) params.NextToken = nextToken;

      const ordersUrl = `${config.amz.amz_sp_api_base_url}/orders/v0/orders`;
      let response;
      try {
        response = await spApi.get(ordersUrl, { params, headers: { 'x-amz-access-token': token } });
      } catch (e) {
        // Token während der Pagination abgelaufen (403) → EINMAL erneuern und wiederholen
        // [EN] Token expired during pagination (403) → refresh ONCE and retry
        if (checkIfUnauthorized(e?.response)) {
          logger.log('Access-Token abgelaufen (403) — erneuere Token und versuche erneut…');
          token = await accessToken();
          // Werfen statt `break`: ein break lieferte die bis hierhin geholten Seiten als
          // VOLLSTÄNDIGES Ergebnis — der Watermark rückte über die fehlenden Seiten hinweg.
          // [EN] Throw instead of `break`: a break would return pages fetched so far as a
          // [EN] COMPLETE result — the watermark would advance past missing pages.
          if (!token) throw new Error('Token-Erneuerung mitten im Abruf fehlgeschlagen');
          response = await spApi.get(ordersUrl, { params, headers: { 'x-amz-access-token': token } });
        } else {
          throw e; // anderer Fehler → vom äußeren catch behandelt
          // [EN] other error → handled by outer catch
        }
      }

      const orders = response?.data?.payload?.Orders || [];
      allOrders = allOrders.concat(orders);
      nextToken = response?.data?.payload?.NextToken || null;
      logger.log(`Fetched ${orders.length} orders, total: ${allOrders.length}, hasMore: ${!!nextToken}`);

      if (nextToken) await sleep(1000);
    } while (nextToken);

    logger.log('Total orders fetched:', allOrders.length);

    // Latenz-Diagnose: getOrders ist eventually consistent — großer Abstand der jüngsten
    // Bestellung zu "jetzt" erklärt scheinbar "verpasste" Bestellungen im Auto-Lauf.
    // [EN] Latency diagnosis: getOrders is eventually consistent — large lag of the newest
    // [EN] order to "now" explains apparently "missed" orders in the auto run.
    if (allOrders.length) {
      const newestMs = allOrders.reduce((mx, o) => {
        const d = new Date(o.PurchaseDate || o.LastUpdateDate || 0).getTime();
        return d > mx ? d : mx;
      }, 0);
      if (newestMs > 0) {
        const lagMin = Math.round((Date.now() - newestMs) / 60000);
        logger.log(`Latenz-Diagnose: jüngste Bestellung ${new Date(newestMs).toISOString()} = ${lagMin} Min vor jetzt (Amazon-Indexierungs-Lag).`);
      }
    } else {
      logger.log('Amazon-Abruf: KEINE Bestellungen im angefragten Zeitraum gefunden.');
      meldeAktivitaet('info', 'ℹ️ Keine Bestellungen im Zeitraum gefunden', { count: 0, status: 'empty' });
    }

    // Sicherheitsnetz: bei Pagination liefert Amazon Orders teils knapp außerhalb des
    // Fensters mit → clientseitig hart gegen LastUpdateDate beschneiden (Start UND Ende,
    // eine gemeinsame Filter-Formel — vorher zwei strukturgleiche Blöcke).
    // [EN] Safety net: with pagination, Amazon sometimes includes orders slightly outside the
    // [EN] window → strictly trim client-side against LastUpdateDate (start AND end,
    // [EN] a shared filter formula — previously two structurally identical blocks).
    const clipByUpdateDate = (list, limitIso, keep, label) => {
      const limit = new Date(limitIso);
      const out = list.filter(o => keep(new Date(o.LastUpdateDate || o.PurchaseDate || ''), limit));
      logger.log(`${label} ${limitIso}: ${list.length} -> ${out.length} orders`);
      return out;
    };
    // Untergrenze: >= Fenster-Start
    // [EN] Lower limit: >= window start
    if (fenster.lastUpdatedAfter) allOrders = clipByUpdateDate(allOrders, fenster.lastUpdatedAfter, (d, l) => d >= l, 'LastUpdated filter');
    // Obergrenze: < Fenster-Ende (sauberer Produktionsschnitt, konsistent zum Start)
    // [EN] Upper limit: < window end (clean production cut, consistent with start)
    if (fenster.createdBefore) allOrders = clipByUpdateDate(allOrders, fenster.createdBefore, (d, l) => d < l, 'UpdatedBefore filter');

    // Das Token mit zurück: nach einem 403 mitten in der Pagination ist es ein erneuertes.
    // [EN] Return the token: after a 403 in the middle of pagination, it is a renewed one.
    return { orders: allOrders, token };
  } catch (err) {
    // null statt [] — der Aufrufer muss einen API-/Netzwerkfehler von "wirklich keine
    // Bestellungen" unterscheiden können. Vorher sah ein Amazon-Ausfall wie ein leerer
    // Lauf aus und die UI meldete "Fertig! 0 Bestellungen" statt eines Fehlers.
    // [EN] null instead of [] — caller must distinguish an API/network error from "truly no
    // [EN] orders". Previously an Amazon outage looked like an empty run and the UI reported
    // [EN] "Done! 0 orders" instead of an error.
    logger.error('fetch order error', err?.response?.data || err);
    return null;
  }
};

// Gesamt-Timeout pro ZIP-Download. Ohne diesen Deckel (und den error-Handler auf dem
// Response-Stream unten) konnte ein mitten im Transfer abgebrochener Stream das Promise
// für immer unresolved lassen — Promise.all im Queue-Batch hing dann bis zum PM2-Restart.
// [EN] Overall timeout per ZIP download. Without this cap (and the error handler on the
// [EN] response stream below), a stream aborted mid-transfer could leave the Promise
// [EN] unresolved forever — Promise.all in the queue batch then hung until PM2 restart.
const DOWNLOAD_TIMEOUT_MS = 120000;

const downloadFile = async (url, dest) => {
  await new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(dest);
    let settled = false;

    const finish = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve();
    };
    const cleanup = (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      writer.destroy();
      try { fs.unlinkSync(dest); } catch (_) {}
      reject(err);
    };

    const timer = setTimeout(
      () => cleanup(new Error(`Download timeout after ${DOWNLOAD_TIMEOUT_MS / 1000}s: ${url}`)),
      DOWNLOAD_TIMEOUT_MS
    );

    axios
      // axios-timeout deckt nur die Zeit bis zu den Response-Headern ab —
      // der setTimeout oben deckt den kompletten Transfer.
      // [EN] axios-timeout only covers time up to response headers —
      // [EN] the setTimeout above covers the complete transfer.
      .get(url, { responseType: 'stream', timeout: 30000 })
      .then((res) => {
        // Fehler MITTEN im Stream (Verbindungsabbruch) landen hier, nicht im .catch —
        // ohne diesen Handler bekommt der writer weder 'finish' noch 'error'.
        // [EN] Errors IN THE MIDDLE of stream (connection drop) land here, not in .catch —
        // [EN] without this handler the writer receives neither 'finish' nor 'error'.
        res.data.on('error', cleanup);
        res.data.pipe(writer);
      })
      .catch(cleanup);

    writer.on('finish', finish);
    writer.on('error', cleanup);
  });
};

/**
 * Downloads a ZIP file from the given URL, extracts it, moves json + images to assets dir
 */
const downloadAndSaveZip = async (zipUrl, orderId, PurchaseDate, itemIndex = 0, asin = null) => {
  // item-N eigener temp-Ordner verhindert Race Condition bei parallelen Downloads.
  // Außerhalb des try, damit das finally unten IMMER aufräumen kann — vorher blieben
  // bei leerem ZIP (früher return) und bei Exceptions Reste in tmp/ liegen.
  // [EN] item-N separate temp folder prevents race conditions during parallel downloads.
  // [EN] Outside the try block so that finally below can ALWAYS clean up — previously
  // [EN] on empty ZIP (early return) and exceptions leftovers remained in tmp/.
  const tempBase = join(__dirname, 'tmp', `${orderId}-item${itemIndex + 1}`);
  try {
    // BERLINER Kalendertag, nicht der UTC-Tag: eine Bestellung von 00:30 Berlin (= 22:30 UTC am
    // Vortag) landete sonst im Ordner des Vortages, während jeder Filter drumherum in Berliner Tagen
    // rechnet — sie wäre unter „Nur heute" nicht zu finden. Die Dedup läuft über die orderId.
    // [EN] BERLIN calendar day, not UTC day: an order from 00:30 Berlin (= 22:30 UTC on
    // [EN] previous day) otherwise landed in previous day folder, while every filter around it
    // [EN] calculates in Berlin days — it wouldn't be found under "Only today". Deduplication runs via orderId.
    const dateFolder = berlinDayOf(PurchaseDate);
    const tempDir = join(tempBase, 'temp');
    const zipPath = join(tempBase, 'temp.zip');

    mkdirSync(tempDir, { recursive: true });

    await downloadFile(zipUrl, zipPath);

    let stats = fs.statSync(zipPath);
    if (stats.size === 0) {
      logger.warn(`Downloaded ZIP for order ${orderId} is empty. Retrying...`);
      await downloadFile(zipUrl, zipPath);
      stats = fs.statSync(zipPath);
      if (stats.size === 0) {
        // WERFEN, nicht return: ein `return` sähe für processOrderWithURLs wie Erfolg aus — die Queue-Datei
        // würde gelöscht UND die orderId ins Ledger geschrieben, obwohl nie ein Ordner entstand (kein Retry,
        // keine Spur). Mit throw greift die normale Versuchszählung (MAX_QUEUE_ATTEMPTS → Dead-Letter).
        // [EN] THROW, do not return: a `return` would look like success to processOrderWithURLs — the queue file
        // [EN] would be deleted AND orderId written to ledger, although no folder was created (no retry,
        // [EN] no trace). With throw, normal attempt counting applies (MAX_QUEUE_ATTEMPTS → Dead-Letter).
        throw new Error(`ZIP für ${orderId} ist auch nach Retry leer (0 Bytes)`);
      }
    }

    logger.log(
      `Downloaded ZIP for order ${orderId}, size: ${stats.size} bytes`
    );

    // Extract ZIP
    let extractErr = null;
    await new Promise((resolve, reject) => {
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: tempDir }))
        .on('close', resolve)
        .on('error', reject);
    }).catch((err) => {
      logger.error(`Error extracting ZIP for order ${orderId}:`, err);
      extractErr = err;
    });

    // WERFEN statt stillem return — gleiche Begründung wie beim leeren ZIP oben:
    // ein return meldet dem Aufrufer Erfolg und die Bestellung verschwindet
    // unwiederbringlich aus Queue und Ledger. finally räumt tempBase trotzdem auf.
    // [EN] THROW instead of silent return — same reasoning as empty ZIP above:
    // [EN] a return reports success to caller and order disappears
    // [EN] irretrievably from queue and ledger. finally cleans up tempBase anyway.
    if (extractErr) throw new Error(`ZIP für ${orderId} nicht entpackbar: ${extractErr.message}`);

    logger.log(`Extracted ZIP to: ${tempDir}`);

    const files = readdirSync(tempDir);
    const jsonFileName = files.find((f) => f.endsWith('.json'));
    if (!jsonFileName) throw new Error('No JSON file found in extracted ZIP.');

    const jsonFilePath = join(tempDir, jsonFileName);
    const jsonData = JSON.parse(readFileSync(jsonFilePath, 'utf8'));

    // Struktur ins ASIN-Profil (ASIN-Check im Editor). Wirft nie; gespeichert wird an den
    // Batch-Grenzen (asinCheck.flush in manageProcessQueue).
    // [EN] Structure into ASIN profile (ASIN check in editor). Never throws; saved at
    // [EN] batch boundaries (asinCheck.flush in manageProcessQueue).
    asinCheck.mergeBestellung({
      asin: asin || jsonData.asin, titel: jsonData.title, orderId,
      orderItemId: jsonData.orderItemId, datum: PurchaseDate, customizationData: jsonData.customizationData,
    });

    // Bildname — robuste rekursive Suche (gemeinsame Util mit read-orders, keine feste
    // Verschachtelung). findImageName liefert höchstens EIN Bild. Kein Kundenbild ist der
    // Normalfall (reine Textbestellung) — kein Log-Eintrag dafür.
    // [EN] Image name — robust recursive search (shared util with read-orders, no fixed
    // [EN] nesting). findImageName returns at most ONE image. No customer image is the
    // [EN] normal case (text-only order) — no log entry for that.
    const imageName = findImageName(jsonData?.customizationData);

    // ── PDF-Upload → PNG rastern ────────────────────────────────────────────────
    // Der Browser kann eine PDF nicht als <img> laden: loadImg im Editor akzeptiert nur .jpg/.jpeg/.png
    // und steigt sonst STILL aus (Gravurfeld leer, kein Fehler). Also hier einmalig beim Download rendern;
    // read-orders nimmt dann die .png gleichen Namens, das Original bleibt daneben liegen.
    // -scale-to 2000 deckelt die lange Kante: reicht bei 500 DPI für ~100 mm Gravurkante und hält den
    // speicherempfindlichen Auto-Export im Rahmen. pdftoppm (poppler-utils) ist installiert.
    // [EN] ── PDF upload → rasterize to PNG ──────────────────────────────────────
    // [EN] Browser cannot load a PDF as <img>: loadImg in editor only accepts .jpg/.jpeg/.png
    // [EN] and otherwise silently bails out (engraving field empty, no error). So render here once on download;
    // [EN] read-orders then takes .png of the same name, original remains next to it.
    // [EN] -scale-to 2000 caps long edge: sufficient at 500 DPI for ~100 mm engraving edge and keeps
    // [EN] memory-sensitive auto-export within limits. pdftoppm (poppler-utils) is installed.
    const pdfsInZip = files.filter(f => /\.pdf$/i.test(f));
    // Die erzeugten PNG-Namen mitführen. Sie MÜSSEN ihren Namen behalten: read-orders sucht zu
    // `<X>.pdf` aus der JSON exakt `<X>.png`. Ohne diese Liste hielt die Nummerierung unten sie für eine
    // Amazon-Vorschau und legte sie als bild-N.png ab — Namensbezug und PDF-Auffangnetz liefen ins Leere,
    // das Gravurfeld blieb leer.
    // [EN] Track generated PNG names. They MUST keep their names: read-orders looks for
    // [EN] exact `<X>.png` for `<X>.pdf` from the JSON. Without this list, numbering below considered them
    // [EN] an Amazon preview and saved them as bild-N.png — name reference and PDF fallback went nowhere,
    // [EN] engraving field remained empty.
    const rasterPngs = new Set();
    for (const pf of pdfsInZip) {
      const target = pf.replace(/\.pdf$/i, '.png');
      try {
        execFileSync('pdftoppm', ['-png', '-scale-to', '2000', '-singlefile',
          join(tempDir, pf), join(tempDir, target.replace(/\.png$/i, ''))],
          { timeout: 60000, stdio: 'pipe' });
        if (existsSync(join(tempDir, target))) {
          if (!files.includes(target)) files.push(target); // von der Kopier-Schleife unten mitgenommen
          // [EN] included by copy loop below
          rasterPngs.add(target);
          logger.log(`Order ${orderId}: PDF ${pf} nach ${target} gerastert.`);
        } else {
          throw new Error('pdftoppm lieferte keine Ausgabedatei');
        }
      } catch (e) {
        // Nie fatal für den Download: die Gravur-Daten (JSON) liegen bereits, und eine verlorene
        // Bestellung wäre schlimmer als ein leeres Feld. ABER laut melden — ohne Rasterung bleibt das
        // Gravurfeld im Editor leer, und das darf nicht unbemerkt in den Auto-Export laufen.
        // [EN] Never fatal for download: engraving data (JSON) already exists, and a lost
        // [EN] order would be worse than an empty field. BUT report loudly — without rasterization the
        // [EN] engraving field in editor remains empty, which must not pass unnoticed into auto-export.
        logger.error(`Order ${orderId}: PDF ${pf} konnte nicht gerastert werden:`, e.message);
        meldeAktivitaet('error', `❌ PDF von ${orderId} nicht in Bild wandelbar (${pf}) — Gravurfeld bleibt leer, bitte von Hand prüfen`, { status: 'error' });
      }
    }

    const itemFolder = `item-${itemIndex + 1}`;
    const destinationPath = join(__dirname, 'public', dateFolder, orderId, itemFolder);
    // Bei einem erneuten Download (force / Reklamation / Ledger-Reset) MUSS der Ordner vorher leer
    // sein: Amazon liefert die Artikel einer Mehr-Artikel-Bestellung nicht in stabiler Reihenfolge —
    // sonst lägen in BEIDEN item-Ordnern beide JSONs, _findOrderJson nimmt die erste, und auf beiden
    // Feuerzeugen stünde derselbe Text.
    // [EN] On a re-download (force / complaint / ledger reset) folder MUST be empty beforehand:
    // [EN] Amazon does not supply items of a multi-item order in stable sequence —
    // [EN] otherwise both JSONs would lie in BOTH item folders, _findOrderJson takes the first, and both
    // [EN] lighters would have the same text.
    if (existsSync(destinationPath)) fs.rmSync(destinationPath, { recursive: true, force: true });
    mkdirSync(destinationPath, { recursive: true });

    // Die Original-ZIP wird NICHT mitgespeichert (sie war eine Kopie dessen, was hier ausgepackt wird,
    // und belegte die Hälfte des Platzes unter public/). Stattdessen kommt der KOMPLETTE ZIP-Inhalt auf
    // die Platte — nur die .xml fällt weg (dieselben Daten wie die .json). So bleiben Amazons
    // Oberflächen-Vorschauen und SVG-Konturen erhalten, und neue Bildarten kommen automatisch mit.
    // [EN] Original ZIP is NOT saved (it was a copy of what is unpacked here,
    // [EN] and occupied half the space under public/). Instead the COMPLETE ZIP content goes to
    // [EN] disk — only .xml is dropped (same data as .json). This preserves Amazon's
    // [EN] surface previews and SVG contours, and new image types are included automatically.

    // Copy image file (falls die Bestellung eins hat)
    // [EN] Copy image file (if order has one)
    if (imageName) {
      const localImagePath = join(tempDir, imageName);
      if (existsSync(localImagePath)) {
        copyFileSync(localImagePath, join(destinationPath, imageName));
        logger.log(`Copied image: ${imageName}`);
      } else {
        logger.warn(`Image not found: ${imageName}`);
      }
    }

    // Copy JSON
    if (existsSync(jsonFilePath)) {
      copyFileSync(jsonFilePath, join(destinationPath, jsonFileName));
      logger.log(`Copied JSON: ${jsonFileName}`);
    }

    // Alles Übrige (Amazons Oberflächen-Snapshots als JPG — bei S01 auch die RÜCKSEITE mit der Gravur —,
    // SVG-Konturen, künftige Bildarten) flach neben JSON und Kundenbild, Bilder als bild-1, bild-2, ….
    // read-orders sucht das Kundenbild NAMENTLICH über imageName, deshalb darf hier alles außer den
    // Kundenfotos umbenannt werden. Nie fatal: JSON und Kundenbild liegen zu diesem Zeitpunkt schon.
    // [EN] Everything else (Amazon surface snapshots as JPG — for S01 also BACK with engraving —,
    // [EN] SVG contours, future image types) flat next to JSON and customer image, images as bild-1, bild-2, ….
    // [EN] read-orders searches customer image BY NAME via imageName, therefore everything except
    // [EN] customer photos may be renamed here. Never fatal: JSON and customer image exist by this point.
    try {
      const custom = jsonData?.customizationData;
      const snapshots = findSnapshotNames(custom);
      const customerImages = findCustomerImageNames(custom);
      const isImage = (f) => /\.(jpe?g|png|webp)$/i.test(f);
      // Nummern-Reihenfolge: erst die in der JSON gelisteten Flächen (stabil — bei S01
      // bild-1 = Vorderseite, bild-2 = Rückseite mit der Gravur), dann Bilder, die die
      // JSON nicht kennt. Schickt Amazon irgendwann mehr Flächen mit, wachsen die Nummern
      // einfach weiter (bild-3, bild-4, …), ohne dass hier etwas angepasst werden muss.
      // rasterPngs bleiben ausgenommen: sie sind die gerasterte Fassung eines
      // Kunden-Uploads und hängen über ihren Namen an der .pdf aus der JSON (s. dort).
      // [EN] Numbering order: first surfaces listed in JSON (stable — for S01
      // [EN] bild-1 = front, bild-2 = back with engraving), then images unknown to
      // [EN] JSON. If Amazon sends more surfaces, numbers just keep growing
      // [EN] (bild-3, bild-4, …) without needing adjustments here.
      // [EN] rasterPngs remain exempt: they are rasterized versions of
      // [EN] customer uploads and link via name to .pdf from JSON (see above).
      const numbered = new Map();
      let n = 0;
      for (const f of [
        ...snapshots.filter((f) => files.includes(f)),
        ...files.filter((f) => isImage(f) && !snapshots.includes(f)
                            && !customerImages.includes(f) && !rasterPngs.has(f)),
      ]) {
        numbered.set(f, `bild-${++n}${extname(f).toLowerCase()}`);
      }

      let extras = 0;
      for (const f of files) {
        if (f === jsonFileName || (imageName && f === imageName)) continue; // schon kopiert
        // [EN] already copied
        if (/\.xml$/i.test(f)) continue;                                    // Dublette der JSON
        // [EN] duplicate of JSON
        const src = join(tempDir, f);
        if (!fs.statSync(src).isFile()) continue;
        copyFileSync(src, join(destinationPath, numbered.get(f) || f));
        extras++;
      }
      if (extras) logger.log(`Copied ${extras} weitere ZIP-Datei(en) nach ${itemFolder}/ (davon ${n} als bild-1…bild-${n})`);
    } catch (e) {
      logger.warn(`Zusatz-Dateien für ${orderId} nicht gesichert (nicht kritisch):`, e.message);
    }

    // Save meta.json — ASIN kommt aus processOrderWithURLs (items[].asin)
    // jsonData.asin existiert nicht in Amazon JSON, daher über Parameter übergeben
    // [EN] Save meta.json — ASIN comes from processOrderWithURLs (items[].asin)
    // [EN] jsonData.asin does not exist in Amazon JSON, hence passed via parameter
    writeJsonAtomic(
      join(destinationPath, 'meta.json'),
      { orderId, purchaseDate: PurchaseDate, downloadedAt: new Date().toISOString(), dateFolder, asin },
      2
    );
    logger.log(`Saved meta.json for order ${orderId}`);
    addToSession(orderId, PurchaseDate, asin);
  } catch (err) {
    logger.error(`Failed for order ${orderId}:`, err);
    throw err; // Rethrow to allow retries in caller
  } finally {
    // Temp-Ordner auf JEDEM Pfad entfernen (Erfolg, leeres ZIP, Extraktions-/IO-Fehler)
    // [EN] Remove temp folder on EVERY path (success, empty ZIP, extraction/IO error)
    if (existsSync(tempBase)) rmSync(tempBase, { recursive: true, force: true });
  }
};

// Uses a pre-obtained RDT token directly.
// Rückgabe: URLs-Array (leer = Bestellung hat wirklich keine Personalisierung)
//           null  = API-Fehler (Quota trotz Retries o.ä.) — Aufrufer darf die
//                   Bestellung dann NICHT als "ohne Personalisierung" abhaken.
// [EN] Return: URLs array (empty = order genuinely has no personalization)
// [EN]         null  = API error (quota despite retries, etc.) — caller must
// [EN]                 NOT mark the order off as "without personalization".
const fetchOrderItemsAndGetURLs = async (orderId, rdtToken, retries = 3) => {
  try {
    const response = await spApi.get(
      `${config.amz.amz_sp_api_base_url}/orders/v0/orders/${orderId}/orderItems`,
      { headers: { 'x-amz-access-token': rdtToken } }
    );
    const items = response.data?.payload?.OrderItems ?? [];
    const urls = [];
    for (const item of items) {
      // QuantityOrdered === 0 = komplett storniert → überspringen
      // Stornierungsanfragen haben QuantityOrdered > 0 → behalten
      // [EN] QuantityOrdered === 0 = fully cancelled → skip
      // [EN] Cancellation requests have QuantityOrdered > 0 → keep
      if ((item.QuantityOrdered ?? 1) === 0) {
        logger.log(`Skipping cancelled item (QuantityOrdered=0) for ASIN: ${item.ASIN}`);
        continue;
      }
      const url = item.BuyerInfo?.BuyerCustomizedInfo?.CustomizedURL ||
                  item.BuyerCustomizedInfo?.CustomizedURL;
      if (url) {
        logger.log(`Found customization for ASIN: ${item.ASIN}`);
        urls.push({ url, asin: item.ASIN });
      }
    }
    return urls;
  } catch (err) {
    const isQuota = err?.response?.data?.errors?.[0]?.code === 'QuotaExceeded';
    if (isQuota && retries > 0) {
      // Exponential Backoff mit Jitter — Amazon Best Practice (SP-API Well-Architected Guidance)
      // Versuch 3: ~6s, Versuch 2: ~12s, Versuch 1: ~24s + zufälliger Jitter ±20%
      // [EN] Exponential backoff with jitter — Amazon Best Practice (SP-API Well-Architected Guidance)
      // [EN] Attempt 3: ~6s, Attempt 2: ~12s, Attempt 1: ~24s + random jitter ±20%
      const attempt = 4 - retries; // 1, 2, 3
      const baseWait = Math.min(6000 * Math.pow(2, attempt - 1), 30000);
      const jitter = Math.floor(Math.random() * baseWait * 0.4) - Math.floor(baseWait * 0.2);
      const waitMs = baseWait + jitter;
      logger.log(`QuotaExceeded for ${orderId}, waiting ${Math.round(waitMs/1000)}s (attempt ${attempt}, ${retries} retries left)...`);
      await sleep(waitMs);
      return fetchOrderItemsAndGetURLs(orderId, rdtToken, retries - 1);
    }
    logger.error(`fetchOrderItemsAndGetURLs Error for order ${orderId}:`, err?.response?.data || err.message);
    // null statt [] — vorher galt die Bestellung nach erschöpften Retries als "ohne
    // Personalisierung" und war bei manuellen Läufen (kein Overlap) dauerhaft verloren.
    // [EN] null instead of [] — previously the order was treated after exhausted retries as
    // [EN] "without personalization" and was permanently lost on manual runs (no overlap).
    return null;
  }
};

const queueDir = join(__dirname, 'queue');
if (!existsSync(queueDir)) {
  mkdirSync(queueDir, { recursive: true });
}
// Dead-Letter-Ordner für Bestellungen, die wiederholt nicht verarbeitet werden konnten
// (Unterordner → wird vom .json-Filter der Queue-Scans nicht miterfasst).
// [EN] Dead-letter folder for orders that repeatedly failed to process
// [EN] (subfolder → not picked up by .json filter of queue scans).
const failedQueueDir = join(queueDir, 'failed');
const MAX_QUEUE_ATTEMPTS = 5;

// Ab wann Amazon die Personalisierungsdaten einer Bestellung gelöscht hat. Gemessen:
// 27 Tage gehen noch, 30 nicht mehr (s. auch die ↻-Warnung in scheduler.js). Danach
// liefert Amazon zwar weiter eine CustomizedURL, die Datei dahinter ist aber weg — der
// Download antwortet mit 404 und kann NIE mehr gelingen.
// [EN] When Amazon deletes personalization data of an order. Measured:
// [EN] 27 days still work, 30 no longer do (see also the ↻ warning in scheduler.js). After that
// [EN] Amazon still provides a CustomizedURL, but the file behind it is gone —
// [EN] download returns 404 and can NEVER succeed again.
const PERSONALISIERUNG_TTL_TAGE = 30;

// Queue-Datei ins Dead-Letter-Verzeichnis verschieben (bleibt zur Analyse erhalten,
// blockiert aber keine Läufe mehr) — genutzt vom Versuchs-Limit UND vom 404-Pfad.
// [EN] Move queue file to dead-letter directory (kept for analysis,
// [EN] but no longer blocks runs) — used by attempt limit AND 404 path.
const moveQueueFileToFailed = (file, data, why) => {
  try {
    if (!existsSync(failedQueueDir)) mkdirSync(failedQueueDir, { recursive: true });
    writeJsonAtomic(join(failedQueueDir, file), { ...data, failedAt: new Date().toISOString() }, 2);
    rmSync(join(queueDir, file));
    // ── Alte Bestellungen endgültig abhaken ───────────────────────────────────
    // Eine aussortierte Bestellung stand WEDER im Ledger NOCH als Ordner unter public/ — sobald Amazon
    // ihr Änderungsdatum erneut anfasste, ging sie wieder in die Queue und scheiterte wieder fünfmal.
    // Deshalb: ist der Kauf älter als PERSONALISIERUNG_TTL_TAGE, ins Ledger schreiben — dann wirft der
    // Vorfilter sie raus, bevor ein API-Aufruf passiert. BEWUSST nur alte: bei einer frischen kann der
    // Fehlschlag vorübergehend sein (Netz, Platte). Weg zurück: Reiter „Reklam." (reloadSingleOrder).
    // [EN] ── Mark old orders as finally processed ────────────────────────────
    // [EN] A culled order was NEITHER in ledger NOR as folder under public/ — as soon as Amazon
    // [EN] touched its modification date again, it entered the queue again and failed another five times.
    // [EN] Therefore: if purchase is older than PERSONALISIERUNG_TTL_TAGE, write to ledger — then pre-filter
    // [EN] drops it before any API call occurs. INTENTIONALLY only old ones: for a fresh order the
    // [EN] failure may be temporary (network, disk). Way back: tab "Reklam." (reloadSingleOrder).
    const alterTage = data.purchaseDate
      ? Math.floor((Date.now() - new Date(data.purchaseDate).getTime()) / 86400000)
      : null;
    if (alterTage !== null && alterTage > PERSONALISIERUNG_TTL_TAGE) {
      markProcessedBatch([data.orderId]);
      logger.log(`Order ${data.orderId}: Kauf ${alterTage} Tage her — als verarbeitet abgehakt, `
        + 'Amazon hat die Gravurdaten längst gelöscht (kommt nicht wieder).');
    }
    logger.error(`Order ${data.orderId}: ${why} — nach queue/failed/ verschoben.`);
    meldeAktivitaet('error', `❌ Bestellung ${data.orderId} aussortiert (queue/failed): ${why}`, { status: 'error' });
  } catch (e) {
    logger.error(`Order ${data.orderId}: Verschieben nach failed/ fehlgeschlagen:`, e.message);
  }
};

const sessionFile = join(config.datenDir, 'session.json');

// ── Session in-memory + Batch-Flush ───────────────────────────────────────────
// Einmal laden, im Speicher sammeln, an den Batch-Grenzen (und in den finally-Blöcken) schreiben —
// statt die komplette session.json bei JEDEM Artikel zu lesen und zu schreiben. Crash-Fenster:
// höchstens ein Batch; der Dedup läuft ohnehin über public-Ordner + Ledger.
// [EN] ── Session in-memory + batch flush ──────────────────────────────────────
// [EN] Load once, collect in memory, write at batch boundaries (and in finally blocks) —
// [EN] instead of reading and writing the complete session.json on EACH item. Crash window:
// [EN] at most one batch; deduplication runs via public folders + ledger anyway.
let _sessionCache = null;
let _sessionDirty = false;

const _loadSessionCache = () => {
  if (_sessionCache) return _sessionCache;
  _sessionCache = readJsonSafe(sessionFile, { orders: [] }) || { orders: [] };
  if (!Array.isArray(_sessionCache.orders)) _sessionCache.orders = [];
  return _sessionCache;
};

// Clear session at start of new download
const clearSession = () => {
  _sessionCache = { orders: [], startedAt: new Date().toISOString() };
  _sessionDirty = false;
  writeJsonAtomic(sessionFile, _sessionCache);
};

// Session-Eintrag — Dedupe nach orderId+asin (Mehr-Artikel-Bestellungen: ein Eintrag pro ASIN)
// [EN] Session entry — deduplicate by orderId+asin (multi-item orders: one entry per ASIN)
const addToSession = (orderId, purchaseDate, asin) => {
  try {
    const session = _loadSessionCache();
    if (!session.orders.find(o => o.id === orderId && o.asin === asin)) {
      session.orders.push({ id: orderId, purchaseDate, asin });
      _sessionDirty = true;
    }
  } catch(e) {}
};

// Gesammelte Session-Einträge auf Platte schreiben (nur wenn sich etwas geändert hat).
// Bleibt lesbar formatiert — session.json wird bei der Export-Forensik manuell gelesen.
// [EN] Write collected session entries to disk (only if something changed).
// [EN] Remains formatted legibly — session.json is read manually during export forensics.
const flushSession = () => {
  if (!_sessionDirty || !_sessionCache) return;
  try {
    writeJsonAtomic(sessionFile, _sessionCache, 2);
    _sessionDirty = false;
  } catch(e) { logger.warn('Session-Schreiben fehlgeschlagen:', e.message); }
};

// ── Persistentes "verarbeitet"-Ledger ────────────────────────────────────────
// Seit der Abruf über LastUpdatedAfter läuft, liefert Amazon eine Order bei JEDER Statusänderung
// erneut — auch Wochen nach dem Kauf, wenn ihr public-Ordner längst auto-gelöscht ist (= Dublette im
// Export). Das Ledger hält jede verarbeitete orderId fest und wird NICHT mit den Ordnern gelöscht;
// Einträge > TTL werden beim Laden weggeräumt.
// [EN] ── Persistent "processed" ledger ───────────────────────────────────────
// [EN] Since fetching runs via LastUpdatedAfter, Amazon returns an order on EVERY status change
// [EN] again — even weeks after purchase when its public folder is long auto-deleted (= duplicate in
// [EN] export). The ledger retains each processed orderId and is NOT deleted with folders;
// [EN] entries > TTL are cleaned up on load.
const processedFile = join(config.datenDir, 'processed-orders.json');
const PROCESSED_TTL_DAYS = 90;
let _processedLedger = null; // { orderId: 'ISO-Zeit' } — einmal geladen, in-memory gehalten
// [EN] { orderId: 'ISO-time' } — loaded once, held in-memory

const loadProcessedLedger = () => {
  if (_processedLedger) return _processedLedger;
  // Korrupte Datei nicht fatal werden lassen — lieber leer starten als Abruf blockieren. Aber
  // LAUT: ein leeres Ledger lässt Bestellungen, deren Ordner schon weg ist, erneut herein
  // (Doppel-Gravur), und der nächste Schreibvorgang überschriebe die kaputte Datei samt Inhalt.
  // [EN] Do not let a corrupt file become fatal — better to start empty than block fetch. But
  // [EN] LOUDLY: an empty ledger lets orders whose folder is already gone back in
  // [EN] (double engraving), and the next write operation would overwrite the broken file including contents.
  const data = readJsonSafe(processedFile, {}, e => {
    logger.error('processed-orders.json unlesbar, starte mit leerem Ledger:', e.message);
    try { copyFileSync(processedFile, processedFile + '.kaputt'); } catch (_) {}
    meldeAktivitaet('error', '⚠️ Download-Ledger unlesbar — Doppel-Downloads möglich. Kopie: processed-orders.json.kaputt, Stand aus der Nachtsicherung zurückholen.', { status: 'error' });
  }) || {};
  // TTL-Prune: alte Einträge entfernen (weit jenseits jedes Amazon-Update-Fensters)
  // [EN] TTL prune: remove old entries (far beyond any Amazon update window)
  const pruned = entferneAeltere(data, PROCESSED_TTL_DAYS, t => t);
  if (pruned) logger.log(`Ledger: ${pruned} Einträge älter als ${PROCESSED_TTL_DAYS} Tage entfernt.`);
  _processedLedger = data;
  return _processedLedger;
};

// orderIds als verarbeitet markieren (idempotent) — EIN atomarer Voll-Write pro BATCH statt pro
// Bestellung. Crash-Fenster max. ein Batch: deren public-Ordner existieren bereits, und der nächste
// Fetch trägt sie ins Ledger nach.
// [EN] Mark orderIds as processed (idempotent) — ONE atomic full write per BATCH instead of per
// [EN] order. Crash window max. one batch: their public folders already exist, and next
// [EN] fetch updates them into the ledger.
const markProcessedBatch = (orderIds) => {
  if (!orderIds.length) return;
  try {
    const ledger = loadProcessedLedger();
    const now = new Date().toISOString();
    for (const id of orderIds) ledger[id] = now;
    writeJsonAtomic(processedFile, ledger);
  } catch (e) {
    logger.warn(`Ledger-Schreiben (${orderIds.length} IDs) fehlgeschlagen:`, e.message);
  }
};

// First cron/part: Fetch orders and store valid order IDs to queue
// opts.force = Dedup überspringen (s. Vorfilter unten). NUR für den manuellen Download: wer
// Bestellordner von Hand löscht, käme sonst nicht mehr an die Daten heran (die IDs stehen weiter im
// Ledger). Als Objekt statt weiterem Boolean-Positionsargument, damit der Aufruf lesbar bleibt.
// [EN] opts.force = skip deduplication (see pre-filter below). ONLY for manual download: whoever
// [EN] deletes order folders manually could otherwise no longer access the data (IDs remain in
// [EN] ledger). As object instead of another boolean positional argument to keep call readable.
const manageFetchOrders = async (minutes = null, orderStatus = 'Unshipped', lastUpdatedAfter = null, createdBefore = null, progressRef = null, opts = {}) => {
  // Lock-Check zuerst: ein paralleler Aufruf leerte sonst die Session des laufenden Abrufs.
  // WERFEN statt still zurückzukehren: runDownload meldete sonst „✅ Download fertig“, und
  // der Zeitplan schob den Watermark über ein Fenster, das nie abgefragt wurde.
  // [EN] Lock check first: a concurrent call would otherwise clear the session of the running fetch.
  // [EN] THROW instead of returning silently: runDownload would otherwise report "✅ Download complete", and
  // [EN] scheduler would advance watermark over a window that was never queried.
  if (is_running) throw new Error('Es läuft bereits ein Abruf bei Amazon — dieser wurde nicht gestartet.');

  const force = !!opts.force;
  // keepSession: dieser Abruf hängt sich an eine LAUFENDE Session an, statt eine neue zu
  // beginnen. Nur der Nachschlag am Ende eines Zeitplan-Laufs nutzt das (s. scheduler.js).
  // [EN] keepSession: this fetch attaches to a RUNNING session instead of starting a new one.
  // [EN] Only the catch-up pass at the end of a schedule run uses this (see scheduler.js).
  const keepSession = !!opts.keepSession;
  // Das Abruf-Fenster reist als Parameter an fetchOrders (bis 23.10.2026 über Modul-Variablen,
  // die im finally zurückgesetzt werden mussten).
  // [EN] The fetch window travels as parameter to fetchOrders (until 23.10.2026 via module variables
  // [EN] that had to be reset in finally).
  const fenster = { minuten: minutes || 15, status: orderStatus, lastUpdatedAfter, createdBefore };
  logger.log('manageFetchOrders:', { minutes, orderStatus, lastUpdatedAfter, createdBefore, force, keepSession });

  try {
    is_running = true;
    _cancelRequested = false; // Neuer Lauf — Cancel-Flag zurücksetzen
    // [EN] New run — reset cancel flag
    // Der Nachschlag eines Zeitplan-Laufs ist KEIN neuer Lauf: er ergänzt dieselbe
    // Session um die Nachzügler. Ohne diese Ausnahme löschte er die Bestellungen des
    // Hauptlaufs aus der Session und der Auto-Export hätte nur noch die Nachzügler
    // auf dem Blatt (alle Layouts füllen mit fillDatePreset: 'session').
    // [EN] The catch-up pass of a schedule run is NOT a new run: it supplements the same
    // [EN] session with stragglers. Without this exception, it would delete orders of
    // [EN] main run from session and auto-export would only have stragglers
    // [EN] on the sheet (all layouts populate with fillDatePreset: 'session').
    if (keepSession) logger.log('Nachschlag: bestehende Session bleibt erhalten.');
    else clearSession(); // New download = new session
    const token = await accessToken();
    // Fehler HART werfen statt still als "0 Bestellungen" zu enden — runDownload fängt
    // den Throw, setzt progress auf 'error' und schreibt die ❌-Activity. Vorher zeigte
    // die UI bei Token-/Netzwerkfehlern "Fertig!" mit 0 Treffern (ein Ausfall war von
    // einem leeren Zeitfenster nicht unterscheidbar).
    // [EN] Throw errors HARD instead of silently ending with "0 orders" — runDownload catches
    // [EN] the throw, sets progress to 'error' and writes ❌-activity. Previously the UI showed
    // [EN] "Done!" with 0 hits on token/network errors (an outage was indistinguishable
    // [EN] from an empty time window).
    if (!token) throw new Error('Amazon-Token nicht abrufbar — Credentials/Netzwerk prüfen (Details im Log)');

    const abruf = await fetchOrders(token, fenster);
    if (abruf === null) throw new Error('Bestellabruf bei Amazon fehlgeschlagen (Details im Log)');
    const { orders } = abruf;

    let _skipCount = 0, _newCount = 0, _errCount = 0;
    if (orders.length > 0) {
      // Get ONE bulk RDT token valid for all orders - saves 118 individual token requests!
      // NICHT das lokale `token` verwenden: fetchOrders erneuert das Token bei einem
      // 403 mitten in der Pagination selbst — das alte wäre dann abgelaufen und der
      // RDT-Abruf scheiterte, obwohl längst ein gültiges vorliegt (Abbruch des ganzen Laufs).
      // [EN] Do NOT use local `token`: fetchOrders renews the token on a
      // [EN] 403 in the middle of pagination itself — the old one would be expired and
      // [EN] RDT fetch would fail although a valid one exists (aborting the entire run).
      const bulkRDT = await getBulkRDTToken(abruf.token);
      if (!bulkRDT) {
        // Ohne RDT Token kein BuyerCustomizedInfo → Abbruch statt Datenverlust!
        // Throw statt return: so wird der Abbruch als FEHLER gemeldet (progress +
        // Activity via runDownload) statt als scheinbar erfolgreicher 0-Treffer-Lauf.
        // [EN] Without RDT token no BuyerCustomizedInfo → abort instead of data loss!
        // [EN] Throw instead of return: this way abort is reported as ERROR (progress +
        // [EN] activity via runDownload) instead of a seemingly successful 0-hit run.
        logger.error('CRITICAL: Bulk RDT token failed — aborting fetch to avoid silent data loss.');
        throw new Error('RDT-Token nicht abrufbar — Download abgebrochen (nächster Lauf prüft erneut)');
      }
      logger.log(`Got bulk RDT token, processing ${orders.length} orders...`);

      // Performance: alle bereits heruntergeladenen Bestellungs-IDs einmal cachen
      // (statt für jede Bestellung neu durchs Dateisystem zu loopen — O(n*m) → O(n))
      // [EN] Performance: cache all already downloaded order IDs once
      // [EN] (instead of looping through the file system for each order — O(n*m) → O(n))
      const downloadedOrderIds = new Set();
      const publicBasePath = join(__dirname, 'public');
      if (existsSync(publicBasePath)) {
        try {
          const dateDirs = readdirSync(publicBasePath, { withFileTypes: true })
            .filter(d => d.isDirectory() && d.name !== 'exports')
            .map(d => d.name);
          for (const dateDir of dateDirs) {
            const dateDirPath = join(publicBasePath, dateDir);
            const orderDirs = readdirSync(dateDirPath, { withFileTypes: true })
              .filter(d => d.isDirectory())
              .map(d => d.name);
            orderDirs.forEach(id => downloadedOrderIds.add(id));
          }
          logger.log(`Cache: ${downloadedOrderIds.size} bereits heruntergeladene Bestellungen (Ordner).`);
        } catch(e) {
          logger.log('Cache-Aufbau Fehler (nicht kritisch):', e.message);
        }
      }

      // Persistentes Ledger dazunehmen: fängt Orders, deren public-Ordner bereits
      // auto-gelöscht wurde und die Amazon per LastUpdatedAfter erneut liefert.
      // Gleichzeitig noch fehlende Ordner-IDs INS Ledger übernehmen — so sind die
      // Downloads der letzten Tage persistent gesichert, BEVOR ihre Ordner nach
      // ~3 Tagen verschwinden. Ein atomarer Schreibvorgang pro Lauf.
      // [EN] Include persistent ledger: catches orders whose public folder is already
      // [EN] auto-deleted and which Amazon returns again via LastUpdatedAfter.
      // [EN] Simultaneously import still missing folder IDs INTO the ledger — thus downloads
      // [EN] from recent days are persistently backed up BEFORE their folders disappear
      // [EN] after ~3 days. One atomic write operation per run.
      const ledger = loadProcessedLedger();
      let _ledgerSeed = 0;
      for (const id of downloadedOrderIds) {
        if (!ledger[id]) { ledger[id] = new Date().toISOString(); _ledgerSeed++; }
      }
      if (_ledgerSeed > 0) { try { writeJsonAtomic(processedFile, ledger); } catch(e) { logger.warn('Ledger-Seed fehlgeschlagen:', e.message); } }
      const _ledgerCount = Object.keys(ledger).length;
      for (const id of Object.keys(ledger)) downloadedOrderIds.add(id);
      logger.log(`Dedup gesamt: ${downloadedOrderIds.size} IDs (Ledger: ${_ledgerCount}, davon ${_ledgerSeed} neu aus Ordnern übernommen).`);

      // ── Vorfilter: bekannte Bestellungen VOR der Batch-Schleife aussortieren ──
      // Skips machen keinen API-Aufruf, ihre 2-s-Quota-Pausen liefen aber mit. Jetzt werden nur echte
      // Neuzugänge gebatcht und gedrosselt — die Amazon-Last bleibt exakt gleich.
      // [EN] ── Pre-filter: sort out known orders BEFORE the batch loop ──────────
      // [EN] Skips don't make API calls, but their 2s quota pauses were running. Now only genuine
      // [EN] new additions are batched and throttled — Amazon load remains exactly the same.
      const newOrders = orders.filter(order => {
        const orderId = order['AmazonOrderId'];
        // Queue-Prüfung gilt AUCH bei force: die Bestellung ist bereits angenommen und
        // wird von manageProcessQueue ohnehin abgearbeitet — ein zweiter Eintrag würde
        // nur denselben Download parallel noch einmal anstoßen.
        // [EN] Queue check ALSO applies with force: order is already accepted and
        // [EN] processed by manageProcessQueue anyway — a second entry would
        // [EN] only trigger the same download again in parallel.
        if (existsSync(join(queueDir, `${orderId}.json`))) {
          logger.log(`Order ${orderId} already in queue, skipping.`);
          _skipCount++;
          return false;
        }
        // Bereits im public-Ordner oder Ledger? (O(1) via Set-Cache)
        // force überspringt genau das — s. Kommentar an der Signatur.
        // [EN] Already in public folder or ledger? (O(1) via Set-Cache)
        // [EN] force skips exactly this — see comment on function signature.
        if (!force && downloadedOrderIds.has(orderId)) {
          logger.log(`Order ${orderId} already downloaded, skipping.`);
          _skipCount++;
          return false;
        }
        return true;
      });
      logger.log(`Vorfilter: ${orders.length} im Fenster → ${_skipCount} bekannt, ${newOrders.length} neu zu prüfen.`
                 + (force ? ' [force: Dedup übersprungen]' : ''));

      // 2 Bestellungen parallel — weniger gleichzeitige Anfragen = weniger QuotaExceeded
      // [EN] 2 orders in parallel — fewer concurrent requests = fewer QuotaExceeded errors
      await runInBatches(newOrders, 2, async (order, index) => {
        const orderId = order['AmazonOrderId'];
        const purchaseDate = order['PurchaseDate'];
        const queueFile = join(queueDir, `${orderId}.json`);
        // URLs direkt in Queue speichern - kein zweiter API-Call in Schritt 2!
        // bulkRDT ist garantiert vorhanden (sonst Abbruch oben) → kein silent fallback
        // [EN] Store URLs directly in queue - no second API call in step 2!
        // [EN] bulkRDT is guaranteed present (otherwise aborted above) → no silent fallback
        const items = await fetchOrderItemsAndGetURLs(orderId, bulkRDT);
        if (items === null) {
          // API-Fehler: Bestellung in diesem Lauf auslassen, aber nicht abhaken —
          // sie ist weder in Queue noch im public-Ordner und wird beim nächsten
          // Lauf im Zeitfenster (Auto: 90 min Overlap) erneut geprüft.
          // [EN] API error: skip order in this run, but do not mark done —
          // [EN] it is neither in queue nor in public folder and will be rechecked
          // [EN] on next run in time window (auto: 90 min overlap).
          _errCount++;
          logger.warn(`Order ${orderId}: Artikel-Abruf fehlgeschlagen — wird in diesem Lauf übersprungen.`);
          return;
        }
        const isValid = items.length > 0;
        const purchaseDateBerlin = new Date(purchaseDate).toLocaleString('de-DE', { timeZone: 'Europe/Berlin', hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' });
        logger.log(index, orderId, purchaseDate + ' (Berlin: ' + purchaseDateBerlin + ')', 'isValid:', isValid);
        if (isValid) {
          writeJsonAtomic(queueFile, { orderId, purchaseDate, items });
          // ALLE Artikel der Bestellung erfassen (nicht nur items[0]) — sonst
          // gehen bei Mehr-Artikel-Bestellungen alle weiteren ASINs verloren.
          // [EN] Capture ALL items of order (not only items[0]) — otherwise
          // [EN] in multi-item orders all subsequent ASINs would be lost.
          for (const it of items) addToSession(orderId, purchaseDate, it.asin || null);
          // Nur gültige (gespeicherte) Bestellungen zählen
          // [EN] Count only valid (saved) orders
          if (progressRef) progressRef.total = (progressRef.total || 0) + 1;
          _newCount++;
        }
      }, {
        label: 'Download',
        cancelMessage: 'Download abgebrochen',
        afterBatch: () => flushSession(), // Session-Einträge des Batches sichern
        // [EN] persist session entries of this batch
        pauseMs: 2000,                    // Quota-Pause, nur zwischen den Batches
        // [EN] quota pause, only between batches
      });
    }
    logger.log('Complete!!');
    if (_newCount > 0) meldeAktivitaet('info', `✅ ${_newCount} neue Bestellung${_newCount !== 1 ? 'en' : ''} in Queue`, { count: _newCount, status: 'new' });
    if (_skipCount > 0) meldeAktivitaet('info', `⏭ ${_skipCount} bereits vorhandene Bestellung${_skipCount !== 1 ? 'en' : ''} übersprungen`, { count: _skipCount, status: 'skipped' });
    if (_errCount > 0) meldeAktivitaet('error', `⚠️ ${_errCount} Bestellung${_errCount !== 1 ? 'en' : ''} nicht prüfbar (API-Fehler) — nächster Lauf versucht erneut`, { count: _errCount, status: 'error' });
  } catch (err) {
    logger.error('manageFetchOrders Fehler:', err?.stack || err);
    // Rethrow: runDownload setzt progress auf 'error' und schreibt die ❌-Activity —
    // die frühere eigene Activity hier entfiel (sonst doppelte Fehlermeldung).
    // [EN] Rethrow: runDownload sets progress to 'error' and writes the ❌-activity —
    // [EN] former dedicated activity here was removed (otherwise duplicate error message).
    throw err;
  } finally {
    flushSession(); // letzter Stand — auch bei Fehler/Cancel nichts verlieren
    // [EN] latest state — lose nothing even on error/cancel
    is_running = false;
  }
};


// Hatte die Bestellung bei einem früheren Download MEHR Artikel als jetzt (ein Artikel
// inzwischen storniert, danach Reklamation oder Ledger-Reset), blieben item-(n+1)… mit dem
// alten Inhalt liegen — und landeten im Export: das Feuerzeug wäre doppelt graviert worden.
// Erst NACH allen erfolgreichen Downloads; nie fatal.
// [EN] If order had MORE items in an earlier download than now (an item
// [EN] cancelled since, then complaint or ledger reset), item-(n+1)… remained
// [EN] with old content — and landed in export: lighter would be engraved twice.
// [EN] Only AFTER all successful downloads; never fatal.
const entferneUeberzaehligeItems = (orderId, purchaseDate, anzahl) => {
  if (!anzahl) return;
  const orderDir = join(__dirname, 'public', berlinDayOf(purchaseDate), orderId);
  try {
    for (const d of readdirSync(orderDir)) {
      const m = /^item-(\d+)$/.exec(d);
      if (!m || Number(m[1]) <= anzahl) continue;
      rmSync(join(orderDir, d), { recursive: true, force: true });
      logger.log(`Order ${orderId}: veralteten Ordner ${d} entfernt (Bestellung hat nur noch ${anzahl} Artikel).`);
    }
  } catch (e) {
    logger.warn(`Order ${orderId}: Aufräumen alter item-Ordner fehlgeschlagen:`, e.message);
  }
};

// Verarbeitet eine Bestellung direkt mit den URLs aus der Queue (kein API-Call!)
// Rückgabe { ok, notFound }: notFound=true bei HTTP 404 — die in der Queue gespeicherte
// CustomizedURL ist dann ABGELAUFEN (Amazon-Links verfallen). Ein erneuter Download
// derselben URL kann nie mehr gelingen; der Aufrufer muss eine frische URL holen.
// [EN] Processes an order directly with URLs from queue (no API call!)
// [EN] Return { ok, notFound }: notFound=true on HTTP 404 — stored CustomizedURL
// [EN] in queue has EXPIRED (Amazon links expire). A re-download of same URL
// [EN] can never succeed; caller must fetch fresh URLs.
const processOrderWithURLs = async (orderId, purchaseDate, items = []) => {
  try {
    for (let i = 0; i < items.length; i++) {
      await downloadAndSaveZip(items[i].url, orderId, purchaseDate, i, items[i].asin);
    }
    entferneUeberzaehligeItems(orderId, purchaseDate, items.length);
    return { ok: true };
  } catch (err) {
    logger.error(`Error processing order ${orderId}:`, err);
    return { ok: false, notFound: err?.response?.status === 404 };
  }
};

// Second cron/part: Process queued orders
// Rückgabe { ran, cancelled, verarbeitet }: der Aufrufer MUSS wissen, ob wirklich gearbeitet wurde —
// sonst meldete /reload-order „neu geladen" für eine Bestellung, die noch unangetastet in der Queue lag.
// [EN] Second cron/part: Process queued orders
// [EN] Return { ran, cancelled, verarbeitet }: caller MUST know if work was actually done —
// [EN] otherwise /reload-order reported "reloaded" for an order that remained untouched in queue.
const manageProcessQueue = async (progressRef = null) => {
  // Sperr-Prüfung VOR dem try: stand sie darin, lief das finally auch beim Aussteigen und
  // setzte is_queue_running = false — die Sperre des LAUFENDEN Durchgangs war damit weg.
  // [EN] Lock check BEFORE try: if inside, finally would run on early exit and
  // [EN] set is_queue_running = false — removing the lock of the CURRENTLY RUNNING pass.
  if (is_queue_running) {
    logger.log('Queue-Verarbeitung läuft bereits — Aufruf übersprungen.');
    return { ran: false, cancelled: false, verarbeitet: 0 };
  }
  is_queue_running = true;
  try {
    const queueFiles = readdirSync(queueDir).filter((f) => f.endsWith('.json'));
    let verarbeitet = 0;

    // Fortschritt: Gesamtzahl = Queue-Länge, Zähler startet bei 0 und wächst je
    // verarbeiteter Bestellung — so bewegt sich die "X / Y"-Anzeige in der UI auch
    // während der Verarbeitungsphase (vorher stand current still auf 0).
    // [EN] Progress: total count = queue length, counter starts at 0 and increments per
    // [EN] processed order — so "X / Y" display moves in UI also
    // [EN] during processing phase (previously current stood still at 0).
    if (progressRef) { progressRef.total = queueFiles.length; progressRef.current = 0; }

    // Kein RDT Token mehr nötig - URLs sind bereits in der Queue gespeichert!
    // BATCH 4 parallel möglich da kein API-Call mehr in Schritt 2
    // AUSNAHME 404-Refresh: Access+RDT-Token werden lazy und höchstens EINMAL pro Lauf
    // geholt — nur wenn tatsächlich eine abgelaufene URL auftaucht (s. unten).
    // [EN] No RDT token needed anymore - URLs are already saved in queue!
    // [EN] BATCH 4 in parallel possible since no API call in step 2
    // [EN] EXCEPTION 404 refresh: access+RDT token fetched lazily and at most ONCE per run
    // [EN] — only when an expired URL actually occurs (see below).
    let _refreshRDT = null;
    const getRefreshRDT = () => {
      _refreshRDT = _refreshRDT || (async () => {
        const token = await accessToken();
        return token ? getBulkRDTToken(token) : null;
      })();
      return _refreshRDT;
    };
    // 4 parallel — in diesem Schritt fällt kein API-Aufruf mehr an (URLs stehen in der Queue)
    // [EN] 4 in parallel — no API calls in this step (URLs are stored in queue)
    const durchgelaufen = await runInBatches(queueFiles, 4, async (file, _index, ctx) => {
      const queueFile = join(queueDir, file);
      let data;
      const _raw = (() => { try { return readFileSync(queueFile, 'utf8'); } catch(_) { return null; } })();
      try {
        data = JSON.parse(_raw);
      } catch(e) {
        // Unlesbare Queue-Datei → Dead-Letter (mit Log und Grund), statt sie bei jedem Lauf
        // stillschweigend zu überspringen.
        // [EN] Unreadable queue file → dead-letter (with log and reason), instead of silently
        // [EN] skipping it on every run.
        moveQueueFileToFailed(file,
          { orderId: file.replace(/\.json$/, ''), unreadable: true, raw: (_raw || '').slice(0, 2000) },
          `Queue-Datei nicht lesbar (${e.message})`);
        return;
      }
      const { orderId, purchaseDate } = data;
      let result = await processOrderWithURLs(orderId, purchaseDate, data.items);

      // 404 = gespeicherte CustomizedURL abgelaufen — dieselbe URL zu wiederholen kann NIE mehr gelingen.
      // Stattdessen EINMAL frische URLs über die orderItems-API holen, speichern und sofort erneut versuchen.
      // Liefert Amazon gar keine Artikel-URLs mehr ([]), ist die Personalisierung weg → direkt Dead-Letter.
      // [EN] 404 = stored CustomizedURL expired — retrying the same URL can NEVER succeed.
      // [EN] Instead fetch fresh URLs ONCE via orderItems API, persist them, and retry immediately.
      // [EN] If Amazon returns no item URLs ([]), customization is gone → directly to dead-letter.
      if (!result.ok && result.notFound) {
        const rdt = await getRefreshRDT();
        const freshItems = rdt ? await fetchOrderItemsAndGetURLs(orderId, rdt) : null;
        if (freshItems === null) {
          logger.warn(`Order ${orderId}: URL-Refresh nach 404 fehlgeschlagen (API) — nächster Lauf versucht erneut.`);
        } else if (freshItems.length === 0) {
          moveQueueFileToFailed(file, { ...data, attempts: (data.attempts || 0) + 1 },
            'CustomizedURL abgelaufen (404) und keine frischen Artikel-URLs mehr abrufbar');
          return;
        } else {
          data.items = freshItems; // frische URLs persistieren — auch ein Folgelauf nutzt sie
          // [EN] persist fresh URLs — subsequent run will also use them
          try { writeJsonAtomic(queueFile, data); } catch(e) {}
          logger.log(`Order ${orderId}: CustomizedURL war abgelaufen (404) — frische URL geholt, neuer Versuch.`);
          result = await processOrderWithURLs(orderId, purchaseDate, data.items);
        }
      }

      if (result.ok) {
        try { rmSync(queueFile); } catch(e) {}
        // Ledger-IDs je Batch sammeln → EIN Write pro Batch (s. markProcessedBatch)
        // [EN] Collect ledger IDs per batch → ONE write per batch (see markProcessedBatch)
        if (!ctx.processed) ctx.processed = [];
        ctx.processed.push(orderId); // persistent gegen Re-Download nach Ordner-Auto-Löschung
        // [EN] persistent against re-download after auto-deletion of folder
        verarbeitet++;
        if (progressRef) progressRef.current = (progressRef.current || 0) + 1;
        logger.log(`Removed processed order ${orderId} from queue.`);
      } else {
        // Fehlversuche zählen. Ohne Limit blieb eine dauerhaft kaputte Bestellung
        // (z.B. ZIP ohne JSON) für immer in der Queue und wurde bei JEDEM Lauf
        // erneut versucht. Nach MAX_QUEUE_ATTEMPTS → queue/failed/ (Dead-Letter,
        // s. moveQueueFileToFailed).
        // [EN] Count failed attempts. Without a limit, a permanently broken order
        // [EN] (e.g. ZIP without JSON) stayed forever in queue and was retried on
        // [EN] EVERY run. After MAX_QUEUE_ATTEMPTS → queue/failed/ (dead-letter,
        // [EN] see moveQueueFileToFailed).
        const attempts = (data.attempts || 0) + 1;
        if (attempts >= MAX_QUEUE_ATTEMPTS) {
          moveQueueFileToFailed(file, { ...data, attempts }, `${attempts} Fehlversuche`);
        } else {
          try { writeJsonAtomic(queueFile, { ...data, attempts }); } catch(e) {}
          logger.warn(`Failed to process ${orderId} (Versuch ${attempts}/${MAX_QUEUE_ATTEMPTS}), leaving in queue for next run.`);
        }
      }
    }, {
      label: 'Queue-Verarbeitung',
      cancelMessage: 'Verarbeitung abgebrochen',
      afterBatch: (ctx) => {
        markProcessedBatch(ctx.processed || []);
        flushSession(); // Session-Einträge aus downloadAndSaveZip dieses Batches sichern
        // [EN] save session entries from downloadAndSaveZip of this batch
        asinCheck.flush();
      },
      pauseMs: 200, pauseAfterLast: true,
    });

    logger.log('Queue complete!!');
    return { ran: true, cancelled: !durchgelaufen, verarbeitet };
  } catch (err) {
    // WERFEN, nicht nur loggen: sonst meldete runDownload anschließend „✅ Download fertig". Beide
    // Aufrufer (scheduler.runDownload, Queue-Recovery beim Start) behandeln den Wurf vollständig:
    // progress auf 'error' plus ❌-Eintrag im Aktivitäts-Log.
    // [EN] THROW, not just log: otherwise runDownload would report "✅ Download complete". Both
    // [EN] callers (scheduler.runDownload, queue recovery on startup) handle throw completely:
    // [EN] progress to 'error' plus ❌-entry in activity log.
    logger.error('Error in manageProcessQueue:', err);
    throw err;
  } finally {
    flushSession(); // letzter Stand — auch bei Fehler/Cancel nichts verlieren
    // [EN] latest state — lose nothing even on error/cancel
    asinCheck.flush();
    is_queue_running = false;
  }
};

// Zwei Verhaltensweisen hier sind nicht offensichtlich und dürfen beim Umbauen nicht verloren gehen:
//   • downloadAndSaveZip MUSS bei jedem Fehlschlag WERFEN — ein stilles return meldet dem Aufrufer
//     Erfolg, und die Bestellung verschwindet aus Queue UND Ledger.
//   • runInBatches: Abbruch-Prüfung VOR dem Batch, Nacharbeit NACH jedem Batch, Drosselpause
//     ZWISCHEN den Batches (s. dort).
// [EN] Two behaviors here are not obvious and must not be lost during refactoring:
// [EN]   • downloadAndSaveZip MUST THROW on every failure — a silent return reports
// [EN]     success to caller, and order vanishes from queue AND ledger.
// [EN]   • runInBatches: cancel check BEFORE batch, post-processing AFTER each batch, throttle pause
// [EN]     BETWEEN batches (see there).
// ── Einzelne Bestellung erneut laden (Reklamation) ───────────────────────────
// Bewusst NICHT über manageFetchOrders: dessen Dedup-Vorfilter sortiert eine bereits geladene
// Bestellung aus — genau die will man hier. Der Bestellordner wird überschrieben, das Ledger bleibt.
// Legt nur die Queue-Datei an; das Herunterladen macht manageProcessQueue (keine zweite Strecke).
// [EN] ── Reload single order (customer complaint) ─────────────────────────────
// [EN] Deliberately NOT via manageFetchOrders: its deduplication pre-filter filters out an already downloaded
// [EN] order — exactly what is wanted here. The order folder is overwritten, ledger remains.
// [EN] Only creates the queue file; downloading is done by manageProcessQueue (no duplicate path).
const reloadSingleOrder = async (orderId) => {
  if (is_running) return { error: 'Es läuft bereits ein Abruf — bitte abwarten.' };
  is_running = true;
  // Neuer, vom Bediener angestoßener Lauf — Cancel-Flag zurücksetzen wie manageFetchOrders. Sonst
  // blieb ein früheres „Download abbrechen" stehen und die Reklamation stieg sofort wieder aus
  // (Queue-Datei geschrieben, nichts geladen, trotzdem Erfolg gemeldet).
  // [EN] New operator-initiated run — reset cancel flag like in manageFetchOrders. Otherwise
  // [EN] a previous "cancel download" remained set and reloading would bail immediately
  // [EN] (queue file written, nothing downloaded, yet success reported).
  _cancelRequested = false;
  try {
    const token = await accessToken();
    if (!token) return { error: 'Amazon-Token nicht abrufbar — Credentials/Netzwerk prüfen (Details im Log).' };

    // Das Kaufdatum bestimmt den Tagesordner. Ohne es landet die Bestellung im falschen
    // Tag und taucht in keinem Datumsfilter des Editors auf.
    // [EN] Purchase date determines date folder. Without it, order lands in wrong
    // [EN] day and appears in no date filter in editor.
    let purchaseDate = null;
    try {
      const res = await spApi.get(
        `${config.amz.amz_sp_api_base_url}/orders/v0/orders/${orderId}`,
        { headers: { 'x-amz-access-token': token } }
      );
      purchaseDate = res.data?.payload?.PurchaseDate || null;
    } catch (e) {
      const code = e?.response?.status;
      if (code === 404) return { error: `Bestellung ${orderId} gibt es bei Amazon nicht (Nummer prüfen).` };
      logger.error(`reloadSingleOrder: getOrder ${orderId} fehlgeschlagen:`, e?.response?.data || e.message);
      return { error: `Bestellung ${orderId} nicht abrufbar (HTTP ${code || '?'}).` };
    }
    // Amazon antwortet auf eine unbekannte Nummer teils mit 200 und leerem Payload statt
    // mit 404 — ohne diesen Zweig liefe das in eine nichtssagende Folgefehlermeldung.
    // [EN] Amazon sometimes answers an unknown order number with 200 and empty payload instead
    // [EN] of 404 — without this branch that would result in an unhelpful follow-up error.
    if (!purchaseDate) return { error: `Bestellung ${orderId} gibt es bei Amazon nicht (Nummer prüfen).` };

    const rdt = await getBulkRDTToken(token);
    if (!rdt) return { error: 'RDT-Token nicht abrufbar — ohne ihn rückt Amazon die Personalisierung nicht heraus.' };

    const items = await fetchOrderItemsAndGetURLs(orderId, rdt);
    // null = API-Fehler (erneut versuchen), [] = wirklich nichts zu personalisieren
    // [EN] null = API error (retry), [] = genuinely nothing to personalize
    if (items === null) return { error: 'Artikel-Abruf fehlgeschlagen (API-Fehler) — bitte erneut versuchen.' };
    if (!items.length) return { error: `Bestellung ${orderId} hat keine Personalisierung — nichts zu gravieren.` };

    writeJsonAtomic(join(queueDir, `${orderId}.json`), { orderId, purchaseDate, items });
    // In die Session aufnehmen (NICHT clearSession): so bleibt eine laufende Session
    // erhalten und die Bestellung ist im Editor trotzdem über „Letzte Session" greifbar.
    // [EN] Add to session (do NOT clearSession): this preserves an ongoing session
    // [EN] and order is still accessible in editor via "Latest session".
    for (const it of items) addToSession(orderId, purchaseDate, it.asin || null);
    flushSession();
    logger.log(`Reklamation: ${orderId} (${items.length} Artikel) in die Queue gelegt.`);
    return {
      ok: true, orderId, purchaseDate,
      itemCount: items.length,
      asins: items.map(i => i.asin).filter(Boolean),
    };
  } catch (err) {
    logger.error('reloadSingleOrder Fehler:', err?.stack || err);
    return { error: err.message || String(err) };
  } finally {
    is_running = false;
  }
};

// ── ASIN-Check: ältere Bestellungen einer ASIN nachladen ─────────────────────
// getOrders kennt keine ASIN, also je Bestellung die Artikel abfragen. Kandidaten: die Bestellungen
// aus dem Ledger (nur dort stehen personalisierte), abzüglich derer, deren ASINs der Index kennt;
// jede Abfrage wird im Index vermerkt. getOrderItems erlaubt 0,5/s — deshalb Schluss bei genug neuen
// Beispielen und Abbruch, sobald ein Download beginnt (gleiche Quote). Nur die JSON wird gelesen.
// [EN] ── ASIN-Check: reload older orders of an ASIN ─────────────────────────
// [EN] getOrders does not know ASINs, so query items per order. Candidates: orders
// [EN] from ledger (only personalized orders are there), minus those whose ASINs are already known in index;
// [EN] each query is noted in index. getOrderItems allows 0.5/s — therefore stop when enough new
// [EN] samples found, and abort as soon as a download starts (shared quota). Only JSON is read.
const ASIN_SCAN_ZIEL = 12;          // neue Beispiel-Bestellungen, dann ist das Bild vollständig
// [EN] new sample orders, then image is complete
const ASIN_SCAN_PAUSE_MS = 2000;    // 0,5 Anfragen/s (getOrderItems)
// [EN] 0.5 requests/sec (getOrderItems)
const _asinScan = { running: false };

const asinScanStatus = () => {
  const { abbrechen, ...s } = _asinScan;
  return s;
};

const asinScanAbbrechen = () => {
  if (_asinScan.running) _asinScan.abbrechen = true;
  return _asinScan.running;
};

// Nur die Bestell-JSON aus dem Personalisierungs-ZIP lesen
// [EN] Read only the order JSON from personalization ZIP
const _customizationJson = async (url, orderId, i) => {
  const tmpDir = join(__dirname, 'tmp');
  mkdirSync(tmpDir, { recursive: true });
  const zipPfad = join(tmpDir, `asin-check-${orderId}-${i}.zip`);
  try {
    await downloadFile(url, zipPfad);
    const verz = await unzipper.Open.file(zipPfad);
    const eintrag = verz.files.find(f => /\.json$/i.test(f.path));
    if (!eintrag) return null;
    return JSON.parse((await eintrag.buffer()).toString('utf8'));
  } finally {
    try { rmSync(zipPfad, { force: true }); } catch (_) {}
  }
};

// Bestellungen, die ein Scan abfragen müsste: Ledger-Einträge des Zeitraums (neueste zuerst),
// ohne die, deren ASINs der Index schon kennt — außer sie enthalten die gesuchte ASIN und
// stehen noch nicht im Profil.
// [EN] Orders that a scan should query: ledger entries of the time period (newest first),
// [EN] excluding those whose ASINs index already knows — unless they contain searched ASIN
// [EN] and are not yet in profile.
function _asinKandidaten(asin, tage) {
  const grenze = Date.now() - (tage + 1) * 86400000;
  return Object.entries(loadProcessedLedger())
    .filter(([, t]) => Date.parse(t) >= grenze)
    .sort((a, b) => Date.parse(b[1]) - Date.parse(a[1]))
    .map(([id, t]) => ({ id, t }))
    .filter(({ id }) => {
      const bekannt = asinCheck.bekannteAsins(id);
      if (!bekannt) return true;
      return bekannt.includes(asin) && !asinCheck.hatBestellung(asin, id);
    });
}

// Für die Rückfrage im Editor: wie viele Abfragen, wie lange höchstens — ohne Amazon.
// [EN] For confirmation dialog in editor: how many queries, maximum duration — without Amazon call.
function asinScanKandidaten(asin, tage) {
  asinCheck.lokalNachtragen();
  const n = _asinKandidaten(asin, tage).length;
  return { gesamt: n, minutenMax: Math.ceil(n * (ASIN_SCAN_PAUSE_MS + 400) / 60000), ziel: ASIN_SCAN_ZIEL };
}

async function _asinScanLauf(asin, tage, progressRef) {
  const s = _asinScan;
  s.meldung = 'Bestellordner auf dem Server durchsehen…';
  asinCheck.lokalNachtragen();

  const kandidaten = _asinKandidaten(asin, tage);
  s.gesamt = kandidaten.length;
  if (!kandidaten.length) {
    s.meldung = 'Alle Bestellungen des Zeitraums sind schon bekannt — nichts nachzuladen.';
    return;
  }

  let token = await accessToken();
  let rdt = token ? await getBulkRDTToken(token) : null;
  if (!rdt) throw new Error('Amazon-Token nicht abrufbar — Details im Log.');
  let rdtZeit = Date.now();

  for (const { id, t } of kandidaten) {
    if (s.abbrechen) { s.meldung = 'Abgebrochen.'; return; }
    if (is_running || is_queue_running || (progressRef && progressRef.running)) {
      s.meldung = 'Unterbrochen — ein Download hat begonnen. Später erneut prüfen.';
      return;
    }
    // Das RDT gilt eine Stunde
    // [EN] The RDT is valid for one hour
    if (Date.now() - rdtZeit > 50 * 60000) {
      token = await accessToken();
      rdt = token ? await getBulkRDTToken(token) : null;
      if (!rdt) throw new Error('Amazon-Token konnte nicht erneuert werden.');
      rdtZeit = Date.now();
    }
    s.meldung = `Prüfe Bestellung ${s.geprueft + 1} von ${s.gesamt}…`;
    const items = await fetchOrderItemsAndGetURLs(id, rdt);
    s.geprueft++;
    if (items === null) {
      s.apiFehler++;
    } else {
      asinCheck.merkeAsins(id, items.map(it => it.asin), t);
      const treffer = items.filter(it => it.asin === asin);
      if (treffer.length) s.treffer++;
      for (let i = 0; i < treffer.length; i++) {
        try {
          const j = await _customizationJson(treffer[i].url, id, i);
          if (j && asinCheck.mergeBestellung({ asin, titel: j.title, orderId: id, orderItemId: j.orderItemId,
                                               datum: t, customizationData: j.customizationData })) s.neu++;
        } catch (e) {
          logger.warn(`ASIN-Check ${asin}: Personalisierung von ${id} nicht lesbar:`, e.message);
        }
      }
    }
    if (s.geprueft % 20 === 0) asinCheck.flush();
    if (s.neu >= ASIN_SCAN_ZIEL) { s.meldung = `${s.neu} neue Bestellungen gefunden — genug für ein vollständiges Bild.`; return; }
    await sleep(ASIN_SCAN_PAUSE_MS);
  }
  s.meldung = s.treffer
    ? `Fertig: ${s.geprueft} Bestellungen geprüft, ${s.treffer} mit dieser ASIN.`
    : `Fertig: ${s.geprueft} Bestellungen geprüft — keine mit dieser ASIN.`;
}

function asinScanStarten({ asin, tage }, progressRef) {
  if (_asinScan.running) return { error: `Es läuft bereits ein ASIN-Check (${_asinScan.asin}).` };
  if (is_running || is_queue_running || (progressRef && progressRef.running)) {
    return { error: 'Gerade läuft ein Download — bitte danach prüfen.' };
  }
  Object.assign(_asinScan, {
    running: true, abbrechen: false, asin, tage, geprueft: 0, gesamt: 0, treffer: 0, neu: 0, apiFehler: 0,
    meldung: 'Starte…', fehler: null, gestartet: new Date().toISOString(), fertig: null,
  });
  logger.log(`ASIN-Check ${asin}: Scan über ${tage} Tage gestartet.`);
  _asinScanLauf(asin, tage, progressRef)
    .catch(e => {
      _asinScan.fehler = e.message;
      _asinScan.meldung = 'Fehler: ' + e.message;
      logger.error(`ASIN-Check ${asin}:`, e.message);
    })
    .finally(() => {
      asinCheck.flush();
      _asinScan.running = false;
      _asinScan.fertig = new Date().toISOString();
      logger.log(`ASIN-Check ${asin}: ${_asinScan.meldung}`);
    });
  return { started: true };
}

module.exports = {
  manageFetchOrders,
  manageProcessQueue,
  reloadSingleOrder,
  requestCancel,
  isCancelRequested,
  asinScanStarten,
  asinScanStatus,
  asinScanAbbrechen,
  asinScanKandidaten,
};
