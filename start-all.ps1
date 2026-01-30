# SynthoGen Enterprise Platform - Automated Startup Script
# This script starts Backend (Spring Boot) and Frontend (Vite) in separate terminals

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "SynthoGen Enterprise Platform" -ForegroundColor Cyan
Write-Host "   Automated Startup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Get the script directory
$scriptPath = $PSScriptRoot
if (!$scriptPath) { $scriptPath = Get-Location }
Set-Location $scriptPath

# Pre-flight checks
Write-Host "Running pre-flight checks..." -ForegroundColor Yellow
Write-Host ""

# Check Python
Write-Host "Checking Python..." -NoNewline
try {
    $pythonVersion = python --version 2>&1
    Write-Host " OK: $pythonVersion" -ForegroundColor Green
}
catch {
    Write-Host " Python not found!" -ForegroundColor Red
    Write-Host "   Please install Python 3.9+ and add to PATH" -ForegroundColor Red
    exit 1
}

# Check Java & JAVA_HOME
Write-Host "Checking Java..." -NoNewline
try {
    if (-not $env:JAVA_HOME) {
        Write-Host " (JAVA_HOME missing, attempting to detect...)" -ForegroundColor Gray -NoNewline
        $javaPath = Get-Process -Name java -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Path -First 1
        if ($javaPath) {
            $javaBinDir = Split-Path $javaPath -Parent
            $env:JAVA_HOME = Split-Path $javaBinDir -Parent
            Write-Host " Detected: $env:JAVA_HOME" -ForegroundColor Gray -NoNewline
        }
    }
    $javaVersion = java -version 2>&1 | Select-String "version"
    Write-Host " OK: $javaVersion" -ForegroundColor Green
}
catch {
    Write-Host " Java not found!" -ForegroundColor Red
    Write-Host "   Please install JDK 17+ and add to PATH" -ForegroundColor Red
    exit 1
}

# Check Node.js
Write-Host "Checking Node.js..." -NoNewline
try {
    $nodeVersion = node --version
    Write-Host " OK: v$nodeVersion" -ForegroundColor Green
}
catch {
    Write-Host " Node.js not found!" -ForegroundColor Red
    Write-Host "   Please install Node.js 18+ and add to PATH" -ForegroundColor Red
    exit 1
}

# Check if uploads directory exists
Write-Host "Checking storage directory..." -NoNewline
$uploadsPath = Join-Path $scriptPath "uploads"
if (-not (Test-Path $uploadsPath)) {
    New-Item -ItemType Directory -Path $uploadsPath -Force | Out-Null
    New-Item -ItemType Directory -Path (Join-Path $uploadsPath "models") -Force | Out-Null
    Write-Host " Created" -ForegroundColor Green
}
else {
    Write-Host " Exists" -ForegroundColor Green
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "Starting Backend (Spring Boot)..." -ForegroundColor Yellow
Write-Host "   This will open in a new terminal window" -ForegroundColor Gray
Write-Host ""

$backendPath = Join-Path $scriptPath "backend"
$javaHomeSet = if ($env:JAVA_HOME) { "`$env:JAVA_HOME = '$env:JAVA_HOME';" } else { "" }

Start-Process powershell -ArgumentList "-NoExit", "-Command", "$javaHomeSet cd '$backendPath'; Write-Host 'Building and starting Spring Boot backend...' -ForegroundColor Cyan; .\mvnw.cmd spring-boot:run"

# Start AI Copilot Service
Write-Host "Starting AI Copilot Service..." -ForegroundColor Yellow
$aiServicePath = Join-Path $scriptPath "ai-engine"
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptPath'; if (-not (Test-Path 'ai-engine/venv')) { Write-Host 'Setting up Python environment...' -ForegroundColor Cyan; pip install -r ai-engine/requirements.txt }; Write-Host 'Starting AI Engine...' -ForegroundColor Cyan; python ai-engine/ai_copilot_service.py"

# Wait for backend to initialize
Write-Host "Waiting 30 seconds for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 30

# Start Frontend
Write-Host "Starting Frontend (Vite)..." -ForegroundColor Yellow
Write-Host "   This will open in a new terminal window" -ForegroundColor Gray
Write-Host ""

$frontendPath = Join-Path $scriptPath "frontend"
$nodeModulesPath = Join-Path $frontendPath "node_modules"

if (-not (Test-Path $nodeModulesPath)) {
    Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Installing dependencies...' -ForegroundColor Cyan; npm install; Write-Host 'Starting Vite dev server...' -ForegroundColor Cyan; npm run dev"
}
else {
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; Write-Host 'Starting Vite dev server...' -ForegroundColor Cyan; npm run dev"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "All services started!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Access the application:" -ForegroundColor Yellow
Write-Host "   Frontend:  http://localhost:5173" -ForegroundColor Cyan
Write-Host "   Backend:   http://localhost:8080" -ForegroundColor Cyan
Write-Host ""
Write-Host "Startup complete. Check the new terminal windows." -ForegroundColor Gray
