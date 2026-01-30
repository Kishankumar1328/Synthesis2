# Quick Fix: Re-upload Dataset

## The Issue
You're seeing "Analysis Failed" because:
1. **In-Memory Database**: The backend uses H2 in-memory database which resets on every restart
2. **Lost References**: When you restart, all dataset records are deleted from the database
3. **Orphaned Files**: Old uploaded files may still exist, but the database doesn't know about them

## The Solution ✅

### Step 1: Upload a New Dataset
1. Go to your project page (you're already there!)
2. Click the **upload button** (the white square with upload icon in the "Base Signals" panel)
3. Select a CSV or Excel file from your computer
4. Wait for the upload to complete

### Step 2: Verify Data Insights
1. After upload, the dataset will appear in the "Base Signals" list
2. Click on the dataset to select it
3. Click the **"DATA INSIGHTS"** tab
4. You should now see beautiful analytics dashboards! 🎉

## What We Fixed Today

✅ **Excel Support**: The AI engine now supports both CSV and Excel files (.xlsx, .xls)
✅ **Error Handling**: If analysis fails, you'll see a clear error message (like you saw)
✅ **Better Parsing**: Multiple fallback strategies for different file encodings

## Test Files You Can Use

If you need test data, you can use:
- **CSV Files**: Any .csv file with tabular data
- **Excel Files**: Any .xlsx or .xls file with data in the first sheet
- **Sample Data**: The `sample_data.csv` in the project root

## Why This Happens

The application uses an **in-memory database** for quick development:
- ✅ **Pros**: Fast, no setup needed, resets cleanly
- ⚠️ **Cons**: Data is lost on restart

### To Make Data Persistent (Optional)

If you want data to persist across restarts, you can switch to MySQL:
1. Run `setup-mysql.bat` to configure MySQL
2. The database will persist data permanently
3. No need to re-upload after restarts

---

**Current Status**: Application is running and ready for fresh uploads! 🚀
**Next Action**: Upload a dataset and test the Data Insights feature
