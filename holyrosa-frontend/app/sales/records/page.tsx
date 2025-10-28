'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/ui/AppShell';
import SalesTable from '@/components/sales/SalesTable';
import { RecordedSale } from '@/components/sales/SalesForm';
import api from '@/lib/api';

const RETURNS_STORAGE_KEY = 'pharmacy_return_history';

// Helper function to group flat medicine records into sales transactions
const groupSalesByTransaction = (items: any[]): RecordedSale[] => {
  const transactionMap = new Map<string, RecordedSale>();

  items.forEach((item) => {
    // Group by: patientName + folderNo + date (identifies a unique transaction)
    const saleDate = item.saleDate ? new Date(item.saleDate).toISOString().split('T')[0] : 'unknown';
    const key = `${item.patientName}_${item.folderNo || 'none'}_${saleDate}`;

    if (!transactionMap.has(key)) {
      transactionMap.set(key, {
        id: item.id,
        patientName: item.patientName,
        folderNo: item.folderNo,
        age: item.age,
        sex: item.sex,
        phoneNumber: item.phoneNumber,
        invoiceNo: item.invoiceNo,
        unit: item.unit,
        medicines: [],
        discountPercentage: item.discount || 0,
        totalAmount: 0,
        createdAt: item.saleDate,
        status: item.status,
      });
    }

    const transaction = transactionMap.get(key)!;
    transaction.medicines.push({
      medicineId: item.medicineId,
      medicineName: item.medicineName,
      quantity: item.quantity,
      sellingPrice: item.sellingPrice,
      barcode: item.barcode,
    });
    
    // Update total amount
    transaction.totalAmount += item.totalPrice;
  });

  return Array.from(transactionMap.values());
};

export default function SalesRecordsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<any[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(true);
  const [notification, setNotification] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Load sales from API on component mount
  useEffect(() => {
    const fetchSales = async () => {
      try {
        setIsLoadingSales(true);
        const response = await api.get('/sales?page=1&limit=100');
        const groupedSales = groupSalesByTransaction(response.data.items || []);
        setSales(groupedSales);
      } catch (error) {
        console.error('Error loading sales from API:', error);
        setNotification({
          type: 'error',
          message: 'Failed to load sales records.',
        });
      } finally {
        setIsLoadingSales(false);
      }
    };

    if (!loading && user) {
      fetchSales();
    }
  }, [loading, user]);

  // Auto-hide notification after 5 seconds
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  // Filter sales based on search and date range
  const filteredSales = React.useMemo(() => {
    return sales.filter(sale => {
      // Search filter - by patient name or folder number
      const searchMatch = !searchTerm || 
        sale.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.folderNo?.toLowerCase().includes(searchTerm.toLowerCase());

      // Date range filter
      const saleDate = new Date(sale.createdAt).toISOString().split('T')[0];
      const dateMatch = (!dateFrom || saleDate >= dateFrom) && (!dateTo || saleDate <= dateTo);

      return searchMatch && dateMatch;
    });
  }, [sales, searchTerm, dateFrom, dateTo]);



  const handleDeleteSale = async (
    index: number,
    action: 'return',
    returnQuantities?: { medicineId: string; quantity: number }[]
  ) => {
    try {
      const saleToDelete = filteredSales[index];
      // Find the actual index in the full sales array
      const actualIndex = sales.findIndex(s => 
        s.id === saleToDelete.id && 
        s.patientName === saleToDelete.patientName &&
        s.createdAt === saleToDelete.createdAt
      );

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

        // Calculate totals
        const totalReturned = quantitiesToReturn.reduce((sum, med) => sum + med.quantity, 0);
        const totalOriginal = saleToDelete.medicines.reduce((sum, med) => sum + med.quantity, 0);
        const isFullReturn = totalReturned === totalOriginal;

        let newSales: RecordedSale[];
        let returnMsg: string;

        if (isFullReturn) {
          // Full return: remove entire sale record
          newSales = sales.filter((_, i) => i !== actualIndex);
          returnMsg = `✅ Sale reversed! ${totalReturned} unit(s) returned to stock.`;
        } else {
          // Partial return: update sale with remaining quantities
          const returnMap = new Map(quantitiesToReturn.map(r => [r.medicineId, r.quantity]));
          const remainingMedicines = saleToDelete.medicines
            .map(med => ({
              ...med,
              quantity: med.quantity - (returnMap.get(med.medicineId) || 0),
            }))
            .filter(med => med.quantity > 0); // Remove medicines with 0 quantity
          
          // Recalculate total amount based on remaining medicines and discount type
          let newTotalAmount = remainingMedicines.reduce((sum, med) => sum + (med.quantity * med.sellingPrice), 0);
          
          if (saleToDelete.discountPercentage < 0) {
            // Fixed amount discount - keep the same fixed discount
            newTotalAmount = Math.max(0, newTotalAmount - Math.abs(saleToDelete.discountPercentage));
          } else {
            // Percentage discount - apply the same percentage to new total
            const discountAmount = newTotalAmount * (saleToDelete.discountPercentage / 100);
            newTotalAmount = Math.max(0, newTotalAmount - discountAmount);
          }
          
          const updatedSale = {
            ...saleToDelete,
            medicines: remainingMedicines,
            totalAmount: newTotalAmount,
          };
          
          newSales = sales.map((sale, i) => (i === actualIndex ? updatedSale : sale));
          returnMsg = `✅ Partial return processed! ${totalReturned} out of ${totalOriginal} unit(s) returned to stock.`;
        }

        // Log return to return history
        const returnRecord = {
          id: Date.now(),
          saleId: saleToDelete.id || `sale_${saleToDelete.createdAt}`,
          patientName: saleToDelete.patientName,
          medicines: quantitiesToReturn.map(item => {
            // Use String() comparison to handle both string and number IDs
            const med = saleToDelete.medicines.find(m => String(m.medicineId) === String(item.medicineId));
            console.log('🔍 Finding medicine:', { item, med, medicines: saleToDelete.medicines });
            return {
              medicineId: item.medicineId,
              medicineName: med?.medicineName || 'Unknown',
              quantityReturned: item.quantity,
            };
          }),
          totalReturned: totalReturned,
          totalOriginal: totalOriginal,
          returnedAt: new Date().toISOString(),
          isFullReturn: isFullReturn,
        };

        // Save return to database via API
        try {
          await api.post('/returns', {
            saleId: returnRecord.saleId,
            patientName: returnRecord.patientName,
            medicines: returnRecord.medicines.map(m => ({
              medicineId: m.medicineId,
              quantityReturned: m.quantityReturned,
              refundAmount: m.quantityReturned * 0 // Calculate if needed
            })),
            totalReturned: returnRecord.totalReturned,
            totalOriginal: returnRecord.totalOriginal,
            isFullReturn: returnRecord.isFullReturn
          });
        } catch (returnApiError) {
          console.error('Error saving return to API:', returnApiError);
        }

        // Reload sales from API
        try {
          const response = await api.get('/sales?page=1&limit=100');
          const groupedSales = groupSalesByTransaction(response.data.items || []);
          setSales(groupedSales);
        } catch (reloadError) {
          console.error('Error reloading sales:', reloadError);
        }

        setNotification({
          type: 'success',
          message: returnMsg,
        });
      } catch (apiError) {
        console.error('❌ Error restoring delegations via API:', apiError);

        setNotification({
          type: 'error',
          message: 'Failed to process return. Please try again.',
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

  if (loading || isLoadingSales) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading sales records...</p>
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
            You don&apos;t have permission to access the Sales Records page.
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

          {/* Search and Filter Section - For IPP and Dispensary */}
          {(user?.role === 'ipp' || user?.role === 'dispensary') && (
            <div className="mb-6 bg-white rounded-lg shadow p-4 md:p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🔍 Search & Filter</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Search by Patient Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Patient Name
                  </label>
                  <input
                    type="text"
                    placeholder="Search by patient name or folder no..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date From */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Date To */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Results count */}
              <div className="mt-4 text-sm text-gray-600">
                Showing <span className="font-semibold">{filteredSales.length}</span> of{' '}
                <span className="font-semibold">{sales.length}</span> sales
              </div>
            </div>
          )}

          {/* Sales Table Section */}
          <div className="mt-8">
            <SalesTable sales={filteredSales} onDelete={handleDeleteSale} />
          </div>
        </div>
      </div>
    </AppShell>
  );
}