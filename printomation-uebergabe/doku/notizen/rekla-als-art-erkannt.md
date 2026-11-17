---
name: rekla-als-art-erkannt
description: "Rekla ③ zeigt „Als Foto/Grafik/Logo erkannt“ + EIN Knopf „Als Foto/Grafik rechnen“ (20.10.2026); neuer Pipeline-Schalter grafikErzwingen; LIVE seit 20.10. ~19 Uhr"
metadata:
  type: project
---

Anlass [[rekla-303-2788363-glitzer-grafik]]: Nutzer will keine Schwellen-Knöpfe, sondern sehen, wie erkannt wurde, und
einmal in der anderen Art rechnen können. Bewusst anders als der am 08.10. entfernte Schalter „Als Grafik gravieren“.

**Wie:** `_rfArtLesen` liest die belegung.txt des Rekla-Laufs (`/rekla/bilder` → `ordner[].dateien`, Parser
`_ezBelegungLesen`) → `z.erkannt` {foto|grafik|logo}. Dafür steht Grafik (Schwelle) jetzt in der belegung.txt — Abschnitt
„ALS GRAFIK GRAVIERT (Schrift, Zeichnung, zweifarbig)“, NUR im Rekla-Lauf (`_reklaOrderId`); Tageslauf offen (Nutzer fragen).
Zeile `.rf-art` unter dem Kartentitel und oben in der großen Ansicht. `z.als`: 'foto' → laserJe `grafikAuto:false`,
'grafik' → `grafikErzwingen:true`. „zurück auf Standard“ setzt zurück, Versionen/„Diese nehmen“ behalten die Art.

**„Als Grafik“ = `grafikErzwingen`** (= `_grafikEinstellung`, Schwelle `threshold`), NICHT `alsGrafik` (= Verlaufs-Zweig,
Floyd + Konturen). Default false → bitgleich. Kein Server-Code, kein pm2-Neustart.

**Geprüft 20.10.:** Trockenläufe (`/var/tmp/rekla-art/trocken-rekla.js`) 303-2788363 + Foto 028-2195509: ohne Knopf alle
BMP/DXF bitgleich, Glitzer als Foto 0,8 → 1,7 % schwarz, Schrift voll. Tageslauf alt/neu 225/225 gleich. Oberflächentest
mit nachgestelltem Server (`ui-test.js`). Deploy `/var/tmp/rekla-art/deploy.sh` (erkennt Basis per md5).

Nebenbefund: Maschinen-Blech zeigt Marken „Logo“/„Grafik“ nie — `notizen.logo` ist '' (falsy). Siehe [[grafik-weiche]], [[rekla-foto-nachbessern]].

**LIVE 20.10.2026 ~19 Uhr** (auf UI-Durchsicht-Stand). Zurück: tar -xzf sicherungen/2026-10-20-vor-rekla-art.tar.gz -C src. Vor Livegang durchgesehen: keine Lücke; belegung.txt-Abruf prüft jetzt HTTP-Status.

**Nachtrag 20.10. abends (LIVE):** Nach dem Umschalten zeigt die Zeile „Als Foto gerechnet“ statt weiter „Als Grafik erkannt“ (Nutzer: „Name hat sich nicht geändert“). Schritt ④ heißt „Speichern & herunterladen“ statt „Gravieren“. Gemessen: bei erkannter Grafik bewirken heller/dunkler/Kanten/Punkte NICHTS (bitgleich) — erst nach „Als Foto rechnen“. Sicherung sicherungen/2026-10-20-vor-rekla-art-wortlaut.tar.gz.

**21.10. (LIVE, Nutzerwahl):** Bei Grafik mit Schwelle (`_rfNurSchwelle`: erkannt grafik ohne Verläufe/gemischt, oder `als`=grafik) sind „Alles ausprobieren“ und alle Einzelknöpfe grau, Hinweis „Bei Grafik wirken diese Knöpfe nicht — erst „Als Foto rechnen“.“ NICHT bei Logo und „Grafik mit Verläufen“ — dort wirken einzelne Knöpfe (inkMax, Konturen, Schnitt). Zur Wahl stand auch: heller/dunkler bei Grafik auf die Schwelle legen — nicht gewählt. Sicherung sicherungen/2026-10-21-vor-rekla-grafik-grau.tar.gz.

**Durchsicht 21.10. (Oberfläche LIVE ~10:40 UTC, auf den Amazon-Stand einer anderen Sitzung übertragen; Sicherung sicherungen/2026-10-21-vor-rekla-durchsicht.tar.gz):** Art-Wechsel setzt Foto-Einstellungen zurück (vorher blieb „Bild heller“ unter Grafik stehen); Neu-Laden während eines Laufs — vorher wurde die neu geladene Bestellung nicht gerechnet (live bestätigt), jetzt _rfNeueBestellung + Vergleich des Auftrags-Objekts statt der Nummer; Laufsperre in _rfSetze/_rfStandard/_rfWaehlen, „Diese nehmen“ grau im Lauf; Downloads prüfen HTTP-Status; „← zurück“ ohne Layoutname im onclick (_esc maskiert kein Apostroph). Urteile: Editor schickt als/erkannt; Server-Teil liegt fertig in /var/tmp/rekla-art/deploy5-server.sh (index.js-Zeile + pm2 restart), Neustart war für Claude gesperrt — Nutzer startet selbst.

**23.10.2026:** Server-Teil (Urteile mit als/erkannt) jetzt LIVE — deploy5-server.sh war nie eingespielt, s. [[durchsicht-2026-10-23-rekla-masch-dither]].
