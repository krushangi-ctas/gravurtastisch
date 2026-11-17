---
name: ui-2026-10-20-lightburn-testblatt
description: "20.10.2026 (Mac-Sitzung): LightBurn-Konzept, Stift raus, Felder-Rahmen, Testblatt Text/Bild, Hauptknöpfe Kobalt + Code-Durchsicht — LIVE seit 20.10. abends (Oberfläche + Server)"
metadata:
  type: project
---

Auftrag 20.10.2026 (aus einer Mac-Sitzung per SSH): (1) LightBurn auswählbar + leichtes Konzept, (2) Stift-Option
im Maschinen-Bereich weg, (3) Rahmen um die Felder, (4) Testblatt: Testfoto nur wenn das Layout Bildfelder hat,
Schrift nur bei Text, (5) Layout-Durchsicht. Danach: 3 Design-Vorschläge umsetzen (Hauptknöpfe einheitlich Kobalt,
„Seite duplizieren" neutral, Dithering nur „Ins Layout übernehmen" als Hauptknopf) und kompletter Code-Durchgang
(doppelt, unnötig, tot, Kommentare) mit Schwerpunkt auf den Änderungen seit 10.10.

Stand: LIVE seit 20.10.2026 ~18:33 UTC (Nutzer: „mach es auch live“), Oberfläche + Server (pm2 restart). Sicherungen sicherungen/2026-10-20-vor-durchsicht-{oberflaeche,server}.tar.gz. Vorher nur vorbereitet. Getestet: Bildschirmfotos aller Reiter, Testblatt-Probeläufe, Pipeline-Vergleich
1386 Läufe mit echten Fotos 0 Abweichungen, Regler-Rundlauf 232 Layouts gleich, YuNet alt/neu gleich, Bedien-Test
und Export-Trockenlauf alt/neu (Ergebnis s. /var/tmp/ui-1020/alle-tests.log). Kommentar-Änderungen per Token-
Vergleich geprüft (nur Kommentare). Dateien: /var/tmp/ui-1020/final/ (Oberfläche) und final-server/ (index.js,
vorlage.controller.js, lesen.py); Liste aller Änderungen /var/tmp/ui-1020/aenderungen.md.
Einspielen nur auf „mach es live": deploy.sh (statisch, kein Neustart), deploy-server.sh (entfernt POST /vorlage/stift
+ stiftSchreiben, schreiben.py ins Archiv, pm2 restart). Beide prüfen md5 des Live-Stands, Idle, legen Sicherung an.

Live-Funde am 20.10. (nicht durch diese Arbeit): F02_Schw_V5 und F02_Schw_V5_PNG haben multiPage=false → bei >12
Bestellungen fehlen die Fotos von Satz 2 (heute 4 Bestellungen, per Reklamation nachgeholt; Satz2-Ordner hatte nur
Deckeltexte, weil V5_Text mehrseitig ist). Empfehlung: „Automatisch mehrseitig" an (Probe-Trockenlauf:
tool/trockenlauf-mehrseitig.js mit TL_MEHRSEITIG=F02_Schw_V5,F02_Schw_V5_PNG). activity.json (2000 Einträge, je
Exportdatei einer) verdrängt Download-Einträge → 7-Tage-Balken zeigt ältere Tage als 0.
Siehe [[maschinen-ausbau-ideen]], [[ezcad-reiter]], [[stil-kalk-graphit]], [[kommentare-behutsam-kuerzen]].
**20.10. ~18:37 UTC (Nutzer: „ja schalte ein"):** F02_Schw_V5 und F02_Schw_V5_PNG multiPage=true über POST /layouts
(If-Match), Sicherung sicherungen/layouts.json.vor-v5-mehrseitig-2026-10-20. F02_Silb_V5 bleibt false (heute 0 Bestellungen,
nicht beauftragt). Auch am 19.10. kam „Blatt voll … mehrseitig aus" bei V5. Satz 2 läuft dann wie bei V7: Archiv
„<Tag>/F02/F02_Schw_V5 Satz2/", im Maschinen-Reiter „+1 Satz" bzw. Knopf „Satz 2 laden".
