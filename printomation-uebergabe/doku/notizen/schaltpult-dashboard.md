---
name: schaltpult-dashboard
description: "Persönliches Dashboard „Schaltpult\" (claude.ai-Artifact, db-synchron auf allen Geräten) mit Bereichen Privat/Geschäftlich/Freelancer/Printomation/Amazon + Claude-Runde"
metadata:
  node_type: memory
  type: reference
  originSessionId: 0c89162d-4d44-45a6-8687-0e4da14b0c88
  modified: 2026-10-06T20:15:34.672Z
---

Seit 28.09.2026: https://claude.ai/artifact/DfAhkE8Wftc5HPGUcLJxmh. Der Nutzer baut auch selbst im claude.ai-Chat daran weiter → vor jeder Änderung `Artifact read` und die ganze Datei lesen, nie aus einer alten lokalen Kopie veröffentlichen.

Datenbank (ArtifactData, nur Besitzer/Editoren):
- `tasks/<id>`: area (id aus meta/areas), title (Stift neben dem Titel in der geöffneten Aufgabe), note (= „Beschreibung“ = ARBEITSAUFTRAG für Claude; leer + vager Titel → Claude stellt Rückfragen statt zu raten; „Ergebnis“ erscheint erst bei erledigten), done, prio (hoch|normal|niedrig), due, tag, note, result, repeat (taeglich|werktags|woechentlich|monatlich|jaehrlich) + repeatDay, claude (offen|pruefen|fertig), claudeDue (geplanter Tag, „Für morgen planen“), claudeAsk (nur noch „Nochmal …“), claudeAnswer, claudeAt
- `notes/<area>` (text, history; „Notizblock“ nur für den Nutzer, Claude liest ihn nicht), `links/<id>`, `files/<id>` (area, name, assetId → Datei im Artifact-Speicher, nur PDF/Bilder/Video/Text), (`suggestions` und `usage` am 01.10. ausgebaut: niemand erzeugte Vorschläge, niemand wertete die Zählung aus; alte usage-Dokumente liegen noch in der DB)
- `meta/areas.list` = [{id, name, color 0–9, desc}] — Bereiche anlegen direkt in der Leiste („+ Neuer Bereich“), umbenennen durch Antippen der Überschrift, Beschreibung darunter (desc, geht auch an Claude); sortieren in der Leiste („Ordnen“: Griff ziehen oder ↑↓, auch per Finger) oder in den Einstellungen; Farbe/löschen in den Einstellungen; Nutzer will sichtbare Stifte statt Antippen-zum-Bearbeiten; id bleibt beim Umbenennen. Stand 01.10.: Privat, Allgemein, Freelancer, Printomation, Amazon, Google (Nutzer hat selbst umgebaut)
- `meta/settings.round` = {on, time "HH:MM", days taeglich|werktags} — im Reiter Einstellungen
- `meta/round` = {lastRun, count, summary, jobTime, jobDays, jobOk} — schreibt die Runde

Claude-Runde = geplante Aufgabe `schaltpult-claude-runde` (Desktop-App des Nutzers, Mac, Zeitzone CEST; Cron startet ~3 Min später wegen Lastverteilung). Sie liest meta/settings, stellt ihren Cron selbst um, bearbeitet nur `claude == "offen"`. **Startet nie eine Sitzung**: Testlauf 29.09. und Plan-Lauf 01.10. 07:51 wurden „ausgelöst“ (lastRunAt), aber list_task_runs = 0 und meta/round ohne lastRun. Auch 07.10. 16:23 (Nachholung) ausgelöst, weiterhin 0 Läufe. Vermutung: Aufgabe hängt am Server-Ordner dieser Remote-Sitzung; ungeprüft — update/create_scheduled_task haben KEINEN Ordner-Parameter, Neuanlage müsste aus einer lokalen Mac-Sitzung kommen. Seite verspricht trotzdem „Nächste Runde“ (am 07.10. dem Nutzer gemeldet, Empfehlung: Runde raus, Recherche-Knopf Plan 2 rein). Handy-Ansicht seit 01.10. mit Menü (☰) statt seitlich scrollender Leisten.

Geöffnete Aufgabe: Knöpfe „Beschreibung verbessern“ (Vorschlag → Übernehmen), „Für morgen planen“, „Jetzt erledigen“; Übersicht „Heute mit Claude“ = fällige Claude-Aufgaben mit Knopf. „Jetzt erledigen“ hat KEIN Internet und keinen Zugriff auf Claude Code (Nutzer stieß beim Zahnarzt darauf).

Seiten-Regel: `sample` darf nur auf Klick laufen, nie per Timer → automatische Runde geht nur über die geplante Aufgabe.

Testaufgaben `test-*` (29.09.) in jedem Bereich, nicht für Claude vorgemerkt – der Nutzer entscheidet selbst, was Claude bekommt.

Review 01.10.: Der Nutzer vergibt praktisch nie Datum oder Priorität (18 offen, 0 mit Datum, 0 wichtig) → „Im Blick“ zeigt nur 6 von 18 (füllt mit den 4 ÄLTESTEN auf). Seine offenen Aufgaben sind überwiegend Printomation-/Amazon-Arbeit, die nur Claude Code am Server erledigen kann, nicht „Jetzt erledigen“. Kleinbugs damals: `.p-go` ohne CSS (grauer Standardknopf in „Heute mit Claude“), initSample zeichnet die Liste nicht neu. Screenshots ohne claude.ai: seed in localStorage `schaltpult.v1` + `window.claude.use` stubben (db→null, sample→Fake), Seite per `python3 -m http.server` ausliefern (Snap-Chromium darf /tmp nicht lesen).

Seit 07.10. (Version 18): **Reihenfolge bestimmt der Nutzer selbst, mit ↑↓ direkt an jeder Aufgabe** (rechts, vor dem ✦; Bereich, „Im Blick“, alle Filter; nicht bei Erledigten). Sortierung NUR nach `rank` (Zahl, kleiner = weiter oben, global über alle Bereiche; ohne rank → ans Ende nach createdAt — so landen auch von Claude geschriebene Aufgaben). Pfeil = Platz direkt vor/hinter dem angezeigten Nachbarn in der Gesamtliste, bei Präzisionsende alles ×1000 neu; die Zeile bleibt beim Tippen unter dem Finger stehen. Prio bleibt als Merkmal: „wichtig“ (Knopf, Bearbeiten, „!“, Mit-Claude-eintragen) setzt die Aufgabe EINMAL ganz nach oben, „irgendwann“ macht sie nur blasser. „Im Blick“ = wichtig/fällig ≤3 Tage/zu prüfen, mindestens die ersten fünf der Reihenfolge, alles nach rank. Verworfen: Wertung Wirkung/Aufwand + Sortier-Runde + Anheften (05.10., Chat) und der Ordnen-Modus mit Abschnitten/Griff (06.10.) — Nutzer wollte einfach Aufgaben verschieben; alte Felder wirkung/aufwand/rankBy stehen noch in Dokumenten, werden ignoriert. **code: true** = „Wer: Claude Code“ (Knöpfe Priorität + Wer in der geöffneten Aufgabe) → Aufgabe für eine Claude-Code-Sitzung am Server; Ergebnis zurück als claude="pruefen" + claudeAnswer.

**How to apply:** Bei Sitzungsbeginn mit Printomation-Arbeit offene tasks mit code==true lesen und anbieten.  Aufgaben für den Nutzer direkt in `tasks` schreiben; Aufgaben „für Claude" mit claude = "offen" vormerken.
