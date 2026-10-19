/**
 * Хандах эрхийн шинэ хүсэлт ирэхэд админуудад имэйл илгээнэ.
 *
 * Хүсэлт гаргагч нэвтэрсэн хэвээр, өөрийн хүсэлтийн id-гаар дуудна.
 * Функц хүсэлт тухайн хэрэглэгчийнх эсэх, шийдвэрлэгдээгүй, өмнө нь
 * мэдэгдэл явуулаагүй эсэхийг шалгаад Resend-ээр имэйл илгээнэ.
 *
 * Шаардлагатай нууц тохиргоо (Supabase → Edge Functions → Secrets):
 *   RESEND_API_KEY  — resend.com дээрээс авсан түлхүүр
 *   NOTIFY_FROM     — (заавал биш) илгээгчийн хаяг, жишээ нь
 *                     "Боомтын сан <noreply@таны-домэйн.mn>". Домэйн
 *                     баталгаажуулаагүй бол onboarding@resend.dev ашиглана,
 *                     энэ үед зөвхөн Resend бүртгэлийн эзний имэйл рүү очно.
 *   SITE_URL        — (заавал биш) сайтын хаяг
 */
import { createClient } from "jsr:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const esc = (s: unknown) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

function serviceKey(): string | undefined {
  const legacy = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (legacy) return legacy;
  try {
    const keys = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}");
    return Object.values(keys)[0] as string | undefined;
  } catch {
    return undefined;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method" }, 405);
  try {
    const key = serviceKey();
    if (!key) return json({ sent: false, reason: "service key missing" }, 500);
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, key, { auth: { persistSession: false } });

    const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
    const { data: who } = await admin.auth.getUser(token);
    if (!who?.user) return json({ error: "unauthorized" }, 401);

    const { request_id } = await req.json().catch(() => ({}));
    const { data: r } = await admin.from("access_requests").select("*").eq("id", request_id).maybeSingle();
    if (!r || r.user_id !== who.user.id) return json({ error: "not found" }, 404);
    if (r.status !== "pending" || r.notified_at) return json({ sent: false, reason: "already handled" });

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) return json({ sent: false, reason: "RESEND_API_KEY not configured" });

    const { data: admins } = await admin.from("app_staff").select("email").eq("role", "admin");
    const to = (admins ?? []).map((a: { email: string }) => a.email);
    if (!to.length) return json({ sent: false, reason: "no admins" });

    const site = (Deno.env.get("SITE_URL") ?? "https://borders-ebon.vercel.app").replace(/\/$/, "");
    const link = `${site}/#/equipment?tab=users`;
    const rows: [string, unknown][] = [
      ["Нэр", r.full_name],
      ["Имэйл", r.email],
      ["Байгууллага, нэгж", r.office],
      ["Албан тушаал", r.position],
      ["Шалтгаан", r.reason],
      ["Огноо", new Date(r.created_at).toLocaleString("mn-MN", { timeZone: "Asia/Ulaanbaatar" })],
    ];
    const html = `
<div style="font-family:Arial,sans-serif;font-size:14px;color:#1b1f24;max-width:560px">
  <div style="border-top:4px solid #14325a;padding:16px 0 4px"><strong style="font-size:16px;color:#14325a">Хандах эрхийн шинэ хүсэлт</strong></div>
  <p>Гаалийн хяналтын тоног төхөөрөмжийн мэдээлэлд хандах эрх хүссэн байна.</p>
  <table cellpadding="6" style="border-collapse:collapse;width:100%">
    ${rows
      .filter(([, v]) => v)
      .map(([k, v]) => `<tr><td style="color:#5b6470;border-bottom:1px solid #e3e6ea;width:150px">${esc(k)}</td><td style="border-bottom:1px solid #e3e6ea">${esc(v)}</td></tr>`)
      .join("")}
  </table>
  <p style="margin:20px 0"><a href="${link}" style="background:#14325a;color:#fff;padding:10px 16px;text-decoration:none;border-radius:3px">Хүсэлтийг шийдвэрлэх</a></p>
  <p style="color:#5b6470;font-size:12px">Холбоосоор орж админ эрхээр нэвтэрсний дараа «Хэрэглэгчид» хэсгээс зөвшөөрөх эсвэл татгалзана.</p>
</div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: Deno.env.get("NOTIFY_FROM") ?? "Боомтын мэдээллийн сан <onboarding@resend.dev>",
        to,
        reply_to: r.email,
        subject: `Хандах эрхийн хүсэлт: ${r.full_name}`,
        html,
      }),
    });
    if (!res.ok) return json({ sent: false, reason: `resend ${res.status}: ${await res.text()}` }, 502);

    await admin.from("access_requests").update({ notified_at: new Date().toISOString() }).eq("id", r.id);
    return json({ sent: true, to: to.length });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});
