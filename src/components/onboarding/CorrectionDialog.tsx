import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { correctionSchema } from "@/lib/onboarding";

type Values = z.infer<typeof correctionSchema>;

export function CorrectionDialog({
  open,
  onOpenChange,
  sections,
  documents,
  pending,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sections: string[];
  documents: string[];
  pending: boolean;
  onSubmit: (v: Values) => void;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(correctionSchema),
    defaultValues: { targets: [], note: "" },
  });
  const { errors } = form.formState;

  const group = (title: string, items: string[]) =>
    items.length > 0 && (
      <div className="space-y-2">
        <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</div>
        <Controller
          control={form.control}
          name="targets"
          render={({ field }) => (
            <div className="grid gap-2 sm:grid-cols-2">
              {items.map((it) => (
                <label key={it} className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-sm hover:bg-accent">
                  <Checkbox
                    checked={field.value.includes(it)}
                    onCheckedChange={(c) =>
                      field.onChange(c ? [...field.value, it] : field.value.filter((x) => x !== it))
                    }
                  />
                  {it}
                </label>
              ))}
            </div>
          )}
        />
      </div>
    );

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o);
        if (!o) form.reset();
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Düzeltme iste</DialogTitle>
          <DialogDescription>
            Çalışanın düzeltmesi gereken bölümleri ve belgeleri seçin, kısa bir not ekleyin.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {group("Bölümler", sections)}
          {group("Belgeler", documents)}
          {errors.targets && <p className="text-xs text-destructive">{errors.targets.message}</p>}
          <div className="space-y-1.5">
            <Label htmlFor="note">Not</Label>
            <Textarea
              id="note"
              rows={3}
              placeholder="Örn. IBAN numarası hatalı görünüyor, kontrol eder misiniz?"
              {...form.register("note")}
            />
            {errors.note && <p className="text-xs text-destructive">{errors.note.message}</p>}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Düzeltme iste
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
