"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Play,
  Pause,
  Scissors,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  Volume2,
  Copy,
  Check,
  ChevronRight,
  Filter,
  Layers,
  ArrowRight,
  Mic,
  MessageSquare,
  Clock,
  Video,
} from "lucide-react";
import VoiceRecorder from "./VoiceRecorder";

export interface CutItem {
  id: string;
  type: string;
  start: number;
  end: number;
  duration: number;
  status: "KEEP" | "CUT";
  reason?: string;
  text?: string;
  words_count?: number;
}

export interface EDLData {
  project: string;
  raw_file: string;
  raw_duration_sec: number;
  cut_duration_sec: number;
  time_trimmed_sec: number;
  time_trimmed_percent: string;
  kept_segments_count: number;
  cuts_count: number;
  kept_timeline: CutItem[];
  edl: CutItem[];
}

interface Directive {
  id: string;
  segmentId: string;
  timecode: string;
  tag: string;
  notes: string;
  voiceTranscript?: string;
  createdAt: string;
}

const CORRECTIVE_TAGS = [
  { id: "cut_too_tight", label: "Cut Too Tight (+150ms)", emoji: "✂️" },
  { id: "restore_breath", label: "Restore Breath / Pause", emoji: "💨" },
  { id: "wrong_take", label: "Wrong Take Kept", emoji: "🗣️" },
  { id: "missed_filler", label: "Missed Stumble / Filler", emoji: "🗑️" },
  { id: "audio_pop", label: "Audio Pop / Click", emoji: "🎚️" },
  { id: "pacing_slow", label: "Tighten Gap Further", emoji: "⚡" },
];

export default function RoughCutReviewer() {
  const [edlData, setEdlData] = useState<EDLData | null>(null);
  const [activeTab, setActiveTab] = useState<"side_by_side" | "rough_cut" | "raw">("side_by_side");
  const [showCaptions, setShowCaptions] = useState<boolean>(true);
  const [selectedSegment, setSelectedSegment] = useState<CutItem | null>(null);
  const [filterMode, setFilterMode] = useState<"all" | "kept" | "cuts">("all");
  
  // Players
  const rawVideoRef = useRef<HTMLVideoElement | null>(null);
  const cutVideoRef = useRef<HTMLVideoElement | null>(null);
  const [rawCurrentTime, setRawCurrentTime] = useState<number>(0);
  const [cutCurrentTime, setCutCurrentTime] = useState<number>(0);
  const [isRawPlaying, setIsRawPlaying] = useState<boolean>(false);
  const [isCutPlaying, setIsCutPlaying] = useState<boolean>(false);

  // Directives state
  const [selectedTag, setSelectedTag] = useState<string>("cut_too_tight");
  const [textNotes, setTextNotes] = useState<string>("");
  const [voiceNote, setVoiceNote] = useState<string>("");
  const [directives, setDirectives] = useState<Directive[]>([]);
  const [copiedSync, setCopiedSync] = useState<boolean>(false);

  // Load EDL data from public folder
  useEffect(() => {
    fetch("/videos/cut-lab/edl.json")
      .then((res) => res.json())
      .then((data: EDLData) => {
        setEdlData(data);
        if (data.kept_timeline && data.kept_timeline.length > 0) {
          setSelectedSegment(data.kept_timeline[0]);
        }
      })
      .catch((err) => {
        console.error("Failed to load EDL data:", err);
      });
  }, []);

  // Format timecode MM:SS.mmm
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}.${ms
      .toString()
      .padStart(2, "0")}`;
  };

  // Seek video
  const handleSeekRaw = (time: number) => {
    if (rawVideoRef.current) {
      rawVideoRef.current.currentTime = time;
      rawVideoRef.current.play();
      setIsRawPlaying(true);
    }
  };

  const handleSeekCut = (time: number) => {
    if (cutVideoRef.current) {
      cutVideoRef.current.currentTime = time;
      cutVideoRef.current.play();
      setIsCutPlaying(true);
    }
  };

  // Add Directive
  const handleAddDirective = () => {
    if (!selectedSegment) return;
    const tagObj = CORRECTIVE_TAGS.find((t) => t.id === selectedTag);
    const newDirective: Directive = {
      id: `dir_${Date.now()}`,
      segmentId: selectedSegment.id,
      timecode: `${formatTime(selectedSegment.start)} - ${formatTime(selectedSegment.end)}`,
      tag: tagObj ? `${tagObj.emoji} ${tagObj.label}` : selectedTag,
      notes: textNotes.trim(),
      voiceTranscript: voiceNote.trim(),
      createdAt: new Date().toLocaleTimeString(),
    };
    setDirectives((prev) => [newDirective, ...prev]);
    setTextNotes("");
    setVoiceNote("");
  };

  // Compile Antigravity Sync Markdown
  const compileSyncMarkdown = () => {
    if (!edlData) return "";
    let md = `# 🎬 ROUGH CUT REVISION DIRECTIVE MATRIX\n`;
    md += `**Project:** ${edlData.project}\n`;
    md += `**Source:** ${edlData.raw_file}\n`;
    md += `**Raw Duration:** ${formatTime(edlData.raw_duration_sec)} | **Cut Duration:** ${formatTime(
      edlData.cut_duration_sec
    )} (-${edlData.time_trimmed_percent})\n\n`;
    md += `## Corrective Directives (${directives.length})\n\n`;
    md += `| Timecode | Segment | Issue / Tag | Directive Notes | Spoken Voice Note |\n`;
    md += `| :--- | :--- | :--- | :--- | :--- |\n`;
    directives.forEach((d) => {
      md += `| \`${d.timecode}\` | **${d.segmentId}** | ${d.tag} | ${d.notes || "None"} | ${
        d.voiceTranscript ? `"${d.voiceTranscript}"` : "None"
      } |\n`;
    });
    md += `\n\n> **Instruction for Antigravity:** Re-open \`edl.json\` in \`video_cut_lab\`, update the timestamps / padding buffers as instructed above, and re-render \`IMG_0370_rough_cut.mp4\`.\n`;
    return md;
  };

  const handleCopySync = () => {
    const text = compileSyncMarkdown();
    navigator.clipboard.writeText(text);
    setCopiedSync(true);
    setTimeout(() => setCopiedSync(false), 2500);
  };

  if (!edlData) {
    return (
      <div className="p-12 text-center text-zinc-400">
        <Sparkles className="w-8 h-8 mx-auto mb-3 text-[#D4FF00] animate-spin" />
        <p className="text-sm">Loading Cut Lab Timeline & EDL...</p>
      </div>
    );
  }

  const displayedSegments = edlData.edl.filter((item) => {
    if (filterMode === "kept") return item.status === "KEEP";
    if (filterMode === "cuts") return item.status === "CUT";
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      
      {/* Top Metric Bar */}
      <div className="bg-[#0F1115] border border-white/[0.08] rounded-2xl p-5 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#155E47]/30 text-[#4ADE80] border border-[#155E47]/60">
              Dr Kaka • Medical Direct Response
            </span>
            <span className="text-zinc-500 text-xs">•</span>
            <span className="text-zinc-400 text-xs">IMG_0370.MOV (iPhone 16 Pro Max • 9:16 Vertical)</span>
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <span>Rough Cut Review & Pacing Station</span>
            <Scissors className="w-5 h-5 text-[#D4FF00]" />
          </h1>
        </div>

        {/* Granular Cut Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-left">
          <div className="bg-[#14171E] border border-white/5 px-3 py-2 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Raw Footage</span>
            <span className="text-sm font-bold text-white">{formatTime(edlData.raw_duration_sec)}</span>
          </div>
          <div className="bg-[#14171E] border border-white/5 px-3 py-2 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Assembled Cut</span>
            <span className="text-sm font-bold text-[#D4FF00]">{formatTime(edlData.cut_duration_sec)}</span>
          </div>
          <div className="bg-[#14171E] border border-white/5 px-3 py-2 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Dead Space Trimmed</span>
            <span className="text-sm font-bold text-[#FF7B25]">-{edlData.time_trimmed_percent}</span>
          </div>
          <div className="bg-[#14171E] border border-white/5 px-3 py-2 rounded-xl">
            <span className="text-[10px] uppercase font-bold text-zinc-400 block">Padding Buffers</span>
            <span className="text-sm font-bold text-[#4ADE80]">+150ms / +200ms</span>
          </div>
        </div>
      </div>

      {/* Main Dual Player & Directive Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Dual Video Viewports (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Viewport Mode Switcher */}
          <div className="flex items-center justify-between bg-[#14171E] p-1.5 rounded-xl border border-white/5">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab("side_by_side")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "side_by_side"
                    ? "bg-[#D4FF00] text-black shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Side-by-Side (Raw vs Cut)
              </button>
              <button
                onClick={() => setActiveTab("rough_cut")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "rough_cut"
                    ? "bg-[#155E47] text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Rough Cut Solo (4:25)
              </button>
              <button
                onClick={() => setActiveTab("raw")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === "raw"
                    ? "bg-zinc-800 text-white shadow-sm"
                    : "text-zinc-400 hover:text-white"
                }`}
              >
                Raw Footage Solo (5:15)
              </button>
            </div>

            <span className="text-[11px] text-zinc-400 px-2 font-mono">
              {activeTab === "rough_cut" ? `Cut: ${formatTime(cutCurrentTime)}` : `Raw: ${formatTime(rawCurrentTime)}`}
            </span>
          </div>

          {/* Video Frames Container */}
          <div className={`grid gap-4 ${activeTab === "side_by_side" ? "grid-cols-2" : "grid-cols-1"}`}>
            
            {/* Raw Footage Player */}
            {(activeTab === "side_by_side" || activeTab === "raw") && (
              <div className="bg-[#0F1115] border border-white/[0.08] rounded-2xl overflow-hidden shadow-xl flex flex-col">
                <div className="bg-[#14171E] px-3 py-2 border-b border-white/5 flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                    Raw Footage (Uncut)
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">{formatTime(rawCurrentTime)} / {formatTime(edlData.raw_duration_sec)}</span>
                </div>
                <div className="relative aspect-[9/16] bg-black flex items-center justify-center overflow-hidden">
                  <video
                    ref={rawVideoRef}
                    src="/videos/cut-lab/raw_preview.mp4"
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    onTimeUpdate={(e) => setRawCurrentTime(e.currentTarget.currentTime)}
                    onPlay={() => setIsRawPlaying(true)}
                    onPause={() => setIsRawPlaying(false)}
                  />
                </div>
              </div>
            )}

            {/* Assembled Cut Player */}
            {(activeTab === "side_by_side" || activeTab === "rough_cut") && (
              <div className="bg-[#0F1115] border border-[#155E47]/60 rounded-2xl overflow-hidden shadow-[0_0_30px_rgba(21,94,71,0.2)] flex flex-col">
                <div className="bg-[#155E47]/30 px-3 py-2 border-b border-[#155E47]/50 flex items-center justify-between">
                  <span className="text-xs font-bold text-[#4ADE80] flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#D4FF00] animate-pulse"></span>
                    <span>Cut Master {showCaptions ? "• Captions ON" : "• Clean"}</span>
                  </span>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowCaptions(!showCaptions)}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold transition-all ${
                        showCaptions
                          ? "bg-[#D4FF00] text-black shadow-sm"
                          : "bg-zinc-800 text-zinc-300 hover:text-white"
                      }`}
                    >
                      {showCaptions ? "Captions: ON" : "Captions: OFF"}
                    </button>
                    <a
                      href="/videos/cut-lab/captions.srt"
                      download="Dr_Kaka_GLP1_Captions.srt"
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#155E47] text-white hover:bg-[#1b7a5d] transition-all"
                    >
                      SRT ↓
                    </a>
                    <span className="text-[10px] font-mono text-[#4ADE80]">
                      {formatTime(cutCurrentTime)} / {formatTime(edlData.cut_duration_sec)}
                    </span>
                  </div>
                </div>
                <div className="relative aspect-[9/16] bg-black flex items-center justify-center overflow-hidden">
                  <video
                    key={showCaptions ? "captioned" : "clean"}
                    ref={cutVideoRef}
                    src={showCaptions ? "/videos/cut-lab/cut_captioned.mp4" : "/videos/cut-lab/cut_preview.mp4"}
                    controls
                    playsInline
                    className="w-full h-full object-contain"
                    onTimeUpdate={(e) => setCutCurrentTime(e.currentTarget.currentTime)}
                    onPlay={() => setIsCutPlaying(true)}
                    onPause={() => setIsCutPlaying(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Interactive Timeline & Directive Feedback (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          
          {/* Directive Form Card */}
          <div className="bg-[#0F1115] border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <MessageSquare className="w-4 h-4 text-[#D4FF00]" />
                Director Cut Directives
              </span>
              {selectedSegment && (
                <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300">
                  {formatTime(selectedSegment.start)} - {formatTime(selectedSegment.end)}
                </span>
              )}
            </div>

            {/* Selected Segment Info */}
            {selectedSegment ? (
              <div className="bg-[#14171E] p-2.5 rounded-xl border border-white/5 text-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#D4FF00]">{selectedSegment.id}</span>
                  <span className="text-[10px] uppercase font-semibold text-zinc-400">
                    {selectedSegment.status === "KEEP" ? "🟢 Kept Speech" : "🔴 Cut Zone"}
                  </span>
                </div>
                <p className="text-zinc-300 line-clamp-2 italic">
                  {selectedSegment.text || selectedSegment.reason || "Silence interval"}
                </p>
              </div>
            ) : (
              <p className="text-xs text-zinc-500 italic">Click any segment in the timeline below to attach a directive.</p>
            )}

            {/* Corrective Tags Grid */}
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Select Issue Flag</span>
              <div className="grid grid-cols-2 gap-1.5">
                {CORRECTIVE_TAGS.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTag(t.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium text-left flex items-center gap-1.5 transition-all ${
                      selectedTag === t.id
                        ? "bg-[#D4FF00] text-black font-bold shadow-md"
                        : "bg-[#14171E] text-zinc-300 hover:bg-white/5 border border-white/5"
                    }`}
                  >
                    <span>{t.emoji}</span>
                    <span className="truncate">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Written Directive Notes */}
            <div>
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1.5">Specific Revision Note</span>
              <textarea
                value={textNotes}
                onChange={(e) => setTextNotes(e.target.value)}
                placeholder="e.g. Add 120ms head padding, or swap to the next take of 'GLP-1 agonists'..."
                className="w-full bg-[#14171E] border border-white/10 rounded-xl p-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00] transition-colors resize-none h-16"
              />
            </div>

            {/* Voice Recorder Integration */}
            <div className="border border-white/5 rounded-xl p-2.5 bg-[#14171E]/50">
              <span className="text-[10px] uppercase font-bold text-zinc-400 block mb-1">Or Record Voice Directive</span>
              <VoiceRecorder
                onTranscriptReady={(transcript) => {
                  setVoiceNote(transcript);
                  if (!textNotes) setTextNotes(`[Voice Directive]: ${transcript}`);
                }}
              />
            </div>

            {/* Submit Directive Button */}
            <button
              onClick={handleAddDirective}
              disabled={!selectedSegment}
              className="w-full py-2 rounded-xl bg-gradient-to-r from-[#155E47] to-[#0A3326] border border-[#155E47] text-white text-xs font-bold hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <CheckCircle2 className="w-4 h-4 text-[#4ADE80]" />
              <span>Log Directive for this Segment</span>
            </button>
          </div>

          {/* Sync Directives with Antigravity */}
          {directives.length > 0 && (
            <div className="bg-[#155E47]/20 border border-[#155E47]/50 rounded-2xl p-4 shadow-xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#4ADE80] flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#D4FF00]" />
                  Active Revision Queue ({directives.length})
                </span>
                <button
                  onClick={handleCopySync}
                  className="px-3 py-1 rounded-lg bg-[#D4FF00] text-black text-xs font-black hover:bg-[#bce400] transition-all flex items-center gap-1"
                >
                  {copiedSync ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedSync ? "Copied!" : "Sync with Antigravity"}</span>
                </button>
              </div>

              <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                {directives.map((d) => (
                  <div key={d.id} className="bg-[#0F1115] p-2 rounded-lg border border-white/5 text-[11px] space-y-0.5">
                    <div className="flex items-center justify-between font-bold text-zinc-300">
                      <span>{d.tag}</span>
                      <span className="font-mono text-zinc-500">{d.timecode}</span>
                    </div>
                    {d.notes && <p className="text-zinc-400">{d.notes}</p>}
                    {d.voiceTranscript && <p className="text-emerald-400 italic">"{d.voiceTranscript}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Interactive Timeline & Segment List */}
          <div className="bg-[#0F1115] border border-white/[0.08] rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-white/5 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-zinc-400" />
                Cut Decision List ({displayedSegments.length})
              </span>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 text-[10px]">
                <button
                  onClick={() => setFilterMode("all")}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    filterMode === "all" ? "bg-zinc-700 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterMode("kept")}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    filterMode === "kept" ? "bg-[#155E47] text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Kept ({edlData.kept_segments_count})
                </button>
                <button
                  onClick={() => setFilterMode("cuts")}
                  className={`px-2 py-0.5 rounded font-semibold ${
                    filterMode === "cuts" ? "bg-rose-900/60 text-white" : "text-zinc-400 hover:text-white"
                  }`}
                >
                  Cuts ({edlData.cuts_count})
                </button>
              </div>
            </div>

            {/* Scrollable Segments List */}
            <div className="max-h-[380px] overflow-y-auto space-y-1.5 pr-1 divide-y divide-white/5">
              {displayedSegments.map((item) => {
                const isSelected = selectedSegment?.id === item.id;
                const isKeep = item.status === "KEEP";

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedSegment(item);
                      handleSeekRaw(item.start);
                    }}
                    className={`pt-1.5 pb-1.5 px-2.5 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-zinc-800/90 border border-[#D4FF00]/50"
                        : "hover:bg-white/[0.03] border border-transparent"
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-mono text-zinc-400 font-semibold flex items-center gap-1">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${isKeep ? "bg-emerald-400" : "bg-rose-500"}`}
                        ></span>
                        {formatTime(item.start)} - {formatTime(item.end)} ({item.duration.toFixed(2)}s)
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase px-1.5 py-0.2 rounded ${
                          isKeep
                            ? "bg-[#155E47]/40 text-[#4ADE80] border border-[#155E47]"
                            : "bg-rose-950/40 text-rose-400 border border-rose-800"
                        }`}
                      >
                        {isKeep ? "Approved" : item.type.replace("CUT_", "")}
                      </span>
                    </div>

                    <p className={`text-xs leading-relaxed ${isKeep ? "text-zinc-200" : "text-zinc-400 line-through"}`}>
                      {item.text || item.reason}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
