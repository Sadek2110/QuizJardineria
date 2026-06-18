'use client';

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = ++counter;
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => remove(id), 4200);
    },
    [remove],
  );

  const value: ToastContextValue = {
    toast,
    success: (m) => toast(m, 'success'),
    error: (m) => toast(m, 'error'),
    info: (m) => toast(m, 'info'),
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const icons = {
    success: <CheckCircle2 className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-rose-400" />,
    info: <Info className="h-5 w-5 text-brand-400" />,
  };
  const ring = {
    success: 'border-emerald-500/30',
    error: 'border-rose-500/30',
    info: 'border-brand-500/30',
  };

  return (
    <div
      className={cn(
        'pointer-events-auto flex items-start gap-3 rounded-xl border bg-slate-900/90 p-4 shadow-2xl backdrop-blur-md animate-scale-in',
        ring[toast.type],
      )}
    >
      {icons[toast.type]}
      <p className="flex-1 text-sm text-slate-200">{toast.message}</p>
      <button
        onClick={onClose}
        className="text-slate-500 transition-colors hover:text-slate-200"
        aria-label="Cerrar notificación"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
