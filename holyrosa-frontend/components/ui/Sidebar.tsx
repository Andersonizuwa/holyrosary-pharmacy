'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  BeakerIcon,
  ArrowsRightLeftIcon,
  ShoppingCartIcon,
  DocumentChartBarIcon,
  UsersIcon,
  InboxArrowDownIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '@/context/AuthContext';
import { canViewMedicines, canDelegate, canViewDelegated, canViewUsers, canAccessReports, canAccessSales } from '@/utils/roles';
import clsx from 'clsx';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  if (!user) return null;

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    ...(canViewMedicines(user.role) ? [{
      name: 'Medicines',
      href: '/medicines',
      icon: BeakerIcon,
    }] : []),
    ...(canDelegate(user.role) ? [{
      name: 'Drug Delegation',
      href: '/delegation',
      icon: ArrowsRightLeftIcon,
    }] : []),
    ...(canViewDelegated(user.role) ? [{
      name: 'Delegated Drugs',
      href: '/delegated',
      icon: InboxArrowDownIcon,
    }] : []),
    ...(canAccessReports(user.role) ? [{
      name: 'Reports',
      href: '/reports',
      icon: DocumentChartBarIcon,
    }] : []),
    ...(canAccessSales(user.role) ? [{
      name: 'Sales',
      href: '/sales',
      icon: ShoppingCartIcon,
    }] : []),
    ...(canViewUsers(user.role) ? [{
      name: 'Users',
      href: '/users',
      icon: UsersIcon,
    }] : []),
  ];

  const SidebarContent = () => (
    <>
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
        <h1 className="text-white text-xl font-bold">HOLYROSA</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'));
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                )}
              >
                <item.icon
                  className={clsx(
                    'mr-3 flex-shrink-0 h-6 w-6',
                    isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile/Tablet sidebar backdrop */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Mobile/Tablet sidebar (responsive drawer) */}
      <div
        className={clsx(
          'fixed inset-y-0 left-0 z-50 w-64 bg-gray-800 transform transition-transform duration-300 ease-in-out lg:hidden',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
        role="navigation"
        aria-label="Mobile navigation"
      >
        <div className="flex-1 flex flex-col min-h-0">
          <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-gray-900">
            <h1 className="text-white text-xl font-bold">HOLYROSA</h1>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-400 hover:text-white transition-colors p-1"
              aria-label="Close navigation menu"
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 flex flex-col overflow-y-auto">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navItems.map((item) => {
                const isActive = pathname === item.href || (pathname && pathname.startsWith(item.href + '/'));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={clsx(
                      'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isActive
                        ? 'bg-gray-900 text-white'
                        : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    )}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    <item.icon
                      className={clsx(
                        'mr-3 flex-shrink-0 h-6 w-6',
                        isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
                      )}
                      aria-hidden="true"
                    />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar (always visible) */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
          <SidebarContent />
        </div>
      </div>
    </>
  );
};
