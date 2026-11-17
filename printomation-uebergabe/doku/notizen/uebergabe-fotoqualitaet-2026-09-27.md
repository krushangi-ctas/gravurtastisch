---
name: uebergabe-fotoqualitaet-2026-09-27
description: "27.09.2026 BEARBEITET (s. gesichter-konturen-2026-09-27): Streifen behoben, kein Rückschritt seit Freitag (bitgleich), Kandidat konturen+regionImmer wartet auf Testblech-Urteil; ursprüngliche Übergabe mit Befund des Nutzers"
metadata:
  node_type: memory
  type: project
  originSessionId: 142e79e1-b071-4eab-83c0-b3dc4ab4f934
  modified: 2026-09-27T14:49:05.387Z
---

**STAND 27.09. ~15:35 UTC:** Bearbeitet in [[gesichter-konturen-2026-09-27]]. Die Hypothesen unten (regionAusgleich
als Ursache, Rückfall auf Freitag) sind WIDERLEGT: Freitags-Code rechnet 23 von 26 Wochenend-Plätzen bitgleich.
Offen: Urteil Testblech „Gesichter“, danach Umschalten; PM2-Neustart (Server-Fixes 26.09.) weiter ungefragt.

**Befund des Nutzers (27.09.2026, nach Gravur der Läufe 26. und 27.09.):**
1. Rechts ein weißer Streifen bei den meisten Feuerzeugen.
2. Gesichter bei manchen viel zu dunkel — „sehr großes Problem, muss definitiv behoben werden“, besonders mit hellem Hintergrund.
3. Alles sieht gezeichnet aus: Augen schwarz, keine Pupillen erkennbar, Münder und Köpfe wie gezeichnet.
4. Schlechter als am Freitag (Lauf 25.09., 12 Uhr Berlin = 10:07 UTC).
Er wollte dafür ausdrücklich einen frischen Chat.

**Gemessen 27.09. an platzN.bmp** (1 bit, schwarz = graviert = hell am Werkstück; Mitte ≈ 23 % = densityTarget):
- Weißer Streifen: in jedem geprüften F02-Schwarz-BMP ist die LETZTE Pixelspalte 99–100 % graviert, die vorletzte 0–1 %
  (Haarlinie mit dunklem Saum), auch im Freitags-BMP (25.09. 10:09 UTC). Fällt auf, wo der rechte Bildrand dunkel ist
  (27.09. V7 Platz 2: rechte Spalten 1 %). Erste Spalte und unterste Zeile ebenfalls erhöht (40–58 % bzw. 39–50 %).
  Verdacht, ungeprüft: Randspalte bleibt vor dem Dithern leer/weiß (Rundung Feldbreite→px oder Filterschleife ohne letzte
  Spalte) → invertiert voll graviert; Schärfen/Kanten erzeugen den Saum. Messskript: bmpprofil.js im Scratchpad der
  Sitzung 142e79e1 (Anteil je Randspalte/-zeile).
- Einstellungen: EINZIGE Änderung gegenüber Freitag (`vor-bereichsausgleich/layouts.json`) ist `regionAusgleich: 0.5` bei
  F02_Schw_V5–V7. edgeBoost 0.65, densityTarget 0.23, densityMax 0.4, inkDropout 0.12, autoMotiv, autoGamma 0.45,
  sharpen 0.8, contrast 10, dotGain 0.2, invert, 500 dpi waren Freitag schon so. Der Pipeline-CODE hat sich stark geändert.
- belegung.txt: 27.09. V7 Platz 1+2 mit Bereichsausgleich (Zeichnung 57→19 %, 48→23 %); 26.09. V6 Platz 2 34 % verlorene
  Zeichnung; 26.09. V5 Platz 1 ALS LOGO (Vereinslogo, gewollt).

**Code-Änderungen seit Freitag (alle aus anderen Sitzungen):**
- 25.09. 13:25 regionAusgleich ([[bereichsausgleich]]): Guided-Filter-Basis komprimieren, greift ab ≥40 % verlorener
  Zeichnung, S/W-Fotos ab 31 % (×0,7). Am Werkstück nie geprüft; der A/B damals änderte nur 1 Platz.
- 25.09. 20:19/20:34 S/W-Grafik-Erkennung + Logo-Automatik ([[schwarz-weiss-bilder]]): bunte Logos auf dunklem Grund →
  Atkinson ohne Kanten/Auto-Gamma/Dichte/Motiv/Ausgleich. ~1 % Fehlalarme bei dunklen Fotos (Nachtstadt, Neon, Wald) →
  zu dunkel; Nutzer ließ es an. Prüfen: belegung.txt „ALS LOGO GRAVIERT“.
- 26.09. 12:07 Korrektur Grafik (braucht Schwarz UND Weiß); 21:29 Randlinien-Fix im regionAusgleich (oberste Zeilen);
  ~21:56 Editor-Fixes der Code-Review ([[code-audit-2026-09-26]]), u. a. „Überstand-Farbe aus opts.invert“ und
  „Bild austauschen“ exportiert jetzt das neue Bild.
- 27.09. 14:07: Laser-Reiter-Rezepte („Motiv zu dunkel“, „nur schwarz/weiß“, „Motiv läuft zu“) setzten die Tiefen-Grenze
  bisher auf 80 % statt 45/30/40 % — erst jetzt wirksam.

**Kandidaten für „gezeichnet“ und dunkle Gesichter (alle ungeprüft):**
- edgeBoost zeichnet Höhenlinien in glatten Flächen (Himmel, Nebel, weißer Hintergrund); Schwelle <24 getestet, nie eingespielt.
- Dichte-Regelung misst übers ganze Feld: heller Hintergrund frisst das 23-%-Budget → Gesicht unterbelichtet
  ([[testblech-5-dichtetreppe]]: Faktor 6 im Gesicht). autoMotiv (Deckel 0.4) war Freitag schon an.
- inkDropout 0.12 schneidet isolierte Gravurpunkte im Dunkeln → nimmt womöglich die Glanzlichter der Augen weg.
- regionAusgleich (Basis gestaucht, Detail bleibt) passt zum Bild „gezeichnet“ — und ist die einzige neue Einstellung.
- Faustregel aus der F02-Sitzung: Gesicht 10–15 % Schwärzung, Augen fast weiß.

**Betrieb:** PM2 läuft seit 25.09. 13:02 UTC ohne Neustart → die Server-Fixes der Code-Review (26.09.) sind NICHT live
(Editor/Pipeline schon, der Export lädt sie frisch). Der Neustart wurde der Sitzung verweigert → Nutzer fragen.
Bestelldaten mit Fotos fallen nach ~3 Tagen weg → 26./27.09. zuerst sichern (nicht unter public/).

**Vorgeschlagener Einstieg:** (1) Streifen: Quelle der letzten Spalte finden und beheben (klein, unabhängig).
(2) Lauf 27.09. im Trockenlauf ([[export-trockenlauf]]) mit Freitags-Pipeline + -Einstellungen gegen heute rechnen,
vorschau.png nebeneinander zeigen. (3) regionAusgleich 0 als erster Hebel, dann Dichte-Messfläche/inkDropout.
Siehe [[f02-schwarz-einstellung]], [[laser-regression-18-09]], [[verlorene-zeichnung]], [[motiv-automatik]].

**Aufräumen:** Die vor-*-Ordner liegen in /var/www/printomation/gravurtastisch-orders/ (nicht src/).
`vor-bereichsausgleich/` = Freitags-laser-pipeline.js (24.09. 10:50) + layouts.json (24.09. 11:43); der Editor darin ist
schon der Dropdown-Stand von 25.09. 13:02. Mein `vor-dropdowns/` ist gelöscht; die übrigen sechs erst löschen, wenn die
Fotoqualität wieder stimmt.

**Ältere Befunde, Nutzer: „weg damit“ (= erledigen):** 20 ASINs ohne Layout, u. a. alle Armbänder (braucht seine
Entscheidung, ob die über Printomation laufen sollen); Storno nach dem Download bleibt unbemerkt
([[stornierte-bestellungen-im-export]]); PM2-Logs ohne Rotation (printomation-out.log ~31 MB).
