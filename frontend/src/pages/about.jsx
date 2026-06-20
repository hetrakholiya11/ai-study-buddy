import React from 'react';
import { motion } from 'framer-motion';
import { 
  Cpu, 
  Code2, 
  Layers, 
  BookOpen, 
  CheckCircle2, 
  Flame, 
  Terminal,
  ShieldCheck
} from 'lucide-react';

/**
 * Public About Page describing mission, benefits, and technical architecture (theme responsive).
 */
const About = () => {
  const benefits = [
    { title: "Saves Valuable Time", desc: "No more spending hours copying files or highlight-marking text. AI reads and summarizes contents for you." },
    { title: "Enforces Active Recall", desc: "Instantly testing your memories with mock MCQ tests cements definitions better than passive reading." },
    { title: "Accessible 24/7", desc: "Your personal learning companion never sleeps. Ask questions, clarify equations, or check code at any time." },
    { title: "Structured Curriculum Buddy", desc: "Break down complex textbooks into distinct parts. Custom outlines make revision logical and simple." }
  ];

  const techStack = [
    { category: "Framework", name: "React.js + Vite", desc: "Next-gen front-end tooling offering blazing-fast Hot Module Replacement (HMR) and reactive UI updates." },
    { category: "Routing", name: "React Router DOM", desc: "Declarative, client-side routing allowing seamless navigation between pages without refreshing." },
    { category: "Styling", name: "Tailwind CSS", desc: "A utility-first CSS framework enabling fluid, highly responsive custom styling systems." },
    { category: "Animations", name: "Framer Motion", desc: "Production-ready animation framework powering fluid slide-ins, micro-indicators, and page transitions." },
    { category: "Data Fetching", name: "Axios client", desc: "Promise-based HTTP client for secure, structured tokenized API requests." },
    { category: "Iconography", name: "Lucide React", desc: "A beautiful, consistent pack of open-source vector graphics icons." }
  ];

  return (
    <div className="relative pt-12 pb-24 transition-colors duration-200">
      {/* Background radial highlight */}
      <div className="absolute top-10 left-10 w-[300px] h-[300px] bg-brand-500/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Header Block */}
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight sm:text-5xl"
          >
            Empowering Students with <span className="bg-clip-text text-transparent bg-gradient-to-r from-brand-600 to-indigo-600 dark:from-brand-400 dark:to-indigo-400">Intelligent Companions</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 text-slate-600 dark:text-slate-400 text-base sm:text-lg leading-relaxed"
          >
            Study Buddy is built to revolutionize study habits, helping students comprehend notes and verify knowledge using modern deep-learning engines.
          </motion.p>
        </div>

        {/* Benefits Section */}
        <div className="mb-24">
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-10 text-center flex items-center justify-center gap-2">
            <Flame className="h-6 w-6 text-brand-600 dark:text-brand-500" />
            <span>Why Choose Study Buddy?</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {benefits.map((benefit, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="glass-card p-6 flex gap-4 border-slate-200 dark:border-dark-800"
              >
                <div className="flex-shrink-0 h-10 w-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center">
                  <CheckCircle2 className="h-5 w-5 text-brand-600 dark:text-brand-400" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{benefit.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{benefit.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Technical Architecture Section */}
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-10 text-center flex items-center justify-center gap-2">
            <Code2 className="h-6 w-6 text-brand-600 dark:text-brand-500" />
            <span>Built On Modern Technology</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {techStack.map((tech, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="glass-card p-6 flex flex-col justify-between border-slate-200 dark:border-dark-800"
              >
                <div>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-widest bg-brand-500/10 border border-brand-500/20 px-2 py-0.5 rounded-full">
                    {tech.category}
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-4 mb-2">{tech.name}</h3>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{tech.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};

export default About;
