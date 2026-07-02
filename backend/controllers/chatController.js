import Chat from '../models/Chat.js';
import geminiService from '../services/geminiService.js';

/**
 * @desc    Create a new chat session
 * @route   POST /api/chats
 * @access  Private
 */
export const createChat = async (req, res) => {
  const { title, notesContext, notesName } = req.body;

  try {
    const chat = await Chat.create({
      userId: req.user.id,
      title: title || 'New Chat',
      notesContext: notesContext || '',
      notesName: notesName || '',
      messages: [
        {
          role: 'assistant',
          content: notesContext 
            ? `I have loaded your notes: "${notesName || 'Uploaded Document'}". Ask me anything about them, or ask me to explain a concept or generate examples!`
            : "Hello! I am your AI Study Buddy. Ask me any question, paste a paragraph you're trying to understand, or ask me to explain a concept in simple terms. Let's study!",
          timestamp: new Date().toISOString()
        }
      ]
    });

    res.status(201).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Create Chat Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get all chat sessions for the logged-in user (without complete message payloads)
 * @route   GET /api/chats
 * @access  Private
 */
export const getUserChats = async (req, res) => {
  try {
    const chats = await Chat.find({ userId: req.user.id })
      .select('title notesName updatedAt createdAt')
      .sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      chats
    });
  } catch (error) {
    console.error('Get User Chats Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Get a specific chat session with its full message history
 * @route   GET /api/chats/:id
 * @access  Private
 */
export const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat session not found' });
    }

    // Verify ownership
    if (chat.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to access this chat' });
    }

    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Get Chat By ID Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Send a message in an existing chat session and get AI response
 * @route   POST /api/chats/:id/message
 * @access  Private
 */
export const sendMessageInChat = async (req, res) => {
  const { message } = req.body;

  try {
    if (!message) {
      return res.status(400).json({ success: false, error: 'Please enter a message' });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat session not found' });
    }

    // Verify ownership
    if (chat.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to send messages in this chat' });
    }

    // Save user message to database
    const userMsg = {
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    chat.messages.push(userMsg);

    // Call Gemini Service with history and context
    // We pass history before adding user's new message to preserve exact history alignment
    const previousHistory = chat.messages.slice(0, -1).map(m => ({
      role: m.role,
      content: m.content
    }));

    const reply = await geminiService.chat(message, previousHistory, chat.notesContext);

    // Save assistant reply to database
    const assistantMsg = {
      role: 'assistant',
      content: reply,
      timestamp: new Date()
    };
    chat.messages.push(assistantMsg);

    // Auto-update title if it's default
    if (chat.title === 'New Chat') {
      chat.title = message.slice(0, 30) + (message.length > 30 ? '...' : '');
    }

    await chat.save();

    res.status(200).json({
      success: true,
      chatMessage: assistantMsg,
      chatTitle: chat.title // Return in case it updated
    });
  } catch (error) {
    console.error('Send Message In Chat Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Delete a specific chat session
 * @route   DELETE /api/chats/:id
 * @access  Private
 */
export const deleteChat = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat session not found' });
    }

    // Verify ownership
    if (chat.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to delete this chat' });
    }

    await Chat.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Chat session deleted successfully'
    });
  } catch (error) {
    console.error('Delete Chat Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * @desc    Update a chat session title
 * @route   PUT /api/chats/:id/title
 * @access  Private
 */
export const updateChatTitle = async (req, res) => {
  const { title } = req.body;

  try {
    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Please provide a valid chat title' });
    }

    const chat = await Chat.findById(req.params.id);

    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat session not found' });
    }

    // Verify ownership
    if (chat.userId.toString() !== req.user.id) {
      return res.status(401).json({ success: false, error: 'Not authorized to modify this chat' });
    }

    chat.title = title.trim();
    await chat.save();

    res.status(200).json({
      success: true,
      chat
    });
  } catch (error) {
    console.error('Update Chat Title Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};
