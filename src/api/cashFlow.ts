import { CashFlow } from '../types';

const API_URL = 'http://localhost:3001/api';

export const fetchCashFlow = async (token: string): Promise<CashFlow[]> => {
  const response = await fetch(`${API_URL}/cash-flow`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch cash flow data');
  }

  return response.json();
};

export const createCashFlow = async (
  token: string, 
  data: Omit<CashFlow, 'id' | 'created_at'>
): Promise<CashFlow> => {
  const response = await fetch(`${API_URL}/cash-flow`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create cash flow entry');
  }

  return response.json();
};

export const updateCashFlow = async (
  token: string, 
  id: number, 
  data: Partial<Omit<CashFlow, 'id' | 'created_at'>>
): Promise<CashFlow> => {
  const response = await fetch(`${API_URL}/cash-flow/${id}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to update cash flow entry');
  }

  return response.json();
};

export const deleteCashFlow = async (token: string, id: number): Promise<void> => {
  const response = await fetch(`${API_URL}/cash-flow/${id}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to delete cash flow entry');
  }
};