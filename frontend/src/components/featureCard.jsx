import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Reusable Feature Cards with premium glassmorphism and arrow hover effects
 */
const FeatureCard = ({ icon, title, description, to, delay = 0 }) => {
  const CardContent = (
    <div className="flex flex-col h-full">
      <div className="mb-4 text-brand-600 dark:text-brand-400 p-3 bg-brand-500/10 dark:bg-brand-500/10 w-fit rounded-xl border border-brand-505/20">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-400 transition-colors">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-6 flex-grow">
        {description}
      </p>
      
      {to && (
        <div className="flex items-center gap-1 text-sm font-semibold text-brand-400 group-hover:gap-2 transition-all mt-auto">
          <span>Get Started</span>
          <ArrowRight className="h-4 w-4" />
        </div>
      )}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay }}
      className="glass-card glass-card-hover p-6 group h-full cursor-pointer"
    >
      {to ? <Link to={to}>{CardContent}</Link> : CardContent}
    </motion.div>
  );
};

export default FeatureCard;
