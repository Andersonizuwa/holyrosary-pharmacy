import express from 'express';
import {
  createDelegation,
  getDelegations,
  getDelegationNotifications,
  markDelegationNotificationAsRead,
  markAllDelegationNotificationsAsRead,
  restoreDelegations
} from '../controllers/delegationController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

router.get('/', getDelegations);
router.post('/', (req, res, next) => {
  console.log('📍 POST /delegations route hit');
  console.log('   Headers:', req.headers);
  console.log('   Body:', req.body);
  next();
}, authMiddleware, (req, res, next) => {
  console.log('✅ Auth middleware passed');
  console.log('   User:', req.user);
  next();
}, createDelegation);

// Restore delegations route (when a sale is reversed)
router.post('/restore', authMiddleware, restoreDelegations);

// Delegation notifications routes
router.get('/notifications/all', authMiddleware, getDelegationNotifications);
router.post('/notifications/mark-read', authMiddleware, markDelegationNotificationAsRead);
router.post('/notifications/mark-all-read', authMiddleware, markAllDelegationNotificationsAsRead);

export default router;