import type {
  ActionCard,
  CustomerReview,
  DashboardSummary,
  Department,
  Employee,
  Integration,
  OnboardingInvite,
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

export const onboardingInvites: OnboardingInvite[] = [
  {
    id: "o1",
    token: "demo-token-123",
    employeeName: "Zeynep Demir",
    email: "zeynep@ornek.com.tr",
    title: "Müşteri Temsilcisi",
    departmentId: "d4",
    startDate: "2026-11-02",
    status: "acildi",
    progress: 40,
    createdAt: "2026-10-15",
  },
];

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
