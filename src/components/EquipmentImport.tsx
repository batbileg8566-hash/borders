import { useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { useEquipment } from "../lib/equipment";
import { parseBudget, parseInventory, replaceBudget, replaceInventory, type NewBudget, type NewItem, type ParseReport } from "../lib/equipmentImport";
import { officeByCode } from "../data/customsOffices";
import { Section, fmt } from "./ui";

const INV_SOURCE = "Тоног төхөөрөмж судалгаа СХОГ 07.03";
const BUD_SOURCE = "20260720 - ХО - Төсвийн төсөл 2027";

function FilePick({ label, onPick, busy }: { label: string; onPick: (f: File) => void; busy: boolean }) {
  return (
    <label className="inline-flex items-center gap-2 h-9 px-3 border border-ink text-ink rounded-[3px] text-[14px] font-medium cursor-pointer hover:bg-paper">
      {busy ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> : <Upload className="w-4 h-4" aria-hidden />}
      {label}
      <input
        type="file"
        accept=".xlsx,.xls"
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onPick(f);
          e.target.value = "";
        }}
      />
    </label>
  );
}

export function EquipmentImport() {
  const { items, reload } = useEquipment();
  const [inv, setInv] = useState<ParseReport<NewItem> | null>(null);
  const [bud, setBud] = useState<ParseReport<NewBudget> | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (what: string, fn: () => Promise<void>) => {
    setBusy(what);
    setMsg(null);
    try {
      await fn();
    } catch (e: any) {
      setMsg({ ok: false, text: e?.message ?? String(e) });
    } finally {
      setBusy(null);
    }
  };

  const mismatches = inv?.checks.filter((c) => c.sheetQty !== null && (c.sheetQty !== c.qty || c.sheetFaulty !== c.faulty)) ?? [];

  return (
    <div className="space-y-5">
      <p className="text-[14px] text-muted max-w-[78ch]">
        Excel файлыг таны хөтөч дотор задлаад, зөвхөн задалсан мөрүүдийг хамгаалалттай сан руу бичнэ. Файл өөрөө хаана ч хадгалагдахгүй. Ижил эх
        сурвалжийн хуучин мөрүүд шинээр солигдох ба боомтод хуваарилсан мөрүүдийн хуваарилалт хадгалагдана.
      </p>

      <Section title="Одоо байгаа тоног төхөөрөмж" aside="«Тоног төхөөрөмж судалгаа СХОГ» файл">
        <div className="space-y-3">
          <FilePick label="Файл сонгох" busy={busy === "inv-parse"} onPick={(f) => run("inv-parse", async () => setInv(await parseInventory(f)))} />
          {inv && (
            <div className="space-y-2 text-[14px]">
              <p>
                <strong>{fmt(inv.rows.length)}</strong> мөр, <strong>{fmt(inv.rows.reduce((s, r) => s + r.qty, 0))}</strong> ширхэг,{" "}
                {fmt(inv.rows.reduce((s, r) => s + (r.qty_faulty || 0), 0))} хэвийн бус, {inv.checks.length} газар.
              </p>
              {mismatches.length === 0 ? (
                <p className="text-allowed">Газар бүрийн тоо, хэвийн бусын дүн файлын «Нийт» мөртэй таарч байна.</p>
              ) : (
                <ul className="text-proposed list-disc pl-5">
                  {mismatches.map((m) => (
                    <li key={m.office}>
                      {officeByCode(m.office)?.name ?? m.office}: файлд {m.sheetQty} ш / {m.sheetFaulty} хэвийн бус, задалсан {m.qty} ш / {m.faulty}
                    </li>
                  ))}
                </ul>
              )}
              {inv.warnings.length > 0 && <p className="text-proposed">Анхааруулга: {inv.warnings.slice(0, 5).join("; ")}</p>}
              <button
                disabled={!!busy}
                onClick={() =>
                  run("inv-save", async () => {
                    if (!confirm(`Санд байгаа «${INV_SOURCE}» эх сурвалжийн мөрүүдийг ${inv.rows.length} шинэ мөрөөр солих уу?`)) return;
                    const r = await replaceInventory(inv.rows, items, INV_SOURCE);
                    setMsg({ ok: true, text: `${fmt(r.inserted)} мөр хадгаллаа; ${r.keptAssignments} мөрийн боомтын хуваарилалт хадгалагдсан.` });
                    setInv(null);
                    reload();
                  })
                }
                className="h-9 px-4 bg-ink text-white rounded-[3px] text-[14px] font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {busy === "inv-save" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Санд хадгалах
              </button>
            </div>
          )}
        </div>
      </Section>

      <Section title="2027 оны төсвийн санал" aside="«Төсвийн төсөл 2027» файл">
        <div className="space-y-3">
          <FilePick label="Файл сонгох" busy={busy === "bud-parse"} onPick={(f) => run("bud-parse", async () => setBud(await parseBudget(f)))} />
          {bud && (
            <div className="space-y-2 text-[14px]">
              <p>
                <strong>{bud.rows.filter((r) => !r.is_group).length}</strong> арга хэмжээ, нийт{" "}
                <strong>{fmt(Math.round(bud.rows.filter((r) => !r.is_group).reduce((s, r) => s + (r.cost_mnt_m || 0), 0) * 10) / 10)}</strong> сая ₮.
              </p>
              {bud.warnings.length > 0 && <p className="text-proposed">{bud.warnings.join("; ")}</p>}
              <button
                disabled={!!busy}
                onClick={() =>
                  run("bud-save", async () => {
                    if (!confirm(`Санд байгаа төсвийн саналыг ${bud.rows.length} шинэ мөрөөр солих уу?`)) return;
                    const r = await replaceBudget(bud.rows, BUD_SOURCE);
                    setMsg({ ok: true, text: `Төсвийн ${r.inserted} мөр хадгаллаа.` });
                    setBud(null);
                    reload();
                  })
                }
                className="h-9 px-4 bg-ink text-white rounded-[3px] text-[14px] font-medium disabled:opacity-50 inline-flex items-center gap-2"
              >
                {busy === "bud-save" && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Санд хадгалах
              </button>
            </div>
          )}
        </div>
      </Section>

      {msg && <p className={`text-[14px] ${msg.ok ? "text-allowed" : "text-flag"}`}>{msg.text}</p>}
    </div>
  );
}
