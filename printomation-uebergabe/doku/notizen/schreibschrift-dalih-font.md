---
name: schreibschrift-dalih-font
description: "Schreibschrift.ttf = Font \"Dalih\" — Umlaut-Glyphen LEER; AUTOFIT_FONT_BOOST 1.2 eingeführt"
metadata: 
  node_type: memory
  type: project
  originSessionId: e2a848ee-65ef-4d71-b38e-96c8dce64b80
  modified: 2026-08-10T15:30:39.674Z
---

`src/fonts/Schreibschrift.ttf` heißt intern **"Dalih"** (Amazon-Family "Schreibschrift", 
der Nutzer nennt sie "Dalih"). Zwei Eigenheiten:

1. **ä ö ü Ä Ö Ü ß sind in der cmap gemappt, aber die Glyphen sind LEER** (0 Konturen, 
   loca-Länge 0) → Amazon-Vorschau UND DXF-Export lassen die Zeichen einfach weg 
   ("Schön" → "Sch n"). **Nachgemessen 10.08.2026 per `loadOTFont(…).charToGlyph(c).path.commands`:
   leer sind ä ö ü Ä Ö Ü ß É-Akzent (é) UND der Bindestrich `-` (U+002D)** — "Franz-Josef"
   graviert also als "Franz Josef" ohne Strich. Arial und Monotype haben alle diese Glyphen.
   Prüfrezept: die drei Fonts im Editor per `loadOTFont(f,{rawFamily:f})` laden und
   `charToGlyph(ch).path.commands.length === 0` testen; Gegenprobe im DXF — ein Feld, dessen
   Text nur aus leeren Glyphen besteht, erzeugt GAR KEINE Geometrie (fehlt als Zeile komplett).
   Real betroffen: Bestellung 306-3116846-3055559 
   (K10_Gem_M10, Export 04.07.2026). Nutzer erwägt Ersatz-Font (ähnliche Schreibschrift 
   mit vollem Zeichensatz). Beim Tausch: Amazon-Customization-Template UND Server-Datei 
   ersetzen; Dateiname `Schreibschrift.ttf` beibehalten (loadOTFont matcht über Dateinamen).

2. **Wirkt bei Auto-Fit ~20 % kleiner als Arial** (Unterlänge 0,34 em statt 0,21; x-Höhe 
   0,47 em). Der frühere Fix `AUTOFIT_FONT_BOOST = { schreibschrift: 1.2, dalih: 1.2 }` 
   ist seit **06.07.2026 OBSOLET** — siehe [[feste-gravurhoehe]]: `autoFitFontSizePt` 
   skaliert jetzt den TATSÄCHLICHEN Tinten-Block auf die exakte Feldhöhe (kein Boost, kein 
   Breitenlimit mehr). Die Konstanten `AUTOFIT_FONT_BOOST` / `AUTOFIT_FILL_W` stehen noch 
   in [public/layout-editor.html](public/layout-editor.html), werden aber nicht mehr 
   gelesen. **Nebenwirkung für Schreibschrift:** tiefe Unterlängen/Flourishes zählen zur 
   Gesamthöhe → die Buchstaben-Körper (x-Höhe) werden bei fixer Feldhöhe klein. Das ist 
   gewollt (Höhe muss exakt stimmen); falls zu klein → Feldhöhe erhöhen oder eigenes 
   Höhen-Ziel je Font einführen.

**Forensik-Befund 05.07.2026** (Reklamation "Rückseiten fehlen / Pink doppelt"): Die 
DXF-Dateien vom 04.07. waren nachweislich korrekt (per DXF→SVG-Rendering geprüft) — 
Rückseiten von 028-6088273/303-0674457 vorhanden, Slot 1 leer weil Bestellung 
304-1236747 "Keine Gravur auf der Rückseite" gewählt hatte. Leere Slots in Seite 2 
sind also NORMAL (Option "keine Rückseite"), die Slot-Reihenfolge ist `date-desc` nach 
purchaseDate. Doppelte identische Zeilen sind normal bei quantity > 1 (qty-Expansion). 
Zweite gleichfarbige Gravur kann von Multi-Item-Bestellung eines anderen Kunden stammen 
(z. B. 12er-Bestellung 302-3222112 enthielt 1 pinken Stift "Pauline").

Siehe [[export-forensik]], [[amazon-customization-json-struktur]].

**Ersatz-Suche:** 08.09. fünf Vorschläge per Text, ohne Bild (Alex Brush, Petit Formal Script, Yellowtail,
Dancing Script, Parisienne; Kennzahl x-Höhe/Versalhöhe, Dalih 0,50; Great Vibes 0,40 verworfen) — Testblech
angeboten, nie gemacht. 07.10. Bildvergleich mit 11 TTF in `../schriften-alternativen-dalih/` (ZIP + vorschau.png):
Comforter Brush (am ähnlichsten), Bilbo, Caveat, Hurricane, Moon Dance, Licorice, Zeyada, Dancing Script, Cookie,
Bad Script, Miniver (vom Nutzer auf Google Fonts gefunden) + die vier vom 08.09. (12–15). Dalih fehlen auch & € @ ?.
Alle 15 laufen mit dem Editor-opentype.js (vendor/); npm-opentype.js stürzt bei Bilbo ab (GSUB). Kennzahl x-Höhe/Gesamtblock
(= Buchstabengröße bei fester Gravurhöhe): Petit 0,51, Alex Brush 0,50, Bilbo/Moon Dance 0,46, Dalih 0,38, Parisienne 0,31.
Empfehlung Top 3: Alex Brush, Petit Formal Script, Bilbo (Conversion je Schrift NICHT messbar; keine öffentl. A/B-Tests gefunden).
**ENTSCHIEDEN 07.10.: Alex Brush.** Server: fonts/AlexBrush.ttf + FONT_ALIAS alexbrush→AlexBrush (layout-editor.html).
Schreibschrift.ttf (Dalih) bleibt für Altbestellungen. Amazon: Nutzer lädt sie in Seller Central als „Alex Brush“ hoch
(anderer Name würde nicht matchen → Alias ergänzen). Layouts mit fester Schrift „Schreibschrift“ ggf. umstellen.
