import { Link } from "react-router-dom";
import { api } from "../api";

function scoreClass(score) {
  if (score >= 80) return "high";
  if (score >= 50) return "mid";
  return "low";
}

export default function OpportunityCard({ opportunity, onBookmark }) {
  const toggle = async (e) => {
    e.preventDefault();
    const updated = await api.updateOpportunity(opportunity.id, {
      is_bookmarked: !opportunity.is_bookmarked,
    });
    onBookmark?.(updated);
  };

  return (
    <Link to={`/opportunities/${opportunity.id}`} className="card">
      <div className={`score ${scoreClass(opportunity.score ?? 0)}`}>
        {Math.round(opportunity.score ?? 0)}
      </div>
      <div className="card-body">
        <div className="card-title-row">
          <h3>{opportunity.title}</h3>
          <button
            className={`bookmark ${opportunity.is_bookmarked ? "on" : ""}`}
            onClick={toggle}
            title={opportunity.is_bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            {opportunity.is_bookmarked ? "★" : "☆"}
          </button>
        </div>
        <p className="card-meta">
          {[opportunity.developer, opportunity.category].filter(Boolean).join(" · ")}
        </p>
        <p className="card-meta">
          {opportunity.rating ? `${Number(opportunity.rating).toFixed(2)}★` : "no rating"}
          {opportunity.installs ? ` · ${opportunity.installs}` : ""}
        </p>
        {opportunity.summary && (
          <p className="card-summary">{opportunity.summary}</p>
        )}
      </div>
    </Link>
  );
}
