/**
 * Hash дээр суурилсан энгийн router. Хаяг бүрийг хуваалцаж, хавчуурга
 * болгож, хэвлэж болно (#/port/zamiin-uud, #/goods/medicine?dir=export ...).
 */
import { useCallback, useEffect, useState } from "react";

export interface Route {
  path: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = window.location.hash.replace(/^#/, "") || "/";
  const [p, q = ""] = raw.split("?");
  return {
    path: p.split("/").filter(Boolean).map(decodeURIComponent),
    query: new URLSearchParams(q),
  };
}

export function href(path: string, query?: Record<string, string | null | undefined>) {
  const qs = new URLSearchParams();
  Object.entries(query ?? {}).forEach(([k, v]) => {
    if (v) qs.set(k, v);
  });
  const s = qs.toString();
  return `#${path}${s ? `?${s}` : ""}`;
}

export function navigate(path: string, query?: Record<string, string | null | undefined>, replace = false) {
  const next = href(path, query);
  if (replace) history.replaceState(null, "", next);
  else history.pushState(null, "", next);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

export function useRoute(): Route {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener("hashchange", on);
    window.addEventListener("popstate", on);
    return () => {
      window.removeEventListener("hashchange", on);
      window.removeEventListener("popstate", on);
    };
  }, []);
  return route;
}

/** Одоогийн хуудасны query параметрийг шинэчилнэ (түүх рүү бичихгүй). */
export function useQueryState() {
  const route = useRoute();
  const set = useCallback(
    (patch: Record<string, string | null>) => {
      const q = new URLSearchParams(route.query);
      Object.entries(patch).forEach(([k, v]) => (v ? q.set(k, v) : q.delete(k)));
      navigate("/" + route.path.join("/"), Object.fromEntries(q), true);
    },
    [route],
  );
  return [route.query, set] as const;
}
