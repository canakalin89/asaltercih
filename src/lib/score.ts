import type { PuanTuru } from "./types";

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

// ============================================================
// MEVCUT NETLERDEN PUAN HESAPLAMA
// ============================================================

export interface MevcutNetler {
  tytTurkce: number;
  tytSosyal: number;
  tytMatematik: number;
  tytFen: number;
  aytMatematik?: number;
  aytFizik?: number;
  aytKimya?: number;
  aytBiyoloji?: number;
  aytEdebiyat?: number;
  aytTarih1?: number;
  aytCografya1?: number;
  aytTarih2?: number;
  aytCografya2?: number;
  aytFelsefe?: number;
  aytDin?: number;
  aytDil?: number;
}

export function hesaplaTytPuanFromNetler(n: MevcutNetler): number {
  return (
    TYT_BASLANGIC +
    n.tytTurkce * TYT_KATSAYI.turkce +
    n.tytSosyal * TYT_KATSAYI.sosyal +
    n.tytMatematik * TYT_KATSAYI.mat +
    n.tytFen * TYT_KATSAYI.fen
  );
}

export function hesaplaAytPuanFromNetler(n: MevcutNetler, puanTuru: PuanTuru): number {
  switch (puanTuru) {
    case "SAY":
      return (
        (n.aytMatematik ?? 0) * AYT_SAY_KATSAYI.mat +
        (n.aytFizik ?? 0) * AYT_SAY_KATSAYI.fizik +
        (n.aytKimya ?? 0) * AYT_SAY_KATSAYI.kimya +
        (n.aytBiyoloji ?? 0) * AYT_SAY_KATSAYI.biyoloji
      );
    case "SÖZ":
      return (
        (n.aytEdebiyat ?? 0) * AYT_SOZ_KATSAYI.edebiyat +
        (n.aytTarih1 ?? 0) * AYT_SOZ_KATSAYI.tarih1 +
        (n.aytCografya1 ?? 0) * AYT_SOZ_KATSAYI.cografya1 +
        (n.aytTarih2 ?? 0) * AYT_SOZ_KATSAYI.tarih2 +
        (n.aytCografya2 ?? 0) * AYT_SOZ_KATSAYI.cografya2 +
        (n.aytFelsefe ?? 0) * AYT_SOZ_KATSAYI.felsefe +
        (n.aytDin ?? 0) * AYT_SOZ_KATSAYI.din
      );
    case "EA":
      return (
        (n.aytMatematik ?? 0) * AYT_EA_KATSAYI.mat +
        (n.aytEdebiyat ?? 0) * AYT_EA_KATSAYI.edebiyat +
        (n.aytTarih1 ?? 0) * AYT_EA_KATSAYI.tarih1 +
        (n.aytCografya1 ?? 0) * AYT_EA_KATSAYI.cografya1
      );
    case "DİL":
      return (n.aytDil ?? 0) * AYT_DIL_KATSAYI.dil;
    default:
      return 0;
  }
}

export function hesaplaYerlestirmePuanFromNetler(
  n: MevcutNetler,
  obp: number,
  puanTuru: PuanTuru
): number {
  const tytPuan = hesaplaTytPuanFromNetler(n);
  const aytPuan = hesaplaAytPuanFromNetler(n, puanTuru);
  const obpDegeri = Math.min(Math.max(obp, 0), 100) * 5;
  return tytPuan * 0.4 + aytPuan * 0.6 + obpDegeri * OBP_KATSAYI;
}

// ============================================================
// HEDEF KARŞILAŞTIRMA
// ============================================================

export interface DersKarsilastirma {
  ad: string;
  mevcut: number;
  hedef: number;
  fark: number;
}

export interface HedefKarsilastirma {
  mevcutYP: number;
  hedefYP: number;
  fark: number; // pozitif = üstünde, negatif = eksik
  mumkun: boolean;
  tytDersler: DersKarsilastirma[];
  aytDersler: DersKarsilastirma[];
  mesaj: string;
  ekAytToplamNet: number;
}

const AYT_DAGILIM: Record<PuanTuru, { ad: string; key: keyof MevcutNetler; oran: number }[]> = {
  SAY: [
    { ad: "AYT Matematik", key: "aytMatematik", oran: 40 / 80 },
    { ad: "Fizik", key: "aytFizik", oran: 14 / 80 },
    { ad: "Kimya", key: "aytKimya", oran: 13 / 80 },
    { ad: "Biyoloji", key: "aytBiyoloji", oran: 13 / 80 },
  ],
  SÖZ: [
    { ad: "Edebiyat", key: "aytEdebiyat", oran: 24 / 74 },
    { ad: "Tarih-1", key: "aytTarih1", oran: 10 / 74 },
    { ad: "Coğrafya-1", key: "aytCografya1", oran: 6 / 74 },
    { ad: "Tarih-2", key: "aytTarih2", oran: 10 / 74 },
    { ad: "Coğrafya-2", key: "aytCografya2", oran: 6 / 74 },
    { ad: "Felsefe", key: "aytFelsefe", oran: 12 / 74 },
    { ad: "Din K./A.B.", key: "aytDin", oran: 6 / 74 },
  ],
  EA: [
    { ad: "AYT Matematik", key: "aytMatematik", oran: 40 / 80 },
    { ad: "Edebiyat", key: "aytEdebiyat", oran: 24 / 80 },
    { ad: "Tarih-1", key: "aytTarih1", oran: 10 / 80 },
    { ad: "Coğrafya-1", key: "aytCografya1", oran: 6 / 80 },
  ],
  DİL: [
    { ad: "Yabancı Dil", key: "aytDil", oran: 80 / 80 },
  ],
  TYT: [],
};

function getOrtAytKatsayi(puanTuru: PuanTuru): number {
  switch (puanTuru) {
    case "SAY":
      return (AYT_SAY_KATSAYI.mat + AYT_SAY_KATSAYI.fizik + AYT_SAY_KATSAYI.kimya + AYT_SAY_KATSAYI.biyoloji) / 4;
    case "SÖZ":
      return Object.values(AYT_SOZ_KATSAYI).reduce((a, b) => a + b, 0) / Object.values(AYT_SOZ_KATSAYI).length;
    case "EA":
      return (AYT_EA_KATSAYI.mat + AYT_EA_KATSAYI.edebiyat + AYT_EA_KATSAYI.tarih1 + AYT_EA_KATSAYI.cografya1) / 4;
    case "DİL":
      return AYT_DIL_KATSAYI.dil;
    default:
      return 3;
  }
}

export function karsilastirHedef(
  hedefYP: number,
  obp: number,
  netler: MevcutNetler,
  puanTuru: PuanTuru
): HedefKarsilastirma {
  const mevcutYP = hesaplaYerlestirmePuanFromNetler(netler, obp, puanTuru);
  const fark = mevcutYP - hedefYP;

  const tytDersler: DersKarsilastirma[] = [
    { ad: "TYT Türkçe", mevcut: netler.tytTurkce, hedef: netler.tytTurkce, fark: 0 },
    { ad: "TYT Matematik", mevcut: netler.tytMatematik, hedef: netler.tytMatematik, fark: 0 },
    { ad: "TYT Sosyal", mevcut: netler.tytSosyal, hedef: netler.tytSosyal, fark: 0 },
    { ad: "TYT Fen", mevcut: netler.tytFen, hedef: netler.tytFen, fark: 0 },
  ];

  const dagilim = AYT_DAGILIM[puanTuru] ?? [];

  // TYT puan türü özel durumu
  if (puanTuru === "TYT") {
    const mumkun = fark >= 0;
    return {
      mevcutYP,
      hedefYP,
      fark,
      mumkun,
      tytDersler,
      aytDersler: [],
      mesaj: mumkun
        ? `TYT puanın (${mevcutYP.toFixed(2)}) hedefi (${hedefYP.toFixed(2)}) karşılıyor.`
        : `TYT puanın (${mevcutYP.toFixed(2)}) hedefin ${Math.abs(fark).toFixed(2)} puan altında.`,
      ekAytToplamNet: 0,
    };
  }

  if (fark >= 0) {
    // Hedef tutturuluyor
    const aytDersler: DersKarsilastirma[] = dagilim.map((d) => ({
      ad: d.ad,
      mevcut: (netler[d.key] ?? 0),
      hedef: (netler[d.key] ?? 0),
      fark: 0,
    }));

    return {
      mevcutYP,
      hedefYP,
      fark,
      mumkun: true,
      tytDersler,
      aytDersler,
      mesaj: `Tebrikler! Mevcut netlerinle ${mevcutYP.toFixed(2)} puan yapıyorsun. Hedef puan ${hedefYP.toFixed(2)}. ${fark.toFixed(2)} puan üstündesin.`,
      ekAytToplamNet: 0,
    };
  }

  // Eksik puan var — AYT'den artırması gereken neti hesapla
  const eksikPuan = Math.abs(fark);
  const gerekenEkAytPuan = eksikPuan / 0.6;
  const ortAytKatsayi = getOrtAytKatsayi(puanTuru);
  const gerekenEkAytNet = gerekenEkAytPuan / ortAytKatsayi;

  // Dağılıma göre derslere böl
  const aytDersler: DersKarsilastirma[] = dagilim.map((d) => {
    const mevcut = netler[d.key] ?? 0;
    const ekNet = gerekenEkAytNet * d.oran;
    return {
      ad: d.ad,
      mevcut,
      hedef: mevcut + ekNet,
      fark: ekNet,
    };
  });

  // Toplamı düzelt (yuvarlama hatası)
  const toplamEk = aytDersler.reduce((s, d) => s + d.fark, 0);
  if (aytDersler.length > 0 && Math.abs(toplamEk - gerekenEkAytNet) > 0.001) {
    aytDersler[aytDersler.length - 1].fark += gerekenEkAytNet - toplamEk;
    aytDersler[aytDersler.length - 1].hedef += gerekenEkAytNet - toplamEk;
  }

  return {
    mevcutYP,
    hedefYP,
    fark,
    mumkun: false,
    tytDersler,
    aytDersler,
    mesaj: `Mevcut netlerinle ${mevcutYP.toFixed(2)} puan yapıyorsun. Hedef puan ${hedefYP.toFixed(2)}. AYT'de toplam ${gerekenEkAytNet.toFixed(1)} net daha artırman lazım.`,
    ekAytToplamNet: gerekenEkAytNet,
  };
}

// ============================================================
// ESKİ FONKSİYONLAR (doğru/yanlış tabanlı, geriye uyumluluk)
// ============================================================

import type { NetGiris } from "./types";

function net(dogru: number, yanlis: number, maxSoru: number): number {
  const d = Math.min(Math.max(dogru, 0), maxSoru);
  const y = Math.min(Math.max(yanlis, 0), maxSoru - d);
  return Math.max(0, d - y / 4);
}

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

export function hesaplaYerlestirmePuan(
  tytPuan: number,
  aytPuan: number,
  obp: number
): number {
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
