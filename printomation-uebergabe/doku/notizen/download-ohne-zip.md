---
name: download-ohne-zip
description: "Seit 12.08.2026 keine ZIP mehr im Bestellordner; seit 14.08. alles flach in item-N/, Snapshots heißen bild-1, bild-2, …"
metadata:
  node_type: memory
  type: project
  originSessionId: b009d207-ad97-434d-afbc-85a3f302544e
  modified: 2026-08-14T11:06:00.584Z
---

`downloadAndSaveZip` (amazon.controller.js) legte bis 12.08.2026 zusätzlich die
Original-ZIP im Bestellordner ab. Das war eine komprimierte Kopie dessen, was ohnehin
ausgepackt wurde, und machte **die Hälfte des Platzes unter public/** aus (70 von 136 MB
bei 219 Bestellungen). Wer in alten Ordnern eine `.zip` sucht: die gibt es nicht mehr.

**Was eine Amazon-ZIP enthält** (durchgemessen) — seit 14.08.2026 liegt alles **flach in
`item-N/`**, der frühere Unterordner `vorschau/` ist weg:
- `<orderItemId>.json` — die Gravurdaten, Originalname
- `<orderItemId>.xml` — Zeichen für Zeichen dieselben Daten als XML → **wird verworfen**,
  das Einzige, was unwiederbringlich wegfällt
- `<uuid>.png/.jpg` aus `ImageCustomization.image.imageName` — das **Kundenfoto**, behält
  seinen Originalnamen (daran hängt die Zuordnung zur Gravur)
- `<uuid>.jpg` aus `<Oberfläche>.snapshot.imageName` — Amazons gerenderte **Vorschau je
  Oberfläche** → umbenannt zu `bild-1.jpg`, `bild-2.jpg`, … in JSON-Reihenfolge.
  Bei S01: **bild-1 = Vorderseite mit Kundenfoto, bild-2 = Rückseite mit der Gravur**
  (visuell bestätigt). Mehr Flächen ⇒ automatisch bild-3, bild-4, … ohne Code-Änderung.
- `<uuid>.svg` aus `<Oberfläche>.svg` — dieselbe Oberfläche als Vektor, Originalname

**Warum das gefahrlos ist:** [read-orders.controller.js](read-orders.controller.js) nahm
früher das ERSTE Bild im item-Ordner als Gravur-Bild — deshalb der Unterordner. Seit
14.08. sucht es das Kundenfoto **namentlich** über `findImageName(customizationData)`;
fehlt der Name oder die Datei, gibt es lieber gar kein Bild als das falsche. Helfer
`findSnapshotNames` / `findCustomerImageNames` liegen ebenfalls dort und werden von
amazon.controller importiert.

Der Zusatzdatei-Block ist in try/catch: eine fehlgeschlagene Vorschau darf nie eine
Bestellung in die Dead-Letter-Queue schicken. Ordner **vom 12.08. und früher** haben die
Snapshots gar nicht (alte Logik, sie steckten nur in der ZIP) — kein Bug, nur Altbestand.
