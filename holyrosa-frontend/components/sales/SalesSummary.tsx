'use client';

import React, { useMemo } from 'react';
import { RecordedSale } from './SalesForm';

interface SalesSummaryProps {
  sales: RecordedSale[];
}

export const SalesSummary: React.FC<SalesSummaryProps> = ({ sales }) => {
  const summary = useMemo(() => {
    if (sales.length === 0) {
      return {
        totalSales: 0,
        totalAmount: 0,
        totalUnits: 0,
        totalDiscount: 0,
        averageSaleAmount: 0,
        byUnit: {} as Record<string, { count: number; amount: number }>,
      };
    }

    let totalAmount = 0;
    let totalUnits = 0;
    let totalDiscount = 0;
    const byUnit: Record<string, { count: number; amount: number }> = {};

    sales.forEach((sale) => {
      // Total amount
      totalAmount += sale.totalAmount;

      // Total units
      totalUnits += sale.medicines.reduce((sum, med) => sum + med.quantity, 0);

      // Total discount (as a sum of discount amounts)
      sale.medicines.forEach((med) => {
        const discountAmount = (med.quantity * med.sellingPrice * sale.discountPercentage) / 100;
        totalDiscount += discountAmount;
      });

      // By unit
      if (!byUnit[sale.unit]) {
        byUnit[sale.unit] = { count: 0, amount: 0 };
      }
      byUnit[sale.unit].count += 1;
      byUnit[sale.unit].amount += sale.totalAmount;
    });

    return {
      totalSales: sales.length,
      totalAmount,
      totalUnits,
      totalDiscount,
      averageSaleAmount: sales.length > 0 ? totalAmount / sales.length : 0,
      byUnit,
    };
  }, [sales]);

  const topUnit = Object.entries(summary.byUnit).sort(
    ([, a], [, b]) => b.amount - a.amount
  )[0];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Total Sales */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Sales</p>
            <p className="text-3xl font-bold text-gray-900 mt-2">{summary.totalSales}</p>
            <p className="text-xs text-gray-500 mt-1">
              {summary.totalSales === 1 ? '1 record' : `${summary.totalSales} records`}
            </p>
          </div>
          <div className="text-4xl">📝</div>
        </div>
      </div>

      {/* Total Amount */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Total Amount</p>
            <p className="text-3xl font-bold text-green-600 mt-2">
              ₦{summary.totalAmount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">After discounts</p>
          </div>
          <div className="text-4xl">💰</div>
        </div>
      </div>

      {/* Total Units Sold */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Units Sold</p>
            <p className="text-3xl font-bold text-blue-600 mt-2">{summary.totalUnits}</p>
            <p className="text-xs text-gray-500 mt-1">
              Avg: {summary.totalSales > 0 ? (summary.totalUnits / summary.totalSales).toFixed(1) : 0} per sale
            </p>
          </div>
          <div className="text-4xl">📊</div>
        </div>
      </div>

      {/* Total Discount */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-gray-600 text-sm font-medium">Discounts Given</p>
            <p className="text-3xl font-bold text-orange-600 mt-2">
              ₦{summary.totalDiscount.toFixed(2)}
            </p>
            <p className="text-xs text-gray-500 mt-1">Value given away</p>
          </div>
          <div className="text-4xl">🏷️</div>
        </div>
      </div>

      {/* Average Sale Amount */}
      {summary.totalSales > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Avg Sale Amount</p>
              <p className="text-3xl font-bold text-purple-600 mt-2">
                ₦{summary.averageSaleAmount.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">Per transaction</p>
            </div>
            <div className="text-4xl">📈</div>
          </div>
        </div>
      )}

      {/* Top Unit */}
      {topUnit && (
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm font-medium">Top Unit</p>
              <p className="text-xl font-bold text-gray-900 mt-2">{topUnit[0]}</p>
              <p className="text-xs text-gray-500 mt-1">
                ₦{topUnit[1].amount.toFixed(2)} ({topUnit[1].count} sales)
              </p>
            </div>
            <div className="text-4xl">🏆</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesSummary;