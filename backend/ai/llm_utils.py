import os
import time
from collections import defaultdict

try:  # Prefer the new SDK if available
    from openai import OpenAI  # type: ignore
    _OPENAI_SDK = "new"
except Exception:  # pragma: no cover - environment dependent
    import openai  # type: ignore
    _OPENAI_SDK = "legacy"

# Optional Gemini support
try:  # pragma: no cover - env dependent
    import google.generativeai as genai  # type: ignore
    _GEMINI_AVAILABLE = True
except Exception:  # pragma: no cover
    _GEMINI_AVAILABLE = False


def get_openai_client():
    """Return an OpenAI client/module or None if no API key configured."""
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return None
    if _OPENAI_SDK == "new":
        return OpenAI(api_key=api_key)
    # legacy doesn't create a client instance; return module
    openai.api_key = api_key  # type: ignore
    return openai


def resolve_model(preferred: str | None) -> str:
    """Resolve model name with safe fallback order."""
    # Allow user override via env OPENAI_MODEL; else use function arg; else fallback list
    env_model = os.getenv("OPENAI_MODEL")
    candidates = [m for m in [env_model, preferred, "gpt-4o-mini", "gpt-3.5-turbo"] if m]
    # Return first non-empty candidate
    return candidates[0]


def chat_completion(client, messages, *, temperature=0.3, max_tokens=600, model: str | None = None):
    """Unified chat completion wrapper.

    Returns (content:str|None, usage:dict|None, error:str|None)
    """
    if not client:
        return None, None, "no_client"
    chosen_model = resolve_model(model)
    try:
        if _OPENAI_SDK == "new":
            resp = client.chat.completions.create(
                model=chosen_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = (resp.choices[0].message.content or "").strip()
            usage = getattr(resp, "usage", None)
            if usage:
                usage = {
                    "prompt_tokens": getattr(usage, "prompt_tokens", None),
                    "completion_tokens": getattr(usage, "completion_tokens", None),
                    "total_tokens": getattr(usage, "total_tokens", None),
                }
            return content, usage, None
        # legacy
        resp = client.ChatCompletion.create(  # type: ignore[attr-defined]
            model=chosen_model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
        )
        content = (resp["choices"][0]["message"]["content"] or "").strip()
        usage = resp.get("usage")
        return content, usage, None
    except Exception as e:  # pragma: no cover
        return None, None, str(e)


def gemini_completion(messages, *, temperature=0.3, max_tokens=600, model: str | None = None):
    """Fallback chat completion using Gemini if configured.

    Returns (content:str|None, usage:dict|None, error:str|None)
    """
    api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GEMNIUS_API_KEY")
    if not (_GEMINI_AVAILABLE and api_key):
        return None, None, "gemini_unavailable"
    try:
        genai.configure(api_key=api_key)
        # Use user-preferred model or default to a known working one (2.0-flash or 1.5-flash)
        model_name = model or os.getenv("GEMINI_MODEL") or "gemini-2.0-flash"
        # Flatten chat into a single prompt for simplicity
        parts = []
        for m in messages:
            role = m.get("role")
            content = m.get("content")
            if not content:
                continue
            if role == "system":
                parts.append(f"System: {content}")
            elif role == "user":
                parts.append(f"User: {content}")
            else:
                parts.append(str(content))
        prompt = "\n".join(parts)
        
        # Handle model fallback if 2.0 isn't found
        try:
            model_obj = genai.GenerativeModel(model_name)
            resp = model_obj.generate_content(prompt, generation_config={
                "temperature": float(temperature),
                "max_output_tokens": int(max_tokens),
            })
        except Exception:
            # Fallback to 1.5-flash if 2.0 fails
            model_obj = genai.GenerativeModel("gemini-1.5-flash")
            resp = model_obj.generate_content(prompt, generation_config={
                "temperature": float(temperature),
                "max_output_tokens": int(max_tokens),
            })

        text = (getattr(resp, "text", None) or "").strip()
        if not text and getattr(resp, "candidates", None):
            try:
                text = resp.candidates[0].content.parts[0].text  # type: ignore
            except Exception:
                text = ""
        usage = None
        return (text or None), usage, None
    except Exception as e:  # pragma: no cover
        return None, None, str(e)


def groq_completion(messages, *, temperature=0.3, max_tokens=600, model: str | None = None):
    """Chat completion using Groq (via OpenAI client compatibility)."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None, None, "groq_unavailable"
    
    try:
        # Use OpenAI client but pointing to Groq
        if _OPENAI_SDK == "new":
            client = OpenAI(api_key=api_key, base_url="https://api.groq.com/openai/v1")
            chosen_model = model or "llama3-70b-8192"
            resp = client.chat.completions.create(
                model=chosen_model,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
            )
            content = (resp.choices[0].message.content or "").strip()
            usage = getattr(resp, "usage", None)
            if usage:
                usage = {
                    "prompt_tokens": getattr(usage, "prompt_tokens", None),
                    "completion_tokens": getattr(usage, "completion_tokens", None),
                    "total_tokens": getattr(usage, "total_tokens", None),
                }
            return content, usage, None
        else:
            # Legacy openai lib doesn't support base_url easily in the same way for per-request
            # We'll skip legacy support for Groq to keep it simple, or user needs to upgrade
            return None, None, "groq_requires_new_openai_sdk"
    except Exception as e:
        return None, None, str(e)
