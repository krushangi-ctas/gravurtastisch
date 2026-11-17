---
name: f02-v3-monogramm
description: F02_Schw_V3/F02_Silb_V3 (Split-Monogramm) am 02.10.2026 gebaut; Motiv-Ausrichtung „Spalt“ neu; Motive heißen F02_xxx_V3_A…Z.ai; Auto-Export AN seit 02.10. (Nutzer testet die nächsten Tage)
metadata:
  node_type: memory
  type: project
  originSessionId: e974af5d-7ef8-4024-9873-090fcd3a2677
  modified: 2026-10-02T11:25:21.323Z
---

**Gebaut 02.10.2026** auf Nutzerwunsch („Layout fertig, mit Dropdown verbinden, Gravur in die Mitte des Motivs, dann bei allen mal einen Text"). V4 (Old London) später — die TTF fehlt auf dem Server.

- ASINs: Schw B0DBZQT9WZ, Silb B0HGMKY13N (single-ASIN-Modus). Kopie von F02_Schw_V2: 12er-Blech (V1/V2-Raster x 24,7/65,567/106,433/147,3, Reihen +61,7), dxf, blech, Seite 2 = V2-Rückseite 1:1.
- **Nummerierung bei beiden ASINs (mit echtem getAllTexts geprüft): Gravur 1 = MITTE, Gravur 2 = Deckel oben**, 3 = Rückseite Deckel, 4+5 Kombi Körper. Amazon: „Oben“ = Texteingabe 2.
- Je Platz: Deckel 28×6 (palNum 2), Motivfeld 24 breit × 29,405 (ddFrage „Buchstabe“, ddTabelle A–Z → `F02_xxx_V3_X.ai` (bis 02.10. mittags `Monogramm_X.ai`, auf Nutzerwunsch umbenannt)), Mitte-Text 22×3,5 (palNum 1). Spaltmitte y 48,1 = 39,3 mm unter Feuerzeug-Oberkante (aus Amazon-Vorschau gemessen, Balken dort 24,2 mm).
- Silber-ASIN nennt die Buchstabenfrage `name` „PERSONALISIERUNG GEWÜNSCHT ?“, Etikett „Buchstabe“ — _ddAntwort sucht zuerst nach Etikett, passt.
- **autoExport: true seit 02.10.2026 nachmittags** (Nutzer: „will das die nächsten Tage testen“). Testdateien: `public/exports/2026-10-02 Testblatt/F02/` (26 erfundene Bestellungen A–Z durch den echten Auto-Export, Trockenlauf-Rezept [[export-trockenlauf]]).
- Sicherung vor den Änderungen: `gravurtastisch-orders/sicherungen/2026-10-02-03-vor-v3-v4.tar.gz (darin vor-monogramm-v3/)`.

**Motiv-Ausrichtung „Spalt“ (neu, motive.controller.js + index.js + Editor):** `einlesen(datei, tol, 'spalt')` findet das höchste leere Band (20–80 % Höhe), richtet schiefe Balken 0,1–2,9° gerade (R lag 0,48° schief) und speichert `anker {x0,x1,y0,y1,drehung}` in der .json. `motivGeometrie`: Balken = Feldbreite, Spaltmitte = Feldmitte; `motivFeldHoehe` symmetrisch um den Spalt. Umschalten im Reiter ◆ Motive → ⚙ → „Ausrichtung im Feld“ (`POST /motive/:name/ausrichtung`). Toleranz-Neuberechnung und Neu-Hochladen behalten die Ausrichtung. Vorher (Umriss-Einpassung) wären J/Q ~1 mm hoch gerutscht und 7–9 % kleiner, W 20 % kleiner.
- Die Vorlagen kamen in Maßstab-Mix (A ×1,77, R ×2,5) — egal, skaliert wird über die Balkenbreite.
- Nutzer hatte die .ai unter `public/f02_xxx_V3/` abgelegt (ohne Login abrufbar) → nach `motive/` verschoben, Ordner entfernt.

Fester Text-Block: Namen mit Unterlänge (Sophie, Benjamin) und Schreibschrift wirken im 3,5-mm-Feld kleiner ([[feste-gravurhoehe]]). Siehe [[dropdowns-analyse]], [[motive-vektorgrafiken]].

**Nachtrag 02.10. nachmittags:** Überlagerung A–Z aus den echten Export-DXFs: Balken und Schnörkel deckungsgleich, freier Spalt 5,56 mm über die ganze Textbreite, Textfeld ±1,75 → 1,03 mm Luft oben/unten (Bilder `*_ueberlagerung.png` im Testblatt-Ordner). Umbenennen eines Motivs zieht jetzt auch `ddTabelle`-Einträge mit (Server `motivInLayoutsUmbenennen` + Editor `motivUmbenennen`) — vorher nur `motivDatei`, „Je Antwort“ wäre ins Leere gelaufen. Motiv-Liste: Name in eigener Zeile (war abgeschnitten), Vorschau auf weißem Grund (war schwarz auf dunkel).

**03.10.2026:** Alle Felder der Seite 1 (Deckel, Mitte, Motiv) tragen `ddWenn` „PERSONALISIERUNG GEWÜNSCHT? = Feuerzeug Personalisiert“ (Nutzer: „nur gravieren, falls Ja gewählt“). Bei „Ohne Gravur“ bleibt die Vorderseite leer, auch mit eingetipptem Text; die Rückseite folgt weiter „Mit Rückseite“. Ja-Bestellungen byte-gleich geprüft. `_ddNorm` ignoriert „?“ und Leerzeichen, die Frage passt bei allen vier V3/V4-ASINs.
