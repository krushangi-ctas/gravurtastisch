// API des Bereichs „Amazon": Verkaufsdaten und Produktverzeichnis lesen, Produkte gruppieren,
// Experimente (A/B-Journal) pflegen, Abruf anstoßen. Tageszahlen und Katalog (Titel, Bilder) schreibt nur
// ../abruf (Cron); hier wird ausschließlich in experiments, produkt_* und meta geschrieben. Die Auswertung
// (Zeiträume, Vergleich, Auffälligkeiten, Experiment-Urteile) rechnet der Browser (public/).
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const zlib = require('zlib');
const crypto = require('crypto');

const BASIS = path.join(__dirname, '..');
const ABRUF = path.join(BASIS, 'abruf');
const DB_DATEI = process.env.AMAZON_VERKAUF_DB || path.join(ABRUF, 'data', 'business.db');
const ENV_DATEI = path.join(BASIS, '.env');
const LOG_DATEI = path.join(ABRUF, 'data', 'fetch.log');
const LOCK_DATEI = path.join(ABRUF, 'data', 'fetch.lock');
const DATUM_RE = /^\d{4}-\d{2}-\d{2}$/;
const ASIN_RE = /^[A-Z0-9]{10}$/;
// Produkt-Gruppe: Amazons Eltern-ASIN (Standard) oder eine eigene aus dem Reiter „Produkte" (G1, G2 …)
const GRUPPE_RE = /^(?:[A-Z0-9]{10}|G\d+)$/;
// Was geändert wurde (alte Werte bleiben gültig)
const EBENEN = ['Titel', 'Hauptbild', 'Weitere Bilder/Video', 'Vorschaubilder (klein)', 'A+ Inhalt', 'Bullet Points', 'Beschreibung',
  'Personalisierung', 'Backend-Keywords', 'Preis', 'Coupon/Aktion', 'Variantenstruktur', 'PPC-Kampagne', 'Sonstiges'];
// Erhoffte Wirkung: Kennzahl + Richtung (+ optional Zielwert: Prozentpunkte bei Conversion, sonst Prozent)
const ZIELE = ['conversion', 'umsatz', 'sitzungen', 'einheiten', 'preis'];
// Ein Test umfasst die Varianten (Kind-ASINs) der gewählten Produkte — „alle Kugelschreiber" sind gut 100
const MAX_TEST_ASINS = 500;

// Rollen: „entwickler" = Inhaber (alles), „freelancer" = sieht Verkäufe + Experimente, trägt eigene
// Experimente ein, gruppiert keine Produkte und startet keinen Abruf. Andere Benutzer (gravur, zuschauer):
// kein Zugriff. Ohne Authorization-Kopf kommt die Anfrage nicht über nginx (Node lauscht nur auf
// 127.0.0.1) — das sind Tests/Werkzeuge auf dem Server selbst und gelten als Inhaber.
const ROLLEN = { entwickler: 'inhaber', freelancer: 'freelancer' };
function anmeldung(req, res, next) {
  const kopf = req.headers.authorization || '';
  const m = kopf.match(/^Basic\s+(.+)$/i);
  const benutzer = kopf ? (m ? Buffer.from(m[1], 'base64').toString('utf8').split(':')[0] : '') : 'server';
  const rolle = kopf ? ROLLEN[benutzer] : 'inhaber';
  if (!rolle) return res.status(403).json({ error: 'Kein Zugriff auf den Amazon-Bereich.' });
  req.amz = { benutzer, rolle };
  next();
}
const nurInhaber = (req, res, next) => (req.amz.rolle === 'inhaber' ? next() : res.status(403).json({ error: 'Nur für den Inhaber.' }));

// Eigene Tabellen und Spalten einmal beim Start ergänzen (die Tageszahlen-Tabellen legt ../abruf an)
function tabellenErgaenzen() {
  let db;
  try {
    db = oeffnen(true);
    if (!db) return;
    const da = new Set(db.prepare('PRAGMA table_info(experiments)').all().map(c => c.name));
    for (const [name, typ] of [['autor', 'TEXT'], ['ziel_kennzahl', 'TEXT'], ['ziel_richtung', 'TEXT'], ['ziel_wert', 'REAL'], ['begruendung', 'TEXT'], ['link', 'TEXT'], ['asins', 'TEXT']]) {
      if (!da.has(name)) db.exec(`ALTER TABLE experiments ADD COLUMN ${name} ${typ}`);
    }
    // Reiter „Produkte": eigene Namen je Gruppe; je Variante eine andere Gruppe als bei Amazon und/oder ausgeblendet
    db.exec(`CREATE TABLE IF NOT EXISTS produkt_gruppen (id TEXT PRIMARY KEY, name TEXT NOT NULL);
             CREATE TABLE IF NOT EXISTS produkt_zuordnung (asin TEXT PRIMARY KEY, gruppe TEXT, ausgeblendet INTEGER NOT NULL DEFAULT 0);`);
  } catch (e) { console.error('Amazon-Bereich: Tabellen', e.message); }
  finally { try { db?.close(); } catch {} }
}

function oeffnen(schreiben = false) {
  if (!fs.existsSync(DB_DATEI)) return null;
  const { DatabaseSync } = require('node:sqlite');
  // timeout: der Abruf schreibt evtl. gerade (ein Tag = eine kurze Transaktion)
  return new DatabaseSync(DB_DATEI, { readOnly: !schreiben, timeout: 5000 });
}
function mitDb(res, schreiben, fn) {
  let db;
  try {
    db = oeffnen(schreiben);
    if (!db) return res.status(404).json({ error: 'Noch keine Verkaufsdaten auf dem Server.' });
    return fn(db);
  } catch (e) {
    res.status(500).json({ error: e.message });
  } finally { try { db?.close(); } catch {} }
}
const hatTabelle = (db, name) => !!db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = ?").get(name);

function letzteLogZeilen(n) {
  try {
    const fd = fs.openSync(LOG_DATEI, 'r');
    const groesse = fs.fstatSync(fd).size, len = Math.min(groesse, 8192), buf = Buffer.alloc(len);
    fs.readSync(fd, buf, 0, len, groesse - len);
    fs.closeSync(fd);
    return buf.toString('utf8').split('\n').filter(Boolean).slice(-n);
  } catch { return []; }
}
// fetch.py hält während des Laufs eine flock-Sperre auf fetch.lock
function abrufLaeuft() {
  if (!fs.existsSync(LOCK_DATEI)) return false;
  return spawnSync('flock', ['-n', LOCK_DATEI, 'true']).status !== 0;
}

const text = (v, max = 200) => (v == null ? '' : String(v)).trim().slice(0, max);

// Große Antworten gezippt (JSON aus Zahlenreihen schrumpft ~10×; nginx komprimiert hier nichts) und mit
// ETag: Die Daten ändern sich nur, wenn jemand die Datenbank schreibt — fragt der Browser mit bekanntem
// ETag nach, gibt es 304 ohne Inhalt und ohne Datenbankabfrage.
function datenStand() {
  try { return Math.round(fs.statSync(DB_DATEI).mtimeMs).toString(36); } catch { return '0'; }
}
function jsonSenden(req, res, obj, etag) {
  res.set('Cache-Control', 'no-cache');
  if (etag) res.set('ETag', etag);
  const roh = Buffer.from(JSON.stringify(obj));
  if (roh.length > 4096 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
    res.set({ 'Content-Type': 'application/json; charset=utf-8', 'Content-Encoding': 'gzip', Vary: 'Accept-Encoding' });
    return res.end(zlib.gzipSync(roh, { level: 6 }));
  }
  res.type('json').end(roh);
}

// Produktbilder: zuerst Amazons Hauptbild aus dem Katalog (Tabelle katalog, ../abruf/katalog.py — braucht die
// SP-API-Rolle „Product Listing"). Rückfall: Printomations ASIN-Profile kennen das Vorschaubild der
// Personalisierung aus jeder Bestellung (werte → erster PreviewContainerCustomization → häufigstes Bild).
// Amazon liefert beide per Größen-Zusatz („._SX160_") verkleinert.
const PROFIL_ORDNER = process.env.ASIN_PROFIL_ORDNER || '/var/www/printomation/printomation/src/asin-profile';
const verkleinert = (url, px) => (/^https:\/\/m\.media-amazon\.com\/.+\.(jpe?g|png)$/i.test(url || '') ? url.replace(/(\._[^/]*_)?\.(jpe?g|png)$/i, `._SX${px}_.$2`) : '');
// Variantennamen: Printomations Layouts tragen je ASIN einen Namen, den alle kennen („K01_Blau_M10",
// „F02_Schw_V1") — viel sprechender als SKU oder ASIN. Nur lesen, alle 10 min neu.
const LAYOUT_DATEI = process.env.LAYOUT_DATEI || '/var/www/printomation/printomation/src/daten/layouts.json';
let _varianten = { zeit: 0, mtime: 0, map: new Map() };
function variantenNamen() {
  if (Date.now() - _varianten.zeit < 10 * 60 * 1000) return _varianten.map;
  try {
    const mtime = fs.statSync(LAYOUT_DATEI).mtimeMs;
    if (mtime !== _varianten.mtime) {
      const map = new Map();
      for (const l of JSON.parse(fs.readFileSync(LAYOUT_DATEI, 'utf8'))) {
        if (l && ASIN_RE.test(l.globalAsin || '') && l.name) map.set(l.globalAsin, map.has(l.globalAsin) ? map.get(l.globalAsin) + ', ' + l.name : String(l.name));
      }
      _varianten = { zeit: Date.now(), mtime, map };
    } else _varianten.zeit = Date.now();
  } catch { _varianten.zeit = Date.now(); }
  return _varianten.map;
}
let _vorschau = { zeit: 0, map: new Map(), stand: '0' };
function vorschauBilder() {
  if (Date.now() - _vorschau.zeit < 10 * 60 * 1000) return _vorschau.map;
  const map = new Map();
  try {
    for (const f of fs.readdirSync(PROFIL_ORDNER)) {
      if (!/^[A-Z0-9]{10}\.json$/.test(f)) continue;
      try {
        const p = JSON.parse(fs.readFileSync(path.join(PROFIL_ORDNER, f), 'utf8'));
        const knoten = Object.values(p.werte || {}).find(v => v && v.typ === 'PreviewContainerCustomization' && v.bilder);
        if (!knoten) continue;
        const [url] = Object.entries(knoten.bilder).sort((a, b) => (b[1]?.n || 0) - (a[1]?.n || 0))[0] || [];
        if (verkleinert(url, 80)) map.set(p.asin, verkleinert(url, 80));
      } catch {}
    }
  } catch {}
  // stand: ändert sich nur, wenn sich ein Bild ändert — Teil des ETags von /produkte
  _vorschau = { zeit: Date.now(), map, stand: crypto.createHash('sha1').update(JSON.stringify([...map])).digest('hex').slice(0, 8) };
  return map;
}

// Aus den Tageszeilen: erster/letzter Tag mit Besuchen je ASIN und welche ASINs je Eltern-ASIN waren
// (Familien ändern sich: FL04 und FL05 hängen seit 18.10. an einer neuen Eltern-ASIN). Neu nur bei neuem Datenstand.
let _verlauf = { stand: '' };
function verlauf(db) {
  const stand = datenStand();
  if (_verlauf.stand === stand) return _verlauf;
  const spanne = new Map(db.prepare(`SELECT child_asin a, MIN(date) von, MAX(date) bis FROM asin_daily
                                     WHERE sessions > 0 OR units_ordered > 0 GROUP BY child_asin`).all().map(r => [r.a, [r.von, r.bis]]));
  const kinderVon = new Map();
  for (const r of db.prepare('SELECT DISTINCT parent_asin p, child_asin c FROM asin_daily WHERE parent_asin IS NOT NULL AND parent_asin <> child_asin').all()) {
    if (!kinderVon.has(r.p)) kinderVon.set(r.p, new Set());
    kinderVon.get(r.p).add(r.c);
  }
  return (_verlauf = { stand, spanne, kinderVon });
}

module.exports = function verkaeufeRouter({ express, asinTitel }) {
  const router = express.Router();
  tabellenErgaenzen();
  router.use(anmeldung);
  router.use(express.json({ limit: '1mb' }));

  router.get('/stand', (req, res) => {
    const stand = { db: false, zugang: fs.existsSync(ENV_DATEI), laeuft: abrufLaeuft(), log: letzteLogZeilen(4),
      benutzer: req.amz.benutzer, rolle: req.amz.rolle };
    let db;
    try {
      db = oeffnen();
      if (db) {
        const r = db.prepare('SELECT MIN(date) von, MAX(date) bis FROM asin_daily').get();
        const t = db.prepare(`SELECT SUM(status='ok') ok, SUM(status='empty') leer, SUM(status='error') fehler,
                                     MAX(fetched_at) letzterAbruf FROM fetch_log`).get();
        Object.assign(stand, { db: true, von: r.von, bis: r.bis, ok: t.ok || 0, leer: t.leer || 0,
          fehler: t.fehler || 0, letzterAbruf: t.letzterAbruf });
      }
      res.json(stand);
    } catch (e) {
      res.status(500).json({ ...stand, error: e.message });
    } finally { try { db?.close(); } catch {} }
  });

  // Produktverzeichnis: jede ASIN mit Eltern-ASIN, Titel, Bild, Variantenname, Gruppe/ausgeblendet (Reiter
  // „Produkte"), erstem/letztem Tag mit Besuchen, „Übersichtsseite" (= Eltern-ASIN, selbst nicht kaufbar) und
  // Farbe/Größe aus dem Katalog. Dazu die eigenen Gruppennamen und Titel/Bild von Eltern-ASINs ohne eigene Zeile.
  router.get('/produkte', (req, res) => {
    vorschauBilder(); variantenNamen();   // frischen höchstens alle 10 min auf; danach stehen die Stände fest
    const etag = `"p${datenStand()}-b${_vorschau.stand}-v${Math.round(_varianten.mtime).toString(36)}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    mitDb(res, false, db => {
      const profilTitel = asinTitel(), vorschau = vorschauBilder(), varianten = variantenNamen(), { spanne, kinderVon } = verlauf(db);
      const katalog = new Map(hatTabelle(db, 'katalog') ? db.prepare('SELECT asin, titel, bild, farbe, groesse FROM katalog').all().map(k => [k.asin, k]) : []);
      const zuordnung = new Map(db.prepare('SELECT asin, gruppe, ausgeblendet FROM produkt_zuordnung').all().map(z => [z.asin, z]));
      const produkte = db.prepare('SELECT child_asin asin, parent_asin parent, sku, title FROM products').all();
      // Umgezogene Familien: hängt die Mehrheit der früheren Varianten einer Eltern-ASIN heute an einer anderen,
      // folgen ihr die übrigen (products kennt nur die Eltern-ASIN des letzten Tages mit Besuchen — eine Variante
      // ohne Besuche seit dem Umzug stünde sonst allein in der alten Familie) und die alte Übersichtsseite.
      const elternVon = new Map(produkte.map(p => [p.asin, p.parent || p.asin]));
      const ersetzt = new Map();
      for (const [alt, kinder] of kinderVon) {
        const n = new Map();
        for (const k of kinder) { const p = elternVon.get(k); if (p) n.set(p, (n.get(p) || 0) + 1); }
        const [ziel, anzahl] = [...n].sort((a, b) => b[1] - a[1])[0] || [];
        if (ziel && ziel !== alt && anzahl > (n.get(alt) || 0)) ersetzt.set(alt, ziel);
      }
      const heutige = a => { for (let i = 0; i < 5 && ersetzt.has(a); i++) a = ersetzt.get(a); return a; };
      for (const [a, p] of elternVon) elternVon.set(a, heutige(p));
      // Abgehängte Variante: steht heute allein (Eltern-ASIN = sie selbst), lief aber früher in einer Familie →
      // bleibt dort (sonst ein namenloses Einzelprodukt, z. B. ein FL02-Ableger ohne Titel und Layout)
      const frueher = new Map();
      for (const [p, kinder] of kinderVon) for (const k of kinder) if (!frueher.has(k)) frueher.set(k, p);
      for (const [a, p] of elternVon) if (p === a && !kinderVon.has(a) && frueher.has(a)) elternVon.set(a, heutige(frueher.get(a)));
      const bild = asin => verkleinert(katalog.get(asin)?.bild, 160) || vorschau.get(asin) || '';
      const zeilen = produkte.map(p => {
        const k = katalog.get(p.asin) || {}, z = zuordnung.get(p.asin) || {}, s = spanne.get(p.asin) || [];
        return [p.asin, elternVon.get(p.asin), p.sku || '', p.title || k.titel || profilTitel.get(p.asin) || '', bild(p.asin),
          varianten.get(p.asin) || '', z.gruppe || '', z.ausgeblendet ? 1 : 0, s[0] || '', s[1] || '', kinderVon.has(p.asin) ? 1 : 0,
          k.farbe || '', k.groesse || ''];
      });
      const familien = [...new Set(elternVon.values())].filter(a => !elternVon.has(a))
        .map(a => [a, katalog.get(a)?.titel || '', bild(a)]);
      const gruppen = db.prepare('SELECT id, name FROM produkt_gruppen').all().map(g => [g.id, g.name]);
      jsonSenden(req, res, { produkte: zeilen, familien, gruppen }, etag);
    });
  });

  // Varianten einem anderen Produkt zuordnen (gruppe: Gruppen-ID, null = wie bei Amazon; neueGruppe: Name →
  // neue Gruppe anlegen) und/oder aus-/einblenden. Ausgeblendete zählen in Summen weiter mit, stehen aber in
  // keiner Liste und nicht in der Variantenzahl.
  router.put('/produkte/zuordnung', nurInhaber, (req, res) => {
    const b = req.body || {}, asins = Array.isArray(b.asins) ? [...new Set(b.asins.map(String))] : [];
    if (!asins.length || asins.length > MAX_TEST_ASINS || !asins.every(a => ASIN_RE.test(a))) return res.status(400).json({ error: 'Bitte Varianten wählen.' });
    const neuName = text(b.neueGruppe, 80);
    if (b.neueGruppe !== undefined && !neuName) return res.status(400).json({ error: 'Bitte einen Namen für das neue Produkt angeben.' });
    if (b.gruppe != null && !GRUPPE_RE.test(b.gruppe)) return res.status(400).json({ error: 'Produkt unbekannt.' });
    if (b.gruppe === undefined && b.neueGruppe === undefined && b.ausgeblendet === undefined) return res.status(400).json({ error: 'Nichts zu ändern.' });
    mitDb(res, true, db => {
      db.exec('BEGIN');
      try {
        let gruppe = b.gruppe;
        if (neuName) {
          const n = db.prepare("SELECT MAX(CAST(SUBSTR(id, 2) AS INTEGER)) n FROM produkt_gruppen WHERE id LIKE 'G%'").get().n || 0;
          gruppe = 'G' + (n + 1);
          db.prepare('INSERT INTO produkt_gruppen (id, name) VALUES (?, ?)').run(gruppe, neuName);
        }
        const anlegen = db.prepare('INSERT INTO produkt_zuordnung (asin) VALUES (?) ON CONFLICT(asin) DO NOTHING');
        const setzeGruppe = db.prepare('UPDATE produkt_zuordnung SET gruppe = ? WHERE asin = ?');
        const setzeAus = db.prepare('UPDATE produkt_zuordnung SET ausgeblendet = ? WHERE asin = ?');
        for (const a of asins) {
          anlegen.run(a);
          if (gruppe !== undefined) setzeGruppe.run(gruppe || null, a);
          if (b.ausgeblendet !== undefined) setzeAus.run(b.ausgeblendet ? 1 : 0, a);
        }
        // Aufräumen: Zeilen ohne Abweichung von Amazon, eigene Gruppen ohne Varianten
        db.exec(`DELETE FROM produkt_zuordnung WHERE gruppe IS NULL AND ausgeblendet = 0;
                 DELETE FROM produkt_gruppen WHERE id LIKE 'G%' AND id NOT IN (SELECT gruppe FROM produkt_zuordnung WHERE gruppe IS NOT NULL);`);
        db.exec('COMMIT');
        res.json({ ok: true, gruppe: gruppe || null });
      } catch (e) { db.exec('ROLLBACK'); throw e; }
    });
  });

  // Produkt umbenennen (leerer Name = wieder automatisch aus dem Amazon-Titel)
  router.put('/produkte/gruppen/:id', nurInhaber, (req, res) => {
    const id = String(req.params.id), name = text((req.body || {}).name, 80);
    if (!GRUPPE_RE.test(id)) return res.status(400).json({ error: 'Produkt unbekannt.' });
    mitDb(res, true, db => {
      if (name) db.prepare('INSERT INTO produkt_gruppen (id, name) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET name = excluded.name').run(id, name);
      else if (id.startsWith('G')) return res.status(400).json({ error: 'Eigene Produkte brauchen einen Namen.' });
      else db.prepare('DELETE FROM produkt_gruppen WHERE id = ?').run(id);
      res.json({ ok: true });
    });
  });

  // Tageszeilen von..bis, kompakt als Arrays. Namen, Bilder, Gruppen: /produkte
  router.get('/daten', (req, res) => {
    const { von, bis } = req.query;
    if (!DATUM_RE.test(von || '') || !DATUM_RE.test(bis || '')) return res.status(400).json({ error: 'von/bis im Format JJJJ-MM-TT erwartet.' });
    const etag = `"d${datenStand()}-${von}-${bis}"`;
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    mitDb(res, false, db => {
      const idx = new Map(), liste = [];
      const nr = a => { if (!idx.has(a)) { idx.set(a, liste.length); liste.push(a); } return idx.get(a); };
      const zeilen = db.prepare(`SELECT date, child_asin, sessions, sessions_b2b, page_views, units_ordered, units_ordered_b2b,
                                        sales_eur, sales_b2b_eur, buy_box_pct
                                 FROM asin_daily WHERE date BETWEEN ? AND ? ORDER BY date`).all(von, bis)
        .map(z => [z.date, nr(z.child_asin), z.sessions, z.sessions_b2b, z.page_views,
          z.units_ordered, z.units_ordered_b2b, z.sales_eur, z.sales_b2b_eur, z.buy_box_pct]);
      const konto = db.prepare(`SELECT date, sessions, units_ordered, sales_eur, buy_box_pct FROM account_daily
                                WHERE date BETWEEN ? AND ? ORDER BY date`).all(von, bis)
        .map(k => [k.date, k.sessions, k.units_ordered, k.sales_eur, k.buy_box_pct]);
      jsonSenden(req, res, { asins: liste, zeilen, konto }, etag);
    });
  });

  // ── Experimente (A/B-Journal) und ignorierte Preisvorschläge ──
  const EXP_SPALTEN = `id, child_asin, change_type, start_date, end_date, old_value, new_value, note, status, created_at,
                       autor, ziel_kennzahl, ziel_richtung, ziel_wert, begruendung, link, asins`;
  router.get('/experimente', (req, res) => mitDb(res, false, db => {
    const experimente = db.prepare(`SELECT ${EXP_SPALTEN} FROM experiments ORDER BY start_date DESC, id DESC`).all();
    const ign = db.prepare("SELECT value FROM meta WHERE key = 'dismissed_price_suggestions'").get();
    res.set('Cache-Control', 'no-store').json({ experimente, ignoriert: ign ? JSON.parse(ign.value || '[]') : [], ebenen: EBENEN,
      benutzer: req.amz.benutzer, rolle: req.amz.rolle });
  }));

  const link = v => { const t = text(v, 500); return /^https?:\/\/\S+$/i.test(t) ? t : ''; };
  // Zielwert: leer = keiner (null), sonst eine Zahl größer 0 — undefined = ungültig
  const zielwert = v => { const z = v === '' || v == null ? null : +v; return z == null || (z > 0 && z < 1000) ? z : undefined; };
  // Varianten (Kind-ASINs) eines Tests — fest beim Speichern, damit spätere Umbauten der Familien bei Amazon
  // die Messung nicht verschieben. Fehlt die Liste, gilt child_asin allein (ältere Einträge).
  const produktListe = b => {
    const liste = Array.isArray(b.asins) ? [...new Set(b.asins.map(String))] : (b.child_asin ? [String(b.child_asin)] : []);
    return liste.length && liste.length <= MAX_TEST_ASINS && liste.every(a => ASIN_RE.test(a)) ? liste : null;
  };
  router.post('/experimente', (req, res) => {
    const b = req.body || {}, produkte = produktListe(b);
    if (!produkte) return res.status(400).json({ error: 'Bitte mindestens ein Produkt wählen.' });
    if (!EBENEN.includes(b.change_type)) return res.status(400).json({ error: 'Bitte wählen, was geändert wurde.' });
    if (!DATUM_RE.test(b.start_date || '')) return res.status(400).json({ error: 'Bitte das Datum der Änderung angeben.' });
    if (b.end_date && (!DATUM_RE.test(b.end_date) || b.end_date < b.start_date)) return res.status(400).json({ error: 'Das Testende liegt vor dem Start.' });
    if (!ZIELE.includes(b.ziel_kennzahl) || !['hoch', 'runter'].includes(b.ziel_richtung)) return res.status(400).json({ error: 'Bitte angeben, was sich verbessern soll.' });
    const zielWert = zielwert(b.ziel_wert);
    if (zielWert === undefined) return res.status(400).json({ error: 'Zielwert: eine Zahl größer 0.' });
    mitDb(res, true, db => {
      const r = db.prepare(`INSERT INTO experiments (child_asin, change_type, start_date, end_date, old_value, new_value, note, status, created_at,
                                                     autor, ziel_kennzahl, ziel_richtung, ziel_wert, begruendung, link, asins)
                            VALUES (?,?,?,?,?,?,?,'laufend',?,?,?,?,?,?,?,?)`).run(produkte[0], b.change_type, b.start_date, b.end_date || null,
        text(b.old_value, 300), text(b.new_value, 300), text(b.note, 1000), new Date().toISOString().slice(0, 19) + '+00:00',
        req.amz.benutzer, b.ziel_kennzahl, b.ziel_richtung, zielWert, text(b.begruendung, 500), link(b.link), produkte.join(','));
      res.json({ ok: true, id: Number(r.lastInsertRowid) });
    });
  });

  // Ändern/Löschen: der Inhaber alles, der Freelancer nur seine eigenen Einträge. Solange ein Test läuft, ist
  // alles änderbar (auch die erhoffte Wirkung); nach „Test beenden" nur noch Notiz, Link und Wiedereröffnen.
  function eigenes(db, req, id) {
    const e = db.prepare('SELECT autor, status FROM experiments WHERE id = ?').get(id);
    if (!e) return { fehler: 'Experiment nicht gefunden.' };
    if (req.amz.rolle !== 'inhaber' && e.autor !== req.amz.benutzer) return { fehler: 'Nur eigene Experimente können geändert werden.' };
    return { e };
  }
  router.patch('/experimente/:id', (req, res) => {
    const id = parseInt(req.params.id, 10), b = req.body || {}, sets = [], werte = [];
    const setze = (spalte, wert) => { sets.push(`${spalte} = ?`); werte.push(wert); };
    const nurLaufend = ['child_asin', 'asins', 'change_type', 'start_date', 'ziel_kennzahl', 'ziel_richtung', 'ziel_wert', 'old_value', 'new_value', 'begruendung'];
    if (b.status !== undefined) { if (!['laufend', 'abgeschlossen'].includes(b.status)) return res.status(400).json({ error: 'Status unbekannt.' }); setze('status', b.status); }
    if (b.end_date !== undefined) { if (b.end_date !== null && !DATUM_RE.test(b.end_date)) return res.status(400).json({ error: 'Datum ungültig.' }); setze('end_date', b.end_date); }
    if (b.asins !== undefined || b.child_asin !== undefined) {
      const produkte = produktListe(b);
      if (!produkte) return res.status(400).json({ error: 'Bitte mindestens ein Produkt wählen.' });
      setze('child_asin', produkte[0]); setze('asins', produkte.join(','));
    }
    if (b.change_type !== undefined) { if (!EBENEN.includes(b.change_type)) return res.status(400).json({ error: 'Ebene unbekannt.' }); setze('change_type', b.change_type); }
    if (b.start_date !== undefined) { if (!DATUM_RE.test(b.start_date)) return res.status(400).json({ error: 'Datum ungültig.' }); setze('start_date', b.start_date); }
    if (b.ziel_kennzahl !== undefined) { if (!ZIELE.includes(b.ziel_kennzahl)) return res.status(400).json({ error: 'Kennzahl unbekannt.' }); setze('ziel_kennzahl', b.ziel_kennzahl); }
    if (b.ziel_richtung !== undefined) { if (!['hoch', 'runter'].includes(b.ziel_richtung)) return res.status(400).json({ error: 'Richtung unbekannt.' }); setze('ziel_richtung', b.ziel_richtung); }
    if (b.ziel_wert !== undefined) {
      const z = zielwert(b.ziel_wert);
      if (z === undefined) return res.status(400).json({ error: 'Zielwert: eine Zahl größer 0.' });
      setze('ziel_wert', z);
    }
    for (const f of ['old_value', 'new_value', 'note', 'begruendung']) if (b[f] !== undefined) setze(f, text(b[f], f === 'note' ? 1000 : f === 'begruendung' ? 500 : 300));
    if (b.link !== undefined) setze('link', link(b.link));
    if (!id || !sets.length) return res.status(400).json({ error: 'Nichts zu ändern.' });
    mitDb(res, true, db => {
      const { fehler, e } = eigenes(db, req, id);
      if (fehler) return res.status(403).json({ error: fehler });
      const wirdLaufend = b.status === 'laufend';
      if (e.status !== 'laufend' && !wirdLaufend && nurLaufend.some(f => b[f] !== undefined)) return res.status(409).json({ error: 'Der Test ist beendet — zum Ändern erst wieder öffnen.' });
      const r = db.prepare(`UPDATE experiments SET ${sets.join(', ')} WHERE id = ?`).run(...werte, id);
      res.json({ ok: r.changes === 1 });
    });
  });

  router.delete('/experimente/:id', (req, res) => mitDb(res, true, db => {
    const id = parseInt(req.params.id, 10) || 0, { fehler } = eigenes(db, req, id);
    if (fehler) return res.status(403).json({ error: fehler });
    const r = db.prepare('DELETE FROM experiments WHERE id = ?').run(id);
    res.json({ ok: r.changes === 1 });
  }));

  // Erkannter Preissprung „<Produkt>:<Tag>" soll nicht mehr als Vorschlag erscheinen
  router.post('/preisvorschlag-ignorieren', (req, res) => {
    const key = String((req.body || {}).key || '');
    if (!/^(?:[A-Z0-9]{10}|G\d+):\d{4}-\d{2}-\d{2}$/.test(key)) return res.status(400).json({ error: 'Ungültig.' });
    mitDb(res, true, db => {
      const alt = db.prepare("SELECT value FROM meta WHERE key = 'dismissed_price_suggestions'").get();
      const liste = new Set(alt ? JSON.parse(alt.value || '[]') : []);
      liste.add(key);
      db.prepare("INSERT OR REPLACE INTO meta (key, value) VALUES ('dismissed_price_suggestions', ?)").run(JSON.stringify([...liste].sort()));
      res.json({ ok: true });
    });
  });

  // „Jetzt von Amazon holen": kurzer Abruf (höchstens 10 Tage) im Hintergrund
  router.post('/abruf', nurInhaber, (req, res) => {
    if (!fs.existsSync(ENV_DATEI)) return res.status(409).json({ error: 'Zugangsdaten (.env) fehlen.' });
    if (abrufLaeuft()) return res.json({ ok: true, laeuft: true });
    const p = spawn('bash', [path.join(ABRUF, 'abruf.sh'), '--kurz'], { cwd: ABRUF, detached: true, stdio: 'ignore' });
    p.unref();
    res.json({ ok: true, laeuft: true });
  });

  return router;
};
