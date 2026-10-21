import type {
  ActionCard,
  CustomerReview,
  DashboardSummary,
  Department,
  Employee,
  Integration,
  OnboardingInvite,
  OnboardingDetails,
  OnboardingDocument,
  OnboardingActivity,
  DataTransferItem,
  SentimentPoint,
} from "@/types";

export const departments: Department[] = [
  { id: "d1", name: "Satış", headcount: 12 },
  { id: "d2", name: "Operasyon", headcount: 18 },
  { id: "d3", name: "Yazılım", headcount: 9 },
  { id: "d4", name: "Müşteri Hizmetleri", headcount: 7 },
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

export const actionCards: ActionCard[] = [
  {
    id: "a1",
    title: "Kargo gecikmesi şikâyetleri artıyor",
    summary: "Son 14 günde olumsuz yorumların %38'i teslimat süresiyle ilgili.",
    source: "musteri",
    severity: "kritik",
    impactEstimate: 42500,
    status: "yeni",
    createdAt: "2026-10-19",
  },
];

export const sentimentSeries: SentimentPoint[] = Array.from({ length: 8 }, (_, i) => ({
  date: `2026-0${(i % 9) + 1}-01`,
  score: [0.21, 0.18, 0.25, 0.3, 0.22, 0.12, 0.28, 0.34][i] ?? 0,
  responses: 40 + i * 3,
}));

export const customerReviews: CustomerReview[] = [
  {
    id: "r1",
    source: "google",
    author: "Ali V.",
    rating: 2,
    text: "Ürün güzel ama kargo çok geç geldi.",
    sentiment: "olumsuz",
    createdAt: "2026-10-18",
  },
];

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
