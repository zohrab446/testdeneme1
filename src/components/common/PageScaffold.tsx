import { useQuery } from "@tanstack/react-query";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { EmptyState, ErrorState, PageHeader, SkeletonCard } from "./index";

function isEmpty(d: unknown) {
  return d == null || (Array.isArray(d) && d.length === 0);
}

/**
 * Her sayfanın üç durumunu (yükleniyor / boş / hata) tek yerde yönetir.
 * İçerik henüz yapılmadığı için başarılı durumda da EmptyState gösterilir;
 * sayfa içeriği eklenince `children` ile render edilecek.
 */
export function PageScaffold<T>({
  title,
  description,
  icon,
  queryKey,
  queryFn,
  emptyTitle = "Henüz veri yok",
  emptyDescription = "Bu modül yakında burada olacak.",
  children,
}: {
  title: string;
  description?: string;
  icon?: LucideIcon;
  queryKey: unknown[];
  queryFn: () => Promise<T>;
  emptyTitle?: string;
  emptyDescription?: string;
  children?: (data: T) => ReactNode;
}) {
  const q = useQuery({ queryKey, queryFn, retry: false });

  let body: ReactNode;
  if (q.isPending) {
    body = (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    );
  } else if (q.isError) {
    body = <ErrorState message={q.error.message} onRetry={() => q.refetch()} />;
  } else if (isEmpty(q.data) || !children) {
    body = <EmptyState icon={icon} title={emptyTitle} description={emptyDescription} />;
  } else {
    body = children(q.data as T);
  }

  return (
    <div>
      <PageHeader title={title} description={description} />
      {body}
    </div>
  );
}
