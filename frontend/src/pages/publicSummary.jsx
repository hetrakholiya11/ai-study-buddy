import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { aiService } from '../services/aiService';
import Loader from '../components/loader';
import { 
  FileText, 
  Sparkles, 
  Download, 
  AlertCircle, 
  BookOpen,
  ArrowLeft,
  Calendar,
  Eye
} from 'lucide-react';
import { motion } from 'framer-motion';

// Inline formatting parser (copied from notesSummarizer.jsx for layout consistency)
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
        <code key={index} className="bg-slate-200/60 dark:bg-dark-950 px-1.5 py-0.5 rounded text-xs font-mono text-rose-650 dark:text-rose-400">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
};

// Markdown line parser (copied from notesSummarizer.jsx for layout consistency)
const parseMarkdownLine = (line) => {
  if (!line || typeof line !== 'string') return null;
  const headerMatch = line.match(/^(#{1,6})\s+(.*)$/);
  if (headerMatch) {
    const level = headerMatch[1].length;
    const text = headerMatch[2];
    const parsedText = parseInlineFormatting(text);
    if (level === 1) return <h1 className="text-2xl font-extrabold mt-6 mb-3 text-slate-900 dark:text-white border-b pb-2 border-slate-200 dark:border-dark-800">{parsedText}</h1>;
    if (level === 2) return <h2 className="text-xl font-bold mt-5 mb-2.5 text-slate-900 dark:text-white">{parsedText}</h2>;
    if (level === 3) return <h3 className="text-lg font-bold mt-4 mb-2 text-slate-900 dark:text-white">{parsedText}</h3>;
    return <h4 className="text-base font-semibold text-brand-650 dark:text-brand-400 mt-3 mb-1.5">{parsedText}</h4>;
  }

  const bulletMatch = line.match(/^(\*|-)\s+(.*)$/);
  if (bulletMatch) {
    const text = bulletMatch[2];
    return (
      <li className="list-disc list-inside ml-4 mb-1.5 text-slate-700 dark:text-slate-350">
        {parseInlineFormatting(text)}
      </li>
    );
  }

  const listMatch = line.match(/^(\d+)\.\s+(.*)$/);
  if (listMatch) {
    const num = listMatch[1];
    const text = listMatch[2];
    return (
      <div className="flex items-start gap-2 ml-4 mb-1.5 text-slate-700 dark:text-slate-350">
        <span className="font-bold text-slate-900 dark:text-white">{num}.</span>
        <span>{parseInlineFormatting(text)}</span>
      </div>
    );
  }

  if (line.trim() === '') return <div className="h-3" />;
  return <p className="mb-2 leading-relaxed text-sm text-slate-700 dark:text-slate-350">{parseInlineFormatting(line)}</p>;
};

/**
 * Public unauthenticated note summary and scenario questions detail page layout.
 * Supports clean PDF outputs through standard CSS print overlays.
 */
const PublicSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [revealedAnswers, setRevealedAnswers] = useState({});

  useEffect(() => {
    fetchSharedData();
  }, [id]);

  const fetchSharedData = async () => {
    setLoading(true);
    try {
      const data = await aiService.getPublicSummaryById(id);
      if (data && data.summary) {
        setSummary(data.summary);
      } else {
        setError('Study notes summary not found.');
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to retrieve notes summary information.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = () => {
    if (!summary) return;
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const baseUrl = isLocal ? 'http://localhost:5000' : 'https://ai-study-buddy-backend-gipu.onrender.com';
    const downloadUrl = `${baseUrl}/api/notes/public/${summary._id}/pdf`;
    window.open(downloadUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-3">
        <Loader size="md" />
        <p className="text-xs text-slate-500 italic animate-pulse">Loading shared notes content...</p>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 glass-card text-center space-y-4 border-rose-500/20">
        <div className="p-3 bg-rose-500/10 text-rose-500 rounded-full inline-block">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Failed to Load Notes</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">{error || 'Notes summary could not be retrieved.'}</p>
        <button
          onClick={() => navigate('/')}
          className="btn-secondary text-xs px-5 py-2 inline-flex"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  const formattedDate = new Date(summary.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8 print-container relative transition-colors duration-250">
      
      {/* CSS Print Stylesheet Injector */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          /* Global resets */
          body {
            background-color: #ffffff !important;
            background-image: none !important;
            color: #000000 !important;
            font-size: 12pt !important;
          }
          /* Hide non-printable web elements */
          .no-print, header, footer, .sidebar, button, .theme-toggle-btn {
            display: none !important;
          }
          /* Remove page layouts shadows */
          .print-container {
            width: 100% !important;
            max-width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          /* Style printable cards nicely */
          .print-card {
            page-break-inside: avoid !important;
            border: 1px solid #e2e8f0 !important;
            border-radius: 12px !important;
            background-color: #f8fafc !important;
            padding: 20px !important;
            margin-bottom: 25px !important;
            color: #000000 !important;
          }
          /* Force solutions to reveal on printed sheets */
          .print-solution {
            display: block !important;
            opacity: 1 !important;
            margin-top: 15px !important;
            padding: 15px !important;
            border-left: 4px solid #10b981 !important;
            background-color: #ecfdf5 !important;
          }
          .solution-toggle-btn {
            display: none !important;
          }
        }
      `}} />

      {/* Header bar (no-print) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print border-b pb-5 border-slate-200 dark:border-dark-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-550 dark:text-slate-450">
            <Eye className="h-4 w-4 text-emerald-500" />
            <span>Shared Note Summary Preview</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">
            {summary.title}
          </h1>
          <div className="flex items-center gap-1.5 text-xs text-slate-455">
            <Calendar className="h-3.5 w-3.5" />
            <span>Generated on {formattedDate}</span>
          </div>
        </div>

        <div className="flex gap-3 w-full sm:w-auto">
          <button
            onClick={() => navigate('/')}
            className="btn-secondary py-2.5 px-4 text-xs font-semibold flex-1 sm:flex-initial"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Home</span>
          </button>
          <button
            onClick={handleDownloadPDF}
            className="btn-primary py-2.5 px-5 text-xs font-semibold flex-1 sm:flex-initial"
          >
            <Download className="h-4 w-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Print Document Header (Visible only when printed) */}
      <div className="hidden print:block text-left border-b-2 border-slate-900 pb-4 mb-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-slate-500">Study Buddy notes summary</h2>
        <h1 className="text-3xl font-extrabold text-black mt-1">{summary.title}</h1>
        <p className="text-xs text-slate-655 mt-1.5 font-medium">Shared Revision Outline • Compiled on {formattedDate}</p>
      </div>

      {/* Main Study Summary content */}
      <div className="glass-card p-6 sm:p-8 border-slate-200 dark:border-dark-800 text-left print-container">
        <div className="flex items-center gap-2 text-xs font-extrabold text-brand-650 dark:text-brand-400 uppercase tracking-wider mb-6 no-print">
          <FileText className="h-5 w-5" />
          <span>Core Study Outline</span>
        </div>
        
        <div className="space-y-4 print:text-black">
          {(summary.summaryText || '').split('\n').map((line, i) => (
            <React.Fragment key={i}>
              {parseMarkdownLine(line)}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Scenario-based exam prep questions */}
      {summary.scenarios && Array.isArray(summary.scenarios) && summary.scenarios.length > 0 && (
        <div className="space-y-6 text-left">
          
          <div className="flex items-center gap-2 text-xs font-extrabold text-brand-650 dark:text-brand-400 uppercase tracking-wider no-print">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <span>Exam Scenario Prep Questions</span>
          </div>

          <div className="hidden print:block border-b border-black pb-2 mt-8">
            <h2 className="text-lg font-bold text-black uppercase tracking-wide">Exam Scenario Questions</h2>
          </div>

          <div className="space-y-6">
            {summary.scenarios.map((sc, index) => {
              const isRevealed = !!revealedAnswers[index];
              
              return (
                <div 
                  key={sc.id || index}
                  className="glass-card p-6 border-slate-200 dark:border-dark-850 print-card space-y-4"
                >
                  <div>
                    <span className="text-[10px] font-bold text-brand-500 print:text-black uppercase tracking-widest block mb-1">
                      Scenario Question {index + 1}
                    </span>
                    <p className="text-xs text-slate-500 dark:text-slate-400 italic bg-slate-50 dark:bg-dark-950/40 p-3 rounded-xl border border-slate-200/50 dark:border-dark-800/85 leading-relaxed print:bg-white print:border-none print:p-0 print:m-0 print:text-black">
                      "{sc.scenario}"
                    </p>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-455 uppercase tracking-wider print:text-black">Question Topic:</p>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-white print:text-black">
                      {parseInlineFormatting(sc.question)}
                    </p>
                  </div>

                  {/* Toggle reveal button (no-print) */}
                  <div className="flex justify-between items-center no-print pt-2 border-t border-slate-200/60 dark:border-dark-850">
                    <span className="text-[10px] text-slate-400 italic">Review notes before opening solution.</span>
                    <button
                      onClick={() => setRevealedAnswers(prev => ({ ...prev, [index]: !isRevealed }))}
                      className="solution-toggle-btn px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-dark-750 bg-white dark:bg-dark-800 hover:bg-slate-100 dark:hover:bg-dark-700 text-slate-700 dark:text-slate-350 shadow-sm transition"
                    >
                      {isRevealed ? 'Hide Solution' : 'Reveal Solution'}
                    </button>
                  </div>

                  {/* Solution display (visible on toggled screen OR always visible when printed) */}
                  {(isRevealed || true) && (
                    <div className={`print-solution ${isRevealed ? 'block' : 'hidden print:block'} bg-emerald-500/5 dark:bg-emerald-950/10 border border-emerald-500/20 p-4 rounded-xl space-y-2 text-xs`}>
                      <p className="font-extrabold text-emerald-800 dark:text-emerald-400 print:text-black uppercase tracking-wider text-[10px]">
                        Correct Answer / Explanation:
                      </p>
                      <p className="font-semibold text-slate-800 dark:text-white print:text-black leading-relaxed">
                        {parseInlineFormatting(sc.answer)}
                      </p>
                      <div className="pt-2 mt-2 border-t border-emerald-500/10 space-y-1">
                        <p className="font-extrabold text-slate-450 uppercase tracking-wider text-[9px] print:text-black">Step-by-Step Explanation:</p>
                        <div className="text-slate-655 dark:text-slate-400 print:text-black leading-relaxed space-y-1">
                          {(sc.explanation || '').split('\n').map((line, i) => (
                            <React.Fragment key={i}>
                              {parseMarkdownLine(line)}
                            </React.Fragment>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* Printable page brand footer */}
      <div className="hidden print:block text-center border-t-2 border-slate-200 pt-4 mt-12 text-[10px] text-slate-455 font-medium">
        <BookOpen className="h-4 w-4 text-slate-455 inline-block mr-1 align-middle" />
        <span>Generated with StudyBuddy - AI-Powered Study Companion</span>
      </div>

    </div>
  );
};

export default PublicSummary;
