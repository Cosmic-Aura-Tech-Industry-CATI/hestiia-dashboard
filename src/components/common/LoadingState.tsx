import React from 'react';

export const LoadingState: React.FC<{ message?: string }> = ({ message = 'Loading live data...' }) => {
  return (
    <div className="py-16 flex flex-col items-center justify-center space-y-3">
      <div className="relative w-10 h-10">
        <div className="w-10 h-10 rounded-full border-2 border-gold/20 animate-ping absolute inset-0" />
        <div className="w-10 h-10 rounded-full border-2 border-t-gold border-r-transparent border-b-gold/40 border-l-transparent animate-spin" />
      </div>
      <p className="text-xs text-beige tracking-wider uppercase">{message}</p>
    </div>
  );
};
