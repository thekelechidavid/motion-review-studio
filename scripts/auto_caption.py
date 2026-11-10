#!/usr/bin/env python3
"""
Dr Kaka Autonomous Auto-Captioning Pipeline
Skill: Dr-kaka-capcut-captions-2

End-to-end autonomous caption generation:
1. Audio extraction via FFmpeg
2. Word-level transcription via faster-whisper
3. Rhythmic chunking (1-4 words max, target 2-3)
4. Typographical medical grammar (Poppins-Bd base, PlayfairDisplay-Italic emphasis)
5. Export to ASS, SRT, JSON
6. Direct compilation to native CapCut Desktop 9.x+ project with automatic validation
"""

import os
import re
import sys
import json
import argparse
import subprocess
from pathlib import Path

# Medical, diagnostic, and emotional anchor words targeted for Playfair Display Italic emphasis
STOP_WORDS = {
    'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', "aren't",
    'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by',
    'can', "can't", 'cannot', 'could', "couldn't", 'did', "didn't", 'do', 'does', "doesn't", 'doing',
    "don't", 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', "hadn't", 'has', "hasn't",
    'have', "haven't", 'having', 'he', "he'd", "he'll", "he's", 'her', 'here', "here's", 'hers', 'herself',
    'him', 'himself', 'his', 'how', "how's", 'i', "i'd", "i'll", "i'm", "i've", 'if', 'in', 'into', 'is',
    "isn't", 'it', "it's", 'its', 'itself', 'let', "let's", 'me', 'more', 'most', "mustn't", 'my', 'myself',
    'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves',
    'out', 'over', 'own', 'same', "shan't", 'she', "she'd", "she'll", "she's", 'should', "shouldn't", 'so',
    'some', 'such', 'than', 'that', "that's", 'the', 'their', 'theirs', 'them', 'themselves', 'then',
    'there', "there's", 'these', 'they', "they'd", "they'll", "they're", "they've", 'this', 'those',
    'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', "wasn't", 'we', "we'd", "we'll", "we're",
    "we've", 'were', "weren't", 'what', "what's", 'when', "when's", 'where', "where's", 'which', 'while',
    'who', "who's", 'whom', 'why', "why's", 'with', "won't", 'would', "wouldn't", 'you', "you'd", "you'll",
    "you're", "you've", 'your', 'yours', 'yourself', 'yourselves'
}

SPECIAL_CAPS = {
    'glp-1': 'GLP-1',
    'glp1': 'GLP-1',
    'glp': 'GLP-1',
    'bmi': 'BMI',
    'fda': 'FDA',
    'hiv': 'HIV',
    'who': 'WHO',
    'nhs': 'NHS',
    'gp': 'GP',
    'i': 'I',
    "i'm": "I'm",
    "i've": "I've",
    "i'd": "I'd",
    "i'll": "I'll",
}

def format_word_case(word):
    clean = word.strip().lower()
    if clean in SPECIAL_CAPS:
        return SPECIAL_CAPS[clean]
    return clean

def extract_audio(video_path, audio_path):
    print(f"[*] Extracting audio from {video_path}...")
    cmd = [
        "ffmpeg", "-y", "-i", str(video_path),
        "-vn", "-acodec", "pcm_s16le", "-ar", "16000", "-ac", "1",
        str(audio_path)
    ]
    subprocess.run(cmd, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, check=True)

def transcribe(audio_path):
    print("[*] Running Whisper word-level transcription...")
    from faster_whisper import WhisperModel
    model = WhisperModel("base", device="cpu", compute_type="int8")
    segments, _ = model.transcribe(str(audio_path), word_timestamps=True, language="en")
    
    words = []
    for segment in segments:
        for word in segment.words:
            words.append({
                "word": word.word.strip(),
                "start": word.start,
                "end": word.end,
                "probability": word.probability
            })
    return words

def chunk_words(words, max_words=4, pause_threshold=0.25):
    """
    Rhythmic chunking: 1-4 words per burst (target 2-3).
    Splits on natural speech pauses (> 0.25s) or punctuation boundaries.
    """
    chunks = []
    current_chunk = []
    
    for i, w in enumerate(words):
        if not current_chunk:
            current_chunk.append(w)
            continue
            
        prev_word = current_chunk[-1]
        pause = w['start'] - prev_word['end']
        
        has_break_punc = prev_word['word'].endswith(('.', '?', '!', ',', ';', ':'))
        is_full = len(current_chunk) >= max_words
        is_paused = pause > pause_threshold
        
        if is_full or is_paused or has_break_punc:
            chunks.append(current_chunk)
            current_chunk = [w]
        else:
            current_chunk.append(w)
            
    if current_chunk:
        chunks.append(current_chunk)
        
    return chunks

def build_captions_json(chunks):
    cards = []
    for c_idx, chunk in enumerate(chunks):
        content_indices = []
        for idx, item in enumerate(chunk):
            clean_word = re.sub(r"[^\w\'-]", "", item['word']).lower()
            if clean_word and clean_word not in STOP_WORDS:
                content_indices.append(idx)
                
        # Emphasize primary anchor (clinical concept or emotional keyword)
        emphasis_idx = content_indices[-1] if content_indices else -1
        
        word_objs = []
        for idx, item in enumerate(chunk):
            raw = item['word'].strip()
            clean = re.sub(r"[^\w\'-]", "", raw)
            cased = format_word_case(clean)
            trailing = re.sub(r"[\w\'-]", "", raw)
            is_emp = (idx == emphasis_idx and clean.lower() not in STOP_WORDS)
            
            word_objs.append({
                "text": cased + trailing,
                "start": item['start'],
                "end": item['end'],
                "isEmphasis": is_emp
            })
            
        cards.append({
            "id": f"card-{c_idx}",
            "start": round(chunk[0]['start'], 3),
            "end": round(chunk[-1]['end'], 3),
            "words": word_objs
        })
    return cards

def format_ass_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    centis = int((seconds - int(seconds)) * 100)
    return f"{hours}:{minutes:02d}:{secs:02d}.{centis:02d}"

def write_ass_file(cards, output_path):
    header = """[Script Info]
; Script generated by Antigravity Dr-kaka-capcut-captions-2 Engine
Title: Dr Kaka Captions
ScriptType: v4.00+
WrapStyle: 0
PlayResX: 1080
PlayResY: 1920
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Poppins,84,&H00FFFFFF,&H000000FF,&H00000000,&H66000000,-1,0,0,0,100,100,0,0,1,2,5,2,40,40,375,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    events = []
    for c in cards:
        start_time = format_ass_time(c['start'])
        end_time = format_ass_time(c['end'])
        
        formatted_words = []
        for w in c['words']:
            if w['isEmphasis']:
                styled = r"{\fnPlayfair Display\i1\b1}" + w['text'] + r"{\fnPoppins\i0\b1}"
            else:
                styled = w['text']
            formatted_words.append(styled)
            
        dialogue_text = " ".join(formatted_words)
        line = f"Dialogue: 0,{start_time},{end_time},Default,,0,0,0,,{{\\fnPoppins\\b1\\blur1}}{dialogue_text}"
        events.append(line)
        
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(header + "\n".join(events) + "\n")
    print(f"[*] Wrote ASS subtitles: {output_path}")

def format_srt_time(seconds):
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds - int(seconds)) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def write_srt_file(cards, output_path):
    lines = []
    for idx, c in enumerate(cards, 1):
        start = format_srt_time(c['start'])
        end = format_srt_time(c['end'])
        text = " ".join(w['text'] for w in c['words'])
        lines.append(f"{idx}\n{start} --> {end}\n{text}\n")
    with open(output_path, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))
    print(f"[*] Wrote SRT subtitles: {output_path}")

def run_pipeline(video_path, output_mp4=None, create_capcut=True):
    video = Path(video_path).resolve()
    if not video.exists():
        raise FileNotFoundError(f"Video not found: {video}")
        
    base_stem = video.stem
    work_dir = video.parent
    
    audio_path = work_dir / f"{base_stem}_temp.wav"
    json_path = work_dir / f"{base_stem}_captions.json"
    ass_path = work_dir / f"{base_stem}.ass"
    srt_path = work_dir / f"{base_stem}.srt"
    
    try:
        extract_audio(video, audio_path)
        words = transcribe(audio_path)
        chunks = chunk_words(words, max_words=4, pause_threshold=0.25)
        cards = build_captions_json(chunks)
        
        with open(json_path, "w", encoding="utf-8") as f:
            json.dump(cards, f, indent=2)
        print(f"[*] Wrote captions JSON: {json_path}")
        
        write_ass_file(cards, ass_path)
        write_srt_file(cards, srt_path)
        
        # Burn to MP4 if requested
        if output_mp4:
            out_file = Path(output_mp4).resolve()
            fonts_dir = r"C:\Users\Windows\AppData\Local\CapCut\User Data\Cache\effect"
            ass_filter_arg = str(ass_path).replace("\\", "/").replace(":", r"\:")
            fonts_dir_arg = fonts_dir.replace("\\", "/").replace(":", r"\:")
            
            filter_str = f"ass='{ass_filter_arg}':fontsdir='{fonts_dir_arg}'"
            print(f"[*] Burning subtitles to {out_file}...")
            cmd = [
                "ffmpeg", "-y", "-i", str(video),
                "-vf", filter_str,
                "-c:v", "libx264", "-crf", "18", "-preset", "fast",
                "-c:a", "copy",
                str(out_file)
            ]
            subprocess.run(cmd, check=True)
            print(f"[SUCCESS] Finished video: {out_file}")
            
        # Build CapCut project
        if create_capcut:
            from generate_capcut_project import create_capcut_project
            project_name = f"Dr Kaka - {base_stem}"
            create_capcut_project(str(video), str(json_path), project_name=project_name)
            
    finally:
        if audio_path.exists():
            try:
                audio_path.unlink()
            except Exception:
                pass

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Dr Kaka Auto Captioning Pipeline")
    parser.add_argument("video", help="Path to raw video")
    parser.add_argument("-o", "--output", help="Optional path to render burned MP4")
    parser.add_argument("--no-capcut", action="store_true", help="Skip CapCut project generation")
    args = parser.parse_args()
    
    run_pipeline(args.video, output_mp4=args.output, create_capcut=not args.no_capcut)
