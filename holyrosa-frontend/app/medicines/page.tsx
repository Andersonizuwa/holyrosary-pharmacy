'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { MedicineList } from '@/components/medicines/MedicineList';
import { Medicine } from '@/types';

/**
 * Medicine Management Page
 * Displays the medicine list with search, filter, and add medicine functionality
 */
export default function MedicinesPage() {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch medicines from backend API
    const fetchMedicines = async () => {
      try {
        setLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;
        
        const response = await fetch(`${apiUrl}/medicines`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch medicines');
        }

        const data = await response.json();
        // Backend returns { items: [], total, page, limit, pages }
        const medicinesList = data.items || [];
        setMedicines(medicinesList);
      } catch (err) {
        setError('Failed to load medicines. Please try again later.');
        console.error('Error fetching medicines:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Medicine Inventory</h1>
          <p className="text-gray-600 mt-2">Manage your pharmacy medicine stock</p>
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
            <p className="text-gray-600 mt-4">Loading medicines...</p>
          </div>
        ) : (
          <MedicineList medicines={medicines} />
        )}
      </div>
    </AppShell>
  );
}