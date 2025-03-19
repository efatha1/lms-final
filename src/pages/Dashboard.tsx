import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchDashboardData } from '../api/dashboard';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/ui/status-badge';
import { DashboardSummary, LoanApplication, CashFlow } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  FileText, 
  Calendar,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Applications</p>
              <h3 className="text-2xl font-bold text-gray-900">{dashboardData?.total_applications || 0}</h3>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_income || 0)}</h3>
              <p className="text-xs text-gray-500 mt-1">Including loan repayments</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <TrendingDown className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Expenses</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(dashboardData?.total_expenses || 0)}</h3>
              <p className="text-xs text-gray-500 mt-1">Including loan disbursements</p>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600 mr-4">
              <DollarSign className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Net Balance</p>
              <h3 className="text-2xl font-bold text-gray-900">
                {formatCurrency((dashboardData?.total_income || 0) - (dashboardData?.total_expenses || 0))}
              </h3>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Recent Applications */}
      <Card className="mb-8">
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Loan Applications</h2>
            <Link 
              to="/loan-applications" 
              className="text-sm text-primary hover:text-primary-dark flex items-center"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
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
                {dashboardData?.recent_applications && dashboardData.recent_applications.length > 0 ? (
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
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
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
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
            <Link 
              to="/cash-flow" 
              className="text-sm text-primary hover:text-primary-dark flex items-center"
            >
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {dashboardData?.recent_transactions && dashboardData.recent_transactions.length > 0 ? (
                  dashboardData.recent_transactions.map((transaction: CashFlow) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.type === 'income' || transaction.type === 'loan_repayment'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {transaction.type.replace('_', ' ').charAt(0).toUpperCase() + 
                           transaction.type.replace('_', ' ').slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(transaction.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm truncate max-w-xs">{transaction.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(transaction.date)}
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
        </div>
      </Card>
    </PageContainer>
  );
}