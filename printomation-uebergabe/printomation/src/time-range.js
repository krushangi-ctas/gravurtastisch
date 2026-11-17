// Gemeinsame Zeitfenster-Berechnung für manuellen UND automatischen Download —
// eine Quelle = ein Verhalten. Alle Uhrzeiten werden als Berliner Zeit interpretiert
// und nach UTC umgerechnet (nahtlose Auto-Läufe, keine DST-Fehler).
// [EN] Shared time window calculation for manual AND automatic download —
// [EN] one source = one behavior. All times are interpreted as Berlin time
// [EN] and converted to UTC (seamless auto runs, no DST errors).

// Abstand Berlin − UTC in ms zu einem Zeitpunkt (Sommer +2 h, Winter +1 h).
// [EN] Berlin − UTC offset in ms at a given timestamp (summer +2h, winter +1h).
function berlinVersatz(ms) {
  const d = new Date(ms);
  return new Date(d.toLocaleString('en-US', { timeZone: 'Europe/Berlin' }))
       - new Date(d.toLocaleString('en-US', { timeZone: 'UTC' }));
}

// Berliner Uhrzeit (HH:MM) an einem Datum (YYYY-MM-DD) → UTC ISO-String.
// Beispiel: berlinTimeToUTC('2026-06-04','13','00') = '2026-06-04T11:00:00.000Z' (Sommer, UTC+2)
// Der Versatz gilt an der ZIELZEIT, nicht um Mitternacht: an den Umstellungstagen (letzter Sonntag im
// März/Oktober, 2 bzw. 3 Uhr) lag ein Fenster nach der Umstellung sonst eine Stunde daneben. Zweimal
// gerechnet, weil der Versatz vom gesuchten Zeitpunkt selbst abhängt. Unabhängig von der Zeitzone
// des Servers.
// [EN] Berlin clock time (HH:MM) on a date (YYYY-MM-DD) → UTC ISO string.
// [EN] Example: berlinTimeToUTC('2026-06-04','13','00') = '2026-06-04T11:00:00.000Z' (summer, UTC+2)
// [EN] Offset applies at TARGET TIME, not at midnight: on transition days (last Sunday in
// [EN] March/October, 2 vs 3 AM) a window after transition was otherwise off by one hour. Calculated
// [EN] twice because offset depends on target time itself. Independent of server timezone.
function berlinTimeToUTC(dateBerlin, hh, mm) {
  const [y, mo, d] = String(dateBerlin).split('-').map(Number);
  const wand = Date.UTC(y, mo - 1, d, parseInt(hh), parseInt(mm));   // Berliner Wanduhr, als wäre sie UTC
  // [EN] Berlin wall-clock time as if it were UTC
  const t = wand - berlinVersatz(wand - berlinVersatz(wand));
  return new Date(t).toISOString();
}

// Berliner Kalendertag (YYYY-MM-DD) eines Date-Objekts.
// [EN] Berlin calendar day (YYYY-MM-DD) of a Date object.
function berlinDayStr(d) {
  return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Berlin' });
}

// Berliner Kalendertag vor N Tagen (N=0 → heute). EINE Tagesgrenzen-Definition fürs ganze Backend.
// [EN] Berlin calendar day N days ago (N=0 → today). ONE day boundary definition for entire backend.
function berlinDayBefore(days = 0) {
  return berlinDayStr(new Date(Date.now() - days * 86400000));
}

// berlinDayOf = berlinDayStr für ein beliebiges Datum. Wird von amazon.controller
// gebraucht: der Tages-Ordner unter public/ muss der BERLINER Kalendertag der Bestellung
// sein, nicht der UTC-Tag (s. dort).
// [EN] berlinDayOf = berlinDayStr for any date. Needed by amazon.controller:
// [EN] day folder under public/ must be BERLIN calendar day of the order,
// [EN] not the UTC day (see there).
const berlinDayOf = (d) => berlinDayStr(d instanceof Date ? d : new Date(d));

// Berliner Uhrzeit „HH:MM" (Aktivitäten, letzter Lauf im Zeitplan). Eine Formatierung statt drei.
// [EN] Berlin time "HH:MM" (activities, last run in schedule). One formatting instead of three.
function berlinUhrzeit(d = new Date()) {
  return new Date(d).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Berlin' });
}

// Berechnet { lastUpdatedAfter, createdBefore } (beides UTC-ISO oder null).
//
// opts:
//   preset:         'today' | 'yesterday' | '7days' | 'custom' | 'fromTime' | 'last24h' | 'last48h'
//   fromTime:       'HH:MM' (nur preset 'fromTime')
//   fromDate/toDate:'YYYY-MM-DD' (nur preset 'custom')
//   fromClock/toClock:'HH:MM' (optional, nur preset 'custom'; leer = ganzer Tag)
//   now:            Bezugszeitpunkt (Default: jetzt)
//   overlapMinutes: zieht den Fenster-Start nach hinten (Amazon-Latenz-Reserve; Auto: 90)
//   bufferMinutes:  Sicherheitsabstand der Obergrenze zu "jetzt" (Auto: 2, manuell: 0)
// [EN] Calculates { lastUpdatedAfter, createdBefore } (both UTC-ISO or null).
// [EN] opts:
// [EN]   preset:         'today' | 'yesterday' | '7days' | 'custom' | 'fromTime' | 'last24h' | 'last48h'
// [EN]   fromTime:       'HH:MM' (only preset 'fromTime')
// [EN]   fromDate/toDate:'YYYY-MM-DD' (only preset 'custom')
// [EN]   fromClock/toClock:'HH:MM' (optional, only preset 'custom'; empty = whole day)
// [EN]   now:            reference timestamp (default: now)
// [EN]   overlapMinutes: shifts window start back (Amazon latency buffer; Auto: 90)
// [EN]   bufferMinutes:  safety margin of upper limit to "now" (Auto: 2, manual: 0)
function computeTimeRange(opts = {}) {
  const {
    preset = 'last24h',
    fromTime = null,
    fromDate = null,
    toDate = null,
    fromClock = null,
    toClock = null,
    now = new Date(),
    overlapMinutes = 0,
    bufferMinutes = 0,
  } = opts;

  const todayBerlin = berlinDayStr(now);
  const yesterdayBerlin = berlinDayStr(new Date(now.getTime() - 86400000));

  // Obergrenze (Standard): tatsächlicher Laufzeitpunkt minus Sicherheitspuffer.
  // [EN] Upper limit (default): actual run timestamp minus safety buffer.
  let createdBefore = new Date(now.getTime() - bufferMinutes * 60000).toISOString();
  let lastUpdatedAfter;

  switch (preset) {
    case 'last24h':
      lastUpdatedAfter = new Date(now.getTime() - 24 * 3600000).toISOString();
      break;
    case 'last48h':
      lastUpdatedAfter = new Date(now.getTime() - 48 * 3600000).toISOString();
      break;
    case 'today':
      lastUpdatedAfter = berlinTimeToUTC(todayBerlin, '0', '0');
      break;
    case 'yesterday':
      lastUpdatedAfter = berlinTimeToUTC(yesterdayBerlin, '0', '0');
      createdBefore = berlinTimeToUTC(todayBerlin, '0', '0'); // Ende gestern = Anfang heute
      // [EN] end of yesterday = start of today
      break;
    case '7days': {
      const sevenAgo = berlinDayStr(new Date(now.getTime() - 7 * 86400000));
      lastUpdatedAfter = berlinTimeToUTC(sevenAgo, '0', '0');
      break;
    }
    case 'fromTime': {
      const [hh, mm] = String(fromTime || '0:0').split(':');
      lastUpdatedAfter = berlinTimeToUTC(yesterdayBerlin, hh, mm);
      break;
    }
    case 'custom': {
      // Uhrzeiten sind optional. Ohne sie gilt wie bisher der ganze Tag: Start um 00:00,
      // Ende am Anfang des FOLGEtags (Bis-Tag inklusiv). Mit Uhrzeit wird exakt auf den
      // Zeitpunkt geschnitten — dann ist der Bis-Zeitpunkt die harte Obergrenze.
      // [EN] Times are optional. Without them whole day applies: start at 00:00,
      // [EN] end at start of NEXT day (until-day inclusive). With time, cuts exactly to
      // [EN] that point in time — then until-time is strict upper bound.
      const [fh, fm] = String(fromClock || '').split(':');
      const [th, tm] = String(toClock || '').split(':');
      lastUpdatedAfter = fromDate
        ? berlinTimeToUTC(fromDate, fh || '0', fm || '0')
        : new Date(now.getTime() - 24 * 3600000).toISOString();
      if (toDate) {
        if (th !== undefined && th !== '') {
          createdBefore = berlinTimeToUTC(toDate, th, tm || '0');
        } else {
          // Bis-Tag inklusiv → Anfang des Folgetags (Mittag-UTC vermeidet DST-Randfehler)
          // [EN] Until-day inclusive → start of next day (noon-UTC avoids DST edge errors)
          const t = new Date(`${toDate}T12:00:00Z`);
          t.setUTCDate(t.getUTCDate() + 1);
          createdBefore = berlinTimeToUTC(t.toISOString().slice(0, 10), '0', '0');
        }
      }
      break;
    }
    default:
      lastUpdatedAfter = new Date(now.getTime() - 24 * 3600000).toISOString();
  }

  if (overlapMinutes > 0 && lastUpdatedAfter) {
    lastUpdatedAfter = new Date(new Date(lastUpdatedAfter).getTime() - overlapMinutes * 60000).toISOString();
  }

  return { lastUpdatedAfter, createdBefore };
}

module.exports = { berlinDayBefore, berlinDayOf, berlinUhrzeit, computeTimeRange };
