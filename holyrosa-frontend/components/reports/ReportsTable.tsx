'use client';

import React, { useState } from 'react';

// Actual structure from API
interface SaleRecord {
  id: number;
  patientName: string;
  folderNo: string;
  age: number;
  sex: string;
  phoneNumber?: string;
  invoiceNo: string;
  unit: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  totalPrice: number;
  saleDate: string;
  barcode?: string;
  soldByRole: string;
  soldByName: string;
}

interface ReportsTableProps {
  sales: SaleRecord[];
  totals: {
    revenue: number;
    itemsSold: number;
    txCount: number;
  };
  isLoading?: boolean;
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('en-NG', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
};

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 2,
  }).format(amount);
};

export const ReportsTable: React.FC<ReportsTableProps> = ({
  sales,
  totals,
  isLoading,
}) => {

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-12 text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="text-gray-600 mt-4">Loading sales report...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
          <p className="text-gray-600 text-sm">Total Revenue</p>
          <p className="text-3xl font-bold text-green-600 mt-2">
            {formatCurrency(totals.revenue)}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm">Total Items Sold</p>
          <p className="text-3xl font-bold text-blue-600 mt-2">{totals.itemsSold}</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
          <p className="text-gray-600 text-sm">Transactions</p>
          <p className="text-3xl font-bold text-purple-600 mt-2">{totals.txCount}</p>
        </div>
      </div>

      {/* Sales Table */}
      {sales.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Sales Details</h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Patient Name
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Sold By
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Unit
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Medicine
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Date/Time
                  </th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-sm font-semibold text-gray-900">
                    Amount (₦)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-700 font-medium">
                      {sale.patientName}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {sale.soldByRole && sale.soldByRole !== 'unknown' ? (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          sale.soldByRole === 'ipp' ? 'bg-blue-100 text-blue-800' :
                          sale.soldByRole === 'dispensary' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {sale.soldByRole === 'ipp' ? 'IPP' : 
                           sale.soldByRole === 'dispensary' ? 'Dispensary' : 
                           sale.soldByRole}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs italic">Not recorded</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        sale.unit === 'N/A' 
                          ? 'bg-gray-100 text-gray-500' 
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {sale.medicineName}
                    </td>
                    <td className="px-6 py-4 text-center text-sm">
                      <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                        {sale.quantity}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(sale.saleDate)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                        sale.status === 'returned'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-green-100 text-green-800'
                      }`}>
                        {sale.status === 'returned' ? 'Returned' : 'Completed'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-green-600">
                      {formatCurrency(sale.totalPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Sale Details Summary */}
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            <details className="cursor-pointer">
              <summary className="font-semibold text-gray-900 hover:text-blue-600">
                View Sale Details
              </summary>
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                {sales.map((sale) => (
                  <div key={sale.id} className="bg-white p-4 rounded border border-gray-200">
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <p className="text-sm font-semibold text-gray-900">{sale.patientName}</p>
                      <p className="text-xs text-gray-500">{sale.folderNo && `Folder: ${sale.folderNo}`}</p>
                      <p className="text-xs text-gray-600 mt-2">
                        Sold by: 
                        {sale.soldByRole && sale.soldByRole !== 'unknown' ? (
                          <span className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold ${
                            sale.soldByRole === 'ipp' ? 'bg-blue-100 text-blue-800' :
                            sale.soldByRole === 'dispensary' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {sale.soldByRole === 'ipp' ? 'IPP' : 
                             sale.soldByRole === 'dispensary' ? 'Dispensary' : 
                             sale.soldByRole}
                          </span>
                        ) : (
                          <span className="ml-2 text-gray-400 italic">Not recorded</span>
                        )}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Medicine:</span>
                        <span className="font-medium text-gray-900">{sale.medicineName}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Unit:</span>
                        <span className={`font-medium ${
                          sale.unit === 'N/A' 
                            ? 'text-gray-400 italic' 
                            : 'text-gray-900'
                        }`}>
                          {sale.unit}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium text-gray-900">{sale.quantity}x</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Unit Price:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(sale.sellingPrice)}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Subtotal:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(sale.quantity * sale.sellingPrice)}</span>
                      </div>
                      {sale.discount > 0 && (
                        <div className="flex justify-between text-sm text-orange-600 font-semibold">
                          <span>Discount Applied:</span>
                          <span>-{formatCurrency(sale.discount)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm font-semibold text-green-600 pt-2 border-t border-gray-200">
                        <span>Amount Paid:</span>
                        <span>{formatCurrency(sale.totalPrice)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg">No sales found for the selected date range</p>
          <p className="text-gray-400 mt-2">Try selecting a different date range</p>
        </div>
      )}
    </div>
  );
};