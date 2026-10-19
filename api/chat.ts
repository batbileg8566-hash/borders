/**
 * Vercel serverless функц — Gemini API түлхүүрийг серверт хадгална.
 * Vercel → Project → Settings → Environment Variables хэсэгт GEMINI_API_KEY
 * (сонголтоор GEMINI_MODEL) нэмнэ. Түлхүүр хөтөч рүү хэзээ ч дамжихгүй.
 */
import { GoogleGenAI } from "@google/genai";

const MAX_CONTEXT = 80_000;
const MAX_MESSAGES = 20;
const MAX_MESSAGE_LEN = 2_000;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Зөвхөн POST хүсэлт хүлээн авна." });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: "Туслах тохируулагдаагүй байна: серверт GEMINI_API_KEY алга." });
  }

  const body = typeof req.body === "string" ? JSON.parse(req.body || "{}") : req.body ?? {};
  const context = String(body.context ?? "").slice(0, MAX_CONTEXT);
  const focus = String(body.focus ?? "").slice(0, 200);
  const messages: ChatMessage[] = Array.isArray(body.messages)
    ? body.messages
        .slice(-MAX_MESSAGES)
        .filter((m: any) => (m?.role === "user" || m?.role === "model") && typeof m.text === "string")
        .map((m: any) => ({ role: m.role, text: m.text.slice(0, MAX_MESSAGE_LEN) }))
    : [];

  if (!messages.length || messages[messages.length - 1].role !== "user") {
    return res.status(400).json({ error: "Асуулт хоосон байна." });
  }

  const systemInstruction = `Та Монгол Улсын гаалийн хилийн боомт, гаалийн бүсийн эрх зүйн зохицуулалтын мэдээллийн туслах.
Зөвхөн доорх МЭДЭЭЛЛИЙН САН-д тулгуурлан, албан ёсны, тодорхой монгол хэлээр хариулна.
- Бараа ямар боомтоор нэвтрэх тухай асуултад боомтын нэр, чиглэл (импорт/экспорт), холбогдох тогтоолын дугаар, нөхцөлийг заана.
- Санд байхгүй мэдээллийг зохиохгүй; байхгүй бол "мэдээллийн санд бүртгэгдээгүй" гэж хэлнэ.
- Хүчин төгөлдөр эх бичвэрийг legalinfo.mn-ээс шалгахыг шаардлагатай үед сануулна.
${focus ? `Хэрэглэгч одоо "${focus}" нэгжийг харж байна; "энэ боомт" гэвэл үүнийг хэлнэ.` : ""}

МЭДЭЭЛЛИЙН САН:
${context}`;

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: process.env.GEMINI_MODEL || "gemini-3-flash-preview",
      config: { systemInstruction },
      contents: messages.map((m) => ({ role: m.role, parts: [{ text: m.text }] })),
    });
    return res.status(200).json({ text: response.text ?? "" });
  } catch (err: any) {
    console.error("Gemini error:", err);
    return res.status(502).json({ error: "Загвараас хариу авч чадсангүй. Түр хүлээгээд дахин оролдоно уу." });
  }
}
