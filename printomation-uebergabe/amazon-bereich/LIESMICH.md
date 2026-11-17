# Bereich „Amazon“ für Printomation

Eigenständiges Modul neben `printomation`. Printomation bindet es mit **einer** Zeile in
`src/index.js` ein (in `try/catch`, ohne diesen Ordner läuft die Gravur unverändert weiter) und
lädt im Editor nur `amazon.css` und `amazon.js`. Sichtbar ist es ausschließlich für den
Basic-Auth-Benutzer `entwickler`, über den Umschalter **Gravur | Amazon** in der Kopfleiste.

## Aufbau

| Ordner | Inhalt |
|---|---|
| `server/` | `index.js` (Einbindung), `verkaeufe.js` (API unter `/amazon/verkaeufe/*`) |
| `public/` | Oberfläche unter `/amazon-bereich/*`: `amazon.js` (Gerüst, Produktverzeichnis/Gruppen, Kacheln, Diagramm), `verkaeufe.js`, `experimente.js`, `produkte.js`, `links.js`, `texte.js` (Englisch), `amazon.css` |
| `abruf/` | Python-Abruf (stdlib + requests, kein venv): `fetch.py`, `datakiosk_fill.py`, `katalog.py`, `abruf.sh` |
| `abruf/data/` | `business.db` (SQLite), `fetch.log`, `cron.log`, `sicherungen/` (täglich, 14 Tage) |
| `.env` | eigene SP-API-Zugangsdaten mit Berichts-Recht (chmod 600). Printomations Zugang darf keine Berichte. |

Eigene Tabellen in `business.db` (nur hier, nicht bei Amazon): `experiments`, `produkt_gruppen` (Namen),
`produkt_zuordnung` (Variante → anderes Produkt / ausgeblendet), `katalog` (Bilder, Farbe/Größe), `meta`.

## Reiter

- **Verkäufe**: links Zeitraum + „Einzelner Tag“, „Weitere Einstellungen“ (Produktart, Sortierung, kleine ausblenden,
  Varianten zusammenfassen, nur B2B, Monatsreport, CSV) und Produkte (Bild, Suche — findet auch Layoutnamen wie „K01_Blau“,
  Alle/Top 5). Fünf Kacheln jetzt · Vergleich · %, die der Auswahl folgen; ein Diagramm (Auflösung oben rechts,
  „Vergleichen mit“ unten rechts), „Zu prüfen“, Produkttabelle. **Klick ins Diagramm** wählt den Tag (in der Wochen-/
  Monatsansicht die Woche/den Monat): Kacheln, Liste und Tabelle zeigen dann nur ihn (Vergleich: Vortag/Vorwoche/Vormonat
  bzw. Vorjahr), das Diagramm bleibt und markiert ihn. Produkte lassen sich in der Tabelle mit ▸ aufklappen: Varianten
  einzeln oder **nach Farbe / Menge** zusammengefasst (Merkmale aus Layoutname bzw. SKU, „K01_Blau_M10“); Klick auf eine
  Variante = nur sie ansehen. Gezählt werden nur Varianten mit Besuchen im Zeitraum, ohne Übersichtsseite und Ausgeblendete.
- **Experimente**: Liste links (laufen gerade mit Fortschritt / ausgewertet mit Urteil, ⋯-Menü: bearbeiten, beenden,
  wieder öffnen, löschen). Rechts oben **ein Satz** zum Stand (bereinigtes Urteil), darunter **Kacheln „Was sich verändert
  hat“** (roh, nach der Änderung gegen gleich viele Tage davor; Zeitraum Testzeit / 30 / 90 Tage / bis heute; dazu das ganze
  Konto als Maßstab) und das Diagramm (Kennzahl wählbar). „Mehr Details“: Wirkung nach 7/30/90 Tagen, je Produkt.
  Ein Test speichert die **Varianten (Kind-ASINs)** der gewählten Produkte (Spalte `asins`, fest) — ein späterer Umbau der
  Familien bei Amazon verschiebt die Messung nicht (FL04/FL05 hängen seit 18.10. an einer neuen Eltern-ASIN).
  Testdauer 7/14/30/90 Tage; laufende Tests komplett änderbar. „Erkannt, aber nicht eingetragen“ (Preissprünge je Produkt).
- **Produkte**: welche Varianten zusammen als ein Produkt zählen (in Verkäufe und Experimente). Standard = Amazons
  Familie (Eltern-ASIN); Familien, deren Varianten Amazon größtenteils umgehängt hat, folgen automatisch, abgehängte
  Einzel-ASINs bleiben in ihrer alten Familie. Inhaber kann umbenennen, Varianten in ein anderes/neues Produkt schieben,
  alte ausblenden (zählen in Summen weiter mit, aber nicht als Variante) und „Wie bei Amazon“ zurückstellen. Status je
  ASIN: aktiv / ruht / Übersichtsseite / ausgeblendet / verschoben / **ohne Layout** (keine Printomation-Layout-ASIN).
- **Links**: fertige Amazon-Links zum Kopieren/Öffnen — sauberer Produktlink `/dp/ASIN`, App-Link
  `https://laser.printomation.de/go?l=<land>&a=<ASIN>&<tag>` und Suchlinks: Suchbegriff (`/s?k=`), Marke/Verkäufer
  (`/s?rh=p_123%3A<ID>` bzw. `/s?me=<Verkäufer>`), Marke/Verkäufer + Suchbegriff (`rh=p_6%3A<Verkäufer>`), Suchbegriff mit `s=date-desc-rank` („Neueste Artikel“). Optional mit
  Attribution-Tag aus der Werbekonsole (ganzer Link oder `maas=…`, übernommen nur `maas`, `aa_…`, `ref_=aa_…`). Marke
  oder Verkäufer je Land aus ID oder eingefügtem Amazon-Link mit Filter (mehrere Marken `%257C`), gemerkt im Browser
  (`amz-li-marken-2`); Vorgabe für DE: eigene Marke `5515927` (gleichwertig: Verkäufer `A39Q604UXIR8Y4`, beide am 28.10.
  bestätigt). `public/go.html` ist über nginx `location = /go` OHNE Anmeldung erreichbar: öffnet die
  Amazon-App (iOS `com.amazon.mobile.shopping.web://`, Android-Intent auf `com.amazon.mShop.android.shopping`), sonst
  die Produktseite; baut nur Amazon-Adressen. Produkt aus der Liste (Variante = meistbesuchte der letzten 30 Tage,
  Suchbegriff aus dem Amazon-Titel) oder „Eigene ASIN eingeben“; Land wählbar (11 Marktplätze, gemerkt). Bewusst ohne
  Suchbegriff im Pfad (wird ignoriert), ASIN-Filter `p_78`, veraltete 2-Step-Felder (`field-brand`, `field-asin`),
  Warenkorb- und Bewertungslinks — Recherche 27./28.10.2026, Nutzerwunsch 28.10.2026.
- **Einstellungen** (unten links): Anmeldung + Abmelden, Sprache Deutsch | English, Kurzhilfe, Ansicht zurücksetzen.
- **Sprache:** Texte im Code mit `_t('deutsch')`, englisch in `public/texte.js`; fehlt ein Eintrag, bleibt es deutsch.
  Freelancer mit nicht-deutschem Browser bekommt automatisch Englisch (Umschalter auch oben rechts auf start.html).

## Bilder und Titel

Erst Amazons Hauptbild aus dem Katalog (`abruf/katalog.py`, Catalog Items API, alle 7 Tage je ASIN neu), sonst das
Vorschaubild der Personalisierung aus Printomations ASIN-Profilen, sonst der Anfangsbuchstabe. **Der Katalog braucht in
Seller Central die SP-API-Rolle „Product Listing“** für die App dieser `.env` (Entwicklerkonsole → App bearbeiten →
Rolle anhaken → App neu autorisieren → neuen Refresh-Token in `.env`). Ohne sie meldet `fetch.log`
„Katalog: Rolle … fehlt“ und es bleibt beim Rückfall.

## Zugänge

- `entwickler` = Inhaber: alles, im Editor über den Umschalter Gravur | Amazon.
- `freelancer`: landet auf `/amazon-bereich/start.html` (eigene Seite ohne Editor). nginx sperrt ihm alles außer
  `/amazon-bereich/`, `/amazon/verkaeufe/`, Schriften, `layout-editor.css`, `/wer-bin-ich` (Kundendaten!).
  Im Bereich: kein Abruf, keine Produktgruppen ändern, nur eigene Experimente ändern/löschen (server/verkaeufe.js, `anmeldung`).
- `gravur`, `zuschauer`: kein Amazon-Bereich.

## Abruf (Cron, `crontab -l`)

- `15 3 * * *` `abruf/abruf.sh`: 03:15 UTC = 04:15 Uhr Berlin (Sommerzeit 05:15), weit vor dem Bestellabruf (11/12 Uhr). Fehlende Tage plus die
  letzten 3 Tage neu (Amazon-Traffic reift 2–3 Tage nach), danach Katalog (Bilder, Titel) und Datenbank sichern.
- `*/15 * * * *` `abruf.sh --erststart`: tut nur etwas, solange es keine `business.db` gibt (Backfill ab 2025).
- Braucht Amazon länger als 20 min für einen Report, bleibt die Report-Nummer gespeichert (`meta offen:<tag>`)
  und wird beim nächsten Lauf weiter abgefragt.

## Prüfen

```bash
curl -s localhost:3002/amazon/verkaeufe/stand
tail -20 /var/www/printomation/amazon-bereich/abruf/data/fetch.log
```

## Tempo

`/amazon/verkaeufe/daten` (nur Tageszahlen) und `/produkte` (Verzeichnis: Namen, Bilder, Gruppen) antworten gezippt
(Node, nginx zippt nicht) und mit ETag aus Datenbank-Stand (+ Bilder-/Layout-Stand): unverändert → 304 ohne Inhalt. Der Browser lädt nur die nötigen Fenster (Zeitraum +
Vergleich; beim Vorjahr zwei getrennte statt eines ganzen Jahres). 30 Tage ≈ 35 KB statt 360 KB.

## Achtung beim Ändern

`public/` wird von Printomation direkt ausgeliefert — jede gespeicherte Änderung ist sofort live.
Größere Umbauten erst an einer Kopie testen. `server/` wirkt erst nach `pm2 restart printomation`.
