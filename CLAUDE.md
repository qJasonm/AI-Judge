# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**AI Judge** is a hackathon project evaluation system. It ingests code repositories, presentation slides, and pitch transcripts, then runs them through a 4-stage streaming LLM pipeline to produce a scored verdict.

## Commands

### Setup
```bash
pip install -r backend/requirements.txt
```

### Build Ollama Models
Requires Ollama running at `http://localhost:11434`. Run these from the repo root:
```bash
ollama create slidejudge -f ModelfileSlides
ollama create codejudge -f ModelfileCode
ollama create textjudge -f ModelfileText
ollama create finaljudge -f Modelfile
```

### Run the Server
```bash
python backend/server.py
```
Serves on `http://localhost:5000` (overrideable via `PORT` env var). The frontend is served from this same process.

### Run Tests
```bash
python test_pipeline.py          # Full integration test against DataSet/Presence AI
python test_reasoning.py         # Tests streaming of reasoning tokens from finaljudge
python test_structured_think.py  # Tests structured JSON output with Pydantic schema
```

## Architecture

### Pipeline (`judge_pipeline.py`)
The core of the system. `run_pipeline_streaming()` is a generator that yields SSE events token-by-token through 4 sequential stages:

| Stage | Model | Purpose |
|-------|-------|---------|
| 1. Slide Analysis | `slidejudge` (qwen3-vl:8b) | Vision model — analyzes slide layout, visuals, design quality |
| 2. Code Analysis | `codejudge` (qwen3.5:9b) | Architecture review from file structure + imports only (no code bodies) |
| 3. Text Analysis | `textjudge` (qwen3.5:9b) | Evaluates pitch/speech clarity, storytelling, key messages |
| 4. Final Judge | `finaljudge` (qwen3.5:27b) | Synthesizes all three reports into a scored verdict |

Each stage's JSON output feeds as context into the final stage.

### Scoring
Final scores use only discrete values `{0, 1, 3, 5}` (intentional — prevents score manipulation). Weighted categories:
- Innovation & Creativity: 20%
- Technical Depth: 15%
- Impact & Usefulness: 20%
- Presentation & Demo: 25%
- Feasibility & Sustainability: 20%

### Extraction Modules
- `repo_extract.py` — Converts a code directory to a JSON structure (file tree + imports, no code bodies)
- `pdf_extract.py` — Extracts per-slide metadata + base64 PNG thumbnails from PDF/PPTX
- `video_extract.py` — Extracts keyframes from video at 5-second intervals as base64 PNGs

### Backend API (`backend/server.py`)
Flask app with these endpoints:
- `POST /api/extract` — Code directory → JSON structure
- `POST /api/extract-pdf` — PDF/PPTX → slide metadata
- `POST /api/extract-video` — Video → keyframe metadata
- `POST /api/extract-text` — Text/speech file passthrough
- `POST /api/judge` — Full streaming pipeline (SSE response)

### Frontend (`INfra/`)
Vanilla JS/HTML/CSS. Served by Flask at `/`. Provides drag-and-drop file categorization and real-time streaming result display.

### Modelfiles
Four Modelfiles at the repo root define system prompts and parameters for each Ollama model. All include prompt injection detection logic. `Modelfile` (finaljudge) uses `temp=0.0` and `ctx=16384`.

## Key Design Decisions
- **No code bodies sent to LLMs** — only file structure and import graphs (privacy + token efficiency)
- **Prompt injection defense** — all Modelfiles include instructions to detect and reject malicious content in submissions
- **Streaming-first** — the pipeline uses generator-based SSE streaming end-to-end, not batch processing
