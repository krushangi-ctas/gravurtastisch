---
name: fotoqualitaet-kennzahlen
description: Woran man ein für die Gravur untaugliches Kundenfoto misst — keine Einzelkennzahl trennt, DPI ist schwächer als gedacht
metadata:
  type: project
---

Am 17.09.2026 an 31 F02-Feuerzeug-Fotos (15./16.09.) durchgemessen, gegen die drei
bekannt schlecht gravierten (305-2675995-3888342, 028-8490154-7680347,
305-3767672-2864313):

**Keine einzelne Kennzahl trennt gut von schlecht.** Insbesondere:
- *Effektive DPI* ist schwächer als erwartet: 305-0150504-2171525 kam mit **135 DPI**
  durch (Tonwertumfang 76 %), während das schlechteste Foto 298 DPI hatte. Wenig
  Auflösung schadet nur, wenn auch der Kontrast fehlt.
- *Schärfe/Kantenenergie* trennt ebenfalls nicht (gute Fotos ab 4).
- Am brauchbarsten ist der **Tonwertumfang im fertigen 1-Bit-Raster** (p95−p05 der
  Dichte über 64-px-Kacheln): die beiden flächigen Problemfälle liegen mit 47 % und
  49 % auf Rang 1 und 4 der Rangliste, alle unbeanstandeten ab 48 %.
- Das dritte Problemfoto (grünes Sci-Fi-Poster) hat 70 % Umfang und fällt nur über den
  **Farbkontrast-Verlust** auf (Luma-Umfang gegen max(R,G,B)-Umfang).

**Wichtige Einschränkung:** die „gut"-Menge ist unbestätigt — belegt schlecht sind nur
die drei. Für belastbare Schwellen müssten ~30–50 Gravuren einzeln als gut/schlecht
bewertet werden.

Offene Verdachtsfälle aus derselben Messung, nie gegengeprüft: **306-8606127-0036354**
(V5, 16.09., Plätze 6+7, Umfang 48 %) und **303-2566469-8721954** (V6 Platz 10,
Umfang 51 %). Siehe [[lokaler-kontrast]], [[auto-gamma]].
