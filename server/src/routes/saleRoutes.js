import express from 'express';
import { createSale, getSales } from '../controllers/saleController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', authMiddleware, getSales);
router.post('/', authMiddleware, createSale);

export default router;