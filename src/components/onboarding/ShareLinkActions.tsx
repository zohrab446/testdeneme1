import { Copy, Mail, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { INVITE_VALID_DAYS, welcomePath } from "@/lib/onboarding";
import { formatDate } from "@/lib/format";

export function buildInviteUrl(token: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  return `${origin}${welcomePath(token)}`;
}

export function copyInviteLink(token: string) {
  void navigator.clipboard.writeText(buildInviteUrl(token)).then(
    () => toast.success("Link kopyalandı"),
    () => toast.error("Link kopyalanamadı"),
  );
}

export function ShareLinkActions({
  token,
  name,
  email,
  expiresAt,
}: {
  token: string;
  name: string;
  email: string;
  expiresAt: string;
}) {
  const url = buildInviteUrl(token);
  const message = `Merhaba ${name}, aramıza hoş geldin! İşe başlangıç bilgilerini doldurmak için: ${url}`;
  const mailto = `mailto:${email}?subject=${encodeURIComponent("İşe başlangıç formun")}&body=${encodeURIComponent(message)}`;
  const wa = `https://wa.me/?text=${encodeURIComponent(message)}`;

  return (
    <div className="space-y-4">
      <div className="break-all rounded-lg border bg-muted/50 p-3 font-mono text-xs">{url}</div>
      <div className="grid gap-2">
        <Button onClick={() => copyInviteLink(token)}>
          <Copy className="h-4 w-4" /> Linki kopyala
        </Button>
        <Button variant="outline" asChild>
          <a href={mailto}>
            <Mail className="h-4 w-4" /> E-posta ile gönder
          </a>
        </Button>
        <Button variant="outline" asChild>
          <a href={wa} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="h-4 w-4" /> WhatsApp ile paylaş
          </a>
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Bu link {INVITE_VALID_DAYS} gün geçerlidir ({formatDate(expiresAt)} tarihine kadar).
      </p>
    </div>
  );
}
