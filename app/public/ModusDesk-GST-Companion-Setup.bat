@echo off
setlocal enabledelayedexpansion
title ModusDesk GST Auto-Login Companion Setup
cls
echo ==============================================================
echo     ModusDesk GSThub Desktop Companion (v1.0.0)
echo     Automatic Startup & Browser Protocol Registration
echo     Gupta Aayush ^& Co. (Chartered Accountants)
echo ==============================================================
echo.

:: Detect mirror-worker directory
set TARGET_DIR=
if exist "%~dp0mirror-worker\start-silent.vbs" (
    set "TARGET_DIR=%~dp0mirror-worker"
) else if exist "%~dp0start-silent.vbs" (
    set "TARGET_DIR=%~dp0"
) else if exist "%USERPROFILE%\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker\start-silent.vbs" (
    set "TARGET_DIR=%USERPROFILE%\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker"
) else if exist "%USERPROFILE%\Desktop\Demo1\ModusDesk_GSThub\mirror-worker\start-silent.vbs" (
    set "TARGET_DIR=%USERPROFILE%\Desktop\Demo1\ModusDesk_GSThub\mirror-worker"
) else if exist "C:\Users\%USERNAME%\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker\start-silent.vbs" (
    set "TARGET_DIR=C:\Users\%USERNAME%\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker"
)

if "!TARGET_DIR!"=="" (
    echo [ERROR] Could not automatically locate the ModusDesk Companion directory.
    echo Please make sure the Demo1/ModusDesk_GSThub folder is located on your Desktop or OneDrive.
    echo.
    pause
    exit /b 1
)

:: Strip trailing backslash if present
if "!TARGET_DIR:~-1!"=="\" set "TARGET_DIR=!TARGET_DIR:~0,-1!"

set VBS_PATH=!TARGET_DIR!\start-silent.vbs
set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set DESKTOP_DIR=%USERPROFILE%\Desktop

echo Found Desktop Companion at: "!TARGET_DIR!"
echo.

echo [1/3] Registering 'modusdesk://' custom browser protocol...
reg add "HKCU\Software\Classes\modusdesk" /ve /t REG_SZ /d "URL:ModusDesk Protocol" /f >nul 2>nul
reg add "HKCU\Software\Classes\modusdesk" /v "URL Protocol" /t REG_SZ /d "" /f >nul 2>nul
reg add "HKCU\Software\Classes\modusdesk\shell\open\command" /ve /t REG_SZ /d "wscript.exe \"!VBS_PATH!\" \"%%1\"" /f >nul 2>nul
echo       [DONE] Browser Protocol registered! Web app can now launch companion with 1 click.

echo [2/3] Adding Companion to Windows Startup folder for automatic boot...
set SHORTCUT_SCRIPT="%TEMP%\CreateModusDeskShortcuts.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > %SHORTCUT_SCRIPT%
echo sLinkFile = "%STARTUP_DIR%\ModusDesk-GST-Companion.lnk" >> %SHORTCUT_SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SHORTCUT_SCRIPT%
echo oLink.TargetPath = "wscript.exe" >> %SHORTCUT_SCRIPT%
echo oLink.Arguments = Chr(34) ^& "!VBS_PATH!" ^& Chr(34) >> %SHORTCUT_SCRIPT%
echo oLink.WorkingDirectory = "!TARGET_DIR!" >> %SHORTCUT_SCRIPT%
echo oLink.Description = "ModusDesk GST Companion Auto-Start" >> %SHORTCUT_SCRIPT%
echo oLink.Save >> %SHORTCUT_SCRIPT%

echo sDeskFile = "%DESKTOP_DIR%\ModusDesk GST Companion.lnk" >> %SHORTCUT_SCRIPT%
echo Set oDeskLink = oWS.CreateShortcut(sDeskFile) >> %SHORTCUT_SCRIPT%
echo oDeskLink.TargetPath = "wscript.exe" >> %SHORTCUT_SCRIPT%
echo oDeskLink.Arguments = Chr(34) ^& "!VBS_PATH!" ^& Chr(34) >> %SHORTCUT_SCRIPT%
echo oDeskLink.WorkingDirectory = "!TARGET_DIR!" >> %SHORTCUT_SCRIPT%
echo oDeskLink.Description = "ModusDesk GST Companion" >> %SHORTCUT_SCRIPT%
echo oDeskLink.Save >> %SHORTCUT_SCRIPT%

cscript /nologo %SHORTCUT_SCRIPT% >nul 2>nul
del %SHORTCUT_SCRIPT% >nul 2>nul
echo       [DONE] Auto-start configured! Companion will launch automatically on Windows boot.

echo [3/3] Starting Desktop Companion in background now...
wscript.exe "!VBS_PATH!"
echo       [DONE] Desktop Companion service triggered.

echo.
echo ==============================================================
echo [SUCCESS] ModusDesk GST Companion is now active!
echo - Auto-Starts on Windows boot (Never need to start manually again)
echo - Starts with 1 click from ModusDesk & GSThub Web App
echo - Running silently in background on http://127.0.0.1:9090
echo ==============================================================
echo.
timeout /t 5
