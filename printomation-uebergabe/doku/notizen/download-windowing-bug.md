---
name: download-windowing-bug
description: "Bestellungen fehlen im Download, weil nach Kaufdatum statt Änderungsdatum gefiltert wird; Fix braucht persistentes Ledger"
metadata: 
  node_type: memory
  type: project
  originSessionId: adcb1fab-3861-4f42-a87a-28a170193411
---

Strukturelle Lücke im Amazon-Abruf (`amazon.controller.js` → `fetchOrders`): Das Zeitfenster filtert nach **Kaufdatum**, nicht nach Änderungsdatum. Der Amazon-Request sendet `CreatedAfter` (= die window-Startzeit, Variable heißt irreführend `LAST_UPDATED_AFTER`), und die clientseitigen Filter vergleichen gegen `PurchaseDate`.

**Folge:** Eine Bestellung, die am Lauf ihres Kauf-Zeitfensters noch `Pending` war (Status-Filter `Unshipped,PartiallyShipped,Shipped` schließt Pending aus) und erst danach auf Unshipped/Shipped wechselt, wird nie zurückgegeben — der nächste Lauf hat ein Kauf-Fenster, das ihren Kaufzeitpunkt bereits überholt hat. Beispiel-Fall: Order `303-6249614-2687505` (Kauf 08.07. 06:33 UTC, erst 09.07. Shipped) tauchte in KEINEM Log auf.

**Warum ein naiver Fix (auf `LastUpdatedAfter` umstellen) neue Probleme macht:** Es gibt KEIN persistentes „verarbeitet"-Ledger. Dedup läuft nur über `queue/<orderId>.json` (nach Verarbeitung gelöscht) + `public/<Tag>/<orderId>`-Ordner (auto-gelöscht nach `downloads.afterDays`, aktuell 3). Bei Update-Windowing gibt Amazon eine Order bei JEDER Statusänderung zurück (Versand, Erstattung, Adressänderung …) — passiert das nach dem Auto-Löschen, kennt der Dedup-Cache sie nicht mehr → **erneuter Download + Dublette im S01-Export**.

**UMGESETZT & deployt am 09.07.2026 (Variante A):** In `fetchOrders` sendet der Request jetzt `LastUpdatedAfter` (statt `CreatedAfter`); beide clientseitigen Nachfilter vergleichen gegen `LastUpdateDate` (statt `PurchaseDate`); Obergrenze bleibt clientseitig (kein `...Before` an Amazon). Neues persistentes Ledger `processed-orders.json` (`{orderId: ISO}`, TTL-Prune 90 Tage, atomar via `writeJsonAtomic`): `markProcessed(orderId)` beim Success in `manageProcessQueue`; `loadProcessedLedger()` in `manageFetchOrders` ergänzt das `downloadedOrderIds`-Set UND seedet fehlende Ordner-IDs ins Ledger, bevor deren Ordner nach 3 Tagen gelöscht werden. Ledger wurde einmalig aus den vorhandenen public-Ordnern geseedet (239 IDs). Read-only A/B-Test gegen SP-API bestätigt: enges Fenster um die Änderungszeit liefert den Nachzügler nur mit `LastUpdatedAfter`, nicht mit `CreatedAfter`.

**Offener Rest:** Manuelle Datumsbereiche (`/start-cron` Presets `custom`/`today`/`yesterday`) bedeuten jetzt „geändert im Zeitraum" statt „gekauft im Zeitraum" — UI-Label im Download-Panel noch nicht angepasst.

Verwandt: [[betriebs-konventionen]], [[export-forensik]], [[deployment-setup]].
