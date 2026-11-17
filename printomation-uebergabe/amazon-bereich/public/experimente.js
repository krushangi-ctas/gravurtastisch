// ── Amazon → Experimente ───────────────────────────────────────────────────────────────────────
// Änderung eintragen → Wirkung messen. Gedacht auch für Freelancer und Mitarbeiter: oben steht in
// einem Satz, ob es gewirkt hat, darunter in Kacheln, was sich seit der Änderung verändert hat (Zeitraum
// wählbar); alles Weitere liegt unter „Mehr Details".
// Ein Test umfasst ein oder mehrere Produkte (z. B. „alle Flaschenöffner"); gespeichert werden deren Varianten
// (Kind-ASINs) — so verschiebt ein späterer Umbau der Familien bei Amazon die Messung nicht. Gemessen wird die
// Summe, unter „Mehr Details" zusätzlich jedes Produkt einzeln.
// Statistik im Hintergrund: Conversion per Zwei-Anteile-Test, Umsatz/Sitzungen/Einheiten/Ø Preis per
// Welch-Test auf Tageswerten; Saison & Co. über den Trend des ganzen Kontos herausgerechnet.
// Laufende Tests sind komplett änderbar (⋯ → Bearbeiten), beendete nur noch Notiz/Wiedereröffnen.

const AMZ_EXP_TAGE = 14;            // Testdauer, wenn keine angegeben ist (ältere Einträge)
const AMZ_EXP_DAUERN = [7, 14, 30, 90];
const AMZ_MIN_SITZUNGEN = 50;
// Reihenfolge wie die Kacheln; k = Schlüssel in AMZ_KENNZAHLEN
const AMZ_ZIELE = {
  umsatz:     { name: 'Umsatz',     einheit: ' %',    zielEinheit: '%',             dez: 1, k: 'sales' },
  einheiten:  { name: 'Einheiten',  einheit: ' %',    zielEinheit: '%',             dez: 1, k: 'units' },
  sitzungen:  { name: 'Sitzungen',  einheit: ' %',    zielEinheit: '%',             dez: 1, k: 'sess' },
  conversion: { name: 'Conversion', einheit: ' Pkt.', zielEinheit: 'Prozentpunkte', dez: 2, k: 'conversion' },
  preis:      { name: 'Ø Preis',    einheit: ' %',    zielEinheit: '%',             dez: 1, k: 'price' },
};
// Zeitraum der Kacheln: nach der Änderung, verglichen mit gleich vielen Tagen direkt davor
const AMZ_EX_ZEITRAEUME = [['test', 'Testzeit'], ['30', '30 Tage'], ['90', '90 Tage'], ['heute', 'Bis heute']];
const AMZ_URTEIL_ART = { erreicht: 'gut', wirkt: 'gut', teil: 'gut', kein: 'neutral', schadet: 'schlecht', wenig: 'wenig', laeuft: 'laeuft', wartet: 'laeuft' };
const AMZ_URTEIL_TEXT = { erreicht: 'Ziel erreicht', wirkt: 'Wirkt', teil: 'Wirkt, Ziel verfehlt', kein: 'Kein klarer Effekt', schadet: 'Schadet',
  wenig: 'Zu wenig Daten', laeuft: 'Läuft', wartet: 'Wartet auf Daten' };
const AMZ_URTEIL_ZEICHEN = { erreicht: '✓', wirkt: '✓', teil: '✓', kein: '–', schadet: '✕', wenig: '?', laeuft: '⏳', wartet: '⏳' };

const _ex = { liste: [], ignoriert: new Set(), ebenen: [], benutzer: '', rolle: 'inhaber', roh: null, daten: null, gewaehlt: null,
  ansicht: 'detail', filter: 'alle', von: '', vorlage: null, bearbeiten: null, formAuswahl: new Set(), formStart: '',
  zeitraum: 'test', kennzahl: null, kennzahlFuer: null };

// ── Laden ─────────────────────────────────────────────────────────────────────────────────
async function amzExperimenteZeigen(neu = false) {
  const buehne = document.getElementById('amazon-buehne');
  try {
    if (neu || !_amz.stand) await _amzStandLaden();
    if (!_amz.stand.db || !_amz.stand.bis) { _exLinksBauen(); buehne.innerHTML = _vkLeer(); return; }
    buehne.classList.add('laedt');
    const [j] = await Promise.all([_amzApi('/experimente'), _amzKatalogLaden(neu)]);
    Object.assign(_ex, { liste: j.experimente, ignoriert: new Set(j.ignoriert), ebenen: j.ebenen, benutzer: j.benutzer, rolle: j.rolle });
    const bis = _amz.stand.bis;
    // Alle Produkte ab dem frühesten nötigen Tag: 130 Tage für erkannte Preissprünge, sonst 90 Tage vor dem ältesten Experiment
    const frueh = _ex.liste.reduce((m, e) => (e.start_date < m ? e.start_date : m), bis);
    await _exDatenAb([_amzPlus(bis, -130), _amzPlus(frueh, -90)].sort()[0], neu);
    _exLinksBauen();
    _amzExZeichnen();
  } catch (e) {
    buehne.innerHTML = `<div class="mb-leer">${_t('Experimente konnten nicht geladen werden: {f}', { f: _amzEsc(e.message) })}</div>`;
  } finally { buehne.classList.remove('laedt'); }
}
// Tageszahlen ab „von" sicherstellen (die Kachel „Bis heute" eines alten Tests braucht evtl. mehr)
async function _exDatenAb(von, neu = false) {
  if (von < _amz.stand.von) von = _amz.stand.von;
  if (neu || !_ex.roh || _ex.roh.von > von) _ex.roh = { von, ...(await _amzDatenLadenBereiche([[von, _amz.stand.bis]])) };
  // Gruppen können sich im Reiter „Produkte" ändern → dann neu zuordnen
  if (neu || !_ex.daten || _ex.daten.roh !== _ex.roh || _ex.daten.katalog !== _amz.katalog) _ex.daten = _exAufbereiten(_ex.roh);
}

// Tageswerte je Variante (Messung) und je Produkt (Preissprünge, Umsatz für die Auswahl im Formular)
function _exAufbereiten(roh) {
  const jeAsin = new Map(), jeGruppe = new Map(), umsatz = new Map();
  const add = (m, id, z) => {
    if (!m.has(id)) m.set(id, new Map());
    const t = m.get(id).get(z.d) || { sess: 0, units: 0, sales: 0 };
    t.sess += z.sess; t.units += z.units; t.sales += z.sales; m.get(id).set(z.d, t);
  };
  for (const z of roh.zeilen) {
    const g = _amzGruppeVon(z.asin);
    add(jeAsin, z.asin, z); add(jeGruppe, g, z);
    umsatz.set(g, (umsatz.get(g) || 0) + z.sales);
  }
  return { roh, katalog: _amz.katalog, von: roh.von, jeAsin, jeGruppe, umsatz, konto: roh.konto };
}
const _exIds = e => (e.asins ? e.asins.split(',').filter(Boolean) : [e.child_asin]);
// Produkte eines Tests nach heutiger Gruppierung; Übersichtsseiten zählen nicht als eigenes Produkt
function _exGruppen(e) {
  const ids = _exIds(e), echt = ids.filter(a => !_amzProdukt(a).eltern);
  return [...new Set((echt.length ? echt : ids).map(_amzGruppeVon))];
}
// Anzeige-Name des Eintragenden: Inhaber-Login (entwickler) bzw. Server-Werkzeuge als „Inhaber“
const _exWer = a => (!a || a === 'entwickler' || a === 'server' ? _t('Inhaber') : a);
const _exDarf = e => _ex.rolle === 'inhaber' || e.autor === _ex.benutzer;
const _exPlanEnde = e => e.end_date || _amzPlus(e.start_date, AMZ_EXP_TAGE - 1);
const _exDauer = e => _amzTage(e.start_date, _exPlanEnde(e));
// Name eines Tests: ein Produkt → dessen Name; mehrere gleicher Art → „5 Flaschenöffner"; sonst „5 Produkte"
function _exName(e) {
  const gs = _exGruppen(e);
  if (gs.length === 1) return _amzGruppeInfo(gs[0]).name;
  const arten = [...new Set(gs.map(g => _amzGruppeInfo(g).art))];
  return arten.length === 1 && arten[0] !== 'Sonstige' ? `${gs.length} ${_t(arten[0])}` : _t('{n} Produkte', { n: gs.length });
}
// Layout-Gruppe(n) der Produkte eines Tests („FL05", „FL01/FL02"), damit gleich betitelte unterscheidbar sind
function _exLayout(e) {
  const g = [...new Set(_exGruppen(e).map(x => _amzGruppeInfo(x).layout).filter(Boolean).flatMap(x => x.split('/')))].sort();
  if (g.length <= 3) return g.join('/');
  // Viele derselben Reihe (FL01 … FL05) → „FL01–FL05"
  const reihe = new Set(g.map(x => x.replace(/\d+$/, '')));
  return reihe.size === 1 ? `${g[0]}–${g[g.length - 1]}` : '';
}
function _exBilder(e, klein = false) {
  const gs = _exGruppen(e);
  if (gs.length === 1) return _amzBild(_amzGruppeInfo(gs[0]), klein);
  return `<span class="amz-bilder${klein ? ' klein' : ''}">${gs.slice(0, 3).map(g => _amzBild(_amzGruppeInfo(g), true)).join('')}</span>`;
}

// ── Auswertung ────────────────────────────────────────────────────────────────────────────
// Tageswerte (Summe über alle Varianten des Tests), fehlende Kalendertage = 0
function _exTage(asins, von, bis) {
  const out = [];
  for (let d = von; d <= bis; d = _amzPlus(d, 1)) {
    const t = { d, sess: 0, units: 0, sales: 0 };
    for (const a of asins) { const x = _ex.daten.jeAsin.get(a)?.get(d); if (x) { t.sess += x.sess; t.units += x.units; t.sales += x.sales; } }
    out.push(t);
  }
  return out;
}
function _exKontoTage(von, bis) {
  const out = []; for (let d = von; d <= bis; d = _amzPlus(d, 1)) { const k = _ex.daten.konto.get(d); if (k) out.push(k); }
  return out;
}
const _exSumme = t => t.reduce((a, x) => ({ sess: a.sess + x.sess, units: a.units + x.units, sales: a.sales + x.sales }), { sess: 0, units: 0, sales: 0 });
const _exMittel = x => (x.length ? x.reduce((s, v) => s + v, 0) / x.length : null);

// Wirkung aller Kennzahlen: nach = start … nachBis, vorher = gleich viele Tage direkt davor (mind. 14)
function _exWirkung(asins, start, nachBis) {
  const nachTage = _amzTage(start, nachBis), vorTage = Math.max(AMZ_EXP_TAGE, nachTage);
  const vorVon = _amzPlus(start, -vorTage), vorBis = _amzPlus(start, -1);
  const tb = _exTage(asins, vorVon, vorBis), ta = _exTage(asins, start, nachBis);
  const b = _exSumme(tb), a = _exSumme(ta), kbT = _exKontoTage(vorVon, vorBis), kaT = _exKontoTage(start, nachBis);
  const proTag = (s, n) => ({ sales: s.sales / n, units: s.units / n, sess: s.sess / n, conv: s.sess ? s.units / s.sess * 100 : null, preis: s.units ? s.sales / s.units : null });
  const vor = proTag(b, tb.length), nach = proTag(a, ta.length);
  const kv = proTag(_exSumme(kbT), Math.max(1, kbT.length)), kn = proTag(_exSumme(kaT), Math.max(1, kaT.length));
  const w = {};
  {
    const roh = nach.conv != null && vor.conv != null ? nach.conv - vor.conv : null;
    const trend = kn.conv != null && kv.conv != null ? kn.conv - kv.conv : 0;
    // p-Wert zur bereinigten Differenz — mit dem rohen konnte das Urteil der angezeigten Zahl widersprechen
    const t = _amzConvTest(b.units, b.sess, a.units, a.sess, trend);
    w.conversion = { delta: roh == null ? null : roh - trend, p: t?.p ?? null };
  }
  for (const [k, feld] of [['umsatz', 'sales'], ['sitzungen', 'sess'], ['einheiten', 'units']]) {
    const f = kv[feld] > 0 && kn[feld] > 0 ? kv[feld] / kn[feld] : 1;     // Konto wuchs 10 % → Nachher-Werte durch 1,1
    const v = tb.map(x => x[feld]), n = ta.map(x => x[feld] * f), mv = _exMittel(v), mn = _exMittel(n);
    const t = _amzWelch(v, n);
    w[k] = { delta: mv ? (mn / mv - 1) * 100 : null, p: t?.p ?? null };
  }
  {
    const v = tb.filter(x => x.units).map(x => x.sales / x.units), n = ta.filter(x => x.units).map(x => x.sales / x.units), t = _amzWelch(v, n);
    w.preis = { delta: vor.preis ? (nach.preis / vor.preis - 1) * 100 : null, p: t?.p ?? null };
  }
  return { w, b, a, nachTage, fenster: { vorVon, vorBis, nachVon: start, nachBis },
    trend: kv.sales > 0 ? (kn.sales / kv.sales - 1) * 100 : null };
}

const _exZiel = e => e.ziel_kennzahl || (['Preis', 'Coupon/Aktion'].includes(e.change_type) ? 'umsatz' : 'conversion');
function _exAuswerten(e) {
  const bis = _amz.stand.bis, start = e.start_date, planEnde = _exPlanEnde(e), dauer = _exDauer(e);
  const zielK = _exZiel(e), richtung = e.ziel_richtung || 'hoch', zk = AMZ_ZIELE[zielK];
  if (start > bis) return { status: 'wartet', urteil: 'wartet', zielK, richtung, dauer, nachTage: 0,
    satz: _t('Startet bei {a} — Amazon liefert Zahlen bis {b}.', { a: _amzDatum(start), b: _amzDatum(bis) }), text: _t('Erste Werte kommen in ein paar Tagen.') };
  const r = { ..._exWirkung(_exIds(e), start, planEnde < bis ? planEnde : bis), zielK, richtung, dauer };
  const w = r.w[zielK];
  const laeuft = e.status === 'laufend' && planEnde > bis;
  const zuWenig = r.b.sess < AMZ_MIN_SITZUNGEN || r.a.sess < AMZ_MIN_SITZUNGEN;
  const gut = w.delta != null && (richtung === 'hoch' ? w.delta > 0 : w.delta < 0);
  const sicher = w.p != null && w.p < 0.05;
  const deltaText = w.delta == null ? '–' : _amzVz(w.delta, zk.dez, _t(zk.einheit)), zn = _t(zk.name);
  r.deltaText = `${zn} ${deltaText}`;
  r.status = laeuft ? 'laeuft' : 'fertig';
  if (laeuft) {
    r.urteil = 'laeuft';
    r.satz = _t('Läuft — Ergebnis ab {d}', { d: _amzDatum(planEnde) });
    r.text = _t('Tag {n} von {dauer}. Bisher {wert} (bereinigt) — das ist noch nicht belastbar.', { n: r.nachTage, dauer, wert: r.deltaText });
  } else if (zuWenig) {
    r.urteil = 'wenig';
    r.satz = _t('Zu wenig Daten für ein Urteil');
    r.text = _t('{a} Besuche vorher, {b} nachher — nötig sind je {n}. Länger testen oder mehr Produkte in den Test nehmen.', { a: _amzZahl(r.b.sess), b: _amzZahl(r.a.sess), n: AMZ_MIN_SITZUNGEN });
  } else if (!sicher) {
    r.urteil = 'kein';
    r.satz = _t('Kein klarer Effekt ({wert})', { wert: r.deltaText });
    r.text = _t('Der Unterschied liegt im normalen Schwanken.') + (gut ? ' ' + _t('Die Richtung stimmt, reicht aber nicht als Beleg.') : '');
  } else if (!gut) {
    r.urteil = 'schadet';
    r.satz = _t('Schadet: {wert}', { wert: r.deltaText });
    r.text = _t('Die Wirkung ist belastbar und geht in die falsche Richtung. Rückgängig machen erwägen.');
  } else if (e.ziel_wert && Math.abs(w.delta) < e.ziel_wert) {
    r.urteil = 'teil';
    r.satz = _t('Wirkt: {wert}', { wert: r.deltaText });
    r.text = _t('Belastbar besser, aber das Ziel ({ziel}) ist knapp verfehlt.', { ziel: `${richtung === 'hoch' ? '+' : '−'}${_amzZahl(e.ziel_wert, zk.dez)}${_t(zk.einheit)}` });
  } else {
    r.urteil = e.ziel_wert ? 'erreicht' : 'wirkt';
    r.satz = `${_t(e.ziel_wert ? 'Ziel erreicht' : 'Wirkt wie erhofft')}: ${r.deltaText}`;
    r.text = _t('Die Verbesserung ist belastbar — beibehalten.');
  }
  if (zielK !== 'umsatz' && !laeuft && r.w.umsatz.p != null && r.w.umsatz.p < 0.05 && r.w.umsatz.delta < -5) {
    r.nebenwirkung = _t('Achtung: Der Umsatz ist dabei um {wert} gefallen (belastbar).', { wert: _amzVz(r.w.umsatz.delta, 0, ' %') });
  }
  return r;
}

// Andere Tests, die eine gleiche Variante im selben Zeitraum ändern → Wirkung nicht sicher zuzuordnen
function _exUeberschneidungen(e) {
  const meine = new Set(_exIds(e).filter(a => !_amzProdukt(a).eltern));
  return _ex.liste.filter(x => x.id !== e.id && _exIds(x).some(a => meine.has(a))
    && _amzPlus(x.start_date, -AMZ_EXP_TAGE) <= _exPlanEnde(e) && _amzPlus(e.start_date, -AMZ_EXP_TAGE) <= _exPlanEnde(x));
}

// Preissprünge, die niemand eingetragen hat (je Produkt): Median der 7 Verkaufstage danach ≥ 8 % neben dem der
// 7 davor, und ≥ 5 der 7 Folgetage einzeln daneben
function _exPreisspruenge() {
  const median = x => { const s = [...x].sort((a, b) => a - b), m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
  const ab = _amzPlus(_amz.stand.bis, -90), funde = [];
  for (const [id, m] of _ex.daten.jeGruppe) {
    if (!_amzGruppeInfo(id).varianten.length) continue;
    const tage = [...m].filter(([, t]) => t.units > 0).sort((a, b) => (a[0] < b[0] ? -1 : 1));
    if (tage.length < 14) continue;
    const preise = tage.map(([, t]) => t.sales / t.units);
    let letzter = -99;
    for (let i = 7; i < preise.length - 6; i++) {
      if (i - letzter < 14) continue;
      const vor = median(preise.slice(i - 7, i)), nach = preise.slice(i, i + 7), nachMed = median(nach);
      if (!vor || Math.abs(nachMed / vor - 1) < 0.08) continue;
      const r = Math.sign(nachMed / vor - 1);
      if (nach.filter(p => r * (p / vor - 1) >= 0.04).length < 5) continue;
      letzter = i;
      const d = tage[i][0], key = `${id}:${d}`;
      if (d < ab || _ex.ignoriert.has(key)) continue;
      if (_ex.liste.some(e => e.change_type === 'Preis' && _exGruppen(e).includes(id) && Math.abs(_amzTage(e.start_date, d)) <= 6)) continue;
      funde.push({ id, d, key, alt: vor, neu: nachMed, pct: (nachMed / vor - 1) * 100 });
    }
  }
  return funde.sort((a, b) => (a.d < b.d ? 1 : -1)).slice(0, 10);
}

// ── Linke Spalte: Neu, Filter, Bilanz, Liste (laufend / ausgewertet) mit ⋯-Menü ──────────
function _exLinksBauen() {
  const el = document.getElementById('amz-links-experimente');
  if (!el) return;
  const ergebnisse = _ex.daten ? new Map(_ex.liste.map(e => [e.id, _exAuswerten(e)])) : new Map();
  _ex.ergebnisse = ergebnisse;
  _ex.spruenge = _ex.daten ? _exPreisspruenge() : [];
  const autoren = [...new Set(_ex.liste.map(e => _exWer(e.autor)))];
  if (_ex.von && !autoren.includes(_ex.von)) _ex.von = '';
  const laeuftAuch = e => ['laeuft', 'wartet'].includes(ergebnisse.get(e.id)?.urteil);
  const sichtbar = _ex.liste.filter(e => (!_ex.von || _exWer(e.autor) === _ex.von) && (_ex.filter === 'alle' || (_ex.filter === 'laeuft') === laeuftAuch(e)));
  const laufend = sichtbar.filter(laeuftAuch), fertig = sichtbar.filter(e => !laeuftAuch(e));
  const zaehl = (...u) => sichtbar.filter(e => u.includes(ergebnisse.get(e.id)?.urteil)).length;
  const chip = (wert, text, feld) => `<button class="amz-chip${_ex[feld] === wert ? ' an' : ''}" onclick="_ex.${feld}='${_amzEsc(wert)}';_exLinksBauen()">${_amzEsc(_t(text))}</button>`;
  const eintrag = e => {
    const r = ergebnisse.get(e.id) || {}, layout = _exLayout(e);
    const fortschritt = r.urteil === 'laeuft' || r.urteil === 'wartet'
      ? `<span class="amz-fortschritt" title="${_t('Tag {n} von {dauer}', { n: r.nachTage || 0, dauer: r.dauer })}"><i style="width:${Math.min(100, Math.round((r.nachTage || 0) / (r.dauer || 14) * 100))}%"></i></span>`
      : `<span class="amz-urteil ${AMZ_URTEIL_ART[r.urteil] || 'neutral'}">${AMZ_URTEIL_ZEICHEN[r.urteil] || ''} ${_t(AMZ_URTEIL_TEXT[r.urteil] || '–')}</span>`;
    return `<div class="amz-ex-eintrag${_ex.ansicht === 'detail' && _ex.gewaehlt === e.id ? ' gewaehlt' : ''}" role="button" tabindex="0" onclick="_exWaehlen(${e.id})">${_exBilder(e)}
      <span class="amz-prod-text"><span class="amz-prod-name">${_amzEsc(_exName(e))}</span>
      <span class="amz-prod-zusatz">${layout ? `<b class="amz-gruppe">${_amzEsc(layout)}</b> · ` : ''}${_amzEsc(_t(e.change_type))}</span>
      <span class="amz-prod-zusatz">${_t('seit {d}', { d: _amzDatumKurz(e.start_date) })}${_exWer(e.autor) !== _t('Inhaber') ? ' · ' + _amzEsc(_exWer(e.autor)) : ''}</span>${fortschritt}</span>
      ${_exDarf(e) ? `<button class="amz-mehr-knopf" title="${_t('Bearbeiten, beenden, löschen')}" onclick="event.stopPropagation();_exMenue(${e.id},this)">⋯</button>` : ''}</div>`;
  };
  el.innerHTML = `
    <div class="tab-kopf">
      <div class="tab-titel"><span class="tab-titel-name">${_t('Experimente')}</span><button class="btn btn-muted btn-xs" onclick="amzExperimenteZeigen(true)" title="${_t('Neu laden')}">↻</button></div>
      <div class="tab-titel-text">${_t('Änderung eintragen → Wirkung messen.')}</div>
    </div>
    <div class="scrolly amz-links-inhalt">
      <button class="btn btn-accent btn-full" onclick="_exNeu()">${_t('+ Neue Änderung')}</button>
      <div class="amz-chips amz-ex-filter">${chip('alle', 'Alle', 'filter')}${chip('laeuft', 'Laufend', 'filter')}${chip('fertig', 'Ausgewertet', 'filter')}</div>
      ${autoren.length > 1 ? `<div class="amz-chips amz-ex-filter"><span class="amz-hinweis">${_t('Von:')}</span>${chip('', 'Allen', 'von')}${autoren.map(a => chip(a, a, 'von')).join('')}</div>` : ''}
      ${sichtbar.length ? `<div class="amz-bilanz"><span class="plus">✓ ${_t('{n} wirken', { n: zaehl('erreicht', 'wirkt', 'teil') })}</span><span>– ${_t('{n} ohne Effekt', { n: zaehl('kein', 'wenig') })}</span>
        <span class="minus">✕ ${_t('{n} schaden', { n: zaehl('schadet') })}</span><span>⏳ ${_t('{n} laufen', { n: zaehl('laeuft', 'wartet') })}</span></div>` : ''}
      ${laufend.length ? `<div class="amz-ex-gruppe">${_t('Laufen gerade')} · ${laufend.length}</div><div class="amz-ex-liste">${laufend.map(eintrag).join('')}</div>` : ''}
      ${fertig.length ? `<div class="amz-ex-gruppe">${_t('Ausgewertet')} · ${fertig.length}</div><div class="amz-ex-liste">${fertig.map(eintrag).join('')}</div>` : ''}
      ${!sichtbar.length ? `<div class="amz-hinweis amz-block">${_t('Noch keine Änderungen eingetragen.')}</div>` : ''}
      ${_ex.spruenge.length ? `<a href="#" class="amz-erkannt-link" onclick="_ex.ansicht='erkannt';_exLinksBauen();_amzExZeichnen();return false">
        ${_t(_ex.spruenge.length === 1 ? '1 Preisänderung erkannt, aber nicht eingetragen ›' : '{n} Preisänderungen erkannt, aber nicht eingetragen ›', { n: _ex.spruenge.length })}</a>` : ''}
    </div>`;
}
function _exWaehlen(id) { _ex.gewaehlt = id; _ex.ansicht = 'detail'; _exLinksBauen(); _amzExZeichnen(); }
function _exNeu(vorlage = null) { Object.assign(_ex, { ansicht: 'neu', vorlage, bearbeiten: null, formAuswahl: new Set(vorlage?.ids || []), formStart: '' }); _exLinksBauen(); _amzExZeichnen(); }
function _exBearbeiten(id) {
  const e = _ex.liste.find(x => x.id === id), gs = e ? _exGruppen(e) : [];
  Object.assign(_ex, { ansicht: 'neu', vorlage: null, bearbeiten: id, gewaehlt: id, formAuswahl: new Set(gs), formStart: [...gs].sort().join() });
  _exLinksBauen(); _amzExZeichnen();
}

// ⋯-Menü: Bearbeiten (nur laufend), Test beenden / wieder öffnen, Löschen
function _exMenue(id, knopf) {
  document.getElementById('amz-menue')?.remove();
  const e = _ex.liste.find(x => x.id === id);
  if (!e) return;
  const m = document.createElement('div');
  m.id = 'amz-menue'; m.className = 'amz-menue';
  m.innerHTML = (e.status === 'laufend' ? `<button onclick="_exBearbeiten(${id})">${_t('Bearbeiten')}</button>
      <button onclick="_exBeenden(${id})">${_t('Test jetzt beenden')}</button>` : `<button onclick="_exAendern(${id},{status:'laufend'})">${_t('Wieder öffnen')}</button>`)
    + `<button class="rot" onclick="_exLoeschen(${id})">${_t('Löschen')}</button>`;
  document.body.appendChild(m);
  const r = knopf.getBoundingClientRect();
  m.style.top = Math.min(r.bottom + 4, innerHeight - m.offsetHeight - 8) + 'px';
  m.style.left = Math.max(8, r.right - m.offsetWidth) + 'px';
  setTimeout(() => document.addEventListener('click', function zu() { m.remove(); document.removeEventListener('click', zu); }), 0);
}

// ── Bühne ─────────────────────────────────────────────────────────────────────────────────
function _amzExZeichnen() {
  if (!_ex.daten) return;
  const b = document.getElementById('amazon-buehne');
  if (_ex.ansicht === 'neu') return _exFormular(b);
  if (_ex.ansicht === 'erkannt') return _exErkanntZeichnen(b);
  if (!_ex.liste.some(e => e.id === _ex.gewaehlt)) _ex.gewaehlt = _ex.liste[0]?.id ?? null;
  const e = _ex.liste.find(x => x.id === _ex.gewaehlt);
  if (!e) {
    b.innerHTML = _exEinfuehrung() + `<div class="amz-leer-kasten">
      <div class="tab-titel-name">${_t('Noch keine Änderungen eingetragen')}</div>
      <p>${_t('LEER_EXPERIMENTE')}</p>
      <button class="btn btn-accent" onclick="_exNeu()">${_t('+ Erste Änderung eintragen')}</button></div>`;
    return;
  }
  const r = _ex.ergebnisse?.get(e.id) || _exAuswerten(e);
  // Kennzahl im Diagramm: beim Wechsel des Tests dessen Ziel
  if (_ex.kennzahlFuer !== e.id) { _ex.kennzahl = AMZ_ZIELE[r.zielK].k; _ex.kennzahlFuer = e.id; }
  const fe = _exKachelFenster(e);
  // „Bis heute" eines alten Tests braucht evtl. ältere Tageszahlen
  if (fe && fe.vorVon < _ex.daten.von && _ex.daten.von > _amz.stand.von) {
    b.classList.add('laedt');
    _exDatenAb(fe.vorVon).then(_amzExZeichnen).catch(err => _amzToast('⚠ ' + err.message, 3500)).finally(() => b.classList.remove('laedt'));
  }
  b.innerHTML = _exEinfuehrung() + _exDetailHtml(e, r, fe);
  if (fe) _exDetailDiagramm(e, fe);
}

// Kurze Einführung beim ersten Besuch (z. B. für den Freelancer), wegklickbar
function _exEinfuehrung() {
  let zu = false;
  try { zu = localStorage.getItem('amz-ex-einfuehrung') === 'zu'; } catch {}
  if (zu) return '';
  return `<div class="amz-einfuehrung"><div><b>${_t("So funktioniert's")}</b>
      <ol><li>${_t('Am Amazon-Listing etwas ändern — Bild, Titel, Preis, Personalisierung …')}</li>
      <li>${_t('Hier eintragen: welche Produkte, was geändert wurde und was es bringen soll.')}</li>
      <li>${_t('Nach der Testdauer steht oben in einem Satz, ob es gewirkt hat — fair gerechnet, Saison und Trend sind herausgerechnet.')}</li></ol>
      <span class="amz-hinweis">${_t('Tipp: pro Produkt nur eine Änderung zur Zeit, sonst ist unklar, was gewirkt hat. Amazon liefert Zahlen mit 2 Tagen Verzug.')}</span></div>
    <button class="btn btn-muted btn-xs" onclick="try{localStorage.setItem('amz-ex-einfuehrung','zu')}catch{};this.parentElement.remove()">${_t('Verstanden')}</button></div>`;
}

// Fenster der Kacheln: ab der Änderung bis Testende / +30 / +90 Tage / heute (höchstens bis zum letzten Datentag),
// verglichen mit gleich vielen Tagen direkt davor
function _exKachelFenster(e) {
  const bis = _amz.stand.bis, start = e.start_date;
  if (start > bis) return null;
  const w = _ex.zeitraum;
  const soll = w === 'test' ? _exPlanEnde(e) : w === 'heute' ? bis : _amzPlus(start, +w - 1);
  const nachBis = soll < bis ? soll : bis, n = _amzTage(start, nachBis);
  return { nachVon: start, nachBis, vorVon: _amzPlus(start, -n), vorBis: _amzPlus(start, -1), n, offen: soll > bis };
}

function _exDetailHtml(e, r, fe) {
  const ids = _exIds(e), gs = _exGruppen(e), zk = AMZ_ZIELE[r.zielK], darf = _exDarf(e), ueber = _exUeberschneidungen(e), layout = _exLayout(e);
  const erhofft = `${_t(zk.name)} ${_t(e.ziel_kennzahl && e.ziel_richtung === 'runter' ? 'sinkt' : 'steigt')}${e.ziel_kennzahl && e.ziel_wert ? ' ' + _t('um {wert} {einheit}', { wert: _amzZahl(e.ziel_wert, zk.dez), einheit: _t(zk.zielEinheit) }) : ''}`;
  const fort = r.status !== 'fertig' ? Math.min(100, Math.round((r.nachTage || 0) / (r.dauer || 14) * 100)) : null;
  // Mehrere Produkte: Layout-Gruppe statt des (oft gleichen) Amazon-Titels
  const namen = gs.length > 1 ? gs.map(g => _amzGruppeInfo(g).layout || _amzGruppeInfo(g).name).join(' · ') : '';
  // Kacheln: was sich seit der Änderung verändert hat (roh), dazu das ganze Konto als Maßstab
  let kacheln = '';
  if (fe) {
    const nach = _amzSumme(_exTage(ids, fe.nachVon, fe.nachBis)), vor = _amzSumme(_exTage(ids, fe.vorVon, fe.vorBis));
    const kn = _amzSumme(_exKontoTage(fe.nachVon, fe.nachBis)), kv = _amzSumme(_exKontoTage(fe.vorVon, fe.vorBis));
    const unvollstaendig = fe.vorVon < _amz.stand.von;
    const pct = (a, b) => (a != null && b ? _amzVz((a / b - 1) * 100, 1, ' %') : '–');
    kacheln = `
    <div class="amz-abschnitt-kopf"><div class="ov-sec-title">${_t(fe.offen ? 'Was sich verändert hat · {von} – {bis} ({n} T, bisher) gegen die {n} Tage davor' : 'Was sich verändert hat · {von} – {bis} ({n} T) gegen die {n} Tage davor', { von: _amzDatum(fe.nachVon), bis: _amzDatum(fe.nachBis), n: fe.n })}</div>
      <div class="seg amz-seg">${AMZ_EX_ZEITRAEUME.map(([w, t]) => `<button class="seg-b${_ex.zeitraum === w ? ' an' : ''}" onclick="_ex.zeitraum='${w}';_amzExZeichnen()">${w === 'test' ? `${_t(t)} (${r.dauer} ${_t('T')})` : _t(t)}</button>`).join('')}</div></div>
    ${_amzKacheln(nach, vor, { vglName: _t('Vorher'), unvollstaendig, ziel: zk.k })}
    <div class="amz-hinweis">${_t('KONTO_VERGLEICH', { umsatz: pct(kn.sales, kv.sales), sitzungen: pct(kn.sess, kv.sess), conv: kn.conversion != null && kv.conversion != null ? _amzVz(kn.conversion - kv.conversion, 2, _t(' Pkt.')) : '–' })}</div>
    <div class="amz-karte">
      <div class="amz-karte-kopf"><div class="seg amz-seg">${Object.entries(AMZ_KENNZAHLEN).map(([w, kz]) =>
        `<button class="seg-b${_ex.kennzahl === w ? ' an' : ''}" onclick="_ex.kennzahl='${w}';_amzExZeichnen()">${_t(kz.name)}</button>`).join('')}</div>
        <span class="amz-hinweis amz-rechts">${_t(ids.length > 1 ? 'je Tag, alle Produkte zusammen · rote Linien = Änderung und Testende' : 'je Tag · rote Linien = Änderung und Testende')}</span></div>
      <div class="amz-diagramm" id="amz-ex-diagramm"></div></div>`;
  }
  return `
    <div class="amz-ex-kopf">${_exBilder(e)}<div class="amz-ex-titel"><div class="tab-titel-name">${_amzEsc(_exName(e))}${layout ? ` (${_amzEsc(layout)})` : ''} — ${_amzEsc(_t(e.change_type))}</div>
      <div class="amz-kopf-zeit">${_t('geändert am {d} · Testdauer {n} Tage · von {wer}', { d: _amzDatum(e.start_date), n: r.dauer, wer: _amzEsc(_exWer(e.autor)) })}</div>
      ${namen ? `<div class="amz-hinweis amz-ex-namen" title="${_amzEsc(namen)}">${_amzEsc(namen)}</div>` : ''}</div>
      ${darf ? `<button class="btn btn-muted btn-xs" onclick="event.stopPropagation();_exMenue(${e.id},this)">⋯</button>` : ''}</div>
    <div class="amz-status ${AMZ_URTEIL_ART[r.urteil] || 'neutral'}">
      <div class="amz-status-satz"><span class="amz-status-zeichen">${AMZ_URTEIL_ZEICHEN[r.urteil] || ''}</span>${_amzEsc(r.satz || '')}</div>
      ${fort != null ? `<div class="amz-fortschritt gross"><i style="width:${fort}%"></i></div>` : ''}
      <div class="amz-status-zeile"><span><small>${_t('Erhofft')}</small>${_amzEsc(erhofft)}</span>
        <span><small>${r.status === 'fertig' ? _t('Ergebnis nach {n} Tagen (bereinigt)', { n: r.nachTage }) : _t('Bisher (bereinigt)')}</small>${_amzEsc(r.deltaText || '–')}</span></div>
      <div class="amz-hinweis">${_amzEsc(r.text || '')}</div>
    </div>
    ${r.nebenwirkung ? `<div class="ov-pruef-zeile fehler">${_amzEsc(r.nebenwirkung)}</div>` : ''}
    ${ueber.length ? `<div class="ov-pruef-zeile">${_t('UEBERSCHNEIDUNG', { liste: ueber.map(x => _t('{was} am {d}', { was: _amzEsc(_t(x.change_type)), d: _amzDatum(x.start_date) })).join(', ') })}</div>` : ''}
    ${kacheln}
    ${r.w ? `<details class="amz-details"><summary>${_t(gs.length > 1 ? 'Mehr Details — Wirkung nach 7 / 30 / 90 Tagen, je Produkt' : 'Mehr Details — Wirkung nach 7 / 30 / 90 Tagen')}</summary>
      ${e.old_value || e.new_value ? `<div class="amz-vorher-nachher"><div><small>${_t('Vorher')}</small>${_amzEsc(e.old_value || '–')}</div><span>→</span><div><small>${_t('Nachher')}</small>${_amzEsc(e.new_value || '–')}</div></div>` : ''}
      ${e.begruendung ? `<div class="amz-hinweis amz-block">${_t('Warum')}: „${_amzEsc(e.begruendung)}"</div>` : ''}
      ${e.link ? `<div class="amz-zeile"><a class="amz-link" href="${_amzEsc(e.link)}" target="_blank" rel="noopener noreferrer">${_t('Unterlagen öffnen ↗')}</a></div>` : ''}
      ${_exZeitraeume(e, r)}
      ${gs.length > 1 ? _exJeProdukt(e, r) : ''}
      <div class="amz-hinweis amz-block">${_t('URTEIL_ERKLAERUNG', { vorVon: _amzDatum(r.fenster.vorVon), vorBis: _amzDatum(r.fenster.vorBis), nachVon: _amzDatum(r.fenster.nachVon), nachBis: _amzDatum(r.fenster.nachBis),
        konto: r.trend != null ? ' ' + _t('(Konto im selben Zeitraum {wert})', { wert: _amzVz(r.trend, 1, ' %') }) : '', n: ids.length })}</div>
    </details>` : ''}
    <div class="amz-karte"><div class="amz-karte-titel">${_t('Notizen')}</div>
      ${darf ? `<textarea class="amz-notiz" id="amz-ex-notiz" rows="2" placeholder="${_t('Beobachtungen, nächste Schritte …')}">${_amzEsc(e.note || '')}</textarea>
        <div class="amz-zeile amz-aktionen"><button class="btn btn-muted btn-xs" onclick="_exNotizSpeichern(${e.id})">${_t('Notiz speichern')}</button></div>`
      : `<div class="amz-hinweis">${_amzEsc(e.note || _t('Keine Notizen.'))}</div>`}</div>`;
}
const _exDeltaZelle = (x, dez, einh) => x.delta == null ? '–'
  : `<span class="${x.p != null && x.p < 0.05 ? (x.delta > 0 ? 'plus' : 'minus') : ''}">${_amzVz(x.delta, dez, einh)}</span>${x.p != null && x.p < 0.05 ? ' ✓' : ''}`;
// Verlauf nach 7, 30 und 90 Tagen (bereinigt, unabhängig von der Testdauer) — zeigt, ob eine Wirkung anhält
function _exZeitraeume(e, r) {
  const bis = _amz.stand.bis, zk = AMZ_ZIELE[r.zielK], ids = _exIds(e);
  const zellen = [7, 30, 90].map(n => {
    const ende = _amzPlus(e.start_date, n - 1);
    if (ende > bis) return { n, offen: _t('ab {d}', { d: _amzDatum(ende) }) };
    const x = _exWirkung(ids, e.start_date, ende);
    return { n, z: x.w[r.zielK], u: x.w.umsatz, c: x.w.conversion, wenig: x.b.sess < AMZ_MIN_SITZUNGEN || x.a.sess < AMZ_MIN_SITZUNGEN };
  });
  const zelle = (c, x, dez, einh) => `<td>${c.offen ? `<span class="amz-hinweis">${c.offen}</span>` : c.wenig ? `<span class="amz-hinweis">${_t('zu wenig')}</span>` : _exDeltaZelle(x, dez, einh)}</td>`;
  return `<div class="amz-karte amz-tabelle-rahmen"><table class="amz-tabelle"><thead><tr><th class="txt">${_t('Wirkung (bereinigt) nach …')}</th>${zellen.map(c => `<th>${_t('{n} Tagen', { n: c.n })}</th>`).join('')}</tr></thead><tbody>
    <tr class="gewaehlt"><td class="txt">${_t(zk.name)} (${_t('Ziel')})</td>${zellen.map(c => zelle(c, c.z, zk.dez, _t(zk.einheit))).join('')}</tr>
    ${r.zielK !== 'umsatz' ? `<tr><td class="txt">${_t('Umsatz')}</td>${zellen.map(c => zelle(c, c.u, 1, ' %')).join('')}</tr>` : ''}
    ${r.zielK !== 'conversion' ? `<tr><td class="txt">Conversion</td>${zellen.map(c => zelle(c, c.c, 2, _t(' Pkt.'))).join('')}</tr>` : ''}
    </tbody></table></div>`;
}
// Mehrere Produkte: jedes einzeln (Ziel-Kennzahl und Umsatz über die Testdauer)
function _exJeProdukt(e, r) {
  const zk = AMZ_ZIELE[r.zielK], ende = r.fenster.nachBis, ids = _exIds(e);
  const zeilen = _exGruppen(e).map(g => ({ g, x: _exWirkung(ids.filter(a => _amzGruppeVon(a) === g), e.start_date, ende) }))
    .sort((a, b) => (b.x.b.sales + b.x.a.sales) - (a.x.b.sales + a.x.a.sales));
  return `<div class="amz-karte amz-tabelle-rahmen"><table class="amz-tabelle"><thead><tr><th class="txt">${_t('Je Produkt')}</th><th>${_t(zk.name)}</th><th>${_t('Umsatz')}</th><th>${_t('Besuche nachher')}</th></tr></thead><tbody>
    ${zeilen.map(({ g, x }) => { const i = _amzGruppeInfo(g), wenig = x.b.sess < AMZ_MIN_SITZUNGEN || x.a.sess < AMZ_MIN_SITZUNGEN;
      return `<tr><td class="txt"><div class="amz-zelle-prod">${_amzBild(i, true)}<span><span class="amz-prod-name">${_amzEsc(i.name)}</span><span class="amz-prod-zusatz">${_amzEsc(i.layout || '')}</span></span></div></td>
        <td>${wenig ? `<span class="amz-hinweis">${_t('zu wenig')}</span>` : _exDeltaZelle(x.w[r.zielK], zk.dez, _t(zk.einheit))}</td><td>${wenig ? '' : _exDeltaZelle(x.w.umsatz, 1, ' %')}</td><td>${_amzZahl(x.a.sess)}</td></tr>`; }).join('')}
    </tbody></table></div>`;
}

// Diagramm: vorher und nachher (Fenster der Kacheln) als Tageswerte der gewählten Kennzahl
function _exDetailDiagramm(e, fe) {
  const el = document.getElementById('amz-ex-diagramm');
  if (!el) return;
  const k = _ex.kennzahl, kz = AMZ_KENNZAHLEN[k];
  const von = fe.vorVon < _amz.stand.von ? _amz.stand.von : fe.vorVon;
  const tage = _exTage(_exIds(e), von, fe.nachBis).map(t => Object.assign(t, _amzSumme([t])));
  const marken = [{ k: e.start_date, text: _t('Änderung') + ': ' + _t(e.change_type) }, { k: _exPlanEnde(e), text: _t('Ende der Testdauer') }];
  _amzLinien(el, { schluessel: tage.map(t => t.d), dez: kz.dez, einheit: kz.einheit, hoehe: 220, marken,
    serien: [{ name: _t(kz.name), farbe: AMZ_FARBEN[0], werte: new Map(tage.map(t => [t.d, t[k]])) }] });
}

// Erkannte, aber nicht eingetragene Preisänderungen
function _exErkanntZeichnen(b) {
  b.innerHTML = `<div class="amz-kopf"><div class="tab-titel-name">${_t('Erkannt, aber nicht eingetragen')}</div>
      <button class="btn btn-muted btn-xs amz-rechts" onclick="_ex.ansicht='detail';_exLinksBauen();_amzExZeichnen()">${_t('Zurück')}</button></div>
    <div class="amz-hinweis amz-block">${_t('ERKANNT_ERKLAERUNG')}</div>
    <div class="amz-karte amz-vorschlaege">${_ex.spruenge.map(v => `<div class="amz-vorschlag">${_amzBild(_amzGruppeInfo(v.id), true)}
      <span><b>${_amzEsc(_amzGruppeInfo(v.id).name)}</b> · ${_amzDatum(v.d)}: ${_t('Ø Preis')} ${_amzZahl(v.alt, 2, ' €')} → ${_amzZahl(v.neu, 2, ' €')} (${_amzVz(v.pct, 0, ' %')})</span>
      <button class="btn btn-muted btn-xs" onclick='_exNeu(${JSON.stringify({ ids: [v.id], d: v.d, ebene: 'Preis', alt: _amzZahl(v.alt, 2, ' €'), neu: _amzZahl(v.neu, 2, ' €') })})'>${_t('Eintragen')}</button>
      <button class="btn btn-muted btn-xs" onclick="_exVorschlagIgnorieren('${v.key}')">${_t('Ignorieren')}</button></div>`).join('') || `<div class="amz-hinweis">${_t('Nichts mehr offen.')}</div>`}</div>`;
}

// ── Neue Änderung / Bearbeiten ───────────────────────────────────────────────────────────
// Gewählt werden Produkte (Gruppen); gespeichert deren Varianten (ohne ausgeblendete)
const _exVariantenVon = gs => [...new Set(gs.flatMap(g => _amzGruppeInfo(g).kinder.filter(a => !_amzProdukt(a).aus)))];
function _exFormular(b) {
  const alt = _ex.bearbeiten != null ? _ex.liste.find(x => x.id === _ex.bearbeiten) : null;
  const v = alt ? { d: alt.start_date, ebene: alt.change_type, alt: alt.old_value, neu: alt.new_value } : (_ex.vorlage || {});
  // Produkte mit Umsatz zuerst; Produkte ohne Verkäufe nur, wenn sie schon im Test sind (oder über die Suche)
  const umsatz = id => _ex.daten.umsatz.get(id) || 0;
  const produkte = [..._amz.katalog.gruppen.values()].filter(g => g.varianten.length || _ex.formAuswahl.has(g.id)).sort((a, c) => umsatz(c.id) - umsatz(a.id));
  const arten = {};
  for (const g of produkte) if (umsatz(g.id) > 0 && g.art !== 'Sonstige') (arten[g.art] = arten[g.art] || []).push(g.id);
  const zielK = alt ? _exZiel(alt) : (v.ebene === 'Preis' ? 'umsatz' : 'conversion'), richtung = alt?.ziel_richtung || 'hoch';
  const dauer = alt ? _exDauer(alt) : AMZ_EXP_TAGE, heute = _amzHeute();
  const mehrOffen = !!(alt && (alt.old_value || alt.new_value || alt.begruendung || alt.link)) || !!(v.alt || v.neu);
  _ex.formArten = arten;
  b.innerHTML = `<div class="amz-kopf"><div class="tab-titel-name">${_t(alt ? 'Test ändern' : 'Neue Änderung eintragen')}</div>
      <button class="btn btn-muted btn-xs amz-rechts" onclick="_ex.ansicht='detail';_ex.vorlage=null;_ex.bearbeiten=null;_exLinksBauen();_amzExZeichnen()">${_t('Abbrechen')}</button></div>
    <div class="amz-karte amz-formular">
      <div class="amz-schritt"><span>1</span>${_t('Welche Produkte?')} <em id="exf-anzahl"></em></div>
      <div class="amz-chips amz-schnellwahl">${Object.entries(arten).map(([art, ids]) => `<button class="amz-chip" data-art="${_amzEsc(art)}" onclick="_exArtWaehlen(this.dataset.art)">${_t('Alle {art}', { art: _amzEsc(_t(art)) })} (${ids.length})</button>`).join('')}
        <button class="amz-chip" onclick="_ex.formAuswahl.clear();_exAuswahlZeigen()">${_t('Auswahl leeren')}</button></div>
      <input type="search" class="amz-suche" placeholder="${_t('Produkt suchen (Name, Layout wie „K01“, ASIN) …')}" oninput="_exProduktSuchen(this.value)"/>
      <div class="amz-produktwahl" id="exf-produkte">${produkte.map(g => `<button class="amz-prod" data-id="${_amzEsc(g.id)}"
        data-name="${_amzEsc([g.name, g.layout, g.art, ...g.kinder, ...g.varianten.map(_amzVarName)].join(' ').toLowerCase())}"
        ${!(umsatz(g.id) > 0) && !_ex.formAuswahl.has(g.id) ? 'hidden data-leer="1"' : ''} onclick="_exProduktWaehlen(this.dataset.id)" style="--farbe:var(--accent)">${_amzBild(g)}
        <span class="amz-prod-text"><span class="amz-prod-name">${_amzEsc(g.name)}</span><span class="amz-prod-zusatz">${_amzEsc([g.layout, g.varianten.length > 1 ? _t('{n} Varianten', { n: g.varianten.length }) : '', _t(g.art)].filter(Boolean).join(' · '))}</span></span>
        <span class="amz-prod-haken">✓</span></button>`).join('')}</div>
      <div class="amz-schritt"><span>2</span>${_t('Was wurde geändert — und wann?')}</div>
      <div class="amz-chips" id="exf-ebene">${_ex.ebenen.map(t => `<button class="amz-chip${t === (v.ebene || '') ? ' an' : ''}" data-wert="${_amzEsc(t)}" onclick="_exChip(this)">${_amzEsc(_t(t))}</button>`).join('')}</div>
      <div class="amz-form-zeile">
        <label class="amz-feld"><span>${_t('Geändert am')}</span><input id="exf-start" type="date" value="${v.d || heute}" max="${heute}"/></label>
        <label class="amz-feld"><span>${_t('Testdauer')}</span><div class="seg amz-seg" id="exf-dauer">${[...new Set([...AMZ_EXP_DAUERN, dauer])].sort((a, c) => a - c).map(n => `<button class="seg-b${n === dauer ? ' an' : ''}" data-wert="${n}" onclick="_exSeg(this)">${_t('{n} Tage', { n })}</button>`).join('')}</div></label>
      </div>
      <div class="amz-schritt"><span>3</span>${_t('Was soll besser werden?')}</div>
      <div class="amz-ziel-zeile">
        <div class="seg amz-seg" id="exf-kennzahl">${Object.entries(AMZ_ZIELE).map(([k, z]) => `<button class="seg-b${k === zielK ? ' an' : ''}" data-wert="${k}" onclick="_exSeg(this)">${_t(z.name)}</button>`).join('')}</div>
        <div class="seg amz-seg" id="exf-richtung"><button class="seg-b${richtung === 'hoch' ? ' an' : ''}" data-wert="hoch" onclick="_exSeg(this)">${_t('steigt')}</button><button class="seg-b${richtung === 'runter' ? ' an' : ''}" data-wert="runter" onclick="_exSeg(this)">${_t('sinkt')}</button></div>
        <label class="amz-feld amz-ziel-wert"><span id="exf-wert-lbl">${_t('um wie viel? (optional)')}</span><input id="exf-wert" type="text" inputmode="decimal" placeholder="${_t('z. B. 1')}" value="${alt?.ziel_wert ? String(alt.ziel_wert).replace('.', _amzEn() ? '.' : ',') : ''}"/></label>
      </div>
      <details class="amz-details amz-mehr-angeben"${mehrOffen ? ' open' : ''}><summary>${_t('Mehr angeben (optional) — vorher/nachher, warum, Link')}</summary>
        <div class="amz-form-raster">
          <label class="amz-feld"><span>${_t('Vorher')}</span><input id="exf-alt" type="text" value="${_amzEsc(v.alt || '')}" placeholder="${_t('z. B. Produkt freigestellt / 19,99 €')}"/></label>
          <label class="amz-feld"><span>${_t('Nachher')}</span><input id="exf-neu" type="text" value="${_amzEsc(v.neu || '')}" placeholder="${_t('z. B. Paar trägt die Armbänder / 22,99 €')}"/></label>
          <label class="amz-feld amz-breit"><span>${_t('Warum? (kurz)')}</span><input id="exf-warum" type="text" maxlength="500" value="${_amzEsc(alt?.begruendung || '')}" placeholder="${_t('z. B. Lifestyle-Bild zeigt Größe und Wirkung besser')}"/></label>
          <label class="amz-feld amz-breit"><span>${_t('Link zu Unterlagen (Screenshot, Drive, Entwurf)')}</span><input id="exf-link" type="url" value="${_amzEsc(alt?.link || '')}" placeholder="https://…"/></label>
        </div></details>
      <div id="exf-warnung"></div>
      <div class="amz-zeile"><button class="btn btn-accent" onclick="_exSpeichern()">${_t(alt ? 'Änderungen speichern' : 'Eintragen')}</button><span class="amz-fehler" id="exf-fehler"></span></div>
    </div>`;
  _exAuswahlZeigen();
  _exWertBeschriftung();
}
function _exProduktSuchen(q) {
  q = q.trim().toLowerCase();
  document.querySelectorAll('#exf-produkte .amz-prod').forEach(el => {
    el.hidden = q ? !el.dataset.name.includes(q) : (el.dataset.leer === '1' && !_ex.formAuswahl.has(el.dataset.id));
  });
}
function _exProduktWaehlen(id) {
  _ex.formAuswahl.has(id) ? _ex.formAuswahl.delete(id) : _ex.formAuswahl.add(id);
  _exAuswahlZeigen();
}
// „Alle Armbänder" usw.: alle dieser Art an — sind schon alle an, alle aus
function _exArtWaehlen(art) {
  const ids = _ex.formArten?.[art] || [];
  const alleAn = ids.every(id => _ex.formAuswahl.has(id));
  for (const id of ids) alleAn ? _ex.formAuswahl.delete(id) : _ex.formAuswahl.add(id);
  _exAuswahlZeigen();
}
function _exAuswahlZeigen() {
  document.querySelectorAll('#exf-produkte .amz-prod').forEach(el => el.classList.toggle('gewaehlt', _ex.formAuswahl.has(el.dataset.id)));
  document.querySelectorAll('.amz-schnellwahl [data-art]').forEach(el => el.classList.toggle('an', (_ex.formArten?.[el.dataset.art] || []).every(id => _ex.formAuswahl.has(id))));
  const n = _ex.formAuswahl.size, a = document.getElementById('exf-anzahl');
  if (a) a.textContent = n ? _t('{n} ausgewählt', { n }) : '';
  // Warnung, wenn an einem dieser Produkte schon eine Änderung läuft
  const gs = _ex.formAuswahl;
  const laufend = _ex.liste.filter(e => e.id !== _ex.bearbeiten && _exGruppen(e).some(g => gs.has(g)) && ['laeuft', 'wartet'].includes(_ex.ergebnisse?.get(e.id)?.urteil));
  const w = document.getElementById('exf-warnung');
  if (w) w.innerHTML = laufend.length ? `<div class="ov-pruef-zeile">${_t(laufend.length === 1 ? 'An einem dieser Produkte läuft schon: {liste}.' : 'An diesen Produkten läuft schon: {liste}.', {
    liste: laufend.slice(0, 3).map(e => `${_amzEsc(_exName(e))} (${_amzEsc(_t(e.change_type))}, ${_t('bis {d}', { d: _amzDatum(_exPlanEnde(e)) })})`).join(', ') + (laufend.length > 3 ? ' …' : '') })}
    ${_t('Eine weitere Änderung jetzt macht die Ergebnisse unsicher.')}</div>` : '';
}
function _exChip(el) { el.parentElement.querySelectorAll('.amz-chip').forEach(c => c.classList.toggle('an', c === el)); }
function _exSeg(el) { el.parentElement.querySelectorAll('.seg-b').forEach(c => c.classList.toggle('an', c === el)); _exWertBeschriftung(); }
function _exWertBeschriftung() {
  const k = document.querySelector('#exf-kennzahl .seg-b.an')?.dataset.wert, l = document.getElementById('exf-wert-lbl');
  if (l && k) l.textContent = _t('um wie viel? (optional, {einheit})', { einheit: _t(AMZ_ZIELE[k].zielEinheit) });
}
async function _exSpeichern() {
  const v = id => document.getElementById(id)?.value.trim() || '';
  const an = id => document.querySelector(`#${id} .an`)?.dataset.wert || '';
  const fehler = t => { document.getElementById('exf-fehler').textContent = _t(t); };
  if (!_ex.formAuswahl.size) return fehler('Bitte oben mindestens ein Produkt wählen.');
  if (!an('exf-ebene')) return fehler('Bitte wählen, was geändert wurde.');
  const wert = v('exf-wert').replace(',', '.');
  if (wert && !(+wert > 0)) return fehler('„Um wie viel" bitte als Zahl größer 0.');
  const start = v('exf-start'), dauer = parseInt(an('exf-dauer'), 10) || AMZ_EXP_TAGE;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(start)) return fehler('Bitte das Datum der Änderung angeben.');
  const felder = { change_type: an('exf-ebene'), start_date: start, end_date: _amzPlus(start, dauer - 1),
    old_value: v('exf-alt'), new_value: v('exf-neu'), ziel_kennzahl: an('exf-kennzahl'), ziel_richtung: an('exf-richtung'),
    ziel_wert: wert || null, begruendung: v('exf-warum'), link: v('exf-link') };
  // Varianten nur neu festlegen, wenn sich die Produktauswahl geändert hat (sonst bleibt die gespeicherte Liste)
  if (_ex.bearbeiten == null || [..._ex.formAuswahl].sort().join() !== _ex.formStart) felder.asins = _exVariantenVon([..._ex.formAuswahl]);
  try {
    let id = _ex.bearbeiten;
    if (id != null) await _amzApi('/experimente/' + id, { method: 'PATCH', body: felder });
    else id = (await _amzApi('/experimente', { method: 'POST', body: felder })).id;
    Object.assign(_ex, { ansicht: 'detail', gewaehlt: id, vorlage: null, bearbeiten: null, formAuswahl: new Set(), formStart: '' });
    _amzToast(_t('✓ Gespeichert'));
    amzExperimenteZeigen();
  } catch (e) { fehler(e.message); }
}
async function _exNotizSpeichern(id) {
  try { await _amzApi('/experimente/' + id, { method: 'PATCH', body: { note: document.getElementById('amz-ex-notiz').value } }); _amzToast(_t('✓ Notiz gespeichert')); amzExperimenteZeigen(); }
  catch (e) { _amzToast('⚠ ' + e.message, 3500); }
}
// Test jetzt beenden: ausgewertet wird bis zum letzten Tag mit Amazon-Zahlen (höchstens bis zum geplanten Ende)
async function _exBeenden(id) {
  const e = _ex.liste.find(x => x.id === id); if (!e) return;
  const plan = _exPlanEnde(e), bis = _amz.stand.bis, ende = plan < bis ? plan : (bis < e.start_date ? e.start_date : bis);
  if (!(await _amzFrage(_t('Test beenden?'), _t('Ausgewertet wird bis {d}. Danach lässt er sich nur noch mit „Wieder öffnen" ändern.', { d: _amzDatum(ende) }), _t('Beenden')))) return;
  _exAendern(id, { status: 'abgeschlossen', end_date: ende });
}
async function _exAendern(id, felder) {
  try { await _amzApi('/experimente/' + id, { method: 'PATCH', body: felder }); amzExperimenteZeigen(); }
  catch (e) { _amzToast('⚠ ' + e.message, 3500); }
}
async function _exLoeschen(id) {
  if (!(await _amzFrage(_t('Test löschen?'), _t('Der Eintrag verschwindet samt Auswertung. Die Verkaufsdaten bleiben.'), _t('Löschen')))) return;
  try { await _amzApi('/experimente/' + id, { method: 'DELETE' }); _ex.gewaehlt = null; amzExperimenteZeigen(); }
  catch (e) { _amzToast('⚠ ' + e.message, 3500); }
}
async function _exVorschlagIgnorieren(key) {
  try { await _amzApi('/preisvorschlag-ignorieren', { method: 'POST', body: { key } }); _ex.ignoriert.add(key); _exLinksBauen(); _amzExZeichnen(); }
  catch (e) { _amzToast('⚠ ' + e.message, 3500); }
}
