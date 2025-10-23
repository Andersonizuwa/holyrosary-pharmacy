'use client';

import React, { useEffect, useState } from 'react';
import { Invoice } from '@/components/sales/Invoice';
import { useRouter, useSearchParams } from 'next/navigation';

interface InvoiceData {
  invoiceNumber: string;
  date: string;
  time: string;
  patient: {
    name: string;
    unit: string;
    folderNumber: string;
    age: string;
    sex: string;
    invoiceNumber?: string;
    phone?: string;
  };
  medicines: Array<{
    medicineId: string;
    medicineName: string;
    quantity: number;
    sellingPrice: number;
    totalBeforeDiscount: number;
  }>;
  discountPercentage: number;
  totalBeforeDiscount: number;
  discountAmount: number;
  totalAfterDiscount: number;
  dispensedBy?: string;
}

export default function InvoicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [invoiceData, setInvoiceData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      // Try to get invoice data from URL parameter
      const invoiceDataParam = searchParams.get('data');
      
      if (invoiceDataParam) {
        const decodedData = JSON.parse(decodeURIComponent(invoiceDataParam));
        setInvoiceData(decodedData);
      } else {
        // Try to get from localStorage (as fallback)
        const storedInvoice = localStorage.getItem('pending_invoice');
        if (storedInvoice) {
          const parsedInvoice = JSON.parse(storedInvoice);
          setInvoiceData(parsedInvoice);
          localStorage.removeItem('pending_invoice');
        } else {
          setError('No invoice data found. Please complete a sale first.');
        }
      }
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError('Failed to load invoice data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading invoice...</p>
        </div>
      </div>
    );
  }

  if (error || !invoiceData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow p-8 max-w-md text-center">
          <div className="text-4xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Error Loading Invoice</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => router.push('/sales')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            Back to Sales
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Invoice
          data={invoiceData}
          onClose={() => {
            // Close current window or go back
            if (window.opener) {
              window.close();
            } else {
              router.push('/sales');
            }
          }}
        />
      </div>
    </div>
  );
}