'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { useAuth } from '@/context/AuthContext';
import { Delegation } from '@/types';

/**
 * Delegated Medicines Page - For IPP and Dispensary
 * Displays medicines delegated to the current user with search and date filtering
 */
export default function DelegatedPage() {
  const { user } = useAuth();
  const [allDelegations, setAllDelegations] = useState<Delegation[]>([]);
  const [filteredDelegations, setFilteredDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Fetch delegations on mount
  useEffect(() => {
    const fetchDelegations = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        };

        const response = await fetch(`${apiUrl}/delegations`, { headers });

        if (!response.ok) {
          throw new Error('Failed to fetch delegations');
        }

        const data = await response.json();
        // Backend returns { items: [], total, page, limit, pages }
        const delegationsList = data.items || [];

        // Filter by current user's role (ipp or dispensary)
        const userDelegations = delegationsList.filter(
          (d: Delegation) => d.toRole === user?.role
        );

        setAllDelegations(userDelegations);
        setFilteredDelegations(userDelegations);
      } catch (err) {
        setError('Failed to load delegated medicines. Please try again later.');
        console.error('Error fetching delegations:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDelegations();
    }
  }, [user]);

  // Filter delegations whenever search or date filters change
  useEffect(() => {
    let filtered = allDelegations;

    // Search filter (by medicine name or generic name)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (d: Delegation) =>
          d.medicineName?.toLowerCase().includes(term) ||
          d.genericName?.toLowerCase().includes(term)
      );
    }

    // Date range filter
    if (dateFrom || dateTo) {
      filtered = filtered.filter((d: Delegation) => {
        const delegationDate = new Date(d.delegationDate || new Date()).toISOString().split('T')[0];
        
        if (dateFrom && dateTo) {
          return delegationDate >= dateFrom && delegationDate <= dateTo;
        } else if (dateFrom) {
          return delegationDate >= dateFrom;
        } else if (dateTo) {
          return delegationDate <= dateTo;
        }
        return true;
      });
    }

    setFilteredDelegations(filtered);
  }, [searchTerm, dateFrom, dateTo, allDelegations]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Delegated Medicines History</h1>
          <p className="text-gray-600 mt-2">Complete record of medicines delegated to you</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Search and Filter Section */}
        {!loading && allDelegations.length > 0 && (
          <div className="mb-6 bg-white rounded-lg shadow p-4 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search Bar */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Medicine
                </label>
                <input
                  type="text"
                  placeholder="Search by name or generic name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delegated From
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Delegated To
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Results count */}
            <div className="mt-4 text-sm text-gray-600">
              Showing <span className="font-semibold">{filteredDelegations.length}</span> of{' '}
              <span className="font-semibold">{allDelegations.length}</span> delegated medicines
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading delegated medicines...</p>
          </div>
        ) : filteredDelegations.length > 0 ? (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Medicine Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Generic Name
                    </th>
                    <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                      Quantity
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Expiry Date
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                      Delegated Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredDelegations.map((delegation) => {
                    const remainingQuantity = (delegation.quantity || 0) - (delegation.soldQuantity || 0);
                    const isLowStock = remainingQuantity > 0 && remainingQuantity <= 2;
                    return (
                      <tr key={delegation.id} className={`hover:bg-gray-50 transition ${isLowStock ? 'bg-yellow-50' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{delegation.medicineName}</div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{delegation.genericName}</td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-semibold text-gray-900">{delegation.quantity}</span>
                            {remainingQuantity > 0 && remainingQuantity < delegation.quantity && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                                {remainingQuantity} left
                              </span>
                            )}
                            {isLowStock && (
                              <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                                ⚠️ Low stock
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(delegation.expiryDate)}
                        </td>
                        <td className="px-6 py-4 text-gray-700">
                          {formatDate(delegation.delegatedDate || new Date().toISOString())}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {filteredDelegations.map((delegation) => {
                const remainingQuantity = (delegation.quantity || 0) - (delegation.soldQuantity || 0);
                const isLowStock = remainingQuantity > 0 && remainingQuantity <= 2;
                return (
                  <div key={delegation.id} className={`p-4 ${isLowStock ? 'bg-yellow-50' : ''}`}>
                    <div className="mb-3">
                      <h3 className="font-semibold text-gray-900">{delegation.medicineName}</h3>
                      <p className="text-sm text-gray-600">{delegation.genericName}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-600">Quantity</p>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-gray-900">{delegation.quantity}</p>
                          {remainingQuantity > 0 && remainingQuantity < delegation.quantity && (
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                              {remainingQuantity} left
                            </span>
                          )}
                        </div>
                        {isLowStock && (
                          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded inline-block mt-1">
                            ⚠️ Low stock
                          </span>
                        )}
                      </div>
                      <div>
                        <p className="text-gray-600">Expiry Date</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(delegation.expiryDate)}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-600">Delegated Date</p>
                        <p className="font-semibold text-gray-900">
                          {formatDate(delegation.delegatedDate || new Date().toISOString())}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : allDelegations.length > 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No delegated medicines match your filters</p>
            <p className="text-gray-400 mt-2">
              Try adjusting your search term or date range.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No delegated medicines found</p>
            <p className="text-gray-400 mt-2">
              When medicines are delegated to you, they will appear here.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}