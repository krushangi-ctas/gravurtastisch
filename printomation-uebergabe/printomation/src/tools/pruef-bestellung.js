// Prüfskript: eine Bestellnummer per SP-API nachschlagen —
//   node tools/pruef-bestellung.js 305-1234567-1234567  (aus src/)
const axios = require('axios');
const config = require('../config');
const ID = process.argv[2];

(async () => {
  const t = await axios.post(config.amz.amz_auth_url, {
    grant_type: 'refresh_token',
    refresh_token: config.amz.refreshToken,
    client_id: config.amz.clientId,
    client_secret: config.amz.clientSecret,
  }, { headers: { 'Content-Type': 'application/json' } });
  const token = t.data.access_token;
  const H = { headers: { 'x-amz-access-token': token } };
  const base = config.amz.amz_sp_api_base_url;

  try {
    const o = (await axios.get(`${base}/orders/v0/orders/${ID}`, H)).data.payload;
    console.log('--- Bestellung ---');
    for (const k of ['AmazonOrderId','PurchaseDate','LastUpdateDate','OrderStatus','FulfillmentChannel',
                     'NumberOfItemsShipped','NumberOfItemsUnshipped','IsReplacementOrder','EarliestShipDate',
                     'LatestShipDate','SalesChannel','MarketplaceId','ShipmentServiceLevelCategory'])
      if (o[k] !== undefined) console.log(String(k).padEnd(28), JSON.stringify(o[k]));
    console.log('Bestellwert                 ', JSON.stringify(o.OrderTotal||null));
    console.log('Land                        ', o.ShippingAddress?.CountryCode || '(keine Adresse)');
  } catch (e) {
    console.log('getOrder FEHLER', e.response?.status, JSON.stringify(e.response?.data||e.message).slice(0,300));
  }
  try {
    const it = (await axios.get(`${base}/orders/v0/orders/${ID}/orderItems`, H)).data.payload;
    console.log('--- Artikel ---');
    for (const i of it.OrderItems || [])
      console.log(' ', i.ASIN, '| SKU', i.SellerSKU, '| Menge', i.QuantityOrdered,
                  '| Personalisierung:', i.BuyerCustomizedInfo ? 'JA' : 'nein', '|', (i.Title||'').slice(0,60));
  } catch (e) {
    console.log('getOrderItems FEHLER', e.response?.status, JSON.stringify(e.response?.data||e.message).slice(0,300));
  }
})();
