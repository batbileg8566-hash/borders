import { GoodStatus } from "../types";

export const STATUS_LABEL_MAP: Record<GoodStatus, string> = {
  ok: "Тогтоолд орсон",
  warn: "Нэмэх саналтай",
  crit: "Хуулийн санал",
};

export const STATUS_COLOR_MAP: Record<GoodStatus, string> = {
  ok: "text-emerald-600 bg-emerald-50 border-emerald-100",
  warn: "text-orange-600 bg-orange-50 border-orange-100",
  crit: "text-rose-600 bg-rose-50 border-rose-100",
};

export const PORT_STATUS_COLOR_MAP: Record<string, string> = {
  "Олон улсын": "bg-blue-600 shadow-blue-500/50",
  "Хоёр талын": "bg-amber-500 shadow-amber-500/50",
  "Түр ажиллагаатай": "bg-slate-500 shadow-slate-500/50",
};

export const PORT_STATUS_DOT_MAP: Record<string, string> = {
  "Олон улсын": "bg-blue-600",
  "Хоёр талын": "bg-amber-500",
  "Түр ажиллагаатай": "bg-slate-500",
};

export const TRAFFIC_COLOR_MAP: Record<string, string> = {
  "Хэвийн": "text-emerald-500 bg-emerald-50 border-emerald-100",
  "Ачаалалтай": "text-amber-500 bg-amber-50 border-amber-100",
  "Квот тулсан": "text-rose-500 bg-rose-50 border-rose-100",
};

export const TRAFFIC_BADGE_MAP: Record<string, string> = {
  "Хэвийн": "bg-emerald-50 text-emerald-600",
  "Ачаалалтай": "bg-amber-50 text-amber-600",
  "Квот тулсан": "bg-rose-50 text-rose-600",
};

export const TRANSPORT_ICON_MAP: Record<string, string> = {
  "Автозам": "🚗 Автозам",
  "Төмөр зам": "🚂 Төмөр зам",
  "AGV": "📡 AGV Ухаалаг тээвэр",
  "Агаар": "✈️ Агаар",
};

export const TRANSPORT_EMOJI_MAP: Record<string, string> = {
  "Автозам": "🚗",
  "Төмөр зам": "🚂",
  "AGV": "📡",
  "Агаар": "✈️",
};
