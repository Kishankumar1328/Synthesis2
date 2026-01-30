@echo off
echo ========================================
echo  DATA INSIGHTS FIX - VERSION 2
echo  Simple Path Fix + Restart
echo ========================================
echo.

echo [1/4] Stopping all services...
taskkill /F /FI "WINDOWTITLE eq Synthesis*" >nul 2>&1
timeout /t 3 /nobreak >nul
echo     ✓ Services stopped

echo [2/4] Creating uploads directory...
if not exist "uploads" mkdir uploads
echo     ✓ uploads/ ready

echo [3/4] Cleaning old build...
cd backend
if exist "target\classes\com\synthetic\platform\service\DatasetService.class" (
    del /q "target\classes\com\synthetic\platform\service\DatasetService.class"
    echo     ✓ Old DatasetService.class removed
)
cd ..

echo [4/4] Restarting application...
echo.
start-all.bat

echo.
echo ========================================
echo  VERSION 2 APPLIED
echo ========================================
echo.
echo WHAT WAS FIXED:
echo  ✓ Storage path simplified: uploads/
echo  ✓ DatasetService stores filename only
echo  ✓ Old compiled class removed
echo  ✓ Fresh restart initiated
echo.
echo IMPORTANT:
echo  - Wait 60 seconds for services to start
echo  - Upload a FRESH dataset (new upload required!)
echo  - Old datasets won't work (database was reset)
echo.
echo ========================================
