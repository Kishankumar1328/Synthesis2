# AI Copilot Fix Guide

## Problem Summary

The AI Copilot is not working properly due to two main issues:

### 1. **Ollama Service Not Running** ❌
- **Status**: Ollama is installed but not running
- **Impact**: The local LLM (Gemma model) cannot process queries
- **Location**: Should be running at `http://localhost:11434`

### 2. **No Dataset Statistics Available** ❌
- **Status**: Backend database errors preventing statistics retrieval
- **Impact**: AI Copilot has no context to analyze
- **Root Cause**: Backend returning 500 errors (database connection issues)

## Current Status

✅ **Working Components:**
- AI Engine Service (Port 5000) - Running and responding
- Frontend UI - AI Copilot interface loads correctly
- Backend API (Port 8080) - Running but with database errors
- Python dependencies - LangChain and vector store components loaded

❌ **Broken Components:**
- Ollama service - Not running
- Dataset statistics - Not being computed/stored
- Database connection - Returning 500 errors

## Solution Steps

### Step 1: Start Ollama Service

```powershell
# Start Ollama in a new terminal
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"

# Wait for Ollama to start (about 5 seconds)
Start-Sleep -Seconds 5

# Verify Ollama is running
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
```

### Step 2: Pull the Gemma Model (if not already installed)

```powershell
# Check if gemma3:4b is installed
ollama list

# If not installed, pull it (this may take a while - ~2.5GB download)
ollama pull gemma3:4b
```

### Step 3: Fix Backend Database Connection

The backend is configured to use MySQL but may have connection issues. Check:

```powershell
# View backend logs
Get-Content backend_startup.log -Tail 100
```

**Common fixes:**
1. Ensure MySQL is running
2. Verify database credentials in `backend/src/main/resources/application.properties`
3. Run database setup script: `.\setup-mysql.bat`

### Step 4: Restart AI Engine (if needed)

```powershell
# Kill existing Python process
Get-Process python | Where-Object {$_.WorkingSet64 -gt 200MB} | Stop-Process -Force

# Restart AI Engine
cd ai-engine
python ai_copilot_service.py
```

### Step 5: Test AI Copilot

1. Navigate to http://localhost:5173/datasets
2. Upload a dataset (CSV file)
3. Wait for statistics to be computed
4. Click the AI Copilot button (bottom right)
5. Ask: "Can you analyze the data quality?"

## Quick Fix Script

Run this PowerShell script to fix everything:

```powershell
# Start Ollama
Write-Host "🚀 Starting Ollama..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "ollama serve"
Start-Sleep -Seconds 5

# Verify Ollama
Write-Host "✅ Verifying Ollama..." -ForegroundColor Green
try {
    $response = Invoke-RestMethod -Uri "http://localhost:11434/api/tags"
    Write-Host "✅ Ollama is running!" -ForegroundColor Green
} catch {
    Write-Host "❌ Ollama failed to start" -ForegroundColor Red
}

# Check if gemma3:4b is installed
Write-Host "🔍 Checking for Gemma model..." -ForegroundColor Cyan
$models = ollama list
if ($models -match "gemma3:4b") {
    Write-Host "✅ Gemma model is installed" -ForegroundColor Green
} else {
    Write-Host "⚠️ Gemma model not found. Installing..." -ForegroundColor Yellow
    ollama pull gemma3:4b
}

# Test AI Engine
Write-Host "🧪 Testing AI Engine..." -ForegroundColor Cyan
try {
    $health = Invoke-RestMethod -Uri "http://localhost:5000/health"
    Write-Host "✅ AI Engine Status:" -ForegroundColor Green
    Write-Host "   - Service: $($health.service)"
    Write-Host "   - Model: $($health.model)"
    Write-Host "   - RAG Enabled: $($health.rag_enabled)"
    Write-Host "   - LangChain: $($health.langchain_available)"
} catch {
    Write-Host "❌ AI Engine not responding" -ForegroundColor Red
}

Write-Host "`n✅ Setup complete! Test the AI Copilot at http://localhost:5173/datasets" -ForegroundColor Green
```

## Expected Behavior After Fix

### AI Copilot Should:
1. ✅ Open when clicking the button
2. ✅ Show "Dual-Mode Analysis • Online" status
3. ✅ Respond to general questions (even without dataset context)
4. ✅ Provide detailed analysis when dataset statistics are available
5. ✅ Use the Gemma model for intelligent responses

### Example Queries:
- "What can you do?"
- "Analyze the data quality"
- "Are there any missing values?"
- "What are the main features?"
- "Detect any anomalies"

## Troubleshooting

### Issue: Ollama won't start
**Solution**: Check if port 11434 is already in use
```powershell
netstat -ano | findstr ":11434"
```

### Issue: AI Copilot still says "No Statistics"
**Solution**: 
1. Upload a new dataset
2. Wait 5-10 seconds for processing
3. Check backend logs for errors
4. Verify database connection

### Issue: Slow responses
**Solution**: 
- Gemma model is running locally and may be slow on CPU
- Consider using a smaller model: `ollama pull gemma:2b`
- Update `.env` file: `OLLAMA_MODEL=gemma:2b`

## Technical Details

### AI Engine Configuration
- **Port**: 5000 (Flask)
- **Model**: gemma3:4b (via Ollama)
- **Ollama URL**: http://localhost:11434
- **Config File**: `ai-engine/.env`

### Backend Configuration
- **AI Copilot URL**: http://localhost:5000
- **Config File**: `backend/src/main/resources/application.properties`
- **Properties**:
  - `ai.copilot.python.url=http://localhost:5000`
  - `ai.copilot.enabled=true`

### Frontend Integration
- **Component**: AI Copilot button (bottom right)
- **API Endpoint**: `/ai/analyze` (POST)
- **Required Data**: Dataset statistics from backend

## Next Steps

1. ✅ Start Ollama service
2. ✅ Verify Gemma model is installed
3. ✅ Fix backend database connection
4. ✅ Test AI Copilot with a dataset
5. ✅ Monitor logs for any errors

---

**Last Updated**: 2026-01-18
**Status**: Ready for implementation
