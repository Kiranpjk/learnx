import os
import io
import uuid
from pathlib import Path
from typing import Optional, Tuple

from django.conf import settings
from PIL import Image, ImageDraw, ImageFont

try:
    from openai import OpenAI  # type: ignore
    _OPENAI_TTS_AVAILABLE = True
except Exception:  # pragma: no cover
    _OPENAI_TTS_AVAILABLE = False


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def _wrap_text(draw: ImageDraw.ImageDraw, text: str, font: ImageFont.FreeTypeFont, max_width: int) -> str:
    words = text.split()
    lines = []
    cur = []
    for w in words:
        test = " ".join(cur + [w])
        w_width, _ = draw.textbbox((0, 0), test, font=font)[2:]
        if w_width <= max_width:
            cur.append(w)
        else:
            if cur:
                lines.append(" ".join(cur))
            cur = [w]
    if cur:
        lines.append(" ".join(cur))
    return "\n".join(lines)


def _render_text_image(text: str, width: int = 1280, height: int = 720) -> Image.Image:
    bg_color = (18, 18, 22)
    fg_color = (240, 240, 245)
    accent = (139, 92, 246)
    im = Image.new("RGB", (width, height), bg_color)
    draw = ImageDraw.Draw(im)
    try:
        # Try a common font; Pillow ships with DejaVu
        title_font = ImageFont.truetype("DejaVuSans-Bold.ttf", 64)
        body_font = ImageFont.truetype("DejaVuSans.ttf", 38)
    except Exception:
        title_font = ImageFont.load_default()
        body_font = ImageFont.load_default()

    # Title - first line of text
    lines = text.strip().splitlines()
    title = lines[0][:90] if lines else "Lesson"
    body = " ".join(lines[1:]) if len(lines) > 1 else ""
    # Bounding boxes
    title_w, title_h = draw.textbbox((0, 0), title, font=title_font)[2:]
    title_x = (width - title_w) // 2
    title_y = height // 4 - title_h // 2
    # Accent underline
    underline_y = title_y + title_h + 12
    draw.text((title_x, title_y), title, fill=fg_color, font=title_font)
    draw.rectangle([(width * 0.2, underline_y), (width * 0.8, underline_y + 6)], fill=accent)

    if body:
        max_body_width = int(width * 0.7)
        wrapped = _wrap_text(draw, body[:500], body_font, max_body_width)
        body_w, body_h = draw.multiline_textbbox((0, 0), wrapped, font=body_font, spacing=6)[2:]
        body_x = (width - body_w) // 2
        body_y = underline_y + 40
        draw.multiline_text((body_x, body_y), wrapped, fill=fg_color, font=body_font, spacing=6, align="center")
    return im


def _synthesize_tts_openai(text: str, voice: str = "alloy") -> Tuple[Optional[bytes], Optional[str]]:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key or not _OPENAI_TTS_AVAILABLE:
        return None, "openai_tts_unavailable"
    try:
        client = OpenAI(api_key=api_key)
        # Prefer gpt-4o-mini-tts if available; fallback to tts-1
        model = os.getenv("OPENAI_TTS_MODEL", "gpt-4o-mini-tts")
        # Non-streaming response; the SDK exposes output as bytes via .content
        resp = client.audio.speech.create(model=model, voice=voice, input=text)  # type: ignore[attr-defined]
        audio_bytes = getattr(resp, "content", None)
        if isinstance(audio_bytes, (bytes, bytearray)):
            return bytes(audio_bytes), None
        # Some versions support streaming only
        try:
            buf = io.BytesIO()
            with client.audio.speech.with_streaming_response.create(model=model, voice=voice, input=text) as r:  # type: ignore[attr-defined]
                r.stream_to_file(buf)
            return buf.getvalue(), None
        except Exception:
            return None, "openai_tts_stream_fail"
    except Exception as e:  # pragma: no cover
        return None, str(e)


def generate_short_video(text: str, subfolder: str, filename_prefix: str, seconds: int = 8) -> Tuple[Optional[str], Optional[str]]:
    """Generate a short MP4 video with optional AI TTS.

    Returns (media_url, error)
    """
    # Lazy import moviepy to avoid heavy import when not used
    try:
        # moviepy 2.x exposes classes at top-level
        from moviepy import ImageClip, AudioFileClip  # type: ignore
    except Exception as e:  # pragma: no cover
        return None, f"moviepy_import_error:{e}"

    media_root = Path(settings.MEDIA_ROOT)
    out_dir = media_root / "videos" / subfolder
    _ensure_dir(out_dir)
    uid = uuid.uuid4().hex[:8]
    base = f"{filename_prefix}_{uid}"
    img_path = out_dir / f"{base}.png"
    audio_path = out_dir / f"{base}.mp3"
    video_path = out_dir / f"{base}.mp4"

    # Build background image
    try:
        im = _render_text_image(text)
        im.save(img_path)
    except Exception as e:
        return None, f"image_render_error:{e}"

    # Try TTS with OpenAI; if it fails, continue with silent video
    audio_bytes, tts_err = _synthesize_tts_openai(text)
    if audio_bytes:
        try:
            with open(audio_path, "wb") as f:
                f.write(audio_bytes)
        except Exception as e:
            tts_err = f"audio_write_error:{e}"
            audio_path = None  # type: ignore
    else:
        audio_path = None  # type: ignore

    try:
        clip = ImageClip(str(img_path)).with_duration(seconds)
        if audio_path and audio_path.exists():  # type: ignore
            audio = AudioFileClip(str(audio_path))
            # Adjust duration to audio length if longer
            dur = max(seconds, float(getattr(audio, "duration", seconds) or seconds))
            clip = clip.with_duration(dur).with_audio(audio)
        # Ensure output dir exists and write file
        try:
            clip.write_videofile(str(video_path), fps=24, codec="libx264", audio_codec="aac", bitrate="1200k")
        except Exception:
            # Fallback to a more widely available codec
            clip.write_videofile(str(video_path), fps=24, codec="mpeg4", audio_codec="aac", bitrate="1200k")
    except Exception as e:
        return None, f"video_write_error:{e}"
    finally:
        try:
            clip.close()  # type: ignore
        except Exception:
            pass

    rel = video_path.relative_to(media_root)
    url = f"{settings.MEDIA_URL}{str(rel).replace('\\\\', '/').replace('\\', '/')}"
    # Keep artifacts to be re-used; caller may clean older ones if needed
    return url, tts_err
