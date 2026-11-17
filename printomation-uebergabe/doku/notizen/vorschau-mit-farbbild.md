---
name: vorschau-mit-farbbild
description: vorschau.png zeigt seit 21.09.2026 je Platz Kundenfoto in FARBE + Gravur wie am Werkstück + Deckeltext; der Deckeltext wird vom …_Text-Layout nachgezogen
metadata: 
  node_type: memory
  type: project
  originSessionId: b4292132-afe5-4c11-962a-772d4bfa449f
  modified: 2026-09-21T10:39:18.197Z
---

**Nutzerwunsch (21.09.2026):** „mach diese Vorschau so dass ich die Gravierung oben auch
sehe und das Bild in Farbe sehe. Dann kann ich sagen ob das Bild besser graviert ist oder
nicht."

**Umgebaut** (`_bmpVorschauBild` in layout-editor.html), je Kachel jetzt:
- Kopfzeile Platznummer, darunter der **Deckeltext** (⬛ Name) bzw. „kein Deckeltext"
- **links das Kundenfoto in Farbe** — aus `feld._imgSrc` über `composePlacement` mit dem
  Amazon-Zuschnitt, Überstand hier WEISS (die Kachel soll zeigen, was der Kunde geschickt
  hat, nicht wie der Laser damit umgeht)
- **rechts die Gravur**, aus genau dem Blob, der als platzN.bmp hochgeht. Bei invertiertem
  Material per `ctx.filter='invert(1)'` gedreht, damit hell = graviert = wie das fertige
  Werkstück. Vorher war es auf schwarzem Feuerzeug genau verkehrt herum.
- Fußzeile Bestellnummer

Vierter Parameter `opts = { texte, invert, felder }`. `opts.felder` ist nötig, weil beim
Nachzug (s. u.) in `fields` die Textseite steht und die Farbkachel sonst leer bleibt.

**Der Deckeltext-Nachzug — der knifflige Teil.** Bei F02_xxx_V5 stehen die Deckelnamen in
einem EIGENEN Layout (`F02_Schw_V5_Text`), und das Foto-Layout läuft im Export **zuerst**
(am Server-Log geprüft). Die erste Vorschau kennt die Namen also nicht. Deshalb:
- Das BMP-Layout hinterlegt `slots`, Titel, `proPlatz`, `invert`, Gruppe, Ordner und die
  Bildfelder (`_img: null`, die Farbkachel rendert aus `_imgSrc`) unter
  `_laufNamen.vorlagen[<ordner>].vorschauDaten` — nur wenn es selbst keine Deckeltexte hat.
- Der DXF-Zweig des Text-Layouts baut die Vorschau damit noch einmal, mit den Texten aus
  `vorlageSeiten.get('0|0')` (sortiert `(y,x)` wie `_deckelTextFelder`), und lädt sie in den
  Arbeitsordner. In try/catch: die Vorschau ist eine Hilfe, kein Liefergegenstand, und die
  Fassung ohne Texte liegt schon da.

V6/V7 haben kein Text-Layout — dort steht zu Recht „kein Deckeltext".

**Geprüft am echten Tageslauf** (21.09.): Deckelnamen, Farbbild und Gravur erscheinen bei
V5, V6 und V7; alle `platz*.bmp` blieben dabei bitgleich. Der Nachzug loggt
„vorschau.png mit N Deckeltexten nachgezogen" — das erscheint nur im Server-Log, wenn
scheduler.js den Browser fährt.

**Fehlschluss, den man nicht wiederholen sollte:** Aus der `.ezd`-Kopie im Arbeitsordner
darf NICHT auf die Maschine geschlossen werden. `F02_Schw_V5R.ezd` dort ist vom 16.09. und
zeigt statische Hatch-Objekte plus Bilder mit `flags 0` — daraus habe ich am 21.09.
gefolgert, die Deckelgravur sei nicht eingerichtet, und den Nutzer gewarnt. Falsch: Als
meine `gravurN.dxf`-Zuordnung um einen Platz verschoben war, hat er das am Werkstück
gesehen. Bei statischen Objekten wäre mein Fehler unsichtbar geblieben. Die Maschine liest
die Einzeldateien also sehr wohl; die Kopie im Ordner ist nur ein alter Stand. (Ursache dieses Versatzes war laut 25.09. eine fotolose „Ohne Gravur"-Bestellung im Lauf vom 20.09., nicht die x/y-Zuordnung, s. [[f02-v5-foto-text-paarung]].)

**Nebenbefund, noch offen:** Der Tageslauf schreibt `belegung.txt` nur ins Tagesarchiv,
nicht in den Arbeitsordner — dort stand am 21.09. noch die Liste vom 18.09., während die
Gravurdateien vom 20.09. waren. Auch `laden()` in vorlage.controller.js kopiert sie nicht
mit (`ARBEITS_DATEI` erfasst sie nicht). Wer im Arbeitsordner nachsieht, welcher Platz
welche Bestellung trägt, liest die falsche Zuordnung. Bis zum Fix von Hand nachkopieren.

Siehe [[sprenkel-wegschneiden]], [[f02-vorlagen-betrieb]], [[ezcad-vorlage-dynamic-file]].

**Seit 12.10.2026:** vorschau.png liegt NUR noch im Tagesarchiv (<Tag>/<Gruppe>/<Layout>/), nicht mehr im Ezcad-Arbeitsordner _Vorlage/<Ordner>/; der V5-Nachzug mit Deckeltexten schreibt ins Archiv. Siehe [[maschinen-ausbau-ideen]].
