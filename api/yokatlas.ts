import type { VercelRequest, VercelResponse } from "@vercel/node";

const YOKATLAS_BASE = "https://yokatlas.yok.gov.tr";
const MAX_RETRIES = 3;

async function fetchWithRetry(url: string, init: RequestInit): Promise<Response> {
  let lastError: Error | undefined;
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const res = await fetch(url, init);
      if (res.status >= 500) {
        const text = await res.text();
        console.warn(`YÖK Atlas ${res.status} (deneme ${i + 1}):`, text.slice(0, 200));
        lastError = new Error(`YÖK Atlas ${res.status}`);
        await new Promise((r) => setTimeout(r, 500 * (i + 1)));
        continue;
      }
      return res;
    } catch (err) {
      lastError = err as Error;
      console.warn(`Fetch hatası (deneme ${i + 1}):`, lastError.message);
      await new Promise((r) => setTimeout(r, 500 * (i + 1)));
    }
  }
  throw lastError || new Error("YÖK Atlas'a erişilemedi");
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return;
  }

  try {
    const rawPath = req.query.path;
    const path = Array.isArray(rawPath) ? rawPath[0] : rawPath;

    if (!path || typeof path !== "string" || !path.startsWith("/api/")) {
      res.status(400).json({ error: "Geçersiz path" });
      return;
    }

    const url = `${YOKATLAS_BASE}${path}`;
    const fetchHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "tercih-robotu/1.0",
    };
    if (req.method !== "GET") {
      fetchHeaders["Content-Type"] = "application/json";
    }

    const fetchRes = await fetchWithRetry(url, {
      method: req.method,
      headers: fetchHeaders,
      body: req.method !== "GET" ? JSON.stringify(req.body) : undefined,
    });

    const text = await fetchRes.text();
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", fetchRes.headers.get("content-type") || "application/json");
    res.status(fetchRes.status).send(text);
  } catch (err: any) {
    console.error("YokAtlas proxy hatası:", err);
    res.status(502).json({ error: err.message || "YÖK Atlas bağlantı hatası" });
  }
}
