"""Opportunity scoring: deterministic, explainable, no AI needed.

The core thesis: an underrated app = high quality + low distribution.
The score surfaces apps whose ratings say "great" but whose install
counts say "nobody found it yet".

    opportunity = (quality x gap x market) / competition   (0-100 scale)

All inputs come from the scraper detail dict. Pure functions -- the same
app always scores the same.
"""

from __future__ import annotations

import math


def _clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def quality_score(detail: dict) -> float:
    """0-100. Rating weight 70, review volume 20, recency 10."""
    rating = float(detail.get("score") or 0.0)
    reviews = int(detail.get("reviews") or 0)
    q = (rating / 5.0) * 70.0
    q += _clamp(reviews / 5000.0, 0.0, 1.0) * 20.0
    # Recency: apps updated in the last year get the full 10.
    updated = str(detail.get("updated") or "")
    q += 10.0 if _updated_recently(updated) else 4.0
    return _clamp(q, 0.0, 100.0)


def _updated_recently(updated: str) -> bool:
    # "updated" looks like "Mar 12, 2024". Cheap check: year >= 2024.
    import re
    m = re.search(r"(19|20)\d{2}", updated)
    return bool(m and int(m.group(0)) >= 2024)


def gap_multiplier(detail: dict) -> float:
    """1-5. High rating + low installs => big gap (hidden gem)."""
    rating = float(detail.get("score") or 0.0)
    installs = int(detail.get("installs_num") or 0)
    rating_factor = _clamp((rating - 3.5) / 1.5, 0.0, 1.0)
    # installs on a log scale: 10 installs -> ~1.0, 1B installs -> 0.0
    obscurity = _clamp(1.0 - math.log10(installs + 1) / 9.0, 0.0, 1.0)
    return _clamp(1.0 + 4.0 * rating_factor * obscurity, 1.0, 5.0)


def market_score(detail: dict, peer_reviews_median: float = 1000.0) -> float:
    """0-100. Bigger review volume in the niche => bigger market."""
    reviews = int(detail.get("reviews") or 0)
    if peer_reviews_median <= 0:
        peer_reviews_median = 1000.0
    ratio = math.log10(reviews + 1) / math.log10(peer_reviews_median + 1)
    return _clamp(50.0 + 50.0 * _clamp(ratio, 0.0, 1.5) / 1.5, 0.0, 100.0)


def competition_factor(n_peers: int) -> float:
    """1-10. More apps found for the keyword => more saturated."""
    return _clamp(1.0 + 9.0 * _clamp(n_peers / 200.0, 0.0, 1.0), 1.0, 10.0)


def score_app(detail: dict, n_peers: int,
              peer_reviews_median: float = 1000.0) -> dict:
    """Score one app. Returns the detail dict plus a score breakdown.

    The gap multiplier is squared: a hidden gem (great rating, few
    installs) must beat an incumbent giant, and a linear gap can't do
    that against their quality/market advantage. ``raw`` is kept so
    callers can normalize relatively within a scan.
    """
    q = quality_score(detail)
    g = gap_multiplier(detail)
    m = market_score(detail, peer_reviews_median)
    c = competition_factor(n_peers)
    raw = (q * (g ** 2) * m) / c
    return {
        "appId": detail.get("appId"),
        "title": detail.get("title"),
        "rating": round(float(detail.get("score") or 0.0), 2),
        "installs": detail.get("installs"),
        "reviews": int(detail.get("reviews") or 0),
        "genre": detail.get("genre"),
        "raw": raw,
        "opportunity": 0.0,  # filled in by rank_apps (relative scale)
        "breakdown": {
            "quality": round(q, 1),
            "gap": round(g, 2),
            "market": round(m, 1),
            "competition": round(c, 2),
        },
    }


def rank_apps(details: list[dict]) -> list[dict]:
    """Score every app and return them sorted by opportunity, best first.

    Opportunity is relative: 100 x raw / best raw in this scan. Scores
    compare apps within one scan, not across scans.
    """
    if not details:
        return []
    reviews = sorted(int(d.get("reviews") or 0) for d in details)
    median = float(reviews[len(reviews) // 2]) if reviews else 1000.0
    scored = [score_app(d, len(details), median) for d in details]
    best = max(s["raw"] for s in scored) or 1.0
    for s in scored:
        s["opportunity"] = round(100.0 * s["raw"] / best, 1)
    return sorted(scored, key=lambda s: s["opportunity"], reverse=True)


__all__ = [
    "competition_factor",
    "gap_multiplier",
    "market_score",
    "quality_score",
    "rank_apps",
    "score_app",
]
