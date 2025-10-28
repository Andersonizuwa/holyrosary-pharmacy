'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/ui/AppShell';
import { AddMedicineForm } from '@/components/medicines/AddMedicineForm';
import { Medicine } from '@/types';
import { useAuth } from '@/context/AuthContext';
import { canManageMedicines } from '@/utils/roles';

/**
 * Add Medicine Page
 * Provides a form for users to add new medicines to the inventory
 * Only accessible to Store Officer, Admin, and SuperAdmin
 */
export default function AddMedicinePage() {
  const { user } = useAuth();
  const hasAccess = user ? canManageMedicines(user.role) : false;

  const handleAddMedicineSuccess = (medicine: Medicine) => {
    // This could be used to store the medicine in local state or send to parent
    console.log('Medicine added successfully:', medicine);
  };

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Medicine</h1>
          <p className="text-gray-600 mt-2">Fill in the medicine details below to add it to your inventory</p>
        </div>

        {/* Access Control Check */}
        {!hasAccess ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-700 mb-4">
                You don&apos;t have permission to add medicines. This action is only available for Store Officers and Administrators.
              </p>
              <Link
                href="/medicines"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                ← Back to Medicines
              </Link>
            </div>
          </div>
        ) : (
          <AddMedicineForm onSuccess={handleAddMedicineSuccess} />
        )}
      </div>
    </AppShell>
  );
}