# Loan Management System

A comprehensive web-based loan management system for managing loan applications, cash flow, repayments, and generating reports.

## Features

- User authentication with JWT
- Loan application management with document uploads
- Cash flow tracking (income and expenses)
- Loan repayment scheduling and tracking
- Reporting with charts and visualizations
- Audit logging for security

## Tech Stack

### Frontend
- React 18 with TypeScript
- Vite as the build tool
- Tailwind CSS for styling
- shadcn/ui components
- Lucide React for icons

### Backend
- Node.js with Express
- MySQL database (via mysql2/promise)
- JWT for authentication
- bcryptjs for password hashing
- multer for file uploads

## Getting Started

### Clone the repository

```bash
git clone https://github.com/yourusername/loan-management-system.git
cd loan-management-system
```

### Setup Instructions

#### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ database (already set up at 197.186.16.150)

#### Backend Setup
1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The backend will run on http://localhost:3001

#### Frontend Setup
1. Navigate to the project root directory

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

The frontend will run on http://localhost:5173

## Usage

1. Register a new user account
2. Log in with your credentials
3. Use the sidebar navigation to access different features:
   - Dashboard: View summary metrics and recent activities
   - Loan Applications: Manage loan applications
   - Cash Flow: Track income and expenses
   - Repayments: Monitor and manage loan repayments
   - Reports: Generate and view reports

## Database Configuration

The application is configured to connect to a MySQL database with the following settings:
- Host: 197.186.16.150
- Port: 3306
- Database: loan_system
- User: root
- Password: root

The database schema will be automatically created when the server starts.

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login and get JWT token

### Loan Applications
- `GET /api/loan-applications` - Get all loan applications
- `POST /api/loan-applications` - Create a new loan application
- `PUT /api/loan-applications/:id/status` - Update application status
- `DELETE /api/loan-applications/:id` - Delete an application

### Dashboard
- `GET /api/dashboard` - Get dashboard summary data

### Cash Flow
- `GET /api/cash-flow` - Get all cash flow transactions
- `POST /api/cash-flow` - Create a new transaction
- `PUT /api/cash-flow/:id` - Update a transaction
- `DELETE /api/cash-flow/:id` - Delete a transaction

### Repayments
- `GET /api/repayments` - Get all repayments
- `POST /api/repayments/:id/pay` - Mark a repayment as paid

### Reports
- `GET /api/reports/cash-flow` - Get cash flow report data
- `GET /api/reports/loan-applications` - Get loan applications report data

## Security Considerations

- JWT tokens expire after 1 hour
- Passwords are hashed using bcrypt
- File uploads are restricted to specific file types and sizes
- All API endpoints (except login/register) require authentication
- Audit logging tracks user actions