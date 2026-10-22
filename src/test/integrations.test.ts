import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { integrationCatalog } from "@/mocks/integrations";
import { disconnectIntegration, requestIntegrationNotification, saveIntegrationSettings, testIntegrationConnection } from "@/services/integrations";

const initial = structuredClone(integrationCatalog);
describe("Entegrasyon kuralları", () => {
  beforeEach(() => {
    integrationCatalog.splice(0, integrationCatalog.length, ...structuredClone(initial));
    vi.useFakeTimers();
    vi.spyOn(Math, "random").mockReturnValue(0.9);
    window.history.replaceState({}, "", "/entegrasyonlar");
  });
  afterEach(() => { vi.useRealTimers(); vi.restoreAllMocks(); });
  async function run<T>(promise: Promise<T>) { const result = promise; await vi.runAllTimersAsync(); return result; }
  it("KVKK onayı olmadan bağlanmaz", async () => {
    await expect(testIntegrationConnection("google", false, [])).rejects.toThrow("KVKK");
    expect(integrationCatalog.find(s => s.id === "google")?.status).toBe("bagli_degil");
  });
  it("Slack için en az bir kanal gerekir", async () => {
    await expect(testIntegrationConnection("slack", true, [])).rejects.toThrow("En az bir kanal");
  });
  it("özel mesaj ve bilinmeyen kanal taranamaz", async () => {
    await expect(testIntegrationConnection("teams", true, ["dm"])).rejects.toThrow("izin verilen");
  });
  it("yalnızca seçilen kanalları kaydeder", async () => {
    const source = await run(testIntegrationConnection("teams", true, ["operasyon"]));
    expect(source.selectedChannels).toEqual(["operasyon"]);
    expect(source.status).toBe("bagli");
  });
  it("rastgele başarısız test yeniden denenebilir", async () => {
    vi.mocked(Math.random).mockReturnValue(0.1);
    const failed = expect(testIntegrationConnection("google", true, [])).rejects.toThrow("zaman aşımı");
    await vi.runAllTimersAsync(); await failed;
    expect(integrationCatalog.find(s => s.id === "google")?.status).toBe("hata");
    vi.mocked(Math.random).mockReturnValue(0.9);
    expect((await run(testIntegrationConnection("google", true, []))).status).toBe("bagli");
  });
  it("yönetimde senkron sıklığını ve kanalları kaydeder", async () => {
    const source = (await run(saveIntegrationSettings("slack", "haftalik", ["satis"])))!;
    expect(source.frequency).toBe("haftalik"); expect(source.selectedChannels).toEqual(["satis"]);
  });
  it("yalnızca son 10 senkron kaydını tutar", async () => {
    const source = (await run(testIntegrationConnection("slack", true, ["genel"])))!;
    expect(source.logs).toHaveLength(10); expect(source.logs[0]?.success).toBe(true);
  });
  it("bağlantı kesilince açıklanan süreye silinme tarihi koyar", async () => {
    vi.setSystemTime(new Date("2026-10-21T10:00:00Z"));
    const source = (await run(disconnectIntegration("slack")))!;
    expect(source.status).toBe("bagli_degil"); expect(source.consent).toBe(false);
    expect(source.selectedChannels).toEqual([]);
    expect(new Date(source.deleteAt ?? "").getTime() - Date.now()).toBe(source.deletionDays * 86400000);
  });
  it("Yakında kaynak bağlanamaz", async () => {
    await expect(testIntegrationConnection("appstore", true, [])).rejects.toThrow("henüz");
  });
  it("haberdar et geçerli e-posta kaydeder", async () => {
    await expect(requestIntegrationNotification("appstore", "hatalı")).rejects.toThrow("e-posta");
    expect((await run(requestIntegrationNotification("appstore", "ornek@example.com"))).notificationEmail).toBe("ornek@example.com");
  });
});