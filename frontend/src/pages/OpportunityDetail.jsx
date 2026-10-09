import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import Header from "../components/Header";
import AnalysisView from "../components/AnalysisView";
import { scoreTier } from "../utils";

function CopyPackageId({ appId }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(appId);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = appId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="pt-1 flex items-center gap-2 flex-wrap">
      <span className="text-[11px] text-outline-variant uppercase tracking-wider">
        Package ID:
      </span>
      <button
        type="button"
        onClick={copy}
        className="group inline-flex items-center gap-1.5 bg-[#111319] hover:bg-[#1a1e2a] border border-[#2a2f42] px-2.5 py-1 rounded-lg text-[12px] font-mono text-on-surface-variant hover:text-white transition-all cursor-pointer"
      >
        <span>{appId}</span>
        <span className="material-symbols-outlined text-[15px] text-outline group-hover:text-primary-container transition-colors">
          {copied ? "check" : "content_copy"}
        </span>
      </button>
      {copied && (
        <span className="text-[12px] text-[#4ade80]">Copied!</span>
      )}
    </div>
  );
}

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

  const deleteAnalysis = async (analysisId) => {
    await api.deleteAnalysis(analysisId);
    setOpp((o) => ({
      ...o,
      analyses: (o.analyses || []).filter((a) => a.id !== analysisId),
    }));
  };

  if (error) {
    return (
      <div className="bg-[#0f1117] min-h-screen text-on-surface">
        <Header />
        <main className="max-w-[1100px] mx-auto px-4 py-6">
          <p className="text-[#ef4444]">{error}</p>
          <Link to="/" className="text-primary">← Back</Link>
        </main>
      </div>
    );
  }
  if (!opp) {
    return (
      <div className="bg-[#0f1117] min-h-screen text-on-surface">
        <Header />
        <main className="max-w-[1100px] mx-auto px-4 py-6">
          <p className="text-on-surface-variant">Loading…</p>
        </main>
      </div>
    );
  }

  const analyses = opp.analyses || [];
  const tier = scoreTier(opp.score);

  return (
    <div className="bg-[#0f1117] min-h-screen text-on-surface antialiased flex flex-col">
      <Header />

      <main className="flex-1 w-full max-w-[1100px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex flex-wrap items-center gap-2 text-on-surface-variant text-[12px] font-semibold">
          <Link
            to="/"
            className="inline-flex items-center gap-1 text-primary hover:text-white transition-colors no-underline"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>Back to Dashboard</span>
          </Link>
          <span className="text-outline-variant">/</span>
          <span className="hidden sm:inline">Opportunities</span>
          <span className="hidden sm:inline text-outline-variant">/</span>
          <span className="text-on-surface truncate max-w-[200px] sm:max-w-none font-medium">
            {opp.title}
          </span>
        </div>

        {/* App header card */}
        <section className="bg-[#171a23] border border-[#2a2f42] rounded-xl p-5 sm:p-6 transition-all hover:border-[#3b425d] relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#6c8cff]/30 to-transparent" />
          <div className="flex flex-col gap-5">
            <div className="flex items-start justify-between gap-4">
              <div
                className="inline-flex items-center gap-3 px-3.5 py-1.5 rounded-xl border"
                style={{
                  backgroundColor: `${tier.color}1f`,
                  borderColor: `${tier.color}40`,
                }}
              >
                <span
                  className="text-[24px] font-bold leading-none tracking-tight tabular-nums"
                  style={{ color: tier.color }}
                >
                  {tier.score}
                </span>
                <span
                  className="text-[11px] font-bold uppercase tracking-wider"
                  style={{ color: tier.color }}
                >
                  {tier.label}
                </span>
              </div>
              <button
                type="button"
                aria-label={opp.is_bookmarked ? "Remove bookmark" : "Bookmark"}
                onClick={toggleBookmark}
                className="p-2.5 rounded-xl border border-[#2a2f42] bg-[#1f2330] hover:bg-surface-container-high transition-colors active:scale-95 cursor-pointer"
              >
                <span
                  className={`material-symbols-outlined text-[22px] ${
                    opp.is_bookmarked ? "text-[#f59e0b]" : "text-outline"
                  }`}
                  style={opp.is_bookmarked ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >
                  star
                </span>
              </button>
            </div>

            <div className="space-y-2">
              <h1 className="text-[28px] sm:text-[36px] text-white font-bold tracking-tight leading-tight">
                {opp.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-on-surface-variant text-[14px]">
                <span className="text-on-surface font-medium">{opp.developer || "Unknown dev"}</span>
                {opp.category && (
                  <>
                    <span className="text-outline-variant">·</span>
                    <span className="text-primary-container font-medium">{opp.category}</span>
                  </>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 pt-1 text-[12px] font-semibold text-on-surface-variant">
                <span className="inline-flex items-center gap-1 text-[#f59e0b]">
                  <span
                    className="material-symbols-outlined text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span className="text-white tabular-nums">
                    {opp.rating ? Number(opp.rating).toFixed(1) : "–"}
                  </span>
                  {opp.reviews_count != null && (
                    <span className="font-normal">
                      ({Number(opp.reviews_count).toLocaleString()} reviews)
                    </span>
                  )}
                </span>
                {opp.installs && (
                  <span className="inline-flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-outline text-[18px]">
                      download_for_offline
                    </span>
                    <span className="text-white">{opp.installs}</span>
                  </span>
                )}
              </div>
              {opp.app_id && <CopyPackageId appId={opp.app_id} />}
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-[#2a2f42]/70">
              {opp.url && (
                <a
                  className="bg-[#6c8cff] hover:bg-[#829eff] text-[#0f1117] font-semibold text-[14px] px-5 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all active:scale-[0.98] no-underline"
                  href={opp.url}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <span>View on Play Store</span>
                  <span className="material-symbols-outlined text-[18px]">open_in_new</span>
                </a>
              )}
              <button
                type="button"
                onClick={remove}
                className="border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2.5 rounded-xl text-[12px] font-medium inline-flex items-center gap-1.5 transition-colors active:scale-[0.98] bg-transparent cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">delete_outline</span>
                <span>Delete</span>
              </button>
            </div>
          </div>
        </section>

        {opp.summary && (
          <section className="bg-[#171a23] border border-[#2a2f42] rounded-xl p-5 sm:p-6">
            <h2 className="text-[20px] font-semibold text-white mb-2">Why it scores</h2>
            <p className="text-[14px] text-on-surface-variant leading-relaxed">{opp.summary}</p>
          </section>
        )}

        {/* AI Analysis */}
        <section className="bg-[#171a23] border border-[#2a2f42] rounded-xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#2a2f42]/80">
            <div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container text-[24px]">
                  smart_toy
                </span>
                <h2 className="text-[20px] text-white font-semibold">AI Analysis</h2>
              </div>
              <p className="text-on-surface-variant text-[12px] mt-0.5">
                Competitive breakdown, market gap, and a reverse-engineered build plan.
              </p>
            </div>
            <button
              type="button"
              onClick={runAnalysis}
              disabled={analyzing}
              className="inline-flex items-center justify-center gap-2 bg-[#1f2330] hover:bg-[#282d3e] border border-[#2a2f42] text-white text-[12px] font-semibold px-4 py-2 rounded-xl transition-all active:scale-[0.98] self-start sm:self-auto shrink-0 cursor-pointer disabled:opacity-55"
            >
              <span className="material-symbols-outlined text-primary-container text-[18px]">
                auto_awesome
              </span>
              <span>{analyzing ? "Analyzing…" : analyses.length ? "Re-run analysis" : "Analyze with AI"}</span>
            </button>
          </div>

          {analyzing && (
            <div className="bg-[#12141c] border border-[#2a2f42] rounded-xl p-8 sm:p-12 text-center space-y-6">
              <div className="relative w-16 h-16 mx-auto">
                <div className="absolute inset-0 rounded-full border-2 border-primary-container/20 animate-ping" />
                <div className="w-16 h-16 rounded-full border-[3px] border-t-primary-container border-r-transparent border-b-[#2a2f42] border-l-transparent animate-spin" />
                <span className="material-symbols-outlined text-primary-container text-[24px] absolute inset-0 flex items-center justify-center">
                  smart_toy
                </span>
              </div>
              <div className="space-y-2 max-w-md mx-auto">
                <h3 className="text-[20px] text-white font-semibold">Analyzing…</h3>
                <p className="text-[12px] text-on-surface-variant">
                  Reading the Play Store listing and synthesizing the market breakdown…
                </p>
              </div>
            </div>
          )}

          {analyzeError && !analyzing && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <span className="material-symbols-outlined text-red-400 text-[24px] shrink-0 mt-0.5">
                  error
                </span>
                <div className="space-y-1">
                  <h3 className="text-[14px] font-bold text-red-200">Analysis run failed</h3>
                  <p className="text-[14px] text-red-300/90">{analyzeError}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={runAnalysis}
                className="inline-flex items-center gap-1.5 text-red-300 hover:text-white text-[12px] font-semibold underline underline-offset-4 transition-colors bg-transparent border-0 cursor-pointer ml-9"
              >
                <span className="material-symbols-outlined text-[16px]">refresh</span>
                <span>Retry analysis</span>
              </button>
            </div>
          )}

          {!analyzing && analyses.length === 0 && !analyzeError && (
            <div className="bg-[#12141c] border border-dashed border-[#2a2f42] rounded-xl p-8 sm:p-12 text-center space-y-5">
              <div className="w-14 h-14 rounded-2xl bg-[#1f2330] border border-[#2a2f42] flex items-center justify-center mx-auto">
                <span className="material-symbols-outlined text-[28px] text-outline">insights</span>
              </div>
              <div className="space-y-1.5 max-w-md mx-auto">
                <h3 className="text-[20px] text-white font-semibold">No analysis yet</h3>
                <p className="text-[14px] text-on-surface-variant">
                  Run one to get a market breakdown, build plan and monetization ideas.
                </p>
              </div>
              <button
                type="button"
                onClick={runAnalysis}
                className="bg-primary-container hover:bg-[#829eff] text-[#0f1117] font-semibold text-[14px] px-6 py-2.5 rounded-xl inline-flex items-center gap-2 transition-all active:scale-[0.98] border-0 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[20px]">auto_awesome</span>
                <span>Analyze with AI</span>
              </button>
            </div>
          )}

          {!analyzing && analyses.length > 0 && (
            <div className="space-y-4">
              {analyses
                .slice()
                .reverse()
                .map((a) => (
                  <AnalysisView key={a.id} analysis={a} onDelete={deleteAnalysis} />
                ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
