import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchCashFlowReport, fetchLoanApplicationsReport } from '../api/reports';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../components/ui/select';
import { Button } from '../components/ui/button';
import { CashFlowReport, LoanStatusReport } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

export default function ReportsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [reportType, setReportType] = useState<'cashflow' | 'loanApplications'>('cashflow');
  const [cashFlowData, setCashFlowData] = useState<CashFlowReport[]>([]);
  const [loanApplicationsData, setLoanApplicationsData] = useState<LoanStatusReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReportData = async () => {
      if (!token) return;
      
      setIsLoading(true);
      try {
        if (reportType === 'cashflow') {
          const endDate = new Date();
          const startDate = new Date();
          startDate.setMonth(startDate.getMonth() - 1);
          const data = await fetchCashFlowReport(token, startDate.toISOString(), endDate.toISOString());
          setCashFlowData(data);
        } else {
          const data = await fetchLoanApplicationsReport(token);
          setLoanApplicationsData(data);
        }
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load report data');
      } finally {
        setIsLoading(false);
      }
    };

    loadReportData();
  }, [token, reportType, showToast]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    
    if (reportType === 'cashflow') {
      doc.text('Cash Flow Report', 14, 15);
      const tableData = cashFlowData.map(item => [
        formatDate(item.date),
        formatCurrency(item.income),
        formatCurrency(item.expense)
      ]);
      doc.autoTable({
        head: [['Date', 'Income', 'Expense']],
        body: tableData,
        startY: 20
      });
    } else {
      doc.text('Loan Applications Report', 14, 15);
      const tableData = loanApplicationsData.map(item => [
        item.status,
        item.count.toString()
      ]);
      doc.autoTable({
        head: [['Status', 'Count']],
        body: tableData,
        startY: 20
      });
    }
    
    doc.save(`${reportType}-report.pdf`);
  };

  return (
    <PageContainer title="Reports">
      <Card className="mb-6">
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Report</CardTitle>
            <div className="flex items-center space-x-4">
              <Select value={reportType} onValueChange={(value: 'cashflow' | 'loanApplications') => setReportType(value)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cashflow">Cash Flow</SelectItem>
                  <SelectItem value="loanApplications">Loan Applications</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={handleDownloadPDF}>Download PDF</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : (
            <div className="h-96">
              <ResponsiveContainer width="100%" height="100%">
                {reportType === 'cashflow' ? (
                  <BarChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" tickFormatter={(value) => formatDate(value)} />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip 
                      formatter={(value: number) => formatCurrency(value)}
                      labelFormatter={(label) => formatDate(label as string)}
                    />
                    <Legend />
                    <Bar dataKey="income" fill="#4CAF50" name="Income" />
                    <Bar dataKey="expense" fill="#F44336" name="Expense" />
                  </BarChart>
                ) : (
                  <BarChart data={loanApplicationsData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="status" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" fill="#2196F3" name="Applications" />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}