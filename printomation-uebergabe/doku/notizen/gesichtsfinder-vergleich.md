---
name: gesichtsfinder-vergleich
description: 11.10.2026 MediaPipe BlazeFace (Reklamation) gegen SCRFD (InsightFace) an 46 Kundenfotos + 16 Stock — SCRFD 76/82 Gesichter (93 %), MediaPipe 40/82 (49 %); Lizenz der SCRFD-Gewichte offen
metadata:
  type: project
---

**Ist-Stand:** Der Tageslauf hat KEINEN Gesichtsfinder — nur die eigene Hautmaske (`_hautMaske`, Farbregeln; nutzt Motiv-Automatik + Hautkurve; hält Holz/Fell für Haut, verfehlt dunkle Haut). Nur die Reklamation nutzt MediaPipe FaceDetector short_range (public/vendor/mediapipe, minDetectionConfidence 0,4, auf dem Originalfoto).

**Test 11.10. (Nutzer: „unser Verfahren gegen SCRFD"):** 46 Original-Kundenfotos aus public/2026-10-09…11 + 16 Stock-Gruppenfotos; Bild im Chromium dekodiert (EXIF wie App), MediaPipe im Browser, SCRFD-10G/0.5G (buffalo_l/buffalo_sc det_*.onnx, onnxruntime-node 1.19.2) in Node, 640er Einpassung, Schwelle 0,5, NMS 0,4. Handgezählt: 82 menschliche Gesichter in den Kundenfotos.
- **SCRFD-10G 76/82 (93 %)**; Fehlschläge nur Profil/verdeckt (Kuss), winzig (<3 mm am Feuerzeug, 306-4026903), gedrehtes Gesicht, Silhouette. Fehltreffer: Gorilla-Statue, Hund, 1× Umhang (Hundegemälde), Stock 2 (Lagerfeuer, Hinterkopf). Menge 38 Gesichter gefunden.
- **MediaPipe 40/82 (49 %)** — verfehlt auch große Hauptgesichter in Paarfotos (Sonnenbrille, zweites Gesicht), Familien/Gruppen fast ganz; Kästen teils viel zu groß; Hunde als Gesicht.
- SCRFD-0.5G ähnlich wie 10G, etwas weniger bei kleinen Gesichtern.
**Lizenz:** InsightFace-Code MIT, die vortrainierten Modelle laut README nur nicht-kommerziell — vor Produktiv-Einsatz klären; Alternative zum gleichen Test: YuNet (OpenCV Zoo, MIT). Skripte/Modelle nur im Scratchpad (gesicht/vergleich.js, dl-modelle/, dl-ort/).
Verwandt: [[einstellungs-pruefung-2026-10-11]], [[rekla-foto-nachbessern]].

**Nutzer 11.10.: „wieso SCRFD vorschlagen, wenn es kostenlose gibt?" — berechtigt; künftig bei Werkzeug-Vorschlägen die Lizenz ZUERST prüfen und das frei nutzbare Mittel zuerst nennen.** SCRFD ohne Lizenz NICHT in die Produktion (Nutzer wollte „nicht kommerziell" nennen — abgelehnt, Lizenz-Mail entworfen).
**YuNet (OpenCV Zoo 2023mar, MIT, 232 KB, gleiche 82 Gesichter):** Schwelle 0,9 (OpenCV-Standard) viel zu streng; **0,6: 68/82 (83 %)**, Fehler: gedrehte Gesichter, Profil, ein kleines Hintergrundgesicht, Spiegel-Selfie mit Handy; 1 Fehltreffer (Hand) + Hunde. Zusätzlich 90°/270° gedreht prüfen: 72/82 (88 %), holt gedrehte Gesichter (besser als SCRFD dort), bringt aber ~8 Fehltreffer (Hände, Körper, Ohr, Schuh) — braucht Filter. Dekodierung wie cv::FaceDetectorYN: BGR 0–255, score = √(cls·obj), cx=(c+dx)·s, w=e^dw·s, NMS 0,3. Skripte gesicht/yunet*.js im Scratchpad.
