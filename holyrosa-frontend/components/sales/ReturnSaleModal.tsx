'use client';

import React, { useState, useMemo } from 'react';
import { RecordedSale } from './SalesForm';

interface ReturnSaleModalProps {
  isOpen: boolean;
  sale: RecordedSale | null;
  onClose: () => void;
  onReturn: (returnQuantities: { medicineId: string; quantity: number }[]) => void;
  isLoading?: boolean;
}

export const ReturnSaleModal: React.FC<ReturnSaleModalProps> = ({
  isOpen,
  sale,
  onClose,
  onReturn,
  isLoading = false,
}) => {
  const [returnQuantities, setReturnQuantities] = useState<{ [key: string]: number }>({});

  // Initialize return quantities when modal opens
  React.useEffect(() => {
    if (isOpen && sale && Object.keys(returnQuantities).length === 0) {
      const initialized: { [key: string]: number } = {};
      sale.medicines.forEach((med) => {
        initialized[med.medicineId] = med.quantity;
      });
      setReturnQuantities(initialized);
    }
  }, [isOpen, sale?.medicines, returnQuantities]);

  const totalQty = sale?.medicines.reduce((sum, med) => sum + med.quantity, 0) || 0;
  const totalReturnQty = useMemo(
    () => Object.values(returnQuantities).reduce((sum, qty) => sum + qty, 0),
    [returnQuantities]
  );

  if (!isOpen || !sale) {
    return null;
  }

  const handleQuantityChange = (medicineId: string, newQty: number) => {
    const medicine = sale.medicines.find((m) => m.medicineId === medicineId);
    if (!medicine) return;

    // Clamp between 0 and original quantity
    const clamped = Math.max(0, Math.min(newQty, medicine.quantity));
    setReturnQuantities((prev) => ({ ...prev, [medicineId]: clamped }));
  };

  const handleConfirm = () => {
    // Filter out medicines with 0 quantity and convert to array
    const medicinesToReturn = Object.entries(returnQuantities)
      .filter(([_, qty]) => qty > 0)
      .map(([medicineId, quantity]) => ({ medicineId, quantity }));
    
    onReturn(medicinesToReturn);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-green-50 to-emerald-50">
          <h2 className="text-xl font-bold text-gray-900">↩️ Return Units to Stock</h2>
          <p className="text-sm text-gray-600 mt-1">Select how many units to return</p>
        </div>

        {/* Sale Details */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="space-y-2 text-sm">
            <p className="text-gray-600">
              <span className="font-semibold">Patient:</span> {sale.patientName}
            </p>
            <p className="text-gray-600">
              <span className="font-semibold">Total Units:</span> {totalQty} unit(s)
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

        {/* Return Quantities */}
        <div className="p-6 space-y-4">
          <p className="text-sm font-semibold text-gray-900">Select quantities to return:</p>
          <div className="space-y-3">
            {sale.medicines.map((medicine) => (
              <div key={medicine.medicineId} className="flex items-center justify-between bg-green-50 p-3 rounded border border-green-200">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{medicine.medicineName}</p>
                  <p className="text-xs text-gray-500">Original sold: {medicine.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        medicine.medicineId,
                        (returnQuantities[medicine.medicineId] || medicine.quantity) - 1
                      )
                    }
                    className="w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600"
                  >
                    −
                  </button>
                  <input
                    type="number"
                    min="0"
                    max={medicine.quantity}
                    value={returnQuantities[medicine.medicineId] ?? medicine.quantity}
                    onChange={(e) =>
                      handleQuantityChange(medicine.medicineId, parseInt(e.target.value) || 0)
                    }
                    className="w-12 h-8 text-center border border-gray-300 rounded font-semibold"
                  />
                  <button
                    onClick={() =>
                      handleQuantityChange(
                        medicine.medicineId,
                        (returnQuantities[medicine.medicineId] || medicine.quantity) + 1
                      )
                    }
                    className="w-8 h-8 rounded border border-gray-300 bg-white hover:bg-gray-100 flex items-center justify-center text-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>
            ))}
            <div className="pt-3 border-t border-green-200">
              <p className="text-sm font-semibold text-green-700">Total returning: {totalReturnQty} unit(s)</p>
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
            onClick={handleConfirm}
            disabled={isLoading || totalReturnQty === 0}
            className="flex-1 px-4 py-2 font-medium rounded-lg text-white bg-green-600 hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
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
              `Return ${totalReturnQty} Unit${totalReturnQty !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnSaleModal;