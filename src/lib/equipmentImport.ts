/**
 * Excel бүртгэлийг хөтөч дотор задлан Supabase руу оруулна.
 * Файл серверт хадгалагдахгүй; зөвхөн задалсан мөрүүд RLS-ээр
 * хамгаалагдсан хүснэгтэд бичигдэнэ (admin эрх шаардлагатай).
 */
import { getSupabase } from "./supabase";
import { MANUAL_FIELDS, type BudgetItem, type EquipmentItem, type ManualField } from "./equipment";
import { defaultPortFor } from "../data/customsOffices";

type Row = unknown[];

const OFFICE_KEYS: [string, string][] = [
  ["БИЧИГТ", "БИГГ"], ["БУРГАСТАЙ", "ГАГХ"], ["ГОВЬ-АЛТАЙ", "ГАГХ"], ["СЭЛЭНГЭ", "СЭГГ"], ["УВС", "УВГГ"],
  ["ХАНГИ", "ХАГГ"], ["ШИВЭЭХҮРЭН", "ШХГГ"], ["БАЯН-ӨЛГИЙ", "БӨГГ"], ["ГАШУУН", "ГСГГ"], ["ЗАМЫН-ҮҮД", "ЗҮГГ"],
  ["ЧИНГИС", "ЧХОУНБГГ"], ["УЛААНБААТАР ХОТ", "УБГГ"], ["УЛААБААТАР ХОТ", "УБГГ"], ["САЙНШАНД", "СШГГ"], ["ДОРНОД", "ДОГГ"],
  ["ДАРХАН", "ДАГГ"], ["ШУУДАН", "УХШИГГ"], ["ХАНХ", "ХАГХ"], ["ХӨВСГӨЛ", "ХАГХ"], ["АРЦСУУРЬ", "ЗАГХ"], ["ЗАВХАН", "ЗАГХ"],
  ["ОРХОН", "ОГГ"], ["БУЛГАН", "ХОГГ"], ["ХОВД", "ХОГГ"], ["МӨРӨН", "ХАГХ"], ["ЦАГААНДЭЛ", "ӨГГ"], ["ӨМНӨГОВЬ", "ӨГГ"],
  ["ЕРӨНХИЙ ГАЗАР", "ГЕГ"],
];
export const officeCodeFromText = (s: string | null | undefined) => {
  if (!s) return null;
  const u = s.toUpperCase();
  return OFFICE_KEYS.find(([k]) => u.includes(k))?.[1] ?? null;
};

const str = (v: unknown) => {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s && s !== "-" && s !== "—" ? s : null;
};
const num = (v: unknown) => {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const n = Number(String(v).replace(/[,\s₮]/g, ""));
  return Number.isFinite(n) ? n : null;
};
const date = (v: unknown) => {
  if (v instanceof Date && !isNaN(+v)) {
    // Excel-ийн огноо секундийн бутархайтай ирдэг тул хамгийн ойр өдөр рүү дугуйлна
    const d = new Date(v.getTime() - v.getTimezoneOffset() * 60000 + 12 * 3600 * 1000);
    return d.toISOString().slice(0, 10);
  }
  if (typeof v === "string") {
    const m = v.match(/(\d{4})\D+(\d{1,2})\D+(\d{1,2})/);
    if (m && +m[2] >= 1 && +m[2] <= 12 && +m[3] >= 1 && +m[3] <= 31) return `${m[1]}-${m[2].padStart(2, "0")}-${m[3].padStart(2, "0")}`;
    const y = v.match(/^\s*(\d{4})\s*$/);
    if (y) return `${y[1]}-01-01`;
  }
  if (typeof v === "number" && v > 1990 && v < 2100) return `${Math.floor(v)}-01-01`;
  return null;
};

async function readSheets(file: File) {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(await file.arrayBuffer(), { cellDates: true });
  return { XLSX, wb };
}

export type NewItem = Omit<EquipmentItem, "id" | "port_id" | ManualField> & { source_row: number };
export type NewBudget = Omit<BudgetItem, "id" | "port_id"> & { source_row: number };

export interface ParseReport<T> {
  rows: T[];
  checks: { office: string; sheetQty: number | null; qty: number; sheetFaulty: number | null; faulty: number }[];
  warnings: string[];
}

/** «Тоног төхөөрөмж судалгаа» файлын «Санхүүгийн бүртгэл» хуудсыг задална. */
export async function parseInventory(file: File): Promise<ParseReport<NewItem>> {
  const { XLSX, wb } = await readSheets(file);
  const ws = wb.Sheets["Санхүүгийн бүртгэл"] ?? wb.Sheets[wb.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json<Row>(ws, { header: 1, defval: null, raw: true });
  const rows: NewItem[] = [];
  const warnings: string[] = [];
  const totals = new Map<string, { q: number | null; f: number | null }>();
  let office: string | null = null;
  let category: string | null = null;
  let group: string | null = null;

  data.forEach((r, idx) => {
    const line = idx + 1;
    if (line < 6 || !r) return;
    const a = r[0];
    let b = r[1];
    const restEmpty = r.slice(1).every((c) => c === null || c === "");
    if (typeof a === "string" && restEmpty) {
      const s = a.trim();
      if (s.startsWith("◆")) {
        category = s.replace(/^◆\s*/, "").trim();
        group = null;
        return;
      }
      if (/^(НИЙТ|ДҮН)/i.test(s)) return;
      const oc = officeCodeFromText(s);
      if (oc) {
        office = oc;
        category = null;
        return;
      }
      warnings.push(`${line}-р мөр танигдаагүй гарчиг: ${s.slice(0, 50)}`);
      return;
    }
    if (typeof a === "string" && /^\s*НИЙТ/i.test(a)) {
      const oc = officeCodeFromText(a);
      if (oc) totals.set(oc, { q: num(r[4]), f: num(r[10]) });
      return;
    }
    if (typeof a === "string" && /^\s*ДҮН/i.test(a)) return;
    if (typeof b === "string" && /^\s*(НИЙТ\s+)?ДҮН\s*$/i.test(b)) return;
    if (b === null || b === "") {
      const prev = rows[rows.length - 1];
      if (r[2] !== null && prev && prev.office_code === office) b = prev.name; // нэгтгэсэн нүдний үргэлжлэл
      else return;
    }
    if (!office || !category) {
      warnings.push(`${line}-р мөр газар/ангилалгүй байна`);
      return;
    }
    if (typeof a === "string" && a.trim()) group = a.trim();
    rows.push({
      office_code: office,
      category,
      grp: group,
      name: String(b).trim(),
      model: str(r[2]),
      supplier: str(r[3]),
      qty: num(r[4]) ?? 0,
      commissioned: date(r[5]),
      cost: num(r[6]),
      life_years: num(r[7]),
      remaining_years: num(r[8]),
      qty_ok: num(r[9]),
      qty_faulty: num(r[10]),
      service_contract: str(r[11]),
      last_repair: date(r[12]),
      reval_date: date(r[13]),
      reval_amount: num(r[14]),
      writeoff_reason: str(r[15]),
      writeoff_date: date(r[16]),
      note: str(r[17]),
      issue: str(r[18]),
      source_row: line,
    });
  });

  const checks = [...new Set(rows.map((r) => r.office_code))].map((oc) => {
    const mine = rows.filter((r) => r.office_code === oc);
    const t = totals.get(oc);
    return {
      office: oc,
      sheetQty: t?.q ?? null,
      qty: mine.reduce((s, r) => s + (r.qty || 0), 0),
      sheetFaulty: t?.f ?? null,
      faulty: mine.reduce((s, r) => s + (r.qty_faulty || 0), 0),
    };
  });
  return { rows, checks, warnings };
}

const OFFICE_ABBR = /(УБГГ|ЗҮГГ|УВГГ|БИГГ|ЗАГХ|ГАГХ|ХӨГХ|ХАГХ|ГСГГ|ШХГГ|ХАГГ|СЭГГ|ДоГГ|ДОГГ|БӨГГ|СШГГ|ДАГГ|ОГГ|ХОГГ|ЧХОУНБГГ|УХШИГГ)/g;

/** «Төсвийн төсөл» файлын дэлгэрэнгүй («...+») хуудсыг задална. */
export async function parseBudget(file: File): Promise<ParseReport<NewBudget>> {
  const { XLSX, wb } = await readSheets(file);
  const name = wb.SheetNames.find((n) => n.trim().endsWith("+")) ?? wb.SheetNames[0];
  const data = XLSX.utils.sheet_to_json<Row>(wb.Sheets[name], { header: 1, defval: null, raw: true });
  const rows: NewBudget[] = [];
  const warnings: string[] = [];
  let section: string | null = null;
  let parent: string | null = null;

  data.forEach((r, idx) => {
    const line = idx + 1;
    const title = str(r?.[5]);
    if (!title) return;
    if (/^(I|II|III|IV|V|VI)\./.test(title)) {
      section = title;
      parent = null;
      return;
    }
    if (!section || title === "Шинэ" || /^НИЙТ/i.test(title)) return;
    const no = str(r[1]);
    if (!no && !num(r[11])) return;
    const isGroup = !!no && no.split(".").length === 2 && !str(r[2]);
    const abbr = [...new Set((title.match(OFFICE_ABBR) ?? []).map((c) => c.replace("ДоГГ", "ДОГГ").replace("ХӨГХ", "ХАГХ")))];
    const place = str(r[4]);
    const codes = isGroup ? [] : abbr.length ? abbr : [officeCodeFromText(place) ?? "ГЕГ"];
    rows.push({
      no: no ?? "",
      section,
      is_group: isGroup,
      parent_no: isGroup ? null : parent,
      place,
      name: title.replace(/\s+/g, " "),
      type: str(r[6]),
      qty: num(r[7]),
      unit: str(r[8]),
      start_year: typeof r[9] === "number" ? r[9] : null,
      end_year: typeof r[10] === "number" ? r[10] : null,
      cost_mnt_m: num(r[11]),
      funding_mnt_m: num(r[12]),
      office_codes: codes,
      source_row: line,
    });
    if (isGroup) parent = no;
  });
  if (!rows.length) warnings.push("Төсвийн мөр олдсонгүй. Файлын бүтцийг шалгана уу.");
  return { rows, checks: [], warnings };
}

const key = (r: { office_code: string; name: string; model: string | null; commissioned: string | null }) =>
  `${r.office_code}|${r.name}|${r.model ?? ""}|${r.commissioned ?? ""}`;

/**
 * Тухайн эх сурвалжийн мөрүүдийг солино. Өмнө нь боомтод хуваарилсан
 * мөрүүдийн хуваарилалтыг (газар, нэр, загвар, огноогоор тааруулж) хадгална.
 */
export async function replaceInventory(rows: NewItem[], previous: EquipmentItem[], source: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase тохируулагдаагүй.");
  // Гараар нөхсөн талбар (брэнд, зураг г.м.) болон хуваарилалтыг хадгална
  const keep = new Map(previous.map((p) => [key(p), p]));
  const payload = rows.map((r) => {
    const old = keep.get(key(r));
    const manual = Object.fromEntries(MANUAL_FIELDS.map((f) => [f, old?.[f] ?? null]));
    return { ...r, ...manual, source, port_id: old?.port_id ?? defaultPortFor(r.office_code) };
  });
  const del = await sb.from("equipment_items").delete().eq("source", source);
  if (del.error) throw del.error;
  for (let i = 0; i < payload.length; i += 500) {
    const { error } = await sb.from("equipment_items").insert(payload.slice(i, i + 500));
    if (error) throw error;
  }
  return { inserted: payload.length, keptAssignments: payload.filter((p) => p.port_id && !defaultPortFor(p.office_code)).length };
}

export async function replaceBudget(rows: NewBudget[], source: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Supabase тохируулагдаагүй.");
  const del = await sb.from("equipment_budget").delete().eq("source", source);
  if (del.error) throw del.error;
  const { error } = await sb.from("equipment_budget").insert(rows.map((r) => ({ ...r, source })));
  if (error) throw error;
  return { inserted: rows.length };
}
