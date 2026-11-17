---
name: maschinen-ausbau-ideen
description: "Ideenliste Maschinen-Reiter (11.10.2026) als Artifact mit Kennungen A1–G3; Nutzer wählt per Häkchen, Auswahl kommt als Text in den Chat"
metadata:
  node_type: memory
  type: project
  originSessionId: 4c947a47-4a13-4c6e-8a76-a55a1c618266
  modified: 2026-10-12T11:14:17.184Z
---

11.10.2026: Nutzer wollte „komplett alles, was ich gebrauchen könnte und was andere Tools mit Ezcad haben".
Artifact: https://claude.ai/artifact/QTpfLDEgFywYkZuWiGRbqM (Quelle im Session-Scratchpad, nicht dauerhaft).
21 Ideen mit Kennungen (A Ansicht, B Ablauf, C Stifte, D Lage, E Dateien, F Maschinen, G Weichen). Der Nutzer schickt
eine Auswahl wie „A1 Große Blech-Ansicht, B2 …".

Meine Reihenfolge: D1 (ENTWURF in Ezcad öffnen, ungetestet) → A1+A2 (große Blech-Ansicht im leeren Hauptbereich +
Startklar-Ampel) → B1+B2 (Satz-Knopf, Brenn-Protokoll über Samba full_audit, ungeprüft ob Ezcad nur beim Markieren
liest) → C2 (Testraster über Stift-Schreiben).

Fakten aus der Recherche: LightBurn-Doku nennt EZCAD2 Lite ausdrücklich als unterstützt; Pro 199 $ + ~40 $/Jahr
Updates (Mai 2026); .lbrn2 ist XML → wäre voll schreibbar. Offene Fragen an den Nutzer: wie wird rueckseite.dxf gelasert,
wird Silber noch gebrannt (Ordner seit 14.09. unverändert), ENTWURF schon in Ezcad geöffnet?
**Urteil 12.10.:** JA A1, A2, B1 (Satz-Knopf nur bei >12). NEIN A3, B2, B3, ganz C, ganz D, F, G. B4 „nice, aber schwer
zuverlässig" → weggelassen. E1 interessant, E2 erklärt. Fragte nach mehr Funktionen „für die Datei" (.ezd) → Vorschläge:
Vergleich zweier .ezd (nur lesen), Vorlage ableiten (kopieren + Pfade umbiegen = realistischer Weg zu E1), Dynamic File
per Klick an, Aufräumen ENTWURF/TEST-Kopien. Alles, was Objekte ändert, braucht den Ezcad-Öffnen-Test (D1).
**LIVE 12.10. ~11:25 Berlin: A1 + A2.** Reiter Maschinen ersetzt die Arbeitsfläche durch `#maschinen-buehne`
(Klasse `.maschinen-an` an .workspace via switchTab). Bühne = gewählter Ordner (Klick auf Kartenkopf, gemerkt in
localStorage `ezcad.auswahl`/`ezcad.ansicht`): Blech-SVG mit echten platzN.bmp an .ezd-Lage, leer/fehlt per
Bildgröße (≤16 px = Blindblatt), gelb gestrichelt nur abweichende Layout-Plätze, gravurN-Punkte; Ansichten Blech /
Vorschau / Entwurf. Startklar-Liste `_ezStartklar` (Stand heute?, Herkunft, Satz x von y, vorschau alt, fremde Dateien,
Bilddateien fehlen, Probleme NUR der echten .ezd) bestimmt auch die Kopfmarke der Karte. Aus der Karte entfernt:
Vorschau-Aufklapper und Lageskizze. Sicherung: sicherungen/2026-10-12-vor-maschinen-buehne.tar.gz. Getestet headless
(Datei-Tausch per Request-Interception, POST geblockt), keine Konsolenfehler.
**12.10. mittags LIVE, Paket 1–4 (je eigene Sicherung sicherungen/2026-10-12-vor-maschinen-{1..4}-*.tar.gz):**
1 Selbst-Aktualisierung: jede Minute /vorlage/uebersicht, neu einlesen nur bei Änderung, still (Auswahl/Aufklapper/Scroll
bleiben), nie beim Bearbeiten/Dialog. 2 Satz-Knopf „Satz N laden" (Startklar-Zeile + Karte, info statt warn).
3 Bestellnummer je Platz aus belegung.txt des erkannten Archiv-Ordners (Parser `_ezBelegungLesen`, 33/34 echte Dateien ok;
Testblech-Format ohne Tabelle), Mehrfachbestellungen farbig, Klick kopiert. 4 Marken je Platz: ⚠ Zeichnung NUR ab
`_VERLOREN_GRENZE` 31 % (meine Ankündigung „15 % = Warnung" war falsch, korrigiert), Dichte/Logo/Grafik/Ausgleich als Hinweis.
Offen aus der Liste: 5 „wie am Werkstück", 6 Tag vor dem Laden ansehen, 7 Archiv-Filter, 8 .ezd vergleichen.
**12.10. ~14:20 Berlin LIVE: vorschau.png NUR noch im Tagesarchiv** (Nutzer: „Sachen wie Vorschau nur im Layout-Bereich";
Ezcad-Ordner = nur, was Ezcad liest). Export lädt sie nicht mehr nach _Vorlage; V5-Nachzug mit Deckeltexten geht jetzt ins
Archiv (vorschauDaten.unter, vorher NUR Arbeitsordner → Archiv hatte V5 ohne Deckeltexte); _vorlageLeerSchreiben ohne
Vorschau; lade-diesen-tag.bat löscht statt kopiert; vorlage.controller laden() kopiert sie nicht und räumt sie weg
(bleibt in ARBEITS_DATEI, damit alte .bat nicht „fremd" auslöst); Bühne ohne Vorschau-Ansicht/-Prüfung; 6 alte gelöscht;
„Tag laden.bat" Zeile 94 Hinweis auf Maschinen-Reiter. pm2 restart 12:16 UTC. Trockenlauf alt/neu: _Vorlage bytegleich bis
auf fehlende vorschau.png. Sicherung sicherungen/2026-10-12-vor-vorschau-nur-archiv.tar.gz (inkl. _Vorlage).
Trockenlauf-Werkzeug bricht ohne `protocolTimeout` nach 180 s ab (Kopie mit 30 min im Scratchpad).
Nutzer-Hinweis: .ezd-Pfade beginnen mit _Vorlage → Ordner NICHT umbenennen. „Vorlage"→„Ezcad" nur gedanklich für Verkauf.
Nutzer versteht nicht, wie die platzN.bmp entstehen; will „Tag laden" automatisch in Printomation (Frage nach .bat-Abschaffung offen).
Schaltpult-Aufgabe „Ezcad Bereich besser machen" (code:true, note leer) gehört dazu.
Siehe [[ezcad-reiter]], [[schaltpult-dashboard]].
