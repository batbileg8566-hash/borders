import { motion, AnimatePresence } from "motion/react";
import { X, ExternalLink, FileText } from "lucide-react";
import { GOVERNMENT_RESOLUTIONS } from "./constants";

interface SourcesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SourcesModal({ isOpen, onClose }: SourcesModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000]"
          />

          {/* Modal Container */}
          <div className="fixed inset-0 flex items-center justify-center p-4 md:p-6 z-[2001] pointer-events-none">
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden pointer-events-auto"
            >
              {/* Header */}
              <div className="p-6 md:p-8 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight uppercase leading-none">Эх сурвалж</h2>
                    <p className="text-[11px] text-gray-500 font-bold uppercase tracking-widest mt-1">МУ-ын Засгийн газрын тогтоолууд</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-all"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
                {GOVERNMENT_RESOLUTIONS.map((res, idx) => (
                  <div key={res.id} className="group relative">
                    <div className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-xs font-black text-gray-400 border border-gray-100 group-hover:bg-blue-600 group-hover:text-white group-hover:border-blue-600 transition-colors">
                        {idx + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <h3 className="text-sm font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {res.title}
                        </h3>
                        <p className="text-xs text-gray-600 leading-relaxed font-medium">
                          {res.description}
                        </p>
                        {res.additional && (
                          <div className="text-[10px] text-gray-400 leading-relaxed italic border-l-2 border-gray-100 pl-3 py-0.5">
                            {res.additional}
                          </div>
                        )}
                        <a
                          href={res.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-blue-600 hover:text-blue-800 pt-1"
                        >
                          Тогтоолыг үзэх
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                    {idx < GOVERNMENT_RESOLUTIONS.length - 1 && (
                      <div className="mt-6 border-b border-gray-50 ml-12" />
                    )}
                  </div>
                ))}
              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
                 <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                   Сүүлийн шинэчлэл: 2024
                 </p>
                 <button
                   onClick={onClose}
                   className="px-6 py-2.5 bg-gray-900 text-white text-[11px] font-black uppercase tracking-widest rounded-xl hover:bg-black transition-all shadow-lg shadow-gray-200"
                 >
                   Хаах
                 </button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
