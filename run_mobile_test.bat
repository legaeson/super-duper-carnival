@echo off
cd /d "%~dp0"
echo Starting local server (Vite)...
start "Vite Dev Server" cmd /k "cd /d "%~dp0" && npm run dev"

echo Waiting for server to start...
timeout /t 3 /nobreak > nul

echo Opening mobile window (9:16 aspect ratio - 400x711)...
:: Try Edge App mode with 9:16 window dimensions
start "" msedge --app="http://127.0.0.1:7889/super-duper-carnival/" --window-size=400,711 2>nul
if %errorlevel% neq 0 (
    :: Fallback to Chrome App mode if Edge is not available
    start "" chrome --app="http://127.0.0.1:7889/super-duper-carnival/" --window-size=400,711 2>nul
)

exit

