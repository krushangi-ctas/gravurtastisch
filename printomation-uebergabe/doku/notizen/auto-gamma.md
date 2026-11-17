---
name: auto-gamma
description: Auto-Gamma je Foto (16.09.2026 gebaut) — Gamma so, dass jedes Foto dieselbe gravierte Fläche trifft; Neigung nach unten, Regler wirkt als Faktor
metadata:
  type: project
---

**Warum:** Ein fester Gamma-Wert passt nicht für jedes Kundenfoto. Gemessen am 15.09.2026 an einem
F02-Blech: bei Gamma 1,0 lag die gravierte Fläche zwischen 41 % (Strand in der Dämmerung) und 59 %
(flaues, abfotografiertes Papierfoto). Mit 1,3 bekam der Strand endlich Zeichnung in den Schatten,
das helle Foto lief dafür zu.

**Wie (public/laser-pipeline.js):** `_applyAutoGamma` läuft direkt nach dem Auto-Kontrast, je
Fotofläche. Aus dem Histogramm (Messfenster wie beim Auto-Kontrast) sucht `_autoGammaWert` per
Bisektion das Gamma, bei dem die mittlere TINTE den Zielwert trifft — Fehlerdiffusion erhält die
mittlere Tinte, also sagt sie die gravierte Fläche voraus. Grenzen `AUTO_GAMMA_MIN/MAX` 0,5…2,0.
**Neigung nach unten** (Nutzerwunsch): `AUTO_GAMMA_HOCH = 0.85`, der Anteil über 1 zählt nur zu 85 %.
Der Gamma-Regler des Layouts ist dabei ein FAKTOR (1,0 = neutral). Rückgabe von
`applyLaserPipeline` ist `{ gammas }`; `_buildLaserCanvas` schreibt sie ins Log
(„Auto-Gamma (Ziel 45 %): …"), im Nachtlauf also in logs/index.log.

**Einstellungen:** `autoGamma` (Standard aus) und `autoGammaTarget` (0,45) in LASER_DEFAULTS, in
allen MATERIAL_PRESETS und im Laser-Tab (Schalter + Regler „Ziel-Gravurdichte"). Preset
„Feuerzeug schwarz (Messing lackiert)" und die Layouts F02_Schw_V5/V6/V7 laufen seit 16.09. damit
(Ziel 45 %, Gamma-Faktor 1,0).

**Gemessen (V5, 15.09., Ziel 45 %):** Gamma je Foto 1,18 / 0,68 / 0,52 / 0,80 / 1,18 / 0,87 / 0,96;
gravierte Fläche danach 43,4–46,1 % statt 46,9–64,0 % mit festem 1,3. Ziel 42 % ergibt 1,04 / 0,58 /
0,50 / 0,72 / 1,05 / 0,78 / 0,85 — dann verliert der Strand seine Schattenzeichnung wieder.
**Regression:** Mit `autoGamma: false` sind alle zwölf platzN.bmp bitgleich zum vorherigen Export.

Siehe [[laser-parameter-wirkung]], [[maschine2-mopa-fotogravur]], [[foto-gravur-workflow-ezcad]].

**Stand 16.09.:** Auto-Gamma läuft bei ALLEN sechs F02-Bildlayouts — Schwarz über das Preset
„Feuerzeug schwarz (Messing lackiert)", Silber über das neue Preset „Feuerzeug silber (ohne
Invertieren)" (beide Ziel 45 %, Faktor 1,0). V1/V2 haben keine Bilder. Der Nutzer wollte Ziel 80 %:
gemessen laufen dann ALLE Fotos in die Obergrenze (Gamma 1,85), die Anpassung je Foto ist damit
wirkungslos, und ab 60 % füllt sich der dunkle Vordergrund. Bei 45 % geblieben.

**Wellen in glatten Flächen sind NICHT das Raster:** Himmel von Platz 1, Welle ohne
Helligkeitsverlauf: Floyd 1,01 pp, Stucki 1,01, Atkinson 1,19, Bayer 2,11 — das Quellfoto selbst
hat 0,89 pp. Ein anderes Verfahren bringt also nichts. Regelmäßige Streifen ÜBER das ganze Blech
wären dagegen die Maschine (bidirektionaler Scan ohne Offset).

**Laser-Tab neu sortiert (16.09., Nutzerwunsch):** Reihenfolge jetzt Material → ★ Eigene Presets →
**1 · Bild** (Invertieren, Auto-Kontrast + Kontrast-Regler, Auto-Gamma + Ziel + Gamma-Faktor, Schärfen)
→ **2 · Raster** (Verfahren, Auflösung, Schwellenwert) → **3 · Kalibrierung** (zugeklappt) →
**4 · Prüfen** (Vorschau + zugeklappt „Tests brennen", `toggleLaserTests`) → **5 · Übernehmen**.
Jeder Automatik-Schalter steht direkt über SEINEM Regler; der Block „Feinjustage"
(`toggleFeinjustage`, IDs laser-fein*) ist ersatzlos weg. Schalter kompakter: eine Zeile, Toggle
per `transform:scale(.8)`. Alle Element-IDs sind unverändert geblieben, damit updateDitherSettings,
_syncLaserUI und _lockSlider weiterlaufen.

**Voreinstellungen als Auswahlfeld (16.09., zweite Runde):** Statt zwölf Knöpfen jetzt EIN
`<select id="laser-preset">` mit zwei Gruppen — eigene Presets (★) und die acht eingebauten
Startwerte — plus ✕ zum Löschen (nur bei eigenen aktiv) und „+ Aktuelle Werte speichern“.
`renderCustomPresets()` baut die Liste, `_markMaterialBtn()` setzt das Feld und hängt einen Namen,
den kein Preset kennt, als Gruppe „Aus dem Layout“ davor. Beschriftungen der eingebauten stehen in
`MATERIAL_LABELS`. Entfallen: die Knöpfe `mat-*`, `#material-btns` und der zugeklappte Block
`toggleStandardMaterialien`/`_initStandardMaterialien`.

**Der Nutzer hat am 16.09. um 08:27 UTC selbst zwei Presets gelöscht** („Schwarze Platte 25mm“ und
„Schwarz weiß beste einstellung“, zwei Speichervorgänge im Log). Übrig sind die beiden
Feuerzeug-Presets. Der alte Stand liegt in `laser-presets.json.bak` und in
`backups/2026-09-15_vor-auto-gamma/`.

**Tiefer Durchgang durch den Dither-Bereich (16.09., auf Bitte des Nutzers) — zwei echte Fehler:**
1. **Kalibrier-Keil und Testgitter rechneten mit Auto-Gamma weiter.** Der Keil besteht aus elf
   konstanten Grauwerten; Auto-Gamma zieht genau so ein Feld auf die Zieldichte. Gemessen ohne
   Korrektur: 100/81/64/49/45/45/44/43/42/29/0 statt 0…100 — die mittleren Felder waren alle gleich.
   Beide Funktionen setzen jetzt `autoGamma: false`; das Testgitter schreibt das auch in die Kopfzeile,
   weil seine Zeilen feste Gamma-Werte vergleichen (sonst wäre der Wert nur ein Faktor).
2. **Der Keil war bei INVERTIERTEN Presets seit jeher falsch beschriftet** (nicht durch Auto-Gamma):
   `v = 255 * (1 - ink)` gilt nur für nicht-invertierte Ausgabe. Auf dem schwarzen Feuerzeug gravierte
   das Feld „10 %" also 90 %. Jetzt `255 * (s.invert ? ink : 1 - ink)`; nachgemessen liefern beide
   Polaritäten 0/10/…/100 %. Wer damit je einen Tonwert-Ausgleich abgelesen hat, hat ihn verdreht.

Ebenfalls geprüft und in Ordnung: Zieltreffer < 0,01 pp über 90 Histogramme in beiden Polaritäten,
Monotonie der Tinte über Gamma, Sonderfälle (einfarbig, reinweiß, reinschwarz → Gamma 1), Klemmung an
0,5/2,0, Rundlauf UI → ditherSettings → Layout → zurück, Preset-Wechsel (eingebaute schalten
Auto-Gamma aus), alte Layouts ohne die Schlüssel, alle drei Vorschau-Modi, Ziel-Extremwerte 25/65 %,
`saveLayoutSettings` fasst ditherSettings nicht an. Tageslauf als Trockenlauf: 108 Dateien bitgleich,
Abweichungen nur bei Zeitstempeln und den FL-DXF (die bekannten 0,5 mm).