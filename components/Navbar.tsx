"use client";

import Link from "next/link";
import { Film, Sparkles, CheckCircle2 } from "lucide-react";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full bg-[#090A0C]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand & Studio Title */}
        <Link href="/" className="flex items-center gap-3 group">
          {/* Growithkeda Origami Icon Badge */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#155E47] to-[#0A3326] border border-[#155E47]/50 flex items-center justify-center shadow-[0_0_15px_rgba(21,94,71,0.3)] group-hover:shadow-[0_0_20px_rgba(212,255,0,0.4)] transition-all">
            <span className="text-[#D4FF00] font-black text-sm tracking-tighter">GK</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-white text-base tracking-tight">GROWITHKEDA</span>
              <span className="text-[10px] uppercase font-bold tracking-widest px-2 py-0.5 rounded-full bg-[#D4FF00]/10 text-[#D4FF00] border border-[#D4FF00]/30">
                Motion Studio
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">Director Review & Voice Feedback Portal</p>
          </div>
        </Link>

        {/* Action Pills & Status */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-xs text-zinc-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Agent Sync Active</span>
          </div>

          <Link
            href="/captions"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white bg-[#155E47] hover:bg-[#1a7357] transition-all border border-[#D4FF00]/30 shadow-[0_0_15px_rgba(21,94,71,0.3)]"
          >
            <span className="text-sm">💬</span>
            <span>Caption Studio</span>
          </Link>

          <Link
            href="/cutting-room"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-black bg-[#D4FF00] hover:bg-[#c2eb00] transition-all shadow-[0_0_15px_rgba(212,255,0,0.3)]"
          >
            <span className="text-sm">✂️</span>
            <span>Cutting Room</span>
          </Link>

          <Link
            href="/"
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-zinc-300 hover:text-white hover:bg-white/5 transition-colors"
          >
            <Film className="w-4 h-4 text-zinc-400" />
            <span>All Projects</span>
          </Link>

          <a
            href="https://motionstudio.growithkeda.com"
            target="_blank"
            rel="noreferrer"
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-zinc-200 transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" />
            <span>Production Hub</span>
          </a>
        </div>
      </div>
    </header>
  );
}
