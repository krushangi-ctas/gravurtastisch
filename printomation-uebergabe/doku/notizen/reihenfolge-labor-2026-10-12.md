---
name: reihenfolge-labor-2026-10-12
description: "12.10.2026: Nutzer will ALLE Reihenfolgen von Kanten (K) und Schärfen (S) testen — 7 Plätze je Schritt = 49 + 7 (gleicher Platz, S vor K) = 56; Laborkopie der Pipeline, Recherche-Befund, Nutzerurteile"
metadata:
  type: project
---

**Nutzer-Urteile 12.10.:** Rekla 302-2919311 mit Gesicht 20 %/Dichte 19 % „sieht besser aus" (am Feuerzeug). Das AUFHELLEN
RUND UM DIE GESICHTER (langer Übergang der Gesichts-Automatik) findet er „richtig gut" — nicht wegnehmen.
Nutzer-Idee: Kantenbetonung gleich nach Schwarz-Weiß → klarere Struktur. Er rechnete selbst 49 oder 56 Kombinationen.

**Recherche (Web, 12.10.):** Konsens: Größe/DPI → Hintergrund vereinfachen → Graustufe → Tonwerte (Levels/Kurven,
Mitteltonkontrast zuletzt) → LEICHT schärfen (Unsharp; zu viel = weiße Säume) → Dithering ganz am Schluss.
LightBurn-Foren: Gamma 0,7–0,8, Enhance Radius 4–5 / Amount 200, Jarvis oder Stucki für Fotos. Bei uns laufen
Dichte-Regelung + Gesichts-Automatik (Tonwert!) NACH Kanten/Schärfen — Abweichung vom Konsens.

**Plätze (Labor):** 1 nach Graustufe/Weiche (vor Auto-Kontrast) · 2 nach Auto-Kontrast · 3 nach Hautkurve · 4 nach lok.
Kontrast (= K live) · 5 nach Gamma/Kontrast (= S live) · 6 nach Dichte-Regelung · 7 nach Gesichts-Automatik. Späte
Schritte (6/7) rechnet die Dichte-/Gesichtsregelung über `__spaet` in _restPipeline auf der kleinen Kopie mit (Näherung).
Laborkopie mit K4/S5 bitgleich zur Live-Pipeline (5/5). ~0,5 s je Bild.

**Mitschnitt:** tl.js-Abwandlung (`mitschnitt.js`): /session = alle /orders, onlyLayout=F02_Schw_V5–V7, Haken um
applyLaserPipeline speichert RGBA+meta (raw, rects, extra.gesichter in Canvas-px x0/y0/x1/y1) → 36 Plätze (12.10., 3 Tage
Bestellungen). Server hat nur 2 Kerne/3 GB → Labor mit `nice -n 19`.
Skripte nur im Session-Scratchpad (labor/). Ergebnis: s. Nachtrag.
Siehe [[einstellungs-pruefung-2026-10-11]], [[gesichts-automatik]], [[rekla-302-2919311-camo]].

**ERGEBNIS 12.10. (29 betroffene von 33 Fotos; 4 = Logo/Grafik/leer, dort greifen K/S nicht):**
- Reihenfolge allein: kaum Wirkung (Strukturwert 0,446 live → max 0,459). K1 (Kanten gleich nach Graustufe, Nutzer-Idee)
  am besten im Gesamtbild (+0,01–0,02, besser in 18–21/29), K7 (ganz am Ende) am besten in Gesichtern (+0,02). Grund: edgeBoost
  0,45 und USM 3×3/0,8 sind so mild, dass ihr Platz kaum zählt. Bilder praktisch gleich.
- Werte (14 Varianten): Unsharp mit GRÖSSEREM Radius ist der Hebel (r2/150 % +0,03 / Gesicht +0,08; r3/200 % +0,05/+0,10;
  r5/200 % +0,07/+0,09; besser in 25–26/33) — ABER im Bild macht r3/r5 an Position 5 manche Gesichter dunkel/fleckig.
  „K1 + Schärfen r3 200 % am Ende (S7)" +0,06 gesamt, Gesichter heller als r3 an Platz 5 — bester Kandidat.
  Jarvis −0,04, Stucki −0,01 (schlechter als Floyd), Kanten 1,0/2,0 schlechter (Ton), ohne Schärfen −0,08.
  Lok. Kontrast 0,4 +0,03 aber mehr verlorene Zeichnung.
- Labor-USM mit Radius = `__schaerfRadius` (Kastenfilter, nicht im Live-Code). Node-BMP == Browser-BMP (bitgleich geprüft).
**Testblech gebaut:** `exports/2026-10-12 Test/Reihenfolge-Schaerfen/F02_Schw_V5/` — Reihe 1 heute · Reihe 2 K1+S7 r3 200 % ·
Reihe 3 r2 150 %; Spalten Fotos 000/005/007/011 (V5-Mitschnitt). Reihe 2 hat ~1 Punkt weniger Fläche (Regelung mit späten
Schritten nur genähert). Urteil am Werkstück OFFEN — nichts davon live.

**Runde 3/4 (12.10. abends, Nutzer: „Kandidat finde ich gut"; will feinere Strukturen + weicheren Gesichts-Übergang):**
- Vergleich 10 Fotos heute vs. Kandidat MIT GLEICHER FLÄCHE (densityTarget je Foto nachgestellt, sonst wirkt der Kandidat
  dunkler): Struktur besser in 10/10, Gesicht 7/10 klarer. Nutzer: „ich finde es so gut".
- Feinstruktur: Fein-USM 3×3 zusätzlich und Eschbach-Knox-Schwellenmodulation (`__ekL`) bringen wenig. HEBEL = Lichter deckeln
  (inkMax 0,35): Strukturen in hellen Flächen (weiße Hemden, Karomuster, Falten) sichtbar, Bild grauer/flacher. Grund: auf
  schwarzem Lack ist ab ~25 % Fläche alles weiß (Simulation) — darüber geht jede Zeichnung verloren.
- Gesichts-Übergang `_GES_AUSSEN` 2,6 → 3,5 (Anteil 0,15 → 0,3) weicher; 4,5 hellt zu große Flächen mit auf (Gesichtsmasken-Foto:
  schwarzes Shirt wird grau). Empfehlung 3,5.
**Testblech 2:** `exports/2026-10-12 Test/Feinstruktur/F02_Schw_V5/` — Reihe 1 heute · Reihe 2 Kandidat + Übergang 3,5 · Reihe 3
dazu inkMax 0,35; gleiche Fläche je Foto. Urteil offen, NICHTS live (Kandidat bräuchte Pipeline-Umbau: K-Platz 1, S-Platz 7,
USM mit Radius, Dichte-Regelung mit späten Schritten).

**„Gesichts-Automatik überall" (Nutzer-Idee 12.10. abends, „der aufgehellte Bereich ist sehr gut"):** im Labor = echte
Gesichter + Raster N×N als zusätzliche „Gesichter" (extra.gesichter), Basis Kandidat + Übergang 3,5. Ergebnis Simulation:
MEISTE ZEICHNUNG von allem (weiße Hemden mit Falten, schwarze Shirts mit Struktur, Gesichter natürlich), aber Gesamtfläche
fällt auf 9–15 % (heute 18–21 %; Regelung kann nicht gegenhalten, Gesichtsstufe kommt danach) → am Werkstück dunkler.
3×3 Ziel 15 % am stimmigsten. Rechenzeit ~11 s je Foto (heute ~0,9 s, Kandidat ~1,7 s) — vor live optimieren (Tageslauf,
Puppeteer-180-s-Grenze). Urteil offen; mein Vorschlag: auf ein Testblech gegen Kandidat.
