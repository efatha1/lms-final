import { LoanApplication } from '../types';

const API_URL = 'http://localhost:3001/api';

export const fetchLoanApplications = async (token: string): Promise<LoanApplication[]> => {
  const response = await fetch(`${API_URL}/loan-applications`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch loan applications');
  }

  return response.json();
};

export const createLoanApplication = async (token: string, formData: FormData): Promise<LoanApplication> => {
  const response = await fetch(`${API_URL}/loan-applications`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create loan application');
  }

  return response.json();
};

export const updateLoanApplicationStatus = async (
  token: string, 
  id: number, 
  status: 'approved' | 'rejected'
): Promise<LoanApplication> => {
  const response = await fetch(`${API_URL}/loan-applications/${id}/status`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update loan application status');
  }

  return response.json();
};

export const deleteLoanApplication = async (token: string, id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/loan-applications/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete loan application');
  }
};