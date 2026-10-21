const numberFmt = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const currencyFmt = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** 1250.5 → "1.250,5" */
export const formatNumber = (n: number) => numberFmt.format(n);

/** 1250.5 → "₺1.250,50" */
export const formatCurrency = (n: number) => currencyFmt.format(n);

/** Tarihi gg.aa.yyyy biçiminde döndürür. */
export function formatDate(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}.${mm}.${d.getFullYear()}`;
}

export const formatPercent = (n: number) =>
  new Intl.NumberFormat("tr-TR", { style: "percent", maximumFractionDigits: 1 }).format(n);

/** Hassas değeri maskeler: son 4 karakter görünür. */
export function maskValue(value: string, visible = 4) {
  if (value.length <= visible) return "•".repeat(value.length);
  return "•".repeat(Math.max(4, value.length - visible)) + value.slice(-visible);
}

/** gg.aa.yyyy ss:dd */
export function formatDateTime(input: string | Date) {
  const d = typeof input === "string" ? new Date(input) : input;
  if (Number.isNaN(d.getTime())) return "—";
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)} ${hh}:${mi}`;
}
