import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import { api } from "../api";

function SourceBadge({ source }) {
  const isReddit = source.startsWith("Reddit");
  return (
    <span
      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
        isReddit
          ? "text-[#ff8a5c] border-[#ff8a5c]/30 bg-[#ff8a5c]/10"
          : "text-[#6c8cff] border-[#6c8cff]/30 bg-[#6c8cff]/10"
      }`}
    >
      <span className="material-symbols-outlined text-[14px]">
        {isReddit ? "forum" : "trending_up"}
      </span>
      {source}
    </span>
  );
}

function AnalysisSection({ title, icon, children }) {
  return (
    <div className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-4">
      <h3 className="text-[13px] font-semibold text-white flex items-center gap-2 mb-2">
        <span className="material-symbols-outlined text-[#6c8cff] text-[18px]">
          {icon}
        </span>
        {title}
      </h3>
      <div className="text-[13px] text-slate-300 leading-relaxed">{children}</div>
    </div>
  );
}

function IdeaDetail({ idea, onBack }) {
  const navigate = useNavigate();
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [scanKeyword, setScanKeyword] = useState("");
  const [scanning, setScanning] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await api.analyzeIdea(idea);
        if (!cancelled) setAnalysis(res.analysis || res);
      } catch (e) {
        if (!cancelled) setError(e.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [idea]);

  const keywords = analysis?.suggested_keywords || [];
  const activeKeyword = scanKeyword || keywords[0] || "";

  const startScan = async () => {
    if (!activeKeyword || scanning) return;
    setScanning(true);
    try {
      await api.createScan(activeKeyword);
      navigate("/");
    } catch (e) {
      setError(e.message);
      setScanning(false);
    }
  };

  return (
    <div>
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[13px] text-[#6c8cff] hover:underline mb-4 bg-transparent border-0 cursor-pointer p-0"
      >
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Back to ideas
      </button>

      <div className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-5 mb-4">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h2 className="text-[17px] font-bold text-white leading-snug">
            {idea.title}
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <SourceBadge source={idea.source} />
          {idea.hotness > 0 && (
            <span className="text-[11px] text-slate-400 tabular-nums">
              ▲ {idea.hotness}
            </span>
          )}
        </div>
        {idea.text && (
          <p className="text-[13px] text-slate-400 mt-3 leading-relaxed line-clamp-4">
            {idea.text}
          </p>
        )}
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-[13px] py-8 justify-center">
          <span className="material-symbols-outlined animate-spin text-[20px]">
            progress_activity
          </span>
          AI is analyzing this idea…
        </div>
      )}
      {error && (
        <div className="bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.35)] rounded-[12px] p-3 text-[13px] text-red-200 mb-4">
          {error}
        </div>
      )}

      {analysis && !analysis.error && (
        <div className="space-y-3">
          <AnalysisSection title="Summary" icon="summarize">
            {analysis.summary}
          </AnalysisSection>
          <AnalysisSection title="Why it's trending" icon="trending_up">
            {analysis.why_trending}
          </AnalysisSection>
          <AnalysisSection title="Target audience" icon="group">
            {analysis.target_audience}
          </AnalysisSection>
          {Array.isArray(analysis.key_features) && (
            <AnalysisSection title="Key features" icon="checklist">
              <ul className="list-disc pl-5 space-y-1">
                {analysis.key_features.map((f, i) => (
                  <li key={i}>{f}</li>
                ))}
              </ul>
            </AnalysisSection>
          )}
          <AnalysisSection title="Monetization" icon="payments">
            {analysis.monetization}
          </AnalysisSection>
          <AnalysisSection title="Competition angle" icon="swords">
            {analysis.competition_angle}
          </AnalysisSection>

          {keywords.length > 0 && (
            <div className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-4">
              <h3 className="text-[13px] font-semibold text-white flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-[#6c8cff] text-[18px]">
                  search
                </span>
                Scan the Play Store for competition
              </h3>
              <div className="flex flex-wrap gap-2 mb-3">
                {keywords.map((kw) => (
                  <button
                    key={kw}
                    type="button"
                    onClick={() => setScanKeyword(kw)}
                    className={`text-[12px] px-3 py-1.5 rounded-full border transition-all cursor-pointer ${
                      (scanKeyword || keywords[0]) === kw
                        ? "bg-[#6c8cff] border-[#6c8cff] text-white font-medium"
                        : "bg-transparent border-[#2a2f42] text-slate-300 hover:border-[#6c8cff]"
                    }`}
                  >
                    {kw}
                  </button>
                ))}
              </div>
              <button
                onClick={startScan}
                disabled={scanning || !activeKeyword}
                className="w-full bg-[#6c8cff] hover:bg-[#5876e6] disabled:opacity-60 text-white font-medium py-2.5 px-4 rounded-[12px] text-sm transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {scanning ? (
                  <span className="material-symbols-outlined animate-spin text-[18px]">
                    progress_activity
                  </span>
                ) : (
                  <span className="material-symbols-outlined text-[18px]">
                    travel_explore
                  </span>
                )}
                {scanning ? "Starting scan…" : `Scan Play Store for "${activeKeyword}"`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Ideas() {
  const [ideas, setIdeas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.listIdeas();
        setIdeas(res.ideas || []);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="min-h-screen bg-[#0f1117] font-[Inter]">
      <Header />
      <main className="w-full max-w-[1100px] mx-auto px-4 md:px-6 lg:px-8 py-6">
        {selected ? (
          <IdeaDetail idea={selected} onBack={() => setSelected(null)} />
        ) : (
          <>
            <div className="mb-5">
              <h1 className="text-[22px] font-bold text-white flex items-center gap-2">
                <span className="material-symbols-outlined text-[#6c8cff] text-[24px]">
                  auto_awesome
                </span>
                Idea Radar
              </h1>
              <p className="text-[13px] text-slate-400 mt-1">
                App ideas trending on Reddit and Google right now. Tap one for
                an AI deep-dive, then scan the Play Store for the competition.
              </p>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-slate-400 text-[13px] py-12 justify-center">
                <span className="material-symbols-outlined animate-spin text-[20px]">
                  progress_activity
                </span>
                Fetching trending ideas…
              </div>
            )}
            {error && (
              <div className="bg-[rgba(239,68,68,0.12)] border border-[rgba(239,68,68,0.35)] rounded-[12px] p-4 text-[13px] text-red-200">
                {error}
              </div>
            )}
            {!loading && !error && ideas.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-[13px]">
                No ideas right now — check back later.
              </div>
            )}

            <div className="grid gap-3 md:grid-cols-2">
              {ideas.map((idea, i) => (
                <button
                  key={i}
                  onClick={() => setSelected(idea)}
                  className="text-left bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-4 hover:border-[#6c8cff]/60 transition-all cursor-pointer active:scale-[0.99]"
                >
                  <h3 className="text-[14px] font-semibold text-white leading-snug mb-2 line-clamp-2">
                    {idea.title}
                  </h3>
                  <div className="flex items-center justify-between gap-2">
                    <SourceBadge source={idea.source} />
                    <span className="flex items-center gap-1 text-[12px] text-[#6c8cff] font-medium shrink-0">
                      Analyze
                      <span className="material-symbols-outlined text-[16px]">
                        arrow_forward
                      </span>
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
