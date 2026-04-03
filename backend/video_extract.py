"""
Video Demo Extractor
Extracts evenly spaced keyframes from a video file and formats them
 identically to a PDF extraction payload, allowing seamless integration 
 with the existing presentation slide AI pipeline.
"""

import cv2
import os
import base64
import math

def extract_video(video_path: str, interval_sec: int = 5) -> dict:
    """
    Extracts keyframes from a video file and returns a structure
    matching the PDF extraction JSON format.
    """
    if not os.path.exists(video_path):
        raise FileNotFoundError(f"Video file not found: {video_path}")

    filename = os.path.basename(video_path)
    file_size = os.path.getsize(video_path)

    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        raise ValueError("Could not open video file using OpenCV.")

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    duration_sec = total_frames / fps if fps > 0 else 0

    width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    
    # Extract 1 frame every interval_sec seconds
    if duration_sec <= 0:
        duration_sec = 1

    num_frames = int(duration_sec // interval_sec)
    if num_frames == 0:
        num_frames = 1  # Always extract at least 1 frame

    stride = int(fps * interval_sec)
    if stride <= 0:
        stride = 1
    
    slides = []
    
    for i in range(1, num_frames + 1):
        target_frame = int(i * stride)
        if target_frame >= total_frames:
            target_frame = total_frames - 1
            
        cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
        ret, frame = cap.read()
        
        if ret:
            # We must encode this frame exactly as a base64 PNG so Ollama Vision can read it.
            # OpenCV frames are in BGR format by default.
            _, buffer = cv2.imencode('.png', frame)
            b64_str = base64.b64encode(buffer).decode('ascii')
            
            # Calculate timestamp integer
            timestamp_sec = int(target_frame / fps) if fps > 0 else 0
            
            # Formatted exactly to mirror `extract_pdf` slides.
            slides.append({
                "slide": i,  # This acts as our consecutive "slide" number
                "source_file": filename,
                "timestamp_sec": timestamp_sec, # Extra context field
                "dimensions": {
                    "width_pt": width,
                    "height_pt": height,
                    "width_in": round(width/72, 2),
                    "height_in": round(height/72, 2),
                },
                "text_content": f"[Video Frame at {timestamp_sec} seconds]", # Placeholder
                "text_block_count": 0,
                "images": [],
                "image_count": 1,
                "links": [],
                "link_count": 0,
                "fonts": [],
                "thumbnail_b64": b64_str,
            })
            
    cap.release()

    return {
        "filename": filename,
        "file_size": file_size,
        "total_slides": len(slides),
        "metadata": {
            "title": filename,
            "creator": "OpenCV Video Extractor",
            "duration_sec": duration_sec,
            "fps": fps
        },
        "slides": slides,
    }
