# 🔄 HOW TO RESTART BACKEND - Step by Step

## ⚠️ CRITICAL: Backend Must Be Restarted!

Your backend is still running the **OLD CODE** from 34 minutes ago.
The new dynamic statistics code won't work until you restart.

## 📋 Option 1: Quick Restart (Recommended)

### Step 1: Stop Current Backend
In the terminal where `start-all.bat` is running:
```
Press: Ctrl + C
```

Wait for it to stop (may take 5-10 seconds).

### Step 2: Start Again
```
.\start-all.bat
```

### Step 3: Wait for Startup
Look for these messages:
```
Started SyntheticDataPlatformApplication in X seconds
Tomcat started on port(s): 8080
```

### Step 4: Test
- Go to File Converter
- Refresh the page
- Check if datasets show row/column counts

## 📋 Option 2: Use Restart Script

### Step 1: Run Restart Script
```
.\restart-backend.bat
```

This will:
1. Kill all Java/Node processes
2. Clean the build
3. Restart everything

### Step 2: Wait for Startup
Same as Option 1, Step 3

## 📋 Option 3: Manual Restart

### Step 1: Stop Backend
```powershell
# Open new PowerShell window
taskkill /F /IM java.exe
taskkill /F /IM node.exe
```

### Step 2: Clean Build
```powershell
cd backend
Remove-Item -Recurse -Force target
cd ..
```

### Step 3: Start Again
```
.\start-all.bat
```

## ✅ How to Verify Backend Restarted

### Check 1: Terminal Output
You should see:
```
  .   ____          _            __ _ _
 /\\ / ___'_ __ _ _(_)_ __  __ _ \ \ \ \
( ( )\___ | '_ | '_| | '_ \/ _` | \ \ \ \
 \\/  ___)| |_)| | | | | || (_| |  ) ) ) )
  '  |____| .__|_| |_|_| |_\__, | / / / /
 =========|_|==============|___/=/_/_/_/
 :: Spring Boot ::

Started SyntheticDataPlatformApplication in 15.234 seconds
```

### Check 2: Upload Test
1. Upload a CSV file
2. Look for NEW log messages:
```
INFO  Starting dataset upload for project 1
INFO  File saved successfully. Size: 1234 bytes
INFO  Dataset has 10 rows and 5 columns
```

If you see these logs, **the new code is running!**

### Check 3: File Converter
1. Go to File Converter
2. Select project
3. Dataset should show:
   - ✅ "10 rows" (not 0)
   - ✅ "5 columns" (not 0)

## 🐛 Troubleshooting

### Problem: Can't Stop Backend

**Solution:**
```powershell
# Force kill all Java processes
taskkill /F /IM java.exe

# Force kill all Node processes  
taskkill /F /IM node.exe
```

### Problem: Port Already in Use

**Error:**
```
Port 8080 is already in use
```

**Solution:**
```powershell
# Find what's using port 8080
netstat -ano | findstr :8080

# Kill that process (replace PID with actual number)
taskkill /F /PID <PID>
```

### Problem: Backend Won't Start

**Check:**
1. Is MySQL running?
2. Is port 8080 free?
3. Are there any errors in the console?

**Solution:**
```powershell
# Check MySQL
mysql -u root -p

# Check port
netstat -ano | findstr :8080

# View full error logs
cd backend
.\mvnw spring-boot:run
```

### Problem: Still Shows 0 Rows/Columns

**This means backend hasn't restarted yet!**

**Verify:**
1. Check terminal - is it the same session from 34 minutes ago?
2. Upload a new file - do you see the new log messages?
3. Check timestamp in terminal - is it recent?

## 📊 What to Look For After Restart

### ✅ Success Indicators

1. **Terminal shows new startup**
   ```
   Started SyntheticDataPlatformApplication in 15.234 seconds
   ```

2. **Upload shows new logs**
   ```
   INFO  File saved successfully. Size: 1234 bytes
   INFO  Dataset has 10 rows and 5 columns
   ```

3. **File Converter shows counts**
   ```
   data.csv
   📊 10 rows
   📋 5 columns
   ```

### ❌ Failure Indicators

1. **No new startup message** - Backend didn't restart
2. **No new log format** - Old code still running
3. **Still shows 0 rows** - Backend not restarted

## 🎯 Quick Checklist

- [ ] Stop current backend (Ctrl+C)
- [ ] Wait for it to fully stop
- [ ] Run `.\start-all.bat`
- [ ] Wait for "Started SyntheticDataPlatformApplication"
- [ ] Go to File Converter
- [ ] Refresh page
- [ ] Check if datasets show row/column counts
- [ ] Upload new file to test
- [ ] Check backend logs for new format

## ⚡ Fastest Method

```powershell
# In the terminal where start-all.bat is running:
Ctrl + C

# Wait 5 seconds

# Then:
.\start-all.bat

# Wait for "Started SyntheticDataPlatformApplication"

# Done!
```

## 📝 Notes

- Backend must restart to load new Java code
- Frontend doesn't need restart (JavaScript loads on refresh)
- Database doesn't need restart
- The entire restart takes ~30 seconds

## 🆘 If Nothing Works

1. **Close ALL terminals**
2. **Open Task Manager**
3. **End all Java.exe processes**
4. **End all Node.exe processes**
5. **Open NEW terminal**
6. **Run `.\start-all.bat`**
7. **Wait for startup**
8. **Test again**

---

**REMEMBER: The code changes are perfect, but Java needs to restart to load them!**
