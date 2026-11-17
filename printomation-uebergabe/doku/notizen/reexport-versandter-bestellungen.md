---
name: reexport-versandter-bestellungen
description: "Bereits versandte Alt-Bestellungen tauchen als Duplikat im Export auf, wenn Amazon ihr LastUpdateDate bumpt — Ledger-Reset 09.07. verschärft es"
metadata: 
  node_type: memory
  type: project
  originSessionId: b5f5326c-ad84-4495-84b6-d5501e8db5a6
  modified: 2026-07-23T14:13:07.538Z
---

Bestätigter Fall 23.07.2026: `303-3377025-8428363` (gekauft 01.07., 3 Positionen K01-Kugelschreiber: Amalia/Orange, Veronika/Blau, Marie/Schwarz; 28,88 €). Erstmals am 02.07. geladen & versandt (SP-API jetzt `Shipped`, 3/3 Items versandt). Tauchte 23.07. erneut im Auto-Export auf (K01_Oran/Blau/Schw) — als **Duplikat**, obwohl längst raus.

**Why:** Zusammenspiel dreier Dinge — (1) `fetchOrders` filtert über **`LastUpdatedAfter`** (nicht Kaufdatum) und (2) `OrderStatuses` enthält **`Shipped`** (dlStatus "Unshipped,PartiallyShipped,Shipped"). Wird eine bereits versandte Bestellung bei Amazon durch irgendein Nachverkaufs-Event aktualisiert (Rückgabe/Erstattung/Nachricht/Rechnung — hier LastUpdateDate 23.07 04:28 UTC), fällt sie wieder ins Fenster. (3) Das Dedup-Ledger `processed-orders.json` **beginnt erst am 09.07.2026** (ältester Eintrag 09.07., 0 davor — vermutlich Reset beim Code-Audit) → Aufträge, die VOR dem 09.07. verarbeitet wurden, sind nicht mehr geschützt und werden erneut heruntergeladen + exportiert.

**How to apply:** Bei "warum ist versandte Order X nochmal im Export?" → SP-API-Status prüfen (meist `Shipped`) + `LastUpdateDate` ansehen (frisch = Re-Trigger). Kein Handlungsbedarf beim Kunden, aber **nicht nochmal produzieren/versenden**. Fixrichtung: Post-Export/Pre-Produktion-Statuscheck (fängt auch [[stornierte-bestellungen-im-export]]) und/oder Ledger gegen versandte Orders robuster machen (kein Re-Export bei OrderStatus=Shipped). Siehe [[download-windowing-bug]], [[code-audit-2026-07]].
