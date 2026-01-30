"""
HYBRID Dataset Intelligence System
Combines deterministic data analysis with LLM reasoning via RAG

MODE 1: Deterministic Data Analysis (Non-LLM, Mandatory First)
MODE 2: LLM Reasoning & Q/A (RAG-based, using Gemma via Ollama)
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import requests
from dotenv import load_dotenv
import logging
import pandas as pd
import numpy as np
from werkzeug.utils import secure_filename
import json
from datetime import datetime
from scipy import stats as scipy_stats

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json'}

# Create upload folder
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory storage for analyzed datasets
analyzed_datasets = {}

# Sensitive field patterns (heuristic detection)
SENSITIVE_PATTERNS = {
    'email': ['email', 'e-mail', 'mail'],
    'phone': ['phone', 'mobile', 'tel', 'contact'],
    'ssn': ['ssn', 'social_security', 'national_id'],
    'credit_card': ['card', 'credit', 'payment'],
    'address': ['address', 'street', 'city', 'zip', 'postal'],
    'name': ['name', 'firstname', 'lastname', 'fullname'],
    'dob': ['birth', 'dob', 'birthday'],
    'salary': ['salary', 'income', 'wage', 'compensation']
}

# Check if LangChain is available
try:
    from langchain_community.llms import Ollama
    from langchain.prompts import PromptTemplate
    from langchain.chains import LLMChain
    LANGCHAIN_AVAILABLE = True
    logger.info("✅ LangChain loaded successfully")
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logger.warning("⚠️ LangChain not available - using direct Ollama API")


def check_ollama_health():
    """Check if Ollama service is running"""
    try:
        response = requests.get(f"{OLLAMA_URL}/api/tags", timeout=2)
        return response.status_code == 200
    except:
        return False


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def detect_sensitive_fields(columns):
    """Heuristic detection of potentially sensitive fields"""
    sensitive_fields = []
    
    for col in columns:
        col_lower = col.lower()
        for category, patterns in SENSITIVE_PATTERNS.items():
            if any(pattern in col_lower for pattern in patterns):
                sensitive_fields.append({
                    'column': col,
                    'category': category,
                    'risk': 'HIGH' if category in ['ssn', 'credit_card'] else 'MEDIUM'
                })
                break
    
    return sensitive_fields


def calculate_data_quality_score(analysis):
    """Calculate overall data quality score (0-100)"""
    score = 100
    
    # Penalize for missing values
    if analysis['missing_values']:
        total_cells = analysis['basic_info']['rows'] * analysis['basic_info']['columns']
        missing_cells = sum(v['count'] for v in analysis['missing_values'].values())
        missing_percentage = (missing_cells / total_cells) * 100
        score -= min(30, missing_percentage)
    
    # Penalize for duplicates
    if analysis['duplicates']['count'] > 0:
        dup_percentage = (analysis['duplicates']['count'] / analysis['basic_info']['rows']) * 100
        score -= min(20, dup_percentage)
    
    # Penalize for sensitive fields
    if analysis['sensitive_fields']:
        score -= len(analysis['sensitive_fields']) * 5
    
    # Penalize for high outlier count
    if analysis['outliers']['total_outliers'] > 0:
        outlier_percentage = (analysis['outliers']['total_outliers'] / analysis['basic_info']['rows']) * 100
        score -= min(10, outlier_percentage / 2)
    
    return max(0, min(100, int(score)))


def analyze_dataset_deterministic(df, filename):
    """
    MODE 1: DETERMINISTIC DATA ANALYSIS
    No LLM, pure statistical analysis
    """
    try:
        logger.info(f"📊 Starting deterministic analysis for: {filename}")
        
        analysis = {
            "filename": filename,
            "timestamp": datetime.now().isoformat(),
            "status": "ANALYZING",
            "mode": "DETERMINISTIC",
            
            # Basic Info
            "basic_info": {
                "file_type": filename.rsplit('.', 1)[1].upper(),
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "memory_usage_kb": round(df.memory_usage(deep=True).sum() / 1024, 2)
            },
            
            # Schema
            "schema": {},
            
            # Missing Values
            "missing_values": {},
            
            # Duplicates
            "duplicates": {
                "count": int(df.duplicated().sum()),
                "percentage": round((df.duplicated().sum() / len(df)) * 100, 2)
            },
            
            # Statistics
            "numeric_stats": {},
            "categorical_stats": {},
            
            # Correlations
            "correlations": {},
            
            # Outliers
            "outliers": {
                "columns": {},
                "total_outliers": 0
            },
            
            # Sensitive Fields
            "sensitive_fields": [],
            
            # Time Columns
            "time_columns": [],
            
            # Sample Data (first 3 rows only, no PII)
            "sample_preview": []
        }
        
        # Detect sensitive fields
        analysis["sensitive_fields"] = detect_sensitive_fields(df.columns)
        
        # Analyze each column
        for col in df.columns:
            # Schema
            analysis["schema"][col] = str(df[col].dtype)
            
            # Missing values
            missing_count = int(df[col].isnull().sum())
            if missing_count > 0:
                analysis["missing_values"][col] = {
                    "count": missing_count,
                    "percentage": round((missing_count / len(df)) * 100, 2)
                }
            
            # Numeric analysis
            if pd.api.types.is_numeric_dtype(df[col]):
                col_data = df[col].dropna()
                
                if len(col_data) > 0:
                    # Basic stats
                    analysis["numeric_stats"][col] = {
                        "count": int(len(col_data)),
                        "mean": round(float(col_data.mean()), 4),
                        "median": round(float(col_data.median()), 4),
                        "std": round(float(col_data.std()), 4),
                        "min": round(float(col_data.min()), 4),
                        "max": round(float(col_data.max()), 4),
                        "q25": round(float(col_data.quantile(0.25)), 4),
                        "q75": round(float(col_data.quantile(0.75)), 4),
                        "skewness": round(float(col_data.skew()), 4),
                        "kurtosis": round(float(col_data.kurtosis()), 4)
                    }
                    
                    # Outlier detection (IQR method)
                    Q1 = col_data.quantile(0.25)
                    Q3 = col_data.quantile(0.75)
                    IQR = Q3 - Q1
                    outliers = col_data[(col_data < (Q1 - 1.5 * IQR)) | (col_data > (Q3 + 1.5 * IQR))]
                    
                    if len(outliers) > 0:
                        analysis["outliers"]["columns"][col] = {
                            "count": int(len(outliers)),
                            "percentage": round((len(outliers) / len(col_data)) * 100, 2)
                        }
                        analysis["outliers"]["total_outliers"] += len(outliers)
            
            # Categorical analysis
            elif pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
                col_data = df[col].dropna()
                
                if len(col_data) > 0:
                    value_counts = col_data.value_counts()
                    unique_count = int(col_data.nunique())
                    
                    analysis["categorical_stats"][col] = {
                        "unique_count": unique_count,
                        "most_common": str(value_counts.index[0]) if len(value_counts) > 0 else None,
                        "most_common_count": int(value_counts.iloc[0]) if len(value_counts) > 0 else 0,
                        "most_common_percentage": round((value_counts.iloc[0] / len(col_data)) * 100, 2) if len(value_counts) > 0 else 0,
                        "cardinality": "HIGH" if unique_count > len(col_data) * 0.5 else "MEDIUM" if unique_count > 10 else "LOW"
                    }
            
            # Time column detection
            if 'date' in col.lower() or 'time' in col.lower():
                analysis["time_columns"].append(col)
        
        # Correlation analysis (numeric columns only)
        numeric_cols = df.select_dtypes(include=[np.number]).columns
        if len(numeric_cols) > 1:
            corr_matrix = df[numeric_cols].corr()
            
            # Find strong correlations (> 0.7 or < -0.7)
            strong_corr = []
            for i in range(len(corr_matrix.columns)):
                for j in range(i+1, len(corr_matrix.columns)):
                    corr_value = corr_matrix.iloc[i, j]
                    if abs(corr_value) > 0.7:
                        strong_corr.append({
                            "column1": corr_matrix.columns[i],
                            "column2": corr_matrix.columns[j],
                            "correlation": round(float(corr_value), 4),
                            "strength": "STRONG" if abs(corr_value) > 0.9 else "MODERATE"
                        })
            
            analysis["correlations"]["strong_correlations"] = strong_corr
        
        # Sample preview (non-sensitive columns only, first 3 rows)
        safe_columns = [col for col in df.columns if not any(
            sf['column'] == col for sf in analysis["sensitive_fields"]
        )]
        if safe_columns:
            analysis["sample_preview"] = df[safe_columns].head(3).to_dict('records')
        
        # Calculate quality score
        analysis["quality_score"] = calculate_data_quality_score(analysis)
        
        # Determine quality level
        if analysis["quality_score"] >= 80:
            analysis["quality_level"] = "HIGH"
        elif analysis["quality_score"] >= 60:
            analysis["quality_level"] = "MEDIUM"
        else:
            analysis["quality_level"] = "LOW"
        
        # Key risks
        analysis["key_risks"] = []
        
        if analysis["missing_values"]:
            analysis["key_risks"].append({
                "type": "MISSING_DATA",
                "severity": "HIGH" if len(analysis["missing_values"]) > len(df.columns) * 0.3 else "MEDIUM",
                "description": f"{len(analysis["missing_values"])} columns have missing values"
            })
        
        if analysis["duplicates"]["count"] > 0:
            analysis["key_risks"].append({
                "type": "DUPLICATES",
                "severity": "HIGH" if analysis["duplicates"]["percentage"] > 10 else "MEDIUM",
                "description": f"{analysis['duplicates']['count']} duplicate rows ({analysis['duplicates']['percentage']}%)"
            })
        
        if analysis["sensitive_fields"]:
            high_risk_fields = [f for f in analysis["sensitive_fields"] if f['risk'] == 'HIGH']
            analysis["key_risks"].append({
                "type": "SENSITIVE_DATA",
                "severity": "HIGH" if high_risk_fields else "MEDIUM",
                "description": f"{len(analysis['sensitive_fields'])} potentially sensitive fields detected"
            })
        
        if analysis["outliers"]["total_outliers"] > 0:
            outlier_percentage = (analysis["outliers"]["total_outliers"] / len(df)) * 100
            if outlier_percentage > 5:
                analysis["key_risks"].append({
                    "type": "OUTLIERS",
                    "severity": "MEDIUM",
                    "description": f"{analysis['outliers']['total_outliers']} outliers detected ({round(outlier_percentage, 2)}%)"
                })
        
        analysis["status"] = "SUCCESS"
        logger.info(f"✅ Analysis complete: {filename} (Quality: {analysis['quality_level']})")
        
        return analysis
        
    except Exception as e:
        logger.error(f"❌ Analysis failed for {filename}: {e}")
        return {
            "filename": filename,
            "timestamp": datetime.now().isoformat(),
            "status": "FAILED",
            "error": str(e),
            "mode": "DETERMINISTIC",
            "basic_info": {
                "file_type": filename.rsplit('.', 1)[1].upper() if '.' in filename else 'UNKNOWN',
                "rows": 0,
                "columns": 0,
                "column_names": []
            },
            "quality_score": 0,
            "quality_level": "N/A",
            "key_risks": [{"type": "ANALYSIS_ERROR", "severity": "HIGH", "description": str(e)}]
        }


def build_llm_context(analysis):
    """Build context for LLM from analysis results"""
    if analysis.get("status") != "SUCCESS":
        return "Dataset analysis failed. Cannot provide insights."
    
    context_parts = [
        f"Dataset Analysis Report for: {analysis['filename']}",
        f"File Type: {analysis['basic_info']['file_type']}",
        f"Dimensions: {analysis['basic_info']['rows']} rows × {analysis['basic_info']['columns']} columns",
        f"Data Quality: {analysis['quality_level']} ({analysis['quality_score']}/100)",
        ""
    ]
    
    # Column information
    context_parts.append("Columns:")
    for col, dtype in analysis['schema'].items():
        context_parts.append(f"  - {col} ({dtype})")
    context_parts.append("")
    
    # Missing values
    if analysis['missing_values']:
        context_parts.append("Missing Values:")
        for col, info in analysis['missing_values'].items():
            context_parts.append(f"  - {col}: {info['count']} ({info['percentage']}%)")
        context_parts.append("")
    
    # Duplicates
    if analysis['duplicates']['count'] > 0:
        context_parts.append(f"Duplicates: {analysis['duplicates']['count']} rows ({analysis['duplicates']['percentage']}%)")
        context_parts.append("")
    
    # Numeric statistics
    if analysis['numeric_stats']:
        context_parts.append("Numeric Columns Summary:")
        for col, stats in analysis['numeric_stats'].items():
            context_parts.append(
                f"  - {col}: mean={stats['mean']}, median={stats['median']}, "
                f"std={stats['std']}, range=[{stats['min']}, {stats['max']}]"
            )
        context_parts.append("")
    
    # Categorical statistics
    if analysis['categorical_stats']:
        context_parts.append("Categorical Columns Summary:")
        for col, stats in analysis['categorical_stats'].items():
            context_parts.append(
                f"  - {col}: {stats['unique_count']} unique values, "
                f"most common: {stats['most_common']} ({stats['most_common_percentage']}%)"
            )
        context_parts.append("")
    
    # Correlations
    if analysis['correlations'].get('strong_correlations'):
        context_parts.append("Strong Correlations:")
        for corr in analysis['correlations']['strong_correlations']:
            context_parts.append(
                f"  - {corr['column1']} ↔ {corr['column2']}: {corr['correlation']} ({corr['strength']})"
            )
        context_parts.append("")
    
    # Outliers
    if analysis['outliers']['columns']:
        context_parts.append("Outliers Detected:")
        for col, info in analysis['outliers']['columns'].items():
            context_parts.append(f"  - {col}: {info['count']} outliers ({info['percentage']}%)")
        context_parts.append("")
    
    # Key risks
    if analysis['key_risks']:
        context_parts.append("Key Risks:")
        for risk in analysis['key_risks']:
            context_parts.append(f"  - [{risk['severity']}] {risk['type']}: {risk['description']}")
        context_parts.append("")
    
    # Sensitive fields
    if analysis['sensitive_fields']:
        context_parts.append("Sensitive Fields Detected:")
        for field in analysis['sensitive_fields']:
            context_parts.append(f"  - {field['column']} ({field['category']}) - Risk: {field['risk']}")
        context_parts.append("")
    
    return "\n".join(context_parts)


def query_llm(question, context):
    """
    MODE 2: LLM REASONING & Q/A
    Uses Ollama (Gemma) with RAG over analysis results
    """
    try:
        if not check_ollama_health():
            return "❌ LLM service (Ollama) is not available. Please start Ollama with: ollama serve"
        
        # Build prompt
        prompt = f"""You are a Dataset Intelligence Assistant. You help users understand their data analysis results.

STRICT RULES:
1. Answer ONLY using the provided analysis results
2. NEVER make up statistics or data
3. NEVER expose raw data rows
4. NEVER infer or mention specific PII values
5. Be clear, structured, and business-friendly

DATASET ANALYSIS RESULTS:
{context}

USER QUESTION: {question}

Provide a clear, data-driven answer based ONLY on the analysis results above. If the question cannot be answered from the available data, explain what information is missing."""

        # Query Ollama
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": prompt,
                "stream": False
            },
            timeout=60
        )
        
        if response.status_code == 200:
            return response.json().get("response", "No response from LLM")
        else:
            return f"❌ LLM error: HTTP {response.status_code}"
            
    except Exception as e:
        logger.error(f"LLM query error: {e}")
        return f"❌ Error querying LLM: {str(e)}"


# ============================================
# API ENDPOINTS
# ============================================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    ollama_status = check_ollama_health()
    
    return jsonify({
        "service": "Hybrid Dataset Intelligence System",
        "status": "online",
        "mode": "HYBRID (Deterministic + LLM)",
        "model": OLLAMA_MODEL,
        "ollama_url": OLLAMA_URL,
        "ollama_running": ollama_status,
        "langchain_available": LANGCHAIN_AVAILABLE
    })


@app.route('/upload', methods=['POST'])
def upload_and_analyze():
    """
    Upload and analyze dataset (MODE 1: Deterministic Analysis)
    """
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file provided"}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                "error": "Invalid file type",
                "allowed": list(ALLOWED_EXTENSIONS)
            }), 400
        
        # Save file
        filename = secure_filename(file.filename)
        filepath = os.path.join(UPLOAD_FOLDER, filename)
        file.save(filepath)
        
        logger.info(f"📁 File uploaded: {filename}")
        
        # Read file
        file_ext = filename.rsplit('.', 1)[1].lower()
        
        try:
            if file_ext == 'csv':
                df = pd.read_csv(filepath)
            elif file_ext in ['xlsx', 'xls']:
                df = pd.read_excel(filepath)
            elif file_ext == 'json':
                df = pd.read_json(filepath)
            else:
                return jsonify({"error": "Unsupported file type"}), 400
            
            # MODE 1: Deterministic Analysis
            analysis = analyze_dataset_deterministic(df, filename)
            
            # Store results
            file_id = filename.replace('.', '_').replace(' ', '_')
            analyzed_datasets[file_id] = {
                "analysis": analysis,
                "filepath": filepath,
                "dataframe": df  # Keep for potential future queries
            }
            
            return jsonify({
                "status": "success",
                "message": f"Dataset '{filename}' analyzed successfully",
                "file_id": file_id,
                "analysis": analysis
            })
            
        except Exception as e:
            logger.error(f"Error analyzing file: {e}")
            return jsonify({
                "status": "failed",
                "error": f"Analysis failed: {str(e)}"
            }), 500
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/query', methods=['POST'])
def hybrid_query():
    """
    Hybrid Query: Combines analysis results with LLM reasoning (MODE 2)
    """
    try:
        data = request.json
        question = data.get('query', '')
        file_id = data.get('file_id', None)
        
        if not question:
            return jsonify({"error": "No query provided"}), 400
        
        # If no file context, answer general questions
        if not file_id or file_id not in analyzed_datasets:
            if not check_ollama_health():
                return jsonify({
                    "error": "Ollama service is not running",
                    "suggestion": "Please start Ollama with: ollama serve"
                }), 503
            
            # General LLM query
            general_prompt = f"""You are a helpful data analysis assistant. Answer this general question:

{question}

Be helpful, clear, and concise."""
            
            response = requests.post(
                f"{OLLAMA_URL}/api/generate",
                json={"model": OLLAMA_MODEL, "prompt": general_prompt, "stream": False},
                timeout=30
            )
            
            return jsonify({
                "response": response.json().get("response", "No response") if response.status_code == 200 else "Error",
                "model": OLLAMA_MODEL,
                "mode": "GENERAL",
                "has_context": False
            })
        
        # Get analysis results
        dataset = analyzed_datasets[file_id]
        analysis = dataset["analysis"]
        
        # Build context from analysis
        context = build_llm_context(analysis)
        
        # MODE 2: LLM Query with RAG
        llm_response = query_llm(question, context)
        
        return jsonify({
            "response": llm_response,
            "model": OLLAMA_MODEL,
            "mode": "HYBRID",
            "file_context": {
                "filename": analysis["filename"],
                "rows": analysis["basic_info"]["rows"],
                "columns": analysis["basic_info"]["columns"],
                "quality_score": analysis["quality_score"],
                "quality_level": analysis["quality_level"]
            },
            "has_context": True
        })
        
    except Exception as e:
        logger.error(f"Query error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/files', methods=['GET'])
def list_files():
    """List all analyzed datasets"""
    files_list = []
    for file_id, data in analyzed_datasets.items():
        analysis = data["analysis"]
        if analysis.get("status") == "SUCCESS":
            files_list.append({
                "file_id": file_id,
                "filename": analysis["filename"],
                "rows": analysis["basic_info"]["rows"],
                "columns": analysis["basic_info"]["columns"],
                "quality_score": analysis["quality_score"],
                "quality_level": analysis["quality_level"],
                "timestamp": analysis["timestamp"]
            })
    
    return jsonify({
        "files": files_list,
        "count": len(files_list)
    })


@app.route('/file/<file_id>', methods=['GET'])
def get_file_analysis(file_id):
    """Get detailed analysis for a specific file"""
    if file_id not in analyzed_datasets:
        return jsonify({"error": "File not found"}), 404
    
    return jsonify({
        "file_id": file_id,
        "analysis": analyzed_datasets[file_id]["analysis"]
    })


@app.route('/file/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Delete an analyzed file"""
    if file_id not in analyzed_datasets:
        return jsonify({"error": "File not found"}), 404
    
    try:
        filepath = analyzed_datasets[file_id]["filepath"]
        if os.path.exists(filepath):
            os.remove(filepath)
        
        del analyzed_datasets[file_id]
        
        return jsonify({
            "status": "success",
            "message": f"File {file_id} deleted"
        })
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    logger.info("=" * 80)
    logger.info("🤖 HYBRID DATASET INTELLIGENCE SYSTEM")
    logger.info("=" * 80)
    logger.info("MODE 1: Deterministic Data Analysis (Non-LLM)")
    logger.info("MODE 2: LLM Reasoning & Q/A (RAG-based)")
    logger.info("=" * 80)
    logger.info(f"Model: {OLLAMA_MODEL}")
    logger.info(f"Ollama URL: {OLLAMA_URL}")
    logger.info(f"LangChain: {'✅ Available' if LANGCHAIN_AVAILABLE else '❌ Not Available'}")
    
    if check_ollama_health():
        logger.info("✅ Ollama service is running")
    else:
        logger.warning("⚠️ Ollama service is NOT running - MODE 2 will be unavailable")
    
    logger.info("=" * 80)
    logger.info("🚀 Starting server on http://localhost:5000")
    logger.info("=" * 80)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
