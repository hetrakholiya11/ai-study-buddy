import React, { useState, useEffect, useRef } from 'react';
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
  Trophy,
  Plus,
  Trash2,
  Calendar,
  FileText,
  Upload,
  Brain,
  PanelLeftClose,
  PanelLeftOpen,
  X,
  Clock,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Protected Quiz Generator Page supporting:
 * 1. Collapsible quiz history sidebar.
 * 2. Multi-source specifications (independent topics, saved summaries, and PDF/Word/PPT file uploads).
 * 3. Persistence of quiz states, scores, and attempts in the database.
 */
const QuizGenerator = () => {
  const { showToast } = useToast();
  const { user, updateStats } = useAuth();

  // Sidebar states
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [quizHistory, setQuizHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [summaries, setSummaries] = useState([]);
  const [activeQuizId, setActiveQuizId] = useState(null);

  // Specifications configurations states
  const [sourceType, setSourceType] = useState('topic'); // 'topic', 'notes', 'file'
  const [subject, setSubject] = useState('');
  const [selectedSummaryId, setSelectedSummaryId] = useState('');
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  const [numQuestions, setNumQuestions] = useState(5);
  const [difficulty, setDifficulty] = useState('Medium');

  // Active Quiz states
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  // Load history lists
  const loadQuizHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await aiService.getUserQuizzes();
      if (res && res.success) {
        setQuizHistory(res.quizzes);
      }
    } catch (err) {
      console.error('Quiz history loading error:', err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSavedSummaries = async () => {
    try {
      const res = await aiService.getUserSummaries();
      if (res && res.success) {
        setSummaries(res.summaries);
      }
    } catch (err) {
      console.error('Notes summaries loading error:', err);
    }
  };

  useEffect(() => {
    loadQuizHistory();
    loadSavedSummaries();
  }, []);

  // Multi-format file selection handlers
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      const validFiles = [];
      const allowedExtensions = ['pdf', 'txt', 'docx', 'doc', 'pptx', 'ppt'];
      for (const file of files) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          showToast(`Skipped "${file.name}": Only PDF, Word, PowerPoint, and TXT files are supported`, 'warning');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          showToast(`Skipped "${file.name}": Must be under 10MB`, 'warning');
          continue;
        }
        validFiles.push(file);
      }
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const validFiles = [];
      const allowedExtensions = ['pdf', 'txt', 'docx', 'doc', 'pptx', 'ppt'];
      for (const file of files) {
        const fileExtension = file.name.split('.').pop().toLowerCase();
        if (!allowedExtensions.includes(fileExtension)) {
          showToast(`Skipped "${file.name}": Only PDF, Word, PowerPoint, and TXT files are supported`, 'warning');
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          showToast(`Skipped "${file.name}": Must be under 10MB`, 'warning');
          continue;
        }
        validFiles.push(file);
      }
      if (validFiles.length > 0) {
        setSelectedFiles((prev) => [...prev, ...validFiles]);
      }
    }
  };

  const handleClearFiles = () => {
    setSelectedFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Generate new persistent quiz session
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (sourceType === 'topic' && !subject.trim()) {
      showToast('Please specify a subject or topic', 'warning');
      return;
    }
    if (sourceType === 'notes' && !selectedSummaryId) {
      showToast('Please select a saved notes summary', 'warning');
      return;
    }
    if (sourceType === 'file' && selectedFiles.length === 0) {
      showToast('Please upload at least one study document', 'warning');
      return;
    }

    setLoading(true);
    setQuestions([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentIdx(0);
    setScore(0);
    setActiveQuizId(null);
    if (window.innerWidth <= 768) setSidebarOpen(false);

    try {
      const params = {
        numQuestions,
        difficulty,
      };

      if (sourceType === 'topic') {
        params.subject = subject;
      } else if (sourceType === 'notes') {
        params.summaryId = selectedSummaryId;
      } else if (sourceType === 'file') {
        params.files = selectedFiles;
      }

      const response = await aiService.generateQuiz(params);
      if (response && response.success && response.quiz) {
        const newQuiz = response.quiz;
        setActiveQuizId(newQuiz._id);
        setQuestions(newQuiz.questions);
        showToast('Quiz generated successfully! Good luck.', 'success');
        
        // Refresh sidebar history list
        loadQuizHistory();
      } else {
        showToast('Unexpected quiz response format', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error generating quiz', 'error');
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

  // Submit active quiz answers
  const handleSubmitQuiz = async () => {
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

    try {
      setScore(correctCount);
      setQuizSubmitted(true);

      if (activeQuizId) {
        await aiService.submitQuiz(activeQuizId, selectedAnswers, correctCount);
        showToast(`Quiz completed! You scored ${correctCount}/${questions.length}`, 'success');
        
        // Update history sidebar
        loadQuizHistory();

        // Increment stats count
        if (user && updateStats) {
          updateStats({ quizzesCompleted: (user.quizzesCompleted || 0) + 1 });
        }
      }
    } catch (err) {
      showToast(err.message || 'Error submitting quiz results', 'error');
    }
  };

  const handleReset = () => {
    setQuestions([]);
    setSelectedAnswers({});
    setQuizSubmitted(false);
    setCurrentIdx(0);
    setScore(0);
    setActiveQuizId(null);
    setSubject('');
    setSelectedSummaryId('');
    setSelectedFiles([]);
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  // Load selected past quiz session
  const handleLoadQuiz = async (quiz) => {
    setLoading(true);
    try {
      const res = await aiService.getQuizById(quiz._id);
      if (res && res.success && res.quiz) {
        const loaded = res.quiz;
        setActiveQuizId(loaded._id);
        setQuestions(loaded.questions || []);
        setSelectedAnswers(loaded.selectedAnswers || {});
        setQuizSubmitted(loaded.completed);
        setScore(loaded.score);
        setCurrentIdx(0);
      }
    } catch (err) {
      showToast('Failed to load past quiz attempt', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this quiz attempt?')) return;
    try {
      await aiService.deleteQuiz(id);
      showToast('Quiz attempt deleted successfully', 'info');
      loadQuizHistory();
      if (activeQuizId === id) {
        handleReset();
      }
    } catch (err) {
      showToast(err.message || 'Failed to delete quiz', 'error');
    }
  };

  const renderHistoryList = () => {
    if (historyLoading) {
      return (
        <div className="h-20 flex items-center justify-center">
          <Loader size="sm" />
        </div>
      );
    }

    if (quizHistory.length === 0) {
      return (
        <div className="text-center py-8 px-4 text-xs text-slate-450 dark:text-slate-500 border border-dashed border-slate-200 dark:border-dark-800 rounded-xl bg-slate-50/50 dark:bg-dark-950/20">
          <Brain className="h-7 w-7 mx-auto opacity-20 text-brand-500 mb-1" />
          <p>No quiz attempts found</p>
          <p className="text-[10px] text-slate-500 mt-0.5">Generate one to test memory</p>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {quizHistory.map((quiz) => {
          const isActive = activeQuizId === quiz._id;
          return (
            <div
              key={quiz._id}
              onClick={() => {
                handleLoadQuiz(quiz);
              }}
              className={`group relative p-3 rounded-xl border text-left cursor-pointer transition select-none ${
                isActive
                  ? 'border-brand-550/70 bg-brand-500/5 dark:bg-brand-500/10 shadow-sm'
                  : 'border-slate-200 dark:border-dark-800/80 bg-white dark:bg-dark-900/60 hover:border-slate-300 dark:hover:border-dark-700/85 hover:bg-slate-50 dark:hover:bg-dark-850/60'
              }`}
            >
              <div className="pr-6">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">{quiz.title}</p>
                
                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                    quiz.difficulty === 'Easy' 
                      ? 'bg-emerald-100 text-emerald-750 dark:bg-emerald-950/40 dark:text-emerald-400' 
                      : quiz.difficulty === 'Hard'
                        ? 'bg-rose-100 text-rose-750 dark:bg-rose-955/20 dark:text-rose-455'
                        : 'bg-amber-100 text-amber-750 dark:bg-amber-955/20 dark:text-amber-400'
                  }`}>
                    {quiz.difficulty}
                  </span>

                  {quiz.completed ? (
                    <span className="text-[10px] font-semibold text-slate-550 dark:text-slate-400">
                      Score: <span className="font-bold text-brand-600 dark:text-brand-400">{quiz.score}/{quiz.questions?.length || 5}</span>
                    </span>
                  ) : (
                    <span className="text-[9px] font-medium text-slate-455 italic flex items-center gap-1">
                      <Clock className="h-3 w-3 text-amber-500 animate-pulse" />
                      <span>In progress</span>
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={(e) => handleDeleteQuiz(quiz._id, e)}
                aria-label="Delete quiz attempt"
                className="absolute right-2 top-2 p-1.5 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 text-slate-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition"
                title="Delete Attempt"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-100px)] -m-4 md:-m-6 md:overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 shadow-sm relative">
      
      {/* Mobile Sidebar Backdrop overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed top-14 bottom-0 left-0 right-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        />
      )}

      {/* 1. History Sidebar (Collapsible) */}
      <div
        className={`h-full border-r border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-950 flex flex-col flex-shrink-0 transition-transform duration-300 fixed md:relative z-50 w-[290px] top-14 md:top-0 bottom-0 left-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0 overflow-hidden'
        }`}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-slate-200 dark:border-dark-800 flex items-center justify-between flex-shrink-0 bg-white dark:bg-dark-900">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-brand-650 dark:text-brand-400" />
            <span className="text-sm font-bold text-slate-800 dark:text-white">Quiz History</span>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            aria-label="Collapse quiz history sidebar"
            className="p-1 rounded hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-350 transition"
            title="Collapse Sidebar"
          >
            <PanelLeftClose className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Sidebar Action Button */}
        <div className="p-3 border-b border-slate-200 dark:border-dark-800 flex-shrink-0">
          <button
            onClick={handleReset}
            className="w-full py-2 px-3 border border-dashed border-brand-500/50 dark:border-brand-555/40 text-brand-600 dark:text-brand-400 text-xs font-semibold rounded-xl hover:bg-brand-500/5 dark:hover:bg-brand-500/10 flex items-center justify-center gap-1.5 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Generate New Quiz</span>
          </button>
        </div>

        {/* History Attempts List */}
        <div className="flex-1 overflow-y-auto p-3">
          {renderHistoryList()}
        </div>
      </div>

      {/* Toggle button to open sidebar when collapsed */}
      {!sidebarOpen && (
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Open quiz history sidebar"
          className="absolute left-4 top-4 z-30 p-2 rounded-xl bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-350 shadow-md transition"
          title="Open History"
        >
          <PanelLeftOpen className="h-5 w-5" />
        </button>
      )}

      {/* 2. Main content area */}
      <div className="flex-1 h-full overflow-y-auto p-6 md:p-10 relative z-10">
        <div className="w-full max-w-2xl mx-auto space-y-6">

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
              
              /* 3. Parameter Configuration Form */
              <motion.div
                key="config"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="glass-card p-6 sm:p-8 border-slate-200 dark:border-dark-800 space-y-6 text-left shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
                    <Brain className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Quiz Generator Specs</h3>
                    <p className="text-xs text-slate-500 mt-0.5">Define constraints and test your knowledge level.</p>
                  </div>
                </div>

                {/* Source Selection Tabs */}
                <div className="flex bg-slate-100 dark:bg-dark-950 p-1 rounded-xl gap-1">
                  <button
                    type="button"
                    onClick={() => setSourceType('topic')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      sourceType === 'topic'
                        ? 'bg-white dark:bg-dark-900 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
                    }`}
                  >
                    Independent Topic
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('notes')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      sourceType === 'notes'
                        ? 'bg-white dark:bg-dark-900 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
                    }`}
                  >
                    Saved Notes
                  </button>
                  <button
                    type="button"
                    onClick={() => setSourceType('file')}
                    className={`flex-1 py-2 text-xs font-semibold rounded-lg transition ${
                      sourceType === 'file'
                        ? 'bg-white dark:bg-dark-900 text-slate-800 dark:text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-355'
                    }`}
                  >
                    Upload Files
                  </button>
                </div>

                <form onSubmit={handleGenerate} className="space-y-6">
                  
                  {/* Dynamic inputs based on Source Type */}
                  {sourceType === 'topic' && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="quiz-subject" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Topic / Subject Matter
                      </label>
                      <input
                        type="text"
                        id="quiz-subject"
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="e.g. World War II, React Hooks, Cellular Respiration"
                        className="custom-input"
                        required
                      />
                    </div>
                  )}

                  {sourceType === 'notes' && (
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="summary-select" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Select Saved Notes Document
                      </label>
                      {summaries.length === 0 ? (
                        <div className="p-3 text-xs text-slate-500 bg-slate-50 dark:bg-dark-950/40 rounded-xl border border-slate-200 dark:border-dark-800 italic">
                          No saved note summaries found. Go to Summarizer to upload files first, or choose another source.
                        </div>
                      ) : (
                        <select
                          id="summary-select"
                          value={selectedSummaryId}
                          onChange={(e) => setSelectedSummaryId(e.target.value)}
                          className="custom-input cursor-pointer"
                          required
                        >
                          <option value="">-- Choose one of your summarized files --</option>
                          {summaries.map((sum) => (
                            <option key={sum._id} value={sum._id}>
                              {sum.title} ({new Date(sum.createdAt).toLocaleDateString()})
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}

                  {sourceType === 'file' && (
                    <div className="space-y-3">
                      <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                        Upload Notes for Quiz
                      </label>
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                          dragOver 
                            ? 'border-brand-500 bg-brand-500/5' 
                            : selectedFiles.length > 0 
                              ? 'border-emerald-600 bg-emerald-955/5' 
                              : 'border-slate-200 dark:border-dark-800 bg-slate-50/50 dark:bg-dark-900/30 hover:border-slate-300 dark:hover:border-dark-700'
                        }`}
                      >
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept=".pdf,.txt,.docx,.doc,.pptx,.ppt"
                          multiple
                          className="hidden"
                        />
                        
                        <div className="flex flex-col items-center gap-2">
                          {selectedFiles.length > 0 ? (
                            <div className="w-full text-left space-y-1.5 max-h-32 overflow-y-auto scroll-smooth" onClick={(e) => e.stopPropagation()}>
                              {selectedFiles.map((file, idx) => (
                                <div key={idx} className="flex justify-between items-center bg-slate-100 dark:bg-dark-850 p-2 rounded-xl border border-slate-200/50 dark:border-dark-800 text-xs">
                                  <div className="flex items-center gap-2 overflow-hidden flex-1 select-none">
                                    <FileText className="h-4 w-4 text-brand-500 flex-shrink-0" />
                                    <span className="font-semibold text-slate-800 dark:text-white truncate">{file.name}</span>
                                  </div>
                                  <div className="flex items-center gap-2 flex-shrink-0">
                                    <span className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                                      }}
                                      className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-955/20 text-slate-450 hover:text-rose-600 transition"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <>
                              <Upload className="h-6 w-6 text-slate-400 mb-1" />
                              <p className="text-xs font-semibold text-slate-800 dark:text-white">Click or drag files here</p>
                              <p className="text-[10px] text-slate-500">Supports PDF, Word, PPT or TXT (Max 10MB each)</p>
                            </>
                          )}
                        </div>
                      </div>

                      {selectedFiles.length > 0 && (
                        <div className="text-right">
                          <button
                            type="button"
                            onClick={handleClearFiles}
                            className="text-xs text-slate-450 hover:text-rose-600 font-semibold"
                          >
                            Clear selected files
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Grid configs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="num-questions" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Number of Questions
                      </label>
                      <select
                        id="num-questions"
                        value={numQuestions}
                        onChange={(e) => setNumQuestions(Number(e.target.value))}
                        className="custom-input cursor-pointer"
                      >
                        <option value={3}>3 Questions</option>
                        <option value={5}>5 Questions</option>
                        <option value={10}>10 Questions</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label htmlFor="difficulty-level" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Difficulty Level
                      </label>
                      <select
                        id="difficulty-level"
                        value={difficulty}
                        onChange={(e) => setDifficulty(e.target.value)}
                        className="custom-input cursor-pointer"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Medium">Medium</option>
                        <option value="Hard">Hard</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={
                      (sourceType === 'topic' && !subject.trim()) ||
                      (sourceType === 'notes' && !selectedSummaryId) ||
                      (sourceType === 'file' && selectedFiles.length === 0)
                    }
                    className="btn-primary w-full mt-4 disabled:opacity-50 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Generate Quiz</span>
                  </button>
                </form>

              </motion.div>
            ) : quizSubmitted ? (
              
              /* 4. Quiz Results Screen */
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="glass-card p-8 border-slate-200 dark:border-dark-800 text-center flex flex-col items-center gap-6 shadow-md"
              >
                <div className="h-14 w-14 rounded-full bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-600 dark:text-brand-400">
                  <Trophy className="h-7 w-7 text-brand-650 dark:text-brand-400 animate-bounce" />
                </div>

                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white">Quiz Completed!</h2>
                  <p className="text-slate-550 dark:text-slate-400 text-xs mt-1">Here is a breakdown of your evaluation score</p>
                </div>

                {/* Score circle banner */}
                <div className="relative h-28 w-28 flex items-center justify-center rounded-full border-4 border-slate-100 dark:border-dark-800/80 mt-2">
                  <div className="absolute inset-0 rounded-full border-4 border-brand-600 dark:border-brand-500 border-t-transparent animate-spin-slow" />
                  <div className="text-center">
                    <span className="text-3xl font-extrabold text-slate-900 dark:text-white">{score}</span>
                    <span className="text-slate-455 dark:text-slate-500 text-[10px] block font-semibold">out of {questions.length}</span>
                  </div>
                </div>

                {/* Percentage */}
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Score Percentage:{' '}
                  <span className="text-brand-600 dark:text-brand-455 font-extrabold">
                    {Math.round((score / questions.length) * 100)}%
                  </span>
                </p>

                <div className="flex gap-4 w-full max-w-sm mt-4">
                  <button
                    onClick={() => setQuizSubmitted(false)}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Review Solutions
                  </button>
                  <button
                    onClick={handleReset}
                    className="btn-primary flex-1 text-xs"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>New Quiz</span>
                  </button>
                </div>
              </motion.div>
            ) : (
              
              /* 5. Active Quiz Answering View */
              <motion.div
                key="active-quiz"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6 text-left w-full"
              >
                <div className="flex justify-between items-center bg-slate-50 dark:bg-dark-950/40 p-3 rounded-xl border border-slate-200 dark:border-dark-800">
                  <span className="text-xs font-semibold text-slate-550 dark:text-slate-400">
                    Answering Mode
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    {difficulty} Level
                  </span>
                </div>

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
                    className="btn-secondary px-4 py-2.5 disabled:opacity-30 disabled:pointer-events-none text-xs"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    <span>Prev</span>
                  </button>

                  {currentIdx === questions.length - 1 ? (
                    <button
                      onClick={handleSubmitQuiz}
                      className="btn-primary px-6 py-2.5 text-xs font-bold"
                    >
                      <CheckSquare className="h-4 w-4" />
                      <span>Submit Evaluation</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleNext}
                      className="btn-secondary px-4 py-2.5 text-xs"
                    >
                      <span>Next</span>
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="pt-8 border-t border-slate-200 dark:border-dark-850 flex justify-center">
                  <button
                    onClick={handleReset}
                    className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-550 hover:text-rose-650 transition"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>Quit quiz and discard specs</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 6. Review Mode (Renders below Results once submitted) */}
          {quizSubmitted && questions.length > 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6 mt-12 pt-12 border-t border-slate-200 dark:border-dark-850 text-left"
            >
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-250 mb-4 uppercase tracking-wider flex items-center gap-2">
                <BookOpen className="h-4.5 w-4.5 text-brand-505" />
                <span>Detailed Question Reviews</span>
              </h3>
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
      </div>

    </div>
  );
};

export default QuizGenerator;
