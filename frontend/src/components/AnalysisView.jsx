function parseContent(content) {
  if (!content) return null;
  if (typeof content === "object") return content;
  try {
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export default function AnalysisView({ analysis }) {
  const parsed = parseContent(analysis.content);

  return (
    <div className="analysis">
      <div className="analysis-meta">
        <span className="pill">{analysis.provider || "unknown provider"}</span>
        {analysis.created_at && (
          <span className="muted">
            {new Date(analysis.created_at).toLocaleString()}
          </span>
        )}
      </div>
      {!parsed ? (
        <p className="pre">{String(analysis.content)}</p>
      ) : (
        <>
          {parsed.note && <p className="muted">{parsed.note}</p>}
          {parsed.error && <p className="error">Analysis failed: {parsed.error}</p>}
          {parsed.summary && (
            <section>
              <h4>Summary</h4>
              <p>{parsed.summary}</p>
            </section>
          )}
          {Array.isArray(parsed.strengths) && parsed.strengths.length > 0 && (
            <section>
              <h4>Strengths</h4>
              <ul>
                {parsed.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </section>
          )}
          {Array.isArray(parsed.weaknesses) && parsed.weaknesses.length > 0 && (
            <section>
              <h4>Weaknesses</h4>
              <ul>
                {parsed.weaknesses.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </section>
          )}
          {parsed.opportunity && (
            <section>
              <h4>Opportunity</h4>
              <p>{parsed.opportunity}</p>
            </section>
          )}
          {Array.isArray(parsed.build_plan) && parsed.build_plan.length > 0 && (
            <section>
              <h4>Build plan</h4>
              <ol>
                {parsed.build_plan.map((b, i) => (
                  <li key={i}>{b}</li>
                ))}
              </ol>
            </section>
          )}
          {parsed.monetization && (
            <section>
              <h4>Monetization</h4>
              <p>{parsed.monetization}</p>
            </section>
          )}
        </>
      )}
    </div>
  );
}
