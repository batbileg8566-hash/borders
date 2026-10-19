import { useMemo, useState } from "react";
import { FileDown, LogOut, Search } from "lucide-react";
import { CUSTOMS_OFFICES, officeByCode, officeForUnit } from "../data/customsOffices";
import { useData } from "../lib/DataProvider";
import { href, useQueryState } from "../lib/router";
import {
  EQUIPMENT_CATEGORIES,
  categoryShort,
  conditionOf,
  fmtMnt,
  totalsOf,
  useEquipment,
  type BudgetItem,
  type EquipmentItem,
  type ItemCondition,
} from "../lib/equipment";
import { EquipmentGate } from "../components/EquipmentGate";
import { EquipmentImport } from "../components/EquipmentImport";
import { Button, Empty, Page, PageHeader, Section, Segmented, fmt } from "../components/ui";
import type { BorderCrossing } from "../types";

// ─── Жижиг бүрэлдэхүүн ───────────────────────────────────────────────────────

const COND_TEXT: Record<ItemCondition, string> = {
  faulty: "Хэвийн бус",
  expired: "Хугацаа дууссан",
  ok: "Хэвийн",
};

function CondLabel({ c }: { c: ItemCondition }) {
  const cls =
    c === "faulty" ? "text-flag bg-flag/8 border-flag/30" : c === "expired" ? "text-proposed bg-proposed-bg border-proposed/30" : "text-allowed bg-allowed-bg border-allowed/20";
  return <span className={`inline-block px-1.5 text-[12px] font-medium border rounded-sm whitespace-nowrap ${cls}`}>{COND_TEXT[c]}</span>;
}

function Kpis({ items }: { items: EquipmentItem[] }) {
  const t = totalsOf(items);
  const rows: [string, string, string?][] = [
    ["Нийт тоо", `${fmt(t.qty)} ш`, `${fmt(t.lines)} төрөл, загвар`],
    ["Анхны өртөг", fmtMnt(t.cost)],
    ["Хэвийн бус", `${fmt(t.faulty)} ш`, t.qty ? `${((t.faulty / t.qty) * 100).toFixed(1)}%` : undefined],
    ["Ашиглалтын хугацаа дууссан", `${fmt(t.expiredQty)} ш`, "Хэвийн ажиллаж буй ч хугацаа нь дууссан"],
  ];
  return (
    <dl className="grid grid-cols-2 lg:grid-cols-4 border border-rule bg-surface rounded-[3px] divide-x divide-y lg:divide-y-0 divide-rule-soft">
      {rows.map(([k, v, s], i) => (
        <div key={k} className="px-4 py-3">
          <dt className="text-[13px] text-muted">{k}</dt>
          <dd className={`font-serif text-[22px] font-bold leading-tight ${i === 2 && t.faulty ? "text-flag" : "text-ink"}`}>{v}</dd>
          {s && <dd className="text-[12px] text-muted">{s}</dd>}
        </div>
      ))}
    </dl>
  );
}

function AccountBar() {
  const { session, signOut, canEdit } = useEquipment();
  return (
    <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted">
      <span>
        {session?.user?.email}
        {canEdit ? " (засах эрхтэй)" : ""}
      </span>
      <button onClick={signOut} className="inline-flex items-center gap-1 text-azure hover:underline">
        <LogOut className="w-3.5 h-3.5" aria-hidden /> Гарах
      </button>
    </div>
  );
}

async function exportItems(items: EquipmentItem[], ports: BorderCrossing[], filename: string) {
  const XLSX = await import("xlsx");
  const portName = (id: string | null) => (id ? ports.find((p) => p.id === id)?.name ?? id : "");
  const rows = items.map((it) => ({
    "Газар": officeByCode(it.office_code)?.name ?? it.office_code,
    "Боомт": portName(it.port_id),
    "Ангилал": categoryShort(it.category),
    "Бүлэг": it.grp ?? "",
    "Нэр": it.name,
    "Загвар, марк": it.model ?? "",
    "Нийлүүлэгч": it.supplier ?? "",
    "Тоо": it.qty,
    "Хэвийн": it.qty_ok ?? "",
    "Хэвийн бус": it.qty_faulty ?? "",
    "Ашиглалтад орсон": it.commissioned ?? "",
    "Анхны өртөг (₮)": it.cost ?? "",
    "Ашиглалтын хугацаа (жил)": it.life_years ?? "",
    "Үлдэх хугацаа (жил)": it.remaining_years ?? "",
    "Засварын гэрээ": it.service_contract ?? "",
    "Төлөв": COND_TEXT[conditionOf(it)],
    "Тайлбар": [it.note, it.issue].filter(Boolean).join("; "),
  }));
  const ws = XLSX.utils.json_to_sheet(rows);
  ws["!cols"] = Object.keys(rows[0] ?? {}).map((k) => ({ wch: /Нэр|Загвар|Газар|Тайлбар/.test(k) ? 32 : 14 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Тоног төхөөрөмж");
  XLSX.writeFile(wb, filename);
}

// ─── Газар × ангиллын нэгтгэл ────────────────────────────────────────────────

function OfficeMatrix({ items }: { items: EquipmentItem[] }) {
  const offices = useMemo(() => {
    const codes = [...new Set(items.map((i) => i.office_code))];
    return CUSTOMS_OFFICES.filter((o) => codes.includes(o.code));
  }, [items]);
  const cell = (code: string, cat?: string) => {
    const list = items.filter((i) => i.office_code === code && (!cat || i.category === cat));
    return totalsOf(list);
  };
  return (
    <div className="bg-surface border border-rule rounded-[3px] overflow-auto thin-scroll">
      <table className="border-collapse text-[13px] w-max min-w-full">
        <thead className="sticky top-0 bg-surface z-10">
          <tr>
            <th className="sticky left-0 bg-surface z-20 text-left px-3 py-2 border-b border-r border-rule min-w-[200px] font-semibold text-ink">Гаалийн газар, хороо</th>
            {EQUIPMENT_CATEGORIES.map((c) => (
              <th key={c.key} className="px-2 py-2 border-b border-rule font-medium text-right w-[78px] align-bottom leading-tight">
                {c.short}
              </th>
            ))}
            <th className="px-3 py-2 border-b border-l border-rule font-semibold text-right">Нийт</th>
            <th className="px-3 py-2 border-b border-rule font-semibold text-right">Хэвийн бус</th>
            <th className="px-3 py-2 border-b border-rule font-semibold text-right">Өртөг</th>
          </tr>
        </thead>
        <tbody>
          {offices.map((o) => {
            const all = cell(o.code);
            return (
              <tr key={o.code} className="hover:bg-paper group">
                <th className="sticky left-0 bg-surface group-hover:bg-paper text-left font-normal px-3 py-1.5 border-b border-r border-rule-soft">
                  <a href={href(`/equipment/office/${encodeURIComponent(o.code)}`)} className="text-ink font-medium no-underline hover:underline" title={o.name}>
                    {o.name.replace(/ (дахь|дэх) гаалийн (газар|хороо)$/i, "").replace(/^(.+) аймгийн /, "")}
                  </a>
                </th>
                {EQUIPMENT_CATEGORIES.map((c) => {
                  const t = cell(o.code, c.key);
                  return (
                    <td key={c.key} className="px-2 py-1.5 border-b border-rule-soft text-right tabular-nums">
                      {t.qty ? (
                        <a
                          href={href("/equipment", { tab: "list", office: o.code, cat: c.key })}
                          className="no-underline text-text hover:underline"
                          title={`${o.code}, ${c.short}: ${t.qty} ш, хэвийн бус ${t.faulty}`}
                        >
                          {fmt(t.qty)}
                          {t.faulty > 0 && <span className="text-flag text-[11.5px] ml-1">({t.faulty})</span>}
                        </a>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </td>
                  );
                })}
                <td className="px-3 py-1.5 border-b border-l border-rule-soft text-right font-semibold tabular-nums">{fmt(all.qty)}</td>
                <td className={`px-3 py-1.5 border-b border-rule-soft text-right tabular-nums ${all.faulty ? "text-flag font-medium" : "text-faint"}`}>
                  {all.faulty || "—"}
                </td>
                <td className="px-3 py-1.5 border-b border-rule-soft text-right whitespace-nowrap">{fmtMnt(all.cost)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Дэлгэрэнгүй жагсаалт ───────────────────────────────────────────────────

const PAGE = 100;

function ItemsTable({ items, showOffice = true }: { items: EquipmentItem[]; showOffice?: boolean }) {
  const { ports } = useData();
  const { canEdit, assignPort } = useEquipment();
  const [page, setPage] = useState(0);
  const [err, setErr] = useState<string | null>(null);
  const pages = Math.max(1, Math.ceil(items.length / PAGE));
  const view = items.slice(page * PAGE, page * PAGE + PAGE);
  const portName = (id: string | null) => (id ? ports.find((p) => p.id === id)?.name ?? id : null);

  if (!items.length) return <Empty>Шүүлтүүрт тохирох тоног төхөөрөмж алга.</Empty>;

  return (
    <div>
      {err && <p className="text-[13px] text-flag mb-2">{err}</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-[13.5px] border-collapse min-w-[860px]">
          <thead>
            <tr className="text-left text-[12.5px] text-muted border-b border-rule">
              {showOffice && <th className="py-2 pr-3 font-medium">Газар</th>}
              <th className="py-2 pr-3 font-medium">Нэр, загвар</th>
              <th className="py-2 pr-3 font-medium">Ангилал</th>
              <th className="py-2 pr-3 font-medium">Боомт</th>
              <th className="py-2 pr-3 font-medium text-right">Тоо</th>
              <th className="py-2 pr-3 font-medium">Ашиглалтад</th>
              <th className="py-2 pr-3 font-medium text-right">Өртөг</th>
              <th className="py-2 font-medium">Төлөв</th>
            </tr>
          </thead>
          <tbody>
            {view.map((it) => {
              const office = officeByCode(it.office_code);
              const c = conditionOf(it);
              return (
                <tr key={it.id} className="border-b border-rule-soft align-top">
                  {showOffice && (
                    <td className="py-1.5 pr-3">
                      <a href={href(`/equipment/office/${encodeURIComponent(it.office_code)}`)} className="no-underline hover:underline">
                        {it.office_code}
                      </a>
                    </td>
                  )}
                  <td className="py-1.5 pr-3">
                    <span className="font-medium text-text">{it.name}</span>
                    {it.model && <span className="block text-[12.5px] text-muted">{it.model}</span>}
                    {(it.note || it.issue) && <span className="block text-[12px] text-proposed">{[it.note, it.issue].filter(Boolean).join("; ")}</span>}
                  </td>
                  <td className="py-1.5 pr-3 text-muted whitespace-nowrap">{categoryShort(it.category)}</td>
                  <td className="py-1.5 pr-3 whitespace-nowrap">
                    {canEdit && office && office.units.length > 1 ? (
                      <select
                        aria-label="Боомтод хуваарилах"
                        value={it.port_id ?? ""}
                        onChange={async (e) => setErr(await assignPort([it.id], e.target.value || null))}
                        className="h-7 px-1 border border-rule rounded-[3px] text-[12.5px] bg-surface"
                      >
                        <option value="">Газрын түвшинд</option>
                        {office.units.map((u) => (
                          <option key={u} value={u}>
                            {portName(u)}
                          </option>
                        ))}
                      </select>
                    ) : (
                      (portName(it.port_id) ?? (office?.units.length === 1 ? portName(office.units[0]) : <span className="text-faint">—</span>))
                    )}
                  </td>
                  <td className="py-1.5 pr-3 text-right tabular-nums">
                    {fmt(it.qty)}
                    {(it.qty_faulty ?? 0) > 0 && <span className="block text-[12px] text-flag">{it.qty_faulty} хэвийн бус</span>}
                  </td>
                  <td className="py-1.5 pr-3 whitespace-nowrap text-muted">
                    {it.commissioned?.slice(0, 4) ?? "—"}
                    {it.life_years ? <span className="block text-[12px]">{it.life_years} жил</span> : null}
                  </td>
                  <td className="py-1.5 pr-3 text-right whitespace-nowrap">{it.cost ? fmtMnt(it.cost) : "—"}</td>
                  <td className="py-1.5">
                    <CondLabel c={c} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="flex items-center justify-between mt-3 text-[13px] no-print">
          <span className="text-muted">
            {page * PAGE + 1}–{Math.min(items.length, (page + 1) * PAGE)} / {fmt(items.length)}
          </span>
          <div className="flex gap-2">
            <Button onClick={() => setPage((p) => Math.max(0, p - 1))}>Өмнөх</Button>
            <Button onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>Дараах</Button>
          </div>
        </div>
      )}
    </div>
  );
}

const selectCls = "h-9 px-2.5 bg-surface border border-rule rounded-[3px] text-[14px] focus:border-ink outline-none";

function ItemsExplorer() {
  const { items } = useEquipment();
  const { ports } = useData();
  const [q, setQ] = useQueryState();
  const office = q.get("office");
  const cat = q.get("cat");
  const cond = q.get("cond") as ItemCondition | null;
  const [text, setText] = useState("");

  const list = useMemo(() => {
    const needle = text.trim().toLowerCase();
    return items.filter(
      (it) =>
        (!office || it.office_code === office) &&
        (!cat || it.category === cat) &&
        (!cond || conditionOf(it) === cond) &&
        (!needle || `${it.name} ${it.model ?? ""} ${it.supplier ?? ""}`.toLowerCase().includes(needle)),
    );
  }, [items, office, cat, cond, text]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 items-center no-print">
        <select aria-label="Газар" className={selectCls} value={office ?? ""} onChange={(e) => setQ({ office: e.target.value || null })}>
          <option value="">Бүх газар</option>
          {CUSTOMS_OFFICES.filter((o) => items.some((i) => i.office_code === o.code)).map((o) => (
            <option key={o.code} value={o.code}>
              {o.name}
            </option>
          ))}
        </select>
        <select aria-label="Ангилал" className={selectCls} value={cat ?? ""} onChange={(e) => setQ({ cat: e.target.value || null })}>
          <option value="">Бүх ангилал</option>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c.key} value={c.key}>
              {c.short}
            </option>
          ))}
        </select>
        <select aria-label="Төлөв" className={selectCls} value={cond ?? ""} onChange={(e) => setQ({ cond: e.target.value || null })}>
          <option value="">Бүх төлөв</option>
          <option value="faulty">Хэвийн бус</option>
          <option value="expired">Хугацаа дууссан</option>
          <option value="ok">Хэвийн</option>
        </select>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-faint" aria-hidden />
          <input
            aria-label="Нэр, загвараар хайх"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Нэр, загвар, нийлүүлэгч"
            className={`${selectCls} pl-8 w-[240px]`}
          />
        </div>
        <span className="ml-auto" />
        <Button onClick={() => exportItems(list, ports, `Tonog_tokhooromj_${new Date().toISOString().slice(0, 10)}.xlsx`)} variant="primary">
          <FileDown className="w-4 h-4" aria-hidden /> Excel татах ({fmt(list.length)})
        </Button>
      </div>
      <Kpis items={list} />
      <Section title="Жагсаалт" aside={`${fmt(list.length)} мөр`}>
        <ItemsTable items={list} />
      </Section>
    </div>
  );
}

// ─── 2027 оны төсвийн санал ─────────────────────────────────────────────────

export function budgetForOffice(budget: BudgetItem[], code: string) {
  return budget.filter((b) => !b.is_group && b.office_codes.includes(code));
}

function BudgetTable({ rows }: { rows: BudgetItem[] }) {
  const sections = useMemo(() => {
    const m = new Map<string, BudgetItem[]>();
    rows.forEach((r) => m.set(r.section, [...(m.get(r.section) ?? []), r]));
    return [...m.entries()];
  }, [rows]);
  const total = rows.filter((r) => !r.is_group).reduce((s, r) => s + (r.cost_mnt_m ?? 0), 0);
  if (!rows.length) return <Empty>Төсвийн санал бүртгэгдээгүй.</Empty>;
  return (
    <div className="space-y-5">
      <p className="text-[14px] text-muted">
        Нийт төсөвт өртөг: <strong className="text-text">{fmt(Math.round(total))} сая ₮</strong>. Төсвийн төсөл тул батлагдсан дүн биш.
      </p>
      {sections.map(([sec, list]) => (
        <Section key={sec} title={sec.replace(/^[IV]+\.\s*/, "")} aside={`${fmt(Math.round(list.filter((r) => !r.is_group).reduce((s, r) => s + (r.cost_mnt_m ?? 0), 0)))} сая ₮`}>
          <div className="overflow-x-auto">
            <table className="w-full text-[13.5px] border-collapse min-w-[720px]">
              <thead>
                <tr className="text-left text-[12.5px] text-muted border-b border-rule">
                  <th className="py-2 pr-3 font-medium w-[60px]">№</th>
                  <th className="py-2 pr-3 font-medium">Төсөл, арга хэмжээ</th>
                  <th className="py-2 pr-3 font-medium">Хамрах газар</th>
                  <th className="py-2 pr-3 font-medium text-right">Тоо</th>
                  <th className="py-2 font-medium text-right">Өртөг, сая ₮</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r) => (
                  <tr key={r.id} className={`border-b border-rule-soft align-top ${r.is_group ? "bg-paper font-medium" : ""}`}>
                    <td className="py-1.5 pr-3 text-muted">{r.no}</td>
                    <td className="py-1.5 pr-3">{r.name}</td>
                    <td className="py-1.5 pr-3">
                      <div className="flex flex-wrap gap-1">
                        {r.office_codes.map((c) => (
                          <a key={c} href={href(`/equipment/office/${encodeURIComponent(c)}`)} className="ref-chip" title={officeByCode(c)?.name}>
                            {c}
                          </a>
                        ))}
                      </div>
                    </td>
                    <td className="py-1.5 pr-3 text-right tabular-nums">{r.qty ? fmt(r.qty) : "—"}</td>
                    <td className="py-1.5 text-right tabular-nums">{r.cost_mnt_m ? fmt(Math.round(r.cost_mnt_m * 10) / 10) : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ))}
    </div>
  );
}

// ─── Хуудсууд ───────────────────────────────────────────────────────────────

type Tab = "summary" | "list" | "budget" | "import";

export function EquipmentOverview() {
  const { items, budget, access, isAdmin } = useEquipment();
  const [q, setQ] = useQueryState();
  const tabs: Tab[] = isAdmin ? ["summary", "list", "budget", "import"] : ["summary", "list", "budget"];
  const tab = (tabs.includes(q.get("tab") as Tab) ? q.get("tab") : "summary") as Tab;
  const empty = access === "ok" && !items.length && !budget.length;

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Нүүр", to: href("/") }, { label: "Тоног төхөөрөмж" }]}
        title="Гаалийн хяналтын тоног төхөөрөмж"
        lead="Гаалийн газар, хороодын одоо ашиглаж буй тоног төхөөрөмж, тэдгээрийн төлөв болон 2027 оны төсвийн саналаар шаардагдах тоног төхөөрөмж."
        actions={access === "ok" ? <AccountBar /> : undefined}
      />
      <Page>
        <EquipmentGate>
          <div className="space-y-5">
            <Segmented<Tab>
              label="Харагдац"
              value={tab}
              onChange={(v) => setQ({ tab: v === "summary" ? null : v })}
              options={[
                { value: "summary", label: "Нэгтгэл" },
                { value: "list", label: "Дэлгэрэнгүй жагсаалт" },
                { value: "budget", label: "2027 төсвийн санал" },
                ...(isAdmin ? [{ value: "import" as const, label: "Өгөгдөл шинэчлэх" }] : []),
              ]}
            />
            {empty && tab !== "import" && (
              <p className="text-[14px] border border-rule bg-surface rounded-[3px] px-4 py-3">
                Санд тоног төхөөрөмжийн мэдээлэл хараахан ороогүй байна.
                {isAdmin ? (
                  <>
                    {" "}
                    <a href={href("/equipment", { tab: "import" })}>Excel файлаас оруулах</a>
                  </>
                ) : (
                  " Админ мэдээллийг оруулсны дараа энд харагдана."
                )}
              </p>
            )}
            {tab === "import" && isAdmin && <EquipmentImport />}
            {tab === "summary" && (
              <>
                <Kpis items={items} />
                <div>
                  <h2 className="text-[17px] mb-1">Газар, ангиллаар</h2>
                  <p className="text-[13px] text-muted mb-3">Тоо ширхэгээр. Хаалтанд хэвийн бус ширхэг. Нүдэн дээр дарж жагсаалтыг харна.</p>
                  <OfficeMatrix items={items} />
                </div>
              </>
            )}
            {tab === "list" && <ItemsExplorer />}
            {tab === "budget" && <BudgetTable rows={budget} />}
          </div>
        </EquipmentGate>
      </Page>
    </>
  );
}

export function OfficeEquipment({ code }: { code: string }) {
  const { items, budget, access } = useEquipment();
  const { ports } = useData();
  const office = officeByCode(code);
  const mine = useMemo(() => items.filter((i) => i.office_code === code), [items, code]);
  const bud = useMemo(() => budgetForOffice(budget, code), [budget, code]);

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Тоног төхөөрөмж", to: href("/equipment") },
          { label: office?.name ?? code },
        ]}
        title={office?.name ?? code}
        lead={
          office?.units.length ? (
            <>
              Харьяа нэгж:{" "}
              {office.units.map((u, i) => (
                <span key={u}>
                  {i > 0 && ", "}
                  <a href={href(`/port/${u}`)}>{ports.find((p) => p.id === u)?.name ?? u}</a>
                </span>
              ))}
            </>
          ) : undefined
        }
        actions={
          access === "ok" ? (
            <Button onClick={() => exportItems(mine, ports, `Tonog_tokhooromj_${code}_${new Date().toISOString().slice(0, 10)}.xlsx`)} variant="primary">
              <FileDown className="w-4 h-4" aria-hidden /> Excel татах
            </Button>
          ) : undefined
        }
      />
      <Page>
        <EquipmentGate>
          <div className="space-y-5">
            <Kpis items={mine} />
            {office && office.units.length > 1 && (
              <p className="text-[13.5px] text-muted">
                Энэ газар {office.units.length} нэгжийг хамардаг. Бүртгэл газрын түвшинд хөтлөгддөг тул тоног төхөөрөмжийг боомтоор хуваарилсны дараа боомт тус бүрийн хуудсанд тусдаа харагдана.
              </p>
            )}
            {EQUIPMENT_CATEGORIES.map((c) => {
              const list = mine.filter((i) => i.category === c.key);
              if (!list.length) return null;
              const t = totalsOf(list);
              return (
                <Section key={c.key} title={c.short} aside={`${fmt(t.qty)} ш${t.faulty ? `, ${t.faulty} хэвийн бус` : ""}, ${fmtMnt(t.cost)}`}>
                  <ItemsTable items={list} showOffice={false} />
                </Section>
              );
            })}
            {!mine.length && <Empty>Энэ газрын тоног төхөөрөмж бүртгэгдээгүй.</Empty>}
            {bud.length > 0 && (
              <Section title="2027 оны төсвийн саналд тусгагдсан" aside={`${bud.length} арга хэмжээ`}>
                <BudgetTable rows={bud} />
              </Section>
            )}
          </div>
        </EquipmentGate>
      </Page>
    </>
  );
}

/** Боомтын хуудсанд харагдах хэсэг. */
export function PortEquipmentSection({ port }: { port: BorderCrossing }) {
  const { items, budget, access } = useEquipment();
  const office = officeForUnit(port.id);
  const shared = office ? office.units.length > 1 : false;
  const scoped = useMemo(() => {
    if (!office) return [];
    const ofOffice = items.filter((i) => i.office_code === office.code);
    if (!shared) return ofOffice;
    return ofOffice.filter((i) => i.port_id === port.id);
  }, [items, office, shared, port.id]);
  const officeAll = useMemo(() => (office ? items.filter((i) => i.office_code === office.code) : []), [items, office]);
  const bud = useMemo(() => (office ? budgetForOffice(budget, office.code) : []), [budget, office]);
  // Хуваарилалт хийгдсэн бол боомтын, үгүй бол газрын нийт дүнг харуулна
  const base = shared && !scoped.length ? officeAll : scoped;

  if (!office) return null;

  return (
    <Section
      title="Гаалийн хяналтын тоног төхөөрөмж"
      aside={
        <a href={href(`/equipment/office/${encodeURIComponent(office.code)}`)}>{office.code} газрын бүртгэл</a>
      }
    >
      <EquipmentGate compact>
        {access === "ok" && (
          <div className="space-y-3">
            {shared && (
              <p className="text-[13px] text-muted">
                {office.name} {office.units.length} нэгжийг хамардаг. Энэ боомтод хуваарилсан {fmt(totalsOf(scoped).qty)} ш, газрын нийт {fmt(totalsOf(officeAll).qty)} ш.
              </p>
            )}
            <table className="w-full text-[14px] border-collapse">
              <thead>
                <tr className="text-left text-[12.5px] text-muted border-b border-rule">
                  <th className="py-1.5 pr-3 font-medium">Ангилал</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Тоо</th>
                  <th className="py-1.5 pr-3 font-medium text-right">Хэвийн бус</th>
                  <th className="py-1.5 font-medium text-right">Хугацаа дууссан</th>
                </tr>
              </thead>
              <tbody>
                {EQUIPMENT_CATEGORIES.map((c) => {
                  const t = totalsOf(base.filter((i) => i.category === c.key));
                  if (!t.qty) return null;
                  return (
                    <tr key={c.key} className="border-b border-rule-soft">
                      <td className="py-1.5 pr-3">
                        <a href={href("/equipment", { tab: "list", office: office.code, cat: c.key })} className="no-underline hover:underline">
                          {c.short}
                        </a>
                      </td>
                      <td className="py-1.5 pr-3 text-right tabular-nums">{fmt(t.qty)}</td>
                      <td className={`py-1.5 pr-3 text-right tabular-nums ${t.faulty ? "text-flag font-medium" : "text-faint"}`}>{t.faulty || "—"}</td>
                      <td className={`py-1.5 text-right tabular-nums ${t.expiredQty ? "text-proposed" : "text-faint"}`}>{t.expiredQty || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {shared && !scoped.length && <p className="text-[12.5px] text-muted">Боомтод хуваарилаагүй тул хүснэгтэд газрын нийт дүнг харуулав.</p>}
            {bud.length > 0 && (
              <p className="text-[13.5px]">
                2027 оны төсвийн саналд {bud.length} арга хэмжээ тусгагдсан:{" "}
                {bud
                  .slice(0, 4)
                  .map((b) => b.name.replace(/\s*\/[^/]*\/\s*$/, ""))
                  .join("; ")}
                {bud.length > 4 ? "…" : ""}
              </p>
            )}
          </div>
        )}
      </EquipmentGate>
    </Section>
  );
}
