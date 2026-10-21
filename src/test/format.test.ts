import { describe, expect, it } from "vitest";
import { formatCurrency, formatDate, formatNumber, maskValue } from "@/lib/format";

describe("Türkçe biçimlendirme", () => {
  it("sayıları 1.250,5 biçiminde yazar", () => {
    expect(formatNumber(1250.5)).toBe("1.250,5");
  });
  it("parayı ₺ ve iki ondalıkla yazar", () => {
    expect(formatCurrency(1250.5)).toContain("1.250,50");
    expect(formatCurrency(1250.5)).toContain("₺");
  });
  it("tarihi gg.aa.yyyy yazar", () => {
    expect(formatDate(new Date(2026, 2, 5))).toBe("05.03.2026");
  });
  it("hassas alanı son 4 hane hariç maskeler", () => {
    expect(maskValue("12345678901")).toBe("•••••••8901");
  });
});
