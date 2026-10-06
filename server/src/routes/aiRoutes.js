import express from 'express';
import { getQuestion, evaluateResponse, getVapiToken } from '../controllers/aiController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.get('/question', protect, getQuestion);
router.post('/evaluate', protect, evaluateResponse);
router.get('/vapi-config', protect, getVapiToken);

export default router;
