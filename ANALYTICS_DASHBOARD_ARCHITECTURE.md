# 📊 Analytics Dashboard - Complete Architecture Analysis

## 🎯 Overview

The Analytics Dashboard is a **full-stack data visualization system** that processes datasets (CSV/Excel) and displays comprehensive statistical insights through an interactive React UI.

---

## 🏗️ Architecture Flow

```
┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
│   Frontend  │ ───▶ │   Backend   │ ───▶ │  AI Engine  │ ───▶ │   Python    │
│   (React)   │ ◀─── │ (Spring)    │ ◀─── │  (stats.py) │ ◀─── │  (pandas)   │
└─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
       │                     │                                          │
       │                     ▼                                          │
       │              ┌─────────────┐                                   │
       │              │  H2 Database│                                   │
       │              │  (In-Memory)│                                   │
       └──────────────└─────────────┘◀──────────────────────────────────┘
                            │
                      Stores metadata
                      (not actual data)
```

---

## 1️⃣ FRONTEND LAYER

### 📁 File: `frontend/src/components/AnalyticsDashboard.jsx`

**Lines of Code**: 1,829 lines
**Purpose**: Render interactive data visualizations

### Key Components

#### A. Main Dashboard Component (Lines 51-421)
```javascript
export default function AnalyticsDashboard({ stats, isLoading, syntheticStats })
```

**Props**:
- `stats` - Statistical data from backend (JSON object)
- `isLoading` - Loading state boolean
- `syntheticStats` - Optional synthetic data for comparison

**State Management**:
```javascript
const [correlationThreshold, setCorrelationThreshold] = useState(0);
const [selectedFeature, setSelectedFeature] = useState(null);
const [viewMode, setViewMode] = useState('raw');
const [comparisonMode, setComparisonMode] = useState(false);
const [activeTab, setActiveTab] = useState('overview');
const [activeFilters, setActiveFilters] = useState({
    showRiskyOnly: false,
    dataType: 'all'
});
```

#### B. Error Handling (Lines 66-80)
```javascript
// Error state - check if stats contains an error field
if (stats.error) {
    return (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8">
            <i className='bx bx-error-circle text-6xl text-red-400'></i>
            <div className="text-center">
                <h3 className="text-xl font-black text-red-400 mb-2">Analysis Failed</h3>
                <p className="text-sm text-red-300/80 max-w-md">{stats.error}</p>
            </div>
        </div>
    );
}
```

**Purpose**: Display user-friendly error messages when stats.py fails

#### C. Metrics Computation (Lines 92-124)
```javascript
const metrics = useMemo(() => {
    const totalRecords = stats.rowCount;
    const dimensions = stats.columnCount;
    const completeness = (100 - stats.columns.reduce((a, b) => a + b.nullPercentage, 0) / stats.columnCount);
    const uniqueSignals = stats.columns.reduce((a, b) => a + (b.uniqueCount > 0 ? 1 : 0), 0);
    const avgNull = stats.columns.reduce((a, b) => a + b.nullPercentage, 0) / stats.columnCount;
    const riskyFeatures = stats.columns.filter(c => c.nullPercentage > 20).length;
    
    return {
        totalRecords,
        dimensions,
        completeness,
        uniqueSignals,
        avgNull,
        riskyFeatures,
        status: completeness > 95 ? 'healthy' : completeness > 80 ? 'warning' : 'critical'
    };
}, [stats, historicalMetrics]);
```

**Computed Metrics**:
- Total records count
- Number of dimensions (columns)
- Data completeness percentage
- Unique signal count
- Average null percentage
- Risky features (>20% null)
- Overall health status

#### D. Automated Insights Engine (Lines 142-235)
```javascript
const autoInsights = useMemo(() => {
    const insights = [];
    
    // 1. Top Correlations
    if (stats.correlation) {
        // Find correlations > 0.7
    }
    
    // 2. Privacy Risk Columns
    const highUniqueColumns = stats.columns.filter(c => {
        const uniqueness = (c.uniqueCount / total) * 100;
        return uniqueness > 95 && c.type.includes('string');
    });
    
    // 3. Data Quality Anomalies
    if (metrics.riskyFeatures > 0) {
        // Flag features with >20% missing values
    }
    
    // 4. Distribution Imbalance
    const imbalancedFeatures = stats.columns.filter(c => {
        const max = Math.max(...c.distribution.values);
        return (max / total) > 0.8;
    });
    
    // 5. Overall Data Health
    if (metrics.completeness > 95 && metrics.riskyFeatures === 0) {
        // Mark as excellent quality
    }
    
    return insights.slice(0, 5); // Top 5 insights
}, [stats, metrics]);
```

**AI-Powered Insights**:
1. **Correlation Detection**: Finds features with >0.7 correlation
2. **PII Detection**: Identifies columns with >95% unique values
3. **Quality Issues**: Flags features with >20% missing data
4. **Class Imbalance**: Detects dominant classes (>80%)
5. **Health Score**: Overall data quality assessment

#### E. UI Sections

**KPI Cards** (Lines 253-297):
- Total Records (with trend)
- Dimensions (with unique signals)
- Data Completeness (with status)
- Data Quality (with risk count)

**Tabbed Navigation** (Lines 305-418):
- **Overview**: KPIs + Feature Distributions + Quality Audit
- **Distributions**: Detailed feature charts
- **Quality Audit**: Missing value analysis + Box plots
- **Correlations**: Correlation matrix heatmap
- **Advanced Analytics**: Network graphs + Box plots

#### F. Sub-Components

1. **KPICard** (Lines 523-622)
   - Displays metric with icon, value, trend, and sparkline
   - Supports 7-day historical trends

2. **FeatureDistributionPanel** (Lines 625-700)
   - Grid of feature charts
   - Raw vs Normalized view modes
   - Real vs Synthetic comparison

3. **FeatureChart** (Lines 702-850)
   - Bar charts for distributions
   - Type detection (numeric/categorical)
   - Risk highlighting

4. **QualityAuditPanel** (Lines 852-950)
   - Missing value analysis
   - Risk level categorization

5. **CorrelationMatrixPanel** (Lines 1100-1250)
   - Heatmap visualization
   - Threshold filtering

6. **NetworkGraphPanel** (Lines 1350-1500)
   - Force-directed graph
   - Feature relationship visualization

7. **BoxPlotPanel** (Lines 1550-1700)
   - Outlier detection
   - Distribution comparison

### Chart Libraries Used

```javascript
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';
import { Bar, Bubble, Line } from 'react-chartjs-2';
```

**Chart Types**:
- **Bar Charts**: Feature distributions
- **Line Charts**: Sparklines for trends
- **Bubble Charts**: Correlation visualization
- **Heatmaps**: Correlation matrix

---

## 2️⃣ BACKEND LAYER

### 📁 File: `backend/src/main/java/com/synthetic/platform/controller/DatasetController.java`

#### API Endpoint: GET `/api/datasets/{id}/stats`

```java
@GetMapping("/{id}/stats")
public ResponseEntity<String> getDatasetStats(@PathVariable Long id) {
    try {
        Dataset dataset = datasetService.findById(id);
        String stats = aiService.getDatasetStats(dataset.getFilePath());
        return ResponseEntity.ok(stats);
    } catch (Exception e) {
        log.error("Failed to get dataset stats", e);
        return ResponseEntity.status(500)
            .body("{\"error\": \"" + e.getMessage() + "\"}");
    }
}
```

**Flow**:
1. Receive dataset ID from frontend
2. Fetch dataset metadata from H2 database
3. Get file path from dataset record
4. Call AIService to compute statistics
5. Return JSON response

---

### 📁 File: `backend/src/main/java/com/synthetic/platform/service/AIService.java`

#### Method: `getDatasetStats(String fileName)`

**Lines**: 155-188

```java
@Cacheable(value = "datasetStats", key = "#fileName", unless = "#result == null")
public String getDatasetStats(String fileName) throws Exception {
    String dataPath = Paths.get(storageLocation, fileName).toAbsolutePath().toString();
    String scriptPath = Paths.get(aiEnginePath, "stats.py").toAbsolutePath().toString();
    
    log.info("Calculating stats for file: {}", fileName);
    ProcessBuilder pb = new ProcessBuilder(pythonPath, scriptPath, "--data", dataPath);
    pb.redirectErrorStream(true);
    Process process = pb.start();
    
    StringBuilder output = new StringBuilder();
    try (BufferedReader reader = new BufferedReader(new InputStreamReader(process.getInputStream()))) {
        String line;
        while ((line = reader.readLine()) != null) {
            output.append(line);
        }
    }
    
    int exitCode = process.waitFor();
    if (exitCode != 0) {
        String errorMsg = "Stats calculation failed for file: " + fileName;
        log.error(errorMsg);
        throw new RuntimeException(errorMsg);
    }
    
    // Extract JSON from output
    String outStr = output.toString();
    if (outStr.contains("{") && outStr.contains("}")) {
        return outStr.substring(outStr.indexOf("{"), outStr.lastIndexOf("}") + 1);
    }
    return outStr;
}
```

**Key Features**:
1. **Caching**: Results cached with Spring Cache (`@Cacheable`)
2. **Python Execution**: Spawns Python process to run stats.py
3. **Error Handling**: Captures exit codes and errors
4. **JSON Extraction**: Cleans output to return only JSON

**Configuration**:
```properties
# application.properties
app.storage.location=backend/uploads
app.python.path=python
app.ai.engine.path=../ai-engine
```

---

### 📁 File: `backend/src/main/java/com/synthetic/platform/service/DatasetService.java`

#### Method: `uploadDataset(MultipartFile file, Long projectId)`

**Lines**: 42-123

```java
public Dataset uploadDataset(MultipartFile file, Long projectId) throws Exception {
    // 1. Validate inputs
    if (file == null || file.isEmpty()) {
        throw new IllegalArgumentException("File cannot be null or empty");
    }
    
    // 2. Generate safe filename
    String originalName = file.getOriginalFilename();
    String fileName = UUID.randomUUID() + "_" + safeName;
    
    // 3. Create upload directory
    Path uploadPath = Paths.get(storageLocation);
    Files.createDirectories(uploadPath);
    
    // 4. Save file
    Path filePath = uploadPath.resolve(fileName);
    Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
    
    // 5. Count rows and columns
    int rowCount = 0;
    int columnCount = 0;
    try (BufferedReader reader = Files.newBufferedReader(filePath)) {
        String line;
        boolean firstLine = true;
        while ((line = reader.readLine()) != null) {
            if (firstLine) {
                columnCount = line.split(",").length;
                firstLine = false;
            }
            rowCount++;
        }
    }
    
    // 6. Create dataset entity
    Dataset dataset = new Dataset();
    dataset.setName(originalName);
    dataset.setFilePath(fileName); // ✅ FIXED: Store only filename
    dataset.setProject(project);
    dataset.setRowCount(rowCount - 1); // Exclude header
    dataset.setColumnCount(columnCount);
    dataset.setFileSize(Files.size(filePath));
    
    // 7. Save to database
    return datasetRepository.save(dataset);
}
```

**Upload Flow**:
1. Validate file and project ID
2. Generate UUID-based filename
3. Create uploads directory if needed
4. Save file to disk
5. Parse file to count rows/columns
6. Create dataset metadata record
7. Save to H2 database

---

## 3️⃣ H2 DATABASE LAYER

### Database Configuration

**File**: `backend/src/main/resources/application.properties`

```properties
# H2 Database - In-Memory
spring.datasource.url=jdbc:h2:mem:synthetic_platform;DB_CLOSE_DELAY=-1;DB_CLOSE_ON_EXIT=FALSE;MODE=MySQL
spring.datasource.username=sa
spring.datasource.password=
spring.datasource.driver-class-name=org.h2.Driver

# JPA/Hibernate
spring.jpa.hibernate.ddl-auto=update
spring.jpa.show-sql=false
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.H2Dialect

# H2 Console
spring.h2.console.enabled=true
spring.h2.console.path=/h2-console
```

**Access H2 Console**: http://localhost:8080/h2-console

**Connection Details**:
- JDBC URL: `jdbc:h2:mem:synthetic_platform`
- Username: `sa`
- Password: (empty)

### Database Schema

#### Table: `dataset`

**File**: `backend/src/main/java/com/synthetic/platform/model/Dataset.java`

```java
@Entity
@Table(name = "dataset")
public class Dataset {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(name = "file_path")
    private String filePath;  // ✅ Stores: "uuid_filename.csv"
    
    @Column(name = "row_count")
    private Integer rowCount;
    
    @Column(name = "column_count")
    private Integer columnCount;
    
    @Column(name = "file_size")
    private Long fileSize;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id", nullable = false)
    private Project project;
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
```

**Columns**:
| Column | Type | Description |
|--------|------|-------------|
| `id` | BIGINT | Primary key (auto-increment) |
| `name` | VARCHAR | Original filename |
| `file_path` | VARCHAR | Relative path (just filename) |
| `row_count` | INTEGER | Number of data rows (excluding header) |
| `column_count` | INTEGER | Number of columns |
| `file_size` | BIGINT | File size in bytes |
| `project_id` | BIGINT | Foreign key to project table |
| `created_at` | TIMESTAMP | Creation timestamp |
| `updated_at` | TIMESTAMP | Last update timestamp |

#### Table: `project`

```java
@Entity
@Table(name = "project")
public class Project {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(length = 1000)
    private String description;
    
    @OneToMany(mappedBy = "project", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Dataset> datasets = new ArrayList<>();
    
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
```

### SQL Queries (Auto-generated by JPA)

#### Find Dataset by ID
```sql
SELECT * FROM dataset WHERE id = ?
```

#### Find Datasets by Project
```sql
SELECT * FROM dataset WHERE project_id = ?
```

#### Insert Dataset
```sql
INSERT INTO dataset (name, file_path, row_count, column_count, file_size, project_id, created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?)
```

### In-Memory Behavior

**Characteristics**:
- ✅ **Fast**: No disk I/O for database operations
- ✅ **Clean**: Resets on every restart
- ❌ **Volatile**: All data lost on shutdown
- ❌ **No Persistence**: Files remain, but metadata is lost

**Data Flow**:
```
Backend Start → H2 Creates Empty Tables → User Uploads File
                                                ↓
                                    File saved to disk + Metadata to H2
                                                ↓
Backend Restart → H2 Resets (metadata lost) → Files still on disk (orphaned)
```

---

## 4️⃣ AI ENGINE LAYER

### 📁 File: `ai-engine/stats.py`

**Lines**: 97 lines
**Purpose**: Compute statistical analysis using pandas

#### Main Function: `calculate_stats(data_path)`

**Lines**: 11-87

```python
def calculate_stats(data_path):
    try:
        # 1. Detect file type
        file_ext = data_path.lower().split('.')[-1]
        
        # 2. Read file (CSV or Excel)
        if file_ext in ['xlsx', 'xls']:
            df = pd.read_excel(data_path, engine='openpyxl')
        else:
            df = pd.read_csv(data_path)  # with encoding fallbacks
    except Exception as e:
        return {"error": f"Failed to parse file: {str(e)}"}
    
    # 3. Compute top-level metrics
    stats = {
        "rowCount": len(df),
        "columnCount": len(df.columns),
        "columns": []
    }
    
    # 4. Analyze each column
    for col in df.columns:
        col_series = df[col]
        null_count = int(col_series.isnull().sum())
        unique_count = int(col_series.nunique())
        
        col_info = {
            "name": col,
            "type": str(col_series.dtype),
            "nullPercentage": round((null_count / len(df)) * 100, 2),
            "uniqueCount": unique_count
        }
        
        # 5. Distribution analysis
        if col_series.dtype == 'object' or unique_count < 20:
            # Categorical: value counts
            top_values = col_series.value_counts().head(15)
            col_info["distribution"] = {
                "labels": [str(x) for x in top_values.index],
                "values": [int(x) for x in top_values.values]
            }
        elif pd.api.types.is_numeric_dtype(col_series):
            # Numeric: histogram + stats
            clean_series = col_series.dropna()
            if not clean_series.empty:
                col_info["stats"] = {
                    "min": float(clean_series.min()),
                    "max": float(clean_series.max()),
                    "mean": float(clean_series.mean()),
                    "median": float(clean_series.median())
                }
                hist, bins = np.histogram(clean_series, bins=10)
                col_info["distribution"] = {
                    "labels": [f"{round(bins[i], 2)}-{round(bins[i+1], 2)}" for i in range(len(hist))],
                    "values": [int(x) for x in hist]
                }
        
        stats["columns"].append(col_info)
    
    # 6. Correlation matrix (numeric columns only)
    try:
        num_df = df.select_dtypes(include=[np.number])
        if not num_df.empty and len(num_df.columns) > 1:
            corr = num_df.corr().fillna(0).round(2)
            stats["correlation"] = {
                "columns": list(corr.columns),
                "values": corr.values.tolist()
            }
    except Exception as e:
        logger.warning(f"Correlation calculation failed: {e}")
    
    return stats
```

#### Output Format (JSON)

```json
{
  "rowCount": 50,
  "columnCount": 7,
  "columns": [
    {
      "name": "age",
      "type": "int64",
      "nullPercentage": 0.0,
      "uniqueCount": 18,
      "stats": {
        "min": 26.0,
        "max": 45.0,
        "mean": 34.5,
        "median": 34.0
      },
      "distribution": {
        "labels": ["26.0-27.9", "28.0-29.9", ...],
        "values": [5, 8, 12, ...]
      }
    },
    {
      "name": "department",
      "type": "object",
      "nullPercentage": 0.0,
      "uniqueCount": 4,
      "distribution": {
        "labels": ["Engineering", "Marketing", "Sales", "Management"],
        "values": [20, 15, 12, 3]
      }
    }
  ],
  "correlation": {
    "columns": ["age", "salary", "experience_years", "performance_score"],
    "values": [
      [1.0, 0.85, 0.92, 0.45],
      [0.85, 1.0, 0.78, 0.52],
      [0.92, 0.78, 1.0, 0.48],
      [0.45, 0.52, 0.48, 1.0]
    ]
  }
}
```

---

## 5️⃣ COMPLETE DATA FLOW

### Upload Flow

```
1. User selects file in browser
   ↓
2. Frontend: POST /api/datasets/upload
   FormData: { file, projectId }
   ↓
3. Backend: DatasetController.uploadDataset()
   ↓
4. DatasetService.uploadDataset()
   - Save file to: backend/uploads/uuid_filename.csv
   - Parse file to count rows/columns
   ↓
5. Create Dataset entity
   dataset.filePath = "uuid_filename.csv" ✅
   ↓
6. Save to H2 database
   INSERT INTO dataset (...)
   ↓
7. Return dataset metadata to frontend
   { id, name, rowCount, columnCount, fileSize }
```

### Stats Retrieval Flow

```
1. User clicks "DATA INSIGHTS" tab
   ↓
2. Frontend: GET /api/datasets/{id}/stats
   ↓
3. Backend: DatasetController.getDatasetStats(id)
   ↓
4. DatasetService.findById(id)
   SELECT * FROM dataset WHERE id = ?
   ↓
5. AIService.getDatasetStats(fileName)
   - Build path: storageLocation + fileName
   - Path: "backend/uploads/uuid_filename.csv" ✅
   ↓
6. Execute Python process
   python stats.py --data "E:\...\backend\uploads\uuid_filename.csv"
   ↓
7. stats.py processes file
   - Detect file type (CSV/Excel)
   - Read with pandas
   - Compute statistics
   - Return JSON
   ↓
8. AIService captures output
   - Extract JSON from stdout
   - Cache result (Spring Cache)
   ↓
9. Return JSON to frontend
   ↓
10. AnalyticsDashboard renders
    - Parse JSON
    - Compute metrics
    - Generate insights
    - Render charts
```

---

## 6️⃣ ERROR HANDLING

### Frontend Error States

```javascript
// 1. Loading state
if (isLoading) return <LoadingSkeleton />;

// 2. Empty state
if (!stats) return <EmptyState />;

// 3. Error state
if (stats.error) {
    return <ErrorDisplay message={stats.error} />;
}

// 4. Success state
return <DashboardContent stats={stats} />;
```

### Backend Error Handling

```java
@GetMapping("/{id}/stats")
public ResponseEntity<String> getDatasetStats(@PathVariable Long id) {
    try {
        Dataset dataset = datasetService.findById(id);
        String stats = aiService.getDatasetStats(dataset.getFilePath());
        return ResponseEntity.ok(stats);
    } catch (Exception e) {
        log.error("Failed to get dataset stats", e);
        return ResponseEntity.status(500)
            .body("{\"error\": \"" + e.getMessage() + "\"}");
    }
}
```

### Python Error Handling

```python
try:
    df = pd.read_excel(data_path, engine='openpyxl')
except Exception as excel_error:
    return {"error": f"Failed to parse Excel file: {str(excel_error)}"}
```

---

## 7️⃣ PERFORMANCE OPTIMIZATIONS

### Caching Strategy

```java
@Cacheable(value = "datasetStats", key = "#fileName", unless = "#result == null")
public String getDatasetStats(String fileName) throws Exception {
    // Expensive computation cached
}
```

**Cache Configuration**:
```properties
spring.cache.type=simple
```

**Benefits**:
- First request: Computes stats (slow)
- Subsequent requests: Returns cached result (fast)
- Cache invalidation: Automatic on backend restart

### Frontend Optimizations

```javascript
// 1. useMemo for expensive computations
const metrics = useMemo(() => {
    // Compute metrics only when stats change
}, [stats, historicalMetrics]);

// 2. useMemo for insights
const autoInsights = useMemo(() => {
    // Generate insights only when stats/metrics change
}, [stats, metrics]);

// 3. Filtered columns
const filteredColumns = useMemo(() => {
    // Filter only when filters or columns change
}, [stats.columns, activeFilters]);
```

### Database Optimizations

```java
// Lazy loading for relationships
@ManyToOne(fetch = FetchType.LAZY)
@JoinColumn(name = "project_id")
private Project project;

// Connection pooling
spring.datasource.hikari.maximum-pool-size=10
spring.datasource.hikari.minimum-idle=5
```

---

## 8️⃣ SECURITY CONSIDERATIONS

### File Upload Security

```java
// 1. Filename sanitization
String safeName = originalName.replaceAll("[^a-zA-Z0-9._-]", "_");

// 2. UUID prefix prevents collisions
String fileName = UUID.randomUUID() + "_" + safeName;

// 3. File size limits
spring.servlet.multipart.max-file-size=100MB
spring.servlet.multipart.max-request-size=100MB
```

### Path Traversal Prevention

```java
// Resolve paths safely
Path uploadPath = Paths.get(storageLocation);
Path filePath = uploadPath.resolve(fileName);

// Verify file is within upload directory
if (!filePath.startsWith(uploadPath)) {
    throw new SecurityException("Invalid file path");
}
```

### SQL Injection Prevention

```java
// JPA uses parameterized queries automatically
@Query("SELECT d FROM Dataset d WHERE d.project.id = :projectId")
List<Dataset> findByProjectId(@Param("projectId") Long projectId);
```

---

## 9️⃣ TESTING STRATEGY

### Frontend Testing

```javascript
// Unit tests for components
describe('AnalyticsDashboard', () => {
    it('should display error state when stats.error exists', () => {
        const stats = { error: 'File not found' };
        render(<AnalyticsDashboard stats={stats} />);
        expect(screen.getByText('Analysis Failed')).toBeInTheDocument();
    });
    
    it('should compute metrics correctly', () => {
        const stats = { rowCount: 100, columnCount: 5, columns: [...] };
        render(<AnalyticsDashboard stats={stats} />);
        expect(screen.getByText('100')).toBeInTheDocument();
    });
});
```

### Backend Testing

```java
@Test
public void testGetDatasetStats() {
    Dataset dataset = new Dataset();
    dataset.setFilePath("test.csv");
    
    when(datasetService.findById(1L)).thenReturn(dataset);
    when(aiService.getDatasetStats("test.csv")).thenReturn("{\"rowCount\": 100}");
    
    ResponseEntity<String> response = datasetController.getDatasetStats(1L);
    
    assertEquals(200, response.getStatusCodeValue());
    assertTrue(response.getBody().contains("rowCount"));
}
```

### Integration Testing

```bash
# 1. Upload dataset
curl -X POST http://localhost:8080/api/datasets/upload \
  -F "file=@test.csv" \
  -F "projectId=1"

# 2. Get stats
curl http://localhost:8080/api/datasets/1/stats

# 3. Verify response
{
  "rowCount": 50,
  "columnCount": 7,
  "columns": [...]
}
```

---

## 🔟 TROUBLESHOOTING GUIDE

### Common Issues

#### Issue 1: "Analysis Failed - File not found"

**Cause**: Path duplication or incorrect file path in database

**Solution**:
```java
// Ensure DatasetService stores only filename
dataset.setFilePath(fileName); // ✅ Correct
// NOT: dataset.setFilePath(filePath.toString()); // ❌ Wrong
```

#### Issue 2: "Failed to parse Excel file"

**Cause**: Missing openpyxl dependency

**Solution**:
```bash
cd ai-engine
pip install openpyxl==3.1.2
```

#### Issue 3: Blank screen in frontend

**Cause**: stats.error not handled

**Solution**:
```javascript
// Add error handling in AnalyticsDashboard
if (stats.error) {
    return <ErrorDisplay message={stats.error} />;
}
```

#### Issue 4: Data lost after restart

**Cause**: H2 in-memory database

**Solution**:
```properties
# Switch to file-based H2
spring.datasource.url=jdbc:h2:file:./data/synthetic_platform

# Or use MySQL
spring.datasource.url=jdbc:mysql://localhost:3306/synthesis
```

---

## 📊 METRICS & MONITORING

### Backend Metrics

```properties
# Actuator endpoints
management.endpoints.web.exposure.include=health,info,metrics
management.endpoint.health.show-details=always
```

**Access**: http://localhost:8080/actuator/health

### Frontend Performance

```javascript
// React DevTools Profiler
<Profiler id="AnalyticsDashboard" onRender={onRenderCallback}>
    <AnalyticsDashboard stats={stats} />
</Profiler>
```

### Database Monitoring

```sql
-- H2 Console: http://localhost:8080/h2-console

-- Check dataset count
SELECT COUNT(*) FROM dataset;

-- Check file paths
SELECT id, name, file_path FROM dataset;

-- Check orphaned files
SELECT file_path FROM dataset WHERE file_path NOT LIKE '%uuid%';
```

---

## 🎯 SUMMARY

### Architecture Highlights

✅ **Frontend**: React + Chart.js for interactive visualizations
✅ **Backend**: Spring Boot REST API with caching
✅ **Database**: H2 in-memory for fast development
✅ **AI Engine**: Python + pandas for statistical analysis
✅ **File Support**: CSV and Excel (.xlsx, .xls)
✅ **Error Handling**: Comprehensive error states at all layers
✅ **Performance**: Caching, lazy loading, memoization
✅ **Security**: Input sanitization, path validation

### Key Files

| Layer | File | Lines | Purpose |
|-------|------|-------|---------|
| Frontend | AnalyticsDashboard.jsx | 1,829 | UI rendering |
| Backend | DatasetController.java | 150 | REST API |
| Backend | DatasetService.java | 209 | File management |
| Backend | AIService.java | 250 | Python integration |
| Database | Dataset.java | 80 | Entity model |
| AI Engine | stats.py | 97 | Statistical analysis |

### Data Flow Summary

```
User Upload → Backend saves file → H2 stores metadata
                                         ↓
User clicks "Data Insights" → Backend queries H2 → Gets file path
                                         ↓
Backend calls Python → stats.py analyzes file → Returns JSON
                                         ↓
Frontend renders charts → User sees analytics
```

---

**Status**: ✅ Fully Analyzed
**Date**: 2026-01-18
**Version**: 1.0
