import fs from 'fs';
import pdf from 'pdf-parse';
import geminiService from '../services/geminiService.js';
import User from '../models/User.js';

/**
 * @desc    Chat with AI Study Buddy
 * @route   POST /api/ai/chat
 * @access  Private
 */
export const chatWithBuddy = async (req, res) => {
  const { message, history } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ success: false, error: 'Please enter a message' });
    }

    const reply = await geminiService.chat(message, history || []);
    
    res.status(200).json({
      success: true,
      message: {
        role: 'assistant',
        content: reply,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('AI Chat Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Summarize notes from PDF or text copy-paste
 * @route   POST /api/notes/summarize
 * @access  Private
 */
export const summarizeNotesFile = async (req, res) => {
  let notesText = '';
  let filePath = '';

  try {
    // If a PDF file was uploaded via Multer
    if (req.file) {
      filePath = req.file.path;
      const fileBuffer = fs.readFileSync(filePath);
      
      // Parse PDF buffer to extract clean text content
      const pdfData = await pdf(fileBuffer);
      notesText = pdfData.text;

      if (!notesText.trim()) {
        return res.status(400).json({ success: false, error: 'Could not extract readable text from uploaded PDF.' });
      }
    } else if (req.body.text) {
      // Fallback to text area body input
      notesText = req.body.text;
    }

    if (!notesText.trim()) {
      return res.status(400).json({ success: false, error: 'Please upload a PDF notes file or paste text content' });
    }

    // Call Gemini API to summarize content text
    const summaryResult = await geminiService.summarize(notesText);

    // Increment user's summariesGenerated count in DB if authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { summariesGenerated: 1 } });
    }

    res.status(200).json({
      success: true,
      summary: summaryResult,
    });
  } catch (error) {
    console.error('Notes Summarizer Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Clean up temporary uploads directory file if it exists to preserve space
    if (filePath && fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error('Failed to remove temp uploaded file:', err);
      }
    }
  }
};

/**
 * @desc    Generate MCQ quiz questions from subject, notes text, or configurations
 * @route   POST /api/quiz/generate
 * @access  Private
 */
export const generateQuizFromNotes = async (req, res) => {
  const { text, subject, numQuestions, difficulty } = req.body;

  try {
    let contextText = '';

    if (text) {
      // Triggered by raw note content upload
      contextText = text;
    } else if (subject) {
      // Triggered by frontend subject select configurations
      contextText = `Subject: ${subject}. Difficulty level requested: ${difficulty || 'Medium'}. Generate questions matching these bounds.`;
    }

    if (!contextText.trim()) {
      return res.status(400).json({ success: false, error: 'Provide a topic or text to generate a quiz from.' });
    }

    // Call Gemini service to compile structured MCQ quiz array
    const questionsArray = await geminiService.generateQuiz(contextText);

    // Limit output length if specified
    const limit = numQuestions ? Math.min(numQuestions, questionsArray.length) : 5;
    const slicedQuestions = questionsArray.slice(0, limit);

    res.status(200).json({
      success: true,
      questions: slicedQuestions,
    });
  } catch (error) {
    console.error('Quiz Generator Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
