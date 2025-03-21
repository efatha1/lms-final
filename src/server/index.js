const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../dist')));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// Database connection
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'loan_management'
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// JWT secret
const JWT_SECRET = 'your-secret-key'; // In production, use environment variable

// Middleware to verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Helper function to log audit
const logAudit = async (userId, action, details) => {
  try {
    await pool.execute(
      'INSERT INTO audit_logs (user_id, action, details) VALUES (?, ?, ?)',
      [userId, action, details]
    );
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

// Routes

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  try {
    // Check if username or email already exists
    const [existingUsers] = await pool.execute(
      'SELECT * FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    
    if (existingUsers.length > 0) {
      return res.status(409).json({ message: 'Username or email already exists' });
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    
    // Insert new user
    const [result] = await pool.execute(
      'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
      [username, email, hashedPassword]
    );
    
    const userId = result.insertId;
    
    // Generate JWT token
    const token = jwt.sign({ id: userId, username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Log audit
    await logAudit(userId, 'user_register', `User ${username} registered`);
    
    res.status(201).json({
      user: {
        id: userId,
        username,
        email,
        created_at: new Date().toISOString()
      },
      token
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }
  
  try {
    // Find user by username
    const [users] = await pool.execute(
      'SELECT * FROM users WHERE username = ?',
      [username]
    );
    
    if (users.length === 0) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    const user = users[0];
    
    // Compare password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid username or password' });
    }
    
    // Generate JWT token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '24h' });
    
    // Log audit
    await logAudit(user.id, 'user_login', `User ${username} logged in`);
    
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        created_at: user.created_at
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Loan Applications routes
app.get('/api/loan-applications', authenticateToken, async (req, res) => {
  try {
    const [applications] = await pool.execute(
      'SELECT * FROM loan_applications ORDER BY created_at DESC'
    );
    
    res.json(applications);
  } catch (error) {
    console.error('Error fetching loan applications:', error);
    res.status(500).json({ message: 'Server error fetching loan applications' });
  }
});

app.post('/api/loan-applications', authenticateToken, upload.fields([
  { name: 'employment_proof', maxCount: 1 },
  { name: 'sponsor1_doc', maxCount: 1 },
  { name: 'sponsor2_doc', maxCount: 1 },
  { name: 'terms_doc', maxCount: 1 }
]), async (req, res) => {
  const { 
    applicant_name, nida_id, loan_amount, term_months, interest_rate,
    employment_status, mode_of_repayment, sponsor1_name, sponsor1_id,
    sponsor2_name, sponsor2_id
  } = req.body;
  
  const files = req.files;
  
  if (!applicant_name || !nida_id || !loan_amount || !term_months || !interest_rate ||
      !employment_status || !mode_of_repayment || !sponsor1_name || !sponsor1_id ||
      !sponsor2_name || !sponsor2_id || !files.employment_proof || !files.sponsor1_doc ||
      !files.sponsor2_doc || !files.terms_doc) {
    return res.status(400).json({ message: 'All fields and files are required' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Insert documents
    const [employmentProofResult] = await connection.execute(
      'INSERT INTO documents (filename, path, related_table, related_id) VALUES (?, ?, ?, ?)',
      [files.employment_proof[0].originalname, files.employment_proof[0].path, 'loan_applications', 0]
    );
    
    const [sponsor1DocResult] = await connection.execute(
      'INSERT INTO documents (filename, path, related_table, related_id) VALUES (?, ?, ?, ?)',
      [files.sponsor1_doc[0].originalname, files.sponsor1_doc[0].path, 'loan_applications', 0]
    );
    
    const [sponsor2DocResult] = await connection.execute(
      'INSERT INTO documents (filename, path, related_table, related_id) VALUES (?, ?, ?, ?)',
      [files.sponsor2_doc[0].originalname, files.sponsor2_doc[0].path, 'loan_applications', 0]
    );
    
    const [termsDocResult] = await connection.execute(
      'INSERT INTO documents (filename, path, related_table, related_id) VALUES (?, ?, ?, ?)',
      [files.terms_doc[0].originalname, files.terms_doc[0].path, 'loan_applications', 0]
    );
    
    // Insert loan application
    const [applicationResult] = await connection.execute(
      `INSERT INTO loan_applications (
        applicant_name, nida_id, loan_amount, term_months, interest_rate,
        employment_status, employment_proof, mode_of_repayment, sponsor1_name,
        sponsor1_id, sponsor1_doc, sponsor2_name, sponsor2_id, sponsor2_doc, terms_doc
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        applicant_name, nida_id, loan_amount, term_months, interest_rate,
        employment_status, employmentProofResult.insertId, mode_of_repayment,
        sponsor1_name, sponsor1_id, sponsor1DocResult.insertId,
        sponsor2_name, sponsor2_id, sponsor2DocResult.insertId, termsDocResult.insertId
      ]
    );
    
    const applicationId = applicationResult.insertId;
    
    // Update document related_id
    await connection.execute(
      'UPDATE documents SET related_id = ? WHERE id IN (?, ?, ?, ?)',
      [applicationId, employmentProofResult.insertId, sponsor1DocResult.insertId, sponsor2DocResult.insertId, termsDocResult.insertId]
    );
    
    // Log audit
    await logAudit(req.user.id, 'loan_application_create', `Created loan application for ${applicant_name}`);
    
    await connection.commit();
    
    // Fetch the created application
    const [applications] = await pool.execute(
      'SELECT * FROM loan_applications WHERE id = ?',
      [applicationId]
    );
    
    res.status(201).json(applications[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error creating loan application:', error);
    res.status(500).json({ message: 'Server error creating loan application' });
  } finally {
    connection.release();
  }
});

app.put('/api/loan-applications/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  
  if (!status || !['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Valid status is required' });
  }
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Update application status
    await connection.execute(
      'UPDATE loan_applications SET status = ? WHERE id = ?',
      [status, id]
    );
    
    // If approved, create repayment schedule
    if (status === 'approved') {
      // Get application details
      const [applications] = await connection.execute(
        'SELECT * FROM loan_applications WHERE id = ?',
        [id]
      );
      
      if (applications.length === 0) {
        throw new Error('Application not found');
      }
      
      const application = applications[0];
      
      // Calculate repayment schedule
      const loanAmount = parseFloat(application.loan_amount);
      const interestRate = parseFloat(application.interest_rate);
      const termMonths = parseInt(application.term_months);
      const modeOfRepayment = application.mode_of_repayment;
      
      const monthlyInterestRate = interestRate / 100 / 12;
      const totalInterest = loanAmount * monthlyInterestRate * termMonths;
      const totalRepayment = loanAmount + totalInterest;
      
      let numberOfPayments;
      let paymentAmount;
      
      if (modeOfRepayment === 'monthly') {
        numberOfPayments = termMonths;
        paymentAmount = totalRepayment / numberOfPayments;
      } else { // weekly
        numberOfPayments = termMonths * 4; // Approximate weeks in months
        paymentAmount = totalRepayment / numberOfPayments;
      }
      
      // Create repayment records
      const currentDate = new Date();
      
      for (let i = 1; i <= numberOfPayments; i++) {
        const dueDate = new Date(currentDate);
        
        if (modeOfRepayment === 'monthly') {
          dueDate.setMonth(dueDate.getMonth() + i);
        } else { // weekly
          dueDate.setDate(dueDate.getDate() + (i * 7));
        }
        
        await connection.execute(
          'INSERT INTO loan_repayments (loan_application_id, amount, due_date) VALUES (?, ?, ?)',
          [id, paymentAmount, dueDate.toISOString().split('T')[0]]
        );
      }
      
      // Create cash flow entry for loan disbursement
      await connection.execute(
        'INSERT INTO cash_flow (type, amount, description, date, related_id) VALUES (?, ?, ?, ?, ?)',
        ['loan_disbursement', loanAmount, `Loan disbursement for ${application.applicant_name}`, currentDate.toISOString().split('T')[0], id]
      );
    }
    
    // Log audit
    await logAudit(
      req.user.id, 
      'loan_application_status_update', 
      `Updated loan application ${id} status to ${status}`
    );
    
    await connection.commit();
    
    // Fetch the updated application
    const [applications] = await pool.execute(
      'SELECT * FROM loan_applications WHERE id = ?',
      [id]
    );
    
    res.json(applications[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error updating loan application status:', error);
    res.status(500).json({ message: 'Server error updating loan application status' });
  } finally {
    connection.release();
  }
});

app.delete('/api/loan-applications/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get document IDs
    const [applications] = await connection.execute(
      'SELECT employment_proof, sponsor1_doc, sponsor2_doc, terms_doc FROM loan_applications WHERE id = ?',
      [id]
    );
    
    if (applications.length === 0) {
      return res.status(404).json({ message: 'Loan application not found' });
    }
    
    const application = applications[0];
    const documentIds = [
      application.employment_proof,
      application.sponsor1_doc,
      application.sponsor2_doc,
      application.terms_doc
    ];
    
    // Delete repayments
    await connection.execute(
      'DELETE FROM loan_repayments WHERE loan_application_id = ?',
      [id]
    );
    
    // Delete cash flow entries
    await connection.execute(
      'DELETE FROM cash_flow WHERE related_id = ?',
      [id]
    );
    
    // Delete documents
    await connection.execute(
      'DELETE FROM documents WHERE id IN (?, ?, ?, ?)',
      documentIds
    );
    
    // Delete application
    await connection.execute(
      'DELETE FROM loan_applications WHERE id = ?',
      [id]
    );
    
    // Log audit
    await logAudit(req.user.id, 'loan_application_delete', `Deleted loan application ${id}`);
    
    await connection.commit();
    
    res.json({ message: 'Loan application deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error deleting loan application:', error);
    res.status(500).json({ message: 'Server error deleting loan application' });
  } finally {
    connection.release();
  }
});

// Repayments routes
app.get('/api/repayments', authenticateToken, async (req, res) => {
  try {
    const [repayments] = await pool.execute(`
      SELECT r.*, a.applicant_name, a.nida_id, a.loan_amount as total_loan
      FROM loan_repayments r
      JOIN loan_applications a ON r.loan_application_id = a.id
      ORDER BY r.due_date ASC
    `);
    
    res.json(repayments);
  } catch (error) {
    console.error('Error fetching repayments:', error);
    res.status(500).json({ message: 'Server error fetching repayments' });
  }
});

app.post('/api/repayments/:id/pay', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { paid_date } = req.body;
  
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    // Get repayment details
    const [repayments] = await connection.execute(
      'SELECT r.*, a.applicant_name FROM loan_repayments r JOIN loan_applications a ON r.loan_application_id = a.id WHERE r.id = ?',
      [id]
    );
    
    if (repayments.length === 0) {
      return res.status(404).json({ message: 'Repayment not found' });
    }
    
    const repayment = repayments[0];
    
    // Update repayment
    await connection.execute(
      'UPDATE loan_repayments SET paid = TRUE, paid_date = ? WHERE id = ?',
      [paid_date || new Date().toISOString().split('T')[0], id]
    );
    
    // Create cash flow entry
    await connection.execute(
      'INSERT INTO cash_flow (type, amount, description, date, related_id) VALUES (?, ?, ?, ?, ?)',
      [
        'loan_repayment',
        repayment.amount,
        `Loan repayment from ${repayment.applicant_name}`,
        paid_date || new Date().toISOString().split('T')[0],
        repayment.loan_application_id
      ]
    );
    
    // Log audit
    await logAudit(
      req.user.id,
      'repayment_paid',
      `Marked repayment ${id} as paid for ${repayment.applicant_name}`
    );
    
    await connection.commit();
    
    // Fetch the updated repayment
    const [updatedRepayments] = await pool.execute(
      'SELECT r.*, a.applicant_name, a.nida_id FROM loan_repayments r JOIN loan_applications a ON r.loan_application_id = a.id WHERE r.id = ?',
      [id]
    );
    
    res.json(updatedRepayments[0]);
  } catch (error) {
    await connection.rollback();
    console.error('Error marking repayment as paid:', error);
    res.status(500).json({ message: 'Server error marking repayment as paid' });
  } finally {
    connection.release();
  }
});

// Cash Flow routes
app.get('/api/cash-flow', authenticateToken, async (req, res) => {
  try {
    const [cashFlow] = await pool.execute(
      'SELECT * FROM cash_flow ORDER BY date DESC, created_at DESC'
    );
    
    res.json(cashFlow);
  } catch (error) {
    console.error('Error fetching cash flow:', error);
    res.status(500).json({ message: 'Server error fetching cash flow' });
  });

app.post('/api/cash-flow', authenticateToken, async (req, res) => {
  const { type, amount, description, date } = req.body;
  
  if (!type || !amount || !description || !date) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  
  try {
    const [result] = await pool.execute(
      'INSERT INTO cash_flow (type, amount, description, date) VALUES (?, ?, ?, ?)',
      [type, amount, description, date]
    );
    
    // Log audit
    await logAudit(req.user.id, 'cash_flow_create', `Created ${type} cash flow entry of ${amount}`);
    
    // Fetch the created entry
    const [entries] = await pool.execute(
      'SELECT * FROM cash_flow WHERE id = ?',
      [result.insertId]
    );
    
    res.status(201).json(entries[0]);
  } catch (error) {
    console.error('Error creating cash flow entry:', error);
    res.status(500).json({ message: 'Server error creating cash flow entry' });
  }
});

app.put('/api/cash-flow/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { type, amount, description, date } = req.body;
  
  if (!type && !amount && !description && !date) {
    return res.status(400).json({ message: 'At least one field is required' });
  }
  
  try {
    // Build dynamic update query
    let updateFields = [];
    let queryParams = [];
    
    if (type) {
      updateFields.push('type = ?');
      queryParams.push(type);
    }
    
    if (amount) {
      updateFields.push('amount = ?');
      queryParams.push(amount);
    }
    
    if (description) {
      updateFields.push('description = ?');
      queryParams.push(description);
    }
    
    if (date) {
      updateFields.push('date = ?');
      queryParams.push(date);
    }
    
    queryParams.push(id);
    
    await pool.execute(
      `UPDATE cash_flow SET ${updateFields.join(', ')} WHERE id = ?`,
      queryParams
    );
    
    // Log audit
    await logAudit(req.user.id, 'cash_flow_update', `Updated cash flow entry ${id}`);
    
    // Fetch the updated entry
    const [entries] = await pool.execute(
      'SELECT * FROM cash_flow WHERE id = ?',
      [id]
    );
    
    if (entries.length === 0) {
      return res.status(404).json({ message: 'Cash flow entry not found' });
    }
    
    res.json(entries[0]);
  } catch (error) {
    console.error('Error updating cash flow entry:', error);
    res.status(500).json({ message: 'Server error updating cash flow entry' });
  }
});

app.delete('/api/cash-flow/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  
  try {
    // Check if entry exists
    const [entries] = await pool.execute(
      'SELECT * FROM cash_flow WHERE id = ?',
      [id]
    );
    
    if (entries.length === 0) {
      return res.status(404).json({ message: 'Cash flow entry not found' });
    }
    
    // Delete entry
    await pool.execute(
      'DELETE FROM cash_flow WHERE id = ?',
      [id]
    );
    
    // Log audit
    await logAudit(req.user.id, 'cash_flow_delete', `Deleted cash flow entry ${id}`);
    
    res.json({ message: 'Cash flow entry deleted successfully' });
  } catch (error) {
    console.error('Error deleting cash flow entry:', error);
    res.status(500).json({ message: 'Server error deleting cash flow entry' });
  }
});

// Dashboard routes
app.get('/api/dashboard', authenticateToken, async (req, res) => {
  try {
    // Get total applications
    const [applicationsResult] = await pool.execute(
      'SELECT COUNT(*) as count FROM loan_applications'
    );
    const totalApplications = applicationsResult[0].count;
    
    // Get total income
    const [incomeResult] = await pool.execute(
      'SELECT SUM(amount) as total FROM cash_flow WHERE type IN ("income", "loan_repayment")'
    );
    const totalIncome = incomeResult[0].total || 0;
    
    // Get total expenses
    const [expenseResult] = await pool.execute(
      'SELECT SUM(amount) as total FROM cash_flow WHERE type IN ("expense", "loan_disbursement")'
    );
    const totalExpenses = expenseResult[0].total || 0;
    
    // Get recent applications
    const [recentApplications] = await pool.execute(
      'SELECT * FROM loan_applications ORDER BY created_at DESC LIMIT 5'
    );
    
    // Get recent transactions
    const [recentTransactions] = await pool.execute(
      'SELECT * FROM cash_flow ORDER BY date DESC, created_at DESC LIMIT 5'
    );
    
    res.json({
      total_applications: totalApplications,
      total_income: totalIncome,
      total_expenses: totalExpenses,
      recent_applications: recentApplications,
      recent_transactions: recentTransactions
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Server error fetching dashboard data' });
  }
});

// Reports routes
app.get('/api/reports/cash-flow', authenticateToken, async (req, res) => {
  const { startDate, endDate } = req.query;
  
  if (!startDate || !endDate) {
    return res.status(400).json({ message: 'Start date and end date are required' });
  }
  
  try {
    // Get cash flow data grouped by date
    const [cashFlowData] = await pool.execute(`
      SELECT 
        date,
        SUM(CASE WHEN type IN ('income', 'loan_repayment') THEN amount ELSE 0 END) as income,
        SUM(CASE WHEN type IN ('expense', 'loan_disbursement') THEN amount ELSE 0 END) as expense
      FROM cash_flow
      WHERE date BETWEEN ? AND ?
      GROUP BY date
      ORDER BY date
    `, [startDate, endDate]);
    
    res.json(cashFlowData);
  } catch (error) {
    console.error('Error fetching cash flow report:', error);
    res.status(500).json({ message: 'Server error fetching cash flow report' });
  }
});

app.get('/api/reports/loan-applications', authenticateToken, async (req, res) => {
  const { status } = req.query;
  
  try {
    let query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM loan_applications
    `;
    
    if (status) {
      query += ' WHERE status = ?';
      query += ' GROUP BY status';
      
      const [data] = await pool.execute(query, [status]);
      res.json(data);
    } else {
      query += ' GROUP BY status';
      
      const [data] = await pool.execute(query);
      res.json(data);
    }
  } catch (error) {
    console.error('Error fetching loan applications report:', error);
    res.status(500).json({ message: 'Server error fetching loan applications report' });
  }
});

// Serve static files from the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});