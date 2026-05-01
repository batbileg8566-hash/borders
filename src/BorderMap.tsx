import React, { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BorderCrossing, Direction } from "./types";
import { PORT_GOODS, GOODS } from "./data";

// Fix for default Leaflet icons in Vite
// @ts-ignore
import icon from "leaflet/dist/images/marker-icon.png";
// @ts-ignore
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface BorderMapProps {
  borders: BorderCrossing[];
  selectedBorder: BorderCrossing | null;
  onSelect: (border: BorderCrossing) => void;
  globalFilter: {
    goodId: string | null;
    direction: Direction;
  };
}

const getMarkerColor = (id: string, status: string) => {
  switch (status) {
    case "Хэвийн": return "#22c55e"; 
    case "Ачаалалтай": return "#f97316";
    case "Квот тулсан": return "#ef4444";
    default: return "#3b82f6";
  }
};

// Custom circle marker icon
const createCircleIcon = (id: string, status: string, isSelected: boolean, isDimmed: boolean, goodIcon?: string) => {
  const color = getMarkerColor(id, status);
  const size = goodIcon ? (isSelected ? 34 : 28) : (isSelected ? 20 : 16);
  const opacity = isDimmed ? 0.3 : 1;
  
  return L.divIcon({
    className: "custom-div-icon",
    html: `
      <div style="
        background-color: ${goodIcon ? 'white' : color};
        width: ${size}px;
        height: ${size}px;
        border-radius: ${goodIcon ? '8px' : '50%'};
        border: 2px solid ${goodIcon ? color : 'white'};
        box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
        opacity: ${opacity};
        position: relative;
      ">
        ${goodIcon ? `<span style="font-size: ${size * 0.6}px;">${goodIcon}</span>` : ''}
        ${!goodIcon && isSelected ? '<div style="width: 6px; height: 6px; background: white; border-radius: 50%;"></div>' : ''}
        ${goodIcon ? `
          <div style="
            position: absolute;
            bottom: -2px;
            right: -2px;
            width: 12px;
            height: 12px;
            background-color: ${color};
            border-radius: 50%;
            border: 2px solid white;
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
};

function ChangeView({ center, zoom = 7 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.5 });
  }, [center, map, zoom]);
  return null;
}

export function BorderMap({ borders, selectedBorder, onSelect, globalFilter }: BorderMapProps) {
  const mongoliaCenter: [number, number] = [46.8625, 103.8467];
  const selectedGood = GOODS.find(g => g.id === globalFilter.goodId);

  return (
    <div className="flex-1 relative h-full">
      <MapContainer
        center={mongoliaCenter}
        zoom={5}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {selectedBorder ? (
          <ChangeView center={[selectedBorder.lat, selectedBorder.lng]} zoom={8} />
        ) : (
          <ChangeView center={mongoliaCenter} zoom={5} />
        )}

        {borders.map((border) => {
          const isSelected = selectedBorder?.id === border.id;
          
          let isDimmed = false;
          if (globalFilter.goodId) {
            const status = PORT_GOODS[border.id]?.[globalFilter.goodId]?.[globalFilter.direction];
            // Only highlight if status exists and is 'ok' (following request logic)
            // But usually, one might want to see 'warn' too. 
            // The prompt says: "highlight ONLY the ports that allow this good for the selected direction"
            // I'll define "allow" as status existence AND not being null (ok, warn, crit are all levels of 'allow' with different legal requirements)
            // However, "ok" usually means standard allowed.
            // Let's stick to status existence for "allow".
            if (!status || status === undefined) {
              isDimmed = true;
            }
          }

          return (
            <Marker
              key={border.id}
              position={[border.lat, border.lng]}
              icon={createCircleIcon(border.id, border.status, isSelected, isDimmed, selectedGood?.icon)}
              eventHandlers={{
                click: () => onSelect(border),
              }}
            >
              <Tooltip 
                permanent 
                direction="bottom" 
                offset={[0, 10]}
                className="bg-white/40 backdrop-blur-sm border-none shadow-none text-[10px] font-bold px-1 py-0 rounded opacity-40"
              >
                {border.name}
              </Tooltip>
              <Popup className="custom-popup" closeButton={false}>
                <div className="p-2 min-w-[140px] font-sans">
                  <div className="text-[9px] uppercase font-bold text-gray-400 tracking-widest mb-0.5">БООМТ</div>
                  <h3 className="font-bold text-base text-[#111827]">{border.name}</h3>
                  <div className="flex flex-col gap-1.5 mt-2 text-xs">
                    <div className="flex justify-between items-center text-gray-500 font-medium">
                      <span>Аймаг:</span>
                      <span className="text-[#111827]">{border.region}</span>
                    </div>
                    <div className="flex justify-between items-center text-gray-500 font-medium">
                      <span>УБ-аас:</span>
                      <span className="text-blue-600 font-mono font-bold">{border.ubDistance}км</span>
                    </div>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map Legend Overlay */}
      <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 shadow-xl space-y-3 pointer-events-none w-44">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Тайлбар</h4>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm" />
            <span className="text-[11px] font-semibold text-gray-700">Хэвийн</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shadow-sm" />
            <span className="text-[11px] font-semibold text-gray-700">Ачаалалтай</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-sm" />
            <span className="text-[11px] font-semibold text-gray-700">Квот тулсан</span>
          </div>
        </div>
        <div className="pt-2 border-t border-gray-100 flex flex-col gap-1.5">
           <div className="flex items-center gap-2">
             <input type="checkbox" checked readOnly className="w-3 h-3 rounded" />
             <span className="text-[9px] font-medium text-gray-500 uppercase tracking-tighter">Хил орчмын бүс</span>
           </div>
           <div className="flex items-center gap-2">
             <input type="checkbox" checked readOnly className="w-3 h-3 rounded" />
             <span className="text-[9px] font-medium text-gray-500 uppercase tracking-tighter">Замын сүлжээ</span>
           </div>
        </div>
      </div>
    </div>
  );
}
