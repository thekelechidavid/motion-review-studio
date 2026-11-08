/**
 * Helper to identify the semantic region of a 9:16 vertical canvas
 * based on percentage coordinates (0 - 100).
 */
export function getRegionDescription(x: number, y: number, width?: number, height?: number): string {
  // Check Y vertical coordinate bands first
  if (y < 12) {
    return "Top Scene Pill & Timecode Area (Top 12%)";
  }
  if (y >= 12 && y < 24) {
    return "Connective Category Tag (Y: 12-24%)";
  }
  if (y >= 24 && y < 38) {
    return "Hero Headline & Highlight Pill (Y: 24-38%)";
  }
  if (y >= 38 && y < 75) {
    if (x < 42) {
      return "Left Visual Card / Element (Center Left, X: " + Math.round(x) + "%, Y: " + Math.round(y) + "%)";
    }
    if (x > 58) {
      return "Right Visual Card / Element (Center Right, X: " + Math.round(x) + "%, Y: " + Math.round(y) + "%)";
    }
    return "Central Anatomical / Main Visual Subject (Center, X: " + Math.round(x) + "%, Y: " + Math.round(y) + "%)";
  }
  if (y >= 75 && y < 86) {
    return "Credential Badge / Evidence Tag (Y: 75-86%)";
  }
  return "Bottom Platform Safe Area / Spoken Anchor (Bottom 14%)";
}

export const ANNOTATION_COLORS = [
  { name: "Vibrant Red", hex: "#EF4444" },
  { name: "Neon Lime", hex: "#D4FF00" },
  { name: "Vitality Orange", hex: "#FF7B25" },
  { name: "Cyan Spark", hex: "#06B6D4" },
];
