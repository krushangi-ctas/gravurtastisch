---
name: einstellungs-pruefung-2026-10-11
description: 11.10.2026 Ablation aller F02-Schwarz-Foto-Einstellungen an 34 Kundenfotos + Literatur-Abgleich; Hauptbefund Haut läuft zu (Median 31 %, Hälfte >30 %); Kandidaten Kanten 45 statt Konturen + Lichter-Grenze; Bericht in src/testfoto/einstellungs-pruefung-2026-10-11.md
metadata:
  type: project
---

Nutzer fragte „ist unsere Methode die beste, macht eine Einstellung das Bild schlechter, am Anfang war es gefühlt besser". Bericht mit allen Zahlen: `src/testfoto/einstellungs-pruefung-2026-10-11.md`.

**Methode (wiederverwendbar):** echter Auto-Export nur lesend über ALLE /orders (gefälschte /session, POST abgefangen), `laser-pipeline.js` per Request-Abfangen um einen Hook ergänzt, der je applyLaserPipeline-Aufruf RGBA+raw+rects mitschneidet (34 Plätze in ~1 Min) → Node-Varianten. Werkstück-Simulation weiß ab 25 %. Metrik SSIM-cs (Achtung: reiner Strukturterm gibt flachen Zonen 1 — falsch).

**Ergebnis:** tot: Kontrast, edgeBoost (ruht), Schwelle, inkMin/Max, Gamma, Auto-Gamma (Regelung überschreibt). Helfen klar: Bereichsausgleich, dotGain. Kandidat schädlich: Konturen 155 % (Kanten 45 % in 27/32 näher am Foto, Haut >30 %: 42 statt 52 %; Mechanismus: Regelung schiebt die weggenommene Kantentinte in Haut). Hautkurve gemischt, bleibt. Stand 19.09. NICHT einfach besser (Gegenlicht-Gesichter schwarz). Literatur: Lichter auf dunklem Material beschneiden (Trotec) fehlt bei uns (inkMax 1) — Rekla „zu hell" tut genau das.
**Vorschlag an Nutzer, Urteil offen:** Testblech V7 4 Fotos × (Live · Kanten 45 · Kanten 45 + inkMax 0,8), V7 mit 700 mm/s, neuer Graukeil.

Verwandt: [[v7-zu-hell-2026-10-11]], [[testblech-5-dichtetreppe]], [[gesichter-konturen-2026-09-27]], [[f02-schwarz-einstellung]].

**LIVE 11.10. ~14:30 (Nutzer: „aktuell anstatt Konturen Kanten", „nur eins auswählbar"):** F02_Schw_V5/V6/V7 konturen 1,55→0, edgeBoost 0,65→0,45 (Sicherung /root/sicherungen/layouts.json.vor-kanten-statt-konturen-2026-10-11). Editor: zwei Schalter → EINE Auswahl `#dither-kantenart` (aus/kanten/konturen), das andere wird beim Zurücklesen 0; alte Layouts mit beiden → Anzeige „konturen" wie die Pipeline. Rekla „zu kantig" (`_rfKantenWerte(stufe, l)`) skaliert jetzt die Betonung des Layouts (Faktor 0,53/0,2; bei Konturen 1,5 wie vorher 0,8/0,3). Kopie getestet: Trockenlauf bitgleich (nur Zeitstempel), UI-Test headless ok; Sicherung layout-editor.html.vor-kantenauswahl-2026-10-11. Trockenlauf neu: Flächen ±1 Punkt, verlorene Zeichnung V7 15→8, 12→8 %. Preset „Feuerzeug schwarz" NICHT geändert (konturen 1,5) — Anwenden holt Konturen zurück. Werkstück-Urteil offen.
**„Nur Floyd?" (Nutzerfrage 11.10.):** nein — reine Rasterung = Fotohelligkeit = 44 % Fläche (9–68 %), Haut 100 % über 30 %. Minimum Floyd + Dichte geht bei normalen Fotos (kräftiger als Live), Gegenlicht → schwarze Silhouette. Bereichsausgleich nur bei Warnung bzw. immer 20 % war in der Messung schlechter als 35 %. Regler-Tabelle in Abschnitt 6 des Berichts; wirkungslos: Schwelle, Kontrast (beide ausgeblendet), Auto-Gamma+Ziel, Gamma, Schatten/Lichter — Ausblenden bei aktiver Dichte-Regelung dem Nutzer angeboten.
**Testblech Kanten gegen Konturen (11.10. ~15 Uhr):** `exports/2026-10-11 Test/Kanten-gegen-Konturen/F02_Schw_V7/` — 6 Kundenfotos × (ungerade Platz = Kanten 45 %, gerade = Konturen 155 %), sonst Live-V7; Fotos 028-4935787, 305-6904873, 304-2603808 (V6-Foto), 028-3474535, 304-1687002 (Nachtfoto, beide zu hell erwartet), 028-0112127 (S/W-Poster). Gebaut in Node aus den mitgeschnittenen Eingängen + eigenem 1-Bit-BMP-Schreiber (12/12 bitgleich zum Browser geprüft, Skripte im Scratchpad labor/). Leere rueckseite.dxf, lade-diesen-tag.bat → _Vorlage/F02_Schw_V7. Werkstück-Urteil offen.
