import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Github, Twitter, Linkedin } from 'lucide-react';

/**
 * Public Footer styling
 */
const Footer = () => {
  return (
    <footer className="bg-dark-950 border-t border-dark-900 text-slate-400 py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2 text-xl font-bold tracking-tight text-white mb-4">
              <BookOpen className="h-6 w-6 text-brand-500" />
              <span>Study<span className="text-brand-500">Buddy</span></span>
            </Link>
            <p className="text-sm max-w-sm leading-relaxed text-slate-500">
              An intelligent, interactive learning companion designed to boost your efficiency using cutting-edge artificial intelligence. Generate quizzes, summarize notes, and chat with a specialized tutor instantly.
            </p>
          </div>

          {/* Page links */}
          <div>
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Pages</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-white transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Social connections */}
          <div>
            <h3 className="text-white text-sm font-semibold tracking-wider uppercase mb-4">Connect</h3>
            <div className="flex gap-4">
              <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 bg-dark-900 rounded-lg">
                <Github className="h-5 w-5" />
              </a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 bg-dark-900 rounded-lg">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors p-2 bg-dark-900 rounded-lg">
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Separator / Copyright */}
        <div className="border-t border-dark-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Study Buddy. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-slate-300">Privacy Policy</a>
            <a href="#" className="hover:text-slate-300">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
