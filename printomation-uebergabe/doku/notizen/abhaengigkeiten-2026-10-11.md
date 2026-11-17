---
name: abhaengigkeiten-2026-10-11
description: 11.10.2026 Bestandsaufnahme fremder Code / Online-Zugriffe / Updates — 23 npm-Lücken (1 kritisch), Node 20 ist EOL, Google Fonts im Editor; nichts aktualisiert, Vorschlag an Nutzer
metadata:
  type: project
---

Nutzerfrage 11.10.: „Code, der auf Online-Verzeichnisse zugreift oder aus dem Internet stammt — Updates?"
- **Online zur Laufzeit:** Amazon SP-API + LWA-Token (config.js, nötig); Kundendateien von Amazon; **Google Fonts** in layout-editor.html Zeile 33 (JetBrains Mono, Syne) — jeder Editor-Aufruf und jeder Puppeteer-Export lädt von fonts.googleapis.com (DSGVO-Risiko, Abhängigkeit) → Vorschlag: lokal ablegen. Sonst keine fremden Server.
- **Fremdcode im Projekt:** public/vendor jsPDF 2.5.1 (aktuell 3.x, bekannte DoS-Lücken bei fremder Eingabe — bei uns eigene Daten), JSZip 3.10.1 (aktuell), opentype.js (Version ohne Kopf), onnxruntime-web 1.19.2 + YuNet 2023mar (neu 11.10.), tools/ezd/ezd_meerk40t.py (meerk40t, MIT, Stand 14.09.).
- **npm (package.json):** `npm audit --omit=dev` = 23 Lücken (1 kritisch proxy-addr über express, 16 hoch: axios, multer, joi, ws, path-to-regexp, form-data, js-yaml, Puppeteer-Kette …). Großteil per `npm audit fix` ohne Major-Sprung behebbar; Puppeteer- und node-cron-Fix = Major (Breaking). Server lauscht nur 127.0.0.1:3002 hinter nginx-Basic-Auth → Risiko gedämpft.
- **Laufzeit:** Node **20.20.2 — Node 20 ist seit 30.04.2026 EOL** (keine Sicherheitsupdates) → auf 22/24 LTS heben (Test nötig). Chromium-Snap 155 aktualisiert sich selbst; unattended-upgrades aktiv (ffmpeg 6.1.1, poppler 24.02).
**ERLEDIGT 11.10. abends (Nutzer: „mach alle Punkte"):** npm audit fix (express 4.22.3, axios 1.20, multer 2.4, joi 17.13.8 …), Node 20 → **24.21** (statt 22: Support bis 04/2028), **Puppeteer 25.13** (braucht Node ≥ 22.12; mit PUPPETEER_SKIP_DOWNLOAD, wir nutzen /snap/bin/chromium) + **node-cron 4.6** (schedule/stop/getNextRun ok) → `npm audit`: **0 Lücken**. Google Fonts → `public/vendor/fonts/` (fonts.css + 4 woff2, latin/latin-ext, OFL), Editor lädt nichts mehr von Google. Geprüft: Trockenlauf Node 24 + Puppeteer 25 = 120 BMP bitgleich zu vorher; /export-single (Vorschau) über den Server ok; Zeitplan registriert. Sicherungen: /root/sicherungen/npm-2026-10-11/ (package*.json + node_modules.tar.gz), layout-editor.html.vor-lokale-schriften-2026-10-11.
Offen (nicht angefasst): jsPDF 2.5.1 → 3.x, onnxruntime-web 1.19.2 → neuer, meerk40t-Leser — kein Sicherheitsdruck bei eigenen Daten.
