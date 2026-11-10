"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import RoughCutReviewer from "@/components/RoughCutReviewer";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, Sparkles, Scissors } from "lucide-react";

export default function CuttingRoomPage() {
  return (
    <div className="min-h-screen bg-[#090A0C] text-white flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Header Breadcrumbs */}
        <div className="border-b border-white/[0.08] bg-[#0E1015]/80 py-3 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Master Studio Dashboard</span>
            </Link>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#155E47]/30 text-[#4ADE80] border border-[#155E47]/60">
                <Scissors className="w-3 h-3 text-[#D4FF00]" />
                <span>Autonomous Rough-Cut Lab</span>
              </span>
            </div>
          </div>
        </div>

        {/* Master Reviewer Component */}
        <main>
          <RoughCutReviewer />
        </main>
      </div>

      {/* Footer */}
      <footer className="border-t border-white/[0.08] bg-[#090A0C] py-6 px-4 text-center text-xs text-zinc-400">
        <p>
          Growithkeda Motion Review Studio • Built for David Asoya • Powered by Antigravity Autonomous Video Engine
        </p>
      </footer>
    </div>
  );
}
