-- ============================================
-- Add Returns Tables for Sales
-- ============================================

-- Table to track return transactions
CREATE TABLE IF NOT EXISTS sales_returns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sale_id INT NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  return_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  total_returned DECIMAL(10,2) NOT NULL,
  total_original DECIMAL(10,2) NOT NULL,
  is_full_return BOOLEAN DEFAULT FALSE,
  return_reason VARCHAR(500),
  returned_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
  FOREIGN KEY (returned_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_sale (sale_id),
  INDEX idx_return_date (return_date),
  INDEX idx_patient (patient_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table to track individual medicines returned
CREATE TABLE IF NOT EXISTS sales_return_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  return_id INT NOT NULL,
  medicine_id INT NOT NULL,
  quantity_returned INT NOT NULL,
  refund_amount DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES sales_returns(id) ON DELETE CASCADE,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_return (return_id),
  INDEX idx_medicine (medicine_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;