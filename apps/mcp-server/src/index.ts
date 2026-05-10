import express from "express";
import cors from "cors";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { createMcpServer } from "./mcpServer.js";
import { fetchHackerNews } from "./sources/hackernews.js";
import { fetchReddit, fetchMultipleSubreddits } from "./sources/reddit.js";
import { fetchGoogleNews, searchGoogleNews } from "./sources/googlenews.js";
import { fetchTopHeadlines, searchNewsAPI } from "./sources/newsapi.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "4000", 10);

app.use(cors());
app.use(express.json());

// ── REST API (consumed by the Next.js web app) ───────────────────────────────

app.get("/api/news/hackernews", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10), 30);
    const data = await fetchHackerNews(limit);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/news/reddit", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10), 25);
    const subreddit = String(req.query.subreddit ?? "all");
    const data = subreddit === "all"
      ? await fetchMultipleSubreddits(limit)
      : await fetchReddit(subreddit, limit);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/news/google", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10), 20);
    const topic = String(req.query.topic ?? "top");
    const data = await fetchGoogleNews(topic, limit);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/news/newsapi", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10), 100);
    const category = String(req.query.category ?? "general");
    const country = String(req.query.country ?? "us");
    const data = await fetchTopHeadlines(category, country, limit);
    res.json({ ok: true, data });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/news/search", async (req, res) => {
  const query = String(req.query.q ?? "").trim();
  if (!query) return res.status(400).json({ ok: false, error: "q is required" });
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "10"), 10), 20);
    const [google, newsapi] = await Promise.allSettled([
      searchGoogleNews(query, limit),
      searchNewsAPI(query, limit),
    ]);
    res.json({
      ok: true,
      data: {
        google: google.status === "fulfilled" ? google.value : [],
        newsapi: newsapi.status === "fulfilled" ? newsapi.value : [],
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/api/news/top", async (req, res) => {
  try {
    const limit = Math.min(parseInt(String(req.query.limit ?? "5"), 10), 10);
    const [hn, reddit, google] = await Promise.allSettled([
      fetchHackerNews(limit),
      fetchMultipleSubreddits(limit),
      fetchGoogleNews("top", limit),
    ]);
    res.json({
      ok: true,
      data: {
        hackernews: hn.status === "fulfilled" ? hn.value : [],
        reddit: reddit.status === "fulfilled" ? reddit.value : [],
        google: google.status === "fulfilled" ? google.value : [],
      },
    });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
});

app.get("/health", (_req, res) => res.json({ ok: true, service: "news-mcp-server" }));

// ── MCP SSE endpoint (for AI clients like Claude Desktop) ────────────────────

const transports: Map<string, SSEServerTransport> = new Map();

app.get("/sse", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  const sessionId = transport.sessionId;
  transports.set(sessionId, transport);

  res.on("close", () => transports.delete(sessionId));

  const mcpServer = createMcpServer();
  await mcpServer.connect(transport);
});

app.post("/messages", async (req, res) => {
  const sessionId = req.query.sessionId as string;
  const transport = transports.get(sessionId);
  if (!transport) return res.status(404).json({ error: "Session not found" });
  await transport.handlePostMessage(req, res);
});

app.listen(PORT, () => {
  console.log(`News MCP Server running on port ${PORT}`);
  console.log(`REST API: http://localhost:${PORT}/api/news/top`);
  console.log(`MCP SSE: http://localhost:${PORT}/sse`);
});
