import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { aiService } from '../services/aiService';
import { useToast } from '../context/toastContext';
import ChatMessage from '../components/chatMessage';
import Loader from '../components/loader';
import { 
  Send, 
  Trash2, 
  Sparkles, 
  MessageSquareCode, 
  Plus, 
  Edit2, 
  Check, 
  X, 
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  FileText,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * AI Chat Buddy Page with persistent chat history (ChatGPT/Gemini style sidebar) 
 * and support for note-based contextual question answering.
 */
const AIChat = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryChatId = searchParams.get('chatId');

  const [chats, setChats] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [activeChatId, setActiveChatId] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [chatsLoading, setChatsLoading] = useState(false);
  const [chatDetailsLoading, setChatDetailsLoading] = useState(false);
  const [messageSending, setMessageSending] = useState(false);
  const [input, setInput] = useState('');
  
  // Title editing state
  const [editingChatId, setEditingChatId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Scroll to bottom when messages or loading state changes
  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, messageSending]);

  // Load user chats on mount or when active chat updates
  const loadUserChats = async (selectFirst = false) => {
    setChatsLoading(true);
    try {
      const res = await aiService.getUserChats();
      if (res && res.success) {
        setChats(res.chats);
        
        // If we want to auto-select the most recent chat when none is active
        if (selectFirst && res.chats.length > 0 && !queryChatId && !activeChatId) {
          loadChatDetails(res.chats[0]._id);
        }
      }
    } catch (error) {
      showToast(error.message || 'Could not fetch chat history', 'error');
    } finally {
      setChatsLoading(false);
    }
  };

  // Fetch full messages of a specific chat session
  const loadChatDetails = async (chatId) => {
    setChatDetailsLoading(true);
    try {
      const res = await aiService.getChatById(chatId);
      if (res && res.success) {
        setActiveChat(res.chat);
        setActiveChatId(chatId);
        // Sync URL query
        setSearchParams({ chatId });
      }
    } catch (error) {
      showToast(error.message || 'Could not load chat details', 'error');
      // If chat is not found, clear URL parameters
      setSearchParams({});
      setActiveChat(null);
      setActiveChatId(null);
    } finally {
      setChatDetailsLoading(false);
    }
  };

  // On mount or queryChatId parameter change, trigger fetching details
  useEffect(() => {
    loadUserChats(false);
  }, []);

  useEffect(() => {
    if (queryChatId) {
      if (queryChatId !== activeChatId) {
        loadChatDetails(queryChatId);
      }
    } else {
      setActiveChat(null);
      setActiveChatId(null);
    }
  }, [queryChatId]);

  // Handle creating a blank new chat session
  const handleNewChat = () => {
    setActiveChat(null);
    setActiveChatId(null);
    setInput('');
    setSearchParams({});
    if (window.innerWidth <= 768) setSidebarOpen(false);
  };

  // Send message
  const handleSend = async (e, directText = null) => {
    if (e) e.preventDefault();
    const textToSend = directText || input;
    if (!textToSend.trim() || messageSending) return;

    if (!directText) setInput('');
    setMessageSending(true);

    try {
      let currentChatId = activeChatId;

      // If no active session exists, create a new one first
      if (!currentChatId) {
        const title = textToSend.slice(0, 30) + (textToSend.length > 30 ? '...' : '');
        const res = await aiService.createChat(title);
        if (res && res.success && res.chat) {
          currentChatId = res.chat._id;
          setActiveChatId(currentChatId);
          setActiveChat(res.chat);
          setSearchParams({ chatId: currentChatId });
          
          // Optimistically append user message to local state
          const userMsg = {
            role: 'user',
            content: textToSend,
            timestamp: new Date().toISOString()
          };
          res.chat.messages.push(userMsg);
          setChats((prev) => [res.chat, ...prev]);
        } else {
          throw new Error('Failed to create a new chat session');
        }
      } else {
        // Optimistically append user message to existing messages list
        const userMsg = {
          role: 'user',
          content: textToSend,
          timestamp: new Date().toISOString()
        };
        setActiveChat((prev) => ({
          ...prev,
          messages: [...prev.messages, userMsg]
        }));
      }

      // Send to API
      const response = await aiService.sendMessageInChat(currentChatId, textToSend);
      if (response && response.success && response.chatMessage) {
        // Update messages and titles
        setActiveChat((prev) => ({
          ...prev,
          title: response.chatTitle || prev.title,
          messages: [...prev.messages, response.chatMessage]
        }));

        // Refresh chats in sidebar list to update titles
        loadUserChats(false);
      }
    } catch (error) {
      showToast(error.message || 'Error communicating with AI Study Buddy', 'error');
    } finally {
      setMessageSending(false);
    }
  };

  // Delete chat session
  const handleDeleteChat = async (e, chatId) => {
    e.stopPropagation();
    if (window.confirm('Are you sure you want to delete this chat session?')) {
      try {
        const res = await aiService.deleteChat(chatId);
        if (res && res.success) {
          showToast('Chat deleted successfully', 'info');
          
          // Reset UI if active chat was deleted
          if (activeChatId === chatId) {
            handleNewChat();
          }
          
          // Refresh list
          loadUserChats(false);
        }
      } catch (error) {
        showToast(error.message || 'Could not delete chat session', 'error');
      }
    }
  };

  // Start editing title
  const startRenameChat = (e, chat) => {
    e.stopPropagation();
    setEditingChatId(chat._id);
    setEditingTitle(chat.title);
  };

  // Save renamed title
  const saveRenameChat = async (e, chatId) => {
    e.stopPropagation();
    if (!editingTitle.trim()) return;

    try {
      const res = await aiService.updateChatTitle(chatId, editingTitle);
      if (res && res.success) {
        showToast('Chat renamed successfully', 'success');
        setEditingChatId(null);
        
        // Sync active chat UI if needed
        if (activeChatId === chatId) {
          setActiveChat((prev) => ({ ...prev, title: editingTitle }));
        }

        // Refresh list
        loadUserChats(false);
      }
    } catch (error) {
      showToast(error.message || 'Could not rename chat session', 'error');
    }
  };

  // Group chats helper for date sorting
  const groupChatsByDate = (chatList) => {
    const groups = {
      Today: [],
      Yesterday: [],
      Previous: []
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    chatList.forEach((chat) => {
      const chatDate = new Date(chat.updatedAt || chat.createdAt);
      chatDate.setHours(0, 0, 0, 0);

      if (chatDate.getTime() === today.getTime()) {
        groups.Today.push(chat);
      } else if (chatDate.getTime() === yesterday.getTime()) {
        groups.Yesterday.push(chat);
      } else {
        groups.Previous.push(chat);
      }
    });

    return groups;
  };

  const groupedChats = groupChatsByDate(chats);

  // Suggested Prompts for Blank Slate State
  const SUGGESTED_PROMPTS = [
    {
      title: 'Explain a Concept',
      text: 'Explain the central limit theorem in simple terms with an analogy.',
      icon: '💡'
    },
    {
      title: 'Debug or Code',
      text: 'Write a JavaScript function to reverse a string and explain how it works.',
      icon: '💻'
    },
    {
      title: 'Study Help',
      text: 'How can I create an effective active recall study plan for exam preparation?',
      icon: '📚'
    },
    {
      title: 'Real-World Examples',
      text: 'Provide three practical, everyday examples of Newton\'s third law of motion.',
      icon: '🍎'
    }
  ];

  const renderChatHistory = () => {
    if (chatsLoading && chats.length === 0) {
      return (
        <div className="h-20 flex items-center justify-center">
          <Loader size="sm" />
        </div>
      );
    }

    if (chats.length === 0) {
      return (
        <div className="text-center text-xs text-slate-450 py-8 border border-dashed border-slate-200 dark:border-dark-800 rounded-xl bg-slate-50/50 dark:bg-dark-950/20">
          <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-20 text-brand-500" />
          <p>No recent study chats</p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {Object.keys(groupedChats).map((groupName) => {
          const groupChats = groupedChats[groupName];
          if (groupChats.length === 0) return null;

          return (
            <div key={groupName} className="space-y-1.5 text-left">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-2">
                {groupName}
              </span>
              <div className="space-y-1">
                {groupChats.map((chat) => {
                  const isActive = activeChatId === chat._id;
                  const isEditing = editingChatId === chat._id;

                  return (
                    <div
                      key={chat._id}
                      onClick={() => {
                        loadChatDetails(chat._id);
                        if (window.innerWidth <= 768) setSidebarOpen(false);
                      }}
                      className={`group relative flex items-center justify-between px-3 py-2 rounded-xl text-sm cursor-pointer transition-all border ${
                        isActive
                          ? 'bg-brand-500/10 border-brand-500/25 text-brand-650 dark:text-brand-400 font-semibold'
                          : 'border-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-450 dark:hover:bg-dark-800/60 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2 overflow-hidden flex-1 pr-10">
                        <MessageSquare className={`h-4 w-4 flex-shrink-0 ${isActive ? 'text-brand-500' : 'text-slate-400 dark:text-slate-500'}`} />
                        {isEditing ? (
                          <input
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveRenameChat(e, chat._id);
                              if (e.key === 'Escape') setEditingChatId(null);
                            }}
                            className="w-full text-xs bg-slate-50 dark:bg-dark-950 border border-slate-350 dark:border-dark-800 px-2 py-0.5 rounded focus:outline-none"
                            autoFocus
                          />
                        ) : (
                          <div className="truncate flex flex-col min-w-0">
                            <span className="truncate text-xs text-slate-800 dark:text-slate-200">{chat.title}</span>
                            {chat.notesName && (
                              <span className="text-[9px] text-brand-500 dark:text-brand-400/80 truncate">
                                Context: {chat.notesName}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-0.5">
                        {isEditing ? (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                saveRenameChat(e, chat._id);
                              }}
                              aria-label="Confirm rename"
                              className="p-1 rounded text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingChatId(null);
                              }}
                              className="p-1 rounded text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            <button
                              onClick={(e) => startRenameChat(e, chat)}
                              aria-label="Rename Chat title"
                              title="Rename Chat"
                              className="p-1 rounded text-slate-500 hover:bg-slate-200 dark:text-slate-400 dark:hover:bg-dark-750 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Edit2 className="h-3 w-3" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteChat(e, chat._id)}
                              aria-label="Delete Chat session"
                              title="Delete Chat"
                              className="p-1 rounded text-slate-500 hover:bg-rose-100 dark:hover:bg-rose-950/30 hover:text-rose-650 dark:hover:text-rose-455 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="flex flex-col md:flex-row h-auto md:h-[calc(100vh-100px)] w-full md:overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900 transition-all duration-300 relative">
      
      {/* Mobile Sidebar Backdrop overlay */}
      {sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          className="md:hidden fixed top-14 bottom-0 left-0 right-0 z-40 bg-slate-900/40 backdrop-blur-sm"
        />
      )}

      {/* 1. Chats Sidebar */}
      <div
        className={`h-full bg-slate-50 dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 flex flex-col flex-shrink-0 overflow-hidden transition-transform duration-300 fixed md:relative z-50 w-[280px] top-14 md:top-0 bottom-0 left-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-0'
        }`}
      >
        {/* Sidebar Actions */}
        <div className="p-4 border-b border-slate-200 dark:border-dark-850">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 transition shadow-md shadow-brand-500/10 focus:outline-none"
          >
            <Plus className="h-4 w-4" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Chats List Scroll Panel */}
        <div className="flex-1 overflow-y-auto p-3">
          {renderChatHistory()}
        </div>
      </div>

      {/* 2. Main Chat Panel */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white dark:bg-dark-900 relative z-10">
        
        {/* Chat Panel Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-200 dark:border-dark-850 z-10 bg-white/80 dark:bg-dark-900/80 backdrop-blur-sm">
          <div className="flex items-center gap-3.5 overflow-hidden">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label={sidebarOpen ? 'Hide chat history sidebar' : 'Show chat history sidebar'}
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              className="p-2 rounded-lg bg-slate-50 border border-slate-200 hover:bg-slate-100 dark:bg-dark-900 dark:border-dark-800 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 focus:outline-none transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
            </button>

            <div className="overflow-hidden leading-snug">
              <div>
                <h1 className="text-sm font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  <span>{activeChat ? activeChat.title : 'Study Buddy Chat'}</span>
                </h1>
                <p className="text-[10px] text-slate-450 dark:text-slate-500 font-medium truncate">
                  {activeChat?.notesName ? (
                    <span className="flex items-center gap-1 text-brand-600 dark:text-brand-400">
                      <FileText className="h-3 w-3" />
                      <span>Context: {activeChat.notesName}</span>
                    </span>
                  ) : (
                    <span>Intelligent interactive academic tutor</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {activeChatId && (
            <button
              onClick={(e) => handleDeleteChat(e, activeChatId)}
              title="Delete current session"
              className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-rose-50 hover:border-rose-200 dark:bg-dark-900 dark:border-dark-800 dark:hover:bg-rose-950/20 dark:hover:border-rose-900/30 text-slate-500 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition focus:outline-none"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Message Container Area */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scroll-smooth min-h-0">
          {chatDetailsLoading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3">
              <Loader size="md" />
              <p className="text-xs text-slate-450 italic">Syncing session messages...</p>
            </div>
          ) : activeChat ? (
            <div className="space-y-6">
              {/* Optional Reminder Banner for Note Context */}
              {activeChat.notesName && (
                <div className="p-3 bg-brand-500/5 border border-brand-500/10 rounded-2xl flex items-center gap-2.5 text-xs text-brand-700 dark:text-brand-300">
                  <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-600 dark:text-brand-400">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="font-semibold">Note context loaded: </span>
                    <span>AI Buddy will prioritize details from <strong className="font-extrabold">"{activeChat.notesName}"</strong> when responding.</span>
                  </div>
                </div>
              )}

              {activeChat.messages.map((msg, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <ChatMessage message={msg} />
                </motion.div>
              ))}
            </div>
          ) : (
            /* 3. New Chat Blank Landing State */
            <div className="h-full max-w-2xl mx-auto flex flex-col justify-center items-center py-10 px-4 space-y-8 select-none text-center">
              
              <div className="flex flex-col items-center gap-3">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-brand-500/20">
                  <Sparkles className="h-7.5 w-7.5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">AI Chat Buddy</h2>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                    Your encouraging, intelligent study tutor. Ask questions, clarify calculations, or explain concepts.
                  </p>
                </div>
              </div>

              {/* Grid of Suggested Prompt Starters */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full pt-4">
                {SUGGESTED_PROMPTS.map((prompt, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(null, prompt.text)}
                    className="flex flex-col items-left text-left p-4 rounded-2xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900/50 hover:bg-slate-50 dark:hover:bg-dark-800 hover:border-brand-500/30 dark:hover:border-brand-500/20 hover:scale-[1.01] transition-all focus:outline-none"
                  >
                    <span className="text-lg mb-1">{prompt.icon}</span>
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200">{prompt.title}</span>
                    <span className="text-[10px] text-slate-500 mt-1.5 leading-snug line-clamp-2">{prompt.text}</span>
                  </button>
                ))}
              </div>

            </div>
          )}

          {/* Assistant Typing Bubble */}
          {messageSending && (
            <div className="flex items-center gap-4 text-slate-500 text-xs pl-2">
              <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                <Sparkles className="h-4.5 w-4.5 text-brand-650 dark:text-brand-400 animate-pulse" />
              </div>
              <div className="bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-2xl rounded-tl-none px-4 py-3 text-sm text-slate-650 dark:text-slate-400 flex items-center gap-2">
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

        {/* Input tray at bottom */}
        <div className="p-4 border-t border-slate-200 dark:border-dark-850 z-10 bg-white/90 dark:bg-dark-900/90 backdrop-blur-sm">
          <form onSubmit={handleSend} className="max-w-4xl mx-auto relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={messageSending || chatDetailsLoading}
              placeholder={
                activeChat?.notesName
                  ? `Ask Buddy about "${activeChat.notesName}"...`
                  : "Ask anything (e.g. 'Explain the theory of relativity in simple terms')"
              }
              className="w-full bg-slate-50 dark:bg-dark-950/60 border border-slate-200 dark:border-dark-800 rounded-2xl pl-4 pr-14 py-3.5 text-sm text-slate-800 dark:text-slate-100 placeholder-slate-455 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/25 dark:focus:ring-brand-500/30 focus:border-brand-500 transition shadow-sm"
            />
            <button
              type="submit"
              aria-label="Send message"
              disabled={!input.trim() || messageSending || chatDetailsLoading}
              className="absolute right-3.5 p-2 bg-brand-600 hover:bg-brand-500 disabled:bg-slate-100 dark:disabled:bg-dark-800 disabled:text-slate-400 dark:disabled:text-slate-600 text-white rounded-xl transition focus:outline-none shadow-sm"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default AIChat;
