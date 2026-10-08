import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import AnalysisView from "../components/AnalysisView";

export default function OpportunityDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [opp, setOpp] = useState(null);
  const [error, setError] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState("");

  useEffect(() => {
    api
      .getOpportunity(id)
      .then(setOpp)
      .catch((err) => setError(err.message));
  }, [id]);

  const runAnalysis = async () => {
    setAnalyzeError("");
    setAnalyzing(true);
    try {
      const analysis = await api.analyze(opp.app_id, opp.id);
      setOpp((o) => ({ ...o, analyses: [...(o.analyses || []), analysis] }));
    } catch (err) {
      setAnalyzeError(err.message);
    } finally {
      setAnalyzing(false);
    }
  };

  const toggleBookmark = async () => {
    const updated = await api.updateOpportunity(opp.id, {
      is_bookmarked: !opp.is_bookmarked,
    });
    setOpp((o) => ({ ...o, is_bookmarked: updated.is_bookmarked }));
  };

  const remove = async () => {
    if (!window.confirm(`Delete "${opp.title}"?`)) return;
    await api.deleteOpportunity(opp.id);
    navigate("/");
  };

  if (error) return <div className="page"><p className="error">{error}</p><Link to="/">← Back</Link></div>;
  if (!opp) return <div className="page"><p className="muted">Loading…</p></div>;

  const analyses = opp.analyses || [];

  return (
    <div className="page">
      <Link to="/" className="back">← All opportunities</Link>
      <div className="panel detail-head">
        <div className={`score big ${(opp.score ?? 0) >= 80 ? "high" : (opp.score ?? 0) >= 50 ? "mid" : "low"}`}>
          {Math.round(opp.score ?? 0)}
        </div>
        <div>
          <h1>{opp.title}</h1>
          <p className="muted">
            {[opp.developer, opp.category].filter(Boolean).join(" · ")}
          </p>
          <p className="muted">
            {opp.rating ? `${Number(opp.rating).toFixed(2)}★` : "no rating"}
            {opp.installs ? ` · ${opp.installs}` : ""}
            {opp.app_id ? ` · ${opp.app_id}` : ""}
          </p>
          <div className="row">
            <button className="ghost" onClick={toggleBookmark}>
              {opp.is_bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
            </button>
            {opp.url && (
              <a className="ghost btn" href={opp.url} target="_blank" rel="noreferrer">
                Play Store ↗
              </a>
            )}
            <button className="ghost danger" onClick={remove}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {opp.summary && (
        <div className="panel">
          <h2>Why it scores</h2>
          <p>{opp.summary}</p>
        </div>
      )}

      <div className="panel">
        <div className="opp-header">
          <h2>AI analysis</h2>
          <button onClick={runAnalysis} disabled={analyzing}>
            {analyzing ? "Analyzing…" : analyses.length ? "Re-run analysis" : "Analyze with AI"}
          </button>
        </div>
        {analyzeError && <p className="error">{analyzeError}</p>}
        {analyses.length === 0 && !analyzing ? (
          <p className="muted">
            No analysis yet. Run one to get a market breakdown, build plan and
            monetization ideas.
          </p>
        ) : (
          analyses
            .slice()
            .reverse()
            .map((a) => <AnalysisView key={a.id} analysis={a} />)
        )}
      </div>
    </div>
  );
}
