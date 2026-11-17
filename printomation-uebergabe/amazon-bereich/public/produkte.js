// ── Amazon → Produkte ─────────────────────────────────────────────────────────────────────────
// Welche Varianten (Kind-ASINs) zusammen als EIN Produkt zählen — in Verkäufe und Experimente. Standard ist
// Amazons Familie (Eltern-ASIN). Hier lässt sich ein Produkt umbenennen, Varianten in ein anderes oder neues
// Produkt schieben (z. B. FL04 und FL05 getrennt auswerten, obwohl Amazon sie seit 18.10. als eine Familie führt)
// und Alte ausblenden: Ausgeblendete zählen in Summen weiter mit, aber nicht mehr als Variante und in keiner Liste.
// Ändern darf nur der Inhaber (Server prüft); gespeichert in produkt_gruppen / produkt_zuordnung.

const _pr = { daten: null, je: null, gewaehlt: null, suche: '', markiert: new Set(), umbenennen: false, neu: false };

async function amzProdukteZeigen(neu = false) {
  const b = document.getElementById('amazon-buehne');
  try {
    if (neu || !_amz.stand) await _amzStandLaden();
    if (!_amz.stand.db || !_amz.stand.bis) { b.innerHTML = _vkLeer(); return; }
    b.classList.add('laedt');
    const bis = _amz.stand.bis;
    // Zahlen der letzten 30 Tage je Variante (zeigen, was aktiv ist)
    const [daten] = await Promise.all([!neu && _pr.daten ? _pr.daten : _amzDatenLaden(_amzPlus(bis, -29), bis), _amzKatalogLaden(neu)]);
    _pr.daten = daten; _pr.je = _amzJe(daten.zeilen, 'asin');
    _prLinks(); _prZeichnen();
  } catch (e) {
    b.innerHTML = `<div class="mb-leer">${_t('Produkte konnten nicht geladen werden: {f}', { f: _amzEsc(e.message) })}</div>`;
  } finally { b.classList.remove('laedt'); }
}
const _prDarf = () => _amz.stand?.rolle === 'inhaber';
const _prX = asin => _pr.je?.get(asin) || { sess: 0, units: 0, sales: 0 };
const _prUmsatz = g => g.kinder.reduce((s, a) => s + _prX(a).sales, 0);
const _prAktiv = g => g.varianten.filter(a => _prX(a).sess > 0 || _prX(a).units > 0).length;
// Weicht das Produkt von Amazon ab? (eigener Name, eigenes Produkt, Varianten verschoben/ausgeblendet)
const _prGeaendert = g => g.eigen || _amz.katalog.namen.has(g.id) || g.kinder.some(a => { const p = _amzProdukt(a); return p.gruppeManuell || p.aus; });

// ── Linke Spalte: Suche + Produktliste (Umsatz 30 Tage) ──────────────────────────────────
function _prLinks() {
  const el = document.getElementById('amz-links-produkte');
  if (!el) return;
  if (!el.dataset.gebaut) {
    el.dataset.gebaut = '1';
    el.innerHTML = `
      <div class="tab-kopf">
        <div class="tab-titel"><span class="tab-titel-name">${_t('Produkte')}</span><button class="btn btn-muted btn-xs" onclick="amzProdukteZeigen(true)" title="${_t('Neu laden')}">↻</button></div>
        <div class="tab-titel-text">${_t('Welche Varianten zusammengehören.')}</div>
      </div>
      <div class="scrolly amz-links-inhalt">
        <input type="search" class="amz-suche" placeholder="${_t('Produkt, Layout („FL04“) oder ASIN …')}" oninput="_pr.suche=this.value;_prListe()"/>
        <div id="pr-liste" class="amz-produktliste"></div>
      </div>`;
  }
  _prListe();
}
function _prListe() {
  const el = document.getElementById('pr-liste');
  if (!el || !_amz.katalog) return;
  const q = _pr.suche.trim().toLowerCase();
  const passt = g => !q || [g.name, g.layout, g.id, ...g.kinder, ...g.kinder.map(_amzVarName)].join(' ').toLowerCase().includes(q);
  const alle = [..._amz.katalog.gruppen.values()].filter(passt).sort((a, b) => _prUmsatz(b) - _prUmsatz(a) || b.varianten.length - a.varianten.length);
  const eintrag = g => `<button class="amz-prod${_pr.gewaehlt === g.id ? ' gewaehlt' : ''}" data-id="${_amzEsc(g.id)}" onclick="_prWaehlen(this.dataset.id)" style="--farbe:var(--accent)">${_amzBild(g)}
    <span class="amz-prod-text"><span class="amz-prod-name">${_amzEsc(g.name)}</span>
      <span class="amz-prod-zusatz">${_amzEsc([g.layout, g.varianten.length === 1 ? _t('1 Variante') : _t('{n} Varianten', { n: g.varianten.length })].filter(Boolean).join(' · '))}${_prGeaendert(g) ? ` · <b class="amz-gruppe" title="${_t('Weicht von Amazon ab')}">✎</b>` : ''}</span></span>
    <span class="amz-prod-wert">${_amzZahl(_prUmsatz(g), 0, ' €')}</span></button>`;
  const mit = alle.filter(g => g.varianten.length), ohne = alle.filter(g => !g.varianten.length);
  el.innerHTML = (mit.map(eintrag).join('') || `<div class="amz-hinweis">${_t(q ? 'Nichts gefunden.' : 'Keine Produkte.')}</div>`)
    + (ohne.length ? `<div class="amz-ex-gruppe">${_t('Nur Übersichtsseite / ausgeblendet')} · ${ohne.length}</div>${ohne.map(eintrag).join('')}` : '');
}
function _prWaehlen(id) { Object.assign(_pr, { gewaehlt: id, markiert: new Set(), umbenennen: false, neu: false }); _prListe(); _prZeichnen(); }

// ── Bühne: ein Produkt mit allen ASINs ───────────────────────────────────────────────────
function _prZeichnen() {
  const b = document.getElementById('amazon-buehne'), K = _amz.katalog;
  if (!K) return;
  if (!K.gruppen.has(_pr.gewaehlt)) {
    _pr.gewaehlt = [...K.gruppen.values()].filter(g => g.varianten.length).sort((a, c) => _prUmsatz(c) - _prUmsatz(a))[0]?.id ?? null;
    _prListe();
  }
  const g = K.gruppen.get(_pr.gewaehlt);
  if (!g) { b.innerHTML = `<div class="amz-leer-kasten"><div class="tab-titel-name">${_t('Noch keine Produkte')}</div></div>`; return; }
  const darf = _prDarf(), bis = _amz.stand.bis, ab30 = _amzPlus(bis, -29);
  const status = p => {
    const t = [];
    if (p.eltern) t.push(['Übersichtsseite', 'grau', 'Eltern-ASIN der Familie — selbst nicht kaufbar; Besuche zählen im Produkt mit']);
    if (p.aus) t.push(['ausgeblendet', 'grau', 'Zählt in Summen mit, aber nicht als Variante']);
    if (p.gruppeManuell) t.push(['verschoben', 'blau', 'Bei Amazon in einer anderen Familie']);
    if (!p.eltern && !p.variante) t.push(['ohne Layout', 'gelb', 'Kein Printomation-Layout mit dieser ASIN — Bestellungen dafür laufen nicht automatisch in den Export']);
    if (!p.eltern && !p.aus) t.push(p.letzter >= ab30 ? ['aktiv', 'gruen', 'Besuche in den letzten 30 Tagen'] : ['ruht', '', p.letzter ? _t('Letzter Besuch {d}', { d: _amzDatum(p.letzter) }) : 'Noch nie besucht']);
    return t.map(([text, art, titel]) => `<span class="amz-status-marke ${art}" title="${_amzEsc(_t(titel))}">${_t(text)}</span>`).join(' ');
  };
  const rang = p => (p.eltern ? 3 : p.aus ? 4 : p.letzter >= ab30 ? 0 : 1);
  const zeilen = g.kinder.map(_amzProdukt).sort((a, c) => rang(a) - rang(c) || _prX(c.asin).sales - _prX(a.asin).sales || _prX(c.asin).sess - _prX(a.asin).sess);
  const ruhend = zeilen.filter(p => rang(p) === 1).map(p => p.asin);
  const merkmale = p => [p.merkmale.art, p.merkmale.menge, p.merkmale.version].filter(Boolean).map(_amzWert).join(' · ');
  const herkunft = g.eigen ? _t('Eigenes Produkt') : _t('Amazon-Familie {id}', { id: g.id });
  const ziele = [...K.gruppen.values()].filter(x => x.id !== g.id && (x.varianten.length || x.eigen)).sort((a, c) => a.name.localeCompare(c.name, 'de'));
  b.innerHTML = `
    <div class="amz-ex-kopf">${_amzBild(g)}<div class="amz-ex-titel">
      ${_pr.umbenennen ? `<div class="amz-zeile amz-pr-name"><input id="pr-name" class="amz-suche" maxlength="80" value="${_amzEsc(g.name)}" placeholder="${_amzEsc(g.autoName)}"
          onkeydown="if(event.key==='Enter')_prUmbenennen();if(event.key==='Escape'){_pr.umbenennen=false;_prZeichnen()}"/>
          <button class="btn btn-accent btn-xs" onclick="_prUmbenennen()">${_t('Speichern')}</button>
          ${!g.eigen && K.namen.has(g.id) ? `<button class="btn btn-muted btn-xs" onclick="document.getElementById('pr-name').value='';_prUmbenennen()" title="${_amzEsc(g.autoName)}">${_t('Name von Amazon')}</button>` : ''}
          <button class="btn btn-muted btn-xs" onclick="_pr.umbenennen=false;_prZeichnen()">${_t('Abbrechen')}</button></div>`
        : `<div class="tab-titel-name">${_amzEsc(g.name)}${darf ? ` <button class="amz-aufklapp" onclick="_pr.umbenennen=true;_prZeichnen();document.getElementById('pr-name')?.select()">✎ ${_t('umbenennen')}</button>` : ''}</div>`}
      <div class="amz-kopf-zeit">${_amzEsc([herkunft, g.layout && 'Layout ' + g.layout, g.varianten.length === 1 ? _t('1 Variante') : _t('{n} Varianten', { n: g.varianten.length }), _t('{n} mit Besuchen in 30 Tagen', { n: _prAktiv(g) })].filter(Boolean).join(' · '))}</div></div></div>
    <div class="amz-hinweis amz-block">${_t('PRODUKTE_HINWEIS')}
      ${_t(darf ? 'Varianten anhaken, dann verschieben oder ausblenden — Ausgeblendete zählen in Summen weiter mit, aber nicht als Variante.' : 'Ändern kann nur der Inhaber.')}</div>
    ${darf ? `<div class="amz-pr-aktionen">
      <span class="amz-pr-anzahl" id="pr-anzahl"></span>
      <select class="amz-auswahl" id="pr-ziel" onchange="_prZielGewaehlt(this.value)"><option value="">${_t('In anderes Produkt verschieben …')}</option>
        <option value="neu">${_t('+ Neues Produkt …')}</option>${ziele.map(x => `<option value="${_amzEsc(x.id)}">${_amzEsc(x.name + (x.layout ? ' (' + x.layout + ')' : ''))}</option>`).join('')}</select>
      <button class="btn btn-muted btn-xs" onclick="_prSetzen({ ausgeblendet: true })">${_t('Ausblenden')}</button>
      <button class="btn btn-muted btn-xs" onclick="_prSetzen({ ausgeblendet: false })">${_t('Einblenden')}</button>
      <button class="btn btn-muted btn-xs" onclick="_prSetzen({ gruppe: null })" title="${_t('Zurück in die Familie, in der Amazon sie führt')}">${_t('Wie bei Amazon')}</button>
      ${ruhend.length ? `<a href="#" class="amz-link amz-rechts" onclick="_prMarkieren(${_amzEsc(JSON.stringify(ruhend))});return false">${_t('{n} ruhende markieren', { n: ruhend.length })}</a>` : ''}
    </div>
    <div class="amz-zeile amz-pr-neu" id="pr-neu" ${_pr.neu ? '' : 'hidden'}><input id="pr-neu-name" class="amz-suche" maxlength="80" placeholder="${_t('Name des neuen Produkts, z. B. „Flaschenöffner FL04“')}"
        onkeydown="if(event.key==='Enter')_prNeuAnlegen()"/><button class="btn btn-accent btn-xs" onclick="_prNeuAnlegen()">${_t('Anlegen und verschieben')}</button>
      <button class="btn btn-muted btn-xs" onclick="_pr.neu=false;document.getElementById('pr-neu').hidden=true;document.getElementById('pr-ziel').value=''">${_t('Abbrechen')}</button></div>` : ''}
    <div class="amz-karte amz-tabelle-rahmen"><table class="amz-tabelle amz-pr-tabelle"><thead><tr>
      ${darf ? `<th class="amz-pr-haken"><input type="checkbox" title="${_t('Alle')}" onchange="_prMarkieren(this.checked ? ${_amzEsc(JSON.stringify(g.kinder))} : [], true)"/></th>` : ''}
      <th class="txt">${_t('Variante')}</th><th class="txt">ASIN · SKU</th><th class="txt">Status</th><th>${_t('Besuche 30 T')}</th><th>${_t('Umsatz 30 T')}</th><th>${_t('Zuletzt besucht')}</th></tr></thead><tbody>
      ${zeilen.map(p => `<tr data-asin="${p.asin}" class="${_pr.markiert.has(p.asin) ? 'gewaehlt' : ''}${rang(p) > 1 ? ' amz-pr-still' : ''}"${darf ? ` onclick="_prMarkieren(['${p.asin}'])"` : ''} style="--farbe:var(--accent)">
        ${darf ? `<td class="amz-pr-haken"><input type="checkbox" ${_pr.markiert.has(p.asin) ? 'checked' : ''} onclick="event.stopPropagation();_prMarkieren(['${p.asin}'])"/></td>` : ''}
        <td class="txt"><div class="amz-zelle-prod">${_amzBild({ name: _amzVarName(p.asin), bild: p.bild }, true)}<span><span class="amz-kind-name">${_amzEsc(_amzVarName(p.asin))}</span>
          <span class="amz-prod-zusatz">${_amzEsc(p.eltern ? '' : merkmale(p))}</span></span></div></td>
        <td class="txt"><span class="amz-kind-name">${p.asin}</span><br><span class="amz-prod-zusatz">${_amzEsc(p.sku || '–')}</span></td>
        <td class="txt">${status(p)}</td>
        <td>${_amzZahl(_prX(p.asin).sess)}</td><td>${_amzZahl(_prX(p.asin).sales, 0, ' €')}</td><td>${p.letzter ? _amzDatum(p.letzter) : '–'}</td></tr>`).join('')}
    </tbody></table></div>`;
  _prAnzahl();
}
function _prAnzahl() {
  const el = document.getElementById('pr-anzahl');
  if (el) el.textContent = _pr.markiert.size ? _t('{n} markiert:', { n: _pr.markiert.size }) : _t('Varianten anhaken, dann:');
}
// Markieren: einzelne Zeile umschalten; „alle" (setzen=true) übernimmt die Liste genau
function _prMarkieren(asins, setzen = false) {
  if (setzen) _pr.markiert = new Set(asins);
  else if (asins.length > 1) { const alle = asins.every(a => _pr.markiert.has(a)); for (const a of asins) alle ? _pr.markiert.delete(a) : _pr.markiert.add(a); }
  else for (const a of asins) _pr.markiert.has(a) ? _pr.markiert.delete(a) : _pr.markiert.add(a);
  document.querySelectorAll('.amz-pr-tabelle tbody tr').forEach(tr => {
    const an = _pr.markiert.has(tr.dataset.asin);
    tr.classList.toggle('gewaehlt', an);
    const cb = tr.querySelector('input'); if (cb) cb.checked = an;
  });
  _prAnzahl();
}
function _prZielGewaehlt(wert) {
  if (!wert) return;
  if (wert === 'neu') {
    _pr.neu = true;
    document.getElementById('pr-neu').hidden = false;
    document.getElementById('pr-neu-name').focus();
    return;
  }
  _prSetzen({ gruppe: wert });
}
function _prNeuAnlegen() {
  const name = document.getElementById('pr-neu-name')?.value.trim();
  if (!name) return _amzToast(_t('Bitte einen Namen eingeben'));
  _prSetzen({ neueGruppe: name });
}
async function _prSetzen(aenderung) {
  const asins = [..._pr.markiert];
  if (!asins.length) { document.getElementById('pr-ziel').value = ''; return _amzToast(_t('Erst Varianten anhaken')); }
  try {
    const r = await _amzApi('/produkte/zuordnung', { method: 'PUT', body: { asins, ...aenderung } });
    await _amzKatalogLaden(true);
    // Nach dem Verschieben zum Ziel wechseln, damit man sieht, wo die Varianten jetzt stehen
    const ziel = aenderung.neueGruppe ? r.gruppe : aenderung.gruppe !== undefined ? (aenderung.gruppe || _amzGruppeVon(asins[0])) : _pr.gewaehlt;
    Object.assign(_pr, { gewaehlt: ziel, markiert: new Set(), neu: false });
    _amzToast(_t(aenderung.ausgeblendet === true ? '✓ {n} ausgeblendet' : aenderung.ausgeblendet === false ? '✓ {n} eingeblendet' : '✓ {n} verschoben', { n: asins.length }));
    _prListe(); _prZeichnen();
  } catch (e) { _amzToast('⚠ ' + e.message, 3500); }
}
async function _prUmbenennen() {
  const name = document.getElementById('pr-name')?.value.trim() || '';
  try {
    await _amzApi('/produkte/gruppen/' + encodeURIComponent(_pr.gewaehlt), { method: 'PUT', body: { name } });
    await _amzKatalogLaden(true);
    _pr.umbenennen = false;
    _amzToast(_t('✓ Name gespeichert'));
    _prListe(); _prZeichnen();
  } catch (e) { _amzToast('⚠ ' + e.message, 3500); }
}
