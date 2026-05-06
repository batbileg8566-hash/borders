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
  distanceMode: 'ub' | 'aimag' | null;
  onDistanceModeChange: (mode: 'ub' | 'aimag' | null) => void;
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
  onClose,
  distanceMode,
  onDistanceModeChange
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'goods' | 'dev'>('info');

  // Reset tab to 'info' when a new border is selected
  React.useEffect(() => {
    setActiveTab('info');
  }, [selectedBorder?.id]);
  
  const selectedGood = useMemo(() => GOODS.find(g => g.id === globalFilter.goodId), [globalFilter.goodId]);
  const displayImage = selectedBorder?.imageUrl || selectedBorder?.development?.imageUrl;

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

      <div className="flex-1 flex flex-col overflow-hidden relative">
        <AnimatePresence mode="wait">
          {isCollapsed ? (
            <motion.div 
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 overflow-y-auto flex flex-col items-center py-4 gap-4 custom-scrollbar"
            >
              {borders.map(b => (
                <button 
                  key={b.id} 
                  onClick={() => onSelect(b)}
                  className={`w-10 h-10 rounded-xl border flex items-center justify-center transition-all ${
                    selectedBorder?.id === b.id 
                      ? 'bg-blue-600 border-blue-700 text-white shadow-lg shadow-blue-200' 
                      : 'bg-white border-gray-100 text-gray-400 hover:bg-gray-50'
                  }`}
                >
                  <MapPin className="w-5 h-5" />
                </button>
              ))}
            </motion.div>
          ) : selectedBorder ? (
            /* PORT DETAIL MODE - FIXED COHESIVE LAYOUT */
            <motion.div
              key={selectedBorder.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="flex flex-col h-full bg-white overflow-hidden"
            >
              {/* FIXED HEADER */}
              <div className="shrink-0 bg-white z-20 shadow-sm relative">
                {/* Internal Padding for Header Info */}
                <div className="p-5 pb-3">
                  {globalFilter.goodId && (
                    <button 
                      onClick={() => onSelect(null)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors w-full mb-4 border border-blue-100"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      Шүүлтүүрийн үр дүн рүү буцах ({selectedGood?.name})
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-white text-[9px] font-black uppercase rounded shadow-sm ${portStatusColorMap[selectedBorder.operationalStatus]}`}>{selectedBorder.operationalStatus}</span>
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shadow-sm ${trafficColorMap[selectedBorder.trafficStatus]}`}>
                      {selectedBorder.trafficStatus}
                    </div>
                    <div className="ml-auto">
                      <span className="text-[10px] text-gray-400 font-black font-mono">#{selectedBorder.id.toUpperCase()}</span>
                    </div>
                  </div>
                  
                  <h2 className="text-2xl font-black text-gray-900 tracking-tight leading-none">{selectedBorder.name}</h2>
                  
                  <div className="mt-3 flex flex-wrap gap-2">
                    <div className="text-[10px] font-bold text-gray-500 border-l-2 border-blue-500 pl-2">
                      {selectedBorder.region} аймаг
                    </div>
                    {selectedBorder.transportTypes.map(t => (
                      <div key={t} className="text-[10px] font-bold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full">
                        {transportIconMap[t]}
                      </div>
                    ))}
                  </div>
                </div>

                {/* STICKY TAB SWITCHER - Edge to Edge in Sidebar */}
                <div className="flex px-5 pb-2 bg-white border-b border-gray-100">
                  <div className="flex gap-1 bg-gray-100/70 p-1 rounded-xl border border-gray-100 w-full">
                    <button 
                      onClick={() => setActiveTab('info')} 
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'info' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Ерөнхий
                    </button>
                    <button 
                      onClick={() => setActiveTab('goods')} 
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'goods' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Бараа
                    </button>
                    <button 
                      onClick={() => setActiveTab('dev')} 
                      className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                        activeTab === 'dev' ? 'bg-white text-blue-600 shadow-sm border border-gray-200/50' : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Төсөл
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content Area */}
              <div className="flex-1 overflow-y-auto p-5 custom-scrollbar bg-gray-50/30">
                {activeTab === 'info' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300"
                  >
                    {/* Unified Header Image inside Info Tab */}
                    {displayImage && (
                      <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm aspect-video bg-gray-50 flex items-center justify-center relative mb-6 group">
                        <img 
                          src={displayImage} 
                          alt={selectedBorder.name} 
                          className="w-full h-full object-cover transition-opacity duration-300"
                          referrerPolicy="no-referrer"
                          onLoad={(e) => { e.currentTarget.style.opacity = '1'; }}
                          onError={(e) => {
                            e.currentTarget.style.display = 'none';
                            const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                          style={{ opacity: 0 }}
                        />
                        {/* Custom Error Placeholder */}
                        <div 
                          className="hidden absolute inset-0 flex-col items-center justify-center text-gray-400 p-8 bg-gray-100"
                          style={{ display: 'none' }}
                        >
                          <svg className="w-10 h-10 mb-2 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-[10px] font-bold uppercase tracking-widest">Зураг олдсонгүй</span>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                      </div>
                    )}

                    {selectedBorder.description && (
                      <p className="text-xs text-gray-500 leading-relaxed italic border-l-2 border-gray-200 pl-3 mb-6">
                        {selectedBorder.description}
                      </p>
                    )}

                    {/* Distances */}
                    <section className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <span className="text-sm">🏢</span>
                          </div>
                          <div className="flex flex-col">
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Улаанбаатар хүртэл</span>
                            <span className="text-sm font-black text-blue-600">{selectedBorder.ubDistance} км</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 pr-2">
                           <div className="w-6 h-0.5 bg-blue-600/30 rounded-full"></div>
                        </div>
                      </div>

                      {selectedBorder.aimagDistance && (
                        <div className="flex items-center justify-between pt-3 border-t border-gray-50">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                              <span className="text-sm">🏘️</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Аймгийн төв хүртэл</span>
                              <span className="text-sm font-black text-emerald-600">{selectedBorder.aimagDistance} км</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 pr-2">
                             <div className="w-6 h-0.5 bg-emerald-600/50 rounded-full"></div>
                          </div>
                        </div>
                      )}
                    </section>

                    {/* Quick Stats Grid */}
                    <div className="p-4 bg-white rounded-2xl border border-gray-100 grid grid-cols-2 gap-y-4 gap-x-2 shadow-sm">
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
                    </div>

                    {/* Infrastructure */}
                    <section className="space-y-3">
                      <div className="flex items-center gap-2 pb-1 text-gray-900">
                        <Building2 className="w-4 h-4 text-blue-600" />
                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Дэд бүтэц</h3>
                      </div>
                      {selectedBorder.infrastructure ? (
                        <div className="space-y-3 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                          {selectedBorder.infrastructure.details.map((detail, i) => (
                            <div key={i} className="flex gap-2.5">
                              <CornerDownRight className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                              <span className="text-xs text-gray-600 leading-snug">{detail}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 bg-gray-50 border border-dashed border-gray-200 rounded-xl text-center text-[10px] text-gray-400 uppercase font-black">Мэдээлэл байхгүй</div>
                      )}
                    </section>

                    {/* Laboratory */}
                    {selectedBorder.hasLaboratory && (
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 text-gray-900 font-black">
                          <span className="text-sm">🔬</span>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-teal-600">Гаалийн салбар лаборатори</h3>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                          {(selectedBorder.labCapabilities || []).map((cap, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                              <span className="text-sm">🔬</span>
                              <span className="text-[11px] font-bold text-gray-700 leading-tight">{cap}</span>
                            </div>
                          ))}
                        </div>
                      </section>
                    )}
                  </motion.div>
                )}

                {activeTab === 'goods' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 animate-in fade-in duration-300"
                  >
                    <div className="flex items-center gap-2 pb-1 text-gray-900">
                      <Package className="w-4 h-4 text-blue-600" />
                      <h3 className="text-[11px] font-black uppercase tracking-[0.15em]">Тогтоолын бараа</h3>
                    </div>

                    {/* IMPORT */}
                    {selectedBorder.legalImports && selectedBorder.legalImports.length > 0 && (
                      <div className="space-y-2">
                        <div className="text-[9px] font-black text-emerald-700 uppercase tracking-widest bg-emerald-50 px-2 py-1 rounded inline-block">↓ Импорт</div>
                        <div className="space-y-1.5">
                          {selectedBorder.legalImports.map((entry, i) => {
                            const good = GOODS.find(g => g.id === entry.goodId);
                            return (
                              <div key={i} onClick={() => good && onShowGoodDetail(good, { import: 'ok' })} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-emerald-200 cursor-pointer transition-all shadow-sm">
                                <span className="text-xl flex-shrink-0">{good?.icon || '•'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-bold text-gray-800 leading-snug">{entry.text}</div>
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {entry.resolutions.map((res, j) => (
                                      <span key={j} className="text-[9px] font-mono font-black text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">{res}</span>
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
                      <div className="space-y-2">
                        <div className="text-[9px] font-black text-purple-700 uppercase tracking-widest bg-purple-50 px-2 py-1 rounded inline-block">↑ Экспорт</div>
                        <div className="space-y-1.5">
                          {selectedBorder.legalExports.map((entry, i) => {
                            const good = GOODS.find(g => g.id === entry.goodId);
                            return (
                              <div key={i} onClick={() => good && onShowGoodDetail(good, { export: 'ok' })} className="flex items-start gap-3 p-3 bg-white border border-gray-100 rounded-xl hover:border-purple-200 cursor-pointer transition-all shadow-sm">
                                <span className="text-xl flex-shrink-0">{good?.icon || '•'}</span>
                                <div className="flex-1 min-w-0">
                                  <div className="text-[12px] font-bold text-gray-800 leading-snug">{entry.text}</div>
                                  <div className="flex flex-wrap gap-1 mt-1.5">
                                    {entry.resolutions.map((res, j) => (
                                      <span key={j} className="text-[9px] font-mono font-black text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">{res}</span>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* PROPOSED ADDITIONS */}
                    {selectedBorder.proposedAdditions && selectedBorder.proposedAdditions.length > 0 && (
                      <div className="space-y-3 pt-4 border-t border-gray-100 mt-4">
                        <div className="flex items-center gap-2">
                          <AlertTriangle className="w-3.5 h-3.5 text-orange-500" />
                          <div className="text-[9px] font-black text-orange-700 uppercase tracking-widest">Нэмэх саналтай бараа</div>
                        </div>
                        <div className="space-y-2">
                          {selectedBorder.proposedAdditions.map((entry, i) => {
                            const good = GOODS.find(g => g.id === entry.goodId);
                            return (
                              <div key={i} className="p-3 bg-orange-50/30 border border-orange-100 rounded-xl">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm">{good?.icon}</span>
                                  <span className="text-[11px] font-bold text-gray-700">{entry.text}</span>
                                </div>
                                <div className="flex flex-col gap-1 pl-6">
                                  <div className="text-[10px] text-gray-500"><span className="font-bold">Зорилт:</span> {entry.targetResolution}</div>
                                  {entry.proposalNote && (
                                    <div className="text-[10px] text-gray-500 leading-tight italic">"{entry.proposalNote}"</div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}

                {activeTab === 'dev' && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-6 animate-in fade-in duration-300"
                  >
                    <div className="flex items-center gap-2 pb-1 text-gray-900">
                      <span className="text-sm">🏗️</span>
                      <h3 className="text-[11px] font-black uppercase tracking-[0.2em]">Бүтээн байгуулалт</h3>
                    </div>

                    {selectedBorder.development ? (
                      <div className="bg-white rounded-2xl border border-indigo-100 overflow-hidden shadow-sm">
                        {selectedBorder.development.imageUrl && (
                          <div className="w-full h-40 bg-gray-100">
                            <img src={selectedBorder.development.imageUrl} alt={selectedBorder.development.projectName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          </div>
                        )}
                        <div className="p-4 space-y-3">
                          <div className="text-[12px] font-bold text-gray-900 leading-tight">{selectedBorder.development.projectName}</div>
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] font-bold">
                              <span className="text-gray-400 uppercase">Гүйцэтгэл</span>
                              <span className="text-indigo-600">{selectedBorder.development.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${selectedBorder.development.progress}%` }} />
                            </div>
                          </div>
                          <div className="flex items-start gap-2 pt-1 border-t border-gray-50">
                            <span className="text-[9px] font-black text-gray-400 uppercase w-14 flex-shrink-0">Гүйцэтгэгч:</span>
                            <span className="text-[10px] font-semibold text-gray-600">{selectedBorder.development.contractor}</span>
                          </div>
                          <p className="text-[10px] text-gray-500 leading-relaxed italic">{selectedBorder.development.description}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center flex flex-col items-center gap-3">
                        <Building2 className="w-8 h-8 text-gray-300" />
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Төсөл байхгүй</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ) : globalFilter.goodId ? (
            /* FILTER SUMMARY MODE */
            <motion.div
              key={`filter-${globalFilter.goodId}-${globalFilter.direction}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="flex-1 overflow-y-auto p-5 space-y-8 custom-scrollbar"
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
            <div className="flex-1 overflow-y-auto h-full flex flex-col items-center justify-center p-12 text-center custom-scrollbar">
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
