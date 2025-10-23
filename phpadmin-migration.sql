USE holyrosay_pharmacy;

ALTER TABLE sales ADD COLUMN status ENUM('completed', 'returned', 'partial_return') DEFAULT 'completed' AFTER sold_by;
ALTER TABLE sales ADD COLUMN returned_quantity INT DEFAULT 0 AFTER status;
ALTER TABLE sales ADD INDEX idx_status (status);

-- Verify
SELECT COLUMN_NAME, COLUMN_TYPE, COLUMN_DEFAULT FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'sales' AND COLUMN_NAME IN ('status', 'returned_quantity') AND TABLE_SCHEMA = 'holyrosay_pharmacy';