---
name: dropdown-text-baustein
description: Baustein „Dropdown-Text“ (03.10.2026) — graviert die Antwort einer beliebigen Dropdown-Frage in fester Schrift; Kasten = Höhe eines Großbuchstabens; Mitarbeiter-Anleitung als Artifact
metadata:
  type: project
---

Auf Nutzerwunsch („einfacherer Weg, damit Mitarbeiter es einstellen“, dann „allgemeiner machen … graviert einfach die Antwort“) aus dem V4-Aufbau gebaut. Palette „Felder“ → **Dropdown-Text** (`ddTextFeldAnlegen`). Technisch Textfeld mit Flag **`ddText: true`**, `_feldTyp` → 'ddtext'.

- Setzt selbst: Gravur-Nr ab **99 abwärts** (keine Amazon-Zeile, eigener Slot-Abgleich), **`ddGruppe`** (`_ddGeschwister` für Text mit ddGruppe gruppiert darüber — Frage/Schrift/Höhe/Bedingung gelten für alle Plätze), Frage = Profilfrage mit Thema buchstabe, `ddWenn` = Personalisierungs-Frage mit allen Nicht-Nein-Antworten (`_ddTextVorbelegen`).
- **Größe aus Kastenhöhe:** `_ddTextPt` = h / (capPx/200 · 0,353) → Kasten = „H“-Höhe, alle Antworten auf einer Grundlinie; an beiden Größen-Stellen (Vorschau `_drawText`, Export `_vecTextProps`). Höhe ändern (Feld, Karte, Ecke ziehen) verteilt sich auf alle (`_ddTextHoeheVerteilen` in upd/offRsz).
- **Stauchen auf Kastenbreite auch bei fester Größe** — nur für ddText (`|| f.ddText` in beiden overflow-Bedingungen); Vorschau clippt ddText nicht (Unterlängen).
- Karte rechts: Frage (+ „Frage eintippen“ ohne Profil), Graviert wird (Antwort selbst / eigener Text je Antwort = ddTabelle), Schrift (`_ppSchrift`), Höhe (mm), Bedingung. Vorschau ungefüllt: blasses Muster (`_ddTextMuster`, Buchstabe → „A“).
- V4 umgestellt (Kästen 30→32 breit, x −1, damit W nicht staucht): Ausgabe bis auf je 1 Koordinate ±0,0001 mm gleich; ganzer Tageslauf 03.10. alt/neu bitgleich bis Zeitstempel.

**Anleitung für Mitarbeiter (Artifact, privat — Nutzer muss teilen):** https://claude.ai/artifact/69uWBzxGs2K8kiXNXqGiDQ — Screenshots per Puppeteer mit erfundenen Bestellungen A–L (Skript nur im Session-Scratchpad). Bei UI-Änderungen am Baustein Bilder neu machen. Siehe [[f02-v4-old-london]], [[dropdowns-analyse]].

**Durchsicht 03.10. abends:**
- Frage-Liste hat immer „Andere Frage eintippen …“ (`__eintippen` → `ddFrageEingeben`) — Fragen kennt der Editor NUR aus geladenen Bestellungen (ASIN-Profile, Listings-API 403). Beispiel B0H37H9G7X (FL01_Gemi_M10): einzige Bestellung 23.09. ohne Dropdown (nur Text + Schriftart/Farbe) → Liste leer. Bei Multi-ASIN-Layouts kommen die Fragen aller Feld-ASINs zusammen.
- Nutzer schrieb „es muss nicht immer graviert werden, es muss nur übernommen werden“ — Bedeutung offen (gefragt: automatische Bedingung weglassen? oder Antwort nur übernehmen/anzeigen statt gravieren?). Nicht raten, Antwort abwarten.
- Platzhalter-„A“ nur im Bildschirm-Canvas (drawCanvas); Export zeichnet über eigenen Weg → nie in Dateien (Tageslauf alt/neu bitgleich bis Zeitstempel).
- Upload derselben Motivdatei ohne erkennbaren Spalt: fällt jetzt auf Umriss zurück (Warnung im Log) statt die Datei zu löschen (index.js /motive/upload).
- Sicherungen: `sicherungen/2026-10-02-03-vor-v3-v4.tar.gz (darin vor-review-03-10/)` = Editor+index.js vor den Review-Fixes; `vor-buchstabe-baustein-nur-layouts/` = nur layouts.json vor dem Baustein (die Editor-Kopie dort war versehentlich überschrieben worden). Stand vor allen Änderungen 02./03.10.: `sicherungen/2026-10-02-03-vor-v3-v4.tar.gz (darin vor-monogramm-v3/)`.
