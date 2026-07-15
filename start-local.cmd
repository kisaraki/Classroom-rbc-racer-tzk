@echo off
setlocal
cd /d "%~dp0"

where py >nul 2>nul
if not errorlevel 1 (
  start "Project Aorta Local Server" /min py -3 -m http.server 8000 --bind 127.0.0.1
  goto open_game
)

where python >nul 2>nul
if not errorlevel 1 (
  start "Project Aorta Local Server" /min python -m http.server 8000 --bind 127.0.0.1
  goto open_game
)

echo Python 3 was not found. Start any static file server in this folder.
pause
exit /b 1

:open_game
timeout /t 1 /nobreak >nul
start "" "http://127.0.0.1:8000/"
exit /b 0
