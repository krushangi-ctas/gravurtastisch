// ═══════════════════════════════════════════════════════════════════════════
//  LASER-PIPELINE — die Bildmathematik, aus der die Gravur entsteht
// ═══════════════════════════════════════════════════════════════════════════
//  Der einzige Teil der App ohne DOM-Zugriff: Pixel-Daten rein, Pixel-Daten raus. Dadurch in Node
//  direkt prüfbar (s. Ausfuhr ganz unten), und beim Umbau der Oberfläche geht hier nichts kaputt.
//
//  ── WIE DIESE DATEI EINGEBUNDEN IST ───────────────────────────────────────
//  Per <script src="laser-pipeline.js"> in public/layout-editor.html, VOR dem Hauptskript. Nicht
//  anfassen: kein `defer`, kein `type="module"`, nicht verschieben — das Hauptskript wertet
//  `let ditherSettings = _laserSettings()` schon beim Laden aus. Beide sind KLASSISCHE Skripte und
//  teilen sich den globalen lexikalischen Bereich: `const` und `function` hier sind drüben sichtbar,
//  aber NICHT als window.x (der übliche Stolperstein beim Testen im Browser).
//
//  ── WAS HIER NICHT HINEINGEHÖRT ───────────────────────────────────────────
//  Alles, was `document`, `window`, `fields`, `getPg()` oder eine Meldung an den Benutzer braucht —
//  sonst ist der Node-Test hin. Werte aus der Oberfläche werden ÜBERGEBEN (z. B. die Blattgröße an
//  _imageFieldsBBox).
//
//  ── NACH EINER ÄNDERUNG PRÜFEN ────────────────────────────────────────────
//  1) In Node: const p = require('./public/laser-pipeline.js'); Grau 128 muss bei Floyd-Steinberg
//     ~50 % gravierte Fläche ergeben, Grau 64 ~75 %, Grau 192 ~25 % (lineare Kennlinie).
//  2) Alt gegen neu bitgenau: src/tools/pipeline-vergleich.js, für den ganzen Export
//     src/tools/trockenlauf.js.
//
//  Reihenfolge der Verarbeitungsschritte und ihre Begründung: s. applyLaserPipeline.
//
//  [EN] ═══════════════════════════════════════════════════════════════════════════
//  [EN] LASER PIPELINE — Image mathematics that produces the engraving
//  [EN] ═══════════════════════════════════════════════════════════════════════════
//  [EN] The only part of the app with NO DOM access: pixel data in, pixel data out.
//  [EN] Directly testable in Node.js (see export at bottom); UI changes cannot break this.
//  [EN] 
//  [EN] ── HOW THIS FILE IS INCLUDED ──────────────────────────────────────────────
//  [EN] Via <script src="laser-pipeline.js"> in public/layout-editor.html BEFORE main script.
//  [EN] Do not touch: no `defer`, no `type="module"`, do not reorder — main script evaluates
//  [EN] `let ditherSettings = _laserSettings()` upon loading. Both are CLASSICAL scripts and
//  [EN] share global lexical scope: `const` and `function` here are visible there, but NOT as window.x.
//  [EN] 
//  [EN] ── WHAT DOES NOT BELONG HERE ──────────────────────────────────────────────
//  [EN] Anything needing `document`, `window`, `fields`, `getPg()`, or user prompts —
//  [EN] otherwise Node test fails. UI values are PASSED AS ARGUMENTS (e.g. sheet size to _imageFieldsBBox).
//  [EN] 
//  [EN] ── VERIFY AFTER ANY CHANGE ────────────────────────────────────────────────
//  [EN] 1) In Node: const p = require('./public/laser-pipeline.js'); Gray 128 must yield ~50%
//  [EN]    engraved area in Floyd-Steinberg, Gray 64 ~75%, Gray 192 ~25% (linear response).
//  [EN] 2) Exact bit-for-bit regression test: src/tools/pipeline-vergleich.js, for full export
//  [EN]    src/tools/trockenlauf.js.
//  [EN] Processing order & rationale: see applyLaserPipeline.
// ═══════════════════════════════════════════════════════════════════════════

// Standardwerte aller Laser-Einstellungen — DIE eine Quelle; _laserSettings füllt fehlende Werte
// alter Layouts damit auf. Die Startwerte sind die einer FOTO-Gravur: Auto-Kontrast und mildes
// Nachschärfen gleichen aus, was beim Verkleinern eines Handyfotos auf Gravurmaß passiert. Neutral
// bleiben nur Gamma und die Kalibrierung — beides lässt sich ohne das Material nicht raten.
// [EN] Default values for all laser settings — SINGLE source of truth; _laserSettings fills missing values
// of older layouts with these. Default values are tailored for PHOTO engraving: auto-contrast and mild
// unsharp masking compensate for softening when scaling mobile photos to engraving size. Only gamma
// and calibration remain neutral — both cannot be guessed without specific material.
const LASER_DEFAULTS = {
  active: true,
  algorithm: 'floyd-steinberg',  // linear über alle 256 Stufen, robustestes Verfahren / [EN] linear across all 256 levels, most robust method
  threshold: 128,
  contrast: 0,
  gamma: 1.0,        // >1 = heller (weniger Gravur), <1 = dunkler / [EN] >1 = brighter (less engraving), <1 = darker
  sharpen: 0.5,      // 0…1 Unsharp-Mask-Stärke — gleicht die Weichheit des Verkleinerns aus / [EN] 0..1 Unsharp Mask strength — compensates for downscaling softness
  autoContrast: true,
  invert: false,
  dpi: 500,
  // Tonwert-Ausgleich gegen Punktzuwachs, 0…0.5. Standard 0 = aus, damit bestehende
  // Layouts und am Material erprobte Presets exakt so bleiben wie bisher (s. _dotGainLUT).
  // [EN] Dot gain compensation, 0..0.5. Default 0 = off, preserving existing layouts and material presets bit-for-bit (see _dotGainLUT).
  dotGain: 0,
  // Tonwert-Begrenzung in Tinte (0 = weiß, 1 = voll graviert): auf welchen Bereich der
  // Bildumfang abgebildet wird. 0…1 = aus (s. _applyInkLimits). Ebenfalls bewusst neutral
  // vorbelegt — die brauchbaren Werte hängen an Material und Maschine.
  // [EN] Tonal limit in ink (0 = white, 1 = fully engraved): range to which image gamut is mapped.
  // 0..1 = off (see _applyInkLimits). Deliberately neutral defaults — appropriate values depend on material and machine.
  inkMin: 0,
  inkMax: 1,
  // Kanten verstärken (s. _kantenVerstaerken), 0…1. Aus = alte Layouts bleiben bitgleich.
  // [EN] Boost edges (see _kantenVerstaerken), 0..1. Off = old layouts remain bit-identical.
  edgeBoost: 0,
  // Konturen vertiefen, ohne Striche (s. _konturenVertiefen), 0…3 — Nachfolger von
  // edgeBoost für Fotos: vertieft nur die DUNKLE Seite einer Kante. Ist er gesetzt, läuft
  // edgeBoost nicht. 0 = aus, bestehende Layouts bleiben bitgleich.
  // [EN] Deepen contours without strokes (see _konturenVertiefen), 0..3 — successor to edgeBoost
  // for photos: deepens only DARK side of an edge. If set, edgeBoost does not run. 0 = off.
  konturen: 0,
  konturRadius: 2,   // Umgebung in px (dreifaches Kastenmittel, r = 2 ≈ 0,12 mm bei 500 DPI) / [EN] Neighborhood in px (triple box filter, r = 2 ≈ 0.12 mm at 500 DPI)
  // Grafik-Erkennung (s. _istGrafik): Logos, Schrift und Strichzeichnungen bekommen keine
  // Foto-Aufbereitung. Standard AN — sie greift nur bei Bildern, die eindeutig keine Fotos
  // sind, an allen 25 vorhandenen Kundenuploads geprüft (s. dort).
  // [EN] Graphic recognition (see _istGrafik): logos, text, and line art skip photo processing.
  // Default ON — only triggers for images that are clearly not photos, verified on 25 customer uploads.
  grafikAuto: true,
  // Lichter wegschneiden (s. _applyInkDropout), 0…0.2. Tinte UNTER diesem Anteil wird auf
  // 0 gesetzt statt gerastert. 0 = aus, damit bestehende Layouts bitgleich bleiben.
  // [EN] Cut off highlights (see _applyInkDropout), 0..0.2. Ink BELOW this fraction is zeroed
  // instead of dithered. 0 = off, keeping existing layouts bit-identical.
  inkDropout: 0,
  // Schattenstufe (s. _dropoutLUT), 0…0.25: Dunkelgrau knapp über dem Sprenkel-Schnitt wird auf
  // mindestens diesen Anteil Tinte angehoben, statt dort nur als vereinzelte Punkte zu stehen.
  // Wirkt nur zusammen mit inkDropout. 0 = aus, bestehende Layouts bleiben bitgleich.
  // [EN] Shadow lift (see _dropoutLUT), 0..0.25: dark gray just above speckle cutoff is boosted
  // to at least this ink fraction instead of remaining isolated dots. Operates with inkDropout. 0 = off.
  schattenAuf: 0,
  // Dichte-Regelung (s. _dichteRegeln): gewünschte gravierte Fläche 0…1, gemessen am
  // FERTIGEN Raster. 0 = aus. Wirkt nach allen Tonwertstufen und ersetzt damit das
  // Auto-Gamma-Ziel als maßgebliche Größe — Auto-Gamma bleibt die Vorlage, die Regelung
  // zieht sie auf den Wert, der tatsächlich herauskommt.
  // [EN] Density control (see _dichteRegeln): target engraved area 0..1, measured on FINISHED
  // dither pattern. 0 = off. Operates after all tone curves, superseding auto-gamma target.
  densityTarget: 0,
  // Wo die Dichte-Regelung misst (s. _dichteRegeln): false = ganzes Feld, true = nur die Zonen mit
  // Zeichnung. Motiv-Automatik (s. _motivZonen): gemessen wird im MOTIV — Haut, sonst Zeichnung in der
  // Bildmitte. Beides Standard AUS, damit bestehende Layouts bitgleich bleiben.
  // [EN] Where density is measured (see _dichteRegeln): false = whole field, true = only zones with drawing.
  // Motive auto (see _motivZonen): measured in MOTIVE — skin, otherwise drawing in image center. Both default OFF.
  autoMotiv: false,
  // Obergrenze für das ganze Feld, wenn die Motiv-Automatik läuft. Ohne sie hebt sie bei
  // einem hellen Hintergrund die Gesamtfläche auf 38–47 % — über 30 % wurde am Werkstück
  // durchgehend „flau" geurteilt (s. URTEILE.md, Bleche 5 und 6).
  // [EN] Upper limit for whole field when auto motive is active. Without it, a bright background
  // lifts total area to 38-47% — above 30% was judged "flat" on physical workpiece (see URTEILE.md).
  densityMax: 0.30,
  // Auto-Gamma je Foto (s. _applyAutoGamma). Aus = bestehende Layouts bleiben bitgleich.
  // [EN] Auto-gamma per photo (see _applyAutoGamma). Off = existing layouts remain bit-identical.
  autoGamma: false,
  autoGammaTarget: 0.45,   // gewünschte gravierte Fläche 0…1 / [EN] target engraved area 0..1
  // Lokaler Kontrast (s. _lokalerKontrast). 0 = aus; bestehende Layouts bleiben bitgleich.
  // [EN] Local contrast (see _lokalerKontrast). 0 = off; existing layouts remain bit-identical.
  localContrast: 0,
  // Schatten aufhellen / Lichter zurücknehmen (s. _lichterSchatten), je 0…1. 0 = aus.
  // [EN] Brighten shadows / pull back highlights (see _lichterSchatten), 0..1 each. 0 = off.
  shadows: 0,
  highlights: 0,
  // Bereiche einzeln belichten (s. _regionAusgleichRegion), 0…1. 0 = aus, damit bestehende
  // Layouts bitgleich bleiben. Greift auch eingeschaltet nur bei Plätzen, die ohne ihn
  // Zeichnung verlieren würden — alle anderen kommen unverändert heraus.
  // [EN] Expose regions individually (see _regionAusgleichRegion), 0..1. 0 = off to keep existing
  // layouts bit-identical. Only triggers for spots that would otherwise lose detail.
  regionAusgleich: 0,
  // Bereichsausgleich bei JEDEM Foto mit dieser Grundstärke (0…1, s. applyLaserPipeline);
  // Plätze mit Warnung bekommen darüber hinaus weiter `regionAusgleich`. 0/false = bisheriges
  // Verhalten. `true` (Stand 27.09. nachmittags) heißt: Grundstärke = regionAusgleich.
  // [EN] Region balance on EVERY photo with this base strength (0..1, see applyLaserPipeline);
  // spots with warning receive additional `regionAusgleich`. 0/false = previous behavior.
  regionImmer: 0,
  // Bunte Logos (s. _logoEinstellung): `logoAuto` erkennt sie selbst — trifft aber etwa jedes
  // hundertste dunkle Foto und macht es zu dunkel. Solche Plätze stehen in der Belegungsliste unter
  // „ALS LOGO GRAVIERT" — vor dem Gravieren ansehen. Läuft nur mit `grafikAuto` mit.
  // `alsLogo` erzwingt die Logo-Behandlung. Bewusst OHNE Schalter im Editor (im Layout gespeichert
  // machte es jedes Foto zum Logo); wirkt nur, wo es ausdrücklich steht (z. B. `laser`-Block einer
  // Reklamation).
  // [EN] Colorful logos (see _logoEinstellung): `logoAuto` detects them automatically — but misidentifies
  // ~1 in 100 dark photos, making it too dark. Such items are marked "ALS LOGO GRAVIERT".
  // Runs only with `grafikAuto`. `alsLogo` forces logo handling.
  logoAuto: true,
  alsLogo: false,
  // Grafik mit Verläufen (s. _istWeicheGrafik): Logos und gerenderte Motive mit weichen Kanten,
  // die die Logo-Erkennung nicht fasst (hochgerechnet, Rauch, Leuchten). `grafikWeich` erkennt sie
  // selbst — Standard AUS, bestehende Layouts bleiben bitgleich; läuft nur mit `grafikAuto` mit.
  // `alsGrafik` erzwingt die Behandlung (Reklamation, nie im Layout speichern — s. alsLogo).
  // [EN] Graphic with gradients (see _istWeicheGrafik): logos and rendered motives with soft edges
  // missed by logo detector (upscaled, smoke, glow). `grafikWeich` detects them automatically — default OFF.
  // `alsGrafik` forces treatment (for complaints, never save in layout).
  grafikWeich: false,
  alsGrafik: false,
  // `grafikErzwingen`: dieselbe Behandlung wie eine erkannte Grafik (s. _grafikEinstellung, Schwelle) —
  // „Als Grafik rechnen" in der Reklamation. Nicht `alsGrafik`: das führt in die Verlaufs-Behandlung.
  // Wie alsLogo nie im Layout speichern.
  // [EN] `grafikErzwingen`: same treatment as detected graphic (see _grafikEinstellung, threshold) —
  // [EN] "Calculate as graphic" in complaints. Distinct from `alsGrafik` which triggers gradient handling.
  // [EN] Like alsLogo, never save in layout.
  grafikErzwingen: false,
  // Tonwertkurve am Hautton (s. _hautKurve), 0…1. Standard 0 = aus, bestehende Layouts
  // bleiben bitgleich.
  // [EN] Tone curve on skin tone (see _hautKurve), 0..1. Default 0 = off, keeping
  // [EN] existing layouts bit-identical.
  hautKurve: 0,
  // Gesichts-Automatik (s. _gesichterAnpassen): jedes gefundene Gesicht bekommt seine eigene
  // Gravurmenge `gesichtZiel`, dazu auf Wunsch eigenes Nachschärfen. Die Kästen kommen vom Editor
  // (YuNet, s. _yunetEingang). Standard AUS, bestehende Layouts bleiben bitgleich.
  // [EN] Face auto-adjustment (see _gesichterAnpassen): each detected face receives its own
  // [EN] engraving density `gesichtZiel`, plus optional dedicated sharpening. Boxes supplied by Editor
  // [EN] (YuNet, see _yunetEingang). Default OFF, existing layouts remain bit-identical.
  gesichtAuto: false,
  gesichtZiel: 0.15,   // 24 % sah dem Nutzer zu hell aus (11.10.2026), 12–15 % gewünscht / [EN] 24% looked too bright to user (Oct 11, 2026), 12-15% desired
  gesichtSchaerfen: 0,
  // Lokaler Auto-Kontrast (CLAHE, s. _clahe): ersetzt den Auto-Kontrast je Foto durch einen je
  // Bildbereich. 0 = aus (Auto-Kontrast wie bisher); Wert = Kappung je Stufe (2 = mild). Am Werkstück
  // 13.10.2026 bestätigt (F02 schwarz, Blech B: Personen im Gegenlicht bekamen Zeichnung, 3,5 war flau).
  // [EN] Local auto-contrast (CLAHE, see _clahe): replaces per-photo auto-contrast with per-region
  // [EN] contrast. 0 = off (standard auto-contrast); value = clip limit (2 = mild). Confirmed on
  // [EN] workpiece Oct 13, 2026 (F02 black, plate B: backlit subjects gained detail, 3.5 was flat).
  clahe: 0,
  claheKacheln: 8,
  // Schärfen mit Radius in Bildpunkten (s. _unsharpMaskR); 0/1 = klassisch 3×3. Mit Radius darf
  // `sharpen` über 1 gehen (F02: 1,5 bei Radius 2 = Profi-Wert „Enhance“).
  // [EN] Sharpening with radius in pixels (see _unsharpMaskR); 0/1 = classic 3x3. With radius,
  // [EN] `sharpen` can exceed 1 (F02: 1.5 at radius 2 = pro "Enhance" setting).
  schaerfRadius: 0,
  // Dichte-Bremse (s. _dichteRegeln): kleinster Gamma-Faktor der Regelung, nach oben gespiegelt (1/x).
  // 0 = ungebremst. Grund 13.10.2026: nach CLAHE drückte die Regelung bis Faktor 0,39 — Gesichter und
  // Kleidung wurden schwarz (Schritt-Analyse Kreuzfahrt-Foto).
  // [EN] Density brake (see _dichteRegeln): minimum gamma factor for regulation, mirrored upward (1/x).
  // [EN] 0 = unconstrained. Reason Oct 13, 2026: after CLAHE, regulation pushed down to factor 0.39 —
  // [EN] faces and clothing became black (step analysis of cruise photo).
  densityFaktorMin: 0,
  // Obere Grenze der Dichte-Bremse (Aufhellen); 0 = spiegelbildlich 1/densityFaktorMin. Nur die Reklamation
  // setzt sie (s. _rfWerteAus im Editor): „heller" löst nur die obere, „dunkler" nur die untere Grenze.
  // [EN] Upper limit of density brake (brightening); 0 = mirrored 1/densityFaktorMin. Only complaint
  // [EN] sets it (see _rfWerteAus in Editor): "brighter" relaxes only upper, "darker" only lower limit.
  densityFaktorMax: 0,
  // Datei-DPI (s. _laserDateiCanvas im Editor): mit `dpi` rechnen, aber eine Datei mit dieser DPI schreiben —
  // jeder Punkt auf jedem k-ten Pixel. F02: 250 → 500, damit EzCad auf „Fixed DPI 500“ bleiben kann. 0 = wie `dpi`.
  // [EN] File DPI (see _laserDateiCanvas in Editor): compute with `dpi`, but write file with this DPI —
  // [EN] each point on every k-th pixel. F02: 250 -> 500, so EzCad can remain on "Fixed DPI 500". 0 = same as `dpi`.
  dateiDpi: 0,
  material: 'foto',
};
function _laserSettings(raw) { return { ...LASER_DEFAULTS, ...(raw || {}) }; }

// Graustufenwert (Rec.601 Luma) — eine Quelle für alle Dither-/BMP-Schleifen.
// [EN] Grayscale value (Rec.601 Luma) — single source for all dither/BMP loops.
function _luma(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }


// Graustufe in-place. Danach gilt data[i] === data[i+1] === data[i+2]; alle folgenden
// Schritte lesen deshalb nur noch den R-Kanal.
// [EN] Grayscale in-place. Afterwards data[i] === data[i+1] === data[i+2]; all following
// [EN] steps therefore only read the R channel.
function _toGray(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i+1] = data[i+2] = _luma(data[i], data[i+1], data[i+2]);
  }
}

// Tonwertkurve als 256er-Tabelle: fn(v) je Grauwert, gerundet und auf 0…255 begrenzt — EIN
// Bauplan für Kontrast, Gamma, Streckung, Ausgleich, Grenzen, Schnitt, Hautkurve und
// Schatten/Lichter. Die Kurven sind rein wertabhängig, mehr als 256 Ergebnisse gibt es nicht.
// [EN] Tone curve as 256-entry lookup table: fn(v) per gray value, rounded and clamped to 0..255 — ONE
// [EN] blueprint for contrast, gamma, stretch, balance, limits, cutoff, skin curve, and shadows/highlights.
// [EN] Curves are purely value-dependent; there are no more than 256 possible outcomes.
function _lut256(fn) {
  const lut = new Uint8Array(256);
  for (let v = 0; v < 256; v++) lut[v] = Math.max(0, Math.min(255, Math.round(fn(v))));
  return lut;
}
// Kurve auf das ganze Bild (nach _toGray gilt R === G === B, gelesen wird nur R).
// [EN] Curve on whole image (after _toGray, R === G === B; only R is read).
function _lutAnwenden(data, lut) {
  for (let i = 0; i < data.length; i += 4) data[i] = data[i+1] = data[i+2] = lut[data[i]];
}
// Kontrast anwenden auf Pixel-Array. Läuft immer NACH _toGray (R === G === B): einmal rechnen und auf
// alle drei Kanäle schreiben, wie _applyGamma/_autoLevels.
// [EN] Apply contrast to pixel array. Always runs AFTER _toGray (R === G === B): calculate once and
// [EN] write to all three channels, like _applyGamma/_autoLevels.
function _contrastLUT(contrast) {
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  return _lut256(v => factor * (v - 128) + 128);
}
function applyContrast(data, contrast) {
  if (contrast === 0) return;
  _lutAnwenden(data, _contrastLUT(contrast));
}

// Auswertungs-Bereiche als ganzzahlige, aufs Bild geklemmte Kästen (rects leer → ganzes Bild).
// Damit betrachten Auto-Kontrast und Schwarz-Anteil NUR die Fotoflächen, nicht den weißen Blattgrund.
// inset = 0 → nach AUSSEN gerundete Box (zum Anwenden einer Kurve: das Foto vollständig erfassen).
// inset > 0 → dieselbe Box nach innen gerückt (zum MESSEN, s. MASK_INSET_PX). Über Behalten/Verwerfen
// entscheidet immer die äußere Box — so passen beide Listen Index für Index zusammen.
// [EN] Evaluation regions as integer boxes clamped to image (rects empty -> whole image).
// [EN] This ensures auto-contrast and black fraction evaluate ONLY photo areas, not white sheet background.
// [EN] inset = 0 -> outwardly rounded box (to apply a curve: cover photo completely).
// [EN] inset > 0 -> same box moved inward (for MEASURING, see MASK_INSET_PX). Retain/discard
// [EN] is always decided by outer box — keeping both lists aligned index-by-index.
function _maskRegions(w, h, rects, inset = 0) {
  if (!rects || !rects.length) return [{ x0: 0, y0: 0, x1: w, y1: h }];
  const out = [];
  for (const r of rects) {
    const ox0 = Math.max(0, Math.floor(r.x)),      oy0 = Math.max(0, Math.floor(r.y));
    const ox1 = Math.min(w, Math.ceil(r.x + r.w)), oy1 = Math.min(h, Math.ceil(r.y + r.h));
    if (!(ox1 > ox0 && oy1 > oy0)) continue;
    if (!inset) { out.push({ x0: ox0, y0: oy0, x1: ox1, y1: oy1 }); continue; }
    const x0 = Math.max(0, Math.ceil(r.x) + inset);
    const y0 = Math.max(0, Math.ceil(r.y) + inset);
    const x1 = Math.min(w, Math.floor(r.x + r.w) - inset);
    const y1 = Math.min(h, Math.floor(r.y + r.h) - inset);
    // Kollabiert das Fenster bei winzigen Feldern, gilt die volle Box.
    // [EN] If window collapses on tiny fields, full box applies.
    out.push(x1 > x0 && y1 > y0 ? { x0, y0, x1, y1 } : { x0: ox0, y0: oy0, x1: ox1, y1: oy1 });
  }
  return out.length ? out : [{ x0: 0, y0: 0, x1: w, y1: h }];
}

// MESSfenster: dasselbe Rechteck, aber garantiert INNERHALB des Fotos.
// Ein Slot liegt fast nie auf einer ganzen Pixelgrenze; nach außen gerundet fasst die Box einen Rahmen
// aus Blattweiß und halbtransparenten Kantenpixeln mit. Zum Anwenden einer Kurve ist das richtig (Weiß
// bleibt Weiß), zum MESSEN fatal: der Weißpunkt klebte auf 255, und identische Fotos landeten je nach
// Slot-Position bei 50 % oder 59 % Gravurfläche.
// Deshalb nach innen runden und zusätzlich einen Pixel abziehen. Kollabiert das Fenster bei winzigen
// Feldern, gilt die volle Box.
// [EN] MEASUREMENT window: same rectangle, but guaranteed INSIDE the photo.
// [EN] A slot almost never aligns with integer pixel boundaries; outwardly rounded, the box captures
// [EN] a border of sheet white and semi-transparent edge pixels. For applying curves this is correct (white
// [EN] stays white), but for MEASUREMENT it is fatal: white point sticks to 255, causing identical photos
// [EN] to land at 50% or 59% engraved area depending on slot position.
// [EN] Therefore round inward and subtract an additional pixel. If window collapses on tiny fields, full box applies.
const MASK_INSET_PX = 1;
// LUT auf alle Pixel INNERHALB der Regionen anwenden. Nach _toGray gilt R===G===B, also
// einmal aus R lesen und auf alle drei Kanäle schreiben. Derselbe Doppel-Loop stand in
// _autoLevels und _applyInkLimits — beide müssen exakt gleich laufen, sonst treffen
// Messung und Wirkung unterschiedliche Pixel.
// [EN] Apply LUT to all pixels WITHIN regions. After _toGray R===G===B, so read once
// [EN] from R and write to all three channels. Same double-loop existed in _autoLevels
// [EN] and _applyInkLimits — both must execute identically, otherwise measurement and effect hit different pixels.
function _applyLutInRegions(data, w, regions, lut) {
  for (const g of regions) {
    for (let y = g.y0; y < g.y1; y++) {
      const row = y * w;
      for (let x = g.x0; x < g.x1; x++) {
        const i = (row + x) * 4;
        data[i] = data[i+1] = data[i+2] = lut[data[i]];
      }
    }
  }
}

const _maskRegionsInner = (w, h, rects) => _maskRegions(w, h, rects, MASK_INSET_PX);

// Helligkeits-Histogramm EINES Bereichs. Erwartet graustufige Daten (nur R wird gelesen).
// [EN] Brightness histogram of ONE region. Expects grayscale data (only R is read).
function _histRegion(data, w, g) {
  const hist = new Uint32Array(256);
  let n = 0;
  for (let y = g.y0; y < g.y1; y++) {
    const row = y * w;
    for (let x = g.x0; x < g.x1; x++) { hist[data[(row + x) * 4]]++; n++; }
  }
  return { hist, n };
}

// Tonwert-Spreizung: 95.- minus 5.-Perzentil. Misst, ob die MASSE der Pixel den Umfang
// nutzt — im Gegensatz zu Schwarz-/Weißpunkt, die schon ein paar Ausreißer auf 0 bzw.
// 255 ziehen können. Arbeitet auf einem fertigen Histogramm, damit die Spreizung NACH
// einem Stretch bestimmt werden kann, ohne die Pixel ein zweites Mal zu lesen.
// [EN] Tonal spread: 95th minus 5th percentile. Measures whether the BULK of the pixels uses the full
// [EN] range — unlike black/white points, which can be pulled to 0 or 255 by just a few outliers.
// [EN] Operates on an existing histogram so spread AFTER a stretch can be determined without reading pixels a second time.
function _spreadOfHist(hist, n) {
  if (!n) return 255;
  const at = (frac) => {
    const target = n * frac;
    let acc = 0;
    for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc >= target) return v; }
    return 255;
  };
  return at(0.95) - at(0.05);
}

// Stretch-LUT (Histogramm-Spreizung mit Clip an beiden Enden, wie „Auto-Tonwertkorrektur").
// null = kein sinnvoller Stretch möglich (fast einfarbiges Bild — ein Stretch würde dort
// nur Rauschen auf den vollen Umfang aufblasen).
// [EN] Stretch-LUT (histogram expansion with clip at both ends, like "auto levels").
// [EN] null = no sensible stretch possible (nearly solid-colored image — a stretch there
// [EN] would only blow up noise across the full tonal range).
function _stretchLUT(hist, n, clipPct = 0.5) {
  const clip = Math.floor(n * clipPct / 100);
  let lo = 0, hi = 255, acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v]; if (acc > clip) { lo = v; break; } }
  acc = 0;
  for (let v = 255; v >= 0; v--) { acc += hist[v]; if (acc > clip) { hi = v; break; } }
  if (hi - lo < 8) return null;
  const scale = 255 / (hi - lo);
  return _lut256(v => (v - lo) * scale);
}

// Je Foto: Histogramm im eingerückten Messfenster, Kurve auf die volle Fotofläche — der
// gemeinsame Ablauf von Auto-Kontrast und Auto-Gamma (Begründung s. _autoLevels). Die
// Listen `mess` und `wirk` sind Index für Index deckungsgleich (s. _maskRegions).
// kurve(hist, n) liefert eine LUT oder null (= dieses Foto bleibt unverändert).
// [EN] Per photo: histogram in indented measurement window, curve applied to full photo area — the
// [EN] shared workflow for auto-contrast and auto-gamma (rationale see _autoLevels). The
// [EN] lists `mess` and `wirk` correspond index-by-index (see _maskRegions).
// [EN] kurve(hist, n) returns a LUT or null (= this photo remains unchanged).
function _jeFotoKurve(data, w, h, rects, kurve) {
  const mess = _maskRegionsInner(w, h, rects);
  const wirk = _maskRegions(w, h, rects);
  for (let ri = 0; ri < wirk.length; ri++) {
    const { hist, n } = _histRegion(data, w, mess[ri] || wirk[ri]);
    const lut = kurve(hist, n);
    if (lut) _applyLutInRegions(data, w, [wirk[ri]], lut);
  }
}

// ── Auto-Tonwertkorrektur, PRO FOTO ──────────────────────────────────────────
// [EN] ── Auto-levels / tonal correction, PER PHOTO ──────────────────────────
// Handyfotos sind oft flau; ohne diesen Schritt landet der halbe Tonwertumfang im Mittelgrau und die
// Gravur wirkt matschig.
// Jeder Slot bekommt sein EIGENES Histogramm und seine eigene Kurve: auf einem Blatt mit Fotos
// verschiedener Kunden säuft mit einer gemeinsamen Kurve das dunkle ab und das helle verschwindet.
// Nebenwirkung: zwei Fotos DESSELBEN Kunden werden unabhängig korrigiert und können unterschiedlich hell
// wirken — der richtige Kompromiss, der Normalfall ist ein Slot = eine Bestellung.
// Der Fallback-Kontrast wird in dieselbe LUT gefaltet (auch er gehört pro Foto entschieden).
// GEMESSEN wird im eingerückten Fenster (sonst kippt der Weißpunkt am Blattgrund), ANGEWENDET auf die
// volle Fotofläche — eine Streckung bildet 255 immer wieder auf 255 ab.
// [EN] Phone photos are often dull; without this step half the tonal range ends up in mid-gray and the
// [EN] engraving appears muddy.
// [EN] Each slot gets its OWN histogram and its own curve: on a sheet with photos of different
// [EN] customers, a shared curve causes dark photos to clip to black and light ones to wash out.
// [EN] Side-effect: two photos of the SAME customer are adjusted independently and may look differently
// [EN] bright — the right trade-off, as normal case is one slot = one order.
// [EN] The fallback contrast is folded into the same LUT (it also needs to be decided per photo).
// [EN] MEASURED in the indented window (otherwise white point snaps to sheet background), APPLIED to the
// [EN] full photo area — a stretch always maps 255 back to 255.
function _autoLevels(data, w, h, rects, clipPct = 0.5) {
  _jeFotoKurve(data, w, h, rects, (hist, n) => {
    if (!n) return null;
    let lut = _stretchLUT(hist, n, clipPct);
    // Histogramm durch die Stretch-LUT mitziehen: so ist die Spreizung NACH dem Stretch
    // bekannt, ohne den Bereich ein zweites Mal zu lesen.
    // [EN] Trace histogram through stretch-LUT: so the spread AFTER stretch
    // [EN] is known without reading the area a second time.
    let hist2 = hist;
    if (lut) {
      hist2 = new Uint32Array(256);
      for (let v = 0; v < 256; v++) hist2[lut[v]] += hist[v];
    }
    if (_spreadOfHist(hist2, n) < AUTOCONTRAST_MIN_SPREAD) {
      const cl = _contrastLUT(AUTOCONTRAST_FALLBACK);
      const st = lut;
      lut = st ? _lut256(v => cl[st[v]]) : cl;
    }
    // null = nichts zu tun: kein Stretch nötig und nicht flau. Angewandt wird NUR auf diesen
    // Bereich: Blattgrund und leere Slots bleiben ungraviert, egal was die Kurve mit 255 macht.
    // [EN] null = nothing to do: no stretch needed and not dull. Applied ONLY to this
    // [EN] region: sheet background and empty slots stay unengraved, regardless of what the curve does to 255.
    return lut;
  });
}

// Auto-Kontrast setzt NUR Schwarz- und Weißpunkt. Hat ein Foto Ausreißer an beiden
// Enden (ein Glanzlicht, eine tiefschwarze Ecke), passiert dabei praktisch nichts,
// obwohl die Masse der Tonwerte eng zusammenliegt. Genau dann — und nur dann — hilft
// ein fester Kontrast-Schub; sonst würde er nach dem Stretch bloß Zeichnung abschneiden.
// [EN] Auto-contrast ONLY sets black and white points. If a photo has outliers on both
// [EN] ends (a specular highlight, a pitch-black corner), virtually nothing happens,
// [EN] even though bulk tonal values are clustered. Exactly then — and only then — a fixed
// [EN] contrast boost helps; otherwise, after stretching, it would merely clip details.
const AUTOCONTRAST_MIN_SPREAD = 100; // 95.–5.-Perzentil von 255: darunter gilt ein Bild als flau
// [EN] 95th-5th percentile of 255: below this, an image is considered dull
// Fester Nachschlag, wenn ein Foto trotz Stretch flau bleibt. Bewusst KEIN pro Bild berechneter Wert:
// der könnte bis +86 gehen und Lichter/Schatten hart abschneiden — im unbeaufsichtigten Serienbetrieb
// ist ein vorhersehbares Ergebnis mehr wert. 10 ≈ Faktor 1,08; greift nur unterhalb
// AUTOCONTRAST_MIN_SPREAD. Zum Verstärken ist Gamma das Mittel.
// [EN] Fixed boost if photo remains dull despite stretch. Deliberately NOT calculated per image:
// [EN] that could go up to +86 and clip highlights/shadows harshly — in unattended batch operation,
// [EN] a predictable result is worth more. 10 ≈ factor 1.08; only applies below
// [EN] AUTOCONTRAST_MIN_SPREAD. Gamma is the tool for intensification.
const AUTOCONTRAST_FALLBACK = 10;

// Gamma / Mitteltöne. gamma > 1 hellt auf (weniger Schwarz → weniger Gravur),
// gamma < 1 dunkelt ab. Wirkt auf die Mitteltöne, ohne Schwarz- und Weißpunkt zu
// verschieben — genau das, was in Photoshop die Levels-Mitte macht.
// [EN] Gamma / midtones. gamma > 1 brightens (less black → less engraving),
// [EN] gamma < 1 darkens. Affects midtones without shifting black and white points —
// [EN] exactly what the levels midpoint does in Photoshop.
function _gammaLUT(gamma) {
  const inv = 1 / gamma;
  return _lut256(v => 255 * Math.pow(v / 255, inv));
}
function _applyGamma(data, gamma) {
  if (!gamma || Math.abs(gamma - 1) < 0.001) return;
  _lutAnwenden(data, _gammaLUT(gamma));
}

// Bisektion: der Wert zwischen lo und hi, bei dem messen(x) das Ziel trifft; `steigt` = messen
// wächst mit x. EINE Fassung für Auto-Gamma und Dichte-Regelung (vorher zweimal ausgeschrieben).
// [EN] Bisection: the value between lo and hi where messen(x) hits target; `steigt` = measure
// [EN] increases with x. ONE implementation for auto-gamma and density control (previously written twice).
function _bisektion(lo, hi, schritte, steigt, messen, ziel) {
  for (let i = 0; i < schritte; i++) {
    const mitte = (lo + hi) / 2;
    if ((messen(mitte) < ziel) === steigt) lo = mitte; else hi = mitte;
  }
  return (lo + hi) / 2;
}

// ── Auto-Gamma je Foto ───────────────────────────────────────────────────────
// [EN] ── Auto-gamma per photo ────────────────────────────────────────────────
// Ein fester Gamma-Wert passt nicht für jedes Kundenfoto (auf demselben Blech 41 % bis 59 % gravierte
// Fläche). Deshalb pro Foto das Gamma, bei dem die GRAVIERTE FLÄCHE einen Zielwert trifft:
//  - Fehlerdiffusion erhält die mittlere Tinte fast exakt — die mittlere Tinte NACH der Gammakurve
//    (auf dem Histogramm, 256 Werte) sagt also voraus, wie viel graviert wird.
//  - Die Tinte ist streng monoton in Gamma, darum reicht eine Bisektion.
//  - Grenzen AUTO_GAMMA_MIN/MAX: lieber das Ziel verfehlen als Zeichnung verlieren.
//  - Der Gamma-Regler des Layouts wirkt bei Auto-Gamma als FAKTOR obendrauf (1,0 = neutral).
// Gemessen im eingerückten Fenster, angewendet auf die volle Fotofläche (s. _autoLevels). Rückgabe:
// Gamma je Foto, zur Kontrolle im Log.
// [EN] A fixed gamma value does not fit every customer photo (on the same sheet 41% to 59% engraved
// [EN] area). Therefore per photo the gamma where the ENGRAVED AREA hits a target value:
// [EN]  - Error diffusion preserves average ink almost exactly — so average ink AFTER the gamma curve
// [EN]    (on the histogram, 256 values) predicts how much is engraved.
// [EN]  - Ink is strictly monotonic in gamma, so a bisection search is sufficient.
// [EN]  - Limits AUTO_GAMMA_MIN/MAX: better to miss target than lose detail.
// [EN]  - The layout's gamma control acts as a FACTOR on top with auto-gamma (1.0 = neutral).
// [EN] Measured in indented window, applied to full photo area (see _autoLevels). Return:
// [EN] gamma per photo, for log inspection.
const AUTO_GAMMA_MIN = 0.5;
const AUTO_GAMMA_MAX = 2.0;
// Neigung nach unten (Nutzerwunsch): Aufhellen wird gedämpft, Abdunkeln nicht. Ein zu helles Foto
// verliert Zeichnung dort, wo sie am meisten zählt (Gesichter laufen weiß zu); ein etwas zu dunkles
// bleibt lesbar. Deshalb zählt der Anteil über 1 nur zu 85 %, der Anteil unter 1 voll.
// [EN] Downward slope bias (user request): brightening is dampened, darkening is not. An overly bright photo
// [EN] loses detail where it counts most (faces blow out to white); a slightly dark photo
// [EN] remains legible. Therefore the portion above 1 only counts at 85%, the portion below 1 fully.
const AUTO_GAMMA_HOCH = 0.85;
const _autoGammaNeigung = g => (g > 1 ? 1 + (g - 1) * AUTO_GAMMA_HOCH : g);
function _inkMittelBeiGamma(hist, n, gamma, inv) {
  const lut = _gammaLUT(gamma);
  let summe = 0;
  for (let v = 0; v < 256; v++) if (hist[v]) summe += hist[v] * _inkOf(lut[v], inv);
  return summe / n;
}
function _autoGammaWert(hist, n, ziel, inv) {
  let lo = AUTO_GAMMA_MIN, hi = AUTO_GAMMA_MAX;
  const inkLo = _inkMittelBeiGamma(hist, n, lo, inv);
  const inkHi = _inkMittelBeiGamma(hist, n, hi, inv);
  const steigt = inkHi > inkLo;
  if (inkHi === inkLo) return 1;                           // einfarbig: nichts zu holen
  // [EN] solid color: nothing to adjust
  if (steigt ? ziel <= inkLo : ziel >= inkLo) return lo;   // Ziel liegt jenseits der Grenzen
  // [EN] Target lies outside bounds
  if (steigt ? ziel >= inkHi : ziel <= inkHi) return hi;
  return _bisektion(lo, hi, 30, steigt, g => _inkMittelBeiGamma(hist, n, g, inv), ziel);
}
function _applyAutoGamma(data, w, h, rects, ziel, faktor, inv) {
  const gammas = [];
  _jeFotoKurve(data, w, h, rects, (hist, n) => {
    if (!n) { gammas.push(null); return null; }
    const g = Math.max(AUTO_GAMMA_MIN, Math.min(AUTO_GAMMA_MAX,
      _autoGammaNeigung(_autoGammaWert(hist, n, ziel, inv)) * (faktor > 0 ? faktor : 1)));
    gammas.push(Math.round(g * 100) / 100);
    return Math.abs(g - 1) >= 0.001 ? _gammaLUT(g) : null;
  });
  return gammas;
}

// ── Schatten aufhellen, Lichter zurücknehmen ─────────────────────────────────
// [EN] ── Lift shadows, pull back highlights ─────────────────────────────────
// Für ein dunkles Gesicht DIREKT NEBEN einer hellen Fläche: die Gravurmenge stimmt, sie sitzt nur an
// der falschen Tonwertstelle — ein Dichte-Griff verschiebt dagegen ALLE Tonwerte zugleich.
// Beide Kurven laufen an BEIDEN Enden auf null aus (Schwarz bleibt schwarz, Weiß weiß): Anhebung mit
// n·(1−n)², Höhepunkt bei einem Drittel Helligkeit; die Lichterkurve ist die Spiegelung. Ohne den
// Faktor n hob die Kurve reines Schwarz an und war nicht monoton.
// _LS_STAERKE 1.2 ist die Grenze, ab der die Summe beider Regler bei Vollausschlag noch monoton
// bleibt: die Steigung fällt auf 1 − 0.4 − 0.4 = 0.2, bleibt also positiv.
// [EN] For a dark face DIRECTLY NEXT TO a bright area: engraving volume is correct, it's just in the
// [EN] wrong tonal range — whereas a density adjustment shifts ALL tonal values simultaneously.
// [EN] Both curves fade to zero at BOTH ends (black stays black, white white): lift with
// [EN] n·(1−n)², peak at one-third brightness; highlight curve is the mirror image. Without the
// [EN] factor n, the curve lifted pure black and was not monotonic.
// [EN] _LS_STAERKE 1.2 is the threshold where the sum of both controls remains monotonic at full deflection:
// [EN] slope drops to 1 − 0.4 − 0.4 = 0.2, thus remaining positive.
const _LS_STAERKE = 1.2;
function _lichterSchatten(data, w, h, rects, schatten, lichter) {
  const s = schatten > 0 ? Math.min(1, schatten) : 0;
  const l = lichter > 0 ? Math.min(1, lichter) : 0;
  if (!s && !l) return;
  const lut = _lut256(v => {
    const n = v / 255;
    let x = v;
    if (s) x += s * _LS_STAERKE * 255 * n * (1 - n) * (1 - n);
    if (l) x -= l * _LS_STAERKE * 255 * (1 - n) * n * n;
    return x;
  });
  // Volle Fotofläche wie beim Auto-Kontrast: beide Kurven lassen 0 und 255 stehen, der weiße
  // Rahmen bleibt also weiß. Bis 08.10.2026 lief sie nur im eingerückten Messfenster, und am
  // Fotorand blieb ein 1–2 px breiter Streifen unbehandelt (Regler in keinem Layout benutzt).
  // [EN] Full photo area as in auto-contrast: both curves leave 0 and 255 untouched, so the white
  // [EN] border stays white. Until 2026-10-08 it ran only in the indented measurement window, leaving
  // [EN] a 1-2 px wide untreated strip at photo edges (slider was unused in any layout).
  _applyLutInRegions(data, w, _maskRegions(w, h, rects), lut);
}

// ── Bereiche einzeln belichten (Himmel, Schatten, helle Wände) ──────────────
// [EN] ── Expose regions individually (sky, shadows, bright walls) ───────────
// Der Fall, an dem alle globalen Regler scheitern: fast weißer Himmel über dunkler Landschaft. Ein
// Gamma hebt beides zugleich — Himmel voll graviert, Landschaft schwarz; inkMax rettet die Landschaft,
// macht den Himmel aber zur grauen Fläche ohne Wolken.
// Deshalb je Bildbereich eine eigene Grundhelligkeit: das Bild wird zerlegt in großflächige Helligkeit
// (Himmel hell, Wald dunkel) und die Zeichnung darauf (Wolken, Blätter). Nur die großflächige
// Helligkeit wird gestaucht, die Zeichnung bleibt. Getrennt wird an Helligkeit und Kanten — was ein
// Bereich IST, muss niemand erkennen.
// Die Grundhelligkeit kommt aus einem selbstgeführten geführten Filter (He et al.): glättet innerhalb
// eines Bereichs, bleibt an starken Kanten stehen (kein Saum am Horizont). Gerechnet auf einem groben
// Gitter (kurze Seite ~160 Punkte), bilinear angewandt („fast guided filter").
// Das UNGRAVIERTE Ende läuft aus (der Überstand darf nicht ergrauen, sonst fährt der Laser ihn ab).
// Das gravierte Ende bewusst NICHT — sonst blieben Glanzlichter auf der Haut als helle Flecken stehen.
// [EN] The case where all global controls fail: almost white sky above dark landscape. A
// [EN] gamma raises both at once — sky fully engraved, landscape pitch black; inkMax saves the landscape,
// [EN] but turns the sky into a flat gray sheet without clouds.
// [EN] Therefore a custom base brightness per image area: the image is split into large-scale brightness
// [EN] (sky bright, forest dark) and the texture details on top (clouds, leaves). Only the large-scale
// [EN] brightness is compressed, details remain. Split based on brightness and edges — no need to
// [EN] semantically identify what a region IS.
// [EN] Base brightness comes from a self-guided guided filter (He et al.): smooths inside a
// [EN] region, preserves strong edges (no halo along horizon). Computed on a coarse
// [EN] grid (short edge ~160 points), bilinearly applied ("fast guided filter").
// [EN] The UNENGRAVED end tapers off (protrusion/bleed must not turn gray, or laser will trace it).
// [EN] The engraved end deliberately does NOT — otherwise skin highlights would remain as pale blotches.
const _RA_KURZ = 160;             // kurze Seite des Rechengitters in Stützstellen
// [EN] short side of calculation grid in support points
const _RA_RADIUS_ANTEIL = 1 / 8;  // Umgebung der Grundhelligkeit, bezogen auf die kurze Seite
// [EN] neighborhood of base brightness, relative to short side
const _RA_EPS = 40 * 40;          // örtliche Varianz, ab der der Filter eine Kante stehen lässt
// [EN] local variance threshold where the filter preserves an edge
const _RA_RAND = 24;              // Auslauf am ungravierten Ende, in Graustufen
// [EN] fade-out at unengraved end, in grayscale values
const _RA_MIN_SEITE = 32;         // kleinere Bereiche bleiben unangetastet
// [EN] smaller regions remain untouched
const _RA_MAX_PX = 6e6;           // nur für Einzelplätze, nicht fürs ganze Blatt (s. applyLaserPipeline)
// [EN] only for single slots, not for entire sheet (see applyLaserPipeline)
// Wann er greift: Die Kennzahl „verlorene Zeichnung" (s. _zeichnungVerloren) hat an 17
// Urteilen am Werkstück gut und schlecht getrennt, Grenze der Warnung 31 %. Hier bewusst
// höher angesetzt — gute Feuerzeuge lagen bis 33,7 %, die sollen unberührt bleiben.
// [EN] When it triggers: The "lost detail" metric (see _zeichnungVerloren) distinguished good and bad
// [EN] across 17 workpiece evaluations, warning threshold 31%. Deliberately set higher here —
// [EN] good lighters scored up to 33.7%, which should remain untouched.
const _RA_GRENZE = 0.40;
const _RA_MIN_GEWINN = 0.05;      // übernommen wird nur, was mindestens 5 Punkte besser ist
// [EN] only adopted if at least 5 points better
// S/W-Fotos landen viermal so oft im Warnbereich 31–40 % wie Farbfotos (Himmel, weiße Shirts neben
// dunklem Motiv). Für sie greift der Ausgleich deshalb schon ab der Warngrenze, in diesem Band aber
// milder (0,35 statt 0,5). Farbfotos bleiben bei 40 %.
// [EN] B/W photos end up in the 31-40% warning range four times more often than color photos (sky, white shirts next to
// [EN] dark subject). For them balance triggers starting at warning threshold, but milder in this band (0.35 instead of 0.5). Color photos stay at 40%.
const _RA_GRENZE_SW = 0.31;
const _RA_SW_MILD = 0.7;          // Anteil der eingestellten Stärke im Band 31–40 %
// [EN] fraction of configured strength in the 31-40% band
const _SW_MAX_SAETTIGUNG = 3;     // mittlere Farbspreizung (max − min), darunter ist es S/W
// [EN] average color spread (max - min), below which it is B/W
// Nur echte Bildpunkte zählen: der Überstand (#000 bzw. #fff) und ausgefressene Lichter
// haben keine Farbe und würden ein blasses Farbfoto zum S/W-Foto machen.
// [EN] Only real pixels count: bleed/protrusion (#000 or #fff) and blown highlights
// [EN] have no color and would misclassify a washed-out color photo as B/W.
function _istSchwarzWeiss(data, w, g) {
  let summe = 0, n = 0;
  for (let y = g.y0; y < g.y1; y += 2) {
    const row = y * w;
    for (let x = g.x0; x < g.x1; x += 2) {
      const i = (row + x) * 4, r = data[i], gr = data[i + 1], b = data[i + 2];
      const l = _luma(r, gr, b);
      if (l < 16 || l > 239) continue;
      summe += Math.max(r, gr, b) - Math.min(r, gr, b); n++;
    }
  }
  return n > 0 && summe / n < _SW_MAX_SAETTIGUNG;
}

// Kastenmittel, separabel mit gleitender Summe; am Rand wird durch die Zahl der tatsächlich vorhandenen
// Stützstellen geteilt. EIN Filter für Bereichsausgleich, lokalen Kontrast und Konturen.
// `zwischen` und `ziel` nehmen den waagerechten bzw. senkrechten Durchgang auf (dürfen `src` sein);
// `runden` = ganzzahlig schreiben (für Uint16-Puffer).
// [EN] Box blur / moving average, separable with running sum; at boundaries it divides by the count of actually present
// [EN] sample points. ONE filter for region balance, local contrast, and contours.
// [EN] `zwischen` and `ziel` hold horizontal and vertical passes (can be `src`);
// [EN] `runden` = write integers (for Uint16 buffers).
function _kastenmittel(src, gw, gh, r, zwischen, ziel, runden) {
  for (let y = 0; y < gh; y++) {
    const row = y * gw;
    let sum = 0, cnt = 0;
    for (let x = 0; x <= Math.min(r, gw - 1); x++) { sum += src[row + x]; cnt++; }
    for (let x = 0; x < gw; x++) {
      zwischen[row + x] = runden ? Math.round(sum / cnt) : sum / cnt;
      const zu = x + r + 1, weg = x - r;
      if (zu < gw) { sum += src[row + zu]; cnt++; }
      if (weg >= 0) { sum -= src[row + weg]; cnt--; }
    }
  }
  for (let x = 0; x < gw; x++) {
    let sum = 0, cnt = 0;
    for (let y = 0; y <= Math.min(r, gh - 1); y++) { sum += zwischen[y * gw + x]; cnt++; }
    for (let y = 0; y < gh; y++) {
      ziel[y * gw + x] = runden ? Math.round(sum / cnt) : sum / cnt;
      const zu = y + r + 1, weg = y - r;
      if (zu < gh) { sum += zwischen[zu * gw + x]; cnt++; }
      if (weg >= 0) { sum -= zwischen[weg * gw + x]; cnt--; }
    }
  }
  return ziel;
}
// Kastenmittel über ein Gitter in einen neuen Float32-Puffer.
// [EN] Box average over a grid into a new Float32 buffer.
function _raBox(src, gw, gh, r) {
  return _kastenmittel(src, gw, gh, r, new Float32Array(gw * gh), new Float32Array(gw * gh), false);
}

// Mittelwert je step×step-Block eines Bereichs (das grobe Gitter von lokalem Kontrast und
// Bereichsausgleich). Zweites Gitter: `quadratDesMittels` = Mittel², sonst Mittel der Quadrate.
// [EN] Mean per step×step block of a region (the coarse grid for local contrast and
// [EN] region balance). Second grid: `quadratDesMittels` = mean², otherwise mean of squares.
function _blockMittel(data, w, g, step, quadratDesMittels) {
  const gw = Math.ceil((g.x1 - g.x0) / step), gh = Math.ceil((g.y1 - g.y0) / step);
  const mit = new Float32Array(gw * gh), zweit = new Float32Array(gw * gh);
  for (let gy = 0; gy < gh; gy++) {
    const y0 = g.y0 + gy * step, y1 = Math.min(g.y1, y0 + step);
    for (let gx = 0; gx < gw; gx++) {
      const x0 = g.x0 + gx * step, x1 = Math.min(g.x1, x0 + step);
      let s = 0, q = 0, n = 0;
      for (let y = y0; y < y1; y++) {
        const row = y * w;
        for (let x = x0; x < x1; x++) { const v = data[(row + x) * 4]; s += v; if (!quadratDesMittels) q += v * v; n++; }
      }
      const m = n ? s / n : 0;
      mit[gy * gw + gx] = m;
      zweit[gy * gw + gx] = quadratDesMittels ? m * m : (n ? q / n : 0);
    }
  }
  return { gw, gh, mit, zweit };
}

// Bilineares Lesen aus so einem Gitter (erste Stützstelle bei start + step/2): je Bildzeile
// bzw. -spalte in [von, bis) der untere und obere Gitterindex und das Gewicht. Einmal je
// Achse vorab gerechnet statt je Bildpunkt; vorher stand die Rechnung in lokalem Kontrast
// und Bereichsausgleich je zweimal ausgeschrieben.
// [EN] Bilinear reading from such a grid (first sample at start + step/2): per image row
// [EN] or column in [von, bis) the lower and upper grid index and weight. Precalculated once
// [EN] per axis instead of per pixel; previously this calculation was written out twice each in local contrast and region balance.
function _bilinearAchse(von, bis, start, step, n) {
  const len = bis - von, i0 = new Int32Array(len), i1 = new Int32Array(len), t = new Float64Array(len);
  const halb = step / 2;
  for (let k = 0; k < len; k++) {
    let f = (von + k - start - halb) / step;
    if (f < 0) f = 0; else if (f > n - 1) f = n - 1;
    const i = n > 1 ? Math.min(n - 2, Math.floor(f)) : 0;
    i0[k] = i; i1[k] = n > 1 ? i + 1 : i; t[k] = n > 1 ? f - i : 0;
  }
  return { i0, i1, t };
}

// GEMESSEN wird in `g` (eingerücktes Fenster), ANGEWANDT auf `wirk` (die volle Fotofläche, wie bei
// _autoLevels); die Abfrage klemmt am Gitterrand. Ohne `wirk` blieb ein 1–2 px breiter Rahmen
// unausgeglichen — eine helle Linie an der Oberkante des Fotos.
// [EN] MEASURED in `g` (indented window), APPLIED to `wirk` (full photo area, as in
// [EN] _autoLevels); query clamps at grid edges. Without `wirk` a 1-2 px wide border remained
// [EN] unadjusted — a light line at the top edge of the photo.
function _regionAusgleichRegion(data, w, g, staerke, inv, wirk = g) {
  const rw = g.x1 - g.x0, rh = g.y1 - g.y0;
  if (rw < _RA_MIN_SEITE || rh < _RA_MIN_SEITE) return;
  const step = Math.max(1, Math.floor(Math.min(rw, rh) / _RA_KURZ));
  const { gw, gh, mit: I, zweit: II } = _blockMittel(data, w, g, step, true);
  const n = gw * gh;
  const r = Math.max(2, Math.round(Math.min(gw, gh) * _RA_RADIUS_ANTEIL));
  const mI = _raBox(I, gw, gh, r), mII = _raBox(II, gw, gh, r);
  const a = new Float32Array(n), b = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const varianz = Math.max(0, mII[i] - mI[i] * mI[i]);
    a[i] = varianz / (varianz + _RA_EPS);
    b[i] = mI[i] * (1 - a[i]);
  }
  const mA = _raBox(a, gw, gh, r), mB = _raBox(b, gw, gh, r);
  // Mittlere Grundhelligkeit des Bereichs — der Punkt, auf den hin gestaucht wird.
  // [EN] Average base brightness of region — the target point towards which compression occurs.
  let summe = 0;
  for (let i = 0; i < n; i++) summe += mA[i] * I[i] + mB[i];
  const mitte = summe / n;

  const ay = _bilinearAchse(wirk.y0, wirk.y1, g.y0, step, gh);
  const ax = _bilinearAchse(wirk.x0, wirk.x1, g.x0, step, gw);
  for (let y = wirk.y0; y < wirk.y1; y++) {
    const ky = y - wirk.y0, ty = ay.t[ky], r0 = ay.i0[ky] * gw, r1 = ay.i1[ky] * gw;
    const row = y * w;
    for (let x = wirk.x0; x < wirk.x1; x++) {
      const kx = x - wirk.x0, tx = ax.t[kx], ix = ax.i0[kx], ix1 = ax.i1[kx];
      // Bilinear, ausgeschrieben statt Closure je Bildpunkt (s. _lokalerKontrastRegion)
      // [EN] Bilinear, written out instead of closure per pixel (see _lokalerKontrastRegion)
      const a00 = r0 + ix, a01 = r0 + ix1, a10 = r1 + ix, a11 = r1 + ix1;
      const i = (row + x) * 4;
      const v = data[i];
      const grund = ((mA[a00] * (1 - tx) + mA[a01] * tx) * (1 - ty)
                   + (mA[a10] * (1 - tx) + mA[a11] * tx) * ty) * v
                  + ((mB[a00] * (1 - tx) + mB[a01] * tx) * (1 - ty)
                   + (mB[a10] * (1 - tx) + mB[a11] * tx) * ty);
      const auslauf = Math.min(1, (inv ? v : 255 - v) / _RA_RAND);
      const neu = v - staerke * (grund - mitte) * auslauf;
      data[i] = data[i+1] = data[i+2] = neu < 0 ? 0 : neu > 255 ? 255 : Math.round(neu);
    }
  }
}

// Nur ein einzelner Bereich (ein Platz): beim ganzen Blatt regelt die Dichte über alle Plätze
// gemeinsam — dort zöge ein schlechter Platz die guten mit. Und nur Fotos: Grafiken, die der
// Logo-Erkennung entwischen, sind kein Fall für einen Helligkeitsausgleich (Fotos haben 127–252
// Graustufen). Gezählt wird wie in _istGrafik am rohen Graubild, also VOR dem Auto-Kontrast.
// [EN] Only a single region (one slot): across the whole sheet density regulates across all slots
// [EN] jointly — there a poor slot would drag down the good ones. And only photos: graphics escaping
// [EN] logo detection are not suitable for brightness equalization (photos have 127-252
// [EN] grayscale levels). Counted as in _istGrafik on raw gray image, i.e., BEFORE auto-contrast.
const _RA_MIN_STUFEN = 64;
function _raBereich(data, w, h, rects) {
  if (!rects || rects.length !== 1 || w * h > _RA_MAX_PX) return null;
  const g = _maskRegionsInner(w, h, rects)[0];
  if (!g || g.x1 - g.x0 < _RA_MIN_SEITE || g.y1 - g.y0 < _RA_MIN_SEITE) return null;
  const { hist, n } = _histRegion(data, w, g);
  return _stufenZahl(hist, n) >= _RA_MIN_STUFEN ? g : null;
}

// ── Lokaler Kontrast je Bildbereich ──────────────────────────────────────────
// [EN] ── Local contrast per image region ─────────────────────────────────────
// Auto-Kontrast und Auto-Gamma arbeiten GLOBAL. Bei einem Foto in praller Sonne verbraucht der Stretch
// seinen Spielraum an Glanzlichtern und tiefen Schatten — die Gesichter dazwischen liegen im selben
// Mittelgrau und verschmelzen beim Rastern zur grauen Fläche.
// Deshalb Kontrast NICHT übers ganze Bild, sondern jeden Punkt gegen seine eigene Umgebung: wo die
// Umgebung flau ist, wird gespreizt; wo sie schon Zeichnung hat, bleibt es fast, wie es ist.
//
// ── WARUM GEDÄMPFT WIRD ───────────────────────────────────────────────────────
// Eine feste Verstärkung schneidet bei Fotos, die schon Kontrast haben, nur noch ab (im Median ~20 %
// der Punkte auf reinem Schwarz/Weiß). Die Verstärkung hängt deshalb an der örtlichen Streuung:
// über _LK_ZIEL_SIGMA („hat genug Zeichnung") wird anteilig heruntergefahren, darunter wirkt sie voll.
//
// ── UMSETZUNG ─────────────────────────────────────────────────────────────────
// Örtlicher Mittelwert und Streuung sind tieffrequent: gerechnet auf einem groben Gitter (~8
// Stützstellen je Radius), beim Anwenden bilinear gelesen — statt eines Integralbilds über 40 Mpx.
// Var = E[v²] − E[v]², beide Gitter durch denselben separablen Kastenfilter.
// Reines Weiß bleibt weiß (über 255 wird geklemmt) — der Blattgrund kann nicht ergrauen.
// [EN] Auto-contrast and auto-gamma work GLOBALLY. For a photo in harsh sunlight, stretching consumes
// [EN] its dynamic range on specular highlights and deep shadows — faces in between sit in the same
// [EN] mid-gray and blend into a flat gray field during dithering.
// [EN] Therefore contrast NOT across the entire image, but each point against its own neighborhood: where
// [EN] neighborhood is flat, contrast expands; where it already has detail, it remains nearly unchanged.
//
// [EN] ── WHY IT IS DAMPENED ──────────────────────────────────────────────────
// [EN] A fixed gain merely clips photos that already have contrast (median ~20% of pixels pinned to pure
// [EN] black/white). Gain therefore depends on local standard deviation:
// [EN] above _LK_ZIEL_SIGMA ("has enough detail") it is proportionally reduced; below it acts fully.
//
// [EN] ── IMPLEMENTATION ──────────────────────────────────────────────────────
// [EN] Local mean and standard deviation are low-frequency: computed on a coarse grid (~8
// [EN] sample points per radius), bilinearly read on apply — instead of an integral image across 40 Mpx.
// [EN] Var = E[v²] - E[v]², both grids filtered through the same separable box filter.
// [EN] Pure white stays white (clamped above 255) — sheet background cannot turn gray.
const _LK_RADIUS_ANTEIL = 1 / 16;  // Umgebungsradius, bezogen auf die kürzere Seite des Bereichs
// [EN] neighborhood radius, relative to shorter side of region
const _LK_MIN_PX = 4;              // darunter ist „Umgebung" kein sinnvoller Begriff mehr
// [EN] below this "neighborhood" is no longer meaningful
const _LK_ZIEL_SIGMA = 45;         // örtliche Streuung (0…255), ab der gedämpft wird
// [EN] local standard deviation (0..255) above which dampening begins
const _LK_MIN_SEITE = 16;          // kleinere Bereiche bleiben unangetastet
// [EN] smaller regions remain untouched

// Örtlicher Mittelwert und Quadratmittel auf einem groben Gitter über EINEN Bereich.
// [EN] Local mean and root-mean-square on a coarse grid over ONE region.
function _lkGitter(data, w, g, radius) {
  const step = Math.max(1, Math.round(radius / 8));
  const { gw, gh, mit, zweit: qua } = _blockMittel(data, w, g, step, false);
  // Separabler Kastenfilter mit gleitender Summe (_raBox) — am Rand wird durch die Zahl
  // der tatsächlich vorhandenen Stützstellen geteilt, nicht gespiegelt oder fortgesetzt.
  // Bis 06.10.2026 stand hier eine wortgleiche Kopie davon.
  // [EN] Separable box filter with running sum (_raBox) — at border divided by count
  // [EN] of actually present sample points, not mirrored or extended.
  // [EN] Up to 2026-10-06 a verbatim copy stood here.
  const gr = Math.max(1, Math.round(radius / step));
  return { gw, gh, step, mit: _raBox(mit, gw, gh, gr), qua: _raBox(qua, gw, gh, gr) };
}

function _lokalerKontrastRegion(data, w, g, staerke) {
  const rw = g.x1 - g.x0, rh = g.y1 - g.y0;
  if (rw < _LK_MIN_SEITE || rh < _LK_MIN_SEITE) return;
  const radius = Math.max(_LK_MIN_PX, Math.round(Math.min(rw, rh) * _LK_RADIUS_ANTEIL));
  const { gw, gh, step, mit, qua } = _lkGitter(data, w, g, radius);
  const ay = _bilinearAchse(g.y0, g.y1, g.y0, step, gh);
  const ax = _bilinearAchse(g.x0, g.x1, g.x0, step, gw);
  for (let y = g.y0; y < g.y1; y++) {
    const ky = y - g.y0, ty = ay.t[ky], r0 = ay.i0[ky] * gw, r1 = ay.i1[ky] * gw;
    const row = y * w;
    for (let x = g.x0; x < g.x1; x++) {
      const kx = x - g.x0, tx = ax.t[kx], ix = ax.i0[kx], ix1 = ax.i1[kx];
      // Bilinear gelesen, ausgeschrieben statt über eine Closure je Bildpunkt (dieselbe
      // Rechnung in derselben Reihenfolge — bitgleich, aber deutlich schneller).
      // [EN] Bilinear read, written inline instead of closure per pixel (same
      // [EN] computation in same order — bit-identical, but significantly faster).
      const a00 = r0 + ix, a01 = r0 + ix1, a10 = r1 + ix, a11 = r1 + ix1;
      const m = (mit[a00] * (1 - tx) + mit[a01] * tx) * (1 - ty)
              + (mit[a10] * (1 - tx) + mit[a11] * tx) * ty;
      const varianz = ((qua[a00] * (1 - tx) + qua[a01] * tx) * (1 - ty)
                     + (qua[a10] * (1 - tx) + qua[a11] * tx) * ty) - m * m;
      const sigma = varianz > 0 ? Math.sqrt(varianz) : 0;
      // Dämpfung: voller Regler in flauen Bereichen, anteilig weniger, je mehr Zeichnung
      // schon da ist. sigma = 0 (einfarbig) bekommt den vollen Wert — dort gibt es nichts
      // zu verstärken, (v − m) ist ja 0, der Punkt bleibt so oder so unverändert.
      // [EN] Dampening: full control value in flat areas, proportionally less the more detail
      // [EN] already exists. sigma = 0 (solid color) gets full value — nothing to boost there anyway,
      // [EN] (v - m) is 0, pixel remains unchanged either way.
      const k = staerke * (sigma > _LK_ZIEL_SIGMA ? _LK_ZIEL_SIGMA / sigma : 1);
      const i = (row + x) * 4;
      const v = m + (data[i] - m) * (1 + k);
      data[i] = data[i+1] = data[i+2] = v < 0 ? 0 : v > 255 ? 255 : Math.round(v);
    }
  }
}

// Wie _autoLevels bereichsweise: jedes Foto für sich, der Blattgrund dazwischen bleibt
// unberührt. Volle (nach außen gerundete) Fotofläche, denn das hier ist ein ANWENDEN.
// Gemeinsamer Rahmen für lokalen Kontrast, Kanten und Konturen: nur bei Stärke > 0.
// [EN] Region-by-region like _autoLevels: each photo individually, sheet background in between remains
// [EN] untouched. Full (outwardly rounded) photo area, because this is an APPLY step.
// [EN] Common frame for local contrast, edges, and contours: only when strength > 0.
function _jeFoto(w, h, rects, staerke, region) {
  if (!(staerke > 0)) return;
  for (const g of _maskRegions(w, h, rects)) region(g);
}
function _lokalerKontrast(data, w, h, rects, staerke) {
  _jeFoto(w, h, rects, staerke, g => _lokalerKontrastRegion(data, w, g, staerke));
}

// ── Kanten verstärken ────────────────────────────────────────────────────────
// [EN] ── Enhance edges ───────────────────────────────────────────────────────
// Auf lackiertem Zink laufen Rasterpunkte zusammen, lange bevor sie eine Form ergeben (ab ~37 %
// Rasterdichte sind Nachbarstufen nicht mehr zu unterscheiden) — Gesichter bestehen fast nur aus
// Mitteltönen. Volltonstriche von 0,10 mm sind dagegen noch sauber: der Maschine fehlt nicht die
// Auflösung, sondern der Kontrast. Durch kommen harte Kanten, weiche Verläufe verschwinden.
// Deshalb: Kanten suchen (Sobel) und abdunkeln. Dunkel heißt auf schwarzem Lack „kein Abtrag" — es
// bleibt eine durchgehende schwarze Linie; Lidfalte, Mundspalt und Haaransatz werden zu Strichen.
// Normiert auf das 95.-Perzentil der Kantenstärke, nicht aufs Maximum (ein Glanzlicht auf einer
// Brille bestimmte sonst die Skala).
//
// ── WARUM ANTEILIG GEDUNKELT WIRD ──────────────────────────────────────────────
// Ein FESTER Abzug (v − Stärke·255·k) drückte mitteldunkle Punkte hart auf 0 — bis zu 36 % der Punkte
// klebten auf Schwarz/Weiß, die Gesichter waren weg. ANTEILIG (v · (1 − Stärke·k)) ist der Abzug durch
// den Abstand zu Schwarz begrenzt und kann nicht klemmen — dieselbe Idee wie _LK_ZIEL_SIGMA.
// Am Werkstück erprobt nur für F02 Schwarz; für ein anderes Material vorher ein Testgitter brennen.
// [EN] On painted zinc halftone dots merge long before forming a shape (above ~37% halftone density
// [EN] adjacent levels can no longer be distinguished) — faces consist almost entirely of midtones.
// [EN] Solid strokes of 0.10 mm on the other hand remain clean: the machine does not lack resolution,
// [EN] but contrast. Sharp edges come through, soft gradients disappear.
// [EN] Therefore: detect edges (Sobel) and darken. On black paint dark means "no ablation" —
// [EN] a continuous black line remains; eyelid creases, lip gaps, and hairline turn into crisp strokes.
// [EN] Normalized to 95th percentile of edge strength, not maximum (a specular reflection on glasses
// [EN] would otherwise dominate the scale).
//
// [EN] ── WHY IT DARKEN PROPORTIONALLY ────────────────────────────────────────
// [EN] A FIXED deduction (v - strength·255·k) harshly crushed medium-dark pixels to 0 — up to 36% of pixels
// [EN] got pinned to pure black/white, destroying faces. PROPORTIONALLY (v · (1 - strength·k)) the deduction is
// [EN] limited by distance to black and cannot clamp — same idea as _LK_ZIEL_SIGMA.
// [EN] Tested on workpiece specifically for F02 Black; for any other material engrave a test grid first.
const _KANTEN_MIN_SEITE = 8;
// Sobel-Betrag ist durch 4·255·√2 begrenzt — feste Skala fürs Perzentil-Histogramm,
// damit kein Vorlauf zum Suchen des Maximums nötig ist.
// [EN] Sobel magnitude is bounded by 4·255·√2 — fixed scale for percentile histogram,
// [EN] eliminating need for pre-pass to find maximum.
const _KANTEN_MAX = 1448;

// Sobel-Kantenstärke zum Quadrat aus den acht Nachbarn (o = oben, m = Mitte, u = unten;
// l/r = links/rechts) — eine Formel für die Kantenverstärkung und die Logo-Erkennung.
// [EN] Squared Sobel edge magnitude from eight neighbors (o = top, m = center, u = bottom;
// [EN] l/r = left/right) — single formula for edge enhancement and logo detection.
function _sobel2(ol, om, or_, ml, mr, ul, um, ur) {
  const gx = -ol - 2*ml - ul + or_ + 2*mr + ur;
  const gy = -ol - 2*om - or_ + ul + 2*um + ur;
  return gx*gx + gy*gy;
}

function _kantenRegion(data, w, g, staerke) {
  const rw = g.x1 - g.x0, rh = g.y1 - g.y0;
  if (rw < _KANTEN_MIN_SEITE || rh < _KANTEN_MIN_SEITE) return;
  const n = rw * rh;
  // Uint16 statt Float32: der Betrag passt in 0…1448, das halbiert den Puffer (bei der
  // gedeckelten Höchstgröße von 40 Mpx 80 statt 160 MB neben den 160 MB ImageData —
  // der Auto-Export läuft in headless Chromium und ist OOM-empfindlich).
  // [EN] Uint16 instead of Float32: magnitude fits into 0..1448, halving buffer size (at capped
  // [EN] max size of 40 Mpx, 80 instead of 160 MB beside the 160 MB ImageData —
  // [EN] auto-export runs in headless Chromium and is OOM-sensitive).
  const kante = new Uint16Array(n);
  const STUFEN = 1024, hist = new Uint32Array(STUFEN);
  const skala = (STUFEN - 1) / _KANTEN_MAX;
  // Sobel bis an den Rand, fehlende Nachbarn werden durch den Randpunkt ersetzt — sonst blieb die
  // Randreihe ungedunkelt, die Dichte-Regelung hellte danach alles auf, und am Rand stand eine weiße Linie.
  // Über Zeilenzeiger statt einer Closure je Bildpunkt (deutlich schneller).
  // [EN] Sobel up to the border, missing neighbors replaced with border pixel — otherwise the border row
  // [EN] stayed un-darkened, subsequent density adjustment brightened everything, and a white border line appeared.
  // [EN] Using line pointers instead of closure per pixel (much faster).
  for (let y = g.y0; y < g.y1; y++) {
    const o = y * w, ob = (y > g.y0 ? y - 1 : y) * w, un = (y < g.y1 - 1 ? y + 1 : y) * w;
    const k0 = (y - g.y0) * rw - g.x0;
    for (let x = g.x0; x < g.x1; x++) {
      const xl = x > g.x0 ? x - 1 : x, xr = x < g.x1 - 1 ? x + 1 : x;
      const ol = data[(ob+xl)*4], om = data[(ob+x)*4], or_ = data[(ob+xr)*4];
      const ml = data[(o +xl)*4],                      mr  = data[(o +xr)*4];
      const ul = data[(un+xl)*4], um = data[(un+x)*4], ur  = data[(un+xr)*4];
      const betrag = Math.sqrt(_sobel2(ol, om, or_, ml, mr, ul, um, ur));
      kante[k0 + x] = betrag;
      hist[(betrag * skala) | 0]++;
    }
  }
  // 95.-Perzentil über das Histogramm statt über Sortieren: bei 40 Mpx spart das
  // mehrere Sekunden und ist für eine Normierungsgröße genau genug. Normiert wird
  // bewusst aufs Perzentil und nicht aufs Maximum — ein einzelnes Glanzlicht auf einer
  // Brille würde sonst die Skala bestimmen (s. oben).
  // [EN] 95th percentile via histogram instead of sorting: on 40 Mpx saves
  // [EN] several seconds and is accurate enough for a normalization metric. Normalized
  // [EN] deliberately to percentile and not maximum — a single highlight on glasses would otherwise dictate scale (see above).
  let acc = 0, p95 = 0;
  for (let st = 0; st < STUFEN; st++) { acc += hist[st]; if (acc >= n * 0.95) { p95 = (st + 0.5) / skala; break; } }
  if (!(p95 > 0)) return;   // einfarbiger Bereich: keine Kanten, nichts zu tun
  // [EN] solid color area: no edges, nothing to do
  for (let y = g.y0; y < g.y1; y++) {
    const row = y * w, k0 = (y - g.y0) * rw - g.x0;
    for (let x = g.x0; x < g.x1; x++) {
      const k = Math.min(1, kante[k0 + x] / p95);
      const i = (row + x) * 4;
      // Anteilig statt fest (s. oben): der Abzug ist durch den Abstand zu Schwarz
      // begrenzt, ein Klemmen auf 0 ist damit ausgeschlossen. `anteil` wird zusätzlich
      // auf [0,1] geklemmt, damit ein verstellter Regler > 100 % nicht ins Negative kippt.
      // [EN] Proportional instead of fixed (see above): deduction is limited by distance to black,
      // [EN] clamping to 0 is impossible. `anteil` is also clamped to [0,1]
      // [EN] so an adjusted slider > 100% does not invert to negative.
      const anteil = 1 - staerke * k;
      data[i] = data[i+1] = data[i+2] = Math.round(data[i] * (anteil < 0 ? 0 : anteil > 1 ? 1 : anteil));
    }
  }
}

// Bereichsweise wie _autoLevels und _lokalerKontrast: jedes Foto für sich, der weiße
// Blattgrund dazwischen bleibt unberührt (dort gibt es ohnehin keine Kanten).
// [EN] Region-by-region like _autoLevels and _lokalerKontrast: each photo individually, white
// [EN] sheet background between remains untouched (no edges there anyway).
function _kantenVerstaerken(data, w, h, rects, staerke) {
  _jeFoto(w, h, rects, staerke, g => _kantenRegion(data, w, g, staerke));
}

// ── Konturen vertiefen, ohne Striche ─────────────────────────────────────────
// [EN] ── Deepen contours without artificial strokes ─────────────────────────
// Nachfolger von _kantenVerstaerken für Fotos. Die Sobel-Fassung dunkelt JEDE Kante beidseitig ab —
// eine dünne HELLE Linie (Lichtreflex im Auge, Lippenglanz) wird dadurch zur SCHWARZEN Linie
// („Augen schwarz ohne Pupillen").
// Hier wird nur die DUNKLE Seite einer Kante vertieft (einseitige Unschärfemaske):
//   v' = v − a · (Umgebung − v)   wo der Punkt dunkler ist als seine Umgebung,
//   v' = v                         sonst.
// Umrisse bleiben ungraviert und schwarz, helle Details hell, Flächen unberührt.
// Umgebung = dreifaches Kastenmittel (≈ Gauß, σ ≈ 2,4 px bei r = 2, rund 0,12 mm bei 500 DPI).
// Zwischenspeicher Uint16 in 1/64-Stufen statt Float32 (halber Speicher, Auto-Export ist
// OOM-empfindlich).
// [EN] Successor of _kantenVerstaerken for photos. The Sobel version darkens EVERY edge on both sides —
// [EN] a thin LIGHT line (specular catchlight in eye, lip gloss) becomes a BLACK line
// [EN] ("black eyes without pupils").
// [EN] Here only the DARK side of an edge is deepened (one-sided unsharp mask):
// [EN]   v' = v - a · (neighborhood - v)   where pixel is darker than its neighborhood,
// [EN]   v' = v                            otherwise.
// [EN] Outlines remain unengraved and black, bright details bright, flat areas untouched.
// [EN] Neighborhood = 3-pass box blur (≈ Gaussian, σ ≈ 2.4 px at r = 2, roughly 0.12 mm at 500 DPI).
// [EN] Buffer Uint16 in 1/64 steps instead of Float32 (half memory, auto-export is OOM-sensitive).
const _KONTUR_FP = 64;
function _konturRegion(data, w, g, staerke, r) {
  const rw = g.x1 - g.x0, rh = g.y1 - g.y0;
  if (rw < _KANTEN_MIN_SEITE || rh < _KANTEN_MIN_SEITE) return;
  const A = new Uint16Array(rw * rh), B = new Uint16Array(rw * rh);
  for (let y = 0; y < rh; y++) {
    const row = (g.y0 + y) * w + g.x0, k0 = y * rw;
    for (let x = 0; x < rw; x++) A[k0 + x] = data[(row + x) * 4] * _KONTUR_FP;
  }
  // Waagerecht A→B, senkrecht B→A, ganzzahlig (Uint16) — drei Durchgänge ≈ Gauß
  // [EN] Horizontal A->B, vertical B->A, integer (Uint16) — three passes ≈ Gaussian
  for (let pass = 0; pass < 3; pass++) _kastenmittel(A, rw, rh, r, B, A, true);
  for (let y = 0; y < rh; y++) {
    const row = (g.y0 + y) * w + g.x0, k0 = y * rw;
    for (let x = 0; x < rw; x++) {
      const i = (row + x) * 4, v = data[i], umgebung = A[k0 + x] / _KONTUR_FP;
      if (v >= umgebung) continue;
      const neu = v - staerke * (umgebung - v);
      data[i] = data[i+1] = data[i+2] = neu <= 0 ? 0 : Math.round(neu);
    }
  }
}
function _konturenVertiefen(data, w, h, rects, staerke, radius) {
  const r = Math.max(1, Math.min(4, Math.round(radius || 2)));
  _jeFoto(w, h, rects, staerke, g => _konturRegion(data, w, g, staerke, r));
}

// ── Dichte-Regelung ──────────────────────────────────────────────────────────
// [EN] ── Density control ─────────────────────────────────────────────────────
// Auto-Gamma setzt die Dichte VOR Schärfen, Kanten, Tonwert-Ausgleich und Rasterung — die verschieben
// sie danach noch einmal (gemessen bis Faktor drei: 6 % bis 82 % bei gleichem Ziel).
// Diese Funktion regelt deshalb auf das, was TATSÄCHLICH aus der Rasterung kommt: per Bisektion den
// Gamma-Faktor, bei dem die fertig geditherte Fläche den Zielwert trifft. Ausreißer sind nur
// überbelichtete Bilder mit großen weißen Flächen (Gamma lässt Weiß unangetastet; dort hilft inkMax).
// GERECHNET AUF EINER VERKLEINERTEN KOPIE (höchstens _REGEL_MAX_PX): die Dichte ist eine Flächenangabe
// und hängt nicht an der Auflösung; der Faktor wird dann auf das volle Bild angewandt.
// [EN] Auto-gamma sets density BEFORE sharpening, edges, tonal balance, and dithering — which shift
// [EN] it again afterwards (measured up to factor of three: 6% to 82% with same target).
// [EN] This function therefore regulates to what ACTUALLY emerges from dithering: via bisection finds
// [EN] gamma factor where finished dithered surface hits the target value. Outliers are only
// [EN] overexposed images with large white fields (gamma leaves white untouched; inkMax helps there).
// [EN] COMPUTED ON A DOWNSAMPLED COPY (at most _REGEL_MAX_PX): density is an area ratio
// [EN] and independent of resolution; the factor is then applied to the full image.
const _REGEL_SCHRITTE = 12;        // Bisektion: 12 Halbierungen ≈ 0,001 Genauigkeit im Faktor
// [EN] Bisection: 12 bisections ≈ 0.001 precision in factor
const _REGEL_MAX_PX = 160000;      // ~400 × 400 — genug für eine Flächenmessung
// [EN] ~400 × 400 — sufficient for surface area measurement
const _REGEL_F_MIN = 0.15, _REGEL_F_MAX = 4.0;

function _verkleinern(data, w, h, maxPx) {
  const faktor = Math.max(1, Math.ceil(Math.sqrt((w * h) / maxPx)));
  if (faktor === 1) return { data, w, h, faktor };
  const nw = Math.max(1, Math.floor(w / faktor)), nh = Math.max(1, Math.floor(h / faktor));
  const out = new Uint8ClampedArray(nw * nh * 4);
  for (let y = 0; y < nh; y++) {
    for (let x = 0; x < nw; x++) {
      let summe = 0, anzahl = 0;
      for (let dy = 0; dy < faktor; dy++) {
        const sy = y * faktor + dy; if (sy >= h) break;
        const row = sy * w;
        for (let dx = 0; dx < faktor; dx++) {
          const sx = x * faktor + dx; if (sx >= w) break;
          summe += data[(row + sx) * 4]; anzahl++;
        }
      }
      const i = (y * nw + x) * 4;
      out[i] = out[i+1] = out[i+2] = anzahl ? Math.round(summe / anzahl) : 255;
      out[i+3] = 255;
    }
  }
  return { data: out, w: nw, h: nh, faktor };
}

// Alles, was nach der Regelung noch kommt — auf der kleinen Kopie nachgestellt, damit gemessen wird,
// was am Ende wirklich graviert wird.
// Die Verfahrenswahl an EINER Stelle: der Export und die Dichte-Regelung (auf der Kopie) müssen mit
// demselben Raster rechnen, sonst läge die Zieldichte still daneben.
// „Dithering aus" heißt harter Schwellenwert, NICHT „gar nichts" (ein 1-Bit-BMP hat keine Grautöne).
// [EN] Everything that comes after regulation — simulated on the small copy to measure
// [EN] what is actually engraved in the end.
// [EN] Algorithm selection in ONE place: export and density regulation (on the copy) must calculate
// [EN] with the exact same dither grid, otherwise target density would silently deviate.
// [EN] "Dithering off" means hard thresholding, NOT "do nothing" (a 1-bit BMP has no grayscales).
function _rastern(data, w, h, s) {
  if      (!s.active)                         thresholdDither(data, s.threshold);
  else if (s.algorithm === 'floyd-steinberg') _errorDiffuse(data, w, h, s.threshold, KERNEL_FLOYD, 16);
  else if (s.algorithm === 'atkinson')        _errorDiffuse(data, w, h, s.threshold, KERNEL_ATKINSON, 8);
  else if (s.algorithm === 'stucki')          _errorDiffuse(data, w, h, s.threshold, KERNEL_STUCKI, 42);
  else if (s.algorithm === 'jarvis')          _errorDiffuse(data, w, h, s.threshold, KERNEL_JARVIS, 48);
  else if (s.algorithm === 'burkes')          _errorDiffuse(data, w, h, s.threshold, KERNEL_BURKES, 32);
  else if (s.algorithm === 'sierra')          _errorDiffuse(data, w, h, s.threshold, KERNEL_SIERRA, 32);
  else if (s.algorithm === 'sierra-lite')     _errorDiffuse(data, w, h, s.threshold, KERNEL_SIERRA_L, 4);
  else if (s.algorithm === 'bayer')           bayer(data, w, h, s.threshold);
  else                                        thresholdDither(data, s.threshold);
}

// `rects` MUSS mit — dieselben Fotoflächen wie im echten Lauf, auf die Kopie umgerechnet. Ohne sie
// liefen die Tonwert-Grenzen über den ganzen Canvas, und bei invertierter Ausgabe zählte der
// Blattgrund als „graviert" (die Fotos landeten bei 3 % statt 22 %).
// Gerastert wird über die VOLLE kleine Kopie (die Fehlerdiffusion muss dieselben Nachbarn sehen),
// gezählt im eingerückten Fenster — dieselbe Kennzahl wie _lpBlackPct in der Vorschau.
// `messRects` trennt WO gerechnet von WO gemessen wird: die Tonwertstufen laufen über die ganze
// Fotofläche, gezählt werden darf in einem kleineren Fenster (Zonen-Regelung, s. _dichteRegeln).
// [EN] `rects` MUST be included — identical photo regions as in actual run, scaled down to the copy. Without them
// [EN] tonal limits would span the entire canvas, and in inverted output sheet background
// [EN] would count as "engraved" (photos ended up at 3% instead of 22%).
// [EN] Dithering runs across FULL downsampled copy (error diffusion needs identical neighbor context),
// [EN] counted inside the indented window — same metric as _lpBlackPct in preview.
// [EN] `messRects` decouples WHERE calculated from WHERE measured: tonal curves run across full
// [EN] photo surface, counting can happen in a smaller window (zone regulation, see _dichteRegeln).
function _restPipeline(data, w, h, s, rects, messRects) {
  _tonwerteUndRaster(data, w, h, s, rects);
  return _graviertAnteil(data, w, _maskRegionsInner(w, h, messRects || rects));
}
// Die letzten Tonwertstufen, Rasterung und Invertieren — EIN Ablauf für die Pipeline und die
// Messkopien der Dichte-Regelung (_restPipeline); sonst regelte sie auf eine Fläche, die so nie
// herauskommt. Tot-Bereich als LETZTE Tonwertstufe direkt vor der Rasterung: er soll genau die Werte
// treffen, die sonst zu Einzelpunkten würden.
// [EN] The final tonal steps, dithering, and inversion — ONE routine for pipeline and
// [EN] density control measurement copies (_restPipeline); otherwise it regulates toward a surface that never
// [EN] results. Dropout range as the FINAL tonal step directly before dithering: it should target exactly the values
// [EN] that would otherwise turn into stray isolated dots.
function _tonwerteUndRaster(data, w, h, s, rects) {
  _applyDotGain(data, s.dotGain, s.invert);
  _applyInkLimits(data, w, h, rects, s.inkMin, s.inkMax, s.invert);
  _applyInkDropout(data, w, h, rects, s.inkDropout, s.invert, s.schattenAuf);
  _rastern(data, w, h, s);
  if (s.invert) _invertBits(data);
}

// Anteil gravierter Fläche (schwarz = graviert in Ezcad) in den Bereichen — EINE Zählung
// für die Dichte-Regelung, ihre Erfolgskontrolle und die Vorschau-Kennzahl (_lpBlackPct).
// [EN] Percentage of engraved surface (black = engraved in EzCad) in regions — ONE count
// [EN] for density regulation, its verification, and preview metric (_lpBlackPct).
function _graviertAnteil(data, w, regions) {
  let schwarz = 0, gesamt = 0;
  for (const g of regions) {
    for (let y = g.y0; y < g.y1; y++) {
      const row = y * w;
      for (let x = g.x0; x < g.x1; x++) { if (data[(row + x) * 4] < 128) schwarz++; gesamt++; }
    }
  }
  return gesamt ? schwarz / gesamt : 0;
}

// ── WO gemessen wird: ganzes Feld oder Motivzone ─────────────────────────────
// [EN] ── WHERE measurement happens: full frame or subject zone ───────────────
// Die Regelung trifft die Gesamtfläche, sagt aber nichts darüber, WO sie landet (im Gesicht zwischen
// 6 und 34 % — Faktor 6; eine helle Wand nahm das Budget).
// `densityZone` misst deshalb NUR in den Zonen, die im Quellbild Zeichnung tragen (Streuung >
// _ZON_DETAIL, dieselbe Zonenkarte wie die Warnung). Angewandt wird weiter auf die volle Fläche.
// Ohne Detailzonen (Rauch, Nebel, Schnee) fällt sie auf das ganze Feld zurück.
// [EN] Regulation hits overall area, but says nothing about WHERE ink lands (in face between
// [EN] 6% and 34% — factor of 6; a bright wall absorbed the budget).
// [EN] `densityZone` therefore measures ONLY in zones carrying detail in source image (spread >
// [EN] _ZON_DETAIL, same zone map as warning). Still applied to full area.
// [EN] Without detail zones (smoke, fog, snow) it falls back to full field.
const _ZONE_MIN = 4;           // so viele Zonen müssen es mindestens sein
// [EN] minimum number of zones required
// Ab dieser Abweichung vom Ziel gilt die Regelung als verfehlt. 2 Punkte, weil die
// Bisektion selbst auf etwa 0,1 Punkte genau trifft und das Rendern gedrehter
// Platzierungen um bis zu 0,3 Punkte streut — alles darüber hat einen Grund.
// [EN] Beyond this deviation from target, regulation is considered missed. 2 points because
// [EN] bisection itself is accurate to ~0.1 points and rendering rotated
// [EN] placements varies by up to 0.3 points — anything above has an underlying reason.
const _DICHTE_TOLERANZ = 0.02;

// ── Wo sitzt das Motiv? ──────────────────────────────────────────────────────
// [EN] ── Where is the subject located? ───────────────────────────────────────
// Drei Anläufe mit ausdrücklichem Rückfall, vom Sicheren zum Groben:
//  1. HAUT, erkannt auf dem FARBBILD (vor der Graustufe) — trifft das Gesicht auch dunkel oder im
//     Gegenlicht.
//  2. ZEICHNUNG IN DER MITTE (mittlere 60 % des Feldes) — Tiere, Gegenstände, Gruppen von hinten.
//  3. ZEICHNUNG ÜBERALL, dann das ganze Feld.
// Zu viel Haut = Nahaufnahme (ganzes Bild ist Motiv) → Anlauf 2. Zu wenig = Fehlerkennung an Holz,
// Sand oder warmem Licht → ebenfalls verwerfen.
// [EN] Three attempts with explicit fallback, from reliable to coarse:
// [EN]  1. SKIN, detected on COLOR image (before grayscale) — hits face even if dark or backlit.
// [EN]  2. DETAIL IN CENTER (middle 60% of field) — animals, objects, back of groups.
// [EN]  3. DETAIL EVERYWHERE, then entire field.
// [EN] Too much skin = close-up (whole frame is subject) -> Attempt 2. Too little = false detection on wood,
// [EN] sand, or warm light -> also discard.
const _HAUT_IN_ZONE = 0.25;    // so viel Haut macht eine Zone zur Motivzone
// [EN] amount of skin turning a zone into a subject zone
const _HAUT_MIN = 0.01;        // unter 1 % der Zonen: keine Haut, sondern Rauschen
// [EN] below 1% of zones: not skin, but noise
const _HAUT_MAX = 0.45;        // über 45 %: Nahaufnahme, Eingrenzen bringt nichts
// [EN] over 45%: close-up, narrowing down yields no benefit
const _MITTE = 0.6;            // mittlere 60 % des Feldes
// [EN] center 60% of field
function _istHaut(r, g, b) {
  // Kovac-Regel für Tageslicht. Bewusst streng: eine falsch erkannte Fläche zieht die
  // Gravur an die falsche Stelle, eine nicht erkannte fällt nur auf Anlauf 2 zurück.
  // [EN] Kovac rule for daylight. Deliberately strict: a falsely identified area drags
  // [EN] engraving to the wrong location, whereas an undetected one simply falls back to Attempt 2.
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return r > 95 && g > 40 && b > 20 && max - min > 15 &&
         Math.abs(r - g) > 15 && r > g && r > b;
}
// Muss VOR _toGray laufen — danach ist die Farbe weg.
// [EN] Must run BEFORE _toGray — after that color is gone.
function _hautMaske(farbe, w, h) {
  const m = new Uint8Array(w * h);
  for (let p = 0, i = 0; i < w * h; i++, p += 4) {
    if (_istHaut(farbe[p], farbe[p + 1], farbe[p + 2])) m[i] = 1;
  }
  return m;
}
// ── Hautkurve ────────────────────────────────────────────────────────────────
// [EN] ── Skin curve ──────────────────────────────────────────────────────────
// Die Dichte-Regelung verteilt ihr Budget nach Helligkeit — Decke, Wand und Glanzlichter nahmen die
// Punkte, die Haut blieb mittelgrau (keine Augen). Hier wird die Tonwertverteilung mit Hautpixeln
// vielfach gewichtet ausgeglichen: Hauttöne bekommen viel Tonwertumfang, Wand und Decke werden
// zusammengeschoben. Monoton; die Kappung je Stufe (wie CLAHE) verhindert Treppen in einfarbigen
// Flächen. Ohne erkannte Haut bleibt der Bereich unangetastet.
// [EN] Density control allocates budget by brightness — ceiling, wall, and highlights consumed dots,
// [EN] skin remained mid-gray (no eyes). Here tonal distribution is equalized heavily weighted
// [EN] by skin pixels: skin tones get substantial tonal range, wall and ceiling are compressed.
// [EN] Monotonic; clipping per bin (like CLAHE) prevents banding in flat areas.
// [EN] Without detected skin the region remains untouched.
const _HK_GEWICHT = 8;      // ein Hautpixel zählt so viel wie 8 andere
// [EN] one skin pixel counts as much as 8 regular ones
const _HK_MIN_HAUT = 0.02;  // unter 2 % Haut im Bereich keine Kurve
// [EN] below 2% skin in region: no curve
const _HK_CLIP = 4;         // Kappung je Stufe, Vielfaches des Mittelwerts
// [EN] clipping per bin, multiple of mean
// Hautkurve-LUT aus einem gewichteten Histogramm (gemeinsam für global und lokal).
// [EN] Skin curve LUT from weighted histogram (shared for global and local).
function _hkLut(hist, staerke) {
  let summe = 0;
  for (let v = 0; v < 256; v++) summe += hist[v];
  const grenze = _HK_CLIP * summe / 256;
  let ueber = 0;
  for (let v = 0; v < 256; v++) if (hist[v] > grenze) { ueber += hist[v] - grenze; hist[v] = grenze; }
  // Verteilungsfunktion so verankert, dass 0 → 0 und 255 → 255 bleiben. Ohne Anker hob die
  // Kurve reines Schwarz an: der ungravierte Überstand (Füllung #000 auf invertiertem
  // Material) bekam am 05.10.2026 im Prüfstand vereinzelte Gravurpunkte (schwer_302-3139159).
  // [EN] Cumulative distribution anchored so 0 -> 0 and 255 -> 255 remain. Without anchor curve
  // [EN] lifted pure black: unengraved bleed/margin (fill #000 on inverted material)
  // [EN] received isolated engraved dots in test stand on 2026-10-05 (schwer_302-3139159).
  const cdf = new Float64Array(256);
  let acc = 0;
  for (let v = 0; v < 256; v++) { acc += hist[v] + ueber / 256; cdf[v] = acc; }
  const c0 = cdf[0], spanne = cdf[255] - c0;
  const lut = new Float32Array(256);
  for (let v = 0; v < 256; v++) {
    const eq = spanne > 0 ? 255 * (cdf[v] - c0) / spanne : v;
    lut[v] = v + staerke * (eq - v);
  }
  return lut;
}
// Lokale Fassung: Kacheln von etwa Gesichtsgröße, je Kachel eine eigene Hautkurve, zwischen den
// Kachelmitten bilinear verblendet (wie CLAHE) — zwei unterschiedlich helle Gesichter bekommen je
// ihre eigene Spreizung. Kacheln ohne Haut bleiben unverändert.
// (Strengere bzw. „weiche" Hautmasken wurden erprobt und verworfen: sie machten Gesichter flacher.)
// [EN] Local version: tiles approximately face-sized, each tile with its own skin curve, bilinearly
// [EN] blended between tile centers (like CLAHE) — two faces with different brightness each get
// [EN] their own contrast expansion. Tiles without skin remain untouched.
// [EN] (Stricter or "soft" skin masks were tested and rejected: they made faces flatter.)
const _HKL_KACHEL = 160;       // ≈ 8 mm bei 500 DPI
// [EN] ≈ 8 mm at 500 DPI
const _HKL_MIN_HAUT = 0.03;    // Kacheln mit weniger Haut: keine Kurve
// [EN] tiles with less skin: no curve
const _HKL_VOLL_HAUT = 0.15;   // ab so viel Haut volle Stärke, darunter anteilig
// [EN] above this skin percentage full strength, below proportional
// Helligkeits-Histogramm eines Rechtecks, Hautpixel _HK_GEWICHT-fach gezählt — gemeinsam für
// die globale und die lokale Hautkurve.
// [EN] Brightness histogram of a rectangle, skin pixels counted _HK_GEWICHT-fold — shared for
// [EN] global and local skin curve.
function _hautHist(data, w, maske, x0, y0, x1, y1) {
  const hist = new Float64Array(256);
  let haut = 0, n = 0;
  for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
    const p = y * w + x, m = maske[p];
    hist[data[p * 4]] += m ? _HK_GEWICHT : 1; haut += m; n++;
  }
  return { hist, haut, n };
}
function _hautKurveLokalRegion(data, w, g, maske, staerke) {
  const rw = g.x1 - g.x0, rh = g.y1 - g.y0;
  const nx = Math.max(1, Math.round(rw / _HKL_KACHEL)), ny = Math.max(1, Math.round(rh / _HKL_KACHEL));
  const kw = rw / nx, kh = rh / ny;
  const luts = [];
  let hautGes = 0;
  for (let ty = 0; ty < ny; ty++) {
    for (let tx = 0; tx < nx; tx++) {
      const x0 = g.x0 + Math.floor(tx * kw), x1 = g.x0 + Math.floor((tx + 1) * kw);
      const y0 = g.y0 + Math.floor(ty * kh), y1 = g.y0 + Math.floor((ty + 1) * kh);
      const { hist, haut, n } = _hautHist(data, w, maske, x0, y0, x1, y1);
      hautGes += haut;
      const anteil = n ? haut / n : 0;
      luts.push(anteil < _HKL_MIN_HAUT ? null : _hkLut(hist, staerke * Math.min(1, anteil / _HKL_VOLL_HAUT)));
    }
  }
  if (luts.every(l => !l)) return 0;
  const lutAn = (tx, ty, v) => { const l = luts[ty * nx + tx]; return l ? l[v] : v; };
  for (let y = g.y0; y < g.y1; y++) {
    const fy = Math.min(ny - 1, Math.max(0, (y - g.y0) / kh - 0.5));
    const ty0 = Math.floor(fy), ty1 = Math.min(ny - 1, ty0 + 1), ay = fy - ty0;
    for (let x = g.x0; x < g.x1; x++) {
      const fx = Math.min(nx - 1, Math.max(0, (x - g.x0) / kw - 0.5));
      const tx0 = Math.floor(fx), tx1 = Math.min(nx - 1, tx0 + 1), ax = fx - tx0;
      const i = (y * w + x) * 4, v = data[i];
      const o = (1 - ay) * ((1 - ax) * lutAn(tx0, ty0, v) + ax * lutAn(tx1, ty0, v))
              + ay * ((1 - ax) * lutAn(tx0, ty1, v) + ax * lutAn(tx1, ty1, v));
      data[i] = data[i + 1] = data[i + 2] = o;
    }
  }
  return hautGes / (rw * rh);
}
function _hautKurve(data, w, h, rects, maske, staerke, lokal) {
  if (!(staerke > 0) || !maske) return null;
  if (lokal) return _maskRegions(w, h, rects).map(g => _hautKurveLokalRegion(data, w, g, maske, staerke));
  return _maskRegions(w, h, rects).map(g => {
    const { hist, haut, n } = _hautHist(data, w, maske, g.x0, g.y0, g.x1, g.y1);
    if (!n || haut / n < _HK_MIN_HAUT) return 0;
    const hk = _hkLut(hist, staerke);
    _applyLutInRegions(data, w, [g], _lut256(v => hk[v]));
    return haut / n;
  });
}

function _hautZonen(maske, w, zonen) {
  const out = [];
  for (const z of zonen) {
    let haut = 0, n = 0;
    for (let y = z.y0; y < z.y0 + _ZON_PX; y++) {
      const row = y * w;
      for (let x = z.x0; x < z.x0 + _ZON_PX; x++) { haut += maske[row + x]; n++; }
    }
    if (n && haut / n >= _HAUT_IN_ZONE) out.push(z);
  }
  return out;
}
function _motivZonen(zonen, hautZ, w, h) {
  if (!zonen.length) return null;
  const anteil = hautZ.length / zonen.length;
  if (hautZ.length >= _ZONE_MIN && anteil >= _HAUT_MIN && anteil <= _HAUT_MAX) return hautZ;
  const detail = zonen.filter(z => z.streu > _ZON_DETAIL);
  if (detail.length < _ZONE_MIN) return null;
  const rand = (1 - _MITTE) / 2;
  const mx0 = w * rand, mx1 = w * (1 - rand), my0 = h * rand, my1 = h * (1 - rand);
  const innen = detail.filter(z => z.x0 + _ZON_PX / 2 >= mx0 && z.x0 + _ZON_PX / 2 <= mx1
                                && z.y0 + _ZON_PX / 2 >= my0 && z.y0 + _ZON_PX / 2 <= my1);
  return innen.length >= _ZONE_MIN ? innen : detail;
}

// Messflächen auf eine um `faktor` verkleinerte Kopie umrechnen. rects = null heißt weiterhin
// „ganzes Bild" und bleibt null — _maskRegionsInner macht daraus die volle Box.
// [EN] Scale measurement regions to copy downsampled by `faktor`. rects = null continues to mean
// [EN] "entire image" and remains null — _maskRegionsInner turns it into the full bounding box.
const _rectsKlein = (rects, faktor) => rects && rects.length
  ? rects.map(r => ({ x: r.x / faktor, y: r.y / faktor, w: r.w / faktor, h: r.h / faktor })) : null;
function _dichteRegeln(data, w, h, rects, s, zonen, hautZ) {
  const ziel = s.densityTarget;
  if (!(ziel > 0 && ziel < 1)) return null;
  const klein = _verkleinern(data, w, h, _REGEL_MAX_PX);
  const kleinRects = _rectsKlein(rects, klein.faktor);
  const motiv = s.autoMotiv && zonen ? _motivZonen(zonen, hautZ || [], w, h) : null;
  const messRects = motiv && motiv.length >= _ZONE_MIN
    ? _rectsKlein(motiv.map(z => ({ x: z.x0, y: z.y0, w: _ZON_PX, h: _ZON_PX })), klein.faktor)
    : null;
  const probe = (faktor, mess) => {
    const kopie = new Uint8ClampedArray(klein.data);
    if (Math.abs(faktor - 1) >= 0.001) _applyGamma(kopie, faktor);
    return _restPipeline(kopie, klein.w, klein.h, s, kleinRects, mess);
  };
  // Höheres Gamma = helleres Bild. Bei invert bedeutet hell = mehr Gravur, ohne invert
  // ist es umgekehrt — die Richtung wird gemessen statt angenommen.
  // [EN] Higher gamma = brighter image. Under invert, light means more engraving; without invert
  // [EN] it's the opposite — direction is measured rather than assumed.
  const steigt = probe(_REGEL_F_MAX, messRects) > probe(_REGEL_F_MIN, messRects);
  const suche = (zielwert, mess) =>
    _bisektion(_REGEL_F_MIN, _REGEL_F_MAX, _REGEL_SCHRITTE, steigt, f => probe(f, mess), zielwert);
  let faktor = suche(ziel, messRects);
  // ── Das Motivziel ist ein BODEN, keine Vorgabe ─────────────────────────────
  // [EN] ── Subject target is a FLOOR, not a hard prescription ────────────────
  // Bei einem guten Foto mit 47 % Deckung im Motiv hätte „auf 23 % regeln" das ganze Bild schwarz
  // gemacht. Deshalb darf die Motivmessung nur MEHR Gravur verlangen, nie weniger als die Regelung über
  // das ganze Feld ergäbe — sie hebt ausgehungerte Motive an und lässt alles andere bitgleich.
  // [EN] For a good photo with 47% coverage in subject, "regulate to 23%" would have turned the entire image black.
  // [EN] Therefore subject measurement may only demand MORE engraving, never less than regulation across
  // [EN] full field would yield — lifting starved subjects while leaving everything else bit-identical.
  if (messRects) {
    const feld = suche(ziel, null);
    const hebt = steigt ? faktor > feld : faktor < feld;
    faktor = hebt ? faktor : feld;
    // Obergrenze: Ein ausgehungertes Motiv anzuheben darf das ganze Feld nicht zulaufen
    // lassen (ohne Deckel landete 304-8655030 bei 38 %, 305-8555544 bei 47 %).
    // Nur nötig, wenn überhaupt angehoben wurde — sonst ist der Wert schon der alte und
    // die dritte Bisektion wäre verschenkte Rechenzeit (12 Proben je Suche).
    // [EN] Upper cap: Lifting a starved subject must not blow out the entire field
    // [EN] (without cap, 304-8655030 landed at 38%, 305-8555544 at 47%).
    // [EN] Only necessary if lifted at all — otherwise value is already previous one and
    // [EN] third bisection would waste compute time (12 probes per search).
    if (hebt && s.densityMax > 0 && s.densityMax < 1) {
      const deckel = suche(s.densityMax, null);
      faktor = steigt ? Math.min(faktor, deckel) : Math.max(faktor, deckel);
    }
  }
  // Dichte-Bremse: höchstens bis `densityFaktorMin` abdunkeln (und spiegelbildlich aufhellen). Lieber das
  // Flächenziel verfehlen als Gesichter und Kleidung schwarz drücken (13.10.2026).
  // [EN] Density brake: darken at most down to `densityFaktorMin` (and brighten symmetrically). Better to
  // [EN] miss surface target than crush faces and clothing to black (2026-10-13).
  const [bremseU, bremseO] = _dichteBremse(s);
  if (bremseU) faktor = Math.max(bremseU, faktor);
  if (bremseO) faktor = Math.min(bremseO, faktor);
  if (Math.abs(faktor - 1) >= 0.001) _applyGamma(data, faktor);
  return Math.round(faktor * 1000) / 1000;
}

// Grenzen der Dichte-Bremse als [unten, oben] (Gamma-Faktor), 0 = keine Grenze. Ohne `densityFaktorMax`
// spiegelbildlich — so wie bis 13.10.2026 fest eingebaut, bestehende Einstellungen bleiben bitgleich.
// [EN] Density brake bounds as [lower, upper] (gamma factor), 0 = no boundary. Without `densityFaktorMax`
// [EN] mirrored — exactly as hardcoded until 2026-10-13, preserving bit-identical behavior for existing settings.
function _dichteBremse(s) {
  const u = s.densityFaktorMin > 0 && s.densityFaktorMin < 1 ? s.densityFaktorMin : 0;
  const o = s.densityFaktorMax > 1 ? s.densityFaktorMax : (u ? 1 / u : 0);
  return [u, o];
}

// Lokaler Auto-Kontrast (CLAHE) je Fotofläche: Histogramm-Ausgleich je Kachel mit Kappung `clip`
// (Vielfaches des Mittelwerts), die Kacheltabellen bilinear verblendet. `nt` Kacheln über die Breite,
// Kacheln annähernd quadratisch. Hebt dunkle Personen vor hellem Grund, ohne den Himmel auszubrennen —
// das, was die Profis bei Gegenlicht von Hand mit „Tiefen/Lichter“ machen.
// [EN] Local auto-contrast (CLAHE) per photo region: histogram equalization per tile with clipping `clip`
// [EN] (multiple of mean), tile lookup tables bilinearly blended. `nt` tiles across width,
// [EN] tiles approximately square. Lifts dark people in front of bright background without blowing out sky —
// [EN] what professionals do manually for backlight with "Shadows/Highlights".
function _claheRegion(data, w, g, clip, nt) {
  const rw = g.x1 - g.x0, rh = g.y1 - g.y0;
  if (rw < 16 || rh < 16) return;
  const tx = nt, ty = Math.max(1, Math.round(nt * rh / rw)), tw = rw / tx, th = rh / ty;
  const luts = [];
  for (let j = 0; j < ty; j++) for (let i = 0; i < tx; i++) {
    const x0 = g.x0 + Math.floor(i * tw), x1 = g.x0 + Math.floor((i + 1) * tw);
    const y0 = g.y0 + Math.floor(j * th), y1 = g.y0 + Math.floor((j + 1) * th);
    const hist = new Float64Array(256); let n = 0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { hist[data[(y * w + x) * 4]]++; n++; }
    const lut = new Uint8Array(256);
    if (!n) { for (let v = 0; v < 256; v++) lut[v] = v; luts.push(lut); continue; }
    const lim = Math.max(1, clip * n / 256); let ex = 0;
    for (let v = 0; v < 256; v++) if (hist[v] > lim) { ex += hist[v] - lim; hist[v] = lim; }
    const add = ex / 256; let c = 0;
    for (let v = 0; v < 256; v++) { c += hist[v] + add; lut[v] = Math.max(0, Math.min(255, Math.round(255 * c / n))); }
    luts.push(lut);
  }
  const achse = (f, n) => { if (f <= 0) return [0, 0, 0]; if (f >= n - 1) return [n - 1, n - 1, 0]; const a = Math.floor(f); return [a, a + 1, f - a]; };
  for (let y = g.y0; y < g.y1; y++) {
    const [j0, j1, ay] = achse((y - g.y0 + 0.5) / th - 0.5, ty);
    for (let x = g.x0; x < g.x1; x++) {
      const [i0, i1, ax] = achse((x - g.x0 + 0.5) / tw - 0.5, tx);
      const i = (y * w + x) * 4, v = data[i];
      const o = (1 - ay) * ((1 - ax) * luts[j0 * tx + i0][v] + ax * luts[j0 * tx + i1][v])
              + ay * ((1 - ax) * luts[j1 * tx + i0][v] + ax * luts[j1 * tx + i1][v]);
      data[i] = data[i + 1] = data[i + 2] = Math.round(o);
    }
  }
}
function _clahe(data, w, h, rects, clip, nt) {
  for (const g of _maskRegions(w, h, rects)) _claheRegion(data, w, g, clip, nt);
}

// Unsharp Mask mit Radius r (Kastenfilter, zweimal = annähernd Gauß), Stärke darf über 1 gehen.
// Der klassische 3×3-Weg (_unsharpMask) bleibt für Radius ≤ 1 — bestehende Layouts bitgleich.
// [EN] Unsharp mask with radius r (box filter, 2 passes ≈ Gaussian), strength can exceed 1.
// [EN] Classic 3×3 approach (_unsharpMask) remains for radius <= 1 — keeping existing layouts bit-identical.
function _unsharpMaskR(data, w, h, amount, r) {
  const n = w * h, src = new Float32Array(n);
  for (let p = 0; p < n; p++) src[p] = data[p * 4];
  const a = Float32Array.from(src), t = new Float32Array(n);
  for (let pass = 0; pass < 2; pass++) {
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0;
      for (let k = -r; k <= r; k++) { const xx = x + k; if (xx < 0 || xx >= w) continue; s += a[y * w + xx]; c++; } t[y * w + x] = s / c; }
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { let s = 0, c = 0;
      for (let k = -r; k <= r; k++) { const yy = y + k; if (yy < 0 || yy >= h) continue; s += t[yy * w + x]; c++; } a[y * w + x] = s / c; }
  }
  for (let p = 0; p < n; p++) { const v = Math.max(0, Math.min(255, Math.round(src[p] + amount * (src[p] - a[p])))); data[p*4] = data[p*4+1] = data[p*4+2] = v; }
}

// Unsharp Mask (3×3-Box-Blur als Unschärfe-Referenz), amount 0…1. Beim Herunterrechnen werden Fotos
// weich; ohne Nachschärfen verliert die Gravur genau die Kanten (Augen, Haare), die sie erkennbar
// machen. Bewusst mild — zu viel erzeugt weiße Säume.
// Separabel (erst horizontale 3er-Summen, dann vertikal), bitgenau wie die 9-fach-Schleife auch am
// Rand (geteilt durch die tatsächlich vorhandenen Nachbarn); Zwischenspeicher 3 Zeilen (Ringpuffer).
// [EN] Unsharp Mask (3×3 box blur as blur reference), amount 0..1. Downsampling makes photos
// [EN] soft; without sharpening engraving loses the exact edges (eyes, hair) making it
// [EN] recognizable. Deliberately mild — too much creates white halos.
// [EN] Separable (horizontal 3-sums first, then vertical), bit-identical to 9-tap loop even at
// [EN] borders (divided by actually present neighbors); 3-line ring buffer.
function _unsharpMask(data, w, h, amount) {
  if (!amount) return;
  const src = new Uint8Array(w * h);
  for (let p = 0; p < w * h; p++) src[p] = data[p * 4];

  const hs = [new Uint16Array(w), new Uint16Array(w), new Uint16Array(w)]; // max 3*255 → passt
  const cntX = new Uint8Array(w);
  for (let x = 0; x < w; x++) cntX[x] = 1 + (x > 0 ? 1 : 0) + (x < w - 1 ? 1 : 0);

  const buildRow = (y) => {
    const buf = hs[y % 3], row = y * w;
    for (let x = 0; x < w; x++) {
      let s = src[row + x];
      if (x > 0)     s += src[row + x - 1];
      if (x < w - 1) s += src[row + x + 1];
      buf[x] = s;
    }
  };
  buildRow(0);
  if (h > 1) buildRow(1);

  for (let y = 0; y < h; y++) {
    // Zeile y+1 nachladen; überschrieben wird dabei y-2, die niemand mehr braucht.
    // [EN] Load row y+1; row y-2 is overwritten, which is no longer needed.
    if (y >= 1 && y + 1 < h) buildRow(y + 1);
    const y0 = Math.max(0, y - 1), y1 = Math.min(h - 1, y + 1);
    const cntY = y1 - y0 + 1;
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let yy = y0; yy <= y1; yy++) s += hs[yy % 3][x];
      const p = y * w + x;
      const v = Math.max(0, Math.min(255, src[p] + amount * (src[p] - s / (cntY * cntX[x]))));
      data[p*4] = data[p*4+1] = data[p*4+2] = v;
    }
  }
}

// ── Fehlerdiffusion ──────────────────────────────────────────────────────────
// [EN] ── Error diffusion ─────────────────────────────────────────────────────
// Ein Kern für alle Fehlerdiffusions-Verfahren; sie unterscheiden sich NUR in Kernel + Divisor.
// Kernel-Einträge: [dx, dy, Gewicht] — dy >= 0, denn diffundiert wird nur nach
// rechts/unten (Zeilen darüber sind schon fertig quantisiert).
// [EN] Single core for all error diffusion algorithms; they differ ONLY in kernel + divisor.
// [EN] Kernel entries: [dx, dy, weight] — dy >= 0, as diffusion only travels
// [EN] right/down (rows above are already quantized).
const KERNEL_FLOYD    = [[1,0,7],[-1,1,3],[0,1,5],[1,1,1]];                       // ÷16
const KERNEL_ATKINSON = [[1,0,1],[2,0,1],[-1,1,1],[0,1,1],[1,1,1],[0,2,1]];       // ÷8 (verteilt bewusst nur 6/8 → kontrastreicher)
// [EN] ÷8 (deliberately distributes only 6/8 -> higher contrast)
// Verfahren mit Fehlerrückgabe. Bei ihnen ist der Schwellenwert WERTLOS (gemessen: 115 → 165 ändert
// die Fläche um 0,0 pp — der Fehler wird ja weitergegeben). Darauf bauen updateDitherSettings (sperrt
// den Regler) und das Testgitter (nimmt stattdessen das Schärfen als zweite Achse). Bei Bayer/
// Schwellenwert ist es umgekehrt: dort ist der Schwellenwert der stärkste Regler (±9 pp).
// [EN] Methods with error feedback. For them threshold is WORTHLESS (measured: 115 -> 165 changes
// [EN] area by 0.0 pp — error is simply passed along). updateDitherSettings relies on this (disables
// [EN] slider) as well as test grid (uses sharpening as second axis instead). For Bayer /
// [EN] threshold it is opposite: threshold is strongest slider (±9 pp).
const _ERR_DIFFUSION = ['floyd-steinberg', 'atkinson', 'stucki',
                        'jarvis', 'burkes', 'sierra', 'sierra-lite'];

const KERNEL_STUCKI   = [[1,0,8],[2,0,4],
                         [-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2],
                         [-2,2,1],[-1,2,2],[0,2,4],[1,2,2],[2,2,1]];              // ÷42 (weichste Verläufe)
// [EN] ÷42 (smoothest gradients)

// Vier weitere Kerne. Sie ändern nur, WIE der Fehler auf die Nachbarn verteilt wird — die Gesamtfläche
// bleibt gleich, unterschiedlich ist die Körnung (je weiter der Kern streut, desto weicher). Ob das am
// Werkstück zählt, kann nur ein Blech zeigen; Atkinson wurde dort bereits als „silbrig" verworfen.
// [EN] Four additional kernels. They only change HOW the error is distributed to neighbors — overall
// [EN] area remains identical, but grain differs (the wider the kernel scatters, the softer). Whether
// [EN] this matters on the workpiece can only be shown on sheet metal; Atkinson was already rejected there as "silvery".
const KERNEL_JARVIS   = [[1,0,7],[2,0,5],
                         [-2,1,3],[-1,1,5],[0,1,7],[1,1,5],[2,1,3],
                         [-2,2,1],[-1,2,3],[0,2,5],[1,2,3],[2,2,1]];              // ÷48 (weichster)
// [EN] ÷48 (softest)
const KERNEL_BURKES   = [[1,0,8],[2,0,4],
                         [-2,1,2],[-1,1,4],[0,1,8],[1,1,4],[2,1,2]];              // ÷32 (Stucki ohne dritte Zeile)
// [EN] ÷32 (Stucki without 3rd row)
const KERNEL_SIERRA   = [[1,0,5],[2,0,3],
                         [-2,1,2],[-1,1,4],[0,1,5],[1,1,4],[2,1,2],
                         [-1,2,2],[0,2,3],[1,2,2]];                               // ÷32
const KERNEL_SIERRA_L = [[1,0,2],[-1,1,1],[0,1,1]];                               // ÷4 (kürzester, körnigster)
// [EN] ÷4 (shortest, grainiest)

// Fehlerpuffer als Ringpuffer aus maxDy+1 Zeilen statt eines Float32Array über das ganze Bild
// (72 MB bei 18 Mpx, Auto-Export ist OOM-empfindlich). Ergebnis identisch: der Kernel diffundiert nur
// nach rechts/unten, quantisierte Pixel werden nie wieder angefasst — direkt in `data` schreiben.
// SERPENTINEN-SCAN: jede zweite Zeile läuft rückwärts, der Kernel wird gespiegelt (dx * dir). Stur
// linksbündig schiebt sich der Restfehler immer in dieselbe Richtung und erzeugt diagonale „Würmer"
// auf Haut und Himmel, die der Laser mitbrennt. Die Gesamt-Schwärzung bleibt gleich.
// [EN] Error buffer as ring buffer of maxDy+1 rows instead of Float32Array across entire image
// [EN] (72 MB at 18 Mpx, auto-export is OOM-sensitive). Identical result: kernel diffuses only
// [EN] right/down, quantized pixels are never touched again — writes directly into `data`.
// [EN] SERPENTINE SCAN: every other row runs backwards, kernel is mirrored (dx * dir). Pure
// [EN] left-to-right shifts residual error always in same direction, producing diagonal worm artifacts
// [EN] on skin and sky that laser burns. Overall blackness remains unchanged.
function _errorDiffuse(data, w, h, threshold, kernel, divisor) {
  let maxDy = 0;
  for (let k = 0; k < kernel.length; k++) if (kernel[k][1] > maxDy) maxDy = kernel[k][1];
  const rows = maxDy + 1;
  const err = [];
  for (let i = 0; i < rows; i++) err.push(new Float32Array(w));

  for (let y = 0; y < h; y++) {
    const cur = err[y % rows];
    // Ungerade Zeilen rückwärts. dir spiegelt den Kernel mit — sonst diffundierte der
    // Fehler beim Rückwärtslauf auf bereits quantisierte Pixel und ginge verloren.
    // [EN] Odd rows in reverse. dir mirrors the kernel — otherwise error would diffuse
    // [EN] onto already quantized pixels during reverse pass and get lost.
    const rtl = (y & 1) === 1;
    const dir = rtl ? -1 : 1;
    for (let n = 0; n < w; n++) {
      const x = rtl ? w - 1 - n : n;
      const p = (y * w + x) * 4;
      const old = data[p] + cur[x];
      const nw = old < threshold ? 0 : 255;
      data[p] = data[p+1] = data[p+2] = nw;
      const e = (old - nw) / divisor;
      if (!e) continue;
      for (let k = 0; k < kernel.length; k++) {
        const xx = x + kernel[k][0] * dir;
        if (xx < 0 || xx >= w) continue;
        const yy = y + kernel[k][1];
        if (yy >= h) continue;
        err[yy % rows][xx] += e * kernel[k][2];
      }
    }
    cur.fill(0); // abgearbeitet → dient als Puffer für Zeile y+rows
    // [EN] done -> serves as buffer for row y+rows
  }
}

// Bayer Ordered Dithering. Der Schwellenwert verschiebt die ganze Matrix (sonst wäre der Regler hier
// wirkungslos).
// HALBER SCHRITT (+0.5): gemeint sind die MITTEN der N Helligkeitsbänder — sonst rasterte Bayer
// systematisch zu hell und derselbe Schwellenwert bedeutete etwas anderes als bei Floyd & Co.
// 8×8 STATT 4×4: 65 statt 17 Tonstufen (Sprünge 1,56 statt 6,25 pp, sonst Streifen in Verläufen), bei
// gleicher Rechenzeit. Die Matrix entsteht per klassischer Rekursion — ausgeschrieben wären es 64
// Zahlen, in denen ein Tippfehler still ein Rastermuster verzieht.
// [EN] Bayer Ordered Dithering. Threshold shifts entire matrix (otherwise slider would be
// [EN] ineffective here).
// [EN] HALF STEP (+0.5): refers to the CENTERS of N brightness bands — otherwise Bayer dithered
// [EN] systematically too bright and same threshold meant something different than Floyd & co.
// [EN] 8x8 INSTEAD OF 4x4: 65 instead of 17 tonal steps (jumps of 1.56 instead of 6.25 pp, preventing banding), at
// [EN] equal computation time. Matrix constructed via classic recursion — written out would be 64
// [EN] numbers where a typo would silently distort the dither pattern.
const BAYER = (() => {
  let m = [[0]];
  for (let s = 1; s < 8; s *= 2) {
    const n = Array.from({ length: s * 2 }, () => new Array(s * 2));
    for (let y = 0; y < s; y++) for (let x = 0; x < s; x++) {
      const v = m[y][x] * 4;
      n[y][x] = v; n[y][x + s] = v + 2; n[y + s][x] = v + 3; n[y + s][x + s] = v + 1;
    }
    m = n;
  }
  return m;
})();
const BAYER_N = BAYER.length;              // 8
const BAYER_LEVELS = BAYER_N * BAYER_N;    // 64
function bayer(data, w, h, threshold = 128) {
  const bias = threshold - 128;
  for (let y = 0; y < h; y++) {
    const mrow = BAYER[y % BAYER_N];
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const t = ((mrow[x % BAYER_N] + 0.5) / BAYER_LEVELS) * 255 + bias;
      const v = data[i] > t ? 255 : 0;
      data[i] = data[i+1] = data[i+2] = v;
    }
  }
}

// Einfacher Schwellenwert
// [EN] Simple threshold dither
function thresholdDither(data, threshold) {
  for (let i = 0; i < data.length; i += 4) {
    const v = data[i] < threshold ? 0 : 255;
    data[i] = data[i+1] = data[i+2] = v;
  }
}

// Exakter Schwarz/Weiß-Tausch auf dem fertigen 1-Bit-Bild (verlustfrei).
// [EN] Exact black/white inversion on finished 1-bit image (lossless).
function _invertBits(data) {
  for (let i = 0; i < data.length; i += 4) {
    data[i] = data[i+1] = data[i+2] = 255 - data[i];
  }
}

// ── Tonwert-Ausgleich gegen Punktzuwachs ─────────────────────────────────────
// [EN] ── Tonal compensation against dot gain ─────────────────────────────────
// DAS Kernproblem jeder Foto-Lasergravur: der Laser brennt keinen Punkt in Pixelgröße — Strahl und
// Wärme machen jeden Punkt größer als seinen Rasterplatz. Ein 50-%-Raster kommt als 60–75 % heraus,
// die Mitteltöne saufen ab. Wie im Druck (dot gain) wird VORHER weniger Tinte geschickt.
// Die Kurve rechnet in Tinte (0 = weiß, 1 = voll), greift in der Mitte am stärksten und lässt Weiß
// und Vollton unangetastet (Sinus-Form). Der richtige Wert hängt an Material UND Maschine:
// exportCalibrationWedge() — Keil brennen, ablesen, eintragen.
//
// ── POLARITÄT (inv) ──────────────────────────────────────────────────────────
// „Tinte" = die Fläche, die der Laser TATSÄCHLICH abfährt. Ezcad graviert die SCHWARZEN Pixel, und
// `invert` tauscht am Ende Schwarz und Weiß — bei Invertieren wird also graviert, was hier noch WEISS
// ist: ink = v/255 statt 1 − v/255. Ohne die Umkehr verstärkte der Ausgleich den Punktzuwachs.
// [EN] THE core challenge of photo laser engraving: laser doesn't engrave a dot in exact pixel size — beam and
// [EN] heat make every point larger than its grid spot. A 50% halftone comes out as 60-75%,
// [EN] midtones drown out. Just as in print (dot gain), LESS ink is sent IN ADVANCE.
// [EN] The curve calculates in ink (0 = white, 1 = full), applies strongest in middle and leaves white
// [EN] and solid tone untouched (sine curve). Optimal value depends on material AND machine:
// [EN] exportCalibrationWedge() — engrave wedge, read off, enter value.
//
// [EN] ── POLARITY (inv) ──────────────────────────────────────────────────────
// [EN] "Ink" = the area laser ACTUALLY traces. EzCad engraves BLACK pixels, and
// [EN] `invert` swaps black and white at the end — so under inversion, what is WHITE here gets engraved:
// [EN] ink = v/255 instead of 1 - v/255. Without reversal, compensation would amplify dot gain.
const _inkOf   = (v, inv) => inv ? v / 255 : 1 - v / 255;
const _inkBack = (ink, inv) => Math.round(255 * (inv ? ink : 1 - ink));
function _dotGainLUT(amount, inv) {
  return _lut256(v => {
    const ink = _inkOf(v, inv);
    return _inkBack(Math.max(0, Math.min(1, ink - amount * Math.sin(Math.PI * ink))), inv);
  });
}
function _applyDotGain(data, amount, inv) {
  if (!amount) return;
  _lutAnwenden(data, _dotGainLUT(amount, inv));
}

// ── Tonwert-Begrenzung (Lichter- und Tiefenpunkt) ────────────────────────────
// [EN] ── Tonal limits (highlight and shadow point) ───────────────────────────
// Die Rasterung läuft linear bis in die Ecken (Grau 250 → 1,7 %, Grau 5 → 98,3 %). Beides kann keine
// Maschine sauber: Einzelpunkte zünden je nach Material nicht, über ~95 % ist alles verschmolzen.
// Wie im Druck: der Tonwertumfang des BILDES wird auf den Bereich abgebildet, den die Maschine
// darstellen kann. Der Ausgleich korrigiert die Mitte, diese Grenzen fassen die Enden.
// Ink-Domäne: ink' = lo + ink · (hi − lo); `inv` dreht die Polarität (s. _inkOf).
// NUR innerhalb der Fotoflächen: ein Lichterpunkt > 0 hebt auch reines Weiß an — über den ganzen
// Canvas bekäme der Blattgrund ein feines Raster und der Laser überführe das ganze Blatt.
// [EN] Dithering runs linearly into corners (gray 250 -> 1.7%, gray 5 -> 98.3%). No machine can engrave
// [EN] either cleanly: isolated dots fail to trigger depending on material; above ~95% everything merges.
// [EN] As in printing: tonal range of IMAGE is mapped to range machine can reliably reproduce.
// [EN] Dot gain compensates midtones, these limits bound the extremes.
// [EN] Ink domain: ink' = lo + ink · (hi - lo); `inv` inverts polarity (see _inkOf).
// [EN] ONLY inside photo regions: highlight point > 0 would raise pure white — across full canvas
// [EN] sheet background would gain a fine dither and laser would trace the entire sheet.
function _inkLimitLUT(lo, hi, inv) {
  return _lut256(v => _inkBack(lo + _inkOf(v, inv) * (hi - lo), inv));
}
function _applyInkLimits(data, w, h, rects, lo, hi, inv) {
  if (lo <= 0 && hi >= 1) return;      // 0…100 % = aus
  // [EN] 0...100% = off
  if (!(hi > lo)) return;              // unsinnige Grenzen ignorieren statt Bild plattmachen
  // [EN] ignore invalid bounds instead of flattening image
  const lut = _inkLimitLUT(lo, hi, inv);
  // Hier das EINGERÜCKTE Fenster, anders als bei _autoLevels: ein Lichterpunkt > 0 bildet
  // 255 auf einen gravierten Wert ab. Auf den nach außen gerundeten Rahmen angewandt
  // bekäme jedes Foto eine hauchdünne gravierte Umrandung aus Blattgrund. Der Preis ist
  // umgekehrt eine 1–2 px breite Fotokante ohne Begrenzung — bei 500 DPI 0,1 mm.
  // [EN] Here the INDENTED window, unlike in _autoLevels: highlight point > 0 maps
  // [EN] 255 to an engraved value. Applied to outwardly rounded frame, every photo
  // [EN] would get a razor-thin engraved outline from sheet background. The trade-off in return
  // [EN] is a 1-2 px wide photo edge without limits — at 500 DPI 0.1 mm.
  _applyLutInRegions(data, w, _maskRegionsInner(w, h, rects), lut);
}

// ── Lichter wegschneiden (Tot-Bereich gegen Einzelpunkte) ────────────────────
// [EN] ── Cut highlights (dropout / deadband against isolated dots) ──────────
// In fast schwarzen Flächen sitzen einzelne gravierte Punkte („weiße Punkte im schwarzen Bereich") —
// die Bauart der Fehlerdiffusion: der Restfehler sammelt sich, bis er die Schwelle reißt. Auf schwarzem
// Lack ist so ein 50-µm-Punkt ein weißer Sprenkel, sichtbarer als das Detail, das er darstellen soll.
// Tinte unter `schwelle` wird auf 0 gesetzt; der Rest der Kurve bleibt UNANGETASTET.
// NICHT verwechseln mit `inkMin`: das HEBT die Lichter an (Grauschleier auf schwarzem Lack). Beide
// zugleich heben sich auf — in der Oberfläche gesperrt. Nur INNERHALB der Fotoflächen.
// ── Schattenstufe ────────────────────────────────────────────────────────────
// Der Schnitt allein macht JEDE gleichmäßige Fläche unter der Schwelle schwarz (dunkelblauer Pulli,
// graues Sofa, schwarzes T-Shirt alle gleich). Mit `auf`: unter `schwelle` weiter schwarz, von
// `schwelle` bis _SCHATTEN_BIS linear auf [auf, _SCHATTEN_BIS] angehoben — Dunkelgrau wird sichtbar
// grau, darüber bleibt die Kurve unangetastet.
// [EN] In nearly black areas sit isolated engraved dots ("white dots in black area") —
// [EN] nature of error diffusion: residual error accumulates until breaching threshold. On black
// [EN] paint such a 50 µm dot is a stark white speckle, more noticeable than the detail it represents.
// [EN] Ink below `schwelle` is forced to 0; remainder of curve remains UNTOUCHED.
// [EN] Do NOT confuse with `inkMin`: that LIFTS highlights (gray haze on black paint). Both
// [EN] at once cancel each other out — locked in UI. Only WITHIN photo regions.
// [EN] ── Shadow step ─────────────────────────────────────────────────────────
// [EN] The cutoff alone turns EVERY uniform area below threshold pitch black (dark blue sweater,
// [EN] gray sofa, black t-shirt look identical). With `auf`: below `schwelle` still black, from
// [EN] `schwelle` to _SCHATTEN_BIS linearly lifted to [auf, _SCHATTEN_BIS] — dark gray becomes visibly
// [EN] gray, above which curve remains untouched.
const _SCHATTEN_BIS = 0.25;
function _dropoutLUT(schwelle, inv, auf = 0) {
  const stufe = auf > schwelle && auf < _SCHATTEN_BIS;
  return _lut256(v => {
    const ink = _inkOf(v, inv);
    if (ink < schwelle) return _inkBack(0, inv);
    if (stufe && ink < _SCHATTEN_BIS)
      return _inkBack(auf + (ink - schwelle) * (_SCHATTEN_BIS - auf) / (_SCHATTEN_BIS - schwelle), inv);
    return v;
  });
}
function _applyInkDropout(data, w, h, rects, schwelle, inv, auf = 0) {
  if (!(schwelle > 0)) return;
  _applyLutInRegions(data, w, _maskRegionsInner(w, h, rects), _dropoutLUT(schwelle, inv, auf));
}

// ── Grafik oder Foto? ────────────────────────────────────────────────────────
// [EN] ── Graphic or photo? ───────────────────────────────────────────────────
// Logos, Schriftzüge und Strichzeichnungen nimmt die Fotoaufbereitung auseinander: die Dichte-Regelung
// läuft in ihren Anschlag, die Kantenverstärkung frisst Buchstabenränder, Schärfen setzt Säume.
//
// ── DIE KENNZAHL ─────────────────────────────────────────────────────────────
// Am ROHEN Graubild: Zahl der Graustufen mit mindestens 0,1 % der Bildpunkte (Grafiken 6–36, Fotos
// 155–252), dazu als Sicherung der Anteil der zwei häufigsten Stufen (Grafiken 66–96 %, Fotos ≤ 44 %).
// Zusätzlich müssen die beiden häufigsten Stufen an den ENDEN liegen (0 und 255): ein sehr dunkles,
// flaues Foto hatte nur 62 Stufen und lief sonst als Grafik (0,2 % Gravur). Deshalb Grenze 40 statt 64.
// Die Richtung des Irrtums ist gewählt: ein nicht erkanntes Logo läuft wie früher durch die
// Fotopipeline — kostet nichts. Ein Foto, das für ein Logo gehalten wird, kostet ein Werkstück.
// [EN] Logos, typography, and line art get ruined by photo processing: density control
// [EN] hits its limit stops, edge boost eats letter contours, sharpening introduces halos.
//
// [EN] ── THE METRIC ──────────────────────────────────────────────────────────
// [EN] On RAW grayscale image: count of gray levels with at least 0.1% of pixels (graphics 6-36, photos
// [EN] 155-252), plus safety check on ratio of two most frequent bins (graphics 66-96%, photos <= 44%).
// [EN] Additionally both dominant bins must lie at the ENDS (0 and 255): a very dark,
// [EN] dull photo had only 62 levels and otherwise ran as graphic (0.2% engraving). Therefore threshold 40 instead of 64.
// [EN] Type of error chosen deliberately: undetected logo passes through photo pipeline as before —
// [EN] costs nothing. A photo mistaken for a logo ruins a workpiece.
const _GRAFIK_MAX_STUFEN = 40;      // darüber ist es ein Foto
// [EN] above this it is a photo
const _GRAFIK_MIN_ZWEI   = 0.50;    // Anteil der zwei häufigsten Stufen
// [EN] fraction of two most frequent levels
const _GRAFIK_RAND       = 8;       // „am Ende" = in den äußersten 8 Stufen
// [EN] "at the end" = within outermost 8 levels
// Zahl der Graustufen, die mindestens 0,1 % der Bildpunkte tragen — die Kennzahl der
// Grafik-Weiche UND des Bereichsausgleichs („nur Fotos"), eine Zählung für beide.
// [EN] Count of gray levels carrying at least 0.1% of pixels — metric for
// [EN] graphic detection AND region balance ("photos only"), one count for both.
function _stufenZahl(hist, n) {
  const mindest = n * 0.001;
  let stufen = 0;
  for (let v = 0; v < 256; v++) if (hist[v] >= mindest) stufen++;
  return stufen;
}
function _istGrafik(hist, n) {
  if (!(n > 0)) return false;
  if (_stufenZahl(hist, n) > _GRAFIK_MAX_STUFEN) return false;
  return _spitzenAmRand(hist, n);
}

// Die zwei häufigsten Stufen tragen die Hälfte des Bildes und liegen beide an einem Ende —
// gemeinsame Bedingung beider Erkennungswege.
// [EN] The two most frequent levels carry half the image and both lie at one end —
// [EN] shared condition for both detection paths.
function _spitzenAmRand(hist, n) {
  if (!(n > 0)) return false;
  let e1 = 0, e2 = 0, i1 = -1, i2 = -1;
  for (let v = 0; v < 256; v++) {
    const h = hist[v];
    if (h > e1) { e2 = e1; i2 = i1; e1 = h; i1 = v; }
    else if (h > e2) { e2 = h; i2 = v; }
  }
  if ((e1 + e2) / n < _GRAFIK_MIN_ZWEI) return false;
  // beide Spitzen an den Enden? Sonst ist es ein flaues Bild, kein zweifarbiges.
  // [EN] Both peaks at the ends? Otherwise it's a flat image, not a two-color graphic.
  const amEnde = v => v >= 0 && (v < _GRAFIK_RAND || v > 255 - _GRAFIK_RAND);
  return amEnde(i1) && amEnde(i2);
}

// ── Zweiter Weg: S/W-Grafik mit weichen Kanten ───────────────────────────────
// [EN] ── Second path: B/W graphic with soft edges ────────────────────────────
// Die Stufenzahl versagt, sobald eine kleine Vorlage aufs Feld hochgerechnet wird (weiche Kanten,
// JPEG-Säume → über 40 Stufen). Was eine Grafik trotzdem verrät: ihre Zwischentöne liegen NUR an
// Kanten, ein Foto hat sie auch in ruhigen Flächen. Gezählt werden Punkte, die weder fast schwarz noch
// fast weiß sind UND sich von ihren Nachbarn kaum unterscheiden (Grafiken ≤ 3 %, Fotos ab 11,8 %).
// [EN] Step count fails as soon as a small source image is upscaled into field (soft edges,
// [EN] JPEG ringing -> over 40 steps). What still betrays a graphic: its midtones exist ONLY at
// [EN] edges, whereas a photo has them in flat smooth areas as well. Counts pixels neither almost black nor
// [EN] almost white AND barely differing from neighbors (graphics <= 3%, photos from 11.8%).
const _GRAFIK_BAND = 32;          // „fast schwarz / fast weiß" = die äußersten 32 Stufen
// [EN] "almost black / almost white" = the outermost 32 levels
const _GRAFIK_GRAD = 16;          // Nachbarn weniger verschieden = ruhige Fläche
// [EN] neighbors differing less = flat smooth area
const _GRAFIK_MAX_FLACH = 0.05;   // höchstens so viel Fläche in ruhigen Zwischentönen
// [EN] at most this much area in flat intermediate tones
// Und BEIDE Enden müssen belegt sein — Tinte und Papier: ein Leopard im Dunkeln (91 % fast schwarz,
// 0 % fast weiß) lief sonst als Grafik und verschwand fast ganz.
// [EN] And BOTH ends must be populated — ink and paper: a leopard in the dark (91% almost black,
// [EN] 0% almost white) would otherwise run as graphic and practically vanish.
const _GRAFIK_MIN_ENDE = 0.015;
function _endenBelegt(hist, n) {
  let dunkel = 0, hell = 0;
  for (let v = 0; v <= _GRAFIK_BAND; v++) dunkel += hist[v];
  for (let v = 255 - _GRAFIK_BAND; v < 256; v++) hell += hist[v];
  return n > 0 && dunkel / n >= _GRAFIK_MIN_ENDE && hell / n >= _GRAFIK_MIN_ENDE;
}
function _flacheZwischentoene(data, w, g) {
  let flach = 0, n = 0;
  for (let y = g.y0 + 1; y < g.y1 - 1; y++) {
    const row = y * w;
    for (let x = g.x0 + 1; x < g.x1 - 1; x++) {
      const i = (row + x) * 4, v = data[i];
      n++;
      if (v <= _GRAFIK_BAND || v >= 255 - _GRAFIK_BAND) continue;
      if (Math.abs(data[i + 4] - data[i - 4]) < _GRAFIK_GRAD &&
          Math.abs(data[i + w * 4] - data[i - w * 4]) < _GRAFIK_GRAD) flach++;
    }
  }
  return n ? flach / n : 1;
}

// Einstellung für eine erkannte Grafik: alles aus, was auf Halbtöne zielt, und statt Fehlerdiffusion
// ein einfacher Schwellenwert — harte Kanten ohne Raster, genau die Kontur der Vorlage.
// `autoContrast` bleibt AUS: ein Logo schöpft seinen Umfang schon aus.
// [EN] Settings for detected graphic: disable everything targeting halftones, and use simple
// [EN] threshold instead of error diffusion — hard edges without dithering, exact contours of template.
// [EN] `autoContrast` remains OFF: a logo already utilizes its dynamic range.
function _grafikEinstellung(s) {
  return { ...s, algorithm: 'threshold', autoContrast: false, autoGamma: false,
           sharpen: 0, dotGain: 0, inkMin: 0, inkMax: 1, inkDropout: 0,
           edgeBoost: 0, konturen: 0, localContrast: 0, densityTarget: 0, clahe: 0, schaerfRadius: 0 };
}

// ── Bunte Logos auf dunklem Grund ────────────────────────────────────────────
// [EN] ── Colorful logos on dark background ───────────────────────────────────
// Die Grafik-Weiche erkennt nur zweifarbige Vorlagen; bunte Band- und Vereinslogos liefen als Foto
// (Kanten und Schärfen fraßen die Schrift, das Raster setzte Punkte in den schwarzen Grund).
// Was trennt: viel Fläche auf harten Kanten UND überwiegend dunkler Grund. Trifft allerdings auch
// manche dunklen Fotos (Nachtstadt, Neonhalle) — abschaltbar über `logoAuto`, s. LASER_DEFAULTS.
// [EN] Graphic branch only recognizes two-color graphics; colorful band/club logos ran as photo
// [EN] (edges and sharpening ate lettering, dithering sprinkled dots onto black background).
// [EN] Distinguishing factor: substantial surface on sharp edges AND predominantly dark background. Also triggers
// [EN] on some dark photos (night city, neon hall) — can be disabled via `logoAuto`, see LASER_DEFAULTS.
const _LOGO_KANTE = 100;         // Kantenstärke (Sobel ÷ 4), ab der eine Kante „hart" ist
// [EN] edge magnitude (Sobel ÷ 4) above which edge is considered "sharp"
const _LOGO_MIN_KANTEN = 0.025;  // so viel Fläche muss auf harten Kanten liegen
// [EN] this much surface must lie on sharp edges
const _LOGO_DUNKEL = 24;         // Graustufe, unter der ein Punkt zum dunklen Grund zählt
// [EN] gray level below which pixel counts as dark background
const _LOGO_MIN_DUNKEL = 0.35;   // so viel Fläche dunkler Grund
// [EN] this much surface of dark background
function _istLogoAufDunkel(data, w, g) {
  let hart = 0, dunkel = 0, n = 0;
  const W = w * 4;
  for (let y = g.y0 + 1; y < g.y1 - 1; y++) {
    for (let x = g.x0 + 1; x < g.x1 - 1; x++) {
      const i = (y * w + x) * 4;
      n++;
      if (data[i] < _LOGO_DUNKEL) dunkel++;
      if (_sobel2(data[i - W - 4], data[i - W], data[i - W + 4], data[i - 4], data[i + 4],
                  data[i + W - 4], data[i + W], data[i + W + 4]) > 16 * _LOGO_KANTE * _LOGO_KANTE) hart++;
    }
  }
  return n > 0 && hart / n >= _LOGO_MIN_KANTEN && dunkel / n >= _LOGO_MIN_DUNKEL;
}
// Trifft `test` auf JEDE Fotofläche zu (eingerücktes Fenster)? Gemeinsam für Grafik-, Logo- und
// Verlaufs-Erkennung: umgeschaltet wird nur, wenn alle Plätze dieses Rendervorgangs passen.
// [EN] Does `test` apply to EVERY photo region (indented window)? Shared for graphic, logo, and
// [EN] gradient detection: switched only if all slots in this render operation qualify.
function _alleBereiche(w, h, rects, test) {
  const gruppen = _maskRegionsInner(w, h, rects);
  return gruppen.length > 0 && gruppen.every(test);
}
// Nur FARBIGE Bilder (swBereiche: S/W-Befund je Bereich, vor der Graustufe) — sonst liefen dunkle
// S/W-Fotos mit harten Kanten als Logo; S/W-Grafiken fängt die Grafik-Weiche.
// [EN] Only COLOR images (swBereiche: B/W verdict per region, before grayscale conversion) — otherwise dark
// [EN] B/W photos with sharp edges ran as logo; B/W graphics are caught by graphic branch.
function _alleLogos(data, w, h, rects, swBereiche) {
  return _alleBereiche(w, h, rects, (g, i) => !(swBereiche && swBereiche[i]) && _istLogoAufDunkel(data, w, g));
}

// ── Grafik mit Verläufen ─────────────────────────────────────────────────────
// [EN] ── Graphic with gradients ──────────────────────────────────────────────
// Hochgerechnete Werbegrafiken (z. B. eine Zigarettenpackung mit Rauch) haben weiche Kanten und laufen
// sonst als Foto — die Fotostufen heben dann Rauch, Motiv und Schrift ins selbe Grau.
// Erkannt wird, was ein Foto fast nie hat: viel REINES Schwarz im INNEREN (mittlere 60 % je Achse),
// glatte Flächen ohne Sensorrauschen, Farbe. Trifft aber ~1 % der Stockfotos (Nacht, Low-Key) —
// deshalb Standard AUS und Meldung in der Belegungsliste.
// Behandlung: die Tonwerte der Vorlage (Auto-Kontrast, Schärfen, Konturen, Floyd, Schnitt), ohne
// Regelung, Motiv-Automatik, Bereichsausgleich, Schattenstufe, Auto-Gamma und Tonwert-Ausgleich.
// Floyd statt Atkinson: Atkinson verliert 2/8 des Fehlers, dunkelgrauer Rauch würde schwarz.
// [EN] Upscaled promotional graphics (e.g. cigarette pack with smoke) have soft edges and would
// [EN] otherwise run as photo — photo stages would then lift smoke, subject, and text into same flat gray.
// [EN] Detects what a photo almost never has: substantial PURE black in the INTERIOR (middle 60% per axis),
// [EN] smooth areas without sensor noise, color. Triggers however on ~1% of stock photos (night, low-key) —
// [EN] therefore default OFF with notification in slot allocation list.
// [EN] Treatment: preserve tonal values of template (auto-contrast, sharpen, contours, Floyd, cutoff), without
// [EN] regulation, subject automation, region balance, shadow step, auto-gamma, and dot gain compensation.
// [EN] Floyd instead of Atkinson: Atkinson drops 2/8 of error, turning dark gray smoke black.
const _WEICH_SCHWARZ = 0.15;   // Anteil reines Schwarz (Luma ≤ 3) im Inneren
// [EN] fraction of pure black (luma <= 3) in interior
const _WEICH_RAUSCHEN = 4;     // Median |Laplace| der Mitteltöne, darüber ist es ein Foto
// [EN] median |Laplace| of midtones, above this it is a photo
const _WEICH_FARBE = 10;       // mittlere Farbspreizung der Mitteltöne, darunter S/W
// [EN] mean color spread of midtones, below which it is B/W
function _istWeicheGrafik(data, w, g) {
  const bw = g.x1 - g.x0, bh = g.y1 - g.y0;
  const x0 = g.x0 + Math.floor(bw * 0.2), x1 = g.x0 + Math.ceil(bw * 0.8);
  const y0 = g.y0 + Math.floor(bh * 0.2), y1 = g.y0 + Math.ceil(bh * 0.8);
  if (x1 - x0 < 8 || y1 - y0 < 8) return false;
  const L = (i) => _luma(data[i], data[i + 1], data[i + 2]);
  const lap = new Uint32Array(1021);
  let schwarz = 0, n = 0, farbe = 0, farbN = 0, lapN = 0;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      const i = (y * w + x) * 4, l = L(i);
      n++;
      if (l <= 3) schwarz++;
      if (l > 20 && l < 235) { farbe += Math.max(data[i], data[i + 1], data[i + 2]) - Math.min(data[i], data[i + 1], data[i + 2]); farbN++; }
      if ((x & 1) || (y & 1) || l < 25 || l > 230) continue;
      const W = w * 4;
      const d = Math.abs(4 * l - L(i - 4) - L(i + 4) - L(i - W) - L(i + W));
      lap[Math.min(1020, Math.round(d))]++; lapN++;
    }
  }
  if (!n || !lapN || !farbN) return false;
  let acc = 0, median = 0;
  for (let v = 0; v <= 1020; v++) { acc += lap[v]; if (acc * 2 >= lapN) { median = v; break; } }
  return schwarz / n >= _WEICH_SCHWARZ && median <= _WEICH_RAUSCHEN && farbe / farbN >= _WEICH_FARBE;
}
function _alleWeichGrafik(data, w, h, rects) {
  return _alleBereiche(w, h, rects, g => _istWeicheGrafik(data, w, g));
}
function _weicheGrafikEinstellung(s) {
  return { ...s, autoGamma: false, densityTarget: 0, autoMotiv: false, regionAusgleich: 0, regionImmer: 0,
           edgeBoost: 0, dotGain: 0, schattenAuf: 0, localContrast: 0,
           konturen: s.konturen > 0 ? s.konturen : 1.5,
           // wie vor dem 13.10.2026: Auto-Kontrast statt CLAHE, klassisches Schärfen höchstens 0,8
           // [EN] as before 2026-10-13: auto-contrast instead of CLAHE, classic sharpening at most 0.8
           clahe: 0, schaerfRadius: 0, sharpen: Math.min(s.sharpen, 0.8) };
}
// Einstellung für ein buntes Logo: die Tonwerte der Vorlage lassen (kein Auto-Gamma, keine
// Dichte-Regelung, keine Motiv-Automatik), nichts an Kanten drehen, und Atkinson statt Floyd: Atkinson
// verteilt nur drei Viertel des Fehlers — Flächen bleiben sauber, Schrift wird satt statt gepunktet
// (bei Fotos macht genau das die Haut „silbrig", hier ist es gewollt).
// [EN] Settings for colorful logo: leave template tones untouched (no auto-gamma, no
// [EN] density regulation, no subject automation), no edge adjustments, and Atkinson instead of Floyd: Atkinson
// [EN] distributes only three quarters of error — flat fills stay solid, text stays crisp rather than stippled
// [EN] (in photos that produces "silvery" skin, but here it is desired).
function _logoEinstellung(s) {
  return { ...s, algorithm: 'atkinson', autoGamma: false, densityTarget: 0, autoMotiv: false,
           sharpen: 0, edgeBoost: 0, konturen: 0, inkDropout: 0, localContrast: 0, regionAusgleich: 0,
           clahe: 0, schaerfRadius: 0 };
}

// Prüft die Fotoflächen EINES Rendervorgangs; umgeschaltet wird nur, wenn ALLE Grafiken sind (sonst
// liefen Tonwertstufen und Rasterung für ein Foto daneben falsch). Im Vorlagen-Export rechnet ohnehin
// jeder Platz für sich (`{only: feld}`), dort greift es also auch auf gemischten Blechen.
// [EN] Checks photo areas of ONE render pass; switches only if ALL are graphics (otherwise
// [EN] tonal steps and dithering would be wrong for adjacent photo). In template export each slot
// [EN] calculates independently anyway (`{only: feld}`), so it also applies on mixed sheets.
function _alleGrafik(data, w, h, rects) {
  return _alleBereiche(w, h, rects, g => {
    const { hist, n } = _histRegion(data, w, g);
    return _istGrafik(hist, n) || (_spitzenAmRand(hist, n) && _endenBelegt(hist, n)
                                   && _flacheZwischentoene(data, w, g) < _GRAFIK_MAX_FLACH);
  });
}

// ── Verlorene Zeichnung messen (nur Diagnose, ändert das Bild NICHT) ─────────
// [EN] ── Measure lost detail (diagnostic only, does NOT alter image) ─────────
// Aus Urteilen am Werkstück abgeleitet: keine einfache Bildkennzahl (Helligkeit, Flächenanteile,
// Streuung) trennte gut von schlecht. Was trennt, ist ein VERGLEICH von Vorlage und Ergebnis: eine
// Stelle, die im QUELLBILD Zeichnung hat und in der GRAVUR flach ist. (Ungraviert allein ist nicht
// schlecht — dunkle Haare sollen schwarz bleiben.) Gute Feuerzeuge 4–34 %, schlechte 30–63 %;
// Grenze 31 %. Nicht erkannt werden strukturlose Flächen (Nacht, Rauch) — ein eigener Fehlertyp.
//
// ── WARUM NUR DIAGNOSE, KEINE AUTOMATIK ──────────────────────────────────────
// Die bestätigte Korrektur senkt die Kennzahl bei ALLEN Bildern — auch den guten. Die Kennzahl
// belohnt gleichmäßig verteilte Gravur, und genau die wurde am Blech als „silbrig" verworfen.
// Deshalb MESSEN und melden, nicht eingreifen.
// [EN] Derived from workpiece evaluations: no simple image metric (brightness, surface ratio,
// [EN] variance) separated good from bad. What distinguishes is a COMPARISON between source and result: a
// [EN] region that has detail in SOURCE image and is flat in ENGRAVING. (Unengraved alone is not
// [EN] bad — dark hair should stay black.) Good lighters 4-34%, bad 30-63%;
// [EN] threshold 31%. Textureless areas (night, smoke) not detected — separate error category.
//
// [EN] ── WHY DIAGNOSTIC ONLY, NO AUTOMATION ──────────────────────────────────
// [EN] Verified correction lowers metric on ALL images — including good ones. Metric
// [EN] rewards uniformly distributed engraving, exactly what was rejected on sheet metal as "silvery".
// [EN] Therefore MEASURE and report, do not intervene.
const _ZON_PX = 40;            // Zonenkante ≈ 2 mm bei 500 DPI
// [EN] zone edge ≈ 2 mm at 500 DPI
const _ZON_DETAIL = 18;        // Grauwert-Streuung, ab der eine Zone „Zeichnung" hat
// [EN] grayscale standard deviation above which a zone has "detail"
const _ZON_TOT = 0.05, _ZON_VOLL = 0.55;
// Streuung je Zone auf dem GRAUBILD (vor allen Tonwertstufen) — muss vor ihnen gerufen werden.
// [EN] Standard deviation per zone on GRAYSCALE image (before all tonal stages) — must be called prior to them.
function _zonenDetail(data, w, h, rects) {
  const out = [];
  for (const g of _maskRegionsInner(w, h, rects)) {
    const zx = Math.floor((g.x1 - g.x0) / _ZON_PX), zy = Math.floor((g.y1 - g.y0) / _ZON_PX);
    for (let zj = 0; zj < zy; zj++) for (let zi = 0; zi < zx; zi++) {
      const x0 = g.x0 + zi * _ZON_PX, y0 = g.y0 + zj * _ZON_PX;
      let s = 0, s2 = 0, n = 0;
      for (let y = y0; y < y0 + _ZON_PX; y++) {
        const row = y * w;
        for (let x = x0; x < x0 + _ZON_PX; x++) { const v = data[(row + x) * 4]; s += v; s2 += v * v; n++; }
      }
      const mi = s / n;
      out.push({ x0, y0, streu: Math.sqrt(Math.max(0, s2 / n - mi * mi)) });
    }
  }
  return out;
}
// Anteil der Zonen mit Zeichnung, die im FERTIGEN Raster tot oder zugelaufen sind.
// [EN] Proportion of zones with detail that became dead or plugged in FINISHED raster.
function _zeichnungVerloren(data, w, zonen) {
  if (!zonen.length) return null;
  let verloren = 0, mitDetail = 0;
  for (const z of zonen) {
    if (z.streu <= _ZON_DETAIL) continue;
    mitDetail++;
    const d = _graviertAnteil(data, w, [{ x0: z.x0, y0: z.y0, x1: z.x0 + _ZON_PX, y1: z.y0 + _ZON_PX }]);
    if (d < _ZON_TOT || d > _ZON_VOLL) verloren++;
  }
  return { anteil: verloren / zonen.length, vonDetail: mitDetail ? verloren / mitDetail : 0,
           detailZonen: mitDetail, zonen: zonen.length };
}

// ── Gesichter finden: YuNet (OpenCV Zoo, MIT) — nur Ein- und Ausgabe ─────────
// [EN] ── Face detection: YuNet (OpenCV Zoo, MIT) — input and output only ─────
// An Kundenfotos fand YuNet 83 % der Gesichter (MediaPipe 49 %); SCRFD fand mehr, seine Gewichte sind
// aber nur nicht-kommerziell frei. Das Modell selbst läuft im Browser über onnxruntime-web
// (public/vendor/onnxruntime, vendor/yunet); hier steht nur die Mathematik drumherum, damit Node genau
// dasselbe rechnet.
// [EN] On customer photos YuNet found 83% of faces (MediaPipe 49%); SCRFD found more, but its weights
// [EN] are restricted to non-commercial use. Model itself runs in browser via onnxruntime-web
// [EN] (public/vendor/onnxruntime, vendor/yunet); here is just supporting math so Node calculates
// [EN] identically.
const _YN_IN = 640;          // feste Eingangsgröße des Modells (Fassung 2023mar)
// [EN] fixed model input size (version 2023mar)
const _YN_SCHWELLE = 0.6;    // OpenCV-Standard 0,9 fand an Kundenfotos nur gut die Hälfte der Gesichter
// [EN] OpenCV default 0.9 found only barely half the faces in customer photos
const _YN_NMS = 0.3;
const _YN_MIN_PX = 12;       // kleinere Kästen sind fast immer Fehltreffer (Knöpfe, Muster)
// [EN] smaller boxes are almost always false positives (buttons, patterns)

// RGBA-Ausschnitt im Uhrzeigersinn um `grad` (0/90/180/270) drehen. Ein Feld mit Drehung −90 (F02 V7)
// liegt im Canvas quer — YuNet findet fast nur aufrechte Gesichter, also erst zurückdrehen.
// [EN] Rotate RGBA crop clockwise by `grad` (0/90/180/270). A slot rotated -90 (F02 V7)
// lies sideways in canvas — YuNet only detects upright faces reliably, so rotate back first.
function _drehenRGBA(src, w, h, grad) {
  if (!grad) return { d: src, w, h };
  const q = grad === 180, nw = q ? w : h, nh = q ? h : w, d = new Uint8ClampedArray(nw * nh * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const nx = grad === 90 ? h - 1 - y : grad === 180 ? w - 1 - x : y;
    const ny = grad === 90 ? x : grad === 180 ? h - 1 - y : w - 1 - x;
    const i = (y * w + x) * 4, j = (ny * nw + nx) * 4;
    d[j] = src[i]; d[j + 1] = src[i + 1]; d[j + 2] = src[i + 2]; d[j + 3] = 255;
  }
  return { d, w: nw, h: nh };
}
// Kasten aus dem gedrehten Bild zurück ins ungedrehte (w, h = Maße VOR dem Drehen).
// [EN] Map bounding box from rotated image back to unrotated (w, h = dimensions BEFORE rotation).
function _kastenZurueck(b, w, h, grad) {
  if (!grad) return b;
  const pt = (x, y) => grad === 90 ? [y, h - x] : grad === 180 ? [w - x, h - y] : [w - y, x];
  const a = pt(b.x0, b.y0), c = pt(b.x1, b.y1);
  return { x0: Math.min(a[0], c[0]), y0: Math.min(a[1], c[1]), x1: Math.max(a[0], c[0]), y1: Math.max(a[1], c[1]), p: b.p };
}
// Eingang wie cv::dnn::blobFromImage ohne Skalierung: BGR 0…255, oben links eingepasst, Rest 0.
// [EN] Input like cv::dnn::blobFromImage without scaling: BGR 0..255, fitted top-left, remainder 0.
function _yunetEingang(rgba, w, h) {
  const f = Math.min(_YN_IN / w, _YN_IN / h), nw = Math.max(1, Math.round(w * f)), nh = Math.max(1, Math.round(h * f));
  const t = new Float32Array(3 * _YN_IN * _YN_IN), P = _YN_IN * _YN_IN;
  // Flächenmittel beim Verkleinern (Kundenfotos sind oft 4–6× größer als 640)
  // [EN] Area average on downscaling (customer photos are often 4-6x larger than 640)
  for (let y = 0; y < nh; y++) {
    const sy0 = Math.floor(y / f), sy1 = Math.max(sy0 + 1, Math.min(h, Math.floor((y + 1) / f)));
    for (let x = 0; x < nw; x++) {
      const sx0 = Math.floor(x / f), sx1 = Math.max(sx0 + 1, Math.min(w, Math.floor((x + 1) / f)));
      let r = 0, g = 0, b = 0, n = 0;
      for (let yy = sy0; yy < sy1; yy++) for (let xx = sx0; xx < sx1; xx++) { const i = (yy * w + xx) * 4; r += rgba[i]; g += rgba[i + 1]; b += rgba[i + 2]; n++; }
      const o = y * _YN_IN + x; t[o] = b / n; t[P + o] = g / n; t[2 * P + o] = r / n;
    }
  }
  return { tensor: t, f };
}
// Ausgabe wie cv::FaceDetectorYN: score = √(cls·obj), Mitte = (Zelle + d)·Schritt, Größe = e^d·Schritt.
// `out` = { cls_8: Float32Array, …, bbox_32 }. Kästen in Pixeln des Bildes VOR dem Einpassen.
// [EN] Output like cv::FaceDetectorYN: score = √(cls·obj), center = (cell + d)·step, size = e^d·step.
// [EN] `out` = { cls_8: Float32Array, ..., bbox_32 }. Bounding boxes in pixels of image BEFORE fitting.
function _yunetAuswerten(out, f, schwelle = _YN_SCHWELLE) {
  const roh = [];
  for (const st of [8, 16, 32]) {
    const cls = out['cls_' + st], obj = out['obj_' + st], bb = out['bbox_' + st], n = _YN_IN / st;
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) {
      const i = r * n + c, k = v => Math.min(1, Math.max(0, v)), p = Math.sqrt(k(cls[i]) * k(obj[i]));
      if (p < schwelle) continue;
      const cx = (c + bb[i * 4]) * st, cy = (r + bb[i * 4 + 1]) * st, bw = Math.exp(bb[i * 4 + 2]) * st, bh = Math.exp(bb[i * 4 + 3]) * st;
      roh.push({ x0: (cx - bw / 2) / f, y0: (cy - bh / 2) / f, x1: (cx + bw / 2) / f, y1: (cy + bh / 2) / f, p });
    }
  }
  roh.sort((a, b) => b.p - a.p);
  const iou = (a, b) => { const ix = Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0)), iy = Math.max(0, Math.min(a.y1, b.y1) - Math.max(a.y0, b.y0)), I = ix * iy;
                          return I / ((a.x1 - a.x0) * (a.y1 - a.y0) + (b.x1 - b.x0) * (b.y1 - b.y0) - I); };
  const keep = [];
  for (const b of roh) if (b.x1 - b.x0 >= _YN_MIN_PX && keep.every(k => iou(k, b) < _YN_NMS)) keep.push(b);
  return keep;
}

// ── Gesichts-Automatik ───────────────────────────────────────────────────────
// [EN] ── Face automation ─────────────────────────────────────────────────────
// Die Haut ist meist die hellste Stelle und bekam oft über 30 % Gravur — ab da verliert das Gesicht
// die Zeichnung; bei Gegenlicht umgekehrt fast nichts. Die Dichte-Regelung hält nur die Gesamtfläche.
// Hier bekommt jedes Gesicht einen eigenen Gamma-Faktor in einer weich auslaufenden Ellipse, bis die
// Gravur im Gesichtskern `gesichtZiel` trifft — gemessen wie bei der Dichte-Regelung am fertig
// gerasterten Ausschnitt (_restPipeline). Läuft NACH der Dichte-Regelung, sonst verschöbe die das
// Gesicht wieder. Die Gesamtfläche weicht dadurch ab — mit dem langen Übergang (s. _GES_AUSSEN) bei großen
// Gesichtern deutlich (Poster 21 → 13 %); die Warnung „Dichte verfehlt" misst deshalb vorher (_dichteSchaetzen).
// [EN] Skin is usually the brightest part and often received over 30% engraving — beyond that the face
// [EN] loses detail; with backlighting inversely almost nothing. Density regulation only maintains total area.
// [EN] Here each face receives its own gamma factor within a smoothly fading ellipse until
// [EN] engraving in face core hits `gesichtZiel` — measured as in density regulation on the finished
// [EN] dithered crop (_restPipeline). Runs AFTER density regulation, otherwise that would shift the
// [EN] face again. Total area deviates as a result — substantially with the long transition (see _GES_AUSSEN) for large
// [EN] faces (poster 21 -> 13%); warning "density missed" therefore measures beforehand (_dichteSchaetzen).
const _GES_F_MIN = 0.4, _GES_F_MAX = 2.5;   // lieber das Ziel verfehlen als das Gesicht verbiegen
// [EN] better to miss target than distort face
const _GES_SCHRITTE = 10;
const _GES_MIN_PX = 24;                      // kleinere Gesichter (< 1,2 mm) lässt die Automatik in Ruhe
// [EN] smaller faces (< 1.2 mm) left alone by automation
// Geometrie eines Gesichts: Ellipse um den Kasten (YuNet fasst Brauen bis Kinn, Stirn liegt darüber),
// voller Eingriff bis d = _GES_INNEN, weich auslaufend bis _GES_AUSSEN; Messkern = Wangen, Nase, Augen.
// Der Übergang ist bewusst lang (ein kurzer ließ das Gesicht wie einen aufgesetzten Fleck aussehen), mit
// Smootherstep (an beiden Enden ohne Knick UND ohne Krümmungssprung); die Kurve selbst wird in der Stärke
// (Exponent) überblendet statt im Tonwert. Eine Beschränkung auf Hauttöne machte das Gesicht flach — verworfen.
// [EN] Face geometry: ellipse around bounding box (YuNet captures brows to chin, forehead above),
// [EN] full intervention up to d = _GES_INNEN, smoothly tapering to _GES_AUSSEN; measurement core = cheeks, nose, eyes.
// [EN] Transition is deliberately long (short one looked like an artificial sticker/blot), using
// [EN] smootherstep (no kinks AND no curvature discontinuity at both ends); curve itself is blended in
// [EN] strength (exponent) rather than tonal value. Restricting to skin tones made faces flat — rejected.
const _GES_INNEN = 0.8, _GES_AUSSEN = 2.6, _GES_STUFEN = 48;
// `feld` = Fotofläche des Gesichts (s. _maskRegions): der Ausschnitt greift nie ins Nachbarfeld.
// [EN] `feld` = photo region of face (see _maskRegions): crop never encroaches on neighboring slot.
function _gesichtGeometrie(b, w, h, feld) {
  const bw = b.x1 - b.x0, bh = b.y1 - b.y0, cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2 - 0.05 * bh;
  const rx = 0.55 * bw, ry = 0.6 * bh, f = feld || { x0: 0, y0: 0, x1: w, y1: h };
  const A = _GES_AUSSEN;
  const k = { x0: Math.max(f.x0, Math.floor(cx - A * rx)), y0: Math.max(f.y0, Math.floor(cy - A * ry)),
              x1: Math.min(f.x1, Math.ceil(cx + A * rx)), y1: Math.min(f.y1, Math.ceil(cy + A * ry)) };
  const m = { x0: Math.round(cx - 0.32 * bw), y0: Math.round(cy - 0.30 * bh), x1: Math.round(cx + 0.32 * bw), y1: Math.round(cy + 0.35 * bh) };
  return { cx, cy, rx, ry, k, m };
}
// Normierter Ellipsen-Abstand (1 = Rand der Gesichts-Ellipse) und das Maskengewicht dazu.
// [EN] Normalized ellipse distance (1 = boundary of face ellipse) and corresponding mask weight.
function _abstandBei(g, x, y) {
  const dx = (x + 0.5 - g.cx) / g.rx, dy = (y + 0.5 - g.cy) / g.ry;
  return Math.sqrt(dx * dx + dy * dy);
}
function _maskeAus(d) {
  const t = d <= _GES_INNEN ? 1 : d >= _GES_AUSSEN ? 0 : (_GES_AUSSEN - d) / (_GES_AUSSEN - _GES_INNEN);
  return t * t * t * (t * (6 * t - 15) + 10);   // Smootherstep
  // [EN] Smootherstep
}
function _gesichtMaske(g) {
  const cw = g.k.x1 - g.k.x0, ch = g.k.y1 - g.k.y0, m = new Float32Array(cw * ch);
  for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) m[y * cw + x] = _maskeAus(_abstandBei(g, g.k.x0 + x, g.k.y0 + y));
  return m;
}
function _ausschnitt(data, w, k) {
  const cw = k.x1 - k.x0, ch = k.y1 - k.y0, o = new Uint8ClampedArray(cw * ch * 4);
  for (let y = 0; y < ch; y++) o.set(data.subarray(((k.y0 + y) * w + k.x0) * 4, ((k.y0 + y) * w + k.x1) * 4), y * cw * 4);
  return o;
}
// Gamma `f` mit Gewicht `maske` (0…1) auf den Ausschnitt: je Pixel die Kurve f^Gewicht (in _GES_STUFEN
// Stufen vorberechnet) — der Übergang läuft damit durch die Stärke der Kurve, nicht als Mischung zweier
// Tonwerte. Ergebnis nach `ziel` (Ausschnitt-Koordinaten).
// [EN] Gamma `f` with weight `maske` (0..1) on crop: per pixel curve f^weight (precalculated
// [EN] in _GES_STUFEN steps) — transition runs through curve strength, not as blend of two
// [EN] tonal values. Result to `ziel` (crop coordinates).
function _mischen(quelle, maske, f, ziel) {
  const luts = [];
  for (let q = 0; q <= _GES_STUFEN; q++) luts.push(_gammaLUT(Math.pow(f, q / _GES_STUFEN)));
  for (let p = 0, i = 0; p < maske.length; p++, i += 4) {
    const n = luts[Math.round(maske[p] * _GES_STUFEN)][quelle[i]];
    ziel[i] = ziel[i + 1] = ziel[i + 2] = n;
  }
}
// Fotofläche, in der die Mitte des Gesichts liegt (sonst die erste) — EINE Zuordnung für Schärfen und Anpassen.
// [EN] Photo region containing center of face (fallback: first one) — ONE mapping for sharpening and adjustment.
function _feldVon(b, felder) {
  const cx = (b.x0 + b.x1) / 2, cy = (b.y0 + b.y1) / 2;
  return felder.find(f => cx >= f.x0 && cx < f.x1 && cy >= f.y0 && cy < f.y1) || felder[0];
}
function _gesichterSchaerfen(data, w, h, gesichter, staerke, rects) {
  if (!(staerke > 0)) return;
  const felder = _maskRegions(w, h, rects);
  for (const b of gesichter) {
    const g = _gesichtGeometrie(b, w, h, _feldVon(b, felder)); if (g.k.x1 - g.k.x0 < _GES_MIN_PX || g.k.y1 - g.k.y0 < _GES_MIN_PX) continue;
    const cw = g.k.x1 - g.k.x0, ch = g.k.y1 - g.k.y0, vor = _ausschnitt(data, w, g.k), nach = new Uint8ClampedArray(vor);
    _unsharpMask(nach, cw, ch, staerke);
    const m = _gesichtMaske(g);
    for (let y = 0; y < ch; y++) for (let x = 0; x < cw; x++) {
      const p = y * cw + x, i = p * 4, o = ((g.k.y0 + y) * w + g.k.x0 + x) * 4, v = vor[i] + m[p] * (nach[i] - vor[i]);
      data[o] = data[o + 1] = data[o + 2] = v;
    }
  }
}
// Mehrere Gesichter: Gewicht je Gesicht = weiche Vereinigung aller Masken × Anteil dieses Gesichts.
// Die Vereinigung 1 − Π(1 − M) lässt zwischen zwei Gesichtern weder eine Senke (reine Aufteilung: Kerbe)
// noch einen Grat (Summe: doppelt aufgehellt). Den Anteil bekommt das Gesicht, dem der Punkt näher liegt
// (normierter Abstand, weich über _GES_ANTEIL) — so drückt der Übergang eines großen Gesichts den Kern
// eines kleineren nicht mehr vom Ziel weg (Test 12.10.: 15 → 8 %). Bei EINEM Gesicht: eigene Maske.
// [EN] Multiple faces: weight per face = soft union of all masks * share of this face.
// [EN] Union 1 - ∏(1 - M) leaves neither trough (pure partition: seam) nor ridge (sum: doubly brightened)
// [EN] between two faces. Share assigned to face closer to pixel (normalized distance, soft via _GES_ANTEIL) —
// [EN] so transition of large face no longer shifts core of smaller face off-target (test Oct 12: 15% -> 8%).
// [EN] With ONE face: own mask.
const _GES_ANTEIL = 0.15;
function _gebietMaske(m, g, andere) {
  if (!andere.length) return m;
  const cw = g.k.x1 - g.k.x0;
  for (let p = 0; p < m.length; p++) {
    const mi = m[p];
    if (!mi) continue;
    const x = g.k.x0 + (p % cw), y = g.k.y0 + Math.floor(p / cw), di = _abstandBei(g, x, y);
    let rest = 1 - mi, nenner = mi, beruehrt = false;
    for (const o of andere) {
      const d = _abstandBei(o, x, y), mo = _maskeAus(d);
      if (!mo) continue;
      rest *= 1 - mo; nenner += mo * Math.exp((di - d) / _GES_ANTEIL); beruehrt = true;
    }
    if (beruehrt) m[p] = (1 - rest) * mi / nenner;
  }
  return m;
}
// Ein Gesicht auf das Ziel stellen; Rückgabe { vorher, f } oder null (zu klein).
// [EN] Tune single face to target; returns { vorher, f } or null (too small).
const _gesichtZuKlein = g => g.k.x1 - g.k.x0 < _GES_MIN_PX || g.k.y1 - g.k.y0 < _GES_MIN_PX || g.m.x1 - g.m.x0 < 8 || g.m.y1 - g.m.y0 < 8;
function _gesichtEinstellen(data, w, h, s, g, ziel, andere = []) {
  const cw = g.k.x1 - g.k.x0, ch = g.k.y1 - g.k.y0;
  if (_gesichtZuKlein(g)) return null;
  const vor = _ausschnitt(data, w, g.k), m = _gebietMaske(_gesichtMaske(g), g, andere);
  const mess = [{ x: g.m.x0 - g.k.x0, y: g.m.y0 - g.k.y0, w: g.m.x1 - g.m.x0, h: g.m.y1 - g.m.y0 }];
  const probe = f => { const d = new Uint8ClampedArray(vor); if (Math.abs(f - 1) >= 0.001) _mischen(vor, m, f, d);
                       return _restPipeline(d, cw, ch, s, [{ x: 0, y: 0, w: cw, h: ch }], mess); };
  const vorher = probe(1);
  let f = 1;
  if (Math.abs(vorher - ziel) > 0.01) {
    const pMin = probe(_GES_F_MIN), pMax = probe(_GES_F_MAX);
    // Wirkt die Kurve dort gar nicht (z. B. Gesicht reines Schwarz), nichts verbiegen.
    // [EN] If curve has no effect there (e.g. face pure black), do not distort.
    if (Math.abs(pMax - pMin) < 0.005) return { vorher, f: 1 };
    f = _bisektion(_GES_F_MIN, _GES_F_MAX, _GES_SCHRITTE, pMax > pMin, probe, ziel);
    // Nur übernehmen, was näher ans Ziel führt — sonst bliebe nur die Nebenwirkung im Umfeld.
    // [EN] Only accept if bringing result closer to target — otherwise only peripheral side effect remains.
    if (Math.abs(probe(f) - ziel) >= Math.abs(vorher - ziel) - 0.005) return { vorher, f: 1 };
    const neu = new Uint8ClampedArray(vor);
    _mischen(vor, m, f, neu);
    for (let y = 0; y < ch; y++) data.set(neu.subarray(y * cw * 4, (y + 1) * cw * 4), ((g.k.y0 + y) * w + g.k.x0) * 4);
  }
  return { vorher, f };
}
// Zwei Durchgänge: überlappen sich zwei Gesichter (Kuss, Wange an Wange), verschiebt das zweite den
// Rand des ersten — der zweite Durchgang stellt nach, wer danach mehr als 1,5 Punkte daneben liegt.
// [EN] Two passes: if two faces overlap (kiss, cheek-to-cheek), second shifts border
// [EN] of first — second pass readjusts whichever is off by more than 1.5 points.
function _gesichterAnpassen(data, w, h, s, gesichter, rects) {
  const ziel = s.gesichtZiel, info = [];
  if (!(ziel > 0 && ziel < 1)) return info;
  const felder = _maskRegions(w, h, rects);
  const liste = gesichter.map(b => ({ b, g: _gesichtGeometrie(b, w, h, _feldVon(b, felder)) }));
  // Zu kleine Gesichter stellt niemand ein — sie bekommen kein Gebiet, sonst bliebe dort ein Loch im Übergang.
  // [EN] Too small faces are not tuned — they get no territory, otherwise leaving a gap in transition.
  const andereVon = e => liste.filter(o => o !== e && !_gesichtZuKlein(o.g)).map(o => o.g);
  for (const e of liste) {
    const r = _gesichtEinstellen(data, w, h, s, e.g, ziel, andereVon(e));
    if (r) { e.r = r; info.push(e.info = { x0: e.b.x0, y0: e.b.y0, x1: e.b.x1, y1: e.b.y1, vorher: r.vorher, faktor: Math.round(r.f * 1000) / 1000 }); }
  }
  if (liste.filter(e => e.r).length > 1) {
    for (const e of liste) {
      if (!e.r) continue;
      const r2 = _gesichtEinstellen(data, w, h, s, e.g, ziel, andereVon(e));   // misst neu; unter 1 Punkt Abweichung tut es nichts
      // [EN] remeasures; below 1 point deviation does nothing
      if (r2 && r2.f !== 1) e.info.faktor = Math.round(e.r.f * r2.f * 1000) / 1000;
    }
  }
  return info;
}
// Gesamtfläche, wie sie VOR den Gesichtern herauskäme (kleine Kopie wie in _dichteRegeln). Mit der
// Gesichts-Automatik verschiebt sich die Gesamtfläche gewollt — die Warnung „Dichte-Regelung verfehlt"
// soll trotzdem nur kommen, wenn die REGELUNG ihr Ziel nicht schafft.
// [EN] Total area as it would emerge BEFORE faces (small copy as in _dichteRegeln). With
// [EN] face automation total area intentionally shifts — warning "density regulation missed"
// [EN] should still only fire if REGULATION fails to achieve its target.
function _dichteSchaetzen(data, w, h, rects, s) {
  const k = _verkleinern(data, w, h, _REGEL_MAX_PX);
  return _restPipeline(new Uint8ClampedArray(k.data), k.w, k.h, s, _rectsKlein(rects, k.faktor), null);
}

// ── Die Laser-Pipeline ───────────────────────────────────────────────────────
// [EN] ── The Laser Pipeline ──────────────────────────────────────────────────
// EINZIGE Quelle für Vorschau und Export. Reihenfolge ist bewusst gewählt:
//  1. Graustufe zuerst → alle folgenden Schritte sind einkanalig und vorhersagbar.
//  2. Auto-Kontrast vor dem manuellen Kontrast → der Slider bleibt ein relatives Nachjustieren.
//  3. Gamma/Kontrast vor dem Schärfen — sonst verstärkt das Schärfen angehobenes Rauschen.
//  4. Dithering als LETZTE verlustbehaftete Stufe.
//  5. Invertieren ganz zuletzt auf dem 1-Bit-Ergebnis: exakter Tausch, und Schwellenwert/Gamma
//     behalten ihre Bedeutung, egal ob invertiert wird.
// WICHTIG: auf dem Canvas in ZIELAUFLÖSUNG laufen lassen — dithern und danach skalieren zerstört das
// Punktmuster (s. _buildLaserCanvas in layout-editor.html).
// rects = Fotoflächen in Canvas-Pixeln (null → ganzes Bild). Je Fläche: Auto-Kontrast, Auto-Gamma,
// lokaler Kontrast, Kanten, Bereichsausgleich (volle Fotofläche), Schatten/Lichter, Tonwert-Begrenzung,
// Sprenkel-Schnitt (eingerücktes Fenster). Gamma, Kontrast, Schärfen, Tonwert-Ausgleich und Rasterung
// laufen über den ganzen Canvas — Weiß bleibt dabei Weiß.
// [EN] SINGLE source of truth for preview and export. Order of operations is deliberate:
// [EN]  1. Grayscale first -> all subsequent operations are single-channel and predictable.
// [EN]  2. Auto-contrast before manual contrast -> slider remains a relative fine-tuning tool.
// [EN]  3. Gamma/contrast before sharpening — otherwise sharpening amplifies amplified noise.
// [EN]  4. Dithering as the FINAL lossy stage.
// [EN]  5. Inversion dead last on 1-bit result: exact swap, and threshold/gamma retain meaning regardless of inversion.
// [EN] IMPORTANT: run on canvas at TARGET RESOLUTION — dithering followed by scaling destroys dot pattern (see _buildLaserCanvas in layout-editor.html).
// [EN] rects = photo areas in canvas pixels (null -> whole image). Per area: auto-levels, auto-gamma,
// [EN] local contrast, edges, region balance (full photo area), shadows/highlights, tonal limits,
// [EN] speckle dropout (indented window). Gamma, contrast, sharpening, dot gain, and dithering
// [EN] execute across full canvas — white stays white.
function applyLaserPipeline(data, w, h, raw, rects, extra) {
  let s = _laserSettings(raw);
  // Hautmaske VOR der Graustufe — danach ist die Farbe unwiederbringlich weg (s. _motivZonen).
  // [EN] Skin mask BEFORE grayscale conversion — afterwards color is irretrievably lost (see _motivZonen).
  const _haut = s.active && s.autoMotiv ? _hautMaske(data, w, h) : null;
  // Maske der Hautkurve — dieselbe; nur einmal rechnen, wenn beide laufen.
  // [EN] Mask for skin curve — same mask; compute only once if both run.
  const _hautK = s.active && s.hautKurve > 0 ? (_haut || _hautMaske(data, w, h)) : null;
  // S/W je Bereich? Ebenfalls VOR der Graustufe. Gebraucht von der Logo-Automatik (nur
  // farbige Bilder) und vom Bereichsausgleich (S/W-Fotos schon ab der Warngrenze).
  // [EN] B/W per region? Also BEFORE grayscale. Required by logo automation (color
  // [EN] images only) and by region balance (B/W photos from warning threshold).
  const _swBereiche = (s.active && ((s.grafikAuto && s.logoAuto) || s.regionAusgleich > 0))
    ? _maskRegionsInner(w, h, rects).map(g => _istSchwarzWeiss(data, w, g)) : null;
  const _sw = !!(s.regionAusgleich > 0 && s.active && rects && rects.length === 1 && _swBereiche && _swBereiche[0]);
  // Grafik mit Verläufen (s. _istWeicheGrafik) — auf dem FARBBILD, also vor der Graustufe.
  // [EN] Graphic with gradients (see _istWeicheGrafik) — on COLOR image, before grayscale.
  const _weichKandidat = !!(s.active && (s.alsGrafik
    || (s.grafikWeich && s.grafikAuto && _alleWeichGrafik(data, w, h, rects))));
  _toGray(data);
  // Grafik-Weiche direkt nach der Graustufe, VOR allem anderen: die Erkennung muss das rohe Bild sehen
  // (der Auto-Kontrast ließe ein Logo mit Grauschleier wie ein Foto aussehen).
  // Zonen-Streuung ebenfalls am ROHEN Graubild festhalten — die Kennzahl unten braucht dasselbe Bild.
  // [EN] Graphic detection directly after grayscale, BEFORE everything else: detector needs raw image
  // [EN] (auto-contrast would make a logo with haze look like a photo).
  // [EN] Zone variance also recorded on RAW grayscale image — diagnostic metric below requires same image.
  const _zonen = s.active ? _zonenDetail(data, w, h, rects) : [];
  // Kandidat für den Bereichsausgleich (s. _raBereich) — ebenfalls am rohen Graubild.
  // [EN] Candidate for region balance (see _raBereich) — also on raw grayscale image.
  const _raG = (s.regionAusgleich > 0 && s.active) ? _raBereich(data, w, h, rects) : null;
  // `alsLogo` (von Hand) geht vor: sonst schaltete ein zweifarbiges Motiv still auf die
  // Grafik-Einstellung, obwohl ausdrücklich Logo verlangt war.
  // [EN] `alsLogo` (manual) takes precedence: otherwise a two-color subject would silently switch to
  // [EN] graphic settings even though logo was explicitly requested.
  let grafik = false;
  if (!s.alsLogo && !s.alsGrafik && s.active && (s.grafikErzwingen || (s.grafikAuto && _alleGrafik(data, w, h, rects)))) {
    grafik = true;
    s = _grafikEinstellung(s);
  }
  // Bunte Logos (s. _istLogoAufDunkel) — nur, wenn es keine Grafik ist. Automatisch nur mit
  // `logoAuto` UND `grafikAuto`, von Hand über `alsLogo`.
  // [EN] Colorful logos (see _istLogoAufDunkel) — only if not a graphic. Automatically only with
  // [EN] `logoAuto` AND `grafikAuto`, manually via `alsLogo`.
  let logo = false;
  if (!grafik && !s.alsGrafik && s.active && (s.alsLogo || (s.logoAuto && s.grafikAuto && _alleLogos(data, w, h, rects, _swBereiche)))) {
    logo = true;
    s = _logoEinstellung(s);
  }
  // Grafik mit Verläufen — nur, wenn weder Grafik noch Logo gegriffen hat (deren Behandlung ist
  // am Werkstück bestätigt und bleibt, wie sie ist).
  // [EN] Graphic with gradients — only if neither graphic nor logo triggered (their handling
  // [EN] is verified on workpiece and remains as-is).
  let weich = false;
  if (!grafik && !logo && _weichKandidat) {
    weich = true;
    s = _weicheGrafikEinstellung(s);
  }
  // Auto-Tonwertkorrektur pro Foto (s. _autoLevels). Danach wäre manueller Kontrast nur noch ein
  // Beschneiden (der Umfang 0–255 ist schon ausgeschöpft) — darum bei aktivem Auto-Kontrast keiner mehr.
  // CLAHE (lokal) ersetzt den Auto-Kontrast, wenn eingestellt. Grafik/Logo/Verlauf setzen clahe 0 (s. dort).
  // [EN] Auto levels per photo (see _autoLevels). After this manual contrast would only clip
  // [EN] (range 0-255 is already fully used) — hence none applied when auto-contrast is active.
  // [EN] CLAHE (local) replaces auto-contrast if configured. Graphic/logo/gradient set clahe 0 (see there).
  if (s.clahe > 0) _clahe(data, w, h, rects, s.clahe, s.claheKacheln || 8);
  else if (s.autoContrast) _autoLevels(data, w, h, rects);
  // Hautkurve NACH dem Auto-Kontrast (sie verteilt den schon gestreckten Umfang neu) und VOR
  // dem Festhalten für den Bereichsausgleich — beide Durchläufe sollen sie sehen.
  // [EN] Skin curve AFTER auto-contrast (redistributes already expanded range) and BEFORE
  // [EN] snapshotting for region balance — both passes need to see it.
  const haut = (!grafik && !logo && !weich) ? _hautKurve(data, w, h, rects, _hautK, s.hautKurve, s.hautKurveLokal) : null;
  // Bereiche einzeln belichten (s. _regionAusgleichRegion): Stand nach dem Auto-Kontrast festhalten. Der
  // Rest läuft erst unverändert; nur wenn der Platz danach Zeichnung verliert, läuft er ein zweites Mal
  // von hier aus — mit ausgeglichenen Bereichen.
  // `regionImmer`: Grundausgleich bei JEDEM Foto (dunkle Gesichter vor hellem Grund erfasste die
  // Warn-Kennzahl nicht). Preis: etwas weniger Kontrastumfang, helle Flächen werden grauer. S/W-Fotos
  // mit der milden Stärke. Die Warn-Prüfung läuft weiter am UNAUSGEGLICHENEN Bild — wer bisher den
  // vollen Ausgleich bekam, bekommt ihn weiter.
  // [EN] Expose regions individually (see _regionAusgleichRegion): snapshot state after auto-contrast.
  // [EN] Pipeline initially runs unchanged; only if slot subsequently loses detail does it re-run from
  // [EN] here — with balanced regions.
  // [EN] `regionImmer`: baseline balance on EVERY photo (dark faces against bright background weren't detected
  // [EN] by warning metric). Cost: slight reduction in contrast range, bright areas turn grayer. B/W photos
  // [EN] with mild strength. Warning check still evaluates UNBALANCED image — photos qualifying for full balance continue to get it.
  const _raBasis = s.regionImmer === true ? s.regionAusgleich : (Number(s.regionImmer) || 0);
  const _raImmer = !!(_raBasis > 0 && _raG && !grafik && !logo && !weich);
  const _raVorher = (_raG && !grafik && !logo && !weich) ? new Uint8ClampedArray(data) : null;
  // Gesichts-Automatik nur für Fotos (Grafik und Logo behalten ihre Tonwerte) und nur mit Kästen vom Editor.
  // [EN] Face automation only for photos (graphic and logo retain their tone curves) and only with boxes from editor.
  const _ges = (s.gesichtAuto && s.active && !grafik && !logo && !weich && extra && Array.isArray(extra.gesichter))
    ? extra.gesichter : [];
  const rest = (data) => {
    // Lokaler Kontrast NACH dem Auto-Kontrast (auf dem gestreckten Foto) und VOR dem Auto-Gamma (sonst
    // zielte es auf eine Dichte, die gleich wieder verschoben wird). Schatten/Lichter davor: erst die
    // Tonwerte an die richtige Stelle, dann die örtliche Zeichnung darauf.
    // [EN] Local contrast AFTER auto-contrast (on stretched photo) and BEFORE auto-gamma (otherwise
    // [EN] targets density that would be shifted immediately). Shadows/highlights before: first place
    // [EN] tonal values at right locations, then apply local detail.
    _lichterSchatten(data, w, h, rects, s.shadows, s.highlights);
    _lokalerKontrast(data, w, h, rects, s.localContrast);
    // Kanten NACH dem lokalen Kontrast: der hebt großflächige Unterschiede, die
    // Kantenverstärkung setzt die feinen Linien darauf. Umgekehrt zöge der lokale Kontrast
    // die frisch gesetzten Konturen wieder breit.
    // Konturen (s. _konturenVertiefen) ersetzen die Sobel-Kanten, nie beide zugleich.
    // [EN] Edges AFTER local contrast: it lifts broad differences, edge
    // [EN] boost places fine strokes on top. In reverse, local contrast would blur
    // [EN] newly sharpened contours.
    // [EN] Contours (see _konturenVertiefen) replace Sobel edges, never both at once.
    if (s.konturen > 0) _konturenVertiefen(data, w, h, rects, s.konturen, s.konturRadius);
    else _kantenVerstaerken(data, w, h, rects, s.edgeBoost);
    // Auto-Gamma NACH dem Auto-Kontrast: gemessen wird das bereits gestreckte Foto.
    // [EN] Auto-gamma AFTER auto-contrast: measured on already stretched photo.
    let gammas = null;
    if (s.autoGamma) gammas = _applyAutoGamma(data, w, h, rects, s.autoGammaTarget, s.gamma, s.invert);
    else _applyGamma(data, s.gamma);
    applyContrast(data, s.autoContrast ? 0 : s.contrast);
    if (s.sharpen > 0) {
      if (s.schaerfRadius > 1) _unsharpMaskR(data, w, h, s.sharpen, s.schaerfRadius);
      else _unsharpMask(data, w, h, s.sharpen);
    }
    if (_ges.length) _gesichterSchaerfen(data, w, h, _ges, s.gesichtSchaerfen, rects);
    // Tonwert-Ausgleich und -Begrenzung als LETZTE Tonwert-Stufen vor der Rasterung: sie korrigieren, was
    // der Laser physisch aus dem Raster macht (vor dem Schärfen zöge die Unsharp-Mask sie an Kanten wieder
    // weg). Erst Ausgleich, dann Begrenzung — die Grenzen gelten für das, was wirklich als Raster rausgeht.
    // s.invert wird durchgereicht, NICHT vorgezogen: beide rechnen in „graviert/nicht graviert" (s. _inkOf).
    // Dichte-Regelung ganz zum Schluss der Tonwertstufen: sie misst am fertig gerasterten Ergebnis und
    // stellt, was nach ihr kommt, auf einer kleinen Kopie selbst nach.
    // [EN] Dot gain and limits as FINAL tonal stages before dithering: they correct what
    // [EN] laser physically does to raster (prior to sharpening, unsharp mask would pull them off edges).
    // [EN] Dot gain first, then limits — limits apply to what actually exits to dithering.
    // [EN] s.invert is passed through, NOT moved forward: both calculate in "engraved/unengraved" (see _inkOf).
    // [EN] Density regulation at very end of tonal stages: measures on finished dithered result
    // [EN] and simulates following steps on small copy itself.
    const geregelt = _dichteRegeln(data, w, h, rects, s, _zonen,
                                   _haut ? _hautZonen(_haut, w, _zonen) : null);
    const vorGesicht = _ges.length && s.densityTarget > 0 && geregelt != null ? _dichteSchaetzen(data, w, h, rects, s) : null;
    const gesichter = _ges.length ? _gesichterAnpassen(data, w, h, s, _ges, rects) : null;
    _tonwerteUndRaster(data, w, h, s, rects);
    // Diagnose NACH dem Invertieren: `_zeichnungVerloren` zählt dunkle Punkte als graviert, und was
    // graviert wird, steht erst nach dem Tausch fest (vorher kamen invertiert 90–99 % heraus). Gleiche
    // Reihenfolge wie die Flächenmessung in _restPipeline.
    // [EN] Diagnostics AFTER inversion: `_zeichnungVerloren` counts dark pixels as engraved, and what
    // [EN] is engraved is determined only after swap (previously 90-99% resulted with inversion). Same
    // [EN] order as area measurement in _restPipeline.
    const verloren = (s.active && !grafik && !logo && !weich) ? _zeichnungVerloren(data, w, _zonen) : null;
    // Was die Regelung TATSÄCHLICH erreicht hat, am fertigen Raster gemessen. Sie läuft
    // still an ihren Anschlag, wenn ein Bild die geforderte Fläche gar nicht hergeben kann
    // — am 21.09.2026 bei einem Logo zwölf Schritte lang in die Obergrenze 4,0, ohne dass
    // es irgendwo aufgefallen wäre. Gemessen statt geschätzt: das Ergebnis liegt hier vor.
    // [EN] What regulation ACTUALLY achieved, measured on finished raster. It silently hits its
    // [EN] stop if an image cannot provide required coverage — on 2026-09-21 on a logo twelve steps
    // [EN] into upper limit 4.0 without being noticed anywhere. Measured instead of estimated: result is available here.
    let dichte = null;
    if (s.densityTarget > 0 && geregelt != null) {
      const ist = _graviertAnteil(data, w, _maskRegionsInner(w, h, rects));
      // Gebremst = gewollt verfehlt (s. densityFaktorMin) — keine Warnung in der Belegungsliste.
      // [EN] Braked = deliberately missed target (see densityFaktorMin) — no warning in slot allocation list.
      const [bremseU, bremseO] = _dichteBremse(s);
      const gebremst = !!((bremseU && geregelt <= bremseU + 0.0015) || (bremseO && geregelt >= bremseO - 0.0015));
      dichte = { ziel: s.densityTarget, ist, gebremst,
                 verfehlt: !gebremst && Math.abs((vorGesicht ?? ist) - s.densityTarget) > _DICHTE_TOLERANZ };
    }
    // Gesichter: Gravur im Kern NACH dem Raster nachmessen (Kontrolle der Anpassung)
    // [EN] Faces: remeasure core engraving AFTER dithering (adjustment verification)
    if (gesichter) for (const gi of gesichter) {
      const g = _gesichtGeometrie(gi, w, h, null);
      gi.nachher = _graviertAnteil(data, w, [{ x0: Math.max(0, g.m.x0), y0: Math.max(0, g.m.y0), x1: Math.min(w, g.m.x1), y1: Math.min(h, g.m.y1) }]);
    }
    return { gammas, geregelt, verloren, dichte, gesichter };
  };
  let info = rest(data);
  let region = null;
  // Ein Versuch mit Bereichsausgleich der Stärke `st`: Stand nach dem Auto-Kontrast nehmen,
  // ausgleichen, Rest der Pipeline darauf — EIN Ablauf für Grundstärke und Warnfall (stand
  // vorher dreimal ausgeschrieben). `letzter` = _raVorher selbst verbrauchen statt zu kopieren
  // (spart beim letzten Versuch einen Bildpuffer; der Auto-Export ist OOM-empfindlich).
  // [EN] One attempt with region balance of strength `st`: take state after auto-contrast,
  // [EN] balance, run rest of pipeline on top — ONE procedure for baseline and warning case
  // [EN] (previously written 3 times). `letzter` = consume _raVorher directly instead of copying
  // [EN] (saves an image buffer on final pass; auto-export is OOM-sensitive).
  const ausgleichen = (st, letzter) => {
    const d = letzter ? _raVorher : new Uint8ClampedArray(_raVorher);
    _regionAusgleichRegion(d, w, _raG, st, s.invert, _maskRegions(w, h, rects)[0]);
    return { d, info: rest(d) };
  };
  const swFaktor = _sw ? _RA_SW_MILD : 1;
  const grenze = _sw ? _RA_GRENZE_SW : _RA_GRENZE;
  // Übernommen wird nur, was mindestens _RA_MIN_GEWINN weniger Zeichnung verliert.
  // [EN] Accepted only if losing at least _RA_MIN_GEWINN less detail.
  const besserAls = (a, b) => !!(a.verloren && b.verloren
                                 && a.verloren.vonDetail <= b.verloren.vonDetail - _RA_MIN_GEWINN);
  if (_raImmer) {
    const basis = ausgleichen(_raBasis * swFaktor, false);
    const warn = info.verloren && info.verloren.vonDetail >= grenze;
    const mild = _sw && warn && info.verloren.vonDetail < _RA_GRENZE;
    const stark = s.regionAusgleich * (mild ? _RA_SW_MILD : 1);
    let wahl = basis;
    if (warn && stark > _raBasis * swFaktor + 1e-9) {
      // Gemessen gegen den Grundausgleich, nicht gegen das unausgeglichene Bild.
      // [EN] Measured against baseline balance, not against unbalanced image.
      const probe = ausgleichen(stark, true);
      const besser = besserAls(probe.info, basis.info);
      region = { vorher: info.verloren.vonDetail, nachher: (besser ? probe.info : basis.info).verloren?.vonDetail ?? null,
                 uebernommen: besser, sw: _sw, mild };
      if (besser) wahl = probe;
    }
    data.set(wahl.d); info = wahl.info;
  } else if (_raVorher && info.verloren && info.verloren.vonDetail >= grenze) {
    const mild = _sw && info.verloren.vonDetail < _RA_GRENZE;
    const probe = ausgleichen(s.regionAusgleich * (mild ? _RA_SW_MILD : 1), true);
    const besser = besserAls(probe.info, info);
    region = { vorher: info.verloren.vonDetail, nachher: probe.info.verloren ? probe.info.verloren.vonDetail : null,
               uebernommen: besser, sw: _sw, mild };
    if (besser) { data.set(probe.d); info = probe.info; }
  }
  return { gammas: info.gammas, geregelt: info.geregelt, grafik, logo, weich, verloren: info.verloren,
           dichte: info.dichte, region, haut, ...(info.gesichter ? { gesichter: info.gesichter } : {}) };
}

// ── BMP 1-bit Export (für Ezcad2) ────────────────────────────────────────────
// [EN] ── BMP 1-bit Export (for Ezcad2) ────────────────────────────────────────────
// Nimmt ein fertig gerendertes CANVAS (Aufrufer: _buildBmpBlob). dpi MUSS zur Render-Auflösung passen
// [EN] Takes a fully rendered CANVAS (caller: _buildBmpBlob). dpi MUST match the render resolution
// (_buildLaserCanvas gibt sie zurück, inkl. Reduktion durch _capLaserDpi) — sonst stimmt die physische
// [EN] (_buildLaserCanvas returns it, incl. reduction via _capLaserDpi) — otherwise the physical
// Größe in Ezcad2 nicht.
// [EN] size in Ezcad2 will be incorrect.
function imgTo1BitBMP(c, dpi = 300) {
  const imageData = c.getContext('2d').getImageData(0, 0, c.width, c.height);
  const data = imageData.data;
  const w = c.width, h = c.height;

  // BMP Header für 1-bit Bild
  // [EN] BMP header for 1-bit image
  // Zeilenbreite muss auf 4 Bytes aligned sein
  // [EN] Row width must be 4-byte aligned
  const rowBytes = Math.ceil(w / 8);
  const rowPadded = Math.ceil(rowBytes / 4) * 4;
  const pixelDataSize = rowPadded * h;
  const fileSize = 62 + pixelDataSize; // 14 (file) + 40 (info) + 8 (palette) + pixel data
  // [EN] 14 (file) + 40 (info) + 8 (palette) + pixel data

  const buf = new ArrayBuffer(fileSize);
  const view = new DataView(buf);

  // BMP File Header (14 bytes)
  view.setUint8(0, 0x42); view.setUint8(1, 0x4D); // "BM"
  view.setUint32(2, fileSize, true);
  view.setUint32(6, 0, true); // reserved
  view.setUint32(10, 62, true); // pixel data offset

  // DIB Header (40 bytes)
  view.setUint32(14, 40, true); // header size
  view.setInt32(18, w, true);
  view.setInt32(22, -h, true); // negative = top-down
  // [EN] negative = top-down
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 1, true); // bits per pixel = 1
  view.setUint32(30, 0, true); // no compression
  view.setUint32(34, pixelDataSize, true);
  // Pixel/Meter passend zur tatsächlichen Render-Auflösung. Vorher stand hier fest
  // [EN] Pixels/meter matching actual render resolution. Previously, this was fixed at
  // 2835 (= 72 DPI), gerendert wird aber mit 300 DPI — Programme, die die DPI auswerten
  // [EN] 2835 (= 72 DPI), but rendering is done at 300 DPI — programs that evaluate DPI
  // (z.B. Ezcad2), interpretierten die Gravur dadurch ~4× zu groß. 300 DPI = 11811 px/m.
  // [EN] (e.g., Ezcad2) therefore interpreted the engraving as ~4× too large. 300 DPI = 11811 px/m.
  const ppm = Math.round(dpi / 0.0254);
  view.setInt32(38, ppm, true);
  view.setInt32(42, ppm, true);
  view.setUint32(46, 2, true); // 2 colors
  view.setUint32(50, 2, true);

  // Color table: 0=schwarz, 1=weiß
  // [EN] Color table: 0=black, 1=white
  view.setUint32(54, 0x00000000, true); // schwarz
  // [EN] black
  view.setUint32(58, 0x00FFFFFF, true); // weiß
  // [EN] white

  // Pixel data — über ein Uint8Array auf DENSELBEN Buffer statt DataView.setUint8 (Millionen
  // [EN] Pixel data — via a Uint8Array onto the SAME buffer instead of DataView.setUint8 (millions
  // Byte-Schreibvorgänge ohne die DataView-Prüfung). Die Header oben bleiben bei DataView: dort müssen
  // [EN] of byte-write operations without DataView bounds checking). The headers above remain on DataView: there,
  // Mehrbyte-Werte explizit little-endian geschrieben werden.
  // [EN] multi-byte values must explicitly be written little-endian.
  const bytes = new Uint8Array(buf);
  // Nur bis rowBytes laufen: die Auffüll-Bytes bis rowPadded sind bereits 0 (frischer
  // [EN] Only iterate up to rowBytes: padding bytes up to rowPadded are already 0 (fresh
  // ArrayBuffer) und werden von BMP-Decodern ohnehin nicht als Bildpunkte gelesen.
  // [EN] ArrayBuffer) and are not read as image pixels by BMP decoders anyway.
  const offset = 62;
  for (let y = 0; y < h; y++) {
    const src = y * w;
    const dst = offset + y * rowPadded;
    for (let byteX = 0; byteX < rowBytes; byteX++) {
      let byte = 0;
      const xBase = byteX * 8;
      const bits = Math.min(8, w - xBase);
      for (let bit = 0; bit < bits; bit++) {
        // Der Canvas kommt immer aus applyLaserPipeline und ist damit rein 1-Bit-Grau
        // [EN] The canvas always comes from applyLaserPipeline and is thus pure 1-bit grayscale
        // (R === G === B, nur 0 oder 255) — der frühere _luma()-Aufruf hat pro Pixel
        // [EN] (R === G === B, only 0 or 255) — the former _luma() call recomputed the same number
        // dieselbe Zahl noch einmal ausgerechnet. Der R-Kanal genügt.
        // [EN] for each pixel. The R channel is sufficient.
        // In BMP 1-bit: 1 = weiß, 0 = schwarz
        // [EN] In BMP 1-bit: 1 = white, 0 = black
        if (data[(src + xBase + bit) * 4] > 128) byte |= (0x80 >> bit);
      }
      bytes[dst + byteX] = byte;
    }
  }

  return buf;
}


// ═══════════════════════════════════════════════════════════════════════════
//  GEOMETRIE UND KENNZAHLEN — welche Flächen gerastert und gemessen werden
// [EN] GEOMETRY AND METRICS — which surfaces are dithered and measured
// ═══════════════════════════════════════════════════════════════════════════
//  Gehört sachlich zur Rasterung: die Pipeline bekommt ihre `rects` genau aus diesen Funktionen, und
// [EN] Functionally belongs to dithering: the pipeline receives its `rects` precisely from these functions, and
//  der DPI-Deckel entscheidet mit, wie fein sie rechnet. Ebenfalls DOM-frei, also in Node prüfbar.
// [EN] the DPI cap helps decide how finely it calculates. Also DOM-free, thus testable in Node.

// Achsenparallele Hüllbox eines (ggf. gedrehten) Feldes in mm. Zuschnitt (_imageFieldsBBox) und
// [EN] Axis-aligned bounding box of a (possibly rotated) field in mm. Crop (_imageFieldsBBox) and
// Messflächen (_fieldRectsPx) MÜSSEN dasselbe liefern, sonst passen sie nicht zueinander.
// [EN] measurement regions (_fieldRectsPx) MUST return the same, otherwise they do not match each other.
function _fieldAABB(f) {
  if (!f.rotation) return { x: f.x, y: f.y, w: f.w, h: f.h };
  const a = f.rotation * Math.PI / 180;
  const hw = (f.w * Math.abs(Math.cos(a)) + f.h * Math.abs(Math.sin(a))) / 2;
  const hh = (f.w * Math.abs(Math.sin(a)) + f.h * Math.abs(Math.cos(a))) / 2;
  return { x: f.x + f.w / 2 - hw, y: f.y + f.h / 2 - hh, w: hw * 2, h: hh * 2 };
}

// Vereinigungs-Rechteck (mm) der Bildfelder — Grundlage für die auf die Fotos zugeschnittenen
// [EN] Union rectangle (mm) of image fields — basis for laser exports cropped to photos
// Laser-Exporte (BMP + Laser-PNG): ohne den weißen A4-Rand erkennt Ezcad2 nur die Fotos als Objekt;
// [EN] (BMP + Laser PNG): without the white A4 margin, Ezcad2 recognizes only the photos as the object;
// die Abstände zwischen den Fotos bleiben. Je Feld zählt die AABB der GEDREHTEN Box — genau die Fläche,
// [EN] distances between photos remain. For each field, the AABB of the ROTATED box counts — exactly the area
// die renderFieldToCtx bemalt —, begrenzt auf die Seite.
// [EN] painted by renderFieldToCtx —, bounded by the page.
// `seite` = { w, h } der Blattgröße in mm. Wird ÜBERGEBEN statt hier per getPg() aus
// [EN] `seite` = { w, h } of sheet size in mm. PASSED IN instead of reading here via getPg()
// den Eingabefeldern gelesen — nur so bleibt die Datei frei von DOM-Zugriffen und in
// [EN] from input fields — only this way keeps the file free of DOM access and testable in Node.
// Node prüfbar. Die beiden Aufrufer reichen getPg() durch.
// [EN] Both callers pass getPg() through.
function _imageFieldsBBox(imgFields, seite) {
  const p = seite;
  let x1 = Infinity, y1 = Infinity, x2 = -Infinity, y2 = -Infinity;
  for (const f of imgFields) {
    const b = _fieldAABB(f);
    x1 = Math.min(x1, b.x);        y1 = Math.min(y1, b.y);
    x2 = Math.max(x2, b.x + b.w);  y2 = Math.max(y2, b.y + b.h);
  }
  x1 = Math.max(0, x1); y1 = Math.max(0, y1);
  x2 = Math.min(p.w, x2); y2 = Math.min(p.h, y2);
  return { x: x1, y: y1, w: Math.max(x2 - x1, 0.1), h: Math.max(y2 - y1, 0.1) };
}

// Einzelne Feld-Rechtecke in CANVAS-PIXELN relativ zum Zuschnitt bb — die Fotoflächen
// [EN] Individual field rectangles in CANVAS PIXELS relative to crop bb — the photo surfaces
// ohne den weißen Grund dazwischen. Gleiche Rotations-AABB wie _imageFieldsBBox; bei
// [EN] without white background in between. Same rotation AABB as _imageFieldsBBox; for
// gedrehten Feldern ist das großzügiger als das Foto selbst (die AABB enthält die vier
// [EN] rotated fields this is more generous than the photo itself (the AABB contains the 4
// weißen Ecken), aber es sind dieselben Flächen, die auch der Zuschnitt annimmt.
// [EN] white corners), but these are the same surfaces assumed by the crop.
function _fieldRectsPx(imgFields, bb, scale) {
  return imgFields.map(f => {
    const b = _fieldAABB(f); // gleiche Hüllbox-Rechnung wie der Zuschnitt
    // [EN] same bounding box calculation as crop
    return { x: (b.x - bb.x) * scale, y: (b.y - bb.y) * scale, w: b.w * scale, h: b.h * scale };
  });
}

// Speicher-Bremse: 500 DPI über eine große Bounding-Box wird schnell riesig (200×280 mm ≈ 22 Mpx ≈
// [EN] Memory brake: 500 DPI over a large bounding box quickly becomes huge (200×280 mm ≈ 22 Mpx ≈
// 87 MB ImageData + Fehlerdiffusion). Der Auto-Export läuft in headless Chromium und ist OOM-
// [EN] 87 MB ImageData + error diffusion). Auto-export runs in headless Chromium and is OOM-
// empfindlich, deshalb wird die DPI notfalls stufenweise gesenkt.
// [EN] sensitive, so DPI is lowered step-by-step if needed.
const LASER_MAX_MPX = 40;
function _capLaserDpi(dpi, bb) {
  const mpx = (bb.w / 25.4 * dpi) * (bb.h / 25.4 * dpi) / 1e6;
  if (mpx <= LASER_MAX_MPX) return dpi;
  const capped = Math.max(150, Math.floor(dpi * Math.sqrt(LASER_MAX_MPX / mpx)));
  console.warn(`Laser-Export: ${Math.round(bb.w)}×${Math.round(bb.h)} mm bei ${dpi} DPI wären ${mpx.toFixed(1)} Mpx — auf ${capped} DPI reduziert.`);
  return capped;
}

// Anteil gravierter Fläche über die Fotoflächen (nicht über den weißen Blattgrund — sonst einstellige
// [EN] Share of engraved area across photo areas (not across white sheet background — otherwise single-digit
// Prozente bei wenigen belegten Slots). Eingerücktes Fenster: es ist eine MESSUNG.
// [EN] percentages when few slots are used). Inset window: it is a MEASUREMENT.
function _lpBlackPct(r) {
  const px = r.c.getContext('2d').getImageData(0, 0, r.c.width, r.c.height).data;
  return _graviertAnteil(px, r.c.width, _maskRegionsInner(r.c.width, r.c.height, r.rects)) * 100;
}

// Die Zahl ist immer „wie viel Fotofläche der Laser abfährt". Wie das AUSSIEHT, hängt am
// [EN] The number is always "how much photo area the laser scans". How it LOOKS depends on
// Material: normalerweise wird Graviertes dunkel — bei schwarz beschichteten oder
// [EN] material: normally engraved areas turn dark — for black-coated or
// eloxierten Platten (invert) wird es hell. Der Hinweis dreht sich deshalb mit.
// [EN] anodized plates (invert) it turns bright. The advice flips accordingly.
function _lpVerdict(pct, inv) {
  return pct > 85 ? (inv ? '⚠️ fast alles graviert — sehr helles Bild, lange Gravurzeit'
                         : '⚠️ fast alles graviert — läuft flächig zu')
       : pct < 12 ? (inv ? '⚠️ kaum Gravur — Bild bleibt fast schwarz'
                         : '⚠️ kaum Gravur — wenig Zeichnung')
       : '✓ brauchbar — am Werkstück gegenprüfen';
}

// Drei verschiedene Werte um v herum, die garantiert in [lo,hi] liegen (am Rand wandert
// [EN] Three different values around v that are guaranteed to lie within [lo,hi] (at edges,
// das Fenster nach innen, statt zweimal denselben Wert zu liefern).
// [EN] the window shifts inward instead of yielding the same value twice).
function _spread3(v, step, lo, hi) {
  let start = v - step;
  if (start + 2 * step > hi) start = hi - 2 * step;
  if (start < lo) start = lo;
  return [start, start + step, start + 2 * step].map(x => Math.min(hi, Math.max(lo, x)));
}

// ── Ausfuhr für Node (im Browser folgenlos) ──────────────────────────────────
// [EN] ── Export for Node (no effect in browser) ──────────────────────────────────
// `module` gibt es im Browser nicht, der Zweig wird dort übersprungen. In Node:
// [EN] `module` does not exist in browser, branch is skipped there. In Node:
// `const p = require('./public/laser-pipeline.js')` — Rasterung gegen synthetische Bilder prüfen,
// [EN] `const p = require('./public/laser-pipeline.js')` — test dithering against synthetic images,
// ohne Browser.
// [EN] without browser.
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    LASER_DEFAULTS, _laserSettings,
    // Motiv-Automatik, Schatten/Lichter und die Zonenkarte gehören in den Node-Test wie
    // [EN] Subject automation, shadows/highlights, and zone map belong in Node test like
    // alles andere auch — sonst ließe sich genau der neue Teil nicht gegenprüfen.
    // [EN] everything else — otherwise precisely the new part could not be verified.
    _lichterSchatten, _istGrafik, _stufenZahl, _sobel2, _hautHist, _alleBereiche, _jeFotoKurve, _spitzenAmRand, _flacheZwischentoene, _istLogoAufDunkel, _alleLogos, _endenBelegt,
    _logoEinstellung, _istWeicheGrafik, _alleWeichGrafik, _weicheGrafikEinstellung, _istSchwarzWeiss, _RA_GRENZE_SW, _RA_SW_MILD, _hautMaske, _hautZonen, _motivZonen,
    _raBox, _regionAusgleichRegion, _raBereich, _RA_GRENZE, _RA_MIN_GEWINN, _RA_MIN_STUFEN,
    _zonenDetail, _zeichnungVerloren, _ZON_PX, _ZON_DETAIL,
    _luma, _toGray, _lut256, _lutAnwenden, _bisektion, _jeFoto, _contrastLUT, applyContrast,
    _maskRegions, _maskRegionsInner, _applyLutInRegions, _histRegion, _spreadOfHist,
    _stretchLUT, _autoLevels, _applyGamma, _unsharpMask,
    _lkGitter, _lokalerKontrastRegion, _lokalerKontrast,
    _kantenRegion, _kantenVerstaerken, _kastenmittel, _blockMittel, _bilinearAchse, _konturRegion, _konturenVertiefen, _verkleinern, _rastern, _restPipeline, _dichteRegeln,
    _REGEL_SCHRITTE, _REGEL_MAX_PX, _REGEL_F_MIN, _REGEL_F_MAX, _KANTEN_MIN_SEITE,
    _LK_RADIUS_ANTEIL, _LK_MIN_PX, _LK_ZIEL_SIGMA, _LK_MIN_SEITE,
    _errorDiffuse, bayer, thresholdDither, _invertBits,
    _inkOf, _inkBack, _dotGainLUT, _applyDotGain, _inkLimitLUT, _applyInkLimits, _dropoutLUT, _applyInkDropout, _SCHATTEN_BIS,
    applyLaserPipeline, imgTo1BitBMP,
    _YN_IN, _YN_SCHWELLE, _drehenRGBA, _kastenZurueck, _yunetEingang, _yunetAuswerten,
    _gesichtGeometrie, _gesichtMaske, _gebietMaske, _gesichterSchaerfen, _gesichterAnpassen, _gesichtEinstellen, _dichteSchaetzen, _graviertAnteil,
    _gammaLUT, _inkMittelBeiGamma, _autoGammaWert, _applyAutoGamma, _autoGammaNeigung,
    AUTO_GAMMA_MIN, AUTO_GAMMA_MAX, AUTO_GAMMA_HOCH,
    _fieldAABB, _imageFieldsBBox, _fieldRectsPx, _capLaserDpi, LASER_MAX_MPX,
    _lpBlackPct, _lpVerdict, _spread3,
    KERNEL_FLOYD, KERNEL_ATKINSON, KERNEL_STUCKI, _ERR_DIFFUSION,
    KERNEL_JARVIS, KERNEL_BURKES, KERNEL_SIERRA, KERNEL_SIERRA_L,
    BAYER, BAYER_N, BAYER_LEVELS, MASK_INSET_PX,
    AUTOCONTRAST_MIN_SPREAD, AUTOCONTRAST_FALLBACK,
    _claheRegion, _clahe, _unsharpMaskR, _dichteBremse,
  };
}
