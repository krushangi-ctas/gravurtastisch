---
name: ledger-zuruecksetzen
description: "Gelöschte Bestellungen neu herunterladen geht nur über processed-orders.json — und der Prozess cacht es, also pm2 restart nicht vergessen"
metadata: 
  node_type: memory
  type: project
  originSessionId: d776acb5-eef3-4c4e-b00c-a6f5871ee99b
  modified: 2026-07-31T12:30:32.304Z
---

Wer Bestell-Ordner unter `public/<Tag>/` von Hand löscht, bekommt sie mit einem normalen Download **nicht** zurück: die IDs stehen im Ledger `src/daten/processed-orders.json`, der Vorfilter meldet „already downloaded, skipping" und im Editor gibt es nichts mehr zu füllen. Genau das sah am 31.07.2026 wie „manuelles Laden funktioniert nicht" aus.

**Rezept:** Ledger sichern → Einträge freigeben, deren Ordner nicht mehr existiert (Zeitstempel-Grenze setzen, damit alte, längst gravierte Bestellungen nicht mitkommen) → **`pm2 restart printomation`** → Download mit dem gewünschten Fenster → Auto-Export headless über `?autoexport=1`.

**Die Falle:** `loadProcessedLedger()` hält das Ledger in `_processedLedger` im Speicher und schreibt es beim nächsten Lauf komplett zurück. Ohne Neustart ist die Datei-Änderung wirkungslos und wird überschrieben — im Log erkennbar daran, dass „Dedup gesamt: N IDs" weiter die alte Zahl zeigt. Vorher/Nachher-Beleg: 2142 → 2028 Einträge, Vorfilter danach „128 im Fenster → 21 bekannt, 107 neu".

**How to apply:** Vor dem Neu-Lauf die bestehenden Exporte des Tages wegräumen (`exports/<Tag>` umbenennen), sonst mischen sich Teilläufe mit dem vollständigen Lauf und es wird doppelt graviert.

Verwandt: [[amazon-pending-latenz]], [[download-windowing-bug]], [[betriebs-konventionen]], [[deployment-setup]].
