'use client';

import React, { useState } from 'react';
import AuthGuard from '@/components/auth/AuthGuard';
import { Sidebar } from '@/components/ui/Sidebar';
import { Topbar } from '@/components/ui/Topbar';

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * AppShell wraps authenticated pages with:
 * - Topbar at the top with menu toggle and user info
 * - Sidebar on the left (responsive - mobile drawer / desktop fixed)
 * - Main content area that scales with sidebar visibility
 */
export const AppShell: React.FC<AppShellProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <AuthGuard>
      <div className="flex h-screen bg-gray-100">
        {/* Sidebar */}
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden w-full md:ml-64">
          {/* Topbar */}
          <Topbar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

          {/* Page Content */}
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
            {children}
          </main>
        </div>
      </div>
    </AuthGuard>
  );
};

export default AppShell;