import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, X } from 'lucide-react';

function Alert({ alert, onClose }) {
  useEffect(() => {
    if (alert) {
      // Auto close after 5 seconds
      const timer = setTimeout(() => {
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [alert, onClose]);

  if (!alert) return null;

  const isSuccess = alert.type === 'success';

  return (
    <div
      className={`app-alert-toast flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-[8px] transition-all duration-300 shadow-[0_8px_32px_rgba(30,41,59,0.15)] ${
        isSuccess
          ? 'bg-emerald-500/10 border-emerald-500/20'
          : 'bg-rose-500/10 border-rose-500/20'
      }`}
      style={{ textAlign: 'left' }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-rose-400" />
        )}
      </div>
      
      <div className="flex-1 text-sm font-medium text-(--color-text)">
        {alert.message}
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 text-(--color-muted) hover:text-(--color-text) transition-colors cursor-pointer"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Alert;
