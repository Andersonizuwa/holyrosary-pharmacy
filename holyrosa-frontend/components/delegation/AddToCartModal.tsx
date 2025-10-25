'use client';

import React, { useState } from 'react';
import { Medicine } from '@/types';
import { useDelegationCart } from '@/context/DelegationCartContext';

interface AddToCartModalProps {
  medicine: Medicine;
  onClose: () => void;
}

export const AddToCartModal: React.FC<AddToCartModalProps> = ({ medicine, onClose }) => {
  const [quantity, setQuantity] = useState('');
  const [error, setError] = useState('');
  const [isTouched, setIsTouched] = useState(false);
  const { addToCart } = useDelegationCart();

  const handleAddToCart = () => {
    const qty = parseInt(quantity) || 0;
    if (qty <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }
    if (qty > medicine.quantity) {
      setError(`Cannot delegate more than ${medicine.quantity} units available`);
      return;
    }

    addToCart(medicine, qty);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add to Cart</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-6 space-y-4">
          {/* Medicine Info (Read-only) */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Medicine</p>
            <p className="font-semibold text-gray-900">{medicine.name}</p>
            <p className="text-xs text-gray-500 mt-1">{medicine.genericName}</p>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div>
                <p className="text-gray-600">Available</p>
                <p className="font-semibold text-gray-900">{medicine.quantity}</p>
              </div>
              <div>
                <p className="text-gray-600">Type</p>
                <p className="font-semibold text-gray-900">{medicine.packageType}</p>
              </div>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity to Add
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '');
                setQuantity(val);
                setError('');
              }}
              onFocus={() => setIsTouched(true)}
              placeholder="Enter quantity"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Max available: {medicine.quantity} units
            </p>
          </div>

          {/* Error Message */}
          {error && <p className="text-red-600 text-sm">{error}</p>}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleAddToCart}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddToCartModal;