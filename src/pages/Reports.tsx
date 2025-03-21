import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchCashFlowReport, fetchLoanApplicationsReport } from '../api/reports';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { CashFlowReport, LoanStatusReport } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  BarChart3, 
  PieChart, 
  Calendar,
  Download,
  Loader2
} from 'lucide-react';

export default function Reports() {
  const { token } = useAuth();
  const { showToast } = useToast();
  
  // Date range for cash flow report
  const [startDate, setStartDate] = useState<string>(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  
  // Report data
  const [cashFlowData, setCashFlowData] = useState<CashFlowReport[]>([]);
  const [loanStatusData, setLoanStatusData] = useState<LoanStatusReport[]>([]);
  
  // Loading states
  const [isLoadingCashFlow, setIsLoadingCashFlow] = useState(true);
  const [isLoadingLoanStatus, setIsLoadingLoanStatus] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
      if (!token) return;
      
      // Load cash flow report
      try {
        const cashFlowReport = await fetchCashFlowReport(token, startDate, endDate);
        setCashFlowData(cashFlowReport);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load cash flow report');
      } finally {
        setIsLoadingCashFlow(false);
      }
      
      // Load loan status report
      try {
        const loanStatusReport = await fetchLoanApplicationsReport(token);
        setLoanStatusData(loanStatusReport);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load loan status report');
      } finally {
        setIsLoadingLoanStatus(false);
      }
    };

    loadReports();
  }, [token, startDate, endDate, showToast]);

  const handleDateRangeChange = async () => {
    if (!token) return;
    
    setIsLoadingCashFlow(true);
    
    try {
      const cashFlowReport = await fetchCashFlowReport(token, startDate, endDate);
      setCashFlowData(cashFlowReport);
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load cash flow report');
    } finally {
      setIsLoadingCashFlow(false);
    }
  };

  // Calculate totals for cash flow
  const totalIncome = cashFlowData.reduce((sum, item) => sum + item.income, 0);
  const totalExpense = cashFlowData.reduce((sum, item) => sum + item.expense, 0);
  const netCashFlow = totalIncome - totalExpense;

  // Calculate totals for loan status
  const totalApplications = loanStatusData.reduce((sum, item) => sum + item.count, 0);
  const approvedCount = loanStatusData.find(item => item.status === 'approved')?.count || 0;
  const pendingCount = loanStatusData.find(item => item.status === 'pending')?.count || 0;
  const rejectedCount = loanStatusData.find(item => item.status === 'rejected')?.count || 0;

  return (
    <PageContainer title="Reports">
      {/* Cash Flow Report */}
      <Card className="mb-6">
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle className="mb-4 md:mb-0">Cash Flow Report</CardTitle>
            
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
                <button
                  onClick={handleDateRangeChange}
                  className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
                  disabled={isLoadingCashFlow}
                >
                  {isLoadingCashFlow ? (
                    <Loader2 className="animate-spin h-5 w-5" />
                  ) : (
                    'Apply'
                  )}
                </button>
              </div>
              
              <button
                className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                <Download className="h-5 w-5 mr-2" />
                Export
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingCashFlow ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Total Income</p><h3 className="text-2xl font-bold text-green-700">
                    {formatCurrency(totalIncome)}
                  </h3>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-700">Total Expenses</p>
                  <h3 className="text-2xl font-bold text-red-700">
                    {formatCurrency(totalExpense)}
                  </h3>
                </div>
                
                <div className={`p-4 rounded-lg ${
                  netCashFlow >= 0 ? 'bg-blue-50' : 'bg-orange-50'
                }`}>
                  <p className={`text-sm font-medium ${
                    netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    Net Cash Flow
                  </p>
                  <h3 className={`text-2xl font-bold ${
                    netCashFlow >= 0 ? 'text-blue-700' : 'text-orange-700'
                  }`}>
                    {formatCurrency(Math.abs(netCashFlow))}
                    {netCashFlow < 0 && ' (Deficit)'}
                  </h3>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Income
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Expense
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Net
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cashFlowData.length > 0 ? (
                      cashFlowData.map((item, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {formatDate(item.date)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-green-600">
                              {formatCurrency(item.income)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-red-600">
                              {formatCurrency(item.expense)}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className={`text-sm ${
                              item.income - item.expense >= 0 ? 'text-blue-600' : 'text-orange-600'
                            }`}>
                              {formatCurrency(item.income - item.expense)}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan={4}
                          className="px-6 py-4 text-center text-sm text-gray-500"
                        >
                          No cash flow data available for the selected period
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
      
      {/* Loan Applications Report */}
      <Card>
        <CardHeader className="pb-0">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
            <CardTitle className="mb-4 md:mb-0">Loan Applications Report</CardTitle>
            
            <button
              className="flex items-center px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Download className="h-5 w-5 mr-2" />
              Export
            </button>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {isLoadingLoanStatus ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Total Applications</p>
                  <h3 className="text-2xl font-bold text-gray-700">
                    {totalApplications}
                  </h3>
                </div>
                
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-green-700">Approved</p>
                  <h3 className="text-2xl font-bold text-green-700">
                    {approvedCount}
                    <span className="text-sm font-normal ml-2">
                      ({totalApplications > 0 ? Math.round((approvedCount / totalApplications) * 100) : 0}%)
                    </span>
                  </h3>
                </div>
                
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-yellow-700">Pending</p>
                  <h3 className="text-2xl font-bold text-yellow-700">
                    {pendingCount}
                    <span className="text-sm font-normal ml-2">
                      ({totalApplications > 0 ? Math.round((pendingCount / totalApplications) * 100) : 0}%)
                    </span>
                  </h3>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-red-700">Rejected</p>
                  <h3 className="text-2xl font-bold text-red-700">
                    {rejectedCount}
                    <span className="text-sm font-normal ml-2">
                      ({totalApplications > 0 ? Math.round((rejectedCount / totalApplications) * 100) : 0}%)
                    </span>
                  </h3>
                </div>
              </div>
              
              <div className="flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/2">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">Loan Status Distribution</h4>
                  <div className="bg-gray-50 p-6 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <PieChart className="h-12 w-12 mx-auto mb-2" />
                      <p>Pie chart visualization would be displayed here</p>
                      <p className="text-sm">Showing distribution of loan application statuses</p>
                    </div>
                  </div>
                </div>
                
                <div className="w-full md:w-1/2">
                  <h4 className="text-lg font-medium text-gray-700 mb-4">Monthly Application Trend</h4>
                  <div className="bg-gray-50 p-6 rounded-lg h-64 flex items-center justify-center">
                    <div className="text-center text-gray-500">
                      <BarChart3 className="h-12 w-12 mx-auto mb-2" />
                      <p>Bar chart visualization would be displayed here</p>
                      <p className="text-sm">Showing monthly trend of loan applications</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}