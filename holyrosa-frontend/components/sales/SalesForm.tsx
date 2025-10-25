'use client';

import React, { useState, useEffect } from 'react';
import { Medicine } from '@/types';
import { calculateDiscountedTotal, getUnitDiscount, getAvailableUnits, formatDiscount } from '@/utils/discounts';
import { generateInvoiceNumber } from '@/utils/invoiceNumber';

export interface RecordedSale {
  id: string;
  patientName: string;
  folderNo: string;
  age: number;
  sex: 'Male' | 'Female';
  unit: string;
  invoiceNo: string;
  phoneNumber?: string;
  medicines: SaleMedicineItem[];
  discountPercentage: number;
  totalAmount: number;
  createdAt: string;
}

interface SaleMedicineItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  sellingPrice: number;
  total: number;
}

interface SalesFormProps {
  delegatedMedicines: Medicine[];
  onSaleRecorded: (sale: RecordedSale) => void;
}

export const SalesForm: React.FC<SalesFormProps> = ({ delegatedMedicines, onSaleRecorded }) => {
  // Patient Details State
  const [patientName, setPatientName] = useState('');
  const [unit, setUnit] = useState('');
  const [folderNo, setFolderNo] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState<'Male' | 'Female'>('Male');
  const [invoiceNo, setInvoiceNo] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');

  // Medicine Details State
  const [selectedMedicine, setSelectedMedicine] = useState('');
  const [quantity, setQuantity] = useState('');
  const [selectedMedicines, setSelectedMedicines] = useState<SaleMedicineItem[]>([]);

  // UI State
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const [errorNotification, setErrorNotification] = useState<{ message: string; id: string } | null>(null);
  const [buttonAnimating, setButtonAnimating] = useState(false);

  // Get discount percentage for selected unit
  const discountPercentage = unit ? getUnitDiscount(unit) : 0;

  // Calculate total for currently selected medicine
  const getCurrentTotal = (): number => {
    if (!selectedMedicine || !quantity) return 0;
    const medicine = delegatedMedicines.find((m) => String(m.id) === String(selectedMedicine));
    if (!medicine) return 0;
    const qty = parseFloat(quantity) || 0;
    const price = typeof medicine.sellingPrice === 'string' ? parseFloat(medicine.sellingPrice) : medicine.sellingPrice;
    return calculateDiscountedTotal(qty, price, discountPercentage);
  };

  // Add medicine to the sales list
  const handleAddMedicine = () => {
    console.log('🔧 handleAddMedicine called!', { selectedMedicine, quantity, delegatedMedicines: delegatedMedicines.length });
    console.log('📋 All medicines in array:', delegatedMedicines.map(m => ({ id: m.id, idType: typeof m.id, name: m.name, quantity: m.quantity })));
    const newErrors: Record<string, string> = {};

    if (!selectedMedicine) newErrors.selectedMedicine = 'Medicine is required';
    if (!quantity || parseFloat(quantity) <= 0) newErrors.quantity = 'Quantity must be greater than 0';

    // Try matching by string comparison
    const medicine = delegatedMedicines.find((m) => String(m.id) === String(selectedMedicine));
    console.log('🔍 Found medicine:', medicine);
    console.log('📊 Comparison:', { 
      qtyInput: quantity, 
      qtyNumber: parseFloat(quantity), 
      medicineQty: medicine?.quantity,
      isGreater: parseFloat(quantity) > (medicine?.quantity || 0)
    });
    
    if (medicine && parseFloat(quantity) > medicine.quantity) {
      newErrors.quantity = `Cannot sell more than ${medicine.quantity} available`;
      console.log('❌ VALIDATION FAILED - Quantity exceeds available:', { qty: parseFloat(quantity), available: medicine.quantity });
    }

    if (Object.keys(newErrors).length > 0) {
      console.log('⛔ Validation errors:', newErrors);
      setErrors((prev) => ({ ...prev, ...newErrors }));
      
      // Show error notification for better UX
      let errorMsg = '';
      if (newErrors.quantity) {
        errorMsg = newErrors.quantity;
      } else if (newErrors.selectedMedicine) {
        errorMsg = newErrors.selectedMedicine;
      }
      
      if (errorMsg) {
        const notificationId = `err_${Date.now()}`;
        setErrorNotification({ message: errorMsg, id: notificationId });
        
        // Add button shake animation
        setButtonAnimating(true);
        setTimeout(() => setButtonAnimating(false), 600);
        
        // Auto-dismiss after 4 seconds
        setTimeout(() => {
          setErrorNotification((prev) => (prev?.id === notificationId ? null : prev));
        }, 4000);
      }
      return;
    }

    if (!medicine) return;

    const qty = parseFloat(quantity);
    const price = typeof medicine.sellingPrice === 'string' ? parseFloat(medicine.sellingPrice) : medicine.sellingPrice;
    const total = calculateDiscountedTotal(qty, price, discountPercentage);

    const newItem: SaleMedicineItem = {
      medicineId: medicine.id,
      medicineName: medicine.name,
      quantity: qty,
      sellingPrice: typeof medicine.sellingPrice === 'string' ? parseFloat(medicine.sellingPrice) : medicine.sellingPrice,
      total,
    };

    setSelectedMedicines([...selectedMedicines, newItem]);
    setSelectedMedicine('');
    setQuantity('');
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors.selectedMedicine;
      delete newErrors.quantity;
      return newErrors;
    });
  };

  // Remove medicine from sales list
  const handleRemoveMedicine = (index: number) => {
    setSelectedMedicines(selectedMedicines.filter((_, i) => i !== index));
  };

  // Calculate total sale amount
  const calculateTotalSaleAmount = (): number => {
    return selectedMedicines.reduce((sum, item) => sum + item.total, 0);
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!patientName.trim()) newErrors.patientName = 'Patient name is required';
    if (!unit) newErrors.unit = 'Unit is required';
    if (!folderNo.trim()) newErrors.folderNo = 'Folder number is required';
    if (!age || parseInt(age) <= 0) newErrors.age = 'Valid age is required';
    if (!sex) newErrors.sex = 'Sex is required';
    if (phoneNumber && !/^\d+$/.test(phoneNumber)) newErrors.phoneNumber = 'Phone number must contain only digits';
    if (selectedMedicines.length === 0) newErrors.medicines = 'At least one medicine is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleCompleteSale = () => {
    if (!validateForm()) return;

    const generatedInvoiceNumber = generateInvoiceNumber();

    const sale: RecordedSale = {
      id: `sale_${Date.now()}`,
      patientName,
      folderNo,
      age: parseInt(age),
      sex,
      unit,
      invoiceNo: invoiceNo || generatedInvoiceNumber,
      phoneNumber: phoneNumber || undefined,
      medicines: selectedMedicines,
      discountPercentage,
      totalAmount: calculateTotalSaleAmount(),
      createdAt: new Date().toISOString(),
    };

    onSaleRecorded(sale);

    // Prepare invoice data
    const totalBeforeDiscount = selectedMedicines.reduce(
      (sum, item) => sum + item.quantity * item.sellingPrice,
      0
    );
    
    // Calculate discount amount - handle both percentage and fixed discounts
    let discountAmount = 0;
    if (discountPercentage < 0) {
      // Fixed amount discount (negative value)
      discountAmount = Math.abs(discountPercentage);
    } else {
      // Percentage discount
      discountAmount = totalBeforeDiscount * (discountPercentage / 100);
    }
    const totalAfterDiscount = Math.max(0, totalBeforeDiscount - discountAmount);

    const invoiceData = {
      invoiceNumber: sale.invoiceNo,
      date: new Date().toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
      time: new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      patient: {
        name: patientName,
        unit,
        folderNumber: folderNo,
        age,
        sex,
        phone: phoneNumber || undefined,
        invoiceNumber: invoiceNo || undefined,
      },
      medicines: selectedMedicines.map((item) => ({
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        totalBeforeDiscount: item.quantity * item.sellingPrice,
      })),
      discountPercentage,
      totalBeforeDiscount,
      discountAmount,
      totalAfterDiscount,
    };

    // Store invoice data temporarily in localStorage for the invoice page
    localStorage.setItem('pending_invoice', JSON.stringify(invoiceData));

    // Show success message
    setSuccessMessage(`✓ Sale recorded successfully for ${patientName}!`);

    // Open invoice in new tab after a brief delay
    setTimeout(() => {
      const invoiceUrl = `/sales/invoice?data=${encodeURIComponent(JSON.stringify(invoiceData))}`;
      window.open(invoiceUrl, '_blank');

      // Reset form
      setPatientName('');
      setUnit('');
      setFolderNo('');
      setAge('');
      setSex('Male');
      setInvoiceNo('');
      setPhoneNumber('');
      setSelectedMedicines([]);
      setSelectedMedicine('');
      setQuantity('');
      setSuccessMessage('');
      setErrors({});
    }, 500);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 md:p-8">
      {/* Error Notification Toast */}
      {errorNotification && (
        <div 
          className="fixed top-4 right-4 z-50"
          style={{
            animation: 'slideInDown 0.3s ease-out'
          }}
        >
          <style>{`
            @keyframes slideInDown {
              from {
                opacity: 0;
                transform: translateY(-20px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
          `}</style>
          <div className="bg-red-500 text-white px-6 py-4 rounded-lg shadow-lg flex items-center gap-3 max-w-md border-l-4 border-red-700">
            <span className="text-xl">⚠️</span>
            <div>
              <p className="font-semibold">Error</p>
              <p className="text-sm">{errorNotification.message}</p>
            </div>
            <button
              onClick={() => setErrorNotification(null)}
              className="ml-4 text-red-200 hover:text-white transition"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-800 font-medium">{successMessage}</p>
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-8">Record Medicine Sale</h2>

      <div className="space-y-8">
        {/* ===== PATIENT DETAILS SECTION ===== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
            👤 Patient Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Patient Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of Patient <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={patientName}
                onChange={(e) => {
                  setPatientName(e.target.value);
                  if (errors.patientName) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.patientName;
                      return newErrors;
                    });
                  }
                }}
                placeholder="e.g., John Doe"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.patientName ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.patientName && <p className="text-red-600 text-xs mt-1">{errors.patientName}</p>}
            </div>

            {/* Unit */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => {
                  setUnit(e.target.value);
                  if (errors.unit) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.unit;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.unit ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select Unit</option>
                {getAvailableUnits().map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
              {errors.unit && <p className="text-red-600 text-xs mt-1">{errors.unit}</p>}
              {unit && (
                <p className="text-xs text-blue-600 mt-1">
                  💰 Discount: {formatDiscount(unit)}
                </p>
              )}
            </div>

            {/* Folder No */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Folder No <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={folderNo}
                onChange={(e) => {
                  setFolderNo(e.target.value);
                  if (errors.folderNo) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.folderNo;
                      return newErrors;
                    });
                  }
                }}
                placeholder="e.g., F123456"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.folderNo ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.folderNo && <p className="text-red-600 text-xs mt-1">{errors.folderNo}</p>}
            </div>

            {/* Age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={age}
                onChange={(e) => {
                  setAge(e.target.value);
                  if (errors.age) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.age;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Enter age"
                min="0"
                max="150"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.age ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.age && <p className="text-red-600 text-xs mt-1">{errors.age}</p>}
            </div>

            {/* Sex */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Sex <span className="text-red-500">*</span>
              </label>
              <select
                value={sex}
                onChange={(e) => setSex(e.target.value as 'Male' | 'Female')}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            {/* Invoice No (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Invoice No <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="text"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="Auto-generated if left blank"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number (Optional) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number <span className="text-gray-400">(Optional)</span>
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value);
                  if (errors.phoneNumber) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.phoneNumber;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Digits only"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.phoneNumber && <p className="text-red-600 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>
          </div>
        </div>

        {/* ===== MEDICINE DETAILS SECTION ===== */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
            💊 Medicine Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            {/* Medicine Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Name of Medicine <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedMedicine}
                onChange={(e) => {
                  setSelectedMedicine(e.target.value);
                  // Clear medicine error when user changes the selection
                  if (errors.selectedMedicine) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.selectedMedicine;
                      return newErrors;
                    });
                  }
                }}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.selectedMedicine ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              >
                <option value="">Select Medicine</option>
                {delegatedMedicines.filter((medicine) => medicine.quantity > 0).map((medicine) => (
                  <option key={medicine.id} value={medicine.id}>
                    {medicine.name} ({medicine.quantity} available)
                  </option>
                ))}
              </select>
              {errors.selectedMedicine && (
                <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded text-red-700 text-sm font-medium">
                  ⚠️ {errors.selectedMedicine}
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  // Clear quantity error when user changes the input
                  if (errors.quantity) {
                    setErrors((prev) => {
                      const newErrors = { ...prev };
                      delete newErrors.quantity;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Enter quantity"
                min="0"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500 bg-red-50' : 'border-gray-300'
                }`}
              />
              {errors.quantity && (
                <div className="mt-2 p-2 bg-red-100 border border-red-400 rounded text-red-700 text-sm font-medium">
                  ⚠️ {errors.quantity}
                </div>
              )}
            </div>
          </div>

          {/* Display Selling Price and Total */}
          {selectedMedicine && delegatedMedicines.find((m) => String(m.id) === String(selectedMedicine)) && (
            <div className="bg-blue-50 p-4 rounded-lg mb-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Selling Price</p>
                  <p className="text-xl font-semibold text-gray-900">
                    ₦{delegatedMedicines.find((m) => String(m.id) === String(selectedMedicine))?.sellingPrice.toFixed(2) || '0.00'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Discount</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {unit ? formatDiscount(unit) : 'No discount'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total (After Discount)</p>
                  <p className="text-xl font-semibold text-green-600">
                    ₦{getCurrentTotal().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Add to Sale Button */}
          <style>{`
            @keyframes buttonShake {
              0%, 100% { transform: translateX(0) scale(1); }
              10% { transform: translateX(-12px) scale(1.05); }
              20% { transform: translateX(12px) scale(1.05); }
              30% { transform: translateX(-12px) scale(1.05); }
              40% { transform: translateX(12px) scale(1.05); }
              50% { transform: translateX(-8px) scale(1.05); }
              60% { transform: translateX(8px) scale(1.05); }
              70% { transform: translateX(-4px) scale(1.02); }
              80% { transform: translateX(4px) scale(1.02); }
              90% { transform: translateX(-2px) scale(1.01); }
            }
          `}</style>
          <div className="relative">
            <button
              type="button"
              onMouseDown={(e) => {
                console.log('Mouse down on button');
                e.preventDefault();
              }}
              onMouseUp={(e) => {
                console.log('Mouse up on button');
              }}
              onClick={(e) => {
                console.log('Button clicked!', { selectedMedicine, quantity });
                e.preventDefault();
                handleAddMedicine();
              }}
              className={`w-full md:w-auto px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition cursor-pointer pointer-events-auto ${
                buttonAnimating ? 'border-2 border-red-500 bg-red-600' : ''
              }`}
              style={buttonAnimating ? {
                animation: 'buttonShake 0.8s ease-in-out',
              } : {}}
            >
              ➕ Add to Sale
            </button>
            {buttonAnimating && (
              <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-3 py-1 rounded text-xs whitespace-nowrap font-medium z-10">
                ✗ Check quantity!
              </div>
            )}
          </div>

          {errors.medicines && <p className="text-red-600 text-sm mt-2">{errors.medicines}</p>}
        </div>

        {/* ===== SALE ITEMS TABLE ===== */}
        {selectedMedicines.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b-2 border-blue-500">
              📋 Sale Items
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-100 border-b-2 border-gray-300">
                    <th className="px-4 py-2 text-left font-semibold text-gray-700">Medicine</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">Qty</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Unit Price</th>
                    <th className="px-4 py-2 text-right font-semibold text-gray-700">Total</th>
                    <th className="px-4 py-2 text-center font-semibold text-gray-700">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMedicines.map((item, index) => (
                    <tr key={index} className="border-b border-gray-200 hover:bg-gray-50">
                      <td className="px-4 py-2 text-gray-900">{item.medicineName}</td>
                      <td className="px-4 py-2 text-center text-gray-900">{item.quantity}</td>
                      <td className="px-4 py-2 text-right text-gray-900">₦{item.sellingPrice.toFixed(2)}</td>
                      <td className="px-4 py-2 text-right font-semibold text-green-600">
                        ₦{item.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleRemoveMedicine(index)}
                          className="text-red-600 hover:text-red-800 font-medium"
                        >
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sale Summary */}
            <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-gray-600">Total Items</p>
                  <p className="text-lg font-semibold text-gray-900">{selectedMedicines.length}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Units</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedMedicines.reduce((sum, item) => sum + item.quantity, 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Discount Applied</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {unit ? formatDiscount(unit) : 'No discount'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Total Sale Amount</p>
                  <p className="text-2xl font-bold text-green-600">
                    ₦{calculateTotalSaleAmount().toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== ACTION BUTTONS ===== */}
        <div className="flex gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={() => {
              setPatientName('');
              setUnit('');
              setFolderNo('');
              setAge('');
              setSex('Male');
              setInvoiceNo('');
              setPhoneNumber('');
              setSelectedMedicines([]);
              setSelectedMedicine('');
              setQuantity('');
              setErrors({});
            }}
            className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition"
          >
            🔄 Cancel
          </button>
          <button
            onClick={handleCompleteSale}
            disabled={selectedMedicines.length === 0}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            ✓ Complete Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default SalesForm;