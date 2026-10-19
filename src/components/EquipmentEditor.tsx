/**
 * Тоног төхөөрөмжийг гараар нэмэх, засах маягт ба зургийн харагдац.
 * Шинээр нэмэх, устгах нь админ; засах нь засах эрхтэй (editor) хэрэглэгчид.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Camera, ImageOff, Pencil, Plus, Trash2, X } from "lucide-react";
import { CUSTOMS_OFFICES, officeByCode } from "../data/customsOffices";
import { useData } from "../lib/DataProvider";
import { EQUIPMENT_CATEGORIES, STATUS_LABEL, useEquipment, type EquipmentItem, type ItemStatus } from "../lib/equipment";
import { Button } from "./ui";

// ─── Зураг ──────────────────────────────────────────────────────────────────

export function ItemPhoto({ path, size = 56, alt, className = "" }: { path: string | null; size?: number; alt: string; className?: string }) {
  const { photoUrl } = useEquipment();
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (path) photoUrl(path).then((u) => alive && setUrl(u));
    return () => {
      alive = false;
    };
  }, [path, photoUrl]);
  const box = { width: size, height: size };
  if (!path)
    return (
      <span style={box} className={`inline-flex items-center justify-center bg-paper border border-rule-soft rounded-[3px] text-faint shrink-0 ${className}`} aria-hidden>
        <ImageOff className="w-4 h-4" />
      </span>
    );
  return url ? (
    <a href={url} target="_blank" rel="noreferrer" className={`shrink-0 ${className}`} title="Зургийг томоор харах">
      <img src={url} alt={alt} style={box} className="object-cover rounded-[3px] border border-rule-soft bg-paper" loading="lazy" />
    </a>
  ) : (
    <span style={box} className={`inline-block bg-paper border border-rule-soft rounded-[3px] animate-pulse shrink-0 ${className}`} aria-hidden />
  );
}

// ─── Маягт ──────────────────────────────────────────────────────────────────

type Draft = {
  office_code: string;
  port_id: string;
  category: string;
  name: string;
  brand: string;
  model: string;
  purpose: string;
  capacity: string;
  origin_country: string;
  manufacture_year: string;
  qty: string;
  qty_faulty: string;
  status: ItemStatus | "";
  commissioned: string;
  cost: string;
  life_years: string;
  note: string;
  photo_path: string | null;
};

const s = (v: unknown) => (v === null || v === undefined ? "" : String(v));

function toDraft(it: Partial<EquipmentItem>, defaults: { office?: string; port?: string | null }): Draft {
  return {
    office_code: it.office_code ?? defaults.office ?? "",
    port_id: s(it.id ? it.port_id : (it.port_id ?? defaults.port)),
    category: it.category ?? EQUIPMENT_CATEGORIES[0].key,
    name: s(it.name),
    brand: s(it.brand),
    model: s(it.model),
    purpose: s(it.purpose),
    capacity: s(it.capacity),
    origin_country: s(it.origin_country),
    manufacture_year: s(it.manufacture_year),
    qty: s(it.qty ?? 1),
    qty_faulty: s(it.qty_faulty),
    status: it.status ?? (it.id ? "" : "ok"),
    commissioned: s(it.commissioned),
    cost: s(it.cost),
    life_years: s(it.life_years),
    note: s(it.note),
    photo_path: it.photo_path ?? null,
  };
}

const num = (v: string) => {
  const n = Number(v.replace(/\s/g, "").replace(",", "."));
  return v.trim() === "" || !Number.isFinite(n) ? null : n;
};

function fromDraft(d: Draft): Partial<EquipmentItem> {
  const qty = num(d.qty) ?? 1;
  let faulty = num(d.qty_faulty);
  if (d.status === "faulty" && !faulty) faulty = qty;
  if (d.status === "ok") faulty = 0;
  const life = num(d.life_years);
  const year = d.commissioned ? Number(d.commissioned.slice(0, 4)) : null;
  return {
    office_code: d.office_code,
    port_id: d.port_id || null,
    category: d.category,
    name: d.name.trim(),
    brand: d.brand.trim() || null,
    model: d.model.trim() || null,
    purpose: d.purpose.trim() || null,
    capacity: d.capacity.trim() || null,
    origin_country: d.origin_country.trim() || null,
    manufacture_year: num(d.manufacture_year),
    qty,
    qty_faulty: faulty,
    qty_ok: faulty === null ? null : Math.max(0, qty - faulty),
    status: (d.status || null) as ItemStatus | null,
    commissioned: d.commissioned || null,
    cost: num(d.cost),
    life_years: life,
    remaining_years: life !== null && year ? Math.max(0, life - (new Date().getFullYear() - year)) : null,
    note: d.note.trim() || null,
  };
}

const inputCls = "w-full h-9 px-2.5 bg-surface border border-rule rounded-[3px] text-[14px] focus:border-ink outline-none";

function Field({ label, children, wide, hint }: { label: string; children: ReactNode; wide?: boolean; hint?: string }) {
  return (
    <label className={`block ${wide ? "sm:col-span-2" : ""}`}>
      <span className="block text-[13px] text-muted mb-1">{label}</span>
      {children}
      {hint && <span className="block text-[12px] text-faint mt-0.5">{hint}</span>}
    </label>
  );
}

export function EquipmentForm({
  item,
  office,
  port,
  onClose,
}: {
  item?: EquipmentItem;
  office?: string;
  port?: string | null;
  onClose: () => void;
}) {
  const { saveItem, deleteItem, isAdmin } = useEquipment();
  const { ports } = useData();
  const ref = useRef<HTMLDialogElement>(null);
  const [d, setD] = useState<Draft>(() => toDraft(item ?? {}, { office, port }));
  const [photo, setPhoto] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((p) => ({ ...p, [k]: v }));
  const off = officeByCode(d.office_code);
  const portName = (id: string) => ports.find((p) => p.id === id)?.name ?? id;

  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    if (!photo) return setPreview(null);
    const u = URL.createObjectURL(photo);
    setPreview(u);
    return () => URL.revokeObjectURL(u);
  }, [photo]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.office_code) return setErr("Гаалийн газраа сонгоно уу.");
    if (!d.name.trim()) return setErr("Нэрийг оруулна уу.");
    const year = num(d.manufacture_year);
    if (year !== null && (year < 1950 || year > new Date().getFullYear())) return setErr("Үйлдвэрлэсэн он буруу байна.");
    const qty = num(d.qty) ?? 0;
    const f = num(d.qty_faulty) ?? 0;
    if (qty <= 0) return setErr("Тоо ширхэг 0-ээс их байна.");
    if (f < 0 || f > qty) return setErr("Хэвийн бус тоо нийт тооноос их, эсвэл сөрөг байж болохгүй.");
    setBusy(true);
    setErr(null);
    const res = await saveItem({ ...fromDraft(d), ...(item ? { id: item.id } : {}) }, photo);
    setBusy(false);
    if (res) setErr(res);
    else onClose();
  };

  const remove = async () => {
    if (!item || !window.confirm(`«${item.name}»-г бүртгэлээс бүрмөсөн устгах уу?`)) return;
    setBusy(true);
    const res = await deleteItem(item.id);
    setBusy(false);
    if (res) setErr(res);
    else onClose();
  };

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className="m-auto w-[min(760px,calc(100vw-24px))] max-h-[calc(100vh-24px)] p-0 rounded-[4px] border border-rule bg-surface text-text backdrop:bg-ink/40"
      aria-labelledby="eq-form-title"
    >
      <form onSubmit={submit} className="flex flex-col max-h-[calc(100vh-24px)]">
        <header className="flex items-center justify-between gap-3 px-5 py-3 border-b border-rule bg-paper">
          <h2 id="eq-form-title" className="text-[17px]">
            {item ? "Тоног төхөөрөмж засах" : "Тоног төхөөрөмж нэмэх"}
          </h2>
          <button type="button" onClick={() => ref.current?.close()} className="p-1 text-muted hover:text-ink" aria-label="Хаах">
            <X className="w-5 h-5" />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-4 space-y-5">
          <fieldset className="grid sm:grid-cols-2 gap-3">
            <legend className="text-[13px] font-semibold text-ink mb-2">Байршил</legend>
            <Field label="Гаалийн газар, хороо">
              <select className={inputCls} value={d.office_code} disabled={!!item || !!office} onChange={(e) => setD((p) => ({ ...p, office_code: e.target.value, port_id: officeByCode(e.target.value)?.primaryUnit ?? "" }))} required>
                <option value="">Сонгох</option>
                {CUSTOMS_OFFICES.filter((o) => o.code !== "ГЕГ").map((o) => (
                  <option key={o.code} value={o.code}>
                    {o.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Боомт, нэгж" hint={off && !off.primaryUnit ? "Аймгийн газарт хамаарах бол «Газрын түвшинд» сонгоно." : undefined}>
              <select className={inputCls} value={d.port_id} onChange={(e) => set("port_id", e.target.value)} disabled={!off}>
                <option value="">Газрын түвшинд</option>
                {off?.units.map((u) => (
                  <option key={u} value={u}>
                    {portName(u)}
                  </option>
                ))}
              </select>
            </Field>
          </fieldset>

          <fieldset className="grid sm:grid-cols-2 gap-3">
            <legend className="text-[13px] font-semibold text-ink mb-2">Тодорхойлолт</legend>
            <Field label="Нэр *" wide>
              <input className={inputCls} value={d.name} onChange={(e) => set("name", e.target.value)} required placeholder="Жишээ: Зорчигчийн ачаа тээш шалгах рентген" />
            </Field>
            <Field label="Ангилал">
              <select className={inputCls} value={d.category} onChange={(e) => set("category", e.target.value)}>
                {EQUIPMENT_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.short}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Брэнд, үйлдвэрлэгч">
              <input className={inputCls} value={d.brand} onChange={(e) => set("brand", e.target.value)} placeholder="Nuctech, Rapiscan…" />
            </Field>
            <Field label="Загвар, марк">
              <input className={inputCls} value={d.model} onChange={(e) => set("model", e.target.value)} placeholder="CX100100D" />
            </Field>
            <Field label="Хүчин чадал">
              <input className={inputCls} value={d.capacity} onChange={(e) => set("capacity", e.target.value)} placeholder="Туннель 100×100 см, 200 ачаа/цаг" />
            </Field>
            <Field label="Үйлдвэрлэсэн улс">
              <input className={inputCls} value={d.origin_country} onChange={(e) => set("origin_country", e.target.value)} list="eq-countries" />
              <datalist id="eq-countries">
                {["БНХАУ", "АНУ", "ОХУ", "Герман", "Япон", "БНСУ", "Их Британи", "Франц", "Итали", "Финланд", "Израиль"].map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </Field>
            <Field label="Үйлдвэрлэсэн он">
              <input className={inputCls} value={d.manufacture_year} onChange={(e) => set("manufacture_year", e.target.value)} inputMode="numeric" placeholder="2024" />
            </Field>
            <Field label="Зориулалт" wide>
              <textarea className={`${inputCls} h-auto py-2 min-h-[64px]`} value={d.purpose} onChange={(e) => set("purpose", e.target.value)} placeholder="Юунд ашигладаг, ямар хяналтын ажилд" />
            </Field>
          </fieldset>

          <fieldset className="grid sm:grid-cols-2 gap-3">
            <legend className="text-[13px] font-semibold text-ink mb-2">Тоо, ажиллагаа</legend>
            <Field label="Тоо ширхэг *">
              <input className={inputCls} value={d.qty} onChange={(e) => set("qty", e.target.value)} inputMode="numeric" required />
            </Field>
            <Field label="Ажиллагааны төлөв">
              <select className={inputCls} value={d.status} onChange={(e) => set("status", e.target.value as ItemStatus | "")}>
                <option value="">Тодорхойгүй</option>
                {(Object.keys(STATUS_LABEL) as ItemStatus[]).map((k) => (
                  <option key={k} value={k}>
                    {STATUS_LABEL[k]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Үүнээс хэвийн бус тоо" hint="Хэвийн гэвэл 0, эвдэрсэн гэвэл нийт тоо автоматаар бичигдэнэ.">
              <input className={inputCls} value={d.qty_faulty} onChange={(e) => set("qty_faulty", e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Ашиглалтад орсон огноо">
              <input type="date" className={inputCls} value={d.commissioned} onChange={(e) => set("commissioned", e.target.value)} />
            </Field>
            <Field label="Анхны өртөг, ₮">
              <input className={inputCls} value={d.cost} onChange={(e) => set("cost", e.target.value)} inputMode="decimal" />
            </Field>
            <Field label="Ашиглалтын хугацаа, жил">
              <input className={inputCls} value={d.life_years} onChange={(e) => set("life_years", e.target.value)} inputMode="numeric" />
            </Field>
            <Field label="Тайлбар" wide>
              <textarea className={`${inputCls} h-auto py-2 min-h-[56px]`} value={d.note} onChange={(e) => set("note", e.target.value)} />
            </Field>
          </fieldset>

          <fieldset>
            <legend className="text-[13px] font-semibold text-ink mb-2">Зураг</legend>
            <div className="flex items-center gap-4">
              {preview ? (
                <img src={preview} alt="Шинэ зураг" className="w-24 h-24 object-cover rounded-[3px] border border-rule-soft" />
              ) : (
                <ItemPhoto path={d.photo_path} size={96} alt={d.name || "Тоног төхөөрөмж"} />
              )}
              <div className="space-y-1">
                <label className="inline-flex items-center gap-1.5 h-9 px-3 border border-rule rounded-[3px] text-[14px] cursor-pointer hover:border-ink bg-surface">
                  <Camera className="w-4 h-4" aria-hidden />
                  {d.photo_path || photo ? "Зураг солих" : "Зураг сонгох"}
                  <input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="sr-only" onChange={(e) => setPhoto(e.target.files?.[0] ?? null)} />
                </label>
                <p className="text-[12px] text-faint">JPG, PNG. Хадгалахдаа 1600px хүртэл багасгана. Зөвхөн эрхтэй хэрэглэгч харна.</p>
              </div>
            </div>
          </fieldset>
        </div>

        <footer className="flex flex-wrap items-center gap-2 px-5 py-3 border-t border-rule bg-paper">
          {item && isAdmin && (
            <button type="button" onClick={remove} disabled={busy} className="inline-flex items-center gap-1 text-[13.5px] text-flag hover:underline mr-auto">
              <Trash2 className="w-4 h-4" aria-hidden /> Устгах
            </button>
          )}
          {err && (
            <p className="text-[13px] text-flag basis-full order-first" role="alert">
              {err}
            </p>
          )}
          <span className="ml-auto" />
          <Button onClick={() => ref.current?.close()}>Болих</Button>
          <Button type="submit" variant="primary" disabled={busy}>
            {busy ? "Хадгалж байна…" : "Хадгалах"}
          </Button>
        </footer>
      </form>
    </dialog>
  );
}

/** «Нэмэх» товч — админд харагдана. */
export function AddEquipmentButton({ office, port, label = "Тоног төхөөрөмж нэмэх" }: { office?: string; port?: string | null; label?: string }) {
  const { isAdmin } = useEquipment();
  const [open, setOpen] = useState(false);
  if (!isAdmin) return null;
  return (
    <>
      <Button onClick={() => setOpen(true)} variant="primary">
        <Plus className="w-4 h-4" aria-hidden /> {label}
      </Button>
      {open && <EquipmentForm office={office} port={port} onClose={() => setOpen(false)} />}
    </>
  );
}

/** Мөр бүрийн «Засах» товч — засах эрхтэй хэрэглэгчид харагдана. */
export function EditEquipmentButton({ item }: { item: EquipmentItem }) {
  const { canEdit } = useEquipment();
  const [open, setOpen] = useState(false);
  if (!canEdit) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} className="inline-flex items-center gap-1 text-[12.5px] text-azure hover:underline" aria-label={`${item.name} засах`}>
        <Pencil className="w-3.5 h-3.5" aria-hidden /> Засах
      </button>
      {open && <EquipmentForm item={item} onClose={() => setOpen(false)} />}
    </>
  );
}
