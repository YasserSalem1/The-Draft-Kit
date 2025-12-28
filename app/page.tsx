'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart2, Gamepad2, LayoutGrid, ArrowRight } from 'lucide-react';

const HubCard = ({ href, icon: Icon, title, description, colorClass }: {
  href: string;
  icon: any;
  title: string;
  description: string;
  colorClass: string;
}) => {
  return (
    <Link href={href}>
      <motion.div
        whileHover={{ scale: 1.02 }}
        className="group relative h-full bg-surface-light/30 border border-white/5 rounded-2xl p-8 overflow-hidden hover:border-primary/50 transition-all duration-300"
      >
        <div className={`absolute top-0 right-0 p-32 bg-${colorClass}/5 rounded-full blur-3xl group-hover:bg-${colorClass}/10 transition-colors`} />

        <div className="relative z-10 flex flex-col h-full">
          <div className={`w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 border border-white/5 group-hover:border-${colorClass}/50`}>
            <Icon className={`w-6 h-6 text-gray-400 group-hover:text-${colorClass} transition-colors`} />
          </div>

          <h3 className="text-2xl font-bold mb-3 text-white group-hover:text-primary transition-colors">{title}</h3>
          <p className="text-gray-400 mb-8 flex-1 leading-relaxed">{description}</p>

          <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">
            <span>Open Tool</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      </motion.div>
    </Link>
  );
};

export default function HubPage() {
  return (
    <main className="min-h-screen bg-background flex flex-col items-center justify-center p-8 relative overflow-hidden">

      {/* Background Ambience */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[150px]" />
      </div>

      <div className="max-w-6xl w-full z-10">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="flex flex-col items-center justify-center relative">
            <h1 className="text-[12rem] md:text-[15rem] font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-600 drop-shadow-2xl select-none mix-blend-overlay">
              R&D
            </h1>
            <span className="text-primary text-xl md:text-2xl font-bold tracking-[0.5em] uppercase mt-4 opacity-80">
              Reporting & Drafting
            </span>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="flex flex-col gap-12 items-center"
        >
          {/* Main Action Buttons */}
          <div className="flex flex-col md:flex-row gap-8 w-full justify-center">
            <Link href="/reports" className="group relative w-full md:w-[28rem] h-80 bg-surface-light/30 border border-white/5 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center justify-center shadow-2xl shadow-blue-900/10">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
              <BarChart2 className="w-20 h-20 text-gray-400 group-hover:text-blue-500 transition-colors mb-6" />
              <span className="text-4xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-widest">Reports</span>
            </Link>

            <Link href="/draft/new" className="group relative w-full md:w-[28rem] h-80 bg-surface-light/30 border border-white/5 rounded-[2rem] overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center justify-center shadow-2xl shadow-purple-900/10">
              <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
              <Gamepad2 className="w-20 h-20 text-gray-400 group-hover:text-purple-500 transition-colors mb-6" />
              <span className="text-4xl font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-widest">Draft</span>
            </Link>
          </div>

          {/* Library Button (Small, Bottom Middle) */}
          <Link href="/library">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center gap-3 px-8 py-4 rounded-full bg-surface-light border border-white/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-all cursor-pointer group"
            >
              <LayoutGrid className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition-colors" />
              <span className="text-sm font-bold text-gray-300 group-hover:text-emerald-400 uppercase tracking-wider">Open Library</span>
            </motion.div>
          </Link>
        </motion.div>
      </div>

      <footer className="absolute bottom-6 text-gray-600 text-xs font-mono uppercase tracking-widest">
        System V2.0 // R&D Dept
      </footer>
    </main>
  );
}
