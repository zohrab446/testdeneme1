import {
  LayoutDashboard,
  HeartPulse,
  MessageSquareQuote,
  Sparkles,
  UserPlus,
  Plug,
  Settings,
} from "lucide-react";

export const navItems = [
  { to: "/", label: "Dashboard", short: "Panel", icon: LayoutDashboard },
  { to: "/calisan-nabzi", label: "Çalışan Nabzı", short: "Nabız", icon: HeartPulse },
  { to: "/musteri-sesi", label: "Müşteri Sesi", short: "Müşteri", icon: MessageSquareQuote },
  { to: "/aksiyonlar", label: "Aksiyon Danışmanı", short: "Aksiyon", icon: Sparkles },
  { to: "/onboarding", label: "Onboarding", short: "Onboard", icon: UserPlus },
  { to: "/entegrasyonlar", label: "Entegrasyonlar", short: "Bağlantı", icon: Plug },
  { to: "/ayarlar", label: "Ayarlar", short: "Ayarlar", icon: Settings },
] as const;

export const PRODUCT_NAME = "[ÜRÜN ADI]";
