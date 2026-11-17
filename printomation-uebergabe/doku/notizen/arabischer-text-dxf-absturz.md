---
name: arabischer-text-dxf-absturz
description: "Arabischer Gravurtext — Arial ließ die ganze Layout-DXF abstürzen (GSUB Typ 7), Schriften ohne arabische Zeichen gravierten Kästchen; beides behoben 15.09.2026"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7f08fa25-b6d2-4437-b01b-78ef67ec0bd7
  modified: 2026-09-15T13:26:25.882Z
---

**Zwei Fehlerbilder, beide am 15.09.2026 im Tageslauf gefunden und behoben:**

1. **Arial + Arabisch → ganze DXF fehlt.** `K01_Schw_Satz1_Seite1.dxf` ❌ `lookupType: 7 - substFormat: 1
   is not yet supported` (Bestellung `306-7317277-3851541`, „محمد الحكمدار"). Die Exception aus
   `otFont.getPath` kippte das ganze Blech → alle 9 Stifte fehlten. Schon am 05.09. passiert (6 Stifte).
   Ursache: `fonts/Arial.TTF` hat im GSUB nur Extension-Lookups (91 × Typ 7), opentype.js 1.3.4 kennt
   Typ 7 nicht. Fix: `_gsubExtensionAuspacken(font)` in `loadOTFont` (Hülle entfernen → Typen 1/2/4/6;
   die arabischen Features brauchen nur 12/41/63, alle unterstützt).
2. **Schrift ohne arabische Zeichen → Kästchen, status ✅.** `F02_Schw_V7/rueckseite.dxf`, Bestellung
   `028-1051647-0105146`, drei arabische Zeilen in „Monotype Corsiva" → .notdef-Rechtecke. Fix:
   `loadOTFontFuerText` — fehlt der Kundenschrift ein sichtbares Zeichen, das Arial hat, wird das FELD in
   Arial graviert (Log: „… hat keine Zeichen für … — Feld wird in Arial graviert"). Fehlt es auch in
   Arial (❤ ♡ 🤍), bleibt alles wie bisher.

**Absicherung:** 444 echte Gravurtexte in allen 4 Schriften: Nicht-Arabisches bitgleich. Dazu der
ganze Tageslauf als Trockenlauf alt/neu (s. [[export-trockenlauf]]): 171 Dateien identisch, anders nur
K01_Schw (neu da) und F02_Schw_V7/rueckseite.dxf, sonst nur Zeitstempel.

**Nachexport 15.09.:** K01_Schw-DXF in `exports/2026-09-15/K01_xxx_M1/`, rueckseite.dxf in Tagesordner
UND `_Vorlage/F02_Schw_V7/` ersetzt, status.txt nachgetragen. Originale + alte HTML:
`tmp/alt-exports/2026-09-15_arabisch-fix/`, `backups/2026-09-15_vor-arabisch-fix/`. Ob die F02-Rückseite
vorher schon mit Kästchen graviert wurde, war offen.

**Nicht gelöst:** Kreis-Text setzt Zeichen einzeln → Arabisch dort unverbunden und in falscher
Reihenfolge. Hebräisch formt/spiegelt opentype.js gar nicht.

Siehe [[export-forensik]], [[amazon-schriftart-je-bestellung]], [[k01-raster-mengenstufen]], [[f02-vorlagen-betrieb]].
