export interface SearchResult {
  title: string;
  snippet: string;
  url: string;
}

/**
 * Searches via DuckDuckGo HTML endpoint — no API key, completely free.
 */
export async function searchWeb(query: string, numResults = 5): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;

  const res = await fetch(url, {
    headers: {
      "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!res.ok) throw new Error(`DuckDuckGo fetch failed: ${res.status}`);

  const html = await res.text();

  const titles: string[] = [];
  const snippets: string[] = [];
  const urls: string[] = [];

  // Extract titles
  const titleRx = /class="result__a"[^>]*>([^<]+)<\/a>/g;
  let m: RegExpExecArray | null;
  while ((m = titleRx.exec(html)) !== null) {
    titles.push(decodeEntities(m[1]));
  }

  // Extract snippets
  const snippetRx = /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
  while ((m = snippetRx.exec(html)) !== null) {
    snippets.push(decodeEntities(m[1].replace(/<[^>]+>/g, "")));
  }

  // Extract redirect URLs from DDG (format: /l/?uddg=ENCODED_URL)
  const urlRx = /href="\/l\/\?uddg=([^"&]+)/g;
  while ((m = urlRx.exec(html)) !== null) {
    try {
      urls.push(decodeURIComponent(m[1]));
    } catch {
      urls.push("");
    }
  }

  const count = Math.min(numResults, titles.length);
  const results: SearchResult[] = [];
  for (let i = 0; i < count; i++) {
    results.push({
      title: titles[i] ?? "",
      snippet: snippets[i] ?? "",
      url: urls[i] ?? "",
    });
  }

  return results;
}

function decodeEntities(str: string): string {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/** Fetch actual page text content from a URL (deep scrape) */
export async function fetchPageContent(url: string, maxChars = 6000): Promise<string> {
  if (!url || !url.startsWith("http")) return "";

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!res.ok) return "";

    const contentType = res.headers.get("content-type") ?? "";
    if (!contentType.includes("text/html")) return "";

    const html = await res.text();

    // Remove scripts, styles, nav, footer, header
    const cleaned = html
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<nav[\s\S]*?<\/nav>/gi, "")
      .replace(/<footer[\s\S]*?<\/footer>/gi, "")
      .replace(/<header[\s\S]*?<\/header>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s{2,}/g, " ")
      .trim();

    return cleaned.slice(0, maxChars);
  } catch {
    return "";
  }
}

/** Build a combined context string from search results for the AI prompt */
export function buildSearchContext(results: SearchResult[]): string {
  if (results.length === 0) return "(no search results)";
  return results
    .map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`)
    .join("\n\n");
}
