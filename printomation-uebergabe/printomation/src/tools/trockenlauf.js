// Trockenlauf des Auto-Exports (06.10.2026): lädt den Editor über den laufenden Server, ersetzt
// aber die Editor-Dateien und laser-pipeline.js durch Dateien von der Platte und fängt alle
// schreibenden Aufrufe ab — Uploads landen im Zielordner, auf dem Server ändert sich nichts.
// Aufruf (aus src/):  node tools/trockenlauf.js <editor.html> <laser-pipeline.js> <Zielordner>
// Zwei Läufe (alter/neuer Stand) und danach die Bäume vergleichen. Zeitstempel-Rauschen:
// belegung.txt Zeile 1, packliste.txt Zeile 1, vorschau.png Titelzeile, PDF CreationDate/ID.
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
(async () => {
  // protocolTimeout: Puppeteer bricht sonst jeden Aufruf (auch das Warten unten) nach 180 s ab —
  // ein großer Tag oder ein Lauf über mehrere Tage dauert länger.
  const b = await puppeteer.launch({ headless: true, executablePath: '/snap/bin/chromium', protocolTimeout: 20 * 60000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'] });
  const pg = await b.newPage();
  pg.setDefaultTimeout(15 * 60000);
  let n = 0;
  await pg.exposeFunction('__save', (rel, b64) => {
    const f = path.join(ziel, rel); fs.mkdirSync(path.dirname(f), { recursive: true });
    fs.writeFileSync(f, Buffer.from(b64, 'base64')); n++;
  });
  await pg.exposeFunction('__log', (t) => { fs.appendFileSync(path.join(ziel, '_konsole.txt'), t + '\n'); });
  pg.on('console', m => { fs.appendFileSync(path.join(ziel, '_konsole.txt'), `[${m.type()}] ${m.text()}\n`); });
  pg.on('pageerror', e => fs.appendFileSync(path.join(ziel, '_konsole.txt'), `[pageerror] ${e.message}\n`));
  await pg.evaluateOnNewDocument(() => {
    const orig = window.fetch.bind(window);
    const b64 = async (blob) => { const buf = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000)); return btoa(s); };
    const json = (o) => new Response(JSON.stringify(o), { status: 200, headers: { 'Content-Type': 'application/json' } });
    window.fetch = async (url, init) => {
      const u = new URL(String(url), location.href);
      const method = (init && init.method || 'GET').toUpperCase();
      if (method === 'GET') return orig(url, init);
      if (u.pathname === '/export-run') return json({ run: 1, folder: 'x' });
      if (u.pathname === '/export-upload') {
        const fd = init.body; const file = fd.get('file');
        const date = fd.get('date'), group = fd.get('group'), vorlage = fd.get('vorlage'), unter = fd.get('unterordner');
        let dir = vorlage ? `_Vorlage/${vorlage}` : `${date}${group ? '/' + group : ''}${unter ? '/' + unter : ''}`;
        await window.__save(`${dir}/${fd.get('filename')}`, await b64(file));
        return json({ success: true, filename: fd.get('filename') });
      }
      if (u.pathname === '/export-status') {
        await window.__save('_status.json', btoa(unescape(encodeURIComponent(init.body))));
        return json({ success: true });
      }
      window.__log('BLOCKIERT ' + method + ' ' + u.pathname);
      return json({ error: 'trockenlauf' });
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
  const t0 = Date.now();
  await pg.goto(`http://localhost:3002/layout-editor.html?autoexport=1&nocache=${Date.now()}`, { waitUntil: 'domcontentloaded' });
  await pg.waitForFunction(() => window._autoExportDone === true || window._autoExportError != null, { polling: 2000 });
  const err = await pg.evaluate(() => window._autoExportError);
  console.log(`fertig in ${Math.round((Date.now() - t0) / 1000)} s, ${n} Dateien${err ? ', FEHLER: ' + err : ''}`);
  await b.close();
})().catch(e => { console.error('ABBRUCH', e.message); process.exit(1); });
