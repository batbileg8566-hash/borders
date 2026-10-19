/**
 * Гаалийн хяналтын тоног төхөөрөмжийн өгөгдөл.
 * Өгөгдөл кодонд БИШ, Supabase-д хадгалагдана. RLS дүрмээр зөвхөн
 * `app_staff` жагсаалтад бүртгэлтэй, нэвтэрсэн хэрэглэгч уншина.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSupabase } from "./supabase";

export interface EquipmentItem {
  id: number;
  office_code: string;
  port_id: string | null;
  category: string;
  grp: string | null;
  name: string;
  model: string | null;
  supplier: string | null;
  qty: number;
  qty_ok: number | null;
  qty_faulty: number | null;
  commissioned: string | null;
  cost: number | null;
  life_years: number | null;
  remaining_years: number | null;
  service_contract: string | null;
  last_repair: string | null;
  reval_date: string | null;
  reval_amount: number | null;
  writeoff_reason: string | null;
  writeoff_date: string | null;
  note: string | null;
  issue: string | null;
}

export interface BudgetItem {
  id: number;
  no: string;
  section: string;
  is_group: boolean;
  parent_no: string | null;
  place: string | null;
  name: string;
  type: string | null;
  qty: number | null;
  unit: string | null;
  start_year: number | null;
  end_year: number | null;
  cost_mnt_m: number | null;
  funding_mnt_m: number | null;
  office_codes: string[];
  port_id: string | null;
}

/** Бүртгэлийн ангиллыг товч, тогтмол дарааллаар харуулна. */
export const EQUIPMENT_CATEGORIES: { key: string; short: string }[] = [
  { key: "Рентген тоног төхөөрөмж", short: "Рентген" },
  { key: "Хяналт шалгалтад ашиглах тоног төхөөрөмж", short: "Хяналт шалгалт" },
  { key: '"Ухаалаг гарц" иж бүрдэл', short: "Ухаалаг гарц" },
  { key: "Телехяналтын нэгдсэн системд холбогдох тоног төхөөрөмж", short: "Телехяналт" },
  { key: "Лабораторийн тоног төхөөрөмж", short: "Лаборатори" },
  { key: "Серверийн өрөөний тоног төхөөрөмж", short: "Сервер, сүлжээ" },
  { key: "Цахилгаан хангамж, бусад төхөөрөмж", short: "Цахилгаан хангамж" },
  { key: "Албан хэрэгцээнд шаардлагатай тоног төхөөрөмж", short: "Албан хэрэгцээ" },
];
export const categoryShort = (k: string) => EQUIPMENT_CATEGORIES.find((c) => c.key === k)?.short ?? k;

export type ItemCondition = "faulty" | "expired" | "ok";

/** Хэвийн бус ширхэгтэй бол "faulty"; ашиглалтын хугацаа дууссан бол "expired". */
export function conditionOf(it: EquipmentItem): ItemCondition {
  if ((it.qty_faulty ?? 0) > 0) return "faulty";
  if (it.life_years && it.remaining_years !== null && it.remaining_years <= 0) return "expired";
  return "ok";
}

export interface Totals {
  lines: number;
  qty: number;
  faulty: number;
  expiredQty: number;
  cost: number;
}

export function totalsOf(items: EquipmentItem[]): Totals {
  const t: Totals = { lines: items.length, qty: 0, faulty: 0, expiredQty: 0, cost: 0 };
  for (const it of items) {
    t.qty += it.qty || 0;
    t.faulty += it.qty_faulty || 0;
    t.cost += it.cost || 0;
    if (conditionOf(it) === "expired") t.expiredQty += it.qty || 0;
  }
  return t;
}

export const fmtMnt = (n: number) => {
  if (n >= 1e9) return `${(n / 1e9).toLocaleString("mn-MN", { maximumFractionDigits: 2 })} тэрбум ₮`;
  if (n >= 1e6) return `${(n / 1e6).toLocaleString("mn-MN", { maximumFractionDigits: 1 })} сая ₮`;
  return `${Math.round(n).toLocaleString("mn-MN")} ₮`;
};

// ─── Хандалт ─────────────────────────────────────────────────────────────────

export interface AccessRequest {
  id: number;
  user_id: string;
  email: string;
  full_name: string;
  office: string | null;
  position: string | null;
  reason: string | null;
  status: "pending" | "approved" | "rejected";
  role_granted: string | null;
  created_at: string;
  decided_at: string | null;
  decided_by: string | null;
}

export interface StaffRow {
  email: string;
  role: "viewer" | "editor" | "admin";
  added_at: string;
}

export const ROLE_LABEL: Record<string, string> = {
  viewer: "Харах",
  editor: "Харах, боомт хуваарилах",
  admin: "Админ",
};

const authError = (m: string) => {
  if (/invalid login/i.test(m)) return "Имэйл эсвэл нууц үг буруу байна.";
  if (/not confirmed/i.test(m)) return "Имэйл хаяг баталгаажаагүй байна. Ирсэн захидлын холбоос дээр дарна уу.";
  if (/already registered/i.test(m)) return "Энэ имэйлээр бүртгэл үүссэн байна. Нэвтрэх эсвэл нууц үгээ сэргээнэ үү.";
  if (/at least/i.test(m) && /password/i.test(m)) return "Нууц үг хэт богино байна (6-аас доошгүй тэмдэгт).";
  if (/rate limit|too many/i.test(m)) return "Хэт олон оролдлого хийлээ. Хэсэг хүлээгээд дахин оролдоно уу.";
  return m;
};

export type AccessState = "unconfigured" | "loading" | "signed-out" | "denied" | "ok" | "error";

interface EquipmentState {
  access: AccessState;
  session: Session | null;
  items: EquipmentItem[];
  budget: BudgetItem[];
  error: string | null;
  canEdit: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string) => Promise<{ error: string | null; needsConfirm: boolean }>;
  sendReset: (email: string) => Promise<string | null>;
  updatePassword: (password: string) => Promise<string | null>;
  recovering: boolean;
  endRecovery: () => void;
  myRequest: AccessRequest | null;
  submitRequest: (r: { full_name: string; office: string; position: string; reason: string }) => Promise<string | null>;
  requests: AccessRequest[];
  staff: StaffRow[];
  decide: (id: number, approve: boolean, role?: string) => Promise<string | null>;
  setStaffRole: (email: string, role: string) => Promise<string | null>;
  revokeStaff: (email: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  reload: () => void;
  assignPort: (ids: number[], portId: string | null) => Promise<string | null>;
}

const Ctx = createContext<EquipmentState | null>(null);

async function fetchAll<T>(table: string): Promise<T[]> {
  const sb = getSupabase()!;
  const out: T[] = [];
  const page = 1000;
  for (let from = 0; ; from += page) {
    const { data, error } = await sb.from(table).select("*").order("id").range(from, from + page - 1);
    if (error) throw error;
    out.push(...((data ?? []) as T[]));
    if (!data || data.length < page) break;
  }
  return out;
}

export function EquipmentProvider({ children }: { children: ReactNode }) {
  const sb = getSupabase();
  const [session, setSession] = useState<Session | null>(null);
  const [access, setAccess] = useState<AccessState>(sb ? "loading" : "unconfigured");
  const [items, setItems] = useState<EquipmentItem[]>([]);
  const [budget, setBudget] = useState<BudgetItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  const [recovering, setRecovering] = useState(false);
  const [myRequest, setMyRequest] = useState<AccessRequest | null>(null);
  const [requests, setRequests] = useState<AccessRequest[]>([]);
  const [staff, setStaff] = useState<StaffRow[]>([]);

  useEffect(() => {
    if (!sb) return;
    sb.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = sb.auth.onAuthStateChange((event, s) => {
      setSession(s);
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
    });
    // Имэйлийн холбоосоор ирсэн ?code=... параметрийг хаягаас цэвэрлэнэ
    if (new URLSearchParams(location.search).has("code")) {
      setTimeout(() => history.replaceState(null, "", location.pathname + location.hash), 1500);
    }
    return () => data.subscription.unsubscribe();
  }, [sb]);

  useEffect(() => {
    if (!sb) return;
    if (!session) {
      setAccess("signed-out");
      setItems([]);
      setBudget([]);
      return;
    }
    let alive = true;
    setAccess("loading");
    (async () => {
      try {
        const { data: r, error: re } = await sb.rpc("staff_role");
        if (re) throw re;
        if (!r) {
          const { data: mine } = await sb
            .from("access_requests")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(1);
          if (alive) {
            setMyRequest((mine?.[0] as AccessRequest) ?? null);
            setRole(null);
            setAccess("denied");
          }
          return;
        }
        if (r === "admin") {
          const [{ data: rq }, { data: st }] = await Promise.all([
            sb.from("access_requests").select("*").order("created_at", { ascending: false }),
            sb.from("app_staff").select("*").order("added_at"),
          ]);
          if (alive) {
            setRequests((rq ?? []) as AccessRequest[]);
            setStaff((st ?? []) as StaffRow[]);
          }
        }
        const [a, b] = await Promise.all([fetchAll<EquipmentItem>("equipment_items"), fetchAll<BudgetItem>("equipment_budget")]);
        if (!alive) return;
        setRole(r as string);
        setItems(a);
        setBudget(b);
        setAccess("ok");
      } catch (e: any) {
        if (!alive) return;
        setError(e?.message ?? String(e));
        setAccess("error");
      }
    })();
    return () => {
      alive = false;
    };
  }, [sb, session?.user?.id, tick]);

  const redirectTo = () => `${location.origin}${location.pathname}`;

  const signIn = useCallback(
    async (email: string, password: string) => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { error } = await sb.auth.signInWithPassword({ email, password });
      return error ? authError(error.message) : null;
    },
    [sb],
  );

  const signUp = useCallback(
    async (email: string, password: string) => {
      if (!sb) return { error: "Supabase тохируулагдаагүй байна.", needsConfirm: false };
      const { data, error } = await sb.auth.signUp({ email, password, options: { emailRedirectTo: redirectTo() } });
      if (error) return { error: authError(error.message), needsConfirm: false };
      // Бүртгэлтэй имэйлээр дахин бүртгүүлэхэд identities хоосон ирдэг
      if (data.user && data.user.identities?.length === 0)
        return { error: "Энэ имэйлээр бүртгэл үүссэн байна. Нэвтрэх эсвэл нууц үгээ сэргээнэ үү.", needsConfirm: false };
      return { error: null, needsConfirm: !data.session };
    },
    [sb],
  );

  const sendReset = useCallback(
    async (email: string) => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: redirectTo() });
      return error ? authError(error.message) : null;
    },
    [sb],
  );

  const updatePassword = useCallback(
    async (password: string) => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { error } = await sb.auth.updateUser({ password });
      return error ? authError(error.message) : null;
    },
    [sb],
  );

  const submitRequest = useCallback(
    async (r: { full_name: string; office: string; position: string; reason: string }) => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { data, error } = await sb
        .from("access_requests")
        .insert({ full_name: r.full_name.trim(), office: r.office.trim() || null, position: r.position.trim() || null, reason: r.reason.trim() || null })
        .select()
        .single();
      if (error) return /duplicate|unique/i.test(error.message) ? "Таны өмнөх хүсэлт шийдвэрлэгдээгүй байна." : error.message;
      setMyRequest(data as AccessRequest);
      return null;
    },
    [sb],
  );

  const decide = useCallback(
    async (id: number, approve: boolean, grant = "viewer") => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { error } = await sb.rpc("decide_access_request", { req_id: id, approve, grant_role: grant });
      if (error) return error.message;
      setTick((t) => t + 1);
      return null;
    },
    [sb],
  );

  const setStaffRole = useCallback(
    async (email: string, newRole: string) => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { error } = await sb.from("app_staff").update({ role: newRole }).eq("email", email);
      if (error) return error.message;
      setStaff((p) => p.map((x) => (x.email === email ? { ...x, role: newRole as StaffRow["role"] } : x)));
      return null;
    },
    [sb],
  );

  const revokeStaff = useCallback(
    async (email: string) => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { error } = await sb.from("app_staff").delete().eq("email", email);
      if (error) return error.message;
      setStaff((p) => p.filter((x) => x.email !== email));
      return null;
    },
    [sb],
  );

  const signOut = useCallback(async () => {
    await sb?.auth.signOut();
  }, [sb]);

  const assignPort = useCallback(
    async (ids: number[], portId: string | null) => {
      if (!sb) return "Supabase тохируулагдаагүй байна.";
      const { error } = await sb.from("equipment_items").update({ port_id: portId }).in("id", ids);
      if (error) return error.message;
      setItems((prev) => prev.map((it) => (ids.includes(it.id) ? { ...it, port_id: portId } : it)));
      return null;
    },
    [sb],
  );

  const value = useMemo(
    () => ({
      access,
      session,
      items,
      budget,
      error,
      canEdit: role === "editor" || role === "admin",
      isAdmin: role === "admin",
      signIn,
      signUp,
      sendReset,
      updatePassword,
      recovering,
      endRecovery: () => setRecovering(false),
      myRequest,
      submitRequest,
      requests,
      staff,
      decide,
      setStaffRole,
      revokeStaff,
      signOut,
      reload: () => setTick((t) => t + 1),
      assignPort,
    }),
    [access, session, items, budget, error, role, signIn, signUp, sendReset, updatePassword, recovering, myRequest, submitRequest, requests, staff, decide, setStaffRole, revokeStaff, signOut, assignPort],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useEquipment() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useEquipment нь EquipmentProvider дотор ашиглагдана");
  return v;
}
