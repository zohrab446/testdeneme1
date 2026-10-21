import { describe, expect, it } from "vitest";
import { applyPrivacy, MIN_GROUP_SIZE } from "@/lib/pulse";
import type { RawDepartmentPulse } from "@/types";

const raw = (respondents: number): RawDepartmentPulse => ({
  departmentId: "d", respondents,
  topics: { mesai: 50, yonetici: 50, maas: 50, belirsizlik: 50, denge: 50 },
  trend: [50], risk: "orta", riskReasons: ["x"], themes: ["t"], quotes: ["q"],
});

describe("Gizlilik eşiği", () => {
  it("eşik 5 kişidir", () => expect(MIN_GROUP_SIZE).toBe(5));
  it("4 kişilik grubun verisini gizler", () => {
    const r = applyPrivacy(raw(4), "Hukuk");
    expect(r.suppressed).toBe(true);
    expect("topics" in r).toBe(false);
    expect("quotes" in r).toBe(false);
  });
  it("5 kişilik grubu gösterir", () => expect(applyPrivacy(raw(5), "Satış").suppressed).toBe(false));
});
