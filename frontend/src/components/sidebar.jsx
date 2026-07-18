import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/authContext';
import { 
  LayoutDashboard, 
  MessageSquareCode, 
  FileText, 
  HelpCircle, 
  User, 
  LogOut, 
  ChevronLeft, 
  ChevronRight,
  BookOpen,
  Map
} from 'lucide-react';
import { motion } from 'framer-motion';
import ThemeToggle from './themeToggle';

/**
 * Dashboard Sidebar supporting collapsible layout, active routing, and light/dark theme toggling.
 */
const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Detect if screen is mobile to animate X translation
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLinkClick = () => {
    if (setMobileOpen) setMobileOpen(false);
  };

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-5 w-5" /> },
    { path: '/dashboard/chat', label: 'AI Chat Buddy', icon: <MessageSquareCode className="h-5 w-5" /> },
    { path: '/dashboard/summarizer', label: 'Notes Summarizer', icon: <FileText className="h-5 w-5" /> },
    { path: '/dashboard/quiz', label: 'Quiz Generator', icon: <HelpCircle className="h-5 w-5" /> },
    { path: '/dashboard/roadmaps', label: 'Study Roadmap', icon: <Map className="h-5 w-5" /> },
    { path: '/dashboard/profile', label: 'My Profile', icon: <User className="h-5 w-5" /> },
  ];

  return (
    <motion.aside
      animate={{ 
        width: isCollapsed ? '72px' : '260px',
        x: isMobile ? (mobileOpen ? 0 : -260) : 0
      }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
      className="flex flex-col h-screen bg-white dark:bg-dark-900 border-r border-slate-200 dark:border-dark-800 text-slate-700 dark:text-slate-300 transition-colors duration-200
        fixed md:relative z-30 top-0 bottom-0 left-0
        max-md:w-[260px] max-md:shadow-xl md:translate-x-0"
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-200 dark:border-dark-850">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-lg tracking-tight"
          >
            <BookOpen className="h-5 w-5 text-brand-660 dark:text-brand-500" />
            <span>Study<span className="text-brand-660 dark:text-brand-500">Buddy</span></span>
          </motion.div>
        )}
        {isCollapsed && (
          <div className="mx-auto">
            <BookOpen className="h-6 w-6 text-brand-660 dark:text-brand-500" />
          </div>
        )}

        {/* Toggle Collapse Button (hidden on mobile) */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="absolute -right-3 top-5 bg-brand-650 hover:bg-brand-500 text-white rounded-full p-1 border border-slate-200 dark:border-dark-850 focus:outline-none transition-colors max-md:hidden"
        >
          {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
        </button>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1.5 px-3 py-6 overflow-y-auto">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.path === '/dashboard'}
            onClick={handleLinkClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group ${
                isActive
                  ? 'bg-gradient-to-r from-brand-600 to-indigo-600 text-white shadow-md shadow-brand-500/10'
                  : 'hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-dark-800/80 dark:hover:text-white text-slate-500 dark:text-slate-400'
              }`
            }
          >
            <div className="flex-shrink-0">{item.icon}</div>
            {!isCollapsed && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="truncate"
              >
                {item.label}
              </motion.span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile section at bottom */}
      <div className="p-3 border-t border-slate-200 dark:border-dark-850 bg-slate-50/50 dark:bg-dark-950/20">
        <div className="flex items-center justify-between gap-3 mb-2">
          {!isCollapsed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 overflow-hidden flex-1"
            >
              <div className="h-9 w-9 rounded-full bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-650 dark:text-white text-sm flex-shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="overflow-hidden leading-tight">
                <p className="text-sm font-medium text-slate-800 dark:text-white truncate">{user?.name || 'User'}</p>
                <p className="text-xs text-slate-550 dark:text-slate-500 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            </motion.div>
          ) : (
            <div className="mx-auto h-9 w-9 rounded-full bg-brand-500/10 dark:bg-brand-500/20 border border-brand-500/30 flex items-center justify-center font-bold text-brand-650 dark:text-white text-sm flex-shrink-0">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
          )}
        </div>

        {/* Theme and Logout Buttons row */}
        <div className="flex flex-col gap-1.5 mt-3">
          {!isCollapsed ? (
            <div className="flex items-center justify-between px-3 py-1 rounded-xl border border-slate-200 dark:border-dark-800 bg-white dark:bg-dark-900/50">
              <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">Theme</span>
              <ThemeToggle className="p-1 border-none bg-transparent dark:bg-transparent" />
            </div>
          ) : (
            <div className="flex justify-center">
              <ThemeToggle className="p-1.5" />
            </div>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium text-slate-650 dark:text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20 transition-all border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!isCollapsed && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                Logout
              </motion.span>
            )}
          </button>
        </div>
      </div>
    </motion.aside>
  );
};

export default Sidebar;
