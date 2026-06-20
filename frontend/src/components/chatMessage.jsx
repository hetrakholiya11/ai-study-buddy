import React from 'react';
import { BookOpen, User } from 'lucide-react';

/**
 * Message element inside the AI Chat window.
 * Positions user messages on the right and AI/assistant responses on the left (theme-responsive).
 */
const parseInlineFormatting = (text) => {
  // Parse bold **text** and inline `code`
  const regex = /(\*\*.*?\*\*|`.*?`)/g;
  const parts = text.split(regex);
  
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-extrabold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
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
  // 1. Headers
  const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    const text = headerMatch[2];
    const parsedText = parseInlineFormatting(text);
    if (level === 1) return <h1 className="text-xl font-extrabold my-2 text-slate-900 dark:text-white">{parsedText}</h1>;
    if (level === 2) return <h2 className="text-lg font-bold my-2 text-slate-900 dark:text-white">{parsedText}</h2>;
    return <h3 className="text-base font-bold my-1.5 text-slate-900 dark:text-white">{parsedText}</h3>;
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

const parseContent = (content) => {
  if (!content) return null;

  // Split by triple backticks to identify code blocks
  const parts = content.split(/(```[\s\S]*?```)/g);

  return parts.map((part, index) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.split('\n');
      const firstLine = lines[0].slice(3).trim(); // Language (e.g. javascript)
      const code = lines.slice(1, -1).join('\n');
      return (
        <div key={index} className="my-3 rounded-xl overflow-hidden border border-slate-200 dark:border-dark-800 bg-slate-950 text-slate-100 shadow-md max-w-full">
          {firstLine && (
            <div className="bg-slate-900 px-4 py-1.5 text-[10px] font-bold font-mono text-slate-400 border-b border-slate-850 flex justify-between items-center select-none uppercase tracking-wider">
              <span>{firstLine}</span>
            </div>
          )}
          <pre className="p-4 overflow-x-auto text-xs font-mono leading-relaxed bg-slate-950/60 scrollbar-thin">
            <code>{code}</code>
          </pre>
        </div>
      );
    } else {
      const lines = part.split('\n');
      return lines.map((line, idx) => (
        <React.Fragment key={`${index}-${idx}`}>
          {parseMarkdownLine(line)}
        </React.Fragment>
      ));
    }
  });
};

/**
 * Message element inside the AI Chat window.
 * Positions user messages on the right and AI/assistant responses on the left (theme-responsive).
 */
const ChatMessage = ({ message }) => {
  const { role, content, timestamp } = message;
  const isUser = role === 'user';
  
  const formattedTime = timestamp 
    ? new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className={`flex w-full gap-4 ${isUser ? 'justify-end' : 'justify-start'}`}>
      
      {/* AI Avatar (renders on the left for AI messages) */}
      {!isUser && (
        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
          <BookOpen className="h-5 w-5 text-brand-650 dark:text-brand-400" />
        </div>
      )}

      {/* Bubble content */}
      <div className={`flex flex-col max-w-[80%] ${isUser ? 'items-end' : 'items-start'}`}>
        <div
          className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isUser
              ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white rounded-tr-none shadow-md shadow-brand-650/10'
              : 'bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 text-slate-800 dark:text-slate-100 rounded-tl-none'
          }`}
        >
          {parseContent(content)}
        </div>
        
        {/* Timestamp */}
        <span className="text-[10px] text-slate-500 mt-1 px-1">{formattedTime}</span>
      </div>

      {/* User Avatar (renders on the right for user messages) */}
      {isUser && (
        <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-slate-200 dark:bg-dark-800 border border-slate-300 dark:border-dark-700 flex items-center justify-center">
          <User className="h-5 w-5 text-slate-600 dark:text-slate-400" />
        </div>
      )}

    </div>
  );
};

export default ChatMessage;
