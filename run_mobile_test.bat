@echo off
cd /d "%~dp0"
echo Starting local server (Vite)...
start "Vite Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo Opening mobile view...
start msedge --app="http://127.0.0.1:7889" --window-size=390,844 2>nul
if %errorlevel% neq 0 (
    echo Edge app mode failed, opening default browser...
    start http://127.0.0.1:7889
)

echo Press any key to close this launcher window...
pause > nul
