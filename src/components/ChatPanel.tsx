import React, { useState, useRef, useEffect } from "react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { motion, AnimatePresence } from "motion/react";
import { MessageSquare, Send, X, Bot, User, Loader2, Sparkles } from "lucide-react";
import { borderCrossings, GOODS, PORT_GOODS } from "../data";
import { BorderCrossing } from "../types";

interface Message {
  role: "user" | "model";
  text: string;
}

export function ChatPanel({ selectedBorder, onClose }: { selectedBorder: BorderCrossing | null, onClose?: () => void }) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "model", text: "Сайн байна уу? Би боомтын мэдээллийн туслах байна. Танд юугаар туслах вэ?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setIsLoading(true);

    try {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined");
      }
      const genAI = new GoogleGenerativeAI(apiKey);
      
      // Inject context about the selected port
      let context = "";
      if (selectedBorder) {
        const portGoods = PORT_GOODS[selectedBorder.id] || {};
        context = `
          Хэрэглэгч ${selectedBorder.name} боомтыг сонгосон байна.
          Боомтын мэдээлэл:
          - Нэр: ${selectedBorder.name}
          - Аймаг: ${selectedBorder.region}
          - Зэрэглэл: ${selectedBorder.operationalStatus}
          - Ачаалал: ${selectedBorder.trafficStatus}
          - Тээвэр: ${selectedBorder.transportTypes.join(', ')}
          - Бараануудын горим: ${Object.entries(portGoods).map(([gid, status]) => {
            const g = GOODS.find(good => good.id === gid);
            return `${g?.name}: Импорт(${status.import}), Экспорт(${status.export})`;
          }).join('; ')}
          
          Хэрэглэгчийн асуулт: ${userMessage}
          
          Та боомтын мэргэжилтэн шиг хариулна уу. Зөвхөн энэ боомтын мэдээлэлд тулгуурлаж хариулна уу.
        `;
      } else {
        context = `
          Хэрэглэгч ямар нэгэн боомт сонгоогүй байна. 
          Та хэрэглэгчээс "Та эхлээд газрын зураг эсвэл жагсаалтаас боомтоо сонгоно уу" гэж эелдэгээр хүснэ үү.
          Хэрэглэгчийн асуулт: ${userMessage}
        `;
      }

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(context);
      const response = await result.response;
      const responseText = response.text() || "Уучлаарай, хариулт авахад алдаа гарлаа.";
      setMessages(prev => [...prev, { role: "model", text: responseText }]);
    } catch (error) {
      console.error("Gemini Error:", error);
      setMessages(prev => [...prev, { role: "model", text: "Алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="w-[350px] bg-white border-l border-gray-200 h-full flex flex-col shadow-2xl z-30"
    >
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-blue-600 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          <h2 className="font-black text-sm uppercase tracking-widest">AI Туслах</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-gray-50/50"
      >
        <AnimatePresence initial={false}>
          {messages.map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[85%] p-3 rounded-2xl text-sm ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white rounded-tr-none' 
                  : 'bg-white border border-gray-100 text-gray-700 shadow-sm rounded-tl-none'
              }`}>
                <div className="flex items-center gap-2 mb-1 opacity-50">
                  {msg.role === 'model' ? <Bot className="w-3 h-3" /> : <User className="w-3 h-3" />}
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    {msg.role === 'model' ? 'Gemini AI' : 'Та'}
                  </span>
                </div>
                <div className="leading-relaxed font-medium">
                  {msg.text}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-100 p-3 rounded-2xl shadow-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              <span className="text-[10px] font-bold text-gray-400 uppercase animate-pulse">Бичиж байна...</span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-100 bg-white">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Асуултаа энд бичнэ үү..."
            className="w-full pl-4 pr-12 py-3 bg-gray-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:hover:bg-blue-600 transition-all shadow-md shadow-blue-200"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-[9px] text-gray-400 text-center font-bold uppercase tracking-widest">
          Gemini 3 Flash • Бодит мэдээлэлд тулгуурласан
        </p>
      </div>
    </motion.div>
  );
}
