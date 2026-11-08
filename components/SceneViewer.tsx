"use client";

import React, { useState, useEffect } from "react";
import { Scene, Project } from "@/lib/types";
import { ZoomIn, ZoomOut, Maximize2, ChevronLeft, ChevronRight, Play, Pause, RotateCcw } from "lucide-react";

interface SceneViewerProps {
  scene: Scene;
  project: Project;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function SceneViewer({
  scene,
  project,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: SceneViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev) onPrev();
      if (e.key === "ArrowRight" && hasNext) onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, onPrev, onNext]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(140, Math.max(70, prev + delta)));
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between bg-[#0F1115] border border-white/[0.08] rounded-2xl p-4 lg:p-6 overflow-hidden relative shadow-2xl">
      
      {/* Top Viewport Toolbar */}
      <div className="w-full flex items-center justify-between mb-4 pb-3 border-b border-white/[0.08]">
        
        {/* Scene Indicator & Timecode */}
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-1 rounded-md bg-[#155E47] text-white font-bold text-xs tracking-wider">
            SCENE {scene.id.toString().padStart(2, "0")}
          </span>
          <span className="text-xs font-mono text-zinc-400">
            {scene.startTime} – {scene.endTime} ({scene.duration}s)
          </span>
          <span className="hidden sm:inline-block text-xs font-semibold text-zinc-300">
            • {scene.title}
          </span>
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1.5 bg-[#14171E] border border-white/5 rounded-lg p-1 text-xs">
          <button
            onClick={() => handleZoom(-15)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-zinc-300 min-w-[42px] text-center">
            {zoomLevel}%
          </span>
          <button
            onClick={() => handleZoom(15)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setZoomLevel(100)}
            className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5 ml-1"
            title="Reset Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Center 9:16 Mobile Mockup Theater */}
      <div className="relative flex-1 w-full flex items-center justify-center overflow-auto py-2">
        
        {/* Navigation Arrow Left */}
        {hasPrev && (
          <button
            onClick={onPrev}
            className="absolute left-2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-[#D4FF00] text-white hover:text-black border border-white/10 transition-all shadow-lg active:scale-95"
            title="Previous Scene (Left Arrow)"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Navigation Arrow Right */}
        {hasNext && (
          <button
            onClick={onNext}
            className="absolute right-2 z-20 p-2.5 rounded-full bg-black/60 hover:bg-[#D4FF00] text-white hover:text-black border border-white/10 transition-all shadow-lg active:scale-95"
            title="Next Scene (Right Arrow)"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}

        {/* 9:16 Phone Device Container */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
          className="relative transition-transform duration-200 aspect-[9/16] h-[580px] max-w-[326px] sm:h-[640px] sm:max-w-[360px] rounded-[32px] p-2 bg-[#1A1E27] border-[3px] border-zinc-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
        >
          {/* Phone Speaker Notch */}
          <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#090A0C] rounded-full z-30 flex items-center justify-center">
            <div className="w-8 h-1 bg-zinc-800 rounded-full"></div>
            <div className="w-2 h-2 ml-2 rounded-full bg-blue-900/40"></div>
          </div>

          {/* Scene Visual Canvas (Inside Phone Screen) */}
          <div className="relative w-full h-full rounded-[24px] overflow-hidden bg-[#F6F4EB] text-[#155E47] flex flex-col justify-between select-none">
            
            {/* SVG Visual Composition based on scene ID */}
            {renderSceneVisual(scene.id, scene)}

            {/* Simulated Live Reel UI Overlay (Bottom Icons) */}
            <div className="absolute right-3 bottom-12 flex flex-col items-center gap-3 z-20 text-[#155E47]/70">
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm border border-[#155E47]/20 flex items-center justify-center text-xs">❤️</div>
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm border border-[#155E47]/20 flex items-center justify-center text-xs">💬</div>
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm border border-[#155E47]/20 flex items-center justify-center text-xs">✈️</div>
            </div>

            {/* Bottom Third Safe Zone Indicator */}
            <div className="absolute bottom-2 left-4 right-16 py-1 px-2.5 rounded-lg bg-black/10 backdrop-blur-xs border border-black/5 text-[9px] text-[#155E47]/80 flex items-center justify-between pointer-events-none">
              <span className="font-semibold">@drkaka • Longevity</span>
              <span className="text-[#FF7B25] font-bold">Sound: Original</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scene Spoken Anchor Callout */}
      <div className="w-full mt-4 p-3 rounded-xl bg-[#14171E] border border-white/[0.08] flex items-center gap-3">
        <div className="w-2 h-2 rounded-full bg-[#FF7B25] shrink-0"></div>
        <div className="flex-1 text-xs">
          <span className="font-bold text-[#FF7B25] uppercase tracking-wider text-[10px] mr-2">
            Spoken Anchor:
          </span>
          <span className="text-zinc-200 font-serif italic">
            “{scene.spokenAnchor}”
          </span>
        </div>
      </div>
    </div>
  );
}

// Custom SVG Visual Renderers for Dr Kaka's Scenes
function renderSceneVisual(sceneId: number, scene: Scene) {
  return (
    <svg viewBox="0 0 360 640" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      {/* Canvas Background (Warm Clinic Cream) */}
      <rect width="360" height="640" fill="#F6F4EB" />
      {/* Radial Vignette */}
      <radialGradient id={`grad_${sceneId}`} cx="50%" cy="45%" r="65%">
        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
        <stop offset="60%" stopColor="#F6F4EB" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#E5DFC9" stopOpacity="0.7" />
      </radialGradient>
      <rect width="360" height="640" fill={`url(#grad_${sceneId})`} />

      {/* Scene Number Indicator Badge */}
      <rect x="24" y="24" width="76" height="24" rx="12" fill="#155E47" />
      <text
        x="62"
        y="40"
        textAnchor="middle"
        fontFamily="'Poppins', sans-serif"
        fontWeight="700"
        fontSize="10"
        fill="#FFFFFF"
      >
        SCENE {sceneId.toString().padStart(2, "0")}
      </text>

      <text
        x="336"
        y="40"
        textAnchor="end"
        fontFamily="'Poppins', sans-serif"
        fontWeight="600"
        fontSize="10"
        fill="rgba(21,94,71,0.6)"
      >
        {scene.startTime}
      </text>

      {/* Top Header Typography Stack */}
      <g transform="translate(180, 85)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontFamily="'Poppins', sans-serif"
          fontWeight="300"
          fontSize="11"
          fill="#155E47"
          letterSpacing="1.5"
        >
          {scene.connectiveText.toUpperCase()}
        </text>
        <text
          x="0"
          y="28"
          textAnchor="middle"
          fontFamily="'Poppins', sans-serif"
          fontWeight="800"
          fontSize="21"
          fill="#155E47"
          letterSpacing="-0.5"
        >
          {scene.headlineText}
        </text>
        <g transform="translate(0, 42)">
          <rect
            x="-100"
            y="0"
            width="200"
            height="28"
            rx="14"
            fill="#155E47"
            filter="drop-shadow(0 6px 14px rgba(21,94,71,0.2))"
          />
          <text
            x="0"
            y="19"
            textAnchor="middle"
            fontFamily="'Playfair Display', serif"
            fontStyle="italic"
            fontWeight="600"
            fontSize="12.5"
            fill="#FFFFFF"
          >
            {scene.highlightText}
          </text>
        </g>
      </g>

      {/* Scene-Specific Vector Graphics */}
      {renderSceneGraphic(sceneId, scene)}

      {/* Badge Pill Above Safe Zone */}
      {scene.badgeDetail && (
        <g transform="translate(180, 520)">
          <rect
            x="-115"
            y="-16"
            width="230"
            height="32"
            rx="16"
            fill="#FFFFFF"
            stroke="rgba(21,94,71,0.2)"
            filter="drop-shadow(0 4px 12px rgba(21,94,71,0.08))"
          />
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fontFamily="'Poppins', sans-serif"
            fontWeight="700"
            fontSize="10"
            fill="#155E47"
          >
            {scene.badgeDetail}
          </text>
        </g>
      )}
    </svg>
  );
}

function renderSceneGraphic(sceneId: number, scene: Scene) {
  switch (sceneId) {
    case 1:
      return (
        <g transform="translate(180, 310)">
          <path
            d="M0 -60 C40 -60 70 -40 70 0 C70 50 30 80 0 100 C-30 80 -70 50 -70 0 C-70 -40 -40 -60 0 -60 Z"
            fill="#155E47"
            filter="drop-shadow(0 12px 24px rgba(21,94,71,0.25))"
          />
          <path
            d="M0 -50 C32 -50 56 -34 56 0 C56 40 24 66 0 82 C-24 66 -56 40 -56 0 C-56 -34 -32 -50 0 -50 Z"
            fill="#FFFFFF"
            opacity="0.15"
          />
          <path
            d="M-22 2 L-6 18 L24 -14"
            stroke="#FF7B25"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="0" cy="10" r="85" stroke="#155E47" strokeWidth="2" strokeDasharray="6 6" fill="none" opacity="0.4" />
        </g>
      );
    case 2:
      return (
        <g transform="translate(180, 270)">
          <path
            d="M-40 40 C-40 0 -20 -40 10 -40 C40 -40 50 -20 50 0 C50 15 45 25 40 35 C35 45 40 60 45 70 L-40 70 Z"
            fill="none"
            stroke="#155E47"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <circle cx="15" cy="0" r="14" fill="#FF7B25" opacity="0.25" />
          <circle cx="15" cy="0" r="6" fill="#FF7B25" />
          <g transform="translate(0, 95)">
            <rect x="-130" y="0" width="260" height="38" rx="12" fill="#FFFFFF" stroke="rgba(255,123,37,0.3)" />
            <text x="0" y="24" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="11" fontWeight="600" fill="#FF7B25" textDecoration="line-through">
              Myth: Unknown 10-Yr Mutations
            </text>
          </g>
          <g transform="translate(0, 142)">
            <rect x="-130" y="0" width="260" height="38" rx="12" fill="#155E47" />
            <text x="0" y="24" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="11" fontWeight="700" fill="#FFFFFF">
              Reality: 20 Years of Human Care
            </text>
          </g>
        </g>
      );
    case 3:
      return (
        <g transform="translate(180, 310)">
          <line x1="-120" y1="0" x2="120" y2="0" stroke="#155E47" strokeWidth="4" strokeLinecap="round" />
          <circle cx="-100" cy="0" r="16" fill="#155E47" />
          <circle cx="-100" cy="0" r="7" fill="#FFFFFF" />
          <rect x="-140" y="-48" width="80" height="30" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1.5" />
          <text x="-100" y="-28" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="13" fill="#155E47">2005</text>
          <text x="-100" y="24" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10" fill="#155E47">T2D Approved</text>
          <circle cx="100" cy="0" r="18" fill="#FF7B25" />
          <circle cx="100" cy="0" r="8" fill="#FFFFFF" />
          <rect x="60" y="-48" width="80" height="30" rx="8" fill="#FF7B25" />
          <text x="100" y="-28" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="13" fill="#FFFFFF">TODAY</text>
          <text x="100" y="24" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="10" fill="#FF7B25">20 Years Later</text>
        </g>
      );
    case 4:
      return (
        <g transform="translate(180, 310)">
          <rect x="-135" y="-50" width="125" height="110" rx="16" fill="#FFFFFF" stroke="rgba(21,94,71,0.18)" />
          <text x="-72" y="-12" textAnchor="middle" fontSize="18">🏛️</text>
          <text x="-72" y="16" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#155E47">GLP-1 Base</text>
          <text x="-72" y="32" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10" fill="rgba(21,94,71,0.7)">2005 - Present</text>
          <rect x="10" y="-50" width="125" height="110" rx="16" fill="#FFFFFF" stroke="rgba(255,123,37,0.3)" />
          <text x="72" y="-12" textAnchor="middle" fontSize="18">⚡</text>
          <text x="72" y="16" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#155E47">Tirzepatide</text>
          <text x="72" y="32" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10" fill="#FF7B25">Dual Action</text>
        </g>
      );
    case 5:
      return (
        <g transform="translate(180, 310)">
          <circle cx="0" cy="-10" r="85" stroke="#155E47" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.3" />
          <circle cx="0" cy="-10" r="60" stroke="#FF7B25" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.4" />
          <circle cx="0" cy="-55" r="16" fill="#155E47" />
          <path d="M-28 -25 L28 -25 L20 40 L-20 40 Z" fill="#155E47" />
          <circle cx="0" cy="-15" r="9" fill="#FF7B25" />
          <g transform="translate(-105, -50)">
            <rect width="64" height="24" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1" />
            <text x="32" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#155E47">❤️ Heart</text>
          </g>
          <g transform="translate(42, -50)">
            <rect width="64" height="24" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1" />
            <text x="32" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#155E47">💤 Sleep</text>
          </g>
          <g transform="translate(-115, 20)">
            <rect width="76" height="24" rx="8" fill="#FFFFFF" stroke="#FF7B25" strokeWidth="1" />
            <text x="38" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#FF7B25">🩸 Glucose</text>
          </g>
          <g transform="translate(40, 20)">
            <rect width="70" height="24" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1" />
            <text x="35" y="16" textAnchor="middle" fontSize="10" fontWeight="700" fill="#155E47">🦵 Joints</text>
          </g>
        </g>
      );
    case 6:
      return (
        <g transform="translate(180, 310)">
          <path
            d="M0 -30 C-40 -80 -90 -30 -90 10 C-90 60 0 100 0 110 C0 100 90 60 90 10 C90 -30 40 -80 0 -30 Z"
            fill="#FFFFFF"
            stroke="#155E47"
            strokeWidth="3"
            filter="drop-shadow(0 12px 24px rgba(21,94,71,0.12))"
          />
          <path
            d="M-60 20 L-30 20 L-20 -10 L-10 40 L5 -30 L15 30 L25 20 L60 20"
            stroke="#FF7B25"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <rect x="-110" y="125" width="220" height="32" rx="12" fill="#155E47" />
          <text x="0" y="146" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="10.5" fill="#FFFFFF">
            20% Event Risk Reduction
          </text>
        </g>
      );
    case 7:
      return (
        <g transform="translate(180, 305)">
          <rect x="-135" y="-55" width="125" height="120" rx="18" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" />
          <text x="-72" y="-12" textAnchor="middle" fontSize="18">🌙</text>
          <text x="-72" y="16" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#155E47">Sleep Apnea</text>
          <text x="-72" y="32" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10" fill="rgba(21,94,71,0.7)">Airway Patency</text>
          <rect x="10" y="-55" width="125" height="120" rx="18" fill="#FFFFFF" stroke="rgba(255,123,37,0.25)" />
          <text x="72" y="-12" textAnchor="middle" fontSize="18">🩸</text>
          <text x="72" y="16" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#155E47">Blood Sugar</text>
          <text x="72" y="32" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10" fill="#FF7B25">HbA1c Balance</text>
        </g>
      );
    case 8:
      return (
        <g transform="translate(180, 310)">
          <path d="M-35 -50 C-35 -10 -15 0 -15 20 C-15 40 -35 50 -35 90" stroke="#155E47" strokeWidth="6" strokeLinecap="round" fill="none" />
          <path d="M35 -50 C35 -10 15 0 15 20 C15 40 35 50 35 90" stroke="#155E47" strokeWidth="6" strokeLinecap="round" fill="none" />
          <circle cx="0" cy="18" r="28" fill="rgba(255,123,37,0.15)" stroke="#FF7B25" strokeWidth="2" strokeDasharray="4 4" />
          <circle cx="0" cy="18" r="8" fill="#FF7B25" />
        </g>
      );
    case 9:
      return (
        <g transform="translate(180, 270)">
          <rect x="-130" y="0" width="260" height="38" rx="10" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" />
          <text x="-85" y="24" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" fill="#155E47">1. Gentle Titration Pacing</text>
          <rect x="-130" y="48" width="260" height="38" rx="10" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" />
          <text x="-85" y="72" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" fill="#155E47">2. Hydration & Protein Focus</text>
          <rect x="-130" y="96" width="260" height="38" rx="10" fill="#155E47" />
          <text x="-85" y="120" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" fill="#FFFFFF">3. Transient Adaptation (Weeks)</text>
        </g>
      );
    case 10:
      return (
        <g transform="translate(180, 310)">
          <path d="M0 60 L0 -20" stroke="#155E47" strokeWidth="4" />
          <polygon points="-25,60 25,60 0,25" fill="#155E47" />
          <line x1="-100" y1="-20" x2="100" y2="-20" stroke="#155E47" strokeWidth="4" strokeLinecap="round" />
          <circle cx="0" cy="-20" r="7" fill="#FF7B25" />
          <rect x="-130" y="15" width="100" height="42" rx="10" fill="#FFFFFF" stroke="#155E47" strokeWidth="1.5" />
          <text x="-80" y="34" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="10" fill="#155E47">Rigorous Oversight</text>
          <rect x="30" y="15" width="100" height="42" rx="10" fill="#FFFFFF" stroke="#FF7B25" strokeWidth="1.5" />
          <text x="80" y="34" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="10" fill="#155E47">Individual Fit</text>
        </g>
      );
    case 11:
      return (
        <g transform="translate(180, 310)">
          <rect x="-105" y="-55" width="210" height="32" rx="8" fill="#FFFFFF" stroke="rgba(21,94,71,0.18)" opacity="0.6" />
          <text x="0" y="-35" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="11" fill="#155E47">New England Journal of Medicine</text>
          <rect x="-115" y="-25" width="230" height="34" rx="8" fill="#FFFFFF" stroke="rgba(21,94,71,0.22)" opacity="0.85" />
          <text x="0" y="-4" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="12" fontWeight="600" fill="#155E47">The Lancet Diabetes & Endocrinology</text>
          <rect x="-125" y="16" width="250" height="56" rx="16" fill="#155E47" />
          <text x="0" y="40" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#FFFFFF">Obesity Medicine Specialist</text>
          <text x="0" y="58" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9.5" fill="#FF7B25">100+ PEER-REVIEWED TRIALS EVALUATED</text>
        </g>
      );
    case 12:
    default:
      return (
        <g transform="translate(180, 290)">
          <circle cx="0" cy="-40" r="32" fill="#155E47" />
          <path d="M-10 -40 L0 -52 L10 -40 L0 -28 Z" fill="#FFFFFF" />
          <circle cx="0" cy="-40" r="4" fill="#FF7B25" />
          <rect x="-135" y="10" width="270" height="88" rx="18" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" />
          <text x="0" y="38" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="12.5" fill="#155E47">“Targeted tools work best when guided</text>
          <text x="0" y="56" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="12.5" fill="#155E47">by personal clinical care.”</text>
          <text x="0" y="82" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="10.5" fill="#155E47">Dr Kaka · Preventive Medicine</text>
        </g>
      );
  }
}
