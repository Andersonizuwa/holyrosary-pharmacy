'use client';

import React from 'react';
import { User } from '@/types';
import { StatusBadge } from '@/components/ui/StatusBadge';

interface UsersTableProps {
  users: User[];
  currentUserId: string;
  canResetPassword: boolean;
  onResetPassword: (user: User) => void;
  isLoading?: boolean;
}

/**
 * UsersTable - Display users in a table format
 * Shows Name, Email, Role, and Actions
 * Only Superadmin can reset passwords
 */
export const UsersTable: React.FC<UsersTableProps> = ({
  users,
  currentUserId,
  canResetPassword,
  onResetPassword,
  isLoading = false,
}) => {
  const formatDate = (dateStr: string): string => {
    try {
      return new Intl.DateTimeFormat('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500">Loading users...</p>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-8 text-center">
        <p className="text-gray-500 text-lg">No users found</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      {/* Desktop View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Created
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const isCurrentUser = user.id === currentUserId;

              return (
                <tr key={user.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{user.name}</p>
                        {isCurrentUser && (
                          <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                            You
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusBadge type="role" value={user.role} size="sm" />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {formatDate(user.createdAt)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {canResetPassword ? (
                      isCurrentUser ? (
                        <button
                          disabled
                          className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium cursor-not-allowed"
                          title="Cannot change your own password here"
                        >
                          Reset Password
                        </button>
                      ) : (
                        <button
                          onClick={() => onResetPassword(user)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                        >
                          Reset Password
                        </button>
                      )
                    ) : (
                      <button
                        disabled
                        className="px-3 py-1 bg-gray-100 text-gray-500 rounded text-xs font-medium cursor-not-allowed"
                        title="Only Superadmin can reset passwords"
                      >
                        Reset Password
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile View */}
      <div className="md:hidden divide-y divide-gray-200">
        {users.map((user) => {
          const isCurrentUser = user.id === currentUserId;

          return (
            <div key={user.id} className="p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium text-gray-900">{user.name}</p>
                  {isCurrentUser && (
                    <span className="inline-block mt-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded font-medium">
                      You
                    </span>
                  )}
                </div>
                <StatusBadge type="role" value={user.role} size="sm" />
              </div>

              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Email:</span> {user.email}</p>
                <p><span className="font-medium">Joined:</span> {formatDate(user.createdAt)}</p>
              </div>

              <div className="pt-2">
                {canResetPassword ? (
                  isCurrentUser ? (
                    <button
                      disabled
                      className="w-full px-3 py-2 bg-gray-100 text-gray-500 rounded text-sm font-medium cursor-not-allowed"
                      title="Cannot change your own password here"
                    >
                      Reset Password
                    </button>
                  ) : (
                    <button
                      onClick={() => onResetPassword(user)}
                      className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition"
                    >
                      Reset Password
                    </button>
                  )
                ) : (
                  <button
                    disabled
                    className="w-full px-3 py-2 bg-gray-100 text-gray-500 rounded text-sm font-medium cursor-not-allowed"
                    title="Only Superadmin can reset passwords"
                  >
                    Reset Password
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};