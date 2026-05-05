import React, { useMemo, useState } from "react";
import { BorderCrossing, Good, GoodStatus, Direction } from "./types";
import { GOODS } from "./data";
import { Package, MapPin, CheckCircle2, AlertTriangle, Building2, Filter, ArrowRight, CornerDownRight, X, ChevronLeft, ChevronRight, FileDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';

interface SidebarProps {
  selectedBorder: BorderCrossing | null;
  onSelect: (border: BorderCrossing | null) => void;
  onShowGoodDetail: (good: Good, status: { import?: GoodStatus; export?: GoodStatus }) => void;
  borders: BorderCrossing[];
  globalFilter: {
    goodId: string | null;
    direction: Direction;
  };
  onFilterChange: (filter: { goodId: string | null; direction: Direction }) => void;
  onClose?: () => void;
}

const statusLabelMap: Record<GoodStatus, string> = {
  ok: "Тогтоолд орсон",
  warn: "Нэмэх саналтай",
  crit: "Хуулийн санал",
};

const statusColorMap: Record<GoodStatus, string> = {
  ok: "text-emerald-600 bg-emerald-50 border-emerald-100",
  warn: "text-orange-600 bg-orange-50 border-orange-100",
  crit: "text-rose-600 bg-rose-50 border-rose-100",
};

const getResNumber = (source: string) => {
  const match = source.match(/ЗГ-ын\s*\d{4}[.\d]*(\s*№\d+)?/);
  return match ? match[0] : source.split(' ')[0];
};

export const portStatusColorMap: Record<string, string> = {
  "Олон улсын": "bg-blue-600 shadow-blue-500/50",
  "Хоёр талын": "bg-amber-500 shadow-amber-500/50",
  "Түр ажиллагаатай": "bg-slate-500 shadow-slate-500/50",
};

const trafficColorMap: Record<string, string> = {
  "Хэвийн": "text-emerald-500 bg-emerald-50 border-emerald-100",
  "Ачаалалтай": "text-amber-500 bg-amber-50 border-amber-100",
  "Квот тулсан": "text-rose-500 bg-rose-50 border-rose-100",
};

const transportIconMap: Record<string, string> = {
  "Автозам": "🚗 Автозам",
  "Төмөр зам": "🚂 Төмөр зам",
  "AGV": "📡 AGV Ухаалаг тээвэр",
  "Агаар": "✈️ Агаар",
};

export function Sidebar({ 
  selectedBorder, 
  onSelect, 
  onShowGoodDetail, 
  borders, 
  globalFilter, 
  onFilterChange,
  onClose
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const selectedGood = useMemo(() => GOODS.find(g => g.id === globalFilter.goodId), [globalFilter.goodId]);

  const handleExportExcel = () => {
    const data = borders.map(b => ({
      'Боомтын нэр': b.name,
      'Төрөл': b.operationalStatus,
      'Статус': b.trafficStatus,
      'Хиллэдэг боомт': b.neighborPortName || '—',
      'Бүс': b.region,
      'Тээврийн төрөл': b.transportTypes.join(', '),
      'УБ-аас зай (км)': b.ubDistance,
      'Аймгийн төвөөс зай (км)': b.aimagDistance,
      'Газар нутгийн талбай': b.infrastructure?.totalArea || b.areaSize || '—',
      'Ажиллах хүч (ГУАБ)': b.staffGUAB || 0,
      'Ажиллах хүч (ГҮБ)': b.staffGUB || 0,
      'Агуулахын тоо': b.warehousesCount || 0,
      'Хяналтын бүсийн тоо': b.controlZonesCount || 0,
      'Лаборатори': b.hasLaboratory ? `Тийм (${b.labCapacity || 'Салбар'})` : 'Үгүй',
      'Лабораторын үзүүлэлтүүд': b.labCapabilities?.join('; ') || '—',
      'Импортлох зөвшөөрөгдсөн бараа': b.legalImports?.map(li => `• ${li.text} [${li.resolutions.join(', ')}]${li.conditions ? ` (${li.conditions})` : ''}`).join('\n') || '—',
      'Экспортлох зөвшөөрөгдсөн бараа': b.legalExports?.map(le => `• ${le.text} [${le.resolutions.join(', ')}]${le.conditions ? ` (${le.conditions})` : ''}`).join('\n') || '—',
      'Нэмэх саналтай бараа': b.proposedAdditions?.map(pa => `• ${pa.text} (Зорилт: ${pa.targetResolution})${pa.proposalNote ? ` - Тайлбар: ${pa.proposalNote}` : ''}`).join('\n') || '—',
      'Бүтээн байгуулалтын төсөл': b.development?.projectName || '—',
      'Төслийн гүйцэтгэл (%)': b.development?.progress || 0,
      'Төслийн төсөв': b.development?.budget || '—',
      'Гүйцэтгэгч': b.development?.contractor || '—',
      'Тайлбар': b.description || '—'
    }));

    const ws = XLSX.utils.json_to_sheet(data);

    // Set column widths for better readability
    const wscols = [
      {wch: 20}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 20}, 
      {wch: 15}, {wch: 20}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 15}, 
      {wch: 15}, {wch: 20}, {wch: 40}, {wch: 60}, {wch: 60}, {wch: 60},
      {wch: 30}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 100}
    ];
    ws['!cols'] = wscols;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Боомтын нэгдсэн мэдээлэл");
    XLSX.writeFile(wb, `Mongolia_Border_Ports_Full_Data_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const filteredPorts = useMemo(() => {
    if (!globalFilter.goodId) return null;
    
    const results: Record<GoodStatus, BorderCrossing[]> = {
      ok: [],
      warn: [],
      crit: []
    };

    borders.forEach(b => {
      const isLegal = globalFilter.direction === 'import' 
        ? b.legalImports?.some(li => li.goodId === globalFilter.goodId)
        : b.legalExports?.some(le => le.goodId === globalFilter.goodId);
      
      const isProposed = b.proposedAdditions?.some(pa => pa.goodId === globalFilter.goodId);

      if (isLegal) {
        results.ok.push(b);
      } else if (isProposed) {
        results.warn.push(b);
      }
    });

    return results;
  }, [globalFilter.goodId, globalFilter.direction, borders]);

  const footerStatus = "Демо горим • Статик өгөгдөл";

  return (
    <motion.div 
      initial={false}
      animate={{ 
        width: typeof window !== 'undefined' && window.innerWidth < 768 ? '100vw' : (isCollapsed ? 80 : 350),
        height: typeof window !== 'undefined' && window.innerWidth < 768 ? '70vh' : '100%',
        position: typeof window !== 'undefined' && window.innerWidth < 768 ? 'fixed' : 'relative',
        bottom: 0,
        zIndex: 100
      }}
      className={`bg-white text-[#111827] flex flex-col border-r border-[#e5e7eb] overflow-hidden shadow-2xl md:shadow-sm relative group transition-all duration-300 ${
        typeof window !== 'undefined' && window.innerWidth < 768 ? 'rounded-t-3xl border-t' : ''
      }`}
    >
      {/* Collapse Toggle - Desktop Only */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="hidden md:flex absolute -right-3 top-24 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-all"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

      {/* Mobile Handle & Close */}
      <div className="md:hidden flex items-center justify-between px-6 pt-4 shrink-0">
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto" />
        <button 
          onClick={onClose}
          className="p-1 rounded-full bg-gray-100 text-gray-500 absolute right-4 top-4"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Global Filter Bar */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="p-5 border-b border-gray-100 bg-gray-50/80 space-y-4 overflow-hidden"
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">
                  Бараагаар шүүх
                </label>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleExportExcel}
                  className="flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[9px] font-black uppercase hover:bg-emerald-100 transition-colors"
                  title="Мэдээллийг Excel-ээр татах"
                >
                  <FileDown className="w-3 h-3" />
                  Excel татах
                </button>
                {globalFilter.goodId && (
                  <button 
                    onClick={() => onFilterChange({ goodId: null, direction: "import" })}
                    className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase"
                  >
                    Цэвэрлэх
                  </button>
                )}
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1 select-none custom-scrollbar">
              {GOODS.map((g) => {
                const isActive = globalFilter.goodId === g.id;
                
                const importCount = borders.filter(b => b.legalImports?.some(li => li.goodId === g.id)).length;
                const exportCount = borders.filter(b => b.legalExports?.some(le => le.goodId === g.id)).length;

                return (
                  <div 
                    key={g.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      isActive ? "bg-white border-blue-200 shadow-sm" : "bg-transparent border-transparent hover:bg-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="text-base flex-shrink-0">{g.icon}</span>
                      <span className={`text-[10px] font-bold leading-tight ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
                        {g.name}
                      </span>
                    </div>
                    <div className="flex gap-1">
                      {(['import', 'export'] as Direction[]).map(dir => {
                        const isDirActive = isActive && globalFilter.direction === dir;
                        const count = dir === 'import' ? importCount : exportCount;
                        return (
                          <button
                            key={dir}
                            onClick={() => onFilterChange({ goodId: g.id, direction: dir })}
                            className={`px-2 py-1 rounded text-[9px] font-black uppercase transition-all flex items-center gap-1 ${
                              isDirActive 
                                ? "bg-blue-600 text-white shadow-md shadow-blue-200" 
                                : "bg-gray-200 text-gray-500 hover:bg-gray-300"
                            }`}
                          >
                            {dir === 'import' ? 'Имп' : 'Экс'}
                            <span className={`opacity-60 text-[8px] font-mono ${isDirActive ? 'text-white' : 'text-gray-400'}`}>
                              {count}
                            </span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Port Selector */}
      <div className={`p-5 border-b border-gray-100 bg-white shadow-sm z-10 transition-all ${isCollapsed ? 'px-2' : ''}`}>
        {!isCollapsed ? (
          <>
            <label className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wider mb-2 block font-mono">
              Боомт сонгох
            </label>
            <select
              value={selectedBorder?.id || "all"}
              onChange={(e) => {
                if (e.target.value === "all") {
                  onSelect(null);
                  return;
                }
                const border = borders.find((b) => b.id === e.target.value);
                if (border) onSelect(border);
              }}
              className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans cursor-pointer shadow-sm"
            >
              <option value="all">Бүх боомт (All)</option>
              {borders.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </>
        ) : (
          <div className="flex flex-col items-center gap-4">
             <MapPin className="w-6 h-6 text-gray-300" />
             <div className="h-px w-8 bg-gray-100" />
             {GOODS.slice(0, 4).map(g => (
               <span key={g.id} className="text-xl opacity-50 grayscale hover:grayscale-0 hover:opacity-100 cursor-pointer transition-all">
                {g.icon}
               </span>
             ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div 
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center py-4 gap-4"
            >
              {borders.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => onSelect(b)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all relative ${
                    selectedBorder?.id === b.id ? 'bg-blue-600 border-blue-700 text-white shadow-lg' : 'bg-white border-gray-100 text-gray-400'
                  }`}
                >
                  <div className={`absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white ${
                    b.operationalStatus === 'Олон улсын' ? 'bg-blue-600' : b.operationalStatus === 'Хоёр талын' ? 'bg-amber-500' : 'bg-slate-500'
                  }`} />
                  <span className="text-[10px] font-black font-mono">{b.id.slice(0, 2).toUpperCase()}</span>
                </button>
              ))}
            </motion.div>
          ) : selectedBorder ? (
            /* PORT DETAIL MODE */
            <motion.div
              key={selectedBorder.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-5 space-y-8"
            >
              {/* Filter Context Back Button */}
              {globalFilter.goodId && (
                <button 
                  onClick={() => onSelect(null)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors w-full mb-4 border border-blue-100"
                >
                  <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                  Шүүлтүүрийн үр дүн рүү буцах ({selectedGood?.name})
                </button>
              )}

              {/* Port Header */}
              <section className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className={`px-2 py-0.5 text-white text-[9px] font-black uppercase rounded shadow-sm ${portStatusColorMap[selectedBorder.operationalStatus]}`}>{selectedBorder.operationalStatus}</span>
                  <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shadow-sm ${trafficColorMap[selectedBorder.trafficStatus]}`}>
                    {selectedBorder.trafficStatus}
                  </div>
                  <div className="ml-auto">
                    <span className="text-[10px] text-gray-400 font-black font-mono">#{selectedBorder.id.toUpperCase()}</span>
                  </div>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{selectedBorder.name}</h2>
                {selectedBorder.neighborPortName && (
                  <div className="mt-1 flex items-center gap-1.5 text-blue-600 font-bold">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span className="text-sm tracking-tight">{selectedBorder.neighborPortName}</span>
                  </div>
                )}
                
                {selectedBorder.imageUrl && (
                  <div className="mt-4 rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-video bg-gray-50 flex items-center justify-center relative group">
                    <img 
                      src={selectedBorder.imageUrl} 
                      alt={selectedBorder.name} 
                      className="w-full h-full object-cover transition-opacity duration-300"
                      referrerPolicy="no-referrer"
                      onLoad={(e) => {
                        e.currentTarget.style.opacity = '1';
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const errorPlaceholder = e.currentTarget.nextElementSibling as HTMLElement;
                        if (errorPlaceholder) {
                          errorPlaceholder.style.display = 'flex';
                        }
                      }}
                      style={{ opacity: 0 }}
                    />
                    {/* Custom Error Placeholder */}
                    <div 
                      className="hidden absolute inset-0 flex-col items-center justify-center text-gray-300 p-8"
                      style={{ display: 'none' }}
                    >
                      <svg className="w-12 h-12 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  </div>
                )}

                {selectedBorder.description && (
                  <p className="mt-4 text-xs text-gray-500 leading-relaxed italic">
                    {selectedBorder.description}
                  </p>
                )}

                <div className="mt-4 p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-2 gap-y-4 gap-x-2">
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Зам талбай</div>
                    <div className="text-sm font-black text-gray-800">{selectedBorder.areaSize?.toLocaleString() || "—"} м²</div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Ажиллах хүч</div>
                    <div className="text-sm font-black text-gray-800">
                      {(selectedBorder.staffGUAB || 0) + (selectedBorder.staffGUB || 0)} <span className="text-[10px] font-bold text-gray-400">(ГУАБ: {selectedBorder.staffGUAB || 0})</span>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Агуулах / Хяналт</div>
                    <div className="text-sm font-black text-gray-800">
                      {selectedBorder.warehousesCount || "—"} агуулах / {selectedBorder.controlZonesCount || "—"} бүс
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Лаборатори</div>
                    <div className="text-sm font-black text-blue-600">{selectedBorder.labCapacity || "—"} (хүчин)</div>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                   <div className="text-[10px] font-bold text-gray-500 border-l-2 border-blue-500 pl-2">
                      {selectedBorder.region} аймаг
                   </div>
                   {selectedBorder.transportTypes.map(t => (
                     <div key={t} className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                        {transportIconMap[t]}
                     </div>
                   ))}
                </div>
              </section>

              {/* Distances */}
              <section className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">УБ хотоос</div>
                   <div className="text-lg font-black text-blue-600">{selectedBorder.ubDistance} <span className="text-[10px] font-bold text-gray-400 uppercase">км</span></div>
                </div>
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                   <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Төвөөс</div>
                   <div className="text-lg font-black text-emerald-600">{selectedBorder.aimagDistance} <span className="text-[10px] font-bold text-gray-400 uppercase">км</span></div>
                </div>
              </section>

              {/* Verbatim Goods Section - Direct from Government Resolutions */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Package className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">
                    Тогтоолын дагуу нэвтрүүлэх бараа
                  </h3>
                </div>

                {/* IMPORT */}
                {selectedBorder.legalImports && selectedBorder.legalImports.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded">
                        ↓ Импорт
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono font-bold">
                        {selectedBorder.legalImports.length} төрөл
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedBorder.legalImports.map((entry, i) => {
                        const good = GOODS.find(g => g.id === entry.goodId);
                        return (
                          <div 
                            key={`imp-${i}`}
                            onClick={() => good && onShowGoodDetail(good, { import: 'ok' })}
                            className="group flex items-start gap-3 p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100 hover:border-emerald-200 rounded-xl cursor-pointer transition-all"
                          >
                            <span className="text-xl flex-shrink-0">{good?.icon || '•'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-gray-800 leading-snug">
                                {entry.text}
                              </div>
                              {entry.conditions && (
                                <div className="text-[10px] text-orange-600 italic mt-0.5 font-semibold">
                                  ({entry.conditions})
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {entry.resolutions.map((res, j) => (
                                  <span 
                                    key={j} 
                                    className="text-[9px] font-mono font-black text-emerald-700 bg-white px-1.5 py-0.5 rounded border border-emerald-200"
                                  >
                                    {res}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* EXPORT */}
                {selectedBorder.legalExports && selectedBorder.legalExports.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-2 px-1">
                      <span className="text-[9px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded">
                        ↑ Экспорт
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono font-bold">
                        {selectedBorder.legalExports.length} төрөл
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedBorder.legalExports.map((entry, i) => {
                        const good = GOODS.find(g => g.id === entry.goodId);
                        return (
                          <div 
                            key={`exp-${i}`}
                            onClick={() => good && onShowGoodDetail(good, { export: 'ok' })}
                            className="group flex items-start gap-3 p-3 bg-purple-50/50 hover:bg-purple-50 border border-purple-100 hover:border-purple-200 rounded-xl cursor-pointer transition-all"
                          >
                            <span className="text-xl flex-shrink-0">{good?.icon || '•'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-gray-800 leading-snug">
                                {entry.text}
                              </div>
                              {entry.conditions && (
                                <div className="text-[10px] text-orange-600 italic mt-0.5 font-semibold">
                                  ({entry.conditions})
                                </div>
                              )}
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                {entry.resolutions.map((res, j) => (
                                  <span 
                                    key={j} 
                                    className="text-[9px] font-mono font-black text-purple-700 bg-white px-1.5 py-0.5 rounded border border-purple-200"
                                  >
                                    {res}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {(!selectedBorder.legalImports || selectedBorder.legalImports.length === 0) && 
                 (!selectedBorder.legalExports || selectedBorder.legalExports.length === 0) && (
                  <div className="p-6 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                    <p className="text-[11px] text-gray-400 font-bold uppercase tracking-widest">
                      Тогтоолд тусгагдсан бараа байхгүй
                    </p>
                  </div>
                )}

                {/* PROPOSED ADDITIONS */}
                {selectedBorder.proposedAdditions && selectedBorder.proposedAdditions.length > 0 && (
                  <div className="space-y-2 pt-4 mt-4 border-t border-rose-100">
                    <div className="flex items-center gap-2 px-1">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span className="text-[9px] font-black text-rose-700 uppercase tracking-widest bg-rose-50 px-2 py-1 rounded">
                        + Нэмэх саналтай
                      </span>
                      <span className="text-[10px] text-rose-400 font-mono font-bold ml-auto">
                        {selectedBorder.proposedAdditions.length} санал
                      </span>
                    </div>
                    <div className="space-y-1.5">
                      {selectedBorder.proposedAdditions.map((entry, i) => {
                        const good = GOODS.find(g => g.id === entry.goodId);
                        return (
                          <div 
                            key={`prop-${i}`}
                            onClick={() => good && onShowGoodDetail(good, { import: 'warn' })}
                            className="group flex items-start gap-3 p-3 bg-rose-50/40 hover:bg-rose-50 border border-rose-100 hover:border-rose-200 rounded-xl cursor-pointer transition-all"
                          >
                            <span className="text-xl flex-shrink-0 opacity-70">{good?.icon || '•'}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-[12px] font-bold text-gray-700 leading-snug">
                                {entry.text}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1.5">
                                <span className="text-[9px] font-mono font-black text-rose-700 bg-white px-1.5 py-0.5 rounded border border-rose-200">
                                  {entry.targetResolution}
                                </span>
                              </div>
                              {entry.proposalNote && (
                                <div className="mt-2 text-[10px] text-gray-600 leading-relaxed italic border-l-2 border-rose-200 pl-2">
                                  {entry.proposalNote}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </section>

              {/* Infrastructure Section */}
              <section className="pt-4 space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-blue-600">
                  <Building2 className="w-4 h-4" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Дэд бүтэц</h3>
                </div>
                
                {selectedBorder.infrastructure ? (
                  <div className="space-y-4 bg-blue-50/20 p-4 rounded-2xl border border-blue-50">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Талбай</div>
                        <div className="text-sm font-black text-gray-800">{selectedBorder.infrastructure.totalArea}</div>
                      </div>
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-blue-400 uppercase tracking-widest font-mono">Төрөл</div>
                        <div className="text-sm font-black text-gray-800">{selectedBorder.operationalStatus}</div>
                      </div>
                    </div>
                    
                    <div className="max-h-48 overflow-y-auto custom-scrollbar pr-2 space-y-3 pt-2 border-t border-blue-100/50">
                      {selectedBorder.infrastructure.details.map((detail, i) => (
                        <div key={i} className="flex gap-2.5">
                          <CornerDownRight className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                          <span className="text-xs text-gray-600 leading-snug font-medium italic">{detail}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 bg-gray-50 rounded-2xl border border-dashed border-gray-200 text-center">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Мэдээлэл байхгүй</p>
                  </div>
                )}
              </section>

              {/* Development Project Section */}
              {selectedBorder.development && (
                <section className="pt-4 space-y-4 border-t border-gray-100">
                  <div className="flex items-center gap-2 pb-2 border-b border-gray-100 text-indigo-600">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Бүтээн байгуулалт, Шинэчлэл</h3>
                  </div>
                  
                  <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
                    {selectedBorder.development.imageUrl && (
                      <div className="w-full h-40 bg-gray-100 relative overflow-hidden flex items-center justify-center">
                        <img 
                          src={selectedBorder.development.imageUrl} 
                          alt={selectedBorder.development.projectName} 
                          className="w-full h-full object-cover transition-opacity duration-300"
                          referrerPolicy="no-referrer"
                          onLoad={(e) => {
                            e.currentTarget.style.opacity = '1';
                          }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const errorPlaceholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (errorPlaceholder) {
                              errorPlaceholder.style.display = 'flex';
                            }
                          }}
                          style={{ opacity: 0 }}
                        />
                        {/* Custom Error Placeholder */}
                        <div 
                          className="hidden absolute inset-0 flex-col items-center justify-center text-gray-300 p-4"
                          style={{ display: 'none' }}
                        >
                          <svg className="w-8 h-8 mb-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Зураг ачаалахад алдаа гарлаа</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />
                        <div className="absolute bottom-2 left-3 right-3">
                          <span className="text-white text-[9px] font-black uppercase tracking-widest leading-tight block drop-shadow-sm">
                            {selectedBorder.development.projectName}
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="p-4 space-y-3">
                      {!selectedBorder.development.imageUrl && (
                        <div className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider border-b border-indigo-50 pb-2">
                          {selectedBorder.development.projectName}
                        </div>
                      )}
                      
                      {/* Progress Bar */}
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] font-bold">
                          <span className="text-gray-500 uppercase">Гүйцэтгэл</span>
                          <span className={selectedBorder.development.progress === 100 ? "text-emerald-600" : "text-indigo-600"}>
                            {selectedBorder.development.progress}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
                          <div 
                            className={`h-2 rounded-full transition-all duration-1000 ${selectedBorder.development.progress === 100 ? 'bg-emerald-500' : 'bg-indigo-500'}`}
                            style={{ width: `${selectedBorder.development.progress}%` }}
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-gray-50">
                        <div className="flex items-start gap-2">
                          <span className="text-[9px] font-bold text-gray-400 uppercase w-14 flex-shrink-0">Төсөв:</span>
                          <span className="text-xs font-bold text-gray-800">{selectedBorder.development.budget}</span>
                        </div>
                        {selectedBorder.development.contractor && (
                          <div className="flex items-start gap-2">
                            <span className="text-[9px] font-bold text-gray-400 uppercase w-14 flex-shrink-0">Гүйцэтгэгч:</span>
                            <span className="text-[10px] font-semibold text-gray-600">{selectedBorder.development.contractor}</span>
                          </div>
                        )}
                      </div>

                      <p className="text-[10px] text-gray-500 leading-relaxed pt-2">
                        {selectedBorder.development.description}
                      </p>
                    </div>
                  </div>
                </section>
              )}

              {/* Laboratory Section - Verbatim with Icons */}
              {selectedBorder.hasLaboratory && (
                <section className="space-y-4 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 pb-2">
                    <div className="p-1.5 bg-teal-50 rounded-lg">
                      <span className="text-sm">🔬</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-teal-600">Шинжилгээ, Лаборатори</h3>
                      <p className="text-[9px] text-gray-400 font-bold">{selectedBorder.labCapacity || 'Салбар лаборатори'}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2">
                    {(selectedBorder.labCapabilities || []).map((cap, i) => {
                      let icon = "🔬";
                      if (cap.toLowerCase().includes("хүнс") || cap.toLowerCase().includes("малина") || cap.toLowerCase().includes("ургамал") || cap.toLowerCase().includes("хорио цээр")) icon = "🍱";
                      if (cap.toLowerCase().includes("хими") || cap.toLowerCase().includes("мансууруулах") || cap.toLowerCase().includes("сэтгэц") || cap.toLowerCase().includes("аюултай бодис")) icon = "🧪";
                      if (cap.toLowerCase().includes("нүүрс") || cap.toLowerCase().includes("эрдэс") || cap.toLowerCase().includes("газрын тос")) icon = "💎";
                      if (cap.toLowerCase().includes("архи") || cap.toLowerCase().includes("согтууруулах")) icon = "🍷";
                      if (cap.toLowerCase().includes("ноос") || cap.toLowerCase().includes("ноолуур")) icon = "🧶";

                      return (
                        <div key={i} className="flex items-center gap-3 p-2.5 bg-teal-50/30 border border-teal-100/50 rounded-xl">
                          <span className="text-base">{icon}</span>
                          <span className="text-[11px] font-bold text-teal-900 leading-tight">{cap}</span>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {/* Infrastructure Note for missing labs */}
              {!selectedBorder.hasLaboratory && (
                <section className="space-y-3 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-2 opacity-60">
                    <span className="text-sm">🧪</span>
                    <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">Шинжилгээний хүчин чадал</h3>
                  </div>
                  <div className="p-3 bg-gray-50 border border-dashed border-gray-200 rounded-xl">
                    <p className="text-[10px] text-gray-500 italic flex items-center gap-2">
                      <span className="text-xs">⚠️</span> Лаборатори байхгүй. Дээжийг ойролцоо аймаг эсвэл төв лабораторид илгээдэг.
                    </p>
                  </div>
                </section>
              )}
            </motion.div>
          ) : globalFilter.goodId ? (
            /* FILTER SUMMARY MODE */
            <motion.div
              key={`filter-${globalFilter.goodId}-${globalFilter.direction}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-5 space-y-8"
            >
              <div className="p-4 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-4xl">{selectedGood?.icon}</span>
                  <div>
                    <h3 className="text-xl font-black">{selectedGood?.name}</h3>
                    <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest">
                      {globalFilter.direction === 'import' ? 'Импорт' : 'Экспорт'} хийх боломжтой боомтууд
                    </p>
                  </div>
                </div>
              </div>

              {(['ok', 'warn', 'crit'] as GoodStatus[]).map(status => {
                const ports = filteredPorts?.[status] || [];
                if (ports.length === 0) return null;

                return (
                  <section key={status} className="space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                      {status === 'ok' ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500"/> : <AlertTriangle className="w-3.5 h-3.5 text-orange-500"/>}
                      <h4 className={`text-[11px] font-black uppercase tracking-widest ${statusColorMap[status].split(' ')[0]}`}>
                        {statusLabelMap[status]} ({ports.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {ports.map(port => (
                        <button
                          key={port.id}
                          onClick={() => {
                            onSelect(port);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-md text-left active:scale-[0.98] ${statusColorMap[status]}`}
                        >
                          <div className="flex items-center gap-3">
                            <MapPin className="w-4 h-4 opacity-50" />
                            <div className="flex flex-col">
                              <span className="text-sm font-bold">{port.name}</span>
                              {port.neighborPortName && (
                                <span className="text-[10px] opacity-70 font-medium">↔ {port.neighborPortName}</span>
                              )}
                            </div>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 opacity-50" />
                        </button>
                      ))}
                    </div>
                  </section>
                );
              })}
            </motion.div>
          ) : (
            /* DEFAULT EMPTY MODE */
            <div className="h-full flex flex-col items-center justify-center p-12 text-center">
               <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6 relative">
                  <MapPin className="w-10 h-10 text-gray-300" />
                  <div className="absolute inset-0 rounded-full border-2 border-dashed border-gray-200 animate-[spin_10s_linear_infinite]" />
               </div>
               <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">
                 Мэдээлэл сонгох
               </h3>
               <button 
                 onClick={handleExportExcel}
                 className="mt-6 flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-200 active:scale-95"
               >
                 <FileDown className="w-4 h-4" />
                 Эксель файлаар татах
               </button>
               <p className="text-xs text-gray-400 mt-3 max-w-[200px] leading-relaxed mx-auto font-medium">
                 Газрын зураг эсвэл шүүлтүүр ашиглан боомтын дэлгэрэнгүй мэдээллийг харна уу
               </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
           <div className="text-[9px] font-black tracking-[0.2em] text-gray-400 uppercase">
             {footerStatus}
           </div>
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </motion.div>
  );
}
