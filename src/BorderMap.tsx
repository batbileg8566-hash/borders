import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BorderCrossing, Direction, GoodStatus, PortTransportType } from "./types";
import { GOODS } from "./data";
import { portStatusColorMap } from "./Sidebar";

const UB_LAT = 47.9200;
const UB_LNG = 106.9200;

const isValidLatLng = (lat: any, lng: any) => {
  if (typeof lat !== 'number' || typeof lng !== 'number' || !isFinite(lat) || !isFinite(lng)) {
    return false;
  }
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

interface RoutesLayerProps {
  selectedBorder: BorderCrossing | null;
  distanceMode: 'ub' | 'aimag' | null;
}

function RoutesLayer({ selectedBorder, distanceMode }: RoutesLayerProps) {
  const [routeCoords, setRouteCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    let isMounted = true;
    
    if (!selectedBorder || !distanceMode) {
      setRouteCoords([]);
      return;
    }

    const fetchRoute = async () => {
      let destLat, destLng;

      if (distanceMode === 'ub') {
        destLat = UB_LAT; 
        destLng = UB_LNG;
      } else if (distanceMode === 'aimag') {
        destLat = selectedBorder.aimagLat;
        destLng = selectedBorder.aimagLng;
      }

      if (!isValidLatLng(selectedBorder.lat, selectedBorder.lng) || !isValidLatLng(destLat, destLng)) {
        setRouteCoords([]);
        return;
      }

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${selectedBorder.lng},${selectedBorder.lat};${destLng},${destLat}?overview=full&geometries=geojson`;
        
        const response = await fetch(url);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (!isMounted) return;
        
        if (!data || data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
          setRouteCoords([]);
          return;
        }

        const route = data.routes[0];
        if (route && route.geometry && Array.isArray(route.geometry.coordinates)) {
          const coords = route.geometry.coordinates;
          const flippedCoords = coords.map((c: any) => [c[1], c[0]] as [number, number]);
          if (isMounted) setRouteCoords(flippedCoords);
        }
      } catch (error) {
        console.error("OSRM API алдаа:", error);
        if (isMounted) setRouteCoords([]);
      }
    };

    fetchRoute();
    return () => { isMounted = false; };
  }, [selectedBorder, distanceMode]);

  if (routeCoords.length <= 1) return null;

  const color = distanceMode === 'ub' ? '#2563eb' : '#10b981';
  const label = distanceMode === 'ub' ? `УБ хүртэл: ${selectedBorder?.ubDistance} КМ` : `Төв хүртэл: ${selectedBorder?.aimagDistance} КМ`;

  const mid = Math.floor(routeCoords.length / 2);
  const markerPos = routeCoords[mid];

  return (
    <>
      <Polyline 
        positions={routeCoords}
        pathOptions={{ color, weight: 4, opacity: 0.6, lineCap: 'round' }}
      />
      {markerPos && (
        <Marker 
          position={markerPos} 
          icon={L.divIcon({ 
            className: 'route-dist-label', 
            html: `<div style="background: ${color}; color: white; padding: 2px 6px; border-radius: 6px; font-size: 10px; font-weight: 900; white-space: nowrap; border: 2px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.1); transform: rotate(${distanceMode === 'ub' ? '-10deg' : '10deg'});">${label}</div>`,
            iconSize: [100, 24],
            iconAnchor: [50, 12]
          })} 
        />
      )}
    </>
  );
}

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

const getMarkerColor = (id: string, status: string, goodStatus?: GoodStatus) => {
  if (goodStatus) {
    if (goodStatus === "ok") return "#10b981";
    if (goodStatus === "warn") return "#f97316";
    if (goodStatus === "crit") return "#ef4444";
  }
  switch (status) {
    case "Олон улсын": return "#2563eb"; 
    case "Хоёр талын": return "#f59e0b"; 
    case "Түр ажиллагаатай": return "#64748b"; 
    default: return "#3b82f6";
  }
};

const createCustomIcon = (
  border: BorderCrossing, 
  isSelected: boolean, 
  goodIcon?: string, 
  goodStatus?: GoodStatus,
  distanceMode?: 'ub' | 'aimag' | null
) => {
  const color = getMarkerColor(border.id, border.operationalStatus, goodStatus);

  if (distanceMode) {
    const dist = distanceMode === 'ub' ? border.ubDistance : border.aimagDistance;
    return L.divIcon({
      className: "distance-pill-icon",
      html: `
        <div style="background: white; border: 2px solid ${color}; border-radius: 20px; padding: 2px 10px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.15); white-space: nowrap; display: flex; align-items: center; gap: 4px; transform: ${isSelected ? 'scale(1.2)' : 'scale(1)'}; transition: all 0.2s ease;">
          <span style="font-size: 11px; font-weight: 900; color: ${color}">${dist}</span>
          <span style="font-size: 8px; font-weight: 700; color: #94a3b8">KM</span>
        </div>
      `,
      iconSize: [64, 28],
      iconAnchor: [32, 14],
    });
  }

  const pinSize = isSelected ? 42 : 32;
  const labelWidth = 140;
  const containerWidth = labelWidth;
  const containerHeight = pinSize + 40; // Pin + Gap + Label
  
  return L.divIcon({
    className: "custom-port-icon",
    html: `
      <div style="width: ${containerWidth}px; height: ${containerHeight}px; display: flex; flex-direction: column; align-items: center; justify-content: flex-start; pointer-events: none;">
        
        <!-- PIN at the TOP center of this container -->
        <div style="
          width: ${pinSize}px;
          height: ${pinSize}px;
          transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
          transition: transform 0.3s ease;
          cursor: pointer;
          pointer-events: auto;
          position: relative;
          z-index: 20;
        ">
          <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" fill="${color}" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
            <circle cx="12" cy="9" r="7" fill="white" />
          </svg>
          <div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); font-size: ${pinSize * 0.4}px;">
            ${goodIcon || '📍'}
          </div>
        </div>

        <!-- Name Label BELOW the pin -->
        <div style="
          background: white;
          padding: 2px 8px;
          border-radius: 6px;
          font-size: 10px;
          font-weight: 800;
          color: #1e293b;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          border: 1.5px solid ${color};
          margin-top: 2px;
          pointer-events: auto;
          white-space: nowrap;
          z-index: 10;
        ">
          ${border.name}
        </div>
      </div>
    `,
    iconSize: [containerWidth, containerHeight],
    iconAnchor: [containerWidth / 2, pinSize * 0.9], // Anchor at where the pin tip is (approx 90% of pin height)
  });
};

function ChangeView({ lat, lng, zoom = 7 }: { lat: number, lng: number, zoom?: number }) {
  const map = useMap();
  useEffect(() => {
    if (isValidLatLng(lat, lng)) {
      map.flyTo([lat, lng], zoom, { animate: true, duration: 1.5 });
    }
  }, [lat, lng, map, zoom]);
  return null;
}

export function BorderMap({ borders, selectedBorder, onSelect, globalFilter, distanceMode, onDistanceModeChange }: BorderMapProps) {
  const mongoliaCenter: [number, number] = [46.8625, 103.8467];
  const selectedGood = GOODS.find(g => g.id === globalFilter.goodId);

  const filteredBorders = borders.filter(b => {
    if (globalFilter.goodId) {
      const isLegalImport = b.legalImports?.some(li => li.goodId === globalFilter.goodId);
      const isLegalExport = b.legalExports?.some(le => le.goodId === globalFilter.goodId);
      return globalFilter.direction === 'import' ? isLegalImport : isLegalExport;
    }
    return true;
  });

  return (
    <div className="flex-1 relative h-full">
      <MapContainer
        center={mongoliaCenter}
        zoom={5}
        style={{ height: "100%", width: "100%" }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />
        
        {selectedBorder && isValidLatLng(selectedBorder.lat, selectedBorder.lng) ? (
          <ChangeView lat={selectedBorder.lat} lng={selectedBorder.lng} zoom={8} />
        ) : (
          <ChangeView lat={mongoliaCenter[0]} lng={mongoliaCenter[1]} zoom={5} />
        )}

        <RoutesLayer selectedBorder={selectedBorder} distanceMode={distanceMode} />

        {filteredBorders.map((border) => {
          const isSelected = selectedBorder?.id === border.id;
          const pinSize = isSelected ? 42 : 32;
          
          let goodStatus: GoodStatus | undefined = undefined;
          if (globalFilter.goodId) {
            goodStatus = 'ok';
          }

          return (
            <Marker
              key={border.id}
              position={[border.lat, border.lng]}
              icon={createCustomIcon(border, isSelected, selectedGood?.icon, goodStatus, distanceMode)}
              eventHandlers={{
                click: () => onSelect(border),
              }}
            >
              {isSelected && (
                <Popup closeButton={false} className="custom-popup" offset={[0, -pinSize * 0.5]}>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center justify-between mb-2">
                       <span className={`px-2 py-0.5 text-white text-[9px] font-black uppercase rounded ${portStatusColorMap[border.operationalStatus]}`}>
                        {border.operationalStatus}
                       </span>
                       <span className="text-[10px] text-gray-400 font-black font-mono">#{border.id.toUpperCase()}</span>
                    </div>
                    <h3 className="text-sm font-black text-gray-900 border-b border-gray-100 pb-1 mb-2">{border.name}</h3>
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400 font-bold uppercase">Төвөөс:</span>
                        <span className="text-emerald-600 font-black">{border.aimagDistance} КМ</span>
                      </div>
                      <div className="flex justify-between text-[10px]">
                        <span className="text-gray-400 font-bold uppercase">УБ-аас:</span>
                        <span className="text-blue-600 font-black">{border.ubDistance} КМ</span>
                      </div>
                      {border.hasLaboratory && (
                        <div className="mt-2 flex items-center gap-1.5 bg-teal-50 px-2 py-1 rounded text-teal-700 text-[9px] font-black uppercase">
                          <span>🔬</span> Лабораторитой
                        </div>
                      )}
                    </div>
                  </div>
                </Popup>
              )}
            </Marker>
          );
        })}
      </MapContainer>

      {/* Basic Filters */}
      <div className="absolute top-6 left-6 z-[1000] flex gap-2">
        {(['ub', 'aimag', null] as const).map(mode => (
          <button
            key={String(mode)}
            onClick={() => onDistanceModeChange(mode)}
            className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all border shadow-xl ${
              distanceMode === mode 
                ? "bg-blue-600 text-white border-blue-700" 
                : "bg-white text-gray-600 border-gray-200"
            }`}
          >
            {mode === 'ub' ? 'УБ-аас' : mode === 'aimag' ? 'Аймгийн төвөөс' : 'Хаах'}
          </button>
        ))}
      </div>
    </div>
  );
}

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
