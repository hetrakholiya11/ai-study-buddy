import express from 'express';
import { chatWithBuddy } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Define protected AI Chat route
router.post('/chat', protect, chatWithBuddy);

export default router;
