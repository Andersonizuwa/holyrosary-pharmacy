'use client';

import React, { useState } from 'react';
import { useDelegationCart, CartItem } from '@/context/DelegationCartContext';
import DelegationCheckout from './DelegationCheckout';

interface CartModalProps {
  onClose: () => void;
}

export const CartModal: React.FC<CartModalProps> = ({ onClose }) => {
  const { cart, removeFromCart, updateCartQuantity } = useDelegationCart();
  const [showCheckout, setShowCheckout] = useState(false);

  if (showCheckout) {
    return <DelegationCheckout onClose={() => setShowCheckout(false)} />;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 px-6 py-4 border-b border-gray-200 bg-white">
          <h3 className="text-lg font-semibold text-gray-900">Delegation Cart</h3>
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          {cart.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">Your cart is empty</p>
              <p className="text-sm text-gray-400">Add medicines to start delegating</p>
            </div>
          ) : (
            <div className="space-y-4">
              {cart.map((item) => (
                <div
                  key={item.medicineId}
                  className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-900">{item.medicineName}</h4>
                    <p className="text-sm text-gray-600">{item.genericName}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {item.packageType} • Available: {item.availableQuantity}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 ml-4">
                    {/* Quantity Input */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateCartQuantity(item.medicineId, Math.max(1, item.quantity - 1))
                        }
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 transition"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value) || 1;
                          updateCartQuantity(item.medicineId, val);
                        }}
                        min="1"
                        max={item.availableQuantity}
                        className="w-16 text-center border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        onClick={() =>
                          updateCartQuantity(
                            item.medicineId,
                            Math.min(item.availableQuantity, item.quantity + 1)
                          )
                        }
                        className="px-2 py-1 border border-gray-300 rounded hover:bg-gray-100 transition"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.medicineId)}
                      className="text-red-600 hover:text-red-700 font-medium transition"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Continue Shopping
            </button>
            <button
              onClick={() => setShowCheckout(true)}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
            >
              Proceed to Delegate
            </button>
          </div>
        )}

        {/* Close Button for Empty Cart */}
        {cart.length === 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex gap-3">
            <button
              onClick={onClose}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CartModal;