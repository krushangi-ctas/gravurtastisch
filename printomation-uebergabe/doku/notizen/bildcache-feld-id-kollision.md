---
name: bildcache-feld-id-kollision
description: _originalImgs war nach Feld-ID indiziert und überlebte Layout-/Füllwechsel — Export gravierte das Foto der vorigen Befüllung; behoben 19.08.2026
metadata:
  type: project
---

**Gravierender Bug, am 19.08.2026 gefunden, reproduziert und behoben.** Der Laser-Export gravierte unter Umständen ein **fremdes Kundenfoto** — ohne Fehlermeldung.

Ursache: `_originalImgs` (layout-editor.html) sichert vor dem Dithern das Originalbild, indiziert nach **Feld-ID**. Feld-IDs sind aber nur *innerhalb* eines Layouts eindeutig — `recalcIdc()` setzt den Zähler beim Laden auf die höchste ID des neuen Layouts, jedes Layout beginnt also wieder bei 1. Der Cache wurde weder beim Layout-Wechsel noch beim Leeren der Felder geräumt, und `renderFieldToCtx` liest beim Export `_originalImgs[f.id] || f._img` — also den Alteintrag.

Zwei reproduzierte Wege (Headless-Beweis mit farbigen Testbildern):
1. Layout A füllen → „Dithering auf alle anwenden" → Layout B laden und füllen → Export zeigte das Bild aus **A**.
2. Praxisnäher, gleiches Layout: füllen → dithern → Inhalt leeren → neu füllen → Export zeigte die **vorige** Befüllung. Da `fillWithData` intern `_clearFieldData(fields)` aufruft, betraf das jeden zweiten Füllvorgang nach einmaligem Dithern.

Auslöser ist immer der Knopf **„Dithering auf alle anwenden"** im Laser-Tab (die einzige Stelle, die `_originalImgs` befüllt). Wer ihn nie drückt, war nie betroffen — deshalb blieb es lange unentdeckt.

**Fix:** `_clearOriginalImgs()` beim Layout-Wechsel (in `_applyLayoutState`, direkt nach `recalcIdc()`) und `delete _originalImgs[f.id]` in `_clearFieldData` — also überall dort, wo Feldinhalte ohnehin zurückgesetzt werden.

**Why:** Ein falsches Foto fällt beim Gravieren nicht auf, das Werkstück ist danach Ausschuss und der Kunde bekommt fremde Daten zu sehen.

**How to apply:** Bei Änderungen an Bild-Caches gilt: die Feld-ID ist KEIN global eindeutiger Schlüssel. Wer etwas pro Feld cacht, muss es beim Layout-Wechsel und in `_clearFieldData` mit aufräumen. Verwandt: [[editor-fields-pages-state]].
