import RSSParser from "rss-parser";

export interface GoogleNewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  snippet?: string;
}

const parser = new RSSParser({
  customFields: { item: [["source", "source"]] },
});

const TOPIC_MAP: Record<string, string> = {
  top: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
  technology: "https://news.google.com/rss/headlines/section/topic/TECHNOLOGY?hl=en-US&gl=US&ceid=US:en",
  business: "https://news.google.com/rss/headlines/section/topic/BUSINESS?hl=en-US&gl=US&ceid=US:en",
  science: "https://news.google.com/rss/headlines/section/topic/SCIENCE?hl=en-US&gl=US&ceid=US:en",
  health: "https://news.google.com/rss/headlines/section/topic/HEALTH?hl=en-US&gl=US&ceid=US:en",
  sports: "https://news.google.com/rss/headlines/section/topic/SPORTS?hl=en-US&gl=US&ceid=US:en",
  world: "https://news.google.com/rss/headlines/section/topic/WORLD?hl=en-US&gl=US&ceid=US:en",
};

export async function fetchGoogleNews(
  topic = "top",
  limit = 10
): Promise<GoogleNewsItem[]> {
  const url = TOPIC_MAP[topic] ?? TOPIC_MAP.top;
  const feed = await parser.parseURL(url);
  return feed.items.slice(0, limit).map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    pubDate: item.pubDate ?? "",
    source: (item as unknown as { source?: string }).source ?? "Google News",
    snippet: item.contentSnippet,
  }));
}

export async function searchGoogleNews(
  query: string,
  limit = 10
): Promise<GoogleNewsItem[]> {
  const url = `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`;
  const feed = await parser.parseURL(url);
  return feed.items.slice(0, limit).map((item) => ({
    title: item.title ?? "",
    link: item.link ?? "",
    pubDate: item.pubDate ?? "",
    source: (item as unknown as { source?: string }).source ?? "Google News",
    snippet: item.contentSnippet,
  }));
}
