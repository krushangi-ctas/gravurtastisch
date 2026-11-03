// Bedien-Test des Editors (08.10.2026), ergänzt den Trockenlauf um das, was nur per Klick
// läuft: Testblätter (Keil, Testgitter, Tiefen-, DPI-Reihe → Dateien in <ziel>/dl/),
// Kopf-Menüs, Kombi-Feld im Array, Ziehen/Größe (Undo), Seiten, 💾 Überschreiben,
// Ordner umbenennen. ALLE Schreibzugriffe werden abgefangen — auf dem Server ändert sich nichts.
// Aufruf (aus src/):  node tools/bedien-test.js <editor.html> <laser-pipeline.js> <Zielordner>
// Alt/neu je einmal laufen lassen; dl/ muss bytegleich sein, _log.txt zeigt das Verhalten.
const puppeteer = require('/var/www/printomation/printomation/node_modules/puppeteer');
const fs = require('fs'), path = require('path');
const [htmlFile, pipeFile, ziel] = process.argv.slice(2);
const html = fs.readFileSync(htmlFile, 'utf8'), pipe = fs.readFileSync(pipeFile, 'utf8');
// layout-editor.js und layout-editor.css kommen aus dem Ordner der HTML, falls sie dort liegen
// (sonst vom Server) — so läuft ein Alt-Stand mit seinem eigenen Skript und seinen Stilen.
const neben = n => { const f = path.join(path.dirname(htmlFile), n); return fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : null; };
const editorJs = neben('layout-editor.js'), css = neben('layout-editor.css');
// Der Zielordner wird geleert — nie einen Ordner der App erwischen.
if (!ziel || path.resolve(ziel).startsWith(path.resolve(__dirname, '..'))) { console.error('Zielordner außerhalb von src/ angeben'); process.exit(1); }
fs.rmSync(ziel, { recursive: true, force: true }); fs.mkdirSync(ziel, { recursive: true });
const log = t => { fs.appendFileSync(path.join(ziel, '_log.txt'), t + '\n'); };
(async () => {
  const b = await puppeteer.launch({ headless: true, executablePath: '/snap/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const pg = await b.newPage();
  pg.setDefaultTimeout(5 * 60000);
  await pg.exposeFunction('__save', (rel, b64) => { const f = path.join(ziel, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.from(b64, 'base64')); });
  await pg.exposeFunction('__log', log);
  pg.on('console', m => { if (m.type() === 'error' && !/404|Failed to load resource/.test(m.text())) log('[console.error] ' + m.text()); });
  pg.on('pageerror', e => log('[pageerror] ' + e.message));
  await pg.evaluateOnNewDocument(() => {
    const orig = window.fetch.bind(window);
    window.__writes = [];
    const b64 = async (blob) => { const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s); };
    window.fetch = async (url, init) => {
      const u = new URL(String(url), location.href);
      const method = (init && init.method || 'GET').toUpperCase();
      if (method === 'GET') return orig(url, init);
      let body = init && init.body; if (typeof body !== 'string') body = '[binär]';
      window.__writes.push({ method, pfad: u.pathname, body });
      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'Content-Type': 'application/json', ETag: 'W/"t"' } });
    };
    // Downloads abfangen
    window.__dl = 0;
    const origClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () {
      if (this.download && this.href.startsWith('blob:')) {
        const name = this.download, href = this.href;
        fetch(href).then(r => r.blob()).then(async bl => { await window.__save('dl/' + name, await b64(bl)); window.__dl++; });
        return;
      }
      return origClick.call(this);
    };
  });
  await pg.setRequestInterception(true);
  pg.on('request', req => {
    const u = new URL(req.url());
    if (req.method() !== 'GET') return req.abort();
    if (u.pathname === '/layout-editor.html') return req.respond({ status: 200, contentType: 'text/html; charset=utf-8', body: html });
    if (u.pathname === '/laser-pipeline.js') return req.respond({ status: 200, contentType: 'application/javascript; charset=utf-8', body: pipe });
    if (editorJs && u.pathname === '/layout-editor.js') return req.respond({ status: 200, contentType: 'application/javascript; charset=utf-8', body: editorJs });
    if (css && u.pathname === '/layout-editor.css') return req.respond({ status: 200, contentType: 'text/css; charset=utf-8', body: css });
    req.continue();
  });
  await pg.goto(`http://localhost:3002/layout-editor.html?nocache=${Date.now()}`, { waitUntil: 'networkidle2' });
  const raf = () => pg.evaluate(() => new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r))));
  const warteDl = async (n) => { for (let i = 0; i < 600; i++) { if (await pg.evaluate(() => window.__dl) >= n) return; await new Promise(r => setTimeout(r, 500)); } log('TIMEOUT Download ' + n); };

  // 1) Testblätter an F02_Schw_V5 (gefüllt)
  const id = await pg.evaluate(async () => (await getServerLayouts()).find(l => l.name === 'F02_Schw_V5').id);
  await pg.evaluate(id => loadLayout(id), id);
  await pg.evaluate(() => fillAllPagesAuto());
  await new Promise(r => setTimeout(r, 3000));
  log('Fotos: ' + await pg.evaluate(() => _laserSlots().length));
  let n = 0;
  for (const fn of ['exportCalibrationWedge', 'exportTestGrid', 'exportTiefenReihe']) {
    await pg.evaluate(fn => window[fn](), fn); n++; await warteDl(n); log('ok ' + fn);
  }
  await pg.evaluate(() => exportDpiReihe()); n++; await warteDl(n); log('ok exportDpiReihe');

  // 2) Menüs: Aktionen auf, dann Export → nur Export offen
  const menues = await pg.evaluate(async () => {
    const auf = id => getComputedStyle(document.getElementById(id)).display !== 'none';
    const klick = sel => document.querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true }));
    klick('[onclick*="actions-menu"],[onclick*="toggleActionsMenu"]');
    const a1 = auf('actions-menu');
    klick('[onclick*="export-menu"],[onclick*="toggleExportMenu"]');
    return { aktionenNachKlick1: a1, aktionenNachKlick2: auf('actions-menu'), export: auf('export-menu') };
  });
  log('Menüs ' + JSON.stringify(menues));
  await pg.evaluate(() => document.body.click());

  // 3) Neue leere Seite, Kombi-Feld mit Array, Zeilen ändern
  const kombi = await pg.evaluate(async () => {
    addBlankPage();
    const seiten = _pages.length;
    addToCanvas('combo', 1, 10, 10);
    const m = fields[fields.length - 1];
    addComboLine(m.id, 1); addComboLine(m.id, 2);
    sel = m.id;
    document.getElementById('arr-nx').value = 3; document.getElementById('arr-ny').value = 1;
    createArray();
    addComboLine(m.id, 3); moveComboLine(m.id, 0, 1); removeComboLine(m.id, 2);
    const kopien = fields.filter(x => x.arrayOf === m.arrayGroup).map(x => JSON.stringify(x.comboPals) + '/' + x.palNum);
    return { seiten, master: JSON.stringify(m.comboPals) + '/' + m.palNum, kopien };
  });
  log('Kombi ' + JSON.stringify(kombi));

  // 4) Ziehen und Größe ändern: Klick ohne Bewegung = kein Undo-Schritt
  await raf();
  const zieh = await pg.evaluate(async () => {
    const f = fields.find(x => x.type === 'text' && !x.arrayOf);
    const el = document.getElementById('cel-' + f.id), rh = el.querySelector('.rh');
    const r = el.getBoundingClientRect();
    const u0 = undoStack.length;
    rh.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: r.right, clientY: r.bottom }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    const u1 = undoStack.length;
    const w0 = f.w, x0 = f.x;
    const el2 = document.getElementById('cel-' + f.id), rh2 = el2.querySelector('.rh'), r2 = el2.getBoundingClientRect();
    rh2.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: r2.right, clientY: r2.bottom }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r2.right + 40, clientY: r2.bottom }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    const u2 = undoStack.length, w1 = f.w;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    const el3 = document.getElementById('cel-' + f.id), r3 = el3.getBoundingClientRect();
    el3.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, clientX: r3.left + 5, clientY: r3.top + 5 }));
    document.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: r3.left + 5 + 50, clientY: r3.top + 5 }));
    document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    return { undoKlickOhneBewegung: u1 - u0, undoNachResize: u2 - u1, breiteVorher: w0, breiteNachher: +w1.toFixed(2), xVorher: x0, xNachher: f.x, undoNachZiehen: undoStack.length - u2 };
  });
  log('Ziehen ' + JSON.stringify(zieh));

  // 5) Seite duplizieren
  log('Duplizieren ' + JSON.stringify(await pg.evaluate(() => { const v = _pages.length; duplicateCurrentPage(); return { vorher: v, nachher: _pages.length, aktuell: _currentPage, felder: fields.length }; })));

  // 6) Speichern bei geladenem Layout → Wahl „Überschreiben"
  const speichern = await pg.evaluate(async () => {
    window.__writes.length = 0;
    const p = saveLayout();
    await new Promise(r => setTimeout(r, 500));
    const btn = [...document.querySelectorAll('button')].find(b => b.offsetParent && /Überschreiben/.test(b.textContent));
    if (btn) btn.click(); else return 'kein Überschreiben-Knopf (alt?)';
    await p;
    const w = window.__writes.find(x => x.pfad === '/layouts');
    if (!w) return 'kein POST /layouts';
    const liste = JSON.parse(w.body), l = liste.find(x => x.name === 'F02_Schw_V5');
    return { anzahlLayouts: liste.length, gleicheNamen: liste.filter(x => x.name === 'F02_Schw_V5').length, seiten: l.pages.length, autoExport: l.autoExport, gruppe: l.group, format: l.exportFormat };
  });
  log('Speichern ' + JSON.stringify(speichern));

  // 7) Ordner umbenennen: Reihenfolge der Schreibzugriffe
  const ordner = await pg.evaluate(async () => {
    window.__writes.length = 0;
    const p = renameFolder('F02');
    await new Promise(r => setTimeout(r, 300));
    // Im Dialog suchen: seit dem Redesign heißt auch der Kopfleisten-Knopf „Speichern" — der erste
    // Treffer auf der ganzen Seite öffnete dann einen zweiten Dialog, und der Test hing.
    const inp = document.getElementById('app-modal-input');
    if (!inp || inp.value !== 'F02') return 'kein Eingabefeld';
    inp.value = 'F02-test';
    document.getElementById('app-modal-ok').click();
    await p;
    return window.__writes.map(w => w.method + ' ' + w.pfad);
  });
  log('Ordner umbenennen ' + JSON.stringify(ordner));
  await b.close();
  log('FERTIG');
})().catch(e => { log('ABBRUCH ' + e.message); process.exit(1); });
