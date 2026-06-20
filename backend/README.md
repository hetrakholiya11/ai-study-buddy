# Study Buddy AI Backend API Documentation

Express.js server backend for the **AI-Powered Study Buddy** web application. Integrates MongoDB via Mongoose, JWT Authentication, Multer file upload filters, PDF text parsing (`pdf-parse`), and Google Gemini AI via the official SDK.

---

## Getting Started

### Prerequisites
- Node.js (v18+ or v20+)
- MongoDB running locally (default: `mongodb://localhost:27017/studybuddy`) or a MongoDB Atlas connection string.
- A **Google Gemini API Key** (from Google AI Studio).

### Installation & Execution
1. Open terminal inside the `backend` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the template:
   ```bash
   cp .env.example .env
   ```
4. Update the values in `.env` (add your `GEMINI_API_KEY`, `MONGO_URI`, and custom `JWT_SECRET`).
5. Run the server in developer mode with automatic reload:
   ```bash
   npm run dev
   ```
6. The server will start on `http://localhost:5000`.

---

## API Reference & Examples

### 1. Authentication Routes

#### Register User
- **Route**: `POST /api/auth/register`
- **Access**: Public
- **Request Headers**: `Content-Type: application/json`
- **Request JSON Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@university.edu",
    "password": "securepassword123"
  }
  ```
- **Response JSON (201 Created)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "647f259f9c0e4823a0728fe4",
      "name": "Alex Mercer",
      "email": "alex@university.edu",
      "studyGoals": "Prepare for upcoming syllabus items",
      "joinedDate": "6/20/2026"
    }
  }
  ```

#### Login User
- **Route**: `POST /api/auth/login`
- **Access**: Public
- **Request Headers**: `Content-Type: application/json`
- **Request JSON Body**:
  ```json
  {
    "email": "alex@university.edu",
    "password": "securepassword123"
  }
  ```
- **Response JSON (200 OK)**:
  ```json
  {
    "success": true,
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "647f259f9c0e4823a0728fe4",
      "name": "Alex Mercer",
      "email": "alex@university.edu",
      "studyGoals": "Prepare for upcoming syllabus items",
      "joinedDate": "6/20/2026"
    }
  }
  ```

---

### 2. AI & Study Assistant Routes
*All routes below require the HTTP Header: `Authorization: Bearer <your_jwt_token>`*

#### Interactive AI Chat
- **Route**: `POST /api/ai/chat`
- **Access**: Private
- **Request JSON Body**:
  ```json
  {
    "message": "Explain machine learning in one sentence",
    "history": [
      { "role": "user", "content": "Hi Study Buddy!" },
      { "role": "assistant", "content": "Hello! What shall we study today?" }
    ]
  }
  ```
- **Response JSON (200 OK)**:
  ```json
  {
    "success": true,
    "message": {
      "role": "assistant",
      "content": "Machine Learning is a subset of artificial intelligence where algorithms learn patterns from data to make predictions without being explicitly programmed.",
      "timestamp": "2026-06-20T08:32:00.000Z"
    }
  }
  ```

#### Notes Summarizer
- **Route**: `POST /api/notes/summarize`
- **Access**: Private
- **Request Headers**: `Content-Type: multipart/form-data`
- **Request Body (FormData)**:
  - `file`: (PDF binary file upload, maximum 10MB)
- **Response JSON (200 OK)**:
  ```json
  {
    "success": true,
    "summary": "### Summary of the Material\nThis lecture covers the fundamentals of object-oriented programming.\n\n#### Core Objectives\n- Understand classes and objects.\n- Differentiate between inheritance and polymorphism.\n\n#### Key Takeaways\n- **Encapsulation**: Bundling data and methods into a single unit.\n- **Polymorphism**: The ability of a message to be displayed in more than one form."
  }
  ```

#### Quiz Generator
- **Route**: `POST /api/quiz/generate`
- **Access**: Private
- **Request JSON Body**:
  ```json
  {
    "text": "Photosynthesis is the process used by plants and other organisms to convert light energy into chemical energy that, through cellular respiration, can later be released to fuel the organism's activities."
  }
  ```
  *OR parameter configuration from frontend:*
  ```json
  {
    "subject": "Biology - Photosynthesis",
    "numQuestions": 3,
    "difficulty": "Medium"
  }
  ```
- **Response JSON (200 OK)**:
  ```json
  {
    "success": true,
    "questions": [
      {
        "id": 1,
        "question": "What energy conversion occurs during photosynthesis?",
        "options": [
          "Chemical energy to electrical energy",
          "Light energy to chemical energy",
          "Heat energy to mechanical energy",
          "Sound energy to electrical energy"
        ],
        "correctAnswer": 1,
        "explanation": "Photosynthesis converts light energy from the sun into chemical energy stored in molecular bonds."
      }
    ]
  }
  ```
