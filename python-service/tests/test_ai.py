"""Tests for the AI provider layer (python-service/app/ai.py)."""

from __future__ import annotations

import io
import json
import os
import sys
import types
import urllib.request

import pytest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app import ai as ai_mod


@pytest.fixture
def scored_detail():
    scored = {
        "title": "HabitJar",
        "appId": "com.habitjar.app",
        "genre": "Lifestyle",
        "rating": 4.55,
        "reviews": 1200,
        "installs": "10,000+",
        "opportunity": 92.0,
        "breakdown": {"quality": 0.9, "gap": 0.7, "market": 0.6, "competition": 0.3},
    }
    detail = {"description": "A simple habit tracker with jars."}
    return scored, detail


def _fake_urlopen(payload: dict):
    body = json.dumps(payload).encode()

    class FakeResp:
        def __init__(self):
            self._sent = False

        def __enter__(self):
            return self

        def __exit__(self, *a):
            return False

        def read(self, *a):
            if self._sent:
                return b""
            self._sent = True
            return body

    return FakeResp()


# ---------------------------------------------------------------- provider selection

def test_nvidia_preferred_when_env_key(monkeypatch):
    monkeypatch.setenv("NVIDIA_API_KEY", "nv-test")
    monkeypatch.delenv("GROVE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(ai_mod, "_nvidia_vault_available", lambda: False)
    assert isinstance(ai_mod.get_provider(), ai_mod.NvidiaProvider)


def test_nvidia_preferred_when_vault_available(monkeypatch):
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    monkeypatch.delenv("GROVE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    monkeypatch.setattr(ai_mod, "_nvidia_vault_available", lambda: True)
    assert isinstance(ai_mod.get_provider(), ai_mod.NvidiaProvider)


def test_falls_back_through_grove_gemini_to_null(monkeypatch):
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    monkeypatch.setattr(ai_mod, "_nvidia_vault_available", lambda: False)

    monkeypatch.setenv("GROVE_API_KEY", "g")
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert isinstance(ai_mod.get_provider(), ai_mod.GroveProvider)

    monkeypatch.delenv("GROVE_API_KEY", raising=False)
    monkeypatch.setenv("GEMINI_API_KEY", "x")
    assert isinstance(ai_mod.get_provider(), ai_mod.GeminiProvider)

    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert isinstance(ai_mod.get_provider(), ai_mod.NullProvider)


def test_nvidia_vault_check_fails_closed(monkeypatch):
    # If the vault helper can't be imported, provider selection must not blow up.
    monkeypatch.delenv("NVIDIA_API_KEY", raising=False)
    monkeypatch.delenv("GROVE_API_KEY", raising=False)
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert ai_mod._nvidia_vault_available() in (True, False)  # env-dependent
    assert isinstance(ai_mod.get_provider(), ai_mod.AIProvider)


# ---------------------------------------------------------------- NvidiaProvider auth

def test_nvidia_uses_env_key_as_bearer(monkeypatch):
    provider = ai_mod.NvidiaProvider(api_key="nv-raw")
    req = provider._build_request({"model": "m", "messages": []})
    assert req.get_header("Authorization") == "Bearer nv-raw"
    assert req.full_url == ai_mod.NVIDIA_URL


def test_nvidia_uses_surrogate_without_env_key(monkeypatch):
    fake = types.ModuleType("dynamic_credentials")
    seen = {}

    def fake_add(req, name, **kwargs):
        seen["name"] = name
        seen["hosts"] = kwargs.get("allowed_hosts")
        req.add_header("Authorization", "Bearer <redacted>:x")

    fake.add_surrogate_to_request = fake_add
    monkeypatch.setitem(sys.modules, "dynamic_credentials", fake)

    provider = ai_mod.NvidiaProvider(api_key="")
    req = provider._build_request({"model": "m", "messages": []})
    assert seen["name"] == "custom.nvidia"
    assert "integrate.api.nvidia.com" in seen["hosts"]
    assert req.get_header("Authorization") == "Bearer <redacted>:x"


# ---------------------------------------------------------------- NvidiaProvider.analyze

def _analysis_payload(text: str):
    return {"choices": [{"message": {"content": text}}]}


def test_nvidia_analyze_parses_json_shape(monkeypatch, scored_detail):
    scored, detail = scored_detail
    body = {
        "summary": "A neat little habit tracker.",
        "strengths": ["a", "b", "c"],
        "weaknesses": ["d", "e"],
        "opportunity": "Underserved niche.",
        "build_plan": ["f1", "f2", "f3"],
        "monetization": "Freemium.",
    }
    monkeypatch.setattr(
        urllib.request, "urlopen", lambda req, timeout=None: _fake_urlopen(_analysis_payload(json.dumps(body)))
    )
    provider = ai_mod.NvidiaProvider(api_key="nv-test")
    out = provider.analyze(scored, detail)
    assert out["provider"] == "nvidia"
    assert out["model"] == ai_mod.NVIDIA_MODEL
    assert out["summary"] == body["summary"]
    assert len(out["build_plan"]) == 3


def test_nvidia_analyze_returns_error_dict_on_failure(monkeypatch, scored_detail):
    scored, detail = scored_detail

    def boom(req, timeout=None):
        raise TimeoutError("slow endpoint")

    monkeypatch.setattr(urllib.request, "urlopen", boom)
    provider = ai_mod.NvidiaProvider(api_key="nv-test")
    out = provider.analyze(scored, detail)
    assert out["provider"] == "nvidia"
    assert "error" in out


def test_nvidia_analyze_strips_markdown_fences(monkeypatch, scored_detail):
    scored, detail = scored_detail
    inner = json.dumps({"summary": "s"})
    monkeypatch.setattr(
        urllib.request, "urlopen",
        lambda req, timeout=None: _fake_urlopen(_analysis_payload("```json\n" + inner + "\n```")),
    )
    provider = ai_mod.NvidiaProvider(api_key="nv-test")
    out = provider.analyze(scored, detail)
    assert out["summary"] == "s"


# ---------------------------------------------------------------- sane defaults

def test_sane_model_and_token_defaults():
    assert ai_mod.NVIDIA_MODEL == "deepseek-ai/deepseek-v4.1-flash"
    # Output cap must be practical, nowhere near the 1M-token context window.
    assert ai_mod.NVIDIA_MAX_TOKENS <= 4096
    assert "integrate.api.nvidia.com" in ai_mod.NVIDIA_URL
