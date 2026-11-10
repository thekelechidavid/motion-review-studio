#!/usr/bin/env python3
"""
CapCut Native Project Generator for Dr Kaka Captions
Generates a 100% native CapCut Desktop project with:
- Raw video track
- Synchronized dual-font caption text track
- Full manual editability inside CapCut desktop
"""

import os
import sys
import json
import uuid
import time
import shutil
from pathlib import Path

POPPINS_FONT_ID = "7533520397891865873"
POPPINS_FONT_PATH = "C:/Users/Windows/AppData/Local/CapCut/User Data/Cache/effect/7533520397891865873/2c8d5a6ed0321cb5e4cd03367b864549/font.ttf"

PLAYFAIR_FONT_ID = "7200960247266021889"
PLAYFAIR_FONT_PATH = "C:/Users/Windows/AppData/Local/CapCut/User Data/Cache/effect/7200960247266021889/37cccf8069b4093f9f4b721aa841a92d/PlayfairDisplay-Italic-VariableFont_wght.ttf"

CAPCUT_DRAFTS_ROOT = Path(r"C:\Users\Windows\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft")
ROOT_META_PATH = CAPCUT_DRAFTS_ROOT / "root_meta_info.json"

def create_capcut_project(video_path, captions_json_path, project_name="Dr Kaka - Is GLP Safe (Auto-Captioned)"):
    video_file = Path(video_path).resolve()
    if not video_file.exists():
        raise FileNotFoundError(f"Video file not found: {video_file}")
        
    with open(captions_json_path, "r", encoding="utf-8") as f:
        cards = json.load(f)
        
    # Destination project folder
    project_dir = CAPCUT_DRAFTS_ROOT / project_name
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Calculate video duration via ffprobe or cards
    # Last card end
    total_duration_sec = max(c["end"] for c in cards) + 1.0
    total_duration_us = int(total_duration_sec * 1_000_000)
    
    video_material_id = str(uuid.uuid4()).upper()
    video_segment_id = str(uuid.uuid4()).upper()
    
    # Build text materials and text segments
    text_materials = []
    text_segments = []
    
    for c in cards:
        mat_id = str(uuid.uuid4()).upper()
        seg_id = str(uuid.uuid4()).upper()
        
        start_us = int(c["start"] * 1_000_000)
        duration_us = max(int((c["end"] - c["start"]) * 1_000_000), 200_000)
        
        # Build text string and styles range
        # Format words in soft lowercase (except I, I'm, acronyms)
        full_text_parts = []
        ranges_and_fonts = []
        
        char_cursor = 0
        for w in c["words"]:
            w_text = w["text"]
            full_text_parts.append(w_text)
            
            w_len = len(w_text)
            start_idx = char_cursor
            end_idx = start_idx + w_len
            
            font_path = PLAYFAIR_FONT_PATH if w["isEmphasis"] else POPPINS_FONT_PATH
            font_id = PLAYFAIR_FONT_ID if w["isEmphasis"] else POPPINS_FONT_ID
            
            ranges_and_fonts.append({
                "range": [start_idx, end_idx],
                "font": {
                    "id": font_id,
                    "path": font_path
                }
            })
            char_cursor = end_idx + 1 # +1 for space
            
        final_text = " ".join(full_text_parts)
        
        # Build styles array
        styles = []
        for rf in ranges_and_fonts:
            styles.append({
                "fill": {
                    "alpha": 1.0,
                    "content": {
                        "render_type": "solid",
                        "solid": {
                            "alpha": 1.0,
                            "color": [1.0, 1.0, 1.0]
                        }
                    }
                },
                "font": rf["font"],
                "range": rf["range"],
                "size": 18.0
            })
            
        content_json_str = json.dumps({"styles": styles, "text": final_text})
        
        # Material text definition
        text_material = {
            "id": mat_id,
            "type": "text",
            "content": content_json_str,
            "font_size": 18.0,
            "text_color": "#FFFFFF",
            "text_alpha": 1.0,
            "alignment": 1, # Center
            "typesetting": 0,
            "letter_spacing": -1.0,
            "line_spacing": -5.0,
            "border_alpha": 1.0,
            "border_color": "#000000",
            "border_width": 0.0021352313924580812,
            "has_shadow": True,
            "shadow_alpha": 0.4,
            "shadow_angle": -45.0,
            "shadow_color": "#000000",
            "shadow_distance": 5.0,
            "shadow_smoothing": 0.08,
            "font_name": "Poppins-Bd",
            "font_title": "Poppins-Bd",
            "font_path": POPPINS_FONT_PATH,
            "font_id": POPPINS_FONT_ID,
            "is_rich_text": True,
            "adjust_params": []
        }
        text_materials.append(text_material)
        
        # Track segment definition
        text_segment = {
            "id": seg_id,
            "material_id": mat_id,
            "source_timerange": {"start": 0, "duration": duration_us},
            "target_timerange": {"start": start_us, "duration": duration_us},
            "render_timerange": {"start": 0, "duration": duration_us},
            "speed": 1.0,
            "visible": True,
            "volume": 1.0,
            "uniform_scale": {"on": True, "value": 1.0},
            "clip": {
                "alpha": 1.0,
                "flip": {"horizontal": False, "vertical": False},
                "rotation": 0.0,
                "scale": {"x": 1.0, "y": 1.0},
                "transform": {"x": 0.0, "y": -0.4387878787878787} # CapCut Y: -1075
            },
            "enable_adjust": True,
            "enable_lut": True,
            "extra_material_refs": []
        }
        text_segments.append(text_segment)
        
    # Video material
    video_material = {
        "id": video_material_id,
        "type": "video",
        "path": str(video_file).replace("\\", "/"),
        "duration": total_duration_us,
        "width": 1080,
        "height": 1920,
        "material_name": video_file.name
    }
    
    video_segment = {
        "id": video_segment_id,
        "material_id": video_material_id,
        "source_timerange": {"start": 0, "duration": total_duration_us},
        "target_timerange": {"start": 0, "duration": total_duration_us},
        "render_timerange": {"start": 0, "duration": total_duration_us},
        "speed": 1.0,
        "visible": True,
        "volume": 1.0,
        "uniform_scale": {"on": True, "value": 1.0},
        "clip": {
            "alpha": 1.0,
            "flip": {"horizontal": False, "vertical": False},
            "rotation": 0.0,
            "scale": {"x": 1.0, "y": 1.0},
            "transform": {"x": 0.0, "y": 0.0}
        }
    }
    
    # Master draft content
    draft_content = {
        "canvas_config": {
            "height": 1920,
            "ratio": "original",
            "width": 1080
        },
        "duration": total_duration_us,
        "fps": 30.0,
        "materials": {
            "videos": [video_material],
            "texts": text_materials,
            "audios": [],
            "speeds": [],
            "canvases": []
        },
        "tracks": [
            {
                "id": str(uuid.uuid4()).upper(),
                "type": "video",
                "segments": [video_segment]
            },
            {
                "id": str(uuid.uuid4()).upper(),
                "type": "text",
                "segments": text_segments
            }
        ],
        "version": 360000
    }
    
    # Write draft_content.json
    with open(project_dir / "draft_content.json", "w", encoding="utf-8") as f:
        json.dump(draft_content, f, indent=2)
        
    # Write draft_meta_info.json
    now_ts = int(time.time() * 1000)
    draft_meta = {
        "draft_id": str(uuid.uuid4()).upper(),
        "draft_name": project_name,
        "draft_fold_path": str(project_dir).replace("\\", "/"),
        "draft_timeline_materials_size_": 0,
        "tm_draft_create": now_ts,
        "tm_draft_modified": now_ts,
        "tm_duration": total_duration_us
    }
    with open(project_dir / "draft_meta_info.json", "w", encoding="utf-8") as f:
        json.dump(draft_meta, f, indent=2)
        
    # Register in root_meta_info.json
    if ROOT_META_PATH.exists():
        with open(ROOT_META_PATH, "r", encoding="utf-8") as f:
            root_data = json.load(f)
            
        all_draft_store = root_data.get("all_draft_store", [])
        
        # Remove old entry if same name exists
        all_draft_store = [d for d in all_draft_store if d.get("draft_name") != project_name]
        
        # Add new draft entry
        all_draft_store.insert(0, {
            "draft_fold_path": str(project_dir).replace("\\", "/"),
            "draft_id": draft_meta["draft_id"],
            "draft_name": project_name,
            "tm_draft_create": now_ts,
            "tm_draft_modified": now_ts,
            "tm_duration": total_duration_us
        })
        root_data["all_draft_store"] = all_draft_store
        
        with open(ROOT_META_PATH, "w", encoding="utf-8") as f:
            json.dump(root_data, f, indent=2)
            
    print(f"SUCCESS: CapCut project created at:\n  {project_dir}")
    return project_dir

if __name__ == "__main__":
    v_path = r"C:\Users\Windows\Videos\Kaka\Is GLP Safe - Raw.mp4"
    c_path = r"C:\Users\Windows\Documents\Agent OS\motion-review-studio\public\videos\kaka\captions.json"
    create_capcut_project(v_path, c_path)
