'use client';

import React, { useState, useMemo } from 'react';
import { Medicine, Delegation } from '@/types';
import AddToCartModal from './AddToCartModal';

interface DelegateDrugsProps {
  medicines: Medicine[];
  delegations: Delegation[];
  onDelegation: (delegation: Delegation, medicineId: string) => void;
}

/**
 * DelegateDrugs Component
 * Displays all available medicines that can be delegated
 * - Search functionality by medicine name
 * - Shows available quantity and expiry dates
 * - "Add to Cart" button to add medicines to delegation cart
 */
export const DelegateDrugs: React.FC<DelegateDrugsProps> = ({
  medicines,
  delegations,
  onDelegation,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [showAddToCart, setShowAddToCart] = useState(false);

  // Filter medicines by search term
  const filteredMedicines = useMemo(() => {
    return medicines.filter((medicine) =>
      medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      medicine.barcode?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [medicines, searchTerm]);

  // Calculate delegated quantity for each medicine
  const getDelegatedQuantity = (medicineId: string): number => {
    return delegations
      .filter((d) => d.medicineId === medicineId && d.status !== 'rejected')
      .reduce((sum, d) => sum + d.quantity, 0);
  };

  // Handle add to cart click
  const handleAddToCartClick = (medicine: Medicine) => {
    setSelectedMedicine(medicine);
    setShowAddToCart(true);
  };

  // Handle close modal
  const handleCloseModal = () => {
    setShowAddToCart(false);
    setSelectedMedicine(null);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get stock status color
  const getStockStatusColor = (medicine: Medicine) => {
    if (medicine.quantity === 0) return 'bg-red-50 border-red-200';
    if (medicine.quantity < medicine.lowStockThreshold) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  const getStockStatusBadge = (medicine: Medicine) => {
    if (medicine.quantity === 0) return 'text-red-700 bg-red-100';
    if (medicine.quantity < medicine.lowStockThreshold) return 'text-yellow-700 bg-yellow-100';
    return 'text-green-700 bg-green-100';
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search by medicine name, generic name, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="text-sm text-gray-500">
          {filteredMedicines.length} of {medicines.length} medicines
        </div>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Medicine Name
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Generic Name
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                Available
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                Status
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Expiry Date
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                Action
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredMedicines.length > 0 ? (
              filteredMedicines.map((medicine) => (
                <tr key={medicine.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{medicine.name}</div>
                    <div className="text-xs text-gray-500">
                      {medicine.packageType} • {medicine.barcode}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{medicine.genericName}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="font-semibold text-gray-900">{medicine.quantity}</div>
                    <div className="text-xs text-gray-500">
                      Delegated: {getDelegatedQuantity(medicine.id)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getStockStatusBadge(
                        medicine
                      )}`}
                    >
                      {medicine.quantity === 0
                        ? 'Out of Stock'
                        : medicine.quantity < medicine.lowStockThreshold
                        ? 'Low Stock'
                        : 'In Stock'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">{formatDate(medicine.expiryDate)}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleAddToCartClick(medicine)}
                      disabled={medicine.quantity === 0}
                      className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                    >
                      Add to Cart
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No medicines found matching your search.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredMedicines.length > 0 ? (
          filteredMedicines.map((medicine) => (
            <div
              key={medicine.id}
              className={`p-4 rounded-lg border ${getStockStatusColor(medicine)}`}
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900">{medicine.name}</h3>
                  <p className="text-sm text-gray-600">{medicine.genericName}</p>
                </div>
                <span
                  className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStockStatusBadge(
                    medicine
                  )}`}
                >
                  {medicine.quantity === 0
                    ? 'Out'
                    : medicine.quantity < medicine.lowStockThreshold
                    ? 'Low'
                    : 'In'}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                <div>
                  <p className="text-gray-600">Available</p>
                  <p className="font-semibold text-gray-900">{medicine.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Expiry</p>
                  <p className="font-semibold text-gray-900">{formatDate(medicine.expiryDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Barcode</p>
                  <p className="font-mono text-sm text-gray-900">{medicine.barcode || 'N/A'}</p>
                </div>
              </div>

              <button
                onClick={() => handleAddToCartClick(medicine)}
                disabled={medicine.quantity === 0}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                Add to Cart
              </button>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No medicines found matching your search.
          </div>
        )}
      </div>

      {/* Add to Cart Modal */}
      {showAddToCart && selectedMedicine && (
        <AddToCartModal
          medicine={selectedMedicine}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
};

export default DelegateDrugs;