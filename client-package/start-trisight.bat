@echo off
echo TriSight Equity Analyst
echo Starting application, please wait...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
  echo Node.js is not installed! Please install Node.js first.
  echo You can download it from https://nodejs.org/
  pause
  exit /b
)

REM Install serve if not already installed
echo Installing required packages...
npm install serve --no-fund --no-audit --no-progress --silent

REM Run local server in background
echo Starting server...
start /min cmd /c "npx serve -s build -l 3000"

REM Wait 2 seconds to ensure server has started
timeout /t 2 /nobreak > nul

REM Open default browser to the application
start http://localhost:3000

echo TriSight Equity Analyst is now running in your web browser.
echo.
echo IMPORTANT: Do not close this window while using the application.
echo When you're finished, close this window to shut down the application.
echo.
pause

REM When user presses any key, terminate the server process
taskkill /f /im node.exe 2>nul
exit
