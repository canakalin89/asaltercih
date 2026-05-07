import type { Program, SearchFiltersPayload, SearchPage } from "./types";

const PROXY_BASE = "/api/yokatlas?path=";

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${encodeURIComponent(path)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`YÖK Atlas hatası: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${PROXY_BASE}${encodeURIComponent(path)}`, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`YÖK Atlas hatası: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

export interface SearchParams {
  puan_turu?: string | null;
  universite_id?: number[];
  birim_grup_id?: number[];
  il_kodu?: number[];
  birim_turu_id?: number | null;
  universite_turu?: "DEVLET" | "VAKIF" | null;
  burs_orani_id?: number | null;
  ogrenim_turu_id?: number | null;
  kilavuz_kodu?: number | null;
  min_basari_sirasi?: number | null;
  max_basari_sirasi?: number | null;
  page?: number;
  size?: number;
}

export async function searchPrograms(params: SearchParams = {}): Promise<SearchPage> {
  const filters: SearchFiltersPayload = {
    puanTuru: params.puan_turu ?? null,
    universiteId: params.universite_id ?? [],
    birimGrupId: params.birim_grup_id ?? [],
    ilKodu: params.il_kodu ?? [],
    birimTuruId: params.birim_turu_id ?? null,
    universiteTuru: params.universite_turu ?? null,
    bursOraniId: params.burs_orani_id ?? null,
    ogrenimTuruId: params.ogrenim_turu_id ?? null,
    kilavuzKodu: params.kilavuz_kodu ?? null,
    minBasariSirasi: params.min_basari_sirasi ?? null,
    maxBasariSirasi: params.max_basari_sirasi ?? null,
  };

  const body = {
    filters,
    page: params.page ?? 0,
    size: params.size ?? 500,
    sortBy: "basariSirasi",
    direction: "ASC",
  };

  const raw = await postJson<Record<string, unknown>>("/api/tercih-kilavuz/search", body);
  return mapSearchPage(raw);
}

function mapSearchPage(raw: Record<string, unknown>): SearchPage {
  const content = Array.isArray(raw.content) ? raw.content.map(mapProgram) : [];
  return {
    content,
    totalElements: Number(raw.totalElements ?? 0),
    totalPages: Number(raw.totalPages ?? 0),
    size: Number(raw.size ?? 0),
    number: Number(raw.number ?? 0),
    first: Boolean(raw.first),
    last: Boolean(raw.last),
    numberOfElements: Number(raw.numberOfElements ?? 0),
    empty: Boolean(raw.empty),
    yil: raw.yil != null ? Number(raw.yil) : null,
  };
}

function mapProgram(data: unknown): Program {
  const d = data as Record<string, unknown>;

  const currentYear = Number(d.yil ?? d.year ?? 0);
  const current = buildYearlyStats(d, "", currentYear);
  const history: { year: number; kontenjan: number | null; yerlesen: number | null; min_puan: number | null; basari_sirasi: number | null; prof: number | null; doc: number | null; dou: number | null; ogr_gor: number | null; ar_gor: number | null; kpss1: number | null; kpss2: number | null; }[] = [];
  for (let offset = 1; offset <= 3; offset++) {
    history.push(buildYearlyStats(d, String(offset), currentYear - offset));
  }

  return {
    kilavuz_kodu: Number(d.kilavuzKodu ?? d.kilavuz_kodu ?? 0),
    universite_adi: String(d.universiteAdi ?? d.universite_adi ?? ""),
    birim_adi: String(d.birimAdi ?? d.birim_adi ?? ""),
    birim_grup_adi: d.birimGrupAdi != null || d.birim_grup_adi != null
      ? String(d.birimGrupAdi ?? d.birim_grup_adi)
      : null,
    birim_turu_adi: (d.birimTuruAdi ?? d.birim_turu_adi ?? "LISANS") as "LISANS" | "ONLISANS",
    puan_turu: String(d.puanTuru ?? d.puan_turu ?? ""),
    universite_turu: (d.universiteTuru ?? d.universite_turu ?? "DEVLET") as "DEVLET" | "VAKIF",
    ogrenim_dili_adi: d.ogrenimDiliAdi != null || d.ogrenim_dili_adi != null
      ? String(d.ogrenimDiliAdi ?? d.ogrenim_dili_adi)
      : null,
    ogrenim_turu_adi: d.ogrenimTuruAdi != null || d.ogrenim_turu_adi != null
      ? String(d.ogrenimTuruAdi ?? d.ogrenim_turu_adi)
      : null,
    ogrenim_suresi: d.ogrenimSuresi != null || d.ogrenim_suresi != null
      ? Number(d.ogrenimSuresi ?? d.ogrenim_suresi)
      : null,
    il_adi: d.ilAdi != null || d.il_adi != null
      ? String(d.ilAdi ?? d.il_adi)
      : null,
    ilce_adi: d.ilceAdi != null || d.ilce_adi != null
      ? String(d.ilceAdi ?? d.ilce_adi)
      : null,
    burs_orani_adi: d.bursOraniAdi != null || d.burs_orani_adi != null
      ? String(d.bursOraniAdi ?? d.burs_orani_adi)
      : null,
    current,
    history,
  };
}

function buildYearlyStats(
  data: Record<string, unknown>,
  suffix: string,
  year: number
): { year: number; kontenjan: number | null; yerlesen: number | null; min_puan: number | null; basari_sirasi: number | null; prof: number | null; doc: number | null; dou: number | null; ogr_gor: number | null; ar_gor: number | null; kpss1: number | null; kpss2: number | null; } {
  const get = (camel: string, snake: string): number | null => {
    const keyCamel = suffix ? `${camel}${suffix}` : camel;
    const keySnake = suffix ? `${snake}_${suffix}` : snake;
    const val = data[keyCamel] ?? data[keySnake];
    if (val == null || val === "") return null;
    const n = Number(val);
    return Number.isFinite(n) ? n : null;
  };

  return {
    year,
    kontenjan: get("kontenjan", "kontenjan"),
    yerlesen: get("gkY", "yerlesen"),
    min_puan: get("minPuan", "min_puan"),
    basari_sirasi: get("basariSirasi", "basari_sirasi"),
    prof: get("prof", "prof"),
    doc: get("doc", "doc"),
    dou: get("dou", "dou"),
    ogr_gor: get("ogrGor", "ogr_gor"),
    ar_gor: get("arGor", "ar_gor"),
    kpss1: get("kpss1", "kpss1"),
    kpss2: get("kpss2", "kpss2"),
  };
}

export async function listUniversities(): Promise<{ universite_id: number; universite_adi: string }[]> {
  const raw = await getJson<unknown[]>("/api/tercih-kilavuz/universiteler");
  return raw.map((u: unknown) => {
    const x = u as Record<string, unknown>;
    return {
      universite_id: Number(x.universiteId ?? x.universite_id ?? 0),
      universite_adi: String(x.universiteAdi ?? x.universite_adi ?? ""),
    };
  });
}

export async function listCities(): Promise<{ il_kodu: number; il_adi: string }[]> {
  const raw = await getJson<unknown[]>("/api/tercih-kilavuz/universite-iller");
  return raw.map((c: unknown) => {
    const x = c as Record<string, unknown>;
    return {
      il_kodu: Number(x.ilKodu ?? x.il_kodu ?? 0),
      il_adi: String(x.ilAdi ?? x.il_adi ?? ""),
    };
  });
}

export async function listProgramGroups(): Promise<{ birim_grup_id: number; birim_grup_adi: string; puan_turu: string }[]> {
  const raw = await getJson<unknown[]>("/api/tercih-kilavuz/universite-programlar");
  return raw.map((p: unknown) => {
    const x = p as Record<string, unknown>;
    return {
      birim_grup_id: Number(x.birimGrupId ?? x.birim_grup_id ?? 0),
      birim_grup_adi: String(x.birimGrupAdi ?? x.birim_grup_adi ?? ""),
      puan_turu: String(x.puanTuru ?? x.puan_turu ?? ""),
    };
  });
}
