import dotenv from 'dotenv';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`\n🚀 Holy Rosary Pharmacy API running on http://localhost:${PORT}`);
  console.log(`\n📚 Available endpoints:`);
  console.log(`   POST   /api/auth/login`);
  console.log(`   GET    /api/auth/me`);
  console.log(`   POST   /api/auth/reset-password`);
  console.log(`   GET    /api/dashboard/stats`);
  console.log(`   GET    /api/medicines`);
  console.log(`   GET    /api/medicines/search`);
  console.log(`   GET    /api/medicines/:id`);
  console.log(`   POST   /api/medicines`);
  console.log(`   PUT    /api/medicines/:id`);
  console.log(`   DELETE /api/medicines/:id`);
  console.log(`   GET    /api/delegations`);
  console.log(`   POST   /api/delegations`);
  console.log(`   GET    /api/sales`);
  console.log(`   POST   /api/sales`);
  console.log(`   GET    /api/users`);
  console.log(`\n`);
});