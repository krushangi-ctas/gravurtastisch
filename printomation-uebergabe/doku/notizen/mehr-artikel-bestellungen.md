---
name: mehr-artikel-bestellungen
description: "Mehr-Artikel-Bestellungen teilen sich die Bestellnummer — Zuordnung darf nie über orderId laufen, sondern nur über _orderKey/das Bestell-Objekt"
metadata: 
  node_type: memory
  type: project
  originSessionId: 96fcc33d-1c12-4426-9be6-532efbdc85d8
  modified: 2026-07-27T20:05:57.503Z
---

Eine Amazon-Bestellung kann mehrere personalisierte Artikel enthalten. `/orders` liefert
dann **mehrere Einträge mit identischer `id`**, die sich nur durch `itemFolder`
(`item-1`, `item-2`) und ihre JSON-Datei unterscheiden. Stand 27.07.2026: 9 von 155
Bestellnummern betroffen — und in mindestens zwei Fällen haben **beide Artikel dieselbe
ASIN**, sind über einen ASIN-Filter also nicht trennbar.

**Why:** Jede Zuordnung „Feld → Bestellung" über `orderId` verliert dadurch still einen
Artikel. Konkret gefunden am 27.07.2026 in `fillWithData`: die Kopplung von Text- an
Bild-Slots lief über `new Map(orders.map(o => [o.id, o]))` — bei doppelter id überlebt
nur der letzte Eintrag, also bekam Artikel 1 sein Foto, aber die Gravur von Artikel 2.
Das fällt beim Sichtprüfen kaum auf, weil Foto und Text plausibel aussehen.

**How to apply:** Artikel immer über `_orderKey(order)` (= `id|date|jsonDatei`) oder
direkt über das Bestell-OBJEKT identifizieren, nie über `order.id` allein. Wenn eine
Schleife eine Bestellung einem Slot zuteilt, das Objekt merken (z.B. `imgOrderBySlot[i]`)
statt es später per id nachzuschlagen. `textCache` ist bereits korrekt nach `_orderKey`
verschlüsselt — die Falle entsteht erst beim Rück-Nachschlagen.

Regressionstest: „Misch-Layout: jeder Artikel bekommt seine eigene Gravur" in
`src/tests/run-tests.js`. Siehe auch [[stornierte-bestellungen-im-export]] (dort erklärt
dieselbe Mehrfach-Struktur die „gleichen Fotos") und [[amazon-customization-json-struktur]].

**Nachtrag 10.09.2026 — Re-Download mischt die item-Ordner.** `downloadAndSaveZip`
schrieb in einen bereits existierenden `item-N/`-Ordner hinein, ohne ihn zu leeren.
Amazon liefert die Artikel einer Bestellung aber nicht in stabiler Reihenfolge: bei
`303-3566062-9309908` bekam item-1 um 10:02 „So much love <3" und um 10:53 (force-Lauf)
zusätzlich „Lisa". Danach lagen in BEIDEN item-Ordnern BEIDE Kunden-JSONs, und
`_findOrderJson` nimmt die erste — es stand auf beiden Feuerzeugen „Lisa", der zweite
Text war still weg. 6 Bestellungen waren betroffen. Fix: Ordner vor dem Schreiben mit
`fs.rmSync(..., {recursive:true})` leeren. Prüfrezept: jeder `item-N/` darf genau EINE
Nicht-`meta.json` enthalten.
