"""Ändert Objekte im GEPACKTEN Teil einer EzCad2-.ezd (Lage, DPI, Stift-Zuordnung, Pfad, Füllung);
schreibt das Ergebnis in eine NEUE Datei.

Aufbau des gepackten Teils (Kopf entschlüsselt 05.10.2026, an allen sechs F02-Dateien geprüft):
20 Byte ab _locations['vectors'] = [Länge entpackt, CRC-16/X25 der entpackten Daten, Länge gepackt,
Datenstart (= Kopf + 20), CRC-16/X25 der ersten 16 Kopf-Bytes]; dann die Huffman-Tabelle
(2 + 7·n Byte: Zeichen u8, Bits u32, Länge u16) und die Daten, MSB zuerst. Ezcad hängt IMMER ein
angefangenes Byte an (Bytes = Bits // 8 + 1). Mit derselben Tabelle neu gepackt ist jede der
sechs Dateien bytegleich.
Die Objekte liegen hintereinander ohne Längen- oder Offsetfelder — ein Feld darf deshalb auch seine
Länge ändern (Pfad). Je Objekt: Typ (int32), Kopf (15 Felder: 0 = Stift, 13 = Mitte x/y), Kinder,
eigene Felder. Bild: 0 = Pfad (UTF-16 mit Null), 2 = linke untere Ecke x/y, 4 = Höhe, 5 = Breite,
9 und 318 = DPI x/y. Füllung: 5 = Linienabstand, 8 = Winkel (Satz 1). DXF (8 Felder): 0 = Pfad,
6/7 = Lage x/y. Kurven: Punktreihen als rohe doubles (keine Struktur), auch die Füll-Linien, die
Ezcad in der Füllung zwischenspeichert — deren Köpfe tragen keine Lage (0/0 bzw. 0,11/0).

LAGE (Bilder + Gravuren) AN DER MASCHINE BESTÄTIGT 29.10.2026: Ezcad öffnet die Datei und graviert
an der neuen Stelle (Testkopie V5R, Reihe 1 −10 mm). DPI, Stift, Pfad, Füllung: noch unbestätigt.

Aufruf: objekte.py <quelle.ezd> '<json auftrag>' <ziel.ezd>
auftrag = {"bilder": [{"datei": "platz1.bmp", "x": .., "y": .., "dpi": .., "stift": .., "pfad": ".."}],
           "gravuren": [{"dxf": "gravur1.dxf", "x": .., "y": ..}],
           "fuellungen": [{"dxf": "gravur1.dxf", "abstand": .., "winkel": ..}]}
Ausgabe: JSON mit den Änderungen. Vor dem Schreiben wird das Ergebnis neu gelesen und gegen
den Auftrag und die unveränderten Objekte geprüft — sonst Abbruch ohne Ziel-Datei."""
import sys, os, io, json, struct
HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)
import lesen                       # schneller Entpacker, Rohfeld-Mitschnitt, meerk40t-Attrappen
ezd = lesen.ezd

def feld_offsets(daten, start):
    """Byte-Position und Länge jedes Felds der Struktur ab `start` (je Feld int32-Länge + Daten)."""
    (anzahl,) = struct.unpack_from('<i', daten, start)
    pos, aus = start + 4, []
    for _ in range(anzahl):
        (laenge,) = struct.unpack_from('<i', daten, pos)
        aus.append((pos + 4, laenge))
        pos += 4 + laenge
    return aus

_T = []
for _i in range(256):
    _c = _i
    for _ in range(8): _c = (_c >> 1) ^ 0x8408 if _c & 1 else _c >> 1
    _T.append(_c)
def x25(daten):
    c = 0xFFFF
    for b in daten: c = (c >> 8) ^ _T[(c ^ b) & 0xFF]
    return c ^ 0xFFFF

def entpacken(d):
    ez = ezd.EZCFile(io.BytesIO(d))
    s = ez._locations['vectors']
    (n,) = struct.unpack_from('<H', d, s + 20)
    tab = d[s + 20:s + 22 + 7 * n]
    codes = {}
    for i in range(n):
        ch, bits, laenge = struct.unpack_from('<BIH', d, s + 22 + 7 * i)
        codes[ch] = format(bits, '032b')[-laenge:]
    return s, bytes(ez._decompressed_vectors), tab, codes

def packen(q, codes):
    fehlend = set(q) - set(codes)
    if fehlend: raise SystemExit(f'Huffman-Tabelle kennt Zeichen {sorted(fehlend)[:5]} nicht')
    bits = ''.join(codes[b] for b in q)
    bits += '0' * (8 - len(bits) % 8)      # wie Ezcad: immer ein angefangenes Byte dazu
    return int(bits, 2).to_bytes(len(bits) // 8, 'big')

def zusammen(d, s, q, tab, comp):
    kopf16 = struct.pack('<IIII', len(q), x25(q), len(comp), s + 20)
    return d[:s] + kopf16 + struct.pack('<I', x25(kopf16)) + tab + comp

def strukturen(q):
    """Ein Lesedurchgang: (Startposition in q, Felder) jeder Struktur in Lese-Reihenfolge, die
    Byte-Bereiche der obersten Objekte (von, bis, Objekt), Start und Punktzahl jeder Punktreihe
    und die Bogenstücke (Kurventyp 0: 5 doubles, Bedeutung unbekannt)."""
    gefunden, kurven, boegen = [], [], []
    ps, ki = ezd._parse_struct, ezd.EZCurve.__init__
    def fang(f, *a, **k):
        p = f.tell(); r = ps(f, *a, **k); gefunden.append((p, r)); return r
    def kurve(self, f):                    # wie EZCurve.__init__, merkt sich aber, wo die Punkte stehen
        ezd.EZObject.__init__(self, f)
        (anzahl, _) = struct.unpack('<2I', f.read(8))
        for _ in range(anzahl):
            (_, art, _, _) = struct.unpack('<BB2H', f.read(6))
            if art == 0: boegen.append(f.tell()); f.read(40); continue
            (n,) = struct.unpack('<i', f.read(4))
            kurven.append((f.tell(), n)); f.read(16 * n)
        self.points = []
    ezd._parse_struct, ezd.EZCurve.__init__ = fang, kurve
    try:
        objs, data, oben = [], io.BytesIO(q), []
        while True:
            von, n = data.tell(), len(objs)
            if not ezd.parse_object(data, objs): break
            if len(objs) > n: oben.append((von, data.tell(), objs[-1]))
    finally:
        ezd._parse_struct, ezd.EZCurve.__init__ = ps, ki
    return gefunden, oben, kurven, boegen

def _pfad(x):
    if isinstance(x, (bytes, bytearray)): return bytes(x).decode('utf-16le', 'replace').split('\x00')[0]
    return str(x or '')

def _feld(q, start, idx, laenge=None):
    pos, l = feld_offsets(q, start)[idx]
    if laenge is not None and l != laenge: raise SystemExit(f'Feld {idx} hat {l} statt {laenge} Byte')
    return pos, l

def main(quelle, auftrag_json, ziel):
    auftrag = json.loads(auftrag_json)
    d = open(quelle, 'rb').read()
    s, q, tab, codes = entpacken(d)
    st, oben, kurven, boegen = strukturen(q)
    q2 = bytearray(q)
    aenderungen, splices = [], []          # splices: (pos, alte Länge, neue Bytes) — von hinten einsetzen
    erlaubt = []                           # (von, bis): nur hier darf sich q2 von q unterscheiden
    def ende(p):                           # Ende der Struktur ab p
        pos, l = feld_offsets(q, p)[-1]; return pos + l

    # Bilder: Bildstruktur (320 Felder, Feld 0 = Pfad) und davor ihr Objektkopf (15 Felder)
    bilder = {}
    for i, (p, r) in enumerate(st):
        if len(r) == 320 and i and len(st[i - 1][1]) == 15:
            bilder[_pfad(r[0]).split('\\')[-1].lower()] = (st[i - 1][0], p)
    for b in auftrag.get('bilder', []):
        k = str(b['datei']).lower()
        if k not in bilder: raise SystemExit(f'Bild {b["datei"]} nicht in der Datei')
        kopf, feld = bilder[k]
        erlaubt.append((kopf, ende(feld)))
        if 'x' in b or 'y' in b:
            mp, _ = _feld(q, kopf, 13, 16)
            x, y = struct.unpack_from('<dd', q, mp)
            nx, ny = float(b.get('x', x)), float(b.get('y', y))
            struct.pack_into('<dd', q2, mp, nx, ny)
            ep, _ = _feld(q, feld, 2, 16)
            hp, _ = _feld(q, feld, 4, 8); bp, _ = _feld(q, feld, 5, 8)
            h, w = struct.unpack_from('<d', q, hp)[0], struct.unpack_from('<d', q, bp)[0]
            struct.pack_into('<dd', q2, ep, nx - w / 2, ny - h / 2)
            aenderungen.append(f'{b["datei"]}: Mitte {x:.3f}/{y:.3f} → {nx:.3f}/{ny:.3f}')
        if 'dpi' in b:
            for idx in (9, 318):
                fp, _ = _feld(q, feld, idx, 4); struct.pack_into('<i', q2, fp, int(b['dpi']))
            aenderungen.append(f'{b["datei"]}: {int(b["dpi"])} DPI')
        if 'stift' in b:
            fp, _ = _feld(q, kopf, 0, 4); struct.pack_into('<i', q2, fp, int(b['stift']))
            aenderungen.append(f'{b["datei"]}: Stift {int(b["stift"])}')
        if 'pfad' in b:
            fp, fl = _feld(q, feld, 0)
            neu = (str(b['pfad']) + '\x00').encode('utf-16le')
            splices.append((fp - 4, 4 + fl, struct.pack('<i', len(neu)) + neu))
            aenderungen.append(f'{b["datei"]}: Pfad → {b["pfad"]}')

    # Gravuren (DXF): das ganze oberste Objekt — Füllung samt DXF oder die DXF allein — um dasselbe
    # dx/dy verschieben: die Köpfe bis zur Füllungs-Struktur (F13), die DXF-Lage (F6/F7) und jeden
    # Kurvenpunkt, auch die zwischengespeicherten Füll-Linien. x/y meint die Mitte im DXF-Kopf (wie lesen.py).
    dxfs = [(p, r[0].split('\\')[-1].lower()) for p, r in st
            if len(r) == 8 and isinstance(r[0], str) and r[0].lower().endswith('.dxf')]
    for g in auftrag.get('gravuren', []):
        k = str(g['dxf']).lower()
        treffer = [p for p, n in dxfs if n == k]
        if len(treffer) != 1: raise SystemExit(f'Gravur {g["dxf"]} {len(treffer)}× in der Datei')
        von, bis, o = next(b for b in oben if b[0] <= treffer[0] < b[1])
        if sum(von <= p < bis for p, _ in dxfs) != 1 or type(o).__name__ not in ('EZHatch', 'EZVectorFile'):
            raise SystemExit(f'Gravur {g["dxf"]} liegt in einer Gruppe — nicht verschiebbar')
        if any(von <= p < bis for p in boegen): raise SystemExit(f'Gravur {g["dxf"]} enthält Bögen — nicht verschiebbar')
        vf = o if isinstance(o, ezd.EZVectorFile) else next(c for c in o if isinstance(c, ezd.EZVectorFile))
        hx, hy = vf.position
        nx, ny = float(g.get('x', hx)), float(g.get('y', hy))
        dx, dy = nx - hx, ny - hy
        def schieben(pos):
            x, y = struct.unpack_from('<dd', q, pos); struct.pack_into('<dd', q2, pos, x + dx, y + dy)
        grenze = next((p for p, r in st if von <= p < bis and len(r) >= 42), bis)   # dahinter: Füll-Cache
        for p, r in st:                    # 0/0 = Kopf ohne Lage (Kurven in Silb_V5) — bleibt
            if von <= p < grenze and len(r) == 15 and struct.unpack_from('<dd', q, _feld(q, p, 13, 16)[0]) != (0.0, 0.0):
                schieben(_feld(q, p, 13, 16)[0])
        xp, _ = _feld(q, treffer[0], 6, 8); yp, _ = _feld(q, treffer[0], 7, 8)
        struct.pack_into('<d', q2, xp, struct.unpack_from('<d', q, xp)[0] + dx)
        struct.pack_into('<d', q2, yp, struct.unpack_from('<d', q, yp)[0] + dy)
        for p, n in kurven:
            if von <= p < bis:
                for i in range(n): schieben(p + 16 * i)
        erlaubt.append((von, bis))
        aenderungen.append(f'{g["dxf"]}: Mitte {hx:.3f}/{hy:.3f} → {nx:.3f}/{ny:.3f}')

    # Füllungen: die Füllungs-Struktur (≥ 42 Felder) folgt auf die DXF darin
    fuellung, letzte_dxf = {}, None
    for p, r in st:
        if r and isinstance(r[0], str) and r[0].lower().endswith('.dxf'): letzte_dxf = r[0].split('\\')[-1].lower()
        elif len(r) >= 42 and letzte_dxf and isinstance(r[5], float):
            fuellung.setdefault(letzte_dxf, p); letzte_dxf = None
    for f in auftrag.get('fuellungen', []):
        k = str(f['dxf']).lower()
        if k not in fuellung: raise SystemExit(f'Füllung um {f["dxf"]} nicht gefunden')
        erlaubt.append((fuellung[k], ende(fuellung[k])))
        if 'abstand' in f:
            fp, _ = _feld(q, fuellung[k], 5, 8); struct.pack_into('<d', q2, fp, float(f['abstand']))
        if 'winkel' in f:
            fp, _ = _feld(q, fuellung[k], 8, 8); struct.pack_into('<d', q2, fp, float(f['winkel']))
        aenderungen.append(f'Füllung {f["dxf"]}: ' + ', '.join(f'{a} {f[a]}' for a in ('abstand', 'winkel') if a in f))

    pos = 0
    for von, bis in sorted(erlaubt):
        if q[pos:von] != q2[pos:von]: raise SystemExit('Gegenprobe: Änderung außerhalb des Auftrags')
        pos = max(pos, bis)
    if q[pos:] != q2[pos:]: raise SystemExit('Gegenprobe: Änderung außerhalb des Auftrags')
    for pos, alt, neu in sorted(splices, reverse=True):
        q2[pos:pos + alt] = neu
    neu_d = bytearray(zusammen(d, s, bytes(q2), tab, packen(bytes(q2), codes)))

    # Gegenprobe: neu lesen — Objektzahl, Pfade und Auftrag
    alt_obj = lesen.objekte(ezd.EZCFile(io.BytesIO(d)).objects)
    ez_neu = ezd.EZCFile(io.BytesIO(bytes(neu_d)))
    neu_obj = lesen.objekte(ez_neu.objects)
    if len(neu_obj) != len(alt_obj): raise SystemExit(f'Gegenprobe: {len(neu_obj)} statt {len(alt_obj)} Objekte')
    for b in auftrag.get('bilder', []):
        treffer = [o for o in neu_obj if o['typ'] == 'image'
                   and o['pfad'].split('\\')[-1].lower() == str(b.get('pfad', b['datei'])).split('\\')[-1].lower()]
        if not treffer: raise SystemExit(f'Gegenprobe: Bild {b["datei"]} fehlt')
        o = treffer[-1] if 'pfad' in b else treffer[0]
        if 'x' in b and abs(o['x'] - float(b['x'])) > 1e-6: raise SystemExit('Gegenprobe: x stimmt nicht')
        if 'dpi' in b and o['dpi'] != int(b['dpi']): raise SystemExit('Gegenprobe: DPI stimmt nicht')
        if 'stift' in b and o['pen'] != int(b['stift']): raise SystemExit('Gegenprobe: Stift stimmt nicht')
    for g in auftrag.get('gravuren', []):
        o = next(o for o in neu_obj if o['typ'] == 'vectorfile' and o['pfad'].split('\\')[-1].lower() == str(g['dxf']).lower())
        if any(k in g and abs(o[k] - float(g[k])) > 1e-6 for k in ('x', 'y')): raise SystemExit('Gegenprobe: Gravur-Lage stimmt nicht')
    s2 = ez_neu._locations['vectors']; kopf = struct.unpack_from('<IIIII', neu_d, s2)
    if x25(bytes(ez_neu._decompressed_vectors)) != kopf[1] or x25(bytes(neu_d[s2:s2 + 16])) != kopf[4]:
        raise SystemExit('Gegenprobe: Prüfsummen stimmen nicht')
    with open(ziel, 'wb') as f:
        f.write(neu_d); f.flush(); os.fsync(f.fileno())
    print(json.dumps({'aenderungen': aenderungen, 'bytes': [len(d), len(neu_d)]}, ensure_ascii=False))

if __name__ == '__main__':
    main(*sys.argv[1:4])
