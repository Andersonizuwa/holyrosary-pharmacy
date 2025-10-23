'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import { User } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { useUI } from '@/context/UIContext';
import { passwordResetSchema } from '@/lib/validators';

interface ResetPasswordModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

interface PasswordFormData {
  newPassword: string;
  confirmPassword: string;
}

/**
 * ResetPasswordModal - Modal for resetting user passwords
 * Uses react-hook-form with yup validation
 * Only Superadmin can reset other users' passwords
 */
export const ResetPasswordModal: React.FC<ResetPasswordModalProps> = ({
  user,
  isOpen,
  onClose,
}) => {
  const { showSuccess, showError } = useUI();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: yupResolver(passwordResetSchema),
    mode: 'onBlur',
  });

  const handleClose = () => {
    reset();
    onClose();
  };

  const onSubmit = async (data: PasswordFormData) => {
    if (!user) {
      showError('User information missing');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: data.newPassword }),
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error('You do not have permission to reset this password');
        }
        throw new Error('Failed to reset password');
      }

      showSuccess(`Password for ${user.name} has been reset successfully!`);
      handleClose();
    } catch (err) {
      console.error('Error resetting password:', err);
      const errorMsg = err instanceof Error ? err.message : 'Failed to reset password';
      showError(errorMsg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Reset Password"
      description={`Resetting password for ${user?.name}`}
      size="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* New Password */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
            New Password
          </label>
          <input
            id="newPassword"
            type="password"
            placeholder="Enter new password"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              errors.newPassword
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            {...register('newPassword')}
            autoFocus
          />
          {errors.newPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.newPassword.message}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            placeholder="Confirm new password"
            disabled={isSubmitting}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
              errors.confirmPassword
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            {...register('confirmPassword')}
          />
          {errors.confirmPassword && (
            <p className="text-red-600 text-sm mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50 transition"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition"
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </button>
        </div>
      </form>
    </Modal>
  );
};