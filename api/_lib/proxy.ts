const YOKATLAS_BASE = "https://yokatlas.yok.gov.tr";

export async function fetchYokAtlas(
  path: string,
  method: string,
  body?: string
): Promise<{ status: number; headers: Record<string, string>; text: string }> {
  const url = `${YOKATLAS_BASE}${path}`;

  const fetchHeaders: Record<string, string> = {
    Accept: "application/json",
    "User-Agent": "tercih-robotu/1.0",
  };
  if (method !== "GET" && body) {
    fetchHeaders["Content-Type"] = "application/json";
  }

  const res = await fetch(url, {
    method,
    headers: fetchHeaders,
    body: method !== "GET" ? body : undefined,
  });

  const text = await res.text();
  const headers: Record<string, string> = {};
  res.headers.forEach((v, k) => {
    headers[k] = v;
  });

  return { status: res.status, headers, text };
}
