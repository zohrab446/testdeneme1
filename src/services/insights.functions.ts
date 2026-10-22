/**
 * raw_items üzerinden toplulaştırılmış içgörüler (gerçek backend modu).
 * Gizlilik: 5 kişiden küçük gruplar SUNUCUDA bastırılır; ham satırları
 * ve yazar hash'leri istemciye asla gönderilmez. Metinler zaten
 * yazılırken maskelenmiştir (pii.ts).
 */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { resolveCompany } from "@/server/integrations/core";

export interface InsightReview {
  id: string;
  source: string;
  text: string;
  createdAt: string;
  sentiment: "pozitif" | "notr" | "negatif" | null;
  topics: string[];
}

export interface InsightWeek {
  weekStart: string;
  pozitif: number;
  notr: number;
  negatif: number;
  total: number;
}

export interface InsightDepartment {
  departmentId: string;
  respondents: number;
  score: number; // 0-100
  suppressed: boolean;
}

export interface CompanyInsights {
  reviews: InsightReview[];
  weekly: InsightWeek[];
  departments: InsightDepartment[];
  totals: { pozitif: number; notr: number; negatif: number; total: number };
}

const MIN_GROUP = 5;

function weekStartOf(iso: string): string {
  const d = new Date(iso);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - d.getUTCDay() + 1); // Pazartesi
  return d.toISOString();
}

export const getCompanyInsights = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<CompanyInsights> => {
    const { supabase, userId } = context;
    const ctx = await resolveCompany(supabase, userId);
    const { data: rows } = await supabase
      .from("raw_items")
      .select("id, source, text, created_at, sentiment, topics, department_id, author_hash")
      .eq("company_id", ctx.companyId)
      .order("created_at", { ascending: false })
      .limit(1000);

    const items = rows ?? [];
    const totals = { pozitif: 0, notr: 0, negatif: 0, total: items.length };
    const weekMap = new Map<string, InsightWeek>();
    // Departman bazında yazar sayısı ve skor (sunucuda hesaplanır)
    const deptAuthors = new Map<string, Set<string>>();
    const deptScores = new Map<string, number[]>();

    for (const item of items) {
      if (item.sentiment === "pozitif" || item.sentiment === "notr" || item.sentiment === "negatif") totals[item.sentiment]++;
      const week = weekStartOf(item.created_at);
      const entry = weekMap.get(week) ?? { weekStart: week, pozitif: 0, notr: 0, negatif: 0, total: 0 };
      entry.total++;
      if (item.sentiment === "pozitif" || item.sentiment === "notr" || item.sentiment === "negatif") entry[item.sentiment]++;
      weekMap.set(week, entry);

      if (item.department_id) {
        const authors = deptAuthors.get(item.department_id) ?? new Set<string>();
        if (item.author_hash) authors.add(item.author_hash);
        deptAuthors.set(item.department_id, authors);
        const scores = deptScores.get(item.department_id) ?? [];
        scores.push(item.sentiment === "pozitif" ? 100 : item.sentiment === "negatif" ? 0 : 50);
        deptScores.set(item.department_id, scores);
      }
    }

    const departments: InsightDepartment[] = [...deptAuthors.entries()].map(([departmentId, authors]) => {
      const respondents = authors.size;
      const scores = deptScores.get(departmentId) ?? [];
      const score = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      // Gizlilik eşiği: 5'ten küçük gruplar bastırılır
      return { departmentId, respondents, score, suppressed: respondents < MIN_GROUP };
    });

    return {
      reviews: items.map((item) => ({
        id: item.id,
        source: item.source,
        text: item.text,
        createdAt: item.created_at,
        sentiment: item.sentiment as InsightReview["sentiment"],
        topics: item.topics ?? [],
      })),
      weekly: [...weekMap.values()].sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
      departments,
      totals,
    };
  });
