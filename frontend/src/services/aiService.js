import API from './api';

// Simulated responses helper to allow frontend to be fully interactive offline
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const MOCK_AI_RESPONSES = [
  "That is an excellent question! In study terms, it is best to break down this concept into three main categories. First, identify your core terms. Second, relate them to practical everyday examples. Third, practice active recall with mock quizzes.",
  "I've analyzed your notes. The most important concept here is the distinction between reactive states and declarative states in modern systems. Let me know if you would like me to generate a 5-question quiz on this topic!",
  "Great work on continuing your study streak today! Keep pushing. Let's tackle the next topic together. What are we studying now?",
  "Based on the materials uploaded, I suggest focusing on Chapter 4. It covers the foundation of all the algorithms we will be discussing in the later sections.",
];

export const aiService = {
  /**
   * Send a prompt to the AI Chat endpoint.
   * @param {string} message - User message content
   * @param {Array} history - Previous messages
   * @returns {Promise<Object>} Response containing AI message response
   */
  sendChatMessage: async (message, history = []) => {
    try {
      const response = await API.post('/ai/chat', { message, history });
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'AI Chat failed';
        throw new Error(errorMsg);
      }
      console.warn("Backend unavailable. Simulating AI chat response offline.", error);
      await sleep(1500); // Simulate network latency
      
      const randomText = MOCK_AI_RESPONSES[Math.floor(Math.random() * MOCK_AI_RESPONSES.length)];
      return {
        success: true,
        message: {
          role: 'assistant',
          content: `[DEMO MODE] Here is a simulated study buddy response to your query:\n\n"${message}"\n\n${randomText}`,
          timestamp: new Date().toISOString()
        }
      };
    }
  },

  /**
   * Create a new chat session.
   */
  createChat: async (title, notesContext = '', notesName = '') => {
    try {
      const response = await API.post('/chats', { title, notesContext, notesName });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to create chat';
      throw new Error(errorMsg);
    }
  },

  /**
   * Retrieve all chat sessions for active user.
   */
  getUserChats: async () => {
    try {
      const response = await API.get('/chats');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch chats';
      throw new Error(errorMsg);
    }
  },

  /**
   * Retrieve a specific chat session with full history.
   */
  getChatById: async (chatId) => {
    try {
      const response = await API.get(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch chat details';
      throw new Error(errorMsg);
    }
  },

  /**
   * Send a message to an existing chat session.
   */
  sendMessageInChat: async (chatId, message) => {
    try {
      const response = await API.post(`/chats/${chatId}/message`, { message });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to send message';
      throw new Error(errorMsg);
    }
  },

  /**
   * Delete a chat session.
   */
  deleteChat: async (chatId) => {
    try {
      const response = await API.delete(`/chats/${chatId}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete chat';
      throw new Error(errorMsg);
    }
  },

  /**
   * Update chat session title.
   */
  updateChatTitle: async (chatId, title) => {
    try {
      const response = await API.put(`/chats/${chatId}/title`, { title });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to rename chat';
      throw new Error(errorMsg);
    }
  },

  /**
   * Summarize notes from multiple files upload or plain text.
   * @param {Array<File>|File} files - PDF or text files
   * @param {string} textContent - Alternative text content
   * @returns {Promise<Object>} Response containing summarized text blocks
   */
  summarizeNotes: async (files, textContent = '') => {
    try {
      const formData = new FormData();
      if (files) {
        if (Array.isArray(files)) {
          files.forEach((file) => {
            formData.append('files', file);
          });
        } else {
          formData.append('files', files);
        }
      }
      if (textContent) {
        formData.append('text', textContent);
      }

      const response = await API.post('/notes/summarize', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Notes summarization failed';
        throw new Error(errorMsg);
      }
      console.warn("Backend unavailable. Simulating notes summarization offline.", error);
      await sleep(2000); // Simulate notes parsing delay

      const name = files ? (Array.isArray(files) ? files.map(f => f.name).join(', ') : files.name) : "text notes";
      return {
        success: true,
        summary: `### Summary of: ${name}

Here is a structured, AI-generated summary of your uploaded document:

#### 1. Core Objectives
- Understand the primary mechanisms of the target system.
- Establish baseline performance targets under load.
- Define boundaries for data flow across internal APIs.

#### 2. Key Takeaways
- **Efficiency**: Optimizing component tree nesting yields up to 40% render time improvement.
- **Security**: Always sanitize inputs at boundary zones.
- **Maintainability**: Clear separation of concern rules makes upgrading packages seamless.

#### 3. Recommended Actions
1. Re-factor nested arrays to map keys.
2. Setup error boundaries for async endpoints.
3. Schedule next review for early implementation testing.`,
      };
    }
  },

  /**
   * Fetch all summaries for active user.
   */
  getUserSummaries: async () => {
    try {
      const response = await API.get('/notes/history');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch summaries history';
      throw new Error(errorMsg);
    }
  },

  /**
   * Fetch a specific summary by ID.
   */
  getSummaryById: async (id) => {
    try {
      const response = await API.get(`/notes/history/${id}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch summary details';
      throw new Error(errorMsg);
    }
  },

  /**
   * Delete a summary by ID.
   */
  deleteSummary: async (id) => {
    try {
      const response = await API.delete(`/notes/history/${id}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete summary';
      throw new Error(errorMsg);
    }
  },

  /**
   * Generate exam scenarios for a specific summary ID.
   */
  generateExamScenarios: async (id) => {
    try {
      const response = await API.post(`/notes/history/${id}/scenarios`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to generate exam scenario questions';
      throw new Error(errorMsg);
    }
  },

  generateQuiz: async ({ subject, numQuestions = 5, difficulty = 'Medium', summaryId = '', text = '', files = null }) => {
    try {
      let response;
      if (files && files.length > 0) {
        const formData = new FormData();
        files.forEach((file) => {
          formData.append('files', file);
        });
        formData.append('numQuestions', numQuestions);
        formData.append('difficulty', difficulty);
        response = await API.post('/quiz/generate', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      } else {
        response = await API.post('/quiz/generate', { subject, numQuestions, difficulty, summaryId, text });
      }
      return response.data;
    } catch (error) {
      if (error.response) {
        const errorMsg = error.response.data?.error || 'Quiz generation failed';
        throw new Error(errorMsg);
      }
      console.warn("Backend unavailable. Simulating quiz generation offline.", error);
      await sleep(1800); // Simulate generation delay

      const mockQuestions = [
        {
          id: 1,
          question: `Which of the following is a primary feature of ${subject || 'Study Buddy'}?`,
          options: [
            "Manual file filing",
            "AI-Powered interactive revision assistant",
            "Basic text editor with no savings",
            "A standard local calculator"
          ],
          correctAnswer: 1,
          explanation: "Study Buddy leverages artificial intelligence to provide active recall, custom summarizes, and custom dynamic MCQ assessments."
        },
        {
          id: 2,
          question: `When studying complex materials under the '${difficulty}' setting, what is the best technique?`,
          options: [
            "Cramming everything the night before",
            "Reading the textbook cover to cover passive-aggressively",
            "Spaced repetition coupled with structured active recall",
            "Highlighting every line of the note document"
          ],
          correctAnswer: 2,
          explanation: "Spaced repetition and active recall are proven cognitive techniques to increase retention and deep conceptual mastery."
        },
        {
          id: 3,
          question: "How does the Study Buddy dashboard help coordinate learning activities?",
          options: [
            "By locking you out of social media sites",
            "Providing central access to chat assistants, quizzes, summarizers, and progress trackers",
            "Sending letters directly to your school administrator",
            "It doesn't provide any tracking interfaces"
          ],
          correctAnswer: 1,
          explanation: "The central hub provides easy shortcuts to AI Chat, Notes summarizers, Profile stats, and interactive Quizzes."
        },
        {
          id: 4,
          question: "What is the recommended size limit for notes files in standard Study Buddy operations?",
          options: [
            "Maximum 1KB",
            "Unlimited size including video formats",
            "Typically up to 10MB to optimize NLP token windows",
            "Exactly 5 pages"
          ],
          correctAnswer: 2,
          explanation: "Keeping note files within reasonable boundaries (10MB) ensures quick summarizer feedback and maintains LLM token context constraints."
        },
        {
          id: 5,
          question: "Which state management pattern is utilized for Auth token verification in this system?",
          options: [
            "Local Cookie querying every second",
            "React Context combined with localStorage JWT caching",
            "State query string parameters",
            "None, authentication is fully stateless"
          ],
          correctAnswer: 1,
          explanation: "React Context stores the in-memory active auth state, while localStorage caches the JWT for persistence across page refreshes."
        }
      ];

      // Return requested number of questions (capped at our mock length)
      const count = Math.min(numQuestions, mockQuestions.length);
      return {
        success: true,
        quiz: {
          _id: "mock-quiz-id-" + Date.now(),
          title: subject ? `${subject} Quiz` : "Mock Study Quiz",
          difficulty,
          questions: mockQuestions.slice(0, count),
          selectedAnswers: {},
          score: 0,
          completed: false
        }
      };
    }
  },

  /**
   * Submit quiz evaluation answers and score.
   */
  submitQuiz: async (quizId, selectedAnswers, score) => {
    try {
      const response = await API.put(`/quiz/${quizId}/submit`, { selectedAnswers, score });
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to submit quiz results';
      throw new Error(errorMsg);
    }
  },

  /**
   * Fetch user attempts/history quizzes list.
   */
  getUserQuizzes: async () => {
    try {
      const response = await API.get('/quiz/history');
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch quiz history';
      throw new Error(errorMsg);
    }
  },

  /**
   * Fetch a single quiz details by ID.
   */
  getQuizById: async (quizId) => {
    try {
      const response = await API.get(`/quiz/${quizId}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to fetch quiz details';
      throw new Error(errorMsg);
    }
  },

  /**
   * Delete a quiz attempt.
   */
  deleteQuiz: async (quizId) => {
    try {
      const response = await API.delete(`/quiz/${quizId}`);
      return response.data;
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to delete quiz';
      throw new Error(errorMsg);
    }
  }
};
