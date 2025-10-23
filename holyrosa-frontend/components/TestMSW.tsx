// components/TestMSW.tsx - Test component to verify MSW is working
'use client';

import { useState } from 'react';

export default function TestMSW() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testLogin = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'superadmin@holyrosa.ng',
          password: 'Password123!',
        }),
      });

      const data = await response.json();
        console.log('MSW Test response:', data);

      if (response.ok) {
        setResult(`✅ MSW Working! Received: ${JSON.stringify(data, null, 2)}`);
      } else {
        setResult(`❌ MSW Error: ${response.status} - ${data.message}`);
      }
    } catch (error) {
      console.error('MSW Test error:', error);
      setResult(`❌ Network Error: ${(error as any).message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-yellow-100 border border-yellow-400 rounded-lg">
      <h3 className="font-bold text-yellow-800 mb-2">MSW Test Panel</h3>
      <button
        onClick={testLogin}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
      >
        {loading ? 'Testing...' : 'Test MSW Login'}
      </button>
      {result && (
        <div className="mt-4 p-3 bg-white rounded text-sm font-mono">
          <pre>{result}</pre>
        </div>
      )}
    </div>
  );
}
