export type ID = string;
export type ISODate = string;

export type Severity = "basari" | "uyari" | "kritik" | "bilgi" | "notr";

export interface Department {
  id: ID;
  name: string;
  headcount: number;
  managerId?: ID;
}

export interface Employee {
  id: ID;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  tckn?: string;
  iban?: string;
  title: string;
  departmentId: ID;
  startDate: ISODate;
  salary?: number;
  status: "aktif" | "izinde" | "ayrildi" | "aday";
}

export type InviteStatus = "gonderildi" | "acildi" | "tamamlandi" | "suresi_doldu";

export interface OnboardingInvite {
  id: ID;
  token: string;
  employeeName: string;
  email: string;
  title: string;
  departmentId: ID;
  startDate: ISODate;
  status: InviteStatus;
  progress: number; // 0-100
  createdAt: ISODate;
}

export interface CreateEmployeeInviteInput {
  employeeName: string;
  email: string;
  title: string;
  departmentId: ID;
  startDate: ISODate;
}

export interface ActionCard {
  id: ID;
  title: string;
  summary: string;
  source: "calisan" | "musteri" | "karma";
  severity: Severity;
  impactEstimate?: number; // ₺
  status: "yeni" | "devam" | "tamamlandi" | "ertelendi";
  createdAt: ISODate;
}

export interface SentimentPoint {
  date: ISODate;
  score: number; // -1..1
  responses: number;
  departmentId?: ID;
}

export interface CustomerReview {
  id: ID;
  source: "google" | "trendyol" | "hepsiburada" | "sikayetvar" | "anket";
  author: string;
  rating: number; // 1-5
  text: string;
  sentiment: "olumlu" | "notr" | "olumsuz";
  createdAt: ISODate;
}

export interface Integration {
  id: ID;
  name: string;
  category: "ik" | "musteri" | "iletisim" | "muhasebe";
  connected: boolean;
}

export interface DashboardSummary {
  employeeCount: number;
  pulseScore: number;
  pulseDelta: number;
  nps: number;
  npsDelta: number;
  openActions: number;
  estimatedImpact: number;
}

export interface CompanySetup {
  companyName: string;
  sector: string;
  employeeRange: string;
  sources: string[];
  goals: string[];
  completedAt: ISODate;
}
