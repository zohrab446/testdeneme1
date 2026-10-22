/** CSV içe aktarım: sütun eşlemesi, boyut ve satır sınırları, hatalı satır raporu. */

export const CSV_MAX_BYTES = 2 * 1024 * 1024; // 2 MB
export const CSV_MAX_ROWS = 5000;

export interface CsvMapping {
  text: string;
  date?: string;
  author?: string | undefined;
  rating?: string;
}

export interface CsvRow {
  externalId: string;
  text: string;
  createdAt: string;
  author?: string | undefined;
}

export interface CsvImportResult {
  rows: CsvRow[];
  errors: { line: number; reason: string }[];
}

/** Basit CSV ayrıştırıcı: tırnaklı alanları ve satır sonlarını destekler. */
export function parseCsv(content: string, mapping: CsvMapping): CsvImportResult {
  if (new TextEncoder().encode(content).length > CSV_MAX_BYTES) {
    throw new Error("CSV_TOO_LARGE");
  }
  const lines = splitCsvLines(content);
  if (lines.length < 2) throw new Error("CSV_INVALID");
  const header = parseCsvLine(lines[0]!).map((h) => h.trim().toLocaleLowerCase("tr-TR"));
  const idx = (name: string) => header.indexOf(name.trim().toLocaleLowerCase("tr-TR"));
  const textIdx = idx(mapping.text);
  if (textIdx < 0) throw new Error("CSV_INVALID");
  const dateIdx = mapping.date ? idx(mapping.date) : -1;
  const authorIdx = mapping.author ? idx(mapping.author) : -1;

  const rows: CsvRow[] = [];
  const errors: { line: number; reason: string }[] = [];
  const dataLines = lines.slice(1);
  if (dataLines.length > CSV_MAX_ROWS) throw new Error("CSV_TOO_MANY_ROWS");

  dataLines.forEach((line, i) => {
    const lineNo = i + 2;
    if (!line.trim()) return;
    const cells = parseCsvLine(line);
    const text = (cells[textIdx] ?? "").trim();
    if (!text) {
      errors.push({ line: lineNo, reason: "Metin sütunu boş" });
      return;
    }
    let createdAt = new Date().toISOString();
    if (dateIdx >= 0) {
      const raw = (cells[dateIdx] ?? "").trim();
      const parsed = raw ? new Date(raw) : null;
      if (!parsed || Number.isNaN(parsed.getTime())) {
        errors.push({ line: lineNo, reason: `Tarih okunamadı: "${raw}"` });
        return;
      }
      createdAt = parsed.toISOString();
    }
    rows.push({
      externalId: `csv-${lineNo}-${text.length}`,
      text,
      createdAt,
      author: authorIdx >= 0 ? (cells[authorIdx] ?? "").trim() || undefined : undefined,
    });
  });
  return { rows, errors };
}

function splitCsvLines(content: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of content) {
    if (ch === '"') inQuotes = !inQuotes;
    if ((ch === "\n" || ch === "\r") && !inQuotes) {
      if (current) lines.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  if (current) lines.push(current);
  return lines;
}

function parseCsvLine(line: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === "," || ch === ";") {
      cells.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  cells.push(current);
  return cells;
}
