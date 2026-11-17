---
name: deployment-setup
description: "How the printomation order app is deployed/run (PM2, port) and how to restart it"
metadata: 
  node_type: memory
  type: project
  originSessionId: 6b9a66b4-570e-43d2-b765-08e258a013a2
---

Die App (Amazon-Order-Automatisierung / Layout-Editor) läuft als **PM2-Prozess namens `printomation`** (id 0), gestartet aus `/var/www/printomation/gravurtastisch-orders/src/index.js`.

- Lauscht auf **Port 3002** (`config.port` in `config.js`), NICHT 3000.
- Neustart nach Server-Code-Änderungen (`index.js` etc.): `pm2 restart printomation`. Frontend-Änderungen in `public/layout-editor.html` greifen ohne Neustart per Browser-Reload (statisch ausgeliefert).
- Logs: `pm2 logs printomation` bzw. `/root/.pm2/logs/printomation-{out,error}.log`.
- Layouts werden serverseitig in `layouts.json` gespeichert (POST `/layouts`); Body-Limit via `express.json({ limit: '50mb' })`.

**Seit 11.10.2026: Node 24.21 (NodeSource `node_24.x`, vorher 20 = EOL), pm2 läuft als systemd-Dienst `pm2-root`.** NIE `pm2 update` — nach dem nodejs-apt-Update startete needrestart pm2-root neu, `pm2 update` hing dazwischen und die App war ~2 Min aus. Sauber: `pm2 restart printomation`; Daemon neu: `pm2 kill && systemctl start pm2-root`. Rückweg Node: /root/sicherungen/nodesource.sources.vor-node24-2026-10-11.
