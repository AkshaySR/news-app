export interface RedditPost {
  id: string;
  title: string;
  url: string;
  permalink: string;
  subreddit: string;
  score: number;
  num_comments: number;
  created_utc: number;
  thumbnail?: string;
  selftext?: string;
  author: string;
}

const SUBREDDITS = ["news", "worldnews", "technology", "science"];
const REDDIT_BASE = "https://www.reddit.com";

export async function fetchReddit(
  subreddit = "news",
  limit = 10
): Promise<RedditPost[]> {
  const sub = SUBREDDITS.includes(subreddit) ? subreddit : "news";
  const res = await fetch(
    `${REDDIT_BASE}/r/${sub}/top.json?limit=${limit}&t=day`,
    { headers: { "User-Agent": "news-mcp-server/1.0" } }
  );
  if (!res.ok) throw new Error(`Reddit API error: ${res.status}`);
  const data = await res.json();
  return data.data.children.map((c: { data: RedditPost }) => c.data);
}

export async function fetchMultipleSubreddits(limit = 10): Promise<RedditPost[]> {
  const results = await Promise.allSettled(
    ["news", "worldnews"].map((sub) => fetchReddit(sub, limit))
  );
  return results
    .filter((r): r is PromiseFulfilledResult<RedditPost[]> => r.status === "fulfilled")
    .flatMap((r) => r.value)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
