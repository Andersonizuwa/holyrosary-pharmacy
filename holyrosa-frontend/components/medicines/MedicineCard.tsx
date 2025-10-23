'use client';

import React from 'react';
import { Medicine } from '@/types';
import { TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface MedicineCardProps {
  medicine: Medicine;
  onDelete?: (medicineId: string | number) => void;
  onEdit?: (medicineId: string | number) => void;
  canManage?: boolean;
}

/**
 * MedicineCard - Displays a single medicine in card format (for mobile view)
 * Shows key information in a readable card layout
 */
export const MedicineCard: React.FC<MedicineCardProps> = ({ medicine, onDelete, onEdit, canManage = false }) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const stockStatus =
    medicine.quantity === 0
      ? 'Out of Stock'
      : medicine.quantity < medicine.lowStockThreshold
        ? 'Low Stock'
        : 'In Stock';

  const stockStatusColor =
    medicine.quantity === 0
      ? 'bg-red-100 text-red-800'
      : medicine.quantity < medicine.lowStockThreshold
        ? 'bg-yellow-100 text-yellow-800'
        : 'bg-green-100 text-green-800';

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4 border-l-4 border-blue-500">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-bold text-gray-900">{medicine.name}</h3>
          <p className="text-sm text-gray-600">{medicine.genericName}</p>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${stockStatusColor}`}>
          {stockStatus}
        </span>
      </div>

      {medicine.barcode && (
        <p className="text-xs text-gray-500 mb-2">
          <strong>Barcode:</strong> {medicine.barcode}
        </p>
      )}

      <div className="grid grid-cols-2 gap-2 text-sm mb-3">
        <div>
          <p className="text-gray-600">Quantity</p>
          <p className="font-semibold text-gray-900">{medicine.quantity}</p>
        </div>
        <div>
          <p className="text-gray-600">Type</p>
          <p className="font-semibold text-gray-900">{medicine.packageType}</p>
        </div>
        <div>
          <p className="text-gray-600">Buy Price</p>
          <p className="font-semibold text-gray-900">₦{medicine.buyPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Sell Price</p>
          <p className="font-semibold text-gray-900">₦{medicine.sellingPrice.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-gray-600">Mfg Date</p>
          <p className="font-semibold text-gray-900 text-xs">{formatDate(medicine.manufacturingDate)}</p>
        </div>
        <div>
          <p className="text-gray-600">Exp Date</p>
          <p className="font-semibold text-gray-900 text-xs">{formatDate(medicine.expiryDate)}</p>
        </div>
      </div>

      <div className="pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Total: <span className="font-semibold text-gray-900">₦{medicine.totalPrice.toFixed(2)}</span>
        </p>
      </div>

      {canManage && (onDelete || onEdit) && (
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-200">
          {onEdit && (
            <button
              onClick={() => onEdit(medicine.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition"
            >
              <PencilIcon className="h-4 w-4" />
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(medicine.id)}
              className="flex-1 flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition"
            >
              <TrashIcon className="h-4 w-4" />
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
};