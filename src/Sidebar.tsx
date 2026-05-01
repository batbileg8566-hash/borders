import React, { useMemo } from "react";
import { BorderCrossing, Good, GoodStatus, Direction } from "./types";
import { GOODS, PORT_GOODS } from "./data";
import { Package, MapPin, CheckCircle2, AlertTriangle, Building2, Filter, ArrowRight, CornerDownRight, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface SidebarProps {
  selectedBorder: BorderCrossing | null;
  onSelect: (border: BorderCrossing) => void;
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
  warn: "Санал оруулсан",
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

export function Sidebar({ 
  selectedBorder, 
  onSelect, 
  onShowGoodDetail, 
  borders, 
  globalFilter, 
  onFilterChange 
}: SidebarProps) {
  
  const selectedGood = useMemo(() => GOODS.find(g => g.id === globalFilter.goodId), [globalFilter.goodId]);

  // Group borders by their status for the selected good
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

  return (
    <div className="w-full bg-white text-[#111827] h-full flex flex-col border-r border-[#e5e7eb] overflow-hidden shadow-sm">
      {/* Global Filter Bar */}
      <div className="p-5 border-b border-gray-100 bg-gray-50/80 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <Filter className="w-3.5 h-3.5 text-blue-600" />
          <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">
            Барааны төрлөөр шүүх
          </label>
        </div>
        
        <div className="flex flex-col gap-2">
          <div className="relative group">
            <select
              value={globalFilter.goodId || ""}
              onChange={(e) => onFilterChange({ ...globalFilter, goodId: e.target.value || null })}
              className="w-full bg-white border border-gray-200 rounded-lg p-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium shadow-sm appearance-none"
            >
              <option value="">Бүх бараа (Шүүлтүүргүй)</option>
              {GOODS.map((g) => (
                <option key={g.id} value={g.id}>{g.icon} {g.name}</option>
              ))}
            </select>
            {globalFilter.goodId && (
              <button
                onClick={() => onFilterChange({ goodId: null, direction: "import" })}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600 transition-colors"
                title="Шүүлтүүр цэвэрлэх"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            {!globalFilter.goodId && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                 <ArrowRight className="w-3.5 h-3.5 rotate-90" />
              </div>
            )}
          </div>

          {globalFilter.goodId && (
            <div className="flex p-0.5 bg-gray-200 rounded-lg">
              {(['import', 'export'] as Direction[]).map((dir) => (
                <button
                  key={dir}
                  onClick={() => onFilterChange({ ...globalFilter, direction: dir })}
                  className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-md transition-all ${
                    globalFilter.direction === dir 
                      ? "bg-white text-blue-600 shadow-sm" 
                      : "text-gray-500 hover:bg-white/50"
                  }`}
                >
                  {dir === 'import' ? 'Импорт' : 'Экспорт'}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Port Selector (Only if no good filter is active) */}
      {!globalFilter.goodId && (
        <div className="p-5 border-b border-gray-100 bg-white shadow-sm z-10">
          <label className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wider mb-2 block font-mono">
            Боомт сонгох
          </label>
          <select
            value={selectedBorder?.id || ""}
            onChange={(e) => {
              const border = borders.find((b) => b.id === e.target.value);
              if (border) onSelect(border);
            }}
            className="w-full bg-white border border-gray-300 rounded-md p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-sans cursor-pointer shadow-sm"
          >
            <option value="" disabled>Боомт сонгох...</option>
            {borders.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {globalFilter.goodId ? (
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
                            onFilterChange({ goodId: null, direction: "import" });
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
          ) : selectedBorder ? (
            /* PORT DETAIL MODE */
            <motion.div
              key={selectedBorder.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="p-5 space-y-8"
            >
              {/* Port Header */}
              <section className="relative">
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-0.5 bg-blue-600 text-white text-[9px] font-black uppercase rounded shadow-sm">БООМТ</span>
                  <span className="text-[10px] text-gray-400 font-black font-mono">#{selectedBorder.id.toUpperCase()}</span>
                </div>
                <h2 className="text-3xl font-black text-gray-900 tracking-tight leading-none">{selectedBorder.name}</h2>
                <div className="mt-3 flex items-center gap-4">
                   <div className="text-xs font-bold text-gray-500 border-l-2 border-blue-500 pl-3">
                      {selectedBorder.region} аймаг
                   </div>
                   <div className="text-xs font-bold text-gray-500 border-l-2 border-emerald-500 pl-3">
                      {selectedBorder.direction}
                   </div>
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
                        <div className="text-sm font-black text-gray-800">Олон улсын</div>
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
        <div className="flex items-center justify-between opacity-40">
           <div className="text-[9px] font-black tracking-[0.2em] text-gray-800 uppercase">
             ГЕГ © 2026
           </div>
           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        </div>
      </div>
    </div>
  );
}
