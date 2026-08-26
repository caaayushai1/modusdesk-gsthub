@echo off
title ModusDesk GSThub Desktop Companion
echo ========================================
echo  ModusDesk GSThub Desktop Companion
echo  Starting on http://127.0.0.1:9090
echo ========================================
cd /d "%~dp0"
npx tsx src/server.ts
pause
