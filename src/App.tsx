/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import { Sidebar } from "./Sidebar";
import { BorderMap } from "./BorderMap";
import { LegalDetailModal } from "./LegalDetailModal";
import { ChatPanel } from "./components/ChatPanel";
import { DataTable } from "./components/DataTable";
import { borderCrossings } from "./data";
import { BorderCrossing, Good, GoodStatus, Direction } from "./types";
import { MessageSquare, MapPin } from "lucide-react";

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

  const handleSelect = (border: BorderCrossing | null) => {
    setSelectedBorder(border);
    if (border) setIsSidebarOpen(true);
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

  // Count general statuses for the header
  const trafficCounts = borderCrossings.reduce((acc, b) => {
    acc[b.trafficStatus] = (acc[b.trafficStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
          <div className="flex gap-2 md:gap-4 items-center">
          <div className="hidden sm:flex gap-4 md:gap-6 text-[10px] md:text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5 md:gap-2 text-emerald-600">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> 
              Хэвийн: {trafficCounts["Хэвийн"] || 0}
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-amber-600">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> 
              Ачаалалтай: {trafficCounts["Ачаалалтай"] || 0}
            </div>
            <div className="flex items-center gap-1.5 md:gap-2 text-rose-600">
              <span className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span> 
              Квот тулсан: {trafficCounts["Квот тулсан"] || 0}
            </div>
          </div>

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
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar / InfoPanel */}
        <div className={`${isSidebarOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'} fixed md:relative bottom-0 left-0 right-0 z-50 md:z-10 transition-transform duration-500`}>
          <Sidebar 
            borders={borderCrossings} 
            selectedBorder={selectedBorder} 
            onSelect={handleSelect} 
            onShowGoodDetail={handleShowGoodDetail}
            globalFilter={globalFilter}
            onFilterChange={setGlobalFilter}
            onClose={() => setIsSidebarOpen(false)}
          />
        </div>
        
        {/* Main Map Area */}
        <main className="flex-1 relative overflow-hidden bg-[#e2e8f0]">
          <BorderMap 
            borders={borderCrossings} 
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
                  Идэвхтэй Хяналтын Бүс
               </div>
               <div className="mt-0.5 md:mt-1 flex items-center gap-1.5 md:gap-2">
                  <div className="w-1.5 h-1.5 md:w-2 md:h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                  <span className="text-[8px] md:text-[10px] font-mono text-gray-500 font-bold uppercase">Демо • статик өгөгдөл</span>
               </div>
            </div>
          </div>

          <DataTable 
            borders={borderCrossings}
            isOpen={isTableOpen}
            onToggle={() => setIsTableOpen(!isTableOpen)}
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
    </div>
  );
}
