---
name: stockfoto-pruefstand
description: "26.09.2026: 1.600 freie Unsplash-Fotos (Lite, interne Nutzung erlaubt, nicht veröffentlichen) gegen die Pipeline — Grafik-Fehlalarm (Leopard) behoben; Logo-Automatik ~1 % Fehlalarme, Nutzer: bleibt an"
metadata:
  type: project
---

Unsplash Lite (25k Fotos, Metadaten-ZIP 320 MB von unsplash.com/data/lite/latest, TERMS:
intern speichern/nutzen erlaubt, NIE veröffentlichen/weitergeben → nie nach public/). Je 400
S/W, Landschaft, Personen, dunkel+Kanten (Schlagworte), 1200 px, Zuschnitt quer→V5 650×630,
hoch→V6 650×1063, Pipeline in Node alt/neu (~2 Bilder/s, nice 19, Server 2 Kerne/3 GB).

**Befunde:** Bereichsausgleich greift bei ~16 % der Stockfotos (Kunden: 2/112), meist
sichtbar besser (Gegenlicht-Personen, Stadt, Nebel), schlechter bei glattem Sonnenuntergang.
Neuer Grafik-Weg traf einen Leoparden im Dunkeln (Fläche 14→1 %) → seit 26.09. müssen Schwarz
UND Weiß ≥ 1,5 % belegt sein (`_endenBelegt`), 8→1 Fehlalarm (Blüte auf Schwarz).
Logo-Weiche: 24 Stock-Fehlalarme (Nachtstadt, Neon, Waldweg → zu dunkel), S/W jetzt
ausgeschlossen → 18; Merkmale überlappen vollständig mit den Onkelz-Logos. Kunden: 5/5
echte Logos besser (26.09. Beşiktaş-Wappen 303-7281734), 0 Fotos getroffen. `logoAuto`
(Default an) und `alsLogo` (Handschalter) in LASER_DEFAULTS — **Nutzer 26.09.: bleibt AN** (Plätze
unter „ALS LOGO GRAVIERT" vor dem Gravieren ansehen; nicht erneut zur Abschaltung raten). `alsLogo` hat bewusst KEINEN Editor-Schalter (gespeichert machte er jedes Foto des Layouts zum Logo) und geht seit 26.09. vor der Grafik-Weiche. Alter Fehler (bleibt, 0/112 Kundenfelder): alte Grafik-Regel hält Mond/Vogel auf Schwarz für Grafik (23/1600).
Sicherung vor dieser Runde: `vor-korrektur-26-09/`.

Siehe [[schwarz-weiss-bilder]], [[bereichsausgleich]], [[grafik-weiche]].
