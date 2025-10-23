/**
 * CSV Generation and Download Utilities
 */

interface SaleItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Sale {
  id: string;
  items: SaleItem[];
  totalAmount: number;
  soldBy: string;
  soldByName: string;
  createdAt: string;
}

interface ReportData {
  items: Sale[];
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
  csv += `Transaction ID,Date,Sold By,Medicine Name,Quantity,Unit Price (₦),Line Total (₦),Transaction Total (₦)\n`;

  data.items.forEach((sale) => {
    const saleDate = new Date(sale.createdAt).toLocaleString('en-NG', {
      dateStyle: 'short',
      timeStyle: 'short',
    });

    sale.items.forEach((item, index) => {
      const row = [
        escapeCsvField(sale.id),
        escapeCsvField(saleDate),
        escapeCsvField(sale.soldByName),
        escapeCsvField(item.medicineName),
        item.quantity,
        item.price.toFixed(2),
        item.total.toFixed(2),
        index === 0 ? sale.totalAmount.toFixed(2) : '', // Only show transaction total on first item
      ];
      csv += row.join(',') + '\n';
    });
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