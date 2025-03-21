import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { fetchCashFlow, createCashFlow, updateCashFlow, deleteCashFlow } from '../api/cashFlow';
import { PageContainer } from '../components/layout/PageContainer';
import { Card } from '../components/ui/card';
import { Modal } from '../components/ui/modal';
import { CashFlow } from '../types';
import { formatCurrency, formatDate } from '../utils/formatters';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  TrendingUp, 
  TrendingDown,
  Loader2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export default function CashFlowPage() {
  const { token } = useAuth();
  const { showToast } = useToast();
  const [cashFlowData, setCashFlowData] = useState<CashFlow[]>([]);
  const [filteredData, setFilteredData] = useState<CashFlow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCashFlow, setSelectedCashFlow] = useState<CashFlow | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    type: 'income',
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const loadCashFlowData = async () => {
      if (!token) return;
      
      try {
        const data = await fetchCashFlow(token);
        setCashFlowData(data);
        setFilteredData(data);
      } catch (error) {
        showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to load cash flow data');
      } finally {
        setIsLoading(false);
      }
    };

    loadCashFlowData();
  }, [token, showToast]);

  // Filter and search
  useEffect(() => {
    let filtered = [...cashFlowData];
    
    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }
    
    // Filter by search query
    if (searchQuery) {
      const lowercaseQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        item => 
          item.description.toLowerCase().includes(lowercaseQuery) ||
          item.amount.toString().includes(lowercaseQuery) ||
          formatDate(item.date).toLowerCase().includes(lowercaseQuery)
      );
    }
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [searchQuery, filterType, cashFlowData]);

  // Get current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  // Calculate totals
  const totalIncome = filteredData
    .filter(item => item.type === 'income' || item.type === 'loan_repayment')
    .reduce((sum, item) => sum + item.amount, 0);
    
  const totalExpense = filteredData
    .filter(item => item.type === 'expense' || item.type === 'loan_disbursement')
    .reduce((sum, item) => sum + item.amount, 0);
    
  const netCashFlow = totalIncome - totalExpense;

  const handleCreateCashFlow = async (e: React.FormEvent) => {
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
      const newCashFlow = await createCashFlow(token, {
        type: formData.type as 'income' | 'expense' | 'loan_disbursement' | 'loan_repayment',
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      });
      
      // Update local state
      setCashFlowData([newCashFlow, ...cashFlowData]);
      
      showToast('success', 'Cash Flow Created', 'Cash flow entry created successfully');
      
      // Reset form and close modal
      resetForm();
      setIsCreateModalOpen(false);
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to create cash flow entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCashFlow = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCashFlow) return;
    
    setIsSubmitting(true);
    
    // Validate form
    if (!formData.amount || !formData.description || !formData.date) {
      showToast('error', 'Validation Error', 'Please fill in all required fields');
      setIsSubmitting(false);
      return;
    }
    
    try {
      const updatedCashFlow = await updateCashFlow(token, selectedCashFlow.id, {
        type: formData.type as 'income' | 'expense' | 'loan_disbursement' | 'loan_repayment',
        amount: parseFloat(formData.amount),
        description: formData.description,
        date: formData.date,
      });
      
      // Update local state
      setCashFlowData(cashFlowData.map(item => 
        item.id === selectedCashFlow.id ? updatedCashFlow : item
      ));
      
      showToast('success', 'Cash Flow Updated', 'Cash flow entry updated successfully');
      
      // Reset form and close modal
      resetForm();
      setIsEditModalOpen(false);
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to update cash flow entry');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCashFlow = async (id: number) => {
    if (!token) return;
    
    if (!window.confirm('Are you sure you want to delete this cash flow entry?')) {
      return;
    }
    
    try {
      await deleteCashFlow(token, id);
      
      // Update local state
      setCashFlowData(cashFlowData.filter(item => item.id !== id));
      
      showToast('success', 'Cash Flow Deleted', 'Cash flow entry deleted successfully');
    } catch (error) {
      showToast('error', 'Error', error instanceof Error ? error.message : 'Failed to delete cash flow entry');
    }
  };

  const resetForm = () => {
    setFormData({
      type: 'income',
      amount: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
    });
    setSelectedCashFlow(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = (cashFlow: CashFlow) => {
    setSelectedCashFlow(cashFlow);
    setFormData({
      type: cashFlow.type,
      amount: cashFlow.amount.toString(),
      description: cashFlow.description,
      date: new Date(cashFlow.date).toISOString().split('T')[0],
    });
    setIsEditModalOpen(true);
  };

  if (isLoading) {
    return (
      <PageContainer title="Cash Flow">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer title="Cash Flow">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-green-100 text-green-600">
                <TrendingUp className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Income</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalIncome)}
                </h3>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className="p-3 rounded-full bg-red-100 text-red-600">
                <TrendingDown className="h-6 w-6" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Expenses</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {formatCurrency(totalExpense)}
                </h3>
              </div>
            </div>
          </div>
        </Card>

        <Card>
          <div className="p-6">
            <div className="flex items-center">
              <div className={`p-3 rounded-full ${
                netCashFlow >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {netCashFlow >= 0 ? (
                  <TrendingUp className="h-6 w-6" />
                ) : (
                  <TrendingDown className="h-6 w-6" />
                )}
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Net Cash Flow</p>
                <h3 className={`text-2xl font-bold ${
                  netCashFlow >= 0 ? 'text-blue-600' : 'text-red-600'
                }`}>
                  {formatCurrency(Math.abs(netCashFlow))}
                  {netCashFlow < 0 && ' (Deficit)'}
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
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="flex items-center">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Filter className="h-5 w-5 text-gray-400" />
                  </div>
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="all">All Types</option>
                    <option value="income">Income</option>
                    <option value="expense">Expense</option>
                    <option value="loan_disbursement">Loan Disbursement</option>
                    <option value="loan_repayment">Loan Repayment</option>
                  </select>
                </div>
              </div>
            </div>
            
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex items-center justify-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark transition-colors"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Entry
            </button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
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
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentItems.length > 0 ? (
                  currentItems.map(cashFlow => (
                    <tr key={cashFlow.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{cashFlow.description}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          cashFlow.type === 'income' || cashFlow.type === 'loan_repayment'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {cashFlow.type === 'income' ? 'Income' : 
                           cashFlow.type === 'expense' ? 'Expense' :
                           cashFlow.type === 'loan_disbursement' ? 'Loan Disbursement' : 'Loan Repayment'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm ${
                          cashFlow.type === 'income' || cashFlow.type === 'loan_repayment'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}>
                          {cashFlow.type === 'income' || cashFlow.type === 'loan_repayment' ? '+' : '-'}
                          {formatCurrency(cashFlow.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{formatDate(cashFlow.date)}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => openEditModal(cashFlow)}
                            className="p-1 text-blue-600 hover:text-blue-800"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                          
                          <button
                            onClick={() => handleDeleteCashFlow(cashFlow.id)}
                            className="p-1 text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-4 text-center text-sm text-gray-500"
                    >
                      No cash flow entries found
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
      
      {/* Create Cash Flow Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsCreateModalOpen(false);
            resetForm();
          }
        }}
        title="Add Cash Flow Entry"
        size="md"
      >
        <form onSubmit={handleCreateCashFlow}>
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
                <option value="loan_disbursement">Loan Disbursement</option>
                <option value="loan_repayment">Loan Repayment</option>
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
                min="0"
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
                required
                rows={3}
                disabled={isSubmitting}
              ></textarea>
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
                'Add Entry'
              )}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Edit Cash Flow Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          if (!isSubmitting) {
            setIsEditModalOpen(false);
            resetForm();
          }
        }}
        title="Edit Cash Flow Entry"
        size="md"
      >
        <form onSubmit={handleEditCashFlow}>
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
                <option value="loan_disbursement">Loan Disbursement</option>
                <option value="loan_repayment">Loan Repayment</option>
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
                min="0"
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
                required
                rows={3}
                disabled={isSubmitting}
              ></textarea>
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
                'Update Entry'
              )}
            </button>
          </div>
        </form>
      </Modal>
    </PageContainer>
  );
}