import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import fs from 'fs';
import connectDB from './config/db.js';

// Import Route definitions
import authRoutes from './routes/authRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import notesRoutes from './routes/notesRoutes.js';
import quizRoutes from './routes/quizRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import roadmapRoutes from './routes/roadmapRoutes.js';

// Load environment variables
dotenv.config();

// Connect to MongoDB Database
connectDB();

const app = express();

// Guarantee that Multer uploads directory exists locally
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
  console.log(`Created missing uploads directory: ${uploadDir}`);
}

// Global Middlewares
app.use(cors()); // Allow frontend react server to query endpoints
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads

// Expose uploads directory statically (optional utility)
app.use('/uploads', express.static('uploads'));

// API Routing prefixes
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/roadmaps', roadmapRoutes);

// Base health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'Study Buddy backend is operational!' });
});

// Base route for root access
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Welcome to the Study Buddy API backend. It is operational!' });
});

// Fallback Route Handler (404 Not Found)
app.use((req, res, next) => {
  res.status(404).json({ success: false, error: `Route not found: ${req.originalUrl}` });
});

// Global Error Handler Middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Exception:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error encountered',
    stack: process.env.NODE_ENV === 'production' ? null : err.stack,
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Study Buddy Backend Server running in mode on port ${PORT}`);
});
