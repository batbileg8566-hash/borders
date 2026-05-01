import React, { useState, useMemo } from "react";
import { GOODS, PORT_GOODS, borderCrossings } from "../data";
import { BorderCrossing } from "../types";
import { Search, ChevronUp, ChevronDown, Download, Filter, Table as TableIcon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface DataTableProps {
  borders: BorderCrossing[];
  isOpen: boolean;
  onToggle: () => void;
}

export function DataTable({ borders, isOpen, onToggle }: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: keyof BorderCrossing; direction: 'asc' | 'desc' } | null>(null);

  const filteredAndSortedBorders = useMemo(() => {
    let result = [...borders];

    if (searchTerm) {
      result = result.filter(b => 
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.region.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        const valA = a[sortConfig.key as keyof BorderCrossing] ?? "";
        const valB = b[sortConfig.key as keyof BorderCrossing] ?? "";
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [borders, searchTerm, sortConfig]);

  const handleSort = (key: string) => {
    setSortConfig(current => ({
      key,
      direction: current?.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const exportToCSV = () => {
    const headers = ["Name", "Region", "Operational Status", "Traffic Status", "UB Distance (km)", "Aimag Distance (km)"];
    const rows = filteredAndSortedBorders.map(b => [
      b.name,
      b.region,
      b.operationalStatus,
      b.trafficStatus,
      b.ubDistance,
      b.aimagDistance
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "border_crossings_data.csv");
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className={`fixed md:absolute bottom-0 left-0 right-0 z-[1001] transition-all duration-500 ease-in-out ${isOpen ? 'h-[80%] md:h-[60%]' : 'h-12'}`}>
      {/* Handle / Trigger */}
      <button 
        onClick={onToggle}
        className="w-full h-12 bg-gray-900 text-white flex items-center justify-between px-6 hover:bg-black transition-colors rounded-t-2xl shadow-2xl"
      >
        <div className="flex items-center gap-2">
          <TableIcon className="w-4 h-4 text-blue-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.2em]">Нэгдсэн өгөгдлийн хүснэгт</span>
          <span className="ml-2 px-2 py-0.5 bg-blue-600 rounded text-[9px] font-bold">{filteredAndSortedBorders.length} БОМТ</span>
        </div>
        {isOpen ? <ChevronDown className="w-5 h-5 text-gray-400" /> : <ChevronUp className="w-5 h-5 text-blue-400 animate-bounce" />}
      </button>

      {/* Content */}
      <div className="h-[calc(100%-48px)] bg-white border-t border-gray-200 overflow-hidden flex flex-col shadow-inner">
        {/* Toolbar */}
        <div className="p-3 md:p-4 border-b border-gray-100 flex flex-col md:flex-row gap-3 md:items-center justify-between bg-gray-50/80 backdrop-blur-sm">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text"
              placeholder="Хайх (Боомт, Аймаг...)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2">
            <button 
              onClick={exportToCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-[10px] font-bold text-gray-600 uppercase hover:bg-gray-50 shadow-sm transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              CSV Экспорт
            </button>
            <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-400 hover:text-blue-600 shadow-sm transition-all">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Table container */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
              <tr>
                {([
                  { key: 'name', label: 'БООМТЫН НЭР', hiddenMobile: false },
                  { key: 'region', label: 'АЙМАГ', hiddenMobile: false },
                  { key: 'operationalStatus', label: 'ТҮВШИН', hiddenMobile: false },
                  { key: 'trafficStatus', label: 'АЧААЛАЛ', hiddenMobile: false },
                  { key: 'transportTypes', label: 'ТЭЭВРИЙН ТӨРӨЛ', hiddenMobile: false },
                  { key: 'ubDistance', label: 'УБ-ААС (КМ)', hiddenMobile: true },
                  { key: 'aimagDistance', label: 'ТӨВӨӨС (КМ)', hiddenMobile: true }
                ] as { key: keyof BorderCrossing; label: string; hiddenMobile: boolean }[]).map((col) => (
                  <th 
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-4 md:px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:bg-gray-100 transition-colors group ${col.hiddenMobile ? 'hidden md:table-cell' : ''}`}
                  >
                    <div className="flex items-center gap-2">
                      {col.label}
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity">
                        {sortConfig?.key === col.key && sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                      </span>
                    </div>
                  </th>
                ))}
                <th className="hidden md:table-cell px-6 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">БАРААНЫ ХҮРТЭЭМЖ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredAndSortedBorders.map(border => (
                <tr key={border.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900">{border.name}</span>
                  </td>
                  <td className="px-6 py-4 text-xs font-semibold text-gray-500">{border.region}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        border.operationalStatus === 'Олон улсын' ? 'bg-blue-600' : 
                        border.operationalStatus === 'Хоёр талын' ? 'bg-amber-500' : 'bg-slate-500'
                      }`} />
                      <span className="text-xs font-bold text-gray-700">{border.operationalStatus}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      border.trafficStatus === 'Хэвийн' ? 'bg-emerald-50 text-emerald-600' :
                      border.trafficStatus === 'Ачаалалтай' ? 'bg-amber-50 text-amber-600' :
                      'bg-rose-50 text-rose-600'
                    }`}>
                      {border.trafficStatus}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                       {border.transportTypes.map(t => (
                         <span key={t} title={t} className="text-sm">
                           {t === 'Автозам' ? '🚗' : t === 'Төмөр зам' ? '🚂' : '📡'}
                         </span>
                       ))}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-blue-600 hidden md:table-cell">{border.ubDistance}</td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-gray-600 hidden md:table-cell">{border.aimagDistance}</td>
                  <td className="px-6 py-4 hidden md:table-cell">
                    <div className="flex gap-1">
                      {GOODS.slice(0, 5).map(g => {
                        const status = PORT_GOODS[border.id]?.[g.id]?.import;
                        return (
                          <div 
                            key={g.id}
                            title={`${g.name}: ${status || 'Мэдээлэлгүй'}`}
                            className={`w-6 h-6 rounded flex items-center justify-center text-[10px] border ${
                              status === 'ok' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                              status === 'warn' ? 'bg-orange-50 border-orange-100 text-orange-600' :
                              status === 'crit' ? 'bg-red-50 border-red-100 text-red-600' :
                              'bg-gray-50 border-gray-100 text-gray-300'
                            }`}
                          >
                            {g.icon}
                          </div>
                        );
                      })}
                      {GOODS.length > 5 && <span className="text-[10px] text-gray-300 self-center">+{GOODS.length - 5}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
