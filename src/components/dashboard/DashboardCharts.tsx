import { Link } from "@tanstack/react-router";
import { LockKeyhole } from "lucide-react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { DashboardWidgets } from "@/types";

export function DepartmentComparison({ rows }: { rows: DashboardWidgets["departments"] }) {
  const visible = rows.filter((d) => !d.suppressed);
  const lowest = [...visible].sort((a, b) => a.score - b.score)[0]?.id;
  return <div className="space-y-5">{rows.map((d) => d.suppressed ? <div key={d.id} className="flex flex-wrap items-center gap-2 rounded-md bg-muted/60 p-3 text-xs text-muted-foreground"><LockKeyhole className="size-3.5" /><span className="font-medium">{d.name}</span><span>Gizlilik nedeniyle gösterilmiyor (en az 5 kişi gerekir)</span></div>
    : <Link key={d.id} to="/calisan-nabzi" className="block space-y-2"><div className="flex justify-between gap-2 text-sm"><span className={cn(d.id === lowest && "font-medium text-destructive")}>{d.name}{d.id === lowest && <span className="ml-2 text-xs">En riskli</span>}</span><span className="tabular-nums">{formatNumber(d.score)}<span className="text-muted-foreground"> / 100</span></span></div><svg role="img" aria-label={`${d.name} mutluluk skoru ${d.score}`} className="h-2 w-full overflow-hidden rounded-sm" viewBox="0 0 100 2" preserveAspectRatio="none"><rect width="100" height="2" className="fill-muted" /><rect width={d.score} height="2" className={d.id === lowest ? "fill-destructive" : "fill-primary"} /></svg></Link>)}</div>;
}

export function EmployeeCustomerTrend({ rows }: { rows: DashboardWidgets["trend"] }) {
  return <div><div className="mb-4 flex gap-5 text-xs text-muted-foreground"><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" />Çalışan</span><span className="flex items-center gap-2"><span className="size-2 rounded-full bg-highlight" />Müşteri</span><span className="ml-auto">12 hafta</span></div>
    <div className="h-64 w-full" role="img" aria-label="12 haftalık çalışan ve müşteri memnuniyeti grafiği"><ResponsiveContainer width="100%" height="100%"><LineChart data={rows} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}><CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="date" tickFormatter={(date: string) => formatDate(date).slice(0, 5)} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={28} /><YAxis domain={[0, 100]} tick={{ fill: "var(--muted-foreground)", fontSize: 11 }} axisLine={false} tickLine={false} /><Tooltip labelFormatter={(date) => formatDate(String(date))} contentStyle={{ background: "var(--popover)", borderColor: "var(--border)", color: "var(--popover-foreground)", borderRadius: 6 }} formatter={(value: number, name: string) => [`${formatNumber(value)} / 100`, name]} /><Line name="Çalışan" dataKey="employee" stroke="var(--primary)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} /><Line name="Müşteri" dataKey="customer" stroke="var(--highlight)" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} isAnimationActive={false} /></LineChart></ResponsiveContainer></div></div>;
}