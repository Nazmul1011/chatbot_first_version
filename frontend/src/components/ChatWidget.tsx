"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Trash2, TrendingUp, ShieldCheck, Plus, Smile, Maximize2, MoreHorizontal, ArrowUp } from "lucide-react";
import { clsx } from "clsx";
import ReactMarkdown from 'react-markdown';
import { sendChatMessage, getMarketingAgents } from "@/lib/api";

type Message = {
  role: "bot" | "user";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [showPrivacy, setShowPrivacy] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Management Detection
  const [marketingId, setMarketingId] = useState<string | null>(null);

  // Environment Isolation Logic
  const getEnvironment = () => {
    if (typeof window !== 'undefined' && window.top !== window) return 'live';
    return 'preview';
  };

  const getTenantKey = () => {
    const tenantId = localStorage.getItem('active_tenant_id') || 'default';
    const env = getEnvironment();
    return `chat_history_${env}_${tenantId}_master`;
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
       window.parent.postMessage({ type: isOpen ? 'CHAT_OPEN' : 'CHAT_CLOSE' }, '*');
    }
  }, [isOpen]);

  useEffect(() => {
    const initWidget = async () => {
      let mId = localStorage.getItem('active_marketing_id');
      try {
        const { data } = await getMarketingAgents();
        if (data && data.length > 0) {
          mId = data[0].public_api_key;
          localStorage.setItem('active_marketing_id', mId!);
          setMarketingId(mId);
        } else {
          localStorage.removeItem('active_marketing_id');
          setMarketingId(null);
        }
      } catch (e) { console.error("Agent validation failed", e); }
    };
    initWidget();
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem(getTenantKey());
    if (saved) {
      try { setMessages(JSON.parse(saved)); } catch (e) { setMessages([{ role: "bot", content: "Hello! I'm your AI assistant. How can I help you today?" }]); }
    } else {
      setMessages([{ role: "bot", content: "Hello! I'm your AI assistant. How can I help you today?" }]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(getTenantKey(), JSON.stringify(messages));
    }
  }, [messages]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

  const clearChat = () => {
    const initial = [{ role: "bot", content: "Chat reset. How can I help you now?" }] as Message[];
    setMessages(initial);
    localStorage.setItem(getTenantKey(), JSON.stringify(initial));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const { data } = await sendChatMessage(userMessage);
      setMessages((prev) => [...prev, { role: "bot", content: data.answer }]);
      if (data.session_id) setSessionId(data.session_id);
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "bot", content: "Agent connection timed out. Retrying..." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end outline-none select-none">
      {isOpen && (
        <div className="bg-[#F9F9F9] shadow-[0_20px_50px_rgba(0,0,0,0.1)] rounded-[2.5rem] border border-white/50 flex flex-col mb-4 transition-all duration-500 w-[420px] h-[720px] overflow-hidden transform origin-bottom-right">
          <div className="px-6 py-6 flex flex-col items-center relative">
             <div className="absolute top-4 left-6 flex gap-4">
                <button className="p-2 bg-white/40 hover:bg-white rounded-full transition-all text-slate-600 shadow-sm"><Maximize2 size={16} /></button>
             </div>
             <div className="absolute top-4 right-6 flex gap-2">
                <button className="p-2 bg-white/40 hover:bg-white rounded-full transition-all text-slate-600 shadow-sm"><MoreHorizontal size={18} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 bg-white/80 hover:bg-white rounded-full transition-all text-slate-600 shadow-sm"><X size={18} /></button>
             </div>
             <div className="bg-white px-6 py-4 rounded-[2rem] shadow-xl shadow-black/5 flex items-center gap-4 mt-8 border border-white">
                <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center relative shadow-inner">
                   <div className="absolute top-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                   <Sparkles size={20} className="text-pink-200" />
                </div>
                <div className="text-left">
                   <h1 className="font-bold text-lg text-slate-800 leading-none">AI Agent</h1>
                   <p className="text-[11px] font-medium text-slate-400 mt-0.5">Always active</p>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 py-4 space-y-6 custom-scrollbar scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={clsx("flex items-start gap-3", m.role === "bot" ? "justify-start" : "justify-end")}>
                {m.role === "bot" && (
                  <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center mt-1 shrink-0 shadow-sm">
                    <Sparkles size={14} className="text-pink-100" />
                  </div>
                )}
                <div className={clsx(
                  "max-w-[80%] px-5 py-4 rounded-[1.8rem] text-sm leading-relaxed shadow-sm font-medium",
                  m.role === "bot" ? "bg-white text-slate-700 border border-slate-100" : "bg-slate-800 text-white shadow-lg"
                )}>
                  {m.role === "bot" ? (
                    <div className="markdown-prose opacity-90">
                       <ReactMarkdown>
                         {m.content}
                       </ReactMarkdown>
                    </div>
                  ) : m.content}
                </div>
              </div>
            ))}
            {loading && (
               <div className="flex items-center gap-2 px-12 animate-pulse">
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.2s]" />
                  <div className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:0.4s]" />
               </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="px-6 pb-6 pt-0 flex flex-col gap-3">
             {showPrivacy && (
               <div className="bg-white/80 backdrop-blur-md border border-white p-5 rounded-[1.8rem] shadow-xl shadow-black/5 relative animate-in slide-in-from-bottom-4 duration-500">
                  <button onClick={() => setShowPrivacy(false)} className="absolute top-4 right-4 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-all"><X size={12} /></button>
                  <p className="text-[11px] leading-relaxed text-slate-500 font-medium pr-6">
                    By chatting here, you agree we and authorized partners may process, monitor, and record this chat. 
                    <span className="text-slate-800 font-bold ml-1 cursor-pointer underline">Privacy Policy</span>.
                  </p>
               </div>
             )}
             <form onSubmit={handleSend} className="relative flex items-center bg-white rounded-full p-2 shadow-xl shadow-black/5 border border-white">
                <button type="button" className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"><Plus size={20} /></button>
                <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Write a message..." className="flex-1 bg-transparent px-4 py-3 text-sm outline-none font-medium text-slate-700 placeholder:text-slate-400" />
                <button type="button" className="w-11 h-11 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-all"><Smile size={20} /></button>
                <button disabled={loading || !input.trim()} type="submit" className={clsx("w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg", input.trim() ? "bg-slate-200 text-slate-600 scale-100" : "bg-slate-50 text-slate-300 scale-90")}><ArrowUp size={20} strokeWidth={3} /></button>
             </form>
             <div className="text-center">
                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-none">Powered by <span className="text-slate-400">Agentic Platform</span></p>
             </div>
          </div>
        </div>
      )}
      <button onClick={() => setIsOpen(!isOpen)} className={clsx("w-20 h-20 rounded-full shadow-2xl flex items-center justify-center text-white transition-all duration-500 hover:scale-110 active:scale-95 group relative", isOpen ? "bg-slate-900 border-4 border-white" : "bg-blue-600 shadow-blue-500/30 overflow-hidden")}>
        {isOpen ? <X size={32} /> : (
          <div className="relative w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
             <MessageSquare size={32} />
             <div className="absolute top-5 right-5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
          </div>
        )}
      </button>
    </div>
  );
}
