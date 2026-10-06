import express from 'express';
import { getUsers, updateUserRole, getDashboardStats } from '../controllers/userController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', getDashboardStats);
router.get('/', protect, authorize('admin'), getUsers);
router.put('/:id/role', protect, authorize('admin'), updateUserRole);

export default router;
