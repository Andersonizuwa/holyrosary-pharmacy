'use client';

import React from 'react';
import { useUI } from '@/context/UIContext';
import { Toast } from './Toast';

export const ToastContainer: React.FC = () => {
  const { toasts } = useUI();

  return (
    <div
      className="fixed top-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm"
      role="region"
      aria-label="Notifications"
    >
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast toast={toast} />
        </div>
      ))}
    </div>
  );
};