---
name: ki-bildverbesserung-abgelehnt
description: KI-Gesichtsrestauration (GFPGAN/CodeFormer) für Kundenfotos ist entschieden abgelehnt — nicht erneut vorschlagen
metadata:
  type: project
---

Am 17.09.2026 besprochen und **abgelehnt**: Kundenfotos vor der Gravur durch ein
KI-Modell (GFPGAN, CodeFormer o. ä.) aufwerten zu lassen.

**Warum:** Solche Modelle *erfinden* Details. Bei einem Gesicht, das auf dem Feuerzeug
nur ~2 mm breit ist (≈21 Bildpunkte Augenbreite), hat das Modell kaum echte Information
und malt ein plausibles, aber fremdes Gesicht. Bei Erinnerungsstücken ist ein subtil
falsches Gesicht schlimmer als ein unscharfes. Dazu: der Server hat kein PyTorch, keine
GPU, 3 GB RAM und 2 Kerne — 30–60 s je Foto auf CPU.

**Wie anzuwenden:** Nicht erneut als Lösung vorschlagen. Der stattdessen gewählte Weg ist
klassische Bildverarbeitung: lokaler Kontrast ([[lokaler-kontrast]]) und
Kantenverstärkung per Sobel. KI wäre allenfalls zum *Finden* von Gesichtern akzeptabel
(um vorab zu warnen, wie groß sie auf dem Werkstück landen) — nicht zum Verändern.
