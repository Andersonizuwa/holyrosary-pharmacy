import express from 'express';
import { login, getMe, resetPassword } from '../controllers/authController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.post('/login', login);
router.get('/me', authMiddleware, getMe);
router.post('/reset-password', authMiddleware, resetPassword);

export default router;