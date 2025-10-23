'use client';

import React from 'react';
import { RecordedSale } from './SalesForm';

interface DeleteSaleModalProps {
  isOpen: boolean;
  sale: RecordedSale | null;
  onClose: () => void;
  onDeletePermanently: () => void;
  isLoading?: boolean;
}

export const DeleteSaleModal: React.FC<DeleteSaleModalProps> = ({
  isOpen,
  sale,
  onClose,
  onDeletePermanently,
  isLoading = false,
}) => {
  if (!isOpen || !sale) {
    return null;
  }

  const totalQty = sale.medicines.reduce((sum, med) => sum + med.quantity, 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-red-50 to-orange-50">
          <h2 className="text-xl font-bold text-gray-900">🗑️ Delete Sale Record</h2>
          <p className="text-sm text-gray-600 mt-1">Permanently remove this sale record</p>
        </div>

        {/* Sale Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="font-semibold">Patient:</span> {sale.patientName}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Medicines:</span> {totalQty} unit(s)
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Amount:</span> ₦{sale.totalAmount.toFixed(2)}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Date:</span>{' '}
              {new Date(sale.createdAt).toLocaleString('en-NG', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          </div>
        </div>

        {/* Warning Message */}
        <div className="p-6 bg-red-50 border-b border-red-200">
          <div className="flex gap-3">
            <div className="flex-shrink-0">
              <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-red-900">Warning</p>
              <p className="text-xs text-red-700 mt-1">
                This will only remove the record. The medicine stays sold out. To restore units to stock, use the return option instead.
              </p>
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="p-6 bg-gray-50 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 px-4 py-2 bg-gray-300 text-gray-900 font-medium rounded-lg hover:bg-gray-400 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onDeletePermanently}
            disabled={isLoading}
            className="flex-1 px-4 py-2 font-medium rounded-lg text-white bg-red-600 hover:bg-red-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Processing...
              </span>
            ) : (
              'Delete Permanently'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteSaleModal;