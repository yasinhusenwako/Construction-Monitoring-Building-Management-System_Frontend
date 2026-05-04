# CSBMS Deployment Checklist

## Pre-Deployment Verification

### ✅ Code Quality
- [ ] All fixes applied and tested
- [ ] No console errors in browser
- [ ] No compilation warnings
- [ ] Code reviewed and approved
- [ ] Documentation complete

### ✅ Testing
- [ ] All user roles tested
- [ ] All workflows validated
- [ ] Division isolation verified
- [ ] Professional filtering confirmed
- [ ] Status transitions working
- [ ] Edge cases handled

### ✅ Security
- [ ] All default passwords changed
- [ ] Keycloak admin password updated
- [ ] Database password secured
- [ ] JWT secret keys rotated
- [ ] CORS configured properly
- [ ] HTTPS enabled
- [ ] Security headers configured

### ✅ Database
- [ ] Database created
- [ ] Tables created (auto by Spring Boot)
- [ ] Sample data loaded (optional)
- [ ] Indexes optimized
- [ ] Backup configured
- [ ] Connection pooling configured

### ✅ Keycloak
- [ ] Keycloak running
- [ ] INSA realm imported
- [ ] All users created
- [ ] divisionId attributes set
- [ ] Roles assigned correctly
- [ ] Client configured
- [ ] Realm exported for backup

---

## Deployment Steps

### Step 1: Prepare Environment
```bash
# Create deployment directory
mkdir -p /opt/csbms
cd /opt/csbms

# Clone repository
git clone <repository-url> .

# Create environment files
cp Frontend/.env.example Frontend/.env.production
cp Backend/src/main/resources/application.properties.example Backend/src/main/resources/application.properties
```

### Step 2: Configure Database
```sql
-- Create database
CREATE DATABASE cmbms;

-- Create user
CREATE USER csbms_user WITH PASSWORD 'secure_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE csbms TO csbms_user;
```

### Step 3: Deploy Keycloak
```bash
# Start Keycloak
cd Frontend
docker-compose -f docker-compose.keycloak.yml up -d

# Wait for startup
sleep 30

# Import realm
# Access http://your-domain:8090
# Login as admin
# Import keycloak-insa-realm-template.json
```

### Step 4: Deploy Backend
```bash
cd Backend

# Update application.properties
nano src/main/resources/application.properties

# Build
./mvnw clean package -DskipTests

# Run
java -jar target/cmbms-backend-1.0.0.jar

# Or use systemd service
sudo cp csbms-backend.service /etc/systemd/system/
sudo systemctl enable csbms-backend
sudo systemctl start csbms-backend
```

### Step 5: Deploy Frontend
```bash
cd Frontend

# Install dependencies
npm ci --production

# Build
npm run build

# Start
npm run start

# Or use PM2
pm2 start npm --name "csbms-frontend" -- start
pm2 save
pm2 startup
```

### Step 6: Configure Reverse Proxy (Nginx)
```nginx
# /etc/nginx/sites-available/csbms
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8081;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Keycloak
    location /auth {
        proxy_pass http://localhost:8090;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Step 7: Enable HTTPS
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Post-Deployment Verification

### ✅ Service Health
- [ ] Frontend accessible at https://your-domain.com
- [ ] Backend API responding at https://your-domain.com/api/actuator/health
- [ ] Keycloak accessible at https://your-domain.com/auth
- [ ] Database connections working
- [ ] All services auto-start on reboot

### ✅ Functionality Testing
- [ ] Login with all user roles
- [ ] Create project request
- [ ] Create booking request
- [ ] Create maintenance request
- [ ] Assign to division
- [ ] Create work order
- [ ] Complete workflow
- [ ] Export reports

### ✅ Performance
- [ ] Page load time < 3 seconds
- [ ] API response time < 500ms
- [ ] Database queries optimized
- [ ] No memory leaks
- [ ] CPU usage normal

### ✅ Security
- [ ] HTTPS working
- [ ] Security headers present
- [ ] CORS configured
- [ ] Authentication required
- [ ] Authorization enforced
- [ ] Division isolation working

### ✅ Monitoring
- [ ] Application logs configured
- [ ] Error tracking enabled
- [ ] Performance monitoring active
- [ ] Database monitoring setup
- [ ] Alerts configured
- [ ] Backup running

---

## Rollback Plan

### If Deployment Fails

1. **Stop New Services**
```bash
sudo systemctl stop csbms-backend
pm2 stop csbms-frontend
```

2. **Restore Database**
```bash
psql -U postgres -d cmbms < backup.sql
```

3. **Restore Previous Version**
```bash
git checkout previous-version
./deploy.sh
```

4. **Verify Rollback**
- [ ] Services running
- [ ] Data intact
- [ ] Users can login
- [ ] Workflows working

---

## Maintenance Tasks

### Daily
- [ ] Check service status
- [ ] Review error logs
- [ ] Monitor disk space
- [ ] Check backup completion

### Weekly
- [ ] Review performance metrics
- [ ] Check security logs
- [ ] Update dependencies (if needed)
- [ ] Test backup restoration

### Monthly
- [ ] Security audit
- [ ] Performance optimization
- [ ] Database maintenance
- [ ] Update documentation

---

## Emergency Contacts

**System Administrator:** [Name] - [Email] - [Phone]
**Database Administrator:** [Name] - [Email] - [Phone]
**Security Team:** [Email] - [Phone]
**Support Team:** [Email] - [Phone]

---

## Backup & Recovery

### Backup Schedule
- **Database:** Daily at 2 AM
- **Application Files:** Weekly
- **Keycloak Realm:** After each change
- **Logs:** Retained for 30 days

### Backup Locations
- **Primary:** /backup/csbms/
- **Secondary:** Remote backup server
- **Cloud:** [Cloud provider]

### Recovery Time Objective (RTO)
- **Critical:** 1 hour
- **High:** 4 hours
- **Medium:** 24 hours

### Recovery Point Objective (RPO)
- **Database:** 24 hours
- **Files:** 7 days

---

## Success Criteria

### Deployment Successful When:
- ✅ All services running
- ✅ All tests passing
- ✅ No critical errors
- ✅ Users can login
- ✅ Workflows complete
- ✅ Performance acceptable
- ✅ Security verified
- ✅ Monitoring active
- ✅ Backups working
- ✅ Documentation updated

---

## Sign-Off

**Deployed By:** _________________ Date: _________

**Verified By:** _________________ Date: _________

**Approved By:** _________________ Date: _________

---

**Deployment Status:** ⬜ Pending | ⬜ In Progress | ⬜ Complete | ⬜ Failed

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
