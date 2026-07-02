import express from 'express';
import { 
  generateQuizFromNotes, 
  submitQuizResult, 
  getUserQuizzes, 
  getQuizById, 
  deleteQuiz 
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Define protected Quiz Generator endpoints
router.post('/generate', protect, upload.array('files', 10), generateQuizFromNotes);
router.get('/history', protect, getUserQuizzes);
router.get('/:id', protect, getQuizById);
router.put('/:id/submit', protect, submitQuizResult);
router.delete('/:id', protect, deleteQuiz);

export default router;
