'use client';

import React, { useState } from 'react';
import { useDelegationCart, CartItem } from '@/context/DelegationCartContext';
import api from '@/lib/api';
import { DelegationSuccessModal } from './DelegationSuccessModal';

interface CheckoutItem {
  medicineId: string;
  medicineName: string;
  genericName: string;
  packageType: string;
  cartQuantity: number;
  delegations: {
    delegateTo: 'ipp' | 'dispensary' | 'other';
    quantity: number;
    delegationDate: string;
    remarks: string;
  }[];
}

interface DelegationCheckoutProps {
  onClose: () => void;
}

const getTodayDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DelegationCheckout: React.FC<DelegationCheckoutProps> = ({ onClose }) => {
  const { cart, clearCart } = useDelegationCart();
  const [checkoutItems, setCheckoutItems] = useState<CheckoutItem[]>(
    cart.map((item) => ({
      ...item,
      cartQuantity: item.quantity,
      delegations: [
        {
          delegateTo: 'ipp' as const,
          quantity: item.quantity,
          delegationDate: getTodayDate(),
          remarks: '',
        },
      ],
    }))
  );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCount, setSuccessCount] = useState(0);

  const addDelegationRow = (medicineId: string) => {
    setCheckoutItems((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              delegations: [
                ...item.delegations,
                {
                  delegateTo: 'dispensary' as const,
                  quantity: 0,
                  delegationDate: getTodayDate(),
                  remarks: '',
                },
              ],
            }
          : item
      )
    );
  };

  const removeDelegationRow = (medicineId: string, index: number) => {
    setCheckoutItems((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              delegations: item.delegations.filter((_, i) => i !== index),
            }
          : item
      )
    );
  };

  const updateDelegationRow = (medicineId: string, index: number, field: string, value: any) => {
    setCheckoutItems((prev) =>
      prev.map((item) =>
        item.medicineId === medicineId
          ? {
              ...item,
              delegations: item.delegations.map((d, i) =>
                i === index ? { ...d, [field]: value } : d
              ),
            }
          : item
      )
    );
  };

  const validateCheckout = (): boolean => {
    const newErrors: Record<string, string> = {};

    checkoutItems.forEach((item) => {
      let totalQuantity = 0;
      item.delegations.forEach((d, index) => {
        if (d.quantity <= 0) {
          newErrors[`${item.medicineId}-${index}-qty`] = 'Quantity must be greater than 0';
        }
        totalQuantity += d.quantity;
      });

      if (totalQuantity !== item.cartQuantity) {
        newErrors[`${item.medicineId}-total`] = `Total delegated (${totalQuantity}) must equal cart quantity (${item.cartQuantity})`;
      }

      if (item.delegations.length === 0) {
        newErrors[`${item.medicineId}-delegations`] = 'At least one delegation is required';
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateCheckout()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare delegations for API
      const delegations = [];
      checkoutItems.forEach((item) => {
        item.delegations.forEach((d) => {
          delegations.push({
            medicineId: parseInt(item.medicineId, 10),
            quantity: parseInt(d.quantity, 10) || 0,
            delegatedTo: d.delegateTo,
            delegationDate: d.delegationDate,
            genericName: item.genericName,
          });
        });
      });

      // Submit all delegations
      for (const delegation of delegations) {
        try {
          await api.post('/delegations', delegation);
        } catch (error: any) {
          const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create delegation';
          console.error('Delegation error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: errorMsg
          });
          // Preserve the error with response data
          const newError = new Error(errorMsg);
          (newError as any).response = error.response;
          throw newError;
        }
      }

      clearCart();
      setSuccessCount(delegations.length);
      setShowSuccess(true);
    } catch (error: any) {
      console.error('Error submitting delegations:', error);
      
      // Extract error message from various possible sources
      let errorMsg = 'Failed to submit delegations. Please try again.';
      
      if (error.response?.data) {
        // Try to get the most detailed error message
        errorMsg = error.response.data.error || error.response.data.message || JSON.stringify(error.response.data);
      } else if (error.message) {
        errorMsg = error.message;
      }
      
      console.error('Final error message:', errorMsg);
      console.error('Full response data:', error.response?.data);
      setErrors({ submit: errorMsg });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSuccessClose = () => {
    setShowSuccess(false);
    onClose();
    window.location.reload();
  };

  return (
    <>
      <DelegationSuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        itemCount={successCount}
      />
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 px-6 py-4 border-b border-gray-200 bg-white">
            <h3 className="text-lg font-semibold text-gray-900">Delegation Checkout</h3>
            <p className="text-sm text-gray-600">Specify delegation targets and quantities</p>
          </div>

          {/* Body */}
          <div className="px-6 py-6 space-y-6">
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-700 text-sm">{errors.submit}</p>
              </div>
            )}

            {checkoutItems.map((item) => (
              <div key={item.medicineId} className="border border-gray-200 rounded-lg p-4">
                {/* Medicine Header */}
                <div className="mb-4 pb-4 border-b border-gray-200">
                  <h4 className="font-semibold text-gray-900">{item.medicineName}</h4>
                  <p className="text-sm text-gray-600">{item.genericName}</p>
                  <div className="flex items-center gap-4 mt-2 text-sm">
                    <span className="text-gray-600">
                      Type: <span className="font-medium">{item.packageType}</span>
                    </span>
                    <span className="text-gray-600">
                      Cart Qty: <span className="font-semibold text-blue-600">{item.cartQuantity}</span>
                    </span>
                  </div>

                  {errors[`${item.medicineId}-total`] && (
                    <p className="text-red-600 text-xs mt-2">{errors[`${item.medicineId}-total`]}</p>
                  )}
                </div>

                {/* Delegation Rows */}
                <div className="space-y-3 mb-4">
                  {item.delegations.map((delegation, index) => (
                    <div key={index} className="flex items-end gap-3 p-3 bg-gray-50 rounded-lg">
                      {/* Delegate To */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Delegate To
                        </label>
                        <select
                          value={delegation.delegateTo}
                          onChange={(e) =>
                            updateDelegationRow(
                              item.medicineId,
                              index,
                              'delegateTo',
                              e.target.value as 'ipp' | 'dispensary' | 'other'
                            )
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="ipp">IPP</option>
                          <option value="dispensary">Dispensary</option>
                          <option value="other">Other</option>
                        </select>
                      </div>

                      {/* Quantity */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          value={delegation.quantity}
                          onChange={(e) =>
                            updateDelegationRow(
                              item.medicineId,
                              index,
                              'quantity',
                              parseInt(e.target.value) || 0
                            )
                          }
                          min="0"
                          max={item.cartQuantity}
                          className={`w-full px-3 py-2 border rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors[`${item.medicineId}-${index}-qty`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors[`${item.medicineId}-${index}-qty`] && (
                          <p className="text-red-600 text-xs mt-1">
                            {errors[`${item.medicineId}-${index}-qty`]}
                          </p>
                        )}
                      </div>

                      {/* Date */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                        <input
                          type="date"
                          value={delegation.delegationDate}
                          onChange={(e) =>
                            updateDelegationRow(item.medicineId, index, 'delegationDate', e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Remarks */}
                      <div className="flex-1">
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Remarks
                        </label>
                        <input
                          type="text"
                          value={delegation.remarks}
                          onChange={(e) =>
                            updateDelegationRow(item.medicineId, index, 'remarks', e.target.value)
                          }
                          placeholder="Optional"
                          className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>

                      {/* Remove Button */}
                      {item.delegations.length > 1 && (
                        <button
                          onClick={() => removeDelegationRow(item.medicineId, index)}
                          className="px-3 py-2 text-red-600 hover:text-red-700 font-medium text-sm transition"
                        >
                          ✕
                        </button>
                      )}
                  </div>
                ))}
              </div>

                {/* Add Another Delegation */}
                <button
                  onClick={() => addDelegationRow(item.medicineId)}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                >
                  + Add Another Delegation
                </button>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 px-6 py-4 border-t border-gray-200 bg-white flex gap-3">
            <button
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition disabled:opacity-50"
            >
              Back to Cart
            </button>
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Delegating...' : 'Delegate All'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default DelegationCheckout;