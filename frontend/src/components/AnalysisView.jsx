import { timeAgo } from "../utils";

function parseContent(content) {
  if (!content) return null;
  if (typeof content === "object") return content;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

function SectionTitle({ children, className = "" }) {
  return (
    <h3 className={`text-[11px] font-semibold text-outline tracking-wider uppercase ${className}`}>
      {children}
    </h3>
  );
}

export default function AnalysisView({ analysis, onDelete }) {
  const parsed = parseContent(analysis.content);

  return (
    <article className="bg-[#12141c] border border-[#2a2f42] rounded-xl p-4 sm:p-6 space-y-6 transition-all hover:border-[#3b425d]">
      <div className="flex items-center justify-between border-b border-[#2a2f42]/60 pb-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <span className="inline-flex items-center gap-1 bg-primary-container/15 text-primary-container border border-primary-container/30 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide">
            <span className="material-symbols-outlined text-[14px]">neurology</span>
            <span>{analysis.provider || "unknown"}</span>
          </span>
          {parsed?.model && (
            <span className="inline-flex items-center gap-1 bg-[#1f2330] text-on-surface-variant border border-[#2a2f42] px-2.5 py-0.5 rounded-full text-[11px]">
              {parsed.model}
            </span>
          )}
          {analysis.created_at && (
            <span className="inline-flex items-center gap-1 text-on-surface-variant text-[11px]">
              <span className="material-symbols-outlined text-[14px] text-outline">schedule</span>
              {timeAgo(analysis.created_at)}
            </span>
          )}
        </div>
        {onDelete && (
          <button
            type="button"
            aria-label="Delete this analysis"
            onClick={() => onDelete(analysis.id)}
            className="text-on-surface-variant hover:text-white p-1 rounded-lg hover:bg-surface-container-high transition-colors bg-transparent border-0 cursor-pointer"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        )}
      </div>

      {!parsed ? (
        <p className="font-mono text-[12px] text-on-surface-variant whitespace-pre-wrap">
          {String(analysis.content)}
        </p>
      ) : (
        <>
          {parsed.note && <p className="text-[14px] text-on-surface-variant">{parsed.note}</p>}
          {parsed.error && (
            <p className="text-[#ef4444] text-[14px]">Analysis failed: {parsed.error}</p>
          )}

          {parsed.summary && (
            <div className="space-y-2">
              <SectionTitle>Summary</SectionTitle>
              <p className="text-[14px] text-on-surface leading-relaxed">{parsed.summary}</p>
            </div>
          )}

          {(Array.isArray(parsed.strengths) && parsed.strengths.length > 0) ||
          (Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0) ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
              {Array.isArray(parsed.strengths) && parsed.strengths.length > 0 && (
                <div className="space-y-3 bg-[#171a23]/50 p-4 rounded-xl border border-[#2a2f42]/40">
                  <h3 className="text-[11px] font-semibold text-[#4ade80] tracking-wider uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">check_circle</span>
                    Strengths
                  </h3>
                  <ul className="space-y-2.5 text-[12px] text-on-surface">
                    {parsed.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#4ade80] text-[18px] shrink-0 mt-0.5">
                          check
                        </span>
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 && (
                <div className="space-y-3 bg-[#171a23]/50 p-4 rounded-xl border border-[#2a2f42]/40">
                  <h3 className="text-[11px] font-semibold text-[#f59e0b] tracking-wider uppercase flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[16px]">warning</span>
                    Weaknesses
                  </h3>
                  <ul className="space-y-2.5 text-[12px] text-on-surface">
                    {parsed.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="material-symbols-outlined text-[#f59e0b] text-[18px] shrink-0 mt-0.5">
                          error_outline
                        </span>
                        <span>{w}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}

          {parsed.opportunity && (
            <div className="space-y-2 pt-1">
              <SectionTitle>Opportunity</SectionTitle>
              <p className="text-[14px] text-on-surface leading-relaxed">{parsed.opportunity}</p>
            </div>
          )}

          {Array.isArray(parsed.build_plan) && parsed.build_plan.length > 0 && (
            <div className="space-y-3 pt-1">
              <SectionTitle>Build plan</SectionTitle>
              <div className="space-y-2.5">
                {parsed.build_plan.map((b, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-3 bg-[#171a23]/60 p-3 rounded-xl border border-[#2a2f42]/40"
                  >
                    <span className="w-6 h-6 rounded-lg bg-primary-container/20 text-primary font-bold text-[12px] flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <p className="text-[12px] text-on-surface-variant leading-relaxed">{b}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {parsed.monetization && (
            <div className="space-y-2 pt-1 border-t border-[#2a2f42]/60">
              <SectionTitle className="pt-3">Monetization</SectionTitle>
              <p className="text-[14px] text-on-surface leading-relaxed">{parsed.monetization}</p>
            </div>
          )}
        </>
      )}
    </article>
  );
}
