import React, { useState, useRef } from 'react';
import { X, Upload, Check, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { borderCrossings, GOODS } from '../data';

interface AdminImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const AdminImageModal: React.FC<AdminImageModalProps> = ({ isOpen, onClose, onUpdate }) => {
  const [mode, setMode] = useState<'port' | 'good'>('port');
  const [selectedId, setSelectedId] = useState(borderCrossings[0].id);
  const [preview, setPreview] = useState<string | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // When mode changes, reset selection
  const handleModeChange = (newMode: 'port' | 'good') => {
    setMode(newMode);
    setSelectedId(newMode === 'port' ? borderCrossings[0].id : '_default');
    setPreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/webp', 0.75);
        setPreview(dataUrl);
        setIsCompressing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!preview) return;
    
    const storageKey = mode === 'port' ? 'customPortImages' : 'customGoodImages';
    const existing = JSON.parse(localStorage.getItem(storageKey) || '{}');
    existing[selectedId] = preview;
    localStorage.setItem(storageKey, JSON.stringify(existing));
    
    onUpdate();
    onClose();
    setPreview(null);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
            <div>
              <h2 className="text-xl font-black text-gray-900 leading-tight">Зураг шинэчлэх</h2>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-0.5">Портын зураг солих (Local Only)</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-400 hover:text-gray-900">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 space-y-6">
            <div className="flex p-1 bg-gray-100 rounded-2xl">
              <button 
                onClick={() => handleModeChange('port')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${mode === 'port' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
              >
                Боомт
              </button>
              <button 
                onClick={() => handleModeChange('good')}
                className={`flex-1 py-2 rounded-xl text-xs font-black uppercase transition-all ${mode === 'good' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-400'}`}
              >
                Бараа / Лого
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">
                {mode === 'port' ? 'Порт сонгох' : 'Бараа / Төрөл сонгох'}
              </label>
              <select 
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full bg-gray-100 border-none rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
              >
                {mode === 'port' ? (
                  borderCrossings.map(port => (
                    <option key={port.id} value={port.id}>{port.name}</option>
                  ))
                ) : (
                  <>
                    <option value="_default">Үндсэн Logo (Default)</option>
                    {GOODS.map(good => (
                      <option key={good.id} value={good.id}>{good.icon} {good.name}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-1">Шинэ зураг</label>
              <div 
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-48 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${
                  preview ? 'border-blue-500 bg-blue-50/20' : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                }`}
              >
                {preview ? (
                  <img src={preview} className="w-full h-full object-cover rounded-[22px]" alt="Preview" />
                ) : (
                  <div className="text-center space-y-2">
                    <Upload className={`mx-auto ${isCompressing ? 'animate-bounce' : ''} text-gray-400`} />
                    <p className="text-sm font-bold text-gray-500">{isCompressing ? 'Боловсруулж байна...' : 'Зураг сонгох'}</p>
                  </div>
                )}
                <input 
                  type="file" 
                  className="hidden" 
                  ref={fileInputRef} 
                  accept="image/*"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>

          <div className="p-6 pt-0">
            <button 
              disabled={!preview || isCompressing}
              onClick={handleSave}
              className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm flex items-center justify-center gap-2 transition-all ${
                !preview || isCompressing 
                  ? 'bg-gray-100 text-gray-300' 
                  : 'bg-blue-600 text-white shadow-lg shadow-blue-200 active:scale-[0.98]'
              }`}
            >
              <Check size={18} />
              Хадгалах
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
