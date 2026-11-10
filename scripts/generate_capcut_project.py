#!/usr/bin/env python3
"""
CapCut Desktop Native Project Generator for Dr Kaka Captions
Skill: Dr-kaka-capcut-captions-2

Generates 100% native CapCut Desktop projects with:
- Multi-timeline architecture: Timelines/<timeline_id>/draft_content.json + project.json
- Root-level sync: draft_content.json, timeline_layout.json, draft_meta_info.json, root_meta_info.json
- Exact video track with full material refs
- Synchronized dual-font subtitle track (Poppins-Bd + PlayfairDisplay-Italic)
- Contiguous word-range partitioning with ZERO missing spaces (eliminates word collisions)
- Exact user-calibrated shadow tokens (4% blur, 40% opacity, distance 5, angle -45°)
- Natural letter spacing (0.0) preventing letter squishing
- Automatic validation suite execution
"""

import os
import sys
import json
import uuid
import time
import shutil
import subprocess
from pathlib import Path

POPPINS_FONT_ID = "7533520397891865873"
POPPINS_FONT_PATH = "C:/Users/Windows/AppData/Local/CapCut/User Data/Cache/effect/7533520397891865873/2c8d5a6ed0321cb5e4cd03367b864549/font.ttf"

PLAYFAIR_FONT_ID = "7200960247266021889"
PLAYFAIR_FONT_PATH = "C:/Users/Windows/AppData/Local/CapCut/User Data/Cache/effect/7200960247266021889/37cccf8069b4093f9f4b721aa841a92d/PlayfairDisplay-Italic-VariableFont_wght.ttf"

CAPCUT_DRAFTS_ROOT = Path(r"C:\Users\Windows\AppData\Local\CapCut\User Data\Projects\com.lveditor.draft")
ROOT_META_PATH = CAPCUT_DRAFTS_ROOT / "root_meta_info.json"
TEMPLATE_PROJECT_DIR = CAPCUT_DRAFTS_ROOT / "Claude Code Test"

# Locked User-Calibrated Stylistic Tokens
SHADOW_DIFFUSE = 0.003759398590773344  # CapCut 4% blur
SHADOW_SMOOTHING = 0.06766917463392019 # CapCut 4% smoothing
SHADOW_ALPHA = 0.4000000059604645      # CapCut 40% opacity
SHADOW_DISTANCE = 5.0                  # CapCut Distance 5
SHADOW_ANGLE = -45.0                   # CapCut Angle -45°
STROKE_WIDTH = 0.0021352313924580812   # CapCut Thickness 1
FONT_SIZE = 18.0                       # CapCut Size 18
LETTER_SPACING = 0.0                   # Natural character spacing
LINE_SPACING = 0.02                    # Standard baseline
TRANSFORM_Y = -0.4387878787878787      # CapCut Y: -1075 lower third

def ensure_capcut_closed():
    """Stops CapCut processes if running to prevent in-memory overwrite of root_meta_info.json."""
    try:
        subprocess.run(
            ["powershell", "-Command", "Stop-Process -Name CapCut -Force -ErrorAction SilentlyContinue"],
            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
        )
    except Exception:
        pass

def create_capcut_project(video_path, captions_json_path, project_name="Dr Kaka - Is GLP Safe (Auto-Captioned)"):
    ensure_capcut_closed()
    
    video_file = Path(video_path).resolve()
    if not video_file.exists():
        raise FileNotFoundError(f"Video file not found: {video_file}")
        
    with open(captions_json_path, "r", encoding="utf-8") as f:
        cards = json.load(f)
        
    # Project directory
    project_dir = CAPCUT_DRAFTS_ROOT / project_name
    project_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate cover thumbnail
    cover_jpg = project_dir / "draft_cover.jpg"
    subprocess.run(
        ["ffmpeg", "-ss", "00:00:05", "-i", str(video_file), "-vframes", "1", "-q:v", "2", str(cover_jpg), "-y"],
        stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
    )
    
    # Video duration
    probe_cmd = [
        "ffprobe", "-v", "error", "-show_entries", "format=duration",
        "-of", "default=noprint_wrappers=1:nokey=1", str(video_file)
    ]
    try:
        dur_str = subprocess.check_output(probe_cmd, text=True).strip()
        total_duration_sec = float(dur_str)
    except Exception:
        total_duration_sec = max(c["end"] for c in cards) + 1.0
        
    total_duration_us = int(total_duration_sec * 1_000_000)
    now_us = int(time.time() * 1_000_000)
    now_sec = int(time.time())
    
    # Unique IDs
    timeline_id = str(uuid.uuid4()).upper()
    project_sub_id = str(uuid.uuid4()).upper()
    video_material_id = str(uuid.uuid4()).upper()
    video_segment_id = str(uuid.uuid4()).upper()
    
    speed_id = str(uuid.uuid4()).upper()
    canvas_id = str(uuid.uuid4()).upper()
    sound_id = str(uuid.uuid4()).upper()
    vocal_id = str(uuid.uuid4()).upper()
    color_id = str(uuid.uuid4()).upper()
    placeholder_id = str(uuid.uuid4()).upper()
    
    # 1. Base template loading from Claude Code Test
    base_content_file = TEMPLATE_PROJECT_DIR / "draft_content.json"
    if base_content_file.exists():
        with open(base_content_file, "r", encoding="utf-8") as f:
            draft_content = json.load(f)
    else:
        raise FileNotFoundError(f"Template not found at {base_content_file}")
        
    # Metadata
    draft_content["id"] = timeline_id
    draft_content["name"] = project_name
    draft_content["duration"] = total_duration_us
    draft_content["create_time"] = now_us
    draft_content["update_time"] = now_us
    draft_content["path"] = str(project_dir).replace("\\", "/")
    
    # Reset materials
    for k in draft_content["materials"]:
        draft_content["materials"][k] = []
        
    # Video material
    video_mat = {
        "id": video_material_id, "unique_id": "", "type": "video", "duration": total_duration_us,
        "path": str(video_file).replace("/", "\\"), "media_path": "", "local_id": "", "has_audio": True,
        "reverse_path": "", "intensifies_path": "", "reverse_intensifies_path": "", "intensifies_audio_path": "",
        "cartoon_path": "", "width": 1080, "height": 1920, "category_id": "", "category_name": "",
        "material_id": "", "material_name": video_file.name, "material_url": "",
        "crop": {"upper_left_x": 0.0, "upper_left_y": 0.0, "upper_right_x": 1.0, "upper_right_y": 0.0, "lower_left_x": 0.0, "lower_left_y": 1.0, "lower_right_x": 1.0, "lower_right_y": 1.0},
        "crop_ratio": "free", "audio_fade": None, "crop_scale": 1.0, "extra_type_option": 0,
        "stable": {"stable_level": 0, "matrix_path": "", "time_range": {"start": 0, "duration": 0}},
        "matting": {"flag": 0, "path": "", "interactiveTime": [], "has_use_quick_brush": False, "strokes": [], "has_use_quick_eraser": False, "expansion": 0, "feather": 0, "reverse": False, "custom_matting_id": "", "enable_matting_stroke": False, "is_clould": False, "mask_video_path": "", "cloud_product_fps": 0.0},
        "source": 0, "source_platform": 0, "formula_id": "", "check_flag": 62978047,
        "video_algorithm": {"algorithms": [], "time_range": None, "path": "", "gameplay_configs": [], "ai_in_painting_config": [], "complement_frame_config": None, "motion_blur_config": None, "deflicker": None, "noise_reduction": None, "quality_enhance": None, "super_resolution": None, "ai_background_configs": [], "smart_complement_frame": None, "aigc_generate": None, "aigc_generate_list": [], "mouth_shape_driver": None, "ai_expression_driven": None, "ai_motion_driven": None, "image_interpretation": None, "story_video_modify_video_config": {"task_id": "", "is_overwrite_last_video": False, "tracker_task_id": "", "generate_id": "", "generate_card_id": ""}, "skip_algorithm_index": []},
        "is_unified_beauty_mode": False, "is_set_beauty_mode": False, "object_locked": None, "smart_motion": None, "multi_camera_info": None, "freeze": None, "picture_from": "none", "picture_set_category_id": "", "picture_set_category_name": "", "team_id": "", "local_material_id": "", "origin_material_id": "", "request_id": "", "has_sound_separated": False, "is_text_edit_overdub": False, "is_ai_generate_content": False, "is_video_copilot_aigc_content": False, "aigc_type": "none", "is_copyright": False, "aigc_history_id": "", "aigc_item_id": "", "local_material_from": "", "smart_match_info": None, "beauty_face_preset_infos": [], "beauty_body_preset_id": "", "beauty_face_auto_preset": {"preset_id": "", "name": "", "rate_map": "", "scene": ""}, "beauty_face_auto_preset_infos": [], "beauty_body_auto_preset": None, "live_photo_timestamp": -1, "live_photo_cover_path": "", "content_feature_info": None, "corner_pin": None, "surface_trackings": [],
        "video_mask_stroke": {"resource_id": "", "path": "", "type": "", "color": "", "size": 0.0, "alpha": 0.0, "distance": 0.0, "texture": 0.0, "horizontal_shift": 0.0, "vertical_shift": 0.0},
        "video_mask_shadow": {"resource_id": "", "path": "", "color": "", "alpha": 0.0, "blur": 0.0, "distance": 0.0, "angle": 0.0},
        "pre_applied_vip_materials": [], "workflow_node_id": ""
    }
    draft_content["materials"]["videos"].append(video_mat)
    
    # Aux materials
    draft_content["materials"]["speeds"].append({"curve_speed": None, "id": speed_id, "mode": 0, "speed": 1.0, "type": "speed"})
    draft_content["materials"]["canvases"].append({"album_image": "", "blur": 0.0, "color": "", "id": canvas_id, "image": "", "image_id": "", "image_name": "", "source_platform": 0, "team_id": "", "type": "canvas_color"})
    draft_content["materials"]["sound_channel_mappings"].append({"audio_channel_mapping": 0, "id": sound_id, "is_config_open": False, "type": ""})
    draft_content["materials"]["vocal_separations"].append({"choice": 0, "id": vocal_id, "production_path": "", "time_range": None, "type": "vocal_separation"})
    draft_content["materials"]["material_colors"].append({"id": color_id, "type": "material_color"})
    draft_content["materials"]["placeholder_infos"].append({"id": placeholder_id, "type": "placeholder_info"})
    
    # Text materials & Subtitle segments
    text_materials = []
    text_segments = []
    anim_materials = []
    
    for idx, c in enumerate(cards):
        mat_id = str(uuid.uuid4()).upper()
        seg_id = str(uuid.uuid4()).upper()
        anim_id = str(uuid.uuid4()).upper()
        
        start_us = int(c["start"] * 1_000_000)
        duration_us = max(int((c["end"] - c["start"]) * 1_000_000), 200_000)
        
        # Contiguous word grouping (Poppins vs Playfair)
        words_list = c.get("words", [])
        groups = []
        current_is_emphasis = None
        current_words = []
        
        for w in words_list:
            is_emp = bool(w.get("isEmphasis", False))
            if is_emp != current_is_emphasis:
                if current_words:
                    groups.append((current_is_emphasis, current_words))
                current_is_emphasis = is_emp
                current_words = [w["text"]]
            else:
                current_words.append(w["text"])
        if current_words:
            groups.append((current_is_emphasis, current_words))
            
        ranges_and_fonts = []
        final_text_parts = []
        char_cursor = 0
        
        for g_idx, (is_emp, g_words) in enumerate(groups):
            g_text = " ".join(g_words)
            final_text_parts.append(g_text)
            
            # Trailing space included in range to eliminate unstyled character gaps
            span_text = g_text + (" " if g_idx < len(groups) - 1 else "")
            start_idx = char_cursor
            end_idx = start_idx + len(span_text)
            
            font_path = PLAYFAIR_FONT_PATH if is_emp else POPPINS_FONT_PATH
            font_id = PLAYFAIR_FONT_ID if is_emp else POPPINS_FONT_ID
            
            ranges_and_fonts.append({
                "range": [start_idx, end_idx],
                "font": {"id": font_id, "path": font_path},
                "is_emp": is_emp
            })
            char_cursor = end_idx
            
        final_text = " ".join(final_text_parts)
        is_mixed_rich_text = len(groups) > 1
        
        styles = []
        for rf in ranges_and_fonts:
            style_obj = {
                "fill": {
                    "alpha": 1.0,
                    "content": {
                        "render_type": "solid",
                        "solid": {"alpha": 1.0, "color": [1.0, 1.0, 1.0]}
                    }
                },
                "font": rf["font"],
                "range": rf["range"],
                "shadows": [
                    {
                        "alpha": SHADOW_ALPHA,
                        "angle": SHADOW_ANGLE,
                        "content": {"render_type": "solid", "solid": {"color": [0, 0, 0]}},
                        "diffuse": SHADOW_DIFFUSE,
                        "distance": SHADOW_DISTANCE,
                        "thickness_projection_angle": -45,
                        "thickness_projection_distance": 0,
                        "thickness_projection_enable": False
                    }
                ],
                "size": FONT_SIZE,
                "strokes": [
                    {
                        "content": {"render_type": "solid", "solid": {"color": [0, 0, 0]}},
                        "width": STROKE_WIDTH,
                        "mode": 0
                    }
                ],
                "useLetterColor": True
            }
            if rf["is_emp"]:
                style_obj["bold"] = True
            styles.append(style_obj)
            
        content_json_str = json.dumps({"styles": styles, "text": final_text})
        
        text_material = {
            "recognize_task_id": f"auto_caption_kaka_{idx}",
            "id": mat_id,
            "name": "",
            "recognize_text": final_text.lower(),
            "recognize_model": "",
            "punc_model": "",
            "type": "subtitle",
            "content": content_json_str,
            "base_content": "",
            "words": {"start_time": [], "end_time": [], "text": []},
            "current_words": {"start_time": [], "end_time": [], "text": []},
            "global_alpha": 1.0,
            "combo_info": {"text_templates": []},
            "caption_template_info": {
                "resource_id": "", "third_resource_id": "", "resource_name": "",
                "category_id": "", "category_name": "", "effect_id": "",
                "request_id": "", "path": "", "is_new": False, "source_platform": 0
            },
            "layer_weight": 1,
            "letter_spacing": LETTER_SPACING,
            "line_spacing": LINE_SPACING,
            "has_shadow": True,
            "shadow_color": "#000000",
            "shadow_alpha": SHADOW_ALPHA,
            "shadow_smoothing": SHADOW_SMOOTHING,
            "shadow_distance": SHADOW_DISTANCE,
            "shadow_angle": SHADOW_ANGLE,
            "border_alpha": 1.0,
            "border_color": "#000000",
            "border_width": STROKE_WIDTH,
            "border_mode": 0,
            "text_color": "#ffffff",
            "text_alpha": 1.0,
            "font_name": "Poppins-Bd",
            "font_title": "Poppins-Bd",
            "font_size": FONT_SIZE,
            "font_path": POPPINS_FONT_PATH,
            "font_id": "",
            "font_resource_id": POPPINS_FONT_ID,
            "alignment": 1,
            "is_rich_text": is_mixed_rich_text,
            "adjust_params": []
        }
        text_materials.append(text_material)
        
        anim_materials.append({
            "id": anim_id,
            "type": "sticker_animation",
            "animations": [],
            "multi_language_current": "none"
        })
        
        text_segment = {
            "id": seg_id,
            "source_timerange": None,
            "target_timerange": {"start": start_us, "duration": duration_us},
            "render_timerange": {"start": 0, "duration": 0},
            "desc": "", "state": 0, "speed": 1.0, "is_loop": False, "is_tone_modify": False,
            "reverse": False, "intensifies_audio": False, "cartoon": False, "volume": 1.0,
            "last_nonzero_volume": 1.0,
            "clip": {
                "scale": {"x": 1.0, "y": 1.0},
                "rotation": 0.0,
                "rotation3d": [],
                "transform": {"x": 0.0, "y": TRANSFORM_Y},
                "flip": {"vertical": False, "horizontal": False},
                "alpha": 1.0
            },
            "uniform_scale": {"on": True, "value": 1.0},
            "material_id": mat_id,
            "extra_material_refs": [anim_id],
            "render_index": 14000,
            "keyframe_refs": [],
            "enable_lut": False,
            "enable_adjust": False,
            "enable_hsl": False,
            "visible": True,
            "group_id": "",
            "enable_color_curves": True,
            "enable_hsl_curves": True,
            "track_render_index": 1,
            "hdr_settings": None,
            "hdr_vivid_settings": None,
            "enable_color_wheels": True,
            "track_attribute": 0,
            "is_placeholder": False,
            "template_id": "",
            "enable_smart_color_adjust": False,
            "template_scene": "default",
            "common_keyframes": [],
            "caption_info": None,
            "responsive_layout": {"enable": False, "target_follow": "", "size_layout": 0, "horizontal_pos_layout": 0, "vertical_pos_layout": 0},
            "enable_color_match_adjust": False,
            "enable_color_correct_adjust": False,
            "enable_adjust_mask": False,
            "raw_segment_id": "",
            "lyric_keyframes": None,
            "enable_video_mask": True,
            "digital_human_template_group_id": "",
            "color_correct_alg_result": "",
            "source": "segmentsourcenormal",
            "enable_mask_stroke": False,
            "enable_mask_shadow": False,
            "enable_color_adjust_pro": False,
            "segment_color_tag": ""
        }
        text_segments.append(text_segment)
        
    draft_content["materials"]["texts"] = text_materials
    draft_content["materials"]["material_animations"] = anim_materials
    
    # Video segment & Track
    video_segment = {
        "id": video_segment_id,
        "source_timerange": {"start": 0, "duration": total_duration_us},
        "target_timerange": {"start": 0, "duration": total_duration_us},
        "render_timerange": {"start": 0, "duration": 0},
        "desc": "", "state": 0, "speed": 1.0, "is_loop": False, "is_tone_modify": False,
        "reverse": False, "intensifies_audio": False, "cartoon": False, "volume": 1.0,
        "last_nonzero_volume": 1.0,
        "clip": {
            "scale": {"x": 1.0, "y": 1.0}, "rotation": 0.0, "rotation3d": [],
            "transform": {"x": 0.0, "y": 0.0}, "flip": {"vertical": False, "horizontal": False},
            "alpha": 1.0
        },
        "uniform_scale": {"on": True, "value": 1.0},
        "material_id": video_material_id,
        "extra_material_refs": [speed_id, canvas_id, sound_id, vocal_id, color_id, placeholder_id],
        "render_index": 0, "keyframe_refs": [], "enable_lut": True, "enable_adjust": True,
        "enable_hsl": False, "visible": True, "group_id": "", "enable_color_curves": True,
        "enable_hsl_curves": True, "track_render_index": 0,
        "hdr_settings": {"mode": 1, "intensity": 1.0, "nits": 1000},
        "hdr_vivid_settings": None, "enable_color_wheels": True, "track_attribute": 0,
        "is_placeholder": False, "template_id": "", "enable_smart_color_adjust": False,
        "template_scene": "default", "common_keyframes": [], "caption_info": None,
        "responsive_layout": {"enable": False, "target_follow": "", "size_layout": 0, "horizontal_pos_layout": 0, "vertical_pos_layout": 0},
        "enable_color_match_adjust": False, "enable_color_correct_adjust": False, "enable_adjust_mask": False,
        "raw_segment_id": "", "lyric_keyframes": None, "enable_video_mask": True,
        "digital_human_template_group_id": "", "color_correct_alg_result": "",
        "source": "segmentsourcenormal", "enable_mask_stroke": False, "enable_mask_shadow": False,
        "enable_color_adjust_pro": False, "segment_color_tag": ""
    }
    
    video_track = {
        "attribute": 0, "flag": 0, "id": str(uuid.uuid4()).upper(),
        "is_default_name": True, "name": "", "segments": [video_segment], "type": "video"
    }
    
    text_track = {
        "attribute": 0, "flag": 1, "id": str(uuid.uuid4()).upper(),
        "is_default_name": True, "name": "", "segments": text_segments, "type": "text"
    }
    
    draft_content["tracks"] = [video_track, text_track]
    
    # Write Root files
    content_json_bytes = json.dumps(draft_content, ensure_ascii=False, indent=2).encode("utf-8")
    (project_dir / "draft_content.json").write_bytes(content_json_bytes)
    (project_dir / "draft_content.json.bak").write_bytes(content_json_bytes)
    (project_dir / "template-2.tmp").write_bytes(content_json_bytes)
    
    # Write Timelines folder
    timelines_dir = project_dir / "Timelines"
    timelines_dir.mkdir(parents=True, exist_ok=True)
    
    active_timeline_dir = timelines_dir / timeline_id
    active_timeline_dir.mkdir(parents=True, exist_ok=True)
    
    (active_timeline_dir / "draft_content.json").write_bytes(content_json_bytes)
    (active_timeline_dir / "draft_content.json.bak").write_bytes(content_json_bytes)
    (active_timeline_dir / "template-2.tmp").write_bytes(content_json_bytes)
    (active_timeline_dir / "template.tmp").write_bytes(content_json_bytes)
    if cover_jpg.exists():
        shutil.copy(cover_jpg, active_timeline_dir / "draft_cover.jpg")
        
    (active_timeline_dir / "attachment").mkdir(exist_ok=True)
    (active_timeline_dir / "common_attachment").mkdir(exist_ok=True)
    
    # Timelines/project.json
    timeline_project = {
        "config": {
            "color_space": -1, "hdr_vivid": False, "mixed_track_mode_on": False,
            "render_index_track_mode_on": False, "use_float_render": False
        },
        "create_time": now_us,
        "id": project_sub_id,
        "main_timeline_id": timeline_id,
        "timelines": [
            {
                "create_time": now_us, "id": timeline_id,
                "is_marked_delete": False, "name": "Timeline 01", "update_time": now_us
            }
        ],
        "update_time": now_us,
        "version": 0
    }
    (timelines_dir / "project.json").write_text(json.dumps(timeline_project, indent=2), encoding="utf-8")
    (timelines_dir / "project.json.bak").write_text(json.dumps(timeline_project, indent=2), encoding="utf-8")
    
    # timeline_layout.json
    timeline_layout = {
        "dockItems": [
            {
                "dockIndex": 0, "ratio": 1,
                "timelineIds": [timeline_id], "timelineNames": ["Timeline 01"]
            }
        ],
        "layoutOrientation": 1
    }
    (project_dir / "timeline_layout.json").write_text(json.dumps(timeline_layout, indent=2), encoding="utf-8")
    
    # Ancillary files
    for name in [
        "attachment_editing.json", "attachment_pc_common.json",
        "draft_agency_config.json", "draft_agency_info.json", "draft_biz_config.json",
        "draft_virtual_store.json", "key_value.json", "performance_opt_info.json"
    ]:
        src = TEMPLATE_PROJECT_DIR / name
        dst = project_dir / name
        if src.exists():
            shutil.copy(src, dst)
        if (active_timeline_dir / name).parent.exists() and name in ["attachment_editing.json", "attachment_pc_common.json"]:
            shutil.copy(src, active_timeline_dir / name)
            
    for sub in ["adjust_mask", "common_attachment", "matting", "qr_upload", "smart_crop", "subdraft", "Resources"]:
        (project_dir / sub).mkdir(exist_ok=True)
    for res_sub in ["audioAlg", "combination", "digitalHuman", "videoAlg"]:
        (project_dir / "Resources" / res_sub).mkdir(parents=True, exist_ok=True)
        
    settings_content = f"""[General]
draft_create_time={now_sec}
draft_last_edit_time={now_sec}
real_edit_seconds=180
real_edit_keys=1
cloud_last_modify_platform=windows
"""
    (project_dir / "draft_settings").write_text(settings_content, encoding="utf-8")
    
    # draft_meta_info.json
    total_size = sum(f.stat().st_size for f in project_dir.glob("**/*") if f.is_file())
    meta_info = {
        "cloud_draft_cover": False, "cloud_draft_sync": False, "draft_cloud_last_action_download": False,
        "draft_cloud_purchase_info": "", "draft_cloud_template_id": "", "draft_cloud_tutorial_info": "",
        "draft_cloud_videocut_purchase_info": "",
        "draft_cover": str(cover_jpg).replace("\\", "/"),
        "draft_fold_path": str(project_dir).replace("\\", "/"),
        "draft_id": timeline_id,
        "draft_is_ai_shorts": False, "draft_is_cloud_temp_draft": False,
        "draft_is_infinite_canvas_draft": False, "draft_is_invisible": False, "draft_is_pippit_draft": False,
        "draft_is_web_article_video": False,
        "draft_json_file": str(project_dir / "draft_content.json").replace("\\", "/"),
        "draft_materials": [],
        "draft_name": project_name, "draft_new_version": "",
        "draft_root_path": str(CAPCUT_DRAFTS_ROOT).replace("\\", "/"),
        "draft_timeline_materials_size": total_size, "draft_type": "",
        "draft_web_article_video_enter_from": "", "pippit_avatar_url": "", "pippit_extra_info": "",
        "pippit_id": "", "pippit_user_name": "", "streaming_edit_draft_ready": True,
        "tm_draft_cloud_completed": "", "tm_draft_cloud_entry_id": -1, "tm_draft_cloud_modified": 0,
        "tm_draft_cloud_parent_entry_id": -1, "tm_draft_cloud_space_id": -1, "tm_draft_cloud_user_id": -1,
        "tm_draft_create": now_us, "tm_draft_modified": now_us, "tm_draft_removed": 0,
        "tm_duration": total_duration_us
    }
    (project_dir / "draft_meta_info.json").write_text(json.dumps(meta_info, indent=2), encoding="utf-8")
    
    # Register in root_meta_info.json
    if ROOT_META_PATH.exists():
        with open(ROOT_META_PATH, "r", encoding="utf-8") as f:
            root_data = json.load(f)
            
        all_drafts = root_data.get("all_draft_store", [])
        all_drafts = [d for d in all_drafts if d.get("draft_name") != project_name and d.get("draft_id") != timeline_id]
        all_drafts.insert(0, meta_info)
        root_data["all_draft_store"] = all_drafts
        
        with open(ROOT_META_PATH, "w", encoding="utf-8") as f:
            json.dump(root_data, f, ensure_ascii=False, indent=2)
            
    print(f"Successfully created native CapCut project:")
    print(f"  Project: {project_dir}")
    print(f"  Timeline ID: {timeline_id}")
    print(f"  Captions: {len(text_segments)} blocks")
    
    # 10. Automated Validation
    validator_path = Path(__file__).parent / "validate_captions.py"
    if validator_path.exists():
        print("\nExecuting automated validation suite...")
        subprocess.run([sys.executable, str(validator_path), "--project", str(project_dir)])

if __name__ == "__main__":
    video = sys.argv[1] if len(sys.argv) > 1 else r"C:\Users\Windows\Videos\Kaka\Is GLP Safe - Raw.mp4"
    captions = sys.argv[2] if len(sys.argv) > 2 else r"C:\Users\Windows\Documents\Agent OS\motion-review-studio\public\videos\kaka\captions.json"
    create_capcut_project(video, captions)
