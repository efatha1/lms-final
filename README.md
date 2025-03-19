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

## System Architecture

The application uses a unified architecture where both frontend and backend run on a single port:

- **Development Mode**: Uses a custom development server that:
  - Serves the Vite development server with hot module reloading
  - Runs the backend server on an internal port
  - Proxies API requests from the frontend to the backend

- **Production Mode**: Uses the Express server to:
  - Serve the static frontend files built by Vite
  - Handle all API requests
  - Manage file uploads and database operations

## Getting Started

### Prerequisites
- Node.js 18+ installed
- MySQL 8.0+ database (already set up at 197.186.16.150)
- npm or yarn package manager

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/loan-management-system.git
cd loan-management-system
```

2. Install all dependencies (frontend and backend):
```bash
npm run install:all
```

### Development Mode

Run the application in development mode with hot reloading:
```bash
npm run dev
```

This will:
- Start the Vite development server for the frontend
- Start the Express backend server
- Set up proxying between the two
- The application will be available at http://localhost:3000

### Production Mode

Build and run the application in production mode:
```bash
npm run start
```

This will:
- Build the frontend assets
- Start the Express server in production mode
- Serve both the frontend and API from the same port
- The application will be available at http://localhost:3000 (or the port specified in the PORT environment variable)

## Environment Variables

The application uses the following environment variables:

- `PORT`: The port on which the server runs (default: 3000)
- `NODE_ENV`: The environment mode ('development' or 'production')
- `JWT_SECRET`: Secret key for JWT token generation (default: 'your-secret-key', should be changed in production)

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
- `GET /api/reports/loan-repayments` - Get loan repayments report data

### Health Check
- `GET /api/health` - Check if the server is running

## File Structure

```
loan-management-system/
├── dist/                  # Built frontend files (created after build)
├── server/                # Backend server code
│   ├── index.js           # Main server file
│   ├── package.json       # Backend dependencies
│   └── uploads/           # Uploaded files storage
├── src/                   # Frontend source code
│   ├── api/               # API client functions
│   ├── components/        # React components
│   ├── contexts/          # React contexts
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility libraries
│   ├── pages/             # Page components
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   └── main.tsx           # Application entry point
├── dev-server.mjs         # Development server script
├── package.json           # Project dependencies and scripts
├── tsconfig.app.json      # TypeScript configuration
├── vite.config.ts         # Vite configuration
└── README.md              # Project documentation
```

## Development Workflow

1. Make changes to the frontend code in the `src` directory
2. Make changes to the backend code in the `server` directory
3. Run `npm run dev` to test your changes in development mode
4. Run `npm run build` to build the frontend for production
5. Run `npm run start` to run the application in production mode

## Security Considerations

- JWT tokens expire after 1 hour
- Passwords are hashed using bcrypt
- File uploads are restricted to specific file types and sizes
- All API endpoints (except login/register) require authentication
- Audit logging tracks user actions

## Troubleshooting

### Common Issues

1. **Port already in use**
   - Change the PORT environment variable: `PORT=3001 npm run dev`

2. **Database connection issues**
   - Ensure the MySQL server is running
   - Check the database credentials in `server/index.js`

3. **File upload errors**
   - Ensure the `server/uploads` directory exists and is writable
   - Check file size limits (currently 5MB)
   - Only .jpeg, .jpg, .png, and .pdf files are allowed

4. **API errors**
   - Check the server logs for detailed error messages
   - Ensure your JWT token is valid and not expired

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.