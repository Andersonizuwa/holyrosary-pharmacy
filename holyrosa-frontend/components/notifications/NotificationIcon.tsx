'use client';

import React from 'react';
import { BellIcon } from '@heroicons/react/24/outline';

interface NotificationIconProps {
  /**
   * Total number of alerts to display in badge
   */
  totalAlerts: number;
  /**
   * Callback function when icon is clicked
   */
  onClick: () => void;
  /**
   * Optional CSS class for custom styling
   */
  className?: string;
}

/**
 * NotificationIcon Component
 * 
 * Displays a bell icon with a red badge showing the count of notifications.
 * Used in the top navbar to allow users to quickly access notifications.
 * 
 * @param totalAlerts - Number of active alerts to display
 * @param onClick - Function to call when icon is clicked (usually opens the notification modal)
 * @param className - Optional additional CSS classes
 */
export const NotificationIcon: React.FC<NotificationIconProps> = ({
  totalAlerts,
  onClick,
  className = '',
}) => {
  return (
    <button
      onClick={onClick}
      className={`relative inline-flex items-center justify-center p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200 ${className}`}
      aria-label="View notifications"
      type="button"
    >
      {/* Bell Icon */}
      <BellIcon className="w-6 h-6" />

      {/* Alert Badge */}
      {totalAlerts > 0 && (
        <span
          className="absolute -top-1 -right-1 inline-flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full animate-pulse"
          aria-label={`${totalAlerts} notifications`}
        >
          {totalAlerts > 99 ? '99+' : totalAlerts}
        </span>
      )}
    </button>
  );
};