'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import api from '@/lib/api';
import { statusColors, medicineStatusColors } from '@/lib/constants/tokens';

interface Medicine {
  id: number;
  name: string;
  genericName: string;
  barcode: string;
  quantity: number;
  expiryDate: string;
  lowStockThreshold: number;
  status: 'low_stock' | 'out_of_stock' | 'expired';
}

interface NotificationData {
  medicines: Medicine[];
  counts: {
    expired: number;
    outOfStock: number;
    lowStock: number;
  };
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'expired':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M13.477 14.89A6 6 0 0512 11H1.5A1.5 1.5 0 000 12.5V14a6 6 0 005.477 5.988M15 9.5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
        </svg>
      );
    case 'out_of_stock':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'low_stock':
      return (
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    default:
      return null;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'expired':
      return statusColors.error;
    case 'out_of_stock':
      return statusColors.error;
    case 'low_stock':
      return statusColors.warning;
    default:
      return statusColors.info;
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'expired':
      return 'Expired';
    case 'out_of_stock':
      return 'Out of Stock';
    case 'low_stock':
      return 'Low Stock';
    default:
      return status;
  }
};

const formatExpiryDate = (date: string | null) => {
  if (!date) return 'N/A';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const NotificationModal: React.FC<NotificationModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [notifications, setNotifications] = useState<NotificationData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'expired' | 'out_of_stock' | 'low_stock'>('all');

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await api.get('/medicines/notifications/all');
      setNotifications(response.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredMedicines = notifications?.medicines.filter(m =>
    selectedStatus === 'all' ? true : m.status === selectedStatus
  ) || [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Medicine Alerts & Notifications"
      description="Items requiring attention"
      size="lg"
    >
      <div className="space-y-6">
        {/* Summary Stats */}
        {notifications && (
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-4 rounded-lg ${statusColors.error.bg} border ${statusColors.error.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.477 14.89A6 6 0 0512 11H1.5A1.5 1.5 0 000 12.5V14a6 6 0 005.477 5.988M15 9.5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-red-900">Expired</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{notifications.counts.expired}</p>
            </div>

            <div className={`p-4 rounded-lg ${statusColors.error.bg} border ${statusColors.error.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-red-900">Out of Stock</span>
              </div>
              <p className="text-2xl font-bold text-red-700">{notifications.counts.outOfStock}</p>
            </div>

            <div className={`p-4 rounded-lg ${statusColors.warning.bg} border ${statusColors.warning.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-semibold text-yellow-900">Low Stock</span>
              </div>
              <p className="text-2xl font-bold text-yellow-700">{notifications.counts.lowStock}</p>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedStatus('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({notifications?.medicines.length || 0})
          </button>
          <button
            onClick={() => setSelectedStatus('expired')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'expired'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Expired ({notifications?.counts.expired || 0})
          </button>
          <button
            onClick={() => setSelectedStatus('out_of_stock')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'out_of_stock'
                ? 'bg-red-600 text-white'
                : 'bg-red-50 text-red-700 hover:bg-red-100'
            }`}
          >
            Out of Stock ({notifications?.counts.outOfStock || 0})
          </button>
          <button
            onClick={() => setSelectedStatus('low_stock')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              selectedStatus === 'low_stock'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100'
            }`}
          >
            Low Stock ({notifications?.counts.lowStock || 0})
          </button>
        </div>

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
          <div className={`p-4 rounded-lg ${statusColors.error.bg} border ${statusColors.error.border}`}>
            <p className={statusColors.error.text}>{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredMedicines.length === 0 && (
          <div className="text-center py-8">
            <svg className="w-12 h-12 mx-auto text-green-400 mb-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <p className="text-gray-600 font-medium">All medicines are in good condition!</p>
            <p className="text-sm text-gray-500">No alerts at this time</p>
          </div>
        )}

        {/* Medicine List */}
        {!isLoading && !error && filteredMedicines.length > 0 && (
          <div className="max-h-96 overflow-y-auto">
            <div className="space-y-3">
              {filteredMedicines.map((medicine) => {
                const colors = getStatusColor(medicine.status);
                return (
                  <div
                    key={medicine.id}
                    className={`p-4 rounded-lg border ${colors.border} ${colors.bg}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 flex-1">
                        <div className={`p-2 rounded-lg ${colors.bg}`}>
                          {getStatusIcon(medicine.status)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-gray-900 truncate">
                              {medicine.name}
                            </h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                              medicine.status === 'expired'
                                ? 'bg-red-100 text-red-800'
                                : medicine.status === 'out_of_stock'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {getStatusLabel(medicine.status)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mb-2">
                            <span className="font-medium">Generic:</span> {medicine.genericName}
                          </p>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-600">Barcode:</span>
                              <p className="font-mono text-gray-900">{medicine.barcode || 'N/A'}</p>
                            </div>
                            <div>
                              <span className="text-gray-600">Quantity:</span>
                              <p className="font-semibold text-gray-900">{medicine.quantity} units</p>
                            </div>
                            {medicine.status === 'low_stock' && (
                              <div>
                                <span className="text-gray-600">Threshold:</span>
                                <p className="font-semibold text-yellow-700">{medicine.lowStockThreshold} units</p>
                              </div>
                            )}
                            {medicine.status === 'expired' && (
                              <div>
                                <span className="text-gray-600">Expiry:</span>
                                <p className="font-semibold text-red-700">{formatExpiryDate(medicine.expiryDate)}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Footer Action */}
        {!isLoading && !error && filteredMedicines.length > 0 && (
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