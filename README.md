# Growithkeda Motion Review Studio 🎬

> **Precision Motion Graphics Review & Voice Feedback Portal for Autonomous Creative Production**  
> Custom Domain: `motionprojects.growithkeda.com`  
> Developed for David Asoya (Creative Director, Growithkeda)

---

## Overview

**Motion Review Studio** is a dedicated review, QA, and directive station for high-ticket video animations, kinetic motion graphics, and visual storyboards. It bridges human creative direction with autonomous agent execution (Antigravity / Remotion).

### Core Capabilities

- 🎙️ **In-Browser Voice Directive Capture**: Built with native Web Audio & Web Speech APIs (`SpeechRecognition`), enabling 1-click microphone recording that automatically transcribes spoken change requests into clear text notes in real-time.
- 📱 **9:16 Vertical Phone Simulator**: Pixel-accurate vertical mobile preview viewport with responsive zoom controls (70% – 140%), safe area markers, and social reel UI overlays.
- 🎨 **Client Brand Enforcement**: Built-in adherence to client visual guidelines (e.g. Dr Kaka's Warm Clinic Cream `#F6F4EB`, Deep Green `#155E47`, Pure White `#FFFFFF`, Accent Orange `#FF7B25`).
- 🏷️ **1-Click Quick Issue Tags**: Instantly flag `🔤 Copy / Typo`, `⏱️ Timing / Pacing`, `🔍 Scale / Zoom In`, `🎨 Color / Contrast`, `🖼️ Asset / Icon Change`, `⏸️ Hold End Frame`, and `✨ Anti-AI Polish`.
- ⚡ **1-Click Antigravity Sync Bar**: Automatically compiles all voice transcripts, text notes, and approval states into an uncompressed Markdown Feedback Matrix ready to copy and paste directly to Antigravity for bulk scene re-rendering.
- 💾 **Zero-Loss Local Persistence**: Automatically saves scene reviews and drafts to browser `localStorage`.

---

## Active Pre-Loaded Projects

1. **Dr Kaka — "Is GLP-1 Safe Long Term?"**
   - 12 Handcrafted SVG Visual Storyboard Scenes
   - Spoken Script Anchors, Dynamic Typography Hierarchy, and Clinical Diagrams
   - 100% Conversational, Anti-Jargon Copy Standard
2. **Dr Kaka — "GLP-1 Intro: Ozempic, Wegovy & Mounjaro"**
   - 12-Scene Master Programmatic Remotion Suite
   - Verified Timing & Audio Anchors

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS, Custom SVG Vectors
- **Icons**: Lucide React
- **Audio & Speech**: HTML5 `MediaRecorder` API + Web Speech API (`SpeechRecognition`)
- **Deployment**: Vercel Serverless Platform

---

## Local Development

```bash
# Install dependencies
npm install

# Start local development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Vercel Deployment & Custom Domain Setup

1. **Push to GitHub**:
   ```bash
   git add .
   git commit -m "feat: initial motion review studio release"
   git push origin main
   ```
2. **Import into Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new)
   - Select `motion-review-studio` repository
   - Framework preset: `Next.js`
   - Click **Deploy**
3. **Connect Custom Domain (`motionprojects.growithkeda.com`)**:
   - In Vercel Project Settings $\rightarrow$ **Domains**
   - Add `motionprojects.growithkeda.com`
   - In your DNS provider (Cloudflare / Namecheap / GoDaddy):
     - Type: `CNAME`
     - Name: `motionprojects`
     - Target: `cname.vercel-dns.com`
