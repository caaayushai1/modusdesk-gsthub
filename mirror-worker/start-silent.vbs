Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverJs = strDir & "\dist\server.js"
logFile = strDir & "\companion_output.log"

nodeExe = "node.exe"
If fso.FileExists(strDir & "\node.exe") Then
    nodeExe = strDir & "\node.exe"
ElseIf fso.FileExists("C:\Program Files\nodejs\node.exe") Then
    nodeExe = "C:\Program Files\nodejs\node.exe"
End If

WshShell.CurrentDirectory = strDir

' Cleanly terminate any stale process on port 9090
WshShell.Run "powershell.exe -WindowStyle Hidden -Command ""Get-NetTCPConnection -LocalPort 9090 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }""", 0, True

' Start node server.js silently in background with output redirected to logFile
cmdLine = "cmd.exe /c " & Chr(34) & Chr(34) & nodeExe & Chr(34) & " " & Chr(34) & serverJs & Chr(34) & " >> " & Chr(34) & logFile & Chr(34) & " 2>&1" & Chr(34)
WshShell.Run cmdLine, 0, False

Set WshShell = Nothing
Set fso = Nothing
