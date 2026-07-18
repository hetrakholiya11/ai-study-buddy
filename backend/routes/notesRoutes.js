import express from 'express';
import { 
  summarizeNotesFile, 
  getUserSummaries, 
  getSummaryById, 
  deleteSummary,
  generateScenariosForSummary,
  getPublicSummaryById,
  downloadPublicSummaryPDF
} from '../controllers/aiController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Public Route (does not require login)
router.get('/public/:id', getPublicSummaryById);
router.get('/public/:id/pdf', downloadPublicSummaryPDF);

// Protected Notes Summarizer history routes
router.get('/history', protect, getUserSummaries);
router.get('/history/:id', protect, getSummaryById);
router.delete('/history/:id', protect, deleteSummary);
router.post('/history/:id/scenarios', protect, generateScenariosForSummary);

// Define protected Notes Summarizer endpoint with Multer file parsing middleware
router.post('/summarize', protect, upload.array('files', 10), summarizeNotesFile);

export default router;
