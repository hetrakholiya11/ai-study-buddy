import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Quiz Card MCQ renderer showing selection states and result feedback (light/dark theme responsive).
 */
const QuizCard = ({
  questionNumber,
  totalQuestions,
  questionData,
  selectedOption,
  onSelectOption,
  showResult,
}) => {
  const { question, options, correctAnswer, explanation } = questionData;

  return (
    <div className="glass-card p-6 sm:p-8 flex flex-col gap-6">
      {/* Quiz Progress header */}
      <div className="flex justify-between items-center border-b border-slate-100 dark:border-dark-800 pb-4">
        <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-widest">
          Question {questionNumber} of {totalQuestions}
        </span>
      </div>

      {/* Question Text */}
      <h3 className="text-lg sm:text-xl font-bold leading-relaxed text-slate-800 dark:text-white">
        {question}
      </h3>

      {/* Options List */}
      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
          const isSelected = selectedOption === index;
          const isCorrect = correctAnswer === index;
          
          let btnClass = "border-slate-200 dark:border-dark-700 bg-slate-50/50 dark:bg-dark-900/30 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-dark-800 hover:border-slate-300 dark:hover:border-dark-600";
          let statusIcon = null;

          if (showResult) {
            if (isCorrect) {
              btnClass = "border-emerald-600 bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 pointer-events-none";
              statusIcon = <CheckCircle2 className="h-5 w-5 text-emerald-500 dark:text-emerald-400 flex-shrink-0" />;
            } else if (isSelected && !isCorrect) {
              btnClass = "border-rose-600 bg-rose-950/20 text-rose-700 dark:text-rose-300 pointer-events-none";
              statusIcon = <XCircle className="h-5 w-5 text-rose-500 dark:text-rose-400 flex-shrink-0" />;
            } else {
              btnClass = "border-slate-100 dark:border-dark-800 bg-slate-100/50 dark:bg-dark-950/50 text-slate-400 dark:text-slate-500 pointer-events-none";
            }
          } else if (isSelected) {
            btnClass = "border-brand-500 bg-brand-500/10 text-brand-700 dark:text-brand-300 shadow-md shadow-brand-500/5";
          }

          return (
            <button
              key={index}
              disabled={showResult}
              onClick={() => onSelectOption(index)}
              className={`flex items-start justify-between gap-4 p-4 rounded-xl border text-left font-medium text-sm transition-all focus:outline-none ${btnClass}`}
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <span className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-dark-800 border border-slate-200 dark:border-dark-700 flex items-center justify-center text-xs font-bold text-slate-500 dark:text-slate-400 flex-shrink-0 mt-0.5">
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="break-words flex-1 min-w-0 leading-relaxed">{option}</span>
              </div>
              {statusIcon && <div className="flex-shrink-0 mt-0.5">{statusIcon}</div>}
            </button>
          );
        })}
      </div>

      {/* Explanation container (renders when result is evaluated) */}
      {showResult && explanation && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mt-4 p-4 rounded-xl bg-slate-100/80 dark:bg-dark-900/80 border border-slate-200 dark:border-dark-800 text-sm leading-relaxed text-slate-600 dark:text-slate-400"
        >
          <span className="font-bold text-brand-600 dark:text-brand-400 block mb-1">Explanation:</span>
          {explanation}
        </motion.div>
      )}
    </div>
  );
};

export default QuizCard;
