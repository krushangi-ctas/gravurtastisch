---
name: weisse-bilder-2026-10-02
description: V7-Bestellungen 304-7702166-3322738 und 302-8487500-4763566 „Bild nur weiß“ — Nutzer macht Behebung UND Reklamation selbst (03.10.); nicht ungefragt anfassen
metadata:
  type: project
---

Gemeldet 02.10.2026 (F02_Schw_V7, Lauf 02.10. Plätze 2 und 8). Der Nutzer hat am 03.10. meine Reklamations-Exporte abgebrochen: „die 2. Aufgabe mache ich separat mit Behebung und auch Reklamation“.

Meine Messung (nur zur Info, kein Auftrag): beide Fotos sehr hell (Gesichter/Hände fast weiß, Herz mit Sonne), Zeichnung 12 %/11 % verloren (höchste des Blechs); hellste 2-mm-Zone 72–77 % im Grundlauf. Rezept „zu hell, Gesicht nicht erkennbar“ (inkMax 0,40 + localContrast 0,80 + densityTarget 0,22) deckelt auf 38–39 %, wirkt laut [[verlorene-zeichnung]] aber leicht flau. Siehe [[f02-schwarz-einstellung]].

**Achtung (festgestellt 03.10. 18:45 UTC):** Mein abgebrochener Aufruf hatte die erste Reklamation schon gestartet: `exports/2026-10-03 Reklamation/304-7702166-3322738/F02_Schw_V7/` mit inkMax 0,4 / localContrast 0,8 / densityTarget 0,22 (17:41 UTC). Nicht im Ezcad-Arbeitsordner. 302-8487500 lief nicht. Dem Nutzer gemeldet; auf sein OK am 03.10. ~18:50 UTC gelöscht (ganzer Ordner „2026-10-03 Reklamation“, entstand nur durch diesen Lauf). Lehre: Befehle mit externer Wirkung nicht mit `sleep` verketten — ein Abbruch stoppt dann nur den Rest.
