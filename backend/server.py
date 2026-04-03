"""
AI Judge – Backend Server
Receives uploaded code files from the frontend, processes them through
the repo_extract logic, and returns the structured JSON result.
"""

import os
import json
import mimetypes
import tempfile
import shutil
from flask import Flask, request, jsonify
from flask_cors import CORS

from repo_extract import detect_file_type, extract_imports, EXT_TYPE_MAP
from pdf_extract import extract_pdf
from video_extract import extract_video
from judge_pipeline import run_pipeline_streaming

# Serve the frontend from the frontend directory
FRONTEND_DIR = os.path.join(os.path.dirname(__file__), '..', 'frontend')

app = Flask(__name__, static_folder=FRONTEND_DIR, static_url_path='')
CORS(app)  # Allow the frontend to call us


@app.route('/')
def serve_index():
    return app.send_static_file('index.html')



@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})


@app.route('/api/extract', methods=['POST'])
def extract_code():
    """
    Expects a multipart/form-data POST with:
      - files[]: one or more code files (with relative paths in the field name)
      - Optional 'repo_name' field
    
    Returns the same JSON structure as repo_extract.codebase_to_json():
    {
      "repo_name": "...",
      "total_files": N,
      "files": [ { path, language, type, size, code, imports? }, ... ]
    }
    """
    if 'files[]' not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    uploaded_files = request.files.getlist('files[]')
    repo_name = request.form.get('repo_name', 'uploaded_project')

    # ── Process each file through the repo_extract logic ──────────
    all_files = []

    for uploaded in uploaded_files:
        # Get the relative path sent from frontend (stored in filename)
        rel_path = uploaded.filename or 'unknown'

        try:
            content = uploaded.read().decode('utf-8')
        except (UnicodeDecodeError, Exception):
            # Skip unreadable / binary files
            continue

        filename = os.path.basename(rel_path)
        file_type = detect_file_type(filename)
        imports = extract_imports(content, file_type)

        file_entry = {
            "path": rel_path,
            "language": file_type if file_type != 'other' else (
                mimetypes.guess_type(filename)[0] or 'unknown'
            ),
            "type": file_type,
            "size": len(content),
            "code": content,
        }

        if imports:
            file_entry["imports"] = imports

        all_files.append(file_entry)

    project_json = {
        "repo_name": repo_name,
        "total_files": len(all_files),
        "files": all_files,
    }

    return jsonify(project_json)


@app.route('/api/extract-pdf', methods=['POST'])
def extract_pdf_endpoint():
    """
    Expects a multipart/form-data POST with:
      - file: a single PDF file
    
    Returns structured JSON with per-slide info:
    {
      "filename": "...",
      "file_size": N,
      "total_slides": N,
      "metadata": { title, author, ... },
      "slides": [ { slide, dimensions, text_content, images, links, fonts, thumbnail_b64 }, ... ]
    }
    """
    if 'file' not in request.files:
        return jsonify({"error": "No PDF file uploaded"}), 400

    uploaded = request.files['file']
    filename = uploaded.filename or 'unknown.pdf'

    # Read the PDF bytes
    pdf_bytes = uploaded.read()

    if len(pdf_bytes) == 0:
        return jsonify({"error": "Empty file"}), 400

    try:
        result = extract_pdf(
            pdf_bytes=pdf_bytes,
            filename=filename,
            include_thumbnails=True
        )
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"PDF extraction failed: {str(e)}"}), 500


@app.route('/api/extract-video', methods=['POST'])
def handle_extract_video():
    """
    Receives an uploaded video (.mp4, .mov, etc.), saves to temp file,
    runs the OpenCV frame extraction, and returns JSON list of frames.
    """
    if 'file' not in request.files:
        return jsonify({"error": "No Video file uploaded"}), 400

    uploaded = request.files['file']
    filename = uploaded.filename or 'unknown.mp4'

    # Save to temp file
    temp_dir = tempfile.mkdtemp()
    temp_path = os.path.join(temp_dir, filename)
    
    try:
        uploaded.save(temp_path)
        result = extract_video(video_path=temp_path, interval_sec=5)
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": f"Video extraction failed: {str(e)}"}), 500
    finally:
        shutil.rmtree(temp_dir, ignore_errors=True)


@app.route('/api/extract-text', methods=['POST'])
def extract_text():
    """
    Expects multipart/form-data with files[].
    Returns: { "text_files": [ { filename, content }, ... ] }
    """
    if 'files[]' not in request.files:
        return jsonify({"error": "No files uploaded"}), 400

    uploaded_files = request.files.getlist('files[]')
    text_files = []

    for uploaded in uploaded_files:
        filename = os.path.basename(uploaded.filename or 'unknown.txt')
        try:
            content = uploaded.read().decode('utf-8', errors='ignore')
        except Exception:
            content = ''
        text_files.append({"filename": filename, "content": content})

    return jsonify({"text_files": text_files})


@app.route('/api/judge', methods=['POST'])
def judge_project():
    """
    Full AI judging pipeline — streams SSE events in real-time.
    
    Each event is a JSON object on its own SSE line:
      {"type": "stage",      "stage": "...", "message": "..."}
      {"type": "token",      "stage": "...", "text": "..."}
      {"type": "stage_done", "stage": "...", "data": {...}}
      {"type": "result",     "data": {...}}
    """
    from flask import Response, stream_with_context

    data = request.get_json()
    if not data:
        return jsonify({"error": "No JSON body provided"}), 400

    pdf_extraction = data.get("pdf_extraction")
    code_extraction = data.get("code_extraction")
    text_files = data.get("text_files", [])

    def generate():
        try:
            for event in run_pipeline_streaming(
                pdf_extraction=pdf_extraction,
                code_extraction=code_extraction,
                text_files=text_files,
            ):
                yield f"data: {json.dumps(event)}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    return Response(
        stream_with_context(generate()),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',
        }
    )


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    print(f"\nAI Judge backend running on http://localhost:{port}\n")
    app.run(host='0.0.0.0', port=port, debug=True)

