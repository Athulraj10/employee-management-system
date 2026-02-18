# Enterprise Employee Management & Performance System (EMS/PMS)

A full-stack, production-ready Employee Management System with an advanced Performance & Analytics Dashboard.

## 🏗️ Architecture

### Backend
- **Technology**: Node.js, TypeScript, Express, TypeORM, PostgreSQL
- **Architecture**: Modular design with separate EMS and PMS modules
- **Security**: Environment-based encryption for performance data (prod vs dev)
- **API Documentation**: Swagger/OpenAPI at `/docs`

### Frontend
- **Technology**: React, TypeScript, Modern UI framework
- **Features**: Admin dashboard, employee management, performance analytics

## 📋 Features

### Employee Management System (EMS)
- ✅ Complete employee lifecycle management (CRUD)
- ✅ Multi-category support (Frontend, Backend, Full Stack, Mobile, DevOps, QA, Data/AI)
- ✅ Skill & category-wise experience tracking
- ✅ Project history & assignment tracking
- ✅ Date-wise employee timeline view
- ✅ Audit logging for all changes
- ✅ Admin views with filters, search, and CSV export

### Performance Management System (PMS)
- ✅ Performance tracking with configurable metrics
- ✅ Time-based performance analytics (daily, monthly, quarterly, yearly)
- ✅ Individual employee performance views
- ✅ Admin dashboard with team analytics
- ✅ Employee dashboard with personal metrics
- ✅ Configuration-driven performance engine
- ✅ **Environment-based encryption** (prod = encrypted, dev = plain)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm/yarn
- PostgreSQL 14+
- Git

### Backend Setup

1. **Install dependencies**:
```bash
cd backend
npm install
```

2. **Configure environment**:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. **Set up database**:
```bash
# Create PostgreSQL database
createdb ems_pms

# Or using psql:
psql -U postgres -c "CREATE DATABASE ems_pms;"
```

4. **Generate encryption key** (for production):
```bash
openssl rand -base64 32
# Add to .env as PERF_ENC_KEY
```

5. **Run migrations** (in dev, TypeORM auto-syncs):
```bash
npm run dev
```

6. **Start server**:
```bash
npm run dev
# Server runs on http://localhost:4000
# API docs at http://localhost:4000/docs
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## 🔐 Security Configuration

### Environment-Based Encryption

The system automatically encrypts all performance-related data in production:

- **Development (`APP_ENV=dev`)**: Data stored in plain format for easy debugging
- **Production (`APP_ENV=prod`)**: All performance data encrypted using AES-256-GCM

**Performance data includes**:
- Performance snapshots (scores, ratings)
- Performance metrics
- Performance summaries
- Performance configuration values

**Security guarantees**:
- DevOps cannot read encrypted performance data in production
- Encryption is reversible only within backend services
- Database structure, dates, and IDs remain indexable
- Analytics work by decrypting data in-memory

## 📚 API Endpoints

### EMS Endpoints

#### Employees
- `POST /api/ems/employees` - Create employee
- `GET /api/ems/employees` - List employees (with filters)
- `GET /api/ems/employees/:id` - Get employee details
- `PUT /api/ems/employees/:id` - Update employee
- `POST /api/ems/employees/:id/activate` - Activate employee
- `POST /api/ems/employees/:id/deactivate` - Deactivate employee

#### Projects
- `POST /api/ems/projects` - Create project
- `GET /api/ems/projects` - List projects
- `GET /api/ems/projects/:id` - Get project details
- `PUT /api/ems/projects/:id` - Update project
- `POST /api/ems/projects/assign` - Assign employee to project
- `PUT /api/ems/projects/assignments/:id` - Update assignment
- `GET /api/ems/projects/:projectId/employees` - Get project employees

#### Experience & Timeline
- `POST /api/ems/experience` - Create experience entry
- `GET /api/ems/employees/:employeeId/experience` - Get employee experience
- `PUT /api/ems/experience/:id` - Update experience
- `DELETE /api/ems/experience/:id` - Delete experience
- `GET /api/ems/employees/:employeeId/timeline` - Get employee timeline
- `GET /api/ems/employees/:employeeId/timeline/grouped` - Get grouped timeline

#### Admin
- `GET /api/ems/admin/dashboard` - Dashboard statistics
- `GET /api/ems/admin/categories/:categoryId/employees` - Employees by category
- `GET /api/ems/admin/projects/:projectId/employees` - Project employees
- `GET /api/ems/admin/audit-logs` - Audit logs
- `GET /api/ems/admin/export/employees` - Export employees CSV

### PMS Endpoints

#### Performance Snapshots
- `POST /api/pms/snapshots` - Create snapshot
- `GET /api/pms/snapshots/:id` - Get snapshot
- `GET /api/pms/employees/:employeeId/snapshots` - Get employee snapshots

#### Performance Metrics
- `POST /api/pms/metrics` - Create metric
- `GET /api/pms/employees/:employeeId/metrics` - Get employee metrics

#### Performance Summaries
- `POST /api/pms/summaries` - Create/update summary
- `GET /api/pms/employees/:employeeId/summaries` - Get employee summaries
- `GET /api/pms/employees/:employeeId/summary` - Get specific summary

#### Analytics
- `GET /api/pms/employees/:employeeId/overview` - Employee performance overview
- `GET /api/pms/employees/:employeeId/trend` - Performance trend
- `GET /api/pms/employees/:employeeId/category-contribution` - Category contribution
- `GET /api/pms/employees/:employeeId/project-time` - Time spent per project
- `GET /api/pms/employees/:employeeId/skill-growth` - Skill growth over time
- `GET /api/pms/admin/dashboard-analytics` - Admin dashboard analytics

#### Configuration
- `GET /api/pms/config` - Get all configs
- `GET /api/pms/config/:key` - Get config by key
- `PUT /api/pms/config/:key` - Set config
- `DELETE /api/pms/config/:key` - Delete config

## 🗄️ Database Schema

### EMS Tables
- `employees` - Employee profiles
- `employee_categories` - Category definitions
- `employee_category_mappings` - Employee-category relationships
- `skills` - Skill definitions
- `employee_skills` - Employee-skill relationships
- `projects` - Project definitions
- `employee_projects` - Employee-project assignments
- `experience_history` - Category-wise experience tracking
- `audit_logs` - Change audit trail

### PMS Tables
- `performance_snapshots` - Time-based performance snapshots
- `performance_metrics` - Individual performance metrics
- `employee_performance_summaries` - Aggregated performance summaries
- `performance_config` - Performance configuration (encrypted in prod)
- `time_series_indexes` - Time-series indexing for analytics

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `APP_ENV` | Environment (dev/prod/test) | `dev` | No |
| `PORT` | Server port | `4000` | No |
| `CORS_ORIGIN` | CORS allowed origin | `*` | No |
| `DB_HOST` | Database host | `localhost` | No |
| `DB_PORT` | Database port | `5432` | No |
| `DB_USER` | Database user | `postgres` | No |
| `DB_PASSWORD` | Database password | `postgres` | No |
| `DB_NAME` | Database name | `ems_pms` | No |
| `PERF_ENC_KEY` | Performance encryption key (base64) | - | Yes (prod) |
| `TYPEORM_LOGGING` | Enable TypeORM logging | `false` | No |

## 🧪 Development

### Running in Development Mode
```bash
# Backend
cd backend
npm run dev

# Frontend
cd frontend
npm run dev
```

### Building for Production
```bash
# Backend
cd backend
npm run build
npm start

# Frontend
cd frontend
npm run build
npm start
```

## 📈 Future Extensions

The system is designed to be easily extensible for:
- Attendance management
- Payroll integration
- Performance review workflows
- Leave management
- Training & certification tracking
- Goal setting & OKRs

## 📝 License

[Your License Here]

## 🤝 Contributing

[Contributing Guidelines]

