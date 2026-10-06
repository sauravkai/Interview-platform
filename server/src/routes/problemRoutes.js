import express from 'express';
import {
  getProblems,
  getProblemBySlug,
  createProblem,
  updateProblem,
  deleteProblem,
} from '../controllers/problemController.js';
import { protect, authorize } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getProblems);
router.get('/:slug', getProblemBySlug);
router.post('/', protect, authorize('admin', 'interviewer'), createProblem);
router.put('/:id', protect, authorize('admin', 'interviewer'), updateProblem);
router.delete('/:id', protect, authorize('admin'), deleteProblem);

export default router;
