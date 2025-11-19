import os
import time
from collections import defaultdict
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import permissions
from rest_framework.authentication import BaseAuthentication
from .models import AIInteraction
from .video_utils import generate_short_video
from django.conf import settings
from .llm_utils import (
    get_openai_client,
    chat_completion,
    gemini_completion,
    groq_completion,
)

# Simple in-memory rate limit (best-effort; resets on process restart)
_RATE_STORE = defaultdict(list)  # key -> list[timestamps]
_RATE_LIMIT_PER_MINUTE = int(os.getenv("AI_RATE_LIMIT_PER_MINUTE", "30"))


def _rate_check(key: str):
    now = time.time()
    window_start = now - 60
    entries = _RATE_STORE[key]
    # prune old
    while entries and entries[0] < window_start:
        entries.pop(0)
    if len(entries) >= _RATE_LIMIT_PER_MINUTE:
        return False, len(entries)
    entries.append(now)
    return True, len(entries)


class AIAssistantView(APIView):
    """
    AI assistant endpoint.
    POST {"question": "..."}
    Returns {"answer": "..."}
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes: list[type[BaseAuthentication]] = []  # bypass JWT for public endpoint

    def post(self, request):
        question = (request.data.get("question") or "").strip()
        if not question:
            return Response({"detail": "question is required"}, status=400)

        # Rate limit by IP
        ip = request.META.get("REMOTE_ADDR", "unknown")
        allowed, count = _rate_check(f"ask:{ip}")
        if not allowed:
            return Response({"detail": "Rate limit exceeded. Please wait a minute."}, status=429)

        messages = [
            {"role": "system", "content": "You are a helpful tutor. Be concise and clear."},
            {"role": "user", "content": question},
        ]
        
        answer = None
        usage = None
        error = None
        provider = "none"
        
        # Priority 1: Groq (Fastest/User Requested)
        if not answer:
            g_text, g_usage, g_error = groq_completion(messages, temperature=0.3, max_tokens=600)
            if g_text:
                provider = "groq"
                answer, usage, error = g_text, g_usage, g_error
            else:
                error = g_error

        # Priority 2: Gemini (User Requested)
        if not answer:
            g_text, g_usage, g_error = gemini_completion(messages, temperature=0.3, max_tokens=600)
            if g_text:
                provider = "gemini"
                answer, usage, error = g_text, g_usage, g_error
            else:
                error = g_error

        # Priority 3: OpenAI (Original)
        if not answer:
            client = get_openai_client()
            if client:
                o_text, o_usage, o_error = chat_completion(client, messages, temperature=0.3, max_tokens=600)
                if o_text:
                    provider = "openai"
                    answer, usage, error = o_text, o_usage, o_error
                else:
                    error = o_error

        # Final deterministic fallback
        if not answer:
            provider = "fallback"
            bullet = "-"
            answer = (
                f"Here’s a concise overview to get you unstuck while the AI service is unavailable.\n\n"
                f"What is “{question}”?\n"
                f"{bullet} Definition: A clear, one-sentence description.\n"
                f"{bullet} Why it matters: The problem it solves or the benefit.\n"
                f"{bullet} Core ideas: 2–3 key principles or components.\n"
                f"{bullet} Quick example: A tiny example to make it concrete.\n"
                f"{bullet} Next steps: What to read or try next.\n\n"
                f"Tip: Re-try in a minute for a richer AI-generated answer."
            )

        # Persist interaction (best-effort)
        try:
            meta = {"mode": "ask", "provider": provider}
            if usage:
                meta["usage"] = usage
            if error:
                meta["error"] = error
            AIInteraction.objects.create(
                user=request.user if getattr(request, "user", None) and request.user.is_authenticated else None,
                question=question,
                response=answer,
                metadata=meta,
            )
        except Exception:
            pass

        payload = {"answer": answer}
        if getattr(settings, "DEBUG", False):
            payload["debug"] = {
                "error": error,
                "provider": provider,
                "has_groq_key": bool(os.getenv("GROQ_API_KEY")),
                "has_gemini_key": bool(os.getenv("GEMINI_API_KEY")),
                "has_openai_key": bool(os.getenv("OPENAI_API_KEY")),
            }
        return Response(payload)


class AIGenerateLessonView(APIView):
    """
    Generate a lesson with transcript (and a demo video url placeholder).
    POST {"topic": "..."}
    Returns {title, transcript, video_url}
    """
    permission_classes = [permissions.AllowAny]
    authentication_classes: list[type[BaseAuthentication]] = []  # bypass JWT for public endpoint

    def post(self, request):
        topic = (request.data.get("topic") or "").strip()
        if not topic:
            return Response({"detail": "topic is required"}, status=400)

        # Rate limit by IP
        ip = request.META.get("REMOTE_ADDR", "unknown")
        allowed, count = _rate_check(f"lesson:{ip}")
        if not allowed:
            return Response({"detail": "Rate limit exceeded. Please wait a minute."}, status=429)

        title = f"Introduction to {topic}"
        transcript = None
        video_url = "https://samplelib.com/lib/preview/mp4/sample-5s.mp4"

        prompt = (
            "Create a structured mini-lesson on the topic below. Use clear section headings, concise explanations, and bullet lists for key points. "
            "Keep it beginner-friendly. Respond in plain UTF-8 text only (no JSON). Topic: " + topic
        )

        messages = [
            {"role": "system", "content": "You are an expert course author writing structured lessons."},
            {"role": "user", "content": prompt},
        ]
        
        transcript = None
        usage = None
        error = None
        provider = "none"

                # Priority 1: Groq
        if not transcript:
            g_text, g_usage, g_error = groq_completion(messages, temperature=0.4, max_tokens=900)
            if g_text:
                provider = "groq"
                transcript, usage, error = g_text, g_usage, g_error
            else:
                error = g_error

        # Priority 2: Gemini
        if not transcript:
            g_text, g_usage, g_error = gemini_completion(messages, temperature=0.4, max_tokens=900)
            if g_text:
                provider = "gemini"
                transcript, usage, error = g_text, g_usage, g_error
            else:
                error = g_error

        # Priority 3: OpenAI
        if not transcript:
            client = get_openai_client()
            if client:
                o_text, o_usage, o_error = chat_completion(client, messages, temperature=0.4, max_tokens=900)
                if o_text:
                    provider = "openai"
                    transcript, usage, error = o_text, o_usage, o_error
                else:
                    error = o_error

        # Final deterministic fallback
        if not transcript:
            provider = "fallback"
            transcript = (
                f"{title}\n\n"
                f"1) Overview\n   - What it is and why it matters.\n"
                f"2) Key Concepts\n   - Concept A\n   - Concept B\n   - Concept C\n"
                f"3) Simple Example\n   - A tiny, concrete example to illustrate the idea.\n"
                f"4) Summary & Next Steps\n   - Recap the essentials and suggest what to try next."
            )

        # Persist interaction (best-effort)
        try:
            meta = {"title": title, "video_url": video_url, "mode": "generate_lesson", "provider": provider}
            if usage:
                meta["usage"] = usage
            if error:
                meta["error"] = error
            AIInteraction.objects.create(
                user=request.user if getattr(request, "user", None) and request.user.is_authenticated else None,
                question=f"generate_lesson:{topic}",
                response=transcript,
                metadata=meta,
            )
        except Exception:
            pass

        # Attempt to generate a short video clip using transcript
        try:
            clip_text = f"{title}\n" + (transcript.strip().split("\n\n")[0] if transcript else "")
            url, v_err = generate_short_video(clip_text or title, subfolder="ai_lessons", filename_prefix=title.replace(" ", "_")[:40], seconds=8)
            if url:
                video_url = url
        except Exception:
            v_err = "video_generation_failed"

        payload = {
            "title": title,
            "transcript": transcript,
            "video_url": video_url,
        }
        if getattr(settings, "DEBUG", False):
            payload["debug"] = {
                "error": error,
                "provider": provider,
                "video_error": locals().get("v_err"),
                "has_groq_key": bool(os.getenv("GROQ_API_KEY")),
                "has_gemini_key": bool(os.getenv("GEMINI_API_KEY")),
            }
        return Response(payload)
