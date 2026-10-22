# Aksiyon Danışmanı ve Ayarlar
- [x] Aksiyon Danışmanı: 10 kart, filtreler, durum işlemleri ve kanban.
- [x] Ayarlar: 8 dolu sekme, formlar, korumalar ve bellekte kayıt.
- [x] Yeni sayfaların kural testleri, sürükle-bırak ve tarayıcı doğrulaması.

# Dashboard
- [x] Dashboard’a özel dönem verileri ve bağımsız widget durumları.
- [x] Karşılama, kurulum, KPI’lar, grafikler ve iş akışı kısayolları.
- [x] Boş/demo görünümü, gizlilik ve dönem kuralları testleri.
- [x] Masaüstü/mobil görünüm ve ana akış doğrulaması.

# Entegrasyonlar
- [x] Kategorili kartlar, arama ve filtreleme.
- [x] İzin, KVKK, kanal seçimi ve tekrar denenebilir bağlantı testi.
- [x] Yönetim, senkron kayıtları, haberdar et ve bağlantı kesme.
- [x] Kural testleri ve masaüstü/mobil akış doğrulaması.
## Gerçek backend geçişi (Entegrasyonlar) — yapıldı
- [x] Şema + RLS (companies, memberships, integrations, integration_secrets, sync_runs, raw_items, consents, audit_log)
- [x] Trendyol bağla/senkron, Slack OAuth, CSV içe aktarım, bağlantı kesme, saatlik zamanlayıcı, AI analiz hattı
- [x] VITE_USE_MOCKS bayrağı, /auth sayfası, raw_items'tan Dashboard/Nabız/Müşteri Sesi toplulaştırması
- [ ] Kullanıcı: SLACK_CLIENT_ID/SLACK_CLIENT_SECRET tanımlayıp Slack uygulaması oluşturmalı
