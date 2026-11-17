---
name: sp-api-nur-orders-rolle
description: "SP-API-Zugang: Orders/Reports/Preise/Sales/Solicitations/Notifications gehen, Listings/Katalog/Feeds/Finanzen/FBA/Messaging sind 403"
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4d8b577b-3e7c-44e5-9db2-9dfdaa577f22
  modified: 2026-08-12T18:47:05.491Z
---

Die SP-API-Credentials in `.env` (`AMAZON_CLIENT_ID/SECRET/REFRESH_TOKEN`, Seller
`A39Q604UXIR8Y4`, Marketplace `A1PA6795UKMFR9`) sind **nur für die Orders-Rolle**
autorisiert. Gemessen am 10.08.2026:

**Vollständig durchgemessen am 12.08.2026** (alle Endpunkte einzeln aufgerufen):

- **200:** `/orders/v0/orders`, `.../orderItems`, `.../address` und `.../buyerInfo` (Adresse
  und Käufername/-mail kommen UNMASKIERT), `/reports/2021-06-30/...`,
  `/products/pricing/v0/price`, `/sales/v1/orderMetrics`, `/solicitations/v1/orders/{id}`
  (Bewertungsanfrage), `/notifications/v1/subscriptions/...` (404 = kein Abo, nicht gesperrt
  → Push-Benachrichtigungen wären möglich, brauchen SQS/EventBridge + grantless Token).
- **403:** `/listings/2021-08-01/...`, `/catalog/2022-04-01/...`, `/definitions/...`,
  `/uploads/...`, `/feeds/2021-06-30/...`, `/finances/v0/...`, `/fba/inventory/v1/...`,
  `/messaging/v1/...`, `/sellers/v1/marketplaceParticipations`.

**Bilder im Listing ändern** ginge technisch über `PATCH /listings/2021-08-01/items/{sellerId}/{sku}`
(`main_product_image_locator` / `other_product_image_locator_1..8`, jeweils öffentlich
erreichbare Bild-URL, kein Datei-Upload) — scheitert aber an der fehlenden Rolle. Dafür
bräuchte es in Seller Central die Rolle „Product Listing" UND eine NEUE Autorisierung
(der Refresh-Token trägt die Rollen fest in sich).

**Konsequenz:** Listing-Attribute (Farbe, `merchant_suggested_asin`, Preise, Marketplace-Liste)
lassen sich NICHT programmatisch prüfen. Nicht versuchen es zu umgehen — stattdessen den
Nutzer nach dem Lagerbestandsbericht je Marketplace fragen und die Datei auswerten
(Skill `amazon-lagerbestanddatei-analysieren`).

Praktisch beim Schreiben eigener Prüf-Skripte: das `axios` in `node_modules` exportiert als
ESM-Interop-Objekt — `require('.../axios')` liefert kein aufrufbares `axios.post`, es muss
`require('.../axios').default` sein. Token holen wie in
[amazon.controller.js](amazon.controller.js) über `config.amz.amz_auth_url` mit
`grant_type=refresh_token`, dann `x-amz-access-token`-Header.

Siehe [[amazon-fehler-101077]], [[amazon-index-latenz]].
