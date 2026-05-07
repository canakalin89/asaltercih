import type { Handler } from "@netlify/functions";
import { fetchYokAtlas } from "../../src/lib/proxy";

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

  const path = event.queryStringParameters?.path;
  if (!path || !path.startsWith("/api/")) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "Geçersiz path" }),
    };
  }

  try {
    const body = event.httpMethod !== "GET" ? event.body : undefined;
    const yokRes = await fetchYokAtlas(path, event.httpMethod, body || undefined);

    return {
      statusCode: yokRes.status,
      headers: {
        "Content-Type": yokRes.headers["content-type"] || "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: yokRes.text,
    };
  } catch (err) {
    console.error("Proxy hatası:", err);
    return {
      statusCode: 502,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ error: "YÖK Atlas bağlantı hatası" }),
    };
  }
};
