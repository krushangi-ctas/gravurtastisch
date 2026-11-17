// ── Amazon → Verkäufe ──────────────────────────────────────────────────────────────────────────
// Aufbau bewusst schlicht: links Zeitraum (oder ein einzelner Tag) und Produkte (mit Bild); rechts fünf Kacheln
// (jetzt · Vergleich · %), EIN Diagramm, „Zu prüfen" und die Produkttabelle. Ohne Auswahl gilt alles für alle
// Produkte; wählt man Produkte, folgen Kacheln und Diagramm der Auswahl. Ein Klick ins Diagramm (oder das
// Datumsfeld links) wählt einen Tag: Kacheln, Liste und Tabelle zeigen dann nur ihn, das Diagramm bleibt.
// Seltenes (Produktart, Sortierung, Varianten, B2B, Monatsreport, CSV) steht unter „Weitere Einstellungen".

const AMZ_MAX_PRODUKTE = 8;
// Schwellen der Auffälligkeiten (drei Vorauswahlen)
const AMZ_EMPFINDLICH = {
  fein:   { minSess: 20, einbruch: 20, bb: 95 },
  normal: { minSess: 30, einbruch: 30, bb: 90 },
  grob:   { minSess: 50, einbruch: 50, bb: 80 },
};
const _vk = { daten: null, geladen: null, auswahl: new Set(), suche: '', offen: new Set(), achse: new Map(),
  sortierung: { spalte: 'sales', ab: true }, alleFunde: false, alleZeilen: false, pollT: null, tag: null };

// ── Zeitfenster ───────────────────────────────────────────────────────────────────────────
// Diagramm = Zeitraum (7/30/90 Tage, Jahr, Gesamt). Kacheln, Liste und Tabelle = gewählter Tag/Woche/Monat
// (_vk.tag), sonst ebenfalls der Zeitraum. Vergleich jeweils „gleich viele Tage direkt davor" bzw. Vorjahr.
function _amzFenster() {
  const bis = _amz.stand?.bis, ganzVon = _amz.stand?.von;
  if (!bis) return null;
  const z = _amz.ansicht.zeitraum;
  let von = z === 'gesamt' ? ganzVon : z === 'jahr' ? bis.slice(0, 4) + '-01-01' : _amzPlus(bis, -(+z - 1));
  if (von < ganzVon) von = ganzVon;
  const t = _vk.tag, sel = t || { von, bis };
  const f = { von: sel.von, bis: sel.bis, tag: t, vgl: _vkVergleich(sel.von, sel.bis, t?.art),
    diagramm: { von, bis, vgl: t ? _vkVergleich(von, bis) : null } };
  if (!t) f.diagramm.vgl = f.vgl;
  // Zu laden: Zeitraum (mind. die letzten 35 Tage für „Zu prüfen"), Auswahl und die Vergleichsfenster —
  // beim Vorjahr getrennte Fenster statt des ganzen Jahres dazwischen
  const klemm = d => (d < ganzVon ? ganzVon : d);
  const bereiche = [[klemm([von, sel.von, _amzPlus(bis, -34)].sort()[0]), bis]];
  for (const v of [f.vgl, f.diagramm.vgl]) if (v && v.bis >= ganzVon) bereiche.push([klemm(v.von), v.bis]);
  f.bereiche = _amzBereicheZusammen(bereiche);
  return f;
}
function _vkVergleich(von, bis, art = '', A = _amz.ansicht.vergleich) {
  const len = _amzTage(von, bis);
  let vgl = null;
  // Monat (Klick in der Monatsansicht): ganzer Vormonat bzw. derselbe Monat im Vorjahr; angebrochener
  // Monat → gleich viele Tage. Sonst um 364 Tage verschoben, damit die Wochentage passen.
  if (art === 'monat') {
    const voll = bis === _amzMonatsende(von), vv = A === 'vorjahr' ? (+von.slice(0, 4) - 1) + von.slice(4) : _amzPlus(von, -1).slice(0, 8) + '01';
    const ende = voll ? _amzMonatsende(vv) : _amzPlus(vv, len - 1);
    if (A !== 'aus') vgl = { von: vv, bis: ende < von ? ende : _amzPlus(von, -1), name: _t(A === 'vorjahr' ? 'Vorjahr' : 'Vormonat') };
  } else if (A === 'vorperiode') {
    vgl = { von: _amzPlus(von, -len), bis: _amzPlus(von, -1), name: len === 1 ? _t('Vortag') : len === 7 ? _t('Vorwoche') : _t('Vorige {n} Tage', { n: len }) };
  } else if (A === 'vorjahr') vgl = { von: _amzPlus(von, -364), bis: _amzPlus(bis, -364), name: _t('Vorjahr') };
  if (vgl) {
    vgl.shift = _amzTage(vgl.von, von) - 1;
    // Ein Vergleich, der vor dem ersten Datentag beginnt, wäre eine Teilsumme → ohne Prozente
    if (vgl.von < _amz.stand.von) vgl.unvollstaendig = true;
  }
  return vgl;
}
function _vkAuswahlText(t) {
  if (t.art === 'monat') return _amzMonat(t.von);
  if (t.von === t.bis) return `${_amzWochentag(t.von)}, ${_amzDatum(t.von)}`;
  return _t('Woche {von}–{bis}', { von: _amzDatumKurz(t.von), bis: _amzDatum(t.bis) });
}

// Arbeitszeilen gemäß Ansicht (nur B2B / Varianten bündeln) + Angaben je ID (Name, Bild, Art, Gruppe)
function _vkArbeitszeilen(daten = _vk.daten) {
  const { b2b, familien } = _amz.ansicht;
  const zeilen = daten.zeilen.map(z => ({
    d: z.d, asin: z.asin, id: familien ? _amzGruppeVon(z.asin) : z.asin,
    sess: b2b ? z.sessB : z.sess, pv: z.pv, units: b2b ? z.unitsB : z.units, sales: b2b ? z.salesB : z.sales, bb: b2b ? null : z.bb,
  }));
  const info = new Map();
  for (const z of zeilen) {
    if (info.has(z.id)) continue;
    if (familien) {
      const g = _amzGruppeInfo(z.id);
      info.set(z.id, { name: g.name, bild: g.bild, art: g.art, gruppe: g, kinder: g.varianten, verborgen: !g.varianten.length });
    } else {
      const p = _amzProdukt(z.asin), g = _amzGruppeInfo(_amzGruppeVon(z.asin));
      info.set(z.id, { name: g.name, zusatz: _amzVarName(z.asin), bild: p.bild || g.bild, art: g.art, verborgen: p.eltern || p.aus });
    }
  }
  return { zeilen, info };
}
// Zusatzzeile eines Produkts: Layout-Gruppe + Varianten mit Besuchen im Zeitraum (ohne Übersichtsseite/Ausgeblendete)
function _vkZusatz(i, jeAsin) {
  if (!i.gruppe) return i.zusatz;
  const g = i.gruppe, aktiv = g.varianten.filter(a => { const x = jeAsin.get(a); return x && (x.sess > 0 || x.units > 0); });
  const n = aktiv.length;
  const rest = g.varianten.length <= 1 ? (g.varianten[0] && g.varianten[0] !== g.id ? _amzVarName(g.varianten[0]) : '')
    : n === 1 ? _amzVarName(aktiv[0]) : n ? _t('{n} Varianten', { n }) : _t('keine Besuche');
  return [g.layout, rest].filter(Boolean).join(' · ');
}
const _vkLabel = (info, id) => { const i = info.get(id); return i ? [i.name, i.zusatz].filter(Boolean).join(' · ') : id; };

// ── Zu prüfen: letzte 7 Tage gegen die 28 davor ──────────────────────────────────────────
function _vkAuffaelligkeiten(zeilen, info, bis) {
  const s = AMZ_EMPFINDLICH[_amz.ansicht.empfindlich] || AMZ_EMPFINDLICH.normal;
  const rVon = _amzPlus(bis, -6), bVon = _amzPlus(rVon, -28), bBis = _amzPlus(rVon, -1);
  const jetzt = _amzJe(_amzIm(zeilen, rVon, bis)), vorher = _amzJe(_amzIm(zeilen, bVon, bBis));
  const funde = [];
  for (const [id, r] of jetzt) {
    if (info.get(id)?.verborgen) continue;
    const b = vorher.get(id), teile = [];
    let einbruch = false;
    if (b && b.sess >= s.minSess && r.sess >= Math.max(10, s.minSess / 4)) {
      if (b.conversion > 0 && r.conversion != null && (r.conversion / b.conversion - 1) * 100 <= -s.einbruch) {
        teile.push(_t('Conversion {a} → {b} %', { a: _amzZahl(b.conversion, 1), b: _amzZahl(r.conversion, 1) })); einbruch = true;
      }
      const tagB = b.sales / 28, tagR = r.sales / 7;
      if (tagB > 0 && (tagR / tagB - 1) * 100 <= -s.einbruch) { teile.push(_t('Umsatz {a} → {b} € pro Tag', { a: _amzZahl(tagB, 0), b: _amzZahl(tagR, 0) })); einbruch = true; }
    }
    if (r.sess >= 10 && r.bb != null && r.bb < s.bb) teile.push(_t('Buy-Box nur {a} %', { a: _amzZahl(r.bb, 0) }));
    if (teile.length) funde.push({ id, einbruch, text: teile.join(' · '), umsatz: b ? b.sales : 0 });
  }
  return funde.sort((a, b) => (b.einbruch - a.einbruch) || (b.umsatz - a.umsatz));
}

// ── Laden ─────────────────────────────────────────────────────────────────────────────────
async function amzVerkaeufeZeigen(neu = false) {
  const buehne = document.getElementById('amazon-buehne');
  _vkLinksBauen();
  try {
    if (neu || !_amz.stand) await _amzStandLaden();
    _vkStandZeigen();
    if (!_amz.stand.db || !_amz.stand.bis) { buehne.innerHTML = _vkLeer(); return; }
    const f = _amzFenster();
    // Nur laden, was fehlt: jedes nötige Fenster muss in einem geladenen liegen
    const abgedeckt = !neu && _vk.geladen && f.bereiche.every(([v, b]) => _vk.geladen.some(([gv, gb]) => gv <= v && gb >= b));
    if (!abgedeckt || !_amz.katalog) {
      buehne.classList.add('laedt');
      const [daten] = await Promise.all([abgedeckt ? _vk.daten : _amzDatenLadenBereiche(f.bereiche), _amzKatalogLaden(neu)]);
      _vk.daten = daten; _vk.geladen = abgedeckt ? _vk.geladen : f.bereiche;
    }
    _amzVkZeichnen();
  } catch (e) {
    buehne.innerHTML = `<div class="mb-leer">${_t('Verkaufsdaten konnten nicht geladen werden: {f}', { f: _amzEsc(e.message) })}</div>`;
  } finally { buehne.classList.remove('laedt'); }
}
function _vkLeer() {
  const s = _amz.stand || {};
  const was = !s.zugang ? _t('Die Amazon-Zugangsdaten (.env) fehlen noch auf dem Server.')
    : _t('Der Server holt die Verkaufsdaten gerade zum ersten Mal von Amazon — das dauert einige Stunden.');
  return `<div class="mb-leer"><b>${_t('Noch keine Verkaufsdaten.')}</b><br>${was}</div>`;
}
function _vkSetzen(feld, wert) {
  _amz.ansicht[feld] = wert;
  if (feld === 'b2b' || feld === 'familien' || feld === 'art') _vk.auswahl.clear();
  if (feld === 'zeitraum') _vk.tag = null;
  _amzAnsichtMerken();
  _vkWahlSetzen();
  if (feld === 'zeitraum' || feld === 'vergleich') amzVerkaeufeZeigen(); else _amzVkZeichnen();
}

// ── Tag wählen: Klick ins Diagramm (Tag, Woche oder Monat je nach Auflösung) oder Datumsfeld links ──
function _vkDiagrammKlick(k) {
  const g = _amz.ansicht.gran, s = _amz.stand;
  let von = k, bis = g === 'woche' ? _amzPlus(k, 6) : g === 'monat' ? _amzMonatsende(k) : k;
  if (von < s.von) von = s.von;
  if (bis > s.bis) bis = s.bis;
  if (_vk.tag && _vk.tag.von === von && _vk.tag.bis === bis) return _vkTagAufheben();
  _vk.tag = { von, bis, art: g };
  _vkWahlSetzen();
  amzVerkaeufeZeigen();
}
function _vkTagSetzen(d) {
  const s = _amz.stand;
  if (!d) return _vkTagAufheben();
  if (d < s.von || d > s.bis) return _amzToast(_t('Daten gibt es vom {von} bis {bis}', { von: _amzDatum(s.von), bis: _amzDatum(s.bis) }), 2500);
  // Liegt der Tag vor dem Zeitraum, den kleinsten Zeitraum nehmen, der ihn zeigt
  const ab = { 7: _amzPlus(s.bis, -6), 30: _amzPlus(s.bis, -29), 90: _amzPlus(s.bis, -89), jahr: s.bis.slice(0, 4) + '-01-01', gesamt: s.von };
  const z = _amz.ansicht.zeitraum;
  if (d < ab[z]) { _amz.ansicht.zeitraum = ['7', '30', '90', 'jahr', 'gesamt'].find(x => d >= ab[x]); _amzAnsichtMerken(); }
  _vk.tag = { von: d, bis: d, art: 'tag' };
  _vkWahlSetzen();
  amzVerkaeufeZeigen();
}
function _vkTagAufheben() { _vk.tag = null; _vkWahlSetzen(); _amzVkZeichnen(); }

// ── Abruf von Amazon anstoßen ─────────────────────────────────────────────────────────────
async function _vkAbrufStarten() {
  try { await _amzApi('/abruf', { method: 'POST' }); _amz.stand.laeuft = true; _vkStandZeigen(); _vkAbrufBeobachten(); }
  catch (e) { _amzToast('⚠ ' + e.message, 3500); }
}
function _vkAbrufBeobachten() {
  clearTimeout(_vk.pollT);
  _vk.pollT = setTimeout(async () => {
    try { await _amzStandLaden(); } catch { return; }
    if (_amz.stand.laeuft) { _vkStandZeigen(); return _vkAbrufBeobachten(); }
    _amzToast(_t('✓ Verkaufsdaten aktualisiert'));
    if (_amz.seite === 'verkaeufe') amzVerkaeufeZeigen(true);
  }, 15000);
}

// ── Linke Spalte ──────────────────────────────────────────────────────────────────────────
function _vkSeg(feld, opts) {
  return `<div class="seg amz-seg" data-feld="${feld}">${opts.map(([w, t]) =>
    `<button class="seg-b" data-wert="${w}" onclick="_vkSetzen('${feld}','${w}')">${_t(t)}</button>`).join('')}</div>`;
}
function _vkSchalter(feld, text) {
  return `<label class="amz-schalter"><span>${_t(text)}</span><span class="tgl"><input type="checkbox" class="tgl-cb"
    data-feld="${feld}" onchange="_vkSetzen('${feld}',this.checked)"/><span class="tgl-track"></span><span class="tgl-knob"></span></span></label>`;
}
function _vkLinksBauen() {
  const el = document.getElementById('amz-links-verkaeufe');
  if (!el || el.dataset.gebaut) return;
  el.dataset.gebaut = '1';
  el.innerHTML = `
    <div class="tab-kopf">
      <div class="tab-titel"><span class="tab-titel-name">${_t('Verkäufe')}</span><button class="btn btn-muted btn-xs" onclick="amzVerkaeufeZeigen(true)" title="${_t('Neu laden')}">↻</button></div>
      <div class="tab-titel-text" id="amz-stand">${_t('Lädt…')}</div>
    </div>
    <div class="scrolly amz-links-inhalt">
      <div class="sec-label">${_t('Zeitraum')}</div>
      ${_vkSeg('zeitraum', [['7', '7 T'], ['30', '30 T'], ['90', '90 T'], ['jahr', 'Jahr'], ['gesamt', 'Gesamt']])}
      <label class="amz-tag-zeile"><span>${_t('Einzelner Tag')}</span><input type="date" id="amz-tag" class="amz-datum" onchange="_vkTagSetzen(this.value)"/></label>
      <details class="amz-mehr-optionen">
        <summary>${_t('Weitere Einstellungen')}</summary>
        <div class="sec-label">${_t('Produktart')}</div>
        <div class="amz-chips" id="amz-arten"></div>
        <div class="sec-label">${_t('Produktliste sortieren nach')}</div>
        <select class="amz-auswahl amz-voll" id="amz-sortliste" onchange="_vkSetzen('sortListe',this.value)">
          ${[['umsatz', 'Umsatz'], ['wachstum', 'Größtes Wachstum'], ['verlust', 'Größter Rückgang'], ['conversion', 'Conversion'], ['sitzungen', 'Sitzungen (Besuche)']]
            .map(([w, t]) => `<option value="${w}">${_t(t)}</option>`).join('')}</select>
        <div class="amz-schalter-gruppe">${_vkSchalter('kleinWeg', 'Kleine Produkte ausblenden')}${_vkSchalter('familien', 'Varianten zusammenfassen')}${_vkSchalter('b2b', 'Nur Geschäftskunden')}</div>
        <div class="amz-hinweis">${_t('HINWEIS_KLEINE_PRODUKTE')}</div>
        <div class="sec-label">${_t('Monatsreport')}</div>
        <div class="amz-zeile"><select id="amz-monat" class="amz-auswahl"></select><button class="btn btn-muted btn-xs" onclick="_vkMonatsreport()">${_t('Herunterladen')}</button></div>
        <div class="amz-zeile"><button class="btn btn-muted btn-xs" onclick="_vkCsv()">${_t('Tageswerte als CSV')}</button></div>
      </details>
      <div class="sec-label amz-prod-kopf"><span>${_t('Produkte')}</span><span class="amz-knopfpaar"><button class="btn btn-muted btn-xs" id="amz-alle" onclick="_vkAlle()" title="${_t('Keine Auswahl: alles zusammen')}">${_t('Alle')}</button><button class="btn btn-muted btn-xs" id="amz-top5" onclick="_vkTop5()" title="${_t('Die 5 umsatzstärksten Produkte')}">Top 5</button></span></div>
      <input type="search" class="amz-suche" placeholder="${_t('Produkt suchen…')}" oninput="_vkSuchen(this.value)"/>
      <div id="amz-produktliste" class="amz-produktliste"></div>
    </div>`;
  _vkWahlSetzen();
}
function _vkWahlSetzen() {
  document.querySelectorAll('#amz-links-verkaeufe .amz-seg').forEach(s =>
    s.querySelectorAll('.seg-b').forEach(b => b.classList.toggle('an', String(_amz.ansicht[s.dataset.feld]) === b.dataset.wert)));
  document.querySelectorAll('#amz-links-verkaeufe .tgl-cb').forEach(cb => { cb.checked = !!_amz.ansicht[cb.dataset.feld]; });
  const sort = document.getElementById('amz-sortliste');
  if (sort) sort.value = _amz.ansicht.sortListe;
  const tag = document.getElementById('amz-tag');
  if (tag) {
    if (_amz.stand?.bis) { tag.min = _amz.stand.von; tag.max = _amz.stand.bis; }
    tag.value = _vk.tag?.art === 'tag' ? _vk.tag.von : '';
  }
}
function _vkStandZeigen() {
  const s = _amz.stand || {}, el = document.getElementById('amz-stand');
  if (!el) return;
  const z = [];
  if (s.bis) z.push(_t('Daten bis {d} (Amazon liefert 2 Tage später)', { d: `<b>${_amzDatum(s.bis)}</b>` }));
  if (!s.zugang) z.push(`<span class="amz-warn">${_t('Zugangsdaten (.env) fehlen auf dem Server')}</span>`);
  if (s.fehler) z.push(`<span class="amz-warn">${_t('{n} Tag(e) noch nicht geholt — der nächste Abruf versucht es erneut', { n: s.fehler })}</span>`);
  if (s.laeuft) z.push(`<span class="amz-laeuft">${_t('Abruf von Amazon läuft …')}</span>`);
  else if (s.zugang && s.rolle !== 'freelancer') z.push(`<a href="#" class="amz-link" onclick="_vkAbrufStarten();return false">${_t('Jetzt von Amazon holen')}</a>`);
  el.innerHTML = z.join('<br>');
  if (s.laeuft) _vkAbrufBeobachten();
  _vkWahlSetzen();
  const sel = document.getElementById('amz-monat');
  if (sel && s.von && s.bis && !sel.options.length) {
    for (let m = s.bis.slice(0, 7); m >= s.von.slice(0, 7); m = _amzPlus(m + '-01', -1).slice(0, 7)) sel.add(new Option(_amzMonat(m + '-01'), m));
  }
}

// ── Auswahl ───────────────────────────────────────────────────────────────────────────────
function _vkAlle() { _vk.auswahl.clear(); _amzVkZeichnen(); }
let _vkSuchT = null;
function _vkSuchen(text) { _vk.suche = text; clearTimeout(_vkSuchT); _vkSuchT = setTimeout(() => _vkProduktliste(), 120); }
function _vkTop5() { _vk.auswahl = new Set((_vk.rang || []).slice(0, 5)); _amzVkZeichnen(); }
function _vkProdukt(id, nurDazu = false) {
  if (_vk.auswahl.has(id)) { if (!nurDazu) _vk.auswahl.delete(id); }
  else if (_vk.auswahl.size < AMZ_MAX_PRODUKTE) _vk.auswahl.add(id);
  else return _amzToast(_t('Höchstens {n} Produkte auf einmal', { n: AMZ_MAX_PRODUKTE }));
  _amzVkZeichnen();
  if (nurDazu) document.getElementById('amazon-buehne')?.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── Bühne ─────────────────────────────────────────────────────────────────────────────────
function _amzVkZeichnen() {
  if (!_vk.daten || !_amz.katalog || !_amz.stand?.bis) return;
  const f = _amzFenster(), A = _amz.ansicht, D = f.diagramm;
  const { zeilen: alleZeilen, info } = _vkArbeitszeilen();
  _vkArtenZeigen(_amzIm(alleZeilen, f.von, f.bis), info);
  if (A.art && ![...info.values()].some(i => i.art === A.art)) A.art = '';
  const zeilen = A.art ? alleZeilen.filter(z => info.get(z.id)?.art === A.art) : alleZeilen;
  const jetztAlle = _amzIm(zeilen, f.von, f.bis), vglAlle = f.vgl ? _amzIm(zeilen, f.vgl.von, f.vgl.bis) : [];
  const jeProdukt = _amzJe(jetztAlle), jeProduktVgl = _amzJe(vglAlle), jeAsin = _amzJe(jetztAlle, 'asin');
  for (const [id, i] of info) if (i.gruppe) i.zusatz = _vkZusatz(i, jeAsin);
  // Auswahl auf vorhandene Produkte beschränken (nach Zeitraumwechsel kann eines fehlen)
  for (const id of [..._vk.auswahl]) if (!info.has(id)) _vk.auswahl.delete(id);
  const mitAuswahl = _vk.auswahl.size > 0;
  const rang = [...jeProdukt].filter(([id]) => !info.get(id)?.verborgen).sort((a, b) => b[1].sales - a[1].sales).map(([id]) => id);
  _vk.rang = rang;
  const gewaehlt = rang.filter(id => _vk.auswahl.has(id)).concat([..._vk.auswahl].filter(id => !rang.includes(id)));
  const farbe = new Map(gewaehlt.map((id, i) => [id, AMZ_FARBEN[i % AMZ_FARBEN.length]]));
  const imFilter = z => !mitAuswahl || _vk.auswahl.has(z.id);
  const jetztZ = jetztAlle.filter(imFilter), vglZ = vglAlle.filter(imFilter);
  const mitVgl = !!f.vgl && !f.vgl.unvollstaendig;
  // Liste links: gewählte zuerst (auch ohne Umsatz im Zeitraum — sonst wären sie nicht abwählbar), dann nach Wahl sortiert
  const klein = id => A.kleinWeg && (jeProdukt.get(id)?.sess || 0) < 20 && !_vk.auswahl.has(id);
  // Wachstum/Rückgang erst ab 50 € im Vergleich — sonst stünden +400 % aus 5 € Umsatz ganz oben
  const dPct = id => { const a = jeProdukt.get(id)?.sales || 0, b = jeProduktVgl.get(id)?.sales; return mitVgl && b >= 50 ? (a / b - 1) * 100 : null; };
  const sortWert = { umsatz: id => jeProdukt.get(id)?.sales, conversion: id => jeProdukt.get(id)?.conversion, sitzungen: id => jeProdukt.get(id)?.sess,
    wachstum: dPct, verlust: id => { const d = dPct(id); return d == null ? null : -d; } }[A.sortListe] || (id => jeProdukt.get(id)?.sales);
  const sortiert = rang.filter(id => !_vk.auswahl.has(id) && !klein(id))
    .sort((a, b) => (sortWert(b) ?? -Infinity) - (sortWert(a) ?? -Infinity));
  _vk.listeCtx = { reihenfolge: [...gewaehlt, ...sortiert], jeProdukt, info, farbe, dPct, sort: A.sortListe };
  _vkProduktliste();
  document.getElementById('amz-alle')?.classList.toggle('btn-umriss', !mitAuswahl);
  const top5 = rang.slice(0, 5);
  document.getElementById('amz-top5')?.classList.toggle('btn-umriss', mitAuswahl && _vk.auswahl.size === top5.length && top5.every(id => _vk.auswahl.has(id)));

  const k = AMZ_KENNZAHLEN[A.kennzahl] || AMZ_KENNZAHLEN.sales;
  const funde = _vkAuffaelligkeiten(zeilen, info, _amz.stand.bis);
  const was = mitAuswahl
    ? `${gewaehlt.length === 1 ? _amzEsc(info.get(gewaehlt[0])?.name || gewaehlt[0]) : _t('{n} Produkte ausgewählt', { n: gewaehlt.length })} · <a href="#" class="amz-link" onclick="_vkAlle();return false">${_t('alle zeigen')}</a>`
    : (A.art ? _t('Alle {art}', { art: _amzEsc(_t(A.art)) }) : _t('Alle Produkte'));
  // Beschriftung des Knopfs „Zeitraum davor" — unabhängig davon, welcher Vergleich gerade gewählt ist
  const vglKurz = f.tag ? _vkVergleich(f.von, f.bis, f.tag.art, 'vorperiode').name
    : _t({ 7: 'Vorwoche', 30: 'Vorige 30 T', 90: 'Vorige 90 T' }[A.zeitraum] || 'Zeitraum davor');
  document.getElementById('amazon-buehne').innerHTML = `
    <div class="amz-kopf"><div class="tab-titel-name">${was}</div>
      <div class="amz-kopf-zeit">${f.tag ? `<b>${_vkAuswahlText(f.tag)}</b>` : `${_amzDatum(f.von)} – ${_amzDatum(f.bis)}`}${mitVgl ? ` · ${f.vgl.name} ${f.vgl.von === f.vgl.bis ? _amzDatum(f.vgl.von) : `${_amzDatum(f.vgl.von)} – ${_amzDatum(f.vgl.bis)}`}` : ''}</div>
      ${f.tag ? `<span class="amz-filter-chip blau">${_t(f.tag.art === 'monat' ? 'Nur dieser Monat' : f.tag.von === f.tag.bis ? 'Nur dieser Tag' : 'Nur diese Woche')} <a href="#" onclick="_vkTagAufheben();return false">${_t('ganzen Zeitraum zeigen')}</a></span>` : ''}
      ${A.art ? `<span class="amz-filter-chip">${_t('Nur {art}', { art: _amzEsc(_t(A.art)) })} <a href="#" onclick="_vkSetzen('art','');return false">${_t('aufheben')}</a></span>` : ''}
      ${A.b2b ? `<span class="amz-filter-chip">${_t('Nur Geschäftskunden — Privatkunden fehlen')} <a href="#" onclick="_vkSetzen('b2b',false);return false">${_t('ausschalten')}</a></span>` : ''}</div>
    ${_amzKacheln(_amzSumme(jetztZ), mitVgl ? _amzSumme(vglZ) : null, { vglName: f.vgl?.name || '', unvollstaendig: f.vgl?.unvollstaendig })}
    <div class="amz-karte">
      <div class="amz-karte-kopf"><div class="seg amz-seg">${Object.entries(AMZ_KENNZAHLEN).map(([w, kz]) =>
        `<button class="seg-b${A.kennzahl === w ? ' an' : ''}" onclick="_vkSetzen('kennzahl','${w}')">${_t(kz.name)}</button>`).join('')}</div>
        <div class="seg amz-seg amz-rechts" title="${_t('Auflösung des Diagramms')}">${[['tag', 'Tag'], ['woche', 'Woche'], ['monat', 'Monat']].map(([w, t]) =>
        `<button class="seg-b${A.gran === w ? ' an' : ''}" onclick="_vkSetzen('gran','${w}')">${_t(t)}</button>`).join('')}</div></div>
      <div class="amz-diagramm" id="amz-diagramm"></div>
      <div class="amz-karte-fuss">
        <div class="amz-legende">${mitAuswahl ? gewaehlt.map(id => `<span><i style="background:${farbe.get(id)}"></i>${_amzEsc(_vkLabel(info, id))}</span>`).join('')
          : `<span><i style="background:${AMZ_FARBEN[0]}"></i>${_t('Alle Produkte')}</span>`}
          ${D.vgl && !D.vgl.unvollstaendig ? `<span class="amz-legende-vgl"><i></i>${_t('gestrichelt = {name}', { name: D.vgl.name })}</span>` : ''}
          <span class="amz-legende-tipp">${_t('Klick ins Diagramm zeigt nur {was}', { was: _t({ tag: 'diesen Tag', woche: 'diese Woche', monat: 'diesen Monat' }[A.gran]) })}</span></div>
        <div class="amz-vgl-wahl"><span>${_t('Vergleichen mit')}</span><div class="seg amz-seg">${[['vorperiode', vglKurz], ['vorjahr', _t('Vorjahr')], ['aus', _t('Aus')]].map(([w, t]) =>
          `<button class="seg-b${A.vergleich === w ? ' an' : ''}" onclick="_vkSetzen('vergleich','${w}')">${t}</button>`).join('')}</div></div>
      </div>
      ${k.hinweis ? `<div class="amz-hinweis">${_t(k.hinweis)}</div>` : ''}
    </div>
    <div class="amz-abschnitt-kopf"><div class="ov-sec-title">${_t('Zu prüfen · letzte 7 Tage gegen die 4 Wochen davor')}${funde.length ? ' · ' + funde.length : ''}</div>
      <div class="seg amz-seg" title="${_t('Wie empfindlich „Zu prüfen" meldet')}">${[['fein', 'Mehr melden'], ['normal', 'Normal'], ['grob', 'Nur Grobes']].map(([w, t]) =>
        `<button class="seg-b${A.empfindlich === w ? ' an' : ''}" onclick="_vkSetzen('empfindlich','${w}')">${_t(t)}</button>`).join('')}</div></div>
    <div class="ov-pruef">${funde.length ? funde.slice(0, _vk.alleFunde ? funde.length : 3).map(x => `<div class="ov-pruef-zeile kopierbar amz-fund${x.einbruch ? ' fehler' : ''}"
        data-id="${_amzEsc(x.id)}" onclick="_vkProdukt(this.dataset.id, true)" title="${_t('Klick wählt das Produkt aus')}">${_amzBild(info.get(x.id), true)}
        <span><b>${_amzEsc(info.get(x.id)?.name || x.id)}</b> · ${x.text}</span></div>`).join('')
        + (funde.length > 3 ? `<button class="btn btn-muted btn-xs amz-mehr" onclick="_vk.alleFunde=!_vk.alleFunde;_amzVkZeichnen()">${_vk.alleFunde ? _t('weniger') : _t('alle {n} zeigen', { n: funde.length })}</button>` : '')
      : `<div class="ov-pruef-leer">${_t('✓ Keine Einbrüche bei Conversion, Umsatz oder Buy-Box')}</div>`}</div>
    <div class="ov-sec-title">${f.tag ? (f.tag.von === f.tag.bis ? _t('Produkte am {d}', { d: _amzDatum(f.tag.von) }) : _t('Produkte in der Auswahl')) : _t('Produkte im Zeitraum')} · ${_t('Klick wählt aus')}</div>
    <div class="amz-karte amz-tabelle-rahmen" id="amz-tabelle"></div>
`;

  // Diagramm (Zeitraum): ohne Auswahl EINE Linie (alle Produkte), mit Auswahl je Produkt eine
  const dJetzt = _amzIm(zeilen, D.von, D.bis).filter(imFilter);
  const dVglMit = D.vgl && !D.vgl.unvollstaendig, dVgl = dVglMit ? _amzIm(zeilen, D.vgl.von, D.vgl.bis).filter(imFilter) : [];
  const schluessel = [];
  for (let d = D.von; d <= D.bis; d = _amzPlus(d, 1)) { const s = _amzSchluessel(d, A.gran); if (schluessel[schluessel.length - 1] !== s) schluessel.push(s); }
  const reihe = (zs, idFeld) => {
    const m = new Map();
    for (const e of _amzBuendeln(zs, A.gran, idFeld)) { if (!m.has(e.id)) m.set(e.id, new Map()); m.get(e.id).set(e.k, e[A.kennzahl]); }
    return m;
  };
  const verschoben = zs => zs.map(z => ({ ...z, d: _amzPlus(z.d, D.vgl.shift) }));
  let serien;
  if (mitAuswahl) {
    const jr = reihe(dJetzt, 'id'), vr = dVglMit ? reihe(verschoben(dVgl), 'id') : new Map();
    serien = gewaehlt.map(id => ({ name: _vkLabel(info, id), farbe: farbe.get(id), werte: jr.get(id) || new Map(), vgl: vr.get(id) }));
  } else {
    const jr = reihe(dJetzt, null), vr = dVglMit ? reihe(verschoben(dVgl), null) : new Map();
    serien = [{ name: _t('Alle Produkte'), farbe: AMZ_FARBEN[0], werte: jr.get(null) || new Map(), vgl: dVglMit ? (vr.get(null) || new Map()) : undefined }];
  }
  _amzLinien(document.getElementById('amz-diagramm'), { schluessel, gran: A.gran, dez: k.dez, einheit: k.einheit, serien,
    auswahl: f.tag ? { von: f.tag.von, bis: f.tag.bis } : null, beiKlick: _vkDiagrammKlick });

  _vkTabelle(rang.filter(id => !klein(id)), jeProdukt, jeProduktVgl, info, farbe, _amzSumme(jetztAlle).conversion, mitVgl,
    { je: jeAsin, vgl: _amzJe(vglAlle, 'asin') });
}

function _vkArtenZeigen(periode, info) {
  const el = document.getElementById('amz-arten');
  if (!el) return;
  const um = new Map();
  for (const z of periode) { const art = info.get(z.id)?.art || 'Sonstige'; um.set(art, (um.get(art) || 0) + z.sales); }
  const arten = [...um].sort((a, b) => b[1] - a[1]).map(([art]) => art);
  const knopf = (wert, text) => `<button class="amz-chip${(_amz.ansicht.art || '') === wert ? ' an' : ''}" onclick="_vkSetzen('art','${_amzEsc(wert)}')">${_amzEsc(_t(text))}</button>`;
  el.innerHTML = knopf('', 'Alle') + arten.map(a => knopf(a, a)).join('');
}
function _vkProduktliste() {
  const el = document.getElementById('amz-produktliste'), c = _vk.listeCtx;
  if (!el || !c) return;
  const q = _vk.suche.trim().toLowerCase();
  // Suche findet auch Variantennamen („K01_Blau") und ASINs der Varianten eines Produkts
  const passt = id => !q || _vkLabel(c.info, id).toLowerCase().includes(q) || String(id).toLowerCase().includes(q)
    || (c.info.get(id)?.kinder || []).some(a => a.toLowerCase().includes(q) || _amzVarName(a).toLowerCase().includes(q));
  const wert = id => {
    if (c.sort === 'wachstum' || c.sort === 'verlust') { const d = c.dPct(id); return d == null ? '–' : `<span class="${d >= 0 ? 'plus' : 'minus'}">${_amzVz(d, 0, ' %')}</span>`; }
    if (c.sort === 'conversion') return _amzZahl(c.jeProdukt.get(id)?.conversion, 1, ' %');
    if (c.sort === 'sitzungen') return _amzZahl(c.jeProdukt.get(id)?.sess);
    return _amzZahl(c.jeProdukt.get(id)?.sales, 0, ' €');
  };
  el.innerHTML = c.reihenfolge.filter(passt).map(id => {
    const an = c.farbe.has(id), i = c.info.get(id);
    const kn = (i?.kinder || []).map(_amzVarName);
    return `<button class="amz-prod${an ? ' gewaehlt' : ''}" data-id="${_amzEsc(id)}" onclick="_vkProdukt(this.dataset.id)" title="${_amzEsc(_vkLabel(c.info, id) + (kn.length > 1 ? '\n' + _t('Varianten') + ': ' + kn.slice(0, 12).join(', ') + (kn.length > 12 ? ' …' : '') : ''))}"
      style="${an ? '--farbe:' + c.farbe.get(id) : ''}">${_amzBild(i)}
      <span class="amz-prod-text"><span class="amz-prod-name">${_amzEsc(i?.name || id)}</span><span class="amz-prod-zusatz">${_amzEsc(i?.zusatz || '')}</span></span>
      <span class="amz-prod-wert">${wert(id)}</span></button>`;
  }).join('') || `<div class="amz-hinweis">${_t(q ? 'Kein Produkt gefunden.' : 'Keine Verkäufe im Zeitraum.')}</div>`;
}

// ── Tabelle ───────────────────────────────────────────────────────────────────────────────
function _vkTabelle(rang, jeProdukt, jeProduktVgl, info, farbe, kontoConv, mitVgl, kind) {
  const zeilen = rang.map(id => {
    const p = jeProdukt.get(id), v = jeProduktVgl.get(id);
    return { id, name: info.get(id)?.name || id, sess: p.sess, sales: p.sales, conversion: p.conversion,
      dPct: mitVgl && v?.sales > 0 ? (p.sales / v.sales - 1) * 100 : null };
  });
  // „viel Traffic, schwache Conversion": mindestens Median-Traffic, Conversion unter der Hälfte des Durchschnitts
  const s = zeilen.map(z => z.sess).filter(x => x > 0).sort((a, b) => a - b);
  const median = s.length ? (s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2) : 0;
  for (const z of zeilen) z.schwach = z.sess >= median && z.conversion != null && kontoConv && z.conversion < kontoConv * 0.5;
  const { spalte, ab } = _vk.sortierung;
  const wert = z => z[spalte] ?? -Infinity;
  zeilen.sort((a, b) => (spalte === 'name' ? a.name.localeCompare(b.name) : wert(a) - wert(b)) * (ab ? -1 : 1));
  const sp = [['name', 'Produkt'], ['sales', 'Umsatz'], ...(mitVgl ? [['dPct', 'ggü. Vergleich']] : []), ['sess', 'Sitzungen'], ['conversion', 'Conversion']].map(([x, t]) => [x, _t(t)]);
  const pfeil = x => x === spalte ? (ab ? ' ↓' : ' ↑') : '';
  const sichtbar = _vk.alleZeilen ? zeilen : zeilen.slice(0, 12);
  document.getElementById('amz-tabelle').innerHTML = `<table class="amz-tabelle"><thead><tr>${sp.map(([x, t]) =>
    `<th class="${x === 'name' ? 'txt' : ''}" onclick="_vkSortieren('${x}')">${t}${pfeil(x)}</th>`).join('')}</tr></thead><tbody>${sichtbar.map(z => {
    const i = info.get(z.id), mehrere = (i?.gruppe?.varianten.length || 0) > 1;
    return `
    <tr class="${farbe.has(z.id) ? 'gewaehlt' : ''}" data-id="${_amzEsc(z.id)}" onclick="_vkProdukt(this.dataset.id)" style="${farbe.has(z.id) ? '--farbe:' + farbe.get(z.id) : ''}">
      <td class="txt"><div class="amz-zelle-prod">${_amzBild(i, true)}<span><span class="amz-prod-name">${_amzEsc(z.name)}</span>
        <span class="amz-prod-zusatz">${mehrere
          ? `<button class="amz-aufklapp" data-id="${_amzEsc(z.id)}" onclick="event.stopPropagation();_vkAufklappen(this.dataset.id)">${_vk.offen.has(z.id) ? '▾' : '▸'} ${_amzEsc(i.zusatz)}</button>`
          : _amzEsc(i?.zusatz || '')}${z.schwach ? ` · <span class="amz-marke" title="${_t('Mindestens mittlerer Traffic, aber Conversion unter der Hälfte des Durchschnitts')}">${_t('viel Traffic, schwache Conversion')}</span>` : ''}</span></span></div></td>
      <td>${_amzZahl(z.sales, 0, ' €')}</td>
      ${mitVgl ? `<td>${z.dPct == null ? '–' : `<span class="${z.dPct >= 0 ? 'plus' : 'minus'}">${_amzVz(z.dPct, 1, ' %')}</span>`}</td>` : ''}
      <td>${_amzZahl(z.sess)}</td><td>${_amzZahl(z.conversion, 2, ' %')}</td></tr>
      ${_vk.offen.has(z.id) && mehrere ? _vkKindZeilen(i.gruppe, kind, mitVgl, sp.length) : ''}`;
  }).join('')}</tbody></table>
    ${zeilen.length > 12 ? `<div class="amz-tabelle-fuss"><button class="btn btn-muted btn-xs" onclick="_vk.alleZeilen=!_vk.alleZeilen;_amzVkZeichnen()">${_vk.alleZeilen ? _t('weniger zeigen') : _t('alle {n} Produkte zeigen', { n: zeilen.length })}</button></div>` : ''}`;
}
// Aufgeklapptes Produkt: Varianten einzeln oder nach Farbe/Menge/Version zusammengefasst (bei vielen Varianten
// Standard: nach dem ersten Merkmal — K01 hat 11 Farben × 7 Mengen). Einzelne Variante anklicken = nur sie ansehen.
function _vkKindZeilen(g, kind, mitVgl, spalten) {
  const achse = _vk.achse.get(g.id) || (g.varianten.length > 10 && g.achsen.length ? g.achsen[0] : 'einzeln');
  const summe = asins => _amzSumme(asins.map(a => kind.je.get(a)).filter(Boolean)), summeV = asins => _amzSumme(asins.map(a => kind.vgl.get(a)).filter(Boolean));
  let gruppen;
  if (achse === 'einzeln') gruppen = g.varianten.map(a => ({ name: _amzVarName(a), asin: a, asins: [a] }));
  else {
    const m = new Map();
    for (const a of g.varianten) { const w = _amzProdukt(a).merkmale[achse] || (_amzProdukt(a).variante ? '–' : 'ohne Layoutname'); if (!m.has(w)) m.set(w, []); m.get(w).push(a); }
    gruppen = [...m].map(([wert, asins]) => ({ name: _amzWert(wert), wert, asins }));
  }
  for (const r of gruppen) { r.x = summe(r.asins); r.v = summeV(r.asins); }
  const aktiv = r => r.x.sess > 0 || r.x.units > 0 || r.v.sess > 0;
  const zahl = s => parseInt(s, 10) || 0;
  const zeigen = gruppen.filter(aktiv).sort(achse === 'menge' ? (a, b) => zahl(a.wert) - zahl(b.wert) : (a, b) => b.x.sales - a.x.sales);
  const ruhen = gruppen.length - zeigen.length;
  // Übersichtsseite und ausgeblendete Varianten: Besuche zählen im Produkt mit, hier als eine Zeile
  const rest = g.kinder.filter(a => !g.varianten.includes(a)), restX = summe(rest);
  const zeile = (name, zusatz, x, v, klick, titel = '') => {
    const d = mitVgl && v?.sales > 0 ? (x.sales / v.sales - 1) * 100 : null;
    return `<tr class="amz-kind${klick ? '' : ' still'}"${klick ? ` onclick="${klick}" title="${_t('Nur diese Variante ansehen')}"` : titel ? ` title="${_amzEsc(titel)}"` : ''}>
      <td class="txt"><span class="amz-kind-name">${_amzEsc(name)}</span> <span class="amz-prod-zusatz">${_amzEsc(zusatz)}</span></td>
      <td>${_amzZahl(x.sales, 0, ' €')}</td>
      ${mitVgl ? `<td>${d == null ? '–' : `<span class="${d >= 0 ? 'plus' : 'minus'}">${_amzVz(d, 1, ' %')}</span>`}</td>` : ''}
      <td>${_amzZahl(x.sess)}</td><td>${_amzZahl(x.conversion, 2, ' %')}</td></tr>`;
  };
  const wahl = g.achsen.length ? `<tr class="amz-kind still"><td colspan="${spalten}" class="txt"><span class="amz-kind-wahl">${_t('Varianten')} ${['einzeln', ...g.achsen].map(a =>
    `<button class="amz-chip${a === achse ? ' an' : ''}" data-id="${_amzEsc(g.id)}" onclick="event.stopPropagation();_vkAchse(this.dataset.id,'${a}')">${a === 'einzeln' ? _t('einzeln') : _t('nach {achse}', { achse: AMZ_ACHSEN_NAME[a](g) })}</button>`).join('')}</span></td></tr>` : '';
  return wahl + zeigen.map(r => r.asin
    ? zeile(r.name, r.asin, r.x, r.v, `_vkVarianteZeigen('${r.asin}')`)
    : zeile(r.name, _t('{n} Varianten', { n: r.asins.length }), r.x, r.v, '', r.asins.map(_amzVarName).join(', '))).join('')
    + (ruhen ? `<tr class="amz-kind still"><td colspan="${spalten}" class="txt"><span class="amz-prod-zusatz">${_t('{n} ohne Besuche im Zeitraum', { n: ruhen })}</span></td></tr>` : '')
    + (restX.sess > 0 || restX.sales > 0 ? zeile(_t('Übersichtsseite / ausgeblendet'), `${rest.length} ASIN${rest.length === 1 ? '' : 's'}`, restX, summeV(rest), '', rest.map(_amzVarName).join(', ')) : '');
}
function _vkAchse(id, achse) { _vk.achse.set(id, achse); _amzVkZeichnen(); }
function _vkAufklappen(id) { _vk.offen.has(id) ? _vk.offen.delete(id) : _vk.offen.add(id); _amzVkZeichnen(); }
function _vkVarianteZeigen(asin) {
  _amz.ansicht.familien = false; _amzAnsichtMerken(); _vkWahlSetzen();
  _vk.auswahl = new Set([asin]); _vk.offen.clear();
  _amzVkZeichnen();
  document.getElementById('amazon-buehne')?.scrollTo({ top: 0, behavior: 'smooth' });
  _amzToast(_t('Varianten einzeln — „Varianten zusammenfassen" ist jetzt aus'));
}
function _vkSortieren(s) {
  _vk.sortierung = _vk.sortierung.spalte === s ? { spalte: s, ab: !_vk.sortierung.ab } : { spalte: s, ab: s !== 'name' };
  _amzVkZeichnen();
}

// ── CSV der Tageswerte im Zeitraum bzw. am gewählten Tag (Excel: ; und Komma) ────────────
function _vkCsv() {
  const f = _amzFenster(), { zeilen, info } = _vkArbeitszeilen();
  const tage = _amzBuendeln(_amzIm(zeilen, f.von, f.bis), 'tag').sort((a, b) => a.k < b.k ? -1 : a.k > b.k ? 1 : _vkLabel(info, a.id).localeCompare(_vkLabel(info, b.id)));
  // Deutsches Excel: „;" und Dezimalkomma; englisch: „," und Punkt
  const en = _amzEn(), trenn = en ? ',' : ';';
  const z = (v, d) => v == null ? '' : en ? v.toFixed(d) : v.toFixed(d).replace('.', ',');
  const q = s => '"' + String(s).replace(/"/g, '""') + '"';
  const csv = [(en ? ['Date', 'Product', 'ID', 'Sessions', 'Page views', 'Units', 'Sales', 'Buy Box %', 'Conversion %', 'Avg. price']
    : ['Datum', 'Produkt', 'ID', 'Sitzungen', 'Seitenaufrufe', 'Einheiten', 'Umsatz', 'Buy-Box %', 'Conversion %', 'Ø Preis']).join(trenn),
    ...tage.map(e => [e.k, q(info.get(e.id)?.name || e.id), e.id, e.sess, e.pv, e.units, z(e.sales, 2), z(e.bb, 1), z(e.conversion, 2), z(e.price, 2)].join(trenn))].join('\r\n');
  _amzDownload(`verkaeufe_${f.von}_${f.bis}.csv`, '﻿' + csv, 'text/csv;charset=utf-8');
}

// ── Monatsreport (eigenständige HTML-Datei) ──────────────────────────────────────────────
async function _vkMonatsreport() {
  const monat = document.getElementById('amz-monat')?.value;
  if (!monat) return;
  const vorMonat = _amzPlus(monat + '-01', -1).slice(0, 7);
  let daten;
  try { daten = await _amzDatenLaden(vorMonat + '-01', _amzMonatsende(monat + '-01')); } catch (e) { return _amzToast('⚠ ' + e.message, 3500); }
  const { zeilen, info } = _vkArbeitszeilen(daten);
  const name = id => _amzEsc(info.get(id)?.name || id);
  // Laufender Monat: gegen gleich viele Tage des Vormonats — sonst stünde er immer mit einem scheinbaren Einbruch da
  const ende = _amzMonatsende(monat + '-01'), bis = _amz.stand.bis < ende ? _amz.stand.bis : ende, laeuft = bis < ende;
  const vEnde = _amzMonatsende(vorMonat + '-01'), vBisT = _amzPlus(vorMonat + '-01', +bis.slice(8, 10) - 1);
  const vBis = laeuft && vBisT < vEnde ? vBisT : vEnde;
  const cur = zeilen.filter(z => z.d.startsWith(monat)), prv = zeilen.filter(z => z.d.startsWith(vorMonat) && z.d <= vBis);
  const kc = _amzSumme(cur), kp = _amzSumme(prv);
  const kpis = [['Umsatz', 'sales', 2, ' €'], ['Einheiten', 'units', 0, ''], ['Sitzungen', 'sess', 0, ''], ['Conversion', 'conversion', 2, ' %']].map(([n, f, dez, ein]) => {
    n = _t(n);
    const d = kp[f] ? (kc[f] / kp[f] - 1) * 100 : null;
    return `<tr><td>${n}</td><td>${_amzZahl(kc[f], dez, ein)}</td><td>${prv.length ? _amzZahl(kp[f], dez, ein) : '–'}</td>
      <td style="color:${d == null ? 'inherit' : d >= 0 ? '#008300' : '#e34948'}">${prv.length ? _amzVz(d, 1, ' %') : '–'}</td></tr>`;
  }).join('');
  const jc = _amzJe(cur), jp = _amzJe(prv);
  const top = [...jc].sort((a, b) => b[1].sales - a[1].sales).slice(0, 10).map(([id, p]) =>
    `<tr><td>${name(id)}</td><td>${_amzZahl(p.sales, 2, ' €')}</td><td>${_amzZahl(p.units)}</td><td>${_amzZahl(p.sess)}</td><td>${_amzZahl(p.conversion, 2, ' %')}</td></tr>`).join('');
  // Größte Bewegungen: je bis zu 5 Gewinner und Verlierer — jedes Produkt nur einmal
  const bew = [...new Set([...jc.keys(), ...jp.keys()])].map(id => ({ id, cur: jc.get(id)?.sales || 0, prv: jp.get(id)?.sales || 0 }))
    .map(b => ({ ...b, d: b.cur - b.prv }));
  const gewinner = bew.filter(b => b.d > 0).sort((a, b) => b.d - a.d).slice(0, 5);
  const verlierer = bew.filter(b => b.d < 0).sort((a, b) => a.d - b.d).slice(0, 5);
  const bewZeilen = [...gewinner, ...verlierer].map(b => `<tr><td>${name(b.id)}</td><td>${_amzZahl(b.prv, 2, ' €')}</td><td>${_amzZahl(b.cur, 2, ' €')}</td>
    <td style="color:${b.d >= 0 ? '#008300' : '#e34948'}">${_amzVz(b.d, 2, ' €')}</td></tr>`).join('');
  const titel = _amzMonat(monat + '-01'), vTitel = _amzMonat(vorMonat + '-01');
  const rt = _t('Amazon-Monatsreport {m}', { m: titel });
  const html = `<!doctype html><html lang="${_amzEn() ? 'en' : 'de'}"><head><meta charset="utf-8"><title>${rt}</title><style>
    body{font-family:-apple-system,'Segoe UI',sans-serif;max-width:860px;margin:2rem auto;padding:0 16px;color:#1f1e1c}
    table{border-collapse:collapse;width:100%;margin:.8rem 0 1.6rem}th,td{border-bottom:1px solid #e1e0d9;padding:6px 10px;text-align:left;font-size:14px}
    th{color:#898781;font-weight:600}h1{font-size:22px}h2{font-size:16px;margin-top:1.6rem}p{color:#898781;font-size:13px}</style></head><body>
    <h1>${rt}</h1><p>${laeuft ? _t('Monat läuft noch — verglichen werden {von}–{bis} mit {vvon}–{vbis}.', { von: _amzDatum(monat + '-01'), bis: _amzDatum(bis), vvon: _amzDatum(vorMonat + '-01'), vbis: _amzDatum(vBis) }) + ' · ' : ''}${_amz.ansicht.b2b ? _t('Nur Geschäftskunden') + ' · ' : ''}${_amz.ansicht.familien ? _t('Varianten zusammengefasst') + ' · ' : ''}${_t('erstellt {d}', { d: _amzDatum(_amzHeute()) })}</p>
    <h2>${_t('Kennzahlen (gegen {m})', { m: vTitel })}</h2><table><tr><th>${_t('Kennzahl')}</th><th>${titel}</th><th>${vTitel}</th><th>Δ</th></tr>${kpis}</table>
    <h2>${_t('Top 10 nach Umsatz')}</h2><table><tr><th>${_t('Produkt')}</th><th>${_t('Umsatz')}</th><th>${_t('Einheiten')}</th><th>${_t('Sitzungen')}</th><th>Conversion</th></tr>${top}</table>
    <h2>${_t('Größte Bewegungen (Umsatz gegen {m})', { m: vTitel })}</h2><table><tr><th>${_t('Produkt')}</th><th>${vTitel}</th><th>${titel}</th><th>Δ</th></tr>${bewZeilen || '<tr><td colspan="4">–</td></tr>'}</table>
    </body></html>`;
  _amzDownload(`amazon-monatsreport_${monat}.html`, html, 'text/html;charset=utf-8');
}
