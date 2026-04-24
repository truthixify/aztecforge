import { useState, useEffect, useCallback, createContext, useContext, type ReactNode } from 'react';
import { CheckCircle, AlertTriangle, Info, X } from 'lucide-react';

interface ToastData {
  id: string;
  kind: 'success' | 'error' | 'info';
  message: string;
  desc?: string;
}

interface ToastContextType {
  success: (message: string, desc?: string) => void;
  error: (message: string, desc?: string) => void;
  info: (message: string, desc?: string) => void;
}

const ToastContext = createContext<ToastContextType>({
  success: () => {},
  error: () => {},
  info: () => {},
});

export function useToast() {
  return useContext(ToastContext);
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const push = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, ...toast }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4200);
  }, []);

  const api: ToastContextType = {
    success: (message, desc) => push({ kind: 'success', message, desc }),
    error: (message, desc) => push({ kind: 'error', message, desc }),
    info: (message, desc) => push({ kind: 'info', message, desc }),
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-[360px] max-w-[calc(100vw-2rem)] pointer-events-none">
        {toasts.map((t) => (
          <ToastItem key={t.id} {...t} onClose={() => setToasts((l) => l.filter((x) => x.id !== t.id))} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

const toastConfig = {
  success: { border: 'border-l-green-500', Icon: CheckCircle, iconColor: 'text-green-400' },
  error: { border: 'border-l-red-500', Icon: AlertTriangle, iconColor: 'text-red-400' },
  info: { border: 'border-l-blue-500', Icon: Info, iconColor: 'text-blue-400' },
};

function ToastItem({ kind, message, desc, onClose }: ToastData & { onClose: () => void }) {
  const cfg = toastConfig[kind];
  const Icon = cfg.Icon;

  return (
    <div
      className={`pointer-events-auto bg-[var(--bg-1)] border border-[var(--line)] ${cfg.border} border-l-4 rounded-lg p-3.5 shadow-xl flex gap-3`}
      style={{ animation: 'slideIn 0.18s ease-out' }}
    >
      <Icon className={`w-5 h-5 shrink-0 mt-0.5 ${cfg.iconColor}`} />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-white">{message}</div>
        {desc && <div className="text-xs text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button onClick={onClose} className="text-gray-500 hover:text-gray-300 cursor-pointer">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
