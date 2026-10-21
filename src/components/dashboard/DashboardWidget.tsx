import { Component, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorState } from "@/components/common";
import { Skeleton } from "@/components/ui/skeleton";
import { getDashboardWidget } from "@/services/dashboard";
import type { DashboardPeriod, DashboardWidgets } from "@/types";

class WidgetBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    return this.state.failed ? <ErrorState message="Bu bölüm görüntülenemedi." onRetry={() => this.setState({ failed: false })} /> : this.props.children;
  }
}

export function DashboardWidget<K extends keyof DashboardWidgets>({ id, period, demo, title, action, children }: {
  id: K; period: DashboardPeriod; demo: boolean; title?: string; action?: ReactNode;
  children: (data: DashboardWidgets[K]) => ReactNode;
}) {
  const query = useQuery({ queryKey: id === "onboarding" ? ["onboarding", "dashboard", period, demo] : ["dashboard-widget", id, period, demo], queryFn: () => getDashboardWidget(id, period, demo), retry: false });
  const empty = query.data == null || (Array.isArray(query.data) && query.data.length === 0);
  return <section aria-label={title ?? "Dashboard özeti"} className="min-w-0" data-widget={id}>
    {title && <div className="mb-4 flex flex-wrap items-center justify-between gap-2"><h2 className="text-base font-semibold">{title}</h2>{action}</div>}
    <WidgetBoundary key={`${period}-${demo}`}>
      {query.isPending ? <div className="min-h-40 space-y-4" aria-label="Yükleniyor"><Skeleton className="h-6 w-2/5" /><Skeleton className="h-16 w-full" /><Skeleton className="h-5 w-3/4" /></div>
        : query.isError ? <ErrorState message={query.error.message} onRetry={() => void query.refetch()} />
          : empty ? <div className="flex min-h-40 items-center justify-center border-y border-dashed py-8 text-sm text-muted-foreground">Henüz veri yok</div>
            : query.data ? children(query.data) : null}
    </WidgetBoundary>
  </section>;
}