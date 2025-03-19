import { RepaymentSchedule } from '../types';

/**
 * Generate a repayment schedule for a loan
 */
export const generateRepaymentSchedule = (
  loanAmount: number,
  interestRate: number,
  termMonths: number,
  repaymentMode: 'weekly' | 'monthly',
  startDate: Date
): RepaymentSchedule[] => {
  const schedule: RepaymentSchedule[] = [];
  
  // Calculate total interest
  const totalInterest = (loanAmount * interestRate * termMonths) / 100;
  const totalAmount = loanAmount + totalInterest;
  
  // Calculate number of payments
  const numberOfPayments = repaymentMode === 'weekly' ? termMonths * 4 : termMonths;
  
  // Calculate payment amount
  const paymentAmount = totalAmount / numberOfPayments;
  
  // Calculate principal and interest per payment
  const principalPerPayment = loanAmount / numberOfPayments;
  const interestPerPayment = totalInterest / numberOfPayments;
  
  let remainingBalance = loanAmount;
  let currentDate = new Date(startDate);
  
  for (let i = 0; i < numberOfPayments; i++) {
    // Calculate due date
    if (repaymentMode === 'weekly') {
      currentDate.setDate(currentDate.getDate() + 7);
    } else {
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    // Update remaining balance
    remainingBalance -= principalPerPayment;
    
    schedule.push({
      payment_number: i + 1,
      due_date: new Date(currentDate).toISOString(),
      principal: principalPerPayment,
      interest: interestPerPayment,
      total_payment: paymentAmount,
      remaining_balance: Math.max(0, remainingBalance),
    });
  }
  
  return schedule;
};