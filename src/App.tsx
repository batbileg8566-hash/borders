/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BorderMap } from "./BorderMap";
import { LegalDetailModal } from "./LegalDetailModal";
import { ChatPanel } from "./components/ChatPanel";
import { DataTable } from "./components/DataTable";
import { borderCrossings } from "./data";
import { getSupabase } from "./lib/supabase";
import { BorderCrossing, Good, GoodStatus, Direction, PortCategory } from "./types";
import { MessageSquare, MapPin, Scale, Share2, Settings, ChevronDown } from "lucide-react";
import { SourcesModal } from "./SourcesModal";
import { ShareModal } from "./components/ShareModal";
import { AdminImageModal } from "./components/AdminImageModal";

export default function App() {
  const [selectedBorder, setSelectedBorder] = useState<BorderCrossing | null>(null);
  const [globalFilter, setGlobalFilter] = useState<{
    goodId: string | null;
    direction: Direction;
  }>({
    goodId: null,
    direction: "import"
  });

  const [distanceMode, setDistanceMode] = useState<'ub' | 'aimag' | null>(null);

  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    good: Good | null;
    status: { import?: GoodStatus; export?: GoodStatus };
  }>({
    isOpen: false,
    good: null,
    status: {}
  });

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isSourcesOpen, setIsSourcesOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [isDevOpen, setIsDevOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setHoveredCategory(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [selectedCategory, setSelectedCategory] = useState<PortCategory>("Боомт");
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>("Авто зам");
  const [hoveredCategory, setHoveredCategory] = useState<PortCategory | null>(null);

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [overrides, setOverrides] = useState<{
    ports: Record<string, any>;
    goods: Record<string, any>;
  }>({ ports: {}, goods: {} });

  const MENU_STRUCTURE: Record<PortCategory, string[]> = {
    "Боомт": ["Авто зам", "Төмөр зам", "Олон Улсын нисэх буудал", "AGV"],
    "Гүний гааль": [
      "Улаанбаатар хот дахь гаалийн газар",
      "Орхон аймаг дахь гаалийн газар",
      "Дархан дахь гаалийн газар",
      "Сайншанд дахь гаалийн газар",
      "Чойр дахь салбар",
      "Айраг дахь салбар",
      "Бор-Өндөр дахь салбар",
      "Улс хоорондын шуудан илгээмжийн гаалийн газар"
    ],
    "Хяналтын бүс": [
      "Төрөл бүрийн барааны",
      "Уул уурхайн бүтээгдэхүүний",
      "Газрын тосны",
      "Химийн болон цацраг идэвхит",
      "Катерингийн үйлчилгээний",
      "Шуудан илгээмжийн"
    ],
    "Баталгаат бүс": [
      "Гаалийн баталгаат агуулах",
      "Гаалийн баталгаат барилгын талбай",
      "Гаалийн баталгаат үзэсгэлэнгийн газар",
      "Гаалийн баталгаат үйлдвэрийн газар",
      "Гаалийн тусгай бүс",
      "Татваргүй барааны дэлгүүр"
    ],
    "Чөлөөт бүс": [
      "Алтанбулаг",
      "Замын-Үүд",
      "Цагааннуур",
      "Хөшгийн хөндийн"
    ]
  };

  // Fetch Overrides
  useEffect(() => {
    async function fetchOverrides() {
      const supabase = getSupabase();
      if (!supabase) return;

      try {
        const { data: genericData, error: genericError } = await supabase
          .from('custom_overrides')
          .select('*');
        
        if (genericError) console.error('Fetch Overrides Error:', genericError);

        const { data: imageData, error: imageError } = await supabase
          .from('custom_images')
          .select('*');

        if (imageError) console.warn('Fetch Legacy Images Error:', imageError);

        const newPorts: Record<string, any> = {};
        const newGoods: Record<string, any> = {};

        const safeNumber = (val: any, fallback?: number) => {
          if (val === undefined || val === null || val === '') return fallback;
          const n = Number(val);
          if (isNaN(n) || !isFinite(n)) return fallback;
          return n;
        };

        // Merge legacy images first
        if (imageData) {
          imageData.forEach(item => {
            if (item.category === 'port') {
              newPorts[item.entity_id] = { imageUrl: item.image_url };
            } else if (item.category === 'good') {
              newGoods[item.entity_id] = item.image_url;
            }
          });
        }

        // Merge Generic Overrides (newer data prevails)
        if (genericData) {
          genericData.forEach(item => {
            if (item.category === 'port') {
              const data = item.data || {};
              newPorts[item.entity_id] = { 
                ...newPorts[item.entity_id], 
                ...data,
                updated_at: item.updated_at,
                lat: safeNumber(data.lat, newPorts[item.entity_id]?.lat),
                lng: safeNumber(data.lng, newPorts[item.entity_id]?.lng),
                ubDistance: safeNumber(data.ubDistance, newPorts[item.entity_id]?.ubDistance),
                aimagDistance: safeNumber(data.aimagDistance, newPorts[item.entity_id]?.aimagDistance)
              };
            } else if (item.category === 'good') {
              newGoods[item.entity_id] = item.data?.imageUrl || newGoods[item.entity_id];
            }
          });
        }

        // 3. Merge Local Storage Overrides (highest priority for development)
        const localData = JSON.parse(localStorage.getItem('LOCAL_OVERRIDES_DATA') || '{}');
        Object.entries(localData).forEach(([key, data]) => {
          const [cat, id] = key.split(':');
          if (cat === 'port') {
            const d = data as any;
            newPorts[id] = { 
              ...newPorts[id], 
              ...d,
              lat: safeNumber(d.lat, newPorts[id]?.lat),
              lng: safeNumber(d.lng, newPorts[id]?.lng),
              ubDistance: safeNumber(d.ubDistance, newPorts[id]?.ubDistance),
              aimagDistance: safeNumber(d.aimagDistance, newPorts[id]?.aimagDistance)
            };
          } else if (cat === 'good') {
            newGoods[id] = (data as any).imageUrl || newGoods[id];
          }
        });

        console.log('Processed overrides for ports:', Object.keys(newPorts));
        setOverrides({ ports: newPorts, goods: newGoods });
        console.log('Final merged overrides:', { ports: Object.keys(newPorts).length, goods: Object.keys(newGoods).length });

        // Sync to localStorage for components still using it (optional, but good for stability)
        localStorage.setItem('customPortImages', JSON.stringify(
          Object.fromEntries(Object.entries(newPorts).map(([id, data]) => [id, data.imageUrl]))
        ));
        localStorage.setItem('customGoodImages', JSON.stringify(newGoods));

      } catch (err) {
        console.warn('Failed to fetch overrides:', err);
      }
    }

    fetchOverrides();
  }, [refreshTrigger]);

  const mergedBorderCrossings = useMemo(() => {
    return borderCrossings.map(port => {
      const override = overrides.ports[port.id];
      if (override) {
        const merged = { ...port, ...override };
        // Final sanity check: if something became NaN, revert to original
        if (isNaN(merged.lat)) merged.lat = port.lat;
        if (isNaN(merged.lng)) merged.lng = port.lng;
        return merged;
      }
      return port;
    });
  }, [overrides.ports]);

  const currentSelectedBorder = useMemo(() => {
    if (!selectedBorder) return null;
    return mergedBorderCrossings.find(b => b.id === selectedBorder.id) || selectedBorder;
  }, [selectedBorder, mergedBorderCrossings]);

  // Sync selected border if its data changes
  useEffect(() => {
    if (currentSelectedBorder) {
      const latest = mergedBorderCrossings.find(b => b.id === currentSelectedBorder.id);
      if (latest && (latest.lat !== currentSelectedBorder.lat || latest.lng !== currentSelectedBorder.lng)) {
        console.log(`Syncing selected border ${latest.name} coordinates to:`, latest.lat, latest.lng);
        setSelectedBorder({ ...latest }); // Force new object ref
      }
    }
  }, [mergedBorderCrossings, currentSelectedBorder]);

  const filteredCrossings = useMemo(() => {
    let base = mergedBorderCrossings;
    
    // 1. Filter by Main Category
    if (selectedCategory === "Боомт") {
      base = base.filter(b => !b.category || b.category === "Боомт");
    } else {
      base = base.filter(b => b.category === selectedCategory);
    }

    // 2. Filter by Sub Category if selected
    if (selectedSubCategory) {
      if (selectedCategory === "Боомт") {
        // Special case for Boomt: filter by transport types
        // Support mapping from UI labels to data labels
        const mapping: Record<string, string> = {
          "Авто зам": "Автозам",
          "Олон Улсын нисэх буудал": "Агаар"
        };
        const searchVal = mapping[selectedSubCategory] || selectedSubCategory;
        
        base = base.filter(b => b.transportTypes.some(t => 
          t === searchVal || t.replace(/\s/g, '') === searchVal.replace(/\s/g, '')
        ));
      } else {
        base = base.filter(b => b.subCategory === selectedSubCategory);
      }
    }

    return base;
  }, [mergedBorderCrossings, selectedCategory, selectedSubCategory]);

  const handleSelect = (border: BorderCrossing | null) => {
    setSelectedBorder(border);
    if (border) {
      setIsSidebarOpen(true);
      // Auto enable distance mode if not set to show route on selection
      if (!distanceMode) {
        setDistanceMode('ub');
      }
    } else {
      setIsSidebarOpen(false);
    }
  };

  const handleShowGoodDetail = (good: Good, status: { import?: GoodStatus; export?: GoodStatus }) => {
    setDetailModal({
      isOpen: true,
      good,
      status
    });
  };

  const closeDetailModal = () => {
    setDetailModal(prev => ({ ...prev, isOpen: false }));
  };

  const categories: PortCategory[] = ["Боомт", "Гүний гааль", "Хяналтын бүс", "Баталгаат бүс", "Чөлөөт бүс"];

  return (
    <div className="flex flex-col h-screen w-full bg-[#f3f4f6] overflow-hidden transition-all duration-300">
      {/* Header */}
      <header className="h-16 shrink-0 bg-white border-b border-[#e5e7eb] flex items-center px-4 md:px-6 justify-between z-[110] shadow-sm relative">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm md:text-xl font-bold tracking-tight text-[#111827] uppercase line-clamp-1">
              Боомтын Хяналтын Систем
            </h1>
            {(selectedCategory || selectedSubCategory) && (
               <div className="flex items-center gap-1.5 leading-none">
                 <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{selectedCategory}</span>
                 {selectedSubCategory && (
                   <>
                     <span className="text-[10px] text-gray-300">/</span>
                     <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest">{selectedSubCategory}</span>
                   </>
                 )}
               </div>
            )}
          </div>
        </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-600"
          >
            <MapPin className="w-5 h-5" />
          </button>
          <div className="flex gap-2 md:gap-8 items-center" ref={menuRef}>
          <div className="hidden md:flex p-1 bg-gray-100 rounded-xl gap-0.5 md:gap-1 relative">
            {categories.map(cat => (
              <div 
                key={cat} 
                className="relative"
              >
                <button
                  onClick={() => {
                    setSelectedCategory(cat);
                    const defaultToAll = cat === "Чөлөөт бүс" || cat === "Гүний гааль";
                    setSelectedSubCategory(defaultToAll ? null : MENU_STRUCTURE[cat][0]);
                    setSelectedBorder(null);
                    setIsSidebarOpen(false);
                    setHoveredCategory(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all flex items-center gap-1 ${
                    selectedCategory === cat 
                      ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" 
                      : "text-gray-500 hover:text-gray-900"
                  }`}
                >
                  {cat}
                  <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${(hoveredCategory ? hoveredCategory === cat : selectedCategory === cat) ? '' : 'rotate-180'}`} />
                </button>

              </div>
            ))}
          </div>

          <div className="flex gap-2 font-bold">
            <button 
              onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl text-xs md:text-sm font-bold transition-all ${
              isChatOpen 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden xs:inline">AI Туслах</span>
          </button>

          <button 
            onClick={() => setIsSourcesOpen(true)}
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-gray-900 border border-gray-700 text-white text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 whitespace-nowrap"
          >
            <Scale className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Эх сурвалж</span>
          </button>

          <button 
            onClick={() => setIsShareOpen(true)}
            className="flex items-center justify-center p-2 md:p-2.5 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95"
            title="Хуваалцах"
          >
            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
          </button>
          </div>
        </div>
      </header>
      
      {/* Sub-Category Navigation Bar */}
      <AnimatePresence>
        {selectedCategory && MENU_STRUCTURE[selectedCategory as keyof typeof MENU_STRUCTURE] && (
          <motion.div
            initial={{ height: 0, opacity: 0, y: -10 }}
            animate={{ height: 'auto', opacity: 1, y: 0 }}
            exit={{ height: 0, opacity: 0, y: -10 }}
            className="bg-white/95 backdrop-blur-md border-b border-gray-100 z-[100] shadow-sm relative overflow-hidden"
          >
            <div className="flex items-center gap-2 px-6 md:px-10 py-2 overflow-x-auto no-scrollbar scroll-smooth">
              <div className="flex items-center gap-2 min-w-max pr-6">
                <button
                  onClick={() => setSelectedSubCategory(null)}
                  className={`whitespace-nowrap px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all duration-300 ${
                    selectedSubCategory === null
                      ? "bg-gray-900 text-white shadow-md shadow-gray-200 -translate-y-px"
                      : "bg-gray-100/50 text-gray-500 hover:bg-gray-200/70 hover:text-gray-700"
                  }`}
                >
                  Бүх
                </button>
                
                <div className="w-px h-3 bg-gray-200 mx-1" />
                
                {MENU_STRUCTURE[selectedCategory as keyof typeof MENU_STRUCTURE].map(sub => (
                  <button
                    key={sub}
                    onClick={() => {
                      setSelectedSubCategory(sub);
                      setSelectedBorder(null);
                    }}
                    className={`whitespace-nowrap px-3 py-1 rounded-full text-[8px] font-bold uppercase tracking-widest transition-all duration-300 ${
                      selectedSubCategory === sub
                        ? "bg-blue-600 text-white shadow-md shadow-blue-100 -translate-y-px"
                        : "bg-gray-50/50 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    }`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Animated underline indicator fade effect */}
            <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-gray-100 to-transparent opacity-50" />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar / InfoPanel */}
        <div className={`${isSidebarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} fixed md:relative bottom-0 left-0 right-0 z-50 md:z-10 transition-transform duration-500`}>
          <Sidebar 
            borders={filteredCrossings} 
            selectedBorder={currentSelectedBorder} 
            onSelect={handleSelect} 
            onShowGoodDetail={handleShowGoodDetail}
            globalFilter={globalFilter}
            onFilterChange={setGlobalFilter}
            onClose={() => setIsSidebarOpen(false)}
            distanceMode={distanceMode}
            onDistanceModeChange={setDistanceMode}
            refreshTrigger={refreshTrigger}
          />
        </div>
        
        {/* Main Map Area */}
        <main className="flex-1 relative overflow-hidden bg-[#e2e8f0]">
          <BorderMap 
            borders={filteredCrossings} 
            selectedBorder={currentSelectedBorder} 
            onSelect={handleSelect} 
            globalFilter={globalFilter}
            distanceMode={distanceMode}
            onDistanceModeChange={setDistanceMode}
            refreshTrigger={refreshTrigger}
          />
          
          {/* Active Zone Indicator Overlay */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[1000] pointer-events-none">
            <div className="bg-white/80 backdrop-blur-md p-2 md:p-3 px-3 md:px-4 rounded-xl shadow-xl border border-white/20">
               <div className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                  {selectedCategory} • Хяналт
               </div>
               <div className="mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] md:text-[10px] font-mono text-gray-500 font-bold uppercase">Идэвхтэй • {filteredCrossings.length} нэгж</span>
               </div>
            </div>
          </div>

          <DataTable 
            borders={filteredCrossings}
            isOpen={isTableOpen}
            onToggle={() => setIsTableOpen(!isTableOpen)}
            onSelect={handleSelect}
          />
        </main>

        <AnimatePresence>
          {isChatOpen && <ChatPanel selectedBorder={currentSelectedBorder} onClose={() => setIsChatOpen(false)} />}
        </AnimatePresence>
      </div>

      <LegalDetailModal 
        isOpen={detailModal.isOpen}
        good={detailModal.good}
        status={detailModal.status}
        onClose={closeDetailModal}
      />

      <SourcesModal 
        isOpen={isSourcesOpen}
        onClose={() => setIsSourcesOpen(false)}
      />

      <ShareModal 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
      />

      <button 
        onClick={() => setIsDevOpen(true)}
        className="fixed bottom-6 right-6 z-[9999] flex items-center justify-center w-12 h-12 bg-white text-gray-400 rounded-full shadow-lg hover:bg-white hover:text-blue-600 hover:scale-110 active:scale-95 transition-all border border-gray-100 group"
        style={{ zIndex: 99999 }}
        title="Тохиргоо"
      >
        <Settings className="w-6 h-6 transition-transform group-hover:rotate-90 duration-500" />
      </button>

      <AdminImageModal 
        isOpen={isDevOpen}
        onClose={() => setIsDevOpen(false)}
        onUpdate={() => setRefreshTrigger(prev => prev + 1)}
        currentBorders={mergedBorderCrossings}
      />
    </div>
  );
}
