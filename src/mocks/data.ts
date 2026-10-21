import type { AppSettings } from "@/types/settings";
import type {
  ActionCard,
  DashboardSummary,
  Department,
  Employee,
  Integration,
  OnboardingInvite,
  OnboardingDetails,
  OnboardingDocument,
  OnboardingActivity,
  DataTransferItem,
  PulseSource,
  RawDepartmentPulse,
  SentimentPoint,
} from "@/types";

export const departments: Department[] = [
  { id: "d1", name: "Satış", headcount: 12 },
  { id: "d2", name: "Operasyon", headcount: 18 },
  { id: "d3", name: "Yazılım", headcount: 9 },
  { id: "d4", name: "Müşteri Hizmetleri", headcount: 7 },
  { id: "d5", name: "Hukuk", headcount: 3 },
];

export const employees: Employee[] = [
  {
    id: "e1",
    firstName: "Ayşe",
    lastName: "Yılmaz",
    email: "ayse@ornek.com.tr",
    phone: "+90 532 000 00 01",
    tckn: "12345678901",
    iban: "TR33 0006 1005 1978 6457 8413 26",
    title: "Satış Müdürü",
    departmentId: "d1",
    startDate: "2023-03-01",
    salary: 85000,
    status: "aktif",
  },
  {
    id: "e2",
    firstName: "Mehmet",
    lastName: "Kaya",
    email: "mehmet@ornek.com.tr",
    title: "Kıdemli Geliştirici",
    departmentId: "d3",
    startDate: "2022-09-15",
    salary: 110000,
    status: "aktif",
  },
];

const details = (
  first: string,
  phone: string,
  email: string,
  tckn: string,
  iban: string,
): OnboardingDetails => ({
  personal: { birthDate: "1996-04-12", birthPlace: "İzmir", gender: "Kadın", maritalStatus: "Bekâr", tckn },
  contact: { phone, email, address: "Alsancak Mah. 1453 Sok. No:7 D:3", city: "İzmir" },
  education: {
    school: "Ege Üniversitesi",
    degree: "İşletme (Lisans)",
    graduationYear: 2018,
    previousEmployer: `${first} Ticaret Ltd. Şti.`,
  },
  bank: { bankName: "Ziraat Bankası", iban },
  emergency: { name: "Fatma Demir", relation: "Anne", phone: "+90 532 111 22 33" },
});

const docs = (status: OnboardingDocument["status"][]): OnboardingDocument[] =>
  [
    { id: "kimlik", name: "Kimlik Ön-Arka Yüz.jpg", kind: "gorsel" as const, sizeKb: 812 },
    { id: "diploma", name: "Diploma.pdf", kind: "pdf" as const, sizeKb: 1240 },
    { id: "ikametgah", name: "İkametgâh Belgesi.pdf", kind: "pdf" as const, sizeKb: 356 },
    { id: "fotograf", name: "Vesikalık Fotoğraf.png", kind: "gorsel" as const, sizeKb: 204 },
  ]
    .slice(0, status.length)
    .map((d, i) => ({ ...d, status: status[i] ?? "bekliyor" }));

const act = (
  items: [OnboardingActivity["type"], string, string, string?][],
): OnboardingActivity[] =>
  items.map(([type, label, at, note], i) => ({ id: `act${i}`, type, label, at, note }));

const transfers: DataTransferItem[] = [
  { id: "sgk", title: "SGK İşe Giriş Bildirgesi Hazırlığı", description: "Bildirge için gerekli alanlar derlendi.", status: "hazir" },
  { id: "bordro", title: "Bordro", description: "Maaş ve banka bilgileri bordro sistemine aktarıldı.", status: "aktarildi" },
  { id: "ozluk", title: "Personel Özlük Dosyası", description: "Belgeler özlük dosyasına ekleniyor.", status: "hazirlaniyor" },
  { id: "sozlesme", title: "İş Sözleşmesi Taslağı", description: "Taslak imzaya hazır.", status: "hazir" },
];

export const onboardingInvites: OnboardingInvite[] = [
  {
    id: "o1",
    token: "demo-token-123",
    employeeName: "Zeynep Demir",
    email: "zeynep@ornek.com.tr",
    title: "Müşteri Temsilcisi",
    departmentId: "d4",
    startDate: "2026-11-02",
    status: "onay_bekliyor",
    progress: 100,
    createdAt: "2026-10-15T09:00:00",
    expiresAt: "2026-10-22T09:00:00",
    details: details("Demir", "+90 532 000 11 22", "zeynep@ornek.com.tr", "10000000146", "TR330006100519786457841326"),
    documents: docs(["bekliyor", "bekliyor", "onaylandi", "bekliyor"]),
    activity: act([
      ["davet_gonderildi", "Davet gönderildi", "2026-10-15T09:00:00"],
      ["form_acildi", "Form açıldı", "2026-10-15T18:24:00"],
      ["form_gonderildi", "Form gönderildi", "2026-10-17T21:10:00"],
    ]),
  },
  {
    id: "o2",
    token: "tk-burak-8f2a",
    employeeName: "Burak Şahin",
    email: "burak@ornek.com.tr",
    title: "Satış Uzmanı",
    departmentId: "d1",
    startDate: "2026-11-10",
    status: "davet_gonderildi",
    progress: 0,
    createdAt: "2026-10-20T10:30:00",
    expiresAt: "2026-10-27T10:30:00",
    documents: [],
    activity: act([["davet_gonderildi", "Davet gönderildi", "2026-10-20T10:30:00"]]),
  },
  {
    id: "o3",
    token: "tk-elif-4c91",
    employeeName: "Elif Arslan",
    email: "elif@ornek.com.tr",
    title: "Frontend Geliştirici",
    departmentId: "d3",
    startDate: "2026-11-03",
    status: "form_dolduruluyor",
    progress: 55,
    createdAt: "2026-10-18T14:00:00",
    expiresAt: "2026-10-25T14:00:00",
    details: details("Arslan", "+90 533 222 33 44", "elif@ornek.com.tr", "10000000210", "TR120001000123456789012345"),
    documents: docs(["bekliyor", "bekliyor"]),
    activity: act([
      ["davet_gonderildi", "Davet gönderildi", "2026-10-18T14:00:00"],
      ["form_acildi", "Form açıldı", "2026-10-19T08:45:00"],
    ]),
  },
  {
    id: "o4",
    token: "tk-can-77de",
    employeeName: "Can Öztürk",
    email: "can@ornek.com.tr",
    title: "Depo Sorumlusu",
    departmentId: "d2",
    startDate: "2026-10-28",
    status: "duzeltme_istendi",
    progress: 90,
    createdAt: "2026-10-12T11:00:00",
    expiresAt: "2026-10-19T11:00:00",
    details: details("Öztürk", "+90 535 444 55 66", "can@ornek.com.tr", "10000000382", "TR640006400000112345678901"),
    documents: docs(["onaylandi", "reddedildi", "onaylandi", "onaylandi"]),
    correction: { targets: ["Diploma.pdf"], note: "Diploma görüntüsü okunmuyor, lütfen yeniden yükleyin." },
    activity: act([
      ["davet_gonderildi", "Davet gönderildi", "2026-10-12T11:00:00"],
      ["form_acildi", "Form açıldı", "2026-10-12T19:02:00"],
      ["form_gonderildi", "Form gönderildi", "2026-10-14T22:15:00"],
      ["duzeltme_istendi", "Düzeltme istendi", "2026-10-16T10:20:00", "Diploma görüntüsü okunmuyor, lütfen yeniden yükleyin."],
    ]),
  },
  {
    id: "o5",
    token: "tk-selin-1b3e",
    employeeName: "Selin Koç",
    email: "selin@ornek.com.tr",
    title: "Operasyon Uzmanı",
    departmentId: "d2",
    startDate: "2026-10-20",
    status: "tamamlandi",
    progress: 100,
    createdAt: "2026-10-01T09:15:00",
    expiresAt: "2026-10-08T09:15:00",
    details: details("Koç", "+90 536 777 88 99", "selin@ornek.com.tr", "10000000454", "TR980004600123000456789012"),
    documents: docs(["onaylandi", "onaylandi", "onaylandi", "onaylandi"]),
    transfers,
    activity: act([
      ["davet_gonderildi", "Davet gönderildi", "2026-10-01T09:15:00"],
      ["form_acildi", "Form açıldı", "2026-10-01T20:40:00"],
      ["form_gonderildi", "Form gönderildi", "2026-10-03T12:00:00"],
      ["onaylandi", "Kayıt onaylandı", "2026-10-04T15:30:00"],
    ]),
  },
];

export const defaultTransfers = transfers;

const actionSeed: [string, string, string, ActionCard["source"], ActionCard["severity"], string, string, string[], string, NonNullable<ActionCard["aciliyet"]>, NonNullable<ActionCard["durum"]>, number][] = [
  ["a1", "Kargo gecikmesi şikâyetleri artıyor", "Son 14 günde olumsuz yorumların %38'i teslimat süresiyle ilgili.", "musteri", "kritik", "Operasyon", "Yoğun günlerde sevkiyat kapasitesi yetersiz kalıyor.", ["En çok geciken 3 bölgeyi çıkar.", "Kargo firmasıyla teslimat hedefini netleştir.", "Geciken siparişlere aynı gün bilgi ver."], "Teslimat şikâyetlerinde iki haftada %15 azalma hedefleniyor.", "Kritik", "Öneri", 184],
  ["a2", "Operasyonda aşırı mesai yükünü dengele", "Operasyon'da bu hafta şikâyet oranı %30 arttı.", "calisan", "kritik", "Operasyon", "Aşırı mesai ve belirsiz görev tanımları yükü artırıyor.", ["Vardiya başına iş yükünü ölç.", "İki yoğun vardiyaya ek destek ayır.", "Görev dağılımını ekip ile paylaş."], "Hafta sonu mesaisinin %20 azalması bekleniyor.", "Kritik", "Öneri", 96],
  ["a3", "Satış ekibinde prim sistemini netleştir", "Prim hesaplamasıyla ilgili belirsizlik memnuniyeti düşürüyor.", "calisan", "uyari", "Satış", "Prim koşulları farklı kanallarda farklı anlatılıyor.", ["Prim kurallarını tek sayfada topla.", "Üç örnek hesaplamayı ekip ile paylaş.", "Açık sorular için 20 dakikalık toplantı yap."], "Prim hakkındaki belirsizliğin bir ayda azalması hedefleniyor.", "Yüksek", "Öneri", 63],
  ["a4", "Müşteri hizmetlerinde rol tanımlarını güncelle", "Görev belirsizliği ve geri bildirim eksikliği öne çıkıyor.", "karma", "uyari", "Müşteri Hizmetleri", "Taleplerin hangi ekipte çözüleceği net değil.", ["En sık gelen 5 talebin sorumlusunu belirle.", "Yönlendirme tablosunu güncelle.", "Haftalık kısa geri bildirim görüşmesi planla."], "İlk yanıt süresinde %10 iyileşme bekleniyor.", "Yüksek", "DevamEdiyor", 78],
  ["a5", "Yazılım ekibinin esnek çalışma düzenini koru", "İş-yaşam dengesi güçlü; mevcut uygulamaları sürdür.", "calisan", "basari", "Yazılım", "Odak saatleri ve esnek çalışma olumlu karşılanıyor.", ["Odak saatlerini takvimlerde koru.", "Başarılı çalışma düzenini belgeleyip paylaş.", "Bir ay sonra kısa nabız anketi yap."], "Mevcut yüksek memnuniyetin korunması bekleniyor.", "Düşük", "Öneri", 42],
  ["a6", "Ödeme adımındaki hataları azalt", "Son hafta ödeme hatası yorumları %24 arttı.", "musteri", "kritik", "Yazılım", "Son sürümde bazı cihazlarda ödeme ekranı kapanıyor.", ["Hata kayıtlarını cihaz bazında incele.", "En sık hataya düzeltme sürümü çıkar.", "Sonucu mağaza yorumlarında paylaş."], "Başarısız ödeme sayısında %25 azalma hedefleniyor.", "Kritik", "Yapılacak", 137],
  ["a7", "İade sürecini sadeleştir", "İade konusunda 48 yorumda tekrar eden adımlar bildirildi.", "musteri", "uyari", "Operasyon", "İade formu ile destek kaydı aynı bilgileri istiyor.", ["Tekrarlanan alanları kaldır.", "İade durumunu tek ekranda göster.", "Yeni akışı 10 siparişle dene."], "İade başına destek talebinin azalması bekleniyor.", "Orta", "Ertelendi", 48],
  ["a8", "Yeni başlayanlara ekip arkadaşı eşleştir", "İlk ayındaki çalışanlar kime soru soracağını bilmiyor.", "calisan", "bilgi", "İnsan Kaynakları", "Karşılama programında günlük destek kişisi yok.", ["Her yeni başlayana bir ekip arkadaşı ata.", "İlk hafta için kısa görüşmeler planla.", "İkinci haftada geri bildirim topla."], "İşe uyum süresinin kısalması bekleniyor.", "Orta", "Tamamlandı", 31],
  ["a9", "Destek yanıtlarında ortak dil kullan", "Müşteriler aynı soruya farklı yanıtlar alıyor.", "musteri", "uyari", "Müşteri Hizmetleri", "Güncel yanıt örnekleri ekip içinde paylaşılmıyor.", ["En sık 10 sorunun yanıtını yaz.", "Yanıtları ekip ile gözden geçir.", "Haftada 5 talebi birlikte değerlendir."], "Tekrar açılan taleplerde %10 azalma hedefleniyor.", "Yüksek", "Yapılacak", 89],
  ["a10", "Satış ekibinin öğrenme saatini planla", "Ekip ürün güncellemelerini takip etmekte zorlanıyor.", "calisan", "bilgi", "Satış", "Yoğun müşteri takvimi öğrenmeye zaman bırakmıyor.", ["Haftada 30 dakika öğrenme saati ayır.", "Yeni ürünleri kısa örneklerle anlat.", "İki hafta sonra bilgi eksiklerini kontrol et."], "Ürün sorularının daha hızlı yanıtlanması bekleniyor.", "Düşük", "Ertelendi", 27],
];
export const actionCards: ActionCard[] = actionSeed.map(([id, title, summary, source, severity, departman, neden, aksiyonlar, beklenenEtki, aciliyet, durum, count], i) => ({
  id, title, summary, source, severity, departman, neden, aksiyonlar, beklenenEtki, aciliyet, durum,
  status: durum === "Tamamlandı" ? "tamamlandi" : durum === "Ertelendi" ? "ertelendi" : durum === "DevamEdiyor" ? "devam" : "yeni",
  createdAt: `2026-10-${19 - i}`, olusturmaTarihi: `2026-10-${19 - i}`, bulgu: summary, kaynak: source === "musteri" ? "Müşteri" : "Çalışan",
  vadeTarihi: ["Yapılacak", "DevamEdiyor"].includes(durum) ? (i === 5 ? "2026-10-19" : "2026-10-28") : undefined,
  ertelemeTarihi: durum === "Ertelendi" ? "2026-10-24" : undefined,
  impactEstimate: id === "a1" ? 42500 : undefined,
  nasilUretildi: { aciklama: "Son iki haftanın anonim geri bildirimleri önceki dönemle karşılaştırıldı; benzer temalar birlikte değerlendirildi.", veriNoktasiSayisi: count },
}));

export const sentimentSeries: SentimentPoint[] = Array.from({ length: 8 }, (_, i) => ({
  date: `2026-0${(i % 9) + 1}-01`,
  score: [0.21, 0.18, 0.25, 0.3, 0.22, 0.12, 0.28, 0.34][i] ?? 0,
  responses: 40 + i * 3,
}));

export { customerReviews, vocSources } from "./voc";

export const integrations: Integration[] = [
  { id: "slack", name: "Slack", category: "iletisim", connected: false },
  { id: "google-reviews", name: "Google Yorumları", category: "musteri", connected: false },
  { id: "trendyol", name: "Trendyol", category: "musteri", connected: false },
  { id: "kolayik", name: "KolayİK", category: "ik", connected: false },
  { id: "parasut", name: "Paraşüt", category: "muhasebe", connected: false },
];

export const dashboardSummary: DashboardSummary = {
  employeeCount: 46,
  pulseScore: 72,
  pulseDelta: 4,
  nps: 38,
  npsDelta: -3,
  openActions: 5,
  estimatedImpact: 125450.5,
};

onboardingInvites.push({
  id: "o6",
  token: "tk-eski-0a0a",
  employeeName: "Kerem Yıldız",
  email: "kerem@ornek.com.tr",
  title: "Muhasebe Uzmanı",
  departmentId: "d2",
  startDate: "2026-11-15",
  status: "davet_gonderildi",
  progress: 0,
  createdAt: "2026-10-05T09:00:00",
  expiresAt: "2026-10-12T09:00:00",
  documents: [],
  activity: [{ id: "act0", type: "davet_gonderildi", label: "Davet gönderildi", at: "2026-10-05T09:00:00" }],
});

export const companyProfile = { name: "Demo Şirket A.Ş.", kvkkContact: "kvkk@demosirket.com.tr" };

export const pulseSources: PulseSource[] = [
  { id: "slack", name: "Slack", description: "Herkese açık kanallardaki mesajlar", status: "bagli", lastSync: "2026-10-21T07:30:00" },
  { id: "teams", name: "Microsoft Teams", description: "Ekip kanallarındaki gönderiler", status: "hata", errorMessage: "Yetki süresi doldu, yeniden bağlanın." },
  { id: "oneri", name: "Anonim Öneri Kutusu", description: "Çalışanların isimsiz önerileri", status: "bagli_degil" },
  { id: "csv", name: "Anket Yükle (CSV)", description: "Kendi anket sonuçlarınız", status: "bagli_degil" },
];

const wave = (base: number, amp: number, phase: number) =>
  Array.from({ length: 12 }, (_, i) => Math.round(base + amp * Math.sin((i + phase) / 2) + (i - 6) * 0.6));

export const pulseDepartments: RawDepartmentPulse[] = [
  {
    departmentId: "d1", respondents: 11,
    topics: { mesai: 58, yonetici: 66, maas: 38, belirsizlik: 52, denge: 61 },
    trend: wave(58, 6, 0), risk: "orta", riskReasons: ["Prim sistemi belirsiz", "Maaş beklentisi karşılanmıyor"],
    themes: ["Prim hesaplaması", "Hedef baskısı", "Ekip içi dayanışma"],
    quotes: ["Primlerin nasıl hesaplandığını hâlâ tam anlamış değilim…", "Ekip arkadaşlarım çok destekleyici ama hedefler…", "Çeyrek sonu baskısı her seferinde artıyor…"],
    actionCardId: "a3",
  },
  {
    departmentId: "d2", respondents: 16,
    topics: { mesai: 24, yonetici: 47, maas: 42, belirsizlik: 55, denge: 29 },
    trend: wave(44, 5, 2).map((v, i) => v - Math.floor(i / 2)), risk: "yuksek",
    riskReasons: ["Son 6 haftada aşırı mesai şikâyeti 2 katına çıktı", "İş-yaşam dengesi skoru şirket ortalamasının altında", "Hafta sonu çalışması yaygınlaştı"],
    themes: ["Vardiya yükü", "Hafta sonu çalışma", "Personel eksikliği"],
    quotes: ["Bu ay üçüncü kez hafta sonu çalışıyoruz…", "Kimse izin alamıyor çünkü yerimize bakacak…", "Yöneticimiz ilgili ama kaynak yok…"],
    actionCardId: "a2",
  },
  {
    departmentId: "d3", respondents: 8,
    topics: { mesai: 64, yonetici: 78, maas: 61, belirsizlik: 70, denge: 82 },
    trend: wave(72, 4, 1), risk: "dusuk", riskReasons: ["Genel memnuniyet yüksek"],
    themes: ["Esnek çalışma", "Teknik gelişim", "Net yol haritası"],
    quotes: ["Uzaktan çalışma esnekliği çok iyi geliyor…", "Sprint planlaması artık daha net…", "Eğitim bütçesi olsa harika olur…"],
    actionCardId: "a5",
  },
  {
    departmentId: "d4", respondents: 6,
    topics: { mesai: 49, yonetici: 41, maas: 45, belirsizlik: 33, denge: 50 },
    trend: wave(50, 5, 3), risk: "orta", riskReasons: ["Görev tanımları belirsiz", "Yöneticiden düzenli geri bildirim alınmıyor"],
    themes: ["Rol belirsizliği", "Geri bildirim eksikliği", "Yoğun çağrı trafiği"],
    quotes: ["Hangi talebin kime ait olduğu belli değil…", "Performansım hakkında en son ne zaman konuştuk…", "Yoğun saatlerde destek yetersiz kalıyor…"],
    actionCardId: "a4",
  },
  {
    departmentId: "d5", respondents: 3,
    topics: { mesai: 40, yonetici: 40, maas: 40, belirsizlik: 40, denge: 40 },
    trend: wave(50, 3, 0), risk: "orta", riskReasons: [], themes: [], quotes: [],
  },
];

export const appSettings: AppSettings = {
  language: "tr", currency: "TRY", currentUserId: "u1",
  company: { ad: "Demo Şirket A.Ş.", vergiNo: "1234567890", sektor: "E-ticaret", calisanAraligi: "26–50", adres: "Maslak Mah. Büyükdere Cad. No:10, Sarıyer / İstanbul", logo: "" },
  departments: [...departments.map(d => ({ id: d.id, ad: d.name, yonetici: ({ d1: "Ayşe Yılmaz", d2: "Mert Demir", d3: "Mehmet Kaya", d4: "Selin Ak", d5: "Ece Yıldız" } as Record<string, string>)[d.id] ?? "Deniz", calisanSayisi: d.headcount })), { id: "d6", ad: "İnsan Kaynakları", yonetici: "Deniz", calisanSayisi: 0 }],
  users: [
    { id: "u1", ad: "Deniz", email: "deniz@ornek.com.tr", rol: "Sahip", sonGiris: "2026-10-21T08:30:00", durum: "Aktif" },
    { id: "u2", ad: "Ece Yıldız", email: "ece@ornek.com.tr", rol: "İK Yöneticisi", sonGiris: "2026-10-20T14:10:00", durum: "Aktif" },
    { id: "u3", ad: "Mert Demir", email: "mert@ornek.com.tr", rol: "Departman Yöneticisi", departmentId: "d2", sonGiris: "2026-10-21T07:45:00", durum: "Aktif" },
    { id: "u4", ad: "Davetli kullanıcı", email: "rapor@ornek.com.tr", rol: "Salt Okunur", durum: "Davet Bekliyor" },
    { id: "u5", ad: "Can Ak", email: "can@ornek.com.tr", rol: "Salt Okunur", sonGiris: "2026-09-10T09:00:00", durum: "Pasif" },
  ],
  notifications: { email: true, inApp: true, slack: false, critical: true, resignation: true, onboarding: true, actionDue: true, weekly: true, day: "Pazartesi", time: "09:00", quietEnabled: true, quietStart: "20:00", quietEnd: "08:00" },
  privacy: { anonymityThreshold: 5, rawRetention: 30, documentRetention: 3650, employeeRetention: 3650, notice: "Örnek aydınlatma metni: Çalışan ve müşteri geri bildirimleri, süreçlerin iyileştirilmesi amacıyla anonim olarak değerlendirilir. Özel mesajlar okunmaz. İlgili kişi hakları için şirketin KVKK sorumlusuna başvurabilirsiniz. Bu metin hukuk incelemesi gerektiren bir taslaktır.", deletionRequested: false },
  appearance: { theme: "sistem", density: "rahat" },
  security: { twoFactor: false, sessions: [ { id: "s1", device: "Chrome · Bu cihaz", location: "İstanbul", at: "2026-10-21T08:30:00", current: true }, { id: "s2", device: "Safari · iPhone", location: "İstanbul", at: "2026-10-20T19:30:00", current: false }, { id: "s3", device: "Edge · Windows", location: "Ankara", at: "2026-10-19T11:00:00", current: false } ], audit: Array.from({ length: 12 }, (_, i) => ({ id: `log${i}`, kim: ["Deniz", "Ece Yıldız", "Mert Demir"][i % 3] ?? "Deniz", islem: ["TC kimlik görüntüleme", "IBAN görüntüleme", "Belge indirme", "Bildirim tercihleri güncelleme"][i % 4] ?? "Oturum açma", kategori: ["Hassas veri", "Hassas veri", "Belge", "Ayarlar"][i % 4] ?? "Ayarlar", at: new Date(Date.UTC(2026, 9, 21 - i, 8, 30)).toISOString() })) },
  plan: { name: "Büyüme", monthly: 2490, usage: [ { label: "Çalışan", used: 49, limit: 100 }, { label: "Kullanıcı", used: 5, limit: 15 }, { label: "Aylık yorum", used: 3240, limit: 10000 }, { label: "Belge alanı (GB)", used: 2, limit: 10 } ], invoices: [ { id: "FTR-2026-010", at: "2026-10-01", amount: 2490, status: "Ödendi" }, { id: "FTR-2026-009", at: "2026-09-01", amount: 2490, status: "Ödendi" }, { id: "FTR-2026-008", at: "2026-08-01", amount: 2490, status: "Ödendi" } ] },
};
