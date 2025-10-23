import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import medicineRoutes from './routes/medicineRoutes.js';
import delegationRoutes from './routes/delegationRoutes.js';
import saleRoutes from './routes/saleRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: '✅ Holy Rosary Pharmacy API is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/medicines', medicineRoutes);
app.use('/api/delegations', delegationRoutes);
app.use('/api/sales', saleRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Error handler (must be after all other middleware/routes)
app.use((err, req, res, next) => {
  console.error('🔴 GLOBAL ERROR HANDLER:');
  console.error('   Path:', req.path);
  console.error('   Method:', req.method);
  console.error('   Message:', err.message);
  console.error('   Stack:', err.stack);
  console.error('   Full error:', err);
  
  res.status(500).json({ 
    message: 'Server error', 
    error: err.message,
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

export default app;