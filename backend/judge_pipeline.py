"""
AI Judge – Full Judging Pipeline (Streaming)
Orchestrates three analysis stages, yielding SSE events token-by-token.

Pipeline:
  1. Slide Analysis  →  slidejudge    (ModelfileSlides,  base: qwen3-vl:8b)
  2. Code Analysis   →  codejudge     (ModelfileCode,    base: qwen3.5:9b)
  3. Text Summary    →  textjudge     (ModelfileText,    base: qwen3.5:9b)
  4. Final Verdict   →  finaljudge    (Modelfile,        base: qwen3.5:27b)

All analysis functions are generators that yield event dicts:
  {"type": "stage",    "stage": "...", "message": "..."}
  {"type": "token",    "stage": "...", "text": "..."}
  {"type": "stage_done", "stage": "...", "data": {...}}
  {"type": "result",   "data": {...}}
  {"type": "error",    "message": "..."}
"""

import json
import re
import base64
import tempfile
import os
from ollama import Client

OLLAMA = Client(host=os.environ.get("OLLAMA_HOST", "http://localhost:11434"))

# ── Model config ─────────────────────────────────────────────────────────────
# Each model has its system prompt baked in via its own Modelfile.
# Build with: ollama create <name> -f <Modelfile>
SLIDE_MODEL  = "slidejudge:latest"   # ModelfileSlides  (base: qwen3-vl:8b)
CODE_MODEL   = "codejudge:latest"    # ModelfileCode    (base: qwen3.5:9b)
TEXT_MODEL   = "textjudge:latest"    # ModelfileText    (base: qwen3.5:9b)
JUDGE_MODEL  = "finaljudge:latest"   # Modelfile        (base: qwen3.5:27b)


# ── Helpers ──────────────────────────────────────────────────────────────────

def extract_response(text: str) -> dict:
    """
    Parse model output, preserving both reasoning and the JSON result.
    Returns: { "reasoning": str, "parsed": dict }
    """
    reasoning = ""
    think_match = re.search(r"<think>(.*?)</think>", text, flags=re.DOTALL)
    if think_match:
        reasoning = think_match.group(1).strip()

    cleaned = re.sub(r"<think>.*?</think>", "", text, flags=re.DOTALL).strip()

    if not reasoning:
        json_start = cleaned.find("{")
        if json_start > 0:
            reasoning = cleaned[:json_start].strip()

    json_text = re.sub(r"```(?:json)?\s*", "", cleaned).strip().rstrip("`").strip()
    match = re.search(r"\{.*\}", json_text, re.DOTALL)
    if match:
        json_text = match.group(0)
    try:
        parsed = json.loads(json_text)
    except Exception:
        parsed = {"parse_error": True, "raw_text": text}
        if not reasoning:
            reasoning = "⚠️ JSON Decode Error ⚠️\n\nThe AI failed to output valid formatting. Raw Output:\n\n" + text

    return {"reasoning": reasoning, "parsed": parsed}


VALID_SCORES = {0, 1, 3, 5}
WEIGHTS = {
    "innovation_creativity": 0.20,
    "technical_depth": 0.15,
    "impact_usefulness": 0.20,
    "presentation_demo": 0.25,
    "feasibility_sustainability": 0.20,
}

def clamp_scores(parsed: dict) -> dict:
    """
    Ensure every category score is within 0-5 and snap to nearest valid value.
    Recalculate final_weighted_score from the clamped values.
    """
    scores = parsed.get("scores", {})
    if not scores:
        return parsed

    for key in WEIGHTS:
        raw = scores.get(key)
        if isinstance(raw, (int, float)):
            clamped = max(0, min(5, int(round(raw))))
            # Snap to nearest valid discrete value {0, 1, 3, 5}
            nearest = min(VALID_SCORES, key=lambda v: abs(v - clamped))
            scores[key] = nearest

    # Recalculate weighted score from the clamped values
    weighted = sum(scores.get(k, 0) * w for k, w in WEIGHTS.items())
    parsed["scores"] = scores
    parsed["final_weighted_score"] = round(weighted, 2)
    return parsed


def stream_chat(model, messages, stage_name):
    """
    Stream an ollama chat call, yielding token events.
    Returns the full accumulated text after streaming completes.
    """
    full_text = ""
    stream = OLLAMA.chat(model=model, messages=messages, stream=True)

    in_reasoning = False
    for chunk in stream:
        msg = chunk.message
        token = msg.content or ""
        thinking_token = getattr(msg, "thinking", "") or ""

        chunk_text = ""
        if thinking_token:
            if not in_reasoning:
                in_reasoning = True
                chunk_text += "<think>\n"
            chunk_text += thinking_token

        if token:
            if in_reasoning:
                in_reasoning = False
                chunk_text += "\n</think>\n"
            chunk_text += token

        if chunk_text:
            full_text += chunk_text
            yield {"type": "token", "stage": stage_name, "text": chunk_text}

    if in_reasoning:
        full_text += "\n</think>\n"
        yield {"type": "token", "stage": stage_name, "text": "\n</think>\n"}

    return full_text


# ── Stage 1: Slide Analysis ─────────────────────────────────────────────────

def stream_single_slide(slide_data: dict, slide_num: int, total: int):
    """Generator: analyze one slide with vision model, yielding tokens then a slide_done event."""
    context = {k: v for k, v in slide_data.items() if k != "thumbnail_b64"}
    slide_json_str = json.dumps(context, indent=2)
    # /no_think disables reasoning on qwen3-vl so output arrives immediately
    prompt = (
        f"/no_think\n"
        f"Analyze slide {slide_num} of {total}. "
        f"Return ONLY a JSON object with keys: slide_number, layout, visual_elements (list), "
        f"text_summary, design_quality (excellent/good/fair/poor), notes.\n\n"
        f"{slide_json_str}"
    )

    thumbnail_b64 = slide_data.get("thumbnail_b64")
    stage_name = f"slide_{slide_num}"
    full_text = ""

    tmp_path = None
    try:
        if thumbnail_b64:
            with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp:
                tmp_path = tmp.name
                tmp.write(base64.b64decode(thumbnail_b64))

        msg = {"role": "user", "content": prompt}
        if tmp_path:
            msg["images"] = [tmp_path]

        # No format="json" — conflicts with vision output on qwen3-vl and causes hangs.
        # /no_think + explicit instruction keeps output fast and parseable.
        stream = OLLAMA.chat(
            model=SLIDE_MODEL,
            messages=[msg],
            stream=True,
        )

        for chunk in stream:
            token = chunk.message.content or ""
            if token:
                full_text += token
                yield {"type": "token", "stage": stage_name, "text": token}

    except Exception as e:
        yield {"type": "error", "message": f"Slide {slide_num} error: {e}"}
        full_text = full_text or "{}"
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.remove(tmp_path)

    result = extract_response(full_text)
    if result["parsed"].get("parse_error"):
        result["parsed"]["slide_number"] = slide_num

    yield {"type": "slide_done", "slide": slide_num, "data": result}


# ── Stage 2: Code Analysis ──────────────────────────────────────────────────

def stream_code_analysis(code_extraction: dict):
    """Generator: analyze code, yielding tokens. Yields stage_done at end."""
    # Send only structure (path, language, size, imports) — no code body.
    # This keeps the payload small enough for the 9b model to handle reliably.
    files_summary = []
    for f in code_extraction.get("files", []):
        entry = {
            "path": f.get("path"),
            "language": f.get("language"),
            "size": f.get("size"),
        }
        if f.get("imports"):
            entry["imports"] = f["imports"]
        files_summary.append(entry)

    summary = {
        "repo_name": code_extraction.get("repo_name", "unknown"),
        "total_files": code_extraction.get("total_files", 0),
        "files": files_summary,
    }

    prompt = f"""/no_think
Analyze this hackathon project and return ONLY a valid JSON object with no extra text.

{json.dumps(summary, indent=2)}

Return JSON with these exact keys: project_name, languages_used (list), architecture_summary, technical_highlights (list), technical_concerns (list), code_quality (excellent/good/fair/poor), completeness (complete/mostly_complete/partial/minimal), complexity_level (advanced/intermediate/basic)."""

    full_text = ""
    stream = OLLAMA.chat(
        model=CODE_MODEL,
        messages=[{"role": "user", "content": prompt}],
        stream=True,
    )

    for chunk in stream:
        token = chunk.message.content or ""
        if token:
            full_text += token
            yield {"type": "token", "stage": "code", "text": token}

    result = extract_response(full_text)
    yield {"type": "stage_done", "stage": "code", "data": result}


# ── Stage 3: Text / Speaking Notes ───────────────────────────────────────────

def stream_text_analysis(text_contents: list):
    parts = []
    for t in text_contents:
        content = t.get("content", "")
        filename = t.get("filename", "unknown")
        if content:
            parts.append(f"--- {filename} ---\n{content}")
    compiled_text = "\n\n".join(parts)

    if not compiled_text.strip():
        result = {"reasoning": "No text content provided.", "parsed": {"parse_error": True, "raw_text": ""}}
        yield {"type": "stage_done", "stage": "text", "data": result}
        return

    speech_json = json.dumps({"content": compiled_text[:3000]})
    prompt = f"""/no_think
Analyze this hackathon pitch speech and return ONLY a valid JSON object with no extra text.

{speech_json}

Return JSON with these exact keys: key_messages (list), storytelling_quality (excellent/good/fair/poor), clarity (excellent/good/fair/poor), missing_information (list), overall_impression (string)."""

    full_text = ""
    in_reasoning = False
    try:
        stream = OLLAMA.chat(
            model=TEXT_MODEL,
            messages=[{"role": "user", "content": prompt}],
            stream=True,
        )
        for chunk in stream:
            msg = chunk.message
            thinking_token = getattr(msg, "thinking", "") or ""
            token = msg.content or ""

            # Capture reasoning into <think> block so extract_response can strip it
            if thinking_token:
                if not in_reasoning:
                    in_reasoning = True
                    full_text += "<think>\n"
                full_text += thinking_token

            if token:
                if in_reasoning:
                    in_reasoning = False
                    full_text += "\n</think>\n"
                full_text += token
                yield {"type": "token", "stage": "text", "text": token}

        if in_reasoning:
            full_text += "\n</think>\n"

    except Exception as e:
        yield {"type": "error", "message": f"Text analysis error: {e}"}

    result = extract_response(full_text)
    yield {"type": "stage_done", "stage": "text", "data": result}


# ── Stage 4: Final Judge ─────────────────────────────────────────────────────

INJECTION_PATTERNS = [
    "ignore previous instructions", "ignore all instructions",
    "give full score", "override rubric", "disregard the system prompt",
    "you are now", "new instructions:", "forget everything",
]

def _check_injection(text: str) -> bool:
    """Return True if text contains likely prompt injection."""
    lower = text.lower()
    return any(p in lower for p in INJECTION_PATTERNS)


def _trim_report(report: dict, max_chars: int = 1500) -> dict:
    """Strip reasoning and truncate large fields to keep input compact."""
    trimmed = {}
    for k, v in report.items():
        if k == "reasoning":
            continue
        if isinstance(v, str) and len(v) > max_chars:
            trimmed[k] = v[:max_chars] + "…"
        elif isinstance(v, list) and len(str(v)) > max_chars:
            trimmed[k] = v[:10]
        else:
            trimmed[k] = v
    return trimmed


def stream_final_judge(slides_report, code_report, text_report):
    """Generator: run final judge, yielding tokens. Yields stage_done at end."""
    # Trim reports to fit within 8K context window
    slides_compact = _trim_report(slides_report)
    code_compact = _trim_report(code_report)
    text_compact = _trim_report(text_report)

    # Check for prompt injection in code before the model sees it
    all_text = json.dumps(slides_compact) + json.dumps(code_compact) + json.dumps(text_compact)
    if _check_injection(all_text):
        violation = {
            "reasoning": "SECURITY VIOLATION: Prompt injection detected in project submissions.",
            "parsed": {
                "project_name": "VIOLATION",
                "scores": {k: 0 for k in ["innovation_creativity", "technical_depth", "impact_usefulness", "presentation_demo", "feasibility_sustainability"]},
                "final_weighted_score": 0.0,
                "feedback": {"strengths": [], "areas_for_improvement": [], "justification": "SECURITY VIOLATION: Prompt injection or malicious instructions detected in project submissions."},
            }
        }
        yield {"type": "stage_done", "stage": "judge", "data": violation}
        return

    user_prompt = f"""Here are the three analyst reports for this hackathon project:

## 1. Slides & Presentation Analysis
{json.dumps(slides_compact, indent=2)}

## 2. Code & Workflow Analysis
{json.dumps(code_compact, indent=2)}

## 3. Speaking & Delivery Summary
{json.dumps(text_compact, indent=2)}

Evaluate this project and return the JSON verdict."""

    full_text = ""
    # No format="json" — qwen3 silently disables thinking when format=json is set.
    # think="low" keeps reasoning brief so the 27b model finishes faster.
    stream = OLLAMA.chat(
        model=JUDGE_MODEL,
        messages=[{"role": "user", "content": user_prompt}],
        stream=True,
        think=True,
    )

    in_thinking = False
    pending = ""

    for chunk in stream:
        msg = chunk.message
        # Ollama SDK exposes reasoning in the 'thinking' field
        thinking_field = getattr(msg, "thinking", "") or ""
        if thinking_field:
            yield {"type": "reasoning_token", "stage": "judge", "text": thinking_field}

        token = msg.content or ""
        if not token:
            continue

        full_text += token
        pending += token

        # Detect <think>…</think> tags in content (fallback for models that
        # embed reasoning in content instead of the dedicated field)
        while pending:
            if in_thinking:
                close_idx = pending.find("</think>")
                if close_idx != -1:
                    chunk_reason = pending[:close_idx]
                    if chunk_reason:
                        yield {"type": "reasoning_token", "stage": "judge", "text": chunk_reason}
                    pending = pending[close_idx + len("</think>"):]
                    in_thinking = False
                else:
                    if len(pending) > 8:
                        safe, pending = pending[:-8], pending[-8:]
                        if safe:
                            yield {"type": "reasoning_token", "stage": "judge", "text": safe}
                    break
            else:
                open_idx = pending.find("<think>")
                if open_idx != -1:
                    before = pending[:open_idx]
                    if before.strip():
                        yield {"type": "token", "stage": "judge", "text": before}
                    pending = pending[open_idx + len("<think>"):]
                    in_thinking = True
                else:
                    if len(pending) > 7:
                        safe, pending = pending[:-7], pending[-7:]
                        if safe.strip():
                            yield {"type": "token", "stage": "judge", "text": safe}
                    break

    # Flush remaining buffer
    if pending:
        if in_thinking:
            yield {"type": "reasoning_token", "stage": "judge", "text": pending}
        elif pending.strip():
            yield {"type": "token", "stage": "judge", "text": pending}

    result = extract_response(full_text)
    # Clamp scores to valid range as a safety net
    if result.get("parsed") and not result["parsed"].get("parse_error"):
        result["parsed"] = clamp_scores(result["parsed"])
    yield {"type": "stage_done", "stage": "judge", "data": result}


# ── Full Streaming Pipeline ─────────────────────────────────────────────────

def run_pipeline_streaming(
    pdf_extraction: dict = None,
    code_extraction: dict = None,
    text_files: list = None,
):
    """
    Generator that yields SSE events for the entire judging pipeline.
    Each yield is a dict that gets JSON-serialized as an SSE event.
    """

    slides_report = {"note": "No presentation slides provided."}
    code_report   = {"note": "No code files provided."}
    text_report   = {"note": "No text files provided."}

    # ── Stage 1: Slides ───────────────────────────────────────────
    if pdf_extraction and pdf_extraction.get("slides"):
        slides = pdf_extraction["slides"]
        total = len(slides)

        yield {"type": "stage", "stage": "slides",
               "message": f"Stage 1/4: Analyzing {total} presentation slides..."}

        slide_analyses = []
        for i, slide in enumerate(slides):
            slide_num = slide.get("slide", i + 1)
            yield {"type": "stage", "stage": f"slide_{slide_num}",
                   "message": f"Analyzing slide {slide_num}/{total}..."}

            slide_result = None
            for event in stream_single_slide(slide, slide_num, total):
                if event["type"] == "slide_done":
                    slide_result = event["data"]
                else:
                    yield event  # forward tokens and errors, keep going regardless

            if slide_result:
                slide_analyses.append({"slide": slide_num, "analysis": slide_result})

        slides_report = {
            "filename": pdf_extraction.get("filename", "unknown.pdf"),
            "total_slides": total,
            "metadata": pdf_extraction.get("metadata", {}),
            "slide_analyses": slide_analyses,
        }
        yield {"type": "stage_done", "stage": "slides", "data": {"total_slides": total}}
    else:
        yield {"type": "stage", "stage": "slides",
               "message": "Stage 1/4: No slides to analyze, skipping..."}

    # ── Stage 2: Code ─────────────────────────────────────────────
    if code_extraction and code_extraction.get("files"):
        yield {"type": "stage", "stage": "code",
               "message": f"Stage 2/4: Analyzing {code_extraction.get('total_files', 0)} code files..."}

        for event in stream_code_analysis(code_extraction):
            if event["type"] == "stage_done":
                code_report = event["data"]
            yield event
    else:
        yield {"type": "stage", "stage": "code",
               "message": "Stage 2/4: No code files to analyze, skipping..."}

    # ── Stage 3: Text ─────────────────────────────────────────────
    if text_files:
        yield {"type": "stage", "stage": "text",
               "message": "Stage 3/4: Analyzing speaking notes/text..."}

        for event in stream_text_analysis(text_files):
            if event["type"] == "stage_done":
                text_report = event["data"]
            yield event
    else:
        yield {"type": "stage", "stage": "text",
               "message": "Stage 3/4: No text files to analyze, skipping..."}

    # ── Stage 4: Final Judge ───────────────────────────────────────
    yield {"type": "stage", "stage": "judge",
           "message": "Stage 4/4: Running final judge model..."}

    verdict = None
    for event in stream_final_judge(slides_report, code_report, text_report):
        if event["type"] == "stage_done":
            verdict = event["data"]
        yield event

    # ── Final result ───────────────────────────────────────────────
    yield {"type": "result", "data": {
        "slides_report": slides_report,
        "code_report": code_report,
        "text_analysis": text_report,
        "verdict": verdict,
    }}
