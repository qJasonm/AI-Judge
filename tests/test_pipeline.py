"""
Quick pipeline test using the DataSet/Presence AI sample data.
Run with: python test_pipeline.py
"""
import sys, os, json
sys.path.insert(0, os.path.dirname(__file__))

from repo_extract import codebase_to_json, detect_file_type, extract_imports, EXT_TYPE_MAP
from judge_pipeline import run_pipeline_streaming

REPO_PATH  = r"D:\Code\AI Judge\DataSet\Presence AI\HackCU_presence_ai-main\HackCU_presence_ai-main"
SPEECH_TXT = r"D:\Code\AI Judge\DataSet\Presence AI\speech.txt"

# ── Extract code ──────────────────────────────────────────────
print("Extracting code files...")
exclude = {'.git', '__pycache__', 'node_modules', '.venv'}
files = []
for root, dirs, filenames in os.walk(REPO_PATH):
    dirs[:] = [d for d in dirs if d not in exclude]
    for fname in filenames:
        path = os.path.join(root, fname)
        rel  = os.path.relpath(path, REPO_PATH)
        try:
            with open(path, encoding='utf-8', errors='ignore') as f:
                content = f.read()
        except Exception:
            continue
        ftype   = detect_file_type(fname)
        imports = extract_imports(content, ftype)
        entry   = {"path": rel, "language": ftype, "type": ftype,
                   "size": len(content), "code": content}
        if imports:
            entry["imports"] = imports
        files.append(entry)

code_extraction = {
    "repo_name": os.path.basename(REPO_PATH),
    "total_files": len(files),
    "files": files,
}
print(f"  -> {len(files)} files extracted")

# ── Read speech text ──────────────────────────────────────────
text_files = []
if os.path.exists(SPEECH_TXT):
    with open(SPEECH_TXT, encoding='utf-8', errors='ignore') as f:
        text_files = [{"filename": "speech.txt", "content": f.read()}]
    print("  -> speech.txt loaded")

# ── Run pipeline ──────────────────────────────────────────────
print("\nRunning pipeline...\n")
for event in run_pipeline_streaming(
    pdf_extraction=None,
    code_extraction=code_extraction,
    text_files=text_files,
):
    t = event.get("type")
    if t == "stage":
        print(f"\n[STAGE] {event.get('message')}")
    elif t == "token":
        txt = event.get("text", "")
        print(txt.encode("ascii", "replace").decode(), end="", flush=True)
    elif t == "reasoning_token":
        pass  # skip reasoning in terminal output
    elif t == "stage_done":
        print(f"\n[DONE]  stage={event.get('stage')}")
    elif t == "result":
        print("\n\n=== FINAL RESULT ===")
        data = event.get("data", {})
        verdict = (data.get("verdict") or {})
        parsed  = verdict.get("parsed") or verdict
        print(json.dumps(parsed, indent=2))
    elif t == "error":
        print(f"\n[ERROR] {event.get('message')}")
