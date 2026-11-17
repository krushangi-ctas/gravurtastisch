---
name: code-audit-2026-09-26
description: "Komplett-Durchsicht 26.09.2026 — alle Funde am Abend behoben (Sicherung sicherungen/2026-09-25-27-vor-aenderungen.tar.gz (darin vor-komplettfix-26-09/)); Backend wirkt erst nach pm2 restart — Stand 27.09. 14 Uhr UTC noch NICHT neu gestartet (Auto-Mode verweigert Restart; Nutzer muss selbst)"
metadata:
  node_type: memory
  type: project
  originSessionId: e4ae542a-1bce-4384-8137-c90042995c02
  modified: 2026-09-26T22:07:24.157Z
---

Behoben am 26.09.2026 abends (Sicherung `/var/www/printomation/gravurtastisch-orders/sicherungen/2026-09-25-27-vor-aenderungen.tar.gz (darin vor-komplettfix-26-09/)`):
- Leere Session = leere Liste (vorher ALLE Bestellungen → Lauf ohne Neues exportierte die letzten Tage erneut). Session wird zentral in fillLayoutPages geladen.
- scheduler: Export-Aufträge warten statt verworfen zu werden (nur identischer Umfang fällt weg), pending-export.json ist jetzt eine LISTE (altes Einzelobjekt wird noch gelesen), `exportLaeuft()` exportiert — /vorlage/laden sperrt auch während des Exports.
- Umbenennen eines Vorlagen-Layouts ohne vorlageOrdner hält den alten Namen als Ordner fest (V6/V7 hatten keinen).
- Testblatt stellt ditherSettings/_fillCfg wieder her; Motiv-Neuupload verwirft Server- und Editor-Cache; regionAusgleich in `_REGELUNG_AUS`; Server-Store meldet jeden Speicherfehler selbst, Aufrufer prüfen das Ergebnis; loadOrders erneuert Slot-Tabellen; syncSlotCount je Typ+Nr.; Stapel >50 Seiten meldet Fehler in status.txt; Überstand-Farbe aus opts.invert; DXF-LAYER-Tabelle enthält Motiv/Foto_N wenn benutzt; Array-Master löschen nimmt Kopien mit, Strg+V über _rasterKopie; status.txt Berliner Zeit; fetchOrders wirft bei Token-Fehler; Motiv-DXF-Parser neu (LINE, keine Sammelpunkte), SVG-px-Einheit; Tag laden leert überzählige platzN.bmp/fremde vorschau.png.

**Zweiter Durchgang 26./27.09.:** Rezepte „Motiv zu dunkel / nur S/W / läuft zu" setzten inkMax wegen Regler-min 80 in Wahrheit auf 0,80 → Regler jetzt ab 20 (bis dahin in keiner protokollierten Reklamation benutzt); `_num` fällt bei NaN auf den Standard zurück; Übersicht lud alle 30 s auch unsichtbar/im Export; „Bild austauschen" graviert jetzt das neue Bild (_imgSrc/_placement/_originalImgs geleert); belegung.txt/vorschau.png in Berliner Zeit; Rekla-Hinweistext. Trockenlauf 27.09.: 180/180 gleich.

**Bewusst nicht geändert:** Umlaute im DXF-TEXT-Rückfall (nur ohne Schriftdatei aktiv; ohne Ezcad-Test nicht prüfbar).

**Belegt:** Trockenlauf Tageslauf 26.09. alt/neu 191/192 Dateien gleich, einzige Abweichung = neuer LAYER-Eintrag „Motiv" in F02_Schw_V2-DXF. Leere Session: neu 0 Produktionsdateien, alt 125. Bilanz +39 Zeilen (Begründungen).

Siehe [[code-audit-2026-09]], [[export-trockenlauf]], [[lauf-wiederholen-knopf]].
