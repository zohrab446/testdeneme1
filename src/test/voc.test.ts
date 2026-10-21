import { describe, expect, it } from "vitest";
import { maskName, maskPii, matchQuestion } from "@/lib/voc";

describe("müşteri sesi", () => {
  it("telefon numarasını maskeler", () => {
    expect(maskPii("Bana 0532 418 22 91 numarasından dönün.")).not.toContain("418 22");
  });
  it("temsilci adını maskeler", () => {
    expect(maskPii("Temsilci Ayşe Yılmaz ile görüştüm.")).toBe("Temsilci A*** Y. ile görüştüm.");
  });
  it("yazar adını maskeler", () => {
    expect(maskName("Mehmet Kaya")).toBe("M*** K.");
  });
  it("bilinmeyen soruyu eşleştirmez", () => {
    expect(matchQuestion("Hava nasıl?")).toBeNull();
    expect(matchQuestion("Müşteriler en çok hangi özelliğimizden şikayetçi?")).toBe("sikayet");
  });
});
