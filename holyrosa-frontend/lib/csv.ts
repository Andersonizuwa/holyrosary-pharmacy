/**
 * CSV Generation and Download Utilities
 */

interface SaleRecord {
  id: number;
  patientName: string;
  folderNo?: string;
  unit: string;
  medicineId: string;
  medicineName: string;
  quantity: number;
  sellingPrice: number;
  discount: number;
  totalPrice: number;
  saleDate: string;
  soldByRole: string;
  soldByName: string;
  invoiceNo: string;
}

interface Sale {
  id: string;
  items?: SaleRecord[];
  totalAmount?: number;
  soldBy?: string;
  soldByName?: string;
  createdAt?: string;
}

interface ReportData {
  items: SaleRecord[] | Sale[];
  totals: {
    revenue: number;
    itemsSold: number;
    txCount: number;
  };
}

/**
 * Escape CSV fields to handle commas, quotes, and newlines
 */
function escapeCsvField(field: string | number | boolean): string {
  const fieldStr = String(field);
  if (fieldStr.includes(',') || fieldStr.includes('"') || fieldStr.includes('\n')) {
    return `"${fieldStr.replace(/"/g, '""')}"`;
  }
  return fieldStr;
}

/**
 * Convert report data to CSV string
 */
export function generateSalesReportCSV(data: ReportData, dateFrom: string, dateTo: string): string {
  let csv = '';

  // Header section
  csv += `Sales Report\n`;
  csv += `Date Range: ${dateFrom} to ${dateTo}\n`;
  csv += `Generated: ${new Date().toLocaleString('en-NG')}\n\n`;

  // Summary section
  csv += `SUMMARY\n`;
  csv += `Total Revenue (₦),Total Items Sold,Total Transactions\n`;
  csv += `${data.totals.revenue.toFixed(2)},${data.totals.itemsSold},${data.totals.txCount}\n\n`;

  // Detailed sales section
  csv += `DETAILED SALES\n`;
  csv += `Invoice No,Patient Name,Date,Sold By,Unit,Medicine Name,Quantity,Unit Price (₦),Subtotal (₦),Discount (₦),Amount Paid (₦)\n`;

  // Check if items are SaleRecord[] (from API) or Sale[] (legacy)
  const isSaleRecord = (item: any): item is SaleRecord => {
    return item.patientName !== undefined && item.saleDate !== undefined;
  };

  data.items.forEach((sale: any) => {
    if (isSaleRecord(sale)) {
      // API response format (SaleRecord)
      const saleDate = new Date(sale.saleDate).toLocaleString('en-NG', {
        dateStyle: 'short',
        timeStyle: 'short',
      });
      
      const subtotal = sale.quantity * sale.sellingPrice;
      
      const row = [
        escapeCsvField(sale.invoiceNo),
        escapeCsvField(sale.patientName),
        escapeCsvField(saleDate),
        escapeCsvField(sale.soldByRole),
        escapeCsvField(sale.unit),
        escapeCsvField(sale.medicineName),
        sale.quantity,
        sale.sellingPrice.toFixed(2),
        subtotal.toFixed(2),
        sale.discount.toFixed(2),
        sale.totalPrice.toFixed(2),
      ];
      csv += row.join(',') + '\n';
    } else if (sale.items && Array.isArray(sale.items)) {
      // Legacy format (Sale with items array)
      const saleDate = new Date(sale.createdAt).toLocaleString('en-NG', {
        dateStyle: 'short',
        timeStyle: 'short',
      });

      sale.items.forEach((item: any, index: number) => {
        const row = [
          escapeCsvField(sale.id),
          escapeCsvField(saleDate),
          escapeCsvField(sale.soldByName),
          escapeCsvField(item.medicineName),
          item.quantity,
          item.price?.toFixed(2) || '0.00',
          item.total?.toFixed(2) || '0.00',
          index === 0 ? sale.totalAmount?.toFixed(2) || '0.00' : '',
        ];
        csv += row.join(',') + '\n';
      });
    }
  });

  return csv;
}

/**
 * Trigger CSV download in browser
 */
export function downloadCSV(csvContent: string, filename: string = 'sales-report.csv'): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Generate and download CSV in one call
 */
export function exportSalesReport(
  data: ReportData,
  dateFrom: string,
  dateTo: string
): void {
  const csv = generateSalesReportCSV(data, dateFrom, dateTo);
  const filename = `sales-report-${dateFrom}-to-${dateTo}.csv`;
  downloadCSV(csv, filename);
}