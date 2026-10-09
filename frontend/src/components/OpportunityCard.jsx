import { Link } from "react-router-dom";
import { api } from "../api";
import { scoreTier } from "../utils";

export default function OpportunityCard({ opportunity, onBookmark }) {
  const tier = scoreTier(opportunity.score);
  const score = tier.score;

  const toggle = async (e) => {
    e.preventDefault();
    const updated = await api.updateOpportunity(opportunity.id, {
      is_bookmarked: !opportunity.is_bookmarked,
    });
    onBookmark?.(updated);
  };

  return (
    <Link
      to={`/opportunities/${opportunity.id}`}
      className="group bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-5 flex flex-col justify-between transition-all duration-150 hover:border-[#6c8cff]/40"
    >
      <div>
        <div className="flex items-center justify-between mb-3.5">
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center justify-center font-bold font-mono text-[18px] px-2.5 py-0.5 rounded-[8px] border tabular-nums"
              style={{
                color: tier.color,
                backgroundColor: `${tier.color}1a`,
                borderColor: `${tier.color}40`,
              }}
            >
              {score}
            </span>
            <span
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: tier.color }}
            >
              {tier.label}
            </span>
          </div>
          <button
            aria-label={opportunity.is_bookmarked ? "Remove bookmark" : "Bookmark"}
            onClick={toggle}
            className={`p-1 transition-transform hover:scale-110 ${
              opportunity.is_bookmarked ? "text-amber-400" : "text-outline hover:text-amber-400"
            }`}
          >
            <span
              className="material-symbols-outlined text-[22px]"
              style={opportunity.is_bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
            >
              star
            </span>
          </button>
        </div>

        <h3 className="text-[16px] font-bold text-white tracking-tight group-hover:text-[#6c8cff] transition-colors">
          {opportunity.title}
        </h3>
        <p className="text-[12px] text-outline mt-1">
          <span className="font-medium text-on-surface-variant">
            {opportunity.developer || "Unknown dev"}
          </span>
          {opportunity.category && <span> · {opportunity.category}</span>}
        </p>

        <div className="flex items-center gap-2 mt-2.5 text-[12px] font-medium text-on-surface">
          <span className="inline-flex items-center gap-1 text-amber-400">
            <span
              className="material-symbols-outlined text-[15px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              star
            </span>
            {opportunity.rating ? Number(opportunity.rating).toFixed(1) : "–"}
          </span>
          {opportunity.reviews_count != null && (
            <span className="text-outline">({Number(opportunity.reviews_count).toLocaleString()} reviews)</span>
          )}
          {opportunity.installs && (
            <>
              <span className="text-outline">·</span>
              <span className="text-on-surface-variant">{opportunity.installs}</span>
            </>
          )}
        </div>

        <div className="w-full bg-[#1f2330] rounded-full h-[6px] mt-3 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(100, Math.max(0, score))}%`, backgroundColor: tier.color }}
          />
        </div>

        {opportunity.summary && (
          <p className="text-[12px] text-on-surface-variant/90 mt-3.5 leading-relaxed line-clamp-2">
            {opportunity.summary}
          </p>
        )}
      </div>
    </Link>
  );
}
