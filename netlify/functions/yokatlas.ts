import type { Handler } from "@netlify/functions";

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

export const handler: Handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    };
  }

  try {
    const path = event.queryStringParameters?.path;

    if (!path || !path.startsWith("/api/")) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Geçersiz path" }),
      };
    }

    const url = `${YOKATLAS_BASE}${path}`;
    const fetchHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "tercih-robotu/1.0",
    };
    if (event.httpMethod !== "GET") {
      fetchHeaders["Content-Type"] = "application/json";
    }

    const fetchRes = await fetchWithRetry(url, {
      method: event.httpMethod,
      headers: fetchHeaders,
      body: event.httpMethod !== "GET" ? event.body : undefined,
    });

    const text = await fetchRes.text();
    return {
      statusCode: fetchRes.status,
      headers: {
        "Content-Type": fetchRes.headers.get("content-type") || "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: text,
    };
  } catch (err: any) {
    console.error("YokAtlas proxy hatası:", err);
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "YÖK Atlas bağlantı hatası" }),
    };
  }
};
