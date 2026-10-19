import { useState } from "react";
import { Loader2 } from "lucide-react";
import { ROLE_LABEL, useEquipment, type AccessRequest } from "../lib/equipment";
import { Empty, Section } from "./ui";

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleString("mn-MN", { dateStyle: "medium", timeStyle: "short" }) : "—");
const selectCls = "h-8 px-2 border border-rule rounded-[3px] text-[13.5px] bg-surface";

function PendingRow({ r }: { r: AccessRequest }) {
  const { decide } = useEquipment();
  const [role, setRole] = useState("viewer");
  const [busy, setBusy] = useState<"yes" | "no" | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const act = async (approve: boolean) => {
    if (!approve && !confirm(`${r.full_name} (${r.email})-ийн хүсэлтийг татгалзах уу?`)) return;
    setBusy(approve ? "yes" : "no");
    setErr(await decide(r.id, approve, role));
    setBusy(null);
  };
  return (
    <li className="py-3 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium text-ink">
            {r.full_name} <span className="font-normal text-muted">{r.email}</span>
          </p>
          <p className="text-[13.5px] text-muted">{[r.position, r.office].filter(Boolean).join(", ") || "Албан тушаал, газар заагаагүй"}</p>
          {r.reason && <p className="text-[13.5px] mt-1 max-w-[70ch]">{r.reason}</p>}
          <p className="text-[12px] text-faint mt-1">{fmtDate(r.created_at)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor={`role-${r.id}`}>
            Олгох эрх
          </label>
          <select id={`role-${r.id}`} value={role} onChange={(e) => setRole(e.target.value)} className={selectCls}>
            <option value="viewer">{ROLE_LABEL.viewer}</option>
            <option value="editor">{ROLE_LABEL.editor}</option>
            <option value="admin">{ROLE_LABEL.admin}</option>
          </select>
          <button
            onClick={() => act(true)}
            disabled={!!busy}
            className="h-8 px-3 bg-ink text-white rounded-[3px] text-[13.5px] font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {busy === "yes" && <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden />} Зөвшөөрөх
          </button>
          <button
            onClick={() => act(false)}
            disabled={!!busy}
            className="h-8 px-3 border border-rule rounded-[3px] text-[13.5px] text-flag hover:border-flag disabled:opacity-50"
          >
            Татгалзах
          </button>
        </div>
      </div>
      {err && <p className="text-[13px] text-flag mt-1">{err}</p>}
    </li>
  );
}

export function StaffAdmin() {
  const { requests, staff, session, setStaffRole, revokeStaff } = useEquipment();
  const [err, setErr] = useState<string | null>(null);
  const me = session?.user?.email?.toLowerCase();
  const pending = requests.filter((r) => r.status === "pending");
  const decided = requests.filter((r) => r.status !== "pending").slice(0, 30);

  return (
    <div className="space-y-5">
      <Section title="Хүлээгдэж буй хүсэлт" aside={`${pending.length} хүсэлт`}>
        {pending.length ? (
          <ul className="divide-y divide-rule-soft">
            {pending.map((r) => (
              <PendingRow key={r.id} r={r} />
            ))}
          </ul>
        ) : (
          <Empty>Шинэ хүсэлт алга. Албан хаагч сайтад бүртгүүлж, эрх хүсэхэд энд харагдана.</Empty>
        )}
      </Section>

      <Section title="Эрхтэй хэрэглэгчид" aside={`${staff.length} хүн`}>
        {err && <p className="text-[13px] text-flag mb-2">{err}</p>}
        <table className="w-full text-[14px] border-collapse">
          <thead>
            <tr className="text-left text-[12.5px] text-muted border-b border-rule">
              <th className="py-2 pr-3 font-medium">Имэйл</th>
              <th className="py-2 pr-3 font-medium">Эрх</th>
              <th className="py-2 pr-3 font-medium">Нэмсэн</th>
              <th className="py-2 font-medium" />
            </tr>
          </thead>
          <tbody>
            {staff.map((s) => (
              <tr key={s.email} className="border-b border-rule-soft">
                <td className="py-2 pr-3">
                  {s.email}
                  {s.email === me && <span className="text-muted"> (та)</span>}
                </td>
                <td className="py-2 pr-3">
                  {s.email === me ? (
                    ROLE_LABEL[s.role]
                  ) : (
                    <select
                      aria-label={`${s.email} эрх`}
                      value={s.role}
                      onChange={async (e) => setErr(await setStaffRole(s.email, e.target.value))}
                      className={selectCls}
                    >
                      <option value="viewer">{ROLE_LABEL.viewer}</option>
                      <option value="editor">{ROLE_LABEL.editor}</option>
                      <option value="admin">{ROLE_LABEL.admin}</option>
                    </select>
                  )}
                </td>
                <td className="py-2 pr-3 text-muted text-[13px]">{fmtDate(s.added_at)}</td>
                <td className="py-2 text-right">
                  {s.email !== me && (
                    <button
                      onClick={async () => {
                        if (confirm(`${s.email}-ийн эрхийг цуцлах уу?`)) setErr(await revokeStaff(s.email));
                      }}
                      className="text-[13.5px] text-flag hover:underline"
                    >
                      Эрх цуцлах
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {decided.length > 0 && (
        <Section title="Шийдвэрлэсэн хүсэлт" aside="Сүүлийн 30">
          <ul className="text-[13.5px] divide-y divide-rule-soft">
            {decided.map((r) => (
              <li key={r.id} className="py-1.5 flex flex-wrap justify-between gap-2">
                <span>
                  {r.full_name} <span className="text-muted">{r.email}</span>
                </span>
                <span className={r.status === "approved" ? "text-allowed" : "text-flag"}>
                  {r.status === "approved" ? `Зөвшөөрсөн (${ROLE_LABEL[r.role_granted ?? "viewer"]})` : "Татгалзсан"}, {fmtDate(r.decided_at)}
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}
