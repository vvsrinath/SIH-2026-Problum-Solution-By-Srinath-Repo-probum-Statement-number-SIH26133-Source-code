import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertTriangleIcon, CheckCircle2Icon, InfoIcon, XIcon } from 'lucide-react';
import { cn } from '../../utils/cn';

type ToastKind = 'success' | 'info' | 'error';

interface ToastItem {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastApi {
  toast: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const ICONS: Record<ToastKind, React.ReactNode> = {
  success: <CheckCircle2Icon className="h-4 w-4 text-emerald-400" />,
  info: <InfoIcon className="h-4 w-4 text-sky-400" />,
  error: <AlertTriangleIcon className="h-4 w-4 text-red-400" />,
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, kind: ToastKind = 'success') => {
      const id = ++idRef.current;
      setItems((prev) => [...prev, { id, kind, message }]);
      window.setTimeout(() => dismiss(id), 3200);
    },
    [dismiss],
  );

  const api = useMemo<ToastApi>(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-label="Notifications"
        className="fixed bottom-20 right-4 z-[70] flex w-[min(calc(100vw-2rem),360px)] flex-col gap-2 md:bottom-6 md:right-6"
      >
        {items.map((item) => (
          <div
            key={item.id}
            className="flex items-start gap-2.5 rounded-card border border-navy/60 bg-navy px-3 py-2.5 text-xs text-white shadow-card"
          >
            <span className="mt-0.5 flex-shrink-0">{ICONS[item.kind]}</span>
            <p className={cn('min-w-0 flex-1 leading-5')}>{item.message}</p>
            <button
              type="button"
              aria-label="Dismiss notification"
              onClick={() => dismiss(item.id)}
              className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-md text-white/50 transition-colors hover:bg-white/10 hover:text-white"
            >
              <XIcon className="h-3.5 w-3.5" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}