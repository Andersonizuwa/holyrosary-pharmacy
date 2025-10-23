/**
 * Invoice number generation utility
 * Generates date-based invoice numbers like INV-2024-001
 */

export const generateInvoiceNumber = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  
  // Get or initialize counter in localStorage
  const key = `invoice_counter_${year}`;
  const currentCounter = localStorage.getItem(key);
  const nextCounter = (parseInt(currentCounter || '0', 10) + 1).toString().padStart(3, '0');
  
  // Save updated counter
  localStorage.setItem(key, nextCounter);
  
  return `INV-${year}-${nextCounter}`;
};

export const getInvoiceNumberCounter = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const key = `invoice_counter_${year}`;
  const counter = localStorage.getItem(key) || '0';
  return counter.padStart(3, '0');
};