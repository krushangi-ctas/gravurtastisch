---
name: amazon-textcontainer-nummerierung
description: "Amazon nummeriert Gravurzeilen JE Container ab 1 — Vorder- und Rückseite kollidieren; Regel ist fortlaufendes Durchzählen über die Container"
metadata:
  node_type: memory
  type: project
---

**Das Problem.** Ein Produkt kann mehrere `ContainerCustomization` haben (Vorderseite,
Rückseite, Deckel …). Amazon nummeriert die Zeilen **in jedem Container neu ab 1**: Vorder-
und Rückseite heißen beide „Texteingabe 1/2/3". `getAllTexts` sortiert nach dieser Nummer
und lässt den späteren Container den früheren überschreiben → **die Vorderseite fällt weg,
die Rückseite landet vorne**. Belegt an `303-6888507-4752318` (07.09.2026): vorne „FÜR
OLAF / von Chrissi", zurückgeliefert wird „Ich Deins / Du Meins / Wir Eins".

**Die Regel (vom Nutzer am 10.09.2026 festgelegt):** *fortlaufend über die Container
durchzählen* — Container 1 bekommt Gravur 1…n, Container 2 macht bei n+1 weiter, egal ob
er 5 oder 15 Zeilen hat. **Innerhalb** eines Containers nach der Texteingabe-Nummer
sortieren, nicht nach der Reihenfolge im JSON: bei F02_Schw_V2 steht „Texteingabe 2"
(Mitte) VOR „Texteingabe 1" (Oben). Container ohne Textzeilen (Geschenkverpackung, Extras)
zählen nicht mit.

**Warum das sicher ist** — geprüft über **154 Bestellungen und 48 ASINs** (10.09.2026):
- 20 ASINs haben mehr als einen Text-Container, höchstens drei in einer Bestellung.
- Bei 11 ASINs schwankt die Container-Zahl zwischen Bestellungen (ein nicht gefüllter
  Container FEHLT einfach im JSON).
- In **allen 11 Fällen** ist die kürzere Fassung ein sauberer Anfang der längeren: es fällt
  immer nur hinten etwas weg, nie in der Mitte.

**KORREKTUR 12.09.2026 — „deshalb verschiebt sich nichts" stimmt nicht.** Die Prüfung sah
nur die *Container*-Zahl, nicht die Zeilenzahl INNERHALB eines vorderen Containers. Fehlt
die letzte ZEILE eines nicht-letzten Containers, sinkt `hoechste` — und `versatz += hoechste`
zieht alle folgenden Container um eins nach vorne: **Rückseitentext landet auf der
Vorderseite.** Belegt an `305-7801113-5450756` (B0HGN51WTG, Lauf 10.09.2026): vorne nur
„Gravur Mitte" = FRANK, die leere „Wunschgravur Oben" fehlt im JSON komplett → versatz 1
statt 2 → „Alles Gute zum Geburtstag" (Rückseite Zeile 1) rutscht auf Gravur 2 = Deckel.
Nachgezählt über **274 Positionen / 63 ASINs: genau 1 Treffer**, immer derselbe ASIN — also
selten, aber echt. Amazon ist dabei inkonsistent: `305-6958400-7273110` (gleicher ASIN,
Oben auch leer) liefert die leere Platzierung MIT.

**Am 12.09.2026 gelöst — `slotTabelle(asin)` in [public/layout-editor.html](public/layout-editor.html).**
Die Zahl der Slots ist eine Eigenschaft des LISTINGS, nicht der Bestellung, steht aber
nirgends in der JSON. Also je ASIN aus ALLEN vorliegenden Bestellungen lernen:
- `reihe` = Container-Reihenfolge der **vollständigsten** Bestellung (bei Gleichstand
  alphabetisch, damit dieselben Daten immer dieselbe Tabelle ergeben),
- `kap` = höchste je gesehene Zeilen-Nummer je Container,
- `offset` = Summe der Kapazitäten aller Container davor.

Der Container braucht dafür eine **stabile Kennung**, weil sein Index im JSON genau dann
wegrutscht, wenn einer fehlt: `ckey` = Name der Produktseite
(`PreviewContainerCustomization`) + Etikett des **benannten** `ContainerCustomization` —
„Front Side|Text 1", „Oberfläche 1|Text 2". Der namenlose Wrapper, unter dem die
Platzierungen hängen, darf die Kennung nicht überschreiben. In 281 Positionen kam kein
doppelter ckey vor. Amazon nummeriert die Container übrigens selbst mit („Text 1"/„Text 2") —
die Nummer wird aber ABSICHTLICH nicht zum Sortieren benutzt: bei B0DBZQT9WZ steht „Text 2"
im JSON vor „Text 1", und die Layouts sind gegen die Dokumentreihenfolge gebaut.

Die Walk-Logik steckt jetzt in `_textGruppen(wurzel)` (eine Quelle für `getAllTexts` UND
die Tabelle). Kennt die Tabelle einen Container nicht, zählt er wie früher hinten weiter —
nie schlechter als vorher.

**Abgesichert** mit Alt gegen Neu im selben Browser (Rezept in [[layout-editor-testen]]):
**281 Positionen, 278 identisch, 3 verändert** — genau die drei Lückenfälle, alle korrekt.
Danach beide Tagesläufe (11./12.09.) neu exportiert: **Datei für Datei byte-identisch**
(nur status.txt/PDF-Zeitstempel), weil keine der drei Bestellungen in diesen Sessions lag.
Einzelnachweis am Auftrag selbst per `?autoexport=1&onlyOrder=…`: „FRANK" sitzt jetzt in
der Mitte, „Alles Gute zum Geburtstag" auf **Seite 2** statt auf dem Deckel.

Von den drei Fällen hat nur B0HGN51WTG überhaupt ein Layout — B0GJFF624K, B0GJFK385G und
B0DBZQT9WZ gehören zu den **21 ASINs, für die es kein Layout gibt** (werden also nie
exportiert). Die Vorschau-SVG taugt übrigens NICHT als Ersatzsignal: sie enthält nur die
gefüllten `<text>`-Elemente, keine leeren Platzhalter.

Die Container unterscheiden sich am **Zeilen-Etikett** (`GRAVUR` gegen `GRAVUR RÜCKSEITE`),
nicht am Platzhalternamen — der heißt oft bei beiden „Texteingabe 1".

**Am 10.09.2026 umgesetzt.** `getAllTexts` sammelt jetzt die Container in Dokument-
reihenfolge, sortiert INNERHALB nach Zeilen-Nummer und zählt über die Container hinweg
fortlaufend weiter (`versatz += hoechste`). Die alte Doppelspur aus PRIMÄR-Pfad
(„Text N"-Wrapper) und FALLBACK 1 ist damit weg — eine Regel für alle Produkte.

**Absicherung: Alt gegen Neu im selben Browser** über die alte HTML per
`page.setRequestInterception` eingeschleust (Rezept aus [[layout-editor-testen]]), beide
Fassungen über ALLE Bestellungen laufen lassen und verglichen: **415 Bestellungen, 367
unverändert, 48 verändert**. Von den 48 betreffen nur vier Layouts überhaupt eines —
F02_Schw_V1 (5), F02_Schw_V5 (3), F02_Schw_V2 (1), F02_Silb_V2 (1). Kein K01-, FL-, S01-
oder F01-Layout ändert sich. In allen Fällen holt die neue Fassung verlorenen Vorderseiten-
text zurück, z. B. `028-7945091-9732358`: alt `["Moritz","Und","Josie"]`, neu
`["Ich liebe dich","Moritz","Und","Josie"]` — genau die Bestellung, bei der der Nutzer
„Moritz" statt „Ich liebe dich" auf dem Deckel fand.

`_warnSlotKollision` blieb als Netz drin und meldete nach dem Umbau nichts mehr — am 24.09.2026 als toter Code entfernt.
**Ein Zähler über `texts.length` taugt NICHT als Warnung** — eine Bestellung, die die
letzte Zeile leer lässt, liefert genauso wenige Zeilen wie ein fehlender Container
(13 Fehlalarme bei 8 Bestellungen, verworfen).

**NACHTRAG 24.09.2026 — jede Fassung eines Listings zählt für sich.** Baut der Händler ein
Listing um (F02-Feuerzeuge am 16.09.: Seiten „Front Side/Back side" → „Gravur Voerderseite/
Personalisier deine Rückseite"), mischte `slotTabelle` die alten Container VOR die neuen:
bei B0HFKYQM8B wurde der Deckeltext Gravur 5 statt 1, die Rückseite 6–8 statt 2–4 → leere
Gravuren. Auslöser: alte und neue Bestellungen gleichzeitig lokal — nach jeder Umstellung bis
zu 3 Tage, und bei jedem „Reklam."-Nachladen einer alten Bestellung (24.09. mit
028-1983702-4144349 passiert; zum Glück wurde danach keine neue V5-Bestellung exportiert).
Gelöst: Fassung = Menge der Seitennamen (`_seitenSig`), Tabelle je Fassung
(`_slotTabellenBauen`/`_slotFuer`); eine Bestellung mit fehlender Seite gehört zur Fassung,
die alle ihre Seiten enthält. NICHT durch Herausfiltern alter Seiten lösbar: B0HFKV4QC7 behielt
„Back side" und bekam „Gravur Voerderseite" davor. Alt/Neu im Browser: 198 Positionen, 178
gleich, 20 verändert — alle bei den gemischten F02-ASINs, alle korrekt. Siehe [[asin-check]].
