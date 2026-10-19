import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, Tooltip, Polyline, useMap } from "react-leaflet";
import L from "leaflet";
import type { BorderCrossing, Direction } from "../types";
import { cellFor, categoryOf, type CellStatus } from "../lib/registry";

const UB: [number, number] = [47.92, 106.92];
const CENTER: [number, number] = [46.8, 103.5];

export type RouteMode = "ub" | "aimag" | null;

const valid = (lat: unknown, lng: unknown) =>
  typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng);

/** Солигдсон координатыг (lat > 70) засна. */
export const toLatLng = (lat: number, lng: number): [number, number] =>
  !valid(lat, lng) ? CENTER : lat > 70 ? [lng, lat] : [lat, lng];

const STATUS_FILL: Record<CellStatus, string> = {
  allowed: "#1f7a4d",
  proposed: "#c98a1a",
  none: "#a7b0bb",
};

/** Ангилал бүр өөр хэлбэртэй — өнгөөр бус хэлбэрээр ч ялгагдана. */
function shapeFor(b: BorderCrossing, fill: string, stroke: string, size: number) {
  const s = size;
  switch (categoryOf(b)) {
    case "Гүний гааль":
      return `<rect x="2" y="2" width="${s - 4}" height="${s - 4}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    case "Хяналтын бүс":
      return `<path d="M${s / 2} 2 L${s - 2} ${s - 2} L2 ${s - 2} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    case "Баталгаат бүс":
      return `<path d="M${s / 2} 1.5 L${s - 1.5} ${s / 2} L${s / 2} ${s - 1.5} L1.5 ${s / 2} Z" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    case "Чөлөөт бүс":
      return `<rect x="2" y="2" width="${s - 4}" height="${s - 4}" rx="${s / 4}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
    default:
      return `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2 - 2}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
  }
}

function iconFor(b: BorderCrossing, status: CellStatus | null, selected: boolean) {
  const size = selected ? 24 : 16;
  let fill = "#14325a";
  if (status) fill = STATUS_FILL[status];
  else if (b.operationalStatus === "Хоёр талын") fill = "#3d6a9e";
  else if (b.operationalStatus === "Түр ажиллагаатай") fill = "#8a94a2";
  const stroke = selected ? "#c4272f" : "#ffffff";
  const ring = selected
    ? `<circle cx="${size / 2}" cy="${size / 2}" r="${size / 2 - 0.5}" fill="none" stroke="#c4272f" stroke-width="1" opacity="0.5"/>`
    : "";
  return L.divIcon({
    className: "",
    html: `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="display:block;filter:drop-shadow(0 1px 1px rgba(0,0,0,.25))">${shapeFor(b, fill, stroke, size)}${ring}</svg>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

function Fly({ target }: { target: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target, Math.max(map.getZoom(), 7), { duration: 0.8 });
  }, [target?.[0], target?.[1]]);
  return null;
}

function FitAll({ points, trigger }: { points: [number, number][]; trigger: string }) {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 7 });
    else if (points.length === 1) map.setView(points[0], 7);
  }, [trigger]);
  return null;
}

function useRoute(port: BorderCrossing | null, mode: RouteMode) {
  const [coords, setCoords] = useState<[number, number][]>([]);
  useEffect(() => {
    setCoords([]);
    if (!port || !mode) return;
    const from = toLatLng(port.lat, port.lng);
    const to: [number, number] | null =
      mode === "ub" ? UB : port.aimagLat && port.aimagLng ? toLatLng(port.aimagLat, port.aimagLng) : null;
    if (!to) return;
    let alive = true;
    const url = `https://router.project-osrm.org/route/v1/driving/${from[1]},${from[0]};${to[1]},${to[0]}?overview=full&geometries=geojson`;
    fetch(url)
      .then((r) => r.json())
      .then((d) => {
        if (!alive) return;
        if (d.code === "Ok" && d.routes?.[0])
          setCoords(d.routes[0].geometry.coordinates.map((c: number[]) => [c[1], c[0]]));
        else setCoords([from, to]);
      })
      .catch(() => alive && setCoords([from, to]));
    return () => {
      alive = false;
    };
  }, [port?.id, mode]);
  return coords;
}

export function PortMap({
  ports,
  selected,
  onSelect,
  goodId,
  direction,
  routeMode,
  interactive = true,
}: {
  ports: BorderCrossing[];
  selected: BorderCrossing | null;
  onSelect?: (p: BorderCrossing) => void;
  goodId?: string | null;
  direction?: Direction;
  routeMode?: RouteMode;
  interactive?: boolean;
}) {
  const route = useRoute(selected, routeMode ?? null);
  const points = useMemo(() => ports.map((p) => toLatLng(p.lat, p.lng)), [ports]);
  const fitKey = ports.map((p) => p.id).join(",");

  return (
    <MapContainer
      center={CENTER}
      zoom={5}
      minZoom={4}
      zoomControl={interactive}
      scrollWheelZoom={interactive}
      dragging={interactive}
      style={{ height: "100%", width: "100%" }}
      attributionControl
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> хувь нэмэр оруулагчид'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxZoom={19}
      />
      {!selected && <FitAll points={points} trigger={fitKey} />}
      <Fly target={selected ? toLatLng(selected.lat, selected.lng) : null} />
      {route.length > 0 && (
        <Polyline positions={route} pathOptions={{ color: "#c4272f", weight: 3, opacity: 0.75, dashArray: "6 5" }} />
      )}
      {ports.map((p) => {
        let status: CellStatus | null = null;
        if (goodId) {
          const c = cellFor(p, goodId);
          status = direction === "export" ? c.export : c.import;
        }
        const isSel = selected?.id === p.id;
        return (
          <Marker
            key={p.id}
            position={toLatLng(p.lat, p.lng)}
            icon={iconFor(p, status, isSel)}
            zIndexOffset={isSel ? 1000 : status === "allowed" ? 500 : 0}
            eventHandlers={onSelect ? { click: () => onSelect(p) } : undefined}
            keyboard
            title={p.name}
          >
            <Tooltip direction="top" offset={[0, -8]} className="port-tip">
              {p.name}
            </Tooltip>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
