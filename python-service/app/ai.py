"""AI analysis layer with swappable providers.

The scorer finds the opportunities; the AI explains them: what the app
does well, where the market gap is, and what a better version would
look like. Providers are interchangeable -- start free, upgrade later.

Set GEMINI_API_KEY in the environment (free at https://aistudio.google.com),
or GROVE_API_KEY for the PGS Grove OpenAI-compatible gateway
(optionally GROVE_MODEL to pick the model, default deepseek-v4.1-flash).
Without a key, the NullProvider returns a placeholder so the rest of the
pipeline keeps working.
"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

GROVE_URL = "https://api.pgsgrove.com/v1/chat/completions"
GROVE_MODEL = os.environ.get("GROVE_MODEL", "deepseek-v4.1-flash")

ANALYSIS_PROMPT = """\
You are a mobile-app market analyst. Analyze this Google Play Store app as
a business opportunity for someone who might build a better competing app.

App: {title} ({app_id})
Category: {genre}
Rating: {rating}/5 from {reviews} reviews
Installs: {installs}
Opportunity score: {opportunity}/100 (quality {q}, gap {g}, market {m}, competition {c})
Description excerpt: {description}

Reply in exactly this JSON shape (no markdown, no extra text):
{{
  "summary": "2-3 sentences on what the app is and why it is underrated",
  "strengths": ["bullet 1", "bullet 2", "bullet 3"],
  "weaknesses": ["bullet 1", "bullet 2"],
  "opportunity": "2-3 sentences on the market gap and who would pay for a better version",
  "build_plan": ["concrete feature 1", "concrete feature 2", "concrete feature 3"],
  "monetization": "one sentence on how the better version makes money"
}}"""


class AIProvider:
    name = "null"

    def analyze(self, scored: dict, detail: dict) -> dict:
        raise NotImplementedError


class NullProvider(AIProvider):
    """Placeholder used when no API key is configured."""

    name = "null"

    def analyze(self, scored: dict, detail: dict) -> dict:
        return {
            "provider": "null",
            "note": "Set GEMINI_API_KEY to enable AI analysis.",
            "summary": f"{scored['title']}: opportunity {scored['opportunity']}/100.",
        }


class GeminiProvider(AIProvider):
    """Google Gemini free tier via the REST API."""

    name = "gemini"

    def __init__(self, api_key: str | None = None):
        self.api_key = api_key or os.environ.get("GEMINI_API_KEY", "")

    def analyze(self, scored: dict, detail: dict) -> dict:
        import requests

        b = scored["breakdown"]
        prompt = ANALYSIS_PROMPT.format(
            title=scored["title"],
            app_id=scored["appId"],
            genre=scored.get("genre") or "unknown",
            rating=scored["rating"],
            reviews=scored["reviews"],
            installs=scored.get("installs") or "unknown",
            opportunity=scored["opportunity"],
            q=b["quality"], g=b["gap"], m=b["market"], c=b["competition"],
            description=str(detail.get("description") or "")[:1500],
        )
        try:
            resp = requests.post(
                GEMINI_URL,
                params={"key": self.api_key},
                json={"contents": [{"parts": [{"text": prompt}]}],
                      "generationConfig": {"temperature": 0.4}},
                timeout=60,
            )
            resp.raise_for_status()
            data = resp.json()
            text = data["candidates"][0]["content"]["parts"][0]["text"]
            # Strip accidental markdown fences.
            text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            out = json.loads(text)
            out["provider"] = "gemini"
            return out
        except Exception as exc:  # noqa: BLE001
            logger.warning("gemini analysis failed: %s", exc)
            return {"provider": "gemini", "error": str(exc)}


class GroveProvider(AIProvider):
    """PGS Grove OpenAI-compatible gateway (set GROVE_API_KEY)."""

    name = "grove"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("GROVE_API_KEY", "")
        self.model = model or GROVE_MODEL

    def analyze(self, scored: dict, detail: dict) -> dict:
        import requests

        b = scored["breakdown"]
        prompt = ANALYSIS_PROMPT.format(
            title=scored["title"],
            app_id=scored["appId"],
            genre=scored.get("genre") or "unknown",
            rating=scored["rating"],
            reviews=scored["reviews"],
            installs=scored.get("installs") or "unknown",
            opportunity=scored["opportunity"],
            q=b["quality"], g=b["gap"], m=b["market"], c=b["competition"],
            description=str(detail.get("description") or "")[:1500],
        )
        try:
            resp = requests.post(
                GROVE_URL,
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    # Cloudflare blocks default python clients (error 1010).
                    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
                },
                json={
                    "model": self.model,
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 1024,
                    "temperature": 0.4,
                },
                timeout=90,
            )
            resp.raise_for_status()
            text = resp.json()["choices"][0]["message"]["content"]
            text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            out = json.loads(text)
            out["provider"] = "grove"
            out["model"] = self.model
            return out
        except Exception as exc:  # noqa: BLE001
            logger.warning("grove analysis failed: %s", exc)
            return {"provider": "grove", "error": str(exc)}


def get_provider() -> AIProvider:
    """Grove when its key is configured, else Gemini, else the null placeholder."""
    if os.environ.get("GROVE_API_KEY"):
        return GroveProvider()
    if os.environ.get("GEMINI_API_KEY"):
        return GeminiProvider()
    return NullProvider()


__all__ = ["AIProvider", "GeminiProvider", "GroveProvider", "NullProvider", "get_provider"]
