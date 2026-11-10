"use client";

import React, { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import ProjectCard from "@/components/ProjectCard";
import { INITIAL_PROJECTS } from "@/lib/projects-data";
import { Sparkles, Layers, Video, ShieldCheck, Plus, Search, Filter } from "lucide-react";

export default function DashboardPage() {
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");

  const filteredProjects = INITIAL_PROJECTS.filter((p) => {
    const matchesClient =
      selectedClient === "all" || p.client.toLowerCase().includes(selectedClient.toLowerCase());
    const matchesQuery =
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.client.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.subtitle.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesClient && matchesQuery;
  });

  return (
    <div className="min-h-screen bg-[#090A0C] flex flex-col justify-between">
      <div>
        <Navbar />

        {/* Hero Header */}
        <section className="relative overflow-hidden border-b border-white/[0.08] bg-gradient-to-b from-[#14171E] via-[#090A0C] to-[#090A0C] py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            
            {/* Agency Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#155E47]/30 border border-[#155E47]/60 text-xs font-semibold text-[#4ADE80] mb-4">
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span>Growithkeda Motion Review & QA Pipeline</span>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight">
                  Creative Director Review Studio
                </h1>
                <p className="text-sm sm:text-base text-zinc-400 mt-2 max-w-2xl leading-relaxed">
                  Precision scene-by-scene approval workspace. Provide voice directives or written notes per frame, adjust scale and typography, and sync bulk revisions straight to Antigravity before final render.
                </p>
              </div>

              {/* Quick Stat Counter Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
                <div className="bg-[#0F1115] border border-white/[0.08] p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Total Projects</span>
                  <span className="text-xl font-bold text-white">3 Suites</span>
                </div>
                <div className="bg-[#0F1115] border border-white/[0.08] p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Active Scenes</span>
                  <span className="text-xl font-bold text-[#D4FF00]">50 Scenes</span>
                </div>
                <div className="bg-[#0F1115] border border-white/[0.08] p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Copy Standard</span>
                  <span className="text-xl font-bold text-[#4ADE80]">Anti-Jargon</span>
                </div>
                <div className="bg-[#0F1115] border border-white/[0.08] p-3 rounded-xl">
                  <span className="text-[10px] uppercase font-bold text-zinc-400 block">Input Mode</span>
                  <span className="text-xl font-bold text-[#FF7B25]">Voice + Text</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Filter & Search Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 p-1 bg-[#14171E] rounded-xl border border-white/5 w-fit">
              <button
                onClick={() => setSelectedClient("all")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedClient === "all"
                    ? "bg-[#D4FF00] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                All Projects
              </button>
              <button
                onClick={() => setSelectedClient("dr kaka")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedClient === "dr kaka"
                    ? "bg-[#155E47] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Dr Kaka (Medical)
              </button>
              <button
                onClick={() => setSelectedClient("growithkeda")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedClient === "growithkeda"
                    ? "bg-[#D4FF00] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Growithkeda (Agency)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search projects or scenes..."
                className="w-full bg-[#14171E] text-zinc-200 placeholder-zinc-500 text-xs rounded-xl pl-9 pr-3 py-2 border border-white/5 focus:border-[#D4FF00] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Spotlight: New Video Cutting & Pacing Lab */}
          <Link
            href="/cutting-room"
            className="mt-6 block p-5 rounded-2xl bg-gradient-to-r from-[#14171E] via-[#0F1115] to-[#155E47]/20 border border-[#D4FF00]/40 hover:border-[#D4FF00] shadow-[0_0_25px_rgba(212,255,0,0.1)] group transition-all"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-xl bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 transition-transform">
                  ✂️
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#D4FF00] text-black">
                      New Autonomous Feature
                    </span>
                    <span className="text-xs text-zinc-400">• Dr Kaka Raw Footage Processing</span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-[#D4FF00] transition-colors">
                    Rough Cut Review & Pacing Station (IMG_0370.MOV)
                  </h3>
                  <p className="text-xs text-zinc-400 mt-1">
                    Compare raw footage (05:15) with the AI-assembled rough cut (04:25). Inspect 36 speech clips, silence cuts (-15.9%), and log voice/text directives to Antigravity.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs font-bold text-[#D4FF00] group-hover:translate-x-0.5 transition-transform">
                  Open Cutting Room →
                </span>
              </div>
            </div>
          </Link>

          {/* Projects Grid */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>

          {/* In-Flight Project Highlight Note */}
          <div className="mt-8 p-4 rounded-2xl bg-gradient-to-r from-[#155E47]/20 via-[#155E47]/10 to-transparent border border-[#155E47]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#155E47] flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5 text-[#FF7B25]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white">Current Active Review: “Lifestyle Changes & GLP-1 Resistance”</h4>
                <p className="text-xs text-zinc-400 mt-0.5">
                  26-scene full vertical storyboard aligned to Dr Kaka's 4m 25s cut footage (IMG_0370).
                </p>
              </div>
            </div>

            <a
              href="/project/dr-kaka-glp1-lifestyle-resistance"
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#FF7B25] hover:bg-[#e06817] text-white font-bold text-xs transition-all shadow-md shrink-0"
            >
              <span>Review 26 Scenes Now →</span>
            </a>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-12 border-t border-white/[0.08] py-6 px-4 bg-[#090A0C] text-center text-xs text-zinc-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-[#D4FF00] flex items-center justify-center text-[8px] font-black text-black">
              GK
            </div>
            <span>Growithkeda Motion Review Studio • Built for David Asoya</span>
          </div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>Production Standard: Medical Graphics 1</span>
            <span>•</span>
            <span className="text-[#D4FF00]">Custom Domain: motionstudio.growithkeda.com</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
