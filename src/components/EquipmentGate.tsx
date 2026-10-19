import { useState, type ReactNode } from "react";
import { Lock, Loader2, Clock, XCircle } from "lucide-react";
import { useEquipment } from "../lib/equipment";

const inputCls = "w-full h-9 px-2.5 border border-rule rounded-[3px] text-[14px] focus:border-ink outline-none bg-surface";
const primaryBtn =
  "h-9 px-4 bg-ink text-white rounded-[3px] text-[14px] font-medium disabled:opacity-50 inline-flex items-center gap-2";
const linkBtn = "text-[13.5px] text-azure hover:underline";
const box = "border border-rule bg-surface rounded-[3px] p-4 md:p-5";

function Field({ id, label, children, hint }: { id: string; label: string; children: ReactNode; hint?: string }) {
  return (
    <div>
      <label htmlFor={id} className="block text-[13px] font-medium mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="text-[12px] text-muted mt-1">{hint}</p>}
    </div>
  );
}

type Mode = "signin" | "signup" | "reset";

function AuthForm() {
  const { signIn, signUp, sendReset } = useEquipment();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const go = (m: Mode) => {
    setMode(m);
    setMsg(null);
  };

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    const e = email.trim().toLowerCase();
    if (mode === "signin") {
      const err = await signIn(e, password);
      if (err) setMsg({ ok: false, text: err });
    } else if (mode === "signup") {
      if (password !== password2) setMsg({ ok: false, text: "Нууц үг хоорондоо таарахгүй байна." });
      else {
        const r = await signUp(e, password);
        if (r.error) setMsg({ ok: false, text: r.error });
        else if (r.needsConfirm)
          setMsg({ ok: true, text: `${e} хаяг руу баталгаажуулах захидал илгээлээ. Холбоос дээр дарсны дараа нэвтэрч, эрх хүснэ.` });
      }
    } else {
      const err = await sendReset(e);
      setMsg(
        err
          ? { ok: false, text: err }
          : { ok: true, text: `Бүртгэлтэй бол ${e} хаяг руу нууц үг сэргээх холбоос илгээлээ. Холбоосыг энэ хөтчөөрөө нээнэ үү.` },
      );
    }
    setBusy(false);
  };

  const title = mode === "signin" ? "Нэвтрэх" : mode === "signup" ? "Бүртгүүлэх" : "Нууц үг сэргээх";

  return (
    <div className={`${box} max-w-[440px]`}>
      <p className="flex items-center gap-2 font-serif font-bold text-[17px] text-ink">
        <Lock className="w-4 h-4" aria-hidden /> {title}
      </p>
      <p className="text-[14px] text-muted mt-1 mb-4">
        {mode === "signin" &&
          "Хяналтын тоног төхөөрөмжийн бүртгэл, төсвийн санал нь дотоод мэдээлэл тул зөвхөн зөвшөөрөгдсөн албан хаагч нэвтэрч харна."}
        {mode === "signup" && "Бүртгүүлж, имэйлээ баталгаажуулсны дараа эрх хүсэх хүсэлт илгээнэ. Админ зөвшөөрсний дараа мэдээлэл харагдана."}
        {mode === "reset" && "Бүртгэлтэй имэйлээ оруулна уу. Шинэ нууц үг тохируулах холбоос имэйлээр очно."}
      </p>
      <form
        className="space-y-3"
        onSubmit={(ev) => {
          ev.preventDefault();
          submit();
        }}
      >
        <Field id="eq-email" label="Имэйл">
          <input id="eq-email" type="email" autoComplete="username" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </Field>
        {mode !== "reset" && (
          <Field id="eq-pass" label="Нууц үг" hint={mode === "signup" ? "8-аас доошгүй тэмдэгт" : undefined}>
            <input
              id="eq-pass"
              type="password"
              autoComplete={mode === "signup" ? "new-password" : "current-password"}
              required
              minLength={mode === "signup" ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </Field>
        )}
        {mode === "signup" && (
          <Field id="eq-pass2" label="Нууц үг давтах">
            <input id="eq-pass2" type="password" autoComplete="new-password" required value={password2} onChange={(e) => setPassword2(e.target.value)} className={inputCls} />
          </Field>
        )}
        {msg && <p className={`text-[13px] ${msg.ok ? "text-allowed" : "text-flag"}`}>{msg.text}</p>}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />}
            {mode === "signin" ? "Нэвтрэх" : mode === "signup" ? "Бүртгүүлэх" : "Холбоос илгээх"}
          </button>
          {mode === "signin" && (
            <>
              <button type="button" className={linkBtn} onClick={() => go("reset")}>
                Нууц үг мартсан
              </button>
              <button type="button" className={linkBtn} onClick={() => go("signup")}>
                Бүртгүүлэх
              </button>
            </>
          )}
          {mode !== "signin" && (
            <button type="button" className={linkBtn} onClick={() => go("signin")}>
              Нэвтрэх рүү буцах
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function RequestAccess() {
  const { session, myRequest, submitRequest, signOut } = useEquipment();
  const [f, setF] = useState({ full_name: "", office: "", position: "", reason: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const email = session?.user?.email;

  if (myRequest?.status === "pending")
    return (
      <div className={`${box} max-w-[560px] space-y-2 text-[14px]`}>
        <p className="flex items-center gap-2 font-serif font-bold text-[17px] text-ink">
          <Clock className="w-4 h-4" aria-hidden /> Хүсэлт хянагдаж байна
        </p>
        <p className="text-muted">
          {new Date(myRequest.created_at).toLocaleDateString("mn-MN")}-нд илгээсэн хүсэлтийг админ хянаж байна. Зөвшөөрсний дараа энэ хуудсыг
          шинэчлэхэд мэдээлэл харагдана.
        </p>
        <p className="text-muted">
          {email}{" "}
          <button onClick={signOut} className={linkBtn}>
            Гарах
          </button>
        </p>
      </div>
    );

  return (
    <div className={`${box} max-w-[560px]`}>
      <p className="flex items-center gap-2 font-serif font-bold text-[17px] text-ink">
        <Lock className="w-4 h-4" aria-hidden /> Харах эрх хүсэх
      </p>
      {myRequest?.status === "rejected" && (
        <p className="flex items-center gap-2 text-[13.5px] text-flag mt-2">
          <XCircle className="w-4 h-4" aria-hidden /> Өмнөх хүсэлтийг татгалзсан. Шаардлагатай бол дахин илгээж болно.
        </p>
      )}
      <p className="text-[14px] text-muted mt-1 mb-4">
        {email} хаяг харах жагсаалтад ороогүй байна. Доорх мэдээллийг бөглөж илгээхэд админ хянаж шийдвэрлэнэ.
      </p>
      <form
        className="space-y-3"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setErr(await submitRequest(f));
          setBusy(false);
        }}
      >
        <Field id="rq-name" label="Овог, нэр">
          <input id="rq-name" required minLength={2} maxLength={120} value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} className={inputCls} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field id="rq-office" label="Ажлын газар">
            <input id="rq-office" maxLength={160} value={f.office} onChange={(e) => setF({ ...f, office: e.target.value })} className={inputCls} placeholder="Жишээ: Замын-Үүд дэх ГГ" />
          </Field>
          <Field id="rq-pos" label="Албан тушаал">
            <input id="rq-pos" maxLength={120} value={f.position} onChange={(e) => setF({ ...f, position: e.target.value })} className={inputCls} />
          </Field>
        </div>
        <Field id="rq-reason" label="Хэрэгцээ, шалтгаан">
          <textarea id="rq-reason" rows={3} maxLength={1000} value={f.reason} onChange={(e) => setF({ ...f, reason: e.target.value })} className={`${inputCls} h-auto py-2`} />
        </Field>
        {err && <p className="text-[13px] text-flag">{err}</p>}
        <div className="flex items-center gap-4">
          <button type="submit" disabled={busy} className={primaryBtn}>
            {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Хүсэлт илгээх
          </button>
          <button type="button" onClick={signOut} className={linkBtn}>
            Өөр хаягаар нэвтрэх
          </button>
        </div>
      </form>
    </div>
  );
}

/** Тоног төхөөрөмжийн мэдээллийг зөвхөн эрхтэй хэрэглэгчид харуулна. */
export function EquipmentGate({ children, compact = false }: { children: ReactNode; compact?: boolean }) {
  const { access, error, reload } = useEquipment();

  if (access === "ok") return <>{children}</>;

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
        <button onClick={reload} className={`${linkBtn} mt-2`}>
          Дахин оролдох
        </button>
      </div>
    );

  if (compact)
    return (
      <div className={`${box} text-[14px] flex flex-wrap items-center justify-between gap-3`}>
        <span className="flex items-center gap-2 text-muted">
          <Lock className="w-4 h-4" aria-hidden /> Тоног төхөөрөмжийн мэдээлэл зөвхөн эрхтэй албан хаагчид харагдана.
        </span>
        <a href="#/equipment" className="font-medium">
          {access === "denied" ? "Эрх хүсэх" : "Нэвтрэх"}
        </a>
      </div>
    );

  return access === "denied" ? <RequestAccess /> : <AuthForm />;
}

/** Имэйлийн холбоосоор орж ирэхэд шинэ нууц үг тохируулах цонх. */
export function PasswordRecovery() {
  const { recovering, updatePassword, endRecovery } = useEquipment();
  const [p1, setP1] = useState("");
  const [p2, setP2] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  if (!recovering && !msg?.ok) return null;

  return (
    <div className="fixed inset-0 z-[3000] grid place-items-center bg-ink-2/40 p-4" role="dialog" aria-modal="true" aria-labelledby="rec-title">
      <div className="w-full max-w-[420px] bg-surface border border-rule rounded-[3px] p-5">
        <p id="rec-title" className="font-serif font-bold text-[18px] text-ink">
          Шинэ нууц үг тохируулах
        </p>
        {msg?.ok ? (
          <div className="mt-3 space-y-3 text-[14px]">
            <p className="text-allowed">{msg.text}</p>
            <button
              className={primaryBtn}
              onClick={() => {
                setMsg(null);
                endRecovery();
              }}
            >
              Үргэлжлүүлэх
            </button>
          </div>
        ) : (
          <form
            className="mt-3 space-y-3"
            onSubmit={async (e) => {
              e.preventDefault();
              if (p1 !== p2) return setMsg({ ok: false, text: "Нууц үг хоорондоо таарахгүй байна." });
              setBusy(true);
              const err = await updatePassword(p1);
              setMsg(err ? { ok: false, text: err } : { ok: true, text: "Нууц үг шинэчлэгдлээ. Та нэвтэрсэн байна." });
              setBusy(false);
            }}
          >
            <Field id="rec-1" label="Шинэ нууц үг" hint="8-аас доошгүй тэмдэгт">
              <input id="rec-1" type="password" autoComplete="new-password" required minLength={8} value={p1} onChange={(e) => setP1(e.target.value)} className={inputCls} />
            </Field>
            <Field id="rec-2" label="Давтах">
              <input id="rec-2" type="password" autoComplete="new-password" required value={p2} onChange={(e) => setP2(e.target.value)} className={inputCls} />
            </Field>
            {msg && <p className="text-[13px] text-flag">{msg.text}</p>}
            <div className="flex items-center gap-4">
              <button type="submit" disabled={busy} className={primaryBtn}>
                {busy && <Loader2 className="w-4 h-4 animate-spin" aria-hidden />} Хадгалах
              </button>
              <button type="button" className={linkBtn} onClick={endRecovery}>
                Цуцлах
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
