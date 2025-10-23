# 🔐 Password Setup Guide for Test Users

Since passwords must be bcrypt hashed before being stored in the database, follow this guide to set them up correctly.

---

## Test Credentials

All test users use the same password:
```
Password: Password123!
```

**Test Users:**
- `superadmin@holyrosa` / `Password123!`
- `admin@holyrosa` / `Password123!`
- `storeofficer@holyrosa` / `Password123!`
- `ipp@holyrosa` / `Password123!`
- `dispensary@holyrosa` / `Password123!`

---

## 🛠️ Method 1: Generate Hash Using Node.js (Recommended)

### Step 1: Open Node.js Interactive Shell

```powershell
# Open PowerShell and run:
node
```

You should see the `>` prompt (Node REPL)

### Step 2: Hash the Password

Copy and paste this code:

```javascript
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('Password123!', 10);
console.log(hash);
```

### Step 3: Copy the Output

You'll get something like:
```
$2a$10$abc123xyz...
```

This is your bcrypt hash! Copy it completely.

### Step 4: Exit Node.js

```javascript
.exit
```

---

## 🛠️ Method 2: Use Online Generator

1. Visit: **https://bcrypt-generator.com/**
2. Enter:
   - **String**: `Password123!`
   - **Rounds**: `10`
3. Click **Hash**
4. Copy the result

---

## 🛠️ Method 3: Use Our Backend to Generate Hashes

If your backend is already running, you can use a temporary endpoint. Skip this if you prefer methods 1 or 2.

---

## 📝 Update User Passwords in Database

### Using phpMyAdmin (Easiest)

1. **Open phpMyAdmin**: `http://localhost/phpmyadmin`

2. **Select Database**: Click `holyrosay_pharmacy` on the left sidebar

3. **Open users Table**: Click `users` table

4. **Edit Each User**:
   - Click the pencil icon next to each user
   - Find the `password` field
   - Replace the existing value with your bcrypt hash
   - Click **Save** or **Go**

5. **Repeat** for all 5 users

### Example

**Before:**
```
password: $2a$10$YourHashedPasswordHere
```

**After** (with real hash):
```
password: $2a$10$G8kJzJxHNV6qOhjPfqI7O.PvCJpAaLKvGdVcXe0B5H4bK5vRvqKvi
```

---

## ✅ Verify Passwords Are Set

1. Start the backend: `npm run dev`
2. Try logging in with curl:

```powershell
$body = @{
    email = "superadmin@holyrosa"
    password = "Password123!"
} | ConvertTo-Json

Invoke-WebRequest -Uri "http://localhost:5000/api/auth/login" `
  -Method POST `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

### Expected Success Response:
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

### If it fails:
```json
{
  "message": "Invalid credentials"
}
```

Then passwords weren't hashed correctly. Repeat the setup.

---

## 🚀 Quick Hash Generation

To quickly generate hashes for all test users, use this Node.js script:

### Create `generate-hashes.js` in server folder:

```javascript
const bcrypt = require('bcryptjs');

const password = 'Password123!';
const hash = bcrypt.hashSync(password, 10);

console.log('\n✅ Bcrypt Hash for Password123!:');
console.log(hash);
console.log('\nCopy this hash and update all user passwords in the database.\n');
```

### Run it:

```powershell
cd c:\holyrosary\server
node generate-hashes.js
```

---

## 🔒 For Production

In production, **NEVER**:
- ❌ Use same password for all users
- ❌ Share password hashes
- ❌ Store passwords in plain text
- ❌ Use weak JWT secrets

Instead:
- ✅ Use unique passwords per user
- ✅ Change JWT_SECRET in .env
- ✅ Use HTTPS
- ✅ Implement password reset emails
- ✅ Add rate limiting on login

---

## 📋 Checklist

- [ ] Decided which hash generation method to use
- [ ] Generated bcrypt hash for `Password123!`
- [ ] Updated all 5 user passwords in database
- [ ] Started backend (`npm run dev`)
- [ ] Tested login with curl/Postman
- [ ] Received JWT token successfully

---

## 🆘 Troubleshooting

### ❌ "Invalid credentials" after updating passwords

**Solution:**
- Double-check the hash is copied completely
- Make sure the password field was saved in database
- Clear browser cache
- Try again

### ❌ "command not found: node"

**Solution:**
- Install Node.js from https://nodejs.org/
- Close and reopen PowerShell
- Try `node --version` to verify

### ❌ Different hash each time

**This is normal!** Bcrypt generates a different hash each time (with salt), but they all work for the same password.

### ❌ Hash has spaces or line breaks

**This will break it!** Copy the complete hash without any spaces.
- ✅ Correct: `$2a$10$G8kJzJxHNV6qOhjPfqI7O.PvCJpAaLKvGdVcXe0B5H4bK5vRvqKvi`
- ❌ Wrong: `$2a$10$G8kJzJxHNV6qOhjPfqI7O. PvCJpAaLKvGdVcXe0B5H4bK5vRvqKvi` (space in middle)

---

## 💡 Pro Tips

1. **Save your hash** - If you generate a hash, save it somewhere safe for later use
2. **Test each user** - After updating, try logging in with each user to verify
3. **Use same password** - For testing, use same password for all users for simplicity
4. **Keep .env secure** - Don't commit .env to git, only .env.example

---

## 📞 Need Help?

See the main **SETUP-GUIDE.md** for complete backend setup instructions.