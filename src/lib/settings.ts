import { z } from "zod";
import type { AppSettings } from "@/types/settings";
export const companySchema = z.object({ ad: z.string().trim().min(2, "Şirket adı en az 2 karakter olmalı."), vergiNo: z.string().regex(/^\d{10}$/, "Vergi no 10 haneli olmalı."), sektor: z.string().min(1, "Sektör seçin."), calisanAraligi: z.string().min(1, "Çalışan aralığı seçin."), adres: z.string().trim().min(10, "Adres en az 10 karakter olmalı."), logo: z.string() });
export const departmentSchema = z.object({ ad: z.string().trim().min(2, "Departman adı en az 2 karakter olmalı."), yonetici: z.string().trim().min(2, "Yönetici adı girin."), calisanSayisi: z.coerce.number().int("Tam sayı girin.").min(0, "Çalışan sayısı negatif olamaz.") });
export const roles = ["Sahip", "İK Yöneticisi", "Departman Yöneticisi", "Salt Okunur"] as const;
export const inviteSchema = z.object({ email: z.string().email("Geçerli bir e-posta girin."), rol: z.enum(roles), departmentId: z.string() }).superRefine((v, ctx) => { if (v.rol === "Departman Yöneticisi" && !v.departmentId) ctx.addIssue({ code: "custom", path: ["departmentId"], message: "Yöneteceği departmanı seçin." }); });
export const notificationSchema = z.object({ email: z.boolean(), inApp: z.boolean(), slack: z.boolean(), critical: z.boolean(), resignation: z.boolean(), onboarding: z.boolean(), actionDue: z.boolean(), weekly: z.boolean(), day: z.string().min(1), time: z.string().regex(/^\d{2}:\d{2}$/, "Saat seçin."), quietEnabled: z.boolean(), quietStart: z.string().regex(/^\d{2}:\d{2}$/, "Saat seçin."), quietEnd: z.string().regex(/^\d{2}:\d{2}$/, "Saat seçin.") });
export const privacySchema = z.object({ anonymityThreshold: z.literal(5), rawRetention: z.coerce.number().refine(v => [30, 60, 90].includes(v), "30, 60 veya 90 gün seçin."), documentRetention: z.coerce.number().min(30, "En az 30 gün seçin."), employeeRetention: z.coerce.number().min(30, "En az 30 gün seçin."), notice: z.string().trim().min(20, "Aydınlatma metni en az 20 karakter olmalı."), deletionRequested: z.boolean() });
export const appearanceSchema = z.object({ theme: z.enum(["acik", "koyu", "sistem"]), density: z.enum(["rahat", "siki"]) });
export const passwordSchema = z.object({ current: z.string().min(1, "Mevcut şifrenizi girin."), password: z.string().min(8, "En az 8 karakter kullanın.").regex(/[A-ZÇĞİÖŞÜ]/, "En az bir büyük harf kullanın.").regex(/\d/, "En az bir rakam kullanın."), repeat: z.string() }).refine(v => v.password === v.repeat, { message: "Şifreler eşleşmiyor.", path: ["repeat"] });
export function applyAppearance(value: AppSettings["appearance"]) {
  const dark = value.theme === "koyu" || (value.theme === "sistem" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
  if (value.theme === "sistem") localStorage.removeItem("tema"); else localStorage.setItem("tema", value.theme);
  document.documentElement.dataset.density = value.density;
}
export function downloadData(filename: string, content: string, type = "text/csv;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function csv(rows: (string | number)[][]) { return "\uFEFF" + rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\r\n"); }
