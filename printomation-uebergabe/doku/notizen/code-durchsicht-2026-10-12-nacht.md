---
name: code-durchsicht-2026-10-12-nacht
description: Nacht 11./12.10.2026 Durchsicht aller 11.10.-Änderungen (Gesichts-Automatik, Node 24, Puppeteer 25 …) — Tageslauf 12.10. geprüft ok; LIVE Mehr-Gesichter-Fix; großer Tag 200 s (protocolTimeout nötig); Vorschläge in vorschlaege-2026-10-12/ (Ledger-Ordnerfilter, Zeitumstellung, neu aufgesetzter Nacht-Patch)
metadata:
  type: project
---

Bericht: `/var/www/printomation/gravurtastisch-orders/CODE-DURCHSICHT-2026-10-12.md`. Live: Kommentar + Mehr-Gesichter-Gebiete in laser-pipeline.js (s. [[gesichts-automatik]]).
- **Geprüft ok unter Node 24/Puppeteer 25/node-cron 4:** SP-API, reload-order (Download+Entpacken), Export über Server, Reklamation Vorschau + Varianten mit Gesichtern, Cron feuert mit Zeitzone, Trockenlauf + Bedien-Test bitgleich, ESLint keine undefinierten Namen, npm audit 0, keine Deprecation-Warnungen.
- **Großer Tag (alle 216 /orders, alle Layouts, Fake-Session):** 200 s mit / 178 s ohne Gesichts-Automatik — protocolTimeout war nötig. Nur F02_Schw-Dateien unterscheiden sich. 57/57 Gesichter auf 15 ± 2 %.
- **vorschlaege-2026-10-12/:** aenderungen.patch = Nacht-Vorschlag 10./11.10. neu aufgesetzt (ohne protocolTimeout, dry-run sauber) + NEU Ledger-Ordnerfilter (Abruf las public/vendor/* als Bestellnummern → „mediapipe", „vergleich"; morgen „fonts", „onnxruntime", „yunet"; harmlos, TTL 90 Tage); v5-mehrseitig.js; zeitumstellung.patch (berlinTimeToUTC Versatz an Zielzeit; nur 4 Umstellungstage anders; durch Abrufmarke abgefedert). vorschlaege-2026-10-11 als ERSETZT markiert.
- Grenzfall: Rekla „Gesichter heller" + Automatik, zwei überlappende sehr helle Gesichter verfehlen das Ziel (Faktor-Grenze 0,4). Testbleche in exports/2026-10-11 Test werden nach 7 Tagen weggeräumt.
Verwandt: [[gesichts-automatik]], [[code-durchsicht-2026-10-11-nacht]], [[abhaengigkeiten-2026-10-11]].
- 126 „404“ je Export = /asin-check/<ASIN> ohne Profil, harmlos.
