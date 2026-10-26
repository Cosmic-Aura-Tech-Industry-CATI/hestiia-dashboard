import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = false,
  onConfirm,
  onCancel,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-charcoal-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="absolute inset-0" onClick={isLoading ? undefined : onCancel} />
      <div className="relative w-full max-w-md bg-charcoal-card border border-charcoal-border rounded-2xl p-6 shadow-2xl z-10 animate-scaleUp">
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="absolute top-4 right-4 text-beige hover:text-warmwhite transition-colors p-1"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start space-x-3.5 mb-4">
          <div
            className={`p-2.5 rounded-xl border flex-shrink-0 ${
              isDestructive
                ? 'bg-rose-950/40 text-rose-400 border-rose-600/30'
                : 'bg-amber-950/40 text-gold border-gold/30'
            }`}
          >
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-serif text-lg font-semibold text-warmwhite">{title}</h3>
            <p className="text-xs text-beige mt-1.5 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-3 border-t border-charcoal-border/80">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium rounded-xl border border-charcoal-border text-beige hover:text-warmwhite hover:bg-charcoal transition-all"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-md flex items-center space-x-2 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-900/30'
                : 'bg-gold hover:bg-gold-dark text-charcoal-950 font-bold shadow-gold-sm'
            }`}
          >
            {isLoading ? (
              <span className="inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : null}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
