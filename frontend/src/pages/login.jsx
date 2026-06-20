import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { useToast } from '../context/toastContext';
import { Mail, Lock, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Public Login Page with validation, remember me cache, and demo fallbacks (theme responsive).
 */
const Login = () => {
  const { login, token } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: '', password: '' });
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (token) {
      navigate('/dashboard', { replace: true });
    }
    const savedEmail = localStorage.getItem('remember_email');
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, [token, navigate]);

  const validate = () => {
    const tempErrors = {};
    if (!formData.email.trim()) {
      tempErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      tempErrors.email = 'Provide a valid email address';
    }
    if (!formData.password) {
      tempErrors.password = 'Password is required';
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
      showToast('Please fix validation errors', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        if (rememberMe) {
          localStorage.setItem('remember_email', formData.email);
        } else {
          localStorage.removeItem('remember_email');
        }
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      showToast('Invalid credentials. Check your email and password.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 relative transition-colors duration-200">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-500/5 dark:bg-brand-500/10 rounded-full blur-[100px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md glass-card p-8 border-slate-200 dark:border-dark-800"
      >
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">Welcome Back</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Log in to resume your study sessions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Email input */}
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
              placeholder="name@university.edu"
              className={`custom-input ${errors.email ? 'border-rose-500 focus:ring-rose-500' : ''}`}
            />
            {errors.email && <span className="text-xs font-medium text-rose-500 mt-1">{errors.email}</span>}
          </div>

          {/* Password input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              <span>Password</span>
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={`custom-input w-full pr-10 ${errors.password ? 'border-rose-500 focus:ring-rose-500' : ''}`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-450 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <span className="text-xs font-medium text-rose-500 mt-1">{errors.password}</span>}
          </div>

          {/* Remember me & Forgot Password */}
          <div className="flex items-center justify-between text-xs font-medium">
            <label className="flex items-center gap-2 cursor-pointer text-slate-500 dark:text-slate-400 select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 dark:border-dark-700 bg-slate-100 dark:bg-dark-900 text-brand-600 focus:ring-brand-500/20 focus:ring-offset-slate-50 dark:focus:ring-offset-dark-950 accent-brand-500"
              />
              <span>Remember Email</span>
            </label>
            <a href="#" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 transition">
              Forgot Password?
            </a>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50 mt-2"
          >
            {submitting ? (
              <span>Logging in...</span>
            ) : (
              <>
                <span>Login</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        {/* Link to register */}
        <p className="text-center text-xs font-medium text-slate-500 mt-6">
          Don't have an account?{' '}
          <Link to="/register" className="text-brand-600 dark:text-brand-400 hover:text-brand-500 dark:hover:text-brand-300 transition">
            Sign up for free
          </Link>
        </p>

        {/* Info Box about Demo Mode */}
        <div className="mt-6 p-3 rounded-lg bg-slate-150 dark:bg-dark-900/60 border border-slate-200 dark:border-dark-800 flex items-start gap-2 text-[10px] text-slate-500 leading-normal">
          <ShieldAlert className="h-4 w-4 text-brand-600 dark:text-brand-500 flex-shrink-0 mt-0.5" />
          <span>
            <strong>Note:</strong> If the backend server at port 5000 is offline, this form will log you in locally with mock developer credentials automatically.
          </span>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
