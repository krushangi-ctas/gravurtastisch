---
name: fl01-array-mengenstufen
description: "FL01-Layouts nutzen Array-Kopien — ein Blatt = 1 Bestellung × Slot-Anzahl, unabhängig von der Mengenstufe M25/M50/M100/M250"
metadata: 
  node_type: memory
  type: project
  originSessionId: 83d229d2-5f33-4185-bcf1-f68639f80348
  modified: 2026-09-08T00:00:00.000Z
---

FL01 (angelegt 26.07.2026, **30 Layouts = 5 Farben (Blau/Gemi/Grün/Rot/Schw) × 6 Mengenstufen** M1/M10/M25/M50/M100/M250, je eigene `globalAsin` mit `singleAsinMode`). `FL01_Gemi_M1` (B0H37FRVK7) fehlte bis 08.09.2026 als einzige Kombination und wurde dann aus `FL01_Blau_M1` geklont.

**Array-Regel:** Felder mit `arrayOf` verbrauchen beim Füllen KEINE eigene Bestellung — sie spiegeln den Master (`arrayGroup`) über `_syncArrayClones`. Ein Blatt ergibt daher immer genau **Slot-Anzahl** Gravuren aus **einer** Bestellung.

Daraus folgt für FL01:
- **M1**: 20 *unabhängige* Felder (kein Array) → 20 verschiedene Bestellungen pro Blatt. Korrekt für Menge 1.
- **M10**: 10 Slots als Array → 1 Bestellung = 10 Stück. Passt exakt.
- **M25/M50/M100/M250**: alle **20 Slots**, egal welche Packungsgröße → ein Blatt liefert immer 20 Stück.

**Kein Bug — so gewollt (bestätigt 29.07.2026):** Das Blech hat physisch 20 Positionen. Die Mengenstufe wird über die *Anzahl Bleche* gefahren, das letzte nur teilbestückt (M25 = 20 + 5, M50 = 2×20 + 10, M100 = 5×20 glatt, M250 = 12×20 + 10). Stückzahl stimmt exakt. Nicht erneut als Unterproduktion melden.

Nebenwirkung von `useQty`: bestellt ein Kunde 2× dieselbe Packung, erzeugt der Export **zwei identische Seiten** — korrekt, eine Seite je Packung, kein Duplikat.

`FL01_Gemi_M1` fehlt bewusst (Menge 1 kann nicht „gemischt" sein) — K01 handhabt das genauso.

**Raster (Stand 15.09.2026, aus layouts.json):** Blech 200×200, Rand 3 mm. Spalten x = 29 und 117 (w = 38,
also links 29 mm frei, rechts 45 mm — nicht mittig, vom Nutzer so gewollt). Gravurhöhe
**5,5 mm**, 10 Zeilen y = 11,75 / 30,31 / 48,86 / 67,42 / 85,97 / 104,53 / 123,08 / 141,64 /
160,19 / **178,75**. **15.09.2026: alle 90 FL01–FL05-Layouts um 0,5 mm tiefer** (Nutzerwunsch, jedes Feld y+0,5, per Testblatt-A/B an allen 90 DXF nachgemessen; Sicherung `backups/2026-09-15_vor-fl-verschiebung/layouts.json`). (Die Werte vom 11.08. — h 6, y ab 11 — waren schon vorher überholt.) Der Nutzer hat die Positionen selbst ausgemessen: Öffner 12 mm hoch,
erster ab 3 mm, letzter 170–182 mm → Raster **18,556 mm** = (170−3)/9.

**Drift-Korrektur 11.08.2026:** vorher lag das Raster bei glatt 18,5 mm; dadurch saß die
Gravur nach unten hin immer höher auf dem Teil (Mitarbeiter: „die letzten sind zu oben"),
über 9 Zeilen 0,5 mm. Zeile 1 blieb bei 11,0 (oben passte es), alle anderen wanderten
runter. Falls jemand deutlich MEHR als 0,5 mm Drift sieht, ist der echte Teilabstand
größer — dann Oberkante des letzten Öffners neu messen und Raster daraus rechnen.
Achtung: `y` ist die Feld-Oberkante, der Gravurblock hängt oben bündig (Höhe ändern heißt
y nachziehen, s. [[fl04-raster-mengenstufen]]).

Siehe [[amazon-customization-json-struktur]], [[betriebs-konventionen]].
