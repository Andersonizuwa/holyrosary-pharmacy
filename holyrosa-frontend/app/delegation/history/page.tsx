'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/ui/AppShell';
import { DelegateHistory } from '@/components/delegation/DelegateHistory';
import { Delegation } from '@/types';

/**
 * Delegation History Page - View all historical delegations
 * - Display all past and current delegations
 * - Filter by status and delegation type
 * - Search by medicine name
 */
export default function DelegationHistoryPage() {
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch delegations from backend
    const fetchDelegations = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        };

        // Fetch all delegations without pagination limit
        const response = await fetch(`${apiUrl}/delegations?limit=10000`, { headers });
        if (response.ok) {
          const data = await response.json();
          // Backend returns { items: [], total, page, limit, pages }
          setDelegations(data.items || []);
        } else {
          console.error('Error fetching delegations:', response.statusText);
        }
      } catch (error) {
        console.error('Error fetching delegations:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDelegations();
  }, []);

  return (
    <AppShell>
      <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {loading ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Delegation History</h1>
                <p className="text-gray-600 mt-2">
                  View all drug delegations and their current status
                </p>
              </div>
              <Link
                href="/delegation"
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                ➕ New Delegation
              </Link>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <DelegateHistory delegations={delegations} />
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}