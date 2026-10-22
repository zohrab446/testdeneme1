import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, LogIn } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Giriş · [ÜRÜN ADI]" },
      { name: "description", content: "Çalışma alanınıza giriş yapın." },
      { property: "og:title", content: "Giriş · [ÜRÜN ADI]" },
      { property: "og:description", content: "Çalışma alanınıza giriş yapın." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"giris" | "kayit">("giris");
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    setMessage(null);
    try {
      if (mode === "giris") {
        const { error: err } = await supabase.auth.signInWithPassword({ email, password });
        if (err) throw err;
        void navigate({ to: "/entegrasyonlar" });
      } else {
        const { data, error: err } = await supabase.auth.signUp({ email, password });
        if (err) throw err;
        if (data.session) void navigate({ to: "/entegrasyonlar" });
        else setMessage("Onay e-postası gönderildi. E-postanızdaki bağlantıya tıklayın.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "İşlem başarısız oldu.");
    } finally {
      setPending(false);
    }
  };

  const google = async () => {
    setPending(true);
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) setError("Google ile giriş başlatılamadı.");
    setPending(false);
  };

  return (
    <main className="flex min-h-dvh items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-6 shadow-card">
        <div className="space-y-1 text-center">
          <h1 className="text-xl font-semibold">[ÜRÜN ADI]</h1>
          <p className="text-sm text-muted-foreground">{mode === "giris" ? "Çalışma alanınıza giriş yapın" : "Yeni hesap oluşturun"}</p>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2"><Label htmlFor="email">E-posta</Label><Input id="email" type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} /></div>
          <div className="space-y-2"><Label htmlFor="password">Şifre</Label><Input id="password" type="password" autoComplete={mode === "giris" ? "current-password" : "new-password"} required minLength={6} value={password} onChange={e => setPassword(e.target.value)} /></div>
          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
          {message && <p role="status" className="text-sm text-success">{message}</p>}
          <Button className="w-full" disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <LogIn className="size-4" />}{mode === "giris" ? "Giriş yap" : "Hesap oluştur"}</Button>
        </form>
        <Button variant="outline" className="w-full" disabled={pending} onClick={google}>Google ile devam et</Button>
        <button type="button" className="w-full text-center text-sm text-primary underline-offset-4 hover:underline" onClick={() => { setMode(mode === "giris" ? "kayit" : "giris"); setError(null); setMessage(null); }}>
          {mode === "giris" ? "Hesabınız yok mu? Kayıt olun" : "Zaten hesabınız var mı? Giriş yapın"}
        </button>
      </div>
    </main>
  );
}
