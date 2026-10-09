import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../api";
import OpportunityCard from "../components/OpportunityCard";

function timeAgo(iso) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

function ScanStatusPill({ status }) {
  if (status === "completed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-[#4ade80] bg-emerald-950/40 border border-emerald-500/30">
        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          check_circle
        </span>
        Completed
      </span>
    );
  }
  if (status === "failed") {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-[#ef4444] bg-red-950/40 border border-red-500/30">
        <span className="material-symbols-outlined text-[13px]" style={{ fontVariationSettings: "'FILL' 1" }}>
          error
        </span>
        Failed
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-medium text-[#f59e0b] bg-amber-950/40 border border-amber-500/30">
      <span className="w-1.5 h-1.5 rounded-full bg-[#f59e0b] animate-ping" />
      {status === "pending" ? "Pending" : "Running"}
    </span>
  );
}

function usePollingScans() {
  const [scans, setScans] = useState([]);
  const timer = useRef(null);

  const refresh = useCallback(async () => {
    try {
      const data = await api.listScans();
      const list = data.data ?? data;
      setScans(list);
      return list;
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    refresh();
    timer.current = setInterval(refresh, 4000);
    return () => clearInterval(timer.current);
  }, [refresh]);

  return [scans, refresh];
}

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [scans, refreshScans] = usePollingScans();

  const [keyword, setKeyword] = useState("");
  const [scanError, setScanError] = useState("");
  const [scanning, setScanning] = useState(false);

  const [opps, setOpps] = useState([]);
  const [oppMeta, setOppMeta] = useState(null);
  const [search, setSearch] = useState("");
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [oppError, setOppError] = useState("");

  const loadOpps = useCallback(
    async (p = 1) => {
      setOppError("");
      try {
        const data = await api.listOpportunities({
          search,
          bookmarked: bookmarkedOnly,
          page: p,
        });
        setOpps(data.data ?? data);
        setOppMeta(data.meta ?? null);
        setPage(p);
      } catch (err) {
        setOppError(err.message);
      }
    },
    [search, bookmarkedOnly]
  );

  useEffect(() => {
    loadOpps(1);
  }, [loadOpps]);

  const lastCompleted = useRef(0);
  useEffect(() => {
    const done = scans.filter((s) => s.status === "completed").length;
    if (done > lastCompleted.current) {
      lastCompleted.current = done;
      loadOpps(1);
    }
  }, [scans, loadOpps]);

  const startScan = async (e) => {
    e.preventDefault();
    if (!keyword.trim()) return;
    setScanError("");
    setScanning(true);
    try {
      await api.createScan(keyword.trim());
      setKeyword("");
      await refreshScans();
    } catch (err) {
      setScanError(err.message);
    } finally {
      setScanning(false);
    }
  };

  const onBookmark = (updated) => {
    setOpps((list) =>
      bookmarkedOnly
        ? list.filter((o) => o.id !== updated.id || updated.is_bookmarked)
        : list.map((o) => (o.id === updated.id ? updated : o))
    );
  };

  const onSearch = (e) => {
    e.preventDefault();
    loadOpps(1);
  };

  const resetFilters = () => {
    setSearch("");
    setBookmarkedOnly(false);
  };

  const initial = (user?.name || "?").trim().charAt(0).toUpperCase();

  return (
    <div className="bg-[#0f1117] min-h-screen text-on-surface antialiased flex flex-col">
      {/* Header */}
      <header className="bg-surface-container-low sticky top-0 z-50">
        <div className="w-full max-w-[1100px] mx-auto px-4 md:px-6 lg:px-8 flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                radar
              </span>
            </div>
            <span className="text-[20px] font-bold tracking-tight text-on-surface">
              Opportunity Hunter
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-surface-container-high border border-outline-variant/40">
              <div className="w-6 h-6 rounded-full bg-primary-container/20 text-primary flex items-center justify-center font-bold text-[12px] border border-primary/30">
                {initial}
              </div>
              <span className="text-[12px] font-semibold text-on-surface hidden sm:inline">
                {user?.name}
              </span>
            </div>
            <button
              onClick={logout}
              className="text-[12px] font-semibold text-outline hover:text-on-surface hover:bg-surface-container-high px-2.5 py-1.5 rounded-lg transition-all active:scale-[0.98] bg-transparent border-0 cursor-pointer"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow space-y-6">
        {/* Hero */}
        <section className="pb-2 border-b border-outline-variant/30">
          <h1 className="text-[24px] font-bold text-on-surface tracking-tight">
            Play Store Intelligence Deck
          </h1>
          <p className="text-[14px] text-on-surface-variant mt-0.5">
            Scan the Play Store for overlooked, high-potential apps.
          </p>
        </section>

        {/* New scan */}
        <section className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-6">
          <div className="mb-4">
            <h2 className="text-[20px] font-semibold text-on-surface flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                search_insights
              </span>
              New scan
            </h2>
            <p className="text-[14px] text-on-surface-variant mt-0.5">
              Enter a keyword to discover underrated apps in that niche.
            </p>
          </div>

          <form className="flex flex-col sm:flex-row gap-3" onSubmit={startScan}>
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-outline">
                <span className="material-symbols-outlined text-[20px]">manage_search</span>
              </div>
              <input
                className="w-full bg-[#10131b] border border-[#2a2f42] text-on-surface rounded-[12px] pl-10 pr-4 py-2.5 text-[14px] placeholder:text-outline focus:outline-none focus:border-[#6c8cff] focus:ring-1 focus:ring-[#6c8cff] transition-all"
                placeholder="e.g. habit tracker"
                aria-label="Keyword"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
              />
            </div>
            <button
              className="bg-[#6c8cff] hover:bg-[#829eff] text-[#0f1117] font-semibold text-[14px] px-6 py-2.5 rounded-[12px] transition-all duration-150 flex items-center justify-center gap-2 active:scale-[0.98] shrink-0 border-0 cursor-pointer disabled:opacity-55"
              type="submit"
              disabled={scanning || !keyword.trim()}
            >
              <span className="material-symbols-outlined text-[20px]">travel_explore</span>
              {scanning ? "Starting…" : "Scan Play Store"}
            </button>
          </form>
          {scanError && <p className="text-[#ef4444] text-[14px] mt-3">{scanError}</p>}

          {scans.length > 0 && (
            <>
              <div className="my-5 border-t border-[#2a2f42]/60" />
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12px] text-on-surface-variant tracking-wider uppercase font-semibold">
                  Recent scans
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
                {scans.slice(0, 5).map((s) => (
                  <div
                    key={s.id}
                    className={`bg-[#10131b] border rounded-lg p-2.5 flex flex-col justify-between transition-colors ${
                      s.status === "failed"
                        ? "border-red-500/40"
                        : s.status === "completed"
                        ? "border-[#2a2f42] hover:border-[#6c8cff]/30"
                        : "border-amber-500/30"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-2">
                      <span className="text-[12px] text-on-surface font-medium truncate" title={s.keyword}>
                        {s.keyword}
                      </span>
                      <span className="text-[10px] font-mono text-outline shrink-0">
                        {timeAgo(s.created_at)}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <ScanStatusPill status={s.status} />
                    </div>
                    {s.status === "failed" && s.error && (
                      <p className="text-[10px] text-[#ef4444] leading-tight line-clamp-2 mt-1 font-mono" title={s.error}>
                        {s.error}
                      </p>
                    )}
                    {s.status === "completed" && s.results_count != null && (
                      <p className="text-[10px] text-outline mt-1 font-mono">
                        {s.results_count} results
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>

        {/* Opportunities */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <h2 className="text-[20px] font-bold text-on-surface tracking-tight">Opportunities</h2>
            {oppMeta && (
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-surface-container border border-outline-variant/40 text-primary-container">
                {oppMeta.total} discovered
              </span>
            )}
          </div>

          <div className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
            <form className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto flex-grow" onSubmit={onSearch}>
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">
                  <span className="material-symbols-outlined text-[18px]">search</span>
                </div>
                <input
                  className="w-full bg-[#10131b] border border-[#2a2f42] text-on-surface rounded-[8px] pl-9 pr-3 py-1.5 text-[12px] placeholder:text-outline focus:outline-none focus:border-[#6c8cff] transition-all"
                  placeholder="Search titles…"
                  aria-label="Search opportunities"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none text-[12px] text-on-surface-variant hover:text-on-surface w-full sm:w-auto px-1 py-1">
                <input
                  type="checkbox"
                  className="rounded border-[#2a2f42] bg-[#10131b] text-[#6c8cff] w-4 h-4 cursor-pointer"
                  checked={bookmarkedOnly}
                  onChange={(e) => setBookmarkedOnly(e.target.checked)}
                />
                <span className="inline-flex items-center gap-1">
                  <span
                    className="material-symbols-outlined text-amber-400 text-[18px]"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    star
                  </span>
                  <span>Bookmarked only</span>
                </span>
              </label>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-[8px] border border-[#2a2f42] bg-[#171a23] hover:bg-[#1f2330] text-on-surface text-[12px] font-semibold flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <span className="material-symbols-outlined text-[16px]">filter_list</span>
                  Search
                </button>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="px-2.5 py-1.5 text-outline hover:text-on-surface text-[11px] transition-colors bg-transparent border-0 cursor-pointer"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {oppError && <p className="text-[#ef4444] text-[14px]">{oppError}</p>}

          {opps.length === 0 && !oppError ? (
            <div className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-12 text-center space-y-4">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-surface-container border border-outline-variant/40 text-outline">
                <span className="material-symbols-outlined text-[36px]">search_off</span>
              </div>
              <div className="max-w-md mx-auto space-y-1">
                <h3 className="text-[20px] font-semibold text-white">No opportunities yet</h3>
                <p className="text-[14px] text-on-surface-variant">
                  Run a scan above to discover underrated apps, ranked by opportunity score.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opps.map((o) => (
                <OpportunityCard key={o.id} opportunity={o} onBookmark={onBookmark} />
              ))}
            </div>
          )}

          {oppMeta && oppMeta.last_page > 1 && (
            <div className="bg-[#171a23] border border-[#2a2f42] rounded-[12px] p-3 flex items-center justify-between">
              <button
                className="px-4 py-1.5 rounded-[12px] border border-[#2a2f42] bg-[#10131b] hover:bg-[#1f2330] text-on-surface text-[12px] font-semibold flex items-center gap-1 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                disabled={page <= 1}
                onClick={() => loadOpps(page - 1)}
              >
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                <span>Prev</span>
              </button>
              <span className="text-[12px] text-on-surface-variant font-medium">
                Page <span className="text-white font-bold">{page}</span> of {oppMeta.last_page}
              </span>
              <button
                className="px-4 py-1.5 rounded-[12px] border border-[#2a2f42] bg-[#10131b] hover:bg-[#1f2330] text-on-surface text-[12px] font-semibold flex items-center gap-1 transition-all active:scale-[0.98] disabled:opacity-40 cursor-pointer"
                disabled={page >= oppMeta.last_page}
                onClick={() => loadOpps(page + 1)}
              >
                <span>Next</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
