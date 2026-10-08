import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "../auth";
import { api } from "../api";
import OpportunityCard from "../components/OpportunityCard";

const ACTIVE_STATUSES = new Set(["pending", "running"]);

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
    timer.current = setInterval(async () => {
      const list = await refresh();
      // Keep polling while any scan is still working; the interval
      // itself is cheap, so we just always poll.
      if (!list) return;
    }, 4000);
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

  // When a scan finishes, refresh the opportunities list.
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

  return (
    <div className="page">
      <header className="topbar">
        <h1>Opportunity Hunter</h1>
        <div className="topbar-right">
          <span className="muted">{user?.name}</span>
          <button className="ghost" onClick={logout}>
            Sign out
          </button>
        </div>
      </header>

      <section className="panel">
        <h2>New scan</h2>
        <form className="scan-form" onSubmit={startScan}>
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="e.g. habit tracker"
            aria-label="Keyword"
          />
          <button type="submit" disabled={scanning || !keyword.trim()}>
            {scanning ? "Starting…" : "Scan Play Store"}
          </button>
        </form>
        {scanError && <p className="error">{scanError}</p>}
        {scans.length > 0 && (
          <ul className="scan-list">
            {scans.slice(0, 5).map((s) => (
              <li key={s.id} className={`scan scan-${s.status}`}>
                <span className="scan-keyword">{s.keyword}</span>
                <span className="scan-status">{s.status}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="opp-header">
          <h2>Opportunities</h2>
          <form className="opp-filters" onSubmit={onSearch}>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search titles…"
              aria-label="Search opportunities"
            />
            <label className="check">
              <input
                type="checkbox"
                checked={bookmarkedOnly}
                onChange={(e) => setBookmarkedOnly(e.target.checked)}
              />
              Bookmarked
            </label>
            <button type="submit" className="ghost">
              Search
            </button>
          </form>
        </div>
        {oppError && <p className="error">{oppError}</p>}
        {opps.length === 0 && !oppError ? (
          <p className="muted">
            No opportunities yet. Run a scan above and they will appear here,
            ranked by opportunity score.
          </p>
        ) : (
          <div className="grid">
            {opps.map((o) => (
              <OpportunityCard key={o.id} opportunity={o} onBookmark={onBookmark} />
            ))}
          </div>
        )}
        {oppMeta && oppMeta.last_page > 1 && (
          <div className="pager">
            <button
              className="ghost"
              disabled={page <= 1}
              onClick={() => loadOpps(page - 1)}
            >
              ← Prev
            </button>
            <span className="muted">
              Page {page} of {oppMeta.last_page}
            </span>
            <button
              className="ghost"
              disabled={page >= oppMeta.last_page}
              onClick={() => loadOpps(page + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
