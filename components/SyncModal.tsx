"use client";

import React, { useState } from "react";
import { Project, SceneFeedback } from "@/lib/types";
import { X, Copy, Check, Download, Sparkles, Send } from "lucide-react";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  feedbacks: Record<number, SceneFeedback>;
}

export default function SyncModal({
  isOpen,
  onClose,
  project,
  feedbacks,
}: SyncModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Compile formatted Markdown Matrix
  const generateMarkdown = () => {
    let md = `# Director Review & Revision Matrix: ${project.title}\n`;
    md += `> **Client:** ${project.client} | **Format:** ${project.format} (${project.dimensions})\n`;
    md += `> **Review Date:** ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}\n`;
    md += `> **Total Scenes:** ${project.scenesCount} | **Duration:** ${project.totalDuration}\n\n`;

    md += `## 1. Summary of Scene Approvals\n\n`;
    md += `| Scene | Title | Status | Quick Tags | Directives & Voice Notes |\n`;
    md += `|:---|:---|:---|:---|:---|\n`;

    project.scenes.forEach((scene) => {
      const fb = feedbacks[scene.id] || {
        status: "pending",
        textNotes: "",
        tags: [],
        voiceTranscript: "",
      };

      const statusBadge =
        fb.status === "approved"
          ? "✅ Approved"
          : fb.status === "needs_edits"
          ? "⚠️ Needs Edits"
          : "⏳ Pending";

      const tagsStr = fb.tags && fb.tags.length > 0 ? fb.tags.join(", ") : "None";
      const notesClean = fb.textNotes ? fb.textNotes.replace(/\n/g, " ") : "No notes yet";

      md += `| Scene ${scene.id} | ${scene.title} | ${statusBadge} | ${tagsStr} | ${notesClean} |\n`;
    });

    md += `\n## 2. Granular Scene-by-Scene Revisions\n\n`;

    project.scenes.forEach((scene) => {
      const fb = feedbacks[scene.id];
      if (!fb || (fb.status === "pending" && !fb.textNotes && !fb.voiceTranscript)) {
        return;
      }

      md += `### Scene ${scene.id}: ${scene.title} (${scene.startTime} - ${scene.endTime})\n`;
      md += `- **Approval Status:** \`${fb.status.toUpperCase()}\`\n`;
      md += `- **Spoken Anchor:** *“${scene.spokenAnchor}”*\n`;
      if (fb.tags && fb.tags.length > 0) {
        md += `- **Tags:** \`${fb.tags.join("`, `")}\`\n`;
      }
      if (fb.voiceTranscript) {
        md += `- **Voice Directive Transcript:**\n  > “${fb.voiceTranscript}”\n`;
      }
      if (fb.textNotes) {
        md += `- **Director Instructions:**\n  ${fb.textNotes}\n`;
      }
      md += `\n`;
    });

    md += `## 3. Production & Rendering Directives\n`;
    md += `- Adhere strictly to Dr Kaka production rules: Warm Clinic Cream (\`#F6F4EB\`), Deep Green (\`#155E47\`), Pure White (\`#FFFFFF\`), Accent Orange (\`#FF7B25\`).\n`;
    md += `- Strictly First-Letter Caps (Title Case) across all headlines and badges. NO ALL CAPS.\n`;
    md += `- Strictly NO "agonist" jargon and NO bottom text pills.\n`;
    md += `- Apply all zoom, timing, and copy revisions specified above and re-render/update assets.\n`;

    return md;
  };

  const markdownContent = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.id}_director_feedback_matrix.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="bg-[#0F1115] border border-white/10 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#D4FF00]/10 border border-[#D4FF00]/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#D4FF00]" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Antigravity Agent Sync Matrix</h2>
              <p className="text-xs text-zinc-400">
                1-click structured review package formatted for immediate agent execution
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Markdown Preview Box */}
        <div className="p-5 overflow-auto flex-1 font-mono text-xs text-zinc-300 bg-[#090A0C]">
          <pre className="whitespace-pre-wrap leading-relaxed selection:bg-[#D4FF00] selection:text-black">
            {markdownContent}
          </pre>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 border-t border-white/[0.08] bg-[#14171E] flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-zinc-400">
            Copy and paste this into Antigravity chat to trigger instant bulk scene edits.
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download .md</span>
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#c4ec00] text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(212,255,0,0.3)] active:scale-95"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-950 stroke-[3]" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-black" />
                  <span>Copy for Antigravity</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
