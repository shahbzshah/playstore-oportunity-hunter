"""AI analysis layer with swappable providers.

The scorer finds the opportunities; the AI explains them: what the app
does well, where the market gap is, and what a better version would
look like. Providers are interchangeable -- start free, upgrade later.

Preferred: NVIDIA Build's OpenAI-compatible API
(https://integrate.api.nvidia.com/v1, default model
meta/llama-3.2-11b-vision-instruct, override with NVIDIA_MODEL).
Auth comes from the stored vault credential when this service runs where
that credential is available, otherwise from the NVIDIA_API_KEY
environment variable (optionally NVIDIA_MODEL to pick another catalog
model). Fallbacks: GROVE_API_KEY, then GEMINI_API_KEY, then the null
placeholder so the rest of the pipeline keeps working.
"""

from __future__ import annotations

import json
import logging
import os
import sys
from typing import Any

logger = logging.getLogger(__name__)

GEMINI_MODEL = "gemini-2.0-flash"
GEMINI_URL = (
    f"https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

GROVE_URL = "https://api.pgsgrove.com/v1/chat/completions"
GROVE_MODEL = os.environ.get("GROVE_MODEL", "deepseek-v4.1-flash")

NVIDIA_URL = "https://integrate.api.nvidia.com/v1/chat/completions"
NVIDIA_HOSTS = ["integrate.api.nvidia.com"]
NVIDIA_MODEL = os.environ.get("NVIDIA_MODEL", "meta/llama-3.2-11b-vision-instruct")
NVIDIA_MAX_TOKENS = int(os.environ.get("NVIDIA_MAX_TOKENS", "2048"))
NVIDIA_TIMEOUT = int(os.environ.get("NVIDIA_TIMEOUT", "240"))
NVIDIA_CREDENTIAL = "custom.nvidia"
_SKILL_BIN = "/opt/hatch/skills/skill-creator/bin"

_BROWSER_UA = (
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/126.0 Safari/537.36"
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


def _nvidia_vault_available() -> bool:
    """True when the stored NVIDIA vault credential can be attached here."""
    try:
        if _SKILL_BIN not in sys.path:
            sys.path.insert(0, _SKILL_BIN)
        from dynamic_credentials import dynamic_credential_entry

        dynamic_credential_entry(NVIDIA_CREDENTIAL)
        return True
    except Exception:  # noqa: BLE001
        return False


class NvidiaProvider(AIProvider):
    """NVIDIA Build OpenAI-compatible API (llama-3.2-11b-vision default).

    Auth: the stored vault credential when available in this environment,
    otherwise the NVIDIA_API_KEY environment variable. Set NVIDIA_MODEL to
    pick another catalog model.
    """

    name = "nvidia"

    def __init__(self, api_key: str | None = None, model: str | None = None):
        self.api_key = api_key or os.environ.get("NVIDIA_API_KEY", "")
        self.model = model or NVIDIA_MODEL

    def _build_request(self, payload: dict):
        import urllib.request

        req = urllib.request.Request(
            NVIDIA_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "User-Agent": _BROWSER_UA,
            },
            method="POST",
        )
        if self.api_key:
            req.add_header("Authorization", f"Bearer {self.api_key}")
        else:
            if _SKILL_BIN not in sys.path:
                sys.path.insert(0, _SKILL_BIN)
            from dynamic_credentials import add_surrogate_to_request

            add_surrogate_to_request(
                req, NVIDIA_CREDENTIAL, allowed_hosts=NVIDIA_HOSTS
            )
        return req

    def analyze(self, scored: dict, detail: dict) -> dict:
        import urllib.error
        import urllib.request

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
        payload = {
            "model": self.model,
            "messages": [{"role": "user", "content": prompt}],
            "max_tokens": NVIDIA_MAX_TOKENS,
            "temperature": 0.4,
        }
        try:
            req = self._build_request(payload)
            with urllib.request.urlopen(req, timeout=NVIDIA_TIMEOUT) as resp:
                if self.api_key:
                    # Plain API-key auth: standard JSON response.
                    data = json.loads(resp.read().decode("utf-8"))
                else:
                    # Vault surrogate flow: response needs the skill helper.
                    if _SKILL_BIN not in sys.path:
                        sys.path.insert(0, _SKILL_BIN)
                    from dynamic_credentials import read_json_response

                    data = read_json_response(resp)
            text = data["choices"][0]["message"]["content"]
            text = text.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
            out = json.loads(text)
            out["provider"] = "nvidia"
            out["model"] = self.model
            return out
        except Exception as exc:  # noqa: BLE001
            logger.warning("nvidia analysis failed: %s", exc)
            return {"provider": "nvidia", "error": str(exc)}


def get_provider() -> AIProvider:
    """NVIDIA when its key or vault credential exists, else Grove, Gemini, null."""
    if os.environ.get("NVIDIA_API_KEY") or _nvidia_vault_available():
        return NvidiaProvider()
    if os.environ.get("GROVE_API_KEY"):
        return GroveProvider()
    if os.environ.get("GEMINI_API_KEY"):
        return GeminiProvider()
    return NullProvider()


__all__ = [
    "AIProvider",
    "GeminiProvider",
    "GroveProvider",
    "NvidiaProvider",
    "NullProvider",
    "get_provider",
]
