import React, { useEffect, useState } from "react";

type NewsItem = {
  title: string;
  link?: string;
  source?: string;
  score?: number;
};

export default function App() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Record<string, NewsItem[]>>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/news/top");
        const json = await res.json();
        if (!json.ok) throw new Error(json.error || "API error");
        setData(json.data);
      } catch (e: any) {
        setError(String(e));
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>News App</h1>
        <p className="sub">
          Aggregated headlines from HackerNews, Reddit and Google
        </p>
      </header>

      {loading && <div className="center">Loading...</div>}
      {error && <div className="center error">{error}</div>}

      {!loading && !error && (
        <div className="grid">
          {Object.entries(data).map(([source, items]) => (
            <section key={source} className="card">
              <h2 className="card-title">{source}</h2>
              <ul>
                {items.map((it, i) => (
                  <li key={i} className="item">
                    <a href={it.link ?? "#"} target="_blank" rel="noreferrer">
                      {it.title}
                    </a>
                    {it.score !== undefined && (
                      <span className="score">{it.score}</span>
                    )}
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}

      <footer className="footer">Powered by your MCP server · Local dev</footer>
    </div>
  );
}
