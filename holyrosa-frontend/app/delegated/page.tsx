'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { useAuth } from '@/context/AuthContext';
import { Delegation } from '@/types';

/**
 * Delegated Medicines Page - For IPP and Dispensary
 * Displays medicines delegated to the current user
 */
export default function DelegatedPage() {
  const { user } = useAuth();
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch delegations for this user from backend
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

        setDelegations(userDelegations);
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
          <h1 className="text-3xl font-bold text-gray-900">Delegated Medicines</h1>
          <p className="text-gray-600 mt-2">Medicines delegated to you ({delegations.length})</p>
        </div>

        {/* Error State */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="text-gray-600 mt-4">Loading delegated medicines...</p>
          </div>
        ) : delegations.length > 0 ? (
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
                  {delegations.map((delegation) => (
                    <tr key={delegation.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{delegation.medicineName}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{delegation.genericName}</td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-semibold text-gray-900">{delegation.quantity}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(delegation.expiryDate)}
                      </td>
                      <td className="px-6 py-4 text-gray-700">
                        {formatDate(delegation.delegatedDate || new Date().toISOString())}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-gray-200">
              {delegations.map((delegation) => (
                <div key={delegation.id} className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-gray-900">{delegation.medicineName}</h3>
                    <p className="text-sm text-gray-600">{delegation.genericName}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600">Quantity</p>
                      <p className="font-semibold text-gray-900">{delegation.quantity}</p>
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
              ))}
            </div>
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