'use client';

import React, { useState, useEffect } from 'react';
import { Menu } from '@headlessui/react';
import { Bars3Icon, UserCircleIcon } from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { ROLE_LABELS } from '@/utils/constants';
import { NotificationIcon } from '@/components/notifications/NotificationIcon';
import { DelegationNotificationModal } from '@/components/delegation/DelegationNotificationModal';
import api from '@/lib/api';

interface TopbarProps {
  onMenuClick?: () => void;
}

export const Topbar: React.FC<TopbarProps> = ({ onMenuClick }) => {
  const { user, logout } = useAuth();
  const [showDelegationNotifications, setShowDelegationNotifications] = useState(false);
  const [delegationNotificationCount, setDelegationNotificationCount] = useState(0);

  // Fetch delegation notification count for IPP and Dispensary
  useEffect(() => {
    if (user?.role === 'ipp' || user?.role === 'dispensary') {
      fetchDelegationNotificationCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchDelegationNotificationCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user?.role]);

  const fetchDelegationNotificationCount = async () => {
    try {
      const response = await api.get('/delegations/notifications/all');
      setDelegationNotificationCount(response.data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching delegation notification count:', error);
    }
  };

  if (!user) return null;

  return (
    <>
      <DelegationNotificationModal
        isOpen={showDelegationNotifications}
        onClose={() => setShowDelegationNotifications(false)}
      />
      <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
        <button
          type="button"
          onClick={onMenuClick}
          className="px-4 border-r border-gray-200 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 md:hidden"
        >
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon className="h-6 w-6" />
        </button>
        <div className="flex-1 px-4 sm:px-6 flex justify-between">
          <div className="flex-1 flex items-center">
            <h2 className="text-lg sm:text-2xl font-semibold text-gray-900 truncate">
              Pharmacy Management
            </h2>
          </div>
          <div className="ml-4 flex items-center md:ml-6 gap-2">
          {/* Delegation Notification Bell for IPP and Dispensary */}
          {(user?.role === 'ipp' || user?.role === 'dispensary') && (
            <NotificationIcon
              totalAlerts={delegationNotificationCount}
              onClick={() => setShowDelegationNotifications(true)}
              className="text-blue-600 hover:text-blue-700"
            />
          )}
          <Menu as="div" className="ml-3 relative">
            <div>
              <Menu.Button className="max-w-xs bg-white flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                <span className="sr-only">Open user menu</span>
                <div className="hidden sm:flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-700">{user.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </div>
                <div className="sm:hidden">
                  <UserCircleIcon className="h-8 w-8 text-gray-400" />
                </div>
              </Menu.Button>
            </div>
            <Menu.Items className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg py-1 bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
              <Menu.Item>
                {({ active }) => (
                  <div className={`${active ? 'bg-gray-100' : ''} px-4 py-2 text-sm text-gray-700 border-b`}>
                    <p className="font-medium">{user.name}</p>
                    <p className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</p>
                  </div>
                )}
              </Menu.Item>
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={logout}
                    className={`${
                      active ? 'bg-gray-100' : ''
                    } block w-full text-left px-4 py-2 text-sm text-gray-700`}
                  >
                    Sign out
                  </button>
                )}
              </Menu.Item>
            </Menu.Items>
          </Menu>
        </div>
      </div>
      </div>
    </>
  );
};
