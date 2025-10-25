/**
 * Discount mapping based on Unit/Department
 * Can be either percentage (0-100) or fixed amount (negative values like -3000 for ₦3000 fixed discount)
 */
export const UNIT_DISCOUNTS: Record<string, number> = {
  'Ultrasound': 0,
  'CT scan': 0,
  'Labour Ward': 0,
  'Theatre': 0,
  'ANC': 0,
  'Male Ward': 0,
  'Female Ward': 0,
  'PostNatal': 0,
  'Sick Prenatal': 0,
  'St Anthony': 0,
  'Assumpta': 0,
  'Chi Ward': 0,
  'SCBU': 0,
  'TCN': 100,
  'NHIS': 10,
  'Staff': -3000, // Fixed ₦3000 discount
  'Student': -3000, // Fixed ₦3000 discount
  'Chest': 0,
  'OPCD': 0,
  'A&E PATIENT': 0,
  'A&E REQUEST': 0,
  'Director': 100,
  'Sacred Heart': 100,
};

/**
 * Calculate discounted total
 * @param quantity - Quantity of medicine
 * @param sellingPrice - Selling price per unit
 * @param discountValue - Discount percentage (0-100) or fixed amount (negative for fixed discount)
 * @returns Discounted total (min 0)
 */
export const calculateDiscountedTotal = (
  quantity: number,
  sellingPrice: number,
  discountValue: number
): number => {
  const baseTotal = quantity * sellingPrice;
  
  // If discount is negative, it's a fixed amount discount
  if (discountValue < 0) {
    const fixedDiscount = Math.abs(discountValue);
    return Math.max(0, baseTotal - fixedDiscount);
  }
  
  // Otherwise, it's a percentage discount
  const discountAmount = baseTotal * (discountValue / 100);
  return Math.max(0, baseTotal - discountAmount);
};

/**
 * Get discount percentage for a given unit
 */
export const getUnitDiscount = (unit: string): number => {
  return UNIT_DISCOUNTS[unit] || 0;
};

/**
 * Get list of all available units
 */
export const getAvailableUnits = (): string[] => {
  return Object.keys(UNIT_DISCOUNTS).sort();
};

/**
 * Format discount for display
 * @param unit - The unit to get discount for
 * @returns Formatted discount string (e.g., "₦3000" for fixed or "10%" for percentage)
 */
export const formatDiscount = (unit: string): string => {
  const discount = getUnitDiscount(unit);
  
  if (discount < 0) {
    // Fixed amount discount
    return `₦${Math.abs(discount).toLocaleString('en-NG')}`;
  } else if (discount > 0) {
    // Percentage discount
    return `${discount}%`;
  }
  // No discount
  return 'No discount';
};