-- ============================================
-- MIGRATION: Add Return Tracking to Sales Table
-- ============================================
-- This migration adds columns to track drug returns and reverses
-- Run this on existing databases to support return functionality
-- 
-- Date: 2024
-- Description: Adds status and returned_quantity columns to sales table
-- ============================================

USE holyrosay_pharmacy;

-- Step 1: Add status column (tracks sale state)
ALTER TABLE sales 
ADD COLUMN status ENUM('completed', 'returned', 'partial_return') 
DEFAULT 'completed' 
AFTER sold_by;

-- Step 2: Add returned_quantity column (tracks partial return amount)
ALTER TABLE sales 
ADD COLUMN returned_quantity INT 
DEFAULT 0 
AFTER status;

-- Step 3: Add index for performance (status will be queried frequently)
ALTER TABLE sales 
ADD INDEX idx_status (status);

-- Step 4: Verify the changes
-- Run this query to confirm migration was successful
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'sales' 
AND COLUMN_NAME IN ('status', 'returned_quantity')
AND TABLE_SCHEMA = 'holyrosay_pharmacy';

-- Expected output:
-- status         | ENUM('completed','returned','partial_return') | 'completed'
-- returned_quantity | int(11)                                    | 0

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check all sales have the new columns
-- SELECT * FROM sales LIMIT 1 \G

-- Check status distribution (all should be 'completed' initially)
-- SELECT status, COUNT(*) as count FROM sales GROUP BY status;

-- Check returned_quantity (all should be 0 initially)
-- SELECT COUNT(*) FROM sales WHERE returned_quantity = 0;

-- ============================================
-- ROLLBACK (if needed)
-- ============================================
-- ALTER TABLE sales DROP COLUMN status;
-- ALTER TABLE sales DROP COLUMN returned_quantity;
-- ALTER TABLE sales DROP INDEX idx_status;