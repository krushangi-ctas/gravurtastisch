---
name: amazon-pdf-upload-ankuendigung
description: "Amazon PDF-Uploads ab 01.09.2026 — Editor kann PDF nicht laden (stiller Fehlschlag), gelöst durch pdftoppm-Rasterung beim Download"
metadata: 
  node_type: memory
  type: project
  originSessionId: 43634125-fd92-4d23-a087-a6a72447669b
  modified: 2026-08-19T14:29:01.302Z
---

Amazon lässt ab **01.09.2026** PDF-Uploads bei Bildanpassungen zu (E-Mail vom 18.08.2026), standardmäßig aktiv für alle Custom-Angebote. Die ZIP enthält dann zusätzlich: PDF-Original, Vorschaubild (JPEG+SVG), „Bild der PDF".

**Das Problem (am 19.08.2026 mit einer nachgebauten PDF-Bestellung real verifiziert):** Der Editor ließ das Gravurfeld **still leer** — kein Fehler, keine Log-Zeile, keine Toast-Meldung. Ursache: `loadImg` in layout-editor.html filtert `order.files` mit `/\.(jpg|jpeg|png)$/i` und steigt bei Nichttreffer per `return` aus. `findImageName` liefert dagegen brav den PDF-Namen durch. Im Auto-Export wäre daraus ein leer graviertes Werkstück geworden, ohne Hinweis.

**Die Lösung (implementiert 19.08.2026, zwei Stellen):**
1. `amazon.controller.js` → `downloadAndSaveZip`: jede `.pdf` im entpackten ZIP wird per `pdftoppm -png -scale-to 2000 -singlefile` nach PNG gerastert (poppler-utils, systemseitig vorhanden, keine Node-Abhängigkeit). Das PNG wandert über die bestehende Zusatzdatei-Schleife in den item-Ordner, die Original-PDF bleibt daneben liegen. Fehler sind nie fatal (try/catch, 60 s Timeout).
2. `read-orders.controller.js`: zeigt `imageName` auf eine `.pdf`, wird stattdessen die gleichnamige `.png` ausgeliefert. Fehlt sie, gibt es jetzt eine **laute** Warnung statt eines stillen leeren Feldes.

Zusätzlich meldet der Downloader den ersten PDF-Fund pro Serverlauf ins Aktivitäts-Log (`_pdfNoticeShown`-Riegel) — bewusst nur EINMAL, weil das Log auf 200 Einträge begrenzt ist und sonst echte Download-Fehler verdrängt würden.

**Verifiziert per Durchstich:** PDF → PNG (Placement-Cropping greift) → Editor-Feld → BMP 669×1063 px, 1-bit, 500 DPI, 35,7 % Gravuranteil + DXF mit Layer `Bild`.

`-scale-to 2000` ist die Obergrenze für die lange Kante: Vektor-PDFs skalieren verlustfrei, 2000 px decken bei 500 DPI rund 100 mm ab (genug für alle hiesigen Produkte), und der Auto-Export bleibt OOM-sicher.

**Gegen unbekannte Strukturen abgesichert (19.08.2026, vier Varianten durchgespielt):**
| Variante | Struktur | vor dem Auffangnetz |
|---|---|---|
| A | `image.imageName` = `.pdf` | ✅ |
| B | eigener Typ `PdfCustomization`, kein `image`-Knoten | ❌ still leer |
| C | `image.imageName` = Amazons Render-PNG, PDF liegt daneben | ✅ |
| D | PDF + zweites Bild im selben Ordner | ✅ |

Variante B war der gefährliche Fall: die gerasterte PNG lag bereits im Ordner, wurde aber nicht verknüpft, weil `findImageName` den unbekannten Knotentyp nicht kennt. Deshalb hat `read-orders` jetzt ein **datei- statt JSON-basiertes Auffangnetz**: liefert die JSON gar kein Kundenbild, aber im item-Ordner liegt `<X>.pdf` **und** `<X>.png`, wird die PNG genommen (plus laute Log-Warnung). Der exakte Namensbezug schließt Verwechslung mit den Vorschau-Snapshots `bild-1`/`bild-2` aus. Danach: 4 von 4 Varianten grün, und bei 260 echten Bestellungen greift das Netz nie (keine hat eine PDF).

Fehlerfälle ebenfalls geprüft: kaputte/passwortgeschützte PDF → `pdftoppm` wirft, der Download läuft weiter, und es gibt einen **roten Aktivitäts-Eintrag** ("PDF nicht in Bild wandelbar"). Fehlt die PNG bei vorhandener PDF, warnt `read-orders` laut statt still zu schlucken.

**Offen:** Es ist weiterhin unbekannt, wie Amazons echte PDF-Bestellung die `customizationData` aufbaut — der Test unterstellt, dass `ImageCustomization.image.imageName` einfach auf die `.pdf` zeigt. Kommt die erste echte PDF-Bestellung, die Struktur gegenprüfen (der Aktivitäts-Log-Eintrag weist darauf hin). Denkbar ist auch, dass Amazons mitgeliefertes „Bild der PDF" bereits ausreicht — dann wäre die eigene Rasterung Redundanz, aber keine falsche.

Das zweite angekündigte Feld `fontURL` ist **keine neue Information**: geprüft gegen 34 Items vom 18.08. — kein Treffer, nur das längst genutzte, tief verschachtelte `fontSelection.fontUrl` (s. [[amazon-customization-json-struktur]]). Kein Handlungsbedarf.
