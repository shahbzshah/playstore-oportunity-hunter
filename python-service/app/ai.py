"""AI analysis layer with swappable providers.

The scorer finds the opportunities; the AI explains them: what the app
does well, where the market gap is, and what a better version would
look like. Providers are interchangeable -- start free, upgrade later.

Set GEMINI_API_KEY in the environment (free at https://aistudio.google.com).
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


def get_provider() -> AIProvider:
    """Gemini when a key is configured, otherwise the null placeholder."""
    if os.environ.get("GEMINI_API_KEY"):
        return GeminiProvider()
    return NullProvider()


__all__ = ["AIProvider", "GeminiProvider", "NullProvider", "get_provider"]
