import type { NetGiris, PuanTuru } from "./types";

// 2025 YKS katsayilari (OSYM kılavuzuna göre tahmini degerler)
const TYT_BASLANGIC = 144.95;
const TYT_KATSAYI = {
  turkce: 2.91,
  sosyal: 2.94,
  mat: 2.93,
  fen: 3.15,
};

const AYT_SAY_KATSAYI = {
  mat: 3.19,
  fizik: 2.43,
  kimya: 3.07,
  biyoloji: 2.51,
};

const AYT_SOZ_KATSAYI = {
  edebiyat: 3.06,
  tarih1: 2.57,
  cografya1: 3.16,
  tarih2: 2.57,
  cografya2: 3.16,
  felsefe: 3.85,
  din: 2.57,
};

const AYT_EA_KATSAYI = {
  mat: 3.28,
  edebiyat: 2.83,
  tarih1: 2.38,
  cografya1: 2.54,
};

const AYT_DIL_KATSAYI = {
  dil: 2.61,
};

const OBP_KATSAYI = 0.12;

function net(dogru: number, yanlis: number, maxSoru: number): number {
  const d = Math.min(Math.max(dogru, 0), maxSoru);
  const y = Math.min(Math.max(yanlis, 0), maxSoru - d);
  return Math.max(0, d - y / 4);
}

// ============================================================
// TYT PUAN
// ============================================================

export function hesaplaTytPuan(n: NetGiris): number {
  const turkceNet = net(n.turkceDogru, n.turkceYanlis, 40);
  const sosyalNet = net(n.sosyalDogru, n.sosyalYanlis, 20);
  const matNet = net(n.matTytDogru, n.matTytYanlis, 40);
  const fenNet = net(n.fenDogru, n.fenYanlis, 20);

  return (
    TYT_BASLANGIC +
    turkceNet * TYT_KATSAYI.turkce +
    sosyalNet * TYT_KATSAYI.sosyal +
    matNet * TYT_KATSAYI.mat +
    fenNet * TYT_KATSAYI.fen
  );
}

// ============================================================
// AYT PUANLARI
// ============================================================

export function hesaplaSayPuan(n: NetGiris): number {
  const matNet = net(n.matAytDogru, n.matAytYanlis, 40);
  const fizikNet = net(n.fizikDogru, n.fizikYanlis, 14);
  const kimyaNet = net(n.kimyaDogru, n.kimyaYanlis, 13);
  const biyolojiNet = net(n.biyolojiDogru, n.biyolojiYanlis, 13);

  return (
    matNet * AYT_SAY_KATSAYI.mat +
    fizikNet * AYT_SAY_KATSAYI.fizik +
    kimyaNet * AYT_SAY_KATSAYI.kimya +
    biyolojiNet * AYT_SAY_KATSAYI.biyoloji
  );
}

export function hesaplaSozPuan(n: NetGiris): number {
  const edebiyatNet = net(n.edebiyatDogru, n.edebiyatYanlis, 24);
  const tarih1Net = net(n.tarih1Dogru, n.tarih1Yanlis, 10);
  const cografya1Net = net(n.cografya1Dogru, n.cografya1Yanlis, 6);
  const tarih2Net = net(n.tarih2Dogru, n.tarih2Yanlis, 10);
  const cografya2Net = net(n.cografya2Dogru, n.cografya2Yanlis, 6);
  const felsefeNet = net(n.felsefeDogru, n.felsefeYanlis, 12);
  const dinNet = net(n.dinDogru, n.dinYanlis, 6);

  return (
    edebiyatNet * AYT_SOZ_KATSAYI.edebiyat +
    tarih1Net * AYT_SOZ_KATSAYI.tarih1 +
    cografya1Net * AYT_SOZ_KATSAYI.cografya1 +
    tarih2Net * AYT_SOZ_KATSAYI.tarih2 +
    cografya2Net * AYT_SOZ_KATSAYI.cografya2 +
    felsefeNet * AYT_SOZ_KATSAYI.felsefe +
    dinNet * AYT_SOZ_KATSAYI.din
  );
}

export function hesaplaEaPuan(n: NetGiris): number {
  const matNet = net(n.matAytDogru, n.matAytYanlis, 40);
  const edebiyatNet = net(n.edebiyatDogru, n.edebiyatYanlis, 24);
  const tarih1Net = net(n.tarih1Dogru, n.tarih1Yanlis, 10);
  const cografya1Net = net(n.cografya1Dogru, n.cografya1Yanlis, 6);

  return (
    matNet * AYT_EA_KATSAYI.mat +
    edebiyatNet * AYT_EA_KATSAYI.edebiyat +
    tarih1Net * AYT_EA_KATSAYI.tarih1 +
    cografya1Net * AYT_EA_KATSAYI.cografya1
  );
}

export function hesaplaDilPuan(n: NetGiris): number {
  const dilNet = net(n.dilDogru, n.dilYanlis, 80);
  return dilNet * AYT_DIL_KATSAYI.dil;
}

// ============================================================
// YERLEŞTIRME PUANI
// ============================================================

export function hesaplaYerlestirmePuan(
  tytPuan: number,
  aytPuan: number,
  obp: number
): number {
  // obp: diploma notu (0-100). Gercek OBP = obp * 5
  const obpDegeri = Math.min(Math.max(obp, 0), 100) * 5;
  return tytPuan * 0.4 + aytPuan * 0.6 + obpDegeri * OBP_KATSAYI;
}

export function defaultNetGiris(): NetGiris {
  return {
    turkceDogru: 0, turkceYanlis: 0,
    sosyalDogru: 0, sosyalYanlis: 0,
    matTytDogru: 0, matTytYanlis: 0,
    fenDogru: 0, fenYanlis: 0,
    matAytDogru: 0, matAytYanlis: 0,
    fizikDogru: 0, fizikYanlis: 0,
    kimyaDogru: 0, kimyaYanlis: 0,
    biyolojiDogru: 0, biyolojiYanlis: 0,
    edebiyatDogru: 0, edebiyatYanlis: 0,
    tarih1Dogru: 0, tarih1Yanlis: 0,
    cografya1Dogru: 0, cografya1Yanlis: 0,
    tarih2Dogru: 0, tarih2Yanlis: 0,
    cografya2Dogru: 0, cografya2Yanlis: 0,
    felsefeDogru: 0, felsefeYanlis: 0,
    dinDogru: 0, dinYanlis: 0,
    dilDogru: 0, dilYanlis: 0,
  };
}

// ============================================================
// TERSINE HESAPLAMA (Hedef Puana Göre Gereken Netler)
// ============================================================

export interface GerekenNetler {
  tytNet: number;
  tytDersler: { ad: string; net: number }[];
  aytToplamNet: number;
  aytDersler: { ad: string; net: number }[];
  toplamYP: number;
  hedefYP: number;
  obp: number;
  mumkun: boolean;
  mesaj?: string;
}

const TYT_DAGILIM = [
  { ad: "TYT Türkçe", oran: 40 / 120 },
  { ad: "TYT Sosyal", oran: 20 / 120 },
  { ad: "TYT Matematik", oran: 40 / 120 },
  { ad: "TYT Fen", oran: 20 / 120 },
];

const SAY_DAGILIM = [
  { ad: "AYT Matematik", oran: 40 / 80 },
  { ad: "Fizik", oran: 14 / 80 },
  { ad: "Kimya", oran: 13 / 80 },
  { ad: "Biyoloji", oran: 13 / 80 },
];

const SOZ_DAGILIM = [
  { ad: "Edebiyat", oran: 24 / 74 },
  { ad: "Tarih-1", oran: 10 / 74 },
  { ad: "Coğrafya-1", oran: 6 / 74 },
  { ad: "Tarih-2", oran: 10 / 74 },
  { ad: "Coğrafya-2", oran: 6 / 74 },
  { ad: "Felsefe", oran: 12 / 74 },
  { ad: "Din K./A.B.", oran: 6 / 74 },
];

const EA_DAGILIM = [
  { ad: "AYT Matematik", oran: 40 / 80 },
  { ad: "Edebiyat", oran: 24 / 80 },
  { ad: "Tarih-1", oran: 10 / 80 },
  { ad: "Coğrafya-1", oran: 6 / 80 },
];

const DIL_DAGILIM = [
  { ad: "Yabancı Dil", oran: 80 / 80 },
];

export function hesaplaGerekenNetler(
  hedefYP: number,
  obp: number,
  tytNet: number,
  puanTuru: PuanTuru
): GerekenNetler {
  const ortTytKatsayi = (TYT_KATSAYI.turkce + TYT_KATSAYI.sosyal + TYT_KATSAYI.mat + TYT_KATSAYI.fen) / 4;
  const tytPuanBasit = TYT_BASLANGIC + tytNet * ortTytKatsayi;

  const obpDegeri = Math.min(Math.max(obp, 0), 100) * 5;
  const gerekenAytPuan = (hedefYP - tytPuanBasit * 0.4 - obpDegeri * OBP_KATSAYI) / 0.6;

  const tytDersler = TYT_DAGILIM.map((d) => ({
    ad: d.ad,
    net: tytNet * d.oran,
  }));
  const tytToplamHesaplanan = tytDersler.reduce((s, d) => s + d.net, 0);
  if (tytDersler.length > 0 && Math.abs(tytToplamHesaplanan - tytNet) > 0.001) {
    tytDersler[tytDersler.length - 1].net += tytNet - tytToplamHesaplanan;
  }

  if (gerekenAytPuan <= 0) {
    return {
      tytNet,
      tytDersler,
      aytToplamNet: 0,
      aytDersler: [],
      toplamYP: tytPuanBasit * 0.4 + obpDegeri * OBP_KATSAYI,
      hedefYP,
      obp,
      mumkun: false,
      mesaj: `TYT netin (${tytNet.toFixed(1)}) ve OBP'n (${obp}) bu hedef için yeterli görünüyor. AYT'ye girmesen bile yerleşebilirsin.`,
    };
  }

  let dagilim: { ad: string; oran: number }[];
  let ortAytKatsayi: number;

  switch (puanTuru) {
    case "SAY":
      dagilim = SAY_DAGILIM;
      ortAytKatsayi = (AYT_SAY_KATSAYI.mat + AYT_SAY_KATSAYI.fizik + AYT_SAY_KATSAYI.kimya + AYT_SAY_KATSAYI.biyoloji) / 4;
      break;
    case "SÖZ":
      dagilim = SOZ_DAGILIM;
      ortAytKatsayi = Object.values(AYT_SOZ_KATSAYI).reduce((a, b) => a + b, 0) / Object.values(AYT_SOZ_KATSAYI).length;
      break;
    case "EA":
      dagilim = EA_DAGILIM;
      ortAytKatsayi = (AYT_EA_KATSAYI.mat + AYT_EA_KATSAYI.edebiyat + AYT_EA_KATSAYI.tarih1 + AYT_EA_KATSAYI.cografya1) / 4;
      break;
    case "DİL":
      dagilim = DIL_DAGILIM;
      ortAytKatsayi = AYT_DIL_KATSAYI.dil;
      break;
    case "TYT":
      return {
        tytNet,
        tytDersler,
        aytToplamNet: 0,
        aytDersler: [],
        toplamYP: tytPuanBasit * 0.4 + obpDegeri * OBP_KATSAYI,
        hedefYP,
        obp,
        mumkun: true,
        mesaj: "TYT puan türü için sadece TYT neti yeterli.",
      };
    default:
      dagilim = [];
      ortAytKatsayi = 3;
  }

  const aytToplamNet = gerekenAytPuan / ortAytKatsayi;

  const aytDersler = dagilim.map((d) => ({
    ad: d.ad,
    net: aytToplamNet * d.oran,
  }));

  const aytToplamHesaplanan = aytDersler.reduce((s, d) => s + d.net, 0);
  if (aytDersler.length > 0 && Math.abs(aytToplamHesaplanan - aytToplamNet) > 0.001) {
    aytDersler[aytDersler.length - 1].net += aytToplamNet - aytToplamHesaplanan;
  }

  return {
    tytNet,
    tytDersler,
    aytToplamNet,
    aytDersler,
    toplamYP: tytPuanBasit * 0.4 + gerekenAytPuan * 0.6 + obpDegeri * OBP_KATSAYI,
    hedefYP,
    obp,
    mumkun: true,
  };
}
