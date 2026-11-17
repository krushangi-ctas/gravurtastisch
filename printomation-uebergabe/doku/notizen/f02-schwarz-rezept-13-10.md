---
name: f02-schwarz-rezept-13-10
description: "F02 Schwarz (Benzinfeuerzeug) V5–V7 seit 13./14.10.2026 neues Rezept (CLAHE, 250→500 DPI, Dichte 35 %, Bremse); Nutzer 17.10.: „wirklich gut, nichts ändern“"
metadata:
  node_type: memory
  type: project
  originSessionId: e20b631f-e19e-4351-8c3d-fce60e068e4f
  modified: 2026-10-17T18:17:18.132Z
---

Seit 13./14.10.2026 (andere Sitzung, Sicherungen /root/sicherungen/*.vor-clahe-275-2026-10-13, *.vor-datei500-2026-10-14,
*.vor-rekla-bremse-2026-10-14) stehen F02_Schw_V5/V6/V7 und Preset „Feuerzeug schwarz" identisch auf:
clahe 2 (ersetzt Auto-Kontrast), dpi 250 + dateiDpi 500 (Datei 500 DPI, jeder Punkt auf jedem 2. Pixel, Ezcad bleibt
„Fixed DPI 500"), densityTarget 0,35, densityFaktorMin 0,7 (Dichte-Bremse), sharpen 1,5 + schaerfRadius 2, edgeBoost 0,4,
inkDropout 0,05. AUS: gesichtAuto, hautKurve, regionAusgleich/regionImmer, autoMotiv, autoGamma, dotGain, schattenAuf, konturen.
Reklamation skaliert ihre Stufen über `_RF_BASIS_DICHTE` 0,213 auf die 35 %.

**Nutzer 17.10.2026:** „die Einstellung für das Benzinfeuerzeug finde ich wirklich gut — an den Einstellungen nichts ändern!"
**How to apply:** Werte nicht anfassen; ältere Einträge ([[gesichts-automatik]], [[v7-zu-hell-2026-10-11]],
[[einstellungs-pruefung-2026-10-11]]) beschreiben überholte Stände.

Durchsicht 17.10.: Trockenlauf mit Editor von heute früh = echter Lauf 09:07 UTC bitgleich (Archiv + _Vorlage); Emoji-Editor
von 12:31 UTC ändert an F02 nur V3-Rückseite mit Symbolzeichen (vorher Kästen, z. B. 303-2600466 „⋆✮⋆"). Regler-Rundlauf
verlustfrei, Maschinen-Reiter Schwarz alle startklar. DPI-Option-Beschriftung 250 statt 275 korrigiert.
