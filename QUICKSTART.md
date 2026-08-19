# Quick Start Guide

## System Requirements

- Node.js v14+ (Check with `node -v`)
- npm v6+ (Check with `npm -v`)
- PostgreSQL v12+ (Check with `psql --version`)
- Git

## One-Command Setup (Recommended)

### Step 1: Backend Setup

```powershell
# Navigate to project root
cd "C:\Users\user\Documents\SME capstone project"

# Setup backend
cd backend
npm install

# Create .env file
Copy-Item .env.example .env

# Edit .env with your PostgreSQL credentials
# Open .env in your text editor and update:
# DB_USER=postgres
# DB_PASSWORD=your_actual_password
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=expense_management
# JWT_SECRET=generate_a_random_string_here
# PORT=5000
```

### Step 2: Create PostgreSQL Database

```powershell
# In PostgreSQL shell or pgAdmin:
CREATE DATABASE expense_management;

# Or using psql command line:
psql -U postgres -c "CREATE DATABASE expense_management;"
```

### Step 3: Start Backend Server

```powershell
cd backend
npm run dev

# Server will automatically:
# 1. Create database tables
# 2. Create indexes
# 3. Start listening on http://localhost:5000
```

### Step 4: Frontend Setup (In a new terminal)

```powershell
cd frontend
npm install

# Copy environment file
Copy-Item .env.example .env

# Start development server
npm run dev

# Frontend will be available at http://localhost:3000
```

## Access the Application

1. Open browser to http://localhost:3000
2. Create a new account by clicking "Sign up here"
3. Log in with your credentials
4. Start adding expenses!

## Default Categories (Create After Login)

1. **Office Supplies** - 📋 (Blue)
2. **Travel** - ✈️ (Purple)
3. **Meals & Entertainment** - 🍔 (Orange)
4. **Utilities** - ⚡ (Yellow)
5. **Equipment** - 🔧 (Red)

## Troubleshooting Setup Issues

### PostgreSQL Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```
**Solution**: Ensure PostgreSQL is running
- Windows: Check Services → PostgreSQL
- Mac: `brew services start postgresql`
- Linux: `sudo systemctl start postgresql`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solution**: Kill process on port 5000
```powershell
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :5000
kill -9 <PID>
```

### Database Already Exists Error
```powershell
# Drop existing database
psql -U postgres -c "DROP DATABASE expense_management;"

# Create fresh database
psql -U postgres -c "CREATE DATABASE expense_management;"
```

### CORS Error in Frontend
**Solution**: Ensure backend is running on port 5000 and update ALLOWED_ORIGINS in .env

### Node Modules Installation Error
```powershell
# Clear npm cache and reinstall
rm -r node_modules
npm cache clean --force
npm install
```

## Key Features to Test

### 1. User Registration
- Go to /register
- Fill form with valid data
- Password requires: 8+ chars, letters, numbers, special characters
- Should redirect to dashboard after registration

### 2. Add Expense
- Click "Add Expense" button
- Fill required fields (Amount, Category, Date)
- Click "Add Expense"
- Expense should appear in list immediately

### 3. View Dashboard
- Shows total expenses this month
- Displays top spending categories
- Shows recent expenses
- All data updates in real-time

### 4. Generate Reports
- Navigate to Reports
- Select date range
- Click "Generate Report"
- View category breakdown and trends
- Export as JSON

### 5. Manage Categories
- Go to Categories
- Add new category with color and icon
- Edit existing category
- Delete category (expenses are unlinked)

## Security Features Implemented

✅ **Password Hashing**: Bcryptjs with 12 rounds
✅ **Input Validation**: All inputs validated server-side
✅ **SQL Injection Prevention**: Parameterized queries
✅ **XSS Protection**: Input sanitization
✅ **CORS Security**: Restricted to allowed origins
✅ **JWT Authentication**: Secure token-based auth
✅ **Buffer Overflow Prevention**: Size limits on all inputs
✅ **Audit Logging**: All actions logged

## Production Deployment

### Environment Variables for Production

```bash
# Backend .env
NODE_ENV=production
PORT=5000
DB_USER=prod_user
DB_PASSWORD=strong_password_here
DB_HOST=your_db_host
DB_PORT=5432
DB_NAME=expense_management_prod
JWT_SECRET=generate_long_random_string_here
ALLOWED_ORIGINS=https://yourdomain.com

# Frontend .env
VITE_API_URL=https://your-backend.render.com/api
```

### Deploy to Render

**Backend**:
1. Push code to GitHub
2. Create new Web Service on Render
3. Connect repository
4. Set environment variables
5. Set start command: `npm start`
6. Deploy

**Frontend**:
1. Create new Static Site on Render
2. Connect repository (select frontend folder)
3. Build command: `npm install && npm run build`
4. Publish directory: `dist`
5. Set `VITE_API_URL` environment variable
6. Deploy

## Performance Tips

1. **Database Optimization**
   - Indexes on user_id, date, category_id
   - Regular VACUUM for PostgreSQL
   - Monitor slow queries

2. **Frontend Optimization**
   - Vite bundles efficiently
   - Use lazy loading for routes
   - Cache API responses

3. **Monitoring**
   - Check backend logs regularly
   - Monitor database size
   - Track API response times

## Common Commands

```powershell
# Backend
cd backend
npm run dev              # Start development server
npm start               # Start production server
npm test                # Run tests

# Frontend
cd frontend
npm run dev             # Start development server
npm run build           # Build for production
npm run preview         # Preview production build

# Database
psql -U postgres -d expense_management -c "SELECT COUNT(*) FROM expenses;"
```

## API Testing with Postman

1. Install Postman
2. Import collection from documentation
3. Set base URL: http://localhost:5000/api
4. Get auth token from login endpoint
5. Add to Authorization header for protected routes

Example:
```
Authorization: Bearer <token_from_login>
```

## Database Backup

```powershell
# Backup database
pg_dump -U postgres expense_management > backup.sql

# Restore database
psql -U postgres expense_management < backup.sql
```

## Next Steps

1. Customize categories for your business
2. Add team members by sharing login credentials
3. Set up regular expense recording
4. Review reports weekly
5. Adjust budget based on trends

---

**For detailed information, see README.md**
