"""Play Store Opportunity Hunter -- Python service (Phase 1).

Endpoints:
  POST /scan               {keyword, n_hits, max_details} -> ranked opportunities
  GET  /app/{app_id}       full details + opportunity score
  POST /analyze/{app_id}   AI market analysis (NVIDIA preferred, null fallback)
  GET  /ideas              trending app ideas (Reddit + Google Trends)
  POST /idea/analyze       AI deep-dive on one idea
  GET  /health
"""

from __future__ import annotations

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from app import ai as ai_mod
from app import scraper, scoring, trends

app = FastAPI(title="Play Store Opportunity Hunter", version="0.1.0")


class ScanRequest(BaseModel):
    keyword: str = Field(min_length=2, max_length=100)
    n_hits: int = Field(default=30, ge=1, le=100)
    max_details: int = Field(default=20, ge=1, le=50)


class IdeaAnalyzeRequest(BaseModel):
    title: str = Field(min_length=3, max_length=300)
    source: str = Field(default="unknown", max_length=100)
    context: str = Field(default="", max_length=2000)


@app.get("/health")
def health() -> dict:
    return {"status": "ok", "ai_provider": ai_mod.get_provider().name}


@app.post("/scan")
def scan(req: ScanRequest) -> dict:
    details = scraper.scan_keyword(req.keyword, n_hits=req.n_hits,
                                   max_details=req.max_details)
    if not details:
        raise HTTPException(502, "Play Store scan returned no results")
    ranked = scoring.rank_apps(details)
    return {"keyword": req.keyword, "count": len(ranked),
            "opportunities": ranked}


@app.get("/app/{app_id}")
def app_score(app_id: str) -> dict:
    detail = scraper.app_details(app_id)
    if not detail:
        raise HTTPException(404, f"app not found: {app_id}")
    return scoring.score_app(detail, n_peers=1)


@app.post("/analyze/{app_id}")
def analyze(app_id: str) -> dict:
    detail = scraper.app_details(app_id)
    if not detail:
        raise HTTPException(404, f"app not found: {app_id}")
    scored = scoring.score_app(detail, n_peers=1)
    provider = ai_mod.get_provider()
    return {"app": scored, "analysis": provider.analyze(scored, detail)}


@app.get("/ideas")
def ideas() -> dict:
    items = trends.all_ideas()
    return {"count": len(items), "ideas": items}


@app.post("/idea/analyze")
def analyze_idea(req: IdeaAnalyzeRequest) -> dict:
    provider = ai_mod.get_provider()
    idea = {"title": req.title, "source": req.source, "text": req.context}
    return {"idea": idea, "analysis": provider.analyze_idea(idea)}
