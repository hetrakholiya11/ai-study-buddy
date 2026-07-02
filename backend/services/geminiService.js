import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Service integrating Google Gemini Generative AI endpoints.
 */
class GeminiService {
  constructor() {
    // Lazy initialisation to prevent bootstrap errors when key is not loaded yet
    this.genAI = null;
  }

  init() {
    if (!this.genAI) {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey || apiKey === 'YOUR_ACTUAL_GEMINI_API_KEY') {
        throw new Error('Missing GEMINI_API_KEY configuration value in environmental parameters.');
      }
      this.genAI = new GoogleGenerativeAI(apiKey);
    }
  }

  /**
   * Run chat message request using Flash-1.5 model.
   * @param {string} message - User query message
   * @param {Array} history - Previous messages: [{ role: 'user'|'assistant', content: string }]
   * @returns {Promise<string>} AI assistant response text
   */
  async chat(message, history = [], notesContext = '') {
    this.init();
    
    let systemInstruction = 'You are an AI Study Buddy, an interactive, encouraging, and intelligent tutor. Answer academic questions, write code blocks, clarify equations, and explain complex concepts in simple terms.';
    
    if (notesContext) {
      systemInstruction += `\n\nAdditional Context: You have access to the user's uploaded study notes. Use the following notes text to answer the user's questions, explain terms, or provide examples if they refer to the material. If they ask general academic questions outside the notes, feel free to answer them directly as well.\n\nStudy Notes:\n${notesContext}`;
    }

    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      systemInstruction: systemInstruction
    });

    // Translate client history formatting to Gemini-compatible parts array
    // Filter history so it starts with 'user' to comply with Gemini's constraints
    const firstUserIdx = history.findIndex(msg => msg.role === 'user');
    const validHistory = firstUserIdx !== -1 ? history.slice(firstUserIdx) : [];

    // Translate client history formatting to Gemini-compatible parts array
    const formattedHistory = validHistory.map((msg) => {
      // Gemini expects role to be either 'user' or 'model'
      const role = msg.role === 'user' ? 'user' : 'model';
      return {
        role: role,
        parts: [{ text: msg.content }],
      };
    });

    const chatSession = model.startChat({
      history: formattedHistory,
    });

    const result = await chatSession.sendMessage(message);
    return result.response.text();
  }

  /**
   * Summarizes notes extracted text context.
   * @param {string} notesText - Raw text from document
   * @returns {Promise<string>} Structured Markdown summary
   */
  async summarize(notesText) {
    this.init();
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const prompt = `
      You are an expert educational summarizer. Analyze the study notes text provided below and generate a detailed, structured study summary in Markdown format.

      Structure the output with the following headings:
      ### Summary of the Material
      Provide a concise 2-3 sentence overview of the contents.
      
      #### Core Objectives
      - Outline what topics are introduced or explored.
      - What skills/competencies are target metrics.

      #### Key Takeaways
      - Bold key vocabulary terms and define them.
      - Summarize key points, algorithms, or historical facts.

      #### Recommended Action Items
      - Bullet points indicating next review areas.
      - Steps to consolidate this material.

      Study Notes Content:
      ${notesText}
    `;

    const result = await model.generateContent(prompt);
    return result.response.text();
  }

  /**
   * Generates a 5-question MCQ quiz from provided text.
   * Uses Gemini's structured JSON output mode to guarantee parsing correctness.
   * @param {string} notesText - Study notes context
   * @returns {Promise<Array>} Array of MCQ objects
   */
  async generateQuiz(notesText) {
    this.init();
    
    // We request structured JSON array output
    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `
      Analyze the text provided below and generate exactly 5 multiple choice questions (MCQ) based on it.
      
      The response must be a single, valid JSON object conforming exactly to this schema:
      {
        "questions": [
          {
            "id": 1,
            "question": "What is the question text?",
            "options": [
              "Option A text",
              "Option B text",
              "Option C text",
              "Option D text"
            ],
            "correctAnswer": 1, // Integer index (0-3) representing the correct choice
            "explanation": "Why this choice is correct."
          }
        ]
      }

      Do not include any wrapper text, markdown blocks, or other elements. Return only the JSON object.
      
      Material:
      ${notesText}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    try {
      const parsed = JSON.parse(rawText);
      return parsed.questions || [];
    } catch (error) {
      console.error('Gemini Quiz JSON Parse Failure. Raw response was:', rawText);
      throw new Error('Failed to parse AI generated quiz payload.');
    }
  }

  /**
   * Generates a list of problem-solving/scenario exam questions from notes.
   * Uses Gemini's structured JSON output mode.
   * @param {string} notesText - Study notes context
   * @returns {Promise<Array>} Array of scenario question objects
   */
  async generateExamScenarios(notesText) {
    this.init();
    
    const model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        responseMimeType: 'application/json',
      }
    });

    const prompt = `
      You are an expert exam designer. Based on the study materials provided below, write exactly 4 high-probability, conceptual, problem-solving and scenario-based questions that are very likely to be asked in university or certification exams. For each question, provide a detailed, step-by-step solution/explanation.
      
      The response must be a single, valid JSON object conforming exactly to this schema:
      {
        "scenarios": [
          {
            "id": 1,
            "scenario": "A real-world or theoretical scenario/context description...",
            "question": "What is the specific problem or exam question to be solved?",
            "answer": "The core correct answer/formula/concept...",
            "explanation": "Detailed step-by-step solution, calculation, or justification."
          }
        ]
      }

      Do not include any wrapper text, markdown blocks, or other elements. Return only the JSON object.
      
      Material:
      ${notesText}
    `;

    const result = await model.generateContent(prompt);
    const rawText = result.response.text();
    
    try {
      const parsed = JSON.parse(rawText);
      return parsed.scenarios || [];
    } catch (error) {
      console.error('Gemini Scenarios JSON Parse Failure. Raw response was:', rawText);
      throw new Error('Failed to parse AI generated scenarios payload.');
    }
  }
}

export default new GeminiService();
