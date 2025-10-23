'use client';

import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number; // 0 means no auto-dismiss
}

interface UIContextType {
  // Sidebar
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  // Toasts
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => string;
  removeToast: (id: string) => void;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
}

const UIContext = createContext<UIContextType | undefined>(undefined);

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toggleSidebar = () => {
    setSidebarOpen(prev => !prev);
  };

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: Toast = { ...toast, id };
    const duration = toast.duration ?? 4000;

    setToasts(prev => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }

    return id;
  }, [removeToast]);

  const showSuccess = useCallback((message: string, duration?: number) =>
    addToast({ type: 'success', message, duration: duration ?? 3000 }),
    [addToast]
  );

  const showError = useCallback((message: string, duration?: number) =>
    addToast({ type: 'error', message, duration: duration ?? 4000 }),
    [addToast]
  );

  const showWarning = useCallback((message: string, duration?: number) =>
    addToast({ type: 'warning', message, duration: duration ?? 3500 }),
    [addToast]
  );

  const showInfo = useCallback((message: string, duration?: number) =>
    addToast({ type: 'info', message, duration: duration ?? 3000 }),
    [addToast]
  );

  return (
    <UIContext.Provider
      value={{
        sidebarOpen,
        toggleSidebar,
        setSidebarOpen,
        toasts,
        addToast,
        removeToast,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
    </UIContext.Provider>
  );
};

export const useUI = () => {
  const context = useContext(UIContext);
  if (context === undefined) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
};
