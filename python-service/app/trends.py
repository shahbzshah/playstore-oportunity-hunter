"""Trend and idea sources: Hacker News, Reddit app-idea communities.

Ideas are pulled live (no API keys needed) and returned as plain dicts:
  {title, source, hotness, url, text}
Callers cache the combined feed; these functions stay stateless.
"""

from __future__ import annotations

import logging

import requests

logger = logging.getLogger(__name__)

REDDIT_SUBS = ["AppIdeas", "androidapps", "SideProject"]
HN_QUERIES = ["app idea", "mobile app idea", "side project app"]
REQUEST_TIMEOUT = 20


def hackernews_ideas(limit_per_query: int = 8) -> list[dict]:
    """App-idea stories from Hacker News via the Algolia API (fast, reliable)."""
    ideas: list[dict] = []
    seen: set[str] = set()
    for query in HN_QUERIES:
        try:
            resp = requests.get(
                "https://hn.algolia.com/api/v1/search",
                params={"query": query, "tags": "story",
                        "hitsPerPage": limit_per_query},
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            for h in resp.json().get("hits", []):
                title = (h.get("title") or "").strip()
                oid = str(h.get("objectID") or "")
                if not title or oid in seen:
                    continue
                seen.add(oid)
                ideas.append({
                    "title": title,
                    "source": "Hacker News",
                    "hotness": int(h.get("points") or 0),
                    "url": f"https://news.ycombinator.com/item?id={oid}",
                    "text": "",
                })
        except Exception as exc:  # noqa: BLE001
            logger.warning("hacker news fetch failed for %r: %s", query, exc)
    ideas.sort(key=lambda x: x["hotness"], reverse=True)
    return ideas


def _fetch_subreddit(sub: str, limit: int) -> list[dict]:
    """Fetch one subreddit's hot posts, retrying on transient failures."""
    import time

    last_exc = None
    for attempt in range(3):
        try:
            resp = requests.get(
                "https://arctic-shift.photon-reddit.com/api/posts/search",
                params={"subreddit": sub, "limit": limit,
                        "sort": "desc", "fields": "title,score,permalink,selftext,subreddit"},
                timeout=REQUEST_TIMEOUT,
            )
            resp.raise_for_status()
            return resp.json().get("data", [])
        except Exception as exc:  # noqa: BLE001
            last_exc = exc
            logger.warning("arctic shift attempt %d failed for r/%s: %s",
                           attempt + 1, sub, exc)
            time.sleep(3 * (attempt + 1))
    logger.warning("arctic shift gave up on r/%s: %s", sub, last_exc)
    return []


def reddit_ideas(limit_per_sub: int = 8) -> list[dict]:
    """Hot posts from app-idea subreddits via the Arctic Shift API
    (free Reddit archive; the official JSON API blocks datacenter IPs)."""
    ideas: list[dict] = []
    for sub in REDDIT_SUBS:
        for d in _fetch_subreddit(sub, limit_per_sub):
            title = (d.get("title") or "").strip()
            if not title or title.lower().startswith("[deleted]"):
                continue
            if d.get("stickied"):
                continue
            ideas.append({
                "title": title,
                "source": f"Reddit r/{d.get('subreddit') or sub}",
                "hotness": int(d.get("score") or 0),
                "url": "https://www.reddit.com" + (d.get("permalink") or ""),
                "text": (d.get("selftext") or "")[:500],
            })
    ideas.sort(key=lambda x: x["hotness"], reverse=True)
    return ideas


def google_trends(limit: int = 10) -> list[dict]:
    """Google's daily trending searches (US). Fail-soft: [] on any error."""
    try:
        from pytrends.request import TrendReq

        tr = TrendReq(hl="en-US", tz=360, timeout=(10, 25))
        df = tr.trending_searches(pn="united_states")
        ideas: list[dict] = []
        for i, title in enumerate(df[0].tolist()[:limit]):
            title = str(title).strip()
            if not title:
                continue
            ideas.append({
                "title": title,
                "source": "Google Trends",
                # Higher rank = hotter; invert so sort desc works uniformly.
                "hotness": (limit - i) * 100,
                "url": "",
                "text": "",
            })
        return ideas
    except Exception as exc:  # noqa: BLE001
        logger.warning("google trends fetch failed: %s", exc)
        return []


def all_ideas() -> list[dict]:
    """Combined feed: Hacker News first (reliable), then Reddit, then Trends."""
    return hackernews_ideas() + reddit_ideas() + google_trends()


__all__ = ["all_ideas", "google_trends", "hackernews_ideas", "reddit_ideas"]
