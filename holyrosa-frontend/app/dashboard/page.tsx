// app/dashboard/page.tsx - Dashboard homepage for authenticated users
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AppShell from '@/components/ui/AppShell';
import Card from '@/components/ui/Card';
import SalesChart from '@/components/dashboard/SalesChart';
import { NotificationModal } from '@/components/notifications/NotificationModal';
import { useAuth } from '@/context/AuthContext';
import { Stats } from '@/types';

export default function Dashboard() {
  const { user, role } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);



  useEffect(() => {
    const fetchStats = async () => {
      try {
        setIsLoading(true);
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
        const token = typeof window !== 'undefined' ? localStorage.getItem('holyrosa_token') : null;
        
        const response = await fetch(`${apiUrl}/dashboard/stats`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            ...(token && { Authorization: `Bearer ${token}` })
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch stats');
        }
        const data = await response.json();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching stats:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchStats();
  }, []);

  const handleCardClick = (path: string) => {
    router.push(path);
  };

  return (
    <AppShell>
      <div className="p-4 sm:p-6 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Here&apos;s what&apos;s happening in your pharmacy today.
          </p>
        </div>

        {/* Alerts Banner for Admin & Store Officer */}
        {(role === 'admin' || role === 'store_officer') && !isNotificationModalOpen && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.5 1.5H9.5A7.5 7.5 0 002 9v.5a4.5 4.5 0 004.5 4.5h.5a3 3 0 003 3h1a3 3 0 003-3h.5a4.5 4.5 0 004.5-4.5V9A7.5 7.5 0 0010.5 1.5z" />
              </svg>
              <p className="text-sm text-blue-800">You have new medicine alerts. Check them now.</p>
            </div>
            <button
              onClick={() => setIsNotificationModalOpen(true)}
              className="ml-4 px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors whitespace-nowrap"
            >
              View Alerts
            </button>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700">Error loading statistics: {error}</p>
          </div>
        )}

        {/* Dashboard Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          <Card
            title="Total Medicines"
            value={stats?.totalMedicines ?? 0}
            color="blue"
            isLoading={isLoading}
            onClick={() => handleCardClick('/medicines')}
            icon={
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3z" />
              </svg>
            }
          />

          {!stats?.isDelegatedView && (
            <>
              <Card
                title="In Stock"
                value={stats?.inStock ?? 0}
                color="green"
                isLoading={isLoading}
                onClick={() => handleCardClick('/medicines')}
                icon={
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                }
              />

              <Card
                title="Low Stock"
                value={stats?.lowStock ?? 0}
                color="yellow"
                isLoading={isLoading}
                onClick={() => handleCardClick('/medicines')}
                icon={
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm.75-11.25a.75.75 0 00-1.5 0v4.5a.75.75 0 001.5 0v-4.5zM10 14a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                  </svg>
                }
              />

              <Card
                title="Out of Stock"
                value={stats?.outOfStock ?? 0}
                color="red"
                isLoading={isLoading}
                onClick={() => handleCardClick('/medicines')}
                icon={
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                }
              />

              <Card
                title="Expired"
                value={stats?.expired ?? 0}
                color="purple"
                isLoading={isLoading}
                onClick={() => handleCardClick('/medicines')}
                icon={
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M13.477 14.89A6 6 0 0512 11H1.5A1.5 1.5 0 000 12.5V14a6 6 0 005.477 5.988M15 9.5a1 1 0 11-2 0 1 1 0 012 0z" clipRule="evenodd" />
                  </svg>
                }
              />
            </>
          )}

          {role !== 'ipp' && role !== 'dispensary' && role !== 'store_officer' && (
            <Card
              title="Today's Sales"
              value={`₦${stats?.todaySalesAmount.toFixed(2) ?? '0.00'}`}
              color="indigo"
              isLoading={isLoading}
              onClick={() => handleCardClick('/sales')}
              icon={
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" />
                </svg>
              }
            />
          )}
        </div>

        {/* Sales Chart */}
        {role !== 'ipp' && role !== 'dispensary' && role !== 'store_officer' && (
          <div className="mb-8">
            <SalesChart
              data={stats?.salesData ?? []}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* Quick Stats Summary */}
        {role !== 'ipp' && role !== 'dispensary' && role !== 'store_officer' && (
          <div className="bg-white rounded-lg shadow p-4 sm:p-6">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Quick Summary</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              <div className="flex items-center p-3 bg-blue-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-gray-600">
                    {stats?.isDelegatedView ? 'Stock in Hand' : 'Total Items'}
                  </p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    {stats?.totalMedicines ?? 0}
                  </p>
                </div>
              </div>

              {!stats?.isDelegatedView && (
                <div className="flex items-center p-3 bg-green-50 rounded-lg">
                  <div className="flex-shrink-0">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                  <div className="ml-3">
                    <p className="text-xs sm:text-sm text-gray-600">Availability</p>
                    <p className="text-base sm:text-lg font-semibold text-gray-900">
                      {stats?.totalMedicines ? 
                        `${(((stats?.inStock ?? 0) / stats.totalMedicines) * 100).toFixed(0)}%` 
                        : '0%'}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex items-center p-3 bg-indigo-50 rounded-lg">
                <div className="flex-shrink-0">
                  <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
                </div>
                <div className="ml-3">
                  <p className="text-xs sm:text-sm text-gray-600">Today&apos;s Revenue</p>
                  <p className="text-base sm:text-lg font-semibold text-gray-900">
                    ₦{stats?.todaySalesAmount.toFixed(2) ?? '0.00'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notification Modal */}
        <NotificationModal
          isOpen={isNotificationModalOpen}
          onClose={() => setIsNotificationModalOpen(false)}
        />
      </div>
    </AppShell>
  );
}
