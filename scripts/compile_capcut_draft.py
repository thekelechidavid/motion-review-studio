#!/usr/bin/env python3
"""
CapCut Windows Draft Compiler for Motion Review Studio
Integrates with video-editing-assembly and Dr Kaka captioning engine.
Compiles native multi-track CapCut desktop projects into:
C:\\Users\\<User>\\AppData\\Local\\CapCut\\User Data\\Projects\\com.lveditor.draft\\<ProjectName>\\
"""

import os
import sys
import json
import uuid
import time
import shutil
import argparse
import subprocess
from pathlib import Path

# Common CapCut Font Cache IDs
POPPINS_FONT_ID = "7533520397891865873"
POPPINS_FONT_PATH = "C:/Users/Windows/AppData/Local/CapCut/User Data/Cache/effect/7533520397891865873/2c8d5a6ed0321cb5e4cd03367b864549/font.ttf"

PLAYFAIR_FONT_ID = "7200960247266021889"
PLAYFAIR_FONT_PATH = "C:/Users/Windows/AppData/Local/CapCut/User Data/Cache/effect/7200960247266021889/37cccf8069b4093f9f4b721aa841a92d/PlayfairDisplay-Italic-VariableFont_wght.ttf"

CAPCUT_DRAFTS_ROOT = Path(r"C:\Users\Windows\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft")
ROOT_META_PATH = CAPCUT_DRAFTS_ROOT / "root_meta_info.json"

STUDIO_ROOT = Path(r"C:\Users\Windows\Documents\Agent OS\motion-review-studio")

def parse_time_to_seconds(time_str):
    """Converts 'MM:SS' or 'MM:SS.s' into float seconds."""
    if not time_str:
        return 0.0
    parts = str(time_str).split(":")
    if len(parts) == 2:
        return float(parts[0]) * 60.0 + float(parts[1])
    elif len(parts) == 3:
        return float(parts[0]) * 3600.0 + float(parts[1]) * 60.0 + float(parts[2])
    try:
        return float(time_str)
    except ValueError:
        return 0.0

def find_project_data(project_id):
    """Extracts project data from projects-data.ts."""
    ts_path = STUDIO_ROOT / "lib" / "projects-data.ts"
    if not ts_path.exists():
        return None
    
    with open(ts_path, "r", encoding="utf-8") as f:
        text = f.read()

    target_str1 = f'\"id\": \"{project_id}\"'
    target_str2 = f'id: \"{project_id}\"'

    p_idx = text.find(target_str1)
    if p_idx == -1:
        p_idx = text.find(target_str2)
    if p_idx == -1:
        return None

    brace_start = text.rfind("{", 0, p_idx)
    if brace_start == -1:
        return None

    depth = 0
    brace_end = -1
    for i in range(brace_start, len(text)):
        c = text[i]
        if c == "{":
            depth += 1
        elif c == "}":
            depth -= 1
            if depth == 0:
                brace_end = i + 1
                break

    if brace_end != -1:
        block = text[brace_start:brace_end]
        try:
            return json.loads(block)
        except Exception:
            # Clean trailing commas for JSON parsing
            import re
            cleaned = re.sub(r',\s*([}\]])', r'\1', block)
            # Add quotes to unquoted keys
            cleaned = re.sub(r'(\b[a-zA-Z_][a-zA-Z0-9_]*\b)\s*:', r'"\1":', cleaned)
            try:
                return json.loads(cleaned)
            except Exception:
                pass

    return None

def resolve_video_file(project_id, project):
    """Finds the best video file on disk for this project."""
    # 1. Check known project mappings
    if "growithkeda-openai" in project_id or "openai-downsizes" in project_id:
        p1 = Path(r"C:\Users\Windows\Documents\Dave's-Agent-OS\03 - Projects\01 - Video Projects\Growithkeda\Assets - OpenAI Downsizes Video\exports\openai_downsizes_ig_compliant.mp4")
        if p1.exists():
            return p1
        p2 = STUDIO_ROOT / "public" / "videos" / "growithkeda" / "openai-downsizes" / "master.mp4"
        if p2.exists():
            return p2

    if "dr-kaka-is-glp1-safe" in project_id or "isglp1safe" in project_id:
        p1 = STUDIO_ROOT / "public" / "videos" / "isglp1safe" / "Safe_Master_Full_Portrait.mp4"
        if p1.exists():
            return p1
        p2 = Path(r"C:\Users\Windows\Videos\Kaka\Is GLP Safe - Raw.mp4")
        if p2.exists():
            return p2

    if "dr-kaka-glp1-lifestyle" in project_id:
        p1 = STUDIO_ROOT / "public" / "videos" / "glp1resistance" / "GLP1_Resistance_Master_Continuous_Portrait.mp4"
        if p1.exists():
            return p1

    # 2. Check scene videoUrl
    if project and "scenes" in project:
        for s in project["scenes"]:
            v_url = s.get("videoUrl")
            if v_url and v_url.endswith(".mp4"):
                clean = v_url.lstrip("/").replace("/", os.sep)
                candidate = STUDIO_ROOT / "public" / clean
                if candidate.exists():
                    return candidate

    return None

def build_caption_cards(project):
    """Builds timed caption cards with words and emphasis from project scenes or word_timestamps."""
    cards = []
    
    # Check if word_timestamps.json exists for OpenAI Downsizes
    wt_path = Path(r"C:\Users\Windows\Documents\Dave's-Agent-OS\03 - Projects\01 - Video Projects\Growithkeda\Assets - OpenAI Downsizes Video\word_timestamps.json")
    if wt_path.exists() and ("openai" in project.get("id", "")):
        try:
            with open(wt_path, "r", encoding="utf-8") as f:
                words_data = json.load(f)
            # Group into 1-4 word rhythmic chunks
            chunk_size = 3
            for i in range(0, len(words_data), chunk_size):
                chunk = words_data[i:i+chunk_size]
                if not chunk:
                    continue
                start = chunk[0].get("start", 0.0)
                end = chunk[-1].get("end", start + 0.5)
                words_list = []
                for idx, w in enumerate(chunk):
                    w_text = w.get("word", "").strip()
                    # Apply emphasis to numbers, currency, caps, or key words
                    is_emp = any(c in w_text for c in ["$", "%", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"]) or (idx == len(chunk) - 1 and len(w_text) > 4)
                    words_list.append({"text": w_text, "isEmphasis": is_emp})
                cards.append({"start": start, "end": end, "words": words_list})
            if cards:
                return cards
        except Exception as e:
            print(f"Warning: Failed parsing word_timestamps: {e}", file=sys.stderr)

    # Fallback to scenes
    scenes = project.get("scenes", [])
    for s in scenes:
        start_sec = parse_time_to_seconds(s.get("startTime", "00:00"))
        end_sec = parse_time_to_seconds(s.get("endTime", "00:05"))
        if end_sec <= start_sec:
            end_sec = start_sec + float(s.get("duration", 4.0))
        
        spoken = s.get("spokenAnchor") or s.get("headlineText") or s.get("title") or ""
        words = spoken.split()
        if not words:
            continue
            
        # Break into 3-4 word sub-cards evenly spaced across the scene
        chunk_size = 3
        sub_chunks = [words[i:i+chunk_size] for i in range(0, len(words), chunk_size)]
        total_chunks = len(sub_chunks)
        scene_dur = max(end_sec - start_sec, 1.0)
        chunk_dur = scene_dur / total_chunks
        
        for c_idx, chunk in enumerate(sub_chunks):
            c_start = start_sec + (c_idx * chunk_dur)
            c_end = c_start + chunk_dur
            words_list = []
            for w in chunk:
                is_emp = any(c in w for c in ["$", "%", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0"])
                words_list.append({"text": w, "isEmphasis": is_emp})
            cards.append({"start": c_start, "end": c_end, "words": words_list})
            
    return cards

def compile_project_to_capcut(project_id, custom_project_name=None, custom_video_path=None):
    CAPCUT_DRAFTS_ROOT.mkdir(parents=True, exist_ok=True)
    
    # 1. Load project details from projects-data.ts
    project = find_project_data(project_id)
    if not project:
        # Fallback minimal schema
        project = {
            "id": project_id,
            "title": project_id.replace("-", " ").title(),
            "client": "Growithkeda" if "growithkeda" in project_id else "Dr Kaka",
            "format": "9:16 Vertical",
            "dimensions": "1080x1920",
            "scenes": []
        }

    # 2. Determine project draft name
    client_prefix = project.get("client", "Growithkeda")
    title = project.get("title", "Video Project")
    draft_name = custom_project_name or f"{client_prefix} - {title} (Motion Studio Draft)"

    # 3. Locate video file
    video_file = None
    if custom_video_path and Path(custom_video_path).exists():
        video_file = Path(custom_video_path).resolve()
    else:
        video_file = resolve_video_file(project_id, project)
        
    if not video_file or not video_file.exists():
        raise FileNotFoundError(f"Could not locate master video for project '{project_id}'. Checked public videos and exports.")

    # Probe duration via ffprobe
    duration_sec = 45.0
    try:
        probe_cmd = ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", str(video_file)]
        out = subprocess.check_output(probe_cmd, text=True).strip()
        duration_sec = float(out)
    except Exception:
        pass
        
    total_duration_us = int(duration_sec * 1_000_000)
    
    # Destination project folder
    project_dir = CAPCUT_DRAFTS_ROOT / draft_name
    project_dir.mkdir(parents=True, exist_ok=True)

    video_material_id = str(uuid.uuid4()).upper()
    video_segment_id = str(uuid.uuid4()).upper()

    video_material = {
        "audio_fade": None,
        "category_id": "",
        "category_name": "",
        "check_flag": 63487,
        "crop": {"lower_left_x": 0.0, "lower_left_y": 1.0, "lower_right_x": 1.0, "lower_right_y": 1.0, "upper_left_x": 0.0, "upper_left_y": 0.0, "upper_right_x": 1.0, "upper_right_y": 0.0},
        "crop_ratio": "free",
        "crop_scale": 1.0,
        "duration": total_duration_us,
        "extra_info": "",
        "file_Path": str(video_file).replace("\\", "/"),
        "height": 1920,
        "id": video_material_id,
        "import_time": int(time.time()),
        "import_time_us": int(time.time() * 1_000_000),
        "item_source": 1,
        "material_name": video_file.name,
        "material_url": "",
        "media_path": "",
        "object_locked": None,
        "path": str(video_file).replace("\\", "/"),
        "reverse_path": "",
        "type": "video",
        "video_algorithm": {"algorithms": []},
        "width": 1080
    }

    video_segment = {
        "clip": {"alpha": 1.0, "flip": {"horizontal": False, "vertical": False}, "rotation": 0.0, "scale": {"x": 1.0, "y": 1.0}, "transform": {"x": 0.0, "y": 0.0}},
        "common_keyframes": [],
        "enable_adjust": True,
        "enable_color_curves": True,
        "enable_color_match_adjust": False,
        "enable_color_wheels": True,
        "enable_lut": True,
        "enable_smart_color_adjust": False,
        "extra_material_refs": [],
        "group_id": "",
        "id": video_segment_id,
        "intensifies_audio": False,
        "is_placeholder": False,
        "is_tone_modify": False,
        "keyframe_refs": [],
        "last_nonzero_volume": 1.0,
        "material_id": video_material_id,
        "render_index": 0,
        "responsive_layout": {"enable": False, "horizontal_pos_layout": 0, "size_layout": 0, "target_follow": "", "vertical_pos_layout": 0},
        "reverse": False,
        "source_timerange": {"duration": total_duration_us, "start": 0},
        "speed": 1.0,
        "target_timerange": {"duration": total_duration_us, "start": 0},
        "template_id": "",
        "track_attribute": 0,
        "track_render_index": 0,
        "visible": True,
        "volume": 1.0
    }

    # 4. Generate synchronized caption cards
    cards = build_caption_cards(project)
    text_materials = []
    text_segments = []

    for c in cards:
        mat_id = str(uuid.uuid4()).upper()
        seg_id = str(uuid.uuid4()).upper()

        start_us = int(c["start"] * 1_000_000)
        duration_us = max(int((c["end"] - c["start"]) * 1_000_000), 200_000)

        full_text_parts = []
        ranges_and_fonts = []
        char_cursor = 0

        for w in c.get("words", []):
            w_text = w.get("text", "")
            full_text_parts.append(w_text)

            w_len = len(w_text)
            start_idx = char_cursor
            end_idx = start_idx + w_len

            font_path = PLAYFAIR_FONT_PATH if w.get("isEmphasis") else POPPINS_FONT_PATH
            font_id = PLAYFAIR_FONT_ID if w.get("isEmphasis") else POPPINS_FONT_ID

            ranges_and_fonts.append({
                "range": [start_idx, end_idx],
                "font": {
                    "id": font_id,
                    "path": font_path
                }
            })
            char_cursor = end_idx + 1

        final_text = " ".join(full_text_parts)

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
                "size": 10.5
            })

        text_content_obj = {
            "styles": styles,
            "text": final_text
        }

        text_mat = {
            "add_type": 0,
            "alignment": 1,
            "background_alpha": 1.0,
            "background_color": "",
            "background_height": 0.14,
            "background_horizontal_offset": 0.0,
            "background_round_radius": 0.0,
            "background_style": 0,
            "background_vertical_offset": 0.0,
            "background_width": 0.14,
            "base_content": "",
            "bold_width": 0.0,
            "border_alpha": 1.0,
            "border_color": "",
            "border_width": 0.08,
            "caption_template_info": {"category_id": "", "category_name": "", "effect_id": "", "is_new": False, "path": "", "request_id": "", "resource_id": "", "resource_name": ""},
            "check_flag": 7,
            "content": json.dumps(text_content_obj, ensure_ascii=False),
            "font_category_id": "",
            "font_category_name": "",
            "font_id": POPPINS_FONT_ID,
            "font_name": "",
            "font_path": POPPINS_FONT_PATH,
            "font_resource_id": "",
            "font_size": 10.5,
            "font_source_plat": 0,
            "font_team_id": "",
            "font_title": "none",
            "font_url": "",
            "fonts": [],
            "force_apply_line_max_width": False,
            "global_alpha": 1.0,
            "group_id": "",
            "has_shadow": True,
            "id": mat_id,
            "initial_scale": 1.0,
            "inner_padding": 0.0,
            "is_rich_text": True,
            "italic_degree": 0,
            "ktv_color": "",
            "language": "",
            "layer_weight": 1,
            "letter_spacing": -0.02,
            "line_feed": 1,
            "line_max_width": 0.85,
            "line_spacing": 0.02,
            "name": "",
            "original_size": [],
            "preset_category": "",
            "preset_category_id": "",
            "preset_has_set_marker": False,
            "preset_id": "",
            "preset_index": 0,
            "preset_name": "",
            "recognize_type": 0,
            "shadow_alpha": 0.6,
            "shadow_angle": -45.0,
            "shadow_color": "#000000",
            "shadow_distance": 5.0,
            "shadow_point": {"x": 3.5, "y": -3.5},
            "shadow_smoothing": 0.5,
            "shape_clip_x": False,
            "shape_clip_y": False,
            "style_name": "",
            "sub_type": 0,
            "text_alpha": 1.0,
            "text_color": "#FFFFFF",
            "text_preset_resource_id": "",
            "text_size": 30,
            "text_to_audio_ids": [],
            "type": "text",
            "typesetting": 0,
            "underline": False,
            "use_effect_default_color": False,
            "words": {"has_shadow": False, "shadow_color": "", "text_styles": []}
        }
        text_materials.append(text_mat)

        text_seg = {
            "clip": {"alpha": 1.0, "flip": {"horizontal": False, "vertical": False}, "rotation": 0.0, "scale": {"x": 1.0, "y": 1.0}, "transform": {"x": 0.0, "y": -0.58}},
            "common_keyframes": [],
            "enable_adjust": True,
            "enable_color_curves": True,
            "enable_color_match_adjust": False,
            "enable_color_wheels": True,
            "enable_lut": True,
            "enable_smart_color_adjust": False,
            "extra_material_refs": [],
            "group_id": "",
            "id": seg_id,
            "intensifies_audio": False,
            "is_placeholder": False,
            "is_tone_modify": False,
            "keyframe_refs": [],
            "last_nonzero_volume": 1.0,
            "material_id": mat_id,
            "render_index": 1,
            "responsive_layout": {"enable": False, "horizontal_pos_layout": 0, "size_layout": 0, "target_follow": "", "vertical_pos_layout": 0},
            "reverse": False,
            "source_timerange": {"duration": duration_us, "start": 0},
            "speed": 1.0,
            "target_timerange": {"duration": duration_us, "start": start_us},
            "template_id": "",
            "track_attribute": 0,
            "track_render_index": 1,
            "visible": True,
            "volume": 1.0
        }
        text_segments.append(text_seg)

    # 5. Assemble draft_content.json
    draft_content = {
        "canvas_config": {
            "height": 1920,
            "ratio": "original",
            "width": 1080
        },
        "color_space": 0,
        "config": {
            "adjust_max_index": 1,
            "attachment_info": [],
            "combination_max_index": 1,
            "export_range": None,
            "extract_audio_last_index": 1,
            "lyrics_recognition_id": "",
            "lyrics_sync": True,
            "lyrics_taskinfo": [],
            "maintrack_adsorb": True,
            "material_save_mode": 0,
            "multi_language_current": "none",
            "multi_language_list": [],
            "multi_language_main": "none",
            "multi_language_mode": "none",
            "original_sound_last_index": 1,
            "record_audio_last_index": 1,
            "sticker_max_index": 1,
            "subtitle_keywords_config": None,
            "subtitle_recognition_id": "",
            "subtitle_sync": True,
            "subtitle_taskinfo": [],
            "system_font_list": [],
            "video_mute": False,
            "zoom_info_params": None
        },
        "cover": None,
        "create_time": int(time.time()),
        "duration": total_duration_us,
        "extra_info": None,
        "fps": 30.0,
        "free_render_index_mode_on": False,
        "group_container": None,
        "id": str(uuid.uuid4()).upper(),
        "keyframe_graph_list": [],
        "keyframes": {
            "adjusts": [],
            "audios": [],
            "effects": [],
            "filters": [],
            "handwrites": [],
            "stickers": [],
            "texts": [],
            "videos": []
        },
        "last_modified_platform": {
            "app_id": 3704,
            "app_source": "ea",
            "app_version": "9.2.0",
            "device_id": "windows",
            "hard_disk_id": "disk",
            "mac_address": "00:00:00:00:00:00",
            "os": "windows",
            "os_version": "10.0.22631"
        },
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

    # 6. Write draft_meta_info.json
    now_ts = int(time.time() * 1000)
    draft_id = str(uuid.uuid4()).upper()
    draft_meta = {
        "draft_id": draft_id,
        "draft_name": draft_name,
        "draft_fold_path": str(project_dir).replace("\\", "/"),
        "draft_timeline_materials_size_": 0,
        "tm_draft_create": now_ts,
        "tm_draft_modified": now_ts,
        "tm_duration": total_duration_us
    }
    with open(project_dir / "draft_meta_info.json", "w", encoding="utf-8") as f:
        json.dump(draft_meta, f, indent=2)

    # Copy cover still if available
    cover_src = None
    if "openai" in project_id:
        c1 = Path(r"C:\Users\Windows\Documents\Dave's-Agent-OS\03 - Projects\01 - Video Projects\Growithkeda\Assets - OpenAI Downsizes Video\exports\cover_still_1080x1920.png")
        if c1.exists():
            cover_src = c1
    if cover_src:
        try:
            shutil.copy2(cover_src, project_dir / "draft_cover.jpg")
        except Exception:
            pass

    # 7. Register in root_meta_info.json
    if ROOT_META_PATH.exists():
        try:
            with open(ROOT_META_PATH, "r", encoding="utf-8") as f:
                root_data = json.load(f)

            all_draft_store = root_data.get("all_draft_store", [])
            # Remove any existing draft with identical name
            all_draft_store = [d for d in all_draft_store if d.get("draft_name") != draft_name]

            # Prepend to index 0 so it displays first in CapCut UI
            new_entry = {
                "cloud_draft_cover": False,
                "cloud_draft_sync": False,
                "draft_cloud_last_action_download": False,
                "draft_cover": str(project_dir / "draft_cover.jpg").replace("\\", "/") if (project_dir / "draft_cover.jpg").exists() else "",
                "draft_fold_path": str(project_dir).replace("\\", "/"),
                "draft_id": draft_id,
                "draft_is_ai_shorts": False,
                "draft_is_cloud_temp_draft": False,
                "draft_is_infinite_canvas_draft": False,
                "draft_is_invisible": False,
                "draft_is_pippit_draft": False,
                "draft_is_web_article_video": False,
                "draft_json_file": str(project_dir / "draft_content.json").replace("\\", "/"),
                "draft_materials": [],
                "draft_name": draft_name,
                "draft_new_version": "",
                "draft_root_path": str(CAPCUT_DRAFTS_ROOT).replace("\\", "/"),
                "draft_timeline_materials_size": 0,
                "draft_type": "",
                "streaming_edit_draft_ready": True,
                "tm_draft_create": now_ts * 1000,
                "tm_draft_modified": now_ts * 1000,
                "tm_draft_removed": 0,
                "tm_duration": total_duration_us
            }
            all_draft_store.insert(0, new_entry)
            root_data["all_draft_store"] = all_draft_store

            with open(ROOT_META_PATH, "w", encoding="utf-8") as f:
                json.dump(root_data, f, indent=2)
        except Exception as e:
            print(f"Warning: Failed updating root_meta_info: {e}", file=sys.stderr)

    result = {
        "success": True,
        "draftName": draft_name,
        "draftPath": str(project_dir),
        "videoFile": str(video_file),
        "durationSeconds": round(duration_sec, 2),
        "captionCount": len(cards),
        "projectId": project_id
    }
    return result

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="CapCut Desktop Project Compiler")
    parser.add_argument("--project-id", required=True, help="Project ID from projects-data.ts")
    parser.add_argument("--project-name", default=None, help="Optional custom project name")
    parser.add_argument("--video-path", default=None, help="Optional master video file path")
    args = parser.parse_args()

    try:
        res = compile_project_to_capcut(args.project_id, args.project_name, args.video_path)
        print(json.dumps(res, indent=2))
        sys.exit(0)
    except Exception as e:
        err = {"success": False, "error": str(e)}
        print(json.dumps(err, indent=2), file=sys.stderr)
        sys.exit(1)
