import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Map, 
  CheckCircle2, 
  Circle, 
  HelpCircle, 
  MessageSquare, 
  ChevronDown, 
  ChevronUp, 
  Calendar,
  Award,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roadmapService } from '../services/roadmapService';
import { aiService } from '../services/aiService';
import { useToast } from '../context/toastContext';

/**
 * Detailed view of a deconstructed syllabus study roadmap (theme responsive).
 */
const RoadmapDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [roadmap, setRoadmap] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedModuleId, setExpandedModuleId] = useState(1);
  const [actionLoading, setActionLoading] = useState({ type: null, id: null });

  useEffect(() => {
    fetchRoadmapDetails();
  }, [id]);

  const fetchRoadmapDetails = async () => {
    setLoading(true);
    try {
      const data = await roadmapService.getRoadmapById(id);
      if (data && data.roadmap) {
        setRoadmap(data.roadmap);
        
        // Auto-expand the first uncompleted module, or default to module 1
        const firstUncompleted = data.roadmap.modules.find(m => !m.completed);
        if (firstUncompleted) {
          setExpandedModuleId(firstUncompleted.id);
        } else if (data.roadmap.modules.length > 0) {
          setExpandedModuleId(data.roadmap.modules[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load study roadmap details', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (moduleId, taskId, currentStatus) => {
    const updatedStatus = !currentStatus;
    
    // Optimistic UI updates
    setRoadmap((prev) => {
      if (!prev) return null;
      
      let totalTasks = 0;
      let completedTasks = 0;

      const updatedModules = prev.modules.map((mod) => {
        if (mod.id === moduleId) {
          const updatedTasks = mod.tasks.map((task) => {
            if (task.id === taskId) {
              return { ...task, completed: updatedStatus };
            }
            return task;
          });
          const allCompleted = updatedTasks.every(t => t.completed);
          return { ...mod, tasks: updatedTasks, completed: allCompleted };
        }
        return mod;
      });

      updatedModules.forEach((m) => {
        totalTasks += m.tasks.length;
        completedTasks += m.tasks.filter(t => t.completed).length;
      });

      const nextProgress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
      return { ...prev, modules: updatedModules, progress: nextProgress };
    });

    try {
      await roadmapService.toggleTask(id, moduleId, taskId, updatedStatus);
      if (updatedStatus) {
        showToast('Milestone checked! Keep up the momentum.', 'success');
      }
    } catch (err) {
      console.error(err);
      showToast('Failed to save progress to server', 'error');
      // Revert states on failure
      fetchRoadmapDetails();
    }
  };

  const handleQuizIntegration = async (module) => {
    setActionLoading({ type: 'quiz', id: module.id });
    try {
      // Create a quiz on the specific subject/module title
      const data = await aiService.generateQuiz({
        subject: `${roadmap.title} - ${module.title}`,
        numQuestions: 5,
        difficulty: 'Medium',
        text: `This quiz is about: ${module.title}. Description: ${module.description}. Study targets: ${module.tasks.map(t => t.name).join(', ')}`
      });

      if (data && data.quiz) {
        showToast('Generated practice quiz for this module!', 'success');
        navigate('/dashboard/quiz'); // Navigate to quiz lobby where new mock quiz will load
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to generate quiz', 'error');
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  const handleAskBuddyIntegration = async (module) => {
    setActionLoading({ type: 'chat', id: module.id });
    try {
      // Create chat session initialized with this unit context
      const chatTitle = `${module.title.slice(0, 20)}... Help`;
      const context = `Let's discuss "${module.title}" from the course "${roadmap.title}". Here is the module content: "${module.description}". Key tasks: ${module.tasks.map(t => t.name).join(', ')}`;
      
      const data = await aiService.createChat(chatTitle, context, roadmap.title);
      if (data && data.chat) {
        showToast('Connected to AI tutor with module context loaded.', 'success');
        navigate('/dashboard/chat'); // Go to chat where the newly created sidebar chat will list
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to load AI Chat session', 'error');
    } finally {
      setActionLoading({ type: null, id: null });
    }
  };

  const calculateTotalTasks = () => {
    if (!roadmap) return { total: 0, completed: 0 };
    let total = 0;
    let completed = 0;
    roadmap.modules.forEach((m) => {
      total += m.tasks.length;
      completed += m.tasks.filter(t => t.completed).length;
    });
    return { total, completed };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 space-y-3">
        <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 dark:text-slate-400">Deconstructing your roadmap details...</p>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Roadmap Not Found</h3>
        <p className="text-sm text-slate-500">The roadmap you are trying to view does not exist or has been deleted.</p>
        <button onClick={() => navigate('/dashboard/roadmaps')} className="btn-primary py-2 px-5 text-sm inline-flex">
          Back to Roadmaps
        </button>
      </div>
    );
  }

  const { total, completed } = calculateTotalTasks();
  const isFinished = roadmap.progress === 100;

  return (
    <div className="space-y-8 max-w-5xl mx-auto transition-colors duration-200">
      
      {/* Navigation Header */}
      <button
        onClick={() => navigate('/dashboard/roadmaps')}
        className="flex items-center gap-2 text-sm font-semibold text-slate-650 hover:text-brand-600 dark:text-slate-450 dark:hover:text-brand-400 transition-colors"
      >
        <ArrowLeft className="h-4.5 w-4.5" />
        <span>Back to Roadmaps</span>
      </button>

      {/* Main Roadmap Header Panel */}
      <div className="glass-card p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-8 border-brand-500/10">
        
        {/* Course Info */}
        <div className="space-y-3 flex-1 text-center md:text-left">
          <div className="flex items-center gap-2 justify-center md:justify-start">
            <span className="p-1 bg-brand-500/10 text-brand-650 dark:text-brand-400 rounded-lg">
              <Map className="h-5 w-5" />
            </span>
            <span className="text-xs font-semibold text-brand-650 dark:text-brand-400 uppercase tracking-wide">AI Roadmap</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
            {roadmap.title}
          </h1>

          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs text-slate-500 dark:text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4 text-slate-400" />
              Timeframe: {roadmap.timeframe}
            </span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-dark-700" />
            <span>Modules: {roadmap.modules.length}</span>
            <span className="h-1.5 w-1.5 rounded-full bg-slate-300 dark:bg-dark-700" />
            <span>Tasks: {completed}/{total}</span>
          </div>
        </div>

        {/* Circular Progress Meter */}
        <div className="flex-shrink-0 flex items-center gap-6 bg-slate-50/50 dark:bg-dark-955 border border-slate-100 dark:border-dark-850 p-5 rounded-2xl">
          <div className="relative h-20 w-20 flex items-center justify-center">
            {/* SVG circle track */}
            <svg className="absolute transform -rotate-90 w-full h-full">
              <circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-slate-200 dark:stroke-dark-800 fill-transparent"
                strokeWidth="6"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="34"
                className="stroke-brand-500 fill-transparent"
                strokeWidth="6"
                strokeDasharray="213.6"
                initial={{ strokeDashoffset: 213.6 }}
                animate={{ strokeDashoffset: 213.6 - (213.6 * (roadmap.progress || 0)) / 100 }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <span className="text-lg font-black text-slate-900 dark:text-white">{roadmap.progress || 0}%</span>
          </div>

          <div className="space-y-0.5">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Overall Score</p>
            <h4 className="text-lg font-black text-slate-800 dark:text-slate-150">
              {isFinished ? 'Completed!' : 'In Progress'}
            </h4>
            {isFinished && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 uppercase tracking-wider mt-1">
                <Award className="h-3.5 w-3.5" />
                Syllabus Mastered
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Learning timeline vertical progress nodes */}
      <div className="relative pl-6 md:pl-10 space-y-8">
        
        {/* Line vertical bar overlay */}
        <div className="absolute left-3 md:left-[21px] top-4 bottom-4 w-0.5 bg-slate-200 dark:bg-dark-800 z-0" />

        {roadmap.modules.map((module, mIndex) => {
          const isExpanded = expandedModuleId === module.id;
          
          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: mIndex * 0.05 }}
              className="relative z-10 space-y-4"
            >
              
              {/* Timeline Indicator Node */}
              <div 
                className={`absolute -left-9 md:-left-13 h-7 w-7 rounded-full flex items-center justify-center border transition-all duration-300 ${
                  module.completed
                    ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'bg-white border-slate-350 dark:bg-dark-900 dark:border-dark-750 text-slate-400'
                }`}
              >
                {module.completed ? (
                  <CheckCircle2 className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-bold">{module.id}</span>
                )}
              </div>

              {/* Module Header Card */}
              <div 
                onClick={() => setExpandedModuleId(isExpanded ? null : module.id)}
                className={`glass-card p-5 sm:p-6 cursor-pointer border hover:border-brand-500/30 transition-all select-none ${
                  isExpanded ? 'ring-1 ring-brand-500/30' : 'glass-card-hover'
                }`}
              >
                <div className="flex justify-between items-center gap-4">
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold text-brand-650 dark:text-brand-400 bg-brand-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                        {module.duration}
                      </span>
                      {module.completed && (
                        <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase tracking-wider">
                          Ready
                        </span>
                      )}
                    </div>
                    
                    <h3 className="font-extrabold text-lg text-slate-900 dark:text-white group-hover:text-brand-600 transition-colors">
                      {module.title}
                    </h3>
                    
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1 leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  <div className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-455">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>

                {/* Collapsible content (Accordion Tasks & Actions) */}
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                      onClick={(e) => e.stopPropagation()} // Stop accordion toggling when clicking checklist items
                    >
                      <div className="pt-6 mt-5 border-t border-slate-200/60 dark:border-dark-850/80 space-y-6">
                        
                        {/* Tasks Checklist */}
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold text-slate-400 dark:text-slate-550 uppercase tracking-wider">
                            Action Checklists
                          </h4>

                          <div className="space-y-2.5">
                            {module.tasks.map((task) => (
                              <div
                                key={task.id}
                                onClick={() => handleToggleTask(module.id, task.id, task.completed)}
                                className={`flex items-start gap-3 p-3 rounded-xl border border-slate-100 dark:border-dark-850 hover:bg-slate-50/50 dark:hover:bg-dark-950/20 cursor-pointer select-none transition-all ${
                                  task.completed 
                                    ? 'bg-emerald-50/10 dark:bg-emerald-950/5 border-emerald-500/10'
                                    : ''
                                }`}
                              >
                                <div className="flex-shrink-0 mt-0.5">
                                  {task.completed ? (
                                    <CheckCircle2 className="h-4.5 w-4.5 text-emerald-500" />
                                  ) : (
                                    <Circle className="h-4.5 w-4.5 text-slate-350 dark:text-dark-700 hover:text-brand-500" />
                                  )}
                                </div>
                                <span className={`text-sm font-medium leading-tight ${
                                  task.completed 
                                    ? 'text-slate-400 line-through' 
                                    : 'text-slate-700 dark:text-slate-300'
                                }`}>
                                  {task.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Integration Action buttons */}
                        <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100 dark:border-dark-850">
                          <button
                            onClick={() => handleQuizIntegration(module)}
                            disabled={actionLoading.type !== null}
                            className="btn-secondary py-2 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                          >
                            {actionLoading.type === 'quiz' && actionLoading.id === module.id ? (
                              <span className="h-3.5 w-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <HelpCircle className="h-4 w-4 text-indigo-500" />
                            )}
                            <span>Practice Quiz</span>
                          </button>

                          <button
                            onClick={() => handleAskBuddyIntegration(module)}
                            disabled={actionLoading.type !== null}
                            className="btn-secondary py-2 px-4 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 shadow-sm"
                          >
                            {actionLoading.type === 'chat' && actionLoading.id === module.id ? (
                              <span className="h-3.5 w-3.5 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <MessageSquare className="h-4 w-4 text-brand-500" />
                            )}
                            <span>Ask Study Buddy</span>
                          </button>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

              </div>

            </motion.div>
          );
        })}
      </div>

    </div>
  );
};

export default RoadmapDetail;
