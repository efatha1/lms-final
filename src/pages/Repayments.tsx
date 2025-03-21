import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchRepayments, markRepaymentAsPaid } from '../api/repayments';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/card';
import { StatusBadge } from '../components/ui/status-badge';
import { LoanRepayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { Search, CheckCircle, AlertCircle, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

export default function Repayments() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [filteredRepayments, setFilteredRepayments] = useState<LoanRepayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState<number | null>(null);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadRepayments = async () => {
      if (!token) return;
      
      try {
        const data = await fetchRepayments(token);
        setRepayments(data);
        setFilteredRepayments(data);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load repayments');
      } finally {
        setIsLoading(false);
      }
    };

    loadRepayments();
  }, [token, showToast]);

  // Filter and sort repayments based on search query and paid status
  useEffect(() => {
    let filtered = [...repayments];
    
    // Apply search filter if query exists
    if (searchQuery.trim()) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        repayment => 
          (repayment.applicant_name?.toLowerCase() || '').includes(lowercaseQuery) ||
          (repayment.nida_id?.toLowerCase() || '').includes(lowercaseQuery) ||
          repayment.amount.toString().includes(lowercaseQuery)
      );
    }
    
    // Sort repayments: unpaid first (sorted by due date), then paid
    filtered.sort((a, b) => {
      // First sort by paid status (unpaid first)
      if (a.paid !== b.paid) {
        return a.paid ? 1 : -1;
      }
      
      // For unpaid repayments, sort by due date (ascending)
      if (!a.paid) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      
      // For paid repayments, sort by paid date (descending)
      if (a.paid_date && b.paid_date) {
        return new Date(b.paid_date).getTime() - new Date(a.paid_date).getTime();
      }
      
      return 0;
    });
    
    setFilteredRepayments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, repayments]);

  // Get current repayments for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRepayments = filteredRepayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepayments.length / itemsPerPage);

  const handleMarkAsPaid = async (id: number) => {
    if (!token) return;
    
    setIsProcessing(id);
    
    try {
      const updatedRepayment = await markRepaymentAsPaid(token, id);
      
      // Update local state
      setRepayments(repayments.map(repayment => 
        repayment.id === id ? updatedRepayment : repayment
      ));
      
      showToast('success', 'Payment Recorded', 'Repayment marked as paid successfully');
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to mark repayment as paid');
    } finally {
      setIsProcessing(null);
    }
  };

  const getRepaymentStatus = (repayment: LoanRepayment): 'paid' | 'overdue' | 'due-soon' => {
    if (repayment.paid) return 'paid';
    
    const dueDate = new Date(repayment.due_date);
    const today = new Date();
    
    // If due date is in the past, it's overdue
    if (dueDate < today) return 'overdue';
    
    // If due date is within the next 7 days, it's due soon
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);
    
    if (dueDate <= sevenDaysFromNow) return 'due-soon';
    
    // Default to due-soon for unpaid repayments
    return 'due-soon';
  };

  // Calculate summary stats
  const totalDue = repayments
    .filter(r => !r.paid)
    .reduce((sum, r) => sum + r.amount, 0);
    
  const overdue = repayments
    .filter(r => !r.paid && new Date(r.due_date) < new Date())
    .reduce((sum, r) => sum + r.amount, 0);
    
  const dueSoon = repayments
    .filter(r => {
      if (r.paid) return false;
      const dueDate = new Date(r.due_date);
      const today = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(today.getDate() + 7);
      return dueDate >= today && dueDate <= sevenDaysFromNow;
    })
    .reduce((sum, r) => sum + r.amount, 0);

  if (isLoading) {
    return (
      <PageContainer title="Repayments">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Repayments">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Due</p>
              <h3 className="text-2xl font-bold text-gray-900">{formatCurrency(totalDue)}</h3>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <AlertCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(overdue)}</h3>
            </div>
          </div>
        </Card>
        
        <Card>
          <div className="p-6 flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Due Soon</p>
              <h3 className="text-2xl font-bold text-yellow-600">{formatCurrency(dueSoon)}</h3>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Repayments Table */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="relative mb-4 md:mb-0 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search repayments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Applicant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Loan
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRepayments.length > 0 ? (
                  currentRepayments.map(repayment => (
                    <tr key={repayment.id} className={`hover:bg-gray-50 ${repayment.paid ? 'bg-gray-50' : ''}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{repayment.applicant_name}</div>
                        <div className="text-sm text-gray-500">{repayment.nida_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatDate(repayment.due_date)}
                        {repayment.paid && repayment.paid_date && (
                          <div className="text-sm text-gray-500">
                            Paid on: {formatDate(repayment.paid_date)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(repayment.amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(repayment.total_loan || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {formatCurrency(repayment.amount_paid || 0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={getRepaymentStatus(repayment)} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleMarkAsPaid(repayment.id)}
                          disabled={repayment.paid || isProcessing === repayment.id}
                          className={`px-3 py-1 rounded-md text-sm font-medium flex items-center ${
                            repayment.paid || isProcessing === repayment.id
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-green-100 text-green-700 hover:bg-green-200'
                          }`}
                        >
                          {isProcessing === repayment.id ? (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-700 mr-2"></div>
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          {repayment.paid ? 'Paid' : 'Mark as Paid'}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No repayments found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="flex items-center">
                <span className="text-sm text-gray-700">
                  Page {currentPage} of {totalPages}
                </span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage <= 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 flex items-center"
                >
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 flex items-center"
                >
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </PageContainer>
  );
}