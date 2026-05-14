# CSBMS Project Structure

## 📁 Root Directory

```
CSBMS/
├── Frontend/                    # Next.js frontend application
├── Backend/                     # Spring Boot backend application
├── README.md                    # Main project documentation
├── PROJECT_FINALIZATION_SUMMARY.md  # Complete project overview
├── QUICK_START_GUIDE.md        # Quick start instructions
├── DEPLOYMENT_CHECKLIST.md     # Production deployment guide
└── PROJECT_STRUCTURE.md        # This file
```

---

## 📁 Frontend Structure

```
Frontend/
├── src/                        # Source code
│   ├── app/                    # Next.js app directory
│   ├── components/             # Reusable React components
│   ├── contexts/               # React contexts (Auth, Language, etc.)
│   ├── hooks/                  # Custom React hooks
│   ├── lib/                    # Utility libraries
│   ├── locales/                # Internationalization files
│   ├── types/                  # TypeScript type definitions
│   └── views/                  # Page components
│       ├── admin/              # Admin pages
│       ├── bookings/           # Booking management
│       ├── maintenance/        # Maintenance management
│       ├── projects/           # Project management
│       ├── supervisor/         # Supervisor dashboard
│       └── user/               # User pages
│
├── public/                     # Static assets
├── docs/                       # Documentation
│   ├── archive/                # Archived/outdated documentation
│   ├── FIXES_APPLIED.md        # Complete list of fixes
│   ├── FIX_*.md                # Individual fix documentation
│   ├── FRONTEND_API_INTEGRATION.md  # API integration guide
│   └── KEYCLOAK_DIVISION_STRUCTURE.md  # Division setup guide
│
├── .env.example                # Environment variables template
├── .env.keycloak               # Keycloak configuration
├── docker-compose.keycloak.yml # Keycloak Docker setup
├── keycloak-insa-realm-template.json  # Keycloak realm export
├── package.json                # Node.js dependencies
├── tsconfig.json               # TypeScript configuration
├── tailwind.config.ts          # Tailwind CSS configuration
├── next.config.mjs             # Next.js configuration
├── README.md                   # Frontend documentation
├── QUICK_START_GUIDE.md        # Quick start guide
├── PROJECT_FINALIZATION_SUMMARY.md  # Project summary
└── DEPLOYMENT_CHECKLIST.md     # Deployment checklist
```

---

## 📁 Backend Structure

```
Backend/
├── src/
│   └── main/
│       ├── java/com/org/cmbms/
│       │   ├── admin/          # Admin controllers & services
│       │   ├── auth/           # Authentication & security
│       │   ├── booking/        # Booking management
│       │   ├── common/         # Common utilities
│       │   ├── config/         # Configuration classes
│       │   ├── file/           # File management
│       │   ├── history/        # Request history tracking
│       │   ├── maintenance/    # Maintenance management
│       │   ├── notification/   # Notification system
│       │   ├── project/        # Project management
│       │   ├── report/         # Reporting & analytics
│       │   ├── user/           # User management
│       │   └── workflow/       # Workflow management
│       │
│       └── resources/
│           ├── application.properties  # Application configuration
│           └── static/         # Static resources
│
├── docs/                       # Documentation
│   ├── archive/                # Archived documentation
│   ├── sql/                    # SQL scripts
│   │   ├── CHECK_MAINTENANCE_STATUS.sql
│   │   ├── sample_requests_with_actual_ids.sql
│   │   └── *.sql
│   ├── FIX_DIVISION_FALLBACK.md
│   ├── FIX_INVALID_TRANSITION_MAINTENANCE.md
│   ├── KEYCLOAK_PROTOCOL_MAPPER_SETUP.md
│   └── SAMPLE_REQUESTS_GUIDE.md
│
├── uploads/                    # File uploads directory
├── pom.xml                     # Maven configuration
├── sample_requests.json        # Sample data (JSON)
├── README.md                   # Backend documentation
└── start-with-keycloak.sh      # Startup script
```

---

## 📚 Key Documentation Files

### Root Level
| File | Description |
|------|-------------|
| `README.md` | Main project documentation with overview, setup, and usage |
| `PROJECT_FINALIZATION_SUMMARY.md` | Complete project summary with all fixes and features |
| `QUICK_START_GUIDE.md` | Get started in 5 minutes |
| `DEPLOYMENT_CHECKLIST.md` | Production deployment checklist |
| `PROJECT_STRUCTURE.md` | This file - project structure overview |

### Frontend Documentation (`Frontend/docs/`)
| File | Description |
|------|-------------|
| `FIXES_APPLIED.md` | Complete list of all 17 fixes applied |
| `FIX_SUPERVISOR_DASHBOARD_COMPLETE.md` | Supervisor dashboard fixes |
| `FIX_DIVISION_ID_FRONTEND.md` | Division ID fetching from backend |
| `FIX_DIVISION_PROFESSIONAL_FILTER.md` | List page professional filtering |
| `FIX_DETAIL_PAGE_PROFESSIONAL_FILTER.md` | Detail page professional filtering |
| `FIX_APPROVED_TASKS_DISAPPEARING.md` | Approved tasks visibility |
| `FIX_CLOSED_TASKS_VISIBILITY.md` | Closed tasks visibility |
| `FIX_DUPLICATE_REACT_KEYS.md` | React duplicate key errors |
| `FIX_KEYCLOAK_PROFILE_ERROR.md` | Keycloak profile loading |
| `FRONTEND_API_INTEGRATION.md` | API integration guide |
| `KEYCLOAK_DIVISION_STRUCTURE.md` | Division setup and structure |

### Backend Documentation (`Backend/docs/`)
| File | Description |
|------|-------------|
| `FIX_DIVISION_FALLBACK.md` | Automatic division fetching from Keycloak |
| `FIX_INVALID_TRANSITION_MAINTENANCE.md` | Workflow transition fixes |
| `KEYCLOAK_PROTOCOL_MAPPER_SETUP.md` | Optional Keycloak configuration |
| `SAMPLE_REQUESTS_GUIDE.md` | Sample data loading guide |

### SQL Scripts (`Backend/docs/sql/`)
| File | Description |
|------|-------------|
| `CHECK_MAINTENANCE_STATUS.sql` | Database status queries |
| `sample_requests_with_actual_ids.sql` | Sample data with IDs |
| `sample_requests.sql` | Basic sample data |
| `insert_divisions.sql` | Division setup |
| `cleanup_failed_migration.sql` | Migration cleanup |

---

## 🗂️ Archived Documentation

Outdated and superseded documentation has been moved to:
- `Frontend/docs/archive/` - 21 archived files
- `Backend/docs/archive/` - 11 archived files

These files are kept for historical reference but are no longer current.

---

## 🔧 Configuration Files

### Frontend
- `.env.example` - Environment variables template
- `.env.keycloak` - Keycloak-specific configuration
- `.env.local` - Local development configuration (not in git)
- `next.config.mjs` - Next.js configuration
- `tailwind.config.ts` - Tailwind CSS configuration
- `tsconfig.json` - TypeScript configuration
- `package.json` - Node.js dependencies

### Backend
- `application.properties` - Spring Boot configuration
- `pom.xml` - Maven dependencies and build configuration
- `.env` - Environment variables (not in git)

### Keycloak
- `docker-compose.keycloak.yml` - Keycloak Docker setup
- `keycloak-insa-realm-template.json` - Realm configuration export

---

## 📦 Build Artifacts

### Frontend
- `.next/` - Next.js build output (gitignored)
- `node_modules/` - Node.js dependencies (gitignored)

### Backend
- `target/` - Maven build output (gitignored)
- `uploads/` - User uploaded files (gitignored)

---

## 🚀 Quick Navigation

### To Start Development:
1. Read `QUICK_START_GUIDE.md`
2. Check `Frontend/README.md` and `Backend/README.md`
3. Review `PROJECT_FINALIZATION_SUMMARY.md` for complete overview

### To Deploy to Production:
1. Follow `DEPLOYMENT_CHECKLIST.md`
2. Review security considerations in `PROJECT_FINALIZATION_SUMMARY.md`
3. Check environment-specific configuration

### To Understand Fixes:
1. Start with `Frontend/docs/FIXES_APPLIED.md` for complete list
2. Read individual `FIX_*.md` files for detailed explanations
3. Check archived docs for historical context

### To Load Sample Data:
1. Read `Backend/docs/SAMPLE_REQUESTS_GUIDE.md`
2. Use SQL scripts in `Backend/docs/sql/`
3. Or use `sample_requests.json` for API import

---

## 📊 Project Statistics

- **Total Files:** 200+
- **Source Files:** 150+
- **Documentation Files:** 30+ (active)
- **Archived Documentation:** 32 files
- **SQL Scripts:** 5 files
- **Configuration Files:** 10+

---

## 🎯 Project Status

**Version:** 1.0.0  
**Status:** ✅ PRODUCTION READY  
**Last Updated:** May 3, 2026

**Documentation Status:**
- ✅ All fixes documented
- ✅ API integration documented
- ✅ Deployment guide complete
- ✅ Quick start guide available
- ✅ Project structure organized
- ✅ Outdated docs archived

---

## 📝 Notes

- All documentation is in Markdown format
- Archived files are kept for historical reference
- SQL scripts are organized in `Backend/docs/sql/`
- Configuration templates are provided (`.env.example`)
- Sensitive files are gitignored (`.env`, `node_modules/`, etc.)

For more information, see the main `README.md` file.
