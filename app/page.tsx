'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { BarChart2, Gamepad2, LayoutGrid, ArrowRight, MessageCircle } from 'lucide-react';

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
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <img
            src="/esport.png"
            alt="Background"
            className="w-full h-full object-cover opacity-50 grayscale mix-blend-overlay"
          />
          <div className="absolute inset-0 bg-background/80" /> {/* Reduced overlay for better visibility */}
        </div>

        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-primary/5 rounded-full blur-[150px] z-0" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-900/10 rounded-full blur-[150px] z-0" />
      </div>

      <div className="max-w-7xl w-full z-10 relative min-h-[600px] flex items-center justify-center pb-24">

        {/* CENTERED CONTENT: Branding & Main Tools */}
        <div className="flex flex-col items-center z-10">

          {/* Title Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <div className="flex flex-col items-center justify-center relative mb-4">
              <h1 className="text-[6rem] md:text-[9rem] font-black italic tracking-tighter uppercase leading-none text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-600 drop-shadow-2xl select-none mix-blend-overlay">
                THE DRAFT KIT
              </h1>
              <span className="text-primary/60 text-lg font-bold tracking-[0.5em] uppercase mt-2 opacity-80 block">
                the only drafting tool you need
              </span>
            </div>
          </motion.div>

          {/* Cards Section */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex flex-col md:flex-row gap-8 justify-center"
          >
            <Link href="/reports" className="group relative w-full md:w-[28rem] h-64 bg-surface-light/30 border border-white/5 rounded-[2rem] overflow-hidden hover:border-blue-500/50 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center justify-center shadow-2xl shadow-blue-900/10">
              <div className="absolute inset-0 bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
              <BarChart2 className="w-16 h-16 text-gray-400 group-hover:text-blue-500 transition-colors mb-4" />
              <span className="text-3xl font-black text-white group-hover:text-blue-400 transition-colors uppercase tracking-widest">Reports</span>
            </Link>

            <Link href="/draft/new" className="group relative w-full md:w-[28rem] h-64 bg-surface-light/30 border border-white/5 rounded-[2rem] overflow-hidden hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] flex flex-col items-center justify-center shadow-2xl shadow-purple-900/10">
              <div className="absolute inset-0 bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
              <Gamepad2 className="w-16 h-16 text-gray-400 group-hover:text-purple-500 transition-colors mb-4" />
              <span className="text-3xl font-black text-white group-hover:text-purple-400 transition-colors uppercase tracking-widest">Draft</span>
            </Link>
          </motion.div>

          {/* Library Link (Inline below cards) */}
          <motion.div
            className="flex justify-center mt-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
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
      </div>

      {/* BOTTOM CONTROL DECK: Coach Agent */}
      <motion.div
        initial={{ y: 200 }}
        animate={{ y: 0 }}
        transition={{ delay: 0.5, duration: 0.8, type: "spring", bounce: 0.4 }}
        className="fixed bottom-0 left-0 right-0 h-40 z-50 pointer-events-none flex justify-center items-end pb-0 overflow-hidden"
      >
        <Link href="/drafting-agent" className="pointer-events-auto group relative w-full h-36 flex items-center justify-center bg-black/80 backdrop-blur-2xl border-t border-white/10 hover:border-amber-500/80 hover:bg-black/90 transition-all duration-300 cursor-pointer overflow-hidden shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] hover:shadow-[0_-5px_50px_-5px_rgba(245,158,11,0.3)]">

          {/* 1. ELECTRICITY BEAM ANIMATION */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            className="absolute top-0 left-0 w-1/2 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent z-20 blur-[2px]"
          />
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear", repeatDelay: 1 }}
            className="absolute top-0 left-0 w-1/2 h-[1px] bg-gradient-to-r from-transparent via-white to-transparent z-30"
          />

          {/* 2. BACKGROUND ENERGY FLOW */}
          <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(245,158,11,0.05)_50%,transparent_100%)] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_70%)]" />

          {/* 3. VIBRANT BORDER OVERLAY (Gradient) */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/50 to-transparent opacity-50 group-hover:via-amber-400 group-hover:opacity-100 transition-all" />

          {/* Left Side Tech Decor */}
          <div className="absolute left-10 hidden xl:flex items-center gap-4 text-cyan-500/60 font-mono text-xs tracking-widest uppercase">
            <div className="flex gap-1">
              {[1, 2, 3].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.2 }}
                  className="w-1 h-4 bg-cyan-500 rounded-sm"
                />
              ))}
            </div>
            <span className="group-hover:text-cyan-400 transition-colors text-shadow-glow">Neurolink Active</span>
          </div>

          {/* THE CORE (Center) - SUPERCHARGED */}
          <div className="relative flex items-center gap-8 z-10">
            {/* Pulsing Core Visual */}
            <div className="relative w-24 h-24 flex items-center justify-center -mt-6">
              {/* Outer Spinner */}
              <motion.div
                animate={{ rotate: 360, scale: [1, 1.05, 1] }}
                transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
                className="absolute inset-0 border-[3px] border-dashed border-amber-500/40 rounded-full group-hover:border-amber-500 group-hover:shadow-[0_0_30px_rgba(245,158,11,0.4)] transition-all"
              />
              {/* Inner Spinner */}
              <motion.div
                animate={{ rotate: -360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="absolute inset-2 border-2 border-cyan-400/30 rounded-full group-hover:border-cyan-400/80 transition-all"
              />

              {/* Core Icon */}
              <div className="relative z-10 bg-black/50 rounded-full p-2 backdrop-blur-sm border border-white/10 group-hover:border-amber-500/50 transition-colors">
                <MessageCircle className="w-8 h-8 text-amber-500 group-hover:text-white transition-colors" />
              </div>

              {/* Core Glow */}
              <div className="absolute inset-0 bg-amber-500/20 blur-xl rounded-full animate-pulse group-hover:bg-amber-500/40 group-hover:blur-2xl transition-all" />
            </div>

            {/* Label */}
            <div className="flex flex-col items-start">
              <span className="text-3xl font-black text-white group-hover:text-amber-400 transition-colors tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(255,255,255,0.3)]">
                COACH
              </span>
              <span className="text-[10px] text-cyan-400/60 tracking-[0.5em] uppercase group-hover:text-cyan-300 transition-colors typing-effect">
                AWAITING COMMAND
              </span>
            </div>
          </div>

          {/* Right Side Tech Decor */}
          <div className="absolute right-10 hidden xl:flex items-center gap-4 text-purple-500/60 font-mono text-xs tracking-widest uppercase">
            <span className="group-hover:text-purple-400 transition-colors">System Optimal</span>
            <div className="relative w-3 h-3">
              <div className="absolute inset-0 bg-purple-500 rounded-full animate-ping opacity-20" />
              <div className="relative w-3 h-3 bg-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.8)]" />
            </div>
          </div>

        </Link>
      </motion.div>
    </main>
  );
}
