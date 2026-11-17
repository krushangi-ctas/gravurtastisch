# Betrieb (Stand 29.10.2026)

## Server

- Hetzner Cloud CPX22, Ubuntu 24.04, Nürnberg, IP 46.225.10.164, Hostname `Printomation`.
- Ordner: `/var/www/printomation/printomation` (App), `/var/www/printomation/amazon-bereich` (Modul).
  `/var/www/printomation/printomedia` ist die Webseite printomation.de und gehört **nicht** dazu.
- Node 24.21 (NodeSource), pm2 als systemd-Dienst `pm2-root`.

## App-Prozess

- pm2-Prozess `printomation`, Port 3002, Start `src/index.js`.
- Neustart nach Server-Code-Änderungen: `pm2 restart printomation`.
  Änderungen nur in `src/public/` (Editor) greifen ohne Neustart per Browser-Reload.
- **Nie `pm2 update`** (hat die App schon minutenlang abgeschaltet).
- Vor einem Neustart prüfen, dass gerade kein Export läuft: `pgrep -x chrome` muss leer sein.
- Logs: `pm2 logs printomation`, `src/logs/index.log`.
- Täglich 03:00 (Berlin): alte Download-/Export-Ordner löschen (`src/daten/settings.json`), danach
  Sicherung der Betriebsdaten nach `sicherungen/automatisch/` (14 Tage).

## Web

- `https://laser.printomation.de` → nginx (Let's Encrypt) → `127.0.0.1:3002`. Konfiguration: `server/nginx-laser.printomation.de.conf`.
- Anmeldung per nginx Basic Auth (`/etc/nginx/.htpasswd`). Benutzer: `gravur` (voll), `entwickler`
  (voll, sieht zusätzlich den Amazon-Bereich), `zuschauer` (nur lesen), `freelancer` (nur Amazon-Bereich).
  Die App selbst hat bewusst keine eigene Anmeldung.

## Laser-PC (Werkstatt, Windows)

- Samba-Freigabe `Printomation` = `src/public` des Servers, am Laser-PC als Laufwerk **Z:**, Benutzer `gravur`
  (`server/samba-freigabe.conf`).
- Ezcad liest die Exporte (DXF/BMP) aus `exports/…`. F02-Vorlagen nutzen „Dynamic File“ auf den festen
  Arbeitsordner `exports/_Vorlage/<Vorlage>/`. Je Tag liegt eine `lade-diesen-tag.bat` im Tagesarchiv.
- Wird der App-Pfad geändert, muss der `path` der Samba-Freigabe mitgezogen werden.

## Amazon-Bereich

- Abruf per Cron (`server/crontab.txt`): täglich 03:15 `abruf/abruf.sh`, alle 15 Min `--erststart`.
- Eigene SP-API-Zugangsdaten mit Berichts-Recht in `amazon-bereich/.env`. Der Zugang der Haupt-App darf
  nur Bestellungen lesen (Listings/Sellers → 403).

## Deploy (Vorschlag)

Änderungen kommen als Git-Branch zurück. Einspielen auf dem Server: Dateien ersetzen, bei Server-Code
`pm2 restart printomation`, vorher Sicherung (`tar` des `src/`-Ordners), danach `/health` und einen
Export prüfen. Neue npm-Pakete: `npm install` im App-Ordner.
