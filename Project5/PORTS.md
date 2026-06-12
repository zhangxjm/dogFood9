# FraudGuard System Port List

## System Ports

| Port | Protocol | Service | Description | Accessibility |
|------|----------|---------|-------------|---------------|
| 8080 | HTTP | Main Application | Web UI and REST API | Public |
| 8080 | TCP | Actuator Endpoints | Health check and metrics | Public |

## URL Endpoints

### Web Interface
- **Dashboard**: http://localhost:8080/
- **Transaction Monitoring**: http://localhost:8080/#transactions
- **Risk Alerts**: http://localhost:8080/#alerts
- **Rule Engine**: http://localhost:8080/#rules
- **User Management**: http://localhost:8080/#users
- **Blacklist Management**: http://localhost:8080/#blacklist

### REST API Endpoints

#### Transactions
- GET    /api/transactions              - List transactions
- GET    /api/transactions/{id}         - Get transaction detail
- POST   /api/transactions              - Create transaction
- GET    /api/transactions/recent       - Recent transactions
- GET    /api/transactions/statistics   - Transaction statistics
- POST   /api/transactions/{id}/approve - Approve transaction
- POST   /api/transactions/{id}/reject  - Reject transaction
- POST   /api/transactions/{id}/intercept - Intercept transaction

#### Alerts
- GET    /api/alerts                    - List alerts
- GET    /api/alerts/{id}               - Get alert detail
- GET    /api/alerts/recent             - Recent alerts
- GET    /api/alerts/statistics         - Alert statistics
- POST   /api/alerts/{id}/handle        - Handle alert

#### Risk Rules
- GET    /api/rules                     - List all rules
- GET    /api/rules/{code}              - Get rule detail
- POST   /api/rules                     - Create rule
- PUT    /api/rules/{code}              - Update rule
- DELETE /api/rules/{code}              - Delete rule
- POST   /api/rules/{code}/enable       - Enable rule
- POST   /api/rules/{code}/disable      - Disable rule

#### Users
- GET    /api/users                     - List users
- GET    /api/users/{id}                - Get user detail
- POST   /api/users                     - Create user
- GET    /api/users/statistics          - User statistics
- POST   /api/users/{id}/freeze         - Freeze user
- POST   /api/users/{id}/unfreeze       - Unfreeze user
- PUT    /api/users/{id}/risk-level     - Update risk level

#### Blacklist
- GET    /api/blacklist                 - List blacklist items
- GET    /api/blacklist/check           - Check if item is blacklisted
- POST   /api/blacklist                 - Add to blacklist
- DELETE /api/blacklist                 - Remove from blacklist
- GET    /api/blacklist/count           - Get blacklist count

#### Dashboard
- GET    /api/dashboard/summary         - Dashboard summary
- GET    /api/dashboard/stream/status   - Stream processing status
- POST   /api/dashboard/stream/start    - Start stream processing
- POST   /api/dashboard/stream/stop     - Stop stream processing
- POST   /api/dashboard/mock/start      - Start mock transaction generator
- POST   /api/dashboard/mock/stop       - Stop mock transaction generator
- POST   /api/dashboard/mock/generate   - Generate mock transactions

#### Actuator (System Monitoring)
- GET    /actuator/health               - Health check
- GET    /actuator/info                 - Application info
- GET    /actuator/metrics              - Metrics

## Docker Deployment Ports (Optional)

If using optional middleware via Docker, these ports may be used:

| Port | Service | Description |
|------|---------|-------------|
| 9042 | Cassandra | Distributed database (optional) |
| 9200 | Elasticsearch | Search engine (optional) |
| 9300 | Elasticsearch | Transport port (optional) |
| 9870 | Hadoop HDFS | NameNode web UI (optional) |
| 8088 | Hadoop YARN | ResourceManager web UI (optional) |

## Database

SQLite database file location:
- `./data/fraud_guard.db`

No network port required for SQLite (file-based database).
