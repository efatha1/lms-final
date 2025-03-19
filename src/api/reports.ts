import { CashFlowReport, LoanStatusReport } from '../types';

const API_URL = 'http://localhost:3001/api';

export const fetchCashFlowReport = async (
  token: string, 
  startDate: string, 
  endDate: string
): Promise<CashFlowReport[]> => {
  const response = await fetch(
    `${API_URL}/reports/cash-flow?startDate=${startDate}&endDate=${endDate}`, 
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch cash flow report');
  }

  return response.json();
};

export const fetchLoanApplicationsReport = async (
  token: string, 
  status?: string
): Promise<LoanStatusReport[]> => {
  const url = status 
    ? `${API_URL}/reports/loan-applications?status=${status}`
    : `${API_URL}/reports/loan-applications`;
    
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch loan applications report');
  }

  return response.json();
};