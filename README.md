# AI Judge

An AI-powered hackathon project evaluation system. Drop a project folder (code, slides, pitch transcript) and get a comprehensive scored verdict — streamed in real time.

Built with local LLMs via [Ollama](https://ollama.com), so everything runs on your hardware with no API keys needed.

## How It Works

Projects are evaluated through a **4-stage streaming pipeline**:

| Stage | Model | What It Does |
|---|---|---|
| Slide Analysis | `slidejudge` (qwen3-vl:8b) | Vision model analyzes presentation slides and video frames |
| Code Analysis | `codejudge` (qwen3.5:9b) | Reviews architecture and imports (no code bodies sent) |
| Text Analysis | `textjudge` (qwen3.5:9b) | Evaluates pitch scripts and speaking notes |
| Final Verdict | `finaljudge` (qwen3.5:27b) | Synthesizes all reports into a weighted score |

**Scoring** uses discrete values {0, 1, 3, 5} across five categories:

- Innovation & Creativity (20%)
- Technical Depth (15%)
- Impact & Usefulness (20%)
- Presentation & Demo (25%)
- Feasibility & Sustainability (20%)

## Quick Start

### Prerequisites

- [Docker](https://www.docker.com/products/docker-desktop/)
- [Ollama](https://ollama.com) installed and running locally
- NVIDIA GPU recommended (RTX 3090 or better)

### 1. Install the Models

```bash
git clone https://github.com/qjasonma/AI-Judge.git
cd AI-Judge
ollama create slidejudge -f models/ModelfileSlides
ollama create codejudge -f models/ModelfileCode
ollama create textjudge -f models/ModelfileText
ollama create finaljudge -f models/Modelfile
```

### 2. Start the App

```bash
docker compose up --build -d
```

Open [http://localhost:5000](http://localhost:5000), drag in a project folder, and hit Judge.

### Cloudflare Tunnel (Optional)

To expose the app publicly via Cloudflare Tunnel:

1. Add your tunnel token to `.env`:

```
CLOUDFLARE_TUNNEL_TOKEN=your_token_here
```

2. Start the app:

```bash
docker compose up --build -d
```

The tunnel starts automatically alongside the app.

## Manual Setup (Without Docker)

```bash
pip install -r backend/requirements.txt
python backend/server.py
```

## Project Structure

```
backend/
  server.py              Flask API + serves frontend (SSE streaming)
  judge_pipeline.py      4-stage LLM pipeline orchestration
  repo_extract.py        Code directory -> JSON (file tree + imports)
  pdf_extract.py         PDF/PPTX -> per-slide metadata + thumbnails
  video_extract.py       Video -> keyframes at 5s intervals
  requirements.txt
frontend/                Vanilla JS/HTML/CSS
models/                  Ollama Modelfiles with system prompts
tests/                   Integration tests
```

## Supported Input Formats

- **Code** — Any text-based source files
- **Presentations** — PDF, PPTX
- **Video** — MP4, MOV, WebM
- **Text** — Plain text pitch scripts or speaking notes
