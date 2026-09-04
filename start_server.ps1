# PowerShell Web & Aiven Cloud API Server Runner for St. Venus High School
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  🏫 ST. VENUS HIGH SCHOOL MANAGEMENT SYSTEM" -ForegroundColor Yellow
Write-Host "  🚀 Starting Node.js Server & Aiven PostgreSQL Sync" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Cyan

$nodeExe = "C:\Users\Manzoor\.gemini\antigravity\scratch\node\node-v20.18.0-win-x64\node.exe"

if (-not (Test-Path $nodeExe)) {
    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd) {
        $nodeExe = $nodeCmd.Source
    } else {
        Write-Host "❌ Node.js executable not found!" -ForegroundColor Red
        exit 1
    }
}

Set-Location $PSScriptRoot
& $nodeExe server.js
