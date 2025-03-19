import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchDashboardData } from '../api/dashboard';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardContent } from '../components/ui/card';
import { StatusBadge } from '../components/ui/status-badge';
import { DashboardSummary, LoanApplication, CashFlow } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  FileText,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export default function Dashboard() {
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

  // Helper function to get transaction type icon and style
  const getTransactionTypeInfo = (type: string) => {
    switch(type) {
      case 'income':
        return {
          icon: <TrendingUp className="h-3 w-3 mr-1" />,
          className: 'bg-green-100 text-green-800',
          label: 'Income'
        };
      case 'expense':
        return {
          icon: <TrendingDown className="h-3 w-3 mr-1" />,
          className: 'bg-red-100 text-red-800',
          label: 'Expense'
        };
      case 'loan_disbursement':
        return {
          icon: <ArrowUpRight className="h-3 w-3 mr-1" />,
          className: 'bg-blue-100 text-blue-800',
          label: 'Loan Disbursement'
        };
      case 'loan_repayment':
        return {
          icon: <ArrowDownLeft className="h-3 w-3 mr-1" />,
          className: 'bg-purple-100 text-purple-800',
          label: 'Loan Repayment'
        };
      default:
        return {
          icon: <TrendingUp className="h-3 w-3 mr-1" />,
          className: 'bg-gray-100 text-gray-800',
          label: type.charAt(0).toUpperCase() + type.slice(1).replace('_', ' ')
        };
    }
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

  if (!dashboardData) {
    return (
      <PageContainer title="Dashboard">
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No dashboard data available</p>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Dashboard">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <h3 className="text-2xl font-bold text-gray-900">{dashboardData.total_applications}</h3>
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
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(dashboardData.total_income)}</h3>
              <p className="text-xs text-gray-500">Includes loan repayments</p>
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
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(dashboardData.total_expenses)}</h3>
              <p className="text-xs text-gray-500">Includes loan disbursements</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center py-4">
            <div className={`p-3 rounded-full ${
              dashboardData.total_income - dashboardData.total_expenses >= 0 
                ? 'bg-green-100 text-green-600' 
                : 'bg-red-100 text-red-600'
            } mr-4`}>
              {dashboardData.total_income - dashboardData.total_expenses >= 0 ? (
                <TrendingUp className="h-6 w-6" />
              ) : (
                <TrendingDown className="h-6 w-6" />
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Net Cash Flow</p>
              <h3 className={`text-2xl font-bold ${
                dashboardData.total_income - dashboardData.total_expenses >= 0 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                {formatCurrency(Math.abs(dashboardData.total_income - dashboardData.total_expenses))}
                {dashboardData.total_income - dashboardData.total_expenses < 0 && ' (Deficit)'}
              </h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Recent Applications */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Loan Applications</h2>
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
                  {dashboardData.recent_applications.length > 0 ? (
                    dashboardData.recent_applications.map((application: LoanApplication) => (
                      <tr key={application.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium">{application.applicant_name}</div>
                          <div className="text-sm text-gray-500">{application.nida_id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatCurrency(application.loan_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(application.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={application.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No recent applications
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
        
        {/* Recent Transactions */}
        <Card>
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dashboardData.recent_transactions.length > 0 ? (
                    dashboardData.recent_transactions.map((transaction: CashFlow) => {
                      const typeInfo = getTransactionTypeInfo(transaction.type);
                      return (
                        <tr key={transaction.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.className}`}
                            >
                              {typeInfo.icon}
                              {typeInfo.label}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm truncate max-w-[150px]">{transaction.description}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span
                              className={
                                transaction.type === 'income' || transaction.type === 'loan_repayment' 
                                  ? 'text-green-600' 
                                  : 'text-red-600'
                              }
                            >
                              {formatCurrency(transaction.amount)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {formatDate(transaction.date)}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No recent transactions
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </PageContainer>
  );
}