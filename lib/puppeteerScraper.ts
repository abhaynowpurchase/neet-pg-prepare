/**
 * Puppeteer-based scraper for JS-heavy medical PYQ sites.
 * Falls back gracefully when Puppeteer is unavailable.
 */

export interface ScrapeResult {
  url: string;
  text: string;
}

// Target sites with known PYQ content
export const PYQ_SOURCES: Record<string, string[]> = {
  NEET_PG: [
    "https://www.neetpgexam.in/previous-year-papers/",
    "https://www.doctorsacademy.org/neet-pg/",
    "https://medicalpg.in/neet-pg-questions/",
  ],
  INI_CET: [
    "https://www.neetpgexam.in/ini-cet-previous-year-papers/",
    "https://www.doctorsacademy.org/ini-cet/",
  ],
  UPSC_CMO: [
    "https://www.neetpgexam.in/upsc-cms-previous-year-papers/",
    "https://www.upsc.gov.in/examinations/previous-year-question-papers/combined-medical-services-exam",
  ],
};

/** Build year-specific DuckDuckGo search queries */
export function buildYearQueries(
  chapter: string,
  subject: string,
  examType: string,
  year: number
): string[] {
  const examLabel =
    examType === "NEET_PG"
      ? "NEET PG"
      : examType === "INI_CET"
      ? "INI-CET AIIMS"
      : "UPSC CMO CMS";

  return [
    `"${examLabel}" ${year} "${chapter}" MCQ question answer`,
    `${examLabel} ${year} ${subject} ${chapter} previous year question solved`,
    `${examLabel} ${year} ${chapter} MCQ options explanation`,
  ];
}

/** Puppeteer scrape with timeout. Returns page text or empty string. */
export async function puppeteerFetch(
  url: string,
  timeoutMs = 20000
): Promise<string> {
  try {
    // Dynamic import so the app still works even if puppeteer isn't installed
    const puppeteer = await import("puppeteer");
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--window-size=1280,800",
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setUserAgent(
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36"
      );
      await page.setViewport({ width: 1280, height: 800 });

      await page.goto(url, {
        waitUntil: "domcontentloaded",
        timeout: timeoutMs,
      });

      // Wait a bit for dynamic content
      await new Promise((r) => setTimeout(r, 2000));

      // Extract text, remove scripts/styles
      const text: string = await page.evaluate(() => {
        const remove = document.querySelectorAll(
          "script, style, nav, header, footer, aside, .ads, .advertisement"
        );
        remove.forEach((el) => el.remove());
        return document.body?.innerText ?? "";
      });

      return text.slice(0, 8000);
    } finally {
      await browser.close();
    }
  } catch {
    return "";
  }
}

/** Try Puppeteer first, fall back to simple fetch */
export async function robustFetch(
  url: string,
  timeoutMs = 12000
): Promise<string> {
  // Try simple fetch first (faster)
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36",
        Accept: "text/html",
      },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const html = await res.text();
      const cleaned = html
        .replace(/<script[\s\S]*?<\/script>/gi, "")
        .replace(/<style[\s\S]*?<\/style>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
      if (cleaned.length > 500) return cleaned.slice(0, 8000);
    }
  } catch {
    // fall through to puppeteer
  }

  // Fall back to Puppeteer for JS-heavy sites
  return puppeteerFetch(url, timeoutMs);
}
