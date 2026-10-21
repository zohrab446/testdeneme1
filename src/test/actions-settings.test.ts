import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { actionCards, appSettings } from "@/mocks/data";
import { getActionCards, updateActionStatus, snoozeAction, markActionDone, saveSettings, deleteDepartment, updateUserRole, inviteUser, normalizeAction, updateDepartment } from "@/services";
import { companySchema } from "@/lib/settings";
const initial = structuredClone(appSettings), cards = structuredClone(actionCards);
beforeEach(() => { Object.assign(appSettings, structuredClone(initial)); actionCards.splice(0, actionCards.length, ...structuredClone(cards)); vi.useFakeTimers(); });
afterEach(() => { vi.useRealTimers(); });
async function finish<T>(promise: Promise<T>) { await vi.runAllTimersAsync(); return promise; }
describe("Aksiyon kuralları", () => {
  it("10 kartın her birinde 3 uygulanabilir adım bulunur", async () => { const rows = await finish(getActionCards()); expect(rows).toHaveLength(10); expect(rows.every(c => c.aksiyonlar.length === 3 && c.bulgu && c.neden && c.nasilUretildi.veriNoktasiSayisi > 0)).toBe(true); });
  it("göreve çevirme Yapılacak olarak kalır", async () => { await finish(updateActionStatus("a1", "Yapılacak")); expect((await finish(getActionCards())).find(c => c.id === "a1")?.durum).toBe("Yapılacak"); });
  it.each([1, 3, 7])("erteleme %i günlük dönüş tarihi oluşturur", async days => { const now = Date.now(); const card = await finish(snoozeAction("a1", days)); expect(card.durum).toBe("Ertelendi"); expect(new Date(card.ertelemeTarihi ?? "").getTime()).toBe(now + days * 86400000); });
  it("Uygulandı aksiyonu tamamlar", async () => { expect((await finish(markActionDone("a2"))).durum).toBe("Tamamlandı"); });
  it("eski dashboard mutasyonları normalize edilir", () => { const card = actionCards[0]; if (!card) throw Error("Kart yok"); expect(normalizeAction({ ...card, status: "devam" }).durum).toBe("DevamEdiyor"); });
});
describe("Ayar korumaları", () => {
  it("vergi no tam 10 hane olmalıdır", () => { expect(companySchema.safeParse({ ...initial.company, vergiNo: "123456789" }).success).toBe(false); expect(companySchema.safeParse({ ...initial.company, vergiNo: "1234567890" }).success).toBe(true); });
  it("anonimlik eşiği 5 altına düşürülemez", async () => { await expect(saveSettings("privacy", { ...initial.privacy, anonymityThreshold: 4 as 5 })).rejects.toThrow(); expect(appSettings.privacy.anonymityThreshold).toBe(5); });
  it("çalışanı olan departman silinemez", async () => { const pending = expect(deleteDepartment("d1")).rejects.toThrow("Çalışanı olan departman silinemez."); await vi.runAllTimersAsync(); await pending; expect(appSettings.departments.some(d => d.id === "d1")).toBe(true); });
  it("çalışan sayısı düşürülerek silme koruması aşılamaz", async () => { const d = initial.departments[0]; if (!d) throw Error("Departman yok"); const pending = expect(updateDepartment(d.id, { ...d, calisanSayisi: 0 })).rejects.toThrow(); await vi.runAllTimersAsync(); await pending; });
  it("boş departman silinebilir", async () => { await finish(deleteDepartment("d6")); expect(appSettings.departments.some(d => d.id === "d6")).toBe(false); });
  it("Sahip kendi rolünü düşüremez", async () => { const pending = expect(updateUserRole("u1", "Salt Okunur")).rejects.toThrow("Sahip rolü kaldırılamaz."); await vi.runAllTimersAsync(); await pending; expect(appSettings.users[0]?.rol).toBe("Sahip"); });
  it("departman yöneticisi daveti departman gerektirir", async () => { await expect(inviteUser("test@ornek.com.tr", "Departman Yöneticisi")).rejects.toThrow(); });
  it("bölüm kaydı dil ve para birimini korur", async () => { const result = await finish(saveSettings("company", { ...initial.company, ad: "Yeni Şirket" })); expect(result.company.ad).toBe("Yeni Şirket"); expect(result.language).toBe("tr"); expect(result.currency).toBe("TRY"); });
});
