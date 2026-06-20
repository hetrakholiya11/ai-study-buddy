import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/sidebar';
import { useAuth } from '../context/authContext';

/**
 * Logged-in workspace layout structure (theme responsive).
 */
const DashboardLayout = () => {
  const { user, updateStats } = useAuth();

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
    <div className="flex h-screen w-screen overflow-hidden bg-slate-50 dark:bg-dark-950 transition-colors duration-300">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Workspace Frame */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
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
