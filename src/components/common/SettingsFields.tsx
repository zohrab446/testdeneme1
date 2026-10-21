import type { ReactNode } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Save } from "lucide-react";
export function Field({ label, error, children, id }: { label: string; error?: string | undefined; children: ReactNode; id: string }) { return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}{error && <p role="alert" className="text-xs text-destructive">{error}</p>}</div>; }
export function Choice({ id, value, options, onChange, disabled }: { id: string; value: string; options: (string | { value: string; label: string })[]; onChange: (v: string) => void; disabled?: boolean }) { return <Select value={value} onValueChange={onChange} disabled={disabled}><SelectTrigger id={id}><SelectValue /></SelectTrigger><SelectContent>{options.map(o => { const value = typeof o === "string" ? o : o.value; return <SelectItem key={value} value={value}>{typeof o === "string" ? o : o.label}</SelectItem>; })}</SelectContent></Select>; }
export function ToggleRow({ label, value, onChange, id }: { label: string; value: boolean; onChange: (v: boolean) => void; id: string }) { return <div className="flex items-center justify-between gap-4 border-b py-3"><Label htmlFor={id}>{label}</Label><Switch id={id} checked={value} onCheckedChange={onChange} /></div>; }
export function SaveButton({ pending, disabled }: { pending: boolean; disabled?: boolean }) { return <div className="flex justify-end border-t pt-4"><Button type="submit" disabled={pending || disabled}><Save className="size-4" />{pending ? "Kaydediliyor…" : "Kaydet"}</Button></div>; }
