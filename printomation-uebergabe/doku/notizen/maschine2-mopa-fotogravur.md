---
name: maschine2-mopa-fotogravur
description: "Zweite Maschine („…R.ezd\") = 60-W-MOPA; Startwerte für BMP-Fotogravur auf schwarz lackierten Benzinfeuerzeugen (15.09.2026, noch nicht am Material getestet)"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7f08fa25-b6d2-4437-b01b-78ef67ec0bd7
  modified: 2026-09-15T14:50:33.282Z
---

Maschine 2 (Dateien mit „R" am Ende, z. B. `F02_Schw_V5R.ezd`) ist laut Nutzer ein **60-W-MOPA**-Faserlaser.
Untergrund: schwarzes Benzinfeuerzeug. Die Gravur legt das Messing frei.
Stand in der .ezd am 15.09.: Bild-Stift 0 = 1250 mm/s · 40 % · 35 kHz.

**Mein Vorschlag (Startwert, recherchiert + gerechnet, NICHT gemessen):**
1250 mm/s · 30 % · 50 kHz · Pulsbreite 100 ns · 1 Durchgang · im Fokus. Bitmap-Optionen: Dither,
Gray, Invert, Adjust Power und Drill Mode aus, bidirektional zunächst aus.

**Regel dahinter:** 500 DPI = 0,0508 mm Punktabstand. Speed ÷ Frequenz ≤ 0,025 mm ergibt mindestens
2 Pulse je Bildpunkt. 1250/35 kHz liefert nur 1,4, die Punkte fallen dann unregelmäßig aus.
Energie je Fläche = Watt ÷ (Speed × 0,0508). Die recherchierten Fotowerte liegen bei 0,2–0,3 J/mm²,
der Stand vom 15.09. bei 0,38.

**Test vorgeschlagen:** 3×3 auf dem Feuerzeug, Leistung 20/30/40 % × (Speed/kHz) 1000/40,
1250/50, 1500/60. Danach die Pulsbreite 50/100/200 ns am besten Feld.

**Erster Test (Nutzer, 15.09. ~17 Uhr):** 40 % war an Stellen „viel zu hell" (Punkte laufen zu).
Gespeichert in `F02_Schw_V5R.ezd` um 14:57 UTC: **700 mm/s · 10 % · 50 kHz · 1 Durchgang** (3,6 Pulse je
Punkt, 0,17 J/mm²). Ergebnis „viel besser, leicht verblasst". Nächste Schritte vorgeschlagen:
mit Isopropanol abwischen, 2 Durchgänge, sonst 600 mm/s, Fokus prüfen, 200 ns testen.
**Achtung:** Diese Speicherung hat die Vorlage überschrieben. V5R.ezd enthält nur noch EIN Bild
(platz2 bei −20,3/51,2) und keine gravur.dxf mehr. Vorher 12 Bilder plus DXF, Array X 8,00 →
Spalten −61,3/−20,3/20,7/61,7.

**Verschwommen = Bidirectional Scan:** Der war die ganze Zeit an, mit BiDir Offset 0. Rück-Zeilen
verschieben sich dann um mehr als einen Bildpunkt. Empfehlung: aus lassen oder den Offset einstellen.
Um 17:07 meldete der Nutzer „richtige Einstellungen gefunden". In der .ezd stand da noch der Stand
von 16:57 (700/10 %/50 kHz/1 Durchgang, nur 1 Bild). Endwerte noch nicht gesehen.

**V5R neu aufgebaut, gespeichert 15:10 UTC:** 12 Bilder plus gravur.dxf, die Pfade stimmen.
Bild-Stift 0 = **700 mm/s · 12 % · 50 kHz · 1 Durchgang**. Text-Stifte 4–15 alle gleich 2500 mm/s ·
60 % · 35 kHz, ungetestet. Bei 35 kHz liegen die Pulse 0,07 mm auseinander, die Linie wird
gepunktet; vorgeschlagen 700/12 %/50 kHz. FEHLER in dieser Fassung: Dynamic File nur bei
platz11 (status 4096), die anderen 11 Bilder stehen auf 0. Array weiter X 8,00 → Spalten
−61,3/−20,3/20,7/61,7. Beides dem Nutzer gemeldet.

**Gravurtest 15.09. ~17:13: Array X 8,00 passt an Maschine 2 „viel besser"** als die errechneten 7,87
(Schritt 41,00 statt 40,867 mm, +0,33 %). Maschine 2 weicht also real ab: Linsen-Skalierung oder
Blech. Folgen, noch offen: (a) Y prüfen, unterste Reihe; (b) gravur.dxf kommt mit
Layout-Abständen, die Deckeltexte der rechten Spalten können an Maschine 2 bis 0,4 mm daneben
liegen. Notfalls das DXF-Objekt in Ezcad in X skalieren (VectorFile-args enthalten 100.0/100.0,
vermutlich Skalierung in %). Dynamic File stand im Speicherstand 15:13 weiter nur bei platz11. Der
Test konnte das nicht zeigen, weil Dateiinhalt = eingebettete Kopie (Nummernbilder).

**Testplättchen ≠ Feuerzeug (Nutzer 15.09. ~17:30):** Die Werte 10–12 % wurden auf einem schwarzen
Gravierplättchen gefunden (vermutlich Acryl). Auf dem echten Feuerzeug sieht alles viel schlechter aus,
der Nutzer ist dort bei 20 %. Laserwerte also am echten Feuerzeug neu finden. Vorschlag: 12 Plätze,
12 Stifte, dasselbe Foto.

**Dither-Befund F02_Schw_V5 platz1 (Strand/Stuhl, 028-9736952-5493959 item-1):** Gravierte Fläche im
Produktions-BMP: Stuhl 2,1 %, Strand 1,9 %. Der Kontrast ist also schon im Bild weg, weil Gamma 0,8 die
Tiefen staucht. Simuliert mit der echten Pipeline (Harness `capture-dither.js`, /layouts-GET mit
geänderten ditherSettings): Gamma 1,0 → 3,6/4,1 %; **Gamma 1,3 → 6,2/8,2 %, Stuhlbeine sichtbar**;
Himmel 56 → 70 %, gesamt 37 → 47 %. Tiefe 5 % zusätzlich hebt nur alles gleichmäßig. Vorschlag
Gamma 1,3 für alle Schw-F02 wartet auf OK (wirkt auf beide Maschinen).

**Deckeltext verrutscht an Maschine 2:** Bilder, Texte und Bestellungen sind in den Dateien korrekt
zugeordnet. Die gravur.dxf ändert aber täglich ihre Umrisskiste: Platzhalter X −74,8…74,9 / Y −46,2…83,2,
heute (7 Texte) Y 15,5…83,2. Die Mitte des Ezcad-Objekts steht auf der alten Kiste (0,03/18,5). Legt
Ezcad die neu geladene Datei nach Mitte an, rutscht alles 30,9 mm tiefer, nach unten links 61,7 mm
(eine Reihe), nach oben links gar nicht. Beobachtung des Nutzers noch offen. Vorschlag:
Deckeltext als text1–12.bmp je Platz (`_bmpVorlageTexte` existiert, war bewusst abgeschaltet).

**Umgesetzt 15.09. ~17:50:** Preset „Feuerzeug schwarz (Messing lackiert)" in laser-presets.json
(= „Schwarz weiß beste einstellung" + Gamma 1,3), gesetzt bei F02_Schw_V5/V6/V7. Tagesexport 15.09.
für diese drei neu erzeugt (Archiv + V5-Arbeitsordner). Alter Stand in
`tmp/alt-exports/2026-09-15_gamma13-deckelbmp/`. **Nachteil gesehen:** Bei hellen, flauen Fotos
(306-9412777-1349104, abfotografiertes Papierfoto) werden die Gesichter mit Gamma 1,3 blasser als mit 0,8.
Globales Gamma ist also ein Kompromiss; besser wäre eine Aufhellung nur der Tiefen, abhängig vom Foto.

**Wichtig:** Beide Maschinen gravieren DIESELBEN platzN.bmp. Die Dither-Einstellung steckt im
Layout und wurde an Maschine 1 gefunden. Maschine 2 deshalb über die Laserwerte angleichen,
nicht über das Layout.

Quellen (Herstellerangaben): ComMarker B6 60 W MOPA „Photo black pendants" 2000 mm/s 30 % 30 kHz
200 ns 0,045 mm; OMG 60 W MOPA Foto Alu-Karten 1000 mm/s 30 % 100 kHz 130 ns 423 dpi +2 mm;
ComMarker Titan „black coated Zippo" (Füllung) 500 mm/s 10 % 50 kHz 100 ns 6 Durchgänge;
EzCad-Anleitungen Drill Mode 0,2–1 ms bei 30 W gütegeschaltet.

Siehe [[ezcad-vorlage-dynamic-file]], [[laser-parameter-wirkung]], [[foto-gravur-workflow-ezcad]].

**Warum Maschine 1 die besseren Fotos macht (gerechnet 16.09.2026):** Maschine 1 ist ein 20-W-Raycus
(gütegeschaltet) mit 800 mm/s · 20 % · 20 kHz, Maschine 2 der 60-W-IPG-MOPA mit 700 mm/s · 15 % ·
50 kHz · 100 ns. Bei 500 DPI (Punktabstand 50,8 µm) ergibt das:
- Raycus: 4,0 W, Pulsenergie 200 µJ, Pulsabstand 40 µm → **1,27 Pulse je Bildpunkt**, 0,098 J/mm².
- MOPA: 9,0 W, Pulsenergie 180 µJ, Pulsabstand 14 µm → **3,63 Pulse je Bildpunkt**, 0,253 J/mm².
Der MOPA schiebt also die 2,6-fache Energie in dieselbe Fläche, jeder Rasterpunkt bekommt drei bis
vier Pulse und wird größer als sein Platz — Augen, Mund und andere dunkle Details laufen zu.
Empfehlung an den Nutzer: Frequenz runter auf 20–25 kHz statt Leistung weiter senken, Speed 800,
Leistung 7–8 %, Pulsbreite 100–200 ns; damit trifft der MOPA Pulsenergie, Pulsabstand und Dosis des
Raycus fast genau. **Korrektur meiner früheren Faustregel:** „mindestens 2 Pulse je Bildpunkt" gilt
für Linien/Vektoren, nicht für gerasterte Fotos — dort ist ein Puls je Punkt das Ziel.

**Nutzer-Beobachtung 16.09.: unter 40 kHz kommt das Bild schwarz raus.** Passt zur Rechnung: Er hat
die Frequenz gesenkt, ohne die Leistung mitzuziehen. Bei 15 % und 20 kHz sind das 450 µJ je Puls
(Raycus: 200 µJ) — das brennt ins Messing statt nur den Lack abzutragen, die Fläche wird dunkel.
Zwei Wege, beide auf 200 µJ und 1,27 Pulse je Punkt gerechnet:
- Frequenz hoch lassen, dafür schneller: **2000 mm/s · 15 % · 50 kHz** (180 µJ, 40 µm, 0,089 J/mm²)
  oder 1600 mm/s · 12 % · 40 kHz. Empfohlen, weil die Maschine bei niedriger Frequenz dunkel brennt.
- Frequenz runter UND Leistung mit: 800 mm/s · 7 % · 20 kHz (210 µJ).

**Die Linse ist der zweite, wahrscheinlich größere Grund (16.09.2026):** Maschine 1 fährt eine
125×125-Linse (f≈160), Maschine 2 eine 200×200 (f≈254). Gerechnet (Strahl 7–8 mm, M² 1,7–1,8, also
geschätzt, nicht gemessen): Punkt ≈ **53 µm** gegen **77 µm**. Der Rasterpunkt bei 500 DPI ist
50,8 µm — bei Maschine 1 passt der Laserpunkt also fast genau, bei Maschine 2 ist er das
1,5-Fache und überlappt die Nachbarn. Augen, Mund und feine Tiefen laufen damit zu, unabhängig von
Leistung und Frequenz. Zur Linse passende Auflösung: 125er ≈ 480 DPI, 200er ≈ 330 DPI,
150er ≈ 400 DPI, 110er ≈ 520 DPI. Praktischer Test dafür ist die DPI-Reihe im Laser-Tab.
**Randbedingung:** Das F02-Blech ist 160 × 181 mm, passt also nur in ein 200er Feld — eine kleinere
Linse auf Maschine 2 hieße, das Blech in zwei Durchgängen zu fahren.

**Leistungs-Leiter gebaut (16.09.2026):** `public/exports/_Leistungstest/stufe5|8|12|16|20|25.bmp` —
sechs identische Bildstreifen (33 × 8 mm, 300 DPI, aus einem echten Kundenfoto, Stufe als weiße
Ziffer eingebrannt) plus `hinweis.txt` mit Positionen und Stiftzuordnung. In Ezcad bekommt jede
Datei einen eigenen Stift, nur die Leistung ändert sich; sechs Stufen auf EINEM Ausschuss-Feuerzeug
in einem Durchgang. Erzeugt per Puppeteer über die echte Pipeline (Skript im Scratchpad,
`leiter.js`). Beim Test 300 DPI · 3400 mm/s · 25 % · 40 kHz kam „Gesicht schwarz" heraus, also
überbrannt — die Leiter soll das Fenster (vermutlich 8–12 %) finden.

**Warum die „bessere" Maschine schwerer einzustellen ist:** 60 W auf einer Aufgabe, die ~4 W
braucht (Arbeitspunkt bei 5–10 % des Reglers), plus zwei zusätzliche Stellgrößen (Pulsbreite,
Frequenz bis 4000 kHz) und ein 1,5-fach größerer Laserpunkt durch die 200er Linse. Der 20-W-Raycus
mit 125er Linse trifft den Arbeitspunkt dagegen zufällig genau.

**16.09.2026, die eigentliche Ursache (Nutzerfund):** An Maschine 2 war **„Fixed DPI" eingeschaltet**.
Ezcad rechnet das fertig gerasterte 1-Bit-BMP damit auf sein eigenes Raster um, die Punkte verschmelzen
und das Bild wird dunkel und matschig. Ausgeschaltet ist es „viel besser". Damit sind die vorherigen
Erklärungen (Pulse je Punkt, Linse, Leistung) zwar rechnerisch richtig, aber nicht der Hauptgrund.
Folge: Produktion bleibt bei 500 DPI im Layout, in Ezcad Fixed DPI aus, danach Leistung/Speed neu
einstellen. Die Leistungs-Leiter in `_Leistungstest` ist noch in 300 DPI und passt dazu nicht mehr.