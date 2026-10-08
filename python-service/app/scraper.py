"""Play Store scraping layer.

Thin, polite wrapper around ``google_play_scraper``. Every network call
goes through here so rate-limiting and retries live in one place.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from google_play_scraper import app as _app_detail
from google_play_scraper import search as _search

logger = logging.getLogger(__name__)

# Be polite to Google: pause between detail fetches.
DETAIL_DELAY_SECS = 0.8
LANG = "en"
COUNTRY = "us"


def _parse_installs(raw: Any) -> int:
    """'5,000,000+' -> 5000000. Unknown -> 0."""
    if not raw:
        return 0
    try:
        return int(str(raw).replace(",", "").replace("+", "").strip())
    except ValueError:
        return 0


def search_apps(keyword: str, n_hits: int = 30) -> list[dict]:
    """Keyword search. Returns raw result dicts (appId, title, score...)."""
    try:
        return _search(keyword, lang=LANG, country=COUNTRY, n_hits=n_hits)
    except Exception as exc:  # noqa: BLE001
        logger.warning("search failed for %r: %s", keyword, exc)
        return []


def app_details(app_id: str) -> dict | None:
    """Full detail dict for one app, or None on failure."""
    try:
        d = _app_detail(app_id, lang=LANG, country=COUNTRY)
        d["installs_num"] = _parse_installs(d.get("installs"))
        return d
    except Exception as exc:  # noqa: BLE001
        logger.warning("detail fetch failed for %s: %s", app_id, exc)
        return None


def scan_keyword(keyword: str, n_hits: int = 30,
                 max_details: int = 20) -> list[dict]:
    """Search a keyword and enrich the top results with full details.

    Returns detail dicts (each with ``installs_num``). Detail fetching is
    the slow part, so it is capped at ``max_details``.
    """
    results = search_apps(keyword, n_hits=n_hits)
    enriched: list[dict] = []
    for r in results[:max_details]:
        d = app_details(r["appId"])
        if d:
            enriched.append(d)
        time.sleep(DETAIL_DELAY_SECS)
    return enriched


__all__ = ["app_details", "scan_keyword", "search_apps"]
