// ── Amazon → Links ────────────────────────────────────────────────────────────────────────────
// Fertige Amazon-Links zum Kopieren (Instagram, TikTok, WhatsApp, E-Mail, Influencer): sauberer Produktlink
// (/dp/ASIN), App-Link über go.html (öffnet die Amazon-App statt des In-App-Browsers von Instagram/TikTok, in dem
// der Kunde nicht angemeldet ist) und Suchlinks (Suchbegriff, Marke/Verkäufer, beides, Suchbegriff mit Neuheiten zuerst).
// Optional mit Attribution-Tag aus der Werbekonsole. Produkt aus der Liste oder eigene ASIN, Land wählbar. Wird nur
// im Browser zusammengesetzt; Marke (Amazons Filter p_123) oder Verkäufer (p_6) je Land merkt sich der Browser.
// Bewusst weggelassen (Recherche 27./28.10.2026): Suchbegriff im Pfad (Amazon ignoriert ihn), ASIN-Filter
// (rh=p_78) und veraltete 2-Step-Felder (field-brand, field-asin), Warenkorb-Links (personalisierte Produkte
// brauchen erst „Jetzt anpassen“) und Bewertungslinks (Nutzer: nicht gebraucht, 28.10.2026).

const AMZ_LAENDER = [
  ['de', 'Deutschland', 'amazon.de'], ['fr', 'Frankreich', 'amazon.fr'], ['it', 'Italien', 'amazon.it'], ['es', 'Spanien', 'amazon.es'],
  ['nl', 'Niederlande', 'amazon.nl'], ['be', 'Belgien', 'amazon.com.be'], ['pl', 'Polen', 'amazon.pl'], ['se', 'Schweden', 'amazon.se'],
  ['ie', 'Irland', 'amazon.ie'], ['uk', 'Großbritannien', 'amazon.co.uk'], ['us', 'USA', 'amazon.com'],
];
const _li = { je: null, gewaehlt: null, asin: null, begriff: '', tag: '', tagAusLink: false, marken: {}, markeEingabe: '',
  suche: '', eigen: false, eigeneEingabe: '', land: 'de' };
try { const l = localStorage.getItem('amz-li-land'); if (AMZ_LAENDER.some(x => x[0] === l)) _li.land = l; } catch {}
// Schlüssel -2 seit 28.10.2026 09:00: ältere Einträge (Verkäufer-Vorgabe) verwerfen, damit die Marke greift
try { _li.marken = JSON.parse(localStorage.getItem('amz-li-marken-2')) || {}; } catch {}
// Vorgabe, solange für das Land nichts eingetragen ist: die eigene Marke Gravurtastisch. Auf amazon.de am 28.10.2026
// vom Nutzer per Filter-Link bestätigt (rh=p_123%3A5515927); in den anderen Ländern ungeprüft. Gleichwertig wäre der
// eigene Verkäufer A39Q604UXIR8Y4 (rh=p_6%3A…, ebenfalls bestätigt) — Gravurtastisch hat nur diesen einen Verkäufer
const AMZ_LI_VORGABE = { de: '5515927' };
const _liMarkeVon = land => land in _li.marken ? _li.marken[land] : AMZ_LI_VORGABE[land] || '';
_li.markeEingabe = _liMarkeVon(_li.land);

async function amzLinksZeigen(neu = false) {
  const b = document.getElementById('amazon-buehne');
  try {
    if (neu || !_amz.stand) await _amzStandLaden();
    if (!_amz.stand.db || !_amz.stand.bis) { b.innerHTML = _vkLeer(); return; }
    b.classList.add('laedt');
    const bis = _amz.stand.bis;
    // Umsatz und Besuche der letzten 30 Tage: Reihenfolge der Liste und vorgewählte Variante
    const [daten] = await Promise.all([_amzDatenLaden(_amzPlus(bis, -29), bis), _amzKatalogLaden(neu)]);
    _li.je = _amzJe(daten.zeilen, 'asin');
    _liLinks(); _liZeichnen();
  } catch (e) {
    b.innerHTML = `<div class="mb-leer">${_t('Produkte konnten nicht geladen werden: {f}', { f: _amzEsc(e.message) })}</div>`;
  } finally { b.classList.remove('laedt'); }
}
const _liX = asin => _li.je?.get(asin) || { sess: 0, sales: 0 };
const _liUmsatz = g => g.kinder.reduce((s, a) => s + _liX(a).sales, 0);
// Suchbegriff-Vorschlag aus dem Amazon-Titel des Produkts
const _liVorschlag = g => _amzKurzname(g.titel, '').toLowerCase();

// ── Linke Spalte: eigene ASIN, Suche, Produktliste ────────────────────────────────────────
function _liLinks() {
  const el = document.getElementById('amz-links-links');
  if (!el) return;
  if (!el.dataset.gebaut) {
    el.dataset.gebaut = '1';
    el.innerHTML = `
      <div class="tab-kopf">
        <div class="tab-titel"><span class="tab-titel-name">${_t('Links')}</span></div>
        <div class="tab-titel-text">${_t('Amazon-Links zum Teilen.')}</div>
      </div>
      <div class="scrolly amz-links-inhalt">
        <button class="amz-prod" id="li-eigen-knopf" onclick="_liEigen()" style="--farbe:var(--accent)">${_amzBild({ name: '+' })}
          <span class="amz-prod-text"><span class="amz-prod-name">${_t('Eigene ASIN eingeben')}</span>
          <span class="amz-prod-zusatz">${_t('Jedes Produkt, jedes Land')}</span></span></button>
        <input type="search" class="amz-suche amz-li-suche" placeholder="${_t('Produkt, Layout („FL04“) oder ASIN …')}" oninput="_li.suche=this.value;_liListe()"/>
        <div id="li-liste" class="amz-produktliste"></div>
      </div>`;
  }
  _liListe();
}
function _liListe() {
  const el = document.getElementById('li-liste');
  if (!el || !_amz.katalog) return;
  document.getElementById('li-eigen-knopf')?.classList.toggle('gewaehlt', _li.eigen);
  const q = _li.suche.trim().toLowerCase();
  const passt = g => !q || [g.name, g.layout, g.id, ...g.kinder, ...g.kinder.map(_amzVarName)].join(' ').toLowerCase().includes(q);
  const alle = [..._amz.katalog.gruppen.values()].filter(g => g.varianten.length && passt(g)).sort((a, b) => _liUmsatz(b) - _liUmsatz(a));
  el.innerHTML = alle.map(g => `<button class="amz-prod${!_li.eigen && _li.gewaehlt === g.id ? ' gewaehlt' : ''}" data-id="${_amzEsc(g.id)}" onclick="_liWaehlen(this.dataset.id)" style="--farbe:var(--accent)">${_amzBild(g)}
    <span class="amz-prod-text"><span class="amz-prod-name">${_amzEsc(g.name)}</span>
      <span class="amz-prod-zusatz">${_amzEsc([g.layout, g.varianten.length === 1 ? _t('1 Variante') : _t('{n} Varianten', { n: g.varianten.length })].filter(Boolean).join(' · '))}</span></span>
    <span class="amz-prod-wert">${_amzZahl(_liUmsatz(g), 0, ' €')}</span></button>`).join('')
    || `<div class="amz-hinweis">${_t(q ? 'Nichts gefunden.' : 'Keine Produkte.')}</div>`;
}
// Produkt aus der Liste: meistbesuchte Variante vorwählen, Suchbegriff aus dem Amazon-Titel vorschlagen
function _liWaehlen(id) {
  const g = _amz.katalog.gruppen.get(id);
  Object.assign(_li, { eigen: false, gewaehlt: id, begriff: _liVorschlag(g) });
  _li.asin = [...g.varianten].sort((a, b) => _liX(b).sess - _liX(a).sess)[0];
  _liListe(); _liZeichnen();
}
function _liEigen() {
  _li.eigen = true;
  _li.asin = _liAsinAus(_li.eigeneEingabe);
  _liListe(); _liZeichnen();
  document.getElementById('li-asin')?.focus();
}
// ASIN aus der Eingabe: die ASIN selbst oder ein eingefügter Amazon-Link (…/dp/B0…, /gp/product/B0…)
function _liAsinAus(text) {
  const t = String(text || '').trim().toUpperCase();
  if (/^[A-Z0-9]{10}$/.test(t)) return t;
  return (/\/(?:DP|GP\/PRODUCT|GP\/AW\/D)\/([A-Z0-9]{10})(?:[/?#]|$)/.exec(t) || [])[1] || null;
}
// Attribution-Tag aus der Werbekonsole: ganzer Link oder nur „maas=…&ref_=aa_maas“. Übernommen werden nur Amazons
// Attribution-Parameter (maas, aa_…, ref_=aa_…), alles andere (th, psc, Slug, utm_…) fällt weg
function _liTagAus(text) {
  const t = String(text || '').trim().split('#')[0];
  const tag = new URLSearchParams();
  for (const [k, v] of new URLSearchParams(t.includes('?') ? t.slice(t.indexOf('?') + 1) : t))
    if (v && (k === 'maas' || k.startsWith('aa_') || (k === 'ref_' && v.startsWith('aa_')))) tag.append(k, v);
  return tag.toString();
}
// Marken- oder Verkäufer-Filter aus der Eingabe: Marken-ID („322906“, mehrere mit |), Verkäufer-ID („A39Q604UXIR8Y4“)
// oder der Link einer Amazon-Suche mit Filter (rh=p_123%3A322906, mehrere Marken %257C; rh=p_6%3AA…; me=A…).
// Ergebnis: „p_123:322906|178582“ bzw. „p_6:A39Q604UXIR8Y4“, sonst ''
function _liMarkeAus(text) {
  const t = String(text || '').trim();
  if (/^\d+(\|\d+)*$/.test(t)) return 'p_123:' + t;
  if (/^A[0-9A-Z]{8,20}$/i.test(t)) return 'p_6:' + t.toUpperCase();
  const m = /p_123(?:%3A|:)(\d+(?:(?:%257C|%7C|\|)\d+)*)/i.exec(t);
  if (m) return 'p_123:' + m[1].replace(/%257C|%7C/gi, '|');
  const v = /p_6(?:%3A|:)(A[0-9A-Z]{8,20})/i.exec(t) || /[?&]me=(A[0-9A-Z]{8,20})/i.exec(t);
  return v ? 'p_6:' + v[1].toUpperCase() : '';
}
function _liEigeneAsin(text) {
  const vorher = _li.asin;
  _li.eigeneEingabe = text;
  _li.asin = _liAsinAus(text);
  // Bekannte ASIN: Suchbegriff vorschlagen, solange noch keiner eingetragen ist
  if (_li.asin && _li.asin !== vorher && !_li.begriff.trim() && _amz.katalog?.produkte.has(_li.asin)) {
    _li.begriff = _liVorschlag(_amzGruppeInfo(_amzGruppeVon(_li.asin)));
    const f = document.getElementById('li-begriff'); if (f) f.value = _li.begriff;
  }
  // Ganzer Attribution-Link eingefügt: Tag mit übernehmen — solange keiner von Hand eingetragen ist
  if ((!_li.tag.trim() || _li.tagAusLink) && (_liTagAus(text) || _li.tagAusLink)) {
    _li.tag = _liTagAus(text); _li.tagAusLink = !!_li.tag;
    const f = document.getElementById('li-tag'); if (f) f.value = _li.tag;
  }
  _liAktualisieren();
}
function _liMarke(text) {
  _li.markeEingabe = text;
  const filter = _liMarkeAus(text);
  // Gemerkt wird nur die ID; ein geleertes Feld ebenfalls (sonst käme die Vorgabe zurück)
  if (filter || !text.trim()) {
    _li.marken[_li.land] = filter ? filter.split(':')[1] : '';
    try { localStorage.setItem('amz-li-marken-2', JSON.stringify(_li.marken)); } catch {}
  }
  _liAktualisieren();
}
function _liLand(land) {
  _li.land = land;
  try { localStorage.setItem('amz-li-land', land); } catch {}
  // Marke/Verkäufer gelten je Land
  _li.markeEingabe = _liMarkeVon(land);
  const f = document.getElementById('li-marke'); if (f) f.value = _li.markeEingabe;
  _liAktualisieren();
}

// ── Bühne: Eingaben und die fertigen Links ───────────────────────────────────────────────
// asin/begriff/marke: was der Link braucht
const AMZ_LINKARTEN = [
  { id: 'seite', asin: true, name: 'Produktlink', text: 'LINK_SEITE_HINWEIS' },
  { id: 'app', asin: true, name: 'App-Link (Deep-Link)', text: 'LINK_APP_HINWEIS' },
  { id: 'suche', begriff: true, name: 'Suche: Suchbegriff', text: 'Normale Amazon-Suche, wie ein Kunde sie tippt.' },
  { id: 'marke', marke: true, name: 'Suche: Marke / Verkäufer', text: 'Alle Produkte der Marke bzw. des Verkäufers.' },
  { id: 'markeSuche', begriff: true, marke: true, name: 'Suche: Marke / Verkäufer + Suchbegriff', text: 'Suchbegriff, nur Produkte der Marke bzw. des Verkäufers.' },
  { id: 'neu', begriff: true, name: 'Suche: Suchbegriff, neueste zuerst', text: 'Sortiert nach „Neueste Artikel“ — für neue Produkte.' },
];
function _liUrl(art) {
  const domain = AMZ_LAENDER.find(x => x[0] === _li.land)[2], tag = _liTagAus(_li.tag), asin = _li.asin;
  const k = 'k=' + encodeURIComponent(_li.begriff.trim()).replace(/%20/g, '+');
  // Filter wie in Amazons eigenen Links: rh=p_123%3A<ID> (mehrere Marken mit %257C) bzw. rh=p_6%3A<Verkäufer>
  const [fArt, fId = ''] = _liMarkeAus(_li.markeEingabe).split(':');
  const rh = `rh=${fArt}%3A${fId.split('|').join('%257C')}`;
  const suche = (...teile) => `https://www.${domain}/s?${[...teile, tag].filter(Boolean).join('&')}`;
  return {
    seite: `https://www.${domain}/dp/${asin}${tag ? '?' + tag : ''}`,
    // go.html ist ohne Anmeldung erreichbar (nginx: location = /go) und baut daraus den App-Aufruf
    app: `${location.origin}/go?l=${_li.land}&a=${asin}${tag ? '&' + tag : ''}`,
    suche: suche(k),
    // Nur Verkäufer: Amazons Shop-Suche (me=), wie „Weitere Artikel dieses Verkäufers“
    marke: suche(fArt === 'p_6' ? 'me=' + fId : rh),
    markeSuche: suche(k, rh),
    neu: suche(k, 's=date-desc-rank'),
  }[art];
}
// Was einem Link noch fehlt (leer = fertig)
function _liFehlt(art) {
  const l = AMZ_LINKARTEN.find(x => x.id === art);
  if (l.asin && !_li.asin) return _t(_li.eigen ? 'Erst eine ASIN oder einen Amazon-Link eingeben' : 'Erst ein Produkt wählen');
  if (l.begriff && !_li.begriff.trim()) return _t('Erst einen Suchbegriff eingeben');
  if (l.marke && !_liMarkeAus(_li.markeEingabe)) return _t(_li.markeEingabe.trim() ? 'Keine Marken- oder Verkäufer-ID erkannt — Amazon-Link mit Filter einfügen' : 'Erst Marke oder Verkäufer eintragen');
  if (_li.tag.trim() && !_liTagAus(_li.tag)) return _t('Kein Attribution-Tag erkannt — er enthält „maas=“');
  return '';
}
function _liZeichnen() {
  const b = document.getElementById('amazon-buehne'), K = _amz.katalog;
  if (!K) return;
  if (!_li.eigen && !K.gruppen.get(_li.gewaehlt)?.varianten.length) {
    const erstes = [...K.gruppen.values()].filter(g => g.varianten.length).sort((a, c) => _liUmsatz(c) - _liUmsatz(a))[0];
    if (erstes) return _liWaehlen(erstes.id);
    return _liEigen();
  }
  const g = _li.eigen ? null : K.gruppen.get(_li.gewaehlt);
  const asinFeld = _li.eigen
    ? `<label class="amz-feld">${_t('ASIN oder Amazon-Link')}
        <input id="li-asin" maxlength="1000" value="${_amzEsc(_li.eigeneEingabe)}" placeholder="B0CFQDTPCF" oninput="_liEigeneAsin(this.value)"/></label>`
    : g.varianten.length > 1 ? `<label class="amz-feld">${_t('Variante')}
        <select class="amz-auswahl" onchange="_li.asin=this.value;_liAktualisieren()">${g.varianten.map(a =>
          `<option value="${a}"${a === _li.asin ? ' selected' : ''}>${_amzEsc(_amzVarName(a) === a ? a : _amzVarName(a) + ' · ' + a)}</option>`).join('')}</select></label>` : '';
  const karte = l => `<div class="amz-karte">
      <div class="amz-karte-titel">${_t(l.name)}</div>
      <div class="amz-zeile amz-li-zeile"><input class="amz-li-url" id="li-url-${l.id}" readonly onfocus="this.select()"/>
        <button class="btn btn-accent btn-xs" onclick="_liKopieren('${l.id}')">${_t('Kopieren')}</button>
        <button class="btn btn-muted btn-xs" onclick="_liOeffnen('${l.id}')">${_t('Öffnen')}</button></div>
      <div class="amz-hinweis">${_t(l.text)}</div></div>`;
  b.innerHTML = `
    <div class="amz-ex-kopf" id="li-kopf"></div>
    <div class="amz-karte amz-li-eingabe">
      ${asinFeld}
      <label class="amz-feld">${_t('Suchbegriff')}
        <input id="li-begriff" maxlength="120" value="${_amzEsc(_li.begriff)}" oninput="_li.begriff=this.value;_liAktualisieren()"/></label>
      <label class="amz-feld">${_t('Marke oder Verkäufer')}
        <input id="li-marke" maxlength="2000" value="${_amzEsc(_li.markeEingabe)}" placeholder="${_t('ID oder Amazon-Link mit Filter')}" oninput="_liMarke(this.value)"/></label>
      <label class="amz-feld">${_t('Attribution-Tag (optional)')}
        <input id="li-tag" maxlength="1000" value="${_amzEsc(_li.tag)}" placeholder="${_t('maas=…&ref_=aa_maas oder ganzen Link aus der Werbekonsole')}" oninput="_li.tag=this.value;_li.tagAusLink=false;_liAktualisieren()"/></label>
      <label class="amz-feld">${_t('Land')}
        <select class="amz-auswahl" onchange="_liLand(this.value)">${AMZ_LAENDER.map(([id, name, domain]) =>
          `<option value="${id}"${id === _li.land ? ' selected' : ''}>${_amzEsc(_t(name))} · ${domain}</option>`).join('')}</select></label>
      <div class="amz-hinweis amz-li-marke-hilfe">${_t('LINK_MARKE_HILFE')}</div>
    </div>
    ${AMZ_LINKARTEN.filter(l => l.asin).map(karte).join('')}
    <div class="amz-hinweis amz-warn amz-block">${_t('LINK_SUCHE_HINWEIS')}</div>
    ${AMZ_LINKARTEN.filter(l => !l.asin).map(karte).join('')}
    <div class="amz-hinweis amz-block">${_t('LINKS_HINWEIS')}</div>`;
  _liAktualisieren();
}
// Kopf und Linkfelder neu füllen, ohne die Eingaben neu zu bauen — so behalten sie beim Tippen den Fokus
function _liAktualisieren() {
  const kopf = document.getElementById('li-kopf');
  if (kopf) {
    // Eigene ASIN, die zu einem eigenen Produkt gehört: dessen Bild und Name zeigen
    const p = _li.asin && _amz.katalog?.produkte.get(_li.asin);
    const g = _li.eigen ? (p ? _amzGruppeInfo(_amzGruppeVon(_li.asin)) : null) : _amz.katalog.gruppen.get(_li.gewaehlt);
    const zusatz = _li.eigen
      ? [p ? _amzVarName(_li.asin) + ' · ' + _li.asin : _li.asin ? _li.asin + ' · ' + _t('nicht in deinen Produkten') : _t('ASIN oder Amazon-Link eingeben')]
      : [g.layout && 'Layout ' + g.layout, g.varianten.length === 1 ? _t('1 Variante') : _t('{n} Varianten', { n: g.varianten.length })];
    if (_liTagAus(_li.tag)) zusatz.push(_t('mit Attribution-Tag'));
    kopf.innerHTML = `${_amzBild(g || { name: '+' })}<div class="amz-ex-titel">
      <div class="tab-titel-name">${_amzEsc(g ? g.name : _t('Eigene ASIN'))}</div>
      <div class="amz-kopf-zeit">${_amzEsc(zusatz.filter(Boolean).join(' · '))}</div></div>`;
  }
  for (const l of AMZ_LINKARTEN) {
    const el = document.getElementById('li-url-' + l.id);
    if (el) el.value = _liFehlt(l.id) || _liUrl(l.id);
  }
}
async function _liKopieren(art) {
  if (_liFehlt(art)) return _amzToast(_liFehlt(art));
  const url = _liUrl(art);
  try { await navigator.clipboard.writeText(url); }
  catch {
    const el = document.getElementById('li-url-' + art);
    el.value = url; el.select(); document.execCommand('copy');
  }
  _amzToast(_t('✓ Link kopiert'));
}
function _liOeffnen(art) {
  if (_liFehlt(art)) return _amzToast(_liFehlt(art));
  window.open(_liUrl(art), '_blank', 'noopener');
}
