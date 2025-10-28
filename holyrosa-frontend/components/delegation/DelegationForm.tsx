'use client';

import React, { useState } from 'react';
import { Medicine, Delegation } from '@/types';

interface DelegationFormProps {
  medicine: Medicine;
  onSuccess: (delegation: Delegation) => void;
  onCancel: () => void;
}

interface FormData {
  quantityToDelegated: number;
  delegateTo: 'ipp' | 'dispensary' | 'other';
  delegationDate: string;
  remarks: string;
}

/**
 * DelegationForm Component
 * Modal form for delegating drugs to IPP, Dispensary, or Others
 * - Pre-filled read-only fields from selected medicine
 * - Validation for quantity (cannot exceed available stock)
 * - Real-time error messages
 */
export const DelegationForm: React.FC<DelegationFormProps> = ({
  medicine,
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState<FormData>({
    quantityToDelegated: 0,
    delegateTo: 'ipp',
    delegationDate: getTodayDate(),
    remarks: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format
  function getTodayDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get display value for quantity (empty string for zero)
  const getDisplayValue = (value: number): string => {
    return value === 0 ? '' : String(value);
  };

  // Handle input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (formData.quantityToDelegated <= 0) {
      newErrors.quantityToDelegated = 'Quantity must be greater than 0';
    }

    if (formData.quantityToDelegated > medicine.quantity) {
      newErrors.quantityToDelegated = `Quantity cannot exceed available stock (${medicine.quantity})`;
    }

    if (!formData.delegateTo) {
      newErrors.delegateTo = 'Please select where to delegate';
    }

    if (!formData.delegationDate) {
      newErrors.delegationDate = 'Delegation date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Create delegation record
      const newDelegation: Delegation = {
        id: Date.now().toString(),
        medicineId: medicine.id,
        medicineName: medicine.name,
        genericName: medicine.genericName,
        quantity: formData.quantityToDelegated,
        fromUserId: 'current-user-id', // Replace with actual user from context
        fromUserName: 'Store Officer', // Replace with actual user from context
        toRole: formData.delegateTo,
        remarks: formData.remarks || undefined,
        status: 'pending',
        delegationDate: formData.delegationDate,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Call success callback
      onSuccess(newDelegation);

      // Show success toast (you can implement this with a toast library)
      console.log('✓ Drug delegated successfully!');
    } catch (error) {
      console.error('Error delegating drug:', error);
      setErrors({ submit: 'Failed to delegate drug. Please try again.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Modal Backdrop */}
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        {/* Modal Container */}
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900">Delegate Drug</h2>
            <button
              onClick={onCancel}
              className="text-gray-500 hover:text-gray-700 text-2xl"
              aria-label="Close"
            >
              ×
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Error Message */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{errors.submit}</p>
              </div>
            )}

            {/* Medicine Information Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-4">
              <h3 className="font-semibold text-gray-900">Medicine Information</h3>

              {/* Medicine Name - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Medicine Name <span className="text-gray-500">(Auto-filled)</span>
                </label>
                <input
                  type="text"
                  value={medicine.name}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Generic Name - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Generic Name <span className="text-gray-500">(Auto-filled)</span>
                </label>
                <input
                  type="text"
                  value={medicine.genericName}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600 cursor-not-allowed"
                />
              </div>

              {/* Quantity Available - Read Only */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity Available <span className="text-gray-500">(Auto-filled)</span>
                </label>
                <input
                  type="number"
                  value={medicine.quantity}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600 cursor-not-allowed"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {medicine.packageType} • Expiry: {formatDate(medicine.expiryDate)}
                </p>
              </div>
            </div>

            {/* Delegation Details Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Delegation Details</h3>

              {/* Quantity to Delegate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity to Delegate
                </label>
                <input
                  type="number"
                  name="quantityToDelegated"
                  value={getDisplayValue(formData.quantityToDelegated)}
                  onChange={handleInputChange}
                  placeholder="Enter quantity"
                  min="0"
                  step="1"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantityToDelegated ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantityToDelegated && (
                  <p className="text-red-600 text-xs mt-1">{errors.quantityToDelegated}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Max available: {medicine.quantity}
                </p>
              </div>

              {/* Delegate To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delegate To
                </label>
                <select
                  name="delegateTo"
                  value={formData.delegateTo}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.delegateTo ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">-- Select --</option>
                  <option value="ipp">IPP (Integrated Pharmacy Partner)</option>
                  <option value="dispensary">Dispensary</option>
                  <option value="other">Others</option>
                </select>
                {errors.delegateTo && (
                  <p className="text-red-600 text-xs mt-1">{errors.delegateTo}</p>
                )}
              </div>

              {/* Delegation Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date of Delegation
                </label>
                <input
                  type="date"
                  name="delegationDate"
                  value={formData.delegationDate}
                  onChange={handleInputChange}
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.delegationDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.delegationDate && (
                  <p className="text-red-600 text-xs mt-1">{errors.delegationDate}</p>
                )}
              </div>

              {/* Remarks */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Remarks
                </label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleInputChange}
                  placeholder="Add any additional notes..."
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
              </div>
            </div>

            {/* Summary */}
            {formData.quantityToDelegated > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <span className="font-medium">Summary:</span> You&apos;re delegating{' '}
                  <span className="font-semibold text-green-700">{formData.quantityToDelegated}</span>{' '}
                  unit(s) of <span className="font-semibold">{medicine.name}</span> to{' '}
                  <span className="font-semibold text-blue-700 capitalize">
                    {formData.delegateTo}
                  </span>{' '}
                  on <span className="font-semibold">{formatDate(formData.delegationDate)}</span>.
                </p>
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex gap-4 justify-end border-t border-gray-200 pt-6">
              <button
                type="button"
                onClick={onCancel}
                className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
              >
                {isSubmitting ? 'Processing...' : 'Delegate Drug'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default DelegationForm;