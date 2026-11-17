---
name: aufraeumen-2026-09-24
description: "Datei- und Code-Aufräumen 24.09.2026: was gelöscht wurde, npm statt yarn, exportDXFSingle-Fix, Prüfweg für toten Code"
metadata:
  node_type: memory
  type: project
  originSessionId: 142e79e1-b071-4eab-83c0-b3dc4ab4f934
  modified: 2026-09-24T19:05:08.392Z
---

Am 24.09.2026 auf Nutzerauftrag gelöscht (kein Git — hier die einzige Spur):
`pruef-createdafter.js`, `pruef-fenster.js`, `pruef-nachschlag.js`, `pruef-notifications.js`
(Einmal-Tests 01./02.09.; `pruef-bestellung.js` bleibt als Nachschlage-Rezept — seit 06.10. in `src/tools/`),
`folders.json.bak` (vom Code nie gepflegt — `/folders` hat `backup: false`, nur Layouts und
Laser-Presets bekommen ein automatisches .bak), `motive/test.ezd`, `fonts/_unused/`,
`public/Printomation-Desktop.html`, `public/.gitkeep`, alle `__pycache__` unter tools/,
`yarn.lock` und in `exports/_Vorlage/` 3× `belegung.txt` + 1× `lade-diesen-tag.bat` vom
22./23.09. (gehören laut Code nie in den Arbeitsordner; die Lade-Batches kopieren sie nicht —
tauchen sie wieder auf, hat jemand von Hand kopiert).

**Paketverwaltung ist npm**, nicht yarn: die letzte Installation lief mit npm (npm pflegte
beide Lockfiles). `packageManager`-Feld aus package.json entfernt, README zeigt npm 10.8.2.

**Code entfernt:** `_warnSlotKollision` + `_warnGemeldet` (auch die Rücksetzzeile in
fillAllPagesAuto — beim ersten Durchgang übersehen, erst die Namenssuche danach fand sie),
ungenutzter Zähler in motivUmbenennen, CSS `.material-btn`/`#material-btns`/`.grid2`,
`/start-cron`-Parameter `lastUpdatedAfter`/`createdBefore`.
**Bug behoben:** `exportDXFSingle` nutzte die undefinierte Variable `fieldsSubset` →
ReferenceError bei jedem Layout mit Motiv-Feld (F02_*_V2); jetzt `pg` wie in exportDXFBatch.
A/B im Browser bestätigt.

**Prüfweg für toten Code, der funktioniert hat:** Kommentare per acorn 8 entfernen, dann
Bezeichner zählen; zusätzlich ESLint 8 (`no-unused-vars`, `no-undef` über Pipeline + alle
Skriptblöcke in EINER Datei) in den Scratchpad installieren — das vorhandene acorn 7.4.1
hängt sich am Editor-Skript auf. Nach jedem Entfernen ALLE entfernten Namen erneut greppen.
Siehe [[code-audit-2026-07]], [[layout-editor-testen]].
