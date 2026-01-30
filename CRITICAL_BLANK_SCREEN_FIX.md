# Critical Frontend Blank Screen Issue

## Problem
The entire frontend is showing a blank screen. React is not mounting at all.

## Root Cause Analysis
Based on investigation:
1. ✅ HTML loads correctly
2. ✅ Vite dev server is running
3. ✅ All dependencies (React, Router, Axios) are installed
4. ✅ Build succeeds without errors
5. ✅ API proxy configuration is correct
6. ❌ React app fails to mount - likely a runtime JavaScript error

## Most Likely Causes
1. **Import path error** - A component is trying to import from a non-existent path
2. **Syntax error in a component** - Preventing the entire app from compiling at runtime
3. **Missing export** - A module doesn't export what another module expects
4. **Circular dependency** - Components importing each other in a loop

## Immediate Fix Required
**RESTART THE ENTIRE STACK:**

1. **Stop all services** - Close all terminal windows from `start-all.bat`
2. **Clear Vite cache:**
   ```bash
   cd frontend
   rm -rf node_modules/.vite
   ```
3. **Restart:**
   ```bash
   cd ..
   start-all.bat
   ```

## Alternative: Manual Frontend Restart
If you want to restart just the frontend:
```bash
cd frontend
npm run dev -- --force
```

The `--force` flag will clear Vite's cache and rebuild everything fresh.

## What I Changed
- Added missing `const res = await DatasetAPI.getStats(selectedDataset.id);` in ProjectDetails.jsx
- This fix is correct but may have triggered a Vite cache issue

## Next Steps
After restart:
1. Open browser console (F12)
2. Navigate to http://localhost:5173
3. Check for any red error messages
4. If errors persist, share the console output

## Diagnostic Tool
I've created a diagnostic page at:
http://localhost:5173/diagnostic.html

Visit this page to see which modules are failing to load.
