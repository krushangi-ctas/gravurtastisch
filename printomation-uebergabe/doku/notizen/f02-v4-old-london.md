---
name: f02-v4-old-london
description: F02_Schw_V4/F02_Silb_V4 (Buchstabe in Old London) am 03.10.2026 gebaut — als TEXT mit fester Größe, nicht als Motive; Auto-Export AN seit 03.10. abends; Buchstabe seit 03.10. Baustein „Dropdown-Text“; dabei „nur Buchstabe“-Bestellungen als „ohne Gravur“ behoben und Schriftauswahl im Editor nachgerüstet
metadata:
  type: project
---

**Gebaut 03.10.2026.** ASINs Schw B0DBZKWBBH, Silb B0HGNCRWPT. 12er-Blech wie V3 (dxf, blech). Gravur 1 = Deckel („Wunschgravur Oben“, Kundenschrift), Rückseite 2 + Kombi 3/4 (V3-Seite-2 mit palNum −1). Buchstabe = Textfeld palNum 5, `ddFrage` „Buchstabe“, `ddModus` wert, `fontFamily` OldLondon, **`autoFit: false`, 79 pt** (Geviert 27,9 mm, „H“ 18,8 mm), Feld 30 × 22,6, y 38,1 (Reihe 1). Seite 1 trägt `ddWenn` PERSONALISIERUNG = Feuerzeug Personalisiert. **autoExport: true seit 03.10. abends** (Nutzer: „mach V3 und V4 auf Auto-Export“). Testbleche A–Z unter `public/exports/2026-10-03 Testblatt/F02/`.

**Warum Text statt 26 Motive (Empfehlung an den Nutzer):** Amazon setzt die Buchstaben mit fester Größe auf eine Grundlinie (gemessen: Oberkante aller Vorschauen y 198–200 px, M/D hängen tiefer). Genau das macht „Höhe: Fest“ (Cap-Oberkante des „H“ an der Feldoberkante). „Auto“ hätte jeden Buchstaben auf seine Tintenhöhe gezogen; die Old-London-Großbuchstaben sind 133–160 hoch (H, J, P, Y mit Unterlänge bis 27 %) → bis 17 % Größenunterschied. Eine Schriftdatei statt 26 Dateien.

**Die vier hochgeladenen Schriften:** OldLondon.ttf = OldLondonAlternate.ttf (Großbuchstaben pixelgleich), Olondona.otf = Olondon_.otf; TTF vs OTF nur 1–2,6 % Rasterabweichung, gleiches Design. In `src/fonts/` liegt nur OldLondon.ttf, alle vier Originale in `sicherungen/old-london-schriften/` (Nutzer hatte sie unter public/ abgelegt).

**Fehler gefunden + behoben (layout-editor.html):** `ohneGravur` kannte nur Text/Foto als Inhalt. Bestellung 306-2496778-9719500 (nur Buchstabe D) stand in der Packliste 03.10. unter „OHNE GRAVUR VERSENDEN“ + Hinweis „bezahlt, aber nichts eingegeben“ und bekam keinen Platz. Jetzt zählt eine gewählte Grafik-Antwort (`_DD_GRAFIK`: buchstabe/motiv, nicht gesperrt, nicht Nein) als Inhalt (`hatGrafik` in `_ddAuswerten`/`_ddEintrag`/`_ddAusInfo`) und füllt die steuernde Frage. Gegen 227 Bestellungen: nur diese eine ändert sich.

**Schriftauswahl nachgerüstet:** Text-Karte rechts hat jetzt „Schrift“ (`_ppSchrift`/`schriftSetzen`, Arial + Reiter Schriften, gilt für alle Felder derselben Gravur-Nr). Vorher ließ sich `fontFamily` NUR über die Layout-Datei setzen — der Nutzer fragte, ob er V4 selbst nachbauen kann. „Raster erstellen“ (`_rasterKopie`) kopiert alle Eigenschaften.

Echt-Test mit 9 gesicherten V4-Bestellungen (Mehr-Artikel 028-9244381-9884359 mit 5 Buchstaben): alle Paare Buchstabe↔Deckelname richtig. Siehe [[f02-v3-monogramm]], [[dropdowns-analyse]].

**03.10. abends:** Buchstabenfelder auf den Baustein [[dropdown-text-baustein]] umgestellt (`ddText`, Kasten 32 × 18,684 = genau 79 pt bei capPx 134). Der heutige Trockenlauf erzeugte auch die fehlende D-Gravur (F02_Schw_V4_9719500) — im echten Lauf 03.10. fehlt sie, Nutzer macht Reklamationen selbst.
