!macro customInit
  ; 检查数据目录是否存在（以 lunamanager.db 为标志）
  IfFileExists "$INSTDIR\data\lunamanager.db" 0 noData
  ; 清理可能残留的旧备份
  RMDir /r "$TEMP\lunamanager-data-backup"
  ; 备份整个 data 目录（含 SQLite WAL 文件 -wal/-shm 及 covers/snapshots 等子目录）
  CreateDirectory "$TEMP\lunamanager-data-backup"
  CopyFiles /SILENT "$INSTDIR\data\*.*" "$TEMP\lunamanager-data-backup"
  noData:
!macroend

!macro customInstall
  IfFileExists "$TEMP\lunamanager-data-backup\*.*" 0 noBackup
  CreateDirectory "$INSTDIR\data"
  CopyFiles /SILENT "$TEMP\lunamanager-data-backup\*.*" "$INSTDIR\data\"
  RMDir /r "$TEMP\lunamanager-data-backup"
  noBackup:
!macroend
