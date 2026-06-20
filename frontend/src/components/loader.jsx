import React from 'react';
import { motion } from 'framer-motion';

const sizes = {
  sm: 'h-6 w-6 border-2',
  md: 'h-12 w-12 border-3',
  lg: 'h-20 w-20 border-4',
};

/**
 * Premium loading spinner using Framer Motion
 */
const Loader = ({ size = 'md' }) => {
  const borderStyle = sizes[size] || sizes.md;

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className="relative">
        {/* Outer glowing pulsing circle */}
        <motion.div
          className={`absolute inset-0 rounded-full border-brand-500/20`}
          animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ width: '100%', height: '100%' }}
        />
        
        {/* Main rotating spinner */}
        <motion.div
          className={`${borderStyle} border-t-brand-500 border-r-transparent border-b-transparent border-l-brand-600 rounded-full`}
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        />
      </div>
      <motion.p
        className="text-sm font-medium text-slate-400 tracking-wider"
        animate={{ opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      >
        Studying...
      </motion.p>
    </div>
  );
};

export default Loader;
