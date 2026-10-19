import { useEffect, useRef, useState, type ReactNode } from "react";
import { Search, MessageSquare } from "lucide-react";
import { SITE } from "../config/site";
import { href, navigate } from "../lib/router";
import { search, type SearchHit } from "../lib/registry";
import { useData } from "../lib/DataProvider";

export const NAV = [
  { key: "map", path: "/", label: "Газрын зураг" },
  { key: "goods", path: "/goods", label: "Бараа ба боомт" },
  { key: "acts", path: "/acts", label: "Эрх зүйн акт" },
  { key: "proposals", path: "/proposals", label: "Нэмэх санал" },
  { key: "registry", path: "/registry", label: "Нэгдсэн бүртгэл" },
] as const;

export type NavKey = (typeof NAV)[number]["key"] | "about";

function Emblem() {
  // Төрийн бэлгэ тэмдэг биш — хил, боомтыг илэрхийлсэн энгийн тэмдэг
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
      <rect x="0.5" y="0.5" width="33" height="33" rx="2" fill="var(--color-ink)" />
      <path d="M8 25 V12 l9 -4 l9 4 V25" fill="none" stroke="#fff" strokeWidth="1.8" />
      <path d="M13 25 v-7 h8 v7" fill="none" stroke="#fff" strokeWidth="1.8" />
      <rect x="8" y="27" width="18" height="2" fill="var(--color-flag)" />
    </svg>
  );
}

const KIND_LABEL: Record<SearchHit["kind"], string> = {
  port: "Нэгж",
  good: "Бараа",
  regulation: "Акт",
};

function hitHref(h: SearchHit) {
  if (h.kind === "port") return href(`/port/${h.id}`);
  if (h.kind === "good") return href(`/goods/${h.id}`);
  return href(`/acts/${encodeURIComponent(h.id)}`);
}

function GlobalSearch() {
  const { ports } = useData();
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const hits = search(ports, q);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const go = (h: SearchHit) => {
    window.location.hash = hitHref(h).slice(1);
    setQ("");
    setOpen(false);
  };

  return (
    <div ref={box} className="relative w-full md:w-[340px]">
      <label className="sr-only" htmlFor="global-search">
        Боомт, бараа, тогтоол хайх
      </label>
      <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/60" aria-hidden />
      <input
        id="global-search"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, hits.length - 1));
          if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
          if (e.key === "Enter" && hits[active]) go(hits[active]);
          if (e.key === "Escape") setOpen(false);
        }}
        placeholder="Боомт, бараа, тогтоол хайх"
        className="w-full h-9 pl-9 pr-3 rounded-[3px] bg-white/10 border border-white/25 text-white placeholder:text-white/60 text-[14px] focus:bg-white focus:text-text focus:placeholder:text-faint outline-none"
        role="combobox"
        aria-expanded={open && hits.length > 0}
        aria-controls="search-results"
        autoComplete="off"
      />
      {open && q.trim().length >= 2 && (
        <ul
          id="search-results"
          role="listbox"
          className="absolute z-[2000] mt-1 w-full bg-surface border border-rule rounded-[3px] shadow-[0_8px_24px_rgba(20,50,90,0.14)] max-h-[360px] overflow-auto thin-scroll"
        >
          {hits.length === 0 && <li className="px-3 py-2.5 text-[14px] text-muted">Илэрц олдсонгүй</li>}
          {hits.map((h, i) => (
            <li key={`${h.kind}-${h.id}`} role="option" aria-selected={i === active}>
              <a
                href={hitHref(h)}
                onClick={() => {
                  setQ("");
                  setOpen(false);
                }}
                onMouseEnter={() => setActive(i)}
                className={`flex items-baseline gap-3 px-3 py-2 no-underline text-text ${i === active ? "bg-paper" : ""}`}
              >
                <span className="w-12 shrink-0 text-[12px] text-muted">{KIND_LABEL[h.kind]}</span>
                <span className="min-w-0">
                  <span className="block text-[14px] font-medium truncate">{h.title}</span>
                  <span className="block text-[12px] text-muted truncate">{h.subtitle}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Shell({
  current,
  children,
  fullBleed,
  onOpenChat,
  onOpenAdmin,
}: {
  current: NavKey;
  children: ReactNode;
  fullBleed?: boolean;
  onOpenChat: () => void;
  onOpenAdmin: () => void;
}) {
  return (
    <div className={`flex flex-col ${fullBleed ? "h-full" : "min-h-full"}`}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-[3000] focus:bg-white focus:p-2">
        Үндсэн агуулга руу шилжих
      </a>

      {/* Байгууллагын мөр */}
      <div className="bg-ink-2 text-white/80 text-[12px] no-print">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 h-7 flex items-center justify-between gap-4">
          <span>{SITE.agency}</span>
          <span className="flex items-center gap-4">
            <span className="hidden sm:inline">Мэдээллийн хугацаа: {SITE.dataAsOf}</span>
            <button onClick={onOpenAdmin} className="hover:text-white underline-offset-2 hover:underline">
              Өгөгдөл засах
            </button>
          </span>
        </div>
      </div>

      <header className="bg-ink text-white shrink-0 relative z-[1100]">
        <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-3 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
          <a href={href("/")} className="flex items-center gap-3 no-underline text-white min-w-0 mr-auto">
            <Emblem />
            <span className="min-w-0">
              <span className="block font-serif text-[18px] md:text-[19px] font-bold leading-tight">{SITE.shortSystem}</span>
              <span className="block text-[12px] text-white/70 leading-tight truncate">{SITE.system}</span>
            </span>
          </a>
          <div className="flex items-center gap-2 no-print">
            <GlobalSearch />
            <button
              onClick={onOpenChat}
              className="h-9 px-3 shrink-0 inline-flex items-center gap-2 rounded-[3px] border border-white/25 text-[14px] hover:bg-white/10"
              title="Өгөгдлөөс асуулт асуух"
            >
              <MessageSquare className="w-4 h-4" aria-hidden />
              <span className="hidden lg:inline">Туслах</span>
            </button>
          </div>
        </div>
        <nav aria-label="Үндсэн цэс" className="border-t border-white/10 no-print">
          <ul className="mx-auto max-w-[1280px] px-2 md:px-6 flex overflow-x-auto no-scrollbar">
            {NAV.map((n) => {
              const on = current === n.key;
              return (
                <li key={n.key}>
                  <a
                    href={href(n.path)}
                    aria-current={on ? "page" : undefined}
                    className={`block whitespace-nowrap px-3 py-2.5 text-[14px] no-underline border-b-[3px] ${
                      on ? "border-flag text-white font-semibold" : "border-transparent text-white/75 hover:text-white"
                    }`}
                  >
                    {n.label}
                  </a>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      <main id="main" className={fullBleed ? "flex-1 min-h-0 relative" : "flex-1"}>
        {children}
      </main>

      {!fullBleed && (
        <footer className="border-t border-rule bg-surface mt-8 text-[13px] text-muted">
          <div className="mx-auto max-w-[1280px] px-4 md:px-8 py-6 grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="space-y-1.5 max-w-[78ch]">
              <p className="text-text font-medium">{SITE.system}</p>
              <p>{SITE.sourcesNote}</p>
              <p>{SITE.status}</p>
            </div>
            <div className="flex md:flex-col gap-x-4 gap-y-1.5 md:items-end no-print">
              <a href={href("/about")}>Эх сурвалж ба аргачлал</a>
              <a href="https://legalinfo.mn" target="_blank" rel="noreferrer">
                Эрх зүйн нэгдсэн систем
              </a>
              <button onClick={onOpenAdmin} className="text-muted hover:text-azure text-left">
                Өгөгдөл засах (эрхтэй хэрэглэгч)
              </button>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export { navigate };
