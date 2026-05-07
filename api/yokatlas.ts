import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
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

    const url = `https://yokatlas.yok.gov.tr${path}`;
    const fetchHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "tercih-robotu/1.0",
    };
    if (req.method !== "GET") {
      fetchHeaders["Content-Type"] = "application/json";
    }

    const fetchRes = await fetch(url, {
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
    res.status(500).json({ error: err.message || "Bilinmeyen hata" });
  }
}
