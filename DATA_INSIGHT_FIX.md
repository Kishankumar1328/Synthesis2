# Data Insight Fix

## Issue
The Data Insight feature (and Privacy Audit/Anomaly Detection) was failing for Excel datasets.
- **Root Cause:** The `stats.py` engine script was hardcoded to read only CSV files via `pd.read_csv`, causing failures when processing `.xlsx` files.
- **Secondary Issue:** Frontend might crash if `stats.py` returned an error object, as it wasn't handling the error state gracefully.

## Fixes Applied

### 1. AI Engine Update (`stats.py`)
- **Excel Support:** Updated logic to detect `.xlsx`/`.xls` extensions and use `pd.read_excel` with the `openpyxl` engine.
- **Dependency:** Verifed `openpyxl` is installed in the environment.

### 2. Frontend Robustness (`ProjectDetails.jsx`)
- **Error Handling:** Added a check for the `error` field in the stats response.
- **User Feedback:** If analysis fails, the UI now displays a clear error message instead of a blank or broken dashboard.

## Verification
1. Open the project dashboard.
2. Select an Excel-based dataset.
3. "Data Insights" tab should now load correctly.
4. If it fails, a specific error message (e.g., "Analysis failed: ...") will appear at the top.
