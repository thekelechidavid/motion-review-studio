"use client";

import React, { useState, useEffect } from "react";
import { Scene, SceneFeedback, FeedbackTagId, ReviewStatus, VisualAnnotation } from "@/lib/types";
import { FEEDBACK_TAGS } from "@/lib/projects-data";
import VoiceRecorder from "./VoiceRecorder";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Tag,
  MessageSquare,
  Sparkles,
  MapPin,
  Trash2,
  Target,
  Edit2,
  Film,
  Download,
} from "lucide-react";

interface FeedbackPanelProps {
  scene: Scene;
  feedback: SceneFeedback;
  onUpdateFeedback: (updated: SceneFeedback) => void;
  onActivateAnnotate?: () => void;
}

export default function FeedbackPanel({
  scene,
  feedback,
  onUpdateFeedback,
  onActivateAnnotate,
}: FeedbackPanelProps) {
  const [textNotes, setTextNotes] = useState(feedback.textNotes || "");
  const [status, setStatus] = useState<ReviewStatus>(feedback.status || "pending");
  const [tags, setTags] = useState<FeedbackTagId[]>(feedback.tags || []);
  const [annotations, setAnnotations] = useState<VisualAnnotation[]>(feedback.annotations || []);
  const [lastSaved, setLastSaved] = useState<string>("Synced");

  // Sync state when scene changes
  useEffect(() => {
    setTextNotes(feedback.textNotes || "");
    setStatus(feedback.status || "pending");
    setTags(feedback.tags || []);
    setAnnotations(feedback.annotations || []);
  }, [scene.id, feedback]);

  // Update helper
  const saveChange = (
    newNotes: string,
    newStatus: ReviewStatus,
    newTags: FeedbackTagId[],
    newAnnotations?: VisualAnnotation[],
    voiceTrans?: string
  ) => {
    const updated: SceneFeedback = {
      sceneId: scene.id,
      status: newStatus,
      textNotes: newNotes,
      voiceTranscript: voiceTrans !== undefined ? voiceTrans : feedback.voiceTranscript,
      hasAudio: feedback.hasAudio || !!voiceTrans,
      tags: newTags,
      annotations: newAnnotations !== undefined ? newAnnotations : annotations,
      updatedAt: new Date().toLocaleTimeString(),
    };
    onUpdateFeedback(updated);
    setLastSaved("Saved just now");
  };

  const handleStatusChange = (newStatus: ReviewStatus) => {
    setStatus(newStatus);
    saveChange(textNotes, newStatus, tags, annotations);
  };

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setTextNotes(val);
    saveChange(val, status, tags, annotations);
  };

  const handleTagToggle = (tagId: FeedbackTagId) => {
    const newTags = tags.includes(tagId)
      ? tags.filter((t) => t !== tagId)
      : [...tags, tagId];
    setTags(newTags);
    saveChange(textNotes, status, newTags, annotations);
  };

  const handleVoiceTranscript = (transcript: string) => {
    const combined = textNotes.trim()
      ? `${textNotes}\n\n[Voice Note]: ${transcript}`
      : `[Voice Note]: ${transcript}`;
    setTextNotes(combined);
    setStatus("needs_edits");
    saveChange(combined, "needs_edits", tags, annotations, transcript);
  };

  // Annotation note updates
  const handleAnnotationNoteChange = (annId: string, label: string) => {
    const updatedAnns = annotations.map((ann) =>
      ann.id === annId ? { ...ann, label } : ann
    );
    setAnnotations(updatedAnns);
    saveChange(textNotes, status, tags, updatedAnns);
  };

  const handleDeleteAnnotation = (annId: string) => {
    const updatedAnns = annotations.filter((ann) => ann.id !== annId);
    setAnnotations(updatedAnns);
    saveChange(textNotes, status, tags, updatedAnns);
  };

  return (
    <div className="w-full lg:w-[440px] bg-[#0F1115] border border-white/[0.08] rounded-2xl p-5 flex flex-col justify-between shadow-xl">
      
      {/* Top Header & Approval State */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] mb-4">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-[#D4FF00]" />
              <span>Scene {scene.id} Directives</span>
            </h3>
            <p className="text-[11px] text-zinc-400 mt-0.5">{scene.title}</p>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            <span>{lastSaved}</span>
          </div>
        </div>

        {/* Scene Approval Switcher */}
        <div className="mb-4">
          <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block mb-2">
            Review Approval State
          </label>
          <div className="grid grid-cols-3 gap-2">
            
            <button
              onClick={() => handleStatusChange("approved")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                status === "approved"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                  : "bg-[#14171E] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5"
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Approved</span>
            </button>

            <button
              onClick={() => handleStatusChange("needs_edits")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                status === "needs_edits"
                  ? "bg-amber-500/20 text-amber-400 border-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.3)]"
                  : "bg-[#14171E] text-zinc-400 border-white/5 hover:text-white hover:bg-white/5"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Needs Edits</span>
            </button>

            <button
              onClick={() => handleStatusChange("pending")}
              className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold border transition-all ${
                status === "pending"
                  ? "bg-zinc-800 text-zinc-200 border-zinc-500"
                  : "bg-[#14171E] text-zinc-500 border-white/5 hover:text-zinc-300 hover:bg-white/5"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Pending</span>
            </button>
          </div>
        </div>

        {/* Rendered MP4 Video Action */}
        {scene.videoUrl && (
          <div className="mb-4 flex gap-2">
            <a
              href={scene.videoUrl}
              download={`Safe_Scene${scene.id}_Portrait.mp4`}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-[#155E47] hover:bg-[#0E4232] text-white text-xs font-bold border border-white/10 transition-all shadow-md active:scale-98"
            >
              <Download className="w-3.5 h-3.5 text-[#FF7B25]" />
              <span>Download Scene {scene.id} MP4</span>
            </a>
            <a
              href="/videos/isglp1safe/Safe_Master_Full_Portrait.mp4"
              download="Safe_Master_Full_Portrait.mp4"
              className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-[#1A1E27] hover:bg-[#252B37] text-zinc-300 hover:text-white text-xs font-bold border border-white/10 transition-all"
              title="Download Full Master Continuous Video (85s)"
            >
              <Film className="w-3.5 h-3.5 text-[#FF7B25]" />
              <span>Master MP4</span>
            </a>
          </div>
        )}

        {/* Circled Areas / Spatial Pinpoints Section */}
        <div className="mb-4 p-3 rounded-xl bg-[#14171E] border border-white/[0.08]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5 text-[#EF4444]" />
              <span>Circled Pinpoints ({annotations.length})</span>
            </span>
            <span className="text-[10px] text-zinc-400">Exact coordinates sync to agent</span>
          </div>

          {annotations.length === 0 ? (
            <div className="p-2.5 rounded-lg bg-black/30 border border-white/5 text-[11px] text-zinc-400 flex items-center justify-between">
              <span>No areas circled yet. Click <strong>Circle Area</strong> on the preview to pinpoint elements.</span>
            </div>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {annotations.map((ann) => (
                <div
                  key={ann.id}
                  className="p-2.5 rounded-lg bg-black/40 border border-white/10 flex flex-col gap-1.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white shadow-sm"
                        style={{ backgroundColor: ann.color }}
                      >
                        #{ann.number}
                      </div>
                      <span className="text-xs font-semibold text-zinc-200">
                        {ann.regionDescription}
                      </span>
                    </div>

                    <button
                      onClick={() => handleDeleteAnnotation(ann.id)}
                      className="text-zinc-500 hover:text-red-400 transition-colors p-1"
                      title="Remove this pinpoint"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <input
                    type="text"
                    value={ann.label || ""}
                    onChange={(e) => handleAnnotationNoteChange(ann.id, e.target.value)}
                    placeholder="Specific directive for this circle (e.g. 'Make shield 20% bigger')..."
                    className="w-full bg-[#1A1E27] text-zinc-200 placeholder-zinc-500 text-xs rounded-lg px-2.5 py-1.5 border border-white/5 focus:border-[#EF4444] focus:outline-none"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Voice Directive Recorder (Mic + Speech-To-Text) */}
        <div className="mb-4">
          <VoiceRecorder
            onTranscriptReady={handleVoiceTranscript}
            existingAudioUrl={feedback.hasAudio ? "captured" : null}
            onClearAudio={() => {
              const updated = { ...feedback, hasAudio: false, voiceTranscript: "" };
              onUpdateFeedback(updated);
            }}
          />
        </div>

        {/* Quick Tag Selector Chips */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3 h-3 text-[#D4FF00]" />
              <span>Quick Issue Tags</span>
            </span>
            <span className="text-[10px] text-zinc-500">Click to tag</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {FEEDBACK_TAGS.map((tag) => {
              const isSelected = tags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => handleTagToggle(tag.id)}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
                    isSelected
                      ? "bg-[#D4FF00]/15 text-[#D4FF00] border-[#D4FF00]/50 shadow-[0_0_10px_rgba(212,255,0,0.2)]"
                      : "bg-[#14171E] text-zinc-400 border-white/5 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <span>{tag.emoji}</span>
                  <span>{tag.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Text Directive Notes Area */}
        <div className="mb-2">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
              Overall Director Instructions
            </label>
            <span className="text-[10px] text-zinc-500">Auto-synced</span>
          </div>
          
          <textarea
            value={textNotes}
            onChange={handleNotesChange}
            placeholder="Type overall scene instructions here (or use the voice recorder above to speak directly)... e.g. 'Zoom in 15% more on the clinical shield, slow down the checkmark entry by 0.5s, keep headline first-letter caps'."
            rows={4}
            className="w-full bg-[#14171E] text-zinc-200 placeholder-zinc-500 text-xs rounded-xl p-3 border border-white/10 focus:border-[#D4FF00] focus:outline-none focus:ring-1 focus:ring-[#D4FF00]/50 transition-all resize-none leading-relaxed"
          />
        </div>
      </div>

      {/* Visual Spec Summary Info Card */}
      <div className="mt-3 p-3 rounded-xl bg-black/40 border border-white/5 text-[11px] space-y-1 text-zinc-400">
        <div className="flex items-center justify-between text-zinc-300 font-semibold">
          <span>Active Spec:</span>
          <span className="text-[#D4FF00]">Title Case Only</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-relaxed">
          <strong className="text-zinc-300">Visual Anchor:</strong> {scene.visualAnchor}
        </p>
      </div>
    </div>
  );
}
