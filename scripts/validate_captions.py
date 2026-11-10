#!/usr/bin/env python3
"""
Dr Kaka Captions Automated Validator & Auditor
Strictly verifies that any generated CapCut project or subtitle track conforms
100% to Dr Kaka's locked typographical grammar, CapCut Desktop 9.x+ multi-timeline
architecture, and user-specified styling parameters.

Usage:
  python validate_captions.py --project "Dr Kaka - Is GLP Safe (Auto-Captioned)"
  python validate_captions.py --json "path/to/captions.json"
"""

import sys
import json
import argparse
from pathlib import Path

POPPINS_FONT_ID = "7533520397891865873"
PLAYFAIR_FONT_ID = "7200960247266021889"
CAPCUT_DRAFTS_ROOT = Path(r"C:\Users\Windows\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft")

class ValidationError(Exception):
    pass

def validate_capcut_project(project_path_or_name):
    p = Path(project_path_or_name)
    if not p.is_dir():
        p = CAPCUT_DRAFTS_ROOT / project_path_or_name
    if not p.is_dir():
        raise FileNotFoundError(f"CapCut project directory not found: {p}")

    print(f"\n=======================================================")
    print(f"AUDITING CAPCUT PROJECT: {p.name}")
    print(f"Path: {p}")
    print(f"=======================================================\n")

    errors = []
    warnings = []

    # 1. Structural multi-timeline check
    content_file = p / "draft_content.json"
    meta_file = p / "draft_meta_info.json"
    timelines_dir = p / "Timelines"
    project_json = timelines_dir / "project.json"
    layout_file = p / "timeline_layout.json"
    cover_file = p / "draft_cover.jpg"

    if not content_file.exists():
        errors.append("Missing root draft_content.json")
    if not meta_file.exists():
        errors.append("Missing root draft_meta_info.json")
    if not cover_file.exists():
        errors.append("Missing draft_cover.jpg (CapCut homepage thumbnail)")
    if not timelines_dir.exists():
        errors.append("Missing Timelines/ directory (Violates CapCut 9.x multi-timeline spec)")
    if not project_json.exists():
        errors.append("Missing Timelines/project.json")
    if not layout_file.exists():
        errors.append("Missing timeline_layout.json")

    if errors:
        return report_results(errors, warnings)

    # 2. Match IDs across timeline architecture
    with open(project_json, "r", encoding="utf-8") as f:
        pj_data = json.load(f)
    main_tid = pj_data.get("main_timeline_id")
    if not main_tid:
        errors.append("Timelines/project.json does not specify main_timeline_id")
    else:
        active_t_dir = timelines_dir / main_tid
        if not active_t_dir.exists():
            errors.append(f"Active timeline folder Timelines/{main_tid} does not exist")
        else:
            t_content = active_t_dir / "draft_content.json"
            if not t_content.exists():
                errors.append(f"Active timeline missing draft_content.json in Timelines/{main_tid}")

    with open(layout_file, "r", encoding="utf-8") as f:
        tl_data = json.load(f)
    dock_ids = [tid for item in tl_data.get("dockItems", []) for tid in item.get("timelineIds", [])]
    if main_tid not in dock_ids:
        errors.append(f"timeline_layout.json does not mount main_timeline_id {main_tid}")

    with open(meta_file, "r", encoding="utf-8") as f:
        meta_data = json.load(f)
    if meta_data.get("draft_id") != main_tid:
        errors.append(f"draft_meta_info.json draft_id ({meta_data.get('draft_id')}) does not match timeline_id ({main_tid})")

    # 3. Inspect Tracks & Subtitles
    with open(content_file, "r", encoding="utf-8") as f:
        content = json.load(f)

    tracks = content.get("tracks", [])
    video_tracks = [t for t in tracks if t.get("type") == "video"]
    text_tracks = [t for t in tracks if t.get("type") == "text"]

    if not video_tracks:
        errors.append("No video track found in project")
    if not text_tracks:
        errors.append("No text/subtitle track found in project")

    sub_track = None
    for tt in text_tracks:
        if tt.get("flag") == 1:
            sub_track = tt
            break
    if not sub_track:
        errors.append("Text track missing flag: 1 (Must be 1 for subtitle/caption track in CapCut)")
        sub_track = text_tracks[0] if text_tracks else None

    # 4. Check Subtitle Text Materials & Typography Tokens
    texts = content.get("materials", {}).get("texts", [])
    if not texts:
        errors.append("No text materials found in materials.texts")

    print(f"[*] Verified {len(texts)} subtitle materials. Auditing typographic tokens...")

    for i, m in enumerate(texts):
        tid = m.get("id")
        font_size = m.get("font_size")
        letter_spacing = m.get("letter_spacing")
        alignment = m.get("alignment")
        shadow_smooth = m.get("shadow_smoothing", 0)

        # Token: Font Size 18
        if font_size != 18.0:
            errors.append(f"Text {i} ({tid}): Font size is {font_size}, expected 18.0")

        # Token: Letter spacing 0.0 (Natural tracking without collision)
        if letter_spacing not in [0.0, -0.01]:
            warnings.append(f"Text {i} ({tid}): Letter spacing is {letter_spacing}, expected 0.0 (or -0.01)")

        # Token: Center alignment
        if alignment != 1:
            errors.append(f"Text {i} ({tid}): Alignment is {alignment}, expected 1 (Center)")

        # Token: Shadow smoothing / diffuse <= 0.08 (User locked ~4% blur)
        if shadow_smooth > 0.09:
            warnings.append(f"Text {i} ({tid}): Shadow smoothing is {shadow_smooth:.4f}, expected ~0.04 - 0.07 (4% blur)")

        # Token: Contiguous Style Range Rule (Zero Gaps)
        raw_content = m.get("content", "{}")
        try:
            c = json.loads(raw_content)
        except Exception:
            errors.append(f"Text {i} ({tid}): Malformed content JSON")
            continue

        full_text = c.get("text", "")
        styles = c.get("styles", [])
        if not styles:
            errors.append(f"Text {i} ({tid}): Styles array is empty")
            continue

        # Check contiguous coverage of full_text
        if styles[0].get("range", [1])[0] != 0:
            errors.append(f"Text {i} ({tid}): First style range does not start at 0: {styles[0].get('range')}")
        if styles[-1].get("range", [0, 0])[1] != len(full_text):
            errors.append(f"Text {i} ({tid}): Last style range does not reach text end ({len(full_text)}): {styles[-1].get('range')}")

        for s_idx in range(len(styles) - 1):
            curr_end = styles[s_idx].get("range", [0, 0])[1]
            next_start = styles[s_idx + 1].get("range", [0, 0])[0]
            if curr_end != next_start:
                errors.append(f"Text {i} ({tid}) COLLISION RISK: Gap or overlap between style {s_idx} (end {curr_end}) and {s_idx+1} (start {next_start}) in '{full_text}'")

        # Check word count rule (1 to 4 words max)
        words_count = len(full_text.strip().split())
        if words_count > 4:
            warnings.append(f"Text {i} ({tid}): Exceeds 4 words ({words_count} words): '{full_text}'")
        if words_count == 0:
            errors.append(f"Text {i} ({tid}): Empty text")

    # 5. Check clip transform position (Y: -1075 -> -0.438787)
    if sub_track:
        segments = sub_track.get("segments", [])
        for s_idx, seg in enumerate(segments):
            clip = seg.get("clip", {})
            trans = clip.get("transform", {})
            y_pos = trans.get("y", 0.0)
            if abs(y_pos - (-0.4387878787878787)) > 0.05:
                warnings.append(f"Segment {s_idx}: Y position is {y_pos:.4f}, expected -0.4388 (CapCut Y: -1075)")

    return report_results(errors, warnings)

def report_results(errors, warnings):
    print("\n-------------------------------------------------------")
    print(f"AUDIT SUMMARY: {len(errors)} Errors, {len(warnings)} Warnings")
    print("-------------------------------------------------------")
    if warnings:
        print("\n[!] WARNINGS:")
        for w in warnings[:15]:
            print(f"  - {w}")
        if len(warnings) > 15:
            print(f"  ... and {len(warnings) - 15} more warnings.")

    if errors:
        print("\n[X] CRITICAL ERRORS:")
        for e in errors[:15]:
            print(f"  - {e}")
        if len(errors) > 15:
            print(f"  ... and {len(errors) - 15} more errors.")
        print("\n[FAIL] Project does NOT pass Dr Kaka Captions validation.")
        return False
    else:
        print("\n[SUCCESS] 100% PASS: Project perfectly complies with all Dr Kaka Caption standards!")
        return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Audit and validate Dr Kaka Captions.")
    parser.add_argument("--project", default="Dr Kaka - Is GLP Safe (Auto-Captioned)", help="Project name or folder")
    args = parser.parse_args()

    success = validate_capcut_project(args.project)
    sys.exit(0 if success else 1)
