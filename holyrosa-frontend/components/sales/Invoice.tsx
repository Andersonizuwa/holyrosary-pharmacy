'use client';

import React, { useRef } from 'react';
import { getSalesData } from '@/lib/api';

interface MedicineItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  sellingPrice: number;
  totalBeforeDiscount: number;
}

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
  medicines: MedicineItem[];
  discountPercentage: number;
  totalBeforeDiscount: number;
  discountAmount: number;
  totalAfterDiscount: number;
  dispensedBy?: string;
}

interface InvoiceProps {
  data: InvoiceData;
  onClose?: () => void;
}

export const Invoice: React.FC<InvoiceProps> = ({ data, onClose }) => {
  const invoiceRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    if (invoiceRef.current) {
      const printWindow = window.open('', '', 'height=600,width=800');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Invoice ${data.invoiceNumber}</title>
              <style>
                body {
                  font-family: Arial, sans-serif;
                  padding: 20px;
                  margin: 0;
                  background: white;
                  color: #333;
                }
                .invoice-container {
                  max-width: 800px;
                  margin: 0 auto;
                  background: white;
                  padding: 30px;
                  border: 1px solid #ddd;
                }
                .invoice-header {
                  text-align: center;
                  margin-bottom: 30px;
                  border-bottom: 2px solid #333;
                  padding-bottom: 20px;
                }
                .pharmacy-name {
                  font-size: 24px;
                  font-weight: bold;
                  color: #1f2937;
                  margin-bottom: 5px;
                }
                .pharmacy-address {
                  font-size: 12px;
                  color: #666;
                  margin-bottom: 10px;
                }
                .invoice-number {
                  font-size: 14px;
                  font-weight: bold;
                  color: #0369a1;
                }
                .invoice-datetime {
                  font-size: 12px;
                  color: #666;
                  margin-top: 5px;
                }
                .patient-details {
                  margin-bottom: 25px;
                  font-size: 13px;
                }
                .patient-details-row {
                  display: flex;
                  margin-bottom: 8px;
                }
                .patient-label {
                  font-weight: bold;
                  width: 140px;
                  color: #374151;
                }
                .patient-value {
                  color: #333;
                }
                .medicines-table {
                  width: 100%;
                  border-collapse: collapse;
                  margin-bottom: 25px;
                  font-size: 13px;
                }
                .medicines-table th {
                  background-color: #f3f4f6;
                  border: 1px solid #d1d5db;
                  padding: 10px;
                  text-align: left;
                  font-weight: bold;
                  color: #374151;
                }
                .medicines-table td {
                  border: 1px solid #d1d5db;
                  padding: 10px;
                  color: #333;
                }
                .medicines-table .text-right {
                  text-align: right;
                }
                .medicines-table tbody tr:nth-child(even) {
                  background-color: #f9fafb;
                }
                .totals {
                  margin-bottom: 25px;
                  font-size: 13px;
                }
                .total-row {
                  display: flex;
                  justify-content: flex-end;
                  margin-bottom: 10px;
                }
                .total-label {
                  width: 200px;
                  text-align: right;
                  font-weight: 500;
                  color: #374151;
                  margin-right: 20px;
                }
                .total-value {
                  width: 120px;
                  text-align: right;
                  color: #333;
                }
                .total-row.final {
                  border-top: 2px solid #333;
                  border-bottom: 2px solid #333;
                  padding: 10px 0;
                  font-size: 16px;
                  font-weight: bold;
                  color: #1f2937;
                }
                .discount-row {
                  color: #059669;
                  font-weight: 500;
                }
                .footer {
                  text-align: center;
                  padding-top: 20px;
                  border-top: 1px solid #d1d5db;
                  font-size: 12px;
                  color: #666;
                }
                .thank-you {
                  font-weight: bold;
                  margin-bottom: 10px;
                  color: #333;
                }
                @media print {
                  body {
                    margin: 0;
                    padding: 0;
                  }
                  .invoice-container {
                    border: none;
                    padding: 0;
                  }
                }
              </style>
            </head>
            <body>
              <div class="invoice-container">
                <div class="invoice-header">
                  <div class="pharmacy-name">Holy Rosary Pharmacy</div>
                  <div class="pharmacy-address">Port Harcourt</div>
                  <div class="invoice-number">${data.invoiceNumber}</div>
                  <div class="invoice-datetime">${data.date} at ${data.time}</div>
                </div>

                <div class="patient-details">
                  <div class="patient-details-row">
                    <div class="patient-label">Patient Name:</div>
                    <div class="patient-value">${data.patient.name}</div>
                  </div>
                  <div class="patient-details-row">
                    <div class="patient-label">Unit/Department:</div>
                    <div class="patient-value">${data.patient.unit}</div>
                  </div>
                  <div class="patient-details-row">
                    <div class="patient-label">Folder Number:</div>
                    <div class="patient-value">${data.patient.folderNumber}</div>
                  </div>
                  <div class="patient-details-row">
                    <div class="patient-label">Age / Sex:</div>
                    <div class="patient-value">${data.patient.age} / ${data.patient.sex}</div>
                  </div>
                  ${data.patient.phone ? `
                  <div class="patient-details-row">
                    <div class="patient-label">Phone:</div>
                    <div class="patient-value">${data.patient.phone}</div>
                  </div>
                  ` : ''}
                </div>

                <table class="medicines-table">
                  <thead>
                    <tr>
                      <th>Medicine</th>
                      <th class="text-right">Qty</th>
                      <th class="text-right">Price (₦)</th>
                      <th class="text-right">Total (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${data.medicines.map(med => `
                      <tr>
                        <td>${med.medicineName}</td>
                        <td class="text-right">${med.quantity}</td>
                        <td class="text-right">${med.sellingPrice.toFixed(2)}</td>
                        <td class="text-right">${med.totalBeforeDiscount.toFixed(2)}</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>

                <div class="totals">
                  <div class="total-row">
                    <div class="total-label">Subtotal (Before Discount):</div>
                    <div class="total-value">₦${data.totalBeforeDiscount.toFixed(2)}</div>
                  </div>
                  <div class="total-row discount-row">
                    <div class="total-label">Discount Applied (${data.discountPercentage}%):</div>
                    <div class="total-value">-₦${data.discountAmount.toFixed(2)}</div>
                  </div>
                  <div class="total-row final">
                    <div class="total-label">TOTAL AMOUNT DUE:</div>
                    <div class="total-value">₦${data.totalAfterDiscount.toFixed(2)}</div>
                  </div>
                </div>

                <div class="footer">
                  <div class="thank-you">Thank you for your patronage!</div>
                  <div>Please retain this receipt for your records</div>
                </div>
              </div>
            </body>
          </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
      }
    }
  };

  const handleDownloadPDF = async () => {
    // Dynamically import html2pdf only when needed
    const html2pdf = (await import('html2pdf.js')).default;
    
    if (invoiceRef.current) {
      const element = invoiceRef.current;
      const opt = {
        margin: 10,
        filename: `${data.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { orientation: 'portrait', unit: 'mm', format: 'a4' },
      };
      html2pdf().set(opt).from(element).save();
    }
  };

  return (
    <div>
      {/* Print & Download Buttons */}
      <div className="mb-6 flex gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center gap-2"
        >
          🖨️ Print Invoice
        </button>
        <button
          onClick={handleDownloadPDF}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium flex items-center gap-2"
        >
          📥 Download PDF
        </button>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-medium ml-auto"
          >
            Close
          </button>
        )}
      </div>

      {/* Invoice Content (Printable) */}
      <div
        ref={invoiceRef}
        className="max-w-2xl mx-auto bg-white p-8 rounded-lg border border-gray-200"
      >
        {/* Header */}
        <div className="text-center mb-8 pb-6 border-b-2 border-gray-900">
          <h1 className="text-2xl font-bold text-gray-900">Holy Rosary Pharmacy</h1>
          <p className="text-sm text-gray-600 mt-1">Port Harcourt</p>
          <p className="text-sm font-bold text-sky-700 mt-3">{data.invoiceNumber}</p>
          <p className="text-xs text-gray-500 mt-2">
            {data.date} at {data.time}
          </p>
        </div>

        {/* Patient Details */}
        <div className="mb-6 text-sm">
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-gray-700">Patient Name:</span>
            <span className="text-gray-900">{data.patient.name}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-gray-700">Unit/Department:</span>
            <span className="text-gray-900">{data.patient.unit}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-gray-700">Folder Number:</span>
            <span className="text-gray-900">{data.patient.folderNumber}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="font-semibold text-gray-700">Age / Sex:</span>
            <span className="text-gray-900">
              {data.patient.age} / {data.patient.sex}
            </span>
          </div>
          {data.patient.phone && (
            <div className="flex justify-between">
              <span className="font-semibold text-gray-700">Phone:</span>
              <span className="text-gray-900">{data.patient.phone}</span>
            </div>
          )}
        </div>

        {/* Medicines Table */}
        <div className="mb-8">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-300 bg-gray-100">
                <th className="text-left py-2 px-2">Medicine</th>
                <th className="text-right py-2 px-2">Qty</th>
                <th className="text-right py-2 px-2">Price (₦)</th>
                <th className="text-right py-2 px-2">Total (₦)</th>
              </tr>
            </thead>
            <tbody>
              {data.medicines.map((med, idx) => (
                <tr key={idx} className="border-b border-gray-200">
                  <td className="py-2 px-2">{med.medicineName}</td>
                  <td className="text-right py-2 px-2">{med.quantity}</td>
                  <td className="text-right py-2 px-2">{med.sellingPrice.toFixed(2)}</td>
                  <td className="text-right py-2 px-2">{med.totalBeforeDiscount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className="mb-8 text-sm">
          <div className="flex justify-end gap-8 mb-2">
            <span className="font-medium text-gray-700">Subtotal (Before Discount):</span>
            <span className="w-24 text-right">₦{data.totalBeforeDiscount.toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-8 mb-3 text-green-700 font-medium">
            <span>Discount Applied ({data.discountPercentage}%):</span>
            <span className="w-24 text-right">-₦{data.discountAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-end gap-8 border-t-2 border-b-2 border-gray-900 py-2 font-bold text-lg text-gray-900">
            <span>TOTAL AMOUNT DUE:</span>
            <span className="w-24 text-right">₦{data.totalAfterDiscount.toFixed(2)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center pt-6 border-t border-gray-200 text-xs text-gray-600">
          <p className="font-semibold text-gray-800 mb-1">Thank you for your patronage!</p>
          <p>Please retain this receipt for your records</p>
        </div>
      </div>
    </div>
  );
};