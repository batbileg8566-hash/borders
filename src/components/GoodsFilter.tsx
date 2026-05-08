import React, { useState, useEffect, useMemo } from 'react';
import { Filter, Search, X } from 'lucide-react';
import { Good, Direction, BorderCrossing } from '../types';
import { GOODS } from '../data';

import { useGlobalFilter, useSetGlobalFilter, useClearFilter } from '../store/useSidebarStore';

interface GoodsFilterProps {
  borders: BorderCrossing[];
  refreshTrigger: number;
}

export const GoodsFilter: React.FC<GoodsFilterProps> = ({ 
  borders,
  refreshTrigger 
}) => {
  const globalFilter = useGlobalFilter();
  const setGlobalFilter = useSetGlobalFilter();
  const clearFilter = useClearFilter();
  const [searchTerm, setSearchTerm] = useState('');
  const [customGoodImages, setCustomGoodImages] = useState<Record<string, string>>({});

  useEffect(() => {
    const stored = localStorage.getItem('customGoodImages');
    if (stored) {
      try {
        setCustomGoodImages(JSON.parse(stored));
      } catch (e) {
        console.warn("Failed to parse customGoodImages from localStorage", e);
      }
    }
  }, [refreshTrigger]);

  const filteredGoods = useMemo(() => {
    return GOODS.filter(g => 
      g.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const getPortCount = (goodId: string, direction: Direction) => {
    return borders.filter(b => {
      const list = direction === 'import' ? b.legalImports : b.legalExports;
      return list?.some(item => item.goodId === goodId);
    }).length;
  };

  return (
    <div className="flex flex-col h-full bg-white/50">
      {/* Direction Toggle */}
      <div className="px-4 py-3 border-b border-gray-100">
        <div className="flex p-1 bg-gray-100 rounded-xl">
          <button
            onClick={() => setGlobalFilter({ direction: 'import' })}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              globalFilter.direction === 'import' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Импорт
          </button>
          <button
            onClick={() => setGlobalFilter({ direction: 'export' })}
            className={`flex-1 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-lg transition-all ${
              globalFilter.direction === 'export' 
                ? 'bg-white text-blue-600 shadow-sm' 
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Экспорт
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 py-3">
        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Бараа хайх..."
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

      {/* Goods List */}
      <div className="flex-1 overflow-y-auto px-2 pb-4 pt-1 custom-scrollbar space-y-0.5">
        {filteredGoods.map((g) => {
          const isActive = globalFilter.goodId === g.id;
          const count = getPortCount(g.id, globalFilter.direction);
          
          return (
            <button
              key={g.id}
              onClick={() => setGlobalFilter({ 
                direction: globalFilter.direction,
                goodId: isActive ? null : g.id 
              })}
              className={`w-full group flex items-center justify-between p-2.5 rounded-xl transition-all ${
                isActive 
                  ? "bg-blue-50 border border-blue-100 shadow-sm" 
                  : "hover:bg-gray-100/80 border border-transparent"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                  isActive ? "bg-white" : "bg-gray-100 group-hover:bg-white"
                }`}>
                  {customGoodImages[g.id] ? (
                    <img src={customGoodImages[g.id]} className="w-5 h-5 object-contain" alt={g.name} />
                  ) : (
                    <span className="text-lg leading-none">{g.icon}</span>
                  )}
                </div>
                <div className="flex flex-col items-start leading-none min-w-0">
                  <span className={`text-[11px] font-bold truncate ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                    {g.name}
                  </span>
                  <span className={`text-[9px] font-medium mt-1 ${isActive ? 'text-blue-500/60' : 'text-gray-400'}`}>
                    {globalFilter.direction === 'import' ? 'Импортлох боломжтой' : 'Экспортлох боломжтой'}
                  </span>
                </div>
              </div>
              
              <div className={`px-2 py-1 rounded-lg text-[10px] font-black font-mono transition-all ${
                isActive ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500 group-hover:bg-gray-300"
              }`}>
                {count}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
