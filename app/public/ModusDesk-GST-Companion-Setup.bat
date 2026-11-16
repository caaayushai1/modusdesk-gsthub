@echo off
setlocal enabledelayedexpansion
title ModusDesk GST Auto-Login Companion Setup
cls
echo ==============================================================
echo     ModusDesk GSThub Desktop Companion (v1.0.4)
echo     Automatic Startup ^& Browser Protocol Registration
echo     Gupta Aayush ^& Co. (Chartered Accountants)
echo ==============================================================
echo.

:: Detect if companion already exists locally
set "TARGET_DIR="
if exist "%~dp0mirror-worker\start-silent.vbs" (
    set "TARGET_DIR=%~dp0mirror-worker"
) else if exist "%~dp0start-silent.vbs" (
    set "TARGET_DIR=%~dp0"
) else if exist "%LOCALAPPDATA%\ModusDesk\companion\start-silent.vbs" (
    set "TARGET_DIR=%LOCALAPPDATA%\ModusDesk\companion"
) else if exist "%USERPROFILE%\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker\start-silent.vbs" (
    set "TARGET_DIR=%USERPROFILE%\OneDrive\Desktop\Demo1\ModusDesk_GSThub\mirror-worker"
) else if exist "%USERPROFILE%\Desktop\Demo1\ModusDesk_GSThub\mirror-worker\start-silent.vbs" (
    set "TARGET_DIR=%USERPROFILE%\Desktop\Demo1\ModusDesk_GSThub\mirror-worker"
)

:: If not found, download and install companion package from cloud
if "!TARGET_DIR!"=="" (
    set "TARGET_DIR=%LOCALAPPDATA%\ModusDesk\companion"
    echo [1/4] Setting up companion on this PC...
    echo       Downloading ModusDesk Companion files from cloud...
    if not exist "!TARGET_DIR!" mkdir "!TARGET_DIR!"
    
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://modusdesk-gsthub.vercel.app/downloads/ModusDesk-Companion.zip', '$env:TEMP\ModusDesk-Companion.zip')"
    if not exist "%TEMP%\ModusDesk-Companion.zip" (
        echo [ERROR] Could not download companion files. Please check your internet connection.
        pause
        exit /b 1
    )
    
    echo [2/4] Extracting companion application...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "Expand-Archive -Path '$env:TEMP\ModusDesk-Companion.zip' -DestinationPath '!TARGET_DIR!' -Force"
    del "%TEMP%\ModusDesk-Companion.zip" >nul 2>nul
)

:: Ensure Node.js runtime is available
set "HAS_NODE="
where node.exe >nul 2>nul && set "HAS_NODE=1"
if exist "C:\Program Files\nodejs\node.exe" set "HAS_NODE=1"
if exist "!TARGET_DIR!\node.exe" set "HAS_NODE=1"

if "!HAS_NODE!"=="" (
    echo [3/4] Downloading lightweight Node.js runtime for companion...
    powershell -NoProfile -ExecutionPolicy Bypass -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; (New-Object Net.WebClient).DownloadFile('https://nodejs.org/dist/v20.18.0/win-x64/node.exe', '!TARGET_DIR!\node.exe')"
)

if "!TARGET_DIR:~-1!"=="\" set "TARGET_DIR=!TARGET_DIR:~0,-1!"
set "VBS_PATH=!TARGET_DIR!\start-silent.vbs"
set "STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
set "DESKTOP_DIR=%USERPROFILE%\Desktop"

echo Found Desktop Companion at: "!TARGET_DIR!"
echo.

echo [3/4] Registering 'modusdesk://' custom browser protocol...
reg add "HKCU\Software\Classes\modusdesk" /ve /t REG_SZ /d "URL:ModusDesk Protocol" /f >nul 2>nul
reg add "HKCU\Software\Classes\modusdesk" /v "URL Protocol" /t REG_SZ /d "" /f >nul 2>nul
reg add "HKCU\Software\Classes\modusdesk\shell\open\command" /ve /t REG_SZ /d "wscript.exe \"!VBS_PATH!\" \"%%1\"" /f >nul 2>nul
echo       [DONE] Browser Protocol registered! Web app can now launch companion with 1 click.

echo [4/4] Configuring auto-start shortcuts...
set "SHORTCUT_SCRIPT=%TEMP%\CreateModusDeskShortcuts.vbs"
echo Set oWS = WScript.CreateObject("WScript.Shell") > "%SHORTCUT_SCRIPT%"
echo sLinkFile = "%STARTUP_DIR%\ModusDesk-GST-Companion.lnk" >> "%SHORTCUT_SCRIPT%"
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> "%SHORTCUT_SCRIPT%"
echo oLink.TargetPath = "wscript.exe" >> "%SHORTCUT_SCRIPT%"
echo oLink.Arguments = Chr(34) ^& "!VBS_PATH!" ^& Chr(34) >> "%SHORTCUT_SCRIPT%"
echo oLink.WorkingDirectory = "!TARGET_DIR!" >> "%SHORTCUT_SCRIPT%"
echo oLink.Description = "ModusDesk GST Companion Auto-Start" >> "%SHORTCUT_SCRIPT%"
echo oLink.Save >> "%SHORTCUT_SCRIPT%"

echo sDeskFile = "%DESKTOP_DIR%\ModusDesk GST Companion.lnk" >> "%SHORTCUT_SCRIPT%"
echo Set oDeskLink = oWS.CreateShortcut(sDeskFile) >> "%SHORTCUT_SCRIPT%"
echo oDeskLink.TargetPath = "wscript.exe" >> "%SHORTCUT_SCRIPT%"
echo oDeskLink.Arguments = Chr(34) ^& "!VBS_PATH!" ^& Chr(34) >> "%SHORTCUT_SCRIPT%"
echo oDeskLink.WorkingDirectory = "!TARGET_DIR!" >> "%SHORTCUT_SCRIPT%"
echo oDeskLink.Description = "ModusDesk GST Companion" >> "%SHORTCUT_SCRIPT%"
echo oDeskLink.Save >> "%SHORTCUT_SCRIPT%"

cscript /nologo "%SHORTCUT_SCRIPT%" >nul 2>nul
del "%SHORTCUT_SCRIPT%" >nul 2>nul

echo Starting Desktop Companion in background now...
wscript.exe "!VBS_PATH!"
echo       [DONE] Desktop Companion service triggered.

echo.
echo ==============================================================
echo [SUCCESS] ModusDesk GST Companion is now active!
echo - Auto-Starts on Windows boot (Never need to start manually again)
echo - Starts with 1 click from ModusDesk ^& GSThub Web App
echo - Running silently in background on http://127.0.0.1:9090
echo ==============================================================
echo.
timeout /t 5
