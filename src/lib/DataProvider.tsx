/**
 * Статик өгөгдөл дээр Supabase болон localStorage-ийн засварыг давхарлан
 * нэгтгэж, бүх харагдацад нэг эх сурвалжаар түгээнэ.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { borderCrossings } from "../data";
import { getSupabase } from "./supabase";
import type { BorderCrossing } from "../types";

interface DataState {
  ports: BorderCrossing[];
  goodImages: Record<string, string>;
  /** Сүүлд засвар орсон огноо (ISO), байхгүй бол null */
  lastUpdated: string | null;
  source: "static" | "supabase";
  refresh: () => void;
}

const DataContext = createContext<DataState | null>(null);

const num = (val: unknown, fallback?: number) => {
  if (val === undefined || val === null || val === "") return fallback;
  const n = Number(val);
  return Number.isFinite(n) ? n : fallback;
};

function mergePort(base: Record<string, any> | undefined, data: Record<string, any>) {
  return {
    ...base,
    ...data,
    lat: num(data.lat, base?.lat),
    lng: num(data.lng, base?.lng),
    ubDistance: num(data.ubDistance, base?.ubDistance),
    aimagDistance: num(data.aimagDistance, base?.aimagDistance),
  };
}

function readLocal(): Record<string, any> {
  try {
    return JSON.parse(localStorage.getItem("LOCAL_OVERRIDES_DATA") || "{}");
  } catch {
    return {};
  }
}

export function DataProvider({ children }: { children: ReactNode }) {
  const [tick, setTick] = useState(0);
  const [portOverrides, setPortOverrides] = useState<Record<string, any>>({});
  const [goodImages, setGoodImages] = useState<Record<string, string>>({});
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [source, setSource] = useState<"static" | "supabase">("static");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const ports: Record<string, any> = {};
      const goods: Record<string, string> = {};
      let latest: string | null = null;
      const supabase = getSupabase();

      if (supabase) {
        try {
          const [{ data: images }, { data: generic }] = await Promise.all([
            supabase.from("custom_images").select("*"),
            supabase.from("custom_overrides").select("*"),
          ]);
          images?.forEach((it: any) => {
            if (it.category === "port") ports[it.entity_id] = { imageUrl: it.image_url };
            else if (it.category === "good") goods[it.entity_id] = it.image_url;
          });
          generic?.forEach((it: any) => {
            if (it.updated_at && (!latest || it.updated_at > latest)) latest = it.updated_at;
            if (it.category === "port") ports[it.entity_id] = mergePort(ports[it.entity_id], it.data || {});
            else if (it.category === "good" && it.data?.imageUrl) goods[it.entity_id] = it.data.imageUrl;
          });
          if (!cancelled) setSource("supabase");
        } catch (err) {
          console.warn("Засварын өгөгдөл татаж чадсангүй:", err);
        }
      }

      Object.entries(readLocal()).forEach(([key, data]) => {
        const [cat, id] = key.split(":");
        if (cat === "port") ports[id] = mergePort(ports[id], data as any);
        else if (cat === "good" && (data as any)?.imageUrl) goods[id] = (data as any).imageUrl;
      });

      // Хуучин бүрэлдэхүүн хэсгүүдтэй нийцүүлэх
      try {
        localStorage.setItem(
          "customPortImages",
          JSON.stringify(Object.fromEntries(Object.entries(ports).map(([id, d]) => [id, d.imageUrl]))),
        );
        localStorage.setItem("customGoodImages", JSON.stringify(goods));
      } catch {
        /* storage боломжгүй орчин */
      }

      if (!cancelled) {
        setPortOverrides(ports);
        setGoodImages(goods);
        setLastUpdated(latest);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [tick]);

  const ports = useMemo(
    () =>
      borderCrossings.map((p) => {
        const o = portOverrides[p.id];
        if (!o) return { ...p, category: p.category ?? "Боомт" };
        const merged = { ...p, ...o, category: p.category ?? "Боомт" };
        if (!Number.isFinite(merged.lat)) merged.lat = p.lat;
        if (!Number.isFinite(merged.lng)) merged.lng = p.lng;
        return merged as BorderCrossing;
      }),
    [portOverrides],
  );

  const refresh = useCallback(() => setTick((t) => t + 1), []);

  const value = useMemo(
    () => ({ ports, goodImages, lastUpdated, source, refresh }),
    [ports, goodImages, lastUpdated, source, refresh],
  );
  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData нь DataProvider дотор ашиглагдах ёстой");
  return ctx;
}

export function usePort(id: string | undefined) {
  const { ports } = useData();
  return useMemo(() => ports.find((p) => p.id === id), [ports, id]);
}
