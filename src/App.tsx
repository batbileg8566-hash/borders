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

  const handleSelect = (border: BorderCrossing | null) => {
    setSelectedBorder(border);
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
    <div className={`grid ${isChatOpen ? 'grid-cols-[350px_1fr_350px]' : 'grid-cols-[350px_1fr]'} grid-rows-[64px_1fr] h-screen w-full bg-[#f3f4f6] overflow-hidden transition-all duration-300`}>
      {/* Header */}
      <header className="col-span-2 bg-white border-b border-[#e5e7eb] flex items-center px-6 justify-between z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-200">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-[#111827] uppercase">
            Боомтын Хяналтын Систем
          </h1>
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex gap-6 text-[11px] font-bold uppercase tracking-wider">
            <div className="flex items-center gap-2 text-emerald-600">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span> 
              Хэвийн: {trafficCounts["Хэвийн"] || 0}
            </div>
            <div className="flex items-center gap-2 text-amber-600">
              <span className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"></span> 
              Ачаалалтай: {trafficCounts["Ачаалалтай"] || 0}
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]"></span> 
              Квот тулсан: {trafficCounts["Квот тулсан"] || 0}
            </div>
          </div>

          <button 
            onClick={() => setIsChatOpen(!isChatOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isChatOpen 
                ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>AI Туслах</span>
          </button>
        </div>
      </header>

      {/* Sidebar / InfoPanel */}
      <Sidebar 
        borders={borderCrossings} 
        selectedBorder={selectedBorder} 
        onSelect={handleSelect} 
        onShowGoodDetail={handleShowGoodDetail}
        globalFilter={globalFilter}
        onFilterChange={setGlobalFilter}
      />
      
      {/* Main Map Area */}
      <main className="relative h-full overflow-hidden bg-[#e2e8f0]">
        <BorderMap 
          borders={borderCrossings} 
          selectedBorder={selectedBorder} 
          onSelect={handleSelect} 
          globalFilter={globalFilter}
          distanceMode={distanceMode}
          onDistanceModeChange={setDistanceMode}
        />
        
        {/* Active Zone Indicator Overlay */}
        <div className="absolute top-6 left-6 z-[1000] pointer-events-none">
          <div className="bg-white/80 backdrop-blur-md p-3 px-4 rounded-xl shadow-xl border border-white/20">
             <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                Идэвхтэй Хяналтын Бүс
             </div>
             <div className="mt-1 flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-mono text-gray-500 font-bold uppercase">Демо горим • статик өгөгдөл</span>
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

      <LegalDetailModal 
        isOpen={detailModal.isOpen}
        good={detailModal.good}
        status={detailModal.status}
        onClose={closeDetailModal}
      />
    </div>
  );
}
