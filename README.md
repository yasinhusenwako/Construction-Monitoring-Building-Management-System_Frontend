# Construction Supervision and Building Management System (CSBMS)

A comprehensive web-based system for managing construction projects, facility bookings, and maintenance requests with role-based access control and division-based workflow management.

## 🎯 Project Overview

CSBMS is an enterprise-grade management system designed for organizations with multiple divisions handling various types of requests:
- **Capital Projects** - Large construction and renovation projects
- **Facility Bookings** - Office allocations and conference hall reservations
- **Maintenance Requests** - Routine and urgent repairs across divisions

## 🏗️ Architecture

### Technology Stack
- **Frontend:** Next.js 16.2.4, React 19, TypeScript, Tailwind CSS
- **Backend:** Spring Boot 3.4.1, Java 21, Spring Security
- **Authentication:** Keycloak 26.0.7 (OAuth 2.0 / OpenID Connect)
- **Database:** PostgreSQL 18.3
- **Build Tools:** Maven (Backend), npm (Frontend)

### System Architecture
```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend  │────▶│   Backend   │────▶│  PostgreSQL │
│  (Next.js)  │     │(Spring Boot)│     │  Database   │
└─────────────┘     └─────────────┘     └─────────────┘
       │                    │
       │                    │
       └────────────────────┴──────────▶┌─────────────┐
                                        │  Keycloak   │
                                        │    Auth     │
                                        └─────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Java 21
- PostgreSQL 18.3
- Docker (for Keycloak)

### Installation

1. **Clone Repository**
```bash
git clone <repository-url>
cd CSBMS
```

2. **Start Keycloak**
```bash
cd Frontend
docker-compose -f docker-compose.keycloak.yml up -d
```

3. **Setup Database**
```sql
CREATE DATABASE cmbms;
```

4. **Start Backend**
```bash
cd Backend
./mvnw spring-boot:run
```

5. **Start Frontend**
```bash
cd Frontend
npm install
npm run dev
```

6. **Access System**
- Frontend: http://localhost:3000
- Backend: http://localhost:8081
- Keycloak: http://localhost:8090

### Default Credentials
```
Admin:        admin@gmail.com / Admin@123
User:         user@gmail.com / User@123
Supervisor:   director1@gmail.com / Supervisor@123
Professional: professional1@gmail.com / Professional@123
```

## 📖 Documentation

### Quick References
- **[Quick Start Guide](QUICK_START_GUIDE.md)** - Get started in 5 minutes
- **[Project Finalization Summary](PROJECT_FINALIZATION_SUMMARY.md)** - Complete project overview
- **[Fixes Applied](Frontend/FIXES_APPLIED.md)** - All fixes and improvements

### Technical Documentation
- **Frontend Documentation:** `Frontend/` directory
- **Backend Documentation:** `Backend/` directory
- **API Integration:** `Frontend/FRONTEND_API_INTEGRATION.md`
- **Division Setup:** `Frontend/KEYCLOAK_DIVISION_STRUCTURE.md`

## 👥 User Roles

### Admin
- Manage all requests across all divisions
- Assign projects/bookings to admin professionals
- Assign maintenance to divisions
- Approve/reject/close requests
- Manage users and system settings

### User
- Submit project, booking, and maintenance requests
- View and track own requests
- Edit submitted requests
- Delete closed requests

### Supervisor (Division Director)
- View division-specific maintenance requests
- Create work orders
- Assign tasks to division professionals
- Review completed work
- Submit completion reports to admin

### Professional
- View assigned tasks
- Start and complete work
- Update task progress
- Submit completion reports

## 🏢 Division Structure

```
┌─────────────────────────────────────────────────────────┐
│                    INSA Organization                     │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Division 0 (Admin) - Projects & Bookings               │
│  ├── Professional: professional@gmail.com               │
│  └── Handles: Capital Projects, Facility Bookings       │
│                                                          │
│  Division 1 (DIV-001) - Power Supply Division           │
│  ├── Supervisor: director1@gmail.com                    │
│  ├── Professional: professional1@gmail.com              │
│  └── Handles: Electrical maintenance                    │
│                                                          │
│  Division 2 (DIV-002) - Facility Administration         │
│  ├── Supervisor: director2@gmail.com                    │
│  ├── Professional: professional2@gmail.com              │
│  └── Handles: Facility maintenance                      │
│                                                          │
│  Division 3 (DIV-003) - Infrastructure Development      │
│  ├── Supervisor: director3@gmail.com                    │
│  ├── Professional: professional3@gmail.com              │
│  └── Handles: Building & infrastructure maintenance     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Workflows

### Project Workflow
```
USER submits → ADMIN reviews → ADMIN assigns to PROFESSIONAL 
→ PROFESSIONAL completes → ADMIN approves → ADMIN closes
```

### Booking Workflow
```
USER submits → ADMIN reviews → ADMIN assigns to PROFESSIONAL 
→ PROFESSIONAL processes → ADMIN approves → ADMIN closes
```

### Maintenance Workflow
```
USER submits → ADMIN assigns to DIVISION → SUPERVISOR creates work order 
→ SUPERVISOR assigns to PROFESSIONAL → PROFESSIONAL completes 
→ SUPERVISOR reviews → ADMIN approves → ADMIN closes
```

## ✨ Key Features

### Security
- ✅ Keycloak OAuth 2.0 / OpenID Connect authentication
- ✅ Role-based access control (RBAC)
- ✅ Division-based data isolation
- ✅ JWT token authentication
- ✅ Secure password policies

### Division Management
- ✅ Strict division isolation for supervisors
- ✅ Division-specific professional assignment
- ✅ Cross-division visibility for admins
- ✅ Automatic division detection from Keycloak

### Workflow Management
- ✅ Multi-stage approval workflows
- ✅ Status transition validation
- ✅ Activity timeline tracking
- ✅ Automated notifications
- ✅ Work order management

### User Experience
- ✅ Responsive design (desktop & tablet)
- ✅ Real-time status updates
- ✅ Advanced filtering and search
- ✅ Export to CSV
- ✅ Multi-language support (English, Amharic)

## 🧪 Testing

### Run Tests
```bash
# Backend tests
cd Backend
./mvnw test

# Frontend tests
cd Frontend
npm test
```

### Testing Checklist
See `PROJECT_FINALIZATION_SUMMARY.md` for complete testing checklist.

## 📊 Project Statistics

- **Total Fixes:** 16 (7 Backend, 9 Frontend)
- **Files Modified:** 25+
- **Lines of Code:** 2000+
- **Documentation Files:** 15+
- **Development Time:** 3 sessions
- **Status:** ✅ Production Ready

## 🔧 Configuration

### Environment Variables

**Backend** (`Backend/src/main/resources/application.properties`):
```properties
spring.datasource.url=jdbc:postgresql://localhost:5432/cmbms
spring.datasource.username=postgres
spring.datasource.password=your_password
keycloak.auth-server-url=http://localhost:8090
```

**Frontend** (`Frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:8081
NEXT_PUBLIC_KEYCLOAK_URL=http://localhost:8090
NEXT_PUBLIC_KEYCLOAK_REALM=buildms
NEXT_PUBLIC_KEYCLOAK_CLIENT_ID=buildms-frontend
```

## 🚢 Deployment

### Production Deployment
See `PROJECT_FINALIZATION_SUMMARY.md` for detailed deployment instructions including:
- Security hardening
- Performance optimization
- Monitoring setup
- Backup procedures

### Docker Deployment (Coming Soon)
```bash
docker-compose up -d
```

## 🐛 Troubleshooting

### Common Issues

**Issue:** Can't login
- **Solution:** Verify Keycloak is running on port 8090

**Issue:** No tasks showing in supervisor dashboard
- **Solution:** Hard refresh browser (Ctrl+Shift+R), verify divisionId

**Issue:** Wrong professionals in dropdown
- **Solution:** Check user's divisionId matches professional's divisionId

**Issue:** "Division not set" error
- **Solution:** Verify user has divisionId attribute in Keycloak

For more troubleshooting, see `PROJECT_FINALIZATION_SUMMARY.md`.

## 📝 License

[Your License Here]

## 👨‍💻 Contributors

[Your Team Here]

## 📞 Support

For issues and questions:
- Check documentation in `Frontend/` and `Backend/` directories
- Review `PROJECT_FINALIZATION_SUMMARY.md`
- Contact system administrator

---

## 🎉 Project Status

**Version:** 1.0.0  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** May 3, 2026

**All Critical Issues Resolved:**
- ✅ Authentication & Authorization
- ✅ Division Isolation
- ✅ Workflow Management
- ✅ Professional Filtering
- ✅ Dashboard Functionality
- ✅ Status Visibility

**Ready for Production Deployment!**
