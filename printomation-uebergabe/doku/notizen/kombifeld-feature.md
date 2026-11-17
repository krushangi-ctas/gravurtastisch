---
name: kombifeld-feature
description: "Kombi-Feld (gestapelte Gravur-Zeilen, gleiche Höhe) — Engine+UI 21.07.2026, live im Einsatz bei S01_Rund/_Herz/_Recht"
metadata: 
  node_type: memory
  type: project
  originSessionId: 5fc0b537-2a4d-446c-b04d-24e50e1dabca
  modified: 2026-08-10T19:20:08.729Z
---

Kombi-Feld löst das h/g-Höhenproblem (siehe [[feste-gravurhoehe]]): mehrere Gravur-Zeilen
werden als EIN Textblock gestapelt, alle Zeilen exakt gleich hoch.

**Datenmodell:** ein Textfeld mit `f.comboPals = [1,2,3]` (welche Gravur-Nummern/palNums als
Zeilen). Diskriminator `_isCombo(f)` = `Array.isArray(f.comboPals)`. Persistiert über Spread.

**Größe:** `comboFontSizePt(f)` — feste Schrift-Metrik (`_fontMetrics`, Cap+Unterlänge) ×
fester Zeilenzahl (`comboPals.length`) füllt die Feldhöhe. Inhaltsunabhängig → h/g/Umlaut egal,
Einzelname wird NICHT riesig. Vorschau (`_drawText`) UND DXF (`_vecTextProps`/`_buildDXFEntities`)
rufen dieselbe Funktion → keine Abweichung Bildschirm/Laser.

**Wo im Code (public/layout-editor.html):** `_isCombo`/`comboFontSizePt` bei autoFitFontSizePt;
Füllung nur in `_applyTextToField` erweitert (gilt für Stapel+Synchron); `_drawText` +
`_vecTextProps` + DXF exactFit/stauch-Gates; UI: Palette „Kombi-Feld", `addToCanvas('combo')`,
Drop-auf-Kombi im Canvas-drop-Handler → `addComboLine`, plus `moveComboLine`/`removeComboLine` +
Zeilen-Liste im Props-Panel. ALLE Änderungen mit `if(_isCombo(f))` gegated → 104 andere Layouts
bitidentisch. Backup: `layout-editor.html.bak-kombifeld-2026-07-21`.

**Getestet headless (puppeteer, /snap/bin/chromium):** Migration S01_Rech→15 Kombis, gleiche
Höhen (Reststreuung 0,195mm nur durch versch. Kunden-Schriften, nicht Inhalt; vorher 35%),
kein Einzelnamen-Blowup, Regression normaler Felder ok, 0 Fehler. UI-Smoke ok. NICHT getestet:
echte Maus-Drag-Geste (nur die aufgerufene Logik).

**Zusätze 21.07.:** Palette-Sektion aufklappbar + standardmäßig ZU (`toggleComboPal`,
selten genutzt). Zeilenabstand als ECHTE mm-Lücke `f.comboGapMM` (Standard 1 mm, Slider 0–5 mm,
`setComboGap` mit Live-Anzeige der resultierenden Schrift mm) — NICHT mehr Faktor (fühlte sich
schwammig an). Modell: N Zeilen (Cap+Unterlänge) + (N-1)·gap füllen exakt f.h → Block == Feldhöhe
bei JEDEM gap (bewiesen im Test), Schrift schrumpft bei größerem gap, nie negativ (Clamp 0.3 mm).
Helper `_comboGapMM`/`_comboLineAdvMM` in comboFontSizePt + Vorschub (Vorschau `_drawText` + DXF).
Raster (repeatField, Deep-Clone) UND Array (createArray, Spread) übernehmen comboPals automatisch.
Fotos im Kombi bewusst NICHT (getrennte Bild-Felder).

**Separater Fix 21.07. (nicht nur Kombi):** overflowMode leer („Übersteht", vorher „Überstand
OK") wurde in Vorschau+PNG/PDF geclippt → sah abgeschnitten aus, obwohl DXF voll gravierte.
Clip-Stellen (drawCanvas ~1357, Export-Canvas ~5839) hängen jetzt an `_overhang = circleDia>0
|| (text && !overflowMode)` → Überstand überall sichtbar. Button umbenannt, Beschreibung neu.
Statisch-Export-Default-Toggle im Felder-Tab ("Standard beim Anlegen — im Export": 🖨/👁),
Var `_staticExportDefault`, greift in addToCanvas.

**Hybrid ist bei Kombis deaktiviert (21.07., Audit-Fund):** Kombi+Hybrid hätte die Schrift pro
Feld verkleinert (Bestellungen wieder ungleich) und der DXF-yAnchorVec-Zweig kannte yShiftMM/k
nicht (Vorschau-Drift). Fix: Engine behandelt Hybrid bei Kombis als 'stauch' (Vorschau `_drawText`
+ DXF `_buildDXFEntities`, `_ovMode`), Hybrid-Button im Props-Panel bei Kombis ausgeblendet.
Verifiziert: DXF von Kombi+hybrid byte-identisch zu Kombi+stauch.

**Höhen-Änderungen 21.07. (Nutzer-Wunsch):** alle S01-Kombis h 16→17 mm (Zeilenhöhe bei Standard-
Gap 1mm = (17−2)/3 = exakt 5.0 mm); Layout „Schlüsselanhänger neu" 14 Bild-Felder 38.5→39 mm.

**Option „einzelne Zeile mittig" (10.08.2026):** `f.comboCenterSingle` (Standard AUS).
Ein Kombi ist auf N Zeilen dimensioniert; füllt eine Bestellung nur k < N, klebt der Block
oben. Mit der Option rutscht er um `(N-k)·Zeilenvorschub/2` nach unten → mittig im Slot.
Helper `comboCenterShiftMM(f, zeilenAnzahl, fsMM)`, angewandt in `_drawText` (via `_dy`),
im DXF-Vektorzweig UND im TEXT-Fallback (`comboShiftMM`, beide über dieselbe Rechnung).
Umschalter im Props-Panel („Oben bündig" / „Mittig"), `setComboCenterSingle` setzt die
ganze Array-Gruppe mit. Verifiziert per A/B gegen eine unveränderte Editor-Kopie: S01_Recht/
_Rund/_Herz-DXF **bitgleich**, also für bestehende Kombis wirkungslos. Gemessen wirkt die
Option auf die Zeilen-BOX; sichtbare Tinte kann je nach Unterlänge ±0,5 mm abweichen
(„Jo" ohne g/p sitzt 0,47 mm höher als „Christoph").

**Status:** Live-Layouts S01_Rech (15 Kombis), S01_Rund (12), S01_Herz (12) am 21.07. auf
Kombi-Felder MIGRIERT (je Spalte 3 gestapelte Gravur-Felder → 1 Kombi comboPals=[1,2,3],
h=Spannweite der 3 Slots). Atomar geschrieben, Backup `layouts.json.bak-kombi-migration-2026-07-21`.
End-to-End verifiziert (gespeicherte Datei → füllen → DXF sauber, 0 Fehler). Alle drei stehen auf
`exportFormat=dxf`+`autoExport=true` → Nachtlauf exportiert jetzt mit gleichen Zeilenhöhen.
Weg 3 (Zeilen von links reinziehen) ist die Editor-UX für neue Kombis.

**Befund 09.10.2026 (Nutzer: „Kombifelder hat letztens nicht so gut geklappt"), gemessen an den DXF der Tagesläufe 03.–08.10.:**
1. BUG bei „Mittig" (F02 V1–V7, FL03, FL05): Ist die ERSTE Kombizeile leer und die zweite gefüllt (z. B. V1 nur „3 Zeile" = „A"), bleibt die führende Leerzeile im Block (`_applyTextToField` entfernt nur HINTERE Leerzeilen) → k = N → keine Verschiebung → Text klebt UNTEN (305-9672236-1733960: oben 6,6 mm, unten 0,9 mm frei).
2. S01 (3 Zeilen, „Oben bündig"): Lage hängt davon ab, welche Zeilen der Kunde füllt — nur Zeile 1 → oben, 13 mm leer darunter; 2 von 3 → 7,5 mm leer unten.
3. Zeilen nur aus Satzzeichen („." in FL05 305-8808247-9347547 über „Charlie 67") zählen als Zeile und werden graviert.
UMGESETZT 09.10. (Nutzer: „wenn nur 1 von 2 graviert wird, trotzdem mittig … korrigier das"): `_comboLeer` (leer oder nur Satzzeichen . , ; : - _ Gedankenstriche · • * Anführungen; „!"/„?" zählen als Inhalt); Kombi-Block = nur gefüllte Zeilen; `comboCenterShiftMM` zentriert jetzt STANDARDMÄSSIG (nur `comboCenterSingle === false` = oben bündig; S01 hatte undefined → jetzt mittig). Nur Satzzeichen → nichts graviert + status.txt-Hinweis „<Nr>: nur „." eingegeben — nichts graviert". Geprüft: V1 „A" 6,6/0,9 → 3,4/4,2 mm, S01 2 von 3 0,1/6,0 → 3,1/3,0; volle Zeilen bitgleich; ganzer Tageslauf-Trockenlauf bitgleich bis auf FL05 306-8755969 (nur „.", vorher einzelner Punkt graviert). Sicherung: /root/sicherungen/layout-editor.html.vor-kombi-mittig-2026-10-09.
Werkzeug: Scratchpad kombi_check.js (Kombifeld-Rahmen aus layouts.json über DXF, Ursprung Mitte, misst oben/unten/links/rechts + Zeilenhöhen).
