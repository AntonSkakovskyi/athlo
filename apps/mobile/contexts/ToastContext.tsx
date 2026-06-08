import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from '@/components/ui';
import type { ToastVariant } from '@/components/ui';

interface ToastOptions {
  title: string;
  description?: string;
  icon?: string;
  variant?: ToastVariant;
}

interface ToastContextType {
  showToast: (options: ToastOptions) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [visible, setVisible] = useState(false);
  const [toastData, setToastData] = useState<ToastOptions | null>(null);

  const showToast = useCallback((options: ToastOptions) => {
    setToastData(options);
    setVisible(true);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toastData && (
        <Toast
          visible={visible}
          title={toastData.title}
          description={toastData.description}
          icon={toastData.icon}
          variant={toastData.variant}
          onClose={handleClose}
        />
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
