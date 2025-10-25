-- ============================================
-- Migration: Backfill NULL Unit Values
-- ============================================
-- This migration updates older sales records that have NULL unit values
-- Set them to a sensible default based on the context
-- 
-- Run this script on your database to fix historical data
-- ============================================

USE holyrosay_pharmacy;

-- Step 1: Check how many records have NULL unit before the migration
SELECT COUNT(*) as null_unit_count FROM sales WHERE unit IS NULL;

-- Step 2: Backfill NULL units with 'Staff' as default
-- You can change 'Staff' to another unit if needed
UPDATE sales 
SET unit = 'Staff 3000%'
WHERE unit IS NULL;

-- Step 3: Verify the update
SELECT COUNT(*) as null_unit_count FROM sales WHERE unit IS NULL;

-- Step 4: Check distribution of units after backfill
SELECT unit, COUNT(*) as count 
FROM sales 
GROUP BY unit 
ORDER BY count DESC;

-- ============================================
-- NOTES:
-- ============================================
-- If you want to assign different units based on specific criteria, 
-- you can modify the UPDATE statement. For example:
--
-- Update based on role of who made the sale:
-- UPDATE sales s
-- JOIN users u ON s.sold_by = u.id
-- SET s.unit = CASE 
--   WHEN u.role = 'ipp' THEN 'Staff 3000%'
--   WHEN u.role = 'dispensary' THEN 'Student 10%'
--   ELSE 'Staff 3000%'
-- END
-- WHERE s.unit IS NULL;
--
-- ============================================
-- ROLLBACK (if needed):
-- ============================================
-- ALTER TABLE sales MODIFY unit VARCHAR(255) NULL;
-- (Then manually fix the data or re-run with different values)
-- ============================================