!macro customInit
  IfFileExists "$INSTDIR\data\*.*" 0 noData
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
