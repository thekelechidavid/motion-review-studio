"use client";

import React, { useState, useRef, useEffect } from "react";
import { Mic, Square, Play, Pause, Trash2, Volume2, AlertCircle, CheckCircle2 } from "lucide-react";

interface VoiceRecorderProps {
  onTranscriptReady: (transcript: string) => void;
  existingAudioUrl?: string | null;
  onClearAudio?: () => void;
}

// Window declaration for speech recognition
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function VoiceRecorder({
  onTranscriptReady,
  existingAudioUrl,
  onClearAudio,
}: VoiceRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string | null>(existingAudioUrl || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [micError, setMicError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);

  // Setup Web Speech API for real-time live transcription
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        let fullText = "";
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + " ";
        }
        const cleaned = fullText.trim();
        setLiveTranscript(cleaned);
        onTranscriptReady(cleaned);
      };

      recognition.onerror = (err: any) => {
        console.warn("Speech recognition warning:", err);
      };

      recognitionRef.current = recognition;
    }
  }, [onTranscriptReady]);

  // Start Recording
  const startRecording = async () => {
    setMicError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all audio stream tracks
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start(250);
      setIsRecording(true);
      setRecordingDuration(0);

      // Start duration timer
      timerIntervalRef.current = setInterval(() => {
        setRecordingDuration((prev) => prev + 1);
      }, 1000);

      // Start live speech-to-text
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn("Recognition already active", e);
        }
      }
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setMicError("Microphone access required. Please allow browser mic permissions.");
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          console.warn("Recognition stop error", e);
        }
      }
    }
  };

  // Toggle playback
  const togglePlayAudio = () => {
    if (!audioElementRef.current) return;
    if (isPlaying) {
      audioElementRef.current.pause();
      setIsPlaying(false);
    } else {
      audioElementRef.current.play();
      setIsPlaying(true);
    }
  };

  // Clear Audio
  const handleClear = () => {
    setAudioUrl(null);
    setLiveTranscript("");
    setIsPlaying(false);
    if (onClearAudio) onClearAudio();
  };

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="bg-[#14171E] rounded-xl p-4 border border-white/[0.08]">
      
      {/* Top Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${isRecording ? "bg-red-500 animate-ping" : "bg-[#D4FF00]"}`} />
          <span className="text-xs font-bold text-white uppercase tracking-wider">Voice Directive Note</span>
        </div>
        <span className="text-[11px] font-mono text-zinc-400">
          {isRecording ? formatSeconds(recordingDuration) : audioUrl ? "Voice note captured" : "Tap to record"}
        </span>
      </div>

      {/* Mic Access Error Alert */}
      {micError && (
        <div className="mb-3 p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
          <span>{micError}</span>
        </div>
      )}

      {/* Main Recording Interface */}
      {!audioUrl ? (
        <div className="flex items-center gap-3">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold text-xs transition-all shadow-[0_4px_16px_rgba(239,68,68,0.25)] active:scale-[0.98]"
            >
              <Mic className="w-4 h-4 animate-bounce" />
              <span>Record Voice Feedback</span>
            </button>
          ) : (
            <div className="flex-1 flex items-center justify-between gap-3 bg-red-950/40 border border-red-500/40 rounded-xl px-4 py-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 h-6">
                  <span className="w-1 bg-red-500 rounded-full animate-waveform-1"></span>
                  <span className="w-1 bg-red-400 rounded-full animate-waveform-2"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-waveform-3"></span>
                  <span className="w-1 bg-red-400 rounded-full animate-waveform-4"></span>
                  <span className="w-1 bg-red-500 rounded-full animate-waveform-5"></span>
                </div>
                <span className="text-xs font-medium text-red-200">Recording... Speak your changes</span>
              </div>
              
              <button
                onClick={stopRecording}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-all"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>
      ) : (
        /* Playback bar when recorded */
        <div className="flex items-center justify-between gap-3 bg-zinc-900 border border-white/10 rounded-xl px-3 py-2">
          <audio
            ref={audioElementRef}
            src={audioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex items-center gap-3">
            <button
              onClick={togglePlayAudio}
              className="w-8 h-8 rounded-full bg-[#D4FF00] text-black flex items-center justify-center hover:scale-105 transition-transform"
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
            </button>
            <div className="flex flex-col">
              <span className="text-xs font-semibold text-white">Audio Note Recorded</span>
              <span className="text-[10px] text-zinc-400">Transcribed below</span>
            </div>
          </div>

          <button
            onClick={handleClear}
            title="Delete & Re-record"
            className="p-2 rounded-lg text-zinc-400 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Real-Time Live Transcript Preview during recording */}
      {isRecording && liveTranscript && (
        <div className="mt-3 p-2.5 rounded-lg bg-black/40 border border-white/5 text-xs text-zinc-300 italic">
          <span className="text-[10px] uppercase font-bold text-[#D4FF00] block not-italic mb-1">
            Live Speech-to-Text:
          </span>
          “{liveTranscript}”
        </div>
      )}
    </div>
  );
}
