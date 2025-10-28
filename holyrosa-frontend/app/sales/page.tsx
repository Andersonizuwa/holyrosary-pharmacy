'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { Medicine } from '@/types';
import AppShell from '@/components/ui/AppShell';
import SalesForm, { RecordedSale } from '@/components/sales/SalesForm';
import api from '@/lib/api';

const SALES_STORAGE_KEY = 'pharmacy_sales_records';

export default function SalesPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [sales, setSales] = useState<RecordedSale[]>([]);
  const [delegatedMedicines, setDelegatedMedicines] = useState<Medicine[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [medicinesError, setMedicinesError] = useState('');

  // Load delegated medicines from API based on user role
  useEffect(() => {
    const fetchDelegatedMedicines = async () => {
      if (!user || (user.role !== 'ipp' && user.role !== 'dispensary')) {
        setIsLoadingMedicines(false);
        return;
      }

      try {
        setIsLoadingMedicines(true);
        setMedicinesError('');

        // Fetch all delegations
        const delegationsResponse = await api.get('/delegations');
        const delegations = delegationsResponse.data.items || [];
        console.log('📡 API Response - All delegations:', delegations);

        // Filter delegations for the current user's role
        const userRoleDelegations = delegations.filter(
          (d: any) => d.toRole === user.role
        );
        console.log('🔍 Filtered delegations for role:', userRoleDelegations);

        // Transform delegations into medicine objects
        const medicinesList = userRoleDelegations
          .filter((delegation: any) => delegation.remainingQuantity > 0) // Only include medicines with remaining stock
          .map((delegation: any) => ({
            id: delegation.medicineId,
            name: delegation.medicineName,
            genericName: delegation.genericName,
            quantity: delegation.remainingQuantity, // Use remaining quantity (after sales) for sales form
            originalQuantity: delegation.quantity, // Keep original for reference
            barcode: delegation.barcode,
            expiryDate: delegation.expiryDate,
            createdAt: delegation.createdAt,
            updatedAt: delegation.createdAt,
            // Use defaults for fields not available in delegation
            unit: 'Tablets',
            packageType: 'Tablet',
            manufacturingDate: '',
            buyPrice: 0,
            totalPrice: 0,
            sellingPrice: Number(delegation.sellingPrice) || 0,
            lowStockThreshold: 0,
          }));

        console.log('✅ Final medicines list (after filtering quantity > 0):', medicinesList);
        setDelegatedMedicines(medicinesList);
      } catch (error) {
        console.error('Error fetching delegated medicines:', error);
        setMedicinesError('Failed to load delegated medicines. Please try again.');
      } finally {
        setIsLoadingMedicines(false);
      }
    };

    if (!loading) {
      fetchDelegatedMedicines();
    }
  }, [user, loading]);

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

  // Save sales to localStorage whenever they change
  useEffect(() => {
    if (typeof window !== 'undefined' && sales.length > 0) {
      localStorage.setItem(SALES_STORAGE_KEY, JSON.stringify(sales));
    }
  }, [sales]);

  // Handle new sale recorded
  const handleSaleRecorded = async (newSale: RecordedSale) => {
    console.log('🔄 Sale recorded, syncing to API...', newSale);
    console.log('📋 Current delegated medicines before update:', delegatedMedicines);
    console.log('💊 Medicines sold:', newSale.medicines);
    
    // Add new sale to the beginning
    setSales([newSale, ...sales]);

    // Try to sync with API
    try {
      // Calculate discount - handle both percentage and fixed discounts
      let discountAmount = 0;
      if (newSale.discountPercentage < 0) {
        // Fixed amount discount (negative value)
        discountAmount = Math.abs(newSale.discountPercentage);
      } else {
        // Percentage discount
        const totalBeforeDiscount = newSale.medicines.reduce((sum, med) => {
          return sum + med.quantity * med.sellingPrice;
        }, 0);
        discountAmount = totalBeforeDiscount * (newSale.discountPercentage / 100);
      }

      // Build the payload for debugging
      const payload = {
        patientName: newSale.patientName,
        folderNo: newSale.folderNo,
        age: newSale.age,
        sex: newSale.sex,
        unit: newSale.unit,
        medicines: newSale.medicines.map((med) => ({
          medicineId: med.medicineId,
          quantity: med.quantity,
          sellingPrice: med.sellingPrice,
        })),
        discount: discountAmount,
      };
      
      // Detailed validation before sending
      console.log('✅ DETAILED PAYLOAD VALIDATION:');
      console.log('  patientName:', { value: payload.patientName, empty: !payload.patientName });
      console.log('  folderNo:', { value: payload.folderNo, empty: !payload.folderNo });
      console.log('  age:', { value: payload.age, type: typeof payload.age, empty: !payload.age });
      console.log('  sex:', { value: payload.sex, empty: !payload.sex });
      console.log('  unit:', { value: payload.unit, empty: !payload.unit });
      console.log('  medicines:', { count: payload.medicines.length, empty: payload.medicines.length === 0 });
      console.log('  medicines details:', payload.medicines);
      console.log('  discount:', payload.discount);
      
      console.log('📤 Sending to API:', JSON.stringify(payload, null, 2));
      console.log('🔍 Field types:', {
        patientName: typeof newSale.patientName,
        folderNo: typeof newSale.folderNo,
        age: typeof newSale.age,
        sex: typeof newSale.sex,
        unit: typeof newSale.unit,
        medicinesLength: newSale.medicines.length,
        discountAmount: typeof discountAmount,
        discountAmountValue: discountAmount
      });
      
      const apiResponse = await api.post('/sales', payload);
      
      console.log('✅ Sale synced to API successfully:', apiResponse.data);
      
      // Refetch delegated medicines from API to ensure real-time sync
      console.log('🔄 Refetching delegated medicines to sync with backend...');
      const delegationsResponse = await api.get('/delegations');
      const delegations = delegationsResponse.data.items || [];
      
      // Filter delegations for the current user's role
      const userRoleDelegations = delegations.filter(
        (d: any) => d.toRole === user?.role
      );
      
      // Transform delegations into medicine objects and filter for quantity > 0
      const refreshedMedicinesList = userRoleDelegations
        .filter((delegation: any) => delegation.quantity > 0)
        .map((delegation: any) => ({
          id: delegation.medicineId,
          name: delegation.medicineName,
          genericName: delegation.genericName,
          quantity: delegation.quantity,
          barcode: delegation.barcode,
          expiryDate: delegation.expiryDate,
          createdAt: delegation.createdAt,
          updatedAt: delegation.createdAt,
          unit: 'Tablets',
          packageType: 'Tablet',
          manufacturingDate: '',
          buyPrice: 0,
          totalPrice: 0,
          sellingPrice: Number(delegation.sellingPrice) || 0,
          lowStockThreshold: 0,
        }));
      
      console.log('✅ Refreshed medicines list:', refreshedMedicinesList);
      setDelegatedMedicines(refreshedMedicinesList);
      
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sync sale to database';
      console.error('❌ Error syncing sale to API:', error);
      console.error('📋 Full error object:', error);
      console.error('📋 Error response data:', error.response?.data);
      console.error('📋 Error status:', error.response?.status);
      
      // Extract error details from backend response
      const backendMessage = error.response?.data?.message || errorMessage;
      const backendReceived = error.response?.data?.received;
      
      console.log('🔴 Backend error message:', backendMessage);
      console.log('📦 Backend received:', backendReceived);
      
      // Show error notification to user
      let alertMessage = `⚠️ Sale Recording Issue:\n\n${backendMessage}\n\n`;
      if (backendReceived) {
        alertMessage += `Received data: ${JSON.stringify(backendReceived)}\n\n`;
      }
      alertMessage += `The sale is saved locally but may not be in the database. Please contact support or try again.`;
      alert(alertMessage);
      
      // If API sync fails, at least update local state
      console.log('📋 Updating local state as fallback...');
      const updatedMedicines = delegatedMedicines.map((medicine) => {
        const matchedSales = newSale.medicines.filter((item) => {
          const match = String(item.medicineId) === String(medicine.id);
          console.log(`🔍 Comparing ${item.medicineId} (${typeof item.medicineId}) with ${medicine.id} (${typeof medicine.id}): ${match}`);
          return match;
        });
        
        const usedQuantity = matchedSales.reduce((sum, item) => sum + item.quantity, 0);
        console.log(`📊 Medicine ${medicine.name}: matched sales = ${matchedSales.length}, used quantity = ${usedQuantity}, old qty = ${medicine.quantity}`);

        if (usedQuantity > 0) {
          return {
            ...medicine,
            quantity: Math.max(0, medicine.quantity - usedQuantity),
          };
        }
        return medicine;
      });

      console.log('✅ Updated medicines (local fallback):', updatedMedicines);
      setDelegatedMedicines(updatedMedicines);
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
            You don&apos;t have permission to access the Sales page. This page is available only for IPP and Dispensary staff.
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
          <h1 className="text-4xl font-bold text-gray-900 mb-2">💊 Sales Management</h1>
          <p className="text-gray-600">
            Record and track medicine sales by patient and unit. All sales are automatically discounted based on the patient&apos;s unit.
          </p>
          {user && (
            <p className="text-sm text-gray-500 mt-2">
              👤 Logged in as: <span className="font-semibold">{user.name}</span> ({user.role.toUpperCase()})
            </p>
          )}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sales Form (spans 2 columns on large screens) */}
          <div className="lg:col-span-2">
            <SalesForm delegatedMedicines={delegatedMedicines} onSaleRecorded={handleSaleRecorded} />
          </div>

          {/* Available Medicines Sidebar */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 pb-2 border-b-2 border-blue-500">
              📦 Delegated Medicines
            </h3>
            {medicinesError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-800 text-sm">{medicinesError}</p>
              </div>
            )}
            {isLoadingMedicines ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : delegatedMedicines.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="text-sm">No medicines delegated yet.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {delegatedMedicines.map((medicine) => (
                  <div key={medicine.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="font-semibold text-gray-900 text-sm">{medicine.name}</p>
                    <p className="text-xs text-gray-600 mb-2">{medicine.genericName}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xs text-gray-600">Quantity</p>
                        <p className={`font-bold ${medicine.quantity <= 10 ? 'text-orange-600' : 'text-green-600'}`}>
                          {medicine.quantity}
                        </p>
                      </div>
                      {medicine.expiryDate && (
                        <div>
                          <p className="text-xs text-gray-600">Expiry</p>
                          <p className="font-bold text-sm text-gray-900">
                            {new Date(medicine.expiryDate).toLocaleDateString()}
                          </p>
                        </div>
                      )}
                    </div>
                    {medicine.quantity <= 10 && (
                      <p className="text-xs text-orange-600 mt-2">⚠️ Low stock</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
    </AppShell>
  );
}