---
name: sp-api-v0-abkuendigung
description: "Amazon schaltet Orders API v0 (getOrders/getOrder/getOrderItems) ab — Umstellung auf v2026-01-01 bis 27.03.2027 nötig, Code nutzt noch v0"
metadata:
  node_type: memory
  type: project
  originSessionId: 2c7dd1a9-413d-497c-a744-9664b4026eb7
  modified: 2026-10-08T12:53:57.705Z
---

Amazon-Changelog (gelesen 08.10.2026): Orders API v0 — getOrders, getOrder, getOrderBuyerInfo, getOrderAddress, getOrderItems, getOrderItemsBuyerInfo — muss bis **27.03.2027** auf Orders API v2026-01-01 umgestellt sein. Neue API: alles in einem Aufruf (`includedData`), Token-API (RDT) entfällt; searchOrders 0,0056 Anfragen/s, Burst 20.

Stand 08.10.: Code nutzt v0 in amazon.controller.js (Abruf, orderItems, RDT-Pfad, Einzelbestellung) und tools/pruef-bestellung.js. Noch nichts umgestellt.

**Why:** ohne Umstellung kommen ab der Abschaltung keine Bestellungen mehr — der ganze Betrieb hängt daran.
**How to apply:** bei Arbeiten an amazon.controller.js oder Abruf-Themen daran erinnern; Umstellung rechtzeitig vor März 2027 einplanen. Verwandt: [[sp-api-nur-orders-rolle]], [[download-windowing-bug]], [[versandbestaetigung-2min-blindfenster]].
