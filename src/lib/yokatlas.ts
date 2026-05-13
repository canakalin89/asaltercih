import type { Program, SearchFiltersPayload, SearchPage } from "./types";

const PROXY_BASE = "/api/yokatlas?path=";

// ============================================================
// LOCAL DATA CACHE (from Excel-derived JSON)
// ============================================================

let localCache: Program[] | null = null;
let localLoading = false;

const cityMap = new Map<number, string>();

async function loadLocalPrograms(): Promise<Program[]> {
  if (localCache) return localCache;
  if (localLoading) {
    // Wait for existing load
    while (localLoading) {
      await new Promise((r) => setTimeout(r, 50));
    }
    return localCache ?? [];
  }

  localLoading = true;
  try {
    const res = await fetch("/data/programs-2025.json");
    if (!res.ok) {
      throw new Error(`Local data fetch failed: ${res.status}`);
    }
    const data = (await res.json()) as Program[];
    localCache = data;
    // Build city map from local data
    cityMap.clear();
    const seen = new Set<string>();
    let nextCode = 1;
    for (const p of data) {
      if (p.il_adi && !seen.has(p.il_adi)) {
        seen.add(p.il_adi);
        cityMap.set(nextCode++, p.il_adi);
      }
    }
    return data;
  } catch (e) {
    console.warn("Local programs data not available, falling back to API:", e);
    // local data failed, will fall back to API
    return [];
  } finally {
    localLoading = false;
  }
}

function ilKoduToAdi(codes: number[]): string[] {
  return codes.map((c) => cityMap.get(c)).filter((a): a is string => !!a);
}

// ============================================================
// API HELPERS
// ============================================================

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

// ============================================================
// SEARCH
// ============================================================

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
  const local = await loadLocalPrograms();
  if (local.length > 0) {
    return searchLocal(local, params);
  }
  return searchApi(params);
}

function searchLocal(programs: Program[], params: SearchParams): SearchPage {
  const filtered = programs.filter((p) => {
    if (params.puan_turu && p.puan_turu !== params.puan_turu) return false;
    if (params.universite_id?.length && !params.universite_id.includes(p.universite_id)) return false;
    if (params.birim_grup_id?.length && !params.birim_grup_id.includes(p.birim_grup_id)) return false;
    if (params.birim_turu_id != null) {
      const expected = params.birim_turu_id === 46 ? "LISANS" : "ONLISANS";
      if (p.birim_turu_adi !== expected) return false;
    }
    if (params.universite_turu && p.universite_turu !== params.universite_turu) return false;
    if (params.il_kodu?.length) {
      const ilAdlari = ilKoduToAdi(params.il_kodu);
      if (!ilAdlari.includes(p.il_adi ?? "")) return false;
    }
    if (params.min_basari_sirasi != null && (p.current.basari_sirasi == null || p.current.basari_sirasi < params.min_basari_sirasi)) return false;
    if (params.max_basari_sirasi != null && (p.current.basari_sirasi == null || p.current.basari_sirasi > params.max_basari_sirasi)) return false;
    return true;
  });

  const page = params.page ?? 0;
  const size = params.size ?? 500;
  const start = page * size;
  const end = start + size;
  const content = filtered.slice(start, end);

  return {
    content,
    totalElements: filtered.length,
    totalPages: Math.ceil(filtered.length / size),
    size,
    number: page,
    first: page === 0,
    last: end >= filtered.length,
    numberOfElements: content.length,
    empty: content.length === 0,
    yil: 2024,
  };
}

async function searchApi(params: SearchParams): Promise<SearchPage> {
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
  const history: import("./types").YearlyStats[] = [];
  for (let offset = 1; offset <= 3; offset++) {
    history.push(buildYearlyStats(d, String(offset), currentYear - offset));
  }

  return {
    kilavuz_kodu: Number(d.kilavuzKodu ?? d.kilavuz_kodu ?? 0),
    universite_id: Number(d.universiteId ?? d.universite_id ?? 0),
    universite_adi: String(d.universiteAdi ?? d.universite_adi ?? ""),
    birim_adi: String(d.birimAdi ?? d.birim_adi ?? ""),
    birim_grup_id: Number(d.birimGrupId ?? d.birim_grup_id ?? 0),
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
): import("./types").YearlyStats {
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
    son_kayit_tyt_net: get("sonKayitTytNet", "son_kayit_tyt_net"),
    son_kayit_ayt_net: get("sonKayitAytNet", "son_kayit_ayt_net"),
    son_kayit_ydt_net: get("sonKayitYdtNet", "son_kayit_ydt_net"),
    prof: get("prof", "prof"),
    doc: get("doc", "doc"),
    dou: get("dou", "dou"),
    ogr_gor: get("ogrGor", "ogr_gor"),
    ar_gor: get("arGor", "ar_gor"),
    kpss1: get("kpss1", "kpss1"),
    kpss2: get("kpss2", "kpss2"),
  };
}

// ============================================================
// GET PROGRAM BY ID
// ============================================================

export async function getProgram(kilavuzKodu: number): Promise<Program | null> {
  const local = await loadLocalPrograms();
  if (local.length > 0) {
    const found = local.find((p) => p.kilavuz_kodu === kilavuzKodu) ?? null;
    if (found) return found;
  }
  // Fallback to API
  try {
    const raw = await postJson<unknown>("/api/tercih-kilavuz/program", { kilavuzKodu });
    return mapProgram(raw);
  } catch {
    return null;
  }
}

// ============================================================
// UNIVERSITIES
// ============================================================

export async function listUniversities(): Promise<{ universite_id: number; universite_adi: string }[]> {
  const local = await loadLocalPrograms();
  if (local.length > 0) {
    const map = new Map<number, string>();
    for (const p of local) {
      if (!map.has(p.universite_id)) {
        map.set(p.universite_id, p.universite_adi);
      }
    }
    return Array.from(map.entries()).map(([universite_id, universite_adi]) => ({
      universite_id,
      universite_adi,
    }));
  }
  const raw = await getJson<unknown[]>("/api/tercih-kilavuz/universiteler");
  return raw.map((u: unknown) => {
    const x = u as Record<string, unknown>;
    return {
      universite_id: Number(x.universiteId ?? x.universite_id ?? 0),
      universite_adi: String(x.universiteAdi ?? x.universite_adi ?? ""),
    };
  });
}

// ============================================================
// CITIES
// ============================================================

export async function listCities(): Promise<{ il_kodu: number; il_adi: string }[]> {
  const local = await loadLocalPrograms();
  if (local.length > 0) {
    return Array.from(cityMap.entries()).map(([il_kodu, il_adi]) => ({ il_kodu, il_adi }));
  }
  const raw = await getJson<unknown[]>("/api/tercih-kilavuz/universite-iller");
  return raw.map((c: unknown) => {
    const x = c as Record<string, unknown>;
    return {
      il_kodu: Number(x.ilKodu ?? x.il_kodu ?? 0),
      il_adi: String(x.ilAdi ?? x.il_adi ?? ""),
    };
  });
}

// ============================================================
// PROGRAM GROUPS
// ============================================================

export async function listProgramGroups(): Promise<{ birim_grup_id: number; birim_grup_adi: string; puan_turu: string }[]> {
  const local = await loadLocalPrograms();
  if (local.length > 0) {
    const map = new Map<number, { ad: string; puan: string }>();
    for (const p of local) {
      if (!map.has(p.birim_grup_id)) {
        map.set(p.birim_grup_id, { ad: p.birim_grup_adi ?? "", puan: p.puan_turu });
      }
    }
    return Array.from(map.entries()).map(([birim_grup_id, v]) => ({
      birim_grup_id,
      birim_grup_adi: v.ad,
      puan_turu: v.puan,
    }));
  }
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

// ============================================================
// SON GİREN KİŞİNİN NETLERİ (TYT / AYT / YDT)
// ============================================================

export interface ProgramNets {
  tyt_net: number | null;   // TYT toplam net
  ayt_net: number | null;   // AYT toplam net
  ydt_net: number | null;   // YDT (yabancı dil) toplam net
  yil: number | null;
}

/**
 * YÖK Atlas API'sından belirtilen program için son yerleşen kişinin
 * TYT, AYT ve YDT netlerini getirir.
 * Yerel JSON'da verisi varsa doğrudan döner; yoksa API'ye sorgu atar.
 */
export async function fetchProgramNets(kilavuzKodu: number, yil = 2024): Promise<ProgramNets> {
  // 1. Check local cache first
  const local = await loadLocalPrograms();
  if (local.length > 0) {
    const prog = local.find((p) => p.kilavuz_kodu === kilavuzKodu);
    if (prog) {
      const s = prog.current;
      if (s.son_kayit_tyt_net != null || s.son_kayit_ayt_net != null || s.son_kayit_ydt_net != null) {
        return {
          tyt_net: s.son_kayit_tyt_net ?? null,
          ayt_net: s.son_kayit_ayt_net ?? null,
          ydt_net: s.son_kayit_ydt_net ?? null,
          yil: s.year,
        };
      }
    }
  }

  // 2. Fetch from YÖK Atlas API
  try {
    const raw = await postJson<Record<string, unknown>>(
      "/api/tercih-kilavuz/program",
      { kilavuzKodu, yil }
    );
    const tyt = raw.sonKayitTytNet ?? raw.son_kayit_tyt_net ?? null;
    const ayt = raw.sonKayitAytNet ?? raw.son_kayit_ayt_net ?? null;
    const ydt = raw.sonKayitYdtNet ?? raw.son_kayit_ydt_net ?? null;
    return {
      tyt_net: tyt != null ? Number(tyt) : null,
      ayt_net: ayt != null ? Number(ayt) : null,
      ydt_net: ydt != null ? Number(ydt) : null,
      yil: yil,
    };
  } catch {
    // API not available — return nulls
    return { tyt_net: null, ayt_net: null, ydt_net: null, yil: null };
  }
}
