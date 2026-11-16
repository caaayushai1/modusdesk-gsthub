$wsh = New-Object -ComObject WScript.Shell
$desktopPath = [System.Environment]::GetFolderPath('Desktop')
if (-not (Test-Path $desktopPath)) {
    $desktopPath = "C:\Users\gaayu\OneDrive\Desktop"
}
$linkPath = Join-Path $desktopPath "ModusDesk GST Companion.lnk"

$link = $wsh.CreateShortcut($linkPath)
$link.TargetPath = "C:\Users\gaayu\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker\start-companion.bat"
$link.WorkingDirectory = "C:\Users\gaayu\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker"
$link.Description = "ModusDesk GSThub Desktop Companion - 1-Click GST Automation"
$link.Save()

Write-Output "SUCCESS: Created shortcut at $linkPath"
