'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { ReportsTable } from '@/components/reports/ReportsTable';
import { useAuth } from '@/context/AuthContext';
import { Sale } from '@/types';
import { exportSalesReport } from '@/lib/csv';
import { canViewReports } from '@/utils/roles';

interface ReportData {
  items?: Sale[];
  totals?: {
    revenue: number;
    itemsSold: number;
    txCount: number;
  };
}

/**
 * Reports Page - For Superadmin/Admin
 * View sales reports with date range filters and export to CSV
 */
export default function ReportsPage() {
  const { user } = useAuth();
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  // Initialize date range with default (today)
  useEffect(() => {
    const today = new Date();
    const dateStr = today.toISOString().split('T')[0];
    setDateFrom(dateStr);
    setDateTo(dateStr);
  }, []);

  // Check authorization
  if (!user || !canViewReports(user.role)) {
    return (
      <AppShell>
        <div className="p-4 md:p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-800 text-lg font-medium">Access Denied</p>
            <p className="text-red-600 mt-2">You don't have permission to view reports.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  const fetchReport = async (from: string, to: string) => {
    setLoading(true);
    setError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;
      
      const params = new URLSearchParams();
      params.append('dateFrom', from);
      params.append('dateTo', to);

      const response = await fetch(`${apiUrl}/sales?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch sales report');
      }

      const data = await response.json();
      console.log('API Response:', data);
      
      // Backend returns { items: [], totals: { revenue, itemsSold, txCount }, ... }
      // Transform to ReportData format
      const reportData: ReportData = {
        items: data.items || [],
        totals: data.totals || {
          revenue: 0,
          itemsSold: 0,
          txCount: 0
        }
      };
      
      setReportData(reportData);
      setSubmitted(true);
    } catch (err) {
      console.error('Error fetching report:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load sales report. Please try again.'
      );
      setReportData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dateFrom || !dateTo) {
      setError('Please select both start and end dates');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      setError('Start date must be before end date');
      return;
    }

    fetchReport(dateFrom, dateTo);
  };

  const handleQuickPreset = (days: number) => {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - days);

    const fromStr = from.toISOString().split('T')[0];
    const toStr = to.toISOString().split('T')[0];

    setDateFrom(fromStr);
    setDateTo(toStr);
    fetchReport(fromStr, toStr);
  };

  const handleExportCSV = () => {
    if (!reportData) return;
    exportSalesReport(reportData, dateFrom, dateTo);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Sales Reports</h1>
          <p className="text-gray-600 mt-2">View and export sales data by date range</p>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <form onSubmit={handleDateRangeSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Date Range
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">To Date</label>
                  <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Quick Presets */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Presets
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleQuickPreset(0)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(7)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
                >
                  Last 7 Days
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickPreset(30)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg font-medium transition"
                >
                  Last 30 Days
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
              >
                {loading ? 'Loading...' : 'Generate Report'}
              </button>

              {submitted && reportData && reportData.items && reportData.items.length > 0 && (
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span>📥</span>
                  <span>Export CSV</span>
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Report Results */}
        {submitted && reportData && reportData.items && reportData.totals ? (
          <ReportsTable 
            sales={reportData.items} 
            totals={reportData.totals} 
            isLoading={loading}
          />
        ) : submitted && !loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No data to display</p>
            <p className="text-gray-400 mt-2">Select a date range and click "Generate Report"</p>
          </div>
        ) : null}
      </div>
    </AppShell>
  );
}