// ── Bereich „Amazon" für Printomation — eigenständiges Modul ──────────────────────────────
// Printomation bindet es in src/index.js mit EINER Zeile ein (in try/catch: fehlt oder klemmt der
// Ordner, läuft die Gravur weiter):
//   require('/var/www/printomation/amazon-bereich/server')(app, { express, asinTitel })
// Alles Weitere liegt hier: API unter /v2/amazon/*, Oberfläche unter /amazon-bereich/* (amazon.js
// hängt sich selbst in den Editor), Abruf-Skripte in ../abruf (Cron), Daten in ../abruf/data.
// Zugriff nur für die Basic-Auth-Benutzer „entwickler" und „freelancer" (Rollen s. verkaeufe.js, `anmeldung`).
const path = require('path');

module.exports = function einbinden(app, { express, asinTitel = () => new Map(), auth }) {
  app.use('/amazon-bereich', express.static(path.join(__dirname, '..', 'public'), { maxAge: 0 }));
  const guard = auth || ((req, res, next) => next());
  app.use(['/v2/amazon/verkaeufe', '/amazon/verkaeufe'], guard, require('./verkaeufe')({ express, asinTitel }));
};
