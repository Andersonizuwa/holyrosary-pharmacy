# Holy Rosary Pharmacy - Backend API

Complete Express.js backend for the Holy Rosary Pharmacy Management System.

## 📋 Prerequisites

- Node.js (v14 or higher)
- MySQL Server
- phpMyAdmin (optional, for database management)

## 🚀 Setup Instructions

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Configure Environment Variables

Edit `.env` file with your database credentials:

```env
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=holyrosay_pharmacy
JWT_SECRET=your_jwt_secret_key_change_this_in_production
NODE_ENV=development
```

### 3. Create Database Tables

Use the SQL migration script below to create all required tables:

```sql
CREATE DATABASE IF NOT EXISTS holyrosay_pharmacy;
USE holyrosay_pharmacy;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role ENUM('superadmin', 'admin', 'store_officer', 'ipp', 'dispensary') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Medicines Table
CREATE TABLE IF NOT EXISTS medicines (
  id INT AUTO_INCREMENT PRIMARY KEY,
  barcode VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  package_type VARCHAR(100),
  quantity INT NOT NULL DEFAULT 0,
  buy_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) DEFAULT 0,
  selling_price DECIMAL(10,2) NOT NULL,
  manufacturing_date DATE,
  expiry_date DATE,
  low_stock_threshold INT DEFAULT 50,
  created_by INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Delegations Table
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
  FOREIGN KEY (delegated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
  id INT AUTO_INCREMENT PRIMARY KEY,
  patient_name VARCHAR(255) NOT NULL,
  folder_no VARCHAR(50),
  age INT,
  sex ENUM('Male', 'Female'),
  phone_number VARCHAR(20),
  invoice_no VARCHAR(100),
  unit ENUM('Ultrasound','CT scan','Labour Ward','Theatre','ANC','Male Ward','Female Ward','PostNatal','Sick Prenatal','St Anthony','Assumpta','Chi Ward','SCBU','TCN 100%','NHIS 10%','Staff 3000%','Student 10%','Chest','OPCD','A& E PATIENT','A&E REQUEST','Director 100%','Sacred Heart 100%'),
  medicine_id INT NOT NULL,
  quantity INT NOT NULL,
  selling_price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0.00,
  total_price DECIMAL(10,2) NOT NULL,
  sold_by INT,
  sale_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE,
  FOREIGN KEY (sold_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Notifications Table (Optional)
CREATE TABLE IF NOT EXISTS notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  type ENUM('low_stock', 'out_of_stock', 'expired') NOT NULL,
  medicine_id INT NOT NULL,
  message VARCHAR(255),
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE CASCADE
);
```

### 4. Seed Initial User Data

Run this to create test users:

```sql
INSERT INTO users (name, email, password, role) VALUES
('Super Admin', 'superadmin@holyrosa', '$2a$10$...', 'superadmin'),
('Admin', 'admin@holyrosa', '$2a$10$...', 'admin'),
('Store Officer', 'storeofficer@holyrosa', '$2a$10$...', 'store_officer'),
('IPP Staff', 'ipp@holyrosa', '$2a$10$...', 'ipp'),
('Dispensary Staff', 'dispensary@holyrosa', '$2a$10$...', 'dispensary');
```

**Note:** Passwords should be bcrypt hashed. Use an online bcrypt generator or your application's hashing method.

### 5. Start the Server

#### Development (with auto-reload)
```bash
npm run dev
```

#### Production
```bash
npm start
```

The server will start on `http://localhost:5000`

## 📚 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (requires auth)
- `POST /api/auth/reset-password` - Reset user password (requires auth)

### Medicines
- `GET /api/medicines` - Get all medicines (paginated)
- `GET /api/medicines/search` - Search medicines
- `GET /api/medicines/:id` - Get single medicine
- `POST /api/medicines` - Create medicine (requires auth)
- `PUT /api/medicines/:id` - Update medicine (requires auth)
- `DELETE /api/medicines/:id` - Delete medicine (requires auth)

### Delegations
- `GET /api/delegations` - Get all delegations (paginated)
- `POST /api/delegations` - Create delegation (requires auth)

### Sales
- `GET /api/sales` - Get all sales (paginated)
- `POST /api/sales` - Create sale (requires auth)

### Users
- `GET /api/users` - Get all users (requires auth)

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics (requires auth)

## 🔐 Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer your_jwt_token
```

### Example Login Request

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "superadmin@holyrosa",
    "password": "Password123!"
  }'
```

### Example Protected Request

```bash
curl -X GET http://localhost:5000/api/medicines \
  -H "Authorization: Bearer your_jwt_token"
```

## 📁 Project Structure

```
server/
├── src/
│   ├── config/
│   │   └── db.js              # Database connection
│   ├── controllers/           # Business logic
│   │   ├── authController.js
│   │   ├── medicineController.js
│   │   ├── delegationController.js
│   │   ├── saleController.js
│   │   ├── userController.js
│   │   └── dashboardController.js
│   ├── routes/                # API routes
│   │   ├── authRoutes.js
│   │   ├── medicineRoutes.js
│   │   ├── delegationRoutes.js
│   │   ├── saleRoutes.js
│   │   ├── userRoutes.js
│   │   └── dashboardRoutes.js
│   ├── middlewares/           # Custom middlewares
│   │   └── auth.js
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── .env                       # Environment variables
├── package.json               # Dependencies
└── README.md                  # This file
```

## 🧪 Testing

Use Postman or curl to test endpoints:

### Get Medicines
```bash
curl http://localhost:5000/api/medicines?page=1&limit=10
```

### Create Medicine
```bash
curl -X POST http://localhost:5000/api/medicines \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer token" \
  -d '{
    "name": "Paracetamol 500mg",
    "genericName": "Paracetamol",
    "quantity": 100,
    "buyPrice": 50,
    "sellingPrice": 80,
    "manufacturingDate": "2025-01-01",
    "expiryDate": "2027-01-01"
  }'
```

## ⚠️ Important Notes

1. **Password Hashing**: All passwords are hashed using bcryptjs before storage.
2. **JWT Expiration**: Tokens expire after 24 hours.
3. **CORS**: Frontend should be accessible at `http://localhost:3000` (configurable).
4. **Database**: Ensure MySQL is running before starting the server.

## 🐛 Troubleshooting

### Connection Refused
- Check if MySQL is running
- Verify DB credentials in `.env`

### Authentication Failed
- Ensure JWT_SECRET is set in `.env`
- Check token hasn't expired

### CORS Errors
- Verify frontend URL in app.js CORS settings
- Check if frontend request includes required headers

## 📞 Support

For issues or questions, refer to the API-CONTRACTS.md document for detailed endpoint specifications.