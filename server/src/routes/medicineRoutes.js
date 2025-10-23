import express from 'express';
import {
  getMedicines,
  getMedicineById,
  createMedicine,
  updateMedicine,
  deleteMedicine,
  searchMedicines,
  getMedicineNotifications
} from '../controllers/medicineController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getMedicines);
router.get('/notifications/all', getMedicineNotifications);
router.get('/search', searchMedicines);
router.get('/:id', getMedicineById);
router.post('/', authMiddleware, createMedicine);
router.put('/:id', authMiddleware, updateMedicine);
router.delete('/:id', authMiddleware, deleteMedicine);

export default router;