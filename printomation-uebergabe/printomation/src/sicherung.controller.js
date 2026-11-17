// ── Nächtliche Sicherung der Betriebsdaten ────────────────────────────────────
// Jede Nacht ein Archiv aller Daten, die sich nicht aus Amazon nachladen lassen: Layouts, Ordner,
// Laser-Presets, Einstellungen, Zeitplan, Ledger, Abruf-Marke, Reklamations-Urteile, Motive, Schriften,
// ASIN-Profile, Ezcad-Stiftsicherungen und das Standard-Testfoto. 14 Tage, rollierend.
// KEINE Kundendaten (public/ bleibt draußen) und keine Zugangsdaten (.env, config.js).
//
// Zurückholen, z. B. die Layouts vom 26.10.:
//   tar xzf sicherungen/automatisch/sicherung-2026-10-26.tar.gz -C /tmp/rueck daten/layouts.json
// und die Datei dann gezielt zurückkopieren (vorher pm2 stoppen, s. LIESMICH.txt). Archive bis
// 24.10.2026 haben die Daten-Dateien ohne „daten/" davor (sie lagen damals direkt in src/).
// [EN] ── Nightly backup of operational data ──────────────────────────────────────
// Every night an archive of all data that cannot be re-fetched from Amazon: layouts, folders,
// laser presets, settings, schedule, ledger, fetch watermark, complaint judgments, motives, fonts,
// ASIN profiles, Ezcad pen backups, and the standard test photo. 14 days, rolling retention.
// NO customer data (public/ remains excluded) and no credentials (.env, config.js).
//
// Restoration example, e.g. layouts from 26.10.:
//   tar xzf sicherungen/automatisch/sicherung-2026-10-26.tar.gz -C /tmp/rueck daten/layouts.json
// and then copy the file back (stop pm2 first, see LIESMICH.txt). Archives prior to
// 24.10.2026 have data files without "daten/" prefix (they were located directly in src/).
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { berlinDayBefore } = require('./time-range');
const { createLogger } = require('./utils/logger');
const logger = createLogger('index.log', __filename);

const SICHERUNG_ZIEL = path.join(__dirname, '..', 'sicherungen', 'automatisch');
// Neue Datenablage = hier eintragen. Pfade relativ zu src/, so stehen sie auch im Archiv.
// [EN] New data location = add here. Paths relative to src/, as stored in the archive.
const DATEN = ['layouts.json', 'folders.json', 'laser-presets.json', 'settings.json', 'schedule.json',
               'vorlage-stand.json', 'processed-orders.json', 'fetch-watermark.json', 'rekla-urteile.json'];
const INHALT = [...DATEN.map(n => path.join('daten', n)), 'motive', 'fonts', 'asin-profile', 'ezd-sicherung', 'testfoto'];
// Die Ezcad-Vorlagen (.ezd) liegen unter public/ (das Netzlaufwerk des Laser-PCs) und sind von Hand
// in Ezcad gebaut — nicht nachladbar. Nur sie und „Tag laden.bat" kommen mit, nie die Fotos daneben
// (platzN.bmp = Kundendaten); Entwürfe und Testkopien bleiben draußen.
// [EN] Ezcad templates (.ezd) reside under public/ (the laser PC's network drive) and are built by hand
// in Ezcad — non-recoverable. Only these and "Tag laden.bat" are included, never customer photos next to them
// (platzN.bmp = customer data); drafts and test copies remain excluded.
const VORLAGE_DIR = path.join('public', 'exports', '_Vorlage');
function vorlagenDateien() {
  const basis = path.join(__dirname, VORLAGE_DIR);
  const aus = [];
  try {
    for (const d of fs.readdirSync(basis, { withFileTypes: true })) {
      if (d.isFile() && /\.bat$/i.test(d.name)) aus.push(path.join(VORLAGE_DIR, d.name));
      if (!d.isDirectory()) continue;
      for (const f of fs.readdirSync(path.join(basis, d.name)))
        if (/\.ezd$/i.test(f) && !/ (ENTWURF|TEST)[^\\/]*\.ezd$/i.test(f)) aus.push(path.join(VORLAGE_DIR, d.name, f));
    }
  } catch (_) {}
  return aus;
}
const BEHALTEN = 14;
const MUSTER = /^sicherung-\d{4}-\d{2}-\d{2}\.tar\.gz$/;

function nachtSicherung() {
  fs.mkdirSync(SICHERUNG_ZIEL, { recursive: true, mode: 0o700 });
  const datei = path.join(SICHERUNG_ZIEL, `sicherung-${berlinDayBefore(0)}.tar.gz`);
  const teile = [...INHALT.filter(n => fs.existsSync(path.join(__dirname, n))), ...vorlagenDateien()];
  // Erst unter Zwischennamen schreiben: ein abgebrochenes tar hinterlässt sonst ein
  // halbes Archiv unter dem richtigen Namen, das wie eine gültige Sicherung aussieht.
  // [EN] Write under temporary name first: an aborted tar would otherwise leave
  // a half-written archive under the final name that appears to be valid.
  const tmp = datei + '.tmp';
  try {
    execFileSync('tar', ['czf', tmp, '-C', __dirname, ...teile]);
    fs.renameSync(tmp, datei);
  } finally {
    fs.rmSync(tmp, { force: true });
  }
  // Rollierend: die neuesten BEHALTEN Archive bleiben (Name sortiert = Datum sortiert)
  // [EN] Rolling retention: the newest BEHALTEN archives are kept (name sorted = date sorted)
  const alle = fs.readdirSync(SICHERUNG_ZIEL).filter(n => MUSTER.test(n)).sort();
  for (const alt of alle.slice(0, Math.max(0, alle.length - BEHALTEN))) {
    fs.rmSync(path.join(SICHERUNG_ZIEL, alt), { force: true });
  }
  const kb = Math.round(fs.statSync(datei).size / 1024);
  logger.log(`Nacht-Sicherung: ${path.basename(datei)} (${kb} KB, ${teile.length} Teile), `
    + `${Math.min(alle.length, BEHALTEN)} Sicherung(en) vorhanden.`);
  return datei;
}

module.exports = { nachtSicherung, SICHERUNG_ZIEL };
