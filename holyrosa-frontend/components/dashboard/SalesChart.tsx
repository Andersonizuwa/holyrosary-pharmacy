// components/dashboard/SalesChart.tsx - Sales trend chart using Recharts
'use client';

import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface SalesChartProps {
  data: Array<{
    date: string;
    amount: number;
  }>;
  isLoading?: boolean;
}

export default function SalesChart({ data, isLoading = false }: SalesChartProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 h-96 flex items-center justify-center">
        <div className="text-gray-400">Loading chart...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4 sm:p-6 h-96 flex items-center justify-center">
        <div className="text-gray-400">No sales data available</div>
      </div>
    );
  }

  // Format data for display with better date labels
  const chartData = data.map((item) => ({
    ...item,
    displayDate: new Date(item.date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
  }));

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-6">
        Sales Trend (Last 7 Days)
      </h2>
      <div className="h-96 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="displayDate"
              stroke="#9ca3af"
              style={{ fontSize: '0.875rem' }}
            />
            <YAxis
              stroke="#9ca3af"
              style={{ fontSize: '0.875rem' }}
              label={{ value: 'Amount (₦)', angle: -90, position: 'insideLeft', offset: 10 }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #e5e7eb',
                borderRadius: '0.5rem',
              }}
              formatter={(value) => [`₦${(value as number).toFixed(2)}`, 'Sales']}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Area
              type="monotone"
              dataKey="amount"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorAmount)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}