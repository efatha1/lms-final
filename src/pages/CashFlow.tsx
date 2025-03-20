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
  // ... (previous code remains the same)

  // Updated Summary calculations
  const totalIncome = transactions
    .filter(t => t.type === 'income' || t.type === 'loan_repayment')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' || t.type === 'loan_disbursement')
    .reduce((sum, t) => sum + t.amount, 0);
    
  const netCashFlow = totalIncome - totalExpenses;

  // ... (rest of the component remains the same)

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
        type: formData.type as 'income' | 'expense' | 'loan_disbursement' | 'loan_repayment',
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

  // ... (rest of the component logic remains the same)

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

  return (
    <PageContainer title="Cash Flow">
      {/* ... (previous JSX remains the same) */}

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
                <option value="loan_disbursement">Loan Disbursement</option>
                <option value="loan_repayment">Loan Repayment</option>
              </select>
            </div>
            
            {/* ... (rest of the form fields remain the same) */}
          </div>
          
          {/* ... (form buttons remain the same) */}
        </form>
      </Modal>

      {/* ... (rest of the component remains the same) */}
    </PageContainer>
  );
}