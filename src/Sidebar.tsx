import React, { useMemo, useState } from "react";
import { BorderCrossing, Good, GoodStatus, Direction } from "./types";
import { GOODS, PORT_GOODS } from "./data";
import { Package, MapPin, CheckCircle2, AlertTriangle, Building2, Filter, ArrowRight, CornerDownRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

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

const portStatusColorMap: Record<string, string> = {
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
  onFilterChange 
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const selectedGood = useMemo(() => GOODS.find(g => g.id === globalFilter.goodId), [globalFilter.goodId]);

  const filteredPorts = useMemo(() => {
    if (!globalFilter.goodId) return null;
    
    const results: Record<GoodStatus, BorderCrossing[]> = {
      ok: [],
      warn: [],
      crit: []
    };

    borders.forEach(b => {
      const status = PORT_GOODS[b.id]?.[globalFilter.goodId!]?.[globalFilter.direction];
      if (status) {
        results[status].push(b);
      }
    });

    return results;
  }, [globalFilter.goodId, globalFilter.direction, borders]);

  const footerStatus = "Демо горим • Статик өгөгдөл";

  return (
    <motion.div 
      animate={{ width: isCollapsed ? 80 : 350 }}
      className="bg-white text-[#111827] h-full flex flex-col border-r border-[#e5e7eb] overflow-hidden shadow-sm relative group"
    >
      {/* Collapse Toggle */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-24 z-50 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center shadow-lg hover:bg-blue-600 hover:text-white transition-all"
      >
        {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>

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
              {globalFilter.goodId && (
                <button 
                  onClick={() => onFilterChange({ goodId: null, direction: "import" })}
                  className="text-[9px] font-black text-blue-600 hover:text-blue-700 uppercase"
                >
                  Цэвэрлэх
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1 select-none custom-scrollbar">
              {GOODS.map((g) => {
                const isActive = globalFilter.goodId === g.id;
                
                const importCount = borders.filter(b => PORT_GOODS[b.id]?.[g.id]?.import === 'ok').length;
                const exportCount = borders.filter(b => PORT_GOODS[b.id]?.[g.id]?.export === 'ok').length;

                return (
                  <div 
                    key={g.id} 
                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${
                      isActive ? "bg-white border-blue-200 shadow-sm" : "bg-transparent border-transparent hover:bg-gray-200/50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-base flex-shrink-0">{g.icon}</span>
                      <span className={`text-[11px] font-bold truncate ${isActive ? 'text-blue-600' : 'text-gray-600'}`}>
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

              {/* Explicit Goods List Section */}
              <section className="space-y-6">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                  <Package className="w-4 h-4 text-blue-600" />
                  <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-gray-400">Нэвтрүүлэх барааны горим</h3>
                </div>
                
                {/* Section A: Approved Goods */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest px-1">ЗӨВШӨӨРӨГДСӨН БАРАА</h4>
                  <div className="space-y-2">
                    {GOODS.filter(good => {
                      const status = PORT_GOODS[selectedBorder.id]?.[good.id];
                      return status && (status.import === 'ok' || status.export === 'ok');
                    }).map(good => {
                      const status = PORT_GOODS[selectedBorder.id]![good.id];
                      return (
                        <div 
                          key={good.id}
                          onClick={() => onShowGoodDetail(good, status)}
                          className="group flex flex-col p-3.5 bg-white border border-gray-100 hover:border-blue-200 rounded-xl transition-all cursor-pointer hover:shadow-md"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{good.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{good.name}</div>
                              <div className="text-[9px] text-gray-400 font-mono font-bold truncate">
                                {getResNumber(good.sources.import || good.sources.export)}
                              </div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-1">
                             <div className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border text-[9px] font-black uppercase ${
                               status.import ? statusColorMap[status.import] : "bg-gray-50 border-gray-100 text-gray-300"
                             }`}>
                               Импорт: {status.import ? statusLabelMap[status.import] : "—"}
                             </div>
                             <div className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border text-[9px] font-black uppercase ${
                               status.export ? statusColorMap[status.export] : "bg-gray-50 border-gray-100 text-gray-300"
                             }`}>
                               Экспорт: {status.export ? statusLabelMap[status.export] : "—"}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Section B: Proposed Goods */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-1">ХУУЛЬ, ТОГТООЛД НЭМЭХ САНАЛТАЙ</h4>
                  <div className="space-y-2">
                    {GOODS.filter(good => {
                      const status = PORT_GOODS[selectedBorder.id]?.[good.id];
                      return status && (status.import !== 'ok' && status.export !== 'ok');
                    }).map(good => {
                      const status = PORT_GOODS[selectedBorder.id]![good.id];
                      return (
                        <div 
                          key={good.id}
                          onClick={() => onShowGoodDetail(good, status)}
                          className="group flex flex-col p-3.5 bg-gray-50/50 border border-gray-100 hover:border-rose-200 rounded-xl transition-all cursor-pointer hover:shadow-sm"
                        >
                          <div className="flex items-center gap-3 mb-2 opacity-80 group-hover:opacity-100">
                            <span className="text-2xl">{good.icon}</span>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-bold text-gray-900 group-hover:text-rose-600 transition-colors uppercase tracking-tight">{good.name}</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2 mt-1">
                             <div className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border text-[9px] font-black uppercase ${
                               status.import ? statusColorMap[status.import] : "bg-gray-50 border-gray-100 text-gray-300"
                             }`}>
                               Импорт: {status.import ? statusLabelMap[status.import] : "—"}
                             </div>
                             <div className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border text-[9px] font-black uppercase ${
                               status.export ? statusColorMap[status.export] : "bg-gray-50 border-gray-100 text-gray-300"
                             }`}>
                               Экспорт: {status.export ? statusLabelMap[status.export] : "—"}
                             </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
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
                            <span className="text-sm font-bold">{port.name}</span>
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
