'use client';

import React, { useState, useEffect } from 'react';
import { AppShell } from '@/components/ui/AppShell';
import { UsersTable } from '@/components/users/UsersTable';
import { ResetPasswordModal } from '@/components/users/ResetPasswordModal';
import { useAuth } from '@/context/AuthContext';
import { useUI } from '@/context/UIContext';
import { User } from '@/types';
import { canViewUsers, canResetPassword } from '@/utils/roles';

/**
 * Users Page - For Superadmin and Admin
 * View all users and reset passwords (Superadmin only)
 */
export default function UsersPage() {
  const { user } = useAuth();
  const { showError } = useUI();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;

        const response = await fetch(`${apiUrl}/users`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: Failed to fetch users`);
        }

        const data = await response.json();
        // Backend returns { items: [], total, page, limit, pages }
        const usersList = data.items || [];
        setUsers(usersList);
      } catch (err) {
        console.error('Error fetching users:', err);
        const errorMsg = err instanceof Error ? err.message : 'Failed to load users';
        showError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [showError]);

  const handleResetPassword = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setSelectedUser(null);
    setIsModalOpen(false);
  };

  // Check authorization (after all hooks are called)
  if (!user || !canViewUsers(user.role)) {
    return (
      <AppShell>
        <div className="p-4 md:p-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-8 text-center">
            <p className="text-red-800 text-lg font-medium">Access Denied</p>
            <p className="text-red-600 mt-2">You don&apos;t have permission to view users.</p>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="p-4 md:p-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-2">
            {canResetPassword(user.role)
              ? 'View all users and reset passwords'
              : 'View all users'}
          </p>
        </div>

        {/* Info Box for Admin Users */}
        {!canResetPassword(user.role) && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm">
              <span className="font-medium">Note:</span> Only Superadmin can reset user passwords. You have view-only access.
            </p>
          </div>
        )}

        {/* Users Table */}
        <UsersTable
          users={users}
          currentUserId={user.id}
          canResetPassword={canResetPassword(user.role)}
          onResetPassword={handleResetPassword}
          isLoading={loading}
        />

        {/* Reset Password Modal */}
        <ResetPasswordModal
          user={selectedUser}
          isOpen={isModalOpen}
          onClose={handleModalClose}
        />
      </div>
    </AppShell>
  );
}