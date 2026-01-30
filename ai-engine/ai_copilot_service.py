"""
AI Copilot Service - Hybrid RAG-based AI Assistant for Dataset Analysis
Supports file uploads (CSV, Excel, JSON) with automatic analysis
Uses LangChain + Ollama (Gemma) for intelligent data insights
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

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "gemma3:4b")
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'xls', 'json'}

# Create upload folder if it doesn't exist
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# In-memory storage for analyzed files
analyzed_files = {}

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


def query_ollama_direct(prompt, context=""):
    """Direct query to Ollama API without LangChain"""
    try:
        full_prompt = f"{context}\n\n{prompt}" if context else prompt
        
        response = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": OLLAMA_MODEL,
                "prompt": full_prompt,
                "stream": False
            },
            timeout=300
        )
        
        if response.status_code == 200:
            return response.json().get("response", "No response from model")
        else:
            return f"Error: Ollama returned status {response.status_code}"
    except Exception as e:
        logger.error(f"Ollama query error: {e}")
        return f"Error querying Ollama: {str(e)}"


def query_with_langchain(prompt, context=""):
    """Query using LangChain for better prompt management"""
    try:
        llm = Ollama(
            base_url=OLLAMA_URL,
            model=OLLAMA_MODEL,
            temperature=0.7,
            timeout=300
        )
        
        template = """You are an AI data analyst assistant. You help users understand their datasets and provide insights.

{context}

User Question: {question}

Provide a helpful, accurate, and concise answer. If you don't have enough information, say so clearly."""

        prompt_template = PromptTemplate(
            input_variables=["context", "question"],
            template=template
        )
        
        chain = LLMChain(llm=llm, prompt=prompt_template)
        response = chain.run(context=context, question=prompt)
        
        return response
    except Exception as e:
        logger.error(f"LangChain query error: {e}")
        return query_ollama_direct(prompt, context)


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    ollama_status = check_ollama_health()
    
    return jsonify({
        "service": "AI Copilot Service",
        "status": "online",
        "model": OLLAMA_MODEL,
        "ollama_url": OLLAMA_URL,
        "ollama_running": ollama_status,
        "langchain_available": LANGCHAIN_AVAILABLE,
        "rag_enabled": True
    })


@app.route('/analyze', methods=['POST'])
def analyze():
    """
    Main AI Copilot endpoint
    Accepts: { "query": "user question", "statistics": {...}, "datasetInfo": {...} }
    """
    try:
        data = request.json
        user_query = data.get('query', '')
        statistics = data.get('statistics', {})
        dataset_info = data.get('datasetInfo', {})
        
        if not user_query:
            return jsonify({"error": "No query provided"}), 400
        
        # Check Ollama availability
        if not check_ollama_health():
            return jsonify({
                "error": "Ollama service is not running",
                "suggestion": "Please start Ollama with: ollama serve"
            }), 503
        
        # Build context from dataset statistics
        context = build_context(statistics, dataset_info)
        
        # Query the AI model
        if LANGCHAIN_AVAILABLE:
            response = query_with_langchain(user_query, context)
        else:
            response = query_ollama_direct(user_query, context)
        
        return jsonify({
            "response": response,
            "model": OLLAMA_MODEL,
            "context_provided": bool(context)
        })
        
    except Exception as e:
        logger.error(f"Analysis error: {e}")
        return jsonify({"error": str(e)}), 500


def build_context(statistics, dataset_info):
    """Build context string from dataset statistics"""
    if not statistics and not dataset_info:
        return "No dataset context available. Provide general data analysis guidance."
    
    context_parts = []
    
    # Dataset basic info
    if dataset_info:
        context_parts.append("Dataset Information:")
        if 'name' in dataset_info:
            context_parts.append(f"- Name: {dataset_info['name']}")
        if 'rows' in dataset_info:
            context_parts.append(f"- Rows: {dataset_info['rows']}")
        if 'columns' in dataset_info:
            context_parts.append(f"- Columns: {dataset_info['columns']}")
    
    # Statistics
    if statistics:
        context_parts.append("\nDataset Statistics:")
        
        # Numeric statistics
        if 'numeric' in statistics:
            context_parts.append("\nNumeric Features:")
            for col, stats in statistics['numeric'].items():
                context_parts.append(f"- {col}: mean={stats.get('mean', 'N/A')}, "
                                   f"std={stats.get('std', 'N/A')}, "
                                   f"min={stats.get('min', 'N/A')}, "
                                   f"max={stats.get('max', 'N/A')}")
        
        # Categorical statistics
        if 'categorical' in statistics:
            context_parts.append("\nCategorical Features:")
            for col, stats in statistics['categorical'].items():
                context_parts.append(f"- {col}: {stats.get('unique', 'N/A')} unique values, "
                                   f"most common: {stats.get('top', 'N/A')}")
        
        # Missing values
        if 'missing' in statistics:
            context_parts.append("\nMissing Values:")
            for col, count in statistics['missing'].items():
                if count > 0:
                    context_parts.append(f"- {col}: {count} missing")
        
        # Data quality
        if 'quality' in statistics:
            quality = statistics['quality']
            context_parts.append(f"\nData Quality Score: {quality.get('score', 'N/A')}/100")
    
    return "\n".join(context_parts)


@app.route('/chat', methods=['POST'])
def chat():
    """Simple chat endpoint without dataset context"""
    try:
        data = request.json
        message = data.get('message', '')
        
        if not message:
            return jsonify({"error": "No message provided"}), 400
        
        if not check_ollama_health():
            return jsonify({
                "error": "Ollama service is not running",
                "suggestion": "Please start Ollama with: ollama serve"
            }), 503
        
        response = query_ollama_direct(message)
        
        return jsonify({
            "response": response,
            "model": OLLAMA_MODEL
        })
        
    except Exception as e:
        logger.error(f"Chat error: {e}")
        return jsonify({"error": str(e)}), 500


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def analyze_dataframe(df, filename):
    """Analyze a pandas DataFrame and generate comprehensive statistics"""
    try:
        analysis = {
            "filename": filename,
            "timestamp": datetime.now().isoformat(),
            "basic_info": {
                "rows": len(df),
                "columns": len(df.columns),
                "column_names": df.columns.tolist(),
                "memory_usage": f"{df.memory_usage(deep=True).sum() / 1024:.2f} KB"
            },
            "numeric_stats": {},
            "categorical_stats": {},
            "missing_values": {},
            "data_types": {},
            "sample_data": df.head(5).to_dict('records'),
            "quality_score": 100
        }
        
        # Analyze each column
        for col in df.columns:
            # Data type
            analysis["data_types"][col] = str(df[col].dtype)
            
            # Missing values
            missing_count = df[col].isnull().sum()
            if missing_count > 0:
                analysis["missing_values"][col] = int(missing_count)
                # Reduce quality score
                analysis["quality_score"] -= (missing_count / len(df)) * 10
            
            # Numeric columns
            if pd.api.types.is_numeric_dtype(df[col]):
                analysis["numeric_stats"][col] = {
                    "mean": float(df[col].mean()) if not df[col].isnull().all() else None,
                    "median": float(df[col].median()) if not df[col].isnull().all() else None,
                    "std": float(df[col].std()) if not df[col].isnull().all() else None,
                    "min": float(df[col].min()) if not df[col].isnull().all() else None,
                    "max": float(df[col].max()) if not df[col].isnull().all() else None,
                    "q25": float(df[col].quantile(0.25)) if not df[col].isnull().all() else None,
                    "q75": float(df[col].quantile(0.75)) if not df[col].isnull().all() else None
                }
            
            # Categorical columns
            elif pd.api.types.is_object_dtype(df[col]) or pd.api.types.is_categorical_dtype(df[col]):
                value_counts = df[col].value_counts()
                analysis["categorical_stats"][col] = {
                    "unique_count": int(df[col].nunique()),
                    "most_common": str(value_counts.index[0]) if len(value_counts) > 0 else None,
                    "most_common_count": int(value_counts.iloc[0]) if len(value_counts) > 0 else None,
                    "top_5_values": value_counts.head(5).to_dict()
                }
        
        # Ensure quality score is between 0 and 100
        analysis["quality_score"] = max(0, min(100, int(analysis["quality_score"])))
        
        # Calculate quality level
        if analysis["quality_score"] >= 90:
            analysis["quality_level"] = "EXCELLENT"
        elif analysis["quality_score"] >= 75:
            analysis["quality_level"] = "GOOD"
        elif analysis["quality_score"] >= 50:
            analysis["quality_level"] = "AVERAGE"
        else:
            analysis["quality_level"] = "POOR"
            
        analysis["basic_info"]["file_type"] = filename.rsplit('.', 1)[1].upper()
        
        return analysis
        
    except Exception as e:
        logger.error(f"Error analyzing dataframe: {e}")
        raise


@app.route('/upload', methods=['POST'])
def upload_file():
    """Upload and analyze a file (CSV, Excel, JSON)"""
    try:
        # Check if file is in request
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
        
        # Read file based on extension
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
            
            # Analyze the dataframe
            analysis = analyze_dataframe(df, filename)
            
            # Store in memory
            file_id = filename.replace('.', '_')
            analyzed_files[file_id] = {
                "analysis": analysis,
                "filepath": filepath,
                "dataframe": df  # Keep for future queries
            }
            
            logger.info(f"✅ File analyzed: {filename} ({len(df)} rows, {len(df.columns)} columns)")
            
            return jsonify({
                "status": "success",
                "message": f"File '{filename}' analyzed successfully",
                "file_id": file_id,
                "analysis": analysis
            })
            
        except Exception as e:
            logger.error(f"Error reading file: {e}")
            return jsonify({"error": f"Error reading file: {str(e)}"}), 500
        
    except Exception as e:
        logger.error(f"Upload error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/query', methods=['POST'])
def hybrid_query():
    """
    Hybrid query endpoint - answers questions using:
    1. General LLM knowledge
    2. Uploaded file data (if file_id provided)
    3. Combination of both
    """
    try:
        data = request.json
        user_query = data.get('query', '')
        file_id = data.get('file_id', None)
        
        if not user_query:
            return jsonify({"error": "No query provided"}), 400
        
        # Check Ollama availability
        if not check_ollama_health():
            return jsonify({
                "error": "Ollama service is not running",
                "suggestion": "Please start Ollama with: ollama serve"
            }), 503
        
        # Build context
        context = ""
        file_info = None
        
        if file_id:
            if file_id not in analyzed_files:
                return jsonify({
                    "error": "Dataset context lost due to service restart",
                    "suggestion": "Please re-upload your dataset to continue analysis."
                }), 404
                
            # Use file analysis as context
            file_data = analyzed_files[file_id]
            analysis = file_data["analysis"]
            
            context_parts = [
                f"You are analyzing the file: {analysis['filename']}",
                f"Dataset has {analysis['basic_info']['rows']} rows and {analysis['basic_info']['columns']} columns",
                f"Columns: {', '.join(analysis['basic_info']['column_names'])}",
                f"Data Quality Score: {analysis['quality_score']}/100"
            ]
            
            # Add numeric stats
            if analysis['numeric_stats']:
                context_parts.append("\nNumeric Columns:")
                for col, stats in analysis['numeric_stats'].items():
                    m = f"{stats['mean']:.2f}" if stats['mean'] is not None else 'N/A'
                    mi = f"{stats['min']:.2f}" if stats['min'] is not None else 'N/A'
                    ma = f"{stats['max']:.2f}" if stats['max'] is not None else 'N/A'
                    context_parts.append(f"- {col}: mean={m}, min={mi}, max={ma}")
            
            # Add categorical stats
            if analysis['categorical_stats']:
                context_parts.append("\nCategorical Columns:")
                for col, stats in analysis['categorical_stats'].items():
                    context_parts.append(
                        f"- {col}: {stats['unique_count']} unique values, "
                        f"most common: {stats['most_common']}"
                    )
            
            # Add missing values
            if analysis['missing_values']:
                context_parts.append("\nMissing Values:")
                for col, count in analysis['missing_values'].items():
                    context_parts.append(f"- {col}: {count} missing")
            
            context = "\n".join(context_parts)
            file_info = {
                "filename": analysis['filename'],
                "rows": analysis['basic_info']['rows'],
                "columns": analysis['basic_info']['columns'],
                "quality_score": analysis['quality_score']
            }
        
        # Query the AI model
        if LANGCHAIN_AVAILABLE:
            response = query_with_langchain(user_query, context)
        else:
            response = query_ollama_direct(user_query, context)
        
        return jsonify({
            "response": response,
            "model": OLLAMA_MODEL,
            "file_context": file_info,
            "has_context": bool(context)
        })
        
    except Exception as e:
        logger.error(f"Hybrid query error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/files', methods=['GET'])
def list_files():
    """List all analyzed files"""
    files_list = []
    for file_id, data in analyzed_files.items():
        analysis = data["analysis"]
        files_list.append({
            "file_id": file_id,
            "filename": analysis["filename"],
            "rows": analysis["basic_info"]["rows"],
            "columns": analysis["basic_info"]["columns"],
            "quality_score": analysis["quality_score"],
            "timestamp": analysis["timestamp"]
        })
    
    return jsonify({
        "files": files_list,
        "count": len(files_list)
    })


@app.route('/file/<file_id>', methods=['GET'])
def get_file_analysis(file_id):
    """Get detailed analysis for a specific file"""
    if file_id not in analyzed_files:
        return jsonify({"error": "File not found"}), 404
    
    return jsonify({
        "file_id": file_id,
        "analysis": analyzed_files[file_id]["analysis"]
    })


@app.route('/file/<file_id>', methods=['DELETE'])
def delete_file(file_id):
    """Delete an analyzed file"""
    if file_id not in analyzed_files:
        return jsonify({"error": "File not found"}), 404
    
    try:
        # Remove file from disk
        filepath = analyzed_files[file_id]["filepath"]
        if os.path.exists(filepath):
            os.remove(filepath)
        
        # Remove from memory
        del analyzed_files[file_id]
        
        return jsonify({
            "status": "success",
            "message": f"File {file_id} deleted"
        })
    except Exception as e:
        logger.error(f"Error deleting file: {e}")
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    logger.info("=" * 60)
    logger.info("🤖 AI Copilot Service Starting...")
    logger.info("=" * 60)
    logger.info(f"Model: {OLLAMA_MODEL}")
    logger.info(f"Ollama URL: {OLLAMA_URL}")
    logger.info(f"LangChain: {'✅ Available' if LANGCHAIN_AVAILABLE else '❌ Not Available'}")
    
    # Check Ollama on startup
    if check_ollama_health():
        logger.info("✅ Ollama service is running")
    else:
        logger.warning("⚠️ Ollama service is NOT running - please start it with: ollama serve")
    
    logger.info("=" * 60)
    logger.info("🚀 Starting Flask server on http://localhost:5000")
    logger.info("=" * 60)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
