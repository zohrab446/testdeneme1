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

export type InviteStatus =
  | "davet_gonderildi"
  | "form_dolduruluyor"
  | "onay_bekliyor"
  | "duzeltme_istendi"
  | "tamamlandi";

export type ReviewStatus = "bekliyor" | "onaylandi" | "reddedildi";

export interface OnboardingDocument {
  id: ID;
  name: string;
  kind: "gorsel" | "pdf";
  sizeKb: number;
  status: ReviewStatus;
}

export interface OnboardingActivity {
  id: ID;
  type:
    | "davet_gonderildi"
    | "davet_tekrar"
    | "form_acildi"
    | "form_gonderildi"
    | "duzeltme_istendi"
    | "belge_onaylandi"
    | "belge_reddedildi"
    | "onaylandi";
  label: string;
  at: ISODate;
  note?: string | undefined;
}

export type TransferStatus = "hazirlaniyor" | "hazir" | "aktarildi";

export interface DataTransferItem {
  id: "sgk" | "bordro" | "ozluk" | "sozlesme";
  title: string;
  description: string;
  status: TransferStatus;
}

export interface OnboardingDetails {
  personal: { birthDate: ISODate; birthPlace: string; gender: string; maritalStatus: string; tckn: string };
  contact: { phone: string; email: string; address: string; city: string };
  education: { school: string; degree: string; graduationYear: number; previousEmployer: string };
  bank: { bankName: string; iban: string };
  emergency: { name: string; relation: string; phone: string };
}

export interface CorrectionRequest {
  targets: string[];
  note: string;
}

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
  expiresAt: ISODate;
  details?: OnboardingDetails | undefined;
  documents: OnboardingDocument[];
  activity: OnboardingActivity[];
  transfers?: DataTransferItem[] | undefined;
  correction?: CorrectionRequest | undefined;
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
