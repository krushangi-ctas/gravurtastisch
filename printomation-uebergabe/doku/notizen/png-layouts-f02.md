---
name: png-layouts-f02
description: "F02_{Schw,Silb}_V5–V7_PNG (12.10.2026): normale Layouts mit Originalfotos + Bestellnummer darüber, gleiche Reihenfolge wie die Gravur — der Nutzer will so etwas als LAYOUT steuern, nicht als Maschinen-/Automatik-Funktion"
metadata:
  type: project
---

12.10.2026 angelegt (über POST /layouts mit If-Match; Sicherung sicherungen/layouts.json.vor-png-layouts-2026-10-12):
6 Layouts `F02_Schw_V5_PNG` … `F02_Silb_V7_PNG` in Gruppe F02, exportFormat png, autoExport an. Kopie der Gravur-Layouts
(gleiche Bildfelder inkl. Drehung, gleiche Füll-Einstellungen, multiPage wie Vorlage), OHNE bmpModus/vorlageOrdner/
ditherSettings/dxf*; nur Seite 1; je Bild ein `number`-Feld 4,5 mm darüber (numChars 19, numFrom start = volle Nummer).
Export: `<Tag>/F02/F02_Schw_V5_PNG_Blatt1.png` (3543 px, Fotos in Farbe, bei V6/V7 hochkant wie im Blech).
Geprüft per Trockenlauf mit untergeschobenen Layouts: Bestellnummern je Platz = belegung.txt der Gravur (V5 9, V6 4, V7 9).

**Why:** Nutzer: „ich möchte nicht, dass diese Funktion bei Maschine ist, sondern ich selbst bei Layout mache" — strikte
Trennung Maschine (nur, was Ezcad liest) vs. Layout (alles, was er sehen/herunterladen will). „keine Vorschau!"
**How to apply:** Neue Ansichten/Downloads als Layout bauen, das er selbst ändern kann — nicht als versteckte
Export-Automatik oder im Maschinen-Reiter („Maschinen-Bereich soll nichts mit automatischen Downloads zu tun haben").
**12.10. ~15:30 Berlin:** automatische vorschau.png KOMPLETT entfernt (_bmpVorschauBild + Aufrufe + V5-Nachzug gelöscht;
Sicherung sicherungen/2026-10-12-vor-vorschau-weg.tar.gz inkl. layouts.json). V5_PNG (Schw+Silb) zusätzlich mit den 12
Deckel-Textfeldern aus F02_xxx_V5_Text Seite 1 (gleiche Lage 28×6 über dem Foto, Kundenschrift) — Paarung im Trockenlauf
geprüft: Text/Foto/Nummer je Platz dieselbe Bestellung. Offen: Nutzer will, dass „Vorlage diese Datei immer rüberzieht" — unklar.
Siehe [[maschinen-ausbau-ideen]], [[vorschau-mit-farbbild]].

**13.10.2026 — PNG jetzt IM Ordner und IN der Vorlage (Nutzer: „bitte mach die Vorlage auch in den Ordner!! das hatte ich dir gestern schon gesagt" — der offene Punkt oben war genau das).** Die 6 PNG-Layouts stehen auf „Speichern in: Ezcad-Vorlage" (`bmpModus: vorlage`, `vorlageOrdner` = Ordner des Gravur-Layouts). Editor: neuer Zweig `pngVorlage` in `_exportFilledPages` → `<Layout>.png` (fester Name) per `_vorlageHoch` in `<Tag>/F02/<Ordner>[ SatzN]/` + für Satz 1 in `_Vorlage/<Ordner>/`; `_vorlageLeerSchreiben` legt an Tagen ohne Bestellung ein weißes Blatt hin (reines PNG-Layout belegt den Ordner nicht); `lade-diesen-tag.bat`: `del *.png` + `copy *.png`; Maschinen-Reiter nimmt fürs Zeichnen das bmp-Layout. `vorlage.controller.js`: ARBEITS_DATEI erlaubt `.+\.png`, `laden()` kopiert PNG mit und entfernt fremde. Dazu `_stackHasMore`: Misch-Layout (Bild+Text) zählt den Text-Pointer nicht mehr → V5_PNG meldete vorher bei JEDEM Lauf/jeder Reklamation fälschlich „Blatt voll". Trockenlauf F02: alle Gravurdateien bitgleich, PNGs bitgleich zu vorher. Sicherung: `sicherungen/2026-10-13-vor-png-in-vorlage.tar.gz`. Eingespielt von der Mac-Sitzung (Listing-Generator-Projekt) per `/tmp/v5png-fix/einspielen.sh`.
