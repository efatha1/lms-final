import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchDashboardData } from '../api/dashboard';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { StatusBadge } from '../components/ui/status-badge';
import { DashboardSummary, LoanApplication, CashFlow } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { DollarSign, Users, TrendingUp, TrendingDown } from 'lucide-react';

export default function Dashboard() {
  // ... (previous code remains the same)

  const totalIncome = dashboardData?.recent_transactions
    .filter(t => t.type === 'income' || t.description.toLowerCase().includes('loan repayment'))
    .reduce((sum, t) => sum + t.amount, 0) || 0;
    
  const totalExpenses = dashboardData?.recent_transactions
    .filter(t => t.type === 'expense' || t.description.toLowerCase().includes('loan disbursement'))
    .reduce((sum, t) => sum + t.amount, 0) || 0;
    
  const netCashFlow = totalIncome - totalExpenses;

  // ... (rest of the component remains the same)

  return (
    <PageContainer title="Dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <h3 className="text-2xl font-bold">{dashboardData?.total_applications || 0}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalIncome)}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalExpenses)}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center py-4">
            <div className={`p-3 rounded-full ${netCashFlow >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'} mr-4`}>
              {netCashFlow >= 0 ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Net Cash Flow</p>
              <h3 className={`text-2xl font-bold ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(Math.abs(netCashFlow))}
                {netCashFlow < 0 && ' (Deficit)'}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ... (rest of the component remains the same) */}
    </PageContainer>
  );
}