import type { NetGiris, PuanTuru } from "./types";

// 2025 YKS puan hesaplama sabitleri (yaklaşık, ÖSYM kılavuzuna göre)
const TYT_TEMEL = 100;
const TYT_KATSAYI = 3.3;
const AYT_TEMEL = 100;
const AYT_KATSAYI = 3;
const OBP_KATSAYI = 0.12;

function net(dogru: number, yanlis: number, maxSoru: number): number {
  const d = Math.min(Math.max(dogru, 0), maxSoru);
  const y = Math.min(Math.max(yanlis, 0), maxSoru - d);
  return Math.max(0, d - y / 4);
}

export function hesaplaTytHam(n: NetGiris): number {
  const turkceNet = net(n.turkceDogru, n.turkceYanlis, 40);
  const sosyalNet = net(n.sosyalDogru, n.sosyalYanlis, 20);
  const matNet = net(n.matTytDogru, n.matTytYanlis, 40);
  const fenNet = net(n.fenDogru, n.fenYanlis, 20);
  return (
    TYT_TEMEL +
    turkceNet * TYT_KATSAYI +
    sosyalNet * TYT_KATSAYI +
    matNet * TYT_KATSAYI +
    fenNet * TYT_KATSAYI
  );
}

export function hesaplaSayHam(n: NetGiris): number {
  const matNet = net(n.matAytDogru, n.matAytYanlis, 40);
  const fizikNet = net(n.fizikDogru, n.fizikYanlis, 14);
  const kimyaNet = net(n.kimyaDogru, n.kimyaYanlis, 13);
  const biyolojiNet = net(n.biyolojiDogru, n.biyolojiYanlis, 13);
  return (
    AYT_TEMEL +
    matNet * AYT_KATSAYI +
    fizikNet * AYT_KATSAYI +
    kimyaNet * AYT_KATSAYI +
    biyolojiNet * AYT_KATSAYI
  );
}

export function hesaplaSozHam(n: NetGiris): number {
  const edebiyatNet = net(n.edebiyatDogru, n.edebiyatYanlis, 24);
  const tarih1Net = net(n.tarih1Dogru, n.tarih1Yanlis, 10);
  const cografya1Net = net(n.cografya1Dogru, n.cografya1Yanlis, 6);
  const tarih2Net = net(n.tarih2Dogru, n.tarih2Yanlis, 10);
  const cografya2Net = net(n.cografya2Dogru, n.cografya2Yanlis, 6);
  const felsefeNet = net(n.felsefeDogru, n.felsefeYanlis, 12);
  const dinNet = net(n.dinDogru, n.dinYanlis, 6);
  return (
    AYT_TEMEL +
    edebiyatNet * AYT_KATSAYI +
    tarih1Net * AYT_KATSAYI +
    cografya1Net * AYT_KATSAYI +
    tarih2Net * AYT_KATSAYI +
    cografya2Net * AYT_KATSAYI +
    felsefeNet * AYT_KATSAYI +
    dinNet * AYT_KATSAYI
  );
}

export function hesaplaEaHam(n: NetGiris): number {
  const matNet = net(n.matAytDogru, n.matAytYanlis, 40);
  const edebiyatNet = net(n.edebiyatDogru, n.edebiyatYanlis, 24);
  const tarih1Net = net(n.tarih1Dogru, n.tarih1Yanlis, 10);
  const cografya1Net = net(n.cografya1Dogru, n.cografya1Yanlis, 6);
  return (
    AYT_TEMEL +
    matNet * AYT_KATSAYI +
    edebiyatNet * AYT_KATSAYI +
    tarih1Net * AYT_KATSAYI +
    cografya1Net * AYT_KATSAYI
  );
}

export function hesaplaDilHam(n: NetGiris): number {
  const dilNet = net(n.dilDogru, n.dilYanlis, 80);
  return AYT_TEMEL + dilNet * AYT_KATSAYI;
}

export function hesaplaYerlestirmePuan(
  tytHam: number,
  aytHam: number,
  obp: number
): number {
  const obpDuzeltilmis = Math.min(Math.max(obp, 0), 100);
  return tytHam + aytHam + obpDuzeltilmis * OBP_KATSAYI;
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
// TERSİNE HESAPLAMA (Hedef Puana Göre Gereken Netler)
// ============================================================

export interface GerekenNetler {
  tytNet: number;
  aytToplamNet: number;
  toplamYP: number;
  hedefYP: number;
  obp: number;
  dersler: { ad: string; net: number }[];
  mumkun: boolean;
  mesaj?: string;
}

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
  const tytHam = TYT_TEMEL + tytNet * TYT_KATSAYI;
  const obpEki = Math.min(Math.max(obp, 0), 100) * OBP_KATSAYI;
  const gerekenAytHam = hedefYP - tytHam - obpEki;

  if (gerekenAytHam < AYT_TEMEL) {
    return {
      tytNet,
      aytToplamNet: 0,
      toplamYP: tytHam + obpEki,
      hedefYP,
      obp,
      dersler: [],
      mumkun: false,
      mesaj: `TYT netin (${tytNet.toFixed(1)}) ve OBP'n (${obp}) bu hedef için yeterli görünüyor. AYT'ye girmesen bile TYT ile yerleşebilirsin.`,
    };
  }

  const aytToplamNet = (gerekenAytHam - AYT_TEMEL) / AYT_KATSAYI;

  let dagilim: { ad: string; oran: number }[];
  switch (puanTuru) {
    case "SAY":
      dagilim = SAY_DAGILIM;
      break;
    case "SÖZ":
      dagilim = SOZ_DAGILIM;
      break;
    case "EA":
      dagilim = EA_DAGILIM;
      break;
    case "DİL":
      dagilim = DIL_DAGILIM;
      break;
    case "TYT":
      return {
        tytNet,
        aytToplamNet: 0,
        toplamYP: tytHam + obpEki,
        hedefYP,
        obp,
        dersler: [],
        mumkun: true,
        mesaj: "TYT puan türü için sadece TYT neti yeterli.",
      };
    default:
      dagilim = [];
  }

  const dersler = dagilim.map((d) => ({
    ad: d.ad,
    net: aytToplamNet * d.oran,
  }));

  // Yuvarlama hatası düzeltme: son ders farkı ekle
  const toplamHesaplanan = dersler.reduce((s, d) => s + d.net, 0);
  if (dersler.length > 0 && Math.abs(toplamHesaplanan - aytToplamNet) > 0.001) {
    dersler[dersler.length - 1].net += aytToplamNet - toplamHesaplanan;
  }

  return {
    tytNet,
    aytToplamNet,
    toplamYP: tytHam + gerekenAytHam + obpEki,
    hedefYP,
    obp,
    dersler,
    mumkun: true,
  };
}
