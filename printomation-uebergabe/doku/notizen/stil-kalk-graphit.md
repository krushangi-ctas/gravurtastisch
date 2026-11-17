---
name: stil-kalk-graphit
description: "Oberflächen-Redesign 17.10.2026 „Kalk & Graphit“ (hell, Geist-Schrift, Kobalt-Akzent) — Bausteine, Sicherung, Prüfweg"
metadata:
  node_type: memory
  type: project
  originSessionId: b1ef3960-2938-476c-9d45-ccede01c1304
  modified: 2026-10-17T18:39:31.713Z
---

17.10.2026 auf Nutzerwunsch („wie die beste Innenarchitektin, minimalistisch, alles gleichmäßig“) den
Layout-Editor komplett neu gestaltet und LIVE eingespielt: hell statt dunkel, warmes Kalkweiß, weiße Flächen
mit Haarlinien, Graphit-Schrift, EIN Akzent Kobalt #3B5BDB (= gewählt/an/Hauptaktion); Grün/Amber/Rot nur
Bedeutung. Schrift Geist + Geist Mono (OFL, in public/vendor/fonts/ inkl. Geist-OFL.txt). Linien-SVG-Icons
(`svg.ik`) in Kopfleiste/Werkzeugspalte statt Emojis; jeder Reiter hat `.tab-titel`; Knopftexte ohne Emoji
(auch die vom Skript zurückgesetzten). Ordnerfarben: gespeichert bleibt der alte Hex, gezeigt wird `_ordnerTon()`.

**Why:** Vorher fünf Überschrift-Bauarten, Systemschrift-Knöpfe (_segBtn), Emoji-Mix — wirkte unfertig.

**How to apply:** Neue UI mit den Bausteinen bauen: `.tab-titel/.tab-titel-text`, `.card-titel/.card-text`,
`.wahl-knopf` (über _segBtn), `.chip-knopf`, `.zp-*` (Zeitplan), `.dlg-kasten/.dlg-titel/.dlg-zu`,
`.ablage-zone`, `.info-kasten`, `.such-feld`; Farben nur über Marken (--accent-rand, --green-rand …).
Vorher-Stand: sicherungen/2026-10-17-vor-redesign.tar.gz. Trockenlauf alt/neu: 193 Dateien gleich bis
Zeitstempel. Parallel-Sitzung „Fehlende Zeichen“ editierte dieselbe HTML → per `git merge-file` zusammengeführt;
bei parallelen Sitzungen immer gegen den Live-Stand mergen.
**Zweiter Durchgang 17.10. abends (Mitarbeiter-Bedienung, LIVE):** Maschinen-Bühne DUNKEL (--buehne-*, Nutzer:
„Kontrast zu gering“); Werkzeugspalte: Umstellung „Arbeit zuerst“ und „Start = letzter Reiter“ auf Nutzerwunsch ZURÜCK („das Erste ist doch das Wichtigste, die Seite einzustellen“) — Reihenfolge Blatt/Arbeit/Mehr bleibt; linke Spalte 264 px („zu breit“); `details.klapp-block[data-merken]` klappt „Weitere Füll-Einstellungen“ und Dithering-„Feineinstellung“ zu; Ezcad-Karte: „Tag laden“ oben (_ezTagLadenBlock); Export-Menü „PDF Print (450 DPI)“.
**Reiter-Reihenfolge (freigegeben, LIVE):** Seite: Seitenliste über den Knöpfen; Motive: Konturen-Hinweis in der Ablage; Laden: „Erneut laden erzwingen“ UNTER dem Knopf; ASIN: Eingabe+Prüfen eine Zeile; Maschinen-Auswahl versteckt solange nur EzCad2 eingerichtet; Übersicht: Heute/Gestern/7 Tage/Bestand/Aktivitäten; Einstellungen speichern sich selbst (setSettingsDirty → 700 ms), kein Knopf. Siehe [[layout-editor-testen]], [[export-trockenlauf]],
[[ui-fuer-mitarbeiter-einfach]].
