import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchRepayments, markRepaymentAsPaid } from '../api/repayments';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/card';
import { LoanRepayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Search, 
  CheckCircle, 
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Calendar
} from 'lucide-react';

export default function Repayments() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [filteredRepayments, setFilteredRepayments] = useState<LoanRepayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDueDate, setFilterDueDate] = useState<string>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Processing state
  const [processingId, setProcessingId] = useState<number | null>(null);

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

  // Filter and search
  useEffect(() => {
    let filtered = [...repayments];
    
    // Filter by status
    if (filterStatus !== 'all') {
      const isPaid = filterStatus === 'paid';
      filtered = filtered.filter(item => item.paid === isPaid);
    }
    
    // Filter by due date
    if (filterDueDate) {
      filtered = filtered.filter(item => {
        const itemDate = new Date(item.due_date).toISOString().split('T')[0];
        return itemDate === filterDueDate;
      });
    }
    
    // Filter by search query
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => 
          (item.applicant_name && item.applicant_name.toLowerCase().includes(lowercaseQuery)) ||
          (item.nida_id && item.nida_id.toLowerCase().includes(lowercaseQuery)) ||
          item.amount.toString().includes(lowercaseQuery)
      );
    }
    
    setFilteredRepayments(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, filterStatus, filterDueDate, repayments]);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRepayments = filteredRepayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepayments.length / itemsPerPage);

  // Calculate summary
  const totalDue = filteredRepayments
    .filter(item => !item.paid)
    .reduce((sum, item) => sum + item.amount, 0);
    
  const totalPaid = filteredRepayments
    .filter(item => item.paid)
    .reduce((sum, item) => sum + item.amount, 0);
    
  const overdueCount = filteredRepayments
    .filter(item => !item.paid && new Date(item.due_date) < new Date())
    .length;

  const handleMarkAsPaid = async (id: number) => {
    if (!token) return;
    
    setProcessingId(id);
    
    try {
      await markRepaymentAsPaid(token, id);
      
      // Update local state
      setRepayments(repayments.map(item => 
        item.id === id ? { ...item, paid: true, paid_date: new Date().toISOString() } : item
      ));
      
      showToast('success', 'Payment Recorded', 'Repayment marked as paid successfully');
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to mark repayment as paid');
    } finally {
      setProcessingId(null);
    }
  };

  if (isLoading) {
    return (
      <PageContainer title="Repayments">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Repayments">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Due</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalDue)}
                </h3>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Paid</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalPaid)}
                </h3>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Overdue Payments</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {overdueCount}
                </h3>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-4 md:mb-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="Search applicant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Status</option>
                    <option value="paid">Paid</option>
                    <option value="unpaid">Unpaid</option>
                  </select>
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="date"
                    value={filterDueDate}
                    onChange={(e) => setFilterDueDate(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="Filter by due date"
                  />
                </div>
              </div>
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
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Due Date
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
                    <tr key={repayment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="font-medium">{repayment.applicant_name}</div>
                        <div className="text-sm text-gray-500">{repayment.nida_id}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium">{formatCurrency(repayment.amount)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          !repayment.paid && new Date(repayment.due_date) < new Date()
                            ? 'text-red-600 font-medium'
                            : 'text-gray-900'
                        }`}>
                          {formatDate(repayment.due_date)}
                          {!repayment.paid && new Date(repayment.due_date) < new Date() && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Overdue
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {repayment.paid ? (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Paid on {formatDate(repayment.paid_date || '')}
                          </div>
                        ) : (
                          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            Unpaid
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {!repayment.paid && (
                          <button
                            onClick={() => handleMarkAsPaid(repayment.id)}
                            disabled={processingId === repayment.id}
                            className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                          >
                            {processingId === repayment.id ? (
                              <>
                                <Loader2 className="animate-spin h-4 w-4 mr-2" />
                                Processing...
                              </>
                            ) : (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Mark as Paid
                              </>
                            )}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
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