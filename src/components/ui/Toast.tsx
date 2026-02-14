import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface ToastContextType {
  show: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | undefined>(undefined);

  const show = useCallback((message: string, type: ToastType = 'success') => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    
    // Use a unique ID to force re-render/animation restart even if message is same
    setToast({ id: Date.now(), message, type });

    timerRef.current = window.setTimeout(() => {
      setToast(null);
    }, 3000);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  const getBackgroundColor = (type: ToastType) => {
    switch (type) {
      case 'error':
        return 'bg-red-600';
      case 'info':
        return 'bg-indigo-600';
      case 'success':
      default:
        return 'bg-gray-800';
    }
  };

  const getIcon = (type: ToastType) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-5 h-5 text-white" />;
      case 'info':
        return <Info className="w-5 h-5 text-white" />;
      case 'success':
      default:
        return <CheckCircle className="w-5 h-5 text-white" />;
    }
  };

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      <AnimatePresence mode="wait">
        {toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className={`fixed bottom-8 left-1/2 z-50 flex items-center gap-3 px-6 py-3 rounded-full shadow-lg text-white ${getBackgroundColor(toast.type)}`}
            style={{ x: "-50%" }} // Ensure centering logic works with motion
          >
            {getIcon(toast.type)}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </ToastContext.Provider>
  );
}
