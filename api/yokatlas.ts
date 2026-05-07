import type { VercelRequest, VercelResponse } from "@vercel/node";
import { fetchYokAtlas } from "../src/lib/proxy";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS preflight
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.status(200).end();
    return;
  }

  const path = req.query.path as string | undefined;
  if (!path || !path.startsWith("/api/")) {
    res.status(400).json({ error: "Geçersiz path" });
    return;
  }

  try {
    const body = req.method !== "GET" ? JSON.stringify(req.body) : undefined;
    const yokRes = await fetchYokAtlas(path, req.method, body);

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", yokRes.headers["content-type"] || "application/json");
    res.status(yokRes.status).send(yokRes.text);
  } catch (err) {
    console.error("Proxy hatası:", err);
    res.status(502).json({ error: "YÖK Atlas bağlantı hatası" });
  }
}
