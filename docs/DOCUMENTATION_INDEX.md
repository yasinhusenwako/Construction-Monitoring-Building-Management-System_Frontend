# CSBMS Documentation Index

Quick reference guide to all project documentation.

---

## 🚀 Getting Started

| Document | Location | Description |
|----------|----------|-------------|
| **Main README** | `README.md` | Project overview, setup, and usage |
| **Quick Start Guide** | `QUICK_START_GUIDE.md` | Get started in 5 minutes |
| **Project Structure** | `PROJECT_STRUCTURE.md` | Complete project structure |

---

## 📋 Project Management

| Document | Location | Description |
|----------|----------|-------------|
| **Project Finalization** | `PROJECT_FINALIZATION_SUMMARY.md` | Complete project summary with all fixes |
| **Deployment Checklist** | `DEPLOYMENT_CHECKLIST.md` | Production deployment guide |
| **Cleanup Summary** | `CLEANUP_SUMMARY.md` | Documentation organization summary |

---

## 🔧 Frontend Documentation

### Main Documentation
| Document | Location | Description |
|----------|----------|-------------|
| **Frontend README** | `Frontend/README.md` | Frontend-specific documentation |
| **All Fixes** | `Frontend/docs/FIXES_APPLIED.md` | Complete list of 17 fixes |
| **API Integration** | `Frontend/docs/FRONTEND_API_INTEGRATION.md` | API integration guide |
| **Division Structure** | `Frontend/docs/KEYCLOAK_DIVISION_STRUCTURE.md` | Division setup guide |

### Fix Documentation
| Document | Location | Description |
|----------|----------|-------------|
| **Supervisor Dashboard** | `Frontend/docs/FIX_SUPERVISOR_DASHBOARD_COMPLETE.md` | Dashboard fixes |
| **Division ID Frontend** | `Frontend/docs/FIX_DIVISION_ID_FRONTEND.md` | Division ID fetching |
| **Professional Filter (List)** | `Frontend/docs/FIX_DIVISION_PROFESSIONAL_FILTER.md` | List page filtering |
| **Professional Filter (Detail)** | `Frontend/docs/FIX_DETAIL_PAGE_PROFESSIONAL_FILTER.md` | Detail page filtering |
| **Approved Tasks** | `Frontend/docs/FIX_APPROVED_TASKS_DISAPPEARING.md` | Approved tasks visibility |
| **Closed Tasks** | `Frontend/docs/FIX_CLOSED_TASKS_VISIBILITY.md` | Closed tasks visibility |
| **React Keys** | `Frontend/docs/FIX_DUPLICATE_REACT_KEYS.md` | Duplicate key errors |
| **Keycloak Profile** | `Frontend/docs/FIX_KEYCLOAK_PROFILE_ERROR.md` | Profile loading fix |

---

## 🔧 Backend Documentation

### Main Documentation
| Document | Location | Description |
|----------|----------|-------------|
| **Backend README** | `Backend/README.md` | Backend-specific documentation |
| **Sample Requests Guide** | `Backend/docs/SAMPLE_REQUESTS_GUIDE.md` | Sample data loading |

### Fix Documentation
| Document | Location | Description |
|----------|----------|-------------|
| **Division Fallback** | `Backend/docs/FIX_DIVISION_FALLBACK.md` | Automatic division fetching |
| **Invalid Transition** | `Backend/docs/FIX_INVALID_TRANSITION_MAINTENANCE.md` | Workflow transitions |
| **Protocol Mapper** | `Backend/docs/KEYCLOAK_PROTOCOL_MAPPER_SETUP.md` | Optional Keycloak config |

### SQL Scripts
| Script | Location | Description |
|--------|----------|-------------|
| **Status Check** | `Backend/docs/sql/CHECK_MAINTENANCE_STATUS.sql` | Database status queries |
| **Sample Data (IDs)** | `Backend/docs/sql/sample_requests_with_actual_ids.sql` | Sample data with IDs |
| **Sample Data (Basic)** | `Backend/docs/sql/sample_requests.sql` | Basic sample data |
| **Insert Divisions** | `Backend/docs/sql/insert_divisions.sql` | Division setup |
| **Cleanup Migration** | `Backend/docs/sql/cleanup_failed_migration.sql` | Migration cleanup |

---

## 📦 Configuration Files

### Frontend
| File | Location | Description |
|------|----------|-------------|
| **Environment Template** | `Frontend/.env.example` | Environment variables template |
| **Keycloak Config** | `Frontend/.env.keycloak` | Keycloak configuration |
| **Docker Compose** | `Frontend/docker-compose.keycloak.yml` | Keycloak Docker setup |
| **Realm Template** | `Frontend/keycloak-insa-realm-template.json` | Keycloak realm export |
| **Next.js Config** | `Frontend/next.config.mjs` | Next.js configuration |
| **TypeScript Config** | `Frontend/tsconfig.json` | TypeScript configuration |
| **Tailwind Config** | `Frontend/tailwind.config.ts` | Tailwind CSS configuration |

### Backend
| File | Location | Description |
|------|----------|-------------|
| **Application Config** | `Backend/src/main/resources/application.properties` | Spring Boot configuration |
| **Maven Config** | `Backend/pom.xml` | Maven dependencies |
| **Sample Data (JSON)** | `Backend/sample_requests.json` | Sample data in JSON |

---

## 🗂️ Archived Documentation

### Frontend Archive
**Location:** `Frontend/docs/archive/`
- 21 archived files
- Historical reference only
- Superseded by current documentation

### Backend Archive
**Location:** `Backend/docs/archive/`
- 11 archived files
- Historical reference only
- Superseded by current documentation

---

## 🎯 Quick Navigation by Task

### I want to...

#### **Set up the project**
1. Read `README.md`
2. Follow `QUICK_START_GUIDE.md`
3. Check `Frontend/README.md` and `Backend/README.md`

#### **Deploy to production**
1. Follow `DEPLOYMENT_CHECKLIST.md`
2. Review `PROJECT_FINALIZATION_SUMMARY.md`
3. Check environment configuration

#### **Understand a specific fix**
1. Check `Frontend/docs/FIXES_APPLIED.md` for list
2. Read specific `FIX_*.md` file
3. Review related code changes

#### **Load sample data**
1. Read `Backend/docs/SAMPLE_REQUESTS_GUIDE.md`
2. Use SQL scripts in `Backend/docs/sql/`
3. Or use `Backend/sample_requests.json`

#### **Configure Keycloak**
1. Read `Frontend/docs/KEYCLOAK_DIVISION_STRUCTURE.md`
2. Import `Frontend/keycloak-insa-realm-template.json`
3. Optionally follow `Backend/docs/KEYCLOAK_PROTOCOL_MAPPER_SETUP.md`

#### **Integrate with API**
1. Read `Frontend/docs/FRONTEND_API_INTEGRATION.md`
2. Check `Backend/README.md` for endpoints
3. Review `Backend/sample_requests.json` for examples

#### **Troubleshoot issues**
1. Check relevant `FIX_*.md` files
2. Review `PROJECT_FINALIZATION_SUMMARY.md` troubleshooting section
3. Check archived docs for historical context

---

## 📊 Documentation Statistics

| Category | Count |
|----------|-------|
| **Root Documents** | 6 files |
| **Frontend Active Docs** | 11 files |
| **Backend Active Docs** | 4 files |
| **SQL Scripts** | 5 files |
| **Configuration Files** | 10+ files |
| **Archived Docs** | 32 files |
| **Total Documentation** | 68+ files |

---

## 🔍 Search Tips

### By Topic
- **Authentication:** Search for "Keycloak", "auth", "login"
- **Division:** Search for "division", "DIV-", "isolation"
- **Workflow:** Search for "workflow", "transition", "status"
- **Professional:** Search for "professional", "filter", "assign"
- **Supervisor:** Search for "supervisor", "dashboard", "tasks"

### By File Type
- **Fixes:** Look in `Frontend/docs/FIX_*.md` or `Backend/docs/FIX_*.md`
- **Setup:** Look for `README.md`, `QUICK_START_GUIDE.md`
- **SQL:** Look in `Backend/docs/sql/`
- **Config:** Look for `.env`, `.json`, `.properties` files

---

## 📝 Documentation Maintenance

### Adding New Documentation
1. Create file in appropriate `docs/` directory
2. Update this index
3. Update `PROJECT_STRUCTURE.md`
4. Link from relevant README files

### Archiving Documentation
1. Move to appropriate `docs/archive/` directory
2. Update this index
3. Update `CLEANUP_SUMMARY.md`
4. Remove from main navigation

### Updating Documentation
1. Update the relevant file
2. Update last modified date
3. Update version if applicable
4. Notify team of changes

---

## ✅ Documentation Quality

All documentation includes:
- ✅ Clear titles and descriptions
- ✅ Table of contents (for long docs)
- ✅ Code examples where applicable
- ✅ Testing instructions
- ✅ Related documentation links
- ✅ Status indicators
- ✅ Last updated dates

---

## 🎉 Documentation Status

**Status:** ✅ COMPLETE & ORGANIZED  
**Last Updated:** May 3, 2026  
**Version:** 1.0.0

**Coverage:**
- ✅ All fixes documented
- ✅ All features documented
- ✅ Setup guides complete
- ✅ Deployment guides complete
- ✅ API documentation complete
- ✅ Configuration documented
- ✅ Troubleshooting guides available

---

**For the most up-to-date information, always check the main `README.md` file.**
