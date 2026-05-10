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
  const [search, setSearch] = useState("");
  const [limit, setLimit] = useState(5);

  const loadData = async (query?: string) => {
    setLoading(true);
    try {
      const url = query
        ? `/api/news/search?q=${encodeURIComponent(query)}&limit=${limit}`
        : `/api/news/top?limit=${limit}`;
      const res = await fetch(url);
      const json = await res.json();
      if (!json.ok) throw new Error(json.error || "API error");
      setData(json.data);
    } catch (e: any) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [limit]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(search.trim() || undefined);
  };

  return (
    <div className="app">
      <header className="header">
        <h1>News App</h1>
        <p className="sub">
          Aggregated headlines from HackerNews, Reddit and Google
        </p>
        <form onSubmit={handleSearch} className="search-form">
          <input
            type="text"
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="search-input"
          />
          <button type="submit" className="search-btn">
            Search
          </button>
        </form>
        <div className="controls">
          <label>
            Items per source:{" "}
            <select
              value={limit}
              onChange={(e) => setLimit(Number(e.target.value))}
              className="limit-select"
            >
              <option value={3}>3</option>
              <option value={5}>5</option>
              <option value={10}>10</option>
            </select>
          </label>
        </div>
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
