---
name: aufraeumen-2026-10-06-maschinen
description: "Aufräumen 06.10.2026 rund um Maschinen-Reiter/Vorlagen-Export — was entfernt wurde, wie geprüft, Sicherung; parallel lief ein zweiter Aufräum-Chat"
metadata:
  node_type: memory
  type: project
  originSessionId: a48179f5-6f19-4252-80b4-cb84fa4171ba
  modified: 2026-10-06T20:15:18.604Z
---

Am 06.10.2026 abends auf Nutzerauftrag („toten Code aufräumen") entfernt (kein Git — hier die Spur;
Vorher-Stand: `sicherungen/2026-10-06-vor-aufraeumen-maschinen.tar.gz`):
- Editor: `_bmpVorlageTexte` + jede gravurN.bmp-Ausgabe (Tageslauf, `_vorlageLeerSchreiben`,
  Belegungs-Abschnitt, `texte`-Parameter von `_bmpBelegungsListe`) — entstand NIE, weil kein
  Vorlagen-Layout Text auf der Fotoseite hat (V5 = Foto- + _Text-Layout, V6/V7 Text auf Seite 2);
  rechnete aber bei V6/V7-Seite 2 jeden Lauf 24 Text-Bitmaps umsonst. `_ladeTagBat` ohne
  gravur*.bmp- und doppelte gravur.dxf-Zeile. Maschinen-Reiter: OK-Funktion, gravurN.bmp-Prüfung,
  `pfade` in `_ezDateiGruppen`; Objektnummern zählen nur noch die oberste Ebene.
- CSS: `.btn-amber`, `.btn-umriss-gruen`, `.kb-wahl`, `.dd-chip(s)`, `.seg[hidden]`, `.ez-zeile.ez-ok`.
- vorlage.controller.js: `nurRahmen` (Rahmen gibt es seit 15.09. nicht mehr → LEER_DXF), gravurN.bmp
  aus ARBEITS_DATEI/Leeren, ungenutzter Parameter `archiv(nurOrdner)`, Export `VORLAGE`.

**Geprüft:** ESLint (7.26 aus node_modules, env es2021) über Pipeline + alle `^<script>`-Blöcke: 151
„unbenutzte" Funktionen sind ALLE über onclick/Template-Strings erreichbar — kein toter JS-Code
sonst; Server-Lint nur Absichts-Funde. Export-Trockenlauf alt/neu (Rezept [[export-trockenlauf]],
Skript lag im Scratchpad): 180 Dateien, 162 gleich, 13 nur Zeitstempel, 4 anders = 3×
lade-diesen-tag.bat (gewollt) + packliste.txt (nur Uhrzeit).

**Achtung:** Gleichzeitig lief der Chat „Printomation durchgehen und Dateien aufräumen" (Sicherung
`sicherungen/2026-10-06-vor-code-durchsicht.tar.gz`, 20:07 UTC) — per SendMessage informiert. Bei
späteren Funden erst prüfen, ob der andere Chat dieselben Stellen angefasst hat.
Siehe [[ezcad-reiter]], [[aufraeumen-2026-09-24]].
