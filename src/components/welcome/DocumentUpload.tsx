import { useId, useRef, useState } from "react";
import { FileText, Loader2, Lock, Trash2, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/lib/format";
import { validateUpload } from "@/lib/validators";
import { uploadDocument } from "@/services";
import type { OnboardingDocument } from "@/types";

export function DocumentUpload({
  slotId,
  label,
  value,
  preview,
  locked,
  flagged,
  error,
  onChange,
}: {
  slotId: string;
  label: string;
  value?: OnboardingDocument | undefined;
  preview?: string | undefined;
  locked?: boolean | undefined;
  flagged?: boolean | undefined;
  error?: string | undefined;
  onChange: (doc: OnboardingDocument | undefined, previewUrl?: string) => void;
}) {
  const inputId = useId();
  const errId = `${inputId}-err`;
  const inputRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const shownError = localError ?? error;

  const handle = async (file: File | undefined) => {
    if (!file) return;
    const err = validateUpload(file);
    if (err) {
      setLocalError(err);
      return;
    }
    setLocalError(null);
    setBusy(true);
    try {
      const doc = await uploadDocument(slotId, file);
      const url = file.type.startsWith("image/") ? URL.createObjectURL(file) : undefined;
      onChange(doc, url);
    } catch {
      setLocalError("Yükleme başarısız oldu, tekrar dene.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={cn("rounded-xl border bg-card p-3", flagged && "border-destructive/50")}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <span id={`${inputId}-label`} className="text-sm font-medium">
          {label}
        </span>
        {flagged && <span className="text-xs font-medium text-destructive">Yeniden yükle</span>}
        {locked && !flagged && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Lock className="h-3 w-3" /> Onaylandı
          </span>
        )}
      </div>

      {value ? (
        <div className="flex items-center gap-3">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
            {preview ? (
              <img src={preview} alt={`${label} önizlemesi`} className="h-full w-full object-cover" />
            ) : (
              <FileText className="h-6 w-6 text-muted-foreground" aria-hidden />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm">{value.name}</div>
            <div className="text-xs text-muted-foreground">{formatNumber(value.sizeKb)} KB</div>
          </div>
          {!locked && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11"
              aria-label={`${label} dosyasını sil`}
              onClick={() => onChange(undefined)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      ) : (
        <label
          htmlFor={inputId}
          onDragOver={(e) => {
            e.preventDefault();
            setDrag(true);
          }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDrag(false);
            void handle(e.dataTransfer.files[0]);
          }}
          className={cn(
            "flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed p-4 text-center text-sm transition-colors focus-within:ring-2 focus-within:ring-ring",
            drag ? "border-primary bg-primary/5" : "border-border hover:bg-accent",
            locked && "pointer-events-none opacity-60",
          )}
        >
          {busy ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden />
          ) : (
            <UploadCloud className="h-6 w-6 text-muted-foreground" aria-hidden />
          )}
          <span className="font-medium">{busy ? "Yükleniyor…" : "Dosya seç veya sürükle"}</span>
          <span className="text-xs text-muted-foreground">JPG, PNG veya PDF · en fazla 5 MB</span>
          <input
            ref={inputRef}
            id={inputId}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            className="sr-only"
            aria-labelledby={`${inputId}-label`}
            aria-invalid={!!shownError}
            aria-describedby={shownError ? errId : undefined}
            disabled={locked || busy}
            onChange={(e) => {
              void handle(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
        </label>
      )}
      {shownError && (
        <p id={errId} role="alert" className="mt-2 text-xs text-destructive">
          {shownError}
        </p>
      )}
    </div>
  );
}
