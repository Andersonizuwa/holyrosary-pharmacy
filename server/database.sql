-- ============================================
-- Holy Rosary Pharmacy - Database Schema
-- ============================================
-- Create Database
CREATE DATABASE IF NOT EXISTS holyrosay_pharmacy;
USE holyrosay_pharmacy;

-- ============================================
-- 1. USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'store_officer', 'ipp', 'dispensary') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 2. MEDICINES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barcode VARCHAR(255) UNIQUE,
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  package_type VARCHAR(100),
  quantity INT NOT NULL DEFAULT 0,
  buy_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) GENERATED ALWAYS AS (quantity * buy_price) STORED,
  selling_price DECIMAL(10,2) NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  low_stock_threshold INT DEFAULT 50,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_barcode (barcode),
  INDEX idx_name (name),
  INDEX idx_expiry (expiry_date),
  INDEX idx_quantity (quantity)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 3. DELEGATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delegations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id INT NOT NULL,
  delegated_by INT,
  delegated_to ENUM('ipp', 'dispensary', 'other') NOT NULL,
  quantity INT NOT NULL,
  generic_name VARCHAR(255),
  delegation_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (delegated_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_medicine (medicine_id),
  INDEX idx_delegated_to (delegated_to)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 4. SALES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  folder_no VARCHAR(50),
  age INT,
  sex ENUM('Male', 'Female'),
  phone_number VARCHAR(20),
  invoice_no VARCHAR(100) UNIQUE,
  unit ENUM('Ultrasound','CT scan','Labour Ward','Theatre','ANC','Male Ward','Female Ward','PostNatal','Sick Prenatal','St Anthony','Assumpta','Chi Ward','SCBU','TCN 100%','NHIS 10%','Staff 3000%','Student 10%','Chest','OPCD','A& E PATIENT','A&E REQUEST','Director 100%','Sacred Heart 100%'),
  medicine_id INT NOT NULL,
  quantity INT NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL,
  sold_by INT,
  status ENUM('completed', 'returned', 'partial_return') DEFAULT 'completed',
  returned_quantity INT DEFAULT 0,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_medicine (medicine_id),
  INDEX idx_invoice (invoice_no),
  INDEX idx_patient (patient_name),
  INDEX idx_sale_date (sale_date),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 5. NOTIFICATIONS TABLE (Optional)
-- ============================================
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('low_stock', 'out_of_stock', 'expired') NOT NULL,
  medicine_id INT NOT NULL,
  message VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_medicine (medicine_id),
  INDEX idx_type (type),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 6. DELEGATION NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS delegation_notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  medicine_id INT NOT NULL,
  delegated_to ENUM('ipp', 'dispensary') NOT NULL,
  quantity INT NOT NULL,
  message VARCHAR(500),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  INDEX idx_medicine (medicine_id),
  INDEX idx_delegated_to (delegated_to),
  INDEX idx_is_read (is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================
-- 7. INSERT TEST DATA (Optional)
-- ============================================

-- Test Users (passwords are bcrypt hashed - replace with actual hashed values)
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'superadmin@holyrosa.ng', '$2a$12$GFv649no1KWhPfhLUAnApeflQNmHsfHPofxNfl0Q1nMg8Jgk/YqKC', 'superadmin'),
('Admin User', 'admin@holyrosa.ng', '$2a$12$GFv649no1KWhPfhLUAnApeflQNmHsfHPofxNfl0Q1nMg8Jgk/YqKC', 'admin'),
('Store Officer', 'storeofficer@holyrosa.ng', '$2a$12$GFv649no1KWhPfhLUAnApeflQNmHsfHPofxNfl0Q1nMg8Jgk/YqKC', 'store_officer'),
('IPP Staff', 'ipp@holyrosa.ng', '$2a$12$GFv649no1KWhPfhLUAnApeflQNmHsfHPofxNfl0Q1nMg8Jgk/YqKC', 'ipp'),
('Dispensary Staff', 'dispensary@holyrosa.ng', '$2a$12$GFv649no1KWhPfhLUAnApeflQNmHsfHPofxNfl0Q1nMg8Jgk/YqKC', 'dispensary');

-- Test Medicines
INSERT INTO medicines (barcode, name, generic_name, package_type, quantity, buy_price, selling_price, manufacturing_date, expiry_date, low_stock_threshold, created_by) VALUES
('BAR001', 'Paracetamol 500mg', 'Paracetamol', 'Tablet', 150, 50, 80, '2025-01-01', '2027-01-01', 50, 1),
('BAR002', 'Amoxicillin 500mg', 'Amoxicillin', 'Tablet', 80, 100, 150, '2025-01-01', '2027-01-01', 50, 1),
('BAR003', 'Metformin 1000mg', 'Metformin', 'Tablet', 5, 45, 70, '2025-01-01', '2027-01-01', 50, 1),
('BAR004', 'Ibuprofen 200mg', 'Ibuprofen', 'Tablet', 200, 30, 50, '2025-01-01', '2027-01-01', 50, 1),
('BAR005', 'Cough Syrup', 'Dextromethorphan', 'Syrup', 20, 200, 350, '2025-01-01', '2026-06-01', 30, 1);

-- ============================================
-- 8. NOTES FOR PASSWORD SETUP
-- ============================================
-- To generate bcrypt hashed passwords, use:
-- Node.js: const bcrypt = require('bcryptjs'); bcrypt.hashSync('Password123!', 10)
-- Online: https://bcrypt-generator.com/
--
-- Test password for all users: Password123!
-- Replace $2a$10$YourHashedPasswordHere with actual bcrypt hash
-- ============================================