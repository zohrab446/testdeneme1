import { describe, expect, it } from "vitest";
import { INVITE_VALID_DAYS, inviteExpiry, newEmployeeSchema, welcomePath } from "@/lib/onboarding";

const valid = {
  employeeName: "Zeynep Demir",
  email: "zeynep@ornek.com.tr",
  title: "Temsilci",
  departmentId: "d1",
  startDate: "2026-10-21",
};

describe("Yeni çalışan daveti", () => {
  it("geçmiş başlangıç tarihini reddeder", () => {
    const r = newEmployeeSchema("2026-10-21").safeParse({ ...valid, startDate: "2026-10-20" });
    expect(r.success).toBe(false);
  });
  it("bugünü kabul eder", () => {
    expect(newEmployeeSchema("2026-10-21").safeParse(valid).success).toBe(true);
  });
  it("link /karsilama/{token} biçimindedir", () => {
    expect(welcomePath("abc123")).toBe("/karsilama/abc123");
  });
  it("link 7 gün geçerlidir", () => {
    expect(INVITE_VALID_DAYS).toBe(7);
    const from = new Date("2026-10-21T00:00:00Z");
    expect(inviteExpiry(from)).toBe("2026-10-28T00:00:00.000Z");
  });
});
