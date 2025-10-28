'use client';

import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/ui/AppShell';
import { EditMedicineForm } from '@/components/medicines/EditMedicineForm';
import { useAuth } from '@/context/AuthContext';
import { canManageMedicines } from '@/utils/roles';
import { useParams } from 'next/navigation';

/**
 * Edit Medicine Page
 * Allows users to edit existing medicines in the inventory
 * Only accessible to Store Officer, Admin, and SuperAdmin
 */
export default function EditMedicinePage() {
  const { user } = useAuth();
  const params = useParams();
  const medicineId = params?.id;
  const hasAccess = user ? canManageMedicines(user.role) : false;

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Edit Medicine</h1>
          <p className="text-gray-600 mt-2">Update the medicine details below</p>
        </div>

        {/* Access Control Check */}
        {!hasAccess ? (
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-red-800 mb-2">Access Denied</h2>
              <p className="text-red-700 mb-4">
                You don&apos;t have permission to edit medicines. This action is only available for Store Officers and Administrators.
              </p>
              <Link
                href="/medicines"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
              >
                ← Back to Medicines
              </Link>
            </div>
          </div>
        ) : medicineId ? (
          <EditMedicineForm medicineId={medicineId as string} />
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
              <h2 className="text-xl font-bold text-yellow-800 mb-2">Invalid Medicine ID</h2>
              <p className="text-yellow-700 mb-4">
                The medicine ID is missing. Please go back and try again.
              </p>
              <Link
                href="/medicines"
                className="inline-flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
              >
                ← Back to Medicines
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}