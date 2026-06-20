import React, { useState } from 'react';
import { useToast } from '../context/toastContext';
import { Mail, MessageSquare, User, Send, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Public Contact Page containing a feedback form with validation logic (theme responsive).
 */
const Contact = () => {
  const { showToast } = useToast();
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const tempErrors = {};
    if (!formData.name.trim()) tempErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      tempErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Please provide a valid email address';
    }
    if (!formData.message.trim()) {
      tempErrors.message = 'Message content cannot be blank';
    } else if (formData.message.trim().length < 10) {
      tempErrors.message = 'Message must be at least 10 characters';
    }
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) {
      showToast('Please fix the errors in the form', 'warning');
      return;
    }

    setSubmitting(true);
    setTimeout(() => {
      showToast('Thank you! Your message has been sent successfully.', 'success');
      setFormData({ name: '', email: '', message: '' });
      setSubmitting(false);
    }, 1500);
  };

  return (
    <div className="relative pt-12 pb-24 transition-colors duration-200">
      {/* Background neon orb */}
      <div className="absolute top-1/3 right-10 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Page Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl">
            Get in <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">Touch</span>
          </h1>
          <p className="mt-4 text-slate-600 dark:text-slate-400 text-sm sm:text-base leading-relaxed">
            Have questions, feedback, or feature recommendations? We would love to hear from you. Drop us a note below!
          </p>
        </div>

        {/* Contact Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-12 items-start max-w-5xl mx-auto">
          
          {/* Info Panels */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 border-slate-200 dark:border-dark-800">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4 flex items-center gap-2">
                <Mail className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>Contact Email</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Send direct support queries or licensing questions to:
              </p>
              <a href="mailto:support@studybuddy.ai" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold text-sm block mt-2 transition">
                support@studybuddy.ai
              </a>
            </div>

            <div className="glass-card p-6 border-slate-200 dark:border-dark-800">
              <h3 className="text-slate-900 dark:text-white font-bold text-lg mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                <span>Live Forum Support</span>
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Connect with our global student community on Discord for tips and tricks.
              </p>
              <a href="#" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 font-semibold text-sm flex items-center gap-1 mt-2 transition">
                <span>Join our Discord</span>
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Contact Form panel */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-3 glass-card p-6 sm:p-8 border-slate-200 dark:border-dark-800"
          >
            <form onSubmit={handleSubmit} className="space-y-5">
              
              {/* Name Field */}
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
                  placeholder="John Doe"
                  className={`custom-input ${errors.name ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
                {errors.name && <span className="text-xs font-medium text-rose-500 mt-1">{errors.name}</span>}
              </div>

              {/* Email Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" />
                  <span>Email Address</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  className={`custom-input ${errors.email ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
                {errors.email && <span className="text-xs font-medium text-rose-500 mt-1">{errors.email}</span>}
              </div>

              {/* Message Field */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>Message</span>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="How can we help your learning process?"
                  rows="4"
                  className={`custom-input resize-none ${errors.message ? 'border-rose-500 focus:ring-rose-500' : ''}`}
                />
                {errors.message && <span className="text-xs font-medium text-rose-500 mt-1">{errors.message}</span>}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 mt-2"
              >
                {submitting ? (
                  <span>Sending Message...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="h-4 w-4" />
                  </>
                )}
              </button>

            </form>
          </motion.div>

        </div>

      </div>
    </div>
  );
};

export default Contact;
