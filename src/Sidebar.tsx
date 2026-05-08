import React, { useMemo, useState, useEffect } from "react";
import { BorderCrossing, Good, GoodStatus, Direction } from "./types";
import { GOODS } from "./data";
import { Package, MapPin, CheckCircle2, AlertTriangle, Building2, Filter, ArrowRight, CornerDownRight, X, ChevronLeft, ChevronRight, FileDown, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import * as XLSX from 'xlsx';
import { GoodsFilter } from "./components/GoodsFilter";
import { PortSelector } from "./components/PortSelector";
import { useIsMobile } from "./hooks/useIsMobile";
import { usePortImages } from "./hooks/usePortImages";
import { PortImage } from "./components/PortImage";
import { useSidebarStore, useSelectedBorder, useGlobalFilter, useActiveTab, useExpandedSection, useSetSelectedBorder, useSetGlobalFilter, useToggleSection, useSetActiveTab, useSetIsCollapsed } from "./store/useSidebarStore";
import { STATUS_LABEL_MAP, STATUS_COLOR_MAP, PORT_STATUS_COLOR_MAP, TRAFFIC_COLOR_MAP, TRANSPORT_ICON_MAP } from "./constants/portMaps";

interface SidebarProps {
  onShowGoodDetail: (good: Good, status: { import?: GoodStatus; export?: GoodStatus }) => void;
  borders: BorderCrossing[];
  onClose?: () => void;
  refreshTrigger?: number;
}

const getResNumber = (source: string) => {
  const match = source.match(/ЗГ-ын\s*\d{4}[.\d]*(\s*№\d+)?/);
  return match ? match[0] : source.split(' ')[0];
};

export function Sidebar({ 
  onShowGoodDetail, 
  borders, 
  onClose,
  refreshTrigger
}: SidebarProps) {
  const isMobile = useIsMobile();
  const customGoodImages = usePortImages(refreshTrigger);
  
  const selectedBorder = useSelectedBorder();
  const globalFilter = useGlobalFilter();
  const activeTab = useActiveTab();
  const expandedSection = useExpandedSection();
  const isCollapsed = useSidebarStore(s => s.isCollapsed);
  
  const setSelectedBorder = useSetSelectedBorder();
  const setGlobalFilter = useSetGlobalFilter();
  const toggleSection = useToggleSection();
  const setActiveTab = useSetActiveTab();
  const setIsCollapsed = useSetIsCollapsed();

  // Reset tab to 'info' when a new border is selected
  React.useEffect(() => {
    if (selectedBorder && activeTab !== 'info') {
      setActiveTab('info');
    }
  }, [selectedBorder?.id, activeTab, setActiveTab]);
  
  const selectedGood = useMemo(() => GOODS.find(g => g.id === globalFilter.goodId), [globalFilter.goodId]);
  
  const displayImage = selectedBorder?.imageUrl ?? selectedBorder?.development?.imageUrl ?? null;

  const handleExportExcel = () => {
    // If a commodity filter is active, export only those relevant ports
    let exportData = borders;
    if (globalFilter.goodId && filteredPorts) {
      exportData = [
        ...filteredPorts.ok,
        ...filteredPorts.warn,
        ...filteredPorts.crit
      ];
    }

    const data = exportData.map(b => ({
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
      'Гаалийн салбар лаборатори': b.customsLabInfo || '—',
      'Шинжилгээ хийдэг бараа': b.testedGoodsInfo || '—',
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
        width: isMobile ? '100vw' : (isCollapsed ? 80 : 350),
        height: isMobile ? '70vh' : '100%',
        position: isMobile ? 'fixed' : 'relative',
        bottom: 0,
        zIndex: 100
      }}
      className={`bg-white text-[#111827] flex flex-col border-r border-[#e5e7eb] overflow-hidden shadow-2xl md:shadow-sm relative group transition-all duration-300 ${
        isMobile ? 'rounded-t-3xl border-t' : ''
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

      {/* Global Filter Bar & Port Selector Container */}
      <AnimatePresence>
        {!isCollapsed && (
          <div className="flex flex-col shrink-0 border-b border-gray-100">
            {/* Goods Filter Section */}
            <div className="flex flex-col bg-white">
              <button 
                onClick={() => toggleSection('goods')}
                className={`w-full h-14 px-5 flex items-center justify-between transition-all duration-300 group outline-none ${
                  expandedSection === 'goods' ? 'bg-gray-50' : 'hover:bg-gray-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    expandedSection === 'goods' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <Filter className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">
                      Бараагаар шүүх
                    </span>
                    <span className="text-[11px] font-bold text-gray-800">
                      {(globalFilter.goodId && expandedSection !== 'goods') ? `${selectedGood?.name} сонгогдсон` : "Бүх бараа"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {globalFilter.goodId && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">1</div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expandedSection === 'goods' ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <motion.div 
                initial={false}
                animate={{ 
                  height: expandedSection === 'goods' ? 440 : 0,
                  opacity: expandedSection === 'goods' ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="h-[440px]">
                  <GoodsFilter 
                    borders={borders}
                    refreshTrigger={refreshTrigger || 0}
                  />
                </div>
              </motion.div>
            </div>

            {/* Port Selector Section */}
            <div className="flex flex-col bg-white border-t border-gray-100">
              <button 
                onClick={() => toggleSection('ports')}
                className={`w-full h-14 px-5 flex items-center justify-between transition-all duration-300 group outline-none ${
                  expandedSection === 'ports' ? 'bg-gray-50' : 'hover:bg-gray-50/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                    expandedSection === 'ports' ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 text-blue-600'
                  }`}>
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest font-mono">
                      Боомтоор сонгох
                    </span>
                    <span className="text-[11px] font-bold text-gray-800 truncate max-w-[140px]">
                      {(selectedBorder && expandedSection !== 'ports') ? `${selectedBorder.name} сонгогдсон` : "Бүх боомт"}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {selectedBorder && (
                    <div className="w-5 h-5 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center">1</div>
                  )}
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${expandedSection === 'ports' ? 'rotate-180' : ''}`} />
                </div>
              </button>

              <motion.div 
                initial={false}
                animate={{ 
                  height: expandedSection === 'ports' ? 440 : 0,
                  opacity: expandedSection === 'ports' ? 1 : 0
                }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="overflow-hidden"
              >
                <div className="h-[440px]">
                  <PortSelector 
                    borders={borders}
                  />
                </div>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>

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
                  onClick={() => setSelectedBorder(b)}
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
                      onClick={() => setSelectedBorder(null)}
                      className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-black uppercase tracking-wider hover:bg-blue-100 transition-colors w-full mb-4 border border-blue-100"
                    >
                      <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                      Шүүлтүүрийн үр дүн рүү буцах ({selectedGood?.name})
                    </button>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`px-2 py-0.5 text-white text-[9px] font-black uppercase rounded shadow-sm ${PORT_STATUS_COLOR_MAP[selectedBorder.operationalStatus]}`}>{selectedBorder.operationalStatus}</span>
                    <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border shadow-sm ${TRAFFIC_COLOR_MAP[selectedBorder.trafficStatus]}`}>
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
                        {TRANSPORT_ICON_MAP[t]}
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
                      <PortImage 
                        src={displayImage} 
                        alt={selectedBorder.name} 
                        className="rounded-2xl border border-gray-100 aspect-video mb-6"
                      />
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
                    {(selectedBorder.hasLaboratory || selectedBorder.customsLabInfo) && (
                      <section className="space-y-3">
                        <div className="flex items-center gap-2 pb-1 text-gray-900 font-black">
                          <span className="text-sm">🔬</span>
                          <h3 className="text-[11px] font-black uppercase tracking-[0.15em] text-teal-600">Гаалийн салбар лаборатори</h3>
                        </div>
                        <div className="space-y-3">
                          {selectedBorder.customsLabInfo && (
                            <div className="p-3 bg-teal-50/50 border border-teal-100 rounded-xl shadow-sm">
                              <p className="text-[11px] font-bold text-teal-800 leading-relaxed">{selectedBorder.customsLabInfo}</p>
                            </div>
                          )}
                          
                          {(selectedBorder.labCapabilities || []).map((cap, i) => (
                            <div key={i} className="flex items-center gap-3 p-2.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                              <span className="text-sm">🔬</span>
                              <span className="text-[11px] font-bold text-gray-700 leading-tight">{cap}</span>
                            </div>
                          ))}

                          {selectedBorder.testedGoodsInfo && (
                            <div className="space-y-1.5 mt-2">
                              <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest pl-1">Шинжилгээ хийдэг бараа:</span>
                              <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                                <p className="text-[10px] font-bold text-gray-600 leading-relaxed">{selectedBorder.testedGoodsInfo}</p>
                              </div>
                            </div>
                          )}
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
                          <PortImage 
                            src={selectedBorder.development.imageUrl} 
                            alt={selectedBorder.development.projectName} 
                            className="w-full h-40"
                          />
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
                      <h4 className={`text-[11px] font-black uppercase tracking-widest ${STATUS_COLOR_MAP[status].split(' ')[0]}`}>
                        {STATUS_LABEL_MAP[status]} ({ports.length})
                      </h4>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {ports.map(port => (
                        <button
                          key={port.id}
                          onClick={() => {
                            setSelectedBorder(port);
                          }}
                          className={`flex items-center justify-between p-3 rounded-xl border transition-all hover:shadow-md text-left active:scale-[0.98] ${STATUS_COLOR_MAP[status]}`}
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

      {/* Active State Bar */}
      <AnimatePresence>
        {!isCollapsed && (globalFilter.goodId || selectedBorder) && (
          <motion.div 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-2 shrink-0 z-30"
          >
            {globalFilter.goodId && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 text-white rounded-lg shadow-md shadow-blue-100 transition-all hover:scale-105">
                <span className="text-xs">{selectedGood?.icon}</span>
                <span className="text-[10px] font-black uppercase tracking-wider">{selectedGood?.name}</span>
                <button 
                  onClick={() => setGlobalFilter({ goodId: null })}
                  className="p-0.5 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {selectedBorder && (
              <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-gray-800 text-white rounded-lg shadow-md transition-all hover:scale-105">
                <MapPin className="w-3 h-3 text-blue-400" />
                <span className="text-[10px] font-black uppercase tracking-wider">{selectedBorder.name}</span>
                <button 
                  onClick={() => setSelectedBorder(null)}
                  className="p-0.5 hover:bg-white/20 rounded transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
