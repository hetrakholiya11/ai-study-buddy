import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import PublicLayout from './layouts/publicLayout';
import DashboardLayout from './layouts/dashboardLayout';
import ProtectedRoute from './components/protectedRoute';

// Import public pages
import Home from './pages/home';
import About from './pages/about';
import Contact from './pages/contact';
import Login from './pages/login';
import Register from './pages/register';
import PublicSummary from './pages/publicSummary';

// Import protected pages
import Dashboard from './pages/dashboard';
import AIChat from './pages/aiChat';
import NotesSummarizer from './pages/notesSummarizer';
import QuizGenerator from './pages/quizGenerator';
import Profile from './pages/profile';
import Roadmaps from './pages/roadmaps';
import RoadmapDetail from './pages/roadmapDetail';

// CSS imports
import './App.css';

/**
 * Main application routing configuration.
 * Declares both public layout hierarchies and protected dashboard sub-outlets.
 */
function App() {
  return (
    <Routes>
      {/* Public Pages Layout */}
      <Route path="/" element={<PublicLayout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="contact" element={<Contact />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="share/notes/:id" element={<PublicSummary />} />
      </Route>

      {/* Protected Dashboard Pages Layout */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="chat" element={<AIChat />} />
        <Route path="summarizer" element={<NotesSummarizer />} />
        <Route path="quiz" element={<QuizGenerator />} />
        <Route path="profile" element={<Profile />} />
        <Route path="roadmaps" element={<Roadmaps />} />
        <Route path="roadmaps/:id" element={<RoadmapDetail />} />
      </Route>

      {/* Fallback Catch-All */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
