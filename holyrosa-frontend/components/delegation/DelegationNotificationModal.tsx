'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';

interface DelegationNotification {
  id: number;
  medicineId: number;
  medicineName: string;
  barcode: string;
  genericName: string;
  delegatedTo: string;
  quantity: number;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface DelegationNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const formatDate = (date: string | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const DelegationNotificationModal: React.FC<DelegationNotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<DelegationNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/delegations/notifications/all');
      setNotifications(response.data.notifications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching delegation notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId: number) => {
    try {
      await api.post('/delegations/notifications/mark-read', { notificationId });
      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.post('/delegations/notifications/mark-all-read');
      setNotifications(prev =>
        prev.map(n => ({ ...n, isRead: true }))
      );
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Delegation Notifications"
      description={`Medicines delegated to ${user?.role.toUpperCase()}`}
      size="lg"
    >
      <div className="space-y-4">
        {/* Header Actions */}
        {notifications.length > 0 && (
          <div className="flex justify-end">
            <button
              onClick={handleMarkAllAsRead}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1 hover:bg-blue-50 rounded transition-colors"
            >
              Mark all as read
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8">
            <div className="inline-flex items-center gap-2 text-gray-600">
              <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading notifications...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-lg bg-red-50 border border-red-200">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && notifications.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
            </svg>
            <p className="text-gray-600 font-medium">No delegation notifications</p>
            <p className="text-sm text-gray-500">You&apos;re all caught up!</p>
          </div>
        )}

        {/* Notifications List */}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 rounded-lg border transition-all ${
                  notification.isRead
                    ? 'bg-gray-50 border-gray-200'
                    : 'bg-blue-50 border-blue-200 ring-1 ring-blue-100'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    {/* Notification Badge */}
                    {!notification.isRead && (
                      <div className="inline-block mb-2 px-2 py-1 bg-blue-600 text-white text-xs font-semibold rounded">
                        NEW
                      </div>
                    )}

                    {/* Medicine Name */}
                    <h4 className="font-semibold text-gray-900 text-sm mb-1">
                      {notification.medicineName}
                    </h4>

                    {/* Message */}
                    <p className="text-sm text-gray-700 mb-2">
                      {notification.message}
                    </p>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-2">
                      <div>
                        <span className="text-gray-500">Generic Name:</span>
                        <p className="font-medium text-gray-900">{notification.genericName || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Quantity:</span>
                        <p className="font-semibold text-blue-700">{notification.quantity} units</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Barcode:</span>
                        <p className="font-mono text-gray-900">{notification.barcode || 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>
                        <p className="text-gray-900">{formatDate(notification.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Mark as Read Button */}
                  {!notification.isRead && (
                    <button
                      onClick={() => handleMarkAsRead(notification.id)}
                      className="flex-shrink-0 px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-100 rounded transition-colors"
                    >
                      Mark read
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Refresh Button */}
        {!isLoading && !error && notifications.length > 0 && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={fetchNotifications}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
            >
              Refresh
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
};