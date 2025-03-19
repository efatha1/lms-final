import { DashboardSummary } from '../types';

const API_URL = 'http://localhost:3001/api';

export const fetchDashboardData = async (token: string): Promise<DashboardSummary> => {
  const response = await fetch(`${API_URL}/dashboard`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to fetch dashboard data');
  }

  return response.json();
};