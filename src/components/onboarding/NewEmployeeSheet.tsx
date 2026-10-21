import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { createEmployeeInvite, getDepartments } from "@/services";
import { newEmployeeSchema, todayISO } from "@/lib/onboarding";
import type { OnboardingInvite } from "@/types";
import { ShareLinkActions } from "./ShareLinkActions";

type Values = z.infer<ReturnType<typeof newEmployeeSchema>>;

function FieldError({ msg }: { msg?: string | undefined }) {
  return msg ? <p className="text-xs text-destructive">{msg}</p> : null;
}

export function NewEmployeeSheet() {
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<OnboardingInvite | null>(null);
  const qc = useQueryClient();
  const depts = useQuery({ queryKey: ["departments"], queryFn: getDepartments });
  const today = todayISO();

  const form = useForm<Values>({
    resolver: zodResolver(newEmployeeSchema(today)),
    defaultValues: { employeeName: "", email: "", title: "", departmentId: "", startDate: "" },
  });
  const { errors } = form.formState;

  const m = useMutation({
    mutationFn: createEmployeeInvite,
    onSuccess: (inv) => {
      setCreated(inv);
      void qc.invalidateQueries({ queryKey: ["onboarding"] });
    },
    onError: (e) => toast.error(e.message),
  });

  const onOpenChange = (o: boolean) => {
    setOpen(o);
    if (!o) {
      setCreated(null);
      form.reset();
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger asChild>
        <Button>
          <UserPlus className="h-4 w-4" /> Yeni çalışan ekle
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
        {created ? (
          <>
            <SheetHeader>
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <SheetTitle>Davet hazır</SheetTitle>
              <SheetDescription>
                {created.employeeName} için kişiye özel karşılama linki oluşturuldu.
              </SheetDescription>
            </SheetHeader>
            <div className="mt-6 px-4">
              <ShareLinkActions
                token={created.token}
                name={created.employeeName}
                email={created.email}
                expiresAt={created.expiresAt}
              />
              <Button variant="ghost" className="mt-4 w-full" onClick={() => onOpenChange(false)}>
                Kapat
              </Button>
            </div>
          </>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle>Yeni çalışan ekle</SheetTitle>
              <SheetDescription>
                Bilgileri girin; çalışana kendi formunu dolduracağı bir link gönderelim.
              </SheetDescription>
            </SheetHeader>
            <form
              onSubmit={form.handleSubmit((v) => m.mutate(v))}
              className="mt-6 space-y-4 px-4 pb-6"
              noValidate
            >
              <div className="space-y-1.5">
                <Label htmlFor="employeeName">Ad soyad</Label>
                <Input id="employeeName" autoComplete="off" {...form.register("employeeName")} />
                <FieldError msg={errors.employeeName?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">E-posta</Label>
                <Input id="email" type="email" {...form.register("email")} />
                <FieldError msg={errors.email?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="title">Pozisyon</Label>
                <Input id="title" {...form.register("title")} />
                <FieldError msg={errors.title?.message} />
              </div>
              <div className="space-y-1.5">
                <Label>Departman</Label>
                <Controller
                  control={form.control}
                  name="departmentId"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder={depts.isPending ? "Yükleniyor…" : "Seçin"} />
                      </SelectTrigger>
                      <SelectContent>
                        {depts.data?.map((d) => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError msg={errors.departmentId?.message} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="startDate">Başlangıç tarihi</Label>
                <Input id="startDate" type="date" min={today} {...form.register("startDate")} />
                <FieldError msg={errors.startDate?.message} />
              </div>
              <Button type="submit" className="w-full" disabled={m.isPending}>
                {m.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Davet linki oluştur
              </Button>
            </form>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
