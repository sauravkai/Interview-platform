import express from 'express';
import { register, login, forgotPassword, resetPassword, demoLogin, getMe, updateProfile, googleAuth, changePassword, uploadAvatar } from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/demo', demoLogin);
router.post('/google', googleAuth);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.put('/avatar', protect, uploadAvatar);

export default router;
