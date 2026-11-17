---
name: dropdowns-analyse
description: "Dropdown-Auswertung 25.09.2026 (661 Bestellungen/7 Tage): fünf Fragen, Positionsregel „Frage steuert die Felder direkt dahinter\", Nein-Werte beginnen mit Ohne/Keine/Nein; Konzept in 3 Stufen, nichts davon gebaut"
metadata:
  node_type: memory
  type: project
  originSessionId: 142e79e1-b071-4eab-83c0-b3dc4ab4f934
  modified: 2026-09-25T07:23:28.859Z
---

Auf Nutzerwunsch („ich hab keine Idee, wie wir das angehen") alle Bestellungen 18.–24.09. ausgewertet:
97 aus public/, 564 per SP-API nur gelesen (Skripte und Rohdaten lagen im Session-Scratchpad, Rohdaten
danach gelöscht). Konzeptseite (Version 2 mit Einbauplan und Skizzen): https://claude.ai/artifact/4pYjd35Qs4hKhQjpPviCrX

**Befunde:** 88 % der 748 Artikel haben ein Dropdown (OptionCustomization, immer Blatt unter
FlatContainer, nie verschachtelt). Jede Frage passt in eine von fünf: Wird graviert (Personalisierung,
166), welche Seite (Rückseite 546 / Vorderseite 20, 31 % bezahlt), was (Buchstabe = Split-Monogramm auf
Feuerzeug, 4 ASINs ohne Layout, Amazon legt je Wert ein 400er-Overlay-Bild), welche Ausführung
(Armband-Farbe/Größe, 177), was ins Paket (Geschenkverpackung 515, davon 153 mit Box/Samtbeutel).
Aufpreise rund 2.050 € je Woche. Amazon verknüpft Dropdown und Feld nicht: 4× Rückseite bezahlt,
aber leer.

**Tragende Regeln (an allen 732 Ja/Nein-Antworten geprüft):** Eine Ja/Nein-Frage steuert die Text- und
Bildfelder, die auf DERSELBEN Produktseite hinter ihr stehen, bis zur nächsten Ja/Nein-Frage. Die
Beschriftung taugt dafür nicht, beim Cricket heißt das Rückseitenfeld „Gravur" in „Text 2". Leere
Felder lässt Amazon meist ganz weg. Jeder Nein-Wert beginnt mit Ohne/Keine/Nein. „Ohne Gravur" kann nur
die Vorderseite meinen (1× Rückseite trotzdem bezahlt und beschriftet).

**Konzept:** Eine Regelform „Wenn Frage = Antwort, dann Wirkung" an drei Orten: Bestellung (automatisch),
Layout („nimmt nur …"), Feld („füllen nur wenn …", „Inhalt aus Dropdown"). Stufe 1 automatisch erkennen
und prüfen (empfohlen), Stufe 2 Motiv/Text aus Dropdown (Monogramm braucht 26 Vektor-Buchstaben), Stufe 3
Layout-Weiche. Offen beim Nutzer: bezahlt-aber-leer nur warnen oder zurückhalten, unbezahlter Text
gravieren oder nicht, gibt es die Monogramm-Vektoren.

Nebenfund dabei: [[f02-v5-foto-text-paarung]] (behoben). Siehe [[asin-check]].

**F02 V3/V4 (geklärt 25.09., Nutzer: „f02 … feuerzeug!"):** die Buchstaben-Feuerzeuge der F02-Familie
„Wunschname und Wunschtext", ohne Layout. Zwei Designs, je Schwarz/Silber: geteiltes Monogramm
(B0DBZQT9WZ / B0HGMKY13N; „Gravur Oben" Deckel + „Gravur Mitte" im Spalt) und Fraktur-Buchstabe
(B0DBZKWBBH / B0HGNCRWPT; nur „Wunschgravur Oben"). Welches V3 und welches V4 heißt, ist offen. Plan: Kopie
von F02 V2 (12er, Motivfeld je Platz). Monogramm = Motivfeld „Inhalt aus Buchstabe", Muster
Monogramm_{Wert} (braucht 26 Vektordateien). Fraktur = Textfeld „Inhalt aus Buchstabe" in Fraktur-Schrift
(braucht nur die TTF/OTF). Amazons Option-Bilder sind 2000-px-Raster, kein Gravurersatz.

**LIVE seit 25.09.2026, 13:02 UTC** (Nutzer: „fang einfach an, ich schau es mir am Ende an“ — Durchsicht steht aus).
Rückfall-Kopien (Stand davor): `vor-dropdowns/` — existiert seit spätestens 03.10.2026 nicht mehr. ACHTUNG: Die V6-Reklamations-Sitzung hat um 13:25 UTC auf dieser Fassung aufgesetzt (Bereichsausgleich, eigene Sicherung vor-bereichsausgleich/). Die vor-dropdowns-Kopie NICHT mehr einfach zurückspielen, sonst ist deren Arbeit weg — ein Rückbau hieße: Dropdown-Teile gezielt entfernen.
- Kern: `_textGruppen(wurzel, ereignisse)`, getAllTexts liefert `auswahl/hatBild/hatText/titel`, `_ddAuswerten` (Positionsregel),
  `_ddCache` je _orderKey (`_ddVorbereiten` in fillLayoutPages, geleert mit _orderJsonCache am Laufende), `_ddEintrag` → hinweise,
  ohneGravur (nur mit ausdrücklichem Nein UND ohne Text/Foto). Filter in getFillDateFilteredOrders. `_DD_UNBEZAHLT_GRAVIEREN = true`.
- Packliste: `packliste.txt` je normalem Tageslauf im Tagesordner (Verpackung mit Summe, Ausführung, ohne Gravur, Hinweise);
  Hinweise gehen als `{hinweis}` an /export-status → status.txt „⚠“ und Übersicht Typ info (index.js).
- Feld (Text ohne Kombi, Motiv): Abschnitt „Dropdown“; Schlüssel ddFrage/ddModus/ddMuster/ddTabelle; gilt für alle
  gleichartigen Felder (gleiche Gravur-Nr bzw. gleiche Motivdatei). Motiv findet seine Bestellung NUR über Überdeckung
  (`_ddTraeger`), fehlendes Motiv → Warnung im Lauf. Flüchtig: _ddKey, _motivDatei, _ddLeer.
- Layout: „Nur Bestellungen mit“ unter ASIN MODUS, `ddNur` über _FILL_FIELDS (Vergleich jetzt per JSON.stringify, null = Schlüssel weg).
- ASIN-Check: Etikett je Frage („steuert Gravur 2–4 · automatisch“, Packliste, Feld/Weiche, „⚠ wird noch nicht verwendet“).
- Geprüft: synthetische Fälle (Ohne Gravur, bezahlt-leer, Nein+Text, Monogramm-Tabelle, Weiche, DXF genau 1 Motiv) und
  kompletter Tagesexport alt/neu: 179 Dateien bitgleich (ohne Zeitstempel), nur packliste.txt neu, 0 Fehler.
V3 gebaut 02.10. ([[f02-v3-monogramm]]), V4 gebaut 03.10. ([[f02-v4-old-london]]). Offen: belegung.txt kennt die Hinweise noch nicht.

**Runde 2 (25.09. abends, Nutzer testete: „erkennt Dropdowns, aber erfüllt noch nicht den Zweck“):** Er will am Feld
„Motiv wechseln“ und „gravieren ja/nein“, einfach genug für Mitarbeiter; Motiv je Buchstabe hat Vorrang, später Symbol,
Farbe/Ausführung, Anzahl Namen/Zeilen. Umgebaut: Feld-Abschnitt „Dropdown“ = (1) „Nur gravieren, wenn …“ (`ddWenn`
{frage, werte}; an Text-, Bild- und Motivfeldern; unvollständig = gilt nicht; gesperrte Antwort = nicht erfüllt),
(2) „Motiv je Antwort“: Kacheln je Antwort (Buchstaben immer A–Z), Klick → Motivauswahl mit Vorschaubildern + Suche,
Knopf „Automatisch zuordnen“ (Datei = Antwort oder endet auf _/-/Leerzeichen + Antwort, nur eindeutige). Tabelle
`ddTabelle`, '' = bewusst kein Motiv (keine Warnung), fehlt = Warnung im Lauf. Muster-Eingabe `{Wert}` aus der UI
entfernt (Engine liest `ddMuster` noch). Flüchtig neu: `_ddAus`. Test-Falle: nach dem Füllen haben Felder NEUE ids.

**Runde 3 (25.09. spät):** Nutzer fand „Motiv je Antwort“ nicht (er war auf einem Textfeld) und bemängelte, dass der
ASIN-Check-Entwurf kein Motiv anlegt; eigene Idee: „Dropdown-Option bei Felder, platzieren, ASIN suchen, dann Motive
oder Bedingung“. Umgesetzt: Palette „Felder“ → „+ Dropdown-Feld“ (Motivfeld mit motivDatei '' und `ddGruppe`,
Platzhalter-Rahmen im Editor, ASIN-Suche im Abschnitt setzt die Füll-ASIN); Gleichartigkeit über `ddGruppe`; Name
folgt der Frage. Regel-Motive werden jetzt über ihren PLATZ gebunden (Motiv k ↔ Platz k, Stapel: slotOrders, sonst
Bild-Plätze, Layout nur aus Motiven zieht selbst; Synchron: orders[base+k]) — Überdeckung nur Rückfall. Thema `motiv`
(symbol|motiv|design|sternzeichen|icon) neu; ASIN-Entwurf legt für Grafik-Fragen (buchstabe, motiv) ein Dropdown-Feld
an (mittig über dem „Mitte“-Textfeld, auf Spalte begrenzt). Textfeld: Knopf „◆ Motivfelder anlegen“.
Bug 25.09. abends (Nutzer: „Frage wird nicht gefunden“): `_ddFragen` rief nur den Rückruf des ERSTEN Aufrufers
auf. Lud der Reiter „Layout“ (_paintDdNur) zuerst, blieb das Feld auf „Fragen werden geladen…“. Jetzt Set
`warten`. Meine Tests hatten es verdeckt, weil sie danach selectF() riefen. Lehre: UI-Tests ohne erneutes
Anklicken fahren, so wie ein Mensch es tut.
Stand Editor 25.09. ~20:40 UTC: md5 2ef24b79 (V6-Sitzung: Logo-Weiche auf meiner 20:31-Fassung), Dropdown-Teile geprüft
intakt. Rückfall-Ordner vor-dropdowns/ ist damit dreifach veraltet — nie zurückkopieren, nur nach Nutzer-OK löschen.

**26.09.2026:** Das „Dropdown-Feld“ heißt jetzt Baustein **Motiv** (Fest / Je Antwort), siehe
[[motive-vektorgrafiken]]. Dropdown ist kein eigener Feldtyp mehr: Bedingung und „Text aus
Dropdown“ stehen im Bereich Dropdown des jeweiligen Felds. „Dropdown aufs Feld ziehen“ hat der
Nutzer vorgeschlagen, ich habe abgeraten (Regel gilt ohnehin für alle gleichartigen Felder).
26.09. ~22:10 UTC: Eine andere Sitzung hat das „Dropdown-Feld“ zum Baustein „Motiv“ umgebaut (Palette Felder, ziehen/Doppelklick,
`motivFeldAnlegen()`, rechts „Fest“ | „Je Antwort“, Karte BEDINGUNG). Nach dem Code-Review (md5 98df4bf9) geprüft: Hinweise,
ohneGravur, Packliste, Text-/Motiv-Regeln, Platzbindung, Entwurf, Fragenliste ohne Neu-Anklicken → alles grün.
Testvorlage jetzt 2026-09-25/028-2305611-2375524 (B0DBZQT9WZ), alte ist gelöscht (3-Tage-Frist).
