import React, { useState, useRef, useEffect } from 'react';
import { aiService } from '../services/aiService';
import { useToast } from '../context/toastContext';
import ChatMessage from '../components/chatMessage';
import Loader from '../components/loader';
import { Send, Trash2, Sparkles, MessageSquareCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Protected AI Chat Page simulating ChatGPT layout with scrolling history and send capability (theme responsive).
 */
const AIChat = () => {
  const { showToast } = useToast();
  
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Hello! I am your AI Study Buddy. Ask me any question, paste a paragraph you're trying to understand, or ask me to explain a concept in simple terms. Let's study!",
      timestamp: new Date().toISOString()
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = {
      role: 'user',
      content: input,
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const historyPayload = messages.map(m => ({ role: m.role, content: m.content }));
      const response = await aiService.sendChatMessage(input, historyPayload);
      if (response && response.message) {
        setMessages((prev) => [...prev, response.message]);
      } else {
        showToast('Unexpected API response structure', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Could not reach the AI. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear this chat history?")) {
      setMessages([
        {
          role: 'assistant',
          content: "Chat cleared. What topic shall we study next?",
          timestamp: new Date().toISOString()
        }
      ]);
      showToast('Chat history cleared', 'info');
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] max-w-5xl mx-auto transition-colors duration-200">
      
      {/* Header bar */}
      <div className="flex justify-between items-center border-b border-slate-200 dark:border-dark-850 pb-4 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-brand-500/10 rounded-lg text-brand-600 dark:text-brand-400">
            <MessageSquareCode className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <span>Study Buddy Chat</span>
            </h1>
            <p className="text-xs text-slate-500">Intelligent interactive academic tutor</p>
          </div>
        </div>

        <button
          onClick={handleClear}
          title="Clear Chat History"
          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 dark:bg-dark-900 dark:border-dark-800 dark:hover:bg-rose-950/20 dark:hover:border-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition focus:outline-none"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      {/* Message window */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto pr-2 space-y-6 scroll-smooth min-h-0 py-4"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25 }}
            >
              <ChatMessage message={msg} />
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex items-center gap-4 text-slate-500 text-xs pl-2">
            <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
              <Sparkles className="h-4 w-4 text-brand-600 dark:text-brand-400 animate-pulse" />
            </div>
            <div className="bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <div className="flex space-x-1">
                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-slate-500 italic">Buddy is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Tray */}
      <form onSubmit={handleSend} className="mt-4 relative">
        <div className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask anything (e.g. 'Explain the central limit theorem in simple terms')"
            className="w-full bg-white dark:bg-dark-900/60 border border-slate-200 dark:border-dark-800 rounded-2xl pl-4 pr-14 py-4 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:focus:ring-brand-500/30 focus:border-brand-500 transition-all shadow-md dark:shadow-lg"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-3 p-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 dark:disabled:bg-dark-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl transition focus:outline-none"
          >
            <Send className="h-4.5 w-4.5" />
          </button>
        </div>
      </form>

    </div>
  );
};

export default AIChat;
