import { z } from "zod";
import {
  isAtLeastAge,
  isValidTCKN,
  isValidTRIban,
  normalizeIban,
  TR_MOBILE_REGEX,
} from "@/lib/validators";
import type { OnboardingDetails, OnboardingDocument } from "@/types";

const req = (msg: string) => z.string().trim().min(1, msg).max(200, "En fazla 200 karakter olabilir");
const phone = z
  .string()
  .trim()
  .min(1, "Telefon numarası zorunlu")
  .regex(TR_MOBILE_REGEX, "Telefonu +90 5XX XXX XX XX biçiminde gir");

export const welcomeSchema = z
  .object({
    fullName: z.string().trim().min(3, "Ad soyad zorunlu").max(100),
    tckn: z
      .string()
      .trim()
      .min(1, "TC kimlik no zorunlu")
      .regex(/^\d{11}$/, "TC kimlik no 11 haneli olmalı")
      .refine((v) => v[0] !== "0", "TC kimlik no 0 ile başlayamaz")
      .refine(isValidTCKN, "Geçerli bir TC kimlik no gir"),
    birthDate: z
      .string()
      .min(1, "Doğum tarihi zorunlu")
      .refine((v) => isAtLeastAge(v, 18), "18 yaşından büyük olmalısın"),
    birthPlace: req("Doğum yeri zorunlu"),
    motherName: req("Anne adı zorunlu"),
    fatherName: req("Baba adı zorunlu"),
    maritalStatus: req("Medeni hal seç"),
    gender: req("Cinsiyet seç"),
    nationality: req("Uyruk zorunlu"),

    phone,
    email: z.string().trim().min(1, "E-posta zorunlu").email("Geçerli bir e-posta gir").max(255),
    city: req("İl zorunlu"),
    district: req("İlçe zorunlu"),
    neighborhood: req("Mahalle zorunlu"),
    address: z.string().trim().min(5, "Açık adres zorunlu").max(500),

    educationLevel: req("Öğrenim durumu seç"),
    school: req("Okul / bölüm zorunlu"),
    graduationYear: z
      .string()
      .regex(/^\d{4}$/, "Mezuniyet yılını 4 haneli gir")
      .refine((v) => Number(v) >= 1950 && Number(v) <= new Date().getFullYear() + 1, "Geçerli bir yıl gir"),
    previouslyInsured: req("Önceki SGK durumunu seç"),
    military: z.string().optional(),

    iban: z
      .string()
      .min(1, "IBAN zorunlu")
      .refine((v) => normalizeIban(v).startsWith("TR"), "IBAN TR ile başlamalı")
      .refine((v) => normalizeIban(v).length === 26, "IBAN 26 karakter olmalı")
      .refine(isValidTRIban, "IBAN doğrulanamadı, lütfen kontrol et"),

    emergencyName: req("Ad soyad zorunlu"),
    emergencyRelation: req("Yakınlık zorunlu"),
    emergencyPhone: phone,

    kvkk: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.gender === "Erkek" && !v.military)
      ctx.addIssue({ code: "custom", path: ["military"], message: "Askerlik durumunu seç" });
  });

export type WelcomeValues = z.infer<typeof welcomeSchema>;

export type StepId = "kisisel" | "iletisim" | "egitim" | "banka" | "acil" | "belgeler" | "ozet";

/** HR düzeltme isteğindeki bölüm etiketleriyle eşleşir. */
export const STEPS: { id: StepId; title: string; hrLabel?: string; fields: (keyof WelcomeValues)[] }[] = [
  {
    id: "kisisel",
    title: "Kişisel bilgiler",
    hrLabel: "Kişisel",
    fields: ["fullName", "tckn", "birthDate", "birthPlace", "motherName", "fatherName", "maritalStatus", "gender", "nationality"],
  },
  { id: "iletisim", title: "İletişim", hrLabel: "İletişim", fields: ["phone", "email", "city", "district", "neighborhood", "address"] },
  {
    id: "egitim",
    title: "Eğitim ve çalışma",
    hrLabel: "Eğitim/Çalışma",
    fields: ["educationLevel", "school", "graduationYear", "previouslyInsured", "military"],
  },
  { id: "banka", title: "Banka", hrLabel: "Banka", fields: ["iban"] },
  { id: "acil", title: "Acil durum kişisi", hrLabel: "Acil Durum", fields: ["emergencyName", "emergencyRelation", "emergencyPhone"] },
  { id: "belgeler", title: "Belgeler", fields: [] },
  { id: "ozet", title: "Özet ve onay", fields: [] },
];

export const DOC_SLOTS = [
  { id: "kimlik", label: "Kimlik fotokopisi" },
  { id: "diploma", label: "Diploma" },
  { id: "fotograf", label: "Vesikalık fotoğraf" },
  { id: "ikametgah", label: "İkametgâh belgesi" },
] as const;
export type DocSlotId = (typeof DOC_SLOTS)[number]["id"];

export function emptyValues(fullName: string, email: string): WelcomeValues {
  return {
    fullName, tckn: "", birthDate: "", birthPlace: "", motherName: "", fatherName: "",
    maritalStatus: "", gender: "", nationality: "T.C.",
    phone: "", email, city: "", district: "", neighborhood: "", address: "",
    educationLevel: "", school: "", graduationYear: "", previouslyInsured: "", military: "",
    iban: "", emergencyName: "", emergencyRelation: "", emergencyPhone: "", kvkk: false,
  };
}

export function fromDetails(d: OnboardingDetails, base: WelcomeValues): WelcomeValues {
  return {
    ...base,
    fullName: d.personal.fullName ?? base.fullName,
    tckn: d.personal.tckn,
    birthDate: d.personal.birthDate,
    birthPlace: d.personal.birthPlace,
    motherName: d.personal.motherName ?? "",
    fatherName: d.personal.fatherName ?? "",
    maritalStatus: d.personal.maritalStatus,
    gender: d.personal.gender,
    nationality: d.personal.nationality ?? "T.C.",
    phone: d.contact.phone,
    email: d.contact.email,
    city: d.contact.city,
    district: d.contact.district ?? "",
    neighborhood: d.contact.neighborhood ?? "",
    address: d.contact.address,
    educationLevel: d.education.degree,
    school: d.education.school,
    graduationYear: String(d.education.graduationYear),
    previouslyInsured: d.education.previouslyInsured ?? "",
    military: d.education.military ?? "",
    iban: d.bank.iban,
    emergencyName: d.emergency.name,
    emergencyRelation: d.emergency.relation,
    emergencyPhone: d.emergency.phone,
  };
}

export function toDetails(v: WelcomeValues, prev?: OnboardingDetails): OnboardingDetails {
  return {
    personal: {
      fullName: v.fullName, tckn: v.tckn, birthDate: v.birthDate, birthPlace: v.birthPlace,
      motherName: v.motherName, fatherName: v.fatherName, maritalStatus: v.maritalStatus,
      gender: v.gender, nationality: v.nationality,
    },
    contact: {
      phone: v.phone, email: v.email, city: v.city, district: v.district,
      neighborhood: v.neighborhood, address: v.address,
    },
    education: {
      degree: v.educationLevel, school: v.school, graduationYear: Number(v.graduationYear),
      previousEmployer: prev?.education.previousEmployer ?? "",
      previouslyInsured: v.previouslyInsured,
      military: v.gender === "Erkek" ? v.military : undefined,
    },
    bank: { bankName: prev?.bank.bankName ?? "", iban: normalizeIban(v.iban) },
    emergency: { name: v.emergencyName, relation: v.emergencyRelation, phone: v.emergencyPhone },
  };
}

export interface WelcomeDraft {
  values: WelcomeValues;
  stepIndex: number;
  docs: Partial<Record<DocSlotId, OnboardingDocument>>;
}

export const draftKey = (token: string) => `karsilama-taslak:${token}`;
