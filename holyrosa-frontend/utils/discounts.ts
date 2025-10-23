/**
 * Discount mapping based on Unit/Department
 * Values represent discount percentage
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
  'Staff': 100, // 3000% capped to 100%
  'Student': 10,
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
 * @param discountPercentage - Discount percentage
 * @returns Discounted total (min 0)
 */
export const calculateDiscountedTotal = (
  quantity: number,
  sellingPrice: number,
  discountPercentage: number
): number => {
  const baseTotal = quantity * sellingPrice;
  const discountAmount = baseTotal * (discountPercentage / 100);
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