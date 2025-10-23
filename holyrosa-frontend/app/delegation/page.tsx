'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AppShell from '@/components/ui/AppShell';
import { DelegateDrugs } from '@/components/delegation/DelegateDrugs';
import { CartButton } from '@/components/delegation/CartButton';
import { DelegationCartProvider, useDelegationCart } from '@/context/DelegationCartContext';
import { Medicine, Delegation } from '@/types';

/**
 * Inner component to access cart context
 */
function DelegationPageContent() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [delegations, setDelegations] = useState<Delegation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCart, setShowCart] = useState(false);
  const { getCartCount } = useDelegationCart();
  const cartCount = getCartCount();

  useEffect(() => {
    // Fetch medicines and delegations from backend
    const fetchData = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        };

        // Fetch medicines
        const medicinesRes = await fetch(`${apiUrl}/medicines`, { headers });
        if (medicinesRes.ok) {
          const medicinesData = await medicinesRes.json();
          // Backend returns { items: [], total, page, limit, pages }
          setMedicines(medicinesData.items || []);
        }

        // Fetch delegations
        const delegationsRes = await fetch(`${apiUrl}/delegations`, { headers });
        if (delegationsRes.ok) {
          const delegationsData = await delegationsRes.json();
          // Backend returns { items: [], total, page, limit, pages }
          setDelegations(delegationsData.items || []);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDelegation = (newDelegation: Delegation, medicineId: string) => {
    // Add new delegation to the list
    setDelegations([...delegations, newDelegation]);
  };

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
                <h1 className="text-3xl font-bold text-gray-900">Drug Delegation</h1>
                <p className="text-gray-600 mt-2">
                  Add medicines to cart, then proceed to delegation checkout
                </p>
              </div>
              <Link
                href="/delegation/history"
                className="inline-flex items-center px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                📋 View History
              </Link>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-600">
                <p className="text-gray-600 text-sm">Available Medicines</p>
                <p className="text-2xl font-bold text-gray-900">{medicines.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-600">
                <p className="text-gray-600 text-sm">Total Delegations</p>
                <p className="text-2xl font-bold text-gray-900">{delegations.length}</p>
              </div>
              <div className="bg-white rounded-lg shadow p-4 border-l-4 border-yellow-600">
                <p className="text-gray-600 text-sm">In Stock</p>
                <p className="text-2xl font-bold text-gray-900">
                  {medicines.filter((m) => m.quantity > 0).length}
                </p>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow p-6">
              <DelegateDrugs
                medicines={medicines}
                delegations={delegations}
                onDelegation={handleDelegation}
              />
            </div>
          </>
        )}
      </div>

      {/* Floating Cart Button with Count Badge */}
      <button
        onClick={() => setShowCart(true)}
        className="fixed bottom-8 right-8 flex items-center justify-center w-16 h-16 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition z-40"
        title="View delegation cart"
        style={{ display: showCart ? 'none' : 'flex' }}
      >
        <div className="text-2xl">🛒</div>
        {cartCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
            {cartCount}
          </span>
        )}
      </button>

      {/* Cart Modal */}
      <CartButton isOpen={showCart} onClose={() => setShowCart(false)} />
    </AppShell>
  );
}

/**
 * Delegation Page - Main page for delegating medicines
 * - Display list of available medicines to delegate
 * - Allow store officers to select and add medicines to cart
 * - Show link to delegation history
 */
export default function DelegationPage() {
  return (
    <DelegationCartProvider>
      <DelegationPageContent />
    </DelegationCartProvider>
  );
}