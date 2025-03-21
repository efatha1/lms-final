import { RepaymentSchedule } from '../types';

export function calculateTotalRepayment(
  principal: number,
  interestRate: number,
  termMonths: number
): number {
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalInterest = principal * monthlyInterestRate * termMonths;
  return principal + totalInterest;
}

export function calculateMonthlyPayment(
  principal: number,
  interestRate: number,
  termMonths: number
): number {
  const monthlyInterestRate = interestRate / 100 / 12;
  const totalRepayment = calculateTotalRepayment(principal, interestRate, termMonths);
  return totalRepayment / termMonths;
}

export function calculateWeeklyPayment(
  principal: number,
  interestRate: number,
  termMonths: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, interestRate, termMonths);
  return monthlyPayment / 4; // Approximate weeks in a month
}

export function generateRepaymentSchedule(
  principal: number,
  interestRate: number,
  termMonths: number,
  mode: 'weekly' | 'monthly',
  startDate: Date
): RepaymentSchedule[] {
  const schedule: RepaymentSchedule[] = [];
  const monthlyInterestRate = interestRate / 100 / 12;
  const weeklyInterestRate = monthlyInterestRate / 4;
  
  let remainingBalance = principal;
  let currentDate = new Date(startDate);
  
  if (mode === 'monthly') {
    const monthlyPayment = calculateMonthlyPayment(principal, interestRate, termMonths);
    
    for (let i = 1; i <= termMonths; i++) {
      currentDate = new Date(currentDate);
      currentDate.setMonth(currentDate.getMonth() + 1);
      
      const interestPayment = remainingBalance * monthlyInterestRate;
      const principalPayment = monthlyPayment - interestPayment;
      
      remainingBalance -= principalPayment;
      
      schedule.push({
        payment_number: i,
        due_date: currentDate.toISOString(),
        principal: principalPayment,
        interest: interestPayment,
        total_payment: monthlyPayment,
        remaining_balance: Math.max(0, remainingBalance),
      });
    }
  } else {
    // Weekly repayment
    const totalWeeks = termMonths * 4; // Approximate weeks in months
    const weeklyPayment = calculateWeeklyPayment(principal, interestRate, termMonths);
    
    for (let i = 1; i <= totalWeeks; i++) {
      currentDate = new Date(currentDate);
      currentDate.setDate(currentDate.getDate() + 7); // Add 7 days
      
      const interestPayment = remainingBalance * weeklyInterestRate;
      const principalPayment = weeklyPayment - interestPayment;
      
      remainingBalance -= principalPayment;
      
      schedule.push({
        payment_number: i,
        due_date: currentDate.toISOString(),
        principal: principalPayment,
        interest: interestPayment,
        total_payment: weeklyPayment,
        remaining_balance: Math.max(0, remainingBalance),
      });
    }
  }
  
  return schedule;
}