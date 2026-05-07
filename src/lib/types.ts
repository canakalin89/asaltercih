export interface YearlyStats {
  year: number;
  kontenjan: number | null;
  yerlesen: number | null;
  min_puan: number | null;
  basari_sirasi: number | null;
  prof: number | null;
  doc: number | null;
  dou: number | null;
  ogr_gor: number | null;
  ar_gor: number | null;
  kpss1: number | null;
  kpss2: number | null;
}

export interface Program {
  kilavuz_kodu: number;
  universite_adi: string;
  birim_adi: string;
  birim_grup_adi: string | null;
  birim_turu_adi: "LISANS" | "ONLISANS";
  puan_turu: string;
  universite_turu: "DEVLET" | "VAKIF";
  ogrenim_dili_adi: string | null;
  ogrenim_turu_adi: string | null;
  ogrenim_suresi: number | null;
  il_adi: string | null;
  ilce_adi: string | null;
  burs_orani_adi: string | null;
  current: YearlyStats;
  history: YearlyStats[];
}

export interface SearchFiltersPayload {
  puanTuru?: string | null;
  universiteId?: number[];
  birimGrupId?: number[];
  ilKodu?: number[];
  birimTuruId?: number | null;
  universiteTuru?: "DEVLET" | "VAKIF" | null;
  bursOraniId?: number | null;
  ogrenimTuruId?: number | null;
  kilavuzKodu?: number | null;
  minBasariSirasi?: number | null;
  maxBasariSirasi?: number | null;
}

export interface SearchPage {
  content: Program[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
  empty: boolean;
  yil: number | null;
}

export type PuanTuru = "SAY" | "SÖZ" | "EA" | "DİL" | "TYT";

export interface NetGiris {
  turkceDogru: number;
  turkceYanlis: number;
  sosyalDogru: number;
  sosyalYanlis: number;
  matTytDogru: number;
  matTytYanlis: number;
  fenDogru: number;
  fenYanlis: number;
  // AYT
  matAytDogru: number;
  matAytYanlis: number;
  fizikDogru: number;
  fizikYanlis: number;
  kimyaDogru: number;
  kimyaYanlis: number;
  biyolojiDogru: number;
  biyolojiYanlis: number;
  edebiyatDogru: number;
  edebiyatYanlis: number;
  tarih1Dogru: number;
  tarih1Yanlis: number;
  cografya1Dogru: number;
  cografya1Yanlis: number;
  tarih2Dogru: number;
  tarih2Yanlis: number;
  cografya2Dogru: number;
  cografya2Yanlis: number;
  felsefeDogru: number;
  felsefeYanlis: number;
  dinDogru: number;
  dinYanlis: number;
  dilDogru: number;
  dilYanlis: number;
}
