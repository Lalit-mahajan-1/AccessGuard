import type { Request, Response } from "express";
import { chromium } from "playwright";

export const crawlLinks = async (
  req: Request,
  res: Response,
): Promise<void> => {
  const { url } = req.body;

  if (!url) {
    res.status(400).json({ error: "URL is required" });
    return;
  }

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
    });
    const page = await context.newPage();

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

    const baseHost = new URL(url).hostname;

    const links = await page.evaluate((baseHost) => {
      const seen = new Set<string>();
      const results: string[] = [];

      const skipPatterns =
        /\.(jpg|jpeg|png|gif|svg|webp|css|js|pdf|zip|mp4)$|^(mailto:|tel:|javascript:|#)/i;

      document.querySelectorAll("a[href]").forEach((a) => {
        const href = (a as HTMLAnchorElement).href;
        const text = a.textContent?.trim() || "";

        if (!href || skipPatterns.test(href)) return;
        if (seen.has(href)) return;
        if (!text || text.length < 3) return;

        try {
          const host = new URL(href).hostname;
          if (host !== baseHost) return;
        } catch {
          return;
        }

        seen.add(href);
        results.push(href);
      });

      return results;
    }, baseHost);

    await browser.close();
    console.log(links.slice(0, 5))
    res.json({
      success: true,
      source: url,
      count: links.slice(0, 5).length,
      links: links.slice(0, 5),
    });
  } catch (err: any) {
    if (browser) await browser.close();
    res.status(500).json({ success: false, error: err.message });
  }
};
