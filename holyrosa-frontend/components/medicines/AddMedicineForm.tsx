'use client';

import React, { useState } from 'react';
import { Medicine } from '@/types';
import api from '@/lib/api';

interface FormData {
  barcode: string;
  name: string;
  genericName: string;
  manufacturingDate: string;
  expiryDate: string;
  packageType: string;
  quantity: number;
  buyPrice: number;
  totalPrice: number;
  sellingPrice: number;
}

interface AddMedicineFormProps {
  onSuccess?: (medicine: Medicine) => void;
}

/**
 * AddMedicineForm - Form component for adding new medicines
 * Includes:
 * - All required fields with validation
 * - Auto-calculation of Total Price = Quantity × Buy Price
 * - Real-time price calculation feedback
 * - Success message on submission
 */
export const AddMedicineForm: React.FC<AddMedicineFormProps> = ({ onSuccess }) => {
  const [successMessage, setSuccessMessage] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = (): string => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [formData, setFormData] = useState<FormData>({
    barcode: '',
    name: '',
    genericName: '',
    manufacturingDate: getTodayDate(),
    expiryDate: '',
    packageType: '',
    quantity: 0,
    buyPrice: 0,
    totalPrice: 0,
    sellingPrice: 0,
  });

  // Display values for inputs (empty string for zero to show blank fields)
  const getDisplayValue = (value: number): string => {
    return value === 0 ? '' : String(value);
  };

  // Auto-calculate total price when quantity or buyPrice changes
  const updateTotalPrice = (quantity: number, buyPrice: number) => {
    const total = quantity * buyPrice;
    return total;
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? parseFloat(value) || 0 : value;

    let newFormData = {
      ...formData,
      [name]: parsedValue,
    };

    // Auto-calculate total price when quantity or buyPrice changes
    if (name === 'quantity' || name === 'buyPrice') {
      const qty = name === 'quantity' ? (parsedValue as number) : formData.quantity;
      const price = name === 'buyPrice' ? (parsedValue as number) : formData.buyPrice;
      newFormData.totalPrice = updateTotalPrice(qty, price);
    }

    setFormData(newFormData);

    // Clear error for this field if it exists
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Medicine name is required';
    if (!formData.genericName.trim()) newErrors.genericName = 'Generic name is required';
    if (!formData.packageType.trim()) newErrors.packageType = 'Package type is required';
    if (!formData.manufacturingDate)
      newErrors.manufacturingDate = 'Manufacturing date is required';
    if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
    if (formData.quantity <= 0) newErrors.quantity = 'Quantity must be greater than 0';
    if (formData.buyPrice <= 0) newErrors.buyPrice = 'Buy price must be greater than 0';
    if (formData.sellingPrice <= 0) newErrors.sellingPrice = 'Selling price must be greater than 0';

    // Validate dates
    if (formData.manufacturingDate && formData.expiryDate) {
      const mfgDate = new Date(formData.manufacturingDate);
      const expDate = new Date(formData.expiryDate);

      if (mfgDate >= expDate) {
        newErrors.expiryDate = 'Expiry date must be after manufacturing date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare medicine object for API
      const newMedicineData = {
        barcode: formData.barcode || undefined,
        name: formData.name,
        genericName: formData.genericName,
        quantity: formData.quantity,
        packageType: formData.packageType,
        manufacturingDate: formData.manufacturingDate,
        expiryDate: formData.expiryDate,
        buyPrice: formData.buyPrice,
        sellingPrice: formData.sellingPrice,
        lowStockThreshold: 50, // Default value
      };

      // Call API to save medicine (api client handles auth automatically)
      const response = await api.post('/medicines', newMedicineData);
      const newMedicine: Medicine = response.data;

      // Show success message
      setSuccessMessage(`✓ ${formData.name} has been added successfully!`);

      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess(newMedicine);
      }

      // Reset form with today's date
      const today = getTodayDate();
      setFormData({
        barcode: '',
        name: '',
        genericName: '',
        manufacturingDate: today,
        expiryDate: '',
        packageType: '',
        quantity: 0,
        buyPrice: 0,
        totalPrice: 0,
        sellingPrice: 0,
      });

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error: any) {
      console.error('Error adding medicine:', error);
      const errorMessage = 
        error.response?.data?.message || 
        error.message || 
        'Failed to add medicine. Please try again.';
      setErrors({ submit: errorMessage });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      {/* Error Message */}
      {errors.submit && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">{errors.submit}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 md:p-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Add New Medicine</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Barcode */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Barcode <span className="text-gray-400">(Optional)</span>
            </label>
            <input
              type="text"
              name="barcode"
              value={formData.barcode}
              onChange={handleInputChange}
              placeholder="e.g., BAR12345"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Name/Strength */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Medicine Name/Strength
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Paracetamol 500mg"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Generic Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Generic Name
            </label>
            <input
              type="text"
              name="genericName"
              value={formData.genericName}
              onChange={handleInputChange}
              placeholder="e.g., Paracetamol"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.genericName ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.genericName && (
              <p className="text-red-600 text-xs mt-1">{errors.genericName}</p>
            )}
          </div>

          {/* Package Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Package Type
            </label>
            <input
              type="text"
              name="packageType"
              value={formData.packageType}
              onChange={handleInputChange}
              placeholder="e.g., Tablet, Syrup, Injection, Cream"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.packageType ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.packageType && (
              <p className="text-red-600 text-xs mt-1">{errors.packageType}</p>
            )}
          </div>

          {/* Manufacturing Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              name="manufacturingDate"
              value={formData.manufacturingDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.manufacturingDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.manufacturingDate && (
              <p className="text-red-600 text-xs mt-1">{errors.manufacturingDate}</p>
            )}
          </div>

          {/* Expiry Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Expiry Date
            </label>
            <input
              type="date"
              name="expiryDate"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.expiryDate ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.expiryDate && <p className="text-red-600 text-xs mt-1">{errors.expiryDate}</p>}
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={getDisplayValue(formData.quantity)}
              onChange={handleInputChange}
              placeholder="Enter quantity"
              min="0"
              step="1"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.quantity ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.quantity && <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
          </div>

          {/* Buy Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buy Price (₦)
            </label>
            <input
              type="number"
              name="buyPrice"
              value={getDisplayValue(formData.buyPrice)}
              onChange={handleInputChange}
              placeholder="Enter buy price"
              min="0"
              step="0.01"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.buyPrice ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.buyPrice && <p className="text-red-600 text-xs mt-1">{errors.buyPrice}</p>}
          </div>

          {/* Total Price (Read-only, Auto-calculated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Total Price (₦) <span className="text-gray-500">(Auto-calculated)</span>
            </label>
            <input
              type="number"
              name="totalPrice"
              value={formData.totalPrice > 0 ? formData.totalPrice.toFixed(2) : ''}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 bg-gray-50 rounded-lg text-gray-600 cursor-not-allowed"
            />
          </div>

          {/* Selling Price */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selling Price (₦)
            </label>
            <input
              type="number"
              name="sellingPrice"
              value={getDisplayValue(formData.sellingPrice)}
              onChange={handleInputChange}
              placeholder="Enter selling price"
              min="0"
              step="0.01"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sellingPrice ? 'border-red-500' : 'border-gray-300'
              }`}
            />
            {errors.sellingPrice && (
              <p className="text-red-600 text-xs mt-1">{errors.sellingPrice}</p>
            )}
          </div>
        </div>

        {/* Form Actions */}
        <div className="mt-8 flex gap-4 justify-end">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Saving...' : 'Save Medicine'}
          </button>
        </div>
      </form>
    </div>
  );
};