import React, { useState, useMemo } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { BorderCrossing } from '../types';

import { useSelectedBorder, useSetSelectedBorder, useSetExpandedSection } from '../store/useSidebarStore';

interface PortSelectorProps {
  borders: BorderCrossing[];
}

export const PortSelector: React.FC<PortSelectorProps> = ({
  borders,
}) => {
  const selectedBorder = useSelectedBorder();
  const setSelectedBorder = useSetSelectedBorder();
  const setExpandedSection = useSetExpandedSection();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPorts = useMemo(() => {
    return borders.filter(b => 
      b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.region.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [borders, searchTerm]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Олон улсын': return 'bg-blue-500';
      case 'Хоёр талын': return 'bg-amber-500';
      case 'Түр': return 'bg-gray-400';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white/50">
      {/* Search */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Боомт хайх..."
            className="w-full bg-white border border-gray-200 rounded-xl py-2 pl-9 pr-8 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
          />
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-3 h-3 text-gray-400" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-2 custom-scrollbar space-y-0.5">
        <button
          onClick={() => setSelectedBorder(null)}
          className={`w-full text-left px-3 py-2.5 rounded-xl text-[11px] font-bold transition-all flex items-center gap-3 border ${
            !selectedBorder 
              ? 'bg-blue-50 border-blue-100 text-blue-700 shadow-sm' 
              : 'bg-transparent border-transparent hover:bg-gray-100/80 text-gray-500'
          }`}
        >
          <div className={`w-2 h-2 rounded-full ${!selectedBorder ? 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'bg-gray-300'}`} />
          Бүх боомт
        </button>

        {filteredPorts.map((b) => (
          <button
            key={b.id}
            onClick={() => {
              setSelectedBorder(selectedBorder?.id === b.id ? null : b);
              setExpandedSection(null);
            }}
            className={`w-full group flex items-start justify-between p-3 rounded-xl transition-all border ${
              selectedBorder?.id === b.id 
                ? "bg-blue-50 border-blue-100 shadow-sm" 
                : "bg-transparent border-transparent hover:bg-gray-100/80"
            }`}
          >
            <div className="flex gap-3 min-w-0">
              <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${getStatusColor(b.operationalStatus)} ${selectedBorder?.id === b.id ? 'shadow-[0_0_8px_currentColor]' : ''}`} />
              <div className="flex flex-col items-start leading-none min-w-0">
                <span className={`text-[11px] font-bold truncate ${selectedBorder?.id === b.id ? 'text-blue-700' : 'text-gray-700'}`}>
                  {b.name}
                </span>
                <span className="text-[9px] font-medium text-gray-400 mt-1.5 line-clamp-1">
                  {b.region} • {b.neighborPortName}
                </span>
              </div>
            </div>
            {b.operationalStatus && (
              <span className={`ml-2 px-1.5 py-0.5 rounded text-[8px] font-black uppercase whitespace-nowrap transition-colors ${
                selectedBorder?.id === b.id ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {b.operationalStatus}
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
