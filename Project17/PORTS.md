Fraud Detection System - Port Allocation List
==============================================

Ports Used
----------
Port    | Service               | Description
--------|-----------------------|----------------------------------------
8000    | Backend API           | FastAPI backend service with REST API
5173    | Frontend Web          | Vue.js frontend web application

Service Details
---------------

1. Backend API Service (Port 8000)
   - Framework: FastAPI
   - API Base URL: http://localhost:8000/api
   - API Documentation: http://localhost:8000/docs (Swagger UI)
   - Alternative API Docs: http://localhost:8000/redoc (ReDoc)
   - Health Check: http://localhost:8000/health

   API Endpoints:
   - GET    /api/transactions           - List transactions
   - POST   /api/transactions           - Create transaction
   - GET    /api/transactions/{id}      - Get transaction detail
   - POST   /api/transactions/{id}/detect - Detect fraud
   - GET    /api/alerts                 - List risk alerts
   - PUT    /api/alerts/{id}/handle     - Handle alert
   - GET    /api/rules                  - List risk rules
   - POST   /api/rules                  - Create rule
   - PUT    /api/rules/{id}             - Update rule
   - GET    /api/cases                  - List cases
   - PUT    /api/cases/{id}             - Update case
   - GET    /api/dashboard/stats        - Dashboard statistics
   - GET    /api/ml/models              - List ML models
   - POST   /api/ml/models/train        - Train ML model

2. Frontend Web Service (Port 5173)
   - Framework: Vue 3 + Vite
   - Web URL: http://localhost:5173
   - Development server with hot-reload

   Pages:
   - /dashboard     - Dashboard with statistics and charts
   - /transactions  - Transaction management
   - /alerts        - Risk alerts management
   - /cases         - Case analysis
   - /rules         - Risk rules management
   - /ml-model      - ML model management

Database
--------
- Type: SQLite
- File: backend/fraud_detection.db
- No network port required

Development Access
------------------
- Frontend proxy: /api -> http://localhost:8000
- CORS: Enabled for all origins (development mode)

Docker Deployment (Optional)
----------------------------
When using docker-compose, the same ports are used:
- Backend: 8000:8000
- Frontend: 5173:5173

Note: Make sure these ports are not in use before starting the system.
