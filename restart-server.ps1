# restart-server.ps1
# Kill all Node processes and restart the dev server

Write-Host "Stopping all Node processes..." -ForegroundColor Yellow
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Waiting for processes to terminate..." -ForegroundColor Yellow
Start-Sleep -Seconds 2

Write-Host "Clearing React cache..." -ForegroundColor Yellow
if (Test-Path "node_modules\.cache") {
    Remove-Item -Path "node_modules\.cache" -Recurse -Force
    Write-Host "Cache cleared successfully" -ForegroundColor Green
}

Write-Host "Starting development server..." -ForegroundColor Yellow
$env:BROWSER = "none"  # Prevent auto-opening browser
npm start

Write-Host "Server should be running at http://localhost:3000" -ForegroundColor Green
