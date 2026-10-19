import { useEffect, useMemo, useRef, useState } from "react";
import { Send, X, Loader2 } from "lucide-react";
import type { BorderCrossing } from "../types";
import { useData } from "../lib/DataProvider";
import { categoryOf } from "../lib/registry";
import { GOODS } from "../data";

interface Message {
  role: "user" | "model";
  text: string;
}

/** Мэдээллийн санг загварт ойлгомжтой, товч мөр болгон хувиргана. */
function buildContext(ports: BorderCrossing[]) {
  const goodName = (id: string) => GOODS.find((g) => g.id === id)?.name ?? id;
  const entry = (e: { goodId: string; resolutions: string[]; conditions?: string }) =>
    `${goodName(e.goodId)} [${e.resolutions.join(", ")}]${e.conditions ? ` (${e.conditions})` : ""}`;
  return ports
    .map((b) => {
      const parts = [
        `${categoryOf(b)}${b.subCategory ? ` / ${b.subCategory}` : ""}: ${b.name}`,
        `Байршил: ${b.region}${b.neighborPortName ? `, хөрш: ${b.neighborPortName}` : ""}`,
        `Горим: ${b.operationalStatus}, тээвэр: ${b.transportTypes.join(", ")}`,
        `Лаборатори: ${b.hasLaboratory ? b.labCapabilities?.join(", ") || "тийм" : "үгүй"}`,
        `Импорт: ${b.legalImports?.map(entry).join("; ") || "—"}`,
        `Экспорт: ${b.legalExports?.map(entry).join("; ") || "—"}`,
        `Нэмэх санал: ${b.proposedAdditions?.map((p) => `${p.text} → ${p.targetResolution}`).join("; ") || "—"}`,
      ];
      return parts.join(". ");
    })
    .join("\n");
}

const SUGGESTIONS = [
  "Эм, эмнэлгийн хэрэгслийг аль боомтоор импортлох вэ?",
  "Тэсэрч дэлбэрэх бодис нэвтрүүлэх боомтууд",
  "Лабораторигүй ч мал, амьтан нэвтрүүлдэг боомт бий юу?",
];

export function ChatPanel({ focus, onClose }: { focus: BorderCrossing | null; onClose: () => void }) {
  const { ports } = useData();
  const context = useMemo(() => buildContext(ports), [ports]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages, loading]);

  useEffect(() => {
    inputRef.current?.focus();
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  const send = async (text: string) => {
    const t = text.trim();
    if (!t || loading) return;
    const next = [...messages, { role: "user" as const, text: t }];
    setMessages(next);
    setInput("");
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next, context, focus: focus?.name ?? "" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || `Сервер ${res.status} алдаа буцаалаа.`);
      setMessages((m) => [...m, { role: "model", text: data.text || "Хариулт хоосон ирлээ." }]);
    } catch (e: any) {
      setError(e?.message || "Туслахтай холбогдож чадсангүй.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2500] flex justify-end no-print" role="dialog" aria-modal="true" aria-label="Мэдээллийн туслах">
      <button className="absolute inset-0 bg-ink-2/30" onClick={onClose} aria-label="Хаах" />
      <div className="relative w-full sm:w-[420px] h-full bg-surface border-l border-rule flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between bg-ink text-white shrink-0">
          <div>
            <p className="font-serif font-bold text-[16px] leading-tight">Мэдээллийн туслах</p>
            <p className="text-[12px] text-white/70 leading-tight">Зөвхөн энэ сангийн өгөгдлөөр хариулна</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-[3px] hover:bg-white/10" aria-label="Хаах">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-auto thin-scroll px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-3">
              <p className="text-[14px] text-muted">
                Бараа, боомт, тогтоолын талаар асууна уу.{focus ? ` Одоо «${focus.name}» нэгжийг харж байна.` : ""}
              </p>
              <ul className="space-y-2">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <button
                      onClick={() => send(s)}
                      className="w-full text-left text-[14px] px-3 py-2 border border-rule rounded-[3px] hover:border-ink text-ink"
                    >
                      {s}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={m.role === "user" ? "flex justify-end" : ""}>
              <div
                className={`max-w-[88%] text-[14px] whitespace-pre-wrap px-3 py-2 rounded-[3px] ${
                  m.role === "user" ? "bg-ink text-white" : "bg-paper border border-rule-soft text-text"
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {loading && (
            <p className="flex items-center gap-2 text-[13px] text-muted">
              <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Хариулт бэлтгэж байна
            </p>
          )}
          {error && <p className="text-[13px] text-flag border border-flag/30 bg-flag/5 px-3 py-2 rounded-[3px]">{error}</p>}
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="p-3 border-t border-rule flex gap-2 shrink-0"
        >
          <label htmlFor="chat-input" className="sr-only">
            Асуулт
          </label>
          <textarea
            id="chat-input"
            ref={inputRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            placeholder="Асуултаа бичнэ үү"
            className="flex-1 resize-none px-3 py-2 border border-rule rounded-[3px] text-[14px] focus:border-ink outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="w-11 shrink-0 grid place-items-center bg-ink text-white rounded-[3px] disabled:opacity-40"
            aria-label="Илгээх"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
