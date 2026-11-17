---
name: server-zugaenge
description: "Die drei getrennten Zugänge (Hetzner-Konto, root/SSH, nginx Basic Auth) und welcher Port welche Auth hat"
metadata: 
  node_type: memory
  type: reference
  originSessionId: c3f23231-85ce-4cbc-9d88-601a2d12254a
  modified: 2026-07-28T14:57:33.799Z
---

Drei **getrennte** Credential-Sets, die der Nutzer leicht verwechselt (28.07.2026 geklärt):

1. **Hetzner Cloud Console** — `console.hetzner.com`, Projekt 14646703, Server
   „Printomation" (CPX22, Ubuntu 24.04.4, Nürnberg). Login = E-Mail + Passwort + 2FA-Code
   per Mail. Generalschlüssel: darüber Rescue-System → Root-Passwort neu setzen.
2. **Server-Login** — User `root` (der **einzige** Account mit Login-Shell). Gilt
   identisch für `ssh root@46.225.10.164` und die VNC-Konsole der Hetzner-Console.
   Achtung: im tty-Prompt `Printomation login:` ist „Printomation" der *Hostname*.
3. **Weboberfläche** — nginx Basic Auth, User `printomation`. Existiert **nicht** als
   Linux-User; Eingabe in der Server-Konsole scheitert zwangsläufig.

Passwörter liegen nirgends im Klartext (shadow bzw. `$apr1$`-Hash) — nicht auslesbar,
nur neu setzen (`passwd root` / `htpasswd -B /etc/nginx/.htpasswd printomation`).

Erreichbarkeit (live verifiziert 28.07.2026):

| Aufruf | Weg | Auth |
|---|---|---|
| `https://laser.printomation.de` | nginx → localhost:3002 | 401 Basic |
| `https://46.225.10.164` | derselbe nginx-Block (einziger 443-Server, fängt die IP) | 401 Basic |
| `http://46.225.10.164:3002` | direkt Node (`*:3002`) | **keine** |

**Why:** Die Verwechslung `printomation` als Server-Login hat den Nutzer schon Zeit
gekostet, und die Basic Auth wirkt schützender als sie ist — Port 3002 hängt offen am
Netz vorbei an nginx.

**Stand 02.10.2026 — Rollen + Bypass zu:** Basic-Auth-User jetzt `gravur` (voll),
`entwickler` (voll), `zuschauer` (nur GET/HEAD; POST/PUT/PATCH/DELETE und `/start-cron*`
→ 403 per nginx-`map $zuschauer_gesperrt` in sites-available/printomation). Node lauscht
nur noch auf `127.0.0.1:3002` (index.js `app.listen`), nginx proxy_pass auf 127.0.0.1;
`http://<IP>:3002` ist zu. Puppeteer (snap-chromium → localhost) geprüft, läuft.
Klartext-Passwörter der zwei neuen User: `/root/sicherungen/2026-10-02-zugaenge/neue-logins-2026-10-02.txt` (600).
Backups: `/root/sicherungen/2026-10-02-zugaenge/nginx-printomation.bak-2026-10-02`, `/root/sicherungen/2026-10-02-zugaenge/htpasswd.bak-2026-10-02`,
`/root/sicherungen/2026-10-02-zugaenge/index.js.bak-2026-10-02`. Die Tabelle oben ist damit veraltet. `/` leitet per nginx auf `/layout-editor.html` (vorher „Cannot GET /“). Nutzer testet Rollen im privaten Fenster (Basic Auth hat kein Logout).

**How to apply:** Bei Zugangsfragen die drei Ebenen sauber trennen. Zum Schließen des
Bypass: Node an `127.0.0.1` binden (`config.js`) oder 3002 per Hetzner-Firewall dicht —
Puppeteer-Auto-Export ruft `http://localhost:3002` selbst auf und läuft weiter, s.
[[deployment-setup]] und [[auth-entscheidung]].

**21.10.2026 — Anmeldung sichtbar + Abmelden:** Einstellungen → Karte „Anmeldung" (GET `/wer-bin-ich` liest den durchgereichten Authorization-Kopf). Abmelden: Cookie `pm_abgemeldet=<benutzer>` (5 min) + Seite neu; nginx-map `$pm_abmelden` antwortet 401 + `abgemeldet.html` (location ohne auth_basic) SOLANGE Cookie = $remote_user; erster ANDERER Benutzer löscht es (map `$pm_abmelde_cookie_weg`). Wichtig: Safari schickt nach einem 401 sofort das Schlüsselbund-Passwort erneut — ein einmaliges 401 (v1) reichte deshalb nicht; XHR-Falschdaten-Trick wirkt in Safari auch nicht. E2E getestet mit Puppeteer `page.authenticate` (wiederholt automatisch wie Safari) + Wegwerf-Benutzern in .htpasswd (danach entfernt). Sicherungen: /etc/nginx/printomation.vor-abmelden-*. Nutzer selbst meldet sich als `gravur` an.

**21.10.2026 — vierter Benutzer `freelancer`:** nur Amazon-Bereich (Startseite /amazon-bereich/start.html), alles andere 403 per nginx-map `$freelancer_gesperrt`; Details [[amazon-bereich-plan]].
