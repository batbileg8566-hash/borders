import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Share2, Copy, Check, Facebook, Camera, ImageIcon } from "lucide-react";

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShareModal({ isOpen, onClose }: ShareModalProps) {
  const [image, setImage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    return () => {
      if (image && image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      if (image && image.startsWith('blob:')) {
        URL.revokeObjectURL(image);
      }
      const url = URL.createObjectURL(file);
      setImage(url);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Боомтын Хяналтын Систем',
          text: 'Боомтын хяналтын дата мэдээллийн дашборд',
          url: window.location.href,
        });
      } catch (err) {
        console.error("Share failed", err);
      }
    } else {
      alert("Таны хөтөч Share API-г дэмжихгүй байна.");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden border border-gray-100"
          >
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Дашбордоо хуваалцах</h2>
                  <p className="text-xs text-gray-500 font-medium tracking-tight">Бусад хүмүүстэй мэдээлэл солилцох</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-full transition-colors shadow-sm"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* File Upload Area */}
              {!image ? (
                <div
                  onDragOver={onDragOver}
                  onDragLeave={onDragLeave}
                  onDrop={onDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`relative group cursor-pointer border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center transition-all ${
                    isDragging 
                      ? 'border-blue-500 bg-blue-50/50 scale-[0.98]' 
                      : 'border-gray-200 hover:border-blue-400 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="w-8 h-8 text-blue-500" />
                  </div>
                  <p className="text-sm font-bold text-gray-700">Скриншот эсвэл зураг татах</p>
                  <p className="text-xs text-gray-500 mt-1">Drag & Drop эсвэл энд дарж хуулна уу</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative group rounded-2xl overflow-hidden bg-gray-100 border border-gray-200 aspect-video flex items-center justify-center shadow-inner">
                    <img src={image} alt="Preview" className="max-h-full object-contain" />
                    <button
                      onClick={() => setImage(null)}
                      className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <ImageIcon className="w-4 h-4 text-blue-500" />
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wider">Зураг бэлэн боллоо</p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={handleCopy}
                  className={`flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold transition-all ${
                    copied 
                      ? "bg-green-500 text-white shadow-lg shadow-green-100" 
                      : "bg-gray-900 text-white hover:bg-black shadow-lg shadow-gray-200 active:scale-95"
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Хуулагдлаа!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      <span>Холбоос хуулах</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleNativeShare}
                  className="flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-blue-600 text-white font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Шууд хуваалцах</span>
                </button>
              </div>

              {/* Mobile Social Hint */}
              <div className="flex items-center justify-center gap-6 pt-2">
                <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Facebook className="w-5 h-5 text-blue-600" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Facebook</span>
                </div>
                <div className="flex flex-col items-center gap-1 opacity-40 hover:opacity-100 cursor-pointer transition-opacity">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <Camera className="w-5 h-5 text-emerald-600" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">Instagram</span>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 text-center">
               <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">Монгол Улсын Гаалийн Ерөнхий Газар</p>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
