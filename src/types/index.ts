// ... (other types remain the same)

export interface CashFlow {
  id: number;
  type: 'income' | 'expense' | 'loan_disbursement' | 'loan_repayment';
  amount: number;
  description: string;
  date: string;
  related_id?: number;
  created_at: string;
}

// ... (other types remain the same)