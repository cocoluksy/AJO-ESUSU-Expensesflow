# Deployment Guide - Render

This guide provides step-by-step instructions for deploying the Expense Management Application to Render.

## Prerequisites

1. GitHub account with code pushed to repository
2. Render account (https://render.com)
3. PostgreSQL database (Render or external)

## Backend Deployment (Express API)

### Step 1: Prepare Repository

```bash
# Ensure all code is committed
git add .
git commit -m "Ready for production deployment"
git push origin main
```

### Step 2: Create Backend Service on Render

1. Log in to Render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure as follows:

   **Service Settings**:
   - Name: `expense-management-api`
   - Environment: `Node`
   - Region: Choose closest to you
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm start`
   - Instance Type: `Free` (or select based on needs)

### Step 3: Set Environment Variables

In Render dashboard, go to your service → "Environment":

```
NODE_ENV=production
PORT=5000
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=expense_management_prod
JWT_SECRET=generate_secure_random_string_32_chars_minimum
ALLOWED_ORIGINS=https://your-frontend-url.onrender.com
```

**To generate a secure JWT_SECRET**:
```bash
# On your local machine:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Step 4: Connect Database

#### Option A: Use Render's PostgreSQL

1. Click "New +" → "PostgreSQL"
2. Name it: `expense-management-db`
3. Region: Same as API service
4. PostgreSQL Version: 13 or higher
5. Copy connection string
6. Update `DB_*` variables in API environment

#### Option B: Use External PostgreSQL

1. Get connection string from your provider
2. Update `DB_*` environment variables accordingly

### Step 5: Deploy

1. Click "Deploy" button
2. Wait for build completion (3-5 minutes)
3. Check build logs for errors
4. Once deployed, you'll get a service URL like:
   `https://expense-management-api.onrender.com`

### Step 6: Verify Deployment

```bash
# Test health check
curl https://expense-management-api.onrender.com/api/health

# Should return:
# {"success":true,"message":"Server is running","timestamp":"2024-01-01T00:00:00.000Z"}
```

## Frontend Deployment (React App)

### Step 1: Update API URL

Edit `frontend/.env`:
```
VITE_API_URL=https://expense-management-api.onrender.com/api
```

Push changes to GitHub:
```bash
git add .
git commit -m "Update API URL for production"
git push origin main
```

### Step 2: Create Frontend Service on Render

1. Log in to Render.com
2. Click "New +" → "Static Site"
3. Connect your GitHub repository (select frontend folder)
4. Configure as follows:

   **Service Settings**:
   - Name: `expense-management-frontend`
   - Region: Same as backend
   - Branch: `main`
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

### Step 3: Set Environment Variables

In Render dashboard → Environment:

```
VITE_API_URL=https://your-backend-service.onrender.com/api
```

### Step 4: Deploy

1. Click "Deploy" button
2. Wait for build completion (2-3 minutes)
3. Frontend will be available at URL like:
   `https://expense-management-frontend.onrender.com`

### Step 5: Verify Deployment

1. Open https://expense-management-frontend.onrender.com
2. Try logging in with test account
3. Add an expense to verify API connectivity

## SSL/HTTPS Configuration

Both services automatically have HTTPS enabled by Render. No additional configuration needed!

## Custom Domain Setup (Optional)

### For Backend API:

1. Go to Render service settings
2. Scroll to "Custom Domain"
3. Enter your domain (e.g., `api.yourdomain.com`)
4. Update DNS records as instructed
5. Update frontend VITE_API_URL

### For Frontend:

1. Go to Render service settings
2. Scroll to "Custom Domain"
3. Enter your domain (e.g., `app.yourdomain.com`)
4. Update DNS records as instructed

## Database Backup Strategy

### Automated Backups (Render PostgreSQL)

Render automatically backs up databases. Access backups in:
Service Settings → Database → Backups

### Manual Backup

```bash
# Using pg_dump
pg_dump -h your_host -U your_user -d expense_management_prod > backup.sql

# Upload to safe storage (AWS S3, GitHub, etc.)
```

### Restore from Backup

```bash
# Create fresh database
createdb expense_management_prod

# Restore from backup
psql -h your_host -U your_user -d expense_management_prod < backup.sql
```

## Monitoring & Logging

### View Logs

1. Render Dashboard → Your Service
2. Click "Logs" tab
3. Real-time logs displayed

### Common Issues

#### Service keeps restarting
- Check error logs
- Ensure environment variables are set
- Check database connection

#### API returns 500 errors
- Check backend logs
- Verify database connection string
- Check JWT_SECRET value

#### Frontend can't reach API
- Check VITE_API_URL environment variable
- Verify backend service is running
- Check ALLOWED_ORIGINS includes frontend URL

### Health Monitoring

Enable alerts in Render settings:
- CPU usage > 80%
- Memory usage > 80%
- Response time > 10s

## Scaling (Optional)

### If you outgrow free tier:

1. Backend: Upgrade instance type (Pro/Premium)
2. Database: Upgrade PostgreSQL plan
3. Frontend: Already scales automatically

## Cost Management

### Free Tier Limits:
- 0.5 GB RAM per service
- Shared CPU
- Database: 100 MB storage
- Auto-spins down after 15 min inactivity

### To keep costs low:
- Monitor database size
- Archive old expenses periodically
- Use compression for reports

## SSL/TLS Security

Render provides:
- ✅ Automatic SSL certificates (Let's Encrypt)
- ✅ HTTPS enforced
- ✅ TLS 1.2+
- ✅ No additional configuration needed

## Environment Variable Security

Best Practices:
- ✅ Never commit .env files
- ✅ Use Render's environment UI
- ✅ Rotate JWT_SECRET every 6 months
- ✅ Use strong database passwords (20+ characters)

## Disaster Recovery

### If database fails:

1. Check Render backups
2. Restore to new database
3. Update connection string
4. Restart API service

### If service fails:

1. Render automatically restarts services
2. Check logs for errors
3. Manual restart: Service Settings → Restart

## Performance Optimization

### Database:
- Indexes are already created
- Consider archiving old expenses
- Monitor query performance

### API:
- Currently handles up to 100 concurrent users
- Render Pro tier for higher load
- Consider caching with Redis

### Frontend:
- Vite build is optimized
- Static site fast by default

## Monitoring Checklist

- [ ] Set up email notifications
- [ ] Monitor error logs daily
- [ ] Check database size weekly
- [ ] Verify backups working
- [ ] Test recovery procedures monthly
- [ ] Review performance metrics

## Troubleshooting Deployment

### Build fails
```
Solution: Check Node version (14+), ensure package-lock.json exists
```

### Database connection error
```
Solution: Verify DB_HOST, DB_USER, DB_PASSWORD in environment
```

### CORS errors in frontend
```
Solution: Update ALLOWED_ORIGINS to include frontend URL
```

### Service times out
```
Solution: Upgrade to paid instance or optimize database queries
```

## Post-Deployment Checklist

- [x] Backend service running
- [x] Frontend service running
- [x] SSL certificates installed
- [x] Database connected
- [x] Can register new user
- [x] Can login
- [x] Can create expenses
- [x] Can view reports
- [x] Database backups configured
- [x] Logging enabled

## Support

For Render support: https://render.com/docs

## Cost Estimate (Monthly)

- Backend API (Free): $0
- Frontend Static (Free): $0
- PostgreSQL Database (Free): $0
- **Total**: $0 (until you exceed free tier limits)

Paid tier starts at $7/month per service.

---

**Deployment Status**: ✅ PRODUCTION READY

Your application is now live and accessible to users!
