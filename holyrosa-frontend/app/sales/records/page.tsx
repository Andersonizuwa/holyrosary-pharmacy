'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/ui/AppShell';
import SalesTable from '@/components/sales/SalesTable';
import { RecordedSale } from '@/components/sales/SalesForm';
import api from '@/lib/api';

const SALES_STORAGE_KEY = 'pharmacy_sales_records';

export default function SalesRecordsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<RecordedSale[]>([]);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  // Load sales from localStorage on component mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedSales = localStorage.getItem(SALES_STORAGE_KEY);
      if (savedSales) {
        try {
          setSales(JSON.parse(savedSales));
        } catch (error) {
          console.error('Error loading sales from localStorage:', error);
        }
      }
    }
  }, []);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleDeleteSale = async (
    index: number,
    action: 'return',
    returnQuantities?: { medicineId: string; quantity: number }[]
  ) => {
    try {
      const saleToDelete = sales[index];
      const newSales = sales.filter((_, i) => i !== index);

      // Return: restore selected medicine quantities to delegations
      const quantitiesToReturn = returnQuantities || saleToDelete.medicines.map((med) => ({
        medicineId: med.medicineId,
        quantity: med.quantity,
      }));

      console.log('↩️ Returning medicines to delegations...', quantitiesToReturn);

      try {
        // Call API to restore delegations with selected quantities
        const restorePayload = {
          medicines: quantitiesToReturn,
        };

        const response = await api.post('/delegations/restore', restorePayload);
        console.log('✅ Delegations restored via API:', response.data);

        // Update sales in localStorage
        setSales(newSales);
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(newSales));

        const totalReturned = quantitiesToReturn.reduce((sum, med) => sum + med.quantity, 0);
        const totalOriginal = saleToDelete.medicines.reduce((sum, med) => sum + med.quantity, 0);
        const returnMsg =
          totalReturned === totalOriginal
            ? `✅ Sale reversed! ${totalReturned} unit(s) returned to stock.`
            : `✅ Partial return processed! ${totalReturned} out of ${totalOriginal} unit(s) returned to stock.`;

        setNotification({
          type: 'success',
          message: returnMsg,
        });
      } catch (apiError) {
        console.error('❌ Error restoring delegations via API:', apiError);

        // Fallback: local update only
        setSales(newSales);
        localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(newSales));

        setNotification({
          type: 'success',
          message: `⚠️ Sale record reverted locally (API sync failed, but record removed).`,
        });
      }
    } catch (error) {
      console.error('Error reverting sale:', error);
      setNotification({
        type: 'error',
        message: 'Failed to revert the sale record. Please try again.',
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
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
            You don't have permission to access the Sales Records page.
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
                <h1 className="text-4xl font-bold text-gray-900 mb-2">📊 Sales Records</h1>
                <p className="text-gray-600">
                  View and track all recorded medicine sales.
                </p>
                {user && (
                  <p className="text-sm text-gray-500 mt-2">
                    👤 Logged in as: <span className="font-semibold">{user.name}</span> ({user.role.toUpperCase()})
                  </p>
                )}
              </div>
              <button
                onClick={() => router.back()}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition"
              >
                ← Back
              </button>
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

          {/* Sales Table Section */}
          <div className="mt-8">
            <SalesTable sales={sales} onDelete={handleDeleteSale} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}