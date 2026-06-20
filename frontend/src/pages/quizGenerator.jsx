import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { aiService } from '../services/aiService';
import { useToast } from '../context/toastContext';
import QuizCard from '../components/quizCard';
import Loader from '../components/loader';
import { 
  HelpCircle, 
  Settings, 
  ArrowRight, 
  ArrowLeft, 
  CheckSquare, 
  RefreshCw,
  Trophy
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Protected Quiz Generator Page supporting custom topics, MCQs generation, active answering, and scores (theme responsive).
 */
const QuizGenerator = () => {
  const { showToast } = useToast();
  const { user, updateStats } = useAuth();

  const [subject, setSubject] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');

  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!subject.trim()) {
      showToast('Please specify a subject or topic', 'warning');
      return;
    }

    setLoading(true);
    setQuestions([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentIdx(0);
    setScore(0);

    try {
      const response = await aiService.generateQuiz({ subject, numQuestions, difficulty });
      if (response && response.questions) {
        setQuestions(response.questions);
        showToast('Quiz generated successfully! Good luck.', 'success');
      } else {
        showToast('Unexpected quiz response template', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error generating quiz questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectOption = (optionIndex) => {
    if (quizSubmitted) return;
    setSelectedAnswers((prev) => ({
      ...prev,
      [currentIdx]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(currentIdx + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(currentIdx - 1);
    }
  };

  const handleSubmitQuiz = () => {
    const answeredCount = Object.keys(selectedAnswers).length;
    if (answeredCount < questions.length) {
      if (!window.confirm("You have not answered all questions. Submit anyway?")) {
        return;
      }
    }

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (selectedAnswers[idx] === q.correctAnswer) {
        correctCount++;
      }
    });

    setScore(correctCount);
    setQuizSubmitted(true);
    showToast(`Quiz submitted! You scored ${correctCount}/${questions.length}`, 'info');

    // Increment quizzes completed stat in DB/state
    if (user && updateStats) {
      updateStats({ quizzesCompleted: (user.quizzesCompleted || 0) + 1 });
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentIdx(0);
    setScore(0);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <HelpCircle className="h-7 w-7 text-brand-600 dark:text-brand-500" />
          <span>Quiz Generator</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Challenge your conceptual memory with AI-curated assessments</p>
      </div>

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-12 text-center flex flex-col items-center justify-center min-h-[350px] border-slate-200 dark:border-dark-800"
          >
            <Loader size="md" />
            <p className="text-xs text-slate-500 mt-4 italic">Writing active questions & checking solution structures...</p>
          </motion.div>
        ) : questions.length === 0 ? (
          /* Parameter Configuration Form */
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="glass-card p-6 sm:p-8 border-slate-200 dark:border-dark-800"
          >
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Settings className="h-5 w-5 text-brand-600 dark:text-brand-400" />
              <span>Configure Quiz Specifications</span>
            </h3>

            <form onSubmit={handleGenerate} className="space-y-6">
              {/* Subject Input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Topic / Subject Matter
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g. World War II, React Hook, Cellular Respiration"
                  className="custom-input"
                  required
                />
              </div>

              {/* Grid configs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Number of Questions
                  </label>
                  <select
                    value={numQuestions}
                    onChange={(e) => setNumQuestions(Number(e.target.value))}
                    className="custom-input"
                  >
                    <option value={3}>3 Questions</option>
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Difficulty Level
                  </label>
                  <select
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="custom-input"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-primary w-full mt-4">
                <span>Generate Smart Quiz</span>
                <ArrowRight className="h-4.5 w-4.5" />
              </button>
            </form>
          </motion.div>
        ) : quizSubmitted ? (
          /* Quiz Results screen */
          <motion.div
            key="results"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="glass-card p-8 border-slate-200 dark:border-dark-800 text-center flex flex-col items-center gap-6"
          >
            <div className="h-16 w-16 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
              <Trophy className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">Quiz Evaluation Completed</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Here is a breakdown of your memory retention</p>
            </div>

            {/* Score circle banner */}
            <div className="relative h-32 w-32 flex items-center justify-center rounded-full border-4 border-slate-200 dark:border-dark-800 mt-2">
              <div className="absolute inset-0 rounded-full border-4 border-brand-600 dark:border-brand-500 border-t-transparent animate-spin-slow" />
              <div className="text-center">
                <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{score}</span>
                <span className="text-slate-400 dark:text-slate-500 text-xs block">out of {questions.length}</span>
              </div>
            </div>

            {/* Percentage */}
            <p className="text-lg font-bold text-slate-800 dark:text-white">
              Score Percentage:{' '}
              <span className="text-brand-600 dark:text-brand-400">
                {Math.round((score / questions.length) * 100)}%
              </span>
            </p>

            <div className="flex gap-4 w-full max-w-sm mt-4">
              <button
                onClick={() => setQuizSubmitted(false)}
                className="btn-secondary flex-1"
              >
                Review Solutions
              </button>
              <button
                onClick={handleReset}
                className="btn-primary flex-1"
              >
                <RefreshCw className="h-4 w-4" />
                <span>New Quiz</span>
              </button>
            </div>
          </motion.div>
        ) : (
          /* Active Quiz Answering View */
          <motion.div
            key="active-quiz"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <QuizCard
              questionNumber={currentIdx + 1}
              totalQuestions={questions.length}
              questionData={questions[currentIdx]}
              selectedOption={selectedAnswers[currentIdx]}
              onSelectOption={handleSelectOption}
              showResult={false}
            />

            <div className="flex justify-between items-center gap-4">
              <button
                disabled={currentIdx === 0}
                onClick={handlePrev}
                className="btn-secondary px-4 py-2.5 disabled:opacity-30 disabled:pointer-events-none"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Prev</span>
              </button>

              {currentIdx === questions.length - 1 ? (
                <button
                  onClick={handleSubmitQuiz}
                  className="btn-primary px-6 py-2.5"
                >
                  <CheckSquare className="h-4 w-4" />
                  <span>Submit Quiz</span>
                </button>
              ) : (
                <button
                  onClick={handleNext}
                  className="btn-secondary px-4 py-2.5"
                >
                  <span>Next</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="pt-8 border-t border-slate-200 dark:border-dark-850 flex justify-center">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-400"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Quit this quiz and configuration parameters</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Review mode toggle */}
      {quizSubmitted && questions.length > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 mt-12 pt-12 border-t border-slate-200 dark:border-dark-850"
        >
          <h3 className="text-lg font-bold text-slate-905 dark:text-white mb-4">Detailed Question Reviews</h3>
          {questions.map((q, idx) => (
            <QuizCard
              key={idx}
              questionNumber={idx + 1}
              totalQuestions={questions.length}
              questionData={q}
              selectedOption={selectedAnswers[idx]}
              onSelectOption={() => {}}
              showResult={true}
            />
          ))}
        </motion.div>
      )}

    </div>
  );
};

export default QuizGenerator;
