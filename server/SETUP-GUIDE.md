# 🚀 Holy Rosary Pharmacy - Backend Setup Guide

Complete step-by-step guide to set up the Express.js backend.

## ⚙️ Prerequisites

Before starting, make sure you have:

- ✅ **Node.js** v14+ installed ([Download](https://nodejs.org/))
- ✅ **MySQL** server running
- ✅ **phpMyAdmin** or MySQL client access
- ✅ Git (optional)

## 📝 STEP 1: Verify MySQL is Running

### On Windows

1. Open phpMyAdmin: `http://localhost/phpmyadmin`
2. Log in with your MySQL credentials
3. You should see the phpMyAdmin interface

**OR** check via Command Prompt:
```powershell
mysql --version
```

If MySQL isn't running:
- **XAMPP**: Open XAMPP Control Panel → Click "Start" next to MySQL
- **WAMP**: Open WAMP Control Panel → MySQL should be running (green)
- **MAMP**: Open MAMP App → Click "Start"

---

## 📦 STEP 2: Install Backend Dependencies

```powershell
# Navigate to server directory
cd c:\holyrosary\server

# Install all dependencies
npm install
```

**What gets installed:**
- `express` - Web framework
- `mysql2` - MySQL driver with promises
- `cors` - Cross-Origin Resource Sharing
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `dotenv` - Environment variables
- `nodemon` - Auto-restart on code changes (dev dependency)

---

## 🗄️ STEP 3: Create Database and Tables

### Option A: Using phpMyAdmin (Recommended for beginners)

1. Open **phpMyAdmin**: `http://localhost/phpmyadmin`
2. Go to **SQL** tab
3. Copy the entire content from `c:\holyrosary\server\database.sql`
4. Paste it into the SQL input area
5. Click **Go** to execute

### Option B: Using MySQL Command Line

```bash
# Open MySQL command line
mysql -u root -p

# When prompted, enter your MySQL password (if any, press Enter if no password)
# Then paste the entire content of database.sql
```

Or directly:
```bash
mysql -u root -p holyrosay_pharmacy < c:\holyrosary\server\database.sql
```

### ✅ Verify Tables Were Created

In phpMyAdmin:
1. Navigate to `holyrosay_pharmacy` database (left sidebar)
2. You should see these tables:
   - ✅ users
   - ✅ medicines
   - ✅ delegations
   - ✅ sales
   - ✅ notifications

---

## 🔑 STEP 4: Set Up Passwords for Test Users

The database script creates users, but passwords need to be hashed. Here's how:

### Option A: Using Node.js (Recommended)

1. Open Command Prompt
2. Run:
```powershell
node
```

3. In the Node REPL, run:
```javascript
const bcrypt = require('bcryptjs');
bcrypt.hashSync('Password123!', 10)
```

4. Copy the output (it starts with `$2a$10$...`)

### Option B: Online Generator

Visit: https://bcrypt-generator.com/
- **String to hash**: `Password123!`
- **Rounds**: 10
- Copy the result

### Update User Passwords in Database

In phpMyAdmin:
1. Select `holyrosay_pharmacy` database
2. Click `users` table
3. Edit each user row
4. Replace the `password` field with your bcrypt hash
5. Click Save

---

## ⚙️ STEP 5: Configure Environment Variables

Edit `.env` file in `c:\holyrosary\server\`:

```env
# Server Port
PORT=5000

# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=holyrosay_pharmacy

# JWT Secret (Change this in production!)
JWT_SECRET=your_jwt_secret_key_change_this_in_production_12345

# Environment
NODE_ENV=development
```

**⚠️ Important:**
- If your MySQL password is not empty, update `DB_PASSWORD`
- Change `JWT_SECRET` to something secure for production
- `PORT=5000` means the API will run on `http://localhost:5000`

---

## 🎬 STEP 6: Start the Backend Server

### Development Mode (Auto-restart on code changes)

```powershell
cd c:\holyrosary\server
npm run dev
```

### Production Mode

```powershell
npm start
```

### ✅ Success Output

You should see:
```
🚀 Holy Rosary Pharmacy API running on http://localhost:5000

📚 Available endpoints:
   POST   /api/auth/login
   GET    /api/auth/me
   POST   /api/auth/reset-password
   GET    /api/dashboard/stats
   GET    /api/medicines
   GET    /api/medicines/search
   GET    /api/medicines/:id
   POST   /api/medicines
   PUT    /api/medicines/:id
   DELETE /api/medicines/:id
   GET    /api/delegations
   POST   /api/delegations
   GET    /api/sales
   POST   /api/sales
   GET    /api/users

✅ Connected to MySQL Database
```

---

## 🧪 STEP 7: Test the Backend

### Test 1: Check if API is Running

Open your browser or use curl:
```bash
curl http://localhost:5000
```

Expected response:
```json
{
  "message": "✅ Holy Rosary Pharmacy API is running"
}
```

### Test 2: Login (Get JWT Token)

```powershell
# Using PowerShell
$body = @{
    email = "superadmin@holyrosa"
    password = "Password123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

**Expected Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Super Admin",
    "email": "superadmin@holyrosa",
    "role": "superadmin"
  }
}
```

### Test 3: Get Medicines

```bash
curl http://localhost:5000/api/medicines?page=1&limit=10
```

**Expected Response:**
```json
{
  "items": [...],
  "total": 5,
  "page": 1,
  "limit": 10,
  "pages": 1
}
```

---

## 🔗 STEP 8: Connect Frontend to Backend

In your Next.js frontend, update environment variables:

### Create `.env.local` in `c:\holyrosary\holyrosa-frontend\`

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api
```

### Update Frontend API Calls

Change your fetch calls from:
```javascript
// Old (using mock API)
fetch('/api/medicines')

// New (using backend)
fetch(`${process.env.NEXT_PUBLIC_API_URL}/medicines`)
```

---

## 📚 API Documentation

For complete API documentation, see:
- `c:\holyrosary\.zencoder\rules\API-CONTRACTS.md` - All endpoint specifications
- `README.md` - API usage guide

---

## 🐛 Troubleshooting

### ❌ "Cannot find module 'express'"
**Solution**: Run `npm install` again
```bash
cd c:\holyrosary\server
npm install
```

### ❌ "connect ECONNREFUSED 127.0.0.1:3306"
**Solution**: MySQL isn't running
- Windows: Start MySQL service or XAMPP/WAMP
- Check: `mysql --version` in terminal

### ❌ "ER_ACCESS_DENIED_FOR_USER 'root'@'localhost'"
**Solution**: Update `DB_PASSWORD` in `.env`
- Check your MySQL password
- If empty, leave `DB_PASSWORD=` blank

### ❌ "ER_NO_REFERENCED_TABLE_2"
**Solution**: Database tables weren't created properly
- Run `database.sql` again in phpMyAdmin
- Make sure database `holyrosay_pharmacy` exists

### ❌ "Port 5000 already in use"
**Solution**: Change PORT in `.env` to another number (e.g., 5001)
```env
PORT=5001
```

### ❌ "Invalid credentials" on login
**Solution**: Passwords weren't hashed correctly
1. Delete all users from `users` table
2. Run database.sql again
3. Update passwords with bcrypt hashes

---

## 🚀 Next Steps

1. ✅ Backend is running
2. ✅ Database is connected
3. ✅ All endpoints are available
4. 📝 Disable MSW in frontend to use real backend
5. 🧪 Test all features

---

## 📞 Quick Reference

| Task | Command |
|------|---------|
| Start dev server | `npm run dev` |
| Start production | `npm start` |
| Install dependencies | `npm install` |
| Stop server | `Ctrl + C` |
| Check MySQL | `mysql --version` |
| Open phpMyAdmin | `http://localhost/phpmyadmin` |

---

## ✨ What's Ready

- ✅ 6 database tables with relationships
- ✅ All API endpoints implemented
- ✅ JWT authentication
- ✅ Password hashing (bcrypt)
- ✅ Pagination support
- ✅ Error handling
- ✅ CORS enabled
- ✅ Ready for production

Happy coding! 🎉