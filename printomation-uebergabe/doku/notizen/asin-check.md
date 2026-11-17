---
name: asin-check
description: "Reiter 🔍 ASIN (24.09.2026): Personalisierung je Produkt aus echten Bestellungen, Vorschau auf Amazons Produktbild, Layout-Abgleich, Entwurf; Profile in src/asin-profile/"
metadata:
  node_type: memory
  type: project
  originSessionId: 142e79e1-b071-4eab-83c0-b3dc4ab4f934
  modified: 2026-09-24T19:39:48.347Z
---

Gebaut am 24.09.2026 auf Nutzerwunsch („ASIN eingeben → letzte 7/14 Tage → Gravur, Rückseite,
Bild, Dropdowns erkennen, Layout-Vorschau"). Ort seit 25.09. (Nutzerwunsch): Reiter „ASIN-Check"
im Block „Arbeit" ZWISCHEN „Laden" und „Layout". Der frühere Reiter „Füllen" heißt seitdem
„Layout" (id/Code weiter `tab-fill`/`nav-fill`, Icon ▶ bleibt).

**Datenquelle:** Amazon gibt die Listing-Vorlage nicht heraus (nur Orders-Rolle, s.
[[sp-api-nur-orders-rolle]]). Die Bestell-JSON enthält aber je Produktseite
(`PreviewContainerCustomization`) das Produktbild (`baseImage.imageUrl`, CDN) und je
`PlacementContainerCustomization` Position/Größe — im **400×400-Raster** der Amazon-Vorschau
(`snapshot.dimension`, SVG-viewBox). Top-Level der JSON hat `asin` und `title`.

**Server:** `asin-check.controller.js`, Ablage `src/asin-profile/<ASIN>.json` (Formen = Struktur
ohne Werte, Statistik je Knoten: gefüllt/Länge, Dropdown-Werte, Schriften, Farben, Bild-
Endungen) + `_bestellungen.json` (orderId → ASINs, 100 Tage). KEINE Kundendaten. Gefüllt von:
Hook in `downloadAndSaveZip` (jeder Download, flush an den Batch-Grenzen), `lokalNachtragen()`
beim Serverstart (public/), und dem Scan `asinScanStarten` im amazon.controller: Kandidaten =
Ledger-Bestellungen des Zeitraums minus bekannte, getOrderItems alle 2 s (0,5/s), liest NUR
die JSON aus dem ZIP, stoppt bei 12 neuen Beispielen, bricht ab, sobald ein Download läuft.
Erster Echtlauf 24.09. (B0CFQDTPCF, 7 Tage): 600 Kandidaten, nach 180 geprüften (6,5 Min,
0 API-Fehler) 12 Treffer → Schluss; Profil 19 → 31 Bestellungen, Index danach 336 Bestellungen.

**Editor:** Gravur-Nummern über DIESELBEN Funktionen wie das Füllen (`_textGruppen` mit
untergeschobenem Knotenschlüssel als Text, `_slotTabellenBauen`) — keine zweite Zählung.
Layout-Abgleich prüft ALLE Layouts einer ASIN zusammen (F02: Foto-Layout = Bild, `_Text`-Layout
= Gravur 1–4). „Layout-Entwurf anlegen" legt Felder maßstäblich zueinander (nicht in mm) auf
die aktuelle Seite und setzt die Füll-ASIN.

**Befunde beim Bau:** 19 von 52 ASINs haben kein Layout (u. a. alle Armbänder) — ungeklärt, ob
die woanders graviert werden. Und der Fassungs-Fehler der Slot-Tabelle, s.
[[amazon-textcontainer-nummerierung]] (Nachtrag 24.09.).

**Runde 2 (25.09.):** Der Nutzer löste am Morgen versehentlich ein 14-Tage-Nachladen aus
(1.343 Bestellungen, ~54 Min) → seitdem: Prüfen erst bei vollständiger ASIN, Listenklick öffnet
nur das Profil, Amazon NUR nach Rückfrage mit Dauer (`/asin-check/scan/kandidaten`), Standard
7 Tage. Neu: Filter Alle/Mit/Ohne Layout + Suche, „🖼 Echte Bestellung" (Amazons bild-N einer
lokalen Bestellung derselben Fassung unter den Rahmen — passt exakt, gleiches 400er-Raster),
„↩ laden" je Layout, Fortschritt auch im Dialog. Behoben: `bestellungen` zählte Artikel
(Migration über `positionen`), Entwurf ließ `_loadedLayout` stehen (→ „ins Layout übernehmen"
hätte die Entwurfs-ASIN ins FREMDE Layout geschrieben), leere Füll-/Feld-ASIN = alle ASINs.
**Dropdowns:** Nutzer will sie für Felder (Bedingung „Gravur ja/nein", Inhalt „welche Gravur,
V3/V4"). Daten 25.09.: Rückseite ja/nein 33 ASINs, „Ohne Gravur" 7, Buchstabe 3, Farbe
(Armbänder) 4, Geschenkverpackung 23. Vorgeschlagen: Bedingung → Inhalt → Layout-Weiche.

Offen/Idee: `slotTabelle` könnte die langlebigen Profile statt nur 3 Tage public/ nutzen.
