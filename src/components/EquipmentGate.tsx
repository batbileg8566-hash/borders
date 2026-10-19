import { useState, type ReactNode } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useEquipment } from "../lib/equipment";

/** Тоног төхөөрөмжийн мэдээллийг зөвхөн эрхтэй хэрэглэгчид харуулна. */
export function EquipmentGate({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const { access, session, error, signIn, signOut, reload } = useEquipment();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  if (access === "ok") return <>{children}</>;

  const box = "border border-rule bg-surface rounded-[3px] p-4 md:p-5";

  if (access === "loading")
    return (
      <div className={`${box} flex items-center gap-2 text-[14px] text-muted`}>
        <Loader2 className="w-4 h-4 animate-spin" aria-hidden /> Тоног төхөөрөмжийн мэдээлэл ачаалж байна
      </div>
    );

  if (access === "unconfigured")
    return <div className={`${box} text-[14px] text-muted`}>Өгөгдлийн сан тохируулагдаагүй тул тоног төхөөрөмжийн мэдээлэл харах боломжгүй.</div>;

  if (access === "error")
    return (
      <div className={`${box} text-[14px]`}>
        <p className="text-flag">Мэдээлэл татаж чадсангүй: {error}</p>
        <button onClick={reload} className="mt-2 text-azure hover:underline">
          Дахин оролдох
        </button>
      </div>
    );

  if (access === "denied")
    return (
      <div className={`${box} text-[14px] space-y-2`}>
        <p className="flex items-center gap-2 font-medium text-ink">
          <Lock className="w-4 h-4" aria-hidden /> Хандах эрхгүй байна
        </p>
        <p className="text-muted">
          {session?.user?.email} хаяг тоног төхөөрөмжийн мэдээлэл харах жагсаалтад бүртгэгдээгүй. Системийн админд хандаж эрх авна уу.
        </p>
        <button onClick={signOut} className="text-azure hover:underline">
          Өөр хаягаар нэвтрэх
        </button>
      </div>
    );

  // signed-out
  if (compact)
    return (
      <div className={`${box} text-[14px] flex flex-wrap items-center justify-between gap-3`}>
        <span className="flex items-center gap-2 text-muted">
          <Lock className="w-4 h-4" aria-hidden /> Тоног төхөөрөмжийн мэдээлэл зөвхөн эрхтэй албан хаагчид харагдана.
        </span>
        <a href="#/equipment" className="font-medium">
          Нэвтрэх
        </a>
      </div>
    );

  return (
    <div className={`${box} max-w-[440px]`}>
      <p className="flex items-center gap-2 font-serif font-bold text-[17px] text-ink">
        <Lock className="w-4 h-4" aria-hidden /> Эрхтэй хэрэглэгчийн хэсэг
      </p>
      <p className="text-[14px] text-muted mt-1 mb-4">
        Хяналтын тоног төхөөрөмжийн бүртгэл, төсвийн санал нь дотоод мэдээлэл тул зөвхөн зөвшөөрөгдсөн албан хаагч нэвтэрч харна.
      </p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setMsg(await signIn(email.trim(), password));
          setBusy(false);
        }}
      >
        <div>
          <label htmlFor="eq-email" className="block text-[13px] font-medium mb-1">
            Имэйл
          </label>
          <input
            id="eq-email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full h-9 px-2.5 border border-rule rounded-[3px] text-[14px] focus:border-ink outline-none"
          />
        </div>
        <div>
          <label htmlFor="eq-pass" className="block text-[13px] font-medium mb-1">
            Нууц үг
          </label>
          <input
            id="eq-pass"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full h-9 px-2.5 border border-rule rounded-[3px] text-[14px] focus:border-ink outline-none"
          />
        </div>
        {msg && <p className="text-[13px] text-flag">{msg}</p>}
        <button
          type="submit"
          disabled={busy}
          className="h-9 px-4 bg-ink text-white rounded-[3px] text-[14px] font-medium disabled:opacity-50 inline-flex items-center gap-2"
        >
          {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Нэвтрэх
        </button>
      </form>
    </div>
  );
}
