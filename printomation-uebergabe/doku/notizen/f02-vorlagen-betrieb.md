---
name: f02-vorlagen-betrieb
description: "F02-Vorlagen-Betrieb (Stand 14.09.2026 abends): 9 Layouts in Gruppe F02, V5/V6/V7 = 12er-Vorlage mit gravur.dxf/rueckseite.dxf, _Vorlage nur Ezcad-Dateien, Leerschreiben, Prüfgravur als ladbarer Tag"
metadata: 
  node_type: memory
  type: project
  originSessionId: fbf77f0c-65d3-4c61-9f0e-29e7006ff3f4
  modified: 2026-09-15T14:14:07.494Z
---

**Layouts (Gruppe „F02", alle Auto-Export):** V1, V2 (Schw), V2 (Silb) = reine Text-DXF im
Gruppenordner. V5, V6, V7 je Schw/Silb = 12er-Blech, `bmpModus: 'vorlage'`, bmp+dxf, synchron,
`dxfCenterOrigin: true` (war nur bei Schw_V5 an → DXF lagen 100 mm daneben; jedes neue
Vorlagen-Layout mit DXF braucht es). `_V7_12er` heißt seit 14.09. `_V7`. Die `_Einzeln`- und
1-Platz-V7-Layouts sind gelöscht. Die Layout-Liste schneidet Namen ab — der Nutzer hat so am
14.09. versehentlich die 12er gelöscht (wiederhergestellt).

**Rückseite:** V5 und V6 hatten Seite 2, **V7 bekam sie am 14.09.** (Kopie der V6-Seite-2 mit
V7-ASIN). Amazon V6 == V7: vorne Foto, hinten „Text 1" mit 3 Zeilen → palNum 1 Deckel (28×6,
y 16,8), Kombi 2+3 Körper (28×12, y 42,8). V5: vorne Deckel palNum 1, hinten 2 + Kombi 3+4.

**Jeder Lauf schreibt:**
- `exports/_Vorlage/<Layout>/` (Arbeitsordner, Ezcad liest per Dynamic File): platz1–12.bmp,
  `gravur.dxf` (nur Layout-Seite 1 mit Text → V5), `rueckseite.dxf` (V5/V6/V7), vorschau.png.
  NICHTS Erklärendes dort (Nutzerwunsch) — dazu nur seine `.ezd` und `_Vorlage/Tag laden.bat`.
- `<Tag>/F02/<Layout>/` (Tagesarchiv, seit 14.09. ohne Ebene `Vorlage/`): dasselbe + belegung.txt
  + lade-diesen-tag.bat (ZIEL = Arbeitsordner).
- Nur Satz 1 in den Arbeitsordner; Satz 2+ nur als `<Layout> Satz2/` im Archiv, vorschau.png
  zeigt „Satz 1 von N". Reklamation schreibt NICHT in den Arbeitsordner. Zwei Layouts mit
  gleichem Vorlagen-Ordner → das zweite meldet Fehler, archiviert unter eigenem Namen.

**Nie Altes gravieren:** Seite mit Gravur im LAYOUT, heute ohne Inhalt → leere DXF (387 B).
Layout ohne Bestellung beim ersten Lauf des Tages → Blindblätter + leere DXF; seit 14.09. auch,
wenn die Session komplett leer ist. Spätere Läufe (Lauf 2) leeren nicht. Leere Plätze = 8×8-px-
BMP; die Datei MUSS existieren, sonst nimmt Ezcad die eingebettete Kopie.

**Prüfgravur** (Ordner am 15.09.2026 extern gelöscht, s. [[f02-nummernbilder]]): `exports/_Pruefgravur/<Layout>/` = „Gravur 1–12" / „Rückseite 1–12" (echte Engine)
auf leeren Plätzen + rotes PRÜFGRAVUR-vorschau.png. Erscheint in beiden Ladern als letzter
Eintrag; geladen meldet der Maschinen-Reiter rot „PRÜFGRAVUR geladen". Dort liegt auch
`F02_Schw_V5 TEST-Pfad.ezd` (Schreibtest, s. [[ezcad-reiter]]).

Dateinamen im Tagesordner pro Layout per Dropdown/Muster (`layout.dateiname`); {nr} läuft je
Gruppenordner über alle Layouts eines Laufs weiter. Sicherung vom Stand vor den Änderungen:
`src/backups/2026-09-14_vor-den-aenderungen/`. Siehe [[ezcad-vorlage-dynamic-file]],
[[bmp-je-platz]], [[f02-12er-raster]].

**V5 aufgeteilt (17.09.2026):** Die Deckelgravur lag bisher doppelt im Arbeitsordner —
als `gravurN.bmp` UND als `gravurN.dxf`; in Ezcad war nicht zu sehen, was gilt. Jetzt zwei
Layouts je Material, die sich EINEN Vorlagen-Ordner teilen:
- `F02_Schw_V5` / `F02_Silb_V5` → nur `exportFormat: bmp`, nur Bildfelder, 1 Seite → `platzN.bmp`
- `F02_Schw_V5_Text` / `F02_Silb_V5_Text` → nur `dxf`, nur Textfelder, 2 Seiten → `gravur.dxf` + `rueckseite.dxf`

Dafür musste die Vorlagen-Sperre in `_exportFilledPages` gelockert werden: Sie warf früher
jedes zweite Layout mit demselben Ordner ab. Jetzt zählt die Überschneidung der FORMATE —
`_laufNamen.vorlagen[ordner]` ist seither `{ name, formate }`, nicht mehr ein String
(zweite Fundstelle in `_vorlageLeerSchreiben` mitgeändert). Neues Layout-Feld
`dxfBildRahmen` überschreibt die Automatik, die dem DXF-Layout sonst zwölf Bildrahmen gäbe.

**Offen:** Die `.ezd` zeigt noch auf `gravur1..12.dxf` — die gibt es nicht mehr, das
Text-Layout liefert eine gemeinsame `gravur.dxf`. Damit kommt das Anker-Problem von
[[f02-deckeltext-je-platz]] möglicherweise zurück (Text wanderte eine Reihe). Am Blech prüfen.

## Einzelne Stücke von Hand in den Arbeitsordner legen (18.09.2026)

Wenn nur ein paar Stücke nachgraviert werden sollen, ohne den ganzen Lauf zu wiederholen:
`platzN.bmp` der gewünschten Plätze ersetzen und **alle übrigen mit dem Blindblatt
überschreiben** — sonst graviert die Maschine die Fotos des letzten Laufs mit.

- Blindblatt NICHT neu erzeugen, sondern eine vorhandene 94-Byte-`platzN.bmp` **aus
  demselben Ordner** kopieren: im BMP-Kopf steckt die DPI, und die hängt am Layout.
- `belegung.txt` im Arbeitsordner ist seit 14.09. **nicht** mehr Teil des Laufs (Wunsch
  Bediener: dort nur, was Ezcad liest) — sie stand deshalb auf einem alten Stand und muss
  von Hand nachgezogen werden, sonst führt sie in die Irre.
- `vorschau.png` ebenso neu bauen, sonst zeigt sie die alte Belegung.
- **`rueckseite.dxf` / `gravur.dxf` bleiben vom Lauf stehen.** Sie enthalten die Texte
  ALLER Plätze des letzten Laufs. Bei einem teilbelegten Blech feuert die Maschine damit
  in leere Vorrichtungsplätze — vor dem Markieren prüfen oder die Ebene weglassen.
- Vorher sichern: `backups/<datum>_vorlage-vor-...` mit `cp -r`.
