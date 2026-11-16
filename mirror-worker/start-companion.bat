@echo off
title ModusDesk GSThub Desktop Companion
cd /d "%~dp0"
echo =======================================================
echo   ModusDesk GSThub Desktop Companion v1.0.4
echo   Running on http://127.0.0.1:9090
echo   Ready for 1-Click GST Portal Auto-Login & GSTR-4A
echo =======================================================

:: Free port 9090 if already occupied by an old instance
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9090 ^| findstr LISTENING 2^>nul') do (
    echo [CLEANUP] Terminating stale instance PID %%a on port 9090...
    taskkill /F /PID %%a >nul 2^>nul
)

set "NODE_EXE=node"
if exist "%~dp0node.exe" set "NODE_EXE=%~dp0node.exe"
if exist "C:\Program Files\nodejs\node.exe" set "NODE_EXE=C:\Program Files\nodejs\node.exe"

"%NODE_EXE%" dist/server.js
pause
