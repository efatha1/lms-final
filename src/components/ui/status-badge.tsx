import React from 'react';
import { cn } from '@/lib/utils';

type StatusType = 'pending' | 'approved' | 'rejected' | 'paid' | 'overdue' | 'due-soon';

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    approved: 'bg-green-100 text-green-800 border-green-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    paid: 'bg-green-100 text-green-800 border-green-200',
    overdue: 'bg-red-100 text-red-800 border-red-200',
    'due-soon': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border',
        statusStyles[status],
        className
      )}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
    </span>
  );
}