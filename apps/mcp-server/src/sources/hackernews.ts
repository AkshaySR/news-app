export interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  descendants?: number;
  type: string;
}

const HN_BASE = "https://hacker-news.firebaseio.com/v0";

async function fetchItem(id: number): Promise<HNStory | null> {
  const res = await fetch(`${HN_BASE}/item/${id}.json`);
  if (!res.ok) return null;
  return res.json();
}

export async function fetchHackerNews(limit = 10): Promise<HNStory[]> {
  const res = await fetch(`${HN_BASE}/topstories.json`);
  if (!res.ok) throw new Error(`HackerNews API error: ${res.status}`);
  const ids: number[] = await res.json();

  const topIds = ids.slice(0, limit * 2);
  const stories = await Promise.all(topIds.map(fetchItem));

  return stories
    .filter((s): s is HNStory => s !== null && s.type === "story" && !!s.title)
    .slice(0, limit);
}
