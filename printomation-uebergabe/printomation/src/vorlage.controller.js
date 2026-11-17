// ── Ezcad-Vorlagen: Arbeitsordner, Tagesarchiv, .ezd lesen ───────────────────
// Die Vorlagen-Layouts (F02) schreiben in einen FESTEN Arbeitsordner exports/_Vorlage/<Ordner>/, auf
// den eine .ezd mit „Dynamic File" zeigt; jeder Lauf legt dieselben Dateien zusätzlich ins Tagesarchiv
// <Tag>/<Gruppe>/<Ordner>/ samt lade-diesen-tag.bat. Dieses Modul:
//  - Übersicht: welcher Stand liegt im Arbeitsordner, wie viele Plätze belegt
//  - Archiv: alle ladbaren Tage — gefunden über die ZIEL-Zeile der lade-diesen-tag.bat (findet alte
//    Strukturen, Folge-Sätze und Reklamationen ohne Sonderfälle), dazu exports/_Pruefgravur/<Ordner>/
//  - Laden: Archiv → Arbeitsordner, wie die .bat, aber auf dem Server
//  - .ezd lesen: Vorschaubild und Objekte (Pfade, Positionen) — NUR lesen, s. tools/ezd
// [EN] ── Ezcad Templates: Working directory, daily archive, reading .ezd ─────
// Template layouts (F02) write to a FIXED working folder exports/_Vorlage/<folder>/, pointed
// to by an .ezd using "Dynamic File"; each run additionally places the same files in daily archive
// <Date>/<Group>/<Folder>/ along with lade-diesen-tag.bat. This module handles:
//  - Overview: which status is in working folder, how many spots are occupied
//  - Archive: all loadable days — found via ZIEL line in lade-diesen-tag.bat (finds old
//    structures, follow-up sets, and complaints without edge cases), plus exports/_Pruefgravur/<folder>/
//  - Load: Archive → Working folder, like the .bat script, but executed server-side
//  - Read .ezd: Preview image and objects (paths, positions) — READ ONLY, see tools/ezd
const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
const { execFile } = require('child_process');
const { writeJsonAtomic, readJsonSafe } = require('./utils/json-file');
const { datenDir } = require('./config');

const EXPORTS = path.join(__dirname, 'public', 'exports');
const VORLAGE = path.join(EXPORTS, '_Vorlage');
// Außerhalb von public/ — interner Zustand gehört nicht in den Bereich, den jeder Angemeldete
// (auch Zuschauer) abrufen kann.
// [EN] Outside public/ — internal state must not be in the area accessible to any logged-in
// user (including viewers).
const STAND_DATEI = path.join(datenDir, 'vorlage-stand.json');

// Nur diese Dateien gehören in den Arbeitsordner (dort liegt sonst nur die .ezd).
// gravurN.dxf = Deckeltext je Platz. *.png = Ansicht des Tages (seit 13.10.2026 das PNG-Layout
// F02_*_PNG mit „Speichern in: Ezcad-Vorlage", z. B. F02_Schw_V5_PNG.png; bis 12.10. vorschau.png) —
// Ezcad liest sie nicht, sie wandert aber mit dem Tag in den Arbeitsordner (Nutzerwunsch 13.10.).
// [EN] Only these files belong in the working directory (which otherwise only contains the .ezd).
// gravurN.dxf = lid text per spot. *.png = daily overview (since 13.10.2026 PNG layout
// F02_*_PNG with "Save in: Ezcad template", e.g. F02_Schw_V5_PNG.png; before 12.10. vorschau.png) —
// Ezcad does not read it, but it moves with the day into the working folder (user request 13.10.).
const ARBEITS_DATEI = /^(platz\d+\.bmp|gravur\d*\.dxf|rueckseite\.dxf|seite\d+\.dxf|.+\.png)$/i;
const DXF_DATEI = /^(gravur\d*|rueckseite|seite\d+)\.dxf$/i;

// Leere, gültige DXF (Kopf, keine Geometrie). Ersetzt beim Laden eine DXF, die es im
// gewählten Tag nicht gibt — sonst bliebe die des vorigen Standes liegen und Ezcad
// gravierte deren Text per „Dynamic File".
// [EN] Empty, valid DXF (header, no geometry). Replaces a missing DXF upon loading if absent in
// selected day — otherwise previous status would remain and Ezcad would engrave old text via "Dynamic File".
const LEER_DXF = ['0', 'SECTION', '2', 'HEADER', '9', '$ACADVER', '1', 'AC1009', '0', 'ENDSEC',
  '0', 'SECTION', '2', 'ENTITIES', '0', 'ENDSEC', '0', 'EOF', ''].join('\n');

// Weißes 8×8-px-Blindblatt (1 bit, 500 dpi) — dasselbe, das der Export für leere Plätze schreibt.
// Ersetzt beim Laden eine platzN.bmp, die der gewählte Tag nicht hat (weniger Plätze): sonst
// gravierte Ezcad dort das Foto des vorigen Standes.
// [EN] White 8x8 px blank dummy (1 bit, 500 dpi) — identical to what export writes for empty spots.
// Replaces platzN.bmp when selected day has fewer occupied slots: otherwise Ezcad would
// engrave previous photo.
const LEER_BMP = (() => {
  const b = Buffer.alloc(94);
  b.write('BM', 0); b.writeUInt32LE(94, 2); b.writeUInt32LE(62, 10);
  b.writeUInt32LE(40, 14); b.writeInt32LE(8, 18); b.writeInt32LE(-8, 22); b.writeUInt16LE(1, 26); b.writeUInt16LE(1, 28);
  b.writeUInt32LE(32, 34); b.writeInt32LE(19685, 38); b.writeInt32LE(19685, 42); b.writeUInt32LE(2, 46); b.writeUInt32LE(2, 50);
  b.writeUInt32LE(0x00FFFFFF, 58);                     // Palette: 0 schwarz, 1 weiß / [EN] Palette: 0 black, 1 white
  for (let y = 0; y < 8; y++) b[62 + y * 4] = 0xFF;    // alle Punkte weiß / [EN] all dots white
  return b;
})();

// Sicherungen der .ezd vor jedem Schreiben — außerhalb von public/, je Datei die letzten 30
// [EN] Backups of .ezd before every write — outside public/, latest 30 versions per file
const SICHERUNG = path.join(__dirname, 'ezd-sicherung');
const SICHERUNG_MAX = 30;

const ordnerName = (s) => String(s || '').replace(/[\/\\]/g, '').replace(/\.\.+/g, '.').trim();

const leseStand = () => readJsonSafe(STAND_DATEI, {});

// Vom Export-Upload und vom Laden aufgerufen: was liegt gerade im Arbeitsordner.
// [EN] Called by export upload and loading: tracks current status in working folder.
function merkeStand(ordner, eintrag) {
  const stand = leseStand();
  stand[ordner] = { ...eintrag, zeit: new Date().toISOString() };
  writeJsonAtomic(STAND_DATEI, stand);
}

// Fingerabdruck von platzN.bmp + nicht-leeren Gravur-DXF eines Ordners. Damit erkennt die
// Übersicht, WELCHER Tag im Arbeitsordner liegt — egal ob ihn der Lauf, der Reiter, Tag laden.bat
// oder eine lade-diesen-tag.bat hineingelegt hat. Die DXF zählen mit, damit Prüf-Gravuren
// („Gravur 1…12") als „passt zu keinem Tag" auffallen; LEERE DXF zählen nicht, weil das Laden
// eine im Archiv fehlende DXF leert statt kopiert.
// [EN] Fingerprint of platzN.bmp + non-empty engraving DXFs of a folder. Enables the overview
// to recognize WHICH day is in the working folder — whether placed by runner, UI tab, Tag laden.bat,
// or a lade-diesen-tag.bat script. DXFs are counted so test engravings ("Gravur 1..12") stand out as
// "matches no day"; EMPTY DXFs do not count, because loading clears missing DXFs instead of copying.
const _hashCache = new Map();
function platzHash(dir) {
  let dateien;
  try {
    dateien = fs.readdirSync(dir).filter(f => /^platz\d+\.bmp$/i.test(f)
      || (DXF_DATEI.test(f) && fs.statSync(path.join(dir, f)).size >= 600));
  } catch (_) { return null; }
  if (!dateien.some(f => /^platz/i.test(f))) return null;
  dateien.sort();
  const sig = dateien.map(f => { const st = fs.statSync(path.join(dir, f)); return `${f}:${st.size}:${st.mtimeMs}`; }).join('|');
  const alt = _hashCache.get(dir);
  if (alt && alt.sig === sig) return alt.hash;
  const h = crypto.createHash('md5');
  for (const f of dateien) { h.update(f); h.update(fs.readFileSync(path.join(dir, f))); }
  const hash = h.digest('hex');
  _hashCache.set(dir, { sig, hash });
  return hash;
}

// Arbeitsordner + Archiv in EINEM Durchgang — archiv() durchsucht den ganzen exports-Baum
// (vorher rief die Route es ein zweites Mal auf).
// [EN] Working directory + archive in ONE pass — archiv() searches the whole exports tree
// (previously the route called it twice).
function uebersicht() {
  const stand = leseStand();
  const alleArchive = archiv();
  let ordner = [];
  try { ordner = fs.readdirSync(VORLAGE, { withFileTypes: true }).filter(e => e.isDirectory()).map(e => e.name); }
  catch (_) { return { ordner: [], archiv: alleArchive }; }
  return { archiv: alleArchive, ordner: ordner.sort().map(name => {
    const dir = path.join(VORLAGE, name);
    const dateien = fs.readdirSync(dir);
    const st = (f) => { try { return fs.statSync(path.join(dir, f)); } catch (_) { return null; } };
    const plaetze = dateien.filter(f => /^platz\d+\.bmp$/i.test(f));
    return {
      ordner: name,
      plaetze: plaetze.length,
      // Blindblätter sind 8×8 px (94 B), echte Fotos zig KB
      belegt: plaetze.filter(f => (st(f)?.size || 0) > 1024).length,
      dxf: dateien.filter(f => DXF_DATEI.test(f)).map(f => ({ datei: f, leer: (st(f)?.size || 0) < 600 })),
      // Jüngstes platzN.bmp — die Bühne hängt es an die Bild-URLs (neuer Stand = neu laden)
      bilderZeit: plaetze.reduce((m, f) => { const t = st(f)?.mtime; return t && (!m || t > m) ? t : m; }, null),
      ezd: dateien.filter(f => /\.ezd$/i.test(f)).sort().map(f => ({ datei: f, groesse: st(f).size, geaendert: st(f).mtime,
                                                                     sicherungen: sicherungen(name, f) })),
      fremd: dateien.filter(f => !ARBEITS_DATEI.test(f) && !/\.ezd$/i.test(f)),
      stand: stand[name] || null,
      // Archiv mit identischen Bildern (neuester zuerst). Leere Tage (alle Plätze weiß)
      // gleichen sich untereinander — dann ist die Zuordnung nicht eindeutig.
      erkannt: (() => {
        const eigen = platzHash(dir);
        if (!eigen) return null;
        const belegt = plaetze.filter(f => (st(f)?.size || 0) > 1024).length;
        const treffer = alleArchive.filter(a => a.ordner === name && a.plaetze === plaetze.length && a.belegt === belegt
          && platzHash(path.join(EXPORTS, a.pfad)) === eigen);
        // Mehrere bitgleich (eine Reklamation der einzigen Bestellung von Satz 2 = Satz 2): zuerst der
        // Ordner, der laut Stand geladen wurde, dann der normale Tageslauf („<Tag>/…"), sonst der jüngste.
        const t = treffer.find(a => stand[name]?.pfad && a.pfad === stand[name].pfad)
               || treffer.find(a => /^\d{4}-\d{2}-\d{2}\//.test(a.pfad)) || treffer[0];
        return t ? { tag: t.tag, pfad: t.pfad, satz: t.satz, pruef: t.pruef } : null;
      })(),
    };
  }) };
}

// Alle Archiv-Ordner mit lade-diesen-tag.bat. Tiefe begrenzt: <Tag>/<Gruppe>/<Ordner>
// bzw. die alte Form <Tag>/<Gruppe>/Vorlage/<Ordner> — mehr als 4 Ebenen gibt es nicht.
// [EN] All archive folders containing lade-diesen-tag.bat. Depth bounded: <Date>/<Group>/<Folder>
// or old form <Date>/<Group>/Vorlage/<Folder> — max 4 levels deep.
function archiv() {
  const treffer = [];
  const suche = (dir, rel, tiefe) => {
    let eintraege;
    try { eintraege = fs.readdirSync(dir, { withFileTypes: true }); } catch (_) { return; }
    if (eintraege.some(e => e.isFile() && e.name === 'lade-diesen-tag.bat')) {
      let ziel = '';
      try {
        const m = fs.readFileSync(path.join(dir, 'lade-diesen-tag.bat'), 'latin1')
          .match(/set ZIEL=.*\\_Vorlage\\([^\r\n]+)/i);
        ziel = m ? m[1].trim() : '';
      } catch (_) {}
      if (ziel) {
        const plaetze = eintraege.filter(e => /^platz\d+\.bmp$/i.test(e.name));
        treffer.push({
          ordner: ziel, pfad: rel,
          tag: (rel.match(/^(\d{4}-\d{2}-\d{2})/) || [])[1] || '',
          pruef: rel.startsWith('_Pruefgravur/'),
          satz: Number((path.basename(rel).match(/ Satz(\d+)$/) || [])[1] || 1),
          plaetze: plaetze.length,
          belegt: plaetze.filter(e => { try { return fs.statSync(path.join(dir, e.name)).size > 1024; } catch (_) { return false; } }).length,
          geaendert: fs.statSync(path.join(dir, 'lade-diesen-tag.bat')).mtime,
        });
      }
    }
    if (tiefe >= 4) return;
    for (const e of eintraege) {
      if (!e.isDirectory() || (tiefe === 0 && e.name === '_Vorlage')) continue;
      suche(path.join(dir, e.name), rel ? `${rel}/${e.name}` : e.name, tiefe + 1);
    }
  };
  suche(EXPORTS, '', 0);
  // Echte Tage zuerst (neuester oben, Satz 1 vor Satz 2), die Prüfgravur ganz unten — sie
  // soll nie die Vorauswahl sein.
  // [EN] Real days first (newest on top, Set 1 before Set 2), test engraving at the very bottom —
  // it should never be the preselected default.
  return treffer.sort((a, b) => (a.pruef - b.pruef) || (b.geaendert - a.geaendert) || (a.satz - b.satz));
}

// Archiv-Ordner → Arbeitsordner. Atomar je Datei (erst .tmp, dann rename), damit Ezcad
// nie eine halb kopierte BMP liest, falls gerade markiert wird.
// [EN] Archive folder → Working folder. Atomic per file (.tmp first, then rename), so Ezcad
// never reads a half-copied BMP while marking/engraving.
function laden(relPfad) {
  const quelle = path.resolve(EXPORTS, String(relPfad || ''));
  if (!quelle.startsWith(EXPORTS + path.sep) || quelle.startsWith(VORLAGE + path.sep)) {
    throw new Error('Ungültiger Archiv-Pfad');
  }
  const eintrag = archiv().find(a => path.resolve(EXPORTS, a.pfad) === quelle);
  if (!eintrag) throw new Error('Kein ladbarer Archiv-Ordner (lade-diesen-tag.bat fehlt)');
  const ordner = ordnerName(eintrag.ordner);
  const ziel = path.join(VORLAGE, ordner);
  if (!ziel.startsWith(VORLAGE + path.sep)) throw new Error('Ungültiger Zielordner');
  fs.mkdirSync(ziel, { recursive: true });

  const kopieren = (daten, datei) => {
    const tmp = path.join(ziel, `.${datei}.laden-tmp`);
    fs.writeFileSync(tmp, daten);
    fs.renameSync(tmp, path.join(ziel, datei));
  };
  const quellDateien = fs.readdirSync(quelle).filter(f => ARBEITS_DATEI.test(f));
  if (!quellDateien.some(f => /^platz\d+\.bmp$/i.test(f))) throw new Error('Im Archiv-Ordner liegen keine platzN.bmp');
  for (const f of quellDateien) kopieren(fs.readFileSync(path.join(quelle, f)), f);
  // Was der gewählte Tag nicht hat, im Arbeitsordner LEEREN (nicht löschen: fehlt die
  // Datei, nimmt Ezcad die in der .ezd eingebettete Kopie). Das gilt auch für platzN.bmp —
  // hat der Tag weniger Plätze, gravierte Ezcad sonst die übrigen vom vorigen Stand.
  // Eine Ansicht (*.png), die der Tag nicht hat, fliegt raus — sie zeigte einen anderen Tag.
  // [EN] Whatever selected day lacks, BLANK in working folder (do not delete: if file is missing,
  // Ezcad falls back to copy embedded in .ezd). Applies to platzN.bmp as well — if day has fewer spots,
  // Ezcad would otherwise engrave leftovers from previous run.
  // Preview (*.png) not in current day is removed — it displayed a different day.
  const geleert = [];
  for (const f of fs.readdirSync(ziel)) {
    if (quellDateien.includes(f)) continue;
    if (DXF_DATEI.test(f)) kopieren(LEER_DXF, f);
    else if (/^platz\d+\.bmp$/i.test(f)) kopieren(LEER_BMP, f);
    else if (/\.png$/i.test(f)) fs.rmSync(path.join(ziel, f), { force: true });
    else continue;
    geleert.push(f);
  }
  merkeStand(ordner, { tag: eintrag.pruef ? 'Prüfgravur' : eintrag.tag, quelle: 'archiv', pfad: eintrag.pfad, satz: eintrag.satz });
  return { ordner, kopiert: quellDateien.length, geleert, tag: eintrag.tag, satz: eintrag.satz };
}

// .ezd lesen über tools/ezd/lesen.py (0,4–2 s je Datei, F02_Schw_V5R am längsten). Zwischenspeicher
// je Datei (Pfad + Größe + Zeit) im Speicher UND unter src/tmp/ezd-lesen/ — sonst las jeder
// pm2-Neustart alle .ezd neu ein, obwohl sich keine geändert hatte.
// [EN] Read .ezd via tools/ezd/lesen.py (0.4–2s per file, F02_Schw_V5R longest). Cache per file
// (path + size + timestamp) in memory AND in src/tmp/ezd-lesen/ — prevents each pm2 restart
// from re-parsing all .ezds when none changed.
const _ezdCache = new Map();
const EZD_CACHE_DIR = path.join(__dirname, 'tmp', 'ezd-lesen');
const _ezdCacheDatei = voll => path.join(EZD_CACHE_DIR, crypto.createHash('sha1').update(voll).digest('hex') + '.json');
function ezdLesen(ordner, datei) {
  return new Promise((resolve, reject) => {
    const o = ordnerName(ordner), d = ordnerName(datei);
    if (!/\.ezd$/i.test(d)) return reject(new Error('Keine .ezd'));
    const voll = path.join(VORLAGE, o, d);
    if (!voll.startsWith(VORLAGE + path.sep)) return reject(new Error('Ungültiger Pfad'));
    let st;
    try { st = fs.statSync(voll); } catch (_) { return reject(new Error('Datei nicht gefunden')); }
    const schluessel = `${voll}|${st.size}|${st.mtimeMs}`;
    if (_ezdCache.has(schluessel)) return resolve(_ezdCache.get(schluessel));
    const platte = readJsonSafe(_ezdCacheDatei(voll), null);
    if (platte && platte.schluessel === schluessel && platte.erg) {
      _ezdCache.set(schluessel, platte.erg);
      return resolve(platte.erg);
    }
    execFile('python3', [path.join(__dirname, 'tools', 'ezd', 'lesen.py'), voll],
      // Kein __pycache__ neben dem Parser anlegen
      { timeout: 60000, maxBuffer: 20 * 1024 * 1024, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } },
      (err, stdout, stderr) => {
        if (err) return reject(new Error('ezd nicht lesbar: ' + (String(stderr).trim().split('\n').pop() || err.message)));
        try {
          const erg = JSON.parse(stdout);
          for (const k of _ezdCache.keys()) if (k.startsWith(voll + '|')) _ezdCache.delete(k);
          _ezdCache.set(schluessel, erg);
          try { fs.mkdirSync(EZD_CACHE_DIR, { recursive: true }); writeJsonAtomic(_ezdCacheDatei(voll), { schluessel, erg }); }
          catch (_) {}   // nur Beschleunigung — ohne Plattenkopie liest der nächste Start eben neu
          resolve(erg);
        } catch (e) { reject(new Error('ezd-Ausgabe unlesbar: ' + e.message)); }
      });
  });
}

// ── .ezd ändern: Pfad, Sicherungen ───────────────────────────────────────────
// Geschrieben wird immer über eine geprüfte Kopie neben dem Original → umbenennen (atomar, Rechte wie
// vorher). Ezcad merkt die Änderung erst beim nächsten Öffnen der Datei; speichert der Bediener
// vorher in Ezcad, schreibt Ezcad den alten Stand zurück. (Stift-Werte ändern war bis 20.10.2026 hier
// — Nutzer: „brauche ich nicht"; tools/ezd/schreiben.py gehörte dazu.)
// [EN] ── Modify .ezd: path, backups ──────────────────────────────────────────
// Writing always happens via verified copy beside original → rename (atomic, retaining permissions).
// Ezcad only registers change upon next file open; if operator saves in Ezcad first, Ezcad writes back
// old state. (Pen value modification was here until 20.10.2026 — operator: "not needed"; tools/ezd/schreiben.py was part of it).
function ezdPfad(ordner, datei) {
  const o = ordnerName(ordner), d = ordnerName(datei);
  if (!/\.ezd$/i.test(d)) throw new Error('Keine .ezd');
  const voll = path.join(VORLAGE, o, d);
  if (!voll.startsWith(VORLAGE + path.sep) || !fs.existsSync(voll)) throw new Error('Datei nicht gefunden');
  return { o, d, voll };
}

// Sicherungen GENAU dieser Datei, neueste zuerst. Name = „<Stamm> <Zeitstempel>[-N].ezd" — der
// Stempel muss direkt folgen: „F02_Schw_V5R " ist auch der Anfang von „F02_Schw_V5R ENTWURF …".
// [EN] Backups of EXACTLY this file, newest first. Format = "<Base> <Timestamp>[-N].ezd" —
// timestamp must follow immediately: "F02_Schw_V5R " is also the prefix of "F02_Schw_V5R ENTWURF …".
function sicherungen(ordner, datei) {
  const dir = path.join(SICHERUNG, ordnerName(ordner));
  const stamm = ordnerName(datei).replace(/\.ezd$/i, '');
  const muster = new RegExp('^' + stamm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ' \\d{4}(-\\d{2}){5}(-\\d+)?\\.ezd$', 'i');
  try {
    return fs.readdirSync(dir).filter(f => muster.test(f))
      .map(f => ({ name: f, zeit: fs.statSync(path.join(dir, f)).mtime }))
      .sort((a, b) => (b.zeit - a.zeit) || b.name.localeCompare(a.name));
  } catch (_) { return []; }
}

function sichern(o, d, voll) {
  const dir = path.join(SICHERUNG, o);
  fs.mkdirSync(dir, { recursive: true });
  const stempel = new Date().toISOString().replace(/[:T]/g, '-').slice(0, 19);
  // Nie eine vorhandene Sicherung überschreiben — zwei Sicherungen in derselben Sekunde (Übernehmen
  // und gleich Zurückholen) trafen sonst denselben Namen, und Zurückholen holte den falschen Stand.
  // [EN] Never overwrite an existing backup — two backups in the same second (accept then immediately restore)
  // would collide on name, and restore would fetch the wrong state.
  let name = `${d.replace(/\.ezd$/i, '')} ${stempel}.ezd`;
  for (let k = 2; fs.existsSync(path.join(dir, name)); k++) name = `${d.replace(/\.ezd$/i, '')} ${stempel}-${k}.ezd`;
  fs.copyFileSync(voll, path.join(dir, name));
  const jetzt = new Date(); fs.utimesSync(path.join(dir, name), jetzt, jetzt);   // Zeit = Zeitpunkt der Sicherung / [EN] time = time of backup
  for (const alt of sicherungen(o, d).slice(SICHERUNG_MAX)) fs.rmSync(path.join(dir, alt.name), { force: true });
  return name;
}

// Sperre: gerade wird eine .ezd geschrieben (Entwurf, Übernehmen, Zurückholen)
// [EN] Lock: an .ezd is currently being written (draft, apply, restore)
let _schreibt = false;

// Sicherung zurückholen — der aktuelle Stand wird vorher selbst gesichert
// [EN] Restore backup — current state is backed up first
function zurueckholen(ordner, datei, name) {
  const { o, d, voll } = ezdPfad(ordner, datei);
  const n = ordnerName(name);
  const quelle = path.join(SICHERUNG, o, n);
  if (!sicherungen(o, d).some(s => s.name === n) || !fs.existsSync(quelle)) throw new Error('Sicherung nicht gefunden');
  if (_schreibt) throw new Error('Es wird gerade eine .ezd geschrieben');
  const modus = fs.statSync(voll).mode & 0o777;
  const daten = fs.readFileSync(quelle);   // ERST lesen, dann den jetzigen Stand sichern (Aufräumen könnte die Quelle treffen) / [EN] Read FIRST, then back up current state
  const sicherung = sichern(o, d, voll);
  const tmp = path.join(path.dirname(voll), `.${d}.schreiben-tmp`);
  fs.writeFileSync(tmp, daten);
  fs.chmodSync(tmp, modus);
  fs.renameSync(tmp, voll);
  return { ordner: o, datei: d, zurueck: n, sicherung };
}

// ── .ezd ändern: Objekte (tools/ezd/objekte.py) — immer erst als ENTWURF ──────
// Lage, Stift-Zuordnung usw. stehen im gepackten Teil. Geändert wird nie die echte Datei, sondern
// „<Name> ENTWURF.ezd" daneben (weitere Änderungen bauen auf dem Entwurf auf). Den kann man in
// Ezcad öffnen und ansehen; erst „Übernehmen" ersetzt die echte Datei (mit Sicherung).
// [EN] ── Modify .ezd: objects (tools/ezd/objekte.py) — always as DRAFT first ──
// Position, pen mapping, etc. are stored in packed section. Never modifies original directly, but
// "<Name> ENTWURF.ezd" beside it (further edits build on draft). Can be opened and inspected in
// Ezcad; only "Accept" replaces the real file (with backup).
const ENTWURF = / ENTWURF\.ezd$/i;
const entwurfName = d => d.replace(/\.ezd$/i, '') + ' ENTWURF.ezd';

function objekteAendern(ordner, datei, auftrag) {
  return new Promise((resolve, reject) => {
    if (_schreibt) return reject(new Error('Es wird gerade eine .ezd geschrieben'));
    let ziel;
    try { ziel = ezdPfad(ordner, datei); } catch (e) { return reject(e); }
    if (ENTWURF.test(ziel.d)) return reject(new Error('Bitte die echte Datei angeben, nicht den Entwurf'));
    if (!auftrag || typeof auftrag !== 'object') return reject(new Error('Kein Auftrag'));
    const entwurf = path.join(path.dirname(ziel.voll), entwurfName(ziel.d));
    const quelle = fs.existsSync(entwurf) ? entwurf : ziel.voll;
    const tmp = path.join(path.dirname(ziel.voll), `.${ziel.d}.entwurf-tmp`);
    _schreibt = true;
    execFile('python3', [path.join(__dirname, 'tools', 'ezd', 'objekte.py'), quelle, JSON.stringify(auftrag), tmp],
      { timeout: 120000, maxBuffer: 1024 * 1024, env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } },
      (err, stdout, stderr) => {
        try {
          if (err) throw new Error(String(stderr).trim().split('\n').pop() || err.message);
          const erg = JSON.parse(stdout);
          fs.chmodSync(tmp, fs.statSync(ziel.voll).mode & 0o777);
          fs.renameSync(tmp, entwurf);
          resolve({ ordner: ziel.o, datei: ziel.d, entwurf: path.basename(entwurf), aufEntwurf: quelle === entwurf, ...erg });
        } catch (e) {
          fs.rmSync(tmp, { force: true });
          reject(new Error('Nicht geschrieben: ' + e.message));
        } finally { _schreibt = false; }
      });
  });
}

// Entwurf übernehmen (echte Datei wird vorher gesichert) oder verwerfen
// [EN] Apply draft (original file backed up first) or discard
function entwurfAbschliessen(ordner, datei, uebernehmen) {
  const { o, d, voll } = ezdPfad(ordner, datei);
  if (ENTWURF.test(d)) throw new Error('Bitte die echte Datei angeben, nicht den Entwurf');
  const entwurf = path.join(path.dirname(voll), entwurfName(d));
  if (!fs.existsSync(entwurf)) throw new Error('Kein Entwurf vorhanden');
  if (_schreibt) throw new Error('Es wird gerade eine .ezd geschrieben');
  if (!uebernehmen) { fs.rmSync(entwurf); return { ordner: o, datei: d, verworfen: true }; }
  const modus = fs.statSync(voll).mode & 0o777;
  const sicherung = sichern(o, d, voll);
  const tmp = path.join(path.dirname(voll), `.${d}.schreiben-tmp`);
  fs.copyFileSync(entwurf, tmp);
  fs.chmodSync(tmp, modus);
  fs.renameSync(tmp, voll);
  fs.rmSync(entwurf);
  return { ordner: o, datei: d, uebernommen: true, sicherung };
}

module.exports = { uebersicht, laden, ezdLesen, merkeStand, zurueckholen, objekteAendern, entwurfAbschliessen };
