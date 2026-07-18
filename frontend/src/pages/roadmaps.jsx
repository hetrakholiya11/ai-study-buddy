import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Map, 
  Upload, 
  Sparkles, 
  Trash2, 
  Calendar, 
  Plus, 
  Clock, 
  BookOpen, 
  ArrowRight,
  FileText,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { roadmapService } from '../services/roadmapService';
import { useToast } from '../context/toastContext';

/**
 * Roadmaps Page: Manage, create, and list deconstructed study roadmaps (theme responsive).
 */
const Roadmaps = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  
  // Form States
  const [timeframe, setTimeframe] = useState('4 Weeks');
  const [textInput, setTextInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [dragOver, setDragOver] = useState(false);

  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchRoadmaps();
  }, []);

  const fetchRoadmaps = async () => {
    setLoading(true);
    try {
      const data = await roadmapService.getUserRoadmaps();
      if (data && data.roadmaps) {
        setRoadmaps(data.roadmaps);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to fetch roadmaps history', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
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
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      const validExtensions = ['.pdf', '.txt', '.docx', '.pptx'];
      const fileExt = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
      
      if (validExtensions.includes(fileExt)) {
        setSelectedFile(file);
      } else {
        showToast('Invalid file format. Please upload PDF, TXT, DOCX, or PPTX.', 'error');
      }
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!textInput.trim() && !selectedFile) {
      showToast('Please paste a syllabus outline or upload a syllabus file.', 'warning');
      return;
    }

    setGenerating(true);
    try {
      const payload = {
        timeframe,
        text: textInput,
        files: selectedFile ? [selectedFile] : null
      };

      const data = await roadmapService.generateRoadmap(payload);
      if (data && data.roadmap) {
        showToast('Roadmap generated successfully by AI!', 'success');
        
        // Reset states
        setTextInput('');
        setSelectedFile(null);
        setShowCreateForm(false);
        
        // Navigate directly to the new roadmap detail view
        navigate(`/dashboard/roadmaps/${data.roadmap._id}`);
      }
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to deconstruct syllabus', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (e, id) => {
    e.stopPropagation(); // Stop navigation click trigger
    if (!window.confirm('Are you sure you want to delete this study roadmap? This action is permanent.')) {
      return;
    }

    try {
      await roadmapService.deleteRoadmap(id);
      setRoadmaps(roadmaps.filter(r => r._id !== id));
      showToast('Roadmap deleted successfully', 'info');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Failed to delete roadmap', 'error');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto transition-colors duration-200">
      
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Map className="h-8 w-8 text-brand-600 dark:text-brand-400" />
            Study Roadmaps
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Deconstruct complex course syllabi into step-by-step interactive milestones
          </p>
        </div>
        
        {!showCreateForm && (
          <button
            onClick={() => setShowCreateForm(true)}
            className="btn-primary"
          >
            <Plus className="h-5 w-5" />
            <span>New Roadmap</span>
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* Syllabus Input Form Card */}
        {showCreateForm && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="glass-card p-6 sm:p-8 relative border-brand-500/20"
          >
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500 animate-pulse" />
              AI Syllabus Deconstructor
            </h2>

            <form onSubmit={handleGenerate} className="space-y-6">
              
              {/* Syllabus Source Input Selection */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Text paste area */}
                <div className="flex flex-col space-y-2">
                  <label htmlFor="syllabusText" className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Option A: Copy & Paste Syllabus
                  </label>
                  <textarea
                    id="syllabusText"
                    rows={8}
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder="Paste course descriptions, units, syllabus topics, grading parameters, or curriculum text directly here..."
                    className="custom-input resize-none h-full"
                    disabled={generating}
                  />
                </div>

                {/* File Upload drag and drop */}
                <div className="flex flex-col space-y-2">
                  <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Option B: Upload Syllabus File
                  </label>
                  
                  <div
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`flex-1 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center p-6 text-center transition-colors ${
                      dragOver 
                        ? 'border-brand-500 bg-brand-50/10 dark:bg-brand-950/10' 
                        : selectedFile
                          ? 'border-emerald-500 bg-emerald-50/5 dark:bg-emerald-950/5'
                          : 'border-slate-300 dark:border-dark-700 hover:border-brand-400'
                    }`}
                  >
                    <input
                      type="file"
                      id="fileInput"
                      accept=".pdf,.txt,.docx,.pptx"
                      onChange={handleFileChange}
                      className="hidden"
                      disabled={generating}
                    />

                    {selectedFile ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl inline-block">
                          <FileText className="h-8 w-8" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{selectedFile.name}</p>
                          <p className="text-xs text-slate-455">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="text-xs text-rose-500 font-medium hover:underline"
                          disabled={generating}
                        >
                          Remove file
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="p-3 bg-slate-100 dark:bg-dark-800 text-slate-500 dark:text-slate-400 rounded-xl inline-block">
                          <Upload className="h-8 w-8" />
                        </div>
                        <div>
                          <label htmlFor="fileInput" className="text-sm font-bold text-brand-650 hover:text-brand-500 cursor-pointer hover:underline">
                            Click to upload
                          </label>
                          <span className="text-sm text-slate-500 dark:text-slate-400"> or drag & drop</span>
                          <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Supports PDF, DOCX, PPTX, or TXT (Max 10MB)</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

              </div>

              {/* Timeframe selector */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-200 dark:border-dark-800">
                <div className="flex items-center gap-3">
                  <Clock className="h-5 w-5 text-slate-400" />
                  <div>
                    <label htmlFor="timeframe" className="block text-sm font-semibold text-slate-800 dark:text-slate-200">
                      Study Timeframe
                    </label>
                    <p className="text-xs text-slate-500">AI will slice the modules to fit this schedule</p>
                  </div>
                  <select
                    id="timeframe"
                    value={timeframe}
                    onChange={(e) => setTimeframe(e.target.value)}
                    className="custom-input py-2 px-3 text-sm focus:ring-1 focus:ring-brand-500 bg-white dark:bg-dark-900 border border-slate-200 dark:border-dark-700 rounded-xl ml-2 font-medium"
                    disabled={generating}
                  >
                    <option value="4 Weeks">4 Weeks (Standard)</option>
                    <option value="8 Weeks">8 Weeks (Term Prep)</option>
                    <option value="12 Weeks">12 Weeks (Semester)</option>
                    <option value="Self-Paced">Self-Paced / Open ended</option>
                  </select>
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="btn-secondary py-2.5 px-5 text-sm"
                    disabled={generating}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary py-2.5 px-6 text-sm"
                    disabled={generating}
                  >
                    {generating ? (
                      <>
                        <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Deconstructing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Generate Roadmap</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Roadmaps History / Main List */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Your Learning Paths</h2>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 space-y-3">
            <div className="h-10 w-10 border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading your syllabus paths...</p>
          </div>
        ) : roadmaps.length === 0 ? (
          <div className="glass-card p-12 text-center max-w-xl mx-auto space-y-4">
            <div className="p-4 bg-brand-500/10 text-brand-600 dark:text-brand-400 rounded-full inline-block">
              <Map className="h-10 w-10" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Roadmaps Found</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                You haven't generated any study roadmaps yet. Upload a syllabus file to create one!
              </p>
            </div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="btn-primary py-2 px-5 text-sm inline-flex"
            >
              Get Started
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roadmaps.map((roadmap) => (
              <motion.div
                key={roadmap._id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => navigate(`/dashboard/roadmaps/${roadmap._id}`)}
                className="glass-card glass-card-hover p-6 cursor-pointer flex flex-col justify-between border-slate-200 dark:border-dark-850 h-52 group relative"
              >
                <div className="space-y-3">
                  <div className="flex justify-between items-start gap-4">
                    <div className="p-2.5 bg-brand-500/10 text-brand-650 dark:text-brand-400 rounded-xl group-hover:scale-110 transition-transform">
                      <BookOpen className="h-5 w-5" />
                    </div>
                    <button
                      onClick={(e) => handleDelete(e, roadmap._id)}
                      aria-label="Delete roadmap"
                      className="p-1.5 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 hover:text-rose-500 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4.5 w-4.5" />
                    </button>
                  </div>

                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-white line-clamp-1 group-hover:text-brand-650 dark:group-hover:text-brand-400 transition-colors">
                      {roadmap.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-455 mt-1.5 font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{roadmap.timeframe}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-dark-850">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-500">Progress</span>
                    <span className="text-brand-650 dark:text-brand-400">{roadmap.progress || 0}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-dark-950 h-2 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${roadmap.progress || 0}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className="bg-gradient-to-r from-brand-500 to-indigo-500 h-full rounded-full"
                    />
                  </div>
                </div>

                <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity max-md:hidden">
                  <ArrowRight className="h-4 w-4 text-brand-600 dark:text-brand-400 animate-pulse" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default Roadmaps;
