import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Upload, Copy, Check, Terminal, Zap, Image as ImageIcon } from "lucide-react";

interface ImageDeveloperModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageDeveloperModal({ isOpen, onClose }: ImageDeveloperModalProps) {
  const [base64, setBase64] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processImage = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDim = 800;

        if (width > height) {
          if (width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/webp', 0.75);
          setBase64(dataUrl);
        }
        setIsProcessing(false);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processImage(file);
  };

  const handleCopy = async () => {
    if (!base64) return;
    try {
      await navigator.clipboard.writeText(base64);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy!", err);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 30 }}
            className="relative bg-white w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200"
          >
            {/* Dev Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center shadow-lg">
                  <Terminal className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900 leading-none">Developer Image Utility</h2>
                  <p className="text-xs text-slate-500 font-mono mt-1">Compress & Base64 Encoder</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white rounded-full transition-colors border border-transparent hover:border-slate-200"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="p-8 space-y-6">
              {!base64 ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="group cursor-pointer border-2 border-dashed border-slate-200 rounded-2xl p-12 flex flex-col items-center justify-center transition-all hover:border-blue-500 hover:bg-blue-50/30"
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={onFileChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <div className="w-20 h-20 bg-slate-100 rounded-3xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all">
                    {isProcessing ? (
                      <Zap className="w-10 h-10 text-blue-500 animate-pulse" />
                    ) : (
                      <Upload className="w-10 h-10 text-slate-400 group-hover:text-blue-500" />
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">Зураг сонгож кодлох</h3>
                  <p className="text-sm text-slate-500 mt-2 text-center max-w-xs">
                    Зураг автоматаар 800px хүртэл жижигсч, WebP форматаар Base64 болж хөрвөнө.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Preview */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Compressed Preview</label>
                    <div className="aspect-square rounded-2xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shadow-inner">
                      <img src={base64} alt="Compressed" className="max-h-full object-contain p-2" />
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                       <Zap className="w-3.5 h-3.5 text-blue-500" />
                       <span className="text-[11px] font-mono font-bold text-slate-600 uppercase tracking-tighter">
                         Size: {(base64.length / 1024).toFixed(1)} KB
                       </span>
                    </div>
                  </div>

                  {/* Output */}
                  <div className="flex flex-col gap-3">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Base64 String Output</label>
                    <textarea
                      readOnly
                      value={base64}
                      className="flex-1 w-full bg-slate-900 text-slate-400 font-mono text-[10px] p-4 rounded-2xl border border-slate-800 resize-none shadow-inner focus:outline-none"
                    />
                    <button
                      onClick={() => setBase64(null)}
                      className="text-[10px] font-bold text-red-500 hover:text-red-600 uppercase tracking-widest py-1"
                    >
                      Clear & Upload New
                    </button>
                  </div>
                </div>
              )}

              {/* Copy Button */}
              {base64 && (
                <div className="pt-2">
                  <button
                    onClick={handleCopy}
                    className={`w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-black text-sm transition-all ${
                      copied 
                        ? "bg-emerald-500 text-white shadow-xl shadow-emerald-100 scale-[0.98]" 
                        : "bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-100 active:scale-95"
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-5 h-5" />
                        <span>КОД ХУУЛАГДЛАА!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-5 h-5" />
                        <span>ЗУРГИЙН ХОЛБООСЫГ ХУУЛАХ (Base64)</span>
                      </>
                    )}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 mt-4 font-bold uppercase tracking-widest">
                    Одоо data.ts файлынхаа imageUrl хэсэгт Paste хийгээрэй
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
              <div className="flex items-center justify-center gap-2">
                <Terminal className="w-3 h-3 text-slate-400" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Internal Developer Tool v1.0</p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
