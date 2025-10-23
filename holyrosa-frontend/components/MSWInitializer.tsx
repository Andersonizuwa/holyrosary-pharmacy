'use client';

import { useEffect } from 'react';

export default function MSWInitializer() {
  useEffect(() => {
    // Only initialize MSW if enabled
    // By default, MSW is disabled to use real backend
    // Set NEXT_PUBLIC_ENABLE_MSW=true to enable MSW for mock data
    const enableMSW = process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';
    
    if (typeof window !== 'undefined' && enableMSW) {
      const initMSW = async () => {
        try {
          const { worker } = await import('@/mocks/browser');
          console.log('🔄 Starting MSW (Mock Service Worker)...');
          await worker.start({
            onUnhandledRequest: 'bypass',
            quiet: true,
          });
          console.log('✅ MSW started - using mock data');
        } catch (error) {
          console.error('❌ Failed to start MSW:', error);
        }
      };

      initMSW();
    } else if (typeof window !== 'undefined') {
      console.log('✅ Using real backend API at', process.env.NEXT_PUBLIC_API_URL);
    }
  }, []);

  return null;
}