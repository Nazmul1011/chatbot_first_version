"use client";
import React, { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User, Loader2, Sparkles, Trash2, TrendingUp, ShieldCheck } from "lucide-react";
import { clsx } from "clsx";
import { sendChatMessage, sendMarketingChat, getMarketingAgents } from "@/lib/api";

type Message = {
  role: "bot" | "user";
  content: string;
};

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'support' | 'sales'>('support');

  // RESIZE RADAR: Tell the parent website to expand/shrink the iframe
  useEffect(() => {
    if (typeof window !== 'undefined') {
       window.parent.postMessage({ type: isOpen ? 'CHAT_OPEN' : 'CHAT_CLOSE' }, '*');
    }
  }, [isOpen]);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Environment Isolation Logic
  const getEnvironment = () => {
    // If we are inside an iframe, it's a live customer! 🏙️
    if (typeof window !== 'undefined' && window.top !== window) return 'live';
    // If not, we are in the Dashboard testing! 🏢
    return 'preview';
  };

  const getTenantKey = (m: string) => {
    const tenantId = localStorage.getItem('active_tenant_id') || 'default';
    const env = getEnvironment();
    return `chat_history_${env}_${tenantId}_${m}`;
  };

  // Marketing Key Detection (Simulating embed behavior)
  const [marketingId, setMarketingId] = useState<string | null>(null);

  useEffect(() => {
    const initWidget = async () => {
      // 1. Check if ID is in storage or URL
      let mId = localStorage.getItem('active_marketing_id');

      // 2. Dashboard Intelligence: Validate agent exists, otherwise clear everything
      try {
        const { data } = await getMarketingAgents();
        if (data && data.length > 0) {
          mId = data[0].public_api_key;
          localStorage.setItem('active_marketing_id', mId!);
          setMarketingId(mId);
        } else {
          // TOTAL PURGE: No agents exist, so kill the ghost keys
          localStorage.removeItem('active_marketing_id');
          localStorage.removeItem('chat_history_sales');
          setMarketingId(null);
          setMode('support');
        }
      } catch (e) {
        console.error("Agent validation failed", e);
        // Fallback to what was in storage if API fails, or hide if nothing
        setMarketingId(localStorage.getItem('active_marketing_id'));
      }
    };

    initWidget();
  }, []);

  // 1. Load messages — tenant-scoped so each company has its own history
  useEffect(() => {
    const storageKey = getTenantKey(mode);
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        setMessages([{ role: "bot", content: mode === 'support' ? "Hello! How can I help with support?" : "Hi! I'm your sales expert. Interested in our special offers?" }]);
      }
    } else {
      setMessages([{ role: "bot", content: mode === 'support' ? "Hello! How can I help with support?" : "Hi! I'm your sales expert. Interested in our special offers?" }]);
    }
  }, [mode]);

  // 2. Save messages — tenant-scoped
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(getTenantKey(mode), JSON.stringify(messages));
    }
  }, [messages, mode]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { if (isOpen) scrollToBottom(); }, [messages, isOpen]);

  const clearChat = () => {
    const initial = [{ role: "bot", content: mode === 'support' ? "Support chat reset." : "Sales chat reset." }] as Message[];
    setMessages(initial);
    localStorage.setItem(getTenantKey(mode), JSON.stringify(initial));
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      if (mode === 'support') {
        const { data } = await sendChatMessage(userMessage);
        setMessages((prev) => [...prev, { role: "bot", content: data.answer }]);
      } else {
        const { data } = await sendMarketingChat(marketingId!, userMessage, sessionId || undefined);
        setMessages((prev) => [...prev, { role: "bot", content: data.reply }]);
        if (data.session_id) setSessionId(data.session_id);
      }
    } catch (err: any) {
      setMessages((prev) => [...prev, { role: "bot", content: "AI link unstable. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end outline-none select-none">
      {/* Chat Window */}
      {isOpen && (
        <div className="bg-white shadow-2xl rounded-[2.5rem] border border-gray-100 flex flex-col mb-4 transition-all duration-500 w-[400px] h-[640px] overflow-hidden transform origin-bottom-right">

          {/* Hybrid Header */}
          <div className="bg-slate-900 px-8 py-6 flex flex-col gap-4 text-white relative">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/20 blur-3xl rounded-full" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className={clsx("w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-all", mode === 'support' ? "bg-blue-600" : "bg-emerald-500")}>
                  {mode === 'support' ? <ShieldCheck size={24} /> : <TrendingUp size={24} />}
                </div>
                <div>
                  <h3 className="font-black text-lg tracking-tight uppercase leading-none mb-1">{mode === 'support' ? "Support" : "Sales"}</h3>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none">{mode === 'support' ? "Help Center" : "Offer Hub"}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={clearChat} className="p-2 hover:bg-white/10 rounded-xl transition-all"><Trash2 size={16} /></button>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-xl transition-all"><X size={20} /></button>
              </div>
            </div>

            {/* THE HYBRID TOGGLE BRIDGE */}
            {marketingId && (
              <div className="bg-white/5 p-1 rounded-2xl flex relative z-10 border border-white/5 backdrop-blur-sm">
                <button onClick={() => setMode('support')} className={clsx("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center", mode === 'support' ? "bg-white text-slate-900 shadow-xl" : "text-slate-400 hover:text-white")}>SUPPORT</button>
                <button onClick={() => setMode('sales')} className={clsx("flex-1 py-2.5 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center", mode === 'sales' ? "bg-emerald-500 text-white shadow-xl" : "text-slate-400 hover:text-white")}>SALES</button>
              </div>
            )}
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-gray-50/50 custom-scrollbar scroll-smooth">
            {messages.map((m, i) => (
              <div key={i} className={clsx("flex items-start gap-4 animate-in slide-in-from-bottom-2 duration-300", m.role === "bot" ? "justify-start" : "justify-end")}>
                {m.role === "bot" && (
                  <div className={clsx("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-1 shadow-sm", mode === 'support' ? "bg-blue-100 text-blue-600" : "bg-emerald-100 text-emerald-600")}>
                    {mode === 'support' ? <Bot size={18} /> : <Sparkles size={18} />}
                  </div>
                )}
                <div className={clsx("max-w-[70%] px-5 py-4 rounded-[2rem] text-sm leading-relaxed shadow-sm font-medium", m.role === "bot" ? "bg-white text-gray-800 border" : "bg-slate-900 border border-slate-800 text-white")}>
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-3 animate-pulse">
                <Loader2 size={16} className="animate-spin text-blue-600" />
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Routing to {mode}...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Section */}
          <div className="p-8 bg-white border-t">
            <form onSubmit={handleSend} className="relative flex items-center gap-4">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Type a message..." className="flex-1 bg-slate-50 border border-slate-100 rounded-3xl px-8 py-5 text-sm outline-none focus:bg-white focus:border-blue-500 transition-all font-semibold" />
              <button disabled={loading || !input.trim()} type="submit" className={clsx("w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all", mode === 'support' ? "bg-blue-600 shadow-blue-200" : "bg-emerald-500 shadow-emerald-200")}>
                <Send size={20} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Launcher */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={clsx("w-20 h-20 rounded-[2.5rem] shadow-2xl flex items-center justify-center text-white transition-all duration-500 hover:scale-110 active:scale-95 group relative", isOpen ? "bg-slate-900" : "bg-blue-600 shadow-blue-600/30")}
      >
        {isOpen ? <X size={32} /> : (
          <div className="relative">
            <MessageSquare size={32} />
            {marketingId && <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-4 border-blue-600 animate-pulse" />}
          </div>
        )}
      </button>
    </div>
  );
}
