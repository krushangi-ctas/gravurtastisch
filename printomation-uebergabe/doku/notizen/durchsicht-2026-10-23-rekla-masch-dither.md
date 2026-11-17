---
name: durchsicht-2026-10-23-rekla-masch-dither
description: "Durchsicht Reklamation/Maschinen/Dithering 23.10.2026 — 9 Fehler behoben, LIVE ~17:56 Berlin; Nutzer-Entscheidungen: Dithering-Funktionen BEHALTEN, keine Sammel-Reklamation, kein Grafik-Abschnitt im Tageslauf"
metadata:
  type: project
---

Auftrag: die drei „unvollständigen" Bereiche Reklamation, Maschinen, Dithering durchgehen (toter Code, besserer Code,
Performance), Funktionen testen, fehlende Funktionen finden. LIVE 23.10.2026 15:56 UTC (pm2 restart, Nutzer: „jetzt live").
Sicherung: `sicherungen/2026-10-23-vor-durchsicht-rekla-masch-dither.tar.gz` (index.js, scheduler.js, vorlage.controller.js,
public/layout-editor.html, tools/ezd/).

**Behoben:**
- `tools/ezd/objekte.py` importierte das am 20.10. entfernte `schreiben.py` → „wie Layout setzen"/„✎ Lage ändern" seit 20.10.
  kaputt. `feld_offsets` jetzt in objekte.py, Stift-Zweig raus. `lesen.py` liefert nur noch die Stift-Felder, die der Reiter
  vergleicht. tools/ezd/__pycache__ gelöscht.
- `_ezBelegungLesen`: in LOGO/GRAFIK-Abschnitten ist die Notiz '' → Marken „Logo"/„Grafik" und Startklar-Zeile nie
  sichtbar. Prüfung jetzt mit `in`.
- `uebersicht()` erkannt: bei bitgleichen Archiv-Ordnern (Rekla der einzigen Satz-2-Bestellung) zuerst `stand.pfad`, dann
  normaler Tageslauf — vorher „Rekla."-Marke + Warnung nach „Satz 2 laden". Totes Feld `vorschau` raus.
- Rekla ④: „⏳ wird erstellt" bzw. „❌ Nicht erstellt" stehen jetzt da (`_reklaErstellenText`); vorher falscher Hinweis
  „Vorschau wird noch erzeugt", ein Fehler beim ersten Erstellen war unsichtbar. Leere Text-Karte bei V7 ohne Text weg.
- `/rekla/urteil` speichert `als`/`erkannt` (deploy5-server.sh vom 21.10. war nie eingespielt), totes `fokus` raus.
- Tot entfernt: `/export-single` laser/laserFor/alsGrafik + runAutoExport-Zweige (Client sendet seit 08.10. nur laserJe).
- Tempo Rekla: /export-single 500 ms statt 3 s, waitForFunction-Polling 500 ms statt 3 s, Rekla wartet bei belegtem
  Export 3 s statt 30 s, Client-Poll 1 s → je Knopf 9,3 → 6,4 s.
- Aktivitätslog: Rekla-Vorschau schreibt nur Fehler, echte Rekla EINEN Eintrag „N Dateien erzeugt" (vorher je Datei —
  ~85 % aller Einträge, darum hielt activity.json nur ~3 Tage). „Puppeteer gestartet" nicht mehr bei Vorschau.
- Dithering: Kalibrier-Keil ohne CLAHE (0 %-Feld hatte 0,9 % Punkte); Testgitter-Schärfen-Achse bis 200 (F02: 120/150/180
  statt 40/70/100), Kopf zeigt CLAHE; Rezepte: Basis = gespeichertes Layout (vorher schaukelte das 2. Rezept auf dem
  1. weiter), Meldung nennt die tatsächlichen Werte („max. Gravur" statt „Lichter"), Dichte-Regler bis 60 % statt 45.

**Geprüft:** Prüfstand = Kopie von src/ auf Port 3012 ohne Zeitplan/Aufräum-Cron/Amazon-Bereich; Rekla-Ablauf komplett
per Puppeteer (Laden, 12 Versionen, Art, Gesichter, Erstellen, ZIP, Vorlage, Urteil), Maschinen (Entwurf/Übernehmen/
Zurückholen/Satz laden), Testblätter alt/neu, Tageslauf-Trockenlauf alt/neu 230/230 bitgleich bis Zeitstempel.

**Nutzer-Entscheidungen 23.10. (nicht erneut vorschlagen):** ungenutzte Dithering-Funktionen (Hautkurve, Gesichts-Automatik,
Motiv-Automatik, Bereichsausgleich, Schatten/Lichter, Konturen, Fotos als Linien) BEHALTEN; KEINE Sammel-Reklamation (obwohl
z. B. 22.10. 9 Einzel-Reklas mit je 1/12 Platz); KEIN „Als Grafik"-Abschnitt in der Tageslauf-belegung.txt.

Nebenbefunde: Platz 7 V5 am 23.10. (303-1316374) leer = Kundenfoto schwarz (Luma 2/255), Warnung korrekt. bedien-test.js
Schritt 7 (Ordner umbenennen) hing seit dem Redesign — am 24.10. behoben ([[durchsicht-2026-10-24-komplett]]). Siehe [[rekla-als-art-erkannt]],
[[ezcad-reiter]], [[maschinen-ausbau-ideen]], [[betriebs-konventionen]].
