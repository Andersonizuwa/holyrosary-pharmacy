'use client';

import React, { useState, useMemo } from 'react';
import { Delegation } from '@/types';

interface DelegateHistoryProps {
  delegations: Delegation[];
}

/**
 * DelegateHistory Component
 * Displays history of all drug delegations
 * - Filter by delegation type (IPP, Dispensary, Others)
 * - Search by medicine name
 * - Show detailed delegation records with dates and remarks
 */
export const DelegateHistory: React.FC<DelegateHistoryProps> = ({ delegations }) => {
  const [filterType, setFilterType] = useState<'all' | 'ipp' | 'dispensary' | 'others'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Filter delegations by type and search
  const filteredDelegations = useMemo(() => {
    return delegations.filter((delegation) => {
      const matchesType = filterType === 'all' || delegation.toRole === filterType;
      const matchesSearch =
        delegation.medicineName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        delegation.genericName.toLowerCase().includes(searchTerm.toLowerCase());

      return matchesType && matchesSearch;
    });
  }, [delegations, filterType, searchTerm]);

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Format time
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get status badge color
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'accepted':
        return 'bg-green-100 text-green-700';
      case 'rejected':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-yellow-100 text-yellow-700';
    }
  };

  // Get delegate type badge color
  const getDelegateTypeBadgeColor = (type: string) => {
    switch (type) {
      case 'ipp':
        return 'bg-blue-100 text-blue-700';
      case 'dispensary':
        return 'bg-purple-100 text-purple-700';
      case 'others':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  // Get total quantity delegated
  const getTotalDelegated = () => delegations.reduce((sum, d) => sum + d.quantity, 0);

  return (
    <div className="space-y-6">
      {/* Stats Card */}
      <div className="grid grid-cols-1 gap-4">
        <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
          <p className="text-gray-600 text-sm">Total Delegations</p>
          <p className="text-3xl font-bold text-gray-900">{delegations.length}</p>
          <p className="text-xs text-gray-500 mt-2">{getTotalDelegated()} units total</p>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="space-y-4">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search by medicine name or generic name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Filter Buttons */}
          <div className="flex gap-2 flex-wrap md:flex-nowrap">
            {[
              { value: 'all', label: 'All' },
              { value: 'ipp', label: 'IPP' },
              { value: 'dispensary', label: 'Dispensary' },
              { value: 'others', label: 'Others' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setFilterType(value as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600">
          Showing {filteredDelegations.length} of {delegations.length} delegations
        </p>
      </div>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200 shadow">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Medicine
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Generic Name
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-900">
                Quantity
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Delegated To
              </th>
              <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">
                Date
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredDelegations.length > 0 ? (
              filteredDelegations.map((delegation) => (
                <tr key={delegation.id} className="hover:bg-gray-50 transition group">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{delegation.medicineName}</div>
                    {delegation.remarks && (
                      <div className="text-xs text-gray-500 group-hover:text-gray-700 mt-1">
                        {delegation.remarks}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-700">{delegation.genericName}</td>
                  <td className="px-6 py-4 text-center font-semibold text-gray-900">
                    {delegation.quantity}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${getDelegateTypeBadgeColor(
                        delegation.toRole
                      )}`}
                    >
                      {delegation.toRole === 'ipp'
                        ? 'IPP'
                        : delegation.toRole === 'dispensary'
                        ? 'Dispensary'
                        : 'Others'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-700">
                    <div>{formatDate(delegation.delegationDate)}</div>
                    <div className="text-xs text-gray-500">
                      Delegated: {formatTime(delegation.createdAt)}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No delegations found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredDelegations.length > 0 ? (
          filteredDelegations.map((delegation) => (
            <div key={delegation.id} className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{delegation.medicineName}</h3>
                <p className="text-sm text-gray-600">{delegation.genericName}</p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-600">Quantity</p>
                  <p className="font-semibold text-gray-900">{delegation.quantity}</p>
                </div>
                <div>
                  <p className="text-gray-600">Date</p>
                  <p className="font-semibold text-gray-900">{formatDate(delegation.delegationDate)}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-gray-600">Delegated To</p>
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getDelegateTypeBadgeColor(
                      delegation.toRole
                    )}`}
                  >
                    {delegation.toRole === 'ipp'
                      ? 'IPP'
                      : delegation.toRole === 'dispensary'
                      ? 'Dispensary'
                      : 'Others'}
                  </span>
                </div>
              </div>

              {delegation.remarks && (
                <div className="bg-gray-50 p-3 rounded border border-gray-200">
                  <p className="text-xs text-gray-600 font-medium mb-1">Remarks</p>
                  <p className="text-sm text-gray-700">{delegation.remarks}</p>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No delegations found.
          </div>
        )}
      </div>
    </div>
  );
};

export default DelegateHistory;