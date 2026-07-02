import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { useToast } from '../context/toastContext';
import ChatMessage from '../components/chatMessage';
import Loader from '../components/loader';
import { 
  FileText, 
  Upload, 
  Copy, 
  Check, 
  RefreshCw, 
  AlertCircle, 
  MessageSquareCode, 
  Plus, 
  Trash2, 
  Send, 
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
  ArrowLeft,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const parseInlineFormatting = (text) => {
  if (!text || typeof text !== 'string') return '';
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part && typeof part === 'string' && part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part && typeof part === 'string' && part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={index} className="bg-slate-200/60 dark:bg-dark-950 px-1.5 py-0.5 rounded text-xs font-mono text-rose-600 dark:text-rose-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

const parseMarkdownLine = (line) => {
  if (!line || typeof line !== 'string') return null;
  // 1. Headers
  const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    const text = headerMatch[2];
    const parsedText = parseInlineFormatting(text);
    if (level === 1) return <h1 className="text-xl font-extrabold my-2 text-slate-900 dark:text-white">{parsedText}</h1>;
    if (level === 2) return <h2 className="text-lg font-bold my-2 text-slate-900 dark:text-white">{parsedText}</h2>;
    if (level === 3) return <h3 className="text-base font-bold pt-2 mb-1 text-slate-900 dark:text-white">{parsedText}</h3>;
    return <h4 className="text-sm font-semibold text-brand-650 dark:text-brand-400 pt-1 mb-1">{parsedText}</h4>;
  }

  // 2. Bullets
  const bulletMatch = line.match(/^(\*|-)\s+(.*)$/);
  if (bulletMatch) {
    const text = bulletMatch[2];
    return (
      <li className="list-disc list-inside ml-2 mb-1 text-slate-800 dark:text-slate-200">
        {parseInlineFormatting(text)}
      </li>
    );
  }

  // 3. Numbered lists
  const listMatch = line.match(/^(\d+)\.\s+(.*)$/);
  if (listMatch) {
    const num = listMatch[1];
    const text = listMatch[2];
    return (
      <div className="flex items-start gap-1 ml-2 mb-1 text-slate-800 dark:text-slate-200">
        <span className="font-bold text-slate-900 dark:text-white">{num}.</span>
        <span>{parseInlineFormatting(text)}</span>
      </div>
    );
  }

  // Default paragraph line
  if (line.trim() === '') return <div className="h-2" />;
  return <p className="mb-1 last:mb-0">{parseInlineFormatting(line)}</p>;
};

/**
 * Revamped Notes Summarizer Page supporting persistent note summaries and
 * side-by-side summary Q&A chat capabilities.
 */
const NotesSummarizer = () => {
  const { showToast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  // Summaries History state
  const [summaries, setSummaries] = useState([]);
  const [activeSummary, setActiveSummary] = useState(null);
  const [activeSummaryId, setActiveSummaryId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [mobileView, setMobileView] = useState('summary'); // 'summary' or 'chat'
  
  // File Upload states
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [textContent, setTextContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // 'summary' or 'scenarios'
  const [generatingScenarios, setGeneratingScenarios] = useState(false);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  // Notes Chat states
  const [notesChat, setNotesChat] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [chatSending, setChatSending] = useState(false);

  // Fetch summaries list
  const loadUserSummaries = async () => {
    setHistoryLoading(true);
    try {
      const res = await aiService.getUserSummaries();
      if (res && res.success) {
        setSummaries(res.summaries || []);
      }
    } catch (error) {
      showToast(error.message || 'Failed to load summaries history', 'error');
    } finally {
      setHistoryLoading(false);
    }
  };

  // Fetch specific summary and its chat log
  const loadSummaryDetails = async (summaryId) => {
    setLoading(true);
    try {
      const res = await aiService.getSummaryById(summaryId);
      if (res && res.success && res.summary) {
        setActiveSummary(res.summary);
        setActiveSummaryId(summaryId);
        
        // Fetch corresponding chat log
        if (res.summary.chatId) {
          loadChatDetails(res.summary.chatId);
        } else {
          setNotesChat(null);
        }
      }
    } catch (error) {
      showToast(error.message || 'Error loading summary details', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Fetch linked chat messages
  const loadChatDetails = async (chatId) => {
    setChatLoading(true);
    try {
      const res = await aiService.getChatById(chatId);
      if (res && res.success) {
        setNotesChat(res.chat);
      }
    } catch (error) {
      showToast('Could not load discussion chat history', 'warning');
    } finally {
      setChatLoading(false);
    }
  };

  useEffect(() => {
    loadUserSummaries();
  }, []);

  // Scroll chat window to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [notesChat?.messages, chatSending]);

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
        setTextContent('');
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
        setTextContent('');
      }
    }
  };

  const handleClear = () => {
    setSelectedFiles([]);
    setTextContent('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSummarize = async () => {
    if (selectedFiles.length === 0 && !textContent.trim()) {
      showToast('Please upload at least one file or write some notes first', 'warning');
      return;
    }

    setLoading(true);
    try {
      const response = await aiService.summarizeNotes(selectedFiles, textContent);
      if (response && response.success && response.summary) {
        showToast('Summary generated successfully and saved!', 'success');
        
        // Refresh past list
        loadUserSummaries();

        // Load the new summary
        setActiveSummary(response.summary);
        setActiveSummaryId(response.summary._id);
        if (response.summary.chatId) {
          loadChatDetails(response.summary.chatId);
        }
      }
    } catch (error) {
      showToast(error.message || 'Error generating summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Submit Q&A query
  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || chatSending || !notesChat?._id) return;

    const messageText = chatInput;
    setChatInput('');
    setChatSending(true);

    // Optimistically append user question
    const userMsg = {
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString()
    };
    setNotesChat((prev) => ({
      ...prev,
      messages: [...prev.messages, userMsg]
    }));

    try {
      const res = await aiService.sendMessageInChat(notesChat._id, messageText);
      if (res && res.success && res.chatMessage) {
        setNotesChat((prev) => ({
          ...prev,
          messages: [...prev.messages, res.chatMessage]
        }));
      }
    } catch (error) {
      showToast(error.message || 'Could not reach study buddy', 'error');
    } finally {
      setChatSending(false);
    }
  };

  // Delete summary
  const handleDeleteSummary = async (e, summaryId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this summary and its chat context?')) {
      try {
        const res = await aiService.deleteSummary(summaryId);
        if (res && res.success) {
          showToast('Summary deleted successfully', 'info');
          if (activeSummaryId === summaryId) {
            setActiveSummary(null);
            setActiveSummaryId(null);
            setNotesChat(null);
          }
          loadUserSummaries();
        }
      } catch (error) {
        showToast(error.message || 'Could not delete summary', 'error');
      }
    }
  };

  const handleCopy = () => {
    if (!activeSummary?.summaryText) return;
    navigator.clipboard.writeText(activeSummary.summaryText);
    setCopied(true);
    showToast('Copied summary to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  // Start new summary upload
  const handleNewSummary = () => {
    setActiveSummary(null);
    setActiveSummaryId(null);
    setNotesChat(null);
    setActiveTab('summary');
    setRevealedAnswers({});
    handleClear();
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  // Generate scenario questions for this summary
  const handleGenerateScenarios = async () => {
    if (!activeSummaryId) return;
    setGeneratingScenarios(true);
    try {
      const res = await aiService.generateExamScenarios(activeSummaryId);
      if (res && res.success && res.summary) {
        setActiveSummary(res.summary);
        showToast('Exam scenario questions generated successfully!', 'success');
      }
    } catch (err) {
      showToast(err.message || 'Error generating scenarios', 'error');
    } finally {
      setGeneratingScenarios(false);
    }
  };

  const renderNotesHistory = () => {
    if (historyLoading && summaries.length === 0) {
      return (
        <div className="h-20 flex items-center justify-center">
          <Loader size="sm" />
        </div>
      );
    }

    if (summaries.length === 0) {
      return (
        <div className="text-center text-xs text-slate-450 py-8 border border-dashed border-slate-200 dark:border-dark-800 rounded-xl bg-slate-50/50 dark:bg-dark-950/20">
          <FileText className="h-7 w-7 mx-auto opacity-20 text-brand-500 mb-1" />
          <p>No saved note summaries</p>
        </div>
      );
    }

    return (
      <div className="space-y-1">
        {summaries.map((summary) => {
          const isActive = activeSummaryId === summary._id;
          return (
            <div
              key={summary._id}
              onClick={() => {
                loadSummaryDetails(summary._id);
                if (window.innerWidth <= 768) setSidebarOpen(false);
              }}
              className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-sm cursor-pointer transition-all border ${
                isActive
                  ? 'bg-brand-500/10 border-brand-500/20 text-brand-650 dark:text-brand-400 font-medium'
                  : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-450 dark:hover:bg-dark-800/60 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden flex-1">
                <FileText className={`h-4.5 w-4.5 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
                <span className="truncate text-xs">{summary.title}</span>
              </div>
              
              <button
                onClick={(e) => handleDeleteSummary(e, summary._id)}
                aria-label="Delete note summary"
                className="p-1 rounded text-slate-450 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-955/20 opacity-0 group-hover:opacity-100 transition-opacity ml-1.5"
                title="Delete Summary"
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
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-100px)] w-full md:overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 transition-all duration-300">
      
      {/* Mobile Sidebar Backdrop overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed top-14 bottom-0 left-0 right-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        />
      )}

      {/* 1. Summaries Sidebar History */}
      <div
        className={`h-full bg-slate-50 dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 flex flex-col flex-shrink-0 overflow-hidden transition-transform duration-300 fixed md:relative z-50 w-[260px] top-14 md:top-0 bottom-0 left-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0'
        }`}
      >
        <div className="p-4 border-b border-slate-200 dark:border-dark-850">
          <button
            onClick={handleNewSummary}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md shadow-brand-500/10 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            <span>New Summary</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {renderNotesHistory()}
        </div>
      </div>

      {/* 2. Main Summary & Chat Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-dark-900 relative z-10">
        
        {/* Header bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-dark-850 z-10 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Hide history sidebar' : 'Show history sidebar'}
              title={sidebarOpen ? 'Hide history' : 'Show history'}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-dark-900 dark:border-dark-800 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 focus:outline-none transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>

            <div className="overflow-hidden leading-snug">
              <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-2">
                {activeSummary && (
                  <button 
                    onClick={handleNewSummary}
                    aria-label="Upload another notes document"
                    className="p-1 hover:bg-slate-100 dark:hover:bg-dark-800 rounded-lg text-slate-500"
                    title="Upload another note"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                )}
                <span>{activeSummary ? activeSummary.title : 'Notes Summarizer'}</span>
              </h1>
              <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium">
                {activeSummary 
                  ? 'Markdown Study Summary and Interactive Q&A Session' 
                  : 'Upload PDFs or text drafts to generate deep summaries'}
              </p>
            </div>
          </div>

          {activeSummary && (
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-2 bg-slate-50 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-lg transition"
              >
                {copied ? <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                onClick={(e) => handleDeleteSummary(e, activeSummaryId)}
                aria-label="Delete current notes summary"
                title="Delete current summary"
                className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 dark:bg-dark-900 dark:border-dark-800 dark:hover:bg-rose-950/20 dark:hover:border-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition focus:outline-none"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-hidden relative">
          
          {loading && !activeSummary ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <Loader size="md" />
              <p className="text-xs text-slate-500 italic animate-pulse">Running document parser and compiling summary...</p>
            </div>
          ) : activeSummary ? (
            
            /* 3. Split Screen Workspace: Summary (Left) & Chat (Right) */
            <div className="h-full w-full flex flex-col lg:flex-row overflow-hidden divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-dark-800">
              
              {/* Mobile split-tab switcher */}
              <div className="lg:hidden flex border-b border-slate-200 dark:border-dark-800 bg-slate-50 dark:bg-dark-950 p-2 gap-2 flex-shrink-0">
                <button
                  onClick={() => setMobileView('summary')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    mobileView === 'summary'
                      ? 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                  }`}
                >
                  Summary & Prep
                </button>
                <button
                  onClick={() => setMobileView('chat')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border transition-all ${
                    mobileView === 'chat'
                      ? 'bg-white dark:bg-dark-900 border-slate-200 dark:border-dark-800 text-brand-600 dark:text-brand-400 shadow-sm'
                      : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-350'
                  }`}
                >
                  Discussion Chat
                </button>
              </div>

              {/* Summary Viewer (Left Side) */}
              <div className={`flex-1 overflow-y-auto p-6 space-y-4 ${mobileView === 'summary' ? 'block' : 'hidden lg:block'}`}>
                <div className="max-w-3xl mx-auto space-y-6">
                  
                  {/* Sub Tab Bar */}
                  <div className="flex border-b border-slate-200 dark:border-dark-800">
                    <button
                      onClick={() => setActiveTab('summary')}
                      className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
                        activeTab === 'summary'
                          ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Study Summary
                    </button>
                    <button
                      onClick={() => setActiveTab('scenarios')}
                      className={`pb-2.5 px-4 text-xs font-bold uppercase tracking-wider transition-all border-b-2 -mb-[1px] ${
                        activeTab === 'scenarios'
                          ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                          : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                      }`}
                    >
                      Exam Scenario Prep
                    </button>
                  </div>

                  {activeTab === 'summary' ? (
                    /* Summary View */
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                        <FileText className="h-4 w-4" />
                        <span>Core Summary</span>
                      </div>
                      <div className="text-slate-700 dark:text-slate-350 leading-relaxed text-sm space-y-4">
                        {(activeSummary.summaryText || '').split('\n').map((line, i) => (
                          <React.Fragment key={i}>
                            {parseMarkdownLine(line)}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Exam Scenarios View */
                    <div className="space-y-6">
                      
                      {generatingScenarios ? (
                        <div className="py-16 text-center space-y-3">
                          <Loader size="md" />
                          <p className="text-xs text-slate-500 italic animate-pulse">Analyzing note content and designing scenario questions...</p>
                        </div>
                      ) : !activeSummary.scenarios || !Array.isArray(activeSummary.scenarios) || activeSummary.scenarios.length === 0 ? (
                        /* Empty state, click to generate */
                        <div className="glass-card p-6 sm:p-8 text-center space-y-4 max-w-xl mx-auto border-slate-200 dark:border-dark-800 mt-4">
                          <div className="h-12 w-12 rounded-full bg-brand-500/10 flex items-center justify-center text-brand-600 dark:text-brand-400 mx-auto">
                            <Sparkles className="h-6 w-6" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Generate Exam Scenario Questions</h4>
                            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                              We'll design 4 highly conceptual, real-world scenario questions from these notes. These are designed to reflect the problem-solving questions most likely to appear on exams.
                            </p>
                          </div>
                          <button
                            onClick={handleGenerateScenarios}
                            className="btn-primary w-full text-xs font-semibold py-2.5 rounded-xl shadow-md"
                          >
                            <span>Generate Scenario Questions</span>
                          </button>
                        </div>
                      ) : (
                        /* Scenarios cards list */
                        <div className="space-y-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-brand-600 dark:text-brand-400">
                              <Sparkles className="h-4 w-4 animate-pulse" />
                              <span>Problem & Scenario-Based Exam Prep</span>
                            </div>
                            <button
                              onClick={handleGenerateScenarios}
                              className="text-[10px] font-bold text-slate-500 hover:text-brand-600 transition flex items-center gap-1"
                              title="Re-generate questions"
                            >
                              <RefreshCw className="h-3 w-3" />
                              <span>Regenerate</span>
                            </button>
                          </div>

                          <div className="space-y-4">
                            {(activeSummary.scenarios || []).map((sc, index) => {
                              const isRevealed = !!revealedAnswers[index];
                              return (
                                <div
                                  key={sc.id || index}
                                  className="p-5 rounded-2xl border border-slate-200 dark:border-dark-800 bg-slate-50/20 dark:bg-dark-900/40 space-y-3.5 shadow-sm text-left"
                                >
                                  <div>
                                    <span className="text-[10px] font-bold text-brand-500 uppercase tracking-widest block mb-1">Scenario Question {index + 1}</span>
                                    <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-dark-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-dark-800/85 leading-relaxed select-none">
                                      "{sc.scenario}"
                                    </p>
                                  </div>

                                  <div className="space-y-1.5">
                                    <p className="text-xs font-bold text-slate-455 dark:text-slate-500 uppercase tracking-wider">Exam Question:</p>
                                    <p className="text-sm font-extrabold text-slate-900 dark:text-white leading-snug">
                                      {parseInlineFormatting(sc.question)}
                                    </p>
                                  </div>

                                  <div className="pt-2 border-t border-slate-200/60 dark:border-dark-800/60 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                      <span className="text-[10px] text-slate-450 italic">Test your knowledge before revealing!</span>
                                      <button
                                        onClick={() => setRevealedAnswers(prev => ({ ...prev, [index]: !isRevealed }))}
                                        className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-dark-700 bg-white dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-300 shadow-sm transition"
                                      >
                                        {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
                                      </button>
                                    </div>

                                    {isRevealed && (
                                      <motion.div
                                        initial={{ opacity: 0, y: -5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 dark:border-emerald-500/10 p-4 rounded-xl space-y-2 text-xs"
                                      >
                                        <p className="font-extrabold text-emerald-800 dark:text-emerald-400 uppercase tracking-wider text-[10px]">Correct Answer/Solution:</p>
                                        <p className="font-semibold text-slate-800 dark:text-white leading-relaxed">
                                          {parseInlineFormatting(sc.answer)}
                                        </p>
                                        <div className="pt-2 mt-2 border-t border-emerald-500/10 space-y-1">
                                          <p className="font-extrabold text-slate-450 dark:text-slate-500 uppercase tracking-wider text-[9px]">Step-by-Step Explanation:</p>
                                          <div className="text-slate-600 dark:text-slate-400 leading-relaxed space-y-1">
                                            {(sc.explanation || '').split('\n').map((line, i) => (
                                              <React.Fragment key={i}>
                                                {parseMarkdownLine(line)}
                                              </React.Fragment>
                                            ))}
                                          </div>
                                        </div>
                                      </motion.div>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  )}

                </div>
              </div>

              {/* Inline Q&A Chat panel (Right Side) */}
              <div className={`w-full lg:w-[450px] flex flex-col h-full bg-slate-50/30 dark:bg-dark-950/20 ${mobileView === 'chat' ? 'flex' : 'hidden lg:flex'}`}>
                
                {/* Chat header */}
                <div className="px-6 py-3 border-b border-slate-250 dark:border-dark-800/80 bg-slate-50/50 dark:bg-dark-900/50 flex items-center justify-between flex-shrink-0">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
                    <MessageSquareCode className="h-4 w-4 text-brand-500" />
                    <span>Q&A Chat Buddy</span>
                  </div>
                  <span className="text-[10px] text-slate-400 italic">Saved session</span>
                </div>

                {/* Messages scroll box */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth">
                  {chatLoading ? (
                    <div className="h-full flex items-center justify-center flex-col gap-2">
                      <Loader size="sm" />
                      <p className="text-[10px] text-slate-450 italic">Syncing chat log...</p>
                    </div>
                  ) : notesChat && Array.isArray(notesChat.messages) ? (
                    notesChat.messages.map((msg, index) => (
                      <div key={index} className="text-xs">
                        <ChatMessage message={msg} />
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-xs text-slate-400 py-10">
                      <Sparkles className="h-6 w-6 mx-auto opacity-30 animate-pulse text-brand-500 mb-1" />
                      <p>Ask Buddy a question about this material</p>
                    </div>
                  )}

                  {/* AI Typing indicator inside inline chat */}
                  {chatSending && (
                    <div className="flex items-center gap-3 text-slate-500 text-xs pl-1">
                      <div className="flex-shrink-0 h-7 w-7 rounded-lg bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                        <Sparkles className="h-3.5 w-3.5 text-brand-650 dark:text-brand-400 animate-pulse" />
                      </div>
                      <div className="bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-xl rounded-tl-none px-3 py-2 text-xs text-slate-650 dark:text-slate-405 flex items-center gap-2">
                        <div className="flex space-x-0.5">
                          <span className="h-1.5 w-1.5 bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <span className="h-1.5 w-1.5 bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <span className="h-1.5 w-1.5 bg-slate-550 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="text-[10px] italic">Buddy is typing...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Question send input bar */}
                <div className="p-3 border-t border-slate-200 dark:border-dark-800 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm">
                  <form onSubmit={handleSendChat} className="flex gap-2 items-center relative">
                    <input
                      type="text"
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      disabled={chatSending || chatLoading}
                      placeholder="Ask anything about these notes..."
                      className="w-full bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-dark-800 rounded-xl pl-3 pr-11 py-2.5 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-455 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition"
                    />
                    <button
                      type="submit"
                      disabled={!chatInput.trim() || chatSending || chatLoading}
                      className="absolute right-2 p-1.5 bg-brand-600 hover:bg-brand-505 disabled:bg-slate-100 dark:disabled:bg-dark-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-lg transition focus:outline-none shadow-sm"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </form>
                </div>

              </div>

            </div>
          ) : (
            
            /* 4. Upload Input Screen (Initial State) */
            <div className="h-full overflow-y-auto p-6 max-w-4xl mx-auto flex flex-col justify-center items-center py-10">
              <div className="w-full space-y-6">
                
                {/* Upload Panel Card */}
                <div className="glass-card p-6 sm:p-8 border-slate-200 dark:border-dark-800 space-y-5 shadow-lg max-w-xl mx-auto text-left">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-brand-500/10 rounded-xl text-brand-600 dark:text-brand-400">
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">Upload Study Materials</h3>
                      <p className="text-xs text-slate-500 mt-0.5">We support PDF, Word (DOCX/DOC), PowerPoint (PPTX/PPT), and TXT files.</p>
                    </div>
                  </div>

                  {/* Drag and drop zone */}
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      dragOver 
                        ? 'border-brand-500 bg-brand-500/5' 
                        : selectedFiles.length > 0 
                          ? 'border-emerald-600 bg-emerald-950/5' 
                          : 'border-slate-255 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-900/30 hover:border-slate-350 dark:hover:border-dark-600'
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
                    
                    <div className="flex flex-col items-center gap-3">
                      {selectedFiles.length > 0 ? (
                        <div className="w-full text-left space-y-2 max-h-48 overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                          <p className="text-[10px] font-bold text-slate-450 dark:text-slate-550 uppercase tracking-wider px-1">Selected Documents ({selectedFiles.length}):</p>
                          {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-slate-100 dark:bg-dark-850 p-2 rounded-xl border border-slate-200/50 dark:border-dark-800">
                              <div className="flex items-center gap-2 overflow-hidden flex-1 select-none">
                                <FileText className="h-4 w-4 text-brand-500 flex-shrink-0" />
                                <span className="text-xs font-semibold text-slate-800 dark:text-white truncate">{file.name}</span>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className="text-[10px] text-slate-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFiles((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                  className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/30 text-slate-500 hover:text-rose-600 transition"
                                  title="Remove File"
                                >
                                  <X className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <>
                          <div className="p-3 rounded-xl border bg-slate-100 dark:bg-dark-850 border-slate-200 dark:border-dark-750 text-slate-450">
                            <Upload className="h-6 w-6" />
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-slate-800 dark:text-white">Click or drag files here</p>
                            <p className="text-xs text-slate-500 mt-1">Upload PDF, Word, PPT or TXT files (Max 10MB each)</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Divider line */}
                  <div className="flex items-center gap-3 py-1">
                    <div className="flex-1 h-px bg-slate-200 dark:bg-dark-850" />
                    <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">OR</span>
                    <div className="flex-1 h-px bg-slate-200 dark:bg-dark-850" />
                  </div>

                  {/* Text copy input area */}
                  <div className="flex flex-col gap-1.5">
                    <h4 className="text-xs font-semibold text-slate-550 dark:text-slate-400 uppercase tracking-wider">Paste raw notes text</h4>
                    <textarea
                      value={textContent}
                      disabled={selectedFiles.length > 0}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Paste outline notes, chapter texts, or copy-paste lecture drafts..."
                      rows="5"
                      className="custom-input resize-none disabled:opacity-40 disabled:cursor-not-allowed text-sm"
                    />
                  </div>

                  {/* Actions buttons */}
                  <div className="flex gap-4 pt-2">
                    <button
                      onClick={handleSummarize}
                      disabled={loading || (selectedFiles.length === 0 && !textContent.trim())}
                      className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2 text-sm"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4.5 w-4.5 animate-spin" />
                          <span>Summarizing...</span>
                        </>
                      ) : (
                        <span>Summarize Notes</span>
                      )}
                    </button>
                    {(selectedFiles.length > 0 || textContent) && (
                      <button
                        onClick={handleClear}
                        disabled={loading}
                        className="btn-secondary text-sm"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                </div>

              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default NotesSummarizer;
