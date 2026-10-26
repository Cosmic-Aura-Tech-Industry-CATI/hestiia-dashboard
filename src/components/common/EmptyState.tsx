import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No records found',
  description = 'There is currently no data matching your criteria.',
  action,
  icon,
}) => {
  return (
    <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
      <div className="w-14 h-14 rounded-2xl bg-charcoal border border-charcoal-border flex items-center justify-center text-gold/60 mb-3 shadow-inner">
        {icon || <PackageOpen className="w-7 h-7" />}
      </div>
      <h3 className="font-serif text-lg font-medium text-warmwhite mb-1">{title}</h3>
      <p className="text-xs text-beige max-w-sm mb-4 leading-relaxed">{description}</p>
      {action && <div>{action}</div>}
    </div>
  );
};
