# Expense Management Application

A comprehensive full-stack expense management system for small and medium-sized businesses. Track daily expenses, categorize spending, and generate detailed financial reports with an intuitive web interface.

## Features

✅ **User Authentication**: Secure registration and login with JWT tokens
✅ **Expense Tracking**: Record expenses with date, amount, category, and description
✅ **Category Management**: Create and organize custom expense categories with colors and icons
✅ **Financial Reports**: Generate detailed reports with category breakdown and trends
✅ **Dashboard**: Visual summary of spending with recent expenses and top categories
✅ **Data Security**: Secure coding practices to prevent buffer overflow vulnerabilities
✅ **Input Validation**: Comprehensive validation on both frontend and backend
✅ **Responsive Design**: Mobile-friendly UI with Tailwind CSS

## Tech Stack

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **PostgreSQL** - Database
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **helmet** - Security middleware
- **express-validator** - Input validation

### Frontend
- **React** - UI library
- **React Router** - Client-side routing
- **Axios** - HTTP client
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **date-fns** - Date formatting

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)
- Git

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "SME capstone project"
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Edit .env with your database credentials
# DB_USER=postgres
# DB_PASSWORD=your_password
# DB_HOST=localhost
# DB_PORT=5432
# DB_NAME=expense_management
# JWT_SECRET=your_secret_key_here
```

### 3. Database Setup

```bash
# Create PostgreSQL database
createdb expense_management

# The application will create tables automatically on first run
```

### 4. Start Backend Server

```bash
# Development mode with auto-reload
npm run dev

# Production mode
npm start

# Server runs on http://localhost:5000
```

### 5. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Start development server
npm run dev

# Application runs on http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/users/register` - Register new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Expenses
- `POST /api/expenses` - Create expense (protected)
- `GET /api/expenses` - Get all expenses (protected)
- `GET /api/expenses/:id` - Get expense by ID (protected)
- `PUT /api/expenses/:id` - Update expense (protected)
- `DELETE /api/expenses/:id` - Delete expense (protected)

### Categories
- `POST /api/categories` - Create category (protected)
- `GET /api/categories` - Get all categories (protected)
- `GET /api/categories/:id` - Get category by ID (protected)
- `PUT /api/categories/:id` - Update category (protected)
- `DELETE /api/categories/:id` - Delete category (protected)

### Reports
- `GET /api/reports/category-breakdown` - Category spending breakdown
- `GET /api/reports/daily-trend` - Daily expense trends
- `GET /api/reports/monthly-summary` - Monthly expense summary
- `GET /api/reports/financial-report` - Comprehensive financial report

## Security Features

### 1. Password Security
- Passwords hashed with bcryptjs (12 rounds)
- Minimum 8 characters with letters, numbers, and special characters
- Never stored in plain text

### 2. Input Validation
- All inputs validated on backend using express-validator
- SQL injection prevention with parameterized queries
- XSS protection with input sanitization
- CORS restrictions to trusted origins

### 3. Buffer Overflow Prevention
- Request size limits (10MB max for JSON/form data)
- Input length validation on all fields
- Database constraints on all columns

### 4. Authentication
- JWT token-based authentication
- Tokens expire after 7 days
- Tokens required for all protected endpoints
- Automatic logout on token expiration

### 5. Data Protection
- All sensitive operations logged in audit trail
- User data isolated per account
- Secure connection headers (Helmet.js)

## Deployment to Render

### 1. Prepare Backend for Render

Create `Procfile` in backend directory:
```
web: npm start
```

### 2. Deploy Backend

1. Push code to GitHub repository
2. Go to https://render.com and sign up
3. Create new Web Service
4. Connect GitHub repository
5. Configure environment variables:
   - `DB_USER`, `DB_PASSWORD`, `DB_HOST`, `DB_PORT`, `DB_NAME`
   - `JWT_SECRET`
   - `PORT=5000`
6. Deploy

### 3. Deploy Frontend

1. Go to Render dashboard
2. Create new Static Site
3. Connect GitHub repository (frontend folder)
4. Set build command: `npm install && npm run build`
5. Set publish directory: `dist`
6. Configure environment:
   - `VITE_API_URL=<your-backend-render-url>`
7. Deploy

## Database Schema

### Users Table
- Stores user account information
- Encrypted passwords with bcryptjs

### Expense Categories Table
- User-created categories for organizing expenses
- Supports custom colors and icons

### Expenses Table
- Records all expense transactions
- Links to categories and users
- Stores payment method and tags

### Audit Logs Table
- Tracks all user actions
- Stores changes for security and compliance

## Error Handling

The application includes comprehensive error handling:
- Validation errors with specific messages
- Authentication errors with proper HTTP status codes
- Database errors logged securely
- User-friendly error messages in UI

## Performance Optimization

- Database indexes on frequently queried columns
- Efficient query construction
- Frontend lazy loading
- Client-side state management with React Context
- API response caching

## Testing

### Manual Testing Checklist

1. **Authentication**
   - Register new user
   - Login with credentials
   - Update profile
   - Logout

2. **Expenses**
   - Create expense
   - Edit expense
   - Delete expense
   - Filter by category and date

3. **Categories**
   - Create category
   - Update category
   - Delete category
   - Use in expenses

4. **Reports**
   - Generate financial reports
   - Filter by date range
   - Export reports as JSON

## Troubleshooting

### Backend Connection Issues
```bash
# Check if PostgreSQL is running
psql -U postgres -d expense_management -c "SELECT NOW();"

# Check backend logs
npm run dev
```

### Frontend API Connection Issues
```bash
# Ensure backend is running on port 5000
# Check browser console for CORS errors
# Verify ALLOWED_ORIGINS in backend .env
```

### Database Issues
```bash
# Reset database
dropdb expense_management
createdb expense_management

# Restart backend to initialize tables
npm run dev
```

## Project Structure

```
SME capstone project/
├── backend/
│   ├── config/
│   │   ├── database.js
│   │   └── initDb.js
│   ├── controllers/
│   │   ├── userController.js
│   │   ├── expenseController.js
│   │   ├── categoryController.js
│   │   └── reportController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── validation.js
│   ├── routes/
│   │   ├── userRoutes.js
│   │   ├── expenseRoutes.js
│   │   ├── categoryRoutes.js
│   │   └── reportRoutes.js
│   ├── server.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── common/
│   │   │   │   └── FormElements.jsx
│   │   │   ├── DashboardLayout.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── contexts/
│   │   │   ├── AuthContext.jsx
│   │   │   └── ExpenseContext.jsx
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   ├── ExpensesPage.jsx
│   │   │   ├── CategoriesPage.jsx
│   │   │   ├── ReportsPage.jsx
│   │   │   └── ProfilePage.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── .env.example
├── .gitignore
└── README.md
```

## Contributing

1. Create a feature branch (`git checkout -b feature/AmazingFeature`)
2. Commit changes (`git commit -m 'Add AmazingFeature'`)
3. Push to branch (`git push origin feature/AmazingFeature`)
4. Open Pull Request

## Security Considerations

- Change `JWT_SECRET` in production
- Use HTTPS in production
- Set strong PostgreSQL password
- Regularly update dependencies: `npm audit fix`
- Enable CORS only for trusted domains
- Monitor audit logs for suspicious activities

## License

This project is licensed under the MIT License

## Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check backend logs for errors
4. Verify database connection

## Changelog

### Version 1.0.0
- Initial release
- User authentication
- Expense management
- Financial reports
- Dashboard
- Category management

---

**Built with security, performance, and user experience in mind.**
