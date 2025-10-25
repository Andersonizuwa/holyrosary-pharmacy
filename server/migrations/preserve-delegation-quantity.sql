-- Migration: Preserve original delegation quantity (immutable for history)
-- This ensures the delegated medicines history shows the original amount delegated
-- not real-time data that changes with sales/returns

-- Add column to store original delegated quantity if it doesn't exist
ALTER TABLE delegations 
ADD COLUMN IF NOT EXISTS original_quantity INT NOT NULL DEFAULT 0 AFTER quantity;

-- Copy existing quantities to original_quantity for historical data
UPDATE delegations 
SET original_quantity = quantity 
WHERE original_quantity = 0;

-- Add index for performance
ALTER TABLE delegations 
ADD INDEX IF NOT EXISTS idx_original_quantity (original_quantity);