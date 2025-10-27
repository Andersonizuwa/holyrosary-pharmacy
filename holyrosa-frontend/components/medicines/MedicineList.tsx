'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Medicine } from '@/types';
import { MedicineCard } from './MedicineCard';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { useAuth } from '@/context/AuthContext';
import { canManageMedicines } from '@/utils/roles';
import {
  Table,
  TableHeader,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from '@/components/ui/Table';
import { PlusIcon, MagnifyingGlassIcon, TrashIcon, PencilIcon } from '@heroicons/react/24/outline';

interface MedicineListProps {
  medicines: Medicine[];
}

/**
 * MedicineList - Responsive medicine listing component
 * Displays as a table on desktop and cards on mobile
 * Includes search/filter functionality
 */
export const MedicineList: React.FC<MedicineListProps> = ({ medicines: initialMedicines }) => {
  const router = useRouter();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [medicines, setMedicines] = useState(initialMedicines);
  const [deleteModal, setDeleteModal] = useState({ isOpen: false, medicineId: null as string | number | null, medicineName: '' });
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Admin can only view, not manage
  const canAdd = user ? (user.role !== 'admin' && canManageMedicines(user.role)) : false;

  // Filter medicines based on search term
  const filteredMedicines = useMemo(() => {
    return medicines.filter(
      (med) =>
        med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        med.genericName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (med.barcode && med.barcode.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [medicines, searchTerm]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-NG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStockStatus = (medicine: Medicine) => {
    if (medicine.quantity === 0) return { label: 'Out of Stock', color: 'text-red-600' };
    if (medicine.quantity < medicine.lowStockThreshold)
      return { label: 'Low Stock', color: 'text-yellow-600' };
    return { label: 'In Stock', color: 'text-green-600' };
  };

  const handleAddMedicine = () => {
    router.push('/medicines/add');
  };

  const handleAddMedicineLocally = (newMedicine: Medicine) => {
    setMedicines((prev) => [newMedicine, ...prev]);
  };

  const handleOpenDeleteModal = (medicineId: string | number, medicineName: string) => {
    setDeleteModal({ isOpen: true, medicineId, medicineName });
  };

  const handleCloseDeleteModal = () => {
    setDeleteModal({ isOpen: false, medicineId: null, medicineName: '' });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.medicineId) return;

    setIsDeleting(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
      const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;

      const response = await fetch(`${apiUrl}/medicines/${deleteModal.medicineId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { Authorization: `Bearer ${token}` })
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete medicine');
      }

      // Remove medicine from local state
      setMedicines((prev) => prev.filter((med) => med.id !== deleteModal.medicineId));
      handleCloseDeleteModal();
    } catch (error) {
      console.error('Error deleting medicine:', error);
      throw error;
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditMedicine = (medicineId: string | number) => {
    router.push(`/medicines/edit/${medicineId}`);
  };

  return (
    <div className="space-y-4">
      {/* Header with Search and Add Button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, generic name, or barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        {canAdd && (
          <button
            onClick={handleAddMedicine}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition whitespace-nowrap"
          >
            <PlusIcon className="h-5 w-5" />
            Add Medicine
          </button>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block bg-white rounded-lg shadow overflow-hidden">
        {filteredMedicines.length > 0 ? (
          <Table>
            <TableHeader>
              <TableHead>Barcode</TableHead>
              <TableHead>Name / Strength</TableHead>
              <TableHead>Generic Name</TableHead>
              <TableHead>Mfg Date</TableHead>
              <TableHead>Exp Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead>Buy Price</TableHead>
              <TableHead>Total Price</TableHead>
              <TableHead>Sell Price</TableHead>
              <TableHead>Status</TableHead>
              {canAdd && <TableHead>Actions</TableHead>}
            </TableHeader>
            <TableBody>
              {filteredMedicines.map((medicine) => {
                const status = getStockStatus(medicine);
                return (
                  <TableRow key={medicine.id}>
                    <TableCell>{medicine.barcode || '-'}</TableCell>
                    <TableCell className="font-medium">{medicine.name}</TableCell>
                    <TableCell>{medicine.genericName}</TableCell>
                    <TableCell className="text-sm">{formatDate(medicine.manufacturingDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(medicine.expiryDate)}</TableCell>
                    <TableCell>{medicine.packageType}</TableCell>
                    <TableCell className="font-semibold">{medicine.quantity}</TableCell>
                    <TableCell>₦{medicine.buyPrice.toFixed(2)}</TableCell>
                    <TableCell className="font-semibold">₦{medicine.totalPrice.toFixed(2)}</TableCell>
                    <TableCell>₦{medicine.sellingPrice.toFixed(2)}</TableCell>
                    <TableCell>
                      <span className={`font-semibold ${status.color}`}>{status.label}</span>
                    </TableCell>
                    {canAdd && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleEditMedicine(medicine.id)}
                            title="Edit medicine"
                            className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(medicine.id, medicine.name)}
                            title="Delete medicine"
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No medicines found. Try adjusting your search.</p>
          </div>
        )}
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden">
        {filteredMedicines.length > 0 ? (
          <div>
            {filteredMedicines.map((medicine) => (
              <MedicineCard
                key={medicine.id}
                medicine={medicine}
                onDelete={() => handleOpenDeleteModal(medicine.id, medicine.name)}
                onEdit={handleEditMedicine}
                canManage={canAdd}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg p-8 text-center text-gray-500">
            <p>No medicines found. Try adjusting your search.</p>
          </div>
        )}
      </div>

      {/* Empty State */}
      {medicines.length === 0 && (
        <div className="bg-white rounded-lg p-12 text-center">
          <p className="text-gray-500 mb-4">No medicines in inventory yet.</p>
          <button
            onClick={handleAddMedicine}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            <PlusIcon className="h-5 w-5" />
            Add Your First Medicine
          </button>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        title="Delete Medicine?"
        message={`Are you sure you want to delete "${deleteModal.medicineName}"? This action cannot be undone and all related data will be removed.`}
        confirmText="Delete"
        cancelText="Cancel"
        isDangerous={true}
        isLoading={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={handleCloseDeleteModal}
      />
    </div>
  );
};