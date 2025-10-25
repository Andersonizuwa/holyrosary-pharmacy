'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { XMarkIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
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

interface NavSubItem {
  name: string;
  href: string;
}

interface NavItem {
  name: string;
  href?: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles?: string[];
  subItems?: NavSubItem[];
}

interface SidebarProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ open, setOpen }) => {
  const pathname = usePathname();
  const { user } = useAuth();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);

  if (!user) return null;

  const navItems: NavItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
    },
    ...(canViewMedicines(user.role) ? [{
      name: 'Medicines',
      icon: BeakerIcon,
      subItems: [
        { name: 'Add Medicine', href: '/medicines/add' },
        { name: 'Medicine List', href: '/medicines' },
      ],
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
      icon: ShoppingCartIcon,
      subItems: [
        { name: 'Make Sales', href: '/sales' },
        { name: 'Sales Records', href: '/sales/records' },
        { name: 'Return History', href: '/sales/returns' },
      ],
    }] : []),
    ...(canViewUsers(user.role) ? [{
      name: 'Users',
      href: '/users',
      icon: UsersIcon,
    }] : []),
  ];

  const toggleMenu = (menuName: string) => {
    setExpandedMenu(expandedMenu === menuName ? null : menuName);
  };

  const isSubItemActive = (subItems?: NavSubItem[]): boolean => {
    if (!subItems) return false;
    return subItems.some(item => pathname === item.href || pathname.startsWith(item.href + '/'));
  };

  const NavItemComponent = ({ item, isMobile }: { item: NavItem; isMobile: boolean }) => {
    const isActive = item.href ? (pathname === item.href || pathname.startsWith(item.href + '/')) : false;
    
    // Filter sub-items based on role (for Sales menu, hide Make Sales and Sales Records for admin/superadmin)
    let filteredSubItems = item.subItems;
    if (item.name === 'Sales' && user && ['admin', 'superadmin'].includes(user.role)) {
      filteredSubItems = item.subItems?.filter(sub => sub.name !== 'Make Sales' && sub.name !== 'Sales Records');
    }
    
    const hasSubItems = filteredSubItems && filteredSubItems.length > 0;
    const isExpanded = expandedMenu === item.name;
    const isSubActive = isSubItemActive(filteredSubItems);

    if (hasSubItems) {
      return (
        <div key={item.name}>
          <button
            onClick={() => toggleMenu(item.name)}
            className={clsx(
              'w-full group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
              isSubActive || isExpanded
                ? 'bg-gray-900 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            )}
          >
            <item.icon
              className={clsx(
                'mr-3 flex-shrink-0 h-6 w-6',
                isSubActive || isExpanded ? 'text-white' : 'text-gray-400 group-hover:text-gray-300'
              )}
            />
            <span className="flex-1 text-left">{item.name}</span>
            <ChevronDownIcon
              className={clsx(
                'h-5 w-5 transition-transform',
                isExpanded ? 'transform rotate-180' : ''
              )}
            />
          </button>

          {/* Submenu */}
          {isExpanded && filteredSubItems && (
            <div className="pl-4 space-y-1 mt-1">
              {filteredSubItems.map((subItem) => {
                const isSubItemActiveCheck = pathname === subItem.href || pathname.startsWith(subItem.href + '/');
                return (
                  <Link
                    key={subItem.name}
                    href={subItem.href}
                    onClick={() => isMobile && setOpen(false)}
                    className={clsx(
                      'block px-2 py-2 text-sm font-medium rounded-md transition-colors',
                      isSubItemActiveCheck
                        ? 'bg-gray-700 text-white'
                        : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                    )}
                  >
                    {subItem.name}
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href!}
        onClick={() => isMobile && setOpen(false)}
        className={clsx(
          'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
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
  };

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className="flex items-center h-16 flex-shrink-0 px-4 bg-gray-900">
        <h1 className="text-white text-xl font-bold">HOLYROSA</h1>
      </div>
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="flex-1 px-2 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItemComponent key={item.name} item={item} isMobile={isMobile} />
          ))}
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
              {navItems.map((item) => (
                <NavItemComponent key={item.name} item={item} isMobile={true} />
              ))}
            </nav>
          </div>
        </div>
      </div>

      {/* Desktop sidebar (always visible) */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-gray-800">
          <SidebarContent isMobile={false} />
        </div>
      </div>
    </>
  );
};
