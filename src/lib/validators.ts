/** Resmî TC Kimlik No algoritması (10. ve 11. hane kontrolü). */
export function isValidTCKN(value: string) {
  if (!/^[1-9]\d{10}$/.test(value)) return false;
  const d = value.split("").map(Number) as number[];
  const odd = d[0]! + d[2]! + d[4]! + d[6]! + d[8]!;
  const even = d[1]! + d[3]! + d[5]! + d[7]!;
  const d10 = (((odd * 7 - even) % 10) + 10) % 10;
  if (d10 !== d[9]) return false;
  const d11 = d.slice(0, 10).reduce((a, b) => a + b, 0) % 10;
  return d11 === d[10];
}

export const normalizeIban = (v: string) => v.replace(/\s+/g, "").toUpperCase();

/** TR IBAN: TR ile başlar, 26 karakter, ISO 13616 mod-97 kontrolü. */
export function isValidTRIban(value: string) {
  const iban = normalizeIban(value);
  if (!/^TR\d{24}$/.test(iban)) return false;
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let rem = 0;
  for (const ch of rearranged) {
    const n = /[A-Z]/.test(ch) ? String(ch.charCodeAt(0) - 55) : ch;
    for (const digit of n) rem = (rem * 10 + Number(digit)) % 97;
  }
  return rem === 1;
}

/** IBAN'ı 4'lü gruplar halinde gösterir. */
export const formatIban = (v: string) => normalizeIban(v).replace(/(.{4})/g, "$1 ").trim();

export const TR_MOBILE_REGEX = /^\+90 5\d{2} \d{3} \d{2} \d{2}$/;

/** Girdiyi +90 5XX XXX XX XX biçimine maskeler. */
export function maskTRPhone(input: string) {
  let digits = input.replace(/\D/g, "");
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  digits = digits.slice(0, 10);
  if (!digits) return "";
  const parts = [digits.slice(0, 3), digits.slice(3, 6), digits.slice(6, 8), digits.slice(8, 10)].filter(
    Boolean,
  );
  return `+90 ${parts.join(" ")}`;
}

/** yyyy-aa-gg doğum tarihine göre en az `min` yaşında mı? */
export function isAtLeastAge(birthISO: string, min = 18, now = new Date()) {
  const b = new Date(`${birthISO}T00:00:00`);
  if (Number.isNaN(b.getTime())) return false;
  const limit = new Date(now.getFullYear() - min, now.getMonth(), now.getDate());
  return b <= limit;
}

export const ALLOWED_UPLOAD_TYPES = ["image/jpeg", "image/png", "application/pdf"];
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Dosya geçerliyse null, değilse Türkçe hata mesajı döndürür. */
export function validateUpload(file: { type: string; size: number }) {
  if (!ALLOWED_UPLOAD_TYPES.includes(file.type)) return "Yalnızca JPG, PNG veya PDF yükleyebilirsin.";
  if (file.size > MAX_UPLOAD_BYTES) return "Dosya boyutu en fazla 5 MB olabilir.";
  return null;
}
