---
name: amazon-index-latenz
description: "Fehlende Bestellungen im Auto-Export: Amazons Abfrage hinkt 30-90 Min nach, plus 2-Min-Schnitt des Laufs — nicht Pending"
metadata:
  type: project
---

Wenn ein Lauf „zu wenige" Bestellungen bringt, liegt es an der **Indexierungs-Latenz von Amazons getOrders**, nicht an Pending (das war am 31.07.2026 meine falsche Erstdiagnose — der Nutzer sah die Bestellungen korrekt als versandbereit).

**Gemessen am 31.07.2026:** Fünf fehlende Bestellungen direkt per SP-API abgefragt — alle `Shipped`, `LastUpdateDate` 09:58:01–09:59:17 UTC. Der Lauf startete 10:00:01 UTC, also ein bis zwei Minuten später, und bekam sie trotzdem nicht: die „Latenz-Diagnose" im selben Lauf meldete, dass die jüngste gelieferte Bestellung 38 Minuten alt war (spätere Läufe: 60 und 86 Minuten). Dieselbe Abfrage um 11:26 UTC lieferte 125 statt 99 Bestellungen.

**Zweite Hürde im eigenen Code:** `computeTimeRange` schneidet oben bei `jetzt − bufferMinutes` (2 Min) ab, und der Nachfilter vergleicht gegen `LastUpdateDate`. Bei Fenster-Ende 09:58:00.157 fiel eine Änderung um 09:58:01 also selbst dann raus, wenn Amazon sie geliefert hätte.

**How to apply:** Bei „Layout nicht voll" zuerst `LastUpdateDate` der fehlenden Bestellungen per SP-API prüfen (`/orders/v0/orders/<id>`, Skript im Projektstamm ablegen — Node löst `axios` sonst nicht auf) und gegen die Startzeit des Laufs halten. Verloren geht nichts: die untere Fenstergrenze überlappt 90 Minuten, der nächste Lauf holt sie nach. Praktischer Gegenzug: genug Abstand zwischen dem Versandbereit-Setzen und dem geplanten Lauf — ein zweiter Lauf am Nachmittag verkürzt nur die Verzögerung. Achtung dabei: Export-Dateinamen tragen keinen Lauf-Marker, ein zweiter Lauf am selben Tag überschreibt die Dateien des ersten.

Verwandt: [[download-windowing-bug]], [[ledger-zuruecksetzen]], [[export-forensik]].
