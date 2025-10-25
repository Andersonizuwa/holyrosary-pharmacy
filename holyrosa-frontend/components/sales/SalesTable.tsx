'use client';

import React, { useState } from 'react';
import { RecordedSale } from './SalesForm';
import ReturnSaleModal from './ReturnSaleModal';

interface SalesTableProps {
  sales: RecordedSale[];
  onDelete: (index: number, action: 'return', returnQuantities?: { medicineId: string; quantity: number }[]) => void;
}

// Helper function to calculate original amount before discount
const calculateOriginalAmount = (sale: RecordedSale): number => {
  return sale.medicines.reduce((sum, med) => sum + (med.quantity * med.sellingPrice), 0);
};

// Helper function to format discount display
const formatDiscountDisplay = (discountPercentage: number, originalAmount: number): string => {
  if (discountPercentage === 0) return 'None';
  if (discountPercentage < 0) {
    // Fixed amount discount
    return `₦${Math.abs(discountPercentage).toFixed(2)}`;
  }
  // Percentage discount
  return `${discountPercentage.toFixed(1)}%`;
};

export const SalesTable: React.FC<SalesTableProps> = ({ sales, onDelete }) => {
  const [selectedSaleIndex, setSelectedSaleIndex] = useState<number | null>(null);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  if (sales.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6 text-center">
        <p className="text-gray-500">No sales recorded yet. Start by recording a sale above.</p>
      </div>
    );
  }

  const handleReturnClick = (index: number) => {
    setSelectedSaleIndex(index);
    setIsReturnModalOpen(true);
  };

  const handleConfirmReturn = async (
    returnQuantities: { medicineId: string; quantity: number }[]
  ) => {
    setIsProcessing(true);
    try {
      if (selectedSaleIndex !== null) {
        await onDelete(selectedSaleIndex, 'return', returnQuantities);
      }
      setIsReturnModalOpen(false);
      setSelectedSaleIndex(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const selectedSale = selectedSaleIndex !== null ? sales[selectedSaleIndex] : null;

  return (
    <>
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">📊 Sales Records</h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-100 border-b-2 border-gray-300">
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Patient Name</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Folder No</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Age/Sex</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Unit</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Medicine(s)</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Qty</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Discount</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Original Amount</th>
                <th className="px-4 py-3 text-right font-semibold text-gray-700">Amount Paid</th>
                <th className="px-4 py-3 text-left font-semibold text-gray-700">Date/Time</th>
                <th className="px-4 py-3 text-center font-semibold text-gray-700">Action</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, index) => (
                <tr
                  key={index}
                  className="border-b border-gray-200 hover:bg-blue-50 transition"
                >
                  <td className="px-4 py-3 text-gray-900 font-medium">{sale.patientName}</td>
                  <td className="px-4 py-3 text-gray-600">{sale.folderNo}</td>
                  <td className="px-4 py-3 text-gray-600">
                    {sale.age} / {sale.sex.charAt(0)}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{sale.unit}</td>
                  <td className="px-4 py-3 text-gray-600">
                    <div className="max-h-12 overflow-y-auto">
                      {sale.medicines.map((med, idx) => (
                        <div key={idx} className="text-xs py-1">
                          • {med.medicineName} ({med.quantity})
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-900 font-medium">
                    {sale.medicines.reduce((sum, med) => sum + med.quantity, 0)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-1 rounded font-semibold ${
                      sale.discountPercentage === 0 
                        ? 'bg-gray-100 text-gray-800' 
                        : sale.discountPercentage < 0
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {formatDiscountDisplay(sale.discountPercentage, calculateOriginalAmount(sale))}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-gray-600">
                    ₦{calculateOriginalAmount(sale).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-green-600">
                    ₦{sale.totalAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">
                    {new Date(sale.createdAt).toLocaleString('en-NG', {
                      dateStyle: 'short',
                      timeStyle: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleReturnClick(index)}
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-600 hover:bg-green-200 transition"
                      title="Return units to stock"
                    >
                      <span className="text-lg">↩️</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Return Modal */}
      <ReturnSaleModal
        isOpen={isReturnModalOpen}
        sale={selectedSale}
        onClose={() => {
          setIsReturnModalOpen(false);
          setSelectedSaleIndex(null);
        }}
        onReturn={handleConfirmReturn}
        isLoading={isProcessing}
      />
    </>
  );
};

export default SalesTable;