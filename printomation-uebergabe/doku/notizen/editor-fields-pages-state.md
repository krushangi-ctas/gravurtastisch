---
name: editor-fields-pages-state
description: "Layout-Editor: 'fields' (live) vs. '_pages' (Snapshots) — Sync-Falle; Füllen/Export lesen _pages"
metadata: 
  node_type: memory
  type: project
  originSessionId: 323df496-e60d-4aa9-9967-57c6b31d24d1
---

Im Layout-Editor (`public/layout-editor.html`) gibt es zwei Zustände: `fields` = live editierte Felder der aktuellen Seite, `_pages` = Seiten-Snapshots. Sync **nur** über `saveCurrentPageSnapshot()` (aufgerufen bei Seitenwechsel, `saveLayout`, Exporten — und seit 14.07.2026 auch am Anfang von `fillAllPagesAuto`).

**Falle:** `saveUndo()` → `_snapshot()` ruft `saveCurrentPageSnapshot()` **vor** der Änderung auf — `_pages` hinkt also immer eine Bearbeitung hinterher. Konsumenten von `_pages` (Füllen, Füllen+Export, Mehrseiten-Export) sahen dadurch frische Änderungen nicht. Konkreter Bug (behoben 14.07.2026): Array erstellen ohne Speichern → Füllen füllte nur den Master, die Kopien verschwanden; nach `saveLayout` ging es, weil das den Snapshot synct.

**How to apply:** Jede neue Funktion, die aus `_pages` liest, muss vorher `saveCurrentPageSnapshot()` aufrufen (außer `_pages` ist leer → aus `fields` initialisieren, `_currentPage` beachten). Verifiziert per Headless-Test, siehe [[layout-editor-testen]].
