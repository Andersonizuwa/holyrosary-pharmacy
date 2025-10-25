import express from 'express';
import { 
  createReturn, 
  getReturns, 
  getReturnById, 
  deleteReturn 
} from '../controllers/returnController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Get all returns with pagination
router.get('/', authMiddleware, getReturns);

// Get specific return by ID
router.get('/:id', authMiddleware, getReturnById);

// Create new return
router.post('/', authMiddleware, createReturn);

// Delete return
router.delete('/:id', authMiddleware, deleteReturn);

export default router;