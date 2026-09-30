import React from 'react';
import { CheckCircle2, AlertTriangle, Trash2, Bell } from 'lucide-react';

interface ToastProps {
  message: string | null;
  type?: 'success' | 'warning' | 'info' | 'delete';
}

export const Toast: React.FC<ToastProps> = ({ message, type = 'success' }) => {
  if (!message) return null;

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'delete':
        return <Trash2 className="w-4 h-4 text-rose-400 shrink-0" />;
      case 'info':
        return <Bell className="w-4 h-4 text-blue-400 shrink-0" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 bg-slate-900/95 backdrop-blur-md text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700/80 flex items-center space-x-3 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-4">
      {getIcon()}
      <span className="text-xs font-medium tracking-wide">{message}</span>
    </div>
  );
};
