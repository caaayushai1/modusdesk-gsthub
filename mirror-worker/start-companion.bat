@echo off
title ModusDesk GSThub Desktop Companion
cd /d "%~dp0"
echo =======================================================
echo   ModusDesk GSThub Desktop Companion v1.0.0
echo   Running on http://127.0.0.1:9090
echo   Ready for 1-Click GST Portal Auto-Login
echo =======================================================
node dist/server.js
pause
