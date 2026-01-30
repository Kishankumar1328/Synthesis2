# 🔧 AI Copilot - Troubleshooting & Testing Guide

## 🎯 Current Status

### ✅ What's Working
- Professional UI design (dual-pane layout)
- AI Copilot service running on port 5000
- Ollama LLM service running (Gemma 3:4b)
- Frontend application running on port 5173

### ⚠️ Recent Fixes
- **File Upload Error Handling**: Added robust error handling with safe property access
- **Debug Logging**: Added console logs to track upload responses
- **Better Error Messages**: More helpful error messages with troubleshooting steps

---

## 🧪 Testing the AI Copilot

### **Step 1: Verify Services**

Check all services are running:

```powershell
# Check AI Copilot Service
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Check Ollama
Invoke-RestMethod -Uri "http://localhost:11434/api/tags"

# Check Frontend
# Visit: http://localhost:5173
```

**Expected Output (AI Copilot):**
```json
{
  "service": "Hybrid Dataset Intelligence System",
  "status": "online",
  "mode": "HYBRID (Deterministic + LLM)",
  "model": "gemma3:4b",
  "ollama_running": true,
  "langchain_available": false
}
```

### **Step 2: Test File Upload**

1. **Open the AI Copilot**
   - Visit: http://localhost:5173/ai-copilot-demo
   - Click the floating brain icon (bottom-right)

2. **Upload Test File**
   - Click "Upload Dataset" button
   - Select: `e:\Kish\Project\LastOneTime\test_data.csv`
   - Wait for analysis to complete

3. **Check Browser Console**
   - Press F12 to open DevTools
   - Go to Console tab
   - Look for "Upload response:" log
   - Verify the response structure

**Expected Response Structure:**
```json
{
  "status": "success",
  "message": "Dataset 'test_data.csv' analyzed successfully",
  "file_id": "test_data_csv",
  "analysis": {
    "filename": "test_data.csv",
    "status": "SUCCESS",
    "basic_info": {
      "file_type": "CSV",
      "rows": 10,
      "columns": 6,
      "column_names": ["id", "name", "age", "salary", "department", "email"]
    },
    "quality_score": 85,
    "quality_level": "HIGH",
    "key_risks": [...]
  }
}
```

### **Step 3: Test AI Queries**

After uploading a file, ask these questions:

1. **"What can you tell me about this dataset?"**
   - Should describe the dataset structure
   - Mention quality score
   - List key findings

2. **"Which columns have missing values?"**
   - Should analyze missing data
   - Provide specific column names

3. **"What's the data quality score?"**
   - Should state the quality score
   - Explain what it means

4. **"Are there any sensitive fields?"**
   - Should identify email column
   - Mention PII risks

---

## 🐛 Common Issues & Solutions

### **Issue 1: "Cannot read properties of undefined"**

**Cause**: Response structure mismatch

**Solution**: ✅ FIXED - Added safe property access with fallbacks

**Verify Fix:**
```javascript
// Check browser console for:
console.log('Upload response:', data);
```

### **Issue 2: "Connection Error"**

**Symptoms**:
- "Sorry, I'm having trouble connecting to the AI service"
- Red error messages

**Solutions**:

1. **Check AI Copilot Service**
   ```powershell
   # Test health endpoint
   Invoke-RestMethod -Uri "http://localhost:5000/health"
   ```

2. **Restart AI Copilot Service**
   ```powershell
   # Stop old service
   Get-Process python | Where-Object {$_.WorkingSet64 -gt 200MB} | Stop-Process -Force
   
   # Start new service
   cd e:\Kish\Project\LastOneTime\ai-engine
   python ai_copilot_hybrid.py
   ```

3. **Check Ollama**
   ```powershell
   # Verify Ollama is running
   ollama list
   
   # If not running, start it
   ollama serve
   ```

### **Issue 3: Upload Fails**

**Possible Causes**:
- File format not supported
- File too large
- Service not running
- CORS issues

**Solutions**:

1. **Check File Format**
   - Only CSV, Excel (.xlsx, .xls), JSON supported
   - File should not be corrupted

2. **Check File Size**
   - Recommended: < 100MB
   - Large files take longer to analyze

3. **Check Service Logs**
   - Look at the AI Copilot terminal window
   - Check for error messages

4. **Test with Sample File**
   ```powershell
   # Use the provided test file
   # File: e:\Kish\Project\LastOneTime\test_data.csv
   # Size: ~500 bytes
   # Format: CSV
   ```

### **Issue 4: Analysis Shows "FAILED"**

**Check**:
- File encoding (should be UTF-8)
- File structure (proper CSV/Excel/JSON format)
- No special characters in column names

**Solution**:
- Re-save file with UTF-8 encoding
- Remove special characters
- Validate JSON structure

---

## 📊 Testing Checklist

### **Frontend Tests**
- [ ] Page loads without errors
- [ ] Floating button appears
- [ ] Chat modal opens/closes smoothly
- [ ] Upload button is visible
- [ ] File input accepts files
- [ ] Upload progress shows
- [ ] Success message appears
- [ ] File appears in library
- [ ] Quality score displays
- [ ] Can select file
- [ ] Active context shows
- [ ] Can send messages
- [ ] Responses appear
- [ ] Error handling works

### **Backend Tests**
- [ ] Health endpoint responds
- [ ] Upload endpoint accepts files
- [ ] Analysis completes successfully
- [ ] Quality score calculated
- [ ] Risks identified
- [ ] Sensitive fields detected
- [ ] Query endpoint works
- [ ] LLM responses generated
- [ ] Context passed correctly
- [ ] Files endpoint lists files

### **Integration Tests**
- [ ] Upload → Analysis → Success message
- [ ] Upload → Select → Query → Response
- [ ] Multiple file uploads
- [ ] File switching
- [ ] Error recovery
- [ ] Service restart handling

---

## 🔍 Debug Mode

### **Enable Detailed Logging**

1. **Frontend (Browser Console)**
   - Already enabled: `console.log('Upload response:', data)`
   - Check for errors in Console tab

2. **Backend (Terminal)**
   - AI Copilot service logs to console
   - Look for:
     - `📁 File uploaded: ...`
     - `✅ File analyzed: ...`
     - `❌ Error: ...`

### **Test API Directly**

**Upload Test:**
```powershell
# Create form data
$file = Get-Item "e:\Kish\Project\LastOneTime\test_data.csv"
$form = @{
    file = $file
}

# Upload
Invoke-RestMethod -Uri "http://localhost:5000/upload" -Method Post -Form $form
```

**Query Test:**
```powershell
# Test query
$body = @{
    query = "What can you tell me about this dataset?"
    file_id = "test_data_csv"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:5000/query" -Method Post -Body $body -ContentType "application/json"
```

---

## 📈 Performance Expectations

### **Upload & Analysis**
- Small files (<1MB): 2-5 seconds
- Medium files (1-10MB): 5-15 seconds
- Large files (10-100MB): 15-60 seconds

### **LLM Queries**
- Simple questions: 3-8 seconds
- Complex questions: 8-15 seconds
- Depends on Ollama performance

### **UI Responsiveness**
- Modal open/close: <300ms
- File selection: Instant
- Message rendering: <100ms per message

---

## ✅ Success Indicators

Your system is working correctly when:

1. **Upload Success**
   - ✅ File appears in Dataset Library
   - ✅ Quality score displayed
   - ✅ Success message in chat
   - ✅ No errors in console

2. **Query Success**
   - ✅ AI responds within 10 seconds
   - ✅ Response is relevant to question
   - ✅ File context badge shows
   - ✅ No connection errors

3. **UI Quality**
   - ✅ Smooth animations
   - ✅ Professional styling
   - ✅ Clear status indicators
   - ✅ Helpful error messages

---

## 🚀 Next Steps

If everything works:
1. ✅ Test with your real datasets
2. ✅ Explore different question types
3. ✅ Review analysis accuracy
4. ✅ Customize as needed

If issues persist:
1. 📋 Check all services are running
2. 🔍 Review browser console for errors
3. 📝 Check AI Copilot terminal logs
4. 🔄 Restart services if needed

---

## 📞 Quick Commands

### **Restart Everything**
```powershell
# Stop all services
Get-Process python | Where-Object {$_.WorkingSet64 -gt 200MB} | Stop-Process -Force

# Start AI Copilot
cd e:\Kish\Project\LastOneTime\ai-engine
python ai_copilot_hybrid.py

# Frontend should still be running from start-all.bat
```

### **Check Status**
```powershell
# AI Copilot
Invoke-RestMethod -Uri "http://localhost:5000/health"

# Ollama
ollama list

# Frontend
# Visit: http://localhost:5173
```

### **View Logs**
```powershell
# AI Copilot logs are in the terminal where you ran:
# python ai_copilot_hybrid.py

# Look for:
# - Upload events
# - Analysis results
# - Query requests
# - Error messages
```

---

## 🎯 Test File Location

**Sample CSV File:**
```
e:\Kish\Project\LastOneTime\test_data.csv
```

**Contents:**
- 10 rows
- 6 columns (id, name, age, salary, department, email)
- Contains sensitive field (email)
- Good for testing PII detection

---

**Your AI Copilot is ready for testing!** 🚀

Try uploading the test file and asking questions to verify everything works correctly.
