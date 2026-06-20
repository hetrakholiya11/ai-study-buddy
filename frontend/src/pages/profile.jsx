import React, { useState } from 'react';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { User, Mail, BookOpen, Save, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Protected Profile Page showing account details and options to modify name or goals (theme responsive).
 */
const Profile = () => {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    studyGoals: user?.studyGoals || '',
  });
  
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name cannot be empty';
    if (!formData.studyGoals.trim()) tempErrors.studyGoals = 'Please describe at least one goal';
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Validation errors encountered', 'warning');
      return;
    }

    updateProfile({
      name: formData.name,
      studyGoals: formData.studyGoals,
    });
    setEditing(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto transition-colors duration-200">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
          <User className="h-7 w-7 text-brand-600 dark:text-brand-500" />
          <span>My Profile</span>
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage your student credentials and core learning priorities</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        
        {/* User Card */}
        <div className="glass-card p-6 border-slate-200 dark:border-dark-850 text-center flex flex-col items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-brand-500/5 rounded-full blur-xl pointer-events-none" />
          
          <div className="h-20 w-20 rounded-full bg-gradient-to-tr from-brand-600 to-indigo-600 dark:from-brand-600 dark:to-indigo-600 border-2 border-slate-200 dark:border-brand-400/30 flex items-center justify-center font-bold text-white text-3xl shadow-xl shadow-brand-500/5 dark:shadow-brand-500/10 mt-4">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          <div className="leading-tight mt-2">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{user?.name || 'User'}</h3>
            <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">{user?.email || 'user@example.com'}</p>
          </div>

          <div className="w-full h-px bg-slate-200 dark:bg-dark-850 my-2" />

          {/* User statistics summary */}
          <div className="grid grid-cols-2 gap-4 w-full text-left mt-2">
            <div className="bg-slate-100/50 dark:bg-dark-900/50 p-3 rounded-xl border border-slate-200 dark:border-dark-850">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Account Tier</span>
              <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 flex items-center gap-1.5 mt-1">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Premium Scholar</span>
              </span>
            </div>
            <div className="bg-slate-100/50 dark:bg-dark-900/50 p-3 rounded-xl border border-slate-200 dark:border-dark-850">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">Joined</span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 block">
                {user?.joinedDate || 'June 2026'}
              </span>
            </div>
          </div>
        </div>

        {/* Profile details form */}
        <div className="lg:col-span-2">
          <div className="glass-card p-6 sm:p-8 border-slate-200 dark:border-dark-850">
            <div className="flex justify-between items-center border-b border-slate-200 dark:border-dark-850 pb-4 mb-6">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Account Details</h3>
              {!editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 transition"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" />
                  <span>Full Name</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={!editing}
                  className="custom-input disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {errors.name && <span className="text-xs font-medium text-rose-500 mt-1">{errors.name}</span>}
              </div>

              {/* Email */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  disabled
                  className="custom-input bg-slate-100/50 dark:bg-dark-950 opacity-40 cursor-not-allowed border-slate-200 dark:border-dark-850"
                />
                <span className="text-[10px] text-slate-500 dark:text-slate-650 mt-1">Email address is bound to login security credentials</span>
              </div>

              {/* Study Goals field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <BookOpen className="h-3.5 w-3.5" />
                  <span>Study Focus / Goals</span>
                </label>
                <textarea
                  name="studyGoals"
                  value={formData.studyGoals}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="Tell your buddy what exams you are preparing for..."
                  rows="3"
                  className="custom-input resize-none disabled:opacity-50 disabled:cursor-not-allowed"
                />
                {errors.studyGoals && <span className="text-xs font-medium text-rose-500 mt-1">{errors.studyGoals}</span>}
              </div>

              {/* Save Panel */}
              {editing && (
                <div className="flex gap-4 pt-4 border-t border-slate-200 dark:border-dark-850">
                  <button
                    type="submit"
                    className="btn-primary px-6 py-2.5 flex-1 sm:flex-initial"
                  >
                    <Save className="h-4.5 w-4.5" />
                    <span>Save Changes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({
                        name: user?.name || '',
                        email: user?.email || '',
                        studyGoals: user?.studyGoals || '',
                      });
                      setEditing(false);
                      setErrors({});
                    }}
                    className="btn-secondary px-6 py-2.5 flex-1 sm:flex-initial"
                  >
                    Cancel
                  </button>
                </div>
              )}

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
