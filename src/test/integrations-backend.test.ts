import { describe, expect, it } from "vitest";
import { maskPii } from "@/server/integrations/pii";
import { chunkDateRange } from "@/server/integrations/trendyol";
import { CSV_MAX_ROWS, parseCsv } from "@/server/integrations/csv";
import { integrationErrorMessages, IntegrationError, toTurkishMessage } from "@/server/integrations/errors";

describe("PII maskeleme", () => {
  it("TC kimlik numarasını maskeler", () => {
    expect(maskPii("TC: 12345678901 notu")).toBe("TC: *********** notu");
  });
  it("0 ile başlayan 11 haneli sayıyı TC saymaz", () => {
    expect(maskPii("kod 01234567890")).toBe("kod 01234567890");
  });
  it("telefon numarasını maskeler", () => {
    expect(maskPii("0532 123 45 67 ara")).toBe("05** *** ** ** ara");
    expect(maskPii("+90 532 123 45 67")).toBe("05** *** ** **");
  });
  it("e-posta adresini maskeler", () => {
    expect(maskPii("ornek@sirket.com adresine yaz")).toBe("***@***.*** adresine yaz");
  });
});

describe("Trendyol tarih parçalama", () => {
  const day = 86400000;
  it("90 günü en fazla 14 günlük parçalara böler", () => {
    const from = 0;
    const to = 90 * day;
    const chunks = chunkDateRange(from, to);
    expect(chunks.length).toBe(7);
    for (const c of chunks) expect(c.end - c.start).toBeLessThan(14 * day);
  });
  it("parçalar aralığı kesintisiz kaplar", () => {
    const chunks = chunkDateRange(0, 30 * day);
    for (let i = 1; i < chunks.length; i++) expect(chunks[i]!.start).toBe(chunks[i - 1]!.end + 1);
    expect(chunks[0]!.start).toBe(0);
    expect(chunks.at(-1)!.end).toBe(30 * day);
  });
  it("ters aralıkta boş döner", () => {
    expect(chunkDateRange(10, 5)).toEqual([]);
  });
});

describe("CSV içe aktarım", () => {
  it("sütun eşlemesine göre satırları okur", () => {
    const csv = "yorum,tarih,yazar\nHarika ürün,2026-10-01,Ali\nKargo geç,2026-10-02,Veli";
    const { rows, errors } = parseCsv(csv, { text: "yorum", date: "tarih", author: "yazar" });
    expect(errors).toEqual([]);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.text).toBe("Harika ürün");
    expect(rows[0]!.author).toBe("Ali");
  });
  it("hatalı satırları raporlar ve atlar", () => {
    const csv = "yorum,tarih\n,2026-10-01\nMetin var,bozuk-tarih";
    const { rows, errors } = parseCsv(csv, { text: "yorum", date: "tarih" });
    expect(rows).toHaveLength(0);
    expect(errors).toHaveLength(2);
  });
  it("metin sütunu yoksa CSV_INVALID fırlatır", () => {
    expect(() => parseCsv("a,b\n1,2", { text: "yorum" })).toThrow("CSV_INVALID");
  });
  it("satır sınırını aşınca CSV_TOO_MANY_ROWS fırlatır", () => {
    const csv = "yorum\n" + Array.from({ length: CSV_MAX_ROWS + 1 }, (_, i) => `satır ${i}`).join("\n");
    expect(() => parseCsv(csv, { text: "yorum" })).toThrow("CSV_TOO_MANY_ROWS");
  });
});

describe("Hata kodu eşlemesi", () => {
  it("bilinen kodlar Türkçe mesaja çevrilir", () => {
    expect(new IntegrationError("TRENDYOL_UNAUTHORIZED").message).toBe(integrationErrorMessages.TRENDYOL_UNAUTHORIZED);
    expect(new IntegrationError("SLACK_STATE_MISMATCH").message).toContain("Güvenlik");
  });
  it("bilinmeyen kod genel mesaja düşer", () => {
    expect(new IntegrationError("BILINMEYEN").message).toBe(integrationErrorMessages.UNKNOWN);
  });
  it("toTurkishMessage IntegrationError'ı korur", () => {
    expect(toTurkishMessage(new IntegrationError("CONSENT_REQUIRED"))).toBe(integrationErrorMessages.CONSENT_REQUIRED);
  });
});
