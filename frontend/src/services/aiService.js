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
   * Summarize notes from file upload or plain text.
   * @param {File} file - PDF or text file
   * @param {string} textContent - Alternative text content
   * @returns {Promise<Object>} Response containing summarized text blocks
   */
  summarizeNotes: async (file, textContent = '') => {
    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
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

      const name = file ? file.name : "text notes";
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
   * Generate an MCQ quiz.
   * @param {Object} params - { subject, numQuestions, difficulty }
   * @returns {Promise<Object>} Response containing array of MCQs
   */
  generateQuiz: async ({ subject, numQuestions = 5, difficulty = 'Medium' }) => {
    try {
      const response = await API.post('/quiz/generate', { subject, numQuestions, difficulty });
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
        questions: mockQuestions.slice(0, count)
      };
    }
  }
};
