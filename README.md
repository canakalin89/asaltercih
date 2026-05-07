# Tercih Robotu

Öğrencilerin YÖK Atlas taban puan ve başarı sırası verilerine göre üniversite tercihi yapmasına yardımcı olan modern bir web uygulaması.

## Özellikler

- **Netten Puan Hesaplama**: TYT ve AYT netlerinizi girerek ham puan ve yerleştirme puanınızı hesaplayın.
- **Direkt Puan Girişi**: Daha önce hesapladığınız puanları doğrudan girebilirsiniz.
- **YÖK Atlas Entegrasyonu**: Güncel taban puan, başarı sırası ve kontenjan verilerini YÖK Atlas API'sinden canlı çeker.
- **Akıllı Filtreleme**: Puan türü, üniversite, şehir, bölüm grubu, devlet/vakıf ve daha fazlasına göre filtreleme.
- **Tercih Sınıflandırma**: Programları puanınıza göre **Güvenli**, **Normal** ve **Riskli** olarak sınıflandırır.
- **Trend Analizi**: Geçmiş yılların taban puanlarını karşılaştırarak yükseliş/düşüş trendini gösterir.

## Teknolojiler

- React 19 + TypeScript
- Vite 6
- Tailwind CSS 4
- YÖK Atlas API (saidsurucu/yokatlas-py referans alınarak)

## Kurulum

```bash
cd tercih_robotu
npm install
```

## Geliştirme (Yerel)

```bash
npm run dev
```

Uygulama `http://localhost:5173` adresinde açılır. Geliştirme sunucusu içindeki Vite proxy middleware, `/api/yokatlas` isteklerini YÖK Atlas'a yönlendirir.

## Deployment

### Vercel

1. Projeyi GitHub'a push edin.
2. [Vercel Dashboard](https://vercel.com/dashboard)'dan "New Project" ile import edin.
3. Framework preset olarak **Vite** seçin.
4. `api/` dizinindeki `yokatlas.ts` otomatik olarak Serverless Function olarak çalışır.

```bash
# Vercel CLI ile deploy
npx vercel
```

### Netlify

1. Projeyi GitHub'a push edin.
2. [Netlify Dashboard](https://app.netlify.com/)'dan "Add new site" → "Import an existing project".
3. Build settings otomatik olarak `netlify.toml` dosyasından okunur:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. `netlify/functions/yokatlas.ts` otomatik olarak Serverless Function olarak çalışır.

```bash
# Netlify CLI ile deploy
npx netlify deploy --build --prod
```

> **Not:** Hem Vercel hem Netlify deploy'larında `/api/yokatlas?path=...` proxy endpoint'i YÖK Atlas API'sine istekleri iletir. Böylece CORS sorunu yaşanmaz.

## Puan Hesaplama Formülleri (2025)

- **TYT**: 100 + (Net × 3.3)
- **AYT**: 100 + (Net × 3)
- **OBP**: OBP × 0.12
- **Yerleştirme Puanı**: TYT Ham + AYT Ham + OBP

> Not: Formüller yaklaşık değerlerdir. Kesin puanlarınızı ÖSYM kılavuzundan kontrol ediniz.

## Kullanım

1. **Puan Hesapla** sekmesinden puan türünüzü seçin (SAY, SÖZ, EA, DİL, TYT).
2. Netlerinizi girin veya direkt puanınızı yazın.
3. **Bu Puanı Kullan** butonuna tıklayın.
4. **Filtrele** sekmesinden istediğiniz şehir, üniversite ve bölüm gruplarını seçin.
5. **Programları Çek** butonuna basın.
6. **Sonuçlar** sekmesinde programlarınızı Güvenli / Normal / Riskli olarak görün.

## YÖK Atlas API Referansı

Bu uygulama YÖK Atlas'ın resmi JSON API'sini kullanır:

- `POST /api/tercih-kilavuz/search` — Program arama
- `GET /api/tercih-kilavuz/universiteler` — Üniversite listesi
- `GET /api/tercih-kilavuz/universite-programlar` — Program grupları
- `GET /api/tercih-kilavuz/universite-iller` — İller

Detaylı bilgi için: [yokatlas-py](https://github.com/saidsurucu/yokatlas-py)

## Lisans

MIT
