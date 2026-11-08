"use client";

import Link from "next/link";
import { Project } from "@/lib/types";
import { Clock, Layers, ArrowRight, Video, Sparkles, CheckCircle2 } from "lucide-react";

interface ProjectCardProps {
  project: Project;
}

export default function ProjectCard({ project }: ProjectCardProps) {
  const isStoryboard = project.type === "storyboard";

  return (
    <div className="group relative bg-[#0F1115] border border-white/[0.08] hover:border-[#D4FF00]/40 rounded-2xl p-6 transition-all duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between">
      
      {/* Top Meta Header */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold px-2.5 py-1 rounded-md bg-[#155E47]/30 text-[#4ADE80] border border-[#155E47]/50">
              {project.client}
            </span>
            <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-zinc-800/80 text-zinc-300 border border-white/5">
              {project.format}
            </span>
          </div>

          <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${
            project.status === "active_review"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/30"
              : project.status === "ready_to_render"
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              : "bg-blue-500/10 text-blue-400 border-blue-500/30"
          }`}>
            {project.status === "active_review" && "Active Review"}
            {project.status === "ready_to_render" && "Ready to Render"}
            {project.status === "completed" && "Completed"}
          </span>
        </div>

        {/* Title & Subtitle */}
        <h3 className="text-xl font-bold text-white group-hover:text-[#D4FF00] transition-colors leading-snug">
          {project.title}
        </h3>
        <p className="text-xs text-zinc-400 mt-1 line-clamp-2 leading-relaxed">
          {project.subtitle}
        </p>

        {/* Mini Preview Box / Visual Hero */}
        <div className="mt-4 w-full h-36 rounded-xl overflow-hidden relative border border-white/5 bg-[#14171E] flex items-center justify-center">
          {isStoryboard ? (
            <div className="w-full h-full p-4 bg-[#F6F4EB] text-[#155E47] flex flex-col justify-between relative">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-[#155E47] text-white">9:16 Storyboard</span>
                <span className="text-[#FF7B25]">Warm Clinic Cream</span>
              </div>
              <div className="text-center my-auto">
                <p className="font-serif italic font-bold text-sm text-[#155E47]">“Are GLP-1s Safe?”</p>
                <p className="text-[10px] text-[#155E47]/70 mt-0.5">12 Handcrafted Clinical SVG Scenes</p>
              </div>
              <div className="flex justify-between items-center text-[9px] text-[#155E47]/80 border-t border-[#155E47]/10 pt-1">
                <span>Zero Agonist Jargon</span>
                <span className="font-semibold text-[#FF7B25]">No Bottom Pills</span>
              </div>
            </div>
          ) : (
            <div className="w-full h-full p-4 bg-gradient-to-br from-[#14171E] to-[#0A0D12] text-zinc-300 flex flex-col justify-between">
              <div className="flex justify-between items-center text-[10px] font-bold">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Rendered MP4s
                </span>
                <span className="text-zinc-400">1080×1920 30fps</span>
              </div>
              <div className="text-center my-auto">
                <Video className="w-6 h-6 text-[#D4FF00] mx-auto mb-1 opacity-80" />
                <p className="font-bold text-xs text-white">Ozempic, Wegovy & Mounjaro</p>
              </div>
              <div className="text-[9px] text-zinc-400 flex justify-between">
                <span>Remotion Programmatic Suite</span>
                <span>Verified Audio Sync</span>
              </div>
            </div>
          )}
        </div>

        {/* Brand Colors Swatches */}
        <div className="mt-4 flex items-center gap-1.5">
          <span className="text-[10px] text-zinc-500 font-medium mr-1">Brand Palette:</span>
          {project.brandColors.map((color) => (
            <div
              key={color.name}
              title={`${color.name}: ${color.hex}`}
              className="w-4 h-4 rounded-full border border-white/20 shadow-sm"
              style={{ backgroundColor: color.hex }}
            />
          ))}
        </div>
      </div>

      {/* Footer Metrics & CTA */}
      <div className="mt-6 pt-4 border-t border-white/[0.08] flex items-center justify-between">
        <div className="flex items-center gap-4 text-xs text-zinc-400">
          <div className="flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-zinc-500" />
            <span>{project.scenesCount} Scenes</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{project.totalDuration}</span>
          </div>
        </div>

        <Link
          href={`/project/${project.id}`}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-white/10 hover:bg-[#D4FF00] text-white hover:text-black font-semibold text-xs transition-all duration-200"
        >
          <span>Open Studio</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}
