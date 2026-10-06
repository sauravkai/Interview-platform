import express from 'express';
import { createSession, getUserSessions, revokeSession } from '../controllers/sessionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', createSession);
router.get('/', protect, getUserSessions);
router.put('/:sessionId/revoke', protect, revokeSession);

export default router;
