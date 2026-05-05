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
        pathOptions={{ color, weight: 4, opacity: 0.8, lineCap: 'round' }}
        interactive={false}
      />
      {markerPos && (
        <Marker 
          position={markerPos} 
          zIndexOffset={2000}
          interactive={false}
          icon={L.divIcon({ 
            className: 'route-dist-label', 
            html: `<div style="background: ${color}; color: white; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 900; white-space: nowrap; border: 2px solid white; box-shadow: 0 4px 10px rgba(0,0,0,0.3); transform: rotate(${distanceMode === 'ub' ? '-5deg' : '5deg'}); position: relative; z-index: 2000;">${label}</div>`,
            iconSize: [120, 30],
            iconAnchor: [60, 15]
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

  // Only show distance pill for the SELECTED border when in distance mode
  // This keeps the map cleaner by keeping other ports as pins
  if (distanceMode && isSelected) {
    const dist = distanceMode === 'ub' ? border.ubDistance : border.aimagDistance;
    return L.divIcon({
      className: "distance-pill-icon",
      html: `
        <div style="background: white; border: 2px solid ${color}; border-radius: 20px; padding: 4px 12px; box-shadow: 0 10px 15px -3px rgba(0,0,0,0.2); white-space: nowrap; display: flex; align-items: center; gap: 6px; transform: scale(1.2); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-bottom-right-radius: 4px; position: relative; z-index: 100;">
          <span style="font-size: 13px; font-weight: 1000; color: ${color}">${dist}</span>
          <span style="font-size: 9px; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em;">KM</span>
        </div>
      `,
      iconSize: [80, 40],
      iconAnchor: [40, 20],
    });
  }

  const pinSize = isSelected ? 42 : 32;
  
  return L.divIcon({
    className: "custom-port-icon",
    html: `
      <div style="
        width: ${pinSize}px;
        height: ${pinSize}px;
        transform: ${isSelected ? 'scale(1.1)' : 'scale(1)'};
        transition: transform 0.2s ease;
        position: relative;
        z-index: ${isSelected ? 1000 : 20};
        cursor: pointer;
      ">
        <svg viewBox="0 0 24 24" style="width: 100%; height: 100%; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="7" fill="white" />
        </svg>
        <div style="position: absolute; top: 40%; left: 50%; transform: translate(-50%, -50%); font-size: ${pinSize * 0.4}px;">
          ${goodIcon || '📍'}
        </div>
      </div>
    `,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize], // Anchor at the tip of the pin
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

interface BorderMarkerProps {
  border: BorderCrossing;
  isSelected: boolean;
  selectedGood?: Good;
  goodStatus?: GoodStatus;
  distanceMode: 'ub' | 'aimag' | null;
  onSelect: (border: BorderCrossing) => void;
}

function BorderMarker({ border, isSelected, selectedGood, goodStatus, distanceMode, onSelect }: BorderMarkerProps) {
  const markerRef = React.useRef<L.Marker>(null);
  const pinSize = isSelected ? 42 : 32;

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[border.lat, border.lng]}
      icon={createCustomIcon(border, isSelected, selectedGood?.icon, goodStatus, distanceMode)}
      eventHandlers={{
        click: () => onSelect(border),
      }}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -pinSize]} 
        className="font-bold text-[10px] uppercase tracking-wider border-0 shadow-md rounded-lg pointer-events-none" 
        permanent={isSelected}
        interactive={false}
      >
        {border.name}
      </Tooltip>

      <Popup minWidth={240} className="custom-info-popup">
        <div className="w-[240px] flex flex-col gap-3 font-sans">
          {/* HEADER */}
          <div className="text-center border-b border-gray-100 pb-2">
            <h3 className="text-lg font-black text-slate-800 leading-tight">{border.name}</h3>
          </div>

          {/* IMPORT SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[9px] font-black uppercase tracking-wider">
                <span className="text-xs">↓</span> ИМПОРТ
              </div>
              <span className="text-[10px] font-bold text-slate-400">{border.legalImports.length} төрөл</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {border.legalImports.slice(0, 8).map((imp, idx) => {
                const good = GOODS.find(g => g.id === imp.goodId);
                const resMatch = imp.resolutions[0]?.match(/\d+/);
                const resLabel = resMatch ? `#${resMatch[0]}` : (imp.resolutions[0] || '...');
                return (
                  <div key={idx} className="flex flex-col items-center p-1 bg-emerald-50/50 border border-emerald-100 rounded-lg group transition-all hover:border-emerald-300">
                    <span className="text-lg mb-0.5">{good?.icon || '📦'}</span>
                    <span className="text-[8px] font-black text-emerald-700 truncate w-full text-center">{resLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXPORT SECTION */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded text-[9px] font-black uppercase tracking-wider">
                <span className="text-xs">↑</span> ЭКСПОРТ
              </div>
              <span className="text-[10px] font-bold text-slate-400">{border.legalExports.length} төрөл</span>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {border.legalExports.slice(0, 8).map((exp, idx) => {
                const good = GOODS.find(g => g.id === exp.goodId);
                const resMatch = exp.resolutions[0]?.match(/\d+/);
                const resLabel = resMatch ? `#${resMatch[0]}` : (exp.resolutions[0] || '...');
                return (
                  <div key={idx} className="flex flex-col items-center p-1 bg-indigo-50/50 border border-indigo-100 rounded-lg group transition-all hover:border-indigo-300">
                    <span className="text-lg mb-0.5">{good?.icon || '📦'}</span>
                    <span className="text-[8px] font-black text-indigo-700 truncate w-full text-center">{resLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* LABORATORY SECTION */}
          {border.hasLaboratory && (
            <div className="mt-1 p-2 bg-teal-50/50 border border-teal-100 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs">🔬</span>
                <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest">Гаалийн лаборатори</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {border.labCapabilities?.slice(0, 2).map((cap, idx) => (
                  <div key={idx} className="bg-white border border-teal-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-teal-800">
                    {cap}
                  </div>
                ))}
                {(border.labCapabilities?.length || 0) > 2 && (
                  <span className="text-[9px] font-bold text-teal-400 self-center pl-1">
                    +{(border.labCapabilities?.length || 0) - 2}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
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

        {filteredBorders.map((border) => (
          <BorderMarker
            key={border.id}
            border={border}
            isSelected={selectedBorder?.id === border.id}
            selectedGood={selectedGood}
            goodStatus={globalFilter.goodId ? 'ok' : undefined}
            distanceMode={distanceMode}
            onSelect={onSelect}
          />
        ))}
      </MapContainer>

      {/* Distance Mode Buttons - Moved to Bottom Right */}
      <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
        {(['ub', 'aimag'] as const).map(mode => (
          <button
            key={String(mode)}
            onClick={() => onDistanceModeChange(distanceMode === mode ? null : mode)}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border shadow-2xl flex items-center gap-2 ${
              distanceMode === mode 
                ? "bg-blue-600 text-white border-blue-700 scale-105" 
                : "bg-white text-gray-600 border-gray-100 hover:bg-gray-50"
            }`}
          >
            <span className="text-sm">{mode === 'ub' ? '🏢' : '🏘️'}</span>
            {mode === 'ub' ? 'УБ хүртэл' : 'Төв хүртэл'}
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
