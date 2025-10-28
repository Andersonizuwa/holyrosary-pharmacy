'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/ui/AppShell';
import api from '@/lib/api';

interface ReturnRecord {
  id: number;
  saleId: string;
  patientName: string;
  medicines: {
    medicineId: string;
    medicineName: string;
    quantityReturned: number;
  }[];
  totalReturned: number;
  totalOriginal: number;
  returnDate: string;
  isFullReturn: boolean;
}

export default function ReturnHistoryPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [isLoadingReturns, setIsLoadingReturns] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load returns from API on component mount
  useEffect(() => {
    const fetchReturns = async () => {
      try {
        setIsLoadingReturns(true);
        const response = await api.get('/returns?page=1&limit=100');
        const returnsData = response.data.items || [];
        setReturns(returnsData);
      } catch (error) {
        console.error('Error loading returns from API:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load return records.',
        });
      } finally {
        setIsLoadingReturns(false);
      }
    };

    if (!loading && user) {
      fetchReturns();
    }
  }, [loading, user]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);



  if (loading || isLoadingReturns) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading return records...</p>
        </div>
      </div>
    );
  }

  // Check if user has appropriate role
  const hasAccess = user && (user.role === 'ipp' || user.role === 'dispensary' || user.role === 'admin' || user.role === 'superadmin');

  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 text-center max-w-md">
          <div className="text-4xl mb-4">🔒</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You don&apos;t have permission to access the Return History page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <AppShell>
      <div className="min-h-screen bg-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">↩️ Return History</h1>
                <p className="text-gray-600">
                  View all recorded medicine returns.
                </p>
                {user && (
                  <p className="text-sm text-gray-500 mt-2">
                    👤 Logged in as: <span className="font-semibold">{user.name}</span> ({user.role.toUpperCase()})
                  </p>
                )}
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => router.back()}
                  className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  ← Back
                </button>
              </div>
            </div>
          </div>

          {/* Notification */}
          {notification && (
            <div
              className={`mb-6 p-4 rounded-lg border ${
                notification.type === 'success'
                  ? 'bg-green-50 border-green-200 text-green-800'
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}
            >
              <p className="text-sm font-medium">{notification.message}</p>
            </div>
          )}

          {/* Return History Table */}
          <div className="mt-8">
            {returns.length === 0 ? (
              <div className="bg-white rounded-lg shadow p-6 text-center">
                <p className="text-gray-500">No returns recorded yet.</p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-bold text-gray-900">📋 Return Records</h2>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-gray-100 border-b-2 border-gray-300">
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Patient Name</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Medicine(s)</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty Returned</th>
                        <th className="px-4 py-3 text-center font-semibold text-gray-700">Return Type</th>
                        <th className="px-4 py-3 text-left font-semibold text-gray-700">Date/Time</th>
                      </tr>
                    </thead>
                    <tbody>
                      {returns.map((returnRecord) => (
                        <tr
                          key={returnRecord.id}
                          className="border-b border-gray-200 hover:bg-green-50 transition"
                        >
                          <td className="px-4 py-3 text-gray-900 font-medium">
                            {returnRecord.patientName}
                          </td>
                          <td className="px-4 py-3 text-gray-600">
                            <div className="max-h-12 overflow-y-auto">
                              {returnRecord.medicines.map((med, idx) => (
                                <div key={idx} className="text-xs py-1">
                                  • {med.medicineName} ({med.quantityReturned})
                                </div>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-center font-semibold text-green-600">
                            {returnRecord.totalReturned}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                returnRecord.isFullReturn
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-orange-100 text-orange-800'
                              }`}
                            >
                              {returnRecord.isFullReturn
                                ? `Full (${returnRecord.totalReturned}/${returnRecord.totalOriginal})`
                                : `Partial (${returnRecord.totalReturned}/${returnRecord.totalOriginal})`}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-600 text-xs">
                            {new Date(returnRecord.returnDate).toLocaleString('en-NG', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Summary Footer */}
                <div className="p-6 bg-gray-50 border-t border-gray-200">
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-gray-600 text-sm">Total Returns</p>
                      <p className="text-2xl font-bold text-gray-900">{returns.length}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Full Returns</p>
                      <p className="text-2xl font-bold text-red-600">
                        {returns.filter(r => r.isFullReturn).length}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-sm">Partial Returns</p>
                      <p className="text-2xl font-bold text-orange-600">
                        {returns.filter(r => !r.isFullReturn).length}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}