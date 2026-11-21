# PowerShell script to start AI Fitness Tracker backend and frontend
# Run from the project root (d:\projects\AI-Fitness-Tracker)

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path

Write-Host "Starting AI Fitness Tracker Backend (FastAPI on port 8000)..." -ForegroundColor Cyan
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$Root'; python run_backend.py"

Start-Sleep -Seconds 3

Write-Host "Starting AI Fitness Tracker Frontend (Vite on port 5173)..." -ForegroundColor Cyan
Start-Process "powershell" -ArgumentList "-NoExit", "-Command", "Set-Location '$Root\frontend'; pnpm run dev"

Start-Sleep -Seconds 4

Write-Host "Opening AI Fitness Tracker in browser..." -ForegroundColor Green
Start-Process "http://localhost:5173"

Write-Host "Both servers launched successfully!" -ForegroundColor Green
