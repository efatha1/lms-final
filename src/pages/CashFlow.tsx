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
    .filter(t => t.type === 'income' || t.description.toLowerCase().includes('loan repayment'))
    .reduce((sum, t) => sum + t.amount, 0);
    
  const totalExpenses = transactions
    .filter(t => t.type === 'expense' || t.description.toLowerCase().includes('loan disbursement'))
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

  // ... (rest of the component remains the same)
}