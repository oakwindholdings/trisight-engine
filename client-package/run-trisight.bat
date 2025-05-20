@echo off
echo TriSight Equity Analyst
echo Starting application, please wait...
echo.

REM Run local server in background
start /min cmd /c "npx serve -s build -l 3000"

REM Wait 2 seconds to ensure server has started
timeout /t 2 /nobreak > nul

REM Open default browser to the application
start http://localhost:3000

echo TriSight Equity Analyst is now running.
echo.
echo IMPORTANT: Do not close this window while using the application.
echo When you're finished, close this window to shut down the application.
echo.
pause

REM When user presses any key, terminate the server process
taskkill /f /im node.exe
exit
