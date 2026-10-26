import React from 'react';
import { cn } from '../../lib/cn';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({ children, className, hover = false, ...props }) => {
  return (
    <div
      className={cn(
        'bg-charcoal-900/80 backdrop-blur-md border border-charcoal-800 rounded-2xl p-5 shadow-sm',
        hover && 'transition-all duration-200 hover:border-charcoal-700 hover:shadow-md hover:bg-charcoal-900',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
