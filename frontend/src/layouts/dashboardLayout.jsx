import React, { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/authContext';
import { Menu, BookOpen } from 'lucide-react';

/**
 * Logged-in workspace layout structure (theme responsive).
 */
const DashboardLayout = () => {
  const { user, updateStats } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!user || !updateStats) return;

    // Daily study streak tracking logic
    const lastStudyDate = localStorage.getItem('lastStudyDate');
    const todayStr = new Date().toDateString();
    
    if (lastStudyDate !== todayStr) {
      let newStreak = user.studyStreak || 0;
      if (!lastStudyDate) {
        newStreak = 1;
      } else {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toDateString();
        
        if (lastStudyDate === yesterdayStr) {
          newStreak += 1;
        } else {
          newStreak = 1;
        }
      }
      updateStats({ studyStreak: newStreak });
      localStorage.setItem('lastStudyDate', todayStr);
    }

    // Background interval to increment active study minutes (every 60s)
    const interval = setInterval(() => {
      updateStats({ studyMinutes: (user.studyMinutes || 0) + 1 });
    }, 60000);

    return () => clearInterval(interval);
  }, [user?.id]);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-dark-955 transition-colors duration-300">
      
      {/* Mobile Sidebar Backdrop overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 z-20 bg-slate-900/40 backdrop-blur-sm"
        />
      )}

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        {/* Mobile top navigation header */}
        <header className="md:hidden flex h-14 items-center justify-between px-4 bg-white dark:bg-dark-900 border-b border-slate-200 dark:border-dark-850 z-20">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-dark-800 text-slate-600 dark:text-slate-400 focus:outline-none"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
              <BookOpen className="h-4 w-4 text-brand-650" />
              <span>Study<span className="text-brand-650">Buddy</span></span>
            </div>
          </div>
          
          <div className="h-7 w-7 rounded-full bg-brand-500/10 border border-brand-500/30 flex items-center justify-center font-bold text-brand-650 text-xs">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
        </header>

        {/* Glow effect in background */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />
        
        {/* Main scrollable body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 relative z-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
