@echo off
cd /d "%~dp0"
echo Loading env and starting backend (Flask on port 5000)...
start "Travelsign Backend" cmd /k "cd /d %~dp0backend && set GEMINI_API_KEY=AIzaSyAvesAiVBlSj6wDlGfGI5qvXmKYlIyyfqU && python server.py"
timeout /t 2 /nobreak >nul
echo Starting frontend (Expo)...
call npm start
