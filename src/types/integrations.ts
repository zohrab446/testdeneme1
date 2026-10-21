export type IntegrationCategory = "iletisim" | "musteri" | "ik" | "veri";
export type IntegrationStatus = "bagli" | "bagli_degil" | "hata" | "yakinda";
export type SyncFrequency = "saatlik" | "gunluk" | "haftalik";
export interface IntegrationChannel { id: string; name: string }
export interface IntegrationSync { id: string; at: string; success: boolean; count: number; detail?: string }
export interface IntegrationConnection {
  id: string;
  name: string;
  monogram: string;
  description: string;
  category: IntegrationCategory;
  status: IntegrationStatus;
  permissions: string[];
  channels: IntegrationChannel[];
  selectedChannels: string[];
  frequency: SyncFrequency;
  logs: IntegrationSync[];
  lastSync?: string;
  error?: string;
  consent: boolean;
  deletionDays: number;
  deleteAt?: string;
  notificationEmail?: string;
}