import { useMemo } from "react";
import { MapPinned, Printer } from "lucide-react";
import { GOODS } from "../data";
import type { Direction } from "../types";
import { useData } from "../lib/DataProvider";
import { href, useQueryState } from "../lib/router";
import {
  cellFor,
  categoryOf,
  coverageForGood,
  goodById,
  neighborCountry,
  regulationById,
  regulationsForGood,
} from "../lib/registry";
import { Button, Empty, Legend, Page, PageHeader, RefChip, Section, Segmented, StatusMark } from "../components/ui";
import { PortMap } from "../components/PortMap";

/** Хүснэгтийн толгойд багтах товч нэр */
const SHORT: Record<string, string> = {
  plant: "Ургамлын үр, суулгац",
  animal: "Мал, амьтан",
  breeding_animal: "Үржлийн мал",
  embryo: "Үр, хөврөл",
  meat: "Түүхий мах",
  medicine: "Эм, эмнэлгийн хэрэгсэл",
  chemical: "Химийн хорт бодис",
  explosive: "Тэсэрч дэлбэрэх бодис",
  alcohol: "Согтууруулах ундаа",
  pesticide: "Ургамал хамгаалал, бордоо",
  gmo: "ХАО (ГМО)",
  oil: "Газрын тос",
};

type Country = "all" | "БНХАУ" | "ОХУ";

export function GoodsMatrix() {
  const { ports } = useData();
  const [q, setQ] = useQueryState();
  const country = (q.get("country") as Country) || "all";

  const rows = useMemo(
    () =>
      ports
        .filter((p) => categoryOf(p) === "Боомт")
        .filter((p) => country === "all" || neighborCountry(p) === country)
        .sort((a, b) => a.name.localeCompare(b.name, "mn")),
    [ports, country],
  );

  const totals = useMemo(
    () =>
      Object.fromEntries(
        GOODS.map((g) => {
          let i = 0,
            e = 0;
          rows.forEach((p) => {
            const c = cellFor(p, g.id);
            if (c.import === "allowed") i++;
            if (c.export === "allowed") e++;
          });
          return [g.id, { i, e }];
        }),
      ),
    [rows],
  );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Нүүр", to: href("/") }, { label: "Бараа ба боомт" }]}
        title="Бараа нэвтрүүлэх боомтын хүснэгт"
        lead="Тусгай зөвшөөрөл, хяналт шаардсан бараа бүрийг аль боомтоор импортлох, экспортлохыг Засгийн газрын тогтоолоор тогтоосныг нэг хүснэгтэд нэгтгэв. Нүд бүрийн зүүн тал импорт, баруун тал экспорт."
        actions={
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4" aria-hidden /> Хэвлэх
          </Button>
        }
      />
      <Page>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 no-print">
          <Segmented<Country>
            label="Хил залгаа улс"
            value={country}
            onChange={(v) => setQ({ country: v === "all" ? null : v })}
            options={[
              { value: "all", label: "Бүх боомт" },
              { value: "БНХАУ", label: "БНХАУ-тай" },
              { value: "ОХУ", label: "ОХУ-тай" },
            ]}
          />
          <Legend />
        </div>

        <div className="bg-surface border border-rule rounded-[3px] overflow-auto thin-scroll max-h-[calc(100vh-220px)] print-full">
          <table className="border-collapse text-[13px] w-max min-w-full">
            <thead className="sticky top-0 z-20 bg-surface">
              <tr>
                <th className="sticky left-0 z-30 bg-surface text-left align-bottom px-3 py-2 border-b border-r border-rule min-w-[180px] font-semibold text-ink">
                  Боомт ({rows.length})
                </th>
                {GOODS.map((g) => (
                  <th key={g.id} className="align-bottom px-1.5 py-2 border-b border-rule w-[80px] font-medium">
                    <a href={href(`/goods/${g.id}`)} className="block text-ink no-underline hover:underline leading-tight text-[12.5px]">
                      {SHORT[g.id] ?? g.name}
                    </a>
                    <span className="block text-[11px] text-muted font-normal mt-1">
                      {totals[g.id].i} / {totals[g.id].e}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-paper group">
                  <th className="sticky left-0 z-10 bg-surface group-hover:bg-paper text-left font-normal px-3 py-1.5 border-b border-r border-rule-soft">
                    <a href={href(`/port/${p.id}`)} className="text-ink font-medium no-underline hover:underline">
                      {p.name}
                    </a>
                    <span className="block text-[11.5px] text-muted">
                      {p.region}
                      {neighborCountry(p) ? `, ${neighborCountry(p)}` : ""}
                    </span>
                  </th>
                  {GOODS.map((g) => {
                    const c = cellFor(p, g.id);
                    const t = `${p.name}, ${g.name}: импорт ${c.import === "allowed" ? "зөвшөөрөгдсөн" : c.import === "proposed" ? "санал" : "үгүй"}, экспорт ${c.export === "allowed" ? "зөвшөөрөгдсөн" : c.export === "proposed" ? "санал" : "үгүй"}`;
                    return (
                      <td key={g.id} className="border-b border-rule-soft px-1.5 py-1.5 text-center" title={t}>
                        <span className="inline-flex gap-1" aria-label={t}>
                          <StatusMark status={c.import} size={14} />
                          <StatusMark status={c.export} size={14} />
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-[12.5px] text-muted mt-2">
          Баганын доорх тоо: зөвшөөрөлтэй боомтын тоо (импорт / экспорт). Барааны нэр дээр дарж эрх зүйн үндэслэлийг харна.
        </p>
      </Page>
    </>
  );
}

export function GoodDetail({ id }: { id: string }) {
  const { ports } = useData();
  const [q, setQ] = useQueryState();
  const dir: Direction = q.get("dir") === "export" ? "export" : "import";
  const good = goodById(id);

  const cov = useMemo(() => coverageForGood(ports, id, dir), [ports, id, dir]);
  const regs = useMemo(() => regulationsForGood(ports, id), [ports, id]);
  const mapPorts = useMemo(() => [...cov.allowed.map((a) => a.port), ...cov.proposed.map((a) => a.port)], [cov]);

  if (!good)
    return (
      <>
        <PageHeader crumbs={[{ label: "Бараа ба боомт", to: href("/goods") }, { label: "Олдсонгүй" }]} title="Бараа олдсонгүй" />
        <Page>
          <Empty>Энэ бараа бүртгэлд алга.</Empty>
        </Page>
      </>
    );

  return (
    <>
      <PageHeader
        crumbs={[{ label: "Бараа ба боомт", to: href("/goods") }, { label: good.name }]}
        title={good.name}
        lead={good.detail}
        actions={
          <Button href={href("/", { good: id, dir: dir === "export" ? "export" : null })}>
            <MapPinned className="w-4 h-4" aria-hidden /> Зураг дээр
          </Button>
        }
      />
      <Page>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="space-y-5 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <Segmented<Direction>
                label="Чиглэл"
                value={dir}
                onChange={(v) => setQ({ dir: v === "import" ? null : v })}
                options={[
                  { value: "import", label: "Импорт" },
                  { value: "export", label: "Экспорт" },
                ]}
              />
              <span className="text-[14px] text-muted">
                {cov.allowed.length} боомтоор {dir === "import" ? "импортлох" : "экспортлох"} зөвшөөрөлтэй
              </span>
            </div>

            <Section title="Зөвшөөрөгдсөн боомт" aside={`${cov.allowed.length} боомт`}>
              {cov.allowed.length ? (
                <table className="w-full text-[14px] border-collapse">
                  <thead>
                    <tr className="text-left text-[13px] text-muted border-b border-rule">
                      <th className="py-2 pr-3 font-medium">Боомт</th>
                      <th className="py-2 pr-3 font-medium">Үндэслэл</th>
                      <th className="py-2 font-medium">Нөхцөл</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cov.allowed.map(({ port, entry }) => (
                      <tr key={port.id} className="border-b border-rule-soft align-top">
                        <td className="py-2 pr-3">
                          <a href={href(`/port/${port.id}`)} className="font-medium text-ink no-underline hover:underline">
                            {port.name}
                          </a>
                          <span className="block text-[12.5px] text-muted">{port.region}</span>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex flex-wrap gap-1.5">
                            {entry.resolutions.map((r) => (
                              <RefChip key={r} label={r} />
                            ))}
                          </div>
                        </td>
                        <td className="py-2 text-[13.5px]">
                          {entry.conditions ?? (entry.text !== good.name ? entry.text : "—")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <Empty>Энэ чиглэлд зөвшөөрөлтэй боомт бүртгэгдээгүй.</Empty>
              )}
            </Section>

            {cov.proposed.length > 0 && (
              <Section title="Нэмэх саналтай боомт" aside={`${cov.proposed.length} санал`}>
                <ul className="divide-y divide-rule-soft">
                  {cov.proposed.map(({ port, proposal }) => (
                    <li key={port.id} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <a href={href(`/port/${port.id}`)} className="font-medium text-ink no-underline hover:underline">
                          {port.name}
                        </a>
                        <RefChip label={proposal.targetResolution} />
                      </div>
                      {proposal.proposalNote && <p className="text-[13.5px] text-muted mt-1">{proposal.proposalNote}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}
          </div>

          <aside className="space-y-5">
            <Section title="Эрх зүйн үндэслэл">
              <ul className="space-y-3">
                {regs.map((rid) => {
                  const r = regulationById(rid)!;
                  return (
                    <li key={rid}>
                      <RefChip label={r.number} />
                      <p className="text-[13.5px] mt-1">{r.fullName}</p>
                      {r.legalBasis && <p className="text-[12.5px] text-muted mt-0.5">Үндэслэл: {r.legalBasis}</p>}
                    </li>
                  );
                })}
              </ul>
            </Section>
            <div className="h-[300px] border border-rule rounded-[3px] overflow-hidden no-print">
              <PortMap ports={mapPorts} selected={null} goodId={id} direction={dir} />
            </div>
          </aside>
        </div>
      </Page>
    </>
  );
}
