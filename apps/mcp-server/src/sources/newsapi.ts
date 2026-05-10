export interface NewsAPIArticle {
  title: string;
  description?: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: { id: string | null; name: string };
  author?: string;
  content?: string;
}

const BASE = "https://newsapi.org/v2";

function getKey(): string {
  const key = process.env.NEWSAPI_KEY;
  if (!key) throw new Error("NEWSAPI_KEY environment variable is not set");
  return key;
}

export async function fetchTopHeadlines(
  category = "general",
  country = "us",
  limit = 10
): Promise<NewsAPIArticle[]> {
  const key = getKey();
  const url = `${BASE}/top-headlines?country=${country}&category=${category}&pageSize=${limit}&apiKey=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`NewsAPI error: ${res.status} ${(err as { message?: string }).message ?? ""}`);
  }
  const data = await res.json();
  return data.articles;
}

export async function searchNewsAPI(
  query: string,
  limit = 10
): Promise<NewsAPIArticle[]> {
  const key = getKey();
  const url = `${BASE}/everything?q=${encodeURIComponent(query)}&pageSize=${limit}&sortBy=publishedAt&language=en&apiKey=${key}`;
  const res = await fetch(url);
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`NewsAPI error: ${res.status} ${(err as { message?: string }).message ?? ""}`);
  }
  const data = await res.json();
  return data.articles;
}
