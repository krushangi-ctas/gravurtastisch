---
name: standardbild-testbleche
description: "Ab 21.09.2026 festes Standardfoto für alle F02-Testbleche — Bestellung 304-0821813-3717956, plus warum die Testbleche jetzt aus der echten Pipeline kommen"
metadata: 
  node_type: memory
  type: project
  originSessionId: b4292132-afe5-4c11-962a-772d4bfa449f
  modified: 2026-09-21T09:09:46.190Z
---

**Standardfoto:** `public/2026-09-19/304-0821813-3717956/item-1/adb7298f-370c-4675-9a74-2b3ca434a35a.jpg`
(ASIN B0HFKYQM8B = F02_Schw_V5, Feld 33×32). Paar-Selfie, zwei Gesichter groß im Bild,
Innenbeleuchtung, dunkles + blondes Haar, dunkles Shirt mit heller Kette. Prüft genau
das, was die Ablese-Anleitungen fragen: Augen, Mund, Haarzeichnung, dunkle und helle
Flächen, feine Linien.

**Warum dieses:** `angleOfRotation: 0` und das Kundenbild deckt die Amazon-Fläche voll ab
(1242×2208 × 0,1659 = 206×366 auf 206×205) — also **kein Überstand** und **deterministisch**
renderbar. Damit greifen beide Fallstricke aus [[laser-regression-18-09]] nicht.
Zweimal gerendert, alle zwölf BMP bitgleich.

**Die Testbleche kommen jetzt aus der echten Pipeline.** Blech 1–4 wurden von einem
Wegwerf-Skript gebaut; deren Prozentwerte passten nie zur Produktion (Blech 1 nannte
37,3 % „wie heute", der echte Lauf desselben Tages lag bei 42,9–49,5 %). Rezept jetzt:
Puppeteer auf `http://localhost:3002/layout-editor.html`, `loadLayout(<id>)` als Erstes
(leerer Editor fragt nicht), dann `fields = [...]` mit `_imgSrc` + `_placement` setzen und
je Platz `_buildLaserCanvas(s, {only: fields[i]})` → `imgTo1BitBMP(r.c, r.dpi)`.
`ditherSettings` muss mitgesetzt werden — `renderFieldToCtx` liest daraus die Überstand-Farbe.
Bei `{only:…}` ist die BBox das eine Feld, also genau 650×630 px bei 500 DPI wie im
Vorlagen-Export. Leere `gravur.dxf`/`rueckseite.dxf` entstehen über `buildDXFContent` mit
`_text: ''` (387 Byte, keine Geometrie).

**Kundenfotos liegen nur ~2 Tage vor:** `public/<tag>/<order>/item-N/`, das echte Foto ist
die UUID-Datei (`findCustomerImageNames`), `bild-1/2/3.jpg` sind Amazon-Snapshots. Wer ein
Standardbild dauerhaft braucht, muss es wegkopieren — das Foto von Blech 1–4
(028-7945091-9732358) ist genau so verloren gegangen.

Siehe [[testblech-5-dichtetreppe]], [[f02-schwarz-einstellung]], [[layout-editor-testen]].
