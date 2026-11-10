export type ReviewStatus = "pending" | "needs_edits" | "approved";

export type FeedbackTagId =
  | "copy_typo"
  | "timing_pacing"
  | "scale_zoom"
  | "color_contrast"
  | "asset_change"
  | "hold_end_frame"
  | "anti_ai_polish";

export interface FeedbackTag {
  id: FeedbackTagId;
  label: string;
  emoji: string;
}

export type AnnotationTool = "circle" | "freehand" | "box";

export interface VisualAnnotation {
  id: string;
  number: number;
  type: AnnotationTool;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  width?: number; // percentage
  height?: number; // percentage
  radius?: number; // percentage
  points?: { x: number; y: number }[]; // percentage coordinates (0 - 100)
  color: string;
  label?: string;
  regionDescription: string;
  createdAt?: string;
}

export interface SceneFeedback {
  sceneId: number;
  status: ReviewStatus;
  voiceTranscript: string;
  hasAudio: boolean;
  textNotes: string;
  tags: FeedbackTagId[];
  annotations?: VisualAnnotation[];
  updatedAt: string;
}

export interface Scene {
  id: number;
  title: string;
  startTime: string;
  endTime: string;
  duration: number; // in seconds
  spokenAnchor: string;
  visualAnchor: string;
  connectiveText: string;
  headlineText: string;
  highlightText: string;
  badgeDetail?: string;
  svg?: string;
  svgMarkup?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
}

export interface Project {
  id: string;
  client: string;
  title: string;
  subtitle: string;
  type: "storyboard" | "rendered_video";
  status: "active_review" | "needs_revisions" | "ready_to_render" | "completed";
  format: "9:16 Vertical" | "16:9 Landscape";
  aspectRatio: "9:16" | "16:9";
  dimensions: string;
  scenesCount: number;
  totalDuration: string;
  scenes: Scene[];
  brandColors: { name: string; hex: string }[];
  guidelines: string[];
  lastUpdated: string;
}
