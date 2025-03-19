import { LoanRepayment } from '../types';

const API_URL = 'http://localhost:3001/api';

export const fetchRepayments = async (token: string): Promise<LoanRepayment[]> => {
  const response = await fetch(`${API_URL}/repayments`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch repayments');
  }

  return response.json();
};

export const markRepaymentAsPaid = async (token: string, id: number): Promise<LoanRepayment> => {
  const response = await fetch(`${API_URL}/repayments/${id}/pay`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ paid_date: new Date().toISOString() }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to mark repayment as paid');
  }

  return response.json();
};