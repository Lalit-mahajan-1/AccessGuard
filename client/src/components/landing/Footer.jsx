import React from 'react';
import { motion } from 'framer-motion';
import { ScanEye, Mail, ArrowRight } from 'lucide-react';

const TwitterIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
);

const GithubIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.03c3.18-.3 6.5-1.5 6.5-7.17a5.2 5.2 0 0 0-1.5-3.8c.15-.4.65-1.8-.15-3.8 0 0-1.2-.4-3.9 1.4a13.3 13.3 0 0 0-7 0c-2.7-1.8-3.9-1.4-3.9-1.4-.8 2-.3 3.4-.15 3.8a5.2 5.2 0 0 0-1.5 3.8c0 5.6 3.3 6.8 6.5 7.17a4.8 4.8 0 0 0-1 3.03v4"/><path d="M9 20c-5 1.5-5-2.5-7-3"/></svg>
);

const LinkedinIcon = ({ size = 18 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
);

const Footer = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.8, ease: [0.32, 0.72, 0, 1] },
    },
  };

  return (
    <footer className="relative bg-white text-slate-500 pt-24 pb-10 overflow-hidden font-sans z-50">
      
      {/* The Glowing Top Border */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />

      {/* Subtle Background Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-indigo-50 blur-[120px] rounded-full pointer-events-none" />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="relative max-w-7xl mx-auto px-6 md:px-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8"
      >
        
        {/* --- COLUMN 1: Brand & Mission --- */}
        <motion.div variants={itemVariants} className="lg:col-span-4 flex flex-col pr-8">
          <div className="flex items-center gap-3 mb-6 cursor-pointer">
            <div className="bg-indigo-50 p-1.5 rounded-full text-indigo-600 ring-1 ring-indigo-100">
              <ScanEye size={18} strokeWidth={2} />
            </div>
            <span className="font-semibold text-xl tracking-wide text-slate-900">AccessGuard</span>
          </div>
          <p className="text-slate-500 font-light leading-relaxed mb-8 text-sm">
            Bridging the web accessibility gap through visual DOM exploration and advanced AI code remediation. Design for everyone.
          </p>
          <div className="flex items-center gap-4">
            <a href="#" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
              <TwitterIcon size={16} />
            </a>
            <a href="#" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
              <GithubIcon size={16} />
            </a>
            <a href="#" className="w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-50 transition-colors shadow-sm">
              <LinkedinIcon size={16} />
            </a>
          </div>
        </motion.div>

        {/* --- COLUMN 2: Product Links --- */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col">
          <h3 className="text-slate-900 font-medium tracking-widest uppercase text-[10px] mb-6">Product</h3>
          <ul className="space-y-4 text-sm font-light">
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">Multi-Page Scan</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">Visual Explorer</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">AI Remediation</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">Score Tracking</a></li>
          </ul>
        </motion.div>

        {/* --- COLUMN 3: Resources --- */}
        <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col">
          <h3 className="text-slate-900 font-medium tracking-widest uppercase text-[10px] mb-6">Resources</h3>
          <ul className="space-y-4 text-sm font-light">
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">WCAG 2.2 Guide</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">API Documentation</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">Browser Extension</a></li>
            <li><a href="#" className="hover:text-indigo-600 transition-colors flex items-center gap-2">Compliance Blog</a></li>
          </ul>
        </motion.div>

        {/* --- COLUMN 4: CTA / Newsletter (Double Bezel) --- */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <div className="p-1.5 rounded-[2rem] bg-slate-50/50 border border-slate-200/60 backdrop-blur-xl group overflow-hidden shadow-sm">
            <div className="bg-white rounded-[calc(2rem-0.375rem)] border border-slate-200 p-6 md:p-8 relative overflow-hidden shadow-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              
              <h3 className="text-slate-900 font-medium text-lg mb-2 relative z-10 tracking-tight">Stay Compliant.</h3>
              <p className="text-slate-500 text-xs mb-6 relative z-10 font-light leading-relaxed">
                Get the latest updates on WCAG guidelines and AI accessibility tools delivered to your inbox.
              </p>
              
              <div className="relative z-10 flex flex-col gap-3">
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 text-slate-400" size={16} strokeWidth={1.5} />
                  <input 
                    type="email" 
                    placeholder="hello@domain.com" 
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-light"
                  />
                </div>
                <motion.button 
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full bg-slate-900 text-white font-medium py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-md hover:bg-slate-800"
                >
                  Subscribe <ArrowRight size={14} strokeWidth={2} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

      </motion.div>

      {/* --- BOTTOM LEGAL BAR --- */}
      <motion.div 
        variants={itemVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="max-w-7xl mx-auto px-6 md:px-12 mt-20 pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-light text-slate-400"
      >
        <p>© {new Date().getFullYear()} AccessGuard.</p>
        <div className="flex items-center gap-6">
          <a href="#" className="hover:text-slate-900 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Terms of Service</a>
          <a href="#" className="hover:text-slate-900 transition-colors">Accessibility Statement</a>
        </div>
      </motion.div>

    </footer>
  );
};

export default Footer;