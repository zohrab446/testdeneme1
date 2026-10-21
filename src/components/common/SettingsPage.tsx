import { useCallback, useState } from "react";
import { Link, useBlocker } from "@tanstack/react-router";
import { Building2, Users as UsersIcon, Bell, Shield, Lock, Palette, CreditCard, Network, Settings } from "lucide-react";
import { PageScaffold } from "./PageScaffold";
import { ConfirmDialog } from "./index";
import { CompanyForm, NotificationForm, PrivacyForm, AppearanceForm } from "./SettingsForms";
import { Departments, Users } from "./SettingsTables";
import { Security } from "./SettingsSecurity";
import { Plan } from "./SettingsPlan";
import { getSettings } from "@/services";
import { cn } from "@/lib/utils";
import type { AppSettings } from "@/types/settings";
export const settingsTabs = [
  { slug: "sirket-profili", label: "Şirket Profili", icon: Building2, component: CompanyForm },
  { slug: "departmanlar", label: "Departmanlar", icon: Network, component: Departments },
  { slug: "kullanicilar", label: "Kullanıcılar ve Roller", icon: UsersIcon, component: Users },
  { slug: "bildirimler", label: "Bildirimler", icon: Bell, component: NotificationForm },
  { slug: "gizlilik", label: "Gizlilik ve KVKK", icon: Shield, component: PrivacyForm },
  { slug: "guvenlik", label: "Güvenlik", icon: Lock, component: Security },
  { slug: "gorunum", label: "Görünüm", icon: Palette, component: AppearanceForm },
  { slug: "plan", label: "Plan ve Faturalama", icon: CreditCard, component: Plan },
];
export function SettingsPage({ tab = "sirket-profili" }: { tab?: string }) {
  return <PageScaffold title="Ayarlar" description="Şirketinin bilgileri, ekibin ve tercihlerin." icon={Settings} queryKey={["settings"]} queryFn={getSettings} emptyTitle="Şirket ayarları bulunamadı" emptyDescription="Şirket bilgileri oluşturulduğunda ayarlarını buradan yönetebilirsin.">{data => data ? <SettingsContent key={tab} settings={data} tab={tab} /> : null}</PageScaffold>;
}
function SettingsContent({ settings, tab }: { settings: AppSettings; tab: string }) {
  const [dirty, setDirty] = useState(false);
  const onDirty = useCallback((value: boolean) => setDirty(value), []);
  const blocker = useBlocker({ shouldBlockFn: () => dirty, enableBeforeUnload: () => dirty, withResolver: true });
  const active = settingsTabs.find(t => t.slug === tab) ?? settingsTabs[0];
  if (!active) return null;
  const Content = active.component;
  return <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]" data-settings-content>
    <nav aria-label="Ayar bölümleri" className="flex gap-1 overflow-x-auto border-b pb-3 lg:flex-col lg:overflow-visible lg:border-b-0 lg:border-r lg:pr-4">{settingsTabs.map(t => <Link key={t.slug} to="/ayarlar/$sekme" params={{ sekme: t.slug }} className={cn("flex shrink-0 items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium transition-colors hover:bg-accent", active.slug === t.slug ? "bg-primary/10 text-primary" : "text-muted-foreground")}><t.icon className="size-4 shrink-0" />{t.label}</Link>)}</nav>
    <div className="min-w-0"><Content settings={settings} onDirty={onDirty} /></div>
    <ConfirmDialog open={blocker.status === "blocked"} onOpenChange={v => { if (!v && blocker.status === "blocked") blocker.reset(); }} title="Kaydedilmemiş değişiklikler var" description="Devam edersen kaydedilmemiş değişikliklerin kaybolacak." confirmLabel="Kaydetmeden çık" cancelLabel="Düzenlemeye devam et" onConfirm={() => { if (blocker.status === "blocked") { setDirty(false); blocker.proceed(); } }} />
  </div>;
}
