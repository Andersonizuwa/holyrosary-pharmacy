'use client';

import React from 'react';
import { Modal } from '@/components/ui/Modal';
import { CheckCircleIcon } from '@heroicons/react/24/outline';

interface DelegationSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  itemCount: number;
}

export const DelegationSuccessModal: React.FC<DelegationSuccessModalProps> = ({
  isOpen,
  onClose,
  itemCount,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delegation Successful" size="sm">
      <div className="space-y-4">
        {/* Success Icon */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="absolute inset-0 bg-green-100 rounded-full blur-lg opacity-75"></div>
            <CheckCircleIcon className="relative h-16 w-16 text-green-600" />
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-gray-900">
            Medicines Delegated Successfully!
          </h3>
          <p className="text-sm text-gray-600">
            {itemCount} delegation{itemCount !== 1 ? 's' : ''} completed
          </p>
        </div>

        {/* Details */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">
          <p className="font-medium mb-1">✓ Delegation Confirmation</p>
          <ul className="space-y-1 text-xs">
            <li>• All medicines have been successfully delegated</li>
            <li>• Stock quantities have been updated</li>
            <li>• IPP and Dispensary will receive notifications</li>
          </ul>
        </div>

        {/* Action Button */}
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          Close
        </button>
      </div>
    </Modal>
  );
};