---
name: foto-gravur-workflow-ezcad
description: Freelancer-Workflow für Fotogravur mit Faserlaser — Photoshop Diffusion Dither 400 DPI → PNG → EZCAD 2.14.11 ohne weitere Bitmap-Optionen
metadata: 
  node_type: memory
  type: project
  originSessionId: 89292059-b483-456c-8738-535a61eac5e1
  modified: 2026-07-26T20:29:28.182Z
---

Der Nutzer graviert Fotos mit einem Faserlaser und EZCAD 2.14.11 (Lite). Referenz-Workflow stammt aus einem Freelancer-Video (`/var/www/printomation/gravurtastisch-orders/BMP Conversion.mp4`, analysiert 24.07.2026, Frames im Scratchpad extrahiert):

**Photoshop:** Foto öffnen → Ebene entsperren → **Strg+I invertieren** (weil Gravur auf poliertem Edelstahl hell erscheint; bei dunkler Gravur weglassen) → Mode Grayscale → **Mode Bitmap: 400 DPI, Diffusion Dither** → Export als PNG.
**EZCAD:** PNG importieren, nur Größe in mm setzen — kein Graustufe/Dithering-Häkchen, da bereits 1-bit gedithert. Marking-Params im Video: Default (Speed 500, Power 50 %, 20 kHz).

**Why:** Dithering in Photoshop ist besser als EZCADs internes und vorab sichtbar; EZCAD feuert 1 Puls pro schwarzem Pixel.

**How to apply:** Schwäche des Video-Workflows ansprechen: Bild VOR dem Dithern auf endgültige Gravurgröße in mm bei 400–500 ppi bringen (Image Size), sonst überlappen die Punkte nach dem Herunterskalieren in EZCAD (~2000 DPI effektiv). GIMP-Äquivalent: Modus Indiziert → 1-bit-Palette + Floyd-Steinberg.

**Seit 26.07.2026 in Printomation nachgebaut** (Laser-Tab im Layout-Editor) — Photoshop wird für Fotos nicht mehr gebraucht. Zwei Bedien-Fallen, die man nicht sieht:
1. Feinjustage im Laser-Tab wirkt nur auf den manuellen Export. Für den Auto-Export muss **„Einstellungen ins Layout übernehmen"** gedrückt werden (schreibt `layout.ditherSettings`).
2. Die Material-Presets sind reine Startwerte. Verbindlich wird erst das Testgitter (Speed/Power) auf dem echten Material; danach Gamma/Schwellenwert so nachziehen, dass die Gravur-Vorschau **30–55 % Schwarz-Anteil** zeigt (>65 % läuft auf Metall flächig zu). Der Wert misst seit 26.07.2026 nur die belegten Fotoflächen — vorher war er bei teilbefüllten Blättern wertlos (siehe [[export-forensik]]).

**Produktiv war der Laser-Modus am 26.07.2026 noch NICHT aktiv.** Von 107 Layouts exportieren 106 `dxf`, eines `pdf`; kein einziges hat `bmp` im `exportFormat`. Das einzige Layout mit Bildfeldern ist **„Schlüsselanhänger neu"** (29 Foto-Slots, Gruppe S01, `autoExport: true`) und stand auf `exportFormat: "pdf"` mit `ditherSettings.active: false`. Zum Umstellen: Layout-Einstellungen → Format **BMP** dazuhaken und Dithering-Material wählen; die Split-Schalter im selben Dialog mitspeichern, sonst greifen für Alt-Layouts ohne `splitSatz`/`splitSeite` die Migrations-Defaults. Realistische Größenordnung: nur **3–12 Fotos pro Tag** auf 29 Slots.
