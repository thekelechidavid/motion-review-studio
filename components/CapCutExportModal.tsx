"use client";

import React, { useState } from "react";
import { Project } from "@/lib/types";
import { X, Film, Check, Copy, Sparkles, FolderOpen, Loader2, ArrowRight } from "lucide-react";

interface CapCutExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
}

export default function CapCutExportModal({
  isOpen,
  onClose,
  project,
}: CapCutExportModalProps) {
  const defaultDraftName = `${project.client} - ${project.title} (Motion Studio Draft)`;
  const [draftName, setDraftName] = useState(defaultDraftName);
  const [isCompiling, setIsCompiling] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    draftPath?: string;
    captionCount?: number;
    durationSeconds?: number;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCompile = async () => {
    setIsCompiling(true);
    setResult(null);

    try {
      const res = await fetch("/api/capcut/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: project.id,
          projectName: draftName.trim() || defaultDraftName,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        setResult({ success: false, error: data.error || "Failed to compile CapCut project" });
      } else {
        setResult(data);
      }
    } catch (e: any) {
      setResult({ success: false, error: e?.message || "Network error while compiling CapCut project" });
    } finally {
      setIsCompiling(false);
    }
  };

  const handleCopyPath = () => {
    if (result?.draftPath) {
      navigator.clipboard.writeText(result.draftPath);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-[#0F1115] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/5 bg-[#14171E]/60">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                Compile to CapCut Desktop
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Native Windows Draft
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Generates multi-track timeline directly in your local CapCut folder
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 text-sm">
          {!result?.success ? (
            <>
              {/* Project Info Pill */}
              <div className="p-3.5 rounded-xl bg-[#14171E] border border-white/5 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-400 font-medium">Target Project</div>
                  <div className="font-semibold text-white mt-0.5">{project.title}</div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#155E47] text-white">
                    {project.client}
                  </span>
                  <div className="text-[11px] text-zinc-400 mt-1">{project.scenesCount} Scenes • {project.totalDuration}</div>
                </div>
              </div>

              {/* Draft Name Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-300">
                  CapCut Project Name (Recent Projects Label)
                </label>
                <input
                  type="text"
                  value={draftName}
                  onChange={(e) => setDraftName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#090A0C] border border-white/10 text-white placeholder-zinc-500 text-xs focus:outline-none focus:border-emerald-500/50 transition-all"
                  placeholder="Enter custom project name..."
                />
              </div>

              {/* Multi-Track Architecture Breakdown */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Timeline Tracks Built by Compiler
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="p-2.5 rounded-lg bg-[#14171E]/60 border border-white/5">
                    <div className="font-medium text-emerald-400">Track 1: Master Video</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">High-definition 1080x1920 vertical MP4</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#14171E]/60 border border-white/5">
                    <div className="font-medium text-purple-400">Track 2: Dual-Font Captions</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">Poppins Bold + Playfair Italic emphasis</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#14171E]/60 border border-white/5">
                    <div className="font-medium text-sky-400">Cover & Thumbnail</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">Pre-rendered 9:16 cover still attached</div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-[#14171E]/60 border border-white/5">
                    <div className="font-medium text-amber-400">Root Index Sync</div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">Auto-promoted to top of Recent Projects</div>
                  </div>
                </div>
              </div>

              {result?.error && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                  <strong>Error:</strong> {result.error}
                </div>
              )}
            </>
          ) : (
            /* Success State */
            <div className="space-y-4 py-2 text-center animate-in fade-in">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
                <Check className="w-6 h-6 stroke-[3]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">
                  Compiled into CapCut Desktop!
                </h3>
                <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                  Your project is written directly to your Windows CapCut draft directory and ready for final trimming or export.
                </p>
              </div>

              {/* Stats badges */}
              <div className="flex items-center justify-center gap-3 text-xs">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 font-semibold">
                  {result.durationSeconds}s Duration
                </span>
                <span className="px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 font-semibold">
                  {result.captionCount} Caption Cards
                </span>
              </div>

              {/* Path copy box */}
              <div className="p-3 rounded-xl bg-[#090A0C] border border-white/10 text-left">
                <div className="text-[11px] text-zinc-400 font-medium mb-1 flex items-center justify-between">
                  <span>Local Draft Folder</span>
                  <button
                    onClick={handleCopyPath}
                    className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 text-[11px] font-semibold"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? "Copied" : "Copy Path"}</span>
                  </button>
                </div>
                <div className="text-[11px] font-mono text-zinc-300 break-all select-all">
                  {result.draftPath}
                </div>
              </div>

              {/* Launch Instruction */}
              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-left flex items-start gap-3">
                <FolderOpen className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                <div className="text-xs text-zinc-300">
                  <div className="font-semibold text-white">How to Open in CapCut:</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-zinc-400 mt-1 text-[11px]">
                    <li>Open <strong>CapCut Desktop</strong> on your PC.</li>
                    <li>Look at the top of your <strong>Recent Projects</strong> list.</li>
                    <li>Click on <strong>{draftName}</strong> to start editing!</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/5 bg-[#14171E]/60 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold hover:bg-white/5 transition-all"
          >
            {result?.success ? "Close" : "Cancel"}
          </button>

          {!result?.success ? (
            <button
              onClick={handleCompile}
              disabled={isCompiling}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-black" />
                  <span>Compiling Project...</span>
                </>
              ) : (
                <>
                  <Film className="w-4 h-4 text-black" />
                  <span>Compile into CapCut</span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs transition-all active:scale-95"
            >
              <span>Done</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
