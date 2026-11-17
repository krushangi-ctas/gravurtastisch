---
name: tag-laden-bat-defender
description: "Windows Defender killte die Polyglot-\"Tag laden.bat\" (Batch startet PowerShell aus sich selbst) — Ersatz ist reines cmd.exe, Stand 16.09.2026"
metadata: 
  node_type: memory
  type: project
  originSessionId: 7f08fa25-b6d2-4437-b01b-78ef67ec0bd7
  modified: 2026-09-16T10:45:15.072Z
---

Die erste `exports/_Vorlage/Tag laden.bat` war ein **Batch-PowerShell-Polyglot**: der Batch-Teil
startete `powershell.exe -ExecutionPolicy Bypass -WindowStyle Hidden -Command "Invoke-Expression
([IO.File]::ReadAllText($env:TAGLADEN_DATEI))"`, um den PowerShell-Teil derselben Datei auszuführen
(Auswahlfenster mit Tag und Layout-Häkchen). **Windows Defender hat sie am 16.09.2026 abgeschaltet** —
diese Kombination ist ein bekanntes Schadsoftware-Muster. **Nie wieder so bauen.**

**Ersatz (16.09.2026, installiert):** reines cmd.exe, kein PowerShell, kein Skript-Nachladen.
`Tag laden.bat` zeigt nur ein Nummernmenü der Tagesordner (`dir /b /ad /o-n`, gefiltert auf
`JJJJ-MM-TT`) und ruft dann für jedes Layout dieses Tages die `lade-diesen-tag.bat` auf, die schon
immer im Archivordner liegt — pures `copy`, unverdächtig. Argument `sammel` unterdrückt dort das
`pause` (`if "%~1"=="" pause`), sonst müsste man sechsmal Enter drücken; am Ende steht `exit /b 0`,
weil die optionalen `copy` für nicht vorhandene Dateien errorlevel 1 setzen und die Sammeldatei das
sonst als Fehler zählt. Generator dafür ist `_ladeTagBat()` in `public/layout-editor.html`; die zwölf
schon vorhandenen `lade-diesen-tag.bat` im Archiv wurden am 16.09. auf denselben Stand gebracht.

**Ungetestet unter Windows** (kein Windows und kein wine auf dem Server) — beim ersten Lauf
zuschauen. Was die Batch-Kette NICHT kann: fehlende DXF eines alten Tages im Arbeitsordner leeren
(das macht nur `laden()` in `vorlage.controller.js`); sie warnt stattdessen, wenn der gewählte Tag
keine `gravur1.dxf` hat.

Der sichere Weg bleibt der Editor: Reiter 🛠 Maschinen → Ezcad, Auswahlfeld je Ordner + „Laden"
(s. [[ezcad-reiter]], [[f02-vorlagen-betrieb]]). Beim Schreiben von Batch-Dateien über das Bash-Tool
aufpassen: `>nul` wurde dabei einmal zu `>/dev/null` verfälscht — fertige Dateien danach prüfen.
