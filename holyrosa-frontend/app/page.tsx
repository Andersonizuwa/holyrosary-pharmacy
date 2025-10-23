'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  console.log('🏠 Home rendered:', { isAuthenticated, loading });

  useEffect(() => {
    console.log('🏠 Effect fired:', { isAuthenticated, loading });
    
    if (!loading) {
      console.log('🏠 Not loading anymore, redirecting...');
      const target = isAuthenticated ? '/dashboard' : '/login';
      console.log('🏠 Redirecting to:', target);
      router.push(target);
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-600">Loading...</p>
        <p className="text-xs text-gray-400 mt-2">auth={String(isAuthenticated)} loading={String(loading)}</p>
      </div>
    </div>
  );
}