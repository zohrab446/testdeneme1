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
  personal: {
    fullName?: string | undefined;
    birthDate: ISODate;
    birthPlace: string;
    gender: string;
    maritalStatus: string;
    tckn: string;
    motherName?: string | undefined;
    fatherName?: string | undefined;
    nationality?: string | undefined;
  };
  contact: {
    phone: string;
    email: string;
    address: string;
    city: string;
    district?: string | undefined;
    neighborhood?: string | undefined;
  };
  education: {
    school: string;
    degree: string;
    graduationYear: number;
    previousEmployer: string;
    previouslyInsured?: string | undefined;
    military?: string | undefined;
  };
  bank: { bankName: string; iban: string };
  emergency: { name: string; relation: string; phone: string };
}

export interface CompanyProfile {
  name: string;
  kvkkContact: string;
}

export interface SubmitOnboardingInput {
  details: OnboardingDetails;
  documents: OnboardingDocument[];
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

export type VocSourceId = "trendyol" | "sikayetvar" | "google" | "hepsiburada" | "appstore" | "csv";
export type VocTopic = "kargo" | "fiyat" | "kalite" | "musteri_hizmetleri" | "uygulama" | "iade";
export type VocSentiment = "olumlu" | "notr" | "olumsuz";

export interface CustomerReview {
  id: ID;
  source: VocSourceId;
  author: string;
  rating: number; // 1-5
  text: string;
  topic: VocTopic;
  sentiment: VocSentiment;
  createdAt: ISODate;
}

export interface VocSource {
  id: VocSourceId;
  name: string;
  description: string;
  status: "bagli" | "bagli_degil" | "hata";
  reviewCount: number;
  lastSync?: ISODate | undefined;
  errorMessage?: string | undefined;
}

export interface VocFilter {
  from: ISODate;
  to: ISODate;
  sources: VocSourceId[];
}

export interface VocAnalytics {
  total: number;
  sentiment: Record<VocSentiment, number>;
  complaints: { topic: VocTopic; count: number }[];
  weeks: ISODate[];
  topicTrend: Record<VocTopic, number[]>;
}

export interface VocAnswer {
  matched: true;
  question: string;
  finding: string;
  stats: { label: string; value: string }[];
  samples: CustomerReview[];
  action: { title: string; summary: string; severity: Severity };
}
export type VocAskResult = VocAnswer | { matched: false; suggestions: string[] };

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

export type PulseSourceStatus = "bagli" | "bagli_degil" | "hata";
export interface PulseSource {
  id: "slack" | "teams" | "oneri" | "csv";
  name: string;
  description: string;
  status: PulseSourceStatus;
  lastSync?: ISODate | undefined;
  errorMessage?: string | undefined;
}

export type PulseTopicId = "mesai" | "yonetici" | "maas" | "belirsizlik" | "denge";
export type RiskLevel = "dusuk" | "orta" | "yuksek";

/** Ham departman nabız verisi (yalnızca servis katmanında kullanılır). */
export interface RawDepartmentPulse {
  departmentId: ID;
  respondents: number;
  topics: Record<PulseTopicId, number>; // 0-100, yüksek = olumlu
  trend: number[]; // 12 haftalık duygu skoru 0-100
  risk: RiskLevel;
  riskReasons: string[];
  themes: string[];
  quotes: string[];
  actionCardId?: ID | undefined;
}

/** UI'ya giden, gizlilik eşiği uygulanmış departman verisi. */
export type DepartmentPulse =
  | { departmentId: ID; departmentName: string; suppressed: true }
  | (Omit<RawDepartmentPulse, "respondents"> & { departmentName: string; suppressed: false });

export interface PulseOverview {
  weeks: ISODate[];
  companyTrend: number[];
  departments: DepartmentPulse[];
}
