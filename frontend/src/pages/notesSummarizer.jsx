import React, { useState, useRef } from 'react';
import { aiService } from '../services/aiService';
import { useToast } from '../context/toastContext';
import { FileText, Upload, Copy, Check, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Loader from '../components/loader';

const parseInlineFormatting = (text) => {
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
 * Protected Notes Summarizer Page supporting PDF/text upload and side-by-side display (theme responsive).
 */
const NotesSummarizer = () => {
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [selectedFile, setSelectedFile] = useState(null);
  const [textContent, setTextContent] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        showToast('Only PDF and TXT files are supported', 'warning');
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showToast('File size must be under 10MB', 'warning');
        return;
      }
      setSelectedFile(file);
      setTextContent('');
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
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.type !== 'application/pdf' && file.type !== 'text/plain') {
        showToast('Only PDF and TXT files are supported', 'warning');
        return;
      }
      setSelectedFile(file);
      setTextContent('');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setTextContent('');
    setSummary('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSummarize = async () => {
    if (!selectedFile && !textContent.trim()) {
      showToast('Please upload a file or write some notes first', 'warning');
      return;
    }

    setLoading(true);
    setSummary('');
    try {
      const response = await aiService.summarizeNotes(selectedFile, textContent);
      if (response && response.summary) {
        setSummary(response.summary);
        showToast('Summary generated successfully', 'success');
      } else {
        showToast('Unexpected API response format', 'error');
      }
    } catch (error) {
      showToast(error.message || 'Error generating summary', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!summary) return;
    navigator.clipboard.writeText(summary);
    setCopied(true);
    showToast('Copied to clipboard', 'success');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <FileText className="h-7 w-7 text-brand-600 dark:text-brand-500" />
          <span>Notes Summarizer</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Extract core takeaways and summaries from lecture materials</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        
        {/* Left Input Section */}
        <div className="space-y-6">
          <div className="glass-card p-6 border-slate-200 dark:border-dark-800 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Upload Syllabus / File</h3>
            
            {/* Drag & Drop Area */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                dragOver 
                  ? 'border-brand-500 bg-brand-500/5' 
                  : selectedFile 
                    ? 'border-emerald-600 bg-emerald-950/5' 
                    : 'border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-900/30 hover:border-slate-300 dark:hover:border-dark-600'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt"
                className="hidden"
              />
              
              <div className="flex flex-col items-center gap-3">
                <div className={`p-3 rounded-xl border ${selectedFile ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-dark-850 border-slate-200 dark:border-dark-750 text-slate-400'}`}>
                  <Upload className="h-6 w-6" />
                </div>
                
                {selectedFile ? (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white truncate max-w-xs">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-white">Click or drag PDF / TXT here</p>
                    <p className="text-xs text-slate-550 dark:text-slate-550 mt-1">Maximum file size 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* OR text separator */}
            <div className="flex items-center gap-3 py-2">
              <div className="flex-1 h-px bg-slate-200 dark:bg-dark-850" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">OR</span>
              <div className="flex-1 h-px bg-slate-200 dark:bg-dark-850" />
            </div>

            {/* Text Field */}
            <div className="flex flex-col gap-1.5">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Paste raw notes content</h4>
              <textarea
                value={textContent}
                disabled={!!selectedFile}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste outline notes, chapter texts, or copy-paste lecture drafts..."
                rows="6"
                className="custom-input resize-none disabled:opacity-40 disabled:cursor-not-allowed"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <button
                onClick={handleSummarize}
                disabled={loading || (!selectedFile && !textContent.trim())}
                className="btn-primary flex-1 disabled:opacity-50"
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
              {(selectedFile || textContent) && (
                <button
                  onClick={handleClear}
                  disabled={loading}
                  className="btn-secondary"
                >
                  Clear
                </button>
              )}
            </div>

          </div>
        </div>

        {/* Right Output Section */}
        <div className="h-full">
          <div className="glass-card p-6 border-slate-200 dark:border-dark-800 h-full flex flex-col min-h-[400px]">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-dark-850 pb-4 mb-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">AI study Summary</h3>
              {summary && (
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-1 text-xs font-semibold text-slate-650 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white px-3 py-1.5 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-800 rounded-lg transition"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500 dark:text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              )}
            </div>

            {/* Scrollable Summary Display Area */}
            <div className="flex-1 overflow-y-auto max-h-[500px] text-slate-700 dark:text-slate-300 leading-relaxed text-sm pr-1">
              <AnimatePresence mode="wait">
                {loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full flex items-center justify-center flex-col gap-4 py-20"
                  >
                    <Loader size="md" />
                    <p className="text-xs text-slate-500 italic">Processing text tokens & consolidating notes...</p>
                  </motion.div>
                ) : summary ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="space-y-4"
                  >
                    {summary.split('\n').map((line, i) => (
                      <React.Fragment key={i}>
                        {parseMarkdownLine(line)}
                      </React.Fragment>
                    ))}
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="h-full flex flex-col items-center justify-center text-center text-slate-400 dark:text-slate-500 py-20 gap-3"
                  >
                    <AlertCircle className="h-10 w-10 text-slate-300 dark:text-dark-700" />
                    <div>
                      <p className="font-semibold text-sm">No summary active</p>
                      <p className="text-xs mt-1 max-w-xs mx-auto">Upload a syllabus PDF or write content on the left to start the deep summaries.</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default NotesSummarizer;
