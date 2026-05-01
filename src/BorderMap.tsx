import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BorderCrossing, Direction, GoodStatus, PortTransportType } from "./types";
import { PORT_GOODS, GOODS } from "./data";

const UB_LAT = 47.9200;
const UB_LNG = 106.9200;

interface RouteLayerProps {
  selectedBorder: BorderCrossing | null;
  distanceMode: 'ub' | 'aimag' | null;
}

function RouteLayer({ selectedBorder, distanceMode }: RouteLayerProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Reset route when inputs change or are cleared
    setRouteCoords([]);
    
    if (!selectedBorder || !distanceMode) {
      return;
    }

    let endLat = UB_LAT;
    let endLng = UB_LNG;

    if (distanceMode === 'aimag') {
      if (selectedBorder.aimagLat && selectedBorder.aimagLng) {
        endLat = selectedBorder.aimagLat;
        endLng = selectedBorder.aimagLng;
      } else {
        console.warn(`No aimag coordinates for ${selectedBorder.name}`);
        return;
      }
    }

    const fetchRoute = async () => {
      setIsLoading(true);
      try {
        // OSRM expects: [longitude,latitude]
        const start = `${selectedBorder.lng},${selectedBorder.lat}`;
        const end = `${endLng},${endLat}`;
        const url = `https://router.project-osrm.org/route/v1/driving/${start};${end}?overview=full&geometries=geojson`;
        
        console.log(`Fetching route for ${selectedBorder.name} (${distanceMode}):`, url);
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        
        const data = await response.json();

        if (data.code === 'Ok' && data.routes && data.routes[0]) {
          // OSRM returns GeoJSON coordinates as [lng, lat]. 
          // Leaflet Polyline expects [lat, lng].
          const flippedCoords = data.routes[0].geometry.coordinates.map((c: [number, number]) => [c[1], c[0]]);
          console.log(`Route fetched successfully: ${flippedCoords.length} points`);
          setRouteCoords(flippedCoords);
        } else {
          console.error("OSRM returned non-Ok code:", data.code);
        }
      } catch (error) {
        console.error("OSRM Routing API Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRoute();
  }, [selectedBorder, distanceMode]);

  if (routeCoords.length === 0) return null;

  return (
    <Polyline 
      positions={routeCoords}
      pathOptions={{
        color: distanceMode === 'ub' ? '#2563eb' : '#10b981',
        weight: 4,
        dashArray: '8, 12',
        lineCap: 'round',
        opacity: 0.9,
        lineJoin: 'round'
      }}
    />
  );
}

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
  onSelect: (border: BorderCrossing | null) => void;
  globalFilter: {
    goodId: string | null;
    direction: Direction;
  };
  distanceMode: 'ub' | 'aimag' | null;
  onDistanceModeChange: (mode: 'ub' | 'aimag' | null) => void;
}

const getMarkerColor = (id: string, status: string, goodStatus?: GoodStatus) => {
  if (goodStatus) {
    switch (goodStatus) {
      case "ok": return "#10b981"; 
      case "warn": return "#f97316"; 
      case "crit": return "#ef4444"; 
      default: return "#3b82f6";
    }
  }

  // Categories Mapping
  switch (status) {
    case "Олон улсын": return "#2563eb"; 
    case "Хоёр талын": return "#f59e0b"; 
    case "Түр ажиллагаатай": return "#64748b"; 
    default: return "#3b82f6";
  }
};

// Custom marker icon with location pin emoji
const createCustomIcon = (
  border: BorderCrossing, 
  isSelected: boolean, 
  goodIcon?: string, 
  goodStatus?: GoodStatus,
  distanceMode?: 'ub' | 'aimag' | null,
  activeFilter?: { goodId: string | null; direction: Direction }
) => {
  const color = getMarkerColor(border.id, border.operationalStatus, goodStatus);

  if (distanceMode) {
    const dist = distanceMode === 'ub' ? border.ubDistance : border.aimagDistance;
    return L.divIcon({
      className: "distance-pill-icon",
      html: `
        <div style="
          background: white;
          border: 2px solid ${color};
          border-radius: 20px;
          padding: 2px 10px;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15);
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: all 0.2s ease;
        ">
          <span style="font-size: 11px; font-weight: 900; color: ${color}">${dist}</span>
          <span style="font-size: 8px; font-weight: 700; color: #94a3b8">KM</span>
        </div>
      `,
      iconSize: [64, 28],
      iconAnchor: [32, 14],
    });
  }

  const allGoodsForPort = PORT_GOODS[border.id] || {};
  const filterDir = activeFilter?.direction || 'import';
  
  const clusterIcons = GOODS.filter(g => {
    const status = allGoodsForPort[g.id]?.[filterDir];
    if (activeFilter?.goodId) {
       return status === 'ok' || status === 'warn' || status === 'crit';
    }
    return status === 'ok';
  }).slice(0, 4);

  const size = isSelected ? 40 : 32;
  
  return L.divIcon({
    className: "custom-port-icon",
    html: `
      <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
        <!-- Custom SVG Map Pin (Dimmed) -->
        <div style="
          width: ${size}px;
          height: ${size}px;
          filter: drop-shadow(0 4px 3px rgba(0,0,0,0.3));
          transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'};
          transition: transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0.4;
        ">
          <svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="${color}" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
        </div>

        <!-- Port Info (Below Pin Tip) -->
        <div style="
          display: flex;
          flex-direction: column;
          align-items: center;
          pointer-events: auto;
          margin-top: 2px;
        ">
            <div style="
              background: white;
              padding: 3px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 700;
              color: #1e293b;
              box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
              border: 1px solid ${color}44;
              white-space: nowrap;
              font-family: 'Inter', sans-serif;
              letter-spacing: -0.01em;
            ">
              ${border.name}
            </div>
        </div>
      </div>
    `,
    iconSize: [size * 2, size + 40],
    iconAnchor: [size, size],
  });
};

function ChangeView({ center, zoom = 7 }: { center: [number, number], zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true, duration: 1.5 });
  }, [center, map, zoom]);
  return null;
}

export function BorderMap({ borders, selectedBorder, onSelect, globalFilter, distanceMode, onDistanceModeChange }: BorderMapProps) {
  const [activeStatusFilter, setActiveStatusFilter] = React.useState<string | null>(null);
  const [activeTransportFilter, setActiveTransportFilter] = React.useState<PortTransportType | null>(null);
  const mongoliaCenter: [number, number] = [46.8625, 103.8467];
  const selectedGood = GOODS.find(g => g.id === globalFilter.goodId);

  const statusCounts = borders.reduce((acc, b) => {
    acc[b.operationalStatus] = (acc[b.operationalStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const transportCounts = borders.reduce((acc, b) => {
    b.transportTypes.forEach(t => {
      acc[t] = (acc[t] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const filteredBorders = borders.filter(b => {
    const matchesStatus = !activeStatusFilter || b.operationalStatus === activeStatusFilter;
    const matchesTransport = !activeTransportFilter || b.transportTypes.includes(activeTransportFilter);
    return matchesStatus && matchesTransport;
  });

  const toggleStatusFilter = (status: string) => {
    setActiveStatusFilter(prev => prev === status ? null : status);
  };

  const toggleTransportFilter = (type: PortTransportType) => {
    setActiveTransportFilter(prev => prev === type ? null : type);
  };

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

        <RouteLayer selectedBorder={selectedBorder} distanceMode={distanceMode as any} />

        {filteredBorders.map((border) => {
          const isSelected = selectedBorder?.id === border.id;
          
          let goodStatus: GoodStatus | undefined = undefined;
          if (globalFilter.goodId) {
            goodStatus = PORT_GOODS[border.id]?.[globalFilter.goodId]?.[globalFilter.direction];
            if (!goodStatus) return null;
          }

          return (
            <Marker
              key={border.id}
              position={[border.lat, border.lng]}
              icon={createCustomIcon(border, isSelected, selectedGood?.icon, goodStatus, distanceMode, globalFilter)}
              eventHandlers={{
                click: () => onSelect(border),
              }}
            />
          );
        })}
      </MapContainer>

      {/* Distance Mode Toggle Buttons */}
      <div className="absolute top-6 left-6 z-[1000] flex gap-2">
        {(['ub', 'aimag', null] as const).map(mode => (
          <button
            key={String(mode)}
            onClick={() => onDistanceModeChange(mode)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-xl ${
              distanceMode === mode 
                ? "bg-blue-600 text-white border-blue-700 ring-4 ring-blue-500/20" 
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {mode === 'ub' ? 'УБ-аас' : mode === 'aimag' ? 'Аймгийн төвөөс' : 'Хаах'}
          </button>
        ))}
      </div>

      {/* Map Legend Overlay */}
      <div className="absolute top-6 right-6 z-[1000] bg-white/90 backdrop-blur-md p-4 rounded-xl border border-gray-200 shadow-xl space-y-3 w-52 overflow-hidden">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Тайлбар</h4>
          {(activeStatusFilter || activeTransportFilter) && (
            <button 
              onClick={() => { setActiveStatusFilter(null); setActiveTransportFilter(null); }}
              className="text-[9px] font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded transition-colors"
            >
              Цэвэрлэх
            </button>
          )}
        </div>
        <div className="space-y-1">
          {[
            { status: "Олон улсын", color: "bg-blue-600" },
            { status: "Хоёр талын", color: "bg-amber-500" },
            { status: "Түр ажиллагаатай", color: "bg-slate-500" }
          ].map(({ status, color }) => (
            <button
              key={status}
              onClick={() => toggleStatusFilter(status)}
              className={`w-full flex items-center justify-between p-1.5 rounded-lg transition-all ${
                activeStatusFilter === status 
                  ? "bg-blue-50 ring-1 ring-blue-100 shadow-sm" 
                  : "hover:bg-gray-100"
              } ${activeStatusFilter && activeStatusFilter !== status ? "opacity-40 grayscale" : "opacity-100"}`}
            >
              <div className="flex items-center gap-2.5">
                <div className={`w-2 h-2 rounded-full ${color} shadow-sm`} />
                <span className="text-[11px] font-bold text-gray-700">{status}</span>
              </div>
              <span className="text-[10px] font-black font-mono text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
                {(statusCounts as any)[status] || 0}
              </span>
            </button>
          ))}
        </div>
        
        <div className="pt-2 border-t border-gray-100">
           <div className="flex flex-wrap gap-1">
             {[
               { type: "Автозам", icon: "🚗", label: "Авто" },
               { type: "Төмөр зам", icon: "🚂", label: "Төмөр" },
               { type: "AGV", icon: "📡", label: "AGV" },
               { type: "Агаар", icon: "✈️", label: "Агаар" }
             ].map(({ type, icon, label }) => (
               <button
                 key={type}
                 onClick={() => toggleTransportFilter(type as PortTransportType)}
                 className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
                   activeTransportFilter === type 
                     ? "bg-gray-900 text-white shadow-md scale-105" 
                     : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                 } ${activeTransportFilter && activeTransportFilter !== type ? "opacity-30 grayscale" : "opacity-100"}`}
               >
                 <span className="text-[10px]">{icon}</span>
                 <span className="text-[9px] font-black uppercase tracking-tighter">{label}</span>
                 <span className={`text-[8px] ml-1 px-1 rounded ${activeTransportFilter === type ? 'bg-white/20' : 'bg-gray-200 text-gray-500'}`}>
                   {transportCounts[type] || 0}
                 </span>
               </button>
             ))}
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
