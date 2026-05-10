import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { fetchHackerNews } from "./sources/hackernews.js";
import { fetchReddit, fetchMultipleSubreddits } from "./sources/reddit.js";
import { fetchGoogleNews, searchGoogleNews } from "./sources/googlenews.js";
import { fetchTopHeadlines, searchNewsAPI } from "./sources/newsapi.js";

export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "news-mcp-server",
    version: "1.0.0",
  });

  server.tool(
    "get_hackernews_top",
    "Fetch top stories from Hacker News",
    { limit: z.number().min(1).max(30).default(10).describe("Number of stories to fetch") },
    async ({ limit }) => {
      const stories = await fetchHackerNews(limit ?? 10);
      return { content: [{ type: "text", text: JSON.stringify(stories, null, 2) }] };
    }
  );

  server.tool(
    "get_reddit_news",
    "Fetch top posts from Reddit news subreddits (r/news, r/worldnews)",
    {
      subreddit: z.enum(["news", "worldnews", "technology", "science"]).default("news").describe("Subreddit to fetch from"),
      limit: z.number().min(1).max(25).default(10).describe("Number of posts"),
    },
    async ({ subreddit, limit }) => {
      const posts = await fetchReddit(subreddit ?? "news", limit ?? 10);
      return { content: [{ type: "text", text: JSON.stringify(posts, null, 2) }] };
    }
  );

  server.tool(
    "get_google_news",
    "Fetch headlines from Google News RSS by topic",
    {
      topic: z.enum(["top", "technology", "business", "science", "health", "sports", "world"]).default("top"),
      limit: z.number().min(1).max(20).default(10),
    },
    async ({ topic, limit }) => {
      const items = await fetchGoogleNews(topic ?? "top", limit ?? 10);
      return { content: [{ type: "text", text: JSON.stringify(items, null, 2) }] };
    }
  );

  server.tool(
    "get_top_headlines",
    "Fetch top headlines from NewsAPI.org (requires NEWSAPI_KEY)",
    {
      category: z.enum(["general", "technology", "business", "entertainment", "health", "science", "sports"]).default("general"),
      country: z.string().length(2).default("us").describe("ISO 3166-1 alpha-2 country code"),
      limit: z.number().min(1).max(100).default(10),
    },
    async ({ category, country, limit }) => {
      const articles = await fetchTopHeadlines(category ?? "general", country ?? "us", limit ?? 10);
      return { content: [{ type: "text", text: JSON.stringify(articles, null, 2) }] };
    }
  );

  server.tool(
    "search_news",
    "Search news across Google News RSS and NewsAPI.org",
    {
      query: z.string().min(1).describe("Search query"),
      source: z.enum(["google", "newsapi", "all"]).default("all"),
      limit: z.number().min(1).max(20).default(10),
    },
    async ({ query, source, limit }) => {
      const src = source ?? "all";
      const lim = limit ?? 10;
      const results: Record<string, unknown> = {};

      if (src === "google" || src === "all") {
        results.google = await searchGoogleNews(query, lim);
      }
      if (src === "newsapi" || src === "all") {
        try {
          results.newsapi = await searchNewsAPI(query, lim);
        } catch {
          results.newsapi_error = "NEWSAPI_KEY not set or request failed";
        }
      }
      return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
    }
  );

  server.tool(
    "get_all_top_news",
    "Aggregate top news from all sources (HN, Reddit, Google News)",
    { limit: z.number().min(1).max(10).default(5).describe("Stories per source") },
    async ({ limit }) => {
      const lim = limit ?? 5;
      const [hn, reddit, google] = await Promise.allSettled([
        fetchHackerNews(lim),
        fetchMultipleSubreddits(lim),
        fetchGoogleNews("top", lim),
      ]);
      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            hackernews: hn.status === "fulfilled" ? hn.value : [],
            reddit: reddit.status === "fulfilled" ? reddit.value : [],
            google_news: google.status === "fulfilled" ? google.value : [],
          }, null, 2),
        }],
      };
    }
  );

  return server;
}
