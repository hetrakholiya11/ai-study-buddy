import express from 'express';
import { summarizeNotesFile } from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Define protected Notes Summarizer endpoint with Multer file parsing middleware
router.post('/summarize', protect, upload.single('file'), summarizeNotesFile);

export default router;
