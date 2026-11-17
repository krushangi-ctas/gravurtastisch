---
name: versandbestaetigung-2min-blindfenster
description: Amazons getOrders liefert keine Bestellung, deren LastUpdateDate jünger als ~2 Minuten ist — eine eigene Sammel-Versandbestätigung kurz vor dem Downloadlauf macht dutzende Bestellungen unsichtbar
metadata:
  type: project
---

**Gemessen am 24.08.2026, sauber belegt:** `getOrders` liefert Bestellungen, deren `LastUpdateDate` jünger als ~2 Minuten ist, **grundsätzlich nicht** mit. Abfrage lief 12:00:00 Berlin, Amazons eigene Grenze lag damit bei 11:58:00:

| Zeitstempel | geliefert | fehlt |
|---|---|---|
| 11:57 | 10 | 0 |
| 11:58 | 0 | 14 |
| 11:59 | 0 | 17 |
| 12:00 | 0 | 16 |

**Der Mechanismus:** Der Nutzer hat um 11:55 seine Bestellungen als versandbereit übermittelt. Amazon schrieb daraufhin 73 Bestellungen den Zeitstempel neu (11:57–12:01). Damit war der **alte** Zeitstempel weg — der lag im Fenster und hätte sie geliefert — und der **neue** noch nicht abfragbar. Ergebnis: 67 echte Bestellungen fehlten.

**Kontrollgruppe (macht die Diagnose wasserdicht):** 28 Bestellungen lagen im selben Fenster, waren aber von der Übermittlung nicht angefasst → 28 von 28 geliefert. Und an den vier Tagen davor: null Verluste. Es ist also weder Status-Filter noch Code-Bug.

**KEIN Billbee.** Eine ältere Notiz schrieb den Sammelversand Billbee zu — der Nutzer hat kein Billbee angeschlossen, er übermittelt selbst aus Seller Central. Nicht wieder behaupten. Ebenso falsch war meine Zwischendiagnose „Amazons automatische Versandbestätigung" (`AutomatedShippingSettings` im Order-Objekt beschreibt nur die Carrier-Voreinstellung, nicht den Auslöser).

**Warum die Uhrzeit früher zu wandern schien:** weil der Nutzer täglich zu anderer Zeit übermittelt (21.08. 09:28, 22.08. 12:06, 23.08. 06:28, 24.08. 11:57). Der Zeitpunkt ist also steuerbar — erst Download, dann versandbereit melden.

**Nachweis-Rezept bei fehlenden Bestellungen:** per SP-API mit `CreatedAfter`/`CreatedBefore` (Kaufdatum, ändert sich nie) gegen `processed-orders.json` halten, aufgeschlüsselt nach Kauftag. Stornos und Pendings fehlen dort immer und zu Recht. Dann die Fehlenden nach `LastUpdateDate` histogrammieren — liegt ein enges Zeitband um die Laufzeit, ist es dieses Blindfenster.

**Offener Vorschlag (noch nicht gebaut):** zweiter Durchlauf über das Kaufdatum nach dem normalen Abruf, letzte 2–3 Tage. Das Kaufdatum wird nie überschrieben, dieser Durchlauf kennt das Loch nicht. Eine API-Seite pro Lauf, Ledger dedupliziert.

Verwandt: [[download-windowing-bug]], [[amazon-index-latenz]], [[lauf-wiederholen-knopf]], [[reexport-versandter-bestellungen]].
