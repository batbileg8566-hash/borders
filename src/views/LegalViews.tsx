import { useMemo } from "react";
import { ExternalLink, FileDown, Printer } from "lucide-react";
import { GOODS, REGULATIONS } from "../data";
import { SITE } from "../config/site";
import { useData } from "../lib/DataProvider";
import { href, useQueryState } from "../lib/router";
import {
  CATEGORIES,
  TRANSPORT_LABEL,
  allProposals,
  categoryOf,
  goodById,
  neighborCountry,
  proposalDirection,
  proposalsForRegulation,
  resolveRef,
  usesOfRegulation,
} from "../lib/registry";
import { Button, Empty, KV, Page, PageHeader, RefChip, Section, StatusMark, fmt } from "../components/ui";
import type { PortCategory } from "../types";

// ─── Эрх зүйн актын жагсаалт ─────────────────────────────────────────────────

export function RegulationsList() {
  const { ports } = useData();
  const items = useMemo(
    () =>
      Object.entries(REGULATIONS).map(([id, r]) => {
        const uses = usesOfRegulation(ports, id);
        return {
          id,
          r,
          ports: new Set(uses.map((u) => u.port.id)).size,
          goods: new Set(uses.map((u) => u.entry.goodId)).size,
          proposals: proposalsForRegulation(ports, id).length,
        };
      }),
    [ports],
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Нүүр", to: href("/") }, { label: "Эрх зүйн акт" }]}
        title="Эрх зүйн акт"
        lead="Тодорхой барааг зөвхөн тогтоосон боомтоор нэвтрүүлэхээр заасан Засгийн газрын тогтоол, хууль. Акт бүр ямар боомт, бараанд хамаарахыг харуулна."
      />
      <Page>
        <div className="bg-surface border border-rule rounded-[3px] overflow-x-auto">
          <table className="w-full text-[14px] border-collapse min-w-[720px]">
            <thead>
              <tr className="text-left text-[13px] text-muted border-b border-rule">
                <th className="py-2.5 px-4 font-medium w-[140px]">Дугаар</th>
                <th className="py-2.5 px-3 font-medium">Нэр</th>
                <th className="py-2.5 px-3 font-medium w-[100px]">Огноо</th>
                <th className="py-2.5 px-3 font-medium w-[90px] text-right">Боомт</th>
                <th className="py-2.5 px-3 font-medium w-[90px] text-right">Бараа</th>
                <th className="py-2.5 px-4 font-medium w-[90px] text-right">Санал</th>
              </tr>
            </thead>
            <tbody>
              {items.map(({ id, r, ports: np, goods: ng, proposals: npr }) => (
                <tr key={id} className="border-b border-rule-soft align-top hover:bg-paper">
                  <td className="py-2.5 px-4">
                    <RefChip label={r.number} />
                  </td>
                  <td className="py-2.5 px-3">
                    <a href={href(`/acts/${encodeURIComponent(id)}`)} className="text-ink no-underline hover:underline font-medium">
                      {r.fullName}
                    </a>
                    {r.amendments?.length ? (
                      <span className="block text-[12.5px] text-muted mt-0.5">Нэмэлт, өөрчлөлт: {r.amendments.join(", ")}</span>
                    ) : null}
                  </td>
                  <td className="py-2.5 px-3 text-muted">{r.date}</td>
                  <td className="py-2.5 px-3 text-right">{np}</td>
                  <td className="py-2.5 px-3 text-right">{ng}</td>
                  <td className="py-2.5 px-4 text-right">{npr || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </>
  );
}

export function RegulationDetail({ id }: { id: string }) {
  const { ports } = useData();
  const r = REGULATIONS[id];
  const uses = useMemo(() => usesOfRegulation(ports, id), [ports, id]);
  const props = useMemo(() => proposalsForRegulation(ports, id), [ports, id]);

  const byGood = useMemo(() => {
    const m = new Map<string, { imp: typeof uses; exp: typeof uses }>();
    uses.forEach((u) => {
      const row = m.get(u.entry.goodId) ?? { imp: [], exp: [] };
      (u.direction === "import" ? row.imp : row.exp).push(u);
      m.set(u.entry.goodId, row);
    });
    return [...m.entries()];
  }, [uses]);

  if (!r)
    return (
      <>
        <PageHeader crumbs={[{ label: "Эрх зүйн акт", to: href("/acts") }, { label: "Олдсонгүй" }]} title="Акт олдсонгүй" />
        <Page>
          <Empty>Энэ дугаартай акт бүртгэлд алга.</Empty>
        </Page>
      </>
    );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Эрх зүйн акт", to: href("/acts") }, { label: r.number }]}
        title={r.number}
        lead={r.fullName}
        actions={
          <>
            {r.legalUrl && (
              <Button href={r.legalUrl} variant="primary">
                <ExternalLink className="w-4 h-4" aria-hidden /> legalinfo.mn
              </Button>
            )}
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4" aria-hidden /> Хэвлэх
            </Button>
          </>
        }
      />
      <Page>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="space-y-5 min-w-0">
            <Section title="Тогтоосон боомт, бараагаар" aside={`${byGood.length} бараа`}>
              {byGood.length ? (
                <div className="space-y-5">
                  {byGood.map(([goodId, { imp, exp }]) => (
                    <div key={goodId}>
                      <h3 className="text-[15.5px] mb-2">
                        <a href={href(`/goods/${goodId}`)} className="no-underline hover:underline text-ink">
                          {goodById(goodId)?.name ?? goodId}
                        </a>
                      </h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {([
                          ["Импорт", imp],
                          ["Экспорт", exp],
                        ] as const).map(([label, list]) => (
                          <div key={label} className="border border-rule-soft rounded-[3px]">
                            <p className="px-3 py-1.5 text-[13px] font-medium bg-paper border-b border-rule-soft">
                              {label} ({list.length})
                            </p>
                            {list.length ? (
                              <ul className="px-3 py-2 text-[14px] space-y-1">
                                {list.map((u) => (
                                  <li key={u.port.id} className="flex flex-wrap items-baseline gap-x-2">
                                    <a href={href(`/port/${u.port.id}`)} className="text-ink no-underline hover:underline">
                                      {u.port.name}
                                    </a>
                                    {u.entry.conditions && <span className="text-[12.5px] text-muted">{u.entry.conditions}</span>}
                                    {u.viaAmendment && <span className="text-[12.5px] text-muted">{u.viaAmendment}-аар</span>}
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <p className="px-3 py-2 text-[13.5px] text-muted">Тогтоогоогүй</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Empty>Энэ актаар тогтоосон боомтын мэдээлэл бүртгэгдээгүй.</Empty>
              )}
            </Section>

            {props.length > 0 && (
              <Section title="Энэ актад нэмэх санал" aside={`${props.length} санал`}>
                <ul className="divide-y divide-rule-soft">
                  {props.map(({ port, proposal }, i) => (
                    <li key={i} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusMark status="proposed" />
                        <a href={href(`/port/${port.id}`)} className="font-medium text-ink no-underline hover:underline">
                          {port.name}
                        </a>
                        <span className="text-[14px]">{proposal.text}</span>
                      </div>
                      {proposal.proposalNote && <p className="text-[13.5px] text-muted mt-1 pl-5">{proposal.proposalNote}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>
          <aside>
            <Section title="Актын мэдээлэл">
              <KV
                rows={[
                  ["Дугаар", r.number],
                  ["Батлагдсан", r.date],
                  ["Хууль зүйн үндэслэл", r.legalBasis],
                  ["Нэмэлт, өөрчлөлт", r.amendments?.join(", ")],
                  [
                    "Эх бичвэр",
                    r.legalUrl ? (
                      <a href={r.legalUrl} target="_blank" rel="noreferrer">
                        legalinfo.mn
                      </a>
                    ) : undefined,
                  ],
                ]}
              />
            </Section>
          </aside>
        </div>
      </Page>
    </>
  );
}

// ─── Нэмэх санал ─────────────────────────────────────────────────────────────

export function ProposalsView() {
  const { ports } = useData();
  const groups = useMemo(() => {
    const m = new Map<string, ReturnType<typeof allProposals>>();
    allProposals(ports).forEach((p) => {
      const key = resolveRef(p.proposal.targetResolution).id ?? p.proposal.targetResolution;
      m.set(key, [...(m.get(key) ?? []), p]);
    });
    return [...m.entries()];
  }, [ports]);
  const total = groups.reduce((s, [, l]) => s + l.length, 0);

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const rows = groups.flatMap(([key, list]) =>
      list.map(({ port, proposal }) => ({
        "Өөрчлөх акт": REGULATIONS[key]?.number ?? key,
        "Боомт": port.name,
        "Аймаг": port.region,
        "Бараа": goodById(proposal.goodId)?.name ?? proposal.goodId,
        "Чиглэл": proposalDirection(proposal) === "import" ? "Импорт" : "Экспорт",
        "Саналын агуулга": proposal.text,
        "Тайлбар (дэд бүтэц)": proposal.proposalNote ?? "",
      })),
    );
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 16 }, { wch: 18 }, { wch: 14 }, { wch: 30 }, { wch: 10 }, { wch: 36 }, { wch: 80 }];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Нэмэх санал");
    XLSX.writeFile(wb, `Boomt_nemeh_sanal_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Нүүр", to: href("/") }, { label: "Нэмэх санал" }]}
        title="Тогтоолд нэмэх санал"
        lead={`Одоогийн тогтоолд ороогүй ч тухайн боомтоор нэвтрүүлэх хэрэгцээтэй гэж үзсэн ${total} санал. Өөрчлөх актаар бүлэглэв; төсөл боловсруулахад шууд ашиглана.`}
        actions={
          <>
            <Button onClick={exportXlsx} variant="primary">
              <FileDown className="w-4 h-4" aria-hidden /> Excel татах
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4" aria-hidden /> Хэвлэх
            </Button>
          </>
        }
      />
      <Page>
        <div className="space-y-5">
          {groups.map(([key, list]) => {
            const r = REGULATIONS[key];
            return (
              <Section key={key} title={r ? `${r.number}-д нэмэх` : key} aside={`${list.length} санал`}>
                {r && <p className="text-[13.5px] text-muted -mt-1 mb-3">{r.fullName}</p>}
                <div className="overflow-x-auto">
                  <table className="w-full text-[14px] border-collapse min-w-[640px]">
                    <thead>
                      <tr className="text-left text-[13px] text-muted border-b border-rule">
                        <th className="py-2 pr-3 font-medium w-[170px]">Боомт</th>
                        <th className="py-2 pr-3 font-medium w-[220px]">Бараа</th>
                        <th className="py-2 font-medium">Дэд бүтцийн тайлбар</th>
                      </tr>
                    </thead>
                    <tbody>
                      {list.map(({ port, proposal }, i) => (
                        <tr key={i} className="border-b border-rule-soft align-top">
                          <td className="py-2 pr-3">
                            <a href={href(`/port/${port.id}`)} className="text-ink font-medium no-underline hover:underline">
                              {port.name}
                            </a>
                            <span className="block text-[12.5px] text-muted">{port.region}</span>
                          </td>
                          <td className="py-2 pr-3">
                            <a href={href(`/goods/${proposal.goodId}`)} className="no-underline hover:underline">
                              {goodById(proposal.goodId)?.name ?? proposal.text}
                            </a>
                            <span className="block text-[12.5px] text-muted">
                              {proposalDirection(proposal) === "import" ? "Импорт" : "Экспорт"}
                            </span>
                          </td>
                          <td className="py-2 text-[13.5px]">{proposal.proposalNote ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            );
          })}
        </div>
      </Page>
    </>
  );
}

// ─── Нэгдсэн бүртгэл ─────────────────────────────────────────────────────────

export function RegistryView() {
  const { ports } = useData();
  const [q, setQ] = useQueryState();
  const cat = q.get("cat") as PortCategory | null;
  const list = useMemo(() => (cat ? ports.filter((p) => categoryOf(p) === cat) : ports), [ports, cat]);

  const exportXlsx = async () => {
    const XLSX = await import("xlsx");
    const data = list.map((b) => ({
      "Нэр": b.name,
      "Ангилал": categoryOf(b),
      "Дэд ангилал": b.subCategory ?? "",
      "Аймаг, хот": b.region,
      "Хил залгаа улс": neighborCountry(b) ?? "",
      "Хөрш боомт": b.neighborPortName ?? "",
      "Ажиллагааны горим": b.operationalStatus,
      "Ачаалал": b.trafficStatus,
      "Тээврийн төрөл": b.transportTypes.map((t) => TRANSPORT_LABEL[t] ?? t).join(", "),
      "Хүчин чадал": b.capacity,
      "УБ-аас (км)": b.ubDistance,
      "Аймгийн төвөөс (км)": b.aimagDistance,
      "Лаборатори": b.hasLaboratory ? "Тийм" : "Үгүй",
      "ГУАБ": b.staffGUAB ?? "",
      "ГУБ": b.staffGUB ?? "",
      "Импортлох бараа": (b.legalImports ?? [])
        .map((e) => `${e.text} [${e.resolutions.join(", ")}]${e.conditions ? ` (${e.conditions})` : ""}`)
        .join("\n"),
      "Экспортлох бараа": (b.legalExports ?? [])
        .map((e) => `${e.text} [${e.resolutions.join(", ")}]${e.conditions ? ` (${e.conditions})` : ""}`)
        .join("\n"),
      "Нэмэх санал": (b.proposedAdditions ?? []).map((p) => `${p.text} → ${p.targetResolution}`).join("\n"),
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    ws["!cols"] = Object.keys(data[0] ?? {}).map((k) => ({ wch: /бараа|санал/i.test(k) ? 60 : 16 }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Нэгдсэн бүртгэл");
    XLSX.writeFile(wb, `Boomt_negdsen_burtgel_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Нүүр", to: href("/") }, { label: "Нэгдсэн бүртгэл" }]}
        title="Нэгдсэн бүртгэл"
        lead="Хилийн боомт, гүний гааль, гаалийн бүсийн бүх нэгжийн үндсэн үзүүлэлт."
        actions={
          <Button onClick={exportXlsx} variant="primary">
            <FileDown className="w-4 h-4" aria-hidden /> Excel татах
          </Button>
        }
      />
      <Page>
        <div className="flex flex-wrap gap-2 mb-4 no-print" role="tablist" aria-label="Ангилал">
          {[null, ...CATEGORIES].map((c) => {
            const on = c === cat;
            const n = c ? ports.filter((p) => categoryOf(p) === c).length : ports.length;
            return (
              <button
                key={c ?? "all"}
                role="tab"
                aria-selected={on}
                onClick={() => setQ({ cat: c })}
                className={`h-8 px-3 text-[13.5px] rounded-[3px] border ${
                  on ? "bg-ink text-white border-ink" : "bg-surface text-ink border-rule hover:border-ink"
                }`}
              >
                {c ?? "Бүгд"} <span className={on ? "text-white/70" : "text-muted"}>{n}</span>
              </button>
            );
          })}
        </div>
        <div className="bg-surface border border-rule rounded-[3px] overflow-x-auto">
          <table className="w-full text-[14px] border-collapse min-w-[900px]">
            <thead>
              <tr className="text-left text-[13px] text-muted border-b border-rule">
                <th className="py-2.5 px-4 font-medium">Нэр</th>
                <th className="py-2.5 px-3 font-medium">Ангилал</th>
                <th className="py-2.5 px-3 font-medium">Аймаг, хот</th>
                <th className="py-2.5 px-3 font-medium">Горим</th>
                <th className="py-2.5 px-3 font-medium">Тээвэр</th>
                <th className="py-2.5 px-3 font-medium text-right">Хүчин чадал</th>
                <th className="py-2.5 px-3 font-medium text-right">УБ-аас, км</th>
                <th className="py-2.5 px-4 font-medium text-right">Бараа (И/Э)</th>
              </tr>
            </thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id} className="border-b border-rule-soft hover:bg-paper">
                  <td className="py-2 px-4">
                    <a href={href(`/port/${p.id}`)} className="text-ink font-medium no-underline hover:underline">
                      {p.name}
                    </a>
                  </td>
                  <td className="py-2 px-3 text-muted">{p.subCategory ?? categoryOf(p)}</td>
                  <td className="py-2 px-3">{p.region}</td>
                  <td className="py-2 px-3">{p.operationalStatus}</td>
                  <td className="py-2 px-3">{p.transportTypes.map((t) => TRANSPORT_LABEL[t] ?? t).join(", ")}</td>
                  <td className="py-2 px-3 text-right">{fmt(p.capacity)}</td>
                  <td className="py-2 px-3 text-right">{fmt(p.ubDistance)}</td>
                  <td className="py-2 px-4 text-right">
                    {p.legalImports?.length ?? 0} / {p.legalExports?.length ?? 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Page>
    </>
  );
}

// ─── Эх сурвалж ──────────────────────────────────────────────────────────────

export function AboutView() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Нүүр", to: href("/") }, { label: "Эх сурвалж ба аргачлал" }]}
        title="Эх сурвалж ба аргачлал"
        lead={SITE.sourcesNote}
      />
      <Page>
        <div className="grid gap-5 lg:grid-cols-2">
          <Section title="Төлөвийн тайлбар">
            <ul className="space-y-3 text-[14px]">
              <li className="flex gap-3">
                <StatusMark status="allowed" size={14} />
                <span>
                  <strong>Зөвшөөрөгдсөн</strong> — хүчин төгөлдөр тогтоол, хуулиар тухайн боомтоор нэвтрүүлэхээр тогтоосон.
                </span>
              </li>
              <li className="flex gap-3">
                <StatusMark status="proposed" size={14} />
                <span>
                  <strong>Нэмэх санал</strong> — тогтоолд ороогүй; дэд бүтэц, хэрэгцээний үнэлгээгээр нэмэх санал гаргасан.
                </span>
              </li>
              <li className="flex gap-3">
                <StatusMark status="none" size={14} />
                <span>
                  <strong>Зөвшөөрөгдөөгүй</strong> — тухайн боомтоор нэвтрүүлэх эрх зүйн үндэслэл бүртгэгдээгүй.
                </span>
              </li>
              <li className="flex gap-3 items-center">
                <span className="ref-chip" data-amend="true">
                  №194 (нэмэлт)
                </span>
                <span>Тасархай хүрээтэй лавлагаа нь үндсэн тогтоолд оруулсан нэмэлт, өөрчлөлтийг заана.</span>
              </li>
            </ul>
          </Section>
          <Section title="Ашигласан эрх зүйн акт" aside={`${Object.keys(REGULATIONS).length} акт`}>
            <ul className="space-y-2 text-[14px]">
              {Object.entries(REGULATIONS).map(([id, r]) => (
                <li key={id} className="flex gap-2 items-start">
                  <RefChip label={r.number} />
                  <span>{r.fullName}</span>
                </li>
              ))}
            </ul>
          </Section>
          <Section title="Анхааруулга">
            <p className="text-[14px]">{SITE.status}</p>
            <p className="text-[14px] mt-2 text-muted">
              Хамрагдсан бараа: {GOODS.length} төрөл. Газрын зургийн суурь: OpenStreetMap, CARTO. Замын маршрутыг OSRM үйлчилгээгээр тооцоолдог тул ойролцоо утга болно.
            </p>
          </Section>
        </div>
      </Page>
    </>
  );
}
