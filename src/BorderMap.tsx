import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Tooltip, Polyline } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { BorderCrossing, Direction, GoodStatus, PortTransportType, Good } from "./types";
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

function RoutesLayer({ selectedBorder }: { selectedBorder: BorderCrossing | null }) {
  const [ubCoords, setUbCoords] = useState<[number, number][]>([]);
  const [aimagCoords, setAimagCoords] = useState<[number, number][]>([]);

  useEffect(() => {
    let isMounted = true;
    if (!selectedBorder) {
      setUbCoords([]);
      setAimagCoords([]);
      return;
    }

    const fetchRoutes = async () => {
      if (!isValidLatLng(selectedBorder.lat, selectedBorder.lng)) return;

      // UB Route
      try {
        const ubUrl = `https://router.project-osrm.org/route/v1/driving/${selectedBorder.lng},${selectedBorder.lat};${UB_LNG},${UB_LAT}?overview=full&geometries=geojson`;
        const res = await fetch(ubUrl);
        const data = await res.json();
        if (isMounted && data.code === 'Ok' && data.routes?.[0]) {
          const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
          setUbCoords(coords);
        }
      } catch (e) { 
        // Fallback to straight line if OSRM fails
        if (isMounted) setUbCoords([[selectedBorder.lat, selectedBorder.lng], [UB_LAT, UB_LNG]]);
      }

      // Aimag Route
      if (isValidLatLng(selectedBorder.aimagLat, selectedBorder.aimagLng)) {
        try {
          const aimagUrl = `https://router.project-osrm.org/route/v1/driving/${selectedBorder.lng},${selectedBorder.lat};${selectedBorder.aimagLng},${selectedBorder.aimagLat}?overview=full&geometries=geojson`;
          const res = await fetch(aimagUrl);
          const data = await res.json();
          if (isMounted && data.code === 'Ok' && data.routes?.[0]) {
            const coords = data.routes[0].geometry.coordinates.map((c: any) => [c[1], c[0]]);
            setAimagCoords(coords);
          }
        } catch (e) {
            // Fallback to straight line
            if (isMounted) setAimagCoords([[selectedBorder.lat, selectedBorder.lng], [selectedBorder.aimagLat!, selectedBorder.aimagLng!]]);
        }
      } else {
        setAimagCoords([]);
      }
    };

    fetchRoutes();
    return () => { isMounted = false; };
  }, [selectedBorder]);

  return (
    <>
      {ubCoords.length > 0 && (
        <Polyline 
          positions={ubCoords}
          pathOptions={{ color: '#2563eb', weight: 2.8, opacity: 0.6 }}
        />
      )}
      {aimagCoords.length > 0 && (
        <Polyline 
          positions={aimagCoords}
          pathOptions={{ color: '#10b981', weight: 2.8, opacity: 0.8 }}
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

const GOOD_LAB_KEYWORDS: Record<string, string[]> = {
  plant: ['ургамал', 'хорио цээр', 'хүнс'],
  animal: ['хорио цээр', 'хүнс'],
  embryo: ['хорио цээр'],
  meat: ['мах', 'хүнс', 'хүнсний'],
  medicine: ['мансууруулах', 'сэтгэцэд', 'эм'],
  chemical: ['химийн'],
  explosive: ['химийн', 'тэсэрч'],
  alcohol: ['архи', 'согтууруулах'],
  pesticide: ['химийн', 'ургамал'],
  gmo: ['хүнс', 'химийн'],
  oil: ['тос']
};

const createCustomIcon = (
  border: BorderCrossing, 
  isSelected: boolean, 
  goodId: string | null,
  isProposed?: boolean,
  goodIcon?: string, 
  goodStatus?: GoodStatus,
  distanceMode?: 'ub' | 'aimag' | null,
) => {
  let color = getMarkerColor(border.id, border.operationalStatus, goodStatus);
  const pinSize = isSelected ? 42 : 32;
  
  // Maintain the awesome proposed logic
  if (isProposed) color = "#f97316"; 

  // Distances Pill
  if (isSelected && distanceMode) {
    const dist = distanceMode === 'ub' ? border.ubDistance : border.aimagDistance;
    return L.divIcon({
      className: "distance-pill-icon bg-transparent border-0",
      html: `
        <div style="background: white; border: 2.5px solid ${color}; border-radius: 20px; padding: 4px 12px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.3); white-space: nowrap; display: flex; align-items: center; gap: 6px; transform: scale(1.1); transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); position: relative; z-index: 1000; bottom: 10px;">
          <span style="font-size: 14px; font-weight: 900; color: ${color}">${dist}</span>
          <span style="font-size: 9px; font-weight: 800; color: #94a3b8;">KM</span>
        </div>
      `,
      iconSize: [80, 40],
      iconAnchor: [40, 40], // Anchored to bottom center
    });
  }

  // Standard Pin
  const hasLab = border.hasLaboratory;
  return L.divIcon({
    className: "custom-port-icon bg-transparent border-0",
    html: `
      <div style="width: ${pinSize}px; height: ${pinSize}px; transform: ${isSelected ? 'scale(1.15) translateY(-5px)' : 'scale(1)'}; transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); position: relative; z-index: ${isSelected ? 1000 : 20}; cursor: pointer; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.3));">
        <svg viewBox="0 0 24 24" style="width: 100%; height: 100%;" fill="${color}" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          <circle cx="12" cy="9" r="6" fill="white" />
          ${isProposed ? `<circle cx="12" cy="9" r="8" fill="none" stroke="#f97316" stroke-width="2" />` : ''}
        </svg>
        <div style="position: absolute; top: 38%; left: 50%; transform: translate(-50%, -50%); display: flex; align-items: center; justify-content: center; width: ${pinSize * 0.65}px; height: ${pinSize * 0.65}px; background: white; border-radius: 50%; box-shadow: inset 0 1px 3px rgba(0,0,0,0.15);">
          ${goodIcon 
            ? `<span style="font-size: ${pinSize * 0.4}px; line-height: 1;">${goodIcon}</span>` 
            : `<img src="/customs-logo.png" alt="Customs" style="width: 85%; height: 85%; object-fit: contain;" />`
          }
        </div>
        ${hasLab ? `<div style="position: absolute; top: -2px; right: -2px; width: 12px; height: 12px; background: #14b8a6; border-radius: 50%; border: 2px solid white;"></div>` : ''}
      </div>
    `,
    iconSize: [pinSize, pinSize],
    iconAnchor: [pinSize / 2, pinSize], // PERFECTLY ANCHORED to the bottom tip of the SVG
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
  isProposed?: boolean;
  selectedGood?: Good;
  goodStatus?: GoodStatus;
  distanceMode?: 'ub' | 'aimag' | null;
  onSelect: (border: BorderCrossing) => void;
  key?: React.Key;
}

function BorderMarker({ border, isSelected, isProposed, selectedGood, goodStatus, distanceMode, onSelect }: BorderMarkerProps) {
  const markerRef = React.useRef<L.Marker>(null);
  const pinSize = isSelected ? 42 : 32;

  useEffect(() => {
    if (isSelected && markerRef.current) {
      markerRef.current.openPopup();
    }
  }, [isSelected]);

  if (!isValidLatLng(border.lat, border.lng)) return null;

  return (
    <Marker
      ref={markerRef}
      position={[border.lat, border.lng]}
      icon={createCustomIcon(border, isSelected, selectedGood?.id || null, isProposed, selectedGood?.icon, goodStatus, distanceMode)}
      eventHandlers={{
        click: () => onSelect(border),
      }}
    >
      <Tooltip 
        direction="top" 
        offset={[0, -pinSize]} 
        className="custom-tooltip-container"
        permanent={true}
        interactive={false}
      >
        <div className={`font-black uppercase tracking-wider transition-all duration-300 rounded-lg whitespace-nowrap ${
          isSelected 
            ? 'text-[10px] opacity-100 bg-white px-2 py-1 shadow-md text-slate-800' 
            : 'text-[8px] opacity-60 bg-transparent px-1 py-0 text-slate-500'
        }`}>
          {border.name}
        </div>
      </Tooltip>

      <Popup minWidth={240} className="custom-info-popup">
        <div className="w-[240px] flex flex-col gap-3 font-sans">
          <div className="text-center border-b border-gray-100 pb-2">
            <h3 className="text-lg font-black text-slate-800 leading-tight">{border.name}</h3>
          </div>

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

          {border.hasLaboratory && (
            <div className="mt-1 p-2 bg-teal-50/50 border border-teal-100 rounded-xl">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-xs">🔬</span>
                <span className="text-[9px] font-black text-teal-700 uppercase tracking-widest">Гаалийн салбар лаборатори</span>
              </div>
              <div className="flex flex-wrap gap-1">
                {border.labCapabilities?.map((cap, idx) => (
                  <div key={idx} className="bg-white border border-teal-200 px-1.5 py-0.5 rounded text-[8px] font-bold text-teal-800">
                    {cap}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export function BorderMap({ borders, selectedBorder, onSelect, globalFilter, distanceMode }: BorderMapProps) {
  const mongoliaCenter: [number, number] = [46.8625, 103.8467];
  const selectedGood = GOODS.find(g => g.id === globalFilter.goodId);

  const filteredBorders = borders.filter(b => {
    if (globalFilter.goodId) {
      const isLegalImport = b.legalImports?.some(li => li.goodId === globalFilter.goodId);
      const isLegalExport = b.legalExports?.some(le => le.goodId === globalFilter.goodId);
      const isProposed = b.proposedAdditions?.some(p => p.goodId === globalFilter.goodId);
      
      const isLegalMatch = globalFilter.direction === 'import' ? isLegalImport : isLegalExport;
      return isLegalMatch || isProposed;
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
 
        <RoutesLayer selectedBorder={selectedBorder} />

        {filteredBorders.map((border) => {
          const isLegalImport = border.legalImports?.some(li => li.goodId === globalFilter.goodId);
          const isLegalExport = border.legalExports?.some(le => le.goodId === globalFilter.goodId);
          const isLegalMatch = globalFilter.direction === 'import' ? isLegalImport : isLegalExport;
          const isProposed = globalFilter.goodId ? border.proposedAdditions?.some(p => p.goodId === globalFilter.goodId) : false;

          return (
            <BorderMarker
              key={border.id}
              border={border}
              isSelected={selectedBorder?.id === border.id}
              isProposed={isProposed && !isLegalMatch}
              selectedGood={selectedGood}
              goodStatus={globalFilter.goodId ? 'ok' : undefined}
              distanceMode={distanceMode}
              onSelect={onSelect}
            />
          );
        })}
      </MapContainer>

      {selectedBorder && (
        <div className="absolute bottom-6 right-6 z-[1000] flex flex-col gap-2">
          <div className="bg-white/90 backdrop-blur pb-1 pt-1 px-3 rounded-2xl border border-gray-100 shadow-2xl flex items-center gap-4">
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-0.5 bg-[#2563eb] rounded-full opacity-60"></div>
              <span className="text-[10px] font-black uppercase text-blue-600 tracking-wider">УБ хүртэл</span>
            </div>
            <div className="flex items-center gap-2 py-2">
              <div className="w-4 h-0.5 bg-[#10b981] rounded-full opacity-80"></div>
              <span className="text-[10px] font-black uppercase text-emerald-600 tracking-wider">Төв хүртэл</span>
            </div>
          </div>
        </div>
      )}
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
