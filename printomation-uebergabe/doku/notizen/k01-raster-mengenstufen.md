---
name: k01-raster-mengenstufen
description: "K01-Blech hat 15 Positionen (Mitte 4,0 + n×13,5714 bis 194,0; Höhe 4,5 mm); M1 = 15 unabhängige Slots, M10–M250 = 1 Master + 14 Array-Kopien"
metadata: 
  node_type: memory
  type: project
  originSessionId: 701f936d-7c62-47d7-9d8c-490125de1dbb
  modified: 2026-09-24T11:33:16.616Z
---

Alle K01-Layouts (seit 24.09.2026 **8 Gruppen** × 12 Farben = 95 Layouts, je 2 Seiten)
nutzen dasselbe Blech: 15 Positionen, x 75, Breite 50, Gravurhöhe 4,5 mm.

**Mengenstufen M500 und M1000 am 24.09.2026 ergänzt** (je 12 Farben, Kopien der
M250-Fassung — zwischen zwei Mengenstufen unterscheiden sich NUR id, name, date,
globalAsin und group). Damit sind alle Stufen außer M1 mit 12 Farben vollständig;
„Gemischt" gibt es als Einzelstück nicht, das ist Absicht und keine Lücke.

**Raster seit 21.08.2026 (vom Nutzer über MITTELPUNKTE vorgegeben):**
Mitte Gravur 1 = **5,0 mm**, Mitte Gravur 15 = **195,0 mm** → Schritt 190/14 =
**13,571428 mm**, Lücke 9,0714 mm. Feldoberkante = Mitte − 2,25, also
y = 2,75 / 16,3214 / 29,8929 / … / 192,75. (Zwischenstand am selben Tag war Mitte
4,0 … 194,0; nach dem Maschinentest ging alles noch 1 mm tiefer.) Die unterste Gravur
endet damit bei 197,25 mm und liegt 1,25 mm ÜBER dem eingestellten 4-mm-Sicherheitsabstand
— bis zur echten Blattkante sind es aber noch 2,75 mm, vom Nutzer so gewollt.

**`dxfCenterOrigin` steht seit 21.08.2026 bei allen 71 K01 auf `true`** (Nullpunkt in der
Blattmitte, wie bei S01) — vorher war es überall aus, weshalb die Exporte in Ezcad unten
links landeten. Siehe [[dxf-block-zentrierung-bug]]: Die Kombination mit „Text als Block"
war bis dahin defekt und musste erst repariert werden. Der Nutzer denkt und misst in
Mittelpunkten — bei künftigen Vorgaben immer erst Mitte → Oberkante umrechnen.
Vorher (03.08.–21.08.): Oberkante y = 3,1 + n × 13,5 (Mitte 5,35 … 194,35).

Vorder- und Rückseite sind geometrisch identisch; getrennt werden sie über die
Gravur-Nummer: **Seite 1 = palNum 1, Seite 2 = palNum 2** (ausnahmslos bei allen 72).

Entscheidender Unterschied zwischen den Mengenstufen:
- **M1**: 15 *unabhängige* Slots → 15 verschiedene Bestellungen pro Blatt, jedes
  Feld mit eigenem `filterAsin`. Nie in eine Array-Gruppe umbauen.
- **M10 bis M250**: 1 Master + 14 Kopien → ein Blatt = *eine* Bestellung,
  15 identische Gravuren (siehe [[fl01-array-mengenstufen]]).

Bei M10 werden bewusst 15 graviert, obwohl nur 10 in die Vorrichtung kommen —
einheitliches Programm ist ihm wichtiger als die 5 leeren Positionen. Ab M25 bildet
das Layout die Packungsgröße nicht ab (M25/M50/M100/M250 sind geometrisch identisch);
die Stückzahl läuft über die Anzahl Blech-Durchläufe, nicht über das Layout.

**Why:** Die Slot-Zahl sieht aus wie die Packungsgröße, ist aber die Blech-Kapazität.
**How to apply:** Bei Layout-Änderungen an einer Gruppe immer alle 12 Farben derselben
Gruppe mitziehen (sie sind sonst bit-identisch) und M1 wegen der Master-Struktur
getrennt behandeln — nur y/h überschreiben, nie die Felder aus einer M-Gruppe kopieren.

**Zwei Altlasten in der Benennung** (Stand 21.08.2026, inhaltlich unkritisch):
`K01_Blau`, `K01_Grün` und `K01_Schw` tragen keine Mengenstufe im Namen, liegen aber
im Ordner `K01_xxx_M1` — beim Suchen nach `K01_Schw_M1` läuft man deshalb ins Leere.
Und bei M1 fehlt die Farbe **Gemi** (11 statt 12) — das ist KEIN Fehler: gemischt gibt es
als Einzelstück nicht (vom Nutzer am 24.09.2026 bestätigt).
