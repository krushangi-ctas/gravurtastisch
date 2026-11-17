---
name: stornierte-bestellungen-im-export
description: Bestellungen können NACH dem Download storniert werden — Export enthält dann stornierte Aufträge; System prüft Status nie erneut
metadata: 
  node_type: memory
  type: project
  originSessionId: acb7cf62-5607-4441-9e04-7346d997f468
  modified: 2026-07-23T14:12:44.833Z
---

Fall vom 11.07.2026 (S01 Schlüsselanhänger): Kunde bestellte am 10.07. abends 3× identisch (gleiches Foto byte-identisch, gleiche Gravur "Maxime A. / Thieler / 08.09.2025", ASIN B0DH55FZDR) — Bestellungen 302-7238829-0037915 (20:59), 302-4610284-0866723 (22:07), 302-9891995-2487520 (22:49, Berlin-Zeit). Der Abruf am 11.07. 11:01 Berlin lud alle drei als Unshipped herunter und exportierte sie; um 11:41 Berlin wurden die ersten beiden storniert (LastUpdateDate via SP-API `/orders/v0/orders/{orderId}`). Nur -2487520 wurde versendet.

**Why:** Das System holt Unshipped-Orders und prüft den Status danach nie wieder — stornierte Bestellungen bleiben im Export/PDF und würden mitgraviert. In Seller Central sind stornierte Bestellungen nur mit Status-Filter "Storniert" auffindbar (Standard-Suche zeigt sie nicht — daher "Bestellung nicht gefunden").

Bestätigter Zweitfall 23.07.2026: `306-4720713-3233107` (K01 Kugelschreiber blau, Gravur "Der Mimimi Ordnungsamt Buddie", 5,60 €). Timeline (Berlin): 12:00:50 Abruf noch gültig/Unshipped → 12:01:49 Download → 12:04:13 in `K01_Blau_Satz1` exportiert → **12:05:49 storniert** (LastUpdateDate via SP-API, OrderStatus jetzt `Canceled`, QuantityOrdered=0). Also ~90 Sek. NACH dem Export storniert — landete trotzdem auf der blauen Sammelplatte.

**Why:** Das System holt Unshipped-Orders und prüft den Status danach nie wieder — stornierte Bestellungen bleiben im Export/PDF und würden mitgraviert. In Seller Central sind stornierte Bestellungen nur mit Status-Filter "Storniert" auffindbar (Standard-Suche zeigt sie nicht — daher "Bestellung nicht gefunden").

**How to apply:** Bei "doppelte Fotos im Export" zuerst Personalisierung vergleichen (md5 der JPGs, Gravurtexte in Customization-JSON) — Mehrfachbestellung desselben Kunden ist wahrscheinlicher als ein Download-Bug. Text/Farbe eines Auftrags stehen NUR in `public/<datum>/<orderId>/item-N/<n>.json` (Feld `TextCustomization.inputValue`) — im DXF ist der Text zu Vektor-Outlines gewandelt, nicht greppbar; Farbe steckt im ASIN-Titel. Status-Check per SP-API mit Token aus config.js (refresh_token-Flow), read-only GET `/orders/v0/orders/{orderId}` (+ `/orderItems`). Möglicher Fix: Vor Export/Produktion Status-Recheck der Orders. Siehe [[download-windowing-bug]], [[reexport-versandter-bestellungen]], [[export-forensik]].
