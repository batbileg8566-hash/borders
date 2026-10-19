import type { ReactNode } from "react";
import { href } from "../lib/router";
import { resolveRef, type CellStatus } from "../lib/registry";

/** Тогтоолын лавлагаа. Танигдсан бол тухайн актын хуудас руу холбоно. */
export function RefChip({ label }: { label: string }) {
  const ref = resolveRef(label);
  if (!ref.id) return <span className="ref-chip">{label}</span>;
  return (
    <a
      className="ref-chip"
      data-amend={ref.isAmendment}
      href={href(`/acts/${encodeURIComponent(ref.id)}`)}
      title={ref.isAmendment ? "Үндсэн тогтоолд оруулсан нэмэлт, өөрчлөлт" : "Эрх зүйн актыг харах"}
    >
      {ref.label}
    </a>
  );
}

const STATUS_TEXT: Record<CellStatus, string> = {
  allowed: "Зөвшөөрөгдсөн",
  proposed: "Нэмэх санал",
  none: "Зөвшөөрөгдөөгүй",
};

/** Төлөвийн тэмдэг — өнгөнөөс гадна хэлбэрээр ялгана (дүүрэн / хагас / хоосон). */
export function StatusMark({ status, size = 12 }: { status: CellStatus; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 12 12", "aria-hidden": true, style: { display: "inline-block", verticalAlign: "middle" } } as const;
  if (status === "allowed")
    return (
      <svg {...common}>
        <rect x="1" y="1" width="10" height="10" rx="1" fill="var(--color-allowed)" />
      </svg>
    );
  if (status === "proposed")
    return (
      <svg {...common}>
        <rect x="1.5" y="1.5" width="9" height="9" rx="1" fill="none" stroke="var(--color-proposed)" strokeWidth="1.5" />
        <path d="M1.5 10.5 L10.5 1.5 L10.5 10.5 Z" fill="var(--color-proposed)" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="2" y="2" width="8" height="8" rx="1" fill="none" stroke="var(--color-none)" strokeWidth="1.2" />
    </svg>
  );
}

export function StatusLabel({ status }: { status: CellStatus }) {
  const cls =
    status === "allowed"
      ? "text-allowed bg-allowed-bg"
      : status === "proposed"
        ? "text-proposed bg-proposed-bg"
        : "text-muted bg-rule-soft";
  return (
    <span className={`inline-flex items-center gap-1.5 px-1.5 py-px text-xs font-medium rounded-sm ${cls}`}>
      <StatusMark status={status} size={10} />
      {STATUS_TEXT[status]}
    </span>
  );
}

export function Legend() {
  return (
    <div className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-muted">
      {(["allowed", "proposed", "none"] as CellStatus[]).map((s) => (
        <span key={s} className="inline-flex items-center gap-1.5">
          <StatusMark status={s} />
          {STATUS_TEXT[s]}
        </span>
      ))}
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  crumbs,
  title,
  lead,
  actions,
}: {
  crumbs: Crumb[];
  title: ReactNode;
  lead?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="border-b border-rule bg-surface">
      <div className="mx-auto max-w-[1280px] px-4 md:px-8 pt-4 pb-5">
        <nav aria-label="Байршил" className="text-[13px] text-muted mb-2 no-print">
          <ol className="flex flex-wrap items-center gap-1">
            {crumbs.map((c, i) => (
              <li key={i} className="flex items-center gap-1">
                {i > 0 && <span aria-hidden className="text-faint">/</span>}
                {c.to ? (
                  <a href={c.to} className="text-muted hover:text-azure no-underline hover:underline">
                    {c.label}
                  </a>
                ) : (
                  <span aria-current="page" className="text-text">{c.label}</span>
                )}
              </li>
            ))}
          </ol>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-[26px] md:text-[30px] leading-tight">{title}</h1>
            {lead && <p className="mt-1.5 text-muted max-w-[72ch]">{lead}</p>}
          </div>
          {actions && <div className="flex gap-2 no-print">{actions}</div>}
        </div>
      </div>
    </header>
  );
}

export function Page({ children }: { children: ReactNode }) {
  return <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-6">{children}</div>;
}

export function Section({
  title,
  aside,
  children,
  id,
}: {
  title: string;
  aside?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className="bg-surface border border-rule rounded-[3px] break-inside-avoid">
      <div className="flex items-baseline justify-between gap-3 px-4 md:px-5 py-3 border-b border-rule-soft">
        <h2 className="text-[17px]">{title}</h2>
        {aside && <div className="text-[13px] text-muted">{aside}</div>}
      </div>
      <div className="px-4 md:px-5 py-4">{children}</div>
    </section>
  );
}

export function KV({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[minmax(120px,40%)_1fr] text-[14px]">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="py-1.5 pr-3 text-muted border-b border-rule-soft">{k}</dt>
          <dd className="py-1.5 border-b border-rule-soft text-text">{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-muted text-[14px] py-2">{children}</p>;
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto no-scrollbar border border-ink rounded-[3px]">
      {options.map((o) => (
        <button
          key={o.value}
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`px-3 py-1 text-[13px] font-medium whitespace-nowrap border-l border-ink first:border-l-0 ${
            value === o.value ? "bg-ink text-white" : "bg-surface text-ink hover:bg-paper"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Button({
  children,
  onClick,
  href: to,
  variant = "secondary",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  variant?: "primary" | "secondary";
  title?: string;
}) {
  const cls = `inline-flex items-center gap-2 px-3 h-9 text-[14px] font-medium rounded-[3px] border no-underline ${
    variant === "primary"
      ? "bg-ink border-ink text-white hover:bg-ink-2"
      : "bg-surface border-rule text-ink hover:border-ink"
  }`;
  if (to)
    return (
      <a href={to} className={cls} title={title}>
        {children}
      </a>
    );
  return (
    <button onClick={onClick} className={cls} title={title}>
      {children}
    </button>
  );
}

export const fmt = (n?: number) => (n === undefined || n === null ? "—" : n.toLocaleString("mn-MN"));
