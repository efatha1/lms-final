import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchCashFlow, createCashFlow, updateCashFlow, deleteCashFlow } from '../api/cashFlow';
import { PageContainer } from '../components/layout/PageContainer';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Modal } from '../components/ui/modal';
import { CashFlow } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Lock
} from 'lucide-react';

export default function CashFlowPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [transactions, setTransactions] = useState<CashFlow[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<CashFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<CashFlow | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Summary calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income' || t.type === 'loan_repayment')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' || t.type === 'loan_disbursement')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netCashFlow = totalIncome - totalExpenses;

  useEffect(() => {
    const loadTransactions = async () => {
      if (!token) return;
      
      try {
        const data = await fetchCashFlow(token);
        setTransactions(data);
        setFilteredTransactions(data);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load cash flow data');
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, [token, showToast]);

  // Filter transactions based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredTransactions(transactions);
    } else {
      const lowercaseQuery = searchQuery.toLowerCase();
      const filtered = transactions.filter(
        transaction => 
          transaction.description.toLowerCase().includes(lowercaseQuery) ||
          transaction.type.toLowerCase().includes(lowercaseQuery) ||
          transaction.amount.toString().includes(lowercaseQuery) ||
          formatDate(transaction.date).toLowerCase().includes(lowercaseQuery)
      );
      setFilteredTransactions(filtered);
    }
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, transactions]);

  // Get current transactions for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentTransactions = filteredTransactions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setIsSubmitting(true);
    
    // Validate form
    if (!formData.amount || !formData.description || !formData.date) {
      showToast('error', 'Validation Error', 'Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const newTransaction = await createCashFlow(token, {
        type: formData.type as 'income' | 'expense',
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      });
      
      // Update local state
      setTransactions([newTransaction, ...transactions]);
      
      showToast('success', 'Transaction Created', 'Cash flow transaction created successfully');
      
      // Reset form and close modal
      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to create transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedTransaction) return;
    
    setIsSubmitting(true);
    
    // Validate form
    if (!formData.amount || !formData.description || !formData.date) {
      showToast('error', 'Validation Error', 'Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const updatedTransaction = await updateCashFlow(token, selectedTransaction.id, {
        type: formData.type as 'income' | 'expense',
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      });
      
      // Update local state
      setTransactions(transactions.map(t => 
        t.id === selectedTransaction.id ? updatedTransaction : t
      ));
      
      showToast('success', 'Transaction Updated', 'Cash flow transaction updated successfully');
      
      // Reset form and close modal
      resetForm();
      setIsEditModalOpen(false);
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to update transaction');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: number) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this transaction?')) {
      return;
    }
    
    try {
      await deleteCashFlow(token, id);
      
      // Update local state
      setTransactions(transactions.filter(t => t.id !== id));
      
      showToast('success', 'Transaction Deleted', 'Cash flow transaction deleted successfully');
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to delete transaction');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = (transaction: CashFlow) => {
    // Check if this is a system-generated transaction
    if (transaction.type === 'loan_disbursement' || transaction.type === 'loan_repayment') {
      showToast('info', 'System Transaction', 'Loan-related transactions are generated automatically and cannot be edited');
      return;
    }
    
    setSelectedTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount.toString(),
      description: transaction.description,
      date: new Date(transaction.date).toISOString().split('T')[0],
    });
    setIsEditModalOpen(true);
  };

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
      <PageContainer title="Cash Flow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Cash Flow">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardContent className="flex items-center py-4">
            <div className="p-3 rounded-full bg-green-100 text-green-600 mr-4">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Income</p>
              <h3 className="text-2xl font-bold text-green-600">{formatCurrency(totalIncome)}</h3>
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
              <h3 className="text-2xl font-bold text-red-600">{formatCurrency(totalExpenses)}</h3>
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
      
      {/* Transactions Table */}
      <Card className="mb-6">
        <div className="p-6">
          <div className="flex flex-col md:flex-row justify-between mb-4">
            <div className="relative mb-4 md:mb-0 md:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
            </div>
            
            <button
              onClick={() => {
                resetForm();
                setIsCreateModalOpen(true);
              }}
              className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Transaction
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentTransactions.length > 0 ? (
                  currentTransactions.map(transaction => {
                    const typeInfo = getTransactionTypeInfo(transaction.type);
                    const isSystemTransaction = transaction.type === 'loan_disbursement' || transaction.type === 'loan_repayment';
                    
                    return (
                      <tr key={transaction.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          {formatDate(transaction.date)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {transaction.description}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeInfo.className}`}
                          >
                            {typeInfo.icon}
                            {typeInfo.label}
                          </span>
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
                          <div className="flex space-x-2">
                            {isSystemTransaction ? (
                              <span className="text-gray-400 flex items-center" title="System-generated transaction">
                                <Lock className="h-5 w-5" />
                              </span>
                            ) : (
                              <>
                                <button
                                  onClick={() => openEditModal(transaction)}
                                  className="p-1 text-blue-600 hover:text-blue-800"
                                >
                                  <Edit2 className="h-5 w-5" />
                                </button>
                                
                                <button
                                  onClick={() => handleDeleteTransaction(transaction.id)}
                                  className="p-1 text-red-600 hover:text-red-800"
                                >
                                  <Trash2 className="h-5 w-5" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No transactions found
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
      
      {/* Create Transaction Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateModalOpen(false);
            resetForm();
          }
        }}
        title="Create Transaction"
        size="md"
      >
        <form onSubmit={handleCreateTransaction}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={isSubmitting}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                Note: Loan disbursements and repayments are automatically recorded when loans are approved or repayments are made.
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                min="0.01"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) {
                  setIsCreateModalOpen(false);
                  resetForm();
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                  Submitting...
                </>
              ) : (
                'Create Transaction'
              )}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Edit Transaction Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsEditModalOpen(false);
            resetForm();
          }
        }}
        title="Edit Transaction"
        size="md"
      >
        <form onSubmit={handleEditTransaction}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Type *
              </label>
              <select
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={isSubmitting}
              >
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount *
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                min="0.01"
                step="0.01"
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description *
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                rows={3}
                required
                disabled={isSubmitting}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={() => {
                if (!isSubmitting) {
                  setIsEditModalOpen(false);
                  resetForm();
                }
              }}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4 mr-2 inline" />
                  Updating...
                </>
              ) : (
                'Update Transaction'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}