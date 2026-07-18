import fs from 'fs';
import pdf from 'pdf-parse';
import geminiService from '../services/geminiService.js';
import User from '../models/User.js';
import Chat from '../models/Chat.js';
import Summary from '../models/Summary.js';
import Quiz from '../models/Quiz.js';
import { parseOffice } from 'officeparser';
import { generateSummaryPDF } from '../utils/pdfGenerator.js';

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
  let filePaths = [];

  try {
    // If multiple files were uploaded via Multer
    if (req.files && req.files.length > 0) {
      let combinedText = '';
      let fileNames = [];

      for (const file of req.files) {
        filePaths.push(file.path);
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        let text = '';

        if (fileExtension === 'pdf') {
          const fileBuffer = fs.readFileSync(file.path);
          const pdfData = await pdf(fileBuffer);
          text = pdfData.text;
        } else if (fileExtension === 'txt') {
          text = fs.readFileSync(file.path, 'utf8');
        } else if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'rtf', 'md', 'html', 'csv'].includes(fileExtension)) {
          const ast = await parseOffice(file.path);
          const parseResult = await ast.to('text');
          text = parseResult && typeof parseResult === 'object' ? parseResult.value : parseResult;
        }

        if (text && text.trim()) {
          combinedText += `\n--- Content from file: ${file.originalname} ---\n${text}\n`;
          fileNames.push(file.originalname);
        }
      }

      notesText = combinedText;

      if (!notesText.trim()) {
        return res.status(400).json({ success: false, error: 'Could not extract readable text from any uploaded documents.' });
      }
    } else if (req.body.text) {
      // Fallback to text area body input
      notesText = req.body.text;
    }

    if (!notesText.trim()) {
      return res.status(400).json({ success: false, error: 'Please upload PDF notes files or paste text content' });
    }

    // Call Gemini API to summarize combined content text
    const summaryResult = await geminiService.summarize(notesText);

    // Create linked chat session
    const notesName = req.files && req.files.length > 0 
      ? req.files.map(f => f.originalname).join(', ') 
      : 'Notes Material';
    
    // Shorten title for chat sidebar if needed
    const chatTitle = req.files && req.files.length > 0 
      ? `Chat: ${req.files.length} notes`
      : 'Chat: Paste Notes';

    const chat = await Chat.create({
      userId: req.user.id,
      title: chatTitle,
      notesContext: notesText,
      notesName: notesName,
      messages: [
        {
          role: 'assistant',
          content: `I have loaded your notes: "${notesName}". Ask me anything about them, or ask me to explain a concept or generate examples!`,
          timestamp: new Date().toISOString()
        }
      ]
    });

    // Create persistent summary entry
    let summaryTitle = notesName;
    if (summaryTitle.length > 60) {
      summaryTitle = summaryTitle.slice(0, 57) + '...';
    }

    const savedSummary = await Summary.create({
      userId: req.user.id,
      title: summaryTitle,
      content: notesText,
      summaryText: summaryResult,
      chatId: chat._id
    });

    // Increment user's summariesGenerated count in DB if authenticated
    if (req.user) {
      await User.findByIdAndUpdate(req.user.id, { $inc: { summariesGenerated: 1 } });
    }

    res.status(200).json({
      success: true,
      summary: savedSummary
    });
  } catch (error) {
    console.error('Notes Summarizer Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Clean up all temporary uploads directory files to preserve disk space
    if (filePaths && filePaths.length > 0) {
      filePaths.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Failed to remove temp uploaded file:', err);
          }
        }
      });
    }
  }
};

/**
 * @desc    Generate MCQ quiz questions from subject, notes text, or configurations
 * @route   POST /api/quiz/generate
 * @access  Private
 */
export const generateQuizFromNotes = async (req, res) => {
  const { text, subject, numQuestions, difficulty, summaryId } = req.body;
  let filePaths = [];

  try {
    let contextText = '';
    let quizTitle = 'Study Buddy Quiz';

    // 1. Check if files are uploaded
    if (req.files && req.files.length > 0) {
      let combinedText = '';
      let fileNames = [];

      for (const file of req.files) {
        filePaths.push(file.path);
        const fileExtension = file.originalname.split('.').pop().toLowerCase();
        let fileText = '';

        if (fileExtension === 'pdf') {
          const fileBuffer = fs.readFileSync(file.path);
          const pdfData = await pdf(fileBuffer);
          fileText = pdfData.text;
        } else if (fileExtension === 'txt') {
          fileText = fs.readFileSync(file.path, 'utf8');
        } else if (['docx', 'doc', 'pptx', 'ppt', 'xlsx', 'xls', 'rtf', 'md', 'html', 'csv'].includes(fileExtension)) {
          const ast = await parseOffice(file.path);
          const parseResult = await ast.to('text');
          fileText = parseResult && typeof parseResult === 'object' ? parseResult.value : parseResult;
        }

        if (fileText && fileText.trim()) {
          combinedText += `\n--- Content from file: ${file.originalname} ---\n${fileText}\n`;
          fileNames.push(file.originalname);
        }
      }

      contextText = combinedText;
      quizTitle = fileNames.join(', ');
      if (quizTitle.length > 50) {
        quizTitle = quizTitle.slice(0, 47) + '...';
      }
      quizTitle += ' Quiz';
    } 
    // 2. Check if a saved summary is selected
    else if (summaryId) {
      const summary = await Summary.findById(summaryId);
      if (!summary) {
        return res.status(404).json({ success: false, error: 'Selected study notes summary not found' });
      }
      contextText = summary.content;
      quizTitle = `${summary.title} Quiz`;
    } 
    // 3. Check if copy-pasted raw notes content
    else if (text) {
      contextText = text;
      quizTitle = text.slice(0, 30) + (text.length > 30 ? '...' : '') + ' Quiz';
    } 
    // 4. Fallback to independent subject configuration
    else if (subject) {
      contextText = `Subject: ${subject}. Difficulty level: ${difficulty || 'Medium'}. Generate MCQ questions based on this.`;
      quizTitle = `${subject} Quiz`;
    }

    if (!contextText.trim()) {
      return res.status(400).json({ success: false, error: 'Provide a topic, upload notes, or select a saved note summary to generate a quiz.' });
    }

    // Call Gemini API to generate questions
    const questionsArray = await geminiService.generateQuiz(contextText);

    // Limit questions count
    const limit = numQuestions ? Math.min(Number(numQuestions), questionsArray.length) : 5;
    const slicedQuestions = questionsArray.slice(0, limit);

    // Create the Quiz session in the database
    const quiz = await Quiz.create({
      userId: req.user.id,
      title: quizTitle,
      difficulty: difficulty || 'Medium',
      questions: slicedQuestions,
      selectedAnswers: {},
      score: 0,
      completed: false
    });

    res.status(201).json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Quiz Generator Error:', error);
    res.status(500).json({ success: false, error: error.message });
  } finally {
    // Clean up temporary uploads files
    if (filePaths && filePaths.length > 0) {
      filePaths.forEach((filePath) => {
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch (err) {
            console.error('Failed to remove temp uploaded file:', err);
          }
        }
      });
    }
  }
};

/**
 * @desc    Get all summaries for the logged-in user
 * @route   GET /api/notes/history
 * @access  Private
 */
export const getUserSummaries = async (req, res) => {
  try {
    const summaries = await Summary.find({ userId: req.user.id })
      .select('title chatId createdAt updatedAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      summaries
    });
  } catch (error) {
    console.error('Get User Summaries Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get a specific summary by ID
 * @route   GET /api/notes/history/:id
 * @access  Private
 */
export const getSummaryById = async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, error: 'Summary not found' });
    }

    if (summary.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this summary' });
    }

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get Summary By ID Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete a specific summary and its linked chat
 * @route   DELETE /api/notes/history/:id
 * @access  Private
 */
export const deleteSummary = async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, error: 'Summary not found' });
    }

    if (summary.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this summary' });
    }

    // Delete linked chat
    if (summary.chatId) {
      await Chat.findByIdAndDelete(summary.chatId);
    }

    await Summary.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Summary and linked chat deleted successfully'
    });
  } catch (error) {
    console.error('Delete Summary Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Submit a quiz session's answers and score
 * @route   PUT /api/quiz/:id/submit
 * @access  Private
 */
export const submitQuizResult = async (req, res) => {
  const { selectedAnswers, score } = req.body;

  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz session not found' });
    }

    if (quiz.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to submit results for this quiz' });
    }

    quiz.selectedAnswers = selectedAnswers || {};
    quiz.score = score || 0;
    quiz.completed = true;
    await quiz.save();

    // Increment user's stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { quizzesCompleted: 1 } });

    res.status(200).json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Submit Quiz Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get quiz history for current user
 * @route   GET /api/quiz/history
 * @access  Private
 */
export const getUserQuizzes = async (req, res) => {
  try {
    const quizzes = await Quiz.find({ userId: req.user.id })
      .select('title difficulty score completed createdAt questions')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      quizzes
    });
  } catch (error) {
    console.error('Get User Quizzes Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get a single quiz by ID
 * @route   GET /api/quiz/:id
 * @access  Private
 */
export const getQuizById = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz session not found' });
    }

    if (quiz.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to view this quiz' });
    }

    res.status(200).json({
      success: true,
      quiz
    });
  } catch (error) {
    console.error('Get Quiz By ID Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete a quiz session
 * @route   DELETE /api/quiz/:id
 * @access  Private
 */
export const deleteQuiz = async (req, res) => {
  try {
    const quiz = await Quiz.findById(req.params.id);
    if (!quiz) {
      return res.status(404).json({ success: false, error: 'Quiz session not found' });
    }

    if (quiz.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this quiz' });
    }

    await Quiz.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Quiz attempt deleted successfully'
    });
  } catch (error) {
    console.error('Delete Quiz Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Generate problem-solving / scenario questions for a saved summary notes content
 * @route   POST /api/notes/history/:id/scenarios
 * @access  Private
 */
export const generateScenariosForSummary = async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, error: 'Summary document not found' });
    }

    if (summary.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to generate scenarios for this summary' });
    }

    // Call gemini service to compile structured scenarios
    const scenarios = await geminiService.generateExamScenarios(summary.content);

    summary.scenarios = scenarios;
    await summary.save();

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Generate Scenarios Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get a public summary details by ID (unauthenticated)
 * @route   GET /api/notes/public/:id
 * @access  Public
 */
export const getPublicSummaryById = async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id)
      .select('title summaryText scenarios createdAt');
    
    if (!summary) {
      return res.status(404).json({ success: false, error: 'Summary not found' });
    }

    res.status(200).json({
      success: true,
      summary
    });
  } catch (error) {
    console.error('Get Public Summary By ID Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Download public summary PDF file
 * @route   GET /api/notes/public/:id/pdf
 * @access  Public
 */
export const downloadPublicSummaryPDF = async (req, res) => {
  try {
    const summary = await Summary.findById(req.params.id);
    if (!summary) {
      return res.status(404).json({ success: false, error: 'Summary not found' });
    }

    // Safe filename conversion
    const safeTitle = summary.title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const filename = `${safeTitle || 'notes'}_summary.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Stream PDF directly to client response
    generateSummaryPDF(summary, res);
  } catch (error) {
    console.error('Download Public Summary PDF Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

