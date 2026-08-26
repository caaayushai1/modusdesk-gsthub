@echo off
echo Stopping ModusDesk GSThub Desktop Companion...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :9090 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo Companion stopped.
pause
