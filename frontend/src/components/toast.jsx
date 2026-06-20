import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const toastStyles = {
  success: {
    bg: 'bg-emerald-950/90 border-emerald-800/80 text-emerald-200',
    icon: <CheckCircle className="h-5 w-5 text-emerald-400" />,
  },
  error: {
    bg: 'bg-rose-950/90 border-rose-800/80 text-rose-200',
    icon: <XCircle className="h-5 w-5 text-rose-400" />,
  },
  warning: {
    bg: 'bg-amber-950/90 border-amber-800/80 text-amber-200',
    icon: <AlertTriangle className="h-5 w-5 text-amber-400" />,
  },
  info: {
    bg: 'bg-sky-950/90 border-sky-800/80 text-sky-200',
    icon: <Info className="h-5 w-5 text-sky-400" />,
  },
};

/**
 * Toast Notification component using framer-motion for smooth entry/exit
 */
const Toast = ({ message, type = 'info', onClose }) => {
  const style = toastStyles[type] || toastStyles.info;

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
      className={`pointer-events-auto flex items-start gap-3 w-80 max-w-sm rounded-xl border p-4 shadow-xl backdrop-blur-md ${style.bg}`}
    >
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
      <div className="flex-1 text-sm font-medium leading-5">{message}</div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-slate-400 hover:text-slate-200 transition-colors focus:outline-none"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
};

export default Toast;
