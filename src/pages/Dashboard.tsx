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
  const navigate = useNavigate();
  const { token } = useAuth();
  const { showToast } = useToast();
  const [dashboardData, setDashboardData] = useState<DashboardSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      if (!token) return;
      
      try {
        const data = await fetchDashboardData(token);
        setDashboardData(data);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [token, showToast]);

  const handleApplicationClick = (id: number) => {
    navigate(`/loan-applications?id=${id}`);
  };

  const handleTransactionClick = (id: number) => {
    navigate(`/cash-flow?id=${id}`);
  };

  if (isLoading) {
    return (
      <PageContainer title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
              <h3 className="text-2xl font-bold">{formatCurrency(dashboardData?.total_income || 0)}</h3>
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
              <h3 className="text-2xl font-bold">{formatCurrency(dashboardData?.total_expenses || 0)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Recent Loan Applications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Applicant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData?.recent_applications.length ? (
                    dashboardData.recent_applications.map((application: LoanApplication) => (
                      <tr 
                        key={application.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleApplicationClick(application.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{application.applicant_name}</div>
                          <div className="text-sm text-gray-500">{application.nida_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(application.loan_amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(application.created_at)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={application.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent applications
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        
        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData?.recent_transactions.length ? (
                    dashboardData.recent_transactions.map((transaction: CashFlow) => (
                      <tr 
                        key={transaction.id} 
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => handleTransactionClick(transaction.id)}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{transaction.description}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{formatCurrency(transaction.amount)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{formatDate(transaction.date)}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              transaction.type === 'income'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                        No recent transactions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}