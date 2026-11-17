---
name: reklamation-einzelbestellung
description: "Reiter „Reklam.\" lädt eine Bestellnummer neu (am Ledger vorbei); seit 08.10. Layouts zur ASIN automatisch angehakt (Häkchen, mehrere möglich), Export aller in EINEM Lauf"
metadata: 
  node_type: memory
  type: project
  originSessionId: 457d7e54-ebca-472c-9725-cfbe98f0865b
  modified: 2026-08-25T16:05:32.053Z
---

Gebaut am 25.08.2026. Linker Reiter **⚠ Reklam.** unter „Arbeit": Bestellnummer eingeben → laden → Layout wählen → Gravurdatei erzeugen.

**Server:**
- `amazon.reloadSingleOrder(orderId)` — geht bewusst **nicht** über `manageFetchOrders`, weil dort der Dedup-Vorfilter eine bereits geladene Bestellung dauerhaft aussortiert. Holt Kaufdatum per `getOrder` (bestimmt den Tagesordner!), dann RDT + `fetchOrderItemsAndGetURLs`, legt die Queue-Datei an. Ledger bleibt unangetastet, `clearSession()` wird **nicht** gerufen — eine laufende Session überlebt.
- `POST /reload-order` — synchron (eine Bestellung dauert Sekunden), setzt `progress.running`, ruft danach `manageProcessQueue(null)`.
- `POST /export-single {orderId, layout}` → `schedulePuppeteerExport(3000, …, { onlyOrder, onlyLayout })`.

**Browser:** `runAutoExport` liest `onlyLayout` (wählt das Layout **per Name aus ALLEN** Layouts, ignoriert den autoExport-Haken) und `fetchOrdersForFill` liest `onlyOrder` (filtert auf die eine Bestellung).

**Foto-Gravur:** Bei S01 & Co. ist das Kundenfoto der eigentliche Zweck der Reklamation — dann braucht es gar kein Layout. Deshalb spiegelt `/reload-order` den Bestellordner SOFORT nach `exports/<heute> Reklamation/<Nummer>/` (nicht erst beim Export) und liefert `files[]` mit URL, Größe und Art (foto / vorschau / vektor / daten) zurück; der Reiter zeigt sie mit Vorschaubild, Kundenfoto zuoberst. public/ hängt unter „/", die URLs sind also direkt anklickbar.

**Export-Format steckt im LAYOUT**, nicht in der Reklamation (`exportFormat`: 148x dxf, 3x dxf+bmp, 1x pdf). Das PDF-Layout „Schlüsselanhänger neu" hat KEINE globalAsin — der ASIN-Vorfilter warf es deshalb raus und es gab nur DXF zur Auswahl. Layouts ohne hinterlegte ASIN nehmen jede Bestellung an und müssen immer angeboten werden.

**Amazon-Falle:** Auf eine unbekannte Bestellnummer antwortet die API teils mit **200 und leerem Payload** statt mit 404 — deshalb der eigene Zweig auf fehlendes `purchaseDate`.

**Verifiziert am 25.08.** mit `028-1091964-5063541` / `S01_Herz`: Neuladen ✅, Filter „1 Treffer von 188" ✅, nur das eine Layout lief ✅, Datei in `2026-08-25 Lauf 2/S01/S01_Herz_5063541_Seite1.dxf` ✅. Testdatei danach gelöscht — ein übrig gebliebener Export wird sonst versehentlich mitgraviert.

Verwandt: [[lauf-wiederholen-knopf]], [[versandbestaetigung-2min-blindfenster]].

**Seit 25.09.2026 je Layout ein Unterordner:** `<Tag> Reklamation/<Nr>/<Unterordner>/` (vorher
flach — bei Mehr-Artikel-Bestellung V5+V6 überschrieb der zweite Export platz1.bmp/.bat/vorschau
des ersten; `/export-upload` ignorierte `unterordner` für rekla). Bei 028-1983702-4144349 kam
deshalb „nur V5": Das Dropdown steht alphabetisch zuerst auf F02_Schw_V5, und ein zweiter Export
hätte den ersten überschrieben. Ein V5-Feuerzeug braucht ZWEI Exporte (V5 Foto + V5_Text Deckel),
beide landen im Ordner F02_Schw_V5. Nutzer bestätigte die Diagnose. Siehe [[mehr-artikel-bestellungen]].


**Seit 08.10.2026 Häkchen statt Dropdown, mehrere Layouts je Export.** Nach dem Laden sind die
Layouts zur ASIN angehakt — Regel `_asinLayouts` (dieselbe wie Füllen/ASIN-Check), nur
autoExport-Layouts, Reihenfolge wie gespeichert. Grund: Schlüsselanhänger S01 brauchen ZWEI
(„Schlüsselanhänger neu" = PDF-Foto + S01_Recht/Rund/Herz = DXF-Rückseite), vorher kam nur eins.
Geprüft an allen 219 ASINs: Mehrfachtreffer gibt es nur bei S01 (3) und F02 V5 Foto+_Text (2) —
immer zusammengehörig, nie Alternativen. Ohne Treffer: alle Layouts ungehakt + Warnung.
Technik: `/export-single {layouts[], alsGrafik, laser, laserFor}` → `onlyLayout` mit `\n`
getrennt; Editor-Laserwerte nur für `laserFor`, alsGrafik für alle. S01 ohne Rückseitentext →
DXF-Layout „keine passenden Bestellungen" (richtig, wie im Tageslauf).

**08.10. abends:** Schalter „Nur Layouts zur ASIN“ und „Als Grafik gravieren“ auf Nutzerwunsch aus dem Reiter entfernt (nur Treffer; ohne Treffer alle Layouts ungehakt). Der URL-Parameter `alsGrafik` im Export bleibt technisch erhalten.
