import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'order' | 'payment' | 'booking' | 'boolean' | 'dietary';
  label?: string;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'order', label, className = '' }) => {
  const norm = status?.toLowerCase() || '';

  let colorClasses = 'bg-slate-800/80 text-slate-300 border-slate-700';
  let dotColor = 'bg-slate-400';
  let displayLabel = label || status;

  if (type === 'order') {
    switch (norm) {
      case 'pending':
        colorClasses = 'bg-amber-950/40 text-amber-300 border-amber-600/40';
        dotColor = 'bg-amber-400 animate-pulse';
        displayLabel = 'Pending Review';
        break;
      case 'confirmed':
        colorClasses = 'bg-blue-950/40 text-blue-300 border-blue-600/40';
        dotColor = 'bg-blue-400';
        displayLabel = 'Confirmed';
        break;
      case 'preparing':
        colorClasses = 'bg-purple-950/40 text-purple-300 border-purple-600/40';
        dotColor = 'bg-purple-400 animate-pulse';
        displayLabel = 'In Kitchen';
        break;
      case 'ready_for_pickup':
        colorClasses = 'bg-cyan-950/40 text-cyan-300 border-cyan-600/40';
        dotColor = 'bg-cyan-400';
        displayLabel = 'Ready for Pickup';
        break;
      case 'out_for_delivery':
        colorClasses = 'bg-indigo-950/40 text-indigo-300 border-indigo-600/40';
        dotColor = 'bg-indigo-400 animate-pulse';
        displayLabel = 'Out for Delivery';
        break;
      case 'completed':
        colorClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40';
        dotColor = 'bg-emerald-400';
        displayLabel = 'Fulfilled & Closed';
        break;
      case 'cancelled':
        colorClasses = 'bg-rose-950/40 text-rose-300 border-rose-600/40';
        dotColor = 'bg-rose-400';
        displayLabel = 'Cancelled';
        break;
    }
  } else if (type === 'payment') {
    switch (norm) {
      case 'paid':
        colorClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40';
        dotColor = 'bg-emerald-400';
        displayLabel = 'Paid & Verified';
        break;
      case 'pending':
        colorClasses = 'bg-amber-950/40 text-amber-300 border-amber-600/40';
        dotColor = 'bg-amber-400 animate-pulse';
        displayLabel = 'Payment Due';
        break;
      case 'failed':
        colorClasses = 'bg-rose-950/40 text-rose-300 border-rose-600/40';
        dotColor = 'bg-rose-400';
        displayLabel = 'Payment Failed';
        break;
      case 'refunded':
        colorClasses = 'bg-zinc-800/80 text-zinc-300 border-zinc-600/40';
        dotColor = 'bg-zinc-400';
        displayLabel = 'Refunded';
        break;
    }
  } else if (type === 'booking') {
    switch (norm) {
      case 'new':
        colorClasses = 'bg-amber-950/40 text-amber-300 border-amber-600/40';
        dotColor = 'bg-amber-400 animate-pulse';
        displayLabel = 'New Inquiry';
        break;
      case 'contacted':
        colorClasses = 'bg-sky-950/40 text-sky-300 border-sky-600/40';
        dotColor = 'bg-sky-400';
        displayLabel = 'Customer Contacted';
        break;
      case 'confirmed':
        colorClasses = 'bg-emerald-950/40 text-emerald-300 border-emerald-600/40';
        dotColor = 'bg-emerald-400';
        displayLabel = 'Table Reserved';
        break;
      case 'rescheduled':
        colorClasses = 'bg-purple-950/40 text-purple-300 border-purple-600/40';
        dotColor = 'bg-purple-400';
        displayLabel = 'Rescheduled';
        break;
      case 'rejected':
      case 'cancelled':
        colorClasses = 'bg-rose-950/40 text-rose-300 border-rose-600/40';
        dotColor = 'bg-rose-400';
        displayLabel = 'Declined / Cancelled';
        break;
      case 'completed':
        colorClasses = 'bg-teal-950/40 text-teal-300 border-teal-600/40';
        dotColor = 'bg-teal-400';
        displayLabel = 'Visit Completed';
        break;
    }
  } else if (type === 'dietary') {
    if (norm === 'veg' || norm === 'true') {
      colorClasses = 'bg-green-950/40 text-green-300 border-green-600/40';
      dotColor = 'bg-green-500';
      displayLabel = 'Pure Veg';
    } else {
      colorClasses = 'bg-red-950/40 text-red-300 border-red-600/40';
      dotColor = 'bg-red-500';
      displayLabel = 'Non-Veg';
    }
  }

  return (
    <span
      className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      <span>{displayLabel}</span>
    </span>
  );
};
