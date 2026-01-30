# Test Export Functionality
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  FILE CONVERTER EXPORT TEST" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

# Test 1: Check if backend is running
Write-Host "`n[1/5] Checking if backend is running..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/actuator/health" -UseBasicParsing -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ Backend is RUNNING" -ForegroundColor Green
}
catch {
    Write-Host "✗ Backend is NOT running!" -ForegroundColor Red
    Write-Host "  Solution: Run .\start-all.bat" -ForegroundColor Yellow
    exit
}

# Test 2: Check uploads directory
Write-Host "`n[2/5] Checking uploads directory..." -ForegroundColor Yellow
if (Test-Path ".\uploads") {
    $files = Get-ChildItem ".\uploads" -File -ErrorAction SilentlyContinue
    Write-Host "✓ Uploads directory exists" -ForegroundColor Green
    Write-Host "  Files found: $($files.Count)" -ForegroundColor Cyan
    if ($files.Count -gt 0) {
        Write-Host "  Latest file: $($files[0].Name)" -ForegroundColor Cyan
    }
}
else {
    Write-Host "⚠ Uploads directory does NOT exist" -ForegroundColor Yellow
    Write-Host "  It will be created on first upload" -ForegroundColor Cyan
}

# Test 3: Test debug endpoint (dataset ID 1)
Write-Host "`n[3/5] Testing debug endpoint for dataset 1..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8080/api/export/1/debug" -Method Get -TimeoutSec 5
    Write-Host "✓ Debug endpoint works!" -ForegroundColor Green
    Write-Host "  Dataset: $($response.datasetName)" -ForegroundColor Cyan
    Write-Host "  File Path: $($response.filePath)" -ForegroundColor Cyan
    Write-Host "  File Exists: $($response.fileExists)" -ForegroundColor $(if ($response.fileExists) { "Green" } else { "Red" })
    Write-Host "  File Size: $($response.fileSize) bytes" -ForegroundColor Cyan
    
    if ($response.firstLines) {
        Write-Host "  First Line: $($response.firstLines[0])" -ForegroundColor Cyan
    }
    
    if (-not $response.fileExists) {
        Write-Host "  ⚠ File does not exist - re-upload needed!" -ForegroundColor Yellow
    }
}
catch {
    Write-Host "⚠ Debug endpoint failed" -ForegroundColor Yellow
    Write-Host "  This is normal if dataset 1 doesn't exist" -ForegroundColor Cyan
    Write-Host "  Upload a file first!" -ForegroundColor Cyan
}

# Test 4: Test CSV export
Write-Host "`n[4/5] Testing CSV export for dataset 1..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8080/api/export/1/csv" -Method Get -UseBasicParsing -TimeoutSec 5
    
    if ($response.StatusCode -eq 200) {
        $contentLength = $response.Content.Length
        if ($contentLength -gt 0) {
            Write-Host "✓ CSV export WORKS! Downloaded $contentLength bytes" -ForegroundColor Green
            
            # Show first 100 characters of content
            $preview = $response.Content.Substring(0, [Math]::Min(100, $contentLength))
            Write-Host "  Preview: $preview..." -ForegroundColor Cyan
        }
        else {
            Write-Host "✗ CSV export returned EMPTY file!" -ForegroundColor Red
            Write-Host "  File exists but has no data" -ForegroundColor Yellow
        }
    }
}
catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "✗ CSV export FAILED with status $statusCode" -ForegroundColor Red
    
    if ($statusCode -eq 404) {
        Write-Host "  Dataset not found - upload a file first!" -ForegroundColor Yellow
    }
    elseif ($statusCode -eq 500) {
        Write-Host "  Server error - check backend logs" -ForegroundColor Yellow
        Write-Host "  Likely cause: file path issue" -ForegroundColor Yellow
    }
}

# Test 5: Check for new code
Write-Host "`n[5/5] Checking if NEW code is running..." -ForegroundColor Yellow
Write-Host "Upload a file and check backend console for:" -ForegroundColor Cyan
Write-Host "  ✓ 'File saved successfully. Size: X bytes'" -ForegroundColor White
Write-Host "  ✓ 'Dataset has X rows and Y columns'" -ForegroundColor White
Write-Host "" -ForegroundColor White
Write-Host "If you see these logs, NEW code is running!" -ForegroundColor Green
Write-Host "If you DON'T see them, backend needs RESTART!" -ForegroundColor Yellow

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "If all tests PASS:" -ForegroundColor Green
Write-Host "  → Export should work!" -ForegroundColor Green
Write-Host ""
Write-Host "If tests FAIL:" -ForegroundColor Red
Write-Host "  1. RESTART backend (Ctrl+C, then .\start-all.bat)" -ForegroundColor Yellow
Write-Host "  2. UPLOAD a test file" -ForegroundColor Yellow
Write-Host "  3. RUN this test again" -ForegroundColor Yellow
Write-Host ""
Write-Host "Backend running for: 36+ minutes" -ForegroundColor Yellow
Write-Host "  → This is OLD code! RESTART needed!" -ForegroundColor Red
Write-Host ""
