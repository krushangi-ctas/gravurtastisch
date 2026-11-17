---
name: emoji-paket
description: Emojis im Gravurtext seit 17.10.2026 erkannt + inline graviert (Noto Emoji mono / DejaVu); Schalter + Fundliste in ⚙ Einstellungen
metadata:
  node_type: memory
  type: project
  originSessionId: 113d0fd4-fb0f-4e7f-aad4-e9cc7cb62394
  modified: 2026-10-17T12:29:51.547Z
---

Seit 17.10.2026: Bildzeichen im Kundentext, die die Feldschrift nicht hat, werden inline graviert statt
als .notdef-Kasten (vorher: „Sara ❤️" = zwei Kästen, auch U+FE0F). Kern in layout-editor.html:
`_emojiTeile` (Grapheme → Text/Bildzeichen), `_zeilePfad` (DXF), `_teileZeichnen` (Canvas), `_emojiHinweise`.

- Schriften in `public/vendor/fonts/`: NotoEmoji.ttf (statisch wght 600 aus der OFL-Variable-Font,
  per fontTools-Wheel instanziert) + DejaVuSans.ttf (für ♡ ⋆ ✮ ∞). Bewusst NICHT in src/fonts — dort
  stünden sie in der Schriftenliste. ccmp-Ligaturen (Flaggen, Familie, Hautton→Grundform) baut
  `_emojiLigaturen` selbst, opentype.js 1.3.4 wendet ccmp nicht an.
- Regeln: Emoji = Versalhöhe („H") der Feldschrift, auf der Grundlinie → feste Gravurhöhe bleibt
  (geprüft 6,000 mm). Farbige Herzen ❤💙🖤… → volles ♥ (Noto zeichnet Farbe als Streifen/Karo);
  ♾ → ∞ als Text. Nutzer 17.10.: „es muss einfach ein Herz sein" — Schrift egal.
- Arial-Ersatz je Feld ignoriert Bildzeichen (opts.bild) → „Auf ewig ♥️" bleibt Schreibschrift.
- Schalter heißt „Emojis übernehmen" (Nutzer: „gravieren" passte nicht, gilt auch für PDF/Vorschau);
  gespeichert als `settings.json → emoji.gravieren` (Server-Whitelist index.js, Defaults per Schleife in
  file-remove.controller.js). Aus = erkannt, aber ÜBERALL weggelassen (auch ♾ → ∞ entfällt), kein Kasten;
  Leerzeichen um Weggelassenes werden aufgeräumt („Sara ❤️" bleibt mittig). Nutzer 17.10.: „genau so".
  Jeder Fund als ⚠ in status.txt (nicht nurRekla).
- Nur `type 'text'`; statische/Nummernfelder unverändert. PDF/PNG bewusst einfarbig wie der Laser
  (F02-PNGs gehen in Ezcad).
- Stichprobe 15.–17.10.: 9/220 Bestellungen mit Emoji, alle Armbänder (noch ohne Layout).
- Offen: Probeteil am Laser (❤ ♾ 🤍 bei 4–5 mm) durch den Nutzer.

Siehe [[arabischer-text-dxf-absturz]], [[feste-gravurhoehe]], [[export-trockenlauf]].

**Kasten-Hinweis seit 17.10. abends (`_tofuHinweis`):** Zeichen, die der gravierten Schrift auch nach Arial- und Emoji-Ersatz fehlen (z. B. Katakana „ツ", 303-2600466-2133949 in Monotype Corsiva), werden weiter als .notdef-Kasten ins DXF geschrieben, melden aber jetzt ⚠ „Zeichen „X" fehlt in Schrift Y — Kasten, vor dem Lasern ansehen" in status.txt (alle Feldtypen, nicht nurRekla; Unsichtbares als U+XXXX). Weglassen statt Kasten nur nach Rücksprache mit dem Nutzer. Trockenlauf alt/neu: 193 Dateien bitgleich, nur dieser Hinweis neu. Sicherung `src/backups/2026-10-17_vor-tofu-hinweis/`.
**Weglassen statt Kasten (17.10. abends, auf Nutzerwunsch):** gebaut und per Trockenlauf geprüft (nur 303-2600466 V3-Seite2-DXF ändert sich, Kasten 1,6×3,8 mm weg, Hinweis wird „nicht gravierbar — weggelassen"). Gravurtext (type text) in DXF + PDF/PNG gleich: `_fremdZeichen` (Zeichen, das auch Arial fehlt) öffnet den `_emojiTeile`-Weg, dort fallen fehlende Zeichen weg. LIVE seit 17.10. abends (Nutzer-Freigabe), Sicherung `src/backups/2026-10-17_vor-tofu-weglassen/`. `_tofuHinweis` („Kasten") greift nur noch bei statischen/Nummernfeldern.
