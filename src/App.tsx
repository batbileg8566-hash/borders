/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo } from "react";
import { AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BorderMap } from "./BorderMap";
import { LegalDetailModal } from "./LegalDetailModal";
import { ChatPanel } from "./components/ChatPanel";
import { DataTable } from "./components/DataTable";
import { borderCrossings } from "./data";
import { BorderCrossing, Good, GoodStatus, Direction, PortCategory } from "./types";
import { MessageSquare, MapPin, Scale } from "lucide-react";
import { SourcesModal } from "./SourcesModal";

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

  const [selectedCategory, setSelectedCategory] = useState<PortCategory>("Боомт");

  const filteredCrossings = useMemo(() => {
    // If we're not on "Боомт", we might need more data. 
    // Currently, all existing data in borderCrossings are "Боомт" (ports).
    if (selectedCategory === "Боомт") {
      return borderCrossings.filter(b => !b.category || b.category === "Боомт");
    }
    return borderCrossings.filter(b => b.category === selectedCategory);
  }, [selectedCategory]);

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
      <header className="h-16 shrink-0 bg-white border-b border-[#e5e7eb] flex items-center px-4 md:px-6 justify-between z-20 shadow-sm">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200 shrink-0">
            <svg width="20" height="20" className="md:w-6 md:h-6" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h1 className="text-sm md:text-xl font-bold tracking-tight text-[#111827] uppercase line-clamp-1">
            Боомтын Хяналтын Систем
          </h1>
        </div>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2 rounded-lg bg-gray-100 text-gray-600"
          >
            <MapPin className="w-5 h-5" />
          </button>
          <div className="flex gap-2 md:gap-8 items-center">
          <div className="hidden md:flex p-1 bg-gray-100 rounded-xl gap-0.5 md:gap-1">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat);
                  setSelectedBorder(null);
                  setIsSidebarOpen(false);
                }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-tight transition-all ${
                  selectedCategory === cat 
                    ? "bg-white text-blue-600 shadow-sm ring-1 ring-black/5" 
                    : "text-gray-500 hover:text-gray-900"
                }`}
              >
                {cat}
              </button>
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
            className="flex items-center gap-2 px-3 md:px-4 py-1.5 md:py-2 rounded-xl bg-gray-900 text-white text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-lg shadow-gray-200 whitespace-nowrap"
          >
            <Scale className="w-3.5 h-3.5 md:w-4 md:h-4" />
            <span className="hidden sm:inline">Эх сурвалж</span>
          </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar / InfoPanel */}
        <div className={`${isSidebarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} fixed md:relative bottom-0 left-0 right-0 z-50 md:z-10 transition-transform duration-500`}>
          <Sidebar 
            borders={filteredCrossings} 
            selectedBorder={selectedBorder} 
            onSelect={handleSelect} 
            onShowGoodDetail={handleShowGoodDetail}
            globalFilter={globalFilter}
            onFilterChange={setGlobalFilter}
            onClose={() => setIsSidebarOpen(false)}
            distanceMode={distanceMode}
            onDistanceModeChange={setDistanceMode}
          />
        </div>
        
        {/* Main Map Area */}
        <main className="flex-1 relative overflow-hidden bg-[#e2e8f0]">
          <BorderMap 
            borders={filteredCrossings} 
            selectedBorder={selectedBorder} 
            onSelect={handleSelect} 
            globalFilter={globalFilter}
            distanceMode={distanceMode}
            onDistanceModeChange={setDistanceMode}
          />
          
          {/* Active Zone Indicator Overlay */}
          <div className="absolute top-4 left-4 md:top-6 md:left-6 z-[1000] pointer-events-none">
            <div className="bg-white/80 backdrop-blur-md p-2 md:p-3 px-3 md:px-4 rounded-xl shadow-xl border border-white/20">
               <div className="text-[8px] md:text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                  {selectedCategory} • Хяналт
               </div>
               <div className="mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] md:text-[10px] font-mono text-gray-500 font-bold uppercase">Сул • {filteredCrossings.length} нэгж</span>
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
          {isChatOpen && <ChatPanel selectedBorder={selectedBorder} onClose={() => setIsChatOpen(false)} />}
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
    </div>
  );
}
