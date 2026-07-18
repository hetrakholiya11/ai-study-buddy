import express from 'express';
import { 
  generateRoadmap, 
  getUserRoadmaps, 
  getRoadmapById, 
  toggleRoadmapTask, 
  deleteRoadmap 
} from '../controllers/roadmapController.js';
import { protect } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Define API routes for roadmaps
router.post('/generate', protect, upload.array('files', 1), generateRoadmap);
router.get('/history', protect, getUserRoadmaps);
router.get('/:id', protect, getRoadmapById);
router.put('/:id/task', protect, toggleRoadmapTask);
router.delete('/:id', protect, deleteRoadmap);

export default router;
