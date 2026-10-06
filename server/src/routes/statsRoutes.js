import express from 'express';
import { overview, submissionsActivity, interviewsActivity } from '../controllers/statsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/overview', protect, overview);
router.get('/submissions', protect, submissionsActivity);
router.get('/interviews', protect, interviewsActivity);

export default router;
