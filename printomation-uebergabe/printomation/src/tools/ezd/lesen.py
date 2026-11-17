"""Liest eine EzCad2-.ezd und gibt JSON aus: Objekte (Bilder, Vektordateien, Füllungen) und Stifte.
Nur LESEN — geschrieben wird über objekte.py (immer erst als ENTWURF). Parser:
meerk40t/extra/ezd.py (MIT-Lizenz), unverändert übernommen; seine meerk40t-Abhängigkeiten werden
unten durch Attrappen ersetzt, weil wir nur Struktur und Pfade brauchen, keine
Geometrie-Umrechnung."""
import sys, os, json, struct, types
HIER = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HIER)

# ── Attrappen für die meerk40t-Module, die ezd_meerk40t.py importiert ─────────
# (bis 23.10.2026 acht Mini-Dateien unter stub/). Vor dem Import eintragen.
class _Egal:
    def __init__(self, *a, **k): self.a = a; self.k = k
    def __getattr__(self, n): return lambda *a, **k: None
class _BadFileError(Exception): pass
class _Linecap: pass
class _Linejoin: pass
def _modul(name, **inhalt):
    m = types.ModuleType(name); m.__dict__.update(inhalt); sys.modules[name] = m; return m
_modul('meerk40t'); _modul('meerk40t.core'); _modul('meerk40t.core.node')
_modul('meerk40t.core.exceptions', BadFileError=_BadFileError)
_modul('meerk40t.core.node.node', Linecap=_Linecap, Linejoin=_Linejoin)
_modul('meerk40t.core.units', UNITS_PER_INCH=65535, UNITS_PER_MM=65535 / 25.4)
_modul('meerk40t.svgelements', Color=_Egal, Matrix=_Egal, Path=_Egal, Polygon=_Egal)
# PIL nur fürs Vorschaubild, das hier nicht gebraucht wird
_modul('PIL', Image=_modul('PIL.Image', open=lambda b: ('BMP', len(b.getvalue()))))

import ezd_meerk40t as ezd

# Schnelleres Entpacken des Objekt-Teils. meerk40t nimmt ohne das Paket bitarray (fehlt hier) eine
# Bit-für-Bit-Schleife — bei F02_Schw_V5R (21,7 Mio. Bit) 3–4 s. Die Huffman-Codes der F02-Dateien
# sind höchstens 11 Bit lang; eine Tabelle über 16-Bit-Fenster liefert je Nachschlagen alle Zeichen,
# die vollständig im Fenster liegen (im Mittel ~4). Längere Codes → meerk40ts eigene Routine.
_meerk40t_dekodieren = ezd._huffman_decode_python
def _schnell_dekodieren(file, laenge):
    start = file.tell()
    (n,) = struct.unpack('<H', file.read(2))
    codes = [struct.unpack('<BIH', file.read(7)) for _ in range(n)]
    if not codes or max(c[2] for c in codes) > 16:
        file.seek(start)
        return _meerk40t_dekodieren(file, laenge)
    daten = file.read() + b'\0\0\0'
    einzeln = [None] * 65536                   # 16-Bit-Fenster → (Zeichen, Codelänge)
    for ch, bits, l in codes:
        code = bits & ((1 << l) - 1)
        for w in range(code << (16 - l), (code + 1) << (16 - l)): einzeln[w] = (ch, l)
    zeichen, verbraucht = [b''] * 65536, [0] * 65536
    for w in range(65536):                    # alle Zeichen, die ganz in diese 16 Bit passen
        out, pos = bytearray(), 0
        while True:
            e = einzeln[(w << pos) & 0xFFFF]
            if e is None or pos + e[1] > 16: break
            out.append(e[0]); pos += e[1]
        zeichen[w], verbraucht[w] = bytes(out), pos
    teile, anzahl, p, ende = [], 0, 0, len(daten) * 8 - 24
    while anzahl < laenge and p < ende:
        i, r = p >> 3, p & 7
        w = (((daten[i] << 16) | (daten[i + 1] << 8) | daten[i + 2]) >> (8 - r)) & 0xFFFF
        z = zeichen[w]
        teile.append(z); anzahl += len(z); p += verbraucht[w]
    return bytearray(b''.join(teile)[:laenge])
ezd._huffman_decode_python = _schnell_dekodieren
ezd._huffman_decode_bitarray = _schnell_dekodieren

def text(p):
    if isinstance(p, (bytes, bytearray)):
        return p.decode('utf-16le', 'replace').split('\x00')[0]
    return p

def zahl(x):
    """Feld aus _parse_struct: 4 Byte = int32, 8 Byte = double, sonst wie geliefert."""
    if isinstance(x, (bytes, bytearray)):
        if len(x) == 4: return struct.unpack('<i', x)[0]
        if len(x) == 8: return struct.unpack('<d', x)[0]
    return x

# meerk40t wirft die Rohfelder von Bild und Stift weg. Gebraucht werden zwei, die es nicht
# übernimmt: beim Bild Feld 1 (Schalter, 0x1000 = „Dynamic File" — meerk40ts status_bits ist
# ein anderes Feld und stand immer auf 0) und beim Stift die Pulsbreite (Feld 8 Q-Puls,
# Feld 25 MOPA, s. charliex2 „ezcad-ezd-parsing-the-pens"). Deshalb hier mitschneiden.
def _roh_merken(cls, nr):
    orig = cls.__init__
    def init(self, file, *a, **k):
        gefangen, ps = [], ezd._parse_struct
        def fang(f):
            r = ps(f); gefangen.append(r); return r
        ezd._parse_struct = fang
        try: orig(self, file, *a, **k)
        finally: ezd._parse_struct = ps
        self.roh = gefangen[nr] if len(gefangen) > nr else []
    cls.__init__ = init
_roh_merken(ezd.EZImage, 1)   # [0] = Objektkopf, [1] = Bildfelder
_roh_merken(ezd.Pen, 0)

def objekt(o):
    n = type(o).__name__
    d = {'typ': n[2:].lower(), 'label': text(getattr(o, 'label', '')) or '',
         'pen': getattr(o, 'pen', None), 'versteckt': bool(getattr(o, 'hidden', False))}
    pos = getattr(o, 'position', None)
    if isinstance(pos, (tuple, list)) and len(pos) == 2:
        d['x'], d['y'] = pos
    if n == 'EZImage':
        d.update(pfad=text(o.image_path), breite=o.width, hoehe=o.height, dpi=o.fixed_dpi_x,
                 flags=zahl(o.roh[1]) if len(o.roh) > 1 else None)
    elif n == 'EZVectorFile':
        d.update(pfad=text(o.path), flags=o.args[1] if len(o.args) > 1 else None,
                 stifte=sorted({c.pen for c in o if isinstance(getattr(c, 'pen', None), int)}))
    elif n == 'EZHatch':
        d.update(kontur=bool(getattr(o, 'mark_contours', 0)),
                 saetze=[{'pen': getattr(o, f'hatch{k}_pen', None), 'abstand': getattr(o, f'hatch{k}_line_space', None),
                          'winkel': getattr(o, f'hatch{k}_angle', None)}
                         for k in (1, 2, 3) if getattr(o, f'hatch{k}_enabled', False)])
    elif n == 'EZText':
        d.update(text=text(getattr(o, 'text', '')))
    return d

# Ezcad schachtelt: eine gefüllte DXF steckt als Kind in einer Füllung (Hatch), Gruppen
# ebenso. Bis 01.10.2026 las dieses Skript nur die oberste Ebene — die Deckel-DXF der F02-.ezd
# (je eine in einer Füllung) fehlten, und der Reiter meldete sie fälschlich als „nicht graviert".
# Bilder und DXF werden deshalb in jeder Tiefe gesucht; was IN einer DXF steckt (ihre Kurven),
# ist deren Inhalt und bleibt draußen.
def objekte(liste, eltern=None, tiefe=0):
    aus = []
    for o in liste:
        n = type(o).__name__
        if tiefe == 0 or n in ('EZImage', 'EZVectorFile'):
            d = objekt(o)
            if eltern: d['in'] = 'Füllung' if eltern == 'EZHatch' else 'Gruppe'
            aus.append(d)
        if n in ('EZHatch', 'EZGroup', 'EZCombine') and tiefe < 6:
            aus += objekte(list(o), n, tiefe + 1)
    return aus

# Welcher Stift lasert was: Bilder ihren eigenen, eine Füllung je Satz einen, die Kontur einer
# gefüllten DXF nur bei „Kontur markieren", eine ungefüllte DXF mit den Stiften ihrer Ebenen.
def stifte(pens, obj):
    wofuer = {}
    def nimm(nr, was):
        if isinstance(nr, int) and 0 <= nr < len(pens): wofuer.setdefault(nr, []).append(was)
    gefuellt = any(o['typ'] == 'hatch' and o['kontur'] for o in obj)
    for o in obj:
        if o['typ'] == 'image': nimm(o['pen'], 'Bilder')
        elif o['typ'] == 'hatch':
            for s in o['saetze']: nimm(s['pen'], 'Füllung')
        elif o['typ'] == 'vectorfile' and (o.get('in') != 'Füllung' or gefuellt):
            for p in o['stifte']: nimm(p, 'DXF')
    aus = []
    for nr in sorted(wofuer):
        a = [zahl(x) for x in pens[nr].roh]
        puls = a[25] if len(a) > 25 and isinstance(a[25], float) else a[8]
        # Nur, was der Reiter vergleicht (DXF-Ebenen auf Stiften mit verschiedenen Werten). Die
        # Verzögerungen (Felder 9–12, 23) zeigte bis 20.10.2026 die Stift-Kachel.
        aus.append({'nr': nr, 'fuer': sorted(set(wofuer[nr]), key=wofuer[nr].index),
                    'leistung': a[6], 'geschw': a[5], 'freq': a[7] / 1000, 'puls': puls, 'durchgaenge': a[4]})
    return aus

def main(pfad):
    with open(pfad, 'rb') as f:
        ez = ezd.EZCFile(f)
    obj = objekte(ez.objects)
    print(json.dumps({'objekte': obj, 'stifte': stifte(ez.pens, obj)}))

if __name__ == '__main__':
    main(sys.argv[1])
