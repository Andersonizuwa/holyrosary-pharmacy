'use client';

/**
 * EXAMPLE: How to integrate Smart Notifications into a Dashboard
 * 
 * This is a complete working example showing:
 * - How to fetch medicines
 * - How to use the useNotifications hook
 * - How to place NotificationIcon in header
 * - How to display NotificationModal
 * 
 * ⚠️ This is an EXAMPLE file - not meant to be used directly in production.
 * Copy this pattern into your actual dashboard component.
 */

import React, { useState, useEffect } from 'react';
import { Medicine } from '@/types';
import { useNotifications, NotificationIcon, NotificationModal } from '@/components/notifications';

/**
 * Example: Admin Dashboard with Notifications
 */
export const DashboardExampleComponent: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 1. Initialize the useNotifications hook
  //    Pass medicines array and autoOpen=true to show modal on first load if alerts exist
  const {
    lowStock,
    outOfStock,
    expired,
    totalAlerts,
    showModal,
    toggleModal,
    closeModal,
    openModal,
  } = useNotifications(medicines, true);

  // 2. Fetch medicines on component mount
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/medicines');
        
        if (!response.ok) {
          throw new Error(`Failed to fetch medicines: ${response.statusText}`);
        }
        
        const data: Medicine[] = await response.json();
        setMedicines(data);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching medicines:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  // 3. Render loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading medicines...</p>
        </div>
      </div>
    );
  }

  // 4. Render error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg font-semibold mb-4">Error loading medicines</p>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // 5. Main render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Notification Icon */}
      <header className="bg-white shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 text-sm mt-1">
                Total Medicines: {medicines.length}
              </p>
            </div>

            {/* Notification Icon - Click to toggle modal */}
            <div className="flex items-center gap-4">
              <NotificationIcon
                totalAlerts={totalAlerts}
                onClick={toggleModal}
                className="hover:bg-gray-200"
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Alert Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Low Stock Card */}
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-yellow-700">Low Stock</h3>
                <p className="text-3xl font-bold text-yellow-600 mt-2">
                  {lowStock.length}
                </p>
              </div>
              <div className="text-4xl opacity-20">⚠️</div>
            </div>
          </div>

          {/* Out of Stock Card */}
          <div className="bg-red-50 border-l-4 border-red-400 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-red-700">Out of Stock</h3>
                <p className="text-3xl font-bold text-red-600 mt-2">
                  {outOfStock.length}
                </p>
              </div>
              <div className="text-4xl opacity-20">❌</div>
            </div>
          </div>

          {/* Expired Card */}
          <div className="bg-gray-100 border-l-4 border-gray-400 p-6 rounded-lg shadow">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-700">Expired</h3>
                <p className="text-3xl font-bold text-gray-600 mt-2">
                  {expired.length}
                </p>
              </div>
              <div className="text-4xl opacity-20">⏰</div>
            </div>
          </div>
        </div>

        {/* Sample Medicines Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Sample Medicines</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Medicine Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {medicines.slice(0, 5).map((medicine) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  const expiryDate = new Date(medicine.expiryDate);
                  expiryDate.setHours(0, 0, 0, 0);
                  const isExpired = expiryDate < today;
                  const isOutOfStock = medicine.quantity === 0;
                  const isLowStock = medicine.quantity < 10;

                  return (
                    <tr key={medicine.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {medicine.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {medicine.quantity}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {new Date(medicine.expiryDate).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        {isExpired && (
                          <span className="px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-xs font-semibold">
                            Expired
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-semibold">
                            Out of Stock
                          </span>
                        )}
                        {isLowStock && !isOutOfStock && (
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                            Low Stock
                          </span>
                        )}
                        {!isExpired && !isOutOfStock && !isLowStock && (
                          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-semibold">
                            In Stock
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="px-6 py-4 border-t border-gray-200 text-sm text-gray-600">
            Showing 5 of {medicines.length} medicines
          </div>
        </div>

        {/* Manual Action Buttons (for testing) */}
        <div className="mt-8 flex gap-4">
          <button
            onClick={openModal}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Open Notifications Manually
          </button>
          <button
            onClick={toggleModal}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
          >
            Toggle Notifications
          </button>
        </div>
      </main>

      {/* Notification Modal - Always render, shows/hides based on showModal state */}
      <NotificationModal
        isOpen={showModal}
        onClose={closeModal}
        lowStock={lowStock}
        outOfStock={outOfStock}
        expired={expired}
      />
    </div>
  );
};

export default DashboardExampleComponent;