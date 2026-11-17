---
name: ezcad-reiter
description: "Reiter „🛠 Maschinen → Ezcad\" + Tag laden.bat + .ezd-Leser (14.09.2026); Schreiben der .ezd nur als Machbarkeit belegt, Ezcad-Test offen"
metadata: 
  node_type: memory
  type: project
  originSessionId: fbf77f0c-65d3-4c61-9f0e-29e7006ff3f4
  modified: 2026-09-14T16:48:19.772Z
---

Editor-Reiter **🛠 Maschinen** (nach „Reklam."), oben Programmauswahl (Nutzer will später weitere
Maschinen), erstes Programm Ezcad. Je `_Vorlage/<Ordner>`: belegt, erkannter Tag, vorschau.png,
Tag-Wähler + „Laden", Prüfung jeder .ezd. Server: `vorlage.controller.js`, Routen `/vorlage/*`.

- **Archiv finden:** jede `lade-diesen-tag.bat` unter exports/ (Tiefe 4), Ziel aus `set ZIEL=`
  → findet alte Strukturen, Satz2, Reklamationen, `_Pruefgravur`. Sortierung: echte Tage zuerst.
- **Laden** (Server und `Z:\exports\_Vorlage\Tag laden.bat`): kopiert platzN/gravur/rueckseite/
  vorschau über .tmp; eine DXF, die der Tag nicht hat, wird GELEERT (nie gelöscht). Server
  sperrt während `progress.running`.
- **Tag erkannt** per md5 über platzN.bmp + nicht-leere DXF (Arbeitsordner vs. Archiv) — stimmt
  auch nach .bat/Skript. `vorlage-stand.json` liefert nur noch die Uhrzeit.
- **Tag laden.bat:** EINE Datei, `<# : batch portion`-Hybrid, startet PowerShell versteckt
  (`start … -WindowStyle Hidden`), WinForms-Fenster (Tag-Liste + Häkchen), Fehler als Meldung und
  in `%TEMP%\Tag-laden-Fehler.txt`. PS-2.0-tauglich. Nur Konsolen-Rückfall getestet (pwsh 7.4,
  `TAGLADEN_KONSOLE=1`); erste Fassungen „taten nichts"/zeigten nur cmd — Fenster unter Windows
  ungetestet.
- **.ezd lesen:** `tools/ezd/lesen.py` + `ezd_meerk40t.py` (meerk40t, MIT, unverändert; Abhängig-
  keiten unter `stub/` attrappiert), ~0,7 s, im Server nach mtime gecacht, ohne __pycache__.
  Prüft: 12 Bilder aus DIESEM Ordner, Mittelpunkt ±0,3 mm zum Layout (Rotation ±90 → B/H
  tauschen), DXF-Pfad, `flags & 0x1000` ≈ Dynamic File (nur EIN Beleg → nur Warnung), Stifte.
- „In Ezcad öffnen" (Protokoll-Link + `public/werkzeug/`) am 14.09. auf Nutzerwunsch ENTFERNT.

**Schreiben der .ezd (Nutzer will Pfad/Position aus Printomation ändern):** Vektor-Abschnitt ist
der letzte der Datei (20-B-Kopf: unkomprimiert, u2, komprimiert, 323740, u5; 256er-Huffman-
Tabelle; Daten). Entpacken+Neupacken mit derselben Tabelle ist bei allen 6 Dateien BYTE-GLEICH.
u2/u5 sind keine gängige CRC/Summe — ob Ezcad sie prüft, ist offen. DXF-Pfad = ein längen-
präfixiertes UTF-16-Feld (leicht); Position steht doppelt (Kopf-Feld 13 Mitte + args[2] Ecke).
Test: `exports/_Pruefgravur/F02_Schw_V5/F02_Schw_V5 TEST-Pfad.ezd` in Ezcad über Datei → Öffnen
— Ergebnis steht aus. Erst danach ein Editor bauen.

**Stand 14.09. abends:** Schw_V5.ezd (vom Nutzer 16:35 gespeichert) liest `gravur.dxf`, aber
flags 0 und Stifte 4–15; Silb_V5 liest gravur.dxf, flags 0, Stifte 0/4/5; V6/V7 ohne DXF.
Rückseiten-.ezd gibt es noch keine.

**01.10.2026 aufgeräumt:** Nutzer nutzt **EzCad2 Lite** (MarkEzd.dll-SDK gibt es nur für
LMC-V4-Standard → Datei lesen ist der einzige Weg; kein besserer offener Leser als meerk40t).
`lesen.py` sucht Bilder/DXF in Füllungen/Gruppen (`in`); Schw_V5R hat gravur1–12.dxf je in einer
Füllung (0,045 mm, 90°, ohne Kontur). **Bild-„Dynamic File" steht in Feld 1 der Bildfelder**
(0x1000) — meerk40ts status_bits ist ein anderes Feld (immer 0) → war Fehlalarm; richtig gelesen
haben alle 72 Bilder das Bit. Silber-Bilder zusätzlich 0x8000 (Bedeutung offen, Nutzer gefragt).
**Stifte** (Feld 4 Durchgänge, 5 mm/s, 6 %, 7 Hz, 8 Q-Puls / 25 MOPA-Puls ns; charliex2 + meerk40t)
werden je benutztem Stift als Kacheln gezeigt; Abweichung zu Geschwister-Ordnern (_V5/_V6/_V7)
gelb. Stand 01.10.: Schw_V5R 700 mm/s 12 % · Schw_V6R/V7R 1000 mm/s 20 % (alle 50 kHz 100 ns) ·
Silber 1100/80 %/25 kHz/10 ns, DXF-Ebenen 4/5 1500/70 %/30 kHz — Werte am Ezcad-Bildschirm noch
nicht gegengeprüft. Echte Funde: Silber-.ezd Spaltenraster 40,87 vs. Layout 41,22 (bis 1,05 mm),
Silb_V5 gravur.dxf ohne Dynamic File. Über jeder Datei Pfadleiste (Klick kopiert), kein Erklärtext
(Nutzerwunsch). vorschau.png erzeugt der Export automatisch für jedes Vorlagen-Layout (keine
Einstellung).

**Stift-Werte schreiben (05.10.2026):** Stifte liegen UNGEPACKT (Tabelle ab Offset 160504, je
636 B) → `tools/ezd/schreiben.py` überschreibt nur die Feld-Bytes, prüft per Neulesen, schreibt
in eine neue Datei. Einbau ins Backend (Live-.ezd überschreiben + Sicherung unter
src/ezd-sicherung/) wurde vom Claude-Code-Rechtesystem als „geteilte Ressource" BLOCKIERT —
nur mit ausdrücklichem Nutzer-Ja erneut versuchen. Auf Nutzerwunsch Testkopie
`_Vorlage/F02_Schw_V5/F02_Schw_V5R TEST-Werte.ezd` (Stift 0: 13 %, 750 mm/s, 55 kHz, 110 ns,
2 Durchgänge; 9 Byte anders, Pfade gleich). **ERGEBNIS 05.10.: EzCad2 Lite öffnet die geänderte
Datei und zeigt genau Loop 2 / Speed 750 / Power 13 / Frequenz 55 / Q-Puls 110** — Schreiben der
Stifte funktioniert; auch TC-Belegung bestätigt (Start −50, Laser-aus 250, End 100, Polygon 150).
Kopie danach gelöscht.

**LIVE seit 05.10.2026 (Nutzer-Ja):** ✎ an jedem Stift mit eigenen Werten (Feld 3 = 0, bei F02 nur
Stift 0) → POST /vorlage/stift → Sicherung `src/ezd-sicherung/<Ordner>/<Datei> <UTC-Stempel>.ezd`
(je Datei 30) → schreiben.py → rename; ↶ holt eine Sicherung zurück (sichert vorher selbst).
End-to-end an Wegwerfkopie getestet (Zurückholen byte-gleich). Ezcad übernimmt erst nach
Neu-Öffnen. Dazu je .ezd „◫ Objekte": Lageskizze (durchgezogen = .ezd, gestrichelt = Layout)
+ Liste in Ezcad-Reihenfolge mit Stift/X/Y, Tooltip voller Pfad, Klick kopiert. Pfade/Positionen
ÄNDERN geht weiterhin nicht (gepackter Teil, TEST-Pfad.ezd-Test offen). Tag-Wähler wählt den
jüngsten normalen Lauf vor (nicht Reklamation).
Seit 05.10. abends auch Verzögerungen änderbar (zweite Kachelreihe: Start-TC 9, Laser-aus 23, End-TC 10,
Polygon 11 als int µs; Sprung 12 double). DPI/Füllung stehen rechts an der Pfadleiste der Bilder/DXF.
Erste echte Änderung durch den Nutzer 05.10. 15:27 UTC: Schw_V5R Power 12→20 (1 Byte) — V5 jetzt
20 %/700 mm/s vs. V6/V7 20 %/1000 → ~40 % mehr Energie je mm; Nutzer darauf hingewiesen.
Offen: wie wird rueckseite.dxf gelasert (keine .ezd im Ordner liest sie)?
05.10. abends Optik vereinheitlicht: Karten = .ord/.ord-kopf, Marken = .marke (+ez-ok/-warn/-fehler),
Abschnitte = .il-block (Dateien · Prüfung · Vorschau · Tag laden), Programmwahl = .seg (kein Select
mehr, `_maschineWahl`), nur Design-Marken (--fs-*/--r-*). DPI/Füllung-Anzeige auf Nutzerwunsch
ENTFERNT (nicht änderbar, gepackter Teil). Kachel-Kurznamen ≤5 Zeichen (Puls, Jump, Poly.).

**Gepackter Teil (Objekte) — Kopf GEKNACKT 05.10.2026:** 20 B ab _locations['vectors'] =
[Länge entpackt, CRC-16/X25(entpackte Daten), Länge gepackt, Datenstart (=Kopf+20), CRC-16/X25(die
ersten 16 Kopf-Bytes)]; danach Huffman-Tabelle (2 + 7·n B: char u8, bits u32, länge u16), dann Daten
MSB-first. Ezcad hängt IMMER ein angefangenes Byte an (Bytes = Bits//8 + 1). Damit Neu-Packen bei allen
6 Dateien byte-gleich. Machbarkeit lokal belegt (Skript lag nur im Session-Scratchpad): Bild-DPI =
Felder 9 und 318 der 320-Feld-Bildstruktur (int), Füllungs-Abstand = Feld 5 der Hatch-Struktur
(double, ≥42 Felder) → V5R-Kopie 400 DPI / 0,05 mm, meerk40t liest es, Pfade gleich. Ezcad-Test
steht aus (Nutzer gefragt); offen: Ezcad speichert die berechneten Füllungslinien mit.
Nav „Laser" heißt seit 05.10. „Dithering"; Programmwahl im Maschinen-Kopf erst ab 2 Programmen.

**06.10.2026 (Nutzerwünsche):** keine ✓-Zeilen (nur Probleme), Karten klappen NIE von selbst auf
(„nervt"), Ezcad-eigene Vorschau entfernt (lesen.py liefert sie nicht mehr, −1 MB je .ezd), vorschau.png
zugeklappt, heutiges Datum nur im Tooltip (älterer Tag = gelbe Marke). Oben Maschinen-Reihe
`_MASCHINEN` als AUSWAHLLISTE (Nutzer mag Dropdown, „Maschine 1/2/3" fand er nicht schön): EzCad2 Lite +
LightBurn (Platzhalter, „noch leer"). **Plan des Nutzers, NOCH NICHT
umsetzen:** Ordner auf der Platte später Maschine → EzCad2 → <Ordner> statt exports/_Vorlage, und
.ezd-Dateien selbst erstellen, Dynamic-File-Pfad/Position selbst setzen — erst zusammen mit dem
Umschreiben der Pfade in den .ezd (gepackter Teil, Ezcad-Test steht aus), sonst bricht alles.

06.10. abends: Karten-Marken „Test"/„Rekla."/„Lauf N" (Herkunft ≠ normaler Tageslauf, z. B. Nutzers
Löwenwasch-Testblech aus anderem Chat) und „+N Satz" (>12 Bestellungen: Satz 1 → Arbeitsordner, Satz 2+
nur Archiv „<Ordner> SatzN"). Testkopie `_Vorlage/F02_Schw_V5/F02_Schw_V5R TEST-Objekte.ezd` (gepackter
Teil: platz1 +5 mm X, platz1 400 DPI, Füllung gravur1 0,05) — Ezcad-Ergebnis steht aus, danach löschen
(macht V5-Karte solange ✕). Größe eines Dynamic-Bilds = BMP-Pixel ÷ DPI → Größen im Layout ändern,
Positionen in der .ezd.

06.10. abends aufgeräumt, s. [[aufraeumen-2026-10-06-maschinen]] (gravurN.bmp gibt es nicht mehr; Arbeitsordner
kennt nur platzN.bmp, gravur*.dxf, rueckseite/seiteN.dxf, vorschau.png).

**09.10.2026 Durchsicht:** lesen.py entpackt mit 16-Bit-Tabelle (Codes ≤11 Bit; V5R 4,5→2,2 s, Ausgabe
aller 6 Dateien bytegleich) + Plattenkopie src/tmp/ezd-lesen/ (nach Neustart 6 Dateien in 51 ms);
/vorlage/uebersicht scannt das Archiv nur noch EINMAL (uebersicht() liefert {ordner, archiv});
ezcadLaden mit Laufnummer (überholte Antworten verworfen); Tag-Vorwahl nur normaler Tageslauf,
Test/Rekla/Lauf N stehen in Klammern dahinter; DXF-„Dynamic"-Prüfung nur bei vorhandenem Feld.
TEST-Objekte.ezd war am 09.10. GELÖSCHT, Ezcad-Ergebnis unbekannt → Nutzer gefragt; Verschieben
der Objekte erst danach bauen.

**09.10. abends:** `tools/ezd/objekte.py` = Schreiber für den gepackten Teil (Bild: Mitte Kopf-F13 + Ecke F2,
DPI F9/F318, Stift Kopf-F0, Pfad F0 variabel lang; Füllung F5/F8; Stifte kopieren inkl. F3=0) mit
Gegenprobe. Testkopien in _Vorlage/F02_Schw_V5/: „TEST-A Lage+Stifte" (platz1 +5 mm/400 DPI, platzN→Stift N,
Stift 1–12 = Stift 0, gravur1-Füllung 0,05) und „TEST-B Pfad" (platz12 → platz1.bmp). Ezcad-Ergebnis
steht aus; erst danach Reiter-Funktionen (Positionen wie Layout, X/Y je Objekt, Stift je Platz, Pfade).
Übersichtsseite: https://claude.ai/artifact/Qtbp7ShUAt79s4cK7SZkA9 („Was steckt in der EZD?").

**10.10.2026 früh (Nutzer schlief, „bau schon"):** ENTWURF-Ablauf LIVE: POST /vorlage/objekte schreibt
NIE die echte .ezd, sondern „<Name> ENTWURF.ezd" daneben (baut auf vorhandenem Entwurf auf);
POST /vorlage/entwurf {uebernehmen} ersetzt die echte Datei (mit Sicherung) oder löscht den Entwurf.
Im Reiter: „wie Layout setzen" in der Abweichungszeile, „✎ Lage ändern" (X/Y je Bild) in „Objekte",
unauffälliges „+ Stift je Platz" (freier Stiftblock, Nutzer braucht es selten), Entwurf-Kasten mit
Übernehmen/Verwerfen; echte Datei zuerst, dann Entwurf, dann TEST-Kopien. Getestet an Silb_V7 + ZZ-Kopie.
FEHLER BEHOBEN: sichern() überschrieb eine Sicherung derselben Sekunde → Zurückholen holte den falschen
Stand; jetzt Suffix -2 …, Liste nach Zeit, Muster exakt (ENTWURF-/TEST-Sicherungen nicht mehr in der
Liste der echten Datei). Sicherung vorher: sicherungen/2026-10-09-vor-entwurf-maschinen.tar.gz.

**23.10.2026:** objekte.py importierte das am 20.10. entfernte schreiben.py → Entwurf/„wie Layout setzen" waren 20.–23.10. kaputt; behoben (feld_offsets inline), s. [[durchsicht-2026-10-23-rekla-masch-dither]].

**29.10.2026: Gravuren verschiebbar (Nutzerwunsch, LIVE).** `objekte.py` kennt `gravuren: [{dxf, x, y}]`:
verschiebt das ganze oberste Objekt (Füllung samt DXF bzw. DXF allein) um dasselbe Δ — Köpfe F13 bis zur
Füllungs-Struktur (außer 0/0 = ohne Lage), DXF-Args F6/F7, alle Kurvenpunkte inkl. Füll-Cache (dessen Köpfe
0/0 bzw. 0,11/0 bleiben). Bögen (Kurventyp 0) / DXF in Gruppe → Abbruch. Neue Gegenprobe: Bytes außerhalb
der Auftrags-Bereiche müssen gleich bleiben. Reiter: „✎ Lage ändern" zeigt X/Y auch an DXF-Zeilen
(`data-art`). Testkopie für die Maschine: `_Vorlage/F02_Schw_V5/F02_Schw_V5R TEST Reihe1 1cm runter.ezd`
(Platz 1–4 Bild + Deckeltext Y −10) — **an der Maschine bestätigt: Ezcad öffnet die Datei und graviert an der
neuen Lage** (Nutzer 29.10.), danach gelöscht. Folgetest 29.10.: `F02_Schw_V5R TEST alles +1mm/+1,5mm/+2mm.ezd`
(alle 24 Objekte Y+), dazu platz1–12.bmp im Arbeitsordner durch Kästen ersetzt (649×629, Rand 6 px = 0,3 mm;
Tageslauf 29.10. liegt im Archiv, „Tag laden" holt ihn zurück). Ergebnis: +1 mm passt für Reihe 1, Reihe 2/3 wandern nach oben → Reihenabstand 61,70 zu klein. Daher `F02_Schw_V5R TEST Reihenabstand 62,20/62,45/62,70.ezd` (Reihe 1 +1 mm, Reihe 2/3 je Δ tiefer, Bilder + Deckeltexte) — alle drei zu viel, gelöscht. Jetzt `… TEST Reihenabstand 61,85/61,95/62,05.ezd` — **62,05 passt** (Nutzer 29.10.). Danach Kästen 0,5 mm höher (649×639 px, Mitte bleibt, Nutzerwunsch „Position bleibt"). **ÜBERNOMMEN 29.10. 15:03 UTC:** echte F02_Schw_V5R.ezd = Reihe 1 +1 mm, Reihenabstand 62,05, Bildmitten +0,254 (Bild 0,5 mm höher, Unterkante bleibt) — Bildmitten Y 52,454 / −9,6 / −71,654, Deckeltexte 81,2 / 19,15 / −42,9; Sicherung ezd-sicherung/F02_Schw_V5/„F02_Schw_V5R 2026-10-29-15-03-34.ezd" (↶ im Reiter). Layouts F02_Schw_V5 + F02_Schw_V5_PNG: Bildfelder h 32→32,5 (BMP 649×639), y 31,296 / 93,35 / 155,404; Sicherung daten/layouts.json.bak-2026-10-29-v5-feldhoehe. Bild wird dabei ~1,6 % höher gezogen (Nutzer bewusst). Text-Layout unverändert (gravurN.dxf mittig auf 0). TEST-Dateien gelöscht. Sicherung:
/root/sicherungen/2026-10-29-vor-gravuren-verschieben.tar.gz.

**29.10. V6:** Testdateien `_Vorlage/F02_Schw_V6/F02_Schw_V6R TEST alles +0,5mm/+1mm/+1,25mm.ezd` (alle 12 Bilder 33,02×54 Y+, V6R hat keine DXF) — +1 mm passt. **ÜBERNOMMEN 29.10. 15:12 UTC: V6R UND V7R alle Bilder Y +1 mm** (V7 ohne eigenen Test, Nutzer „mach das bei V7 auch"; Sicherungen „F02_Schw_V6R/V7R 2026-10-29-15-12-37.ezd"). Layouts F02_Schw_V6/_PNG und F02_Schw_V7/_PNG: Bildfeld-y −1 (nur Lage); Sicherung daten/layouts.json.bak-2026-10-29-v6v7-plus1. V6-TEST gelöscht. Arbeitsordner V5/V6 tragen bis zum nächsten Lauf Kästen.

**29.10.2026 umbenannt (Nutzer):** F02_Schw_V5R/V6R/V7R.ezd → **F02_Schw_V5.ezd / V6.ezd / V7.ezd** (kein „R" mehr), Sicherungen in ezd-sicherung/ mit umbenannt (↶ zeigt sie weiter). Kein Code hing am Namen; lade-diesen-tag.bat nannte schon F02_Schw_V5.ezd. Ältere Notizen mit „V5R" meinen diese Dateien.
