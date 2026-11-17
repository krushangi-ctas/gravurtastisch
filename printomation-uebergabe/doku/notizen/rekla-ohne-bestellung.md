---
name: rekla-ohne-bestellung
description: "Reiter Reklamation hat seit 26.10.2026 zwei Wege: „Mit Bestellnummer" | „Ohne Bestellung" (Layout wählen, Text/Bild eintragen); Aufträge als 000-Nummer in tmp/rekla-manuell, nie unter public/<Tag>/"
metadata:
  type: project
---

Nutzerwunsch 26.10.2026: Aufträge, die nichts mit Amazon zu tun haben oder deren Bestellung zu alt ist, im selben Reiter, aber getrennt. LIVE 26.10. ~08:45 Berlin (pm2 restart). Sicherung davor: `sicherungen/2026-10-26-vor-rekla-ohne-bestellung.tar.gz` (Pfade relativ zu src/).

**Wie:** `.seg`-Umschalter oben. „Ohne Bestellung": Layout wählen → die Maske zeigt, was das Layout und seine Partner zur selben ASIN füllen (`_rmSet`/`_rmFelder`): Bild N (palNum), Gravur N (palNum + comboPals, Beschriftung aus dem Feldnamen), Dropdown-Fragen (ddFrage → Auswahl aus ddTabelle). ddWenn/ddNur gelten als erfüllt (erster Wert). Gilt ein Layout für mehrere ASINs (Schlüsselanhänger), kommt „Produkt" dazu. Schrift: Vorschlag = häufigste Kundenschrift der ASIN laut ASIN-Profil, nur Dateien aus fonts/. Danach läuft alles über `_reklaGeladen` wie mit Nummer.

**Server:** POST `/rekla/manuell` (multipart, Feld `auftrag` + `bild<N>`) baut eine Bestell-JSON in Amazons Form: Texte in EINEM Container „Ohne Bestellung" (unbekannter ckey → Gravur N = Zeile N), Fotos mit buyerPlacement. Die Platzierung „flächenfüllend, mittig, Drehen in 90°" rechnet der Editor (`_rmPlatz`) mit composePlacement. Ablage: `tmp/rekla-manuell/<000-Nr>/item-1/`. meta.json enthält unter `manuell` Name, Ordner, Layout und Tag. Gelöscht wird nach 7 Tagen (file-remove). `findOrderDir` und `listOrderFiles` kennen den Ordner. GET `/rekla/manuell/:nr` liefert den Auftrag in /orders-Form für `fetchOrdersForFill`. Die Fotos liegen unter `/<Tag>/<Nr>/item-1/…` per Regex-Route. Der Reklamations-Ordner heißt wie der eingegebene Name (`reklaOrdnerName`). Ist der Name heute schon vergeben, gibt es „Name 2". Steht im Namen eine Amazon-Nummer, trägt die 000-Nummer deren Ziffern (gleiche letzte 7 Ziffern auf Nummernfeldern). /reload-order lehnt 000- ab.

**Warum nicht public/<Tag>/:** Dort sähen „Lauf wiederholen" über den ganzen Zeitraum, das Füllen im Editor und `asinCheck.lokalNachtragen` den Auftrag.

**Geprüft 26.10.:** auf einem Prüfstand (Kopie auf 3012) V5 + V5_Text + V5_PNG, Schlüsselanhänger/S01_Herz mit Produktwahl und Drehen, V3 mit Buchstabe D, „Änderungen übernehmen" (gleiche Nummer und gleicher Ordner), Erstellen, In Vorlage legen, alter Weg mit Nummer (nachgestellte /reload-order). Tageslauf-Trockenlauf alt/neu: 190 Dateien gleich bis auf Zeitstempel. Von Mitarbeitern noch nicht benutzt.

**Durchsicht 26.10. (LIVE ~10:15, Sicherung `sicherungen/2026-10-26-vor-rekla-durchsicht.tar.gz`):** Gemeinsame Helfer statt Kopien: `_layoutAsinSet` (Füll-Regel `singleAsinMode ?? true`, nur Text-/Bildfelder; auch lsAsinZeigen), `_asinFelder` + `_feldGravuren` (auch `_asinBelegung`/ddTextFeldAnlegen), `_schriftStamm`, `_asinProfil`, Server `artikelJson`. Die Layout-Liste lädt bei jedem Öffnen des Reiters neu (switchTab), Eingaben stehen in `_rm.werte` (`_rmMerken`). In der Produktwahl stehen die Partner-Layouts statt der Amazon-Titel. V7: Feld 54×33 mit −90°, Amazon-Fläche 340×205 quer — die Maske zeigt das Foto bewusst unrotiert, wie es der Kunde sieht.

Grenzen: Fehlt Bild 1, aber Bild 2 ist da, rutscht das Foto auf Bild 1 (`_kundenFotos` zählt nur gefüllte). V5_Text nimmt wie im Tageslauf nur Aufträge mit Foto. Verwandt: [[reklamation-einzelbestellung]], [[rekla-foto-nachbessern]].
