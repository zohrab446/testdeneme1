export type UserRole = "Sahip" | "İK Yöneticisi" | "Departman Yöneticisi" | "Salt Okunur";
export interface SettingsDepartment { id: string; ad: string; yonetici: string; calisanSayisi: number }
export interface SettingsUser { id: string; ad: string; email: string; rol: UserRole; sonGiris?: string; durum: "Aktif" | "Davet Bekliyor" | "Pasif"; departmentId?: string }
export interface AuditEntry { id: string; kim: string; islem: string; kategori: string; at: string }
export interface AppSettings {
  language: "tr"; currency: "TRY"; currentUserId: string;
  company: { ad: string; vergiNo: string; sektor: string; calisanAraligi: string; adres: string; logo: string };
  departments: SettingsDepartment[]; users: SettingsUser[];
  notifications: { email: boolean; inApp: boolean; slack: boolean; critical: boolean; resignation: boolean; onboarding: boolean; actionDue: boolean; weekly: boolean; day: string; time: string; quietEnabled: boolean; quietStart: string; quietEnd: string };
  privacy: { anonymityThreshold: 5; rawRetention: number; documentRetention: number; employeeRetention: number; notice: string; deletionRequested: boolean };
  appearance: { theme: "acik" | "koyu" | "sistem"; density: "rahat" | "siki" };
  security: { twoFactor: boolean; sessions: { id: string; device: string; location: string; at: string; current: boolean }[]; audit: AuditEntry[] };
  plan: { name: string; monthly: number; usage: { label: string; used: number; limit: number }[]; invoices: { id: string; at: string; amount: number; status: string }[] };
}
export type SettingsSection = "company" | "notifications" | "privacy" | "appearance";
