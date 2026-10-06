import express from 'express';
import { runCode, submitCode, getSubmissions } from '../controllers/submissionController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/run', runCode);
router.post('/submit', protect, submitCode);
router.get('/my', protect, getSubmissions);

export default router;
