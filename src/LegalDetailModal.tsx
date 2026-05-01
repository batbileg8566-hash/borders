import React from "react";
import { Good, GoodStatus } from "./types";
import { X, FileText, CheckCircle, AlertCircle, AlertTriangle, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface LegalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  good: Good | null;
  status: { import?: GoodStatus; export?: GoodStatus };
}

export function LegalDetailModal({ isOpen, onClose, good, status }: LegalDetailModalProps) {
  if (!good) return null;

  const getStatusIcon = (s?: GoodStatus) => {
    switch (s) {
      case "ok": return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case "warn": return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case "crit": return <AlertCircle className="w-4 h-4 text-rose-500" />;
      default: return null;
    }
  };

  const getStatusText = (s?: GoodStatus) => {
    switch (s) {
      case "ok": return "Зөвшөөрөгдсөн (Тогтоолтой)";
      case "warn": return "Санал оруулсан";
      case "crit": return "Хуулийн нэмэлт шаардлагатай";
      default: return "Нэвтрүүлэхгүй";
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[2000]"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-xl shadow-2xl z-[2001] overflow-hidden border border-gray-200"
          >
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{good.icon}</span>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 leading-tight">{good.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Бараа бүтээгдэхүүний дэлгэрэнгүй</p>
                </div>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Status Section */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Импорт</div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(status.import)}
                    <span className="text-xs font-bold text-gray-700">{getStatusText(status.import)}</span>
                  </div>
                </div>
                <div className="p-3 rounded-lg border border-gray-100 bg-gray-50/50">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2">Экспорт</div>
                  <div className="flex items-center gap-2 mb-1">
                    {getStatusIcon(status.export)}
                    <span className="text-xs font-bold text-gray-700">{getStatusText(status.export)}</span>
                  </div>
                </div>
              </div>

              {/* Resolution / Sources */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-blue-600">
                    <FileText className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide font-mono">Эрх зүйн эх сурвалж</span>
                  </div>
                  <div className="space-y-3 pl-6 border-l-2 border-blue-100">
                    {status.import && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Импортын зохицуулалт:</div>
                        <p className="text-sm font-medium text-gray-800 leading-snug">{good.sources.import}</p>
                      </div>
                    )}
                    {status.export && (
                      <div className="space-y-1">
                        <div className="text-[10px] font-bold text-gray-400 uppercase">Экспортын зохицуулалт:</div>
                        <p className="text-sm font-medium text-gray-800 leading-snug">{good.sources.export}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600">
                    <Info className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase tracking-wide font-mono">Тайлбар</span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed pl-6">
                    {good.detail}
                  </p>
                </div>
              </div>

              {/* Special Warnings (oil case from vanilla code) */}
              {(status.import === 'crit' || status.export === 'crit') && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-lg">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
                    <div>
                      <h4 className="text-sm font-bold text-rose-800 mb-1">Хууль эрх зүйн санал</h4>
                      <p className="text-xs text-rose-700 leading-relaxed">
                        {good.id === 'oil' 
                          ? "ОАТ-ын тухай хуулийн 6.2 заалтад нэмэх нэмэлт өөрчлөлт оруулах шаардлагатай. Боомтоор нефт авах талаар тохиролцсон ч хуульд нэрлэгдээгүй байна."
                          : "Тухайн боомтыг холбогдох тогтоол/хуульд нэмүүлэх шаардлагатай байна."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={onClose}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-md"
              >
                Хаах
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
