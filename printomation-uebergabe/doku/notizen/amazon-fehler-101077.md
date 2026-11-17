---
name: amazon-fehler-101077
description: Amazon-Listingfehler 101077 (merchant_suggested_asin marketplace-inkonsistent) → Feld einfach leer lassen
metadata: 
  node_type: memory
  type: reference
  originSessionId: 4d8b577b-3e7c-44e5-9db2-9dfdaa577f22
  modified: 2026-08-10T18:52:34.459Z
---

Amazon-Fehler **101077**: „Die Werte des Attributs Empfohlene ASIN des Händlers sind in
aktiven Marketplaces inkonsistent: <ASIN1>, <ASIN2>". Heißt: `merchant_suggested_asin`
hat für dieselbe SKU auf verschiedenen aktiven Marketplaces verschiedene Werte.

**Lösung (10.08.2026 vom Nutzer erfolgreich angewandt): das Feld einfach LEER lassen.**
Das Attribut ist nur ein Zuordnungs-Hinweis beim Anlegen; existieren die Kind-ASINs schon,
braucht es keinen Wert. Amazon akzeptiert das Speichern mit leerem Feld — kein Support-Fall
nötig.

Aufgetreten bei FL03 M100 (`FL03_Schw_M100` / `FL03_Blau_M100`, ASINs B0H2MYNFR9 und
B0H2MWYD8Q). Symptom im zweiten Blickwinkel: die **Lagerbestandsliste zeigt SKU und
Variantenfarbe vertauscht**, während der Variationen-Tab stimmt — beides derselbe Fehler,
nicht zwei. Bei Farbzuordnungen im Zweifel dem **Variationen-Tab** glauben.

Printomation ist davon nie betroffen: die Zuordnung läuft über die ASIN in der Bestellung,
nicht über dieses Attribut.
