/**
 * Нэгдсэн бүртгэлийн давхарга.
 * Боомт ↔ бараа ↔ эрх зүйн акт гурвын хоорондын холбоосыг нэг газраас тооцоолно.
 * UI-ийн бүх хэсэг өгөгдлийг шууд биш, энэ модулиар дамжуулан авна.
 */
import { GOODS, REGULATIONS } from "../data";
import type {
  BorderCrossing,
  Direction,
  Good,
  LegalGoodEntry,
  PortCategory,
  ProposedAddition,
  RegulationRef,
} from "../types";

export const CATEGORIES: PortCategory[] = [
  "Боомт",
  "Гүний гааль",
  "Хяналтын бүс",
  "Баталгаат бүс",
  "Чөлөөт бүс",
];

export const SUBCATEGORIES: Record<PortCategory, string[]> = {
  "Боомт": ["Автозам", "Төмөр зам", "Агаар", "AGV"],
  "Гүний гааль": [
    "Улаанбаатар хот дахь гаалийн газар",
    "Орхон аймаг дахь гаалийн газар",
    "Дархан дахь гаалийн газар",
    "Сайншанд дахь гаалийн газар",
    "Чойр дахь салбар",
    "Айраг дахь салбар",
    "Бор-Өндөр дахь салбар",
    "Улс хоорондын шуудан илгээмжийн гаалийн газар",
  ],
  "Хяналтын бүс": [
    "Төрөл бүрийн барааны",
    "Уул уурхайн бүтээгдэхүүний",
    "Газрын тосны",
    "Химийн болон цацраг идэвхит",
    "Катерингийн үйлчилгээний",
    "Шуудан илгээмжийн",
  ],
  "Баталгаат бүс": [
    "Гаалийн баталгаат агуулах",
    "Гаалийн баталгаат барилгын талбай",
    "Гаалийн баталгаат үзэсгэлэнгийн газар",
    "Гаалийн баталгаат үйлдвэрийн газар",
    "Гаалийн тусгай бүс",
    "Татваргүй барааны дэлгүүр",
  ],
  "Чөлөөт бүс": ["Алтанбулаг", "Замын-Үүд", "Цагааннуур", "Хөшгийн хөндийн"],
};

export const TRANSPORT_LABEL: Record<string, string> = {
  "Автозам": "Авто зам",
  "Төмөр зам": "Төмөр зам",
  "Агаар": "Агаарын",
  "AGV": "AGV (ухаалаг тээвэр)",
};

export const DIRECTION_LABEL: Record<Direction, string> = {
  import: "Импорт",
  export: "Экспорт",
};

export const categoryOf = (b: BorderCrossing): PortCategory => b.category ?? "Боомт";

/** Хил залгаа улсыг хөрш боомтын нэрнээс тодорхойлно. */
export function neighborCountry(b: BorderCrossing): "БНХАУ" | "ОХУ" | null {
  const s = `${b.neighborPortName ?? ""} ${b.direction}`;
  if (/БНХАУ|Хятад/.test(s)) return "БНХАУ";
  if (/ОХУ|Орос/.test(s)) return "ОХУ";
  return null;
}

/** Нэгжийг сонгосон ангилал/дэд ангилалд хамаарах эсэх. */
export function matchesSubcategory(b: BorderCrossing, cat: PortCategory, sub: string | null) {
  if (categoryOf(b) !== cat) return false;
  if (!sub) return true;
  if (cat === "Боомт") return b.transportTypes.includes(sub as any);
  return b.subCategory === sub;
}

// ─── Эрх зүйн акт ────────────────────────────────────────────────────────────

export interface ResolvedRef {
  /** REGULATIONS дахь түлхүүр, олдохгүй бол null */
  id: string | null;
  label: string;
  /** Нэмэлт, өөрчлөлтийн тогтоол бол үндсэн актад холбогдсон */
  isAmendment: boolean;
}

const cache = new Map<string, ResolvedRef>();

/**
 * "ЗГ №215/2022", "ЗГ №173-д нэмэх", "№194 нэмэлт", "ОАТ" зэрэг янз бүрийн
 * бичлэгийг REGULATIONS-ийн нэг түлхүүр рүү буулгана.
 */
export function resolveRef(label: string): ResolvedRef {
  const hit = cache.get(label);
  if (hit) return hit;
  let out: ResolvedRef = { id: null, label, isAmendment: false };

  if (/ОАТ|Онцгой албан татвар/.test(label)) {
    out = { id: "oat", label: "ОАТ", isAmendment: false };
  } else {
    const m = label.match(/№\s*(\d+)(?:\/(\d{4}))?/);
    if (m) {
      const [, num, year] = m;
      const keys = Object.keys(REGULATIONS);
      const direct = year && REGULATIONS[`${num}/${year}`] ? `${num}/${year}` : null;
      const plain = !year && REGULATIONS[num] ? num : null;
      const byPrefix = keys.filter((k) => k.startsWith(`${num}/`));
      const id = direct ?? plain ?? (byPrefix.length === 1 ? byPrefix[0] : null);
      if (id) {
        out = { id, label: REGULATIONS[id].number, isAmendment: false };
      } else {
        // Нэмэлт өөрчлөлтийн дугаараар үндсэн актыг хайна
        const parent = keys.find((k) =>
          REGULATIONS[k].amendments?.some((a) => a.replace(/\s/g, "").startsWith(`№${num}`)),
        );
        if (parent) out = { id: parent, label: `№${num} (нэмэлт)`, isAmendment: true };
      }
    }
  }
  cache.set(label, out);
  return out;
}

export const regulationById = (id: string): RegulationRef | undefined => REGULATIONS[id];
export const goodById = (id: string): Good | undefined => GOODS.find((g) => g.id === id);

// ─── Холбоосын индекс ─────────────────────────────────────────────────────────

export type CellStatus = "allowed" | "proposed" | "none";

export interface PortGoodCell {
  import: CellStatus;
  export: CellStatus;
  importEntry?: LegalGoodEntry;
  exportEntry?: LegalGoodEntry;
  proposal?: ProposedAddition;
}

export function cellFor(port: BorderCrossing, goodId: string): PortGoodCell {
  const importEntry = port.legalImports?.find((e) => e.goodId === goodId);
  const exportEntry = port.legalExports?.find((e) => e.goodId === goodId);
  const proposal = port.proposedAdditions?.find((p) => p.goodId === goodId);
  const propDir = proposal ? proposalDirection(proposal) : null;
  return {
    import: importEntry ? "allowed" : proposal && propDir !== "export" ? "proposed" : "none",
    export: exportEntry ? "allowed" : proposal && propDir === "export" ? "proposed" : "none",
    importEntry,
    exportEntry,
    proposal,
  };
}

/** Саналын текстээс чиглэлийг таана; заагаагүй бол импорт гэж үзнэ. */
export function proposalDirection(p: ProposedAddition): Direction {
  return /экспорт/i.test(p.text) ? "export" : "import";
}

export interface GoodCoverage {
  allowed: { port: BorderCrossing; entry: LegalGoodEntry }[];
  proposed: { port: BorderCrossing; proposal: ProposedAddition }[];
}

export function coverageForGood(ports: BorderCrossing[], goodId: string, dir: Direction): GoodCoverage {
  const allowed: GoodCoverage["allowed"] = [];
  const proposed: GoodCoverage["proposed"] = [];
  for (const port of ports) {
    const list = dir === "import" ? port.legalImports : port.legalExports;
    const entry = list?.find((e) => e.goodId === goodId);
    if (entry) {
      allowed.push({ port, entry });
      continue;
    }
    const proposal = port.proposedAdditions?.find(
      (p) => p.goodId === goodId && proposalDirection(p) === dir,
    );
    if (proposal) proposed.push({ port, proposal });
  }
  return { allowed, proposed };
}

export interface RegulationUse {
  port: BorderCrossing;
  direction: Direction;
  entry: LegalGoodEntry;
  viaAmendment: string | null;
}

export function usesOfRegulation(ports: BorderCrossing[], regId: string): RegulationUse[] {
  const out: RegulationUse[] = [];
  for (const port of ports) {
    (["import", "export"] as Direction[]).forEach((direction) => {
      const list = direction === "import" ? port.legalImports : port.legalExports;
      list?.forEach((entry) => {
        for (const r of entry.resolutions) {
          const ref = resolveRef(r);
          if (ref.id === regId) {
            out.push({ port, direction, entry, viaAmendment: ref.isAmendment ? r : null });
            break;
          }
        }
      });
    });
  }
  return out;
}

export function proposalsForRegulation(ports: BorderCrossing[], regId: string) {
  return allProposals(ports).filter((p) => resolveRef(p.proposal.targetResolution).id === regId);
}

export function allProposals(ports: BorderCrossing[]) {
  return ports.flatMap((port) =>
    (port.proposedAdditions ?? []).map((proposal) => ({ port, proposal })),
  );
}

/** Нэг барааны хувьд хамаарах эрх зүйн актуудыг (давхардалгүй) буцаана. */
export function regulationsForGood(ports: BorderCrossing[], goodId: string): string[] {
  const ids = new Set<string>();
  const good = goodById(goodId);
  if (good) {
    [good.sources.import, good.sources.export].forEach((s) => {
      const id = resolveRef(s).id;
      if (id) ids.add(id);
    });
  }
  for (const p of ports) {
    [...(p.legalImports ?? []), ...(p.legalExports ?? [])]
      .filter((e) => e.goodId === goodId)
      .forEach((e) =>
        e.resolutions.forEach((r) => {
          const id = resolveRef(r).id;
          if (id) ids.add(id);
        }),
      );
  }
  return [...ids];
}

/** Хайлт: боомт, бараа, эрх зүйн актыг нэг дор. */
export interface SearchHit {
  kind: "port" | "good" | "regulation";
  id: string;
  title: string;
  subtitle: string;
}

export function search(ports: BorderCrossing[], q: string): SearchHit[] {
  const needle = q.trim().toLowerCase();
  if (needle.length < 2) return [];
  const has = (s?: string) => !!s && s.toLowerCase().includes(needle);
  const hits: SearchHit[] = [];
  ports.forEach((p) => {
    if (has(p.name) || has(p.region) || has(p.neighborPortName))
      hits.push({ kind: "port", id: p.id, title: p.name, subtitle: `${categoryOf(p)}, ${p.region}` });
  });
  GOODS.forEach((g) => {
    if (has(g.name) || has(g.detail)) hits.push({ kind: "good", id: g.id, title: g.name, subtitle: "Бараа" });
  });
  Object.entries(REGULATIONS).forEach(([id, r]) => {
    if (has(r.number) || has(r.fullName))
      hits.push({ kind: "regulation", id, title: r.number, subtitle: r.fullName });
  });
  return hits.slice(0, 12);
}
