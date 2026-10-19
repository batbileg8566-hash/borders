import { Printer, MapPinned } from "lucide-react";
import { GOODS } from "../data";
import type { BorderCrossing } from "../types";
import { usePort } from "../lib/DataProvider";
import { href } from "../lib/router";
import { TRANSPORT_LABEL, cellFor, categoryOf, neighborCountry, proposalDirection } from "../lib/registry";
import { Button, Empty, KV, Legend, Page, PageHeader, RefChip, Section, StatusMark, fmt } from "../components/ui";
import { PortMap } from "../components/PortMap";

function GoodsTable({ port }: { port: BorderCrossing }) {
  const rows = GOODS.map((g) => ({ g, c: cellFor(port, g.id) }));
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[14px] border-collapse min-w-[560px]">
        <thead>
          <tr className="text-left text-[13px] text-muted border-b border-rule">
            <th className="py-2 pr-3 font-medium">Бараа</th>
            <th className="py-2 px-2 font-medium w-[90px]">Импорт</th>
            <th className="py-2 px-2 font-medium w-[90px]">Экспорт</th>
            <th className="py-2 pl-2 font-medium">Эрх зүйн үндэслэл, нөхцөл</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ g, c }) => {
            const refs = new Set([...(c.importEntry?.resolutions ?? []), ...(c.exportEntry?.resolutions ?? [])]);
            const conds = [c.importEntry?.conditions, c.exportEntry?.conditions].filter(Boolean);
            return (
              <tr key={g.id} className="border-b border-rule-soft align-top">
                <td className="py-2 pr-3">
                  <a href={href(`/goods/${g.id}`)} className="text-ink font-medium no-underline hover:underline">
                    {g.name}
                  </a>
                  {(c.importEntry?.text || c.exportEntry?.text) &&
                    (c.importEntry?.text ?? c.exportEntry?.text) !== g.name && (
                      <span className="block text-[12.5px] text-muted">{c.importEntry?.text ?? c.exportEntry?.text}</span>
                    )}
                </td>
                <td className="py-2 px-2">
                  <span className="inline-flex items-center gap-1.5" title={c.import}>
                    <StatusMark status={c.import} />
                  </span>
                </td>
                <td className="py-2 px-2">
                  <StatusMark status={c.export} />
                </td>
                <td className="py-2 pl-2">
                  <div className="flex flex-wrap gap-1.5">
                    {[...refs].map((r) => (
                      <RefChip key={r} label={r} />
                    ))}
                    {c.proposal && !refs.size && <RefChip label={c.proposal.targetResolution} />}
                  </div>
                  {conds.length > 0 && <p className="text-[12.5px] text-muted mt-1">{conds.join("; ")}</p>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="mt-3">
        <Legend />
      </div>
    </div>
  );
}

export function PortDetail({ id }: { id: string }) {
  const port = usePort(id);
  if (!port)
    return (
      <>
        <PageHeader crumbs={[{ label: "Нүүр", to: href("/") }, { label: "Олдсонгүй" }]} title="Нэгж олдсонгүй" />
        <Page>
          <Empty>
            «{id}» дугаартай нэгж бүртгэлд алга. <a href={href("/registry")}>Нэгдсэн бүртгэлээс</a> хайна уу.
          </Empty>
        </Page>
      </>
    );

  const cat = categoryOf(port);
  const country = neighborCountry(port);
  const dev = port.development;
  const props = port.proposedAdditions ?? [];

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Газрын зураг", to: href("/") },
          { label: cat, to: href("/", { cat: cat === "Боомт" ? null : cat }) },
          { label: port.name },
        ]}
        title={port.name}
        lead={port.description ?? `${port.region}, ${cat.toLowerCase()}`}
        actions={
          <>
            <Button href={href("/", { cat: cat === "Боомт" ? null : cat, sel: port.id })}>
              <MapPinned className="w-4 h-4" aria-hidden /> Зураг дээр
            </Button>
            <Button onClick={() => window.print()}>
              <Printer className="w-4 h-4" aria-hidden /> Хэвлэх
            </Button>
          </>
        }
      />
      <Page>
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5 min-w-0">
            {cat === "Боомт" || port.legalImports.length || port.legalExports.length ? (
              <Section
                title="Нэвтрүүлэх зөвшөөрөлтэй бараа"
                aside={`Импорт ${port.legalImports.length}, экспорт ${port.legalExports.length}`}
              >
                <GoodsTable port={port} />
              </Section>
            ) : null}

            {props.length > 0 && (
              <Section title="Нэмэх санал" aside={`${props.length} санал`}>
                <ul className="divide-y divide-rule-soft">
                  {props.map((p, i) => (
                    <li key={i} className="py-2.5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusMark status="proposed" />
                        <span className="font-medium">{p.text}</span>
                        <span className="text-[13px] text-muted">
                          ({proposalDirection(p) === "import" ? "импорт" : "экспорт"})
                        </span>
                        <RefChip label={p.targetResolution} />
                      </div>
                      {p.proposalNote && <p className="text-[13.5px] text-muted mt-1 pl-5">{p.proposalNote}</p>}
                    </li>
                  ))}
                </ul>
              </Section>
            )}

            {(port.hasLaboratory || port.labCapabilities?.length || port.customsLabInfo) && (
              <Section title="Лаборатори">
                <KV
                  rows={[
                    ["Лаборатори", port.hasLaboratory ? port.labCapacity ?? "Байгаа" : "Байхгүй"],
                    ["Гаалийн салбар лаборатори", port.customsLabInfo],
                    ["Шинжилгээ хийдэг бараа", port.testedGoodsInfo],
                  ]}
                />
                {port.labCapabilities?.length ? (
                  <ul className="mt-3 grid sm:grid-cols-2 gap-x-4 gap-y-1 text-[14px] list-disc pl-5">
                    {port.labCapabilities.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                ) : null}
              </Section>
            )}

            {dev && (
              <Section title="Бүтээн байгуулалт" aside={`Гүйцэтгэл ${dev.progress}%`}>
                <p className="font-medium text-ink">{dev.projectName}</p>
                <div className="mt-2 h-2 bg-rule-soft rounded-sm overflow-hidden" role="progressbar" aria-valuenow={dev.progress} aria-valuemin={0} aria-valuemax={100}>
                  <div className="h-full bg-ink" style={{ width: `${dev.progress}%` }} />
                </div>
                <p className="text-[14px] mt-3">{dev.description}</p>
                <div className="mt-3">
                  <KV
                    rows={[
                      ["Төсөв", dev.budget],
                      ["Гүйцэтгэгч", dev.contractor],
                    ]}
                  />
                </div>
              </Section>
            )}
          </div>

          <aside className="space-y-5">
            {(port.imageUrl || dev?.imageUrl) && (
              <figure className="border border-rule rounded-[3px] overflow-hidden bg-surface">
                <img
                  src={port.imageUrl ?? dev?.imageUrl}
                  alt={`${port.name} боомтын зураг`}
                  className="w-full aspect-[16/10] object-cover"
                  loading="lazy"
                  onError={(e) => ((e.currentTarget.parentElement as HTMLElement).style.display = "none")}
                />
              </figure>
            )}
            <Section title="Үндсэн мэдээлэл">
              <KV
                rows={[
                  ["Ангилал", port.subCategory ? `${cat}, ${port.subCategory}` : cat],
                  ["Байршил", port.region],
                  ["Хил залгаа улс", country],
                  ["Хөрш боомт", port.neighborPortName],
                  ["Ажиллагааны горим", port.operationalStatus],
                  ["Ачааллын төлөв", port.trafficStatus],
                  ["Тээврийн төрөл", port.transportTypes.map((t) => TRANSPORT_LABEL[t] ?? t).join(", ")],
                  ["Хүчин чадал", `${fmt(port.capacity)} / өдөр`],
                  ["Улаанбаатараас", `${fmt(port.ubDistance)} км`],
                  ["Аймгийн төвөөс", `${fmt(port.aimagDistance)} км`],
                ]}
              />
            </Section>
            <Section title="Дэд бүтэц, хүн хүч">
              <KV
                rows={[
                  ["Нийт талбай", port.infrastructure?.totalArea ?? (port.areaSize ? `${fmt(port.areaSize)} м²` : undefined)],
                  ["Зорчигчийн бүс", port.infrastructure?.passengerZone],
                  ["Ачааны бүс", port.infrastructure?.cargoZone],
                  ["ГУАБ", port.staffGUAB !== undefined ? fmt(port.staffGUAB) : undefined],
                  ["ГУБ", port.staffGUB !== undefined ? fmt(port.staffGUB) : undefined],
                  ["Агуулах", port.warehousesCount !== undefined ? fmt(port.warehousesCount) : undefined],
                  ["Хяналтын бүс", port.controlZonesCount !== undefined ? fmt(port.controlZonesCount) : undefined],
                ]}
              />
              {port.infrastructure?.details?.length ? (
                <ul className="mt-3 text-[13.5px] list-disc pl-5 space-y-0.5">
                  {port.infrastructure.details.map((d) => (
                    <li key={d}>{d}</li>
                  ))}
                </ul>
              ) : null}
            </Section>
            <div className="h-[240px] border border-rule rounded-[3px] overflow-hidden no-print">
              <PortMap ports={[port]} selected={port} interactive={false} />
            </div>
          </aside>
        </div>
      </Page>
    </>
  );
}
