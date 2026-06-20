import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { 
  ArrowRight, 
  MessageSquareCode, 
  FileText, 
  HelpCircle, 
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion } from 'framer-motion';
import FeatureCard from '../components/featureCard';

/**
 * Public Home Page containing Hero section, Features, CTA, and Stats (light/dark theme responsive).
 */
const Home = () => {
  const { token } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
  };

  return (
    <div className="relative overflow-hidden pt-12 pb-24 transition-colors duration-200">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/2 right-10 w-[300px] h-[300px] bg-indigo-500/5 dark:bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center max-w-3xl mx-auto flex flex-col items-center gap-6"
        >
          {/* Tag banner */}
          <motion.div
            variants={itemVariants}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-semibold text-brand-700 dark:text-brand-300 uppercase tracking-wider"
          >
            <Sparkles className="h-3.5 w-3.5 text-brand-600 dark:text-brand-400" />
            <span>AI-Powered Study Buddy</span>
          </motion.div>

          {/* Heading */}
          <motion.h1
            variants={itemVariants}
            className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight"
          >
            Study Smarter, Not Harder With <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-500 dark:from-brand-400 dark:to-violet-400">AI Assistance</span>
          </motion.h1>

          {/* Subheading */}
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg text-slate-600 dark:text-slate-400 max-w-xl leading-relaxed"
          >
            Unlock your full learning potential. Instantly chat with your personalized tutor, summarize comprehensive notes files, and evaluate your knowledge with custom generated quizzes.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div variants={itemVariants} className="flex flex-wrap gap-4 justify-center mt-2 w-full max-w-xs sm:max-w-md">
            {token ? (
              <Link to="/dashboard" className="btn-primary w-full sm:w-auto">
                <span>Go to Dashboard</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <>
                <Link to="/register" className="btn-primary w-full sm:w-auto">
                  <span>Start Studying Free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link to="/about" className="btn-secondary w-full sm:w-auto">
                  <span>Learn More</span>
                </Link>
              </>
            )}
          </motion.div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 p-6 glass-card border-slate-200 dark:border-dark-800 text-center"
        >
          <div>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">99%</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase mt-1">Accuracy Rate</p>
          </div>
          <div className="border-l border-slate-200 dark:border-dark-800">
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">10k+</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase mt-1">Active Students</p>
          </div>
          <div className="border-l border-slate-200 dark:border-dark-800">
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">50k+</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase mt-1">Quizzes Taken</p>
          </div>
          <div className="border-l border-slate-200 dark:border-dark-800">
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white">2.5M</p>
            <p className="text-xs sm:text-sm text-slate-500 font-medium uppercase mt-1">Summarized Pages</p>
          </div>
        </motion.div>

        {/* Features Section */}
        <div className="mt-32">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
              Equipped with Premium Features
            </h2>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Discover how AI-powered buddy changes the way you study, memorize, and prepare for academic evaluations.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FeatureCard
              icon={<MessageSquareCode className="h-6 w-6" />}
              title="Interactive AI Chat"
              description="Discuss complicated concepts with an AI study companion. Receive detailed explanations, code snips, or definitions instantly."
              to="/dashboard/chat"
              delay={0.1}
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6" />}
              title="Notes Summarizer"
              description="Upload PDF slides or copy-paste lecture outlines. Extract main thesis statements, summaries, and action steps in seconds."
              to="/dashboard/summarizer"
              delay={0.2}
            />
            <FeatureCard
              icon={<HelpCircle className="h-6 w-6" />}
              title="Quiz Generator"
              description="Convert reading materials into multiple-choice tests. Test active recall, review correct definitions, and track your metrics."
              to="/dashboard/quiz"
              delay={0.3}
            />
          </div>
        </div>

        {/* CTA section banner */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-32 p-8 sm:p-12 glass-card border-brand-500/20 bg-gradient-to-br from-white via-brand-50/20 to-brand-100/10 dark:from-dark-900/80 dark:via-dark-900/50 dark:to-brand-950/20 relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8"
        >
          {/* Glow */}
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-brand-500/5 dark:bg-brand-500/20 rounded-full blur-2xl pointer-events-none" />
          
          <div className="max-w-xl text-center md:text-left">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Ready to transform your grades?</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
              Create your account now and start studying smarter. Full access to chat, summaries, and assessments included.
            </p>
          </div>
          
          <div className="flex-shrink-0 w-full md:w-auto">
            <Link to={token ? "/dashboard" : "/register"} className="btn-primary w-full md:w-auto">
              <span>Start Free Journey</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Home;
