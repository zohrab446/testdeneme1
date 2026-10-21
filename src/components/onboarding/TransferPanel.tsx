import { Briefcase, Download, FileSignature, FolderOpen, Info, Landmark, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { StatusBadge } from "@/components/common";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getSgkExport } from "@/services";
import { transferStatusMeta } from "@/lib/onboarding";
import type { DataTransferItem } from "@/types";

const icons = { sgk: Landmark, bordro: Briefcase, ozluk: FolderOpen, sozlesme: FileSignature };

function download(content: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function toCsv(obj: Record<string, string>) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return "\uFEFF" + Object.keys(obj).map(esc).join(";") + "\n" + Object.values(obj).map(esc).join(";");
}

export function TransferPanel({
  recordId,
  slug,
  items,
}: {
  recordId: string;
  slug: string;
  items: DataTransferItem[];
}) {
  const [busy, setBusy] = useState(false);

  const exportAs = async (fmt: "json" | "excel") => {
    setBusy(true);
    try {
      const data = await getSgkExport(recordId);
      if (fmt === "json") {
        download(JSON.stringify(data, null, 2), `sgk-ise-giris-${slug}.json`, "application/json");
      } else {
        download(toCsv(data), `sgk-ise-giris-${slug}.csv`, "text/csv;charset=utf-8");
      }
      toast.success("Dosya indirildi");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 shadow-card md:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-semibold">Veri Aktarım Durumu</h2>
          <p className="text-sm text-muted-foreground">Onaylanan bilgiler ilgili süreçlere hazırlanıyor.</p>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" disabled={busy}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              SGK formu için veriyi indir
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => void exportAs("excel")}>Excel (.csv)</DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void exportAs("json")}>JSON</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="mb-4 flex gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
        <p>Resmî SGK bildirimi e-SGK üzerinden yapılır; bu adım veriyi hazırlar.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {items.map((it) => {
          const Icon = icons[it.id];
          const meta = transferStatusMeta[it.status];
          return (
            <div key={it.id} className="flex gap-3 rounded-lg border p-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-sm font-medium">{it.title}</span>
                  <StatusBadge tone={meta.tone}>{meta.label}</StatusBadge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{it.description}</p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
