-- Create database
CREATE DATABASE IF NOT EXISTS loan_management;
USE loan_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  filename VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  related_table VARCHAR(50),
  related_id INT
);

-- Loan applications table
CREATE TABLE IF NOT EXISTS loan_applications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  applicant_name VARCHAR(100) NOT NULL,
  nida_id VARCHAR(50) NOT NULL UNIQUE,
  loan_amount DECIMAL(15, 2) NOT NULL,
  term_months INT NOT NULL,
  interest_rate DECIMAL(5, 2) NOT NULL,
  employment_status ENUM('Employed', 'Entrepreneur') NOT NULL,
  employment_proof INT,
  mode_of_repayment ENUM('weekly', 'monthly') NOT NULL,
  sponsor1_name VARCHAR(100) NOT NULL,
  sponsor1_id VARCHAR(50) NOT NULL,
  sponsor1_doc INT,
  sponsor2_name VARCHAR(100) NOT NULL,
  sponsor2_id VARCHAR(50) NOT NULL,
  sponsor2_doc INT,
  terms_doc INT,
  local_govt_letter INT,
  csee_certificate INT,
  acse_certificate INT,
  title_deed INT,
  vehicle_reg_card INT,
  insurance_card INT,
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (employment_proof) REFERENCES documents(id),
  FOREIGN KEY (sponsor1_doc) REFERENCES documents(id),
  FOREIGN KEY (sponsor2_doc) REFERENCES documents(id),
  FOREIGN KEY (terms_doc) REFERENCES documents(id),
  FOREIGN KEY (local_govt_letter) REFERENCES documents(id),
  FOREIGN KEY (csee_certificate) REFERENCES documents(id),
  FOREIGN KEY (acse_certificate) REFERENCES documents(id),
  FOREIGN KEY (title_deed) REFERENCES documents(id),
  FOREIGN KEY (vehicle_reg_card) REFERENCES documents(id),
  FOREIGN KEY (insurance_card) REFERENCES documents(id)
);

-- Loan repayments table
CREATE TABLE IF NOT EXISTS loan_repayments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  loan_application_id INT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid BOOLEAN NOT NULL DEFAULT FALSE,
  paid_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (loan_application_id) REFERENCES loan_applications(id)
);

-- Cash flow table
CREATE TABLE IF NOT EXISTS cash_flow (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('income', 'expense') NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  description TEXT NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  action VARCHAR(100) NOT NULL,
  details TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_loan_applications_status ON loan_applications(status);
CREATE INDEX idx_loan_applications_nida_id ON loan_applications(nida_id);
CREATE INDEX idx_loan_repayments_loan_application_id ON loan_repayments(loan_application_id);
CREATE INDEX idx_loan_repayments_due_date ON loan_repayments(due_date);
CREATE INDEX idx_loan_repayments_paid ON loan_repayments(paid);
CREATE INDEX idx_cash_flow_type ON cash_flow(type);
CREATE INDEX idx_cash_flow_date ON cash_flow(date);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_documents_related ON documents(related_table, related_id);