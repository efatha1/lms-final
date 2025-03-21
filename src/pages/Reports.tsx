import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchCashFlowReport, fetchLoanApplicationsReport } from '../api/reports';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { CashFlowReport, LoanStatusReport } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Download, FileText, DollarSign, Info } from 'lucide-react';

export default function Reports() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [cashFlowData, setCashFlowData] = useState<CashFlowReport[]>([]);
  const [loanStatusData, setLoanStatusData] = useState<LoanStatusReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState<string | null>(null);
  
  // Date range for cash flow report
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    const loadReportData = async () => {
      if (!token) return;
      
      try {
        const [cashFlowData, loanStatusData] = await Promise.all([
          fetchCashFlowReport(token, dateRange.startDate, dateRange.endDate),
          fetchLoanApplicationsReport(token),
        ]);
        
        setCashFlowData(cashFlowData);
        setLoanStatusData(loanStatusData);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [token, dateRange, showToast]);

  const handleDateRangeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  const handleDownloadReport = (reportType: string) => {
    setIsExporting(reportType);
    
    try {
      let csvContent = '';
      let filename = '';
      
      if (reportType === 'Cash Flow') {
        // Create CSV header
        csvContent = 'Date,Income,Expense,Net Cash Flow\\n';
        
        // Add data rows
        cashFlowData.forEach(item => {
          const netCashFlow = item.income - item.expense;
          csvContent += `${item.date},${item.income.toFixed(2)},${item.expense.toFixed(2)},${netCashFlow.toFixed(2)}\\n`;
        });
        
        // Add summary row
        const totalIncome = cashFlowData.reduce((sum, item) => sum + item.income, 0);
        const totalExpense = cashFlowData.reduce((sum, item) => sum + item.expense, 0);
        const totalNetCashFlow = totalIncome - totalExpense;
        csvContent += `\\nTotal,${totalIncome.toFixed(2)},${totalExpense.toFixed(2)},${totalNetCashFlow.toFixed(2)}\\n`;
        
        filename = `cash_flow_report_${dateRange.startDate}_to_${dateRange.endDate}.csv`;
      } else if (reportType === 'Loan Applications') {
        // Create CSV header
        csvContent = 'Status,Count,Percentage\\n';
        
        // Calculate total
        const totalApplications = loanStatusData.reduce((sum, item) => sum + item.count, 0);
        
        // Add data rows
        loanStatusData.forEach(item => {
          const percentage = totalApplications > 0 ? (item.count / totalApplications * 100).toFixed(2) : '0.00';
          csvContent += `${item.status},${item.count},${percentage}%\\n`;
        });
        
        // Add summary row
        csvContent += `\\nTotal,${totalApplications},100.00%\\n`;
        
        filename = `loan_applications_report_${new Date().toISOString().split('T')[0]}.csv`;
      }
      
      // Create a blob and download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      showToast('success', 'Download Complete', `${reportType} report downloaded successfully`);
    } catch (error) {
      showToast('error', 'Export Error', error instanceof Error ? error.message : 'Failed to export report');
    } finally {
      setIsExporting(null);
    }
  };

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  if (isLoading) {
    return (
      <PageContainer title="Reports">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Reports">
      {/* Cash Flow Report */}
      <Card className="mb-8">
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Cash Flow Report</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Income vs. Expenses over time</p>
          </div>
          
          <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-4 mt-4 md:mt-0">
            <div className="flex items-center space-x-2">
              <label htmlFor="startDate" className="text-sm font-medium text-gray-700">
                From:
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateRangeChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <label htmlFor="endDate" className="text-sm font-medium text-gray-700">
                To:
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateRangeChange}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            
            <button
              onClick={() => handleDownloadReport('Cash Flow')}
              disabled={isExporting === 'Cash Flow' || cashFlowData.length === 0}
              className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              {isExporting === 'Cash Flow' ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting === 'Cash Flow' ? 'Exporting...' : 'Export CSV'}
            </button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start">
            <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
            <div>
              <p className="text-sm text-blue-700">
                <strong>Note:</strong> Income includes regular income and loan repayments. Expenses include regular expenses and loan disbursements.
              </p>
            </div>
          </div>
          
          <div className="h-80 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
            {cashFlowData.length > 0 ? (
              <div className="w-full h-full">
                <div className="text-center mb-4">
                  <h3 className="text-lg font-medium">Cash Flow Chart</h3>
                  <p className="text-sm text-gray-500">Income vs Expenses</p>
                </div>
                <div className="flex justify-center">
                  <div className="flex space-x-4">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-500 rounded-full mr-2"></div>
                      <span className="text-sm">Income</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-500 rounded-full mr-2"></div>
                      <span className="text-sm">Expense</span>
                    </div>
                  </div>
                </div>
                <div className="text-center mt-8 text-gray-500">
                  <p>Chart visualization would appear here</p>
                  <p className="text-sm mt-2">Data loaded successfully for the selected date range</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No cash flow data available for the selected date range</p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Income</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      cashFlowData.reduce((sum, item) => sum + item.income, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                  <p className="text-xl font-bold text-gray-900">
                    {formatCurrency(
                      cashFlowData.reduce((sum, item) => sum + item.expense, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Cash Flow Data Table */}
          {cashFlowData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Cash Flow Details</h3>
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
                        Net Cash Flow
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {cashFlowData.map((item, index) => {
                      const netCashFlow = item.income - item.expense;
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(item.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.income)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatCurrency(item.expense)}
                          </td>
                          <td className={`px-6 py-4 whitespace-nowrap text-sm ${netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatCurrency(netCashFlow)}
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(cashFlowData.reduce((sum, item) => sum + item.income, 0))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatCurrency(cashFlowData.reduce((sum, item) => sum + item.expense, 0))}
                      </td>
                      <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                        cashFlowData.reduce((sum, item) => sum + item.income, 0) >= 
                        cashFlowData.reduce((sum, item) => sum + item.expense, 0) 
                          ? 'text-green-600' 
                          : 'text-red-600'
                      }`}>
                        {formatCurrency(
                          cashFlowData.reduce((sum, item) => sum + item.income, 0) - 
                          cashFlowData.reduce((sum, item) => sum + item.expense, 0)
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Loan Applications Report */}
      <Card>
        <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Loan Applications Report</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Distribution by status</p>
          </div>
          
          <button
            onClick={() => handleDownloadReport('Loan Applications')}
            disabled={isExporting === 'Loan Applications' || loanStatusData.length === 0}
            className="flex items-center px-3 py-2 bg-primary text-white rounded-md text-sm hover:bg-primary-dark disabled:bg-gray-300 disabled:cursor-not-allowed mt-4 md:mt-0"
          >
            {isExporting === 'Loan Applications' ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            {isExporting === 'Loan Applications' ? 'Exporting...' : 'Export CSV'}
          </button>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="h-64 bg-gray-50 rounded-lg p-4 flex items-center justify-center">
              {loanStatusData.length > 0 ? (
                <div className="w-full h-full">
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-medium">Application Status</h3>
                    <p className="text-sm text-gray-500">Distribution by status</p>
                  </div>
                  <div className="flex justify-center">
                    {loanStatusData.map((item, index) => (
                      <div key={item.status} className="flex items-center mx-2">
                        <div 
                          className="w-4 h-4 rounded-full mr-2" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <span className="text-sm">{item.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="text-center mt-8 text-gray-500">
                    <p>Pie chart visualization would appear here</p>
                    <p className="text-sm mt-2">Data loaded successfully</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-center h-full">
                  <p className="text-gray-500">No loan application data available</p>
                </div>
              )}
            </div>
            
            <div className="flex flex-col justify-center">
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-gray-900">Summary</h3>
                
                <div className="grid grid-cols-1 gap-3">
                  {loanStatusData.map((item, index) => (
                    <div key={item.status} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 rounded-full mr-3" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        ></div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </p>
                          <p className="text-lg font-bold text-gray-900">
                            {item.count} applications
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="flex items-center">
                      <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                        <FileText className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Total Applications</p>
                        <p className="text-lg font-bold text-gray-900">
                          {loanStatusData.reduce((sum, item) => sum + item.count, 0)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Loan Applications Data Table */}
          {loanStatusData.length > 0 && (
            <div className="mt-6">
              <h3 className="text-lg font-medium mb-4">Application Status Details</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Count
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Percentage
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {loanStatusData.map((item, index) => {
                      const totalApplications = loanStatusData.reduce((sum, item) => sum + item.count, 0);
                      const percentage = totalApplications > 0 ? (item.count / totalApplications * 100).toFixed(2) : '0.00';
                      
                      return (
                        <tr key={index} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {item.count}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {percentage}%
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-gray-50 font-medium">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Total
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {loanStatusData.reduce((sum, item) => sum + item.count, 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        100.00%
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}