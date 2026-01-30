@echo off
echo ========================================
echo  DATA INSIGHTS FIX - VERSION 3
echo  Complete Path Resolution Fix
echo ========================================
echo.

echo [1/5] Stopping all running services...
taskkill /F /FI "WINDOWTITLE eq Synthesis*" >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] Creating uploads directory...
if not exist "uploads" mkdir uploads
echo     ✓ uploads/ directory ready

echo [3/5] Cleaning backend build...
cd backend
if exist "target" rmdir /s /q target
echo     ✓ Backend cleaned

echo [4/5] Compiling backend with fixes...
call mvnw.cmd clean compile -DskipTests
if errorlevel 1 (
    echo     ✗ Compilation failed!
    pause
    exit /b 1
)
echo     ✓ Backend compiled successfully

cd ..

echo [5/5] Starting application...
echo.
echo ========================================
echo  Starting Synthesis Platform
echo ========================================
echo.

start-all.bat

echo.
echo ========================================
echo  VERSION 3 FIX APPLIED
echo ========================================
echo.
echo CHANGES:
echo  ✓ Storage location: uploads/ (simplified path)
echo  ✓ AI engine path: ai-engine/ (simplified path)
echo  ✓ DatasetService: Stores filename only
echo  ✓ Fresh compilation with all fixes
echo.
echo NEXT STEPS:
echo  1. Wait for services to start (30-60 seconds)
echo  2. Open http://localhost:5173
echo  3. Upload a NEW dataset (fresh upload required)
echo  4. Click "DATA INSIGHTS" tab
echo  5. Verify analytics load correctly
echo.
echo ========================================
pause
