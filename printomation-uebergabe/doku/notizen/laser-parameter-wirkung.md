---
name: laser-parameter-wirkung
description: Gemessene Wirkung der Laser-/Dither-Regler — welcher Regler was tut (und welcher nichts)
metadata: 
  node_type: memory
  type: project
  originSessionId: 4aace468-d32b-4ad6-9e70-4ad5b2e8518a
  modified: 2026-07-30T14:18:02.955Z
---

Am 30.07.2026 an echten Kundenfotos bei 500 DPI gemessen (nicht geschätzt):

- **Schwellenwert wirkt NUR bei Bayer/Schwellenwert.** Bei Fehlerdiffusion (Floyd/Atkinson/
  Stucki) ändert Schwelle 115→165 die gravierte Fläche um **0,0 Prozentpunkte** — der
  Quantisierungsfehler wird ja weitergegeben, die Gesamttinte bleibt erhalten. Bei Bayer
  dagegen ±9 Prozentpunkte (stärkster Regler dort).
- **Gamma ist der einzige verlässliche Dichte-Regler** bei Fehlerdiffusion: ±5 Prozentpunkte.
- **Kontrast und Schärfen ändern die Dichte nicht** (0,0 pp) — sie ändern das Aussehen.
  Schärfen wirkt trotzdem stark: +54 % Kantenenergie bei 80 %. Nicht als wirkungslos abtun.
- **Serpentinen-Scan** senkt die Richtungsdrift (Asymmetrie der beiden Diagonalen) auf echtem
  Foto um **99 %** (0,0952 → 0,0012). Kostet dafür ~25 % mehr Blockstreuung auf FLACHEN
  Flächen. Für Fotos klar richtig, sichtbar im Kalibrier-Keil (dort sind alle Felder flach).

**Fallstrick beim Nachmessen:** `ditherSettings` ist ein Top-Level-`let` und über `window`
NICHT lesbar — `{...window.ditherSettings}` ergibt `{}` und damit `active:false`, also harten
Schwellenwert statt Rasterung. Genau so ist mir eine Messung einmal komplett umgekippt.
Einstellungen im Test immer explizit ausschreiben. Siehe [[layout-editor-testen]].
