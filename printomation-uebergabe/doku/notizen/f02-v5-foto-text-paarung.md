---
name: f02-v5-foto-text-paarung
description: "Behoben 25.09.2026 — F02_xxx_V5_Text zählte fotolose Bestellungen („Ohne Gravur\") mit → Deckel-/Rückseitentexte einen Platz neben dem Foto (19./20.09. erzeugt); jetzt nimmt der Text-Partner nur Bestellungen mit Foto"
metadata:
  node_type: memory
  type: project
  originSessionId: 142e79e1-b071-4eab-83c0-b3dc4ab4f934
  modified: 2026-09-25T07:23:17.357Z
---

**Mechanik:** Beim V5 stehen Foto und Deckel-/Rückseitentext in zwei Layouts mit EINEM Vorlagen-Ordner
(platzN.bmp + gravurN.dxf + rueckseite.dxf, s. [[f02-deckeltext-je-platz]]). Gepaart wird nur über die
Platznummer. Das Foto-Layout nahm `filter(_orderHasImage)`, das Text-Layout (Synchron-Modus,
`buildSyncedPool`, emptyMode 'leer') ALLE Bestellungen der ASIN. Eine „PERSONALISIERUNG GEWÜNSCHT? =
Ohne Gravur"-Bestellung hat weder Foto noch Text. Stand sie in date-desc vorn, rückte alles dahinter
einen Platz weiter.

**Belegt aus Log und Kaufzeiten (SP-API getOrder):** Am 19.09. Foto 5 / Text 6 Bestellungen, die fotolose
auf Text-Platz 2. Am 20.09. Foto 7 / Text 8, die fotolose auf Platz 1. Am 22.09. lag sie hinten, kein
Schaden. Den Versatz vom 20.09. sah der Nutzer am 21.09. am Werkstück („gravur1 leer, Name von Platz 1 in
gravur2"). Die Sitzung damals machte die x/y-Zuordnung verantwortlich und baute das Nachrücken in
`_deckelProPlatz` ein, das nur gefüllte Felder der Reihe nach vergibt. Das maskierte die Lücke beim
Deckeltext, **rueckseite.dxf verschob sich weiter** (Trockenlauf 25.09. belegt: eine Spalte zu weit rechts).

**Fix 25.09.:** `_istTextPartner(layout, alle)` ist nur wahr, wenn ein Vorlage-Layout ohne Bildfelder
den Ordner mit einem Vorlage-Layout mit Bildfeldern teilt; das trifft nur F02_Schw_V5_Text und
F02_Silb_V5_Text. `runAutoExport` setzt dann `_nurMitFoto`, und `getFillDateFilteredOrders` filtert auf
`_orderHasImage`. Nur im Auto-Export, manuelles Füllen unverändert. A/B-Trockenlauf mit echter Session
plus nachgestellter fotoloser Bestellung: platzN.bmp und belegung.txt bitgleich, gravurN.dxf bitgleich,
rueckseite.dxf und gravur.dxf jetzt auf dem Platz des Fotos.

**Restrisiken:** (1) Das Nachrücken bleibt. Eine Foto-Bestellung OHNE Deckeltext würde die folgenden
Deckeltexte einen Platz nach VORN ziehen (in 7 Tagen 0 von 45, das Feld ist wohl Pflicht). (2) Fotolos
mit bezahlter Rückseite fällt jetzt ganz heraus, statt zu verschieben (0× in 7 Tagen). Die Dropdown-
Prüfung soll das melden, s. [[dropdowns-analyse]]. (3) V5 hat multiPage false, V5_Text true — 11.10.2026 geprüft: ab Nr. 13 fehlten Foto UND
gravurN.dxf; gravurN je Satz live, multiPage-Umstellung wartet, s. [[code-durchsicht-2026-10-11-nacht]].
