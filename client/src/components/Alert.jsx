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
      className={`app-alert-toast flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-[12px] transition-all duration-300 ${
        isSuccess
          ? 'bg-emerald-50/95 border-emerald-500/30 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-200'
          : 'bg-rose-50/95 border-rose-500/30 text-rose-800 dark:bg-rose-950/80 dark:border-rose-500/40 dark:text-rose-200'
      }`}
      style={{ textAlign: 'left' }}
    >
      <div className="flex-shrink-0 mt-0.5">
        {isSuccess ? (
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
        ) : (
          <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
        )}
      </div>
      
      <div className="flex-1 text-sm font-semibold leading-relaxed">
        {alert.message}
      </div>

      <button
        onClick={onClose}
        className="flex-shrink-0 mt-0.5 opacity-60 hover:opacity-100 transition-opacity cursor-pointer"
        aria-label="Close alert"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

export default Alert;
