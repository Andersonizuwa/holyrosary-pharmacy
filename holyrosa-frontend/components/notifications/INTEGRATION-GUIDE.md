# Smart Notifications System - Integration Guide

## Overview
The Smart Notifications System consists of three main components:
- **`useNotifications`** - Custom React hook for notification logic
- **`NotificationIcon`** - Bell icon with alert badge for the navbar
- **`NotificationModal`** - Modal popup displaying all alerts

## Quick Integration

### 1. Import the components
```tsx
import { useNotifications, NotificationIcon, NotificationModal } from '@/components/notifications';
import { Medicine } from '@/types';
```

### 2. Use in your Dashboard Component

```tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useNotifications, NotificationIcon, NotificationModal } from '@/components/notifications';
import { Medicine } from '@/types';

export const AdminDashboard: React.FC = () => {
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);

  // Initialize notifications
  const {
    lowStock,
    outOfStock,
    expired,
    totalAlerts,
    showModal,
    toggleModal,
    closeModal,
  } = useNotifications(medicines, true); // true = auto-open on alerts

  // Fetch medicines
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch('/api/medicines');
        if (!response.ok) throw new Error('Failed to fetch medicines');
        const data = await response.json();
        setMedicines(data);
      } catch (error) {
        console.error('Error fetching medicines:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMedicines();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      {/* Place NotificationIcon in Navbar/Header */}
      <header className="bg-white shadow flex items-center justify-between px-6 py-4">
        <h1>Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          {/* Notification Icon with Badge */}
          <NotificationIcon
            totalAlerts={totalAlerts}
            onClick={toggleModal}
          />
        </div>
      </header>

      {/* Main Dashboard Content */}
      <main className="p-6">
        <h2>Dashboard Content Here</h2>
        {/* Your dashboard content */}
      </main>

      {/* Notification Modal */}
      <NotificationModal
        isOpen={showModal}
        onClose={closeModal}
        lowStock={lowStock}
        outOfStock={outOfStock}
        expired={expired}
      />
    </div>
  );
};
```

### 3. In Header/Topbar Component

If you want to add the notification icon to an existing header component:

```tsx
'use client';

import React from 'react';
import { NotificationIcon } from '@/components/notifications';

interface HeaderProps {
  totalAlerts: number;
  onNotificationClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ totalAlerts, onNotificationClick }) => {
  return (
    <header className="bg-white shadow">
      <div className="flex items-center justify-between px-6 py-4">
        <h1>Holy Rosary Pharmacy</h1>
        <div className="flex items-center gap-4">
          {/* Add notification icon */}
          <NotificationIcon
            totalAlerts={totalAlerts}
            onClick={onNotificationClick}
          />
          {/* Other header elements */}
        </div>
      </div>
    </header>
  );
};
```

## API Reference

### `useNotifications(medicines, autoOpen?)`

#### Parameters:
- **`medicines`** (Medicine[]): Array of medicine objects to analyze
- **`autoOpen`** (boolean, optional): Whether to auto-open modal on first alerts (default: true)

#### Returns:
```tsx
{
  lowStock: Medicine[];      // Medicines with quantity < 10
  outOfStock: Medicine[];    // Medicines with quantity === 0
  expired: Medicine[];       // Medicines with expired dates
  totalAlerts: number;       // Total count of all alerts
  showModal: boolean;        // Current modal visibility state
  toggleModal: () => void;   // Toggle modal open/close
  closeModal: () => void;    // Force close modal
  openModal: () => void;     // Force open modal
  clearAllNotifications: () => void; // Clear all cached alerts
}
```

### `<NotificationIcon />`

#### Props:
- **`totalAlerts`** (number): Number of active alerts to display
- **`onClick`** (() => void): Callback when icon is clicked
- **`className`** (string, optional): Additional CSS classes

### `<NotificationModal />`

#### Props:
- **`isOpen`** (boolean): Whether modal is visible
- **`onClose`** (() => void): Callback to close modal
- **`lowStock`** (Medicine[]): Low stock medicines
- **`outOfStock`** (Medicine[]): Out of stock medicines
- **`expired`** (Medicine[]): Expired medicines

## Alert Categories

### 1. Low Stock
- **Trigger**: `quantity < 10` OR `quantity < lowStockThreshold`
- **Color**: Yellow (⚠️)
- **Display**: Shows current quantity and threshold

### 2. Out of Stock
- **Trigger**: `quantity === 0`
- **Color**: Red (❌)
- **Display**: Shows expiry date

### 3. Expired
- **Trigger**: `expiryDate < today`
- **Color**: Gray (⏰)
- **Display**: Shows current stock and expiry date

## Features

✅ **Auto-detection**: Automatically analyzes medicines on mount and when list changes
✅ **Auto-open**: Opens modal on first load if alerts exist (configurable)
✅ **Real-time Updates**: Recalculates when medicines array changes
✅ **Modal Control**: Toggle, open, close functions for full control
✅ **Clean UI**: Pharmacy-themed design with Heroicons and Tailwind
✅ **Accessible**: Proper ARIA labels and keyboard navigation
✅ **Responsive**: Works on all screen sizes

## Example: Full Page Integration

See `DashboardExample.tsx` for a complete working example with state management.

## Next Steps

1. **Backend Integration**: Replace mock data with API calls
2. **Real-time Updates**: Use WebSockets for live notifications
3. **Notifications Persistence**: Store dismissed alerts in localStorage/database
4. **Email Alerts**: Send email notifications for critical alerts
5. **Sound Alerts**: Add audio notifications for urgent cases
6. **Admin Settings**: Allow admins to customize alert thresholds

## Troubleshooting

### Modal doesn't auto-open on load
- Ensure `medicines` array is populated before hook is called
- Check browser console for errors
- Verify `autoOpen` prop is set to `true`

### Alerts not updating
- Check if medicines state is being updated correctly
- Verify the `useNotifications` dependency array includes `medicines`
- Try calling the manual `openModal()` function to debug

### Icons not showing
- Ensure `@heroicons/react` is installed
- Check if Tailwind CSS is properly configured