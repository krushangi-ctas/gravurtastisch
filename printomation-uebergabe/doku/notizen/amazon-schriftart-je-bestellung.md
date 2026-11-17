---
name: amazon-schriftart-je-bestellung
description: "FontCustomization liegt als GESCHWISTER der Textzeilen (Arial-Fehler 12.09.2026); Amazon-Family-Namen sind unzuverlässige Aliasse für 4 Dateien"
metadata:
  node_type: memory
  type: project
---

**Wo die Kundenschrift im JSON steht:** `FontCustomization` hängt NICHT über den Textzeilen,
sondern als **Geschwister** unter dem Container „Text 1":

```
ContainerCustomization "Text 1"
  FontCustomization  family='Monotype'      ← Geschwister, steht VOR dem Text
  ColorCustomization
  ContainerCustomization (namenlos)
    PlacementContainerCustomization "Texteingabe 1"
      … TextCustomization inputValue='Natalia'
```

`getAllTexts` in [public/layout-editor.html](public/layout-editor.html) gab `font` nur
by value an die KINDER weiter → Geschwister sahen sie nie, Gruppe wurde mit `font=null`
gebaut → `{family:'Arial'}`-Fallback. Ergebnis: **104 von 127 Bestellungen (11./12.09.2026)
wurden in Arial graviert.** Behoben 12.09.2026 durch Vorab-Blick auf die direkten Kinder
(`kindFont`), BEVOR die Gruppe entsteht. Merksatz: bei diesem JSON reicht Vererbung nach
unten nicht — Geschwister-Knoten müssen mitgelesen werden.

**Die Amazon-`family`-Namen sind Aliasse, keine Identität** (geprüft per md5 am 12.09.2026):

| Amazon family | echte Datei |
|---|---|
| `Monotype`, `Monotype Corsiva`, `Monotyp` | `fonts/Monotype.TTF` (intern „Monotype Corsiva") |
| `Schreibschrift` | `fonts/Schreibschrift.ttf` (intern „Dalih", s. [[schreibschrift-dalih-font]]) |
| `Waltograph` | `fonts/Waltograph.ttf` (erst 12.09.2026 lokal hinterlegt) |
| `Arial` | `fonts/Arial.TTF` |

Die `fontUrl`-UUIDs unterscheiden sich pro Listing, obwohl die Datei byte-identisch ist —
**nie auf die UUID schlüsseln.** `loadOTFont` matcht über den Dateinamen-Stamm; ein Name
ohne lokale Datei (z. B. „Monotype Corsiva") fällt auf die Amazon-URL zurück. Die liefert
`access-control-allow-origin: *`, geht also im Browser — aber nur mit Internet. Darum jede
benutzte Schrift lokal unter EXAKT dem Amazon-Family-Namen ablegen.

Siehe [[amazon-customization-json-struktur]], [[export-forensik]].
