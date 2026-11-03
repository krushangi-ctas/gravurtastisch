// ── Bereich „Amazon" — Grundgerüst (eigener Ordner /var/www/printomation/amazon-bereich) ─────────
// Der Gravur-Editor lädt nur diese Datei (+ amazon.css). Sie hängt sich selbst ein: Umschalter
// Gravur|Amazon in die Kopfleiste, eigene Reiter in die Werkzeugspalte, eigene linke Spalte und
// eigene Bühne. Im Amazon-Bereich blendet amazon.css alles Gravur-Eigene nur AUS (body-Klasse) —
// Reiter, Auswahl und Blatt der Gravur bleiben unangetastet und sind beim Zurückschalten wie vorher.
// Seiten: verkaeufe.js, experimente.js, produkte.js, links.js (hier nachgeladen), englische Texte: texte.js.
// Gemeinsam: Sprache, Produktverzeichnis mit Gruppen, Laden der Tageszahlen, Datum/Zahlen, Statistik, Kacheln, Diagramm.

const AMZ_BASIS = '/amazon-bereich/';
const AMZ_API = '/amazon/verkaeufe';
const AMZ_FARBEN = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
const AMZ_SEITEN = {
  verkaeufe:   { name: 'Verkäufe',    titel: 'Verkäufe: Sitzungen, Conversion, Umsatz je Produkt', ikon: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>' },
  experimente: { name: 'Experimente', titel: 'Experimente: Änderungen erfassen und Wirkung messen (A/B)', ikon: '<path d="M9 3h6"/><path d="M10 3v6l-5 9a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-5-9V3"/><path d="M7.5 15h9"/>' },
  produkte:    { name: 'Produkte',    titel: 'Produkte: Varianten gruppieren, umbenennen, alte ausblenden', ikon: '<path d="M21 8l-9-5-9 5 9 5 9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>' },
  links:       { name: 'Links',       titel: 'Links: Amazon-Links zum Teilen (Produktlink, App-Link, Suche)', ikon: '<path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.5 1.5"/><path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.5-1.5"/>' },
  // unten in der Werkzeugspalte wie im Gravur-Editor: Anmeldung, Abmelden, Ansicht zurücksetzen
  einstellungen: { name: 'Einstellungen', titel: 'Einstellungen: Anmeldung und Abmelden', unten: true, ikon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>' },
};
// Kennzahlen in der Reihenfolge der Kacheln (Verkäufe und Experimente)
const AMZ_KENNZAHLEN = {
  sales:      { name: 'Umsatz',     lang: 'Umsatz',              einheit: ' €', dez: 0 },
  units:      { name: 'Einheiten',  lang: 'Bestellte Einheiten', einheit: '',   dez: 0 },
  sess:       { name: 'Sitzungen',  lang: 'Sitzungen (Besuche)', einheit: '',   dez: 0 },
  conversion: { name: 'Conversion', lang: 'Conversion',          einheit: ' %', dez: 2, hinweis: 'Conversion = bestellte Einheiten ÷ Sitzungen.' },
  price:      { name: 'Ø Preis',    lang: 'Ø Preis',             einheit: ' €', dez: 2, hinweis: 'Ø Preis = Umsatz ÷ bestellte Einheiten (nur Tage mit Verkäufen).' },
};

const _amz = {
  seite: 'verkaeufe', stand: null, katalog: null,
  ansicht: { v: 2, zeitraum: '30', vergleich: 'vorperiode', gran: 'tag', b2b: false, familien: true, kennzahl: 'sales',
             empfindlich: 'normal', art: '', sortListe: 'umsatz', kleinWeg: false },
};
// Gemerkte Ansicht nur übernehmen, wenn sie zur aktuellen Fassung (v) passt — und nur bekannte Felder
try {
  const g = JSON.parse(localStorage.getItem('amz-ansicht') || '{}');
  if (g.v === _amz.ansicht.v) for (const k of Object.keys(_amz.ansicht)) if (k in g) _amz.ansicht[k] = g[k];
} catch {}
// „Nur Geschäftskunden" wird bewusst NICHT gemerkt — beim nächsten Öffnen sähe man sonst nur B2B-Zahlen und hielte sie für alles
// Gleiches gilt für den Produktart-Filter („Nur Armbänder" sähe beim nächsten Mal wie alles aus)
_amz.ansicht.b2b = false; _amz.ansicht.art = '';
function _amzAnsichtMerken() { try { localStorage.setItem('amz-ansicht', JSON.stringify({ ..._amz.ansicht, b2b: false, art: '' })); } catch {} }

// ── Sprache: Deutsch oder Englisch (Umschalter in den Einstellungen und oben auf der eigenständigen Seite) ──
// _t('Text mit {n}', { n }) liefert die englische Fassung aus AMZ_EN (texte.js), sonst den deutschen Text — was
// noch nicht übersetzt ist, bleibt deutsch. Lange Erklärtexte haben feste Schlüssel (AMZ_LANG: [deutsch, englisch]).
// Ohne gemerkte Wahl: Englisch nur für den Freelancer mit nicht-deutschem Browser.
// Produktnamen sind Amazon-Titel und bleiben, wie sie sind.
try { const s = localStorage.getItem('amz-sprache'); if (s === 'de' || s === 'en') _amz.sprache = s; } catch {}
const _amzEn = () => (_amz.sprache || (_amz.stand?.rolle === 'freelancer' && !/^de\b/i.test(navigator.language || '') ? 'en' : 'de')) === 'en';
function _t(text, werte) {
  const lang = window.AMZ_LANG?.[text];
  let t = lang ? lang[_amzEn() ? 1 : 0] : (_amzEn() && window.AMZ_EN?.[text]) || text;
  if (werte) t = t.replace(/\{(\w+)\}/g, (m, k) => (k in werte ? werte[k] : m));
  return t;
}
// Merkmal-Werte (Farbe, Menge) für die Anzeige: „Blau“ → „Blue“, „10 Stück“ → „10 pcs“
const _amzWert = v => (_amzEn() ? _t(String(v ?? '')).replace(/^(\d+) Stück$/, '$1 pcs') : v);
function amzSpracheSetzen(s) {
  _amz.sprache = s;
  try { localStorage.setItem('amz-sprache', s); } catch {}
  // linke Spalten neu aufbauen (Verkäufe/Produkte bauen ihr Gerüst sonst nur einmal)
  document.querySelectorAll('#amz-links .amz-links-seite').forEach(el => { delete el.dataset.gebaut; el.innerHTML = ''; });
  _amzBeschriften();
  amzSeite(_amz.seite);
}
// Texte außerhalb der Seiten: Werkzeugspalte, Sprachknöpfe der eigenständigen Seite, Anmeldung oben rechts
function _amzBeschriften() {
  for (const [id, s] of Object.entries(AMZ_SEITEN)) {
    const b = document.getElementById('nav-amz-' + id);
    if (b) { b.title = _t(s.titel); b.querySelector('.nav-btn-lbl').textContent = _t(s.name); }
  }
  document.querySelectorAll('.amz-sprache .seg-b').forEach(b => b.classList.toggle('an', b.dataset.sprache === (_amzEn() ? 'en' : 'de')));
  const wer = document.getElementById('amz-wer');
  if (wer && _amz.stand) wer.textContent = _t('Angemeldet als {wer}', { wer: _amz.stand.benutzer || '–' });
}
const _amzSprachWahl = () => `<div class="seg amz-seg amz-sprache">${[['de', 'Deutsch'], ['en', 'English']].map(([w, t]) =>
  `<button class="seg-b${(_amzEn() ? 'en' : 'de') === w ? ' an' : ''}" data-sprache="${w}" onclick="amzSpracheSetzen('${w}')">${t}</button>`).join('')}</div>`;

// ── Einhängen ─────────────────────────────────────────────────────────────────────────────
// Die Seiten-Dateien laden nach; wer eine Seite öffnet, wartet auf sie (sonst Wettlauf: beim Neuladen mit
// gemerktem Amazon-Bereich war amzVerkaeufeZeigen noch nicht da — die Seite blieb leer).
const _amzSkripte = Promise.all(['texte.js', 'verkaeufe.js', 'experimente.js', 'produkte.js', 'links.js'].map(f => new Promise((fertig, fehler) => {
  const s = document.createElement('script');
  s.src = AMZ_BASIS + f; s.async = false; s.onload = fertig; s.onerror = () => fehler(new Error(f + ' nicht geladen'));
  document.body.appendChild(s);
})));
(function _amzEinhaengen() {
  // Eigenständige Seite (start.html, z. B. für den Freelancer): kein Umschalter, Bereich immer Amazon
  const logo = window.AMZ_EIGENSTAENDIG ? null : document.querySelector('header .logo');
  logo?.insertAdjacentHTML('afterend', `<div class="seg bereich-wahl" id="bereich-wahl" hidden>
      <button class="seg-b an" data-bereich="gravur" onclick="bereichWechseln('gravur')">Gravur</button>
      <button class="seg-b" data-bereich="amazon" onclick="bereichWechseln('amazon')">Amazon</button></div>`);
  document.querySelector('.icon-nav')?.insertAdjacentHTML('beforeend', `<span class="nav-gruppe amz">Amazon</span>` +
    Object.entries(AMZ_SEITEN).map(([id, s]) => (s.unten ? '<span class="amz amz-nav-luecke"></span>' : '') + `<button class="nav-btn amz" id="nav-amz-${id}" title="${s.titel}" onclick="amzSeite('${id}')">
      <svg class="ik" viewBox="0 0 24 24" aria-hidden="true">${s.ikon}</svg><span class="nav-btn-lbl">${s.name}</span></button>`).join(''));
  document.querySelector('.left-panel')?.insertAdjacentHTML('beforeend', `<div class="amz-links" id="amz-links">
      ${Object.keys(AMZ_SEITEN).map(id => `<div class="amz-links-seite" id="amz-links-${id}"></div>`).join('')}</div>`);
  document.getElementById('canvas-area')?.parentElement.insertAdjacentHTML('beforeend', '<div id="amazon-buehne" class="amz-buehne"></div>');
  // Im Amazon-Bereich ist das Blatt unsichtbar — Editor-Kürzel (Entf, Strg+Z …) dürfen nicht
  // unbemerkt darauf wirken. Capture auf window läuft vor den Editor-Listenern auf document.
  window.addEventListener('keydown', e => {
    if (!document.body.classList.contains('bereich-amazon')) return;
    if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
    if (typeof _modalIsOpen === 'function' && _modalIsOpen()) return; // Dialoge brauchen Enter/Esc
    e.stopImmediatePropagation();
  }, true);
})();

function bereichWechseln(bereich) {
  const amazon = bereich === 'amazon';
  document.querySelectorAll('#bereich-wahl .seg-b').forEach(b => b.classList.toggle('an', b.dataset.bereich === bereich));
  document.body.classList.toggle('bereich-amazon', amazon);
  try { localStorage.setItem('bereich', bereich); } catch {}
  if (amazon) amzSeite(_amzLetzteSeite());
}
// Zuletzt geöffnete Amazon-Seite (Editor und eigenständige Seite gleich)
function _amzLetzteSeite() {
  let s = null;
  try { s = localStorage.getItem('amz-seite'); } catch {}
  return AMZ_SEITEN[s] ? s : 'verkaeufe';
}

const AMZ_ZEIGEN = { verkaeufe: () => amzVerkaeufeZeigen(), experimente: () => amzExperimenteZeigen(), produkte: () => amzProdukteZeigen(), links: () => amzLinksZeigen(), einstellungen: () => _amzEinstellungenZeigen() };
async function amzSeite(seite) {
  _amz.seite = seite;
  try { localStorage.setItem('amz-seite', seite); } catch {}
  try { await _amzSkripte; } catch (e) { console.error('Amazon-Bereich:', e); return _amzToast('⚠ Amazon-Bereich nicht vollständig geladen — Seite neu laden', 4000); }
  _amzBeschriften();
  document.querySelectorAll('.icon-nav .nav-btn.amz').forEach(b => b.classList.toggle('active', b.id === 'nav-amz-' + seite));
  document.querySelectorAll('#amz-links .amz-links-seite').forEach(el => el.classList.toggle('amz-sichtbar', el.id === 'amz-links-' + seite));
  AMZ_ZEIGEN[seite]();
}

// ── Einstellungen (unten links): Anmeldung + Abmelden, Ansicht zurücksetzen ───────────────
const AMZ_ROLLEN_TEXT = { inhaber: 'voller Zugriff', freelancer: 'Verkäufe ansehen, eigene Experimente eintragen und ändern' };
async function _amzEinstellungenZeigen() {
  try { if (!_amz.stand) await _amzStandLaden(); } catch {}
  const s = _amz.stand || {}, wer = s.benutzer === 'server' ? _t('Server (ohne Anmeldung)') : (s.benutzer || '–');
  const links = document.getElementById('amz-links-einstellungen');
  if (links) links.innerHTML = `
    <div class="tab-kopf"><div class="tab-titel"><span class="tab-titel-name">${_t('Einstellungen')}</span></div></div>
    <div class="scrolly amz-links-inhalt amz-einst">
      <div class="card"><div class="card-titel">${_t('Anmeldung')}</div>
        <div class="card-text">${_t('Angemeldet als {wer}', { wer: `<b>${_amzEsc(wer)}</b>` })}${AMZ_ROLLEN_TEXT[s.rolle] ? ' · ' + _t(AMZ_ROLLEN_TEXT[s.rolle]) : ''}</div>
        <button class="btn btn-muted btn-full" onclick="_amzAbmeldenKnopf()">${_t('Abmelden')}</button></div>
      <div class="card"><div class="card-titel">Sprache · Language</div>${_amzSprachWahl()}</div>
      <div class="card"><div class="card-titel">${_t("So funktioniert's")}</div>
        <div class="card-text amz-hilfe">${_t('HILFE_VERKAEUFE')}<br><br>${_t('HILFE_EXPERIMENTE')}<br><br>${_t('HILFE_PRODUKTE')}<br><br>${_t('HILFE_LINKS')}</div></div>
      <div class="card"><div class="card-titel">${_t('Ansicht')}</div>
        <div class="card-text">${_t('Gemerkte Auswahl (Zeitraum, Sortierung, Diagramm …) auf Standard zurücksetzen.')}</div>
        <button class="btn btn-muted btn-full" onclick="_amzAnsichtZuruecksetzen()">${_t('Zurücksetzen')}</button></div>
    </div>`;
  document.getElementById('amazon-buehne').innerHTML = `<div class="amz-leer-kasten"><div class="tab-titel-name">${_t('Amazon-Bereich')}</div>
    <p>${_t('Daten bis {d} · Amazon liefert Verkaufszahlen mit zwei Tagen Verzug.', { d: _amzDatum(s.bis) })}<br>${_t('Neue Zahlen kommen jeden Morgen gegen 4–5 Uhr.')}</p></div>`;
}
// Im Editor dessen Abmelden (gleicher Dialog wie in den Gravur-Einstellungen), sonst das eigene
function _amzAbmeldenKnopf() { return (!window.AMZ_EIGENSTAENDIG && typeof abmelden === 'function') ? abmelden() : amzAbmelden(); }
function _amzAnsichtZuruecksetzen() {
  try { localStorage.removeItem('amz-ansicht'); } catch {}
  _amzToast(_t('✓ Ansicht zurückgesetzt — Seite wird neu geladen'));
  setTimeout(() => location.reload(), 700);
}

// Umschalter nur zeigen, wenn der Server die Verkaufsdaten herausgibt (Rolle entwickler)
(async function _amzUmschalterPruefen() {
  try {
    const r = await fetch(AMZ_API + '/stand', { cache: 'no-store' });
    if (!r.ok) return;
    _amz.stand = await r.json();
    if (window.AMZ_EIGENSTAENDIG) {
      document.getElementById('amz-wer')?.insertAdjacentHTML('beforebegin', _amzSprachWahl());
      _amzBeschriften();
      return amzSeite(_amzLetzteSeite());
    }
    document.getElementById('bereich-wahl').hidden = false;
    let letzter = null;
    try { letzter = localStorage.getItem('bereich'); } catch {}
    if (letzter === 'amazon') bereichWechseln('amazon');
  } catch (e) { console.error('Amazon-Bereich:', e); }
})();

// ── API ───────────────────────────────────────────────────────────────────────────────────
async function _amzApi(pfad, opt = {}) {
  const r = await fetch(AMZ_API + pfad, { cache: 'no-store', ...opt,
    headers: opt.body ? { 'Content-Type': 'application/json' } : undefined,
    body: opt.body ? JSON.stringify(opt.body) : undefined });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(_t(j.error || 'HTTP ' + r.status));
  return j;
}
async function _amzStandLaden() { _amz.stand = await _amzApi('/stand'); return _amz.stand; }

// ── Produktverzeichnis und Gruppen ────────────────────────────────────────────────────────
// Ein „Produkt" bündelt Varianten (Kind-ASINs). Standard: Amazons Eltern-ASIN; im Reiter „Produkte" lassen
// sich Varianten in ein anderes Produkt schieben, Produkte umbenennen und alte Varianten ausblenden.
// Übersichtsseiten (Eltern-ASINs, selbst nicht kaufbar) und Ausgeblendete zählen in Summen mit, aber nicht als Variante.
// „no-cache": der Browser fragt mit ETag nach; unverändert → 304 ohne Inhalt
async function _amzKatalogLaden(neu = false) {
  if (_amz.katalog && !neu) return _amz.katalog;
  const j = await _amzApi('/produkte', { cache: 'no-cache' });
  const produkte = new Map();
  for (const [asin, parent, sku, titel, bild, variante, gruppe, aus, erster, letzter, eltern, farbe, groesse] of j.produkte) {
    const p = { asin, parent: parent || asin, sku, titel, bild, variante: (variante || '').split(',')[0].trim(),
      gruppeManuell: gruppe, aus: !!aus, erster, letzter, eltern: !!eltern, farbe, groesse };
    p.merkmale = _amzMerkmale(p);
    produkte.set(asin, p);
  }
  _amz.katalog = { produkte, namen: new Map(j.gruppen), familien: new Map(j.familien.map(([a, titel, bild]) => [a, { titel, bild }])) };
  _amz.katalog.gruppen = _amzGruppenBilden(_amz.katalog);
  return _amz.katalog;
}
const _amzProdukt = asin => _amz.katalog?.produkte.get(asin) || { asin, parent: asin, merkmale: {} };
const _amzGruppeVon = asin => { const p = _amz.katalog?.produkte.get(asin); return p ? (p.gruppeManuell || p.parent) : asin; };
const _amzGruppeInfo = id => _amz.katalog?.gruppen.get(id) || { id, name: id, autoName: id, kinder: [id], varianten: [id], bild: '', art: 'Sonstige', layout: '', achsen: [] };
// Name einer Variante: Printomation-Layoutname („K01_Blau_M10"), sonst Merkmale, SKU oder ASIN
function _amzVarName(asin) {
  const p = _amzProdukt(asin);
  if (p.eltern) return _t('Übersichtsseite');
  return p.variante || [p.merkmale.art, p.merkmale.menge, p.merkmale.version].filter(Boolean).map(_amzWert).join(' · ') || p.sku || asin;
}
function _amzGruppenBilden(k) {
  const gruppen = new Map(), P = a => k.produkte.get(a);
  for (const p of k.produkte.values()) {
    const id = p.gruppeManuell || p.parent;
    if (!gruppen.has(id)) gruppen.set(id, { id, kinder: [] });
    gruppen.get(id).kinder.push(p.asin);
  }
  for (const g of gruppen.values()) {
    // zuletzt besuchte zuerst: Name und Bild kommen von dort
    g.kinder.sort((a, b) => (P(b).letzter || '').localeCompare(P(a).letzter || ''));
    g.varianten = g.kinder.filter(a => !P(a).eltern && !P(a).aus);
    const quelle = g.varianten.length ? g.varianten : g.kinder, fam = k.familien.get(g.id);
    // Titel einer Variante (der Eltern-Titel ist bei Amazon oft ein anderer, älterer Text)
    g.titel = P(quelle.find(a => P(a).titel) || quelle[0])?.titel || fam?.titel || '';
    g.autoName = _amzKurzname(g.titel, g.varianten.length === 1 ? _amzVarName(g.varianten[0]) : g.id);
    g.name = k.namen.get(g.id) || g.autoName;
    g.eigen = g.id.startsWith('G');
    g.bild = P(g.id)?.bild || fam?.bild || quelle.map(a => P(a).bild).find(Boolean) || '';
    g.art = _amzProduktart(g.titel || g.name);
    g.layout = _amzLayoutGruppe(g.varianten.map(a => P(a).variante));
    // Merkmal-Achsen (Farbe, Menge, Version), die innerhalb des Produkts wirklich variieren
    const vs = g.varianten.map(a => P(a).merkmale);
    // „K01_Schw" ohne Mengenangabe = 1 Stück (nur bei Varianten mit Layoutname/SKU — sonst wäre es geraten)
    if (vs.some(m => m.menge)) for (const m of vs) if (!m.menge && m.art) m.menge = '1 Stück';
    g.achsen = ['art', 'menge', 'version'].filter(x => new Set(vs.map(m => m[x]).filter(Boolean)).size > 1);
    g.artName = vs.every(m => !m.art || AMZ_FARBNAMEN.has(m.art)) ? 'Farbe' : 'Ausführung';
  }
  return gruppen;
}
// Merkmale aus Layoutname bzw. SKU: „K01_Blau_M10", „FL01_Schw_M1", „F02_Schw_V1", „S01_Herz", „D_A_Silber",
// „Blau, 10 Stück"; sonst Farbe aus dem Katalog
const AMZ_FARBWORTE = { schw: 'Schwarz', schwarz: 'Schwarz', blau: 'Blau', grün: 'Grün', gruen: 'Grün', rot: 'Rot', gold: 'Gold', silb: 'Silber',
  silber: 'Silber', pink: 'Pink', lila: 'Lila', oran: 'Orange', orange: 'Orange', grau: 'Grau', hellb: 'Hellblau', hellblau: 'Hellblau',
  gemi: 'Gemischt', gemischt: 'Gemischt', weiss: 'Weiß', weiß: 'Weiß', rosegold: 'Roségold', icy: 'Icy', bunt: 'Bunt' };
const AMZ_FARBNAMEN = new Set(Object.values(AMZ_FARBWORTE));
function _amzMerkmale(p) {
  const m = {}, name = p.variante || p.sku || '';
  if (/^[^,]+,\s*\d+\s*St/i.test(name)) {
    const [a, b] = name.split(',');
    m.art = AMZ_FARBWORTE[a.trim().toLowerCase()] || a.trim(); m.menge = parseInt(b, 10) + ' Stück';
  } else if (/^[A-Z]+\d*_/.test(name)) {
    for (const t of name.split('_').slice(1)) {
      if (/^M\d+$/i.test(t)) m.menge = t.slice(1) + ' Stück';
      else if (/^V\d+$/i.test(t)) m.version = t.toUpperCase();
      else if (!m.art && t.length > 1) m.art = AMZ_FARBWORTE[t.toLowerCase()] || t;
    }
  }
  if (!m.art && p.farbe) m.art = p.farbe;
  return m;
}
const AMZ_ACHSEN_NAME = { art: g => _t(g.artName), menge: () => _t('Menge'), version: () => _t('Version') };

// Tageszeilen → Objekte { d, asin, sess, sessB, pv, units, unitsB, sales, salesB, bb } + Konto je Tag
const _amzDatenLaden = (von, bis) => _amzDatenLadenBereiche([[von, bis]]);
// Mehrere Zeitfenster (z. B. Zeitraum + derselbe Zeitraum im Vorjahr) — überlappende werden vorher
// zusammengelegt, die Abfragen laufen parallel. Vorher wurde beim Vorjahr das ganze Jahr dazwischen geladen.
function _amzBereicheZusammen(bereiche) {
  const s = bereiche.filter(([v, b]) => v && b && v <= b).map(([v, b]) => [v, b]).sort((x, y) => (x[0] < y[0] ? -1 : 1));
  const out = [];
  for (const [v, b] of s) {
    const l = out[out.length - 1];
    if (l && v <= _amzPlus(l[1], 1)) { if (b > l[1]) l[1] = b; } else out.push([v, b]);
  }
  return out;
}
async function _amzDatenLadenBereiche(bereiche) {
  const teile = await Promise.all(_amzBereicheZusammen(bereiche).map(([von, bis]) =>
    _amzApi(`/daten?von=${von}&bis=${bis}`, { cache: 'no-cache' })));
  const zeilen = [], konto = new Map();
  for (const j of teile) {
    for (const [d, i, sess, sessB, pv, units, unitsB, sales, salesB, bb] of j.zeilen) zeilen.push({
      d, asin: j.asins[i], sess: sess || 0, sessB: sessB || 0, pv: pv || 0, units: units || 0, unitsB: unitsB || 0, sales: sales || 0, salesB: salesB || 0, bb });
    for (const [d, sess, units, sales, bb] of j.konto) konto.set(d, { d, sess: sess || 0, units: units || 0, sales: sales || 0, bb });
  }
  return { zeilen, konto };
}
// Kurzer Produktname aus dem Amazon-Titel: Teil vor „|" bzw. „ – ", ohne Markennamen, höchstens 60 Zeichen
function _amzKurzname(titel, ersatz) {
  let t = String(titel || '').split('|')[0].split(/\s[–-]\s/)[0].replace(/^gravurtastisch®?\s*/i, '').trim();
  if (t.length > 60) t = t.slice(0, 57).trim() + '…';
  return t ? t[0].toUpperCase() + t.slice(1) : ersatz;
}
// Produktart aus dem Titel (Reihenfolge zählt: erster Treffer gewinnt). Ohne Titel: „Sonstige".
const AMZ_PRODUKTARTEN = [
  ['Armbänder', /armb[aä]nd|armband/i], ['Kugelschreiber', /kugelschreiber|\bstift/i], ['Feuerzeuge', /feuerzeug/i],
  ['Flaschenöffner', /flaschen[öo]ffner|bier[öo]ffner/i], ['Schlüsselanhänger', /schl[üu]sselanh[äa]nger/i], ['Besteck', /besteck/i],
];
function _amzProduktart(titel) {
  for (const [art, re] of AMZ_PRODUKTARTEN) if (re.test(titel || '')) return art;
  return 'Sonstige';
}
// Layout-Gruppe aus den Variantennamen („FL02_Schw_V1" → „FL02"): macht gleich betitelte Produkte unterscheidbar
// (alle Flaschenöffner heißen auf Amazon fast gleich). Mehrere → „FL04/FL05", viele → leer.
function _amzLayoutGruppe(namen) {
  const g = [...new Set(namen.map(n => (/^([A-Z]+\d+)(?:_|$)/.exec(n || '') || [])[1]).filter(Boolean))].sort();
  return g.length && g.length <= 3 ? g.join('/') : '';
}
// Produktbild; ohne Bild: Anfangsbuchstabe
function _amzBild(i, klein = false) {
  const buchstabe = _amzEsc((i?.name || '?').trim()[0] || '?');
  return `<span class="amz-bild${klein ? ' klein' : ''}" data-b="${buchstabe}">${i?.bild ? `<img src="${_amzEsc(i.bild)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : ''}</span>`;
}

// ── Hilfen: Datum (UTC-Kalendertage) und Zahlen ───────────────────────────────────────────
const _amzTag = s => Date.UTC(+s.slice(0, 4), +s.slice(5, 7) - 1, +s.slice(8, 10));
const _amzStr = ms => new Date(ms).toISOString().slice(0, 10);
const _amzPlus = (s, n) => _amzStr(_amzTag(s) + n * 86400000);
const _amzTage = (von, bis) => Math.round((_amzTag(bis) - _amzTag(von)) / 86400000) + 1;
// Heute nach Ortszeit (toISOString wäre UTC: in Berlin bis 1/2 Uhr nachts noch gestern)
const _amzHeute = () => { const d = new Date(); return _amzStr(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())); };
// Englisch: Tag/Monat/Jahr mit „/“ (britisch, wie in Seller Central EU)
const _amzDatum = s => s ? `${s.slice(8, 10)}${_amzEn() ? '/' : '.'}${s.slice(5, 7)}${_amzEn() ? '/' : '.'}${s.slice(0, 4)}` : '–';
const _amzDatumKurz = s => _amzEn() ? `${s.slice(8, 10)}/${s.slice(5, 7)}` : `${s.slice(8, 10)}.${s.slice(5, 7)}.`;
const _amzWochentag = s => (_amzEn() ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] : ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'])[new Date(_amzTag(s)).getUTCDay()];
const _amzMonat = s => (_amzEn() ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  : ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'])[+s.slice(5, 7) - 1] + ' ' + s.slice(0, 4);
const _amzMonatsende = s => _amzPlus(_amzPlus(s.slice(0, 8) + '28', 4).slice(0, 8) + '01', -1);
function _amzSchluessel(s, gran) {
  if (gran === 'monat') return s.slice(0, 8) + '01';
  if (gran === 'woche') { const dow = new Date(_amzTag(s)).getUTCDay(); return _amzPlus(s, -((dow + 6) % 7)); }
  return s;
}
function _amzZahl(v, dez = 0, einheit = '') {
  if (v == null || !isFinite(v)) return '–';
  return v.toLocaleString(_amzEn() ? 'en-GB' : 'de-DE', { minimumFractionDigits: dez, maximumFractionDigits: dez }) + einheit;
}
// Mit Vorzeichen; was gerundet 0 ergibt, bekommt keins (kein „-0,0 %")
const _amzNull = (v, dez = 0) => Math.abs(v) < 0.5 * 10 ** -dez;
const _amzVz = (v, dez = 0, einheit = '') => v == null || !isFinite(v) ? '–' : _amzNull(v, dez) ? _amzZahl(0, dez, einheit) : (v > 0 ? '+' : '') + _amzZahl(v, dez, einheit);
const _amzEsc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// Im Editor dessen Hinweis; auf der eigenständigen Seite ein eigener kleiner
function _amzToast(text, ms = 1800) {
  if (typeof showToast === 'function') return showToast(text, ms);
  let el = document.getElementById('amz-toast');
  if (!el) { el = document.createElement('div'); el.id = 'amz-toast'; document.body.appendChild(el); }
  el.textContent = text; el.classList.add('an');
  clearTimeout(el._t); el._t = setTimeout(() => el.classList.remove('an'), ms);
}
// Abmelden auf der eigenständigen Seite — gleicher Weg wie im Editor (Cookie → nginx fragt neu, s. sites-available/printomation)
function amzAbmelden() {
  const benutzer = _amz.stand?.benutzer;
  if (!benutzer || benutzer === 'server') return;
  if (!confirm(_t('Als „{wer}" abmelden? Danach fragt der Browser wieder nach Benutzer und Passwort.', { wer: benutzer }))) return;
  document.cookie = `pm_abgemeldet=${encodeURIComponent(benutzer)}; Path=/; Max-Age=300; Secure; SameSite=Lax`;
  location.href = '/';
}
async function _amzFrage(titel, text, ok) {
  return typeof confirmModal === 'function' ? !!(await confirmModal(titel, text, ok)) : confirm(titel + '\n\n' + text);
}
function _amzDownload(name, inhalt, typ) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([inhalt], { type: typ }));
  a.download = name; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Bündeln je (ID, Zeitschlüssel); Raten immer aus den Summen, Buy-Box nach Sitzungen gewichtet
function _amzSumme(zeilen) {
  const e = { sess: 0, pv: 0, units: 0, sales: 0, bbW: 0, bbBasis: 0 };
  for (const z of zeilen) {
    e.sess += z.sess; e.pv += z.pv || 0; e.units += z.units; e.sales += z.sales;
    if (z.bb != null) { e.bbW += z.bb * z.sess; e.bbBasis += z.sess; }
  }
  e.conversion = e.sess > 0 ? e.units / e.sess * 100 : null;
  e.price = e.units > 0 ? e.sales / e.units : null;
  e.bb = e.bbBasis > 0 ? e.bbW / e.bbBasis : null;
  return e;
}
function _amzBuendeln(zeilen, gran, idFeld = 'id') {
  const m = new Map();
  for (const z of zeilen) {
    const k = _amzSchluessel(z.d, gran), id = idFeld ? z[idFeld] : null, key = id + '|' + k;
    if (!m.has(key)) m.set(key, { id, k, liste: [] });
    m.get(key).liste.push(z);
  }
  return [...m.values()].map(({ id, k, liste }) => Object.assign(_amzSumme(liste), { id, k }));
}
const _amzIm = (zeilen, von, bis) => zeilen.filter(z => z.d >= von && z.d <= bis);
function _amzJe(zeilen, feld = 'id') {
  const m = new Map();
  for (const z of zeilen) { if (!m.has(z[feld])) m.set(z[feld], []); m.get(z[feld]).push(z); }
  return new Map([...m].map(([id, zs]) => [id, _amzSumme(zs)]));
}

// ── Statistik ─────────────────────────────────────────────────────────────────────────────
function _amzErf(x) { // Abramowitz/Stegun 7.1.26, Fehler < 1,5e-7
  const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return x >= 0 ? y : -y;
}
const _amzPhi = x => 0.5 * (1 + _amzErf(x / Math.SQRT2));
// Regularisierte unvollständige Beta-Funktion (Numerical Recipes, Kettenbruch) → t-Verteilung
function _amzBetaI(a, b, x) {
  if (x <= 0) return 0; if (x >= 1) return 1;
  const lg = z => { const c = [76.18009172947146, -86.50532032941677, 24.01409824083091, -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
    let y = z, tmp = z + 5.5; tmp -= (z + 0.5) * Math.log(tmp); let s = 1.000000000190015; for (const ci of c) s += ci / ++y; return -tmp + Math.log(2.5066282746310005 * s / z); };
  const bt = Math.exp(lg(a + b) - lg(a) - lg(b) + a * Math.log(x) + b * Math.log(1 - x));
  const cf = (a, b, x) => {
    let c = 1, d = 1 - (a + b) * x / (a + 1); if (Math.abs(d) < 1e-30) d = 1e-30; d = 1 / d; let h = d;
    for (let m = 1; m <= 200; m++) {
      const m2 = 2 * m; let aa = m * (b - m) * x / ((a + m2 - 1) * (a + m2));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d; h *= d * c;
      aa = -(a + m) * (a + b + m) * x / ((a + m2) * (a + m2 + 1));
      d = 1 + aa * d; if (Math.abs(d) < 1e-30) d = 1e-30; c = 1 + aa / c; if (Math.abs(c) < 1e-30) c = 1e-30; d = 1 / d;
      const del = d * c; h *= del; if (Math.abs(del - 1) < 3e-7) break;
    }
    return h;
  };
  return x < (a + 1) / (a + b + 2) ? bt * cf(a, b, x) / a : 1 - bt * cf(b, a, 1 - x) / b;
}
const _amzTP = (t, df) => _amzBetaI(df / 2, 0.5, df / (df + t * t)); // zweiseitiger p-Wert

// Zwei-Anteile-z-Test (Einheiten/Sitzungen als Trefferquote); abzug = Änderung in Prozentpunkten, die auch ohne
// Eingriff zu erwarten war (Konto-Trend) — getestet wird dann die bereinigte Differenz
function _amzConvTest(ua, sa, ub, sb, abzug = 0) {
  if (!sa || !sb) return null;
  const p1 = Math.min(ua / sa, 1), p2 = Math.min(ub / sb, 1), p = Math.min((ua + ub) / (sa + sb), 1);
  const se = Math.sqrt(p * (1 - p) * (1 / sa + 1 / sb));
  if (!se) return null;
  const z = (p2 - p1 - abzug / 100) / se;
  return { diff: (p2 - p1) * 100 - abzug, p: 2 * (1 - _amzPhi(Math.abs(z))) };
}
// Welch-t-Test auf Tageswerten (Umsatz je Tag) — prüft, ob ein Unterschied über das normale Tagesschwanken
// hinausgeht (+0,01 €/Tag allein reicht nicht für ein Urteil)
function _amzWelch(a, b) {
  if (a.length < 3 || b.length < 3) return null;
  const mw = x => x.reduce((s, v) => s + v, 0) / x.length;
  const va = x => { const m = mw(x); return x.reduce((s, v) => s + (v - m) ** 2, 0) / (x.length - 1); };
  const ma = mw(a), mb = mw(b), sa = va(a) / a.length, sb = va(b) / b.length, se = Math.sqrt(sa + sb);
  if (!se) return { diff: mb - ma, p: mb === ma ? 1 : 0 };
  const df = (sa + sb) ** 2 / ((sa ** 2) / (a.length - 1) + (sb ** 2) / (b.length - 1));
  return { diff: mb - ma, p: _amzTP((mb - ma) / se, df) };
}

// ── Kacheln (jetzt · Vergleich · %) ───────────────────────────────────────────────────────
// werte/vgl: Summen aus _amzSumme; vglName leer = ohne Vergleichszeile; ziel = hervorgehoben
function _amzKacheln(werte, vgl, { vglName = '', unvollstaendig = false, ziel = '' } = {}) {
  return `<div class="amz-kpis">${Object.entries(AMZ_KENNZAHLEN).map(([k, kz]) => {
    const v = werte?.[k], alt = vgl?.[k], pct = (v != null && alt) ? (v / alt - 1) * 100 : null;
    const zeile = !vglName ? '' : unvollstaendig
      ? `<div class="amz-k-vgl"><small>${vglName}</small><span>${_t('zu wenig Daten')}</span></div>`
      : `<div class="amz-k-vgl"><small>${vglName}</small><span>${_amzZahl(alt, kz.dez, kz.einheit)}</span>${pct == null ? '' : `<b class="${_amzNull(pct, 1) ? '' : pct > 0 ? 'plus' : 'minus'}">${_amzVz(pct, 1, ' %')}</b>`}</div>`;
    return `<div class="amz-kachel${k === ziel ? ' ziel' : ''}"><div class="amz-k-lbl">${_t(kz.lang)}</div><div class="amz-k-wert">${_amzZahl(v, kz.dez, kz.einheit)}</div>${zeile}</div>`;
  }).join('')}</div>`;
}

// ── Liniendiagramm (SVG, ohne Bibliothek) ─────────────────────────────────────────────────
function _amzSkala(max) {
  if (!max || max <= 0) return { schritt: 1, top: 1 };
  const roh = max / 4, p = 10 ** Math.floor(Math.log10(roh));
  const schritt = [1, 2, 2.5, 5, 10].map(f => f * p).find(f => f >= roh);
  return { schritt, top: Math.ceil(max / schritt) * schritt };
}
// serien: [{ name, farbe, werte: Map(schluessel → wert), vgl?: Map }], marken: [{ k, text }],
// auswahl: { von, bis } wird hinterlegt; beiKlick(schluessel) macht Punkte anklickbar
function _amzLinien(el, { schluessel, serien, gran = 'tag', dez = 0, einheit = '', hoehe = 280, marken = [], auswahl = null, beiKlick = null }) {
  if (!el) return;
  const W = Math.max(320, el.clientWidth || 600), H = hoehe;
  const L = 54, R = 12, O = 10, U = 24, iw = W - L - R, ih = H - O - U, n = schluessel.length;
  const x = i => L + (n <= 1 ? iw / 2 : i * iw / (n - 1));
  let max = 0;
  for (const s of serien) for (const m of [s.werte, s.vgl]) if (m) for (const v of m.values()) if (v != null && v > max) max = v;
  const { schritt, top } = _amzSkala(max);
  // Nachkommastellen der Achse wie die Schrittweite (2,5 → „7,5" statt gerundet „8")
  const dezAchse = (String(+schritt.toPrecision(3)).split('.')[1] || '').length;
  const y = v => O + ih - v / top * ih;
  const pfad = m => {
    let d = '', offen = false;
    schluessel.forEach((k, i) => {
      const v = m?.get(k);
      if (v == null) { offen = false; return; }
      d += (offen ? 'L' : 'M') + x(i).toFixed(1) + ' ' + y(v).toFixed(1); offen = true;
    });
    return d;
  };
  const yTicks = []; for (let v = 0; v <= top + 1e-9; v += schritt) yTicks.push(v);
  const xJede = Math.max(1, Math.ceil(n / Math.max(1, Math.floor(iw / 62))));
  const xLabel = k => gran === 'monat' ? `${k.slice(5, 7)}/${k.slice(2, 4)}` : _amzDatumKurz(k);
  const pos = new Map(schluessel.map((k, i) => [k, i]));
  // Auswahl: alle Schlüssel im Bereich, je eine halbe Schrittweite links und rechts
  let band = '';
  if (auswahl) {
    const idx = schluessel.map((k, i) => (k >= _amzSchluessel(auswahl.von, gran) && k <= auswahl.bis ? i : -1)).filter(i => i >= 0);
    if (idx.length) {
      const halb = n <= 1 ? iw / 2 : iw / (n - 1) / 2, x1 = Math.max(L, x(idx[0]) - halb), x2 = Math.min(W - R, x(idx[idx.length - 1]) + halb);
      band = `<rect x="${x1}" y="${O}" width="${Math.max(3, x2 - x1)}" height="${ih}" class="amz-auswahl-band"/>`;
    }
  }
  el.innerHTML = `<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" class="amz-svg${beiKlick ? ' klickbar' : ''}">
    ${band}
    ${yTicks.map(v => `<line x1="${L}" x2="${W - R}" y1="${y(v)}" y2="${y(v)}" class="amz-gitter"/><text x="${L - 6}" y="${y(v) + 4}" class="amz-achse" text-anchor="end">${_amzZahl(v, dezAchse)}</text>`).join('')}
    ${schluessel.map((k, i) => i % xJede ? '' : `<text x="${x(i)}" y="${H - 6}" class="amz-achse" text-anchor="middle">${xLabel(k)}</text>`).join('')}
    ${marken.filter(m => pos.has(m.k)).map(m => `<line x1="${x(pos.get(m.k))}" x2="${x(pos.get(m.k))}" y1="${O}" y2="${O + ih}" class="amz-marke-linie"><title>${_amzEsc(m.text)}</title></line>`).join('')}
    ${serien.map(s => s.vgl ? `<path d="${pfad(s.vgl)}" class="amz-linie vgl" stroke="${s.farbe}"/>` : '').join('')}
    ${serien.map(s => `<path d="${pfad(s.werte)}" class="amz-linie" stroke="${s.farbe}"/>`).join('')}
    ${n <= 45 ? serien.map(s => schluessel.map((k, i) => s.werte.get(k) == null ? '' : `<circle cx="${x(i)}" cy="${y(s.werte.get(k))}" r="2.6" fill="${s.farbe}"/>`).join('')).join('') : ''}
    <line class="amz-fadenkreuz" y1="${O}" y2="${O + ih}" x1="-10" x2="-10"/>
  </svg><div class="amz-tip" hidden></div>`;
  const svg = el.querySelector('svg'), tip = el.querySelector('.amz-tip'), kreuz = el.querySelector('.amz-fadenkreuz');
  const markeAm = new Map(); for (const m of marken) markeAm.set(m.k, (markeAm.get(m.k) ? markeAm.get(m.k) + ' · ' : '') + m.text);
  const index = ev => {
    const r = svg.getBoundingClientRect(), px = (ev.clientX - r.left) * W / r.width;
    return { r, i: Math.max(0, Math.min(n - 1, Math.round((px - L) / (n <= 1 ? 1 : iw / (n - 1))))) };
  };
  const was = _t({ tag: 'diesen Tag', woche: 'diese Woche', monat: 'diesen Monat' }[gran]);
  svg.addEventListener('mousemove', ev => {
    const { r, i } = index(ev), k = schluessel[i], mitVgl = serien.some(s => s.vgl);
    kreuz.setAttribute('x1', x(i)); kreuz.setAttribute('x2', x(i));
    const titel = gran === 'woche' ? _t('Woche ab {d}', { d: _amzDatum(k) }) : gran === 'monat' ? _amzMonat(k) : `${_amzWochentag(k)}, ${_amzDatum(k)}`;
    tip.innerHTML = `<b>${titel}</b>` + (markeAm.has(k) ? `<div class="amz-tip-marke">${_amzEsc(markeAm.get(k))}</div>` : '')
      + (mitVgl ? `<div class="amz-tip-kopf"><i></i><span></span><b>${_t('Zeitraum')}</b><em>${_t('Vergleich')}</em></div>` : '')
      + serien.map(s => `<div><i style="background:${s.farbe}"></i><span>${_amzEsc(s.name)}</span><b>${_amzZahl(s.werte.get(k), dez, einheit)}</b>${s.vgl ? `<em>${_amzZahl(s.vgl.get(k), dez, einheit)}</em>` : ''}</div>`).join('')
      + (beiKlick ? `<small class="amz-tip-klick">${_t('Klick zeigt nur {was}', { was })}</small>` : '');
    tip.hidden = false;
    const links = x(i) * r.width / W;
    tip.style.left = (links > r.width / 2 ? links - tip.offsetWidth - 12 : links + 12) + 'px';
  });
  svg.addEventListener('mouseleave', () => { tip.hidden = true; kreuz.setAttribute('x1', -10); kreuz.setAttribute('x2', -10); });
  if (beiKlick) svg.addEventListener('click', ev => beiKlick(schluessel[index(ev).i]));
}

let _amzResizeT = null;
window.addEventListener('resize', () => {
  if (!document.body.classList.contains('bereich-amazon')) return;
  clearTimeout(_amzResizeT);
  _amzResizeT = setTimeout(() => ({ verkaeufe: _amzVkZeichnen, experimente: _amzExZeichnen })[_amz.seite]?.(), 150);
});
