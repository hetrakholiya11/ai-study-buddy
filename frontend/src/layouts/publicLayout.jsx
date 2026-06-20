import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from '../components/navbar';
import Footer from '../components/footer';

/**
 * Public facing page layout structure (theme responsive).
 */
const PublicLayout = () => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-dark-950 transition-colors duration-300">
      <Navbar />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default PublicLayout;
