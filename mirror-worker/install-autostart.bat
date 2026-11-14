@echo off
setlocal enabledelayedexpansion
title ModusDesk GST Auto-Login Companion Installer
cls
echo ==============================================================
echo     ModusDesk GSThub Desktop Companion (v1.0.0)
echo     Automatic Startup & Browser Protocol Registration
echo ==============================================================
echo.

set CURRENT_DIR=%~dp0
set VBS_PATH=%CURRENT_DIR%start-silent.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set DESKTOP_DIR=%USERPROFILE%\Desktop

echo [1/3] Registering 'modusdesk://' custom browser protocol...
reg add "HKCU\Software\Classes\modusdesk" /ve /t REG_SZ /d "URL:ModusDesk Protocol" /f >nul 2>nul
reg add "HKCU\Software\Classes\modusdesk" /v "URL Protocol" /t REG_SZ /d "" /f >nul 2>nul
reg add "HKCU\Software\Classes\modusdesk\shell\open\command" /ve /t REG_SZ /d "wscript.exe \"%VBS_PATH%\" \"%%1\"" /f >nul 2>nul
echo       Successfully registered browser protocol! You can now start the companion from the web app.

echo [2/3] Adding Companion to Windows Startup folder for automatic boot...
set SHORTCUT_SCRIPT="%TEMP%\CreateModusDeskShortcuts.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SHORTCUT_SCRIPT%
echo sLinkFile = "%STARTUP_DIR%\ModusDesk-GST-Companion.lnk" >> %SHORTCUT_SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SHORTCUT_SCRIPT%
echo oLink.TargetPath = "wscript.exe" >> %SHORTCUT_SCRIPT%
echo oLink.Arguments = Chr(34) ^& "%VBS_PATH%" ^& Chr(34) >> %SHORTCUT_SCRIPT%
echo oLink.WorkingDirectory = "%CURRENT_DIR%" >> %SHORTCUT_SCRIPT%
echo oLink.Description = "ModusDesk GST Companion Auto-Start" >> %SHORTCUT_SCRIPT%
echo oLink.Save >> %SHORTCUT_SCRIPT%

echo sDeskFile = "%DESKTOP_DIR%\ModusDesk GST Companion.lnk" >> %SHORTCUT_SCRIPT%
echo Set oDeskLink = oWS.CreateShortcut(sDeskFile) >> %SHORTCUT_SCRIPT%
echo oDeskLink.TargetPath = "wscript.exe" >> %SHORTCUT_SCRIPT%
echo oDeskLink.Arguments = Chr(34) ^& "%VBS_PATH%" ^& Chr(34) >> %SHORTCUT_SCRIPT%
echo oDeskLink.WorkingDirectory = "%CURRENT_DIR%" >> %SHORTCUT_SCRIPT%
echo oDeskLink.Description = "ModusDesk GST Companion" >> %SHORTCUT_SCRIPT%
echo oDeskLink.Save >> %SHORTCUT_SCRIPT%

cscript /nologo %SHORTCUT_SCRIPT% >nul 2>nul
del %SHORTCUT_SCRIPT% >nul 2>nul
echo       Auto-start registered! The companion will automatically start every time Windows turns on.

echo [3/3] Starting Desktop Companion in background now...
wscript.exe "%VBS_PATH%"
echo       Desktop Companion started on http://127.0.0.1:9090.

echo.
echo ==============================================================
echo [SUCCESS] ModusDesk Desktop Companion is fully configured!
echo - Auto-Starts on Windows boot
echo - Starts instantly when you click "Start Companion" in ModusDesk
echo - Running silently in background on http://127.0.0.1:9090
echo ==============================================================
echo.
pause
