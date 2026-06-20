import express from 'express';
import { generateQuizFromNotes } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define protected Quiz Generator endpoint
router.post('/generate', protect, generateQuizFromNotes);

export default router;
