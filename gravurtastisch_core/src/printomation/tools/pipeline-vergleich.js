// Laser-Pipeline alt gegen neu, bitgenau (06.10.2026). Rohbilder (RGBA, Name img<N>_<B>x<H>.rgba)
// im Bildordner; Einstellungen aus allen Layouts, den eigenen Presets und Varianten des Live-Stands.
// Aufruf (aus src/):  node tools/pipeline-vergleich.js <alte laser-pipeline.js> public/laser-pipeline.js <Bildordner>
const fs = require('fs'), path = require('path');
const alt = require(path.resolve(process.argv[2])), neu = require(path.resolve(process.argv[3]));
const pixDir = process.argv[4];
const { datenDir } = require('../config');
const layouts = require(path.join(datenDir, 'layouts.json'));
const presets = require(path.join(datenDir, 'laser-presets.json'));
const sets = {};
for (const l of layouts) if (l.ditherSettings) sets['L:' + l.name] = l.ditherSettings;
// nur verschiedene Einstellungen behalten
const uniq = new Map();
for (const [k, v] of Object.entries(sets)) { const j = JSON.stringify(alt._laserSettings(v)); if (!uniq.has(j)) uniq.set(j, k); }
const liste = [...uniq.entries()].map(([j, k]) => [k, JSON.parse(j)]);
for (const p of presets) liste.push(['P:' + p.name, p.settings]);
const live = alt._laserSettings((layouts.find(l => l.name === 'F02_Schw_V5') || {}).ditherSettings);
const varianten = {
  'live+lokKontrast': { localContrast: 0.6 }, 'live+hautGlobal': { hautKurve: 0.8, hautKurveLokal: false },
  'live+hautLokal1': { hautKurve: 1.0, hautKurveLokal: true }, 'live+region': { regionAusgleich: 0.5, regionImmer: 0 },
  'live+regionImmerTrue': { regionAusgleich: 0.5, regionImmer: true }, 'live+motiv': { autoMotiv: true, densityTarget: 0.23 },
  'live+kanten': { konturen: 0, edgeBoost: 0.45 }, 'live+alsGrafik': { alsGrafik: true }, 'live+alsLogo': { alsLogo: true },
  'live+autoGamma': { autoGamma: true }, 'live+schatten': { shadows: 0.5, highlights: 0.4 }, 'live+invertAus': { invert: false },
  'live+bayer': { algorithm: 'bayer' }, 'live+atkinson': { algorithm: 'atkinson' }, 'live+aus': { active: false },
};
for (const [k, v] of Object.entries(varianten)) liste.push([k, { ...live, ...v }]);
const files = fs.readdirSync(pixDir).filter(f => f.endsWith('.rgba'));
let n = 0, diff = 0; const tA = { a: 0, n: 0 };
for (const f of files) {
  const [, w, h] = /_(\d+)x(\d+)\./.exec(f).map(Number);
  const raw = fs.readFileSync(path.join(pixDir, f));
  for (const [name, s] of liste) {
    for (const rects of [[{ x: 0, y: 0, w, h }], null, [{ x: 10.3, y: 20.7, w: w / 2 - 12, h: h - 30 }, { x: w / 2 + 3, y: 5, w: w / 2 - 8, h: h - 10 }]]) {
      const a = new Uint8ClampedArray(raw), b = new Uint8ClampedArray(raw);
      let t0 = Date.now(); const ia = alt.applyLaserPipeline(a, w, h, s, rects); tA.a += Date.now() - t0;
      t0 = Date.now(); const ib = neu.applyLaserPipeline(b, w, h, s, rects); tA.n += Date.now() - t0;
      n++;
      const same = Buffer.compare(Buffer.from(a.buffer), Buffer.from(b.buffer)) === 0 && JSON.stringify(ia) === JSON.stringify(ib);
      if (!same) { diff++; if (diff < 6) console.log('ABWEICHUNG', f, name, rects ? rects.length : 'null', JSON.stringify(ia).slice(0,120), JSON.stringify(ib).slice(0,120)); }
    }
  }
}
console.log(`${n} Läufe (${liste.length} Einstellungen × ${files.length} Bilder × 3 Flächen), Abweichungen: ${diff}; Zeit alt ${tA.a} ms, neu ${tA.n} ms`);
