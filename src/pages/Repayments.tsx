import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchRepayments, markRepaymentAsPaid } from '../api/repayments';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { LoanRepayment } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function RepaymentsPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [repayments, setRepayments] = useState<LoanRepayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    const loadRepayments = async () => {
      if (!token) return;
      
      try {
        const data = await fetchRepayments(token);
        setRepayments(data);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load repayments');
      } finally {
        setIsLoading(false);
      }
    };

    loadRepayments();
  }, [token, showToast]);

  // Calculate summary values
  const totalDue = repayments.reduce((sum, repayment) => sum + repayment.total_loan - repayment.amount_paid, 0);
  const overdue = repayments.filter(repayment => !repayment.paid && new Date(repayment.due_date) < new Date()).length;
  const dueSoon = repayments.filter(repayment => {
    const dueDate = new Date(repayment.due_date);
    const oneMonthFromNow = new Date();
    oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);
    return !repayment.paid && dueDate <= oneMonthFromNow && dueDate >= new Date();
  }).reduce((sum, repayment) => sum + repayment.amount, 0);

  // Filter and sort repayments
  const filteredRepayments = repayments
    .filter(repayment => 
      repayment.applicant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repayment.nida_id.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (a.paid === b.paid) {
        return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      }
      return a.paid ? 1 : -1;
    });

  // Get current repayments for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentRepayments = filteredRepayments.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRepayments.length / itemsPerPage);

  const handleMarkAsPaid = async (id: number) => {
    if (!token) return;
    
    try {
      await markRepaymentAsPaid(token, id);
      
      // Update local state
      setRepayments(repayments.map(repayment => 
        repayment.id === id ? { ...repayment, paid: true, paid_date: new Date().toISOString() } : repayment
      ));
      
      showToast('success', 'Repayment Marked as Paid', 'Repayment has been successfully marked as paid');
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to mark repayment as paid');
    }
  };

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
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600 mr-4">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Due</p>
              <h3 className="text-2xl font-bold">{formatCurrency(totalDue)}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-red-100 text-red-600 mr-4">
              <XCircle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <h3 className="text-2xl font-bold">{overdue}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600 mr-4">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Due Soon</p>
              <h3 className="text-2xl font-bold">{formatCurrency(dueSoon)}</h3>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Repayments Table */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex justify-between mb-4">
            <div className="relative w-64">
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
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentRepayments.map((repayment) => (
                  <tr key={repayment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{repayment.applicant_name}</div>
                      <div className="text-sm text-gray-500">{repayment.nida_id}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatDate(repayment.due_date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {formatCurrency(repayment.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {repayment.paid ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Paid
                        </span>
                      ) : new Date(repayment.due_date) < new Date() ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                          Overdue
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {!repayment.paid && (
                        <button
                          onClick={() => handleMarkAsPaid(repayment.id)}
                          className="text-green-600 hover:text-green-900"
                        >
                          <CheckCircle className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
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