import { describe, expect, it } from "vitest";
import {
  isAtLeastAge,
  isValidTCKN,
  isValidTRIban,
  maskTRPhone,
  TR_MOBILE_REGEX,
  validateUpload,
} from "@/lib/validators";

describe("TC Kimlik No", () => {
  it("geçerli numarayı kabul eder", () => expect(isValidTCKN("10000000146")).toBe(true));
  it("ilk hane 0 olamaz", () => expect(isValidTCKN("01234567890")).toBe(false));
  it("11 hane olmalı", () => expect(isValidTCKN("1000000014")).toBe(false));
  it("10. hane hatalıysa reddeder", () => expect(isValidTCKN("10000000156")).toBe(false));
  it("11. hane hatalıysa reddeder", () => expect(isValidTCKN("10000000147")).toBe(false));
});

describe("IBAN", () => {
  it("geçerli TR IBAN'ı kabul eder", () =>
    expect(isValidTRIban("TR33 0006 1005 1978 6457 8413 26")).toBe(true));
  it("mod-97 hatasını yakalar", () => expect(isValidTRIban("TR330006100519786457841327")).toBe(false));
  it("TR ile başlamalı", () => expect(isValidTRIban("DE330006100519786457841326")).toBe(false));
  it("26 karakter olmalı", () => expect(isValidTRIban("TR33000610051978645784132")).toBe(false));
});

describe("Telefon", () => {
  it("+90 5XX XXX XX XX maskesine çevirir", () => {
    expect(maskTRPhone("05321234567")).toBe("+90 532 123 45 67");
    expect(TR_MOBILE_REGEX.test(maskTRPhone("5321234567"))).toBe(true);
  });
});

describe("Yaş", () => {
  const now = new Date(2026, 9, 21);
  it("tam 18 yaşını kabul eder", () => expect(isAtLeastAge("2008-10-21", 18, now)).toBe(true));
  it("18 yaşından küçüğü reddeder", () => expect(isAtLeastAge("2008-10-22", 18, now)).toBe(false));
});

describe("Belge yükleme", () => {
  it("5 MB üstünü reddeder", () =>
    expect(validateUpload({ type: "application/pdf", size: 5 * 1024 * 1024 + 1 })).not.toBeNull());
  it("izinsiz türü reddeder", () => expect(validateUpload({ type: "image/gif", size: 10 })).not.toBeNull());
  it("jpg/png/pdf kabul eder", () => expect(validateUpload({ type: "image/png", size: 10 })).toBeNull());
});
