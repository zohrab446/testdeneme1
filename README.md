# Testdeneme1

Türkiye'deki KOBİ'ler ve startuplar için bir İK + Müşteri Sesi + AI Aksiyon Danışmanı web uygulamasının front-end iskeletini kur. Çalışma adı: [ÜRÜN ADI].

TEKNİK

- React + TypeScript + Vite, Tailwind, shadcn/ui, Recharts, React Router, lucide-react, react-hook-form + zod, TanStack Query

- Backend yok. Tüm veri /src/mocks altında. Bileşenler mock'a doğrudan erişmesin: /src/services altındaki fonksiyonlar (örn. getDashboardSummary(), getActionCards(), createEmployeeInvite()) Promise döndürsün ve 300-800ms yapay gecikme olsun. Böylece sonradan Supabase'e geçmek sadece service dosyalarını değiştirmek olsun.

- Tipler /src/types altında merkezi olsun (Employee, OnboardingInvite, ActionCard, SentimentPoint, CustomerReview, Department vb.)

TASARIM SİSTEMİ

- Tüm arayüz Türkçe. Tarih gg.aa.yyyy, para ₺, sayılar Türkçe formatla (1.250,50)

- Linear/Notion tadında sade, güven veren SaaS. Ana renk koyu indigo, vurgu turuncu, başarı yeşil, uyarı amber, kritik kırmızı. Renkleri CSS değişkeni olarak tanımla

- Açık/koyu tema, mobil öncelikli responsive

- Ortak bileşenler: PageHeader, KpiCard, StatusBadge, EmptyState, ErrorState, SkeletonCard, ConfirmDialog, SensitiveField (maskeli gösterim + göz ikonu)

- Her sayfada üç durum olsun: yükleniyor (skeleton), boş (EmptyState), hata (ErrorState + "Tekrar dene")

NAVİGASYON

- Masaüstünde sol sidebar, mobilde alt tab bar. Menü: Dashboard, Çalışan Nabzı, Müşteri Sesi, Aksiyon Danışmanı, Onboarding, Entegrasyonlar, Ayarlar

- Rotalar: /, /calisan-nabzi, /musteri-sesi, /aksiyonlar, /onboarding, /onboarding/:id, /entegrasyonlar, /ayarlar

- Giriş gerektirmeyen herkese açık rota: /karsilama/:token (sidebar yok, ayrı sade layout)

- Şimdilik her sayfa PageHeader + EmptyState içersin

İLK GİRİŞ SİHİRBAZI

- 3 adım: şirket bilgisi (ad, sektör, çalışan sayısı), bağlanacak kaynaklar (seçmeli kartlar), hedefler (çoklu seçim). Tamamlanınca localStorage'a yazılsın ve bir daha gösterilmesin.

Sadece bunları kur, sayfa içeriklerini henüz yapma.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://testdeneme1.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/60e00b08-cb5b-4747-af2a-3662dbf7f329).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
