import type { Handler } from "@netlify/functions";

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

    const url = `https://yokatlas.yok.gov.tr${path}`;
    const fetchHeaders: Record<string, string> = {
      Accept: "application/json",
      "User-Agent": "tercih-robotu/1.0",
    };
    if (event.httpMethod !== "GET") {
      fetchHeaders["Content-Type"] = "application/json";
    }

    const fetchRes = await fetch(url, {
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
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: err.message || "Bilinmeyen hata" }),
    };
  }
};
