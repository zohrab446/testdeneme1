import { z } from "zod";
import type { InviteStatus, ReviewStatus, Severity, TransferStatus } from "@/types";

export const INVITE_VALID_DAYS = 7;

export const inviteStatusMeta: Record<InviteStatus, { label: string; tone: Severity }> = {
  davet_gonderildi: { label: "Davet Gönderildi", tone: "notr" },
  form_dolduruluyor: { label: "Form Dolduruluyor", tone: "bilgi" },
  onay_bekliyor: { label: "Onay Bekliyor", tone: "uyari" },
  duzeltme_istendi: { label: "Düzeltme İstendi", tone: "kritik" },
  tamamlandi: { label: "Tamamlandı", tone: "basari" },
};

export const reviewStatusMeta: Record<ReviewStatus, { label: string; tone: Severity }> = {
  bekliyor: { label: "İnceleniyor", tone: "uyari" },
  onaylandi: { label: "Onaylandı", tone: "basari" },
  reddedildi: { label: "Reddedildi", tone: "kritik" },
};

export const transferStatusMeta: Record<TransferStatus, { label: string; tone: Severity }> = {
  hazirlaniyor: { label: "Hazırlanıyor", tone: "uyari" },
  hazir: { label: "Hazır", tone: "bilgi" },
  aktarildi: { label: "Aktarıldı", tone: "basari" },
};

/** Yerel saatle bugünün yyyy-aa-gg karşılığı. */
export function todayISO(now = new Date()) {
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${m}-${d}`;
}

export function inviteExpiry(from = new Date()) {
  return new Date(from.getTime() + INVITE_VALID_DAYS * 24 * 60 * 60 * 1000).toISOString();
}

export function welcomePath(token: string) {
  return `/karsilama/${token}`;
}

export const newEmployeeSchema = (today = todayISO()) =>
  z.object({
    employeeName: z
      .string()
      .trim()
      .min(3, "Ad soyad en az 3 karakter olmalı")
      .max(100, "Ad soyad en fazla 100 karakter olabilir")
      .refine((v) => v.split(/\s+/).length >= 2, "Ad ve soyadı birlikte yazın"),
    email: z.string().trim().email("Geçerli bir e-posta girin").max(255),
    title: z.string().trim().min(2, "Pozisyon girin").max(100),
    departmentId: z.string().min(1, "Departman seçin"),
    startDate: z
      .string()
      .min(1, "Başlangıç tarihi seçin")
      .refine((v) => v >= today, "Başlangıç tarihi geçmiş bir tarih olamaz"),
  });

export const correctionSchema = z.object({
  targets: z.array(z.string()).min(1, "En az bir alan veya belge seçin"),
  note: z.string().trim().min(5, "Not en az 5 karakter olmalı").max(1000),
});
