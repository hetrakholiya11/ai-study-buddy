import express from 'express';
import { 
  createChat, 
  getUserChats, 
  getChatById, 
  sendMessageInChat, 
  deleteChat, 
  updateChatTitle 
} from '../controllers/chatController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All chat routes are protected by authMiddleware
router.use(protect);

router.route('/')
  .post(createChat)
  .get(getUserChats);

router.route('/:id')
  .get(getChatById)
  .delete(deleteChat);

router.route('/:id/message')
  .post(sendMessageInChat);

router.route('/:id/title')
  .put(updateChatTitle);

export default router;
