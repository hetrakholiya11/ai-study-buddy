import React from 'react';
import { useAuth } from '../context/authContext';
import { 
  Sparkles, 
  MessageSquareCode, 
  FileText, 
  HelpCircle, 
  Calendar, 
  GraduationCap, 
  Clock, 
  CheckSquare 
} from 'lucide-react';
import { motion } from 'framer-motion';
import FeatureCard from '../components/featureCard';

/**
 * Protected Dashboard Page showing welcome banner, study stats, and feature shortcuts (theme responsive).
 */
const Dashboard = () => {
  const { user } = useAuth();
  
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const stats = [
    { 
      label: "Quizzes Completed", 
      value: user?.quizzesCompleted !== undefined ? user.quizzesCompleted.toString() : "0", 
      icon: <CheckSquare className="h-4 w-4 text-emerald-500 dark:text-emerald-400" /> 
    },
    { 
      label: "Study Streak", 
      value: user?.studyStreak !== undefined ? `${user.studyStreak} Days` : "0 Days", 
      icon: <Sparkles className="h-4 w-4 text-amber-500 dark:text-amber-400" /> 
    },
    { 
      label: "Summaries Generated", 
      value: user?.summariesGenerated !== undefined ? user.summariesGenerated.toString() : "0", 
      icon: <FileText className="h-4 w-4 text-indigo-500 dark:text-indigo-400" /> 
    },
    { 
      label: "Study Hours", 
      value: user?.studyMinutes !== undefined ? `${(user.studyMinutes / 60).toFixed(1)} hrs` : "0.0 hrs", 
      icon: <Clock className="h-4 w-4 text-rose-500 dark:text-rose-400" /> 
    }
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto transition-colors duration-200">
      
      {/* Top Welcome Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">Study Hub</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your personalized learning modules</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-dark-900 border border-slate-200 dark:border-dark-800 px-4 py-2.5 rounded-xl">
          <Calendar className="h-4 w-4 text-brand-600 dark:text-brand-400" />
          <span>{today}</span>
        </div>
      </div>

      {/* Welcome Card Banner */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card border-brand-500/20 bg-gradient-to-br from-white via-brand-50/20 to-brand-100/10 dark:from-dark-900 dark:via-dark-900/50 dark:to-brand-950/20 p-6 sm:p-8 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="space-y-3 max-w-xl text-center md:text-left relative z-10">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 tracking-wider uppercase">Active Session</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Hello, {user?.name || 'Scholar'}!
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed">
            Your study streak is active. Keep going! Access your AI assistant below to clear up difficult topics, extract notes structures, or test your memory metrics.
          </p>
        </div>
        
        <div className="flex-shrink-0 p-4 bg-brand-500/10 border border-brand-500/20 rounded-2xl relative z-10">
          <GraduationCap className="h-12 w-12 text-brand-600 dark:text-brand-400" />
        </div>
      </motion.div>

      {/* Stats Counter Section */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="glass-card p-5 flex items-center justify-between border-slate-200 dark:border-dark-850"
          >
            <div>
              <p className="text-2xl font-extrabold text-slate-900 dark:text-white">{stat.value}</p>
              <p className="text-xs text-slate-500 dark:text-slate-500 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
            <div className="p-2.5 bg-slate-100 dark:bg-dark-950 border border-slate-200 dark:border-dark-800 rounded-xl">
              {stat.icon}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Features Navigation Section */}
      <div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">AI Study Companions</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FeatureCard
            icon={<MessageSquareCode className="h-6 w-6" />}
            title="AI Chat Buddy"
            description="Discuss complicated syllabus items, review equations, or debug code samples instantly with your responsive personal tutor."
            to="/dashboard/chat"
          />
          <FeatureCard
            icon={<FileText className="h-6 w-6" />}
            title="Notes Summarizer"
            description="Upload study slides or lecture notes. Generate bulleted outlines, main concepts, and action summaries instantly."
            to="/dashboard/summarizer"
          />
          <FeatureCard
            icon={<HelpCircle className="h-6 w-6" />}
            title="Quiz Generator"
            description="Generate customized multiple-choice tests on any subject. Practice recall, review answers, and receive detailed clarifications."
            to="/dashboard/quiz"
          />
        </div>
      </div>

    </div>
  );
};

export default Dashboard;
