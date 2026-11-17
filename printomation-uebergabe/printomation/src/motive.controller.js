// ── Motive: Vektorgrafiken für die Gravur ────────────────────────────────────
// Ein Ornament ist weder Text noch Foto: es muss als VEKTOR in die DXF, sonst graviert der Laser
// es als Bitmap und die feinen Schnörkel fransen aus.
// Dieses Modul nimmt die Formate aus Illustrator/CorelDRAW an und legt EINE normalisierte Form ab:
// Polylinien in Millimetern, Ursprung oben links, y nach unten (wie das Blatt im Editor). Daraus
// bedienen sich Vorschau und DXF-Export gleichermaßen.
// Eigene Parser statt Ghostscript/Inkscape: gs steigt an der CorelDRAW-AI (Illustrator-8-PostScript)
// aus, Inkscape ist nicht installiert — die Pfad-Operatoren sind simpel genug zum direkten Lesen.
// [EN] ── Motives: Vector graphics for engraving ──────────────────────────────
// An ornament is neither text nor photo: it must enter the DXF as a VECTOR, otherwise the laser
// engraves it as a bitmap and fine flourishes fray.
// This module ingests formats from Illustrator/CorelDRAW and outputs ONE normalized form:
// polylines in millimeters, origin top-left, y pointing down (like the sheet in the Editor).
// Both preview and DXF export utilize this identical representation.
// Custom parsers instead of Ghostscript/Inkscape: gs fails on CorelDRAW AI (Illustrator 8 PostScript),
// and Inkscape is not installed — path operators are simple enough for direct parsing.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const PT_MM = 25.4 / 72;

// ── Bézier flach rechnen ─────────────────────────────────────────────────────
// [EN] ── Flatten Bézier curves ───────────────────────────────────────────────
function bezier(p0, p1, p2, p3, n = 10) {
  const out = [];
  for (let i = 1; i <= n; i++) {
    const t = i / n, mt = 1 - t;
    out.push([
      mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
      mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
    ]);
  }
  return out;
}

// ── Douglas-Peucker ──────────────────────────────────────────────────────────
// Ohne das kommen aus einer getracten Vorlage schnell 27.000 Punkte, die als DXF
// zwölfmal auf dem Blech 16 MB ergeben — mehr als Ezcad2 verdauen mag.
// [EN] ── Douglas-Peucker simplification ───────────────────────────────────────
// Without this, a traced template quickly generates 27,000 points, yielding 16 MB
// repeated 12 times on a metal sheet in DXF — more than Ezcad2 can handle.
function vereinfachen(pts, eps) {
  if (pts.length < 3) return pts;
  const halten = new Array(pts.length).fill(false);
  halten[0] = halten[pts.length - 1] = true;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    if (b <= a + 1) continue;
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
    let best = 0, bi = -1;
    for (let k = a + 1; k < b; k++) {
      const [px, py] = pts[k];
      const d = len ? Math.abs(dy * px - dx * py + bx * ay - by * ax) / len : Math.hypot(px - ax, py - ay);
      if (d > best) { best = d; bi = k; }
    }
    if (best > eps) { halten[bi] = true; stack.push([a, bi], [bi, b]); }
  }
  return pts.filter((_, i) => halten[i]);
}

// ── PostScript / Illustrator 8 (.ai .eps .ps) ────────────────────────────────
// Operatoren nach Illustrator-EPS-Spezifikation, alle Koordinaten ABSOLUT; die
// Groß-/Kleinschreibung unterscheidet nur Eck- von Glättungspunkt, nicht relativ.
// [EN] ── PostScript / Illustrator 8 (.ai .eps .ps) ───────────────────────────
// Operators per Illustrator EPS specification, all coordinates ABSOLUTE; case
// distinguishes only corner from smooth point, not relative coordinates.
function ausPostScript(text) {
  const nach = text.split('%%EndSetup');
  const koerper = nach.length > 1 ? nach.slice(1).join('%%EndSetup') : text;
  const tok = koerper.match(/-?\d*\.?\d+|[a-zA-Z*]+/g) || [];
  const pfade = []; let cur = [], pt = [0, 0], z = [];
  const schluss = (zu) => { if (cur.length > 1) pfade.push({ pts: cur, zu }); cur = []; };
  for (const t of tok) {
    if (/^-?\d*\.?\d+$/.test(t)) { z.push(parseFloat(t)); continue; }
    switch (t) {
      case 'm': if (z.length >= 2) { schluss(false); pt = z.slice(-2); cur = [pt]; } break;
      case 'l': case 'L': if (z.length >= 2) { pt = z.slice(-2); cur.push(pt); } break;
      case 'c': case 'C': if (z.length >= 6) {
        const a = z.slice(-6);
        cur.push(...bezier(pt, [a[0], a[1]], [a[2], a[3]], [a[4], a[5]])); pt = [a[4], a[5]];
      } break;
      case 'v': case 'V': if (z.length >= 4) {
        const a = z.slice(-4);
        cur.push(...bezier(pt, pt, [a[0], a[1]], [a[2], a[3]])); pt = [a[2], a[3]];
      } break;
      case 'y': case 'Y': if (z.length >= 4) {
        const a = z.slice(-4);
        cur.push(...bezier(pt, [a[0], a[1]], [a[2], a[3]], [a[2], a[3]])); pt = [a[2], a[3]];
      } break;
      // Nur S ist eine offene Linie. Kleinbuchstaben schließen den Pfad (closepath), F und B
      // füllen — eine Fläche ist immer geschlossen. n/N malen nichts (Schnittmasken, Zeichenfläche):
      // die gehören nicht in die Gravur.
      // [EN] Only S is an open stroke. Lowercase closes path (closepath), F and B fill —
      // a fill area is always closed. n/N paint nothing (clipping masks, artboard bounds):
      // these must not be included in engraving.
      case 'S': schluss(false); break;
      case 's': case 'f': case 'F': case 'b': case 'B': schluss(true); break;
      case 'n': case 'N': cur = []; break;
    }
    z = [];
  }
  schluss(false);
  return { pfade, einheit: PT_MM, yRunter: false }; // PostScript: y zeigt nach OBEN / [EN] PostScript: y points UP
}

// ── SVG ──────────────────────────────────────────────────────────────────────
// Unterstützt path/polyline/polygon/rect/line/circle/ellipse und eine translate/scale/matrix/
// rotate-Kette am Element. Verschachtelte <g>-Transformationen werden mitgerechnet.
// [EN] ── SVG ─────────────────────────────────────────────────────────────────
// Supports path/polyline/polygon/rect/line/circle/ellipse and translate/scale/matrix/rotate
// chains on elements. Nested <g> transformations are accumulated.
function ausSVG(roh) {
  const pfade = [];
  // Was nicht gezeichnet wird, darf nicht in die Gravur: Kommentare, <defs> (Vorlagen für
  // <use>), Clip-Pfade und Masken — Illustrator legt dort z. B. das Zeichenflächen-Rechteck ab.
  // [EN] What isn't rendered must not be engraved: comments, <defs> (templates for
  // <use>), clip paths, and masks — Illustrator places e.g. artboard bounds here.
  const text = roh.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(defs|clipPath|mask|symbol|metadata|style|pattern|marker)\b[^>]*\/>/gi, '')
    .replace(/<(defs|clipPath|mask|symbol|metadata|style|pattern|marker)\b[\s\S]*?<\/\1\s*>/gi, '');
  // Maße NUR aus dem <svg>-Kopf: im ganzen Text träfe /width=/ sonst auch stroke-width eines Pfads.
  // [EN] Dimensions extracted ONLY from <svg> header: otherwise /width=/ across entire text matches stroke-width of paths.
  const kopf = (/<svg\b[^>]*>/i.exec(text) || [''])[0];
  const einheitAusViewBox = () => {
    const m = /viewBox\s*=\s*"([^"]+)"/.exec(kopf);
    const w = /(?:^|\s)width\s*=\s*"([\d.]+)([a-z]*)"/i.exec(kopf);
    if (m && w) {
      const vb = m[1].trim().split(/[\s,]+/).map(Number);
      // Ohne Einheit bzw. px = CSS-Pixel (1/96 Zoll). Bis 26.09.2026 stand hier eine Formel,
      // die px wie pt (1/72 Zoll) rechnete — die angezeigte Größe war um ein Drittel zu groß.
      // [EN] No unit or px = CSS pixel (1/96 inch). Prior to 26.09.2026, formula treated px
      // like pt (1/72 inch) — displayed dimensions were one-third too large.
      const mmJe = { mm: 1, cm: 10, in: 25.4, pt: PT_MM }[w[2].toLowerCase()] || 25.4 / 96;
      if (vb[2]) return parseFloat(w[1]) * mmJe / vb[2];
    }
    return PT_MM; // Rückfall: Nutzereinheit = Punkt / [EN] Fallback: user unit = point
  };
  const anwenden = (mat, x, y) => [mat[0] * x + mat[2] * y + mat[4], mat[1] * x + mat[3] * y + mat[5]];
  const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3],
  a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
  const transform = (s) => {
    let m = [1, 0, 0, 1, 0, 0];
    for (const t of (s || '').matchAll(/(\w+)\s*\(([^)]*)\)/g)) {
      const v = t[2].trim().split(/[\s,]+/).map(Number);
      if (t[1] === 'translate') m = mul(m, [1, 0, 0, 1, v[0] || 0, v[1] || 0]);
      else if (t[1] === 'scale') m = mul(m, [v[0] || 1, 0, 0, v.length > 1 ? v[1] : v[0], 0, 0]);
      else if (t[1] === 'matrix' && v.length >= 6) m = mul(m, v);
      else if (t[1] === 'rotate') {
        const r = (v[0] || 0) * Math.PI / 180, cx = v[1] || 0, cy = v[2] || 0;   // rotate(a, cx, cy)
        m = mul(m, [1, 0, 0, 1, cx, cy]);
        m = mul(m, [Math.cos(r), Math.sin(r), -Math.sin(r), Math.cos(r), 0, 0]);
        m = mul(m, [1, 0, 0, 1, -cx, -cy]);
      }
    }
    return m;
  };
  // <g>-Verschachtelung grob nachfahren: Stack über die Reihenfolge im Text
  // [EN] Track <g> nesting: stack reflecting order in text
  const stueck = text.split(/(<g\b[^>]*>|<\/g>)/);
  let stack = [[1, 0, 0, 1, 0, 0]];
  for (const s of stueck) {
    if (/^<g\b/.test(s)) { stack.push(mul(stack[stack.length - 1], transform((/transform\s*=\s*"([^"]*)"/.exec(s) || [])[1]))); continue; }
    if (/^<\/g>/.test(s)) { if (stack.length > 1) stack.pop(); continue; }
    const basis = stack[stack.length - 1];
    for (const el of s.matchAll(/<(path|polyline|polygon|rect|line|circle|ellipse)\b([^>]*)>/g)) {
      const attr = el[2];
      const mat = mul(basis, transform((/transform\s*=\s*"([^"]*)"/.exec(attr) || [])[1]));
      // Wortgrenze davor: sonst träfe 'x' das rx="…" eines abgerundeten Rechtecks
      // [EN] Word boundary before: otherwise 'x' matches rx="..." of rounded rectangle
      const zahl = (n) => parseFloat((new RegExp('(?:^|\\s)' + n + '\\s*=\\s*"([^"]*)"').exec(attr) || [])[1] || 0);
      if (el[1] === 'circle' || el[1] === 'ellipse') {
        const cx = zahl('cx'), cy = zahl('cy');
        const rx = el[1] === 'circle' ? zahl('r') : zahl('rx'), ry = el[1] === 'circle' ? rx : zahl('ry');
        if (rx > 0 && ry > 0) {
          const pts = [];
          for (let k = 0; k < 72; k++) { const a = k * Math.PI / 36; pts.push(anwenden(mat, cx + rx * Math.cos(a), cy + ry * Math.sin(a))); }
          pfade.push({ pts, zu: true });
        }
        continue;
      }
      if (el[1] === 'path') {
        const d = (/\bd\s*=\s*"([^"]*)"/.exec(attr) || [])[1];
        if (d) pfade.push(...svgPfad(d, mat, anwenden));
      } else if (el[1] === 'rect') {
        const x = zahl('x'), y = zahl('y'), w = zahl('width'), h = zahl('height');
        pfade.push({ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]].map(p => anwenden(mat, p[0], p[1])), zu: true });
      } else if (el[1] === 'line') {
        pfade.push({ pts: [[zahl('x1'), zahl('y1')], [zahl('x2'), zahl('y2')]].map(p => anwenden(mat, p[0], p[1])), zu: false });
      } else {
        const roh = (/points\s*=\s*"([^"]*)"/.exec(attr) || [])[1] || '';
        const n = roh.trim().split(/[\s,]+/).map(Number);
        const pts = [];
        for (let i = 0; i + 1 < n.length; i += 2) pts.push(anwenden(mat, n[i], n[i + 1]));
        if (pts.length > 1) pfade.push({ pts, zu: el[1] === 'polygon' });
      }
    }
  }
  return { pfade, einheit: einheitAusViewBox(), yRunter: true };
}

// SVG-Bogen (Endpunkt-Form, SVG 1.1 Anhang F.6.5) als kubische Stücke ≤ 90°: [[c1, c2, ende], …]
function bogenKubisch(x1, y1, rx, ry, phiGrad, gross, dreh, x2, y2) {
  if (x1 === x2 && y1 === y2) return [];
  rx = Math.abs(rx); ry = Math.abs(ry);
  if (!rx || !ry) return [[[x1, y1], [x2, y2], [x2, y2]]];          // Radius 0 = Gerade
  const phi = phiGrad * Math.PI / 180, cos = Math.cos(phi), sin = Math.sin(phi);
  const dx = (x1 - x2) / 2, dy = (y1 - y2) / 2;
  const x1p = cos * dx + sin * dy, y1p = -sin * dx + cos * dy;
  const lam = x1p * x1p / (rx * rx) + y1p * y1p / (ry * ry);
  if (lam > 1) { rx *= Math.sqrt(lam); ry *= Math.sqrt(lam); }      // Radius zu klein → hochskalieren
  const zaehler = rx * rx * ry * ry - rx * rx * y1p * y1p - ry * ry * x1p * x1p;
  let f = Math.sqrt(Math.max(0, zaehler / (rx * rx * y1p * y1p + ry * ry * x1p * x1p)));
  if (gross === dreh) f = -f;
  const cxp = f * rx * y1p / ry, cyp = -f * ry * x1p / rx;
  const cx = cos * cxp - sin * cyp + (x1 + x2) / 2, cy = sin * cxp + cos * cyp + (y1 + y2) / 2;
  const winkel = (ux, uy, vx, vy) => Math.atan2(ux * vy - uy * vx, ux * vx + uy * vy);
  const ux = (x1p - cxp) / rx, uy = (y1p - cyp) / ry;
  const t1 = winkel(1, 0, ux, uy);
  let dt = winkel(ux, uy, (-x1p - cxp) / rx, (-y1p - cyp) / ry);
  if (!dreh && dt > 0) dt -= 2 * Math.PI; else if (dreh && dt < 0) dt += 2 * Math.PI;
  const n = Math.max(1, Math.ceil(Math.abs(dt) / (Math.PI / 2) - 1e-9));
  const h = dt / n, k = 4 / 3 * Math.tan(h / 4);
  const punkt = t => [cx + rx * Math.cos(t) * cos - ry * Math.sin(t) * sin, cy + rx * Math.cos(t) * sin + ry * Math.sin(t) * cos];
  const tangente = t => [-rx * Math.sin(t) * cos - ry * Math.cos(t) * sin, -rx * Math.sin(t) * sin + ry * Math.cos(t) * cos];
  const aus = [];
  for (let j = 0; j < n; j++) {
    const ta = t1 + j * h, tb = ta + h, pa = punkt(ta), pb = punkt(tb), da = tangente(ta), db = tangente(tb);
    aus.push([[pa[0] + k * da[0], pa[1] + k * da[1]], [pb[0] - k * db[0], pb[1] - k * db[1]], pb]);
  }
  aus[aus.length - 1][2] = [x2, y2];
  return aus;
}

function svgPfad(d, mat, anwenden) {
  const pfade = [];
  const tok = d.match(/[MmLlHhVvCcSsQqTtAaZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) || [];
  // vor = vorheriger Befehl, kx/ky = sein letzter Kontrollpunkt: S und T spiegeln ihn NUR nach
  // C/S bzw. Q/T — nach allem anderen ist der erste Kontrollpunkt der aktuelle Punkt.
  let i = 0, cur = [], x = 0, y = 0, sx = 0, sy = 0, cmd = '', vor = '', kx = 0, ky = 0;
  const zahl = () => parseFloat(tok[i++]);
  // Bogen-Schalter dürfen ohne Trenner stehen („a1 1 0 001 1"): je Schalter EINE Ziffer nehmen.
  const schalter = () => {
    const t = tok[i] || '0';
    if (t.length > 1 && /^[01]/.test(t)) { tok[i] = t.slice(1); return t[0] === '1'; }
    i++; return t === '1';
  };
  const setzen = () => cur.push(anwenden(mat, x, y));
  // Nach Z beginnt der nächste Teilpfad am Startpunkt — ohne M fehlte er sonst in der Linie.
  const anfang = () => { if (!cur.length) setzen(); };
  const kurve = (c1, c2, e) => {
    anfang();
    for (const p of bezier([x, y], c1, c2, e)) cur.push(anwenden(mat, p[0], p[1]));
    x = e[0]; y = e[1];
  };
  const schluss = (zu) => {
    const pts = cur.filter(p => Number.isFinite(p[0]) && Number.isFinite(p[1]));   // abgeschnittene Zahlenreihe
    if (pts.length > 1) pfade.push({ pts, zu });
    cur = [];
  };
  while (i < tok.length) {
    if (/[A-Za-z]/.test(tok[i])) cmd = tok[i++];
    else if (!cmd || cmd === 'Z' || cmd === 'z') { i++; continue; }   // Zahl ohne Befehl: weiter (sonst Endlosschleife)
    const rel = cmd === cmd.toLowerCase(), C = cmd.toUpperCase();
    const pt = () => { const a = zahl(), b = zahl(); return rel ? [x + a, y + b] : [a, b]; };
    switch (C) {
      case 'M': { schluss(false);[x, y] = pt(); sx = x; sy = y; setzen(); cmd = rel ? 'l' : 'L'; break; }
      case 'L': { anfang();[x, y] = pt(); setzen(); break; }
      case 'H': { anfang(); const a = zahl(); x = rel ? x + a : a; setzen(); break; }
      case 'V': { anfang(); const a = zahl(); y = rel ? y + a : a; setzen(); break; }
      case 'C': { const c1 = pt(), c2 = pt(), e = pt(); kurve(c1, c2, e);[kx, ky] = c2; break; }
      case 'S': {
        const c1 = (vor === 'C' || vor === 'S') ? [2 * x - kx, 2 * y - ky] : [x, y];
        const c2 = pt(), e = pt(); kurve(c1, c2, e);[kx, ky] = c2; break;
      }
      case 'Q': case 'T': {
        const q = C === 'Q' ? pt() : ((vor === 'Q' || vor === 'T') ? [2 * x - kx, 2 * y - ky] : [x, y]);
        const e = pt();
        // quadratisch → kubisch: beide Kontrollpunkte bei 2/3 des Wegs zum Kontrollpunkt q
        kurve([x + 2 / 3 * (q[0] - x), y + 2 / 3 * (q[1] - y)], [e[0] + 2 / 3 * (q[0] - e[0]), e[1] + 2 / 3 * (q[1] - e[1])], e);
        [kx, ky] = q; break;
      }
      case 'A': {
        const rx = zahl(), ry = zahl(), phi = zahl(), gross = schalter(), dreh = schalter(), e = pt();
        anfang();
        for (const [c1, c2, en] of bogenKubisch(x, y, rx, ry, phi, gross, dreh, e[0], e[1])) kurve(c1, c2, en);
        x = e[0]; y = e[1]; break;
      }
      case 'Z': { x = sx; y = sy; schluss(true); break; }
      default: i++;
    }
    vor = C;
  }
  schluss(false);
  return pfade;
}

// ── DXF (R12-Untermenge) ─────────────────────────────────────────────────────
// Jedes Entity sammelt seine eigenen Codes; ausgewertet wird beim nächsten „0". Sonst bildeten
// Startpunkte von LINE/TEXT/INSERT, R12-Blindpunkte und Kopfvariablen Linien, die es nicht gibt.
// [EN] ── DXF (R12 subset) ────────────────────────────────────────────────────
// Each entity accumulates its own group codes; evaluated at the next "0". Otherwise
// start points of LINE/TEXT/INSERT, R12 dummy points, and header variables form non-existent lines.
function ausDXF(text) {
  const z = text.split(/\r?\n/);
  const pfade = [];
  const bogen = (cx, cy, r, a1, a2) => {
    const pts = []; let d = a2 - a1; while (d < 0) d += 360;
    const n = Math.max(8, Math.ceil(d / 5));
    for (let k = 0; k <= n; k++) {
      const a = (a1 + d * k / n) * Math.PI / 180;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
    return pts;
  };
  let e = null, poly = null;   // e = laufendes Entity, poly = offene POLYLINE (sammelt ihre VERTEX)
  const abschluss = () => {
    if (!e) return;
    const t = e.typ;
    if (t === 'LINE' && e.y2 != null) pfade.push({ pts: [[e.x, e.y], [e.x2, e.y2]], zu: false });
    else if ((t === 'CIRCLE' || t === 'ARC') && e.y != null)
      pfade.push({ pts: bogen(e.x, e.y, e.r, t === 'ARC' ? e.w1 : 0, t === 'ARC' ? e.w2 : 360), zu: t === 'CIRCLE' });
    else if (t === 'LWPOLYLINE' && e.pts.length > 1) pfade.push({ pts: e.pts, zu: e.zu });
    else if (t === 'VERTEX' && poly && e.y != null) poly.pts.push([e.x, e.y]);
  };
  for (let i = 0; i + 1 < z.length; i += 2) {
    const c = z[i].trim(), v = z[i + 1].trim();
    if (c === '0') {
      abschluss();
      if (v === 'SEQEND' && poly) { if (poly.pts.length > 1) pfade.push({ pts: poly.pts, zu: poly.zu }); poly = null; }
      e = { typ: v, pts: [], zu: false, x: 0, y: null, x2: 0, y2: null, r: 0, w1: 0, w2: 0 };
      if (v === 'POLYLINE') poly = e;
      continue;
    }
    if (!e) continue;
    const n = parseFloat(v);
    if (c === '10') e.x = n;
    else if (c === '20') { e.y = n; if (e.typ === 'LWPOLYLINE') e.pts.push([e.x, n]); }
    else if (c === '11') e.x2 = n;
    else if (c === '21') e.y2 = n;
    else if (c === '40') e.r = n;
    else if (c === '50') e.w1 = n;
    else if (c === '51') e.w2 = n;
    else if (c === '70') e.zu = (parseInt(v) & 1) === 1;
  }
  abschluss();
  return { pfade, einheit: 1.0, yRunter: false }; // DXF: Millimeter, y nach oben / [EN] DXF: millimeters, y pointing up
}

// ── PDF / Illustrator ab 9 ───────────────────────────────────────────────────
// [EN] ── PDF / Illustrator 9+ ────────────────────────────────────────────────
function ausPDF(buf) {
  const pfade = [];
  // Alle FlateDecode-Ströme auspacken und die Pfad-Operatoren einsammeln.
  // [EN] Unpack all FlateDecode streams and collect path operators.
  const roh = buf.toString('latin1');
  const ströme = [];
  const re = /stream\r?\n?([\s\S]*?)endstream/g;
  let m;
  while ((m = re.exec(roh))) {
    const b = Buffer.from(m[1], 'latin1');
    try { ströme.push(zlib.inflateSync(b).toString('latin1')); }
    catch { ströme.push(m[1]); }        // unkomprimiert / [EN] uncompressed
  }
  for (const s of ströme) {
    const tok = s.match(/-?\d*\.?\d+|[A-Za-z*'"]+/g) || [];
    let cur = [], pt = [0, 0], z = [], sx = 0, sy = 0;
    const schluss = (zu) => { if (cur.length > 1) pfade.push({ pts: cur, zu }); cur = []; };
    for (const t of tok) {
      if (/^-?\d*\.?\d+$/.test(t)) { z.push(parseFloat(t)); continue; }
      if (t === 'm' && z.length >= 2) { schluss(false); pt = z.slice(-2); sx = pt[0]; sy = pt[1]; cur = [pt]; }
      else if (t === 'l' && z.length >= 2) { pt = z.slice(-2); cur.push(pt); }
      else if (t === 'c' && z.length >= 6) {
        const a = z.slice(-6);
        cur.push(...bezier(pt, [a[0], a[1]], [a[2], a[3]], [a[4], a[5]])); pt = [a[4], a[5]];
      }
      else if (t === 'v' && z.length >= 4) { const a = z.slice(-4); cur.push(...bezier(pt, pt, [a[0], a[1]], [a[2], a[3]])); pt = [a[2], a[3]]; }
      else if (t === 'y' && z.length >= 4) { const a = z.slice(-4); cur.push(...bezier(pt, [a[0], a[1]], [a[2], a[3]], [a[2], a[3]])); pt = [a[2], a[3]]; }
      else if (t === 're' && z.length >= 4) {
        const [x, y, w, h] = z.slice(-4);
        schluss(false); pfade.push({ pts: [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], zu: true }); cur = [];
      }
      else if (t === 'h') { if (cur.length > 1) { cur.push([sx, sy]); } }
      // wie bei PostScript: S offen, Füllungen und s geschlossen, n (Schnittmaske) verwerfen
      // [EN] Like PostScript: S open, fills and s closed, discard n (clipping mask)
      else if (t === 'n') cur = [];
      else if (['S', 's', 'f', 'F', 'f*', 'B', 'B*', 'b', 'b*'].includes(t)) schluss(t !== 'S');
      z = [];
    }
    schluss(false);
  }
  return { pfade, einheit: PT_MM, yRunter: false };
}

// ── Spalt-Ausrichtung (geteilte Monogramme, F02 V3) ──────────────────────────
// Ein Split-Monogramm hat zwei waagerechte Balken, dazwischen einen leeren Spalt für den Namen.
// Ins Feld eingepasst wird sonst der UMRISS — dann landet der Spalt bei jedem Buchstaben woanders
// (J, Q mit Unterlänge, W breiter als die Balken). Mit `anker` passt der Editor stattdessen die
// BALKEN in die Feldbreite und legt die Spaltmitte auf die Feldmitte.
// Schnittpunkte der Pfade mit einer waagerechten (achse 1: y = wert → x-Werte) bzw. einer
// senkrechten Linie (achse 0: x = wert → y-Werte).
// [EN] ── Gap Alignment (Split monograms, F02 V3) ──────────────────────────────
// A split monogram features two horizontal bars with an empty gap between them for a name.
// Fitting the outer OUTLINE into field causes the gap to shift per letter (descenders in J/Q,
// W wider than bars). With `anker`, Editor instead fits BARS into field width and centers gap.
// Intersections of paths with horizontal (axis 1: y = value -> x values) or vertical line (axis 0: x = value -> y values).
const schnitte = (pfade, achse, wert) => {
  const q = 1 - achse, out = [];
  for (const p of pfade) {
    const pts = p.pts, n = pts.length;
    for (let k = 0; k < n - 1; k++) {
      const a = pts[k], b = pts[k + 1];
      if ((a[achse] <= wert) !== (b[achse] <= wert)) out.push(a[q] + (wert - a[achse]) / (b[achse] - a[achse]) * (b[q] - a[q]));
    }
  }
  return out;
};
const schnitteX = (pfade, y) => schnitte(pfade, 1, y);   // x-Schnittpunkte einer waagerechten Linie / [EN] x-intersections of horizontal line
const schnitteY = (pfade, x) => schnitte(pfade, 0, x);   // y-Schnittpunkte einer senkrechten Linie / [EN] y-intersections of vertical line
// Pfade schließen, damit die Schnitt-Zählung auch die letzte Kante sieht
// [EN] Close paths so intersection counting checks the final closing edge
const geschlossen = (pfade) => pfade.map(p => {
  const a = p.pts[0], b = p.pts[p.pts.length - 1];
  return (a[0] === b[0] && a[1] === b[1]) ? p : { ...p, pts: [...p.pts, a] };
});
// Höchstes leeres Band zwischen 20 und 80 % der Höhe → { y0, y1 } oder null
// [EN] Tallest empty band between 20% and 80% of height -> { y0, y1 } or null
function leeresBand(pfade, hoehe) {
  const N = 2000, st = hoehe / N, von = Math.floor(N * 0.2), bis = Math.ceil(N * 0.8);
  let best = null, start = -1;
  for (let i = von; i <= bis; i++) {
    const leer = i < bis && schnitteX(pfade, (i + 0.5) * st).length === 0;
    if (leer && start < 0) start = i;
    if (!leer && start >= 0) { if (!best || i - start > best[1] - best[0]) best = [start, i]; start = -1; }
  }
  if (!best || (best[1] - best[0]) * st < hoehe * 0.05) return null;
  return { y0: best[0] * st, y1: best[1] * st };
}
// Neigung der Balken (Radiant, y nach unten): Unterkante des oberen und Oberkante des
// unteren Balkens an 15 Stellen abtasten. Der R aus der Vorlage lag um 0,46° schief.
// [EN] Bar tilt (radians, y down): sample bottom edge of upper bar and top edge of lower bar
// at 15 points. Letter R in the template was skewed by 0.46 deg.
function balkenNeigung(pfade, breite, band) {
  const mitte = (band.y0 + band.y1) / 2, steig = [];
  for (const kante of ['oben', 'unten']) {
    const xs = [], ys = [];
    for (let i = 0; i < 15; i++) {
      const x = breite * (0.15 + 0.7 * i / 14);
      const s = schnitteY(pfade, x);
      const y = kante === 'oben' ? Math.max(...s.filter(v => v < mitte)) : Math.min(...s.filter(v => v > mitte));
      if (isFinite(y)) { xs.push(x); ys.push(y); }
    }
    if (xs.length < 5) continue;
    const mx = xs.reduce((a, b) => a + b) / xs.length, my = ys.reduce((a, b) => a + b) / ys.length;
    let z = 0, n = 0;
    for (let i = 0; i < xs.length; i++) { z += (xs[i] - mx) * (ys[i] - my); n += (xs[i] - mx) ** 2; }
    if (n) steig.push(z / n);
  }
  return steig.length ? Math.atan(steig.reduce((a, b) => a + b) / steig.length) : 0;
}
// Spalt + Balkenenden → { x0, x1, y0, y1 } in mm (Motiv-Koordinaten) oder null
// [EN] Gap + bar ends -> { x0, x1, y0, y1 } in mm (motive coordinates) or null
function spaltAnker(pfade, breite, hoehe) {
  const band = leeresBand(pfade, hoehe);
  if (!band) return null;
  // Balkenenden: Zeilen knapp über und unter dem Spalt (innerhalb der Balkendicke)
  // [EN] Bar ends: scan lines slightly above and below gap (within bar thickness)
  let x0 = Infinity, x1 = -Infinity;
  const d = hoehe / 52.6;              // Maßstab: Normalbuchstabe ist 52,6 hoch, Balken ~1 dick / [EN] Scale: standard letter is 52.6 high, bar ~1 thick
  for (const y of [band.y0 - 0.2 * d, band.y0 - 0.5 * d, band.y1 + 0.2 * d, band.y1 + 0.5 * d]) {
    const s = schnitteX(pfade, y);
    if (s.length < 2) continue;
    x0 = Math.min(x0, ...s); x1 = Math.max(x1, ...s);
  }
  if (!(x1 - x0 > breite * 0.5)) return null;
  const r = v => +v.toFixed(4);
  return { x0: r(x0), x1: r(x1), y0: r(band.y0), y1: r(band.y1) };
}

// ── Einlesen + normalisieren ────────────────────────────────────────────────
// Ergebnis: { pfade: [{pts:[[xmm,ymm],…], zu}], breite, hoehe } — Ursprung oben links,
// y nach unten, Maße in mm. Genau die Form, in der der Editor auch Felder rechnet.
// toleranzMM: erlaubte Abweichung, gemessen an 30 mm Gravurbreite. Kleiner = mehr Punkte
// und feinere Kurven, größer = kleinere Datei. Standard 0,02 mm.
// ausrichtung: 'spalt' = Split-Monogramm (Balken gerade richten, `anker` setzen, s. oben);
// sonst wird der Umriss eingepasst wie bisher.
// [EN] ── Ingest + Normalize ──────────────────────────────────────────────────
// Result: { pfade: [{pts:[[xmm,ymm],...], zu}], breite, hoehe } — origin top-left,
// y pointing down, dimensions in mm. Exactly the form used by Editor for field geometry.
// toleranzMM: allowable deviation scaled to 30 mm engraving width. Smaller = more points
// and smoother curves; larger = smaller file size. Default 0.02 mm.
// ausrichtung: 'spalt' = split monogram (straightens tilted bars, computes `anker`, see above);
// otherwise outer bounding box is fitted as usual.
function einlesen(datei, toleranzMM, ausrichtung) {
  const ext = path.extname(datei).toLowerCase();
  const buf = fs.readFileSync(datei);
  let roh;
  if (ext === '.dxf') roh = ausDXF(buf.toString('utf8'));
  else if (ext === '.svg') roh = ausSVG(buf.toString('utf8'));
  else if (ext === '.pdf') roh = ausPDF(buf);
  else {
    const txt = buf.toString('latin1');
    // AI ab Version 9 ist PDF, davor PostScript — am Dateikopf unterscheidbar
    // [EN] AI v9+ is PDF, earlier is PostScript — distinguishable by file header
    roh = txt.startsWith('%PDF') ? ausPDF(buf) : ausPostScript(txt);
  }
  if (!roh.pfade.length) throw new Error('Keine Pfade gefunden — Schrift vorher in Konturen umwandeln?');

  const e = roh.einheit;
  // Schleife statt Math.min(...liste): der Spread wirft ab ~120.000 Punkten (Stack).
  // [EN] Loop instead of Math.min(...list): spread throws at ~120,000 points (call stack limit).
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity;
  for (const p of roh.pfade) for (const [x, y] of p.pts) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const breite = (x1 - x0) * e, hoehe = (y1 - y0) * e;
  // Toleranz: 0,02 mm, gemessen an einer typischen Gravurbreite von 30 mm — unter der
  // Laserauflösung, spart aber über 90 % der Punkte (F02-Ornament: 27.159 → 1.720).
  // Die Vorlage ist meist viel größer als die Gravur, der Fehler schrumpft beim
  // Verkleinern also mit. Deshalb MAL dem Verhältnis, nicht geteilt: bei einer 114-mm-
  // Vorlage darf in der Datei 0,076 mm abweichen, damit bei 30 mm 0,02 mm ankommen.
  // [EN] Tolerance: 0.02 mm measured at typical 30 mm engraving width — below laser resolution
  // but reduces points by >90% (F02 ornament: 27,159 -> 1,720).
  // Template is usually much larger than engraving, so error shrinks during scaling.
  // Hence multiplied by ratio: for 114 mm template, file can deviate 0.076 mm to yield 0.02 mm at 30 mm.
  const tol = (typeof toleranzMM === 'number' && toleranzMM > 0) ? toleranzMM : 0.02;
  const eps = tol * (breite / 30) / e;
  let pfade = roh.pfade.map(p => {
    const pts = vereinfachen(p.pts, eps).map(([x, y]) => [
      +((x - x0) * e).toFixed(4),
      +((roh.yRunter ? (y - y0) : (y1 - y)) * e).toFixed(4),
    ]);
    return { pts, zu: !!p.zu };
  }).filter(p => p.pts.length > 1);
  const rohPunkte = roh.pfade.reduce((s, p) => s + p.pts.length, 0);
  let B = +breite.toFixed(3), H = +hoehe.toFixed(3), anker;
  if (ausrichtung === 'spalt') {
    const band = leeresBand(geschlossen(pfade), H);
    if (!band) throw new Error('Kein waagerechter Spalt gefunden — ist das ein geteiltes Monogramm?');
    // Schiefe Balken gerade drehen (nur kleine Winkel — alles darüber ist kein Scan-Fehler)
    // [EN] Rotate skewed bars straight (small angles only — larger is not a scanning error)
    const w = balkenNeigung(geschlossen(pfade), B, band);
    const gedreht = (Math.abs(w) > 0.00175 && Math.abs(w) < 0.05) ? w : 0;   // 0,1° … 2,9°
    if (gedreht) {
      const c = Math.cos(-w), s = Math.sin(-w), mx = B / 2, my = (band.y0 + band.y1) / 2;
      pfade = pfade.map(p => ({
        ...p, pts: p.pts.map(([x, y]) =>
          [mx + (x - mx) * c - (y - my) * s, my + (x - mx) * s + (y - my) * c])
      }));
      let a = Infinity, b = -Infinity, o = Infinity, u = -Infinity;
      for (const p of pfade) for (const [x, y] of p.pts) { a = Math.min(a, x); b = Math.max(b, x); o = Math.min(o, y); u = Math.max(u, y); }
      pfade = pfade.map(p => ({ ...p, pts: p.pts.map(([x, y]) => [+(x - a).toFixed(4), +(y - o).toFixed(4)]) }));
      B = +(b - a).toFixed(3); H = +(u - o).toFixed(3);
    }
    anker = spaltAnker(geschlossen(pfade), B, H);
    if (!anker) throw new Error('Spalt gefunden, aber keine Balken daneben');
    anker.drehung = +(gedreht * 180 / Math.PI).toFixed(3);   // nur zur Anzeige: gerade gerichtet um …° / [EN] display only: rotated by ... deg
  }
  return {
    pfade, breite: B, hoehe: H, toleranz: tol, rohPunkte,
    ...(anker ? { ausrichtung: 'spalt', anker } : {})
  };
}

// SVG-Vorschau für die Liste im Editor
// [EN] SVG preview for list in Editor
function vorschauSVG(m) {
  const d = m.pfade.map(p =>
    '<path d="M ' + p.pts.map(q => q[0].toFixed(2) + ' ' + q[1].toFixed(2)).join(' L ')
    + (p.zu ? ' Z' : '') + '" fill="none" stroke="currentColor" stroke-width="'
    + Math.max(m.breite, m.hoehe) / 300 + '"/>').join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${m.breite} ${m.hoehe}" `
    + `width="${m.breite}mm" height="${m.hoehe}mm">${d}</svg>`;
}

module.exports = { einlesen, vorschauSVG };
