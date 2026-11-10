"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Scissors,
  CheckCircle2,
  Sliders,
  Type,
  FileText,
  Download,
  Copy,
  Check,
  Search,
  Replace,
  Plus,
  Trash2,
  Clock,
  Layers,
  Eye,
  RefreshCw,
  Video as VideoIcon,
  HelpCircle,
  Undo2,
} from "lucide-react";

export interface WordToken {
  text: string;
  isEmphasis: boolean;
}

export interface CaptionCard {
  id: number;
  start: number;
  end: number;
  startTimecode?: string;
  endTimecode?: string;
  text: string;
  words: WordToken[];
}

export interface CaptionStyleProperties {
  fontFamilyBase: string;
  fontFamilyEmphasis: string;
  fontSize: number; // in 1080x1920 ASS coordinates (default 84)
  fontColor: string; // hex (default #FFFFFF)
  caseMode: "lowercase" | "titlecase" | "uppercase" | "preserve";
  strokeEnabled: boolean;
  strokeColor: string; // hex (default #000000)
  strokeThickness: number; // default 1 (px)
  shadowEnabled: boolean;
  shadowColor: string; // hex (default #000000)
  shadowOpacity: number; // 0 - 100 (%)
  shadowBlur: number; // 0 - 20 (px)
  shadowDistance: number; // 0 - 20 (px)
  shadowAngle: number; // -180 to 180 (deg)
  letterSpacing: number; // -5 to +5 (px)
  marginV: number; // from bottom in 1080x1920 space (default 375)
  alignment: "center" | "left" | "right";
}

const DR_KAKA_DEFAULT_STYLES: CaptionStyleProperties = {
  fontFamilyBase: "Poppins",
  fontFamilyEmphasis: "Playfair Display",
  fontSize: 84,
  fontColor: "#FFFFFF",
  caseMode: "lowercase",
  strokeEnabled: true,
  strokeColor: "#000000",
  strokeThickness: 1,
  shadowEnabled: true,
  shadowColor: "#000000",
  shadowOpacity: 40,
  shadowBlur: 8,
  shadowDistance: 5,
  shadowAngle: -45,
  letterSpacing: -1,
  marginV: 375,
  alignment: "center",
};

export default function CaptionStudio() {
  const [cards, setCards] = useState<CaptionCard[]>([]);
  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [styles, setStyles] = useState<CaptionStyleProperties>(DR_KAKA_DEFAULT_STYLES);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(84.68);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<"transcript" | "properties">("transcript");
  
  // Search & Replace
  const [searchQuery, setSearchQuery] = useState("");
  const [replaceQuery, setReplaceQuery] = useState("");
  
  // Render & Toast state
  const [isRendering, setIsRendering] = useState(false);
  const [renderStatus, setRenderStatus] = useState<string | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardListRef = useRef<HTMLDivElement>(null);

  // Load initial captions data
  useEffect(() => {
    fetch("/videos/kaka/captions.json")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          // Pre-correct "a geography one" if present
          const cleanData = data.map((card) => {
            if (card.id === 1 && card.text.toLowerCase().includes("geography")) {
              return {
                ...card,
                text: "is GLP-1",
                words: [
                  { text: "is", isEmphasis: false },
                  { text: "GLP-1", isEmphasis: true },
                ],
              };
            }
            return card;
          });
          setCards(cleanData);
          setSelectedCardId(cleanData[0].id);
        }
      })
      .catch((err) => console.error("Failed to load initial captions:", err));
  }, []);

  // Update current time on video timeupdate
  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;
      setCurrentTime(time);
      
      // Auto-highlight active card
      const active = cards.find((c) => time >= c.start && time <= c.end);
      if (active && active.id !== selectedCardId) {
        setSelectedCardId(active.id);
      }
    }
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const seekTo = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(seconds, duration));
      setCurrentTime(videoRef.current.currentTime);
    }
  };

  // Find active card for live preview overlay
  const activeCard = useMemo(() => {
    return cards.find((c) => currentTime >= c.start && currentTime <= c.end);
  }, [cards, currentTime]);

  // Word token toggle
  const toggleWordEmphasis = (cardId: number, wordIndex: number) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const newWords = card.words.map((w, idx) => {
          if (idx === wordIndex) {
            return { ...w, isEmphasis: !w.isEmphasis };
          }
          return w;
        });
        return { ...card, words: newWords };
      })
    );
  };

  // Direct text edit
  const handleCardTextChange = (cardId: number, newText: string) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        const words = newText.trim().split(/\s+/).filter(Boolean);
        // Preserve previous emphasis state where possible
        const updatedWords = words.map((w, idx) => {
          const oldWord = card.words[idx];
          return {
            text: w,
            isEmphasis: oldWord ? oldWord.isEmphasis : false,
          };
        });
        return {
          ...card,
          text: newText,
          words: updatedWords,
        };
      })
    );
  };

  // Update card timestamps
  const handleTimeChange = (cardId: number, field: "start" | "end", value: number) => {
    setCards((prev) =>
      prev.map((card) => {
        if (card.id !== cardId) return card;
        return { ...card, [field]: Math.max(0, value) };
      })
    );
  };

  // Delete card
  const deleteCard = (cardId: number) => {
    setCards((prev) => prev.filter((c) => c.id !== cardId));
  };

  // Split card in two
  const splitCard = (cardId: number) => {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === cardId);
      if (idx === -1) return prev;
      const card = prev[idx];
      if (card.words.length <= 1) return prev;

      const mid = Math.ceil(card.words.length / 2);
      const firstWords = card.words.slice(0, mid);
      const secondWords = card.words.slice(mid);

      const midTime = +(card.start + (card.end - card.start) / 2).toFixed(2);

      const card1: CaptionCard = {
        id: card.id,
        start: card.start,
        end: midTime,
        text: firstWords.map((w) => w.text).join(" "),
        words: firstWords,
      };

      const card2: CaptionCard = {
        id: Math.max(...prev.map((c) => c.id), 0) + 1,
        start: midTime,
        end: card.end,
        text: secondWords.map((w) => w.text).join(" "),
        words: secondWords,
      };

      const newCards = [...prev];
      newCards.splice(idx, 1, card1, card2);
      return newCards;
    });
  };

  // Merge card with next
  const mergeCard = (cardId: number) => {
    setCards((prev) => {
      const idx = prev.findIndex((c) => c.id === cardId);
      if (idx === -1 || idx === prev.length - 1) return prev;
      const c1 = prev[idx];
      const c2 = prev[idx + 1];

      const merged: CaptionCard = {
        id: c1.id,
        start: c1.start,
        end: c2.end,
        text: `${c1.text} ${c2.text}`,
        words: [...c1.words, ...c2.words],
      };

      const newCards = [...prev];
      newCards.splice(idx, 2, merged);
      return newCards;
    });
  };

  // Search and replace in all cards
  const executeReplace = () => {
    if (!searchQuery.trim()) return;
    const regex = new RegExp(searchQuery, "gi");
    setCards((prev) =>
      prev.map((card) => {
        if (!regex.test(card.text)) return card;
        const newText = card.text.replace(regex, replaceQuery);
        const words = newText.trim().split(/\s+/).filter(Boolean);
        return {
          ...card,
          text: newText,
          words: words.map((w) => ({
            text: w,
            isEmphasis: card.words.some((old) => old.text.toLowerCase() === w.toLowerCase() && old.isEmphasis),
          })),
        };
      })
    );
    setRenderStatus(`Replaced all occurrences of "${searchQuery}" with "${replaceQuery}"`);
    setTimeout(() => setRenderStatus(null), 3000);
  };

  // Server re-render via FFmpeg
  const triggerReRender = async () => {
    setIsRendering(true);
    setRenderStatus("Compiling ASS styles and executing FFmpeg re-render...");
    try {
      const res = await fetch("/api/captions/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cards,
          styles,
          videoFile: "/videos/kaka/is_glp_safe_raw.mp4",
        }),
      });
      const data = await res.json();
      if (data.success) {
        setRenderStatus("✅ Render complete! Reloading video with burned subtitles...");
        if (videoRef.current && data.videoUrl) {
          videoRef.current.src = data.videoUrl;
          videoRef.current.load();
        }
      } else {
        setRenderStatus(`❌ Error: ${data.error || "Render failed"}`);
      }
    } catch (err: any) {
      setRenderStatus(`❌ Connection error: ${err.message}`);
    } finally {
      setIsRendering(false);
      setTimeout(() => setRenderStatus(null), 5000);
    }
  };

  // Copy ASS or SRT to clipboard
  const copyFormatted = (type: "ass" | "srt") => {
    if (type === "srt") {
      let srt = "";
      cards.forEach((c, i) => {
        const formatSrtTime = (sec: number) => {
          const h = Math.floor(sec / 3600).toString().padStart(2, "0");
          const m = Math.floor((sec % 3600) / 60).toString().padStart(2, "0");
          const s = Math.floor(sec % 60).toString().padStart(2, "0");
          const ms = Math.floor((sec % 1) * 1000).toString().padStart(3, "0");
          return `${h}:${m}:${s},${ms}`;
        };
        srt += `${i + 1}\n${formatSrtTime(c.start)} --> ${formatSrtTime(c.end)}\n${c.text}\n\n`;
      });
      navigator.clipboard.writeText(srt);
      setCopiedType("srt");
    } else {
      let ass = "";
      cards.forEach((c) => {
        const words = c.words.map((w) => (w.isEmphasis ? `{\\fnPlayfair Display\\i1\\b0}${w.text}{\\fnPoppins\\i0\\b1}` : w.text));
        ass += `Dialogue: 0,${c.start},${c.end},Default,,0,0,0,,{\\fnPoppins\\b1}${words.join(" ")}\n`;
      });
      navigator.clipboard.writeText(ass);
      setCopiedType("ass");
    }
    setTimeout(() => setCopiedType(null), 2500);
  };

  // Computed CSS for live canvas preview (scaled down from 1080x1920 to ~320x568 container)
  const previewScaleFactor = 320 / 1080;
  const computedFontSize = Math.round(styles.fontSize * previewScaleFactor);
  const computedBottomMargin = Math.round(styles.marginV * previewScaleFactor);

  const shadowAngleRad = (styles.shadowAngle * Math.PI) / 180;
  const shadowX = Math.round(styles.shadowDistance * previewScaleFactor * Math.cos(shadowAngleRad));
  const shadowY = Math.round(styles.shadowDistance * previewScaleFactor * Math.sin(shadowAngleRad));
  const shadowBlurPx = Math.round(styles.shadowBlur * previewScaleFactor);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      
      {/* Studio Header & Global Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-gradient-to-r from-[#0E1015] via-[#14171E] to-[#0A1713] border border-white/[0.08]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-[#155E47]/30 border border-[#155E47]/60 text-[#4ADE80]">
              <Sparkles className="w-5 h-5 text-[#D4FF00]" />
            </span>
            <div>
              <h1 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
                Dr Kaka Captions Control Studio
                <span className="text-[10px] uppercase font-bold tracking-widest px-2.5 py-0.5 rounded-full bg-[#155E47]/40 text-[#4ADE80] border border-[#155E47]">
                  Autonomous Sync Active
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Fix mistranscriptions, fine-tune word emphasis, and adjust CapCut typography in real-time.
              </p>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => copyFormatted("srt")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-all"
          >
            {copiedType === "srt" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>Copy SRT</span>
          </button>

          <button
            onClick={() => copyFormatted("ass")}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-white/10 transition-all"
          >
            {copiedType === "ass" ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>Copy ASS</span>
          </button>

          <button
            onClick={triggerReRender}
            disabled={isRendering}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-extrabold transition-all shadow-[0_0_20px_rgba(212,255,0,0.25)] ${
              isRendering
                ? "bg-zinc-700 text-zinc-400 cursor-not-allowed"
                : "bg-gradient-to-r from-[#D4FF00] to-[#A3E635] text-black hover:opacity-95"
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRendering ? "animate-spin" : ""}`} />
            <span>{isRendering ? "Re-Rendering..." : "Re-Render Video (FFmpeg)"}</span>
          </button>
        </div>
      </div>

      {/* Render Alert / Toast */}
      {renderStatus && (
        <div className="p-3.5 rounded-xl bg-[#155E47]/20 border border-[#155E47]/60 text-xs text-[#86EFAC] flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#D4FF00]" />
            <span>{renderStatus}</span>
          </div>
          <button onClick={() => setRenderStatus(null)} className="text-zinc-400 hover:text-white">✕</button>
        </div>
      )}

      {/* Main Studio Workspace Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: 9:16 Mobile Phone Simulator Viewport (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col items-center">
          <div className="relative w-[320px] h-[568px] rounded-[36px] bg-black border-4 border-zinc-800 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col justify-between">
            
            {/* Phone Notch & Speaker Pill */}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-zinc-900 z-30 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-black/60 mr-2"></div>
              <div className="w-8 h-1 rounded-full bg-zinc-700"></div>
            </div>

            {/* Video Element */}
            <video
              ref={videoRef}
              src="/videos/kaka/is_glp_safe_raw.mp4"
              onTimeUpdate={handleTimeUpdate}
              onLoadedMetadata={() => {
                if (videoRef.current) setDuration(videoRef.current.duration);
              }}
              playsInline
              className="w-full h-full object-cover"
              onClick={togglePlay}
            />

            {/* Live Synchronized Caption Overlay */}
            {activeCard && (
              <div
                className="absolute left-0 right-0 z-20 flex justify-center px-4 pointer-events-none transition-all duration-75"
                style={{
                  bottom: `${computedBottomMargin}px`,
                  textAlign: styles.alignment,
                }}
              >
                <div
                  className="leading-tight transition-all duration-75 select-none"
                  style={{
                    fontSize: `${computedFontSize}px`,
                    color: styles.fontColor,
                    letterSpacing: `${styles.letterSpacing}px`,
                    WebkitTextStroke: styles.strokeEnabled ? `${styles.strokeThickness}px ${styles.strokeColor}` : "none",
                    filter: styles.shadowEnabled
                      ? `drop-shadow(${shadowX}px ${shadowY}px ${shadowBlurPx}px rgba(0,0,0,${styles.shadowOpacity / 100}))`
                      : "none",
                    textTransform:
                      styles.caseMode === "lowercase"
                        ? "lowercase"
                        : styles.caseMode === "titlecase"
                        ? "capitalize"
                        : styles.caseMode === "uppercase"
                        ? "uppercase"
                        : "none",
                  }}
                >
                  {activeCard.words.map((w, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontFamily: w.isEmphasis ? "Playfair Display, serif" : "Poppins, sans-serif",
                        fontStyle: w.isEmphasis ? "italic" : "normal",
                        fontWeight: w.isEmphasis ? 400 : 700,
                        marginRight: idx < activeCard.words.length - 1 ? "4px" : "0",
                      }}
                    >
                      {w.text}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Safe Area Markers (Subtle Guideline) */}
            <div className="absolute inset-x-3 bottom-12 h-[1px] bg-emerald-500/20 pointer-events-none z-10 flex justify-between text-[9px] text-emerald-400/40">
              <span>Lower Third Baseline</span>
              <span>Y: -1075</span>
            </div>

            {/* In-Phone Play/Pause Center Indicator */}
            {!isPlaying && (
              <div
                onClick={togglePlay}
                className="absolute inset-0 bg-black/30 backdrop-blur-[1px] flex items-center justify-center cursor-pointer z-20"
              >
                <div className="w-14 h-14 rounded-full bg-[#155E47]/90 border border-[#D4FF00]/40 flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
                  <Play className="w-6 h-6 text-[#D4FF00] fill-[#D4FF00] ml-1" />
                </div>
              </div>
            )}
          </div>

          {/* Video Scrub & Controls Bar */}
          <div className="w-[320px] mt-4 p-3 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span>{currentTime.toFixed(2)}s</span>
              <span>{duration.toFixed(2)}s</span>
            </div>

            {/* Timeline Slider */}
            <input
              type="range"
              min={0}
              max={duration || 85}
              step={0.05}
              value={currentTime}
              onChange={(e) => seekTo(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
            />

            {/* Quick Transport Buttons */}
            <div className="flex items-center justify-between pt-1">
              <button
                onClick={() => seekTo(currentTime - 2)}
                className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300 hover:text-white"
              >
                -2s
              </button>

              <button
                onClick={togglePlay}
                className="px-4 py-1 rounded-lg bg-[#155E47] text-xs font-bold text-white hover:bg-[#1c785b] flex items-center gap-1.5"
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-white" />}
                <span>{isPlaying ? "Pause" : "Play"}</span>
              </button>

              <button
                onClick={() => seekTo(currentTime + 2)}
                className="px-2 py-1 rounded bg-zinc-800 text-[10px] text-zinc-300 hover:text-white"
              >
                +2s
              </button>

              {/* Playback speed toggle */}
              <div className="flex items-center gap-1 bg-zinc-800/80 rounded-md p-0.5 text-[10px]">
                {[0.75, 1, 1.25].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => {
                      setPlaybackRate(rate);
                      if (videoRef.current) videoRef.current.playbackRate = rate;
                    }}
                    className={`px-1.5 py-0.5 rounded ${playbackRate === rate ? "bg-[#D4FF00] text-black font-bold" : "text-zinc-400"}`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Master Controls & Transcript Editor (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* Studio Navigation Tabs */}
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <button
              onClick={() => setActiveTab("transcript")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "transcript"
                  ? "bg-[#155E47] text-white shadow-[0_0_15px_rgba(21,94,71,0.4)]"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Transcript & Word Editor ({cards.length} Cards)</span>
            </button>

            <button
              onClick={() => setActiveTab("properties")}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === "properties"
                  ? "bg-[#155E47] text-white shadow-[0_0_15px_rgba(21,94,71,0.4)]"
                  : "bg-zinc-900/60 text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Visual Typography Settings (CapCut Matrix)</span>
            </button>
          </div>

          {/* TAB 1: TRANSCRIPT & WORD EDITOR */}
          {activeTab === "transcript" && (
            <div className="space-y-4">
              
              {/* Batch Search & Replace Toolbar */}
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-white/10 flex flex-wrap items-center gap-2">
                <div className="relative flex-1 min-w-[140px]">
                  <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Find mistranscription (e.g. geography)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>

                <div className="relative flex-1 min-w-[140px]">
                  <Replace className="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Replace with (e.g. GLP-1)..."
                    value={replaceQuery}
                    onChange={(e) => setReplaceQuery(e.target.value)}
                    className="w-full bg-zinc-800 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#D4FF00]"
                  />
                </div>

                <button
                  onClick={executeReplace}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-200 border border-white/10 flex items-center gap-1"
                >
                  <Replace className="w-3 h-3 text-[#D4FF00]" />
                  <span>Replace All</span>
                </button>
              </div>

              {/* Quick Guidance Box */}
              <div className="p-3 rounded-xl bg-gradient-to-r from-[#155E47]/20 to-transparent border border-[#155E47]/40 text-xs text-zinc-300 flex items-start gap-2.5">
                <HelpCircle className="w-4 h-4 text-[#D4FF00] shrink-0 mt-0.5" />
                <p>
                  <strong>How to use word chips:</strong> Click any word chip below to toggle between{" "}
                  <span className="font-bold text-white bg-zinc-800 px-1.5 py-0.5 rounded">Poppins Bold</span> and{" "}
                  <span className="font-serif italic text-[#D4FF00] bg-[#155E47]/50 px-1.5 py-0.5 rounded">
                    Playfair Display Italic
                  </span>
                  . Edit the text box directly to fix typos.
                </p>
              </div>

              {/* Caption Cards Scrollable List */}
              <div
                ref={cardListRef}
                className="space-y-3 max-h-[500px] overflow-y-auto pr-1"
              >
                {cards.map((card, index) => {
                  const isActive = activeCard?.id === card.id;
                  const wordCount = card.words.length;
                  const isWordCountAlert = wordCount > 4;

                  return (
                    <div
                      key={card.id}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isActive
                          ? "bg-[#141E1A] border-[#155E47] shadow-[0_0_20px_rgba(21,94,71,0.3)] ring-1 ring-[#D4FF00]/40"
                          : "bg-zinc-900/60 border-white/[0.08] hover:border-white/20"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        {/* Index & Time Range */}
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-400 font-bold">
                            #{index + 1}
                          </span>

                          <button
                            onClick={() => seekTo(card.start)}
                            className="flex items-center gap-1 text-[11px] font-mono text-zinc-400 hover:text-[#D4FF00] transition-colors"
                          >
                            <Clock className="w-3 h-3" />
                            <span>{card.start.toFixed(2)}s - {card.end.toFixed(2)}s</span>
                          </button>

                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-bold ${
                              isWordCountAlert
                                ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                                : "bg-zinc-800/80 text-zinc-400"
                            }`}
                          >
                            {wordCount} {wordCount === 1 ? "word" : "words"}
                          </span>
                        </div>

                        {/* Card Utilities (Split / Merge / Delete) */}
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => splitCard(card.id)}
                            title="Split into two cards"
                            className="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          >
                            <Scissors className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => mergeCard(card.id)}
                            title="Merge with next card"
                            className="p-1 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white"
                          >
                            <Layers className="w-3 h-3" />
                          </button>

                          <button
                            onClick={() => deleteCard(card.id)}
                            title="Delete card"
                            className="p-1 rounded bg-zinc-800/80 hover:bg-red-500/30 text-zinc-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      {/* Text Input for Typing Corrections */}
                      <input
                        type="text"
                        value={card.text}
                        onChange={(e) => handleCardTextChange(card.id, e.target.value)}
                        className="w-full bg-zinc-800/80 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white font-medium focus:outline-none focus:border-[#D4FF00]"
                      />

                      {/* Interactive Word Chips (Toggle Emphasis) */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="text-[10px] text-zinc-400 mr-1">Style words:</span>
                        {card.words.map((w, wIdx) => (
                          <button
                            key={wIdx}
                            onClick={() => toggleWordEmphasis(card.id, wIdx)}
                            className={`px-2 py-0.5 rounded-md text-xs transition-all flex items-center gap-1 ${
                              w.isEmphasis
                                ? "bg-gradient-to-r from-[#155E47] to-[#0D4030] text-[#D4FF00] font-serif italic border border-[#D4FF00]/40 shadow-sm"
                                : "bg-zinc-800 text-zinc-200 font-sans font-bold hover:bg-zinc-700 border border-white/5"
                            }`}
                          >
                            <span>{w.text}</span>
                            <span className="text-[9px] opacity-60">
                              {w.isEmphasis ? "Italic" : "Bold"}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: VISUAL TYPOGRAPHY SETTINGS (CAPCUT PARAMETERS) */}
          {activeTab === "properties" && (
            <div className="p-5 rounded-2xl bg-zinc-900/80 border border-white/10 space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Type className="w-4 h-4 text-[#D4FF00]" />
                    <span>CapCut Precision Typography Matrix</span>
                  </h3>
                  <p className="text-xs text-zinc-400">Controls apply globally to all subtitle cards.</p>
                </div>

                <button
                  onClick={() => setStyles(DR_KAKA_DEFAULT_STYLES)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset to Dr Kaka Defaults</span>
                </button>
              </div>

              {/* Font Size & Spacing */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Font Size (ASS Scale)</span>
                    <span className="font-mono text-[#D4FF00] font-bold">{styles.fontSize}pt</span>
                  </div>
                  <input
                    type="range"
                    min={48}
                    max={120}
                    step={2}
                    value={styles.fontSize}
                    onChange={(e) => setStyles({ ...styles, fontSize: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                  />
                  <span className="text-[10px] text-zinc-400">Matches CapCut Desktop scale: 18</span>
                </div>

                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-zinc-300">
                    <span>Letter Spacing (Kerning)</span>
                    <span className="font-mono text-[#D4FF00] font-bold">{styles.letterSpacing}px</span>
                  </div>
                  <input
                    type="range"
                    min={-5}
                    max={5}
                    step={1}
                    value={styles.letterSpacing}
                    onChange={(e) => setStyles({ ...styles, letterSpacing: parseInt(e.target.value) })}
                    className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                  />
                  <span className="text-[10px] text-zinc-400">Matches CapCut Character spacing: -1</span>
                </div>
              </div>

              {/* Vertical Position Safe Zone */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-zinc-300">
                  <span>Vertical Placement (MarginV from bottom)</span>
                  <span className="font-mono text-[#D4FF00] font-bold">{styles.marginV}px</span>
                </div>
                <input
                  type="range"
                  min={200}
                  max={600}
                  step={5}
                  value={styles.marginV}
                  onChange={(e) => setStyles({ ...styles, marginV: parseInt(e.target.value) })}
                  className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                />
                <span className="text-[10px] text-zinc-400">
                  Target: 375px (CapCut coordinate Y: -1075) sits perfectly in the lower chest safe zone.
                </span>
              </div>

              {/* Stroke / Outline Controls */}
              <div className="p-3.5 rounded-xl bg-zinc-800/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Stroke (Hairline Separation)</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={styles.strokeEnabled}
                      onChange={(e) => setStyles({ ...styles, strokeEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#155E47]"></div>
                  </label>
                </div>

                {styles.strokeEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400">Thickness (px)</span>
                      <input
                        type="range"
                        min={1}
                        max={4}
                        step={0.5}
                        value={styles.strokeThickness}
                        onChange={(e) => setStyles({ ...styles, strokeThickness: parseFloat(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400">Color</span>
                      <input
                        type="color"
                        value={styles.strokeColor}
                        onChange={(e) => setStyles({ ...styles, strokeColor: e.target.value })}
                        className="w-full h-7 bg-transparent rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Drop Shadow Controls */}
              <div className="p-3.5 rounded-xl bg-zinc-800/50 border border-white/5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">Soft Drop Shadow</span>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={styles.shadowEnabled}
                      onChange={(e) => setStyles({ ...styles, shadowEnabled: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-9 h-5 bg-zinc-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#155E47]"></div>
                  </label>
                </div>

                {styles.shadowEnabled && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400">Opacity ({styles.shadowOpacity}%)</span>
                      <input
                        type="range"
                        min={10}
                        max={100}
                        step={5}
                        value={styles.shadowOpacity}
                        onChange={(e) => setStyles({ ...styles, shadowOpacity: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400">Blur ({styles.shadowBlur}%)</span>
                      <input
                        type="range"
                        min={0}
                        max={20}
                        step={1}
                        value={styles.shadowBlur}
                        onChange={(e) => setStyles({ ...styles, shadowBlur: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400">Distance ({styles.shadowDistance}px)</span>
                      <input
                        type="range"
                        min={1}
                        max={15}
                        step={1}
                        value={styles.shadowDistance}
                        onChange={(e) => setStyles({ ...styles, shadowDistance: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                      />
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] text-zinc-400">Angle ({styles.shadowAngle}°)</span>
                      <input
                        type="range"
                        min={-180}
                        max={180}
                        step={5}
                        value={styles.shadowAngle}
                        onChange={(e) => setStyles({ ...styles, shadowAngle: parseInt(e.target.value) })}
                        className="w-full h-1.5 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-[#D4FF00]"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Case Mode Selector */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-white">Casing Mode</span>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: "lowercase", label: "lowercase (Dr Kaka Spec)" },
                    { id: "titlecase", label: "Title Case" },
                    { id: "preserve", label: "Preserve Input" },
                  ].map((mode) => (
                    <button
                      key={mode.id}
                      onClick={() => setStyles({ ...styles, caseMode: mode.id as any })}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                        styles.caseMode === mode.id
                          ? "bg-[#155E47] text-white border-[#D4FF00]/40"
                          : "bg-zinc-800 text-zinc-400 border-white/5 hover:text-white"
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}
