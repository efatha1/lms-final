import { RepaymentSchedule } from '../types';

export const calculateMonthlyPayment = (
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number => {
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  return (
    (principal * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, termMonths)) /
    (Math.pow(1 + monthlyInterestRate, termMonths) - 1)
  );
};

export const calculateWeeklyPayment = (
  principal: number,
  annualInterestRate: number,
  termMonths: number
): number => {
  const weeklyInterestRate = annualInterestRate / 100 / 52;
  const termWeeks = Math.round(termMonths * 4.33);
  return (
    (principal * weeklyInterestRate * Math.pow(1 + weeklyInterestRate, termWeeks)) /
    (Math.pow(1 + weeklyInterestRate, termWeeks) - 1)
  );
};

export const generateRepaymentSchedule = (
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  mode: 'weekly' | 'monthly',
  startDate: Date = new Date()
): RepaymentSchedule[] => {
  const schedule: RepaymentSchedule[] = [];
  let remainingBalance = principal;
  const interestRate = mode === 'monthly' 
    ? annualInterestRate / 100 / 12 
    : annualInterestRate / 100 / 52;
  
  const payment = mode === 'monthly'
    ? calculateMonthlyPayment(principal, annualInterestRate, termMonths)
    : calculateWeeklyPayment(principal, annualInterestRate, termMonths);
  
  const periods = mode === 'monthly' ? termMonths : Math.round(termMonths * 4.33);
  
  for (let i = 1; i <= periods; i++) {
    const interestPayment = remainingBalance * interestRate;
    const principalPayment = payment - interestPayment;
    remainingBalance -= principalPayment;
    
    // Calculate due date
    const dueDate = new Date(startDate);
    if (mode === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + i);
    } else {
      dueDate.setDate(dueDate.getDate() + (i * 7));
    }
    
    schedule.push({
      payment_number: i,
      due_date: dueDate.toISOString(),
      principal: principalPayment,
      interest: interestPayment,
      total_payment: payment,
      remaining_balance: Math.max(0, remainingBalance),
    });
  }
  
  return schedule;
};

export const calculateTotalRepayment = (
  principal: number,
  annualInterestRate: number,
  termMonths: number,
  mode: 'weekly' | 'monthly'
): number => {
  const payment = mode === 'monthly'
    ? calculateMonthlyPayment(principal, annualInterestRate, termMonths)
    : calculateWeeklyPayment(principal, annualInterestRate, termMonths);
  
  const periods = mode === 'monthly' ? termMonths : Math.round(termMonths * 4.33);
  
  return payment * periods;
};