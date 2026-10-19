import { useMemo, type ReactNode } from "react";
import { ArrowLeft, X } from "lucide-react";
import { GOODS } from "../data";
import type { BorderCrossing, Direction, PortCategory } from "../types";
import { useData } from "../lib/DataProvider";
import { href, useQueryState } from "../lib/router";
import {
  CATEGORIES,
  SUBCATEGORIES,
  TRANSPORT_LABEL,
  cellFor,
  categoryOf,
  matchesSubcategory,
  neighborCountry,
  type CellStatus,
} from "../lib/registry";
import { PortMap, type RouteMode } from "../components/PortMap";
import { Legend, RefChip, Segmented, StatusMark, fmt } from "../components/ui";

const CATEGORY_HINT: Record<PortCategory, string> = {
  "Боомт": "Улсын хилийн авто, төмөр зам, агаарын боомт",
  "Гүний гааль": "Дотоодын гаалийн газар, салбар",
  "Хяналтын бүс": "Гаалийн хяналтын бүс",
  "Баталгаат бүс": "Баталгаат агуулах, татваргүй дэлгүүр г.м.",
  "Чөлөөт бүс": "Чөлөөт бүсийн гаалийн хяналт",
};

function Field({ label, children, htmlFor }: { label: string; children: ReactNode; htmlFor?: string }) {
  return (
    <div className="space-y-1">
      <label htmlFor={htmlFor} className="block text-[13px] font-medium text-text">
        {label}
      </label>
      {children}
    </div>
  );
}

const selectCls =
  "w-full h-9 px-2.5 bg-surface border border-rule rounded-[3px] text-[14px] text-text focus:border-ink outline-none";

function PortRow({
  port,
  status,
  onSelect,
}: {
  port: BorderCrossing;
  status: CellStatus | null;
  onSelect: () => void;
}) {
  const country = neighborCountry(port);
  return (
    <li>
      <button
        onClick={onSelect}
        className="w-full text-left px-4 py-2.5 flex items-start gap-3 hover:bg-paper border-b border-rule-soft"
      >
        <span className="pt-1">{status ? <StatusMark status={status} /> : <span className="block w-3" />}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-medium text-ink">{port.name}</span>
          <span className="block text-[12.5px] text-muted">
            {port.region}
            {country ? `, ${country}-тай хиллэдэг` : ""}
          </span>
        </span>
        <span className="text-[12px] text-faint whitespace-nowrap pt-0.5">{port.operationalStatus}</span>
      </button>
    </li>
  );
}

function SelectedSummary({
  port,
  goodId,
  dir,
  routeMode,
  setRoute,
  onClear,
}: {
  port: BorderCrossing;
  goodId: string | null;
  dir: Direction;
  routeMode: RouteMode;
  setRoute: (m: RouteMode) => void;
  onClear: () => void;
}) {
  const good = GOODS.find((g) => g.id === goodId);
  const cell = goodId ? cellFor(port, goodId) : null;
  const entry = cell ? (dir === "import" ? cell.importEntry : cell.exportEntry) : null;
  return (
    <div className="flex flex-col min-h-0">
      <div className="px-4 py-3 border-b border-rule flex items-center gap-2">
        <button onClick={onClear} className="inline-flex items-center gap-1.5 text-[13px] text-azure hover:underline">
          <ArrowLeft className="w-4 h-4" aria-hidden /> Жагсаалт руу буцах
        </button>
      </div>
      <div className="px-4 py-4 overflow-auto thin-scroll space-y-4">
        <div>
          <p className="text-[13px] text-muted">{categoryOf(port)}</p>
          <h2 className="text-[22px] leading-tight">{port.name}</h2>
          <p className="text-[13.5px] text-muted mt-0.5">
            {port.region}
            {port.neighborPortName ? `, хөрш боомт: ${port.neighborPortName}` : ""}
          </p>
        </div>

        {good && cell && (
          <div className="border border-rule rounded-[3px] p-3 bg-paper">
            <p className="text-[13px] text-muted mb-1">
              {good.name}, {dir === "import" ? "импорт" : "экспорт"}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <StatusMark status={dir === "import" ? cell.import : cell.export} />
              <span className="text-[14px] font-medium">
                {entry ? "Зөвшөөрөгдсөн" : cell.proposal ? "Нэмэх санал бий" : "Зөвшөөрөгдөөгүй"}
              </span>
              {entry?.resolutions.map((r) => <RefChip key={r} label={r} />)}
              {!entry && cell.proposal && <RefChip label={cell.proposal.targetResolution} />}
            </div>
            {entry?.conditions && <p className="text-[13px] mt-1.5">Нөхцөл: {entry.conditions}</p>}
            {!entry && cell.proposal?.proposalNote && <p className="text-[13px] mt-1.5">{cell.proposal.proposalNote}</p>}
          </div>
        )}

        <dl className="grid grid-cols-2 gap-px bg-rule-soft border border-rule-soft text-[13px]">
          {[
            ["Ажиллагаа", port.operationalStatus],
            ["Ачаалал", port.trafficStatus],
            ["Тээвэр", port.transportTypes.map((t) => TRANSPORT_LABEL[t] ?? t).join(", ")],
            ["Хүчин чадал", `${fmt(port.capacity)} / өдөр`],
            ["Улаанбаатараас", `${fmt(port.ubDistance)} км`],
            ["Аймгийн төвөөс", `${fmt(port.aimagDistance)} км`],
            ["Импортын бараа", `${port.legalImports?.length ?? 0} төрөл`],
            ["Экспортын бараа", `${port.legalExports?.length ?? 0} төрөл`],
          ].map(([k, v]) => (
            <div key={k} className="bg-surface px-2.5 py-2">
              <dt className="text-muted">{k}</dt>
              <dd className="font-medium text-text">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="space-y-1.5">
          <p className="text-[13px] font-medium">Замын маршрут</p>
          <Segmented<"none" | "ub" | "aimag">
            label="Маршрут"
            value={routeMode ?? "none"}
            onChange={(v) => setRoute(v === "none" ? null : v)}
            options={[
              { value: "none", label: "Нуух" },
              { value: "ub", label: "Улаанбаатар" },
              ...(port.aimagLat ? [{ value: "aimag" as const, label: "Аймгийн төв" }] : []),
            ]}
          />
        </div>

        <a
          href={href(`/port/${port.id}`)}
          className="flex items-center justify-center h-10 rounded-[3px] bg-ink text-white text-[14px] font-medium no-underline hover:bg-ink-2"
        >
          Нэгжийн дэлгэрэнгүй мэдээлэл
        </a>
      </div>
    </div>
  );
}

export function MapView() {
  const { ports } = useData();
  const [q, setQ] = useQueryState();

  const cat = (CATEGORIES.includes(q.get("cat") as PortCategory) ? q.get("cat") : "Боомт") as PortCategory;
  const sub = q.get("sub");
  const goodId = q.get("good");
  const dir: Direction = q.get("dir") === "export" ? "export" : "import";
  const selId = q.get("sel");
  const routeMode = (q.get("route") as RouteMode) || null;

  const visible = useMemo(() => ports.filter((p) => matchesSubcategory(p, cat, sub)), [ports, cat, sub]);
  const selected = visible.find((p) => p.id === selId) ?? ports.find((p) => p.id === selId) ?? null;

  const groups = useMemo(() => {
    if (!goodId) return null;
    const g: Record<CellStatus, BorderCrossing[]> = { allowed: [], proposed: [], none: [] };
    visible.forEach((p) => {
      const c = cellFor(p, goodId);
      g[dir === "import" ? c.import : c.export].push(p);
    });
    return g;
  }, [visible, goodId, dir]);

  const good = GOODS.find((g) => g.id === goodId);

  return (
    <div className="h-full flex flex-col-reverse md:flex-row">
      <aside className="md:w-[380px] shrink-0 bg-surface border-r border-rule flex flex-col min-h-0 h-[55%] md:h-auto border-t md:border-t-0">
        {selected ? (
          <SelectedSummary
            port={selected}
            goodId={goodId}
            dir={dir}
            routeMode={routeMode}
            setRoute={(m) => setQ({ route: m })}
            onClear={() => setQ({ sel: null, route: null })}
          />
        ) : (
          <>
            <div className="p-4 space-y-3 border-b border-rule">
              <Field label="Нэгжийн төрөл" htmlFor="f-cat">
                <select
                  id="f-cat"
                  className={selectCls}
                  value={cat}
                  onChange={(e) => setQ({ cat: e.target.value, sub: null, sel: null })}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                <p className="text-[12px] text-muted">{CATEGORY_HINT[cat]}</p>
              </Field>
              <Field label={cat === "Боомт" ? "Тээврийн төрөл" : "Дэд ангилал"} htmlFor="f-sub">
                <select id="f-sub" className={selectCls} value={sub ?? ""} onChange={(e) => setQ({ sub: e.target.value || null })}>
                  <option value="">Бүгд</option>
                  {SUBCATEGORIES[cat].map((s) => (
                    <option key={s} value={s}>
                      {cat === "Боомт" ? TRANSPORT_LABEL[s] ?? s : s}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Бараагаар шүүх" htmlFor="f-good">
                <div className="flex gap-2">
                  <select id="f-good" className={selectCls} value={goodId ?? ""} onChange={(e) => setQ({ good: e.target.value || null })}>
                    <option value="">Бараа сонгоогүй</option>
                    {GOODS.map((g) => (
                      <option key={g.id} value={g.id}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                  {goodId && (
                    <button
                      onClick={() => setQ({ good: null })}
                      className="h-9 w-9 shrink-0 grid place-items-center border border-rule rounded-[3px] text-muted hover:text-ink"
                      title="Шүүлтүүр арилгах"
                    >
                      <X className="w-4 h-4" aria-hidden />
                    </button>
                  )}
                </div>
              </Field>
              {goodId && (
                <Segmented<Direction>
                  label="Чиглэл"
                  value={dir}
                  onChange={(v) => setQ({ dir: v === "import" ? null : v })}
                  options={[
                    { value: "import", label: "Импорт" },
                    { value: "export", label: "Экспорт" },
                  ]}
                />
              )}
            </div>

            <div className="px-4 py-2.5 border-b border-rule-soft bg-paper text-[13px] text-muted">
              {groups && good ? (
                <span>
                  <strong className="text-text">{groups.allowed.length}</strong> нэгжээр {dir === "import" ? "импортлох" : "экспортлох"}{" "}
                  зөвшөөрөлтэй, <strong className="text-text">{groups.proposed.length}</strong> нэгжид нэмэх санал.{" "}
                  <a href={href(`/goods/${goodId}`, { dir: dir === "export" ? "export" : null })}>Барааны хуудас</a>
                </span>
              ) : (
                <span>
                  {cat}: <strong className="text-text">{visible.length}</strong> нэгж
                </span>
              )}
            </div>

            <ul className="flex-1 overflow-auto thin-scroll">
              {groups ? (
                (["allowed", "proposed", "none"] as CellStatus[]).map((s) =>
                  groups[s].length ? (
                    <li key={s}>
                      <p className="px-4 pt-3 pb-1 text-[12.5px] font-semibold text-muted">
                        {s === "allowed" ? "Зөвшөөрөгдсөн" : s === "proposed" ? "Нэмэх саналтай" : "Зөвшөөрөгдөөгүй"} ({groups[s].length})
                      </p>
                      <ul>
                        {groups[s].map((p) => (
                          <PortRow key={p.id} port={p} status={s} onSelect={() => setQ({ sel: p.id })} />
                        ))}
                      </ul>
                    </li>
                  ) : null,
                )
              ) : visible.length ? (
                visible.map((p) => <PortRow key={p.id} port={p} status={null} onSelect={() => setQ({ sel: p.id })} />)
              ) : (
                <li className="px-4 py-6 text-[14px] text-muted">
                  Энэ ангилалд бүртгэлтэй нэгж алга. Дээрх шүүлтүүрээс өөр ангилал сонгоно уу.
                </li>
              )}
            </ul>
          </>
        )}
      </aside>

      <div className="relative flex-1 min-h-[45%] md:min-h-0">
        <PortMap
          ports={visible}
          selected={selected}
          onSelect={(p) => setQ({ sel: p.id })}
          goodId={goodId}
          direction={dir}
          routeMode={routeMode}
        />
        {goodId && (
          <div className="absolute left-3 bottom-3 z-[1000] bg-surface/95 border border-rule rounded-[3px] px-3 py-2">
            <Legend />
          </div>
        )}
      </div>
    </div>
  );
}
