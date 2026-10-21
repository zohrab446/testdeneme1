import * as db from "@/mocks/data";
import type {
  ActionCard,
  AdvisorAction,
  ActionStatus,
  DashboardSummary,
  Department,
  Employee,
  Integration,
  SentimentPoint,
} from "@/types";
import { delay, mockResponse } from "./http";
import type { AppSettings, SettingsDepartment, SettingsSection, UserRole } from "@/types/settings";
import { companySchema, departmentSchema, inviteSchema, notificationSchema, privacySchema, appearanceSchema, passwordSchema, roles } from "@/lib/settings";

export const getDashboardSummary = (): Promise<DashboardSummary | null> =>
  mockResponse<DashboardSummary | null>(db.dashboardSummary, null);

export function normalizeAction(card: ActionCard): AdvisorAction {
  const legacy = { yeni: "Öneri", devam: "DevamEdiyor", tamamlandi: "Tamamlandı", ertelendi: "Ertelendi" } as const;
  const mapped = card.status === "devam" ? "DevamEdiyor" : card.status === "tamamlandi" ? "Tamamlandı" : card.status === "ertelendi" ? "Ertelendi" : undefined;
  return { ...card, bulgu: card.bulgu ?? card.summary, neden: card.neden ?? "Geri bildirimlerde tekrar eden sorunlar bu öneriyi öne çıkardı.", aksiyonlar: card.aksiyonlar ?? ["En sık bildirilen sorunu incele.", "Sorumlu ekip ile küçük bir iyileştirme planla.", "İki hafta sonra sonuçları karşılaştır."], beklenenEtki: card.beklenenEtki ?? "Tekrar eden şikâyetlerin azaltılması hedefleniyor.", aciliyet: card.aciliyet ?? (card.severity === "kritik" ? "Kritik" : card.severity === "uyari" ? "Yüksek" : "Düşük"), kaynak: card.kaynak ?? (card.source === "musteri" ? "Müşteri" : "Çalışan"), departman: card.departman ?? "Müşteri Hizmetleri", durum: mapped ?? card.durum ?? legacy[card.status], olusturmaTarihi: card.olusturmaTarihi ?? card.createdAt, nasilUretildi: card.nasilUretildi ?? { aciklama: "Anonim müşteri yorumlarındaki benzer temalar birlikte değerlendirildi.", veriNoktasiSayisi: db.customerReviews.length } };
}
export const getActionCards = (): Promise<AdvisorAction[]> => mockResponse(db.actionCards.map(normalizeAction), []);
export async function updateActionStatus(id: string, durum: ActionStatus): Promise<AdvisorAction> {
  await delay();
  if (!["Öneri", "Ertelendi", "Yapılacak", "DevamEdiyor", "Tamamlandı"].includes(durum)) throw new Error("Geçersiz aksiyon durumu.");
  const card = db.actionCards.find(a => a.id === id);
  if (!card) throw new Error("Aksiyon bulunamadı.");
  card.durum = durum;
  card.status = durum === "Tamamlandı" ? "tamamlandi" : durum === "Ertelendi" ? "ertelendi" : durum === "DevamEdiyor" ? "devam" : "yeni";
  if (durum !== "Ertelendi") delete card.ertelemeTarihi;
  if (durum === "Yapılacak" && !card.vadeTarihi) card.vadeTarihi = new Date(Date.now() + 7 * 86400000).toISOString();
  return structuredClone(normalizeAction(card));
}
export async function snoozeAction(id: string, gun: number): Promise<AdvisorAction> {
  if (![1, 3, 7].includes(gun)) throw new Error("1, 3 veya 7 gün seçin.");
  await updateActionStatus(id, "Ertelendi");
  const card = db.actionCards.find(a => a.id === id);
  if (!card) throw new Error("Aksiyon bulunamadı.");
  card.ertelemeTarihi = new Date(Date.now() + gun * 86400000).toISOString();
  return structuredClone(normalizeAction(card));
}
export const markActionDone = (id: string) => updateActionStatus(id, "Tamamlandı");

export const getSentimentSeries = (): Promise<SentimentPoint[]> =>
  mockResponse(db.sentimentSeries, []);


export const getEmployees = (): Promise<Employee[]> => mockResponse(db.employees, []);

export const getDepartments = (): Promise<Department[]> => mockResponse(db.departments, []);

export const getIntegrations = (): Promise<Integration[]> => mockResponse(db.integrations, []);

export * from "./onboarding";

export const getSettings = (): Promise<AppSettings | null> => mockResponse(db.appSettings, null);
function audit(islem: string, kategori = "Ayarlar") {
  db.appSettings.security.audit.unshift({ id: crypto.randomUUID(), kim: "Deniz", islem, kategori, at: new Date().toISOString() });
}
export async function saveSettings<K extends SettingsSection>(bolum: K, veri: AppSettings[K]): Promise<AppSettings> {
  const schemas = { company: companySchema, notifications: notificationSchema, privacy: privacySchema, appearance: appearanceSchema };
  const result = schemas[bolum].safeParse(veri);
  if (!result.success) throw new Error(result.error.issues[0]?.message ?? "Bilgileri kontrol edin.");
  await delay();
  Object.assign(db.appSettings[bolum], result.data);
  audit(`${bolum === "company" ? "Şirket profili" : bolum === "privacy" ? "Gizlilik tercihleri" : bolum === "appearance" ? "Görünüm" : "Bildirim tercihleri"} güncellendi`);
  return structuredClone(db.appSettings);
}
export async function addDepartment(input: Omit<SettingsDepartment, "id">): Promise<AppSettings> {
  const data = departmentSchema.parse(input); await delay();
  if (db.appSettings.departments.some(d => d.ad.toLocaleLowerCase("tr") === data.ad.toLocaleLowerCase("tr"))) throw new Error("Bu departman zaten var.");
  db.appSettings.departments.push({ ...data, id: crypto.randomUUID() }); audit("Departman eklendi"); return structuredClone(db.appSettings);
}
export async function updateDepartment(id: string, input: Omit<SettingsDepartment, "id">): Promise<AppSettings> {
  const data = departmentSchema.parse(input); await delay();
  const dep = db.appSettings.departments.find(d => d.id === id); if (!dep) throw new Error("Departman bulunamadı.");
  if (db.appSettings.departments.some(d => d.id !== id && d.ad.toLocaleLowerCase("tr") === data.ad.toLocaleLowerCase("tr"))) throw new Error("Bu departman zaten var.");
  if (data.calisanSayisi < dep.calisanSayisi) throw new Error("Mevcut çalışanları buradan çıkaramazsınız; önce çalışan kayıtlarını güncelleyin.");
  Object.assign(dep, data); audit("Departman güncellendi"); return structuredClone(db.appSettings);
}
export async function deleteDepartment(id: string): Promise<AppSettings> {
  await delay(); const dep = db.appSettings.departments.find(d => d.id === id); if (!dep) throw new Error("Departman bulunamadı.");
  if (dep.calisanSayisi > 0) throw new Error("Çalışanı olan departman silinemez.");
  db.appSettings.departments = db.appSettings.departments.filter(d => d.id !== id); audit("Departman silindi"); return structuredClone(db.appSettings);
}
export async function inviteUser(email: string, rol: UserRole, departmentId = ""): Promise<AppSettings> {
  const input = inviteSchema.parse({ email, rol, departmentId }); await delay();
  if (db.appSettings.users.some(u => u.email.toLowerCase() === email.toLowerCase())) throw new Error("Bu e-posta zaten kayıtlı.");
  if (rol === "Departman Yöneticisi" && !db.appSettings.departments.some(d => d.id === departmentId)) throw new Error("Departman bulunamadı.");
  db.appSettings.users.push({ id: crypto.randomUUID(), ad: "Davetli kullanıcı", ...input, durum: "Davet Bekliyor" }); audit("Kullanıcı davet edildi"); return structuredClone(db.appSettings);
}
export async function updateUserRole(id: string, rol: UserRole): Promise<AppSettings> {
  await delay(); const user = db.appSettings.users.find(u => u.id === id); if (!user) throw new Error("Kullanıcı bulunamadı.");
  if (!roles.includes(rol)) throw new Error("Geçersiz rol.");
  if (user.rol === "Sahip" && rol !== "Sahip") throw new Error("Sahip rolü kaldırılamaz.");
  if (user.id === db.appSettings.currentUserId && rol !== user.rol) throw new Error("Kendi rolünüzü düşüremezsiniz.");
  if (rol === "Departman Yöneticisi" && !user.departmentId) throw new Error("Bu rol için önce kullanıcıya departman atayın.");
  user.rol = rol; audit("Kullanıcı rolü güncellendi"); return structuredClone(db.appSettings);
}
export async function changeMockPassword(input: { current: string; password: string; repeat: string }) { passwordSchema.parse(input); await delay(); audit("Şifre değişikliği örnek olarak kaydedildi", "Güvenlik"); return structuredClone(db.appSettings); }
export async function setMockTwoFactor(enabled: boolean) { await delay(); db.appSettings.security.twoFactor = enabled; audit(enabled ? "İki adımlı doğrulama örnek olarak açıldı" : "İki adımlı doğrulama örnek olarak kapatıldı", "Güvenlik"); return structuredClone(db.appSettings); }
export async function closeOtherSessions() { await delay(); db.appSettings.security.sessions = db.appSettings.security.sessions.filter(s => s.current); audit("Diğer örnek oturumlar kapatıldı", "Güvenlik"); return structuredClone(db.appSettings); }
export async function requestDataDeletion(text: string) { if (text !== "VERİLERİ SİL") throw new Error("Onay için VERİLERİ SİL yazın."); await delay(); db.appSettings.privacy.deletionRequested = true; audit("Veri silme talebi alındı", "Gizlilik"); return structuredClone(db.appSettings); }
export async function exportCompanyData() { await delay(); audit("Şirket verileri dışa aktarıldı", "Gizlilik"); return structuredClone({ settings: db.appSettings, actions: db.actionCards.map(normalizeAction), employees: db.employees.map(({ tckn: _tc, iban: _iban, ...rest }) => rest) }); }

export * from "./pulse";
export * from "./voc";
