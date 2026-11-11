"use client";

import React, { useState, useEffect, useRef } from "react";
import { Scene, Project, VisualAnnotation, AnnotationTool } from "@/lib/types";
import { getRegionDescription, ANNOTATION_COLORS } from "@/lib/annotation-utils";
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Circle,
  Square,
  PenTool,
  Undo2,
  Trash2,
  MapPin,
  Film,
  Play,
} from "lucide-react";

interface SceneViewerProps {
  scene: Scene;
  project: Project;
  annotations?: VisualAnnotation[];
  onAnnotationsChange?: (annotations: VisualAnnotation[]) => void;
  onPrev: () => void;
  onNext: () => void;
  hasPrev: boolean;
  hasNext: boolean;
}

export default function SceneViewer({
  scene,
  project,
  annotations = [],
  onAnnotationsChange,
  onPrev,
  onNext,
  hasPrev,
  hasNext,
}: SceneViewerProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [viewMode, setViewMode] = useState<"video" | "mockup">(scene.videoUrl ? "video" : "mockup");

  useEffect(() => {
    if (scene.videoUrl) {
      setViewMode("video");
    }
  }, [scene.id, scene.videoUrl]);

  // Annotation states
  const [isAnnotating, setIsAnnotating] = useState<boolean>(false);
  const [activeTool, setActiveTool] = useState<AnnotationTool>("circle");
  const [activeColor, setActiveColor] = useState<string>(ANNOTATION_COLORS[0].hex);
  const [isDrawing, setIsDrawing] = useState<boolean>(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentPoint, setCurrentPoint] = useState<{ x: number; y: number } | null>(null);
  const [freehandPoints, setFreehandPoints] = useState<{ x: number; y: number }[]>([]);

  const overlayRef = useRef<SVGSVGElement | null>(null);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === "ArrowLeft" && hasPrev && !isDrawing) onPrev();
      if (e.key === "ArrowRight" && hasNext && !isDrawing) onNext();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [hasPrev, hasNext, onPrev, onNext, isDrawing]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(140, Math.max(70, prev + delta)));
  };

  // Convert mouse/touch event into 0 - 100 percentage coordinates of the canvas
  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!overlayRef.current) return { x: 50, y: 50 };
    const rect = overlayRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

    const x = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((clientY - rect.top) / rect.height) * 100));
    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isAnnotating) return;
    const coords = getCoordinates(e);
    setIsDrawing(true);
    setStartPoint(coords);
    setCurrentPoint(coords);
    if (activeTool === "freehand") {
      setFreehandPoints([coords]);
    }
  };

  const drawMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing || !startPoint) return;
    const coords = getCoordinates(e);
    setCurrentPoint(coords);
    if (activeTool === "freehand") {
      setFreehandPoints((prev) => [...prev, coords]);
    }
  };

  const finishDrawing = () => {
    if (!isDrawing || !startPoint) return;
    setIsDrawing(false);

    const endPoint = currentPoint || startPoint;
    const nextNumber = (annotations.length || 0) + 1;
    let newAnnotation: VisualAnnotation | null = null;

    if (activeTool === "circle") {
      const rx = Math.abs(endPoint.x - startPoint.x);
      const ry = Math.abs(endPoint.y - startPoint.y);
      if (rx < 1.5 && ry < 1.5) {
        newAnnotation = {
          id: `pin_${Date.now()}`,
          number: nextNumber,
          type: "circle",
          x: startPoint.x,
          y: startPoint.y,
          radius: 12,
          color: activeColor,
          regionDescription: getRegionDescription(startPoint.x, startPoint.y),
        };
      } else {
        newAnnotation = {
          id: `pin_${Date.now()}`,
          number: nextNumber,
          type: "circle",
          x: startPoint.x,
          y: startPoint.y,
          width: rx,
          height: ry,
          radius: Math.max(rx, ry),
          color: activeColor,
          regionDescription: getRegionDescription(startPoint.x, startPoint.y, rx * 2, ry * 2),
        };
      }
    } else if (activeTool === "box") {
      const minX = Math.min(startPoint.x, endPoint.x);
      const minY = Math.min(startPoint.y, endPoint.y);
      const width = Math.abs(endPoint.x - startPoint.x);
      const height = Math.abs(endPoint.y - startPoint.y);
      if (width > 2 && height > 2) {
        newAnnotation = {
          id: `pin_${Date.now()}`,
          number: nextNumber,
          type: "box",
          x: minX,
          y: minY,
          width,
          height,
          color: activeColor,
          regionDescription: getRegionDescription(minX + width / 2, minY + height / 2, width, height),
        };
      }
    } else if (activeTool === "freehand" && freehandPoints.length > 3) {
      const avgX = freehandPoints.reduce((acc, p) => acc + p.x, 0) / freehandPoints.length;
      const avgY = freehandPoints.reduce((acc, p) => acc + p.y, 0) / freehandPoints.length;
      newAnnotation = {
        id: `pin_${Date.now()}`,
        number: nextNumber,
        type: "freehand",
        x: avgX,
        y: avgY,
        points: freehandPoints,
        color: activeColor,
        regionDescription: getRegionDescription(avgX, avgY),
      };
    }

    if (newAnnotation && onAnnotationsChange) {
      onAnnotationsChange([...annotations, newAnnotation]);
    }

    setStartPoint(null);
    setCurrentPoint(null);
    setFreehandPoints([]);
  };

  const handleUndo = () => {
    if (!annotations.length || !onAnnotationsChange) return;
    onAnnotationsChange(annotations.slice(0, -1));
  };

  const handleClearAll = () => {
    if (onAnnotationsChange) {
      onAnnotationsChange([]);
    }
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-between bg-[#0F1115] border border-white/[0.08] rounded-2xl p-4 lg:p-6 overflow-hidden relative shadow-2xl">
      
      {/* Top Viewport Toolbar */}
      <div className="w-full flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/[0.08]">
        
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

        {/* Action Controls: Annotate Mode + Zoom */}
        <div className="flex items-center gap-2">
          
          {/* Mode Switcher: Video vs Mockup */}
          {scene.videoUrl && (
            <div className="flex items-center gap-1 bg-[#14171E] border border-white/10 rounded-xl p-0.5 text-xs">
              <button
                onClick={() => setViewMode("video")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === "video"
                    ? "bg-[#155E47] text-white shadow-[0_0_12px_rgba(21,94,71,0.5)]"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="Watch rendered Remotion MP4 video"
              >
                <Film className="w-3.5 h-3.5" />
                <span>Rendered MP4</span>
              </button>
              <button
                onClick={() => setViewMode("mockup")}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-lg font-semibold transition-all ${
                  viewMode === "mockup"
                    ? "bg-[#155E47] text-white shadow-[0_0_12px_rgba(21,94,71,0.5)]"
                    : "text-zinc-400 hover:text-white"
                }`}
                title="View vector storyboard layout"
              >
                <span>Storyboard</span>
              </button>
            </div>
          )}

          {/* Circle / Annotate Toggle Button */}
          <button
            onClick={() => setIsAnnotating(!isAnnotating)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              isAnnotating
                ? "bg-[#EF4444] text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse"
                : "bg-[#14171E] border border-white/10 text-zinc-300 hover:text-white hover:border-[#D4FF00]"
            }`}
          >
            <Circle className="w-3.5 h-3.5 fill-current" />
            <span>{isAnnotating ? "Drawing Mode ON" : "Circle Area"}</span>
            {annotations.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded-full bg-black/40 text-[10px]">
                {annotations.length}
              </span>
            )}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 bg-[#14171E] border border-white/5 rounded-lg p-1 text-xs">
            <button
              onClick={() => handleZoom(-15)}
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5"
              title="Zoom Out"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="px-1.5 font-mono text-zinc-300 min-w-[38px] text-center">
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
              className="p-1 rounded text-zinc-400 hover:text-white hover:bg-white/5 ml-0.5"
              title="Reset Zoom"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Annotation Palette (Visible when Drawing Mode is active) */}
      {isAnnotating && (
        <div className="w-full mb-3 p-2.5 rounded-xl bg-[#14171E] border border-[#EF4444]/40 flex flex-wrap items-center justify-between gap-3 text-xs animate-fadeIn">
          
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Tool:</span>
            
            <button
              onClick={() => setActiveTool("circle")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTool === "circle"
                  ? "bg-[#EF4444] text-white shadow-sm"
                  : "bg-black/30 text-zinc-400 hover:text-white"
              }`}
            >
              <Circle className="w-3.5 h-3.5" />
              <span>Circle</span>
            </button>

            <button
              onClick={() => setActiveTool("box")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTool === "box"
                  ? "bg-[#EF4444] text-white shadow-sm"
                  : "bg-black/30 text-zinc-400 hover:text-white"
              }`}
            >
              <Square className="w-3.5 h-3.5" />
              <span>Box</span>
            </button>

            <button
              onClick={() => setActiveTool("freehand")}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium transition-all ${
                activeTool === "freehand"
                  ? "bg-[#EF4444] text-white shadow-sm"
                  : "bg-black/30 text-zinc-400 hover:text-white"
              }`}
            >
              <PenTool className="w-3.5 h-3.5" />
              <span>Freehand Pen</span>
            </button>
          </div>

          {/* Color Swatches */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Color:</span>
            <div className="flex items-center gap-1.5">
              {ANNOTATION_COLORS.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setActiveColor(c.hex)}
                  className={`w-5 h-5 rounded-full border-2 transition-transform ${
                    activeColor === c.hex ? "scale-125 border-white shadow-md" : "border-transparent opacity-80"
                  }`}
                  style={{ backgroundColor: c.hex }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Undo & Clear */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleUndo}
              disabled={!annotations.length}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 text-zinc-300 hover:text-white disabled:opacity-40"
              title="Undo Last Annotation"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>Undo</span>
            </button>
            <button
              onClick={handleClearAll}
              disabled={!annotations.length}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-black/40 text-red-400 hover:bg-red-500/20 disabled:opacity-40"
              title="Clear All Annotations"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      )}

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

        {/* 16:9 Landscape Cinema Display Container vs 9:16 Phone Device Container */}
        <div
          style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}
          className={`relative transition-transform duration-200 ${
            project.aspectRatio === "16:9"
              ? "aspect-[16/9] w-full max-w-[820px] lg:max-w-[880px] h-auto rounded-[24px] p-2.5 sm:p-3 bg-[#1A1E27] border-[3px] border-zinc-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
              : "aspect-[9/16] h-[580px] max-w-[326px] sm:h-[640px] sm:max-w-[360px] rounded-[32px] p-2 bg-[#1A1E27] border-[3px] border-zinc-700/80 shadow-[0_25px_60px_rgba(0,0,0,0.9)] overflow-hidden flex flex-col"
          }`}
        >
          {/* Phone Speaker Notch - Only for 9:16 Vertical */}
          {project.aspectRatio !== "16:9" && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-24 h-4 bg-[#090A0C] rounded-full z-30 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-1 bg-zinc-800 rounded-full"></div>
              <div className="w-2 h-2 ml-2 rounded-full bg-blue-900/40"></div>
            </div>
          )}

          {/* Scene Visual Canvas (Inside Screen) */}
          <div className="relative w-full h-full rounded-[20px] overflow-hidden bg-[#F6F4EB] text-[#155E47] flex flex-col justify-between select-none">
            
            {/* Video Player or SVG Visual Composition */}
            {viewMode === "video" && scene.videoUrl ? (
              <div className="w-full h-full relative bg-[#F6F4EB] flex items-center justify-center overflow-hidden">
                <video
                  key={scene.videoUrl}
                  src={scene.videoUrl}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>
            ) : project.aspectRatio === "16:9" ? (
              renderLandscapeVisual(scene)
            ) : (
              renderVerticalVisual(scene)
            )}

            {/* Interactive Annotation Drawing Layer (SVG Overlay) */}
            <svg
              ref={overlayRef}
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              onMouseDown={startDrawing}
              onMouseMove={drawMove}
              onMouseUp={finishDrawing}
              onMouseLeave={finishDrawing}
              onTouchStart={startDrawing}
              onTouchMove={drawMove}
              onTouchEnd={finishDrawing}
              className={`absolute inset-0 w-full h-full z-30 ${
                isAnnotating ? "cursor-crosshair pointer-events-auto" : "pointer-events-none"
              }`}
            >
              {/* Existing Committed Annotations */}
              {annotations.map((ann) => {
                const badgeX = ann.x + (ann.radius ? ann.radius * 0.7 : (ann.width ? ann.width / 2 : 0));
                const badgeY = Math.max(4, ann.y - (ann.radius ? ann.radius * 0.7 : (ann.height ? ann.height / 2 : 0)));

                return (
                  <g key={ann.id} className="transition-opacity">
                    {/* Circle shape */}
                    {ann.type === "circle" && (
                      <ellipse
                        cx={`${ann.x}`}
                        cy={`${ann.y}`}
                        rx={`${ann.width || ann.radius || 10}`}
                        ry={`${ann.height || ann.radius || 10}`}
                        stroke={ann.color}
                        strokeWidth="1.2"
                        strokeDasharray="2.5 1.5"
                        fill={ann.color}
                        fillOpacity="0.12"
                      />
                    )}

                    {/* Box shape */}
                    {ann.type === "box" && (
                      <rect
                        x={`${ann.x}`}
                        y={`${ann.y}`}
                        width={`${ann.width || 20}`}
                        height={`${ann.height || 20}`}
                        stroke={ann.color}
                        strokeWidth="1.2"
                        strokeDasharray="2.5 1.5"
                        fill={ann.color}
                        fillOpacity="0.12"
                        rx="2"
                      />
                    )}

                    {/* Freehand path */}
                    {ann.type === "freehand" && ann.points && (
                      <path
                        d={ann.points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                        stroke={ann.color}
                        strokeWidth="1.2"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    )}

                    {/* Numbered Pin Marker Badge */}
                    <g transform={`translate(${badgeX}, ${badgeY})`} className="cursor-pointer">
                      <circle cx="0" cy="0" r="3.6" fill={ann.color} filter="drop-shadow(0 2px 4px rgba(0,0,0,0.5))" />
                      <circle cx="0" cy="0" r="3.2" fill={ann.color} stroke="#FFFFFF" strokeWidth="0.5" />
                      <text
                        x="0"
                        y="1.1"
                        textAnchor="middle"
                        fontFamily="'Poppins', sans-serif"
                        fontWeight="800"
                        fontSize="2.4"
                        fill="#FFFFFF"
                      >
                        {ann.number}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Live In-Progress Drawing Preview */}
              {isDrawing && startPoint && currentPoint && (
                <g>
                  {activeTool === "circle" && (
                    <ellipse
                      cx={`${startPoint.x}`}
                      cy={`${startPoint.y}`}
                      rx={`${Math.abs(currentPoint.x - startPoint.x)}`}
                      ry={`${Math.abs(currentPoint.y - startPoint.y)}`}
                      stroke={activeColor}
                      strokeWidth="1.4"
                      strokeDasharray="2 2"
                      fill={activeColor}
                      fillOpacity="0.2"
                    />
                  )}

                  {activeTool === "box" && (
                    <rect
                      x={`${Math.min(startPoint.x, currentPoint.x)}`}
                      y={`${Math.min(startPoint.y, currentPoint.y)}`}
                      width={`${Math.abs(currentPoint.x - startPoint.x)}`}
                      height={`${Math.abs(currentPoint.y - startPoint.y)}`}
                      stroke={activeColor}
                      strokeWidth="1.4"
                      strokeDasharray="2 2"
                      fill={activeColor}
                      fillOpacity="0.2"
                      rx="2"
                    />
                  )}

                  {activeTool === "freehand" && freehandPoints.length > 1 && (
                    <path
                      d={freehandPoints.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ")}
                      stroke={activeColor}
                      strokeWidth="1.4"
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  )}
                </g>
              )}
            </svg>

            {/* Simulated Live Reel UI Overlay (Bottom Icons) */}
            <div className="absolute right-3 bottom-12 flex flex-col items-center gap-3 z-20 text-[#155E47]/70 pointer-events-none">
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm border border-[#155E47]/20 flex items-center justify-center text-xs">❤️</div>
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm border border-[#155E47]/20 flex items-center justify-center text-xs">💬</div>
              <div className="w-8 h-8 rounded-full bg-white/70 backdrop-blur-sm border border-[#155E47]/20 flex items-center justify-center text-xs">✈️</div>
            </div>

            {/* Bottom Third Safe Zone Indicator */}
            <div className="absolute bottom-2 left-4 right-16 py-1 px-2.5 rounded-lg bg-black/25 backdrop-blur-sm border border-white/10 text-[9px] text-white/90 flex items-center justify-between pointer-events-none z-20">
              <span className="font-semibold">
                {project.client.toLowerCase().includes("dr kaka") ? "@drkaka • Longevity" : project.client}
              </span>
              <span className="text-[#FF7B25] font-bold">Sound: Original</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Scene Spoken Anchor Callout */}
      <div className="w-full mt-4 p-3 rounded-xl bg-[#14171E] border border-white/[0.08] flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1">
          <div className="w-2 h-2 rounded-full bg-[#FF7B25] shrink-0"></div>
          <div className="text-xs">
            <span className="font-bold text-[#FF7B25] uppercase tracking-wider text-[10px] mr-2">
              Spoken Anchor:
            </span>
            <span className="text-zinc-200 font-serif italic">
              “{scene.spokenAnchor}”
            </span>
          </div>
        </div>

        {/* Circled count indicator */}
        {annotations.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold shrink-0">
            <MapPin className="w-3.5 h-3.5" />
            <span>{annotations.length} Target {annotations.length === 1 ? "Area" : "Areas"} Circled</span>
          </div>
        )}
      </div>
    </div>
  );
}

// 16:9 Landscape Visual Renderer for Dr Kaka's African Food Storyboard
function renderLandscapeVisual(scene: Scene) {
  return (
    <div className="w-full h-full p-6 sm:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden bg-[#F6F4EB] text-[#155E47]">
      {/* Subtle Radial Paper Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.85)_0%,rgba(246,244,235,0.4)_60%,rgba(229,223,201,0.7)_100%)] pointer-events-none" />

      {/* Top Header Divider Line (Clean, Pristine, Zero Text) */}
      <div className="relative z-10 w-full border-b border-[rgba(21,94,71,0.15)] pb-1" />

      {/* Center 16:9 Split: Left 45% Typography Stack | Right 55% Visual Hero (Clean, Unboxed, Zero Clutter) */}
      <div className="relative z-10 flex-1 grid grid-cols-12 gap-6 lg:gap-8 items-center py-4">
        {/* Left Column: Unboxed Typography */}
        <div className="col-span-5 flex flex-col justify-center">
          {scene.connectiveText && (
            <div className="font-serif italic text-base sm:text-lg lg:text-xl text-[#FF7B25] mb-2 leading-tight">
              {scene.connectiveText}
            </div>
          )}
          <h2 className="font-extrabold text-2xl sm:text-3xl lg:text-4xl text-[#155E47] leading-[1.12] tracking-tight mb-3">
            {scene.headlineText}
          </h2>
          <p className="font-medium text-xs sm:text-sm lg:text-base text-[rgba(21,94,71,0.8)] leading-relaxed">
            {scene.highlightText}
          </p>
        </div>

        {/* Right Column: Hero Visual SVG */}
        <div className="col-span-7 flex items-center justify-center relative min-h-[240px] sm:min-h-[300px]">
          {scene.svgMarkup ? (
            <div
              className="w-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[340px]"
              dangerouslySetInnerHTML={{ __html: scene.svgMarkup }}
            />
          ) : (
            <div className="text-xs text-zinc-400">Visual Hero Graphic</div>
          )}
        </div>
      </div>
    </div>
  );
}

// Vertical 9:16 Visual Renderer: Renders 3D storyboard image when present, bespoke SVG markup, or legacy vectors
function renderVerticalVisual(scene: Scene) {
  if (scene.thumbnailUrl && !scene.svgMarkup) {
    return (
      <div className="w-full h-full relative overflow-hidden bg-[#0369A1] select-none flex flex-col justify-between">
        {/* Full-bleed 9:16 3D Storyboard Keyframe */}
        <img
          src={scene.thumbnailUrl}
          alt={scene.title}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/60 pointer-events-none" />

        {/* Top Meta Scene Bar */}
        <div className="relative z-10 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#38BDF8] text-black font-extrabold text-[10px] tracking-wider shadow-md">
              SCENE {scene.id.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] font-mono font-semibold text-white/90 drop-shadow">
              {scene.startTime} – {scene.endTime}
            </span>
          </div>
          {scene.badgeDetail && (
            <div className="px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-sm border border-[#38BDF8]/40 text-[9px] font-bold text-[#38BDF8] tracking-wide uppercase">
              {scene.badgeDetail}
            </div>
          )}
        </div>

        {/* Zack D Style Lower-Third Kinetic Subtitle Preview (Safely above MarginV=440 zone) */}
        <div className="relative z-10 px-4 pb-20 text-center pointer-events-none">
          <div className="inline-block mb-1.5 px-2 py-0.5 rounded bg-black/50 text-[9px] font-bold uppercase tracking-widest text-[#38BDF8]">
            {scene.connectiveText}
          </div>
          <p
            className="text-base sm:text-lg font-black text-white leading-tight tracking-tight"
            style={{
              textShadow:
                "-2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 2px 2px 0 #000, 0 4px 10px rgba(0,0,0,0.8)",
            }}
          >
            {scene.headlineText}
          </p>
        </div>
      </div>
    );
  }

  if (scene.svgMarkup) {
    return (
      <div className="w-full h-full p-4 sm:p-5 flex flex-col justify-between relative overflow-hidden bg-[#F6F4EB] text-[#155E47] select-none">
        {/* Subtle Radial Paper Vignette */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(255,255,255,0.85)_0%,rgba(246,244,235,0.4)_60%,rgba(229,223,201,0.7)_100%)] pointer-events-none" />

        {/* Top Meta Scene Bar */}
        <div className="relative z-10 flex items-center justify-between border-b border-[rgba(21,94,71,0.12)] pb-2">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-[#155E47] text-white font-bold text-[10px] sm:text-xs tracking-wider">
              SCENE {scene.id.toString().padStart(2, "0")}
            </span>
            <span className="text-[10px] sm:text-xs font-mono font-semibold text-[rgba(21,94,71,0.65)]">
              {scene.startTime} – {scene.endTime}
            </span>
          </div>
          {scene.badgeDetail && (
            <div className="px-2 py-0.5 rounded-full bg-[rgba(255,123,37,0.12)] border border-[rgba(255,123,37,0.25)] text-[9px] sm:text-[10px] font-bold text-[#FF7B25] tracking-wide uppercase">
              {scene.badgeDetail}
            </div>
          )}
        </div>

        {/* Header Typography Stack */}
        <div className="relative z-10 text-center pt-2 pb-1">
          <div className="text-[10px] sm:text-xs font-semibold text-[#FF7B25] uppercase tracking-widest mb-0.5">
            {scene.connectiveText}
          </div>
          <h2 className="text-lg sm:text-xl font-extrabold text-[#155E47] tracking-tight leading-snug line-clamp-2">
            {scene.headlineText}
          </h2>
          {scene.highlightText && (
            <p className="text-[11px] sm:text-xs text-[rgba(21,94,71,0.75)] font-medium mt-0.5 line-clamp-1">
              {scene.highlightText}
            </p>
          )}
        </div>

        {/* Center Hero Visual SVG Card (Expands cleanly into lower-third negative space) */}
        <div className="relative z-10 flex-1 flex items-center justify-center my-2 px-1 overflow-hidden">
          <div
            className="w-full h-full flex items-center justify-center [&>svg]:w-full [&>svg]:h-auto [&>svg]:max-h-[300px] drop-shadow-sm"
            dangerouslySetInnerHTML={{ __html: scene.svgMarkup }}
          />
        </div>
      </div>
    );
  }

  // Fallback for legacy scenes without svgMarkup (renders hardcoded vector graphics)
  return renderSceneVisual(scene.id, scene);
}

// Custom SVG Visual Renderers for Dr Kaka's Scenes with Precision Director Revisions
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

      {/* Top Header Typography Stack - Clean, Unboxed & Breathing */}
      <g transform="translate(180, 92)">
        <text
          x="0"
          y="0"
          textAnchor="middle"
          fontFamily="'Poppins', sans-serif"
          fontWeight="400"
          fontSize="11.5"
          fill="#FF7B25"
          letterSpacing="1.2"
        >
          {scene.connectiveText}
        </text>
        <text
          x="0"
          y="32"
          textAnchor="middle"
          fontFamily="'Poppins', sans-serif"
          fontWeight="800"
          fontSize="24"
          fill="#155E47"
          letterSpacing="-0.5"
        >
          {scene.headlineText}
        </text>
      </g>

      {/* Scene-Specific Vector Graphics with Director Pinpoint Revisions */}
      {renderSceneGraphic(sceneId, scene)}
    </svg>
  );
}

function renderSceneGraphic(sceneId: number, scene: Scene) {
  switch (sceneId) {
    case 1:
      // Clean high-authority clinical shield - centered & prominent
      return (
        <g transform="translate(180, 320)">
          <path
            d="M0 -75 C50 -75 88 -50 88 0 C88 62 38 100 0 125 C-38 100 -88 62 -88 0 C-88 -50 -50 -75 0 -75 Z"
            fill="#155E47"
            filter="drop-shadow(0 16px 32px rgba(21,94,71,0.25))"
          />
          <path
            d="M0 -62 C40 -62 70 -42 70 0 C70 50 30 82 0 102 C-30 82 -70 50 -70 0 C-70 -42 -40 -62 0 -62 Z"
            fill="#FFFFFF"
            opacity="0.15"
          />
          <path
            d="M-28 2 L-8 22 L32 -18"
            stroke="#FF7B25"
            strokeWidth="10"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <circle cx="0" cy="12" r="105" stroke="#155E47" strokeWidth="2" strokeDasharray="6 6" fill="none" opacity="0.3" />
        </g>
      );
    case 2:
      // Debunking the 10-Year Myth - Clean head profile, neural aura & clean strikethrough (box removed)
      return (
        <g transform="translate(180, 310)">
          <path
            d="M-45 50 C-45 0 -22 -48 12 -48 C46 -48 58 -24 58 0 C58 18 52 30 46 42 C40 54 46 72 52 84 L-45 84 Z"
            fill="none"
            stroke="#155E47"
            strokeWidth="4"
            strokeLinecap="round"
          />
          <circle cx="16" cy="0" r="16" fill="#FF7B25" opacity="0.25" />
          <circle cx="16" cy="0" r="7" fill="#FF7B25" />
          
          {/* Strikethrough Myth Card */}
          <g transform="translate(0, 115)">
            <rect x="-135" y="0" width="270" height="42" rx="14" fill="#FFFFFF" stroke="rgba(255,123,37,0.35)" filter="drop-shadow(0 6px 16px rgba(21,94,71,0.06))" />
            <text x="0" y="27" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="12" fontWeight="600" fill="#FF7B25" textDecoration="line-through">
              Myth: Unknown 10-Yr Mutations
            </text>
          </g>

          {/* Clean reality text beneath (unboxed per director directive) */}
          <text x="0" y="180" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="12" fontWeight="700" fill="#155E47">
            Reality: 20 Years of Human Clinical Care
          </text>
        </g>
      );
    case 3:
      // Two Decades of Track Record - Generously spaced timeline with overlapping circle removed
      return (
        <g transform="translate(180, 320)">
          {/* Broad, spaced timeline axis */}
          <line x1="-125" y1="0" x2="125" y2="0" stroke="#155E47" strokeWidth="4" strokeLinecap="round" />
          
          {/* Left Milestone: 2005 */}
          <g transform="translate(-95, 0)">
            <circle cx="0" cy="0" r="16" fill="#155E47" />
            <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
            
            <rect x="-42" y="-48" width="84" height="30" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1.5" />
            <text x="0" y="-28" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="13" fill="#155E47">2005</text>
            
            <text x="0" y="32" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="10.5" fill="#155E47">
              T2D Approved
            </text>
          </g>

          {/* Right Milestone: Today - Generously spaced out, redundant inner circle removed */}
          <g transform="translate(95, 0)">
            <circle cx="0" cy="0" r="16" fill="#FF7B25" />
            <circle cx="0" cy="0" r="6" fill="#FFFFFF" />
            
            <rect x="-42" y="-48" width="84" height="30" rx="8" fill="#FF7B25" />
            <text x="0" y="-28" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="800" fontSize="13" fill="#FFFFFF">TODAY</text>
            
            <text x="0" y="32" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="10.5" fill="#FF7B25">
              20 Years of Proven Use
            </text>
          </g>
        </g>
      );
    case 4:
      // The Newer Dual Compounds - Side-by-side cards
      return (
        <g transform="translate(180, 320)">
          <rect x="-140" y="-55" width="130" height="120" rx="18" fill="#FFFFFF" stroke="rgba(21,94,71,0.18)" filter="drop-shadow(0 8px 18px rgba(21,94,71,0.06))" />
          <text x="-75" y="-14" textAnchor="middle" fontSize="20">🏛️</text>
          <text x="-75" y="18" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="13" fill="#155E47">GLP-1 Base</text>
          <text x="-75" y="36" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10.5" fill="rgba(21,94,71,0.7)">2005 - Present</text>
          
          <rect x="10" y="-55" width="130" height="120" rx="18" fill="#FFFFFF" stroke="rgba(255,123,37,0.3)" filter="drop-shadow(0 8px 18px rgba(21,94,71,0.06))" />
          <text x="75" y="-14" textAnchor="middle" fontSize="20">⚡</text>
          <text x="75" y="18" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="13" fill="#155E47">Tirzepatide</text>
          <text x="75" y="36" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10.5" fill="#FF7B25">Dual Action</text>
        </g>
      );
    case 5:
      // Proven Systemic Benefits - Concentric waves & 4 satellite tags
      return (
        <g transform="translate(180, 320)">
          <circle cx="0" cy="-10" r="95" stroke="#155E47" strokeWidth="1.5" strokeDasharray="4 4" fill="none" opacity="0.25" />
          <circle cx="0" cy="-10" r="68" stroke="#FF7B25" strokeWidth="2" strokeDasharray="3 3" fill="none" opacity="0.35" />
          
          <circle cx="0" cy="-60" r="18" fill="#155E47" />
          <path d="M-32 -26 L32 -26 L22 45 L-22 45 Z" fill="#155E47" />
          <circle cx="0" cy="-15" r="10" fill="#FF7B25" />
          
          <g transform="translate(-115, -55)">
            <rect width="70" height="26" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1" />
            <text x="35" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="#155E47">❤️ Heart</text>
          </g>
          <g transform="translate(45, -55)">
            <rect width="70" height="26" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1" />
            <text x="35" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="#155E47">💤 Sleep</text>
          </g>
          <g transform="translate(-125, 20)">
            <rect width="80" height="26" rx="8" fill="#FFFFFF" stroke="#FF7B25" strokeWidth="1" />
            <text x="40" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="#FF7B25">🩸 Glucose</text>
          </g>
          <g transform="translate(45, 20)">
            <rect width="76" height="26" rx="8" fill="#FFFFFF" stroke="#155E47" strokeWidth="1" />
            <text x="38" y="17" textAnchor="middle" fontSize="11" fontWeight="700" fill="#155E47">🦵 Joints</text>
          </g>
        </g>
      );
    case 6:
      // Cardiovascular Protection - Heart & ECG Waveform
      return (
        <g transform="translate(180, 315)">
          <path
            d="M0 -35 C-45 -90 -100 -35 -100 12 C-100 68 0 115 0 125 C0 115 100 68 100 12 C100 -35 45 -90 0 -35 Z"
            fill="#FFFFFF"
            stroke="#155E47"
            strokeWidth="3.5"
            filter="drop-shadow(0 14px 28px rgba(21,94,71,0.12))"
          />
          <path
            d="M-70 20 L-35 20 L-22 -12 L-10 45 L6 -35 L18 35 L30 20 L70 20"
            stroke="#FF7B25"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </g>
      );
    case 7:
      // Restoring Sleep & Blood Sugar - Clean split cards
      return (
        <g transform="translate(180, 320)">
          <rect x="-140" y="-60" width="130" height="130" rx="20" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" filter="drop-shadow(0 8px 18px rgba(21,94,71,0.08))" />
          <text x="-75" y="-14" textAnchor="middle" fontSize="22">🌙</text>
          <text x="-75" y="18" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="13" fill="#155E47">Sleep Apnea</text>
          <text x="-75" y="36" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10.5" fill="rgba(21,94,71,0.7)">Airway Patency</text>
          
          <rect x="10" y="-60" width="130" height="130" rx="20" fill="#FFFFFF" stroke="rgba(255,123,37,0.25)" filter="drop-shadow(0 8px 18px rgba(21,94,71,0.08))" />
          <text x="75" y="-14" textAnchor="middle" fontSize="22">🩸</text>
          <text x="75" y="18" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="13" fill="#155E47">Blood Sugar</text>
          <text x="75" y="36" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontSize="10.5" fill="#FF7B25">HbA1c Balance</text>
        </g>
      );
    case 8:
      // Joint & Mobility Relief - Authentic Anatomical Knee Joint Illustration per Director Note
      return (
        <g transform="translate(180, 310)">
          {/* Femur (Thigh Bone - Top) */}
          <path
            d="M-22 -80 L-22 -25 C-22 -15 -38 -5 -38 12 C-38 24 -24 30 -10 30 C-2 30 0 24 0 20 C0 24 2 30 10 30 C24 30 38 24 38 12 C38 -5 22 -15 22 -25 L22 -80 Z"
            fill="#FFFFFF"
            stroke="#155E47"
            strokeWidth="3.5"
            strokeLinejoin="round"
            filter="drop-shadow(0 8px 16px rgba(21,94,71,0.1))"
          />
          
          {/* Patella (Kneecap - Center Floating Anteriorly) */}
          <ellipse
            cx="0"
            cy="12"
            rx="16"
            ry="18"
            fill="#FAF8F2"
            stroke="#FF7B25"
            strokeWidth="3"
            filter="drop-shadow(0 4px 10px rgba(255,123,37,0.2))"
          />
          <text x="0" y="16" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="9" fill="#FF7B25">
            PATELLA
          </text>

          {/* Meniscus / Cartilage Decompression Gap (Glowing Warm Relief) */}
          <ellipse cx="0" cy="38" rx="36" ry="7" fill="rgba(255,123,37,0.2)" stroke="#FF7B25" strokeWidth="2" strokeDasharray="3 3" />

          {/* Tibia & Fibula (Shin & Calf Bones - Bottom) */}
          <path
            d="M-36 46 C-36 40 -20 36 0 36 C20 36 36 40 36 46 L26 100 L-26 100 Z"
            fill="#FFFFFF"
            stroke="#155E47"
            strokeWidth="3.5"
            strokeLinejoin="round"
          />
          {/* Fibula side bone */}
          <path d="M38 58 L46 68 L42 100" stroke="#155E47" strokeWidth="3" fill="#FFFFFF" />

          {/* Decompression indicators: 4x pressure eased */}
          <text x="0" y="125" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" fill="#155E47">
            Mechanical Load Relieved
          </text>
        </g>
      );
    case 9:
      // Managing Short-Term Effects - 3 Clinical Titration Steps
      return (
        <g transform="translate(180, 290)">
          <g transform="translate(0, 0)">
            <rect x="-135" y="0" width="270" height="42" rx="12" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" filter="drop-shadow(0 4px 10px rgba(21,94,71,0.05))" />
            <circle cx="-108" cy="21" r="11" fill="#155E47" />
            <text x="-108" y="25" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">1</text>
            <text x="-85" y="26" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#155E47">Gentle Titration Pacing</text>
          </g>
          <g transform="translate(0, 54)">
            <rect x="-135" y="0" width="270" height="42" rx="12" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" filter="drop-shadow(0 4px 10px rgba(21,94,71,0.05))" />
            <circle cx="-108" cy="21" r="11" fill="#155E47" />
            <text x="-108" y="25" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">2</text>
            <text x="-85" y="26" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#155E47">Adequate Hydration & Protein</text>
          </g>
          <g transform="translate(0, 108)">
            <rect x="-135" y="0" width="270" height="42" rx="12" fill="#155E47" filter="drop-shadow(0 6px 14px rgba(21,94,71,0.18))" />
            <circle cx="-108" cy="21" r="11" fill="#FF7B25" />
            <text x="-108" y="25" textAnchor="middle" fontSize="11" fontWeight="800" fill="#FFFFFF">3</text>
            <text x="-85" y="26" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="12" fill="#FFFFFF">Transient Adaptation (Weeks)</text>
          </g>
        </g>
      );
    case 10:
      // Scientific Nuance & Realism - Balanced Scales with Generous Card Width & Fitting Text
      return (
        <g transform="translate(180, 310)">
          {/* Fulcrum base */}
          <path d="M0 65 L0 -20" stroke="#155E47" strokeWidth="4" />
          <polygon points="-28,65 28,65 0,25" fill="#155E47" />
          <line x1="-115" y1="-20" x2="115" y2="-20" stroke="#155E47" strokeWidth="4" strokeLinecap="round" />
          <circle cx="0" cy="-20" r="7" fill="#FF7B25" />

          {/* Left Plate: Rigorous Standards (widened to 120px so text fits comfortably) */}
          <line x1="-85" y1="-20" x2="-85" y2="15" stroke="rgba(21,94,71,0.4)" strokeWidth="2" />
          <rect x="-145" y="15" width="120" height="48" rx="12" fill="#FFFFFF" stroke="#155E47" strokeWidth="1.5" filter="drop-shadow(0 6px 14px rgba(21,94,71,0.08))" />
          <text x="-85" y="36" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" fill="#155E47">
            Rigorous Oversight
          </text>
          <text x="-85" y="52" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="500" fontSize="9.5" fill="rgba(21,94,71,0.7)">
            FDA & MHRA Trials
          </text>

          {/* Right Plate: Individual Patient Fit (widened to 120px) */}
          <line x1="85" y1="-20" x2="85" y2="15" stroke="rgba(21,94,71,0.4)" strokeWidth="2" />
          <rect x="25" y="15" width="120" height="48" rx="12" fill="#FFFFFF" stroke="#FF7B25" strokeWidth="1.5" filter="drop-shadow(0 6px 14px rgba(21,94,71,0.08))" />
          <text x="85" y="36" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" fill="#155E47">
            Individual Fit
          </text>
          <text x="85" y="52" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="9.5" fill="#FF7B25">
            Doctor-Guided
          </text>
        </g>
      );
    case 11:
      // The Specialist Evidence Base - Journal Stack & Credential Seal
      return (
        <g transform="translate(180, 310)">
          <rect x="-115" y="-60" width="230" height="34" rx="8" fill="#FFFFFF" stroke="rgba(21,94,71,0.18)" opacity="0.6" />
          <text x="0" y="-38" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="11.5" fill="#155E47">
            New England Journal of Medicine
          </text>
          
          <rect x="-125" y="-28" width="250" height="36" rx="8" fill="#FFFFFF" stroke="rgba(21,94,71,0.22)" opacity="0.85" />
          <text x="0" y="-5" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="12.5" fontWeight="600" fill="#155E47">
            The Lancet Diabetes & Endocrinology
          </text>
          
          <rect x="-135" y="18" width="270" height="60" rx="16" fill="#155E47" filter="drop-shadow(0 12px 28px rgba(21,94,71,0.22))" />
          <text x="0" y="44" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="13" fill="#FFFFFF">
            Obesity Medicine Specialist
          </text>
          <text x="0" y="62" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="600" fontSize="10" fill="#FF7B25">
            100+ PEER-REVIEWED TRIALS EVALUATED
          </text>
        </g>
      );
    case 12:
    default:
      // Doctor Partnership & Sign-Off - Caduceus emblem & clean quote card
      return (
        <g transform="translate(180, 300)">
          <circle cx="0" cy="-45" r="32" fill="#155E47" filter="drop-shadow(0 8px 20px rgba(21,94,71,0.2))" />
          <path d="M-10 -45 L0 -57 L10 -45 L0 -33 Z" fill="#FFFFFF" />
          <circle cx="0" cy="-45" r="4" fill="#FF7B25" />
          
          <rect x="-140" y="5" width="280" height="92" rx="18" fill="#FFFFFF" stroke="rgba(21,94,71,0.15)" filter="drop-shadow(0 12px 28px rgba(21,94,71,0.08))" />
          <text x="0" y="34" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="13" fill="#155E47">
            “Targeted tools work best when guided
          </text>
          <text x="0" y="52" textAnchor="middle" fontFamily="'Playfair Display', serif" fontStyle="italic" fontSize="13" fill="#155E47">
            by personal clinical care.”
          </text>
          <text x="0" y="78" textAnchor="middle" fontFamily="'Poppins', sans-serif" fontWeight="700" fontSize="11" fill="#155E47">
            Dr Kaka · Preventive Medicine
          </text>
        </g>
      );
  }
}
