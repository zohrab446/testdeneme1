import * as db from "@/mocks/data";
import { inviteExpiry } from "@/lib/onboarding";
import type {
  CorrectionRequest,
  CreateEmployeeInviteInput,
  OnboardingActivity,
  OnboardingInvite,
  ReviewStatus,
  CompanyProfile,
  SubmitOnboardingInput,
  OnboardingDocument,
} from "@/types";
import { delay, mockResponse } from "./http";

function find(id: string) {
  const rec = db.onboardingInvites.find((i) => i.id === id);
  if (!rec) throw new Error("Kayıt bulunamadı.");
  return rec;
}

function log(rec: OnboardingInvite, type: OnboardingActivity["type"], label: string, note?: string) {
  rec.activity.push({ id: `act${Date.now()}`, type, label, at: new Date().toISOString(), note });
}

function newToken() {
  return crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

export const getOnboardingInvites = (): Promise<OnboardingInvite[]> =>
  mockResponse(db.onboardingInvites, []);

export const getOnboardingInvite = (id: string): Promise<OnboardingInvite | null> =>
  mockResponse(db.onboardingInvites.find((i) => i.id === id) ?? null, null);

export const getInviteByToken = (token: string): Promise<OnboardingInvite | null> =>
  mockResponse(db.onboardingInvites.find((i) => i.token === token) ?? null, null);

export async function createEmployeeInvite(input: CreateEmployeeInviteInput): Promise<OnboardingInvite> {
  await delay();
  const now = new Date();
  const invite: OnboardingInvite = {
    ...input,
    id: `o${now.getTime()}`,
    token: newToken(),
    status: "davet_gonderildi",
    progress: 0,
    createdAt: now.toISOString(),
    expiresAt: inviteExpiry(now),
    documents: [],
    activity: [],
  };
  log(invite, "davet_gonderildi", "Davet gönderildi");
  db.onboardingInvites.unshift(invite);
  return structuredClone(invite);
}

export async function resendInvite(id: string): Promise<OnboardingInvite> {
  await delay();
  const rec = find(id);
  rec.token = newToken();
  rec.expiresAt = inviteExpiry();
  log(rec, "davet_tekrar", "Davet linki yeniden gönderildi");
  return structuredClone(rec);
}

export async function cancelInvite(id: string): Promise<void> {
  await delay();
  const i = db.onboardingInvites.findIndex((r) => r.id === id);
  if (i >= 0) db.onboardingInvites.splice(i, 1);
}

export async function setDocumentStatus(id: string, docId: string, status: ReviewStatus) {
  await delay(300, 500);
  const rec = find(id);
  const doc = rec.documents.find((d) => d.id === docId);
  if (!doc) throw new Error("Belge bulunamadı.");
  doc.status = status;
  log(
    rec,
    status === "onaylandi" ? "belge_onaylandi" : "belge_reddedildi",
    `${doc.name} ${status === "onaylandi" ? "onaylandı" : "reddedildi"}`,
  );
  return structuredClone(rec);
}

export async function approveOnboarding(id: string): Promise<OnboardingInvite> {
  await delay();
  const rec = find(id);
  rec.status = "tamamlandi";
  rec.progress = 100;
  rec.correction = undefined;
  rec.documents.forEach((d) => (d.status = "onaylandi"));
  rec.transfers = structuredClone(db.defaultTransfers);
  log(rec, "onaylandi", "Kayıt onaylandı");
  return structuredClone(rec);
}

export async function requestCorrection(id: string, req: CorrectionRequest): Promise<OnboardingInvite> {
  await delay();
  const rec = find(id);
  rec.status = "duzeltme_istendi";
  rec.correction = req;
  log(rec, "duzeltme_istendi", `Düzeltme istendi: ${req.targets.join(", ")}`, req.note);
  return structuredClone(rec);
}

/** SGK işe giriş bildirgesi için gerekli alanları düz bir nesne olarak hazırlar. */
export async function getSgkExport(id: string) {
  await delay(300, 500);
  const rec = find(id);
  const dept = db.departments.find((d) => d.id === rec.departmentId);
  const [ad, ...soyad] = rec.employeeName.split(" ");
  return {
    tcKimlikNo: rec.details?.personal.tckn ?? "",
    ad: ad ?? "",
    soyad: soyad.join(" "),
    dogumTarihi: rec.details?.personal.birthDate ?? "",
    dogumYeri: rec.details?.personal.birthPlace ?? "",
    cinsiyet: rec.details?.personal.gender ?? "",
    iseGirisTarihi: rec.startDate,
    gorevi: rec.title,
    departman: dept?.name ?? "",
    eposta: rec.email,
    telefon: rec.details?.contact.phone ?? "",
    adres: rec.details ? `${rec.details.contact.address}, ${rec.details.contact.city}` : "",
    ogrenimDurumu: rec.details?.education.degree ?? "",
    iban: rec.details?.bank.iban ?? "",
    hazirlanmaZamani: new Date().toISOString(),
  };
}

export const getCompanyProfile = (): Promise<CompanyProfile> => mockResponse(db.companyProfile);

/** Çalışan formu ilk kez açtığında durumu "Form Dolduruluyor"a çeker. */
export async function openInviteForm(token: string): Promise<void> {
  await delay(200, 300);
  const rec = db.onboardingInvites.find((i) => i.token === token);
  if (rec && rec.status === "davet_gonderildi") {
    rec.status = "form_dolduruluyor";
    rec.progress = Math.max(rec.progress, 10);
    log(rec, "form_acildi", "Form açıldı");
  }
}

/** Mock yükleme: gerçek backend'de dosya depoya yüklenip meta veri döner. */
export async function uploadDocument(
  slotId: string,
  file: { name: string; type: string; size: number },
): Promise<OnboardingDocument> {
  await delay(300, 700);
  return {
    id: slotId,
    name: file.name,
    kind: file.type === "application/pdf" ? "pdf" : "gorsel",
    sizeKb: Math.max(1, Math.round(file.size / 1024)),
    status: "bekliyor",
  };
}

export async function submitOnboardingForm(token: string, input: SubmitOnboardingInput) {
  await delay();
  const rec = db.onboardingInvites.find((i) => i.token === token);
  if (!rec) throw new Error("Davet bulunamadı.");
  const wasCorrection = rec.status === "duzeltme_istendi";
  rec.details = structuredClone(input.details);
  const byId = new Map(rec.documents.map((d) => [d.id, d]));
  input.documents.forEach((d) => byId.set(d.id, { ...d, status: "bekliyor" }));
  rec.documents = [...byId.values()];
  rec.status = "onay_bekliyor";
  rec.progress = 100;
  rec.correction = undefined;
  log(rec, "form_gonderildi", wasCorrection ? "Düzeltilmiş form gönderildi" : "Form gönderildi");
}
