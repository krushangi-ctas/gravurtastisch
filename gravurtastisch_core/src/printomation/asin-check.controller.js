// ── ASIN-Check: Personalisierungs-Struktur je Produkt ────────────────────────
// Amazon gibt die Personalisierungs-Vorlage eines Listings über die SP-API nicht heraus (nur
// Orders-Rolle, die Listings-API antwortet 403). Die Struktur steckt aber in jeder Bestell-JSON:
// Produktseiten mit Produktbild, Gravurzeilen, Bildflächen und Dropdowns samt Position und Größe.
// Dieses Modul lernt daraus je ASIN ein Profil — aus jedem Download, aus den Bestellordnern unter
// public/ und auf Knopfdruck aus älteren Bestellungen (Scan im amazon.controller).
// Eine Bestellung allein reicht nicht (Amazon lässt Ungefülltes weg) — deshalb hebt das Profil die
// verschiedenen FORMEN auf und zählt je Knoten mit (wie oft gefüllt, Dropdown-Werte, Schriften).
// KEINE Kundendaten im Profil (keine Texte, Fotos, Dateinamen). Ablage außerhalb von public/.
// [EN] ── ASIN Check: Customization structure per product ─────────────────────
// Amazon does not expose the customization template of a listing via the SP-API (only
// Orders role; the Listings API returns 403). However, the structure is embedded in each order JSON:
// product pages with product image, engraving lines, image areas, and dropdowns with position and size.
// This module learns a profile per ASIN from these — from each download, from order folders under
// public/, and on-demand from older orders (scan in amazon.controller).
// A single order is not enough (Amazon omits empty fields) — therefore the profile preserves
// distinct FORMS and counts per node (frequency filled, dropdown values, fonts).
// NO customer data in the profile (no text, photos, filenames). Stored outside public/.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { writeJsonAtomic, readJsonSafe, entferneAeltere } = require('./utils/json-file');
const { artikelJsonName } = require('./read-orders.controller');
const { createLogger } = require('./utils/logger');
const logger = createLogger('index.log', __filename);

const DIR = path.join(__dirname, 'asin-profile');
// orderId → { a: [ASINs mit Personalisierung], t: Zeitpunkt } — damit ein Scan Bestellungen
// überspringt, deren ASINs schon bekannt sind. Jede geprüfte Bestellung macht jeden
// späteren Check (auch für andere ASINs) schneller.
// [EN] orderId → { a: [ASINs with customization], t: timestamp } — so a scan skips orders
// whose ASINs are already known. Every verified order speeds up any subsequent check
// (including for other ASINs).
const INDEX_FILE = path.join(DIR, '_bestellungen.json');
const INDEX_TTL_TAGE = 100;       // Ledger hält 90 Tage, etwas Luft darüber / [EN] Ledger holds 90 days, with some buffer above
const MAX_POSTEN = 400;           // gemerkte Bestellpositionen je ASIN (Dublettenschutz) / [EN] remembered order items per ASIN (duplicate protection)
const MAX_FORMEN = 12;            // verschiedene Strukturen je ASIN, älteste fliegt / [EN] distinct structures per ASIN, oldest is discarded
const ASIN_RE = /^[A-Z0-9]{10}$/;

if (!fs.existsSync(DIR)) fs.mkdirSync(DIR, { recursive: true });

const _profile = new Map();       // asin → Profil (einmal gelesen, im Speicher gehalten) / [EN] asin → profile (read once, cached in memory)
const _dirty = new Set();
let _index = null;
let _indexDirty = false;

const _datei = (asin) => path.join(DIR, `${asin}.json`);

function _profil(asin, anlegen) {
  if (_profile.has(asin)) return _profile.get(asin);
  let p = readJsonSafe(_datei(asin), null,
    e => logger.warn(`ASIN-Profil ${asin} unlesbar, beginne neu:`, e.message));
  if (!p && !anlegen) return null;
  if (!p) {
    p = { asin, titel: '', bestellungen: 0, positionen: 0, erste: null, letzte: null, aktualisiert: null,
          posten: [], bestellIds: [], formen: [], werte: {} };
  }
  _profile.set(asin, p);
  return p;
}

function _ladeIndex() {
  if (_index) return _index;
  const roh = readJsonSafe(INDEX_FILE, {}, e => logger.warn('ASIN-Index unlesbar, beginne neu:', e.message)) || {};
  if (entferneAeltere(roh, INDEX_TTL_TAGE, e => e && e.t)) _indexDirty = true;
  _index = roh;
  return _index;
}

// ── Struktur ohne Werte + Beobachtungen je Knoten ────────────────────────────
// Jeder Knoten bekommt einen stabilen Schlüssel aus seinem Pfad (Typ|Name|Etikett je Ebene,
// bei gleichnamigen Geschwistern mit #n). Über diesen Schlüssel finden Statistik, Formen und
// die Gravur-Nummerierung im Editor denselben Knoten wieder.
// [EN] ── Structure without values + observations per node ────────────────────
// Each node receives a stable key derived from its path (Type|Name|Label per level,
// with #n for sibling nodes sharing the same name). Using this key, statistics, forms, and
// engraving numbering in the Editor locate the same node reliably.
function _zerlege(wurzel) {
  const beob = [];
  const knoten = (n, elternK, geschwister) => {
    const sig = `${n.type || '?'}|${n.name || ''}|${n.label || ''}`;
    const nr = geschwister[sig] = (geschwister[sig] || 0) + 1;
    const k = `${elternK}/${sig}${nr > 1 ? '#' + nr : ''}`;
    // Feste Reihenfolge der Eigenschaften: der Hash vergleicht den serialisierten Baum.
    // [EN] Fixed property order: hash compares the serialized tree.
    const aus = { k, type: n.type || '', name: n.name || '', label: n.label || '' };
    if (n.type === 'PreviewContainerCustomization' && n.snapshot && n.snapshot.dimension) {
      // Koordinatensystem der Platzierungen: dieselben 400×400 wie Amazons Vorschaubild.
      // [EN] Coordinate system of placements: identical 400x400 as Amazon's preview image.
      aus.raster = { w: n.snapshot.dimension.width, h: n.snapshot.dimension.height };
    }
    if (n.type === 'PlacementContainerCustomization') {
      if (n.dimension) aus.dimension = { width: n.dimension.width, height: n.dimension.height };
      if (n.position) aus.position = { x: n.position.x, y: n.position.y };
    }
    const b = { k, typ: n.type };
    if (n.type === 'TextCustomization') {
      const v = String(n.inputValue || n.value || '');
      b.gefuellt = v.trim() !== '';
      b.laenge = v.trim().length;
      b.mehrzeilig = /\n/.test(v.trim());
    } else if (n.type === 'ImageCustomization') {
      const name = n.image && n.image.imageName;
      b.hochgeladen = !!name;
      if (name) b.endung = (path.extname(name).slice(1) || '?').toLowerCase();
    } else if (n.type === 'OptionCustomization') {
      const o = n.optionSelection || {};
      b.wert = o.label || o.name || n.displayValue || '';
    } else if (n.type === 'FontCustomization') {
      b.schrift = (n.fontSelection && n.fontSelection.family) || '';
    } else if (n.type === 'ColorCustomization') {
      const c = n.colorSelection || {};
      b.farbe = c.value ? `${c.name || ''}|${c.value}` : '';
    } else if (n.type === 'PreviewContainerCustomization' && n.baseImage && n.baseImage.imageUrl) {
      const d = n.baseImage.dimension || {};
      b.bild = { url: n.baseImage.imageUrl, w: d.width || null, h: d.height || null };
    }
    beob.push(b);
    const kinder = Array.isArray(n.children) ? n.children.filter(c => c && typeof c === 'object') : [];
    if (kinder.length) {
      const g = {};
      aus.children = kinder.map(c => knoten(c, k, g));
    }
    return aus;
  };
  const baum = knoten(wurzel, '', {});
  return { baum, beob };
}

function _zaehle(obj, schluessel) {
  if (!schluessel) return;
  obj[schluessel] = (obj[schluessel] || 0) + 1;
}

// Eine Bestellposition ins Profil ihrer ASIN aufnehmen. Rückgabe true = neu aufgenommen,
// false = schon bekannt oder unbrauchbar. Wirft nie — der Aufrufer ist der Download.
// [EN] Incorporate an order item into its ASIN profile. Return true = newly added,
// false = already known or unusable. Never throws — the caller is the downloader.
function mergeBestellung({ asin, titel, orderId, orderItemId, datum, customizationData }) {
  try {
    asin = String(asin || '').trim().toUpperCase();
    if (!ASIN_RE.test(asin) || !customizationData || typeof customizationData !== 'object') return false;
    const p = _profil(asin, true);
    const postenId = String(orderItemId || orderId || '');
    if (!postenId || p.posten.includes(postenId)) return false;

    const { baum, beob } = _zerlege(customizationData);
    const hash = crypto.createHash('sha1').update(JSON.stringify(baum)).digest('hex').slice(0, 16);
    const jetzt = new Date().toISOString();
    // erste/letzte = Bestelldatum (nicht Aufnahmezeit): daran erkennt der Editor, welche
    // Fassung eines Listings die aktuelle ist, wenn der Händler es umgebaut hat.
    // [EN] erste/letzte = order date (not time of recording): Editor uses this to identify
    // which version of a listing is current if the merchant has restructured it.
    const form = p.formen.find(f => f.hash === hash);
    if (form) {
      form.anzahl++;
      if (datum && (!form.erste || datum < form.erste)) form.erste = datum;
      if (datum && (!form.letzte || datum > form.letzte)) form.letzte = datum;
    } else {
      p.formen.push({ hash, anzahl: 1, erste: datum || null, letzte: datum || null, baum });
      if (p.formen.length > MAX_FORMEN) {
        p.formen.sort((a, b) => (b.letzte || '').localeCompare(a.letzte || ''));
        p.formen.length = MAX_FORMEN;
      }
    }

    for (const b of beob) {
      const w = p.werte[b.k] || (p.werte[b.k] = { typ: b.typ, gesehen: 0 });
      w.gesehen++;
      if (b.typ === 'TextCustomization') {
        if (b.gefuellt) w.gefuellt = (w.gefuellt || 0) + 1;
        w.maxLaenge = Math.max(w.maxLaenge || 0, b.laenge);
        if (b.mehrzeilig) w.mehrzeilig = (w.mehrzeilig || 0) + 1;
      } else if (b.typ === 'ImageCustomization') {
        if (b.hochgeladen) w.hochgeladen = (w.hochgeladen || 0) + 1;
        if (b.endung) _zaehle(w.endungen || (w.endungen = {}), b.endung);
      } else if (b.typ === 'OptionCustomization') {
        _zaehle(w.werte || (w.werte = {}), b.wert || '(leer)');
      } else if (b.typ === 'FontCustomization') {
        _zaehle(w.schriften || (w.schriften = {}), b.schrift);
      } else if (b.typ === 'ColorCustomization') {
        _zaehle(w.farben || (w.farben = {}), b.farbe);
      } else if (b.bild) {
        const bilder = w.bilder || (w.bilder = {});
        const e = bilder[b.bild.url] || (bilder[b.bild.url] = { n: 0, w: b.bild.w, h: b.bild.h });
        e.n++;
      }
    }

    p.posten.push(postenId);
    if (p.posten.length > MAX_POSTEN) p.posten.splice(0, p.posten.length - MAX_POSTEN);
    p.positionen++;
    // Bestellungen eindeutig zählen (mehrere Artikel derselben ASIN = eine Bestellung)
    // [EN] Count orders uniquely (multiple items of same ASIN = one order)
    if (!orderId) p.bestellungen++;
    else if (!p.bestellIds.includes(orderId)) {
      p.bestellungen++;
      p.bestellIds.push(orderId);
      if (p.bestellIds.length > MAX_POSTEN) p.bestellIds.splice(0, p.bestellIds.length - MAX_POSTEN);
    }
    if (titel) p.titel = String(titel);
    if (datum) {
      if (!p.erste || datum < p.erste) p.erste = datum;
      if (!p.letzte || datum > p.letzte) p.letzte = datum;
    }
    p.aktualisiert = jetzt;
    _dirty.add(asin);
    if (orderId) merkeAsins(orderId, [asin], datum);
    return true;
  } catch (e) {
    logger.warn(`ASIN-Profil ${asin}: Bestellung ${orderId} nicht aufgenommen:`, e.message);
    return false;
  }
}

// Welche ASINs (mit Personalisierung) eine Bestellung hat — ergänzt, nie ersetzt.
// [EN] Which ASINs (with customization) an order contains — appended, never replaced.
function merkeAsins(orderId, asins, datum) {
  const idx = _ladeIndex();
  const alt = idx[orderId];
  const a = new Set(alt ? alt.a : []);
  for (const x of asins || []) if (x) a.add(String(x).toUpperCase());
  const t = (alt && alt.t) || datum || new Date().toISOString();
  if (!alt || a.size !== alt.a.length) { idx[orderId] = { a: [...a], t }; _indexDirty = true; }
}

const bekannteAsins = (orderId) => { const e = _ladeIndex()[orderId]; return e ? e.a : null; };
const hatBestellung = (asin, orderId) => { const p = _profil(asin, false); return !!(p && p.bestellIds.includes(orderId)); };

// Geänderte Profile und den Index atomar schreiben. Aufgerufen an denselben Batch-Grenzen
// wie flushSession, dazu am Ende eines Scans.
// [EN] Atomically write modified profiles and the index. Invoked at the same batch boundaries
// as flushSession, plus at the end of a scan.
function flush() {
  for (const asin of _dirty) {
    try { writeJsonAtomic(_datei(asin), _profile.get(asin)); }
    catch (e) { logger.warn(`ASIN-Profil ${asin} nicht gespeichert:`, e.message); }
  }
  _dirty.clear();
  if (_indexDirty && _index) {
    try { writeJsonAtomic(INDEX_FILE, _index); _indexDirty = false; }
    catch (e) { logger.warn('ASIN-Index nicht gespeichert:', e.message); }
  }
}

// Bestellordner unter public/<Tag>/ nachtragen (idempotent über orderItemId). Die liegen nur
// wenige Tage — was dort liegt, braucht keinen einzigen Aufruf bei Amazon.
// [EN] Ingest order folders from public/<Tag>/ (idempotent via orderItemId). Stored for only
// a few days — whatever is present there requires zero Amazon API calls.
function lokalNachtragen() {
  const base = path.join(__dirname, 'public');
  let neu = 0;
  let tage = [];
  try { tage = fs.readdirSync(base).filter(t => /^\d{4}-\d{2}-\d{2}$/.test(t)); } catch (_) { return 0; }
  for (const tag of tage) {
    let bestellungen = [];
    try { bestellungen = fs.readdirSync(path.join(base, tag)); } catch (_) { continue; }
    for (const orderId of bestellungen) {
      const od = path.join(base, tag, orderId);
      let posten = [];
      try { posten = fs.readdirSync(od).filter(x => /^item-\d+$/.test(x)); } catch (_) { continue; }
      const asins = [];
      for (const it of posten) {
        try {
          const d = path.join(od, it);
          const meta = readJsonSafe(path.join(d, 'meta.json'), {}) || {};
          const jf = artikelJsonName(fs.readdirSync(d));
          if (!jf) continue;
          const j = JSON.parse(fs.readFileSync(path.join(d, jf), 'utf8'));
          const asin = meta.asin || j.asin;
          if (asin) asins.push(asin);
          if (mergeBestellung({ asin, titel: j.title, orderId, orderItemId: j.orderItemId,
                                datum: meta.purchaseDate || null, customizationData: j.customizationData })) neu++;
        } catch (_) { /* unlesbare Position überspringen */ }
      }
      if (asins.length) merkeAsins(orderId, asins, null);
    }
  }
  flush();
  if (neu) logger.log(`ASIN-Check: ${neu} Bestellposition(en) aus public/ in die Profile übernommen.`);
  return neu;
}

// Seitennamen einer Form — die Fassung eines Listings (Genaueres im Editor bei _seitenSig)
// [EN] Page names of a form — the specific version of a listing (details in Editor under _seitenSig)
function _seitenSig(baum) {
  const s = new Set();
  const walk = n => { if (n.type === 'PreviewContainerCustomization') s.add(n.name || ''); (n.children || []).forEach(walk); };
  walk(baum);
  return [...s].sort().join('\u0001');
}

// Kurzfassung aller Profile für die Liste im Editor. Die Zähler gelten für die AKTUELLE
// Fassung (die mit der jüngsten Bestellung) — nach einem Umbau des Listings stünden sonst
// alte und neue Gravurzeilen addiert da.
// [EN] Summary of all profiles for the list in Editor. Counts apply to the CURRENT
// version (with the most recent order) — otherwise, old and new engraving lines would be summed after restructuring.
function liste() {
  let dateien = [];
  try { dateien = fs.readdirSync(DIR).filter(f => /^[A-Z0-9]{10}\.json$/.test(f)); } catch (_) {}
  const out = [];
  for (const f of dateien) {
    const p = _profil(f.slice(0, 10), false);
    if (!p || !p.formen.length) continue;
    const sigs = p.formen.map(fm => _seitenSig(fm.baum));
    const neueste = p.formen.reduce((b, fm, i) => ((fm.letzte || '') > (p.formen[b].letzte || '') ? i : b), 0);
    const typen = new Map();
    const sammle = n => { typen.set(n.k, n.type); (n.children || []).forEach(sammle); };
    p.formen.forEach((fm, i) => { if (sigs[i] === sigs[neueste]) sammle(fm.baum); });
    let gravuren = 0, bilder = 0, auswahl = 0;
    for (const t of typen.values()) {
      if (t === 'TextCustomization') gravuren++;
      else if (t === 'ImageCustomization') bilder++;
      else if (t === 'OptionCustomization') auswahl++;
    }
    out.push({ asin: p.asin, titel: p.titel, bestellungen: p.bestellungen, erste: p.erste, letzte: p.letzte,
               aktualisiert: p.aktualisiert, gravuren, bilder, auswahl, fassungen: new Set(sigs).size });
  }
  return out.sort((a, b) => (b.letzte || '').localeCompare(a.letzte || '') || a.asin.localeCompare(b.asin));
}

// Vollständiges Profil ohne die internen Dublettenlisten
// [EN] Full profile without internal duplicate lists
function profil(asin) {
  const p = _profil(String(asin || '').toUpperCase(), false);
  if (!p) return null;
  const { posten, bestellIds, ...rest } = p;
  return rest;
}

module.exports = { mergeBestellung, merkeAsins, bekannteAsins, hatBestellung, flush, lokalNachtragen,
                   liste, profil, ASIN_RE };
