---
name: aufraeumen-2026-10-03
description: Seit 03.10.2026 Sicherungen gebündelt in sicherungen/ bzw. /root/sicherungen/; abends 33 GB Temp/Caches gelöscht (Platte 49→16 GB); Chromium-Profil-Leck (Snap-/tmp) jetzt nächtlich aufgeräumt
metadata:
  type: project
---

Nutzer: „hier sind so viele Dateien, bitte räum auf“ (Screenshots App-Ordner + /root). **Nur verschoben, nichts gelöscht.**

- `gravurtastisch-orders/` zeigt nur noch node_modules, src, sicherungen, package*.json, README.md (.env versteckt). In `sicherungen/` (chmod 700, enthält Kundenfotos): stand-2026-09-27/-29-freigegeben, alle vor-*, sicherung-bestellungen-2026-09-25-27, vor-monogramm-v3, old-london-schriften.
- `/root/` zeigt nur sicherungen/ und snap/ (snap = Chromium-Profil für Puppeteer, NICHT anfassen). `/root/sicherungen/`: 2026-10-02-zugaenge/ (nginx/htpasswd/index.js-Backups + **neue-logins-2026-10-02.txt mit Klartext-Passwörtern**, 600), printomation-backup-20260806-180220, quarantaene-2026-09-09 (Beweis aus dem Sicherheitsfund).
- Vorher geprüft: kein Programmteil greift auf diese Ordner zu (nur Kommentar in testfoto/URTEILE.md nennt vor-bereichsausgleich). Pfade in den Notizen nachgezogen.

**Neue Sicherungen künftig in `sicherungen/` anlegen**, nicht wieder lose in den App-Ordner oder nach /root. Kandidaten zum echten Löschen (nur mit Nutzer-OK): vor-*-Stände 25.–27.09. (überholt durch die freigegebenen Stände), Klartext-Logins sobald übernommen.

**Platte aufgeräumt 03.10.2026 abends (Nutzer: „ja mach es genau so“) — 49 → 16 GB belegt:**
- **Chromium-Profil-Leck (26 GB):** Puppeteer legt je Start `/tmp/puppeteer_dev_chrome_profile-*` an und löscht es beim Schließen — Snap-Chromium hat aber ein privates /tmp und schreibt nach `/tmp/snap-private-tmp/snap.chromium/tmp/`. Dort blieb jedes Profil liegen (1.370 seit 29.07., ~400 MB/Tag). Gelöscht (nur >1 h alt) + **nächtlich**: `removeOldBrowserProfiles()` in file-remove.controller.js (Muster puppeteer_dev_chrome_profile-/org.chromium.Chromium., >1 h, beide /tmp), im 03:00-Auto-Cleanup, Log zählt „Browser-Profil(e)“.
- 122 alte Claude-Scratchpads in /tmp/claude-0 (>3 Tage, laufende Sitzungen ausgenommen), 4,65 GB.
- Journal 3,4 → 0,94 GB (`--vacuum-time=4weeks`, ab 05.09.) + `/etc/systemd/journald.conf.d/printomation.conf` SystemMaxUse=1G.
- Snap: 6 deaktivierte Revisionen entfernt; **chromium 3530 bewusst behalten** (Rückfall für den Export). Kommen nach Refreshes wieder (retain=2), kein Leck.
- `/root/.cache/puppeteer` (634 MB, gebündeltes Chrome, ungenutzt — Export nutzt /snap/bin/chromium) gelöscht; `npm install` lädt es ggf. neu. npm- und apt-Cache geleert.
- Bewusst NICHT: pm2-Logs (32 MB, Verlauf seit Mai, den index.log beim Rotieren verliert), Kernel (neuer wartet auf Neustart), MySQL/ClamAV, Claude-Werkzeug, printomedia.
- Offen beim Nutzer (Punkte 8–13 der Liste): vor-*-Sicherungen 25.–27.09., Kundendaten-Sicherung 25.–27.09. (100 MB), old-london-schriften, Code-Backup 06.08., Quarantäne-Beweis, Klartext-Logins + /root/.git-credentials.

**Sicherungen neu geordnet 03.10. ~19:10 UTC (Nutzer: „pack zusammen oder lösch, überlass ich dir“):**
`gravurtastisch-orders/sicherungen/` (700) enthält nur noch 4 Archive + `automatisch/` + LIESMICH.txt:
`2026-09-27+29-freigegebene-staende.tar.gz` (dauerhaft), `2026-09-25-27-vor-aenderungen.tar.gz` (7 vor-*-Stände),
`2026-10-02-03-vor-v3-v4.tar.gz` (meine Stände vor V3/V4/Dropdown-Text — **ab ~10.10. löschen**, wenn V3/V4 problemlos),
`2026-05-19-bis-10-03-pm2-logs.tar.gz` (pm2-Logs danach per `pm2 flush` geleert). Jedes Archiv vor dem Löschen der
Ordner per Eintragszahl geprüft. GELÖSCHT: Kundendaten-Sicherung 25.–27.09. (100 MB), old-london-schriften,
/root/sicherungen/printomation-backup-20260806, /var/log/btmp.1 (Sept., steht auch im Journal). Passwörter/Zugangs-Backups
und Quarantäne-Beweis bleiben (Nutzer). Claude-Altversionen und composer-Cache bewusst nicht angefasst.
**Neu: Nacht-Sicherung** `src/sicherung.controller.js` (`nachtSicherung()`, aufgerufen im 03:00-Cleanup-Cron mit eigenem try):
`sicherungen/automatisch/sicherung-JJJJ-MM-TT.tar.gz` (seit 10.10. inkl. ezd-sicherung + testfoto → enthält 10 Kundenfotos aus schwere-faelle, ~10 MB) mit layouts/folders/laser-presets/settings/schedule/vorlage-stand/
processed-orders + motive/ fonts/ asin-profile/ (~1,2 MB), 14 rollierend. Keine Kundendaten, keine Zugangsdaten.
Vorher gab es nur layouts.json.bak (1 Generation). Rückholen: s. sicherungen/LIESMICH.txt.
