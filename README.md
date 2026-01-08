# SYNTHESIS - Intelligence Engine

SynthoGen is a production-grade platform for generating high-fidelity, statistically accurate synthetic data with **Zero-Leakage** guarantees. Designed for financial institutions and data-sensitive industries.

## 🏗 Enterprise Architecture

- **Frontend**: React 18 / Vite / Tailwind CSS / Chart.js (High-Fidelity Dashboard)
- **Backend**: Spring Boot 3.x / JPA / MySQL / Async AI Orchestration
- **AI Core**: Python 3.9+ / SDV (CTGANSynthesizer) / Pandas / Numpy
- **Design**: Premium Glassmorphism with Boxicons Integration

## 🚀 Production Deployment Guide

### 1. Prerequisites
- **JDK 17+**
- **MySQL 8.0**
- **Python 3.9+** (with `pip install sdv pandas numpy`)
- **Maven 3.8+**
- **Node.js 18+**

### 2. Database Environment
Create a database named `synthetic_platform` and execute the schema:
```sql
SOURCE sql/schema.sql;
```

### 3. Backend Configuration
Update `backend/src/main/resources/application.properties`:
- `spring.datasource.url`: Your MySQL URL
- `app.python.path`: Full path to your python executable (e.g., `C:\Python39\python.exe`)
- `app.storage.location`: Path for model/dataset storage (e.g., `C:\SynthoGen\storage`)

### 4. Build & Start
```bash
# Backend
cd backend
mvn clean install
mvn spring-boot:run

# Frontend
cd frontend
npm install
npm run dev
```

## 🔒 Security & Data Integrity
- **Leakage Protection**: Every generated batch undergoes a row-level audit against original data to ensure 0% record duplication.
- **Statistical Fidelity**: CTGAN models preserve multivariate correlations and distributions.
- **Sanitized Uploads**: Automated filename and path sanitization to prevent injection and traversal attacks.
- **Async Processing**: AI tasks run in a dedicated thread pool to ensure background stability.

## 📊 Analytics Hub
- **Signal Distribution**: Real-time frequency analysis and histograms.
- **Correlation Heatmap**: Visual map of feature dependencies.
- **Quality Audit**: Automated null-analysis and data health checks.

---
© 2026 SynthoGen Intelligence Systems.
