import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ScanEye, ArrowRight } from 'lucide-react';

const Navbar = () => {
  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="fixed top-0 left-0 right-0 z-[100] flex justify-center mt-6 px-4"
    >
      <div className="w-max mx-auto bg-white/80 backdrop-blur-xl border border-slate-200/60 rounded-full p-1.5 flex items-center justify-between gap-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
        
        <div className="flex items-center gap-3 pl-4 cursor-pointer">
          <div className="bg-indigo-50 p-1.5 rounded-full text-indigo-600 ring-1 ring-indigo-100">
            <ScanEye size={18} strokeWidth={2} />
          </div>
          <span className="font-semibold text-lg tracking-wide text-slate-900">AccessGuard</span>
        </div>

        <div className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-500">
          <a href="#features" className="hover:text-slate-900 transition-colors duration-300">Features</a>
          <a href="#how-it-works" className="hover:text-slate-900 transition-colors duration-300">Mechanism</a>
          <a href="#impact" className="hover:text-slate-900 transition-colors duration-300">Impact</a>
        </div>

        {/* Double-Bezel CTA */}
        <Link href="/login" passHref>
          <motion.button 
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className="group relative flex items-center gap-3 bg-slate-900 text-white px-5 py-2.5 rounded-full font-medium text-sm hover:bg-slate-800 transition-colors shadow-md"
          >
            <span>Get Started</span>
            <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
              <motion.div
                variants={{
                  hover: { x: 2, y: -1, scale: 1.05 }
                }}
                transition={{ ease: [0.32, 0.72, 0, 1], duration: 0.4 }}
              >
                <ArrowRight size={14} strokeWidth={2} />
              </motion.div>
            </div>
          </motion.button>
        </Link>
      </div>
    </motion.nav>
  );
};

export default Navbar;