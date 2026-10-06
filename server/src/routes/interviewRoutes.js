import express from 'express';
import {
  createInterview,
  getUserInterviews,
  getUserInterviewReports,
  getInterviewByRoomId,
  endInterview,
  getInterviewReport,
} from '../controllers/interviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createInterview);
router.get('/my', protect, getUserInterviews);
router.get('/reports', protect, getUserInterviewReports);
router.get('/room/:roomId', protect, getInterviewByRoomId);
router.put('/:id/end', protect, endInterview);
router.get('/:interviewId/report', protect, getInterviewReport);

export default router;
