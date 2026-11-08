"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import SceneViewer from "@/components/SceneViewer";
import FeedbackPanel from "@/components/FeedbackPanel";
import SyncModal from "@/components/SyncModal";
import { INITIAL_PROJECTS } from "@/lib/projects-data";
import { Project, SceneFeedback, ReviewStatus, VisualAnnotation } from "@/lib/types";
import {
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Layers,
  Check,
  Target,
} from "lucide-react";

export default function ProjectReviewPage() {
  const params = useParams();
  const router = useRouter();
  const projectId = params?.id as string;

  // Find project
  const project = INITIAL_PROJECTS.find((p) => p.id === projectId) || INITIAL_PROJECTS[0];

  const [currentSceneIndex, setCurrentSceneIndex] = useState<number>(0);
  const [feedbacks, setFeedbacks] = useState<Record<number, SceneFeedback>>({});
  const [isSyncModalOpen, setIsSyncModalOpen] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Load saved feedbacks from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`motion_feedback_${project.id}`);
      if (saved) {
        setFeedbacks(JSON.parse(saved));
      } else {
        // Initialize default empty feedback states
        const initialMap: Record<number, SceneFeedback> = {};
        project.scenes.forEach((scene) => {
          initialMap[scene.id] = {
            sceneId: scene.id,
            status: "pending",
            voiceTranscript: "",
            hasAudio: false,
            textNotes: "",
            tags: [],
            annotations: [],
            updatedAt: "Initialized",
          };
        });
        setFeedbacks(initialMap);
      }
    } catch (e) {
      console.warn("Storage access failed", e);
    }
    setIsLoaded(true);
  }, [project.id, project.scenes]);

  // Save to localStorage whenever feedback updates
  const handleUpdateFeedback = (updated: SceneFeedback) => {
    setFeedbacks((prev) => {
      const nextState = { ...prev, [updated.sceneId]: updated };
      try {
        localStorage.setItem(`motion_feedback_${project.id}`, JSON.stringify(nextState));
      } catch (e) {
        console.warn("Failed saving feedback to storage", e);
      }
      return nextState;
    });
  };

  const currentScene = project.scenes[currentSceneIndex] || project.scenes[0];
  const currentFeedback: SceneFeedback = feedbacks[currentScene.id] || {
    sceneId: currentScene.id,
    status: "pending",
    voiceTranscript: "",
    hasAudio: false,
    textNotes: "",
    tags: [],
    annotations: [],
    updatedAt: "Initialized",
  };

  // Stats calculation
  const approvedCount = Object.values(feedbacks).filter((f) => f.status === "approved").length;
  const needsEditsCount = Object.values(feedbacks).filter((f) => f.status === "needs_edits").length;
  const pendingCount = project.scenes.length - approvedCount - needsEditsCount;
  const totalPinsCount = Object.values(feedbacks).reduce(
    (acc, f) => acc + (f.annotations?.length || 0),
    0
  );

  return (
    <div className="min-h-screen bg-[#090A0C] text-[#F0F3F7] flex flex-col justify-between">
      
      {/* Top Navbar */}
      <div>
        <Navbar />

        {/* Project Header & Progress Bar */}
        <div className="bg-[#0F1115] border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-4">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            {/* Left: Back & Project Title */}
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="p-2 rounded-xl bg-[#14171E] border border-white/5 hover:border-white/20 text-zinc-400 hover:text-white transition-all"
                title="Back to Dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#155E47] text-white">
                    {project.client}
                  </span>
                  <span className="text-xs text-zinc-400">• {project.format}</span>
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
                  {project.title}
                </h1>
              </div>
            </div>

            {/* Right: Progress Tracker & Agent Sync CTA */}
            <div className="flex items-center gap-3">
              {/* Progress & Pin Counters */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#14171E] border border-white/5 text-xs">
                <span className="flex items-center gap-1 text-emerald-400 font-semibold" title="Approved scenes">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {approvedCount}
                </span>
                <span className="text-zinc-600">/</span>
                <span className="flex items-center gap-1 text-amber-400 font-semibold" title="Scenes needing edits">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  {needsEditsCount}
                </span>
                <span className="text-zinc-600">/</span>
                <span className="flex items-center gap-1 text-zinc-400 font-medium" title="Pending review">
                  <Clock className="w-3.5 h-3.5" />
                  {pendingCount}
                </span>
                {totalPinsCount > 0 && (
                  <>
                    <span className="text-zinc-600">•</span>
                    <span className="flex items-center gap-1 text-[#EF4444] font-bold" title="Total targeted areas circled">
                      <Target className="w-3.5 h-3.5" />
                      {totalPinsCount}
                    </span>
                  </>
                )}
              </div>

              {/* 1-Click Sync Button */}
              <button
                onClick={() => setIsSyncModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#D4FF00] hover:bg-[#c4ec00] text-black font-bold text-xs transition-all shadow-[0_0_15px_rgba(212,255,0,0.3)] active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-black" />
                <span>Sync to Antigravity</span>
              </button>
            </div>
          </div>
        </div>

        {/* Scene Filmstrip Selector Strip */}
        <div className="bg-[#090A0C] border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3">
          <div className="max-w-7xl mx-auto flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
            {project.scenes.map((scene, idx) => {
              const fb = feedbacks[scene.id];
              const isSelected = idx === currentSceneIndex;
              const status = fb?.status || "pending";
              const pinCount = fb?.annotations?.length || 0;

              return (
                <button
                  key={scene.id}
                  onClick={() => setCurrentSceneIndex(idx)}
                  className={`flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-xl border text-xs transition-all duration-200 relative ${
                    isSelected
                      ? "bg-[#1A1E27] border-[#D4FF00] text-white shadow-[0_0_12px_rgba(212,255,0,0.2)]"
                      : "bg-[#0F1115] border-white/5 hover:border-white/20 text-zinc-400 hover:text-zinc-200"
                  }`}
                >
                  <span className="font-bold">Scene {scene.id}</span>
                  
                  {/* Circled Pin Indicator */}
                  {pinCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[#EF4444] text-[9px] font-black text-white flex items-center justify-center">
                      {pinCount}
                    </span>
                  )}

                  {/* Status Indicator Dot */}
                  {status === "approved" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 ring-4 ring-emerald-400/20" />
                  )}
                  {status === "needs_edits" && pinCount === 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 ring-4 ring-amber-400/20" />
                  )}
                  {status === "pending" && pinCount === 0 && (
                    <span className="w-2 h-2 rounded-full bg-zinc-600" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Master Workspace: Split Viewer & Feedback Panel */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col lg:flex-row gap-6 items-stretch">
            
            {/* Center: 9:16 Scene Mockup Viewer with Annotation Overlay */}
            <SceneViewer
              scene={currentScene}
              project={project}
              annotations={currentFeedback.annotations || []}
              onAnnotationsChange={(newAnnotations: VisualAnnotation[]) => {
                handleUpdateFeedback({
                  ...currentFeedback,
                  annotations: newAnnotations,
                  status:
                    newAnnotations.length > 0 && currentFeedback.status === "pending"
                      ? "needs_edits"
                      : currentFeedback.status,
                });
              }}
              onPrev={() => setCurrentSceneIndex((prev) => Math.max(0, prev - 1))}
              onNext={() => setCurrentSceneIndex((prev) => Math.min(project.scenes.length - 1, prev + 1))}
              hasPrev={currentSceneIndex > 0}
              hasNext={currentSceneIndex < project.scenes.length - 1}
            />

            {/* Right: Feedback, Voice Directives & Circled Pinpoints Panel */}
            <FeedbackPanel
              scene={currentScene}
              feedback={currentFeedback}
              onUpdateFeedback={handleUpdateFeedback}
            />
          </div>
        </div>
      </div>

      {/* Sticky Bottom Review Summary Bar */}
      <div className="sticky bottom-0 z-40 bg-[#0F1115]/95 backdrop-blur-md border-t border-white/[0.08] px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 text-zinc-400">
            <span className="text-white font-semibold">
              Scene {currentSceneIndex + 1} of {project.scenes.length}
            </span>
            <span>•</span>
            <span>Tip: Click <strong>Circle Area</strong> to draw circles around specific elements</span>
            <span>•</span>
            <span className="text-[#D4FF00]">Auto-saves locally</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentSceneIndex((prev) => Math.max(0, prev - 1))}
              disabled={currentSceneIndex === 0}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14171E] border border-white/5 text-zinc-300 disabled:opacity-40 hover:bg-white/5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            <button
              onClick={() => setCurrentSceneIndex((prev) => Math.min(project.scenes.length - 1, prev + 1))}
              disabled={currentSceneIndex === project.scenes.length - 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#14171E] border border-white/5 text-zinc-300 disabled:opacity-40 hover:bg-white/5"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsSyncModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#155E47] hover:bg-[#114937] text-white font-semibold transition-all shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#D4FF00]" />
              <span>Export Matrix</span>
            </button>
          </div>
        </div>
      </div>

      {/* Sync Matrix Modal */}
      <SyncModal
        isOpen={isSyncModalOpen}
        onClose={() => setIsSyncModalOpen(false)}
        project={project}
        feedbacks={feedbacks}
      />
    </div>
  );
}
