export interface User {
  id: number;
  username: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface LoanApplication {
  id: number;
  applicant_name: string;
  nida_id: string;
  loan_amount: number;
  term_months: number;
  interest_rate: number;
  employment_status: 'Employed' | 'Entrepreneur';
  employment_proof: number | null; // document ID
  mode_of_repayment: 'weekly' | 'monthly';
  sponsor1_name: string;
  sponsor1_id: string;
  sponsor1_doc: number; // document ID
  sponsor2_name: string;
  sponsor2_id: string;
  sponsor2_doc: number; // document ID
  terms_doc: number; // document ID
  local_govt_letter?: number | null; // optional document ID
  title_deed?: number | null; // optional document ID
  vehicle_reg_card?: number | null; // optional document ID
  csee_certificate?: number | null; // optional document ID
  acse_certificate?: number | null; // optional document ID
  higher_edu_certificate?: number | null; // optional document ID
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

export interface Document {
  id: number;
  filename: string;
  path: string;
  uploaded_at: string;
  related_table: string;
  related_id: number;
}

export interface LoanRepayment {
  id: number;
  loan_application_id: number;
  amount: number;
  due_date: string;
  paid: boolean;
  paid_date: string | null;
  created_at: string;
  applicant_name?: string;
  nida_id?: string;
  total_loan?: number;
  amount_paid?: number;
}

export interface CashFlow {
  id: number;
  type: 'income' | 'expense' | 'loan_disbursement' | 'loan_repayment';
  amount: number;
  description: string;
  date: string;
  related_id?: number;
  created_at: string;
}

export interface AuditLog {
  id: number;
  user_id: number;
  action: string;
  details: string;
  created_at: string;
}

export interface DashboardSummary {
  total_applications: number;
  total_income: number;
  total_expenses: number;
  recent_applications: LoanApplication[];
  recent_transactions: CashFlow[];
}

export interface RepaymentSchedule {
  payment_number: number;
  due_date: string;
  principal: number;
  interest: number;
  total_payment: number;
  remaining_balance: number;
}

export interface CashFlowReport {
  date: string;
  income: number;
  expense: number;
}

export interface LoanStatusReport {
  status: string;
  count: number;
}