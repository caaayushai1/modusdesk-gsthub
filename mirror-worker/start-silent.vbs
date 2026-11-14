Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")
strDir = fso.GetParentFolderName(WScript.ScriptFullName)
serverJs = strDir & "\dist\server.js"

nodeExe = "node.exe"
If fso.FileExists("C:\Program Files\nodejs\node.exe") Then
    nodeExe = "C:\Program Files\nodejs\node.exe"
End If

WshShell.CurrentDirectory = strDir
cmdLine = "cmd.exe /c """"" & nodeExe & """ """ & serverJs & """"""
WshShell.Run cmdLine, 0, False

Set WshShell = Nothing
Set fso = Nothing
